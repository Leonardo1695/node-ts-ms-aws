import type { FuelType } from '../fuel-type.schema';

/** One time-sliced telemetry observation used by the metric engine. */
export interface TelemetryInterval {
  /** Duration this sample represents, in minutes. */
  durationMinutes: number;
  engineOn: boolean;
  speedKph: number;
  /** Instantaneous fuel consumption rate while the engine is on. Units: L/h. */
  fuelRateLph: number;
}

/** Input bundle for deriving asset metrics from intervalized telemetry. */
export interface AssetMetricsInput {
  assetId: string;
  siteId: string;
  assetClass: string;
  fuelType: AssetMetricContribution['fuelType'];
  availableHours: number;
  intervals: TelemetryInterval[];
}

/** Per-asset metrics accumulated over an analysis window. */
export interface AssetMetricContribution {
  assetId: string;
  siteId: string;
  assetClass: string;
  fuelType: FuelType;
  co2Kg: number;
  fuelLiters: number;
  idleMinutes: number;
  activeEngineHours: number;
  availableHours: number;
}

/** Fleet-level (or grouped) rolled-up totals. */
export interface FleetRollupTotals {
  co2Kg: number;
  fuelLiters: number;
  idleMinutes: number;
  utilizationPct: number;
  assetCount: number;
}
