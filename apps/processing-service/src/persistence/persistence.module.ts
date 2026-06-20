import {
  Global,
  Inject,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import {
  createDataSource,
  createDynamoDbDocumentClient,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  TelemetryEventRepository,
  TelemetryHotStore,
  MetricRollupRepository,
} from '@verdiron/persistence';
import type { DataSource } from 'typeorm';

export const VERDIRON_DATA_SOURCE = Symbol('VERDIRON_DATA_SOURCE');

@Global()
@Module({
  providers: [
    {
      provide: VERDIRON_DATA_SOURCE,
      useFactory: async (config: ConfigService<Env, true>) => {
        return createDataSource(
          createTypeOrmDataSourceOptions({
            env: {
              POSTGRES_HOST: config.getOrThrow('POSTGRES_HOST', { infer: true }),
              POSTGRES_PORT: config.getOrThrow('POSTGRES_PORT', { infer: true }),
              POSTGRES_USER: config.getOrThrow('POSTGRES_USER', { infer: true }),
              POSTGRES_PASSWORD: config.getOrThrow('POSTGRES_PASSWORD', {
                infer: true,
              }),
              POSTGRES_DB: config.getOrThrow('POSTGRES_DB', { infer: true }),
            },
            entities: persistenceEntities,
          }),
        );
      },
      inject: [ConfigService],
    },
    {
      provide: TelemetryEventRepository,
      useFactory: (dataSource: DataSource) =>
        new TelemetryEventRepository(dataSource),
      inject: [VERDIRON_DATA_SOURCE],
    },
    {
      provide: TelemetryHotStore,
      useFactory: (config: ConfigService<Env, true>) =>
        new TelemetryHotStore({
          client: createDynamoDbDocumentClient({
            AWS_REGION: config.getOrThrow('AWS_REGION', { infer: true }),
            AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
            AWS_ACCESS_KEY_ID: config.getOrThrow('AWS_ACCESS_KEY_ID', {
              infer: true,
            }),
            AWS_SECRET_ACCESS_KEY: config.getOrThrow('AWS_SECRET_ACCESS_KEY', {
              infer: true,
            }),
            DYNAMODB_TABLE_NAME: config.getOrThrow('DYNAMODB_TABLE_NAME', {
              infer: true,
            }),
          }),
          tableName: config.getOrThrow('DYNAMODB_TABLE_NAME', { infer: true }),
        }),
      inject: [ConfigService],
    },
    {
      provide: MetricRollupRepository,
      useFactory: (dataSource: DataSource) =>
        new MetricRollupRepository(dataSource),
      inject: [VERDIRON_DATA_SOURCE],
    },
  ],
  exports: [
    VERDIRON_DATA_SOURCE,
    TelemetryEventRepository,
    TelemetryHotStore,
    MetricRollupRepository,
  ],
})
export class PersistenceModule implements OnModuleDestroy {
  constructor(
    @Inject(VERDIRON_DATA_SOURCE) private readonly dataSource: DataSource,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await destroyDataSource(this.dataSource);
  }
}
