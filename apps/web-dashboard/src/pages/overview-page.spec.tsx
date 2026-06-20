import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OverviewPage } from './overview-page';

vi.mock('../lib/api/endpoints', () => ({
  getFleetMetrics: vi.fn(),
}));

import { getFleetMetrics } from '../lib/api/endpoints';

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.mocked(getFleetMetrics).mockResolvedValue({
      data: {
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-15T23:59:59.999Z',
        bucket: 'day',
        totals: {
          co2Kg: 120.5,
          fuelLiters: 45.2,
          idleMinutes: 300,
          utilizationPct: 42.5,
        },
        buckets: [
          {
            bucketStart: '2026-06-10T00:00:00.000Z',
            bucketEnd: '2026-06-11T00:00:00.000Z',
            co2Kg: 20,
            fuelLiters: 8,
            idleMinutes: 50,
            utilizationPct: 40,
            trends: {
              co2KgRunningTotal: 20,
              co2KgMovingAvg3: 20,
              fuelLitersRunningTotal: 8,
              utilizationPctMovingAvg3: 40,
            },
          },
          {
            bucketStart: '2026-06-11T00:00:00.000Z',
            bucketEnd: '2026-06-12T00:00:00.000Z',
            co2Kg: 25,
            fuelLiters: 9,
            idleMinutes: 60,
            utilizationPct: 45,
            trends: {
              co2KgRunningTotal: 45,
              co2KgMovingAvg3: 22.5,
              fuelLitersRunningTotal: 17,
              utilizationPctMovingAvg3: 42.5,
            },
          },
        ],
      },
      meta: {
        units: {
          co2Kg: 'kg',
          fuelLiters: 'L',
          idleMinutes: 'min',
          utilizationPct: '%',
        },
        bucket: 'day',
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-15T23:59:59.999Z',
        bucketCount: 2,
        cacheVersion: 1,
      },
    });
  });

  it('renders KPI cards and re-queries when filters change', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <OverviewPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('120.5')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Trend' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Site'), {
      target: { value: 'site-north-yard' },
    });

    await waitFor(() => {
      expect(getFleetMetrics).toHaveBeenLastCalledWith(
        expect.objectContaining({ siteId: 'site-north-yard' }),
      );
    });
  });
});
