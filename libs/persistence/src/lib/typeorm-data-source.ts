import type { Env } from '@verdiron/config';
import {
  DataSource,
  type DataSourceOptions,
  type EntitySchema,
  type MixedList,
} from 'typeorm';

export type PostgresEnvConfig = Pick<
  Env,
  'POSTGRES_HOST' | 'POSTGRES_PORT' | 'POSTGRES_USER' | 'POSTGRES_PASSWORD' | 'POSTGRES_DB'
>;

type TypeOrmClass = abstract new (...args: never) => object;

export interface TypeOrmConfigInput {
  env: PostgresEnvConfig;
  entities: MixedList<string | TypeOrmClass | EntitySchema>;
  migrations?: MixedList<string | TypeOrmClass>;
  migrationsRun?: boolean;
}

export function createTypeOrmDataSourceOptions(
  input: TypeOrmConfigInput,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: input.env.POSTGRES_HOST,
    port: input.env.POSTGRES_PORT,
    username: input.env.POSTGRES_USER,
    password: input.env.POSTGRES_PASSWORD,
    database: input.env.POSTGRES_DB,
    entities: input.entities,
    migrations: input.migrations ?? [],
    migrationsRun: input.migrationsRun ?? false,
    synchronize: false,
  };
}

export async function createDataSource(
  options: DataSourceOptions,
): Promise<DataSource> {
  const dataSource = new DataSource(options);

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

export async function runMigrations(dataSource: DataSource): Promise<void> {
  await dataSource.runMigrations();
}

export async function undoLastMigration(dataSource: DataSource): Promise<void> {
  await dataSource.undoLastMigration();
}

export async function destroyDataSource(
  dataSource: DataSource,
): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
