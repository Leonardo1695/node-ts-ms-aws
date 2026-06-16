import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {
  resolveOtlpTracesUrl,
  type TracingBootstrapOptions,
} from './tracing.options';

let activeSdk: NodeSDK | undefined;

/**
 * Distributed tracing bootstrap for Verdiron NestJS services.
 *
 * Teaching note — span vs trace:
 * - A **span** is one timed operation (HTTP handler, DB query, Kinesis publish).
 * - A **trace** is the tree of spans for one request as it crosses services.
 * Import this module before other app imports so auto-instrumentation can patch
 * HTTP, Express/Nest, pg/TypeORM, amqplib, and AWS SDK clients.
 */
export function startVerdironTracing(
  options: TracingBootstrapOptions,
): NodeSDK | undefined {
  if (
    options.enabled === false ||
    process.env['OTEL_SDK_DISABLED'] === 'true'
  ) {
    return undefined;
  }

  if (activeSdk) {
    return activeSdk;
  }

  const sdk = new NodeSDK({
    autoDetectResources: false,
    resourceDetectors: [],
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: options.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: resolveOtlpTracesUrl(options.otlpEndpoint),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
        '@opentelemetry/instrumentation-amqplib': { enabled: true },
        '@opentelemetry/instrumentation-aws-sdk': { enabled: true },
      }),
    ],
  });

  sdk.start();
  activeSdk = sdk;
  return sdk;
}

export async function shutdownVerdironTracing(
  sdk: NodeSDK | undefined = activeSdk,
): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();

  if (sdk === activeSdk) {
    activeSdk = undefined;
  }
}

/** Test-only reset when verifying bootstrap idempotency. */
export function resetVerdironTracingForTests(): void {
  activeSdk = undefined;
}
