import type {
  EtlRunCommand,
  SimStartCommand,
  SimStatus,
} from '@verdiron/domain';
import { EtlRunPublisher, SimControlPublisher } from '@verdiron/messaging';
import { Injectable } from '@nestjs/common';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { withApiSpan } from '../observability/api-tracing';
import { SimControlStateService } from './sim-control-state.service';

export interface ControlCommandResponse<TData> {
  data: TData;
  meta: {
    accepted: true;
    cacheVersion: number;
  };
}

export interface SimStatusResponse {
  data: SimStatus;
  meta: {
    cacheVersion: number;
  };
}

@Injectable()
export class ControlService {
  constructor(
    private readonly simControlPublisher: SimControlPublisher,
    private readonly etlRunPublisher: EtlRunPublisher,
    private readonly simControlState: SimControlStateService,
    private readonly metricsReadCache: MetricsReadCache,
  ) {}

  private cacheMeta(): { cacheVersion: number } {
    return { cacheVersion: this.metricsReadCache.getVersion() };
  }

  startSimulator(
    command: SimStartCommand,
  ): Promise<
    ControlCommandResponse<{ command: 'sim.start'; status: SimStatus }>
  > {
    return withApiSpan(
      'api.control.sim.start',
      {
        'verdiron.fleet_size': command.fleetSize,
        'verdiron.emit_rate_per_second': command.emitRatePerSecond,
      },
      async () => {
        this.simControlPublisher.start(command);
        const status = this.simControlState.markStarted(command);

        return {
          data: {
            command: 'sim.start',
            status,
          },
          meta: {
            accepted: true,
            ...this.cacheMeta(),
          },
        };
      },
    );
  }

  stopSimulator(): Promise<
    ControlCommandResponse<{
      command: 'sim.stop';
      status: SimStatus;
    }>
  > {
    return withApiSpan('api.control.sim.stop', {}, async () => {
      this.simControlPublisher.stop();
      const status = this.simControlState.markStopped();

      return {
        data: {
          command: 'sim.stop',
          status,
        },
        meta: {
          accepted: true,
          ...this.cacheMeta(),
        },
      };
    });
  }

  getSimulatorStatus(): Promise<SimStatusResponse> {
    return withApiSpan('api.control.sim.status', {}, async () => ({
      data: this.simControlState.getStatus(),
      meta: this.cacheMeta(),
    }));
  }

  runEtl(
    command: EtlRunCommand = {},
  ): Promise<
    ControlCommandResponse<{ command: 'etl.run'; request: EtlRunCommand }>
  > {
    return withApiSpan('api.control.etl.run', {}, async () => {
      this.etlRunPublisher.run(command);

      return {
        data: {
          command: 'etl.run',
          request: command,
        },
        meta: {
          accepted: true,
          ...this.cacheMeta(),
        },
      };
    });
  }
}
