import { describe, expect, it } from 'vitest';

import { FACTION_RESPONSE_POLICIES, RIVAL_ARCHETYPES } from '../../src/content/factionCampaigns';
import {
  applyFactionCampaignEvent,
  createDebugFactionCampaignState,
  createFactionCampaignPlan,
  createFactionCampaignState,
  foldFactionCampaignEvents,
  getCapturableRivalForSector,
  getFactionCampaignInfluence,
  getRivalForSector,
  validateFactionCampaignContent,
  type FactionCampaignEvent
} from '../../src/game/FactionCampaign';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('FactionCampaign', () => {
  it('validates four response policies and at least four recurring archetypes', () => {
    expect(validateFactionCampaignContent()).toEqual([]);
    expect(FACTION_RESPONSE_POLICIES).toHaveLength(4);
    expect(RIVAL_ARCHETYPES.length).toBeGreaterThanOrEqual(4);
    expect(
      new Set(RIVAL_ARCHETYPES.map((archetype) => archetype.tactic)).size
    ).toBeGreaterThanOrEqual(4);
  });

  it('rejects duplicate response ownership and invalid recurrence contracts', () => {
    const policy = FACTION_RESPONSE_POLICIES[0]!;
    const archetype = RIVAL_ARCHETYPES[0]!;
    const errors = validateFactionCampaignContent({
      policies: [policy, policy],
      archetypes: [
        { ...archetype, maxAppearances: 1, recurrenceGapSectors: 0 },
        ...RIVAL_ARCHETYPES.slice(1)
      ]
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('At least three faction response policies'),
        expect.stringContaining('Duplicate faction response policy'),
        expect.stringContaining('has no response policy'),
        expect.stringContaining('invalid recurrence policy')
      ])
    );
  });

  it('generates stable named captains from seed plus save fingerprint', () => {
    const options = {
      seed: 'RIVAL-CAPTAIN-KNOWN',
      saveFingerprint: 'unlocks=fresh|upgrades=none',
      sectorCount: 10
    };
    const first = createFactionCampaignPlan(options);
    const second = createFactionCampaignPlan(options);
    const progressed = createFactionCampaignPlan({
      ...options,
      saveFingerprint: 'unlocks=ship|upgrades=decoder'
    });

    expect(first).toEqual(second);
    expect(first).not.toEqual(progressed);
    expect(first.rivals).toHaveLength(4);
    expect(new Set(first.rivals.map((rival) => rival.factionId)).size).toBe(4);
    expect(new Set(first.rivals.map((rival) => rival.archetypeId)).size).toBe(4);
    expect(first.rivals.every((rival) => rival.name && rival.shipName)).toBe(true);
  });

  it('folds identical decision history into identical ledgers', () => {
    const plan = createFactionCampaignPlan({
      seed: 'FACTION-DECISION-HISTORY',
      saveFingerprint: 'fresh',
      sectorCount: 10
    });
    const events: FactionCampaignEvent[] = [
      {
        id: 'aid-ledger',
        type: 'aid',
        sectorIndex: 0,
        factionId: 'faction_corporate_ledger',
        amount: 3,
        reason: 'protected a permit convoy'
      },
      {
        id: 'steal-court',
        type: 'assetStolen',
        sectorIndex: 1,
        factionId: 'faction_scrap_court',
        value: 2
      },
      {
        id: 'spare-bloom',
        type: 'targetSpared',
        sectorIndex: 2,
        factionId: 'faction_bloom_hive'
      },
      {
        id: 'contract-void',
        type: 'contractCompleted',
        sectorIndex: 3,
        factionId: 'faction_void_corsairs',
        contractId: 'contract-test'
      },
      {
        id: 'outcome-void',
        type: 'missionOutcome',
        sectorIndex: 3,
        factionId: 'faction_void_corsairs',
        contractId: 'contract-test',
        outcome: 'success'
      }
    ];

    const first = foldFactionCampaignEvents(plan, events);
    const second = foldFactionCampaignEvents(plan, events);

    expect(first).toEqual(second);
    expect(first.ledgers.faction_corporate_ledger.aid).toBe(3);
    expect(first.ledgers.faction_scrap_court.stolenAssets).toBe(2);
    expect(first.ledgers.faction_bloom_hive.sparedTargets).toBe(1);
    expect(first.ledgers.faction_void_corsairs.completedContracts).toBe(1);
    expect(first.history).toHaveLength(events.length);
  });

  it('handles escape, injury, adaptation, recurrence, capture, and one-shot rewards', () => {
    const plan = createFactionCampaignPlan({
      seed: 'RIVAL-RECURRENCE',
      saveFingerprint: 'fresh',
      sectorCount: 10
    });
    const captain = plan.rivals[0]!;
    let state = createFactionCampaignState(plan);

    state = applyFactionCampaignEvent(plan, state, {
      id: 'encounter-1',
      type: 'rivalEncounter',
      sectorIndex: 1,
      factionId: captain.factionId,
      rivalId: captain.id
    }).state;
    state = applyFactionCampaignEvent(plan, state, {
      id: 'escape-1',
      type: 'rivalOutcome',
      sectorIndex: 1,
      factionId: captain.factionId,
      rivalId: captain.id,
      outcome: 'escaped'
    }).state;

    const escaped = state.rivals.find((rival) => rival.rivalId === captain.id)!;
    expect(escaped).toMatchObject({ status: 'escaped', appearances: 1, grudge: 2 });
    expect(escaped.injuries).toHaveLength(1);
    expect(escaped.upgrades).toHaveLength(1);
    expect(getRivalForSector(plan, state, escaped.nextEligibleSectorIndex)?.id).toBe(captain.id);

    state = applyFactionCampaignEvent(plan, state, {
      id: 'encounter-2',
      type: 'rivalEncounter',
      sectorIndex: escaped.nextEligibleSectorIndex,
      factionId: captain.factionId,
      rivalId: captain.id
    }).state;
    state = applyFactionCampaignEvent(plan, state, {
      id: 'escape-2',
      type: 'rivalOutcome',
      sectorIndex: escaped.nextEligibleSectorIndex,
      factionId: captain.factionId,
      rivalId: captain.id,
      outcome: 'escaped'
    }).state;
    const capturable = getCapturableRivalForSector(plan, state, escaped.nextEligibleSectorIndex);
    expect(capturable?.id).toBe(captain.id);

    const captureEvent: FactionCampaignEvent = {
      id: 'capture-2',
      type: 'rivalOutcome',
      sectorIndex: escaped.nextEligibleSectorIndex,
      factionId: captain.factionId,
      rivalId: captain.id,
      outcome: 'captured'
    };
    const captured = applyFactionCampaignEvent(plan, state, captureEvent);
    const duplicate = applyFactionCampaignEvent(plan, captured.state, captureEvent);
    const terminalReplay = applyFactionCampaignEvent(plan, captured.state, {
      ...captureEvent,
      id: 'capture-terminal-replay'
    });

    expect(captured.state.rivals.find((rival) => rival.rivalId === captain.id)?.status).toBe(
      'captured'
    );
    expect(captured.reward).toEqual(captain.captureReward);
    expect(duplicate.disposition).toBe('duplicate');
    expect(duplicate.reward).toEqual({ credits: 0, salvage: 0 });
    expect(terminalReplay.disposition).toBe('rejected');
    expect(terminalReplay.reward).toEqual({ credits: 0, salvage: 0 });
    expect(getRivalForSector(plan, captured.state, 9)?.id).not.toBe(captain.id);
  });

  it('changes combat, shops, routes, crew signals, and set-piece ownership from explicit state', () => {
    const run = generateRunSkeleton('CAMPAIGN-INFLUENCE');
    const sector = run.sectors[0]!;
    const factionId = sector.bossFactionId;
    const policy = FACTION_RESPONSE_POLICIES.find(
      (candidate) => candidate.factionId === factionId
    )!;
    const events: FactionCampaignEvent[] = [
      {
        id: 'influence-aid',
        type: 'aid',
        sectorIndex: 0,
        factionId,
        amount: policy.crewOfferThreshold + 2,
        reason: 'protected faction crews'
      },
      {
        id: 'influence-theft',
        type: 'assetStolen',
        sectorIndex: 0,
        factionId,
        value: 2
      }
    ];
    const state = foldFactionCampaignEvents(run.factionCampaign, events);
    const influence = getFactionCampaignInfluence(run.factionCampaign, state, sector);

    expect(influence.enemyHullBonus).toBeGreaterThan(0);
    expect(influence.routePreview).toContain('Aid');
    expect(influence.shopBiasTags.length).toBeGreaterThan(0);
    expect(influence.crewOfferSignal).toContain('distress channel');
    expect(influence.setPieceOwnerFactionId).toBe(influence.factionId);
  });

  it('provides a deterministic public debug fixture without private state mutation', () => {
    const run = generateRunSkeleton('RIVAL-DEBUG-FIXTURE');
    const first = createDebugFactionCampaignState(run.factionCampaign);
    const second = createDebugFactionCampaignState(run.factionCampaign);

    expect(first).toEqual(second);
    expect(first.history.length).toBeGreaterThanOrEqual(3);
    expect(first.ledgers.faction_corporate_ledger.aid).toBeGreaterThan(0);
    expect(first.ledgers.faction_scrap_court.stolenAssets).toBeGreaterThan(0);
  });
});
