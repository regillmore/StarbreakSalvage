import type { ActBossGateKind, ActId, ActPressureTier, ActTransitionKind } from '../content/acts';
import type { BossId } from '../content/bosses';
import type {
  ExpeditionCompletionRule,
  ExpeditionDurationBand,
  ExpeditionEntryRule,
  ExpeditionLegKind,
  ExpeditionNodeKind,
  ExpeditionOperationalIntel,
  ExpeditionOperationalRole,
  ExpeditionPressureBand,
  ExpeditionRewardHook,
  ExpeditionTransitionPolicy
} from '../content/expeditions';
import type { SectorId, SectorObjectiveKind } from '../content/sectors';

export type {
  ExpeditionOperationalIntel,
  ExpeditionOperationalRole,
  ExpeditionRiskBand
} from '../content/expeditions';

export interface ExpeditionGraphSourceSector {
  readonly index: number;
  readonly sectorId: SectorId;
  readonly sectorName: string;
  readonly act: {
    readonly actId: ActId;
    readonly actIndex: number;
    readonly actName: string;
    readonly actShortLabel: string;
    readonly actSectorIndex: number;
    readonly pressureTier: ActPressureTier;
    readonly bossGate: { readonly kind: ActBossGateKind; readonly required: boolean };
    readonly transition: { readonly kind: ActTransitionKind };
  };
  readonly bossId: BossId;
  readonly majorWaves: readonly string[];
  readonly objective: {
    readonly kind: SectorObjectiveKind;
    readonly bossRequired: boolean;
  };
  readonly routeOptions: readonly { readonly kind: string; readonly label: string }[];
  readonly rewardPoolSeed: string;
  readonly shopSeed: string;
  readonly finale: { readonly variantId: string } | null;
}

export interface ExpeditionNodeContentReferences {
  readonly sectorId: SectorId;
  readonly objectiveKind: SectorObjectiveKind;
  readonly majorWaveIds: readonly string[];
  readonly bossId: BossId | null;
  readonly routeKinds: readonly string[];
  readonly rewardPoolSeed: string;
  readonly shopSeed: string;
  readonly opportunityId: string | null;
  readonly boardingOperationId: string | null;
  readonly finaleVariantId: string | null;
}

export interface ExpeditionEncounterNode {
  readonly id: string;
  readonly profileId: string;
  readonly label: string;
  readonly sectorPlanId: string;
  readonly sectorIndex: number;
  readonly actId: ActId;
  readonly kind: ExpeditionNodeKind;
  readonly pressureBand: ExpeditionPressureBand;
  readonly duration: ExpeditionDurationBand;
  readonly entryRule: ExpeditionEntryRule;
  readonly completionRule: ExpeditionCompletionRule;
  readonly transitionPolicy: ExpeditionTransitionPolicy;
  readonly optional: boolean;
  readonly nextNodeIds: readonly string[];
  readonly rewardHooks: readonly ExpeditionRewardHook[];
  readonly operationalRole: ExpeditionOperationalRole;
  readonly intel: ExpeditionOperationalIntel;
  readonly content: ExpeditionNodeContentReferences;
}

export interface ExpeditionMissionLeg {
  readonly id: string;
  readonly sectorPlanId: string;
  readonly kind: ExpeditionLegKind;
  readonly label: string;
  readonly optional: boolean;
  readonly entryNodeId: string;
  readonly exitNodeIds: readonly string[];
  readonly nodeIds: readonly string[];
}

export interface ExpeditionBranchOption {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly targetNodeId: string;
  readonly outcomeId: string;
  readonly default: boolean;
}

export interface ExpeditionBranch {
  readonly id: string;
  readonly sectorPlanId: string;
  readonly sourceNodeId: string;
  readonly label: string;
  readonly options: readonly ExpeditionBranchOption[];
}

export interface ExpeditionSectorPlan {
  readonly id: string;
  readonly sectorIndex: number;
  readonly sectorId: SectorId;
  readonly sectorName: string;
  readonly actId: ActId;
  readonly actSectorIndex: number;
  readonly entryNodeId: string;
  readonly exitNodeIds: readonly string[];
  readonly missionLegIds: readonly string[];
  readonly nodeIds: readonly string[];
  readonly requiredNodeIds: readonly string[];
  readonly optionalNodeIds: readonly string[];
  readonly branchIds: readonly string[];
}

export interface ExpeditionActPlan {
  readonly actId: ActId;
  readonly actIndex: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly sectorPlanIds: readonly string[];
  readonly entryNodeId: string;
  readonly exitNodeIds: readonly string[];
}

export interface ExpeditionGate {
  readonly id: string;
  readonly actId: ActId;
  readonly sectorPlanId: string;
  readonly nodeId: string;
  readonly kind: ActBossGateKind;
  readonly required: boolean;
  readonly transitionKind: ActTransitionKind;
}

export interface ExpeditionCapacity {
  readonly requiredNodeCount: number;
  readonly optionalNodeCount: number;
  readonly baselineMinSeconds: number;
  readonly baselineTargetSeconds: number;
  readonly baselineMaxSeconds: number;
  readonly expandedTargetSeconds: number;
}

export interface ExpeditionGraph {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly acts: readonly ExpeditionActPlan[];
  readonly sectors: readonly ExpeditionSectorPlan[];
  readonly missionLegs: readonly ExpeditionMissionLeg[];
  readonly nodes: readonly ExpeditionEncounterNode[];
  readonly branches: readonly ExpeditionBranch[];
  readonly gates: readonly ExpeditionGate[];
  readonly startNodeId: string;
  readonly terminalNodeIds: readonly string[];
  readonly capacity: ExpeditionCapacity;
}

export interface ExpeditionDecisionRecord {
  readonly branchId: string;
  readonly optionId: string;
}

export interface ExpeditionProgressState {
  readonly visitedNodeIds: readonly string[];
  readonly decisions: readonly ExpeditionDecisionRecord[];
}

export interface ExpeditionResolvedPath {
  readonly nodeIds: readonly string[];
  readonly decisionOutcomeIds: readonly string[];
  readonly targetSeconds: number;
}

export interface ExpeditionPathReadModel {
  readonly graphId: string;
  readonly currentNodeId: string;
  readonly currentNodeLabel: string;
  readonly visitedNodeIds: readonly string[];
  readonly visitedNodeCount: number;
  readonly totalNodeCount: number;
  readonly visitedSectorCount: number;
  readonly totalSectorCount: number;
  readonly decisionCount: number;
  readonly baselineTargetSeconds: number;
  readonly expandedTargetSeconds: number;
  readonly summary: string;
}

export interface ExpeditionDebugState {
  readonly graphId: string;
  readonly currentNodeId: string;
  readonly currentNodeLabel: string;
  readonly visitedNodes: number;
  readonly totalNodes: number;
  readonly decisions: number;
  readonly baselineMinutes: number;
  readonly expandedMinutes: number;
}
