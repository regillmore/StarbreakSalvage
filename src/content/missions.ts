export type MissionStageKind =
  'briefing' | 'entry' | 'combat' | 'branch' | 'relief' | 'extraction' | 'failure' | 'completion';

export type MissionHullCarryPolicy = 'reset' | 'carry';
export type MissionWorldCarryPolicy = 'reset' | 'continue';
export type MissionBossPolicy = 'inherit' | 'none';

export const MISSION_STAGE_KINDS: readonly MissionStageKind[] = [
  'briefing',
  'entry',
  'combat',
  'branch',
  'relief',
  'extraction',
  'failure',
  'completion'
];

export interface MissionCarryPolicy {
  readonly build: 'carry';
  readonly hull: MissionHullCarryPolicy;
  readonly resources: 'carry';
  readonly routeContext: 'carry';
  readonly scrollWorld: MissionWorldCarryPolicy;
}

export interface MissionWorldSetup {
  readonly scrollLengthScale: number;
  readonly waveCountScale: number;
  readonly bossPolicy: MissionBossPolicy;
  readonly seedNamespace: string;
}

export interface MissionStageProfileDefinition {
  readonly id: string;
  readonly kind: MissionStageKind;
  readonly label: string;
  readonly carry: MissionCarryPolicy;
  readonly world: MissionWorldSetup | null;
}

const RESET_STAGE: MissionCarryPolicy = {
  build: 'carry',
  hull: 'reset',
  resources: 'carry',
  routeContext: 'carry',
  scrollWorld: 'reset'
};

const CARRY_STAGE: MissionCarryPolicy = {
  build: 'carry',
  hull: 'carry',
  resources: 'carry',
  routeContext: 'carry',
  scrollWorld: 'continue'
};

export const MISSION_STAGE_PROFILES: readonly MissionStageProfileDefinition[] = [
  {
    id: 'mission_briefing',
    kind: 'briefing',
    label: 'Mission briefing',
    carry: RESET_STAGE,
    world: null
  },
  {
    id: 'mission_entry',
    kind: 'entry',
    label: 'Sector entry',
    carry: RESET_STAGE,
    world: null
  },
  {
    id: 'mission_operation',
    kind: 'combat',
    label: 'Primary operation',
    carry: RESET_STAGE,
    world: {
      scrollLengthScale: 1,
      waveCountScale: 1,
      bossPolicy: 'inherit',
      seedNamespace: 'operation'
    }
  },
  {
    id: 'mission_optional_operation',
    kind: 'combat',
    label: 'Optional encounter',
    carry: CARRY_STAGE,
    world: {
      scrollLengthScale: 0.38,
      waveCountScale: 0.5,
      bossPolicy: 'none',
      seedNamespace: 'opportunity'
    }
  },
  {
    id: 'mission_branch',
    kind: 'branch',
    label: 'Field decision',
    carry: CARRY_STAGE,
    world: null
  },
  {
    id: 'mission_relief',
    kind: 'relief',
    label: 'Relief window',
    carry: CARRY_STAGE,
    world: null
  },
  {
    id: 'mission_extraction',
    kind: 'extraction',
    label: 'Extraction and route claim',
    carry: CARRY_STAGE,
    world: null
  },
  {
    id: 'mission_failure',
    kind: 'failure',
    label: 'Mission failed',
    carry: CARRY_STAGE,
    world: null
  },
  {
    id: 'mission_completion',
    kind: 'completion',
    label: 'Mission complete',
    carry: CARRY_STAGE,
    world: null
  }
];

export function getMissionStageProfile(id: string): MissionStageProfileDefinition {
  const profile = MISSION_STAGE_PROFILES.find((candidate) => candidate.id === id);

  if (!profile) {
    throw new Error(`Unknown mission stage profile: ${id}.`);
  }

  return profile;
}
