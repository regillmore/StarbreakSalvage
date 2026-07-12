import { clamp } from '../core/math';
import {
  getActiveSectorHazards,
  type SectorFeaturePlan,
  type SectorHazardActivationOptions
} from './SectorFeatures';

export interface SectorHazardRuntimeState {
  lastScrollDistance: number;
  readonly effectiveDistances: Record<string, number>;
  pausedAdvanceSeconds: number;
  pausedAdvanceDistance: number;
}

export interface SectorHazardRuntimeAdvanceOptions {
  readonly scrollDistance: number;
  readonly dt: number;
  readonly scrollingPaused: boolean;
  readonly nominalScrollSpeed: number;
  readonly suspended?: boolean;
  readonly activationOptions?: Omit<SectorHazardActivationOptions, 'distanceOverrides'>;
}

export function createSectorHazardRuntimeState(
  initialScrollDistance = 0
): SectorHazardRuntimeState {
  return {
    lastScrollDistance: roundRuntimeValue(Math.max(0, initialScrollDistance)),
    effectiveDistances: {},
    pausedAdvanceSeconds: 0,
    pausedAdvanceDistance: 0
  };
}

export function advanceSectorHazardRuntime(
  state: SectorHazardRuntimeState,
  plan: SectorFeaturePlan,
  options: SectorHazardRuntimeAdvanceOptions
): void {
  const scrollDistance = roundRuntimeValue(Math.max(0, options.scrollDistance));
  const scrollDelta = roundRuntimeValue(Math.max(0, scrollDistance - state.lastScrollDistance));
  const safeDt = clamp(options.dt, 0, 0.1);
  const activationOptions = options.activationOptions ?? {};

  if (options.suspended) {
    for (const hazardId of Object.keys(state.effectiveDistances)) {
      delete state.effectiveDistances[hazardId];
    }
    state.lastScrollDistance = scrollDistance;
    return;
  }

  const distanceActive = getActiveSectorHazards(plan, scrollDistance, activationOptions);

  for (const { hazard } of distanceActive) {
    const previousDistance = state.effectiveDistances[hazard.id];
    state.effectiveDistances[hazard.id] =
      previousDistance === undefined
        ? scrollDistance
        : roundRuntimeValue(Math.max(previousDistance, scrollDistance));
  }

  const runtimeActive = getActiveSectorHazards(plan, scrollDistance, {
    ...activationOptions,
    distanceOverrides: state.effectiveDistances
  });
  const activeIds = new Set(runtimeActive.map(({ hazard }) => hazard.id));
  const pausedAdvance = options.scrollingPaused
    ? roundRuntimeValue(Math.max(0, options.nominalScrollSpeed) * safeDt)
    : 0;

  for (const hazardId of Object.keys(state.effectiveDistances)) {
    if (options.scrollingPaused && !activeIds.has(hazardId)) {
      continue;
    }

    const previousDistance = state.effectiveDistances[hazardId] ?? scrollDistance;
    state.effectiveDistances[hazardId] = roundRuntimeValue(
      Math.max(
        scrollDistance,
        previousDistance + (options.scrollingPaused ? pausedAdvance : scrollDelta)
      )
    );
  }

  if (options.scrollingPaused && activeIds.size > 0 && pausedAdvance > 0) {
    state.pausedAdvanceSeconds = roundRuntimeValue(state.pausedAdvanceSeconds + safeDt);
    state.pausedAdvanceDistance = roundRuntimeValue(state.pausedAdvanceDistance + pausedAdvance);
  }

  state.lastScrollDistance = scrollDistance;
}

export function formatSectorHazardRuntimeDebug(state: SectorHazardRuntimeState): string {
  return `tracked ${Object.keys(state.effectiveDistances).length} pause ${state.pausedAdvanceSeconds.toFixed(
    1
  )}s/${Math.round(state.pausedAdvanceDistance)}u`;
}

function roundRuntimeValue(value: number): number {
  return Math.round(value * 100) / 100;
}
