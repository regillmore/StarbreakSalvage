import { describe, expect, it } from 'vitest';

import { getSupportCraftDefinition, SUPPORT_CRAFT_ROLES } from '../../src/content/supportCraft';
import { createDefaultCombatBounds } from '../../src/game/CombatGeometry';
import { createCombatRunResult, createCombatState } from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createFoundryDebugFixture, getCargoComponents } from '../../src/game/Foundry';
import { createCrewCombatProfile, createDebugCrewRosterState } from '../../src/game/CrewCommand';
import {
  MAX_COMBINED_ALLIES,
  MAX_COMBINED_ALLY_PROJECTILES,
  applyFleetCommand,
  createFleetCombatProfile,
  createFleetInfluence,
  createFleetPlan,
  createFleetState,
  recordFleetCombatOutcomes,
  validateFleetContent,
  validateFleetPlan,
  validateFleetState,
  type FleetState
} from '../../src/game/Fleetcraft';
import {
  applyFleetCommand as applySessionFleetCommand,
  createRunSession
} from '../../src/game/RunSession';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';

describe('Fleetcraft', () => {
  const run = generateRunSkeleton('FLEETCRAFT-KNOWN');

  it('generates all six deterministic support roles from validated original content', () => {
    expect(validateFleetContent()).toEqual([]);
    expect(validateFleetPlan(run.fleet)).toEqual([]);
    expect(run.fleet.craft).toHaveLength(6);
    expect(createFleetPlan({ seed: run.seed, saveFingerprint: run.fleet.saveFingerprint })).toEqual(
      run.fleet
    );
    expect(
      new Set(run.fleet.craft.map((craft) => getSupportCraftDefinition(craft.definitionId).role))
    ).toEqual(new Set(SUPPORT_CRAFT_ROLES));
  });

  it('constructs only inside carrier berth and component budgets with duplicate safety', () => {
    const craft = run.fleet.craft[0]!;
    const definition = getSupportCraftDefinition(craft.definitionId);
    const state = createFleetState(run.fleet);
    const first = applyFleetCommand({
      plan: run.fleet,
      state,
      command: { kind: 'construct', craftId: craft.id, componentId: 'component-a' },
      eventId: 'construct-a',
      sectorIndex: 2,
      salvage: definition.buildSalvage,
      cargoComponentIds: ['component-a'],
      berthCapacity: 1,
      foundryAvailable: true,
      crewState: createDebugCrewRosterState(run.crewRoster)
    });
    expect(first).toMatchObject({
      disposition: 'applied',
      salvageCost: definition.buildSalvage,
      consumedComponentId: 'component-a'
    });
    expect(first.state.craft[0]).toMatchObject({ status: 'ready', hull: definition.maxHull });
    expect(
      applyFleetCommand({
        plan: run.fleet,
        state: first.state,
        command: { kind: 'construct', craftId: craft.id, componentId: 'component-a' },
        eventId: 'construct-a',
        sectorIndex: 2,
        salvage: 99,
        cargoComponentIds: ['component-a'],
        berthCapacity: 1,
        foundryAvailable: true,
        crewState: createDebugCrewRosterState(run.crewRoster)
      }).disposition
    ).toBe('duplicate');
  });

  it('supports crew assignment, doctrine, refit, combat loss, recovery, and repair', () => {
    const craft = run.fleet.craft[0]!;
    const crew = createDebugCrewRosterState(run.crewRoster);
    const crewId = crew.members.find((member) => member.status === 'active')!.candidateId;
    let state = readyState(1);
    state = command(
      state,
      'assign',
      {
        kind: 'assign',
        craftId: craft.id,
        candidateId: crewId
      },
      crew
    );
    state = command(
      state,
      'doctrine',
      {
        kind: 'setDoctrine',
        craftId: craft.id,
        doctrine: 'screen'
      },
      crew
    );
    state = command(
      state,
      'refit',
      {
        kind: 'refit',
        craftId: craft.id,
        componentId: 'refit-component',
        refit: 'reinforced'
      },
      crew
    );
    expect(state.craft[0]).toMatchObject({
      assignedCrewId: crewId,
      doctrine: 'screen',
      refit: 'reinforced'
    });

    state = recordFleetCombatOutcomes({
      plan: run.fleet,
      state,
      outcomes: [
        {
          craftId: craft.id,
          lost: true,
          retreated: false,
          remainingHull: 0,
          enemiesDefeated: 3,
          salvageRecovered: 2
        }
      ],
      eventId: 'fleet-loss',
      sectorIndex: 4
    });
    expect(state.craft[0]).toMatchObject({ status: 'lost', losses: 1, assignedCrewId: null });
    state = command(state, 'recover', { kind: 'recover', craftId: craft.id }, crew);
    expect(state.craft[0]).toMatchObject({ status: 'damaged', recoveries: 1 });
    state = command(state, 'repair', { kind: 'repair', craftId: craft.id }, crew);
    expect(state.craft[0]).toMatchObject({ status: 'ready', repairs: 1 });
    expect(validateFleetState(run.fleet, state)).toEqual([]);
  });

  it('projects distinct itinerary uses and bounded crew-plus-fleet combat pressure', () => {
    const state = readyState(6);
    const influence = createFleetInfluence(run.fleet, state);
    expect(influence).toMatchObject({
      boardingAssist: 1,
      optionalSalvageBonus: 1,
      pursuitControl: 1,
      projectileScreen: 1,
      carrierProtection: 1,
      repairSupport: 1
    });
    const crewState = createDebugCrewRosterState(run.crewRoster);
    const crew = createCrewCombatProfile(run.crewRoster, crewState, run.contracts[0]!.loadout);
    const fleet = createFleetCombatProfile({
      plan: run.fleet,
      state,
      berthCapacity: 2,
      allySlotsAvailable: MAX_COMBINED_ALLIES - crew.members.length
    });
    const combat = createCombatState(createDefaultCombatBounds(), 'FLEET-COMBAT', {
      crew,
      fleet,
      skipEnemyWaves: true
    });
    expect(combat.allies.length).toBeLessThanOrEqual(MAX_COMBINED_ALLIES);
    expect(combat.allies.some((ally) => ally.source === 'fleet')).toBe(true);
    expect(MAX_COMBINED_ALLY_PROJECTILES).toBe(20);
    const fleetAlly = combat.allies.find((ally) => ally.source === 'fleet')!;
    fleetAlly.status = 'injured';
    fleetAlly.hull = 0;
    expect(createCombatRunResult(combat, 'abandoned').fleet?.craft[0]).toMatchObject({
      craftId: fleetAlly.candidateId,
      lost: true
    });
  });

  it('round-trips fleet state through snapshot v11', () => {
    const session = createRunSession(run, run.contracts[0]!);
    session.fleet = readyState(2);
    const snapshot = createRunSnapshot({
      run,
      contract: run.contracts[0]!,
      session,
      target: 'sectorTransition',
      label: 'Fleet bay'
    });
    expect(snapshot.version).toBe(11);
    expect(snapshot.extensions.fleet.planId).toBe(run.fleet.id);
    expect(restoreRunSnapshot(snapshot).session.fleet).toEqual(session.fleet);
  });

  it('consumes engineering cargo and records carrier, front, arc, and timeline integration', () => {
    const session = createRunSession(run, run.contracts[0]!);
    session.salvage = 30;
    session.engineering = createFoundryDebugFixture(session.engineering, {
      seed: 'FLEET-SESSION-COMPONENTS',
      sectorIndex: 2
    });
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
    const component = getCargoComponents(session.engineering.committed)[0]!;
    const craft = run.fleet.craft[0]!;
    const result = applySessionFleetCommand(
      run,
      session,
      { kind: 'construct', craftId: craft.id, componentId: component.id },
      'session-fleet-build'
    );
    expect(result.disposition).toBe('applied');
    expect(getCargoComponents(session.engineering.committed)).not.toContainEqual(component);
    expect(session.fleet.craft[0]?.status).toBe('ready');
    expect(session.timeline.entries.some((entry) => entry.kind === 'fleet:construct')).toBe(true);
    expect(session.factionFronts.history.some((entry) => entry.source === 'fleet')).toBe(true);
  });

  function readyState(count: number): FleetState {
    const state = createFleetState(run.fleet);
    return {
      ...state,
      craft: state.craft.map((entry, index) => {
        const plan = run.fleet.craft[index]!;
        const definition = getSupportCraftDefinition(plan.definitionId);
        return index < count
          ? {
              ...entry,
              status: 'ready' as const,
              hull: definition.maxHull,
              componentIds: [`component-${index}`]
            }
          : entry;
      })
    };
  }

  function command(
    state: FleetState,
    eventId: string,
    fleetCommand: Parameters<typeof applyFleetCommand>[0]['command'],
    crewState = createDebugCrewRosterState(run.crewRoster)
  ): FleetState {
    const result = applyFleetCommand({
      plan: run.fleet,
      state,
      command: fleetCommand,
      eventId,
      sectorIndex: 3,
      salvage: 99,
      cargoComponentIds: ['refit-component'],
      berthCapacity: 6,
      foundryAvailable: true,
      crewState
    });
    expect(result.disposition).toBe('applied');
    return result.state;
  }
});
