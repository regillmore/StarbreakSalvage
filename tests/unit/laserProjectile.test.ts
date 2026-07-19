import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';
import { getWeaponById } from '../../src/content/weapons';
import { applyItemHooks } from '../../src/game/ItemHooks';
import {
  getLaserProjectileKind,
  getLaserProjectilePresentation
} from '../../src/game/LaserProjectile';
import { createWeaponProjectileBlueprints } from '../../src/game/WeaponProjectiles';
import { createFoundryAttackPreviewModel } from '../../src/ui/FoundryPresentation';

describe('laser projectile identity', () => {
  it('authors distinct needle, split, and beam profiles without changing projectile topology', () => {
    const needle = createWeaponProjectileBlueprints(getWeaponById('weapon_light_needle_laser'), {
      x: 100,
      y: 200,
      radius: 16
    });
    const split = createWeaponProjectileBlueprints(getWeaponById('weapon_needle_splitter'), {
      x: 100,
      y: 200,
      radius: 16
    });
    const beam = createWeaponProjectileBlueprints(getWeaponById('weapon_prototype_beam'), {
      x: 100,
      y: 200,
      radius: 16
    });

    expect(needle).toHaveLength(1);
    expect(needle[0]?.laserKind).toBe('needle');
    expect(split).toHaveLength(3);
    expect(split.every((projectile) => projectile.laserKind === 'split')).toBe(true);
    expect(beam).toHaveLength(1);
    expect(beam[0]?.laserKind).toBe('beam');
  });

  it('gives circuit-created lane and fork branches explicit inherited laser profiles', () => {
    const source = createWeaponProjectileBlueprints(getWeaponById('weapon_pulse_cannon'), {
      x: 100,
      y: 200,
      radius: 16
    });
    const laneVolley = applyItemHooks(
      'onFire',
      [{ itemId: 'item_lane_splitter_chisel', acquisitionOrder: 0 }],
      { volleyIndex: 6, projectiles: source }
    );
    const forkVolley = applyItemHooks(
      'onFire',
      [{ itemId: 'item_harmonic_fork_loom', acquisitionOrder: 0 }],
      { volleyIndex: 3, projectiles: source }
    );

    expect(
      laneVolley.projectiles.filter((projectile) => projectile.laserKind === 'lane')
    ).toHaveLength(2);
    expect(
      forkVolley.projectiles.filter((projectile) => projectile.laserKind === 'fork')
    ).toHaveLength(2);
    expect(
      laneVolley.projectiles
        .filter((projectile) => projectile.laserKind === 'lane')
        .every((projectile) => projectile.tags.includes('laser'))
    ).toBe(true);
  });

  it('derives bounded velocity-aligned geometry with a longer prototype beam body', () => {
    const needle = getLaserProjectilePresentation({
      ageSeconds: 0.15,
      radius: 4,
      vx: 90,
      vy: -760,
      kind: 'needle'
    });
    const beam = getLaserProjectilePresentation({
      ageSeconds: 0.15,
      radius: 5,
      vx: 0,
      vy: -920,
      kind: 'beam'
    });

    expect(getLaserProjectileKind(['laser', 'phase'])).toBe('needle');
    expect(getLaserProjectileKind(['plasma'])).toBeNull();
    expect(needle.headingRadians).toBeCloseTo(Math.atan2(90, 760));
    expect(beam.coreLength).toBeGreaterThan(needle.coreLength * 1.8);
    expect(beam.wakeLength).toBeGreaterThan(needle.wakeLength);
    expect(beam.pulse).toBeGreaterThanOrEqual(0.7);
    expect(beam.pulse).toBeLessThanOrEqual(0.94);
  });

  it('renders the authored profile as a directional luminous body with optional arc charge', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 190,
      y: 320,
      vx: 70,
      vy: -820,
      radius: 4,
      owner: 'player',
      tags: ['laser', 'arc'],
      laserKind: 'fork',
      ageSeconds: 0.18
    });

    expect(context.translate).toHaveBeenCalledWith(190, 320);
    expect(context.rotate).toHaveBeenCalledWith(Math.atan2(70, 820));
    expect(context.lineTo.mock.calls.length).toBeGreaterThanOrEqual(7);
    expect(context.quadraticCurveTo).toHaveBeenCalledOnce();
    expect(context.fill).toHaveBeenCalledOnce();
    expect(context.arc).not.toHaveBeenCalled();
  });

  it('exposes laser profiles and their directional cue to shared live-fire previews', () => {
    const beam = createWeaponProjectileBlueprints(getWeaponById('weapon_prototype_beam'), {
      x: 0,
      y: 0,
      radius: 0
    });
    const preview = createFoundryAttackPreviewModel('Prototype Beam', 0.2, beam);

    expect(preview.projectiles[0]?.laserKind).toBe('beam');
    expect(preview.ariaLabel).toContain('velocity-aligned luminous bodies');
    expect(preview.ariaLabel).toContain('active profiles: beam');
  });
});

function createRenderer(context: ReturnType<typeof createContext>): CanvasRenderer {
  const renderer = Object.create(CanvasRenderer.prototype) as CanvasRenderer;
  const settings: RendererSettings = {
    reducedMotion: false,
    screenShake: 0.35,
    bulletContrast: 'standard',
    performanceMode: false
  };
  Object.assign(renderer, { context, settings });
  return renderer;
}

function createContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
    globalAlpha: 1
  };
}
