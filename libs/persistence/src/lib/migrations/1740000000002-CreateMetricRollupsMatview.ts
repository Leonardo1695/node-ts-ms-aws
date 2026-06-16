import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMetricRollupsMatview1740000000002
  implements MigrationInterface
{
  name = 'CreateMetricRollupsMatview1740000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /*
     * MATERIALIZED VIEW (teaching note)
     * -------------------------------
     * A normal VIEW is a stored query: it runs every time you SELECT from it.
     * A MATERIALIZED VIEW persists the result set on disk, like a table snapshot.
     *
     * Why use one here?
     * - Dashboard queries (CO2, fuel, idle, utilization by site/asset/hour) aggregate
     *   millions of telemetry rows. Recomputing on every API call is expensive.
     * - We precompute rollups once, then serve cheap reads from `metric_rollups`.
     *
     * Refresh strategy
     * ----------------
     * Processing-service refreshes after new telemetry lands (debounced). Two modes:
     *   REFRESH MATERIALIZED VIEW metric_rollups;
     *   REFRESH MATERIALIZED VIEW CONCURRENTLY metric_rollups;
     *
     * CONCURRENTLY keeps the old snapshot readable while rebuilding, but requires at
     * least one UNIQUE index on the matview. We index (asset_id, bucket_start).
     *
     * Formulas mirror `libs/domain` interval math (idle threshold 2 kph, CO2 factors
     * diesel 2.68 / gasoline 2.31 kg per liter).
     */
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW metric_rollups AS
      WITH ordered_events AS (
        SELECT
          a.site_id,
          te.asset_id,
          te.ts,
          te.engine_on,
          te.speed_kph,
          te.fuel_rate_lph,
          a.fuel_type,
          date_trunc('hour', te.ts) AS bucket_start,
          LEAD(te.ts) OVER (
            PARTITION BY te.asset_id, date_trunc('hour', te.ts)
            ORDER BY te.ts
          ) AS next_ts
        FROM telemetry_events te
        INNER JOIN assets a ON a.asset_id = te.asset_id
      ),
      event_intervals AS (
        SELECT
          site_id,
          asset_id,
          bucket_start,
          engine_on,
          speed_kph,
          fuel_rate_lph,
          fuel_type,
          GREATEST(
            EXTRACT(
              EPOCH FROM (
                COALESCE(next_ts, ts + interval '1 minute') - ts
              )
            ) / 60.0,
            0
          ) AS duration_minutes
        FROM ordered_events
      ),
      aggregated AS (
        SELECT
          site_id,
          asset_id,
          bucket_start,
          bucket_start + interval '1 hour' AS bucket_end,
          SUM(
            CASE
              WHEN engine_on AND speed_kph < 2 THEN duration_minutes
              ELSE 0
            END
          ) AS idle_minutes,
          SUM(
            CASE WHEN engine_on THEN duration_minutes ELSE 0 END
          ) AS active_engine_minutes,
          SUM(
            CASE
              WHEN engine_on THEN fuel_rate_lph * duration_minutes / 60.0
              ELSE 0
            END
          ) AS fuel_liters,
          SUM(
            CASE
              WHEN engine_on THEN
                (fuel_rate_lph * duration_minutes / 60.0) *
                CASE fuel_type
                  WHEN 'diesel' THEN 2.68
                  WHEN 'gasoline' THEN 2.31
                  ELSE 2.68
                END
              ELSE 0
            END
          ) AS co2_kg
        FROM event_intervals
        WHERE duration_minutes > 0
        GROUP BY site_id, asset_id, bucket_start
      )
      SELECT
        site_id,
        asset_id,
        bucket_start,
        bucket_end,
        ROUND(co2_kg::numeric, 4) AS co2_kg,
        ROUND(fuel_liters::numeric, 4) AS fuel_liters,
        ROUND(idle_minutes::numeric, 2) AS idle_minutes,
        LEAST(
          100,
          ROUND((active_engine_minutes / 60.0) * 100, 2)
        ) AS utilization_pct
      FROM aggregated
      WITH NO DATA;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_metric_rollups_asset_bucket
        ON metric_rollups (asset_id, bucket_start);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_metric_rollups_asset_bucket;
    `);
    await queryRunner.query(`
      DROP MATERIALIZED VIEW IF EXISTS metric_rollups;
    `);
  }
}
