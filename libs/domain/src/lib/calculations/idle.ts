import type { FuelType } from '../fuel-type.schema';
import {
  DEFAULT_IDLE_BURN_RATE_LPM,
  IDLE_BURN_RATE_LPM_BY_CLASS,
  IDLE_SPEED_THRESHOLD_KPH,
} from './constants';
import { calculateCo2Kg } from './co2';
import type { TelemetryInterval } from './types';

/**
 * Idling = engine running but not materially moving.
 * Both conditions must hold for the full interval duration to count as idle.
 */
export function isIdle(engineOn: boolean, speedKph: number): boolean {
  return engineOn && speedKph < IDLE_SPEED_THRESHOLD_KPH;
}

/** Idle minutes contributed by a single interval (0 when not idle). */
export function calculateIdleMinutesForInterval(
  durationMinutes: number,
  engineOn: boolean,
  speedKph: number,
): number {
  if (durationMinutes <= 0 || !isIdle(engineOn, speedKph)) {
    return 0;
  }

  return durationMinutes;
}

/** Sums idle minutes across ordered telemetry intervals. */
export function sumIdleMinutesFromIntervals(
  intervals: TelemetryInterval[],
): number {
  return intervals.reduce(
    (total, interval) =>
      total +
      calculateIdleMinutesForInterval(
        interval.durationMinutes,
        interval.engineOn,
        interval.speedKph,
      ),
    0,
  );
}

/** Idle burn rate for an asset class. Units: liters per minute. */
export function getIdleBurnRateLpm(assetClass: string): number {
  return (
    IDLE_BURN_RATE_LPM_BY_CLASS[assetClass.toLowerCase()] ??
    DEFAULT_IDLE_BURN_RATE_LPM
  );
}

/**
 * Estimates fuel wasted while idling when only idle duration is known.
 * Formula: idleFuelLiters = idleMinutes × burnRateLpm(assetClass)
 */
export function calculateIdleFuelLiters(
  idleMinutes: number,
  assetClass: string,
): number {
  if (idleMinutes <= 0) {
    return 0;
  }

  return idleMinutes * getIdleBurnRateLpm(assetClass);
}

/** Idle CO2 derived from estimated idle fuel and asset fuel type. Units: kg. */
export function calculateIdleCo2Kg(
  idleMinutes: number,
  assetClass: string,
  fuelType: FuelType,
): number {
  return calculateCo2Kg(
    calculateIdleFuelLiters(idleMinutes, assetClass),
    fuelType,
  );
}
