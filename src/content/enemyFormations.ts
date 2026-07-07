import type { Rng } from '../core/rng';
import { getFactionById, type FactionId } from './factions';
import type { EnemyRoleId } from './enemyRoles';
import type { EnemyVariantEncounterType } from './enemyVariants';

export const ENEMY_FORMATION_IDS = [
  'formation_wedge',
  'formation_column',
  'formation_screen',
  'formation_escort',
  'formation_pincer',
  'formation_convoy',
  'formation_ring',
  'formation_staggered_lane'
] as const;
export type EnemyFormationId = (typeof ENEMY_FORMATION_IDS)[number];

export const ENEMY_FORMATION_SHAPES = [
  'wedge',
  'column',
  'screen',
  'escort',
  'pincer',
  'convoy',
  'ring',
  'staggeredLane'
] as const;
export type EnemyFormationShape = (typeof ENEMY_FORMATION_SHAPES)[number];

export const ENEMY_FORMATION_ENTRY_STYLES = ['group', 'staggered', 'flank', 'orbit'] as const;
export type EnemyFormationEntryStyle = (typeof ENEMY_FORMATION_ENTRY_STYLES)[number];

export const ENEMY_FORMATION_BREAK_CONDITIONS = ['none', 'leaderDefeat', 'halfCleared'] as const;
export type EnemyFormationBreakCondition = (typeof ENEMY_FORMATION_BREAK_CONDITIONS)[number];

export const ENEMY_FORMATION_CLEANUP_POLICIES = ['requiredTargets', 'retreatIfLate'] as const;
export type EnemyFormationCleanupPolicy = (typeof ENEMY_FORMATION_CLEANUP_POLICIES)[number];

export interface EnemyFormationCue {
  readonly label: string;
  readonly stroke: string;
}

export interface EnemyFormationMemberDefinition {
  readonly role: EnemyRoleId;
  readonly xOffset: number;
  readonly targetYOffset: number;
  readonly delaySeconds: number;
  readonly distanceOffset: number;
}

export interface EnemyFormationDefinition {
  readonly id: EnemyFormationId;
  readonly shape: EnemyFormationShape;
  readonly name: string;
  readonly debugLabel: string;
  readonly summary: string;
  readonly minSectorIndex: number;
  readonly minMembers: number;
  readonly maxMembers: number;
  readonly weight: number;
  readonly clearBonusSalvage: number;
  readonly spacing: number;
  readonly entryStyle: EnemyFormationEntryStyle;
  readonly breakCondition: EnemyFormationBreakCondition;
  readonly cleanupPolicy: EnemyFormationCleanupPolicy;
  readonly encounterTypes?: readonly EnemyVariantEncounterType[];
  readonly preferredRoles?: readonly EnemyRoleId[];
  readonly members: readonly EnemyFormationMemberDefinition[];
  readonly cue: EnemyFormationCue;
}

export interface EnemyFormationSelectionContext {
  readonly preferredFactionId: FactionId;
  readonly availableFactionIds: readonly FactionId[];
  readonly sectorIndex: number;
  readonly waveIndex: number;
  readonly spawnCount: number;
  readonly waveLabel: string;
  readonly routePressure: boolean;
  readonly challenge: boolean;
  readonly elite: boolean;
  readonly encounterType: EnemyVariantEncounterType;
  readonly formationCluster?: boolean;
}

export const ENEMY_FORMATIONS: readonly EnemyFormationDefinition[] = [
  {
    id: 'formation_wedge',
    shape: 'wedge',
    name: 'Wedge Probe',
    debugLabel: 'wedge',
    summary: 'a lead ship pulls two flanks into converging pressure',
    minSectorIndex: 1,
    minMembers: 2,
    maxMembers: 3,
    weight: 3.2,
    clearBonusSalvage: 1,
    spacing: 56,
    entryStyle: 'group',
    breakCondition: 'leaderDefeat',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['scout', 'disruptor'],
    members: [
      { role: 'scout', xOffset: 0, targetYOffset: -10, delaySeconds: 0, distanceOffset: 0 },
      { role: 'disruptor', xOffset: -56, targetYOffset: 22, delaySeconds: 0.1, distanceOffset: 16 },
      { role: 'scout', xOffset: 56, targetYOffset: 22, delaySeconds: 0.1, distanceOffset: 16 }
    ],
    cue: {
      label: 'WDG',
      stroke: '#b99cff'
    }
  },
  {
    id: 'formation_column',
    shape: 'column',
    name: 'Scrap Column',
    debugLabel: 'column',
    summary: 'stacked hulls claim one lane and force lateral movement',
    minSectorIndex: 1,
    minMembers: 2,
    maxMembers: 3,
    weight: 2.9,
    clearBonusSalvage: 1,
    spacing: 48,
    entryStyle: 'staggered',
    breakCondition: 'none',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['bruiser', 'screener'],
    members: [
      { role: 'bruiser', xOffset: 0, targetYOffset: -34, delaySeconds: 0, distanceOffset: 0 },
      { role: 'screener', xOffset: 0, targetYOffset: 12, delaySeconds: 0.14, distanceOffset: 18 },
      { role: 'bruiser', xOffset: 0, targetYOffset: 58, delaySeconds: 0.28, distanceOffset: 36 }
    ],
    cue: {
      label: 'COL',
      stroke: '#ffd166'
    }
  },
  {
    id: 'formation_screen',
    shape: 'screen',
    name: 'Ledger Screen',
    debugLabel: 'screen',
    summary: 'a horizontal screen creates a short lane-control puzzle',
    minSectorIndex: 1,
    minMembers: 2,
    maxMembers: 3,
    weight: 3,
    clearBonusSalvage: 1,
    spacing: 72,
    entryStyle: 'group',
    breakCondition: 'halfCleared',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['screener'],
    members: [
      { role: 'screener', xOffset: -72, targetYOffset: 0, delaySeconds: 0, distanceOffset: 0 },
      { role: 'screener', xOffset: 0, targetYOffset: 0, delaySeconds: 0.08, distanceOffset: 8 },
      { role: 'screener', xOffset: 72, targetYOffset: 0, delaySeconds: 0.16, distanceOffset: 16 }
    ],
    cue: {
      label: 'SCR',
      stroke: '#7cf7ff'
    }
  },
  {
    id: 'formation_escort',
    shape: 'escort',
    name: 'Escort Pair',
    debugLabel: 'escort',
    summary: 'a durable body enters with a lane-holder close enough to matter',
    minSectorIndex: 2,
    minMembers: 2,
    maxMembers: 3,
    weight: 1.8,
    clearBonusSalvage: 2,
    spacing: 54,
    entryStyle: 'staggered',
    breakCondition: 'leaderDefeat',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['bruiser', 'screener'],
    members: [
      { role: 'bruiser', xOffset: 0, targetYOffset: -18, delaySeconds: 0, distanceOffset: 0 },
      { role: 'screener', xOffset: -54, targetYOffset: 24, delaySeconds: 0.12, distanceOffset: 14 },
      { role: 'screener', xOffset: 54, targetYOffset: 24, delaySeconds: 0.12, distanceOffset: 14 }
    ],
    cue: {
      label: 'ESC',
      stroke: '#f8fbff'
    }
  },
  {
    id: 'formation_pincer',
    shape: 'pincer',
    name: 'Phase Pincer',
    debugLabel: 'pincer',
    summary: 'flank entries make the player pick a side before the center fills',
    minSectorIndex: 2,
    minMembers: 2,
    maxMembers: 3,
    weight: 2.4,
    clearBonusSalvage: 1,
    spacing: 104,
    entryStyle: 'flank',
    breakCondition: 'halfCleared',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['scout'],
    members: [
      { role: 'scout', xOffset: -104, targetYOffset: 4, delaySeconds: 0, distanceOffset: 0 },
      { role: 'scout', xOffset: 104, targetYOffset: 4, delaySeconds: 0, distanceOffset: 0 },
      { role: 'scout', xOffset: 0, targetYOffset: 34, delaySeconds: 0.2, distanceOffset: 24 }
    ],
    cue: {
      label: 'PIN',
      stroke: '#5fffd2'
    }
  },
  {
    id: 'formation_convoy',
    shape: 'convoy',
    name: 'Salvage Convoy',
    debugLabel: 'convoy',
    summary: 'a protected trail enters as a small moving priority chain',
    minSectorIndex: 2,
    minMembers: 2,
    maxMembers: 3,
    weight: 1.9,
    clearBonusSalvage: 2,
    spacing: 52,
    entryStyle: 'staggered',
    breakCondition: 'leaderDefeat',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['bruiser'],
    members: [
      { role: 'bruiser', xOffset: -36, targetYOffset: -24, delaySeconds: 0, distanceOffset: 0 },
      { role: 'bruiser', xOffset: 0, targetYOffset: 18, delaySeconds: 0.16, distanceOffset: 22 },
      { role: 'bruiser', xOffset: 42, targetYOffset: 58, delaySeconds: 0.32, distanceOffset: 44 }
    ],
    cue: {
      label: 'CNV',
      stroke: '#ff7a48'
    }
  },
  {
    id: 'formation_ring',
    shape: 'ring',
    name: 'Bloom Ring',
    debugLabel: 'ring',
    summary: 'four ships bracket a circular danger read without filling the screen',
    minSectorIndex: 3,
    minMembers: 4,
    maxMembers: 4,
    weight: 1.4,
    clearBonusSalvage: 2,
    spacing: 62,
    entryStyle: 'orbit',
    breakCondition: 'halfCleared',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['disruptor', 'scout'],
    members: [
      { role: 'disruptor', xOffset: 0, targetYOffset: -62, delaySeconds: 0, distanceOffset: 0 },
      { role: 'disruptor', xOffset: -62, targetYOffset: 0, delaySeconds: 0.1, distanceOffset: 14 },
      { role: 'disruptor', xOffset: 62, targetYOffset: 0, delaySeconds: 0.1, distanceOffset: 14 },
      { role: 'disruptor', xOffset: 0, targetYOffset: 62, delaySeconds: 0.2, distanceOffset: 28 }
    ],
    cue: {
      label: 'RNG',
      stroke: '#87ff9a'
    }
  },
  {
    id: 'formation_staggered_lane',
    shape: 'staggeredLane',
    name: 'Staggered Lane',
    debugLabel: 'stagger',
    summary: 'offset lane-holders arrive in a beat pattern instead of a flat wall',
    minSectorIndex: 1,
    minMembers: 2,
    maxMembers: 3,
    weight: 2.2,
    clearBonusSalvage: 1,
    spacing: 58,
    entryStyle: 'staggered',
    breakCondition: 'none',
    cleanupPolicy: 'requiredTargets',
    preferredRoles: ['screener', 'disruptor'],
    members: [
      { role: 'screener', xOffset: -58, targetYOffset: -18, delaySeconds: 0, distanceOffset: 0 },
      { role: 'screener', xOffset: 28, targetYOffset: 18, delaySeconds: 0.16, distanceOffset: 18 },
      { role: 'disruptor', xOffset: 92, targetYOffset: 54, delaySeconds: 0.32, distanceOffset: 36 }
    ],
    cue: {
      label: 'STG',
      stroke: '#ff6bd6'
    }
  }
];

const ENEMY_FORMATIONS_BY_ID = new Map<EnemyFormationId, EnemyFormationDefinition>(
  ENEMY_FORMATIONS.map((formation) => [formation.id, formation])
);

export function getEnemyFormationById(id: EnemyFormationId): EnemyFormationDefinition {
  const formation = ENEMY_FORMATIONS_BY_ID.get(id);

  if (!formation) {
    throw new Error(`Unknown enemy formation id: ${id}`);
  }

  return formation;
}

export function getEligibleEnemyFormations(
  context: EnemyFormationSelectionContext
): readonly EnemyFormationDefinition[] {
  if (context.spawnCount < 2) {
    return [];
  }

  const availableFactionIds = getAvailableFactionIds(context.availableFactionIds);

  return ENEMY_FORMATIONS.filter((formation) => {
    if (context.sectorIndex < formation.minSectorIndex) {
      return false;
    }

    if (context.spawnCount < formation.minMembers || context.spawnCount > formation.maxMembers) {
      return false;
    }

    if (
      formation.encounterTypes &&
      formation.encounterTypes.length > 0 &&
      !formation.encounterTypes.includes(context.encounterType)
    ) {
      return false;
    }

    return availableFactionIds.some((factionId) =>
      getFactionById(factionId).enemyRole.formationEligibility.includes(formation.shape)
    );
  });
}

export function chooseEnemyFormation(
  context: EnemyFormationSelectionContext,
  rng: Rng
): EnemyFormationId | null {
  const eligibleFormations = getEligibleEnemyFormations(context);
  const chance = getEnemyFormationChance(context);

  if (
    eligibleFormations.length === 0 ||
    chance <= 0 ||
    (!context.formationCluster && rng.nextFloat() >= chance)
  ) {
    return null;
  }

  return rng.weightedChoice(
    eligibleFormations.map((formation) => ({
      item: formation.id,
      weight: getEnemyFormationSelectionWeight(context, formation)
    }))
  );
}

export function getEnemyFormationSelectionWeight(
  context: EnemyFormationSelectionContext,
  formation: EnemyFormationDefinition
): number {
  const preferredMetadata = getFactionById(context.preferredFactionId).enemyRole;
  const preferredRoleMultiplier = formation.preferredRoles?.includes(preferredMetadata.role)
    ? 1.4
    : 1;
  const preferredShapeMultiplier = preferredMetadata.formationEligibility.includes(formation.shape)
    ? 1.25
    : 1;
  const routeMultiplier = context.routePressure
    ? getRoutePressureFormationMultiplier(formation.shape)
    : 1;
  const encounterMultiplier = getEncounterFormationMultiplier(
    context.encounterType,
    formation.shape
  );
  const clusterMultiplier =
    context.formationCluster && ['escort', 'convoy', 'pincer', 'ring'].includes(formation.shape)
      ? 1.22
      : 1;
  const challengeMultiplier =
    context.challenge && ['ring', 'staggeredLane', 'pincer'].includes(formation.shape) ? 1.14 : 1;
  const availableShapeMatches = getAvailableFactionIds(context.availableFactionIds).filter(
    (factionId) =>
      getFactionById(factionId).enemyRole.formationEligibility.includes(formation.shape)
  ).length;
  const factionIdentityMultiplier = Math.min(
    1.3,
    1 + Math.max(0, availableShapeMatches - 1) * 0.06
  );

  return (
    formation.weight *
    preferredRoleMultiplier *
    preferredShapeMultiplier *
    routeMultiplier *
    encounterMultiplier *
    clusterMultiplier *
    challengeMultiplier *
    factionIdentityMultiplier
  );
}

export function getEnemyFormationChance(context: EnemyFormationSelectionContext): number {
  if (context.spawnCount < 2) {
    return 0;
  }

  let chance = context.sectorIndex > 0 ? 0.62 : 0;

  if (context.sectorIndex >= 3) {
    chance += 0.08;
  }

  if (context.elite || context.encounterType === 'elite') {
    chance += 0.08;
  }

  if (context.encounterType === 'ambush') {
    chance += 0.08;
  }

  if (context.routePressure) {
    chance += 0.06;
  }

  if (context.formationCluster) {
    chance += 0.18;
  }

  if (context.challenge) {
    chance += 0.06;
  }

  return Math.min(
    context.formationCluster ? 0.96 : 0.86,
    Math.max(0, Math.round(chance * 1000) / 1000)
  );
}

export function chooseFormationMemberFaction(
  context: EnemyFormationSelectionContext,
  formation: EnemyFormationDefinition,
  member: EnemyFormationMemberDefinition,
  fallbackFactionId: FactionId,
  rng: Rng
): FactionId {
  const availableFactionIds = getAvailableFactionIds(context.availableFactionIds);
  const exactRoleMatches = availableFactionIds.filter((factionId) => {
    const metadata = getFactionById(factionId).enemyRole;

    return metadata.role === member.role && metadata.formationEligibility.includes(formation.shape);
  });

  if (exactRoleMatches.length > 0) {
    return rng.choice(exactRoleMatches);
  }

  const shapeMatches = availableFactionIds.filter((factionId) =>
    getFactionById(factionId).enemyRole.formationEligibility.includes(formation.shape)
  );

  if (shapeMatches.length > 0) {
    return rng.choice(shapeMatches);
  }

  return fallbackFactionId;
}

function getRoutePressureFormationMultiplier(shape: EnemyFormationShape): number {
  switch (shape) {
    case 'convoy':
    case 'escort':
      return 1.28;
    case 'pincer':
    case 'staggeredLane':
      return 1.18;
    case 'screen':
      return 1.1;
    default:
      return 1;
  }
}

function getEncounterFormationMultiplier(
  encounterType: EnemyVariantEncounterType,
  shape: EnemyFormationShape
): number {
  if (encounterType === 'ambush' && (shape === 'pincer' || shape === 'wedge')) {
    return 1.35;
  }

  if (encounterType === 'elite' && ['escort', 'screen', 'column'].includes(shape)) {
    return 1.24;
  }

  if (encounterType === 'bossGate' && ['escort', 'convoy', 'ring'].includes(shape)) {
    return 1.18;
  }

  return 1;
}

function getAvailableFactionIds(availableFactionIds: readonly FactionId[]): readonly FactionId[] {
  return availableFactionIds.length > 0
    ? availableFactionIds
    : [
        'faction_scrap_court',
        'faction_corporate_ledger',
        'faction_bloom_hive',
        'faction_void_corsairs'
      ];
}
