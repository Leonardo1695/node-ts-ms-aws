import { z } from 'zod';

export const metricsUpdatedEventSchema = z.object({
  assetId: z.string().min(1),
  siteId: z.string().min(1),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
});

export type MetricsUpdatedEvent = z.infer<typeof metricsUpdatedEventSchema>;
