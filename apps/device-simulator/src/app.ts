import {
  simStatusSchema,
  type SimStartCommand,
  type SimStatus,
} from '@verdiron/domain';
import type { DeviceSimulatorEnv } from './config';
import { IngestionClient } from './ingestion-client';
import {
  TelemetryGenerator,
  type TelemetryGeneratorOptions,
} from './telemetry-generator';

export interface DeviceSimulatorDeps {
  ingestionClient?: Pick<IngestionClient, 'postTelemetry'>;
}

export class DeviceSimulator {
  private generator: TelemetryGenerator | undefined;
  private timer: NodeJS.Timeout | undefined;
  private status: SimStatus = {
    running: false,
    fleetSize: 0,
    emitRatePerSecond: 0,
    eventsEmitted: 0,
  };
  private readonly postTelemetry: (
    payload: Parameters<IngestionClient['postTelemetry']>[0],
  ) => Promise<void>;

  constructor(
    private readonly env: DeviceSimulatorEnv,
    deps: DeviceSimulatorDeps = {},
  ) {
    const ingestionClient =
      deps.ingestionClient ??
      new IngestionClient({
        baseUrl: env.INGESTION_BASE_URL,
        apiKey: env.API_KEY,
      });
    this.postTelemetry = ingestionClient.postTelemetry.bind(ingestionClient);
  }

  createGenerator(options: TelemetryGeneratorOptions = {}): TelemetryGenerator {
    this.generator = new TelemetryGenerator({
      seed: options.seed ?? this.env.SIM_SEED,
      fleetSize: options.fleetSize,
      tickSeconds: options.tickSeconds,
      startTime: options.startTime,
    });
    return this.generator;
  }

  getGenerator(): TelemetryGenerator | undefined {
    return this.generator;
  }

  start(command: SimStartCommand): SimStatus {
    this.stop();

    this.createGenerator({ fleetSize: command.fleetSize });
    const intervalMs = Math.max(10, Math.round(1000 / command.emitRatePerSecond));

    this.status = simStatusSchema.parse({
      running: true,
      fleetSize: command.fleetSize,
      emitRatePerSecond: command.emitRatePerSecond,
      eventsEmitted: this.status.eventsEmitted,
    });

    this.scheduleEmit(intervalMs);
    return this.getStatus();
  }

  stop(): SimStatus {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    this.status = simStatusSchema.parse({
      ...this.status,
      running: false,
    });

    return this.getStatus();
  }

  getStatus(): SimStatus {
    return { ...this.status };
  }

  getPublicConfig(): Pick<
    DeviceSimulatorEnv,
    'INGESTION_BASE_URL' | 'SIMULATOR_PORT'
  > {
    return {
      INGESTION_BASE_URL: this.env.INGESTION_BASE_URL,
      SIMULATOR_PORT: this.env.SIMULATOR_PORT,
    };
  }

  private scheduleEmit(intervalMs: number): void {
    this.timer = setTimeout(() => {
      void this.emitOnce().finally(() => {
        if (this.status.running) {
          this.scheduleEmit(intervalMs);
        }
      });
    }, intervalMs);
  }

  private async emitOnce(): Promise<void> {
    if (!this.generator) {
      return;
    }

    const event = this.generator.next();
    await this.postTelemetry(event);
    this.status = simStatusSchema.parse({
      ...this.status,
      eventsEmitted: this.status.eventsEmitted + 1,
    });
  }
}
