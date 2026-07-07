import { getFactionById, type FactionId } from './factions';
import type { EnemyRoleId, EnemyVariantEligibility } from './enemyRoles';
import type { Rng } from '../core/rng';

export const ENEMY_VARIANT_IDS = [
  'variant_armored',
  'variant_overclocked',
  'variant_evasive',
  'variant_volatile',
  'variant_shielded',
  'variant_salvage_rich'
] as const;
export type EnemyVariantId = (typeof ENEMY_VARIANT_IDS)[number];

export const ENEMY_VARIANT_ENCOUNTER_TYPES = [
  'normal',
  'elite',
  'ambush',
  'bossGate',
  'debug'
] as const;
export type EnemyVariantEncounterType = (typeof ENEMY_VARIANT_ENCOUNTER_TYPES)[number];

export interface EnemyVariantCue {
  readonly label: string;
  readonly fill: string;
  readonly stroke: string;
}

export interface EnemyVariantDefinition {
  readonly id: EnemyVariantId;
  readonly name: string;
  readonly debugLabel: string;
  readonly summary: string;
  readonly eligibility: readonly EnemyVariantEligibility[];
  readonly minSectorIndex: number;
  readonly weight: number;
  readonly allowedRoles?: readonly EnemyRoleId[];
  readonly allowedFactions?: readonly FactionId[];
  readonly encounterTypes?: readonly EnemyVariantEncounterType[];
  readonly hullBonus: number;
  readonly fireDelayMultiplier: number;
  readonly driftMultiplier: number;
  readonly radiusScale: number;
  readonly bonusSalvage: number;
  readonly cue: EnemyVariantCue;
}

export interface EnemyVariantSelectionContext {
  readonly factionId: FactionId;
  readonly sectorIndex: number;
  readonly waveIndex: number;
  readonly spawnIndex: number;
  readonly waveLabel: string;
  readonly routePressure: boolean;
  readonly challenge: boolean;
  readonly elite: boolean;
  readonly encounterType: EnemyVariantEncounterType;
}

export const ENEMY_VARIANTS: readonly EnemyVariantDefinition[] = [
  {
    id: 'variant_armored',
    name: 'Armored',
    debugLabel: 'armored',
    summary: 'extra plating raises hull and broadens the silhouette without adding damage',
    eligibility: ['elite', 'lateSector', 'routePressure'],
    minSectorIndex: 1,
    weight: 3.4,
    allowedRoles: ['bruiser', 'screener'],
    hullBonus: 1,
    fireDelayMultiplier: 1.05,
    driftMultiplier: 0.96,
    radiusScale: 1.08,
    bonusSalvage: 0,
    cue: {
      label: 'ARM',
      fill: '#2a1712',
      stroke: '#ffd166'
    }
  },
  {
    id: 'variant_overclocked',
    name: 'Overclocked',
    debugLabel: 'overclock',
    summary: 'unstable reactor timing shortens attack cooldowns with a bright warning ring',
    eligibility: ['lateSector', 'routePressure', 'challenge'],
    minSectorIndex: 2,
    weight: 2.7,
    allowedRoles: ['screener', 'scout'],
    hullBonus: 0,
    fireDelayMultiplier: 0.82,
    driftMultiplier: 1.05,
    radiusScale: 1,
    bonusSalvage: 0,
    cue: {
      label: 'OVR',
      fill: '#20111f',
      stroke: '#ff6bd6'
    }
  },
  {
    id: 'variant_evasive',
    name: 'Evasive',
    debugLabel: 'evasive',
    summary: 'lighter frame widens lateral motion and slightly reduces the target profile',
    eligibility: ['elite', 'lateSector', 'challenge'],
    minSectorIndex: 2,
    weight: 2.3,
    allowedRoles: ['scout', 'disruptor'],
    hullBonus: 0,
    fireDelayMultiplier: 1.04,
    driftMultiplier: 1.34,
    radiusScale: 0.94,
    bonusSalvage: 0,
    cue: {
      label: 'EVA',
      fill: '#0d1b2a',
      stroke: '#7cf7ff'
    }
  },
  {
    id: 'variant_volatile',
    name: 'Volatile',
    debugLabel: 'volatile',
    summary: 'hot salvage core adds urgency and pays a small salvage premium on defeat',
    eligibility: ['lateSector', 'routePressure', 'challenge'],
    minSectorIndex: 2,
    weight: 2.1,
    allowedRoles: ['bruiser', 'disruptor'],
    hullBonus: 0,
    fireDelayMultiplier: 0.96,
    driftMultiplier: 1.12,
    radiusScale: 1.02,
    bonusSalvage: 1,
    cue: {
      label: 'VOL',
      fill: '#261018',
      stroke: '#ff7a48'
    }
  },
  {
    id: 'variant_shielded',
    name: 'Shielded',
    debugLabel: 'shielded',
    summary: 'visible barrier adds one hull and slightly slows attack pacing',
    eligibility: ['elite', 'lateSector'],
    minSectorIndex: 2,
    weight: 2.2,
    allowedRoles: ['screener', 'scout'],
    allowedFactions: ['faction_corporate_ledger', 'faction_void_corsairs'],
    hullBonus: 1,
    fireDelayMultiplier: 1.08,
    driftMultiplier: 0.98,
    radiusScale: 1.04,
    bonusSalvage: 1,
    cue: {
      label: 'SHD',
      fill: '#071d24',
      stroke: '#5fffd2'
    }
  },
  {
    id: 'variant_salvage_rich',
    name: 'Salvage-Rich',
    debugLabel: 'salvage',
    summary: 'marked cargo target changes priority by dropping extra salvage instead of pressure',
    eligibility: ['elite', 'lateSector', 'routePressure'],
    minSectorIndex: 1,
    weight: 1.8,
    hullBonus: 0,
    fireDelayMultiplier: 1,
    driftMultiplier: 1,
    radiusScale: 1,
    bonusSalvage: 2,
    cue: {
      label: 'PAY',
      fill: '#1b1a10',
      stroke: '#b8ff5f'
    }
  }
];

const ENEMY_VARIANTS_BY_ID = new Map<EnemyVariantId, EnemyVariantDefinition>(
  ENEMY_VARIANTS.map((variant) => [variant.id, variant])
);

export function getEnemyVariantById(id: EnemyVariantId): EnemyVariantDefinition {
  const variant = ENEMY_VARIANTS_BY_ID.get(id);

  if (!variant) {
    throw new Error(`Unknown enemy variant id: ${id}`);
  }

  return variant;
}

export function getEnemyVariantChance(context: EnemyVariantSelectionContext): number {
  const contextualEscalation =
    context.sectorIndex > 0 ||
    context.routePressure ||
    context.challenge ||
    context.elite ||
    context.encounterType !== 'normal';

  if (!contextualEscalation) {
    return 0;
  }

  let chance = 0;

  if (context.sectorIndex >= 1) {
    chance += 0.08;
  }

  if (context.sectorIndex >= 2) {
    chance += 0.07;
  }

  if (context.sectorIndex >= 4) {
    chance += 0.05;
  }

  if (context.elite || context.encounterType === 'elite') {
    chance += 0.16;
  }

  if (context.encounterType === 'ambush') {
    chance += 0.12;
  }

  if (context.encounterType === 'bossGate') {
    chance += 0.06;
  }

  if (context.routePressure) {
    chance += 0.12;
  }

  if (context.challenge) {
    chance += 0.14;
  }

  return clampVariantChance(chance);
}

export function getEligibleEnemyVariants(
  context: EnemyVariantSelectionContext
): readonly EnemyVariantDefinition[] {
  const faction = getFactionById(context.factionId);
  const role = faction.enemyRole.role;
  const contextEligibilities = getContextEligibilities(context);

  return ENEMY_VARIANTS.filter((variant) => {
    if (context.sectorIndex < variant.minSectorIndex) {
      return false;
    }

    if (
      variant.allowedRoles &&
      variant.allowedRoles.length > 0 &&
      !variant.allowedRoles.includes(role)
    ) {
      return false;
    }

    if (
      variant.allowedFactions &&
      variant.allowedFactions.length > 0 &&
      !variant.allowedFactions.includes(context.factionId)
    ) {
      return false;
    }

    if (
      variant.encounterTypes &&
      variant.encounterTypes.length > 0 &&
      !variant.encounterTypes.includes(context.encounterType)
    ) {
      return false;
    }

    return (
      intersects(variant.eligibility, faction.enemyRole.variantEligibility) &&
      intersects(variant.eligibility, contextEligibilities)
    );
  });
}

export function chooseEnemyVariant(
  context: EnemyVariantSelectionContext,
  rng: Rng
): EnemyVariantId | null {
  const eligibleVariants = getEligibleEnemyVariants(context);
  const chance = getEnemyVariantChance(context);

  if (eligibleVariants.length === 0 || chance <= 0 || rng.nextFloat() >= chance) {
    return null;
  }

  return rng.weightedChoice(
    eligibleVariants.map((variant) => ({
      item: variant.id,
      weight: variant.weight
    }))
  );
}

function getContextEligibilities(
  context: EnemyVariantSelectionContext
): readonly EnemyVariantEligibility[] {
  const eligibilities: EnemyVariantEligibility[] = ['baseline'];

  if (context.sectorIndex >= 2) {
    eligibilities.push('lateSector');
  }

  if (context.routePressure) {
    eligibilities.push('routePressure');
  }

  if (context.challenge) {
    eligibilities.push('challenge');
  }

  if (context.elite || context.encounterType === 'elite' || context.encounterType === 'ambush') {
    eligibilities.push('elite');
  }

  return eligibilities;
}

function intersects<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.some((value) => right.includes(value));
}

function clampVariantChance(value: number): number {
  return Math.min(0.48, Math.max(0, Math.round(value * 1000) / 1000));
}
