import { getApexThreatDefinition } from '../content/apexThreats';
import { getItemById, type ItemId } from '../content/items';
import { createRng } from '../core/rng';
import type { ApexHuntPlan, ApexHuntState } from './ApexHunt';
import type { RewardChoice } from './Rewards';

export interface ApexCircuitRewardChoice extends RewardChoice {
  readonly apexReward: {
    readonly threatId: string;
    readonly threatName: string;
    readonly mapCue: string;
  };
}

export function createResolvedApexCircuitReward(options: {
  readonly plan: ApexHuntPlan;
  readonly state: ApexHuntState;
  readonly sectorIndex: number;
  readonly excludeItemIds?: readonly ItemId[];
}): ApexCircuitRewardChoice | null {
  const threatPlan = options.plan.threats.find(
    (candidate) => candidate.encounters.at(-1)?.sectorIndex === options.sectorIndex
  );
  if (!threatPlan) return null;

  const threatState = options.state.threats.find(
    (candidate) => candidate.threatId === threatPlan.definitionId
  );
  if (threatState?.status !== 'resolved') return null;

  const definition = getApexThreatDefinition(threatPlan.definitionId);
  const excluded = new Set(options.excludeItemIds ?? []);
  const available = definition.circuitRewardItemIds.filter((itemId) => !excluded.has(itemId));
  if (available.length === 0) return null;

  const rng = createRng(
    `${options.plan.seed}:apex-circuit-reward:${options.plan.saveFingerprint}:${definition.id}:s${options.sectorIndex + 1}`
  );
  const item = getItemById(rng.choice(available));

  return {
    item,
    weight: 1,
    sourceHint: `${definition.mapCue} ${definition.name} apex spoil`,
    poolProfileId: 'apex',
    apexReward: {
      threatId: definition.id,
      threatName: definition.name,
      mapCue: definition.mapCue
    }
  };
}
