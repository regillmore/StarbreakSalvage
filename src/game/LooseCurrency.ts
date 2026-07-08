import type { EnvironmentObjectPlacement } from './EnvironmentObjectPlacement';
import type { SectorHazardPlan, SectorLandmarkPlan } from './SectorFeatures';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';

export type LooseCurrencyKind = 'credit' | 'salvage';

export type LooseCurrencySource =
  | 'enemy'
  | 'boss'
  | 'destructible'
  | 'obstacle'
  | 'hazard'
  | 'sectorFeature'
  | 'routeEvent'
  | 'debug';

export type LooseCurrencyTier = 'chip' | 'cache' | 'burst';

export interface LooseCurrencyPickupSpec {
  readonly kind: LooseCurrencyKind;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly value: number;
  readonly ttl: number;
  readonly collectionRadius: number;
  readonly source: LooseCurrencySource;
  readonly tier: LooseCurrencyTier;
  readonly debugLabel: string;
}

export interface LooseCurrencyScatterOptions {
  readonly seed: string;
  readonly sourceId: string;
  readonly source: LooseCurrencySource;
  readonly x: number;
  readonly y: number;
  readonly credits?: number;
  readonly salvage?: number;
  readonly maxPickups?: number;
  readonly spread?: number;
  readonly baseVy?: number;
  readonly debugLabel?: string;
}

export interface LooseCurrencyPlanEvent {
  readonly id: string;
  readonly source: LooseCurrencySource;
  readonly distance: number;
  readonly xRatio: number;
  readonly credits: number;
  readonly salvage: number;
  readonly spread: number;
  readonly baseVy: number;
  readonly label: string;
}

export interface LooseCurrencyPlan {
  readonly seed: string;
  readonly sectorId: string;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly events: readonly LooseCurrencyPlanEvent[];
}

export interface LooseCurrencyPlanOptions {
  readonly seed: string;
  readonly sectorId: string;
  readonly sectorIndex: number;
  readonly scrollLength: number;
  readonly hazards?: readonly Pick<
    SectorHazardPlan,
    'id' | 'kind' | 'telegraphDistance' | 'startDistance' | 'endDistance' | 'xRatio' | 'widthRatio' | 'label'
  >[];
  readonly landmarks?: readonly Pick<
    SectorLandmarkPlan,
    'id' | 'kind' | 'distance' | 'xRatio' | 'label'
  >[];
  readonly environmentObjects?: readonly Pick<
    EnvironmentObjectPlacement,
    'id' | 'layoutRole' | 'distance' | 'x' | 'debugLabel'
  >[];
  readonly routeEventBias?: 'none' | 'hazard' | 'elite' | 'market' | 'salvage';
}

export interface LooseCurrencyPickupLike {
  readonly kind: LooseCurrencyKind;
  readonly value: number;
  readonly source?: LooseCurrencySource;
}

export interface LooseCurrencyDebugSummary {
  readonly activePickups: number;
  readonly activeValue: number;
  readonly creditValue: number;
  readonly salvageValue: number;
  readonly pickupCap: number;
  readonly valueCap: number;
  readonly cappedPickups: number;
  readonly cappedValue: number;
}

export const LOOSE_CURRENCY_ACTIVE_PICKUP_CAP = 48;
export const LOOSE_CURRENCY_ACTIVE_VALUE_CAP = 120;
export const LOOSE_CURRENCY_DEFAULT_TTL_SECONDS = 13.5;
export const LOOSE_CURRENCY_COLLECTION_RADIUS = 18;

const PLANNED_ECONOMY_VALUE_CAP = 18;
const SALVAGE_ECONOMY_WEIGHT = 4;
const MIN_EVENT_DISTANCE = 90;
const EXIT_CLEAR_DISTANCE = 260;
const HAZARD_EVENT_LIMIT = 2;
const LANDMARK_EVENT_LIMIT = 2;
const OBJECT_EVENT_LIMIT = 2;

export function createLooseCurrencyScatter(
  options: LooseCurrencyScatterOptions
): readonly LooseCurrencyPickupSpec[] {
  const rng = createRng(
    `${options.seed}:loose-currency:${options.source}:${options.sourceId}`
  );
  const entries = createCurrencyEntries(options);
  const pickupLimit = Math.max(0, Math.floor(options.maxPickups ?? 6));
  const spread = Math.max(0, options.spread ?? getDefaultSpread(options.source));
  const baseVy = options.baseVy ?? getDefaultBaseVy(options.source);
  const specs: LooseCurrencyPickupSpec[] = [];
  const plannedPickupCount = Math.min(
    pickupLimit,
    entries.reduce((total, entry) => total + entry.values.length, 0)
  );
  const centerOffset = (plannedPickupCount - 1) / 2;

  for (const entry of entries) {
    for (let index = 0; index < entry.values.length && specs.length < pickupLimit; index += 1) {
      const value = entry.values[index];

      if (value === undefined || value <= 0) {
        continue;
      }

      const xJitter = (rng.nextFloat() - 0.5) * spread;
      const yJitter = rng.int(-8, 8);
      const tier = getLooseCurrencyTier(value);
      const radius = getLooseCurrencyRadius(entry.kind, tier);
      const offsetIndex = specs.length - centerOffset;

      specs.push({
        kind: entry.kind,
        x: roundCurrencyValue(options.x + offsetIndex * 9 + xJitter),
        y: roundCurrencyValue(options.y + yJitter),
        vx: roundCurrencyValue(offsetIndex * 19 + (rng.nextFloat() - 0.5) * spread * 1.45),
        vy: roundCurrencyValue(baseVy + rng.nextFloat() * 28),
        radius,
        value,
        ttl: LOOSE_CURRENCY_DEFAULT_TTL_SECONDS,
        collectionRadius: Math.max(LOOSE_CURRENCY_COLLECTION_RADIUS, radius + 9),
        source: options.source,
        tier,
        debugLabel: options.debugLabel ?? `${options.source}:${options.sourceId}`
      });
    }
  }

  return specs;
}

export function createLooseCurrencyPlan(options: LooseCurrencyPlanOptions): LooseCurrencyPlan {
  const rng = createRng(`${options.seed}:loose-currency-plan:${options.sectorId}`);
  const events: LooseCurrencyPlanEvent[] = [];
  const maxEconomyValue = PLANNED_ECONOMY_VALUE_CAP + Math.min(6, options.sectorIndex * 2);
  let economyValue = 0;

  const pushEvent = (event: LooseCurrencyPlanEvent): void => {
    const weightedValue = getPlanEventEconomyValue(event);

    if (weightedValue <= 0 || economyValue + weightedValue > maxEconomyValue) {
      return;
    }

    economyValue += weightedValue;
    events.push(event);
  };

  const routeBias = options.routeEventBias ?? 'none';
  const routeCredits =
    routeBias === 'market' ? 3 : routeBias === 'elite' || routeBias === 'hazard' ? 2 : 1;
  const routeSalvage = routeBias === 'salvage' || options.sectorIndex >= 3 ? 1 : 0;

  pushEvent({
    id: `route-${options.sectorId}-${options.sectorIndex}`,
    source: 'routeEvent',
    distance: clampEventDistance(options.scrollLength * (0.18 + rng.nextFloat() * 0.08), options),
    xRatio: roundRatio(clamp(0.28 + rng.nextFloat() * 0.44, 0.18, 0.82)),
    credits: routeCredits,
    salvage: routeSalvage,
    spread: 32,
    baseVy: 22,
    label: `${routeBias === 'none' ? 'route' : routeBias} salvage lane`
  });

  for (const [index, landmark] of (options.landmarks ?? []).slice(0, LANDMARK_EVENT_LIMIT).entries()) {
    const salvage = landmark.kind === 'vault_door' || landmark.kind === 'surface_relay' ? 1 : 0;

    pushEvent({
      id: `feature-${landmark.id}`,
      source: 'sectorFeature',
      distance: clampEventDistance(landmark.distance - 58 + index * 18, options),
      xRatio: roundRatio(clamp(landmark.xRatio + (rng.nextFloat() - 0.5) * 0.12, 0.14, 0.86)),
      credits: 1 + (index % 2),
      salvage,
      spread: 38,
      baseVy: 18,
      label: `${landmark.label} loose cache`
    });
  }

  for (const [index, hazard] of (options.hazards ?? []).slice(0, HAZARD_EVENT_LIMIT).entries()) {
    const hazardEdge = rng.nextFloat() < 0.5 ? -1 : 1;
    const xRatio = hazard.xRatio + hazardEdge * Math.max(0.04, hazard.widthRatio * 0.58);

    pushEvent({
      id: `hazard-${hazard.id}`,
      source: 'hazard',
      distance: clampEventDistance(hazard.telegraphDistance - 36 + index * 12, options),
      xRatio: roundRatio(clamp(xRatio, 0.12, 0.88)),
      credits: hazard.kind === 'mine_belt' ? 3 : 1,
      salvage: hazard.kind === 'salvage_storm' ? 1 : 0,
      spread: 24,
      baseVy: 14,
      label: `${hazard.label} skim`
    });
  }

  for (const [index, object] of (options.environmentObjects ?? [])
    .filter((object) => object.layoutRole === 'cover' || object.layoutRole === 'gate')
    .slice(0, OBJECT_EVENT_LIMIT)
    .entries()) {
    pushEvent({
      id: `obstacle-${object.id}`,
      source: 'obstacle',
      distance: clampEventDistance(object.distance - 42 + index * 16, options),
      xRatio: roundRatio(clamp(object.x / 640, 0.16, 0.84)),
      credits: 1,
      salvage: object.layoutRole === 'gate' && options.sectorIndex >= 2 ? 1 : 0,
      spread: 28,
      baseVy: 20,
      label: `${object.debugLabel} loose trail`
    });
  }

  return {
    seed: options.seed,
    sectorId: options.sectorId,
    sectorIndex: options.sectorIndex,
    scrollLength: options.scrollLength,
    events: events.sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id))
  };
}

export function summarizeLooseCurrencyPickups(
  pickups: readonly LooseCurrencyPickupLike[]
): LooseCurrencyDebugSummary {
  let creditValue = 0;
  let salvageValue = 0;
  let activePickups = 0;

  for (const pickup of pickups) {
    const value = Math.max(0, Math.floor(pickup.value));

    if (value <= 0) {
      continue;
    }

    activePickups += 1;

    if (pickup.kind === 'credit') {
      creditValue += value;
    } else {
      salvageValue += value;
    }
  }

  const activeValue = creditValue + salvageValue;

  return {
    activePickups,
    activeValue,
    creditValue,
    salvageValue,
    pickupCap: LOOSE_CURRENCY_ACTIVE_PICKUP_CAP,
    valueCap: LOOSE_CURRENCY_ACTIVE_VALUE_CAP,
    cappedPickups: Math.max(0, activePickups - LOOSE_CURRENCY_ACTIVE_PICKUP_CAP),
    cappedValue: Math.max(0, activeValue - LOOSE_CURRENCY_ACTIVE_VALUE_CAP)
  };
}

function createCurrencyEntries(
  options: LooseCurrencyScatterOptions
): readonly {
  readonly kind: LooseCurrencyKind;
  readonly values: readonly number[];
}[] {
  const credits = Math.max(0, Math.floor(options.credits ?? 0));
  const salvage = Math.max(0, Math.floor(options.salvage ?? 0));
  const maxPickups = Math.max(1, Math.floor(options.maxPickups ?? 6));
  const entries: {
    readonly kind: LooseCurrencyKind;
    readonly values: readonly number[];
  }[] = [];

  if (credits > 0) {
    const creditPieces = choosePieceCount('credit', credits, options.source, maxPickups);
    entries.push({ kind: 'credit', values: splitCurrencyValue(credits, creditPieces) });
  }

  if (salvage > 0) {
    const remaining = Math.max(1, maxPickups - entries.reduce((total, entry) => total + entry.values.length, 0));
    const salvagePieces = choosePieceCount('salvage', salvage, options.source, remaining);
    entries.push({ kind: 'salvage', values: splitCurrencyValue(salvage, salvagePieces) });
  }

  return entries;
}

function choosePieceCount(
  kind: LooseCurrencyKind,
  value: number,
  source: LooseCurrencySource,
  maxPieces: number
): number {
  const basePieces =
    kind === 'salvage'
      ? value >= 8 && source === 'boss'
        ? 2
        : 1
      : value >= 9 || source === 'boss'
        ? 3
        : value >= 5
          ? 2
          : 1;

  return clamp(Math.min(basePieces, maxPieces), 1, Math.max(1, maxPieces));
}

function splitCurrencyValue(value: number, pieces: number): readonly number[] {
  const safePieces = clamp(Math.floor(pieces), 1, Math.max(1, value));
  const base = Math.floor(value / safePieces);
  let remainder = value % safePieces;
  const values: number[] = [];

  for (let index = 0; index < safePieces; index += 1) {
    const bonus = remainder > 0 ? 1 : 0;
    remainder -= bonus;
    values.push(base + bonus);
  }

  return values;
}

function getLooseCurrencyTier(value: number): LooseCurrencyTier {
  if (value >= 7) {
    return 'burst';
  }

  if (value >= 3) {
    return 'cache';
  }

  return 'chip';
}

function getLooseCurrencyRadius(kind: LooseCurrencyKind, tier: LooseCurrencyTier): number {
  const baseRadius = tier === 'burst' ? 9 : tier === 'cache' ? 7.5 : 6.25;
  return kind === 'salvage' ? baseRadius + 0.5 : baseRadius;
}

function getDefaultSpread(source: LooseCurrencySource): number {
  if (source === 'boss') {
    return 62;
  }

  if (source === 'enemy' || source === 'destructible') {
    return 42;
  }

  return 30;
}

function getDefaultBaseVy(source: LooseCurrencySource): number {
  if (source === 'boss') {
    return 58;
  }

  if (source === 'enemy' || source === 'destructible') {
    return 36;
  }

  return 18;
}

function getPlanEventEconomyValue(event: LooseCurrencyPlanEvent): number {
  return event.credits + event.salvage * SALVAGE_ECONOMY_WEIGHT;
}

function clampEventDistance(
  distance: number,
  options: Pick<LooseCurrencyPlanOptions, 'scrollLength'>
): number {
  const latestDistance = Math.max(MIN_EVENT_DISTANCE, options.scrollLength - EXIT_CLEAR_DISTANCE);
  return roundCurrencyValue(clamp(distance, MIN_EVENT_DISTANCE, latestDistance));
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundCurrencyValue(value: number): number {
  return Math.round(value * 100) / 100;
}
