import { getComponentQuality } from '../content/engineering';
import { getShipModuleById } from '../content/shipModules';
import { getWeaponById } from '../content/weapons';
import { formatComponentName, type FoundryComponentInstance } from '../game/Foundry';
import {
  compareFoundryComponents,
  createFoundryComponentStatModel
} from './FoundryPresentation';

export function appendPrimaryWeaponOfferCardContent(
  container: HTMLElement,
  component: FoundryComponentInstance,
  installed: FoundryComponentInstance | null,
  options: {
    readonly sourceLabel: string;
    readonly actionLabel: string;
    readonly price?: number;
  }
): void {
  const module = getShipModuleById(component.moduleId);
  const weapon = module.behavior.kind === 'weaponAdapter'
    ? getWeaponById(module.behavior.weaponId)
    : null;
  const quality = getComponentQuality(component.qualityId);
  const stats = createFoundryComponentStatModel(component);
  const comparison = compareFoundryComponents(component, installed);
  container.dataset.quality = quality.id;
  container.style.setProperty('--component-accent', module.presentation.accentColor);

  const eyebrow = document.createElement('small');
  eyebrow.className = 'component-offer-eyebrow';
  eyebrow.textContent = `${options.sourceLabel} // Primary Weapon`;

  const title = document.createElement('strong');
  title.className = 'component-offer-title';
  title.textContent = formatComponentName(component);

  const description = document.createElement('span');
  description.className = 'component-offer-copy';
  description.textContent = module.presentation.summary;

  const identity = document.createElement('span');
  identity.className = 'component-offer-identity';
  identity.textContent = weapon
    ? `${weapon.pattern.toUpperCase()} pattern | ${weapon.tags.join(' + ')}`
    : module.tags.join(' + ');

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

  const action = document.createElement('span');
  action.className = 'component-offer-action';
  action.textContent = options.price === undefined
    ? options.actionLabel
    : `${options.actionLabel} -${options.price} credits`;

  container.append(eyebrow, title, description, identity, statsRow, delta, action);
}
