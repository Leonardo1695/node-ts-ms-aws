import { randomUUID } from 'node:crypto';
import type { _Record } from '@aws-sdk/client-kinesis';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createKinesisClient,
  InMemoryShardCheckpointStore,
  KinesisConsumer,
  KinesisProducer,
} from '@verdiron/messaging';
import { InMemoryEventIdempotencyStore } from './event-idempotency.store';
import { TelemetryRecordProcessor } from './telemetry-record.processor';

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

describeIntegration('processing kinesis integration', () => {
  jest.setTimeout(120_000);

  beforeAll(() => {
    applyEnv(validEnv);
  });

  afterAll(() => {
    clearEnv(Object.keys(validEnv));
  });

  it('consumes produced telemetry and dedupes replays by eventId', async () => {
    const event: TelemetryEvent = {
      eventId: randomUUID(),
      deviceId: 'dev-1',
      assetId: `asset-consumer-${randomUUID()}`,
      ts: '2026-06-15T12:00:00.000Z',
      lat: 45.5,
      lon: -73.5,
      speedKph: 0,
      engineOn: true,
      fuelLevelPct: 50,
      fuelRateLph: 4,
      engineHours: 100,
      odometerKm: 1000,
      rpm: 900,
    };

    const client = createKinesisClient({
      AWS_REGION: validEnv['AWS_REGION']!,
      AWS_ENDPOINT_URL: validEnv['AWS_ENDPOINT_URL'],
      AWS_ACCESS_KEY_ID: validEnv['AWS_ACCESS_KEY_ID']!,
      AWS_SECRET_ACCESS_KEY: validEnv['AWS_SECRET_ACCESS_KEY']!,
    });
    const producer = new KinesisProducer({
      client,
      streamName: validEnv['KINESIS_STREAM_NAME']!,
    });
    const checkpointStore = new InMemoryShardCheckpointStore();
    const consumer = new KinesisConsumer({
      client,
      streamName: validEnv['KINESIS_STREAM_NAME']!,
      shardIteratorType: 'TRIM_HORIZON',
      checkpointStore,
    });
    const idempotencyStore = new InMemoryEventIdempotencyStore();
    const handled: TelemetryEvent[] = [];
    let capturedRecords: _Record[] = [];
    const processor = new TelemetryRecordProcessor({
      idempotencyStore,
      onEvent: async (telemetryEvent) => {
        handled.push(telemetryEvent);
      },
    });

    await producer.putEvent(event);

    let found = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await consumer.pollOnce(async (records) => {
        capturedRecords = records;
        const result = await processor.processRecords(records);

        if (result.processed > 0) {
          found = true;
        }
      });

      if (found) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(found).toBe(true);
    expect(handled).toHaveLength(1);
    expect(handled[0]?.eventId).toBe(event.eventId);

    const replay = await processor.processRecords(capturedRecords);
    expect(replay).toEqual({
      processed: 0,
      skippedDuplicates: capturedRecords.length,
      invalid: 0,
    });
    expect(handled).toHaveLength(1);
    expect(idempotencyStore.count()).toBe(1);

    await client.destroy();
  });
});
