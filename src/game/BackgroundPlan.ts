import type {
  BackgroundDefinition,
  BackgroundId,
  BackgroundLayerDefinition,
  BackgroundLayerKind,
  BackgroundPalette
} from '../content/backgrounds';
import type { Rng } from '../core/rng';

export type BackgroundPrimitiveKind =
  | 'spark'
  | 'streak'
  | 'plate'
  | 'rail'
  | 'gridLine'
  | 'strand'
  | 'bloom'
  | 'fracture'
  | 'crater'
  | 'ridge'
  | 'tower'
  | 'shadow';

export interface BackgroundPrimitive {
  readonly kind: BackgroundPrimitiveKind;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly length: number;
  readonly width: number;
  readonly rotation: number;
  readonly alpha: number;
  readonly color: string;
  readonly accentColor: string;
}

export interface BackgroundLayerPlan {
  readonly id: string;
  readonly kind: BackgroundLayerKind;
  readonly priority: 1 | 2 | 3;
  readonly parallax: number;
  readonly alpha: number;
  readonly primitives: readonly BackgroundPrimitive[];
}

export interface BackgroundPlan {
  readonly id: BackgroundId;
  readonly name: string;
  readonly palette: BackgroundPalette;
  readonly layers: readonly BackgroundLayerPlan[];
  readonly primitiveCount: number;
}

export function createBackgroundPlan(definition: BackgroundDefinition, rng: Rng): BackgroundPlan {
  const layers = definition.layers.map((layer) =>
    createLayerPlan(layer, rng.fork(`layer-${layer.id}`))
  );

  return {
    id: definition.id,
    name: definition.name,
    palette: definition.palette,
    layers,
    primitiveCount: layers.reduce((total, layer) => total + layer.primitives.length, 0)
  };
}

export function summarizeBackgroundPlan(plan: BackgroundPlan): unknown {
  return {
    id: plan.id,
    layerCount: plan.layers.length,
    primitiveCount: plan.primitiveCount,
    layers: plan.layers.map((layer) => ({
      id: layer.id,
      kind: layer.kind,
      primitives: layer.primitives.length,
      first: layer.primitives[0]
        ? {
            kind: layer.primitives[0].kind,
            x: layer.primitives[0].x,
            y: layer.primitives[0].y,
            size: layer.primitives[0].size,
            length: layer.primitives[0].length,
            rotation: layer.primitives[0].rotation
          }
        : null
    }))
  };
}

function createLayerPlan(layer: BackgroundLayerDefinition, rng: Rng): BackgroundLayerPlan {
  const primitives: BackgroundPrimitive[] = [];

  for (let index = 0; index < layer.density; index += 1) {
    primitives.push(createPrimitive(layer, rng, index));
  }

  return {
    id: layer.id,
    kind: layer.kind,
    priority: layer.priority,
    parallax: layer.parallax,
    alpha: layer.alpha,
    primitives
  };
}

function createPrimitive(
  layer: BackgroundLayerDefinition,
  rng: Rng,
  index: number
): BackgroundPrimitive {
  const x = ratio(rng);
  const y = ratio(rng);
  const color = rng.nextFloat() < 0.22 ? (layer.accentColor ?? layer.color) : layer.color;
  const accentColor = layer.accentColor ?? layer.color;

  switch (layer.kind) {
    case 'deepStars':
      return {
        kind: 'spark',
        x,
        y,
        size: round(0.0014 + rng.nextFloat() * 0.0038),
        length: 0,
        width: 0,
        rotation: 0,
        alpha: round(0.45 + rng.nextFloat() * 0.55),
        color,
        accentColor
      };
    case 'dust':
    case 'reactorEmbers':
      return {
        kind: rng.nextFloat() < 0.45 ? 'spark' : 'streak',
        x,
        y,
        size: round(0.0018 + rng.nextFloat() * 0.004),
        length: round(0.014 + rng.nextFloat() * 0.034),
        width: round(0.001 + rng.nextFloat() * 0.002),
        rotation: round(-0.35 + rng.nextFloat() * 0.7),
        alpha: round(0.42 + rng.nextFloat() * 0.42),
        color,
        accentColor
      };
    case 'debris':
      return {
        kind: rng.nextFloat() < 0.7 ? 'streak' : 'plate',
        x,
        y,
        size: round(0.006 + rng.nextFloat() * 0.018),
        length: round(0.022 + rng.nextFloat() * 0.06),
        width: round(0.002 + rng.nextFloat() * 0.007),
        rotation: round(-1.1 + rng.nextFloat() * 2.2),
        alpha: round(0.38 + rng.nextFloat() * 0.36),
        color,
        accentColor
      };
    case 'wreckPlates':
      return {
        kind: 'plate',
        x,
        y,
        size: round(0.032 + rng.nextFloat() * 0.08),
        length: round(0.06 + rng.nextFloat() * 0.14),
        width: round(0.014 + rng.nextFloat() * 0.04),
        rotation: round(-0.9 + rng.nextFloat() * 1.8),
        alpha: round(0.38 + rng.nextFloat() * 0.34),
        color,
        accentColor
      };
    case 'tradeRails':
    case 'warningRails':
      return {
        kind: 'rail',
        x,
        y,
        size: 0,
        length: round(0.38 + rng.nextFloat() * 0.92),
        width: round(0.0025 + rng.nextFloat() * 0.007),
        rotation: round((index % 2 === 0 ? -1 : 1) * (0.05 + rng.nextFloat() * 0.22)),
        alpha: round(0.46 + rng.nextFloat() * 0.34),
        color,
        accentColor
      };
    case 'signalTicks':
      return {
        kind: 'streak',
        x,
        y,
        size: round(0.003 + rng.nextFloat() * 0.006),
        length: round(0.018 + rng.nextFloat() * 0.052),
        width: round(0.0015 + rng.nextFloat() * 0.004),
        rotation: round(rng.choice([-1, 1]) * (Math.PI / 2 + rng.nextFloat() * 0.2)),
        alpha: round(0.42 + rng.nextFloat() * 0.36),
        color,
        accentColor
      };
    case 'bloomSpores':
      return {
        kind: 'bloom',
        x,
        y,
        size: round(0.008 + rng.nextFloat() * 0.04),
        length: round(0.014 + rng.nextFloat() * 0.055),
        width: round(0.006 + rng.nextFloat() * 0.024),
        rotation: round(rng.nextFloat() * Math.PI),
        alpha: round(0.28 + rng.nextFloat() * 0.34),
        color,
        accentColor
      };
    case 'bloomStrands':
      return {
        kind: 'strand',
        x,
        y,
        size: round(0.012 + rng.nextFloat() * 0.04),
        length: round(0.08 + rng.nextFloat() * 0.18),
        width: round(0.0015 + rng.nextFloat() * 0.004),
        rotation: round(-0.55 + rng.nextFloat() * 1.1),
        alpha: round(0.34 + rng.nextFloat() * 0.3),
        color,
        accentColor
      };
    case 'killGrid':
      return {
        kind: 'gridLine',
        x,
        y,
        size: 0,
        length: round(0.24 + rng.nextFloat() * 0.82),
        width: round(0.001 + rng.nextFloat() * 0.0035),
        rotation: index % 3 === 0 ? Math.PI / 2 : round(-0.08 + rng.nextFloat() * 0.16),
        alpha: round(0.32 + rng.nextFloat() * 0.3),
        color,
        accentColor
      };
    case 'craterRims':
      return {
        kind: 'crater',
        x,
        y,
        size: round(0.024 + rng.nextFloat() * 0.07),
        length: round(0.055 + rng.nextFloat() * 0.16),
        width: round(0.006 + rng.nextFloat() * 0.018),
        rotation: round(-0.35 + rng.nextFloat() * 0.7),
        alpha: round(0.3 + rng.nextFloat() * 0.32),
        color,
        accentColor
      };
    case 'lunarRidges':
      return {
        kind: 'ridge',
        x,
        y,
        size: round(0.01 + rng.nextFloat() * 0.036),
        length: round(0.12 + rng.nextFloat() * 0.28),
        width: round(0.0015 + rng.nextFloat() * 0.004),
        rotation: round(-0.22 + rng.nextFloat() * 0.44),
        alpha: round(0.32 + rng.nextFloat() * 0.28),
        color,
        accentColor
      };
    case 'surfaceTowers':
      return {
        kind: 'tower',
        x,
        y,
        size: round(0.014 + rng.nextFloat() * 0.04),
        length: round(0.045 + rng.nextFloat() * 0.12),
        width: round(0.006 + rng.nextFloat() * 0.018),
        rotation: round(-0.08 + rng.nextFloat() * 0.16),
        alpha: round(0.34 + rng.nextFloat() * 0.28),
        color,
        accentColor
      };
    case 'wreckShadows':
      return {
        kind: 'shadow',
        x,
        y,
        size: round(0.032 + rng.nextFloat() * 0.075),
        length: round(0.11 + rng.nextFloat() * 0.24),
        width: round(0.012 + rng.nextFloat() * 0.038),
        rotation: round(-0.5 + rng.nextFloat() * 1),
        alpha: round(0.28 + rng.nextFloat() * 0.24),
        color,
        accentColor
      };
    case 'coreFractures':
      return {
        kind: 'fracture',
        x,
        y,
        size: round(0.026 + rng.nextFloat() * 0.1),
        length: round(0.07 + rng.nextFloat() * 0.22),
        width: round(0.012 + rng.nextFloat() * 0.046),
        rotation: round(-1.2 + rng.nextFloat() * 2.4),
        alpha: round(0.34 + rng.nextFloat() * 0.32),
        color,
        accentColor
      };
  }
}

function ratio(rng: Rng): number {
  return round(rng.nextFloat());
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
