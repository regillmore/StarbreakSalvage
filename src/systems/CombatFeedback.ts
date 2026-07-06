import type { CombatState } from '../game/CombatState';

export type CombatFeedbackCue =
  | 'playerFire'
  | 'specialActivated'
  | 'bombUsed'
  | 'graze'
  | 'enemyDestroyed'
  | 'bossDefeated'
  | 'pickupCollected'
  | 'playerHit'
  | 'playerDestroyed'
  | 'bossSpawned'
  | 'bossWarning'
  | 'sectorClear'
  | 'runEnd';

export interface CombatFeedbackSnapshot {
  readonly shotsFired: number;
  readonly specialsUsed: number;
  readonly bombsUsed: number;
  readonly grazes: number;
  readonly enemiesDestroyed: number;
  readonly bossesDefeated: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly bossPresent: boolean;
  readonly telegraphCount: number;
}

const SHAKE_INTENSITY_BY_CUE: Readonly<Record<CombatFeedbackCue, number>> = {
  playerFire: 0.08,
  specialActivated: 0.24,
  bombUsed: 0.7,
  graze: 0.04,
  enemyDestroyed: 0.2,
  bossDefeated: 0.72,
  pickupCollected: 0,
  playerHit: 0.64,
  playerDestroyed: 0.78,
  bossSpawned: 0.46,
  bossWarning: 0.18,
  sectorClear: 0.34,
  runEnd: 0.52
};

export function createCombatFeedbackSnapshot(state: CombatState): CombatFeedbackSnapshot {
  return {
    shotsFired: state.stats.shotsFired,
    specialsUsed: state.stats.specialsUsed,
    bombsUsed: state.stats.bombsUsed,
    grazes: state.stats.grazes,
    enemiesDestroyed: state.stats.enemiesDestroyed,
    bossesDefeated: state.stats.bossesDefeated,
    pickupsCollected: state.stats.pickupsCollected,
    damageTaken: state.stats.damageTaken,
    bossPresent: state.boss !== null,
    telegraphCount: state.telegraphs.length
  };
}

export function diffCombatFeedback(
  before: CombatFeedbackSnapshot,
  after: CombatFeedbackSnapshot
): CombatFeedbackCue[] {
  const cues: CombatFeedbackCue[] = [];

  if (after.shotsFired > before.shotsFired) {
    cues.push('playerFire');
  }

  if (after.specialsUsed > before.specialsUsed) {
    cues.push('specialActivated');
  }

  if (after.bombsUsed > before.bombsUsed) {
    cues.push('bombUsed');
  }

  if (after.grazes > before.grazes) {
    cues.push('graze');
  }

  if (after.damageTaken > before.damageTaken) {
    cues.push('playerHit');
  }

  if (after.bossesDefeated > before.bossesDefeated) {
    cues.push('bossDefeated');
  } else if (after.enemiesDestroyed > before.enemiesDestroyed) {
    cues.push('enemyDestroyed');
  }

  if (after.pickupsCollected > before.pickupsCollected) {
    cues.push('pickupCollected');
  }

  if (!before.bossPresent && after.bossPresent) {
    cues.push('bossSpawned');
  }

  if (before.telegraphCount === 0 && after.telegraphCount > 0) {
    cues.push('bossWarning');
  }

  return cues;
}

export function getFeedbackShakeIntensity(cue: CombatFeedbackCue): number {
  return SHAKE_INTENSITY_BY_CUE[cue];
}
