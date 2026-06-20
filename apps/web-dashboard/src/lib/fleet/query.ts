import type { FleetMetricsQuery } from '../api';
import {
  isoToDateInput,
  toUtcDayEnd,
  toUtcDayStart,
} from './chart-data';

export interface FleetFiltersValue {
  siteId: string;
  fromDate: string;
  toDate: string;
  bucket: FleetMetricsQuery['bucket'];
}

export function createDefaultFleetFilters(
  range = defaultRangeDates(),
): FleetFiltersValue {
  return {
    siteId: '',
    fromDate: range.fromDate,
    toDate: range.toDate,
    bucket: 'day',
  };
}

export function defaultRangeDates(days = 7): {
  fromDate: string;
  toDate: string;
} {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));

  return {
    fromDate: isoToDateInput(from.toISOString()),
    toDate: isoToDateInput(to.toISOString()),
  };
}

export function fleetFiltersToQuery(
  filters: FleetFiltersValue,
): FleetMetricsQuery {
  return {
    siteId: filters.siteId || undefined,
    from: toUtcDayStart(filters.fromDate),
    to: toUtcDayEnd(filters.toDate),
    bucket: filters.bucket,
  };
}
