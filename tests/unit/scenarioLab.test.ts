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
      expect.arrayContaining(['expedition', 'foundry', 'set-piece', 'rival', 'crew'])
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
