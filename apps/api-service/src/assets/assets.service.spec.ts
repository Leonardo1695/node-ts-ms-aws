import { Test } from '@nestjs/testing';
import type { AssetDetail } from '@verdiron/domain';
import {
  AssetMetricsRepository,
  TelemetryHotStore,
} from '@verdiron/persistence';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { ASSET_METRICS_UNITS, AssetsService } from './assets.service';

describe('AssetsService', () => {
  const sampleDetail: AssetDetail = {
    metrics: {
      assetId: 'asset-exc-101',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      co2Kg: 12.5,
      fuelLiters: 5,
      idleMinutes: 30,
      idlePct: 25,
      utilizationPct: 50,
      fuelEfficiencyLph: 2.5,
    },
    recentTelemetry: [
      {
        eventId: '550e8400-e29b-41d4-a716-446655440011',
        deviceId: 'dev-1',
        assetId: 'asset-exc-101',
        ts: '2026-06-15T13:00:00.000Z',
        lat: 45.5,
        lon: -73.5,
        speedKph: 12,
        engineOn: true,
        fuelLevelPct: 50,
        fuelRateLph: 4,
        engineHours: 100,
        odometerKm: 1000,
        rpm: 900,
      },
    ],
  };

  it('combines matview metrics and DynamoDB recent telemetry in { data, meta }', async () => {
    const queryAssetMetrics = jest
      .fn()
      .mockResolvedValue(sampleDetail.metrics);
    const queryRecentByAsset = jest
      .fn()
      .mockResolvedValue(sampleDetail.recentTelemetry);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: AssetMetricsRepository,
          useValue: { queryAssetMetrics },
        },
        {
          provide: TelemetryHotStore,
          useValue: { queryRecentByAsset },
        },
        MetricsReadCache,
      ],
    }).compile();

    const service = moduleRef.get(AssetsService);
    const response = await service.getMetrics('asset-exc-101', {
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      recentLimit: 10,
    });

    expect(queryAssetMetrics).toHaveBeenCalledWith({
      assetId: 'asset-exc-101',
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      recentLimit: 10,
    });
    expect(queryRecentByAsset).toHaveBeenCalledWith('asset-exc-101', 10);
    expect(response.data).toEqual(sampleDetail);
    expect(response.meta).toEqual({
      units: ASSET_METRICS_UNITS,
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      assetId: 'asset-exc-101',
      recentTelemetryCount: 1,
      recentTelemetryLimit: 10,
      cacheVersion: 0,
    });
  });
});
