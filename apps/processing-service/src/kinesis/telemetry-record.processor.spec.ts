import type { _Record } from '@aws-sdk/client-kinesis';
import { propagation, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  decodeKinesisTelemetryRecord,
  encodeKinesisTelemetryRecord,
} from '@verdiron/messaging';
import { injectActiveTraceCarrier } from '@verdiron/tracing';
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

function toEnvelopeRecord(
  event: TelemetryEvent,
  traceContext?: Record<string, string>,
): _Record {
  return {
    Data: Buffer.from(encodeKinesisTelemetryRecord(event, traceContext)),
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

  it('links telemetry.consume to the producer trace context from Kinesis', async () => {
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());

    const exporter = new InMemorySpanExporter();
    const provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    provider.register();

    const idempotencyStore = new InMemoryEventIdempotencyStore();
    const processor = new TelemetryRecordProcessor({
      idempotencyStore,
      onEvent: async () => undefined,
    });

    await trace.getTracer('ingestion-service').startActiveSpan(
      'telemetry.produce',
      async (parentSpan) => {
        const carrier = injectActiveTraceCarrier();
        await processor.processRecords([
          toEnvelopeRecord(sampleEvent, carrier),
        ]);
        parentSpan.end();
      },
    );

    await provider.shutdown();

    const spans = exporter.getFinishedSpans();
    const produceSpan = spans.find((span) => span.name === 'telemetry.produce');
    const consumeSpan = spans.find((span) => span.name === 'telemetry.consume');
    expect(consumeSpan?.spanContext().traceId).toBe(
      produceSpan?.spanContext().traceId,
    );
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
