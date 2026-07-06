export type BackgroundId =
  | 'background_outer_debris_field'
  | 'background_trade_war_corridor'
  | 'background_bio_machine_bloom'
  | 'background_corporate_kill_grid'
  | 'background_lunar_surface'
  | 'background_core_wreck';

export type BackgroundLayerKind =
  | 'deepStars'
  | 'dust'
  | 'debris'
  | 'wreckPlates'
  | 'tradeRails'
  | 'signalTicks'
  | 'bloomSpores'
  | 'bloomStrands'
  | 'killGrid'
  | 'warningRails'
  | 'lunarRidges'
  | 'craterRims'
  | 'surfaceTowers'
  | 'wreckShadows'
  | 'coreFractures'
  | 'reactorEmbers';

export interface BackgroundPalette {
  readonly top: string;
  readonly middle: string;
  readonly bottom: string;
  readonly glow: string;
}

export interface BackgroundLayerDefinition {
  readonly id: string;
  readonly kind: BackgroundLayerKind;
  readonly color: string;
  readonly accentColor?: string;
  readonly alpha: number;
  readonly parallax: number;
  readonly density: number;
  readonly priority: 1 | 2 | 3;
}

export interface BackgroundDefinition {
  readonly id: BackgroundId;
  readonly name: string;
  readonly palette: BackgroundPalette;
  readonly layers: readonly BackgroundLayerDefinition[];
}

export const BACKGROUND_LAYER_KINDS: readonly BackgroundLayerKind[] = [
  'deepStars',
  'dust',
  'debris',
  'wreckPlates',
  'tradeRails',
  'signalTicks',
  'bloomSpores',
  'bloomStrands',
  'killGrid',
  'warningRails',
  'lunarRidges',
  'craterRims',
  'surfaceTowers',
  'wreckShadows',
  'coreFractures',
  'reactorEmbers'
];

export const BACKGROUNDS: readonly BackgroundDefinition[] = [
  {
    id: 'background_outer_debris_field',
    name: 'Outer Debris Field',
    palette: {
      top: '#030713',
      middle: '#111827',
      bottom: '#24151e',
      glow: 'rgba(124, 247, 255, 0.14)'
    },
    layers: [
      {
        id: 'distant-cold-stars',
        kind: 'deepStars',
        color: '#f8fbff',
        accentColor: '#7cf7ff',
        alpha: 0.72,
        parallax: 0.12,
        density: 82,
        priority: 1
      },
      {
        id: 'powdered-scrap-dust',
        kind: 'dust',
        color: '#7cf7ff',
        accentColor: '#ffd166',
        alpha: 0.34,
        parallax: 0.28,
        density: 54,
        priority: 2
      },
      {
        id: 'slow-wreck-shards',
        kind: 'debris',
        color: '#8aa4b8',
        accentColor: '#ff6bd6',
        alpha: 0.3,
        parallax: 0.55,
        density: 34,
        priority: 2
      },
      {
        id: 'near-hull-plates',
        kind: 'wreckPlates',
        color: '#263247',
        accentColor: '#ffd166',
        alpha: 0.28,
        parallax: 0.9,
        density: 12,
        priority: 3
      }
    ]
  },
  {
    id: 'background_trade_war_corridor',
    name: 'Trade War Corridor',
    palette: {
      top: '#050713',
      middle: '#161528',
      bottom: '#1f1d12',
      glow: 'rgba(255, 209, 102, 0.13)'
    },
    layers: [
      {
        id: 'ledger-star-noise',
        kind: 'deepStars',
        color: '#f8fbff',
        accentColor: '#ffd166',
        alpha: 0.62,
        parallax: 0.1,
        density: 68,
        priority: 1
      },
      {
        id: 'convoy-vector-rails',
        kind: 'tradeRails',
        color: '#4b5f75',
        accentColor: '#ffd166',
        alpha: 0.28,
        parallax: 0.32,
        density: 16,
        priority: 1
      },
      {
        id: 'market-signal-ticks',
        kind: 'signalTicks',
        color: '#ffd166',
        accentColor: '#7cf7ff',
        alpha: 0.3,
        parallax: 0.58,
        density: 44,
        priority: 2
      },
      {
        id: 'discarded-cargo-splinters',
        kind: 'debris',
        color: '#9a8f73',
        accentColor: '#ff6bd6',
        alpha: 0.22,
        parallax: 0.84,
        density: 24,
        priority: 3
      }
    ]
  },
  {
    id: 'background_bio_machine_bloom',
    name: 'Bio-Machine Bloom',
    palette: {
      top: '#06100e',
      middle: '#132018',
      bottom: '#251124',
      glow: 'rgba(255, 107, 214, 0.14)'
    },
    layers: [
      {
        id: 'wet-dark-stars',
        kind: 'deepStars',
        color: '#dfffee',
        accentColor: '#ff6bd6',
        alpha: 0.46,
        parallax: 0.1,
        density: 58,
        priority: 1
      },
      {
        id: 'distant-spore-cloud',
        kind: 'bloomSpores',
        color: '#5effa8',
        accentColor: '#ff6bd6',
        alpha: 0.24,
        parallax: 0.25,
        density: 34,
        priority: 1
      },
      {
        id: 'coral-data-strands',
        kind: 'bloomStrands',
        color: '#7cf7ff',
        accentColor: '#ff6bd6',
        alpha: 0.26,
        parallax: 0.5,
        density: 26,
        priority: 2
      },
      {
        id: 'near-pod-spores',
        kind: 'bloomSpores',
        color: '#baff7c',
        accentColor: '#ffd166',
        alpha: 0.2,
        parallax: 0.82,
        density: 18,
        priority: 3
      }
    ]
  },
  {
    id: 'background_corporate_kill_grid',
    name: 'Corporate Kill Grid',
    palette: {
      top: '#040815',
      middle: '#10132a',
      bottom: '#201225',
      glow: 'rgba(124, 247, 255, 0.1)'
    },
    layers: [
      {
        id: 'auditor-pin-stars',
        kind: 'deepStars',
        color: '#f8fbff',
        accentColor: '#7cf7ff',
        alpha: 0.52,
        parallax: 0.08,
        density: 56,
        priority: 1
      },
      {
        id: 'distant-kill-grid',
        kind: 'killGrid',
        color: '#274d66',
        accentColor: '#7cf7ff',
        alpha: 0.24,
        parallax: 0.24,
        density: 34,
        priority: 1
      },
      {
        id: 'warning-laser-rails',
        kind: 'warningRails',
        color: '#ff6bd6',
        accentColor: '#ffd166',
        alpha: 0.22,
        parallax: 0.52,
        density: 18,
        priority: 2
      },
      {
        id: 'barcode-scan-ticks',
        kind: 'signalTicks',
        color: '#7cf7ff',
        accentColor: '#f8fbff',
        alpha: 0.24,
        parallax: 0.78,
        density: 42,
        priority: 3
      }
    ]
  },
  {
    id: 'background_lunar_surface',
    name: 'Lunar Surface',
    palette: {
      top: '#040713',
      middle: '#111626',
      bottom: '#1b1f26',
      glow: 'rgba(226, 238, 255, 0.11)'
    },
    layers: [
      {
        id: 'thin-orbit-stars',
        kind: 'deepStars',
        color: '#f8fbff',
        accentColor: '#b8d9ff',
        alpha: 0.44,
        parallax: 0.08,
        density: 52,
        priority: 1
      },
      {
        id: 'distant-crater-rims',
        kind: 'craterRims',
        color: '#5c6773',
        accentColor: '#b8d9ff',
        alpha: 0.24,
        parallax: 0.28,
        density: 28,
        priority: 1
      },
      {
        id: 'low-ridge-parallax',
        kind: 'lunarRidges',
        color: '#6f7987',
        accentColor: '#d7e5ff',
        alpha: 0.2,
        parallax: 0.58,
        density: 24,
        priority: 2
      },
      {
        id: 'surface-array-shadows',
        kind: 'surfaceTowers',
        color: '#2c3542',
        accentColor: '#7cf7ff',
        alpha: 0.18,
        parallax: 0.82,
        density: 16,
        priority: 2
      },
      {
        id: 'near-wreck-shadows',
        kind: 'wreckShadows',
        color: '#181d25',
        accentColor: '#ffd166',
        alpha: 0.16,
        parallax: 1.02,
        density: 12,
        priority: 3
      }
    ]
  },
  {
    id: 'background_core_wreck',
    name: 'The Core Wreck',
    palette: {
      top: '#06040d',
      middle: '#1a0f17',
      bottom: '#271812',
      glow: 'rgba(255, 209, 102, 0.12)'
    },
    layers: [
      {
        id: 'reactor-ash-stars',
        kind: 'deepStars',
        color: '#ffe8b5',
        accentColor: '#f8fbff',
        alpha: 0.46,
        parallax: 0.08,
        density: 48,
        priority: 1
      },
      {
        id: 'distant-core-fractures',
        kind: 'coreFractures',
        color: '#5b3042',
        accentColor: '#ffd166',
        alpha: 0.3,
        parallax: 0.24,
        density: 20,
        priority: 1
      },
      {
        id: 'reactor-ember-fall',
        kind: 'reactorEmbers',
        color: '#ffd166',
        accentColor: '#ff6bd6',
        alpha: 0.28,
        parallax: 0.56,
        density: 42,
        priority: 2
      },
      {
        id: 'near-broken-ribs',
        kind: 'coreFractures',
        color: '#322033',
        accentColor: '#7cf7ff',
        alpha: 0.24,
        parallax: 0.9,
        density: 16,
        priority: 3
      }
    ]
  }
];

export function getBackgroundById(id: BackgroundId): BackgroundDefinition {
  const background = BACKGROUNDS.find((candidate) => candidate.id === id);

  if (!background) {
    throw new Error(`Unknown background: ${id}`);
  }

  return background;
}
