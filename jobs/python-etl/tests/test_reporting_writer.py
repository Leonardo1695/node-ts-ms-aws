from datetime import date
from unittest.mock import MagicMock

import pandas as pd

from verdiron_etl.reporting_writer import upsert_daily_rollups


def test_upsert_daily_rollups_executes_asset_and_site_rows() -> None:
    connection = MagicMock()
    cursor = MagicMock()
    connection.cursor.return_value.__enter__.return_value = cursor

    asset_rollups = pd.DataFrame(
        [
            {
                'report_date': date(2026, 6, 15),
                'asset_id': 'asset-exc-101',
                'site_id': 'site-north-yard',
                'asset_class': 'heavy',
                'fuel_type': 'diesel',
                'fuel_liters': 12.5,
                'co2_kg': 33.5,
                'idle_minutes': 30.0,
                'active_engine_hours': 1.0,
                'available_hours': 1.0,
                'utilization_pct': 100.0,
                'event_count': 2,
            }
        ]
    )
    site_rollups = pd.DataFrame(
        [
            {
                'report_date': date(2026, 6, 15),
                'site_id': 'site-north-yard',
                'fuel_liters': 12.5,
                'co2_kg': 33.5,
                'idle_minutes': 30.0,
                'active_engine_hours': 1.0,
                'available_hours': 1.0,
                'utilization_pct': 100.0,
                'asset_count': 1,
            }
        ]
    )

    counts = upsert_daily_rollups(connection, asset_rollups, site_rollups)

    assert counts.asset_rows == 1
    assert counts.site_rows == 1
    cursor.executemany.assert_called_once()
    connection.commit.assert_called_once()
