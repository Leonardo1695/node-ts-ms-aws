import { randomUUID } from 'node:crypto';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import amqp from 'amqplib';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createMetricsUpdatedClient,
  METRICS_UPDATED_QUEUE,
  MetricsUpdatedPublisher,
} from '@verdiron/messaging';
import {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  MetricRollupRepository,
  persistenceEntities,
  persistenceMigrations,
  runMigrations,
  TelemetryEventRepository,
  TelemetryHotStore,
} from '@verdiron/persistence';
import { MetricEngineService } from './metric-engine.service';
import { MetricRollupRefreshService } from './metric-rollup-refresh.service';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('metric rollup refresh integration', () => {
  jest.setTimeout(180_000);

  it('refreshes metric_rollups and publishes metrics.updated after telemetry lands', async () => {
    const postgres = await new PostgreSqlContainer('postgres:16-alpine').start();
    const rabbit = await new RabbitMQContainer('rabbitmq:3.13-management').start();

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

      const rabbitUrl = rabbit.getAmqpUrl();
      const publisher = new MetricsUpdatedPublisher(
        createMetricsUpdatedClient({ url: rabbitUrl }),
      );
      await publisher.connect();

      const rollupRefresh = new MetricRollupRefreshService(
        new MetricRollupRepository(dataSource),
        publisher,
      );

      const metricEngine = new MetricEngineService(
        dataSource,
        new TelemetryEventRepository(dataSource),
        {
          putEvent: jest.fn().mockResolvedValue(undefined),
        } as unknown as TelemetryHotStore,
        rollupRefresh,
      );

      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue(METRICS_UPDATED_QUEUE, { durable: true });

      const received = new Promise<Record<string, string>>((resolve) => {
        void channel.consume(METRICS_UPDATED_QUEUE, (message) => {
          if (!message) {
            return;
          }

          resolve(JSON.parse(message.content.toString()) as Record<string, string>);
          channel.ack(message);
        });
      });

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

      await metricEngine.processEvent(event);
      await rollupRefresh.flush();

      const rollups = await dataSource.query<{ fuel_liters: string }[]>(
        `SELECT fuel_liters
         FROM metric_rollups
         WHERE asset_id = 'asset-exc-101'
           AND bucket_start = '2026-06-15 14:00:00+00'`,
      );

      expect(rollups).toHaveLength(1);
      expect(Number(rollups[0]?.fuel_liters)).toBeGreaterThan(0);

      await expect(received).resolves.toEqual({
        pattern: METRICS_UPDATED_QUEUE,
        data: {
          assetId: 'asset-exc-101',
          siteId: 'site-north-yard',
          windowStart: '2026-06-15T14:00:00.000Z',
          windowEnd: '2026-06-15T15:00:00.000Z',
        },
      });

      await publisher.close();
      await channel.close();
      await connection.close();
      await destroyDataSource(dataSource);
    } finally {
      await rabbit.stop();
      await postgres.stop();
    }
  });
});
