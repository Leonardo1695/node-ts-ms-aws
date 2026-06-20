from unittest.mock import MagicMock

import pytest
from botocore.exceptions import ClientError

from verdiron_etl.config import EtlSettings
from verdiron_etl.connections import check_postgres, check_s3_bucket
from verdiron_etl.healthcheck import run_connectivity_check


def test_check_postgres_returns_one() -> None:
    cursor = MagicMock()
    cursor.fetchone.return_value = (1,)

    connection = MagicMock()
    connection.cursor.return_value.__enter__.return_value = cursor

    assert check_postgres(connection) == 1


def test_check_s3_bucket_raises_when_head_bucket_fails() -> None:
    client = MagicMock()
    client.head_bucket.side_effect = ClientError(
        {'Error': {'Code': '404', 'Message': 'Not Found'}},
        'HeadBucket',
    )

    with pytest.raises(RuntimeError, match='Unable to reach S3 bucket'):
        check_s3_bucket(client, 'verdiron-raw')


def test_run_connectivity_check_success(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = EtlSettings(
        postgres_host='localhost',
        postgres_port=5432,
        postgres_user='verdiron',
        postgres_password='verdiron',
        postgres_db='verdiron',
        aws_region='us-east-1',
        aws_endpoint_url='http://localhost:4566',
        aws_access_key_id='test',
        aws_secret_access_key='test',
        s3_bucket_name='verdiron-raw',
        rabbitmq_url=None,
    )

    s3_client = MagicMock()
    connection = MagicMock()
    cursor = MagicMock()
    cursor.fetchone.return_value = (1,)
    connection.cursor.return_value.__enter__.return_value = cursor
    connection.__enter__.return_value = connection
    connection.__exit__.return_value = False

    monkeypatch.setattr(
        'verdiron_etl.healthcheck.create_s3_client',
        lambda _: s3_client,
    )
    monkeypatch.setattr(
        'verdiron_etl.healthcheck.create_postgres_connection',
        lambda _: connection,
    )

    report = run_connectivity_check(settings)

    assert report.postgres is True
    assert report.s3 is True
    assert report.bucket == 'verdiron-raw'
    s3_client.head_bucket.assert_called_once_with(Bucket='verdiron-raw')
