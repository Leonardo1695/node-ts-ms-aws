import {
  PutCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import type { TelemetryEvent } from '@verdiron/domain';

/** Default hot-store retention window (DynamoDB TTL attribute, days). */
export const HOT_TELEMETRY_TTL_DAYS = 7;

export function buildHotTelemetryPartitionKey(assetId: string): string {
  return `ASSET#${assetId}`;
}

export function buildHotTelemetrySortKey(isoTimestamp: string): string {
  return `TS#${isoTimestamp}`;
}

export function computeHotTelemetryTtlEpochSeconds(
  isoTimestamp: string,
  retentionDays = HOT_TELEMETRY_TTL_DAYS,
): number {
  const eventTimeMs = Date.parse(isoTimestamp);
  return Math.floor((eventTimeMs + retentionDays * 86_400_000) / 1000);
}

export interface TelemetryHotStoreOptions {
  client: DynamoDBDocumentClient;
  tableName: string;
  retentionDays?: number;
}

function mapItemToTelemetryEvent(item: Record<string, unknown>): TelemetryEvent {
  return {
    eventId: String(item['eventId']),
    deviceId: String(item['deviceId']),
    assetId: String(item['assetId']),
    ts: String(item['ts']),
    lat: Number(item['lat']),
    lon: Number(item['lon']),
    speedKph: Number(item['speedKph']),
    engineOn: Boolean(item['engineOn']),
    fuelLevelPct: Number(item['fuelLevelPct']),
    fuelRateLph: Number(item['fuelRateLph']),
    engineHours: Number(item['engineHours']),
    odometerKm: Number(item['odometerKm']),
    rpm: Number(item['rpm']),
  };
}

/**
 * Hot raw telemetry access pattern for DynamoDB.
 *
 * Teaching note — single-table design:
 * - PK `ASSET#<id>` groups all recent events for one asset on one partition.
 * - SK `TS#<iso>` sorts time-ordered within the asset (ISO-8601 lex order matches time).
 * - `ttl` epoch seconds enables DynamoDB TTL to expire old hot rows automatically
 *   (enable TTL on the `ttl` attribute in real AWS; LocalStack accepts the attribute).
 */
export class TelemetryHotStore {
  private readonly retentionDays: number;

  constructor(private readonly options: TelemetryHotStoreOptions) {
    this.retentionDays = options.retentionDays ?? HOT_TELEMETRY_TTL_DAYS;
  }

  async putEvent(event: TelemetryEvent): Promise<void> {
    await this.options.client.send(
      new PutCommand({
        TableName: this.options.tableName,
        Item: {
          PK: buildHotTelemetryPartitionKey(event.assetId),
          SK: buildHotTelemetrySortKey(event.ts),
          eventId: event.eventId,
          deviceId: event.deviceId,
          assetId: event.assetId,
          ts: event.ts,
          lat: event.lat,
          lon: event.lon,
          speedKph: event.speedKph,
          engineOn: event.engineOn,
          fuelLevelPct: event.fuelLevelPct,
          fuelRateLph: event.fuelRateLph,
          engineHours: event.engineHours,
          odometerKm: event.odometerKm,
          rpm: event.rpm,
          ttl: computeHotTelemetryTtlEpochSeconds(
            event.ts,
            this.retentionDays,
          ),
        },
      }),
    );
  }

  async queryRecentByAsset(
    assetId: string,
    limit = 10,
  ): Promise<TelemetryEvent[]> {
    const response = await this.options.client.send(
      new QueryCommand({
        TableName: this.options.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': buildHotTelemetryPartitionKey(assetId),
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );

    return (response.Items ?? []).map((item) =>
      mapItemToTelemetryEvent(item as Record<string, unknown>),
    );
  }
}
