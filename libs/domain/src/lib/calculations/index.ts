import { calculateCo2Kg } from './co2';
import { sumFuelLitersFromIntervals } from './fuel';
import { sumIdleMinutesFromIntervals } from './idle';
import type { AssetMetricContribution, AssetMetricsInput } from './types';

/**
 * Derives per-asset sustainability metrics from intervalized telemetry.
 * Pure composition used by processing-service and unit tests.
 */
export function computeAssetMetricsFromIntervals(
  input: AssetMetricsInput,
): AssetMetricContribution {
  const fuelLiters = sumFuelLitersFromIntervals(input.intervals);
  const idleMinutes = sumIdleMinutesFromIntervals(input.intervals);
  const activeEngineHours = input.intervals.reduce(
    (total, interval) =>
      total +
      (interval.engineOn ? interval.durationMinutes / 60 : 0),
    0,
  );

  return {
    assetId: input.assetId,
    siteId: input.siteId,
    assetClass: input.assetClass,
    fuelType: input.fuelType,
    co2Kg: calculateCo2Kg(fuelLiters, input.fuelType),
    fuelLiters,
    idleMinutes,
    activeEngineHours,
    availableHours: input.availableHours,
  };
}

export {
  CO2_KG_PER_LITER,
  DEFAULT_IDLE_BURN_RATE_LPM,
  IDLE_BURN_RATE_LPM_BY_CLASS,
  IDLE_SPEED_THRESHOLD_KPH,
} from './constants';
export { calculateCo2Kg, getCo2FactorKgPerLiter } from './co2';
export {
  calculateFuelEfficiencyLph,
  calculateFuelEfficiencyLpkm,
} from './efficiency';
export {
  calculateFuelLitersFromRate,
  sumFuelLitersFromIntervals,
} from './fuel';
export {
  calculateIdleCo2Kg,
  calculateIdleFuelLiters,
  calculateIdleMinutesForInterval,
  getIdleBurnRateLpm,
  isIdle,
  sumIdleMinutesFromIntervals,
} from './idle';
export {
  rollupByAssetClass,
  rollupBySite,
  rollupFleetTotals,
} from './rollups';
export type {
  AssetMetricContribution,
  AssetMetricsInput,
  FleetRollupTotals,
  TelemetryInterval,
} from './types';
export { calculateUtilizationPct } from './utilization';
