import type { ItemId } from '../content/items';

export interface ShopStockSlotState {
  readonly slot: number;
  readonly itemId: ItemId;
  readonly price: number;
  readonly sourceHint: string;
  readonly depleted: boolean;
}

export type ShopStockLedger = Record<string, ShopStockSlotState[]>;

interface ShopStockSession {
  shopStockByRoll?: ShopStockLedger;
}

export function getShopStockForRoll(
  session: ShopStockSession,
  sectorIndex: number,
  rerollCount: number
): readonly ShopStockSlotState[] | null {
  return session.shopStockByRoll?.[getShopStockRollKey(sectorIndex, rerollCount)] ?? null;
}

export function initializeShopStockForRoll(
  session: ShopStockSession,
  sectorIndex: number,
  rerollCount: number,
  stock: readonly ShopStockSlotState[]
): readonly ShopStockSlotState[] {
  const key = getShopStockRollKey(sectorIndex, rerollCount);
  const existing = session.shopStockByRoll?.[key];
  if (existing) return existing;

  const initialized = stock.map((entry) => ({ ...entry }));
  session.shopStockByRoll = {
    ...(session.shopStockByRoll ?? {}),
    [key]: initialized
  };
  return initialized;
}

export function getAvailableShopStockItem(
  session: ShopStockSession,
  sectorIndex: number,
  rerollCount: number,
  itemId: ItemId,
  price: number
): ShopStockSlotState | null {
  return (
    getShopStockForRoll(session, sectorIndex, rerollCount)?.find(
      (entry) => !entry.depleted && entry.itemId === itemId && entry.price === price
    ) ?? null
  );
}

export function depleteShopStockItem(
  session: ShopStockSession,
  sectorIndex: number,
  rerollCount: number,
  itemId: ItemId,
  price: number
): boolean {
  const key = getShopStockRollKey(sectorIndex, rerollCount);
  const stock = session.shopStockByRoll?.[key];
  const stockIndex = stock?.findIndex(
    (entry) => !entry.depleted && entry.itemId === itemId && entry.price === price
  );
  if (!stock || stockIndex === undefined || stockIndex < 0) return false;

  const entry = stock[stockIndex]!;
  const nextStock = [...stock];
  nextStock[stockIndex] = { ...entry, depleted: true };
  session.shopStockByRoll = {
    ...(session.shopStockByRoll ?? {}),
    [key]: nextStock
  };
  return true;
}

function getShopStockRollKey(sectorIndex: number, rerollCount: number): string {
  return `${sectorIndex}:${rerollCount}`;
}
