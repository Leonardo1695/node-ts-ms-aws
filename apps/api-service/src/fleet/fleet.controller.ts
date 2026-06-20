import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  FleetMetricsQueryDto,
  fleetMetricsQueryDtoSchema,
} from './dto/fleet-metrics-query.dto';
import { FleetService, type FleetMetricsResponse } from './fleet.service';

@ApiTags('fleet')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Fleet sustainability metrics',
    description:
      'Returns bucketed KPIs and trend series from the metric_rollups materialized view. ' +
      'Trends use SQL window functions (running totals and 3-bucket moving averages). ' +
      'Time range is half-open [from, to).',
  })
  @ApiOkResponse({
    description: 'Fleet metrics envelope with units in meta',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  getMetrics(
    @Query(new ZodValidationPipe(fleetMetricsQueryDtoSchema))
    query: FleetMetricsQueryDto,
  ): Promise<FleetMetricsResponse> {
    return this.fleetService.getMetrics(query);
  }
}
