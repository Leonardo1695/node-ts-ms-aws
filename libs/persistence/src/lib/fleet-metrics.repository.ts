import type {
  FleetMetrics,
  FleetMetricsBucketGranularity,
  FleetMetricsQuery,
} from '@verdiron/domain';
import type { DataSource } from 'typeorm';
import { METRIC_ROLLUPS_VIEW_NAME } from './metric-rollup.repository';

const BUCKET_TRUNC: Record<FleetMetricsBucketGranularity, string> = {
  hour: 'hour',
  day: 'day',
  week: 'week',
};

const BUCKET_INTERVAL: Record<FleetMetricsBucketGranularity, string> = {
  hour: '1 hour',
  day: '1 day',
  week: '1 week',
};

interface FleetMetricsSqlRow {
  bucket_start: Date;
  bucket_end: Date;
  co2_kg: string | number;
  fuel_liters: string | number;
  idle_minutes: string | number;
  utilization_pct: string | number;
  co2_kg_running_total: string | number;
  co2_kg_moving_avg_3: string | number;
  fuel_liters_running_total: string | number;
  utilization_pct_moving_avg_3: string | number;
}

interface FleetMetricsTotalsSqlRow {
  co2_kg: string | number | null;
  fuel_liters: string | number | null;
  idle_minutes: string | number | null;
  utilization_pct: string | number | null;
}

function roundMetric(value: number, decimals: 2 | 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === 'number' ? value : Number(value);
}

export class FleetMetricsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async queryFleetMetrics(query: FleetMetricsQuery): Promise<FleetMetrics> {
    const trunc = BUCKET_TRUNC[query.bucket];
    const interval = BUCKET_INTERVAL[query.bucket];
    const siteId = query.siteId ?? null;

    const totalsRows = await this.dataSource.query<FleetMetricsTotalsSqlRow[]>(
      `
        WITH filtered AS (
          SELECT
            mr.co2_kg::float8 AS co2_kg,
            mr.fuel_liters::float8 AS fuel_liters,
            mr.idle_minutes::float8 AS idle_minutes,
            (mr.utilization_pct::float8 / 100.0) * 60.0 AS active_engine_minutes
          FROM ${METRIC_ROLLUPS_VIEW_NAME} mr
          WHERE mr.bucket_start >= $1::timestamptz
            AND mr.bucket_start < $2::timestamptz
            AND ($3::text IS NULL OR mr.site_id = $3)
        )
        SELECT
          COALESCE(SUM(co2_kg), 0) AS co2_kg,
          COALESCE(SUM(fuel_liters), 0) AS fuel_liters,
          COALESCE(SUM(idle_minutes), 0) AS idle_minutes,
          LEAST(
            100,
            ROUND(
              COALESCE(
                SUM(active_engine_minutes)
                  / NULLIF(COUNT(*) * 60.0, 0)
                  * 100,
                0
              )::numeric,
              2
            )
          ) AS utilization_pct
        FROM filtered
      `,
      [query.from, query.to, siteId],
    );

    const bucketRows = await this.dataSource.query<FleetMetricsSqlRow[]>(
      `
        WITH filtered AS (
          SELECT
            mr.asset_id,
            mr.bucket_start,
            mr.co2_kg::float8 AS co2_kg,
            mr.fuel_liters::float8 AS fuel_liters,
            mr.idle_minutes::float8 AS idle_minutes,
            mr.utilization_pct::float8 AS utilization_pct,
            (mr.utilization_pct::float8 / 100.0) * 60.0 AS active_engine_minutes
          FROM ${METRIC_ROLLUPS_VIEW_NAME} mr
          WHERE mr.bucket_start >= $1::timestamptz
            AND mr.bucket_start < $2::timestamptz
            AND ($3::text IS NULL OR mr.site_id = $3)
        ),
        bucketed AS (
          SELECT
            date_trunc('${trunc}', f.bucket_start) AS bucket_start,
            date_trunc('${trunc}', f.bucket_start)
              + interval '${interval}' AS bucket_end,
            SUM(f.co2_kg) AS co2_kg,
            SUM(f.fuel_liters) AS fuel_liters,
            SUM(f.idle_minutes) AS idle_minutes,
            LEAST(
              100,
              ROUND(
                COALESCE(
                  SUM(f.active_engine_minutes)
                    / NULLIF(COUNT(*) * 60.0, 0)
                    * 100,
                  0
                )::numeric,
                2
              )
            ) AS utilization_pct
          FROM filtered f
          GROUP BY date_trunc('${trunc}', f.bucket_start)
        ),
        with_trends AS (
          SELECT
            bucket_start,
            bucket_end,
            co2_kg,
            fuel_liters,
            idle_minutes,
            utilization_pct,
            SUM(co2_kg) OVER (
              ORDER BY bucket_start
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS co2_kg_running_total,
            AVG(co2_kg) OVER (
              ORDER BY bucket_start
              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) AS co2_kg_moving_avg_3,
            SUM(fuel_liters) OVER (
              ORDER BY bucket_start
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS fuel_liters_running_total,
            AVG(utilization_pct) OVER (
              ORDER BY bucket_start
              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) AS utilization_pct_moving_avg_3
          FROM bucketed
        )
        SELECT *
        FROM with_trends
        ORDER BY bucket_start
      `,
      [query.from, query.to, siteId],
    );

    const totalsRow = totalsRows[0];

    return {
      siteId: query.siteId,
      from: query.from,
      to: query.to,
      bucket: query.bucket,
      totals: {
        co2Kg: roundMetric(toNumber(totalsRow?.co2_kg), 4),
        fuelLiters: roundMetric(toNumber(totalsRow?.fuel_liters), 4),
        idleMinutes: roundMetric(toNumber(totalsRow?.idle_minutes), 2),
        utilizationPct: roundMetric(toNumber(totalsRow?.utilization_pct), 2),
      },
      buckets: bucketRows.map((row) => ({
        bucketStart: toIso(row.bucket_start),
        bucketEnd: toIso(row.bucket_end),
        co2Kg: roundMetric(toNumber(row.co2_kg), 4),
        fuelLiters: roundMetric(toNumber(row.fuel_liters), 4),
        idleMinutes: roundMetric(toNumber(row.idle_minutes), 2),
        utilizationPct: roundMetric(toNumber(row.utilization_pct), 2),
        trends: {
          co2KgRunningTotal: roundMetric(toNumber(row.co2_kg_running_total), 4),
          co2KgMovingAvg3: roundMetric(toNumber(row.co2_kg_moving_avg_3), 4),
          fuelLitersRunningTotal: roundMetric(
            toNumber(row.fuel_liters_running_total),
            4,
          ),
          utilizationPctMovingAvg3: roundMetric(
            toNumber(row.utilization_pct_moving_avg_3),
            2,
          ),
        },
      })),
    };
  }
}
