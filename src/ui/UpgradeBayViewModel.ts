import { UPGRADES, type UpgradeCategory, type UpgradeDefinition, type UpgradeId } from '../content/upgrades';
import {
  getUpgradeAffordability,
  type SaveData,
  type UpgradePurchaseState
} from '../core/saveData';

export interface UpgradeBayViewModel {
  readonly salvageBank: number;
  readonly purchasedCount: number;
  readonly totalCount: number;
  readonly availableCount: number;
  readonly summaryText: string;
  readonly cards: readonly UpgradeCardViewModel[];
}

export interface UpgradeCardViewModel {
  readonly id: UpgradeId;
  readonly name: string;
  readonly category: UpgradeCategory;
  readonly categoryLabel: string;
  readonly iconKey: UpgradeDefinition['iconKey'];
  readonly summary: string;
  readonly effect: string;
  readonly cost: number;
  readonly costLabel: string;
  readonly state: UpgradePurchaseState;
  readonly stateLabel: string;
  readonly stateDetail: string;
  readonly actionLabel: string;
  readonly canPurchase: boolean;
  readonly missingPrerequisiteIds: readonly UpgradeId[];
  readonly missingPrerequisiteNames: readonly string[];
  readonly prerequisiteLabel: string | null;
}

const CATEGORY_LABELS: Record<UpgradeCategory, string> = {
  archive: 'Archive',
  hangar: 'Hangar',
  market: 'Market',
  navigation: 'Navigation',
  salvage: 'Salvage'
};

export function createUpgradeBayViewModel(
  saveData: SaveData,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): UpgradeBayViewModel {
  const upgradeNames = new Map(upgrades.map((upgrade) => [upgrade.id, upgrade.name]));
  const cards = upgrades.map((upgrade) => createUpgradeCardViewModel(saveData, upgrade, upgradeNames, upgrades));
  const purchasedCount = cards.filter((card) => card.state === 'purchased').length;
  const availableCount = cards.filter((card) => card.state === 'available').length;

  return {
    salvageBank: saveData.salvageBank,
    purchasedCount,
    totalCount: cards.length,
    availableCount,
    summaryText: `Bank ${saveData.salvageBank} kg | Installed ${purchasedCount}/${cards.length} | Ready ${availableCount}`,
    cards
  };
}

function createUpgradeCardViewModel(
  saveData: SaveData,
  upgrade: UpgradeDefinition,
  upgradeNames: ReadonlyMap<UpgradeId, string>,
  upgrades: readonly UpgradeDefinition[]
): UpgradeCardViewModel {
  const affordability = getUpgradeAffordability(saveData, upgrade.id, upgrades);
  const missingPrerequisiteNames = affordability.missingPrerequisiteIds.map(
    (prerequisiteId) => upgradeNames.get(prerequisiteId) ?? prerequisiteId
  );
  const missingScrap = Math.max(0, upgrade.cost - saveData.salvageBank);

  return {
    id: upgrade.id,
    name: upgrade.name,
    category: upgrade.category,
    categoryLabel: CATEGORY_LABELS[upgrade.category],
    iconKey: upgrade.iconKey,
    summary: upgrade.summary,
    effect: upgrade.effect,
    cost: upgrade.cost,
    costLabel: `${upgrade.cost} kg scrap`,
    state: affordability.state,
    stateLabel: getStateLabel(affordability.state, missingScrap),
    stateDetail: getStateDetail(affordability.state, missingScrap, missingPrerequisiteNames),
    actionLabel: getActionLabel(affordability.state, missingScrap),
    canPurchase: affordability.state === 'available',
    missingPrerequisiteIds: affordability.missingPrerequisiteIds,
    missingPrerequisiteNames,
    prerequisiteLabel:
      missingPrerequisiteNames.length > 0 ? `Requires ${missingPrerequisiteNames.join(', ')}` : null
  };
}

function getStateLabel(state: UpgradePurchaseState, missingScrap: number): string {
  if (state === 'purchased') {
    return 'Installed';
  }

  if (state === 'available') {
    return 'Ready to install';
  }

  if (state === 'locked') {
    return 'Locked';
  }

  return `Need ${missingScrap} kg scrap`;
}

function getStateDetail(
  state: UpgradePurchaseState,
  missingScrap: number,
  missingPrerequisiteNames: readonly string[]
): string {
  if (state === 'purchased') {
    return 'Installed in the archive.';
  }

  if (state === 'available') {
    return 'Ready to install with banked scrap.';
  }

  if (state === 'locked') {
    return `Locked until ${missingPrerequisiteNames.join(', ')} is installed.`;
  }

  return `Needs ${missingScrap} kg more scrap.`;
}

function getActionLabel(state: UpgradePurchaseState, missingScrap: number): string {
  if (state === 'available') {
    return 'Install';
  }

  if (state === 'purchased') {
    return 'Installed';
  }

  if (state === 'locked') {
    return 'Locked';
  }

  return `Need ${missingScrap} kg`;
}
