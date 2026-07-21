import { getHazardZoneDefinition, getHazardZoneMetrics } from '../content/hazardZones';
import { clamp } from '../core/math';
import type {
  ActiveSectorHazard,
  SectorFeaturePlan,
  SectorHazardCollisionRect,
  SectorHazardPlan
} from './SectorFeatures';

export type SalvageStormFlowDirection = -1 | 1;

export interface SalvageStormPhaseState {
  readonly surgeIndex: number;
  readonly surgeCount: number;
  readonly pulseProgress: number;
  readonly calmLaneIndex: number;
  readonly flowDirection: SalvageStormFlowDirection;
  readonly damageWindowOpen: boolean;
}

export interface SalvageStormGeometry extends SalvageStormPhaseState {
  readonly stormRect: SectorHazardCollisionRect;
  readonly laneRects: readonly SectorHazardCollisionRect[];
  readonly damageRects: readonly SectorHazardCollisionRect[];
}

export interface SalvageStormDebugFixture {
  readonly features: SectorFeaturePlan;
  readonly hazard: SectorHazardPlan;
  readonly targetDistance: number;
}

const STORM_LANE_GAP_MIN = 10;
const STORM_LANE_GAP_MAX = 18;
const CALM_LANE_LABELS = ['LEFT', 'CENTER', 'RIGHT'] as const;

export function getSalvageStormPhaseState(
  activeHazard: ActiveSectorHazard
): SalvageStormPhaseState {
  const behavior = getHazardZoneDefinition('salvage_storm').behavior;
  const surgeCount = Math.max(1, Math.min(3, Math.floor(behavior.activePulseCount)));
  const flowDirection: SalvageStormFlowDirection = activeHazard.hazard.xRatio <= 0.5 ? 1 : -1;
  const scaledProgress = clamp(activeHazard.phaseProgress, 0, 1) * surgeCount;
  const surgeIndex = Math.min(surgeCount - 1, Math.floor(scaledProgress));
  const pulseProgress = roundStormValue(scaledProgress - Math.floor(scaledProgress));
  const calmLaneIndex = flowDirection > 0 ? surgeIndex : surgeCount - 1 - surgeIndex;

  return {
    surgeIndex,
    surgeCount,
    pulseProgress,
    calmLaneIndex,
    flowDirection,
    damageWindowOpen:
      activeHazard.phase === 'active' && pulseProgress <= behavior.activeDamageDutyCycle
  };
}

export function createSalvageStormGeometry(
  activeHazard: ActiveSectorHazard,
  stormRect: SectorHazardCollisionRect
): SalvageStormGeometry {
  const phase = getSalvageStormPhaseState(activeHazard);
  const gap = clamp(stormRect.width * 0.032, STORM_LANE_GAP_MIN, STORM_LANE_GAP_MAX);
  const laneWidth = Math.max(24, (stormRect.width - gap * (phase.surgeCount - 1)) / phase.surgeCount);
  const laneRects = Array.from({ length: phase.surgeCount }, (_value, index) => {
    const left = stormRect.left + index * (laneWidth + gap);
    return createRect(left, stormRect.top, Math.min(stormRect.right, left + laneWidth), stormRect.bottom);
  });

  return {
    ...phase,
    stormRect,
    laneRects,
    damageRects: phase.damageWindowOpen
      ? laneRects.filter((_rect, index) => index !== phase.calmLaneIndex)
      : []
  };
}

export function formatSalvageStormWarning(activeHazard: ActiveSectorHazard): string {
  const phase = getSalvageStormPhaseState(activeHazard);
  const sequence = phase.flowDirection > 0 ? 'LEFT → RIGHT' : 'RIGHT → LEFT';

  if (activeHazard.phase === 'telegraph') {
    return `${activeHazard.hazard.label} | CALM CHANNEL ${sequence}`;
  }

  const state = phase.damageWindowOpen
    ? `SURGE ${phase.surgeIndex + 1}/${phase.surgeCount}`
    : `LULL ${phase.surgeIndex + 1}/${phase.surgeCount}`;
  const calmLane = CALM_LANE_LABELS[phase.calmLaneIndex] ?? 'CENTER';
  return `${activeHazard.hazard.label} | ${state} | CALM ${calmLane}`;
}

export function createSalvageStormDebugFixture(
  features: SectorFeaturePlan,
  scrollLength: number
): SalvageStormDebugFixture {
  const definition = getHazardZoneDefinition('salvage_storm');
  const metrics = getHazardZoneMetrics('salvage_storm', 'condition');
  const safeLength = Math.max(720, scrollLength);
  const minimumStart = metrics.telegraphLead + 60;
  const maximumStart = Math.max(minimumStart, safeLength - metrics.activeSpan - 120);
  const startDistance = roundStormValue(
    clamp(safeLength * 0.38, minimumStart, maximumStart)
  );
  const hazard: SectorHazardPlan = {
    id: 'debug_route_salvage_squall',
    kind: 'salvage_storm',
    telegraphDistance: roundStormValue(startDistance - metrics.telegraphLead),
    startDistance,
    endDistance: roundStormValue(startDistance + metrics.activeSpan),
    xRatio: 0.5,
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: 'ROUTE SQUALL'
  };

  return {
    features: { ...features, hazards: [hazard] },
    hazard,
    targetDistance: roundStormValue(startDistance + 18)
  };
}

function createRect(
  left: number,
  top: number,
  right: number,
  bottom: number
): SectorHazardCollisionRect {
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2
  };
}

function roundStormValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
