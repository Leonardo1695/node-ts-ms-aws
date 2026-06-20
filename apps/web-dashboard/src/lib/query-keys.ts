import type {
  AssetMetricsQuery,
  FleetMetricsQuery,
  IdlingReportQuery,
} from './api/types';

export const queryKeys = {
  fleetMetrics: (query: FleetMetricsQuery) =>
    ['fleet-metrics', query] as const,
  assetDetail: (assetId: string, query: AssetMetricsQuery) =>
    ['asset-detail', assetId, query] as const,
  idlingReport: (query: IdlingReportQuery) =>
    ['idling-report', query] as const,
  simStatus: () => ['sim-status'] as const,
  readiness: () => ['readiness'] as const,
};
