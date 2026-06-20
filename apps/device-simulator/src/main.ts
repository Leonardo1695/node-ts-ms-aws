import { createServer } from 'node:http';
import { DeviceSimulator } from './app';
import { loadDeviceSimulatorConfig } from './config';
import { SimControlConsumer } from './sim-control-consumer';

function log(payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ service: 'device-simulator', ...payload }));
}

async function bootstrap(): Promise<void> {
  const config = loadDeviceSimulatorConfig();
  const simulator = new DeviceSimulator(config);

  const simControl = new SimControlConsumer(config.RABBITMQ_URL, {
    onStart(command) {
      const status = simulator.start(command);
      log({ msg: 'simulation started', status });
    },
    onStop() {
      const status = simulator.stop();
      log({ msg: 'simulation stopped', status });
    },
  });

  await simControl.start();

  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/health/live') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url === '/status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(simulator.getStatus()));
      return;
    }

    res.writeHead(404).end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.SIMULATOR_PORT, () => resolve());
  });

  log({
    msg: 'device-simulator ready',
    port: config.SIMULATOR_PORT,
    ingestionBaseUrl: config.INGESTION_BASE_URL,
    status: simulator.getStatus(),
  });

  const shutdown = (signal: string) => {
    log({ msg: 'shutting down', signal });
    simulator.stop();
    server.close(() => {
      void simControl.close().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap().catch((error: unknown) => {
  log({
    msg: 'startup failed',
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
