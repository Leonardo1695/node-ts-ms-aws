import {
  calculateFuelEfficiencyLph,
  calculateUtilizationPct,
  type AssetMetrics,
  type AssetMetricsQuery,
} from '@verdiron/domain';
import type { DataSource } from 'typeorm';
import { METRIC_ROLLUPS_VIEW_NAME } from './metric-rollup.repository';

export interface AssetMetricsRangeQuery extends AssetMetricsQuery {
  assetId: string;
}

interface AssetMetricsSqlRow {
  co2_kg: string | number | null;
  fuel_liters: string | number | null;
  idle_minutes: string | number | null;
  active_engine_minutes: string | number | null;
  bucket_count: string | number | null;
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

function calculateIdlePct(
  idleMinutes: number,
  activeEngineMinutes: number,
): number {
  if (activeEngineMinutes <= 0) {
    return 0;
  }

  return Math.min(100, roundMetric((idleMinutes / activeEngineMinutes) * 100, 2));
}

export class AssetMetricsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async queryAssetMetrics(
    query: AssetMetricsRangeQuery,
  ): Promise<AssetMetrics> {
    const rows = await this.dataSource.query<AssetMetricsSqlRow[]>(
      `
        WITH filtered AS (
          SELECT
            mr.co2_kg::float8 AS co2_kg,
            mr.fuel_liters::float8 AS fuel_liters,
            mr.idle_minutes::float8 AS idle_minutes,
            (mr.utilization_pct::float8 / 100.0) * 60.0 AS active_engine_minutes
          FROM ${METRIC_ROLLUPS_VIEW_NAME} mr
          WHERE mr.asset_id = $1
            AND mr.bucket_start >= $2::timestamptz
            AND mr.bucket_start < $3::timestamptz
        )
        SELECT
          COALESCE(SUM(co2_kg), 0) AS co2_kg,
          COALESCE(SUM(fuel_liters), 0) AS fuel_liters,
          COALESCE(SUM(idle_minutes), 0) AS idle_minutes,
          COALESCE(SUM(active_engine_minutes), 0) AS active_engine_minutes,
          COUNT(*) AS bucket_count
        FROM filtered
      `,
      [query.assetId, query.from, query.to],
    );

    const row = rows[0];
    const co2Kg = roundMetric(toNumber(row?.co2_kg), 4);
    const fuelLiters = roundMetric(toNumber(row?.fuel_liters), 4);
    const idleMinutes = roundMetric(toNumber(row?.idle_minutes), 2);
    const activeEngineMinutes = toNumber(row?.active_engine_minutes);
    const activeEngineHours = activeEngineMinutes / 60;
    const availableHours = toNumber(row?.bucket_count);

    return {
      assetId: query.assetId,
      from: query.from,
      to: query.to,
      co2Kg,
      fuelLiters,
      idleMinutes,
      idlePct: calculateIdlePct(idleMinutes, activeEngineMinutes),
      utilizationPct: roundMetric(
        calculateUtilizationPct(activeEngineHours, availableHours),
        2,
      ),
      fuelEfficiencyLph: roundMetric(
        calculateFuelEfficiencyLph(fuelLiters, activeEngineHours),
        4,
      ),
    };
  }
}
