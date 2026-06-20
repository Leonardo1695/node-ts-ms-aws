import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService, type ReadinessResult } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness probe (alias)',
    deprecated: true,
    description: 'Prefer GET /health/live. Kept for backward compatibility.',
  })
  @ApiOkResponse({
    description: 'Service is running',
  })
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    description: 'Process is alive',
  })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Verifies PostgreSQL, RabbitMQ, and DynamoDB dependencies before accepting dashboard traffic.',
  })
  @ApiOkResponse({
    description: 'Dependencies are reachable',
  })
  @ApiServiceUnavailableResponse({
    description: 'One or more dependencies are unavailable',
  })
  async ready(): Promise<ReadinessResult> {
    const result = await this.healthService.checkReadiness();

    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
