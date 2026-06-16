import { randomUUID } from 'node:crypto';
import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { TelemetryEvent } from '@verdiron/domain';

export interface TelemetryRawArchiveOptions {
  client: S3Client;
  bucketName: string;
  keyPrefix?: string;
}

export interface TelemetryArchivePartition {
  date: string;
  assetId: string;
  events: TelemetryEvent[];
}

export function extractTelemetryPartitionDate(ts: string): string {
  return ts.slice(0, 10);
}

export function buildTelemetryRawArchiveKey(
  date: string,
  assetId: string,
  batchId: string,
  keyPrefix = 'raw',
): string {
  return `${keyPrefix}/dt=${date}/asset=${assetId}/${batchId}.jsonl`;
}

export function groupTelemetryEventsByPartition(
  events: TelemetryEvent[],
): TelemetryArchivePartition[] {
  const groups = new Map<string, TelemetryArchivePartition>();

  for (const event of events) {
    const date = extractTelemetryPartitionDate(event.ts);
    const groupKey = `${date}|${event.assetId}`;
    const existing = groups.get(groupKey);

    if (existing) {
      existing.events.push(event);
      continue;
    }

    groups.set(groupKey, {
      date,
      assetId: event.assetId,
      events: [event],
    });
  }

  return [...groups.values()];
}

export class TelemetryRawArchive {
  private readonly keyPrefix: string;

  constructor(private readonly options: TelemetryRawArchiveOptions) {
    this.keyPrefix = options.keyPrefix ?? 'raw';
  }

  async archiveEvents(events: TelemetryEvent[]): Promise<string[]> {
    if (events.length === 0) {
      return [];
    }

    const objectKeys: string[] = [];

    for (const partition of groupTelemetryEventsByPartition(events)) {
      const batchId = randomUUID();
      const key = buildTelemetryRawArchiveKey(
        partition.date,
        partition.assetId,
        batchId,
        this.keyPrefix,
      );
      const body = `${partition.events.map((event) => JSON.stringify(event)).join('\n')}\n`;

      await this.options.client.send(
        new PutObjectCommand({
          Bucket: this.options.bucketName,
          Key: key,
          Body: body,
          ContentType: 'application/x-ndjson',
        }),
      );

      objectKeys.push(key);
    }

    return objectKeys;
  }
}
