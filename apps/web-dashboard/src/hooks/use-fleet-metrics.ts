import { useQuery } from '@tanstack/react-query';
import {
  defaultMetricsRange,
  getFleetMetrics,
  type FleetMetricsQuery,
} from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useDefaultFleetMetricsQuery(
  overrides: Partial<FleetMetricsQuery> = {},
): FleetMetricsQuery {
  const range = defaultMetricsRange();
  return {
    from: range.from,
    to: range.to,
    bucket: 'day',
    ...overrides,
  };
}

export function useFleetMetrics(query: FleetMetricsQuery) {
  return useQuery({
    queryKey: queryKeys.fleetMetrics(query),
    queryFn: () => getFleetMetrics(query),
  });
}
