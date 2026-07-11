export const RUN_TIMELINE_CATEGORIES = [
  'node',
  'mission',
  'decision',
  'duration',
  'economy',
  'engineering',
  'carrier',
  'faction',
  'rival',
  'crew',
  'boss',
  'run'
] as const;
export type RunTimelineCategory = (typeof RUN_TIMELINE_CATEGORIES)[number];

export interface RunTimelineEntry {
  readonly id: string;
  readonly category: RunTimelineCategory;
  readonly kind: string;
  readonly sectorIndex: number;
  readonly elapsedSeconds: number;
  readonly value: number;
  readonly subjectId: string | null;
  readonly detailId: string | null;
}

export interface RunTimelineState {
  readonly entries: readonly RunTimelineEntry[];
  readonly processedEventIds: readonly string[];
  readonly elapsedSeconds: number;
  readonly droppedEntries: number;
}

export interface RunTimelineEvent {
  readonly id: string;
  readonly category: RunTimelineCategory;
  readonly kind: string;
  readonly sectorIndex: number;
  readonly durationSeconds?: number;
  readonly value?: number;
  readonly subjectId?: string | null;
  readonly detailId?: string | null;
}

export interface RunTimelineDebugState {
  readonly entries: number;
  readonly capacity: number;
  readonly dropped: number;
  readonly elapsedSeconds: number;
  readonly categories: readonly string[];
  readonly latest: readonly string[];
}

export const RUN_TIMELINE_ENTRY_CAP = 96;
export const RUN_TIMELINE_EVENT_ID_CAP = 192;

export function createRunTimeline(): RunTimelineState {
  return { entries: [], processedEventIds: [], elapsedSeconds: 0, droppedEntries: 0 };
}

export function recordRunTimelineEvent(
  state: RunTimelineState,
  event: RunTimelineEvent
): RunTimelineState {
  if (state.processedEventIds.includes(event.id)) return state;
  const elapsedSeconds = roundTimelineSeconds(
    state.elapsedSeconds + Math.max(0, event.durationSeconds ?? 0)
  );
  const entry: RunTimelineEntry = {
    id: event.id,
    category: event.category,
    kind: event.kind,
    sectorIndex: Math.max(0, Math.floor(event.sectorIndex)),
    elapsedSeconds,
    value: Number.isFinite(event.value) ? Math.round((event.value ?? 0) * 100) / 100 : 0,
    subjectId: event.subjectId ?? null,
    detailId: event.detailId ?? null
  };
  const entries = [...state.entries, entry];
  const dropped = Math.max(0, entries.length - RUN_TIMELINE_ENTRY_CAP);
  return {
    entries: entries.slice(-RUN_TIMELINE_ENTRY_CAP),
    processedEventIds: [...state.processedEventIds, event.id].slice(-RUN_TIMELINE_EVENT_ID_CAP),
    elapsedSeconds,
    droppedEntries: state.droppedEntries + dropped
  };
}

export function foldRunTimelineEvents(events: readonly RunTimelineEvent[]): RunTimelineState {
  return events.reduce(recordRunTimelineEvent, createRunTimeline());
}

export function createRunTimelineDebugState(state: RunTimelineState): RunTimelineDebugState {
  const counts = new Map<RunTimelineCategory, number>();
  for (const entry of state.entries)
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
  return {
    entries: state.entries.length,
    capacity: RUN_TIMELINE_ENTRY_CAP,
    dropped: state.droppedEntries,
    elapsedSeconds: state.elapsedSeconds,
    categories: [...counts.entries()].map(([category, count]) => `${category}:${count}`),
    latest: state.entries.slice(-6).map(formatRunTimelineEntry)
  };
}

export function formatRunTimeline(state: RunTimelineState): string {
  if (state.entries.length === 0) return 'No run timeline events recorded.';
  const suffix = state.droppedEntries > 0 ? ` | ${state.droppedEntries} older entries dropped` : '';
  return `${state.entries.map(formatRunTimelineEntry).join(' > ')}${suffix}`;
}

export function formatRunTimelineEntry(entry: RunTimelineEntry): string {
  const subject = entry.subjectId ? ` ${entry.subjectId}` : '';
  const detail = entry.detailId ? `/${entry.detailId}` : '';
  const value = entry.value !== 0 ? ` ${entry.value >= 0 ? '+' : ''}${entry.value}` : '';
  return `${entry.elapsedSeconds.toFixed(1)}s S${entry.sectorIndex + 1} ${entry.category}:${entry.kind}${subject}${detail}${value}`;
}

export function validateRunTimelineState(state: RunTimelineState): string[] {
  const errors: string[] = [];
  if (state.entries.length > RUN_TIMELINE_ENTRY_CAP)
    errors.push('Run timeline entry cap exceeded.');
  if (state.processedEventIds.length > RUN_TIMELINE_EVENT_ID_CAP) {
    errors.push('Run timeline event-id cap exceeded.');
  }
  if (new Set(state.processedEventIds).size !== state.processedEventIds.length) {
    errors.push('Run timeline contains duplicate processed event ids.');
  }
  if (state.entries.some((entry) => !RUN_TIMELINE_CATEGORIES.includes(entry.category))) {
    errors.push('Run timeline contains an invalid category.');
  }
  return errors;
}

function roundTimelineSeconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}
