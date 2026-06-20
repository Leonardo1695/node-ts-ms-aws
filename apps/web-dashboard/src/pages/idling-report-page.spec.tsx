import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdlingReportPage } from './idling-report-page';

vi.mock('../lib/api/endpoints', () => ({
  getIdlingReport: vi.fn(),
}));

import { getIdlingReport } from '../lib/api/endpoints';

describe('IdlingReportPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.mocked(getIdlingReport).mockResolvedValue({
      data: {
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-15T23:59:59.999Z',
        entries: [
          {
            assetId: 'asset-exc-101',
            assetName: 'EX-101 Tiger',
            siteId: 'site-north-yard',
            idleMinutes: 120,
            idleFuelLiters: 96,
            idleCo2Kg: 257.3,
          },
          {
            assetId: 'asset-trk-301',
            assetName: 'TR-301 Haul Truck',
            siteId: 'site-south-quarry',
            idleMinutes: 60,
            idleFuelLiters: 48,
            idleCo2Kg: 128.6,
          },
        ],
      },
      meta: {
        units: {
          idleMinutes: 'min',
          idleFuelLiters: 'L',
          idleCo2Kg: 'kg',
        },
        from: '2026-06-10T00:00:00.000Z',
        to: '2026-06-15T23:59:59.999Z',
        limit: 20,
        entryCount: 2,
        cacheVersion: 1,
      },
    });
  });

  it('renders ranked offenders with fuel cost and re-queries when filters change', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <IdlingReportPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('EX-101 Tiger')).toBeInTheDocument();
    });

    expect(screen.getByText('TR-301 Haul Truck')).toBeInTheDocument();
    expect(screen.getByText(/158\.40/)).toBeInTheDocument();
    expect(screen.getByText(/257\.3/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ranked offenders' })).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('EX-101 Tiger');
    expect(rows[2]).toHaveTextContent('TR-301 Haul Truck');

    fireEvent.change(screen.getByLabelText('Site'), {
      target: { value: 'site-north-yard' },
    });

    await waitFor(() => {
      expect(getIdlingReport).toHaveBeenLastCalledWith(
        expect.objectContaining({ siteId: 'site-north-yard' }),
      );
    });
  });
});
