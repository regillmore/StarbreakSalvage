export interface CircleCollider {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export function circlesOverlap(a: CircleCollider, b: CircleCollider): boolean {
  const radiusSum = Math.max(0, a.radius) + Math.max(0, b.radius);
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy <= radiusSum * radiusSum;
}
