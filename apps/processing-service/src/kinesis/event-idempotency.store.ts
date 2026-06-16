export class InMemoryEventIdempotencyStore {
  private readonly seenEventIds = new Set<string>();

  has(eventId: string): boolean {
    return this.seenEventIds.has(eventId);
  }

  add(eventId: string): void {
    this.seenEventIds.add(eventId);
  }

  count(): number {
    return this.seenEventIds.size;
  }
}
