import {
  calculateCo2Kg,
  calculateFuelEfficiencyLph,
  calculateFuelEfficiencyLpkm,
  calculateFuelLitersFromRate,
  calculateIdleCo2Kg,
  calculateIdleFuelLiters,
  calculateIdleMinutesForInterval,
  calculateUtilizationPct,
  computeAssetMetricsFromIntervals,
  getCo2FactorKgPerLiter,
  getIdleBurnRateLpm,
  isIdle,
  rollupByAssetClass,
  rollupBySite,
  rollupFleetTotals,
  sumFuelLitersFromIntervals,
  sumIdleMinutesFromIntervals,
  type AssetMetricContribution,
} from './index';

describe('sustainability calculations', () => {
  describe('CO2', () => {
    it('uses diesel and gasoline factors', () => {
      expect(getCo2FactorKgPerLiter('diesel')).toBe(2.68);
      expect(getCo2FactorKgPerLiter('gasoline')).toBe(2.31);
      expect(calculateCo2Kg(10, 'diesel')).toBeCloseTo(26.8);
      expect(calculateCo2Kg(10, 'gasoline')).toBeCloseTo(23.1);
    });

    it('returns zero for non-positive fuel', () => {
      expect(calculateCo2Kg(0, 'diesel')).toBe(0);
      expect(calculateCo2Kg(-5, 'diesel')).toBe(0);
    });
  });

  describe('idle', () => {
    it('detects idle when engine is on and speed is below threshold', () => {
      expect(isIdle(true, 0)).toBe(true);
      expect(isIdle(true, 1.9)).toBe(true);
      expect(isIdle(true, 2)).toBe(false);
      expect(isIdle(false, 0)).toBe(false);
    });

    it('accumulates idle minutes only for idle intervals', () => {
      const intervals = [
        { durationMinutes: 10, engineOn: true, speedKph: 0, fuelRateLph: 4 },
        { durationMinutes: 5, engineOn: true, speedKph: 15, fuelRateLph: 12 },
        { durationMinutes: 3, engineOn: true, speedKph: 1, fuelRateLph: 3 },
      ];

      expect(sumIdleMinutesFromIntervals(intervals)).toBe(13);
      expect(calculateIdleMinutesForInterval(0, true, 0)).toBe(0);
    });

    it('estimates idle fuel and CO2 by asset class', () => {
      expect(getIdleBurnRateLpm('heavy')).toBe(0.8);
      expect(getIdleBurnRateLpm('medium')).toBe(0.5);
      expect(getIdleBurnRateLpm('light')).toBe(0.3);
      expect(getIdleBurnRateLpm('unknown')).toBe(0.5);
      expect(calculateIdleFuelLiters(10, 'heavy')).toBeCloseTo(8);
      expect(calculateIdleFuelLiters(0, 'heavy')).toBe(0);
      expect(calculateIdleCo2Kg(10, 'heavy', 'diesel')).toBeCloseTo(21.44);
    });

    it('returns zero idle minutes when interval is not idle', () => {
      expect(calculateIdleMinutesForInterval(15, true, 25)).toBe(0);
      expect(calculateIdleMinutesForInterval(15, false, 0)).toBe(0);
    });
  });

  describe('utilization and efficiency', () => {
    it('computes utilization percentage capped at 100', () => {
      expect(calculateUtilizationPct(4, 8)).toBe(50);
      expect(calculateUtilizationPct(10, 8)).toBe(100);
      expect(calculateUtilizationPct(0, 8)).toBe(0);
      expect(calculateUtilizationPct(4, 0)).toBe(0);
    });

    it('computes fuel efficiency metrics', () => {
      expect(calculateFuelEfficiencyLph(20, 4)).toBe(5);
      expect(calculateFuelEfficiencyLpkm(10, 50)).toBe(0.2);
      expect(calculateFuelEfficiencyLph(0, 4)).toBe(0);
      expect(calculateFuelEfficiencyLpkm(10, 0)).toBe(0);
    });
  });

  describe('fuel intervals', () => {
    it('sums fuel from engine-on intervals only', () => {
      const intervals = [
        { durationMinutes: 60, engineOn: true, speedKph: 20, fuelRateLph: 10 },
        { durationMinutes: 30, engineOn: false, speedKph: 0, fuelRateLph: 0 },
      ];

      expect(calculateFuelLitersFromRate(10, 1)).toBe(10);
      expect(sumFuelLitersFromIntervals(intervals)).toBe(10);
    });
  });

  describe('asset and fleet rollups', () => {
    const baseContribution = (
      overrides: Partial<AssetMetricContribution>,
    ): AssetMetricContribution => ({
      assetId: 'asset-1',
      siteId: 'site-a',
      assetClass: 'heavy',
      fuelType: 'diesel',
      co2Kg: 26.8,
      fuelLiters: 10,
      idleMinutes: 20,
      activeEngineHours: 4,
      availableHours: 8,
      ...overrides,
    });

    it('computes asset metrics from telemetry intervals', () => {
      const metrics = computeAssetMetricsFromIntervals({
        assetId: 'exc-01',
        siteId: 'site-mtl',
        assetClass: 'heavy',
        fuelType: 'diesel',
        availableHours: 10,
        intervals: [
          { durationMinutes: 60, engineOn: true, speedKph: 0, fuelRateLph: 8 },
          { durationMinutes: 60, engineOn: true, speedKph: 25, fuelRateLph: 16 },
        ],
      });

      expect(metrics.fuelLiters).toBe(24);
      expect(metrics.idleMinutes).toBe(60);
      expect(metrics.activeEngineHours).toBe(2);
      expect(metrics.co2Kg).toBeCloseTo(64.32);
    });

    it('rolls up fleet totals and grouped maps', () => {
      const contributions = [
        baseContribution({ assetId: 'a1', siteId: 'site-a', assetClass: 'heavy' }),
        baseContribution({
          assetId: 'a2',
          siteId: 'site-b',
          assetClass: 'light',
          co2Kg: 11.55,
          fuelLiters: 5,
          idleMinutes: 10,
          activeEngineHours: 2,
          availableHours: 8,
          fuelType: 'gasoline',
        }),
      ];

      const fleet = rollupFleetTotals(contributions);
      expect(fleet.co2Kg).toBeCloseTo(38.35);
      expect(fleet.fuelLiters).toBe(15);
      expect(fleet.idleMinutes).toBe(30);
      expect(fleet.utilizationPct).toBe(37.5);
      expect(fleet.assetCount).toBe(2);

      expect(rollupBySite(contributions).get('site-a')?.assetCount).toBe(1);
      expect(rollupByAssetClass(contributions).get('heavy')?.fuelLiters).toBe(
        10,
      );
    });

    it('returns empty rollup for no assets', () => {
      expect(rollupFleetTotals([])).toEqual({
        co2Kg: 0,
        fuelLiters: 0,
        idleMinutes: 0,
        utilizationPct: 0,
        assetCount: 0,
      });
    });
  });
});
