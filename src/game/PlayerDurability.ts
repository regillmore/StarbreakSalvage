import { clamp } from '../core/math';
import { applyDamage } from '../systems/DamageSystem';

export interface PlayerDurabilityDamageOutcome {
  readonly incomingDamage: number;
  readonly guardAbsorbed: number;
  readonly hullDamage: number;
  readonly hull: number;
  readonly guard: number;
  readonly destroyed: boolean;
}

export function normalizePlayerHull(value: number, maxHull = Number.POSITIVE_INFINITY): number {
  const safeMax = Number.isFinite(maxHull)
    ? Math.max(0, Math.round(maxHull))
    : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(safeMax, Math.max(1, Math.ceil(value)));
}

export function normalizePlayerHullBonus(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export function normalizeIncomingPlayerDamage(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value)) : 0;
}

export function createPlayerGuardCapacity(
  maxHull: number,
  damageTakenMultiplier: number
): number {
  const hull = Math.max(1, Math.round(maxHull));
  const multiplier = clamp(
    Number.isFinite(damageTakenMultiplier) ? damageTakenMultiplier : 1,
    0.05,
    1
  );
  if (multiplier >= 1) return 0;

  return Math.max(1, Math.ceil(hull / multiplier) - hull);
}

export function applyPlayerDurabilityDamage(
  currentHull: number,
  currentGuard: number,
  amount: number
): PlayerDurabilityDamageOutcome {
  const hull = normalizePlayerHull(currentHull);
  const guard = normalizePlayerHullBonus(currentGuard);
  const incomingDamage = normalizeIncomingPlayerDamage(amount);
  const guardAbsorbed = Math.min(guard, incomingDamage);
  const hullOutcome = applyDamage(hull, incomingDamage - guardAbsorbed);

  return {
    incomingDamage,
    guardAbsorbed,
    hullDamage: hullOutcome.damageApplied,
    hull: hullOutcome.hull,
    guard: guard - guardAbsorbed,
    destroyed: hullOutcome.destroyed
  };
}
