export interface WeightedChoice<T> {
  readonly item: T;
  readonly weight: number;
}

export interface Rng {
  readonly seedLabel: string;
  nextU32(): number;
  nextFloat(): number;
  int(minInclusive: number, maxInclusive: number): number;
  choice<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  weightedChoice<T>(items: readonly WeightedChoice<T>[]): T;
  fork(label: string): Rng;
}

export const DEFAULT_SEED = 'STARBREAK-SMOKE';
const UINT32_RANGE = 0x1_0000_0000;

export function parseSeedLabel(input: string | null | undefined, fallback = DEFAULT_SEED): string {
  const trimmed = input?.trim() ?? '';

  if (trimmed.length === 0) {
    return fallback;
  }

  const parsed = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return parsed.length > 0 ? parsed : fallback;
}

export function createRng(seedInput: string | null | undefined): Rng {
  return new SeededRng(parseSeedLabel(seedInput));
}

class SeededRng implements Rng {
  private state: number;

  public constructor(public readonly seedLabel: string) {
    this.state = hashSeed(seedLabel);
  }

  public nextU32(): number {
    this.state = (this.state + 0x9e3779b9) >>> 0;

    let value = this.state;
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
    return (value ^ (value >>> 15)) >>> 0;
  }

  public nextFloat(): number {
    return this.nextU32() / UINT32_RANGE;
  }

  public int(minInclusive: number, maxInclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
      throw new Error('Rng.int requires integer bounds.');
    }

    if (maxInclusive < minInclusive) {
      throw new Error('Rng.int requires maxInclusive >= minInclusive.');
    }

    const span = maxInclusive - minInclusive + 1;
    return minInclusive + Math.floor(this.nextFloat() * span);
  }

  public choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Rng.choice requires at least one item.');
    }

    const selected = items[this.int(0, items.length - 1)];

    if (selected === undefined) {
      throw new Error('Rng.choice selected outside the available item range.');
    }

    return selected;
  }

  public shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = this.int(0, index);
      const current = shuffled[index];
      const replacement = shuffled[swapIndex];

      if (current === undefined || replacement === undefined) {
        throw new Error('Rng.shuffle selected outside the available item range.');
      }

      shuffled[index] = replacement;
      shuffled[swapIndex] = current;
    }

    return shuffled;
  }

  public weightedChoice<T>(items: readonly WeightedChoice<T>[]): T {
    if (items.length === 0) {
      throw new Error('Rng.weightedChoice requires at least one item.');
    }

    const totalWeight = items.reduce((total, entry) => total + sanitizeWeight(entry.weight), 0);

    if (totalWeight <= 0) {
      throw new Error('Rng.weightedChoice requires at least one positive weight.');
    }

    let roll = this.nextFloat() * totalWeight;

    for (const entry of items) {
      roll -= sanitizeWeight(entry.weight);

      if (roll < 0) {
        return entry.item;
      }
    }

    const fallback = items[items.length - 1];

    if (!fallback) {
      throw new Error('Rng.weightedChoice selected outside the available item range.');
    }

    return fallback.item;
  }

  public fork(label: string): Rng {
    return new SeededRng(`${this.seedLabel}:${parseSeedLabel(label, 'FORK')}`);
  }
}

function sanitizeWeight(weight: number): number {
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}
