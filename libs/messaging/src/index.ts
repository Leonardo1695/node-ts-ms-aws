export {
  createAwsSdkClientConfig,
  type AwsEnvConfig,
  type AwsSdkClientConfig,
} from './lib/aws-client-config';
export { createKinesisClient } from './lib/kinesis-client';
export {
  decodeKinesisTelemetryRecord,
  encodeKinesisTelemetryRecord,
  type KinesisTelemetryRecord,
} from './lib/kinesis-telemetry-record';
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
  createSimControlClient,
  SimControlPublisher,
} from './lib/sim-control.publisher';
export {
  createEtlRunClient,
  EtlRunPublisher,
} from './lib/etl-run.publisher';
export {
  createRmqClientOptions,
  createRmqServerOptions,
  ETL_RUN_PATTERN,
  ETL_RUN_QUEUE,
  METRICS_UPDATED_QUEUE,
  SIM_CONTROL_QUEUE,
  SIM_START_PATTERN,
  SIM_STOP_PATTERN,
  type RmqConnectionOptions,
} from './lib/rmq-options';
