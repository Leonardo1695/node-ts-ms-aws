"""Read archived telemetry JSONL objects from S3."""

from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Iterable

RAW_PREFIX = 'raw/'


def iter_dates(from_date: date, to_date: date) -> Iterable[date]:
    current = from_date
    while current <= to_date:
        yield current
        current += timedelta(days=1)


def build_raw_prefix_for_date(day: date) -> str:
    return f'{RAW_PREFIX}dt={day.isoformat()}/'


def list_raw_object_keys(
    s3_client,
    bucket_name: str,
    *,
    from_date: date,
    to_date: date,
) -> list[str]:
    keys: list[str] = []

    for day in iter_dates(from_date, to_date):
        prefix = build_raw_prefix_for_date(day)
        continuation_token: str | None = None

        while True:
            kwargs = {
                'Bucket': bucket_name,
                'Prefix': prefix,
            }
            if continuation_token:
                kwargs['ContinuationToken'] = continuation_token

            response = s3_client.list_objects_v2(**kwargs)
            for item in response.get('Contents', []):
                key = item.get('Key')
                if key and key.endswith('.jsonl'):
                    keys.append(key)

            if not response.get('IsTruncated'):
                break
            continuation_token = response.get('NextContinuationToken')

    return keys


def read_jsonl_object(s3_client, bucket_name: str, key: str) -> list[dict]:
    body = (
        s3_client.get_object(Bucket=bucket_name, Key=key)['Body']
        .read()
        .decode('utf-8')
    )
    records: list[dict] = []
    for line in body.splitlines():
        stripped = line.strip()
        if stripped:
            records.append(json.loads(stripped))
    return records


def load_raw_events(
    s3_client,
    bucket_name: str,
    *,
    from_date: date,
    to_date: date,
) -> list[dict]:
    events: list[dict] = []
    for key in list_raw_object_keys(
        s3_client,
        bucket_name,
        from_date=from_date,
        to_date=to_date,
    ):
        events.extend(read_jsonl_object(s3_client, bucket_name, key))
    return events
