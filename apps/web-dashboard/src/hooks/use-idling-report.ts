import { useQuery } from '@tanstack/react-query';
import {
  defaultMetricsRange,
  getIdlingReport,
  type IdlingReportQuery,
} from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useDefaultIdlingReportQuery(
  overrides: Partial<IdlingReportQuery> = {},
): IdlingReportQuery {
  const range = defaultMetricsRange();
  return {
    from: range.from,
    to: range.to,
    limit: 20,
    ...overrides,
  };
}

export function useIdlingReport(query: IdlingReportQuery) {
  return useQuery({
    queryKey: queryKeys.idlingReport(query),
    queryFn: () => getIdlingReport(query),
  });
}
