import { describe, expect, it } from 'vitest';

import {
  PHASE_7_TARGET_ENEMY_ROLES,
  createEnemyRoleAudit
} from '../../src/content/enemyRoleAudit';
import { FACTIONS } from '../../src/content/factions';

describe('enemy role audit', () => {
  it('covers every shipped faction pattern as the current enemy class baseline', () => {
    const audit = createEnemyRoleAudit();

    expect(audit.currentEnemyClassCount).toBe(4);
    expect(audit.entries.map((entry) => entry.factionId)).toEqual(
      FACTIONS.map((faction) => faction.id)
    );
    expect(audit.entries.map((entry) => entry.enemyPattern)).toEqual([
      'driftShot',
      'laneBurst',
      'sporeSpread',
      'phaseSkirmish'
    ]);
    expect(audit.entries.map((entry) => [entry.classId, entry.metadata.debugLabel])).toEqual([
      ['class_scrap_drifter', 'bruiser/drift'],
      ['class_ledger_screener', 'screener/lane'],
      ['class_bloom_spreader', 'disruptor/spread'],
      ['class_void_skirmisher', 'scout/phase']
    ]);
    expect(audit.entries.every((entry) => entry.spawnContexts.length > 0)).toBe(true);
    expect(audit.uniqueMajorWaveLabels).toHaveLength(44);
  });

  it('records current movement, attack, and durability constraints', () => {
    const audit = createEnemyRoleAudit();
    const scrapCourt = getEntry(audit, 'faction_scrap_court');
    const corporateLedger = getEntry(audit, 'faction_corporate_ledger');
    const bloomHive = getEntry(audit, 'faction_bloom_hive');
    const voidCorsairs = getEntry(audit, 'faction_void_corsairs');

    expect(scrapCourt.baselineRole).toBe('drift bruiser seed');
    expect(scrapCourt.phase7TargetRole).toBe('bruiser');
    expect(scrapCourt.entrySpeed).toBe(104);
    expect(scrapCourt.attackCadenceSeconds).toBe(1.55);
    expect(scrapCourt.projectileCount).toBe(2);
    expect(scrapCourt.projectileTags).toEqual(['missile', 'scrap']);

    expect(corporateLedger.phase7TargetRole).toBe('screener');
    expect(corporateLedger.entrySpeed).toBe(138);
    expect(corporateLedger.attackCadenceSeconds).toBe(1.05);
    expect(corporateLedger.projectileCount).toBe(2);

    expect(bloomHive.phase7TargetRole).toBe('disruptor');
    expect(bloomHive.entrySpeed).toBe(96);
    expect(bloomHive.attackCadenceSeconds).toBe(1.6);
    expect(bloomHive.projectileCount).toBe(3);

    expect(voidCorsairs.phase7TargetRole).toBe('scout');
    expect(voidCorsairs.entrySpeed).toBe(128);
    expect(voidCorsairs.attackCadenceSeconds).toBe(0.95);
    expect(voidCorsairs.projectileTags).toEqual(['phase']);

    expect(audit.spawnModel).toMatchObject({
      radius: 17,
      baseHullRange: [2, 3]
    });
  });

  it('captures objective-safety risks before variants and formations exist', () => {
    const audit = createEnemyRoleAudit();

    expect(audit.objectiveSafety.verifiedAccountingPaths).toContain(
      'arc and blast item side-effect kills call recordEnemyDefeat'
    );
    expect(audit.objectiveSafety.riskPaths).toContain(
      'future despawns or retreats can clear the field without adding support kill credit'
    );
    expect(audit.crossCuttingGaps).toContain(
      'semantic wave labels do not alter enemy class, formation, or attack behavior yet'
    );
    expect(audit.phase7NextSteps).toContain(
      'define objective policy for retreating, spawned, shielded, and formation enemies'
    );
  });

  it('defines the Phase 7 target role set for later schema work', () => {
    expect(PHASE_7_TARGET_ENEMY_ROLES.map((role) => role.id)).toEqual([
      'scout',
      'bruiser',
      'sniper',
      'screener',
      'carrier',
      'support',
      'disruptor'
    ]);
    expect(PHASE_7_TARGET_ENEMY_ROLES.every((role) => role.currentCoverage.length > 0)).toBe(
      true
    );
    expect(PHASE_7_TARGET_ENEMY_ROLES.every((role) => role.implementationRisk.length > 0)).toBe(
      true
    );
  });
});

function getEntry(
  audit: ReturnType<typeof createEnemyRoleAudit>,
  factionId: (typeof FACTIONS)[number]['id']
) {
  const entry = audit.entries.find((candidate) => candidate.factionId === factionId);

  if (!entry) {
    throw new Error(`Missing enemy role audit entry for ${factionId}`);
  }

  return entry;
}
