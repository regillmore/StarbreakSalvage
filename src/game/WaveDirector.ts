import { FACTIONS, type FactionId } from '../content/factions';
import { clamp } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import type { CombatState, EnemySpawn } from './CombatState';
import type { SectorScrollPlan } from './ScrollState';
import type { SectorObjectivePlan } from './SectorObjectives';
import { getWaveStartSeconds } from './SectorObjectives';

export interface DirectedWave {
  readonly index: number;
  readonly label: string;
  readonly startsAtSeconds: number;
  readonly startsAtDistance: number | null;
  readonly spawnCount: number;
}

export interface WaveDirectorPlan {
  readonly objective: SectorObjectivePlan;
  readonly waves: readonly DirectedWave[];
  readonly spawnSchedule: readonly EnemySpawn[];
  readonly bossSpawnAtSeconds: number | null;
  readonly sectorLength: number | null;
}

export interface ObjectiveProgress {
  readonly label: string;
  readonly readout: string;
  readonly distanceTraveled: number;
  readonly requiredDistance: number | null;
  readonly distanceRemaining: number;
  readonly distanceComplete: boolean;
  readonly supportKills: number;
  readonly requiredEnemyKills: number;
  readonly completedWaves: number;
  readonly requiredWaves: number;
  readonly supportComplete: boolean;
  readonly bossComplete: boolean;
  readonly bossDefeated: boolean;
  readonly complete: boolean;
}

export type ObjectiveProgressState = Pick<
  CombatState,
  'nextSpawnIndex' | 'enemies' | 'boss' | 'stats'
> & {
  readonly scrollDistance?: number;
};

export interface WaveDirectorOptions {
  readonly seed: string;
  readonly objective: SectorObjectivePlan;
  readonly majorWaves: readonly string[];
  readonly preferredFactionId: FactionId;
  readonly availableFactionIds?: readonly FactionId[];
  readonly scroll?: Pick<SectorScrollPlan, 'length' | 'baseSpeed'>;
}

const DISTANCE_WAVE_WINDOW_START_RATIO = 0.12;
const DISTANCE_WAVE_WINDOW_END_RATIO = 0.58;
const DISTANCE_SPAWN_SPACING = 40;
const BOSS_GATE_DISTANCE_LEAD_SECONDS = 0.75;

export function createWaveDirectorPlan(options: WaveDirectorOptions): WaveDirectorPlan {
  const waves = options.majorWaves
    .slice(0, options.objective.requiredWaves)
    .map((label, index) => ({
      index,
      label,
      startsAtSeconds: getWaveStartSeconds(index),
      startsAtDistance: getWaveStartDistance({
        waveIndex: index,
        requiredWaves: options.objective.requiredWaves,
        spawnsPerWave: options.objective.spawnsPerWave,
        scroll: options.scroll,
        bossSpawnAtSeconds: options.objective.bossSpawnAtSeconds
      }),
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
    bossSpawnAtSeconds: options.objective.bossSpawnAtSeconds,
    sectorLength: options.scroll?.length ?? null
  };
}

export function getObjectiveProgress(
  plan: WaveDirectorPlan,
  state: ObjectiveProgressState
): ObjectiveProgress {
  const bossDefeated = state.stats.bossesDefeated > 0;
  const requiredDistance = plan.sectorLength;
  const distanceTraveled =
    requiredDistance === null
      ? Math.max(0, state.scrollDistance ?? 0)
      : clamp(state.scrollDistance ?? 0, 0, requiredDistance);
  const distanceRemaining =
    requiredDistance === null ? 0 : Math.max(0, requiredDistance - distanceTraveled);
  const distanceComplete = requiredDistance === null || distanceRemaining <= 0;
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
  const complete = distanceComplete && supportComplete && bossComplete && bossFieldClear;

  return {
    label: plan.objective.label,
    readout: formatObjectiveReadout(plan, {
      distanceTraveled,
      requiredDistance,
      supportKills: cappedSupportKills,
      completedWaves,
      bossDefeated,
      supportComplete,
      distanceComplete
    }),
    distanceTraveled,
    requiredDistance,
    distanceRemaining,
    distanceComplete,
    supportKills: cappedSupportKills,
    requiredEnemyKills: plan.objective.requiredEnemyKills,
    completedWaves,
    requiredWaves: plan.objective.requiredWaves,
    supportComplete,
    bossComplete,
    bossDefeated,
    complete
  };
}

function getWaveStartDistance(options: {
  readonly waveIndex: number;
  readonly requiredWaves: number;
  readonly spawnsPerWave: number;
  readonly scroll?: Pick<SectorScrollPlan, 'length' | 'baseSpeed'>;
  readonly bossSpawnAtSeconds: number | null;
}): number | null {
  const scroll = options.scroll;

  if (!scroll || scroll.length <= 0 || scroll.baseSpeed <= 0) {
    return null;
  }

  const requiredWaves = Math.max(1, Math.floor(options.requiredWaves));
  const waveIndex = Math.min(Math.max(0, Math.floor(options.waveIndex)), requiredWaves - 1);
  const maxSpawnOffset = Math.max(0, options.spawnsPerWave - 1) * DISTANCE_SPAWN_SPACING;
  const firstDistance =
    options.bossSpawnAtSeconds === null
      ? scroll.length * DISTANCE_WAVE_WINDOW_START_RATIO
      : getWaveStartSeconds(0) * scroll.baseSpeed;
  const lastDistance =
    options.bossSpawnAtSeconds === null
      ? scroll.length * DISTANCE_WAVE_WINDOW_END_RATIO
      : Math.max(
          firstDistance,
          (options.bossSpawnAtSeconds - BOSS_GATE_DISTANCE_LEAD_SECONDS) * scroll.baseSpeed -
            maxSpawnOffset
        );

  if (requiredWaves === 1) {
    return roundDistance((firstDistance + lastDistance) / 2);
  }

  const ratio = waveIndex / (requiredWaves - 1);
  return roundDistance(firstDistance + (lastDistance - firstDistance) * ratio);
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
      atDistance:
        options.wave.startsAtDistance === null
          ? null
          : roundDistance(options.wave.startsAtDistance + spawnIndex * DISTANCE_SPAWN_SPACING),
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
    readonly distanceTraveled: number;
    readonly requiredDistance: number | null;
    readonly supportKills: number;
    readonly completedWaves: number;
    readonly bossDefeated: boolean;
    readonly supportComplete: boolean;
    readonly distanceComplete: boolean;
  }
): string {
  const distanceReadout =
    progress.requiredDistance === null
      ? null
      : `distance ${Math.floor(progress.distanceTraveled)}/${Math.floor(
          progress.requiredDistance
        )}u`;
  const waveReadout = `waves ${progress.completedWaves}/${plan.objective.requiredWaves}, targets ${progress.supportKills}/${plan.objective.requiredEnemyKills}`;

  if (plan.objective.bossRequired && progress.supportComplete && progress.distanceComplete) {
    return progress.bossDefeated
      ? `${plan.objective.label}: boss defeated`
      : `${plan.objective.label}: boss gate active`;
  }

  return `${plan.objective.label}: ${[distanceReadout, waveReadout]
    .filter((part): part is string => Boolean(part))
    .join(', ')}`;
}

function roundSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}
