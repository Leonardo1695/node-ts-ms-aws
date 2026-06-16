import { assetSchema } from './asset.schema';
import { metricsUpdatedEventSchema } from './events.schema';
import { fleetMetricsSchema } from './metrics.schema';
import { telemetryEventSchema } from './telemetry.schema';

describe('domain schemas', () => {
  it('parses a telemetry event', () => {
    const event = telemetryEventSchema.parse({
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
    });

    expect(event.assetId).toBe('asset-exc-01');
  });

  it('parses reference entities and metric DTOs', () => {
    const asset = assetSchema.parse({
      assetId: 'asset-exc-01',
      name: 'Excavator 01',
      assetType: 'excavator',
      assetClass: 'heavy',
      siteId: 'site-mtl-01',
      fuelType: 'diesel',
      ratedPowerKw: 120,
    });

    const metrics = fleetMetricsSchema.parse({
      siteId: asset.siteId,
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-16T00:00:00.000Z',
      totals: {
        co2Kg: 100,
        fuelLiters: 40,
        idleMinutes: 30,
        utilizationPct: 55,
      },
      buckets: [],
    });

    const event = metricsUpdatedEventSchema.parse({
      assetId: asset.assetId,
      siteId: asset.siteId,
      windowStart: metrics.from,
      windowEnd: metrics.to,
    });

    expect(event.windowEnd).toBe(metrics.to);
  });

  it('rejects invalid telemetry payloads', () => {
    expect(() =>
      telemetryEventSchema.parse({
        eventId: 'not-a-uuid',
        deviceId: 'dev-001',
        assetId: 'asset-exc-01',
        ts: '2026-06-15T12:00:00.000Z',
        lat: 45.5017,
        lon: -73.5673,
        speedKph: -1,
        engineOn: true,
        fuelLevelPct: 72,
        fuelRateLph: 8.4,
        engineHours: 1200.5,
        odometerKm: 15400,
        rpm: 1400,
      }),
    ).toThrow();
  });
});
