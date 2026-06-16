import type { FuelType } from '../fuel-type.schema';

/**
 * Well-to-wheel CO2 emission factors for combustion fuels used in fleet assets.
 * Units: kilograms of CO2 per liter of fuel burned.
 *
 * Diesel (~2.68 kg CO2/L) and gasoline (~2.31 kg CO2/L) are standard IPCC-style
 * combustion factors used for operational emissions reporting.
 */
export const CO2_KG_PER_LITER: Record<FuelType, number> = {
  diesel: 2.68,
  gasoline: 2.31,
};

/**
 * Speed below which an engine-on asset is treated as idling.
 * Units: kilometers per hour.
 *
 * Heavy equipment often reports small GPS jitter while parked; 2 kph filters noise
 * without counting slow working speeds as idle.
 */
export const IDLE_SPEED_THRESHOLD_KPH = 2;

/**
 * Typical idle fuel burn by asset class when telematics does not stream fuel rate.
 * Units: liters per minute of idle time.
 *
 * Used to estimate idle fuel waste (and derived idle CO2) from idle duration alone.
 */
export const IDLE_BURN_RATE_LPM_BY_CLASS: Record<string, number> = {
  heavy: 0.8,
  medium: 0.5,
  light: 0.3,
};

/** Fallback idle burn rate when asset class is unknown. Units: L/min. */
export const DEFAULT_IDLE_BURN_RATE_LPM = 0.5;
