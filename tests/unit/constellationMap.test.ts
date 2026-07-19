import { describe, expect, it } from 'vitest';
import {
  createConstellationMapViewport,
  projectConstellationPoint
} from '../../src/ui/ConstellationMap';

const nodes = [
  { id: '1a', x: 50, y: 14 },
  { id: '2a', x: 38, y: 31 },
  { id: '2b', x: 63, y: 31 },
  { id: '3a', x: 29, y: 49 },
  { id: '3b', x: 50, y: 49 },
  { id: '3c', x: 71, y: 49 }
] as const;

describe('constellation map viewport', () => {
  it('moderately expands an active choice layer without changing graph coordinates', () => {
    const viewport = createConstellationMapViewport(nodes, ['3a', '3b', '3c'], 'focus');
    const projected = ['3a', '3b', '3c'].map((id) => {
      const node = nodes.find((candidate) => candidate.id === id)!;
      return projectConstellationPoint(viewport, node.x, node.y);
    });

    expect(viewport.mode).toBe('focus');
    expect(viewport.scale).toBe(1.38);
    expect(viewport.width).toBeCloseTo(72.464, 3);
    expect(projected[1]!.x).toBeCloseTo(50, 3);
    expect(projected[1]!.y).toBeCloseTo(50, 3);
    expect(projected[2]!.x - projected[1]!.x).toBeGreaterThan(21);
    expect(projected[1]!.x - projected[0]!.x).toBeGreaterThan(21);
    expect(nodes.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 50, y: 14 },
      { x: 38, y: 31 },
      { x: 63, y: 31 },
      { x: 29, y: 49 },
      { x: 50, y: 49 },
      { x: 71, y: 49 }
    ]);
  });

  it('clamps edge-layer focus inside the authored chart and restores exact overview geometry', () => {
    const focus = createConstellationMapViewport(nodes, ['1a'], 'focus');
    const overview = createConstellationMapViewport(nodes, ['2a', '2b'], 'overview');

    expect(focus.x).toBeGreaterThanOrEqual(0);
    expect(focus.y).toBe(0);
    expect(focus.x + focus.width).toBeLessThanOrEqual(100);
    expect(focus.y + focus.height).toBeLessThanOrEqual(100);
    expect(projectConstellationPoint(focus, 50, 14).y).toBeGreaterThan(0);
    expect(overview).toEqual({
      mode: 'overview',
      scale: 1,
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
    expect(projectConstellationPoint(overview, 38, 31)).toEqual({ x: 38, y: 31 });
  });

  it('falls back to the complete chart when no requested focus node exists', () => {
    expect(createConstellationMapViewport(nodes, ['missing'], 'focus').mode).toBe('overview');
  });
});
