export interface DamageOutcome {
  readonly hull: number;
  readonly damageApplied: number;
  readonly destroyed: boolean;
}

export function applyDamage(currentHull: number, amount: number): DamageOutcome {
  const safeHull = Math.max(0, currentHull);
  const damageApplied = Math.min(safeHull, Math.max(0, amount));
  const hull = safeHull - damageApplied;

  return {
    hull,
    damageApplied,
    destroyed: hull <= 0
  };
}
