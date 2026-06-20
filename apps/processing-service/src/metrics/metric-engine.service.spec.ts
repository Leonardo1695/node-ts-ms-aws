import { Test } from '@nestjs/testing';
import type { TelemetryEvent } from '@verdiron/domain';
import { AssetEntity, TelemetryEventRepository, TelemetryHotStore } from '@verdiron/persistence';
import type { DataSource, Repository } from 'typeorm';
import {
  DEFAULT_TELEMETRY_SAMPLE_MINUTES,
  MetricEngineService,
} from './metric-engine.service';
import { MetricRollupRefreshService } from './metric-rollup-refresh.service';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

const sampleEvent: TelemetryEvent = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  deviceId: 'dev-1',
  assetId: 'asset-exc-101',
  ts: '2026-06-15T12:00:00.000Z',
  lat: 45.5,
  lon: -73.5,
  speedKph: 0,
  engineOn: true,
  fuelLevelPct: 50,
  fuelRateLph: 8,
  engineHours: 100,
  odometerKm: 1000,
  rpm: 900,
};

describe('MetricEngineService', () => {
  let service: MetricEngineService;
  let assetRepository: jest.Mocked<Pick<Repository<AssetEntity>, 'findOne'>>;
  let insertEvent: jest.Mock;
  let putHotEvent: jest.Mock;
  let scheduleRefreshForTelemetry: jest.Mock;

  beforeEach(async () => {
    assetRepository = {
      findOne: jest.fn().mockResolvedValue({
        assetId: 'asset-exc-101',
        assetClass: 'heavy',
        fuelType: 'diesel',
        site: { siteId: 'site-north-yard' },
      }),
    };
    insertEvent = jest.fn().mockResolvedValue({ inserted: true });
    putHotEvent = jest.fn().mockResolvedValue(undefined);
    scheduleRefreshForTelemetry = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MetricEngineService,
        {
          provide: VERDIRON_DATA_SOURCE,
          useValue: {
            getRepository: jest.fn().mockReturnValue(assetRepository),
          } satisfies Partial<DataSource>,
        },
        {
          provide: TelemetryEventRepository,
          useValue: { insertEvent },
        },
        {
          provide: TelemetryHotStore,
          useValue: { putEvent: putHotEvent },
        },
        {
          provide: MetricRollupRefreshService,
          useValue: { scheduleRefreshForTelemetry },
        },
      ],
    }).compile();

    service = moduleRef.get(MetricEngineService);
  });

  it('derives metrics from domain formulas and persists normalized telemetry', async () => {
    const result = await service.processEvent(sampleEvent);

    expect(result.persisted).toBe(true);
    expect(result.metrics).toMatchObject({
      assetId: 'asset-exc-101',
      siteId: 'site-north-yard',
      assetClass: 'heavy',
      fuelType: 'diesel',
      idleMinutes: DEFAULT_TELEMETRY_SAMPLE_MINUTES,
      activeEngineHours: DEFAULT_TELEMETRY_SAMPLE_MINUTES / 60,
    });
    expect(result.metrics.fuelLiters).toBeCloseTo(8 / 60);
    expect(result.metrics.co2Kg).toBeCloseTo((8 / 60) * 2.68);
    expect(insertEvent).toHaveBeenCalledWith(sampleEvent);
    expect(putHotEvent).toHaveBeenCalledWith(sampleEvent);
    expect(scheduleRefreshForTelemetry).toHaveBeenCalledWith({
      assetId: 'asset-exc-101',
      siteId: 'site-north-yard',
      ts: sampleEvent.ts,
    });
  });

  it('throws when asset is unknown', async () => {
    assetRepository.findOne.mockResolvedValue(null);

    await expect(service.processEvent(sampleEvent)).rejects.toThrow(
      'Unknown asset: asset-exc-101',
    );
    expect(insertEvent).not.toHaveBeenCalled();
    expect(putHotEvent).not.toHaveBeenCalled();
    expect(scheduleRefreshForTelemetry).not.toHaveBeenCalled();
  });

  it('does not schedule rollup refresh when insert is a duplicate', async () => {
    insertEvent.mockResolvedValue({ inserted: false });

    const result = await service.processEvent(sampleEvent);

    expect(result.persisted).toBe(false);
    expect(scheduleRefreshForTelemetry).not.toHaveBeenCalled();
  });
});
