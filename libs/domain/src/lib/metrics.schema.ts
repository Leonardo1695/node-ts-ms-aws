import { z } from 'zod';
import { telemetryEventSchema } from './telemetry.schema';

export const fleetMetricsBucketGranularitySchema = z.enum([
  'hour',
  'day',
  'week',
]);

export type FleetMetricsBucketGranularity = z.infer<
  typeof fleetMetricsBucketGranularitySchema
>;

export const fleetMetricsQuerySchema = z.object({
  siteId: z.string().min(1).optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  bucket: fleetMetricsBucketGranularitySchema.default('hour'),
});

export type FleetMetricsQuery = z.infer<typeof fleetMetricsQuerySchema>;

export const fleetMetricsTrendSchema = z.object({
  co2KgRunningTotal: z.number().nonnegative(),
  co2KgMovingAvg3: z.number().nonnegative(),
  fuelLitersRunningTotal: z.number().nonnegative(),
  utilizationPctMovingAvg3: z.number().min(0).max(100),
});

export type FleetMetricsTrend = z.infer<typeof fleetMetricsTrendSchema>;

export const fleetMetricsBucketSchema = z.object({
  bucketStart: z.string().datetime(),
  bucketEnd: z.string().datetime(),
  co2Kg: z.number().nonnegative(),
  fuelLiters: z.number().nonnegative(),
  idleMinutes: z.number().nonnegative(),
  utilizationPct: z.number().min(0).max(100),
  trends: fleetMetricsTrendSchema,
});

export type FleetMetricsBucket = z.infer<typeof fleetMetricsBucketSchema>;

export const fleetMetricsTotalsSchema = z.object({
  co2Kg: z.number().nonnegative(),
  fuelLiters: z.number().nonnegative(),
  idleMinutes: z.number().nonnegative(),
  utilizationPct: z.number().min(0).max(100),
});

export type FleetMetricsTotals = z.infer<typeof fleetMetricsTotalsSchema>;

export const fleetMetricsSchema = z.object({
  siteId: z.string().min(1).optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  bucket: fleetMetricsBucketGranularitySchema,
  totals: fleetMetricsTotalsSchema,
  buckets: z.array(fleetMetricsBucketSchema),
});

export type FleetMetrics = z.infer<typeof fleetMetricsSchema>;

export const fleetMetricsUnitsSchema = z.object({
  co2Kg: z.literal('kg'),
  fuelLiters: z.literal('L'),
  idleMinutes: z.literal('min'),
  utilizationPct: z.literal('%'),
});

export type FleetMetricsUnits = z.infer<typeof fleetMetricsUnitsSchema>;

export const assetMetricsSchema = z.object({
  assetId: z.string().min(1),
  from: z.string().datetime(),
  to: z.string().datetime(),
  co2Kg: z.number().nonnegative(),
  fuelLiters: z.number().nonnegative(),
  idleMinutes: z.number().nonnegative(),
  idlePct: z.number().min(0).max(100),
  utilizationPct: z.number().min(0).max(100),
  fuelEfficiencyLph: z.number().nonnegative(),
});

export type AssetMetrics = z.infer<typeof assetMetricsSchema>;

export const assetMetricsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  recentLimit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AssetMetricsQuery = z.infer<typeof assetMetricsQuerySchema>;

export const assetDetailSchema = z.object({
  metrics: assetMetricsSchema,
  recentTelemetry: z.array(telemetryEventSchema),
});

export type AssetDetail = z.infer<typeof assetDetailSchema>;

export const assetMetricsUnitsSchema = z.object({
  co2Kg: z.literal('kg'),
  fuelLiters: z.literal('L'),
  idleMinutes: z.literal('min'),
  idlePct: z.literal('%'),
  utilizationPct: z.literal('%'),
  fuelEfficiencyLph: z.literal('L/h'),
});

export type AssetMetricsUnits = z.infer<typeof assetMetricsUnitsSchema>;

export const idlingReportEntrySchema = z.object({
  assetId: z.string().min(1),
  assetName: z.string().min(1),
  siteId: z.string().min(1),
  idleMinutes: z.number().nonnegative(),
  idleFuelLiters: z.number().nonnegative(),
  idleCo2Kg: z.number().nonnegative(),
});

export type IdlingReportEntry = z.infer<typeof idlingReportEntrySchema>;

export const idlingReportSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  entries: z.array(idlingReportEntrySchema),
});

export type IdlingReport = z.infer<typeof idlingReportSchema>;

export const idlingReportQuerySchema = z.object({
  siteId: z.string().min(1).optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type IdlingReportQuery = z.infer<typeof idlingReportQuerySchema>;

export const idlingReportUnitsSchema = z.object({
  idleMinutes: z.literal('min'),
  idleFuelLiters: z.literal('L'),
  idleCo2Kg: z.literal('kg'),
});

export type IdlingReportUnits = z.infer<typeof idlingReportUnitsSchema>;
