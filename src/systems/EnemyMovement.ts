import type { EnemyMovementFamily } from '../content/enemyRoles';
import type { CombatBounds, EnemyState } from '../game/CombatState';
import { clamp } from '../core/math';

export interface EnemyMovementProfile {
  readonly entrySpeed: number;
  readonly xAmplitude: number;
  readonly yAmplitude: number;
  readonly xResponse: number;
  readonly yResponse: number;
  readonly laneBias: number;
}

const MOVEMENT_PROFILES: Readonly<Record<EnemyMovementFamily, EnemyMovementProfile>> = {
  drift: {
    entrySpeed: 104,
    xAmplitude: 22,
    yAmplitude: 6,
    xResponse: 1.35,
    yResponse: 1.1,
    laneBias: 1.05
  },
  laneHold: {
    entrySpeed: 138,
    xAmplitude: 5,
    yAmplitude: 2,
    xResponse: 5.2,
    yResponse: 2.2,
    laneBias: 0.12
  },
  organicSway: {
    entrySpeed: 96,
    xAmplitude: 42,
    yAmplitude: 16,
    xResponse: 2.3,
    yResponse: 2.6,
    laneBias: 0.18
  },
  phaseSkirmish: {
    entrySpeed: 128,
    xAmplitude: 82,
    yAmplitude: 19,
    xResponse: 4.8,
    yResponse: 3.4,
    laneBias: 0.4
  },
  diveRetreat: {
    entrySpeed: 132,
    xAmplitude: 36,
    yAmplitude: 34,
    xResponse: 3.6,
    yResponse: 3.8,
    laneBias: 0.35
  },
  aimHold: {
    entrySpeed: 102,
    xAmplitude: 8,
    yAmplitude: 3,
    xResponse: 4.6,
    yResponse: 2.4,
    laneBias: 0.08
  },
  escortHover: {
    entrySpeed: 92,
    xAmplitude: 28,
    yAmplitude: 10,
    xResponse: 2.8,
    yResponse: 2.8,
    laneBias: 0.25
  },
  deployHold: {
    entrySpeed: 86,
    xAmplitude: 14,
    yAmplitude: 5,
    xResponse: 2.2,
    yResponse: 2.1,
    laneBias: 0.08
  },
  hazardSet: {
    entrySpeed: 108,
    xAmplitude: 30,
    yAmplitude: 12,
    xResponse: 3.2,
    yResponse: 2.8,
    laneBias: 0.3
  }
};

export function getEnemyMovementProfile(
  movementFamily: EnemyMovementFamily
): EnemyMovementProfile {
  return MOVEMENT_PROFILES[movementFamily];
}

export function updateEnemyMovement(
  enemy: EnemyState,
  movementFamily: EnemyMovementFamily,
  timeSeconds: number,
  dt: number,
  bounds: CombatBounds
): void {
  const profile = getEnemyMovementProfile(movementFamily);
  const safeDt = Math.max(0, dt);
  const minX = bounds.padding + enemy.radius;
  const maxX = bounds.width - bounds.padding - enemy.radius;
  const maxY = bounds.height + enemy.radius;
  const homeX = clamp(enemy.homeX ?? enemy.x, minX, maxX);

  if (enemy.y < enemy.targetY) {
    enemy.y = Math.min(enemy.targetY, enemy.y + profile.entrySpeed * safeDt);
    enemy.x = clamp(enemy.x, minX, maxX);
    return;
  }

  const phase = timeSeconds + enemy.id * 0.37;
  const secondaryPhase = timeSeconds * 0.63 + enemy.id * 0.19;
  const targetX = clamp(
    homeX +
      enemy.drift * profile.laneBias +
      Math.sin(phase * getXFrequency(movementFamily)) * profile.xAmplitude,
    minX,
    maxX
  );
  const targetY = clamp(
    enemy.targetY + Math.cos(secondaryPhase * getYFrequency(movementFamily)) * profile.yAmplitude,
    bounds.padding + enemy.radius,
    Math.min(bounds.height * 0.46, maxY)
  );

  enemy.x = approach(enemy.x, targetX, profile.xResponse, safeDt);
  enemy.y = approach(enemy.y, targetY, profile.yResponse, safeDt);
  enemy.x = clamp(enemy.x, minX, maxX);
  enemy.y = clamp(enemy.y, bounds.padding + enemy.radius, maxY);
}

function approach(current: number, target: number, response: number, dt: number): number {
  return current + (target - current) * clamp(response * dt, 0, 1);
}

function getXFrequency(movementFamily: EnemyMovementFamily): number {
  if (movementFamily === 'phaseSkirmish') {
    return 3.4;
  }

  if (movementFamily === 'organicSway') {
    return 1.85;
  }

  if (movementFamily === 'laneHold' || movementFamily === 'aimHold') {
    return 0.9;
  }

  return 1.25;
}

function getYFrequency(movementFamily: EnemyMovementFamily): number {
  if (movementFamily === 'phaseSkirmish') {
    return 2.6;
  }

  if (movementFamily === 'organicSway') {
    return 1.7;
  }

  if (movementFamily === 'laneHold' || movementFamily === 'aimHold') {
    return 0.72;
  }

  return 1.1;
}
