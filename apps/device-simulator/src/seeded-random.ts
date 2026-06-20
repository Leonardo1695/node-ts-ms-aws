export interface SeededRandom {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  pick<T>(values: readonly T[]): T;
}

/** Small deterministic PRNG for repeatable simulator output. */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  const next = (): number => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    nextInt(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    nextFloat(min, max) {
      return min + next() * (max - min);
    },
    pick(values) {
      const index = Math.floor(next() * values.length);
      return values[index]!;
    },
  };
}

export function createSeededUuid(random: SeededRandom): string {
  const bytes = Array.from({ length: 16 }, () => random.nextInt(0, 255));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
