import { getUnlockById } from '../content/unlocks';
import type { SaveUpdateResult } from '../core/saveData';
import { getActRouteNode } from './ActRouteGraph';
import { createBuildSynergyModel } from './BuildSynergy';
import type { CombatRunResult } from './CombatState';
import type { EngineeringState } from './Foundry';
import { resolveEngineeringSnapshot } from './Foundry';
import type { RunSkeleton, StartingContract } from './Generation';
import type { InterActChoiceRecord } from './InterActJunction';
import { getActiveFittedItems } from './ItemSockets';
import type { ItemInstance } from './Rewards';
import type { RouteHistoryEntry } from './RunSession';

const MAX_DEBRIEF_ITEMS = 3;
const MAX_DEBRIEF_HIGHLIGHTS = 3;
const MAX_HIGHLIGHT_DETAIL_LENGTH = 112;

export interface RunDebriefMetric {
  readonly label: string;
  readonly value: string;
}

export interface RunDebriefRouteAct {
  readonly actLabel: string;
  readonly nodeLabels: readonly string[];
}

export interface RunDebriefHighlight {
  readonly kicker: string;
  readonly title: string;
  readonly detail: string;
}

export interface RunDebriefModel {
  readonly title: string;
  readonly outcomeLabel: string;
  readonly outcomeDetail: string;
  readonly reached: string;
  readonly actProgress: string;
  readonly metrics: readonly RunDebriefMetric[];
  readonly ship: {
    readonly name: string;
    readonly frame: string;
    readonly modules: string;
    readonly engineering: string;
    readonly powerGrid: string;
    readonly circuitTitle: string;
    readonly circuitDetail: string;
  };
  readonly routeActs: readonly RunDebriefRouteAct[];
  readonly highlights: readonly RunDebriefHighlight[];
  readonly items: readonly ItemInstance[];
  readonly omittedItemCount: number;
}

export interface RunDebriefOptions {
  readonly run: RunSkeleton;
  readonly contract: StartingContract;
  readonly result: CombatRunResult | null;
  readonly currentSectorIndex: number;
  readonly routeHistory: readonly RouteHistoryEntry[];
  readonly interActChoices: readonly InterActChoiceRecord[];
  readonly itemInstances: readonly ItemInstance[];
  readonly engineering: EngineeringState;
  readonly saveUpdate: SaveUpdateResult | null;
}

export function createRunDebriefModel(options: RunDebriefOptions): RunDebriefModel {
  const engineering = resolveEngineeringSnapshot(options.engineering.committed);
  const activeItems = getActiveFittedItems(options.itemInstances, options.engineering.committed);
  const synergy = createBuildSynergyModel(activeItems);
  const items = selectDebriefItems(options.itemInstances, activeItems);
  const currentSector = options.run.sectors[options.currentSectorIndex];
  const currentNode = getActRouteNode(options.run.actRouteGraph, options.currentSectorIndex);

  return {
    title: getSummaryTitle(options.result),
    outcomeLabel: getOutcomeLabel(options.result),
    outcomeDetail: getOutcomeDetail(options.result),
    reached: currentSector?.sectorName ?? 'Unknown sector',
    actProgress: currentNode
      ? `${formatActLabel(options.run, currentNode.actId)} ${currentNode.nodeLabel} / layer ${
          currentNode.layerIndex + 1
        } of ${options.run.actRouteGraph.routeDepth}`
      : 'Route position unavailable',
    metrics: createMetrics(options),
    ship: {
      name: options.contract.shipName,
      frame: engineering.loadout?.frameName ?? options.contract.loadout.summary.frame,
      modules: engineering.loadout?.summary.modules ?? 'Final loadout unavailable',
      engineering: engineering.summary,
      powerGrid:
        engineering.loadout?.summary.powerGrid ?? options.contract.loadout.summary.powerGrid,
      circuitTitle: synergy.primary?.cluster.label ?? 'Unformed circuit',
      circuitDetail: synergy.primary
        ? synergy.primary.cluster.summary
        : activeItems.length > 0
          ? `${activeItems.length} live upgrade${activeItems.length === 1 ? '' : 's'} without a dominant signal family.`
          : 'No upgrades were live in the signal chain.'
    },
    routeActs: createRouteActs(options),
    highlights: createHighlights(options),
    items,
    omittedItemCount: Math.max(0, options.itemInstances.length - items.length)
  };
}

export function getSummaryTitle(result: CombatRunResult | null): string {
  if (result?.reason === 'destroyed') return 'Ship Destroyed';
  if (result?.reason === 'debug') return 'Debug Run Ended';
  if (result?.reason === 'victory') return 'Victory Confirmed';
  if (result?.reason === 'sectorComplete') return 'Contract Complete';
  return 'Contract Suspended';
}

export function getOutcomeLabel(result: CombatRunResult | null): string {
  if (!result) return 'pending';
  if (result.reason === 'destroyed') return 'permadeath';
  if (result.reason === 'debug') return 'forced test';
  if (result.reason === 'victory') return 'final boss salvaged';
  if (result.reason === 'sectorComplete') return 'sector survived';
  return 'abandoned';
}

export function getOutcomeDetail(result: CombatRunResult | null): string {
  if (!result) return 'Run pending.';
  if (result.reason === 'victory') return 'Win: final boss salvaged.';
  if (result.reason === 'destroyed') return 'Loss: ship destroyed and contract closed.';
  if (result.reason === 'debug') return 'Debug: forced test summary.';
  if (result.reason === 'sectorComplete') return 'Sector cleared: route selected for the next leg.';
  return 'Abandoned: pilot exited before resolution.';
}

export function formatDistanceSummary(result: CombatRunResult | null): string {
  if (!result) return '0u';
  const distance = Math.floor(Math.max(0, result.distanceTraveled));
  const sectorLength =
    result.sectorLength === null ? null : Math.floor(Math.max(0, result.sectorLength));
  return sectorLength ? `${distance}/${sectorLength}u` : `${distance}u`;
}

export function formatRunDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

function createMetrics(options: RunDebriefOptions): readonly RunDebriefMetric[] {
  return [
    { label: 'Run time', value: formatRunDuration(options.result?.survivedSeconds ?? 0) },
    {
      label: 'Sectors',
      value: `${getRunDebriefSectorsCleared(
        options.run,
        options.currentSectorIndex,
        options.routeHistory,
        options.result
      )}`
    },
    { label: 'Destroyed', value: `${options.result?.enemiesDestroyed ?? 0}` },
    { label: 'Bosses', value: `${options.result?.bossesDefeated ?? 0}` },
    { label: 'Credits', value: `${options.result?.credits ?? 0}` },
    { label: 'Salvage', value: `${options.result?.salvage ?? 0} kg` }
  ];
}

export function getRunDebriefSectorsCleared(
  run: RunSkeleton,
  currentSectorIndex: number,
  routeHistory: readonly RouteHistoryEntry[],
  result: CombatRunResult | null
): number {
  const currentNode = getActRouteNode(run.actRouteGraph, currentSectorIndex);
  if (!currentNode) return routeHistory.length + (result?.reason === 'sectorComplete' ? 1 : 0);

  const currentActIndex = run.acts.findIndex((act) => act.id === currentNode.actId);
  const priorActSectors = run.acts
    .slice(0, Math.max(0, currentActIndex))
    .reduce((total, act) => total + act.routeDepth, 0);
  const currentSectorComplete = result?.reason === 'victory' || result?.reason === 'sectorComplete';
  return priorActSectors + currentNode.layerIndex + (currentSectorComplete ? 1 : 0);
}

function createRouteActs(options: RunDebriefOptions): readonly RunDebriefRouteAct[] {
  const visited = new Set<number>([options.currentSectorIndex]);
  for (const entry of options.routeHistory) {
    visited.add(entry.sectorIndex - 1);
    if (entry.targetSectorIndex !== undefined) visited.add(entry.targetSectorIndex - 1);
  }

  const byAct = new Map<string, { readonly label: string; readonly nodes: string[] }>();
  for (const sectorIndex of visited) {
    const node = getActRouteNode(options.run.actRouteGraph, sectorIndex);
    if (!node) continue;
    const actLabel = formatActLabel(options.run, node.actId);
    const existing = byAct.get(node.actId) ?? { label: actLabel, nodes: [] };
    if (!existing.nodes.includes(node.nodeLabel)) existing.nodes.push(node.nodeLabel);
    byAct.set(node.actId, existing);
  }

  return options.run.acts.flatMap((actPlan) => {
    const act = byAct.get(actPlan.id);
    return act
      ? [
          {
            actLabel: act.label,
            nodeLabels: act.nodes.sort(compareNodeLabels)
          }
        ]
      : [];
  });
}

function createHighlights(options: RunDebriefOptions): readonly RunDebriefHighlight[] {
  const highlights: RunDebriefHighlight[] = [];
  const setPiece = options.result?.setPiece;
  if (setPiece) {
    highlights.push({
      kicker: 'Set piece',
      title: setPiece.name,
      detail: setPiece.completed
        ? `Neutralized ${setPiece.destroyedComponents}/${setPiece.totalComponents} components.`
        : `Left incomplete after ${setPiece.stagesCompleted} stage${setPiece.stagesCompleted === 1 ? '' : 's'}.`
    });
  }

  const refit = options.interActChoices.at(-1);
  if (refit) {
    highlights.push({
      kicker: 'Act refit',
      title: refit.label,
      detail: clampDetail(refit.summary)
    });
  }

  const engineering = options.engineering.history.at(-1);
  if (engineering) {
    highlights.push({
      kicker: 'Final refit',
      title: formatEngineeringAction(engineering.kind),
      detail: clampDetail(engineering.summary)
    });
  }

  const route = [...options.routeHistory].reverse().find((entry) => entry.outcomeTitle);
  if (route?.outcomeTitle) {
    highlights.push({
      kicker: 'Route turn',
      title: route.outcomeTitle,
      detail: `Reached by the ${route.routeLabel.toLowerCase()} vector.`
    });
  }

  const unlockId = options.saveUpdate?.newUnlockIds[0];
  if (unlockId) {
    const unlock = getUnlockById(unlockId);
    highlights.unshift({
      kicker: 'Archive unlock',
      title: unlock.name,
      detail: clampDetail(unlock.summary)
    });
  }

  return highlights.slice(0, MAX_DEBRIEF_HIGHLIGHTS);
}

function selectDebriefItems(
  allItems: readonly ItemInstance[],
  activeItems: readonly ItemInstance[]
): readonly ItemInstance[] {
  const selected = [...activeItems]
    .sort(
      (left, right) =>
        (left.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.acquisitionOrder - right.acquisitionOrder
    )
    .slice(0, MAX_DEBRIEF_ITEMS);
  const selectedOrders = new Set(selected.map((item) => item.acquisitionOrder));

  for (const item of [...allItems].sort(
    (left, right) => right.acquisitionOrder - left.acquisitionOrder
  )) {
    if (selected.length >= MAX_DEBRIEF_ITEMS) break;
    if (!selectedOrders.has(item.acquisitionOrder)) {
      selected.push(item);
      selectedOrders.add(item.acquisitionOrder);
    }
  }

  return selected;
}

function formatActLabel(run: RunSkeleton, actId: string): string {
  return run.acts.find((act) => act.id === actId)?.shortLabel ?? 'Act ?';
}

function compareNodeLabels(left: string, right: string): number {
  return Number.parseInt(left, 10) - Number.parseInt(right, 10) || left.localeCompare(right);
}

function clampDetail(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_HIGHLIGHT_DETAIL_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_HIGHLIGHT_DETAIL_LENGTH - 1).trimEnd()}…`;
}

function formatEngineeringAction(kind: EngineeringState['history'][number]['kind']): string {
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
}
