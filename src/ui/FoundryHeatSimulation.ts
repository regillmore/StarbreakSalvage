import type { WeaponDefinition } from '../content/weapons';
import { applyCombinedHooks } from '../game/CombinedHooks';
import type { EngineeringResolution } from '../game/Foundry';
import { getHeatShotCost } from '../game/HeatShot';
import type { ItemInstance } from '../game/Rewards';
import {
  HEAT_SINK_GENERATION_MULTIPLIER,
  HEAT_SINK_VENT_MULTIPLIER,
  THERMAL_CRITICAL_RATIO,
  THERMAL_HOT_RATIO
} from '../game/ThermalCircuit';
import { createWeaponProjectileBlueprints } from '../game/WeaponProjectiles';

export type FoundryHeatSampleState = 'nominal' | 'hot' | 'critical' | 'overheated';

export interface FoundryHeatSampleModel {
  readonly timeSeconds: number;
  readonly heat: number;
  readonly ratio: number;
  readonly state: FoundryHeatSampleState;
}

export interface FoundryHeatSimulationModel {
  readonly durationSeconds: number;
  readonly capacity: number;
  readonly heatPerVolley: number;
  readonly coolingPerSecond: number;
  readonly volleysFired: number;
  readonly effectiveVolleysPerSecond: number;
  readonly peakHeat: number;
  readonly peakRatio: number;
  readonly endingHeat: number;
  readonly overheatCount: number;
  readonly heatShotsFired: number;
  readonly heatShotsExhausted: number;
  readonly generatedHeat: number;
  readonly spentHeat: number;
  readonly hotVolleyCount: number;
  readonly samples: readonly FoundryHeatSampleModel[];
  readonly committedPeakRatio: number;
  readonly peakRatioDelta: number;
  readonly committedOverheatCount: number;
  readonly overheatDelta: number;
  readonly ariaLabel: string;
}

export interface FoundryHeatSimulationInput {
  readonly weapon: WeaponDefinition;
  readonly resolution: EngineeringResolution;
  readonly procBudget: number;
  readonly items: readonly ItemInstance[];
}

interface FoundryHeatProfile {
  readonly durationSeconds: number;
  readonly capacity: number;
  readonly heatPerVolley: number;
  readonly coolingPerSecond: number;
  readonly volleysFired: number;
  readonly effectiveVolleysPerSecond: number;
  readonly peakHeat: number;
  readonly peakRatio: number;
  readonly endingHeat: number;
  readonly overheatCount: number;
  readonly heatShotsFired: number;
  readonly heatShotsExhausted: number;
  readonly generatedHeat: number;
  readonly spentHeat: number;
  readonly hotVolleyCount: number;
  readonly samples: readonly FoundryHeatSampleModel[];
}

interface FoundryHeatFireEvent {
  readonly timeSeconds: number;
  readonly heatAfterVolley: number;
}

interface FoundryOverheatWindow {
  readonly startSeconds: number;
  readonly endSeconds: number;
}

const SIMULATION_SECONDS = 8;
const SAMPLE_COUNT = 33;
const MAX_SIMULATION_VOLLEYS = 160;

export function createFoundryHeatSimulationModel(
  draftInput: FoundryHeatSimulationInput,
  committedInput: FoundryHeatSimulationInput
): FoundryHeatSimulationModel {
  const draft = createFoundryHeatProfile(draftInput);
  const committed = createFoundryHeatProfile(committedInput);
  const peakRatioDelta = draft.peakRatio - committed.peakRatio;
  const overheatDelta = draft.overheatCount - committed.overheatCount;
  const heatShotDescription =
    draft.heatShotsFired + draft.heatShotsExhausted > 0
      ? ` ${draft.heatShotsFired} funded heat ${draft.heatShotsFired === 1 ? 'dump' : 'dumps'} and ${draft.heatShotsExhausted} exhaust replacement${draft.heatShotsExhausted === 1 ? '' : 's'} occur.`
      : ' No heat-dump circuit event occurs.';
  const comparisonDescription =
    Math.abs(peakRatioDelta) < 0.001 && overheatDelta === 0
      ? ' This matches the committed thermal profile.'
      : ` Compared with committed, peak heat changes by ${formatSignedPercentPoints(peakRatioDelta)} and overheat stalls by ${overheatDelta > 0 ? '+' : ''}${overheatDelta}.`;
  const flowDescription =
    draft.generatedHeat + draft.spentHeat > 0
      ? ` Circuit flow generates ${draft.generatedHeat.toFixed(2)} and spends ${draft.spentHeat.toFixed(2)} heat across ${draft.hotVolleyCount} hot ${draft.hotVolleyCount === 1 ? 'volley' : 'volleys'}.`
      : ' No active circuit heat flow occurs.';

  return {
    ...draft,
    committedPeakRatio: committed.peakRatio,
    peakRatioDelta,
    committedOverheatCount: committed.overheatCount,
    overheatDelta,
    ariaLabel: `${draft.durationSeconds.toFixed(0)} second held-fire thermal simulation. Peak heat ${Math.round(draft.peakRatio * 100)} percent of capacity, ending heat ${Math.round((draft.endingHeat / draft.capacity) * 100)} percent, cooling ${draft.coolingPerSecond.toFixed(2)} per second, and ${draft.overheatCount} overheat ${draft.overheatCount === 1 ? 'stall' : 'stalls'}.${flowDescription}${heatShotDescription}${comparisonDescription}`
  };
}

export function getFoundryHeatRates(
  weapon: WeaponDefinition,
  resolution: EngineeringResolution,
  items: readonly ItemInstance[]
): { readonly heatPerVolley: number; readonly coolingPerSecond: number } {
  const hasHeatSinkSaint = items.some((item) => item.itemId === 'item_heat_sink_saint');
  return {
    heatPerVolley:
      weapon.heatPerShot *
      resolution.effects.heatPerShotMultiplier *
      (hasHeatSinkSaint ? HEAT_SINK_GENERATION_MULTIPLIER : 1),
    coolingPerSecond:
      weapon.heatVentPerSecond *
      resolution.effects.heatVentMultiplier *
      (hasHeatSinkSaint ? HEAT_SINK_VENT_MULTIPLIER : 1)
  };
}

function createFoundryHeatProfile(input: FoundryHeatSimulationInput): FoundryHeatProfile {
  const { weapon, resolution, procBudget, items } = input;
  const { heatPerVolley, coolingPerSecond } = getFoundryHeatRates(weapon, resolution, items);
  const capacity = Math.max(0.01, weapon.overheatLimit);
  const fireEvents: FoundryHeatFireEvent[] = [];
  const overheatWindows: FoundryOverheatWindow[] = [];
  let storedWeaponHeat = 0;
  let nextVolleySeconds = 0;
  let lastVolleySeconds = 0;
  let volleyIndex = 0;
  let peakHeat = 0;
  let heatShotsFired = 0;
  let heatShotsExhausted = 0;
  let generatedHeat = 0;
  let spentHeat = 0;
  let hotVolleyCount = 0;

  while (nextVolleySeconds <= SIMULATION_SECONDS + 0.0001 && volleyIndex < MAX_SIMULATION_VOLLEYS) {
    if (volleyIndex > 0) {
      storedWeaponHeat = Math.max(
        0,
        storedWeaponHeat - coolingPerSecond * (nextVolleySeconds - lastVolleySeconds)
      );
    }

    volleyIndex += 1;
    const firePayload = applyCombinedHooks(
      'onFire',
      items,
      resolution.hooks,
      {
        volleyIndex,
        projectiles: createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 }),
        storedWeaponHeat,
        weaponHeatCapacity: capacity,
        weaponHeatGenerated: 0,
        heatShotCost: getHeatShotCost(capacity),
        weaponHeatSpent: 0,
        heatShotEvents: [],
        thermalFlowEvents: []
      },
      { maxApplications: procBudget }
    );
    storedWeaponHeat = Math.max(
      0,
      Math.min(
        capacity,
        storedWeaponHeat +
          (firePayload.weaponHeatGenerated ?? 0) -
          (firePayload.weaponHeatSpent ?? 0)
      )
    );
    for (const event of firePayload.thermalFlowEvents ?? []) {
      if (event.kind === 'generated') generatedHeat += event.amount;
      else spentHeat += event.amount;
    }
    if (storedWeaponHeat / capacity >= THERMAL_HOT_RATIO) hotVolleyCount += 1;
    storedWeaponHeat = Math.min(capacity, storedWeaponHeat + heatPerVolley);
    for (const event of firePayload.heatShotEvents ?? []) {
      if (event.outcome === 'fired') heatShotsFired += 1;
      else heatShotsExhausted += 1;
    }

    peakHeat = Math.max(peakHeat, storedWeaponHeat);
    fireEvents.push({
      timeSeconds: nextVolleySeconds,
      heatAfterVolley: storedWeaponHeat
    });
    const overheated = storedWeaponHeat >= capacity - 0.0001;
    const nextInterval = overheated
      ? Math.max(weapon.fireCooldownSeconds, weapon.overheatCooldownSeconds)
      : weapon.fireCooldownSeconds;
    if (overheated) {
      overheatWindows.push({
        startSeconds: nextVolleySeconds,
        endSeconds: Math.min(SIMULATION_SECONDS, nextVolleySeconds + weapon.overheatCooldownSeconds)
      });
    }
    lastVolleySeconds = nextVolleySeconds;
    nextVolleySeconds += nextInterval;
  }

  const heatAtTime = (timeSeconds: number): number => {
    let event = fireEvents[0];
    for (const candidate of fireEvents) {
      if (candidate.timeSeconds > timeSeconds + 0.0001) break;
      event = candidate;
    }
    if (!event) return 0;
    return Math.max(
      0,
      event.heatAfterVolley - coolingPerSecond * Math.max(0, timeSeconds - event.timeSeconds)
    );
  };
  const samples = Array.from({ length: SAMPLE_COUNT }, (_value, index) => {
    const timeSeconds = (index / Math.max(1, SAMPLE_COUNT - 1)) * SIMULATION_SECONDS;
    const heat = heatAtTime(timeSeconds);
    const ratio = Math.min(1, heat / capacity);
    const overheated = overheatWindows.some(
      (window) => timeSeconds >= window.startSeconds && timeSeconds < window.endSeconds - 0.0001
    );
    const state: FoundryHeatSampleState = overheated
      ? 'overheated'
      : ratio >= THERMAL_CRITICAL_RATIO
        ? 'critical'
        : ratio >= THERMAL_HOT_RATIO
          ? 'hot'
          : 'nominal';
    return { timeSeconds, heat, ratio, state };
  });
  const endingHeat = heatAtTime(SIMULATION_SECONDS);

  return {
    durationSeconds: SIMULATION_SECONDS,
    capacity,
    heatPerVolley,
    coolingPerSecond,
    volleysFired: fireEvents.length,
    effectiveVolleysPerSecond: fireEvents.length / SIMULATION_SECONDS,
    peakHeat,
    peakRatio: Math.min(1, peakHeat / capacity),
    endingHeat,
    overheatCount: overheatWindows.length,
    heatShotsFired,
    heatShotsExhausted,
    generatedHeat,
    spentHeat,
    hotVolleyCount,
    samples
  };
}

function formatSignedPercentPoints(value: number): string {
  const points = Math.round(value * 100);
  return `${points > 0 ? '+' : ''}${points} percentage point${Math.abs(points) === 1 ? '' : 's'}`;
}
