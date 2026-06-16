import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  validTelemetryBatch,
  validTelemetryEvent,
} from './telemetry.fixtures';
import {
  TelemetryAcceptedDto,
  telemetryIntakeSchema,
} from './dto/telemetry-intake.dto';
import {
  type TelemetryAcceptedResult,
  type TelemetryIntakePayload,
  TelemetryService,
} from './telemetry.service';

@ApiTags('telemetry')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest telemetry events',
    description:
      'Accepts a single TelemetryEvent object or a non-empty batch array.',
  })
  @ApiBody({
    description: 'Single TelemetryEvent or non-empty TelemetryEvent[] batch',
    examples: {
      single: {
        summary: 'Single event',
        value: validTelemetryEvent,
      },
      batch: {
        summary: 'Batch of events',
        value: validTelemetryBatch,
      },
    },
  })
  @ApiAcceptedResponse({
    type: TelemetryAcceptedDto,
    description: 'Events accepted for downstream processing',
  })
  @ApiBadRequestResponse({
    description: 'Payload failed zod validation',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  accept(
    @Body(new ZodValidationPipe(telemetryIntakeSchema))
    body: TelemetryIntakePayload,
  ): Promise<TelemetryAcceptedResult> {
    return this.telemetryService.accept(body);
  }
}
