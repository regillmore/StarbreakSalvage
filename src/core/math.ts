export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
