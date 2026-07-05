export const COMBAT_ARENA_WIDTH = 640;
export const COMBAT_ARENA_HEIGHT = 720;
export const COMBAT_ARENA_PADDING = 24;

export function createDefaultCombatBounds(): {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
} {
  return {
    width: COMBAT_ARENA_WIDTH,
    height: COMBAT_ARENA_HEIGHT,
    padding: COMBAT_ARENA_PADDING
  };
}
