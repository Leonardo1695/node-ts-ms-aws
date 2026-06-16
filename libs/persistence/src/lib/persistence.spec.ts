import type { S3Client } from '@aws-sdk/client-s3';
import type { TelemetryEvent } from '@verdiron/domain';
import { createTypeOrmDataSourceOptions } from './typeorm-data-source';
import { createAwsSdkClientConfig } from './aws-client-config';
import {
  buildTelemetryRawArchiveKey,
  groupTelemetryEventsByPartition,
  TelemetryRawArchive,
} from './telemetry-raw-archive';

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

describe('persistence helpers', () => {
  it('builds TypeORM postgres options from env', () => {
    const options = createTypeOrmDataSourceOptions({
      env: {
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'verdiron',
        POSTGRES_PASSWORD: 'verdiron',
        POSTGRES_DB: 'verdiron',
      },
      entities: [],
    });

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'verdiron',
      database: 'verdiron',
      synchronize: false,
    });
  });

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

  it('groups telemetry events by date and asset for S3 archive keys', () => {
    const partitions = groupTelemetryEventsByPartition([
      sampleEvent,
      { ...sampleEvent, eventId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
      {
        ...sampleEvent,
        eventId: '7ba7b810-9dad-11d1-80b4-00c04fd430c8',
        assetId: 'asset-2',
      },
    ]);

    expect(partitions).toHaveLength(2);
    expect(
      partitions.find((partition) => partition.assetId === 'asset-1')?.events,
    ).toHaveLength(2);
    expect(
      partitions.find((partition) => partition.assetId === 'asset-2')?.events,
    ).toHaveLength(1);
    expect(
      buildTelemetryRawArchiveKey('2026-06-15', 'asset-1', 'batch-1'),
    ).toBe('raw/dt=2026-06-15/asset=asset-1/batch-1.jsonl');
  });

  it('writes JSONL objects to S3 with partitioned keys', async () => {
    const send = jest.fn().mockResolvedValue({});
    const client = { send } as unknown as S3Client;
    const archive = new TelemetryRawArchive({
      client,
      bucketName: 'verdiron-raw',
    });

    await archive.archiveEvents([sampleEvent]);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]?.[0] as {
      input: { Bucket: string; Key: string; Body: string };
    };
    expect(command.input.Bucket).toBe('verdiron-raw');
    expect(command.input.Key).toMatch(
      /^raw\/dt=2026-06-15\/asset=asset-1\/[0-9a-f-]+\.jsonl$/,
    );
    expect(command.input.Body).toContain('"assetId":"asset-1"');
  });
});
