import type { ItemTag } from '../content/items';
import type { Rng } from '../core/rng';
import { createRng } from '../core/rng';
import type { RouteKind, RouteOption } from './Generation';
import type { RunActPlan } from './ActPlan';

export type InterActChoiceKind =
  'repair' | 'ordnance' | 'vector' | 'intel' | 'market' | 'reward' | 'salvage' | 'risk';

type FreshInterActChoiceKind = Extract<InterActChoiceKind, 'repair' | 'ordnance' | 'vector'>;

export interface InterActShipRefitEffects {
  readonly speedDelta: number;
  readonly hitRadiusDelta: number;
  readonly bombCapacityDelta: number;
  readonly specialChargeMultiplierDelta: number;
}

export interface InterActChoiceEffects {
  readonly creditsDelta: number;
  readonly salvageDelta: number;
  readonly hullPatchDelta: number;
  readonly curseDelta: number;
  readonly routeIntel: boolean;
  readonly shopDiscount: number;
  readonly rewardChoiceBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly riskLabel: string | null;
  /** Optional only so deployed pre-WO227 records remain loadable. */
  readonly shipRefit?: InterActShipRefitEffects;
}

export interface InterActChoice {
  readonly id: string;
  readonly kind: InterActChoiceKind;
  readonly label: string;
  readonly meta: string;
  readonly summary: string;
  readonly detail: string;
  readonly sourceActId: RunActPlan['id'];
  readonly sourceActLabel: string;
  readonly targetActId: RunActPlan['id'];
  readonly targetActLabel: string;
  readonly effects: InterActChoiceEffects;
}

export interface InterActChoiceRecord {
  readonly id: string;
  readonly kind: InterActChoiceKind;
  readonly label: string;
  readonly summary: string;
  readonly sourceActId: RunActPlan['id'];
  readonly sourceActLabel: string;
  readonly targetActId: RunActPlan['id'];
  readonly targetActLabel: string;
  readonly effects: InterActChoiceEffects;
}

export interface InterActEffectSummary {
  readonly targetActId: RunActPlan['id'];
  readonly targetActLabel: string;
  readonly routeIntel: boolean;
  readonly shopDiscount: number;
  readonly rewardChoiceBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly riskLabels: readonly string[];
  readonly shipRefit: InterActShipRefitEffects;
}

export const EMPTY_INTER_ACT_SHIP_REFIT: InterActShipRefitEffects = {
  speedDelta: 0,
  hitRadiusDelta: 0,
  bombCapacityDelta: 0,
  specialChargeMultiplierDelta: 0
};

export const EMPTY_INTER_ACT_EFFECTS: InterActEffectSummary = {
  targetActId: 'act_core_descent',
  targetActLabel: 'Core Descent',
  routeIntel: false,
  shopDiscount: 0,
  rewardChoiceBonus: 0,
  rewardBiasTags: [],
  riskLabels: [],
  shipRefit: EMPTY_INTER_ACT_SHIP_REFIT
};

export function createInterActJunctionChoices(options: {
  readonly runSeed: string;
  readonly sourceAct: RunActPlan;
  readonly targetAct: RunActPlan;
  readonly credits: number;
  readonly salvage: number;
  readonly hullPatch: number;
  readonly curse: number;
  readonly saveFingerprint: string;
}): InterActChoice[] {
  const stateKey = [
    options.sourceAct.id,
    options.targetAct.id,
    options.credits,
    options.salvage,
    options.hullPatch,
    options.curse,
    options.saveFingerprint
  ].join(':');
  const rng = createRng(`${options.runSeed}:inter-act-junction:${stateKey}`);
  const selectedKinds: readonly FreshInterActChoiceKind[] = ['repair', 'ordnance', 'vector'];

  return selectedKinds.map((kind, index) =>
    createChoice(kind, index + 1, rng.fork(`${kind}-${index + 1}`), options)
  );
}

export function createInterActChoiceRecord(choice: InterActChoice): InterActChoiceRecord {
  return {
    id: choice.id,
    kind: choice.kind,
    label: choice.label,
    summary: choice.summary,
    sourceActId: choice.sourceActId,
    sourceActLabel: choice.sourceActLabel,
    targetActId: choice.targetActId,
    targetActLabel: choice.targetActLabel,
    effects: choice.effects
  };
}

export function combineInterActEffects(
  targetActId: RunActPlan['id'],
  targetActLabel: string,
  records: readonly InterActChoiceRecord[]
): InterActEffectSummary {
  const matchingRecords = records.filter((record) => record.targetActId === targetActId);

  if (matchingRecords.length === 0) {
    return {
      ...EMPTY_INTER_ACT_EFFECTS,
      targetActId,
      targetActLabel
    };
  }

  const rewardBiasTags = matchingRecords.flatMap((record) => record.effects.rewardBiasTags);

  return {
    targetActId,
    targetActLabel,
    routeIntel: matchingRecords.some((record) => record.effects.routeIntel),
    shopDiscount: matchingRecords.reduce((total, record) => total + record.effects.shopDiscount, 0),
    rewardChoiceBonus: matchingRecords.reduce(
      (total, record) => total + record.effects.rewardChoiceBonus,
      0
    ),
    rewardBiasTags: [...new Set(rewardBiasTags)],
    riskLabels: matchingRecords.flatMap((record) =>
      record.effects.riskLabel ? [record.effects.riskLabel] : []
    ),
    shipRefit: combineInterActShipRefitEffects(matchingRecords)
  };
}

export function combineInterActShipRefitEffects(
  records: readonly InterActChoiceRecord[]
): InterActShipRefitEffects {
  return records.reduce<InterActShipRefitEffects>((combined, record) => {
    const refit = record.effects.shipRefit ?? EMPTY_INTER_ACT_SHIP_REFIT;
    return {
      speedDelta: combined.speedDelta + refit.speedDelta,
      hitRadiusDelta: combined.hitRadiusDelta + refit.hitRadiusDelta,
      bombCapacityDelta: combined.bombCapacityDelta + refit.bombCapacityDelta,
      specialChargeMultiplierDelta:
        combined.specialChargeMultiplierDelta + refit.specialChargeMultiplierDelta
    };
  }, EMPTY_INTER_ACT_SHIP_REFIT);
}

export function formatInterActEffectsReadout(effects: InterActEffectSummary): string | null {
  const parts = [
    effects.routeIntel ? 'Act intel online' : null,
    effects.shopDiscount > 0 ? `Shop discount -${effects.shopDiscount}` : null,
    effects.rewardBiasTags.length > 0 ? `Reward bias ${effects.rewardBiasTags.join('/')}` : null,
    effects.shipRefit.bombCapacityDelta > 0
      ? `Bomb stock +${effects.shipRefit.bombCapacityDelta}`
      : null,
    effects.shipRefit.specialChargeMultiplierDelta > 0
      ? `Special charge +${Math.round(effects.shipRefit.specialChargeMultiplierDelta * 100)}%`
      : null,
    effects.shipRefit.speedDelta > 0 ? `Speed +${effects.shipRefit.speedDelta}` : null,
    effects.shipRefit.hitRadiusDelta < 0 ? `Hit radius ${effects.shipRefit.hitRadiusDelta}` : null,
    ...effects.riskLabels
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? `Junction: ${parts.join(' | ')}` : null;
}

export function formatInterActHistory(records: readonly InterActChoiceRecord[]): string {
  if (records.length === 0) {
    return 'none';
  }

  return records
    .map(
      (record) =>
        `${record.sourceActLabel} -> ${record.targetActLabel}: ${record.label} (${formatInterActEffectDelta(record.effects)})`
    )
    .join(' | ');
}

export function createInterActRouteIntelHint(route: RouteOption): string {
  const pressure =
    route.risk <= 2 ? 'low pressure' : route.risk <= 4 ? 'medium pressure' : 'high pressure';
  const routeNote = getRouteIntelNote(route.kind);

  return `Junction intel: ${pressure}, ${routeNote}`;
}

function createChoice(
  kind: FreshInterActChoiceKind,
  slot: number,
  rng: Rng,
  options: {
    readonly runSeed: string;
    readonly sourceAct: RunActPlan;
    readonly targetAct: RunActPlan;
    readonly credits: number;
    readonly salvage: number;
    readonly hullPatch: number;
    readonly curse: number;
    readonly saveFingerprint: string;
  }
): InterActChoice {
  const choice = createChoiceBody(kind, rng, options.credits);

  return {
    ...choice,
    id: `${options.sourceAct.id}-${options.targetAct.id}-${slot}-${kind}`,
    sourceActId: options.sourceAct.id,
    sourceActLabel: options.sourceAct.label,
    targetActId: options.targetAct.id,
    targetActLabel: options.targetAct.label
  };
}

function createChoiceBody(
  kind: FreshInterActChoiceKind,
  rng: Rng,
  availableCredits: number
): Omit<
  InterActChoice,
  'id' | 'sourceActId' | 'sourceActLabel' | 'targetActId' | 'targetActLabel'
> {
  if (kind === 'repair') {
    const creditCost = Math.min(availableCredits, 3 + rng.int(0, 2));

    return {
      kind,
      label: 'Patch Hull',
      meta:
        creditCost > 0 ? `+1 max hull | ${creditCost} credits` : '+1 max hull | emergency waiver',
      summary: 'Dock crews weld an ablative keel into the ship before the descent.',
      detail: 'Add +1 maximum hull for the rest of the run.',
      effects: {
        ...createEmptyEffects(),
        creditsDelta: -creditCost,
        hullPatchDelta: 1
      }
    };
  }

  if (kind === 'ordnance') {
    return {
      kind,
      label: 'Deep-Cycle Magazine',
      meta: '+1 bomb | +25% special charge',
      summary: 'A deep-cycle ordnance cradle feeds both emergency weapon systems.',
      detail: 'Carry one additional bomb and recharge special attacks 25% faster.',
      effects: {
        ...createEmptyEffects(),
        shipRefit: {
          ...EMPTY_INTER_ACT_SHIP_REFIT,
          bombCapacityDelta: 1,
          specialChargeMultiplierDelta: 0.25
        }
      }
    };
  }

  return {
    kind,
    label: 'Vector Shear Vanes',
    meta: '+40 speed | -2 hit radius',
    summary: 'Trim vanes tighten the ship silhouette and sharpen lateral response.',
    detail: 'Gain 40 movement speed and reduce the player hit radius by 2 units.',
    effects: {
      ...createEmptyEffects(),
      shipRefit: {
        ...EMPTY_INTER_ACT_SHIP_REFIT,
        speedDelta: 40,
        hitRadiusDelta: -2
      }
    }
  };
}

function createEmptyEffects(): InterActChoiceEffects {
  return {
    creditsDelta: 0,
    salvageDelta: 0,
    hullPatchDelta: 0,
    curseDelta: 0,
    routeIntel: false,
    shopDiscount: 0,
    rewardChoiceBonus: 0,
    rewardBiasTags: [],
    riskLabel: null,
    shipRefit: EMPTY_INTER_ACT_SHIP_REFIT
  };
}

function getRouteIntelNote(kind: RouteKind): string {
  if (kind === 'shop') {
    return 'market stop before the next sector.';
  }

  if (kind === 'repair') {
    return 'service lane can stabilize future hull.';
  }

  if (kind === 'vault') {
    return 'relic pool and curse exposure likely.';
  }

  if (kind === 'elite') {
    return 'bounty pressure can widen rewards.';
  }

  if (kind === 'glitch') {
    return 'seed shear can distort sector pacing.';
  }

  return 'faction cache with escort pressure.';
}

export function formatInterActEffectDelta(effects: InterActChoiceEffects): string {
  return [
    effects.creditsDelta === 0
      ? null
      : `${effects.creditsDelta > 0 ? '+' : ''}${effects.creditsDelta} credits`,
    effects.salvageDelta === 0
      ? null
      : `${effects.salvageDelta > 0 ? '+' : ''}${effects.salvageDelta} salvage`,
    effects.hullPatchDelta === 0 ? null : `+${effects.hullPatchDelta} hull`,
    effects.curseDelta === 0 ? null : `+${effects.curseDelta} curse`,
    effects.routeIntel ? 'intel' : null,
    effects.shopDiscount > 0 ? `-${effects.shopDiscount} shop` : null,
    effects.rewardBiasTags.length > 0 ? `${effects.rewardBiasTags.join('/')} reward bias` : null,
    (effects.shipRefit?.bombCapacityDelta ?? 0) === 0
      ? null
      : `+${effects.shipRefit?.bombCapacityDelta ?? 0} bomb`,
    (effects.shipRefit?.specialChargeMultiplierDelta ?? 0) === 0
      ? null
      : `+${Math.round((effects.shipRefit?.specialChargeMultiplierDelta ?? 0) * 100)}% special charge`,
    (effects.shipRefit?.speedDelta ?? 0) === 0
      ? null
      : `+${effects.shipRefit?.speedDelta ?? 0} speed`,
    (effects.shipRefit?.hitRadiusDelta ?? 0) === 0
      ? null
      : `${effects.shipRefit?.hitRadiusDelta ?? 0} hit radius`
  ]
    .filter((part): part is string => part !== null)
    .join(', ');
}
