import type { IdlingReportQuery } from '../api';
import { toUtcDayEnd, toUtcDayStart } from '../fleet/chart-data';
import { defaultRangeDates } from '../fleet/query';

export interface IdlingFiltersValue {
  siteId: string;
  fromDate: string;
  toDate: string;
  limit: number;
}

export function createDefaultIdlingFilters(
  range = defaultRangeDates(),
): IdlingFiltersValue {
  return {
    siteId: '',
    fromDate: range.fromDate,
    toDate: range.toDate,
    limit: 20,
  };
}

export function idlingFiltersToQuery(
  filters: IdlingFiltersValue,
): IdlingReportQuery {
  return {
    siteId: filters.siteId || undefined,
    from: toUtcDayStart(filters.fromDate),
    to: toUtcDayEnd(filters.toDate),
    limit: filters.limit,
  };
}
