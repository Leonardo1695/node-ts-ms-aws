import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { shutdownVerdironTracing } from '@verdiron/tracing';

@Injectable()
export class TracingShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await shutdownVerdironTracing();
  }
}
