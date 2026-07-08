import type { ItemTag } from '../content/items';
import type { Rng } from '../core/rng';
import { createRng } from '../core/rng';
import type { RouteKind, RouteOption } from './Generation';
import type { RunActPlan } from './ActPlan';

export type InterActChoiceKind =
  | 'repair'
  | 'intel'
  | 'market'
  | 'reward'
  | 'salvage'
  | 'risk';

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
}

export const EMPTY_INTER_ACT_EFFECTS: InterActEffectSummary = {
  targetActId: 'act_core_descent',
  targetActLabel: 'Core Descent',
  routeIntel: false,
  shopDiscount: 0,
  rewardChoiceBonus: 0,
  rewardBiasTags: [],
  riskLabels: []
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
  const optionalKinds = rng.shuffle<InterActChoiceKind>([
    'intel',
    'market',
    'reward',
    'salvage',
    'risk'
  ]);
  const selectedKinds: InterActChoiceKind[] = ['repair', ...optionalKinds.slice(0, 2)];

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
    shopDiscount: matchingRecords.reduce(
      (total, record) => total + record.effects.shopDiscount,
      0
    ),
    rewardChoiceBonus: matchingRecords.reduce(
      (total, record) => total + record.effects.rewardChoiceBonus,
      0
    ),
    rewardBiasTags: [...new Set(rewardBiasTags)],
    riskLabels: matchingRecords.flatMap((record) =>
      record.effects.riskLabel ? [record.effects.riskLabel] : []
    )
  };
}

export function formatInterActEffectsReadout(effects: InterActEffectSummary): string | null {
  const parts = [
    effects.routeIntel ? 'Act intel online' : null,
    effects.shopDiscount > 0 ? `Shop discount -${effects.shopDiscount}` : null,
    effects.rewardChoiceBonus > 0 ? `Rewards +${effects.rewardChoiceBonus} choice` : null,
    effects.rewardBiasTags.length > 0 ? `Reward bias ${effects.rewardBiasTags.join('/')}` : null,
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
        `${record.sourceActLabel} -> ${record.targetActLabel}: ${record.label} (${formatEffectDelta(
          record.effects
        )})`
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
  kind: InterActChoiceKind,
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
  kind: InterActChoiceKind,
  rng: Rng,
  availableCredits: number
): Omit<InterActChoice, 'id' | 'sourceActId' | 'sourceActLabel' | 'targetActId' | 'targetActLabel'> {
  if (kind === 'repair') {
    const creditCost = Math.min(availableCredits, 3 + rng.int(0, 2));

    return {
      kind,
      label: 'Patch Hull',
      meta: creditCost > 0 ? `Spend ${creditCost} credits` : 'Emergency waiver',
      summary: 'Dock crews weld a quick brace into the hull before the descent.',
      detail: 'Act II starts with +1 max hull from the refit.',
      effects: {
        ...createEmptyEffects(),
        creditsDelta: -creditCost,
        hullPatchDelta: 1
      }
    };
  }

  if (kind === 'intel') {
    return {
      kind,
      label: 'Plot Descent Intel',
      meta: 'Route previews',
      summary: 'A borrowed survey package decrypts Act II route pressure before launch.',
      detail: 'Act II route cards reveal pressure and reward intent.',
      effects: {
        ...createEmptyEffects(),
        routeIntel: true
      }
    };
  }

  if (kind === 'market') {
    const discount = 1 + rng.int(0, 1);

    return {
      kind,
      label: 'Broker Permit',
      meta: `Act II shops -${discount}`,
      summary: 'A market stamp follows the contract into deeper ports.',
      detail: `Act II shop prices are reduced by ${discount}.`,
      effects: {
        ...createEmptyEffects(),
        shopDiscount: discount
      }
    };
  }

  if (kind === 'reward') {
    const biasTag = rng.choice<ItemTag>(['drone', 'heat', 'missile', 'shield']);

    return {
      kind,
      label: 'Prize Manifest',
      meta: `+1 reward choice`,
      summary: 'A salvage broker marks one extra Act II reward crate for inspection.',
      detail: `Act II reward screens gain 1 extra choice and bias toward ${biasTag}.`,
      effects: {
        ...createEmptyEffects(),
        rewardChoiceBonus: 1,
        rewardBiasTags: [biasTag]
      }
    };
  }

  if (kind === 'salvage') {
    const salvageDelta = 3 + rng.int(0, 2);

    return {
      kind,
      label: 'Bank Salvage Advance',
      meta: `Gain ${salvageDelta} salvage`,
      summary: 'The archive authorizes a field advance against the deeper contract.',
      detail: 'The salvage is carried into Act II and counted in the run summary.',
      effects: {
        ...createEmptyEffects(),
        salvageDelta
      }
    };
  }

  return {
    kind,
    label: 'Overburn Descent',
    meta: '+5 salvage, +1 curse',
    summary: 'A risky slingshot reaches the core layer ahead of schedule.',
    detail: 'Gain salvage and an extra reward choice, but carry 1 curse into Act II.',
    effects: {
      ...createEmptyEffects(),
      salvageDelta: 5,
      curseDelta: 1,
      rewardChoiceBonus: 1,
      rewardBiasTags: ['curse', 'overkill'],
      riskLabel: 'Overburn risk +1 curse'
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
    riskLabel: null
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

function formatEffectDelta(effects: InterActChoiceEffects): string {
  return [
    effects.creditsDelta === 0 ? null : `${effects.creditsDelta > 0 ? '+' : ''}${effects.creditsDelta} credits`,
    effects.salvageDelta === 0 ? null : `${effects.salvageDelta > 0 ? '+' : ''}${effects.salvageDelta} salvage`,
    effects.hullPatchDelta === 0 ? null : `+${effects.hullPatchDelta} hull`,
    effects.curseDelta === 0 ? null : `+${effects.curseDelta} curse`,
    effects.routeIntel ? 'intel' : null,
    effects.shopDiscount > 0 ? `-${effects.shopDiscount} shop` : null,
    effects.rewardChoiceBonus > 0 ? `+${effects.rewardChoiceBonus} reward choice` : null
  ]
    .filter((part): part is string => part !== null)
    .join(', ');
}
