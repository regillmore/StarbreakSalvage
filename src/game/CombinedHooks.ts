import { getItemById, type ItemId } from '../content/items';
import {
  applyEngineeringHook,
  BASE_COMBINED_PROC_BUDGET,
  type EngineeringHookInstance
} from './Foundry';
import { applyItemHookInstance, type ItemHookName, type ItemHookPayloadByName } from './ItemHooks';
import type { ItemInstance } from './Rewards';

export type CombinedHookSourceKind = 'module' | 'item';

export interface CombinedHookApplication {
  readonly kind: CombinedHookSourceKind;
  readonly sourceId: string;
  readonly label: string;
  readonly order: number;
}

export interface CombinedHookDispatchOptions {
  readonly maxApplications?: number;
}

export interface CombinedHookDispatchReport<THook extends ItemHookName> {
  readonly payload: ItemHookPayloadByName[THook];
  readonly appliedSources: readonly CombinedHookApplication[];
  readonly skippedSources: readonly CombinedHookApplication[];
  readonly appliedItemIds: readonly ItemId[];
  readonly skippedItemIds: readonly ItemId[];
  readonly appliedModuleIds: readonly string[];
  readonly skippedModuleIds: readonly string[];
  readonly maxApplications: number;
}

type OrderedHookSource =
  | {
      readonly kind: 'module';
      readonly hook: EngineeringHookInstance;
      readonly application: CombinedHookApplication;
    }
  | {
      readonly kind: 'item';
      readonly instance: ItemInstance;
      readonly application: CombinedHookApplication;
    };

export function applyCombinedHooks<THook extends ItemHookName>(
  hook: THook,
  items: readonly ItemInstance[],
  modules: readonly EngineeringHookInstance[],
  payload: ItemHookPayloadByName[THook],
  options: CombinedHookDispatchOptions = {}
): ItemHookPayloadByName[THook] {
  return applyCombinedHooksWithReport(hook, items, modules, payload, options).payload;
}

export function applyCombinedHooksWithReport<THook extends ItemHookName>(
  hook: THook,
  items: readonly ItemInstance[],
  modules: readonly EngineeringHookInstance[],
  payload: ItemHookPayloadByName[THook],
  options: CombinedHookDispatchOptions = {}
): CombinedHookDispatchReport<THook> {
  const maxApplications = Math.max(
    0,
    Math.floor(options.maxApplications ?? BASE_COMBINED_PROC_BUDGET)
  );
  const ordered = createOrderedSources(hook, items, modules);
  const appliedSources: CombinedHookApplication[] = [];
  const skippedSources: CombinedHookApplication[] = [];
  const appliedItemIds: ItemId[] = [];
  const skippedItemIds: ItemId[] = [];
  const appliedModuleIds: string[] = [];
  const skippedModuleIds: string[] = [];
  let currentPayload = payload;

  for (const source of ordered) {
    if (appliedSources.length >= maxApplications) {
      skippedSources.push(source.application);
      if (source.kind === 'item') skippedItemIds.push(source.instance.itemId);
      else skippedModuleIds.push(source.hook.sourceId);
      continue;
    }

    if (source.kind === 'item') {
      currentPayload = applyItemHookInstance(hook, source.instance.itemId, items, currentPayload);
      appliedItemIds.push(source.instance.itemId);
    } else {
      currentPayload = applyEngineeringHook(hook, source.hook, currentPayload);
      appliedModuleIds.push(source.hook.sourceId);
    }
    appliedSources.push(source.application);
  }

  return {
    payload: currentPayload,
    appliedSources,
    skippedSources,
    appliedItemIds,
    skippedItemIds,
    appliedModuleIds,
    skippedModuleIds,
    maxApplications
  };
}

export function getOrderedCombinedHookSources(
  hook: ItemHookName,
  items: readonly ItemInstance[],
  modules: readonly EngineeringHookInstance[]
): CombinedHookApplication[] {
  return createOrderedSources(hook, items, modules).map((source) => source.application);
}

function createOrderedSources(
  hook: ItemHookName,
  items: readonly ItemInstance[],
  modules: readonly EngineeringHookInstance[]
): OrderedHookSource[] {
  const moduleSources: OrderedHookSource[] = modules
    .filter((module) => module.hook === hook)
    .map((module) => ({
      kind: 'module',
      hook: module,
      application: {
        kind: 'module',
        sourceId: module.sourceId,
        label: module.sourceLabel,
        order: module.effect.hookPriority * 1_000 + module.installationOrder
      }
    }));
  const itemSources: OrderedHookSource[] = items.flatMap((instance) => {
    const item = getItemById(instance.itemId);
    if (!item.hooks.includes(hook)) return [];
    return [
      {
        kind: 'item' as const,
        instance,
        application: {
          kind: 'item' as const,
          sourceId: instance.itemId,
          label: item.name,
          order: 100_000 + (instance.socket?.circuitOrder ?? 10_000 + instance.acquisitionOrder)
        }
      }
    ];
  });

  return [...moduleSources, ...itemSources].sort(
    (left, right) =>
      left.application.order - right.application.order ||
      left.application.sourceId.localeCompare(right.application.sourceId)
  );
}
