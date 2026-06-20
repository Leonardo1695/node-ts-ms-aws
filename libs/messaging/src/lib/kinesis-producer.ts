import {
  KinesisClient,
  PutRecordsCommand,
  type PutRecordsRequestEntry,
} from '@aws-sdk/client-kinesis';
import { context, propagation } from '@opentelemetry/api';
import type { TelemetryEvent } from '@verdiron/domain';
import { encodeKinesisTelemetryRecord } from './kinesis-telemetry-record';

export interface KinesisProducerOptions {
  client: KinesisClient;
  streamName: string;
  maxBatchSize?: number;
}

const DEFAULT_BATCH_SIZE = 500;

export class KinesisProducer {
  private readonly maxBatchSize: number;

  constructor(private readonly options: KinesisProducerOptions) {
    this.maxBatchSize = options.maxBatchSize ?? DEFAULT_BATCH_SIZE;
  }

  async putEvent(event: TelemetryEvent): Promise<void> {
    await this.putEvents([event]);
  }

  async putEvents(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    for (let index = 0; index < events.length; index += this.maxBatchSize) {
      const batch = events.slice(index, index + this.maxBatchSize);
      const records: PutRecordsRequestEntry[] = batch.map((event) => {
        const traceCarrier: Record<string, string> = {};
        propagation.inject(context.active(), traceCarrier);

        return {
          PartitionKey: event.assetId,
          Data: Buffer.from(
            encodeKinesisTelemetryRecord(
              event,
              Object.keys(traceCarrier).length > 0 ? traceCarrier : undefined,
            ),
          ),
        };
      });

      const response = await this.options.client.send(
        new PutRecordsCommand({
          StreamName: this.options.streamName,
          Records: records,
        }),
      );

      if (response.FailedRecordCount && response.FailedRecordCount > 0) {
        throw new Error(
          `Kinesis PutRecords failed for ${response.FailedRecordCount} record(s)`,
        );
      }
    }
  }
}
