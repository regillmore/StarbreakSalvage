import { describe, expect, it } from 'vitest';

import {
  SECTOR_COOLDOWN_DISTANCE,
  advanceSectorCooldownScroll,
  applySectorCooldownToScroll,
  createSectorCooldownPlan,
  createSectorCooldownState,
  getSectorCooldownPresentation,
  isSectorFieldSettled,
  suppressSectorCooldownSpawns
} from '../../src/game/SectorCooldown';
import type { CombatState } from '../../src/game/CombatState';
import { createScrollState, type SectorScrollPlan } from '../../src/game/ScrollState';

describe('SectorCooldown', () => {
  it('extends a typical flight sector without moving its authored combat endpoint', () => {
    const scroll = makeScrollPlan();
    const plan = createSectorCooldownPlan({
      scroll,
      sectorIndex: 2,
      sectorCount: 15,
      operationMode: 'flight'
    });

    expect(plan).toEqual({
      enabled: true,
      combatEndDistance: 1400,
      exitDistance: 1400 + SECTOR_COOLDOWN_DISTANCE,
      cooldownDistance: SECTOR_COOLDOWN_DISTANCE
    });
    expect(applySectorCooldownToScroll(scroll, plan)).toEqual({
      ...scroll,
      length: 1400 + SECTOR_COOLDOWN_DISTANCE
    });
    expect(scroll.length).toBe(1400);
  });

  it('tracks bounded distance progress and player-facing recovery copy', () => {
    const plan = createSectorCooldownPlan({
      scroll: makeScrollPlan(),
      sectorIndex: 0,
      sectorCount: 3
    });
    const state = createSectorCooldownState(plan, 'sectorComplete');

    expect(state).not.toBeNull();
    expect(getSectorCooldownPresentation(state!, 1481)).toMatchObject({
      traveledDistance: 81,
      remainingDistance: 99,
      progress: 0.45,
      complete: false,
      readout: 'Recovery coast 81/180u',
      warning: 'No new contacts | field settling naturally'
    });
    expect(getSectorCooldownPresentation(state!, 9999)).toMatchObject({
      traveledDistance: 180,
      remainingDistance: 0,
      progress: 1,
      complete: true
    });
  });

  it('does not delay boarding operations, final victories, or victory reasons', () => {
    const boarding = createSectorCooldownPlan({
      scroll: makeScrollPlan(),
      sectorIndex: 1,
      sectorCount: 3,
      operationMode: 'boarding'
    });
    const finalSector = createSectorCooldownPlan({
      scroll: makeScrollPlan(),
      sectorIndex: 2,
      sectorCount: 3,
      operationMode: 'flight'
    });

    expect(boarding.enabled).toBe(false);
    expect(finalSector.enabled).toBe(false);
    expect(applySectorCooldownToScroll(makeScrollPlan(), boarding).length).toBe(1400);
    expect(createSectorCooldownState(boarding, 'sectorComplete')).toBeNull();
    expect(createSectorCooldownState(finalSector, 'victory')).toBeNull();
  });

  it('holds at the combat endpoint before consuming the full coast distance', () => {
    const authoredScroll = makeScrollPlan();
    const plan = createSectorCooldownPlan({
      scroll: authoredScroll,
      sectorIndex: 0,
      sectorCount: 3
    });
    const scroll = createScrollState(applySectorCooldownToScroll(authoredScroll, plan));

    for (let step = 0; step < 200; step += 1) {
      advanceSectorCooldownScroll(scroll, plan, false, 0.1, authoredScroll.baseSpeed);
    }

    expect(scroll.distance).toBe(plan.combatEndDistance);
    expect(scroll.complete).toBe(false);
    expect(scroll.speed).toBe(0);

    advanceSectorCooldownScroll(scroll, plan, false, 1, authoredScroll.baseSpeed);
    expect(scroll.distance).toBe(plan.combatEndDistance);

    for (let step = 0; step < 20; step += 1) {
      advanceSectorCooldownScroll(scroll, plan, true, 0.1, authoredScroll.baseSpeed);
    }

    expect(scroll.distance).toBe(plan.exitDistance);
    expect(scroll.distance - plan.combatEndDistance).toBe(SECTOR_COOLDOWN_DISTANCE);
    expect(scroll.complete).toBe(true);
  });

  it('suppresses future spawns while preserving the live field and drop schedules', () => {
    const pickups = [{ id: 41, kind: 'salvage', value: 3 }];
    const enemies = [{ id: 1 }];
    const projectiles = [{ id: 2 }];
    const telegraphs = [{ id: 3 }];
    const environmentObjects = [{ id: 4 }];
    const boss = { id: 5 };
    const state = {
      enemies,
      projectiles,
      telegraphs,
      pickups,
      environmentObjects,
      boss,
      nextSpawnIndex: 0,
      spawnSchedule: [{ atSeconds: 10 }],
      nextLooseCurrencyIndex: 0,
      looseCurrencyPlan: { events: [{ id: 'late-drop' }, { id: 'later-drop' }] }
    } as unknown as CombatState;

    suppressSectorCooldownSpawns(state);

    expect(state.enemies).toBe(enemies);
    expect(state.projectiles).toBe(projectiles);
    expect(state.telegraphs).toBe(telegraphs);
    expect(state.environmentObjects).toBe(environmentObjects);
    expect(state.boss).toBe(boss);
    expect(state.nextSpawnIndex).toBe(1);
    expect(state.nextLooseCurrencyIndex).toBe(0);
    expect(state.pickups).toBe(pickups);
  });

  it('waits for every sector enemy, including non-objective contacts, to leave the field', () => {
    expect(isSectorFieldSettled({ enemies: [], boss: null })).toBe(true);
    expect(
      isSectorFieldSettled({
        enemies: [{ countsForObjective: false }] as CombatState['enemies'],
        boss: null
      })
    ).toBe(false);
    expect(isSectorFieldSettled({ enemies: [], boss: { id: 9 } as CombatState['boss'] })).toBe(
      false
    );
  });
});

function makeScrollPlan(): SectorScrollPlan {
  return {
    sectorId: 'sector_outer_debris_field',
    sectorIndex: 1,
    length: 1400,
    baseSpeed: 90,
    minSpeed: 58,
    maxSpeed: 128,
    startOffset: 100
  };
}
