import {
  ENVIRONMENT_OBJECT_DEFINITIONS,
  getEnvironmentObjectsForSector,
  type EnvironmentObjectCollisionShape,
  type EnvironmentObjectDefinition,
  type EnvironmentObjectId
} from '../content/environmentObjects';
import type { SectorId } from '../content/sectors';
import { clamp } from '../core/math';
import type { Rng, WeightedChoice } from '../core/rng';
import { getActPressureEnvironmentObjectTargetCount, type ActPressureModel } from './ActPressure';
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_PADDING, COMBAT_ARENA_WIDTH } from './CombatGeometry';
import type { SectorHazardPlan } from './SectorFeatures';

export interface EnvironmentObjectPlacement {
  readonly id: string;
  readonly definitionId: EnvironmentObjectId;
  readonly collisionShape: EnvironmentObjectCollisionShape;
  readonly layoutRole?: EnvironmentObjectLayoutRole;
  readonly distance: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly safeLaneWidth: number;
  readonly debugLabel: string;
}

export type EnvironmentObjectLayoutRole = 'lanePressure' | 'cover' | 'gate' | 'reward';

export interface EnvironmentObjectPlacementPlan {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly arenaWidth: number;
  readonly arenaHeight: number;
  readonly padding: number;
  readonly objects: readonly EnvironmentObjectPlacement[];
}

export interface EnvironmentObjectHazardAvoidance {
  readonly id?: string;
  readonly kind?: SectorHazardPlan['kind'];
  readonly telegraphDistance: number;
  readonly startDistance: number;
  readonly endDistance: number;
  readonly xRatio: number;
  readonly widthRatio: number;
}

export interface EnvironmentObjectEnemyLaneReservation {
  readonly distance: number;
  readonly xRatio: number;
  readonly width?: number;
  readonly label?: string;
}

export interface EnvironmentObjectBossLockAvoidance {
  readonly approachStartDistance: number;
  readonly lockDistance: number;
  readonly releaseDistance: number;
}

export interface EnvironmentObjectPlacementOptions {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly rng: Rng;
  readonly definitions?: readonly EnvironmentObjectDefinition[];
  readonly targetCount?: number;
  readonly hazards?: readonly EnvironmentObjectHazardAvoidance[];
  readonly enemySpawnLanes?: readonly EnvironmentObjectEnemyLaneReservation[];
  readonly bossArena?: EnvironmentObjectBossLockAvoidance | null;
  readonly actPressure?: ActPressureModel;
}

export const ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE = 180;
export const ENVIRONMENT_OBJECT_ACTIVE_TRAIL_DISTANCE = 180;
export const ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE = 280;

const DEFAULT_TARGET_COUNT = 3;
const MAX_PLACEMENT_ATTEMPTS = 72;
const OBJECT_Y_MIN = 96;
const OBJECT_Y_MAX = 580;
const HAZARD_OVERLAY_BUFFER_DISTANCE = 42;
const HAZARD_OVERLAY_BUFFER_WIDTH = 18;
const ENEMY_SPAWN_DISTANCE_BUFFER = 78;
const ENEMY_SPAWN_LANE_WIDTH = 96;
const BOSS_LOCK_BUFFER_DISTANCE = 120;

export function createEnvironmentObjectPlacementPlan(
  options: EnvironmentObjectPlacementOptions
): EnvironmentObjectPlacementPlan {
  const availableDefinitions = getEnvironmentObjectsForSector(
    options.sectorId,
    options.definitions ?? ENVIRONMENT_OBJECT_DEFINITIONS
  );
  const definitions = availableDefinitions.filter(
    (definition) => definition.id !== 'proximity_mine'
  );
  const mineDefinition = availableDefinitions.find(
    (definition) => definition.id === 'proximity_mine'
  );
  const baseTargetCount =
    options.targetCount ?? DEFAULT_TARGET_COUNT + (options.sectorIndex >= 3 ? 1 : 0);
  const targetCount = options.actPressure
    ? getActPressureEnvironmentObjectTargetCount(baseTargetCount, options.actPressure)
    : clamp(baseTargetCount, 1, 5);
  const objects: EnvironmentObjectPlacement[] = [];
  const perDefinitionCounts = new Map<EnvironmentObjectId, number>();

  if (options.scrollLength <= 0) {
    return createPlan(options, []);
  }

  for (
    let attempt = 0;
    attempt < MAX_PLACEMENT_ATTEMPTS && objects.length < targetCount;
    attempt += 1
  ) {
    if (definitions.length === 0) {
      break;
    }

    const definition = chooseDefinition(definitions, options.rng);
    const currentCount = perDefinitionCounts.get(definition.id) ?? 0;

    if (currentCount >= definition.placement.maxPerSector) {
      continue;
    }

    const placement = createPlacement(options, definition, objects.length, attempt);

    if (!placement || !isPlacementSafe(options, placement, definition, objects)) {
      continue;
    }

    perDefinitionCounts.set(definition.id, currentCount + 1);
    objects.push(placement);
  }

  const minePlacements = mineDefinition ? createMineClusterPlacements(options, mineDefinition) : [];

  return createPlan(options, [...objects, ...minePlacements].sort(comparePlacements));
}

function createMineClusterPlacements(
  options: EnvironmentObjectPlacementOptions,
  definition: EnvironmentObjectDefinition
): EnvironmentObjectPlacement[] {
  const hazards = (options.hazards ?? []).filter((hazard) => hazard.kind === 'mine_belt');
  const placements: EnvironmentObjectPlacement[] = [];
  const halfWidth = definition.collision.radius;
  const minDistance = Math.max(
    definition.placement.avoidPlayerSpawnDistance + ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE,
    halfWidth
  );
  const maxDistance = options.scrollLength - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE;

  if (maxDistance < minDistance) {
    return placements;
  }

  for (const [clusterIndex, hazard] of hazards.entries()) {
    const rng = options.rng.fork(`mine-cluster:${hazard.id ?? clusterIndex + 1}`);
    const count = rng.int(4, 6);
    const centerX = clamp(hazard.xRatio, 0.12, 0.88) * COMBAT_ARENA_WIDTH;
    const laneWidth = Math.max(132, hazard.widthRatio * COMBAT_ARENA_WIDTH);
    const columnOffset = Math.min(54, laneWidth * 0.27);
    const anchorDistance = clamp(hazard.startDistance, minDistance, maxDistance);

    for (let index = 0; index < count; index += 1) {
      const column = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const x = roundPlacementValue(
        clamp(
          centerX + column * columnOffset + rng.int(-12, 12),
          COMBAT_ARENA_PADDING + halfWidth,
          COMBAT_ARENA_WIDTH - COMBAT_ARENA_PADDING - halfWidth
        )
      );
      const y = roundPlacementValue(
        clamp(138 + row * 154 + rng.int(-18, 18), 96, COMBAT_ARENA_HEIGHT - 80)
      );
      const distance = roundPlacementValue(
        clamp(anchorDistance + rng.int(-18, 18), minDistance, maxDistance)
      );

      placements.push({
        id: `${options.sectorId}_mine_${clusterIndex + 1}_${index + 1}`,
        definitionId: definition.id,
        collisionShape: definition.collision.shape,
        layoutRole: 'lanePressure',
        distance,
        x,
        y,
        width: definition.collision.width,
        height: definition.collision.height,
        radius: definition.collision.radius,
        safeLaneWidth: getEnvironmentObjectOpenLaneWidth({
          x,
          width: definition.collision.width,
          radius: definition.collision.radius,
          collisionShape: definition.collision.shape
        }),
        debugLabel: definition.debugLabel
      });
    }
  }

  return placements;
}

function comparePlacements(
  left: EnvironmentObjectPlacement,
  right: EnvironmentObjectPlacement
): number {
  return left.distance - right.distance || left.x - right.x || left.id.localeCompare(right.id);
}

export function getEnvironmentObjectFootprintWidth(
  definition: EnvironmentObjectDefinition
): number {
  return definition.collision.shape === 'circle'
    ? definition.collision.radius * 2
    : definition.collision.width;
}

export function getEnvironmentObjectOpenLaneWidth(
  placement: Pick<EnvironmentObjectPlacement, 'x' | 'width' | 'radius' | 'collisionShape'>
): number {
  const footprint = placement.collisionShape === 'circle' ? placement.radius * 2 : placement.width;
  const leftOpen = placement.x - footprint / 2 - COMBAT_ARENA_PADDING;
  const rightOpen = COMBAT_ARENA_WIDTH - COMBAT_ARENA_PADDING - (placement.x + footprint / 2);

  return roundPlacementValue(Math.max(leftOpen, rightOpen));
}

export function getEnvironmentObjectActiveDistanceWindow(
  placement: Pick<EnvironmentObjectPlacement, 'distance'>
): { readonly startDistance: number; readonly endDistance: number } {
  return {
    startDistance: roundPlacementValue(
      Math.max(0, placement.distance - ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE)
    ),
    endDistance: roundPlacementValue(placement.distance + ENVIRONMENT_OBJECT_ACTIVE_TRAIL_DISTANCE)
  };
}

export function validateEnvironmentObjectPlacementPlan(
  plan: EnvironmentObjectPlacementPlan,
  definitions: readonly EnvironmentObjectDefinition[] = ENVIRONMENT_OBJECT_DEFINITIONS
): string[] {
  const errors: string[] = [];
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));

  if (plan.arenaWidth !== COMBAT_ARENA_WIDTH || plan.arenaHeight !== COMBAT_ARENA_HEIGHT) {
    errors.push('Environment object placement plan must use fixed combat-world dimensions');
  }

  for (const object of plan.objects) {
    const definition = definitionsById.get(object.definitionId);

    if (!definition) {
      errors.push(`Environment object placement ${object.id} references missing definition`);
      continue;
    }

    const footprint = getEnvironmentObjectFootprintWidth(definition);
    const halfWidth = footprint / 2;
    const halfHeight = Math.max(definition.collision.height / 2, definition.collision.radius);

    if (
      object.x - halfWidth < plan.padding ||
      object.x + halfWidth > plan.arenaWidth - plan.padding ||
      object.y - halfHeight < plan.padding ||
      object.y + halfHeight > plan.arenaHeight - plan.padding
    ) {
      errors.push(`Environment object placement ${object.id} is outside fixed combat bounds`);
    }

    if (getEnvironmentObjectOpenLaneWidth(object) < definition.placement.safeLaneWidth) {
      errors.push(`Environment object placement ${object.id} leaves an unsafe lane`);
    }

    if (object.distance < definition.placement.avoidPlayerSpawnDistance) {
      errors.push(`Environment object placement ${object.id} blocks the player spawn corridor`);
    }

    if (object.distance > plan.scrollLength - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE) {
      errors.push(`Environment object placement ${object.id} blocks the sector exit corridor`);
    }
  }

  return errors;
}

function createPlan(
  options: Pick<EnvironmentObjectPlacementOptions, 'sectorId' | 'sectorIndex' | 'scrollLength'>,
  objects: readonly EnvironmentObjectPlacement[]
): EnvironmentObjectPlacementPlan {
  return {
    sectorId: options.sectorId,
    sectorIndex: options.sectorIndex,
    scrollLength: options.scrollLength,
    arenaWidth: COMBAT_ARENA_WIDTH,
    arenaHeight: COMBAT_ARENA_HEIGHT,
    padding: COMBAT_ARENA_PADDING,
    objects
  };
}

function chooseDefinition(
  definitions: readonly EnvironmentObjectDefinition[],
  rng: Rng
): EnvironmentObjectDefinition {
  return rng.weightedChoice(
    definitions.map((definition): WeightedChoice<EnvironmentObjectDefinition> => ({
      item: definition,
      weight: definition.placement.weight
    }))
  );
}

function createPlacement(
  options: EnvironmentObjectPlacementOptions,
  definition: EnvironmentObjectDefinition,
  placementIndex: number,
  attempt: number
): EnvironmentObjectPlacement | null {
  const footprint = getEnvironmentObjectFootprintWidth(definition);
  const halfWidth = footprint / 2;
  const halfHeight = Math.max(definition.collision.height / 2, definition.collision.radius);
  const band = options.rng.choice(definition.placement.xBands);
  const minX = Math.max(COMBAT_ARENA_PADDING + halfWidth, COMBAT_ARENA_WIDTH * band.minXRatio);
  const maxX = Math.min(
    COMBAT_ARENA_WIDTH - COMBAT_ARENA_PADDING - halfWidth,
    COMBAT_ARENA_WIDTH * band.maxXRatio
  );
  const distanceBounds = getPlacementDistanceBounds(options, definition);

  if (maxX < minX || distanceBounds.maxDistance < distanceBounds.minDistance) {
    return null;
  }

  const minRatio = Math.max(0, definition.placement.minDistanceRatio);
  const maxRatio = Math.min(1, definition.placement.maxDistanceRatio);
  const distanceRatio =
    options.rng.int(Math.round(minRatio * 1000), Math.round(maxRatio * 1000)) / 1000;
  const distance = roundPlacementValue(
    clamp(
      options.scrollLength * distanceRatio,
      distanceBounds.minDistance,
      distanceBounds.maxDistance
    )
  );
  const x = roundPlacementValue(options.rng.int(Math.round(minX), Math.round(maxX)));
  const y = roundPlacementValue(
    options.rng.int(
      Math.round(Math.max(OBJECT_Y_MIN, COMBAT_ARENA_PADDING + halfHeight)),
      Math.round(Math.min(OBJECT_Y_MAX, COMBAT_ARENA_HEIGHT - COMBAT_ARENA_PADDING - halfHeight))
    )
  );

  return {
    id: `${options.sectorId}_env_${definition.id}_${placementIndex + 1}_${attempt + 1}`,
    definitionId: definition.id,
    collisionShape: definition.collision.shape,
    layoutRole: getLayoutRole(definition),
    distance,
    x,
    y,
    width: definition.collision.width,
    height: definition.collision.height,
    radius: definition.collision.radius,
    safeLaneWidth: getEnvironmentObjectOpenLaneWidth({
      x,
      width: definition.collision.width,
      radius: definition.collision.radius,
      collisionShape: definition.collision.shape
    }),
    debugLabel: definition.debugLabel
  };
}

function isPlacementSafe(
  options: EnvironmentObjectPlacementOptions,
  placement: EnvironmentObjectPlacement,
  definition: EnvironmentObjectDefinition,
  existing: readonly EnvironmentObjectPlacement[]
): boolean {
  if (getEnvironmentObjectOpenLaneWidth(placement) < definition.placement.safeLaneWidth) {
    return false;
  }

  if (
    !existing.every(
      (object) => Math.abs(object.distance - placement.distance) >= definition.placement.minSpacing
    )
  ) {
    return false;
  }

  if (overlapsBossLock(placement, definition, options.bossArena)) {
    return false;
  }

  if (overlapsHazardLane(placement, options.hazards ?? [])) {
    return false;
  }

  return !overlapsEnemySpawnLane(placement, options.enemySpawnLanes ?? []);
}

function getPlacementDistanceBounds(
  options: EnvironmentObjectPlacementOptions,
  definition: EnvironmentObjectDefinition
): { readonly minDistance: number; readonly maxDistance: number } {
  const minDistance = roundPlacementValue(
    Math.max(
      definition.placement.avoidPlayerSpawnDistance + ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE,
      options.scrollLength * definition.placement.minDistanceRatio
    )
  );
  const exitClearDistance = Math.max(
    ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE,
    ENVIRONMENT_OBJECT_ACTIVE_TRAIL_DISTANCE
  );
  const definitionMaxDistance = options.scrollLength * definition.placement.maxDistanceRatio;
  const exitMaxDistance = Math.max(0, options.scrollLength - exitClearDistance);
  const bossArena = options.bossArena;
  const bossMaxDistance =
    bossArena === null || bossArena === undefined
      ? Number.POSITIVE_INFINITY
      : bossArena.approachStartDistance -
        Math.max(definition.placement.avoidBossLockDistance, BOSS_LOCK_BUFFER_DISTANCE);

  return {
    minDistance,
    maxDistance: roundPlacementValue(
      Math.min(definitionMaxDistance, exitMaxDistance, bossMaxDistance)
    )
  };
}

function getLayoutRole(definition: EnvironmentObjectDefinition): EnvironmentObjectLayoutRole {
  if (definition.collision.shape === 'gate') {
    return 'gate';
  }

  if (definition.reward.policy !== 'none') {
    return definition.kind === 'obstacle' ? 'cover' : 'reward';
  }

  return definition.kind === 'obstacle' ? 'lanePressure' : 'cover';
}

function overlapsBossLock(
  placement: EnvironmentObjectPlacement,
  definition: EnvironmentObjectDefinition,
  bossArena: EnvironmentObjectBossLockAvoidance | null | undefined
): boolean {
  if (!bossArena) {
    return false;
  }

  const activeWindow = getEnvironmentObjectActiveDistanceWindow(placement);
  const avoidStart = Math.max(
    0,
    bossArena.approachStartDistance -
      Math.max(definition.placement.avoidBossLockDistance, BOSS_LOCK_BUFFER_DISTANCE)
  );
  const avoidEnd = bossArena.releaseDistance + ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE;

  return rangesOverlap(activeWindow.startDistance, activeWindow.endDistance, avoidStart, avoidEnd);
}

function overlapsHazardLane(
  placement: EnvironmentObjectPlacement,
  hazards: readonly EnvironmentObjectHazardAvoidance[]
): boolean {
  const activeWindow = getEnvironmentObjectActiveDistanceWindow(placement);
  const placementRect = getPlacementHorizontalRect(placement, HAZARD_OVERLAY_BUFFER_WIDTH);

  return hazards.some((hazard) => {
    const hazardStart = Math.max(0, hazard.telegraphDistance - HAZARD_OVERLAY_BUFFER_DISTANCE);
    const hazardEnd = hazard.endDistance + HAZARD_OVERLAY_BUFFER_DISTANCE;

    if (
      !rangesOverlap(activeWindow.startDistance, activeWindow.endDistance, hazardStart, hazardEnd)
    ) {
      return false;
    }

    const hazardWidth = COMBAT_ARENA_WIDTH * clamp(hazard.widthRatio, 0, 1);
    const hazardCenter = COMBAT_ARENA_WIDTH * clamp(hazard.xRatio, 0, 1);
    const hazardRect = {
      left: hazardCenter - hazardWidth / 2 - HAZARD_OVERLAY_BUFFER_WIDTH,
      right: hazardCenter + hazardWidth / 2 + HAZARD_OVERLAY_BUFFER_WIDTH
    };

    return placementRect.left <= hazardRect.right && placementRect.right >= hazardRect.left;
  });
}

function overlapsEnemySpawnLane(
  placement: EnvironmentObjectPlacement,
  enemySpawnLanes: readonly EnvironmentObjectEnemyLaneReservation[]
): boolean {
  const placementRect = getPlacementHorizontalRect(placement, ENEMY_SPAWN_LANE_WIDTH * 0.18);

  return enemySpawnLanes.some((lane) => {
    if (Math.abs(placement.distance - lane.distance) > ENEMY_SPAWN_DISTANCE_BUFFER) {
      return false;
    }

    const laneWidth = lane.width ?? ENEMY_SPAWN_LANE_WIDTH;
    const laneCenter = COMBAT_ARENA_WIDTH * clamp(lane.xRatio, 0, 1);
    const laneRect = {
      left: laneCenter - laneWidth / 2,
      right: laneCenter + laneWidth / 2
    };

    return placementRect.left <= laneRect.right && placementRect.right >= laneRect.left;
  });
}

function getPlacementHorizontalRect(
  placement: EnvironmentObjectPlacement,
  margin = 0
): { readonly left: number; readonly right: number } {
  const footprint = placement.collisionShape === 'circle' ? placement.radius * 2 : placement.width;

  return {
    left: placement.x - footprint / 2 - margin,
    right: placement.x + footprint / 2 + margin
  };
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number
): boolean {
  return leftStart <= rightEnd && leftEnd >= rightStart;
}

function roundPlacementValue(value: number): number {
  return Math.round(value * 100) / 100;
}
