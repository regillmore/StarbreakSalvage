import { describe, expect, it } from 'vitest';

import { SAVE_STORAGE_KEY } from '../../src/core/saveData';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession, dispatchMissionEvent } from '../../src/game/RunSession';
import {
  RUN_SNAPSHOT_MAX_BYTES,
  RUN_SNAPSHOT_STORAGE_KEY,
  LEGACY_RUN_SNAPSHOT_STORAGE_KEY,
  LEGACY_RUN_SNAPSHOT_STORAGE_KEYS,
  RunSnapshotCoordinator,
  clearRunSnapshot,
  createRunSnapshot,
  createRunSnapshotSummary,
  exportRunSnapshot,
  importRunSnapshot,
  loadRunSnapshot,
  restoreRunSnapshot,
  writeRunSnapshot
} from '../../src/game/RunSnapshot';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('RunSnapshot', () => {
  it('round-trips a deterministic gameplay checkpoint from regenerated plan identity', () => {
    const run = generateRunSkeleton('SNAPSHOT-ROUNDTRIP');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    dispatchMissionEvent(run, session, { id: 'briefing', type: 'confirmBriefing' });
    dispatchMissionEvent(run, session, { id: 'entry', type: 'completeEntry' });
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'gameplay',
      label: 'Operation entry'
    });
    const restored = restoreRunSnapshot(importRunSnapshot(exportRunSnapshot(snapshot)));

    expect(restored.run).toEqual(run);
    expect(restored.contract).toEqual(contract);
    expect(restored.session).toEqual(session);
    expect(restored.session).not.toBe(session);
    expect(restored.snapshot.extensions).toEqual({
      carrier: { planId: run.carrierPlan.id },
      boarding: { planId: run.boardingCampaign.id },
      factionFronts: { planId: run.factionFronts.id },
      crewArcs: { planId: run.crewArcs.id },
      fleet: { planId: run.fleet.id },
      apex: { planId: run.apexHunts.id }
    });
    expect(createRunSnapshotSummary(snapshot)).toMatchObject({
      seed: 'SNAPSHOT-ROUNDTRIP',
      contractName: contract.shipName,
      sectorNumber: 1,
      target: 'gameplay'
    });
  });

  it('stores suspended mission state separately from permanent progression', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, 'permanent-save-sentinel');
    const run = generateRunSkeleton('SNAPSHOT-SUSPEND');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    dispatchMissionEvent(run, session, { id: 'briefing', type: 'confirmBriefing' });
    dispatchMissionEvent(run, session, { id: 'entry', type: 'completeEntry' });
    dispatchMissionEvent(run, session, { id: 'suspend', type: 'suspend' });
    const coordinator = new RunSnapshotCoordinator(storage);
    const snapshot = coordinator.checkpoint({
      run,
      contract,
      session,
      target: 'gameplay',
      label: 'Manual suspend'
    });

    expect(storage.getItem(RUN_SNAPSHOT_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('permanent-save-sentinel');
    expect(coordinator.load()).toMatchObject({ repaired: false, error: null });
    expect(coordinator.restore(snapshot).session.mission.status).toBe('suspended');
    coordinator.clear();
    expect(storage.getItem(RUN_SNAPSHOT_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('permanent-save-sentinel');
  });

  it('restores a settled operational-map checkpoint without replaying its payout', () => {
    const run = generateRunSkeleton('SNAPSHOT-OPERATIONAL-MAP');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    dispatchMissionEvent(run, session, { id: 'briefing', type: 'confirmBriefing' });
    dispatchMissionEvent(run, session, { id: 'entry', type: 'completeEntry' });
    dispatchMissionEvent(run, session, {
      id: 'advance-complete',
      type: 'completeCombat',
      checkpoint: {
        hull: 3,
        scrollDistance: 640,
        worldOffset: 10_640,
        credits: session.credits,
        salvage: session.salvage
      }
    });
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'operationalMap',
      label: 'Approach decision'
    });
    const restored = restoreRunSnapshot(snapshot);

    expect(restored.session).toEqual(session);
    expect(restored.session.mission.currentStageId).toContain('approach-map');
    expect(createRunSnapshotSummary(snapshot).target).toBe('operationalMap');
  });

  it('removes corrupt or unsupported snapshots without touching permanent save data', () => {
    for (const payload of ['{broken', JSON.stringify({ version: 999 })]) {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_STORAGE_KEY, 'permanent-save-sentinel');
      storage.setItem(RUN_SNAPSHOT_STORAGE_KEY, payload);
      const result = loadRunSnapshot(storage);
      expect(result.snapshot).toBeNull();
      expect(result.repaired).toBe(true);
      expect(result.error).toBeTruthy();
      expect(storage.getItem(RUN_SNAPSHOT_STORAGE_KEY)).toBeNull();
      expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('permanent-save-sentinel');
    }
  });

  it('retires a legacy v1 run snapshot without touching permanent progression', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, 'permanent-save-sentinel');
    storage.setItem(LEGACY_RUN_SNAPSHOT_STORAGE_KEY, '{"version":1}');
    const result = loadRunSnapshot(storage);

    expect(result).toMatchObject({ snapshot: null, repaired: true });
    expect(storage.getItem(LEGACY_RUN_SNAPSHOT_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('permanent-save-sentinel');
  });

  it('retires every pre-socket snapshot generation safely', () => {
    for (const key of LEGACY_RUN_SNAPSHOT_STORAGE_KEYS) {
      const storage = new MemoryStorage();
      storage.setItem(SAVE_STORAGE_KEY, 'permanent-save-sentinel');
      storage.setItem(key, '{"legacy":true}');
      expect(loadRunSnapshot(storage)).toMatchObject({ snapshot: null, repaired: true });
      expect(storage.getItem(key)).toBeNull();
      expect(storage.getItem(SAVE_STORAGE_KEY)).toBe('permanent-save-sentinel');
    }
  });

  it('rejects plan, contract, mission, and extension drift before restore', () => {
    const run = generateRunSkeleton('SNAPSHOT-DRIFT');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'sectorTransition',
      label: 'Briefing'
    });
    expect(() =>
      restoreRunSnapshot({ ...snapshot, plan: { ...snapshot.plan, graphId: 'bad' } })
    ).toThrow(/graph identity/);
    expect(() =>
      restoreRunSnapshot({ ...snapshot, plan: { ...snapshot.plan, contractId: 'missing' } })
    ).toThrow(/contract is unavailable/);
    expect(() =>
      restoreRunSnapshot({
        ...snapshot,
        session: {
          ...snapshot.session,
          mission: { ...snapshot.session.mission, currentStageId: 'missing' }
        }
      })
    ).toThrow(/mission stage history/);
    expect(() =>
      importRunSnapshot(
        JSON.stringify({
          ...snapshot,
          extensions: { ...snapshot.extensions, carrier: { id: 'too-early' } }
        })
      )
    ).toThrow(/carrier extension is invalid/);
  });

  it('rejects duplicate or ghost item socket assignments', () => {
    const run = generateRunSkeleton('SNAPSHOT-SOCKET-DRIFT');
    const contract = run.contracts[0]!;
    const snapshot = createRunSnapshot({
      run,
      contract,
      session: createRunSession(run, contract),
      target: 'sectorTransition',
      label: 'Socket circuit'
    });
    const firstSocket = snapshot.session.itemInstances[0]!.socket!;
    const duplicate = snapshot.session.itemInstances.map((item, index) =>
      index === 1 ? { ...item, socket: firstSocket } : item
    );
    const ghost = snapshot.session.itemInstances.map((item, index) =>
      index === 0
        ? { ...item, socket: { componentId: 'missing', socketIndex: 0, circuitOrder: 0 } }
        : item
    );

    expect(() =>
      restoreRunSnapshot({
        ...snapshot,
        session: { ...snapshot.session, itemInstances: duplicate }
      })
    ).toThrow(/item socket state/);
    expect(() =>
      restoreRunSnapshot({
        ...snapshot,
        session: { ...snapshot.session, itemInstances: ghost }
      })
    ).toThrow(/item socket state/);
  });

  it('enforces the snapshot byte budget and explicit storage helpers', () => {
    const storage = new MemoryStorage();
    const run = generateRunSkeleton('SNAPSHOT-STORAGE');
    const contract = run.contracts[0]!;
    const snapshot = createRunSnapshot({
      run,
      contract,
      session: createRunSession(run, contract),
      target: 'sectorTransition',
      label: 'Briefing'
    });
    writeRunSnapshot(storage, snapshot);
    expect(loadRunSnapshot(storage).snapshot).toEqual(snapshot);
    clearRunSnapshot(storage);
    expect(loadRunSnapshot(storage).snapshot).toBeNull();
    expect(() => importRunSnapshot('x'.repeat(RUN_SNAPSHOT_MAX_BYTES + 1))).toThrow(/exceeds/);
  });
});
