import type { ItemTag } from '../content/items';
import { UPGRADES, type UpgradeId } from '../content/upgrades';
import type { RewardContextKind } from './Rewards';

export interface BossPhaseUpgradeEffects {
  readonly attackCooldownSeconds: number;
  readonly telegraphSeconds: number;
  readonly specialChargeGain: number;
  readonly clearEnemyProjectilesAtPhase: number | null;
}

export interface SectorStartUpgradeEffects {
  readonly exitTollRefund: boolean;
  readonly surfaceBeaconDrone: boolean;
  readonly craterShadowLens: boolean;
}

export interface SurfaceBeaconSectorStartBonus {
  readonly salvageBonus: number;
  readonly specialChargeBonus: number;
}

export interface RouteChosenUpgradeEffects {
  readonly lowOrbitOreRefund: boolean;
  readonly routeLedgerRewardCredit: boolean;
  readonly ambushInsuranceStamp: boolean;
}

export interface RunUpgradeEffects {
  readonly purchasedUpgradeIds: readonly UpgradeId[];
  readonly activeUpgradeIds: readonly UpgradeId[];
  readonly activeUpgradeNames: readonly string[];
  readonly contractBoardSlots: number;
  readonly contractSurvey: boolean;
  readonly routeIntel: boolean;
  readonly shopStockBonus: number;
  readonly shopDiscount: number;
  readonly shopBiasTags: readonly ItemTag[];
  readonly shopCouponCascade: boolean;
  readonly convoyReceiptPrinter: boolean;
  readonly rewardChoiceBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly marketEchoLocator: boolean;
  readonly miningLaserTransit: boolean;
  readonly seedSurvey: boolean;
  readonly sectorStart: SectorStartUpgradeEffects;
  readonly routeChosen: RouteChosenUpgradeEffects;
  readonly bossPhase: BossPhaseUpgradeEffects;
}

export function resolveRunUpgradeEffects(
  purchasedUpgradeIds: readonly UpgradeId[] = []
): RunUpgradeEffects {
  const purchasedIds = new Set(purchasedUpgradeIds);
  const activeUpgrades = UPGRADES.filter((upgrade) => purchasedIds.has(upgrade.id));
  const hasUpgrade = (upgradeId: UpgradeId): boolean => purchasedIds.has(upgradeId);
  const hasContractSurvey = hasUpgrade('upgrade_contract_survey_rig');
  const hasMarketDecoder = hasUpgrade('upgrade_market_decoder');
  const hasRelicDossier = hasUpgrade('upgrade_relic_pattern_dossier');
  const hasBossWarning = hasUpgrade('upgrade_boss_warning_lattice');
  const hasCapitalRelief = hasUpgrade('upgrade_capital_relief_protocol');

  return {
    purchasedUpgradeIds: activeUpgrades.map((upgrade) => upgrade.id),
    activeUpgradeIds: activeUpgrades.map((upgrade) => upgrade.id),
    activeUpgradeNames: activeUpgrades.map((upgrade) => upgrade.name),
    contractBoardSlots: hasContractSurvey ? 4 : 3,
    contractSurvey: hasContractSurvey,
    routeIntel: hasUpgrade('upgrade_route_ledger_uplink'),
    shopStockBonus: hasMarketDecoder ? 1 : 0,
    shopDiscount: hasMarketDecoder ? 1 : 0,
    shopBiasTags: hasMarketDecoder ? ['credit', 'heat'] : [],
    shopCouponCascade: hasUpgrade('upgrade_coupon_cascade_fuse'),
    convoyReceiptPrinter: hasUpgrade('upgrade_convoy_receipt_printer'),
    rewardChoiceBonus: hasRelicDossier ? 1 : 0,
    rewardBiasTags: hasRelicDossier ? ['relic', 'curse', 'phase'] : [],
    marketEchoLocator: hasUpgrade('upgrade_market_echo_locator'),
    miningLaserTransit: hasUpgrade('upgrade_mining_laser_transit'),
    seedSurvey: hasUpgrade('upgrade_seed_cartographer'),
    sectorStart: {
      exitTollRefund: hasUpgrade('upgrade_exit_toll_transponder'),
      surfaceBeaconDrone: hasUpgrade('upgrade_surface_beacon_drone'),
      craterShadowLens: hasUpgrade('upgrade_crater_shadow_lens')
    },
    routeChosen: {
      lowOrbitOreRefund: hasUpgrade('upgrade_low_orbit_ore_scrip'),
      routeLedgerRewardCredit: hasUpgrade('upgrade_route_ledger_spool'),
      ambushInsuranceStamp: hasUpgrade('upgrade_ambush_insurance_stamp')
    },
    bossPhase: {
      attackCooldownSeconds: hasBossWarning ? 0.15 : 0,
      telegraphSeconds: hasBossWarning ? 0.2 : 0,
      specialChargeGain: hasCapitalRelief ? 0.12 : 0,
      clearEnemyProjectilesAtPhase: hasCapitalRelief ? 2 : null
    }
  };
}

export function formatRunUpgradeEffects(effects: RunUpgradeEffects): string {
  return effects.activeUpgradeNames.length > 0 ? effects.activeUpgradeNames.join(', ') : 'none';
}

export function getRunUpgradeDebugLabels(effects: RunUpgradeEffects): string[] {
  const labels: string[] = [];

  if (effects.contractSurvey) {
    labels.push('contract survey');
  }

  if (effects.routeIntel) {
    labels.push('route intel');
  }

  if (effects.shopStockBonus > 0 || effects.shopDiscount > 0) {
    labels.push(`shop +${effects.shopStockBonus}/-${effects.shopDiscount}`);
  }

  if (effects.shopCouponCascade) {
    labels.push('coupon cascade');
  }

  if (effects.convoyReceiptPrinter) {
    labels.push('convoy receipts');
  }

  if (effects.rewardChoiceBonus > 0) {
    labels.push(`vault +${effects.rewardChoiceBonus}`);
  }

  if (effects.marketEchoLocator) {
    labels.push('market echo');
  }

  if (effects.miningLaserTransit) {
    labels.push('mining laser transit');
  }

  if (effects.seedSurvey) {
    labels.push('seed map');
  }

  if (effects.sectorStart.exitTollRefund) {
    labels.push('exit toll refund');
  }

  if (effects.sectorStart.surfaceBeaconDrone) {
    labels.push('surface beacon');
  }

  if (effects.sectorStart.craterShadowLens) {
    labels.push('crater shadow lens');
  }

  if (effects.routeChosen.lowOrbitOreRefund) {
    labels.push('ore scrip refund');
  }

  if (effects.routeChosen.routeLedgerRewardCredit) {
    labels.push('route ledger cash-out');
  }

  if (effects.routeChosen.ambushInsuranceStamp) {
    labels.push('ambush insurance');
  }

  if (effects.bossPhase.telegraphSeconds > 0) {
    labels.push('boss warning');
  }

  if (effects.bossPhase.clearEnemyProjectilesAtPhase !== null) {
    labels.push('capital relief');
  }

  return labels;
}

export function getExitTollCreditRefund(
  effects: SectorStartUpgradeEffects | null,
  sectorIndex: number
): number {
  return effects?.exitTollRefund ? Math.min(3, Math.max(1, Math.floor(sectorIndex))) : 0;
}

export function getSurfaceBeaconSectorStartBonus(
  effects: SectorStartUpgradeEffects | null,
  sectorId: string,
  legacyItemActive = false
): SurfaceBeaconSectorStartBonus {
  const active = effects?.surfaceBeaconDrone && !legacyItemActive && sectorId.includes('lunar');
  return active
    ? { salvageBonus: 1, specialChargeBonus: 0.05 }
    : { salvageBonus: 0, specialChargeBonus: 0 };
}

export function getCraterShadowLensSpecialChargeBonus(
  effects: SectorStartUpgradeEffects | null,
  sectorId: string,
  legacyItemActive = false
): number {
  if (!effects?.craterShadowLens || legacyItemActive) return 0;
  return sectorId.includes('lunar') ? 0.08 : 0.02;
}

export function getLowOrbitOreScripCreditRefund(
  effects: RouteChosenUpgradeEffects | null,
  routeKind: RewardContextKind
): number {
  return effects?.lowOrbitOreRefund && (routeKind === 'shop' || routeKind === 'repair') ? 1 : 0;
}

export function getRouteLedgerSpoolRewardCreditBonus(
  effects: RouteChosenUpgradeEffects | null
): number {
  return effects?.routeLedgerRewardCredit ? 1 : 0;
}

export function getAmbushInsuranceStampSalvageClaim(
  effects: RouteChosenUpgradeEffects | null,
  routeKind: RewardContextKind,
  legacyItemActive = false
): number {
  return effects?.ambushInsuranceStamp &&
    !legacyItemActive &&
    (routeKind === 'elite' || routeKind === 'factionAmbush')
    ? 1
    : 0;
}

export function getAmbushInsuranceStampRewardBiasTags(
  effects: RouteChosenUpgradeEffects | null,
  routeKind: RewardContextKind,
  legacyItemActive = false
): readonly ItemTag[] {
  return getAmbushInsuranceStampSalvageClaim(effects, routeKind, legacyItemActive) > 0
    ? ['armor', 'credit']
    : [];
}

export function getMarketDecoderReadout(effects: RunUpgradeEffects): string | null {
  if (effects.shopStockBonus <= 0 && effects.shopDiscount <= 0) {
    return null;
  }

  return `Market Decoder: +${effects.shopStockBonus} stock | -${effects.shopDiscount} prices`;
}

export function getCouponCascadeReadout(effects: RunUpgradeEffects): string | null {
  return effects.shopCouponCascade ? 'Coupon Cascade: -1 prices | credit stock bias' : null;
}

export function getConvoyReceiptPrinterReadout(effects: RunUpgradeEffects): string | null {
  return effects.convoyReceiptPrinter
    ? 'Convoy Receipts: rerolls +1 stock | credit / drone bias'
    : null;
}

export function getRewardDossierReadout(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind
): string | null {
  const choiceBonus = getRewardUpgradeChoiceBonus(effects, routeKind);

  if (choiceBonus <= 0) {
    return null;
  }

  return `Relic Pattern Dossier: +${choiceBonus} vault option | ${effects.rewardBiasTags.join(' / ')}`;
}

export function getRewardUpgradeChoiceBonus(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind
): number {
  return routeKind === 'vault' ? effects.rewardChoiceBonus : 0;
}

export function getRewardUpgradeBiasTags(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind
): readonly ItemTag[] {
  return getRewardUpgradeChoiceBonus(effects, routeKind) > 0 ? effects.rewardBiasTags : [];
}

export function getMarketEchoLocatorRewardChoiceBonus(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind,
  _legacyItemActive = false
): number {
  return effects.marketEchoLocator && (routeKind === 'shop' || routeKind === 'repair') ? 1 : 0;
}

export function getMarketEchoLocatorRewardBiasTags(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind,
  legacyItemActive = false
): readonly ItemTag[] {
  return !legacyItemActive && getMarketEchoLocatorRewardChoiceBonus(effects, routeKind) > 0
    ? ['credit', 'magnet']
    : [];
}

export function getMiningLaserTransitRewardBiasTags(
  effects: RunUpgradeEffects,
  routeKind: RewardContextKind,
  legacyItemActive = false
): readonly ItemTag[] {
  return effects.miningLaserTransit &&
    !legacyItemActive &&
    (routeKind === 'vault' || routeKind === 'factionAmbush')
    ? ['laser', 'plasma']
    : [];
}
