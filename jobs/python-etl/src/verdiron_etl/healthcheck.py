"""Connectivity checks used by the VRD-060 scaffold."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from verdiron_etl.config import EtlSettings
from verdiron_etl.connections import (
    check_postgres,
    check_s3_bucket,
    create_postgres_connection,
    create_s3_client,
)


@dataclass(frozen=True)
class ConnectivityReport:
    postgres: bool
    s3: bool
    bucket: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def run_connectivity_check(settings: EtlSettings) -> ConnectivityReport:
    """Connect to Postgres and S3; raise if either dependency is unavailable."""
    s3_client = create_s3_client(settings)
    check_s3_bucket(s3_client, settings.s3_bucket_name)

    with create_postgres_connection(settings) as connection:
        check_postgres(connection)

    return ConnectivityReport(
        postgres=True,
        s3=True,
        bucket=settings.s3_bucket_name,
    )
