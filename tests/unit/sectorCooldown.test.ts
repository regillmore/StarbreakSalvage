import { describe, expect, it } from 'vitest';

import {
  SECTOR_COOLDOWN_DISTANCE,
  applySectorCooldownToScroll,
  createSectorCooldownPlan,
  createSectorCooldownState,
  getSectorCooldownPresentation,
  prepareSectorCooldownCombatState
} from '../../src/game/SectorCooldown';
import type { CombatState } from '../../src/game/CombatState';
import type { SectorScrollPlan } from '../../src/game/ScrollState';

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
      warning: 'Hazards clear | hostile pressure retired'
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

  it('retires pressure and future schedules while preserving collectible drops', () => {
    const pickups = [{ id: 41, kind: 'salvage', value: 3 }];
    const state = {
      enemies: [{ id: 1 }],
      projectiles: [{ id: 2 }],
      telegraphs: [{ id: 3 }],
      pickups,
      environmentObjects: [{ id: 4 }],
      boss: { id: 5 },
      nextSpawnIndex: 0,
      spawnSchedule: [{ atSeconds: 10 }],
      nextLooseCurrencyIndex: 0,
      looseCurrencyPlan: { events: [{ id: 'late-drop' }, { id: 'later-drop' }] }
    } as unknown as CombatState;

    prepareSectorCooldownCombatState(state);

    expect(state.enemies).toEqual([]);
    expect(state.projectiles).toEqual([]);
    expect(state.telegraphs).toEqual([]);
    expect(state.environmentObjects).toEqual([]);
    expect(state.boss).toBeNull();
    expect(state.nextSpawnIndex).toBe(1);
    expect(state.nextLooseCurrencyIndex).toBe(2);
    expect(state.pickups).toBe(pickups);
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
