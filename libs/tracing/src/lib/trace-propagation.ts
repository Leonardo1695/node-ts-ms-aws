import {
  context,
  propagation,
  SpanStatusCode,
  trace,
  type Span,
} from '@opentelemetry/api';

export type TraceCarrier = Record<string, string>;

export function injectActiveTraceCarrier(): TraceCarrier | undefined {
  const carrier: TraceCarrier = {};
  propagation.inject(context.active(), carrier);
  return Object.keys(carrier).length > 0 ? carrier : undefined;
}

export function extractTraceContext(
  carrier: TraceCarrier | undefined,
): ReturnType<typeof context.active> {
  if (!carrier || Object.keys(carrier).length === 0) {
    return context.active();
  }

  return propagation.extract(context.active(), carrier);
}

export async function startLinkedSpan<T>(
  tracerName: string,
  spanName: string,
  parentCarrier: TraceCarrier | undefined,
  fn: (span: Span) => Promise<T> | T,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const parentContext = extractTraceContext(parentCarrier);
  const tracer = trace.getTracer(tracerName);

  return await context.with(parentContext, async () =>
    tracer.startActiveSpan(spanName, async (span) => {
      try {
        if (attributes) {
          for (const [key, value] of Object.entries(attributes)) {
            span.setAttribute(key, value);
          }
        }

        return await fn(span);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    }),
  );
}
