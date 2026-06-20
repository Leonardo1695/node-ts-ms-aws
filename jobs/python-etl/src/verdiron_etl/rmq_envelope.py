"""Parse NestJS RabbitMQ message envelopes."""

from __future__ import annotations

import json


def parse_nest_rmq_envelope(raw: bytes) -> dict | None:
    try:
        parsed = json.loads(raw.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None

    if isinstance(parsed, dict) and parsed.get('pattern'):
        return parsed
    return None
