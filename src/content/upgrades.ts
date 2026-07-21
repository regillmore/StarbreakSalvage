export const UPGRADE_CATEGORIES = ['hangar', 'navigation', 'market', 'archive', 'salvage'] as const;

export const UPGRADE_ICON_KEYS = [
  'contract-scope',
  'route-radar',
  'market-tag',
  'vault-index',
  'scrap-ledger',
  'seed-map'
] as const;

export const UPGRADE_EFFECT_KINDS = [
  'contractBoard',
  'routeIntel',
  'shopTelemetry',
  'rewardVariety',
  'salvageLedger',
  'seedSurvey',
  'bossWarning',
  'bossRelief',
  'sectorTollRefund',
  'shopCouponCascade',
  'routeOreScrip',
  'routeLedgerSpool',
  'marketEchoLocator'
] as const;

export type UpgradeCategory = (typeof UPGRADE_CATEGORIES)[number];
export type UpgradeIconKey = (typeof UPGRADE_ICON_KEYS)[number];
export type UpgradeEffectKind = (typeof UPGRADE_EFFECT_KINDS)[number];

export type UpgradeId =
  | 'upgrade_contract_survey_rig'
  | 'upgrade_salvage_escrow_index'
  | 'upgrade_route_ledger_uplink'
  | 'upgrade_market_decoder'
  | 'upgrade_relic_pattern_dossier'
  | 'upgrade_seed_cartographer'
  | 'upgrade_boss_warning_lattice'
  | 'upgrade_capital_relief_protocol'
  | 'upgrade_exit_toll_transponder'
  | 'upgrade_coupon_cascade_fuse'
  | 'upgrade_low_orbit_ore_scrip'
  | 'upgrade_route_ledger_spool'
  | 'upgrade_market_echo_locator';

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly category: UpgradeCategory;
  readonly iconKey: UpgradeIconKey;
  readonly effectKind: UpgradeEffectKind;
  readonly name: string;
  readonly summary: string;
  readonly effect: string;
  readonly cost: number;
  readonly prerequisites: readonly UpgradeId[];
}

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: 'upgrade_contract_survey_rig',
    category: 'hangar',
    iconKey: 'contract-scope',
    effectKind: 'contractBoard',
    name: 'Contract Survey Rig',
    summary: 'hangar scanners that make future contract boards easier to read',
    effect: 'Future work can reveal one extra contract tendency before launch.',
    cost: 4,
    prerequisites: []
  },
  {
    id: 'upgrade_salvage_escrow_index',
    category: 'salvage',
    iconKey: 'scrap-ledger',
    effectKind: 'salvageLedger',
    name: 'Salvage Escrow Index',
    summary: 'a ledger that tracks what banked scrap can unlock next',
    effect: 'Future summaries can surface newly affordable upgrade options.',
    cost: 3,
    prerequisites: []
  },
  {
    id: 'upgrade_route_ledger_uplink',
    category: 'navigation',
    iconKey: 'route-radar',
    effectKind: 'routeIntel',
    name: 'Route Ledger Uplink',
    summary: 'navigation records that preview route pressure without lowering it',
    effect: 'Future route screens can reveal one additional risk clue.',
    cost: 6,
    prerequisites: ['upgrade_contract_survey_rig']
  },
  {
    id: 'upgrade_market_decoder',
    category: 'market',
    iconKey: 'market-tag',
    effectKind: 'shopTelemetry',
    name: 'Market Decoder',
    summary: 'shop telemetry that helps pilots read prices and rerolls',
    effect: 'Future shops can expose one extra inventory or discount hint.',
    cost: 7,
    prerequisites: ['upgrade_salvage_escrow_index']
  },
  {
    id: 'upgrade_relic_pattern_dossier',
    category: 'archive',
    iconKey: 'vault-index',
    effectKind: 'rewardVariety',
    name: 'Relic Pattern Dossier',
    summary: 'archive notes that widen vault and relic decision space',
    effect: 'Future vault rewards can add a clearer relic-biased option.',
    cost: 8,
    prerequisites: ['upgrade_route_ledger_uplink']
  },
  {
    id: 'upgrade_seed_cartographer',
    category: 'navigation',
    iconKey: 'seed-map',
    effectKind: 'seedSurvey',
    name: 'Seed Cartographer',
    summary: 'map fragments that make seeded sectors easier to compare',
    effect: 'Future seed previews can show one sector modifier before launch.',
    cost: 10,
    prerequisites: ['upgrade_route_ledger_uplink']
  },
  {
    id: 'upgrade_boss_warning_lattice',
    category: 'navigation',
    iconKey: 'route-radar',
    effectKind: 'bossWarning',
    name: 'Boss Warning Lattice',
    summary: 'phase-change telemetry that makes capital attacks easier to read',
    effect: 'Boss phase shifts add 0.20 sec of warning and delay the next attack by 0.15 sec.',
    cost: 8,
    prerequisites: ['upgrade_route_ledger_uplink']
  },
  {
    id: 'upgrade_capital_relief_protocol',
    category: 'hangar',
    iconKey: 'contract-scope',
    effectKind: 'bossRelief',
    name: 'Capital Relief Protocol',
    summary: 'a permanent pressure break for deep boss phases',
    effect: 'Boss phase shifts feed 12% special charge; late phases also clear hostile shots.',
    cost: 12,
    prerequisites: ['upgrade_boss_warning_lattice']
  },
  {
    id: 'upgrade_exit_toll_transponder',
    category: 'salvage',
    iconKey: 'scrap-ledger',
    effectKind: 'sectorTollRefund',
    name: 'Exit Toll Transponder',
    summary: 'a permanent customs refund wired into every expedition hull',
    effect: 'Each sector begins with a 1-3 credit refund, scaling through the act.',
    cost: 9,
    prerequisites: ['upgrade_salvage_escrow_index']
  },
  {
    id: 'upgrade_coupon_cascade_fuse',
    category: 'market',
    iconKey: 'market-tag',
    effectKind: 'shopCouponCascade',
    name: 'Coupon Cascade Fuse',
    summary: 'a permanent pricing fuse threaded through every expedition market link',
    effect: 'Every shop trims prices by 1 credit and favors credit-tagged stock.',
    cost: 10,
    prerequisites: ['upgrade_market_decoder']
  },
  {
    id: 'upgrade_low_orbit_ore_scrip',
    category: 'navigation',
    iconKey: 'route-radar',
    effectKind: 'routeOreScrip',
    name: 'Low-Orbit Ore Scrip',
    summary: 'a standing ore-credit agreement accepted along stable carrier lanes',
    effect: 'Shop and Repair destinations refund 1 credit after route settlement.',
    cost: 8,
    prerequisites: ['upgrade_route_ledger_uplink']
  },
  {
    id: 'upgrade_route_ledger_spool',
    category: 'navigation',
    iconKey: 'route-radar',
    effectKind: 'routeLedgerSpool',
    name: 'Route Ledger Spool',
    summary: 'a permanent settlement spool threaded through every route contract',
    effect: 'Every route reward cash-out carries 1 additional credit.',
    cost: 9,
    prerequisites: ['upgrade_route_ledger_uplink']
  },
  {
    id: 'upgrade_market_echo_locator',
    category: 'market',
    iconKey: 'market-tag',
    effectKind: 'marketEchoLocator',
    name: 'Market Echo Locator',
    summary: 'a standing echo array that reads carrier-market reward traffic',
    effect: 'Shop and Repair rewards gain one extra credit/magnet-biased choice.',
    cost: 11,
    prerequisites: ['upgrade_market_decoder']
  }
];

export function getUpgradeById(
  id: UpgradeId,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): UpgradeDefinition {
  const upgrade = upgrades.find((candidate) => candidate.id === id);

  if (!upgrade) {
    throw new Error(`Unknown upgrade id: ${id}`);
  }

  return upgrade;
}
