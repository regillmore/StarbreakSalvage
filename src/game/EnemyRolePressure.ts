import {
  ENEMY_OBJECTIVE_POLICIES,
  ENEMY_ROLE_IDS,
  getEnemyRoleLabel,
  type EnemyObjectivePolicy,
  type EnemyRoleId
} from '../content/enemyRoles';
import {
  ENEMY_FORMATION_IDS,
  getEnemyFormationById,
  type EnemyFormationId
} from '../content/enemyFormations';
import {
  ENEMY_VARIANT_IDS,
  getEnemyVariantById,
  type EnemyVariantId
} from '../content/enemyVariants';
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

export interface EnemyVariantCount {
  readonly variantId: EnemyVariantId;
  readonly label: string;
  readonly count: number;
}

export interface EnemyFormationCount {
  readonly formationId: EnemyFormationId;
  readonly label: string;
  readonly count: number;
}

export interface EnemyRolePressureSummary {
  readonly totalEnemies: number;
  readonly roleCounts: readonly EnemyRoleCount[];
  readonly objectivePolicyCounts: readonly EnemyObjectivePolicyCount[];
  readonly variantCounts: readonly EnemyVariantCount[];
  readonly variantCount: number;
  readonly formationCounts: readonly EnemyFormationCount[];
  readonly formationCount: number;
}

export function createEnemyRolePressureSummary(
  state: Pick<CombatState, 'enemies'>
): EnemyRolePressureSummary {
  return createEnemyRolePressureSummaryFromEnemies(state.enemies);
}

export function createEnemyRolePressureSummaryFromEnemies(
  enemies: readonly Pick<EnemyState, 'factionId' | 'variantId' | 'formationId'>[]
): EnemyRolePressureSummary {
  const roleCounts = new Map<EnemyRoleId, number>();
  const objectivePolicyCounts = new Map<EnemyObjectivePolicy, number>();
  const variantCounts = new Map<EnemyVariantId, number>();
  const formationCounts = new Map<EnemyFormationId, number>();

  for (const enemy of enemies) {
    const metadata = getFactionById(enemy.factionId).enemyRole;
    roleCounts.set(metadata.role, (roleCounts.get(metadata.role) ?? 0) + 1);
    objectivePolicyCounts.set(
      metadata.objectivePolicy,
      (objectivePolicyCounts.get(metadata.objectivePolicy) ?? 0) + 1
    );

    if (enemy.variantId) {
      variantCounts.set(enemy.variantId, (variantCounts.get(enemy.variantId) ?? 0) + 1);
    }

    if (enemy.formationId) {
      formationCounts.set(enemy.formationId, (formationCounts.get(enemy.formationId) ?? 0) + 1);
    }
  }

  const variantEntries = ENEMY_VARIANT_IDS.map((variantId) => ({
    variantId,
    label: getEnemyVariantById(variantId).debugLabel,
    count: variantCounts.get(variantId) ?? 0
  })).filter((entry) => entry.count > 0);
  const formationEntries = ENEMY_FORMATION_IDS.map((formationId) => ({
    formationId,
    label: getEnemyFormationById(formationId).debugLabel,
    count: formationCounts.get(formationId) ?? 0
  })).filter((entry) => entry.count > 0);

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
    variantCounts: variantEntries,
    variantCount: variantEntries.reduce((total, entry) => total + entry.count, 0),
    formationCounts: formationEntries,
    formationCount: formationEntries.reduce((total, entry) => total + entry.count, 0)
  };
}
