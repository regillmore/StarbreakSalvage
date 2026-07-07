import type { EnemyAttackFamily } from '../content/enemyRoles';
import type { ItemTag } from '../content/items';
import { clamp } from '../core/math';
import type {
  CombatBounds,
  EnemyState,
  PlayerState,
  ProjectileState,
  TelegraphKind,
  TelegraphState
} from '../game/CombatState';

export type EnemyAimStyle =
  | 'driftVolley'
  | 'lanePair'
  | 'spreadFan'
  | 'aimedNeedles'
  | 'chargedAim'
  | 'laneCurtain'
  | 'deployBurst'
  | 'supportPulse'
  | 'hazardMark';

export interface EnemyAttackProfile {
  readonly cooldownSeconds: number;
  readonly telegraphSeconds: number;
  readonly telegraphKind: TelegraphKind;
  readonly telegraphLabel: string;
  readonly projectileBudget: number;
  readonly projectileSpeed: number;
  readonly projectileRadius: number;
  readonly aimStyle: EnemyAimStyle;
}

export type EnemyProjectileBlueprint = Omit<ProjectileState, 'id' | 'owner' | 'procDepth'>;
export type EnemyTelegraphBlueprint = Omit<TelegraphState, 'id'>;

const ATTACK_PROFILES: Readonly<Record<EnemyAttackFamily, EnemyAttackProfile>> = {
  driftShot: {
    cooldownSeconds: 1.55,
    telegraphSeconds: 0.34,
    telegraphKind: 'fan',
    telegraphLabel: 'SCRAP VOLLEY',
    projectileBudget: 2,
    projectileSpeed: 242,
    projectileRadius: 7,
    aimStyle: 'driftVolley'
  },
  laneBurst: {
    cooldownSeconds: 1.05,
    telegraphSeconds: 0.22,
    telegraphKind: 'lane',
    telegraphLabel: 'LEDGER LANE',
    projectileBudget: 2,
    projectileSpeed: 322,
    projectileRadius: 5,
    aimStyle: 'lanePair'
  },
  sporeSpread: {
    cooldownSeconds: 1.6,
    telegraphSeconds: 0.38,
    telegraphKind: 'ring',
    telegraphLabel: 'SPORE MARK',
    projectileBudget: 3,
    projectileSpeed: 206,
    projectileRadius: 5,
    aimStyle: 'spreadFan'
  },
  phaseSkirmish: {
    cooldownSeconds: 0.95,
    telegraphSeconds: 0.18,
    telegraphKind: 'fan',
    telegraphLabel: 'PHASE TAP',
    projectileBudget: 2,
    projectileSpeed: 298,
    projectileRadius: 4,
    aimStyle: 'aimedNeedles'
  },
  chargedShot: {
    cooldownSeconds: 1.9,
    telegraphSeconds: 0.55,
    telegraphKind: 'lane',
    telegraphLabel: 'CHARGE LINE',
    projectileBudget: 1,
    projectileSpeed: 358,
    projectileRadius: 6,
    aimStyle: 'chargedAim'
  },
  laneCurtain: {
    cooldownSeconds: 1.45,
    telegraphSeconds: 0.3,
    telegraphKind: 'lane',
    telegraphLabel: 'CURTAIN LANES',
    projectileBudget: 3,
    projectileSpeed: 292,
    projectileRadius: 5,
    aimStyle: 'laneCurtain'
  },
  deployBurst: {
    cooldownSeconds: 1.65,
    telegraphSeconds: 0.42,
    telegraphKind: 'fan',
    telegraphLabel: 'DEPLOY BURST',
    projectileBudget: 3,
    projectileSpeed: 218,
    projectileRadius: 6,
    aimStyle: 'deployBurst'
  },
  supportPulse: {
    cooldownSeconds: 1.75,
    telegraphSeconds: 0.45,
    telegraphKind: 'ring',
    telegraphLabel: 'SUPPORT PULSE',
    projectileBudget: 2,
    projectileSpeed: 184,
    projectileRadius: 6,
    aimStyle: 'supportPulse'
  },
  hazardMark: {
    cooldownSeconds: 1.8,
    telegraphSeconds: 0.5,
    telegraphKind: 'ring',
    telegraphLabel: 'HAZARD MARK',
    projectileBudget: 2,
    projectileSpeed: 198,
    projectileRadius: 6,
    aimStyle: 'hazardMark'
  }
};

export function getEnemyAttackProfile(attackFamily: EnemyAttackFamily): EnemyAttackProfile {
  return ATTACK_PROFILES[attackFamily];
}

export function createEnemyAttackTelegraphs(
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily,
  player: PlayerState,
  bounds: CombatBounds
): readonly EnemyTelegraphBlueprint[] {
  const profile = getEnemyAttackProfile(attackFamily);

  if (profile.telegraphKind === 'lane') {
    return createLaneTelegraphs(enemy, attackFamily, player, bounds, profile);
  }

  if (profile.telegraphKind === 'ring') {
    const marksPlayer = attackFamily === 'hazardMark';
    const x = marksPlayer ? player.x : enemy.x;
    const y = marksPlayer ? player.y : enemy.y + enemy.radius * 0.55;

    return [
      {
        kind: 'ring',
        factionId: enemy.factionId,
        label: profile.telegraphLabel,
        x: clamp(x, bounds.padding + 24, bounds.width - bounds.padding - 24),
        y: clamp(y, bounds.padding + 24, bounds.height - bounds.padding - 24),
        radius: attackFamily === 'hazardMark' ? 56 : attackFamily === 'supportPulse' ? 76 : 84,
        width: 0,
        height: 0,
        ttl: profile.telegraphSeconds,
        maxTtl: profile.telegraphSeconds
      }
    ];
  }

  return [
    {
      kind: 'fan',
      factionId: enemy.factionId,
      label: profile.telegraphLabel,
      x: enemy.x,
      y: enemy.y + enemy.radius * 0.45,
      radius:
        attackFamily === 'phaseSkirmish'
          ? 112
          : attackFamily === 'deployBurst'
            ? 132
            : 124,
      width: 0,
      height: 0,
      ttl: profile.telegraphSeconds,
      maxTtl: profile.telegraphSeconds
    }
  ];
}

export function createEnemyAttackProjectiles(
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily,
  player: PlayerState,
  attackSequence: number
): readonly EnemyProjectileBlueprint[] {
  const profile = getEnemyAttackProfile(attackFamily);
  const y = enemy.y + enemy.radius;

  if (profile.aimStyle === 'lanePair') {
    return [-8, 8].map((offset) =>
      createProjectile(enemy, {
        x: enemy.x + offset,
        y,
        vx: 0,
        vy: profile.projectileSpeed,
        radius: profile.projectileRadius,
        ttl: 3.25,
        tags: ['plasma']
      })
    );
  }

  if (profile.aimStyle === 'spreadFan') {
    return [-92, 0, 92].map((vx) =>
      createProjectile(enemy, {
        x: enemy.x,
        y,
        vx,
        vy: profile.projectileSpeed,
        radius: profile.projectileRadius,
        ttl: 3.6,
        tags: ['plasma']
      })
    );
  }

  if (profile.aimStyle === 'aimedNeedles') {
    return [0.2, -0.2].map((angleOffset) =>
      createAimedProjectile(enemy, player, profile, angleOffset, ['phase'], 3.35)
    );
  }

  if (profile.aimStyle === 'chargedAim') {
    return [createAimedProjectile(enemy, player, profile, 0, ['laser', 'plasma'], 3)];
  }

  if (profile.aimStyle === 'laneCurtain') {
    return [-46, 0, 46].map((offset, index) =>
      createProjectile(enemy, {
        x: enemy.x + offset,
        y,
        vx: (index - 1) * 12,
        vy: profile.projectileSpeed,
        radius: profile.projectileRadius,
        ttl: 3.5,
        tags: ['plasma']
      })
    );
  }

  if (profile.aimStyle === 'deployBurst') {
    return [-34, 0, 34].map((vx, index) =>
      createProjectile(enemy, {
        x: enemy.x,
        y,
        vx,
        vy: profile.projectileSpeed + index * 12,
        radius: profile.projectileRadius,
        ttl: 4.1,
        tags: ['missile', 'scrap']
      })
    );
  }

  if (profile.aimStyle === 'supportPulse') {
    return [-56, 56].map((vx) =>
      createProjectile(enemy, {
        x: enemy.x,
        y,
        vx,
        vy: profile.projectileSpeed,
        radius: profile.projectileRadius,
        ttl: 3.8,
        tags: ['plasma', 'shield']
      })
    );
  }

  if (profile.aimStyle === 'hazardMark') {
    const side = attackSequence % 2 === 0 ? -1 : 1;

    return [-1, 1].map((direction) =>
      createProjectile(enemy, {
        x: enemy.x + direction * 10,
        y,
        vx: direction * 42 + side * 18,
        vy: profile.projectileSpeed,
        radius: profile.projectileRadius,
        ttl: 4,
        tags: ['plasma', 'curse']
      })
    );
  }

  return [-14, 14].map((offset) =>
    createProjectile(enemy, {
      x: enemy.x + offset,
      y,
      vx: enemy.drift * 0.36 + offset * 1.4,
      vy: profile.projectileSpeed,
      radius: profile.projectileRadius,
      ttl: 4,
      tags: ['missile', 'scrap']
    })
  );
}

function createLaneTelegraphs(
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily,
  player: PlayerState,
  bounds: CombatBounds,
  profile: EnemyAttackProfile
): readonly EnemyTelegraphBlueprint[] {
  const laneCount = attackFamily === 'laneCurtain' ? 3 : 1;
  const offsets = laneCount === 3 ? [-46, 0, 46] : [0];
  const laneX =
    attackFamily === 'chargedShot'
      ? clamp(player.x, bounds.padding + 18, bounds.width - bounds.padding - 18)
      : enemy.x;

  return offsets.map((offset) => ({
    kind: 'lane',
    factionId: enemy.factionId,
    label: profile.telegraphLabel,
    x: clamp(laneX + offset, bounds.padding + 18, bounds.width - bounds.padding - 18),
    y: enemy.y + enemy.radius * 0.25,
    radius: 0,
    width: attackFamily === 'chargedShot' ? 28 : attackFamily === 'laneCurtain' ? 30 : 42,
    height: bounds.height,
    ttl: profile.telegraphSeconds,
    maxTtl: profile.telegraphSeconds
  }));
}

function createAimedProjectile(
  enemy: EnemyState,
  player: PlayerState,
  profile: EnemyAttackProfile,
  angleOffset: number,
  tags: readonly ItemTag[],
  ttl: number
): EnemyProjectileBlueprint {
  const dx = player.x - enemy.x;
  const dy = Math.max(88, player.y - enemy.y);
  const angle = Math.atan2(dy, dx) + angleOffset;

  return createProjectile(enemy, {
    x: enemy.x,
    y: enemy.y + enemy.radius,
    vx: Math.cos(angle) * profile.projectileSpeed,
    vy: Math.max(92, Math.sin(angle) * profile.projectileSpeed),
    radius: profile.projectileRadius,
    ttl,
    tags
  });
}

function createProjectile(
  enemy: EnemyState,
  projectile: Omit<EnemyProjectileBlueprint, 'damage' | 'factionId'>
): EnemyProjectileBlueprint {
  return {
    damage: 1,
    factionId: enemy.factionId,
    ...projectile
  };
}
