import type { ActId } from './acts';
import type { ItemTag } from './items';

export const MISSION_OBJECTIVE_VERBS = [
  'assault',
  'pursuit',
  'escort',
  'salvage',
  'defense',
  'rescue',
  'scan',
  'sabotage',
  'escape',
  'bossApproach'
] as const;
export type MissionObjectiveVerb = (typeof MISSION_OBJECTIVE_VERBS)[number];

export const MISSION_OBJECTIVE_METRICS = [
  'enemyDefeatRatio',
  'enemyEscapes',
  'travelRatio',
  'looseCurrencyValue',
  'pickupsCollected',
  'damageTaken',
  'grazes',
  'projectilesCancelled',
  'environmentBreaks',
  'bossDefeats'
] as const;
export type MissionObjectiveMetric = (typeof MISSION_OBJECTIVE_METRICS)[number];

export const MISSION_OBJECTIVE_COMPARISONS = ['atLeast', 'atMost'] as const;
export type MissionObjectiveComparison = (typeof MISSION_OBJECTIVE_COMPARISONS)[number];

export const MISSION_CLEANUP_POLICIES = [
  'clearField',
  'allowEscape',
  'preserveWorld',
  'bossGate'
] as const;
export type MissionCleanupPolicy = (typeof MISSION_CLEANUP_POLICIES)[number];

export const MISSION_FAILURE_POLICIES = ['continueNoBonus', 'continueWithPenalty'] as const;
export type MissionFailurePolicy = (typeof MISSION_FAILURE_POLICIES)[number];

export const MISSION_BRANCH_POLICIES = ['afterPartial', 'afterSuccess'] as const;
export type MissionBranchPolicy = (typeof MISSION_BRANCH_POLICIES)[number];

export const MISSION_OUTCOME_EXITS = ['branch', 'relief', 'failure'] as const;
export type MissionOutcomeExit = (typeof MISSION_OUTCOME_EXITS)[number];

export const MISSION_FACTION_POLICIES = [
  'sectorOwner',
  'hostileInterdiction',
  'neutralRecovery'
] as const;
export type MissionFactionPolicy = (typeof MISSION_FACTION_POLICIES)[number];

export const MISSION_CREW_POLICIES = ['none', 'recordCandidate', 'protectSpecialist'] as const;
export type MissionCrewPolicy = (typeof MISSION_CREW_POLICIES)[number];

export interface MissionObjectiveClauseDefinition {
  readonly id: string;
  readonly metric: MissionObjectiveMetric;
  readonly comparison: MissionObjectiveComparison;
  readonly target: number;
  readonly label: string;
  readonly required: boolean;
}

export interface MissionObjectiveWorldDefinition {
  readonly scrollLengthScale: number;
  readonly waveCountScale: number;
  readonly environmentMode: 'mixed' | 'destructibles';
  readonly environmentTargetCount: number;
  readonly looseCurrencyBias: 'inherit' | 'salvage' | 'hazard';
}

export interface MissionObjectiveDefinition {
  readonly id: string;
  readonly verb: MissionObjectiveVerb;
  readonly label: string;
  readonly hudVerb: string;
  readonly summary: string;
  readonly clauses: readonly MissionObjectiveClauseDefinition[];
  readonly partialSuccessThreshold: number;
  readonly cleanupPolicy: MissionCleanupPolicy;
  readonly world: MissionObjectiveWorldDefinition;
  readonly successCopy: string;
  readonly partialSuccessCopy: string;
  readonly failureCopy: string;
}

export interface MissionRewardRule {
  readonly choiceBonus: number;
  readonly creditBonus: number;
  readonly salvageBonus: number;
  readonly biasTags: readonly ItemTag[];
}

export interface MissionRewardPolicy {
  readonly success: MissionRewardRule;
  readonly partialSuccess: MissionRewardRule;
  readonly failure: MissionRewardRule;
}

export interface MissionContractDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly eligibleActIds: readonly ActId[];
  readonly primaryObjectiveId: string;
  readonly optionalObjectiveId: string;
  readonly branchPolicy: MissionBranchPolicy;
  readonly outcomeExits: Readonly<
    Record<'success' | 'partialSuccess' | 'failure', MissionOutcomeExit>
  >;
  readonly failurePolicy: MissionFailurePolicy;
  readonly rewardPolicy: MissionRewardPolicy;
  readonly factionPolicy: MissionFactionPolicy;
  readonly crewPolicy: MissionCrewPolicy;
  readonly reliefCopy: string;
  readonly routePreview: string;
}

const SUCCESS_STANDARD: MissionRewardRule = {
  choiceBonus: 0,
  creditBonus: 2,
  salvageBonus: 1,
  biasTags: ['overkill']
};
const PARTIAL_STANDARD: MissionRewardRule = {
  choiceBonus: 0,
  creditBonus: 1,
  salvageBonus: 0,
  biasTags: []
};
const FAILURE_STANDARD: MissionRewardRule = {
  choiceBonus: 0,
  creditBonus: 0,
  salvageBonus: 0,
  biasTags: []
};

export const MISSION_OBJECTIVES: readonly MissionObjectiveDefinition[] = [
  objective({
    id: 'objective_breach_assault',
    verb: 'assault',
    label: 'Breach Assault',
    hudVerb: 'ASSAULT',
    summary: 'Break the hostile screen and tear open one fortified object.',
    clauses: [
      ratioClause('hostiles', 'enemyDefeatRatio', 0.85, 'hostiles defeated'),
      countClause('breach', 'environmentBreaks', 1, 'fortification broken')
    ],
    cleanupPolicy: 'clearField',
    world: world(0.95, 1, 'destructibles', 3, 'inherit'),
    successCopy: 'Assault line broken; breach telemetry verified.',
    partialSuccessCopy: 'Assault line displaced, but the breach remains contested.',
    failureCopy: 'Assault screen held its position.'
  }),
  objective({
    id: 'objective_running_pursuit',
    verb: 'pursuit',
    label: 'Running Pursuit',
    hudVerb: 'PURSUE',
    summary: 'Catch the fleeing screen before too many signatures escape.',
    clauses: [
      ratioClause('intercepts', 'enemyDefeatRatio', 0.75, 'targets intercepted'),
      limitClause('escapes', 'enemyEscapes', 1, 'escape allowance'),
      ratioClause('distance', 'travelRatio', 1, 'pursuit distance')
    ],
    cleanupPolicy: 'allowEscape',
    world: world(0.78, 0.85, 'mixed', 3, 'hazard'),
    successCopy: 'Pursuit ledger closed before the target screen scattered.',
    partialSuccessCopy: 'The formation scattered, but useful pursuit telemetry survived.',
    failureCopy: 'The target screen escaped the lane.'
  }),
  objective({
    id: 'objective_convoy_escort',
    verb: 'escort',
    label: 'Convoy Escort',
    hudVerb: 'ESCORT',
    summary: 'Hold the convoy lane while preserving enough hull to screen the exit.',
    clauses: [
      ratioClause('distance', 'travelRatio', 1, 'escort distance'),
      ratioClause('screen', 'enemyDefeatRatio', 0.55, 'attackers screened'),
      limitClause('damage', 'damageTaken', 1, 'hull damage allowance')
    ],
    cleanupPolicy: 'preserveWorld',
    world: world(0.92, 0.75, 'mixed', 4, 'inherit'),
    successCopy: 'Convoy cleared the lane under an intact screen.',
    partialSuccessCopy: 'Convoy crossed under fire with recoverable losses.',
    failureCopy: 'Convoy screen collapsed before extraction.'
  }),
  objective({
    id: 'objective_field_salvage',
    verb: 'salvage',
    label: 'Field Salvage',
    hudVerb: 'SALVAGE',
    summary: 'Fly the debris pockets and recover live currency before it burns out.',
    clauses: [
      countClause('value', 'looseCurrencyValue', 3, 'loose value recovered'),
      countClause('pickups', 'pickupsCollected', 2, 'caches recovered'),
      ratioClause('distance', 'travelRatio', 0.9, 'salvage lane surveyed')
    ],
    cleanupPolicy: 'preserveWorld',
    world: world(0.88, 0.6, 'mixed', 5, 'salvage'),
    successCopy: 'Salvage manifest balanced with live-field recovery.',
    partialSuccessCopy: 'A partial manifest survived the debris burn.',
    failureCopy: 'The salvage field expired before recovery.'
  }),
  objective({
    id: 'objective_perimeter_defense',
    verb: 'defense',
    label: 'Perimeter Defense',
    hudVerb: 'DEFEND',
    summary: 'Break the attack screen while cancelling fire around the perimeter.',
    clauses: [
      ratioClause('screen', 'enemyDefeatRatio', 0.75, 'attackers defeated'),
      countClause('cancels', 'projectilesCancelled', 3, 'hostile shots cancelled'),
      limitClause('damage', 'damageTaken', 2, 'damage allowance')
    ],
    cleanupPolicy: 'clearField',
    world: world(0.76, 1, 'mixed', 3, 'hazard'),
    successCopy: 'Perimeter held and the attack pattern collapsed.',
    partialSuccessCopy: 'Perimeter bent without fully breaking.',
    failureCopy: 'The attack pattern crossed the perimeter.'
  }),
  objective({
    id: 'objective_lifeboat_rescue',
    verb: 'rescue',
    label: 'Lifeboat Rescue',
    hudVerb: 'RESCUE',
    summary: 'Collect marked survival caches while clearing a path to extraction.',
    clauses: [
      countClause('pods', 'pickupsCollected', 2, 'survival caches recovered'),
      countClause('supplies', 'looseCurrencyValue', 2, 'rescue supplies recovered'),
      ratioClause('distance', 'travelRatio', 0.9, 'rescue corridor crossed')
    ],
    cleanupPolicy: 'preserveWorld',
    world: world(0.86, 0.65, 'mixed', 4, 'salvage'),
    successCopy: 'Survival caches and transponders reached extraction.',
    partialSuccessCopy: 'A partial rescue manifest reached the relief window.',
    failureCopy: 'No recoverable rescue manifest reached extraction.'
  }),
  objective({
    id: 'objective_threat_scan',
    verb: 'scan',
    label: 'Threat Scan',
    hudVerb: 'SCAN',
    summary: 'Skim hostile fire for telemetry while limiting return-fire noise.',
    clauses: [
      countClause('samples', 'grazes', 1, 'threat samples captured'),
      limitClause('noise', 'damageTaken', 1, 'scan damage allowance'),
      ratioClause('distance', 'travelRatio', 1, 'scan corridor mapped')
    ],
    cleanupPolicy: 'allowEscape',
    world: world(0.82, 0.7, 'mixed', 3, 'hazard'),
    successCopy: 'Threat spectrum mapped from live hostile fire.',
    partialSuccessCopy: 'Scan returned a noisy but usable threat spectrum.',
    failureCopy: 'Scan corridor produced no stable telemetry.'
  }),
  objective({
    id: 'objective_relay_sabotage',
    verb: 'sabotage',
    label: 'Relay Sabotage',
    hudVerb: 'SABOTAGE',
    summary: 'Destroy marked infrastructure and cut through its defense screen.',
    clauses: [
      countClause('targets', 'environmentBreaks', 2, 'relay targets destroyed'),
      ratioClause('screen', 'enemyDefeatRatio', 0.5, 'defenders removed')
    ],
    cleanupPolicy: 'clearField',
    world: world(0.9, 0.7, 'destructibles', 5, 'inherit'),
    successCopy: 'Relay chain severed and defense accounting erased.',
    partialSuccessCopy: 'Relay chain damaged; fragments remain active.',
    failureCopy: 'Relay chain survived the sabotage pass.'
  }),
  objective({
    id: 'objective_system_sabotage',
    verb: 'sabotage',
    label: 'System Sabotage',
    hudVerb: 'SABOTAGE',
    summary: 'Disable interior subsystems and carry the sabotage route through extraction.',
    clauses: [
      countClause('systems', 'environmentBreaks', 2, 'subsystems disabled'),
      ratioClause('security', 'enemyDefeatRatio', 0.5, 'security screen removed'),
      ratioClause('extraction', 'travelRatio', 0.9, 'extraction route crossed')
    ],
    cleanupPolicy: 'clearField',
    world: world(0.82, 0.75, 'destructibles', 5, 'salvage'),
    successCopy: 'Interior systems disabled and sabotage telemetry reached extraction.',
    partialSuccessCopy: 'The target systems are damaged, but the sabotage route remains contested.',
    failureCopy: 'Interior security isolated the sabotage before extraction.'
  }),
  objective({
    id: 'objective_pressure_escape',
    verb: 'escape',
    label: 'Pressure Escape',
    hudVerb: 'ESCAPE',
    summary: 'Cross the collapsing lane; survival matters more than the kill ledger.',
    partialSuccessThreshold: 0.75,
    clauses: [
      ratioClause('distance', 'travelRatio', 1, 'escape distance'),
      limitClause('damage', 'damageTaken', 2, 'escape damage allowance')
    ],
    cleanupPolicy: 'allowEscape',
    world: world(0.7, 0.75, 'mixed', 3, 'hazard'),
    successCopy: 'Ship and contract cleared the collapse front.',
    partialSuccessCopy: 'The ship escaped with costly structural damage.',
    failureCopy: 'The collapse front consumed the contract lane.'
  }),
  objective({
    id: 'objective_boss_approach',
    verb: 'bossApproach',
    label: 'Boss Approach',
    hudVerb: 'BREACH GATE',
    summary: 'Clear the support screen, cross the lock line, and salvage the command hull.',
    clauses: [
      ratioClause('screen', 'enemyDefeatRatio', 0.8, 'support screen defeated'),
      ratioClause('distance', 'travelRatio', 1, 'approach crossed'),
      countClause('boss', 'bossDefeats', 1, 'command hull defeated')
    ],
    cleanupPolicy: 'bossGate',
    world: world(1, 1, 'mixed', 4, 'inherit'),
    successCopy: 'Command hull salvaged beyond the lock line.',
    partialSuccessCopy: 'Command structure broken, but approach losses remain unresolved.',
    failureCopy: 'Command hull retained the gate.'
  })
];

export const MISSION_CONTRACTS: readonly MissionContractDefinition[] = [
  contract(
    'contract_breach_levy',
    'Breach Levy',
    'Open the debris customs line by force.',
    'act_outer_rim',
    'objective_breach_assault',
    'objective_field_salvage',
    'afterPartial',
    'sectorOwner',
    'none',
    'The breach cools long enough to count intact systems.',
    'A hard assault opens the expedition.'
  ),
  contract(
    'contract_running_audit',
    'Running Audit',
    'Intercept a fleeing account screen before it scatters.',
    'act_outer_rim',
    'objective_running_pursuit',
    'objective_threat_scan',
    'afterPartial',
    'hostileInterdiction',
    'none',
    'Pursuit pressure drops while the recorder resolves signatures.',
    'Expect a short, escape-sensitive pursuit.'
  ),
  contract(
    'contract_cold_claim',
    'Cold Claim',
    'Recover live claims from a weaponized debris field.',
    'act_outer_rim',
    'objective_field_salvage',
    'objective_relay_sabotage',
    'afterPartial',
    'neutralRecovery',
    'none',
    'Recovery drones inventory the manifest in a quiet pocket.',
    'Pickup recovery drives the next claim.'
  ),
  contract(
    'contract_lifeboat_ledger',
    'Lifeboat Ledger',
    'Recover survival caches from a broken convoy.',
    'act_outer_rim',
    'objective_lifeboat_rescue',
    'objective_running_pursuit',
    'afterSuccess',
    'neutralRecovery',
    'recordCandidate',
    'Rescue transponders stabilize inside the relief envelope.',
    'Recovery success can reveal a high-risk pursuit.'
  ),
  contract(
    'contract_last_perimeter',
    'Last Perimeter',
    'Hold the act gate against a concentrated attack.',
    'act_outer_rim',
    'objective_perimeter_defense',
    'objective_convoy_escort',
    'afterPartial',
    'sectorOwner',
    'protectSpecialist',
    'The perimeter crew restores a narrow transfer window.',
    'Defensive fire and cancellation matter at the act gate.'
  ),
  contract(
    'contract_ghost_spectrum',
    'Ghost Spectrum',
    'Map the deep-sector threat spectrum under live fire.',
    'act_core_descent',
    'objective_threat_scan',
    'objective_field_salvage',
    'afterPartial',
    'hostileInterdiction',
    'none',
    'Sensor noise falls away in the lee of the descent.',
    'Close fire sampling replaces a pure kill quota.'
  ),
  contract(
    'contract_relay_severance',
    'Relay Severance',
    'Cut the command relays feeding the descent.',
    'act_core_descent',
    'objective_relay_sabotage',
    'objective_perimeter_defense',
    'afterSuccess',
    'sectorOwner',
    'none',
    'The dead relay leaves a brief silent corridor.',
    'Destructible infrastructure is the primary target.'
  ),
  contract(
    'contract_furnace_exit',
    'Furnace Exit',
    'Outfly a collapsing pressure lane.',
    'act_core_descent',
    'objective_pressure_escape',
    'objective_threat_scan',
    'afterPartial',
    'hostileInterdiction',
    'none',
    'The collapse front loses the ship for one quiet interval.',
    'Travel and damage control outrank target count.'
  ),
  contract(
    'contract_pilgrim_screen',
    'Pilgrim Screen',
    'Escort a salvage convoy toward the core gate.',
    'act_core_descent',
    'objective_convoy_escort',
    'objective_lifeboat_rescue',
    'afterPartial',
    'neutralRecovery',
    'protectSpecialist',
    'The convoy folds into a protected recovery orbit.',
    'Hull preservation and screening define the approach.'
  ),
  contract(
    'contract_dead_center_writ',
    'Dead-Center Writ',
    'Cross the final lock and dismantle its command hull.',
    'act_core_descent',
    'objective_boss_approach',
    'objective_breach_assault',
    'afterSuccess',
    'sectorOwner',
    'none',
    'The command wake collapses into an extraction corridor.',
    'The final contract combines support clearance and boss salvage.'
  ),
  contract(
    'contract_shard_echo_survey', 'Shard Echo Survey', 'Map repeated threat lanes without losing the original signal.',
    'act_null_frontier', 'objective_threat_scan', 'objective_field_salvage', 'afterPartial', 'hostileInterdiction', 'recordCandidate',
    'A lawwright isolates the true signal inside the echo.', 'Scanning and close recovery expose the frontier law.'
  ),
  contract(
    'contract_vector_debt', 'Vector Debt', 'Break a gravity choir before its compression reaches the gate.',
    'act_null_frontier', 'objective_pressure_escape', 'objective_perimeter_defense', 'afterPartial', 'sectorOwner', 'protectSpecialist',
    'The crew settles vector debt inside a brief neutral orbit.', 'Travel, defense, and hull preservation matter more than repetition.'
  ),
  contract(
    'contract_dead_reef_claim', 'Dead Reef Claim', 'Relight a silent claim while rival salvage crews close in.',
    'act_null_frontier', 'objective_relay_sabotage', 'objective_lifeboat_rescue', 'afterSuccess', 'neutralRecovery', 'recordCandidate',
    'Recovered transponders establish a frontier claim.', 'Relay targets lead into a choice of rescue or direct advance.'
  ),
  contract(
    'contract_foundry_inversion', 'Foundry Inversion', 'Board the moving production wake and recover law-proof components.',
    'act_null_frontier', 'objective_field_salvage', 'objective_convoy_escort', 'afterPartial', 'sectorOwner', 'protectSpecialist',
    'The foundry opens a mobile engineering envelope.', 'Component recovery creates a meaningful foundry opportunity.'
  ),
  contract(
    'contract_last_light_anchor', 'Last Light Anchor', 'Hold the horizon long enough to destroy its frontier anchor.',
    'act_null_frontier', 'objective_boss_approach', 'objective_breach_assault', 'afterSuccess', 'hostileInterdiction', 'none',
    'The secured anchor turns the scar into a stable extraction line.', 'Support clearance and the Horizon Leviathan form the final gate.'
  )
];

export function getMissionObjective(id: string): MissionObjectiveDefinition {
  const objective = MISSION_OBJECTIVES.find((candidate) => candidate.id === id);
  if (!objective) {
    throw new Error(`Unknown mission objective: ${id}.`);
  }
  return objective;
}

export function getMissionContract(id: string): MissionContractDefinition {
  const contractDefinition = MISSION_CONTRACTS.find((candidate) => candidate.id === id);
  if (!contractDefinition) {
    throw new Error(`Unknown mission contract: ${id}.`);
  }
  return contractDefinition;
}

function objective(
  definition: Omit<MissionObjectiveDefinition, 'partialSuccessThreshold'> & {
    readonly partialSuccessThreshold?: number;
  }
): MissionObjectiveDefinition {
  return { ...definition, partialSuccessThreshold: definition.partialSuccessThreshold ?? 0.5 };
}

function contract(
  id: string,
  title: string,
  summary: string,
  actId: ActId,
  primaryObjectiveId: string,
  optionalObjectiveId: string,
  branchPolicy: MissionBranchPolicy,
  factionPolicy: MissionFactionPolicy,
  crewPolicy: MissionCrewPolicy,
  reliefCopy: string,
  routePreview: string
): MissionContractDefinition {
  return {
    id,
    title,
    summary,
    eligibleActIds: [actId],
    primaryObjectiveId,
    optionalObjectiveId,
    branchPolicy,
    outcomeExits: {
      success: 'branch',
      partialSuccess: branchPolicy === 'afterPartial' ? 'branch' : 'relief',
      failure: 'relief'
    },
    failurePolicy:
      primaryObjectiveId.includes('defense') ||
      primaryObjectiveId.includes('escape') ||
      primaryObjectiveId.includes('escort')
        ? 'continueWithPenalty'
        : 'continueNoBonus',
    rewardPolicy: {
      success: { ...SUCCESS_STANDARD, biasTags: getVerbBias(primaryObjectiveId) },
      partialSuccess: PARTIAL_STANDARD,
      failure: FAILURE_STANDARD
    },
    factionPolicy,
    crewPolicy,
    reliefCopy,
    routePreview
  };
}

function getVerbBias(objectiveId: string): readonly ItemTag[] {
  if (objectiveId.includes('salvage') || objectiveId.includes('rescue'))
    return ['credit', 'magnet'];
  if (objectiveId.includes('escort') || objectiveId.includes('defense')) return ['shield', 'armor'];
  if (objectiveId.includes('scan') || objectiveId.includes('escape')) return ['phase', 'heat'];
  if (objectiveId.includes('sabotage')) return ['bomb', 'scrap'];
  return ['overkill'];
}

function ratioClause(
  id: string,
  metric: Extract<MissionObjectiveMetric, 'enemyDefeatRatio' | 'travelRatio'>,
  target: number,
  label: string
): MissionObjectiveClauseDefinition {
  return { id, metric, comparison: 'atLeast', target, label, required: true };
}

function countClause(
  id: string,
  metric: Exclude<
    MissionObjectiveMetric,
    'enemyDefeatRatio' | 'travelRatio' | 'enemyEscapes' | 'damageTaken'
  >,
  target: number,
  label: string
): MissionObjectiveClauseDefinition {
  return { id, metric, comparison: 'atLeast', target, label, required: true };
}

function limitClause(
  id: string,
  metric: Extract<MissionObjectiveMetric, 'enemyEscapes' | 'damageTaken'>,
  target: number,
  label: string
): MissionObjectiveClauseDefinition {
  return { id, metric, comparison: 'atMost', target, label, required: true };
}

function world(
  scrollLengthScale: number,
  waveCountScale: number,
  environmentMode: MissionObjectiveWorldDefinition['environmentMode'],
  environmentTargetCount: number,
  looseCurrencyBias: MissionObjectiveWorldDefinition['looseCurrencyBias']
): MissionObjectiveWorldDefinition {
  return {
    scrollLengthScale,
    waveCountScale,
    environmentMode,
    environmentTargetCount,
    looseCurrencyBias
  };
}
