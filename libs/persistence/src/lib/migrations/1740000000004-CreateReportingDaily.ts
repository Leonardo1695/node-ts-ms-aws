import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportingDaily1740000000004 implements MigrationInterface {
  name = 'CreateReportingDaily1740000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /*
     * Daily reporting table populated by the python-etl batch job (VRD-062).
     * Asset and site grains share one table; `entity_id` holds asset_id or site_id.
     * Upserts are idempotent on (report_date, grain, entity_id).
     */
    await queryRunner.query(`
      CREATE TABLE reporting_daily (
        report_date DATE NOT NULL,
        grain VARCHAR(10) NOT NULL CHECK (grain IN ('asset', 'site')),
        entity_id VARCHAR(64) NOT NULL,
        site_id VARCHAR(64) NOT NULL,
        asset_class VARCHAR(32),
        fuel_type VARCHAR(16),
        fuel_liters DOUBLE PRECISION NOT NULL DEFAULT 0,
        co2_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
        idle_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
        active_engine_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
        available_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
        utilization_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
        event_count INTEGER,
        asset_count INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (report_date, grain, entity_id)
      );

      CREATE INDEX idx_reporting_daily_site_date
        ON reporting_daily (site_id, report_date DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_reporting_daily_site_date;
      DROP TABLE IF EXISTS reporting_daily;
    `);
  }
}
