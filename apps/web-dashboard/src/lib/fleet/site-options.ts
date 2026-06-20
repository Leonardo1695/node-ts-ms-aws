export const siteFilterOptions = [
  { value: '', label: 'All sites' },
  { value: 'site-north-yard', label: 'North Yard' },
  { value: 'site-south-quarry', label: 'South Quarry' },
  { value: 'site-west-depot', label: 'West Depot' },
] as const;

export type SiteFilterValue = (typeof siteFilterOptions)[number]['value'];
