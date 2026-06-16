import { MigrationInterface, QueryRunner } from 'typeorm';

const INITIAL_PARTITIONS = [
  {
    name: 'telemetry_events_2026_06_14',
    from: '2026-06-14T00:00:00.000Z',
    to: '2026-06-15T00:00:00.000Z',
  },
  {
    name: 'telemetry_events_2026_06_15',
    from: '2026-06-15T00:00:00.000Z',
    to: '2026-06-16T00:00:00.000Z',
  },
  {
    name: 'telemetry_events_2026_06_16',
    from: '2026-06-16T00:00:00.000Z',
    to: '2026-06-17T00:00:00.000Z',
  },
] as const;

export class CreatePartitionedTelemetryEvents1740000000001
  implements MigrationInterface
{
  name = 'CreatePartitionedTelemetryEvents1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /*
     * PARTITIONING (teaching note)
     * -----------------------------
     * `telemetry_events` stores high-volume time-series rows. Without partitioning,
     * every query scans one giant heap + indexes as the table grows.
     *
     * PostgreSQL declarative RANGE partitioning splits one logical table into child
     * tables keyed on `ts`. Each child holds a contiguous time window (here: one day).
     *
     * Why daily?
     * - Fleet telemetry arrives continuously; most dashboard queries filter by date range.
     * - Daily chunks keep partition size predictable and make retention (DROP PARTITION)
     *   cheap compared to DELETE on a monolithic table.
     *
     * Partition pruning
     * -----------------
     * When a query includes predicates on the partition key (`ts`), the planner can
     * skip child partitions outside the range. Check with:
     *   EXPLAIN SELECT ... FROM telemetry_events WHERE ts >= ... AND ts < ...;
     * You should see only the matching daily partitions in the plan.
     *
     * Primary key note: on partitioned tables, PK/UNIQUE constraints must include the
     * partition key columns, so we use (event_id, ts).
     */
    await queryRunner.query(`
      CREATE TABLE telemetry_events (
        event_id uuid NOT NULL,
        device_id varchar(64) NOT NULL,
        asset_id varchar(64) NOT NULL,
        ts timestamptz NOT NULL,
        lat numeric(9, 6) NOT NULL,
        lon numeric(9, 6) NOT NULL,
        speed_kph numeric(8, 2) NOT NULL,
        engine_on boolean NOT NULL,
        fuel_level_pct numeric(5, 2) NOT NULL,
        fuel_rate_lph numeric(8, 3) NOT NULL,
        engine_hours numeric(12, 2) NOT NULL,
        odometer_km numeric(12, 2) NOT NULL,
        rpm numeric(8, 2) NOT NULL,
        PRIMARY KEY (event_id, ts)
      ) PARTITION BY RANGE (ts);
    `);

    for (const partition of INITIAL_PARTITIONS) {
      await queryRunner.query(`
        CREATE TABLE ${partition.name} PARTITION OF telemetry_events
        FOR VALUES FROM ('${partition.from}') TO ('${partition.to}');
      `);
    }

    /*
     * Indexes on the parent propagate to every child partition. Composite (asset_id, ts)
     * supports per-asset time-range reads; ts alone supports fleet-wide windows.
     */
    await queryRunner.query(`
      CREATE INDEX idx_telemetry_events_asset_id_ts
        ON telemetry_events (asset_id, ts);

      CREATE INDEX idx_telemetry_events_ts
        ON telemetry_events (ts);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS telemetry_events CASCADE;`);
  }
}
