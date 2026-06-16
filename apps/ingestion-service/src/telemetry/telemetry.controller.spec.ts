import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { KinesisProducer } from '@verdiron/messaging';
import { TelemetryRawArchive } from '@verdiron/persistence';
import { AppModule } from '../app/app.module';
import {
  validTelemetryBatch,
  validTelemetryEvent,
} from './telemetry.fixtures';

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

describe('TelemetryController', () => {
  let app: INestApplication;
  const putEvents = jest.fn().mockResolvedValue(undefined);
  const archiveEvents = jest.fn().mockResolvedValue([]);

  beforeAll(async () => {
    applyEnv(validEnv);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KinesisProducer)
      .useValue({
        putEvents,
        putEvent: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(TelemetryRawArchive)
      .useValue({
        archiveEvents,
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    clearEnv(Object.keys(validEnv));
  });

  beforeEach(() => {
    putEvents.mockClear();
    archiveEvents.mockClear();
  });

  it('POST /api/v1/telemetry accepts a single event with 202', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send(validTelemetryEvent);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      accepted: 1,
      eventIds: [validTelemetryEvent.eventId],
    });
    expect(putEvents).toHaveBeenCalledWith([validTelemetryEvent]);
    expect(archiveEvents).toHaveBeenCalledWith([validTelemetryEvent]);
  });

  it('POST /api/v1/telemetry accepts a batch with 202', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send(validTelemetryBatch);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      accepted: 2,
      eventIds: validTelemetryBatch.map((event) => event.eventId),
    });
    expect(putEvents).toHaveBeenCalledWith(validTelemetryBatch);
    expect(archiveEvents).toHaveBeenCalledWith(validTelemetryBatch);
  });

  it('POST /api/v1/telemetry rejects malformed payloads with 400 details', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send({
        ...validTelemetryEvent,
        eventId: 'not-a-uuid',
        speedKph: -5,
      });

    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.any(Array) }),
      ]),
    );
  });

  it('POST /api/v1/telemetry rejects empty batch arrays', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send([]);

    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);
  });

  it('POST /api/v1/telemetry rejects requests without x-api-key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .send(validTelemetryEvent);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or missing API key');
    expect(putEvents).not.toHaveBeenCalled();
    expect(archiveEvents).not.toHaveBeenCalled();
  });

  it('POST /api/v1/telemetry rejects invalid x-api-key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set('x-api-key', 'wrong-key')
      .send(validTelemetryEvent);

    expect(response.status).toBe(401);
    expect(putEvents).not.toHaveBeenCalled();
  });
});
