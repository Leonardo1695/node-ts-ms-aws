import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createKinesisClient,
  KinesisConsumer,
} from '@verdiron/messaging';
import { createS3Client } from '@verdiron/persistence';
import { AppModule } from '../app/app.module';
import { validTelemetryEvent } from './telemetry.fixtures';

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

describeIntegration('telemetry integration', () => {
  jest.setTimeout(120_000);

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

  it('publishes accepted telemetry events to the Kinesis stream', async () => {
    const event: TelemetryEvent = {
      ...validTelemetryEvent,
      eventId: randomUUID(),
      assetId: `asset-kinesis-${randomUUID()}`,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send(event);

    expect(response.status).toBe(202);
    expect(response.body.eventIds).toEqual([event.eventId]);

    const client = createKinesisClient({
      AWS_REGION: validEnv['AWS_REGION']!,
      AWS_ENDPOINT_URL: validEnv['AWS_ENDPOINT_URL'],
      AWS_ACCESS_KEY_ID: validEnv['AWS_ACCESS_KEY_ID']!,
      AWS_SECRET_ACCESS_KEY: validEnv['AWS_SECRET_ACCESS_KEY']!,
    });
    const consumer = new KinesisConsumer({
      client,
      streamName: validEnv['KINESIS_STREAM_NAME']!,
      shardIteratorType: 'TRIM_HORIZON',
    });

    let found = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await consumer.pollOnce((records) => {
        for (const record of records) {
          const payload = JSON.parse(
            Buffer.from(record.Data ?? []).toString('utf8'),
          ) as TelemetryEvent;

          if (payload.eventId === event.eventId) {
            found = true;
            expect(payload.assetId).toBe(event.assetId);
          }
        }
      });

      if (found) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    await client.destroy();
    expect(found).toBe(true);
  });

  it('archives accepted telemetry events to S3 with partitioned keys', async () => {
    const event: TelemetryEvent = {
      ...validTelemetryEvent,
      eventId: randomUUID(),
      assetId: `asset-s3-${randomUUID()}`,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/telemetry')
      .set(apiKeyHeader)
      .send(event);

    expect(response.status).toBe(202);
    expect(response.body.eventIds).toEqual([event.eventId]);

    const client = createS3Client({
      AWS_REGION: validEnv['AWS_REGION']!,
      AWS_ENDPOINT_URL: validEnv['AWS_ENDPOINT_URL'],
      AWS_ACCESS_KEY_ID: validEnv['AWS_ACCESS_KEY_ID']!,
      AWS_SECRET_ACCESS_KEY: validEnv['AWS_SECRET_ACCESS_KEY']!,
    });
    const prefix = `raw/dt=2026-06-15/asset=${event.assetId}/`;

    let objectKey = '';
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: validEnv['S3_BUCKET_NAME']!,
          Prefix: prefix,
        }),
      );

      objectKey =
        listed.Contents?.find((entry: { Key?: string }) => entry.Key?.endsWith('.jsonl'))?.Key ??
        '';

      if (objectKey) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(objectKey).toMatch(
      /^raw\/dt=2026-06-15\/asset=.+\/[0-9a-f-]+\.jsonl$/,
    );

    const object = await client.send(
      new GetObjectCommand({
        Bucket: validEnv['S3_BUCKET_NAME']!,
        Key: objectKey,
      }),
    );
    const body = await object.Body?.transformToString();
    const parsed = JSON.parse(body?.trim().split('\n')[0] ?? '{}') as TelemetryEvent;

    expect(parsed.eventId).toBe(event.eventId);
    expect(parsed.assetId).toBe(event.assetId);

    await client.destroy();
  });
});
