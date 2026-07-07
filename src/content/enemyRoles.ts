export const ENEMY_CLASS_IDS = [
  'class_scrap_drifter',
  'class_ledger_screener',
  'class_bloom_spreader',
  'class_void_skirmisher'
] as const;
export type EnemyClassId = (typeof ENEMY_CLASS_IDS)[number];

export const ENEMY_ROLE_IDS = [
  'scout',
  'bruiser',
  'sniper',
  'screener',
  'carrier',
  'support',
  'disruptor'
] as const;
export type EnemyRoleId = (typeof ENEMY_ROLE_IDS)[number];

export const ENEMY_PRESSURE_TYPES = [
  'lane',
  'spread',
  'burst',
  'pursuit',
  'support',
  'hazard',
  'attrition'
] as const;
export type EnemyPressureType = (typeof ENEMY_PRESSURE_TYPES)[number];

export const ENEMY_MOVEMENT_FAMILIES = [
  'drift',
  'laneHold',
  'organicSway',
  'phaseSkirmish',
  'diveRetreat',
  'aimHold',
  'escortHover',
  'deployHold',
  'hazardSet'
] as const;
export type EnemyMovementFamily = (typeof ENEMY_MOVEMENT_FAMILIES)[number];

export const ENEMY_ATTACK_FAMILIES = [
  'driftShot',
  'laneBurst',
  'sporeSpread',
  'phaseSkirmish',
  'chargedShot',
  'laneCurtain',
  'deployBurst',
  'supportPulse',
  'hazardMark'
] as const;
export type EnemyAttackFamily = (typeof ENEMY_ATTACK_FAMILIES)[number];

export const ENEMY_VARIANT_ELIGIBILITIES = [
  'baseline',
  'elite',
  'lateSector',
  'routePressure',
  'challenge'
] as const;
export type EnemyVariantEligibility = (typeof ENEMY_VARIANT_ELIGIBILITIES)[number];

export const ENEMY_FORMATION_ELIGIBILITIES = [
  'solo',
  'wedge',
  'column',
  'screen',
  'escort',
  'pincer',
  'convoy',
  'ring',
  'staggeredLane'
] as const;
export type EnemyFormationEligibility = (typeof ENEMY_FORMATION_ELIGIBILITIES)[number];

export const ENEMY_READABILITY_TIERS = ['simple', 'standard', 'complex'] as const;
export type EnemyReadabilityTier = (typeof ENEMY_READABILITY_TIERS)[number];

export const ENEMY_FACTION_FITS = ['primary', 'secondary', 'offFaction'] as const;
export type EnemyFactionFit = (typeof ENEMY_FACTION_FITS)[number];

export const ENEMY_OBJECTIVE_POLICIES = [
  'requiredTarget',
  'optionalPressure',
  'spawnedChild',
  'retreating'
] as const;
export type EnemyObjectivePolicy = (typeof ENEMY_OBJECTIVE_POLICIES)[number];

export interface EnemyRoleMetadata {
  readonly classId: EnemyClassId;
  readonly role: EnemyRoleId;
  readonly pressureType: EnemyPressureType;
  readonly movementFamily: EnemyMovementFamily;
  readonly attackFamily: EnemyAttackFamily;
  readonly variantEligibility: readonly EnemyVariantEligibility[];
  readonly formationEligibility: readonly EnemyFormationEligibility[];
  readonly readabilityTier: EnemyReadabilityTier;
  readonly factionFit: EnemyFactionFit;
  readonly objectivePolicy: EnemyObjectivePolicy;
  readonly debugLabel: string;
}

export interface Phase7EnemyRoleTarget {
  readonly id: EnemyRoleId;
  readonly label: string;
  readonly pressureType: EnemyPressureType;
  readonly intendedMovement: string;
  readonly intendedAttack: string;
  readonly currentCoverage: string;
  readonly implementationRisk: string;
}

export const PHASE_7_TARGET_ENEMY_ROLES: readonly Phase7EnemyRoleTarget[] = [
  {
    id: 'scout',
    label: 'Scout',
    pressureType: 'pursuit',
    intendedMovement: 'fast entry, shallow dives, retreats, and flank probes',
    intendedAttack: 'light single shots or short aimed taps',
    currentCoverage: 'partially implied by phase skirmish lateral motion',
    implementationRisk: 'must not outrun the fixed arena or become impossible on narrow views'
  },
  {
    id: 'bruiser',
    label: 'Bruiser',
    pressureType: 'attrition',
    intendedMovement: 'slow lane pressure, broad bodies, and predictable holds',
    intendedAttack: 'few heavy shots or close-range volleys',
    currentCoverage: 'partially covered by Scrap Court drift shots and higher hull spawns',
    implementationRisk: 'extra durability must not stall objective completion'
  },
  {
    id: 'sniper',
    label: 'Sniper',
    pressureType: 'burst',
    intendedMovement: 'holds aim lines, repositions between charged attacks',
    intendedAttack: 'telegraphed aimed shot with clear windup',
    currentCoverage: 'not represented by normal enemies; bosses use telegraphs',
    implementationRisk: 'aimed pressure needs telegraphing before precision damage'
  },
  {
    id: 'screener',
    label: 'Screener',
    pressureType: 'lane',
    intendedMovement: 'lane holds, columns, and horizontal screen control',
    intendedAttack: 'paired bolts, curtains, or short lane warnings',
    currentCoverage: 'covered best by Corporate Ledger lane burst enemies',
    implementationRisk: 'lane pressure can hide behind hazards without high-contrast checks'
  },
  {
    id: 'carrier',
    label: 'Carrier',
    pressureType: 'support',
    intendedMovement: 'slow protected entry with deploy or escort timing',
    intendedAttack: 'spawn drones, mines, or delayed payloads',
    currentCoverage: 'only boss fantasy currently covers carrier behavior',
    implementationRisk: 'spawned children must share objective accounting rules'
  },
  {
    id: 'support',
    label: 'Support',
    pressureType: 'support',
    intendedMovement: 'hover near allies, retreat when isolated, keep readable spacing',
    intendedAttack: 'shield, heal, pulse, buff, or mark rather than direct bullet spam',
    currentCoverage: 'not represented by normal enemies',
    implementationRisk: 'support effects need clear state copy and cleanup on death'
  },
  {
    id: 'disruptor',
    label: 'Disruptor',
    pressureType: 'hazard',
    intendedMovement: 'sets short-lived danger zones, then relocates or exits',
    intendedAttack: 'hazard marks, mines, or route-condition pressure',
    currentCoverage: 'sector hazards cover this pressure outside enemy entities',
    implementationRisk: 'hazard markers must stay below bullets and not duplicate sector hazards'
  }
];

export function getEnemyRoleLabel(role: EnemyRoleId): string {
  return PHASE_7_TARGET_ENEMY_ROLES.find((target) => target.id === role)?.label ?? role;
}
