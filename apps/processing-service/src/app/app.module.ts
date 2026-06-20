import { Module } from '@nestjs/common';
import { VerdironConfigModule } from '@verdiron/config';
import { VerdironLoggerModule } from '@verdiron/logger';
import { HealthModule } from '../health/health.module';
import { KinesisModule } from '../kinesis/kinesis.module';
import { MessagingModule } from '../messaging/messaging.module';
import { TracingShutdownService } from '../lifecycle/tracing-shutdown.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [
    VerdironConfigModule,
    VerdironLoggerModule.forRoot(),
    PersistenceModule,
    MessagingModule,
    HealthModule,
    KinesisModule,
  ],
  providers: [TracingShutdownService],
})
export class AppModule {}
