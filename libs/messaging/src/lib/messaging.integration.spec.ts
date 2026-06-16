import { CreateStreamCommand, type KinesisClient } from '@aws-sdk/client-kinesis';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import amqp from 'amqplib';
import { GenericContainer, Wait } from 'testcontainers';
import type { TelemetryEvent } from '@verdiron/domain';
import { createKinesisClient } from './kinesis-client';
import { KinesisConsumer } from './kinesis-consumer';
import { KinesisProducer } from './kinesis-producer';
import { METRICS_UPDATED_QUEUE } from './rmq-options';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';

const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('messaging integration', () => {
  jest.setTimeout(180_000);

  it('publishes and consumes a RabbitMQ message', async () => {
    const rabbit = await new RabbitMQContainer('rabbitmq:3.13-management').start();

    try {
      const url = rabbit.getAmqpUrl();
      const payload = { assetId: 'asset-1', siteId: 'site-1' };

      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();
      await channel.assertQueue(METRICS_UPDATED_QUEUE, { durable: true });

      channel.sendToQueue(
        METRICS_UPDATED_QUEUE,
        Buffer.from(JSON.stringify(payload)),
      );

      const received = await new Promise<Record<string, string>>((resolve) => {
        void channel.consume(METRICS_UPDATED_QUEUE, (message) => {
          if (!message) {
            return;
          }

          resolve(JSON.parse(message.content.toString()) as Record<string, string>);
          channel.ack(message);
        });
      });

      await channel.close();
      await connection.close();

      expect(received).toEqual(payload);
    } finally {
      await rabbit.stop();
    }
  });

  it('writes and reads a Kinesis record via LocalStack', async () => {
    const localstack = await new GenericContainer('localstack/localstack:3.4')
      .withEnvironment({
        SERVICES: 'kinesis',
        DEFAULT_REGION: 'us-east-1',
      })
      .withExposedPorts(4566)
      .withWaitStrategy(Wait.forLogMessage(/Ready\./))
      .start();

    try {
      const endpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`;
      const env = {
        AWS_REGION: 'us-east-1',
        AWS_ENDPOINT_URL: endpoint,
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
      };

      const client = createKinesisClient(env);
      await client.send(
        new CreateStreamCommand({
          StreamName: 'telemetry',
          ShardCount: 1,
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 2_000));

      const event: TelemetryEvent = {
        eventId: '550e8400-e29b-41d4-a716-446655440001',
        deviceId: 'dev-1',
        assetId: 'asset-kinesis',
        ts: '2026-06-15T12:00:00.000Z',
        lat: 45.5,
        lon: -73.5,
        speedKph: 0,
        engineOn: true,
        fuelLevelPct: 50,
        fuelRateLph: 4,
        engineHours: 100,
        odometerKm: 1000,
        rpm: 900,
      };

      const producer = new KinesisProducer({ client, streamName: 'telemetry' });
      await producer.putEvent(event);

      const consumer = new KinesisConsumer({
        client,
        streamName: 'telemetry',
        shardIteratorType: 'TRIM_HORIZON',
      });

      let payload = '';
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const count = await consumer.pollOnce((records) => {
          payload = Buffer.from(records[0]?.Data ?? []).toString('utf8');
        });

        if (count > 0) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }

      expect(JSON.parse(payload)).toMatchObject({ assetId: 'asset-kinesis' });
      await (client as KinesisClient).destroy();
    } finally {
      await localstack.stop();
    }
  });
});
