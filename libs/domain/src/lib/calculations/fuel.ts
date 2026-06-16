import type { TelemetryInterval } from './types';

/**
 * Fuel burned over a time interval at a constant rate.
 * Formula: fuelLiters = fuelRateLph × durationHours
 */
export function calculateFuelLitersFromRate(
  fuelRateLph: number,
  durationHours: number,
): number {
  if (fuelRateLph <= 0 || durationHours <= 0) {
    return 0;
  }

  return fuelRateLph * durationHours;
}

/** Sums fuel from telemetry intervals where the engine was on. Units: liters. */
export function sumFuelLitersFromIntervals(
  intervals: TelemetryInterval[],
): number {
  return intervals.reduce((total, interval) => {
    if (!interval.engineOn) {
      return total;
    }

    return (
      total +
      calculateFuelLitersFromRate(
        interval.fuelRateLph,
        interval.durationMinutes / 60,
      )
    );
  }, 0);
}
