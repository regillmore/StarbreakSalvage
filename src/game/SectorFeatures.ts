import type { SectorDefinition, SectorId } from '../content/sectors';
import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import type { CombatBounds } from './CombatState';
import type { SectorScrollPlan } from './ScrollState';

export const SECTOR_LANDMARK_KINDS = [
  'wreck_silhouette',
  'beacon_line',
  'vault_door',
  'convoy_shadow',
  'repair_platform',
  'core_machinery'
] as const;

export const SECTOR_HAZARD_KINDS = [
  'debris_lane',
  'warning_beam',
  'mine_belt',
  'salvage_storm',
  'crush_gate'
] as const;

export type SectorLandmarkKind = (typeof SECTOR_LANDMARK_KINDS)[number];
export type SectorHazardKind = (typeof SECTOR_HAZARD_KINDS)[number];
export type SectorHazardPhase = 'telegraph' | 'active';

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

export interface SectorHazardVisualState {
  readonly fillAlpha: number;
  readonly strokeAlpha: number;
  readonly lineWidth: number;
  readonly pulseScale: number;
}

const LANDMARK_SLOTS = [0.17, 0.43, 0.72] as const;
const HAZARD_SLOTS = [0.3, 0.58, 0.82] as const;
const MIN_FEATURE_DISTANCE = 120;
const MIN_HAZARD_DISTANCE = 180;

const LANDMARK_CHOICES: Readonly<Record<SectorId, readonly SectorLandmarkKind[]>> = {
  sector_outer_debris_field: ['wreck_silhouette', 'beacon_line', 'repair_platform'],
  sector_trade_war_corridor: ['convoy_shadow', 'beacon_line', 'vault_door'],
  sector_bio_machine_bloom: ['repair_platform', 'beacon_line', 'core_machinery'],
  sector_corporate_kill_grid: ['beacon_line', 'vault_door', 'core_machinery'],
  sector_lunar_surface: ['wreck_silhouette', 'beacon_line', 'convoy_shadow'],
  sector_core_wreck: ['core_machinery', 'wreck_silhouette', 'vault_door']
};

const HAZARD_CHOICES: Readonly<Record<SectorId, readonly SectorHazardKind[]>> = {
  sector_outer_debris_field: ['debris_lane', 'mine_belt', 'salvage_storm'],
  sector_trade_war_corridor: ['warning_beam', 'mine_belt', 'debris_lane'],
  sector_bio_machine_bloom: ['salvage_storm', 'debris_lane', 'mine_belt'],
  sector_corporate_kill_grid: ['warning_beam', 'crush_gate', 'mine_belt'],
  sector_lunar_surface: ['debris_lane', 'warning_beam', 'mine_belt'],
  sector_core_wreck: ['crush_gate', 'warning_beam', 'salvage_storm']
};

const LANDMARK_LABELS: Readonly<Record<SectorLandmarkKind, string>> = {
  wreck_silhouette: 'wreck silhouette',
  beacon_line: 'beacon line',
  vault_door: 'vault door',
  convoy_shadow: 'convoy shadow',
  repair_platform: 'repair platform',
  core_machinery: 'core machinery'
};

const HAZARD_LABELS: Readonly<Record<SectorHazardKind, string>> = {
  debris_lane: 'DEBRIS LANE',
  warning_beam: 'WARNING BEAM',
  mine_belt: 'MINE BELT',
  salvage_storm: 'SALVAGE STORM',
  crush_gate: 'CRUSH GATE'
};

const HAZARD_METRICS: Readonly<
  Record<
    SectorHazardKind,
    {
      readonly widthRatio: number;
      readonly activeSpan: number;
      readonly telegraphLead: number;
    }
  >
> = {
  debris_lane: { widthRatio: 0.2, activeSpan: 190, telegraphLead: 150 },
  warning_beam: { widthRatio: 0.12, activeSpan: 140, telegraphLead: 170 },
  mine_belt: { widthRatio: 0.32, activeSpan: 165, telegraphLead: 145 },
  salvage_storm: { widthRatio: 0.42, activeSpan: 210, telegraphLead: 150 },
  crush_gate: { widthRatio: 0.28, activeSpan: 130, telegraphLead: 180 }
};

const landmarkKindRegistry = new Set<string>(SECTOR_LANDMARK_KINDS);
const hazardKindRegistry = new Set<string>(SECTOR_HAZARD_KINDS);

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
  distance: number
): readonly ActiveSectorHazard[] {
  const active: ActiveSectorHazard[] = [];

  for (const hazard of plan.hazards) {
    if (distance < hazard.telegraphDistance || distance > hazard.endDistance) {
      continue;
    }

    const phase: SectorHazardPhase = distance < hazard.startDistance ? 'telegraph' : 'active';
    const totalSpan = Math.max(1, hazard.endDistance - hazard.telegraphDistance);
    const phaseSpan =
      phase === 'telegraph'
        ? Math.max(1, hazard.startDistance - hazard.telegraphDistance)
        : Math.max(1, hazard.endDistance - hazard.startDistance);
    const phaseStart = phase === 'telegraph' ? hazard.telegraphDistance : hazard.startDistance;

    active.push({
      hazard,
      phase,
      progress: roundFeatureValue(clamp((distance - hazard.telegraphDistance) / totalSpan, 0, 1)),
      phaseProgress: roundFeatureValue(clamp((distance - phaseStart) / phaseSpan, 0, 1))
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
  activeHazard: Pick<ActiveSectorHazard, 'phase' | 'progress' | 'phaseProgress'>,
  reducedMotion: boolean
): SectorHazardVisualState {
  const active = activeHazard.phase === 'active';
  const pulseScale = reducedMotion
    ? 1
    : roundFeatureValue(1 + Math.sin(activeHazard.progress * Math.PI * 8) * 0.035);

  return {
    fillAlpha: active ? 0.11 : 0.055,
    strokeAlpha: active ? 0.88 : 0.7 + activeHazard.phaseProgress * 0.18,
    lineWidth: active ? 2.4 : 2,
    pulseScale
  };
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
  const choices = rng.shuffle(HAZARD_CHOICES[sector.id]).slice(0, hazardCount);

  return HAZARD_SLOTS.slice(0, hazardCount)
    .map((slot, index) => {
      const kind = choices[index] ?? 'debris_lane';
      const metrics = HAZARD_METRICS[kind];
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
        damage: 1,
        label: HAZARD_LABELS[kind]
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
