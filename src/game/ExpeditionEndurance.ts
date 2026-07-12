import { getSetPieceById } from '../content/setPieces';
import { generateRunSkeleton } from './Generation';
import {
  advanceSector,
  applyFrontierDecision,
  createRunSession,
  resetMissionForCurrentSector,
  type RunSessionState
} from './RunSession';
import {
  createRunSnapshot,
  exportRunSnapshot,
  restoreRunSnapshot,
  type RunSnapshotResumeTarget
} from './RunSnapshot';
import {
  SCENARIO_LAB_DEFINITIONS,
  createScenarioLabLaunch,
  type ScenarioLabId
} from './ScenarioLab';

export interface ExpeditionEnduranceBoundaryReport {
  readonly cycle: number;
  readonly boundaryId: ScenarioLabId | 'finale_checkpoint';
  readonly target: RunSnapshotResumeTarget;
  readonly sectorIndex: number;
  readonly missionStageId: string;
  readonly snapshotBytes: number;
  readonly engineeringHistory: number;
  readonly factionHistory: number;
  readonly factionFrontHistory: number;
  readonly crewHistory: number;
  readonly crewArcHistory: number;
  readonly fleetHistory: number;
  readonly apexHistory: number;
  readonly carrierHistory: number;
  readonly carrierCargo: number;
  readonly timelineEntries: number;
  readonly itemCount: number;
  readonly setPieceComponents: number;
  readonly pendingEngineeringActions: number;
}

export interface ExpeditionEnduranceReport {
  readonly seed: string;
  readonly cycles: number;
  readonly boundaries: readonly ExpeditionEnduranceBoundaryReport[];
  readonly maxSnapshotBytes: number;
  readonly maxTimelineEntries: number;
  readonly maxFactionHistory: number;
  readonly maxFactionFrontHistory: number;
  readonly maxCrewHistory: number;
  readonly maxCrewArcHistory: number;
  readonly maxFleetHistory: number;
  readonly maxApexHistory: number;
  readonly maxCarrierHistory: number;
  readonly maxCarrierCargo: number;
  readonly maxEngineeringHistory: number;
  readonly totalRoundTrips: number;
}

export interface FrontierResumeAuditReport {
  readonly seed: string;
  readonly snapshotBytes: number;
  readonly sourceSectorIndex: number;
  readonly extract: {
    readonly decision: 'extract';
    readonly endingReady: true;
    readonly sectorIndex: number;
  };
  readonly breach: {
    readonly decision: 'breach';
    readonly endingReady: true;
    readonly sectorIndex: number;
  };
}

export function runExpeditionEnduranceHarness(options: {
  readonly seed: string;
  readonly cycles?: number;
}): ExpeditionEnduranceReport {
  const cycles = Math.max(1, Math.min(32, Math.floor(options.cycles ?? 4)));
  const run = generateRunSkeleton(options.seed);
  const contract = run.contracts[0];
  if (!contract) throw new Error('Endurance harness requires a generated contract.');
  const boundaries: ExpeditionEnduranceBoundaryReport[] = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (const definition of SCENARIO_LAB_DEFINITIONS) {
      const launch = createScenarioLabLaunch({
        run,
        contract,
        scenarioId: definition.id
      });
      boundaries.push(
        roundTripBoundary({
          cycle,
          boundaryId: definition.id,
          target:
            definition.target === 'gameplay'
              ? 'gameplay'
              : definition.target === 'carrierDeck'
                ? 'operationalMap'
                : 'sectorTransition',
          run,
          contract,
          session: launch.session
        })
      );
    }

    const finaleSession = createRunSession(run, contract);
    finaleSession.currentSectorIndex = run.sectors.length - 1;
    resetMissionForCurrentSector(run, finaleSession);
    boundaries.push(
      roundTripBoundary({
        cycle,
        boundaryId: 'finale_checkpoint',
        target: 'sectorTransition',
        run,
        contract,
        session: finaleSession
      })
    );
  }

  return {
    seed: run.seed,
    cycles,
    boundaries,
    maxSnapshotBytes: Math.max(...boundaries.map((boundary) => boundary.snapshotBytes)),
    maxTimelineEntries: Math.max(...boundaries.map((boundary) => boundary.timelineEntries)),
    maxFactionHistory: Math.max(...boundaries.map((boundary) => boundary.factionHistory)),
    maxFactionFrontHistory: Math.max(...boundaries.map((boundary) => boundary.factionFrontHistory)),
    maxCrewHistory: Math.max(...boundaries.map((boundary) => boundary.crewHistory)),
    maxCrewArcHistory: Math.max(...boundaries.map((boundary) => boundary.crewArcHistory)),
    maxFleetHistory: Math.max(...boundaries.map((boundary) => boundary.fleetHistory)),
    maxApexHistory: Math.max(...boundaries.map((boundary) => boundary.apexHistory)),
    maxCarrierHistory: Math.max(...boundaries.map((boundary) => boundary.carrierHistory)),
    maxCarrierCargo: Math.max(...boundaries.map((boundary) => boundary.carrierCargo)),
    maxEngineeringHistory: Math.max(...boundaries.map((boundary) => boundary.engineeringHistory)),
    totalRoundTrips: boundaries.length
  };
}

export function runFrontierResumeAudit(seed = 'FRONTIER-RESUME-AUDIT'): FrontierResumeAuditReport {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];
  const sourceAct = run.acts.find((act) => act.id === 'act_core_descent');
  if (!contract || !sourceAct) throw new Error('Frontier resume audit requires a contract and Core Descent.');
  const session = createRunSession(run, contract);
  session.currentSectorIndex = sourceAct.endSectorIndex;
  resetMissionForCurrentSector(run, session);
  const snapshot = createRunSnapshot({
    run,
    contract,
    session,
    target: 'sectorTransition',
    label: 'Frontier decision recovery'
  });
  const snapshotBytes = new TextEncoder().encode(exportRunSnapshot(snapshot)).byteLength;
  const extracted = restoreRunSnapshot(snapshot).session;
  const extractDecision = applyFrontierDecision(extracted, 'extract');
  if (extractDecision.decision !== 'extract') throw new Error('Extraction decision did not settle.');
  const breached = restoreRunSnapshot(snapshot).session;
  const breachDecision = applyFrontierDecision(breached, 'breach');
  if (breachDecision.decision !== 'breach') throw new Error('Breach decision did not settle.');
  if (!advanceSector(run, breached)) throw new Error('Breach decision did not enter the frontier.');
  return {
    seed: run.seed,
    snapshotBytes,
    sourceSectorIndex: sourceAct.endSectorIndex,
    extract: {
      decision: extractDecision.decision,
      endingReady: true,
      sectorIndex: extracted.currentSectorIndex
    },
    breach: {
      decision: breachDecision.decision,
      endingReady: true,
      sectorIndex: breached.currentSectorIndex
    }
  };
}

function roundTripBoundary(options: {
  readonly cycle: number;
  readonly boundaryId: ExpeditionEnduranceBoundaryReport['boundaryId'];
  readonly target: RunSnapshotResumeTarget;
  readonly run: ReturnType<typeof generateRunSkeleton>;
  readonly contract: ReturnType<typeof generateRunSkeleton>['contracts'][number];
  readonly session: RunSessionState;
}): ExpeditionEnduranceBoundaryReport {
  const snapshot = createRunSnapshot({
    run: options.run,
    contract: options.contract,
    session: options.session,
    target: options.target,
    label: `Endurance ${options.boundaryId}`,
    sequence: options.cycle
  });
  const serialized = exportRunSnapshot(snapshot);
  const restored = restoreRunSnapshot(snapshot);
  const sector = restored.run.sectors[restored.session.currentSectorIndex]!;
  const setPieceComponents = sector.setPiece
    ? getSetPieceById(sector.setPiece.definitionId).components.length
    : 0;
  return {
    cycle: options.cycle,
    boundaryId: options.boundaryId,
    target: options.target,
    sectorIndex: restored.session.currentSectorIndex,
    missionStageId: restored.session.mission.currentStageId,
    snapshotBytes: new TextEncoder().encode(serialized).byteLength,
    engineeringHistory: restored.session.engineering.history.length,
    factionHistory: restored.session.factionCampaign.history.length,
    factionFrontHistory: restored.session.factionFronts.history.length,
    crewHistory: restored.session.crewRoster.history.length,
    crewArcHistory: restored.session.crewArcs.history.length,
    fleetHistory: restored.session.fleet.history.length,
    apexHistory: restored.session.apexHunts.history.length,
    carrierHistory: restored.session.carrier.history.length,
    carrierCargo: restored.session.carrier.cargo.length,
    timelineEntries: restored.session.timeline.entries.length,
    itemCount: restored.session.itemInstances.length,
    setPieceComponents,
    pendingEngineeringActions: restored.session.engineering.pendingActions.length
  };
}
