import type { DataSource } from 'typeorm';

export const METRIC_ROLLUPS_VIEW_NAME = 'metric_rollups';

/** Hour bucket aligned with the `metric_rollups` matview (`date_trunc('hour', ts)`). */
export function buildMetricRollupWindow(ts: string): {
  windowStart: string;
  windowEnd: string;
} {
  const bucketStart = new Date(ts);
  bucketStart.setUTCMinutes(0, 0, 0);

  const windowStart = bucketStart.toISOString();
  const windowEnd = new Date(
    bucketStart.getTime() + 60 * 60 * 1000,
  ).toISOString();

  return { windowStart, windowEnd };
}

export class MetricRollupRepository {
  constructor(private readonly dataSource: DataSource) {}

  async refresh(): Promise<void> {
    try {
      await this.dataSource.query(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY ${METRIC_ROLLUPS_VIEW_NAME}`,
      );
    } catch {
      await this.dataSource.query(
        `REFRESH MATERIALIZED VIEW ${METRIC_ROLLUPS_VIEW_NAME}`,
      );
    }
  }
}
