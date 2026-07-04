import { FACTIONS, type FactionId } from '../content/factions';
import { createRng, type Rng } from '../core/rng';
import type { CombatState, EnemySpawn } from './CombatState';
import type { SectorObjectivePlan } from './SectorObjectives';
import { getWaveStartSeconds } from './SectorObjectives';

export interface DirectedWave {
  readonly index: number;
  readonly label: string;
  readonly startsAtSeconds: number;
  readonly spawnCount: number;
}

export interface WaveDirectorPlan {
  readonly objective: SectorObjectivePlan;
  readonly waves: readonly DirectedWave[];
  readonly spawnSchedule: readonly EnemySpawn[];
  readonly bossSpawnAtSeconds: number | null;
}

export interface ObjectiveProgress {
  readonly label: string;
  readonly readout: string;
  readonly supportKills: number;
  readonly requiredEnemyKills: number;
  readonly completedWaves: number;
  readonly requiredWaves: number;
  readonly bossDefeated: boolean;
  readonly complete: boolean;
}

export type ObjectiveProgressState = Pick<
  CombatState,
  'nextSpawnIndex' | 'enemies' | 'boss' | 'stats'
>;

export interface WaveDirectorOptions {
  readonly seed: string;
  readonly objective: SectorObjectivePlan;
  readonly majorWaves: readonly string[];
  readonly preferredFactionId: FactionId;
  readonly availableFactionIds?: readonly FactionId[];
}

export function createWaveDirectorPlan(options: WaveDirectorOptions): WaveDirectorPlan {
  const waves = options.majorWaves
    .slice(0, options.objective.requiredWaves)
    .map((label, index) => ({
      index,
      label,
      startsAtSeconds: getWaveStartSeconds(index),
      spawnCount: options.objective.spawnsPerWave
    }));
  const rng = createRng(options.seed).fork('wave-director');
  const spawnSchedule = waves.flatMap((wave) =>
    createWaveSpawns({
      rng: rng.fork(`wave-${wave.index + 1}-${wave.label}`),
      wave,
      preferredFactionId: options.preferredFactionId,
      availableFactionIds: options.availableFactionIds ?? FACTIONS.map((faction) => faction.id)
    })
  );

  return {
    objective: options.objective,
    waves,
    spawnSchedule,
    bossSpawnAtSeconds: options.objective.bossSpawnAtSeconds
  };
}

export function getObjectiveProgress(
  plan: WaveDirectorPlan,
  state: ObjectiveProgressState
): ObjectiveProgress {
  const bossDefeated = state.stats.bossesDefeated > 0;
  const supportKills = Math.max(0, state.stats.enemiesDestroyed - state.stats.bossesDefeated);
  const cappedSupportKills = Math.min(supportKills, plan.objective.requiredEnemyKills);
  const completedWaves = Math.min(
    plan.objective.requiredWaves,
    Math.floor(cappedSupportKills / plan.objective.spawnsPerWave)
  );
  const allSpawnsIssued = state.nextSpawnIndex >= plan.spawnSchedule.length;
  const supportFieldClear = state.enemies.length === 0;
  const bossFieldClear = state.boss === null;
  const supportComplete =
    cappedSupportKills >= plan.objective.requiredEnemyKills && allSpawnsIssued && supportFieldClear;
  const bossComplete = !plan.objective.bossRequired || bossDefeated;
  const complete = supportComplete && bossComplete && bossFieldClear;

  return {
    label: plan.objective.label,
    readout: formatObjectiveReadout(plan, {
      supportKills: cappedSupportKills,
      completedWaves,
      bossDefeated,
      supportComplete
    }),
    supportKills: cappedSupportKills,
    requiredEnemyKills: plan.objective.requiredEnemyKills,
    completedWaves,
    requiredWaves: plan.objective.requiredWaves,
    bossDefeated,
    complete
  };
}

function createWaveSpawns(options: {
  readonly rng: Rng;
  readonly wave: DirectedWave;
  readonly preferredFactionId: FactionId;
  readonly availableFactionIds: readonly FactionId[];
}): EnemySpawn[] {
  const spawns: EnemySpawn[] = [];

  for (let spawnIndex = 0; spawnIndex < options.wave.spawnCount; spawnIndex += 1) {
    spawns.push({
      atSeconds: roundSeconds(options.wave.startsAtSeconds + spawnIndex * 0.32),
      waveIndex: options.wave.index,
      waveLabel: options.wave.label,
      xRatio: spawnIndex === 0 ? 0.5 : options.rng.int(20, 80) / 100,
      targetY: options.rng.int(86, 182),
      hull: options.wave.index >= 2 || spawnIndex > 1 ? 3 : 2,
      fireDelay: options.rng.int(80, 145) / 100,
      factionId: chooseFaction(options.rng, options.preferredFactionId, options.availableFactionIds)
    });
  }

  return spawns;
}

function chooseFaction(
  rng: Rng,
  preferredFactionId: FactionId,
  availableFactionIds: readonly FactionId[]
): FactionId {
  const availableFactions = FACTIONS.filter((faction) => availableFactionIds.includes(faction.id));
  const factionPool = availableFactions.length > 0 ? availableFactions : FACTIONS;

  return rng.weightedChoice(
    factionPool.map((faction) => ({
      item: faction.id,
      weight: faction.id === preferredFactionId ? 5 : 2
    }))
  );
}

function formatObjectiveReadout(
  plan: WaveDirectorPlan,
  progress: {
    readonly supportKills: number;
    readonly completedWaves: number;
    readonly bossDefeated: boolean;
    readonly supportComplete: boolean;
  }
): string {
  if (plan.objective.bossRequired && progress.supportComplete) {
    return progress.bossDefeated
      ? `${plan.objective.label}: boss defeated`
      : `${plan.objective.label}: boss gate active`;
  }

  return `${plan.objective.label}: waves ${progress.completedWaves}/${plan.objective.requiredWaves}, targets ${progress.supportKills}/${plan.objective.requiredEnemyKills}`;
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}
