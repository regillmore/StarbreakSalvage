import type { FactionId } from './factions';

export type BossId =
  | 'boss_auditor_drone_xl'
  | 'boss_bloom_engine'
  | 'boss_unsold_missiles_carrier'
  | 'boss_warranty_void_seraph'
  | 'boss_core_wreck'
  | 'boss_prism_regent'
  | 'boss_mass_cantor'
  | 'boss_horizon_leviathan'
  | 'boss_grave_choir'
  | 'boss_crownless_engine'
  | 'boss_pale_convoy';

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
    maxHull: 80,
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
    maxHull: 86,
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
    maxHull: 92,
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
    factionId: 'faction_void_corsairs',
    patternId: 'auditFan',
    maxHull: 105,
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
    maxHull: 125,
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
  },
  {
    id: 'boss_prism_regent',
    name: 'Prism Regent',
    factionId: 'faction_void_corsairs',
    patternId: 'auditFan',
    maxHull: 96,
    radius: 52,
    telegraphSeconds: 0.66,
    attackCadenceSeconds: 1.4,
    warningLabel: 'REFRACTION FAN',
    phases: [
      { label: 'Single Image', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['auditFan'], warningLabel: 'REFRACTION FAN' },
      { label: 'Broken Crown', startsAtHullRatio: 0.48, attackCadenceMultiplier: 0.84, telegraphMultiplier: 1.08, projectileBudgetMultiplier: 1.14, patternSequence: ['auditFan', 'sporeSpiral'], warningLabel: 'BROKEN CROWN' }
    ]
  },
  {
    id: 'boss_mass_cantor',
    name: 'Mass Cantor',
    factionId: 'faction_corporate_ledger',
    patternId: 'missileCurtain',
    maxHull: 108,
    radius: 56,
    telegraphSeconds: 0.74,
    attackCadenceSeconds: 1.6,
    warningLabel: 'TIDAL VERSE',
    phases: [
      { label: 'Low Canticle', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['missileCurtain'], warningLabel: 'TIDAL VERSE' },
      { label: 'Compression Hymn', startsAtHullRatio: 0.58, attackCadenceMultiplier: 0.86, telegraphMultiplier: 1.1, projectileBudgetMultiplier: 1.16, patternSequence: ['missileCurtain', 'auditFan'], warningLabel: 'COMPRESSION HYMN' }
    ]
  },
  {
    id: 'boss_horizon_leviathan',
    name: 'Horizon Leviathan',
    factionId: 'faction_scrap_court',
    patternId: 'sporeSpiral',
    maxHull: 135,
    radius: 62,
    telegraphSeconds: 0.72,
    attackCadenceSeconds: 1.42,
    warningLabel: 'EVENT HORIZON',
    phases: [
      { label: 'Anchor Wake', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['sporeSpiral'], warningLabel: 'ANCHOR WAKE' },
      { label: 'Dark Meridian', startsAtHullRatio: 0.66, attackCadenceMultiplier: 0.88, telegraphMultiplier: 1.08, projectileBudgetMultiplier: 1.14, patternSequence: ['sporeSpiral', 'missileCurtain'], warningLabel: 'DARK MERIDIAN' },
      { label: 'Last Light', startsAtHullRatio: 0.3, attackCadenceMultiplier: 0.78, telegraphMultiplier: 1.12, projectileBudgetMultiplier: 1.18, patternSequence: ['auditFan', 'sporeSpiral', 'missileCurtain'], warningLabel: 'LAST LIGHT' }
    ]
  },
  {
    id: 'boss_grave_choir',
    name: 'Grave Choir Procession',
    factionId: 'faction_bloom_hive',
    patternId: 'sporeSpiral',
    maxHull: 132,
    radius: 60,
    telegraphSeconds: 0.76,
    attackCadenceSeconds: 1.46,
    warningLabel: 'DEAD SIGNAL CHORUS',
    phases: [
      { label: 'Procession Vanes', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['sporeSpiral'], warningLabel: 'PROCESSION WAKE' },
      { label: 'Reliquary Chorus', startsAtHullRatio: 0.67, attackCadenceMultiplier: 0.88, telegraphMultiplier: 1.08, projectileBudgetMultiplier: 1.12, patternSequence: ['sporeSpiral', 'auditFan'], warningLabel: 'RELIQUARY CHORUS' },
      { label: 'Mnemonic Sepulcher', startsAtHullRatio: 0.3, attackCadenceMultiplier: 0.78, telegraphMultiplier: 1.14, projectileBudgetMultiplier: 1.18, patternSequence: ['missileCurtain', 'sporeSpiral', 'auditFan'], warningLabel: 'MEMORY BURIAL' }
    ]
  },
  {
    id: 'boss_crownless_engine',
    name: 'Crownless Engine',
    factionId: 'faction_scrap_court',
    patternId: 'missileCurtain',
    maxHull: 145,
    radius: 64,
    telegraphSeconds: 0.7,
    attackCadenceSeconds: 1.5,
    warningLabel: 'THRONE FOUNDRY',
    phases: [
      { label: 'Pilgrim Drives', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['missileCurtain'], warningLabel: 'PILGRIM SALVO' },
      { label: 'Claimant Mantle', startsAtHullRatio: 0.7, attackCadenceMultiplier: 0.87, telegraphMultiplier: 1.06, projectileBudgetMultiplier: 1.14, patternSequence: ['missileCurtain', 'auditFan'], warningLabel: 'CLAIMANT MANTLE' },
      { label: 'Empty Throne Reactor', startsAtHullRatio: 0.34, attackCadenceMultiplier: 0.76, telegraphMultiplier: 1.12, projectileBudgetMultiplier: 1.2, patternSequence: ['auditFan', 'missileCurtain', 'sporeSpiral'], warningLabel: 'EMPTY THRONE' }
    ]
  },
  {
    id: 'boss_pale_convoy',
    name: 'Pale Convoy Oracle',
    factionId: 'faction_corporate_ledger',
    patternId: 'auditFan',
    maxHull: 138,
    radius: 62,
    telegraphSeconds: 0.68,
    attackCadenceSeconds: 1.38,
    warningLabel: 'EVACUATION DECREE',
    phases: [
      { label: 'Exodus Rails', startsAtHullRatio: 1, attackCadenceMultiplier: 1, telegraphMultiplier: 1, projectileBudgetMultiplier: 1, patternSequence: ['auditFan'], warningLabel: 'EXODUS LANE' },
      { label: 'Passenger Coffer', startsAtHullRatio: 0.64, attackCadenceMultiplier: 0.86, telegraphMultiplier: 1.08, projectileBudgetMultiplier: 1.12, patternSequence: ['auditFan', 'missileCurtain'], warningLabel: 'PASSENGER LOCK' },
      { label: 'Destination Oracle', startsAtHullRatio: 0.28, attackCadenceMultiplier: 0.77, telegraphMultiplier: 1.12, projectileBudgetMultiplier: 1.18, patternSequence: ['sporeSpiral', 'auditFan', 'missileCurtain'], warningLabel: 'FALSE DESTINATION' }
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
