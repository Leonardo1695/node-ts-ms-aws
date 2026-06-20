import { randomUUID } from 'node:crypto';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { GenericContainer, Wait } from 'testcontainers';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  persistenceMigrations,
  runMigrations,
} from '@verdiron/persistence';
import { AppModule as IngestionAppModule } from '../../apps/ingestion-service/src/app/app.module';
import { AppModule as ProcessingAppModule } from '../../apps/processing-service/src/app/app.module';
import { AppModule as ApiAppModule } from '../../apps/api-service/src/app/app.module';
import { KinesisConsumerLoopService } from '../../apps/processing-service/src/kinesis/kinesis-consumer-loop.service';
import { MetricRollupRefreshService } from '../../apps/processing-service/src/metrics/metric-rollup-refresh.service';
import { bootstrapLocalstackResources } from './support/aws-bootstrap';
import {
  applyEnv,
  buildPipelineEnv,
  clearEnv,
} from './support/test-env';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('ingest → process → read pipeline', () => {
  jest.setTimeout(300_000);

  let envKeys: string[] = [];
  let postgres: PostgreSqlContainer;
  let rabbit: RabbitMQContainer;
  let localstack: Awaited<
    ReturnType<GenericContainer['start']>
  >;
  let ingestionApp: INestApplication;
  let processingApp: INestApplication;
  let apiApp: INestApplication;
  let migrationDataSource: Awaited<ReturnType<typeof createDataSource>>;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:16-alpine').start();
    rabbit = await new RabbitMQContainer('rabbitmq:3.13-management').start();
    localstack = await new GenericContainer('localstack/localstack:3.4')
      .withEnvironment({
        SERVICES: 'kinesis,s3,dynamodb',
        DEFAULT_REGION: 'us-east-1',
      })
      .withExposedPorts(4566)
      .withWaitStrategy(Wait.forLogMessage(/Ready\./))
      .start();

    const awsEndpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`;
    const env = buildPipelineEnv({
      postgresHost: postgres.getHost(),
      postgresPort: postgres.getPort(),
      postgresUser: postgres.getUsername(),
      postgresPassword: postgres.getPassword(),
      postgresDb: postgres.getDatabase(),
      rabbitmqUrl: rabbit.getAmqpUrl(),
      awsEndpointUrl: awsEndpoint,
    });

    envKeys = applyEnv(env);

    await bootstrapLocalstackResources({
      AWS_REGION: env['AWS_REGION']!,
      AWS_ENDPOINT_URL: awsEndpoint,
      AWS_ACCESS_KEY_ID: env['AWS_ACCESS_KEY_ID']!,
      AWS_SECRET_ACCESS_KEY: env['AWS_SECRET_ACCESS_KEY']!,
      KINESIS_STREAM_NAME: env['KINESIS_STREAM_NAME']!,
      S3_BUCKET_NAME: env['S3_BUCKET_NAME']!,
      DYNAMODB_TABLE_NAME: env['DYNAMODB_TABLE_NAME']!,
    });

    migrationDataSource = await createDataSource(
      createTypeOrmDataSourceOptions({
        env: {
          POSTGRES_HOST: env['POSTGRES_HOST']!,
          POSTGRES_PORT: Number(env['POSTGRES_PORT']),
          POSTGRES_USER: env['POSTGRES_USER']!,
          POSTGRES_PASSWORD: env['POSTGRES_PASSWORD']!,
          POSTGRES_DB: env['POSTGRES_DB']!,
        },
        entities: persistenceEntities,
        migrations: persistenceMigrations,
      }),
    );
    await runMigrations(migrationDataSource);
    await destroyDataSource(migrationDataSource);

    const processingModule = await Test.createTestingModule({
      imports: [ProcessingAppModule],
    }).compile();
    processingApp = processingModule.createNestApplication();
    processingApp.enableShutdownHooks();
    await processingApp.init();

    const ingestionModule = await Test.createTestingModule({
      imports: [IngestionAppModule],
    }).compile();
    ingestionApp = ingestionModule.createNestApplication();
    ingestionApp.enableShutdownHooks();
    await ingestionApp.init();

    const apiModule = await Test.createTestingModule({
      imports: [ApiAppModule],
    }).compile();
    apiApp = apiModule.createNestApplication();
    apiApp.enableShutdownHooks();
    await apiApp.init();
  });

  afterAll(async () => {
    await apiApp?.close();
    await ingestionApp?.close();
    await processingApp?.close();
    await localstack?.stop();
    await rabbit?.stop();
    await postgres?.stop();
    clearEnv(envKeys);
  });

  it('accepts telemetry, processes it, and exposes fleet metrics via the API', async () => {
    const event: TelemetryEvent = {
      eventId: randomUUID(),
      deviceId: 'dev-pipeline',
      assetId: 'asset-exc-101',
      ts: '2026-06-15T14:00:00.000Z',
      lat: 45.5,
      lon: -73.5,
      speedKph: 0,
      engineOn: true,
      fuelLevelPct: 55,
      fuelRateLph: 6,
      engineHours: 120,
      odometerKm: 1500,
      rpm: 850,
    };

    const ingestResponse = await request(ingestionApp.getHttpServer())
      .post('/api/v1/telemetry')
      .set('x-api-key', 'dev-api-key-change-me')
      .send(event);

    expect(ingestResponse.status).toBe(202);
    expect(ingestResponse.body.eventIds).toEqual([event.eventId]);

    const consumerLoop = processingApp.get(KinesisConsumerLoopService);
    const rollupRefresh = processingApp.get(MetricRollupRefreshService);

    let processed = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await consumerLoop.pollOnce();

      if (consumerLoop.processedEventCount > 0) {
        processed = true;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(processed).toBe(true);
    await rollupRefresh.flush();

    const readResponse = await request(apiApp.getHttpServer())
      .get(
        '/api/v1/fleet/metrics?siteId=site-north-yard&from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&bucket=hour',
      )
      .set('x-api-key', 'dev-api-key-change-me');

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data.totals.co2Kg).toBeGreaterThan(0);
    expect(readResponse.body.data.buckets.length).toBeGreaterThan(0);
  });
});
