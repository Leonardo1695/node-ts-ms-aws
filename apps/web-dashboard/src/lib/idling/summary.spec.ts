import { describe, expect, it } from 'vitest';
import {
  DEMO_FUEL_PRICE_USD_PER_L,
  estimateIdleFuelCostUsd,
  summarizeIdlingReport,
} from './summary';

describe('summarizeIdlingReport', () => {
  it('totals idle waste metrics across offenders', () => {
    const summary = summarizeIdlingReport([
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
    ]);

    expect(summary.offenderCount).toBe(2);
    expect(summary.totalIdleMinutes).toBe(180);
    expect(summary.totalIdleFuelLiters).toBe(144);
    expect(summary.totalIdleCo2Kg).toBeCloseTo(385.9);
    expect(summary.totalIdleFuelCostUsd).toBeCloseTo(144 * DEMO_FUEL_PRICE_USD_PER_L);
  });
});

describe('estimateIdleFuelCostUsd', () => {
  it('applies the demo fuel price per liter', () => {
    expect(estimateIdleFuelCostUsd(10)).toBeCloseTo(10 * DEMO_FUEL_PRICE_USD_PER_L);
  });
});
