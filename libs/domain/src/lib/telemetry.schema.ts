import { z } from 'zod';

export const telemetryEventSchema = z.object({
  eventId: z.string().uuid(),
  deviceId: z.string().min(1),
  assetId: z.string().min(1),
  ts: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speedKph: z.number().nonnegative(),
  engineOn: z.boolean(),
  fuelLevelPct: z.number().min(0).max(100),
  fuelRateLph: z.number().nonnegative(),
  engineHours: z.number().nonnegative(),
  odometerKm: z.number().nonnegative(),
  rpm: z.number().nonnegative(),
});

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

export const telemetryBatchSchema = z.array(telemetryEventSchema).min(1);

export type TelemetryBatch = z.infer<typeof telemetryBatchSchema>;
