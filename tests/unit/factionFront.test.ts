import { describe, expect, it } from 'vitest';

import {
  FACTION_FRONT_KINDS,
  FACTION_FRONT_STANCES,
  FACTION_FRONT_STRATEGIES
} from '../../src/content/factionFronts';
import { FACTIONS } from '../../src/content/factions';
import { validateContent } from '../../src/content/contentValidation';
import {
  applyFactionFrontEvent,
  createFactionFrontCampaignReadModel,
  createFactionFrontInfluence,
  createFactionFrontState,
  isFactionFrontNodeAvailable,
  projectFactionFrontBranchOptions,
  validateFactionFrontPlan,
  validateFactionFrontState
} from '../../src/game/FactionFront';
import { getFactionCampaignInfluence } from '../../src/game/FactionCampaign';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createRunSession,
  recordFactionCampaignEvent,
  recordFactionFrontEvent
} from '../../src/game/RunSession';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';
import { createOperationalMapReadModel } from '../../src/game/OperationalMap';

describe('FactionFront', () => {
  it('generates deterministic sector fronts and validates every faction strategy', () => {
    const first = generateRunSkeleton('FACTION-FRONT-DETERMINISM');
    const second = generateRunSkeleton('FACTION-FRONT-DETERMINISM');
    expect(first.factionFronts).toEqual(second.factionFronts);
    expect(first.factionFronts.sectors).toHaveLength(first.sectors.length);
    expect(validateFactionFrontPlan(first.factionFronts)).toEqual([]);
    expect(new Set(first.factionFronts.sectors.map((front) => front.baselineKind))).toEqual(
      new Set(FACTION_FRONT_KINDS)
    );
    expect(FACTION_FRONT_STRATEGIES).toHaveLength(FACTIONS.length * FACTION_FRONT_STANCES.length);
    expect(validateContent()).toEqual([]);
    expect(
      validateContent({ factionFrontStrategies: FACTION_FRONT_STRATEGIES.slice(1) })
    ).toContain(
      `Faction ${FACTION_FRONT_STRATEGIES[0]!.factionId} must define one ${FACTION_FRONT_STRATEGIES[0]!.stance} front strategy`
    );
  });

  it('moves only later fronts from explicit events and replays identically', () => {
    const run = generateRunSkeleton('FACTION-FRONT-MOVEMENT');
    const plan = run.factionFronts;
    const initial = createFactionFrontState(plan);
    const target = plan.sectors[1]!;
    const event = {
      id: 'front-movement-aid',
      source: 'aid' as const,
      sectorIndex: 0,
      factionId: target.initialFactionId,
      amount: 4,
      reason: 'convoy protected'
    };
    const first = applyFactionFrontEvent(plan, initial, event);
    const replay = applyFactionFrontEvent(plan, initial, event);
    const duplicate = applyFactionFrontEvent(plan, first.state, event);
    expect(first).toEqual(replay);
    expect(first.disposition).toBe('applied');
    expect(first.movedFrontIds.length).toBeGreaterThan(0);
    expect(first.state.sectors[0]).toEqual(initial.sectors[0]);
    expect(first.state.sectors[1]?.stance).toBe('alliance');
    expect(duplicate.disposition).toBe('duplicate');
    expect(validateFactionFrontState(plan, first.state)).toEqual([]);
  });

  it('creates, transforms, or closes reserve nodes with readable non-color forecasts', () => {
    const run = generateRunSkeleton('FACTION-FRONT-NODES');
    const plan = run.factionFronts;
    const target = plan.sectors[1]!;
    const initial = createFactionFrontState(plan);
    const allied = applyFactionFrontEvent(plan, initial, {
      id: 'front-alliance',
      source: 'aid',
      sectorIndex: 0,
      factionId: target.initialFactionId,
      amount: 4,
      reason: 'aid route'
    }).state;
    const hostile = applyFactionFrontEvent(plan, initial, {
      id: 'front-hostility',
      source: 'theft',
      sectorIndex: 0,
      factionId: target.initialFactionId,
      amount: -4,
      reason: 'asset stripped'
    }).state;
    const alliedInfluence = createFactionFrontInfluence(plan, allied, 1);
    const hostileInfluence = createFactionFrontInfluence(plan, hostile, 1);
    const sectorPlan = run.expedition.sectors[1]!;
    const reserveNode = run.expedition.nodes.find(
      (node) =>
        sectorPlan.nodeIds.includes(node.id) &&
        node.operationalRole === hostileInfluence.reserveRole
    )!;
    const branch = run.expedition.branches.find((candidate) =>
      candidate.options.some((option) => option.targetNodeId === reserveNode.id)
    )!;
    expect(alliedInfluence.nodePolicy).toBe('create');
    expect(alliedInfluence.mapCue).toMatch(/^\[/);
    expect(isFactionFrontNodeAvailable(alliedInfluence, reserveNode)).toBe(true);
    expect(
      projectFactionFrontBranchOptions(branch.options, run.expedition.nodes, alliedInfluence)
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: expect.stringContaining('[') })])
    );
    if (hostileInfluence.nodePolicy === 'close') {
      expect(isFactionFrontNodeAvailable(hostileInfluence, reserveNode)).toBe(false);
      expect(
        projectFactionFrontBranchOptions(branch.options, run.expedition.nodes, hostileInfluence)
      ).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ targetNodeId: reserveNode.id })])
      );
      const map = createOperationalMapReadModel({
        graph: run.expedition,
        sectorIndex: 1,
        expedition: { visitedNodeIds: [], decisions: [] },
        operational: { processedOperationIds: [], history: [] },
        currentNodeId: null,
        factionFront: hostileInfluence
      });
      expect(map.nodes.find((node) => node.id === reserveNode.id)).toMatchObject({
        status: 'closed',
        frontDirective: 'closed'
      });
    } else {
      expect(hostileInfluence.nodePolicy).toBe('transform');
    }
  });

  it('feeds ownership, prices, hazards, reinforcements, crew, carrier, set pieces, and endings through one influence', () => {
    const run = generateRunSkeleton('FACTION-FRONT-INFLUENCE');
    const target = run.factionFronts.sectors[2]!;
    let state = createFactionFrontState(run.factionFronts);
    state = applyFactionFrontEvent(run.factionFronts, state, {
      id: 'front-influence-hostility',
      source: 'rival',
      sectorIndex: 1,
      factionId: target.initialFactionId,
      amount: -4,
      reason: 'captain destroyed'
    }).state;
    const session = createRunSession(run, run.contracts[0]!);
    session.factionFronts = state;
    const sector = run.sectors[2]!;
    const influence = getFactionCampaignInfluence(
      run.factionCampaign,
      session.factionCampaign,
      sector,
      { plan: run.factionFronts, state }
    );
    expect(influence.factionId).toBe(influence.front?.ownerFactionId);
    expect(influence.setPieceOwnerFactionId).toBe(influence.front?.ownerFactionId);
    expect(influence.frontForecast).toBeTruthy();
    expect(influence.frontReinforcementCount).toBeGreaterThan(0);
    expect(influence.frontHazardDensityDelta).toBeGreaterThan(0);
    expect(influence.frontCarrierAccess).toBe(false);
    expect(influence.shopDiscount).toBeLessThanOrEqual(0);
    expect(influence.finaleIntervention).toBe(true);
  });

  it('folds campaign events into bounded front history and exposes divergent ending posture', () => {
    const run = generateRunSkeleton('FACTION-FRONT-FOLD');
    const session = createRunSession(run, run.contracts[0]!);
    const factionId = run.factionFronts.sectors[1]!.initialFactionId;
    recordFactionCampaignEvent(
      session,
      run.factionCampaign,
      {
        id: 'front-fold-aid',
        type: 'aid',
        sectorIndex: 0,
        factionId,
        amount: 4,
        reason: 'distress lane protected'
      },
      run.factionFronts
    );
    recordFactionFrontEvent(session, run.factionFronts, {
      id: 'front-fold-carrier',
      source: 'carrier',
      sectorIndex: 0,
      factionId,
      amount: 2,
      reason: 'liaison post powered'
    });
    const readModel = createFactionFrontCampaignReadModel(run.factionFronts, session.factionFronts);
    expect(session.factionFronts.history.map((entry) => entry.source)).toEqual(
      expect.arrayContaining(['aid', 'carrier'])
    );
    expect(readModel.alliedCount).toBeGreaterThan(0);
    expect(['coalition', 'fractured']).toContain(readModel.endingDisposition);
    expect(session.factionFronts.history.length).toBeLessThanOrEqual(64);
  });

  it('accepts every explicit campaign source through the same bounded reducer', () => {
    const run = generateRunSkeleton('FACTION-FRONT-SOURCES');
    const session = createRunSession(run, run.contracts[0]!);
    const sources = [
      'aid',
      'theft',
      'contract',
      'sparedTarget',
      'rival',
      'boarding',
      'crew',
      'carrier'
    ] as const;
    for (const [index, source] of sources.entries()) {
      recordFactionFrontEvent(session, run.factionFronts, {
        id: `front-source-${source}`,
        source,
        sectorIndex: 0,
        factionId: FACTIONS[index % FACTIONS.length]!.id,
        amount: source === 'theft' || source === 'rival' ? -2 : 2,
        reason: `${source} fixture`
      });
    }
    expect(new Set(session.factionFronts.history.map((entry) => entry.source))).toEqual(
      new Set(sources)
    );
    expect(validateFactionFrontState(run.factionFronts, session.factionFronts)).toEqual([]);
  });

  it('round-trips moved fronts through snapshot v11', () => {
    const run = generateRunSkeleton('FACTION-FRONT-SNAPSHOT');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    const target = run.factionFronts.sectors[1]!;
    recordFactionFrontEvent(session, run.factionFronts, {
      id: 'front-snapshot-event',
      source: 'aid',
      sectorIndex: 0,
      factionId: target.initialFactionId,
      amount: 4,
      reason: 'snapshot convoy'
    });
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'sectorTransition',
      label: 'Moved faction front'
    });
    const restored = restoreRunSnapshot(snapshot);
    expect(snapshot.version).toBe(12);
    expect(snapshot.extensions.factionFronts.planId).toBe(run.factionFronts.id);
    expect(restored.session.factionFronts).toEqual(session.factionFronts);
  });
});
