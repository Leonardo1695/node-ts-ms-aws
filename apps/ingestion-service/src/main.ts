import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { buildTracingOptions, startVerdironTracing } from '@verdiron/tracing';
import { AppModule } from './app/app.module';

startVerdironTracing(
  buildTracingOptions({
    OTEL_EXPORTER_OTLP_ENDPOINT:
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4318',
    OTEL_SERVICE_NAME: 'ingestion-service',
  }),
);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Verdiron Ingestion Service')
    .setDescription('Telemetry intake API for the Verdiron sustainability module')
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key from the API_KEY environment variable',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  const port = Number(process.env['INGESTION_PORT'] ?? 3001);
  await app.listen(port);
  logger.log(`Ingestion service listening on port ${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/docs`);
}

void bootstrap();
