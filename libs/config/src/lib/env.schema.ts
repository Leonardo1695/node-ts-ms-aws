import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),

  RABBITMQ_URL: z.string().url(),

  AWS_REGION: z.string().min(1).default('us-east-1'),
  AWS_ENDPOINT_URL: z.string().url().optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).default('test'),
  KINESIS_STREAM_NAME: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  DYNAMODB_TABLE_NAME: z.string().min(1),

  API_KEY: z.string().min(1),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url(),
  OTEL_SERVICE_NAME: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
