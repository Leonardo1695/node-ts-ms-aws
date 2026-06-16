export const CORRELATION_ID_HEADER = 'x-correlation-id';

export type LoggerEnvironment = 'development' | 'production' | 'test';

export function resolveLoggerEnvironment(
  nodeEnv = process.env["NODE_ENV"],
): LoggerEnvironment {
  if (nodeEnv === 'production' || nodeEnv === 'test') {
    return nodeEnv;
  }

  return 'development';
}
