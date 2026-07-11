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
  | 'act2_bloom_graft_cache'
  | 'act3_lawwright_exchange'
  | 'act3_anchor_hunt'
  | 'act3_impossible_vault'
  | 'act3_mobile_drydock'
  | 'act3_parallax_cut'
  | 'act3_claim_war';

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
  | 'pressure'
  | 'frontier'
  | 'engineering';

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
  'pressure',
  'frontier',
  'engineering'
];

const ACT_III_SECTOR_IDS: readonly SectorId[] = [
  'sector_nullglass_expanse',
  'sector_gravity_choir',
  'sector_dead_signal_reef',
  'sector_parallax_foundry',
  'sector_horizon_scar'
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
  },
  {
    id: 'act3_lawwright_exchange', actId: 'act_null_frontier', kind: 'shop', label: 'Lawwright Exchange',
    routeCardCopy: 'trade for modules proven under the current frontier law', environmentalPressureHint: 'the exchange stabilizes one hazard window',
    rewardTierHint: 'escalated stock with engineering-tag bias', pressureHint: 'low combat pressure, expensive certainty', tags: ['frontier', 'engineering', 'economy'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ['sector_parallax_foundry'] }, factionFit: ['faction_corporate_ledger'],
    backgroundHooks: ['background_parallax_foundry'], objectiveFamilies: ['clearWaves', 'defeatBoss'], requiredUnlockIds: [], weight: 6, riskOffset: -1
  },
  {
    id: 'act3_anchor_hunt', actId: 'act_null_frontier', kind: 'elite', label: 'Anchor Hunt',
    routeCardCopy: 'hunt a law-proof command hull for frontier-grade salvage', environmentalPressureHint: 'the local law intensifies around elite anchors',
    rewardTierHint: 'boss-grade salvage and stronger component quality', pressureHint: 'critical combat pressure without added hull inflation', tags: ['frontier', 'bossApproach', 'pressure'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ['sector_gravity_choir', 'sector_horizon_scar'] }, factionFit: ['faction_scrap_court', 'faction_void_corsairs'],
    backgroundHooks: ['background_gravity_choir', 'background_horizon_scar'], objectiveFamilies: ['clearWaves', 'defeatBoss'], requiredUnlockIds: [], weight: 7, riskOffset: 1
  },
  {
    id: 'act3_impossible_vault', actId: 'act_null_frontier', kind: 'vault', label: 'Impossible Vault',
    routeCardCopy: 'open a cache whose lock obeys a different physical law', environmentalPressureHint: 'curse exposure arrives through mirrored threat lanes',
    rewardTierHint: 'frontier relic pool plus an engineering component', pressureHint: 'high build variance and law-driven hazards', tags: ['frontier', 'relic', 'hazard'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ['sector_nullglass_expanse', 'sector_dead_signal_reef'] }, factionFit: ['faction_void_corsairs', 'faction_bloom_hive'],
    backgroundHooks: ['background_nullglass_expanse', 'background_dead_signal_reef'], objectiveFamilies: ['clearWaves', 'defeatBoss'], requiredUnlockIds: [], weight: 6, riskOffset: 1
  },
  {
    id: 'act3_mobile_drydock', actId: 'act_null_frontier', kind: 'repair', label: 'Mobile Drydock',
    routeCardCopy: 'brace the hull and hot-swap one frontier component', environmentalPressureHint: 'a protected machinery wake suppresses one hazard',
    rewardTierHint: 'repair plus engineering salvage', pressureHint: 'low immediate pressure with a narrower reward ceiling', tags: ['frontier', 'repair', 'engineering'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ['sector_parallax_foundry', 'sector_dead_signal_reef'] }, factionFit: ['faction_scrap_court'],
    backgroundHooks: ['background_parallax_foundry', 'background_dead_signal_reef'], objectiveFamilies: ['clearWaves'], requiredUnlockIds: [], weight: 5, riskOffset: -1
  },
  {
    id: 'act3_parallax_cut', actId: 'act_null_frontier', kind: 'glitch', label: 'Parallax Cut',
    routeCardCopy: 'splice two frontier readings into a volatile reward route', environmentalPressureHint: 'the sector law changes cadence without hiding telegraphs',
    rewardTierHint: 'extra choice with phase, heat, and curse bias', pressureHint: 'high variance pressure and a shortened escape window', tags: ['frontier', 'seedShear', 'hazard'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ['sector_nullglass_expanse', 'sector_horizon_scar'] }, factionFit: ['faction_void_corsairs'],
    backgroundHooks: ['background_nullglass_expanse', 'background_horizon_scar'], objectiveFamilies: ['clearWaves', 'defeatBoss'], requiredUnlockIds: [], weight: 6, riskOffset: 1
  },
  {
    id: 'act3_claim_war', actId: 'act_null_frontier', kind: 'factionAmbush', label: 'Claim War',
    routeCardCopy: 'choose which faction owns the survey claim and fight the loser', environmentalPressureHint: 'faction crossfire follows the active frontier law',
    rewardTierHint: 'focused faction cache and campaign influence', pressureHint: 'high combat pressure with a persistent faction consequence', tags: ['frontier', 'faction', 'pressure'],
    sectorFit: { allowedSectorIds: ACT_III_SECTOR_IDS, preferredSectorIds: ACT_III_SECTOR_IDS }, factionFit: ['faction_scrap_court', 'faction_corporate_ledger', 'faction_bloom_hive', 'faction_void_corsairs'],
    backgroundHooks: ['background_nullglass_expanse', 'background_gravity_choir', 'background_dead_signal_reef', 'background_parallax_foundry', 'background_horizon_scar'], objectiveFamilies: ['clearWaves', 'defeatBoss'], requiredUnlockIds: [], weight: 8, riskOffset: 1
  }
];

export function getActRouteContractById(id: ActRouteContractId): ActRouteContractDefinition {
  const contract = ACT_ROUTE_CONTRACTS.find((candidate) => candidate.id === id);

  if (!contract) {
    throw new Error(`Unknown act route contract: ${id}`);
  }

  return contract;
}
