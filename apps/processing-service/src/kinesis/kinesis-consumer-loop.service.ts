import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { KinesisConsumer } from '@verdiron/messaging';
import { InMemoryEventIdempotencyStore } from './event-idempotency.store';
import { TelemetryRecordProcessor } from './telemetry-record.processor';

const DEFAULT_POLL_INTERVAL_MS = 1_000;

@Injectable()
export class KinesisConsumerLoopService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(KinesisConsumerLoopService.name);
  private running = false;
  private loopPromise: Promise<void> | undefined;

  constructor(
    private readonly consumer: KinesisConsumer,
    private readonly processor: TelemetryRecordProcessor,
    private readonly idempotencyStore: InMemoryEventIdempotencyStore,
  ) {}

  get processedEventCount(): number {
    return this.idempotencyStore.count();
  }

  onApplicationBootstrap(): void {
    this.running = true;
    this.loopPromise = this.runLoop();
  }

  async onApplicationShutdown(): Promise<void> {
    this.running = false;
    await this.loopPromise;
  }

  async pollOnce(): Promise<number> {
    const recordCount = await this.consumer.pollOnce(async (records) => {
      const result = await this.processor.processRecords(records);

      if (result.processed > 0 || result.skippedDuplicates > 0) {
        this.logger.debug(
          `Processed ${result.processed} telemetry event(s); skipped ${result.skippedDuplicates} duplicate(s)`,
        );
      }
    });

    return recordCount;
  }

  private async runLoop(): Promise<void> {
    while (this.running) {
      try {
        await this.pollOnce();
      } catch (error) {
        this.logger.error('Kinesis poll failed', error as Error);
      }

      await new Promise((resolve) => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
    }
  }
}
