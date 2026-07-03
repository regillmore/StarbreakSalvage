import type { SectorDefinition, SectorObjectiveKind } from '../content/sectors';

export interface SectorObjectivePlan {
  readonly kind: SectorObjectiveKind;
  readonly label: string;
  readonly requiredWaves: number;
  readonly spawnsPerWave: number;
  readonly requiredEnemyKills: number;
  readonly bossRequired: boolean;
  readonly bossSpawnAtSeconds: number | null;
}

const FIRST_WAVE_AT_SECONDS = 0.45;
const WAVE_SPACING_SECONDS = 1.35;
const BOSS_GATE_DELAY_SECONDS = 2.4;

export function createSectorObjectivePlan(
  sector: SectorDefinition,
  majorWaves: readonly string[]
): SectorObjectivePlan {
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
    bossSpawnAtSeconds: bossRequired ? getBossSpawnAtSeconds(requiredWaves) : null
  };
}

export function getWaveStartSeconds(waveIndex: number): number {
  return roundSeconds(FIRST_WAVE_AT_SECONDS + waveIndex * WAVE_SPACING_SECONDS);
}

export function getBossSpawnAtSeconds(requiredWaves: number): number {
  return roundSeconds(getWaveStartSeconds(Math.max(0, requiredWaves - 1)) + BOSS_GATE_DELAY_SECONDS);
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}
