import { Test } from '@nestjs/testing';
import type { IdlingReport } from '@verdiron/domain';
import { IdlingReportRepository } from '@verdiron/persistence';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { IDLING_REPORT_UNITS, ReportsService } from './reports.service';

describe('ReportsService', () => {
  const sampleReport: IdlingReport = {
    from: '2026-06-15T00:00:00.000Z',
    to: '2026-06-16T00:00:00.000Z',
    entries: [
      {
        assetId: 'asset-exc-101',
        assetName: 'EX-101 Tiger',
        siteId: 'site-north-yard',
        idleMinutes: 120,
        idleFuelLiters: 96,
        idleCo2Kg: 257.28,
      },
    ],
  };

  it('wraps ranked repository output in { data, meta } with units', async () => {
    const queryIdlingReport = jest.fn().mockResolvedValue(sampleReport);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: IdlingReportRepository,
          useValue: { queryIdlingReport },
        },
        MetricsReadCache,
      ],
    }).compile();

    const service = moduleRef.get(ReportsService);
    const response = await service.getIdlingReport({
      siteId: 'site-north-yard',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      limit: 10,
    });

    expect(queryIdlingReport).toHaveBeenCalledWith({
      siteId: 'site-north-yard',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      limit: 10,
    });
    expect(response.data).toEqual(sampleReport);
    expect(response.meta).toEqual({
      units: IDLING_REPORT_UNITS,
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      siteId: 'site-north-yard',
      limit: 10,
      entryCount: 1,
      cacheVersion: 0,
    });
  });
});
