export {
  resetVerdironTracingForTests,
  shutdownVerdironTracing,
  startVerdironTracing,
} from './lib/tracing.bootstrap';
export {
  buildTracingOptions,
  resolveOtlpTracesUrl,
  type TracingBootstrapOptions,
  type TracingEnvConfig,
} from './lib/tracing.options';
export {
  extractTraceContext,
  injectActiveTraceCarrier,
  startLinkedSpan,
  type TraceCarrier,
} from './lib/trace-propagation';
