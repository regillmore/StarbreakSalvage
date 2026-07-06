import type { BossId } from './bosses';
import type { BackgroundId } from './backgrounds';

export type SectorId =
  | 'sector_outer_debris_field'
  | 'sector_trade_war_corridor'
  | 'sector_bio_machine_bloom'
  | 'sector_corporate_kill_grid'
  | 'sector_lunar_surface'
  | 'sector_core_wreck';

export type SectorObjectiveKind = 'clearWaves' | 'defeatBoss';

export interface SectorObjectiveDefinition {
  readonly kind: SectorObjectiveKind;
  readonly label: string;
  readonly waveCount: number;
  readonly spawnsPerWave: number;
  readonly bossGate: boolean;
}

export interface SectorDefinition {
  readonly id: SectorId;
  readonly name: string;
  readonly role: string;
  readonly backgroundId: BackgroundId;
  readonly bossCandidates: readonly BossId[];
  readonly majorWavePool: readonly string[];
  readonly objective: SectorObjectiveDefinition;
}

export const SECTORS: readonly SectorDefinition[] = [
  {
    id: 'sector_outer_debris_field',
    name: 'Outer Debris Field',
    role: 'intro',
    backgroundId: 'background_outer_debris_field',
    bossCandidates: ['boss_auditor_drone_xl', 'boss_unsold_missiles_carrier'],
    majorWavePool: ['wreck_gnat_swarm', 'mine_drift', 'salvage_thief_dive', 'turret_scrap_lane'],
    objective: {
      kind: 'clearWaves',
      label: 'Clear debris waves',
      waveCount: 2,
      spawnsPerWave: 1,
      bossGate: false
    }
  },
  {
    id: 'sector_trade_war_corridor',
    name: 'Trade War Corridor',
    role: 'economy and shields',
    backgroundId: 'background_trade_war_corridor',
    bossCandidates: ['boss_unsold_missiles_carrier', 'boss_auditor_drone_xl'],
    majorWavePool: [
      'convoy_crossfire',
      'shield_barge_wall',
      'barcode_turret_lane',
      'credit_minefield'
    ],
    objective: {
      kind: 'clearWaves',
      label: 'Break the convoy screen',
      waveCount: 2,
      spawnsPerWave: 2,
      bossGate: false
    }
  },
  {
    id: 'sector_bio_machine_bloom',
    name: 'Bio-Machine Bloom',
    role: 'organic patterns and corrosion',
    backgroundId: 'background_bio_machine_bloom',
    bossCandidates: ['boss_bloom_engine', 'boss_warranty_void_seraph'],
    majorWavePool: ['spore_spiral', 'regenerator_pods', 'corrosion_pools', 'bloom_lattice'],
    objective: {
      kind: 'clearWaves',
      label: 'Cut through the bloom',
      waveCount: 3,
      spawnsPerWave: 2,
      bossGate: false
    }
  },
  {
    id: 'sector_corporate_kill_grid',
    name: 'Corporate Kill Grid',
    role: 'lasers, drones, elites',
    backgroundId: 'background_corporate_kill_grid',
    bossCandidates: ['boss_warranty_void_seraph', 'boss_auditor_drone_xl'],
    majorWavePool: ['beam_warning_grid', 'drone_lockstep', 'mine_checkerboard', 'elite_laser_fan'],
    objective: {
      kind: 'defeatBoss',
      label: 'Break the kill-grid overseer',
      waveCount: 3,
      spawnsPerWave: 2,
      bossGate: true
    }
  },
  {
    id: 'sector_lunar_surface',
    name: 'Lunar Surface',
    role: 'low-altitude terrain and surface shadows',
    backgroundId: 'background_lunar_surface',
    bossCandidates: ['boss_unsold_missiles_carrier', 'boss_warranty_void_seraph'],
    majorWavePool: [
      'crater_skim_patrol',
      'ridge_shadow_intercept',
      'surface_array_crossfire',
      'low_orbit_debris'
    ],
    objective: {
      kind: 'clearWaves',
      label: 'Skim the lunar salvage lane',
      waveCount: 3,
      spawnsPerWave: 2,
      bossGate: false
    }
  },
  {
    id: 'sector_core_wreck',
    name: 'The Core Wreck',
    role: 'final exam',
    backgroundId: 'background_core_wreck',
    bossCandidates: ['boss_core_wreck'],
    majorWavePool: [
      'mixed_faction_storm',
      'unstable_relic_front',
      'final_scrap_curtain',
      'core_lockdown'
    ],
    objective: {
      kind: 'defeatBoss',
      label: 'Defeat the Core Wreck',
      waveCount: 3,
      spawnsPerWave: 3,
      bossGate: true
    }
  }
];
