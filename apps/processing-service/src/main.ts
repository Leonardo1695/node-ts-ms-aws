import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { buildTracingOptions, startVerdironTracing } from '@verdiron/tracing';
import { AppModule } from './app/app.module';

startVerdironTracing(
  buildTracingOptions({
    OTEL_EXPORTER_OTLP_ENDPOINT:
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4318',
    OTEL_SERVICE_NAME: 'processing-service',
  }),
);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  const port = Number(process.env['PROCESSING_PORT'] ?? 3002);
  await app.listen(port);
  logger.log(`Processing service listening on port ${port}`);
  logger.log('Kinesis consumer with linked telemetry.consume spans active');
}

void bootstrap();
