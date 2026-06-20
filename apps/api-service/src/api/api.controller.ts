import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';

export interface ApiMetaResponse {
  service: string;
  version: string;
}

@ApiTags('api')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1')
export class ApiController {
  @Get('meta')
  @ApiOperation({
    summary: 'API service metadata',
    description: 'Scaffold endpoint; asset and report routes land in VRD-042+.',
  })
  @ApiOkResponse({
    description: 'Service metadata',
    schema: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'api-service' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  meta(): ApiMetaResponse {
    return {
      service: 'api-service',
      version: '1.0.0',
    };
  }
}
