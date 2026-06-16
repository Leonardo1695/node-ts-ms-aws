import { z } from 'zod';
import { fuelTypeSchema } from './fuel-type.schema';

export const assetSchema = z.object({
  assetId: z.string().min(1),
  name: z.string().min(1),
  assetType: z.string().min(1),
  assetClass: z.string().min(1),
  siteId: z.string().min(1),
  fuelType: fuelTypeSchema,
  ratedPowerKw: z.number().nonnegative(),
});

export type Asset = z.infer<typeof assetSchema>;
