import {
  getShipFrameById,
  getShipModuleById,
  type ShipModuleId,
  type ShipModuleSlot
} from '../content/shipModules';
import { getItemById } from '../content/items';
import { getWeaponById, type WeaponPatternId } from '../content/weapons';
import { COMBAT_ARENA_WIDTH } from '../game/CombatGeometry';
import {
  BASE_COMBINED_PROC_BUDGET,
  MAX_COMBINED_PROC_BUDGET,
  getComponentResourceDelta,
  resolveEngineeringSnapshot,
  type EngineeringResolution,
  type EngineeringState,
  type FoundryComponentInstance
} from '../game/Foundry';
import { applyCombinedHooks } from '../game/CombinedHooks';
import {
  getItemVolleyCadenceProfile,
  getOrderedItemInstances,
  getPrototypeVentCircuitConditionProfile,
  type ProjectileBlueprint
} from '../game/ItemHooks';
import type { ItemInstance } from '../game/Rewards';
import { createWeaponProjectileBlueprints } from '../game/WeaponProjectiles';
import {
  getProjectileTravelSeconds,
  getProjectileTravelTimeForDistance,
  isMissileProjectile
} from '../game/MissileFlight';
import { getComponentCircuitCapacity } from '../game/ComponentCircuit';
import { getItemSocketSlots } from '../game/ItemSockets';
import { isPhaseProjectile } from '../game/PhaseProjectile';
import { HEAT_SHOT_COST_RATIO, getHeatShotCost } from '../game/HeatShot';
import { getLaserProjectileKind, type LaserProjectileKind } from '../game/LaserProjectile';
import type { HeatShotEvent } from '../game/ItemHooks';
import { getArcChargeProfile, getArcDischargeDamage, type ArcChargeKind } from '../game/ArcCharge';
import {
  createDroneFollowerSpecs,
  createMicroChoirVolley,
  getEscortFormationOffset,
  type DroneFollowerSourceId,
  type DroneFollowerSpec
} from '../game/DroneFollowers';
import {
  createFoundryHeatSimulationModel,
  getFoundryHeatRates,
  type FoundryHeatSimulationModel
} from './FoundryHeatSimulation';

export type FoundryComparisonTone = 'improved' | 'declined' | 'same' | 'danger';

export interface FoundryMeterModel {
  readonly id: 'power' | 'heat' | 'mass' | 'command' | 'instability' | 'circuit';
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly capacity: number;
  readonly committedValue: number;
  readonly ratio: number;
  readonly delta: number;
  readonly tone: FoundryComparisonTone;
  readonly ariaLabel: string;
}

export interface FoundryAttackStatModel {
  readonly id: 'volley' | 'impact' | 'cadence' | 'baseDps' | 'velocity' | 'shotHeat';
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly committedValue: number;
  readonly ratio: number;
  readonly delta: number;
  readonly tone: FoundryComparisonTone;
  readonly displayValue: string;
  readonly ariaLabel: string;
}

export interface FoundryTraitModel {
  readonly glyph: string;
  readonly label: string;
  readonly value: string;
}

export interface FoundryAttackProjectileModel {
  readonly id: string;
  readonly projectileIndex: number;
  readonly waveIndex: number;
  readonly x: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly damage: number;
  readonly ttl: number;
  readonly tags: readonly string[];
  readonly arcChargeKind: ArcChargeKind | null;
  readonly flightKind: 'ballistic' | 'missile' | 'phase' | 'phaseMissile' | 'heatShot';
  readonly laserKind: LaserProjectileKind | null;
  readonly headingDegrees: number;
  readonly startXPercent: number;
  readonly startBottomPercent: number;
  readonly endXPercent: number;
  readonly endRisePercent: number;
  readonly restXPercent: number;
  readonly restRisePercent: number;
  readonly performanceXPercent: number;
  readonly performanceRisePercent: number;
  readonly displayDiameterPercent: number;
  readonly durationSeconds: number;
  readonly delaySeconds: number;
}

export interface FoundryAttackDroneModel {
  readonly id: string;
  readonly sourceId: DroneFollowerSourceId;
  readonly label: string;
  readonly glyph: string;
  readonly color: string;
  readonly xPercent: number;
  readonly bottomPercent: number;
  readonly sizePercent: number;
}

export interface FoundryAttackHeatExhaustModel {
  readonly id: string;
  readonly waveIndex: number;
  readonly offsetPercent: number;
  readonly delaySeconds: number;
  readonly durationSeconds: number;
}

export interface FoundryAttackSimulationModel {
  readonly cameraWidth: number;
  readonly cameraHeight: number;
  readonly volleySize: number;
  readonly volleysPerSecond: number;
  readonly baseDps: number;
  readonly damageSampleVolleys: number;
  readonly damageSampleTotal: number;
  readonly fireCooldownSeconds: number;
  readonly waveCopies: number;
  readonly projectiles: readonly FoundryAttackProjectileModel[];
  readonly drones: readonly FoundryAttackDroneModel[];
  readonly heatExhausts: readonly FoundryAttackHeatExhaustModel[];
  readonly ariaLabel: string;
}

export interface FoundryCircuitStageModel {
  readonly acquisitionOrder: number;
  readonly position: number;
  readonly name: string;
  readonly domain: 'VOLLEY' | 'PROJECTILE' | 'REACTIVE' | 'ECONOMY';
  readonly incomingProjectiles: number;
  readonly outgoingProjectiles: number;
  readonly incomingImpact: number;
  readonly outgoingImpact: number;
  readonly outputLabel: string;
  readonly conditionMet: boolean | null;
  readonly cadenceShiftLabel: string | null;
  readonly addedTags: readonly string[];
  readonly changed: boolean;
}

export interface FoundryDashboardModel {
  readonly valid: boolean;
  readonly changed: boolean;
  readonly issueCount: number;
  readonly weaponName: string;
  readonly weaponPattern: WeaponPatternId;
  readonly frameName: string;
  readonly mountedModuleCount: number;
  readonly attackSimulation: FoundryAttackSimulationModel;
  readonly heatSimulation: FoundryHeatSimulationModel;
  readonly circuitStages: readonly FoundryCircuitStageModel[];
  readonly meters: readonly FoundryMeterModel[];
  readonly attackStats: readonly FoundryAttackStatModel[];
  readonly traits: readonly FoundryTraitModel[];
  readonly ariaLabel: string;
}

export interface FoundryComponentStatModel {
  readonly slot: ShipModuleSlot;
  readonly power: number;
  readonly heat: number;
  readonly mass: number;
  readonly command: number;
  readonly instability: number;
  readonly circuit: number;
  readonly salvage: number;
}

export interface FoundryInstallComparisonModel {
  readonly power: number;
  readonly heat: number;
  readonly mass: number;
  readonly command: number;
  readonly instability: number;
  readonly circuit: number;
  readonly tone: FoundryComparisonTone;
  readonly label: string;
}

const ATTACK_CAPS = {
  volley: 5,
  impact: 3,
  cadence: 10,
  baseDps: 80,
  velocity: 1_000,
  shotHeat: 0.6
} as const;
export const FOUNDRY_ATTACK_PREVIEW_WORLD_HEIGHT = 260;
const ATTACK_PREVIEW_TRAVEL_DISTANCE = 250;
const ATTACK_PREVIEW_SEQUENCE_DISTANCE = 560;
const MAX_ATTACK_PREVIEW_WAVE_COPIES = 6;
const MAX_ATTACK_PREVIEW_PROJECTILES = 48;
const MAX_ATTACK_DAMAGE_SAMPLE_VOLLEYS = 420;

export function createFoundryDashboardModel(
  state: EngineeringState,
  items: readonly ItemInstance[] = [],
  committedItems: readonly ItemInstance[] = items
): FoundryDashboardModel {
  const committed = resolveEngineeringSnapshot(state.committed);
  const draft = resolveEngineeringSnapshot(state.draft);
  const committedLoadout = requireLoadout(committed);
  const committedResources = requireResources(committed);
  const draftResources = draft.resources ?? committedResources;
  const committedWeapon = getWeaponById(committedLoadout.primaryWeaponId);
  const draftWeapon = getWeaponById(
    draft.loadout?.primaryWeaponId ??
      getDraftPrimaryWeaponId(state) ??
      committedLoadout.primaryWeaponId
  );
  const procBudget = Math.min(
    MAX_COMBINED_PROC_BUDGET,
    BASE_COMBINED_PROC_BUDGET + draft.effects.procBudgetBonus
  );
  const committedProcBudget = Math.min(
    MAX_COMBINED_PROC_BUDGET,
    BASE_COMBINED_PROC_BUDGET + committed.effects.procBudgetBonus
  );
  const attackSimulation = createFoundryAttackSimulationModel(
    draftWeapon,
    draft,
    procBudget,
    items
  );
  const circuitStages = createFoundryCircuitStageModels(draftWeapon, draft, procBudget, items);
  const committedAttackSimulation = createFoundryAttackSimulationModel(
    committedWeapon,
    committed,
    committedProcBudget,
    committedItems
  );
  const heatSimulation = createFoundryHeatSimulationModel(
    { weapon: draftWeapon, resolution: draft, procBudget, items },
    {
      weapon: committedWeapon,
      resolution: committed,
      procBudget: committedProcBudget,
      items: committedItems
    }
  );
  const draftCircuitCapacity = getItemSocketSlots(state.draft).length;
  const committedCircuitCapacity = getItemSocketSlots(state.committed).length;
  const meters: FoundryMeterModel[] = [
    createCapacityMeter(
      'power',
      'P',
      'Power',
      draftResources.powerDraw,
      draftResources.reactorOutput,
      committedResources.powerDraw
    ),
    createCapacityMeter(
      'heat',
      'H',
      'Thermal',
      draftResources.heatLoad,
      draftResources.thermalCapacity,
      committedResources.heatLoad
    ),
    createCapacityMeter(
      'mass',
      'M',
      'Mass',
      draftResources.totalMass,
      draftResources.massCapacity,
      committedResources.totalMass
    ),
    createCapacityMeter(
      'command',
      'C',
      'Command',
      draftResources.commandDraw,
      draftResources.commandCapacity,
      committedResources.commandDraw
    ),
    createCapacityMeter(
      'instability',
      '!',
      'Instability',
      draft.instability,
      draft.instabilityCapacity,
      committed.instability
    ),
    createCircuitMeter(items.length, draftCircuitCapacity, committedCircuitCapacity)
  ];
  const draftVolley = attackSimulation.volleySize;
  const committedVolley = committedAttackSimulation.volleySize;
  const attackStats: FoundryAttackStatModel[] = [
    createAttackStat('volley', '◉', 'Volley', draftVolley, committedVolley, false, 0),
    createAttackStat('impact', '◆', 'Impact', draftWeapon.damage, committedWeapon.damage, false, 2),
    createAttackStat(
      'cadence',
      '»',
      'Cadence',
      1 / draftWeapon.fireCooldownSeconds,
      1 / committedWeapon.fireCooldownSeconds,
      false,
      1
    ),
    createAttackStat(
      'baseDps',
      'Σ',
      'Base DPS',
      attackSimulation.baseDps,
      committedAttackSimulation.baseDps,
      false,
      1
    ),
    createAttackStat(
      'velocity',
      '↑',
      'Velocity',
      draftWeapon.projectileSpeed,
      committedWeapon.projectileSpeed,
      false,
      0
    ),
    createAttackStat(
      'shotHeat',
      '△',
      'Shot Heat',
      draftWeapon.heatPerShot * draft.effects.heatPerShotMultiplier,
      committedWeapon.heatPerShot * committed.effects.heatPerShotMultiplier,
      true,
      2
    )
  ];
  const traits = createTraitModels(draft, procBudget);

  return {
    valid: draft.valid,
    changed: draft.signature !== committed.signature,
    issueCount: draft.issues.length,
    weaponName: draftWeapon.name,
    weaponPattern: draftWeapon.pattern,
    frameName: getShipFrameById(state.draft.frameId).name,
    mountedModuleCount: state.draft.mounts.length,
    attackSimulation,
    heatSimulation,
    circuitStages,
    meters,
    attackStats,
    traits,
    ariaLabel: `${draft.valid ? 'Legal' : 'Invalid'} draft. ${draftWeapon.name} ${draftWeapon.pattern}. ${meters
      .map((meter) => meter.ariaLabel)
      .join(
        '. '
      )}. ${attackStats.map((stat) => stat.ariaLabel).join('. ')}. ${heatSimulation.ariaLabel}`
  };
}

function createFoundryCircuitStageModels(
  weapon: ReturnType<typeof getWeaponById>,
  resolution: EngineeringResolution,
  procBudget: number,
  items: readonly ItemInstance[]
): FoundryCircuitStageModel[] {
  const ordered = getOrderedItemInstances(items);
  let incoming = resolveCircuitPreviewVolley(weapon, resolution, procBudget, []);
  return ordered.map((instance, index) => {
    const prefix = ordered.slice(0, index + 1);
    const outgoing = resolveCircuitPreviewVolley(
      weapon,
      resolution,
      procBudget,
      addLaterCircuitContext(prefix, ordered)
    );
    const item = getItemById(instance.itemId);
    const incomingImpact = sumProjectileImpact(incoming);
    const outgoingImpact = sumProjectileImpact(outgoing);
    const incomingArc = summarizeArcVolley(incoming);
    const outgoingArc = summarizeArcVolley(outgoing);
    const incomingTags = new Set(incoming.flatMap((projectile) => projectile.tags));
    const addedTags = [
      ...new Set(
        outgoing.flatMap((projectile) => projectile.tags).filter((tag) => !incomingTags.has(tag))
      )
    ];
    const cadence = getItemVolleyCadenceProfile(instance.itemId, ordered);
    const condition = createCircuitStageCondition(instance.itemId, ordered, resolution, incoming);
    const changed =
      incoming.length !== outgoing.length ||
      Math.abs(incomingImpact - outgoingImpact) > 0.01 ||
      incomingArc.chargeCount !== outgoingArc.chargeCount ||
      Math.abs(incomingArc.totalDamage - outgoingArc.totalDamage) > 0.01 ||
      incomingArc.maxRange !== outgoingArc.maxRange ||
      addedTags.length > 0 ||
      cadence?.prototypeVented === true;
    const model: FoundryCircuitStageModel = {
      acquisitionOrder: instance.acquisitionOrder,
      position: index + 1,
      name: item.name,
      domain: getCircuitStageDomain(item.hooks),
      incomingProjectiles: incoming.length,
      outgoingProjectiles: outgoing.length,
      incomingImpact,
      outgoingImpact,
      outputLabel:
        condition?.label ??
        createCircuitStageOutputLabel(
          incoming.length,
          outgoing.length,
          incomingImpact,
          outgoingImpact,
          item.hooks,
          incomingArc,
          outgoingArc
        ),
      conditionMet: condition?.met ?? null,
      cadenceShiftLabel: cadence?.prototypeVented
        ? `VENT SCRIPT · EVERY ${formatOrdinal(cadence.baseCadence)} -> ${formatOrdinal(cadence.effectiveCadence)} VOLLEY · +1 HEAT SHOT · SPENDS 32% HEAT · COOL = EXHAUST`
        : null,
      addedTags,
      changed
    };
    incoming = outgoing;
    return model;
  });
}

interface CircuitStageCondition {
  readonly met: boolean;
  readonly label: string;
}

function createCircuitStageCondition(
  itemId: ItemInstance['itemId'],
  ordered: readonly ItemInstance[],
  resolution: EngineeringResolution,
  incoming: readonly ProjectileBlueprint[]
): CircuitStageCondition | null {
  const ventCondition = createPrototypeVentCircuitStageCondition(itemId, ordered);
  if (ventCondition) return ventCondition;

  if (itemId === 'item_shield_dynamo') {
    return {
      met: incoming.length > 0,
      label:
        incoming.length > 0
          ? `PRESSURE CYCLE · EVERY 4TH VOLLEY · ${incoming.length} EARLIER SHOT${incoming.length === 1 ? '' : 'S'} ARMORED + RETALIATION`
          : 'CONDITION NOT MET · NEEDS AN EARLIER SHOT'
    };
  }
  if (itemId === 'item_reactive_plating_grid') {
    const copiedShots = Math.min(2, incoming.length);
    return {
      met: copiedShots > 0,
      label:
        copiedShots > 0
          ? `PLATING CYCLE · EVERY 3RD VOLLEY · ${copiedShots} OUTER SHOT${copiedShots === 1 ? '' : 'S'} COPIED AS RETALIATION PLATES`
          : 'CONDITION NOT MET · NEEDS AN EARLIER SHOT'
    };
  }
  if (itemId === 'item_shield_revenge_contract') {
    const retaliationShots = incoming.filter((projectile) => projectile.tags.includes('revenge'));
    const copiedShots = Math.min(2, retaliationShots.length);
    return copiedShots > 0
      ? {
          met: true,
          label: `CONDITION MET · EVERY 6TH VOLLEY · ${copiedShots} RETALIATION SHOT${copiedShots === 1 ? '' : 'S'} REISSUED`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER RETALIATION PRESSURE' };
  }
  if (itemId === 'item_revenge_beam') {
    const retaliationShots = incoming.filter((projectile) => projectile.tags.includes('revenge'));
    return retaliationShots.length > 0
      ? {
          met: true,
          label: `CONDITION MET · HEAVIEST OF ${retaliationShots.length} RETALIATION SHOT${retaliationShots.length === 1 ? '' : 'S'} RELEASES A BEAM`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER RETALIATION PRESSURE' };
  }
  if (itemId === 'item_oathbound_deflector') {
    const retaliationShots = incoming.filter((projectile) => projectile.tags.includes('revenge'));
    return retaliationShots.length > 0
      ? {
          met: true,
          label: `CONDITION MET · ${retaliationShots.length} RETALIATION SHOT${retaliationShots.length === 1 ? '' : 'S'} GAIN 1 REBOUND + 0.28S FLIGHT`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER RETALIATION PRESSURE' };
  }
  if (itemId === 'item_cursed_hull_plate') {
    const retaliationShots = incoming.filter((projectile) => projectile.tags.includes('revenge'));
    return retaliationShots.length > 0
      ? {
          met: true,
          label: `CONDITION MET · ${retaliationShots.length} RETALIATION SHOT${retaliationShots.length === 1 ? '' : 'S'} AMPLIFIED · +3 CURSED RUPTURE SHOTS`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER RETALIATION PRESSURE' };
  }

  if (itemId === 'item_drone_uplink') {
    return { met: true, label: '2 FOLLOWERS DEPLOYED · COPY EVERY 3RD VOLLEY' };
  }
  if (itemId === 'item_mirror_turret') {
    return { met: true, label: '1 FOLLOWER DEPLOYED · REAR COVER EACH VOLLEY' };
  }
  if (itemId === 'item_sidecar_drone_bay') {
    return { met: true, label: '1 FOLLOWER DEPLOYED · FLANK SHOT EVERY 4TH VOLLEY' };
  }
  if (itemId === 'item_signal_clone_stamp') {
    const sourceCount = Math.min(
      4,
      incoming.filter((projectile) => !projectile.tags.includes('drone')).length
    );
    return sourceCount > 0
      ? {
          met: true,
          label: `1 FOLLOWER DEPLOYED · CLONES ${sourceCount} EARLIER SHOT${sourceCount === 1 ? '' : 'S'} EVERY 3RD VOLLEY`
        }
      : { met: false, label: 'FOLLOWER IDLE · NEEDS AN EARLIER NON-DRONE SHOT' };
  }
  if (itemId === 'item_arc_welder_drone') {
    const arcReady = hasDroneArcFeed(ordered, incoming);
    return arcReady
      ? { met: true, label: '1 FOLLOWER DEPLOYED · ARC FEED READY EVERY 3RD VOLLEY' }
      : { met: false, label: 'FOLLOWER IDLE · NEEDS AN ARC SOURCE' };
  }
  if (itemId === 'item_scrap_saints_relay') {
    const followerCount = createDroneFollowerSpecs(
      ordered,
      getResolutionModuleIds(resolution)
    ).filter(
      (follower) =>
        follower.sourceId !== 'item_arc_welder_drone' || hasDroneArcFeed(ordered, incoming)
    ).length;
    return followerCount > 0
      ? {
          met: true,
          label: `CONDITION MET · ${followerCount} DRONE${followerCount === 1 ? '' : 'S'} CAN MARK KILLS`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS A DRONE LAUNCHER' };
  }
  if (itemId === 'item_rebound_freight_seal') {
    const bouncingShots = incoming.filter(
      (projectile) => (projectile.ricochetBounces ?? 0) > 0
    ).length;
    return bouncingShots > 0
      ? {
          met: true,
          label: `CONDITION MET · ${bouncingShots} BOUNCING SHOT${bouncingShots === 1 ? '' : 'S'} · +14% IMPACT PER BOUNCE`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER RICOCHET SOURCE' };
  }
  if (itemId === 'item_strata_bore_collimator') {
    const plasmaShots = incoming.filter((projectile) => projectile.tags.includes('plasma'));
    if (plasmaShots.length === 0) {
      return { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER PLASMA SOURCE' };
    }
    const maxSupportingTraits = plasmaShots.reduce(
      (maximum, projectile) => Math.max(maximum, countCircuitTraits(projectile.tags)),
      0
    );
    const bonusPercent = 14 + Math.min(3, maxSupportingTraits) * 4;
    return {
      met: true,
      label: `CONDITION MET · ${plasmaShots.length} PLASMA SHOT${plasmaShots.length === 1 ? '' : 'S'} · +${bonusPercent}% IMPACT · BEAM LASER`
    };
  }
  if (itemId === 'item_claimant_arc_seal') {
    const overkillShots = incoming.filter((projectile) => projectile.tags.includes('overkill'));
    return overkillShots.length > 0
      ? {
          met: true,
          label: `CONDITION MET · ${overkillShots.length} OVERKILL SHOT${overkillShots.length === 1 ? '' : 'S'} · STANDARD ARC TO SECOND TARGET`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER OVERKILL SOURCE' };
  }
  if (itemId === 'item_parallax_echo_lattice') {
    const secondaryShots = incoming.filter((projectile) => projectile.procDepth > 0);
    return secondaryShots.length > 0
      ? {
          met: true,
          label: `CONDITION MET · ${secondaryShots.length} SECONDARY SHOT${secondaryShots.length === 1 ? '' : 'S'} PHASED · +0.30S FLIGHT`
        }
      : {
          met: false,
          label: 'CONDITION NOT MET · NEEDS AN EARLIER SHOT-CREATING STAGE'
        };
  }
  if (itemId === 'item_ashwake_reliquary') {
    const phaseShots = incoming.filter((projectile) => projectile.tags.includes('phase'));
    const echoed = Math.min(3, phaseShots.length);
    return echoed > 0
      ? {
          met: true,
          label: `CONDITION MET · ${echoed} PHASE SHOT${echoed === 1 ? '' : 'S'} CAST AS ASHWAKE ECHOES · 56% IMPACT`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER PHASE SOURCE' };
  }
  if (itemId === 'item_penumbra_crown_aperture') {
    return incoming.length >= 2
      ? {
          met: true,
          label: `CONDITION MET · ${incoming.length}-SHOT VOLLEY · CENTERLINE PHASE / PLASMA · +1 RADIUS · +0.18S FLIGHT · -8% VELOCITY`
        }
      : {
          met: false,
          label: 'CONDITION NOT MET · NEEDS AN EARLIER MULTI-SHOT STAGE'
      };
  }
  if (itemId === 'item_funeral_refrain_array') {
    const echoed = Math.min(2, incoming.length);
    return echoed > 0
      ? {
          met: true,
          label: `CONDITION MET · EVERY 5TH VOLLEY · ${echoed} HEAVY SHOT${echoed === 1 ? '' : 'S'} ECHO AS PHASED CHOIR DRONES`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER SHOT' };
  }
  if (itemId === 'item_mnemonic_sepulcher_key') {
    const remembered = incoming.filter(
      (projectile) =>
        projectile.tags.includes('phase') || projectile.tags.includes('drone')
    ).length;
    return remembered > 0
      ? {
          met: true,
          label: `CONDITION MET · ${remembered} PHASE / DRONE SHOT${remembered === 1 ? '' : 'S'} · +0.30S FLIGHT · HEAVY ARC`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER PHASE OR DRONE SHOTS' };
  }
  if (itemId === 'item_claimant_mantle_press') {
    const forgeable = incoming.filter(
      (projectile) =>
        projectile.tags.includes('missile') || projectile.tags.includes('overkill')
    ).length;
    return forgeable > 0
      ? {
          met: true,
          label: `CONDITION MET · ${forgeable} MISSILE / OVERKILL SHOT${forgeable === 1 ? '' : 'S'} FORGED INTO RETALIATION`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS EARLIER MISSILE OR OVERKILL SHOTS' };
  }
  if (itemId === 'item_empty_throne_coronation') {
    return incoming.length > 0
      ? {
          met: true,
          label: 'CONDITION MET · EVERY 4TH VOLLEY · HEAVIEST EARLIER SHOT CROWNED AS PLASMA OVERKILL'
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER SHOT' };
  }
  if (itemId === 'item_exodus_rail_switch') {
    return incoming.length >= 2
      ? {
          met: true,
          label: `CONDITION MET · ${incoming.length}-SHOT VOLLEY · OUTER PAIR PHASES AND CROSSES LANES`
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AN EARLIER MULTI-SHOT STAGE' };
  }
  if (itemId === 'item_passenger_coffer_manifest') {
    return incoming.length >= 2
      ? {
          met: true,
          label: 'CONDITION MET · EVERY 3RD VOLLEY · 2 LIGHTER BRANCHES COPY AS ARC ESCORTS'
        }
      : { met: false, label: 'CONDITION NOT MET · NEEDS AT LEAST 2 EARLIER SHOTS' };
  }

  return null;
}

function countCircuitTraits(tags: readonly string[]): number {
  return new Set(
    tags.filter((tag) =>
      ['arc', 'drone', 'missile', 'phase', 'revenge', 'ricochet', 'shield', 'split'].includes(tag)
    )
  ).size;
}

function hasDroneArcFeed(
  ordered: readonly ItemInstance[],
  incoming: readonly ProjectileBlueprint[]
): boolean {
  return (
    ordered.some((instance) => instance.itemId === 'item_chain_arc_capacitor') ||
    incoming.some(
      (projectile) => projectile.tags.includes('arc') || getArcChargeProfile(projectile) !== null
    )
  );
}

function createPrototypeVentCircuitStageCondition(
  itemId: ItemInstance['itemId'],
  ordered: readonly ItemInstance[]
): CircuitStageCondition | null {
  if (itemId !== 'item_prototype_vent_script') return null;

  const profile = getPrototypeVentCircuitConditionProfile(ordered);
  if (!profile || !profile.conditionMet) {
    return {
      met: false,
      label: 'CONDITION NOT MET · NEEDS AN EARLIER PERIODIC VOLLEY'
    };
  }

  const stageLabel = profile.earlierPeriodicStageCount === 1 ? 'VOLLEY' : 'VOLLEYS';
  return {
    met: true,
    label: `CONDITION MET · ${profile.earlierPeriodicStageCount} EARLIER PERIODIC ${stageLabel} LINKED`
  };
}

function addLaterCircuitContext(
  prefix: readonly ItemInstance[],
  ordered: readonly ItemInstance[]
): ItemInstance[] {
  const prototypeVent = ordered.find(
    (instance) => instance.itemId === 'item_prototype_vent_script'
  );
  return prototypeVent && !prefix.includes(prototypeVent)
    ? [...prefix, prototypeVent]
    : [...prefix];
}

function formatOrdinal(value: number): string {
  const modulo100 = value % 100;
  if (modulo100 >= 11 && modulo100 <= 13) return `${value}TH`;
  if (value % 10 === 1) return `${value}ST`;
  if (value % 10 === 2) return `${value}ND`;
  if (value % 10 === 3) return `${value}RD`;
  return `${value}TH`;
}

function resolveCircuitPreviewVolley(
  weapon: ReturnType<typeof getWeaponById>,
  resolution: EngineeringResolution,
  procBudget: number,
  items: readonly ItemInstance[]
): ProjectileBlueprint[] {
  const firePayload = applyCombinedHooks(
    'onFire',
    items,
    resolution.hooks,
    {
      volleyIndex: 12,
      projectiles: createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 })
    },
    { maxApplications: procBudget }
  );
  const moduleIds = getResolutionModuleIds(resolution);
  return createMicroChoirVolley(firePayload.projectiles, 12, moduleIds).map(
    (projectile) =>
      applyCombinedHooks(
        'onProjectileSpawn',
        items,
        resolution.hooks,
        { projectile },
        { maxApplications: procBudget }
      ).projectile
  );
}

function sumProjectileImpact(projectiles: readonly ProjectileBlueprint[]): number {
  return projectiles.reduce((total, projectile) => total + projectile.damage, 0);
}

interface ArcVolleySummary {
  readonly chargeCount: number;
  readonly totalDamage: number;
  readonly maxRange: number;
}

function summarizeArcVolley(projectiles: readonly ProjectileBlueprint[]): ArcVolleySummary {
  return projectiles.reduce<ArcVolleySummary>(
    (summary, projectile) => {
      const profile = getArcChargeProfile(projectile);
      if (!profile) return summary;
      return {
        chargeCount: summary.chargeCount + 1,
        totalDamage: summary.totalDamage + getArcDischargeDamage(projectile.damage, profile),
        maxRange: Math.max(summary.maxRange, profile.range)
      };
    },
    { chargeCount: 0, totalDamage: 0, maxRange: 0 }
  );
}

function getCircuitStageDomain(hooks: readonly string[]): FoundryCircuitStageModel['domain'] {
  if (hooks.includes('onFire')) return 'VOLLEY';
  if (hooks.includes('onProjectileSpawn')) return 'PROJECTILE';
  if (
    hooks.some((hook) =>
      [
        'onRouteChosen',
        'onShopEntered',
        'onRewardGenerated',
        'onPickupCollected',
        'onSectorStart'
      ].includes(hook)
    )
  ) {
    return 'ECONOMY';
  }
  return 'REACTIVE';
}

function createCircuitStageOutputLabel(
  incomingProjectiles: number,
  outgoingProjectiles: number,
  incomingImpact: number,
  outgoingImpact: number,
  hooks: readonly string[],
  incomingArc: ArcVolleySummary,
  outgoingArc: ArcVolleySummary
): string {
  if (incomingProjectiles !== outgoingProjectiles) {
    return `${incomingProjectiles} -> ${outgoingProjectiles} shots`;
  }
  if (Math.abs(incomingImpact - outgoingImpact) > 0.01) {
    return `${incomingImpact.toFixed(1)} -> ${outgoingImpact.toFixed(1)} impact`;
  }
  if (
    incomingArc.chargeCount !== outgoingArc.chargeCount ||
    Math.abs(incomingArc.totalDamage - outgoingArc.totalDamage) > 0.01 ||
    incomingArc.maxRange !== outgoingArc.maxRange
  ) {
    const incomingLabel =
      incomingArc.chargeCount > 0
        ? `${incomingArc.totalDamage.toFixed(1)} @ ${incomingArc.maxRange}u`
        : 'none';
    const outgoingLabel =
      outgoingArc.chargeCount > 0
        ? `${outgoingArc.totalDamage.toFixed(1)} @ ${outgoingArc.maxRange}u`
        : 'none';
    return `ARC ${incomingLabel} -> ${outgoingLabel}`;
  }
  if (hooks.includes('onProjectileSpawn')) return 'conditional projectile rewrite armed';
  if (hooks.includes('onFire')) return 'conditional volley armed';
  if (getCircuitStageDomain(hooks) === 'ECONOMY') return 'run economy signal armed';
  return 'reactive signal armed';
}

function createFoundryAttackSimulationModel(
  weapon: ReturnType<typeof getWeaponById>,
  resolution: EngineeringResolution,
  procBudget: number,
  items: readonly ItemInstance[]
): FoundryAttackSimulationModel {
  const moduleIds = getResolutionModuleIds(resolution);
  const droneSpecs = createDroneFollowerSpecs(items, moduleIds);
  let storedWeaponHeat = 0;
  const { heatPerVolley, coolingPerSecond } = getFoundryHeatRates(weapon, resolution, items);
  const sourceHeatEvents: (readonly HeatShotEvent[])[] = [];
  const damageSampleVolleys = getAttackDamageSampleVolleyCount(items);
  const volleys = Array.from({ length: damageSampleVolleys }, (_value, index) => {
    if (index > 0) {
      storedWeaponHeat = Math.max(
        0,
        storedWeaponHeat - coolingPerSecond * weapon.fireCooldownSeconds
      );
    }
    const firePayload = applyCombinedHooks(
      'onFire',
      items,
      resolution.hooks,
      {
        volleyIndex: index + 1,
        projectiles: createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 }),
        storedWeaponHeat,
        heatShotCost: getHeatShotCost(weapon.overheatLimit),
        weaponHeatSpent: 0,
        heatShotEvents: []
      },
      { maxApplications: procBudget }
    );
    storedWeaponHeat = Math.max(0, storedWeaponHeat - (firePayload.weaponHeatSpent ?? 0));
    storedWeaponHeat = Math.min(weapon.overheatLimit, storedWeaponHeat + heatPerVolley);
    sourceHeatEvents.push(firePayload.heatShotEvents ?? []);
    return createMicroChoirVolley(firePayload.projectiles, index + 1, moduleIds).map(
      (projectile) =>
        applyCombinedHooks(
          'onProjectileSpawn',
          items,
          resolution.hooks,
          { projectile },
          { maxApplications: procBudget }
        ).projectile
    );
  });
  return createFoundryAttackPatternPreviewModel(
    weapon.name,
    weapon.fireCooldownSeconds,
    volleys,
    sourceHeatEvents,
    droneSpecs
  );
}

export function createFoundryAttackPreviewModel(
  weaponName: string,
  fireCooldownSeconds: number,
  volley: readonly ProjectileBlueprint[]
): FoundryAttackSimulationModel {
  return createFoundryAttackPatternPreviewModel(weaponName, fireCooldownSeconds, [volley]);
}

function createFoundryAttackPatternPreviewModel(
  weaponName: string,
  fireCooldownSeconds: number,
  sourceVolleys: readonly (readonly ProjectileBlueprint[])[],
  sourceHeatEvents: readonly (readonly HeatShotEvent[])[] = [],
  droneSpecs: readonly DroneFollowerSpec[] = []
): FoundryAttackSimulationModel {
  const safeCooldown = Math.max(0.05, fireCooldownSeconds);
  const damageSample = sourceVolleys.length > 0 ? sourceVolleys : [[]];
  const damageSampleVolleys = damageSample.length;
  const damageSampleTotal = damageSample.reduce(
    (cycleDamage, volley) => cycleDamage + sumProjectileImpact(volley),
    0
  );
  const baseDps = damageSampleTotal / (damageSampleVolleys * safeCooldown);
  const safeVolleys = damageSample.map((volley) => volley.slice(0, 12));
  const previewVolleys = safeVolleys.slice(0, MAX_ATTACK_PREVIEW_WAVE_COPIES);
  const safeProjectiles = previewVolleys.flat();
  const flightSeconds = safeProjectiles.reduce(
    (longest, projectile) =>
      Math.max(
        longest,
        getProjectileTravelTimeForDistance(
          ATTACK_PREVIEW_TRAVEL_DISTANCE,
          -projectile.vy,
          projectile.tags
        )
      ),
    0
  );
  const sequenceSeconds = safeProjectiles.reduce(
    (longest, projectile) =>
      Math.max(
        longest,
        getProjectileTravelTimeForDistance(
          ATTACK_PREVIEW_SEQUENCE_DISTANCE,
          -projectile.vy,
          projectile.tags
        )
      ),
    0
  );
  const desiredWaveCopies = Math.max(
    1,
    Math.min(MAX_ATTACK_PREVIEW_WAVE_COPIES, Math.ceil(sequenceSeconds / safeCooldown))
  );
  const selectedVolleys: (readonly ProjectileBlueprint[])[] = [];
  const selectedHeatEvents: (readonly HeatShotEvent[])[] = [];
  let projectileCount = 0;

  for (let waveIndex = 0; waveIndex < desiredWaveCopies; waveIndex += 1) {
    const volley = previewVolleys[waveIndex % Math.max(1, previewVolleys.length)] ?? [];
    if (
      selectedVolleys.length > 0 &&
      projectileCount + volley.length > MAX_ATTACK_PREVIEW_PROJECTILES
    ) {
      break;
    }
    selectedVolleys.push(volley);
    selectedHeatEvents.push(
      sourceHeatEvents[waveIndex % Math.max(1, sourceHeatEvents.length)] ?? []
    );
    projectileCount += volley.length;
  }

  const waveCopies = selectedVolleys.length;
  const durationSeconds = Math.max(flightSeconds, safeCooldown * waveCopies);
  const drones = createFoundryAttackDroneModels(droneSpecs);
  const projectiles = selectedVolleys.flatMap((volley, waveIndex) =>
    volley.map((projectile, projectileIndex) =>
      createFoundryAttackProjectileModel(
        projectile,
        projectileIndex,
        volley
          .slice(0, projectileIndex)
          .filter((candidate) => candidate.droneSourceId === projectile.droneSourceId).length,
        waveIndex,
        waveCopies,
        durationSeconds,
        flightSeconds,
        safeCooldown,
        drones
      )
    )
  );
  const heatExhausts = selectedHeatEvents.flatMap((events, waveIndex) =>
    events
      .filter((event) => event.outcome === 'exhausted')
      .map((event, eventIndex) => ({
        id: `preview-heat-exhaust-${waveIndex}-${event.sourceItemId}-${eventIndex}`,
        waveIndex,
        offsetPercent: (eventIndex % 2 === 0 ? -1 : 1) * (1.2 + eventIndex * 0.55),
        delaySeconds: -waveIndex * safeCooldown,
        durationSeconds
      }))
  );
  const volleySizes = selectedVolleys.map((volley) => volley.length);
  const minimumVolleySize = Math.min(...volleySizes);
  const volleySize = Math.max(...volleySizes);
  const volleysPerSecond = 1 / safeCooldown;
  const volleyDescription =
    minimumVolleySize === volleySize
      ? `${volleySize} projectile${volleySize === 1 ? '' : 's'} per volley`
      : `${minimumVolleySize}-${volleySize} projectiles per volley across the firing cycle`;
  const missileDescription = safeProjectiles.some((projectile) =>
    isMissileProjectile(projectile.tags)
  )
    ? ' Missile-tagged shots use their two-stage motor profile.'
    : '';
  const phaseDescription = safeProjectiles.some((projectile) => isPhaseProjectile(projectile.tags))
    ? ' Phase-tagged shots carry a refracted core, displaced afterimages, and a broken wake; their first damaging contact pierces and collapses the phase.'
    : '';
  const heatEvents = selectedHeatEvents.flat();
  const heatShotsFired = heatEvents.filter((event) => event.outcome === 'fired').length;
  const heatShotsExhausted = heatEvents.length - heatShotsFired;
  const heatDescription =
    heatEvents.length > 0
      ? ` Vent heat shots spend ${(HEAT_SHOT_COST_RATIO * 100).toFixed(0)}% of overheat capacity; this cool-start cycle generates ${heatShotsFired} and replaces ${heatShotsExhausted} underfunded attempt${heatShotsExhausted === 1 ? '' : 's'} with visible exhaust.`
      : '';
  const laserKinds = [
    ...new Set(
      safeProjectiles
        .map((projectile) => getLaserProjectileKind(projectile.tags, projectile.laserKind))
        .filter((kind): kind is LaserProjectileKind => kind !== null)
    )
  ];
  const laserDescription =
    laserKinds.length > 0
      ? ` Laser-tagged shots use velocity-aligned luminous bodies; active profiles: ${laserKinds.join(', ')}.`
      : '';
  const arcSummary = summarizeArcVolley(safeProjectiles);
  const arcKinds = [
    ...new Set(
      safeProjectiles
        .map((projectile) => getArcChargeProfile(projectile)?.kind ?? null)
        .filter((kind): kind is ArcChargeKind => kind !== null)
    )
  ];
  const arcDescription =
    arcSummary.chargeCount > 0
      ? ` Arc-charged shots store a ${arcKinds.join('/')} secondary discharge totaling ${arcSummary.totalDamage.toFixed(1)} potential impact across this volley at up to ${arcSummary.maxRange}u; the primary hit receives no bonus damage.`
      : '';
  const droneDescription =
    drones.length > 0
      ? ` ${drones.length} formation drone${drones.length === 1 ? '' : 's'} remain visible; drone-tagged shots launch from their assigned follower.`
      : '';
  return {
    cameraWidth: COMBAT_ARENA_WIDTH,
    cameraHeight: FOUNDRY_ATTACK_PREVIEW_WORLD_HEIGHT,
    volleySize,
    volleysPerSecond,
    baseDps,
    damageSampleVolleys,
    damageSampleTotal,
    fireCooldownSeconds: safeCooldown,
    waveCopies,
    projectiles,
    drones,
    heatExhausts,
    ariaLabel: `${weaponName} live-fire preview. ${volleyDescription} at ${volleysPerSecond.toFixed(1)} volleys per second. Base direct damage is ${baseDps.toFixed(1)} per second, measured across ${damageSampleVolleys} consecutive ${damageSampleVolleys === 1 ? 'volley' : 'volleys'} at baseline cadence; hit-dependent damage is excluded.${missileDescription}${laserDescription}${phaseDescription}${arcDescription}${heatDescription}${droneDescription} Projectile paths use the draft loadout's combat velocity, spread, radius, damage, engineering hooks, and owned item hooks.`
  };
}

function getAttackDamageSampleVolleyCount(items: readonly ItemInstance[]): number {
  const cadenceCycle = getOrderedItemInstances(items).reduce((cycle, instance) => {
    const cadence = getItemVolleyCadenceProfile(instance.itemId, items)?.effectiveCadence;
    if (!cadence) return cycle;
    return Math.min(MAX_ATTACK_DAMAGE_SAMPLE_VOLLEYS, getLeastCommonMultiple(cycle, cadence));
  }, 1);
  return Math.max(1, cadenceCycle);
}

function getLeastCommonMultiple(left: number, right: number): number {
  return Math.abs(left * right) / getGreatestCommonDivisor(left, right);
}

function getGreatestCommonDivisor(left: number, right: number): number {
  let a = Math.max(1, Math.floor(Math.abs(left)));
  let b = Math.max(1, Math.floor(Math.abs(right)));
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function createFoundryAttackProjectileModel(
  projectile: ProjectileBlueprint,
  projectileIndex: number,
  sourceProjectileIndex: number,
  waveIndex: number,
  waveCopies: number,
  durationSeconds: number,
  flightSeconds: number,
  fireCooldownSeconds: number,
  drones: readonly FoundryAttackDroneModel[]
): FoundryAttackProjectileModel {
  const sourceDrones = projectile.droneSourceId
    ? drones.filter((drone) => drone.sourceId === projectile.droneSourceId)
    : [];
  const sourceDrone =
    sourceDrones[(waveIndex + 1 + sourceProjectileIndex) % Math.max(1, sourceDrones.length)] ??
    null;
  const startX = sourceDrone ? (sourceDrone.xPercent / 100) * COMBAT_ARENA_WIDTH : projectile.x;
  const endTravelSeconds = getProjectileTravelSeconds(durationSeconds, projectile.tags);
  const endX = startX + projectile.vx * endTravelSeconds;
  const endRise = -projectile.vy * endTravelSeconds;
  const restProgress = (waveIndex + 1) / (waveCopies + 1);
  const performanceProgress = 0.58;
  const restTravelSeconds = getProjectileTravelSeconds(
    flightSeconds * restProgress,
    projectile.tags
  );
  const performanceTravelSeconds = getProjectileTravelSeconds(
    flightSeconds * performanceProgress,
    projectile.tags
  );
  const restX = startX + projectile.vx * restTravelSeconds;
  const restRise = -projectile.vy * restTravelSeconds;
  const performanceX = startX + projectile.vx * performanceTravelSeconds;
  const performanceRise = -projectile.vy * performanceTravelSeconds;
  const missile = isMissileProjectile(projectile.tags);
  const phased = isPhaseProjectile(projectile.tags);
  const laserKind = getLaserProjectileKind(projectile.tags, projectile.laserKind);
  const flightKind =
    projectile.visualKind === 'heatShot'
      ? 'heatShot'
      : phased
        ? missile
          ? 'phaseMissile'
          : 'phase'
        : missile
          ? 'missile'
          : 'ballistic';
  return {
    id: `preview-shot-${waveIndex}-${projectileIndex}`,
    projectileIndex,
    waveIndex,
    x: startX,
    vx: projectile.vx,
    vy: projectile.vy,
    radius: projectile.radius,
    damage: projectile.damage,
    ttl: projectile.ttl,
    tags: projectile.tags,
    arcChargeKind: getArcChargeProfile(projectile)?.kind ?? null,
    flightKind,
    laserKind,
    headingDegrees: (Math.atan2(projectile.vx, -projectile.vy) * 180) / Math.PI,
    startXPercent: toAttackPreviewHorizontalPercent(startX),
    startBottomPercent: sourceDrone?.bottomPercent ?? 10,
    endXPercent: toAttackPreviewHorizontalPercent(endX),
    endRisePercent: toAttackPreviewVerticalPercent(endRise),
    restXPercent: toAttackPreviewHorizontalPercent(restX),
    restRisePercent: toAttackPreviewVerticalPercent(restRise),
    performanceXPercent: toAttackPreviewHorizontalPercent(performanceX),
    performanceRisePercent: toAttackPreviewVerticalPercent(performanceRise),
    displayDiameterPercent: toAttackPreviewHorizontalPercent(Math.max(4, projectile.radius * 2)),
    durationSeconds,
    delaySeconds: -waveIndex * fireCooldownSeconds
  };
}

function createFoundryAttackDroneModels(
  specs: readonly DroneFollowerSpec[]
): FoundryAttackDroneModel[] {
  return specs.map((spec, index) => {
    const offset = getEscortFormationOffset(index, specs.length);
    return {
      id: spec.id,
      sourceId: spec.sourceId,
      label: spec.label,
      glyph: spec.glyph,
      color: spec.color,
      xPercent: toAttackPreviewHorizontalPercent(offset.x),
      bottomPercent: 32 + Math.min(5, Math.abs(offset.x) / 44),
      sizePercent: toAttackPreviewHorizontalPercent(spec.radius * 2.4)
    };
  });
}

function getResolutionModuleIds(resolution: EngineeringResolution): ShipModuleId[] {
  return resolution.loadout?.mounts.map((mount) => mount.moduleId) ?? [];
}

function toAttackPreviewHorizontalPercent(worldUnits: number): number {
  return (worldUnits / COMBAT_ARENA_WIDTH) * 100;
}

function toAttackPreviewVerticalPercent(worldUnits: number): number {
  return (worldUnits / FOUNDRY_ATTACK_PREVIEW_WORLD_HEIGHT) * 100;
}

export function createFoundryComponentStatModel(
  component: FoundryComponentInstance
): FoundryComponentStatModel {
  const module = getShipModuleById(component.moduleId);
  const delta = getComponentResourceDelta(component);
  return {
    slot: module.slot,
    power: module.powerDraw + delta.power,
    heat: module.heat + delta.heat,
    mass: module.mass + delta.mass,
    command: module.commandDraw + delta.command,
    instability: component.instability,
    circuit: getComponentCircuitCapacity(component),
    salvage: component.salvageValue
  };
}

export function compareFoundryComponents(
  candidate: FoundryComponentInstance,
  installed: FoundryComponentInstance | null
): FoundryInstallComparisonModel {
  const candidateStats = createFoundryComponentStatModel(candidate);
  const installedStats = installed
    ? createFoundryComponentStatModel(installed)
    : { power: 0, heat: 0, mass: 0, command: 0, instability: 0, circuit: 0 };
  const power = candidateStats.power - installedStats.power;
  const heat = candidateStats.heat - installedStats.heat;
  const mass = candidateStats.mass - installedStats.mass;
  const command = candidateStats.command - installedStats.command;
  const instability = candidateStats.instability - installedStats.instability;
  const circuit = candidateStats.circuit - installedStats.circuit;
  const burden = power + heat + mass + command + instability - circuit;
  const circuitLabel = candidateStats.slot === 'primary' ? ` S${formatSigned(circuit)}` : '';
  return {
    power,
    heat,
    mass,
    command,
    instability,
    circuit,
    tone: burden < 0 ? 'improved' : burden > 0 ? 'declined' : 'same',
    label: `P${formatSigned(power)} H${formatSigned(heat)} M${formatSigned(mass)} C${formatSigned(
      command
    )} !${formatSigned(instability)}${circuitLabel}`
  };
}

function createCircuitMeter(
  live: number,
  capacity: number,
  committedCapacity: number
): FoundryMeterModel {
  const delta = capacity - committedCapacity;
  const tone: FoundryComparisonTone =
    live > capacity ? 'danger' : delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'same';
  return {
    id: 'circuit',
    glyph: 'S',
    label: 'Weapon circuit',
    value: live,
    capacity,
    committedValue: committedCapacity,
    ratio: clamp01(live / Math.max(1, capacity)),
    delta,
    tone,
    ariaLabel: `Primary weapon circuit ${live} live of ${capacity}${delta === 0 ? ', unchanged capacity' : `, ${formatSigned(delta)} capacity from committed`}`
  };
}

function createCapacityMeter(
  id: FoundryMeterModel['id'],
  glyph: string,
  label: string,
  value: number,
  capacity: number,
  committedValue: number
): FoundryMeterModel {
  const delta = value - committedValue;
  const tone: FoundryComparisonTone =
    value > capacity ? 'danger' : delta < 0 ? 'improved' : delta > 0 ? 'declined' : 'same';
  return {
    id,
    glyph,
    label,
    value,
    capacity,
    committedValue,
    ratio: clamp01(value / Math.max(1, capacity)),
    delta,
    tone,
    ariaLabel: `${label} ${value} of ${capacity}${delta === 0 ? ', unchanged' : `, ${formatSigned(delta)} from committed`}`
  };
}

function createAttackStat(
  id: FoundryAttackStatModel['id'],
  glyph: string,
  label: string,
  value: number,
  committedValue: number,
  lowerIsBetter: boolean,
  digits: number
): FoundryAttackStatModel {
  const delta = value - committedValue;
  const benefitDelta = lowerIsBetter ? -delta : delta;
  const tone: FoundryComparisonTone =
    Math.abs(delta) < 0.001 ? 'same' : benefitDelta > 0 ? 'improved' : 'declined';
  const displayValue = value.toFixed(digits);
  return {
    id,
    glyph,
    label,
    value,
    committedValue,
    ratio: clamp01(value / ATTACK_CAPS[id]),
    delta,
    tone,
    displayValue,
    ariaLabel: `${label} ${displayValue}${delta === 0 ? ', unchanged' : `, ${formatSigned(delta)} from committed`}`
  };
}

function createTraitModels(
  resolution: EngineeringResolution,
  procBudget: number
): FoundryTraitModel[] {
  const effects = resolution.effects;
  return [
    effects.extraProjectiles > 0
      ? { glyph: '+', label: 'Extra fire', value: String(effects.extraProjectiles) }
      : null,
    effects.convergence > 0
      ? { glyph: '⌖', label: 'Converge', value: `${Math.round(effects.convergence * 100)}%` }
      : null,
    effects.heatVentMultiplier > 1
      ? { glyph: '▽', label: 'Vent', value: `${effects.heatVentMultiplier.toFixed(2)}×` }
      : null,
    effects.damageTakenMultiplier < 1
      ? {
          glyph: '◇',
          label: 'Guard',
          value: `${Math.round((1 - effects.damageTakenMultiplier) * 100)}%`
        }
      : null,
    effects.bonusSalvagePerKill > 0
      ? { glyph: '$', label: 'Tithe', value: `+${effects.bonusSalvagePerKill}` }
      : null,
    { glyph: '↯', label: 'Proc', value: String(procBudget) }
  ].filter((trait): trait is FoundryTraitModel => trait !== null);
}

function getDraftPrimaryWeaponId(state: EngineeringState) {
  for (const mount of state.draft.mounts) {
    const component = state.draft.components.find(
      (candidate) => candidate.id === mount.componentId
    );
    if (!component) continue;
    const module = getShipModuleById(component.moduleId);
    if (module.slot === 'primary' && module.behavior.kind === 'weaponAdapter') {
      return module.behavior.weaponId;
    }
  }
  return null;
}

function requireLoadout(resolution: EngineeringResolution) {
  if (!resolution.loadout) throw new Error('Committed foundry state has no resolved loadout.');
  return resolution.loadout;
}

function requireResources(resolution: EngineeringResolution) {
  if (!resolution.resources) throw new Error('Committed foundry state has no resource envelope.');
  return resolution.resources;
}

function formatSigned(value: number): string {
  if (Math.abs(value) < 0.001) return '±0';
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
