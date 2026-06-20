import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import {
  createDynamoDbClient,
  dynamoTableExists,
} from '@verdiron/persistence';
import type { DataSource } from 'typeorm';
import amqp from 'amqplib';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

export type DependencyStatus = 'ok' | 'error';

export interface ReadinessChecks {
  postgres: DependencyStatus;
  rabbitmq: DependencyStatus;
  dynamodb: DependencyStatus;
}

export interface ReadinessResult {
  status: DependencyStatus;
  checks: ReadinessChecks;
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(VERDIRON_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async checkReadiness(): Promise<ReadinessResult> {
    const [postgres, rabbitmq, dynamodb] = await Promise.all([
      this.checkPostgres(),
      this.checkRabbitmq(),
      this.checkDynamodb(),
    ]);

    const checks: ReadinessChecks = {
      postgres,
      rabbitmq,
      dynamodb,
    };

    return {
      status: Object.values(checks).every((value) => value === 'ok')
        ? 'ok'
        : 'error',
      checks,
    };
  }

  private async checkPostgres(): Promise<DependencyStatus> {
    try {
      if (!this.dataSource.isInitialized) {
        return 'error';
      }

      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRabbitmq(): Promise<DependencyStatus> {
    const url = this.config.getOrThrow('RABBITMQ_URL', { infer: true });
    let connection: amqp.ChannelModel | undefined;

    try {
      connection = await amqp.connect(url);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      await connection?.close().catch(() => undefined);
    }
  }

  private async checkDynamodb(): Promise<DependencyStatus> {
    const client = createDynamoDbClient({
      AWS_REGION: this.config.getOrThrow('AWS_REGION', { infer: true }),
      AWS_ENDPOINT_URL: this.config.get('AWS_ENDPOINT_URL', { infer: true }),
      AWS_ACCESS_KEY_ID: this.config.getOrThrow('AWS_ACCESS_KEY_ID', {
        infer: true,
      }),
      AWS_SECRET_ACCESS_KEY: this.config.getOrThrow('AWS_SECRET_ACCESS_KEY', {
        infer: true,
      }),
      DYNAMODB_TABLE_NAME: this.config.getOrThrow('DYNAMODB_TABLE_NAME', {
        infer: true,
      }),
    });

    try {
      const tableName = this.config.getOrThrow('DYNAMODB_TABLE_NAME', {
        infer: true,
      });
      const exists = await dynamoTableExists(client, tableName);
      return exists ? 'ok' : 'error';
    } catch {
      return 'error';
    } finally {
      client.destroy();
    }
  }
}
