import { getShipFrameById, getShipModuleById, type ShipModuleSlot } from '../content/shipModules';
import { getWeaponById, type WeaponPatternId } from '../content/weapons';
import {
  BASE_COMBINED_PROC_BUDGET,
  MAX_COMBINED_PROC_BUDGET,
  getComponentResourceDelta,
  resolveEngineeringSnapshot,
  type EngineeringResolution,
  type EngineeringState,
  type FoundryComponentInstance
} from '../game/Foundry';

export type FoundryComparisonTone = 'improved' | 'declined' | 'same' | 'danger';

export interface FoundryMeterModel {
  readonly id: 'power' | 'heat' | 'mass' | 'command' | 'instability';
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly capacity: number;
  readonly committedValue: number;
  readonly ratio: number;
  readonly delta: number;
  readonly tone: FoundryComparisonTone;
  readonly ariaLabel: string;
}

export interface FoundryAttackStatModel {
  readonly id: 'volley' | 'impact' | 'cadence' | 'velocity' | 'shotHeat';
  readonly glyph: string;
  readonly label: string;
  readonly value: number;
  readonly committedValue: number;
  readonly ratio: number;
  readonly delta: number;
  readonly tone: FoundryComparisonTone;
  readonly displayValue: string;
  readonly ariaLabel: string;
}

export interface FoundryTraitModel {
  readonly glyph: string;
  readonly label: string;
  readonly value: string;
}

export interface FoundryDashboardModel {
  readonly valid: boolean;
  readonly changed: boolean;
  readonly issueCount: number;
  readonly weaponName: string;
  readonly weaponPattern: WeaponPatternId;
  readonly frameName: string;
  readonly mountedModuleCount: number;
  readonly meters: readonly FoundryMeterModel[];
  readonly attackStats: readonly FoundryAttackStatModel[];
  readonly traits: readonly FoundryTraitModel[];
  readonly ariaLabel: string;
}

export interface FoundryComponentStatModel {
  readonly slot: ShipModuleSlot;
  readonly power: number;
  readonly heat: number;
  readonly mass: number;
  readonly command: number;
  readonly instability: number;
  readonly salvage: number;
}

export interface FoundryInstallComparisonModel {
  readonly power: number;
  readonly heat: number;
  readonly mass: number;
  readonly command: number;
  readonly instability: number;
  readonly tone: FoundryComparisonTone;
  readonly label: string;
}

const ATTACK_CAPS = {
  volley: 5,
  impact: 3,
  cadence: 10,
  velocity: 1_000,
  shotHeat: 0.6
} as const;

export function createFoundryDashboardModel(state: EngineeringState): FoundryDashboardModel {
  const committed = resolveEngineeringSnapshot(state.committed);
  const draft = resolveEngineeringSnapshot(state.draft);
  const committedLoadout = requireLoadout(committed);
  const committedResources = requireResources(committed);
  const draftResources = draft.resources ?? committedResources;
  const committedWeapon = getWeaponById(committedLoadout.primaryWeaponId);
  const draftWeapon = getWeaponById(
    draft.loadout?.primaryWeaponId ??
      getDraftPrimaryWeaponId(state) ??
      committedLoadout.primaryWeaponId
  );
  const meters: FoundryMeterModel[] = [
    createCapacityMeter(
      'power',
      'P',
      'Power',
      draftResources.powerDraw,
      draftResources.reactorOutput,
      committedResources.powerDraw
    ),
    createCapacityMeter(
      'heat',
      'H',
      'Thermal',
      draftResources.heatLoad,
      draftResources.thermalCapacity,
      committedResources.heatLoad
    ),
    createCapacityMeter(
      'mass',
      'M',
      'Mass',
      draftResources.totalMass,
      draftResources.massCapacity,
      committedResources.totalMass
    ),
    createCapacityMeter(
      'command',
      'C',
      'Command',
      draftResources.commandDraw,
      draftResources.commandCapacity,
      committedResources.commandDraw
    ),
    createCapacityMeter(
      'instability',
      '!',
      'Instability',
      draft.instability,
      draft.instabilityCapacity,
      committed.instability
    )
  ];
  const draftVolley =
    getPatternProjectileCount(draftWeapon.pattern) + draft.effects.extraProjectiles;
  const committedVolley =
    getPatternProjectileCount(committedWeapon.pattern) + committed.effects.extraProjectiles;
  const attackStats: FoundryAttackStatModel[] = [
    createAttackStat('volley', '◉', 'Volley', draftVolley, committedVolley, false, 0),
    createAttackStat('impact', '◆', 'Impact', draftWeapon.damage, committedWeapon.damage, false, 2),
    createAttackStat(
      'cadence',
      '»',
      'Cadence',
      1 / draftWeapon.fireCooldownSeconds,
      1 / committedWeapon.fireCooldownSeconds,
      false,
      1
    ),
    createAttackStat(
      'velocity',
      '↑',
      'Velocity',
      draftWeapon.projectileSpeed,
      committedWeapon.projectileSpeed,
      false,
      0
    ),
    createAttackStat(
      'shotHeat',
      '△',
      'Shot Heat',
      draftWeapon.heatPerShot * draft.effects.heatPerShotMultiplier,
      committedWeapon.heatPerShot * committed.effects.heatPerShotMultiplier,
      true,
      2
    )
  ];
  const procBudget = Math.min(
    MAX_COMBINED_PROC_BUDGET,
    BASE_COMBINED_PROC_BUDGET + draft.effects.procBudgetBonus
  );
  const traits = createTraitModels(draft, procBudget);

  return {
    valid: draft.valid,
    changed: draft.signature !== committed.signature,
    issueCount: draft.issues.length,
    weaponName: draftWeapon.name,
    weaponPattern: draftWeapon.pattern,
    frameName: getShipFrameById(state.draft.frameId).name,
    mountedModuleCount: state.draft.mounts.length,
    meters,
    attackStats,
    traits,
    ariaLabel: `${draft.valid ? 'Legal' : 'Invalid'} draft. ${draftWeapon.name} ${draftWeapon.pattern}. ${meters
      .map((meter) => meter.ariaLabel)
      .join('. ')}. ${attackStats.map((stat) => stat.ariaLabel).join('. ')}`
  };
}

export function createFoundryComponentStatModel(
  component: FoundryComponentInstance
): FoundryComponentStatModel {
  const module = getShipModuleById(component.moduleId);
  const delta = getComponentResourceDelta(component);
  return {
    slot: module.slot,
    power: module.powerDraw + delta.power,
    heat: module.heat + delta.heat,
    mass: module.mass + delta.mass,
    command: module.commandDraw + delta.command,
    instability: component.instability,
    salvage: component.salvageValue
  };
}

export function compareFoundryComponents(
  candidate: FoundryComponentInstance,
  installed: FoundryComponentInstance | null
): FoundryInstallComparisonModel {
  const candidateStats = createFoundryComponentStatModel(candidate);
  const installedStats = installed
    ? createFoundryComponentStatModel(installed)
    : { power: 0, heat: 0, mass: 0, command: 0, instability: 0 };
  const power = candidateStats.power - installedStats.power;
  const heat = candidateStats.heat - installedStats.heat;
  const mass = candidateStats.mass - installedStats.mass;
  const command = candidateStats.command - installedStats.command;
  const instability = candidateStats.instability - installedStats.instability;
  const burden = power + heat + mass + command + instability;
  return {
    power,
    heat,
    mass,
    command,
    instability,
    tone: burden < 0 ? 'improved' : burden > 0 ? 'declined' : 'same',
    label: `P${formatSigned(power)} H${formatSigned(heat)} M${formatSigned(mass)} C${formatSigned(
      command
    )} !${formatSigned(instability)}`
  };
}

function createCapacityMeter(
  id: FoundryMeterModel['id'],
  glyph: string,
  label: string,
  value: number,
  capacity: number,
  committedValue: number
): FoundryMeterModel {
  const delta = value - committedValue;
  const tone: FoundryComparisonTone =
    value > capacity ? 'danger' : delta < 0 ? 'improved' : delta > 0 ? 'declined' : 'same';
  return {
    id,
    glyph,
    label,
    value,
    capacity,
    committedValue,
    ratio: clamp01(value / Math.max(1, capacity)),
    delta,
    tone,
    ariaLabel: `${label} ${value} of ${capacity}${delta === 0 ? ', unchanged' : `, ${formatSigned(delta)} from committed`}`
  };
}

function createAttackStat(
  id: FoundryAttackStatModel['id'],
  glyph: string,
  label: string,
  value: number,
  committedValue: number,
  lowerIsBetter: boolean,
  digits: number
): FoundryAttackStatModel {
  const delta = value - committedValue;
  const benefitDelta = lowerIsBetter ? -delta : delta;
  const tone: FoundryComparisonTone =
    Math.abs(delta) < 0.001 ? 'same' : benefitDelta > 0 ? 'improved' : 'declined';
  const displayValue = value.toFixed(digits);
  return {
    id,
    glyph,
    label,
    value,
    committedValue,
    ratio: clamp01(value / ATTACK_CAPS[id]),
    delta,
    tone,
    displayValue,
    ariaLabel: `${label} ${displayValue}${delta === 0 ? ', unchanged' : `, ${formatSigned(delta)} from committed`}`
  };
}

function createTraitModels(
  resolution: EngineeringResolution,
  procBudget: number
): FoundryTraitModel[] {
  const effects = resolution.effects;
  return [
    effects.extraProjectiles > 0
      ? { glyph: '+', label: 'Extra fire', value: String(effects.extraProjectiles) }
      : null,
    effects.convergence > 0
      ? { glyph: '⌖', label: 'Converge', value: `${Math.round(effects.convergence * 100)}%` }
      : null,
    effects.heatVentMultiplier > 1
      ? { glyph: '▽', label: 'Vent', value: `${effects.heatVentMultiplier.toFixed(2)}×` }
      : null,
    effects.damageTakenMultiplier < 1
      ? {
          glyph: '◇',
          label: 'Guard',
          value: `${Math.round((1 - effects.damageTakenMultiplier) * 100)}%`
        }
      : null,
    effects.bonusSalvagePerKill > 0
      ? { glyph: '$', label: 'Tithe', value: `+${effects.bonusSalvagePerKill}` }
      : null,
    { glyph: '↯', label: 'Proc', value: String(procBudget) }
  ].filter((trait): trait is FoundryTraitModel => trait !== null);
}

function getPatternProjectileCount(pattern: WeaponPatternId): number {
  return pattern === 'dual' ? 2 : pattern === 'spread' || pattern === 'split' ? 3 : 1;
}

function getDraftPrimaryWeaponId(state: EngineeringState) {
  for (const mount of state.draft.mounts) {
    const component = state.draft.components.find(
      (candidate) => candidate.id === mount.componentId
    );
    if (!component) continue;
    const module = getShipModuleById(component.moduleId);
    if (module.slot === 'primary' && module.behavior.kind === 'weaponAdapter') {
      return module.behavior.weaponId;
    }
  }
  return null;
}

function requireLoadout(resolution: EngineeringResolution) {
  if (!resolution.loadout) throw new Error('Committed foundry state has no resolved loadout.');
  return resolution.loadout;
}

function requireResources(resolution: EngineeringResolution) {
  if (!resolution.resources) throw new Error('Committed foundry state has no resource envelope.');
  return resolution.resources;
}

function formatSigned(value: number): string {
  if (Math.abs(value) < 0.001) return '±0';
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
