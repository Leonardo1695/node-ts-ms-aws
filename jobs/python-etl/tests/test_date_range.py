from datetime import date

import pytest

from verdiron_etl.date_range import resolve_date_range


def test_resolve_date_range_defaults_to_seven_days() -> None:
    from_day, to_day = resolve_date_range(None, '2026-06-15T00:00:00.000Z')

    assert to_day == date(2026, 6, 15)
    assert from_day == date(2026, 6, 9)


def test_resolve_date_range_rejects_inverted_bounds() -> None:
    with pytest.raises(ValueError, match='Invalid ETL window'):
        resolve_date_range('2026-06-20T00:00:00.000Z', '2026-06-15T00:00:00.000Z')
