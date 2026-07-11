import { describe, expect, it } from 'vitest';

import {
  createCombatRunResult,
  createCombatState,
  issueCrewCommand,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import type { CrewCombatProfile } from '../../src/game/CrewCommand';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('ally combat', () => {
  it('attributes focus fire through normal defeat accounting', () => {
    const state = createCombatState(bounds, 'ALLY-FOCUS', { crew: createCrewProfile() });
    const ally = state.allies[0]!;
    state.enemies.push(createEnemy(ally.x, ally.y - ally.radius));

    updateCombatState(state, idleInput(), 0, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(state.stats.allyEnemiesDestroyed).toBe(1);
    expect(ally.enemiesDefeated).toBe(1);
  });

  it('screens a bounded hostile projectile and respects command cooldown', () => {
    const state = createCombatState(bounds, 'ALLY-SCREEN', { crew: createCrewProfile() });
    const ally = state.allies[0]!;
    expect(issueCrewCommand(state, 'screen')).toBe(true);
    expect(issueCrewCommand(state, 'focus')).toBe(false);
    state.projectiles.push(enemyProjectile(ally.x, ally.y));

    updateCombatState(state, idleInput(), 0, bounds);

    expect(state.projectiles).toHaveLength(0);
    expect(state.stats.allyProjectilesScreened).toBe(1);
    expect(ally.hull).toBe(ally.maxHull);
  });

  it('collects salvage through centralized pickup and objective metrics', () => {
    const state = createCombatState(bounds, 'ALLY-SALVAGE', { crew: createCrewProfile('salvage') });
    const ally = state.allies[0]!;
    state.pickups.push({
      id: 800,
      kind: 'salvage',
      x: ally.x,
      y: ally.y,
      vx: 0,
      vy: 0,
      radius: 8,
      value: 3
    });
    issueCrewCommand(state, 'salvage');
    updateCombatState(state, idleInput(), 0, bounds);

    expect(state.pickups).toHaveLength(0);
    expect(state.player.salvage).toBe(3);
    expect(state.stats.pickupsCollected).toBe(1);
    expect(state.stats.allySalvageCollected).toBe(3);
  });

  it('records injury without damaging the player or corrupting run results', () => {
    const state = createCombatState(bounds, 'ALLY-INJURY', { crew: createCrewProfile() });
    const ally = state.allies[0]!;
    state.projectiles.push(enemyProjectile(ally.x, ally.y, 99));
    updateCombatState(state, idleInput(), 0, bounds);

    expect(ally.status).toBe('injured');
    expect(state.player.hull).toBe(state.player.maxHull);
    expect(state.stats.allyInjuries).toBe(1);
    expect(createCombatRunResult(state, 'sectorComplete').crew?.members[0]).toMatchObject({
      injured: true,
      retreated: false
    });
  });

  it('disengages deterministically without counting an injury or enemy escape', () => {
    const state = createCombatState(bounds, 'ALLY-DISENGAGE', {
      crew: createCrewProfile('disengage')
    });
    issueCrewCommand(state, 'disengage');
    for (let index = 0; index < 50; index += 1) {
      updateCombatState(state, idleInput(), 0.1, bounds);
    }

    expect(state.allies[0]?.status).toBe('retreated');
    expect(state.stats.allyRetreats).toBe(1);
    expect(state.stats.allyInjuries).toBe(0);
    expect(state.stats.enemiesEscaped).toBe(0);
  });
});

function createCrewProfile(
  preferredCommand: 'focus' | 'salvage' | 'disengage' = 'focus'
): CrewCombatProfile {
  return {
    commandHeadroom: 2,
    commandUsed: 1,
    overflowCandidateIds: [],
    members: [
      {
        candidateId: 'crew:test',
        name: 'Test Pilot',
        callsign: 'Lantern',
        roleId: 'crew_interceptor',
        role: 'Interceptor Pilot',
        trait: 'Test Vector',
        preferredCommand,
        commandCost: 1,
        maxHull: 3,
        moveSpeed: 200,
        fireCooldownSeconds: 0.5,
        projectileDamage: 2,
        fitLabel: 'Fit test',
        cue: { glyph: 'F', color: '#7cf7ff', highContrastGlyph: 'ALLY-F' }
      }
    ]
  };
}

function createEnemy(x: number, y: number) {
  return {
    id: 700,
    factionId: 'faction_scrap_court' as const,
    x,
    y,
    radius: 12,
    hull: 1,
    maxHull: 1,
    drift: 0,
    targetY: y,
    fireCooldown: 99
  };
}

function enemyProjectile(x: number, y: number, damage = 1) {
  return {
    id: 900,
    owner: 'enemy' as const,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 5,
    damage,
    ttl: 1,
    tags: ['plasma'] as const,
    procDepth: 0
  };
}

function idleInput() {
  return { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 0 };
}
