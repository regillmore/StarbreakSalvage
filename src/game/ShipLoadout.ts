import {
  SHIP_FRAMES,
  SHIP_MODULES,
  type ShipFrameDefinition,
  type ShipFrameId,
  type ShipHardpointDefinition,
  type ShipLoadoutMount,
  type ShipModuleDefinition,
  type ShipModuleMountSize,
  type ShipModuleSlot,
  type ShipcraftTag
} from '../content/shipModules';
import {
  SHIPS,
  type ShipDefinition,
  type ShipId,
  type ShipStats,
  type WeaponId
} from '../content/ships';
import { WEAPONS, type WeaponDefinition, type WeaponPatternId } from '../content/weapons';

export type ShipLoadoutIssueCode =
  | 'unknownFrame'
  | 'unknownHardpoint'
  | 'unknownModule'
  | 'duplicateHardpoint'
  | 'missingRequiredHardpoint'
  | 'slotMismatch'
  | 'mountSize'
  | 'hardpointTag'
  | 'frameCompatibility'
  | 'loadoutCompatibility'
  | 'uniqueModule'
  | 'primaryCount'
  | 'primaryBehavior'
  | 'powerOverload'
  | 'massOverload'
  | 'heatOverload'
  | 'commandOverload'
  | 'legacyAdapter';

export interface ShipLoadoutIssue {
  readonly code: ShipLoadoutIssueCode;
  readonly message: string;
  readonly frameId?: string;
  readonly hardpointId?: string;
  readonly moduleId?: string;
}

export interface ShipLoadoutSpec {
  readonly frameId: ShipFrameId;
  readonly mounts: readonly ShipLoadoutMount[];
}

export interface ShipLoadoutCatalog {
  readonly frames: readonly ShipFrameDefinition[];
  readonly modules: readonly ShipModuleDefinition[];
  readonly ships: readonly ShipDefinition[];
  readonly weapons: readonly WeaponDefinition[];
}

export interface ShipLoadoutResources {
  readonly powerDraw: number;
  readonly reactorOutput: number;
  readonly powerHeadroom: number;
  readonly moduleMass: number;
  readonly totalMass: number;
  readonly massCapacity: number;
  readonly massHeadroom: number;
  readonly heatLoad: number;
  readonly thermalCapacity: number;
  readonly heatHeadroom: number;
  readonly cooling: number;
  readonly heatRouting: number;
  readonly commandDraw: number;
  readonly commandCapacity: number;
  readonly commandHeadroom: number;
}

export interface ResolvedShipModuleMount {
  readonly hardpointId: string;
  readonly hardpointLabel: string;
  readonly slot: ShipModuleSlot;
  readonly moduleId: ShipModuleDefinition['id'];
  readonly moduleName: string;
  readonly moduleShortName: string;
  readonly moduleTags: readonly ShipcraftTag[];
  readonly powerDraw: number;
  readonly heat: number;
  readonly mass: number;
  readonly commandDraw: number;
}

export interface ShipLoadoutPreviewModel {
  readonly title: string;
  readonly role: string;
  readonly hardpointLine: string;
  readonly resourceLine: string;
  readonly structureLine: string;
  readonly moduleLine: string;
}

export interface ShipLoadoutHudModel {
  readonly identity: string;
  readonly resources: string;
  readonly ariaLabel: string;
}

export interface ShipLoadoutSummaryModel {
  readonly frame: string;
  readonly modules: string;
  readonly powerGrid: string;
  readonly frameStats: string;
}

export interface ShipLoadoutDebugState {
  readonly frameId: ShipFrameId;
  readonly frameName: string;
  readonly signature: string;
  readonly primaryWeaponId: WeaponId;
  readonly powerDraw: number;
  readonly reactorOutput: number;
  readonly heatLoad: number;
  readonly thermalCapacity: number;
  readonly totalMass: number;
  readonly massCapacity: number;
  readonly commandDraw: number;
  readonly commandCapacity: number;
  readonly moduleIds: readonly string[];
}

export interface ResolvedShipLoadout {
  readonly frameId: ShipFrameId;
  readonly frameName: string;
  readonly frameRole: string;
  readonly legacyShipId: ShipId;
  readonly hardpointCount: number;
  readonly mounts: readonly ResolvedShipModuleMount[];
  readonly primaryWeaponId: WeaponId;
  readonly primaryWeaponName: string;
  readonly primaryWeaponPattern: WeaponPatternId;
  readonly shipStats: ShipStats;
  readonly resources: ShipLoadoutResources;
  readonly signature: string;
  readonly preview: ShipLoadoutPreviewModel;
  readonly hud: ShipLoadoutHudModel;
  readonly summary: ShipLoadoutSummaryModel;
  readonly debug: ShipLoadoutDebugState;
}

export interface ShipLoadoutValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ShipLoadoutIssue[];
  readonly resources: ShipLoadoutResources | null;
}

interface ResolvedMountInternal {
  readonly hardpoint: ShipHardpointDefinition;
  readonly module: ShipModuleDefinition;
}

interface ShipLoadoutInspection {
  readonly frame: ShipFrameDefinition | null;
  readonly ship: ShipDefinition | null;
  readonly weapon: WeaponDefinition | null;
  readonly mounts: readonly ResolvedMountInternal[];
  readonly resources: ShipLoadoutResources | null;
  readonly issues: readonly ShipLoadoutIssue[];
}

const DEFAULT_CATALOG: ShipLoadoutCatalog = {
  frames: SHIP_FRAMES,
  modules: SHIP_MODULES,
  ships: SHIPS,
  weapons: WEAPONS
};

const MOUNT_SIZE_RANK: Readonly<Record<ShipModuleMountSize, number>> = {
  light: 1,
  medium: 2,
  heavy: 3
};

export class ShipLoadoutValidationError extends Error {
  public constructor(public readonly issues: readonly ShipLoadoutIssue[]) {
    super(issues.map((issue) => issue.message).join('; '));
    this.name = 'ShipLoadoutValidationError';
  }
}

export function validateShipLoadout(
  spec: ShipLoadoutSpec,
  catalog: ShipLoadoutCatalog = DEFAULT_CATALOG
): ShipLoadoutValidationResult {
  const inspection = inspectShipLoadout(spec, catalog);
  return {
    valid: inspection.issues.length === 0,
    issues: inspection.issues,
    resources: inspection.resources
  };
}

export function resolveShipLoadout(
  spec: ShipLoadoutSpec,
  catalog: ShipLoadoutCatalog = DEFAULT_CATALOG
): ResolvedShipLoadout {
  const inspection = inspectShipLoadout(spec, catalog);

  if (
    inspection.issues.length > 0 ||
    !inspection.frame ||
    !inspection.ship ||
    !inspection.weapon ||
    !inspection.resources
  ) {
    throw new ShipLoadoutValidationError(inspection.issues);
  }

  const frame = inspection.frame;
  const ship = inspection.ship;
  const weapon = inspection.weapon;
  const resources = inspection.resources;
  const mounts = inspection.mounts.map(({ hardpoint, module }) => ({
    hardpointId: hardpoint.id,
    hardpointLabel: hardpoint.label,
    slot: hardpoint.slot,
    moduleId: module.id,
    moduleName: module.presentation.name,
    moduleShortName: module.presentation.shortName,
    moduleTags: module.tags,
    powerDraw: module.powerDraw,
    heat: module.heat,
    mass: module.mass,
    commandDraw: module.commandDraw
  }));
  const signature = createLoadoutSignature(frame.id, mounts);
  const preview = createShipLoadoutPreviewModel(frame, mounts, resources);
  const hud = createShipLoadoutHudModel(frame, resources);
  const summary = createShipLoadoutSummaryModel(frame, mounts, resources);
  const debug: ShipLoadoutDebugState = {
    frameId: frame.id,
    frameName: frame.name,
    signature,
    primaryWeaponId: weapon.id,
    powerDraw: resources.powerDraw,
    reactorOutput: resources.reactorOutput,
    heatLoad: resources.heatLoad,
    thermalCapacity: resources.thermalCapacity,
    totalMass: resources.totalMass,
    massCapacity: resources.massCapacity,
    commandDraw: resources.commandDraw,
    commandCapacity: resources.commandCapacity,
    moduleIds: mounts.map((mount) => mount.moduleId)
  };

  return {
    frameId: frame.id,
    frameName: frame.name,
    frameRole: frame.role,
    legacyShipId: frame.legacyShipId,
    hardpointCount: frame.hardpoints.length,
    mounts,
    primaryWeaponId: weapon.id,
    primaryWeaponName: weapon.name,
    primaryWeaponPattern: weapon.pattern,
    shipStats: { ...ship.stats },
    resources,
    signature,
    preview,
    hud,
    summary,
    debug
  };
}

export function createLegacyStartingLoadout(
  ship: ShipDefinition,
  catalog: ShipLoadoutCatalog = DEFAULT_CATALOG
): ResolvedShipLoadout {
  const matchingFrames = catalog.frames.filter((frame) => frame.legacyShipId === ship.id);
  const frame = matchingFrames[0];

  if (!frame || matchingFrames.length !== 1) {
    throw new ShipLoadoutValidationError([
      {
        code: 'legacyAdapter',
        message: `Ship ${ship.id} must have exactly one frame adapter; found ${matchingFrames.length}`
      }
    ]);
  }

  const loadout = resolveShipLoadout({ frameId: frame.id, mounts: frame.startingLoadout }, catalog);
  const issues: ShipLoadoutIssue[] = [];

  if (loadout.primaryWeaponId !== ship.weapon) {
    issues.push({
      code: 'legacyAdapter',
      message: `Frame ${frame.id} starts with ${loadout.primaryWeaponId} instead of legacy weapon ${ship.weapon}`,
      frameId: frame.id
    });
  }

  if (!sameShipStats(loadout.shipStats, ship.stats)) {
    issues.push({
      code: 'legacyAdapter',
      message: `Frame ${frame.id} does not preserve ${ship.id} combat stats`,
      frameId: frame.id
    });
  }

  if (issues.length > 0) {
    throw new ShipLoadoutValidationError(issues);
  }

  return loadout;
}

export function formatShipLoadoutDebug(loadout: ResolvedShipLoadout): string {
  const resources = loadout.resources;
  return `${loadout.frameName} P${resources.powerDraw}/${resources.reactorOutput} H${resources.heatLoad}/${resources.thermalCapacity} M${resources.totalMass}/${resources.massCapacity} C${resources.commandDraw}/${resources.commandCapacity}`;
}

function inspectShipLoadout(
  spec: ShipLoadoutSpec,
  catalog: ShipLoadoutCatalog
): ShipLoadoutInspection {
  const issues: ShipLoadoutIssue[] = [];
  const frame = catalog.frames.find((candidate) => candidate.id === spec.frameId) ?? null;

  if (!frame) {
    issues.push({
      code: 'unknownFrame',
      message: `Unknown ship frame: ${spec.frameId}`,
      frameId: spec.frameId
    });
    return { frame: null, ship: null, weapon: null, mounts: [], resources: null, issues };
  }

  const ship = catalog.ships.find((candidate) => candidate.id === frame.legacyShipId) ?? null;
  if (!ship) {
    issues.push({
      code: 'legacyAdapter',
      message: `Frame ${frame.id} references missing legacy ship ${frame.legacyShipId}`,
      frameId: frame.id
    });
  }

  const seenHardpoints = new Set<string>();
  const resolvedMounts: ResolvedMountInternal[] = [];

  for (const mount of spec.mounts) {
    const hardpoint = frame.hardpoints.find((candidate) => candidate.id === mount.hardpointId);
    const module = catalog.modules.find((candidate) => candidate.id === mount.moduleId);

    if (seenHardpoints.has(mount.hardpointId)) {
      issues.push({
        code: 'duplicateHardpoint',
        message: `Frame ${frame.id} mounts more than one module on ${mount.hardpointId}`,
        frameId: frame.id,
        hardpointId: mount.hardpointId,
        moduleId: mount.moduleId
      });
    }
    seenHardpoints.add(mount.hardpointId);

    if (!hardpoint) {
      issues.push({
        code: 'unknownHardpoint',
        message: `Frame ${frame.id} has no hardpoint ${mount.hardpointId}`,
        frameId: frame.id,
        hardpointId: mount.hardpointId,
        moduleId: mount.moduleId
      });
    }

    if (!module) {
      issues.push({
        code: 'unknownModule',
        message: `Unknown ship module: ${mount.moduleId}`,
        frameId: frame.id,
        hardpointId: mount.hardpointId,
        moduleId: mount.moduleId
      });
    }

    if (!hardpoint || !module) {
      continue;
    }

    resolvedMounts.push({ hardpoint, module });
    validateMountCompatibility(issues, frame, hardpoint, module);
  }

  for (const hardpoint of frame.hardpoints) {
    if (hardpoint.required && !seenHardpoints.has(hardpoint.id)) {
      issues.push({
        code: 'missingRequiredHardpoint',
        message: `Frame ${frame.id} requires a module on ${hardpoint.id}`,
        frameId: frame.id,
        hardpointId: hardpoint.id
      });
    }
  }

  validateUniqueModules(issues, frame, resolvedMounts);
  validateLoadoutTagCompatibility(issues, frame, resolvedMounts);

  const primaryModules = resolvedMounts.filter(({ hardpoint }) => hardpoint.slot === 'primary');
  if (primaryModules.length !== 1) {
    issues.push({
      code: 'primaryCount',
      message: `Frame ${frame.id} requires exactly one mounted primary; found ${primaryModules.length}`,
      frameId: frame.id
    });
  }

  const primaryModule = primaryModules[0]?.module ?? null;
  const primaryWeaponId =
    primaryModule?.behavior.kind === 'weaponAdapter' ? primaryModule.behavior.weaponId : null;
  if (primaryModule && !primaryWeaponId) {
    issues.push({
      code: 'primaryBehavior',
      message: `Primary module ${primaryModule.id} does not adapt a weapon`,
      frameId: frame.id,
      moduleId: primaryModule.id
    });
  }

  const weapon = primaryWeaponId
    ? (catalog.weapons.find((candidate) => candidate.id === primaryWeaponId) ?? null)
    : null;
  if (primaryWeaponId && !weapon) {
    issues.push({
      code: 'primaryBehavior',
      message: `Primary module ${primaryModule?.id ?? 'unknown'} references missing weapon ${primaryWeaponId}`,
      frameId: frame.id,
      moduleId: primaryModule?.id
    });
  }

  const resources = calculateResources(frame, resolvedMounts);
  validateResourceEnvelope(issues, frame, resources);

  return {
    frame,
    ship,
    weapon,
    mounts: orderMounts(frame, resolvedMounts),
    resources,
    issues
  };
}

function validateMountCompatibility(
  issues: ShipLoadoutIssue[],
  frame: ShipFrameDefinition,
  hardpoint: ShipHardpointDefinition,
  module: ShipModuleDefinition
): void {
  const context = {
    frameId: frame.id,
    hardpointId: hardpoint.id,
    moduleId: module.id
  };

  if (hardpoint.slot !== module.slot) {
    issues.push({
      code: 'slotMismatch',
      message: `Module ${module.id} is ${module.slot}, not ${hardpoint.slot} for ${hardpoint.id}`,
      ...context
    });
  }

  if (MOUNT_SIZE_RANK[module.size] > MOUNT_SIZE_RANK[hardpoint.size]) {
    issues.push({
      code: 'mountSize',
      message: `Module ${module.id} is too large for ${frame.id}/${hardpoint.id}`,
      ...context
    });
  }

  for (const tag of hardpoint.requiredModuleTags) {
    if (!module.tags.includes(tag)) {
      issues.push({
        code: 'hardpointTag',
        message: `Hardpoint ${frame.id}/${hardpoint.id} requires module tag ${tag}`,
        ...context
      });
    }
  }

  for (const tag of hardpoint.excludedModuleTags) {
    if (module.tags.includes(tag)) {
      issues.push({
        code: 'hardpointTag',
        message: `Hardpoint ${frame.id}/${hardpoint.id} excludes module tag ${tag}`,
        ...context
      });
    }
  }

  const compatibility = module.compatibility;
  if (
    compatibility.allowedFrameIds.length > 0 &&
    !compatibility.allowedFrameIds.includes(frame.id)
  ) {
    issues.push({
      code: 'frameCompatibility',
      message: `Module ${module.id} does not allow frame ${frame.id}`,
      ...context
    });
  }

  if (compatibility.blockedFrameIds.includes(frame.id)) {
    issues.push({
      code: 'frameCompatibility',
      message: `Module ${module.id} blocks frame ${frame.id}`,
      ...context
    });
  }

  for (const tag of compatibility.requiredFrameTags) {
    if (!frame.tags.includes(tag)) {
      issues.push({
        code: 'frameCompatibility',
        message: `Module ${module.id} requires frame tag ${tag}`,
        ...context
      });
    }
  }

  for (const tag of compatibility.excludedFrameTags) {
    if (frame.tags.includes(tag)) {
      issues.push({
        code: 'frameCompatibility',
        message: `Module ${module.id} excludes frame tag ${tag}`,
        ...context
      });
    }
  }
}

function validateUniqueModules(
  issues: ShipLoadoutIssue[],
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedMountInternal[]
): void {
  const counts = new Map<string, number>();
  for (const { module } of mounts) {
    counts.set(module.id, (counts.get(module.id) ?? 0) + 1);
  }

  for (const { module } of mounts) {
    if (module.unique && (counts.get(module.id) ?? 0) > 1) {
      issues.push({
        code: 'uniqueModule',
        message: `Unique module ${module.id} is mounted more than once on ${frame.id}`,
        frameId: frame.id,
        moduleId: module.id
      });
      counts.set(module.id, 1);
    }
  }
}

function validateLoadoutTagCompatibility(
  issues: ShipLoadoutIssue[],
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedMountInternal[]
): void {
  const installedTags = new Set(mounts.flatMap(({ module }) => module.tags));

  for (const { hardpoint, module } of mounts) {
    for (const tag of module.compatibility.requiredLoadoutTags) {
      if (!installedTags.has(tag)) {
        issues.push({
          code: 'loadoutCompatibility',
          message: `Module ${module.id} requires installed tag ${tag}`,
          frameId: frame.id,
          hardpointId: hardpoint.id,
          moduleId: module.id
        });
      }
    }

    for (const tag of module.compatibility.excludedLoadoutTags) {
      if (installedTags.has(tag)) {
        issues.push({
          code: 'loadoutCompatibility',
          message: `Module ${module.id} excludes installed tag ${tag}`,
          frameId: frame.id,
          hardpointId: hardpoint.id,
          moduleId: module.id
        });
      }
    }
  }
}

function calculateResources(
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedMountInternal[]
): ShipLoadoutResources {
  const powerDraw = sumModules(mounts, (module) => module.powerDraw);
  const moduleMass = sumModules(mounts, (module) => module.mass);
  const totalMass = frame.stats.mass + moduleMass;
  const heatLoad = sumModules(mounts, (module) => module.heat);
  const thermalCapacity = frame.stats.cooling + frame.stats.heatRouting;
  const commandDraw = sumModules(mounts, (module) => module.commandDraw);

  return {
    powerDraw,
    reactorOutput: frame.stats.reactorOutput,
    powerHeadroom: frame.stats.reactorOutput - powerDraw,
    moduleMass,
    totalMass,
    massCapacity: frame.stats.massCapacity,
    massHeadroom: frame.stats.massCapacity - totalMass,
    heatLoad,
    thermalCapacity,
    heatHeadroom: thermalCapacity - heatLoad,
    cooling: frame.stats.cooling,
    heatRouting: frame.stats.heatRouting,
    commandDraw,
    commandCapacity: frame.stats.commandCapacity,
    commandHeadroom: frame.stats.commandCapacity - commandDraw
  };
}

function validateResourceEnvelope(
  issues: ShipLoadoutIssue[],
  frame: ShipFrameDefinition,
  resources: ShipLoadoutResources
): void {
  if (resources.powerHeadroom < 0) {
    issues.push({
      code: 'powerOverload',
      message: `Frame ${frame.id} power draw ${resources.powerDraw} exceeds reactor ${resources.reactorOutput}`,
      frameId: frame.id
    });
  }

  if (resources.massHeadroom < 0) {
    issues.push({
      code: 'massOverload',
      message: `Frame ${frame.id} mass ${resources.totalMass} exceeds capacity ${resources.massCapacity}`,
      frameId: frame.id
    });
  }

  if (resources.heatHeadroom < 0) {
    issues.push({
      code: 'heatOverload',
      message: `Frame ${frame.id} heat ${resources.heatLoad} exceeds thermal capacity ${resources.thermalCapacity}`,
      frameId: frame.id
    });
  }

  if (resources.commandHeadroom < 0) {
    issues.push({
      code: 'commandOverload',
      message: `Frame ${frame.id} command draw ${resources.commandDraw} exceeds capacity ${resources.commandCapacity}`,
      frameId: frame.id
    });
  }
}

function orderMounts(
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedMountInternal[]
): ResolvedMountInternal[] {
  const order = new Map(frame.hardpoints.map((hardpoint, index) => [hardpoint.id, index]));
  return [...mounts].sort(
    (left, right) =>
      (order.get(left.hardpoint.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.hardpoint.id) ?? Number.MAX_SAFE_INTEGER)
  );
}

function createLoadoutSignature(
  frameId: ShipFrameId,
  mounts: readonly ResolvedShipModuleMount[]
): string {
  return `${frameId}:${mounts.map((mount) => `${mount.hardpointId}=${mount.moduleId}`).join(',')}`;
}

function createShipLoadoutPreviewModel(
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedShipModuleMount[],
  resources: ShipLoadoutResources
): ShipLoadoutPreviewModel {
  const requiredCount = frame.hardpoints.filter((hardpoint) => hardpoint.required).length;
  return {
    title: `${frame.name} frame`,
    role: frame.role,
    hardpointLine: `${frame.hardpoints.length} hardpoints | ${requiredCount} core | ${mounts.length} mounted`,
    resourceLine: formatResourceLine(resources),
    structureLine: `Armor ${frame.stats.armor} | Shields ${frame.stats.shields} | Mobility ${frame.stats.mobility} | Cargo ${frame.stats.cargo}`,
    moduleLine: mounts.map((mount) => mount.moduleShortName).join(' / ')
  };
}

function createShipLoadoutHudModel(
  frame: ShipFrameDefinition,
  resources: ShipLoadoutResources
): ShipLoadoutHudModel {
  return {
    identity: `${frame.name} | ${frame.role}`,
    resources: formatResourceLine(resources),
    ariaLabel: `${frame.name} loadout. Power ${resources.powerDraw} of ${resources.reactorOutput}. Heat ${resources.heatLoad} of ${resources.thermalCapacity}. Mass ${resources.totalMass} of ${resources.massCapacity}. Command ${resources.commandDraw} of ${resources.commandCapacity}.`
  };
}

function createShipLoadoutSummaryModel(
  frame: ShipFrameDefinition,
  mounts: readonly ResolvedShipModuleMount[],
  resources: ShipLoadoutResources
): ShipLoadoutSummaryModel {
  return {
    frame: `${frame.name} | ${frame.role} | ${frame.presentation.manufacturer}`,
    modules: mounts.map((mount) => `${formatSlot(mount.slot)}: ${mount.moduleName}`).join(' | '),
    powerGrid: formatResourceLine(resources),
    frameStats: `Armor ${frame.stats.armor} | Shields ${frame.stats.shields} | Mobility ${frame.stats.mobility} | Cargo ${frame.stats.cargo} | Cooling ${frame.stats.cooling} + Routing ${frame.stats.heatRouting}`
  };
}

function formatResourceLine(resources: ShipLoadoutResources): string {
  return `Power ${resources.powerDraw}/${resources.reactorOutput} | Heat ${resources.heatLoad}/${resources.thermalCapacity} | Mass ${resources.totalMass}/${resources.massCapacity} | Command ${resources.commandDraw}/${resources.commandCapacity}`;
}

function formatSlot(slot: ShipModuleSlot): string {
  return `${slot[0]?.toUpperCase() ?? ''}${slot.slice(1)}`;
}

function sumModules(
  mounts: readonly ResolvedMountInternal[],
  select: (module: ShipModuleDefinition) => number
): number {
  return mounts.reduce((total, { module }) => total + select(module), 0);
}

function sameShipStats(left: ShipStats, right: ShipStats): boolean {
  return (
    left.maxHull === right.maxHull &&
    left.speed === right.speed &&
    left.hitRadius === right.hitRadius &&
    left.pickupPullRange === right.pickupPullRange &&
    left.specialChargeMultiplier === right.specialChargeMultiplier &&
    left.specialInitialCharge === right.specialInitialCharge &&
    left.bombCapacity === right.bombCapacity &&
    left.startingCredits === right.startingCredits &&
    left.startingSalvage === right.startingSalvage
  );
}
