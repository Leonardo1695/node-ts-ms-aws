import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  controllers: [FleetController],
  providers: [FleetService, ApiKeyGuard],
})
export class FleetModule {}
