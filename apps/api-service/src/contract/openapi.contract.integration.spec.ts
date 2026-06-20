import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import jestOpenAPI from 'jest-openapi';
import request from 'supertest';
import {
  CreateMetricRollupsMatview1740000000002,
  CreatePartitionedTelemetryEvents1740000000001,
  CreateSitesAndAssets1740000000000,
  MetricRollupRepository,
  SeedReferenceData1740000000003,
  TelemetryHotStore,
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  runMigrations,
} from '@verdiron/persistence';
import { AppModule } from '../app/app.module';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';
import { enrichOpenApiDocument } from './openapi-document';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

const API_KEY = 'dev-api-key-change-me';

function applyEnv(values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

function clearEnv(keys: string[]): void {
  for (const key of keys) {
    delete process.env[key];
  }
}

describeIntegration('OpenAPI contract', () => {
  jest.setTimeout(180_000);

  let app: INestApplication;
  let postgres: PostgreSqlContainer;
  let bootstrapDataSource: Awaited<ReturnType<typeof createDataSource>>;
  const envKeys: string[] = [];

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:16-alpine').start();

    const env: Record<string, string> = {
      NODE_ENV: 'test',
      POSTGRES_HOST: postgres.getHost(),
      POSTGRES_PORT: String(postgres.getPort()),
      POSTGRES_USER: postgres.getUsername(),
      POSTGRES_PASSWORD: postgres.getPassword(),
      POSTGRES_DB: postgres.getDatabase(),
      RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
      AWS_REGION: 'us-east-1',
      AWS_ENDPOINT_URL: 'http://localhost:4566',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      KINESIS_STREAM_NAME: 'telemetry',
      S3_BUCKET_NAME: 'verdiron-raw',
      DYNAMODB_TABLE_NAME: 'telemetry-hot',
      API_KEY,
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
      OTEL_SERVICE_NAME: 'api-service',
    };

    applyEnv(env);
    envKeys.push(...Object.keys(env));

    bootstrapDataSource = await createDataSource(
      createTypeOrmDataSourceOptions({
        env: {
          POSTGRES_HOST: env['POSTGRES_HOST']!,
          POSTGRES_PORT: Number(env['POSTGRES_PORT']),
          POSTGRES_USER: env['POSTGRES_USER']!,
          POSTGRES_PASSWORD: env['POSTGRES_PASSWORD']!,
          POSTGRES_DB: env['POSTGRES_DB']!,
        },
        entities: persistenceEntities,
        migrations: [
          CreateSitesAndAssets1740000000000,
          CreatePartitionedTelemetryEvents1740000000001,
          CreateMetricRollupsMatview1740000000002,
          SeedReferenceData1740000000003,
        ],
      }),
    );

    await runMigrations(bootstrapDataSource);

    await bootstrapDataSource.query(
      `INSERT INTO telemetry_events (
         event_id, device_id, asset_id, ts,
         lat, lon, speed_kph, engine_on,
         fuel_level_pct, fuel_rate_lph, engine_hours, odometer_km, rpm
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        '550e8400-e29b-41d4-a716-446655440020',
        'dev-contract',
        'asset-exc-101',
        '2026-06-15T12:00:00.000Z',
        45.5,
        -73.5,
        0,
        true,
        50,
        5,
        100,
        1000,
        900,
      ],
    );

    const rollupRepository = new MetricRollupRepository(bootstrapDataSource);
    await rollupRepository.refresh();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VERDIRON_DATA_SOURCE)
      .useValue(bootstrapDataSource)
      .overrideProvider(TelemetryHotStore)
      .useValue({
        putEvent: jest.fn(),
        queryRecentByAsset: jest.fn().mockResolvedValue([]),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Verdiron API Service')
      .setVersion('1.0.0')
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
      .build();

    jestOpenAPI(
      enrichOpenApiDocument(SwaggerModule.createDocument(app, swaggerConfig)),
    );
  });

  afterAll(async () => {
    await app?.close();
    await destroyDataSource(bootstrapDataSource);
    await postgres?.stop();
    clearEnv(envKeys);
  });

  it('GET /health/live satisfies the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer()).get('/health/live');

    expect(response.status).toEqual(200);
    expect(response).toSatisfyApiSpec();
  });

  it('GET /api/v1/meta satisfies the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/meta')
      .set('x-api-key', API_KEY);

    expect(response.status).toEqual(200);
    expect(response).toSatisfyApiSpec();
  });

  it('GET /api/v1/fleet/metrics satisfies the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/api/v1/fleet/metrics?siteId=site-north-yard&from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&bucket=hour',
      )
      .set('x-api-key', API_KEY);

    expect(response.status).toEqual(200);
    expect(response).toSatisfyApiSpec();
  });

  it('GET /api/v1/assets/:assetId/metrics satisfies the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/api/v1/assets/asset-exc-101/metrics?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z',
      )
      .set('x-api-key', API_KEY);

    expect(response.status).toEqual(200);
    expect(response).toSatisfyApiSpec();
  });

  it('GET /api/v1/reports/idling satisfies the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/api/v1/reports/idling?siteId=site-north-yard&from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&limit=10',
      )
      .set('x-api-key', API_KEY);

    expect(response.status).toEqual(200);
    expect(response).toSatisfyApiSpec();
  });
});
