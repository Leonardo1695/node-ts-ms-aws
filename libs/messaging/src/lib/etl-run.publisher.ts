import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import type { EtlRunCommand } from '@verdiron/domain';
import {
  createRmqClientOptions,
  ETL_RUN_PATTERN,
  ETL_RUN_QUEUE,
  type RmqConnectionOptions,
} from './rmq-options';

@Injectable()
export class EtlRunPublisher {
  constructor(private readonly client: ClientProxy) {}

  run(command: EtlRunCommand = {}): void {
    this.client.emit(ETL_RUN_PATTERN, command);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export function createEtlRunClient(
  options: RmqConnectionOptions,
): ClientProxy {
  return ClientProxyFactory.create(
    createRmqClientOptions({
      ...options,
      queue: options.queue ?? ETL_RUN_QUEUE,
    }),
  );
}
