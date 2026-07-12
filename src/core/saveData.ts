import { ACHIEVEMENTS, type AchievementId } from '../content/achievements';
import { getItemById, ITEM_FAMILIES, ITEMS, type ItemFamily, type ItemId } from '../content/items';
import { ACT_DEFINITIONS, type ActId } from '../content/acts';
import { getUnlockById, UNLOCKS, type UnlockId } from '../content/unlocks';
import {
  getUpgradeById,
  UPGRADES,
  type UpgradeDefinition,
  type UpgradeId
} from '../content/upgrades';
import type { CombatEndReason } from '../game/CombatState';

export const SAVE_STORAGE_KEY = 'starbreak.save.v5';
export const LEGACY_SAVE_STORAGE_KEYS = [
  'starbreak.save.v4',
  'starbreak.save.v3',
  'starbreak.save.v2'
] as const;
export const SAVE_SCHEMA_VERSION = 5;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveStats {
  readonly runsEnded: number;
  readonly deaths: number;
  readonly forcedTests: number;
  readonly victories: number;
  readonly sectorsCleared: number;
  readonly bossesDefeated: number;
  readonly enemiesDestroyed: number;
  readonly creditsRecovered: number;
  readonly salvageRecovered: number;
  readonly distanceTraveled: number;
  readonly bestDistanceTraveled: number;
  readonly bestSectorsCleared: number;
  readonly bestSurvivedSeconds: number;
  readonly itemTriggers: number;
}

export interface LastRunSummary {
  readonly seed: string;
  readonly contractId: string;
  readonly contractName: string;
  readonly reason: CombatEndReason;
  readonly actId: ActId | null;
  readonly actName: string | null;
  readonly actShortLabel: string | null;
  readonly actIndex: number;
  readonly actSectorIndex: number;
  readonly actSectorCount: number | null;
  readonly actsCompleted: number;
  readonly finaleVariantId: string | null;
  readonly finaleVariantName: string | null;
  readonly finaleCleared: boolean;
  readonly expeditionGraphId: string | null;
  readonly expeditionVisitedNodeIds: readonly string[];
  readonly expeditionDecisionIds: readonly string[];
  readonly expeditionTargetSeconds: number | null;
  readonly sectorsCleared: number;
  readonly survivedSeconds: number;
  readonly distanceTraveled: number;
  readonly sectorLength: number | null;
  readonly salvageRecovered: number;
}

export interface SaveData {
  readonly version: typeof SAVE_SCHEMA_VERSION;
  readonly salvageBank: number;
  readonly unlockedIds: readonly UnlockId[];
  readonly purchasedUpgradeIds: readonly UpgradeId[];
  readonly achievementIds: readonly AchievementId[];
  readonly discoveredItemIds: readonly ItemId[];
  readonly discoveredItemFamilyIds: readonly ItemFamily[];
  readonly stats: SaveStats;
  readonly lastRun: LastRunSummary | null;
}

export interface SaveLoadResult {
  readonly data: SaveData;
  readonly repaired: boolean;
  readonly error: string | null;
}

export interface RunSaveRecord {
  readonly seed: string;
  readonly contractId: string;
  readonly contractName: string;
  readonly reason: CombatEndReason;
  readonly actId?: ActId | null;
  readonly actName?: string | null;
  readonly actShortLabel?: string | null;
  readonly actIndex?: number;
  readonly actSectorIndex?: number;
  readonly actSectorCount?: number | null;
  readonly actsCompleted?: number;
  readonly finaleVariantId?: string | null;
  readonly finaleVariantName?: string | null;
  readonly finaleCleared?: boolean;
  readonly expeditionGraphId?: string | null;
  readonly expeditionVisitedNodeIds?: readonly string[];
  readonly expeditionDecisionIds?: readonly string[];
  readonly expeditionTargetSeconds?: number | null;
  readonly survivedSeconds: number;
  readonly distanceTraveled: number;
  readonly sectorLength: number | null;
  readonly sectorsCleared: number;
  readonly bossesDefeated: number;
  readonly enemiesDestroyed: number;
  readonly creditsRecovered: number;
  readonly salvageRecovered: number;
  readonly itemTriggers: number;
  readonly itemIds?: readonly ItemId[];
  readonly bonusUnlockIds?: readonly UnlockId[];
}

export interface SaveUpdateResult {
  readonly data: SaveData;
  readonly newUnlockIds: readonly UnlockId[];
  readonly newAchievementIds: readonly AchievementId[];
  readonly salvageEarned: number;
}

export type UpgradePurchaseState = 'purchased' | 'available' | 'locked' | 'unaffordable';

export interface UpgradeAffordability {
  readonly upgrade: UpgradeDefinition;
  readonly state: UpgradePurchaseState;
  readonly cost: number;
  readonly salvageBank: number;
  readonly missingPrerequisiteIds: readonly UpgradeId[];
}

export interface UpgradePurchaseResult {
  readonly data: SaveData;
  readonly ok: boolean;
  readonly state: UpgradePurchaseState;
  readonly upgrade: UpgradeDefinition;
  readonly spent: number;
  readonly remainingSalvageBank: number;
  readonly missingPrerequisiteIds: readonly UpgradeId[];
  readonly message: string;
}

interface SaveDataV1 {
  readonly version: 1;
  readonly salvage: number;
  readonly unlockedIds?: readonly string[];
  readonly stats?: {
    readonly runs?: number;
    readonly sectorsCleared?: number;
    readonly bossesDefeated?: number;
  };
}

interface SaveDataV2 {
  readonly version: 2;
  readonly salvageBank?: number;
  readonly unlockedIds?: readonly string[];
  readonly achievementIds?: readonly string[];
  readonly stats?: Record<string, unknown>;
  readonly lastRun?: unknown;
}

interface SaveDataV3 {
  readonly version: 3;
  readonly salvageBank?: number;
  readonly unlockedIds?: readonly string[];
  readonly purchasedUpgradeIds?: readonly string[];
  readonly achievementIds?: readonly string[];
  readonly discoveredItemIds?: readonly string[];
  readonly discoveredItemFamilyIds?: readonly string[];
  readonly stats?: Record<string, unknown>;
  readonly lastRun?: unknown;
}

interface SaveDataV4 {
  readonly version: 4;
  readonly salvageBank?: number;
  readonly unlockedIds?: readonly string[];
  readonly purchasedUpgradeIds?: readonly string[];
  readonly achievementIds?: readonly string[];
  readonly discoveredItemIds?: readonly string[];
  readonly discoveredItemFamilyIds?: readonly string[];
  readonly stats?: Record<string, unknown>;
  readonly lastRun?: unknown;
}

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    salvageBank: 0,
    unlockedIds: [],
    purchasedUpgradeIds: [],
    achievementIds: [],
    discoveredItemIds: [],
    discoveredItemFamilyIds: [],
    stats: {
      runsEnded: 0,
      deaths: 0,
      forcedTests: 0,
      victories: 0,
      sectorsCleared: 0,
      bossesDefeated: 0,
      enemiesDestroyed: 0,
      creditsRecovered: 0,
      salvageRecovered: 0,
      distanceTraveled: 0,
      bestDistanceTraveled: 0,
      bestSectorsCleared: 0,
      bestSurvivedSeconds: 0,
      itemTriggers: 0
    },
    lastRun: null
  };
}

export function loadSaveData(storage: StorageLike): SaveLoadResult {
  const raw = storage.getItem(SAVE_STORAGE_KEY);

  if (raw) {
    try {
      return { data: importSaveData(raw), repaired: false, error: null };
    } catch (error) {
      return {
        data: createDefaultSaveData(),
        repaired: true,
        error: error instanceof Error ? error.message : 'Save data could not be loaded.'
      };
    }
  }

  for (const legacyKey of LEGACY_SAVE_STORAGE_KEYS) {
    const legacyRaw = storage.getItem(legacyKey);

    if (!legacyRaw) {
      continue;
    }

    try {
      return { data: importSaveData(legacyRaw), repaired: true, error: null };
    } catch (error) {
      return {
        data: createDefaultSaveData(),
        repaired: true,
        error: error instanceof Error ? error.message : 'Save data could not be loaded.'
      };
    }
  }

  return { data: createDefaultSaveData(), repaired: false, error: null };
}

export function writeSaveData(storage: StorageLike, data: SaveData): void {
  storage.setItem(SAVE_STORAGE_KEY, exportSaveData(data));

  for (const legacyKey of LEGACY_SAVE_STORAGE_KEYS) {
    storage.removeItem(legacyKey);
  }
}

export function resetSaveData(storage: StorageLike): SaveData {
  storage.removeItem(SAVE_STORAGE_KEY);
  for (const legacyKey of LEGACY_SAVE_STORAGE_KEYS) {
    storage.removeItem(legacyKey);
  }
  return createDefaultSaveData();
}

export function exportSaveData(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

export function importSaveData(serialized: string): SaveData {
  const parsed: unknown = JSON.parse(serialized);

  if (!isRecord(parsed)) {
    throw new Error('Save payload must be an object.');
  }

  if (parsed.version === 1) {
    return migrateV1Save(parsed as unknown as SaveDataV1);
  }

  if (parsed.version === 2) {
    return migrateV2Save(parsed as unknown as SaveDataV2);
  }

  if (parsed.version === 3) {
    return migrateV3Save(parsed as unknown as SaveDataV3);
  }

  if (parsed.version === 4) {
    return migrateV4Save(parsed as unknown as SaveDataV4);
  }

  if (parsed.version !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Unsupported save version: ${String(parsed.version)}`);
  }

  return normalizeSaveData(parsed);
}

export function applyRunRecordToSave(current: SaveData, record: RunSaveRecord): SaveUpdateResult {
  const salvageEarned = Math.max(0, Math.floor(record.salvageRecovered));
  const updatedStats: SaveStats = {
    runsEnded: current.stats.runsEnded + 1,
    deaths: current.stats.deaths + Number(record.reason === 'destroyed'),
    forcedTests: current.stats.forcedTests + Number(record.reason === 'debug'),
    victories: current.stats.victories + Number(record.reason === 'victory'),
    sectorsCleared: current.stats.sectorsCleared + Math.max(0, record.sectorsCleared),
    bossesDefeated: current.stats.bossesDefeated + Math.max(0, record.bossesDefeated),
    enemiesDestroyed: current.stats.enemiesDestroyed + Math.max(0, record.enemiesDestroyed),
    creditsRecovered: current.stats.creditsRecovered + Math.max(0, record.creditsRecovered),
    salvageRecovered: current.stats.salvageRecovered + salvageEarned,
    distanceTraveled:
      current.stats.distanceTraveled + Math.max(0, Math.floor(record.distanceTraveled)),
    bestDistanceTraveled: Math.max(
      current.stats.bestDistanceTraveled,
      Math.max(0, Math.floor(record.distanceTraveled))
    ),
    bestSectorsCleared: Math.max(current.stats.bestSectorsCleared, record.sectorsCleared),
    bestSurvivedSeconds: Math.max(current.stats.bestSurvivedSeconds, record.survivedSeconds),
    itemTriggers: current.stats.itemTriggers + Math.max(0, record.itemTriggers)
  };
  const achievementIds = new Set(current.achievementIds);
  const unlockedIds = new Set(current.unlockedIds);
  const newAchievementIds: AchievementId[] = [];
  const newUnlockIds: UnlockId[] = [];
  const runDiscoveredItemIds = sanitizeItemIds(record.itemIds ?? []);
  const discoveredItemIds = mergeUniqueItemIds(current.discoveredItemIds, runDiscoveredItemIds);
  const discoveredItemFamilyIds = sanitizeItemFamilyIds([
    ...current.discoveredItemFamilyIds,
    ...runDiscoveredItemIds.map(getItemFamilyId)
  ]);

  for (const achievement of ACHIEVEMENTS) {
    if (achievementIds.has(achievement.id)) {
      continue;
    }

    if (updatedStats[achievement.condition.stat] < achievement.condition.atLeast) {
      continue;
    }

    achievementIds.add(achievement.id);
    newAchievementIds.push(achievement.id);

    for (const unlockId of achievement.unlockIds) {
      if (unlockedIds.has(unlockId)) {
        continue;
      }

      getUnlockById(unlockId);
      unlockedIds.add(unlockId);
      newUnlockIds.push(unlockId);
    }
  }

  for (const unlockId of new Set(record.bonusUnlockIds ?? [])) {
    getUnlockById(unlockId);
    if (unlockedIds.has(unlockId)) continue;
    unlockedIds.add(unlockId);
    newUnlockIds.push(unlockId);
  }

  return {
    data: {
      version: SAVE_SCHEMA_VERSION,
      salvageBank: current.salvageBank + salvageEarned,
      unlockedIds: [...unlockedIds],
      purchasedUpgradeIds: current.purchasedUpgradeIds,
      achievementIds: [...achievementIds],
      discoveredItemIds,
      discoveredItemFamilyIds,
      stats: updatedStats,
      lastRun: {
        seed: record.seed,
        contractId: record.contractId,
        contractName: record.contractName,
        reason: record.reason,
        actId: sanitizeActId(record.actId),
        actName: sanitizeNullableText(record.actName),
        actShortLabel: sanitizeNullableText(record.actShortLabel),
        actIndex: sanitizeCount(record.actIndex),
        actSectorIndex: sanitizeCount(record.actSectorIndex),
        actSectorCount: sanitizeNullableCount(record.actSectorCount),
        actsCompleted: sanitizeCount(record.actsCompleted),
        finaleVariantId: sanitizeNullableText(record.finaleVariantId),
        finaleVariantName: sanitizeNullableText(record.finaleVariantName),
        finaleCleared: record.finaleCleared === true && record.reason === 'victory',
        expeditionGraphId: sanitizeNullableText(record.expeditionGraphId),
        expeditionVisitedNodeIds: sanitizeExpeditionIds(record.expeditionVisitedNodeIds),
        expeditionDecisionIds: sanitizeExpeditionIds(record.expeditionDecisionIds),
        expeditionTargetSeconds: sanitizeNullableCount(record.expeditionTargetSeconds),
        sectorsCleared: record.sectorsCleared,
        survivedSeconds: record.survivedSeconds,
        distanceTraveled: Math.max(0, Math.floor(record.distanceTraveled)),
        sectorLength: sanitizeNullableCount(record.sectorLength),
        salvageRecovered: salvageEarned
      }
    },
    newUnlockIds,
    newAchievementIds,
    salvageEarned
  };
}

export function getUpgradeAffordability(
  data: SaveData,
  upgradeId: UpgradeId,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): UpgradeAffordability {
  const upgrade = getUpgradeById(upgradeId, upgrades);
  const purchasedIds = new Set(data.purchasedUpgradeIds);
  const missingPrerequisiteIds = upgrade.prerequisites.filter(
    (prerequisiteId) => !purchasedIds.has(prerequisiteId)
  );
  const state: UpgradePurchaseState = purchasedIds.has(upgrade.id)
    ? 'purchased'
    : missingPrerequisiteIds.length > 0
      ? 'locked'
      : data.salvageBank < upgrade.cost
        ? 'unaffordable'
        : 'available';

  return {
    upgrade,
    state,
    cost: upgrade.cost,
    salvageBank: data.salvageBank,
    missingPrerequisiteIds
  };
}

export function purchaseUpgrade(
  current: SaveData,
  upgradeId: UpgradeId,
  upgrades: readonly UpgradeDefinition[] = UPGRADES
): UpgradePurchaseResult {
  const affordability = getUpgradeAffordability(current, upgradeId, upgrades);

  if (affordability.state !== 'available') {
    return {
      data: current,
      ok: false,
      state: affordability.state,
      upgrade: affordability.upgrade,
      spent: 0,
      remainingSalvageBank: current.salvageBank,
      missingPrerequisiteIds: affordability.missingPrerequisiteIds,
      message: getPurchaseBlockedMessage(affordability)
    };
  }

  const data: SaveData = {
    ...current,
    salvageBank: current.salvageBank - affordability.upgrade.cost,
    purchasedUpgradeIds: [...current.purchasedUpgradeIds, affordability.upgrade.id]
  };

  return {
    data,
    ok: true,
    state: 'purchased',
    upgrade: affordability.upgrade,
    spent: affordability.upgrade.cost,
    remainingSalvageBank: data.salvageBank,
    missingPrerequisiteIds: [],
    message: `Purchased ${affordability.upgrade.name}.`
  };
}

export function getSaveSummary(data: SaveData): {
  readonly salvageBank: number;
  readonly unlockCount: number;
  readonly upgradeCount: number;
  readonly achievementCount: number;
  readonly runsEnded: number;
} {
  return {
    salvageBank: data.salvageBank,
    unlockCount: data.unlockedIds.length,
    upgradeCount: data.purchasedUpgradeIds.length,
    achievementCount: data.achievementIds.length,
    runsEnded: data.stats.runsEnded
  };
}

function migrateV1Save(data: SaveDataV1): SaveData {
  const defaultSave = createDefaultSaveData();
  const migrated: SaveData = {
    ...defaultSave,
    salvageBank: sanitizeCount(data.salvage),
    unlockedIds: sanitizeUnlockIds(data.unlockedIds ?? []),
    stats: {
      ...defaultSave.stats,
      runsEnded: sanitizeCount(data.stats?.runs ?? 0),
      sectorsCleared: sanitizeCount(data.stats?.sectorsCleared ?? 0),
      bossesDefeated: sanitizeCount(data.stats?.bossesDefeated ?? 0),
      salvageRecovered: sanitizeCount(data.salvage),
      bestSectorsCleared: sanitizeCount(data.stats?.sectorsCleared ?? 0)
    }
  };

  return normalizeSaveData(migrated as unknown as Record<string, unknown>);
}

function migrateV2Save(data: SaveDataV2): SaveData {
  return normalizeSaveData({
    ...data,
    version: SAVE_SCHEMA_VERSION,
    purchasedUpgradeIds: [],
    discoveredItemIds: [],
    discoveredItemFamilyIds: []
  });
}

function migrateV3Save(data: SaveDataV3): SaveData {
  return normalizeSaveData({
    ...data,
    version: SAVE_SCHEMA_VERSION,
    discoveredItemIds: data.discoveredItemIds ?? [],
    discoveredItemFamilyIds: data.discoveredItemFamilyIds ?? []
  });
}

function migrateV4Save(data: SaveDataV4): SaveData {
  return normalizeSaveData({
    ...data,
    version: SAVE_SCHEMA_VERSION
  });
}

function normalizeSaveData(input: Record<string, unknown>): SaveData {
  const stats = isRecord(input.stats) ? input.stats : {};
  const discoveredItemIds = sanitizeItemIds(input.discoveredItemIds);
  const discoveredItemFamilyIds = sanitizeItemFamilyIds([
    ...sanitizeItemFamilyIds(input.discoveredItemFamilyIds),
    ...discoveredItemIds.map(getItemFamilyId)
  ]);
  const normalized: SaveData = {
    version: SAVE_SCHEMA_VERSION,
    salvageBank: sanitizeCount(input.salvageBank),
    unlockedIds: sanitizeUnlockIds(input.unlockedIds),
    purchasedUpgradeIds: sanitizeUpgradeIds(input.purchasedUpgradeIds),
    achievementIds: sanitizeAchievementIds(input.achievementIds),
    discoveredItemIds,
    discoveredItemFamilyIds,
    stats: {
      runsEnded: sanitizeCount(stats.runsEnded),
      deaths: sanitizeCount(stats.deaths),
      forcedTests: sanitizeCount(stats.forcedTests),
      victories: sanitizeCount(stats.victories),
      sectorsCleared: sanitizeCount(stats.sectorsCleared),
      bossesDefeated: sanitizeCount(stats.bossesDefeated),
      enemiesDestroyed: sanitizeCount(stats.enemiesDestroyed),
      creditsRecovered: sanitizeCount(stats.creditsRecovered),
      salvageRecovered: sanitizeCount(stats.salvageRecovered),
      distanceTraveled: sanitizeCount(stats.distanceTraveled),
      bestDistanceTraveled: sanitizeCount(stats.bestDistanceTraveled),
      bestSectorsCleared: sanitizeCount(stats.bestSectorsCleared),
      bestSurvivedSeconds: sanitizeCount(stats.bestSurvivedSeconds),
      itemTriggers: sanitizeCount(stats.itemTriggers)
    },
    lastRun: normalizeLastRun(input.lastRun)
  };

  return normalized;
}

function normalizeLastRun(value: unknown): LastRunSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const reason = value.reason;
  if (
    reason !== 'destroyed' &&
    reason !== 'abandoned' &&
    reason !== 'debug' &&
    reason !== 'sectorComplete' &&
    reason !== 'victory'
  ) {
    return null;
  }

  return {
    seed: typeof value.seed === 'string' ? value.seed : 'UNKNOWN',
    contractId: typeof value.contractId === 'string' ? value.contractId : 'unknown',
    contractName: typeof value.contractName === 'string' ? value.contractName : 'Unknown Contract',
    reason,
    actId: sanitizeActId(value.actId),
    actName: sanitizeNullableText(value.actName),
    actShortLabel: sanitizeNullableText(value.actShortLabel),
    actIndex: sanitizeCount(value.actIndex),
    actSectorIndex: sanitizeCount(value.actSectorIndex),
    actSectorCount: sanitizeNullableCount(value.actSectorCount),
    actsCompleted: sanitizeCount(value.actsCompleted),
    finaleVariantId: sanitizeNullableText(value.finaleVariantId),
    finaleVariantName: sanitizeNullableText(value.finaleVariantName),
    finaleCleared: value.finaleCleared === true && reason === 'victory',
    expeditionGraphId: sanitizeNullableText(value.expeditionGraphId),
    expeditionVisitedNodeIds: sanitizeExpeditionIds(value.expeditionVisitedNodeIds),
    expeditionDecisionIds: sanitizeExpeditionIds(value.expeditionDecisionIds),
    expeditionTargetSeconds: sanitizeNullableCount(value.expeditionTargetSeconds),
    sectorsCleared: sanitizeCount(value.sectorsCleared),
    survivedSeconds: sanitizeCount(value.survivedSeconds),
    distanceTraveled: sanitizeCount(value.distanceTraveled),
    sectorLength: sanitizeNullableCount(value.sectorLength),
    salvageRecovered: sanitizeCount(value.salvageRecovered)
  };
}

function sanitizeUnlockIds(value: unknown): UnlockId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(getKnownUnlockIds());
  return uniqueStrings(value).filter((id): id is UnlockId => validIds.has(id as UnlockId));
}

function sanitizeAchievementIds(value: unknown): AchievementId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
  return uniqueStrings(value).filter((id): id is AchievementId =>
    validIds.has(id as AchievementId)
  );
}

function sanitizeUpgradeIds(value: unknown): UpgradeId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(UPGRADES.map((upgrade) => upgrade.id));
  return uniqueStrings(value).filter((id): id is UpgradeId => validIds.has(id as UpgradeId));
}

function sanitizeItemIds(value: unknown): ItemId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set(ITEMS.map((item) => item.id));
  return uniqueStrings(value).filter((id): id is ItemId => validIds.has(id as ItemId));
}

function sanitizeItemFamilyIds(value: unknown): ItemFamily[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validIds = new Set<string>(ITEM_FAMILIES);
  return uniqueStrings(value).filter((id): id is ItemFamily => validIds.has(id));
}

function sanitizeExpeditionIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(value)
    .filter((id) => id.length <= 180 && /^[a-zA-Z0-9_:-]+$/.test(id))
    .slice(0, 128);
}

function sanitizeActId(value: unknown): ActId | null {
  if (typeof value !== 'string') {
    return null;
  }

  const validIds = new Set(ACT_DEFINITIONS.map((act) => act.id));
  return validIds.has(value as ActId) ? (value as ActId) : null;
}

function sanitizeNullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function mergeUniqueItemIds(
  currentItemIds: readonly ItemId[],
  discoveredItemIds: readonly ItemId[]
): ItemId[] {
  return [...new Set([...currentItemIds, ...discoveredItemIds])];
}

function getItemFamilyId(itemId: ItemId): ItemFamily {
  return getItemById(itemId).metadata.family;
}

function getKnownUnlockIds(): UnlockId[] {
  return UNLOCKS.map((unlock) => unlock.id);
}

function getPurchaseBlockedMessage(affordability: UpgradeAffordability): string {
  if (affordability.state === 'purchased') {
    return `${affordability.upgrade.name} is already installed.`;
  }

  if (affordability.state === 'locked') {
    const count = affordability.missingPrerequisiteIds.length;
    return `${affordability.upgrade.name} requires ${count} upgrade${count === 1 ? '' : 's'} first.`;
  }

  return `${affordability.upgrade.name} needs ${affordability.cost} kg scrap.`;
}

function uniqueStrings(values: readonly unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string'))];
}

function sanitizeCount(value: unknown): number {
  return Number.isFinite(value) && typeof value === 'number' && value > 0 ? Math.floor(value) : 0;
}

function sanitizeNullableCount(value: unknown): number | null {
  return Number.isFinite(value) && typeof value === 'number' && value > 0
    ? Math.floor(value)
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
