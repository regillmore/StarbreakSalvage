import { clamp } from '../core/math';
import { getBeamHazardTiming } from './BeamHazard';
import {
  getActiveSectorHazards,
  type SectorFeaturePlan,
  type SectorHazardActivationOptions
} from './SectorFeatures';

export interface SectorHazardRuntimeState {
  lastScrollDistance: number;
  readonly effectiveDistances: Record<string, number>;
  readonly beamElapsedSeconds: Record<string, number>;
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
    beamElapsedSeconds: {},
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
    for (const hazardId of Object.keys(state.beamElapsedSeconds)) {
      delete state.beamElapsedSeconds[hazardId];
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
    if (state.beamElapsedSeconds[hazardId] !== undefined) {
      continue;
    }

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

  const beamActive = getActiveSectorHazards(plan, scrollDistance, {
    ...activationOptions,
    distanceOverrides: state.effectiveDistances
  }).filter(({ hazard, phase }) => hazard.kind === 'warning_beam' && phase === 'active');

  for (const { hazard } of beamActive) {
    state.beamElapsedSeconds[hazard.id] ??= 0;
  }

  const hazardById = new Map(plan.hazards.map((hazard) => [hazard.id, hazard]));
  for (const hazardId of Object.keys(state.beamElapsedSeconds)) {
    const hazard = hazardById.get(hazardId);
    if (!hazard || hazard.kind !== 'warning_beam') {
      delete state.beamElapsedSeconds[hazardId];
      continue;
    }
    if (
      activationOptions.allowedHazardIds &&
      !activationOptions.allowedHazardIds.includes(hazardId)
    ) {
      continue;
    }

    const timing = getBeamHazardTiming(hazard);
    const nextElapsedSeconds = state.beamElapsedSeconds[hazardId]! + safeDt;
    const elapsedSeconds =
      nextElapsedSeconds >= timing.totalSeconds
        ? timing.totalSeconds
        : roundRuntimeValue(nextElapsedSeconds);
    const window = hazard;
    state.beamElapsedSeconds[hazardId] = elapsedSeconds;
    state.effectiveDistances[hazardId] =
      elapsedSeconds >= timing.totalSeconds
        ? roundRuntimeValue(window.endDistance + 0.01)
        : roundRuntimeValue(
            window.startDistance +
              (elapsedSeconds / timing.totalSeconds) * (window.endDistance - window.startDistance)
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
