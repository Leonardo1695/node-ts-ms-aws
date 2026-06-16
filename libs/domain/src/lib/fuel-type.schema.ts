import { z } from 'zod';

export const fuelTypeSchema = z.enum(['diesel', 'gasoline']);

export type FuelType = z.infer<typeof fuelTypeSchema>;
