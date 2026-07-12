import type { RunSkeleton } from './Generation';

export type VoyageSaveProfile = 'fresh' | 'progressed';
export type VoyageRouteProfile = 'earlyExtraction' | 'standard' | 'completionist';

export interface VoyageDurationMeasurement {
  readonly id: string;
  readonly saveProfile: VoyageSaveProfile;
  readonly routeProfile: VoyageRouteProfile;
  readonly sectorCount: number;
  readonly nodeCount: number;
  readonly minSeconds: number;
  readonly targetSeconds: number;
  readonly maxSeconds: number;
  readonly targetMinutes: number;
  readonly evidence: 'authoredNodeDurationProjection';
}

export interface VoyageReleaseAuditReport {
  readonly seed: string;
  readonly measurements: readonly VoyageDurationMeasurement[];
  readonly freshStandardMinutes: number;
  readonly progressedStandardMinutes: number;
  readonly earlyExtractionMinutes: number;
  readonly completionistMinutes: number;
  readonly summary: string;
  readonly caveat: string;
}

export function createVoyageReleaseAudit(
  freshRun: RunSkeleton,
  progressedRun: RunSkeleton
): VoyageReleaseAuditReport {
  if (freshRun.seed !== progressedRun.seed) {
    throw new Error('Voyage release audit profiles must use the same seed.');
  }
  const profiles: readonly [VoyageSaveProfile, RunSkeleton][] = [
    ['fresh', freshRun],
    ['progressed', progressedRun]
  ];
  const measurements = profiles.flatMap(([saveProfile, run]) => [
    measureEarlyExtraction(run, saveProfile),
    measureStandard(run, saveProfile),
    measureCompletionist(run, saveProfile)
  ]);
  const find = (saveProfile: VoyageSaveProfile, routeProfile: VoyageRouteProfile) =>
    measurements.find(
      (measurement) =>
        measurement.saveProfile === saveProfile && measurement.routeProfile === routeProfile
    )!;
  const freshStandardMinutes = find('fresh', 'standard').targetMinutes;
  const progressedStandardMinutes = find('progressed', 'standard').targetMinutes;
  const earlyExtractionMinutes = find('progressed', 'earlyExtraction').targetMinutes;
  const completionistMinutes = find('progressed', 'completionist').targetMinutes;
  return {
    seed: freshRun.seed,
    measurements,
    freshStandardMinutes,
    progressedStandardMinutes,
    earlyExtractionMinutes,
    completionistMinutes,
    summary: `Fresh standard ${formatMinutes(freshStandardMinutes)} | progressed standard ${formatMinutes(progressedStandardMinutes)} | early extraction ${formatMinutes(earlyExtractionMinutes)} | completionist ${formatMinutes(completionistMinutes)}`,
    caveat:
      'These are deterministic authored node-duration projections. They measure structural capacity, not player stopwatch time, fatigue, balance, or frame pacing.'
  };
}

function measureEarlyExtraction(
  run: RunSkeleton,
  saveProfile: VoyageSaveProfile
): VoyageDurationMeasurement {
  const act = run.acts.find((candidate) => candidate.id === 'act_core_descent');
  if (!act) throw new Error('Voyage release audit requires the Core Descent act.');
  const nodes = run.expedition.nodes.filter(
    (node) => !node.optional && node.sectorIndex <= act.endSectorIndex
  );
  return measurement(saveProfile, 'earlyExtraction', act.endSectorIndex + 1, nodes);
}

function measureStandard(
  run: RunSkeleton,
  saveProfile: VoyageSaveProfile
): VoyageDurationMeasurement {
  const nodes = run.expedition.nodes.filter((node) => !node.optional);
  return measurement(saveProfile, 'standard', run.sectors.length, nodes);
}

function measureCompletionist(
  run: RunSkeleton,
  saveProfile: VoyageSaveProfile
): VoyageDurationMeasurement {
  return measurement(saveProfile, 'completionist', run.sectors.length, run.expedition.nodes);
}

function measurement(
  saveProfile: VoyageSaveProfile,
  routeProfile: VoyageRouteProfile,
  sectorCount: number,
  nodes: RunSkeleton['expedition']['nodes']
): VoyageDurationMeasurement {
  const minSeconds = sum(nodes.map((node) => node.duration.minSeconds));
  const targetSeconds = sum(nodes.map((node) => node.duration.targetSeconds));
  const maxSeconds = sum(nodes.map((node) => node.duration.maxSeconds));
  return {
    id: `${saveProfile}:${routeProfile}`,
    saveProfile,
    routeProfile,
    sectorCount,
    nodeCount: nodes.length,
    minSeconds,
    targetSeconds,
    maxSeconds,
    targetMinutes: round(targetSeconds / 60),
    evidence: 'authoredNodeDurationProjection'
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMinutes(value: number): string {
  return `${value.toFixed(2)}m`;
}
