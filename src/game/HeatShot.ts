import { clamp } from '../core/math';

export const HEAT_SHOT_COST_RATIO = 0.32;
export const HEAT_EXHAUST_EFFECT_SECONDS = 0.42;

export type ProjectileVisualKind = 'heatShot';

export interface HeatShotPresentationInput {
  readonly ageSeconds?: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
}

export interface HeatShotPresentation {
  readonly headingRadians: number;
  readonly pulse: number;
  readonly coreLength: number;
  readonly coreWidth: number;
  readonly shellRadius: number;
  readonly wakeLength: number;
  readonly wakeSpread: number;
}

export function getHeatShotCost(overheatLimit: number): number {
  return Math.max(0, overheatLimit) * HEAT_SHOT_COST_RATIO;
}

export function getHeatShotPresentation(input: HeatShotPresentationInput): HeatShotPresentation {
  const ageSeconds = Math.max(0, input.ageSeconds ?? 0);
  const radius = Math.max(3, input.radius);
  const speed = Math.hypot(input.vx, input.vy);
  const cycle = (ageSeconds % 0.36) / 0.36;
  const pulse = clamp(0.78 + Math.sin(cycle * Math.PI * 2) * 0.14, 0.62, 0.94);

  return {
    headingRadians: Math.atan2(input.vx, -input.vy),
    pulse,
    coreLength: radius * 2.55,
    coreWidth: radius * 1.12,
    shellRadius: radius * (1.36 + pulse * 0.18),
    wakeLength: radius * (3.4 + clamp(speed / 720, 0, 1) * 1.8),
    wakeSpread: radius * 0.72
  };
}
