import { describe, expect, it } from 'vitest';

import {
  RUN_TIMELINE_ENTRY_CAP,
  RUN_TIMELINE_EVENT_ID_CAP,
  createRunTimelineDebugState,
  foldRunTimelineEvents,
  formatRunTimeline,
  recordRunTimelineEvent,
  validateRunTimelineState,
  type RunTimelineEvent
} from '../../src/game/RunTimeline';

describe('RunTimeline', () => {
  it('folds deterministic events without consulting wall-clock time', () => {
    const events: RunTimelineEvent[] = [
      {
        id: 'node-1',
        category: 'node',
        kind: 'enter',
        sectorIndex: 0,
        subjectId: 'node_outer'
      },
      {
        id: 'combat-1',
        category: 'duration',
        kind: 'combat',
        sectorIndex: 0,
        durationSeconds: 12.3456,
        value: 4
      },
      {
        id: 'choice-1',
        category: 'decision',
        kind: 'branch',
        sectorIndex: 0,
        subjectId: 'salvage'
      }
    ];

    expect(foldRunTimelineEvents(events)).toEqual(foldRunTimelineEvents(events));
    expect(foldRunTimelineEvents(events).elapsedSeconds).toBe(12.346);
    expect(formatRunTimeline(foldRunTimelineEvents(events))).toContain(
      '12.3s S1 decision:branch salvage'
    );
  });

  it('is idempotent and bounds both display history and processed ids', () => {
    const initial = foldRunTimelineEvents([
      { id: 'same', category: 'run', kind: 'start', sectorIndex: 0 }
    ]);
    expect(
      recordRunTimelineEvent(initial, {
        id: 'same',
        category: 'run',
        kind: 'duplicate',
        sectorIndex: 9,
        durationSeconds: 99
      })
    ).toBe(initial);

    const events = Array.from({ length: RUN_TIMELINE_EVENT_ID_CAP + 8 }, (_, index) => ({
      id: `event-${index}`,
      category: 'mission' as const,
      kind: 'fixture',
      sectorIndex: index % 10
    }));
    const bounded = foldRunTimelineEvents(events);
    expect(bounded.entries).toHaveLength(RUN_TIMELINE_ENTRY_CAP);
    expect(bounded.processedEventIds).toHaveLength(RUN_TIMELINE_EVENT_ID_CAP);
    expect(bounded.droppedEntries).toBe(events.length - RUN_TIMELINE_ENTRY_CAP);
    expect(validateRunTimelineState(bounded)).toEqual([]);
  });

  it('exposes compact category and latest-event debug budgets', () => {
    const state = foldRunTimelineEvents([
      { id: 'start', category: 'run', kind: 'start', sectorIndex: 0 },
      {
        id: 'boss',
        category: 'boss',
        kind: 'defeated',
        sectorIndex: 1,
        durationSeconds: 8,
        subjectId: 'boss_fixture'
      }
    ]);
    const debug = createRunTimelineDebugState(state);
    expect(debug.capacity).toBe(RUN_TIMELINE_ENTRY_CAP);
    expect(debug.categories).toEqual(['run:1', 'boss:1']);
    expect(debug.latest.at(-1)).toContain('boss:defeated boss_fixture');
  });
});
