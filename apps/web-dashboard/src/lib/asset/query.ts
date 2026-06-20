import type { AssetMetricsQuery } from '../api';
import { defaultRangeDates } from '../fleet/query';
import { toUtcDayEnd, toUtcDayStart } from '../fleet/chart-data';

export interface AssetFiltersValue {
  fromDate: string;
  toDate: string;
  recentLimit: number;
}

export function createDefaultAssetFilters(
  range = defaultRangeDates(),
): AssetFiltersValue {
  return {
    fromDate: range.fromDate,
    toDate: range.toDate,
    recentLimit: 20,
  };
}

export function assetFiltersToQuery(
  filters: AssetFiltersValue,
): AssetMetricsQuery {
  return {
    from: toUtcDayStart(filters.fromDate),
    to: toUtcDayEnd(filters.toDate),
    recentLimit: filters.recentLimit,
  };
}
