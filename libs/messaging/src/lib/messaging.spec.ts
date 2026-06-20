import { Transport } from '@nestjs/microservices';
import type { KinesisClient } from '@aws-sdk/client-kinesis';
import type { TelemetryEvent } from '@verdiron/domain';
import { createAwsSdkClientConfig } from './aws-client-config';
import { KinesisProducer } from './kinesis-producer';
import {
  decodeKinesisTelemetryRecord,
  encodeKinesisTelemetryRecord,
} from './kinesis-telemetry-record';
import {
  InMemoryShardCheckpointStore,
  KinesisConsumer,
} from './kinesis-consumer';
import {
  createRmqClientOptions,
  createRmqServerOptions,
  METRICS_UPDATED_QUEUE,
} from './rmq-options';

const sampleEvent: TelemetryEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  deviceId: 'dev-1',
  assetId: 'asset-1',
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

describe('messaging helpers', () => {
  it('builds AWS client config from env', () => {
    const config = createAwsSdkClientConfig({
      AWS_REGION: 'us-east-1',
      AWS_ENDPOINT_URL: 'http://localhost:4566',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
    });

    expect(config.region).toBe('us-east-1');
    expect(config.endpoint).toBe('http://localhost:4566');
  });

  it('creates RabbitMQ client and server options', () => {
    const url = 'amqp://guest:guest@localhost:5672';

    expect(createRmqClientOptions({ url })).toEqual({
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: METRICS_UPDATED_QUEUE,
        queueOptions: { durable: true },
      },
    });

    expect(createRmqServerOptions({ url, queue: 'custom.queue' })).toEqual({
      transport: Transport.RMQ,
      options: {
        urls: [url],
        queue: 'custom.queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });
  });

  it('batches Kinesis PutRecords with asset partition key', async () => {
    const send = jest.fn().mockResolvedValue({ FailedRecordCount: 0 });
    const client = { send } as unknown as KinesisClient;
    const producer = new KinesisProducer({
      client,
      streamName: 'telemetry',
      maxBatchSize: 2,
    });

    await producer.putEvents([sampleEvent, sampleEvent, sampleEvent]);

    expect(send).toHaveBeenCalledTimes(2);
    const firstCommand = send.mock.calls[0]?.[0] as {
      input: { Records: Array<{ PartitionKey: string }> };
    };
    expect(firstCommand.input.Records[0]?.PartitionKey).toBe('asset-1');

    const body = Buffer.from(
      (firstCommand.input.Records[0] as { Data: Uint8Array }).Data,
    ).toString('utf8');
    const decoded = decodeKinesisTelemetryRecord(body);
    expect(decoded.event).toMatchObject({ assetId: 'asset-1' });
  });

  it('round-trips Kinesis telemetry envelopes with optional trace context', () => {
    const payload = encodeKinesisTelemetryRecord(sampleEvent, {
      traceparent: '00-abc-def-01',
    });

    expect(decodeKinesisTelemetryRecord(payload)).toEqual({
      event: sampleEvent,
      traceContext: { traceparent: '00-abc-def-01' },
    });
    expect(decodeKinesisTelemetryRecord(JSON.stringify(sampleEvent))).toEqual({
      event: sampleEvent,
    });
  });

  it('advances shard iterators via checkpoint store between polls', async () => {
    const checkpointStore = new InMemoryShardCheckpointStore();
    const send = jest
      .fn()
      .mockResolvedValueOnce({ Shards: [{ ShardId: 'shard-0' }] })
      .mockResolvedValueOnce({ ShardIterator: 'iter-1' })
      .mockResolvedValueOnce({
        Records: [{ Data: Buffer.from('{"eventId":"1"}') }],
        NextShardIterator: 'iter-2',
      })
      .mockResolvedValueOnce({ Shards: [{ ShardId: 'shard-0' }] })
      .mockResolvedValueOnce({
        Records: [],
        NextShardIterator: 'iter-3',
      });
    const client = { send } as unknown as KinesisClient;
    const consumer = new KinesisConsumer({
      client,
      streamName: 'telemetry',
      checkpointStore,
    });
    const handler = jest.fn();

    await consumer.pollOnce(handler);
    await consumer.pollOnce(handler);

    expect(send).toHaveBeenCalledTimes(5);
    expect(
      (send.mock.calls[2]?.[0] as { input: { ShardIterator: string } }).input
        .ShardIterator,
    ).toBe('iter-1');
    expect(
      (send.mock.calls[4]?.[0] as { input: { ShardIterator: string } }).input
        .ShardIterator,
    ).toBe('iter-2');
    expect(checkpointStore.getIterator('shard-0')).toBe('iter-3');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
