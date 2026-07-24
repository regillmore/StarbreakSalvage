import type { ActId } from '../content/acts';
import { createRng } from '../core/rng';
import {
  ACT_ROUTE_DEPTH,
  getActRouteNode,
  getNextActRouteSectorIndices,
  isActRouteTransition,
  type ActRouteGraph,
  type ActRouteNode
} from './ActRouteGraph';

export const APEX_PURSUIT_STEP_COUNT = ACT_ROUTE_DEPTH - 1;

export interface ApexPursuitTrackPlan {
  readonly actId: ActId;
  readonly actIndex: number;
  readonly actStartSectorIndex: number;
  readonly actEndSectorIndex: number;
  readonly sectorIndices: readonly number[];
  readonly nodeLabels: readonly string[];
}

export function createApexPursuitTracks(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly actRouteGraph: Pick<ActRouteGraph, 'nodes' | 'edges'>;
}): readonly ApexPursuitTrackPlan[] {
  const actIds = uniqueActIds(options.actRouteGraph.nodes);
  return actIds.map((actId, actIndex) => {
    const actNodes = options.actRouteGraph.nodes.filter((node) => node.actId === actId);
    const entry = actNodes.find((node) => node.layerIndex === 0);
    if (!entry) throw new Error(`Apex pursuit act ${actId} has no entry signal.`);
    const rng = createRng(
      `${options.seed}:apex-pursuit:${options.saveFingerprint}:${actId}`
    );
    const route: ActRouteNode[] = [entry];
    let current = entry;
    for (let layerIndex = 1; layerIndex < APEX_PURSUIT_STEP_COUNT; layerIndex += 1) {
      const candidates = getNextActRouteSectorIndices(
        options.actRouteGraph,
        current.sectorIndex
      )
        .map((sectorIndex) => getActRouteNode(options.actRouteGraph, sectorIndex))
        .filter(
          (candidate): candidate is ActRouteNode =>
            candidate !== null && candidate.actId === actId && candidate.layerIndex === layerIndex
        );
      if (candidates.length === 0) {
        throw new Error(`Apex pursuit ${actId} cannot reach layer ${layerIndex + 1}.`);
      }
      current = rng.fork(`layer-${layerIndex + 1}`).choice(candidates);
      route.push(current);
    }
    return {
      actId,
      actIndex,
      actStartSectorIndex: Math.min(...actNodes.map((node) => node.sectorIndex)),
      actEndSectorIndex: Math.max(...actNodes.map((node) => node.sectorIndex)),
      sectorIndices: route.map((node) => node.sectorIndex),
      nodeLabels: route.map((node) => node.nodeLabel)
    };
  });
}

export function validateApexPursuitTrack(
  track: ApexPursuitTrackPlan,
  graph: Pick<ActRouteGraph, 'nodes' | 'edges'>
): readonly string[] {
  const errors: string[] = [];
  if (track.sectorIndices.length !== APEX_PURSUIT_STEP_COUNT) {
    errors.push(
      `Apex pursuit ${track.actId} requires ${APEX_PURSUIT_STEP_COUNT} route steps.`
    );
  }
  if (track.nodeLabels.length !== track.sectorIndices.length) {
    errors.push(`Apex pursuit ${track.actId} node labels do not match its route steps.`);
  }
  for (const [index, sectorIndex] of track.sectorIndices.entries()) {
    const node = getActRouteNode(graph, sectorIndex);
    if (!node || node.actId !== track.actId || node.layerIndex !== index) {
      errors.push(`Apex pursuit ${track.actId} has an invalid layer ${index + 1} signal.`);
    }
    if (index > 0 && !isActRouteTransition(graph, track.sectorIndices[index - 1]!, sectorIndex)) {
      errors.push(`Apex pursuit ${track.actId} contains a disconnected route step.`);
    }
  }
  const finale = getActRouteNode(graph, track.sectorIndices.at(-1) ?? -1);
  if (finale?.layerIndex !== 3) {
    errors.push(`Apex pursuit ${track.actId} must intercept its apex on layer 4.`);
  }
  return errors;
}

function uniqueActIds(nodes: readonly ActRouteNode[]): ActId[] {
  const ids: ActId[] = [];
  for (const node of nodes) {
    if (!ids.includes(node.actId)) ids.push(node.actId);
  }
  return ids;
}
