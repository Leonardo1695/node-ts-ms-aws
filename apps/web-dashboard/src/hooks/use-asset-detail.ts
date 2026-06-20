import { useQuery } from '@tanstack/react-query';
import {
  defaultMetricsRange,
  getAssetDetail,
  type AssetMetricsQuery,
} from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useDefaultAssetMetricsQuery(
  overrides: Partial<AssetMetricsQuery> = {},
): AssetMetricsQuery {
  const range = defaultMetricsRange();
  return {
    from: range.from,
    to: range.to,
    recentLimit: 10,
    ...overrides,
  };
}

export function useAssetDetail(assetId: string, query: AssetMetricsQuery) {
  return useQuery({
    queryKey: queryKeys.assetDetail(assetId, query),
    queryFn: () => getAssetDetail(assetId, query),
    enabled: Boolean(assetId),
  });
}
