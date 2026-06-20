import type { FleetMetricsQuery } from '@verdiron/domain';
import type { DataSource } from 'typeorm';
import { FleetMetricsRepository } from './fleet-metrics.repository';

describe('FleetMetricsRepository', () => {
  it('maps SQL rows into fleet metrics with trend window fields', async () => {
    const query: FleetMetricsQuery = {
      siteId: 'site-a',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      bucket: 'hour',
    };

    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            co2_kg: '10.5000',
            fuel_liters: '4.0000',
            idle_minutes: '15.00',
            utilization_pct: '50.00',
          },
        ])
        .mockResolvedValueOnce([
          {
            bucket_start: new Date('2026-06-15T12:00:00.000Z'),
            bucket_end: new Date('2026-06-15T13:00:00.000Z'),
            co2_kg: '10.5000',
            fuel_liters: '4.0000',
            idle_minutes: '15.00',
            utilization_pct: '50.00',
            co2_kg_running_total: '10.5000',
            co2_kg_moving_avg_3: '10.5000',
            fuel_liters_running_total: '4.0000',
            utilization_pct_moving_avg_3: '50.00',
          },
        ]),
    } as unknown as DataSource;

    const repository = new FleetMetricsRepository(dataSource);
    const result = await repository.queryFleetMetrics(query);

    expect(result.siteId).toBe('site-a');
    expect(result.bucket).toBe('hour');
    expect(result.totals).toEqual({
      co2Kg: 10.5,
      fuelLiters: 4,
      idleMinutes: 15,
      utilizationPct: 50,
    });
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]?.trends).toEqual({
      co2KgRunningTotal: 10.5,
      co2KgMovingAvg3: 10.5,
      fuelLitersRunningTotal: 4,
      utilizationPctMovingAvg3: 50,
    });
    expect(dataSource.query).toHaveBeenCalledTimes(2);
  });

  it('returns zero totals when no rows match', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            co2_kg: '0',
            fuel_liters: '0',
            idle_minutes: '0',
            utilization_pct: '0',
          },
        ])
        .mockResolvedValueOnce([]),
    } as unknown as DataSource;

    const repository = new FleetMetricsRepository(dataSource);
    const result = await repository.queryFleetMetrics({
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      bucket: 'day',
    });

    expect(result.totals.utilizationPct).toBe(0);
    expect(result.buckets).toEqual([]);
  });
});
