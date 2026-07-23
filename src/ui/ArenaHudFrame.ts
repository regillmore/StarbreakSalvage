import type { ShipHudThemeKey } from '../content/ships';
import type { ViewportClass, ViewportLayout } from '../app/ViewportLayout';

export type ArenaHudRailMode = 'side' | 'stacked';

export interface ArenaHudFrameModel {
  readonly themeKey: ShipHudThemeKey;
  readonly viewportClass: ViewportClass;
  readonly railMode: ArenaHudRailMode;
  readonly contractMark: string;
  readonly designation: string;
  readonly cssVariables: Readonly<Record<string, string>>;
}

const CONTRACT_FRAME_DIALECTS: Readonly<
  Record<ShipHudThemeKey, { readonly mark: string; readonly designation: string }>
> = {
  redline: { mark: '//', designation: 'PURSUIT VECTOR' },
  parish: { mark: '+', designation: 'CHOIR FORMATION' },
  ledger: { mark: '#', designation: 'ORDNANCE LEDGER' },
  phase: { mark: '<>', designation: 'PHASE WINDOW' },
  aegis: { mark: '[]', designation: 'IMPACT CITADEL' },
  scrap: { mark: '~', designation: 'SALVAGE MANDALA' },
  warranty: { mark: '!', designation: 'TEST ARTICLE' },
  relic: { mark: '*', designation: 'VAULT SIGHT' }
};

export function createArenaHudFrameModel(
  layout: Pick<ViewportLayout, 'gameplaySafeFrame' | 'viewportClass'>,
  themeKey: ShipHudThemeKey
): ArenaHudFrameModel {
  const frame = layout.gameplaySafeFrame;
  const dialect = CONTRACT_FRAME_DIALECTS[themeKey];

  return {
    themeKey,
    viewportClass: layout.viewportClass,
    railMode: layout.viewportClass === 'wide' ? 'side' : 'stacked',
    contractMark: dialect.mark,
    designation: dialect.designation,
    cssVariables: {
      '--arena-frame-x': `${frame.x}px`,
      '--arena-frame-y': `${frame.y}px`,
      '--arena-frame-width': `${frame.width}px`,
      '--arena-frame-height': `${frame.height}px`
    }
  };
}
