import { z } from 'zod';

export const fleetMetricsBucketSchema = z.object({
  bucketStart: z.string().datetime(),
  bucketEnd: z.string().datetime(),
  co2Kg: z.number().nonnegative(),
  fuelLiters: z.number().nonnegative(),
  idleMinutes: z.number().nonnegative(),
  utilizationPct: z.number().min(0).max(100),
});

export type FleetMetricsBucket = z.infer<typeof fleetMetricsBucketSchema>;

export const fleetMetricsSchema = z.object({
  siteId: z.string().min(1).optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  totals: z.object({
    co2Kg: z.number().nonnegative(),
    fuelLiters: z.number().nonnegative(),
    idleMinutes: z.number().nonnegative(),
    utilizationPct: z.number().min(0).max(100),
  }),
  buckets: z.array(fleetMetricsBucketSchema),
});

export type FleetMetrics = z.infer<typeof fleetMetricsSchema>;

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
