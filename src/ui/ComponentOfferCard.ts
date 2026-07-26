import { getComponentQuality } from '../content/engineering';
import { getShipModuleById } from '../content/shipModules';
import { getWeaponById, type WeaponPatternId } from '../content/weapons';
import { getComponentCircuitCapacity } from '../game/ComponentCircuit';
import { formatComponentName, type FoundryComponentInstance } from '../game/Foundry';
import { createWeaponProjectileBlueprints } from '../game/WeaponProjectiles';
import { compareFoundryComponents, createFoundryComponentStatModel } from './FoundryPresentation';
import { createWeaponIcon } from './WeaponIcon';

export interface PrimaryWeaponRackProfile {
  readonly weaponName: string;
  readonly pattern: WeaponPatternId;
  readonly volleySize: number;
  readonly volleysPerSecond: number;
  readonly baseDps: number;
  readonly circuitCapacity: number;
  readonly shotVectors: readonly {
    readonly offset: number;
    readonly angle: number;
  }[];
}

export function createPrimaryWeaponRackProfile(
  component: FoundryComponentInstance
): PrimaryWeaponRackProfile | null {
  const module = getShipModuleById(component.moduleId);
  if (module.behavior.kind !== 'weaponAdapter') return null;

  const weapon = getWeaponById(module.behavior.weaponId);
  const volley = createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 });
  const totalImpact = volley.reduce((total, projectile) => total + projectile.damage, 0);
  const safeCooldown = Math.max(0.05, weapon.fireCooldownSeconds);
  const maximumVector = Math.max(
    1,
    ...volley.map((projectile) => Math.abs(projectile.x) + Math.abs(projectile.vx) * 0.06)
  );

  return {
    weaponName: weapon.name,
    pattern: weapon.pattern,
    volleySize: volley.length,
    volleysPerSecond: 1 / safeCooldown,
    baseDps: totalImpact / safeCooldown,
    circuitCapacity: getComponentCircuitCapacity(component),
    shotVectors: volley.map((projectile) => ({
      offset: ((projectile.x + projectile.vx * 0.06) / maximumVector) * 24,
      angle: (Math.atan2(projectile.vx, -projectile.vy) * 180) / Math.PI
    }))
  };
}

export function appendPrimaryWeaponOfferCardContent(
  container: HTMLElement,
  component: FoundryComponentInstance,
  installed: FoundryComponentInstance | null,
  options: {
    readonly sourceLabel: string;
    readonly actionLabel: string;
    readonly price?: number;
    readonly presentation?: 'full' | 'shopRack';
  }
): void {
  const module = getShipModuleById(component.moduleId);
  const weapon =
    module.behavior.kind === 'weaponAdapter' ? getWeaponById(module.behavior.weaponId) : null;
  const quality = getComponentQuality(component.qualityId);
  container.dataset.quality = quality.id;
  container.style.setProperty('--component-accent', module.presentation.accentColor);

  const eyebrow = document.createElement('small');
  eyebrow.className = 'component-offer-eyebrow';
  eyebrow.textContent = `${options.sourceLabel} // Primary Weapon`;

  const title = document.createElement('strong');
  title.className = 'component-offer-title';
  title.textContent = formatComponentName(component);

  const heading = document.createElement('span');
  heading.className = 'component-offer-heading';
  if (weapon) heading.append(createWeaponIcon(document, weapon));
  heading.append(title);

  const description = document.createElement('span');
  description.className = 'component-offer-copy';
  description.textContent = module.presentation.summary;

  const identity = document.createElement('span');
  identity.className = 'component-offer-identity';
  identity.textContent = weapon
    ? `${weapon.pattern.toUpperCase()} pattern | ${weapon.tags.join(' + ')}`
    : module.tags.join(' + ');

  if (options.presentation === 'shopRack' && weapon) {
    const profile = createPrimaryWeaponRackProfile(component)!;
    const installedProfile = installed ? createPrimaryWeaponRackProfile(installed) : null;
    container.classList.add('component-offer-card-rack');

    const fireProfile = document.createElement('span');
    fireProfile.className = 'weapon-rack-profile';
    fireProfile.dataset.testid = 'shop-weapon-profile';
    fireProfile.setAttribute(
      'aria-label',
      `${profile.volleySize} shot ${profile.pattern} fire profile, ${profile.baseDps.toFixed(1)} base damage per second, ${profile.volleysPerSecond.toFixed(1)} volleys per second, ${profile.circuitCapacity} conduits`
    );

    const volleyDiagram = document.createElement('span');
    volleyDiagram.className = 'weapon-rack-volley';
    volleyDiagram.dataset.pattern = profile.pattern;
    volleyDiagram.setAttribute('aria-hidden', 'true');
    for (const shotVector of profile.shotVectors) {
      const shot = document.createElement('i');
      shot.style.setProperty('--shot-offset', `${shotVector.offset.toFixed(1)}px`);
      shot.style.setProperty('--shot-angle', `${shotVector.angle.toFixed(1)}deg`);
      volleyDiagram.append(shot);
    }

    const fireProfileCopy = document.createElement('span');
    fireProfileCopy.className = 'weapon-rack-profile-copy';
    const fireProfileLabel = document.createElement('small');
    fireProfileLabel.textContent = 'Fire Profile';
    const fireProfileTitle = document.createElement('strong');
    fireProfileTitle.textContent = `${profile.volleySize}-shot ${profile.pattern}`;
    const fireProfileMetrics = document.createElement('span');
    fireProfileMetrics.textContent = `${profile.baseDps.toFixed(1)} base DPS · ${profile.volleysPerSecond.toFixed(1)}/s · ${profile.circuitCapacity} conduits`;
    fireProfileCopy.append(fireProfileLabel, fireProfileTitle, fireProfileMetrics);
    fireProfile.append(volleyDiagram, fireProfileCopy);

    const mountedComparison = document.createElement('span');
    mountedComparison.className = 'weapon-rack-comparison';
    mountedComparison.dataset.testid = 'shop-weapon-comparison';
    const mountedLabel = document.createElement('small');
    mountedLabel.textContent = 'Mounted Comparison';
    const mountedTitle = document.createElement('strong');
    const mountedMetrics = document.createElement('span');
    if (installedProfile) {
      const dpsDelta = profile.baseDps - installedProfile.baseDps;
      const circuitDelta = profile.circuitCapacity - installedProfile.circuitCapacity;
      mountedComparison.dataset.tone = getWeaponRackComparisonTone(dpsDelta, circuitDelta);
      mountedTitle.textContent = installedProfile.weaponName;
      mountedMetrics.textContent = `${formatSignedDecimal(dpsDelta)} DPS · ${formatSignedInteger(circuitDelta)} conduits`;
    } else {
      mountedComparison.dataset.tone = 'same';
      mountedTitle.textContent = 'No mounted primary';
      mountedMetrics.textContent = 'New firing profile';
    }
    mountedComparison.append(mountedLabel, mountedTitle, mountedMetrics);

    const action = createOfferAction(options);
    container.append(
      eyebrow,
      heading,
      description,
      identity,
      fireProfile,
      mountedComparison,
      action
    );
    return;
  }

  const stats = createFoundryComponentStatModel(component);
  const comparison = compareFoundryComponents(component, installed);

  const statsRow = document.createElement('span');
  statsRow.className = 'component-offer-stats';
  for (const [glyph, label, value] of [
    ['P', 'power', stats.power],
    ['H', 'heat', stats.heat],
    ['M', 'mass', stats.mass],
    ['C', 'command', stats.command],
    ['S', 'circuit slots', stats.circuit]
  ] as const) {
    const stat = document.createElement('span');
    stat.setAttribute('aria-label', `${label} ${value}`);
    const statGlyph = document.createElement('small');
    statGlyph.textContent = glyph;
    const statValue = document.createElement('b');
    statValue.textContent = `${value}`;
    stat.append(statGlyph, statValue);
    statsRow.append(stat);
  }

  const delta = document.createElement('span');
  delta.className = 'component-offer-delta';
  delta.dataset.tone = comparison.tone;
  delta.textContent = installed
    ? `Mounted delta ${comparison.label}`
    : 'No mounted primary comparison';

  const action = createOfferAction(options);

  container.append(eyebrow, heading, description, identity, statsRow, delta, action);
}

function createOfferAction(options: {
  readonly actionLabel: string;
  readonly price?: number;
}): HTMLSpanElement {
  const action = document.createElement('span');
  action.className = 'component-offer-action';
  action.textContent =
    options.price === undefined
      ? options.actionLabel
      : `${options.actionLabel} -${options.price} credits`;
  return action;
}

function getWeaponRackComparisonTone(
  dpsDelta: number,
  circuitDelta: number
): 'improved' | 'declined' | 'tradeoff' | 'same' {
  const dpsDirection = Math.abs(dpsDelta) < 0.05 ? 0 : Math.sign(dpsDelta);
  const circuitDirection = Math.sign(circuitDelta);
  if (dpsDirection === 0 && circuitDirection === 0) return 'same';
  if (dpsDirection >= 0 && circuitDirection >= 0) return 'improved';
  if (dpsDirection <= 0 && circuitDirection <= 0) return 'declined';
  return 'tradeoff';
}

function formatSignedDecimal(value: number): string {
  if (Math.abs(value) < 0.05) return '±0.0';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

function formatSignedInteger(value: number): string {
  if (value === 0) return '±0';
  return `${value > 0 ? '+' : ''}${value}`;
}
