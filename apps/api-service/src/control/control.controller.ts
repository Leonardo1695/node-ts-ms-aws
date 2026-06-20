import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { etlRunCommandSchema, simStartCommandSchema, type EtlRunCommand, type SimStatus } from '@verdiron/domain';
import { ApiKeyGuard } from '../auth/api-key.guard';
import {
  ControlService,
  type ControlCommandResponse,
  type SimStatusResponse,
} from './control.service';
import {
  EtlRunCommandDto,
  SimStartCommandDto,
} from './dto/control.dto';

@ApiTags('control')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/v1')
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Post('sim/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start the device simulator',
    description:
      'Publishes a sim.start command on RabbitMQ for the device-simulator to consume.',
  })
  @ApiAcceptedResponse({ description: 'Simulator start command accepted' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  startSimulator(
    @Body(new ZodValidationPipe(simStartCommandSchema))
    body: SimStartCommandDto,
  ): Promise<
    ControlCommandResponse<{ command: 'sim.start'; status: SimStatus }>
  > {
    return this.controlService.startSimulator(body);
  }

  @Post('sim/stop')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Stop the device simulator',
    description: 'Publishes a sim.stop command on RabbitMQ.',
  })
  @ApiAcceptedResponse({ description: 'Simulator stop command accepted' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  stopSimulator(): Promise<
    ControlCommandResponse<{
      command: 'sim.stop';
      status: SimStatus;
    }>
  > {
    return this.controlService.stopSimulator();
  }

  @Get('sim/status')
  @ApiOperation({
    summary: 'Device simulator status',
    description:
      'Returns the last known simulator state tracked by the API after start/stop commands.',
  })
  @ApiOkResponse({ description: 'Current simulator status' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  getSimulatorStatus(): Promise<SimStatusResponse> {
    return this.controlService.getSimulatorStatus();
  }

  @Post('etl/run')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger the Python ETL batch job',
    description: 'Publishes an etl.run command on RabbitMQ for the python-etl worker.',
  })
  @ApiAcceptedResponse({ description: 'ETL run command accepted' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid x-api-key header',
  })
  runEtl(
    @Body(new ZodValidationPipe(etlRunCommandSchema))
    body: EtlRunCommandDto,
  ): Promise<
    ControlCommandResponse<{
      command: 'etl.run';
      request: EtlRunCommand;
    }>
  > {
    return this.controlService.runEtl(body);
  }
}
