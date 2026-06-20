import type { IdlingReport, IdlingReportQuery } from '@verdiron/domain';
import type { DataSource } from 'typeorm';
import { METRIC_ROLLUPS_VIEW_NAME } from './metric-rollup.repository';

interface IdlingReportSqlRow {
  asset_id: string;
  asset_name: string;
  site_id: string;
  idle_minutes: string | number;
  idle_fuel_liters: string | number;
  idle_co2_kg: string | number;
  idle_co2_rank: string | number;
  row_num: string | number;
}

function roundMetric(value: number, decimals: 2 | 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === 'number' ? value : Number(value);
}

/**
 * Ranked idling offenders from pre-aggregated matview idle minutes.
 *
 * Teaching note — ranking window functions:
 * - `RANK() OVER (ORDER BY idle_co2_kg DESC)` assigns the same rank to ties (1, 2, 2, 4…).
 * - `ROW_NUMBER() OVER (...)` breaks ties deterministically (1, 2, 3, 4…) so we can cap results
 *   with `WHERE row_num <= limit` without dropping tied assets ambiguously.
 *
 * Idle fuel/CO2 estimates mirror `libs/domain` burn rates and CO2 factors inline in SQL so the
 * ranking happens entirely in the database.
 */
export class IdlingReportRepository {
  constructor(private readonly dataSource: DataSource) {}

  async queryIdlingReport(query: IdlingReportQuery): Promise<IdlingReport> {
    const siteId = query.siteId ?? null;

    const rows = await this.dataSource.query<IdlingReportSqlRow[]>(
      `
        WITH asset_idle AS (
          SELECT
            a.asset_id,
            a.name AS asset_name,
            a.site_id,
            a.asset_class,
            a.fuel_type,
            COALESCE(SUM(mr.idle_minutes), 0) AS idle_minutes
          FROM assets a
          INNER JOIN ${METRIC_ROLLUPS_VIEW_NAME} mr
            ON mr.asset_id = a.asset_id
           AND mr.bucket_start >= $1::timestamptz
           AND mr.bucket_start < $2::timestamptz
          WHERE ($3::text IS NULL OR a.site_id = $3)
          GROUP BY
            a.asset_id,
            a.name,
            a.site_id,
            a.asset_class,
            a.fuel_type
          HAVING COALESCE(SUM(mr.idle_minutes), 0) > 0
        ),
        scored AS (
          SELECT
            asset_id,
            asset_name,
            site_id,
            idle_minutes,
            ROUND(
              (
                idle_minutes *
                CASE LOWER(asset_class)
                  WHEN 'heavy' THEN 0.8
                  WHEN 'medium' THEN 0.5
                  WHEN 'light' THEN 0.3
                  ELSE 0.5
                END
              )::numeric,
              4
            ) AS idle_fuel_liters,
            ROUND(
              (
                idle_minutes *
                CASE LOWER(asset_class)
                  WHEN 'heavy' THEN 0.8
                  WHEN 'medium' THEN 0.5
                  WHEN 'light' THEN 0.3
                  ELSE 0.5
                END *
                CASE fuel_type
                  WHEN 'diesel' THEN 2.68
                  WHEN 'gasoline' THEN 2.31
                  ELSE 2.68
                END
              )::numeric,
              4
            ) AS idle_co2_kg
          FROM asset_idle
        ),
        ranked AS (
          SELECT
            asset_id,
            asset_name,
            site_id,
            idle_minutes,
            idle_fuel_liters,
            idle_co2_kg,
            RANK() OVER (
              ORDER BY idle_co2_kg DESC, idle_fuel_liters DESC, asset_id ASC
            ) AS idle_co2_rank,
            ROW_NUMBER() OVER (
              ORDER BY idle_co2_kg DESC, idle_fuel_liters DESC, asset_id ASC
            ) AS row_num
          FROM scored
        )
        SELECT
          asset_id,
          asset_name,
          site_id,
          idle_minutes,
          idle_fuel_liters,
          idle_co2_kg,
          idle_co2_rank,
          row_num
        FROM ranked
        WHERE row_num <= $4
        ORDER BY row_num ASC
      `,
      [query.from, query.to, siteId, query.limit],
    );

    return {
      from: query.from,
      to: query.to,
      entries: rows.map((row) => ({
        assetId: row.asset_id,
        assetName: row.asset_name,
        siteId: row.site_id,
        idleMinutes: roundMetric(toNumber(row.idle_minutes), 2),
        idleFuelLiters: roundMetric(toNumber(row.idle_fuel_liters), 4),
        idleCo2Kg: roundMetric(toNumber(row.idle_co2_kg), 4),
      })),
    };
  }
}
