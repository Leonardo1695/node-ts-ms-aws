import type { IdlingReportEntry } from '@verdiron/domain';

/** Demo-only fuel price for idle waste cost display in the dashboard. */
export const DEMO_FUEL_PRICE_USD_PER_L = 1.65;

export interface IdlingReportSummary {
  offenderCount: number;
  totalIdleMinutes: number;
  totalIdleFuelLiters: number;
  totalIdleFuelCostUsd: number;
  totalIdleCo2Kg: number;
}

export function estimateIdleFuelCostUsd(idleFuelLiters: number): number {
  return idleFuelLiters * DEMO_FUEL_PRICE_USD_PER_L;
}

export function summarizeIdlingReport(
  entries: IdlingReportEntry[],
): IdlingReportSummary {
  const totals = entries.reduce(
    (accumulator, entry) => ({
      totalIdleMinutes: accumulator.totalIdleMinutes + entry.idleMinutes,
      totalIdleFuelLiters:
        accumulator.totalIdleFuelLiters + entry.idleFuelLiters,
      totalIdleCo2Kg: accumulator.totalIdleCo2Kg + entry.idleCo2Kg,
    }),
    {
      totalIdleMinutes: 0,
      totalIdleFuelLiters: 0,
      totalIdleCo2Kg: 0,
    },
  );

  return {
    offenderCount: entries.length,
    ...totals,
    totalIdleFuelCostUsd: estimateIdleFuelCostUsd(totals.totalIdleFuelLiters),
  };
}
