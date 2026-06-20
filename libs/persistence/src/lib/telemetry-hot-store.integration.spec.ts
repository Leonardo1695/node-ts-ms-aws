import { CreateTableCommand, type DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GenericContainer, Wait } from 'testcontainers';
import type { TelemetryEvent } from '@verdiron/domain';
import {
  createDynamoDbClient,
  createDynamoDbDocumentClient,
} from './dynamodb-client';
import { TelemetryHotStore } from './telemetry-hot-store';

const integrationEnabled = process.env['RUN_INTEGRATION_TESTS'] === 'true';
const describeIntegration = integrationEnabled ? describe : describe.skip;

describeIntegration('telemetry hot store integration', () => {
  jest.setTimeout(180_000);

  it('stores and queries recent telemetry by asset in time order', async () => {
    const localstack = await new GenericContainer('localstack/localstack:3.4')
      .withEnvironment({
        SERVICES: 'dynamodb',
        DEFAULT_REGION: 'us-east-1',
      })
      .withExposedPorts(4566)
      .withWaitStrategy(Wait.forLogMessage(/Ready\./))
      .start();

    try {
      const endpoint = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`;
      const tableName = 'telemetry-hot';
      const env = {
        AWS_REGION: 'us-east-1',
        AWS_ENDPOINT_URL: endpoint,
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        DYNAMODB_TABLE_NAME: tableName,
      };

      const rawClient = createDynamoDbClient(env);
      const documentClient = createDynamoDbDocumentClient(env);

      await rawClient.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 2_000));

      const store = new TelemetryHotStore({
        client: documentClient,
        tableName,
      });

      const olderEvent: TelemetryEvent = {
        eventId: '550e8400-e29b-41d4-a716-446655440010',
        deviceId: 'dev-1',
        assetId: 'asset-exc-101',
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
      const newerEvent: TelemetryEvent = {
        ...olderEvent,
        eventId: '550e8400-e29b-41d4-a716-446655440011',
        ts: '2026-06-15T13:00:00.000Z',
        speedKph: 12,
      };

      await store.putEvent(olderEvent);
      await store.putEvent(newerEvent);

      const recent = await store.queryRecentByAsset('asset-exc-101', 2);

      expect(recent).toHaveLength(2);
      expect(recent[0]?.eventId).toBe(newerEvent.eventId);
      expect(recent[1]?.eventId).toBe(olderEvent.eventId);

      await (rawClient as DynamoDBClient).destroy();
    } finally {
      await localstack.stop();
    }
  });
});
