import type { DataSource } from 'typeorm';
import { AssetMetricsRepository } from './asset-metrics.repository';

describe('AssetMetricsRepository', () => {
  it('aggregates matview rows into per-asset metrics', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([
        {
          co2_kg: '12.5000',
          fuel_liters: '5.0000',
          idle_minutes: '30.00',
          active_engine_minutes: '60',
          bucket_count: '2',
        },
      ]),
    } as unknown as DataSource;

    const repository = new AssetMetricsRepository(dataSource);
    const result = await repository.queryAssetMetrics({
      assetId: 'asset-1',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      recentLimit: 10,
    });

    expect(result.assetId).toBe('asset-1');
    expect(result.co2Kg).toBe(12.5);
    expect(result.fuelLiters).toBe(5);
    expect(result.idleMinutes).toBe(30);
    expect(result.idlePct).toBe(50);
    expect(result.utilizationPct).toBe(50);
    expect(result.fuelEfficiencyLph).toBe(5);
  });

  it('returns zeroed metrics when no matview rows match', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([
        {
          co2_kg: '0',
          fuel_liters: '0',
          idle_minutes: '0',
          active_engine_minutes: '0',
          bucket_count: '0',
        },
      ]),
    } as unknown as DataSource;

    const repository = new AssetMetricsRepository(dataSource);
    const result = await repository.queryAssetMetrics({
      assetId: 'asset-missing',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      recentLimit: 5,
    });

    expect(result.co2Kg).toBe(0);
    expect(result.idlePct).toBe(0);
    expect(result.utilizationPct).toBe(0);
    expect(result.fuelEfficiencyLph).toBe(0);
  });
});
