import { Module } from '@nestjs/common';
import { VerdironConfigModule } from '@verdiron/config';
import { VerdironLoggerModule } from '@verdiron/logger';
import { HealthModule } from '../health/health.module';
import { TracingShutdownService } from '../lifecycle/tracing-shutdown.service';

@Module({
  imports: [
    VerdironConfigModule,
    VerdironLoggerModule.forRoot(),
    HealthModule,
  ],
  providers: [TracingShutdownService],
})
export class AppModule {}
