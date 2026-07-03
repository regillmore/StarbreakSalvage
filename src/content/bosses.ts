export type BossId =
  | 'boss_auditor_drone_xl'
  | 'boss_bloom_engine'
  | 'boss_unsold_missiles_carrier'
  | 'boss_warranty_void_seraph'
  | 'boss_core_wreck';

export interface BossDefinition {
  readonly id: BossId;
  readonly name: string;
}

export const BOSSES: readonly BossDefinition[] = [
  {
    id: 'boss_auditor_drone_xl',
    name: 'Auditor Drone XL'
  },
  {
    id: 'boss_bloom_engine',
    name: 'The Bloom Engine'
  },
  {
    id: 'boss_unsold_missiles_carrier',
    name: 'Carrier of Unsold Missiles'
  },
  {
    id: 'boss_warranty_void_seraph',
    name: 'Warranty Void Seraph'
  },
  {
    id: 'boss_core_wreck',
    name: 'The Core Wreck'
  }
];

export function getBossById(id: BossId): BossDefinition {
  const boss = BOSSES.find((candidate) => candidate.id === id);

  if (!boss) {
    throw new Error(`Unknown boss id: ${id}`);
  }

  return boss;
}
