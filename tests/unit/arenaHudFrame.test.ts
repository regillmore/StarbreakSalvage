import { describe, expect, it } from 'vitest';

import { calculateViewportLayout } from '../../src/app/ViewportLayout';
import type { ShipHudThemeKey } from '../../src/content/ships';
import { createArenaHudFrameModel } from '../../src/ui/ArenaHudFrame';

describe('ArenaHudFrame', () => {
  it('anchors a wide contract frame to the exact gameplay safe frame', () => {
    const layout = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });
    const model = createArenaHudFrameModel(layout, 'ledger');

    expect(model).toMatchObject({
      themeKey: 'ledger',
      viewportClass: 'wide',
      railMode: 'side',
      contractMark: '#',
      designation: 'ORDNANCE LEDGER'
    });
    expect(model.cssVariables).toEqual({
      '--arena-frame-x': '381px',
      '--arena-frame-y': '94px',
      '--arena-frame-width': '519px',
      '--arena-frame-height': '584px'
    });
  });

  it('stacks arena rails when the viewport does not provide side-console room', () => {
    const standard = createArenaHudFrameModel(
      calculateViewportLayout({ width: 768, height: 1024, dpr: 1 }),
      'parish'
    );
    const narrow = createArenaHudFrameModel(
      calculateViewportLayout({ width: 390, height: 700, dpr: 1 }),
      'phase'
    );

    expect(standard.railMode).toBe('stacked');
    expect(narrow.railMode).toBe('stacked');
    expect(narrow.cssVariables).toMatchObject({
      '--arena-frame-x': '14px',
      '--arena-frame-y': '204px',
      '--arena-frame-width': '362px',
      '--arena-frame-height': '407px'
    });
  });

  it('gives every contract HUD theme its own frame dialect', () => {
    const themes: readonly ShipHudThemeKey[] = [
      'redline',
      'parish',
      'ledger',
      'phase',
      'aegis',
      'scrap',
      'warranty',
      'relic'
    ];
    const layout = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });
    const models = themes.map((theme) => createArenaHudFrameModel(layout, theme));

    expect(new Set(models.map((model) => model.designation)).size).toBe(themes.length);
    expect(models.map((model) => model.themeKey)).toEqual(themes);
  });
});
