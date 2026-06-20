import {
  Global,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import {
  createEtlRunClient,
  createSimControlClient,
  EtlRunPublisher,
  SimControlPublisher,
} from '@verdiron/messaging';

@Global()
@Module({
  providers: [
    {
      provide: SimControlPublisher,
      useFactory: (config: ConfigService<Env, true>) =>
        new SimControlPublisher(
          createSimControlClient({
            url: config.getOrThrow('RABBITMQ_URL', { infer: true }),
          }),
        ),
      inject: [ConfigService],
    },
    {
      provide: EtlRunPublisher,
      useFactory: (config: ConfigService<Env, true>) =>
        new EtlRunPublisher(
          createEtlRunClient({
            url: config.getOrThrow('RABBITMQ_URL', { infer: true }),
          }),
        ),
      inject: [ConfigService],
    },
  ],
  exports: [SimControlPublisher, EtlRunPublisher],
})
export class MessagingModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly simControlPublisher: SimControlPublisher,
    private readonly etlRunPublisher: EtlRunPublisher,
  ) {}

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.simControlPublisher.connect(),
      this.etlRunPublisher.connect(),
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.simControlPublisher.close(),
      this.etlRunPublisher.close(),
    ]);
  }
}
