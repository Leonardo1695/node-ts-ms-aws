import { Injectable } from '@nestjs/common';
import type { SimStartCommand, SimStatus } from '@verdiron/domain';

@Injectable()
export class SimControlStateService {
  private status: SimStatus = {
    running: false,
    fleetSize: 0,
    emitRatePerSecond: 0,
    eventsEmitted: 0,
  };

  getStatus(): SimStatus {
    return { ...this.status };
  }

  markStarted(command: SimStartCommand): SimStatus {
    this.status = {
      running: true,
      fleetSize: command.fleetSize,
      emitRatePerSecond: command.emitRatePerSecond,
      eventsEmitted: this.status.eventsEmitted,
    };

    return this.getStatus();
  }

  markStopped(): SimStatus {
    this.status = {
      ...this.status,
      running: false,
    };

    return this.getStatus();
  }
}
