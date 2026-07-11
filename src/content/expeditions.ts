export type ExpeditionNodeKind =
  | 'approach'
  | 'operation'
  | 'opportunity'
  | 'staging'
  | 'pursuit'
  | 'extraction'
  | 'checkpoint'
  | 'finale';

export type ExpeditionLegKind =
  'approach' | 'operation' | 'opportunity' | 'staging' | 'pursuit' | 'gate';

export type ExpeditionOperationalRole =
  'ingress' | 'advance' | 'detour' | 'staging' | 'gate' | 'pursuit' | 'extraction';

export type ExpeditionRiskBand = 'low' | 'guarded' | 'high' | 'critical';

export interface ExpeditionOperationalIntel {
  readonly danger: ExpeditionRiskBand;
  readonly reward: string;
  readonly consequence: string;
  readonly factionRisk: string;
  readonly crewRisk: string;
  readonly shipRisk: string;
}

export type ExpeditionPressureBand = 'relief' | 'baseline' | 'elevated' | 'boss' | 'finale';

export type ExpeditionTransitionPolicy =
  'carryState' | 'clearCombat' | 'interActJunction' | 'victory';

export type ExpeditionEntryRule = 'automatic' | 'afterNode' | 'branchChoice' | 'actHandoff';

export type ExpeditionCompletionRule =
  | 'distance'
  | 'sectorObjective'
  | 'optionalObjective'
  | 'routeResolved'
  | 'bossDefeated'
  | 'victory';

export type ExpeditionRewardHook =
  | 'combatPayout'
  | 'optionalSalvage'
  | 'routeChoice'
  | 'sectorReward'
  | 'shopAccess'
  | 'interActRefit'
  | 'bossSalvage'
  | 'finaleReward';

export interface ExpeditionDurationBand {
  readonly minSeconds: number;
  readonly targetSeconds: number;
  readonly maxSeconds: number;
}

export interface ExpeditionNodeProfileDefinition {
  readonly id: string;
  readonly label: string;
  readonly nodeKind: ExpeditionNodeKind;
  readonly legKind: ExpeditionLegKind;
  readonly pressureBand: ExpeditionPressureBand;
  readonly duration: ExpeditionDurationBand;
  readonly entryRule: ExpeditionEntryRule;
  readonly completionRule: ExpeditionCompletionRule;
  readonly transitionPolicy: ExpeditionTransitionPolicy;
}

export interface ExpeditionOpportunityDefinition {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly rewardHooks: readonly ExpeditionRewardHook[];
}

export const EXPEDITION_NODE_KINDS: readonly ExpeditionNodeKind[] = [
  'approach',
  'operation',
  'opportunity',
  'staging',
  'pursuit',
  'extraction',
  'checkpoint',
  'finale'
];

export const EXPEDITION_LEG_KINDS: readonly ExpeditionLegKind[] = [
  'approach',
  'operation',
  'opportunity',
  'staging',
  'pursuit',
  'gate'
];

export const EXPEDITION_OPERATIONAL_ROLES: readonly ExpeditionOperationalRole[] = [
  'ingress',
  'advance',
  'detour',
  'staging',
  'gate',
  'pursuit',
  'extraction'
];

export const EXPEDITION_RISK_BANDS: readonly ExpeditionRiskBand[] = [
  'low',
  'guarded',
  'high',
  'critical'
];

export const EXPEDITION_PRESSURE_BANDS: readonly ExpeditionPressureBand[] = [
  'relief',
  'baseline',
  'elevated',
  'boss',
  'finale'
];

export const EXPEDITION_TRANSITION_POLICIES: readonly ExpeditionTransitionPolicy[] = [
  'carryState',
  'clearCombat',
  'interActJunction',
  'victory'
];

export const EXPEDITION_ENTRY_RULES: readonly ExpeditionEntryRule[] = [
  'automatic',
  'afterNode',
  'branchChoice',
  'actHandoff'
];

export const EXPEDITION_COMPLETION_RULES: readonly ExpeditionCompletionRule[] = [
  'distance',
  'sectorObjective',
  'optionalObjective',
  'routeResolved',
  'bossDefeated',
  'victory'
];

export const EXPEDITION_REWARD_HOOKS: readonly ExpeditionRewardHook[] = [
  'combatPayout',
  'optionalSalvage',
  'routeChoice',
  'sectorReward',
  'shopAccess',
  'interActRefit',
  'bossSalvage',
  'finaleReward'
];

export const EXPEDITION_NODE_PROFILES: readonly ExpeditionNodeProfileDefinition[] = [
  {
    id: 'expedition_profile_ingress',
    label: 'Sector ingress',
    nodeKind: 'approach',
    legKind: 'approach',
    pressureBand: 'relief',
    duration: { minSeconds: 14, targetSeconds: 22, maxSeconds: 30 },
    entryRule: 'automatic',
    completionRule: 'distance',
    transitionPolicy: 'carryState'
  },
  {
    id: 'expedition_profile_operation_standard',
    label: 'Standard operation',
    nodeKind: 'operation',
    legKind: 'operation',
    pressureBand: 'baseline',
    duration: { minSeconds: 30, targetSeconds: 45, maxSeconds: 60 },
    entryRule: 'afterNode',
    completionRule: 'sectorObjective',
    transitionPolicy: 'clearCombat'
  },
  {
    id: 'expedition_profile_operation_escalated',
    label: 'Escalated operation',
    nodeKind: 'operation',
    legKind: 'operation',
    pressureBand: 'elevated',
    duration: { minSeconds: 34, targetSeconds: 52, maxSeconds: 68 },
    entryRule: 'afterNode',
    completionRule: 'sectorObjective',
    transitionPolicy: 'clearCombat'
  },
  {
    id: 'expedition_profile_opportunity',
    label: 'Optional opportunity',
    nodeKind: 'opportunity',
    legKind: 'opportunity',
    pressureBand: 'elevated',
    duration: { minSeconds: 14, targetSeconds: 22, maxSeconds: 34 },
    entryRule: 'branchChoice',
    completionRule: 'optionalObjective',
    transitionPolicy: 'clearCombat'
  },
  {
    id: 'expedition_profile_staging',
    label: 'Relief and staging',
    nodeKind: 'staging',
    legKind: 'staging',
    pressureBand: 'relief',
    duration: { minSeconds: 6, targetSeconds: 10, maxSeconds: 16 },
    entryRule: 'afterNode',
    completionRule: 'routeResolved',
    transitionPolicy: 'carryState'
  },
  {
    id: 'expedition_profile_pursuit',
    label: 'Optional pursuit',
    nodeKind: 'pursuit',
    legKind: 'pursuit',
    pressureBand: 'elevated',
    duration: { minSeconds: 14, targetSeconds: 22, maxSeconds: 34 },
    entryRule: 'branchChoice',
    completionRule: 'optionalObjective',
    transitionPolicy: 'clearCombat'
  },
  {
    id: 'expedition_profile_extraction',
    label: 'Sector extraction',
    nodeKind: 'extraction',
    legKind: 'gate',
    pressureBand: 'relief',
    duration: { minSeconds: 10, targetSeconds: 18, maxSeconds: 28 },
    entryRule: 'afterNode',
    completionRule: 'routeResolved',
    transitionPolicy: 'carryState'
  },
  {
    id: 'expedition_profile_checkpoint',
    label: 'Checkpoint gate',
    nodeKind: 'checkpoint',
    legKind: 'gate',
    pressureBand: 'boss',
    duration: { minSeconds: 8, targetSeconds: 13, maxSeconds: 20 },
    entryRule: 'afterNode',
    completionRule: 'bossDefeated',
    transitionPolicy: 'clearCombat'
  },
  {
    id: 'expedition_profile_finale',
    label: 'Finale gate',
    nodeKind: 'finale',
    legKind: 'gate',
    pressureBand: 'finale',
    duration: { minSeconds: 10, targetSeconds: 16, maxSeconds: 24 },
    entryRule: 'afterNode',
    completionRule: 'victory',
    transitionPolicy: 'victory'
  }
];

export const EXPEDITION_OPPORTUNITIES: readonly ExpeditionOpportunityDefinition[] = [
  {
    id: 'expedition_opportunity_salvage_sweep',
    label: 'Salvage Sweep',
    summary: 'Break formation to recover a marked debris pocket before extraction.',
    rewardHooks: ['optionalSalvage']
  },
  {
    id: 'expedition_opportunity_black_box',
    label: 'Black Box Signal',
    summary: 'Trace a damaged recorder through a pressure lane for route intelligence.',
    rewardHooks: ['optionalSalvage', 'routeChoice']
  },
  {
    id: 'expedition_opportunity_field_cache',
    label: 'Field Cache',
    summary: 'Divert toward an unstable cache with a chance to widen the next reward.',
    rewardHooks: ['optionalSalvage', 'sectorReward']
  }
];

export function getExpeditionNodeProfile(id: string): ExpeditionNodeProfileDefinition {
  const profile = EXPEDITION_NODE_PROFILES.find((candidate) => candidate.id === id);

  if (!profile) {
    throw new Error(`Unknown expedition node profile: ${id}`);
  }

  return profile;
}
