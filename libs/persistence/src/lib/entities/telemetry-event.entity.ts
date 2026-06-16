import {
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('telemetry_events')
export class TelemetryEventEntity {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @PrimaryColumn({ name: 'ts', type: 'timestamptz' })
  ts!: Date;

  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId!: string;

  @Column({ name: 'asset_id', type: 'varchar', length: 64 })
  assetId!: string;

  @Column({ type: 'numeric', precision: 9, scale: 6 })
  lat!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6 })
  lon!: number;

  @Column({ name: 'speed_kph', type: 'numeric', precision: 8, scale: 2 })
  speedKph!: number;

  @Column({ name: 'engine_on', type: 'boolean' })
  engineOn!: boolean;

  @Column({ name: 'fuel_level_pct', type: 'numeric', precision: 5, scale: 2 })
  fuelLevelPct!: number;

  @Column({ name: 'fuel_rate_lph', type: 'numeric', precision: 8, scale: 3 })
  fuelRateLph!: number;

  @Column({ name: 'engine_hours', type: 'numeric', precision: 12, scale: 2 })
  engineHours!: number;

  @Column({ name: 'odometer_km', type: 'numeric', precision: 12, scale: 2 })
  odometerKm!: number;

  @Column({ type: 'numeric', precision: 8, scale: 2 })
  rpm!: number;
}
