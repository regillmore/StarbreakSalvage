import { getBossById, type BossId, type BossPatternId } from '../content/bosses';
import { getBackgroundById } from '../content/backgrounds';
import type { FactionId } from '../content/factions';
import { SECTORS, type SectorDefinition, type SectorId } from '../content/sectors';
import {
  type ShipAppearance,
  type ShipDefinition,
  type ShipId,
  type ShipStats,
  type WeaponId
} from '../content/ships';
import type { UnlockId } from '../content/unlocks';
import type { UpgradeId } from '../content/upgrades';
import { getWeaponById, type WeaponPatternId } from '../content/weapons';
import { createRng, parseSeedLabel, type Rng, type WeightedChoice } from '../core/rng';
import { createBackgroundPlan, type BackgroundPlan } from './BackgroundPlan';
import { createBossArenaPlan, summarizeBossArenaPlan, type BossArenaPlan } from './BossArena';
import { createSectorScrollPlan, type SectorScrollPlan } from './ScrollState';
import {
  createSectorFeaturePlan,
  summarizeSectorFeaturePlan,
  type SectorFeaturePlan
} from './SectorFeatures';
import { createSectorObjectivePlan, type SectorObjectivePlan } from './SectorObjectives';
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
}

export interface SectorRoute {
  readonly index: number;
  readonly sectorId: string;
  readonly sectorName: string;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly bossFactionId: FactionId;
  readonly bossPatternId: BossPatternId;
  readonly routeOptions: readonly RouteOption[];
  readonly majorWaves: readonly string[];
  readonly objective: SectorObjectivePlan;
  readonly scroll: SectorScrollPlan;
  readonly background: BackgroundPlan;
  readonly features: SectorFeaturePlan;
  readonly arena: BossArenaPlan | null;
  readonly rewardPoolSeed: string;
  readonly shopSeed: string;
}

export interface RunSkeleton {
  readonly seed: string;
  readonly unlockedIds: readonly UnlockId[];
  readonly availableFactionIds: readonly FactionId[];
  readonly upgradeEffects: RunUpgradeEffects;
  readonly seedSurvey: string | null;
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
const STANDARD_MIDDLE_SECTOR_IDS: readonly SectorId[] = [
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid'
];
const LUNAR_MIDDLE_SECTOR_IDS: readonly SectorId[] = [
  'sector_trade_war_corridor',
  'sector_lunar_surface',
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
  const sectorSequence = selectSectorSequence(seed);
  const sectors = sectorSequence.map((sector, index) =>
    generateSectorRoute(
      sector,
      index + 1,
      rootRng.fork(`sector-${index + 1}`),
      unlockAccess,
      upgradeEffects
    )
  );

  return {
    seed,
    unlockedIds,
    availableFactionIds: getAvailableFactionIds(unlockAccess),
    upgradeEffects,
    seedSurvey: createSeedSurveyText(upgradeEffects, sectors),
    contracts,
    sectors
  };
}

function selectSectorSequence(seed: string): readonly SectorDefinition[] {
  const middleSectorIds = seed.includes('LUNAR')
    ? LUNAR_MIDDLE_SECTOR_IDS
    : STANDARD_MIDDLE_SECTOR_IDS;

  return [
    getSectorDefinition(OPENING_SECTOR_ID),
    ...middleSectorIds.map((sectorId) => getSectorDefinition(sectorId)),
    getSectorDefinition(CORE_SECTOR_ID)
  ];
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
    const weapon = getWeaponById(ship.weapon);

    return {
      id: `contract_${index + 1}_${ship.id.replace('ship_', '')}`,
      shipId: ship.id,
      shipName: ship.name,
      shipAppearance: ship.appearance,
      sponsor: sponsorRng.choice(ship.sponsors),
      startingWeaponId: ship.weapon,
      startingWeaponName: weapon.name,
      startingWeaponPattern: weapon.pattern,
      shipStats: ship.stats,
      startingCredits: ship.stats.startingCredits,
      startingSalvage: ship.stats.startingSalvage,
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
  upgradeEffects: RunUpgradeEffects
): SectorRoute {
  const bossCandidates = filterUnlockedBossCandidates(sector.bossCandidates, unlockAccess);
  const boss = getBossById(rng.choice(bossCandidates));
  const routeOptions = generateRouteOptions(rng.fork('routes'), index, upgradeEffects);
  const waveRng = rng.fork('major-waves');
  const majorWaves = waveRng.shuffle(sector.majorWavePool).slice(0, 3);
  const objective = createSectorObjectivePlan(sector, majorWaves);
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

  return {
    index,
    sectorId: sector.id,
    sectorName: sector.name,
    bossId: boss.id,
    bossName: boss.name,
    bossFactionId: boss.factionId,
    bossPatternId: boss.patternId,
    routeOptions,
    majorWaves,
    objective,
    scroll,
    background,
    features,
    arena,
    rewardPoolSeed: rng.fork('reward-pool').seedLabel,
    shopSeed: rng.fork('shop').seedLabel
  };
}

function generateRouteOptions(
  rng: Rng,
  sectorIndex: number,
  upgradeEffects: RunUpgradeEffects
): RouteOption[] {
  const weightedRoutes: readonly WeightedChoice<RouteKind>[] = [
    { item: 'shop', weight: sectorIndex === 1 ? 2 : 4 },
    { item: 'elite', weight: 3 + sectorIndex },
    { item: 'vault', weight: sectorIndex >= 2 ? 3 : 1 },
    { item: 'repair', weight: sectorIndex >= 3 ? 3 : 2 },
    { item: 'glitch', weight: sectorIndex >= 3 ? 2 : 1 },
    { item: 'factionAmbush', weight: sectorIndex >= 2 ? 3 : 1 }
  ];
  const routeKinds =
    sectorIndex === 1
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

  return `Seed Map: ${openingSector.sectorName} | ${Math.floor(
    openingSector.scroll.length
  )}u | ${openingSector.routeOptions.map((route) => route.label).join('/')}`;
}

export function summarizeRunSkeleton(run: RunSkeleton): unknown {
  return {
    seed: run.seed,
    ...(run.upgradeEffects.activeUpgradeIds.length > 0
      ? {
          upgrades: {
            active: run.upgradeEffects.activeUpgradeIds,
            names: run.upgradeEffects.activeUpgradeNames,
            contractBoardSlots: run.upgradeEffects.contractBoardSlots,
            shopStockBonus: run.upgradeEffects.shopStockBonus,
            shopDiscount: run.upgradeEffects.shopDiscount,
            rewardChoiceBonus: run.upgradeEffects.rewardChoiceBonus,
            seedSurvey: run.seedSurvey
          }
        }
      : {}),
    contracts: run.contracts.map((contract) => ({
      shipId: contract.shipId,
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
      scroll: {
        length: sector.scroll.length,
        baseSpeed: sector.scroll.baseSpeed,
        startOffset: sector.scroll.startOffset
      },
      ...(sector.routeOptions.some((route) => route.intelHint)
        ? { routeIntel: sector.routeOptions.map((route) => route.intelHint ?? '') }
        : {}),
      background: {
        id: sector.background.id,
        layerCount: sector.background.layers.length,
        primitiveCount: sector.background.primitiveCount
      },
      features: summarizeSectorFeaturePlan(sector.features),
      ...(sector.arena ? { arena: summarizeBossArenaPlan(sector.arena) } : {})
    }))
  };
}
