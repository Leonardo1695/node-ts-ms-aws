import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createKinesisClient,
  InMemoryShardCheckpointStore,
  KinesisConsumer,
} from '@verdiron/messaging';
import { MetricEngineService } from '../metrics/metric-engine.service';
import { MetricsModule } from '../metrics/metrics.module';
import { InMemoryEventIdempotencyStore } from './event-idempotency.store';
import { KinesisConsumerLoopService } from './kinesis-consumer-loop.service';
import { TelemetryRecordProcessor } from './telemetry-record.processor';

export const TELEMETRY_EVENT_HANDLER = Symbol('TELEMETRY_EVENT_HANDLER');

@Module({
  imports: [MetricsModule],
  providers: [
    InMemoryEventIdempotencyStore,
    InMemoryShardCheckpointStore,
    {
      provide: KinesisConsumer,
      useFactory: (
        config: ConfigService<Env, true>,
        checkpointStore: InMemoryShardCheckpointStore,
      ) => {
        const client = createKinesisClient({
          AWS_REGION: config.getOrThrow('AWS_REGION', { infer: true }),
          AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
          AWS_ACCESS_KEY_ID: config.getOrThrow('AWS_ACCESS_KEY_ID', {
            infer: true,
          }),
          AWS_SECRET_ACCESS_KEY: config.getOrThrow('AWS_SECRET_ACCESS_KEY', {
            infer: true,
          }),
        });

        return new KinesisConsumer({
          client,
          streamName: config.getOrThrow('KINESIS_STREAM_NAME', { infer: true }),
          shardIteratorType: 'TRIM_HORIZON',
          checkpointStore,
        });
      },
      inject: [ConfigService, InMemoryShardCheckpointStore],
    },
    {
      provide: TelemetryRecordProcessor,
      useFactory: (
        idempotencyStore: InMemoryEventIdempotencyStore,
        onEvent: (event: TelemetryEvent) => Promise<void>,
      ) =>
        new TelemetryRecordProcessor({
          idempotencyStore,
          onEvent,
        }),
      inject: [InMemoryEventIdempotencyStore, TELEMETRY_EVENT_HANDLER],
    },
    {
      provide: TELEMETRY_EVENT_HANDLER,
      useFactory: (metricEngine: MetricEngineService) =>
        async (event: TelemetryEvent) => {
          await metricEngine.processEvent(event);
        },
      inject: [MetricEngineService],
    },
    KinesisConsumerLoopService,
  ],
  exports: [
    KinesisConsumer,
    KinesisConsumerLoopService,
    InMemoryEventIdempotencyStore,
    TelemetryRecordProcessor,
  ],
})
export class KinesisModule {}
