import { z } from 'zod';

export const simStartCommandSchema = z.object({
  fleetSize: z.coerce.number().int().min(1).max(100).default(8),
  emitRatePerSecond: z.coerce.number().min(0.1).max(100).default(1),
});

export type SimStartCommand = z.infer<typeof simStartCommandSchema>;

export const simStatusSchema = z.object({
  running: z.boolean(),
  fleetSize: z.number().int().nonnegative(),
  emitRatePerSecond: z.number().nonnegative(),
  eventsEmitted: z.number().int().nonnegative(),
});

export type SimStatus = z.infer<typeof simStatusSchema>;

export const etlRunCommandSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type EtlRunCommand = z.infer<typeof etlRunCommandSchema>;
