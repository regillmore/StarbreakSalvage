import type { ItemRarity, ItemSource, ItemTag } from '../content/items';
import type { RouteKind, SectorRoute } from './Generation';
import type { CombatRunResult } from './CombatState';

export interface ActEconomyProfile {
  readonly actId: string;
  readonly actLabel: string;
  readonly actShortLabel: string;
  readonly actSectorIndex: number;
  readonly actSectorCount: number;
  readonly runSectorIndex: number;
  readonly rewardTier: string;
  readonly escalated: boolean;
  readonly finale: boolean;
  readonly rewardCreditBonus: number;
  readonly combatCreditBonus: number;
  readonly combatSalvageBonus: number;
  readonly shopStockBonus: number;
  readonly shopPriceAdjustment: number;
  readonly rerollCostBonus: number;
  readonly repeatRerollSurcharge: number;
  readonly repairCreditSurcharge: number;
  readonly vaultCreditSurcharge: number;
  readonly looseCurrencyValueBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly sourceWeights: Readonly<Partial<Record<ItemSource, number>>>;
  readonly rarityWeights: Readonly<Partial<Record<ItemRarity, number>>>;
  readonly tagWeights: Readonly<Partial<Record<ItemTag, number>>>;
  readonly debugLabel: string;
}

export function createActEconomyProfile(sector: SectorRoute): ActEconomyProfile {
  const escalated = sector.act.rewardTier === 'escalated' || sector.act.actIndex > 1;
  const finale =
    escalated && sector.objective.bossRequired && sector.act.bossGate.kind === 'finale';
  const lateAct =
    escalated && sector.act.actSectorIndex >= Math.ceil(sector.act.actSectorCount * 0.65);
  const depthStep = escalated ? Math.min(2, Math.floor((sector.act.actSectorIndex - 1) / 2)) : 0;

  if (!escalated) {
    return {
      actId: sector.act.actId,
      actLabel: sector.act.actName,
      actShortLabel: sector.act.actShortLabel,
      actSectorIndex: sector.act.actSectorIndex,
      actSectorCount: sector.act.actSectorCount,
      runSectorIndex: sector.act.runSectorIndex,
      rewardTier: sector.act.rewardTier,
      escalated: false,
      finale: false,
      rewardCreditBonus: 0,
      combatCreditBonus: 0,
      combatSalvageBonus: 0,
      shopStockBonus: 0,
      shopPriceAdjustment: 0,
      rerollCostBonus: 0,
      repeatRerollSurcharge: 0,
      repairCreditSurcharge: 0,
      vaultCreditSurcharge: 0,
      looseCurrencyValueBonus: 0,
      rewardBiasTags: [],
      sourceWeights: {},
      rarityWeights: {},
      tagWeights: {},
      debugLabel: `${sector.act.actShortLabel} standard economy`
    };
  }

  return {
    actId: sector.act.actId,
    actLabel: sector.act.actName,
    actShortLabel: sector.act.actShortLabel,
    actSectorIndex: sector.act.actSectorIndex,
    actSectorCount: sector.act.actSectorCount,
    runSectorIndex: sector.act.runSectorIndex,
    rewardTier: sector.act.rewardTier,
    escalated: true,
    finale,
    rewardCreditBonus: 2 + (finale ? 2 : 0),
    combatCreditBonus: 2 + depthStep + (finale ? 2 : 0),
    combatSalvageBonus: (lateAct ? 1 : 0) + (finale ? 1 : 0),
    shopStockBonus: 1,
    shopPriceAdjustment: 1 + (lateAct ? 1 : 0),
    rerollCostBonus: 1,
    repeatRerollSurcharge: 1,
    repairCreditSurcharge: 2 + depthStep,
    vaultCreditSurcharge: 1 + (lateAct ? 1 : 0),
    looseCurrencyValueBonus: 1 + (finale ? 1 : 0),
    rewardBiasTags: finale ? ['relic', 'phase', 'overkill'] : ['phase', 'scrap'],
    sourceWeights: {
      boss: finale ? 1.55 : 1.25,
      elite: 1.2,
      faction: 1.15,
      lunar: 1.15,
      route: 1.12,
      unlock: 1.1,
      vault: 1.12
    },
    rarityWeights: {
      common: 0.88,
      uncommon: 1.08,
      rare: 1.22,
      prototype: 1.12,
      cursed: 1
    },
    tagWeights: {
      overkill: finale ? 1.18 : 1.08,
      phase: 1.12,
      relic: finale ? 1.22 : 1.12,
      scrap: 1.12,
      shield: 1.05
    },
    debugLabel: `${sector.act.actShortLabel} escalated economy${finale ? ' finale' : ''}`
  };
}

export function getActEconomyRouteCreditBonus(
  profile: ActEconomyProfile | undefined,
  routeKind: RouteKind
): number {
  if (!profile?.escalated) {
    return 0;
  }

  if (routeKind === 'elite' || routeKind === 'factionAmbush') {
    return 1 + (profile.finale ? 1 : 0);
  }

  if (routeKind === 'repair' || routeKind === 'glitch') {
    return 1;
  }

  return 0;
}

export function getActEconomyRouteSalvageBonus(
  profile: ActEconomyProfile | undefined,
  routeKind: RouteKind
): number {
  if (!profile?.escalated) {
    return 0;
  }

  if (routeKind === 'elite' || routeKind === 'vault' || routeKind === 'factionAmbush') {
    return 1 + (profile.finale ? 1 : 0);
  }

  return 0;
}

export function getActEconomyCombatCreditBonus(
  profile: ActEconomyProfile | undefined,
  result: CombatRunResult
): number {
  if (!profile?.escalated || result.enemiesDestroyed <= 0) {
    return 0;
  }

  return profile.combatCreditBonus;
}

export function getActEconomyCombatSalvageBonus(
  profile: ActEconomyProfile | undefined,
  result: CombatRunResult
): number {
  if (!profile?.escalated || result.enemiesDestroyed <= 0) {
    return 0;
  }

  return profile.combatSalvageBonus;
}

export function getActEconomyRarityMultiplier(
  profile: ActEconomyProfile | undefined,
  rarity: ItemRarity
): number {
  return profile?.rarityWeights[rarity] ?? 1;
}

export function getActEconomyLooseCurrencyValueBonus(
  profile: ActEconomyProfile | undefined
): number {
  return profile?.looseCurrencyValueBonus ?? 0;
}

export function getActEconomyShopReadout(profile: ActEconomyProfile | undefined): string | null {
  if (!profile?.escalated) {
    return null;
  }

  return `${profile.actShortLabel} market +${profile.shopStockBonus} stock, +${profile.shopPriceAdjustment} prices, reroll +${profile.rerollCostBonus}`;
}
