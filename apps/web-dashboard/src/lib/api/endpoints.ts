import {
  assetDetailSchema,
  fleetMetricsSchema,
  idlingReportSchema,
  simStatusSchema,
} from '@verdiron/domain';
import { apiRequest, ApiError } from './client';
import type { ReadinessResult } from './health-types';
import { buildQueryString } from './query-params';
import type {
  AssetDetailResponse,
  AssetMetricsQuery,
  EtlRunCommand,
  EtlRunResponse,
  FleetMetricsQuery,
  FleetMetricsResponse,
  IdlingReportQuery,
  IdlingReportResponse,
  SimStartCommand,
  SimStartResponse,
  SimStatusResponse,
  SimStopResponse,
} from './types';

export function getFleetMetrics(
  query: FleetMetricsQuery,
): Promise<FleetMetricsResponse> {
  return apiRequest<FleetMetricsResponse>(
    `/api/v1/fleet/metrics${buildQueryString({
      siteId: query.siteId,
      from: query.from,
      to: query.to,
      bucket: query.bucket,
    })}`,
  ).then((response) => ({
    ...response,
    data: fleetMetricsSchema.parse(response.data),
  }));
}

export function getAssetDetail(
  assetId: string,
  query: AssetMetricsQuery,
): Promise<AssetDetailResponse> {
  return apiRequest<AssetDetailResponse>(
    `/api/v1/assets/${encodeURIComponent(assetId)}/metrics${buildQueryString({
      from: query.from,
      to: query.to,
      recentLimit: query.recentLimit,
    })}`,
  ).then((response) => ({
    ...response,
    data: assetDetailSchema.parse(response.data),
  }));
}

export function getIdlingReport(
  query: IdlingReportQuery,
): Promise<IdlingReportResponse> {
  return apiRequest<IdlingReportResponse>(
    `/api/v1/reports/idling${buildQueryString({
      siteId: query.siteId,
      from: query.from,
      to: query.to,
      limit: query.limit,
    })}`,
  ).then((response) => ({
    ...response,
    data: idlingReportSchema.parse(response.data),
  }));
}

export function getSimStatus(): Promise<SimStatusResponse> {
  return apiRequest<SimStatusResponse>('/api/v1/sim/status').then(
    (response) => ({
      ...response,
      data: simStatusSchema.parse(response.data),
    }),
  );
}

function parseReadinessPayload(body: string): ReadinessResult | undefined {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    if (
      parsed &&
      typeof parsed === 'object' &&
      'checks' in parsed &&
      parsed.checks
    ) {
      return parsed as unknown as ReadinessResult;
    }

    const message = parsed.message;
    if (
      message &&
      typeof message === 'object' &&
      'checks' in message &&
      (message as ReadinessResult).checks
    ) {
      return message as ReadinessResult;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function getReadiness(): Promise<ReadinessResult> {
  try {
    return await apiRequest<ReadinessResult>('/health/ready');
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      const readiness = parseReadinessPayload(error.body);
      if (readiness) {
        return readiness;
      }
    }

    throw error;
  }
}

export function startSimulator(
  command: SimStartCommand,
): Promise<SimStartResponse> {
  return apiRequest<SimStartResponse>('/api/v1/sim/start', {
    method: 'POST',
    body: command,
  });
}

export function stopSimulator(): Promise<SimStopResponse> {
  return apiRequest<SimStopResponse>('/api/v1/sim/stop', {
    method: 'POST',
    body: {},
  });
}

export function runEtl(command: EtlRunCommand = {}): Promise<EtlRunResponse> {
  return apiRequest<EtlRunResponse>('/api/v1/etl/run', {
    method: 'POST',
    body: command,
  });
}
