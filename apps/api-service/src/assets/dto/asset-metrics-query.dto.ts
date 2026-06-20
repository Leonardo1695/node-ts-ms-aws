import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { assetMetricsQuerySchema } from '@verdiron/domain';

export const assetMetricsQueryDtoSchema = assetMetricsQuerySchema;

export class AssetMetricsQueryDto extends createZodDto(
  assetMetricsQueryDtoSchema,
) {}

export type AssetMetricsQueryInput = z.infer<typeof assetMetricsQueryDtoSchema>;
