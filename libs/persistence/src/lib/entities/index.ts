import { AssetEntity } from './asset.entity';
import { SiteEntity } from './site.entity';
import { TelemetryEventEntity } from './telemetry-event.entity';

export { AssetEntity } from './asset.entity';
export { SiteEntity } from './site.entity';
export { TelemetryEventEntity } from './telemetry-event.entity';

export const persistenceEntities = [
  SiteEntity,
  AssetEntity,
  TelemetryEventEntity,
];
