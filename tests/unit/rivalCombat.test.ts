import { describe, expect, it } from 'vitest';

import {
  createCombatRunResult,
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import {
  applyFactionCampaignEvent,
  createFactionCampaignPlan,
  createFactionCampaignState,
  createRivalEnemySpawn,
  getFactionCampaignInfluence
} from '../../src/game/FactionCampaign';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createWaveDirectorPlan, getObjectiveProgress } from '../../src/game/WaveDirector';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('rival combat', () => {
  it('spawns a named optional actor whose first defeat becomes a retreat', () => {
    const fixture = createEngagedFixture('RIVAL-COMBAT-ESCAPE', 1);
    const spawn = createRivalEnemySpawn(fixture.influence, 1, 1600);
    if (!spawn) throw new Error('Expected rival spawn.');
    const state = createCombatState(bounds, 'RIVAL-COMBAT-ESCAPE', {
      spawnSchedule: [spawn],
      bossSpawnAtSeconds: null,
      sectorLength: 1600
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: spawn.atDistance ?? 0 },
      0,
      bounds
    );
    const rival = state.enemies[0];
    if (!rival) throw new Error('Expected active rival.');
    state.projectiles.push({
      id: 9999,
      owner: 'player',
      x: rival.x,
      y: rival.y,
      vx: 0,
      vy: 0,
      radius: 12,
      damage: 999,
      ttl: 1,
      tags: ['laser'],
      procDepth: 0,
      environmentDamageSource: 'weapon'
    });
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
      0,
      bounds
    );

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(0);
    expect(state.stats.enemiesEscaped).toBe(0);
    expect(state.stats.rivalsEscaped).toBe(1);
    expect(createCombatRunResult(state, 'sectorComplete').rivalEncounter).toMatchObject({
      name: fixture.influence.rival?.name,
      outcome: 'escaped'
    });
  });

  it('keeps a live rival out of support-field and required-kill accounting', () => {
    const run = generateRunSkeleton('RIVAL-OBJECTIVE-SAFETY');
    const sector = run.sectors[1]!;
    const wavePlan = createWaveDirectorPlan({
      seed: 'RIVAL-OBJECTIVE-SAFETY',
      objective: sector.objective,
      majorWaves: sector.majorWaves,
      preferredFactionId: sector.bossFactionId,
      scroll: sector.scroll
    });
    const state = createCombatState(bounds, 'RIVAL-OBJECTIVE-SAFETY', {
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null
    });
    state.enemies.push({
      id: 777,
      factionId: 'faction_scrap_court',
      x: 320,
      y: 120,
      radius: 24,
      hull: 10,
      maxHull: 10,
      drift: 0,
      targetY: 120,
      fireCooldown: 1,
      countsForObjective: false,
      rivalId: 'rival:test',
      rivalName: 'Marshal Test',
      rivalTitle: 'Wreck Duelist',
      rivalShipName: 'Test Crown',
      rivalTactic: 'ramFeint',
      rivalRetreatAtHullRatio: 0.3
    });
    state.nextSpawnIndex = wavePlan.spawnSchedule.length;
    state.stats = {
      ...state.stats,
      enemiesDestroyed: sector.objective.requiredEnemyKills
    };

    const progress = getObjectiveProgress(wavePlan, state);
    expect(progress.supportComplete).toBe(true);
    expect(progress.supportKills).toBe(sector.objective.requiredEnemyKills);
  });

  it('allows a later no-retreat appearance to be destroyed without normal rewards or kills', () => {
    const fixture = createEngagedFixture('RIVAL-COMBAT-DESTROY', 3);
    const spawn = createRivalEnemySpawn(fixture.influence, 7, 1800);
    if (!spawn) throw new Error('Expected rival spawn.');
    expect(spawn.rivalRetreatAtHullRatio).toBe(0);
    const state = createCombatState(bounds, 'RIVAL-COMBAT-DESTROY', {
      spawnSchedule: [spawn],
      bossSpawnAtSeconds: null,
      sectorLength: 1800
    });
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: spawn.atDistance ?? 0 },
      0,
      bounds
    );
    const rival = state.enemies[0]!;
    state.projectiles.push({
      id: 9998,
      owner: 'player',
      x: rival.x,
      y: rival.y,
      vx: 0,
      vy: 0,
      radius: 12,
      damage: 999,
      ttl: 1,
      tags: ['laser'],
      procDepth: 0,
      environmentDamageSource: 'weapon'
    });
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
      0,
      bounds
    );

    expect(state.stats.rivalsDestroyed).toBe(1);
    expect(state.stats.enemiesDestroyed).toBe(0);
    expect(state.pickups).toHaveLength(0);
    expect(createCombatRunResult(state, 'sectorComplete').rivalEncounter?.outcome).toBe(
      'destroyed'
    );
  });
});

function createEngagedFixture(seed: string, appearance: number) {
  const plan = createFactionCampaignPlan({ seed, saveFingerprint: 'fresh', sectorCount: 10 });
  const captain = plan.rivals[0]!;
  let state = createFactionCampaignState(plan);
  let sectorIndex = captain.firstSectorIndex;

  for (let index = 1; index <= appearance; index += 1) {
    state = applyFactionCampaignEvent(plan, state, {
      id: `encounter-${index}`,
      type: 'rivalEncounter',
      sectorIndex,
      factionId: captain.factionId,
      rivalId: captain.id
    }).state;
    if (index < appearance) {
      state = applyFactionCampaignEvent(plan, state, {
        id: `escape-${index}`,
        type: 'rivalOutcome',
        sectorIndex,
        factionId: captain.factionId,
        rivalId: captain.id,
        outcome: 'escaped'
      }).state;
      sectorIndex += captain.recurrenceGapSectors;
    }
  }

  const run = generateRunSkeleton(seed);
  const baseSector = run.sectors[Math.min(sectorIndex, run.sectors.length - 1)]!;
  const influence = getFactionCampaignInfluence(plan, state, {
    ...baseSector,
    index: sectorIndex + 1,
    bossFactionId: captain.factionId
  });
  return { plan, state, influence };
}
