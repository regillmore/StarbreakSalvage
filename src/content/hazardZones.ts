import type { FactionId } from './factions';
import type { SectorId } from './sectors';

export const HAZARD_ZONE_IDS = [
  'debris_lane',
  'warning_beam',
  'mine_belt',
  'salvage_storm',
  'crush_gate',
  'dust_plume',
  'mining_laser',
  'surface_defense_arc'
] as const;
export type HazardZoneId = (typeof HAZARD_ZONE_IDS)[number];

export const HAZARD_ZONE_FAMILIES = [
  'debris',
  'beam',
  'mine',
  'storm',
  'gate',
  'dust',
  'laser',
  'arc'
] as const;
export type HazardZoneFamily = (typeof HAZARD_ZONE_FAMILIES)[number];

export const HAZARD_ZONE_TELEGRAPH_SHAPES = [
  'bandWarning',
  'beamLine',
  'mineStripe',
  'stormNoise',
  'gateRails',
  'dustWake',
  'laserTrace',
  'surfaceArc'
] as const;
export type HazardZoneTelegraphShape = (typeof HAZARD_ZONE_TELEGRAPH_SHAPES)[number];

export const HAZARD_ZONE_DAMAGE_SHAPES = ['verticalBand', 'beamSegment'] as const;
export type HazardZoneDamageShape = (typeof HAZARD_ZONE_DAMAGE_SHAPES)[number];

export const HAZARD_ZONE_SAFE_LANE_POLICIES = ['avoidMarkedLane'] as const;
export type HazardZoneSafeLanePolicy = (typeof HAZARD_ZONE_SAFE_LANE_POLICIES)[number];

export const HAZARD_ZONE_RENDER_LAYERS = ['underBullets'] as const;
export type HazardZoneRenderLayer = (typeof HAZARD_ZONE_RENDER_LAYERS)[number];

export const HAZARD_ZONE_COLLISION_SHAPES = ['verticalBand', 'beamSegment'] as const;
export type HazardZoneCollisionShape = (typeof HAZARD_ZONE_COLLISION_SHAPES)[number];

export const HAZARD_ZONE_SETTINGS_VARIANTS = [
  'standard',
  'staticPulse',
  'simplifiedPattern'
] as const;
export type HazardZoneSettingsVariant = (typeof HAZARD_ZONE_SETTINGS_VARIANTS)[number];

export const HAZARD_ZONE_BOSS_ARENA_POLICIES = ['settleBeforeLock'] as const;
export type HazardZoneBossArenaPolicy = (typeof HAZARD_ZONE_BOSS_ARENA_POLICIES)[number];

export const HAZARD_ZONE_SCHEDULE_SOURCES = ['sector', 'condition', 'pacing'] as const;
export type HazardZoneScheduleSource = (typeof HAZARD_ZONE_SCHEDULE_SOURCES)[number];

export const HAZARD_ZONE_BEHAVIOR_KINDS = [
  'sweepBeam',
  'pulseField',
  'discreteMineCluster',
  'collapsingColumns',
  'orbitalShadow',
  'salvageSquall',
  'dustFront',
  'staticWarningGate'
] as const;
export type HazardZoneBehaviorKind = (typeof HAZARD_ZONE_BEHAVIOR_KINDS)[number];

export interface HazardZoneTimingMetrics {
  readonly widthRatio: number;
  readonly activeSpan: number;
  readonly telegraphLead: number;
}

export interface HazardZonePhaseMetadata {
  readonly minTelegraphLead: number;
  readonly minActiveSpan: number;
}

export interface HazardZoneSafeLaneMetadata {
  readonly policy: HazardZoneSafeLanePolicy;
  readonly minSafeWidthRatio: number;
}

export interface HazardZoneReadabilityMetadata {
  readonly renderLayer: HazardZoneRenderLayer;
  readonly collisionShape: HazardZoneCollisionShape;
  readonly maxFillAlpha: number;
  readonly maxStrokeAlpha: number;
  readonly minTelegraphLead: number;
  readonly normalColor: string;
  readonly highContrastColor: string;
  readonly reducedMotionVariant: HazardZoneSettingsVariant;
  readonly performanceVariant: HazardZoneSettingsVariant;
}

export interface HazardZoneBehaviorMetadata {
  readonly kind: HazardZoneBehaviorKind;
  readonly warningCue: string;
  readonly activeCue: string;
  readonly motionScale: number;
  readonly activeDamageDutyCycle: number;
  readonly activePulseCount: number;
  readonly collisionBands: number;
  readonly patternDensity: number;
}

export interface HazardZoneDefinition {
  readonly id: HazardZoneId;
  readonly family: HazardZoneFamily;
  readonly label: string;
  readonly debugLabel: string;
  readonly summary: string;
  readonly sectorFit: readonly SectorId[];
  readonly factionFit: 'any' | readonly FactionId[];
  readonly telegraphShape: HazardZoneTelegraphShape;
  readonly activeDamageShape: HazardZoneDamageShape;
  readonly metrics: Readonly<Record<HazardZoneScheduleSource, HazardZoneTimingMetrics>>;
  readonly phase: HazardZonePhaseMetadata;
  readonly damage: number;
  readonly damageCooldownSeconds: number;
  readonly safeLane: HazardZoneSafeLaneMetadata;
  readonly bossArenaPolicy: HazardZoneBossArenaPolicy;
  readonly readability: HazardZoneReadabilityMetadata;
  readonly behavior: HazardZoneBehaviorMetadata;
}

const ALL_SECTOR_IDS: readonly SectorId[] = [
  'sector_outer_debris_field',
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid',
  'sector_lunar_surface',
  'sector_core_wreck',
  'sector_nullglass_expanse',
  'sector_gravity_choir',
  'sector_dead_signal_reef',
  'sector_parallax_foundry',
  'sector_horizon_scar'
];

export const HAZARD_ZONE_CHOICES: Readonly<Record<SectorId, readonly HazardZoneId[]>> = {
  sector_outer_debris_field: ['debris_lane', 'mine_belt', 'salvage_storm'],
  sector_trade_war_corridor: ['warning_beam', 'mine_belt', 'debris_lane'],
  sector_bio_machine_bloom: ['salvage_storm', 'debris_lane', 'mine_belt'],
  sector_corporate_kill_grid: ['warning_beam', 'crush_gate', 'mine_belt'],
  sector_lunar_surface: ['dust_plume', 'mining_laser', 'surface_defense_arc'],
  sector_core_wreck: ['crush_gate', 'warning_beam', 'salvage_storm'],
  sector_nullglass_expanse: ['warning_beam', 'salvage_storm', 'mine_belt'],
  sector_gravity_choir: ['crush_gate', 'warning_beam', 'mine_belt'],
  sector_dead_signal_reef: ['debris_lane', 'mine_belt', 'salvage_storm'],
  sector_parallax_foundry: ['mining_laser', 'salvage_storm', 'crush_gate'],
  sector_horizon_scar: ['crush_gate', 'warning_beam', 'salvage_storm']
};

export const HAZARD_ZONE_PACING_CHOICES: Readonly<Record<SectorId, readonly HazardZoneId[]>> = {
  sector_outer_debris_field: ['debris_lane', 'mine_belt'],
  sector_trade_war_corridor: ['warning_beam', 'mine_belt'],
  sector_bio_machine_bloom: ['salvage_storm', 'mine_belt'],
  sector_corporate_kill_grid: ['warning_beam', 'crush_gate'],
  sector_lunar_surface: ['dust_plume', 'mining_laser', 'surface_defense_arc'],
  sector_core_wreck: ['crush_gate', 'warning_beam'],
  sector_nullglass_expanse: ['warning_beam', 'salvage_storm'],
  sector_gravity_choir: ['crush_gate', 'warning_beam'],
  sector_dead_signal_reef: ['debris_lane', 'mine_belt'],
  sector_parallax_foundry: ['mining_laser', 'salvage_storm'],
  sector_horizon_scar: ['crush_gate', 'warning_beam']
};

export const DEFAULT_HAZARD_ZONE_PACING_CHOICES: readonly HazardZoneId[] = [
  'debris_lane',
  'mine_belt'
];

export const HAZARD_ZONE_DEFINITIONS: readonly HazardZoneDefinition[] = [
  {
    id: 'debris_lane',
    family: 'debris',
    label: 'DEBRIS LANE',
    debugLabel: 'debris',
    summary: 'a lane of tumbling hull scrap that asks the player to shift around marked space',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'bandWarning',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.2, activeSpan: 190, telegraphLead: 150 },
      condition: { widthRatio: 0.2, activeSpan: 175, telegraphLead: 145 },
      pacing: { widthRatio: 0.2, activeSpan: 170, telegraphLead: 145 }
    },
    phase: { minTelegraphLead: 120, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.5 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(120, '#8aa4b8', '#f8fbff', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior('orbitalShadow', 'shadow track', 'debris shadow', 0.32, 1, 1, 1, 0.42)
  },
  {
    id: 'warning_beam',
    family: 'beam',
    label: 'WARNING BEAM',
    debugLabel: 'beam',
    summary:
      'a world-anchored firing track crossed by a finite-velocity, allegiance-blind energy bolt',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'beamLine',
    activeDamageShape: 'beamSegment',
    metrics: {
      sector: { widthRatio: 0.12, activeSpan: 140, telegraphLead: 170 },
      condition: { widthRatio: 0.12, activeSpan: 130, telegraphLead: 170 },
      pacing: { widthRatio: 0.11, activeSpan: 125, telegraphLead: 180 }
    },
    phase: { minTelegraphLead: 145, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.68 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(
      145,
      '#ffd166',
      '#ffef5f',
      'staticPulse',
      'simplifiedPattern',
      'beamSegment'
    ),
    behavior: createBehavior(
      'staticWarningGate',
      'centerline lock',
      'tax-beacon burn',
      0.18,
      1,
      1,
      1,
      0.34
    )
  },
  {
    id: 'mine_belt',
    family: 'mine',
    label: 'MINE BELT',
    debugLabel: 'mines',
    summary: 'a cluster envelope that anchors discrete destructible proximity mines in world space',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'mineStripe',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.32, activeSpan: 165, telegraphLead: 145 },
      condition: { widthRatio: 0.32, activeSpan: 160, telegraphLead: 145 },
      pacing: { widthRatio: 0.32, activeSpan: 155, telegraphLead: 145 }
    },
    phase: { minTelegraphLead: 120, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.44 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(120, '#ff6bd6', '#f8fbff', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior(
      'discreteMineCluster',
      'anchor pings',
      'proximity fuses',
      0,
      1,
      1,
      1,
      0.46
    )
  },
  {
    id: 'salvage_storm',
    family: 'storm',
    label: 'SALVAGE SQUALL',
    debugLabel: 'squall',
    summary:
      'a broad three-surge front of charged wreckage with a calm channel crossing between lanes',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'stormNoise',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.64, activeSpan: 270, telegraphLead: 180 },
      condition: { widthRatio: 0.64, activeSpan: 265, telegraphLead: 180 },
      pacing: { widthRatio: 0.64, activeSpan: 255, telegraphLead: 180 }
    },
    phase: { minTelegraphLead: 150, minActiveSpan: 90 },
    damage: 1,
    damageCooldownSeconds: 0.6,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.3 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(150, '#72f1da', '#ffffff', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior(
      'salvageSquall',
      'calm-channel forecast',
      'charged salvage surge',
      0.52,
      0.64,
      3,
      3,
      0.78
    )
  },
  {
    id: 'crush_gate',
    family: 'gate',
    label: 'CRUSH GATE',
    debugLabel: 'gate',
    summary: 'a mechanical gate warning that makes the center lane unsafe for a short span',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'gateRails',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.28, activeSpan: 130, telegraphLead: 180 },
      condition: { widthRatio: 0.28, activeSpan: 125, telegraphLead: 180 },
      pacing: { widthRatio: 0.28, activeSpan: 125, telegraphLead: 180 }
    },
    phase: { minTelegraphLead: 150, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.46 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(150, '#ffd166', '#ffef5f', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior(
      'collapsingColumns',
      'closing rails',
      'crush stroke',
      0.26,
      1,
      1,
      2,
      0.5
    )
  },
  {
    id: 'dust_plume',
    family: 'dust',
    label: 'DUST PLUME',
    debugLabel: 'dust',
    summary: 'a low-altitude dust plume with softer marks over lunar terrain',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'dustWake',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.34, activeSpan: 180, telegraphLead: 170 },
      condition: { widthRatio: 0.34, activeSpan: 175, telegraphLead: 165 },
      pacing: { widthRatio: 0.34, activeSpan: 170, telegraphLead: 165 }
    },
    phase: { minTelegraphLead: 140, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.42 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(140, '#c8d4e3', '#f8fbff', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior('dustFront', 'dust wake', 'sand shear', 0.62, 0.92, 1, 1, 0.56)
  },
  {
    id: 'mining_laser',
    family: 'laser',
    label: 'MINING LASER',
    debugLabel: 'laser',
    summary: 'a narrow surface mining beam with the longest current warning lead',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'laserTrace',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.1, activeSpan: 125, telegraphLead: 190 },
      condition: { widthRatio: 0.1, activeSpan: 120, telegraphLead: 185 },
      pacing: { widthRatio: 0.11, activeSpan: 125, telegraphLead: 180 }
    },
    phase: { minTelegraphLead: 150, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.7 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(150, '#ffd166', '#ffef5f', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior('sweepBeam', 'sweep trace', 'mining sweep', 0.74, 1, 1, 1, 0.38)
  },
  {
    id: 'surface_defense_arc',
    family: 'arc',
    label: 'SURFACE ARC',
    debugLabel: 'arc',
    summary: 'a curved surface-defense warning band that reads differently from straight beams',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    telegraphShape: 'surfaceArc',
    activeDamageShape: 'verticalBand',
    metrics: {
      sector: { widthRatio: 0.24, activeSpan: 155, telegraphLead: 175 },
      condition: { widthRatio: 0.24, activeSpan: 150, telegraphLead: 170 },
      pacing: { widthRatio: 0.24, activeSpan: 150, telegraphLead: 170 }
    },
    phase: { minTelegraphLead: 145, minActiveSpan: 70 },
    damage: 1,
    damageCooldownSeconds: 0.35,
    safeLane: { policy: 'avoidMarkedLane', minSafeWidthRatio: 0.5 },
    bossArenaPolicy: 'settleBeforeLock',
    readability: createReadability(145, '#7cf7ff', '#f8fbff', 'staticPulse', 'simplifiedPattern'),
    behavior: createBehavior('pulseField', 'arc charge', 'defense pulse', 0.42, 0.58, 3, 2, 0.58)
  }
];

const HAZARD_ZONES_BY_ID = new Map<HazardZoneId, HazardZoneDefinition>(
  HAZARD_ZONE_DEFINITIONS.map((hazard) => [hazard.id, hazard])
);

export function getHazardZoneDefinition(id: HazardZoneId): HazardZoneDefinition {
  const definition = HAZARD_ZONES_BY_ID.get(id);

  if (!definition) {
    throw new Error(`Unknown hazard zone id: ${id}`);
  }

  return definition;
}

export function getHazardZoneMetrics(
  id: HazardZoneId,
  source: HazardZoneScheduleSource = 'sector'
): HazardZoneTimingMetrics {
  return getHazardZoneDefinition(id).metrics[source];
}

export function getHazardZoneReadability(id: HazardZoneId): HazardZoneReadabilityMetadata {
  return getHazardZoneDefinition(id).readability;
}

export function getHazardZoneColor(id: HazardZoneId, highContrast: boolean): string {
  const readability = getHazardZoneDefinition(id).readability;
  return highContrast ? readability.highContrastColor : readability.normalColor;
}

function createReadability(
  minTelegraphLead: number,
  normalColor: string,
  highContrastColor: string,
  reducedMotionVariant: HazardZoneSettingsVariant,
  performanceVariant: HazardZoneSettingsVariant,
  collisionShape: HazardZoneCollisionShape = 'verticalBand'
): HazardZoneReadabilityMetadata {
  return {
    renderLayer: 'underBullets',
    collisionShape,
    maxFillAlpha: 0.11,
    maxStrokeAlpha: 0.88,
    minTelegraphLead,
    normalColor,
    highContrastColor,
    reducedMotionVariant,
    performanceVariant
  };
}

function createBehavior(
  kind: HazardZoneBehaviorKind,
  warningCue: string,
  activeCue: string,
  motionScale: number,
  activeDamageDutyCycle: number,
  activePulseCount: number,
  collisionBands: number,
  patternDensity: number
): HazardZoneBehaviorMetadata {
  return {
    kind,
    warningCue,
    activeCue,
    motionScale,
    activeDamageDutyCycle,
    activePulseCount,
    collisionBands,
    patternDensity
  };
}
