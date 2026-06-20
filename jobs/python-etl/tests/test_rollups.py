from datetime import date
from unittest.mock import MagicMock

from verdiron_etl.rollups import build_daily_rollups
from verdiron_etl.s3_reader import (
    build_raw_prefix_for_date,
    list_raw_object_keys,
    read_jsonl_object,
)


def _sample_event(
    event_id: str,
    ts: str,
    *,
    speed_kph: float,
    fuel_rate_lph: float,
) -> dict:
    return {
        'eventId': event_id,
        'deviceId': 'dev-exc-101',
        'assetId': 'asset-exc-101',
        'ts': ts,
        'lat': 45.5,
        'lon': -73.56,
        'speedKph': speed_kph,
        'engineOn': True,
        'fuelLevelPct': 80,
        'fuelRateLph': fuel_rate_lph,
        'engineHours': 1000,
        'odometerKm': 12000,
        'rpm': 800,
    }


def test_build_daily_rollups_from_sample_events() -> None:
    events = [
        _sample_event(
            '00000000-0000-4000-8000-000000000001',
            '2026-06-15T08:00:00.000Z',
            speed_kph=0,
            fuel_rate_lph=8,
        ),
        _sample_event(
            '00000000-0000-4000-8000-000000000002',
            '2026-06-15T09:00:00.000Z',
            speed_kph=25,
            fuel_rate_lph=16,
        ),
    ]

    asset_rollups, site_rollups = build_daily_rollups(events)

    assert len(asset_rollups) == 1
    row = asset_rollups.iloc[0]
    assert row['asset_id'] == 'asset-exc-101'
    assert row['site_id'] == 'site-north-yard'
    assert row['idle_minutes'] == 60
    assert row['fuel_liters'] == 8 + (16 / 60)
    assert row['event_count'] == 2

    assert len(site_rollups) == 1
    assert site_rollups.iloc[0]['site_id'] == 'site-north-yard'
    assert site_rollups.iloc[0]['asset_count'] == 1


def test_build_raw_prefix_for_date() -> None:
    assert build_raw_prefix_for_date(date(2026, 6, 15)) == 'raw/dt=2026-06-15/'


def test_list_raw_object_keys_filters_jsonl() -> None:
    client = MagicMock()
    client.list_objects_v2.return_value = {
        'Contents': [
            {'Key': 'raw/dt=2026-06-15/asset=asset-exc-101/a.jsonl'},
            {'Key': 'raw/dt=2026-06-15/asset=asset-exc-101/README.txt'},
        ],
        'IsTruncated': False,
    }

    keys = list_raw_object_keys(
        client,
        'verdiron-raw',
        from_date=date(2026, 6, 15),
        to_date=date(2026, 6, 15),
    )

    assert keys == ['raw/dt=2026-06-15/asset=asset-exc-101/a.jsonl']


def test_read_jsonl_object_parses_lines() -> None:
    client = MagicMock()
    client.get_object.return_value = {
        'Body': MagicMock(
            read=MagicMock(
                return_value=b'{"assetId":"asset-exc-101"}\n{"assetId":"asset-exc-102"}\n'
            )
        )
    }

    records = read_jsonl_object(client, 'verdiron-raw', 'raw/test.jsonl')

    assert records == [
        {'assetId': 'asset-exc-101'},
        {'assetId': 'asset-exc-102'},
    ]
