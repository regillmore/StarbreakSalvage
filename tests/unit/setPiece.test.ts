import { describe, expect, it } from 'vitest';

import {
  SET_PIECES,
  getSetPieceLayoutById,
  getSetPieceComponentTemplate,
  type SetPieceDefinition
} from '../../src/content/setPieces';
import {
  createSetPiecePlan,
  createSetPieceReinforcementSpawns,
  createSetPieceState,
  damageSetPieceComponent,
  getSetPieceComponentRect,
  getSetPieceComponentScreenState,
  getSetPieceDebugJumpDistance,
  getSetPieceEngagementDistance,
  getSetPieceForwardFireLane,
  getSetPieceLayoutBottomRecoveryHeight,
  getSetPieceReadModel,
  isSetPieceBossLockReleased,
  SET_PIECE_BOTTOM_RECOVERY_HEIGHT,
  validateSetPieceContent
} from '../../src/game/SetPiece';

describe('SetPiece', () => {
  it('validates three original assemblies built from shared component templates', () => {
    const validation = validateSetPieceContent();
    const templateUsage = new Map<string, number>();

    for (const definition of SET_PIECES) {
      for (const component of definition.components) {
        templateUsage.set(component.templateId, (templateUsage.get(component.templateId) ?? 0) + 1);
      }
    }

    expect(validation).toEqual({ valid: true, errors: [] });
    expect(SET_PIECES).toHaveLength(3);
    expect([...templateUsage.values()].filter((count) => count >= 2).length).toBeGreaterThanOrEqual(
      4
    );
  });

  it('places the three contracts deterministically and binds the final wreck train to the boss lock', () => {
    const first = createSetPiecePlan({ sectorIndex: 1, scrollLength: 2400 });
    const station = createSetPiecePlan({ sectorIndex: 7, scrollLength: 2800 });
    const finale = createSetPiecePlan({
      sectorIndex: 10,
      scrollLength: 3200,
      bossArena: {
        sectorId: 'sector_core_wreck',
        approachStartDistance: 2580,
        lockDistance: 2800,
        releaseDistance: 3200,
        approachSpeed: 68,
        exitSpeed: 118
      }
    });

    expect(first).toEqual(createSetPiecePlan({ sectorIndex: 1, scrollLength: 2400 }));
    expect(first?.definitionId).toBe('setpiece_ledger_hecaton');
    expect(station?.definitionId).toBe('setpiece_bloom_spindle');
    expect(finale).toMatchObject({
      definitionId: 'setpiece_court_wreck_train',
      anchorDistance: 2800,
      bossLock: 'untilComplete'
    });
    expect(createSetPiecePlan({ sectorIndex: 4, scrollLength: 2400 })).toBeNull();
  });

  it('selects every authored layout from named seed streams and preserves explicit reprojections', () => {
    for (const [definition, sectorIndex] of SET_PIECES.map(
      (entry, index) => [entry, [1, 7, 10][index]!] as const
    )) {
      const selectedLayoutIds = new Set(
        Array.from(
          { length: 64 },
          (_, seedIndex) =>
            createSetPiecePlan({
              sectorIndex,
              scrollLength: 3000,
              layoutSeed: `SET-PIECE-LAYOUT-${definition.id}-${seedIndex}`
            })?.layoutId
        )
      );

      expect(selectedLayoutIds).toEqual(new Set(definition.layouts.map((layout) => layout.id)));
      for (const layout of definition.layouts) {
        const explicit = createSetPiecePlan({
          sectorIndex,
          scrollLength: 3000,
          layoutId: layout.id
        });
        expect(explicit).toMatchObject({
          layoutId: layout.id,
          layoutLabel: layout.label,
          safeLane: layout.safeLane
        });
      }
    }
  });

  it('rejects duplicate component identities, unsafe lanes, and undersized pressure budgets', () => {
    const source = SET_PIECES[0];
    if (!source) throw new Error('Expected a set-piece fixture.');
    const firstLayout = source.layouts[0];
    if (!firstLayout) throw new Error('Expected a set-piece layout fixture.');
    const broken: SetPieceDefinition = {
      ...source,
      layouts: [
        {
          ...firstLayout,
          safeLane: {
            ...firstLayout.safeLane,
            maxX: firstLayout.safeLane.minX + 40
          }
        },
        ...source.layouts.slice(1)
      ],
      components: [...source.components, source.components[0]!],
      caps: { ...source.caps, reinforcementEnemies: 1, projectiles: 0 }
    };
    const validation = validateSetPieceContent([broken, ...SET_PIECES.slice(1)]);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duplicate component ids'),
        expect.stringContaining('safe lane must be at least'),
        expect.stringContaining('reinforcement count exceeds'),
        expect.stringContaining('positive projectile')
      ])
    );
  });

  it('rejects an arrangement that puts locked structure across an objective firing lane', () => {
    const source = SET_PIECES[0];
    const layout = source?.layouts[0];
    if (!source || !layout) throw new Error('Expected a set-piece layout fixture.');
    const blocked: SetPieceDefinition = {
      ...source,
      layouts: [
        {
          ...layout,
          componentPlacements: layout.componentPlacements.map((placement) =>
            placement.componentId === 'hecaton-turret'
              ? { ...placement, x: 210, y: 280 }
              : placement
          )
        },
        ...source.layouts.slice(1)
      ]
    };

    expect(validateSetPieceContent([blocked, ...SET_PIECES.slice(1)]).errors).toContain(
      `Set piece ${source.id} layout ${layout.id} leaves no forward-fire lane to hecaton-emitter-a.`
    );
  });

  it('rejects an arrangement that crowds the bottom recovery envelope', () => {
    const source = SET_PIECES[0];
    const layout = source?.layouts[0];
    if (!source || !layout) throw new Error('Expected a set-piece layout fixture.');
    const crowded: SetPieceDefinition = {
      ...source,
      layouts: [
        {
          ...layout,
          componentPlacements: layout.componentPlacements.map((placement) =>
            placement.componentId === 'hecaton-core' ? { ...placement, y: 650 } : placement
          )
        },
        ...source.layouts.slice(1)
      ]
    };

    expect(validateSetPieceContent([crowded, ...SET_PIECES.slice(1)]).errors).toContain(
      `Set piece ${source.id} layout ${layout.id} must retain at least ${SET_PIECE_BOTTOM_RECOVERY_HEIGHT}px of bottom recovery room at its engagement stop.`
    );
  });

  it('enforces dependency target order and advances exterior, interior, and destruction beats once', () => {
    const state = requireState(createSetPiecePlan({ sectorIndex: 1, scrollLength: 2400 }));
    const armor = requireComponent(state, 'hecaton-armor');

    expect(armor.targetable).toBe(false);
    expect(damageSetPieceComponent(state, armor.id, 'bomb', 100)).toEqual([]);
    destroy(state, 'hecaton-emitter-a');
    expect(armor.targetable).toBe(false);
    destroy(state, 'hecaton-emitter-b');
    expect(armor.targetable).toBe(true);
    expect(state.completedStageIds).toEqual(['hecaton-screen']);

    destroy(state, 'hecaton-armor');
    destroy(state, 'hecaton-drive');
    destroy(state, 'hecaton-core');

    expect(state.completed).toBe(true);
    expect(state.completedStageIds).toEqual([
      'hecaton-screen',
      'hecaton-breach',
      'hecaton-collapse'
    ]);
    expect(state.eventLog.filter((event) => event.type === 'setPieceCompleted')).toHaveLength(1);
    expect(new Set(state.eventLog.map((event) => event.id)).size).toBe(state.eventLog.length);
    expect(damageSetPieceComponent(state, 'hecaton-core', 'weapon', 100)).toEqual([]);
  });

  it('holds and releases the finale boss lock without duplicate completion rewards', () => {
    const state = requireState(
      createSetPiecePlan({
        sectorIndex: 10,
        scrollLength: 3200,
        bossArena: {
          sectorId: 'sector_core_wreck',
          approachStartDistance: 2580,
          lockDistance: 2800,
          releaseDistance: 3200,
          approachSpeed: 68,
          exitSpeed: 118
        }
      })
    );

    expect(isSetPieceBossLockReleased(state)).toBe(false);
    for (const id of [
      'train-coupler-a',
      'train-coupler-b',
      'train-armor-a',
      'train-armor-b',
      'train-drive',
      'train-core'
    ]) {
      destroy(state, id);
    }

    expect(isSetPieceBossLockReleased(state)).toBe(true);
    expect(state.eventLog.filter((event) => event.type === 'setPieceCompleted')).toHaveLength(1);
    expect(getSetPieceReadModel(state)).toMatchObject({
      active: false,
      beat: 'complete',
      bossLockActive: false
    });
  });

  it('keeps every layout inside fixed geometry with a straight-shot route to every objective', () => {
    for (const definition of SET_PIECES) {
      for (const layout of definition.layouts) {
        const plan = createSetPiecePlan({
          sectorIndex:
            definition.id === 'setpiece_ledger_hecaton'
              ? 1
              : definition.id === 'setpiece_bloom_spindle'
                ? 7
                : 10,
          scrollLength: 3000,
          layoutId: layout.id
        });
        const state = requireState(plan);
        const engagementDistance = getSetPieceEngagementDistance(plan!);

        expect(getSetPieceLayoutById(definition, plan!.layoutId)).toBe(layout);
        expect(plan!.safeLane.maxX - plan!.safeLane.minX).toBeGreaterThanOrEqual(128);
        expect(getSetPieceLayoutBottomRecoveryHeight(definition, layout)).toBeGreaterThanOrEqual(
          SET_PIECE_BOTTOM_RECOVERY_HEIGHT
        );
        for (const component of state.components) {
          const rect = getSetPieceComponentRect(plan!.anchorDistance, component);
          const engagementRect = getSetPieceComponentRect(engagementDistance, component);
          const normal = getSetPieceComponentScreenState(plan!.anchorDistance, component);
          const reducedMotion = getSetPieceComponentScreenState(plan!.anchorDistance, component);

          expect(rect.left >= plan!.safeLane.maxX || rect.right <= plan!.safeLane.minX).toBe(true);
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(640);
          expect(rect.top).toBeGreaterThanOrEqual(0);
          expect(rect.bottom).toBeLessThanOrEqual(720);
          expect(engagementRect.top).toBeGreaterThanOrEqual(0);
          expect(engagementRect.bottom).toBeLessThanOrEqual(
            720 - SET_PIECE_BOTTOM_RECOVERY_HEIGHT
          );
          expect(normal).toEqual(reducedMotion);
        }
        for (const component of definition.components.filter(
          (candidate) => candidate.objectiveTarget
        )) {
          expect(getSetPieceForwardFireLane(definition, layout, component.id)).not.toBeNull();
        }
      }
    }
  });

  it('caps authored reinforcement formations and exposes a stable debug jump', () => {
    for (const sectorIndex of [1, 7, 10]) {
      const plan = createSetPiecePlan({ sectorIndex, scrollLength: 3000 });
      const spawns = createSetPieceReinforcementSpawns(plan);

      expect(spawns.length).toBeLessThanOrEqual(plan!.caps.reinforcementEnemies);
      expect(spawns.every((spawn) => spawn.formationId === plan!.reinforcement.formationId)).toBe(
        true
      );
      expect(getSetPieceDebugJumpDistance(plan)).toBe(
        getSetPieceEngagementDistance(plan!) - 120
      );
    }
  });
});

function requireState(plan: ReturnType<typeof createSetPiecePlan>) {
  const state = createSetPieceState(plan);
  if (!state) throw new Error('Expected set-piece state.');
  return state;
}

function requireComponent(state: ReturnType<typeof requireState>, id: string) {
  const component = state.components.find((candidate) => candidate.id === id);
  if (!component) throw new Error(`Expected component ${id}.`);
  getSetPieceComponentTemplate(component.templateId);
  return component;
}

function destroy(state: ReturnType<typeof requireState>, id: string): void {
  const events = damageSetPieceComponent(state, id, 'bomb', 100);
  expect(events.some((event) => event.type === 'componentDestroyed')).toBe(true);
}
