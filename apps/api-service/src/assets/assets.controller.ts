import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
  AssetMetricsQueryDto,
  assetMetricsQueryDtoSchema,
} from './dto/asset-metrics-query.dto';
import { AssetsService, type AssetMetricsResponse } from './assets.service';

@ApiTags('assets')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':assetId/metrics')
  @ApiOperation({
    summary: 'Per-asset sustainability metrics and recent telemetry',
    description:
      'Aggregates KPIs from the metric_rollups materialized view for the requested ' +
      'half-open [from, to) window and attaches the latest raw telemetry events from DynamoDB.',
  })
  @ApiOkResponse({
    description: 'Asset metrics envelope with recent hot-store telemetry',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  getMetrics(
    @Param('assetId') assetId: string,
    @Query(new ZodValidationPipe(assetMetricsQueryDtoSchema))
    query: AssetMetricsQueryDto,
  ): Promise<AssetMetricsResponse> {
    return this.assetsService.getMetrics(assetId, query);
  }
}
