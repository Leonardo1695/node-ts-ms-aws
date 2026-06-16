import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import type { MetricsUpdatedEvent } from '@verdiron/domain';
import {
  createRmqClientOptions,
  METRICS_UPDATED_QUEUE,
  type RmqConnectionOptions,
} from './rmq-options';

@Injectable()
export class MetricsUpdatedPublisher {
  constructor(private readonly client: ClientProxy) {}

  publish(event: MetricsUpdatedEvent): void {
    this.client.emit(METRICS_UPDATED_QUEUE, event);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export function createMetricsUpdatedClient(
  options: RmqConnectionOptions,
): ClientProxy {
  return ClientProxyFactory.create(createRmqClientOptions(options));
}
