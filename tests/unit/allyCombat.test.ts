import { describe, expect, it } from 'vitest';

import {
  createCombatRunResult,
  createCombatState,
  issueCrewCommand,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import type { CrewCombatProfile } from '../../src/game/CrewCommand';
import type { FleetCombatProfile } from '../../src/game/Fleetcraft';
import { createSetPiecePlan } from '../../src/game/SetPiece';

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

  it('lets crew and support craft dismantle targetable set-piece components in dependency order', () => {
    const setPiecePlan = createSetPiecePlan({ sectorIndex: 1, scrollLength: 2400 });
    const state = createCombatState(bounds, 'ALLY-SET-PIECE', {
      crew: createCrewProfile(),
      fleet: createFleetProfile(),
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null,
      setPiecePlan
    });
    state.scrollDistance = setPiecePlan?.anchorDistance ?? 0;
    for (const component of state.setPiece?.components ?? []) {
      component.hull = 1;
      component.subsystemCooldownSeconds = 99;
    }

    const crew = state.allies.find((ally) => ally.source === 'crew')!;
    const craft = state.allies.find((ally) => ally.source === 'fleet')!;
    const armor = requireSetPieceComponent(state, 'hecaton-armor');
    expect(armor.targetable).toBe(false);

    fireAllyAtComponent(state, crew, craft, 'hecaton-emitter-a');
    fireAllyAtComponent(state, craft, crew, 'hecaton-emitter-b');
    expect(armor.targetable).toBe(true);

    for (const [ally, waitingAlly, componentId] of [
      [crew, craft, 'hecaton-turret'],
      [craft, crew, 'hecaton-armor'],
      [crew, craft, 'hecaton-hangar'],
      [craft, crew, 'hecaton-drive'],
      [crew, craft, 'hecaton-core']
    ] as const) {
      fireAllyAtComponent(state, ally, waitingAlly, componentId);
    }

    expect(state.setPiece?.completed).toBe(true);
    expect(state.stats.setPieceComponentsDestroyed).toBe(7);
    expect(state.stats.setPieceStagesCompleted).toBe(3);
    expect(state.stats.setPiecesCompleted).toBe(1);
    expect(state.stats.environmentObjectsDestroyed).toBe(7);
    expect(state.stats.enemiesDestroyed).toBe(0);
    expect(state.stats.allyProjectilesFired).toBe(7);
  });

  it('focuses a visible set-piece target before a nearer standard enemy', () => {
    const setPiecePlan = createSetPiecePlan({ sectorIndex: 1, scrollLength: 2400 });
    const state = createCombatState(bounds, 'ALLY-SET-PIECE-FOCUS', {
      crew: createCrewProfile(),
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null,
      setPiecePlan
    });
    state.scrollDistance = setPiecePlan?.anchorDistance ?? 0;
    const ally = state.allies[0]!;
    state.enemies.push(createEnemy(ally.x + 60, ally.y));

    updateCombatState(state, idleInput(state.scrollDistance), 0, bounds);

    expect(state.enemies).toHaveLength(1);
    expect(state.projectiles).toHaveLength(1);
    expect(state.projectiles[0]).toMatchObject({ owner: 'ally', allyId: ally.candidateId });
    expect(state.projectiles[0]!.vy).toBeLessThan(0);
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

function createFleetProfile(): FleetCombatProfile {
  return {
    doctrine: 'focus',
    readyCraft: 1,
    deployedCraft: 1,
    berthCapacity: 1,
    allySlotCapacity: 1,
    overflowCraftIds: [],
    members: [
      {
        craftId: 'craft:test',
        callsign: 'Anvil Kite',
        role: 'Interceptor',
        trait: 'Test support craft',
        preferredCommand: 'focus',
        maxHull: 3,
        moveSpeed: 200,
        fireCooldownSeconds: 0.5,
        projectileDamage: 3,
        fitLabel: 'Fleet test',
        cue: { glyph: 'K', color: '#ffcf78', highContrastGlyph: 'ALLY-K' }
      }
    ]
  };
}

function fireAllyAtComponent(
  state: ReturnType<typeof createCombatState>,
  firingAlly: ReturnType<typeof createCombatState>['allies'][number],
  waitingAlly: ReturnType<typeof createCombatState>['allies'][number],
  componentId: string
): void {
  const component = requireSetPieceComponent(state, componentId);
  expect(component.targetable).toBe(true);
  firingAlly.x = component.x;
  firingAlly.y = component.y;
  firingAlly.fireCooldown = 0;
  waitingAlly.fireCooldown = 99;

  updateCombatState(state, idleInput(state.scrollDistance), 0, bounds);

  expect(component.destroyed).toBe(true);
}

function requireSetPieceComponent(
  state: ReturnType<typeof createCombatState>,
  componentId: string
) {
  const component = state.setPiece?.components.find((candidate) => candidate.id === componentId);
  if (!component) throw new Error(`Expected component ${componentId}.`);
  return component;
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

function idleInput(scrollDistance = 0) {
  return { movement: { x: 0, y: 0 }, fire: false, scrollDistance };
}
