import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { VerdironConfigModule } from '@verdiron/config';
import { VerdironLoggerModule } from '@verdiron/logger';
import { ApiModule } from '../api/api.module';
import { AssetsModule } from '../assets/assets.module';
import { CacheModule } from '../cache/cache.module';
import { ControlModule } from '../control/control.module';
import { FleetModule } from '../fleet/fleet.module';
import { MessagingModule } from '../messaging/messaging.module';
import { MetricsEventsModule } from '../messaging/metrics-events.module';
import { ReportsModule } from '../reports/reports.module';
import { HealthModule } from '../health/health.module';
import { TracingShutdownService } from '../lifecycle/tracing-shutdown.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [
    VerdironConfigModule,
    VerdironLoggerModule.forRoot(),
    HealthModule,
    CacheModule,
    MessagingModule,
    MetricsEventsModule,
    PersistenceModule,
    ApiModule,
    FleetModule,
    AssetsModule,
    ReportsModule,
    ControlModule,
  ],
  providers: [
    TracingShutdownService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
