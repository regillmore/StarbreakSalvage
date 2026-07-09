import type { SectorDefinition, SectorObjectiveKind } from '../content/sectors';
import type { ActSectorContext } from './ActPlan';

export type SectorObjectiveVariantId =
  | 'standardSweep'
  | 'act2DeepSweep'
  | 'act2LunarSkim'
  | 'act2ConvoyPursuit'
  | 'act2BossApproach'
  | 'act2CoreFinale';

export type SectorObjectivePressureBand = 'baseline' | 'sustained' | 'volatile' | 'finale';

export interface SectorObjectiveVariantPlan {
  readonly id: SectorObjectiveVariantId;
  readonly label: string;
  readonly summary: string;
  readonly pressureBand: SectorObjectivePressureBand;
  readonly travelGateRatio: number;
}

export interface SectorObjectivePlan {
  readonly kind: SectorObjectiveKind;
  readonly label: string;
  readonly requiredWaves: number;
  readonly spawnsPerWave: number;
  readonly requiredEnemyKills: number;
  readonly bossRequired: boolean;
  readonly bossSpawnAtSeconds: number | null;
  readonly variantId?: SectorObjectiveVariantId;
  readonly variantLabel?: string;
  readonly variantSummary?: string;
  readonly pressureBand?: SectorObjectivePressureBand;
  readonly travelGateRatio?: number;
}

const FIRST_WAVE_AT_SECONDS = 0.45;
const WAVE_SPACING_SECONDS = 1.35;
const BOSS_GATE_DELAY_SECONDS = 2.4;
const STANDARD_OBJECTIVE_VARIANT: SectorObjectiveVariantPlan = {
  id: 'standardSweep',
  label: 'Standard sweep',
  summary: 'Baseline support waves and full-sector travel gate.',
  pressureBand: 'baseline',
  travelGateRatio: 1
};

export function createSectorObjectivePlan(
  sector: SectorDefinition,
  majorWaves: readonly string[],
  act?: ActSectorContext
): SectorObjectivePlan {
  const variant = chooseObjectiveVariant(sector, act);
  const requiredWaves = Math.max(1, Math.min(sector.objective.waveCount, majorWaves.length));
  const spawnsPerWave = Math.max(1, sector.objective.spawnsPerWave);
  const bossRequired = sector.objective.kind === 'defeatBoss' || sector.objective.bossGate;

  return {
    kind: sector.objective.kind,
    label: sector.objective.label,
    requiredWaves,
    spawnsPerWave,
    requiredEnemyKills: requiredWaves * spawnsPerWave,
    bossRequired,
    bossSpawnAtSeconds: bossRequired ? getBossSpawnAtSeconds(requiredWaves) : null,
    variantId: variant.id,
    variantLabel: variant.label,
    variantSummary: variant.summary,
    pressureBand: variant.pressureBand,
    travelGateRatio: variant.travelGateRatio
  };
}

export function getWaveStartSeconds(waveIndex: number): number {
  return roundSeconds(FIRST_WAVE_AT_SECONDS + waveIndex * WAVE_SPACING_SECONDS);
}

export function getBossSpawnAtSeconds(requiredWaves: number): number {
  return roundSeconds(
    getWaveStartSeconds(Math.max(0, requiredWaves - 1)) + BOSS_GATE_DELAY_SECONDS
  );
}

export function formatSectorObjectiveVariantReadout(objective: SectorObjectivePlan): string | null {
  if (!objective.variantId || objective.variantId === 'standardSweep') {
    return null;
  }

  return `Objective variant: ${objective.variantLabel ?? objective.variantId} (${
    objective.pressureBand ?? 'baseline'
  } pressure, travel gate ${Math.round((objective.travelGateRatio ?? 1) * 100)}%).`;
}

export function formatSectorObjectiveVariantDebug(objective: SectorObjectivePlan): string | null {
  if (!objective.variantId || objective.variantId === 'standardSweep') {
    return null;
  }

  return `${objective.variantId} ${objective.pressureBand ?? 'baseline'} G${Math.round(
    (objective.travelGateRatio ?? 1) * 100
  )}`;
}

function chooseObjectiveVariant(
  sector: SectorDefinition,
  act: ActSectorContext | undefined
): SectorObjectiveVariantPlan {
  if (!act || act.actId !== 'act_core_descent') {
    return STANDARD_OBJECTIVE_VARIANT;
  }

  if (sector.id === 'sector_core_wreck' || act.actSectorIndex >= act.actSectorCount) {
    return {
      id: 'act2CoreFinale',
      label: 'Core finale gate',
      summary: 'Finale support sweep, arena handoff, and full exit travel.',
      pressureBand: 'finale',
      travelGateRatio: 1
    };
  }

  if (sector.objective.kind === 'defeatBoss' || sector.objective.bossGate) {
    return {
      id: 'act2BossApproach',
      label: 'Overseer approach',
      summary: 'Support waves stage a slower boss approach instead of raw density.',
      pressureBand: 'volatile',
      travelGateRatio: 1
    };
  }

  if (sector.id === 'sector_lunar_surface') {
    return {
      id: 'act2LunarSkim',
      label: 'Low-orbit skim',
      summary: 'Terrain-aware sweep with extra breathing room between pressure lanes.',
      pressureBand: 'sustained',
      travelGateRatio: 1
    };
  }

  if (sector.id === 'sector_trade_war_corridor') {
    return {
      id: 'act2ConvoyPursuit',
      label: 'Convoy pursuit',
      summary: 'Two support screens with a longer regroup and sharper route pressure.',
      pressureBand: 'sustained',
      travelGateRatio: 1
    };
  }

  return {
    id: 'act2DeepSweep',
    label: 'Deep-sector sweep',
    summary: 'Act II sweep pacing with sustained pressure and planned relief windows.',
    pressureBand: 'sustained',
    travelGateRatio: 1
  };
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}
