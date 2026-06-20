import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { MetricsUpdatedEvent } from '@verdiron/domain';
import {
  buildMetricRollupWindow,
  MetricRollupRepository,
} from '@verdiron/persistence';
import { MetricsUpdatedPublisher } from '@verdiron/messaging';

export const DEFAULT_METRIC_ROLLUP_DEBOUNCE_MS = 5_000;

function pendingEventKey(event: MetricsUpdatedEvent): string {
  return `${event.assetId}|${event.windowStart}`;
}

@Injectable()
export class MetricRollupRefreshService implements OnModuleDestroy {
  private readonly pending = new Map<string, MetricsUpdatedEvent>();
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = DEFAULT_METRIC_ROLLUP_DEBOUNCE_MS;

  constructor(
    private readonly metricRollupRepository: MetricRollupRepository,
    private readonly metricsUpdatedPublisher: MetricsUpdatedPublisher,
  ) {}

  scheduleRefresh(event: MetricsUpdatedEvent): void {
    this.pending.set(pendingEventKey(event), event);
    this.resetDebounceTimer();
  }

  scheduleRefreshForTelemetry(input: {
    assetId: string;
    siteId: string;
    ts: string;
  }): void {
    const { windowStart, windowEnd } = buildMetricRollupWindow(input.ts);
    this.scheduleRefresh({
      assetId: input.assetId,
      siteId: input.siteId,
      windowStart,
      windowEnd,
    });
  }

  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.pending.size === 0) {
      return;
    }

    const events = [...this.pending.values()];
    this.pending.clear();

    await this.metricRollupRepository.refresh();

    for (const event of events) {
      this.metricsUpdatedPublisher.publish(event);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush();
  }

  private resetDebounceTimer(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.flush();
    }, this.debounceMs);
  }
}
