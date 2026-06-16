import { calculateUtilizationPct } from './utilization';
import type { AssetMetricContribution, FleetRollupTotals } from './types';

function emptyRollup(): FleetRollupTotals {
  return {
    co2Kg: 0,
    fuelLiters: 0,
    idleMinutes: 0,
    utilizationPct: 0,
    assetCount: 0,
  };
}

/** Rolls up additive metrics and recomputes fleet utilization from hour totals. */
export function rollupFleetTotals(
  contributions: AssetMetricContribution[],
): FleetRollupTotals {
  if (contributions.length === 0) {
    return emptyRollup();
  }

  const co2Kg = contributions.reduce((sum, item) => sum + item.co2Kg, 0);
  const fuelLiters = contributions.reduce(
    (sum, item) => sum + item.fuelLiters,
    0,
  );
  const idleMinutes = contributions.reduce(
    (sum, item) => sum + item.idleMinutes,
    0,
  );
  const activeEngineHours = contributions.reduce(
    (sum, item) => sum + item.activeEngineHours,
    0,
  );
  const availableHours = contributions.reduce(
    (sum, item) => sum + item.availableHours,
    0,
  );

  return {
    co2Kg,
    fuelLiters,
    idleMinutes,
    utilizationPct: calculateUtilizationPct(
      activeEngineHours,
      availableHours,
    ),
    assetCount: contributions.length,
  };
}

function groupBy(
  items: AssetMetricContribution[],
  keyFn: (item: AssetMetricContribution) => string,
): Map<string, FleetRollupTotals> {
  const groups = new Map<string, AssetMetricContribution[]>();

  for (const item of items) {
    const key = keyFn(item);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return new Map(
    [...groups.entries()].map(([key, groupItems]) => [
      key,
      rollupFleetTotals(groupItems),
    ]),
  );
}

/** Fleet rollups grouped by siteId. */
export function rollupBySite(
  contributions: AssetMetricContribution[],
): Map<string, FleetRollupTotals> {
  return groupBy(contributions, (item) => item.siteId);
}

/** Fleet rollups grouped by assetClass. */
export function rollupByAssetClass(
  contributions: AssetMetricContribution[],
): Map<string, FleetRollupTotals> {
  return groupBy(contributions, (item) => item.assetClass);
}
