import type { ItemTag } from '../content/items';
import { UPGRADES, type UpgradeId } from '../content/upgrades';
import type { RewardContextKind } from './Rewards';

export interface BossPhaseUpgradeEffects {
  readonly attackCooldownSeconds: number;
  readonly telegraphSeconds: number;
  readonly specialChargeGain: number;
  readonly clearEnemyProjectilesAtPhase: number | null;
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
  readonly rewardChoiceBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly seedSurvey: boolean;
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
    rewardChoiceBonus: hasRelicDossier ? 1 : 0,
    rewardBiasTags: hasRelicDossier ? ['relic', 'curse', 'phase'] : [],
    seedSurvey: hasUpgrade('upgrade_seed_cartographer'),
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

  if (effects.rewardChoiceBonus > 0) {
    labels.push(`vault +${effects.rewardChoiceBonus}`);
  }

  if (effects.seedSurvey) {
    labels.push('seed map');
  }

  if (effects.bossPhase.telegraphSeconds > 0) {
    labels.push('boss warning');
  }

  if (effects.bossPhase.clearEnemyProjectilesAtPhase !== null) {
    labels.push('capital relief');
  }

  return labels;
}

export function getMarketDecoderReadout(effects: RunUpgradeEffects): string | null {
  if (effects.shopStockBonus <= 0 && effects.shopDiscount <= 0) {
    return null;
  }

  return `Market Decoder: +${effects.shopStockBonus} stock | -${effects.shopDiscount} prices`;
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
