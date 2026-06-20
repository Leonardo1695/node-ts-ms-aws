import { z } from 'zod';

export const deviceSimulatorEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  INGESTION_BASE_URL: z.string().url().default('http://localhost:3001'),
  API_KEY: z.string().min(1),
  RABBITMQ_URL: z.string().url(),
  SIMULATOR_PORT: z.coerce.number().int().positive().default(3010),
  SIM_SEED: z.coerce.number().int().nonnegative().default(42),
});

export type DeviceSimulatorEnv = z.infer<typeof deviceSimulatorEnvSchema>;

export function loadDeviceSimulatorConfig(
  env: NodeJS.ProcessEnv = process.env,
): DeviceSimulatorEnv {
  return deviceSimulatorEnvSchema.parse(env);
}
