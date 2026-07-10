import type { CanvasRenderer } from './CanvasRenderer';
import type { ActPressureDebugState } from '../game/ActPressure';
import type { EnemyRolePressureSummary } from '../game/EnemyRolePressure';
import type { EnvironmentStressDebugState } from '../game/EnvironmentStress';
import type { ItemLoadoutStressModel } from '../game/ItemStress';
import type { SecondActFinaleDebugState } from '../game/SecondActFinale';
import type { InputAction } from '../systems/InputSystem';
import type { ContractThemeDebugState } from '../ui/ContractTheme';
import type { MissionDebugState } from '../game/MissionDirector';
import type { ShipLoadoutDebugState } from '../game/ShipLoadout';
import type { EngineeringDebugState } from '../game/Foundry';

export interface SceneDebugState {
  readonly seed: string;
  readonly entityCount: number;
  readonly entityCounts?: {
    readonly total: number;
    readonly player: number;
    readonly enemies: number;
    readonly boss: number;
    readonly projectiles: number;
    readonly playerProjectiles: number;
    readonly enemyProjectiles: number;
    readonly pickups: number;
    readonly looseCurrencyPickups: number;
    readonly looseCurrencyValue: number;
    readonly looseCurrencyCredits: number;
    readonly looseCurrencySalvage: number;
    readonly looseCurrencyPickupCap: number;
    readonly looseCurrencyValueCap: number;
    readonly effects: number;
    readonly pickupsAndEffects: number;
    readonly telegraphs: number;
    readonly environmentObjects: number;
    readonly destructibles: number;
    readonly obstacles: number;
  };
  readonly distance?: number;
  readonly sectorLength?: number;
  readonly scrollSpeed?: number;
  readonly exitSequence?: string;
  readonly destructionSequence?: string;
  readonly arenaPhase?: string;
  readonly debugScenario?: string;
  readonly inputMode?: string;
  readonly hudMode?: string;
  readonly contractTheme?: ContractThemeDebugState;
  readonly shipLoadout?: ShipLoadoutDebugState;
  readonly engineering?: EngineeringDebugState;
  readonly combinedProc?: {
    readonly budget: number;
    readonly totalApplied: number;
    readonly totalSkipped: number;
    readonly peakHook: string | null;
    readonly peakApplications: number;
    readonly lastOrder: readonly string[];
  };
  readonly mission?: MissionDebugState;
  readonly items?: ItemLoadoutStressModel;
  readonly enemyRoles?: EnemyRolePressureSummary;
  readonly environmentStress?: EnvironmentStressDebugState;
  readonly actPressure?: ActPressureDebugState;
  readonly finale?: SecondActFinaleDebugState;
  readonly upgradeEffects?: readonly string[];
  readonly act?: {
    readonly id: string;
    readonly name: string;
    readonly shortLabel: string;
    readonly index: number;
    readonly sectorIndex: number;
    readonly sectorCount: number;
    readonly rewardTier: string;
    readonly pressureTier: string;
    readonly bossGate: string;
    readonly transition: string;
  };
  readonly interAct?: {
    readonly targetAct: string;
    readonly choices: readonly string[];
    readonly applied: string | null;
  };
  readonly progression?: {
    readonly salvageBank?: number;
    readonly purchasedUpgrades?: number;
    readonly totalUpgrades?: number;
    readonly availableUpgrades?: number;
    readonly runCredits?: number;
    readonly runSalvage?: number;
  };
  readonly sector?: {
    readonly index: number;
    readonly id: string;
    readonly name: string;
    readonly backgroundId?: string;
    readonly encounterPacing?: string;
    readonly pacing?: string;
    readonly pacingBeat?: string;
    readonly objective?: string;
    readonly objectiveState?: string;
    readonly routeTags?: string;
    readonly hazardZones?: string;
  };
  readonly backgroundPrimitives?: number;
  readonly backgroundLayers?: number;
  readonly activeLandmarks?: number;
  readonly activeHazards?: number;
  readonly viewport?: {
    readonly width: number;
    readonly height: number;
    readonly className: string;
    readonly dpr: number;
    readonly scale: number;
    readonly canvasPixelWidth: number;
    readonly canvasPixelHeight: number;
    readonly safeFrameX: number;
    readonly safeFrameY: number;
    readonly safeFrameWidth: number;
    readonly safeFrameHeight: number;
    readonly arenaWidth?: number;
    readonly arenaHeight?: number;
  };
}

export interface Scene {
  readonly id: string;
  enter?(params?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(renderer: CanvasRenderer, alpha: number): void;
  handleAction?(action: InputAction): void;
  getDebugState?(): SceneDebugState;
}
