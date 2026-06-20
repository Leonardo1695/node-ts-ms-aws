import pytest

from verdiron_etl.config import EtlSettings


def test_settings_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv('POSTGRES_HOST', 'db.example')
    monkeypatch.setenv('POSTGRES_PORT', '5433')
    monkeypatch.setenv('POSTGRES_USER', 'user')
    monkeypatch.setenv('POSTGRES_PASSWORD', 'secret')
    monkeypatch.setenv('POSTGRES_DB', 'verdiron')
    monkeypatch.setenv('AWS_REGION', 'us-east-1')
    monkeypatch.setenv('AWS_ENDPOINT_URL', 'http://localhost:4566')
    monkeypatch.setenv('AWS_ACCESS_KEY_ID', 'test')
    monkeypatch.setenv('AWS_SECRET_ACCESS_KEY', 'test')
    monkeypatch.setenv('S3_BUCKET_NAME', 'verdiron-raw')

    settings = EtlSettings.from_env()

    assert settings.postgres_host == 'db.example'
    assert settings.postgres_port == 5433
    assert settings.s3_bucket_name == 'verdiron-raw'
    assert 'host=db.example' in settings.postgres_dsn
