import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvValidationError } from './env-validation.error';
import { validateEnv } from './validate-env';

const validEnv: Record<string, string> = {
  NODE_ENV: 'test',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'verdiron',
  POSTGRES_PASSWORD: 'verdiron',
  POSTGRES_DB: 'verdiron',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
  AWS_REGION: 'us-east-1',
  AWS_ENDPOINT_URL: 'http://localhost:4566',
  AWS_ACCESS_KEY_ID: 'test',
  AWS_SECRET_ACCESS_KEY: 'test',
  KINESIS_STREAM_NAME: 'telemetry',
  S3_BUCKET_NAME: 'verdiron-raw',
  DYNAMODB_TABLE_NAME: 'telemetry-hot',
  API_KEY: 'dev-api-key',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
  OTEL_SERVICE_NAME: 'test-service',
};

function applyEnv(values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

function clearEnv(keys: string[]): void {
  for (const key of keys) {
    delete process.env[key];
  }
}

describe('validateEnv', () => {
  it('returns typed config for valid env', () => {
    const env = validateEnv(validEnv);

    expect(env.POSTGRES_HOST).toBe('localhost');
    expect(env.API_KEY).toBe('dev-api-key');
    expect(env.POSTGRES_PORT).toBe(5432);
  });

  it('throws EnvValidationError for invalid env', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        RABBITMQ_URL: 'not-a-url',
        API_KEY: '',
      }),
    ).toThrow(EnvValidationError);

    try {
      validateEnv({ ...validEnv, RABBITMQ_URL: 'not-a-url' });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect((error as EnvValidationError).fieldErrors['RABBITMQ_URL']).toBeDefined();
    }
  });
});

describe('VerdironConfigModule', () => {
  const envKeys = Object.keys(validEnv);

  afterEach(() => {
    clearEnv(envKeys);
  });

  it('boots when env is valid', async () => {
    applyEnv(validEnv);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
        }),
      ],
    }).compile();

    expect(moduleRef.get(ConfigService).get('API_KEY')).toBe('dev-api-key');
  });
});
