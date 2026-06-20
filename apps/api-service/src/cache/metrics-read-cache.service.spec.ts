import { MetricsReadCache } from './metrics-read-cache.service';

describe('MetricsReadCache', () => {
  it('clears cached entries and bumps version on invalidate', () => {
    const cache = new MetricsReadCache();
    cache.set('fleet:site-a', { totals: { co2Kg: 1 } });

    expect(cache.get('fleet:site-a')).toEqual({ totals: { co2Kg: 1 } });
    expect(cache.getVersion()).toBe(0);

    cache.invalidate({
      assetId: 'asset-1',
      siteId: 'site-a',
      windowStart: '2026-06-15T12:00:00.000Z',
      windowEnd: '2026-06-15T13:00:00.000Z',
    });

    expect(cache.get('fleet:site-a')).toBeUndefined();
    expect(cache.getVersion()).toBe(1);
  });
});
