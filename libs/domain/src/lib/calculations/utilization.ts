/**
 * Utilization measures how much of the available window the asset engine was active.
 * Formula: utilizationPct = (activeEngineHours / availableHours) × 100
 *
 * Result is capped at 100% to guard against clock skew or overlapping windows.
 */
export function calculateUtilizationPct(
  activeEngineHours: number,
  availableHours: number,
): number {
  if (availableHours <= 0 || activeEngineHours <= 0) {
    return 0;
  }

  const pct = (activeEngineHours / availableHours) * 100;
  return Math.min(pct, 100);
}
