const STAR_TINTS = ['#f8fbff', '#7cf7ff', '#ffd166', '#ff6bd6'] as const;

export type StarTint = (typeof STAR_TINTS)[number];

export interface Star {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly alpha: number;
  readonly tint: StarTint;
}

export interface StarfieldOptions {
  readonly width: number;
  readonly height: number;
  readonly count: number;
  readonly seed: string;
}

export function starCountForViewport(width: number, height: number): number {
  const area = Math.max(1, width * height);
  return clamp(Math.floor(area / 4300), 120, 520);
}

export function generateStarfield(options: StarfieldOptions): Star[] {
  const width = Math.max(1, Math.floor(options.width));
  const height = Math.max(1, Math.floor(options.height));
  const count = Math.max(0, Math.floor(options.count));
  let state = hashSeed(options.seed);
  const stars: Star[] = [];

  for (let index = 0; index < count; index += 1) {
    state = nextState(state);
    const x = nextFloat(state) * width;

    state = nextState(state);
    const y = nextFloat(state) * height;

    state = nextState(state);
    const radius = 0.65 + nextFloat(state) * 2.25;

    state = nextState(state);
    const alpha = 0.38 + nextFloat(state) * 0.62;

    state = nextState(state);
    const tint = STAR_TINTS[Math.floor(nextFloat(state) * STAR_TINTS.length)] ?? STAR_TINTS[0];

    stars.push({
      x: roundCanvasValue(x),
      y: roundCanvasValue(y),
      radius: roundCanvasValue(radius),
      alpha: roundCanvasValue(alpha),
      tint
    });
  }

  return stars;
}

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function nextState(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function nextFloat(state: number): number {
  return state / 0x100000000;
}

function roundCanvasValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
