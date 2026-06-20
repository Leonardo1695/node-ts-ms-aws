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
  IdlingReportQueryDto,
  idlingReportQueryDtoSchema,
} from './dto/idling-report-query.dto';
import { ReportsService, type IdlingReportResponse } from './reports.service';

@ApiTags('reports')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('idling')
  @ApiOperation({
    summary: 'Ranked idling and waste report',
    description:
      'Returns assets ordered by estimated idle CO2 waste in the half-open [from, to) window. ' +
      'Ranking uses SQL window functions: RANK() for tied scores and ROW_NUMBER() to cap results.',
  })
  @ApiOkResponse({
    description: 'Ordered idling offenders with idle fuel and CO2 estimates',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  getIdlingReport(
    @Query(new ZodValidationPipe(idlingReportQueryDtoSchema))
    query: IdlingReportQueryDto,
  ): Promise<IdlingReportResponse> {
    return this.reportsService.getIdlingReport(query);
  }
}
