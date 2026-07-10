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

Debug-only actions may exist for local/CI smoke scenarios, but they should stay behind `?debug=1`, keep deterministic setup, and remain outside the visible remapping list.

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

## Phase 5 progression and feedback boundaries

- Persistent upgrades should live in content tables with stable IDs, costs, categories, icon keys, prerequisites, and effect descriptors.
- Save data should store purchased upgrade IDs and banked scrap, not duplicated upgrade effect payloads. Generation should resolve effects from content at run creation time.
- Upgrade effects must receive the current save state and explicit RNG/generation context. They should not read DOM state, current time, or `Math.random()`.
- Upgrade Bay UI should derive a pure view model from save data plus upgrade definitions before rendering icons, cost state, and purchase affordances.
- Sector completion exits/toasts should be modeled as explicit scene or gameplay states so route/reward transitions cannot double-fire.
- Lunar surface content should reuse existing sector background/feature/hazard validation paths rather than introducing a separate terrain generator.
- Player destruction should remain a bounded combat outcome state that hands off to the existing run summary path after a known duration or event.

## Item hooks

Item definitions should keep scale-oriented metadata next to gameplay tags and hooks:

- `family` for build/archetype grouping;
- `sources` for starter, combat, shop, vault, elite, boss, faction, lunar, route, and unlock acquisition intent;
- `unlockTier` and unlock gate links for progression-aware pools;
- `implementationStatus` plus notes for live, bridge, or planned effects;
- `stacking` and short `uiTags` for future reward/card presentation.

Validation should reject metadata drift before generation uses it. Reward-pool membership must match source metadata, unlock-gated items must carry unlock tier/source intent, and bridge/planned items must explain their implementation gap.

The registered item hook surface now covers `onFire`, `onProjectileSpawn`, `onEnemyKilled`, `onPlayerHit`, `onPickupCollected`, `onGraze`, `onSpecialUsed`, `onBombUsed`, `onSectorStart`, `onRouteChosen`, `onShopEntered`, `onRewardGenerated`, and `onBossPhaseChanged`. New item content should declare only hooks that have explicit implementation entries and tests.

`src/game/BuildSynergy.ts` is the read model for player-facing build identity. It scores item instances by family, tags, and acquisition order, then formats compact HUD, reward/shop, and run-summary copy. Keep it presentation-oriented: it should explain the build, not alter item hooks, rewards, or combat state.

`src/game/ItemStress.ts` is the read/debug model for item-heavy smoke. It owns the deterministic item-storm loadout, fresh/unlocked reward-shop-vault pool previews, and item hook pressure summaries used by tests and the debug overlay. Keep it out of normal run generation; production acquisition should continue through `Rewards`, `Shops`, `SectorRewards`, and save-state unlock filters.

`src/ui/ItemCardViewModel.ts` and `src/ui/ItemCard.ts` are the shared item presentation layer for reward choices, shops, run summary cards, and discovered archive items. They should stay deterministic and data-only from item metadata plus local context; do not let card rendering change reward pools, prices, save state, or item hook behavior.

Use deterministic hook order:

1. base weapon emits payload;
2. ship passive modifiers;
3. item modifiers sorted by acquisition order;
4. curse modifiers;
5. temporary buffs;
6. final caps/safety pass.

Each hook receives a payload and returns either a modified payload or event side effects. Prevent unbounded recursion with `procDepth` or per-event budgets; the dispatch helper exposes a bounded report path for proc-budget tests.

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

## Phase 3 architecture priorities

Phase 3 makes scrolling a first-class simulation system. Keep it explicit, deterministic, and separate from rendering.

### Scroll state and distance

- Track scroll distance, sector length, scroll speed, and world/camera offset in gameplay state or a small scroll-system module.
- Advance scroll state in fixed-step simulation, not inside renderer calls.
- Sector completion should read scroll/objective state, not infer progress from pixels drawn.
- Pause, settings, route/reward/shop scenes, and summary scenes must not advance sector distance.

Recommended module direction:

```text
src/game/ScrollState.ts
src/game/SectorConditions.ts
src/game/DistanceObjectives.ts
src/content/backgrounds.ts
src/game/BackgroundPlan.ts
```

### Procedural backgrounds

- Background plans should be generated from seed, sector ID, route modifiers, and explicit RNG fork labels.
- Rendering should consume a generated background plan plus scroll offset; it should not call random functions.
- Use original canvas primitives such as stars, debris lines, grids, silhouettes, bloom strands, warning rails, and wreck contours.
- Performance mode and reduced motion should simplify layers before drawing, not alter deterministic gameplay.

### Scroll-synced encounters

- Wave and hazard schedules should support distance markers as well as time gates.
- Spawn logic must process all crossed distance markers in order when frame time catches up.
- Tests should prove no marker is skipped or duplicated under large fixed-step batches.
- Boss arena transitions should be explicit states: travel, approach, arena lock/slow, defeated/exit. Hazards hidden during a locked arena must not become damaging on the release frame; if a distance-tied hazard window overlaps the lock, restart its telegraph lead from the release distance before collision damage can apply.

### Route-conditioned sector state

- Route outcomes should modify generated sector conditions through typed modifiers, not ad hoc scene flags.
- Good condition examples: scroll speed, length, hazard density, salvage density, landmark set, ambush mark, repair platform mark, boss approach length.
- Summaries should log notable physical conditions so seed replays and balance reports have context.

### Scrolling performance

- Track background primitive/layer counts separately from combat entities.
- Add pooling/batching only after long-scroll debug scenarios show need.
- Keep bullets visually above moving backgrounds with stable contrast and no hidden blending tricks.

## Phase 4 architecture priorities

Phase 4 adds display/input/identity polish without turning presentation into a separate framework. Keep visual identity data-driven and reuse existing scene/input/render boundaries.

### Viewport and scaling

- Treat canvas size, device pixel ratio, gameplay safe frame, and HUD safe areas as explicit derived state.
- Keep gameplay simulation in world/screen units that are stable under resize; renderer layout can adapt, but hitbox semantics should stay readable.
- Add pure helpers for scaling and safe-area calculations before embedding layout math directly in scenes.
- Debug metrics may expose viewport size, canvas scale, safe frame, and active HUD mode.

### Mouse and pointer input

- Route mouse movement, pointer state, and click/hold fire through the input abstraction.
- Pointer controls should be optional and must not interfere with DOM focus, settings, menus, pause, or keyboard-only play.
- Clamp gameplay pointer targets to the safe frame, not the full browser window when HUD or letterboxing is active.
- Store new pointer settings through the settings module only when the implementation needs user-tunable behavior.

### Ship appearance and previews

- Ship appearance belongs in content data next to ship/contract identity: silhouette, palette, engine color, cockpit accent, weapon mount hints, and HUD theme key.
- Gameplay ship rendering, contract previews, HUD theme, and summary/debug labels should consume the same appearance data rather than duplicating style tables.
- Appearance changes must not alter combat hit radius, collision, or deterministic run generation unless explicitly modeled as gameplay stats.

### Themed HUD

- Themed HUD should decorate clear operational readouts, not replace them with ambiguous art.
- Critical state still needs text and semantic DOM exposure for accessibility.
- Reduced motion, performance mode, and high-contrast bullet settings should simplify cockpit styling and preserve bullet readability.

## Phase 7 architecture priorities

Phase 7 adds richer enemy roles, upgraded variants, formations, and longer sectors. Keep these systems content-driven and deterministic rather than embedding one-off behavior branches in the scene.

### Enemy role metadata

- Enemy definitions should carry explicit role metadata such as role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, and faction fit.
- Validation should reject unsupported role/movement/attack families, missing faction fits, invalid variant references, and formation-ineligible enemies used in formation definitions.
- Role metadata should describe behavior and pressure, not presentation fashion. Rendering can consume role cues, but generation and simulation should not infer behavior from colors or labels.
- Work order 061 records the current audit baseline in `src/content/enemyRoleAudit.ts` and `docs/STARBREAK_SALVAGE_ENEMY_ROLE_AUDIT.md`; work order 062 turns that audit language into validated content metadata before behavior changes.
- Work order 062 adds `src/content/enemyRoles.ts` registries, `enemyRole` metadata on current faction-pattern classes, validation in `contentValidation`, and `src/game/EnemyRolePressure.ts` debug summaries. Later movement, attack, variant, and formation work should consume these fields instead of adding new faction-name branches.
- Work order 063 adds `src/systems/EnemyMovement.ts`; movement systems should continue consuming `movementFamily` metadata, stable `homeX` anchors, fixed-step `dt`, and explicit `CombatBounds` rather than viewport dimensions.
- Work order 064 adds `src/systems/EnemyAttack.ts`; normal attack systems should continue consuming `attackFamily` metadata for cooldowns, windup duration, telegraph label/kind, aim style, projectile speed/radius, tags, and budgets. `CombatState` owns the small pending-windup state on each enemy, while the attack module stays pure and returns telegraph/projectile blueprints.
- Work order 065 adds `src/content/enemyVariants.ts`; wave generation should select variant IDs from seeded per-spawn RNG forks, while combat/render/debug consume the selected descriptor rather than inferring from faction names.
- Work orders 066 and 067 add `src/content/enemyFormations.ts`; wave generation should select formation IDs from seeded per-wave RNG forks, apply deterministic route/encounter/faction weighting, expand existing multi-member waves into ordered spawn entries with shared formation instance IDs, and keep combat runtime spawning as an indexed schedule consumer rather than a formation-aware randomizer.
- Add an objective policy field before implementing retreating, spawned, shielded, or formation enemies so target counts cannot desync from field cleanup.

Recommended module direction:

```text
src/content/enemies.ts
src/content/enemyVariants.ts
src/game/EnemyRoles.ts
src/systems/EnemyMovement.ts
src/systems/EnemyAttack.ts
```

### Upgraded variants

- Variant selection should be generated from seed plus save state, sector depth, faction, route pressure, challenge flags, and encounter type.
- Variants should apply typed modifiers or behavior flags that are validated against enemy role metadata.
- Fresh saves and early sectors must retain a forgiving baseline pool.
- Visual/readability cues should be deterministic and tied to the same variant descriptor used by simulation and debug summaries.
- Current first-pass modifiers are deliberately conservative: hull bonus, attack-cooldown multiplier, lateral drift/profile scale, radius scale, and bonus salvage. Do not add hidden damage spikes; if later variants add shielding, escorting, or commander behavior, keep the cue, cleanup, objective policy, and tests in the same descriptor pipeline.

### Formations

- Formation definitions should list member roles/enemies, offsets, entry timing, spacing, break conditions, cleanup behavior, and optional reward hooks.
- Formation generation belongs near wave/sector planning. Runtime spawning should consume a generated plan and process crossed distance markers in order.
- Formation members must share the normal enemy kill/accounting path so simultaneous kills, item side-effect kills, body collisions, and despawns cannot desync objectives.
- Formation placement should use fixed combat-world units, not viewport dimensions.
- Current first-pass formations are annotations on normal enemies: the wave director applies member offsets/timing before combat sees `EnemySpawn` entries, combat preserves formation IDs, instance IDs, and member indexes on `EnemyState`, the renderer draws compact arcs/labels, and debug pressure summaries count active formation labels. Clear rewards and route-conditioned formation bias stay in this content-driven path; deeper break/retreat behavior remains future work.

Recommended module direction:

```text
src/content/enemyFormations.ts
src/game/WaveDirector.ts
src/game/EnemyRolePressure.ts
```

### Longer sectors

- Longer-sector pacing should extend generated sector conditions with pressure bands, relief windows, formation clusters, landmark beats, and boss approach changes.
- The first implementation lives in `src/game/SectorPacing.ts`: gameplay derives route-conditioned scroll/features/arena first, then applies the pacing layer for final scroll length, encounter-pacing ratios, sparse feature beats, and boss approach scaling. Keep this layer deterministic and avoid mutating the base run skeleton.
- Avoid per-frame random decisions. Generate the schedule once, then let fixed-step simulation consume it.
- Gameplay may evaluate generated sector hazards through a transient boss-release deferral when an arena lock hid their warning. That deferral belongs to runtime hazard activation state, not run generation, so seeded feature plans and summaries remain stable.
- Summaries and debug overlays should expose length, pressure band, role/variant/formation counts, and route-conditioned reasons where useful.
- Performance mode and reduced motion may simplify presentation, but should not change combat generation or objective requirements.

## Phase 8 architecture priorities

Phase 8 turns environmental pressure into a richer game layer. Keep hazard zones, destructibles, obstacles, and loose currency generated from seed plus save/sector context, then consumed by fixed-step simulation and canvas rendering without per-frame randomization.

### Environmental feature model

- Treat environmental content as data first: hazard zones, destructibles, obstacles, and loose currency scatter rules should have stable IDs, validation, debug labels, sector/faction fit, and accessibility metadata.
- Keep placement in fixed 640x720 combat-world units. Viewport size can change presentation scale, but not lane widths, collision shapes, pickup pull, or hazard timing.
- Generate environmental schedules once per sector or event from explicit RNG forks. Runtime systems should consume indexed plans and process crossed distance markers in order.
- Avoid coupling environmental generation to canvas colors, DOM state, or current browser dimensions.

Recommended module direction:

```text
src/content/hazardZones.ts
src/content/environmentObjects.ts
src/game/HazardZoneDirector.ts
src/game/EnvironmentObjectPlacement.ts
src/game/LooseCurrency.ts
src/game/EnvironmentStress.ts
```

### Hazard zones

- Hazard definitions should describe phase timing, telegraph shape, active damage shape, damage cooldown, safe-lane expectation, visual layer, reduced-motion/high-contrast/performance variants, and boss-arena suppression behavior.
- Work order 072 adds `src/content/hazardZones.ts` as the first schema registry for existing hazards. It keeps separate sector, route-condition, and pacing metrics so behavior does not retune while the definition contract becomes content-driven.
- Work order 073 adds `src/game/HazardZoneBehavior.ts` as the pure runtime behavior layer. It derives presentation state, pulse damage-window gating, fixed-world damage rectangles, and settings simplification from the content registry before `SectorHazards` and `CanvasRenderer` consume it.
- Work order 074 adds `src/game/HazardZoneDirector.ts` as the deterministic schedule layer between `SectorPacing` and `SectorFeatures`. Pacing keeps pressure/relief/formation/boss beats, while the director materializes fair hazard windows from seed plus save/sector context and exposes ordered telegraph/active/clear events for catchup-safe processing.
- Collision damage must only occur after a visible warning lead. If a boss arena hides a hazard warning during lock, preserve the work order 070 release contract by restarting a post-release telegraph before damage can occur.
- Rendering should keep hazards below bullets, enemies, pickups, and the player. Richer hazard art should use low-alpha fills, clear outlines, and compact labels before adding animated effects.

### Destructibles and obstacles

- Destructibles and obstacles should share content validation for collision shape, hull, damage interaction, objective policy, reward policy, chain behavior, placement constraints, cue metadata, and debug label.
- Work order 075 adds `src/content/environmentObjects.ts` for the first shared destructible/obstacle schema and `src/game/EnvironmentObjectPlacement.ts` for deterministic fixed-world placement helpers. Placement plans use the 640x720 combat arena, keep open-lane guarantees, and stay independent from viewport dimensions.
- Work order 080 keeps environment object placement anchors immutable and derives live screen-space object state from `scrollDistance` for rendering, collision, rewards, effects, and player pushout. Do not reintroduce viewport-space object placement or object pop-in when adding new environmental systems.
- Destructible damage should flow through explicit systems for weapon, special, bomb, hazard, or chain-reaction hits. Reward drops and item hook events should use existing deterministic pickup/economy and hook dispatch paths.
- Chain reactions must be bounded by per-tick or per-event caps so they cannot create runaway entity, pickup, or proc pressure.
- Obstacles should have placement safety checks for player spawn lanes, exit corridors, boss approach/release, hazard overlap, enemy spawn lanes, and fixed-world bounds.

### Loose currency

- Loose scrap/credit scatter should originate from deterministic plans or explicit event payloads, not ad hoc frame checks.
- Work order 078 adds `src/game/LooseCurrency.ts` for deterministic scatter specs, sector/route/hazard/feature/obstacle lane plans, value tiers, TTLs, collection radii, source labels, and active cap summaries. `CombatState` consumes those specs for enemy/boss drops, destructible rewards, and indexed distance events.
- Work order 080 adds optional `worldDistance` to loose-currency specs so planned lanes spawn ahead of their anchor and dropped enemy/boss/destructible loot scrolls with the sector after appearing. Pickup attraction still runs in fixed combat-world units, and missed world-scrolling pickups expire after leaving the field.
- Pickup attraction should use the same combat-world coordinate model as existing pickups so viewport scaling does not change collection difficulty.
- Active loose currency count/value should be capped and visible in debug. Summary and Upgrade Bay progress should remain accurate after collection.
- Economy tuning should stay conservative until playtest data proves that loose scrap does not inflate permanent upgrade pacing or shop purchasing power.

### Environmental debug and performance

- Debug overlays should expose active hazard-zone counts/families, destructible/obstacle counts, loose currency count/value, pickup cap state, and environmental stress budgets.
- Work order 079 adds `src/game/EnvironmentStress.ts` as the pure budget summary layer for environmental debug smoke. It keeps hazard-family labels, object/destructible/obstacle totals, loose pickup/value caps, and stress-budget state inspectable without exposing private runtime structures to browser smoke.
- Environmental stress paths should coexist with item-storm, enemy-rich, dense-combat, forced-exit, forced-destruction, and long-scroll smoke without hiding bullets or exceeding the current alpha field budget.
- Performance mode and reduced motion may simplify draw density, effects, and animation, but should not alter generated plans, collision timing, objective requirements, or pickup economy.

## Phase 9 architecture priorities

Phase 9 expands the run into a deterministic two-act structure. Keep the act model explicit, data-driven, and separate from transient scene state.

### Act model and progression

- Add typed act definitions for act id, display name, sector budget, route grammar, boss/finale gate, reward tier, shop/economy profile, pressure profile, and summary labels.
- Work orders 082-083 add `src/content/acts.ts`, `src/game/ActPlan.ts`, and `src/game/InterActJunction.ts` as the first implementation of this contract. Current runs target ten sectors, expose Act I for sectors 1-5 and Act II for sectors 6-10, and carry generated act/junction context through sector data, route history, debug state, summaries, and last-run save records.
- Generate an act plan once from seed plus save state. Gameplay, route screens, rewards, shops, summaries, debug overlays, and save records should consume that plan rather than inferring act state from sector indexes.
- Carry act index/name and current act sector progress through public read models so tests and browser smoke can inspect act state without private app access.
- Preserve backward compatibility for older one-act run summaries and saves. Missing act fields should read as the original single-act path.

Recommended module direction:

```text
src/content/acts.ts
src/game/ActPlan.ts
src/game/RunProgression.ts
src/game/InterActJunction.ts
src/game/ActPressure.ts
```

### Inter-act junction

- Treat the midpoint junction as an explicit run scene after Act I completion and before Act II launch.
- Junction choices should stay deterministic from seed plus save state and should apply typed modifiers to Act II route, economy, repair, risk, or reward plans through `RunSession` helpers rather than scene-local state.
- The junction should use pure view models for choice cards, resource deltas, risk labels, and keyboard focus order.
- Pause, abandon, settings, import/export safety, and summary handoff should not lose the selected act plan or duplicate rewards.

### Act II route and content contracts

- Act II sector and route content should extend existing sector, background, feature, wave, hazard, reward, shop, vault, elite, faction, and boss registries instead of introducing a parallel generator.
- Work order 084 adds `src/content/actRouteContracts.ts` plus `src/game/ActRouteContracts.ts` for the first route-contract layer. Act II generation consumes these contracts for labels, tags, sector/faction/background/objective fit, pressure/reward/terrain preview copy, deterministic weights, risk offsets, and optional unlock gates while Act I remains on the generic route path.
- Route-card copy should explain pressure/reward tradeoffs while the deterministic content data carries the actual rule references.
- Content validation should reject invalid act-route references, unsupported objective families, missing reward profiles, missing boss/finale gates, and Act II routes that have no valid sector pool.
- Work order 085 extends `src/game/SectorObjectives.ts` and `src/game/SectorPacing.ts` with Act II objective variants, length bands, pressure bands, second-act relief windows, route-conditioned pacing modifiers, and boss-approach scaling. Later pressure/economy/finale work should consume these read models instead of adding scene-local Act II exceptions.

### Act-aware pressure and economy

- Act-aware pressure should be a generation/read-model layer that coordinates enemy roles, upgraded variants, formations, hazards, destructibles, obstacles, loose currency, and item-proc stress budgets.
- Do not let Act II systems raise projectile, telegraph, object, or pickup caps independently. Combined pressure should have one debug-readable budget summary.
- The first-pass `ActPressure` model derives pressure from explicit act context plus sector pacing, then feeds bounded hints into existing wave, hazard, environment-object, and loose-currency generators while exposing a normalized combined debug budget.
- Economy changes should resolve through existing reward/shop/vault/repair/loose-currency/save systems with act-aware profiles, not through scene-local bonuses.
- Work order 087 adds `src/game/ActEconomy.ts` for those profiles. Rewards consume it through reward context weighting, shops consume it for stock/price/reroll tuning, route events consume it for payout and repair/vault scarcity, loose currency consumes it as a value-budget hint, and summaries consume the resulting route/junction/result records.
- Summaries should separate Act I income, inter-act changes, Act II income, boss/finale rewards, and banked salvage so balance can be audited from a run record.

### Finale and debug smoke

- Second-act bosses and finales should reuse the existing boss arena, phase, hazard-release, victory, defeat, and run-summary contracts where possible.
- Boss-release hazard fairness remains mandatory: hazards hidden during a finale arena lock need a fresh visible warning lead before damage.
- Debug shortcuts should be able to jump to the inter-act junction, Act II pressure, and finale while still using generated plans and public overlay state.
- Work order 088 adds `src/game/SecondActFinale.ts` as the finale read-model boundary. Generation attaches a deterministic finale plan to the final Act II sector; gameplay consumes it for boss hull and arena-approach tuning after route/pacing modifiers; summaries, debug state, and save records consume the same plan for outcome copy, unlock hooks, and final-boss smoke without adding a separate combat path.
- Work order 089 adds `src/game/ActTwoDebug.ts` for public Act II smoke setup. The helpers identify Act II entry/finale indexes, scaffold deterministic debug route history, format route tags, and create debug summary results; app shortcuts should rebuild generated run/session state and expose details through DOM/debug readouts rather than private object access.
- Playwright smoke should prefer public DOM/debug text assertions over private app object reads.

## Phase 10 architecture priorities

Phase 10 should turn the current route into an expedition without turning `GameApp`, `CombatState`, or scene classes into branching-script owners. Prefer four layers: validated content contracts, deterministic generated plans, runtime state machines that emit typed events, and public read models consumed by UI/debug/save/summary code.

### Expedition graph and mission state

- An `ExpeditionGraph` should own stable act, sector, mission-leg, encounter-node, branch, transition, reward-hook, duration-band, pressure-band, and finale-gate references.
- Generate the graph once from seed plus save fingerprint. Store player decisions and visited-node state separately so a summary or recovered session can distinguish generated possibilities from the chosen path.
- A `MissionDirector` should be an explicit state machine. Scene transitions may present mission state, but they should not decide whether briefing, entry, combat, branch, relief, extraction, failure, or completion occurs.
- Mission objectives should consume typed gameplay events such as actor defeated, subsystem destroyed, area held, scan completed, cargo recovered, ally escaped, timer elapsed, and player extracted. Every objective must declare cleanup and partial/failure policies.
- Current single-lane sectors should remain valid through an explicit compatibility projection during migration. Older last-run records can normalize without rewriting stored history.

Work order 091 audit and implementation:

- The old authoritative chain was `RunSkeleton.sectors[index]` -> one `GameplayScene` -> route/shop/reward -> `advanceSector`. Route history counted completed sector decisions, save summaries inferred progress from sector and route counts, and debug shortcuts assigned `currentSectorIndex` directly. Rewards, shops, junctions, finales, and smoke helpers all referenced sector indexes rather than stable encounter identity.
- `src/content/expeditions.ts` now owns validated node profiles for approach, standard/escalated operation, opportunity, extraction, checkpoint, and finale stages plus seeded optional opportunity contracts.
- `src/game/ExpeditionGraph.ts` creates a graph after existing sectors are fully generated, using a new named RNG fork so contract, sector, boss, route, wave, reward, and shop results do not move. `ExpeditionTypes.ts` keeps the schema reusable, and `ExpeditionValidation.ts` owns structural/reference checks. The graph carries stable act/sector/leg/node/branch/gate ids, content references, duration/pressure bands, entry/completion/transition policies, and reward hooks.
- `RunSkeleton.expedition` is immutable. `RunSession.expedition` separately owns visited node ids and branch decision records. Pure path resolution makes the same decision history reproduce the same node path and outcome ids.
- Current gameplay explicitly enters one operation node per sector and marks required ingress/operation/gate nodes during the existing reward advance. It does not execute optional nodes or multiple stages yet; that is the work order 092 handoff.
- Public read models feed the cockpit sector strip, run summary, and DOM debug overlay. Debug index jumps synchronize compatibility progress without accessing graph internals from browser tests.
- Save schema v5 stores graph id, visited node ids, decision ids, and target duration on the last-run summary. The loader checks `starbreak.save.v5`, migrates deployed v4 data from `starbreak.save.v4`, and normalizes older summaries to null/empty expedition fields.
- The generated baseline has 30 required nodes targeting 962 seconds (about 16.0 minutes). Ten optional nodes raise authored target capacity to 1182 seconds (about 19.7 minutes). These are content budgets, not a claim that work order 091 changed the current roughly six-minute live run.

### Modular ship and engineering state

- Separate immutable frame definitions, module definitions, acquired component instances, and resolved runtime loadouts. Avoid storing computed fire cadence or hook arrays as authoritative save data.
- A pure loadout resolver should validate hardpoints, power, mass, cooling, heat, compatibility, uniqueness, and tag requirements, then produce cached combat stats and ordered hook registrations.
- Foundry operations should be explicit commands with preview and commit results. The same seed/save/component inventory plus command sequence must produce the same recipes, affixes, instability, salvage value, and final loadout.
- Existing ship contracts and weapons should enter through compatibility definitions so migration does not create a second combat implementation.
- Item and module effects should share dispatch ordering and combined budgets. Module code must not create an unbounded parallel hook pipeline.

### Multi-part set pieces

- Represent a capital ship or station as one set-piece instance with stable component ids, parent/child references, local transforms, damage policy, collision shapes, objective hooks, and staged state.
- Convert local component geometry into the fixed 640x720 combat world through one scroll/set-piece transform. Presentation scaling must never affect targeting or safe lanes.
- Route subsystem damage, chain reactions, disablement, destruction, rewards, and cleanup through typed set-piece events so simultaneous hits cannot duplicate outcomes.
- Boss arena locks and hazard suppression remain separate policies. Set pieces may request those policies but must not bypass the fresh post-lock hazard telegraph rule.

Work order 096 implementation:

- `src/content/setPieces.ts` owns seven shared subsystem templates and three actor definitions. Each actor declares stable component/stage ids, dependencies, collision silhouettes, rewards, a fixed safe lane, a scroll anchor, a reinforcement formation, a boss-lock policy, and actor-local caps.
- `src/game/SetPiece.ts` converts those definitions into one runtime state with dependency-gated targets and idempotent component, stage, and completion events. Area damage snapshots the targetable layer before applying one bomb/hazard event, so a single broad hit cannot tunnel through multiple dependency stages.
- `CombatState` remains the accounting boundary. Weapon/special/bomb/hazard damage, contact pushout, loose-currency scatter, objective credit, capped turret shots, bounded hangar formations, and result summaries all consume the actor state. Destroyed subsystems stop future output; completed finale state releases the existing boss arena rather than replacing it.
- Canvas rendering consumes component screen states derived from the same 640x720 scroll transform used by collision. High contrast changes colors and labels; reduced motion and performance mode remove glow/detail only.

### Factions, rivals, and crew

- A run-local `FactionCampaign` should fold typed mission/player events into compact faction state. Generated later-node options consume that state through explicit deterministic inputs and named RNG forks.
- Rivals should be generated plans plus evolving run state: identity/tactics/ship are planned, while injury, escape, upgrades, grudges, and recurrence derive from recorded outcomes.
- Crew definitions should remain content; recruited crew and wingmates should be small runtime records referencing definitions plus trust, injury, command, and mission state.
- Ally AI must use bounded target queries and explicit command state. Damage attribution and objective policy should share the existing centralized defeat/accounting paths.

### Run timeline and Scenario Lab

- Emit compact timeline events for node/stage transitions, branch choices, economy, engineering, faction/rival/crew outcomes, bosses, and run end. Store ids and small payloads; resolve player-facing copy later.
- Bound timeline length and per-category detail before it reaches save data. This is local diagnostics and summary context, never telemetry.
- Scenario Lab setup helpers should accept public content/plan ids and return the same read models used by gameplay. Browser smoke should not mutate private fields to reach late systems.

Recommended module direction:

```text
src/content/expeditions.ts
src/content/missions.ts
src/content/shipModules.ts
src/content/setPieces.ts
src/content/rivals.ts
src/content/crew.ts
src/game/ExpeditionGraph.ts
src/game/ExpeditionTypes.ts
src/game/ExpeditionValidation.ts
src/game/MissionDirector.ts
src/game/ShipLoadout.ts
src/game/SalvageEngineering.ts
src/game/SetPieceState.ts
src/game/FactionCampaign.ts
src/game/CrewCommand.ts
src/game/RunTimeline.ts
```

The exact split should follow the work order 091 repository audit. Dependency direction is the constraint: content must not import scenes; generation must not call the DOM; runtime systems must not own presentation; UI/debug/save surfaces consume public read models.

## GitHub Pages notes

- Vite project Pages base path should be `/StarbreakSalvage/` for `https://regillmore.github.io/StarbreakSalvage/`.
- Pages workflow should upload `dist`.
- CI should run separately from deploy so PRs are checked before merge.
