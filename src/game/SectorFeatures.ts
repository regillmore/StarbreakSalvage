import type { SectorDefinition, SectorId } from '../content/sectors';
import {
  HAZARD_ZONE_CHOICES,
  HAZARD_ZONE_IDS,
  getHazardZoneDefinition,
  getHazardZoneMetrics,
  getHazardZoneReadability,
  type HazardZoneCollisionShape,
  type HazardZoneId,
  type HazardZoneReadabilityMetadata,
  type HazardZoneRenderLayer
} from '../content/hazardZones';
import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import type { CombatBounds } from './CombatState';
import {
  createBeamSegmentDamageRects,
  getActiveBeamBoltSegment,
  type BeamHazardGeometry
} from './BeamHazard';
import {
  getHazardZoneDamageRects,
  getHazardZonePresentationState,
  isHazardZoneDamageWindowOpen,
  type HazardZonePresentationState
} from './HazardZoneBehavior';
import type { SectorScrollPlan } from './ScrollState';

export const SECTOR_LANDMARK_KINDS = [
  'wreck_silhouette',
  'beacon_line',
  'vault_door',
  'convoy_shadow',
  'repair_platform',
  'core_machinery',
  'crater_shadow_band',
  'comm_array_flyby',
  'surface_relay'
] as const;

export const SECTOR_HAZARD_KINDS = HAZARD_ZONE_IDS;

export type SectorLandmarkKind = (typeof SECTOR_LANDMARK_KINDS)[number];
export type SectorHazardKind = HazardZoneId;
export type SectorHazardPhase = 'telegraph' | 'active';
export type SectorHazardRenderLayer = HazardZoneRenderLayer;
export type SectorHazardCollisionShape = HazardZoneCollisionShape;

export interface SectorLandmarkPlan {
  readonly id: string;
  readonly kind: SectorLandmarkKind;
  readonly distance: number;
  readonly xRatio: number;
  readonly widthRatio: number;
  readonly heightRatio: number;
  readonly label: string;
}

export interface SectorHazardPlan {
  readonly id: string;
  readonly kind: SectorHazardKind;
  readonly telegraphDistance: number;
  readonly startDistance: number;
  readonly endDistance: number;
  readonly xRatio: number;
  readonly widthRatio: number;
  readonly damage: number;
  readonly label: string;
  readonly beam?: BeamHazardGeometry;
}

export interface SectorFeaturePlan {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly landmarks: readonly SectorLandmarkPlan[];
  readonly hazards: readonly SectorHazardPlan[];
}

export interface SectorFeaturePlanOptions {
  readonly sector: SectorDefinition;
  readonly scroll: SectorScrollPlan;
  readonly rng: Rng;
}

export interface VisibleSectorLandmark {
  readonly landmark: SectorLandmarkPlan;
  readonly y: number;
  readonly alpha: number;
}

export interface ActiveSectorHazard {
  readonly hazard: SectorHazardPlan;
  readonly phase: SectorHazardPhase;
  readonly progress: number;
  readonly phaseProgress: number;
  readonly worldProgress?: number;
  readonly worldDistance?: number;
  readonly elapsedSeconds?: number;
}

export interface SectorHazardActivationOptions {
  readonly allowedHazardIds?: readonly string[];
  readonly distanceOverrides?: Readonly<Record<string, number>>;
  readonly elapsedSecondsOverrides?: Readonly<Record<string, number>>;
}

export interface SectorHazardCollisionRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
}

export type SectorHazardVisualState = HazardZonePresentationState;

export type SectorHazardReadabilityMetadata = HazardZoneReadabilityMetadata;

const LANDMARK_SLOTS = [0.17, 0.43, 0.72] as const;
const HAZARD_SLOTS = [0.3, 0.58, 0.82] as const;
const MIN_FEATURE_DISTANCE = 120;
const MIN_HAZARD_DISTANCE = 180;

const LANDMARK_CHOICES: Readonly<Record<SectorId, readonly SectorLandmarkKind[]>> = {
  sector_outer_debris_field: ['wreck_silhouette', 'beacon_line', 'repair_platform'],
  sector_trade_war_corridor: ['convoy_shadow', 'beacon_line', 'vault_door'],
  sector_bio_machine_bloom: ['repair_platform', 'beacon_line', 'core_machinery'],
  sector_corporate_kill_grid: ['beacon_line', 'vault_door', 'core_machinery'],
  sector_lunar_surface: ['crater_shadow_band', 'comm_array_flyby', 'surface_relay'],
  sector_core_wreck: ['core_machinery', 'wreck_silhouette', 'vault_door'],
  sector_nullglass_expanse: ['beacon_line', 'vault_door', 'wreck_silhouette'],
  sector_gravity_choir: ['beacon_line', 'core_machinery', 'wreck_silhouette'],
  sector_dead_signal_reef: ['wreck_silhouette', 'beacon_line', 'surface_relay'],
  sector_parallax_foundry: ['core_machinery', 'repair_platform', 'vault_door'],
  sector_horizon_scar: ['core_machinery', 'beacon_line', 'wreck_silhouette']
};

const LANDMARK_LABELS: Readonly<Record<SectorLandmarkKind, string>> = {
  wreck_silhouette: 'wreck silhouette',
  beacon_line: 'beacon line',
  vault_door: 'vault door',
  convoy_shadow: 'convoy shadow',
  repair_platform: 'repair platform',
  core_machinery: 'core machinery',
  crater_shadow_band: 'crater shadow band',
  comm_array_flyby: 'comm-array flyby',
  surface_relay: 'surface relay'
};

const landmarkKindRegistry = new Set<string>(SECTOR_LANDMARK_KINDS);
const hazardKindRegistry = new Set<string>(SECTOR_HAZARD_KINDS);
const beamEdgeRegistry = new Set(['top', 'right', 'bottom', 'left']);

export function createSectorFeaturePlan(options: SectorFeaturePlanOptions): SectorFeaturePlan {
  return {
    sectorId: options.sector.id,
    sectorIndex: options.scroll.sectorIndex,
    landmarks: createLandmarks(options.sector, options.scroll, options.rng.fork('landmarks')),
    hazards: createHazards(options.sector, options.scroll, options.rng.fork('hazards'))
  };
}

export function getVisibleSectorLandmarks(
  plan: SectorFeaturePlan,
  distance: number,
  viewportHeight = 720
): readonly VisibleSectorLandmark[] {
  const safeHeight = Math.max(240, viewportHeight);
  const leadDistance = Math.max(420, safeHeight * 1.35);
  const trailDistance = Math.max(220, safeHeight * 0.42);
  const span = leadDistance + trailDistance;
  const visible: VisibleSectorLandmark[] = [];

  for (const landmark of plan.landmarks) {
    const startsAt = landmark.distance - leadDistance;
    const endsAt = landmark.distance + trailDistance;

    if (distance < startsAt || distance > endsAt) {
      continue;
    }

    const progress = clamp((distance - startsAt) / span, 0, 1);
    const y = roundFeatureValue(-safeHeight * 0.18 + progress * safeHeight * 1.36);
    const alpha = roundFeatureValue(
      clamp(0.18 + (1 - Math.abs(progress - 0.58) * 1.42) * 0.5, 0.18, 0.72)
    );

    visible.push({ landmark, y, alpha });
  }

  return visible;
}

export function getActiveSectorHazards(
  plan: SectorFeaturePlan,
  distance: number,
  options: SectorHazardActivationOptions = {}
): readonly ActiveSectorHazard[] {
  const active: ActiveSectorHazard[] = [];

  for (const hazard of plan.hazards) {
    if (options.allowedHazardIds && !options.allowedHazardIds.includes(hazard.id)) {
      continue;
    }

    const window = hazard;
    const hazardDistance = options.distanceOverrides?.[hazard.id] ?? distance;

    if (hazardDistance < window.telegraphDistance || hazardDistance > window.endDistance) {
      continue;
    }

    const phase: SectorHazardPhase = hazardDistance < window.startDistance ? 'telegraph' : 'active';
    const totalSpan = Math.max(1, window.endDistance - window.telegraphDistance);
    const phaseSpan =
      phase === 'telegraph'
        ? Math.max(1, window.startDistance - window.telegraphDistance)
        : Math.max(1, window.endDistance - window.startDistance);
    const phaseStart = phase === 'telegraph' ? window.telegraphDistance : window.startDistance;

    const worldProgress = roundFeatureValue(
      clamp((distance - window.telegraphDistance) / totalSpan, 0, 1)
    );
    const hasDistanceOverride = Math.abs(hazardDistance - distance) > 0.001;
    const elapsedSeconds = options.elapsedSecondsOverrides?.[hazard.id];
    active.push({
      hazard,
      phase,
      progress: roundFeatureValue(
        clamp((hazardDistance - window.telegraphDistance) / totalSpan, 0, 1)
      ),
      phaseProgress: roundFeatureValue(clamp((hazardDistance - phaseStart) / phaseSpan, 0, 1)),
      ...(hasDistanceOverride ? { worldProgress, worldDistance: distance } : {}),
      ...(elapsedSeconds === undefined ? {} : { elapsedSeconds })
    });
  }

  return active;
}

export function getSectorHazardCollisionRect(
  hazard: SectorHazardPlan,
  bounds: CombatBounds
): SectorHazardCollisionRect {
  const width = Math.max(24, clamp(hazard.widthRatio, 0.05, 0.75) * bounds.width);
  const centerX = clamp(hazard.xRatio, 0, 1) * bounds.width;
  const left = clamp(centerX - width / 2, bounds.padding, bounds.width - bounds.padding);
  const right = clamp(centerX + width / 2, bounds.padding, bounds.width - bounds.padding);
  const safeLeft = clamp(left, bounds.padding, bounds.width - bounds.padding - 24);
  const safeRight = clamp(
    Math.max(right, safeLeft + 24),
    safeLeft + 24,
    bounds.width - bounds.padding
  );

  return {
    left: safeLeft,
    top: bounds.padding,
    right: safeRight,
    bottom: bounds.height - bounds.padding,
    width: safeRight - safeLeft,
    height: bounds.height - bounds.padding * 2,
    centerX: (safeLeft + safeRight) / 2
  };
}

export function getSectorHazardVisualState(
  activeHazard: ActiveSectorHazard,
  reducedMotion: boolean,
  performanceMode = false,
  highContrast = false
): SectorHazardVisualState {
  return getHazardZonePresentationState(activeHazard, {
    reducedMotion,
    performanceMode,
    highContrast
  });
}

export function getSectorHazardDamageRects(
  activeHazard: ActiveSectorHazard,
  bounds: CombatBounds
): readonly SectorHazardCollisionRect[] {
  if (activeHazard.hazard.kind === 'warning_beam') {
    if (!isHazardZoneDamageWindowOpen(activeHazard)) {
      return [];
    }

    const bolt = getActiveBeamBoltSegment(activeHazard, bounds);
    return bolt ? createBeamSegmentDamageRects(bolt) : [];
  }

  return getHazardZoneDamageRects(
    activeHazard,
    getSectorHazardCollisionRect(activeHazard.hazard, bounds)
  );
}

export function getSectorHazardReadability(
  kind: SectorHazardKind
): SectorHazardReadabilityMetadata {
  return getHazardZoneReadability(kind);
}

export function validateSectorFeaturePlan(
  plan: SectorFeaturePlan,
  scrollLength?: number
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const hasScrollLength = Number.isFinite(scrollLength) && typeof scrollLength === 'number';

  if (plan.landmarks.length < 1) {
    errors.push(`Sector feature plan ${plan.sectorId} must define at least one landmark`);
  }

  if (plan.hazards.length < 1) {
    errors.push(`Sector feature plan ${plan.sectorId} must define at least one hazard`);
  }

  for (const landmark of plan.landmarks) {
    validateFeatureId(errors, ids, plan.sectorId, landmark.id);

    if (!landmarkKindRegistry.has(landmark.kind)) {
      errors.push(
        `Sector feature plan ${plan.sectorId} has invalid landmark kind: ${landmark.kind}`
      );
    }

    validateDistance(
      errors,
      plan.sectorId,
      landmark.id,
      'distance',
      landmark.distance,
      scrollLength
    );
    validateRatio(errors, plan.sectorId, landmark.id, 'xRatio', landmark.xRatio);
    validateRatio(errors, plan.sectorId, landmark.id, 'widthRatio', landmark.widthRatio);
    validateRatio(errors, plan.sectorId, landmark.id, 'heightRatio', landmark.heightRatio);

    if (!landmark.label.trim()) {
      errors.push(`Sector feature plan ${plan.sectorId} landmark ${landmark.id} must have a label`);
    }
  }

  let previousHazardStart = -1;

  for (const hazard of plan.hazards) {
    validateFeatureId(errors, ids, plan.sectorId, hazard.id);

    if (!hazardKindRegistry.has(hazard.kind)) {
      errors.push(`Sector feature plan ${plan.sectorId} has invalid hazard kind: ${hazard.kind}`);
    }

    validateDistance(
      errors,
      plan.sectorId,
      hazard.id,
      'telegraphDistance',
      hazard.telegraphDistance,
      scrollLength
    );
    validateDistance(
      errors,
      plan.sectorId,
      hazard.id,
      'startDistance',
      hazard.startDistance,
      scrollLength
    );
    validateDistance(
      errors,
      plan.sectorId,
      hazard.id,
      'endDistance',
      hazard.endDistance,
      scrollLength
    );
    validateRatio(errors, plan.sectorId, hazard.id, 'xRatio', hazard.xRatio);
    validateRatio(errors, plan.sectorId, hazard.id, 'widthRatio', hazard.widthRatio);

    if (hazard.beam) {
      if (!beamEdgeRegistry.has(hazard.beam.sourceEdge)) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} has invalid beam source edge`
        );
      }
      if (!beamEdgeRegistry.has(hazard.beam.targetEdge)) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} has invalid beam target edge`
        );
      }
      if (hazard.beam.sourceEdge === hazard.beam.targetEdge) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} beam edges must differ`
        );
      }
      validateRatio(
        errors,
        plan.sectorId,
        hazard.id,
        'beam sourceOffsetRatio',
        hazard.beam.sourceOffsetRatio
      );
      validateRatio(
        errors,
        plan.sectorId,
        hazard.id,
        'beam targetOffsetRatio',
        hazard.beam.targetOffsetRatio
      );
    }

    if (hazard.telegraphDistance >= hazard.startDistance) {
      errors.push(
        `Sector feature plan ${plan.sectorId} hazard ${hazard.id} telegraph must precede start`
      );
    }

    if (hazard.startDistance >= hazard.endDistance) {
      errors.push(
        `Sector feature plan ${plan.sectorId} hazard ${hazard.id} start must precede end`
      );
    }

    if (hazard.startDistance < previousHazardStart) {
      errors.push(`Sector feature plan ${plan.sectorId} hazards must be ordered by start distance`);
    }

    if (!Number.isFinite(hazard.damage) || hazard.damage <= 0) {
      errors.push(
        `Sector feature plan ${plan.sectorId} hazard ${hazard.id} must have positive damage`
      );
    }

    if (!hazard.label.trim()) {
      errors.push(`Sector feature plan ${plan.sectorId} hazard ${hazard.id} must have a label`);
    }

    if (hazardKindRegistry.has(hazard.kind)) {
      const definition = getHazardZoneDefinition(hazard.kind);
      const telegraphLead = hazard.startDistance - hazard.telegraphDistance;
      const activeSpan = hazard.endDistance - hazard.startDistance;

      if (telegraphLead < definition.phase.minTelegraphLead) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} telegraph lead is below ${definition.phase.minTelegraphLead}`
        );
      }

      if (activeSpan < definition.phase.minActiveSpan) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} active span is below ${definition.phase.minActiveSpan}`
        );
      }

      if (hazard.damage !== definition.damage) {
        errors.push(
          `Sector feature plan ${plan.sectorId} hazard ${hazard.id} damage must match ${definition.damage}`
        );
      }
    }

    previousHazardStart = hazard.startDistance;
  }

  if (hasScrollLength && scrollLength <= 0) {
    errors.push(`Sector feature plan ${plan.sectorId} must use a positive scroll length`);
  }

  return errors;
}

export function summarizeSectorFeaturePlan(plan: SectorFeaturePlan): unknown {
  return {
    landmarkKinds: plan.landmarks.map((landmark) => landmark.kind),
    hazardKinds: plan.hazards.map((hazard) => hazard.kind),
    hazardWindows: plan.hazards.map((hazard) => [
      hazard.telegraphDistance,
      hazard.startDistance,
      hazard.endDistance
    ])
  };
}

function createLandmarks(
  sector: SectorDefinition,
  scroll: SectorScrollPlan,
  rng: Rng
): SectorLandmarkPlan[] {
  const choices = rng.shuffle(LANDMARK_CHOICES[sector.id]);

  return LANDMARK_SLOTS.map((slot, index) => {
    const kind = choices[index % choices.length] ?? 'wreck_silhouette';
    const distance = roundFeatureValue(
      clamp(
        scroll.length * slot + rng.int(-70, 90),
        MIN_FEATURE_DISTANCE,
        Math.max(MIN_FEATURE_DISTANCE, scroll.length - 120)
      )
    );

    return {
      id: `${sector.id}_landmark_${index + 1}`,
      kind,
      distance,
      xRatio: rng.int(16, 84) / 100,
      widthRatio: rng.int(18, 42) / 100,
      heightRatio: rng.int(8, 2 + index * 4 + 22) / 100,
      label: LANDMARK_LABELS[kind]
    };
  }).sort((left, right) => left.distance - right.distance);
}

function createHazards(
  sector: SectorDefinition,
  scroll: SectorScrollPlan,
  rng: Rng
): SectorHazardPlan[] {
  const hazardCount = scroll.sectorIndex >= 3 ? 3 : 2;
  const choices = rng.shuffle(HAZARD_ZONE_CHOICES[sector.id]).slice(0, hazardCount);

  return HAZARD_SLOTS.slice(0, hazardCount)
    .map((slot, index) => {
      const kind = choices[index] ?? 'debris_lane';
      const metrics = getHazardZoneMetrics(kind, 'sector');
      const definition = getHazardZoneDefinition(kind);
      const startDistance = roundFeatureValue(
        clamp(
          scroll.length * slot + rng.int(-80, 85),
          MIN_HAZARD_DISTANCE,
          Math.max(MIN_HAZARD_DISTANCE, scroll.length - 220)
        )
      );
      const activeSpan = metrics.activeSpan + rng.int(-20, 35);
      const endDistance = roundFeatureValue(
        clamp(
          startDistance + activeSpan,
          startDistance + 70,
          Math.max(startDistance + 70, scroll.length - 35)
        )
      );
      const telegraphLead = metrics.telegraphLead + rng.int(-18, 22);

      return {
        id: `${sector.id}_hazard_${index + 1}`,
        kind,
        telegraphDistance: roundFeatureValue(Math.max(0, startDistance - telegraphLead)),
        startDistance,
        endDistance,
        xRatio: rng.int(18, 82) / 100,
        widthRatio: roundFeatureValue(clamp(metrics.widthRatio + rng.int(-3, 4) / 100, 0.08, 0.5)),
        damage: definition.damage,
        label: definition.label
      };
    })
    .sort((left, right) => left.startDistance - right.startDistance);
}

function validateFeatureId(
  errors: string[],
  ids: Set<string>,
  sectorId: SectorId,
  id: string
): void {
  if (!id.trim()) {
    errors.push(`Sector feature plan ${sectorId} feature must have an id`);
    return;
  }

  if (ids.has(id)) {
    errors.push(`Sector feature plan ${sectorId} has duplicate feature id: ${id}`);
  }

  ids.add(id);
}

function validateDistance(
  errors: string[],
  sectorId: SectorId,
  id: string,
  field: string,
  value: number,
  scrollLength?: number
): void {
  if (!Number.isFinite(value) || value < 0) {
    errors.push(`Sector feature plan ${sectorId} feature ${id} must have non-negative ${field}`);
    return;
  }

  if (Number.isFinite(scrollLength) && typeof scrollLength === 'number' && value > scrollLength) {
    errors.push(`Sector feature plan ${sectorId} feature ${id} ${field} exceeds sector length`);
  }
}

function validateRatio(
  errors: string[],
  sectorId: SectorId,
  id: string,
  field: string,
  value: number
): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    errors.push(`Sector feature plan ${sectorId} feature ${id} must have ${field} between 0 and 1`);
  }
}

function roundFeatureValue(value: number): number {
  return Math.round(value * 100) / 100;
}
