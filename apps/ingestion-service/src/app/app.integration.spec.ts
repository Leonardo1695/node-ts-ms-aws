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
import { validTelemetryEvent } from '../telemetry/telemetry.fixtures';

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
  OTEL_SERVICE_NAME: 'ingestion-service',
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

describeIntegration('ingestion-service integration', () => {
  jest.setTimeout(120_000);

  let app: INestApplication;

  beforeAll(async () => {
    applyEnv(validEnv);

    startVerdironTracing(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: validEnv['OTEL_EXPORTER_OTLP_ENDPOINT']!,
        OTEL_SERVICE_NAME: 'ingestion-service',
      }),
    );

    const { AppModule } = await import('./app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await shutdownVerdironTracing();
    resetVerdironTracingForTests();
    clearEnv(Object.keys(validEnv));
  });

  it('registers ingestion-service in Jaeger after /health', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);

    const tracer = trace.getTracer('ingestion-service-integration');
    await tracer.startActiveSpan('health-check-integration', (span) => {
      span.setAttribute('verdiron.endpoint', '/health');
      span.end();
    });

    await shutdownVerdironTracing();

    let found = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const jaegerResponse = await fetch('http://localhost:16686/api/services');
      const body = (await jaegerResponse.json()) as { data?: string[] };

      if (body.data?.includes('ingestion-service')) {
        found = true;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(found).toBe(true);
  });

  it('exports telemetry intake spans to Jaeger after POST /api/v1/telemetry', async () => {
    resetVerdironTracingForTests();
    startVerdironTracing(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: validEnv['OTEL_EXPORTER_OTLP_ENDPOINT']!,
        OTEL_SERVICE_NAME: 'ingestion-service',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send(validTelemetryEvent);

    expect(response.status).toBe(202);

    await shutdownVerdironTracing();

    let foundAccept = false;
    let foundProduce = false;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const tracesResponse = await fetch(
        'http://localhost:16686/api/traces?service=ingestion-service&limit=20',
      );
      const body = (await tracesResponse.json()) as {
        data?: Array<{
          processes?: Record<string, { serviceName?: string }>;
          spans?: Array<{ operationName?: string }>;
        }>;
      };

      for (const traceEntry of body.data ?? []) {
        for (const span of traceEntry.spans ?? []) {
          if (span.operationName === 'telemetry.accept') {
            foundAccept = true;
          }
          if (span.operationName === 'telemetry.produce') {
            foundProduce = true;
          }
        }
      }

      if (foundAccept && foundProduce) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(foundAccept).toBe(true);
    expect(foundProduce).toBe(true);
  });
});
