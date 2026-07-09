import { clamp } from '../core/math';
import type { EnemyRolePressureSummary } from './EnemyRolePressure';
import type { EnvironmentStressDebugState } from './EnvironmentStress';
import type { HazardZoneDirectorPlan } from './HazardZoneDirector';
import type { ItemLoadoutStressModel } from './ItemStress';
import type { SectorRoute } from './Generation';
import type { SectorPacingPlan, SectorPacingPressureBand } from './SectorPacing';

export type ActPressureKind = 'baseline' | 'sustained' | 'volatile' | 'finale';

export interface ActPressureModel {
  readonly actId: string;
  readonly actLabel: string;
  readonly actShortLabel: string;
  readonly actSectorIndex: number;
  readonly actSectorCount: number;
  readonly runSectorIndex: number;
  readonly pressureTier: string;
  readonly pressureBand: SectorPacingPressureBand;
  readonly pressureKind: ActPressureKind;
  readonly intensity: 0 | 1 | 2 | 3;
  readonly routePressure: boolean;
  readonly hazardPressure: number;
  readonly environmentObjectTargetBonus: number;
  readonly looseCurrencyValueBonus: number;
  readonly debugLabel: string;
}

export interface ActPressureBudgetReadout {
  readonly used: number;
  readonly budget: number;
  readonly remaining: number;
  readonly withinBudget: boolean;
}

export interface ActPressureDebugState {
  readonly actId: string;
  readonly label: string;
  readonly pressureKind: ActPressureKind;
  readonly intensity: number;
  readonly pressureBand: SectorPacingPressureBand;
  readonly routePressure: boolean;
  readonly hazardPressure: number;
  readonly environmentObjectTargetBonus: number;
  readonly looseCurrencyValueBonus: number;
  readonly combined: ActPressureBudgetReadout;
  readonly enemy: {
    readonly active: number;
    readonly projectiles: number;
    readonly projectileBudget: number;
    readonly telegraphs: number;
    readonly telegraphBudget: number;
    readonly variants: number;
    readonly formations: number;
    readonly metaUsed: number;
    readonly metaBudget: number;
    readonly withinBudget: boolean;
  };
  readonly hazard: {
    readonly active: number;
    readonly budget: number;
    readonly scheduled: number;
    readonly total: number;
    readonly pressureLevel: number;
    readonly bossDeferrals: number;
  };
  readonly environment: {
    readonly objects: number;
    readonly objectBudget: number;
    readonly destructibles: number;
    readonly obstacles: number;
    readonly withinBudget: boolean;
  };
  readonly pickup: {
    readonly active: number;
    readonly pickupBudget: number;
    readonly value: number;
    readonly valueBudget: number;
  };
  readonly item: {
    readonly hookApplications: number;
    readonly hookBudget: number;
    readonly activeHookTypes: number;
    readonly peakHookApplications: number;
    readonly procBudget: number;
    readonly skippedHookApplications: number;
    readonly withinBudget: boolean;
  };
}

export interface CreateActPressureModelOptions {
  readonly sector: SectorRoute;
  readonly pacing: SectorPacingPlan;
}

export interface CreateActPressureDebugStateOptions {
  readonly model: ActPressureModel;
  readonly enemyRoles: EnemyRolePressureSummary;
  readonly environmentStress: EnvironmentStressDebugState;
  readonly itemStress: ItemLoadoutStressModel;
  readonly hazardZoneDirector: HazardZoneDirectorPlan;
}

export const ACT_PRESSURE_COMBINED_BUDGET = 100;

const ACT_PRESSURE_INTENSITY: Readonly<Record<ActPressureKind, 0 | 1 | 2 | 3>> = {
  baseline: 0,
  sustained: 1,
  volatile: 2,
  finale: 3
};

const COMBINED_WEIGHTS = {
  enemyProjectiles: 18,
  enemyTelegraphs: 10,
  enemyMeta: 10,
  hazards: 15,
  environmentObjects: 13,
  loosePickups: 10,
  looseValue: 10,
  itemHooks: 14
} as const;

export function createActPressureModel(options: CreateActPressureModelOptions): ActPressureModel {
  const pressureKind = chooseActPressureKind(options.sector, options.pacing);
  const intensity = ACT_PRESSURE_INTENSITY[pressureKind];
  const escalatedAct = isEscalatedAct(options.sector);
  const routePressure = escalatedAct && intensity >= 1;
  const hazardPressure = escalatedAct && intensity >= 1 ? 1 : 0;
  const environmentObjectTargetBonus = escalatedAct && intensity >= 2 ? 1 : 0;
  const looseCurrencyValueBonus = escalatedAct ? Math.min(2, intensity) : 0;

  return {
    actId: options.sector.act.actId,
    actLabel: options.sector.act.actName,
    actShortLabel: options.sector.act.actShortLabel,
    actSectorIndex: options.sector.act.actSectorIndex,
    actSectorCount: options.sector.act.actSectorCount,
    runSectorIndex: options.sector.act.runSectorIndex,
    pressureTier: options.sector.act.pressureTier,
    pressureBand: options.pacing.pressureBand,
    pressureKind,
    intensity,
    routePressure,
    hazardPressure,
    environmentObjectTargetBonus,
    looseCurrencyValueBonus,
    debugLabel: `${options.sector.act.actShortLabel} ${pressureKind} I${intensity}`
  };
}

export function getActPressureRoutePressure(model: ActPressureModel): boolean {
  return model.routePressure;
}

export function getActPressureEnvironmentObjectTargetCount(
  baseTargetCount: number,
  model: ActPressureModel
): number {
  return clamp(Math.floor(baseTargetCount + model.environmentObjectTargetBonus), 1, 5);
}

export function getActPressureLooseCurrencyValueBonus(model: ActPressureModel): number {
  return model.looseCurrencyValueBonus;
}

export function shouldScheduleActPressureHazard(model: ActPressureModel): boolean {
  return model.hazardPressure > 0;
}

export function getActPressureHazardRatio(model: ActPressureModel): number {
  if (model.pressureKind === 'finale') {
    return 0.72;
  }

  if (model.pressureKind === 'volatile') {
    return 0.58;
  }

  return 0.62;
}

export function createActPressureDebugState(
  options: CreateActPressureDebugStateOptions
): ActPressureDebugState {
  const enemyMetaUsed = options.enemyRoles.variantCount + options.enemyRoles.formationCount;
  const enemyMetaBudget = Math.max(1, options.enemyRoles.totalEnemies * 2);
  const itemHookBudget =
    options.itemStress.activeHookTypes > 0
      ? options.itemStress.activeHookTypes * options.itemStress.procBudget
      : options.itemStress.procBudget;
  const combinedUsed = roundPressureValue(
    weightedRatio(
      options.enemyRoles.enemyProjectiles,
      options.enemyRoles.enemyProjectileBudget,
      COMBINED_WEIGHTS.enemyProjectiles
    ) +
      weightedRatio(
        options.enemyRoles.telegraphs,
        options.enemyRoles.telegraphBudget,
        COMBINED_WEIGHTS.enemyTelegraphs
      ) +
      weightedRatio(enemyMetaUsed, enemyMetaBudget, COMBINED_WEIGHTS.enemyMeta) +
      weightedRatio(
        options.environmentStress.activeHazards,
        options.environmentStress.hazardBudget,
        COMBINED_WEIGHTS.hazards
      ) +
      weightedRatio(
        options.environmentStress.environmentObjects,
        options.environmentStress.environmentObjectBudget,
        COMBINED_WEIGHTS.environmentObjects
      ) +
      weightedRatio(
        options.environmentStress.loosePickups,
        options.environmentStress.loosePickupCap,
        COMBINED_WEIGHTS.loosePickups
      ) +
      weightedRatio(
        options.environmentStress.looseValue,
        options.environmentStress.looseValueCap,
        COMBINED_WEIGHTS.looseValue
      ) +
      weightedRatio(options.itemStress.hookApplications, itemHookBudget, COMBINED_WEIGHTS.itemHooks)
  );
  const itemWithinBudget = options.itemStress.skippedHookApplications === 0;
  const combinedWithinBudget =
    combinedUsed <= ACT_PRESSURE_COMBINED_BUDGET &&
    options.enemyRoles.withinStressBudget &&
    options.environmentStress.withinBudget &&
    itemWithinBudget;

  return {
    actId: options.model.actId,
    label: options.model.debugLabel,
    pressureKind: options.model.pressureKind,
    intensity: options.model.intensity,
    pressureBand: options.model.pressureBand,
    routePressure: options.model.routePressure,
    hazardPressure: options.model.hazardPressure,
    environmentObjectTargetBonus: options.model.environmentObjectTargetBonus,
    looseCurrencyValueBonus: options.model.looseCurrencyValueBonus,
    combined: {
      used: combinedUsed,
      budget: ACT_PRESSURE_COMBINED_BUDGET,
      remaining: Math.max(0, roundPressureValue(ACT_PRESSURE_COMBINED_BUDGET - combinedUsed)),
      withinBudget: combinedWithinBudget
    },
    enemy: {
      active: options.enemyRoles.totalEnemies,
      projectiles: options.enemyRoles.enemyProjectiles,
      projectileBudget: options.enemyRoles.enemyProjectileBudget,
      telegraphs: options.enemyRoles.telegraphs,
      telegraphBudget: options.enemyRoles.telegraphBudget,
      variants: options.enemyRoles.variantCount,
      formations: options.enemyRoles.formationCount,
      metaUsed: enemyMetaUsed,
      metaBudget: enemyMetaBudget,
      withinBudget: options.enemyRoles.withinStressBudget
    },
    hazard: {
      active: options.environmentStress.activeHazards,
      budget: options.environmentStress.hazardBudget,
      scheduled: options.hazardZoneDirector.scheduledHazardCount,
      total: options.hazardZoneDirector.totalHazardCount,
      pressureLevel: options.hazardZoneDirector.pressureLevel,
      bossDeferrals: options.hazardZoneDirector.bossDeferralCount
    },
    environment: {
      objects: options.environmentStress.environmentObjects,
      objectBudget: options.environmentStress.environmentObjectBudget,
      destructibles: options.environmentStress.destructibles,
      obstacles: options.environmentStress.obstacles,
      withinBudget: options.environmentStress.withinBudget
    },
    pickup: {
      active: options.environmentStress.loosePickups,
      pickupBudget: options.environmentStress.loosePickupCap,
      value: options.environmentStress.looseValue,
      valueBudget: options.environmentStress.looseValueCap
    },
    item: {
      hookApplications: options.itemStress.hookApplications,
      hookBudget: itemHookBudget,
      activeHookTypes: options.itemStress.activeHookTypes,
      peakHookApplications: options.itemStress.peakHookApplications,
      procBudget: options.itemStress.procBudget,
      skippedHookApplications: options.itemStress.skippedHookApplications,
      withinBudget: itemWithinBudget
    }
  };
}

function chooseActPressureKind(sector: SectorRoute, pacing: SectorPacingPlan): ActPressureKind {
  if (!isEscalatedAct(sector)) {
    return 'baseline';
  }

  if (pacing.pressureBand === 'finale') {
    return 'finale';
  }

  if (pacing.pressureBand === 'volatile' || pacing.pressureBand === 'bossApproach') {
    return 'volatile';
  }

  return 'sustained';
}

function isEscalatedAct(sector: SectorRoute): boolean {
  return sector.act.pressureTier !== 'baseline' || sector.act.actIndex > 1;
}

function weightedRatio(used: number, budget: number, weight: number): number {
  if (budget <= 0) {
    return used > 0 ? weight : 0;
  }

  return clamp(used / budget, 0, 1) * weight;
}

function roundPressureValue(value: number): number {
  return Math.round(value * 10) / 10;
}
