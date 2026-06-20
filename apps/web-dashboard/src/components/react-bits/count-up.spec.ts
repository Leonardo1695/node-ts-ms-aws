import { describe, expect, it } from 'vitest';
import { parseMetricNumber } from './count-up';

describe('parseMetricNumber', () => {
  it('parses integers and decimals', () => {
    expect(parseMetricNumber('120.5')).toEqual({ number: 120.5, decimals: 1 });
    expect(parseMetricNumber('1,234')).toEqual({ number: 1234, decimals: 0 });
  });

  it('returns null for non-numeric display values', () => {
    expect(parseMetricNumber('Yes')).toBeNull();
    expect(parseMetricNumber('')).toBeNull();
  });
});
