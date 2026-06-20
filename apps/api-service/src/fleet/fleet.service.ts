import {
  fleetMetricsSchema,
  fleetMetricsUnitsSchema,
  type FleetMetrics,
  type FleetMetricsQuery,
  type FleetMetricsUnits,
} from '@verdiron/domain';
import { FleetMetricsRepository } from '@verdiron/persistence';
import { Injectable } from '@nestjs/common';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { withApiSpan } from '../observability/api-tracing';

export const FLEET_METRICS_UNITS: FleetMetricsUnits =
  fleetMetricsUnitsSchema.parse({
    co2Kg: 'kg',
    fuelLiters: 'L',
    idleMinutes: 'min',
    utilizationPct: '%',
  });

export interface FleetMetricsResponseMeta {
  units: FleetMetricsUnits;
  bucket: FleetMetrics['bucket'];
  from: string;
  to: string;
  siteId?: string;
  bucketCount: number;
  cacheVersion: number;
}

export interface FleetMetricsResponse {
  data: FleetMetrics;
  meta: FleetMetricsResponseMeta;
}

@Injectable()
export class FleetService {
  constructor(
    private readonly fleetMetricsRepository: FleetMetricsRepository,
    private readonly metricsReadCache: MetricsReadCache,
  ) {}

  async getMetrics(query: FleetMetricsQuery): Promise<FleetMetricsResponse> {
    return withApiSpan(
      'api.fleet.metrics',
      {
        'verdiron.site_id': query.siteId ?? 'all',
        'verdiron.bucket': query.bucket,
      },
      async () => {
        const cacheKey = `fleet:${query.siteId ?? 'all'}:${query.from}:${query.to}:${query.bucket}`;
        const cached = this.metricsReadCache.get<FleetMetricsResponse>(cacheKey);
        if (cached) {
          return {
            ...cached,
            meta: {
              ...cached.meta,
              cacheVersion: this.metricsReadCache.getVersion(),
            },
          };
        }

        const data = fleetMetricsSchema.parse(
          await this.fleetMetricsRepository.queryFleetMetrics(query),
        );

        const response: FleetMetricsResponse = {
          data,
          meta: {
            units: FLEET_METRICS_UNITS,
            bucket: data.bucket,
            from: data.from,
            to: data.to,
            siteId: data.siteId,
            bucketCount: data.buckets.length,
            cacheVersion: this.metricsReadCache.getVersion(),
          },
        };

        this.metricsReadCache.set(cacheKey, response);
        return response;
      },
    );
  }
}
