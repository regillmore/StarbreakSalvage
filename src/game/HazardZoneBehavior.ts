import {
  getHazardZoneDefinition,
  type HazardZoneBehaviorKind,
  type HazardZoneDamageShape,
  type HazardZoneId,
  type HazardZoneRenderLayer,
  type HazardZoneTelegraphShape
} from '../content/hazardZones';
import { clamp } from '../core/math';
import type { ActiveSectorHazard, SectorHazardCollisionRect } from './SectorFeatures';

export interface HazardZonePresentationSettings {
  readonly reducedMotion: boolean;
  readonly performanceMode?: boolean;
  readonly highContrast?: boolean;
}

export interface HazardZonePresentationState {
  readonly behaviorKind: HazardZoneBehaviorKind;
  readonly telegraphShape: HazardZoneTelegraphShape;
  readonly activeDamageShape: HazardZoneDamageShape;
  readonly renderLayer: HazardZoneRenderLayer;
  readonly warningCue: string;
  readonly activeCue: string;
  readonly fillAlpha: number;
  readonly strokeAlpha: number;
  readonly lineWidth: number;
  readonly pulseScale: number;
  readonly motionRatio: number;
  readonly patternStride: number;
  readonly segmentCount: number;
  readonly damageWindowOpen: boolean;
}

export function getHazardZonePresentationState(
  activeHazard: ActiveSectorHazard,
  settings: HazardZonePresentationSettings
): HazardZonePresentationState {
  const definition = getHazardZoneDefinition(activeHazard.hazard.kind);
  const behavior = definition.behavior;
  const readability = definition.readability;
  const isActive = activeHazard.phase === 'active';
  const simplified = Boolean(settings.reducedMotion || settings.performanceMode);
  const contrastScale = settings.highContrast ? 1.06 : 1;
  const alphaScale = settings.performanceMode ? 0.82 : 1;
  const motionRatio = settings.reducedMotion
    ? 0.5
    : getMotionRatio(behavior.kind, activeHazard.phaseProgress, behavior.motionScale);
  const pulseScale = settings.reducedMotion
    ? 1
    : roundBehaviorValue(1 + Math.sin(activeHazard.progress * Math.PI * 8) * 0.035);

  return {
    behaviorKind: behavior.kind,
    telegraphShape: definition.telegraphShape,
    activeDamageShape: definition.activeDamageShape,
    renderLayer: readability.renderLayer,
    warningCue: behavior.warningCue,
    activeCue: behavior.activeCue,
    fillAlpha: roundBehaviorValue(
      clamp(
        (isActive ? readability.maxFillAlpha : readability.maxFillAlpha * 0.5) * alphaScale,
        0,
        readability.maxFillAlpha
      )
    ),
    strokeAlpha: roundBehaviorValue(
      clamp(
        (isActive
          ? readability.maxStrokeAlpha
          : readability.maxStrokeAlpha * (0.72 + activeHazard.phaseProgress * 0.18)) *
          contrastScale,
        0,
        readability.maxStrokeAlpha
      )
    ),
    lineWidth: roundBehaviorValue((isActive ? 2.4 : 2) * (settings.highContrast ? 1.08 : 1)),
    pulseScale,
    motionRatio,
    patternStride: Math.round(
      clamp(72 - behavior.patternDensity * 34 + (settings.performanceMode ? 20 : 0), 28, 96)
    ),
    segmentCount: simplified
      ? Math.max(1, Math.min(2, behavior.collisionBands))
      : Math.max(1, behavior.collisionBands),
    damageWindowOpen: isHazardZoneDamageWindowOpen(activeHazard)
  };
}

export function isHazardZoneDamageWindowOpen(activeHazard: ActiveSectorHazard): boolean {
  if (activeHazard.phase !== 'active') {
    return false;
  }

  const behavior = getHazardZoneDefinition(activeHazard.hazard.kind).behavior;

  if (behavior.activeDamageDutyCycle >= 0.999 || behavior.activePulseCount <= 1) {
    return true;
  }

  const pulseProgress = (activeHazard.phaseProgress * behavior.activePulseCount) % 1;

  return pulseProgress <= behavior.activeDamageDutyCycle;
}

export function getHazardZoneDamageRects(
  activeHazard: ActiveSectorHazard,
  baseRect: SectorHazardCollisionRect
): readonly SectorHazardCollisionRect[] {
  if (!isHazardZoneDamageWindowOpen(activeHazard)) {
    return [];
  }

  const behavior = getHazardZoneDefinition(activeHazard.hazard.kind).behavior;

  if (behavior.kind === 'sweepBeam') {
    const sweepWidth = clamp(baseRect.width * 0.42, 18, Math.max(18, baseRect.width));
    const centerX = clamp(
      baseRect.left +
        baseRect.width *
          getMotionRatio(behavior.kind, activeHazard.phaseProgress, behavior.motionScale),
      baseRect.left + sweepWidth / 2,
      baseRect.right - sweepWidth / 2
    );

    return [createRect(centerX - sweepWidth / 2, baseRect.top, centerX + sweepWidth / 2, baseRect.bottom)];
  }

  if (behavior.kind === 'collapsingColumns') {
    const widthScale = 0.48 + activeHazard.phaseProgress * 0.52;
    const width = clamp(baseRect.width * widthScale, 24, baseRect.width);

    return [createRect(baseRect.centerX - width / 2, baseRect.top, baseRect.centerX + width / 2, baseRect.bottom)];
  }

  if (behavior.kind === 'dustFront') {
    const height = clamp(baseRect.height * 0.34, 120, baseRect.height);
    const top = clamp(
      baseRect.top + (baseRect.height - height) * activeHazard.phaseProgress,
      baseRect.top,
      baseRect.bottom - height
    );

    return [createRect(baseRect.left, top, baseRect.right, top + height)];
  }

  if (behavior.kind === 'driftingMineBand' || behavior.kind === 'plasmaCurtain') {
    return createSegmentedRects(activeHazard.hazard.kind, baseRect, behavior.collisionBands);
  }

  return [baseRect];
}

function createSegmentedRects(
  hazardId: HazardZoneId,
  baseRect: SectorHazardCollisionRect,
  segmentCount: number
): readonly SectorHazardCollisionRect[] {
  const count = Math.max(1, Math.min(4, Math.floor(segmentCount)));

  if (count <= 1) {
    return [baseRect];
  }

  const gap = hazardId === 'mine_belt' ? 18 : 10;
  const totalGap = gap * (count - 1);
  const segmentWidth = Math.max(18, (baseRect.width - totalGap) / count);
  const rects: SectorHazardCollisionRect[] = [];

  for (let index = 0; index < count; index += 1) {
    const left = baseRect.left + index * (segmentWidth + gap);
    rects.push(createRect(left, baseRect.top, Math.min(baseRect.right, left + segmentWidth), baseRect.bottom));
  }

  return rects;
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

function getMotionRatio(
  kind: HazardZoneBehaviorKind,
  phaseProgress: number,
  motionScale: number
): number {
  const progress = clamp(phaseProgress, 0, 1);
  const scale = clamp(motionScale, 0, 1);

  if (kind === 'driftingMineBand' || kind === 'dustFront') {
    return roundBehaviorValue(clamp(0.5 + (progress - 0.5) * scale, 0, 1));
  }

  if (kind === 'collapsingColumns' || kind === 'pulseField') {
    return roundBehaviorValue(clamp(0.5 + Math.sin(progress * Math.PI * 2) * 0.5 * scale, 0, 1));
  }

  if (kind === 'sweepBeam') {
    return roundBehaviorValue(clamp(0.5 + Math.sin((progress - 0.25) * Math.PI) * 0.5 * scale, 0, 1));
  }

  return roundBehaviorValue(0.5);
}

function roundBehaviorValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
