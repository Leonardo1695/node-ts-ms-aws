"""Pure metric formulas ported from `libs/domain/src/lib/calculations`."""

from __future__ import annotations

from dataclasses import dataclass

from verdiron_etl.constants import (
    CO2_KG_PER_LITER,
    DEFAULT_IDLE_BURN_RATE_LPM,
    IDLE_BURN_RATE_LPM_BY_CLASS,
    IDLE_SPEED_THRESHOLD_KPH,
)


@dataclass(frozen=True)
class TelemetryInterval:
    duration_minutes: float
    engine_on: bool
    speed_kph: float
    fuel_rate_lph: float


def calculate_co2_kg(fuel_liters: float, fuel_type: str) -> float:
    if fuel_liters <= 0:
        return 0.0
    return fuel_liters * CO2_KG_PER_LITER[fuel_type]


def calculate_fuel_liters_from_rate(fuel_rate_lph: float, duration_hours: float) -> float:
    if fuel_rate_lph <= 0 or duration_hours <= 0:
        return 0.0
    return fuel_rate_lph * duration_hours


def is_idle(engine_on: bool, speed_kph: float) -> bool:
    return engine_on and speed_kph < IDLE_SPEED_THRESHOLD_KPH


def sum_fuel_liters_from_intervals(intervals: list[TelemetryInterval]) -> float:
    total = 0.0
    for interval in intervals:
        if not interval.engine_on:
            continue
        total += calculate_fuel_liters_from_rate(
            interval.fuel_rate_lph,
            interval.duration_minutes / 60,
        )
    return total


def sum_idle_minutes_from_intervals(intervals: list[TelemetryInterval]) -> float:
    total = 0.0
    for interval in intervals:
        if interval.duration_minutes <= 0:
            continue
        if is_idle(interval.engine_on, interval.speed_kph):
            total += interval.duration_minutes
    return total


def sum_active_engine_hours(intervals: list[TelemetryInterval]) -> float:
    return sum(
        interval.duration_minutes / 60
        for interval in intervals
        if interval.engine_on
    )


def sum_available_hours(intervals: list[TelemetryInterval]) -> float:
    return sum(interval.duration_minutes / 60 for interval in intervals)


def calculate_utilization_pct(active_engine_hours: float, available_hours: float) -> float:
    if available_hours <= 0 or active_engine_hours <= 0:
        return 0.0
    return min((active_engine_hours / available_hours) * 100, 100.0)


def get_idle_burn_rate_lpm(asset_class: str) -> float:
    return IDLE_BURN_RATE_LPM_BY_CLASS.get(asset_class.lower(), DEFAULT_IDLE_BURN_RATE_LPM)


def compute_asset_metrics_from_intervals(
    *,
    asset_id: str,
    site_id: str,
    asset_class: str,
    fuel_type: str,
    intervals: list[TelemetryInterval],
) -> dict[str, float | str]:
    """Same composition as domain `computeAssetMetricsFromIntervals`."""
    fuel_liters = sum_fuel_liters_from_intervals(intervals)
    idle_minutes = sum_idle_minutes_from_intervals(intervals)
    active_engine_hours = sum_active_engine_hours(intervals)
    available_hours = sum_available_hours(intervals)

    return {
        'asset_id': asset_id,
        'site_id': site_id,
        'asset_class': asset_class,
        'fuel_type': fuel_type,
        'fuel_liters': fuel_liters,
        'co2_kg': calculate_co2_kg(fuel_liters, fuel_type),
        'idle_minutes': idle_minutes,
        'active_engine_hours': active_engine_hours,
        'available_hours': available_hours,
        'utilization_pct': calculate_utilization_pct(
            active_engine_hours,
            available_hours,
        ),
    }
