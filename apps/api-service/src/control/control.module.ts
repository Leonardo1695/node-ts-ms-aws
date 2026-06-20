import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { SimControlStateService } from './sim-control-state.service';

@Module({
  controllers: [ControlController],
  providers: [ControlService, SimControlStateService, ApiKeyGuard],
})
export class ControlModule {}
