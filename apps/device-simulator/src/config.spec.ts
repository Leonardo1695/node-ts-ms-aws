import { loadDeviceSimulatorConfig } from './config';

describe('loadDeviceSimulatorConfig', () => {
  it('parses required simulator env vars', () => {
    const config = loadDeviceSimulatorConfig({
      NODE_ENV: 'test',
      INGESTION_BASE_URL: 'http://localhost:3001',
      API_KEY: 'dev-api-key-change-me',
      RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
      SIMULATOR_PORT: '3010',
    });

    expect(config.INGESTION_BASE_URL).toBe('http://localhost:3001');
    expect(config.SIMULATOR_PORT).toBe(3010);
    expect(config.SIM_SEED).toBe(42);
    expect(config.API_KEY).toBe('dev-api-key-change-me');
  });

  it('throws when API_KEY is missing', () => {
    expect(() =>
      loadDeviceSimulatorConfig({
        RABBITMQ_URL: 'amqp://verdiron:verdiron@localhost:5672',
      }),
    ).toThrow();
  });
});
