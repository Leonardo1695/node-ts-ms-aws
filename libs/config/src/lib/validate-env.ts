import { envSchema, type Env } from './env.schema';
import { EnvValidationError } from './env-validation.error';

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new EnvValidationError(result.error);
  }

  return result.data;
}
