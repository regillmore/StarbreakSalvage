import { describe, expect, it } from 'vitest';

import {
  SHIP_FRAMES,
  SHIP_MODULES,
  type ShipFrameDefinition,
  type ShipModuleDefinition
} from '../../src/content/shipModules';
import { SHIPS, type ShipId } from '../../src/content/ships';
import { validateContent } from '../../src/content/contentValidation';
import { createDefaultSaveData } from '../../src/core/saveData';
import { createCombatState, type CombatBounds } from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createLegacyStartingLoadout,
  resolveShipLoadout,
  validateShipLoadout,
  type ShipLoadoutSpec
} from '../../src/game/ShipLoadout';

const BOUNDS: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('modular ship frames and loadout resolution', () => {
  it('resolves every legacy contract through one validated frame adapter', () => {
    expect(SHIP_FRAMES).toHaveLength(SHIPS.length);

    for (const ship of SHIPS) {
      const loadout = createLegacyStartingLoadout(ship);

      expect(loadout.legacyShipId).toBe(ship.id);
      expect(loadout.primaryWeaponId).toBe(ship.weapon);
      expect(loadout.shipStats).toEqual(ship.stats);
      expect(loadout.resources.powerHeadroom).toBeGreaterThanOrEqual(0);
      expect(loadout.resources.massHeadroom).toBeGreaterThanOrEqual(0);
      expect(loadout.resources.heatHeadroom).toBeGreaterThanOrEqual(0);
      expect(loadout.resources.commandHeadroom).toBeGreaterThanOrEqual(0);
      expect(loadout.signature).toContain(loadout.frameId);
      expect(loadout.preview.moduleLine).not.toBe('');
      expect(loadout.summary.modules).toContain('Primary:');
    }
  });

  it('supports materially different legal configurations on light, command, and heavy frames', () => {
    const configurations: readonly ShipLoadoutSpec[] = [
      replacePrimary('ship_debt_runner', 'module_primary_kinetic_popgun'),
      replacePrimary('ship_drone_chaplain', 'module_primary_basic_blaster'),
      replacePrimary('ship_missile_accountant', 'module_primary_short_range_spread')
    ];
    const resolved = configurations.map((configuration) => resolveShipLoadout(configuration));

    expect(resolved.map((loadout) => loadout.frameRole)).toEqual([
      'fast collector',
      'drone command carrier',
      'armored burst platform'
    ]);
    expect(new Set(resolved.map((loadout) => loadout.primaryWeaponId)).size).toBe(3);
    expect(new Set(resolved.map((loadout) => loadout.resources.totalMass)).size).toBe(3);
    expect(new Set(resolved.map((loadout) => loadout.hardpointCount)).size).toBeGreaterThan(1);
  });

  it('rejects slot, mass, tag, uniqueness, compatibility, power, and heat violations', () => {
    const debtFrame = getFrame('ship_debt_runner');
    const missileFrame = getFrame('ship_missile_accountant');
    const phaseFrame = getFrame('ship_phase_courier');
    const prototypeFrame = getFrame('ship_corporate_test_pilot');

    const slotIssues = issueCodes({
      frameId: debtFrame.id,
      mounts: debtFrame.startingLoadout.map((mount) =>
        mount.hardpointId === 'nose-primary'
          ? { ...mount, moduleId: 'module_engine_vector_drive' as const }
          : mount
      )
    });
    expect(slotIssues).toContain('slotMismatch');

    const massIssues = issueCodes({
      frameId: missileFrame.id,
      mounts: [
        ...missileFrame.startingLoadout,
        { hardpointId: 'claims-defense', moduleId: 'module_defense_armor_ledger' }
      ]
    });
    expect(massIssues).toContain('massOverload');

    const tagIssues = issueCodes({
      frameId: phaseFrame.id,
      mounts: phaseFrame.startingLoadout.map((mount) =>
        mount.hardpointId === 'phase-experimental'
          ? { ...mount, moduleId: 'module_experimental_prototype_shunt' as const }
          : mount
      )
    });
    expect(tagIssues).toContain('hardpointTag');
    expect(tagIssues).toContain('frameCompatibility');

    const uniquenessIssues = issueCodes({
      frameId: prototypeFrame.id,
      mounts: [
        ...prototypeFrame.startingLoadout,
        { hardpointId: 'experiment-b', moduleId: 'module_experimental_prototype_shunt' }
      ]
    });
    expect(uniquenessIssues).toContain('uniqueModule');

    const compatibilityIssues = issueCodes({
      frameId: debtFrame.id,
      mounts: debtFrame.startingLoadout.map((mount) =>
        mount.hardpointId === 'nose-primary'
          ? { ...mount, moduleId: 'module_primary_prototype_beam' as const }
          : mount
      )
    });
    expect(compatibilityIssues).toContain('frameCompatibility');

    const powerAndHeatIssues = issueCodes({
      frameId: prototypeFrame.id,
      mounts: [
        ...prototypeFrame.startingLoadout,
        { hardpointId: 'experiment-b', moduleId: 'module_experimental_flux_mirror' }
      ]
    });
    expect(powerAndHeatIssues).toContain('powerOverload');
    expect(powerAndHeatIssues).toContain('heatOverload');
  });

  it('preserves fixed collision geometry when a legal primary module changes', () => {
    const ship = getShip('ship_debt_runner');
    const legacy = createLegacyStartingLoadout(ship);
    const alternate = resolveShipLoadout(replacePrimary(ship.id, 'module_primary_kinetic_popgun'));
    const legacyState = createCombatState(BOUNDS, 'FRAME-COLLISION-LEGACY', {
      weaponId: legacy.primaryWeaponId,
      shipStats: legacy.shipStats,
      skipEnemyWaves: true
    });
    const alternateState = createCombatState(BOUNDS, 'FRAME-COLLISION-ALTERNATE', {
      weaponId: alternate.primaryWeaponId,
      shipStats: alternate.shipStats,
      skipEnemyWaves: true
    });

    expect(alternate.primaryWeaponId).not.toBe(legacy.primaryWeaponId);
    expect(alternate.shipStats).toEqual(legacy.shipStats);
    expect(alternateState.player.radius).toBe(legacyState.player.radius);
    expect(alternateState.player.speed).toBe(legacyState.player.speed);
    expect(alternateState.player.maxHull).toBe(legacyState.player.maxHull);
  });

  it('keeps known-seed starting loadouts stable for fresh and progressed saves', () => {
    const freshSave = createDefaultSaveData();
    const progressedSave = {
      ...freshSave,
      unlockedIds: [
        'unlock_ship_phase_courier',
        'unlock_ship_shield_bruiser',
        'unlock_ship_scrap_monk',
        'unlock_ship_corporate_test_pilot',
        'unlock_ship_relic_thief'
      ] as const,
      purchasedUpgradeIds: ['upgrade_contract_survey_rig'] as const
    };
    const freshOptions = {
      unlockedIds: freshSave.unlockedIds,
      purchasedUpgradeIds: freshSave.purchasedUpgradeIds
    };
    const progressedOptions = {
      unlockedIds: progressedSave.unlockedIds,
      purchasedUpgradeIds: progressedSave.purchasedUpgradeIds
    };

    for (const [label, options] of [
      ['fresh', freshOptions],
      ['progressed', progressedOptions]
    ] as const) {
      const first = generateRunSkeleton('SHIPCRAFT-KNOWN-SEED', options);
      const second = generateRunSkeleton('SHIPCRAFT-KNOWN-SEED', options);

      expect(
        first.contracts.map((contract) => contract.loadout.signature),
        `${label} loadouts`
      ).toEqual(second.contracts.map((contract) => contract.loadout.signature));
      expect(projectWorld(first), `${label} world`).toEqual(projectWorld(second));
    }
  });

  it('validates frame and module schemas as part of the content audit', () => {
    const invalidFrames = SHIP_FRAMES.map((frame, index) =>
      index === 0
        ? {
            ...frame,
            stats: { ...frame.stats, reactorOutput: 0 },
            hardpoints: [...frame.hardpoints, frame.hardpoints[0]!]
          }
        : frame
    ) as readonly ShipFrameDefinition[];
    const invalidModules = SHIP_MODULES.map((module, index) =>
      index === 0
        ? {
            ...module,
            slot: 'engine',
            tags: [...module.tags, 'not-a-shipcraft-tag'],
            compatibility: {
              ...module.compatibility,
              allowedFrameIds: ['frame_missing']
            }
          }
        : module
    ) as unknown as readonly ShipModuleDefinition[];
    const errors = validateContent({ shipFrames: invalidFrames, shipModules: invalidModules });

    expect(errors).toContain(
      'Ship frame frame_redline_needle stats must have positive reactorOutput'
    );
    expect(errors).toContain(
      'Ship frame frame_redline_needle has duplicate hardpoint: nose-primary'
    );
    expect(errors).toContain(
      'Ship module module_primary_light_needle_laser has invalid tag: not-a-shipcraft-tag'
    );
    expect(errors).toContain(
      'Ship module module_primary_light_needle_laser compatibility has invalid allowed frame: frame_missing'
    );
    expect(errors).toContain(
      'Ship module module_primary_light_needle_laser weapon adapter must use the primary slot'
    );
  });
});

function issueCodes(spec: ShipLoadoutSpec) {
  return validateShipLoadout(spec).issues.map((issue) => issue.code);
}

function replacePrimary(
  shipId: ShipId,
  moduleId: ShipLoadoutSpec['mounts'][number]['moduleId']
): ShipLoadoutSpec {
  const frame = getFrame(shipId);
  return {
    frameId: frame.id,
    mounts: frame.startingLoadout.map((mount) =>
      frame.hardpoints.find((hardpoint) => hardpoint.id === mount.hardpointId)?.slot === 'primary'
        ? { ...mount, moduleId }
        : mount
    )
  };
}

function getFrame(shipId: ShipId) {
  const frame = SHIP_FRAMES.find((candidate) => candidate.legacyShipId === shipId);
  if (!frame) throw new Error(`Missing frame for ${shipId}`);
  return frame;
}

function getShip(shipId: ShipId) {
  const ship = SHIPS.find((candidate) => candidate.id === shipId);
  if (!ship) throw new Error(`Missing ship ${shipId}`);
  return ship;
}

function projectWorld(run: ReturnType<typeof generateRunSkeleton>) {
  return run.sectors.map((sector) => ({
    sectorId: sector.sectorId,
    bossId: sector.bossId,
    routeKinds: sector.routeOptions.map((route) => route.kind),
    majorWaves: sector.majorWaves,
    rewardPoolSeed: sector.rewardPoolSeed,
    shopSeed: sector.shopSeed
  }));
}
