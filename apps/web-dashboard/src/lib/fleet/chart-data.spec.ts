import type { FleetMetricsBucket } from '@verdiron/domain';
import { describe, expect, it } from 'vitest';
import {
  buildFleetTrendPoints,
  isoToDateInput,
  toUtcDayEnd,
  toUtcDayStart,
} from './chart-data';
import {
  createDefaultFleetFilters,
  fleetFiltersToQuery,
} from './query';

describe('fleet chart data', () => {
  it('maps API buckets into chart points', () => {
    const buckets: FleetMetricsBucket[] = [
      {
        bucketStart: '2026-06-15T00:00:00.000Z',
        bucketEnd: '2026-06-16T00:00:00.000Z',
        co2Kg: 12,
        fuelLiters: 4.5,
        idleMinutes: 30,
        utilizationPct: 55,
        trends: {
          co2KgRunningTotal: 12,
          co2KgMovingAvg3: 12,
          fuelLitersRunningTotal: 4.5,
          utilizationPctMovingAvg3: 55,
        },
      },
    ];

    expect(buildFleetTrendPoints(buckets)).toEqual([
      expect.objectContaining({
        co2Kg: 12,
        fuelLiters: 4.5,
        utilizationPct: 55,
      }),
    ]);
  });
});

describe('fleet filters query', () => {
  it('converts date inputs into API query params', () => {
    const query = fleetFiltersToQuery({
      siteId: 'site-north-yard',
      fromDate: '2026-06-10',
      toDate: '2026-06-15',
      bucket: 'day',
    });

    expect(query.siteId).toBe('site-north-yard');
    expect(query.from).toBe(toUtcDayStart('2026-06-10'));
    expect(query.to).toBe(toUtcDayEnd('2026-06-15'));
    expect(query.bucket).toBe('day');
  });

  it('creates a default seven-day filter window', () => {
    const filters = createDefaultFleetFilters({
      fromDate: '2026-06-09',
      toDate: '2026-06-15',
    });

    expect(filters.fromDate).toBe('2026-06-09');
    expect(isoToDateInput(filters.toDate)).toBe('2026-06-15');
  });
});
