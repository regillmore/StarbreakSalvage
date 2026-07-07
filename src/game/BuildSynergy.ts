import {
  getItemById,
  type ItemDefinition,
  type ItemFamily,
  type ItemId,
  type ItemTag
} from '../content/items';
import type { ItemInstance } from './Rewards';

export type BuildSynergyClusterId =
  | 'prismBattery'
  | 'warheadAudit'
  | 'droneChorus'
  | 'revengeBulwark'
  | 'creditEngine'
  | 'relicUndertow'
  | 'phaseNeedle'
  | 'prototypeFurnace'
  | 'lunarSurvey'
  | 'routeBroker'
  | 'bossPressure';

export interface BuildSynergyClusterDefinition {
  readonly id: BuildSynergyClusterId;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly families: readonly ItemFamily[];
  readonly tags: readonly ItemTag[];
  readonly minimumScore: number;
}

export interface BuildSynergyMatch {
  readonly cluster: BuildSynergyClusterDefinition;
  readonly score: number;
  readonly familyHits: number;
  readonly tagHits: number;
  readonly itemCount: number;
  readonly matchingItemIds: readonly ItemId[];
  readonly firstAcquisitionOrder: number;
}

export interface BuildSynergyModel {
  readonly itemCount: number;
  readonly matches: readonly BuildSynergyMatch[];
  readonly primary: BuildSynergyMatch | null;
  readonly secondary: BuildSynergyMatch | null;
}

export const BUILD_SYNERGY_CLUSTERS: readonly BuildSynergyClusterDefinition[] = [
  {
    id: 'prismBattery',
    label: 'Prism Battery',
    shortLabel: 'Prism',
    summary: 'split, laser, arc, and plasma items multiply lane coverage',
    families: ['laser-split'],
    tags: ['laser', 'split', 'arc', 'plasma'],
    minimumScore: 5
  },
  {
    id: 'warheadAudit',
    label: 'Warhead Audit',
    shortLabel: 'Warheads',
    summary: 'missile, bomb, and overkill items turn large hits into follow-up pressure',
    families: ['missile-overkill'],
    tags: ['missile', 'overkill', 'bomb'],
    minimumScore: 5
  },
  {
    id: 'droneChorus',
    label: 'Drone Chorus',
    shortLabel: 'Drones',
    summary: 'drone and copy items add side fire, escorts, and repeated triggers',
    families: ['drone-copy'],
    tags: ['drone', 'arc'],
    minimumScore: 5
  },
  {
    id: 'revengeBulwark',
    label: 'Revenge Bulwark',
    shortLabel: 'Bulwark',
    summary: 'shield, armor, and revenge items convert hits into counterfire',
    families: ['shield-revenge'],
    tags: ['shield', 'armor', 'revenge'],
    minimumScore: 5
  },
  {
    id: 'creditEngine',
    label: 'Credit Engine',
    shortLabel: 'Credits',
    summary: 'credit, shop, magnet, and salvage items turn economy into combat texture',
    families: ['credit-shop'],
    tags: ['credit', 'magnet', 'scrap'],
    minimumScore: 5
  },
  {
    id: 'relicUndertow',
    label: 'Relic Undertow',
    shortLabel: 'Relics',
    summary: 'curse and relic items trade safety for vault rewards and retaliation',
    families: ['curse-relic'],
    tags: ['curse', 'relic', 'armor'],
    minimumScore: 5
  },
  {
    id: 'phaseNeedle',
    label: 'Phase Needle',
    shortLabel: 'Phase',
    summary: 'phase, graze, and ricochet items reward close navigation and persistence',
    families: ['phase-graze'],
    tags: ['phase', 'ricochet', 'plasma'],
    minimumScore: 5
  },
  {
    id: 'prototypeFurnace',
    label: 'Prototype Furnace',
    shortLabel: 'Furnace',
    summary: 'heat and prototype items push fire cadence around vent windows',
    families: ['heat-prototype'],
    tags: ['heat', 'plasma', 'phase'],
    minimumScore: 5
  },
  {
    id: 'lunarSurvey',
    label: 'Lunar Survey',
    shortLabel: 'Lunar',
    summary: 'lunar, surface, and ore items reward low-orbit sector knowledge',
    families: ['lunar-surface'],
    tags: ['phase', 'plasma', 'scrap', 'magnet', 'laser', 'credit'],
    minimumScore: 5
  },
  {
    id: 'routeBroker',
    label: 'Route Broker',
    shortLabel: 'Routes',
    summary: 'route and economy items make shops, repairs, and ambush choices pay out',
    families: ['route-economy'],
    tags: ['credit', 'scrap', 'armor', 'drone'],
    minimumScore: 5
  },
  {
    id: 'bossPressure',
    label: 'Boss Pressure',
    shortLabel: 'Boss',
    summary: 'boss, phase, shield, and overkill items shape phase-change windows',
    families: ['boss-pressure'],
    tags: ['phase', 'overkill', 'shield', 'credit', 'scrap', 'ricochet'],
    minimumScore: 5
  }
];

export function createBuildSynergyModel(
  instances: readonly ItemInstance[],
  clusters: readonly BuildSynergyClusterDefinition[] = BUILD_SYNERGY_CLUSTERS
): BuildSynergyModel {
  const orderedInstances = getOrderedInstances(instances);
  const matches = clusters
    .map((cluster) => scoreCluster(cluster, orderedInstances))
    .filter((match): match is BuildSynergyMatch => Boolean(match))
    .sort(compareMatches);

  return {
    itemCount: orderedInstances.length,
    matches,
    primary: matches[0] ?? null,
    secondary: matches[1] ?? null
  };
}

export function createProspectiveBuildSynergyModel(
  instances: readonly ItemInstance[],
  itemId: ItemId
): BuildSynergyModel {
  const nextAcquisitionOrder =
    instances.reduce((highest, item) => Math.max(highest, item.acquisitionOrder), -1) + 1;

  return createBuildSynergyModel([
    ...instances,
    {
      itemId,
      acquisitionOrder: nextAcquisitionOrder
    }
  ]);
}

export function formatBuildSynergyHud(model: BuildSynergyModel): string {
  if (model.itemCount === 0 || !model.primary) {
    return 'Build no items';
  }

  const secondary =
    model.secondary && model.secondary.score >= 5 ? ` + ${model.secondary.cluster.shortLabel}` : '';
  return `Build ${model.primary.cluster.label}${secondary} | ${model.itemCount} item${model.itemCount === 1 ? '' : 's'}`;
}

export function formatBuildSynergySummary(model: BuildSynergyModel): string {
  if (model.itemCount === 0 || !model.primary) {
    return 'No build identity recorded.';
  }

  const secondary = model.secondary ? `; secondary ${model.secondary.cluster.label}` : '';
  return `${model.primary.cluster.label} leads at ${model.primary.score}${secondary}; ${model.itemCount} item${model.itemCount === 1 ? '' : 's'}.`;
}

export function formatProspectiveBuildSynergy(
  instances: readonly ItemInstance[],
  itemId: ItemId
): string {
  const current = createBuildSynergyModel(instances);
  const next = createProspectiveBuildSynergyModel(instances, itemId);
  const affectedMatch = next.matches.find((match) => match.matchingItemIds.includes(itemId));

  if (!affectedMatch) {
    return 'Build fit: new branch';
  }

  const currentMatch = current.matches.find(
    (match) => match.cluster.id === affectedMatch.cluster.id
  );
  const delta = affectedMatch.score - (currentMatch?.score ?? 0);
  const verb = currentMatch ? `+${delta}` : 'opens';
  return `Build fit: ${affectedMatch.cluster.shortLabel} ${verb}`;
}

function scoreCluster(
  cluster: BuildSynergyClusterDefinition,
  instances: readonly ItemInstance[]
): BuildSynergyMatch | null {
  const matchingItemIds: ItemId[] = [];
  let familyHits = 0;
  let tagHits = 0;
  let firstAcquisitionOrder = Number.POSITIVE_INFINITY;

  for (const instance of instances) {
    const item = getItemById(instance.itemId);
    const itemScore = getItemClusterScore(item, cluster);

    if (itemScore.familyHit === 0 && itemScore.tagHits === 0) {
      continue;
    }

    familyHits += itemScore.familyHit;
    tagHits += itemScore.tagHits;
    matchingItemIds.push(instance.itemId);
    firstAcquisitionOrder = Math.min(firstAcquisitionOrder, instance.acquisitionOrder);
  }

  const score = familyHits * 4 + tagHits;

  if (score < cluster.minimumScore) {
    return null;
  }

  return {
    cluster,
    score,
    familyHits,
    tagHits,
    itemCount: matchingItemIds.length,
    matchingItemIds,
    firstAcquisitionOrder
  };
}

function getItemClusterScore(
  item: ItemDefinition,
  cluster: BuildSynergyClusterDefinition
): { readonly familyHit: number; readonly tagHits: number } {
  return {
    familyHit: cluster.families.includes(item.metadata.family) ? 1 : 0,
    tagHits: item.tags.filter((tag) => cluster.tags.includes(tag)).length
  };
}

function compareMatches(a: BuildSynergyMatch, b: BuildSynergyMatch): number {
  return (
    b.score - a.score ||
    a.firstAcquisitionOrder - b.firstAcquisitionOrder ||
    b.itemCount - a.itemCount ||
    getClusterOrder(a.cluster.id) - getClusterOrder(b.cluster.id)
  );
}

function getClusterOrder(id: BuildSynergyClusterId): number {
  return BUILD_SYNERGY_CLUSTERS.findIndex((cluster) => cluster.id === id);
}

function getOrderedInstances(instances: readonly ItemInstance[]): ItemInstance[] {
  return [...instances].sort(
    (a, b) => a.acquisitionOrder - b.acquisitionOrder || a.itemId.localeCompare(b.itemId)
  );
}
