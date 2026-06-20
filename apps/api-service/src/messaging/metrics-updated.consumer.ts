import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { metricsUpdatedEventSchema } from '@verdiron/domain';
import { METRICS_UPDATED_QUEUE } from '@verdiron/messaging';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';

const tracer = trace.getTracer('api-service');

function parseMetricsUpdatedPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data: unknown }).data
  ) {
    return metricsUpdatedEventSchema.parse((payload as { data: unknown }).data);
  }

  return metricsUpdatedEventSchema.parse(payload);
}

@Controller()
export class MetricsUpdatedConsumer {
  private readonly logger = new Logger(MetricsUpdatedConsumer.name);

  constructor(private readonly metricsReadCache: MetricsReadCache) {}

  @EventPattern(METRICS_UPDATED_QUEUE)
  handleMetricsUpdated(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): void {
    tracer.startActiveSpan('api.metrics.invalidate', (span) => {
      try {
        const event = parseMetricsUpdatedPayload(payload);
        span.setAttribute('verdiron.asset_id', event.assetId);
        span.setAttribute('verdiron.site_id', event.siteId);
        this.metricsReadCache.invalidate(event);
        this.logger.log(
          `Invalidated metrics cache for ${event.siteId}/${event.assetId} [${event.windowStart}, ${event.windowEnd})`,
        );
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });

    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}
