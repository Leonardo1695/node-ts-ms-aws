import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FleetMetricsRepository, TelemetryHotStore, AssetMetricsRepository, IdlingReportRepository } from '@verdiron/persistence';
import { EtlRunPublisher, SimControlPublisher } from '@verdiron/messaging';
import { HealthService } from '../health/health.service';
import { AppModule } from './app.module';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

const validEnv: Record<string, string> = {
  NODE_ENV: 'test',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'verdiron',
  POSTGRES_PASSWORD: 'verdiron',
  POSTGRES_DB: 'verdiron',
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

const apiKeyHeader = { 'x-api-key': validEnv['API_KEY']! };

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

describe('ApiService', () => {
  let app: INestApplication;

  const fleetMetricsResponse = {
    data: {
      siteId: 'site-north-yard',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      bucket: 'hour',
      totals: {
        co2Kg: 10,
        fuelLiters: 4,
        idleMinutes: 15,
        utilizationPct: 50,
      },
      buckets: [],
    },
    meta: {
      units: {
        co2Kg: 'kg',
        fuelLiters: 'L',
        idleMinutes: 'min',
        utilizationPct: '%',
      },
      bucket: 'hour',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      siteId: 'site-north-yard',
      bucketCount: 0,
    },
  };

  const assetMetricsResponse = {
    assetId: 'asset-exc-101',
    from: '2026-06-15T00:00:00.000Z',
    to: '2026-06-16T00:00:00.000Z',
    co2Kg: 12.5,
    fuelLiters: 5,
    idleMinutes: 30,
    idlePct: 25,
    utilizationPct: 50,
    fuelEfficiencyLph: 2.5,
  };

  const idlingReportResponse = {
    from: '2026-06-15T00:00:00.000Z',
    to: '2026-06-16T00:00:00.000Z',
    entries: [
      {
        assetId: 'asset-exc-101',
        assetName: 'EX-101 Tiger',
        siteId: 'site-north-yard',
        idleMinutes: 120,
        idleFuelLiters: 96,
        idleCo2Kg: 257.28,
      },
    ],
  };

  beforeAll(async () => {
    applyEnv(validEnv);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VERDIRON_DATA_SOURCE)
      .useValue({
        isInitialized: true,
        destroy: jest.fn().mockResolvedValue(undefined),
        query: jest.fn(),
      })
      .overrideProvider(FleetMetricsRepository)
      .useValue({
        queryFleetMetrics: jest.fn().mockResolvedValue(fleetMetricsResponse.data),
      })
      .overrideProvider(AssetMetricsRepository)
      .useValue({
        queryAssetMetrics: jest.fn().mockResolvedValue(assetMetricsResponse),
      })
      .overrideProvider(TelemetryHotStore)
      .useValue({
        queryRecentByAsset: jest.fn().mockResolvedValue([]),
      })
      .overrideProvider(IdlingReportRepository)
      .useValue({
        queryIdlingReport: jest.fn().mockResolvedValue(idlingReportResponse),
      })
      .overrideProvider(SimControlPublisher)
      .useValue({
        start: jest.fn(),
        stop: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(EtlRunPublisher)
      .useValue({
        run: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(HealthService)
      .useValue({
        checkReadiness: jest.fn().mockResolvedValue({
          status: 'ok',
          checks: {
            postgres: 'ok',
            rabbitmq: 'ok',
            dynamodb: 'ok',
          },
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    clearEnv(Object.keys(validEnv));
  });

  it('GET /health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /health/live returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /health/ready returns dependency checks', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.checks).toMatchObject({
      postgres: 'ok',
      rabbitmq: 'ok',
      dynamodb: 'ok',
    });
  });

  it('GET /api/v1/meta requires a valid API key', async () => {
    const unauthorized = await request(app.getHttpServer()).get('/api/v1/meta');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app.getHttpServer())
      .get('/api/v1/meta')
      .set(apiKeyHeader);

    expect(authorized.status).toBe(200);
    expect(authorized.body).toEqual({
      service: 'api-service',
      version: '1.0.0',
    });
  });

  it('GET /api/v1/fleet/metrics requires a valid API key', async () => {
    const unauthorized = await request(app.getHttpServer()).get(
      '/api/v1/fleet/metrics?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z',
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app.getHttpServer())
      .get(
        '/api/v1/fleet/metrics?siteId=site-north-yard&from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&bucket=hour',
      )
      .set(apiKeyHeader);

    expect(authorized.status).toBe(200);
    expect(authorized.body.data.totals.co2Kg).toBe(10);
    expect(authorized.body.meta.units.co2Kg).toBe('kg');
  });

  it('GET /api/v1/assets/:assetId/metrics requires a valid API key', async () => {
    const unauthorized = await request(app.getHttpServer()).get(
      '/api/v1/assets/asset-exc-101/metrics?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z',
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app.getHttpServer())
      .get(
        '/api/v1/assets/asset-exc-101/metrics?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z',
      )
      .set(apiKeyHeader);

    expect(authorized.status).toBe(200);
    expect(authorized.body.data.metrics.co2Kg).toBe(12.5);
    expect(authorized.body.meta.units.fuelEfficiencyLph).toBe('L/h');
    expect(authorized.body.data.recentTelemetry).toEqual([]);
  });

  it('GET /api/v1/reports/idling requires a valid API key', async () => {
    const unauthorized = await request(app.getHttpServer()).get(
      '/api/v1/reports/idling?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z',
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app.getHttpServer())
      .get(
        '/api/v1/reports/idling?from=2026-06-15T00:00:00.000Z&to=2026-06-16T00:00:00.000Z&limit=10',
      )
      .set(apiKeyHeader);

    expect(authorized.status).toBe(200);
    expect(authorized.body.data.entries[0].idleCo2Kg).toBe(257.28);
    expect(authorized.body.meta.units.idleFuelLiters).toBe('L');
  });

  it('POST /api/v1/sim/start and GET /api/v1/sim/status require a valid API key', async () => {
    const unauthorized = await request(app.getHttpServer())
      .post('/api/v1/sim/start')
      .send({ fleetSize: 4, emitRatePerSecond: 1 });
    expect(unauthorized.status).toBe(401);

    const start = await request(app.getHttpServer())
      .post('/api/v1/sim/start')
      .set(apiKeyHeader)
      .send({ fleetSize: 4, emitRatePerSecond: 1 });

    expect(start.status).toBe(202);
    expect(start.body.data.status.running).toBe(true);

    const status = await request(app.getHttpServer())
      .get('/api/v1/sim/status')
      .set(apiKeyHeader);

    expect(status.status).toBe(200);
    expect(status.body.data.running).toBe(true);
  });

  it('POST /api/v1/etl/run accepts commands with a valid API key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/etl/run')
      .set(apiKeyHeader)
      .send({});

    expect(response.status).toBe(202);
    expect(response.body.data.command).toBe('etl.run');
    expect(response.body.meta.accepted).toBe(true);
  });
});
