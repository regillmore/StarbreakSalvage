import { describe, expect, it } from 'vitest';

import {
  diffCombatFeedback,
  getFeedbackShakeIntensity,
  type CombatFeedbackSnapshot
} from '../../src/systems/CombatFeedback';

const emptySnapshot: CombatFeedbackSnapshot = {
  shotsFired: 0,
  specialsUsed: 0,
  bombsUsed: 0,
  grazes: 0,
  phaseCollapses: 0,
  enemiesDestroyed: 0,
  environmentObjectsDestroyed: 0,
  bossesDefeated: 0,
  pickupsCollected: 0,
  damageTaken: 0,
  bossPresent: false,
  telegraphCount: 0
};

describe('CombatFeedback', () => {
  it('detects important combat deltas in stable cue order', () => {
    expect(
      diffCombatFeedback(emptySnapshot, {
        shotsFired: 2,
        specialsUsed: 1,
        bombsUsed: 1,
        grazes: 1,
        phaseCollapses: 1,
        enemiesDestroyed: 1,
        environmentObjectsDestroyed: 1,
        bossesDefeated: 0,
        pickupsCollected: 1,
        damageTaken: 1,
        bossPresent: true,
        telegraphCount: 1
      })
    ).toEqual([
      'playerFire',
      'specialActivated',
      'bombUsed',
      'graze',
      'phaseCollapse',
      'playerHit',
      'enemyDestroyed',
      'environmentDestroyed',
      'pickupCollected',
      'bossSpawned',
      'bossWarning'
    ]);
  });

  it('prefers boss defeat over generic enemy defeat', () => {
    expect(
      diffCombatFeedback(emptySnapshot, {
        ...emptySnapshot,
        enemiesDestroyed: 1,
        bossesDefeated: 1
      })
    ).toEqual(['bossDefeated']);
  });

  it('keeps nonzero shake for impact cues and no shake for pickups', () => {
    expect(getFeedbackShakeIntensity('playerHit')).toBeGreaterThan(0);
    expect(getFeedbackShakeIntensity('playerDestroyed')).toBeGreaterThan(
      getFeedbackShakeIntensity('playerHit')
    );
    expect(getFeedbackShakeIntensity('bombUsed')).toBeGreaterThan(
      getFeedbackShakeIntensity('playerHit')
    );
    expect(getFeedbackShakeIntensity('pickupCollected')).toBe(0);
    expect(getFeedbackShakeIntensity('phaseCollapse')).toBeGreaterThan(
      getFeedbackShakeIntensity('graze')
    );
  });
});
