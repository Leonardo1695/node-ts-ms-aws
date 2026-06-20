"""CLI entrypoint for the python-etl worker."""

from __future__ import annotations

import argparse
import json
import signal
import sys
from datetime import date

from verdiron_etl.config import EtlSettings
from verdiron_etl.connections import create_s3_client
from verdiron_etl.date_range import resolve_date_range
from verdiron_etl.etl_run_consumer import EtlRunConsumer
from verdiron_etl.healthcheck import run_connectivity_check
from verdiron_etl.pipeline import run_etl_job
from verdiron_etl.rollups import build_daily_rollups_from_s3


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='Verdiron python-etl batch worker.',
    )
    subparsers = parser.add_subparsers(dest='command', required=True)

    check_parser = subparsers.add_parser(
        'check',
        help='Verify Postgres + S3 connectivity and exit.',
    )
    check_parser.set_defaults(handler=_handle_check)

    rollup_parser = subparsers.add_parser(
        'rollup',
        help='Load raw JSONL from S3 and compute daily rollups.',
    )
    rollup_parser.add_argument('--from', dest='from_date', required=True)
    rollup_parser.add_argument('--to', dest='to_date', required=True)
    rollup_parser.set_defaults(handler=_handle_rollup)

    run_parser = subparsers.add_parser(
        'run',
        help='Compute rollups from S3 and upsert into reporting_daily.',
    )
    run_parser.add_argument('--from', dest='from_date')
    run_parser.add_argument('--to', dest='to_date')
    run_parser.set_defaults(handler=_handle_run)

    worker_parser = subparsers.add_parser(
        'worker',
        help='Listen for etl.run RabbitMQ commands and execute jobs.',
    )
    worker_parser.set_defaults(handler=_handle_worker)

    return parser


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def _log(payload: dict[str, object]) -> None:
    print(json.dumps({'service': 'python-etl', **payload}))


def _handle_check(_: argparse.Namespace) -> int:
    settings = EtlSettings.from_env()
    report = run_connectivity_check(settings)
    _log({'status': 'ok', 'checks': report.to_dict()})
    return 0


def _handle_rollup(args: argparse.Namespace) -> int:
    settings = EtlSettings.from_env()
    from_date = _parse_date(args.from_date)
    to_date = _parse_date(args.to_date)

    s3_client = create_s3_client(settings)
    asset_rollups, site_rollups = build_daily_rollups_from_s3(
        s3_client,
        settings.s3_bucket_name,
        from_date=from_date,
        to_date=to_date,
    )

    _log(
        {
            'status': 'ok',
            'command': 'rollup',
            'assetRows': len(asset_rollups),
            'siteRows': len(site_rollups),
            'assets': asset_rollups.to_dict(orient='records'),
            'sites': site_rollups.to_dict(orient='records'),
        }
    )
    return 0


def _handle_run(args: argparse.Namespace) -> int:
    settings = EtlSettings.from_env()
    from_date, to_date = resolve_date_range(args.from_date, args.to_date)
    result = run_etl_job(settings, from_date=from_date, to_date=to_date)
    _log({'status': 'ok', 'command': 'run', **result.to_dict()})
    return 0


def _handle_worker(_: argparse.Namespace) -> int:
    settings = EtlSettings.from_env()
    if not settings.rabbitmq_url:
        raise SystemExit('RABBITMQ_URL is required for worker mode')

    consumer: EtlRunConsumer | None = None

    def shutdown(_signum: int, _frame: object) -> None:
        if consumer is not None:
            consumer.close()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    def on_run(command) -> None:
        from_date, to_date = resolve_date_range(command.from_iso, command.to_iso)
        result = run_etl_job(settings, from_date=from_date, to_date=to_date)
        _log({'status': 'ok', 'command': 'etl.run', **result.to_dict()})

    consumer = EtlRunConsumer(settings.rabbitmq_url, on_run)
    _log({'status': 'ready', 'command': 'worker', 'queue': 'etl.run'})
    consumer.start()
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.handler(args))


if __name__ == '__main__':
    sys.exit(main())
