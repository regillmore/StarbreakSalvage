import { UPGRADES, type UpgradeDefinition, type UpgradeId } from '../content/upgrades';
import {
  getUpgradeAffordability,
  type SaveData,
  type SaveUpdateResult,
  type UpgradePurchaseState
} from '../core/saveData';

export interface UpgradeProgressEntry {
  readonly id: UpgradeId;
  readonly name: string;
  readonly cost: number;
  readonly missingScrap: number;
  readonly state: UpgradePurchaseState;
}

export interface RunSummaryProgressModel {
  readonly salvageEarned: number;
  readonly previousSalvageBank: number;
  readonly currentSalvageBank: number;
  readonly installedUpgradeCount: number;
  readonly totalUpgradeCount: number;
  readonly newlyAffordableUpgrades: readonly UpgradeProgressEntry[];
  readonly availableUpgrades: readonly UpgradeProgressEntry[];
  readonly nextUpgrade: UpgradeProgressEntry | null;
  readonly scrapBreakdownText: string;
  readonly upgradeProgressText: string;
  readonly calloutText: string;
  readonly calloutKind: 'new' | 'available' | 'next' | 'complete' | 'locked';
}

export interface ArchiveUpgradeProgressModel {
  readonly installedUpgradeCount: number;
  readonly totalUpgradeCount: number;
  readonly availableUpgradeCount: number;
  readonly nextUpgrade: UpgradeProgressEntry | null;
  readonly statusText: string;
}

export function createRunSummaryProgressModel(
  saveData: SaveData,
  saveUpdate: SaveUpdateResult | null,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): RunSummaryProgressModel {
  const salvageEarned = Math.max(0, Math.floor(saveUpdate?.salvageEarned ?? 0));
  const currentSalvageBank = Math.max(0, Math.floor(saveData.salvageBank));
  const previousSalvageBank = Math.max(0, currentSalvageBank - salvageEarned);
  const previousData: SaveData = {
    ...saveData,
    salvageBank: previousSalvageBank
  };
  const installedUpgradeCount = saveData.purchasedUpgradeIds.length;
  const availableUpgrades = getAvailableUpgradeEntries(saveData, upgrades);
  const newlyAffordableUpgrades = availableUpgrades.filter((entry) => {
    const previousAffordability = getUpgradeAffordability(previousData, entry.id, upgrades);
    return previousAffordability.state !== 'available';
  });
  const nextUpgrade = getNextUpgradeEntry(saveData, upgrades);
  const upgradeProgressText = formatUpgradeProgressText(
    newlyAffordableUpgrades,
    availableUpgrades,
    nextUpgrade,
    installedUpgradeCount,
    upgrades.length
  );
  const callout = formatUpgradeCallout(
    newlyAffordableUpgrades,
    availableUpgrades,
    nextUpgrade,
    installedUpgradeCount,
    upgrades.length
  );

  return {
    salvageEarned,
    previousSalvageBank,
    currentSalvageBank,
    installedUpgradeCount,
    totalUpgradeCount: upgrades.length,
    newlyAffordableUpgrades,
    availableUpgrades,
    nextUpgrade,
    scrapBreakdownText: `Earned +${salvageEarned} kg | Bank ${previousSalvageBank} -> ${currentSalvageBank} kg`,
    upgradeProgressText,
    calloutText: callout.text,
    calloutKind: callout.kind
  };
}

export function createArchiveUpgradeProgressModel(
  saveData: SaveData,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): ArchiveUpgradeProgressModel {
  const availableUpgrades = getAvailableUpgradeEntries(saveData, upgrades);
  const nextUpgrade = getNextUpgradeEntry(saveData, upgrades);
  const installedUpgradeCount = saveData.purchasedUpgradeIds.length;

  return {
    installedUpgradeCount,
    totalUpgradeCount: upgrades.length,
    availableUpgradeCount: availableUpgrades.length,
    nextUpgrade,
    statusText: formatArchiveStatus(
      availableUpgrades,
      nextUpgrade,
      installedUpgradeCount,
      upgrades.length
    )
  };
}

function getAvailableUpgradeEntries(
  saveData: SaveData,
  upgrades: readonly UpgradeDefinition[]
): UpgradeProgressEntry[] {
  return upgrades
    .map((upgrade) => createUpgradeEntry(saveData, upgrade, upgrades))
    .filter((entry) => entry.state === 'available')
    .sort(compareUpgradeProgressEntries);
}

function getNextUpgradeEntry(
  saveData: SaveData,
  upgrades: readonly UpgradeDefinition[]
): UpgradeProgressEntry | null {
  return (
    upgrades
      .map((upgrade) => createUpgradeEntry(saveData, upgrade, upgrades))
      .filter((entry) => entry.state === 'unaffordable')
      .sort(compareUpgradeProgressEntries)[0] ?? null
  );
}

function createUpgradeEntry(
  saveData: SaveData,
  upgrade: UpgradeDefinition,
  upgrades: readonly UpgradeDefinition[]
): UpgradeProgressEntry {
  const affordability = getUpgradeAffordability(saveData, upgrade.id, upgrades);

  return {
    id: upgrade.id,
    name: upgrade.name,
    cost: upgrade.cost,
    missingScrap: Math.max(0, upgrade.cost - saveData.salvageBank),
    state: affordability.state
  };
}

function formatUpgradeProgressText(
  newlyAffordableUpgrades: readonly UpgradeProgressEntry[],
  availableUpgrades: readonly UpgradeProgressEntry[],
  nextUpgrade: UpgradeProgressEntry | null,
  installedUpgradeCount: number,
  totalUpgradeCount: number
): string {
  if (newlyAffordableUpgrades.length > 0) {
    return `Newly affordable: ${formatUpgradeList(newlyAffordableUpgrades)}.`;
  }

  if (availableUpgrades.length > 0) {
    return `Affordable now: ${formatUpgradeList(availableUpgrades)}.`;
  }

  if (nextUpgrade) {
    return `Next: ${nextUpgrade.name} needs ${nextUpgrade.missingScrap} kg more.`;
  }

  if (installedUpgradeCount >= totalUpgradeCount) {
    return 'All current upgrades installed.';
  }

  return 'Upgrade prerequisites pending.';
}

function formatUpgradeCallout(
  newlyAffordableUpgrades: readonly UpgradeProgressEntry[],
  availableUpgrades: readonly UpgradeProgressEntry[],
  nextUpgrade: UpgradeProgressEntry | null,
  installedUpgradeCount: number,
  totalUpgradeCount: number
): { readonly kind: RunSummaryProgressModel['calloutKind']; readonly text: string } {
  if (newlyAffordableUpgrades.length > 0) {
    return {
      kind: 'new',
      text: `${
        newlyAffordableUpgrades.length === 1 ? 'New upgrade ready' : 'New upgrades ready'
      }: ${formatUpgradeList(newlyAffordableUpgrades)}. Visit Upgrade Bay from the menu.`
    };
  }

  if (availableUpgrades.length > 0) {
    return {
      kind: 'available',
      text: `${
        availableUpgrades.length === 1 ? 'Upgrade available' : 'Upgrades available'
      }: ${formatUpgradeList(availableUpgrades)}. Visit Upgrade Bay from the menu.`
    };
  }

  if (nextUpgrade) {
    return {
      kind: 'next',
      text: `Next upgrade: ${nextUpgrade.name} needs ${nextUpgrade.missingScrap} kg more.`
    };
  }

  if (installedUpgradeCount >= totalUpgradeCount) {
    return {
      kind: 'complete',
      text: 'All current upgrades installed.'
    };
  }

  return {
    kind: 'locked',
    text: 'Upgrade prerequisites are still locked.'
  };
}

function formatArchiveStatus(
  availableUpgrades: readonly UpgradeProgressEntry[],
  nextUpgrade: UpgradeProgressEntry | null,
  installedUpgradeCount: number,
  totalUpgradeCount: number
): string {
  if (availableUpgrades.length > 0) {
    return `Ready: ${formatUpgradeList(availableUpgrades)}.`;
  }

  if (nextUpgrade) {
    return `Next: ${nextUpgrade.name} needs ${nextUpgrade.missingScrap} kg more.`;
  }

  if (installedUpgradeCount >= totalUpgradeCount) {
    return 'All current upgrades installed.';
  }

  return 'Upgrade prerequisites pending.';
}

function formatUpgradeList(entries: readonly UpgradeProgressEntry[], maxEntries = 2): string {
  const visibleEntries = entries
    .slice(0, maxEntries)
    .map((entry) => `${entry.name} (${entry.cost} kg)`);
  const hiddenCount = entries.length - visibleEntries.length;
  return hiddenCount > 0
    ? `${visibleEntries.join(', ')} +${hiddenCount} more`
    : visibleEntries.join(', ');
}

function compareUpgradeProgressEntries(
  left: UpgradeProgressEntry,
  right: UpgradeProgressEntry
): number {
  return (
    left.missingScrap - right.missingScrap ||
    left.cost - right.cost ||
    left.name.localeCompare(right.name)
  );
}
