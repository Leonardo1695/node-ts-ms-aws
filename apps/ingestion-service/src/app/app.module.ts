import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { VerdironConfigModule } from '@verdiron/config';
import { VerdironLoggerModule } from '@verdiron/logger';
import { HealthModule } from '../health/health.module';
import { TracingShutdownService } from '../lifecycle/tracing-shutdown.service';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [
    VerdironConfigModule,
    VerdironLoggerModule.forRoot(),
    HealthModule,
    TelemetryModule,
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
