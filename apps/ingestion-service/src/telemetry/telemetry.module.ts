import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { KinesisModule } from '../kinesis/kinesis.module';
import { S3ArchiveModule } from '../s3/s3-archive.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [KinesisModule, S3ArchiveModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, ApiKeyGuard],
})
export class TelemetryModule {}
