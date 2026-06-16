import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import {
  CORRELATION_ID_HEADER,
  resolveLoggerEnvironment,
  type LoggerEnvironment,
} from './correlation-id.constants';

function readCorrelationIdHeader(req: IncomingMessage): string | undefined {
  const value = req.headers[CORRELATION_ID_HEADER];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function buildLoggerModuleParams(
  environment: LoggerEnvironment = resolveLoggerEnvironment(),
): Params {
  const usePrettyTransport = environment === 'development';

  return {
    pinoHttp: {
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const correlationId = readCorrelationIdHeader(req) ?? randomUUID();
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        return correlationId;
      },
      customProps: (req) => ({
        correlationId: req.id,
      }),
      ...(usePrettyTransport
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
              },
            },
          }
        : {}),
    },
  };
}
