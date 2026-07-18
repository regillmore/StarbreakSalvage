export const PHASE_PROJECTILE_CYCLE_SECONDS = 0.48;
export const PHASE_COLLAPSE_EFFECT_SECONDS = 0.3;

export type PhaseProjectileBand = 'coherent' | 'splitting' | 'translated' | 'rejoining';

export interface PhaseProjectilePresentation {
  readonly band: PhaseProjectileBand;
  readonly cycleProgress: number;
  readonly headingRadians: number;
  readonly coreScale: number;
  readonly visibility: number;
  readonly apertureRadius: number;
  readonly apertureRotation: number;
  readonly echoDistance: number;
  readonly lateralOffset: number;
  readonly wakeLength: number;
}

export function isPhaseProjectile(tags: readonly string[]): boolean {
  return tags.includes('phase');
}

export function consumePhaseProjectileTag<TTag extends string>(
  tags: readonly TTag[]
): readonly TTag[] {
  return tags.filter((tag) => tag !== 'phase');
}

export function getPhaseCollapseRadius(projectileRadius: number): number {
  return Math.max(18, sanitizePositive(projectileRadius) * 5.2);
}

export function getPhaseProjectilePresentation(options: {
  readonly ageSeconds?: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
}): PhaseProjectilePresentation {
  const ageSeconds = sanitizePositive(options.ageSeconds ?? 0);
  const radius = Math.max(1, sanitizePositive(options.radius));
  const cycleProgress = round(
    wrap(ageSeconds, PHASE_PROJECTILE_CYCLE_SECONDS) / PHASE_PROJECTILE_CYCLE_SECONDS
  );
  const pulse = (Math.sin(cycleProgress * Math.PI * 2) + 1) / 2;
  const band: PhaseProjectileBand =
    cycleProgress < 0.2
      ? 'coherent'
      : cycleProgress < 0.43
        ? 'splitting'
        : cycleProgress < 0.74
          ? 'translated'
          : 'rejoining';

  return {
    band,
    cycleProgress,
    headingRadians: Math.atan2(options.vx, -options.vy),
    coreScale: round(0.88 + pulse * 0.22),
    visibility: round(0.7 + (1 - pulse) * 0.25),
    apertureRadius: round(radius * (1.72 + pulse * 0.44)),
    apertureRotation: round(cycleProgress * Math.PI * 2),
    echoDistance: round(radius * (2.2 + pulse * 1.55)),
    lateralOffset: round(radius * (0.62 + (1 - pulse) * 0.58)),
    wakeLength: round(radius * (3.8 + pulse * 2.4))
  };
}

function sanitizePositive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
