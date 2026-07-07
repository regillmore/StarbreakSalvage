import {
  ENEMY_OBJECTIVE_POLICIES,
  ENEMY_ROLE_IDS,
  getEnemyRoleLabel,
  type EnemyObjectivePolicy,
  type EnemyRoleId
} from '../content/enemyRoles';
import { getFactionById } from '../content/factions';
import type { CombatState, EnemyState } from './CombatState';

export interface EnemyRoleCount {
  readonly role: EnemyRoleId;
  readonly label: string;
  readonly count: number;
}

export interface EnemyObjectivePolicyCount {
  readonly objectivePolicy: EnemyObjectivePolicy;
  readonly count: number;
}

export interface EnemyRolePressureSummary {
  readonly totalEnemies: number;
  readonly roleCounts: readonly EnemyRoleCount[];
  readonly objectivePolicyCounts: readonly EnemyObjectivePolicyCount[];
  readonly variantCount: number;
  readonly formationCount: number;
}

export function createEnemyRolePressureSummary(
  state: Pick<CombatState, 'enemies'>
): EnemyRolePressureSummary {
  return createEnemyRolePressureSummaryFromEnemies(state.enemies);
}

export function createEnemyRolePressureSummaryFromEnemies(
  enemies: readonly Pick<EnemyState, 'factionId'>[]
): EnemyRolePressureSummary {
  const roleCounts = new Map<EnemyRoleId, number>();
  const objectivePolicyCounts = new Map<EnemyObjectivePolicy, number>();

  for (const enemy of enemies) {
    const metadata = getFactionById(enemy.factionId).enemyRole;
    roleCounts.set(metadata.role, (roleCounts.get(metadata.role) ?? 0) + 1);
    objectivePolicyCounts.set(
      metadata.objectivePolicy,
      (objectivePolicyCounts.get(metadata.objectivePolicy) ?? 0) + 1
    );
  }

  return {
    totalEnemies: enemies.length,
    roleCounts: ENEMY_ROLE_IDS.map((role) => ({
      role,
      label: getEnemyRoleLabel(role),
      count: roleCounts.get(role) ?? 0
    })).filter((entry) => entry.count > 0),
    objectivePolicyCounts: ENEMY_OBJECTIVE_POLICIES.map((objectivePolicy) => ({
      objectivePolicy,
      count: objectivePolicyCounts.get(objectivePolicy) ?? 0
    })).filter((entry) => entry.count > 0),
    variantCount: 0,
    formationCount: 0
  };
}
