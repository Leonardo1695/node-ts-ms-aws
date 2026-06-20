import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3003');
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
  });

  it('sends x-api-key on every request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: {}, meta: {} }),
    });

    await apiRequest('/api/v1/sim/status', { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3003/api/v1/sim/status',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
      }),
    );
  });

  it('throws ApiError when the API rejects the request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(
      apiRequest('/api/v1/fleet/metrics', { fetchImpl }),
    ).rejects.toMatchObject({
      status: 401,
      body: 'Unauthorized',
    });
  });
});
