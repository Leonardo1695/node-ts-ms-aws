import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { fleetMetricsQuerySchema } from '@verdiron/domain';

export const fleetMetricsQueryDtoSchema = fleetMetricsQuerySchema;

export class FleetMetricsQueryDto extends createZodDto(
  fleetMetricsQueryDtoSchema,
) {}

export type FleetMetricsQueryInput = z.infer<typeof fleetMetricsQueryDtoSchema>;
