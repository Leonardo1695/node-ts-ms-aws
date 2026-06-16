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
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  TelemetryEventRepository,
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
  ],
  exports: [VERDIRON_DATA_SOURCE, TelemetryEventRepository],
})
export class PersistenceModule implements OnModuleDestroy {
  constructor(
    @Inject(VERDIRON_DATA_SOURCE) private readonly dataSource: DataSource,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await destroyDataSource(this.dataSource);
  }
}
