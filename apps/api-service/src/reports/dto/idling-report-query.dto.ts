import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { idlingReportQuerySchema } from '@verdiron/domain';

export const idlingReportQueryDtoSchema = idlingReportQuerySchema;

export class IdlingReportQueryDto extends createZodDto(
  idlingReportQueryDtoSchema,
) {}

export type IdlingReportQueryInput = z.infer<typeof idlingReportQueryDtoSchema>;
