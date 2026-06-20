"""Reference fleet metadata aligned with VRD-016 seed data."""

from __future__ import annotations

REFERENCE_ASSETS: list[dict[str, str]] = [
    {
        'asset_id': 'asset-exc-101',
        'site_id': 'site-north-yard',
        'asset_class': 'heavy',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-exc-102',
        'site_id': 'site-south-quarry',
        'asset_class': 'heavy',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-ldr-201',
        'site_id': 'site-north-yard',
        'asset_class': 'medium',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-ldr-202',
        'site_id': 'site-south-quarry',
        'asset_class': 'medium',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-trk-301',
        'site_id': 'site-south-quarry',
        'asset_class': 'medium',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-trk-302',
        'site_id': 'site-west-depot',
        'asset_class': 'light',
        'fuel_type': 'gasoline',
    },
    {
        'asset_id': 'asset-gen-401',
        'site_id': 'site-west-depot',
        'asset_class': 'medium',
        'fuel_type': 'diesel',
    },
    {
        'asset_id': 'asset-gen-402',
        'site_id': 'site-north-yard',
        'asset_class': 'light',
        'fuel_type': 'gasoline',
    },
]

ASSET_CATALOG_BY_ID = {asset['asset_id']: asset for asset in REFERENCE_ASSETS}
