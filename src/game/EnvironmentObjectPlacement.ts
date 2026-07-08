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
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_PADDING, COMBAT_ARENA_WIDTH } from './CombatGeometry';

export interface EnvironmentObjectPlacement {
  readonly id: string;
  readonly definitionId: EnvironmentObjectId;
  readonly collisionShape: EnvironmentObjectCollisionShape;
  readonly distance: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly safeLaneWidth: number;
  readonly debugLabel: string;
}

export interface EnvironmentObjectPlacementPlan {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly arenaWidth: number;
  readonly arenaHeight: number;
  readonly padding: number;
  readonly objects: readonly EnvironmentObjectPlacement[];
}

export interface EnvironmentObjectPlacementOptions {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly rng: Rng;
  readonly definitions?: readonly EnvironmentObjectDefinition[];
  readonly targetCount?: number;
}

const DEFAULT_TARGET_COUNT = 3;
const MAX_PLACEMENT_ATTEMPTS = 40;
const OBJECT_Y_MIN = 96;
const OBJECT_Y_MAX = 580;

export function createEnvironmentObjectPlacementPlan(
  options: EnvironmentObjectPlacementOptions
): EnvironmentObjectPlacementPlan {
  const definitions = getEnvironmentObjectsForSector(
    options.sectorId,
    options.definitions ?? ENVIRONMENT_OBJECT_DEFINITIONS
  );
  const targetCount = clamp(
    options.targetCount ?? DEFAULT_TARGET_COUNT + (options.sectorIndex >= 3 ? 1 : 0),
    1,
    5
  );
  const objects: EnvironmentObjectPlacement[] = [];
  const perDefinitionCounts = new Map<EnvironmentObjectId, number>();

  if (definitions.length === 0 || options.scrollLength <= 0) {
    return createPlan(options, []);
  }

  for (
    let attempt = 0;
    attempt < MAX_PLACEMENT_ATTEMPTS && objects.length < targetCount;
    attempt += 1
  ) {
    const definition = chooseDefinition(definitions, options.rng);
    const currentCount = perDefinitionCounts.get(definition.id) ?? 0;

    if (currentCount >= definition.placement.maxPerSector) {
      continue;
    }

    const placement = createPlacement(options, definition, objects.length, attempt);

    if (!placement || !isPlacementSafe(placement, definition, objects)) {
      continue;
    }

    perDefinitionCounts.set(definition.id, currentCount + 1);
    objects.push(placement);
  }

  return createPlan(
    options,
    objects.sort((left, right) => left.distance - right.distance || left.x - right.x)
  );
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

  if (maxX < minX) {
    return null;
  }

  const minRatio = Math.max(0, definition.placement.minDistanceRatio);
  const maxRatio = Math.min(1, definition.placement.maxDistanceRatio);
  const distanceRatio =
    options.rng.int(Math.round(minRatio * 1000), Math.round(maxRatio * 1000)) / 1000;
  const distance = roundPlacementValue(
    clamp(
      options.scrollLength * distanceRatio,
      definition.placement.avoidPlayerSpawnDistance,
      Math.max(definition.placement.avoidPlayerSpawnDistance, options.scrollLength - 120)
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
  placement: EnvironmentObjectPlacement,
  definition: EnvironmentObjectDefinition,
  existing: readonly EnvironmentObjectPlacement[]
): boolean {
  if (getEnvironmentObjectOpenLaneWidth(placement) < definition.placement.safeLaneWidth) {
    return false;
  }

  return existing.every(
    (object) => Math.abs(object.distance - placement.distance) >= definition.placement.minSpacing
  );
}

function roundPlacementValue(value: number): number {
  return Math.round(value * 100) / 100;
}
