from verdiron_etl.metrics import TelemetryInterval, compute_asset_metrics_from_intervals


def test_compute_asset_metrics_matches_domain_example() -> None:
    metrics = compute_asset_metrics_from_intervals(
        asset_id='exc-01',
        site_id='site-mtl',
        asset_class='heavy',
        fuel_type='diesel',
        intervals=[
            TelemetryInterval(60, True, 0, 8),
            TelemetryInterval(60, True, 25, 16),
        ],
    )

    assert metrics['fuel_liters'] == 24
    assert metrics['idle_minutes'] == 60
    assert metrics['active_engine_hours'] == 2
    assert metrics['co2_kg'] == 24 * 2.68
