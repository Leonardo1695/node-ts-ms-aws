import { Module } from '@nestjs/common';
import { MetricEngineService } from './metric-engine.service';

@Module({
  providers: [MetricEngineService],
  exports: [MetricEngineService],
})
export class MetricsModule {}
