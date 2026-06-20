import {
  Global,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import {
  createMetricsUpdatedClient,
  MetricsUpdatedPublisher,
} from '@verdiron/messaging';

@Global()
@Module({
  providers: [
    {
      provide: MetricsUpdatedPublisher,
      useFactory: (config: ConfigService<Env, true>) =>
        new MetricsUpdatedPublisher(
          createMetricsUpdatedClient({
            url: config.getOrThrow('RABBITMQ_URL', { infer: true }),
          }),
        ),
      inject: [ConfigService],
    },
  ],
  exports: [MetricsUpdatedPublisher],
})
export class MessagingModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly publisher: MetricsUpdatedPublisher) {}

  async onModuleInit(): Promise<void> {
    await this.publisher.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.close();
  }
}
