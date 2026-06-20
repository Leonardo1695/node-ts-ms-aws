export const assetOptions = [
  { assetId: 'asset-exc-101', label: 'EX-101 Tiger' },
  { assetId: 'asset-exc-102', label: 'EX-102 Atlas' },
  { assetId: 'asset-ldr-201', label: 'LD-201 Skid Steer' },
  { assetId: 'asset-ldr-202', label: 'LD-202 Wheel Loader' },
  { assetId: 'asset-trk-301', label: 'TR-301 Haul Truck' },
  { assetId: 'asset-trk-302', label: 'TR-302 Service Truck' },
  { assetId: 'asset-gen-401', label: 'GN-401 Diesel Genset' },
  { assetId: 'asset-gen-402', label: 'GN-402 Backup Genset' },
] as const;

export function assetLabel(assetId: string): string {
  return (
    assetOptions.find((option) => option.assetId === assetId)?.label ?? assetId
  );
}
