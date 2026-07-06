import { describe, expect, it } from 'vitest';

import {
  advanceSectorExitSequence,
  createSectorExitSequence,
  getSectorExitPresentation,
  getSectorExitProgress
} from '../../src/game/SectorExitSequence';

describe('SectorExitSequence', () => {
  it('advances a normal sector exit beat before completion', () => {
    const state = createSectorExitSequence({
      sectorName: 'Outer Debris Field',
      sectorIndex: 0,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: false
    });

    expect(state.durationSeconds).toBeGreaterThan(1);
    expect(advanceSectorExitSequence(state, state.durationSeconds / 2)).toBe(false);
    expect(getSectorExitProgress(state)).toBe(0.5);

    const presentation = getSectorExitPresentation(state);
    expect(presentation.title).toBe('Sector exit beacon locked');
    expect(presentation.toast).toBe('Outer Debris Field clear | route telemetry 50%');
    expect(presentation.motion).toBe('corridor');
    expect(presentation.corridorAlpha).toBeGreaterThan(0);

    expect(advanceSectorExitSequence(state, state.durationSeconds)).toBe(true);
    expect(getSectorExitProgress(state)).toBe(1);
  });

  it('keeps the debug shortcut fast but still visible', () => {
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
    expect(advanceSectorExitSequence(debug, debug.durationSeconds - 0.01)).toBe(false);
    expect(advanceSectorExitSequence(debug, 0.02)).toBe(true);
  });

  it('uses a static reduced-motion presentation', () => {
    const state = createSectorExitSequence({
      sectorName: 'Trade War Corridor',
      sectorIndex: 1,
      sectorCount: 5,
      reason: 'sectorComplete',
      reducedMotion: true
    });

    advanceSectorExitSequence(state, state.durationSeconds / 2);

    const presentation = getSectorExitPresentation(state);
    expect(presentation.motion).toBe('static');
    expect(presentation.corridorAlpha).toBe(0);
    expect(presentation.pulseScale).toBe(1);
  });

  it('formats final-sector completion as a summary uplink', () => {
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
    expect(presentation.title).toBe('Final exit beacon locked');
    expect(presentation.toast).toBe('Core Wreck Terminus clear | summary uplink 100%');
  });
});
