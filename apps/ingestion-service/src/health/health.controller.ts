import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Liveness probe (alias)',
    deprecated: true,
    description: 'Prefer GET /health/live. Kept for backward compatibility.',
  })
  @ApiOkResponse({
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    description: 'Process is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({
    description: 'Service is ready to accept traffic',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  ready(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
