export type FactionId =
  | 'faction_scrap_court'
  | 'faction_corporate_ledger'
  | 'faction_bloom_hive'
  | 'faction_void_corsairs';
export type FactionEnemyPattern = 'driftShot' | 'laneBurst' | 'sporeSpread' | 'phaseSkirmish';
export type FactionVisualShape = 'jagged' | 'diamond' | 'organic' | 'needle';

export interface FactionPalette {
  readonly hull: string;
  readonly trim: string;
  readonly projectile: string;
  readonly warning: string;
}

export interface FactionDefinition {
  readonly id: FactionId;
  readonly name: string;
  readonly summary: string;
  readonly enemyPattern: FactionEnemyPattern;
  readonly visualShape: FactionVisualShape;
  readonly palette: FactionPalette;
}

export const FACTIONS: readonly FactionDefinition[] = [
  {
    id: 'faction_scrap_court',
    name: 'Scrap Court',
    summary: 'wreck-looters that drift wide and throw heavy scrap shots',
    enemyPattern: 'driftShot',
    visualShape: 'jagged',
    palette: {
      hull: '#ff7a48',
      trim: '#ffd166',
      projectile: '#ffb347',
      warning: '#ffd166'
    }
  },
  {
    id: 'faction_corporate_ledger',
    name: 'Corporate Ledger',
    summary: 'audit drones that hold lanes and fire crisp paired bolts',
    enemyPattern: 'laneBurst',
    visualShape: 'diamond',
    palette: {
      hull: '#7cf7ff',
      trim: '#f8fbff',
      projectile: '#ff6bd6',
      warning: '#7cf7ff'
    }
  },
  {
    id: 'faction_bloom_hive',
    name: 'Bloom Hive',
    summary: 'bio-machines that sway and release small spore spreads',
    enemyPattern: 'sporeSpread',
    visualShape: 'organic',
    palette: {
      hull: '#87ff9a',
      trim: '#ff6bd6',
      projectile: '#b8ff5f',
      warning: '#87ff9a'
    }
  },
  {
    id: 'faction_void_corsairs',
    name: 'Void Corsairs',
    summary: 'phase raiders that skate sideways and fire crossing needle pairs',
    enemyPattern: 'phaseSkirmish',
    visualShape: 'needle',
    palette: {
      hull: '#b99cff',
      trim: '#f4f0ff',
      projectile: '#5fffd2',
      warning: '#d8c7ff'
    }
  }
];

export function getFactionById(id: FactionId): FactionDefinition {
  const faction = FACTIONS.find((candidate) => candidate.id === id);

  if (!faction) {
    throw new Error(`Unknown faction id: ${id}`);
  }

  return faction;
}
