import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetDetailPage } from './asset-detail-page';

vi.mock('../lib/api/endpoints', () => ({
  getAssetDetail: vi.fn(),
}));

import { getAssetDetail } from '../lib/api/endpoints';

describe('AssetDetailPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.mocked(getAssetDetail).mockResolvedValue({
      data: {
        metrics: {
          assetId: 'asset-exc-101',
          from: '2026-06-10T00:00:00.000Z',
          to: '2026-06-15T23:59:59.999Z',
          co2Kg: 42.5,
          fuelLiters: 18.2,
          idleMinutes: 90,
          idlePct: 22.5,
          utilizationPct: 61.3,
          fuelEfficiencyLph: 12.4,
        },
        recentTelemetry: [
          {
            eventId: '00000000-0000-4000-8000-000000000001',
            deviceId: 'dev-1',
            assetId: 'asset-exc-101',
            ts: '2026-06-15T11:00:00.000Z',
            lat: 0,
            lon: 0,
            speedKph: 0,
            engineOn: true,
            fuelLevelPct: 82,
            fuelRateLph: 4.2,
            engineHours: 99,
            odometerKm: 999,
            rpm: 800,
          },
        ],
      },
      meta: {
        units: {
          co2Kg: 'kg',
          fuelLiters: 'L',
          idleMinutes: 'min',
          idlePct: '%',
          utilizationPct: '%',
          fuelEfficiencyLph: 'L/h',
        },
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-15T23:59:59.999Z',
        assetId: 'asset-exc-101',
        recentTelemetryCount: 1,
        recentTelemetryLimit: 20,
        cacheVersion: 1,
      },
    });
  });

  it('renders KPI cards, history chart, telemetry table, and re-queries on filter change', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/assets/asset-exc-101']}>
          <Routes>
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('42.5')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Recent history' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent telemetry' })).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Recent events'), {
      target: { value: '50' },
    });

    await waitFor(() => {
      expect(getAssetDetail).toHaveBeenLastCalledWith(
        'asset-exc-101',
        expect.objectContaining({ recentLimit: 50 }),
      );
    });
  });
});
