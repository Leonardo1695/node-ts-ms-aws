import {
  idlingReportSchema,
  idlingReportUnitsSchema,
  type IdlingReport,
  type IdlingReportQuery,
  type IdlingReportUnits,
} from '@verdiron/domain';
import { IdlingReportRepository } from '@verdiron/persistence';
import { Injectable } from '@nestjs/common';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { withApiSpan } from '../observability/api-tracing';

export const IDLING_REPORT_UNITS: IdlingReportUnits =
  idlingReportUnitsSchema.parse({
    idleMinutes: 'min',
    idleFuelLiters: 'L',
    idleCo2Kg: 'kg',
  });

export interface IdlingReportResponseMeta {
  units: IdlingReportUnits;
  from: string;
  to: string;
  siteId?: string;
  limit: number;
  entryCount: number;
  cacheVersion: number;
}

export interface IdlingReportResponse {
  data: IdlingReport;
  meta: IdlingReportResponseMeta;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly idlingReportRepository: IdlingReportRepository,
    private readonly metricsReadCache: MetricsReadCache,
  ) {}

  async getIdlingReport(
    query: IdlingReportQuery,
  ): Promise<IdlingReportResponse> {
    return withApiSpan(
      'api.reports.idling',
      {
        'verdiron.site_id': query.siteId ?? 'all',
        'verdiron.limit': query.limit,
      },
      async () => {
        const cacheKey = `idling:${query.siteId ?? 'all'}:${query.from}:${query.to}:${query.limit}`;
        const cached = this.metricsReadCache.get<IdlingReportResponse>(cacheKey);
        if (cached) {
          return {
            ...cached,
            meta: {
              ...cached.meta,
              cacheVersion: this.metricsReadCache.getVersion(),
            },
          };
        }

        const data = idlingReportSchema.parse(
          await this.idlingReportRepository.queryIdlingReport(query),
        );

        const response: IdlingReportResponse = {
          data,
          meta: {
            units: IDLING_REPORT_UNITS,
            from: data.from,
            to: data.to,
            siteId: query.siteId,
            limit: query.limit,
            entryCount: data.entries.length,
            cacheVersion: this.metricsReadCache.getVersion(),
          },
        };

        this.metricsReadCache.set(cacheKey, response);
        return response;
      },
    );
  }
}
