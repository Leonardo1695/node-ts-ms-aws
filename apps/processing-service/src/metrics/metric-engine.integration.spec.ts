import { randomUUID } from 'node:crypto';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  persistenceMigrations,
  runMigrations,
  TelemetryEventRepository,
  TelemetryHotStore,
} from '@verdiron/persistence';
import {
  DEFAULT_TELEMETRY_SAMPLE_MINUTES,
  MetricEngineService,
} from './metric-engine.service';
import { MetricRollupRefreshService } from './metric-rollup-refresh.service';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('metric engine integration', () => {
  jest.setTimeout(180_000);

  it('writes telemetry to the correct daily partition with domain metrics', async () => {
    const postgres = await new PostgreSqlContainer('postgres:16-alpine').start();

    try {
      const dataSource = await createDataSource(
        createTypeOrmDataSourceOptions({
          env: {
            POSTGRES_HOST: postgres.getHost(),
            POSTGRES_PORT: postgres.getPort(),
            POSTGRES_USER: postgres.getUsername(),
            POSTGRES_PASSWORD: postgres.getPassword(),
            POSTGRES_DB: postgres.getDatabase(),
          },
          entities: persistenceEntities,
          migrations: persistenceMigrations,
        }),
      );

      await runMigrations(dataSource);

      const rollupRefresh = new MetricRollupRefreshService(
        { refresh: jest.fn() } as never,
        { publish: jest.fn() } as never,
      );

      const metricEngine = new MetricEngineService(
        dataSource,
        new TelemetryEventRepository(dataSource),
        {
          putEvent: jest.fn().mockResolvedValue(undefined),
        } as unknown as TelemetryHotStore,
        rollupRefresh,
      );

      const event: TelemetryEvent = {
        eventId: randomUUID(),
        deviceId: 'dev-1',
        assetId: 'asset-exc-101',
        ts: '2026-06-15T14:30:00.000Z',
        lat: 45.5,
        lon: -73.5,
        speedKph: 0,
        engineOn: true,
        fuelLevelPct: 50,
        fuelRateLph: 8,
        engineHours: 100,
        odometerKm: 1000,
        rpm: 900,
      };

      const result = await metricEngine.processEvent(event);

      expect(result.persisted).toBe(true);
      expect(result.metrics.fuelLiters).toBeCloseTo(8 / 60);
      expect(result.metrics.idleMinutes).toBe(DEFAULT_TELEMETRY_SAMPLE_MINUTES);
      expect(result.metrics.co2Kg).toBeCloseTo((8 / 60) * 2.68);

      const inTargetPartition = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM telemetry_events_2026_06_15
         WHERE event_id = $1`,
        [event.eventId],
      );
      expect(inTargetPartition[0]?.count).toBe(1);

      const inOtherPartition = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM telemetry_events_2026_06_14
         WHERE event_id = $1`,
        [event.eventId],
      );
      expect(inOtherPartition[0]?.count).toBe(0);

      const replay = await metricEngine.processEvent(event);
      expect(replay.persisted).toBe(false);
      expect(replay.metrics.fuelLiters).toBeCloseTo(8 / 60);

      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });
});
