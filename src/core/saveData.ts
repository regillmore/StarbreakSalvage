import { ACHIEVEMENTS, type AchievementId } from '../content/achievements';
import { getUnlockById, type UnlockId } from '../content/unlocks';
import type { CombatEndReason } from '../game/CombatState';

export const SAVE_STORAGE_KEY = 'starbreak.save.v2';
export const SAVE_SCHEMA_VERSION = 2;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveStats {
  readonly runsEnded: number;
  readonly deaths: number;
  readonly forcedTests: number;
  readonly sectorsCleared: number;
  readonly bossesDefeated: number;
  readonly enemiesDestroyed: number;
  readonly creditsRecovered: number;
  readonly salvageRecovered: number;
  readonly bestSectorsCleared: number;
  readonly bestSurvivedSeconds: number;
  readonly itemTriggers: number;
}

export interface LastRunSummary {
  readonly seed: string;
  readonly contractId: string;
  readonly contractName: string;
  readonly reason: CombatEndReason;
  readonly sectorsCleared: number;
  readonly survivedSeconds: number;
  readonly salvageRecovered: number;
}

export interface SaveData {
  readonly version: typeof SAVE_SCHEMA_VERSION;
  readonly salvageBank: number;
  readonly unlockedIds: readonly UnlockId[];
  readonly achievementIds: readonly AchievementId[];
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
  readonly survivedSeconds: number;
  readonly sectorsCleared: number;
  readonly bossesDefeated: number;
  readonly enemiesDestroyed: number;
  readonly creditsRecovered: number;
  readonly salvageRecovered: number;
  readonly itemTriggers: number;
}

export interface SaveUpdateResult {
  readonly data: SaveData;
  readonly newUnlockIds: readonly UnlockId[];
  readonly newAchievementIds: readonly AchievementId[];
  readonly salvageEarned: number;
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

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_SCHEMA_VERSION,
    salvageBank: 0,
    unlockedIds: [],
    achievementIds: [],
    stats: {
      runsEnded: 0,
      deaths: 0,
      forcedTests: 0,
      sectorsCleared: 0,
      bossesDefeated: 0,
      enemiesDestroyed: 0,
      creditsRecovered: 0,
      salvageRecovered: 0,
      bestSectorsCleared: 0,
      bestSurvivedSeconds: 0,
      itemTriggers: 0
    },
    lastRun: null
  };
}

export function loadSaveData(storage: StorageLike): SaveLoadResult {
  const raw = storage.getItem(SAVE_STORAGE_KEY);

  if (!raw) {
    return { data: createDefaultSaveData(), repaired: false, error: null };
  }

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

export function writeSaveData(storage: StorageLike, data: SaveData): void {
  storage.setItem(SAVE_STORAGE_KEY, exportSaveData(data));
}

export function resetSaveData(storage: StorageLike): SaveData {
  storage.removeItem(SAVE_STORAGE_KEY);
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
    sectorsCleared: current.stats.sectorsCleared + Math.max(0, record.sectorsCleared),
    bossesDefeated: current.stats.bossesDefeated + Math.max(0, record.bossesDefeated),
    enemiesDestroyed: current.stats.enemiesDestroyed + Math.max(0, record.enemiesDestroyed),
    creditsRecovered: current.stats.creditsRecovered + Math.max(0, record.creditsRecovered),
    salvageRecovered: current.stats.salvageRecovered + salvageEarned,
    bestSectorsCleared: Math.max(current.stats.bestSectorsCleared, record.sectorsCleared),
    bestSurvivedSeconds: Math.max(current.stats.bestSurvivedSeconds, record.survivedSeconds),
    itemTriggers: current.stats.itemTriggers + Math.max(0, record.itemTriggers)
  };
  const achievementIds = new Set(current.achievementIds);
  const unlockedIds = new Set(current.unlockedIds);
  const newAchievementIds: AchievementId[] = [];
  const newUnlockIds: UnlockId[] = [];

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

  return {
    data: {
      version: SAVE_SCHEMA_VERSION,
      salvageBank: current.salvageBank + salvageEarned,
      unlockedIds: [...unlockedIds],
      achievementIds: [...achievementIds],
      stats: updatedStats,
      lastRun: {
        seed: record.seed,
        contractId: record.contractId,
        contractName: record.contractName,
        reason: record.reason,
        sectorsCleared: record.sectorsCleared,
        survivedSeconds: record.survivedSeconds,
        salvageRecovered: salvageEarned
      }
    },
    newUnlockIds,
    newAchievementIds,
    salvageEarned
  };
}

export function getSaveSummary(data: SaveData): {
  readonly salvageBank: number;
  readonly unlockCount: number;
  readonly achievementCount: number;
  readonly runsEnded: number;
} {
  return {
    salvageBank: data.salvageBank,
    unlockCount: data.unlockedIds.length,
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

function normalizeSaveData(input: Record<string, unknown>): SaveData {
  const stats = isRecord(input.stats) ? input.stats : {};
  const normalized: SaveData = {
    version: SAVE_SCHEMA_VERSION,
    salvageBank: sanitizeCount(input.salvageBank),
    unlockedIds: sanitizeUnlockIds(input.unlockedIds),
    achievementIds: sanitizeAchievementIds(input.achievementIds),
    stats: {
      runsEnded: sanitizeCount(stats.runsEnded),
      deaths: sanitizeCount(stats.deaths),
      forcedTests: sanitizeCount(stats.forcedTests),
      sectorsCleared: sanitizeCount(stats.sectorsCleared),
      bossesDefeated: sanitizeCount(stats.bossesDefeated),
      enemiesDestroyed: sanitizeCount(stats.enemiesDestroyed),
      creditsRecovered: sanitizeCount(stats.creditsRecovered),
      salvageRecovered: sanitizeCount(stats.salvageRecovered),
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
    reason !== 'sectorComplete'
  ) {
    return null;
  }

  return {
    seed: typeof value.seed === 'string' ? value.seed : 'UNKNOWN',
    contractId: typeof value.contractId === 'string' ? value.contractId : 'unknown',
    contractName: typeof value.contractName === 'string' ? value.contractName : 'Unknown Contract',
    reason,
    sectorsCleared: sanitizeCount(value.sectorsCleared),
    survivedSeconds: sanitizeCount(value.survivedSeconds),
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

function getKnownUnlockIds(): UnlockId[] {
  return [
    'unlock_ship_phase_courier',
    'unlock_ship_shield_bruiser',
    'unlock_ship_scrap_monk',
    'unlock_ship_corporate_test_pilot',
    'unlock_ship_relic_thief',
    'unlock_item_executive_override',
    'unlock_challenge_debt_ceiling',
    'unlock_boss_auditor_drill',
    'unlock_faction_bloom_hive',
    'unlock_music_outer_debris'
  ];
}

function uniqueStrings(values: readonly unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string'))];
}

function sanitizeCount(value: unknown): number {
  return Number.isFinite(value) && typeof value === 'number' && value > 0 ? Math.floor(value) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
