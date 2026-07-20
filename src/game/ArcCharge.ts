import type { ItemTag } from '../content/items';

export type ArcChargeKind = 'standard' | 'heavy';

export interface ArcChargeProfile {
  readonly kind: ArcChargeKind;
  readonly range: number;
  readonly damageMultiplier: number;
  readonly minimumDamage: number;
}

export interface ArcChargeCarrier {
  readonly tags: readonly ItemTag[];
  readonly arcChargeKind?: ArcChargeKind;
}

const ARC_CHARGE_PROFILES: Readonly<Record<ArcChargeKind, ArcChargeProfile>> = {
  standard: {
    kind: 'standard',
    range: 180,
    damageMultiplier: 0.55,
    minimumDamage: 0.35
  },
  heavy: {
    kind: 'heavy',
    range: 240,
    damageMultiplier: 0.82,
    minimumDamage: 0.55
  }
};

export const ARC_DISCHARGE_EFFECT_SECONDS = 0.22;

export function attachArcCharge<T extends ArcChargeCarrier>(
  projectile: T,
  kind: ArcChargeKind = 'standard'
): T & { readonly arcChargeKind: ArcChargeKind } {
  const current = getArcChargeProfile(projectile);
  const arcChargeKind = current?.kind === 'heavy' ? 'heavy' : kind;
  return {
    ...projectile,
    tags: projectile.tags.includes('arc') ? projectile.tags : [...projectile.tags, 'arc'],
    arcChargeKind
  };
}

export function getArcChargeProfile(projectile: ArcChargeCarrier): ArcChargeProfile | null {
  const kind = projectile.arcChargeKind ?? (projectile.tags.includes('arc') ? 'standard' : null);
  return kind ? ARC_CHARGE_PROFILES[kind] : null;
}

export function getArcDischargeDamage(projectileDamage: number, profile: ArcChargeProfile): number {
  return Math.max(profile.minimumDamage, Math.max(0, projectileDamage) * profile.damageMultiplier);
}
