import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@verdiron/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const expectedKey = 'dev-api-key-change-me';

  function createGuard(): ApiKeyGuard {
    const config = {
      get: jest.fn().mockReturnValue(expectedKey),
    } as unknown as ConfigService<Env, true>;

    return new ApiKeyGuard(config);
  }

  it('allows requests with a valid x-api-key header', () => {
    const guard = createGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': expectedKey },
        }),
      }),
    };

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('rejects missing or invalid API keys', () => {
    const guard = createGuard();
    const missingKeyContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };
    const invalidKeyContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': 'wrong-key' },
        }),
      }),
    };

    expect(() => guard.canActivate(missingKeyContext as never)).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(invalidKeyContext as never)).toThrow(
      UnauthorizedException,
    );
  });
});
