import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { etlRunCommandSchema, simStartCommandSchema } from '@verdiron/domain';

export class SimStartCommandDto extends createZodDto(simStartCommandSchema) {}

export class EtlRunCommandDto extends createZodDto(etlRunCommandSchema) {}

export type SimStartCommandInput = z.infer<typeof simStartCommandSchema>;
export type EtlRunCommandInput = z.infer<typeof etlRunCommandSchema>;
