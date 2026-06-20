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
import { MetricsUpdatedPublisher } from '@verdiron/messaging';
import { AppModule } from './app.module';
import { KinesisConsumerLoopService } from '../kinesis/kinesis-consumer-loop.service';
import { MetricRollupRefreshService } from '../metrics/metric-rollup-refresh.service';
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
  OTEL_SERVICE_NAME: 'processing-service',
};

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

describeIntegration('processing-service integration', () => {
  jest.setTimeout(120_000);

  let app: INestApplication;

  beforeAll(async () => {
    applyEnv(validEnv);

    startVerdironTracing(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: validEnv['OTEL_EXPORTER_OTLP_ENDPOINT']!,
        OTEL_SERVICE_NAME: 'processing-service',
      }),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VERDIRON_DATA_SOURCE)
      .useValue({
        isInitialized: true,
        destroy: jest.fn().mockResolvedValue(undefined),
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
        query: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(MetricsUpdatedPublisher)
      .useValue({
        connect: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn(),
      })
      .overrideProvider(MetricRollupRefreshService)
      .useValue({
        scheduleRefreshForTelemetry: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(KinesisConsumerLoopService)
      .useValue({
        onApplicationBootstrap: jest.fn(),
        onApplicationShutdown: jest.fn(),
        pollOnce: jest.fn().mockResolvedValue(0),
      })
      .compile();

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

  it('registers processing-service in Jaeger after /health', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);

    const tracer = trace.getTracer('processing-service-integration');
    await tracer.startActiveSpan('health-check-integration', (span) => {
      span.setAttribute('verdiron.endpoint', '/health');
      span.end();
    });

    await shutdownVerdironTracing();

    let found = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const jaegerResponse = await fetch('http://localhost:16686/api/services');
      const body = (await jaegerResponse.json()) as { data?: string[] };

      if (body.data?.includes('processing-service')) {
        found = true;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(found).toBe(true);
  });
});
