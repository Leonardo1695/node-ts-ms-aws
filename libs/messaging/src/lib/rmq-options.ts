import { Transport, type RmqOptions } from '@nestjs/microservices';

export const METRICS_UPDATED_QUEUE = 'metrics.updated';

export interface RmqConnectionOptions {
  url: string;
  queue?: string;
}

export function createRmqClientOptions(
  options: RmqConnectionOptions,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [options.url],
      queue: options.queue ?? METRICS_UPDATED_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  };
}

export function createRmqServerOptions(
  options: RmqConnectionOptions,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [options.url],
      queue: options.queue ?? METRICS_UPDATED_QUEUE,
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  };
}
