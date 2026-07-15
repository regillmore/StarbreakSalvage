import type { SectorId } from './sectors';

export type ActId = 'act_outer_rim' | 'act_core_descent' | 'act_null_frontier';

export type ActRouteKind = 'shop' | 'elite' | 'vault' | 'repair' | 'glitch' | 'factionAmbush';

export type ActRewardTier = 'standard' | 'escalated';

export type ActPressureTier = 'baseline' | 'elevated';

export type ActBossGateKind = 'checkpoint' | 'finale';

export type ActTransitionKind = 'interActJunction' | 'frontierChoice' | 'victory';

export interface ActSectorBudget {
  readonly plannedSectors: number;
  readonly minSectors: number;
  readonly maxSectors: number;
}

export interface ActRouteGrammar {
  readonly allowedKinds: readonly ActRouteKind[];
  readonly guaranteedKinds: readonly ActRouteKind[];
  readonly summary: string;
}

export interface ActBossGate {
  readonly kind: ActBossGateKind;
  readonly label: string;
  readonly required: boolean;
}

export interface ActTransition {
  readonly kind: ActTransitionKind;
  readonly label: string;
  readonly nextActId?: ActId;
}

export interface ActDefinition {
  readonly id: ActId;
  readonly order: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly sectorBudget: ActSectorBudget;
  readonly preferredSectorIds: readonly SectorId[];
  readonly routeGrammar: ActRouteGrammar;
  readonly rewardTier: ActRewardTier;
  readonly pressureTier: ActPressureTier;
  readonly bossGate: ActBossGate;
  readonly transition: ActTransition;
}

export const ACT_ROUTE_KINDS: readonly ActRouteKind[] = [
  'shop',
  'elite',
  'vault',
  'repair',
  'glitch',
  'factionAmbush'
];

export const ACT_REWARD_TIERS: readonly ActRewardTier[] = ['standard', 'escalated'];

export const ACT_PRESSURE_TIERS: readonly ActPressureTier[] = ['baseline', 'elevated'];

export const ACT_BOSS_GATE_KINDS: readonly ActBossGateKind[] = ['checkpoint', 'finale'];

export const ACT_TRANSITION_KINDS: readonly ActTransitionKind[] = [
  'interActJunction',
  'frontierChoice',
  'victory'
];

export const ACT_DEFINITIONS: readonly ActDefinition[] = [
  {
    id: 'act_outer_rim',
    order: 1,
    label: 'Outer Rim Contract',
    shortLabel: 'Act I',
    summary: 'Opening salvage lanes where a build takes shape before the deeper descent.',
    sectorBudget: {
      plannedSectors: 9,
      minSectors: 9,
      maxSectors: 9
    },
    preferredSectorIds: [
      'sector_outer_debris_field',
      'sector_trade_war_corridor',
      'sector_bio_machine_bloom',
      'sector_lunar_surface'
    ],
    routeGrammar: {
      allowedKinds: ACT_ROUTE_KINDS,
      guaranteedKinds: ['shop'],
      summary: 'Readable economy and build-shaping routes with one safe market anchor.'
    },
    rewardTier: 'standard',
    pressureTier: 'baseline',
    bossGate: {
      kind: 'checkpoint',
      label: 'midpoint clearance',
      required: false
    },
    transition: {
      kind: 'interActJunction',
      label: 'midpoint refit',
      nextActId: 'act_core_descent'
    }
  },
  {
    id: 'act_core_descent',
    order: 2,
    label: 'Core Descent',
    shortLabel: 'Act II',
    summary: 'Deeper-sector pressure where routes, rewards, hazards, and bosses tighten.',
    sectorBudget: {
      plannedSectors: 9,
      minSectors: 9,
      maxSectors: 9
    },
    preferredSectorIds: ['sector_corporate_kill_grid', 'sector_core_wreck'],
    routeGrammar: {
      allowedKinds: ACT_ROUTE_KINDS,
      guaranteedKinds: [],
      summary: 'Sharper pressure and reward routes without a guaranteed safe stop.'
    },
    rewardTier: 'escalated',
    pressureTier: 'elevated',
    bossGate: {
      kind: 'finale',
      label: 'core finale',
      required: true
    },
    transition: {
      kind: 'frontierChoice',
      label: 'extract or breach',
      nextActId: 'act_null_frontier'
    }
  },
  {
    id: 'act_null_frontier',
    order: 3,
    label: 'Null Frontier',
    shortLabel: 'Act III',
    summary: 'A generated frontier campaign where physical laws become route commitments.',
    sectorBudget: {
      plannedSectors: 9,
      minSectors: 9,
      maxSectors: 9
    },
    preferredSectorIds: [
      'sector_nullglass_expanse',
      'sector_gravity_choir',
      'sector_dead_signal_reef',
      'sector_parallax_foundry',
      'sector_horizon_scar'
    ],
    routeGrammar: {
      allowedKinds: ACT_ROUTE_KINDS,
      guaranteedKinds: [],
      summary: 'Frontier laws, engineering gambits, and faction claims reshape every route.'
    },
    rewardTier: 'escalated',
    pressureTier: 'elevated',
    bossGate: {
      kind: 'finale',
      label: 'frontier anchor',
      required: true
    },
    transition: {
      kind: 'victory',
      label: 'null horizon secured'
    }
  }
];
