import type { BossId } from './bosses';

export type SectorId =
  | 'sector_outer_debris_field'
  | 'sector_trade_war_corridor'
  | 'sector_bio_machine_bloom'
  | 'sector_corporate_kill_grid'
  | 'sector_core_wreck';

export interface SectorDefinition {
  readonly id: SectorId;
  readonly name: string;
  readonly role: string;
  readonly bossCandidates: readonly BossId[];
  readonly majorWavePool: readonly string[];
}

export const SECTORS: readonly SectorDefinition[] = [
  {
    id: 'sector_outer_debris_field',
    name: 'Outer Debris Field',
    role: 'intro',
    bossCandidates: ['boss_auditor_drone_xl', 'boss_unsold_missiles_carrier'],
    majorWavePool: ['wreck_gnat_swarm', 'mine_drift', 'salvage_thief_dive', 'turret_scrap_lane']
  },
  {
    id: 'sector_trade_war_corridor',
    name: 'Trade War Corridor',
    role: 'economy and shields',
    bossCandidates: ['boss_unsold_missiles_carrier', 'boss_auditor_drone_xl'],
    majorWavePool: ['convoy_crossfire', 'shield_barge_wall', 'barcode_turret_lane', 'credit_minefield']
  },
  {
    id: 'sector_bio_machine_bloom',
    name: 'Bio-Machine Bloom',
    role: 'organic patterns and corrosion',
    bossCandidates: ['boss_bloom_engine', 'boss_warranty_void_seraph'],
    majorWavePool: ['spore_spiral', 'regenerator_pods', 'corrosion_pools', 'bloom_lattice']
  },
  {
    id: 'sector_corporate_kill_grid',
    name: 'Corporate Kill Grid',
    role: 'lasers, drones, elites',
    bossCandidates: ['boss_warranty_void_seraph', 'boss_auditor_drone_xl'],
    majorWavePool: ['beam_warning_grid', 'drone_lockstep', 'mine_checkerboard', 'elite_laser_fan']
  },
  {
    id: 'sector_core_wreck',
    name: 'The Core Wreck',
    role: 'final exam',
    bossCandidates: ['boss_core_wreck'],
    majorWavePool: ['mixed_faction_storm', 'unstable_relic_front', 'final_scrap_curtain', 'core_lockdown']
  }
];
