import { MetricsReadCache } from '../cache/metrics-read-cache.service';
import { MetricsUpdatedConsumer } from './metrics-updated.consumer';

describe('MetricsUpdatedConsumer', () => {
  it('invalidates the metrics read cache on metrics.updated events', () => {
    const cache = new MetricsReadCache();
    cache.set('fleet:all', { data: {}, meta: {} });
    const consumer = new MetricsUpdatedConsumer(cache);

    consumer.handleMetricsUpdated(
      {
        assetId: 'asset-1',
        siteId: 'site-a',
        windowStart: '2026-06-15T12:00:00.000Z',
        windowEnd: '2026-06-15T13:00:00.000Z',
      },
      {
        getChannelRef: () => ({ ack: jest.fn() }),
        getMessage: () => ({}),
      } as never,
    );

    expect(cache.get('fleet:all')).toBeUndefined();
    expect(cache.getVersion()).toBe(1);
  });
});
