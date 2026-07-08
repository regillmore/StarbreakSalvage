import type { ActId, ActRouteKind } from './acts';
import type { BackgroundId } from './backgrounds';
import type { FactionId } from './factions';
import type { SectorId, SectorObjectiveKind } from './sectors';
import type { UnlockId } from './unlocks';

export type ActRouteContractId =
  | 'act2_core_broker_permit'
  | 'act2_overseer_bounty'
  | 'act2_relic_undertow'
  | 'act2_field_suture'
  | 'act2_seed_shear'
  | 'act2_faction_heist'
  | 'act2_bloom_graft_cache';

export type ActRouteTag =
  | 'deepMarket'
  | 'bossApproach'
  | 'relic'
  | 'repair'
  | 'seedShear'
  | 'faction'
  | 'lunar'
  | 'bio'
  | 'core'
  | 'economy'
  | 'hazard'
  | 'pressure';

export interface ActRouteContractDefinition {
  readonly id: ActRouteContractId;
  readonly actId: ActId;
  readonly kind: ActRouteKind;
  readonly label: string;
  readonly routeCardCopy: string;
  readonly environmentalPressureHint: string;
  readonly rewardTierHint: string;
  readonly pressureHint: string;
  readonly tags: readonly ActRouteTag[];
  readonly sectorFit: {
    readonly allowedSectorIds: readonly SectorId[];
    readonly preferredSectorIds: readonly SectorId[];
  };
  readonly factionFit: readonly FactionId[];
  readonly backgroundHooks: readonly BackgroundId[];
  readonly objectiveFamilies: readonly SectorObjectiveKind[];
  readonly requiredUnlockIds: readonly UnlockId[];
  readonly weight: number;
  readonly riskOffset: number;
}

export const ACT_ROUTE_TAGS: readonly ActRouteTag[] = [
  'deepMarket',
  'bossApproach',
  'relic',
  'repair',
  'seedShear',
  'faction',
  'lunar',
  'bio',
  'core',
  'economy',
  'hazard',
  'pressure'
];

const ACT_II_NON_OPENING_SECTOR_IDS: readonly SectorId[] = [
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid',
  'sector_lunar_surface',
  'sector_core_wreck'
];

export const ACT_ROUTE_CONTRACTS: readonly ActRouteContractDefinition[] = [
  {
    id: 'act2_core_broker_permit',
    actId: 'act_core_descent',
    kind: 'shop',
    label: 'Core Broker Permit',
    routeCardCopy: 'spend credits at a pressure-rated market with deeper stock notes',
    environmentalPressureHint: 'stable dock lane with fewer surprise hazards before launch',
    rewardTierHint: 'escalated shop stock and price pressure',
    pressureHint: 'low combat pressure, high economy commitment',
    tags: ['deepMarket', 'economy', 'core'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_trade_war_corridor', 'sector_core_wreck']
    },
    factionFit: ['faction_corporate_ledger', 'faction_scrap_court'],
    backgroundHooks: ['background_trade_war_corridor', 'background_core_wreck'],
    objectiveFamilies: ['clearWaves', 'defeatBoss'],
    requiredUnlockIds: [],
    weight: 6,
    riskOffset: -1
  },
  {
    id: 'act2_overseer_bounty',
    actId: 'act_core_descent',
    kind: 'elite',
    label: 'Overseer Bounty',
    routeCardCopy: 'challenge an Act II overseer screen for sharper reward selection',
    environmentalPressureHint: 'formation lanes are more likely to stack near hazards',
    rewardTierHint: 'escalated salvage plus an extra reward look',
    pressureHint: 'high combat pressure with boss-approach implications',
    tags: ['bossApproach', 'pressure', 'core'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_corporate_kill_grid', 'sector_core_wreck']
    },
    factionFit: ['faction_corporate_ledger', 'faction_void_corsairs'],
    backgroundHooks: ['background_corporate_kill_grid', 'background_core_wreck'],
    objectiveFamilies: ['defeatBoss', 'clearWaves'],
    requiredUnlockIds: [],
    weight: 7,
    riskOffset: 1
  },
  {
    id: 'act2_relic_undertow',
    actId: 'act_core_descent',
    kind: 'vault',
    label: 'Relic Undertow',
    routeCardCopy: 'cut into a deep vault for volatile relic files and curse exposure',
    environmentalPressureHint: 'vault doors sit close to unstable lanes and late telegraphs',
    rewardTierHint: 'vault-tier relic pool with Act II rarity pressure',
    pressureHint: 'medium combat pressure, high build variance',
    tags: ['relic', 'hazard', 'core'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_core_wreck', 'sector_lunar_surface']
    },
    factionFit: ['faction_scrap_court', 'faction_void_corsairs'],
    backgroundHooks: ['background_core_wreck', 'background_lunar_surface'],
    objectiveFamilies: ['clearWaves', 'defeatBoss'],
    requiredUnlockIds: [],
    weight: 5,
    riskOffset: 0
  },
  {
    id: 'act2_field_suture',
    actId: 'act_core_descent',
    kind: 'repair',
    label: 'Field Suture',
    routeCardCopy: 'trade credits for a fast hull brace before the deeper wave stack',
    environmentalPressureHint: 'repair lanes favor readable corridors over dense clutter',
    rewardTierHint: 'safer reward bias with Act II credit tension',
    pressureHint: 'low combat pressure, low immediate reward ceiling',
    tags: ['repair', 'economy'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_trade_war_corridor', 'sector_lunar_surface']
    },
    factionFit: ['faction_scrap_court', 'faction_corporate_ledger'],
    backgroundHooks: ['background_trade_war_corridor', 'background_lunar_surface'],
    objectiveFamilies: ['clearWaves'],
    requiredUnlockIds: [],
    weight: 4,
    riskOffset: -1
  },
  {
    id: 'act2_seed_shear',
    actId: 'act_core_descent',
    kind: 'glitch',
    label: 'Seed Shear',
    routeCardCopy: 'bend the Act II route seed for strange rewards and unstable pacing',
    environmentalPressureHint: 'hazard timing may feel less regular after the shear',
    rewardTierHint: 'extra reward choice with phase and heat bias',
    pressureHint: 'high variance pressure with possible curse exposure',
    tags: ['seedShear', 'hazard', 'pressure'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_bio_machine_bloom', 'sector_core_wreck']
    },
    factionFit: ['faction_void_corsairs', 'faction_bloom_hive'],
    backgroundHooks: ['background_bio_machine_bloom', 'background_core_wreck'],
    objectiveFamilies: ['clearWaves', 'defeatBoss'],
    requiredUnlockIds: [],
    weight: 5,
    riskOffset: 1
  },
  {
    id: 'act2_faction_heist',
    actId: 'act_core_descent',
    kind: 'factionAmbush',
    label: 'Faction Heist',
    routeCardCopy: 'spoof a deeper convoy for focused drops and an angry escort',
    environmentalPressureHint: 'escort lanes favor faction-colored crossfire windows',
    rewardTierHint: 'focused faction cache with escalated salvage',
    pressureHint: 'high combat pressure with faction-specific reward bias',
    tags: ['faction', 'pressure', 'economy'],
    sectorFit: {
      allowedSectorIds: ACT_II_NON_OPENING_SECTOR_IDS,
      preferredSectorIds: ['sector_trade_war_corridor', 'sector_corporate_kill_grid']
    },
    factionFit: [
      'faction_scrap_court',
      'faction_corporate_ledger',
      'faction_bloom_hive',
      'faction_void_corsairs'
    ],
    backgroundHooks: ['background_trade_war_corridor', 'background_corporate_kill_grid'],
    objectiveFamilies: ['clearWaves', 'defeatBoss'],
    requiredUnlockIds: [],
    weight: 7,
    riskOffset: 1
  },
  {
    id: 'act2_bloom_graft_cache',
    actId: 'act_core_descent',
    kind: 'vault',
    label: 'Bloom Graft Cache',
    routeCardCopy: 'splice open an organic cache unlocked by the Bloom dossier',
    environmentalPressureHint: 'bio-lanes favor spores, dust fronts, and organic cover beats',
    rewardTierHint: 'vault-tier relic pool biased toward shield, curse, and bloom tech',
    pressureHint: 'medium spread pressure with strong build-shaping upside',
    tags: ['bio', 'relic', 'hazard'],
    sectorFit: {
      allowedSectorIds: ['sector_bio_machine_bloom', 'sector_lunar_surface', 'sector_core_wreck'],
      preferredSectorIds: ['sector_bio_machine_bloom']
    },
    factionFit: ['faction_bloom_hive'],
    backgroundHooks: ['background_bio_machine_bloom', 'background_lunar_surface'],
    objectiveFamilies: ['clearWaves'],
    requiredUnlockIds: ['unlock_faction_bloom_hive'],
    weight: 8,
    riskOffset: 0
  }
];

export function getActRouteContractById(id: ActRouteContractId): ActRouteContractDefinition {
  const contract = ACT_ROUTE_CONTRACTS.find((candidate) => candidate.id === id);

  if (!contract) {
    throw new Error(`Unknown act route contract: ${id}`);
  }

  return contract;
}
