import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createRmqServerOptions } from '@verdiron/messaging';
import { buildTracingOptions, startVerdironTracing } from '@verdiron/tracing';
import { AppModule } from './app/app.module';

startVerdironTracing(
  buildTracingOptions({
    OTEL_EXPORTER_OTLP_ENDPOINT:
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ?? 'http://localhost:4318',
    OTEL_SERVICE_NAME: 'api-service',
  }),
);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  app.connectMicroservice(
    createRmqServerOptions({
      url: process.env['RABBITMQ_URL'] ?? 'amqp://verdiron:verdiron@localhost:5672',
    }),
  );
  await app.startAllMicroservices();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Verdiron API Service')
    .setDescription(
      'Public read and control API for the Verdiron sustainability module',
    )
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
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env['API_PORT'] ?? 3003);
  await app.listen(port);
  logger.log(`API service listening on port ${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/docs`);
}

void bootstrap();
