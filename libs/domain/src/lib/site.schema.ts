import { z } from 'zod';

export const siteSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
});

export type Site = z.infer<typeof siteSchema>;
