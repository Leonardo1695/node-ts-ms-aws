import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  computeAssetMetricsFromIntervals,
  type AssetMetricContribution,
  type TelemetryEvent,
  type TelemetryInterval,
} from '@verdiron/domain';
import { AssetEntity, TelemetryEventRepository } from '@verdiron/persistence';
import type { DataSource } from 'typeorm';
import { VERDIRON_DATA_SOURCE } from '../persistence/persistence.module';

/** One Kinesis telemetry snapshot is treated as a one-minute observation window. */
export const DEFAULT_TELEMETRY_SAMPLE_MINUTES = 1;

export interface MetricEngineResult {
  metrics: AssetMetricContribution;
  persisted: boolean;
}

@Injectable()
export class MetricEngineService {
  constructor(
    @Inject(VERDIRON_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly telemetryEventRepository: TelemetryEventRepository,
  ) {}

  async processEvent(event: TelemetryEvent): Promise<MetricEngineResult> {
    const asset = await this.dataSource.getRepository(AssetEntity).findOne({
      where: { assetId: event.assetId },
      relations: ['site'],
    });

    if (!asset) {
      throw new NotFoundException(`Unknown asset: ${event.assetId}`);
    }

    const interval = this.toTelemetryInterval(event);
    const metrics = computeAssetMetricsFromIntervals({
      assetId: asset.assetId,
      siteId: asset.site.siteId,
      assetClass: asset.assetClass,
      fuelType: asset.fuelType,
      availableHours: DEFAULT_TELEMETRY_SAMPLE_MINUTES / 60,
      intervals: [interval],
    });

    const insertResult = await this.telemetryEventRepository.insertEvent(event);
    const persisted =
      (insertResult.identifiers?.length ?? 0) > 0 ||
      (insertResult.raw?.length ?? 0) > 0;

    return { metrics, persisted };
  }

  toTelemetryInterval(event: TelemetryEvent): TelemetryInterval {
    return {
      durationMinutes: DEFAULT_TELEMETRY_SAMPLE_MINUTES,
      engineOn: event.engineOn,
      speedKph: event.speedKph,
      fuelRateLph: event.fuelRateLph,
    };
  }
}
