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

export interface ShardCheckpointStore {
  getIterator(shardId: string): string | undefined;
  setIterator(shardId: string, iterator: string | undefined): void;
}

export class InMemoryShardCheckpointStore implements ShardCheckpointStore {
  private readonly iterators = new Map<string, string>();

  getIterator(shardId: string): string | undefined {
    return this.iterators.get(shardId);
  }

  setIterator(shardId: string, iterator: string | undefined): void {
    if (iterator) {
      this.iterators.set(shardId, iterator);
      return;
    }

    this.iterators.delete(shardId);
  }
}

export interface KinesisConsumerOptions {
  client: KinesisClient;
  streamName: string;
  shardIteratorType?: 'LATEST' | 'TRIM_HORIZON';
  checkpointStore?: ShardCheckpointStore;
}

export class KinesisConsumer {
  private readonly shardIteratorType: 'LATEST' | 'TRIM_HORIZON';
  private readonly checkpointStore: ShardCheckpointStore;

  constructor(private readonly options: KinesisConsumerOptions) {
    this.shardIteratorType = options.shardIteratorType ?? 'TRIM_HORIZON';
    this.checkpointStore =
      options.checkpointStore ?? new InMemoryShardCheckpointStore();
  }

  getCheckpointStore(): ShardCheckpointStore {
    return this.checkpointStore;
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

      processed += await this.pollShard(shard.ShardId, handler);
    }

    return processed;
  }

  private async pollShard(
    shardId: string,
    handler: KinesisRecordHandler,
  ): Promise<number> {
    let shardIterator = this.checkpointStore.getIterator(shardId);

    if (!shardIterator) {
      const iteratorResponse = await this.options.client.send(
        new GetShardIteratorCommand({
          StreamName: this.options.streamName,
          ShardId: shardId,
          ShardIteratorType: this.shardIteratorType,
        }),
      );

      shardIterator = iteratorResponse.ShardIterator;
    }

    if (!shardIterator) {
      return 0;
    }

    const recordsResponse = await this.options.client.send(
      new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
      }),
    );

    this.checkpointStore.setIterator(shardId, recordsResponse.NextShardIterator);

    const records = recordsResponse.Records ?? [];
    if (records.length > 0) {
      await handler(records);
    }

    return records.length;
  }
}
