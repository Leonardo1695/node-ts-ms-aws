import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import {
  resolveLoggerEnvironment,
  type LoggerEnvironment,
} from './correlation-id.constants';
import { buildLoggerModuleParams } from './logger.options';

export interface VerdironLoggerModuleOptions {
  environment?: LoggerEnvironment;
}

@Module({})
export class VerdironLoggerModule {
  static forRoot(
    options: VerdironLoggerModuleOptions = {},
  ): DynamicModule {
    const environment = options.environment ?? resolveLoggerEnvironment();

    return {
      module: VerdironLoggerModule,
      imports: [LoggerModule.forRoot(buildLoggerModuleParams(environment))],
      exports: [LoggerModule],
    };
  }
}
