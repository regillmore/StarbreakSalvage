import type {
  ItemDefinition,
  ItemFamily,
  ItemImplementationStatus,
  ItemRarity,
  ItemUiTag
} from '../content/items';

export interface ItemCardViewModel {
  readonly itemId: ItemDefinition['id'];
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly rarityLabel: string;
  readonly family: ItemFamily;
  readonly familyLabel: string;
  readonly sourceLabel: string;
  readonly effectText: string;
  readonly effectState: ItemImplementationStatus;
  readonly effectStateLabel: string;
  readonly effectStateKind: ItemImplementationStatus;
  readonly badges: readonly string[];
  readonly iconKind: ItemFamily;
  readonly iconLabel: string;
  readonly priceLabel: string | null;
  readonly acquisitionLabel: string | null;
  readonly metaLine: string;
}

export interface ItemCardViewModelOptions {
  readonly sourceLabel?: string;
  readonly price?: number;
  readonly acquisitionOrder?: number;
}

const FAMILY_LABELS: Readonly<Record<ItemFamily, string>> = {
  'laser-split': 'Laser Split',
  'missile-overkill': 'Missile Overkill',
  'drone-copy': 'Drone Copy',
  'shield-revenge': 'Shield Revenge',
  'credit-shop': 'Credit Shop',
  'curse-relic': 'Curse Relic',
  'phase-graze': 'Phase Graze',
  'heat-prototype': 'Heat Prototype',
  'lunar-surface': 'Lunar Surface',
  'route-economy': 'Route Economy',
  'boss-pressure': 'Boss Pressure'
};

const EFFECT_STATE_LABELS: Readonly<Record<ItemImplementationStatus, string>> = {
  live: 'Live effect',
  bridge: 'Bridge effect',
  planned: 'Planned effect'
};

export function createItemCardViewModel(
  item: ItemDefinition,
  options: ItemCardViewModelOptions = {}
): ItemCardViewModel {
  const sourceLabel = options.sourceLabel ?? formatSourceLabel(item);
  const familyLabel = FAMILY_LABELS[item.metadata.family];
  const rarityLabel = formatRarityLabel(item.rarity);
  const priceLabel = options.price === undefined ? null : `${options.price} credits`;
  const acquisitionLabel =
    options.acquisitionOrder === undefined ? null : `Slot ${options.acquisitionOrder + 1}`;
  const badges = item.metadata.uiTags.map(formatUiTagLabel);
  const metaLabels = [
    rarityLabel,
    familyLabel,
    sourceLabel,
    EFFECT_STATE_LABELS[item.metadata.implementationStatus],
    priceLabel
  ].filter((label): label is string => Boolean(label));

  return {
    itemId: item.id,
    name: item.name,
    rarity: item.rarity,
    rarityLabel,
    family: item.metadata.family,
    familyLabel,
    sourceLabel,
    effectText: item.effect,
    effectState: item.metadata.implementationStatus,
    effectStateLabel: EFFECT_STATE_LABELS[item.metadata.implementationStatus],
    effectStateKind: item.metadata.implementationStatus,
    badges,
    iconKind: item.metadata.family,
    iconLabel: `${familyLabel} item icon`,
    priceLabel,
    acquisitionLabel,
    metaLine: metaLabels.join(' | ')
  };
}

export function getItemFamilyLabel(family: ItemFamily): string {
  return FAMILY_LABELS[family];
}

function formatRarityLabel(rarity: ItemRarity): string {
  return rarity === 'prototype' ? 'Prototype' : toTitleCase(rarity);
}

function formatSourceLabel(item: ItemDefinition): string {
  return item.metadata.sources.map(toTitleCase).join('/');
}

function formatUiTagLabel(tag: ItemUiTag): string {
  return toTitleCase(tag);
}

function toTitleCase(value: string): string {
  return value
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
