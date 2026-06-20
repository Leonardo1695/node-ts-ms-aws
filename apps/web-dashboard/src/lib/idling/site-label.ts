import { siteFilterOptions } from '../fleet/site-options';

export function siteLabel(siteId: string): string {
  return (
    siteFilterOptions.find((option) => option.value === siteId)?.label ?? siteId
  );
}
