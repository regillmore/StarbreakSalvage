import { describe, expect, it } from 'vitest';

import type { EnemyMovementFamily } from '../../src/content/enemyRoles';
import type { CombatBounds, EnemyState } from '../../src/game/CombatState';
import { updateEnemyMovement } from '../../src/systems/EnemyMovement';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('EnemyMovement', () => {
  it('keeps role movement deterministic for the same fixed-step sequence', () => {
    const first = simulateMovement('phaseSkirmish', makeEnemy({ id: 11, x: 320, homeX: 320 }));
    const second = simulateMovement('phaseSkirmish', makeEnemy({ id: 11, x: 320, homeX: 320 }));

    expect(second).toEqual(first);
  });

  it('makes current Phase 7 role families move distinctly after entry', () => {
    const bruiser = simulateMovement(
      'drift',
      makeEnemy({ id: 1, x: 240, homeX: 240, drift: -18 })
    );
    const screener = simulateMovement(
      'laneHold',
      makeEnemy({ id: 2, x: 320, homeX: 320, drift: 18 })
    );
    const disruptor = simulateMovement(
      'organicSway',
      makeEnemy({ id: 3, x: 360, homeX: 360, drift: 0 })
    );
    const scout = simulateMovement(
      'phaseSkirmish',
      makeEnemy({ id: 4, x: 320, homeX: 320, drift: 12 })
    );

    expect(getRange(screener.xSamples)).toBeLessThan(12);
    expect(getRange(disruptor.xSamples)).toBeGreaterThan(20);
    expect(getRange(scout.xSamples)).toBeGreaterThan(getRange(disruptor.xSamples));
    expect(bruiser.final.x).toBeLessThan(230);
    expect(getRange(disruptor.ySamples)).toBeGreaterThan(getRange(screener.ySamples));
  });

  it('clamps all movement families inside the combat world during long updates', () => {
    const families: readonly EnemyMovementFamily[] = [
      'drift',
      'laneHold',
      'organicSway',
      'phaseSkirmish',
      'diveRetreat',
      'aimHold',
      'escortHover',
      'deployHold',
      'hazardSet'
    ];

    for (const [index, family] of families.entries()) {
      const result = simulateMovement(
        family,
        makeEnemy({
          id: index + 20,
          x: index % 2 === 0 ? 36 : 604,
          homeX: index % 2 === 0 ? 36 : 604,
          drift: index % 2 === 0 ? -80 : 80,
          targetY: 86 + index * 12
        }),
        9
      );

      expect(Math.min(...result.xSamples)).toBeGreaterThanOrEqual(41);
      expect(Math.max(...result.xSamples)).toBeLessThanOrEqual(599);
      expect(Math.min(...result.ySamples)).toBeGreaterThanOrEqual(41);
      expect(Math.max(...result.ySamples)).toBeLessThanOrEqual(bounds.height + 17);
    }
  });

  it('enters to target Y without overshooting on a large fixed-step catchup', () => {
    const enemy = makeEnemy({ y: -24, targetY: 110 });

    updateEnemyMovement(enemy, 'laneHold', 0.5, 1.5, bounds);

    expect(enemy.y).toBe(110);
    expect(enemy.x).toBe(320);
  });
});

function simulateMovement(
  movementFamily: EnemyMovementFamily,
  enemy: EnemyState,
  seconds = 4
): {
  readonly final: EnemyState;
  readonly xSamples: readonly number[];
  readonly ySamples: readonly number[];
} {
  const dt = 1 / 60;
  const xSamples: number[] = [];
  const ySamples: number[] = [];

  for (let frame = 0; frame < seconds * 60; frame += 1) {
    updateEnemyMovement(enemy, movementFamily, frame * dt, dt, bounds);
    if (frame % 10 === 0) {
      xSamples.push(round(enemy.x));
      ySamples.push(round(enemy.y));
    }
  }

  return {
    final: { ...enemy },
    xSamples,
    ySamples
  };
}

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 1,
    factionId: 'faction_corporate_ledger',
    x: 320,
    y: 120,
    radius: 17,
    hull: 2,
    maxHull: 2,
    drift: 0,
    targetY: 120,
    homeX: 320,
    fireCooldown: 1,
    ...overrides
  };
}

function getRange(values: readonly number[]): number {
  return Math.max(...values) - Math.min(...values);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
