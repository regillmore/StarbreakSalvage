import { getHazardZoneDefinition, getHazardZoneMetrics } from '../content/hazardZones';
import { clamp } from '../core/math';
import type {
  ActiveSectorHazard,
  SectorFeaturePlan,
  SectorHazardCollisionRect,
  SectorHazardPlan
} from './SectorFeatures';

export type MeteorImpactPhase = 'telegraph' | 'impact' | 'afterglow';

export interface MeteorStormPocket {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly spawnY: number;
  readonly despawnY: number;
  readonly worldProgress: number;
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

export function createMeteorStormGeometry(
  activeHazard: ActiveSectorHazard,
  stormRect: SectorHazardCollisionRect
): MeteorStormGeometry {
  const definition = getHazardZoneDefinition('salvage_storm');
  const impactCount = Math.max(6, Math.min(12, Math.floor(definition.behavior.activePulseCount)));
  const radiusX = clamp(stormRect.width * 0.32, 86, 132);
  const radiusY = clamp(radiusX * 0.82, 74, 112);
  const spawnY = stormRect.top - radiusY - 36;
  const despawnY = stormRect.bottom + radiusY + 36;
  const worldProgress = getMeteorStormWorldProgress(activeHazard);
  const pocket: MeteorStormPocket = {
    centerX: roundMeteorValue(stormRect.centerX),
    centerY: roundMeteorValue(lerp(spawnY, despawnY, worldProgress)),
    radiusX: roundMeteorValue(radiusX),
    radiusY: roundMeteorValue(radiusY),
    spawnY: roundMeteorValue(spawnY),
    despawnY: roundMeteorValue(despawnY),
    worldProgress: roundMeteorValue(worldProgress)
  };
  const impacts =
    activeHazard.phase === 'telegraph'
      ? []
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
  if (activeHazard.phase === 'telegraph') {
    return `${activeHazard.hazard.label} | INBOUND`;
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
  const startDistance = roundMeteorValue(
    Math.max(safeLength * 0.38, currentDistance, minimumStart)
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
    targetDistance: roundMeteorValue(startDistance + metrics.activeSpan * 0.32)
  };
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
  const angle = deterministicUnit(activeHazard.hazard.id, index, 1) * Math.PI * 2;
  const radial = 0.18 + deterministicUnit(activeHazard.hazard.id, index, 2) * 0.58;
  const x = pocket.centerX + Math.cos(angle) * pocket.radiusX * radial;
  const y = pocket.centerY + Math.sin(angle) * pocket.radiusY * radial;
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

function getMeteorStormWorldProgress(activeHazard: ActiveSectorHazard): number {
  if (activeHazard.phase !== 'active') {
    return 0;
  }

  const activeSpan = Math.max(
    1,
    activeHazard.hazard.endDistance - activeHazard.hazard.startDistance
  );
  const worldDistance =
    activeHazard.worldDistance ??
    activeHazard.hazard.startDistance + activeHazard.phaseProgress * activeSpan;
  return clamp(
    (worldDistance - activeHazard.hazard.startDistance) / activeSpan,
    0,
    1
  );
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
