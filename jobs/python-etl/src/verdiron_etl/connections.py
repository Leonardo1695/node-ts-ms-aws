"""AWS S3 and Postgres connectivity helpers."""

from __future__ import annotations

from typing import Any

import boto3
import psycopg
from botocore.exceptions import ClientError

from verdiron_etl.config import EtlSettings


def create_s3_client(settings: EtlSettings):
    """Create a boto3 S3 client.

    When `AWS_ENDPOINT_URL` is set (LocalStack in local dev), boto3 talks to
    that endpoint instead of real AWS. Path-style addressing is enabled because
    LocalStack expects it for many bucket operations.
    """
    client_kwargs: dict[str, Any] = {
        'service_name': 's3',
        'region_name': settings.aws_region,
        'aws_access_key_id': settings.aws_access_key_id,
        'aws_secret_access_key': settings.aws_secret_access_key,
    }

    if settings.aws_endpoint_url:
        client_kwargs['endpoint_url'] = settings.aws_endpoint_url

    return boto3.client(**client_kwargs)


def check_s3_bucket(client, bucket_name: str) -> None:
    """Verify the configured raw archive bucket exists and is reachable."""
    try:
        client.head_bucket(Bucket=bucket_name)
    except ClientError as error:
        raise RuntimeError(
            f'Unable to reach S3 bucket "{bucket_name}": {error}'
        ) from error


def create_postgres_connection(settings: EtlSettings) -> psycopg.Connection:
    """Open a psycopg connection to Postgres."""
    return psycopg.connect(settings.postgres_dsn)


def check_postgres(connection: psycopg.Connection) -> int:
    """Run a trivial query to confirm Postgres is accepting connections."""
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
        row = cursor.fetchone()

    if row is None or row[0] != 1:
        raise RuntimeError('Postgres health query returned an unexpected value')

    return int(row[0])
