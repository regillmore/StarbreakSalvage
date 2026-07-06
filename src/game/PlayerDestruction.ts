import type { ShipAppearance, ShipSilhouette } from '../content/ships';
import type { BulletContrast } from '../core/settingsData';
import { clamp } from '../core/math';

export type PlayerDestructionMotionMode = 'standard' | 'reduced' | 'performance';
export type PlayerDestructionDebrisShape = 'hull' | 'trim' | 'engine' | 'cockpit' | 'signal';

export interface PlayerDestructionOptions {
  readonly shipName: string;
  readonly appearance: ShipAppearance;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly reducedMotion: boolean;
  readonly performanceMode: boolean;
  readonly bulletContrast: BulletContrast;
}

export interface PlayerDestructionDebris {
  readonly id: string;
  readonly shape: PlayerDestructionDebrisShape;
  readonly originX: number;
  readonly originY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly size: number;
  readonly spin: number;
  readonly color: string;
}

export interface PlayerDestructionSequenceState {
  readonly shipName: string;
  readonly silhouette: ShipSilhouette;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly durationSeconds: number;
  readonly motionMode: PlayerDestructionMotionMode;
  readonly shockwaveScale: number;
  readonly debris: readonly PlayerDestructionDebris[];
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly trim: string;
    readonly engine: string;
    readonly cockpit: string;
    readonly warning: string;
  };
  elapsedSeconds: number;
}

export interface PlayerDestructionDebrisPresentation {
  readonly id: string;
  readonly shape: PlayerDestructionDebrisShape;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rotation: number;
  readonly alpha: number;
  readonly color: string;
}

export interface PlayerDestructionPresentation {
  readonly progress: number;
  readonly motionMode: PlayerDestructionMotionMode;
  readonly silhouette: ShipSilhouette;
  readonly radius: number;
  readonly shockwaveRadius: number;
  readonly shockwaveAlpha: number;
  readonly cockpitPulseRadius: number;
  readonly cockpitPulseAlpha: number;
  readonly failurePulseAlpha: number;
  readonly transponderAlpha: number;
  readonly transponderText: string;
  readonly center: {
    readonly x: number;
    readonly y: number;
  };
  readonly colors: PlayerDestructionSequenceState['colors'];
  readonly debris: readonly PlayerDestructionDebrisPresentation[];
}

const STANDARD_DURATION_SECONDS = 1.28;
const PERFORMANCE_DURATION_SECONDS = 1;
const REDUCED_DURATION_SECONDS = 0.72;

export function createPlayerDestructionSequence(
  options: PlayerDestructionOptions
): PlayerDestructionSequenceState {
  const motionMode = getMotionMode(options);
  const durationSeconds =
    motionMode === 'reduced'
      ? REDUCED_DURATION_SECONDS
      : motionMode === 'performance'
        ? PERFORMANCE_DURATION_SECONDS
        : STANDARD_DURATION_SECONDS;
  const debrisCount = motionMode === 'reduced' ? 5 : motionMode === 'performance' ? 8 : 12;
  const colors = createDestructionColors(options.appearance, options.bulletContrast);

  return {
    shipName: options.shipName,
    silhouette: options.appearance.silhouette,
    x: options.x,
    y: options.y,
    radius: Math.max(6, options.radius),
    durationSeconds,
    motionMode,
    shockwaveScale: motionMode === 'reduced' ? 0.58 : motionMode === 'performance' ? 0.78 : 1,
    debris: createDebris(options.appearance, colors, options.x, options.y, options.radius, debrisCount),
    colors,
    elapsedSeconds: 0
  };
}

export function advancePlayerDestructionSequence(
  state: PlayerDestructionSequenceState,
  dt: number
): boolean {
  state.elapsedSeconds = Math.min(
    state.durationSeconds,
    state.elapsedSeconds + Math.max(0, dt)
  );

  return state.elapsedSeconds >= state.durationSeconds;
}

export function getPlayerDestructionPresentation(
  state: PlayerDestructionSequenceState
): PlayerDestructionPresentation {
  const progress = clamp(state.elapsedSeconds / state.durationSeconds, 0, 1);
  const earlyFlash = 1 - clamp(progress / 0.36, 0, 1);
  const midPulse = Math.sin(progress * Math.PI);
  const debrisTravelScale = state.motionMode === 'reduced' ? 0.46 : 1;

  return {
    progress: roundDestructionValue(progress),
    motionMode: state.motionMode,
    silhouette: state.silhouette,
    radius: state.radius,
    shockwaveRadius: roundDestructionValue(
      state.radius * (1.15 + progress * 6.8 * state.shockwaveScale)
    ),
    shockwaveAlpha: roundDestructionValue((1 - progress) * 0.38 * state.shockwaveScale),
    cockpitPulseRadius: roundDestructionValue(state.radius * (0.62 + progress * 2.2)),
    cockpitPulseAlpha: roundDestructionValue((0.18 + midPulse * 0.58) * state.shockwaveScale),
    failurePulseAlpha: roundDestructionValue(Math.max(earlyFlash * 0.74, midPulse * 0.22)),
    transponderAlpha: roundDestructionValue(clamp((progress - 0.28) / 0.32, 0, 1) * (1 - progress * 0.3)),
    transponderText: `${state.shipName} TRANSPONDER LOST`,
    center: {
      x: state.x,
      y: state.y
    },
    colors: state.colors,
    debris: state.debris.map((debris) => {
      const drag = progress * (1 - progress * 0.18) * debrisTravelScale;

      return {
        id: debris.id,
        shape: debris.shape,
        x: roundDestructionValue(debris.originX + debris.velocityX * drag),
        y: roundDestructionValue(debris.originY + debris.velocityY * drag),
        size: debris.size,
        rotation: roundDestructionValue(debris.spin * progress),
        alpha: roundDestructionValue(clamp((1 - progress * 0.72) * (0.72 + earlyFlash * 0.28), 0, 1)),
        color: debris.color
      };
    })
  };
}

function getMotionMode(options: PlayerDestructionOptions): PlayerDestructionMotionMode {
  if (options.reducedMotion) {
    return 'reduced';
  }

  return options.performanceMode ? 'performance' : 'standard';
}

function createDestructionColors(
  appearance: ShipAppearance,
  bulletContrast: BulletContrast
): PlayerDestructionSequenceState['colors'] {
  if (bulletContrast === 'high') {
    return {
      primary: '#f8fbff',
      secondary: '#111827',
      trim: '#ffef5f',
      engine: '#ffd166',
      cockpit: '#ffffff',
      warning: '#ffef5f'
    };
  }

  return {
    primary: appearance.primaryColor,
    secondary: appearance.secondaryColor,
    trim: appearance.trimColor,
    engine: appearance.engineColor,
    cockpit: appearance.cockpitAccent,
    warning: '#ff5d6c'
  };
}

function createDebris(
  appearance: ShipAppearance,
  colors: PlayerDestructionSequenceState['colors'],
  x: number,
  y: number,
  radius: number,
  count: number
): PlayerDestructionDebris[] {
  const seed = stableHash(
    `${appearance.silhouette}:${appearance.hudThemeKey}:${appearance.weaponMounts.join(',')}`
  );
  const palette = [colors.primary, colors.secondary, colors.trim, colors.engine, colors.cockpit];
  const shapes: readonly PlayerDestructionDebrisShape[] = [
    'hull',
    'trim',
    'engine',
    'cockpit',
    'signal'
  ];

  return Array.from({ length: count }, (_value, index) => {
    const angle = ((seed % 37) / 37) * Math.PI * 2 + (Math.PI * 2 * index) / count;
    const radial = 0.32 + ((stableHash(`${seed}:radial:${index}`) % 34) / 100);
    const speed = radius * (2.6 + ((stableHash(`${seed}:speed:${index}`) % 90) / 100));
    const shape = shapes[index % shapes.length] ?? 'hull';

    return {
      id: `ship_debris_${index + 1}`,
      shape,
      originX: roundDestructionValue(x + Math.cos(angle) * radius * radial),
      originY: roundDestructionValue(y + Math.sin(angle) * radius * radial),
      velocityX: roundDestructionValue(Math.cos(angle) * speed),
      velocityY: roundDestructionValue(Math.sin(angle) * speed + radius * 0.5),
      size: roundDestructionValue(radius * (0.18 + (index % 4) * 0.045)),
      spin: roundDestructionValue((index % 2 === 0 ? 1 : -1) * (0.7 + index * 0.17)),
      color: palette[index % palette.length] ?? colors.primary
    };
  });
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function roundDestructionValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
