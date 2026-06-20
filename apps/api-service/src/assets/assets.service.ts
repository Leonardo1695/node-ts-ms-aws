import {
  assetDetailSchema,
  assetMetricsUnitsSchema,
  type AssetDetail,
  type AssetMetricsQuery,
  type AssetMetricsUnits,
} from '@verdiron/domain';
import {
  AssetMetricsRepository,
  TelemetryHotStore,
} from '@verdiron/persistence';
import { Injectable } from '@nestjs/common';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { withApiSpan } from '../observability/api-tracing';

export const ASSET_METRICS_UNITS: AssetMetricsUnits =
  assetMetricsUnitsSchema.parse({
    co2Kg: 'kg',
    fuelLiters: 'L',
    idleMinutes: 'min',
    idlePct: '%',
    utilizationPct: '%',
    fuelEfficiencyLph: 'L/h',
  });

export interface AssetMetricsResponseMeta {
  units: AssetMetricsUnits;
  from: string;
  to: string;
  assetId: string;
  recentTelemetryCount: number;
  recentTelemetryLimit: number;
  cacheVersion: number;
}

export interface AssetMetricsResponse {
  data: AssetDetail;
  meta: AssetMetricsResponseMeta;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetMetricsRepository: AssetMetricsRepository,
    private readonly telemetryHotStore: TelemetryHotStore,
    private readonly metricsReadCache: MetricsReadCache,
  ) {}

  async getMetrics(
    assetId: string,
    query: AssetMetricsQuery,
  ): Promise<AssetMetricsResponse> {
    return withApiSpan(
      'api.asset.metrics',
      {
        'verdiron.asset_id': assetId,
        'verdiron.recent_limit': query.recentLimit,
      },
      async () => {
        const cacheKey = `asset:${assetId}:${query.from}:${query.to}:${query.recentLimit}`;
        const cached = this.metricsReadCache.get<AssetMetricsResponse>(cacheKey);
        if (cached) {
          return {
            ...cached,
            meta: {
              ...cached.meta,
              cacheVersion: this.metricsReadCache.getVersion(),
            },
          };
        }

        const [metrics, recentTelemetry] = await Promise.all([
          this.assetMetricsRepository.queryAssetMetrics({
            assetId,
            ...query,
          }),
          this.telemetryHotStore.queryRecentByAsset(assetId, query.recentLimit),
        ]);

        const data = assetDetailSchema.parse({
          metrics,
          recentTelemetry,
        });

        const response: AssetMetricsResponse = {
          data,
          meta: {
            units: ASSET_METRICS_UNITS,
            from: data.metrics.from,
            to: data.metrics.to,
            assetId: data.metrics.assetId,
            recentTelemetryCount: data.recentTelemetry.length,
            recentTelemetryLimit: query.recentLimit,
            cacheVersion: this.metricsReadCache.getVersion(),
          },
        };

        this.metricsReadCache.set(cacheKey, response);
        return response;
      },
    );
  }
}
