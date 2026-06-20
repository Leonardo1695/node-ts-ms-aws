import {
  IDLE_BURN_RATE_LPM_BY_CLASS,
  IDLE_SPEED_THRESHOLD_KPH,
  telemetryEventSchema,
  type TelemetryEvent,
} from '@verdiron/domain';
import {
  fleetAssetProfiles,
  selectFleetProfiles,
  siteProfiles,
  type FleetAssetProfile,
} from './fleet-profiles';
import { createSeededRandom, createSeededUuid, type SeededRandom } from './seeded-random';

export interface TelemetryGeneratorOptions {
  seed?: number;
  fleetSize?: number;
  /** Simulated seconds between telemetry points (default 60). */
  tickSeconds?: number;
  startTime?: Date;
}

type AssetMode = 'off' | 'idle' | 'moving' | 'working';

interface AssetRuntimeState {
  profile: FleetAssetProfile;
  mode: AssetMode;
  modeTicksRemaining: number;
  engineOn: boolean;
  fuelLevelPct: number;
  engineHours: number;
  odometerKm: number;
  lat: number;
  lon: number;
  headingDeg: number;
  rpm: number;
  speedKph: number;
  lastTs: Date;
}

export class TelemetryGenerator {
  private readonly random: SeededRandom;
  private readonly tickSeconds: number;
  private readonly assets: AssetRuntimeState[];
  private cursor = 0;

  constructor(options: TelemetryGeneratorOptions = {}) {
    this.random = createSeededRandom(options.seed ?? 42);
    this.tickSeconds = options.tickSeconds ?? 60;
    const profiles = selectFleetProfiles(
      options.fleetSize ?? fleetAssetProfiles.length,
    );
    const startTime = options.startTime ?? new Date('2026-06-15T08:00:00.000Z');

    this.assets = profiles.map((profile) => this.createInitialAssetState(profile, startTime));
  }

  next(): TelemetryEvent {
    const asset = this.assets[this.cursor % this.assets.length]!;
    this.cursor += 1;
    return this.emitForAsset(asset);
  }

  nextBatch(count: number): TelemetryEvent[] {
    return Array.from({ length: count }, () => this.next());
  }

  advanceTick(): TelemetryEvent[] {
    return this.assets.map((asset) => this.emitForAsset(asset));
  }

  private createInitialAssetState(
    profile: FleetAssetProfile,
    startTime: Date,
  ): AssetRuntimeState {
    const site = siteProfiles[profile.siteId]!;
    const jitterLat = this.random.nextFloat(-0.002, 0.002);
    const jitterLon = this.random.nextFloat(-0.002, 0.002);

    return {
      profile,
      mode: profile.assetType === 'generator' ? 'idle' : 'off',
      modeTicksRemaining: this.random.nextInt(2, 8),
      engineOn: profile.assetType === 'generator',
      fuelLevelPct: this.random.nextFloat(55, 95),
      engineHours: this.random.nextFloat(800, 4200),
      odometerKm: this.random.nextFloat(1000, 48000),
      lat: site.lat + jitterLat,
      lon: site.lon + jitterLon,
      headingDeg: this.random.nextFloat(0, 359),
      rpm: 0,
      speedKph: 0,
      lastTs: new Date(startTime),
    };
  }

  private emitForAsset(asset: AssetRuntimeState): TelemetryEvent {
    this.advanceAssetState(asset);

    const event = telemetryEventSchema.parse({
      eventId: createSeededUuid(this.random),
      deviceId: asset.profile.deviceId,
      assetId: asset.profile.assetId,
      ts: asset.lastTs.toISOString(),
      lat: Number(asset.lat.toFixed(6)),
      lon: Number(asset.lon.toFixed(6)),
      speedKph: Number(asset.speedKph.toFixed(2)),
      engineOn: asset.engineOn,
      fuelLevelPct: Number(asset.fuelLevelPct.toFixed(2)),
      fuelRateLph: Number(this.calculateFuelRateLph(asset).toFixed(3)),
      engineHours: Number(asset.engineHours.toFixed(3)),
      odometerKm: Number(asset.odometerKm.toFixed(3)),
      rpm: Math.round(asset.rpm),
    });

    return event;
  }

  private advanceAssetState(asset: AssetRuntimeState): void {
    asset.lastTs = new Date(asset.lastTs.getTime() + this.tickSeconds * 1000);

    if (asset.modeTicksRemaining > 0) {
      asset.modeTicksRemaining -= 1;
    } else {
      asset.mode = this.pickNextMode(asset);
      asset.modeTicksRemaining = this.modeDuration(asset);
    }

    this.applyMode(asset);

    const hoursStep = this.tickSeconds / 3600;
    if (asset.engineOn) {
      asset.engineHours += hoursStep;
      asset.fuelLevelPct = Math.max(
        5,
        asset.fuelLevelPct - (this.calculateFuelRateLph(asset) * hoursStep) / 10,
      );
    }

    if (asset.speedKph > 0) {
      asset.odometerKm += asset.speedKph * hoursStep;
      const distanceKm = asset.speedKph * hoursStep;
      const radians = (asset.headingDeg * Math.PI) / 180;
      asset.lat += (distanceKm / 111) * Math.cos(radians);
      asset.lon += (distanceKm / (111 * Math.cos((asset.lat * Math.PI) / 180))) * Math.sin(radians);
    }
  }

  private pickNextMode(asset: AssetRuntimeState): AssetMode {
    const { assetType } = asset.profile;

    if (assetType === 'generator') {
      return this.random.next() < 0.92 ? 'idle' : 'off';
    }

    if (assetType === 'truck') {
      return this.random.pick(['off', 'idle', 'moving', 'moving', 'idle']);
    }

    if (assetType === 'excavator') {
      // Excavators spend noticeable time idling with engine on (demo idling KPIs).
      return this.random.pick(['idle', 'idle', 'idle', 'working', 'off']);
    }

    return this.random.pick(['idle', 'working', 'moving', 'off']);
  }

  private modeDuration(asset: AssetRuntimeState): number {
    switch (asset.mode) {
      case 'off':
        return this.random.nextInt(3, 12);
      case 'idle':
        return this.random.nextInt(8, 40);
      case 'moving':
        return this.random.nextInt(4, 18);
      case 'working':
        return this.random.nextInt(5, 25);
      default:
        return 5;
    }
  }

  private applyMode(asset: AssetRuntimeState): void {
    switch (asset.mode) {
      case 'off':
        asset.engineOn = false;
        asset.speedKph = 0;
        asset.rpm = 0;
        break;
      case 'idle':
        asset.engineOn = true;
        asset.speedKph = this.random.nextFloat(0, IDLE_SPEED_THRESHOLD_KPH - 0.1);
        asset.rpm = this.random.nextInt(650, 950);
        break;
      case 'moving':
        asset.engineOn = true;
        asset.speedKph = this.random.nextFloat(8, asset.profile.assetType === 'truck' ? 52 : 22);
        asset.rpm = this.random.nextInt(1100, 1900);
        asset.headingDeg = (asset.headingDeg + this.random.nextFloat(-25, 25) + 360) % 360;
        break;
      case 'working':
        asset.engineOn = true;
        asset.speedKph = this.random.nextFloat(2, 12);
        asset.rpm = this.random.nextInt(1200, 2100);
        break;
    }
  }

  /**
   * Fuel rate scales with RPM and load so idle burn stays low while working RPM draws more.
   * Base idle rate comes from domain idle burn constants (L/min → L/h).
   */
  private calculateFuelRateLph(asset: AssetRuntimeState): number {
    if (!asset.engineOn) {
      return 0;
    }

    const idleBurnLpm =
      IDLE_BURN_RATE_LPM_BY_CLASS[asset.profile.assetClass] ?? 0.5;
    const idleFuelLph = idleBurnLpm * 60;
    const rpmFactor = asset.rpm <= 0 ? 0 : asset.rpm / 850;
    const loadFactor =
      asset.mode === 'working' ? 1.8 : asset.mode === 'moving' ? 1.35 : 1;

    return idleFuelLph * rpmFactor * loadFactor;
  }
}
