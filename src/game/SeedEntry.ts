import { DEFAULT_SEED, parseSeedLabel } from '../core/rng';

export const KNOWN_SEED_LABELS = [
  DEFAULT_SEED,
  'LASER-TAX-404',
  'ORBITAL-JUNK-PROPHET',
  'VOID-CORSAIR-7'
] as const;

export type KnownSeedLabel = (typeof KNOWN_SEED_LABELS)[number];
export type SeedEntrySource = 'default' | 'known' | 'custom' | 'random';

export interface SeedEntryResolution {
  readonly seed: string;
  readonly source: SeedEntrySource;
  readonly status: string;
}

export type RandomSeedFactory = () => string;

export function previewSeedEntry(input: string | null | undefined): SeedEntryResolution {
  const normalized = parseSeedLabel(input, DEFAULT_SEED);

  if (isRandomSeedRequest(input)) {
    return {
      seed: 'RANDOM',
      source: 'random',
      status: 'New expedition | random route on launch'
    };
  }

  if (isDefaultSeedRequest(input)) {
    return createSeedResolution(DEFAULT_SEED, 'default');
  }

  return createSeedResolution(normalized, isKnownSeedLabel(normalized) ? 'known' : 'custom');
}

export function resolveSeedEntry(
  input: string | null | undefined,
  randomSeedFactory: RandomSeedFactory = createRandomSeed
): SeedEntryResolution {
  const normalized = parseSeedLabel(input, DEFAULT_SEED);

  if (isRandomSeedRequest(input)) {
    return createSeedResolution(parseSeedLabel(randomSeedFactory(), DEFAULT_SEED), 'random');
  }

  if (isDefaultSeedRequest(input)) {
    return createSeedResolution(DEFAULT_SEED, 'default');
  }

  return createSeedResolution(normalized, isKnownSeedLabel(normalized) ? 'known' : 'custom');
}

export function createRandomSeed(): string {
  const values = new Uint32Array(2);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
  } else {
    values[0] = Date.now() >>> 0;
    values[1] =
      typeof performance === 'undefined' ? 0 : Math.floor(performance.now() * 1000) >>> 0;
  }

  const token = Array.from(values, (value) =>
    value.toString(36).toUpperCase().padStart(6, '0')
  ).join('-');
  return `RANDOM-${token}`;
}

function isDefaultSeedRequest(input: string | null | undefined): boolean {
  const trimmed = input?.trim() ?? '';
  return parseSeedLabel(trimmed, DEFAULT_SEED) === 'DEFAULT';
}

function isRandomSeedRequest(input: string | null | undefined): boolean {
  const trimmed = input?.trim() ?? '';
  return trimmed.length === 0 || parseSeedLabel(trimmed, DEFAULT_SEED) === 'RANDOM';
}

function isKnownSeedLabel(seed: string): seed is KnownSeedLabel {
  return KNOWN_SEED_LABELS.includes(seed as KnownSeedLabel);
}

function createSeedResolution(seed: string, source: SeedEntrySource): SeedEntryResolution {
  return {
    seed,
    source,
    status: `Expedition ${seed} | ${formatSeedSource(source)}`
  };
}

function formatSeedSource(source: SeedEntrySource): string {
  if (source === 'default') {
    return 'reference route';
  }

  if (source === 'known') {
    return 'known reference route';
  }

  if (source === 'random') {
    return 'randomized route';
  }

  return 'custom route code';
}
