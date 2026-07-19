import { clamp } from '../core/math';

export type LaserProjectileKind = 'needle' | 'split' | 'beam' | 'lane' | 'fork';

export interface LaserProjectilePresentationInput {
  readonly ageSeconds?: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
  readonly kind: LaserProjectileKind;
}

export interface LaserProjectilePresentation {
  readonly headingRadians: number;
  readonly pulse: number;
  readonly coreLength: number;
  readonly coreWidth: number;
  readonly shellWidth: number;
  readonly wakeLength: number;
  readonly branchSpread: number;
}

const LASER_KIND_SCALE: Readonly<
  Record<
    LaserProjectileKind,
    {
      readonly length: number;
      readonly width: number;
      readonly shell: number;
      readonly wake: number;
      readonly branch: number;
    }
  >
> = {
  needle: { length: 4.8, width: 0.48, shell: 1.2, wake: 3.8, branch: 0 },
  split: { length: 4.15, width: 0.42, shell: 1.55, wake: 3.35, branch: 0.72 },
  beam: { length: 8.4, width: 0.72, shell: 2.15, wake: 5.2, branch: 0 },
  lane: { length: 6.5, width: 0.36, shell: 1.75, wake: 4.6, branch: 0.9 },
  fork: { length: 5.2, width: 0.4, shell: 1.7, wake: 3.8, branch: 1.18 }
};

export function getLaserProjectileKind(
  tags: readonly string[],
  authoredKind?: LaserProjectileKind
): LaserProjectileKind | null {
  if (authoredKind) return authoredKind;
  return tags.includes('laser') ? 'needle' : null;
}

export function getLaserProjectilePresentation(
  input: LaserProjectilePresentationInput
): LaserProjectilePresentation {
  const ageSeconds = Math.max(0, input.ageSeconds ?? 0);
  const radius = Math.max(2.5, input.radius);
  const scale = LASER_KIND_SCALE[input.kind];
  const cycleSeconds = input.kind === 'beam' ? 0.24 : 0.36;
  const cycle = (ageSeconds % cycleSeconds) / cycleSeconds;
  const pulse = clamp(0.82 + Math.sin(cycle * Math.PI * 2) * 0.12, 0.7, 0.94);
  const speedScale = clamp(Math.hypot(input.vx, input.vy) / 820, 0.35, 1.25);

  return {
    headingRadians: Math.atan2(input.vx, -input.vy),
    pulse,
    coreLength: radius * scale.length,
    coreWidth: Math.max(1.25, radius * scale.width),
    shellWidth: radius * scale.shell,
    wakeLength: radius * scale.wake * speedScale,
    branchSpread: radius * scale.branch
  };
}
