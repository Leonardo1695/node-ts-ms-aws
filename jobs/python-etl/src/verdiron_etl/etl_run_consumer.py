"""Consume `etl.run` commands published by api-service control routes."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import pika
from pika.adapters.blocking_connection import BlockingChannel

from verdiron_etl.rmq_envelope import parse_nest_rmq_envelope

ETL_RUN_QUEUE = 'etl.run'
ETL_RUN_PATTERN = 'etl.run'


@dataclass(frozen=True)
class EtlRunCommand:
    from_iso: str | None
    to_iso: str | None


EtlRunHandler = Callable[[EtlRunCommand], None]


def dispatch_etl_run_message(content: bytes, handler: EtlRunHandler) -> None:
    envelope = parse_nest_rmq_envelope(content)
    if not envelope or envelope.get('pattern') != ETL_RUN_PATTERN:
        return

    data = envelope.get('data') or {}
    handler(
        EtlRunCommand(
            from_iso=data.get('from'),
            to_iso=data.get('to'),
        )
    )


class EtlRunConsumer:
    def __init__(self, rabbitmq_url: str, handler: EtlRunHandler) -> None:
        self.rabbitmq_url = rabbitmq_url
        self.handler = handler
        self._connection: pika.BlockingConnection | None = None
        self._channel: BlockingChannel | None = None

    def start(self) -> None:
        parameters = pika.URLParameters(self.rabbitmq_url)
        self._connection = pika.BlockingConnection(parameters)
        self._channel = self._connection.channel()
        self._channel.queue_declare(queue=ETL_RUN_QUEUE, durable=True)
        self._channel.basic_qos(prefetch_count=1)
        self._channel.basic_consume(
            queue=ETL_RUN_QUEUE,
            on_message_callback=self._on_message,
            auto_ack=False,
        )
        self._channel.start_consuming()

    def close(self) -> None:
        if self._channel and self._channel.is_open:
            self._channel.close()
        if self._connection and self._connection.is_open:
            self._connection.close()
        self._channel = None
        self._connection = None

    def _on_message(
        self,
        channel: BlockingChannel,
        method: pika.spec.Basic.Deliver,
        _properties: pika.BasicProperties,
        body: bytes,
    ) -> None:
        try:
            dispatch_etl_run_message(body, self.handler)
        except Exception as error:
            print(
                {
                    'service': 'python-etl',
                    'msg': 'etl.run handling failed',
                    'error': str(error),
                }
            )
        finally:
            channel.basic_ack(delivery_tag=method.delivery_tag)
