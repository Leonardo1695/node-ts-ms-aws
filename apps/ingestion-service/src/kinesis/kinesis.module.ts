import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import { createKinesisClient, KinesisProducer } from '@verdiron/messaging';

@Module({
  providers: [
    {
      provide: KinesisProducer,
      useFactory: (config: ConfigService<Env, true>) => {
        const client = createKinesisClient({
          AWS_REGION: config.getOrThrow('AWS_REGION', { infer: true }),
          AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
          AWS_ACCESS_KEY_ID: config.getOrThrow('AWS_ACCESS_KEY_ID', {
            infer: true,
          }),
          AWS_SECRET_ACCESS_KEY: config.getOrThrow('AWS_SECRET_ACCESS_KEY', {
            infer: true,
          }),
        });

        return new KinesisProducer({
          client,
          streamName: config.getOrThrow('KINESIS_STREAM_NAME', { infer: true }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [KinesisProducer],
})
export class KinesisModule {}
