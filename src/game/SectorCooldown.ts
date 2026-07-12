import { clamp } from '../core/math';
import type { CombatState } from './CombatState';
import {
  advanceScrollState,
  setScrollDistance,
  type ScrollAdvanceResult,
  type ScrollState,
  type SectorScrollPlan
} from './ScrollState';
import type { SectorExitSequenceReason } from './SectorExitSequence';

export const SECTOR_COOLDOWN_DISTANCE = 180;

export interface SectorCooldownPlan {
  readonly enabled: boolean;
  readonly combatEndDistance: number;
  readonly exitDistance: number;
  readonly cooldownDistance: number;
}

export interface SectorCooldownState {
  readonly plan: SectorCooldownPlan;
  readonly reason: SectorExitSequenceReason;
  readonly settlingHazardIds: readonly string[];
}

export interface SectorCooldownPresentation {
  readonly traveledDistance: number;
  readonly remainingDistance: number;
  readonly progress: number;
  readonly complete: boolean;
  readonly readout: string;
  readonly warning: string;
  readonly hint: string;
}

export interface SectorCooldownPlanOptions {
  readonly scroll: SectorScrollPlan;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly operationMode?: 'flight' | 'boarding';
}

export function createSectorCooldownPlan(options: SectorCooldownPlanOptions): SectorCooldownPlan {
  const combatEndDistance = roundDistance(Math.max(0, options.scroll.length));
  const sectorCount = Math.max(1, Math.floor(options.sectorCount));
  const sectorIndex = Math.max(0, Math.floor(options.sectorIndex));
  const enabled =
    options.operationMode !== 'boarding' && sectorIndex < sectorCount - 1 && combatEndDistance > 0;
  const cooldownDistance = enabled ? SECTOR_COOLDOWN_DISTANCE : 0;

  return {
    enabled,
    combatEndDistance,
    exitDistance: roundDistance(combatEndDistance + cooldownDistance),
    cooldownDistance
  };
}

export function applySectorCooldownToScroll(
  scroll: SectorScrollPlan,
  plan: SectorCooldownPlan
): SectorScrollPlan {
  return plan.enabled && plan.exitDistance !== scroll.length
    ? { ...scroll, length: plan.exitDistance }
    : scroll;
}

export function createSectorCooldownState(
  plan: SectorCooldownPlan,
  reason: SectorExitSequenceReason,
  settlingHazardIds: readonly string[] = []
): SectorCooldownState | null {
  return plan.enabled && reason === 'sectorComplete'
    ? { plan, reason, settlingHazardIds: [...new Set(settlingHazardIds)] }
    : null;
}

export function advanceSectorCooldownScroll(
  state: ScrollState,
  plan: SectorCooldownPlan,
  cooldownActive: boolean,
  dt: number,
  speedOverride?: number
): ScrollAdvanceResult {
  if (!plan.enabled) {
    return advanceScrollState(state, dt, speedOverride);
  }

  const travelLimit = cooldownActive ? plan.exitDistance : plan.combatEndDistance;
  const atTravelLimit = state.distance >= travelLimit;
  const resumedSpeed = cooldownActive && state.speed === 0 ? state.plan.baseSpeed : speedOverride;
  const result = advanceScrollState(state, dt, atTravelLimit ? 0 : resumedSpeed);

  if (state.distance <= travelLimit) {
    return result;
  }

  setScrollDistance(state, travelLimit, 0);
  return {
    previousDistance: result.previousDistance,
    distance: state.distance,
    delta: roundDistance(state.distance - result.previousDistance),
    crossedExit: false
  };
}

export function getSectorCooldownPresentation(
  state: SectorCooldownState,
  distance: number
): SectorCooldownPresentation {
  const safeDistance = Math.max(0, distance);
  const traveledDistance = roundDistance(
    clamp(safeDistance - state.plan.combatEndDistance, 0, state.plan.cooldownDistance)
  );
  const remainingDistance = roundDistance(
    Math.max(0, state.plan.cooldownDistance - traveledDistance)
  );
  const progress =
    state.plan.cooldownDistance <= 0
      ? 1
      : roundDistance(clamp(traveledDistance / state.plan.cooldownDistance, 0, 1));
  const complete = remainingDistance <= 0;

  return {
    traveledDistance,
    remainingDistance,
    progress,
    complete,
    readout: `Recovery coast ${Math.round(traveledDistance)}/${Math.round(
      state.plan.cooldownDistance
    )}u`,
    warning: 'No new contacts | field settling naturally',
    hint:
      remainingDistance > 0
        ? `Hint Collect remaining drops; exit beacon in ${Math.ceil(remainingDistance)}u.`
        : 'Hint Recovery coast complete; locking the exit beacon.'
  };
}

export function suppressSectorCooldownSpawns(state: CombatState): void {
  state.nextSpawnIndex = state.spawnSchedule.length;
}

export function isSectorFieldSettled(state: Pick<CombatState, 'enemies' | 'boss'>): boolean {
  return state.enemies.length === 0 && state.boss === null;
}

function roundDistance(value: number): number {
  return Math.round(value * 100) / 100;
}
