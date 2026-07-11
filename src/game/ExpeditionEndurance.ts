import { getSetPieceById } from '../content/setPieces';
import { generateRunSkeleton } from './Generation';
import { createRunSession, resetMissionForCurrentSector, type RunSessionState } from './RunSession';
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
  readonly crewHistory: number;
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
  readonly maxCrewHistory: number;
  readonly maxCarrierHistory: number;
  readonly maxCarrierCargo: number;
  readonly maxEngineeringHistory: number;
  readonly totalRoundTrips: number;
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
          target: definition.target === 'gameplay' ? 'gameplay' : 'sectorTransition',
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
    maxCrewHistory: Math.max(...boundaries.map((boundary) => boundary.crewHistory)),
    maxCarrierHistory: Math.max(...boundaries.map((boundary) => boundary.carrierHistory)),
    maxCarrierCargo: Math.max(...boundaries.map((boundary) => boundary.carrierCargo)),
    maxEngineeringHistory: Math.max(...boundaries.map((boundary) => boundary.engineeringHistory)),
    totalRoundTrips: boundaries.length
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
    crewHistory: restored.session.crewRoster.history.length,
    carrierHistory: restored.session.carrier.history.length,
    carrierCargo: restored.session.carrier.cargo.length,
    timelineEntries: restored.session.timeline.entries.length,
    itemCount: restored.session.itemInstances.length,
    setPieceComponents,
    pendingEngineeringActions: restored.session.engineering.pendingActions.length
  };
}
