import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ApiController } from './api.controller';

@Module({
  controllers: [ApiController],
  providers: [ApiKeyGuard],
})
export class ApiModule {}
