import { clamp } from '../core/math';
import { getHazardZoneDefinition } from '../content/hazardZones';
import {
  applyPlayerDamage,
  damageCombatActorsByHazard,
  damageEnvironmentObjectsInRadius,
  damageEnvironmentObjectsInRect,
  damageSetPieceComponentsInRadius,
  damageSetPieceComponentsInRect,
  type CombatBounds,
  type CombatState,
  type PlayerState
} from './CombatState';
import {
  getActiveSectorHazards,
  getSectorHazardCollisionRect,
  getSectorHazardDamageRects,
  type ActiveSectorHazard,
  type SectorHazardActivationOptions,
  type SectorHazardCollisionRect,
  type SectorFeaturePlan,
  type SectorHazardPlan
} from './SectorFeatures';
import { circleOverlapsBeamSegment, getActiveBeamBoltSegment } from './BeamHazard';
import { createMeteorStormGeometry, type MeteorStormImpact } from './MeteorStorm';

export interface SectorHazardCollisionResult {
  readonly activeHazardIds: readonly string[];
  readonly damagingHazardIds: readonly string[];
  readonly hitHazardIds: readonly string[];
}

export function resolveSectorHazardCollisions(
  state: CombatState,
  plan: SectorFeaturePlan,
  distance: number,
  bounds: CombatBounds,
  options: SectorHazardActivationOptions = {}
): SectorHazardCollisionResult {
  const activeHazards = getActiveSectorHazards(plan, distance, options);
  const activeHazardIds = activeHazards.map((activeHazard) => activeHazard.hazard.id);
  const damagingHazardIds: string[] = [];
  const hitHazardIds: string[] = [];

  for (const activeHazard of activeHazards) {
    if (activeHazard.hazard.kind === 'mine_belt') {
      continue;
    }

    if (activeHazard.hazard.kind === 'salvage_storm') {
      const geometry = createMeteorStormGeometry(
        activeHazard,
        getSectorHazardCollisionRect(activeHazard.hazard, bounds)
      );
      if (geometry.damageImpacts.length === 0) {
        continue;
      }

      damagingHazardIds.push(activeHazard.hazard.id);
      for (const impact of geometry.damageImpacts) {
        damageEnvironmentObjectsInRadius(
          state,
          impact.x,
          impact.y,
          impact.radius,
          'hazard',
          activeHazard.hazard.damage
        );
        damageSetPieceComponentsInRadius(
          state,
          impact.x,
          impact.y,
          impact.radius,
          'hazard',
          activeHazard.hazard.damage
        );
      }

      const definition = getHazardZoneDefinition(activeHazard.hazard.kind);
      damageCombatActorsByHazard(
        state,
        activeHazard.hazard.id,
        activeHazard.hazard.damage,
        definition.damageCooldownSeconds,
        (target) =>
          geometry.damageImpacts.some((impact) => circleOverlapsMeteorImpact(target, impact))
      );

      if (
        geometry.damageImpacts.some((impact) =>
          circleOverlapsMeteorImpact(state.player, impact)
        )
      ) {
        applyHazardDamageToPlayer(state, activeHazard, hitHazardIds);
      }
      continue;
    }

    const damageRects = getSectorHazardDamageRects(activeHazard, bounds);

    if (damageRects.length === 0) {
      continue;
    }

    damagingHazardIds.push(activeHazard.hazard.id);

    for (const rect of damageRects) {
      damageEnvironmentObjectsInRect(state, rect, 'hazard', activeHazard.hazard.damage);
      damageSetPieceComponentsInRect(state, rect, 'hazard', activeHazard.hazard.damage);
    }

    if (activeHazard.hazard.kind === 'salvage_squall') {
      const definition = getHazardZoneDefinition(activeHazard.hazard.kind);
      for (const rect of damageRects) {
        damageCombatActorsByHazard(
          state,
          activeHazard.hazard.id,
          activeHazard.hazard.damage,
          definition.damageCooldownSeconds,
          (target) => circleOverlapsHazardRect(target, rect)
        );
      }
    }

    if (activeHazard.hazard.kind === 'warning_beam') {
      const segment = getActiveBeamBoltSegment(activeHazard, bounds);
      if (!segment) {
        continue;
      }
      const definition = getHazardZoneDefinition(activeHazard.hazard.kind);
      damageCombatActorsByHazard(
        state,
        activeHazard.hazard.id,
        activeHazard.hazard.damage,
        definition.damageCooldownSeconds,
        (target) => circleOverlapsBeamSegment(target, segment)
      );
    }

    if (!playerOverlapsActiveHazard(state.player, activeHazard, bounds)) {
      continue;
    }

    applyHazardDamageToPlayer(state, activeHazard, hitHazardIds);
  }

  return {
    activeHazardIds,
    damagingHazardIds,
    hitHazardIds
  };
}

export function playerOverlapsHazard(
  player: Pick<PlayerState, 'x' | 'y' | 'radius'>,
  hazard: SectorHazardPlan,
  bounds: CombatBounds
): boolean {
  const rect = getSectorHazardCollisionRect(hazard, bounds);
  const nearestX = clamp(player.x, rect.left, rect.right);
  const nearestY = clamp(player.y, rect.top, rect.bottom);
  const dx = player.x - nearestX;
  const dy = player.y - nearestY;

  return dx * dx + dy * dy <= player.radius * player.radius;
}

export function playerOverlapsActiveHazard(
  player: Pick<PlayerState, 'x' | 'y' | 'radius'>,
  activeHazard: ActiveSectorHazard,
  bounds: CombatBounds
): boolean {
  if (activeHazard.hazard.kind === 'salvage_storm') {
    const geometry = createMeteorStormGeometry(
      activeHazard,
      getSectorHazardCollisionRect(activeHazard.hazard, bounds)
    );
    return geometry.damageImpacts.some((impact) =>
      circleOverlapsMeteorImpact(player, impact)
    );
  }

  if (activeHazard.hazard.kind === 'warning_beam') {
    if (getSectorHazardDamageRects(activeHazard, bounds).length === 0) {
      return false;
    }

    const segment = getActiveBeamBoltSegment(activeHazard, bounds);
    return segment ? circleOverlapsBeamSegment(player, segment) : false;
  }

  return getSectorHazardDamageRects(activeHazard, bounds).some((rect) =>
    circleOverlapsHazardRect(player, rect)
  );
}

function applyHazardDamageToPlayer(
  state: CombatState,
  activeHazard: ActiveSectorHazard,
  hitHazardIds: string[]
): void {
  const outcome = applyPlayerDamage(state, activeHazard.hazard.damage);
  if (!outcome) return;

  state.player.invulnerableSeconds = Math.max(
    state.player.invulnerableSeconds,
    getHazardZoneDefinition(activeHazard.hazard.kind).damageCooldownSeconds
  );
  hitHazardIds.push(activeHazard.hazard.id);
}

function circleOverlapsMeteorImpact(
  circle: Pick<PlayerState, 'x' | 'y' | 'radius'>,
  impact: Pick<MeteorStormImpact, 'x' | 'y' | 'radius'>
): boolean {
  const dx = circle.x - impact.x;
  const dy = circle.y - impact.y;
  const radius = circle.radius + impact.radius;
  return dx * dx + dy * dy <= radius * radius;
}

function circleOverlapsHazardRect(
  player: Pick<PlayerState, 'x' | 'y' | 'radius'>,
  rect: SectorHazardCollisionRect
): boolean {
  const nearestX = clamp(player.x, rect.left, rect.right);
  const nearestY = clamp(player.y, rect.top, rect.bottom);
  const dx = player.x - nearestX;
  const dy = player.y - nearestY;

  return dx * dx + dy * dy <= player.radius * player.radius;
}
