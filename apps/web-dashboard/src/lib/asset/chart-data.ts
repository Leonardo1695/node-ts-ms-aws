import type { TelemetryEvent } from '@verdiron/domain';

export interface AssetHistoryPoint {
  label: string;
  ts: string;
  fuelRateLph: number;
  rpm: number;
  speedKph: number;
}

export function buildAssetHistoryPoints(
  events: TelemetryEvent[],
): AssetHistoryPoint[] {
  return [...events]
    .sort((left, right) => left.ts.localeCompare(right.ts))
    .map((event) => ({
      label: new Date(event.ts).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ts: event.ts,
      fuelRateLph: event.fuelRateLph,
      rpm: event.rpm,
      speedKph: event.speedKph,
    }));
}
