import type { FuelType } from '../fuel-type.schema';
import { CO2_KG_PER_LITER } from './constants';

/** Returns the CO2 combustion factor for a fuel type. Units: kg CO2 / L fuel. */
export function getCo2FactorKgPerLiter(fuelType: FuelType): number {
  return CO2_KG_PER_LITER[fuelType];
}

/**
 * Converts burned fuel volume into operational CO2 mass.
 * Formula: co2Kg = fuelLiters × factor(fuelType)
 */
export function calculateCo2Kg(
  fuelLiters: number,
  fuelType: FuelType,
): number {
  if (fuelLiters <= 0) {
    return 0;
  }

  return fuelLiters * getCo2FactorKgPerLiter(fuelType);
}
