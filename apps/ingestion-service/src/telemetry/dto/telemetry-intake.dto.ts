import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { telemetryBatchSchema, telemetryEventSchema } from '@verdiron/domain';

export const telemetryIntakeSchema = z
  .union([telemetryEventSchema, telemetryBatchSchema])
  .meta({ id: 'TelemetryIntake' });

export const telemetryAcceptedSchema = z
  .object({
    accepted: z.number().int().positive(),
    eventIds: z.array(z.string().uuid()),
  })
  .meta({ id: 'TelemetryAccepted' });

export class TelemetryAcceptedDto extends createZodDto(telemetryAcceptedSchema) {}
