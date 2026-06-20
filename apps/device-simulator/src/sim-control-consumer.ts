import {
  simStartCommandSchema,
  type SimStartCommand,
} from '@verdiron/domain';
import amqp, { type Channel, type ChannelModel } from 'amqplib';

export const SIM_CONTROL_QUEUE = 'sim.control';
export const SIM_START_PATTERN = 'sim.start';
export const SIM_STOP_PATTERN = 'sim.stop';

export interface SimControlHandlers {
  onStart(command: SimStartCommand): void;
  onStop(): void;
}

interface NestRmqEnvelope {
  pattern?: string;
  data?: unknown;
}

function parseNestRmqEnvelope(raw: Buffer): NestRmqEnvelope | null {
  try {
    const parsed = JSON.parse(raw.toString()) as NestRmqEnvelope;
    return parsed?.pattern ? parsed : null;
  } catch {
    return null;
  }
}

export function dispatchSimControlMessage(
  content: Buffer,
  handlers: SimControlHandlers,
): void {
  const envelope = parseNestRmqEnvelope(content);
  if (!envelope?.pattern) {
    return;
  }

  if (envelope.pattern === SIM_START_PATTERN) {
    const command = simStartCommandSchema.parse(envelope.data ?? {});
    handlers.onStart(command);
    return;
  }

  if (envelope.pattern === SIM_STOP_PATTERN) {
    handlers.onStop();
  }
}

export class SimControlConsumer {
  private connection: ChannelModel | undefined;
  private channel: Channel | undefined;

  constructor(
    private readonly url: string,
    private readonly handlers: SimControlHandlers,
  ) {}

  async start(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(SIM_CONTROL_QUEUE, { durable: true });

    await this.channel.consume(SIM_CONTROL_QUEUE, (message) => {
      if (!message || !this.channel) {
        return;
      }

      try {
        dispatchSimControlMessage(message.content, this.handlers);
      } catch (error) {
        console.error(
          JSON.stringify({
            service: 'device-simulator',
            msg: 'sim control message handling failed',
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      } finally {
        this.channel.ack(message);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = undefined;
    this.connection = undefined;
  }
}
