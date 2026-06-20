"""Upsert daily rollups into Postgres `reporting_daily`."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
import psycopg

UPSERT_SQL = """
INSERT INTO reporting_daily (
  report_date,
  grain,
  entity_id,
  site_id,
  asset_class,
  fuel_type,
  fuel_liters,
  co2_kg,
  idle_minutes,
  active_engine_hours,
  available_hours,
  utilization_pct,
  event_count,
  asset_count,
  updated_at
) VALUES (
  %(report_date)s,
  %(grain)s,
  %(entity_id)s,
  %(site_id)s,
  %(asset_class)s,
  %(fuel_type)s,
  %(fuel_liters)s,
  %(co2_kg)s,
  %(idle_minutes)s,
  %(active_engine_hours)s,
  %(available_hours)s,
  %(utilization_pct)s,
  %(event_count)s,
  %(asset_count)s,
  NOW()
)
ON CONFLICT (report_date, grain, entity_id) DO UPDATE SET
  site_id = EXCLUDED.site_id,
  asset_class = EXCLUDED.asset_class,
  fuel_type = EXCLUDED.fuel_type,
  fuel_liters = EXCLUDED.fuel_liters,
  co2_kg = EXCLUDED.co2_kg,
  idle_minutes = EXCLUDED.idle_minutes,
  active_engine_hours = EXCLUDED.active_engine_hours,
  available_hours = EXCLUDED.available_hours,
  utilization_pct = EXCLUDED.utilization_pct,
  event_count = EXCLUDED.event_count,
  asset_count = EXCLUDED.asset_count,
  updated_at = NOW()
"""


@dataclass(frozen=True)
class UpsertCounts:
    asset_rows: int
    site_rows: int


def _asset_records(asset_rollups: pd.DataFrame) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for row in asset_rollups.itertuples(index=False):
        records.append(
            {
                'report_date': row.report_date,
                'grain': 'asset',
                'entity_id': row.asset_id,
                'site_id': row.site_id,
                'asset_class': row.asset_class,
                'fuel_type': row.fuel_type,
                'fuel_liters': float(row.fuel_liters),
                'co2_kg': float(row.co2_kg),
                'idle_minutes': float(row.idle_minutes),
                'active_engine_hours': float(row.active_engine_hours),
                'available_hours': float(row.available_hours),
                'utilization_pct': float(row.utilization_pct),
                'event_count': int(row.event_count),
                'asset_count': None,
            }
        )
    return records


def _site_records(site_rollups: pd.DataFrame) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for row in site_rollups.itertuples(index=False):
        records.append(
            {
                'report_date': row.report_date,
                'grain': 'site',
                'entity_id': row.site_id,
                'site_id': row.site_id,
                'asset_class': None,
                'fuel_type': None,
                'fuel_liters': float(row.fuel_liters),
                'co2_kg': float(row.co2_kg),
                'idle_minutes': float(row.idle_minutes),
                'active_engine_hours': float(row.active_engine_hours),
                'available_hours': float(row.available_hours),
                'utilization_pct': float(row.utilization_pct),
                'event_count': None,
                'asset_count': int(row.asset_count),
            }
        )
    return records


def upsert_daily_rollups(
    connection: psycopg.Connection,
    asset_rollups: pd.DataFrame,
    site_rollups: pd.DataFrame,
) -> UpsertCounts:
    records = _asset_records(asset_rollups) + _site_records(site_rollups)
    if not records:
        return UpsertCounts(asset_rows=0, site_rows=0)

    with connection.cursor() as cursor:
        cursor.executemany(UPSERT_SQL, records)
    connection.commit()

    return UpsertCounts(
        asset_rows=len(asset_rollups),
        site_rows=len(site_rollups),
    )
