import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import amqp from 'amqplib';
import { dynamoTableExists } from '@verdiron/persistence';
import { HealthService } from './health.service';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

jest.mock('@verdiron/persistence', () => {
  const actual = jest.requireActual('@verdiron/persistence');
  return {
    ...actual,
    dynamoTableExists: jest.fn(),
    createDynamoDbClient: jest.fn(() => ({
      destroy: jest.fn(),
    })),
  };
});

describe('HealthService', () => {
  const connect = amqp.connect as jest.Mock;
  const tableExists = dynamoTableExists as unknown as jest.Mock;

  beforeEach(() => {
    connect.mockReset();
    tableExists.mockReset();
  });

  it('returns ok when postgres, rabbitmq, and dynamodb are reachable', async () => {
    const dataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as DataSource;

    connect.mockResolvedValue({ close: jest.fn().mockResolvedValue(undefined) });
    tableExists.mockResolvedValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: VERDIRON_DATA_SOURCE,
          useValue: dataSource,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test',
                AWS_SECRET_ACCESS_KEY: 'test',
                DYNAMODB_TABLE_NAME: 'telemetry-hot',
              };
              return values[key];
            },
            get: () => 'http://localhost:4566',
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(HealthService);
    const result = await service.checkReadiness();

    expect(result.status).toBe('ok');
    expect(result.checks).toEqual({
      postgres: 'ok',
      rabbitmq: 'ok',
      dynamodb: 'ok',
    });
  });

  it('returns error when a dependency check fails', async () => {
    const dataSource = {
      isInitialized: false,
      query: jest.fn(),
    } as unknown as DataSource;

    connect.mockRejectedValue(new Error('connection refused'));
    tableExists.mockResolvedValue(true);

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: VERDIRON_DATA_SOURCE,
          useValue: dataSource,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test',
                AWS_SECRET_ACCESS_KEY: 'test',
                DYNAMODB_TABLE_NAME: 'telemetry-hot',
              };
              return values[key];
            },
            get: () => 'http://localhost:4566',
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(HealthService);
    const result = await service.checkReadiness();

    expect(result.status).toBe('error');
    expect(result.checks.postgres).toBe('error');
    expect(result.checks.rabbitmq).toBe('error');
  });
});
