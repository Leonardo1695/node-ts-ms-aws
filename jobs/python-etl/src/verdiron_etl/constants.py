"""Constants mirrored from `libs/domain/src/lib/calculations/constants.ts`.

Keep these values in sync with the TypeScript domain package so batch ETL
reports match the real-time processing pipeline.
"""

from __future__ import annotations

CO2_KG_PER_LITER: dict[str, float] = {
    'diesel': 2.68,
    'gasoline': 2.31,
}

IDLE_SPEED_THRESHOLD_KPH = 2

IDLE_BURN_RATE_LPM_BY_CLASS: dict[str, float] = {
    'heavy': 0.8,
    'medium': 0.5,
    'light': 0.3,
}

DEFAULT_IDLE_BURN_RATE_LPM = 0.5

# Processing-service treats each Kinesis snapshot as a one-minute window when
# intervals are not derived from timestamps.
DEFAULT_TELEMETRY_SAMPLE_MINUTES = 1
