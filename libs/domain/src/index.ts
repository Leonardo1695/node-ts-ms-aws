export { fuelTypeSchema, type FuelType } from './lib/fuel-type.schema';
export { siteSchema, type Site } from './lib/site.schema';
export { assetSchema, type Asset } from './lib/asset.schema';
export {
  telemetryEventSchema,
  telemetryBatchSchema,
  type TelemetryEvent,
  type TelemetryBatch,
} from './lib/telemetry.schema';
export {
  fleetMetricsBucketSchema,
  fleetMetricsSchema,
  assetMetricsSchema,
  idlingReportEntrySchema,
  idlingReportSchema,
  type FleetMetricsBucket,
  type FleetMetrics,
  type AssetMetrics,
  type IdlingReportEntry,
  type IdlingReport,
} from './lib/metrics.schema';
export {
  metricsUpdatedEventSchema,
  type MetricsUpdatedEvent,
} from './lib/events.schema';
export {
  calculateCo2Kg,
  calculateFuelEfficiencyLph,
  calculateFuelEfficiencyLpkm,
  calculateFuelLitersFromRate,
  calculateIdleCo2Kg,
  calculateIdleFuelLiters,
  calculateIdleMinutesForInterval,
  calculateUtilizationPct,
  computeAssetMetricsFromIntervals,
  getCo2FactorKgPerLiter,
  getIdleBurnRateLpm,
  isIdle,
  rollupByAssetClass,
  rollupBySite,
  rollupFleetTotals,
  sumFuelLitersFromIntervals,
  sumIdleMinutesFromIntervals,
  CO2_KG_PER_LITER,
  DEFAULT_IDLE_BURN_RATE_LPM,
  IDLE_BURN_RATE_LPM_BY_CLASS,
  IDLE_SPEED_THRESHOLD_KPH,
  type AssetMetricContribution,
  type AssetMetricsInput,
  type FleetRollupTotals,
  type TelemetryInterval,
} from './lib/calculations';
