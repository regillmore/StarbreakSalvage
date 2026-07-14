import type { UnlockId } from '../content/unlocks';
import type { UpgradeId } from '../content/upgrades';
import { getItemById } from '../content/items';
import type { StorageLike } from '../core/saveData';
import {
  createRunGenerationSaveFingerprint,
  generateRunSkeleton,
  type RunSkeleton,
  type StartingContract
} from './Generation';
import { createMissionSchedule } from './MissionDirector';
import { resolveEngineeringSnapshot } from './Foundry';
import type { RunSessionState } from './RunSession';
import { validateRunTimelineState } from './RunTimeline';
import { validateOperationalProgressState } from './OperationalMap';
import { createCarrierInfluence } from './CarrierCommand';
import { validateBoardingCampaignState } from './BoardingOperation';
import { validateFactionFrontState } from './FactionFront';
import { validateCrewArcState } from './CrewArc';
import { validateFleetState } from './Fleetcraft';
import { validateApexHuntState } from './ApexHunt';
import { reconcileItemSockets } from './ItemSockets';
import { validateSectorNavigationState } from './SectorNavigation';

export const RUN_SNAPSHOT_SCHEMA_VERSION = 11;
export const RUN_SNAPSHOT_STORAGE_KEY = 'starbreak.run.v11';
export const LEGACY_RUN_SNAPSHOT_STORAGE_KEYS = [
  'starbreak.run.v10',
  'starbreak.run.v9',
  'starbreak.run.v8',
  'starbreak.run.v7',
  'starbreak.run.v6',
  'starbreak.run.v5',
  'starbreak.run.v4',
  'starbreak.run.v3',
  'starbreak.run.v2',
  'starbreak.run.v1'
] as const;
export const LEGACY_RUN_SNAPSHOT_STORAGE_KEY = LEGACY_RUN_SNAPSHOT_STORAGE_KEYS[9];
export const RUN_SNAPSHOT_MAX_BYTES = 512 * 1024;

export type RunSnapshotResumeTarget = 'sectorTransition' | 'gameplay' | 'operationalMap';

export interface RunSnapshotCheckpoint {
  readonly target: RunSnapshotResumeTarget;
  readonly label: string;
  readonly sequence: number;
}

export interface RunSnapshotExtensionsV11 {
  readonly carrier: { readonly planId: string };
  readonly boarding: { readonly planId: string };
  readonly factionFronts: { readonly planId: string };
  readonly crewArcs: { readonly planId: string };
  readonly fleet: { readonly planId: string };
  readonly apex: { readonly planId: string };
}

export interface RunSnapshotV11 {
  readonly version: 11;
  readonly plan: {
    readonly seed: string;
    readonly graphId: string;
    readonly generationFingerprint: string;
    readonly contractId: string;
    readonly unlockedIds: readonly UnlockId[];
    readonly purchasedUpgradeIds: readonly UpgradeId[];
  };
  readonly checkpoint: RunSnapshotCheckpoint;
  readonly session: RunSessionState;
  readonly extensions: RunSnapshotExtensionsV11;
}

export interface RestoredRunSnapshot {
  readonly snapshot: RunSnapshotV11;
  readonly run: RunSkeleton;
  readonly contract: StartingContract;
  readonly session: RunSessionState;
}

export interface RunSnapshotLoadResult {
  readonly snapshot: RunSnapshotV11 | null;
  readonly repaired: boolean;
  readonly error: string | null;
}

export interface RunSnapshotSummary {
  readonly seed: string;
  readonly contractName: string;
  readonly sectorNumber: number;
  readonly sectorName: string;
  readonly actLabel: string;
  readonly checkpointLabel: string;
  readonly target: RunSnapshotResumeTarget;
  readonly bytes: number;
}

export class RunSnapshotCoordinator {
  public constructor(private readonly storage: StorageLike) {}

  public load(): RunSnapshotLoadResult {
    return loadRunSnapshot(this.storage);
  }

  public checkpoint(options: {
    readonly run: RunSkeleton;
    readonly contract: StartingContract;
    readonly session: RunSessionState;
    readonly target: RunSnapshotResumeTarget;
    readonly label: string;
  }): RunSnapshotV11 {
    const snapshot = createRunSnapshot({
      ...options,
      sequence: options.session.timeline.entries.length
    });
    restoreRunSnapshot(snapshot);
    writeRunSnapshot(this.storage, snapshot);
    return snapshot;
  }

  public restore(snapshot: RunSnapshotV11): RestoredRunSnapshot {
    return restoreRunSnapshot(snapshot);
  }

  public clear(): void {
    clearRunSnapshot(this.storage);
  }
}

export function createRunSnapshot(options: {
  readonly run: RunSkeleton;
  readonly contract: StartingContract;
  readonly session: RunSessionState;
  readonly target: RunSnapshotResumeTarget;
  readonly label: string;
  readonly sequence?: number;
}): RunSnapshotV11 {
  const generationFingerprint = createRunGenerationSaveFingerprint(
    options.run.unlockedIds,
    options.run.upgradeEffects
  );
  const snapshot: RunSnapshotV11 = {
    version: RUN_SNAPSHOT_SCHEMA_VERSION,
    plan: {
      seed: options.run.seed,
      graphId: options.run.expedition.id,
      generationFingerprint,
      contractId: options.contract.id,
      unlockedIds: [...options.run.unlockedIds],
      purchasedUpgradeIds: [...options.run.upgradeEffects.purchasedUpgradeIds]
    },
    checkpoint: {
      target: options.target,
      label: sanitizeLabel(options.label),
      sequence: Math.max(0, Math.floor(options.sequence ?? 0))
    },
    session: options.session,
    extensions: {
      carrier: { planId: options.run.carrierPlan.id },
      boarding: { planId: options.run.boardingCampaign.id },
      factionFronts: { planId: options.run.factionFronts.id },
      crewArcs: { planId: options.run.crewArcs.id },
      fleet: { planId: options.run.fleet.id },
      apex: { planId: options.run.apexHunts.id }
    }
  };
  return importRunSnapshot(exportRunSnapshot(snapshot));
}

export function restoreRunSnapshot(snapshot: RunSnapshotV11): RestoredRunSnapshot {
  const run = generateRunSkeleton(snapshot.plan.seed, {
    unlockedIds: snapshot.plan.unlockedIds,
    purchasedUpgradeIds: snapshot.plan.purchasedUpgradeIds
  });
  const generationFingerprint = createRunGenerationSaveFingerprint(
    run.unlockedIds,
    run.upgradeEffects
  );
  if (generationFingerprint !== snapshot.plan.generationFingerprint) {
    throw new Error('Run snapshot generation fingerprint does not match regenerated content.');
  }
  if (run.expedition.id !== snapshot.plan.graphId) {
    throw new Error('Run snapshot graph identity does not match regenerated content.');
  }
  if (snapshot.extensions.carrier.planId !== run.carrierPlan.id) {
    throw new Error('Run snapshot carrier plan identity does not match regenerated content.');
  }
  if (snapshot.extensions.boarding.planId !== run.boardingCampaign.id) {
    throw new Error('Run snapshot boarding plan identity does not match regenerated content.');
  }
  if (snapshot.extensions.factionFronts.planId !== run.factionFronts.id) {
    throw new Error('Run snapshot faction-front plan identity does not match regenerated content.');
  }
  if (snapshot.extensions.crewArcs.planId !== run.crewArcs.id) {
    throw new Error('Run snapshot crew-arc plan identity does not match regenerated content.');
  }
  if (snapshot.extensions.fleet.planId !== run.fleet.id) {
    throw new Error('Run snapshot fleet plan identity does not match regenerated content.');
  }
  if (snapshot.extensions.apex.planId !== run.apexHunts.id) {
    throw new Error('Run snapshot apex-hunt plan identity does not match regenerated content.');
  }
  const contract = run.contracts.find((candidate) => candidate.id === snapshot.plan.contractId);
  if (!contract)
    throw new Error(`Run snapshot contract is unavailable: ${snapshot.plan.contractId}.`);
  validateSnapshotSession(snapshot.session, run, snapshot.checkpoint.target);
  return {
    snapshot,
    run,
    contract,
    session: importRunSnapshot(exportRunSnapshot(snapshot)).session
  };
}

export function createRunSnapshotSummary(snapshot: RunSnapshotV11): RunSnapshotSummary {
  const restored = restoreRunSnapshot(snapshot);
  const sector = restored.run.sectors[restored.session.currentSectorIndex]!;
  return {
    seed: restored.run.seed,
    contractName: restored.contract.shipName,
    sectorNumber: restored.session.currentSectorIndex + 1,
    sectorName: sector.sectorName,
    actLabel: sector.act.actShortLabel,
    checkpointLabel: snapshot.checkpoint.label,
    target: snapshot.checkpoint.target,
    bytes: new TextEncoder().encode(exportRunSnapshot(snapshot)).byteLength
  };
}

export function loadRunSnapshot(storage: StorageLike): RunSnapshotLoadResult {
  const raw = storage.getItem(RUN_SNAPSHOT_STORAGE_KEY);
  if (!raw) {
    const legacyKey = LEGACY_RUN_SNAPSHOT_STORAGE_KEYS.find((key) => storage.getItem(key));
    if (legacyKey) {
      for (const key of LEGACY_RUN_SNAPSHOT_STORAGE_KEYS) storage.removeItem(key);
      return {
        snapshot: null,
        repaired: true,
        error: 'A previous expedition snapshot was retired safely.'
      };
    }
    return { snapshot: null, repaired: false, error: null };
  }
  try {
    const snapshot = importRunSnapshot(raw);
    restoreRunSnapshot(snapshot);
    return { snapshot, repaired: false, error: null };
  } catch (error) {
    storage.removeItem(RUN_SNAPSHOT_STORAGE_KEY);
    return {
      snapshot: null,
      repaired: true,
      error: error instanceof Error ? error.message : 'Run snapshot could not be loaded.'
    };
  }
}

export function writeRunSnapshot(storage: StorageLike, snapshot: RunSnapshotV11): void {
  storage.setItem(RUN_SNAPSHOT_STORAGE_KEY, exportRunSnapshot(snapshot));
}

export function clearRunSnapshot(storage: StorageLike): void {
  storage.removeItem(RUN_SNAPSHOT_STORAGE_KEY);
  for (const key of LEGACY_RUN_SNAPSHOT_STORAGE_KEYS) storage.removeItem(key);
}

export function exportRunSnapshot(snapshot: RunSnapshotV11): string {
  const serialized = JSON.stringify(snapshot);
  const byteLength = new TextEncoder().encode(serialized).byteLength;
  if (byteLength > RUN_SNAPSHOT_MAX_BYTES) {
    throw new Error(`Run snapshot exceeds ${RUN_SNAPSHOT_MAX_BYTES} bytes.`);
  }
  return serialized;
}

export function importRunSnapshot(serialized: string): RunSnapshotV11 {
  if (new TextEncoder().encode(serialized).byteLength > RUN_SNAPSHOT_MAX_BYTES) {
    throw new Error(`Run snapshot exceeds ${RUN_SNAPSHOT_MAX_BYTES} bytes.`);
  }
  const parsed: unknown = JSON.parse(serialized);
  if (!isRecord(parsed)) throw new Error('Run snapshot payload must be an object.');
  if (parsed.version !== RUN_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`Unsupported run snapshot version: ${String(parsed.version)}.`);
  }
  if (!isRecord(parsed.plan) || !isRecord(parsed.checkpoint) || !isRecord(parsed.session)) {
    throw new Error('Run snapshot is missing plan, checkpoint, or session state.');
  }
  if (
    typeof parsed.plan.seed !== 'string' ||
    typeof parsed.plan.graphId !== 'string' ||
    typeof parsed.plan.generationFingerprint !== 'string' ||
    typeof parsed.plan.contractId !== 'string' ||
    !isStringArray(parsed.plan.unlockedIds) ||
    !isStringArray(parsed.plan.purchasedUpgradeIds)
  ) {
    throw new Error('Run snapshot plan identity is invalid.');
  }
  if (
    (parsed.checkpoint.target !== 'sectorTransition' &&
      parsed.checkpoint.target !== 'gameplay' &&
      parsed.checkpoint.target !== 'operationalMap') ||
    typeof parsed.checkpoint.label !== 'string' ||
    !isNonNegativeInteger(parsed.checkpoint.sequence)
  ) {
    throw new Error('Run snapshot checkpoint is invalid.');
  }
  if (!isRecord(parsed.extensions)) throw new Error('Run snapshot extensions are missing.');
  if (
    !isRecord(parsed.extensions.carrier) ||
    typeof parsed.extensions.carrier.planId !== 'string'
  ) {
    throw new Error('Run snapshot v11 carrier extension is invalid.');
  }
  if (
    !isRecord(parsed.extensions.boarding) ||
    typeof parsed.extensions.boarding.planId !== 'string'
  ) {
    throw new Error('Run snapshot v11 boarding extension is invalid.');
  }
  if (
    !isRecord(parsed.extensions.factionFronts) ||
    typeof parsed.extensions.factionFronts.planId !== 'string'
  ) {
    throw new Error('Run snapshot v11 faction-front extension is invalid.');
  }
  if (
    !isRecord(parsed.extensions.crewArcs) ||
    typeof parsed.extensions.crewArcs.planId !== 'string'
  ) {
    throw new Error('Run snapshot v11 crew-arc extension is invalid.');
  }
  if (!isRecord(parsed.extensions.fleet) || typeof parsed.extensions.fleet.planId !== 'string') {
    throw new Error('Run snapshot v11 fleet extension is invalid.');
  }
  if (!isRecord(parsed.extensions.apex) || typeof parsed.extensions.apex.planId !== 'string') {
    throw new Error('Run snapshot v11 apex extension is invalid.');
  }
  return parsed as unknown as RunSnapshotV11;
}

function validateSnapshotSession(
  session: RunSessionState,
  run: RunSkeleton,
  target: RunSnapshotResumeTarget
): void {
  const numericFields = [
    session.credits,
    session.salvage,
    session.distanceTraveled,
    session.hullPatch,
    session.curse,
    session.relicsRecovered
  ];
  if (numericFields.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Run snapshot economy or distance state is invalid.');
  }
  if (
    !Array.isArray(session.itemInstances) ||
    !Array.isArray(session.routeHistory) ||
    !Array.isArray(session.routeOutcomes) ||
    !Array.isArray(session.interActChoices) ||
    !Array.isArray(session.objectiveHistory)
  ) {
    throw new Error('Run snapshot collection state is invalid.');
  }
  if (
    !isRecord(session.frontierDecision) ||
    (session.frontierDecision.decision !== 'unresolved' &&
      session.frontierDecision.decision !== 'extract' &&
      session.frontierDecision.decision !== 'breach') ||
    !isNonNegativeInteger(session.frontierDecision.actTwoSectorIndex) ||
    !Number.isFinite(session.frontierDecision.creditsAwarded) ||
    !Number.isFinite(session.frontierDecision.salvageAwarded)
  ) {
    throw new Error('Run snapshot frontier decision state is invalid.');
  }
  if (
    !isRecord(session.carrier) ||
    session.carrier.planId !== run.carrierPlan.id ||
    !Array.isArray(session.carrier.facilities) ||
    session.carrier.facilities.length !== run.carrierPlan.facilitySlots ||
    !Array.isArray(session.carrier.cargo) ||
    !Array.isArray(session.carrier.history) ||
    session.carrier.history.length > 64 ||
    !Array.isArray(session.carrier.processedEventIds) ||
    session.carrier.processedEventIds.length > 128 ||
    !Number.isFinite(session.carrier.hull) ||
    !Number.isFinite(session.carrier.heat) ||
    !Number.isFinite(session.carrier.debt) ||
    !Number.isFinite(session.carrier.pursuit)
  ) {
    throw new Error('Run snapshot carrier state is invalid.');
  }
  const carrierInfluence = createCarrierInfluence(run.carrierPlan, session.carrier);
  if (carrierInfluence.cargoUsed > carrierInfluence.cargoCapacity) {
    throw new Error('Run snapshot carrier cargo exceeds capacity.');
  }
  if (validateBoardingCampaignState(run.boardingCampaign, session.boarding).length > 0) {
    throw new Error('Run snapshot boarding campaign state is invalid.');
  }
  if (validateFactionFrontState(run.factionFronts, session.factionFronts).length > 0) {
    throw new Error('Run snapshot faction-front state is invalid.');
  }
  if (validateCrewArcState(run.crewArcs, session.crewArcs).length > 0) {
    throw new Error('Run snapshot crew-arc state is invalid.');
  }
  if (validateFleetState(run.fleet, session.fleet).length > 0) {
    throw new Error('Run snapshot fleet state is invalid.');
  }
  if (validateApexHuntState(run.apexHunts, session.apexHunts).length > 0) {
    throw new Error('Run snapshot apex-hunt state is invalid.');
  }
  try {
    for (const instance of session.itemInstances) getItemById(instance.itemId);
  } catch {
    throw new Error('Run snapshot item state is invalid.');
  }
  const itemOrders = new Set<number>();
  for (const instance of session.itemInstances) {
    if (
      !isNonNegativeInteger(instance.acquisitionOrder) ||
      itemOrders.has(instance.acquisitionOrder) ||
      !Object.hasOwn(instance, 'socket') ||
      (instance.socket !== null &&
        (!isRecord(instance.socket) ||
          typeof instance.socket.componentId !== 'string' ||
          !isNonNegativeInteger(instance.socket.socketIndex) ||
          !isNonNegativeInteger(instance.socket.circuitOrder)))
    ) {
      throw new Error('Run snapshot item socket state is invalid.');
    }
    itemOrders.add(instance.acquisitionOrder);
  }
  if (!isNonNegativeInteger(session.currentSectorIndex)) {
    throw new Error('Run snapshot sector index is invalid.');
  }
  if (
    !isRecord(session.navigation) ||
    session.navigation.sectorIndex !== session.currentSectorIndex ||
    validateSectorNavigationState(session.navigation).length > 0
  ) {
    throw new Error('Run snapshot navigation hub state is invalid.');
  }
  const sector = run.sectors[session.currentSectorIndex];
  if (!sector) throw new Error('Run snapshot sector index is outside the regenerated run.');
  if (!isRecord(session.expedition) || !isStringArray(session.expedition.visitedNodeIds)) {
    throw new Error('Run snapshot expedition progress is invalid.');
  }
  const nodeIds = new Set(run.expedition.nodes.map((node) => node.id));
  if (session.expedition.visitedNodeIds.some((id) => !nodeIds.has(id))) {
    throw new Error('Run snapshot visited an unknown expedition node.');
  }
  for (const decision of session.expedition.decisions) {
    const branch = run.expedition.branches.find((candidate) => candidate.id === decision.branchId);
    if (!branch?.options.some((option) => option.id === decision.optionId)) {
      throw new Error('Run snapshot contains an invalid expedition decision.');
    }
  }
  const schedule = createMissionSchedule(run.expedition, session.currentSectorIndex);
  if (
    session.mission.scheduleId !== schedule.id ||
    session.mission.sectorIndex !== session.currentSectorIndex
  ) {
    throw new Error('Run snapshot mission identity does not match the regenerated sector.');
  }
  const stageIds = new Set(schedule.stages.map((stage) => stage.id));
  if (
    !stageIds.has(session.mission.currentStageId) ||
    (session.mission.suspendedStageId !== null &&
      !stageIds.has(session.mission.suspendedStageId)) ||
    session.mission.visitedStageIds.some((id) => !stageIds.has(id))
  ) {
    throw new Error('Run snapshot mission stage history is invalid.');
  }
  if (
    !Array.isArray(session.mission.selectedBranchOptionIds) ||
    session.mission.selectedBranchOptionIds.some(
      (optionId) =>
        !run.expedition.branches.some((branch) =>
          branch.options.some((option) => option.id === optionId)
        )
    )
  ) {
    throw new Error('Run snapshot mission branch history is invalid.');
  }
  const currentStage = schedule.stages.find(
    (stage) => stage.id === session.mission.currentStageId
  )!;
  if (
    (target === 'gameplay' && currentStage.kind !== 'combat') ||
    (target === 'sectorTransition' &&
      currentStage.kind !== 'briefing' &&
      currentStage.kind !== 'branch') ||
    (target === 'operationalMap' &&
      currentStage.kind !== 'branch' &&
      currentStage.kind !== 'relief' &&
      currentStage.kind !== 'extraction') ||
    (target === 'gameplay' &&
      session.mission.status !== 'active' &&
      session.mission.status !== 'suspended') ||
    ((target === 'sectorTransition' || target === 'operationalMap') &&
      session.mission.status !== 'active')
  ) {
    throw new Error('Run snapshot checkpoint target does not match its mission stage.');
  }
  if (session.factionCampaign.planId !== run.factionCampaign.id) {
    throw new Error('Run snapshot faction campaign does not match the regenerated plan.');
  }
  if (session.crewRoster.planId !== run.crewRoster.id) {
    throw new Error('Run snapshot crew roster does not match the regenerated plan.');
  }
  validateBoundedIds(
    session.factionCampaign.processedEventIds,
    session.factionCampaign.history.length,
    'faction campaign'
  );
  validateBoundedIds(
    session.crewRoster.processedEventIds,
    session.crewRoster.history.length,
    'crew roster'
  );
  const rivalIds = new Set(run.factionCampaign.rivals.map((rival) => rival.id));
  if (session.factionCampaign.rivals.some((rival) => !rivalIds.has(rival.rivalId))) {
    throw new Error('Run snapshot contains an unknown rival.');
  }
  const candidateIds = new Set(run.crewRoster.candidates.map((candidate) => candidate.id));
  if (session.crewRoster.members.some((member) => !candidateIds.has(member.candidateId))) {
    throw new Error('Run snapshot contains an unknown crew member.');
  }
  if (validateRunTimelineState(session.timeline).length > 0) {
    throw new Error('Run snapshot timeline is invalid.');
  }
  if (validateOperationalProgressState(run.expedition, session.operational).length > 0) {
    throw new Error('Run snapshot operational boundary history is invalid.');
  }
  try {
    if (!resolveEngineeringSnapshot(session.engineering.committed).valid) {
      throw new Error('invalid engineering resolution');
    }
    if (
      JSON.stringify(reconcileItemSockets(session.itemInstances, session.engineering.committed)) !==
      JSON.stringify(session.itemInstances)
    ) {
      throw new Error('invalid item socket assignment');
    }
  } catch {
    throw new Error('Run snapshot committed engineering or item socket state is invalid.');
  }
}

function validateBoundedIds(
  processedEventIds: readonly string[],
  historyLength: number,
  label: string
): void {
  if (
    !Array.isArray(processedEventIds) ||
    processedEventIds.length > 128 ||
    new Set(processedEventIds).size !== processedEventIds.length ||
    historyLength > 64
  ) {
    throw new Error(`Run snapshot ${label} history is invalid.`);
  }
}

function sanitizeLabel(value: string): string {
  const label = value.trim().slice(0, 120);
  return label || 'Safe checkpoint';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
