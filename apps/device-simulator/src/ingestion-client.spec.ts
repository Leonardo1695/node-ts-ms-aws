import { IngestionClient } from './ingestion-client';

describe('IngestionClient', () => {
  it('posts telemetry to ingestion with api key header', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    const client = new IngestionClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-key',
      fetchImpl,
    });

    await client.postTelemetry({
      eventId: '00000000-0000-4000-8000-000000000001',
      deviceId: 'dev-exc-101',
      assetId: 'asset-exc-101',
      ts: '2026-06-15T08:00:00.000Z',
      lat: 45.5,
      lon: -73.56,
      speedKph: 0,
      engineOn: true,
      fuelLevelPct: 80,
      fuelRateLph: 4.2,
      engineHours: 1000,
      odometerKm: 12000,
      rpm: 800,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/telemetry',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-key',
        },
      }),
    );
  });

  it('throws when ingestion rejects the payload', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid payload',
    });

    const client = new IngestionClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-key',
      fetchImpl,
    });

    await expect(
      client.postTelemetry({
        eventId: '00000000-0000-4000-8000-000000000001',
        deviceId: 'dev-exc-101',
        assetId: 'asset-exc-101',
        ts: '2026-06-15T08:00:00.000Z',
        lat: 45.5,
        lon: -73.56,
        speedKph: 0,
        engineOn: true,
        fuelLevelPct: 80,
        fuelRateLph: 4.2,
        engineHours: 1000,
        odometerKm: 12000,
        rpm: 800,
      }),
    ).rejects.toThrow('ingestion rejected telemetry (400)');
  });
});
