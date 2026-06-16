# @verdiron/tracing

Shared OpenTelemetry bootstrap for Verdiron NestJS services.

Import and call `startVerdironTracing()` before other application imports so
auto-instrumentation can patch HTTP, Nest, pg/TypeORM, amqplib, and AWS SDK.
