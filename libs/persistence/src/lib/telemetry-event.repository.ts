import type { TelemetryEvent } from '@verdiron/domain';
import type { DataSource, InsertResult } from 'typeorm';
import { TelemetryEventEntity } from './entities/telemetry-event.entity';

export function mapTelemetryEventToEntity(
  event: TelemetryEvent,
): TelemetryEventEntity {
  const entity = new TelemetryEventEntity();
  entity.eventId = event.eventId;
  entity.ts = new Date(event.ts);
  entity.deviceId = event.deviceId;
  entity.assetId = event.assetId;
  entity.lat = event.lat;
  entity.lon = event.lon;
  entity.speedKph = event.speedKph;
  entity.engineOn = event.engineOn;
  entity.fuelLevelPct = event.fuelLevelPct;
  entity.fuelRateLph = event.fuelRateLph;
  entity.engineHours = event.engineHours;
  entity.odometerKm = event.odometerKm;
  entity.rpm = event.rpm;
  return entity;
}

export class TelemetryEventRepository {
  constructor(private readonly dataSource: DataSource) {}

  async insertEvent(event: TelemetryEvent): Promise<InsertResult> {
    return this.dataSource
      .createQueryBuilder()
      .insert()
      .into(TelemetryEventEntity)
      .values(mapTelemetryEventToEntity(event))
      .orIgnore()
      .execute();
  }
}
