import { getHazardZoneDefinition, getHazardZoneMetrics } from '../content/hazardZones';
import { clamp } from '../core/math';
import type {
  ActiveSectorHazard,
  SectorFeaturePlan,
  SectorHazardCollisionRect,
  SectorHazardPlan
} from './SectorFeatures';

export type MeteorStormTravelDirection = -1 | 1;
export type MeteorImpactPhase = 'forecast' | 'telegraph' | 'impact' | 'afterglow';

export interface MeteorStormPocket {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly travelDirection: MeteorStormTravelDirection;
}

export interface MeteorStormImpact {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly arrivalProgress: number;
  readonly phase: MeteorImpactPhase;
  readonly phaseProgress: number;
}

export interface MeteorStormGeometry {
  readonly pocket: MeteorStormPocket;
  readonly impacts: readonly MeteorStormImpact[];
  readonly damageImpacts: readonly MeteorStormImpact[];
  readonly impactCount: number;
}

export interface MeteorStormDebugFixture {
  readonly features: SectorFeaturePlan;
  readonly hazard: SectorHazardPlan;
  readonly targetDistance: number;
}

const METEOR_TELEGRAPH_PROGRESS = 0.13;
const METEOR_IMPACT_PROGRESS = 0.035;
const METEOR_AFTERGLOW_PROGRESS = 0.045;
const FIRST_IMPACT_PROGRESS = 0.07;
const LAST_IMPACT_PROGRESS = 0.93;
const FORECAST_IMPACT_COUNT = 3;

export function createMeteorStormGeometry(
  activeHazard: ActiveSectorHazard,
  stormRect: SectorHazardCollisionRect
): MeteorStormGeometry {
  const definition = getHazardZoneDefinition('salvage_storm');
  const impactCount = Math.max(6, Math.min(12, Math.floor(definition.behavior.activePulseCount)));
  const travelDirection: MeteorStormTravelDirection = activeHazard.hazard.xRatio <= 0.5 ? 1 : -1;
  const radiusX = clamp(stormRect.width * 0.32, 86, 132);
  const radiusY = clamp(radiusX * 0.82, 74, 112);
  const startX =
    travelDirection > 0 ? stormRect.left + radiusX : stormRect.right - radiusX;
  const endX = travelDirection > 0 ? stormRect.right - radiusX : stormRect.left + radiusX;
  const startY = stormRect.top + radiusY + 18;
  const endY = stormRect.bottom - radiusY - 18;
  const travelProgress =
    activeHazard.phase === 'active' ? clamp(activeHazard.phaseProgress, 0, 1) : 0;
  const pocket: MeteorStormPocket = {
    centerX: roundMeteorValue(lerp(startX, endX, travelProgress)),
    centerY: roundMeteorValue(lerp(startY, endY, travelProgress)),
    radiusX: roundMeteorValue(radiusX),
    radiusY: roundMeteorValue(radiusY),
    startX: roundMeteorValue(startX),
    startY: roundMeteorValue(startY),
    endX: roundMeteorValue(endX),
    endY: roundMeteorValue(endY),
    travelDirection
  };
  const impacts =
    activeHazard.phase === 'telegraph'
      ? createForecastImpacts(activeHazard, pocket, impactCount)
      : createActiveImpacts(activeHazard, pocket, impactCount);

  return {
    pocket,
    impacts,
    damageImpacts: impacts.filter((impact) => impact.phase === 'impact'),
    impactCount
  };
}

export function createMeteorStormDamageRects(
  activeHazard: ActiveSectorHazard,
  stormRect: SectorHazardCollisionRect
): readonly SectorHazardCollisionRect[] {
  return createMeteorStormGeometry(activeHazard, stormRect).damageImpacts.map((impact) => ({
    left: impact.x - impact.radius,
    top: impact.y - impact.radius,
    right: impact.x + impact.radius,
    bottom: impact.y + impact.radius,
    width: impact.radius * 2,
    height: impact.radius * 2,
    centerX: impact.x
  }));
}

export function isMeteorStormDamageWindowOpen(activeHazard: ActiveSectorHazard): boolean {
  if (activeHazard.phase !== 'active') {
    return false;
  }

  return createImpactTimings(activeHazard, getMeteorImpactCount()).some(
    (impact) => impact.phase === 'impact'
  );
}

export function formatMeteorStormWarning(activeHazard: ActiveSectorHazard): string {
  const direction = activeHazard.hazard.xRatio <= 0.5 ? 'LEFT TO RIGHT' : 'RIGHT TO LEFT';
  if (activeHazard.phase === 'telegraph') {
    return `${activeHazard.hazard.label} | TRACK ${direction}`;
  }

  const timings = createImpactTimings(activeHazard, getMeteorImpactCount());
  const marked = timings.filter((impact) => impact.phase === 'telegraph').length;
  const impacting = timings.filter((impact) => impact.phase === 'impact').length;
  return `${activeHazard.hazard.label} | ${marked} MARKED | ${impacting} IMPACTING`;
}

export function createMeteorStormDebugFixture(
  features: SectorFeaturePlan,
  scrollLength: number,
  currentDistance = 0
): MeteorStormDebugFixture {
  const definition = getHazardZoneDefinition('salvage_storm');
  const metrics = getHazardZoneMetrics('salvage_storm', 'condition');
  const safeLength = Math.max(720, scrollLength);
  const minimumStart = metrics.telegraphLead + 60;
  const maximumStart = Math.max(minimumStart, safeLength - metrics.activeSpan - 120);
  const startDistance = roundMeteorValue(
    clamp(Math.max(safeLength * 0.38, currentDistance), minimumStart, maximumStart)
  );
  const hazard: SectorHazardPlan = {
    id: 'debug_route_meteor_storm',
    kind: 'salvage_storm',
    telegraphDistance: roundMeteorValue(startDistance - metrics.telegraphLead),
    startDistance,
    endDistance: roundMeteorValue(startDistance + metrics.activeSpan),
    xRatio: 0.5,
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: 'ROUTE METEORS'
  };

  return {
    features: { ...features, hazards: [hazard] },
    hazard,
    targetDistance: roundMeteorValue(startDistance + metrics.activeSpan * 0.03)
  };
}

function createForecastImpacts(
  activeHazard: ActiveSectorHazard,
  pocket: MeteorStormPocket,
  impactCount: number
): MeteorStormImpact[] {
  return Array.from({ length: Math.min(FORECAST_IMPACT_COUNT, impactCount) }, (_value, index) =>
    createImpact(activeHazard, pocket, impactCount, index, 'forecast', activeHazard.phaseProgress)
  );
}

function createActiveImpacts(
  activeHazard: ActiveSectorHazard,
  pocket: MeteorStormPocket,
  impactCount: number
): MeteorStormImpact[] {
  return createImpactTimings(activeHazard, impactCount).map((timing) =>
    createImpact(
      activeHazard,
      pocket,
      impactCount,
      timing.index,
      timing.phase,
      timing.phaseProgress
    )
  );
}

function createImpactTimings(
  activeHazard: ActiveSectorHazard,
  impactCount: number
): readonly Pick<MeteorStormImpact, 'index' | 'arrivalProgress' | 'phase' | 'phaseProgress'>[] {
  const progress = clamp(activeHazard.phaseProgress, 0, 1);
  const timings: Pick<
    MeteorStormImpact,
    'index' | 'arrivalProgress' | 'phase' | 'phaseProgress'
  >[] = [];

  for (let index = 0; index < impactCount; index += 1) {
    const arrivalProgress = getImpactArrivalProgress(index, impactCount);
    const visibleStart = arrivalProgress - METEOR_TELEGRAPH_PROGRESS;
    const afterglowEnd =
      arrivalProgress + METEOR_IMPACT_PROGRESS + METEOR_AFTERGLOW_PROGRESS;
    if (progress < visibleStart || progress > afterglowEnd) {
      continue;
    }

    if (progress < arrivalProgress) {
      timings.push({
        index,
        arrivalProgress,
        phase: 'telegraph',
        phaseProgress: clamp(
          (progress - visibleStart) / METEOR_TELEGRAPH_PROGRESS,
          0,
          1
        )
      });
      continue;
    }

    if (progress <= arrivalProgress + METEOR_IMPACT_PROGRESS) {
      timings.push({
        index,
        arrivalProgress,
        phase: 'impact',
        phaseProgress: clamp(
          (progress - arrivalProgress) / METEOR_IMPACT_PROGRESS,
          0,
          1
        )
      });
      continue;
    }

    timings.push({
      index,
      arrivalProgress,
      phase: 'afterglow',
      phaseProgress: clamp(
        (progress - arrivalProgress - METEOR_IMPACT_PROGRESS) /
          METEOR_AFTERGLOW_PROGRESS,
        0,
        1
      )
    });
  }

  return timings;
}

function createImpact(
  activeHazard: ActiveSectorHazard,
  pocket: MeteorStormPocket,
  impactCount: number,
  index: number,
  phase: MeteorImpactPhase,
  phaseProgress: number
): MeteorStormImpact {
  const arrivalProgress = getImpactArrivalProgress(index, impactCount);
  const pocketX = lerp(pocket.startX, pocket.endX, arrivalProgress);
  const pocketY = lerp(pocket.startY, pocket.endY, arrivalProgress);
  const angle = deterministicUnit(activeHazard.hazard.id, index, 1) * Math.PI * 2;
  const radial = 0.18 + deterministicUnit(activeHazard.hazard.id, index, 2) * 0.58;
  const x = pocketX + Math.cos(angle) * pocket.radiusX * radial;
  const y = pocketY + Math.sin(angle) * pocket.radiusY * radial;
  const radius = 20 + deterministicUnit(activeHazard.hazard.id, index, 3) * 11;

  return {
    index,
    x: roundMeteorValue(x),
    y: roundMeteorValue(y),
    radius: roundMeteorValue(radius),
    arrivalProgress: roundMeteorValue(arrivalProgress),
    phase,
    phaseProgress: roundMeteorValue(clamp(phaseProgress, 0, 1))
  };
}

function getImpactArrivalProgress(index: number, impactCount: number): number {
  if (impactCount <= 1) {
    return 0.5;
  }
  return lerp(FIRST_IMPACT_PROGRESS, LAST_IMPACT_PROGRESS, index / (impactCount - 1));
}

function getMeteorImpactCount(): number {
  return Math.max(
    6,
    Math.min(
      12,
      Math.floor(getHazardZoneDefinition('salvage_storm').behavior.activePulseCount)
    )
  );
}

function deterministicUnit(hazardId: string, index: number, salt: number): number {
  let hash = 2166136261 ^ (index * 374761393) ^ (salt * 668265263);
  for (let cursor = 0; cursor < hazardId.length; cursor += 1) {
    hash ^= hazardId.charCodeAt(cursor);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp(progress, 0, 1);
}

function roundMeteorValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
