"""Load runtime settings from environment variables.

Python services in this repo follow the same env names as the Node apps so
docker-compose can share one `.env` file. We use a small dataclass instead of
a heavy config framework to keep the learning curve gentle.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f'Missing required environment variable: {name}')
    return value


def _optional(name: str, default: str) -> str:
    return os.getenv(name, default)


@dataclass(frozen=True)
class EtlSettings:
    """Connection settings for the python-etl worker."""

    postgres_host: str
    postgres_port: int
    postgres_user: str
    postgres_password: str
    postgres_db: str
    aws_region: str
    aws_endpoint_url: str | None
    aws_access_key_id: str
    aws_secret_access_key: str
    s3_bucket_name: str
    rabbitmq_url: str | None

    @classmethod
    def from_env(cls) -> EtlSettings:
        """Build settings from process env (same keys as `.env.example`)."""
        return cls(
            postgres_host=_optional('POSTGRES_HOST', 'localhost'),
            postgres_port=int(_optional('POSTGRES_PORT', '5432')),
            postgres_user=_optional('POSTGRES_USER', 'verdiron'),
            postgres_password=_optional('POSTGRES_PASSWORD', 'verdiron'),
            postgres_db=_optional('POSTGRES_DB', 'verdiron'),
            aws_region=_optional('AWS_REGION', 'us-east-1'),
            aws_endpoint_url=os.getenv('AWS_ENDPOINT_URL'),
            aws_access_key_id=_optional('AWS_ACCESS_KEY_ID', 'test'),
            aws_secret_access_key=_optional('AWS_SECRET_ACCESS_KEY', 'test'),
            s3_bucket_name=_optional('S3_BUCKET_NAME', 'verdiron-raw'),
            rabbitmq_url=os.getenv('RABBITMQ_URL'),
        )

    @property
    def postgres_dsn(self) -> str:
        """psycopg connection string (keyword DSN)."""
        return (
            f'host={self.postgres_host} '
            f'port={self.postgres_port} '
            f'dbname={self.postgres_db} '
            f'user={self.postgres_user} '
            f'password={self.postgres_password}'
        )
