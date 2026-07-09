import type { BossId } from '../content/bosses';
import type { FactionId } from '../content/factions';
import type { UnlockId } from '../content/unlocks';
import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import type { ActSectorContext } from './ActPlan';
import type { BossArenaPlan } from './BossArena';
import type { CombatEndReason } from './CombatState';
import type { SectorObjectivePlan } from './SectorObjectives';

export type SecondActFinaleVariantId =
  | 'reactorBreach'
  | 'ledgerMaw'
  | 'voidRansom';

export interface SecondActFinaleVariantDefinition {
  readonly id: SecondActFinaleVariantId;
  readonly name: string;
  readonly label: string;
  readonly summary: string;
  readonly victoryCopy: string;
  readonly defeatCopy: string;
  readonly abandonCopy: string;
  readonly bossHullBonus: number;
  readonly approachDistanceMultiplier: number;
  readonly approachSpeedMultiplier: number;
  readonly victoryUnlockId: UnlockId;
  readonly debugLabel: string;
}

export interface SecondActFinalePlan {
  readonly variantId: SecondActFinaleVariantId;
  readonly variantName: string;
  readonly label: string;
  readonly summary: string;
  readonly victoryCopy: string;
  readonly defeatCopy: string;
  readonly abandonCopy: string;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly bossFactionId: FactionId;
  readonly bossHullBonus: number;
  readonly approachDistanceMultiplier: number;
  readonly approachSpeedMultiplier: number;
  readonly victoryUnlockId: UnlockId;
  readonly debugLabel: string;
}

export interface SecondActFinaleDebugState {
  readonly variantId: SecondActFinaleVariantId;
  readonly label: string;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly bossHullBonus: number;
  readonly approachDistanceMultiplier: number;
  readonly approachSpeedMultiplier: number;
  readonly victoryUnlockId: UnlockId;
  readonly debugLabel: string;
}

export const SECOND_ACT_FINALE_VARIANTS: readonly SecondActFinaleVariantDefinition[] = [
  {
    id: 'reactorBreach',
    name: 'Reactor Breach',
    label: 'Reactor Breach Core',
    summary: 'The wreck vents heat and pressure through a longer final approach.',
    victoryCopy: 'Victory: Reactor Breach sealed and salvage uplink secured.',
    defeatCopy: 'Defeat: Reactor Breach overran the cockpit before the uplink locked.',
    abandonCopy: 'Abandoned: Reactor Breach left unresolved in the core descent.',
    bossHullBonus: 8,
    approachDistanceMultiplier: 1.12,
    approachSpeedMultiplier: 0.94,
    victoryUnlockId: 'unlock_music_core_descent',
    debugLabel: 'reactor-breach'
  },
  {
    id: 'ledgerMaw',
    name: 'Ledger Maw',
    label: 'Ledger Maw Core',
    summary: 'The wreck protects its final invoice with denser armor and a slower handoff.',
    victoryCopy: 'Victory: Ledger Maw closed, debt erased, core salvage released.',
    defeatCopy: 'Defeat: Ledger Maw collected the ship before the contract could close.',
    abandonCopy: 'Abandoned: Ledger Maw remains active in the accounting dark.',
    bossHullBonus: 10,
    approachDistanceMultiplier: 1.18,
    approachSpeedMultiplier: 0.9,
    victoryUnlockId: 'unlock_music_core_descent',
    debugLabel: 'ledger-maw'
  },
  {
    id: 'voidRansom',
    name: 'Void Ransom',
    label: 'Void Ransom Core',
    summary: 'The wreck drags the exit beacon through a quieter but more punishing approach.',
    victoryCopy: 'Victory: Void Ransom broken and the final beacon recovered.',
    defeatCopy: 'Defeat: Void Ransom cut the transponder before extraction.',
    abandonCopy: 'Abandoned: Void Ransom still owns the last beacon.',
    bossHullBonus: 7,
    approachDistanceMultiplier: 1.24,
    approachSpeedMultiplier: 0.88,
    victoryUnlockId: 'unlock_music_core_descent',
    debugLabel: 'void-ransom'
  }
];

export function createSecondActFinalePlan(options: {
  readonly sectorId: string;
  readonly act: ActSectorContext;
  readonly objective: Pick<SectorObjectivePlan, 'bossRequired'>;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly bossFactionId: FactionId;
  readonly rng: Rng;
}): SecondActFinalePlan | null {
  if (!isSecondActFinaleContext(options)) {
    return null;
  }

  const variant = options.rng.choice(SECOND_ACT_FINALE_VARIANTS);

  return {
    variantId: variant.id,
    variantName: variant.name,
    label: variant.label,
    summary: variant.summary,
    victoryCopy: variant.victoryCopy,
    defeatCopy: variant.defeatCopy,
    abandonCopy: variant.abandonCopy,
    bossId: options.bossId,
    bossName: options.bossName,
    bossFactionId: options.bossFactionId,
    bossHullBonus: variant.bossHullBonus,
    approachDistanceMultiplier: variant.approachDistanceMultiplier,
    approachSpeedMultiplier: variant.approachSpeedMultiplier,
    victoryUnlockId: variant.victoryUnlockId,
    debugLabel: `${variant.debugLabel}/${options.bossId}`
  };
}

export function isSecondActFinaleContext(options: {
  readonly sectorId: string;
  readonly act: ActSectorContext;
  readonly objective: Pick<SectorObjectivePlan, 'bossRequired'>;
}): boolean {
  return (
    options.act.actId === 'act_core_descent' &&
    options.act.bossGate.kind === 'finale' &&
    options.objective.bossRequired &&
    (options.sectorId === 'sector_core_wreck' ||
      options.act.actSectorIndex >= options.act.actSectorCount)
  );
}

export function applySecondActFinaleToBossArena(
  arena: BossArenaPlan | null,
  finale: SecondActFinalePlan | null | undefined
): BossArenaPlan | null {
  if (!arena || !finale) {
    return arena;
  }

  const lockDistance = arena.lockDistance;
  const baseApproachDistance = Math.max(1, lockDistance - arena.approachStartDistance);
  const maxApproachDistance = Math.max(baseApproachDistance, Math.min(lockDistance, 460));
  const approachDistance = roundFinaleValue(
    clamp(
      baseApproachDistance * finale.approachDistanceMultiplier,
      baseApproachDistance,
      maxApproachDistance
    )
  );
  const approachStartDistance = roundFinaleValue(
    clamp(lockDistance - approachDistance, 0, lockDistance)
  );

  return {
    ...arena,
    approachStartDistance,
    approachSpeed: roundFinaleValue(
      clamp(arena.approachSpeed * finale.approachSpeedMultiplier, 20, arena.exitSpeed)
    )
  };
}

export function createSecondActFinaleDebugState(
  finale: SecondActFinalePlan
): SecondActFinaleDebugState {
  return {
    variantId: finale.variantId,
    label: finale.label,
    bossId: finale.bossId,
    bossName: finale.bossName,
    bossHullBonus: finale.bossHullBonus,
    approachDistanceMultiplier: finale.approachDistanceMultiplier,
    approachSpeedMultiplier: finale.approachSpeedMultiplier,
    victoryUnlockId: finale.victoryUnlockId,
    debugLabel: finale.debugLabel
  };
}

export function formatSecondActFinaleBossName(
  finale: SecondActFinalePlan | null | undefined,
  fallbackBossName: string
): string {
  return finale ? `${finale.label} / ${fallbackBossName}` : fallbackBossName;
}

export function formatSecondActFinaleOutcome(
  finale: SecondActFinalePlan | null | undefined,
  reason: CombatEndReason | null | undefined
): string {
  if (!finale) {
    return 'No finale gate reached.';
  }

  if (reason === 'victory') {
    return finale.victoryCopy;
  }

  if (reason === 'destroyed') {
    return finale.defeatCopy;
  }

  if (reason === 'abandoned') {
    return finale.abandonCopy;
  }

  if (reason === 'debug') {
    return `Debug: ${finale.label} smoke path ended before official resolution.`;
  }

  if (reason === 'sectorComplete') {
    return `${finale.label}: final sector handoff pending.`;
  }

  return `${finale.label}: pending.`;
}

export function getSecondActFinaleSectorIndex<T extends {
  readonly finale?: SecondActFinalePlan | null;
}>(run: { readonly sectors: readonly T[] }): number {
  return run.sectors.findIndex((sector) => Boolean(sector.finale));
}

export function getSecondActFinalePlan<T extends {
  readonly finale?: SecondActFinalePlan | null;
}>(run: { readonly sectors: readonly T[] }): SecondActFinalePlan | null {
  const sectorIndex = getSecondActFinaleSectorIndex(run);
  return sectorIndex >= 0 ? (run.sectors[sectorIndex]?.finale ?? null) : null;
}

function roundFinaleValue(value: number): number {
  return Math.round(value * 100) / 100;
}
