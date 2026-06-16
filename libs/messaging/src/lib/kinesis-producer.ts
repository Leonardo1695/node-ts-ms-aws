import {
  KinesisClient,
  PutRecordsCommand,
  type PutRecordsRequestEntry,
} from '@aws-sdk/client-kinesis';
import type { TelemetryEvent } from '@verdiron/domain';

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
      const records: PutRecordsRequestEntry[] = batch.map((event) => ({
        PartitionKey: event.assetId,
        Data: Buffer.from(JSON.stringify(event)),
      }));

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
