import { describe, expect, it } from 'vitest';
import { buildAssetHistoryPoints } from './chart-data';

describe('buildAssetHistoryPoints', () => {
  it('sorts events chronologically and maps chart fields', () => {
    const points = buildAssetHistoryPoints([
      {
        eventId: '00000000-0000-4000-8000-000000000002',
        deviceId: 'dev-1',
        assetId: 'asset-exc-101',
        ts: '2026-06-15T12:00:00.000Z',
        lat: 0,
        lon: 0,
        speedKph: 12,
        engineOn: true,
        fuelLevelPct: 80,
        fuelRateLph: 18.5,
        engineHours: 100,
        odometerKm: 1000,
        rpm: 1400,
      },
      {
        eventId: '00000000-0000-4000-8000-000000000001',
        deviceId: 'dev-1',
        assetId: 'asset-exc-101',
        ts: '2026-06-15T11:00:00.000Z',
        lat: 0,
        lon: 0,
        speedKph: 0,
        engineOn: true,
        fuelLevelPct: 82,
        fuelRateLph: 4.2,
        engineHours: 99,
        odometerKm: 999,
        rpm: 800,
      },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]?.rpm).toBe(800);
    expect(points[1]?.fuelRateLph).toBe(18.5);
    expect(points[1]?.speedKph).toBe(12);
  });

  it('returns an empty array when no events are provided', () => {
    expect(buildAssetHistoryPoints([])).toEqual([]);
  });
});
