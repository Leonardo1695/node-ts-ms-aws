/**
 * Fuel efficiency in liters consumed per engine hour.
 * Formula: fuelEfficiencyLph = fuelLiters / engineHours
 */
export function calculateFuelEfficiencyLph(
  fuelLiters: number,
  engineHours: number,
): number {
  if (fuelLiters <= 0 || engineHours <= 0) {
    return 0;
  }

  return fuelLiters / engineHours;
}

/**
 * Fuel efficiency in liters consumed per kilometer traveled.
 * Formula: fuelEfficiencyLpkm = fuelLiters / distanceKm
 */
export function calculateFuelEfficiencyLpkm(
  fuelLiters: number,
  distanceKm: number,
): number {
  if (fuelLiters <= 0 || distanceKm <= 0) {
    return 0;
  }

  return fuelLiters / distanceKm;
}
