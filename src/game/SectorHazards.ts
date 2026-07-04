import { clamp } from '../core/math';
import {
  applyPlayerDamage,
  type CombatBounds,
  type CombatState,
  type PlayerState
} from './CombatState';
import {
  getActiveSectorHazards,
  getSectorHazardCollisionRect,
  type SectorFeaturePlan,
  type SectorHazardPlan
} from './SectorFeatures';

export interface SectorHazardCollisionResult {
  readonly activeHazardIds: readonly string[];
  readonly damagingHazardIds: readonly string[];
  readonly hitHazardIds: readonly string[];
}

export function resolveSectorHazardCollisions(
  state: CombatState,
  plan: SectorFeaturePlan,
  distance: number,
  bounds: CombatBounds
): SectorHazardCollisionResult {
  const activeHazards = getActiveSectorHazards(plan, distance);
  const activeHazardIds = activeHazards.map((activeHazard) => activeHazard.hazard.id);
  const damagingHazardIds: string[] = [];
  const hitHazardIds: string[] = [];

  for (const activeHazard of activeHazards) {
    if (activeHazard.phase !== 'active') {
      continue;
    }

    damagingHazardIds.push(activeHazard.hazard.id);

    if (!playerOverlapsHazard(state.player, activeHazard.hazard, bounds)) {
      continue;
    }

    const previousDamageTaken = state.stats.damageTaken;
    applyPlayerDamage(state, activeHazard.hazard.damage);

    if (state.stats.damageTaken > previousDamageTaken) {
      hitHazardIds.push(activeHazard.hazard.id);
    }
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
