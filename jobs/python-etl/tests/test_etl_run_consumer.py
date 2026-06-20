from unittest.mock import MagicMock

from verdiron_etl.etl_run_consumer import (
    ETL_RUN_PATTERN,
    dispatch_etl_run_message,
)


def test_dispatch_etl_run_message() -> None:
    handler = MagicMock()

    dispatch_etl_run_message(
        (
            '{"pattern":"'
            + ETL_RUN_PATTERN
            + '","data":{"from":"2026-06-10T00:00:00.000Z","to":"2026-06-15T00:00:00.000Z"}}'
        ).encode('utf-8'),
        handler,
    )

    handler.assert_called_once()
    command = handler.call_args.args[0]
    assert command.from_iso == '2026-06-10T00:00:00.000Z'
    assert command.to_iso == '2026-06-15T00:00:00.000Z'
