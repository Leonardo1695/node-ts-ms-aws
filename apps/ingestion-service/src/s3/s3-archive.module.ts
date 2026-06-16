import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import { createS3Client, TelemetryRawArchive } from '@verdiron/persistence';

@Module({
  providers: [
    {
      provide: TelemetryRawArchive,
      useFactory: (config: ConfigService<Env, true>) => {
        const client = createS3Client({
          AWS_REGION: config.getOrThrow('AWS_REGION', { infer: true }),
          AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
          AWS_ACCESS_KEY_ID: config.getOrThrow('AWS_ACCESS_KEY_ID', {
            infer: true,
          }),
          AWS_SECRET_ACCESS_KEY: config.getOrThrow('AWS_SECRET_ACCESS_KEY', {
            infer: true,
          }),
        });

        return new TelemetryRawArchive({
          client,
          bucketName: config.getOrThrow('S3_BUCKET_NAME', { infer: true }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [TelemetryRawArchive],
})
export class S3ArchiveModule {}
