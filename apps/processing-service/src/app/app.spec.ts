import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

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

describe('ProcessingService', () => {
  let app: INestApplication;

  beforeAll(async () => {
    applyEnv(validEnv);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('GET /health/ready returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
