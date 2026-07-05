import type { ShipHudThemeKey, ShipSilhouette } from '../content/ships';
import type { StartingContract } from '../game/Generation';
import { createHudThemeModel, type HudThemeOptions } from './HudTheme';

export interface ContractScreenThemeModel {
  readonly shipId: string;
  readonly shipName: string;
  readonly themeKey: ShipHudThemeKey;
  readonly silhouette: ShipSilhouette;
  readonly label: string;
  readonly debugLabel: string;
  readonly summary: string;
  readonly cssVariables: Readonly<Record<string, string>>;
}

export interface ContractThemeDebugState {
  readonly shipId: string;
  readonly shipName: string;
  readonly themeKey: ShipHudThemeKey;
  readonly silhouette: ShipSilhouette;
}

const DEFAULT_THEME_OPTIONS: HudThemeOptions = {
  reducedMotion: false,
  bulletContrast: 'standard',
  performanceMode: false
};

export function createContractScreenThemeModel(
  contract: StartingContract,
  options: HudThemeOptions = DEFAULT_THEME_OPTIONS
): ContractScreenThemeModel {
  const hudTheme = createHudThemeModel(contract.shipAppearance, options);
  const appearance = contract.shipAppearance;

  return {
    shipId: contract.shipId,
    shipName: contract.shipName,
    themeKey: hudTheme.themeKey,
    silhouette: appearance.silhouette,
    label: `${hudTheme.themeKey.toUpperCase()} CONTRACT`,
    debugLabel: `${contract.shipName}/${hudTheme.themeKey}`,
    summary: formatContractThemeSummary(contract),
    cssVariables: {
      '--screen-primary': getThemeVariable(hudTheme.cssVariables, '--hud-primary'),
      '--screen-secondary': getThemeVariable(hudTheme.cssVariables, '--hud-secondary'),
      '--screen-trim': getThemeVariable(hudTheme.cssVariables, '--hud-trim'),
      '--screen-engine': getThemeVariable(hudTheme.cssVariables, '--hud-engine'),
      '--screen-cockpit': getThemeVariable(hudTheme.cssVariables, '--hud-cockpit'),
      '--screen-warning': getThemeVariable(hudTheme.cssVariables, '--hud-warning'),
      '--screen-panel-alpha': getThemeVariable(hudTheme.cssVariables, '--hud-panel-alpha'),
      '--screen-glow-alpha': getThemeVariable(hudTheme.cssVariables, '--hud-glow-alpha'),
      '--screen-glow-mix': getThemeVariable(hudTheme.cssVariables, '--hud-glow-mix')
    }
  };
}

export function applyContractScreenTheme(
  element: HTMLElement,
  model: ContractScreenThemeModel
): void {
  element.classList.add('contract-themed-panel');
  element.dataset.contractTheme = model.themeKey;
  element.dataset.contractShip = model.shipId;
  element.dataset.contractSilhouette = model.silhouette;

  for (const [property, value] of Object.entries(model.cssVariables)) {
    element.style.setProperty(property, value);
  }
}

export function createContractThemeStrip(
  ownerDocument: Document,
  model: ContractScreenThemeModel
): HTMLParagraphElement {
  const strip = ownerDocument.createElement('p');
  strip.className = 'contract-theme-strip';
  strip.dataset.testid = 'contract-theme-strip';
  strip.textContent = `${model.label} | ${model.shipName}`;
  return strip;
}

export function getContractThemeOptions(ownerDocument: Document): HudThemeOptions {
  const { dataset } = ownerDocument.documentElement;

  return {
    reducedMotion: dataset.reducedMotion === 'true',
    bulletContrast: dataset.bulletContrast === 'high' ? 'high' : 'standard',
    performanceMode: dataset.performanceMode === 'true'
  };
}

function getThemeVariable(variables: Readonly<Record<string, string>>, key: string): string {
  const value = variables[key];

  if (value === undefined) {
    throw new Error(`Missing HUD theme variable: ${key}`);
  }

  return value;
}

export function createContractThemeDebugState(
  contract: StartingContract
): ContractThemeDebugState {
  return {
    shipId: contract.shipId,
    shipName: contract.shipName,
    themeKey: contract.shipAppearance.hudThemeKey,
    silhouette: contract.shipAppearance.silhouette
  };
}

export function formatContractThemeSummary(contract: StartingContract): string {
  const appearance = contract.shipAppearance;
  return [
    `${contract.shipName} (${contract.shipId})`,
    `${appearance.hudThemeKey} theme`,
    `${appearance.silhouette} silhouette`,
    `mounts ${appearance.weaponMounts.join('+')}`
  ].join(' | ');
}
