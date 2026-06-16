import {
  CreateTableCommand,
  type DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, Wait } from 'testcontainers';
import { persistenceEntities } from './entities';
import {
  CreateMetricRollupsMatview1740000000002,
  CreatePartitionedTelemetryEvents1740000000001,
  CreateSitesAndAssets1740000000000,
  persistenceMigrations,
  SeedReferenceData1740000000003,
} from './migrations';
import {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  runMigrations,
  undoLastMigration,
} from './typeorm-data-source';
import {
  createDynamoDbClient,
  dynamoTableExists,
  listDynamoDbTables,
} from './dynamodb-client';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('persistence integration', () => {
  jest.setTimeout(180_000);

  it('connects TypeORM to Postgres', async () => {
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
          entities: [],
        }),
      );

      expect(dataSource.isInitialized).toBe(true);
      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });

  it('lists DynamoDB tables via LocalStack', async () => {
    const localstack = await new GenericContainer('localstack/localstack:3.4')
      .withEnvironment({
        SERVICES: 'dynamodb',
        DEFAULT_REGION: 'us-east-1',
      })
      .withExposedPorts(4566)
      .withWaitStrategy(Wait.forLogMessage(/Ready\./))
      .start();

    try {
      const endpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`;
      const env = {
        AWS_REGION: 'us-east-1',
        AWS_ENDPOINT_URL: endpoint,
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        DYNAMODB_TABLE_NAME: 'telemetry-hot',
      };

      const client = createDynamoDbClient(env);
      await client.send(
        new CreateTableCommand({
          TableName: env.DYNAMODB_TABLE_NAME,
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 2_000));

      const tables = await listDynamoDbTables(client);
      expect(tables).toContain(env.DYNAMODB_TABLE_NAME);
      expect(await dynamoTableExists(client, env.DYNAMODB_TABLE_NAME)).toBe(
        true,
      );

      await (client as DynamoDBClient).destroy();
    } finally {
      await localstack.stop();
    }
  });

  it('runs core tables migration up and down', async () => {
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
          migrations: [CreateSitesAndAssets1740000000000],
        }),
      );

      await runMigrations(dataSource);

      const tablesAfterUp = await dataSource.query<{ tablename: string }[]>(
        `SELECT tablename
         FROM pg_tables
         WHERE schemaname = 'public'
           AND tablename IN ('sites', 'assets')
         ORDER BY tablename`,
      );
      expect(tablesAfterUp.map((row) => row.tablename)).toEqual([
        'assets',
        'sites',
      ]);

      const assetColumns = await dataSource.query<{ column_name: string }[]>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'assets'
           AND column_name IN ('fuel_type', 'asset_class', 'rated_power_kw', 'site_id')
         ORDER BY column_name`,
      );
      expect(assetColumns.map((row) => row.column_name)).toEqual([
        'asset_class',
        'fuel_type',
        'rated_power_kw',
        'site_id',
      ]);

      const foreignKeys = await dataSource.query<{ conname: string }[]>(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = 'assets'::regclass
           AND contype = 'f'`,
      );
      expect(
        foreignKeys.some((row) =>
          row.conname.includes('FK_assets_site_id_sites_site_id'),
        ),
      ).toBe(true);

      await undoLastMigration(dataSource);

      const tablesAfterDown = await dataSource.query<{ tablename: string }[]>(
        `SELECT tablename
         FROM pg_tables
         WHERE schemaname = 'public'
           AND tablename IN ('sites', 'assets')`,
      );
      expect(tablesAfterDown).toHaveLength(0);

      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });

  it('routes telemetry inserts to daily partitions and prunes on time filters', async () => {
    const postgres = await new PostgreSqlContainer('postgres:16-alpine').start();
    const eventId = '550e8400-e29b-41d4-a716-446655440001';

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
          migrations: [
            CreateSitesAndAssets1740000000000,
            CreatePartitionedTelemetryEvents1740000000001,
          ],
        }),
      );

      await runMigrations(dataSource);

      await dataSource.query(
        `INSERT INTO telemetry_events (
           event_id, device_id, asset_id, ts,
           lat, lon, speed_kph, engine_on,
           fuel_level_pct, fuel_rate_lph, engine_hours, odometer_km, rpm
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7, $8,
           $9, $10, $11, $12, $13
         )`,
        [
          eventId,
          'dev-1',
          'asset-1',
          '2026-06-15T12:00:00.000Z',
          45.5,
          -73.5,
          32.5,
          true,
          50,
          4.2,
          100,
          1000,
          900,
        ],
      );

      const inTargetPartition = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM telemetry_events_2026_06_15
         WHERE event_id = $1`,
        [eventId],
      );
      expect(inTargetPartition[0]?.count).toBe(1);

      const inOtherPartition = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM telemetry_events_2026_06_14
         WHERE event_id = $1`,
        [eventId],
      );
      expect(inOtherPartition[0]?.count).toBe(0);

      const explainRows = await dataSource.query<{ 'QUERY PLAN': string }[]>(
        `EXPLAIN (FORMAT TEXT)
         SELECT *
         FROM telemetry_events
         WHERE ts >= '2026-06-15T00:00:00.000Z'
           AND ts < '2026-06-16T00:00:00.000Z'`,
      );
      const planText = explainRows.map((row) => row['QUERY PLAN']).join('\n');

      expect(planText).toContain('telemetry_events_2026_06_15');
      expect(planText).not.toContain('telemetry_events_2026_06_14');
      expect(planText).not.toContain('telemetry_events_2026_06_16');

      await undoLastMigration(dataSource);

      const parentAfterDown = await dataSource.query<{ regclass: string | null }[]>(
        `SELECT to_regclass('public.telemetry_events') AS regclass`,
      );
      expect(parentAfterDown[0]?.regclass).toBeNull();

      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });

  it('builds metric_rollups matview and refreshes concurrently', async () => {
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
          migrations: [
            CreateSitesAndAssets1740000000000,
            CreatePartitionedTelemetryEvents1740000000001,
            CreateMetricRollupsMatview1740000000002,
          ],
        }),
      );

      await runMigrations(dataSource);

      await dataSource.query(`
        INSERT INTO sites (site_id, name, region)
        VALUES ('site-a', 'North Yard', 'NA-East')
      `);
      await dataSource.query(`
        INSERT INTO assets (
          asset_id, name, asset_type, asset_class, site_id, fuel_type, rated_power_kw
        ) VALUES (
          'asset-1', 'Excavator 1', 'excavator', 'heavy', 'site-a', 'diesel', 250.00
        )
      `);

      await dataSource.query(
        `INSERT INTO telemetry_events (
           event_id, device_id, asset_id, ts,
           lat, lon, speed_kph, engine_on,
           fuel_level_pct, fuel_rate_lph, engine_hours, odometer_km, rpm
         ) VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13),
         ($14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [
          '550e8400-e29b-41d4-a716-446655440010',
          'dev-1',
          'asset-1',
          '2026-06-15T12:00:00.000Z',
          45.5,
          -73.5,
          30,
          true,
          50,
          6,
          100,
          1000,
          1200,
          '550e8400-e29b-41d4-a716-446655440011',
          'dev-1',
          'asset-1',
          '2026-06-15T12:30:00.000Z',
          45.5,
          -73.5,
          0,
          true,
          48,
          4,
          100.5,
          1000,
          900,
        ],
      );

      await dataSource.query(`REFRESH MATERIALIZED VIEW metric_rollups`);
      await dataSource.query(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY metric_rollups`,
      );

      const rollups = await dataSource.query<
        {
          site_id: string;
          asset_id: string;
          co2_kg: string;
          fuel_liters: string;
          idle_minutes: string;
          utilization_pct: string;
        }[]
      >(
        `SELECT site_id, asset_id, co2_kg, fuel_liters, idle_minutes, utilization_pct
         FROM metric_rollups
         WHERE asset_id = 'asset-1'
           AND bucket_start = '2026-06-15 12:00:00+00'`,
      );

      expect(rollups).toHaveLength(1);
      expect(rollups[0]?.site_id).toBe('site-a');
      expect(Number(rollups[0]?.fuel_liters)).toBeGreaterThan(0);
      expect(Number(rollups[0]?.co2_kg)).toBeGreaterThan(0);
      expect(Number(rollups[0]?.idle_minutes)).toBeGreaterThan(0);
      expect(Number(rollups[0]?.utilization_pct)).toBeGreaterThan(0);

      await undoLastMigration(dataSource);

      const matviewAfterDown = await dataSource.query<{ regclass: string | null }[]>(
        `SELECT to_regclass('public.metric_rollups') AS regclass`,
      );
      expect(matviewAfterDown[0]?.regclass).toBeNull();

      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });

  it('seeds reference sites and assets idempotently', async () => {
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

      const countsAfterFirstRun = await dataSource.query<
        { sites: number; assets: number }[]
      >(
        `SELECT
           (SELECT COUNT(*)::int FROM sites WHERE site_id LIKE 'site-%') AS sites,
           (SELECT COUNT(*)::int FROM assets WHERE asset_id LIKE 'asset-%') AS assets`,
      );
      expect(countsAfterFirstRun[0]?.sites).toBe(3);
      expect(countsAfterFirstRun[0]?.assets).toBe(8);

      const assetTypes = await dataSource.query<{ asset_type: string }[]>(
        `SELECT DISTINCT asset_type
         FROM assets
         WHERE asset_id LIKE 'asset-%'
         ORDER BY asset_type`,
      );
      expect(assetTypes.map((row) => row.asset_type)).toEqual([
        'excavator',
        'generator',
        'loader',
        'truck',
      ]);

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      const seedMigration = new SeedReferenceData1740000000003();
      await seedMigration.up(queryRunner);
      await seedMigration.up(queryRunner);
      await queryRunner.release();

      const countsAfterSecondSeed = await dataSource.query<
        { sites: number; assets: number }[]
      >(
        `SELECT
           (SELECT COUNT(*)::int FROM sites WHERE site_id LIKE 'site-%') AS sites,
           (SELECT COUNT(*)::int FROM assets WHERE asset_id LIKE 'asset-%') AS assets`,
      );
      expect(countsAfterSecondSeed[0]).toEqual(countsAfterFirstRun[0]);

      await undoLastMigration(dataSource);

      const countsAfterDown = await dataSource.query<{ count: number }[]>(
        `SELECT COUNT(*)::int AS count
         FROM assets
         WHERE asset_id = 'asset-exc-101'`,
      );
      expect(countsAfterDown[0]?.count).toBe(0);

      await destroyDataSource(dataSource);
    } finally {
      await postgres.stop();
    }
  });
});
