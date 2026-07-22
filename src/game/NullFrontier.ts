import type { BossId } from '../content/bosses';
import type { FactionId } from '../content/factions';
import type { SectorId } from '../content/sectors';
import type { Rng } from '../core/rng';

export type NullFrontierVariantId = 'glassMeridian' | 'blackCurrent' | 'silentCrown';
export type FrontierDecision = 'unresolved' | 'extract' | 'breach';

export interface FrontierLaw {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly scrollSpeedMultiplier: number;
  readonly lengthMultiplier: number;
  readonly hazardDensityDelta: number;
  readonly bossApproachMultiplier: number;
}

export interface NullFrontierSectorPlan {
  readonly sectorId: SectorId;
  readonly law: FrontierLaw;
  readonly factionHook: FactionId;
  readonly opportunity: string;
}

export interface NullFrontierCampaignPlan {
  readonly id: string;
  readonly variantId: NullFrontierVariantId;
  readonly name: string;
  readonly summary: string;
  readonly sectors: readonly NullFrontierSectorPlan[];
  readonly finaleBossId: BossId;
  readonly finaleGate: string;
  readonly standardTargetSeconds: number;
}

export interface FrontierDecisionState {
  readonly decision: FrontierDecision;
  readonly actTwoSectorIndex: number;
  readonly creditsAwarded: number;
  readonly salvageAwarded: number;
}

interface VariantDefinition {
  readonly id: NullFrontierVariantId;
  readonly name: string;
  readonly summary: string;
  readonly sectorIds: readonly SectorId[];
  readonly factionHooks: readonly FactionId[];
  readonly finaleGate: string;
}

export const FRONTIER_LAWS: Readonly<Record<SectorId, FrontierLaw | undefined>> = {
  sector_outer_debris_field: undefined,
  sector_trade_war_corridor: undefined,
  sector_bio_machine_bloom: undefined,
  sector_corporate_kill_grid: undefined,
  sector_lunar_surface: undefined,
  sector_core_wreck: undefined,
  sector_nullglass_expanse: {
    id: 'law_shard_echo',
    label: 'Shard Echo',
    summary: 'Nullglass repeats threat lanes; the route runs fast but leaves an extra hazard wake.',
    scrollSpeedMultiplier: 1.06,
    lengthMultiplier: 0.96,
    hazardDensityDelta: 1,
    bossApproachMultiplier: 0.96
  },
  sector_gravity_choir: {
    id: 'law_vector_debt',
    label: 'Vector Debt',
    summary: 'Every correction is repaid as compression near the gate.',
    scrollSpeedMultiplier: 0.96,
    lengthMultiplier: 1.02,
    hazardDensityDelta: 1,
    bossApproachMultiplier: 1.08
  },
  sector_dead_signal_reef: {
    id: 'law_signal_hunger',
    label: 'Signal Hunger',
    summary: 'The reef consumes guidance signals, trading quieter lanes for a longer blind crossing.',
    scrollSpeedMultiplier: 0.94,
    lengthMultiplier: 1.04,
    hazardDensityDelta: 0,
    bossApproachMultiplier: 1.02
  },
  sector_parallax_foundry: {
    id: 'law_thermal_inversion',
    label: 'Thermal Inversion',
    summary: 'Heat becomes thrust and cold machinery becomes cover around engineering windows.',
    scrollSpeedMultiplier: 1.04,
    lengthMultiplier: 0.98,
    hazardDensityDelta: 0,
    bossApproachMultiplier: 0.94
  },
  sector_horizon_scar: {
    id: 'law_last_light',
    label: 'Last Light',
    summary: 'The horizon collapses behind the ship; retreat lanes close as the anchor approaches.',
    scrollSpeedMultiplier: 1.08,
    lengthMultiplier: 0.96,
    hazardDensityDelta: 1,
    bossApproachMultiplier: 0.9
  }
};

const VARIANTS: readonly VariantDefinition[] = [
  {
    id: 'glassMeridian',
    name: 'Glass Meridian',
    summary: 'Follow a refracted survey line from nullglass into a manufactured horizon.',
    sectorIds: ['sector_nullglass_expanse', 'sector_dead_signal_reef', 'sector_parallax_foundry', 'sector_gravity_choir', 'sector_horizon_scar'],
    factionHooks: ['faction_void_corsairs', 'faction_scrap_court', 'faction_corporate_ledger', 'faction_bloom_hive', 'faction_scrap_court'],
    finaleGate: 'Meridian Anchor'
  },
  {
    id: 'blackCurrent',
    name: 'Black Current',
    summary: 'Ride a gravity current through hostile industry before it vanishes into the scar.',
    sectorIds: ['sector_gravity_choir', 'sector_parallax_foundry', 'sector_nullglass_expanse', 'sector_dead_signal_reef', 'sector_horizon_scar'],
    factionHooks: ['faction_corporate_ledger', 'faction_scrap_court', 'faction_void_corsairs', 'faction_bloom_hive', 'faction_scrap_court'],
    finaleGate: 'Current Breaker'
  },
  {
    id: 'silentCrown',
    name: 'Silent Crown',
    summary: 'Rebuild a dead navigation crown one dangerous law at a time.',
    sectorIds: ['sector_dead_signal_reef', 'sector_gravity_choir', 'sector_nullglass_expanse', 'sector_parallax_foundry', 'sector_horizon_scar'],
    factionHooks: ['faction_bloom_hive', 'faction_corporate_ledger', 'faction_void_corsairs', 'faction_scrap_court', 'faction_scrap_court'],
    finaleGate: 'Crown of Last Light'
  }
];

const OPPORTUNITIES = [
  'stabilize a frontier law for a focused engineering component',
  'sell a faction claim or carry it into the next operation',
  'splice an impossible route into the reward lattice',
  'recover a law-proof hull brace before the next gate',
  'convert horizon telemetry into a focused reward signal'
] as const;

export function createNullFrontierCampaignPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly rng: Rng;
}): NullFrontierCampaignPlan {
  const variant = options.rng.fork(`variant:${options.saveFingerprint}`).choice(VARIANTS);
  const sectors = variant.sectorIds.map((sectorId, index) => {
    const law = FRONTIER_LAWS[sectorId];
    if (!law) throw new Error(`Null Frontier sector ${sectorId} has no environmental law.`);
    return {
      sectorId,
      law,
      factionHook: variant.factionHooks[index]!,
      opportunity: OPPORTUNITIES[index]!
    };
  });

  return {
    id: `frontier_${options.seed.toLowerCase()}_${variant.id}`,
    variantId: variant.id,
    name: variant.name,
    summary: variant.summary,
    sectors,
    finaleBossId: 'boss_horizon_leviathan',
    finaleGate: variant.finaleGate,
    standardTargetSeconds: 1_620
  };
}

export function createFrontierDecisionState(actTwoSectorIndex: number): FrontierDecisionState {
  return { decision: 'unresolved', actTwoSectorIndex, creditsAwarded: 0, salvageAwarded: 0 };
}

export function resolveFrontierDecision(
  state: FrontierDecisionState,
  decision: Exclude<FrontierDecision, 'unresolved'>
): FrontierDecisionState {
  if (state.decision !== 'unresolved') return state;
  return decision === 'extract'
    ? { ...state, decision, creditsAwarded: 180, salvageAwarded: 45 }
    : { ...state, decision, creditsAwarded: 40, salvageAwarded: 12 };
}

export function formatFrontierCampaign(plan: NullFrontierCampaignPlan): string {
  return `${plan.name}: ${plan.sectors.map((sector) => sector.law.label).join(' > ')} | finale ${plan.finaleGate}`;
}

export function formatFrontierOutcome(
  plan: NullFrontierCampaignPlan,
  decision: FrontierDecisionState,
  reason: string | null | undefined
): string {
  if (decision.decision === 'extract') {
    return `Core Extraction: complete victory, +${decision.creditsAwarded} credits and +${decision.salvageAwarded} kg banked before ${plan.name}.`;
  }
  if (decision.decision === 'unresolved') return `${plan.name}: breach decision not reached.`;
  if (reason === 'victory') return `Frontier Victory: ${plan.finaleGate} secured after the ${plan.name} campaign.`;
  if (reason === 'destroyed') return `Frontier Defeat: ${plan.name} ended before ${plan.finaleGate}.`;
  if (reason === 'abandoned') return `Frontier Abandoned: the breach into ${plan.name} remains unresolved.`;
  return `${plan.name}: breach active.`;
}
