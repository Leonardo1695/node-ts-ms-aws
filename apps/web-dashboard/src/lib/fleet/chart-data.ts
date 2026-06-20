import type { FleetMetricsBucket } from '@verdiron/domain';

export interface FleetTrendPoint {
  label: string;
  bucketStart: string;
  co2Kg: number;
  fuelLiters: number;
  idleMinutes: number;
  utilizationPct: number;
}

export function toUtcDayStart(dateValue: string): string {
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

export function toUtcDayEnd(dateValue: string): string {
  return new Date(`${dateValue}T23:59:59.999Z`).toISOString();
}

export function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function buildFleetTrendPoints(
  buckets: FleetMetricsBucket[],
): FleetTrendPoint[] {
  return buckets.map((bucket) => ({
    label: new Date(bucket.bucketStart).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    bucketStart: bucket.bucketStart,
    co2Kg: bucket.co2Kg,
    fuelLiters: bucket.fuelLiters,
    idleMinutes: bucket.idleMinutes,
    utilizationPct: bucket.utilizationPct,
  }));
}
