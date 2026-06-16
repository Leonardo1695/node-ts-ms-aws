import type { TelemetryEvent } from '@verdiron/domain';

export const validTelemetryEvent: TelemetryEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  deviceId: 'dev-001',
  assetId: 'asset-exc-01',
  ts: '2026-06-15T12:00:00.000Z',
  lat: 45.5017,
  lon: -73.5673,
  speedKph: 12.5,
  engineOn: true,
  fuelLevelPct: 72,
  fuelRateLph: 8.4,
  engineHours: 1200.5,
  odometerKm: 15400,
  rpm: 1400,
};

export const validTelemetryBatch: TelemetryEvent[] = [
  validTelemetryEvent,
  {
    ...validTelemetryEvent,
    eventId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    speedKph: 0,
    engineOn: true,
    rpm: 800,
  },
];
