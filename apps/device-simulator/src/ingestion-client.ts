import type { TelemetryEvent } from '@verdiron/domain';

export interface IngestionClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export class IngestionClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: IngestionClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async postTelemetry(
    payload: TelemetryEvent | TelemetryEvent[],
  ): Promise<void> {
    const response = await this.fetchImpl(
      `${this.options.baseUrl.replace(/\/$/, '')}/api/v1/telemetry`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.options.apiKey,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `ingestion rejected telemetry (${response.status}): ${body}`,
      );
    }
  }
}
