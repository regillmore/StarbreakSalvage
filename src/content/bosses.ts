import type { FactionId } from './factions';

export type BossId =
  | 'boss_auditor_drone_xl'
  | 'boss_bloom_engine'
  | 'boss_unsold_missiles_carrier'
  | 'boss_warranty_void_seraph'
  | 'boss_core_wreck';

export type BossPatternId = 'auditFan' | 'missileCurtain' | 'sporeSpiral';

export interface BossDefinition {
  readonly id: BossId;
  readonly name: string;
  readonly factionId: FactionId;
  readonly patternId: BossPatternId;
  readonly maxHull: number;
  readonly radius: number;
  readonly telegraphSeconds: number;
  readonly attackCadenceSeconds: number;
  readonly warningLabel: string;
}

export const BOSSES: readonly BossDefinition[] = [
  {
    id: 'boss_auditor_drone_xl',
    name: 'Auditor Drone XL',
    factionId: 'faction_corporate_ledger',
    patternId: 'auditFan',
    maxHull: 18,
    radius: 46,
    telegraphSeconds: 0.62,
    attackCadenceSeconds: 1.55,
    warningLabel: 'AUDIT FAN'
  },
  {
    id: 'boss_bloom_engine',
    name: 'The Bloom Engine',
    factionId: 'faction_bloom_hive',
    patternId: 'sporeSpiral',
    maxHull: 20,
    radius: 50,
    telegraphSeconds: 0.7,
    attackCadenceSeconds: 1.35,
    warningLabel: 'SPORE RING'
  },
  {
    id: 'boss_unsold_missiles_carrier',
    name: 'Carrier of Unsold Missiles',
    factionId: 'faction_scrap_court',
    patternId: 'missileCurtain',
    maxHull: 22,
    radius: 52,
    telegraphSeconds: 0.78,
    attackCadenceSeconds: 1.85,
    warningLabel: 'MISSILE LANES'
  },
  {
    id: 'boss_warranty_void_seraph',
    name: 'Warranty Void Seraph',
    factionId: 'faction_corporate_ledger',
    patternId: 'auditFan',
    maxHull: 24,
    radius: 54,
    telegraphSeconds: 0.58,
    attackCadenceSeconds: 1.3,
    warningLabel: 'VOID AUDIT'
  },
  {
    id: 'boss_core_wreck',
    name: 'The Core Wreck',
    factionId: 'faction_scrap_court',
    patternId: 'missileCurtain',
    maxHull: 30,
    radius: 60,
    telegraphSeconds: 0.72,
    attackCadenceSeconds: 1.45,
    warningLabel: 'CORE SALVO'
  }
];

export function getBossById(id: BossId): BossDefinition {
  const boss = BOSSES.find((candidate) => candidate.id === id);

  if (!boss) {
    throw new Error(`Unknown boss id: ${id}`);
  }

  return boss;
}
