import {
  GetRecordsCommand,
  GetShardIteratorCommand,
  KinesisClient,
  ListShardsCommand,
  type _Record,
} from '@aws-sdk/client-kinesis';

export type KinesisRecordHandler = (
  records: _Record[],
) => Promise<void> | void;

export interface KinesisConsumerOptions {
  client: KinesisClient;
  streamName: string;
  shardIteratorType?: 'LATEST' | 'TRIM_HORIZON';
}

export class KinesisConsumer {
  private readonly shardIteratorType: 'LATEST' | 'TRIM_HORIZON';

  constructor(private readonly options: KinesisConsumerOptions) {
    this.shardIteratorType = options.shardIteratorType ?? 'TRIM_HORIZON';
  }

  async pollOnce(handler: KinesisRecordHandler): Promise<number> {
    const shards = await this.options.client.send(
      new ListShardsCommand({ StreamName: this.options.streamName }),
    );

    let processed = 0;

    for (const shard of shards.Shards ?? []) {
      if (!shard.ShardId) {
        continue;
      }

      const iteratorResponse = await this.options.client.send(
        new GetShardIteratorCommand({
          StreamName: this.options.streamName,
          ShardId: shard.ShardId,
          ShardIteratorType: this.shardIteratorType,
        }),
      );

      if (!iteratorResponse.ShardIterator) {
        continue;
      }

      const recordsResponse = await this.options.client.send(
        new GetRecordsCommand({
          ShardIterator: iteratorResponse.ShardIterator,
          Limit: 100,
        }),
      );

      const records = recordsResponse.Records ?? [];
      if (records.length > 0) {
        await handler(records);
        processed += records.length;
      }
    }

    return processed;
  }
}
