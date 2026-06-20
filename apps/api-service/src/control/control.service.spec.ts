import { Test } from '@nestjs/testing';
import { EtlRunPublisher, SimControlPublisher } from '@verdiron/messaging';
import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { ControlService } from './control.service';
import { SimControlStateService } from './sim-control-state.service';

describe('ControlService', () => {
  it('publishes sim.start and updates local simulator status', async () => {
    const start = jest.fn();
    const service = new ControlService(
      { start, stop: jest.fn() } as unknown as SimControlPublisher,
      { run: jest.fn() } as unknown as EtlRunPublisher,
      new SimControlStateService(),
      new MetricsReadCache(),
    );

    const response = await service.startSimulator({
      fleetSize: 5,
      emitRatePerSecond: 2,
    });

    expect(start).toHaveBeenCalledWith({
      fleetSize: 5,
      emitRatePerSecond: 2,
    });
    expect(response.data.status.running).toBe(true);
    expect(response.data.status.fleetSize).toBe(5);
    expect(response.meta.accepted).toBe(true);
  });

  it('publishes etl.run commands', async () => {
    const run = jest.fn();
    const service = new ControlService(
      { start: jest.fn(), stop: jest.fn() } as unknown as SimControlPublisher,
      { run } as unknown as EtlRunPublisher,
      new SimControlStateService(),
      new MetricsReadCache(),
    );

    await service.runEtl({});

    expect(run).toHaveBeenCalledWith({});
  });
});
