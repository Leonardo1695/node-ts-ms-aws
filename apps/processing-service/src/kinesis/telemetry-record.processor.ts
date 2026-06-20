import type { _Record } from '@aws-sdk/client-kinesis';
import {
  telemetryEventSchema,
  type TelemetryEvent,
} from '@verdiron/domain';
import { decodeKinesisTelemetryRecord } from '@verdiron/messaging';
import { startLinkedSpan } from '@verdiron/tracing';
import { InMemoryEventIdempotencyStore } from './event-idempotency.store';

const PROCESSING_TRACER = 'processing-service';

export type TelemetryEventHandler = (
  event: TelemetryEvent,
) => Promise<void> | void;

export interface TelemetryRecordProcessorOptions {
  idempotencyStore: InMemoryEventIdempotencyStore;
  onEvent: TelemetryEventHandler;
}

export interface TelemetryRecordProcessResult {
  processed: number;
  skippedDuplicates: number;
  invalid: number;
}

export class TelemetryRecordProcessor {
  constructor(private readonly options: TelemetryRecordProcessorOptions) {}

  async processRecords(
    records: _Record[],
  ): Promise<TelemetryRecordProcessResult> {
    let processed = 0;
    let skippedDuplicates = 0;
    let invalid = 0;

    for (const record of records) {
      const payload = Buffer.from(record.Data ?? []).toString('utf8');
      let parsedJson: unknown;
      let traceContext: Record<string, string> | undefined;

      try {
        const decoded = decodeKinesisTelemetryRecord(payload);
        parsedJson = decoded.event;
        traceContext = decoded.traceContext;
      } catch {
        invalid += 1;
        continue;
      }

      const parsed = telemetryEventSchema.safeParse(parsedJson);
      if (!parsed.success) {
        invalid += 1;
        continue;
      }

      if (this.options.idempotencyStore.has(parsed.data.eventId)) {
        skippedDuplicates += 1;
        continue;
      }

      await startLinkedSpan(
        PROCESSING_TRACER,
        'telemetry.consume',
        traceContext,
        async () => {
          await this.options.onEvent(parsed.data);
        },
        {
          'telemetry.event_id': parsed.data.eventId,
          'telemetry.asset_id': parsed.data.assetId,
        },
      );

      this.options.idempotencyStore.add(parsed.data.eventId);
      processed += 1;
    }

    return { processed, skippedDuplicates, invalid };
  }
}
