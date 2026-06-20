"""Transform raw telemetry rows into metric intervals and pandas rollups."""

from __future__ import annotations

from datetime import date

import pandas as pd

from verdiron_etl.constants import DEFAULT_TELEMETRY_SAMPLE_MINUTES
from verdiron_etl.metrics import TelemetryInterval, compute_asset_metrics_from_intervals
from verdiron_etl.reference_fleet import ASSET_CATALOG_BY_ID


def events_to_dataframe(events: list[dict]) -> pd.DataFrame:
    """Normalize raw JSONL dicts into a typed DataFrame."""
    if not events:
        return pd.DataFrame(
            columns=[
                'event_id',
                'asset_id',
                'ts',
                'speed_kph',
                'engine_on',
                'fuel_rate_lph',
            ]
        )

    frame = pd.DataFrame(events)
    frame = frame.rename(
        columns={
            'eventId': 'event_id',
            'assetId': 'asset_id',
            'speedKph': 'speed_kph',
            'engineOn': 'engine_on',
            'fuelRateLph': 'fuel_rate_lph',
        }
    )
    frame['ts'] = pd.to_datetime(frame['ts'], utc=True)
    frame['report_date'] = frame['ts'].dt.date
    return frame


def attach_interval_durations(
    events_df: pd.DataFrame,
    *,
    default_minutes: float = DEFAULT_TELEMETRY_SAMPLE_MINUTES,
    max_gap_minutes: float = 120.0,
) -> pd.DataFrame:
    """Derive interval length from the next event timestamp per asset.

    When timestamps are missing (last event of the day), fall back to the same
    one-minute assumption used by `metric-engine.service.ts`.
    """
    if events_df.empty:
        return events_df.copy()

    ordered = events_df.sort_values(['asset_id', 'ts']).copy()
    ordered['next_ts'] = ordered.groupby('asset_id')['ts'].shift(-1)
    delta_minutes = (
        (ordered['next_ts'] - ordered['ts']).dt.total_seconds() / 60
    ).fillna(default_minutes)
    delta_minutes = delta_minutes.where(delta_minutes > 0, default_minutes)
    ordered['duration_minutes'] = delta_minutes.clip(upper=max_gap_minutes)
    return ordered


def _intervals_for_group(group: pd.DataFrame) -> list[TelemetryInterval]:
    return [
        TelemetryInterval(
            duration_minutes=float(row.duration_minutes),
            engine_on=bool(row.engine_on),
            speed_kph=float(row.speed_kph),
            fuel_rate_lph=float(row.fuel_rate_lph),
        )
        for row in group.itertuples(index=False)
    ]


def build_asset_daily_rollups(events_df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate per-asset/per-day sustainability metrics."""
    if events_df.empty:
        return pd.DataFrame(
            columns=[
                'report_date',
                'asset_id',
                'site_id',
                'asset_class',
                'fuel_type',
                'fuel_liters',
                'co2_kg',
                'idle_minutes',
                'active_engine_hours',
                'available_hours',
                'utilization_pct',
                'event_count',
            ]
        )

    intervalized = attach_interval_durations(events_df)
    rows: list[dict[str, object]] = []

    grouped = intervalized.groupby(['report_date', 'asset_id'], sort=True)
    for (report_date, asset_id), group in grouped:
        catalog = ASSET_CATALOG_BY_ID.get(asset_id)
        if catalog is None:
            continue

        metrics = compute_asset_metrics_from_intervals(
            asset_id=asset_id,
            site_id=catalog['site_id'],
            asset_class=catalog['asset_class'],
            fuel_type=catalog['fuel_type'],
            intervals=_intervals_for_group(group),
        )
        rows.append(
            {
                'report_date': report_date,
                'event_count': len(group),
                **metrics,
            }
        )

    return pd.DataFrame(rows)


def build_site_daily_rollups(asset_rollups: pd.DataFrame) -> pd.DataFrame:
    """Roll asset metrics up to site/day totals (domain `rollupFleetTotals`)."""
    if asset_rollups.empty:
        return pd.DataFrame(
            columns=[
                'report_date',
                'site_id',
                'fuel_liters',
                'co2_kg',
                'idle_minutes',
                'active_engine_hours',
                'available_hours',
                'utilization_pct',
                'asset_count',
            ]
        )

    grouped = asset_rollups.groupby(['report_date', 'site_id'], sort=True)
    rows: list[dict[str, object]] = []

    for (report_date, site_id), group in grouped:
        active_engine_hours = float(group['active_engine_hours'].sum())
        available_hours = float(group['available_hours'].sum())
        utilization_pct = (
            0.0
            if available_hours <= 0
            else min((active_engine_hours / available_hours) * 100, 100.0)
        )

        rows.append(
            {
                'report_date': report_date,
                'site_id': site_id,
                'fuel_liters': float(group['fuel_liters'].sum()),
                'co2_kg': float(group['co2_kg'].sum()),
                'idle_minutes': float(group['idle_minutes'].sum()),
                'active_engine_hours': active_engine_hours,
                'available_hours': available_hours,
                'utilization_pct': utilization_pct,
                'asset_count': int(group['asset_id'].nunique()),
            }
        )

    return pd.DataFrame(rows)


def build_daily_rollups(events: list[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """End-to-end helper: raw events -> asset + site daily DataFrames."""
    events_df = events_to_dataframe(events)
    asset_rollups = build_asset_daily_rollups(events_df)
    site_rollups = build_site_daily_rollups(asset_rollups)
    return asset_rollups, site_rollups


def build_daily_rollups_from_s3(
    s3_client,
    bucket_name: str,
    *,
    from_date: date,
    to_date: date,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    from verdiron_etl.s3_reader import load_raw_events

    events = load_raw_events(
        s3_client,
        bucket_name,
        from_date=from_date,
        to_date=to_date,
    )
    return build_daily_rollups(events)
