# Starbreak Salvage — Technical Architecture

## Architecture goal

Create a browser-first TypeScript codebase that is simple enough for agents to modify safely, deterministic enough for seeded runs, and fast enough for dense arcade combat.

## Stack

- TypeScript.
- Vite.
- Canvas 2D.
- DOM for menus and overlays.
- Vitest.
- Playwright.
- ESLint + Prettier.
- GitHub Actions for CI and Pages deployment.

## Dependency policy

Default to minimal dependencies. Good dev dependencies: Vite, TypeScript, Vitest, Playwright, ESLint, Prettier. Avoid gameplay/runtime libraries until a concrete need appears. If adding a dependency, document why, alternatives considered, and impact on bundle size.

## Module boundaries

```text
src/app       boot, loop, scene manager
src/core      pure utilities: rng, math, storage, event bus, time
src/content   data tables and validation
src/game      run state, generation, balance constants
src/systems   gameplay simulation systems
src/ui        DOM and menu scenes
src/assets    original/generated asset references
```

## Data flow

```text
Input -> Scene.update -> Systems update World/RunState -> Events -> Audio/VFX -> Render
                              ^
                              |
                         Content + RNG
```

## Scenes

Use a `Scene` interface:

```ts
export interface Scene {
  enter?(params?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(alpha: number): void;
  handleAction?(action: InputAction): void;
}
```

Recommended scenes:

- `MainMenuScene`
- `ContractSelectScene`
- `GameplayScene`
- `RewardScene`
- `ShopScene`
- `PauseScene` or pause overlay
- `RunSummaryScene`
- `SettingsScene`

## Fixed-step loop

- Use `requestAnimationFrame`.
- Accumulate elapsed time.
- Simulate with fixed `dt = 1 / 60`.
- Clamp max frame catchup.
- Render once per frame.

## Input abstraction

Map physical inputs to actions:

```ts
type InputAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'fire'
  | 'special'
  | 'bomb'
  | 'pause'
  | 'confirm'
  | 'back';
```

Store bindings in options. Game systems should read actions/axes, not key codes.

## RNG contract

No `Math.random()` in run generation, rewards, shops, waves, boss variants, or procedural content. Use an explicit `Rng` instance.

Expected API:

```ts
export interface Rng {
  readonly seedLabel: string;
  nextU32(): number;
  nextFloat(): number;
  int(minInclusive: number, maxInclusive: number): number;
  choice<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  fork(label: string): Rng;
}
```

## Content registry

Use stable string IDs for everything:

- `ship_debt_runner`
- `weapon_light_needle_laser`
- `item_split_prism`
- `boss_auditor_drone_xl`
- `sector_outer_debris_field`
- `unlock_ship_scrap_monk`

All content tables should be validated in tests.

## Item hooks

Use deterministic hook order:

1. base weapon emits payload;
2. ship passive modifiers;
3. item modifiers sorted by acquisition order;
4. curse modifiers;
5. temporary buffs;
6. final caps/safety pass.

Each hook receives a payload and returns either a modified payload or event side effects. Prevent unbounded recursion with `procDepth` or per-event budgets.

## Save system

- Use localStorage.
- Version save data.
- Validate on load.
- Corrupted saves should not crash boot.
- Provide reset and export/import.
- Test migrations.

## Rendering

Initial renderer can draw simple shapes:

- player: bright triangular ship;
- enemies: faction-colored shapes;
- bullets: high-contrast circles/diamonds;
- pickups: glowing squares/coins;
- boss: multi-part shape.

Later renderer can use sprites, but shape-rendered placeholders are good for fast iteration.

## Audio

Start with a muted-safe system:

- audio context created only after user gesture;
- master/music/sfx volumes;
- mute toggle;
- procedural beeps/explosions acceptable as placeholders.

## Performance

Track:

- FPS;
- update time;
- render time;
- entity count;
- projectile count;
- particle count;
- active hooks/procs.

Use object pools only after profiling. Keep the initial code readable.

## Testing priorities

1. RNG deterministic outputs.
2. Seeded run generation snapshots.
3. Content validation.
4. Collision/damage.
5. Item hook ordering.
6. Save migration.
7. E2E smoke.

## Phase 2 architecture priorities

Phase 2 should deepen systems without turning the codebase into a framework. Prefer explicit content data and small pure helpers over hidden engine magic.

### Sector objectives and waves

- Add objective and wave definitions as content data, not hard-coded scene thresholds.
- Keep generation deterministic by passing seeded RNG/fork labels into objective, wave, boss, reward, and shop generation.
- Separate generated run plans from mutable run/session progress.
- Store only durable progress in save data; do not persist transient combat entities.

Recommended module direction:

```text
src/content/objectives.ts
src/content/waves.ts
src/game/SectorObjectives.ts
src/game/WaveDirector.ts
```

### Player verbs

- Keep input actions abstract: gameplay reads `special`, `bomb`, and movement actions, not raw keys.
- Put charge/cooldown math in pure systems that can be tested without DOM/canvas.
- Ship stats should be content data validated in tests before they affect combat state.
- Bomb/special/graze should emit feedback cues through the existing feedback path rather than directly touching audio/VFX.

### Combat feedback and presentation

- Gameplay may report semantic feedback events such as `playerHit`, `bossWarning`, or `sectorClear`.
- Audio, screen shake, particles, and hit flashes should subscribe at the app/presentation layer.
- Reduced motion, performance mode, mute, and master volume must remain respected by default.
- Do not add external audio/art dependencies without documenting license and bundle impact.

### Content growth

- New content tables should keep stable string IDs and explicit exports.
- Validation should fail on duplicate IDs, invalid references, invalid stat ranges, empty reward pools, and hooks with no implementation path.
- If a content type grows too large, split by domain (`itemsCombat.ts`, `itemsEconomy.ts`, etc.) only when it improves readability.

### Unlock gating

- Treat unlocks as pool filters over content generation.
- Fresh saves must retain enough baseline ships/items/routes for complete runs.
- Any save shape change requires migration tests and import/export compatibility tests.

## GitHub Pages notes

- Vite project Pages base path should be `/StarbreakSalvage/` for `https://regillmore.github.io/StarbreakSalvage/`.
- Pages workflow should upload `dist`.
- CI should run separately from deploy so PRs are checked before merge.
