import type {
  AssetDetail,
  AssetMetricsQuery,
  AssetMetricsUnits,
  EtlRunCommand,
  FleetMetrics,
  FleetMetricsQuery,
  FleetMetricsUnits,
  IdlingReport,
  IdlingReportQuery,
  IdlingReportUnits,
  SimStartCommand,
  SimStatus,
} from '@verdiron/domain';

export interface ApiEnvelopeMeta {
  cacheVersion: number;
}

export interface FleetMetricsResponse {
  data: FleetMetrics;
  meta: ApiEnvelopeMeta & {
    units: FleetMetricsUnits;
    bucket: FleetMetrics['bucket'];
    from: string;
    to: string;
    siteId?: string;
    bucketCount: number;
  };
}

export interface AssetDetailResponse {
  data: AssetDetail;
  meta: ApiEnvelopeMeta & {
    units: AssetMetricsUnits;
    from: string;
    to: string;
    assetId: string;
    recentTelemetryCount: number;
    recentTelemetryLimit: number;
  };
}

export interface IdlingReportResponse {
  data: IdlingReport;
  meta: ApiEnvelopeMeta & {
    units: IdlingReportUnits;
    from: string;
    to: string;
    siteId?: string;
    limit: number;
    entryCount: number;
  };
}

export interface SimStatusResponse {
  data: SimStatus;
  meta: ApiEnvelopeMeta;
}

export interface ControlCommandResponse<TData> {
  data: TData;
  meta: ApiEnvelopeMeta & {
    accepted: true;
  };
}

export type SimStartResponse = ControlCommandResponse<{
  command: 'sim.start';
  status: SimStatus;
}>;

export type SimStopResponse = ControlCommandResponse<{
  command: 'sim.stop';
  status: SimStatus;
}>;

export type EtlRunResponse = ControlCommandResponse<{
  command: 'etl.run';
  request: EtlRunCommand;
}>;

export type {
  AssetDetail,
  AssetMetricsQuery,
  EtlRunCommand,
  FleetMetricsQuery,
  IdlingReportQuery,
  SimStartCommand,
  SimStatus,
};
