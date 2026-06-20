import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import type { SimStartCommand } from '@verdiron/domain';
import {
  createRmqClientOptions,
  SIM_CONTROL_QUEUE,
  SIM_START_PATTERN,
  SIM_STOP_PATTERN,
  type RmqConnectionOptions,
} from './rmq-options';

@Injectable()
export class SimControlPublisher {
  constructor(private readonly client: ClientProxy) {}

  start(command: SimStartCommand): void {
    this.client.emit(SIM_START_PATTERN, command);
  }

  stop(): void {
    this.client.emit(SIM_STOP_PATTERN, {});
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export function createSimControlClient(
  options: RmqConnectionOptions,
): ClientProxy {
  return ClientProxyFactory.create(
    createRmqClientOptions({
      ...options,
      queue: options.queue ?? SIM_CONTROL_QUEUE,
    }),
  );
}
