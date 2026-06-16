export {
  createAwsSdkClientConfig,
  type AwsEnvConfig,
  type AwsSdkClientConfig,
} from './lib/aws-client-config';
export { createKinesisClient } from './lib/kinesis-client';
export {
  InMemoryShardCheckpointStore,
  KinesisConsumer,
  type KinesisConsumerOptions,
  type KinesisRecordHandler,
  type ShardCheckpointStore,
} from './lib/kinesis-consumer';
export { KinesisProducer, type KinesisProducerOptions } from './lib/kinesis-producer';
export {
  createMetricsUpdatedClient,
  MetricsUpdatedPublisher,
} from './lib/metrics-updated.publisher';
export {
  createRmqClientOptions,
  createRmqServerOptions,
  METRICS_UPDATED_QUEUE,
  type RmqConnectionOptions,
} from './lib/rmq-options';
