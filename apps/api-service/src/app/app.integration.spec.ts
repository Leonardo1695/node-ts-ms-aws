import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { trace } from '@opentelemetry/api';
import {
  buildTracingOptions,
  resetVerdironTracingForTests,
  shutdownVerdironTracing,
  startVerdironTracing,
} from '@verdiron/tracing';
import { EtlRunPublisher, SimControlPublisher } from '@verdiron/messaging';
import { AppModule } from './app.module';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

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

describeIntegration('api-service integration', () => {
  jest.setTimeout(120_000);

  let app: INestApplication;

  beforeAll(async () => {
    applyEnv(validEnv);

    startVerdironTracing(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: validEnv['OTEL_EXPORTER_OTLP_ENDPOINT']!,
        OTEL_SERVICE_NAME: 'api-service',
      }),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
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
      .compile();

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app?.get(VERDIRON_DATA_SOURCE, { strict: false });
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await shutdownVerdironTracing();
    resetVerdironTracingForTests();
    clearEnv(Object.keys(validEnv));
  });

  it('returns readiness checks when dependencies are up', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('registers api-service in Jaeger after /health', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);

    const tracer = trace.getTracer('api-service-integration');
    await tracer.startActiveSpan('health-check-integration', (span) => {
      span.setAttribute('verdiron.endpoint', '/health');
      span.end();
    });

    await shutdownVerdironTracing();

    let found = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const jaegerResponse = await fetch('http://localhost:16686/api/services');
      const body = (await jaegerResponse.json()) as { data?: string[] };

      if (body.data?.includes('api-service')) {
        found = true;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(found).toBe(true);
  });

  it('serves GET /api/v1/meta when x-api-key is valid', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/meta')
      .set(apiKeyHeader);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ service: 'api-service' });
  });
});
