import { DeviceSimulator } from './app';
import type { DeviceSimulatorEnv } from './config';

describe('DeviceSimulator', () => {
  const env: DeviceSimulatorEnv = {
    NODE_ENV: 'test',
    INGESTION_BASE_URL: 'http://localhost:3001',
    API_KEY: 'dev-api-key-change-me',
    RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
    SIMULATOR_PORT: 3010,
    SIM_SEED: 42,
  };

  it('returns idle status validated by domain schema', () => {
    const simulator = new DeviceSimulator(env);

    expect(simulator.getStatus()).toEqual({
      running: false,
      fleetSize: 0,
      emitRatePerSecond: 0,
      eventsEmitted: 0,
    });
  });

  it('creates a seeded telemetry generator', () => {
    const simulator = new DeviceSimulator(env);
    const generator = simulator.createGenerator({ fleetSize: 2 });

    expect(generator.nextBatch(2)).toHaveLength(2);
  });

  it('starts emit loop, posts to ingestion, and stops', async () => {
    jest.useFakeTimers();
    const postTelemetry = jest.fn().mockResolvedValue(undefined);
    const simulator = new DeviceSimulator(env, {
      ingestionClient: { postTelemetry },
    });

    simulator.start({ fleetSize: 2, emitRatePerSecond: 10 });
    expect(simulator.getStatus()).toMatchObject({
      running: true,
      fleetSize: 2,
      emitRatePerSecond: 10,
    });

    await jest.advanceTimersByTimeAsync(100);
    expect(postTelemetry).toHaveBeenCalledTimes(1);
    expect(simulator.getStatus().eventsEmitted).toBe(1);

    simulator.stop();
    expect(simulator.getStatus().running).toBe(false);

    await jest.advanceTimersByTimeAsync(500);
    expect(postTelemetry).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
