import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlPanelPage } from './control-panel-page';

vi.mock('../lib/api/endpoints', () => ({
  getReadiness: vi.fn(),
  getSimStatus: vi.fn(),
  startSimulator: vi.fn(),
  stopSimulator: vi.fn(),
  runEtl: vi.fn(),
}));

import {
  getReadiness,
  getSimStatus,
  runEtl,
  startSimulator,
  stopSimulator,
} from '../lib/api/endpoints';

describe('ControlPanelPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.mocked(getReadiness).mockResolvedValue({
      status: 'ok',
      checks: {
        postgres: 'ok',
        rabbitmq: 'ok',
        dynamodb: 'ok',
      },
    });
    vi.mocked(getSimStatus).mockResolvedValue({
      data: {
        running: true,
        fleetSize: 8,
        emitRatePerSecond: 1,
        eventsEmitted: 42,
      },
      meta: { cacheVersion: 1 },
    });
    vi.mocked(startSimulator).mockResolvedValue({
      data: {
        command: 'sim.start',
        status: {
          running: true,
          fleetSize: 4,
          emitRatePerSecond: 2,
          eventsEmitted: 0,
        },
      },
      meta: { accepted: true, cacheVersion: 1 },
    });
    vi.mocked(stopSimulator).mockResolvedValue({
      data: {
        command: 'sim.stop',
        status: {
          running: false,
          fleetSize: 4,
          emitRatePerSecond: 2,
          eventsEmitted: 42,
        },
      },
      meta: { accepted: true, cacheVersion: 1 },
    });
    vi.mocked(runEtl).mockResolvedValue({
      data: {
        command: 'etl.run',
        request: {},
      },
      meta: { accepted: true, cacheVersion: 1 },
    });
  });

  it('shows health indicators and sends control commands', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ControlPanelPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Platform health')).toBeInTheDocument();
      expect(screen.getAllByText('Connected')).toHaveLength(3);
    });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Fleet size'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Emit rate (events/s)'), {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start simulator' }));

    await waitFor(() => {
      expect(startSimulator).toHaveBeenCalledWith({
        fleetSize: 4,
        emitRatePerSecond: 2,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Stop simulator' }));

    await waitFor(() => {
      expect(stopSimulator).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Run ETL' }));

    await waitFor(() => {
      expect(runEtl).toHaveBeenCalled();
    });
  });
});
