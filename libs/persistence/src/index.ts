export { BaseEntity } from './lib/base.entity';
export {
  createAwsSdkClientConfig,
  type AwsEnvConfig,
  type AwsSdkClientConfig,
} from './lib/aws-client-config';
export {
  AssetEntity,
  SiteEntity,
  persistenceEntities,
} from './lib/entities';
export {
  createDynamoDbClient,
  createDynamoDbDocumentClient,
  dynamoTableExists,
  listDynamoDbTables,
  type DynamoEnvConfig,
} from './lib/dynamodb-client';
export { createS3Client } from './lib/s3-client';
export {
  TelemetryRawArchive,
  buildTelemetryRawArchiveKey,
  extractTelemetryPartitionDate,
  groupTelemetryEventsByPartition,
  type TelemetryArchivePartition,
  type TelemetryRawArchiveOptions,
} from './lib/telemetry-raw-archive';
export {
  referenceAssetIds,
  referenceAssets,
  referenceSiteIds,
  referenceSites,
  type ReferenceAssetSeed,
  type ReferenceSiteSeed,
} from './lib/seeds/reference-data.seed';
export {
  CreateMetricRollupsMatview1740000000002,
  CreatePartitionedTelemetryEvents1740000000001,
  CreateSitesAndAssets1740000000000,
  SeedReferenceData1740000000003,
  persistenceMigrations,
} from './lib/migrations';
export {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  runMigrations,
  undoLastMigration,
  type PostgresEnvConfig,
  type TypeOrmConfigInput,
} from './lib/typeorm-data-source';
