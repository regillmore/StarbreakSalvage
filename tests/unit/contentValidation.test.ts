import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, type AchievementDefinition } from '../../src/content/achievements';
import {
  ACT_ROUTE_CONTRACTS,
  type ActRouteContractDefinition
} from '../../src/content/actRouteContracts';
import { ACT_DEFINITIONS, type ActDefinition } from '../../src/content/acts';
import { BACKGROUNDS, type BackgroundDefinition } from '../../src/content/backgrounds';
import { BOSSES, type BossDefinition } from '../../src/content/bosses';
import { BOARDING_CONTRACTS, type BoardingContractDefinition } from '../../src/content/boarding';
import { CARRIERS, CARRIER_FACILITIES } from '../../src/content/carriers';
import { validateContent } from '../../src/content/contentValidation';
import { ENEMY_FORMATIONS, type EnemyFormationDefinition } from '../../src/content/enemyFormations';
import { ENEMY_VARIANTS, type EnemyVariantDefinition } from '../../src/content/enemyVariants';
import {
  ENVIRONMENT_OBJECT_DEFINITIONS,
  type EnvironmentObjectDefinition
} from '../../src/content/environmentObjects';
import {
  EXPEDITION_NODE_PROFILES,
  type ExpeditionNodeProfileDefinition
} from '../../src/content/expeditions';
import {
  MISSION_STAGE_PROFILES,
  type MissionStageProfileDefinition
} from '../../src/content/missions';
import {
  MISSION_CONTRACTS,
  MISSION_OBJECTIVES,
  type MissionContractDefinition,
  type MissionObjectiveDefinition
} from '../../src/content/objectives';
import { FACTIONS, type FactionDefinition } from '../../src/content/factions';
import { HAZARD_ZONE_DEFINITIONS, type HazardZoneDefinition } from '../../src/content/hazardZones';
import {
  ACTIVE_ITEMS,
  ITEM_POOL_WEIGHT_PROFILES,
  ITEM_ARCHETYPES,
  ITEMS,
  REWARD_POOLS,
  type ItemDefinition,
  type ItemPoolWeightProfileDefinition,
  type RewardPoolDefinition
} from '../../src/content/items';
import { SECTORS, type SectorDefinition } from '../../src/content/sectors';
import { SHIPS, type ShipDefinition } from '../../src/content/ships';
import { UNLOCKS, type UnlockDefinition } from '../../src/content/unlocks';
import { UPGRADES, type UpgradeDefinition } from '../../src/content/upgrades';
import { WEAPONS, type WeaponDefinition } from '../../src/content/weapons';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../../src/game/ItemHooks';
import type { ItemFamilyGateDefinition } from '../../src/game/UnlockGates';

const baseItem = ITEMS[0] as ItemDefinition;
const baseBackground = BACKGROUNDS[0] as BackgroundDefinition;
const baseFaction = FACTIONS[0] as FactionDefinition;
const baseBoss = BOSSES[0] as BossDefinition;
const baseBoardingContract = BOARDING_CONTRACTS[0] as BoardingContractDefinition;
const baseEnemyFormation = ENEMY_FORMATIONS[0] as EnemyFormationDefinition;
const baseEnemyVariant = ENEMY_VARIANTS[0] as EnemyVariantDefinition;
const baseEnvironmentObject = ENVIRONMENT_OBJECT_DEFINITIONS[0] as EnvironmentObjectDefinition;
const baseExpeditionNodeProfile = EXPEDITION_NODE_PROFILES[0] as ExpeditionNodeProfileDefinition;
const baseMissionStageProfile = MISSION_STAGE_PROFILES[0] as MissionStageProfileDefinition;
const baseMissionObjective = MISSION_OBJECTIVES[0] as MissionObjectiveDefinition;
const baseMissionContract = MISSION_CONTRACTS[0] as MissionContractDefinition;
const baseHazardZone = HAZARD_ZONE_DEFINITIONS[0] as HazardZoneDefinition;
const baseSector = SECTORS[0] as SectorDefinition;
const baseShip = SHIPS[0] as ShipDefinition;
const baseUnlock = UNLOCKS[0] as UnlockDefinition;
const baseUpgrade = UPGRADES[0] as UpgradeDefinition;
const baseWeapon = WEAPONS[0] as WeaponDefinition;
const baseAchievement = ACHIEVEMENTS[0] as AchievementDefinition;
const baseAct = ACT_DEFINITIONS[0] as ActDefinition;
const baseActRouteContract = ACT_ROUTE_CONTRACTS[0] as ActRouteContractDefinition;

describe('validateContent', () => {
  it('accepts the shipped item and reward content', () => {
    expect(validateContent()).toEqual([]);
  });

  it('ships the current content breadth targets', () => {
    const rewardedItemIds = new Set(REWARD_POOLS.flatMap((pool) => pool.itemIds));
    const representedArchetypes = ITEM_ARCHETYPES.filter((archetype) =>
      ACTIVE_ITEMS.some(
        (item) =>
          rewardedItemIds.has(item.id) && item.tags.some((tag) => archetype.tags.includes(tag))
      )
    );

    expect(ITEMS).toHaveLength(65);
    expect(ACTIVE_ITEMS).toHaveLength(60);
    expect(ACT_DEFINITIONS).toHaveLength(3);
    expect(ACT_ROUTE_CONTRACTS.length).toBeGreaterThanOrEqual(13);
    expect(FACTIONS).toHaveLength(4);
    expect(BACKGROUNDS).toHaveLength(11);
    expect(CARRIERS).toHaveLength(3);
    expect(CARRIER_FACILITIES).toHaveLength(7);
    expect(ENVIRONMENT_OBJECT_DEFINITIONS.length).toBeGreaterThanOrEqual(8);
    expect(EXPEDITION_NODE_PROFILES.length).toBeGreaterThanOrEqual(6);
    expect(MISSION_STAGE_PROFILES.length).toBeGreaterThanOrEqual(8);
    expect(MISSION_OBJECTIVES).toHaveLength(11);
    expect(MISSION_CONTRACTS).toHaveLength(15);
    expect(BOARDING_CONTRACTS).toHaveLength(6);
    expect(UPGRADES.length).toBeGreaterThanOrEqual(6);
    expect(representedArchetypes).toHaveLength(ITEM_ARCHETYPES.length);
    expect(representedArchetypes.length).toBeGreaterThanOrEqual(6);
  });

  it('rejects invalid expedition node profiles', () => {
    const errors = validateContent({
      expeditionNodeProfiles: [
        baseExpeditionNodeProfile,
        { ...baseExpeditionNodeProfile, label: 'Duplicate profile' },
        {
          ...baseExpeditionNodeProfile,
          id: 'expedition_profile_invalid',
          label: '',
          nodeKind: 'ambush',
          legKind: 'interlude',
          pressureBand: 'impossible',
          duration: { minSeconds: 20, targetSeconds: 10, maxSeconds: 5 },
          entryRule: 'teleport',
          completionRule: 'never',
          transitionPolicy: 'dropState'
        } as unknown as ExpeditionNodeProfileDefinition
      ]
    });

    expect(errors).toContain(
      `Duplicate expedition node profile id: ${baseExpeditionNodeProfile.id}`
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid must have a label'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid node kind: ambush'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid leg kind: interlude'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid pressure band: impossible'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid must order duration bounds'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid entry rule: teleport'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid completion rule: never'
    );
    expect(errors).toContain(
      'Expedition node profile expedition_profile_invalid has invalid transition policy: dropState'
    );
  });

  it('rejects invalid mission stage profiles and carry contracts', () => {
    const errors = validateContent({
      missionStageProfiles: [
        ...MISSION_STAGE_PROFILES,
        { ...baseMissionStageProfile, label: 'Duplicate profile' },
        {
          ...baseMissionStageProfile,
          id: 'mission_invalid',
          label: '',
          kind: 'teleport',
          carry: {
            build: 'drop',
            hull: 'discard',
            resources: 'drop',
            routeContext: 'carry',
            scrollWorld: 'teleport'
          },
          world: null
        } as unknown as MissionStageProfileDefinition
      ]
    });

    expect(errors).toContain(`Duplicate mission stage profile id: ${baseMissionStageProfile.id}`);
    expect(errors).toContain('Mission stage profile mission_invalid must have a label');
    expect(errors).toContain(
      'Mission stage profile mission_invalid has invalid stage kind: teleport'
    );
    expect(errors).toContain(
      'Mission stage profile mission_invalid must preserve build and resources'
    );
    expect(errors).toContain(
      'Mission stage profile mission_invalid has invalid hull carry policy: discard'
    );
    expect(errors).toContain(
      'Mission stage profile mission_invalid has invalid scroll-world policy: teleport'
    );
  });

  it('rejects impossible objective grammar and mission anthology references', () => {
    const invalidObjective = {
      ...baseMissionObjective,
      id: 'objective_invalid',
      label: '',
      verb: 'waiting',
      cleanupPolicy: 'leakEverything',
      partialSuccessThreshold: 2,
      clauses: [
        {
          id: 'bad',
          metric: 'unknownMetric',
          comparison: 'equals',
          target: -1,
          label: '',
          required: false
        }
      ],
      successCopy: '',
      partialSuccessCopy: '',
      failureCopy: ''
    } as unknown as MissionObjectiveDefinition;
    const invalidContract = {
      ...baseMissionContract,
      id: 'contract_invalid',
      title: '',
      primaryObjectiveId: 'objective_missing',
      optionalObjectiveId: 'objective_missing_optional',
      eligibleActIds: ['act_missing'],
      branchPolicy: 'never',
      failurePolicy: 'corruptRun',
      factionPolicy: 'unknownFaction',
      crewPolicy: 'eraseCrew',
      outcomeExits: {
        success: 'nowhere',
        partialSuccess: 'branch',
        failure: 'relief'
      },
      reliefCopy: '',
      routePreview: '',
      rewardPolicy: {
        ...baseMissionContract.rewardPolicy,
        success: {
          choiceBonus: -1,
          creditBonus: -1,
          salvageBonus: -1,
          biasTags: ['invalid-tag']
        }
      }
    } as unknown as MissionContractDefinition;
    const errors = validateContent({
      missionObjectives: [...MISSION_OBJECTIVES, baseMissionObjective, invalidObjective],
      missionContracts: [...MISSION_CONTRACTS, baseMissionContract, invalidContract]
    });

    expect(errors).toContain(`Duplicate mission objective id: ${baseMissionObjective.id}`);
    expect(errors).toContain('Mission objective objective_invalid has invalid verb: waiting');
    expect(errors).toContain(
      'Mission objective objective_invalid has invalid cleanup policy: leakEverything'
    );
    expect(errors).toContain(
      'Mission objective objective_invalid must have at least one required clause'
    );
    expect(errors).toContain(`Duplicate mission contract id: ${baseMissionContract.id}`);
    expect(errors).toContain(
      'Mission contract contract_invalid references missing primary objective: objective_missing'
    );
    expect(errors).toContain(
      'Mission contract contract_invalid references missing act: act_missing'
    );
    expect(errors).toContain('Mission contract contract_invalid has invalid success reward rule');
    expect(errors).toContain('Mission contract contract_invalid has invalid success exit: nowhere');
    expect(errors).toContain(
      'Mission contract contract_invalid reward references invalid tag: invalid-tag'
    );
  });

  it('rejects boarding contracts with unresolved or mismatched mission objectives', () => {
    const missingObjectiveContract = {
      ...baseBoardingContract,
      id: 'boarding_missing_objective',
      objectiveId: 'objective_missing'
    };
    const mismatchedVerbContract = {
      ...baseBoardingContract,
      id: 'boarding_mismatched_verb',
      objectiveId: baseMissionObjective.id,
      objectiveVerb: 'scan'
    } as BoardingContractDefinition;
    const errors = validateContent({
      boardingContracts: [
        ...BOARDING_CONTRACTS,
        baseBoardingContract,
        missingObjectiveContract,
        mismatchedVerbContract
      ]
    });

    expect(errors).toContain(`Duplicate boarding contract id: ${baseBoardingContract.id}`);
    expect(errors).toContain(
      'Boarding contract boarding_missing_objective references missing objective: objective_missing'
    );
    expect(errors).toContain(
      `Boarding contract boarding_mismatched_verb objective verb scan does not match ${baseMissionObjective.id}: ${baseMissionObjective.verb}`
    );
  });

  it('rejects invalid act definitions', () => {
    const errors = validateContent({
      acts: [
        baseAct,
        {
          ...baseAct,
          label: 'Duplicate Act'
        },
        {
          ...baseAct,
          id: 'act_missing',
          order: 0,
          label: '',
          shortLabel: '',
          summary: '',
          sectorBudget: {
            plannedSectors: 5,
            minSectors: 4,
            maxSectors: 2
          },
          preferredSectorIds: ['sector_missing'],
          routeGrammar: {
            allowedKinds: [],
            guaranteedKinds: ['shop', 'warp'],
            summary: ''
          },
          rewardTier: 'mythic',
          pressureTier: 'cruel',
          bossGate: {
            kind: 'raid',
            label: '',
            required: true
          },
          transition: {
            kind: 'interActJunction',
            label: '',
            nextActId: 'act_missing'
          }
        } as unknown as ActDefinition
      ]
    });

    expect(errors).toContain(`Duplicate act id: ${baseAct.id}`);
    expect(errors).toContain('Act act_missing must have positive order');
    expect(errors).toContain('Act act_missing must have a label');
    expect(errors).toContain('Act act_missing must have a short label');
    expect(errors).toContain('Act act_missing must have a summary');
    expect(errors).toContain('Act act_missing sector budget must order min/max sectors');
    expect(errors).toContain(
      'Act act_missing sector budget plannedSectors must sit between min and max'
    );
    expect(errors).toContain('Act act_missing has invalid preferred sector: sector_missing');
    expect(errors).toContain('Act act_missing route grammar must allow at least one route');
    expect(errors).toContain('Act act_missing route grammar has invalid guaranteed route: warp');
    expect(errors).toContain(
      'Act act_missing route grammar guaranteed route must also be allowed: shop'
    );
    expect(errors).toContain('Act act_missing route grammar must have a summary');
    expect(errors).toContain('Act act_missing has invalid reward tier: mythic');
    expect(errors).toContain('Act act_missing has invalid pressure tier: cruel');
    expect(errors).toContain('Act act_missing has invalid boss gate kind: raid');
    expect(errors).toContain('Act act_missing boss gate must have a label');
    expect(errors).toContain('Act act_missing transition must have a label');
    expect(errors).toContain('Act act_missing transition cannot target itself');
  });

  it('rejects invalid act route contracts', () => {
    const errors = validateContent({
      actRouteContracts: [
        baseActRouteContract,
        {
          ...baseActRouteContract,
          label: 'Duplicate Contract'
        },
        {
          ...baseActRouteContract,
          id: 'act2_missing',
          actId: 'act_missing',
          kind: 'warp',
          label: '',
          routeCardCopy: '',
          environmentalPressureHint: '',
          rewardTierHint: '',
          pressureHint: '',
          tags: ['missing_tag'],
          sectorFit: {
            allowedSectorIds: ['sector_missing'],
            preferredSectorIds: ['sector_core_wreck']
          },
          factionFit: ['faction_missing'],
          backgroundHooks: ['background_missing'],
          objectiveFamilies: ['escort'],
          requiredUnlockIds: ['unlock_missing', 'unlock_missing'],
          weight: 0,
          riskOffset: 5
        } as unknown as ActRouteContractDefinition
      ]
    });

    expect(errors).toContain(`Duplicate act route contract id: ${baseActRouteContract.id}`);
    expect(errors).toContain('Act route contract act2_missing references missing act: act_missing');
    expect(errors).toContain('Act route contract act2_missing has invalid route kind: warp');
    expect(errors).toContain('Act route contract act2_missing must have a label');
    expect(errors).toContain('Act route contract act2_missing must have route card copy');
    expect(errors).toContain(
      'Act route contract act2_missing must have an environmental pressure hint'
    );
    expect(errors).toContain('Act route contract act2_missing must have a reward tier hint');
    expect(errors).toContain('Act route contract act2_missing must have a pressure hint');
    expect(errors).toContain('Act route contract act2_missing has invalid route tag: missing_tag');
    expect(errors).toContain(
      'Act route contract act2_missing sector fit has invalid allowed sector: sector_missing'
    );
    expect(errors).toContain(
      'Act route contract act2_missing preferred sector must also be allowed: sector_core_wreck'
    );
    expect(errors).toContain(
      'Act route contract act2_missing has invalid faction fit: faction_missing'
    );
    expect(errors).toContain(
      'Act route contract act2_missing has invalid background hook: background_missing'
    );
    expect(errors).toContain(
      'Act route contract act2_missing has invalid objective family: escort'
    );
    expect(errors).toContain(
      'Act route contract act2_missing references missing unlock: unlock_missing'
    );
    expect(errors).toContain(
      'Act route contract act2_missing has duplicate required unlock: unlock_missing'
    );
    expect(errors).toContain('Act route contract act2_missing must have positive weight');
    expect(errors).toContain(
      'Act route contract act2_missing riskOffset must stay between -2 and 3'
    );
  });

  it('rejects duplicate faction ids and missing boss faction references', () => {
    const errors = validateContent({
      factions: [baseFaction, { ...baseFaction, name: 'Duplicate Court' }],
      bosses: [
        {
          ...baseBoss,
          factionId: 'faction_missing'
        } as unknown as BossDefinition
      ]
    });

    expect(errors).toContain(`Duplicate faction id: ${baseFaction.id}`);
    expect(errors).toContain(
      'Boss boss_auditor_drone_xl references missing faction: faction_missing'
    );
  });

  it('rejects invalid faction behavior metadata', () => {
    const errors = validateContent({
      factions: [
        {
          ...baseFaction,
          enemyPattern: 'teleportMine',
          visualShape: 'box',
          summary: ''
        } as unknown as FactionDefinition
      ]
    });

    expect(errors).toContain(`Faction ${baseFaction.id} has invalid enemy pattern: teleportMine`);
    expect(errors).toContain(`Faction ${baseFaction.id} has invalid visual shape: box`);
    expect(errors).toContain(`Faction ${baseFaction.id} must have behavior notes`);
  });

  it('rejects invalid enemy role metadata', () => {
    const errors = validateContent({
      factions: [
        {
          ...baseFaction,
          enemyRole: {
            ...baseFaction.enemyRole,
            classId: 'class_missing',
            role: 'raider',
            pressureType: 'fog',
            movementFamily: 'warp',
            attackFamily: 'laserSweep',
            variantEligibility: [],
            formationEligibility: ['orbit'],
            readabilityTier: 'invisible',
            factionFit: 'alien',
            objectivePolicy: 'free',
            debugLabel: ''
          }
        } as unknown as FactionDefinition
      ]
    });

    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid class id: class_missing`
    );
    expect(errors).toContain(`Faction ${baseFaction.id} enemy role has invalid role: raider`);
    expect(errors).toContain(`Faction ${baseFaction.id} enemy role has invalid pressure type: fog`);
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid movement family: warp`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid attack family: laserSweep`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role attack family must match current enemy pattern`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role must list at least one variant eligibility`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid formation eligibility: orbit`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role must allow solo formation eligibility`
    );
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid readability tier: invisible`
    );
    expect(errors).toContain(`Faction ${baseFaction.id} enemy role has invalid faction fit: alien`);
    expect(errors).toContain(
      `Faction ${baseFaction.id} enemy role has invalid objective policy: free`
    );
    expect(errors).toContain(`Faction ${baseFaction.id} enemy role must have a debug label`);
  });

  it('rejects duplicate enemy class ids', () => {
    const ledgerFaction = FACTIONS[1] as FactionDefinition;
    const errors = validateContent({
      factions: [
        baseFaction,
        {
          ...ledgerFaction,
          enemyRole: {
            ...ledgerFaction.enemyRole,
            classId: baseFaction.enemyRole.classId
          }
        }
      ]
    });

    expect(errors).toContain(`Duplicate enemy class id: ${baseFaction.enemyRole.classId}`);
  });

  it('rejects invalid enemy variant definitions', () => {
    const errors = validateContent({
      enemyVariants: [
        baseEnemyVariant,
        {
          ...baseEnemyVariant,
          name: 'Duplicate Armored'
        },
        {
          ...baseEnemyVariant,
          id: 'variant_missing',
          name: '',
          debugLabel: '',
          summary: '',
          eligibility: ['baseline', 'moon'],
          minSectorIndex: -1,
          weight: 0,
          allowedRoles: ['raider'],
          allowedFactions: ['faction_missing'],
          encounterTypes: ['surprise'],
          hullBonus: 3,
          fireDelayMultiplier: 0.5,
          driftMultiplier: 2,
          radiusScale: 0.5,
          bonusSalvage: 5,
          cue: {
            label: 'LONGER',
            fill: 'orange',
            stroke: '#ffffff'
          }
        } as unknown as EnemyVariantDefinition
      ]
    });

    expect(errors).toContain(`Duplicate enemy variant id: ${baseEnemyVariant.id}`);
    expect(errors).toContain('Enemy variant variant_missing has invalid id');
    expect(errors).toContain('Enemy variant variant_missing must have a name');
    expect(errors).toContain('Enemy variant variant_missing must have a debug label');
    expect(errors).toContain('Enemy variant variant_missing must have a summary');
    expect(errors).toContain('Enemy variant variant_missing must not use baseline eligibility');
    expect(errors).toContain('Enemy variant variant_missing has invalid eligibility: moon');
    expect(errors).toContain('Enemy variant variant_missing must have non-negative minSectorIndex');
    expect(errors).toContain('Enemy variant variant_missing must have positive weight');
    expect(errors).toContain('Enemy variant variant_missing must keep hullBonus at or below 2');
    expect(errors).toContain(
      'Enemy variant variant_missing must keep fireDelayMultiplier between 0.75 and 1.25'
    );
    expect(errors).toContain(
      'Enemy variant variant_missing must keep driftMultiplier between 0.75 and 1.45'
    );
    expect(errors).toContain(
      'Enemy variant variant_missing must keep radiusScale between 0.85 and 1.2'
    );
    expect(errors).toContain('Enemy variant variant_missing must keep bonusSalvage at or below 4');
    expect(errors).toContain('Enemy variant variant_missing has invalid allowed role: raider');
    expect(errors).toContain(
      'Enemy variant variant_missing has invalid allowed faction: faction_missing'
    );
    expect(errors).toContain('Enemy variant variant_missing has invalid encounter type: surprise');
    expect(errors).toContain(
      'Enemy variant variant_missing cue label must be 4 characters or fewer'
    );
    expect(errors).toContain('Enemy variant variant_missing cue must have fill as a #RRGGBB color');
    expect(errors).toContain(
      'Enemy variant variant_missing must match at least one current faction role'
    );
  });

  it('rejects invalid enemy formation definitions', () => {
    const errors = validateContent({
      enemyFormations: [
        baseEnemyFormation,
        {
          ...baseEnemyFormation,
          name: 'Duplicate Wedge'
        },
        {
          ...baseEnemyFormation,
          id: 'formation_missing',
          shape: 'orbit',
          name: '',
          debugLabel: '',
          summary: '',
          minSectorIndex: -1,
          minMembers: 0,
          maxMembers: 5,
          weight: 0,
          clearBonusSalvage: 5,
          spacing: 12,
          entryStyle: 'teleport',
          breakCondition: 'panic',
          cleanupPolicy: 'optional',
          encounterTypes: ['surprise'],
          preferredRoles: ['raider'],
          members: [
            {
              role: 'raider',
              xOffset: 500,
              targetYOffset: 200,
              delaySeconds: 2,
              distanceOffset: 99
            }
          ],
          cue: {
            label: 'LONGER',
            stroke: 'cyan'
          }
        } as unknown as EnemyFormationDefinition
      ]
    });

    expect(errors).toContain(`Duplicate enemy formation id: ${baseEnemyFormation.id}`);
    expect(errors).toContain('Enemy formation formation_missing has invalid id');
    expect(errors).toContain('Enemy formation formation_missing has invalid shape: orbit');
    expect(errors).toContain('Enemy formation formation_missing must have a name');
    expect(errors).toContain('Enemy formation formation_missing must have a debug label');
    expect(errors).toContain('Enemy formation formation_missing must have a summary');
    expect(errors).toContain(
      'Enemy formation formation_missing must have non-negative minSectorIndex'
    );
    expect(errors).toContain('Enemy formation formation_missing must have positive minMembers');
    expect(errors).toContain('Enemy formation formation_missing must have positive weight');
    expect(errors).toContain(
      'Enemy formation formation_missing must keep clearBonusSalvage at or below 3'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing must define enough member slots for maxMembers'
    );
    expect(errors).toContain('Enemy formation formation_missing must keep spacing readable');
    expect(errors).toContain('Enemy formation formation_missing has invalid entry style: teleport');
    expect(errors).toContain(
      'Enemy formation formation_missing has invalid break condition: panic'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing has invalid cleanup policy: optional'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing cleanup policy must keep first-pass members as required targets'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing has invalid encounter type: surprise'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing has invalid preferred role: raider'
    );
    expect(errors).toContain('Enemy formation formation_missing member 1 has invalid role: raider');
    expect(errors).toContain(
      'Enemy formation formation_missing member 1 must keep xOffset within fixed-arena bounds'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing member 1 must keep targetYOffset within readable bounds'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing member 1 must keep delaySeconds between 0 and 0.75'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing member 1 must keep distanceOffset between 0 and 72'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing cue label must be 4 characters or fewer'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing cue must have stroke as a #RRGGBB color'
    );
    expect(errors).toContain(
      'Enemy formation formation_missing must match at least one current faction formation eligibility'
    );
  });

  it('rejects invalid destructible and obstacle definitions', () => {
    const errors = validateContent({
      environmentObjects: [
        baseEnvironmentObject,
        {
          ...baseEnvironmentObject,
          name: 'Duplicate Debris'
        },
        {
          ...baseEnvironmentObject,
          id: 'object_missing',
          kind: 'terrain',
          family: 'fog',
          name: '',
          debugLabel: '',
          summary: '',
          sectorFit: [],
          factionFit: ['faction_missing'],
          collision: {
            ...baseEnvironmentObject.collision,
            shape: 'triangle',
            width: 220,
            height: 150,
            radius: 12
          },
          durability: {
            hull: 13,
            armor: -1
          },
          damageInteraction: {
            destructible: true,
            allowedSources: ['gravity'],
            contactDamage: 2
          },
          objectivePolicy: 'required',
          reward: {
            policy: 'gems',
            minValue: 5,
            maxValue: 2,
            dropChance: 0
          },
          chain: {
            behavior: 'storm',
            radius: 0,
            damage: 0,
            maxTargets: 7
          },
          placement: {
            ...baseEnvironmentObject.placement,
            minDistanceRatio: 0.9,
            maxDistanceRatio: 0.2,
            safeLaneWidth: 500,
            xBands: [{ minXRatio: 0.8, maxXRatio: 0.3 }]
          },
          rendering: {
            cue: 'fogBlob',
            layer: 'overPlayer',
            normalColor: 'blue',
            highContrastColor: '#ffffff',
            fillAlpha: 0.5,
            strokeAlpha: 1
          },
          audioCues: {
            spawn: '',
            hit: '',
            destroy: ''
          },
          vfxCues: {
            spawn: '',
            hit: '',
            destroy: ''
          },
          accessibility: {
            reducedMotionVariant: 'blur',
            highContrastVariant: 'glow',
            label: ''
          }
        } as unknown as EnvironmentObjectDefinition
      ]
    });

    expect(errors).toContain(`Duplicate environment object id: ${baseEnvironmentObject.id}`);
    expect(errors).toContain('Environment object object_missing has invalid id');
    expect(errors).toContain('Environment object object_missing has invalid kind: terrain');
    expect(errors).toContain('Environment object object_missing has invalid family: fog');
    expect(errors).toContain('Environment object object_missing must have a name');
    expect(errors).toContain('Environment object object_missing must have a debug label');
    expect(errors).toContain('Environment object object_missing must have a summary');
    expect(errors).toContain('Environment object object_missing must list at least one sector fit');
    expect(errors).toContain(
      'Environment object object_missing has invalid faction fit: faction_missing'
    );
    expect(errors).toContain(
      'Environment object object_missing has invalid collision shape: triangle'
    );
    expect(errors).toContain(
      'Environment object object_missing collision non-circle must use radius 0'
    );
    expect(errors).toContain(
      'Environment object object_missing collision footprint is too large for readable lanes'
    );
    expect(errors).toContain(
      'Environment object object_missing durability must keep hull at or below 12'
    );
    expect(errors).toContain(
      'Environment object object_missing durability must have non-negative armor'
    );
    expect(errors).toContain(
      'Environment object object_missing damage interaction must keep contactDamage at or below 1'
    );
    expect(errors).toContain(
      'Environment object object_missing has invalid damage source: gravity'
    );
    expect(errors).toContain(
      'Environment object object_missing has invalid objective policy: required'
    );
    expect(errors).toContain('Environment object object_missing has invalid reward policy: gems');
    expect(errors).toContain(
      'Environment object object_missing reward must order positive value range'
    );
    expect(errors).toContain(
      'Environment object object_missing reward must have positive dropChance'
    );
    expect(errors).toContain('Environment object object_missing has invalid chain behavior: storm');
    expect(errors).toContain(
      'Environment object object_missing chain behavior must keep maxTargets at or below 6'
    );
    expect(errors).toContain(
      'Environment object object_missing placement must order distance ratios'
    );
    expect(errors).toContain(
      'Environment object object_missing placement safe lane is impossible with collision footprint'
    );
    expect(errors).toContain(
      'Environment object object_missing placement x band 1 must order x ratios'
    );
    expect(errors).toContain(
      'Environment object object_missing rendering has invalid cue: fogBlob'
    );
    expect(errors).toContain(
      'Environment object object_missing rendering has invalid layer: overPlayer'
    );
    expect(errors).toContain(
      'Environment object object_missing rendering must have normalColor as a #RRGGBB color'
    );
    expect(errors).toContain(
      'Environment object object_missing rendering must keep fillAlpha at or below 0.38'
    );
    expect(errors).toContain(
      'Environment object object_missing rendering must keep strokeAlpha at or below 0.95'
    );
    expect(errors).toContain('Environment object object_missing audio cues must define spawn cue');
    expect(errors).toContain('Environment object object_missing audio cues must define hit cue');
    expect(errors).toContain(
      'Environment object object_missing audio cues must define destroy cue'
    );
    expect(errors).toContain('Environment object object_missing vfx cues must define spawn cue');
    expect(errors).toContain(
      'Environment object object_missing accessibility has invalid reduced motion variant: blur'
    );
    expect(errors).toContain(
      'Environment object object_missing accessibility has invalid high contrast variant: glow'
    );
    expect(errors).toContain('Environment object object_missing accessibility must have a label');
  });

  it('requires ordered, readable proximity behavior for the discrete mine definition', () => {
    const mine = ENVIRONMENT_OBJECT_DEFINITIONS.find(
      (definition) => definition.id === 'proximity_mine'
    );

    if (!mine || !mine.proximity) {
      throw new Error('Expected the shipped proximity mine definition.');
    }

    const missing = validateContent({
      environmentObjects: [{ ...mine, proximity: undefined }]
    });
    const unordered = validateContent({
      environmentObjects: [
        {
          ...mine,
          proximity: {
            ...mine.proximity,
            triggerRadius: 120,
            blastRadius: 100,
            chainFuseSeconds: 0.7,
            damagedFuseSeconds: 0.6,
            fuseSeconds: 0.5
          }
        }
      ]
    });

    expect(missing).toContain('Environment object proximity_mine must define proximity behavior');
    expect(unordered).toContain(
      'Environment object proximity_mine proximity fuses must order chain, damaged, then proximity timing'
    );
    expect(unordered).toContain(
      'Environment object proximity_mine proximity blastRadius must exceed triggerRadius'
    );
  });

  it('rejects invalid hazard zone definitions', () => {
    const errors = validateContent({
      hazardZones: [
        baseHazardZone,
        {
          ...baseHazardZone,
          label: 'Duplicate Debris'
        },
        {
          ...baseHazardZone,
          id: 'hazard_missing',
          family: 'rift',
          label: '',
          debugLabel: '',
          summary: '',
          sectorFit: [],
          factionFit: ['faction_missing'],
          telegraphShape: 'spiral',
          activeDamageShape: 'circle',
          metrics: {
            sector: { widthRatio: 0.9, activeSpan: 0, telegraphLead: 0 },
            condition: { widthRatio: 0.04, activeSpan: 0, telegraphLead: 0 }
          },
          phase: { minTelegraphLead: 0, minActiveSpan: 0 },
          damage: 3,
          damageCooldownSeconds: 0.1,
          safeLane: { policy: 'pinch', minSafeWidthRatio: 0.9 },
          bossArenaPolicy: 'damageThrough',
          readability: {
            renderLayer: 'overBullets',
            collisionShape: 'circle',
            maxFillAlpha: 0.4,
            maxStrokeAlpha: 1,
            minTelegraphLead: 12,
            normalColor: 'orange',
            highContrastColor: '#ffffff',
            reducedMotionVariant: 'swirl',
            performanceVariant: 'dense'
          },
          behavior: {
            kind: 'vortex',
            warningCue: '',
            activeCue: '',
            motionScale: 1.4,
            activeDamageDutyCycle: 0.2,
            activePulseCount: 0,
            collisionBands: 5,
            patternDensity: 1.4
          }
        } as unknown as HazardZoneDefinition
      ]
    });

    expect(errors).toContain(`Duplicate hazard zone id: ${baseHazardZone.id}`);
    expect(errors).toContain('Hazard zone hazard_missing has invalid id');
    expect(errors).toContain('Hazard zone hazard_missing has invalid family: rift');
    expect(errors).toContain('Hazard zone hazard_missing must have a label');
    expect(errors).toContain('Hazard zone hazard_missing must have a debug label');
    expect(errors).toContain('Hazard zone hazard_missing must have a summary');
    expect(errors).toContain('Hazard zone hazard_missing must list at least one sector fit');
    expect(errors).toContain('Hazard zone hazard_missing has invalid faction fit: faction_missing');
    expect(errors).toContain('Hazard zone hazard_missing has invalid telegraph shape: spiral');
    expect(errors).toContain('Hazard zone hazard_missing has invalid active damage shape: circle');
    expect(errors).toContain(
      'Hazard zone hazard_missing sector metrics must keep widthRatio between 0.05 and 0.5'
    );
    expect(errors).toContain('Hazard zone hazard_missing must define pacing metrics');
    expect(errors).toContain('Hazard zone hazard_missing must keep damage at or below 2');
    expect(errors).toContain(
      'Hazard zone hazard_missing must keep damageCooldownSeconds at or above 0.2'
    );
    expect(errors).toContain('Hazard zone hazard_missing has invalid safe-lane policy: pinch');
    expect(errors).toContain(
      'Hazard zone hazard_missing safe lane cannot exceed remaining arena width'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing has invalid boss arena policy: damageThrough'
    );
    expect(errors).toContain('Hazard zone hazard_missing must settle before locked boss arenas');
    expect(errors).toContain(
      'Hazard zone hazard_missing readability has invalid render layer: overBullets'
    );
    expect(errors).toContain('Hazard zone hazard_missing readability must render under bullets');
    expect(errors).toContain(
      'Hazard zone hazard_missing readability has invalid collision shape: circle'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability must keep maxFillAlpha at or below 0.14'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability must keep maxStrokeAlpha at or below 0.95'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability minTelegraphLead must match phase metadata'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability must have normalColor as a #RRGGBB color'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability has invalid reduced motion variant: swirl'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing readability has invalid performance variant: dense'
    );
    expect(errors).toContain('Hazard zone hazard_missing behavior has invalid kind: vortex');
    expect(errors).toContain('Hazard zone hazard_missing behavior must have a warning cue');
    expect(errors).toContain('Hazard zone hazard_missing behavior must have an active cue');
    expect(errors).toContain(
      'Hazard zone hazard_missing behavior must have motionScale between 0 and 1'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing behavior must keep activeDamageDutyCycle at or above 0.45'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing behavior must have positive activePulseCount'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing behavior must keep collisionBands at or below 4'
    );
    expect(errors).toContain(
      'Hazard zone hazard_missing behavior must have patternDensity between 0 and 1'
    );
  });

  it('rejects invalid boss phase definitions', () => {
    const basePhase = baseBoss.phases[0];

    if (!basePhase) {
      throw new Error('Boss fixture is missing a phase.');
    }

    const errors = validateContent({
      bosses: [
        {
          ...baseBoss,
          phases: [
            {
              ...basePhase,
              startsAtHullRatio: 0.9,
              telegraphMultiplier: 0.5,
              patternSequence: []
            }
          ]
        }
      ] as unknown as readonly BossDefinition[]
    });

    expect(errors).toContain(`Boss ${baseBoss.id} must define at least two phases`);
    expect(errors).toContain(`Boss ${baseBoss.id} first phase must start at hull ratio 1`);
    expect(errors).toContain(
      `Boss ${baseBoss.id} phase ${basePhase.label} must keep readable telegraph timing`
    );
    expect(errors).toContain(
      `Boss ${baseBoss.id} phase ${basePhase.label} must define a pattern sequence`
    );
  });

  it('rejects duplicate unlock ids and missing achievement unlock references', () => {
    const errors = validateContent({
      unlocks: [baseUnlock, { ...baseUnlock, name: 'Duplicate Unlock' }],
      achievements: [
        {
          ...baseAchievement,
          unlockIds: ['unlock_missing']
        } as unknown as AchievementDefinition
      ]
    });

    expect(errors).toContain(`Duplicate unlock id: ${baseUnlock.id}`);
    expect(errors).toContain(
      'Achievement achievement_first_contract references missing unlock: unlock_missing'
    );
  });

  it('rejects invalid unlock archive metadata', () => {
    const errors = validateContent({
      unlocks: [
        {
          ...baseUnlock,
          kind: 'coupon',
          summary: '',
          effect: '',
          grants: []
        } as unknown as UnlockDefinition
      ]
    });

    expect(errors).toContain(`Unlock ${baseUnlock.id} has invalid kind: coupon`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must have a summary`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must describe its effect`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must list at least one grant`);
  });

  it('rejects invalid upgrade catalog metadata', () => {
    const errors = validateContent({
      upgrades: [
        baseUpgrade,
        {
          ...baseUpgrade,
          name: 'Duplicate Survey Rig'
        },
        {
          ...baseUpgrade,
          id: 'upgrade_seed_cartographer',
          category: 'thruster',
          iconKey: 'orb',
          effectKind: 'damageBoost',
          name: '',
          summary: '',
          effect: '',
          cost: 0,
          prerequisites: ['upgrade_missing', 'upgrade_seed_cartographer']
        }
      ] as unknown as readonly UpgradeDefinition[]
    });

    expect(errors).toContain(`Duplicate upgrade id: ${baseUpgrade.id}`);
    expect(errors).toContain('Upgrade upgrade_seed_cartographer has invalid category: thruster');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer has invalid icon: orb');
    expect(errors).toContain(
      'Upgrade upgrade_seed_cartographer has invalid effect kind: damageBoost'
    );
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have a name');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have a summary');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must describe its effect');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have positive cost');
    expect(errors).toContain(
      'Upgrade upgrade_seed_cartographer references missing prerequisite: upgrade_missing'
    );
    expect(errors).toContain('Upgrade upgrade_seed_cartographer cannot require itself');
  });

  it('rejects missing sector boss references', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          bossCandidates: ['boss_missing']
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field references missing boss: boss_missing'
    );
  });

  it('rejects missing sector background references', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          backgroundId: 'background_missing'
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field references missing background: background_missing'
    );
  });

  it('rejects invalid background strata', () => {
    const baseLayer = baseBackground.layers[0];

    if (!baseLayer) {
      throw new Error('Background fixture is missing a layer.');
    }

    const errors = validateContent({
      backgrounds: [
        {
          ...baseBackground,
          name: '',
          layers: [
            {
              ...baseLayer,
              id: '',
              kind: 'mattePainting',
              alpha: 1.4,
              parallax: 0,
              density: 0,
              priority: 9
            }
          ]
        }
      ] as unknown as readonly BackgroundDefinition[]
    });

    expect(errors).toContain(`Background ${baseBackground.id} must have a name`);
    expect(errors).toContain(`Background ${baseBackground.id} must define at least three strata`);
    expect(errors).toContain(`Background ${baseBackground.id} layer must have an id`);
    expect(errors).toContain(
      `Background ${baseBackground.id} layer  has invalid kind: mattePainting`
    );
    expect(errors).toContain(
      `Background ${baseBackground.id} layer  must have alpha between 0 and 1`
    );
    expect(errors).toContain(`Background ${baseBackground.id} layer  must have positive parallax`);
    expect(errors).toContain(`Background ${baseBackground.id} layer  must have positive density`);
    expect(errors).toContain(`Background ${baseBackground.id} layer  has invalid priority`);
  });

  it('rejects invalid sector objective data', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          objective: {
            ...baseSector.objective,
            kind: 'defeatBoss',
            waveCount: 0,
            spawnsPerWave: -1,
            bossGate: false
          }
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field objective must have a positive waveCount'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field objective must have a positive spawnsPerWave'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field defeatBoss objective must enable bossGate'
    );
  });

  it('rejects invalid sector encounter pacing data', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          encounterPacing: {
            waveWindowStartRatio: 0.8,
            waveWindowEndRatio: 0.2,
            waveDistanceRatios: [0.4, 1.2, 0.3],
            spawnSpacing: 0,
            firstSpawnXRatio: 1.2,
            flankXMinRatio: 0.9,
            flankXMaxRatio: 0.1,
            targetYMin: 180,
            targetYMax: 80
          }
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order wave window ratios'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must have positive spawnSpacing'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing waveDistanceRatios 2 must have ratio between 0 and 1'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order waveDistanceRatios'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must have firstSpawnXRatio between 0 and 1'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order flank x ratios'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order target y bounds'
    );
  });

  it('rejects duplicate item ids', () => {
    const errors = validateContent({
      items: [baseItem, { ...baseItem, name: 'Duplicate Capacitor' }]
    });

    expect(errors).toContain(`Duplicate item id: ${baseItem.id}`);
  });

  it('rejects missing ship weapon references and invalid ship stats', () => {
    const errors = validateContent({
      ships: [
        {
          ...baseShip,
          weapon: 'weapon_missing',
          stats: {
            ...baseShip.stats,
            maxHull: 0,
            specialInitialCharge: 2,
            bombCapacity: -1
          }
        }
      ] as unknown as readonly ShipDefinition[]
    });

    expect(errors).toContain(`Ship ${baseShip.id} references missing weapon: weapon_missing`);
    expect(errors).toContain(`Ship ${baseShip.id} stats must have positive maxHull`);
    expect(errors).toContain(
      `Ship ${baseShip.id} stats must have specialInitialCharge between 0 and 1`
    );
    expect(errors).toContain(`Ship ${baseShip.id} stats must have non-negative bombCapacity`);
  });

  it('rejects invalid ship appearance definitions', () => {
    const errors = validateContent({
      ships: [
        {
          ...baseShip,
          id: 'ship_drone_chaplain',
          appearance: undefined
        },
        {
          ...baseShip,
          appearance: {
            ...baseShip.appearance,
            silhouette: 'saucer',
            primaryColor: 'cyan',
            hudThemeKey: 'invalid_theme',
            weaponMounts: ['nose', 'invalid_mount']
          }
        }
      ] as unknown as readonly ShipDefinition[]
    });

    expect(errors).toContain('Ship ship_drone_chaplain must define appearance');
    expect(errors).toContain(`Ship ${baseShip.id} has invalid silhouette: saucer`);
    expect(errors).toContain(`Ship ${baseShip.id} has invalid HUD theme: invalid_theme`);
    expect(errors).toContain(`Ship ${baseShip.id} has invalid weapon mount: invalid_mount`);
    expect(errors).toContain(
      `Ship ${baseShip.id} appearance must have primaryColor as a #RRGGBB color`
    );
  });

  it('rejects invalid weapon definitions', () => {
    const errors = validateContent({
      weapons: [
        {
          ...baseWeapon,
          pattern: 'spiral',
          tags: ['not-a-real-tag'],
          damage: 0,
          heatVentPerSecond: 0
        }
      ] as unknown as readonly WeaponDefinition[]
    });

    expect(errors).toContain(`Weapon ${baseWeapon.id} has invalid pattern: spiral`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} has invalid tag: not-a-real-tag`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} must have positive damage`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} must have positive heatVentPerSecond`);
  });

  it('rejects invalid item tags', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          id: 'item_split_prism',
          tags: ['not-a-real-tag']
        } as unknown as ItemDefinition
      ],
      rewardPools: []
    });

    expect(errors).toContain('Item item_split_prism has invalid tag: not-a-real-tag');
  });

  it('rejects invalid item metadata', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          metadata: {
            family: 'saucer-build',
            sources: ['starter', 'starter', 'moon'],
            unlockTier: 'vip',
            implementationStatus: 'bridge',
            stacking: 'infinite',
            uiTags: ['laser', 'laser', 'sparkle']
          }
        } as unknown as ItemDefinition,
        {
          ...baseItem,
          id: 'item_vault_parasite',
          rarity: 'prototype',
          metadata: {
            ...baseItem.metadata,
            sources: ['starter'],
            implementationStatus: 'planned',
            implementationNote: ''
          }
        } as unknown as ItemDefinition
      ]
    });

    expect(errors).toContain('Item item_chain_arc_capacitor has invalid family: saucer-build');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid source: moon');
    expect(errors).toContain('Item item_chain_arc_capacitor has duplicate source: starter');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid unlock tier: vip');
    expect(errors).toContain('Item item_chain_arc_capacitor must explain bridge implementation');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid stacking mode: infinite');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid UI tag: sparkle');
    expect(errors).toContain('Item item_chain_arc_capacitor has duplicate UI tag: laser');
    expect(errors).toContain(
      'Item item_vault_parasite cannot be starter sourced while implementation is planned'
    );
    expect(errors).toContain(
      'Item item_vault_parasite cannot be starter sourced with prototype rarity'
    );
  });

  it('rejects item metadata that drifts from unlock gates and reward pools', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          metadata: {
            ...baseItem.metadata,
            sources: ['starter', 'unlock'],
            unlockTier: 'unlock'
          }
        }
      ],
      itemUnlocks: {
        item_chain_arc_capacitor: 'unlock_missing' as never
      }
    });

    expect(errors).toContain(
      'Item item_chain_arc_capacitor appears in combat pool without combat source'
    );
    expect(errors).toContain(
      'Item item_chain_arc_capacitor references missing unlock gate: unlock_missing'
    );
  });

  it('rejects missing item hook implementations', () => {
    const errors = validateContent({
      itemHookImplementations: {
        onFire: ITEM_HOOK_IMPLEMENTATIONS.onFire.filter((itemId) => itemId !== 'item_split_prism')
      }
    });

    expect(errors).toContain('Item item_split_prism declares onFire without an implementation');
  });

  it('validates newly registered item hook implementation entries', () => {
    const itemWithFutureHook = {
      ...baseItem,
      hooks: ['onGraze']
    } as unknown as ItemDefinition;
    const items = ITEMS.map((item) => (item.id === baseItem.id ? itemWithFutureHook : item));
    const missingErrors = validateContent({ items });
    const implementedErrors = validateContent({
      items,
      itemHookImplementations: {
        onGraze: [baseItem.id]
      }
    });

    expect(missingErrors).toContain(
      'Item item_chain_arc_capacitor declares onGraze without an implementation'
    );
    expect(implementedErrors).not.toContain(
      'Item item_chain_arc_capacitor declares onGraze without an implementation'
    );
  });

  it('rejects item content that is not present in any reward pool', () => {
    const errors = validateContent({
      rewardPools: [
        {
          id: 'starter',
          itemIds: ITEMS.filter((item) => item.id !== 'item_salvage_dividend_chip').map(
            (item) => item.id
          )
        }
      ]
    });

    expect(errors).toContain(
      'Item item_salvage_dividend_chip must appear in at least one reward pool'
    );
  });

  it('keeps retired compatibility items out of live reward pools', () => {
    const errors = validateContent({
      rewardPools: REWARD_POOLS.map((pool) =>
        pool.id === 'combat'
          ? { ...pool, itemIds: [...pool.itemIds, 'item_phase_breaker_subpoena'] }
          : pool
      )
    });

    expect(errors).toContain(
      'Retired item item_phase_breaker_subpoena must not appear in reward pool combat'
    );
    expect(errors).not.toContain(
      'Item item_phase_breaker_subpoena must appear in at least one reward pool'
    );
  });

  it('rejects missing reward pool item references', () => {
    const errors = validateContent({
      items: ITEMS,
      rewardPools: [
        {
          id: 'starter',
          itemIds: ['item_missing']
        }
      ] as unknown as readonly RewardPoolDefinition[]
    });

    expect(errors).toContain('Reward pool starter references missing item: item_missing');
  });

  it('validates bridged reward-pool source provenance', () => {
    const errors = validateContent({
      rewardPools: [
        {
          id: 'starterCore',
          itemIds: ['item_split_prism'],
          bridgeSources: ['combat', 'combat', 'moon']
        }
      ] as unknown as readonly RewardPoolDefinition[]
    });

    expect(errors).toContain('Reward pool starterCore bridges invalid source: moon');
    expect(errors).toContain('Reward pool starterCore bridges duplicate source: combat');
  });

  it('rejects invalid item pool weight profiles', () => {
    const baseProfile = ITEM_POOL_WEIGHT_PROFILES[0];

    if (!baseProfile) {
      throw new Error('Expected at least one item pool weight profile.');
    }

    const invalidProfile = {
      ...baseProfile,
      id: 'moon-market',
      label: '',
      poolIds: ['starter', 'missing_pool', 'starter'],
      sourceWeights: {
        starter: 1,
        moon: 2
      },
      rarityWeights: {
        common: 1,
        uncommon: 1,
        rare: 0.5,
        prototype: 0,
        cursed: 0,
        mythic: 1
      },
      familyWeights: {
        'laser-split': 1,
        saucer: 2
      },
      tagWeights: {
        laser: 1,
        sparkle: 2
      },
      biasWeight: 0
    } as unknown as ItemPoolWeightProfileDefinition;
    const errors = validateContent({
      itemPoolWeightProfiles: [invalidProfile]
    });

    expect(errors).toContain('Item pool profile moon-market has invalid id');
    expect(errors).toContain('Item pool profile moon-market must have a label');
    expect(errors).toContain(
      'Item pool profile moon-market references missing reward pool: missing_pool'
    );
    expect(errors).toContain('Item pool profile moon-market has duplicate reward pool: starter');
    expect(errors).toContain('Item pool profile moon-market has invalid source weight: moon');
    expect(errors).toContain('Item pool profile moon-market has invalid family weight: saucer');
    expect(errors).toContain('Item pool profile moon-market has invalid tag weight: sparkle');
    expect(errors).toContain('Item pool profile moon-market has invalid bias weight');
    expect(errors).toContain('Item pool profile moon-market has invalid rarity weight: mythic');
    expect(errors).toContain('Missing item pool profile: starter');
  });

  it('rejects invalid item family gates', () => {
    const invalidGate = {
      family: 'ghost-family',
      unlockId: 'missing_unlock',
      unlockTiers: ['advanced', 'advanced', 'mythic'],
      label: '',
      summary: '',
      lockedHint: ''
    } as unknown as ItemFamilyGateDefinition;
    const emptyGate = {
      family: 'laser-split',
      unlockId: baseUnlock.id,
      unlockTiers: ['unlock'],
      label: 'Empty Gate',
      summary: 'no matching item tier',
      lockedHint: 'no matching item tier'
    } as ItemFamilyGateDefinition;
    const errors = validateContent({
      itemFamilyGates: [invalidGate, emptyGate]
    });

    expect(errors).toContain('Item family gate ghost-family references invalid family');
    expect(errors).toContain(
      'Item family gate ghost-family references missing unlock: missing_unlock'
    );
    expect(errors).toContain('Item family gate ghost-family must have a label');
    expect(errors).toContain('Item family gate ghost-family must have summary text');
    expect(errors).toContain('Item family gate ghost-family must have locked hint text');
    expect(errors).toContain('Item family gate ghost-family has duplicate unlock tier: advanced');
    expect(errors).toContain('Item family gate ghost-family has invalid unlock tier: mythic');
    expect(errors).toContain('Item family gate ghost-family must match at least one item');
    expect(errors).toContain('Item family gate laser-split must match at least one item');
  });

  it('rejects empty reward pools', () => {
    const errors = validateContent({
      items: ITEMS,
      rewardPools: [
        {
          id: 'combat',
          itemIds: []
        }
      ]
    });

    expect(errors).toContain('Reward pool combat must not be empty');
  });
});
