import { Global, Module } from '@nestjs/common';
import { MetricsUpdatedConsumer } from './metrics-updated.consumer';

@Global()
@Module({
  controllers: [MetricsUpdatedConsumer],
})
export class MetricsEventsModule {}
