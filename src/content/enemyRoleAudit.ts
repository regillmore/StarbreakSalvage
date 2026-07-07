import { BOSSES, type BossDefinition } from './bosses';
import {
  FACTIONS,
  type FactionDefinition,
  type FactionEnemyPattern,
  type FactionId,
  type FactionVisualShape
} from './factions';
import {
  PHASE_7_TARGET_ENEMY_ROLES,
  type EnemyClassId,
  type EnemyPressureType,
  type EnemyRoleId,
  type EnemyRoleMetadata,
  type Phase7EnemyRoleTarget
} from './enemyRoles';
import { SECTORS, type SectorDefinition, type SectorId } from './sectors';

export { PHASE_7_TARGET_ENEMY_ROLES } from './enemyRoles';
export type { EnemyPressureType, Phase7EnemyRoleTarget };
export type Phase7EnemyRoleId = EnemyRoleId;

export interface EnemyPatternAudit {
  readonly enemyPattern: FactionEnemyPattern;
  readonly baselineRole: string;
  readonly phase7TargetRole: EnemyRoleId;
  readonly pressureType: EnemyPressureType;
  readonly movementFamily: string;
  readonly entrySpeed: number;
  readonly attackCadenceSeconds: number;
  readonly projectileSummary: string;
  readonly projectileCount: number;
  readonly projectileTags: readonly string[];
  readonly durabilitySummary: string;
  readonly currentStrengths: readonly string[];
  readonly gaps: readonly string[];
  readonly riskNotes: readonly string[];
}

export interface EnemySpawnContextAudit {
  readonly sectorId: SectorId;
  readonly sectorName: string;
  readonly sectorRole: string;
  readonly majorWaveLabels: readonly string[];
  readonly preferredWhenBossIds: readonly string[];
}

export interface CurrentEnemyRoleAuditEntry extends EnemyPatternAudit {
  readonly factionId: FactionId;
  readonly classId: EnemyClassId;
  readonly factionName: string;
  readonly factionSummary: string;
  readonly visualShape: FactionVisualShape;
  readonly metadata: EnemyRoleMetadata;
  readonly silhouetteSummary: string;
  readonly spawnContexts: readonly EnemySpawnContextAudit[];
  readonly objectiveInteraction: string;
}

export interface EnemySpawnModelAudit {
  readonly radius: number;
  readonly baseHullRange: readonly [number, number];
  readonly routeHullBonus: string;
  readonly spawnTiming: string;
  readonly xPlacement: string;
  readonly yPlacement: string;
  readonly factionSelection: string;
}

export interface EnemyObjectiveSafetyAudit {
  readonly currentRequiredTargetRule: string;
  readonly verifiedAccountingPaths: readonly string[];
  readonly riskPaths: readonly string[];
  readonly phase7Requirement: string;
}

export interface EnemyRoleAudit {
  readonly currentEnemyClassCount: number;
  readonly targetRoles: readonly Phase7EnemyRoleTarget[];
  readonly entries: readonly CurrentEnemyRoleAuditEntry[];
  readonly uniqueMajorWaveLabels: readonly string[];
  readonly spawnModel: EnemySpawnModelAudit;
  readonly objectiveSafety: EnemyObjectiveSafetyAudit;
  readonly crossCuttingGaps: readonly string[];
  readonly phase7NextSteps: readonly string[];
}

const PATTERN_AUDITS: Readonly<Record<FactionEnemyPattern, EnemyPatternAudit>> = {
  driftShot: {
    enemyPattern: 'driftShot',
    baselineRole: 'drift bruiser seed',
    phase7TargetRole: 'bruiser',
    pressureType: 'attrition',
    movementFamily: 'enters steadily, then drifts from spawn lane with heavy lane bias',
    entrySpeed: 104,
    attackCadenceSeconds: 1.55,
    projectileSummary:
      'telegraphed fan warning into two heavy missile/scrap shots with drift-influenced x velocity',
    projectileCount: 2,
    projectileTags: ['missile', 'scrap'],
    durabilitySummary: 'normal spawns use 2 hull early and 3 hull in later wave positions',
    currentStrengths: [
      'large projectile reads clearly',
      'drift gives Scrap Court enemies a heavier loose-lane feel'
    ],
    gaps: [
      'no broad-body collision identity beyond the shared radius',
      'does not currently hold, shield, ram, or retreat like a true bruiser'
    ],
    riskNotes: [
      'future extra durability should not stall required target clears',
      'missile size needs high-contrast checks over lunar dust and surface hazards'
    ]
  },
  laneBurst: {
    enemyPattern: 'laneBurst',
    baselineRole: 'lane screener seed',
    phase7TargetRole: 'screener',
    pressureType: 'lane',
    movementFamily: 'fast entry to target Y, then tight lane hold with minimal drift',
    entrySpeed: 138,
    attackCadenceSeconds: 1.05,
    projectileSummary:
      'short lane warning into two narrow vertical plasma bolts fired from left and right offsets',
    projectileCount: 2,
    projectileTags: ['plasma'],
    durabilitySummary: 'normal spawns use 2 hull early and 3 hull in later wave positions',
    currentStrengths: [
      'diamond silhouette and twin bolts make the cleanest current role read',
      'lane hold maps well to future screen and formation roles'
    ],
    gaps: [
      'single screeners warn a lane but do not coordinate multi-enemy curtains yet',
      'wave labels imply grids and turrets but do not change behavior yet'
    ],
    riskNotes: [
      'future lane telegraphs must stay distinct from sector hazard telegraphs',
      'fixed-lane enemies can become trivial without formation or escort context'
    ]
  },
  sporeSpread: {
    enemyPattern: 'sporeSpread',
    baselineRole: 'spread controller seed',
    phase7TargetRole: 'disruptor',
    pressureType: 'spread',
    movementFamily: 'slow entry, then organic sway in x and y around target Y',
    entrySpeed: 96,
    attackCadenceSeconds: 1.6,
    projectileSummary:
      'ring warning into three slow plasma spores spreading left, center, and right',
    projectileCount: 3,
    projectileTags: ['plasma'],
    durabilitySummary: 'normal spawns use 2 hull early and 3 hull in later wave positions',
    currentStrengths: [
      'organic silhouette and slow spread distinguish Bloom Hive pressure',
      'lower speed leaves readable dodge gaps'
    ],
    gaps: [
      'does not yet create lasting zones, pods, regeneration, or support behavior',
      'spread role is faction-wide rather than chosen per enemy class'
    ],
    riskNotes: [
      'organic backgrounds can compete with green projectiles without contrast checks',
      'future area denial must avoid stacking with lunar or sector hazards'
    ]
  },
  phaseSkirmish: {
    enemyPattern: 'phaseSkirmish',
    baselineRole: 'flank scout seed',
    phase7TargetRole: 'scout',
    pressureType: 'pursuit',
    movementFamily: 'quick entry, then strong lateral skating with slight y sway',
    entrySpeed: 128,
    attackCadenceSeconds: 0.95,
    projectileSummary: 'short fan warning into two small phase needles aimed toward the player',
    projectileCount: 2,
    projectileTags: ['phase'],
    durabilitySummary: 'normal spawns use 2 hull early and 3 hull in later wave positions',
    currentStrengths: [
      'needle silhouette and lateral skating already read as evasive',
      'phase-tagged bullets connect to item and faction identity'
    ],
    gaps: [
      'does not yet dive, retreat, blink, or flank with explicit formation intent',
      'same radius and hull as other enemies mute the scout fantasy'
    ],
    riskNotes: [
      'future evasive movement needs bounds clamps and timeout cleanup',
      'small phase shots need contrast checks against dark and purple backgrounds'
    ]
  }
};

const SILHOUETTE_SUMMARIES: Readonly<Record<FactionVisualShape, string>> = {
  jagged: 'asymmetric scrap shard with wide teeth and warm trim',
  diamond: 'clean audit diamond with inner square frame',
  organic: 'five-lobed bio cluster made from overlapping circles',
  needle: 'thin raider needle with pointed wings and center spine'
};

export function createEnemyRoleAudit(
  options: {
    readonly factions?: readonly FactionDefinition[];
    readonly sectors?: readonly SectorDefinition[];
    readonly bosses?: readonly BossDefinition[];
  } = {}
): EnemyRoleAudit {
  const factions = options.factions ?? FACTIONS;
  const sectors = options.sectors ?? SECTORS;
  const bosses = options.bosses ?? BOSSES;
  const bossById = new Map(bosses.map((boss) => [boss.id, boss]));
  const entries = factions.map((faction) =>
    createFactionAuditEntry(faction, sectors, bosses, bossById)
  );
  const uniqueMajorWaveLabels = [...new Set(sectors.flatMap((sector) => sector.majorWavePool))]
    .filter((label) => label.trim().length > 0)
    .sort();

  return {
    currentEnemyClassCount: entries.length,
    targetRoles: PHASE_7_TARGET_ENEMY_ROLES,
    entries,
    uniqueMajorWaveLabels,
    spawnModel: {
      radius: 17,
      baseHullRange: [2, 3],
      routeHullBonus:
        'route combat modifiers may add enemyHullBonus before the enemy enters the field',
      spawnTiming:
        'spawn schedule uses scroll-distance markers when sector scroll exists, otherwise time',
      xPlacement:
        'first spawn follows encounter pacing firstSpawnXRatio; later spawns use flank ratios',
      yPlacement: 'target Y comes from sector encounter pacing or the default 86-182 range',
      factionSelection:
        'wave director weights the selected boss faction at 5 and other available factions at 2'
    },
    objectiveSafety: {
      currentRequiredTargetRule:
        'support targets equal required waves multiplied by spawns per wave, capped by non-boss enemies destroyed',
      verifiedAccountingPaths: [
        'player projectile kills call recordEnemyDefeat',
        'enemy body collisions call recordEnemyDefeat without pickups or special charge',
        'arc and blast item side-effect kills call recordEnemyDefeat',
        'boss kills increment enemiesDestroyed and bossesDefeated separately'
      ],
      riskPaths: [
        'future despawns or retreats can clear the field without adding support kill credit',
        'future carrier children can overcount or undercount objectives without target metadata',
        'future formation break rewards can bypass the shared defeat path',
        'future shield/support deaths can leave protected enemies after all spawns are issued'
      ],
      phase7Requirement:
        'roles, variants, and formations need explicit objective policy before spawning enemies that can retreat, split, transform, or deploy children'
    },
    crossCuttingGaps: [
      'normal enemy classes are currently faction patterns, not reusable role metadata',
      'semantic wave labels do not alter enemy class, formation, or attack behavior yet',
      'all normal enemies share radius, health-bar treatment, and 2-3 base hull',
      'normal enemy telegraphs are per-enemy only; wave labels do not coordinate squad attacks yet',
      'there are no upgraded variants, formation memberships, or support states'
    ],
    phase7NextSteps: [
      'add validated role metadata without changing behavior in work order 062',
      'keep movement family separated from faction identity as role profiles expand',
      'keep attack family separated from faction identity as role profiles expand',
      'define objective policy for retreating, spawned, shielded, and formation enemies',
      'add debug summaries for active role, variant, formation, and long-sector pressure'
    ]
  };
}

function createFactionAuditEntry(
  faction: FactionDefinition,
  sectors: readonly SectorDefinition[],
  bosses: readonly BossDefinition[],
  bossById: ReadonlyMap<string, BossDefinition>
): CurrentEnemyRoleAuditEntry {
  const patternAudit = PATTERN_AUDITS[faction.enemyPattern];

  return {
    ...patternAudit,
    factionId: faction.id,
    classId: faction.enemyRole.classId,
    factionName: faction.name,
    factionSummary: faction.summary,
    visualShape: faction.visualShape,
    metadata: faction.enemyRole,
    silhouetteSummary: SILHOUETTE_SUMMARIES[faction.visualShape],
    spawnContexts: getSpawnContextsForFaction(faction.id, sectors, bosses, bossById),
    objectiveInteraction:
      'counts as one support target when defeated; current runtime has no minion, variant, formation, or retreat policy'
  };
}

function getSpawnContextsForFaction(
  factionId: FactionId,
  sectors: readonly SectorDefinition[],
  bosses: readonly BossDefinition[],
  bossById: ReadonlyMap<string, BossDefinition>
): EnemySpawnContextAudit[] {
  const bossIdsForFaction = new Set(
    bosses.filter((boss) => boss.factionId === factionId).map((boss) => boss.id)
  );
  const contexts: EnemySpawnContextAudit[] = [];

  for (const sector of sectors) {
    const preferredWhenBossIds = sector.bossCandidates.filter((bossId) => {
      const boss = bossById.get(bossId);
      return boss ? bossIdsForFaction.has(boss.id) : false;
    });

    if (preferredWhenBossIds.length === 0) {
      continue;
    }

    contexts.push({
      sectorId: sector.id,
      sectorName: sector.name,
      sectorRole: sector.role,
      majorWaveLabels: sector.majorWavePool,
      preferredWhenBossIds
    });
  }

  return contexts;
}
