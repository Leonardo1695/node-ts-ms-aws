import type { Env } from '@verdiron/config';

export type AwsEnvConfig = Pick<
  Env,
  | 'AWS_REGION'
  | 'AWS_ENDPOINT_URL'
  | 'AWS_ACCESS_KEY_ID'
  | 'AWS_SECRET_ACCESS_KEY'
>;

export interface AwsSdkClientConfig {
  region: string;
  endpoint?: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export function createAwsSdkClientConfig(
  env: AwsEnvConfig,
): AwsSdkClientConfig {
  return {
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  };
}
