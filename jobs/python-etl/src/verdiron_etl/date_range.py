"""Resolve ETL date windows from control commands."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def _parse_iso_date(value: str) -> date:
    normalized = value.replace('Z', '+00:00')
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.date()


def resolve_date_range(
    from_iso: str | None,
    to_iso: str | None,
    *,
    default_days: int = 7,
) -> tuple[date, date]:
    """Map optional ISO datetimes to an inclusive date range.

    When the API publishes `etl.run` without bounds, process the last week.
    """
    to_day = _parse_iso_date(to_iso) if to_iso else datetime.now(timezone.utc).date()
    if from_iso:
        from_day = _parse_iso_date(from_iso)
    else:
        from_day = to_day - timedelta(days=max(default_days, 1) - 1)

    if from_day > to_day:
        raise ValueError(f'Invalid ETL window: from {from_day} is after to {to_day}')

    return from_day, to_day
