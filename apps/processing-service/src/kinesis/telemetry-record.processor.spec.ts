import type { _Record } from '@aws-sdk/client-kinesis';
import type { TelemetryEvent } from '@verdiron/domain';
import { InMemoryEventIdempotencyStore } from './event-idempotency.store';
import { TelemetryRecordProcessor } from './telemetry-record.processor';

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

function toRecord(event: TelemetryEvent): _Record {
  return {
    Data: Buffer.from(JSON.stringify(event)),
  };
}

describe('TelemetryRecordProcessor', () => {
  it('processes valid telemetry records once', async () => {
    const idempotencyStore = new InMemoryEventIdempotencyStore();
    const handled: TelemetryEvent[] = [];
    const processor = new TelemetryRecordProcessor({
      idempotencyStore,
      onEvent: async (event) => {
        handled.push(event);
      },
    });

    const result = await processor.processRecords([toRecord(sampleEvent)]);

    expect(result).toEqual({
      processed: 1,
      skippedDuplicates: 0,
      invalid: 0,
    });
    expect(handled).toEqual([sampleEvent]);
    expect(idempotencyStore.count()).toBe(1);
  });

  it('skips duplicate eventId replays without double-counting', async () => {
    const idempotencyStore = new InMemoryEventIdempotencyStore();
    let handleCount = 0;
    const processor = new TelemetryRecordProcessor({
      idempotencyStore,
      onEvent: async () => {
        handleCount += 1;
      },
    });
    const record = toRecord(sampleEvent);

    await processor.processRecords([record]);
    const replay = await processor.processRecords([record]);

    expect(replay).toEqual({
      processed: 0,
      skippedDuplicates: 1,
      invalid: 0,
    });
    expect(handleCount).toBe(1);
    expect(idempotencyStore.count()).toBe(1);
  });
});
