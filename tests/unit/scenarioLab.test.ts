import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  SCENARIO_LAB_DEFINITIONS,
  SCENARIO_LAB_IDS,
  createScenarioLabLaunch,
  validateScenarioLabDefinitions
} from '../../src/game/ScenarioLab';
import { validateRunTimelineState } from '../../src/game/RunTimeline';

describe('ScenarioLab', () => {
  const run = generateRunSkeleton('SCENARIO-LAB-KNOWN');
  const contract = run.contracts[0]!;

  it('declares and validates every public Phase 10 scenario', () => {
    expect(validateScenarioLabDefinitions()).toEqual([]);
    expect(SCENARIO_LAB_DEFINITIONS.map((definition) => definition.id)).toEqual(SCENARIO_LAB_IDS);
    const systems = new Set(SCENARIO_LAB_DEFINITIONS.flatMap((definition) => definition.systems));
    expect(systems.size).toBeGreaterThanOrEqual(12);
    expect([...systems]).toEqual(
      expect.arrayContaining([
        'expedition',
        'foundry',
        'set-piece',
        'rival',
        'crew',
        'snapshot',
        'frontier',
        'carrier',
        'apex'
      ])
    );
  });

  it('creates deterministic disposable sessions and read models for all cards', () => {
    for (const scenarioId of SCENARIO_LAB_IDS) {
      const first = createScenarioLabLaunch({ run, contract, scenarioId });
      const second = createScenarioLabLaunch({ run, contract, scenarioId });
      expect(first.readout).toEqual(second.readout);
      expect(first.session).toEqual(second.session);
      expect(first.readout.id).toBe(scenarioId);
      expect(first.readout.timelineEvents).toBeGreaterThan(1);
      expect(validateRunTimelineState(first.session.timeline)).toEqual([]);
    }
  });

  it('reaches optional mission, engineering, faction, crew, combined, and timeline fixtures', () => {
    const optional = launch('lab_optional_mission');
    expect(optional.session.mission.currentStageId).toContain('optional');

    const foundry = launch('lab_engineering_foundry');
    expect(foundry.session.engineering.history).toHaveLength(3);

    const rival = launch('lab_rival_return');
    expect(rival.session.factionCampaign.history.length).toBeGreaterThan(3);

    const crew = launch('lab_crew_command');
    expect(crew.session.crewRoster.history).toHaveLength(3);

    const combined = launch('lab_combined_pressure');
    expect(combined.session.itemInstances.length).toBeGreaterThan(6);
    expect(combined.session.engineering.history).toHaveLength(3);
    expect(combined.session.factionCampaign.history.length).toBeGreaterThan(3);
    expect(combined.session.crewRoster.history).toHaveLength(3);

    const boarding = launch('lab_boarding_incursion');
    expect(boarding.session.mission.currentStageId).toContain('optional');
    expect(
      run.boardingCampaign.operations.some(
        (operation) =>
          operation.sectorIndex === boarding.session.currentSectorIndex &&
          operation.operationalRole === 'detour'
      )
    ).toBe(true);

    const fronts = launch('lab_faction_fronts');
    expect(fronts.session.factionFronts.history).toHaveLength(4);
    expect(fronts.readout.frontEvents).toBe(4);

    const crewArcs = launch('lab_crew_arcs');
    expect(crewArcs.readout.target).toBe('crewQuarters');
    expect(crewArcs.readout.arcEvents).toBeGreaterThan(2);
    expect(crewArcs.session.crewArcs.arcs.some((arc) => arc.status === 'awaitingChoice')).toBe(
      true
    );

    const fleet = launch('lab_fleetcraft');
    expect(fleet.readout.target).toBe('fleetBay');
    expect(fleet.readout.fleetEvents).toBeGreaterThan(0);
    expect(fleet.session.fleet.craft.filter((craft) => craft.status === 'ready')).toHaveLength(2);

    const apex = launch('lab_apex_hunts');
    expect(apex.readout.target).toBe('apexDossier');
    expect(apex.readout.apexEvents).toBeGreaterThan(3);
    expect(
      apex.session.apexHunts.threats.some((threat) => threat.status === 'awaitingResolution')
    ).toBe(true);

    const carrier = launch('lab_carrier_command');
    expect(carrier.readout.target).toBe('carrierDeck');
    expect(carrier.session.mission.currentStageId).toContain('staging');

    const frontier = launch('lab_frontier_endings');
    expect(frontier.readout.target).toBe('frontierGate');
    expect(frontier.session.currentSectorIndex).toBe(
      run.acts.find((act) => act.id === 'act_core_descent')?.endSectorIndex
    );

    const snapshot = launch('lab_snapshot_recovery');
    expect(snapshot.readout.target).toBe('releaseAudit');
    expect(snapshot.readout.snapshotBytes).toBeGreaterThan(0);
    expect(snapshot.session.mission.currentStageId).toContain('briefing');

    const timeline = launch('lab_timeline_audit').session.timeline;
    expect(new Set(timeline.entries.map((entry) => entry.category))).toEqual(
      new Set([
        'run',
        'node',
        'decision',
        'economy',
        'engineering',
        'faction',
        'rival',
        'crew',
        'boss',
        'duration'
      ])
    );
    expect(timeline.elapsedSeconds).toBe(12.5);
  });

  it('rejects duplicate ids and incomplete QA metadata', () => {
    const broken = {
      ...SCENARIO_LAB_DEFINITIONS[0]!,
      systems: [],
      pressureBudget: '',
      accessibilityCheck: ''
    };
    expect(validateScenarioLabDefinitions([broken, broken])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Duplicate Scenario Lab id'),
        expect.stringContaining('has no systems'),
        expect.stringContaining('incomplete QA metadata'),
        expect.stringContaining('Scenario Lab is missing')
      ])
    );
  });

  function launch(scenarioId: (typeof SCENARIO_LAB_IDS)[number]) {
    return createScenarioLabLaunch({ run, contract, scenarioId });
  }
});
