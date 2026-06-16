import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { CORRELATION_ID_HEADER } from './correlation-id.constants';
import { buildLoggerModuleParams } from './logger.options';
import { VerdironLoggerModule } from './logger.module';

@Controller()
class ProbeController {
  constructor(private readonly logger: PinoLogger) {}

  @Get('/probe')
  probe() {
    this.logger.info({ probe: true }, 'probe request');
    return { ok: true };
  }
}

describe('VerdironLoggerModule', () => {
  it('propagates correlation id across an HTTP call', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VerdironLoggerModule.forRoot({ environment: 'test' })],
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication({ logger: false });
    await app.init();

    const incomingId = 'corr-test-123';
    const response = await request(app.getHttpServer())
      .get('/probe')
      .set(CORRELATION_ID_HEADER, incomingId)
      .expect(200);

    expect(response.headers[CORRELATION_ID_HEADER]).toBe(incomingId);
    await app.close();
  });

  it('generates a correlation id when the header is missing', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot(buildLoggerModuleParams('test'))],
      controllers: [ProbeController],
    }).compile();

    const app = moduleRef.createNestApplication({ logger: false });
    await app.init();

    const response = await request(app.getHttpServer()).get('/probe').expect(200);

    expect(response.headers[CORRELATION_ID_HEADER]).toEqual(
      expect.any(String),
    );
    expect(response.headers[CORRELATION_ID_HEADER]).not.toHaveLength(0);
    await app.close();
  });
});
