import { getBossById, type BossId, type BossPatternId } from '../content/bosses';
import { getBackgroundById } from '../content/backgrounds';
import type {
  ActRouteContractDefinition,
  ActRouteContractId,
  ActRouteTag
} from '../content/actRouteContracts';
import type { FactionId } from '../content/factions';
import {
  SECTORS,
  type SectorDefinition,
  type SectorEncounterPacingDefinition,
  type SectorId
} from '../content/sectors';
import {
  type ShipAppearance,
  type ShipDefinition,
  type ShipId,
  type ShipStats,
  type WeaponId
} from '../content/ships';
import type { UnlockId } from '../content/unlocks';
import type { UpgradeId } from '../content/upgrades';
import type { SetPieceId } from '../content/setPieces';
import { getWeaponById, type WeaponPatternId } from '../content/weapons';
import { createRng, parseSeedLabel, type Rng, type WeightedChoice } from '../core/rng';
import {
  createActSectorContexts,
  createRunActPlan,
  type ActSectorContext,
  type RunActPlan
} from './ActPlan';
import { createActRouteGraph, type ActRouteGraph } from './ActRouteGraph';
import {
  getActRouteContractWeight,
  getEligibleActRouteContracts,
  type ActRouteEligibilityContext
} from './ActRouteContracts';
import { createBackgroundPlan, type BackgroundPlan } from './BackgroundPlan';
import { createBossArenaPlan, summarizeBossArenaPlan, type BossArenaPlan } from './BossArena';
import { createExpeditionGraph, type ExpeditionGraph } from './ExpeditionGraph';
import { createSectorScrollPlan, type SectorScrollPlan } from './ScrollState';
import {
  createSectorFeaturePlan,
  summarizeSectorFeaturePlan,
  type SectorFeaturePlan
} from './SectorFeatures';
import { createSectorObjectivePlan, type SectorObjectivePlan } from './SectorObjectives';
import { createSecondActFinalePlan, type SecondActFinalePlan } from './SecondActFinale';
import { createSetPiecePlan, type SetPiecePlan } from './SetPiece';
import { createFactionCampaignPlan, type FactionCampaignPlan } from './FactionCampaign';
import { createCrewRosterPlan, type CrewRosterPlan } from './CrewCommand';
import { createCrewArcPlan, type CrewArcPlan } from './CrewArc';
import { createFleetPlan, type FleetPlan } from './Fleetcraft';
import { createApexHuntPlan, type ApexHuntPlan } from './ApexHunt';
import {
  createNullFrontierCampaignPlan,
  type FrontierLaw,
  type NullFrontierCampaignPlan
} from './NullFrontier';
import { createCarrierPlan, type CarrierPlan } from './CarrierCommand';
import { createBoardingCampaignPlan, type BoardingCampaignPlan } from './BoardingOperation';
import { createFactionFrontPlan, type FactionFrontPlan } from './FactionFront';
import { createLegacyStartingLoadout, type ResolvedShipLoadout } from './ShipLoadout';
import { resolveRunUpgradeEffects, type RunUpgradeEffects } from './UpgradeEffects';
import {
  filterUnlockedBossCandidates,
  getAvailableFactionIds,
  getAvailableShips,
  getEffectiveUnlockedIds,
  type UnlockAccess
} from './UnlockGates';

export type RouteKind = 'shop' | 'elite' | 'vault' | 'repair' | 'glitch' | 'factionAmbush';

export interface StartingContract {
  readonly id: string;
  readonly shipId: ShipId;
  readonly shipName: string;
  readonly shipAppearance: ShipAppearance;
  readonly loadout: ResolvedShipLoadout;
  readonly sponsor: string;
  readonly startingWeaponId: WeaponId;
  readonly startingWeaponName: string;
  readonly startingWeaponPattern: WeaponPatternId;
  readonly shipStats: ShipStats;
  readonly startingCredits: number;
  readonly startingSalvage: number;
  readonly perk: string;
  readonly drawback: string;
  readonly summary: string;
  readonly itemBias: readonly string[];
  readonly rewardMultiplier: number;
  readonly surveyNote: string | null;
}

export interface RouteOption {
  readonly kind: RouteKind;
  readonly label: string;
  readonly risk: number;
  readonly rewardHint: string;
  readonly intelHint?: string;
  readonly actRouteId?: ActRouteContractId;
  readonly routeTags?: readonly ActRouteTag[];
  readonly pressureHint?: string;
  readonly rewardTierHint?: string;
  readonly environmentalHint?: string;
}

export interface SectorRoute {
  readonly index: number;
  readonly sectorId: SectorId;
  readonly sectorName: string;
  readonly act: ActSectorContext;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly bossFactionId: FactionId;
  readonly bossPatternId: BossPatternId;
  readonly routeOptions: readonly RouteOption[];
  readonly majorWaves: readonly string[];
  readonly objective: SectorObjectivePlan;
  readonly encounterPacing: SectorEncounterPacingDefinition | null;
  readonly scroll: SectorScrollPlan;
  readonly background: BackgroundPlan;
  readonly features: SectorFeaturePlan;
  readonly arena: BossArenaPlan | null;
  readonly finale: SecondActFinalePlan | null;
  readonly frontierLaw: FrontierLaw | null;
  readonly setPiece: SetPiecePlan | null;
  readonly rewardPoolSeed: string;
  readonly shopSeed: string;
}

export interface RunSkeleton {
  readonly seed: string;
  readonly unlockedIds: readonly UnlockId[];
  readonly availableFactionIds: readonly FactionId[];
  readonly upgradeEffects: RunUpgradeEffects;
  readonly seedSurvey: string | null;
  readonly acts: readonly RunActPlan[];
  readonly actRouteGraph: ActRouteGraph;
  readonly expedition: ExpeditionGraph;
  readonly factionCampaign: FactionCampaignPlan;
  readonly crewRoster: CrewRosterPlan;
  readonly crewArcs: CrewArcPlan;
  readonly fleet: FleetPlan;
  readonly apexHunts: ApexHuntPlan;
  readonly frontierCampaign: NullFrontierCampaignPlan;
  readonly carrierPlan: CarrierPlan;
  readonly boardingCampaign: BoardingCampaignPlan;
  readonly factionFronts: FactionFrontPlan;
  readonly contracts: readonly StartingContract[];
  readonly sectors: readonly SectorRoute[];
}

export interface RunGenerationOptions extends UnlockAccess {
  readonly purchasedUpgradeIds?: readonly UpgradeId[];
}

const ROUTE_OPTIONS: Readonly<Record<RouteKind, Omit<RouteOption, 'risk'>>> = {
  shop: {
    kind: 'shop',
    label: 'Shop',
    rewardHint: 'spend credits for controlled upgrades'
  },
  elite: {
    kind: 'elite',
    label: 'Elite',
    rewardHint: 'harder fight with rarer salvage'
  },
  vault: {
    kind: 'vault',
    label: 'Vault',
    rewardHint: 'cursed relic or secret unlock chance'
  },
  repair: {
    kind: 'repair',
    label: 'Repair',
    rewardHint: 'patch hull and bias safer rewards'
  },
  glitch: {
    kind: 'glitch',
    label: 'Glitch',
    rewardHint: 'high-variance seed disturbance'
  },
  factionAmbush: {
    kind: 'factionAmbush',
    label: 'Faction Ambush',
    rewardHint: 'harder faction fight with focused drops'
  }
};

const SEED_TAG_HINTS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['LASER', ['credit', 'speed']],
  ['TAX', ['credit', 'overkill']],
  ['ORBITAL', ['drone', 'relic']],
  ['JUNK', ['scrap', 'drone']],
  ['PROPHET', ['relic', 'curse']],
  ['VOID', ['phase', 'curse']],
  ['CORSAIR', ['credit', 'missile']],
  ['SMOKE', ['credit', 'drone', 'missile']]
];

const OPENING_SECTOR_ID: SectorId = 'sector_outer_debris_field';
const CORE_SECTOR_ID: SectorId = 'sector_core_wreck';
const STANDARD_ROUTE_SECTOR_IDS: readonly SectorId[] = [
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid',
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_lunar_surface',
  'sector_trade_war_corridor',
  'sector_corporate_kill_grid'
];
const LUNAR_ROUTE_SECTOR_IDS: readonly SectorId[] = [
  'sector_trade_war_corridor',
  'sector_lunar_surface',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid',
  'sector_trade_war_corridor',
  'sector_lunar_surface',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid'
];

export function generateRunSkeleton(
  seedInput: string | null | undefined,
  options: RunGenerationOptions = {}
): RunSkeleton {
  const seed = parseSeedLabel(seedInput);
  const rootRng = createRng(seed);
  const unlockedIds = getEffectiveUnlockedIds(options);
  const unlockAccess = { unlockedIds };
  const upgradeEffects = resolveRunUpgradeEffects(options.purchasedUpgradeIds);
  const contracts = generateStartingContracts(
    seed,
    rootRng.fork('contracts'),
    unlockAccess,
    upgradeEffects
  );
  const saveFingerprint = createRunGenerationSaveFingerprint(unlockedIds, upgradeEffects);
  const frontierCampaign = createNullFrontierCampaignPlan({
    seed,
    saveFingerprint,
    rng: rootRng.fork('null-frontier')
  });
  const carrierPlan = createCarrierPlan({
    seed,
    saveFingerprint,
    rng: rootRng.fork('carrier')
  });
  const sectorSequence = selectSectorSequence(seed, frontierCampaign);
  const acts = createRunActPlan(sectorSequence);
  const actRouteGraph = createActRouteGraph(seed, acts);
  const actContexts = createActSectorContexts(acts);
  const sectors = sectorSequence.map((sector, index) =>
    generateSectorRoute(
      sector,
      index + 1,
      rootRng.fork(`sector-${index + 1}`),
      unlockAccess,
      upgradeEffects,
      getGeneratedActContext(actContexts, index),
      frontierCampaign.sectors.find((candidate) => candidate.sectorId === sector.id)?.law ?? null
    )
  );
  const boardingCampaign = createBoardingCampaignPlan({
    seed,
    saveFingerprint,
    sectors
  });
  const factionFronts = createFactionFrontPlan({
    seed,
    saveFingerprint,
    sectorCount: sectors.length
  });
  const expedition = createExpeditionGraph({
    seed,
    saveFingerprint,
    acts,
    sectors,
    rng: rootRng.fork('expedition-graph'),
    boardingOperations: boardingCampaign.operations,
    actRouteGraph
  });
  const factionCampaign = createFactionCampaignPlan({
    seed,
    saveFingerprint,
    sectorCount: sectors.length
  });
  const crewRoster = createCrewRosterPlan({
    seed,
    saveFingerprint,
    sectorCount: sectors.length
  });
  const crewArcs = createCrewArcPlan({
    seed,
    saveFingerprint,
    sectorCount: sectors.length,
    crewRoster
  });
  const fleet = createFleetPlan({ seed, saveFingerprint });
  const apexHunts = createApexHuntPlan({
    seed,
    saveFingerprint,
    sectorCount: sectors.length
  });

  return {
    seed,
    unlockedIds,
    availableFactionIds: getAvailableFactionIds(unlockAccess),
    upgradeEffects,
    seedSurvey: createSeedSurveyText(upgradeEffects, sectors),
    acts,
    actRouteGraph,
    expedition,
    factionCampaign,
    crewRoster,
    crewArcs,
    fleet,
    apexHunts,
    frontierCampaign: {
      ...frontierCampaign,
      standardTargetSeconds: expedition.capacity.baselineTargetSeconds
    },
    carrierPlan,
    boardingCampaign,
    factionFronts,
    contracts,
    sectors
  };
}

export function createRunGenerationSaveFingerprint(
  unlockedIds: readonly UnlockId[],
  upgradeEffects: Pick<RunUpgradeEffects, 'activeUpgradeIds'>
): string {
  const nonGenerationUnlocks = new Set<UnlockId>([
    'unlock_music_apex_procession',
    'unlock_boss_apex_practice',
    'unlock_challenge_apex_migration'
  ]);
  const unlocks =
    unlockedIds
      .filter((unlockId) => !nonGenerationUnlocks.has(unlockId))
      .sort()
      .join(',') || 'fresh';
  const nonGenerationUpgrades = new Set<UpgradeId>([
    'upgrade_boss_warning_lattice',
    'upgrade_capital_relief_protocol',
    'upgrade_exit_toll_transponder',
    'upgrade_coupon_cascade_fuse',
    'upgrade_low_orbit_ore_scrip'
  ]);
  const upgrades =
    upgradeEffects.activeUpgradeIds
      .filter((upgradeId) => !nonGenerationUpgrades.has(upgradeId))
      .sort()
      .join(',') || 'none';
  return `unlocks=${unlocks}|upgrades=${upgrades}`;
}

function selectSectorSequence(
  seed: string,
  frontierCampaign: NullFrontierCampaignPlan
): readonly SectorDefinition[] {
  const routeSectorIds = seed.includes('LUNAR')
    ? LUNAR_ROUTE_SECTOR_IDS
    : STANDARD_ROUTE_SECTOR_IDS;
  const rng = createRng(`${seed}:act-route-sector-signals`);
  const actOneMiddle = routeSectorIds.slice(0, 7);
  const actTwoMiddle = createLayeredSectorPool(rng.fork('act-two'), routeSectorIds, 7);
  const frontierIds = frontierCampaign.sectors.map((sector) => sector.sectorId);
  const frontierMiddle = createLayeredSectorPool(
    rng.fork('act-three'),
    frontierIds.slice(1, -1),
    7
  );

  return [
    getSectorDefinition(OPENING_SECTOR_ID),
    ...actOneMiddle.map((sectorId) => getSectorDefinition(sectorId)),
    getSectorDefinition(routeSectorIds[7] ?? routeSectorIds[0]!),
    getSectorDefinition(routeSectorIds[0]!),
    ...actTwoMiddle.map((sectorId) => getSectorDefinition(sectorId)),
    getSectorDefinition(CORE_SECTOR_ID),
    getSectorDefinition(frontierIds[0]!),
    ...frontierMiddle.map((sectorId) => getSectorDefinition(sectorId)),
    getSectorDefinition(frontierIds.at(-1)!)
  ];
}

function createLayeredSectorPool(
  rng: Rng,
  candidates: readonly SectorId[],
  count: number
): readonly SectorId[] {
  if (candidates.length === 0) {
    throw new Error('Act route sector pool requires at least one sector definition.');
  }
  const result: SectorId[] = [];
  while (result.length < count) {
    result.push(...rng.fork(`cycle-${result.length}`).shuffle(candidates));
  }
  return result.slice(0, count);
}

function getSectorDefinition(id: SectorId): SectorDefinition {
  const sector = SECTORS.find((candidate) => candidate.id === id);

  if (!sector) {
    throw new Error(`Unknown sector definition: ${id}`);
  }

  return sector;
}

function generateStartingContracts(
  seed: string,
  rng: Rng,
  unlockAccess: UnlockAccess,
  upgradeEffects: RunUpgradeEffects
): StartingContract[] {
  const selectedShips: ShipDefinition[] = [];
  const availableShips = getAvailableShips(unlockAccess);
  const contractCount = Math.min(upgradeEffects.contractBoardSlots, availableShips.length);

  if (availableShips.length < 3) {
    throw new Error('Unlock gating must leave at least three starter ships available.');
  }

  for (let slot = 0; slot < contractCount; slot += 1) {
    const ship = rng.weightedChoice(
      availableShips.map((candidate) => ({
        item: candidate,
        weight: getShipWeight(seed, candidate)
      }))
    );

    selectedShips.push(ship);
    availableShips.splice(availableShips.indexOf(ship), 1);
  }

  return selectedShips.map((ship, index) => {
    const sponsorRng = rng.fork(`contract-${index + 1}-${ship.id}-sponsor`);
    const rewardRng = rng.fork(`contract-${index + 1}-${ship.id}-reward`);
    const loadout = createLegacyStartingLoadout(ship);
    const weapon = getWeaponById(loadout.primaryWeaponId);

    return {
      id: `contract_${index + 1}_${ship.id.replace('ship_', '')}`,
      shipId: ship.id,
      shipName: ship.name,
      shipAppearance: ship.appearance,
      loadout,
      sponsor: sponsorRng.choice(ship.sponsors),
      startingWeaponId: loadout.primaryWeaponId,
      startingWeaponName: weapon.name,
      startingWeaponPattern: weapon.pattern,
      shipStats: loadout.shipStats,
      startingCredits: loadout.shipStats.startingCredits,
      startingSalvage: loadout.shipStats.startingSalvage,
      perk: ship.perk,
      drawback: ship.drawback,
      summary: ship.contractSummary,
      itemBias: ship.itemBias,
      rewardMultiplier: rewardRng.int(100, 130) / 100,
      surveyNote: upgradeEffects.contractSurvey ? createContractSurveyNote(ship) : null
    };
  });
}

function generateSectorRoute(
  sector: SectorDefinition,
  index: number,
  rng: Rng,
  unlockAccess: UnlockAccess,
  upgradeEffects: RunUpgradeEffects,
  act: ActSectorContext,
  frontierLaw: FrontierLaw | null
): SectorRoute {
  const bossCandidates = filterUnlockedBossCandidates(sector.bossCandidates, unlockAccess);
  const boss = getBossById(rng.choice(bossCandidates));
  const routeOptions = generateRouteOptions(
    rng.fork('routes'),
    index,
    sector,
    boss.factionId,
    unlockAccess,
    upgradeEffects,
    act
  );
  const waveRng = rng.fork('major-waves');
  const majorWaves = waveRng.shuffle(sector.majorWavePool).slice(0, 3);
  const objective = createSectorObjectivePlan(sector, majorWaves, act);
  const scroll = createSectorScrollPlan({
    sectorId: sector.id,
    sectorIndex: index,
    objective,
    rng: rng.fork('scroll')
  });
  const background = createBackgroundPlan(
    getBackgroundById(sector.backgroundId),
    rng.fork('background')
  );
  const features = createSectorFeaturePlan({
    sector,
    scroll,
    rng: rng.fork('features')
  });
  const arena = createBossArenaPlan({
    sectorId: sector.id,
    objective,
    scroll
  });
  const finale = createSecondActFinalePlan({
    sectorId: sector.id,
    act,
    objective,
    bossId: boss.id,
    bossName: boss.name,
    bossFactionId: boss.factionId,
    rng: rng.fork('finale')
  });
  const setPiece = createSetPiecePlan({
    sectorIndex: index,
    scrollLength: scroll.length,
    bossArena: arena,
    definitionId: getGeneratedSetPieceDefinitionId(sector.id, act),
    layoutSeed: rng.fork('set-piece-layout').seedLabel
  });

  return {
    index,
    sectorId: sector.id,
    sectorName: sector.name,
    act,
    bossId: boss.id,
    bossName: boss.name,
    bossFactionId: boss.factionId,
    bossPatternId: boss.patternId,
    routeOptions,
    majorWaves,
    objective,
    encounterPacing: sector.encounterPacing ?? null,
    scroll,
    background,
    features,
    arena,
    finale,
    frontierLaw,
    setPiece,
    rewardPoolSeed: rng.fork('reward-pool').seedLabel,
    shopSeed: rng.fork('shop').seedLabel
  };
}

function getGeneratedSetPieceDefinitionId(
  sectorId: SectorId,
  act: ActSectorContext
): SetPieceId | null {
  if (sectorId === OPENING_SECTOR_ID && act.actId === 'act_outer_rim') {
    return 'setpiece_ledger_hecaton';
  }
  if (sectorId === CORE_SECTOR_ID) {
    return 'setpiece_court_wreck_train';
  }
  if (act.actId === 'act_core_descent' && act.actRouteNodeLabel === '3B') {
    return 'setpiece_bloom_spindle';
  }
  return null;
}

function generateRouteOptions(
  rng: Rng,
  sectorIndex: number,
  sector: SectorDefinition,
  bossFactionId: FactionId,
  unlockAccess: UnlockAccess,
  upgradeEffects: RunUpgradeEffects,
  act: ActSectorContext
): RouteOption[] {
  if (act.actId === 'act_core_descent' || act.actId === 'act_null_frontier') {
    return generateActRouteContractOptions(
      rng,
      sectorIndex,
      sector,
      bossFactionId,
      unlockAccess,
      upgradeEffects,
      act
    );
  }

  return generateBaselineRouteOptions(rng, sectorIndex, upgradeEffects, act);
}

function generateBaselineRouteOptions(
  rng: Rng,
  sectorIndex: number,
  upgradeEffects: RunUpgradeEffects,
  act: ActSectorContext
): RouteOption[] {
  const allowedRouteKinds = new Set<RouteKind>(act.routeGrammar.allowedKinds);
  const allWeightedRoutes: readonly WeightedChoice<RouteKind>[] = [
    { item: 'shop', weight: sectorIndex === 1 ? 2 : 4 },
    { item: 'elite', weight: 3 + sectorIndex },
    { item: 'vault', weight: sectorIndex >= 2 ? 3 : 1 },
    { item: 'repair', weight: sectorIndex >= 3 ? 3 : 2 },
    { item: 'glitch', weight: sectorIndex >= 3 ? 2 : 1 },
    { item: 'factionAmbush', weight: sectorIndex >= 2 ? 3 : 1 }
  ];
  const weightedRoutes = allWeightedRoutes.filter((route) => allowedRouteKinds.has(route.item));
  const guaranteedRoutes = act.routeGrammar.guaranteedKinds.filter((kind): kind is RouteKind =>
    allowedRouteKinds.has(kind)
  );
  const routeKinds =
    sectorIndex === 1 && guaranteedRoutes.includes('shop')
      ? [
          'shop' as const,
          ...selectUniqueWeighted(
            rng,
            weightedRoutes.filter((route) => route.item !== 'shop'),
            2
          )
        ]
      : selectUniqueWeighted<RouteKind>(rng, weightedRoutes, 3);

  return routeKinds.map((kind) => {
    const risk = calculateRouteRisk(kind, sectorIndex);

    return {
      ...ROUTE_OPTIONS[kind],
      risk,
      ...(upgradeEffects.routeIntel ? { intelHint: createRouteIntelHint(kind, risk) } : {})
    };
  });
}

function generateActRouteContractOptions(
  rng: Rng,
  sectorIndex: number,
  sector: SectorDefinition,
  bossFactionId: FactionId,
  unlockAccess: UnlockAccess,
  upgradeEffects: RunUpgradeEffects,
  act: ActSectorContext
): RouteOption[] {
  const allowedRouteKinds = new Set<RouteKind>(act.routeGrammar.allowedKinds);
  const context: ActRouteEligibilityContext = {
    actId: act.actId,
    sectorId: sector.id,
    backgroundId: sector.backgroundId,
    bossFactionId,
    objectiveKind: sector.objective.kind,
    unlockedIds: unlockAccess.unlockedIds ?? []
  };
  const eligibleContracts = getEligibleActRouteContracts(context).filter((contract) =>
    allowedRouteKinds.has(contract.kind)
  );
  const selectedContracts = selectUniqueRouteContracts(
    rng,
    eligibleContracts.map((contract) => ({
      item: contract,
      weight: getActRouteContractWeight(contract, context)
    })),
    3
  );
  const selectedKinds = new Set(selectedContracts.map((contract) => contract.kind));
  const fallbackKinds =
    selectedContracts.length >= 3
      ? []
      : selectUniqueWeighted(
          rng,
          [...allowedRouteKinds]
            .filter((kind) => !selectedKinds.has(kind))
            .map((kind) => ({ item: kind, weight: 1 })),
          3 - selectedContracts.length
        );

  return [
    ...selectedContracts.map((contract) =>
      createActRouteOption(contract, sectorIndex, upgradeEffects)
    ),
    ...fallbackKinds.map((kind) => {
      const risk = calculateRouteRisk(kind, sectorIndex);

      return {
        ...ROUTE_OPTIONS[kind],
        risk,
        ...(upgradeEffects.routeIntel ? { intelHint: createRouteIntelHint(kind, risk) } : {})
      };
    })
  ];
}

function createActRouteOption(
  contract: ActRouteContractDefinition,
  sectorIndex: number,
  upgradeEffects: RunUpgradeEffects
): RouteOption {
  const risk = Math.max(1, calculateRouteRisk(contract.kind, sectorIndex) + contract.riskOffset);

  return {
    kind: contract.kind,
    label: contract.label,
    risk,
    rewardHint: contract.routeCardCopy,
    actRouteId: contract.id,
    routeTags: contract.tags,
    pressureHint: contract.pressureHint,
    rewardTierHint: contract.rewardTierHint,
    environmentalHint: contract.environmentalPressureHint,
    ...(upgradeEffects.routeIntel ? { intelHint: createRouteIntelHint(contract.kind, risk) } : {})
  };
}

function selectUniqueRouteContracts(
  rng: Rng,
  choices: readonly WeightedChoice<ActRouteContractDefinition>[],
  count: number
): ActRouteContractDefinition[] {
  const available = choices.map((choice) => ({ ...choice }));
  const selected: ActRouteContractDefinition[] = [];

  while (selected.length < count && available.length > 0) {
    const contract = rng.weightedChoice(available);
    selected.push(contract);

    for (let index = available.length - 1; index >= 0; index -= 1) {
      if (available[index]?.item.kind === contract.kind) {
        available.splice(index, 1);
      }
    }
  }

  return selected;
}

function selectUniqueWeighted<T>(
  rng: Rng,
  choices: readonly WeightedChoice<T>[],
  count: number
): T[] {
  const available = choices.map((choice) => ({ ...choice }));
  const selected: T[] = [];

  while (selected.length < count && available.length > 0) {
    const item = rng.weightedChoice(available);
    selected.push(item);

    const index = available.findIndex((candidate) => candidate.item === item);
    if (index >= 0) {
      available.splice(index, 1);
    }
  }

  return selected;
}

function calculateRouteRisk(kind: RouteKind, sectorIndex: number): number {
  const baseRisk: Record<RouteKind, number> = {
    shop: 1,
    repair: 1,
    vault: 3,
    glitch: 4,
    elite: 4,
    factionAmbush: 4
  };

  return baseRisk[kind] + Math.floor((sectorIndex - 1) / 2);
}

function getShipWeight(seed: string, ship: ShipDefinition): number {
  let weight = 10;

  for (const [token, tags] of SEED_TAG_HINTS) {
    if (!seed.includes(token)) {
      continue;
    }

    for (const tag of tags) {
      if (ship.tags.some((shipTag) => shipTag === tag) || ship.itemBias.includes(tag)) {
        weight += 8;
      }
    }
  }

  return weight;
}

function createContractSurveyNote(ship: ShipDefinition): string {
  const profile = getShipProfile(ship.stats);
  const bias = ship.itemBias.slice(0, 2).join(' / ');
  return `Survey: ${profile} frame; favors ${bias}.`;
}

function getShipProfile(stats: ShipStats): string {
  if (stats.speed >= 410) {
    return 'fast';
  }

  if (stats.maxHull >= 3) {
    return 'sturdy';
  }

  if (stats.bombCapacity >= 2) {
    return 'ordnance';
  }

  return 'volatile';
}

function createRouteIntelHint(kind: RouteKind, risk: number): string {
  const pressure = risk <= 2 ? 'low pressure' : risk <= 4 ? 'medium pressure' : 'high pressure';

  if (kind === 'shop') {
    return `Ledger: ${pressure}, market stop before the next sector.`;
  }

  if (kind === 'repair') {
    return `Ledger: ${pressure}, service lane can stabilize future hull.`;
  }

  if (kind === 'vault') {
    return `Ledger: ${pressure}, relic pool and curse exposure likely.`;
  }

  if (kind === 'elite') {
    return `Ledger: ${pressure}, bounty pressure can widen rewards.`;
  }

  if (kind === 'glitch') {
    return `Ledger: ${pressure}, seed shear can distort next-sector pacing.`;
  }

  return `Ledger: ${pressure}, faction cache with escort pressure.`;
}

function createSeedSurveyText(
  upgradeEffects: RunUpgradeEffects,
  sectors: readonly SectorRoute[]
): string | null {
  if (!upgradeEffects.seedSurvey) {
    return null;
  }

  const openingSector = sectors[0];

  if (!openingSector) {
    return null;
  }

  return `Seed Map: ${openingSector.act.actShortLabel} ${openingSector.sectorName} | ${Math.floor(
    openingSector.scroll.length
  )}u | ${openingSector.routeOptions.map((route) => route.label).join('/')}`;
}

export function summarizeRunSkeleton(run: RunSkeleton): unknown {
  return {
    seed: run.seed,
    expedition: {
      id: run.expedition.id,
      schemaVersion: run.expedition.schemaVersion,
      saveFingerprint: run.expedition.saveFingerprint,
      actCount: run.expedition.acts.length,
      sectorCount: run.expedition.sectors.length,
      nodeCount: run.expedition.nodes.length,
      branchCount: run.expedition.branches.length,
      gates: run.expedition.gates.map((gate) => ({
        actId: gate.actId,
        kind: gate.kind,
        transition: gate.transitionKind
      })),
      capacity: run.expedition.capacity
    },
    actRouteGraph: {
      id: run.actRouteGraph.id,
      layerWidths: run.actRouteGraph.layerWidths,
      routeDepth: run.actRouteGraph.routeDepth,
      nodesPerAct: run.actRouteGraph.nodesPerAct,
      nodeCount: run.actRouteGraph.nodes.length,
      edgeCount: run.actRouteGraph.edges.length
    },
    factionCampaign: {
      id: run.factionCampaign.id,
      rivals: run.factionCampaign.rivals.map((rival) => ({
        id: rival.id,
        factionId: rival.factionId,
        archetypeId: rival.archetypeId,
        name: rival.name,
        shipName: rival.shipName,
        firstSectorIndex: rival.firstSectorIndex
      }))
    },
    frontierCampaign: {
      id: run.frontierCampaign.id,
      variantId: run.frontierCampaign.variantId,
      name: run.frontierCampaign.name,
      finaleGate: run.frontierCampaign.finaleGate,
      finaleBossId: run.frontierCampaign.finaleBossId,
      standardTargetSeconds: run.frontierCampaign.standardTargetSeconds,
      laws: run.frontierCampaign.sectors.map((sector) => [sector.sectorId, sector.law.id]),
      factionHooks: run.frontierCampaign.sectors.map((sector) => sector.factionHook)
    },
    carrier: {
      id: run.carrierPlan.id,
      carrierId: run.carrierPlan.carrierId,
      name: run.carrierPlan.name,
      origin: run.carrierPlan.origin,
      facilities: run.carrierPlan.startingFacilities,
      cargoCapacity: run.carrierPlan.baseCargoCapacity,
      liaisonFactionId: run.carrierPlan.liaisonFactionId
    },
    ...(run.upgradeEffects.activeUpgradeIds.length > 0
      ? {
          upgrades: {
            active: run.upgradeEffects.activeUpgradeIds,
            names: run.upgradeEffects.activeUpgradeNames,
            contractBoardSlots: run.upgradeEffects.contractBoardSlots,
            shopStockBonus: run.upgradeEffects.shopStockBonus,
            shopDiscount: run.upgradeEffects.shopDiscount,
            shopCouponCascade: run.upgradeEffects.shopCouponCascade,
            rewardChoiceBonus: run.upgradeEffects.rewardChoiceBonus,
            seedSurvey: run.seedSurvey
          }
        }
      : {}),
    acts: run.acts.map((act) => ({
      id: act.id,
      index: act.index,
      label: act.label,
      shortLabel: act.shortLabel,
      sectorRange: [act.startSectorIndex + 1, act.endSectorIndex + 1],
      sectorIds: act.sectorIds,
      routeGrammar: act.routeGrammar.allowedKinds,
      rewardTier: act.rewardTier,
      pressureTier: act.pressureTier,
      bossGate: act.bossGate.kind,
      transition: act.transition.kind
    })),
    contracts: run.contracts.map((contract) => ({
      shipId: contract.shipId,
      frameId: contract.loadout.frameId,
      loadoutSignature: contract.loadout.signature,
      modules: contract.loadout.mounts.map((mount) => mount.moduleId),
      resources: {
        power: [contract.loadout.resources.powerDraw, contract.loadout.resources.reactorOutput],
        heat: [contract.loadout.resources.heatLoad, contract.loadout.resources.thermalCapacity],
        mass: [contract.loadout.resources.totalMass, contract.loadout.resources.massCapacity],
        command: [
          contract.loadout.resources.commandDraw,
          contract.loadout.resources.commandCapacity
        ]
      },
      sponsor: contract.sponsor,
      weaponPattern: contract.startingWeaponPattern,
      stats: {
        maxHull: contract.shipStats.maxHull,
        speed: contract.shipStats.speed,
        hitRadius: contract.shipStats.hitRadius,
        bombCapacity: contract.shipStats.bombCapacity,
        startingCredits: contract.startingCredits,
        startingSalvage: contract.startingSalvage
      },
      rewardMultiplier: contract.rewardMultiplier,
      ...(contract.surveyNote ? { surveyNote: contract.surveyNote } : {})
    })),
    sectors: run.sectors.map((sector) => ({
      sectorId: sector.sectorId,
      act: {
        id: sector.act.actId,
        index: sector.act.actIndex,
        sectorIndex: sector.act.actSectorIndex,
        sectorCount: sector.act.actSectorCount,
        rewardTier: sector.act.rewardTier,
        pressureTier: sector.act.pressureTier
      },
      bossId: sector.bossId,
      bossFactionId: sector.bossFactionId,
      bossPatternId: sector.bossPatternId,
      routes: sector.routeOptions.map((route) => route.kind),
      majorWaves: sector.majorWaves,
      objective: {
        kind: sector.objective.kind,
        requiredWaves: sector.objective.requiredWaves,
        spawnsPerWave: sector.objective.spawnsPerWave,
        requiredEnemyKills: sector.objective.requiredEnemyKills,
        bossRequired: sector.objective.bossRequired,
        bossSpawnAtSeconds: sector.objective.bossSpawnAtSeconds
      },
      ...(sector.encounterPacing ? { encounterPacing: sector.encounterPacing } : {}),
      scroll: {
        length: sector.scroll.length,
        baseSpeed: sector.scroll.baseSpeed,
        startOffset: sector.scroll.startOffset
      },
      ...(sector.routeOptions.some((route) => route.intelHint)
        ? { routeIntel: sector.routeOptions.map((route) => route.intelHint ?? '') }
        : {}),
      ...(sector.routeOptions.some((route) => route.actRouteId)
        ? {
            actRouteContracts: sector.routeOptions.map((route) => ({
              id: route.actRouteId ?? null,
              label: route.label,
              tags: route.routeTags ?? [],
              pressureHint: route.pressureHint ?? null,
              rewardTierHint: route.rewardTierHint ?? null,
              environmentalHint: route.environmentalHint ?? null
            }))
          }
        : {}),
      ...(sector.frontierLaw
        ? { frontierLaw: { id: sector.frontierLaw.id, label: sector.frontierLaw.label } }
        : {}),
      background: {
        id: sector.background.id,
        layerCount: sector.background.layers.length,
        primitiveCount: sector.background.primitiveCount
      },
      features: summarizeSectorFeaturePlan(sector.features),
      ...(sector.arena ? { arena: summarizeBossArenaPlan(sector.arena) } : {}),
      ...(sector.setPiece
        ? {
            setPiece: {
              id: sector.setPiece.definitionId,
              layoutId: sector.setPiece.layoutId,
              layoutLabel: sector.setPiece.layoutLabel,
              anchorDistance: sector.setPiece.anchorDistance,
              safeLane: sector.setPiece.safeLane,
              bossLock: sector.setPiece.bossLock,
              reinforcementFormation: sector.setPiece.reinforcement.formationId
            }
          }
        : {})
    }))
  };
}

function getGeneratedActContext(
  contexts: readonly ActSectorContext[],
  sectorIndex: number
): ActSectorContext {
  const context = contexts[sectorIndex];

  if (!context) {
    throw new Error(`No act context exists for generated sector ${sectorIndex + 1}.`);
  }

  return context;
}
