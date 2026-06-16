import { KinesisClient } from '@aws-sdk/client-kinesis';
import {
  createAwsSdkClientConfig,
  type AwsEnvConfig,
} from './aws-client-config';

export function createKinesisClient(env: AwsEnvConfig): KinesisClient {
  return new KinesisClient(createAwsSdkClientConfig(env));
}
