export type TracingEnvConfig = {
  OTEL_EXPORTER_OTLP_ENDPOINT: string;
  OTEL_SERVICE_NAME: string;
};

export interface TracingBootstrapOptions {
  serviceName: string;
  otlpEndpoint: string;
  enabled?: boolean;
}

export function buildTracingOptions(
  env: TracingEnvConfig,
): TracingBootstrapOptions {
  return {
    serviceName: env.OTEL_SERVICE_NAME,
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    enabled: true,
  };
}

export function resolveOtlpTracesUrl(endpoint: string): string {
  const normalized = endpoint.replace(/\/$/, '');

  if (normalized.endsWith('/v1/traces')) {
    return normalized;
  }

  return `${normalized}/v1/traces`;
}
