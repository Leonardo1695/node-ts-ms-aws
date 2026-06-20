import type { IdlingReportQuery } from '@verdiron/domain';
import type { DataSource } from 'typeorm';
import { IdlingReportRepository } from './idling-report.repository';

describe('IdlingReportRepository', () => {
  it('maps ranked SQL rows into an ordered idling report', async () => {
    const query: IdlingReportQuery = {
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      limit: 10,
    };

    const dataSource = {
      query: jest.fn().mockResolvedValue([
        {
          asset_id: 'asset-exc-101',
          asset_name: 'EX-101 Tiger',
          site_id: 'site-north-yard',
          idle_minutes: '120.00',
          idle_fuel_liters: '96.0000',
          idle_co2_kg: '257.2800',
          idle_co2_rank: '1',
          row_num: '1',
        },
        {
          asset_id: 'asset-loader-201',
          asset_name: 'LD-201',
          site_id: 'site-north-yard',
          idle_minutes: '30.00',
          idle_fuel_liters: '15.0000',
          idle_co2_kg: '40.2000',
          idle_co2_rank: '2',
          row_num: '2',
        },
      ]),
    } as unknown as DataSource;

    const repository = new IdlingReportRepository(dataSource);
    const report = await repository.queryIdlingReport(query);

    expect(report.from).toBe(query.from);
    expect(report.entries).toHaveLength(2);
    expect(report.entries[0]?.assetId).toBe('asset-exc-101');
    expect(report.entries[0]?.idleCo2Kg).toBe(257.28);
    expect(report.entries[1]?.idleFuelLiters).toBe(15);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('RANK() OVER'),
      [query.from, query.to, null, query.limit],
    );
  });

  it('returns an empty report when no assets idled in the window', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as DataSource;

    const repository = new IdlingReportRepository(dataSource);
    const report = await repository.queryIdlingReport({
      siteId: 'site-a',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      limit: 5,
    });

    expect(report.entries).toEqual([]);
  });
});
