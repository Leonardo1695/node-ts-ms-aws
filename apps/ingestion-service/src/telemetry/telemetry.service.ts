import { Injectable } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { TelemetryBatch, TelemetryEvent } from '@verdiron/domain';
import { KinesisProducer } from '@verdiron/messaging';
import { TelemetryRawArchive } from '@verdiron/persistence';

export type TelemetryIntakePayload = TelemetryEvent | TelemetryBatch;

export interface TelemetryAcceptedResult {
  accepted: number;
  eventIds: string[];
}

const tracer = trace.getTracer('ingestion-service');

@Injectable()
export class TelemetryService {
  constructor(
    private readonly kinesisProducer: KinesisProducer,
    private readonly telemetryRawArchive: TelemetryRawArchive,
  ) {}

  async accept(payload: TelemetryIntakePayload): Promise<TelemetryAcceptedResult> {
    return tracer.startActiveSpan('telemetry.accept', async (span) => {
      try {
        const events = Array.isArray(payload) ? payload : [payload];
        span.setAttribute('telemetry.event_count', events.length);

        await tracer.startActiveSpan('telemetry.produce', async (produceSpan) => {
          try {
            produceSpan.setAttribute('telemetry.event_count', events.length);
            await Promise.all([
              this.kinesisProducer.putEvents(events),
              this.telemetryRawArchive.archiveEvents(events),
            ]);
          } catch (error) {
            produceSpan.recordException(error as Error);
            produceSpan.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
          } finally {
            produceSpan.end();
          }
        });

        return {
          accepted: events.length,
          eventIds: events.map((event) => event.eventId),
        };
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
