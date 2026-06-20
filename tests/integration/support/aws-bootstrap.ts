import { CreateStreamCommand } from '@aws-sdk/client-kinesis';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { CreateBucketCommand } from '@aws-sdk/client-s3';
import { createKinesisClient } from '@verdiron/messaging';
import {
  createDynamoDbClient,
  createS3Client,
  type AwsEnvConfig,
} from '@verdiron/persistence';

export async function bootstrapLocalstackResources(
  env: AwsEnvConfig & {
    KINESIS_STREAM_NAME: string;
    S3_BUCKET_NAME: string;
    DYNAMODB_TABLE_NAME: string;
  },
): Promise<void> {
  const kinesis = createKinesisClient(env);

  try {
    await kinesis.send(
      new CreateStreamCommand({
        StreamName: env.KINESIS_STREAM_NAME,
        ShardCount: 1,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ResourceInUseException')) {
      throw error;
    }
  }

  const s3 = createS3Client(env);
  try {
    await s3.send(
      new CreateBucketCommand({
        Bucket: env.S3_BUCKET_NAME,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('BucketAlreadyOwnedByYou')) {
      throw error;
    }
  }

  const dynamo = createDynamoDbClient(env);
  try {
    await dynamo.send(
      new CreateTableCommand({
        TableName: env.DYNAMODB_TABLE_NAME,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ResourceInUseException')) {
      throw error;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2_000));

  await kinesis.destroy();
  await s3.destroy();
  await dynamo.destroy();
}
