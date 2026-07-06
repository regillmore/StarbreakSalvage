import { describe, expect, it } from 'vitest';

import { SHIPS, type ShipAppearance, type ShipId } from '../../src/content/ships';
import {
  advancePlayerDestructionSequence,
  createPlayerDestructionSequence,
  getPlayerDestructionPresentation
} from '../../src/game/PlayerDestruction';

function getShipAppearance(shipId: ShipId): ShipAppearance {
  const ship = SHIPS.find((candidate) => candidate.id === shipId);

  if (!ship) {
    throw new Error(`Missing test ship ${shipId}`);
  }

  return ship.appearance;
}

describe('PlayerDestruction', () => {
  it('creates deterministic themed debris from the selected ship appearance', () => {
    const appearance = getShipAppearance('ship_debt_runner');
    const first = createPlayerDestructionSequence({
      shipName: 'Debt Runner',
      appearance,
      x: 320,
      y: 560,
      radius: 16,
      reducedMotion: false,
      performanceMode: false,
      bulletContrast: 'standard'
    });
    const second = createPlayerDestructionSequence({
      shipName: 'Debt Runner',
      appearance,
      x: 320,
      y: 560,
      radius: 16,
      reducedMotion: false,
      performanceMode: false,
      bulletContrast: 'standard'
    });

    expect(first.debris).toEqual(second.debris);
    expect(first.debris).toHaveLength(12);
    expect(first.colors.primary).toBe(appearance.primaryColor);
    expect(first.colors.cockpit).toBe(appearance.cockpitAccent);
    expect(first.silhouette).toBe(appearance.silhouette);
  });

  it('advances presentation state until the summary handoff point', () => {
    const state = createPlayerDestructionSequence({
      shipName: 'Debt Runner',
      appearance: getShipAppearance('ship_debt_runner'),
      x: 320,
      y: 560,
      radius: 16,
      reducedMotion: false,
      performanceMode: false,
      bulletContrast: 'standard'
    });

    expect(advancePlayerDestructionSequence(state, state.durationSeconds / 2)).toBe(false);

    const presentation = getPlayerDestructionPresentation(state);
    expect(presentation.progress).toBe(0.5);
    expect(presentation.transponderText).toBe('Debt Runner TRANSPONDER LOST');
    expect(presentation.debris[0]?.x).not.toBe(320);
    expect(presentation.shockwaveRadius).toBeGreaterThan(state.radius);

    expect(advancePlayerDestructionSequence(state, state.durationSeconds)).toBe(true);
    expect(getPlayerDestructionPresentation(state).progress).toBe(1);
  });

  it('reduces motion and palette complexity for accessibility and performance modes', () => {
    const appearance = getShipAppearance('ship_missile_accountant');
    const standard = createPlayerDestructionSequence({
      shipName: 'Missile Accountant',
      appearance,
      x: 320,
      y: 560,
      radius: 20,
      reducedMotion: false,
      performanceMode: false,
      bulletContrast: 'standard'
    });
    const reduced = createPlayerDestructionSequence({
      shipName: 'Missile Accountant',
      appearance,
      x: 320,
      y: 560,
      radius: 20,
      reducedMotion: true,
      performanceMode: false,
      bulletContrast: 'standard'
    });
    const performance = createPlayerDestructionSequence({
      shipName: 'Missile Accountant',
      appearance,
      x: 320,
      y: 560,
      radius: 20,
      reducedMotion: false,
      performanceMode: true,
      bulletContrast: 'standard'
    });
    const highContrast = createPlayerDestructionSequence({
      shipName: 'Missile Accountant',
      appearance,
      x: 320,
      y: 560,
      radius: 20,
      reducedMotion: false,
      performanceMode: false,
      bulletContrast: 'high'
    });

    expect(reduced.motionMode).toBe('reduced');
    expect(reduced.durationSeconds).toBeLessThan(standard.durationSeconds);
    expect(reduced.debris).toHaveLength(5);
    expect(performance.motionMode).toBe('performance');
    expect(performance.debris).toHaveLength(8);
    expect(highContrast.colors.primary).toBe('#f8fbff');
    expect(highContrast.colors.warning).toBe('#ffef5f');
  });
});
