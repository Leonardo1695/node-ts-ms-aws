import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './app';

vi.stubEnv('VITE_API_KEY', 'test-api-key');

vi.mock('./lib/api/endpoints', () => ({
  getFleetMetrics: vi.fn().mockRejectedValue(new Error('offline in test')),
  getAssetDetail: vi.fn().mockRejectedValue(new Error('offline in test')),
  getIdlingReport: vi.fn().mockRejectedValue(new Error('offline in test')),
  getReadiness: vi.fn().mockRejectedValue(new Error('offline in test')),
  getSimStatus: vi.fn().mockRejectedValue(new Error('offline in test')),
}));

function renderApp(initialEntry: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppRoutes', () => {
  it('renders overview placeholder route', () => {
    renderApp('/');

    expect(
      screen.getByRole('heading', { name: 'Sustainability KPIs' }),
    ).toBeInTheDocument();
  });

  it('renders control panel route', () => {
    renderApp('/control');

    expect(
      screen.getByRole('heading', { name: 'Demo controls' }),
    ).toBeInTheDocument();
  });
});
