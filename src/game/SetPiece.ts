import {
  SET_PIECES,
  getSetPieceById,
  getSetPieceComponentTemplate,
  getSetPieceLayoutById,
  type SetPieceCollisionShape,
  type SetPieceComponentKind,
  type SetPieceComponentTemplate,
  type SetPieceDamageSource,
  type SetPieceDefinition,
  type SetPieceId,
  type SetPieceKind,
  type SetPieceLayoutDefinition,
  type SetPieceStageBeat
} from '../content/setPieces';
import { ENEMY_FORMATION_IDS } from '../content/enemyFormations';
import { FACTIONS } from '../content/factions';
import type { FactionId } from '../content/factions';
import { SHIPS } from '../content/ships';
import { WEAPONS } from '../content/weapons';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_PADDING, COMBAT_ARENA_WIDTH } from './CombatGeometry';
import type { BossArenaPlan } from './BossArena';
import type { EnemySpawn } from './CombatState';

export interface SetPiecePlan {
  readonly id: string;
  readonly definitionId: SetPieceId;
  readonly layoutId: string;
  readonly layoutLabel: string;
  readonly name: string;
  readonly kind: SetPieceKind;
  readonly anchorDistance: number;
  readonly safeLane: SetPieceLayoutDefinition['safeLane'];
  readonly bossLock: SetPieceDefinition['bossLock'];
  readonly approachPressure: SetPieceDefinition['approachPressure'];
  readonly reinforcement: SetPieceDefinition['reinforcement'] & {
    readonly xRatios: readonly number[];
  };
  readonly caps: SetPieceDefinition['caps'];
}

export interface SetPieceComponentState {
  readonly id: string;
  readonly templateId: SetPieceDefinition['components'][number]['templateId'];
  readonly kind: SetPieceComponentKind;
  readonly x: number;
  readonly y: number;
  readonly distance: number;
  readonly collisionShape: SetPieceCollisionShape;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly blocksMovement: boolean;
  readonly contactDamage: number;
  readonly stageId: string;
  readonly dependsOn: readonly string[];
  readonly objectiveTarget: boolean;
  readonly maxHull: number;
  readonly armor: number;
  readonly allowedDamageSources: readonly SetPieceDamageSource[];
  hull: number;
  targetable: boolean;
  destroyed: boolean;
  rewardClaimed: boolean;
  hitFlashSeconds: number;
  hazardCooldownSeconds: number;
  subsystemCooldownSeconds: number;
  subsystemTriggered: boolean;
}

export type SetPieceRuntimeEventType =
  'componentDestroyed' | 'stageCompleted' | 'setPieceCompleted';

export interface SetPieceRuntimeEvent {
  readonly id: string;
  readonly type: SetPieceRuntimeEventType;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly credits: number;
  readonly salvage: number;
  readonly componentId: string | null;
  readonly stageId: string | null;
  readonly beat: SetPieceStageBeat | null;
}

export interface SetPieceState {
  readonly plan: SetPiecePlan;
  readonly ownerFactionId: FactionId;
  readonly components: SetPieceComponentState[];
  currentStageIndex: number;
  completedStageIds: string[];
  claimedEventIds: string[];
  eventLog: SetPieceRuntimeEvent[];
  reinforcementsTriggered: boolean;
  completed: boolean;
}

export interface SetPieceReadModel {
  readonly active: boolean;
  readonly name: string;
  readonly stageLabel: string;
  readonly beat: SetPieceStageBeat | 'complete';
  readonly targetLabel: string;
  readonly destroyedComponents: number;
  readonly totalComponents: number;
  readonly objectiveTargetsDestroyed: number;
  readonly objectiveTargetsTotal: number;
  readonly layoutLabel: string;
  readonly safeLaneLabel: string;
  readonly bossLockActive: boolean;
}

export interface SetPieceValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const ACTIVE_LEAD_DISTANCE = 210;
const ACTIVE_TRAIL_DISTANCE = 210;
const HAZARD_COOLDOWN_SECONDS = 0.35;
const MIN_SAFE_LANE_WIDTH = 128;
export const SET_PIECE_ENGAGEMENT_LEAD_DISTANCE = 80;
export const SET_PIECE_APPROACH_CLEARANCE = 24;
export const SET_PIECE_BOTTOM_RECOVERY_HEIGHT = 150;
const SET_PIECE_SCROLL_LOCK_OVERSHOOT_ALLOWANCE = 16;
const FORWARD_FIRE_PROJECTILE_RADIUS = Math.max(
  ...WEAPONS.map((weapon) => weapon.projectileRadius)
);
const FORWARD_FIRE_PLAYER_EDGE_CLEARANCE =
  COMBAT_ARENA_PADDING + Math.max(...SHIPS.map((ship) => ship.stats.hitRadius));
const MIN_FORWARD_FIRE_LANE_WIDTH = 14;
const SET_PIECE_BY_SECTOR: Readonly<Record<number, SetPieceId>> = {
  1: 'setpiece_ledger_hecaton',
  7: 'setpiece_bloom_spindle',
  10: 'setpiece_court_wreck_train'
};

export function createSetPiecePlan(options: {
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly bossArena?: BossArenaPlan | null;
  readonly definitionId?: SetPieceId | null;
  readonly layoutId?: string;
  readonly layoutSeed?: string;
}): SetPiecePlan | null {
  const definitionId = Object.prototype.hasOwnProperty.call(options, 'definitionId')
    ? options.definitionId
    : SET_PIECE_BY_SECTOR[options.sectorIndex];

  if (!definitionId) {
    return null;
  }

  const definition = getSetPieceById(definitionId);
  const layout = options.layoutId
    ? getSetPieceLayoutById(definition, options.layoutId)
    : options.layoutSeed
      ? createRng(options.layoutSeed).choice(definition.layouts)
      : definition.layouts[0];

  if (!layout) {
    throw new Error(`Set piece ${definition.id} has no layouts.`);
  }

  const anchorDistance = getSetPieceAnchorDistance(
    definition,
    options.scrollLength,
    options.bossArena ?? null
  );

  return {
    id: `${definition.id}:${layout.id}:sector-${options.sectorIndex}`,
    definitionId: definition.id,
    layoutId: layout.id,
    layoutLabel: layout.label,
    name: definition.name,
    kind: definition.kind,
    anchorDistance,
    safeLane: layout.safeLane,
    bossLock: definition.bossLock,
    approachPressure: definition.approachPressure,
    reinforcement: {
      ...definition.reinforcement,
      xRatios: layout.reinforcementXRatios
    },
    caps: definition.caps
  };
}

export function fitSetPiecePlanToScroll(
  plan: SetPiecePlan | null,
  scrollLength: number,
  bossArena: BossArenaPlan | null = null
): SetPiecePlan | null {
  if (!plan) {
    return null;
  }

  const definition = getSetPieceById(plan.definitionId);
  const anchorDistance = getSetPieceAnchorDistance(definition, scrollLength, bossArena);

  return anchorDistance === plan.anchorDistance ? plan : { ...plan, anchorDistance };
}

export function createSetPieceState(
  plan: SetPiecePlan | null,
  ownerFactionId?: FactionId
): SetPieceState | null {
  if (!plan) {
    return null;
  }

  const definition = getSetPieceById(plan.definitionId);
  const layout = getSetPieceLayoutById(definition, plan.layoutId);
  const placementByComponentId = new Map(
    layout.componentPlacements.map((placement) => [placement.componentId, placement])
  );
  const components = definition.components.map((component): SetPieceComponentState => {
    const template = getSetPieceComponentTemplate(component.templateId);
    const placement = placementByComponentId.get(component.id);

    if (!placement) {
      throw new Error(`Set-piece layout ${definition.id}/${layout.id} is missing ${component.id}.`);
    }

    return {
      id: component.id,
      templateId: component.templateId,
      kind: template.kind,
      x: placement.x,
      y: placement.y,
      distance: plan.anchorDistance,
      collisionShape: template.collision.shape,
      width: template.collision.width,
      height: template.collision.height,
      radius: template.collision.radius,
      blocksMovement: template.collision.blocksMovement,
      contactDamage: template.collision.contactDamage,
      stageId: component.stageId,
      dependsOn: component.dependsOn,
      objectiveTarget: component.objectiveTarget,
      maxHull: template.hull,
      armor: template.armor,
      allowedDamageSources: template.allowedDamageSources,
      hull: template.hull,
      targetable: component.dependsOn.length === 0,
      destroyed: false,
      rewardClaimed: false,
      hitFlashSeconds: 0,
      hazardCooldownSeconds: 0,
      subsystemCooldownSeconds: template.kind === 'turret' ? 0.6 : 0,
      subsystemTriggered: false
    };
  });

  return {
    plan,
    ownerFactionId: ownerFactionId ?? definition.factionId,
    components,
    currentStageIndex: 0,
    completedStageIds: [],
    claimedEventIds: [],
    eventLog: [],
    reinforcementsTriggered: false,
    completed: false
  };
}

export function updateSetPieceState(state: SetPieceState, dt: number): void {
  for (const component of state.components) {
    component.hitFlashSeconds = Math.max(0, component.hitFlashSeconds - dt);
    component.hazardCooldownSeconds = Math.max(0, component.hazardCooldownSeconds - dt);
    component.subsystemCooldownSeconds = Math.max(0, component.subsystemCooldownSeconds - dt);
  }
}

export function getSetPieceComponentScreenY(
  scrollDistance: number,
  component: Pick<SetPieceComponentState, 'y' | 'distance'>
): number {
  return component.y + scrollDistance - component.distance;
}

export function getSetPieceEngagementDistance(plan: SetPiecePlan): number {
  return Math.max(0, plan.anchorDistance - SET_PIECE_ENGAGEMENT_LEAD_DISTANCE);
}

export function getSetPieceApproachClearDistance(plan: SetPiecePlan): number | null {
  if (plan.approachPressure !== 'clear') {
    return null;
  }

  const definition = getSetPieceById(plan.definitionId);
  const layout = getSetPieceLayoutById(definition, plan.layoutId);
  const componentById = new Map(
    definition.components.map((component) => [component.id, component])
  );
  const assemblyLeadingEdge = layout.componentPlacements.reduce((leadingEdge, placement) => {
    const component = componentById.get(placement.componentId);
    if (!component) {
      return leadingEdge;
    }

    const template = getSetPieceComponentTemplate(component.templateId);
    return Math.max(leadingEdge, placement.y + getCollisionHalfHeight(template.collision));
  }, 0);

  return Math.max(
    0,
    Math.floor(plan.anchorDistance - assemblyLeadingEdge - SET_PIECE_APPROACH_CLEARANCE)
  );
}

export function getSetPieceApproachTravelLimit(
  plan: SetPiecePlan,
  options: {
    readonly completed: boolean;
    readonly scrollDistance: number;
    readonly hasPressure: boolean;
  }
): number | null {
  if (options.completed || !options.hasPressure) {
    return null;
  }

  const clearDistance = getSetPieceApproachClearDistance(plan);
  return clearDistance !== null && options.scrollDistance <= clearDistance ? clearDistance : null;
}

export function getSetPieceLayoutBottomRecoveryHeight(
  definition: SetPieceDefinition,
  layout: SetPieceLayoutDefinition
): number {
  const componentById = new Map(
    definition.components.map((component) => [component.id, component])
  );
  const lowestCollisionEdge = layout.componentPlacements.reduce((lowest, placement) => {
    const component = componentById.get(placement.componentId);
    if (!component) {
      return lowest;
    }

    const template = getSetPieceComponentTemplate(component.templateId);
    return Math.max(
      lowest,
      placement.y - SET_PIECE_ENGAGEMENT_LEAD_DISTANCE + getCollisionHalfHeight(template.collision)
    );
  }, 0);

  return COMBAT_ARENA_HEIGHT - lowestCollisionEdge - SET_PIECE_SCROLL_LOCK_OVERSHOOT_ALLOWANCE;
}

export function getActiveSetPieceComponents(
  state: SetPieceState | null,
  scrollDistance: number
): SetPieceComponentState[] {
  if (!state) {
    return [];
  }

  return state.components.filter((component) => {
    const y = getSetPieceComponentScreenY(scrollDistance, component);
    const extent = component.collisionShape === 'circle' ? component.radius : component.height / 2;

    return (
      !component.destroyed &&
      y >= -extent - ACTIVE_LEAD_DISTANCE &&
      y <= COMBAT_ARENA_HEIGHT + extent + ACTIVE_TRAIL_DISTANCE
    );
  });
}

export function getSetPieceComponentScreenState(
  scrollDistance: number,
  component: SetPieceComponentState
): SetPieceComponentState {
  return { ...component, y: getSetPieceComponentScreenY(scrollDistance, component) };
}

export function damageSetPieceComponent(
  state: SetPieceState,
  componentId: string,
  source: SetPieceDamageSource,
  rawDamage: number
): readonly SetPieceRuntimeEvent[] {
  const component = state.components.find((candidate) => candidate.id === componentId);

  if (
    !component ||
    component.destroyed ||
    !component.targetable ||
    rawDamage <= 0 ||
    !component.allowedDamageSources.includes(source) ||
    (source === 'hazard' && component.hazardCooldownSeconds > 0)
  ) {
    return [];
  }

  if (source === 'hazard') {
    component.hazardCooldownSeconds = HAZARD_COOLDOWN_SECONDS;
  }

  const previousEventCount = state.eventLog.length;
  const armorMultiplier = source === 'bomb' || source === 'special' ? 0.18 : 0.34;
  component.hull = Math.max(
    0,
    component.hull - Math.max(0.1, rawDamage - component.armor * armorMultiplier)
  );
  component.hitFlashSeconds = 0.16;

  if (component.hull <= 0) {
    destroyComponent(state, component);
  }

  return state.eventLog.slice(previousEventCount);
}

export function damageSetPieceComponentsInRadius(
  state: SetPieceState | null,
  scrollDistance: number,
  x: number,
  y: number,
  radius: number,
  source: SetPieceDamageSource,
  damage: number
): readonly SetPieceRuntimeEvent[] {
  if (!state) {
    return [];
  }

  const targetableIds = new Set(
    getActiveSetPieceComponents(state, scrollDistance)
      .filter((component) => component.targetable)
      .map((component) => component.id)
  );

  return getActiveSetPieceComponents(state, scrollDistance).flatMap((component) =>
    targetableIds.has(component.id) &&
    setPieceComponentOverlapsCircle(scrollDistance, component, x, y, radius)
      ? damageSetPieceComponent(state, component.id, source, damage)
      : []
  );
}

export function damageSetPieceComponentsInRect(
  state: SetPieceState | null,
  scrollDistance: number,
  rect: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  },
  source: SetPieceDamageSource,
  damage: number
): readonly SetPieceRuntimeEvent[] {
  if (!state) {
    return [];
  }

  const targetableIds = new Set(
    getActiveSetPieceComponents(state, scrollDistance)
      .filter((component) => component.targetable)
      .map((component) => component.id)
  );

  return getActiveSetPieceComponents(state, scrollDistance).flatMap((component) =>
    targetableIds.has(component.id) &&
    setPieceComponentOverlapsRect(scrollDistance, component, rect)
      ? damageSetPieceComponent(state, component.id, source, damage)
      : []
  );
}

export function setPieceComponentOverlapsCircle(
  scrollDistance: number,
  component: SetPieceComponentState,
  x: number,
  y: number,
  radius: number
): boolean {
  const componentY = getSetPieceComponentScreenY(scrollDistance, component);

  if (component.collisionShape === 'circle') {
    const dx = x - component.x;
    const dy = y - componentY;
    const radiusSum = radius + component.radius;
    return dx * dx + dy * dy <= radiusSum * radiusSum;
  }

  const rect = getSetPieceComponentRect(scrollDistance, component);
  const nearestX = clamp(x, rect.left, rect.right);
  const nearestY = clamp(y, rect.top, rect.bottom);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function setPieceComponentOverlapsRect(
  scrollDistance: number,
  component: SetPieceComponentState,
  rect: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  }
): boolean {
  const componentRect = getSetPieceComponentRect(scrollDistance, component);
  return (
    componentRect.left <= rect.right &&
    componentRect.right >= rect.left &&
    componentRect.top <= rect.bottom &&
    componentRect.bottom >= rect.top
  );
}

export function getSetPieceComponentRect(
  scrollDistance: number,
  component: SetPieceComponentState
): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const y = getSetPieceComponentScreenY(scrollDistance, component);
  const halfWidth = component.collisionShape === 'circle' ? component.radius : component.width / 2;
  const halfHeight =
    component.collisionShape === 'circle' ? component.radius : component.height / 2;
  return {
    left: component.x - halfWidth,
    top: y - halfHeight,
    right: component.x + halfWidth,
    bottom: y + halfHeight
  };
}

export function drainSetPieceEvents(state: SetPieceState | null): SetPieceRuntimeEvent[] {
  if (!state || state.eventLog.length === 0) {
    return [];
  }

  const events = [...state.eventLog];
  state.eventLog = [];
  return events;
}

export function isSetPieceBossLockReleased(state: SetPieceState | null): boolean {
  return !state || state.plan.bossLock === 'none' || state.completed;
}

export function getSetPieceReadModel(state: SetPieceState | null): SetPieceReadModel | null {
  if (!state) {
    return null;
  }

  const definition = getSetPieceById(state.plan.definitionId);
  const stage = definition.stages[state.currentStageIndex] ?? null;
  const targets = state.components.filter((component) => component.objectiveTarget);
  const currentTarget = state.completed
    ? null
    : (state.components.find(
        (component) => component.objectiveTarget && component.targetable && !component.destroyed
      ) ?? state.components.find((component) => component.targetable && !component.destroyed));
  const targetTemplate = currentTarget
    ? getSetPieceComponentTemplate(currentTarget.templateId)
    : null;

  return {
    active: !state.completed,
    name: definition.name,
    stageLabel: state.completed ? 'Assembly neutralized' : (stage?.label ?? 'Final separation'),
    beat: state.completed ? 'complete' : (stage?.beat ?? 'destruction'),
    targetLabel: targetTemplate?.name ?? 'No remaining target',
    destroyedComponents: state.components.filter((component) => component.destroyed).length,
    totalComponents: state.components.length,
    objectiveTargetsDestroyed: targets.filter((component) => component.destroyed).length,
    objectiveTargetsTotal: targets.length,
    layoutLabel: state.plan.layoutLabel,
    safeLaneLabel: state.plan.safeLane.label,
    bossLockActive: state.plan.bossLock === 'untilComplete' && !state.completed
  };
}

export function getSetPieceDebugJumpDistance(plan: SetPiecePlan | null): number | null {
  return plan ? Math.max(0, getSetPieceEngagementDistance(plan) - 120) : null;
}

export function createSetPieceReinforcementSpawns(
  plan: SetPiecePlan | null
): readonly EnemySpawn[] {
  if (!plan) {
    return [];
  }

  const definition = getSetPieceById(plan.definitionId);
  const formation = plan.reinforcement;
  const memberCount = Math.min(
    formation.memberCount,
    formation.xRatios.length,
    definition.caps.reinforcementEnemies
  );

  return formation.xRatios.slice(0, memberCount).map((xRatio, index) => ({
    atSeconds: 0,
    atDistance: Math.max(0, plan.anchorDistance - 135 + index * 12),
    waveIndex: 900,
    waveLabel: `${definition.name} hangar screen`,
    xRatio,
    targetY: 126 + index * 24,
    hull: 2,
    fireDelay: 1.1 + index * 0.08,
    factionId: definition.factionId,
    formationId: formation.formationId,
    formationInstanceId: `${plan.id}:reinforcement`,
    formationLabel: `${definition.name} ${formation.formationId}`,
    formationMemberIndex: index,
    formationMemberCount: memberCount
  }));
}

export interface SetPieceForwardFireLane {
  readonly minX: number;
  readonly maxX: number;
}

export function getSetPieceForwardFireLane(
  definition: SetPieceDefinition,
  layout: SetPieceLayoutDefinition,
  targetComponentId: string,
  projectileRadius = FORWARD_FIRE_PROJECTILE_RADIUS
): SetPieceForwardFireLane | null {
  const componentById = new Map(
    definition.components.map((component) => [component.id, component])
  );
  const placementById = new Map(
    layout.componentPlacements.map((placement) => [placement.componentId, placement])
  );
  const target = componentById.get(targetComponentId);
  const targetPlacement = placementById.get(targetComponentId);

  if (!target || !targetPlacement) {
    return null;
  }

  const destroyedBeforeTarget = new Set<string>();
  const collectDependencies = (componentId: string): void => {
    for (const dependencyId of componentById.get(componentId)?.dependsOn ?? []) {
      if (!destroyedBeforeTarget.has(dependencyId)) {
        destroyedBeforeTarget.add(dependencyId);
        collectDependencies(dependencyId);
      }
    }
  };
  collectDependencies(targetComponentId);

  const targetTemplate = getSetPieceComponentTemplate(target.templateId);
  const targetHalfWidth = getCollisionHalfWidth(targetTemplate.collision);
  const targetHalfHeight = getCollisionHalfHeight(targetTemplate.collision);
  const targetBottom = targetPlacement.y + targetHalfHeight;
  if (targetBottom > COMBAT_ARENA_HEIGHT - FORWARD_FIRE_PLAYER_EDGE_CLEARANCE) {
    return null;
  }
  const candidate: SetPieceForwardFireLane = {
    minX: Math.max(
      FORWARD_FIRE_PLAYER_EDGE_CLEARANCE,
      targetPlacement.x - targetHalfWidth - projectileRadius
    ),
    maxX: Math.min(
      COMBAT_ARENA_WIDTH - FORWARD_FIRE_PLAYER_EDGE_CLEARANCE,
      targetPlacement.x + targetHalfWidth + projectileRadius
    )
  };

  if (candidate.maxX - candidate.minX < MIN_FORWARD_FIRE_LANE_WIDTH) {
    return null;
  }

  const blockedIntervals = definition.components.flatMap((component) => {
    if (component.id === targetComponentId || destroyedBeforeTarget.has(component.id)) {
      return [];
    }

    const placement = placementById.get(component.id);
    if (!placement) {
      return [];
    }

    const template = getSetPieceComponentTemplate(component.templateId);
    const halfHeight = getCollisionHalfHeight(template.collision);
    if (placement.y + halfHeight <= targetBottom) {
      return [];
    }

    const halfWidth = getCollisionHalfWidth(template.collision);
    const minX = Math.max(candidate.minX, placement.x - halfWidth - projectileRadius);
    const maxX = Math.min(candidate.maxX, placement.x + halfWidth + projectileRadius);
    return maxX > minX ? [{ minX, maxX }] : [];
  });

  const merged = [...blockedIntervals]
    .sort((left, right) => left.minX - right.minX)
    .reduce<SetPieceForwardFireLane[]>((intervals, interval) => {
      const previous = intervals[intervals.length - 1];
      if (!previous || interval.minX > previous.maxX) {
        intervals.push(interval);
      } else {
        intervals[intervals.length - 1] = {
          minX: previous.minX,
          maxX: Math.max(previous.maxX, interval.maxX)
        };
      }
      return intervals;
    }, []);

  let cursor = candidate.minX;
  let best: SetPieceForwardFireLane | null = null;
  const consider = (minX: number, maxX: number): void => {
    if (
      maxX - minX >= MIN_FORWARD_FIRE_LANE_WIDTH &&
      (!best || maxX - minX > best.maxX - best.minX)
    ) {
      best = { minX, maxX };
    }
  };

  for (const interval of merged) {
    consider(cursor, interval.minX);
    cursor = Math.max(cursor, interval.maxX);
  }
  consider(cursor, candidate.maxX);
  return best;
}

export function validateSetPieceContent(
  definitions: readonly SetPieceDefinition[] = SET_PIECES
): SetPieceValidationResult {
  const errors: string[] = [];
  const templateUse = new Map<string, number>();
  const validatedTemplateIds = new Set<string>();
  const definitionIds = new Set<string>();
  const factionIds = new Set(FACTIONS.map((faction) => faction.id));
  const formationIds = new Set<string>(ENEMY_FORMATION_IDS);

  if (definitions.length < 3) {
    errors.push('At least three set-piece definitions are required.');
  }

  for (const definition of definitions) {
    const owner = `Set piece ${definition.id}`;
    const componentIds = new Set(definition.components.map((component) => component.id));
    const stageIds = new Set(definition.stages.map((stage) => stage.id));

    if (definitionIds.has(definition.id)) {
      errors.push(`Duplicate set-piece id: ${definition.id}.`);
    }
    definitionIds.add(definition.id);

    if (componentIds.size !== definition.components.length) {
      errors.push(`${owner} has duplicate component ids.`);
    }

    if (stageIds.size !== definition.stages.length) {
      errors.push(`${owner} has duplicate stage ids.`);
    }

    if (!factionIds.has(definition.factionId)) {
      errors.push(`${owner} references unknown faction ${definition.factionId}.`);
    }

    if (!formationIds.has(definition.reinforcement.formationId)) {
      errors.push(`${owner} references unknown formation ${definition.reinforcement.formationId}.`);
    }

    if (definition.reinforcement.trigger === 'none' && definition.reinforcement.memberCount !== 0) {
      errors.push(`${owner} disabled reinforcement must have zero members.`);
    }

    if (definition.reinforcement.trigger !== 'none' && definition.reinforcement.memberCount <= 0) {
      errors.push(`${owner} active reinforcement must have at least one member.`);
    }

    if (
      definition.reinforcement.trigger === 'hangar' &&
      !definition.components.some(
        (component) => getSetPieceComponentTemplate(component.templateId).kind === 'hangar'
      )
    ) {
      errors.push(`${owner} hangar reinforcement requires a hangar component.`);
    }

    if (
      definition.reinforcement.trigger === 'stage' &&
      (!definition.reinforcement.triggerStageId ||
        !stageIds.has(definition.reinforcement.triggerStageId))
    ) {
      errors.push(`${owner} stage reinforcement references an unknown trigger stage.`);
    }

    if (
      definition.stages.length !== 3 ||
      definition.stages[0]?.beat !== 'exterior' ||
      definition.stages[1]?.beat !== 'interior' ||
      definition.stages[2]?.beat !== 'destruction'
    ) {
      errors.push(`${owner} must define exterior, interior, and destruction stages in order.`);
    }

    for (const component of definition.components) {
      templateUse.set(component.templateId, (templateUse.get(component.templateId) ?? 0) + 1);
      if (!validatedTemplateIds.has(component.templateId)) {
        validatedTemplateIds.add(component.templateId);
        const template = getSetPieceComponentTemplate(component.templateId);
        if (
          !Number.isInteger(template.collision.contactDamage) ||
          template.collision.contactDamage < 0
        ) {
          errors.push(
            `Set-piece template ${component.templateId} contact damage must be a non-negative integer.`
          );
        }
      }
      if (!stageIds.has(component.stageId)) {
        errors.push(
          `${owner} component ${component.id} references unknown stage ${component.stageId}.`
        );
      }

      for (const dependencyId of component.dependsOn) {
        if (!componentIds.has(dependencyId) || dependencyId === component.id) {
          errors.push(`${owner} component ${component.id} has invalid dependency ${dependencyId}.`);
        }
      }
    }

    const layoutIds = new Set<string>();
    if (definition.layouts.length < 3) {
      errors.push(`${owner} must define at least three seeded layouts.`);
    }

    for (const layout of definition.layouts) {
      const layoutOwner = `${owner} layout ${layout.id}`;
      const placementIds = new Set(
        layout.componentPlacements.map((placement) => placement.componentId)
      );

      if (layoutIds.has(layout.id)) {
        errors.push(`${owner} has duplicate layout id ${layout.id}.`);
      }
      layoutIds.add(layout.id);

      if (layout.safeLane.maxX - layout.safeLane.minX < MIN_SAFE_LANE_WIDTH) {
        errors.push(`${layoutOwner} safe lane must be at least ${MIN_SAFE_LANE_WIDTH}px wide.`);
      }

      if (layout.safeLane.minX < 0 || layout.safeLane.maxX > COMBAT_ARENA_WIDTH) {
        errors.push(
          `${layoutOwner} safe lane must remain inside the ${COMBAT_ARENA_WIDTH}px arena.`
        );
      }

      if (
        placementIds.size !== layout.componentPlacements.length ||
        layout.componentPlacements.length !== definition.components.length
      ) {
        errors.push(`${layoutOwner} must place every component exactly once.`);
      }

      for (const placement of layout.componentPlacements) {
        const component = definition.components.find(
          (candidate) => candidate.id === placement.componentId
        );
        if (!component) {
          errors.push(`${layoutOwner} places unknown component ${placement.componentId}.`);
          continue;
        }

        const template = getSetPieceComponentTemplate(component.templateId);
        const extentX = getCollisionHalfWidth(template.collision);
        const extentY = getCollisionHalfHeight(template.collision);
        if (placement.x - extentX < 0 || placement.x + extentX > COMBAT_ARENA_WIDTH) {
          errors.push(`${layoutOwner} component ${component.id} leaves the fixed arena.`);
        }

        if (placement.y - extentY < 0 || placement.y + extentY > COMBAT_ARENA_HEIGHT) {
          errors.push(
            `${layoutOwner} component ${component.id} leaves the fixed arena vertically.`
          );
        }

        if (placement.y - SET_PIECE_ENGAGEMENT_LEAD_DISTANCE - extentY < 0) {
          errors.push(
            `${layoutOwner} component ${component.id} leaves the fixed arena at its engagement stop.`
          );
        }

        if (
          placement.x + extentX > layout.safeLane.minX &&
          placement.x - extentX < layout.safeLane.maxX
        ) {
          errors.push(`${layoutOwner} component ${component.id} intrudes on its safe lane.`);
        }
      }

      if (
        getSetPieceLayoutBottomRecoveryHeight(definition, layout) < SET_PIECE_BOTTOM_RECOVERY_HEIGHT
      ) {
        errors.push(
          `${layoutOwner} must retain at least ${SET_PIECE_BOTTOM_RECOVERY_HEIGHT}px of bottom recovery room at its engagement stop.`
        );
      }

      for (const component of definition.components.filter(
        (candidate) => candidate.objectiveTarget
      )) {
        if (!getSetPieceForwardFireLane(definition, layout, component.id)) {
          errors.push(`${layoutOwner} leaves no forward-fire lane to ${component.id}.`);
        }
      }

      if (
        layout.reinforcementXRatios.length < definition.reinforcement.memberCount ||
        layout.reinforcementXRatios.some((ratio) => ratio <= 0 || ratio >= 1)
      ) {
        errors.push(`${layoutOwner} has invalid reinforcement positions.`);
      }
    }

    for (const stage of definition.stages) {
      if (stage.requiredComponentIds.length === 0) {
        errors.push(`${owner} stage ${stage.id} must require a component.`);
      }

      for (const componentId of stage.requiredComponentIds) {
        if (!componentIds.has(componentId)) {
          errors.push(`${owner} stage ${stage.id} references unknown component ${componentId}.`);
        }
      }
    }

    if (hasDependencyCycle(definition)) {
      errors.push(`${owner} component dependency graph contains a cycle.`);
    }

    if (definition.reinforcement.memberCount > definition.caps.reinforcementEnemies) {
      errors.push(`${owner} reinforcement count exceeds its actor cap.`);
    }

    if (
      definition.caps.projectiles <= 0 ||
      definition.caps.debris <= 0 ||
      definition.caps.effects <= 0 ||
      definition.caps.rewardPickups <= 0
    ) {
      errors.push(`${owner} must define positive projectile, debris, effect, and reward caps.`);
    }
  }

  const reusedTemplateCount = [...templateUse.values()].filter((count) => count >= 2).length;
  if (reusedTemplateCount < 4) {
    errors.push('Set pieces must share at least four reusable component templates.');
  }

  return { valid: errors.length === 0, errors };
}

function destroyComponent(state: SetPieceState, component: SetPieceComponentState): void {
  if (component.destroyed) {
    return;
  }

  const definition = getSetPieceById(state.plan.definitionId);
  const template = getSetPieceComponentTemplate(component.templateId);
  component.destroyed = true;
  component.targetable = false;
  component.hull = 0;

  appendEvent(state, {
    id: `${state.plan.id}:component:${component.id}`,
    type: 'componentDestroyed',
    label: `${template.name} destroyed`,
    x: component.x,
    y: component.y,
    credits: template.reward.credits,
    salvage: template.reward.salvage,
    componentId: component.id,
    stageId: component.stageId,
    beat: null
  });
  component.rewardClaimed = true;

  for (const candidate of state.components) {
    if (!candidate.destroyed) {
      const wasTargetable = candidate.targetable;
      candidate.targetable = candidate.dependsOn.every((dependencyId) =>
        state.components.some((other) => other.id === dependencyId && other.destroyed)
      );

      if (!wasTargetable && candidate.targetable) {
        candidate.subsystemCooldownSeconds =
          candidate.kind === 'hangar' ? 0.75 : candidate.kind === 'turret' ? 0.45 : 0;
      }
    }
  }

  while (state.currentStageIndex < definition.stages.length) {
    const stage = definition.stages[state.currentStageIndex];
    if (!stage || !stage.requiredComponentIds.every((id) => isComponentDestroyed(state, id))) {
      break;
    }

    state.completedStageIds.push(stage.id);
    appendEvent(state, {
      id: `${state.plan.id}:stage:${stage.id}`,
      type: 'stageCompleted',
      label: stage.label,
      x: component.x,
      y: component.y,
      credits: stage.reward.credits,
      salvage: stage.reward.salvage,
      componentId: null,
      stageId: stage.id,
      beat: stage.beat
    });
    state.currentStageIndex += 1;
  }

  if (!state.completed && state.currentStageIndex >= definition.stages.length) {
    state.completed = true;
    appendEvent(state, {
      id: `${state.plan.id}:complete`,
      type: 'setPieceCompleted',
      label: `${definition.name} neutralized`,
      x: component.x,
      y: component.y,
      credits: definition.completionReward.credits,
      salvage: definition.completionReward.salvage,
      componentId: null,
      stageId: null,
      beat: 'destruction'
    });
  }
}

function appendEvent(state: SetPieceState, event: SetPieceRuntimeEvent): void {
  if (state.claimedEventIds.includes(event.id)) {
    return;
  }

  state.claimedEventIds.push(event.id);
  state.eventLog.push(event);
}

function isComponentDestroyed(state: SetPieceState, componentId: string): boolean {
  return state.components.some((component) => component.id === componentId && component.destroyed);
}

function getCollisionHalfWidth(collision: SetPieceComponentTemplate['collision']): number {
  return collision.shape === 'circle' ? collision.radius : collision.width / 2;
}

function getSetPieceAnchorDistance(
  definition: SetPieceDefinition,
  scrollLength: number,
  bossArena: BossArenaPlan | null
): number {
  const ratioDistance = Math.round(scrollLength * definition.anchorDistanceRatio);
  return definition.bossLock === 'untilComplete' && bossArena
    ? Math.round(bossArena.lockDistance)
    : clamp(ratioDistance, 260, Math.max(260, scrollLength - 360));
}

function getCollisionHalfHeight(collision: SetPieceComponentTemplate['collision']): number {
  return collision.shape === 'circle' ? collision.radius : collision.height / 2;
}

function hasDependencyCycle(definition: SetPieceDefinition): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(definition.components.map((component) => [component.id, component]));

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return definition.components.some((component) => visit(component.id));
}
