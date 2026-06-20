import { MetricRollupRefreshService, DEFAULT_METRIC_ROLLUP_DEBOUNCE_MS } from './metric-rollup-refresh.service';

describe('MetricRollupRefreshService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces refresh and publishes coalesced metrics.updated events', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    const publish = jest.fn();
    const service = new MetricRollupRefreshService(
      { refresh } as never,
      { publish } as never,
    );

    service.scheduleRefresh({
      assetId: 'asset-1',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });
    service.scheduleRefresh({
      assetId: 'asset-2',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });
    service.scheduleRefresh({
      assetId: 'asset-1',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });

    expect(refresh).not.toHaveBeenCalled();

    jest.advanceTimersByTime(DEFAULT_METRIC_ROLLUP_DEBOUNCE_MS);
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledWith({
      assetId: 'asset-1',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });
    expect(publish).toHaveBeenCalledWith({
      assetId: 'asset-2',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });
  });

  it('flushes pending refresh on module destroy', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    const publish = jest.fn();
    const service = new MetricRollupRefreshService(
      { refresh } as never,
      { publish } as never,
    );

    service.scheduleRefreshForTelemetry({
      assetId: 'asset-exc-101',
      siteId: 'site-north-yard',
      ts: '2026-06-15T14:30:00.000Z',
    });

    await service.onModuleDestroy();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith({
      assetId: 'asset-exc-101',
      siteId: 'site-north-yard',
      windowStart: '2026-06-15T14:00:00.000Z',
      windowEnd: '2026-06-15T15:00:00.000Z',
    });
  });
});
