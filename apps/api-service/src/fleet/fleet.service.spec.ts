import { Test } from '@nestjs/testing';
import type { FleetMetrics } from '@verdiron/domain';
import { FleetMetricsRepository } from '@verdiron/persistence';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { FLEET_METRICS_UNITS, FleetService } from './fleet.service';

describe('FleetService', () => {
  const sampleMetrics: FleetMetrics = {
    siteId: 'site-north-yard',
    from: '2026-06-15T00:00:00.000Z',
    to: '2026-06-16T00:00:00.000Z',
    bucket: 'hour',
    totals: {
      co2Kg: 12.5,
      fuelLiters: 5,
      idleMinutes: 20,
      utilizationPct: 45,
    },
    buckets: [
      {
        bucketStart: '2026-06-15T12:00:00.000Z',
        bucketEnd: '2026-06-15T13:00:00.000Z',
        co2Kg: 12.5,
        fuelLiters: 5,
        idleMinutes: 20,
        utilizationPct: 45,
        trends: {
          co2KgRunningTotal: 12.5,
          co2KgMovingAvg3: 12.5,
          fuelLitersRunningTotal: 5,
          utilizationPctMovingAvg3: 45,
        },
      },
    ],
  };

  it('wraps repository output in { data, meta } with units', async () => {
    const queryFleetMetrics = jest.fn().mockResolvedValue(sampleMetrics);
    const moduleRef = await Test.createTestingModule({
      providers: [
        FleetService,
        {
          provide: FleetMetricsRepository,
          useValue: { queryFleetMetrics },
        },
        MetricsReadCache,
      ],
    }).compile();

    const service = moduleRef.get(FleetService);
    const response = await service.getMetrics({
      siteId: 'site-north-yard',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      bucket: 'hour',
    });

    expect(queryFleetMetrics).toHaveBeenCalledWith({
      siteId: 'site-north-yard',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      bucket: 'hour',
    });
    expect(response.data).toEqual(sampleMetrics);
    expect(response.meta).toEqual({
      units: FLEET_METRICS_UNITS,
      bucket: 'hour',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      siteId: 'site-north-yard',
      bucketCount: 1,
      cacheVersion: 0,
    });
  });
});
