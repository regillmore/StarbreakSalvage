import type { ItemTag, RewardPoolDefinition } from '../content/items';
import type { FactionId } from '../content/factions';
import { createRng } from '../core/rng';
import {
  createActEconomyProfile,
  getActEconomyRouteCreditBonus,
  getActEconomyRouteSalvageBonus
} from './ActEconomy';
import type { RouteKind, RouteOption, RunSkeleton, SectorRoute } from './Generation';

export interface RouteCombatModifier {
  readonly targetSectorIndex: number;
  readonly label: string;
  readonly enemyHullBonus: number;
  readonly enemyFireDelayMultiplier: number;
  readonly bossHullBonus: number;
}

export interface RouteRewardModifier {
  readonly choiceBonus: number;
  readonly creditBonus: number;
  readonly biasTags: readonly ItemTag[];
  readonly poolIdOverride: RewardPoolDefinition['id'] | null;
}

export interface RouteShopModifier {
  readonly discount: number;
  readonly stockBonus: number;
  readonly biasTags: readonly ItemTag[];
}

export interface RouteOutcomeEffects {
  readonly creditsDelta: number;
  readonly salvageDelta: number;
  readonly hullPatchDelta: number;
  readonly curseDelta: number;
  readonly relicDelta: number;
  readonly reward: RouteRewardModifier;
  readonly shop: RouteShopModifier | null;
  readonly combat: RouteCombatModifier | null;
}

export interface AppliedRouteOutcome {
  readonly id: string;
  readonly sourceSectorIndex?: number;
  readonly sectorIndex: number;
  readonly routeKind: RouteKind;
  readonly routeLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly effects: RouteOutcomeEffects;
}

const EMPTY_REWARD_MODIFIER: RouteRewardModifier = {
  choiceBonus: 0,
  creditBonus: 0,
  biasTags: [],
  poolIdOverride: null
};

export function generateRouteOutcome(options: {
  readonly run: RunSkeleton;
  readonly sector: SectorRoute;
  readonly route: RouteOption;
  readonly availableCredits: number;
  readonly targetSectorIndex?: number | null;
}): AppliedRouteOutcome {
  const targetSectorIndex =
    options.targetSectorIndex === undefined
      ? options.sector.index < options.run.sectors.length
        ? options.sector.index
        : null
      : options.targetSectorIndex;
  const rng = createRng(
    `${options.run.seed}:route-outcome:${options.sector.sectorId}:${options.route.kind}`
  );
  const actEconomy = createActEconomyProfile(options.sector);
  const routeCreditBonus = getActEconomyRouteCreditBonus(actEconomy, options.route.kind);
  const routeSalvageBonus = getActEconomyRouteSalvageBonus(actEconomy, options.route.kind);
  const actDetails = actEconomy.escalated
    ? [`${actEconomy.actShortLabel} economy: ${actEconomy.debugLabel}.`]
    : [];

  switch (options.route.kind) {
    case 'shop': {
      const discount = rng.int(1, 2);
      const focusTag = rng.choice<ItemTag>(['credit', 'drone', 'heat', 'missile']);

      return createOutcome(options, {
        title: 'Black-Market Berth',
        summary: 'A licensed salvage broker unlocks controlled inventory for this stop.',
        details: [
          `Shop prices reduced by ${discount}.`,
          `Shop inventory gains 1 extra slot biased toward ${focusTag}.`,
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          shop: {
            discount,
            stockBonus: 1,
            biasTags: ['credit', focusTag]
          }
        }
      });
    }

    case 'elite': {
      const salvageDelta = options.route.risk + rng.int(1, 2) + routeSalvageBonus;
      const rewardCreditBonus = 4 + routeCreditBonus;

      return createOutcome(options, {
        title: 'Elite Bounty Posted',
        summary: 'An ace wing marks your transponder, but the bounty purse is already leaking.',
        details: [
          `Gain ${salvageDelta} salvage.`,
          `Reward screen gains 1 extra choice and +${rewardCreditBonus} credit cash-out.`,
          targetSectorIndex === null
            ? 'No future sector remains for the bounty wing.'
            : 'Next sector enemies gain +1 hull and open fire 10% sooner.',
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          salvageDelta,
          reward: {
            choiceBonus: 1,
            creditBonus: rewardCreditBonus,
            biasTags: ['overkill', 'drone'],
            poolIdOverride: null
          },
          combat:
            targetSectorIndex === null
              ? null
              : {
                  targetSectorIndex,
                  label: 'Elite bounty wing',
                  enemyHullBonus: 1,
                  enemyFireDelayMultiplier: 0.9,
                  bossHullBonus: 0
                }
        }
      });
    }

    case 'vault': {
      const salvageDelta = 2 + rng.int(0, 2) + routeSalvageBonus;
      const creditCost = Math.min(
        options.availableCredits,
        rng.int(1, 3) + actEconomy.vaultCreditSurcharge
      );

      return createOutcome(options, {
        title: 'Sealed Vault Breach',
        summary: 'The door opens on relic-grade loot, and the lock writes something back.',
        details: [
          creditCost > 0 ? `Spend ${creditCost} credits on cutting charges.` : 'No credits spent.',
          `Gain ${salvageDelta} salvage, 1 relic marker, and 1 curse.`,
          'Reward pool switches to vault items with 1 extra choice.',
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          creditsDelta: -creditCost,
          salvageDelta,
          curseDelta: 1,
          relicDelta: 1,
          reward: {
            choiceBonus: 1,
            creditBonus: 0,
            biasTags: ['curse', 'phase'],
            poolIdOverride: 'vault'
          }
        }
      });
    }

    case 'repair': {
      const creditCost = Math.min(
        options.availableCredits,
        4 + options.sector.index + actEconomy.repairCreditSurcharge
      );
      const rewardCreditBonus = 2 + routeCreditBonus;

      return createOutcome(options, {
        title: 'Patch Bay Invoice',
        summary: 'A tired dock crew welds a permanent brace into the contract hull.',
        details: [
          creditCost > 0 ? `Spend ${creditCost} credits.` : 'Emergency credit waiver accepted.',
          'Future sectors gain +1 max hull.',
          `Reward bias leans toward shield, armor, and credit items with +${rewardCreditBonus} credit cash-out.`,
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          creditsDelta: -creditCost,
          hullPatchDelta: 1,
          reward: {
            choiceBonus: 0,
            creditBonus: rewardCreditBonus,
            biasTags: ['shield', 'armor', 'credit'],
            poolIdOverride: null
          }
        }
      });
    }

    case 'glitch': {
      const variance = rng.choice([-3, 0, 5]);
      const creditsDelta =
        variance < 0
          ? -Math.min(options.availableCredits, Math.abs(variance))
          : variance + routeCreditBonus;
      const biasTag = rng.choice<ItemTag>(['phase', 'heat', 'curse', 'ricochet']);

      return createOutcome(options, {
        title: 'Glitch Wake',
        summary:
          'The nav seed desynchronizes just enough to make the next sector profitable and weird.',
        details: [
          creditsDelta === 0
            ? 'Credits remain stable.'
            : creditsDelta > 0
              ? `Gain ${creditsDelta} credits.`
              : `Lose ${Math.abs(creditsDelta)} credits.`,
          'Reward screen gains 1 extra choice biased toward phase tech.',
          targetSectorIndex === null
            ? 'The distortion has no future sector to infect.'
            : 'Next sector enemies open fire 16% sooner; the boss gains +1 hull.',
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          creditsDelta,
          curseDelta: variance < 0 ? 1 : 0,
          reward: {
            choiceBonus: 1,
            creditBonus: 1,
            biasTags: ['phase', biasTag],
            poolIdOverride: variance < 0 ? 'vault' : null
          },
          combat:
            targetSectorIndex === null
              ? null
              : {
                  targetSectorIndex,
                  label: 'Glitched nav wake',
                  enemyHullBonus: 0,
                  enemyFireDelayMultiplier: 0.84,
                  bossHullBonus: 1
                }
        }
      });
    }

    case 'factionAmbush': {
      const salvageDelta = Math.max(2, options.route.risk) + routeSalvageBonus;
      const biasTags = getFactionBiasTags(options.sector.bossFactionId);
      const rewardCreditBonus = 3 + routeCreditBonus;

      return createOutcome(options, {
        title: 'Faction Ambush Signal',
        summary: 'You spoof a faction convoy, steal its cache, and leave a furious escort behind.',
        details: [
          `Gain ${salvageDelta} salvage.`,
          `Rewards bias toward ${biasTags.join(' and ')} parts.`,
          targetSectorIndex === null
            ? 'No future sector remains for the escort.'
            : 'Next sector enemies gain +1 hull, fire 12% sooner, and the boss gains +1 hull.',
          ...actDetails
        ],
        effects: {
          ...createEmptyEffects(),
          salvageDelta,
          reward: {
            choiceBonus: 0,
            creditBonus: rewardCreditBonus,
            biasTags,
            poolIdOverride: null
          },
          combat:
            targetSectorIndex === null
              ? null
              : {
                  targetSectorIndex,
                  label: 'Faction escort pursuit',
                  enemyHullBonus: 1,
                  enemyFireDelayMultiplier: 0.88,
                  bossHullBonus: 1
                }
        }
      });
    }
  }
}

export function describeRouteOutcome(outcome: AppliedRouteOutcome): string {
  const effectParts: string[] = [];

  if (outcome.effects.creditsDelta !== 0) {
    effectParts.push(`${formatSigned(outcome.effects.creditsDelta)} credits`);
  }

  if (outcome.effects.salvageDelta !== 0) {
    effectParts.push(`${formatSigned(outcome.effects.salvageDelta)} salvage`);
  }

  if (outcome.effects.hullPatchDelta !== 0) {
    effectParts.push(`${formatSigned(outcome.effects.hullPatchDelta)} hull`);
  }

  if (outcome.effects.curseDelta !== 0) {
    effectParts.push(`${formatSigned(outcome.effects.curseDelta)} curse`);
  }

  if (outcome.effects.relicDelta !== 0) {
    effectParts.push(`${formatSigned(outcome.effects.relicDelta)} relic`);
  }

  return effectParts.length > 0 ? effectParts.join(' | ') : 'route modifier active';
}

function createOutcome(
  options: {
    readonly run: RunSkeleton;
    readonly sector: SectorRoute;
    readonly route: RouteOption;
    readonly targetSectorIndex?: number | null;
  },
  outcome: Omit<
    AppliedRouteOutcome,
    'id' | 'sourceSectorIndex' | 'sectorIndex' | 'routeKind' | 'routeLabel'
  >
): AppliedRouteOutcome {
  const targetSectorIndex =
    options.targetSectorIndex === undefined
      ? options.sector.index
      : (options.targetSectorIndex ?? options.sector.index);
  return {
    id: `${options.run.seed}:s${options.sector.index}:to-${targetSectorIndex + 1}:${options.sector.sectorId}:${options.route.kind}`,
    sourceSectorIndex: options.sector.index - 1,
    sectorIndex: targetSectorIndex,
    routeKind: options.route.kind,
    routeLabel: options.route.label,
    ...outcome
  };
}

function createEmptyEffects(): RouteOutcomeEffects {
  return {
    creditsDelta: 0,
    salvageDelta: 0,
    hullPatchDelta: 0,
    curseDelta: 0,
    relicDelta: 0,
    reward: EMPTY_REWARD_MODIFIER,
    shop: null,
    combat: null
  };
}

function getFactionBiasTags(factionId: FactionId): readonly ItemTag[] {
  if (factionId === 'faction_corporate_ledger') {
    return ['credit', 'laser'];
  }

  if (factionId === 'faction_bloom_hive') {
    return ['phase', 'drone'];
  }

  if (factionId === 'faction_void_corsairs') {
    return ['phase', 'ricochet', 'curse'];
  }

  return ['missile', 'overkill'];
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
