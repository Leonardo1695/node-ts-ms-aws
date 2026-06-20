import { context, propagation, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  extractTraceContext,
  injectActiveTraceCarrier,
  startLinkedSpan,
} from './trace-propagation';

describe('trace propagation helpers', () => {
  let exporter: InMemorySpanExporter;
  let provider: NodeTracerProvider | undefined;

  beforeEach(async () => {
    await provider?.shutdown().catch(() => undefined);
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    exporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    provider.register();
  });

  afterEach(async () => {
    await provider?.shutdown().catch(() => undefined);
    exporter.reset();
    provider = undefined;
  });

  it('links a child span to an injected parent trace carrier', async () => {
    const tracer = trace.getTracer('ingestion-service');

    await tracer.startActiveSpan('telemetry.produce', async (parentSpan) => {
      const carrier = injectActiveTraceCarrier();

      await startLinkedSpan(
        'processing-service',
        'telemetry.consume',
        carrier,
        async () => undefined,
        { 'telemetry.event_id': '550e8400-e29b-41d4-a716-446655440000' },
      );

      parentSpan.end();
    });

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(2);
    const produceSpan = spans.find((span) => span.name === 'telemetry.produce');
    const consumeSpan = spans.find((span) => span.name === 'telemetry.consume');
    expect(consumeSpan?.spanContext().traceId).toBe(
      produceSpan?.spanContext().traceId,
    );
  });

  it('restores the extracted parent span as active context', () => {
    const tracer = trace.getTracer('ingestion-service');

    tracer.startActiveSpan('telemetry.produce', (parentSpan) => {
      const carrier = injectActiveTraceCarrier();
      const extracted = extractTraceContext(carrier);

      context.with(extracted, () => {
        expect(trace.getActiveSpan()?.spanContext().traceId).toBe(
          parentSpan.spanContext().traceId,
        );
      });

      parentSpan.end();
    });
  });
});
