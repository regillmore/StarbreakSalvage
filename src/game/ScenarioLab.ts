import { createDebugCrewRosterState } from './CrewCommand';
import { createDebugCrewArcState } from './CrewArc';
import { createDebugFleetState } from './Fleetcraft';
import { createDebugApexHuntState } from './ApexHunt';
import type { UnlockId } from '../content/unlocks';
import { createDebugFactionFrontState } from './FactionFront';
import { createDebugFactionCampaignState } from './FactionCampaign';
import { createFoundryDebugFixture } from './Foundry';
import { createItemStormLoadout } from './ItemStress';
import { autoFitItemSockets } from './ItemSockets';
import type { RunSkeleton, StartingContract } from './Generation';
import { getMissionBranchOptions, createMissionSchedule } from './MissionDirector';
import {
  createRunSession,
  dispatchMissionEvent,
  recordExpeditionBranchDecision,
  recordRunSessionTimelineEvent,
  resetMissionForCurrentSector,
  type RunSessionState
} from './RunSession';
import { createRunSnapshot, exportRunSnapshot, restoreRunSnapshot } from './RunSnapshot';

export const SCENARIO_LAB_IDS = [
  'lab_expedition_node',
  'lab_optional_mission',
  'lab_engineering_foundry',
  'lab_set_piece',
  'lab_rival_return',
  'lab_crew_command',
  'lab_combined_pressure',
  'lab_boarding_incursion',
  'lab_faction_fronts',
  'lab_crew_arcs',
  'lab_fleetcraft',
  'lab_apex_hunts',
  'lab_carrier_command',
  'lab_frontier_endings',
  'lab_snapshot_recovery',
  'lab_timeline_audit'
] as const;
export type ScenarioLabId = (typeof SCENARIO_LAB_IDS)[number];
export type ScenarioLabTarget =
  | 'transition'
  | 'gameplay'
  | 'foundry'
  | 'crewQuarters'
  | 'fleetBay'
  | 'apexDossier'
  | 'carrierDeck'
  | 'frontierGate'
  | 'releaseAudit'
  | 'timeline';
export type ScenarioLabGameplayPreset =
  'none' | 'setPiece' | 'rival' | 'crew' | 'combined' | 'boarding' | 'front';

export interface ScenarioLabDefinition {
  readonly id: ScenarioLabId;
  readonly title: string;
  readonly summary: string;
  readonly systems: readonly string[];
  readonly sectorIndex: number;
  readonly target: ScenarioLabTarget;
  readonly optionalMission: boolean;
  readonly factionFixture: boolean;
  readonly crewFixture: boolean;
  readonly engineeringFixture: boolean;
  readonly fleetFixture: boolean;
  readonly apexFixture: boolean;
  readonly gameplayPreset: ScenarioLabGameplayPreset;
  readonly pressureBudget: string;
  readonly accessibilityCheck: string;
}

export interface ScenarioLabLaunch {
  readonly definition: ScenarioLabDefinition;
  readonly session: RunSessionState;
  readonly readout: ScenarioLabSetupReadModel;
}

export interface ScenarioLabSetupReadModel {
  readonly id: ScenarioLabId;
  readonly target: ScenarioLabTarget;
  readonly sector: string;
  readonly missionStage: string;
  readonly frame: string;
  readonly engineeringHistory: number;
  readonly factionEvents: number;
  readonly crewEvents: number;
  readonly timelineEvents: number;
  readonly frontEvents: number;
  readonly arcEvents: number;
  readonly fleetEvents: number;
  readonly apexEvents: number;
  readonly snapshotBytes: number;
  readonly summary: string;
}

export const SCENARIO_LAB_DEFINITIONS: readonly ScenarioLabDefinition[] = [
  scenario(
    'lab_expedition_node',
    'Expedition Node',
    'Enter a generated Act II mission briefing with public graph and stage readouts.',
    ['expedition', 'mission'],
    5,
    'transition',
    'none'
  ),
  scenario(
    'lab_optional_mission',
    'Optional Mission Branch',
    'Launch directly into a generated optional combat stage after an explicit branch decision.',
    ['expedition', 'mission', 'objective'],
    2,
    'gameplay',
    'none',
    { optionalMission: true }
  ),
  scenario(
    'lab_engineering_foundry',
    'Engineering Foundry',
    'Open a deterministic foundry inventory with contract modules and three generated components.',
    ['frame', 'modules', 'foundry', 'engineering'],
    4,
    'foundry',
    'none',
    { engineeringFixture: true }
  ),
  scenario(
    'lab_set_piece',
    'Set-Piece Assembly',
    'Launch the Act II station assembly at its fixed-world anchor and safe lane.',
    ['mission', 'set-piece', 'geometry'],
    6,
    'gameplay',
    'setPiece'
  ),
  scenario(
    'lab_rival_return',
    'Returning Rival',
    'Launch a recurring upgraded captain through the normal campaign influence path.',
    ['faction', 'rival', 'mission'],
    2,
    'gameplay',
    'rival',
    { factionFixture: true }
  ),
  scenario(
    'lab_crew_command',
    'Crew Command Wing',
    'Deploy a command-headroom-limited wing with all five accessible orders.',
    ['crew', 'loadout', 'commands'],
    3,
    'gameplay',
    'crew',
    { crewFixture: true }
  ),
  scenario(
    'lab_combined_pressure',
    'Combined Voyage Pressure',
    'Stress a set piece, evolved loadout, faction state, crew, fleetcraft, formations, projectiles, objects, pickups, and hooks together.',
    ['set-piece', 'engineering', 'faction', 'rival', 'crew', 'fleetcraft', 'items', 'environment'],
    6,
    'gameplay',
    'combined',
    {
      factionFixture: true,
      crewFixture: true,
      engineeringFixture: true,
      fleetFixture: true
    }
  ),
  scenario(
    'lab_boarding_incursion',
    'Boarding Incursion',
    'Launch a generated room-chain boarding contract with translated ship systems and custody stakes.',
    ['boarding', 'rooms', 'bulkheads', 'hazards', 'custody', 'carrier'],
    2,
    'gameplay',
    'boarding',
    { optionalMission: true, crewFixture: true, engineeringFixture: true }
  ),
  scenario(
    'lab_faction_fronts',
    'Dynamic Faction Fronts',
    'Launch a moved territory front with transformed ownership, hazards, reinforcements, support, and ending posture.',
    ['faction-fronts', 'nodes', 'ownership', 'markets', 'reinforcements', 'endings'],
    3,
    'gameplay',
    'front',
    { factionFixture: true, crewFixture: true }
  ),
  scenario(
    'lab_crew_arcs',
    'Crew Arcs And Fates',
    'Inspect a deterministic voyage cast with resolved and waiting relationship decisions, ranks, paired behavior, and fates.',
    ['crew-arcs', 'relationships', 'choices', 'promotions', 'fates', 'succession'],
    7,
    'crewQuarters',
    'none',
    { factionFixture: true, crewFixture: true }
  ),
  scenario(
    'lab_fleetcraft',
    'Fleetcraft Hangar',
    'Inspect constructed, damaged, crewed, automated, and doctrine-bound support craft under shared ally budgets.',
    ['fleetcraft', 'hangar', 'engineering', 'crew', 'doctrines', 'shared-budgets'],
    7,
    'fleetBay',
    'none',
    { crewFixture: true, engineeringFixture: true, fleetFixture: true }
  ),
  scenario(
    'lab_apex_hunts',
    'Roaming Apex Hunts',
    'Inspect three multi-sector threat chains, persistent subsystem wounds, migration pressure, ending requirements, and shared combat budgets.',
    ['apex', 'bosses', 'persistence', 'endings', 'unlocks', 'shared-budgets'],
    7,
    'apexDossier',
    'none',
    { factionFixture: true, crewFixture: true, fleetFixture: true, apexFixture: true }
  ),
  scenario(
    'lab_carrier_command',
    'Carrier Command Checkpoint',
    'Open a staging checkpoint with carrier facilities, crew posts, fleet access, and an independently resumable command decision.',
    ['carrier', 'snapshot', 'staging', 'facilities', 'fleetcraft'],
    1,
    'carrierDeck',
    'none',
    { crewFixture: true, engineeringFixture: true, fleetFixture: true }
  ),
  scenario(
    'lab_frontier_endings',
    'Frontier Ending Gate',
    'Reach the extraction-or-breach decision with a settled Core Descent history and explicit divergent ending state.',
    ['frontier', 'extraction', 'divergent-endings', 'summary', 'multi-operation'],
    9,
    'frontierGate',
    'none',
    { factionFixture: true, crewFixture: true }
  ),
  scenario(
    'lab_snapshot_recovery',
    'Voyage Release Audit',
    'Round-trip a real snapshot v9 session and inspect fresh, progressed, extraction, standard, and completionist structural duration evidence.',
    ['snapshot', 'recovery', 'duration', 'save-v5', 'run-v9', 'endurance'],
    0,
    'releaseAudit',
    'none'
  ),
  scenario(
    'lab_timeline_audit',
    'Run Timeline Audit',
    'Inspect deterministic node, decision, economy, engineering, faction, rival, crew, boss, duration, and run events.',
    ['timeline', 'summary', 'determinism'],
    8,
    'timeline',
    'none',
    { factionFixture: true, crewFixture: true, engineeringFixture: true }
  )
];

export function getScenarioLabDefinition(id: ScenarioLabId): ScenarioLabDefinition {
  const definition = SCENARIO_LAB_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown Scenario Lab definition: ${id}.`);
  return definition;
}

export function createScenarioLabLaunch(options: {
  readonly run: RunSkeleton;
  readonly contract: StartingContract;
  readonly scenarioId: ScenarioLabId;
  readonly unlockedIds?: readonly UnlockId[];
}): ScenarioLabLaunch {
  const definition = getScenarioLabDefinition(options.scenarioId);
  let session = createRunSession(options.run, options.contract, {
    unlockedIds: options.unlockedIds
  });
  const boardingSectorIndex =
    definition.id === 'lab_boarding_incursion'
      ? (options.run.boardingCampaign.operations.find(
          (operation) => operation.operationalRole === 'detour'
        )?.sectorIndex ?? definition.sectorIndex)
      : definition.sectorIndex;
  session.currentSectorIndex = Math.min(boardingSectorIndex, options.run.sectors.length - 1);
  resetMissionForCurrentSector(options.run, session);
  session.credits = 48;
  session.salvage = 12;
  if (definition.factionFixture) {
    session.factionCampaign = createDebugFactionCampaignState(options.run.factionCampaign);
  }
  if (definition.id === 'lab_faction_fronts' || definition.apexFixture) {
    session.factionFronts = createDebugFactionFrontState(options.run.factionFronts);
  }
  if (definition.crewFixture) {
    session.crewRoster = createDebugCrewRosterState(options.run.crewRoster);
    session.crewArcs = createDebugCrewArcState(
      options.run.crewArcs,
      options.run.crewRoster,
      session.crewRoster
    );
  }
  if (definition.engineeringFixture) {
    session.engineering = createFoundryDebugFixture(session.engineering, {
      seed: `${options.run.seed}:${definition.id}`,
      sectorIndex: session.currentSectorIndex
    });
  }
  if (definition.fleetFixture) {
    session.fleet = createDebugFleetState(options.run.fleet);
    session.carrier = {
      ...session.carrier,
      facilities: session.carrier.facilities.map((facility, index) =>
        index === 0
          ? {
              ...facility,
              type: 'hangar' as const,
              level: 2,
              condition: 'operational' as const,
              powered: true
            }
          : facility
      )
    };
  }
  if (definition.apexFixture) {
    session.apexHunts = createDebugApexHuntState(options.run.apexHunts);
  }
  if (definition.target === 'carrierDeck') {
    const schedule = createMissionSchedule(options.run.expedition, session.currentSectorIndex);
    if (!schedule.reliefStageId) throw new Error('Carrier Scenario Lab fixture requires staging.');
    session.mission = {
      ...session.mission,
      currentStageId: schedule.reliefStageId,
      visitedStageIds: [schedule.startStageId, schedule.reliefStageId]
    };
  }
  if (definition.id === 'lab_combined_pressure') {
    session.itemInstances = autoFitItemSockets(
      createItemStormLoadout(),
      session.engineering.committed
    );
  }

  if (definition.target === 'gameplay' || definition.optionalMission) {
    enterPrimaryCombat(options.run, session, definition.id);
  }
  if (definition.optionalMission) enterOptionalCombat(options.run, session, definition.id);

  recordRunSessionTimelineEvent(session, {
    id: `scenario-lab:${definition.id}`,
    category: 'run',
    kind: 'scenarioLab',
    sectorIndex: session.currentSectorIndex,
    subjectId: definition.id,
    detailId: definition.target
  });
  for (const [index, category] of [
    'node',
    'decision',
    'economy',
    'engineering',
    'faction',
    'rival',
    'crew',
    'boss',
    'duration'
  ].entries()) {
    if (definition.id !== 'lab_timeline_audit') break;
    recordRunSessionTimelineEvent(session, {
      id: `scenario-lab:${definition.id}:fixture:${category}`,
      category: category as Parameters<typeof recordRunSessionTimelineEvent>[1]['category'],
      kind: 'fixture',
      sectorIndex: session.currentSectorIndex,
      durationSeconds: category === 'duration' ? 12.5 : 0,
      value: index,
      subjectId: definition.id,
      detailId: category
    });
  }

  let snapshotBytes = 0;
  if (definition.id === 'lab_snapshot_recovery') {
    const snapshot = createRunSnapshot({
      run: options.run,
      contract: options.contract,
      session,
      target: 'sectorTransition',
      label: 'Scenario Lab snapshot recovery'
    });
    snapshotBytes = new TextEncoder().encode(exportRunSnapshot(snapshot)).byteLength;
    session = restoreRunSnapshot(snapshot).session;
  }

  return {
    definition,
    session,
    readout: createScenarioLabSetupReadModel(options.run, session, definition, snapshotBytes)
  };
}

export function createScenarioLabSetupReadModel(
  run: RunSkeleton,
  session: RunSessionState,
  definition: ScenarioLabDefinition,
  snapshotBytes = 0
): ScenarioLabSetupReadModel {
  const sector = run.sectors[session.currentSectorIndex]!;
  return {
    id: definition.id,
    target: definition.target,
    sector: `${sector.index}:${sector.sectorName}`,
    missionStage: session.mission.currentStageId,
    frame: session.engineering.committed.frameId,
    engineeringHistory: session.engineering.history.length,
    factionEvents: session.factionCampaign.history.length,
    crewEvents: session.crewRoster.history.length,
    timelineEvents: session.timeline.entries.length,
    frontEvents: session.factionFronts.history.length,
    arcEvents: session.crewArcs.history.length,
    fleetEvents: session.fleet.history.length,
    apexEvents: session.apexHunts.history.length,
    snapshotBytes,
    summary: `${definition.title} | ${definition.systems.join('+')} | ${definition.pressureBudget}`
  };
}

export function validateScenarioLabDefinitions(
  definitions: readonly ScenarioLabDefinition[] = SCENARIO_LAB_DEFINITIONS
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.id)) errors.push(`Duplicate Scenario Lab id: ${definition.id}`);
    ids.add(definition.id);
    if (definition.systems.length === 0) errors.push(`Scenario ${definition.id} has no systems.`);
    if (definition.sectorIndex < 0 || definition.sectorIndex > 9) {
      errors.push(`Scenario ${definition.id} has invalid sector index.`);
    }
    if (!definition.pressureBudget || !definition.accessibilityCheck) {
      errors.push(`Scenario ${definition.id} has incomplete QA metadata.`);
    }
  }
  for (const id of SCENARIO_LAB_IDS) {
    if (!ids.has(id)) errors.push(`Scenario Lab is missing ${id}.`);
  }
  const requiredSystems = [
    'snapshot',
    'multi-operation',
    'frontier',
    'carrier',
    'boarding',
    'faction-fronts',
    'crew-arcs',
    'fleetcraft',
    'apex'
  ];
  const systems = new Set(definitions.flatMap((definition) => definition.systems));
  for (const system of requiredSystems) {
    if (!systems.has(system)) errors.push(`Scenario Lab is missing Phase 11 system ${system}.`);
  }
  return errors;
}

function enterPrimaryCombat(run: RunSkeleton, session: RunSessionState, id: string): void {
  dispatchMissionEvent(run, session, {
    id: `${id}:confirm-briefing`,
    type: 'confirmBriefing'
  });
  dispatchMissionEvent(run, session, { id: `${id}:complete-entry`, type: 'completeEntry' });
}

function enterOptionalCombat(run: RunSkeleton, session: RunSessionState, id: string): void {
  const primaryStageId = session.mission.currentStageId;
  dispatchMissionEvent(run, session, {
    id: `${id}:complete-primary`,
    type: 'completeCombat',
    checkpoint: {
      hull: 4,
      scrollDistance: 900,
      worldOffset: 10_900,
      credits: session.credits,
      salvage: session.salvage
    }
  });
  const schedule = createMissionSchedule(run.expedition, session.currentSectorIndex);
  const option = getMissionBranchOptions(schedule, session.mission).find(
    (candidate) => !candidate.default
  );
  if (!option || !schedule.branch)
    throw new Error(`Scenario ${id} has no optional branch from ${primaryStageId}.`);
  dispatchMissionEvent(run, session, {
    id: `${id}:select-optional:${option.id}`,
    type: 'selectBranch',
    optionId: option.id
  });
  recordExpeditionBranchDecision(run, session, schedule.branch.id, option.id);
}

function scenario(
  id: ScenarioLabId,
  title: string,
  summary: string,
  systems: readonly string[],
  sectorIndex: number,
  target: ScenarioLabTarget,
  gameplayPreset: ScenarioLabGameplayPreset,
  flags: Partial<
    Pick<
      ScenarioLabDefinition,
      'optionalMission' | 'factionFixture' | 'crewFixture' | 'engineeringFixture'
      | 'fleetFixture' | 'apexFixture'
    >
  > = {}
): ScenarioLabDefinition {
  return {
    id,
    title,
    summary,
    systems,
    sectorIndex,
    target,
    gameplayPreset,
    optionalMission: flags.optionalMission ?? false,
    factionFixture: flags.factionFixture ?? false,
    crewFixture: flags.crewFixture ?? false,
    engineeringFixture: flags.engineeringFixture ?? false,
    fleetFixture: flags.fleetFixture ?? false,
    apexFixture: flags.apexFixture ?? false,
    pressureBudget:
      target === 'gameplay' ? 'actors/projectiles/geometry bounded' : 'static DOM/read-model setup',
    accessibilityCheck: 'keyboard, pointer, narrow, high contrast, reduced motion, performance mode'
  };
}
