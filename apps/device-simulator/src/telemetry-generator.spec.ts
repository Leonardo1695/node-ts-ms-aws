import { IDLE_SPEED_THRESHOLD_KPH, telemetryEventSchema } from '@verdiron/domain';
import { TelemetryGenerator } from './telemetry-generator';

describe('TelemetryGenerator', () => {
  it('produces events that validate against TelemetryEvent schema', () => {
    const generator = new TelemetryGenerator({ seed: 42, fleetSize: 4 });
    const events = generator.nextBatch(40);

    for (const event of events) {
      expect(() => telemetryEventSchema.parse(event)).not.toThrow();
    }
  });

  it('is repeatable for the same seed', () => {
    const first = new TelemetryGenerator({ seed: 99, fleetSize: 3 }).nextBatch(25);
    const second = new TelemetryGenerator({ seed: 99, fleetSize: 3 }).nextBatch(25);

    expect(second).toEqual(first);
  });

  it('generates idling bursts for excavators', () => {
    const generator = new TelemetryGenerator({
      seed: 7,
      fleetSize: 2,
      tickSeconds: 60,
    });

    const events = generator.nextBatch(300);
    const excavatorEvents = events.filter((event) =>
      event.assetId.startsWith('asset-exc'),
    );
    const idleEvents = excavatorEvents.filter(
      (event) => event.engineOn && event.speedKph < IDLE_SPEED_THRESHOLD_KPH,
    );

    expect(excavatorEvents.length).toBeGreaterThan(0);
    expect(idleEvents.length / excavatorEvents.length).toBeGreaterThan(0.25);
  });

  it('correlates higher fuel rate with higher RPM when engine is on', () => {
    const generator = new TelemetryGenerator({ seed: 13, fleetSize: 8 });
    const events = generator.nextBatch(400).filter((event) => event.engineOn);

    const lowRpm = events.filter((event) => event.rpm < 950);
    const highRpm = events.filter((event) => event.rpm >= 1400);

    const avg = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    expect(lowRpm.length).toBeGreaterThan(0);
    expect(highRpm.length).toBeGreaterThan(0);
    expect(avg(highRpm.map((event) => event.fuelRateLph))).toBeGreaterThan(
      avg(lowRpm.map((event) => event.fuelRateLph)),
    );
  });

  it('increases odometer when assets move', () => {
    const generator = new TelemetryGenerator({ seed: 21, fleetSize: 8 });
    const before = new Map<string, number>();

    for (const event of generator.nextBatch(120)) {
      const previous = before.get(event.assetId);
      if (previous !== undefined && event.speedKph > 5) {
        expect(event.odometerKm).toBeGreaterThanOrEqual(previous);
      }
      before.set(event.assetId, event.odometerKm);
    }
  });
});
