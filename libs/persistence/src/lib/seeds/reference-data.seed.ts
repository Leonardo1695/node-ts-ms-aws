export interface ReferenceSiteSeed {
  siteId: string;
  name: string;
  region: string;
}

export interface ReferenceAssetSeed {
  assetId: string;
  name: string;
  assetType: string;
  assetClass: string;
  siteId: string;
  fuelType: 'diesel' | 'gasoline';
  ratedPowerKw: number;
}

export const referenceSites: ReferenceSiteSeed[] = [
  {
    siteId: 'site-north-yard',
    name: 'North Yard',
    region: 'NA-East',
  },
  {
    siteId: 'site-south-quarry',
    name: 'South Quarry',
    region: 'NA-Central',
  },
  {
    siteId: 'site-west-depot',
    name: 'West Depot',
    region: 'NA-West',
  },
];

export const referenceAssets: ReferenceAssetSeed[] = [
  {
    assetId: 'asset-exc-101',
    name: 'EX-101 Tiger',
    assetType: 'excavator',
    assetClass: 'heavy',
    siteId: 'site-north-yard',
    fuelType: 'diesel',
    ratedPowerKw: 320,
  },
  {
    assetId: 'asset-exc-102',
    name: 'EX-102 Atlas',
    assetType: 'excavator',
    assetClass: 'heavy',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 280,
  },
  {
    assetId: 'asset-ldr-201',
    name: 'LD-201 Skid Steer',
    assetType: 'loader',
    assetClass: 'medium',
    siteId: 'site-north-yard',
    fuelType: 'diesel',
    ratedPowerKw: 120,
  },
  {
    assetId: 'asset-ldr-202',
    name: 'LD-202 Wheel Loader',
    assetType: 'loader',
    assetClass: 'medium',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 180,
  },
  {
    assetId: 'asset-trk-301',
    name: 'TR-301 Haul Truck',
    assetType: 'truck',
    assetClass: 'medium',
    siteId: 'site-south-quarry',
    fuelType: 'diesel',
    ratedPowerKw: 400,
  },
  {
    assetId: 'asset-trk-302',
    name: 'TR-302 Service Truck',
    assetType: 'truck',
    assetClass: 'light',
    siteId: 'site-west-depot',
    fuelType: 'gasoline',
    ratedPowerKw: 90,
  },
  {
    assetId: 'asset-gen-401',
    name: 'GN-401 Diesel Genset',
    assetType: 'generator',
    assetClass: 'medium',
    siteId: 'site-west-depot',
    fuelType: 'diesel',
    ratedPowerKw: 150,
  },
  {
    assetId: 'asset-gen-402',
    name: 'GN-402 Backup Genset',
    assetType: 'generator',
    assetClass: 'light',
    siteId: 'site-north-yard',
    fuelType: 'gasoline',
    ratedPowerKw: 75,
  },
];

export const referenceSiteIds = referenceSites.map((site) => site.siteId);
export const referenceAssetIds = referenceAssets.map((asset) => asset.assetId);
