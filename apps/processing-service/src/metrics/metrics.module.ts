import { Module } from '@nestjs/common';
import { MetricEngineService } from './metric-engine.service';
import { MetricRollupRefreshService } from './metric-rollup-refresh.service';

@Module({
  providers: [MetricEngineService, MetricRollupRefreshService],
  exports: [MetricEngineService, MetricRollupRefreshService],
})
export class MetricsModule {}
