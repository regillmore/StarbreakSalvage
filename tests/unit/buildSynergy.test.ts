import { describe, expect, it } from 'vitest';

import {
  BUILD_SYNERGY_CLUSTERS,
  createBuildSynergyModel,
  formatBuildSynergyHud,
  formatBuildSynergySummary
} from '../../src/game/BuildSynergy';
import type { ItemInstance } from '../../src/game/Rewards';

describe('build synergy model', () => {
  it('represents legacy and Phase 6 item families', () => {
    expect(BUILD_SYNERGY_CLUSTERS).toHaveLength(12);
    expect(BUILD_SYNERGY_CLUSTERS.map((cluster) => cluster.id)).toEqual([
      'prismBattery',
      'warheadAudit',
      'droneChorus',
      'revengeBulwark',
      'creditEngine',
      'relicUndertow',
      'phaseNeedle',
      'prototypeFurnace',
      'plainDiscipline',
      'lunarSurvey',
      'routeBroker',
      'bossPressure'
    ]);
  });

  it('detects primary and secondary build identity from tags and families', () => {
    const model = createBuildSynergyModel([
      item('item_split_prism', 0),
      item('item_chain_arc_capacitor', 1),
      item('item_drone_uplink', 2),
      item('item_sidecar_drone_bay', 3)
    ]);

    expect(model.primary?.cluster.id).toBe('prismBattery');
    expect(model.primary?.score).toBe(11);
    expect(model.secondary?.cluster.id).toBe('droneChorus');
    expect(formatBuildSynergyHud(model)).toBe('Build Prism Battery + Drones | 4 items');
    expect(formatBuildSynergySummary(model)).toBe(
      'Prism Battery leads at 11; secondary Drone Chorus; 4 items.'
    );
  });

  it('uses acquisition order as deterministic tie-breaker', () => {
    const droneFirst = createBuildSynergyModel([
      item('item_drone_uplink', 0),
      item('item_split_prism', 1)
    ]);
    const prismFirst = createBuildSynergyModel([
      item('item_split_prism', 0),
      item('item_drone_uplink', 1)
    ]);

    expect(droneFirst.primary?.cluster.id).toBe('droneChorus');
    expect(prismFirst.primary?.cluster.id).toBe('prismBattery');
  });

  it('keeps empty builds concise', () => {
    const model = createBuildSynergyModel([]);

    expect(formatBuildSynergyHud(model)).toBe('Build no items');
    expect(formatBuildSynergySummary(model)).toBe('No build identity recorded.');
  });
});

function item(itemId: ItemInstance['itemId'], acquisitionOrder: number): ItemInstance {
  return { itemId, acquisitionOrder };
}
