import { describe, expect, it, vi } from 'vitest';

import type { CombatRunResult } from '../../src/game/CombatState';
import {
  advanceSectorExitSequence,
  createSectorExitSequence,
  getSectorExitPresentation,
  getSectorExitProgress
} from '../../src/game/SectorExitSequence';
import { GameplayScene } from '../../src/ui/GameplayScene';

describe('SectorExitSequence', () => {
  it('ignites, recenters, and accelerates the player ship beyond the top of the combat view', () => {
    const state = createSectorExitSequence({
      sectorName: 'Outer Debris Field',
      sectorIndex: 0,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false,
      playerX: 188,
      playerY: 570
    });

    const initial = getSectorExitPresentation(state);
    expect(initial.phase).toBe('ignition');
    expect(initial.shipX).toBe(188);
    expect(initial.shipY).toBe(570);
    expect(initial.transitionAlpha).toBe(0);

    expect(advanceSectorExitSequence(state, state.durationSeconds / 2)).toBe(false);
    expect(getSectorExitProgress(state)).toBe(0.5);

    const boost = getSectorExitPresentation(state);
    expect(boost.phase).toBe('boost');
    expect(boost.shipX).toBe(320);
    expect(boost.shipY).toBeLessThan(570);
    expect(boost.exhaustScale).toBeGreaterThan(1.5);
    expect(boost.speedLineAlpha).toBeGreaterThan(0);

    expect(advanceSectorExitSequence(state, state.durationSeconds)).toBe(true);
    const transitioned = getSectorExitPresentation(state);
    expect(transitioned.phase).toBe('transition');
    expect(transitioned.shipY).toBeLessThan(-100);
    expect(transitioned.shipAlpha).toBe(0);
    expect(transitioned.transitionAlpha).toBe(1);
  });

  it('recalls surviving allies and drones into formation before the whole wing departs', () => {
    const state = createSectorExitSequence({
      sectorName: 'Claimant Vault',
      sectorIndex: 2,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false,
      playerX: 198,
      playerY: 574,
      escorts: [
        { id: 'ally:quiet-knife', kind: 'ally', x: 132, y: 620, radius: 12 },
        { id: 'drone:choir-1', kind: 'drone', x: 238, y: 604, radius: 7 },
        { id: 'drone:choir-2', kind: 'drone', x: 404, y: 590, radius: 7 }
      ]
    });

    const initial = getSectorExitPresentation(state);
    expect(initial.phase).toBe('rendezvous');
    expect(initial.announcement).toBe('Claimant Vault clear. Recalling 1 ally and 2 drones.');
    expect(initial.escorts.map(({ x, y }) => [x, y])).toEqual([
      [132, 620],
      [238, 604],
      [404, 590]
    ]);

    advanceSectorExitSequence(state, state.durationSeconds * 0.3);
    const collected = getSectorExitPresentation(state);
    expect(collected.phase).toBe('ignition');
    expect(collected.shipX).toBe(320);
    expect(collected.shipY).toBe(500);
    expect(collected.escorts.map(({ x, y }) => [x, y])).toEqual([
      [290, 542],
      [350, 542],
      [262, 576]
    ]);
    expect(collected.announcement).toContain('Wing collected');

    advanceSectorExitSequence(state, state.durationSeconds * 0.3);
    const boost = getSectorExitPresentation(state);
    expect(boost.phase).toBe('boost');
    expect(boost.shipY).toBeLessThan(collected.shipY);
    expect(boost.escorts.every((escort) => escort.y > boost.shipY)).toBe(true);
    expect(boost.escorts.every((escort) => escort.thrust > 0.75)).toBe(true);

    advanceSectorExitSequence(state, state.durationSeconds);
    const transitioned = getSectorExitPresentation(state);
    expect(transitioned.phase).toBe('transition');
    expect(transitioned.shipAlpha).toBe(0);
    expect(transitioned.escorts.every((escort) => escort.alpha === 0)).toBe(true);
    expect(transitioned.escorts.every((escort) => escort.y < -100)).toBe(true);
  });

  it('keeps the debug shortcut fast but still runs the departure phases', () => {
    const normal = createSectorExitSequence({
      sectorName: 'Outer Debris Field',
      sectorIndex: 0,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false
    });
    const debug = createSectorExitSequence({
      sectorName: 'Outer Debris Field',
      sectorIndex: 0,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false,
      debugFast: true
    });

    expect(debug.durationSeconds).toBeLessThan(normal.durationSeconds);
    expect(advanceSectorExitSequence(debug, debug.durationSeconds * 0.5)).toBe(false);
    expect(getSectorExitPresentation(debug).phase).toBe('boost');
    expect(advanceSectorExitSequence(debug, debug.durationSeconds)).toBe(true);
    expect(getSectorExitPresentation(debug).phase).toBe('transition');
  });

  it('removes speed streaks and limits exhaust exaggeration for reduced motion', () => {
    const state = createSectorExitSequence({
      sectorName: 'Trade War Corridor',
      sectorIndex: 1,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: true
    });

    advanceSectorExitSequence(state, state.durationSeconds / 2);

    const presentation = getSectorExitPresentation(state);
    expect(presentation.phase).toBe('boost');
    expect(presentation.speedLineAlpha).toBe(0);
    expect(presentation.exhaustScale).toBe(1.35);
    expect(presentation.shipY).toBeLessThan(state.originY);
  });

  it('formats final-sector clearance for the run-summary transition', () => {
    const state = createSectorExitSequence({
      sectorName: 'Core Wreck Terminus',
      sectorIndex: 4,
      sectorCount: 5,
      reason: 'victory',
      reducedMotion: false
    });

    advanceSectorExitSequence(state, state.durationSeconds);

    const presentation = getSectorExitPresentation(state);
    expect(state.finalSector).toBe(true);
    expect(presentation.phase).toBe('transition');
    expect(presentation.announcement).toBe('Opening run summary.');
    expect(presentation.hint).toBe('Ship clear; opening run summary.');
  });

  it('latches the invisible terminal presentation through the scene handoff frame', () => {
    const sequence = createSectorExitSequence({
      sectorName: 'Trade War Corridor',
      sectorIndex: 1,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false
    });
    const result = { reason: 'sectorComplete' } as CombatRunResult;
    const onSectorComplete = vi.fn();
    const syncExitSequenceUi = vi.fn();
    const scene = Object.create(GameplayScene.prototype) as GameplayScene;
    Object.assign(scene, {
      exitSequence: sequence,
      exitSequenceResult: result,
      sectorCooldown: {},
      onSectorComplete,
      syncExitSequenceUi
    });
    const harness = scene as unknown as {
      exitSequence: typeof sequence | null;
      exitSequenceResult: CombatRunResult | null;
      sectorCooldown: unknown;
      finishSectorExitSequence(): void;
    };

    harness.finishSectorExitSequence();

    expect(harness.exitSequence).toBe(sequence);
    expect(harness.exitSequenceResult).toBeNull();
    expect(harness.sectorCooldown).toBeNull();
    expect(getSectorExitPresentation(harness.exitSequence!).shipAlpha).toBe(0);
    expect(getSectorExitPresentation(harness.exitSequence!).shipY).toBeLessThan(-100);
    expect(syncExitSequenceUi).toHaveBeenCalledOnce();
    expect(onSectorComplete).toHaveBeenCalledWith(result);
  });
});
