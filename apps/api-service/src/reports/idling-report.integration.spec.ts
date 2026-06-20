import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  CreateMetricRollupsMatview1740000000002,
  CreatePartitionedTelemetryEvents1740000000001,
  CreateSitesAndAssets1740000000000,
  MetricRollupRepository,
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  runMigrations,
} from '@verdiron/persistence';
import { AppModule } from '../app/app.module';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

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

describeIntegration('idling report integration', () => {
  jest.setTimeout(120_000);

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
      API_KEY: 'dev-api-key-change-me',
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
        ],
      }),
    );

    await runMigrations(bootstrapDataSource);

    await bootstrapDataSource.query(`
      INSERT INTO sites (site_id, name, region)
      VALUES ('site-a', 'North Yard', 'NA-East')
    `);
    await bootstrapDataSource.query(`
      INSERT INTO assets (
        asset_id, name, asset_type, asset_class, site_id, fuel_type, rated_power_kw
      ) VALUES
      ('asset-high-idle', 'High Idle', 'excavator', 'heavy', 'site-a', 'diesel', 250.00),
      ('asset-low-idle', 'Low Idle', 'loader', 'medium', 'site-a', 'diesel', 180.00)
    `);

    await bootstrapDataSource.query(
      `INSERT INTO telemetry_events (
         event_id, device_id, asset_id, ts,
         lat, lon, speed_kph, engine_on,
         fuel_level_pct, fuel_rate_lph, engine_hours, odometer_km, rpm
       ) VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13),
       ($14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26),
       ($27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39)`,
      [
        '550e8400-e29b-41d4-a716-446655440010',
        'dev-1',
        'asset-high-idle',
        '2026-06-15T12:00:00.000Z',
        45.5,
        -73.5,
        0,
        true,
        50,
        6,
        100,
        1000,
        900,
        '550e8400-e29b-41d4-a716-446655440011',
        'dev-1',
        'asset-high-idle',
        '2026-06-15T12:45:00.000Z',
        45.5,
        -73.5,
        0,
        true,
        48,
        4,
        100.75,
        1000,
        850,
        '550e8400-e29b-41d4-a716-446655440012',
        'dev-2',
        'asset-low-idle',
        '2026-06-15T12:00:00.000Z',
        45.5,
        -73.5,
        0,
        true,
        50,
        4,
        200,
        2000,
        800,
      ],
    );

    const rollupRepository = new MetricRollupRepository(bootstrapDataSource);
    await rollupRepository.refresh();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VERDIRON_DATA_SOURCE)
      .useValue(bootstrapDataSource)
      .compile();

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await destroyDataSource(bootstrapDataSource);
    await postgres?.stop();
    clearEnv(envKeys);
  });

  it('returns assets ranked by idle CO2 waste', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/api/v1/reports/idling?siteId=site-a&from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&limit=5',
      )
      .set('x-api-key', 'dev-api-key-change-me');

    expect(response.status).toBe(200);
    expect(response.body.meta.units.idleCo2Kg).toBe('kg');
    expect(response.body.data.entries.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data.entries[0].assetId).toBe('asset-high-idle');
    expect(response.body.data.entries[0].idleCo2Kg).toBeGreaterThan(
      response.body.data.entries[1].idleCo2Kg,
    );
  });
});
