import { S3Client } from '@aws-sdk/client-s3';
import {
  createAwsSdkClientConfig,
  type AwsEnvConfig,
} from './aws-client-config';

export function createS3Client(env: AwsEnvConfig): S3Client {
  const baseConfig = createAwsSdkClientConfig(env);

  return new S3Client({
    ...baseConfig,
    ...(env.AWS_ENDPOINT_URL && {
      endpoint: env.AWS_ENDPOINT_URL,
      forcePathStyle: true,
    }),
  });
}
