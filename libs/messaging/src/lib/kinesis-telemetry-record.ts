import type { TelemetryEvent } from '@verdiron/domain';

export interface KinesisTelemetryRecord {
  event: TelemetryEvent;
  traceContext?: Record<string, string>;
}

export function encodeKinesisTelemetryRecord(
  event: TelemetryEvent,
  traceContext?: Record<string, string>,
): string {
  const payload: KinesisTelemetryRecord = { event };

  if (traceContext && Object.keys(traceContext).length > 0) {
    payload.traceContext = traceContext;
  }

  return JSON.stringify(payload);
}

export function decodeKinesisTelemetryRecord(payload: string): {
  event: unknown;
  traceContext?: Record<string, string>;
} {
  const parsed: unknown = JSON.parse(payload);

  if (
    parsed &&
    typeof parsed === 'object' &&
    'event' in parsed &&
    (parsed as KinesisTelemetryRecord).event
  ) {
    const record = parsed as KinesisTelemetryRecord;
    return {
      event: record.event,
      traceContext: record.traceContext,
    };
  }

  return { event: parsed };
}
