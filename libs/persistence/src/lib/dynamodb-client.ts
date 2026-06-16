import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Env } from '@verdiron/config';

export type DynamoEnvConfig = Pick<
  Env,
  | 'AWS_REGION'
  | 'AWS_ENDPOINT_URL'
  | 'AWS_ACCESS_KEY_ID'
  | 'AWS_SECRET_ACCESS_KEY'
  | 'DYNAMODB_TABLE_NAME'
>;

export function createDynamoDbClient(env: DynamoEnvConfig): DynamoDBClient {
  return new DynamoDBClient({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export function createDynamoDbDocumentClient(
  env: DynamoEnvConfig,
): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(createDynamoDbClient(env));
}

export async function listDynamoDbTables(
  client: DynamoDBClient,
): Promise<string[]> {
  const response = await client.send(new ListTablesCommand({}));
  return response.TableNames ?? [];
}

export async function dynamoTableExists(
  client: DynamoDBClient,
  tableName: string,
): Promise<boolean> {
  const tables = await listDynamoDbTables(client);
  return tables.includes(tableName);
}
