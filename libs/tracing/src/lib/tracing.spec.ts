import {
  buildTracingOptions,
  resolveOtlpTracesUrl,
} from './tracing.options';
import {
  resetVerdironTracingForTests,
  shutdownVerdironTracing,
  startVerdironTracing,
} from './tracing.bootstrap';

describe('tracing helpers', () => {
  afterEach(() => {
    resetVerdironTracingForTests();
  });

  it('builds tracing options from env', () => {
    expect(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_SERVICE_NAME: 'ingestion-service',
      }),
    ).toEqual({
      serviceName: 'ingestion-service',
      otlpEndpoint: 'http://localhost:4318',
      enabled: true,
    });
  });

  it('normalizes OTLP trace export URLs', () => {
    expect(resolveOtlpTracesUrl('http://localhost:4318')).toBe(
      'http://localhost:4318/v1/traces',
    );
    expect(resolveOtlpTracesUrl('http://localhost:4318/')).toBe(
      'http://localhost:4318/v1/traces',
    );
    expect(
      resolveOtlpTracesUrl('http://localhost:4318/v1/traces'),
    ).toBe('http://localhost:4318/v1/traces');
  });

  it('skips SDK startup when disabled', async () => {
    const sdk = startVerdironTracing({
      serviceName: 'disabled-service',
      otlpEndpoint: 'http://localhost:4318',
      enabled: false,
    });

    expect(sdk).toBeUndefined();
    await shutdownVerdironTracing(sdk);
  });
});
