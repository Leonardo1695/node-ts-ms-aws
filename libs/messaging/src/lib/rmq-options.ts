import { Transport, type RmqOptions } from '@nestjs/microservices';

export const METRICS_UPDATED_QUEUE = 'metrics.updated';
export const SIM_CONTROL_QUEUE = 'sim.control';
export const ETL_RUN_QUEUE = 'etl.run';

export const SIM_START_PATTERN = 'sim.start';
export const SIM_STOP_PATTERN = 'sim.stop';
export const ETL_RUN_PATTERN = 'etl.run';

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
