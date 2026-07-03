import type { FactionId } from './factions';

export type BossId =
  | 'boss_auditor_drone_xl'
  | 'boss_bloom_engine'
  | 'boss_unsold_missiles_carrier'
  | 'boss_warranty_void_seraph'
  | 'boss_core_wreck';

export type BossPatternId = 'auditFan' | 'missileCurtain' | 'sporeSpiral';

export interface BossPhaseDefinition {
  readonly label: string;
  readonly startsAtHullRatio: number;
  readonly attackCadenceMultiplier: number;
  readonly telegraphMultiplier: number;
  readonly projectileBudgetMultiplier: number;
  readonly patternSequence: readonly BossPatternId[];
  readonly warningLabel: string;
}

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
  readonly phases: readonly BossPhaseDefinition[];
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
    warningLabel: 'AUDIT FAN',
    phases: [
      {
        label: 'Compliance Sweep',
        startsAtHullRatio: 1,
        attackCadenceMultiplier: 1,
        telegraphMultiplier: 1,
        projectileBudgetMultiplier: 1,
        patternSequence: ['auditFan'],
        warningLabel: 'AUDIT FAN'
      },
      {
        label: 'Expedited Audit',
        startsAtHullRatio: 0.55,
        attackCadenceMultiplier: 0.86,
        telegraphMultiplier: 1.05,
        projectileBudgetMultiplier: 1.08,
        patternSequence: ['auditFan', 'missileCurtain'],
        warningLabel: 'EXPEDITED AUDIT'
      }
    ]
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
    warningLabel: 'SPORE RING',
    phases: [
      {
        label: 'Root Bloom',
        startsAtHullRatio: 1,
        attackCadenceMultiplier: 1,
        telegraphMultiplier: 1,
        projectileBudgetMultiplier: 1,
        patternSequence: ['sporeSpiral'],
        warningLabel: 'SPORE RING'
      },
      {
        label: 'Pollination Spiral',
        startsAtHullRatio: 0.55,
        attackCadenceMultiplier: 0.88,
        telegraphMultiplier: 1.05,
        projectileBudgetMultiplier: 1.1,
        patternSequence: ['sporeSpiral', 'auditFan'],
        warningLabel: 'POLLEN SURGE'
      }
    ]
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
    warningLabel: 'MISSILE LANES',
    phases: [
      {
        label: 'Launch Queue',
        startsAtHullRatio: 1,
        attackCadenceMultiplier: 1,
        telegraphMultiplier: 1,
        projectileBudgetMultiplier: 1,
        patternSequence: ['missileCurtain'],
        warningLabel: 'MISSILE LANES'
      },
      {
        label: 'Clearance Salvo',
        startsAtHullRatio: 0.58,
        attackCadenceMultiplier: 0.82,
        telegraphMultiplier: 1.08,
        projectileBudgetMultiplier: 1.25,
        patternSequence: ['missileCurtain', 'auditFan'],
        warningLabel: 'FINAL INVENTORY'
      }
    ]
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
    warningLabel: 'VOID AUDIT',
    phases: [
      {
        label: 'Void Ledger',
        startsAtHullRatio: 1,
        attackCadenceMultiplier: 1,
        telegraphMultiplier: 1,
        projectileBudgetMultiplier: 1,
        patternSequence: ['auditFan'],
        warningLabel: 'VOID AUDIT'
      },
      {
        label: 'Clause Collapse',
        startsAtHullRatio: 0.62,
        attackCadenceMultiplier: 0.86,
        telegraphMultiplier: 1.1,
        projectileBudgetMultiplier: 1.12,
        patternSequence: ['auditFan', 'sporeSpiral'],
        warningLabel: 'CLAUSE COLLAPSE'
      },
      {
        label: 'Null Signature',
        startsAtHullRatio: 0.3,
        attackCadenceMultiplier: 0.78,
        telegraphMultiplier: 1.15,
        projectileBudgetMultiplier: 1.16,
        patternSequence: ['sporeSpiral', 'auditFan', 'missileCurtain'],
        warningLabel: 'NULL SIGNATURE'
      }
    ]
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
    warningLabel: 'CORE SALVO',
    phases: [
      {
        label: 'Outer Hull',
        startsAtHullRatio: 1,
        attackCadenceMultiplier: 1,
        telegraphMultiplier: 1,
        projectileBudgetMultiplier: 1,
        patternSequence: ['missileCurtain'],
        warningLabel: 'CORE SALVO'
      },
      {
        label: 'Reactor Breach',
        startsAtHullRatio: 0.66,
        attackCadenceMultiplier: 0.88,
        telegraphMultiplier: 1.08,
        projectileBudgetMultiplier: 1.22,
        patternSequence: ['missileCurtain', 'auditFan'],
        warningLabel: 'REACTOR BREACH'
      },
      {
        label: 'Core Unsealed',
        startsAtHullRatio: 0.32,
        attackCadenceMultiplier: 0.78,
        telegraphMultiplier: 1.12,
        projectileBudgetMultiplier: 1.18,
        patternSequence: ['sporeSpiral', 'missileCurtain', 'auditFan'],
        warningLabel: 'CORE UNSEALED'
      }
    ]
  }
];

export function getBossById(id: BossId): BossDefinition {
  const boss = BOSSES.find((candidate) => candidate.id === id);

  if (!boss) {
    throw new Error(`Unknown boss id: ${id}`);
  }

  return boss;
}
