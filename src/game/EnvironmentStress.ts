import { getHazardZoneDefinition } from '../content/hazardZones';
import type { CombatEntityCounts } from './CombatState';
import type { ActiveSectorHazard } from './SectorFeatures';

export interface EnvironmentStressDebugState {
  readonly activeHazards: number;
  readonly hazardBudget: number;
  readonly hazardLabels: readonly string[];
  readonly environmentObjects: number;
  readonly environmentObjectBudget: number;
  readonly destructibles: number;
  readonly obstacles: number;
  readonly loosePickups: number;
  readonly loosePickupCap: number;
  readonly looseValue: number;
  readonly looseValueCap: number;
  readonly withinBudget: boolean;
}

const ACTIVE_HAZARD_BUDGET = 4;
const ACTIVE_ENVIRONMENT_OBJECT_BUDGET = 16;

export function createEnvironmentStressDebugState(
  activeHazards: readonly ActiveSectorHazard[],
  counts: CombatEntityCounts
): EnvironmentStressDebugState {
  const hazardLabels = [
    ...new Set(
      activeHazards.map((activeHazard) => getHazardZoneDefinition(activeHazard.hazard.kind).debugLabel)
    )
  ];
  const withinBudget =
    activeHazards.length <= ACTIVE_HAZARD_BUDGET &&
    counts.environmentObjects <= ACTIVE_ENVIRONMENT_OBJECT_BUDGET &&
    counts.looseCurrencyPickups <= counts.looseCurrencyPickupCap &&
    counts.looseCurrencyValue <= counts.looseCurrencyValueCap;

  return {
    activeHazards: activeHazards.length,
    hazardBudget: ACTIVE_HAZARD_BUDGET,
    hazardLabels,
    environmentObjects: counts.environmentObjects,
    environmentObjectBudget: ACTIVE_ENVIRONMENT_OBJECT_BUDGET,
    destructibles: counts.destructibles,
    obstacles: counts.obstacles,
    loosePickups: counts.looseCurrencyPickups,
    loosePickupCap: counts.looseCurrencyPickupCap,
    looseValue: counts.looseCurrencyValue,
    looseValueCap: counts.looseCurrencyValueCap,
    withinBudget
  };
}
