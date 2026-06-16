import { Transport } from '@nestjs/microservices';
import type { KinesisClient } from '@aws-sdk/client-kinesis';
import type { TelemetryEvent } from '@verdiron/domain';
import { createAwsSdkClientConfig } from './aws-client-config';
import { KinesisProducer } from './kinesis-producer';
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
  });
});
