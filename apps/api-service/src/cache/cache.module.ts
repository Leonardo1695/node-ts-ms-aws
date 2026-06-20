import { Global, Module } from '@nestjs/common';
import { MetricsReadCache } from './metrics-read-cache.service';

@Global()
@Module({
  providers: [MetricsReadCache],
  exports: [MetricsReadCache],
})
export class CacheModule {}
