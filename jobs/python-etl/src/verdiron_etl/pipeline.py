"""End-to-end ETL pipeline: S3 raw -> rollups -> Postgres."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date

from verdiron_etl.config import EtlSettings
from verdiron_etl.connections import create_postgres_connection, create_s3_client
from verdiron_etl.reporting_writer import UpsertCounts, upsert_daily_rollups
from verdiron_etl.rollups import build_daily_rollups_from_s3


@dataclass(frozen=True)
class EtlRunResult:
    from_date: date
    to_date: date
    asset_rows: int
    site_rows: int
    upserted_assets: int
    upserted_sites: int

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload['from_date'] = self.from_date.isoformat()
        payload['to_date'] = self.to_date.isoformat()
        return payload


def run_etl_job(
    settings: EtlSettings,
    *,
    from_date: date,
    to_date: date,
) -> EtlRunResult:
    s3_client = create_s3_client(settings)
    asset_rollups, site_rollups = build_daily_rollups_from_s3(
        s3_client,
        settings.s3_bucket_name,
        from_date=from_date,
        to_date=to_date,
    )

    with create_postgres_connection(settings) as connection:
        counts: UpsertCounts = upsert_daily_rollups(
            connection,
            asset_rollups,
            site_rollups,
        )

    return EtlRunResult(
        from_date=from_date,
        to_date=to_date,
        asset_rows=len(asset_rollups),
        site_rows=len(site_rollups),
        upserted_assets=counts.asset_rows,
        upserted_sites=counts.site_rows,
    )
