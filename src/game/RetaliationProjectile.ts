export const RETALIATION_PROJECTILE_CYCLE_SECONDS = 0.64;

export interface RetaliationProjectilePresentation {
  readonly headingRadians: number;
  readonly pulse: number;
  readonly shellRadius: number;
  readonly shellRotation: number;
  readonly shoulderWidth: number;
  readonly wakeLength: number;
}

export function isRetaliationProjectile(tags: readonly string[]): boolean {
  return tags.includes('revenge');
}

export function getRetaliationProjectilePresentation(options: {
  readonly ageSeconds?: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
}): RetaliationProjectilePresentation {
  const ageSeconds = sanitizePositive(options.ageSeconds ?? 0);
  const radius = Math.max(1, sanitizePositive(options.radius));
  const cycleProgress =
    wrap(ageSeconds, RETALIATION_PROJECTILE_CYCLE_SECONDS) / RETALIATION_PROJECTILE_CYCLE_SECONDS;
  const pulse = 0.78 + (Math.sin(cycleProgress * Math.PI * 2) + 1) * 0.09;

  return {
    headingRadians: Math.atan2(options.vx, -options.vy),
    pulse: round(pulse),
    shellRadius: round(radius * (1.62 + pulse * 0.22)),
    shellRotation: round(cycleProgress * Math.PI * 2),
    shoulderWidth: round(radius * (1.15 + pulse * 0.25)),
    wakeLength: round(radius * (2.8 + pulse * 1.35))
  };
}

function sanitizePositive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
