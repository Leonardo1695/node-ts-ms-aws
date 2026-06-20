export function applyEnv(values: Record<string, string>): string[] {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }

  return Object.keys(values);
}

export function clearEnv(keys: string[]): void {
  for (const key of keys) {
    delete process.env[key];
  }
}

export function buildPipelineEnv(input: {
  postgresHost: string;
  postgresPort: number;
  postgresUser: string;
  postgresPassword: string;
  postgresDb: string;
  rabbitmqUrl: string;
  awsEndpointUrl: string;
}): Record<string, string> {
  return {
    NODE_ENV: 'test',
    POSTGRES_HOST: input.postgresHost,
    POSTGRES_PORT: String(input.postgresPort),
    POSTGRES_USER: input.postgresUser,
    POSTGRES_PASSWORD: input.postgresPassword,
    POSTGRES_DB: input.postgresDb,
    RABBITMQ_URL: input.rabbitmqUrl,
    AWS_REGION: 'us-east-1',
    AWS_ENDPOINT_URL: input.awsEndpointUrl,
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    KINESIS_STREAM_NAME: 'telemetry',
    S3_BUCKET_NAME: 'verdiron-raw',
    DYNAMODB_TABLE_NAME: 'telemetry-hot',
    API_KEY: 'dev-api-key-change-me',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
    OTEL_SERVICE_NAME: 'pipeline-integration',
  };
}
