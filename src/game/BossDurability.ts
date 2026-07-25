import type { BossDefinition } from '../content/bosses';

export const BOSS_DPS_BENCHMARKS = [10, 20, 30] as const;
export const BOSS_DURABILITY_BASE_DPS = BOSS_DPS_BENCHMARKS[0];

export interface BossDurabilityProfile {
  readonly actNumber: number;
  readonly expectedDps: number;
  readonly hullMultiplier: number;
  readonly baselineHull: number;
  readonly baselineHullBonus: number;
  readonly scaledHullBonus: number;
  readonly maxHull: number;
  readonly nominalEngagementSeconds: number;
  readonly modifiedEngagementSeconds: number;
}

export function createBossDurabilityProfile(
  boss: Pick<BossDefinition, 'maxHull'>,
  options: {
    readonly actNumber?: number;
    readonly hullBonus?: number;
  } = {}
): BossDurabilityProfile {
  const actNumber = normalizeBossActNumber(options.actNumber);
  const expectedDps = getExpectedBossDps(actNumber);
  const hullMultiplier = expectedDps / BOSS_DURABILITY_BASE_DPS;
  const baselineHull = Math.max(1, Math.round(boss.maxHull));
  const baselineHullBonus = Math.floor(options.hullBonus ?? 0);
  const scaledHullBonus = Math.round(baselineHullBonus * hullMultiplier);
  const maxHull = Math.max(
    1,
    Math.round((baselineHull + baselineHullBonus) * hullMultiplier)
  );

  return {
    actNumber,
    expectedDps,
    hullMultiplier,
    baselineHull,
    baselineHullBonus,
    scaledHullBonus,
    maxHull,
    nominalEngagementSeconds: baselineHull / BOSS_DURABILITY_BASE_DPS,
    modifiedEngagementSeconds: maxHull / expectedDps
  };
}

export function getExpectedBossDps(actNumber: number): number {
  const normalizedActNumber = normalizeBossActNumber(actNumber);
  return (
    BOSS_DPS_BENCHMARKS[normalizedActNumber - 1] ??
    BOSS_DURABILITY_BASE_DPS * normalizedActNumber
  );
}

function normalizeBossActNumber(actNumber: number | null | undefined): number {
  return Number.isFinite(actNumber) ? Math.max(1, Math.floor(actNumber ?? 1)) : 1;
}
