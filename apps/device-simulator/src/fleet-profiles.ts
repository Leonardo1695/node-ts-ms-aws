/**
 * Fleet profiles aligned with `libs/persistence` reference seed (VRD-016).
 * Same asset ids/types so simulator output joins real fleet rows in Postgres.
 */

export interface SiteProfile {
  siteId: string;
  lat: number;
  lon: number;
}

export interface FleetAssetProfile {
  assetId: string;
  deviceId: string;
  assetType: 'excavator' | 'loader' | 'truck' | 'generator';
  assetClass: 'heavy' | 'medium' | 'light';
  siteId: string;
  fuelType: 'diesel' | 'gasoline';
  ratedPowerKw: number;
}

export const siteProfiles: Record<string, SiteProfile> = {
  'site-north-yard': { siteId: 'site-north-yard', lat: 45.5017, lon: -73.5673 },
  'site-south-quarry': { siteId: 'site-south-quarry', lat: 32.7767, lon: -96.797 },
  'site-west-depot': { siteId: 'site-west-depot', lat: 34.0522, lon: -118.2437 },
};

export const fleetAssetProfiles: FleetAssetProfile[] = [
  {
    assetId: 'asset-exc-101',
    deviceId: 'dev-exc-101',
    assetType: 'excavator',
    assetClass: 'heavy',
    siteId: 'site-north-yard',
    fuelType: 'diesel',
    ratedPowerKw: 320,
  },
  {
    assetId: 'asset-exc-102',
    deviceId: 'dev-exc-102',
    assetType: 'excavator',
    assetClass: 'heavy',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 280,
  },
  {
    assetId: 'asset-ldr-201',
    deviceId: 'dev-ldr-201',
    assetType: 'loader',
    assetClass: 'medium',
    siteId: 'site-north-yard',
    fuelType: 'diesel',
    ratedPowerKw: 120,
  },
  {
    assetId: 'asset-ldr-202',
    deviceId: 'dev-ldr-202',
    assetType: 'loader',
    assetClass: 'medium',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 180,
  },
  {
    assetId: 'asset-trk-301',
    deviceId: 'dev-trk-301',
    assetType: 'truck',
    assetClass: 'medium',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 400,
  },
  {
    assetId: 'asset-trk-302',
    deviceId: 'dev-trk-302',
    assetType: 'truck',
    assetClass: 'light',
    siteId: 'site-west-depot',
    fuelType: 'gasoline',
    ratedPowerKw: 90,
  },
  {
    assetId: 'asset-gen-401',
    deviceId: 'dev-gen-401',
    assetType: 'generator',
    assetClass: 'medium',
    siteId: 'site-west-depot',
    fuelType: 'diesel',
    ratedPowerKw: 150,
  },
  {
    assetId: 'asset-gen-402',
    deviceId: 'dev-gen-402',
    assetType: 'generator',
    assetClass: 'light',
    siteId: 'site-north-yard',
    fuelType: 'gasoline',
    ratedPowerKw: 75,
  },
];

export function selectFleetProfiles(fleetSize: number): FleetAssetProfile[] {
  const size = Math.max(1, Math.min(fleetSize, fleetAssetProfiles.length));
  return fleetAssetProfiles.slice(0, size);
}
