import type { SectorEncounterPacingDefinition } from '../content/sectors';
import { FACTIONS, type FactionId } from '../content/factions';
import { chooseEnemyVariant, type EnemyVariantEncounterType } from '../content/enemyVariants';
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
  readonly encounterPacing: SectorEncounterPacingDefinition | null;
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
  readonly pacing?: SectorEncounterPacingDefinition | null;
  readonly sectorIndex?: number;
  readonly routePressure?: boolean;
  readonly challenge?: boolean;
  readonly eliteEncounter?: boolean;
}

const DISTANCE_WAVE_WINDOW_START_RATIO = 0.12;
const DISTANCE_WAVE_WINDOW_END_RATIO = 0.58;
const DISTANCE_SPAWN_SPACING = 40;
const BOSS_GATE_DISTANCE_LEAD_SECONDS = 0.75;
const DEFAULT_ENCOUNTER_PACING: SectorEncounterPacingDefinition = {
  waveWindowStartRatio: DISTANCE_WAVE_WINDOW_START_RATIO,
  waveWindowEndRatio: DISTANCE_WAVE_WINDOW_END_RATIO,
  spawnSpacing: DISTANCE_SPAWN_SPACING,
  firstSpawnXRatio: 0.5,
  flankXMinRatio: 0.2,
  flankXMaxRatio: 0.8,
  targetYMin: 86,
  targetYMax: 182
};

export function createWaveDirectorPlan(options: WaveDirectorOptions): WaveDirectorPlan {
  const pacing = normalizeEncounterPacing(options.pacing);
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
        bossSpawnAtSeconds: options.objective.bossSpawnAtSeconds,
        pacing
      }),
      spawnCount: options.objective.spawnsPerWave
    }));
  const rng = createRng(options.seed).fork('wave-director');
  const spawnSchedule = waves.flatMap((wave) =>
    createWaveSpawns({
      rng: rng.fork(`wave-${wave.index + 1}-${wave.label}`),
      wave,
      preferredFactionId: options.preferredFactionId,
      availableFactionIds: options.availableFactionIds ?? FACTIONS.map((faction) => faction.id),
      pacing,
      variantContext: {
        sectorIndex: Math.max(0, Math.floor(options.sectorIndex ?? 0)),
        routePressure: options.routePressure ?? false,
        challenge: options.challenge ?? false,
        eliteEncounter: options.eliteEncounter ?? false,
        bossRequired: options.objective.bossRequired
      }
    })
  );

  return {
    objective: options.objective,
    waves,
    spawnSchedule,
    bossSpawnAtSeconds: options.objective.bossSpawnAtSeconds,
    sectorLength: options.scroll?.length ?? null,
    encounterPacing: options.pacing ?? null
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
  readonly pacing: SectorEncounterPacingDefinition;
}): number | null {
  const scroll = options.scroll;

  if (!scroll || scroll.length <= 0 || scroll.baseSpeed <= 0) {
    return null;
  }

  const requiredWaves = Math.max(1, Math.floor(options.requiredWaves));
  const waveIndex = Math.min(Math.max(0, Math.floor(options.waveIndex)), requiredWaves - 1);
  const maxSpawnOffset = Math.max(0, options.spawnsPerWave - 1) * options.pacing.spawnSpacing;
  const firstDistance =
    options.bossSpawnAtSeconds === null
      ? scroll.length * options.pacing.waveWindowStartRatio
      : getWaveStartSeconds(0) * scroll.baseSpeed;
  const lastDistance =
    options.bossSpawnAtSeconds === null
      ? scroll.length * options.pacing.waveWindowEndRatio
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
  readonly pacing: SectorEncounterPacingDefinition;
  readonly variantContext: WaveVariantContext;
}): EnemySpawn[] {
  const spawns: EnemySpawn[] = [];

  for (let spawnIndex = 0; spawnIndex < options.wave.spawnCount; spawnIndex += 1) {
    const xRatio =
      spawnIndex === 0
        ? options.pacing.firstSpawnXRatio
        : options.rng.int(
            Math.round(options.pacing.flankXMinRatio * 100),
            Math.round(options.pacing.flankXMaxRatio * 100)
          ) / 100;
    const targetY = options.rng.int(
      Math.round(options.pacing.targetYMin),
      Math.round(options.pacing.targetYMax)
    );
    const hull = options.wave.index >= 2 || spawnIndex > 1 ? 3 : 2;
    const fireDelay = options.rng.int(80, 145) / 100;
    const factionId = chooseFaction(
      options.rng,
      options.preferredFactionId,
      options.availableFactionIds
    );
    const encounterType = getWaveEncounterType(options.wave.label, options.variantContext);
    const variantId = chooseEnemyVariant(
      {
        factionId,
        sectorIndex: options.variantContext.sectorIndex,
        waveIndex: options.wave.index,
        spawnIndex,
        waveLabel: options.wave.label,
        routePressure: options.variantContext.routePressure,
        challenge: options.variantContext.challenge,
        elite: options.variantContext.eliteEncounter || encounterType === 'elite',
        encounterType
      },
      options.rng.fork(`variant-${spawnIndex + 1}-${factionId}`)
    );

    spawns.push({
      atSeconds: roundSeconds(options.wave.startsAtSeconds + spawnIndex * 0.32),
      atDistance:
        options.wave.startsAtDistance === null
          ? null
          : roundDistance(options.wave.startsAtDistance + spawnIndex * options.pacing.spawnSpacing),
      waveIndex: options.wave.index,
      waveLabel: options.wave.label,
      xRatio,
      targetY,
      hull,
      fireDelay,
      factionId,
      ...(variantId ? { variantId } : {})
    });
  }

  return spawns;
}

interface WaveVariantContext {
  readonly sectorIndex: number;
  readonly routePressure: boolean;
  readonly challenge: boolean;
  readonly eliteEncounter: boolean;
  readonly bossRequired: boolean;
}

function getWaveEncounterType(
  waveLabel: string,
  context: WaveVariantContext
): EnemyVariantEncounterType {
  const normalizedLabel = waveLabel.toLowerCase();

  if (normalizedLabel.includes('elite')) {
    return 'elite';
  }

  if (normalizedLabel.includes('ambush') || normalizedLabel.includes('intercept')) {
    return 'ambush';
  }

  if (context.eliteEncounter) {
    return 'elite';
  }

  if (context.bossRequired) {
    return 'bossGate';
  }

  return 'normal';
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

function normalizeEncounterPacing(
  pacing: SectorEncounterPacingDefinition | null | undefined
): SectorEncounterPacingDefinition {
  if (!pacing) {
    return DEFAULT_ENCOUNTER_PACING;
  }

  const waveWindowStartRatio = clamp(pacing.waveWindowStartRatio, 0.04, 0.82);
  const waveWindowEndRatio = clamp(
    Math.max(pacing.waveWindowEndRatio, waveWindowStartRatio + 0.04),
    waveWindowStartRatio + 0.04,
    0.92
  );
  const flankXMinRatio = clamp(pacing.flankXMinRatio, 0.08, 0.86);
  const flankXMaxRatio = clamp(
    Math.max(pacing.flankXMaxRatio, flankXMinRatio + 0.04),
    flankXMinRatio + 0.04,
    0.92
  );
  const targetYMin = Math.round(clamp(pacing.targetYMin, 64, 220));
  const targetYMax = Math.round(
    clamp(Math.max(pacing.targetYMax, targetYMin + 4), targetYMin + 4, 240)
  );

  return {
    waveWindowStartRatio,
    waveWindowEndRatio,
    spawnSpacing: Math.max(12, pacing.spawnSpacing),
    firstSpawnXRatio: clamp(pacing.firstSpawnXRatio, 0.08, 0.92),
    flankXMinRatio,
    flankXMaxRatio,
    targetYMin,
    targetYMax
  };
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
