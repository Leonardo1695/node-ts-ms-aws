import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryState } from '../components/ui/query-state';
import { useFleetMetrics, useDefaultFleetMetricsQuery } from '../hooks';

vi.mock('../lib/api/endpoints', () => ({
  getFleetMetrics: vi.fn(),
}));

import { getFleetMetrics } from '../lib/api/endpoints';

function FleetMetricsProbe() {
  const queryParams = useDefaultFleetMetricsQuery();
  const query = useFleetMetrics(queryParams);

  return (
    <QueryState query={query} loadingLabel="Loading fleet metrics…">
      {(response) => (
        <p>CO2 {response.data.totals.co2Kg.toFixed(1)}</p>
      )}
    </QueryState>
  );
}

describe('useFleetMetrics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.mocked(getFleetMetrics).mockResolvedValue({
      data: {
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-17T23:59:59.999Z',
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
            co2Kg: 120.5,
            fuelLiters: 45.2,
            idleMinutes: 300,
            utilizationPct: 42.5,
            trends: {
              co2KgRunningTotal: 120.5,
              co2KgMovingAvg3: 120.5,
              fuelLitersRunningTotal: 45.2,
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
        to: '2026-06-17T23:59:59.999Z',
        bucketCount: 1,
        cacheVersion: 1,
      },
    });
  });

  it('renders loading and success states', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <FleetMetricsProbe />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading fleet metrics…')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('CO2 120.5')).toBeInTheDocument();
    });
  });
});
