import type { FactionId } from './factions';

export const FACTION_FRONT_KINDS = [
  'territory',
  'blockade',
  'convoy',
  'distressLane',
  'market',
  'contestedSetPiece',
  'carrierAccess'
] as const;
export type FactionFrontKind = (typeof FACTION_FRONT_KINDS)[number];

export const FACTION_FRONT_STANCES = ['alliance', 'hostility', 'opportunist'] as const;
export type FactionFrontStance = (typeof FACTION_FRONT_STANCES)[number];

export interface FactionFrontStrategyDefinition {
  readonly factionId: FactionId;
  readonly stance: FactionFrontStance;
  readonly label: string;
  readonly kind: FactionFrontKind;
  readonly mapCue: string;
  readonly forecast: string;
  readonly nodePolicy: 'create' | 'transform' | 'close';
  readonly priceDelta: number;
  readonly hazardDensityDelta: number;
  readonly reinforcementCount: number;
  readonly supportCount: number;
  readonly crewAccess: boolean;
  readonly carrierAccess: boolean;
  readonly endingWeight: number;
}

export const FACTION_FRONT_STRATEGIES: readonly FactionFrontStrategyDefinition[] = [
  strategy('faction_scrap_court', 'alliance', 'Shared Claim Convoy', 'convoy', '[CONVOY+]', 'Court claimants tow a salvage convoy and open a recovery operation.', 'create', 1, -1, 0, 1, true, true, 2),
  strategy('faction_scrap_court', 'hostility', 'Wreck-Tithe Blockade', 'blockade', '[BLOCKADE!]', 'Court hulks weld a claim wall across the reserve lane.', 'close', -2, 1, 2, 0, false, false, -2),
  strategy('faction_scrap_court', 'opportunist', 'Open Wreck Auction', 'market', '[AUCTION?]', 'A temporary wreck auction transforms the reserve lane into a risky claim market.', 'transform', 0, 0, 1, 0, false, true, 0),

  strategy('faction_corporate_ledger', 'alliance', 'Permit Corridor', 'carrierAccess', '[PERMIT+]', 'Ledger permits create a carrier-access corridor with audited support.', 'create', 3, 0, 0, 1, true, true, 2),
  strategy('faction_corporate_ledger', 'hostility', 'Compound Audit Wall', 'blockade', '[WARRANT!]', 'Compound warrants close the reserve node behind hardened lane screens.', 'close', -3, 1, 2, 0, false, false, -3),
  strategy('faction_corporate_ledger', 'opportunist', 'Escrow Exchange', 'market', '[ESCROW?]', 'Neutral auditors transform the node into an escrow market with strict prices.', 'transform', 1, 0, 1, 0, false, true, 1),

  strategy('faction_bloom_hive', 'alliance', 'Symbiotic Distress Bloom', 'distressLane', '[DISTRESS+]', 'A living distress lane creates a rescue node and specialist signal.', 'create', 1, -1, 0, 2, true, true, 3),
  strategy('faction_bloom_hive', 'hostility', 'Spore Border', 'territory', '[SPORE-BORDER!]', 'The living border transforms the reserve node into dense hostile territory.', 'transform', -1, 2, 2, 0, false, false, -2),
  strategy('faction_bloom_hive', 'opportunist', 'Seed Exchange', 'contestedSetPiece', '[SEED?]', 'A contested seed engine transforms ownership and hazard geometry.', 'transform', 0, 1, 1, 1, true, true, 1),

  strategy('faction_void_corsairs', 'alliance', 'Phase Escort Wake', 'convoy', '[PHASE+]', 'Corsair escorts create a phase-cut pursuit node and carrier passage.', 'create', 2, -1, 0, 2, true, true, 2),
  strategy('faction_void_corsairs', 'hostility', 'Ransom Cordon', 'blockade', '[RANSOM!]', 'A ransom cordon closes the reserve lane and adds crossing reinforcements.', 'close', -3, 1, 3, 0, false, false, -3),
  strategy('faction_void_corsairs', 'opportunist', 'Smuggler Vector', 'market', '[SMUGGLE?]', 'A smuggler vector transforms the node into a fast, unstable market run.', 'transform', 0, 1, 1, 1, false, true, 0)
];

export function getFactionFrontStrategy(
  factionId: FactionId,
  stance: FactionFrontStance
): FactionFrontStrategyDefinition {
  const strategy = FACTION_FRONT_STRATEGIES.find(
    (candidate) => candidate.factionId === factionId && candidate.stance === stance
  );
  if (!strategy) throw new Error(`Missing faction front strategy for ${factionId}/${stance}.`);
  return strategy;
}

function strategy(
  factionId: FactionId,
  stance: FactionFrontStance,
  label: string,
  kind: FactionFrontKind,
  mapCue: string,
  forecast: string,
  nodePolicy: FactionFrontStrategyDefinition['nodePolicy'],
  priceDelta: number,
  hazardDensityDelta: number,
  reinforcementCount: number,
  supportCount: number,
  crewAccess: boolean,
  carrierAccess: boolean,
  endingWeight: number
): FactionFrontStrategyDefinition {
  return {
    factionId,
    stance,
    label,
    kind,
    mapCue,
    forecast,
    nodePolicy,
    priceDelta,
    hazardDensityDelta,
    reinforcementCount,
    supportCount,
    crewAccess,
    carrierAccess,
    endingWeight
  };
}
