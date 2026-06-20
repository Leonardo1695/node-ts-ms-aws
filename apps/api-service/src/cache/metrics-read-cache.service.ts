import type { MetricsUpdatedEvent } from '@verdiron/domain';
import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

@Injectable()
export class MetricsReadCache {
  private version = 0;
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  getVersion(): number {
    return this.version;
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 30_000): void {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(event: MetricsUpdatedEvent): void {
    this.version += 1;
    this.entries.clear();
    void event;
  }

  clear(): void {
    this.version += 1;
    this.entries.clear();
  }
}
