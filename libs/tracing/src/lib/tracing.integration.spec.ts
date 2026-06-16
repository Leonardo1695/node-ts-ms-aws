import { trace } from '@opentelemetry/api';
import {
  buildTracingOptions,
  resetVerdironTracingForTests,
  shutdownVerdironTracing,
  startVerdironTracing,
} from '../index';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('tracing integration', () => {
  jest.setTimeout(120_000);

  afterEach(async () => {
    await shutdownVerdironTracing();
    resetVerdironTracingForTests();
  });

  it('exports a span to the local collector and Jaeger', async () => {
    const serviceName = 'tracing-integration-test';
    const sdk = startVerdironTracing(
      buildTracingOptions({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_SERVICE_NAME: serviceName,
      }),
    );

    expect(sdk).toBeDefined();

    const tracer = trace.getTracer('verdiron-tracing-integration');
    await tracer.startActiveSpan('integration-check-span', async (span) => {
      span.setAttribute('verdiron.test', 'vrd-015');
      span.end();
    });

    await shutdownVerdironTracing(sdk);

    let found = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch('http://localhost:16686/api/services');
      const body = (await response.json()) as { data?: string[] };

      if (body.data?.includes(serviceName)) {
        found = true;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    expect(found).toBe(true);
  });
});
