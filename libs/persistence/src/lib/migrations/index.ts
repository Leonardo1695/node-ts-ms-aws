import { CreateMetricRollupsMatview1740000000002 } from './1740000000002-CreateMetricRollupsMatview';
import { CreatePartitionedTelemetryEvents1740000000001 } from './1740000000001-CreatePartitionedTelemetryEvents';
import { CreateSitesAndAssets1740000000000 } from './1740000000000-CreateSitesAndAssets';
import { SeedReferenceData1740000000003 } from './1740000000003-SeedReferenceData';

export { CreateSitesAndAssets1740000000000 } from './1740000000000-CreateSitesAndAssets';
export { CreatePartitionedTelemetryEvents1740000000001 } from './1740000000001-CreatePartitionedTelemetryEvents';
export { CreateMetricRollupsMatview1740000000002 } from './1740000000002-CreateMetricRollupsMatview';
export { SeedReferenceData1740000000003 } from './1740000000003-SeedReferenceData';

export const persistenceMigrations = [
  CreateSitesAndAssets1740000000000,
  CreatePartitionedTelemetryEvents1740000000001,
  CreateMetricRollupsMatview1740000000002,
  SeedReferenceData1740000000003,
];
