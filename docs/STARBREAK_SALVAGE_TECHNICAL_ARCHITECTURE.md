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
- Work order 112 adds transient per-hazard effective distance for visible gameplay scroll holds. Only hazards that already entered telegraph or active state advance at nominal sector speed; future hazards remain on real distance and zero-time/menu pauses remain frozen. Work order 124 guarantees boss-operation windows finish before arena lock, so locked suspension no longer creates a release-time hazard.
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
- Treat the gameplay browser viewport as the pointer control plane, but project every non-UI target onto the fixed combat safe frame. Preserve whether the raw pointer was inside the frame for telemetry; do not use that flag to disable guidance through HUD reserve or letterbox space.
- Store new pointer settings through the settings module only when the implementation needs user-tunable behavior.

### Ship appearance and previews

- Ship appearance belongs in content data next to ship/contract identity: silhouette, palette, engine color, cockpit accent, weapon mount hints, and HUD theme key.
- Gameplay ship rendering, contract previews, HUD theme, and summary/debug labels should consume the same appearance data rather than duplicating style tables.
- Appearance changes must not alter combat hit radius, collision, or deterministic run generation unless explicitly modeled as gameplay stats.

### Themed HUD

- Themed HUD should decorate clear operational readouts, not replace them with ambiguous art.
- Critical state still needs text and semantic DOM exposure for accessibility.
- Reduced motion, performance mode, and high-contrast bullet settings should simplify cockpit styling and preserve bullet readability.
- Work order 178 splits combat presentation by urgency. `GameplayScene` keeps ship identity, four live meters, compact sector/distance/hull, weapon/reserve state, objective progress, and immediate warning state in the cockpit; economy, build, hardpoint, combat-ledger, route, faction, hazard-plan, expected-boss, and wing detail belong to the pause dossier.
- `GameplayScene.getPauseDossier()` is the read-model boundary for paused operational detail. `PauseScene` renders its structured metrics and labeled sections but does not inspect combat internals or advance simulation.
- General guidance remains pause-only during ordinary flight. Boss, hazard, cooldown, exit, and destruction guidance may re-enter the live HUD because those states require immediate action.

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
- Final boss-operation feature plans must contain no hazard window at or beyond the arena lock. `HazardZoneDirector` owns this deterministic generation-time normalization, so runtime never carries hidden hazard debt through a boss fight.
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
- Work order 186 adds `src/game/SalvageStorm.ts` as the shared phase-and-geometry boundary for the route salvage squall. Its three fixed lanes, moving calm channel, active/lull windows, warning copy, and debug fixture are derived from the already-generated hazard record; simulation, HUD, and Canvas rendering consume those results without independent geometry or runtime RNG.
- Work order 187 moves that squall contract to the authored-only `salvage_squall` identity and gives the stable routine `salvage_storm` schedule to `src/game/MeteorStorm.ts`. The replacement derives one fixed-X rounded world pocket and twelve deterministic impact timelines; only impact-phase circles are collision geometry, while the broad pocket and afterglows are presentation. The invisible pre-entry phase produces no Canvas or HUD forecast. Normal scroll moves the pocket from fully above to fully below the arena; runtime pause advancement changes impact phase without changing its actual-scroll position. The director consumes no additional RNG and routine hazard choice breadth is unchanged.
- Collision damage must only occur after a visible warning lead. Boss operations preserve the full warning and active spans while packing them before lock; post-release telegraph reconstruction is not permitted.
- Rendering should keep hazards below bullets, enemies, pickups, and the player. Richer hazard art should use low-alpha fills, clear outlines, and compact labels before adding animated effects.
- Indiscriminate environmental hazards may damage player, enemies, bosses, and damageable allies through the established hazard cooldown ledger. They must not create hidden projectile actors, must exclude their declared safe geometry, and must keep objective/defeat attribution coherent.

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
- Boss-release hazard fairness remains mandatory: finale hazards must settle before arena lock and may not reappear after boss defeat.
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
- The generated baseline has 30 required nodes targeting 962 seconds (about 16.0 minutes). Ten optional nodes raise authored target capacity to 1182 seconds (about 19.7 minutes). Phase 10 subsequently made the stages executable; the deployed all-optional path measures about 12 minutes, so authored capacity remains deliberately higher than current active-play duration.

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
- Boss arena locks and hazard scheduling remain separate policies. Set pieces may request a lock, but the final hazard plan must settle before it and leave the release lane clear.

### Work order 124 boss-approach hazard settlement invariant

- `HazardZoneDirector` normalizes the combined authored, condition, and director entry list after operation-specific diversification. It processes entries from latest to earliest, preserves each warning lead and active span, retains a bounded gap, and fits the final clear event at least 18 distance units before the live arena lock.
- The hazard registry policy is `settleBeforeLock`; content validation rejects any shipped definition with another boss policy. Debug/read models report approach adjustments rather than release deferrals.
- `GameplayScene` no longer records a boss-release distance or asks `SectorFeatures` to reconstruct overlapping activation windows. The obsolete release-deferral activation option and helper are removed, so a completed hazard cannot be resurrected after the boss.
- Pause-safe hazard runtime, finite beam timing, collision/render parity, operation-sequence determinism, coast allowlists, and boss visibility suppression retain their existing ownership. No run, save, or snapshot schema changes are required.

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

Work order 097 implementation:

- `src/content/factionCampaigns.ts` owns four response policies, five reusable rival archetypes, faction-specific name parts, recurrence contracts, ordered upgrades, terminal rewards, item biases, and non-color combat cues. `RunSkeleton.factionCampaign` generates four unique rival plans once from seed plus save fingerprint without moving existing generation streams.
- `src/game/FactionCampaign.ts` separates that immutable plan from `RunSession.factionCampaign`. A pure event fold rejects campaign mismatches, ignores duplicate ids, bounds visible history to 64 entries and processed ids to 128, and updates faction ledgers plus rival encounter/outcome state without frame-time RNG.
- A campaign influence read model is the only downstream integration surface. Gameplay, route, transition, mission branch, shop, set-piece ownership, crew-offer copy, summary, and debug consumers do not reimplement faction arithmetic.
- Rivals enter `CombatState` as ordinary faction actors with explicit rival metadata and `countsForObjective: false`. First-appearance direct damage can produce a retreat; later destruction and cleanup produce one rival outcome, no ordinary kill/pickup credit, and no required field-clear blocker. Campaign event ids make capture/destruction rewards one-shot and finale eligibility derives only from folded outcomes.
- `R` builds a deterministic public recurrence fixture for browser/debug inspection. Campaign state remains run-local, so save schema v5 does not require migration; a future suspend/resume feature must serialize plan plus compact decision history together.

Work order 098 implementation:

- `src/content/crew.ts` owns five role definitions, command specialties, command costs, frame/module fit tags, mission acquisition policies, combat budgets, faction affinities, and non-color cues. `RunSkeleton.crewRoster` generates immutable candidate identity from the same seed plus save fingerprint boundary as the expedition and rival plans.
- `src/game/CrewCommand.ts` keeps generated candidates separate from `RunSession.crewRoster`. Its idempotent event fold bounds display history to 64 and processed ids to 128 while tracking recruitment, trust, mission outcomes, defeats, salvage, injury, two-sector recovery, disengagement, foundry assistance, and departure.
- Recruitment consumes existing `recordCandidate` / `protectSpecialist` mission policies or a trusted faction distress signal after a successful optional consequence. Resolved foundry loadouts supply command headroom; injured crew continue occupying capacity, and combat deployment is capped at three fitted allies.
- `CombatState` owns the short-lived ally actors and command runtime. Focus queries at most 24 enemies, screen examines at most 32 hostile projectiles, salvage examines at most 24 pickups, and every command has an explicit cooldown. Ally projectiles have their own owner/attribution id and share centralized enemy, boss, pickup, objective, and result accounting without dispatching player item hooks.
- Enemy shots can injure an ally before reaching the player; regroup repairs only ally hull, and disengage produces a crew retreat rather than an enemy escape or injury. Combat results fold back into the roster only at the mission boundary.
- The original five settings-backed focus, screen, salvage, regroup, and disengage bindings remain accepted for schema/save compatibility, but work order 178 suppresses their settings rows, cockpit buttons, and gameplay dispatch. Allies now remain on automatic focus behavior; pause, briefings, routes, foundry copy, summaries, debug budgets, and the public `T` fixture consume read-only crew status. Crew remains run-local, so save schema v5 is unchanged.

### Run timeline and Scenario Lab

- `src/game/RunTimeline.ts` folds compact idempotent node/stage, branch, economy, engineering, faction/rival/crew, boss, duration, and run-end events. It retains 96 display entries and 192 processed ids, calculates elapsed time only from explicit simulation/result durations, formats summaries/debug rows after the fold, and remains a run-session field rather than save data or telemetry.
- `src/game/ScenarioLab.ts` owns eight declarative debug definitions and the public setup function. Each call creates a fresh seeded `RunSession`, applies named faction/crew/foundry fixtures, and advances stages with exported mission/session events. The UI receives a compact setup read model and never reaches through `GameApp` private fields.
- `ScenarioLabScene` routes launches into the production transition, gameplay, and foundry scenes. The combined gameplay preset composes existing enemy-rich/environment stress helpers with the generated set-piece, three-ally crew fixture, engineering/faction state, and 23-item hook loadout; normal entity/proc/geometry caps remain authoritative.
- The lab is available only when `?debug=1` is active, creates no external requests, and discards each fixture when another scenario or menu route is selected. Explicitly remapped gameplay controls suppress colliding debug shortcuts.

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

## Phase 11 architecture priorities

Phase 10 closed without a severe correctness blocker, but repository scale is now an architectural constraint: `CombatState.ts` is about 4,000 lines, `contentValidation.ts` about 3,000, `CanvasRenderer.ts` about 2,000, `GameApp.ts` about 1,800, and `GameplayScene.ts` about 1,700. The production main bundle is 657.78 kB minified (177.71 kB gzip). These are not reasons for speculative rewrites; they are reasons to establish seams before another phase-sized feature set.

### Resumable run boundary

- Permanent progression save and resumable run snapshot must be separate versioned records with independent corruption recovery.
- The snapshot owns stable generated-plan identity, explicit decisions, current checkpoints, compact run-local domain state, and bounded histories. It must not store canvas/DOM/audio state, derived render models, callbacks, or mutable content copies.
- Resume regenerates immutable plans from seed plus save fingerprint, validates their identity, folds decisions/checkpoints, and rejects incompatible state before entering a scene.
- Snapshot writes occur at explicit safe boundaries such as staging, branch commit, mission checkpoint, foundry commit, carrier commit, and pause—not every simulation frame.

### Expedition coordinator

- A coordinator should translate generated itinerary nodes into mission, boarding, carrier, faction-front, crew-arc, fleet, and apex domain commands.
- Domain reducers emit typed results and public read models. They do not import `GameApp`, scenes, canvas, Web Audio, storage, or browser globals.
- `GameApp` remains the composition root, but phase logic belongs in coordinators/services rather than additional private scene-routing blocks.
- `GameplayScene` adapts input/render/UI to a combat session; it should not become authoritative campaign state.

### Combat and renderer seams

- Extract cohesive combat domains only when behavior and tests move together: actor spawning, projectile resolution, ally/fleet commands, set-piece interaction, pickups/economy, objective accounting, and debug fixtures are candidate seams.
- Keep one central accounting contract for damage, defeat, escape, objective credit, rewards, and item/module hooks even if implementation moves to smaller modules.
- Renderer extraction should follow stable draw-model boundaries (background, actors, projectiles, set pieces, feedback, previews) without duplicating gameplay transforms.
- No refactor may change seeded generation streams, fixed-step ordering, fixed 640x720 collision geometry, or existing debug shortcut behavior without an explicit migration/test reason.

### Replay and endurance harness

- The harness consumes public generated plans, snapshots, coordinators, and typed domain events. Browser tests must not gain private-object access.
- It should fast-forward decisions and safe transitions, not fake derived state or bypass reducers.
- Every long-run fixture reports actor/projectile/effect/hook/history counts at boundaries so cleanup regressions are attributable.
- Restore/replay equality is required for generated content and decision outcomes, not bit-perfect bullet positions across browsers.

### Loading and bundle strategy

- Measure module/chunk output before and after changes. Do not raise `chunkSizeWarningLimit` to declare success.
- Debug-only Scenario Lab, archive, large summary/history, carrier, and other low-frequency DOM surfaces are candidates for dynamic import once scene switching supports asynchronous factories safely.
- Core combat must remain immediately playable after the static site loads; avoid fragmented micro-chunks that increase request overhead without meaningful byte or startup improvement.
- `npm run test:preview` is the authoritative local check for the GitHub Pages base and emitted hashed asset paths.

### Phase 11 state flow

```text
seed + permanent save fingerprint
  -> immutable campaign plan
  -> versioned resumable snapshot + decision log
  -> expedition coordinator
      -> mission / boarding / carrier / front / crew / fleet / apex reducers
      -> existing combat-session adapter
  -> public read models
      -> gameplay and DOM scenes
      -> replay/endurance/Scenario Lab
      -> summary + local snapshot/save writers
```

### Work order 101 implementation

- `src/game/RunSnapshot.ts` is the first resumable-run boundary. Snapshot v1 is a JSON-only envelope capped at 512 KiB with seed, generation fingerprint, graph id, contract id, stored unlock/upgrade generation context, safe resume target, full `RunSessionState`, and reserved null extension slots. Permanent save v5 remains independent.
- Restore regenerates `RunSkeleton` rather than storing content copies, then verifies generation fingerprint, graph, contract, current sector/mission schedule/stage/status, expedition nodes/decisions, committed engineering legality, item references, nonnegative economy/distance, faction/rival and crew plan identity, bounded processed/history ids, and timeline caps. A failure clears only `starbreak.run.v1`.
- `RunSnapshotCoordinator` is the storage/orchestration adapter consumed by `GameApp`. Automatic writes happen only at briefing and operation-entry boundaries; manual pause suspend writes the already-suspended mission state. Active combat entities are intentionally absent, so resume restarts the current operation from its mission checkpoint rather than pretending to preserve bullet positions.
- `src/game/ExpeditionEndurance.ts` consumes generated runs, declarative Scenario Lab setups, snapshot create/export/restore, and the final-sector mission checkpoint without browser or private app state. Every round trip reports snapshot size and bounded engineering/faction/crew/timeline/item/set-piece state, making boundary accumulation testable before Phase 11 adds domains.
- Main-menu and pause scenes remain presentation-only: they receive a snapshot summary and callbacks, while regeneration, validation, storage, and repair live outside the DOM. Explicitly focused main-menu buttons now own keyboard confirm, preserving native resume/discard/settings/archive intent.
- Scenario Lab, Scenario Timeline, and declarative Scenario setup are loaded through dynamic `import()`. The build emits 1.52 kB, 2.89 kB, and 5.39 kB minified lazy chunks. The initial bundle is 663.24 kB minified/179.38 kB gzip after adding core snapshot support, up 5.46 kB from work order 100; warning thresholds remain unchanged.

### Work order 102 implementation

- Expedition graph schema v2 makes each ten-sector plan executable as `ingress -> advance -> detour? -> staging -> gate -> pursuit? -> extraction`. Every sector owns exactly one node for each role, two branch records, five required nodes, two optional nodes, coarse operational intel, and stable content references. The default path has two combat operations; independent decisions can add detour and pursuit operations.
- Mission schedule v2 is a generic guarded stage graph rather than a fixed primary/optional block. Stage definitions name their operational role, next stage, and branch id; schedule read models expose all operation, branch, and relief ids while retaining first-stage compatibility fields. Partial success can bypass the current optional lane into the next relief checkpoint, and failure still enters the terminal failure path.
- `src/game/OperationalMap.ts` owns the bounded operational settlement reducer, zero-retained-world cleanup record, one-shot optional payout, later-operation influence, validation, and public map read model. Successful detours retain their compatibility gate support; work order 139 redirects successful pursuit pressure from the following sector's retired fresh advance to its real required gate operation. It is not imported by the combat hot loop.
- `src/ui/OperationalMapScene.ts` consumes the graph/session read model and callbacks. Its DOM itinerary and action cards expose approximate time, danger, reward, consequence, and faction/crew/ship risks with native focus, keyboard confirm, pointer activation, narrow wrapping, and non-color status labels.
- Work order 135 removes `OperationalMapScene` from the fresh runtime transition. `GameApp` still advances through the mission reducer's final relief stage, but does so synchronously into extraction route selection; staging relief remains the explicit Command Deck. The scene and `operationalMap` snapshot target remain valid compatibility boundaries for deployed v11 checkpoints, which resume through the same automatic handoff.
- Work order 136 removes `RouteScene` from the fresh runtime graph. `src/game/RouteNavigation.ts` projects a compact source-edge-target/mission/effect read model, while `SectorTransitionScene` renders it as a route mode on each actionable constellation node. Route mutation remains in `GameApp`/`RunSession` against the completed sector. Work order 140 later moves reward settlement ahead of this plot while retaining shop/event/component/advance ordering. The current snapshot boundary reuses the `operationalMap` target for extraction-stage route plots and reconstructs presentation from run/session state.
- Work order 137 removes passive lookahead from `ActConstellation`: base sector nodes are completed, current, or hidden, and untraveled edges remain hidden. `SectorTransitionScene` resolves immutable sector identity only for its post-sector onward node or embedded-route target and promotes only the matching edge to `choice`; later nodes stay anonymous. Active emphasis is a CSS pseudo-ring on `current`/`choice` sector buttons, never a node transform or persisted state. Reduced-motion/performance modes freeze that ring, and no generation, snapshot, or simulation contract changes.
- Work order 138 composes the existing post-sector branch and extraction route inputs in one `SectorTransitionScene` while preserving node ownership: the source detail renders only its optional hold, and the target detail renders only its route commitment. `GameApp.showMissionBranch` separates branch commitment from its presentation handoff: the optional branch enters combat unchanged, while an onward route commits the default branch, completes its relief reducer stage, and calls the established route handler synchronously. After same-act route settlement, `beginCurrentSectorOperation` dispatches the same briefing and entry events previously owned by the second hub's button, then enters gameplay. This removes intermediate inputs without bypassing faction/expedition recording or route outcome, service, mission, and sector-advance ordering. Extraction snapshots and post-optional recovery still reconstruct the ordinary route-only mode.
- Work order 139 makes the fresh mission schedule match that one-node/one-sector presentation. Entry targets the required gate stage directly, and that stage receives the complete `mission_operation` scroll, waves, boss, arena, set-piece, hazard, and objective projection. Every bounded objective outcome records its established settlement before converging on the post-sector branch; the paired pursuit remains structurally selectable even when a secondary carrier, boarding, or faction-front projection cannot decorate it. Advance, approach, detour, and staging definitions retain stable ids in `compatibilityStageIds`, with a separate `stagingStageId` for Scenario Lab and deployed v11 recovery. Fresh operation/relief read models exclude those definitions unless recovery is currently inside one, preventing compatibility topology from inflating player-facing stage counts without invalidating old checkpoints.
- Work order 140 makes the terminal branch of each fresh required gate the reward boundary. `RewardScene` consumes current-sector state plus `RunSession.getIncomingRewardRouteKind` instead of an unchosen `RouteOption`; selection then opens and checkpoints the flat post-sector board. `getRewardModifiersForSector` aligns its mixed index domains explicitly: the current required objective applies now, the prior optional objective and incoming one-based route outcome apply to the current zero-based sector, and no optional combat emits a second reward scene. Route event/shop completion generates its deterministic component and advances directly. Existing `route-*` reward seed suffixes remain stable, while the first sector uses a distinct `reward-sectorClear` stream; no snapshot field or simulation state is added.
- Work order 141 treats an `interActJunction` boundary as extraction rather than a route. `ActPlan.getInterActHandoffAfterSector` derives the handoff from immutable act start/end indexes and transition metadata. At the Act I terminal branch, `GameApp` commits the existing default option and relief before any constellation mount; at a restored extraction stage, `showRouteChoice` applies the same guard. Both converge on `advanceAfterSectorExtraction`, which retains frontier/victory and ordinary route callers but advances Act I directly into the midpoint refit. No synthetic `RouteOption`, outcome/history record, component, reward modifier, RNG stream, or persisted field is introduced.
- Work orders 148 and 153 generalize that guard into `ActPlan.getActBoundaryHandoffAfterSector`: Act I returns a targeted `interActJunction`, Act II returns a targeted `frontierChoice`, and Act III returns a source-only `victory`. Fresh terminal branches and restored extraction checkpoints therefore bypass optional/destination projection uniformly. `advanceAfterSectorExtraction` still owns the actual transition: midpoint refit and frontier choice retain their existing scenes, while exhausting the final sector reaches the existing victory summary without a synthetic route or persisted presentation state.
- Work order 142 keeps constellation suspension on the existing snapshot boundary rather than serializing presentation state. `SectorTransitionScene` receives one optional suspend callback for briefing, post-sector, and route modes; its footer button and non-combat back/pause actions invoke the same seam. `GameApp.suspendAtConstellation` requires `checkpointRun` to succeed before mounting `MainMenuScene`. Briefing and branch projections retain the `sectorTransition` target, while unresolved extraction-stage routes retain `operationalMap`, allowing the resume dispatcher to rebuild the exact pending read model from authoritative run/session state. Snapshot v11, permanent save v5, mission reducers, and route reducers are unchanged.
- Work order 146 makes route effects properties of destination nodes rather than a secondary decision after destination selection. `RouteNavigation.selectNodeRouteEffect` selects from the target sector's existing candidate pool with a target-keyed RNG stream; normalized route risk receives easy/standard/hard difficulty weights, so shared nodes are parent-invariant and suspension/resume requires no stored UI choice. `SectorTransitionScene` exposes the selected effect on the node and in one compact dossier, then passes it through the unchanged branch, relief, route outcome, shop/event, component, and sector-entry pipeline. The authored three-candidate arrays remain internal generation/content inputs and no save, snapshot, or route-outcome schema changes.
- Run snapshot schema/storage v2 adds operational history and a settled `operationalMap` resume target. Restore validates mission branch ids and operational node/cleanup history; a v1 record is removed independently with a clear recovery notice while permanent save v5 remains untouched. Active combat still restarts from its operation-entry checkpoint.
- Boss arenas, reusable set pieces, and finales are projected only into the required gate operation. Advance, detour, and pursuit projections reuse the same sector/combat contracts with bounded scale and clear combat-world disposal between scene instances.
- Work order 114 requires coordinate-owning gate plans to be rebuilt after mission scroll projection. Boss arena locks, releases, approaches, and set-piece anchors must derive from the projected objective and scroll length rather than copying full-sector distances that may sit beyond a shortened operation endpoint.
- Work order 115 keeps `mine_belt` as a deterministic hazard-scheduling envelope but delegates its presentation and damage to schema-backed `proximity_mine` environment objects. `EnvironmentObjectPlacement` materializes bounded 4-6-mine clusters from final conditioned/director hazard windows; `CombatState` owns fixed-step proximity, damage, chain-fuse, detonation, actor damage, and bounded object-chain state; `CanvasRenderer` consumes only the resulting read state. The legacy mine lane rectangle must remain non-damaging and unpainted.
- Work order 116 makes blank title-screen launch requests resolve to a fresh random expedition while preserving explicit `DEFAULT`, known/custom codes, URL-provided seeds, run summaries, and share links. `MainMenuScene` owns only DOM presentation and a cancellable launch handoff; `SeedEntry` remains the normalization/random-resolution boundary, and `GameApp` stores blank input after random launch so returning players do not accidentally replay the prior generated code. The original title illustration remains inline code-native SVG with no external asset or network dependency.
- Graph capacity is now 70 nodes and 20 decisions: 1458 required-route target seconds (24.3 minutes) and 1898 all-optional target seconds (31.6 minutes). The initial bundle is 678.74 kB minified/183.34 kB gzip and CSS is 26.76 kB; the measured warning remains open.

### Work order 103 implementation

- `src/game/NullFrontier.ts` is the deterministic campaign/read-model boundary. Seed plus generation save fingerprint selects one of three campaign grammars, orders five sector laws, records faction and engineering hooks, names the finale gate, and owns the idempotent extraction/breach decision record.
- `ACT_DEFINITIONS` now models Act II's `frontierChoice` separately from the final `victory` transition. The Act II boss remains a finale encounter, but its graph exit carries state; only the Act III Horizon Scar gate is terminal. `FrontierGateScene` is a presentation-only accessible choice surface.
- Five new sector/background records, six Act III route contracts, five mission contracts, five hazard/landmark fits, and three bosses extend existing registries. Frontier laws enter `SectorConditions`; no Act III-specific combat engine or renderer path exists.
- Run sessions and the bounded timeline store the frontier decision. Snapshot schema/storage v3 validates it and retires v1/v2 independently of permanent save v5. Early extraction saves ten cleared sectors; frontier victory saves all fifteen and identifies the generated campaign in finale metadata.
- Graph nodes retain their schema-v2 compatibility topology and 75% duration bands. Work order 139 narrows the executable projection to ingress, one full gate operation, extraction, and the paired pursuit per sector: standard is 1,009 seconds (16.82 minutes), Act II extraction is 665 seconds (11.08 minutes), and all holds project 1,264 seconds (21.07 minutes), with simulation speed and durability unchanged. Advance, detour, and staging nodes remain only for v11 checkpoint/debug compatibility and do not inflate HUD or capacity totals.

### Work order 104 implementation

- `src/content/carriers.ts` defines three carrier hull contracts and seven facility definitions. Each generated run receives one seed/save-fingerprint-stable `CarrierPlan` with four slots, bounded base cargo, replacement order, and liaison faction.
- `src/game/CarrierCommand.ts` owns the plain-data carrier reducer and influence read model. Commands are idempotent, spend explicit run-local resources, allow only one command action per sector, and cap history at 64 entries/128 ids. Transit deterministically folds posture, powered facilities, hull, heat, debt, pursuit, damage, and access without runtime RNG.
- Carrier influence is consumed at existing seams: mission branches can close optional lanes under critical carrier pressure; the foundry stows component manifests and gains facility salvage; rewards consume vault/foundry bias and choice capacity; injured crew can recover early; shops consume liaison access and discounts. Hangar/foundry state exposes bounded support and boarding capacities for later systems rather than instantiating premature parallel engines.
- `CommandDeckScene` appears only at the clean staging relief boundary and is dynamically imported. The scene consumes read models/callbacks, uses native buttons and text status under narrow/contrast/reduced-motion settings, and offers a direct continue path without mandatory upkeep.
- Snapshot schema/storage v4 validates carrier plan identity, facility count, numeric pressure fields, cargo capacity, and history bounds. The carrier remains inside run-local session state and a small carrier extension identity; permanent save v5 is unchanged and v1-v3 snapshots retire safely.

### Work order 105 implementation

- `src/content/boarding.ts` is the six-contract catalog; `src/game/BoardingOperation.ts` is the deterministic plan/state/reducer/read-model boundary. It owns room, door, hazard, loot-custody, translated-loadout, cross-system hook, history-bound, and zero-retained-cleanup contracts without importing the combat hot loop.
- Boarding campaigns are immutable run-generation products. Selected detour/pursuit nodes carry a stable boarding operation reference while expedition schema v2 topology and mission stage sequencing remain unchanged.
- `MissionDirector` projects a boarding operation into a shorter sector, reusing the same fixed-step `GameplayScene`/`CombatState`, engineered weapon and module profile, items/hooks, crew allies, projectiles, collision, objective director, environment objects, hazards, pause, destruction, exit, and operational accounting. `CanvasRenderer.paintBoardingInterior` is presentation only.
- Work order 161 adds `src/game/ConfinedEnvironment.ts` as the deterministic presentation-plan boundary for those boarding projections. Target family and immutable room/door layout derive one bounded capital-hull, station, rock-cut wreck, or abandoned-underdeck plan without per-frame RNG. `GameplayScene` selects that opaque environment before rendering; `CanvasRenderer` consumes it for the full-viewport structural background and the clipped room passage, so ordinary sector star/parallax strata never leak into an enclosed operation. Room marks, panels, conduits, ribs, lamps, collision rails, and bulkheads remain presentation-only and cannot alter combat geometry.
- Work order 167 adds `ConfinedEnvironmentPresentation` between that immutable plan and canvas paint. Repeated decorations are enumerated by stable source/cycle identity using their true visible extents, and ribs use absolute world indices, so wrap seams can render both entering and exiting copies without a screen-slot replacement. Authored rooms project to simultaneous clipped bands at the same world-to-canvas scale as doors; room-kind changes therefore cross the camera spatially instead of mutating the whole passage. The read model is transient, deterministic, and presentation-only.
- `RunSession.recordBoardingOperationOutcome` is the orchestration seam for carrier custody, foundry component acquisition, faction events, rival capture, timeline entries, and forward-compatible crew/apex signals. The reducer is idempotent and caps history at 64 entries/128 ids.
- Snapshot schema/storage v5 adds boarding plan identity plus validated session state, retires v1-v4 independently of permanent save v5, and preserves operation-entry restart semantics. Run summaries and the ninth Scenario Lab fixture consume public read models.

### Work order 106 implementation

- `src/content/factionFronts.ts` owns twelve strategy records: three stances for each faction with node, price, hazard, reinforcement, support, crew, carrier, and ending policies. Text glyphs and labels are semantic non-color cues.
- `src/game/FactionFront.ts` owns immutable sector-front plans and bounded run-local allegiance, influence, sector, processed-id, and history state. Its reducer consumes explicit events only, affects sectors one-to-four positions ahead, is idempotent, and caps display history at 64 entries/128 ids.
- `FactionFrontInfluence` is the shared read model. The expedition graph remains immutable schema v2; `GameApp` and `OperationalMap` project reserve detour/pursuit nodes as created, transformed, or closed at choice time. This changes executable path availability without rewriting saved graph identity.
- `getFactionCampaignInfluence` composes front ownership with existing ledger/rival state. Combat, sector conditions, shops, routes, transitions, crew recruitment, carrier access, set-piece ownership, finale pressure, summaries, and run-record ending names consume that composed model. Reinforcement clones are bounded, do not count for required objectives, and retain existing actor/projectile budgets.
- `RunSession` is the event-orchestration seam for faction, route, boarding, crew, and carrier sources. Snapshot schema/storage v6 validates front plan/state/history and retires v1-v5 independently of permanent save v5. The tenth Scenario Lab fixture and endurance harness use public front setup/debug models.

### Work order 107 implementation

- `src/content/crewArcs.ts` is the ten-arc catalog. Every definition has a theme, three explicit source gates, two authored choices, relationship/trust deltas, a campaign outcome, a named tactical pairing, and player-readable risk copy.
- `src/game/CrewArc.ts` owns immutable seed/save-stable plans plus the bounded arc reducer, choice reducer, pair/rank/fate/succession state, combat influence adapter, accessible read models, validation, summaries, and debug fixture. It imports no DOM, canvas, audio, or app state.
- The existing `CrewCommand` roster remains authoritative for recruitment, availability, injury, recovery, trust, and deployment. `RunSession` translates newly resolved arc outcomes into one roster event, preventing a second crew lifecycle. Departed or mutinied crew leave the wing; other choices apply authored trust changes.
- Combat receives a precomputed influence map when the existing crew profile is built. Promotions trade one command slot for hull or damage, bonds trade one hull for paired cadence, and hardened conflict excludes one partner. Existing three-ally and shared projectile/query budgets remain unchanged.
- `CrewQuartersScene` is a lazy presentation boundary reached from briefings. It consumes roster and arc read models, uses native buttons and semantic text, and owns no mutations beyond callbacks. Snapshot schema/storage v7 validates arc identity/state and retires v1-v6; summaries, timeline, Scenario Lab, and endurance consume the same public state.

### Work order 108 implementation

- `src/content/supportCraft.ts` owns six support-role records with construction/repair costs, combat envelopes, default command/doctrine, itinerary use, and non-color cues. `src/game/Fleetcraft.ts` owns immutable seed/save-stable identities plus bounded construction, assignment, doctrine, refit, combat settlement, loss/recovery, influence, validation, summary, and debug state.
- `RunSession.applyFleetCommand` is the resource/orchestration seam. It consumes uninstalled engineering components and matching carrier manifests, spends run salvage, enforces hangar/foundry and mutually exclusive crew-post constraints, emits timeline/front events, and translates build/refit/command/injury consequences into existing crew arcs and roster events.
- `CombatState` still owns one `AllyState[]`. Fleet profiles are appended after crew profiles and defensively sliced to four combined allies; both sources obey the existing five commands, bounded queries, projectile/collision/damage/objective/reward paths, and one 20-shot ally ceiling. Result projection separates crew candidates from craft ids so their authoritative reducers settle independently.
- Fleet influence is a plain read model consumed by boarding access/rewards, optional-operation salvage, pursuit control, carrier transit protection, recovery costs, faction fronts, summaries, debug, and future apex consumers. Damaged or lost craft provide no influence until repaired.
- `FleetBayScene` is lazy, presentation-only, and reachable from briefings and command-deck staging. Snapshot schema/storage v8 validates fleet identity/state and retires v1-v7; the twelfth Scenario Lab fixture and endurance harness consume public setup/debug models.

### Apex campaign boundary

- `content/apexThreats.ts` owns three original threat identities, pursuit structures, supported dispositions, subsystem vocabulary, and variety-unlock rewards; `content/bosses.ts` owns their bounded three-phase combat definitions.
- `game/ApexHunt.ts` owns immutable four-contact plans, bounded idempotent campaign state, encounter/sabotage/escape/resolution events, finale projections, validation, summaries, and debug fixtures. It is the only module that converts voyage history into boss hull, escort, hazard, escape-risk, and ending-option values.
- `GameplayScene` receives a precomputed encounter/profile and reuses the central wave objective, boss actor, arena, projectile/effect, collision, feedback, and reward paths. It does not mutate apex campaign state; `GameApp` settles public reducer events at operation boundaries and pauses a neutralized finale for an explicit lazy `ApexDossierScene` disposition.
- Snapshot schema/storage v9 validates apex plan/state and retires v1-v8. Permanent save v5 receives only validated music, practice, or challenge unlock ids after a run summary; those flags are excluded from run-generation fingerprints because they do not alter generated voyage content.

### Phase 11 release-audit boundary

- `src/game/VoyageReleaseAudit.ts` is a pure read-model fold over explicitly supplied fresh and progressed `RunSkeleton` values. It measures extraction, standard, and completionist node-duration projections without storage, browser state, telemetry, runtime RNG, or combat simulation and always carries an authored-projection caveat.
- `ScenarioLab` now owns sixteen declarative fixtures and validates exact coverage for snapshot, multi-operation, frontier, carrier, boarding, faction-front, crew-arc, fleetcraft, and apex systems. The snapshot card uses the production v9 create/export/restore functions; carrier and frontier cards enter existing presentation seams rather than duplicating reducers.
- `ExpeditionEndurance.runFrontierResumeAudit` restores one production snapshot into both frontier decisions. Browser smoke separately proves the presentation/orchestration path from suspended combat through settled-map restore to extraction victory and snapshot cleanup.
- `VoyageReleaseAuditScene` and its calculation module are lazy debug-only chunks. They add no production gameplay responsibility to the fixed-step loop. Phase 11 closes with `GameApp`, `GameplayScene`, `CombatState`, snapshot validation, summary content, and content validation still named as next-phase extraction targets rather than silently increasing the Vite warning threshold.

### Work order 117 sector-departure boundary

- `src/game/SectorExitSequence.ts` is a pure, elapsed-time presentation read model. It owns ignition, boost, camera-clear, and transition phases plus the departing ship pose and accessibility announcement; it does not mutate combat, scroll, route, reward, or run state.
- `GameplayScene` freezes the already-settled sector camera, supplies the live player's position and contract appearance, fades the persistent HUD, and continues using the established route, boarding, cooldown, debug, and final-victory handoff callbacks when the bounded sequence completes.
- `CanvasRenderer` paints the existing contract-specific player ship at the read-model pose, scales its existing exhaust, adds at most a small fixed set of speed streaks, and closes a restrained dark aperture only after the ship approaches camera clear. The former beacon/corridor metaphor and visible percentage overlay are removed; phase copy remains screen-reader-only and percentage state remains debug-only.
- Reduced motion shortens the same semantic sequence, disables speed streaks, and caps exhaust scale without bypassing the ship departure or changing handoff results. No seed, combat, save, snapshot, or content schema changes are involved.

### Work order 118 boss-gate schedule invariant

- Mission projection, route conditions, sector pacing, faction fronts, rivals, and apex influence all contribute before `GameplayScene` finalizes a combat spawn schedule. The live boss-arena lock is therefore the authoritative upper distance bound for that final assembled schedule, not an earlier generated or mission-projected length.
- `WaveDirector.fitSpawnScheduleBeforeBossLock` performs one bounded reverse pass over the assembled schedule. Distance-gated entries preserve ordering and at least 12 units of separation where space permits, with the final arrival no later than 96 units before the live lock; time-gated entries remain unchanged.
- This is a schedule normalization only. It does not mark targets defeated, clear the field, bypass objective accounting, alter enemy composition, or change boss state. The normal fixed-step spawn, combat, support-clear, and boss-request paths remain authoritative.

### Work order 119 run-wide hazard sequence identity

- `HazardZoneDirector` receives a stable operation key plus a numeric sequence ordinal derived from global sector index and operational role. Advance, detour, gate, and pursuit therefore occupy distinct slots, including optional and boarding projections; restarting the same operation deliberately reproduces its sequence.
- Authored sector hazards are resequenced alongside director additions. Run seed, permanent-save fingerprint, operation key, and entry index select hazard-family permutations, while explicit condition/route hazard kinds remain intact. Both sources consume the same operation-specific lane function before the final feature plan is built.
- The lane function is a run-seeded permutation over 641 positions from 0.180 through 0.820. The current fifteen-sector graph uses at most 120 sector/role ordinals and 60 combat-role ordinals, so the first hazard lane makes every current operation sequence collision-free without a mutable run registry or snapshot field.
- Sequence selection occurs once during `GameplayScene` plan construction. Fixed-step activation, pause-safe runtime progression, collision, mine materialization, boss deferral, recovery-coast allowlists, and rendering continue to consume the resulting ordinary `SectorFeaturePlan`.

### Work order 120 directional beam boundary

- `src/game/BeamHazard.ts` owns seeded source/target edge selection, offset geometry, distant world-vector projection, arena clipping, finite bolt slicing, exact circle-to-capsule overlap, bounded world-damage sampling, and accessible direction copy. Renderer and collision consumers receive the same clipped track/bolt functions; neither reconstructs an independent line.
- `HazardZoneDirector` materializes beam geometry only after work order 119 finalizes the operation sequence and hazard family. The geometry key includes run seed, save fingerprint, stage identity, sequence ordinal, hazard id, and entry index, so the same operation repeats exactly while other operations vary direction and offsets.
- `getActiveSectorHazards` exposes actual `worldDistance` when the runtime hazard distance diverges from scroll, plus transient `elapsedSeconds` for timed beams. Distant source/target positions translate with actual sector scroll and therefore stay stationary during a scroll hold; the Liang-Barsky projection returns entrance/exit intersections on the true 0-to-width/height canvas boundary rather than the player-movement padding.
- `SectorHazardRuntime` starts one transient beam clock when the distance telegraph reaches active phase. Both endpoint transitions use a shared 960-unit/second linear velocity around an exact two-second fully-lit dwell; the clock is normalized back into the existing distance window so activation consumers remain compatible while scroll speed and pauses cannot alter beam timing.
- `SectorHazards` uses only the canvas-clipped luminous segment for player, enemy, boss, and ally circles. At most 24 continuous expanded beam boxes reuse existing environment/set-piece hazard damage paths; offscreen portions produce no sample, and all visible samples pierce rather than terminate on contact.
- `CombatState.damageCombatActorsByHazard` centralizes allegiance-neutral enemy, boss, and ally damage/defeat handling. A transient per-hazard/per-actor cooldown map advances in fixed time and is discarded with combat state; it is not generated content or snapshot data.
- `CanvasRenderer` gives warning and active phases dedicated presentation: source aperture/arrow, endpoint reticle, dashed world guide, perpendicular tracking marks, moving outer-energy body, bright core, leading flare, and optional glow. Entrance and exit centers lie on canvas boundaries so round caps render as continuous offscreen crossings. The beam ignites, holds fully lit, then clears; reduced motion lowers marker count, performance mode removes glow/markers, and high contrast retains a white core without changing geometry or damage.

### Work order 121 camera line-of-sight boundary

- `GameplayScene.render` preserves a three-part composition: passive environment first, transformed gameplay second, and arena-frame chrome last. Open flight consumes the generated sector background; boarding consumes its opaque confined-environment plan. Both remain full viewport without being admitted to the combat camera layer.
- `CanvasRenderer.beginGameplayLayer` clips to `ViewportLayout.gameplaySafeFrame` in unshaken viewport coordinates, then translates and scales the fixed 640x720 world. Every gameplay renderer shares that single clip, including shapes whose radii or sprites straddle the world boundary; `endGameplayLayer` restores it before frame chrome.
- The clip is presentation-only. Simulation, collision, pointer conversion, player movement, world anchors, TTL, and offscreen cleanup continue in combat coordinates. Screen shake moves the world beneath the fixed camera aperture rather than moving the aperture itself.
- `CombatBounds.enemyProjectileBoundary` is an explicit physical-policy seam. Open flight is the default and applies no enemy-projectile clamp; boarding supplies `sideWalls` and retains horizontal containment at its authored 60-unit rails.

### Work order 122 terminal departure handoff invariant

- `exitSequenceResult` is the one-shot callback latch, while `exitSequence` remains the render owner from ignition through scene replacement. Finishing clears the former but retains the latter at terminal elapsed time.
- If scene replacement is delayed by one or more frames, `GameplayScene.update` remains inside the exit guard and `render` continues using progress-100% departure coordinates instead of falling back to `CombatState.player`.
- Normal, victory, and debug-forced completion share the same terminalization path. The retained state is transient scene memory and does not enter run generation, suspended snapshots, or permanent saves.

### Work order 123 hardpoint-control presentation boundary

- `src/ui/FoundryPresentation.ts` is a pure screen read-model seam over committed and draft `EngineeringState`. It resolves both snapshots once per screen entry and derives normalized resource meters, primary-weapon volley/impact/cadence/velocity/heat stats, active engineering traits, and component replacement deltas without mutating the draft or duplicating foundry legality.
- `FoundryScene` remains an event-driven DOM scene. Its attack simulation reuses `ShipPreview` with draft frame, module count, weapon name, and weapon-pattern overrides; the same existing engineering operations still own install, remove, scrap, reroute, overclock, fusion, undo, and commit behavior.
- Visual meters, glyph stat strips, badges, and direct install comparisons are progressive presentation. Full values and relationships remain exposed through native meter semantics, labels, button accessible names, modifier titles, validation issues, and live status updates.
- The read models are built only on foundry entry and after explicit actions. They add no gameplay-frame work, runtime RNG, generated content, production dependency, save field, or snapshot migration.

### Work order 125 viewport-wide pointer-control boundary

- `InputSystem` remains the only raw pointer-event consumer. Non-UI pointer movement anywhere in the browser viewport stays active; menus, settings, native controls, pointer cancellation, and window blur still clear or ignore pointer state through the existing abstraction.
- `viewportPointToCombatPoint` preserves raw `insideFrame` telemetry while clamping presentation coordinates to the fixed 640x720 arena. Outside positions therefore resolve to the nearest perimeter point instead of introducing viewport-scaled simulation coordinates.
- `getPointerGuidanceAxis` continues aiming at that projected point, keyboard movement retains priority, and `CombatState` remains the final radius-aware movement clamp. Once the ship reaches one axis bound, the remaining guidance component naturally slides it along the arena edge.
- No generated content, RNG stream, combat bounds, save/snapshot schema, renderer clip, or input setting changes.

### Work order 126 operation-objective projection invariant

- Authored mission objectives describe the complete contract, but each executable operation may expose only a subset of that world. `MissionDirector` must project the objective plan after it projects the sector so required clauses cannot reference a boss, arena, set piece, environment target, or other actor absent from that operation.
- `ObjectiveDirector.projectMissionObjectivePlan` currently enforces the boss boundary: if the projected sector is not boss-required, it removes `bossDefeats` clauses, converts boss-gate cleanup to ordinary field cleanup, and supplies support-approach copy while preserving contract/objective identity, consequence policy, and available clause ids.
- The required gate still receives the authored boss clause because its projected sector owns the arena and set piece. Non-gate advance operations can settle at their combat endpoint and enter the existing recovery coast without spawning, clearing, crediting, or bypassing a boss.
- Projection occurs once at mission combat setup. It adds no fixed-step work, RNG, actor, content fingerprint, save field, snapshot field, or migration.

### Work order 127 ally set-piece targeting invariant

- `CombatState` retains one shared ally actor/projectile path for crew and fleet support. A ready focus-fire ally first scans the single bounded active set-piece assembly for the nearest component that is both dependency-targetable and at least partially inside the combat camera, then falls back to its existing bounded enemy scan and boss target.
- Ally projectiles and player projectiles use the same set-piece collision/damage adapter. `SetPiece.damageSetPieceComponent` remains authoritative for dependency locks, allowed damage sources, armor, destruction, stage advancement, and completion; `applySetPieceRuntimeEvents` remains authoritative for rewards, effects, and objective/environment accounting.
- Hidden or off-camera components cannot attract ally fire. Locked components are not acquired, and destroyed components leave the active set, so the same deterministic component order naturally advances emitters, armor, drives, cores, and other exposed subsystems without a parallel objective AI.
- Existing four-ally and 20-shot ceilings, enemy scan limit, projectile speed/cadence, formation commands, RNG streams, saves, snapshots, rendering, and content fingerprints are unchanged.

### Work order 128 hardpoint live-fire presentation boundary

- `src/game/WeaponProjectiles.ts` is the pure base-volley authority shared by combat and Hardpoint Control. Single, dual, spread, split, missile, and beam projectile offsets, lateral/forward velocity, damage, radius, TTL, tags, and source identity are no longer duplicated in the preview layer.
- `FoundryPresentation` resolves the draft once, creates the production base volley, then applies the draft's ordered module and read-only owned-item `onFire` and per-projectile `onProjectileSpawn` hooks under the same proc budget as combat. It evaluates sequential volley indices across its bounded six-wave sample so periodic procs remain visible. Hardpoint Control therefore previews the current run build, including topology, convergence, heat, proc routing, and legitimate item-shaped projectiles, without mutating item or combat state.
- Starting item loadouts are one deterministic roll from the shared nine-item `starterCore` profile, filtered by unlock access and strongly weighted by the contract's identity plus its actual weapon tags. The core roster bridges existing starter/combat/vault provenance without relabeling items, gives every candidate a different family icon and frequent live hook, and leaves two of the contract primary weapon's three universal conduits open. It is deliberately shared rather than split into class-exclusive lists: class affinity is common, cross-class ignition starts remain possible, and normal reward exclusion removes only the one item actually issued.
- The DOM view receives a bounded pure flight model: at most 12 distinct projectiles per volley, six cadence copies, and 48 rendered projectile nodes. Work order 151 projects that model through a fixed 640-by-260 logical camera: horizontal offsets use the combat arena width, shot diameter uses production collision radius, and an animation cycle cannot be shorter than the camera-crossing time. Longer representative cadence cycles retain real velocity beyond the clipped camera, while actor-budget truncation cannot strand forward shots mid-pane.
- `FoundryScene` derives the combat-mode ship frame from the selected contract's real hit radius and supplies normalized launch, rest, performance, and terminal positions. A fixed preview aspect ratio lets CSS scale ship, shot size, lane spacing, spread, and travel together across narrow and desktop widths without a resize observer, scene timer, combat actor, canvas pass, or RNG stream.
- `src/ui/AttackSimulationPreview.ts` owns the shared normalized DOM projection for that camera. `FoundryScene` supplies its current reversible engineering draft; `ContractSelectScene` supplies a read-only candidate model from `ContractSelectionPresentation`. The latter runs the ordinary seeded starter-core generator, circuit auto-fit, active-item projection, and foundry dashboard for every generated contract, so pre-launch ignition names and firing cycles are predictions of launch state rather than a parallel approximation. Candidate evaluation is pure and does not advance RNG, alter the run, or create gameplay actors.
- `src/game/PhaseProjectile.ts` owns a pure 0.48-second phase-interference presentation cycle derived only from visual age, radius, and velocity. `CombatState` ages every `phase`-tagged shot so Canvas and DOM previews can share coherent/splitting/translated/rejoining timing, but the powered displacement branch remains missile-only: phase alone changes no travel, damage, collision, TTL, cadence, or proc semantics. `CanvasRenderer` composes the read model as a directional shard, displaced echoes, broken wake, and aperture, while `AttackSimulationPreview` classifies `phase` and `phaseMissile` from production tags and renders the same bounded identity without another actor or RNG stream.
- Work order 163 makes that tag a one-use runtime traversal charge at the shared collision boundary. Normal target-specific damage runs before `resolveProjectileImpact`; phase shots then lose only `phase`, retain a namespaced penetrated-target key, and emit one capped collapse effect, while ordinary/spent shots enter the existing removal set. Collision scans skip only the recorded collider, preventing repeated fixed-step damage inside a large target without granting general invulnerability. The rule composes with player, ally, hostile, missile, ricochet, set-piece, and environment paths; adds no RNG or save field; and keeps the target-specific armor, targetability, kill, reward, and hook reducers authoritative.
- Work order 164 removes the Evolution/fusion operation surface from `FoundryScene` without deleting the foundry-domain recipe table, validation, pure fusion reducers, component ancestry, or deterministic signature support. Hardpoint Control no longer imports or calls `getFusionOptions`/`planFuseComponents`; existing evolved hardware can still present its authored ancestry badge. This keeps the rollback local to menu composition and requires no content, save, snapshot, or RNG migration.
- Work order 165 similarly removes per-component reroute and overclock entry points from `FoundryScene`. Installed cards retain Remove, while cargo retains compatible Install comparisons and Scrap; the scene no longer imports or calls either tuning planner. `routingMode` and `overclockLevel` remain in foundry snapshots, signatures, resource/effect resolution, action history, and pure reducers solely as a backward-compatible historical boundary. Fresh components still originate as `balanced`/`0`, so no migration, normalization pass, content fingerprint change, or RNG draw is introduced.
- Work order 166 replaces that temporary card-action layout with two projections owned by the same `FoundryScene` instance. Hardpoint Control enumerates snapshot components at each compatible mount and dispatches select changes through `planInstallComponent`/`planRemoveComponent`; Cargo Management renders only `getCargoComponents` plus `planScrapComponent`. Switching the presentation mode does not call `GameApp`, clone engineering state, reconcile against committed state, or cross the existing undo/commit callback. Item-socket reconciliation still runs once per event-driven redraw against the current draft; after work order 190 only a primary-weapon replacement can change capacity and rack later stages, without creating a parallel cargo or circuit lifecycle.
- The combat-mode `ShipPreview` omits its card background, role bars, hit ring, and abstract weapon-guide primitives. Reduced motion freezes the bounded volley along its real trajectories; performance mode freezes one representative volley and removes projectile/ship glow. High contrast adds white cores and dark outlines.
- Engineering mutations still rebuild the whole event-driven foundry scene from draft state. Apart from the intentional starter-acquisition policy correction above, no content table, gameplay state, hook order, projectile cap, save/snapshot schema, input, or commit boundary changes.

### Work order 129 seeded set-piece layout boundary

- Set-piece component records own stable subsystem identity, template, dependency, objective, and stage semantics. Separate layout records own only component coordinates, safe-lane identity, and reinforcement positions, allowing geometry to vary without cloning damage graphs or rewards.
- `Generation` selects one authored layout through the sector's named `set-piece-layout` fork. `SetPiecePlan` carries the resulting layout id/label and composed geometry policy; shortened terminal mission projections reuse that explicit id while rebuilding only scroll and arena coordinates.
- Content validation treats forward-fire reachability as an authored-layout invariant. For each objective, it recursively removes only dependencies guaranteed destroyed before unlock, keeps every unrelated locked or optional component as a blocker, reserves arena-edge clearance for the largest current player hull, expands collision by the largest current weapon projectile radius, and requires a useful vertical shot interval to remain.
- Runtime state resolves one seven- or eight-entry placement map when combat is created. Collision, player pushout, ally focus, subsystem fire, rendering, rewards, stage progression, boss locks, and objective accounting continue consuming the same component state and fixed 640x720 transform; no per-frame reachability search or adaptive geometry is introduced.
- Work order 168 separates the authored world anchor from the camera's engagement stop. Incomplete assemblies halt travel 80 units before the anchor, translating every component upward as one immutable arrangement; content validation reserves a conservative 150-unit lower recovery band after a 16-unit fixed-step overshoot allowance and rejects top clipping at that transform. Completion releases only this early stop, so finale travel can continue to the unchanged boss lock and all component coordinates, reinforcement distances, damage graphs, rewards, RNG streams, and persisted generation remain authoritative.
- HUD, debug, and deterministic run summaries expose the chosen layout label and layout-specific safe lane. Layout selection adds no save or snapshot field because immutable run generation reconstructs it from the existing seed and named stream.

### Work order 130 boss-spawn request acknowledgement invariant

- `GameplayScene` evaluates boss-arena state before choosing scroll speed and again after scroll advancement. Arena outputs must therefore be safe to observe more than once before their side effect is applied; an edge-triggered request cannot be consumed merely by reading it.
- While distance is locked, support is resolved, and `CombatState.bossSpawned` is false, `BossArena.updateBossArenaState` reports `shouldSpawnBoss` on every poll. `bossSpawnRequested` remains historical state for distinguishing a legitimate request from the existing external/debug bypass, but it no longer suppresses delivery.
- `spawnBoss` is the acknowledgement boundary: it creates the actor and sets `bossSpawned` before the next arena poll, which deasserts the request and prevents duplicate actors. Boss defeat and external debug bypass retain their existing release rules.
- Rescue `travelRatio` and other route clauses may remain incomplete at arena lock; they are presentation/outcome progress completed after boss defeat when travel resumes. They do not replace support-field readiness or authorize target clearing, forced credit, or premature release.

### Work order 131 apex evidence and presentation boundary

- `ApexThreatDefinition` remains the data authority for each threat's structure, subsystem identity, four contact cues, supported outcomes, and variety unlock. The run plan still contains twelve immutable seed/save-stable encounter records, while `ApexHuntState` retains its existing bounded persisted shape and snapshot-v9 validation.
- `ApexHunt` derives three player-facing layers without mutating state: a campaign/threat/contact read model, an encounter presentation used once by `GameplayScene`, and a finale profile containing pressure plus scored disposition requirements. Debug telemetry alone retains compressed reducer codes; DOM scenes consume structured labels, values, details, tones, and source lists.
- A requirement is an explicit `current/target` check with named additive sources and a missing-value readout. Hunt results are first-class sources alongside expedition systems: trace intelligence supports bargains, lieutenant codes and exposed cores support capture, breached armor supports containment, and disrupted propulsion supports evacuation. Availability is the conjunction of visible checks, never a separate hidden predicate.
- `GameplayScene` derives one immutable contact presentation at construction. Its banner and HUD reuse that record, and its marked contact formations clone at most the existing three apex escorts, apply a deterministic stage variant, and reuse normal spawn, collision, objective, projectile, effect, and reward paths. Non-finale contacts count for field resolution; finales retain the centralized single-boss arena.
- `ApexDossierScene` remains a lazy chunk. It may switch among three static threat projections and rebuild bounded DOM, but it owns no run mutation except forwarding a ready finale outcome to `GameApp`; locked resolution cards use `aria-disabled` while remaining focusable so their exact deficit stays keyboard and screen-reader inspectable.

### Work orders 132, 145, 159, 160, 169, 170, 177, 179, 180, 181, 183, 185, 188, 189, and 190 item circuit boundary

- `ComponentCircuit.ts` projects the bounded conduit pool exclusively from the installed primary weapon. Contract primaries provide three slots; recovered Act I primaries start at two, Act II and later primaries start at three, standard through relic quality add zero through three, and capacity is capped at six. `ItemSockets.ts` remains the authority between owned inventory and active mechanics: it maps assignments into that pool, reconciles routes, and projects the ordered active `ItemInstance[]` consumed everywhere else. Alternating weapon/flex channel labels remain derived affinity metadata, not fitting gates.
- Acquisition order remains ownership identity. `ItemSocketAssignment.componentId/socketIndex` is internal physical routing, while `circuitOrder` is an explicit independent processing order. Every upgrade can occupy every installed conduit; append allocates the first open conduit and places the item at the tail, earlier/later operations swap only logical order, and eject preserves ownership in the inactive rack.
- Reconciliation first preserves a fully valid stored physical route. If engineering removes or replaces a source, a deterministic bounded match reroutes live items across the remaining universal conduits in circuit order. Deliberately racked items stay racked, and a later item is dropped only when installed capacity cannot power the full chain.
- Consumers do not infer fitting independently. `GameApp` supplies the active projection to gameplay; `RunSession`, `SectorRewards`, and `ShopScene` do the same for noncombat hooks; `FoundryPresentation` previews the current draft projection and derives cumulative representative-volley output after every ordered item prefix.
- Periodic volley cadence is authored once in `ItemHooks`. Prototype Vent Script is an order-sensitive passive: only periodic `onFire` stages earlier in `circuitOrder` resolve at `base + 1`. `HeatShot` defines a 32%-of-overheat-capacity request and bounded visual read model; the fire payload carries the pre-volley reserve, cumulative spend, and immutable outcome events so each completed shifted stage either appends one heavy `heat`/`plasma` projectile or records an underfunded exhaust without double-spending. `CombatState` settles cumulative spend before ordinary per-shot heat and projects skipped outcomes into the capped effect pool. Hardpoint presentation queries the same cadence profile rather than parsing item copy or duplicating timing rules, and its bounded attack simulation applies production cooling, per-shot heat, engineering multipliers, Heat Sink modifiers, and ordered hooks across real consecutive volley indices.
- Hardpoint Control owns a reversible circuit draft beside the engineering draft. The UI exposes one numbered primary-weapon rail and a simple rack instead of component-local placement selectors. Installed and cargo primary weapons alone project circuit capacity as the sixth `S` stat beside power, heat, mass, command, and instability; every non-primary card uses the five ordinary engineering stats, and cargo scrap value remains on its action. Grid Envelope reports live stages over `Weapon circuit` capacity, while one extension chip names the mounted primary weapon's contribution. Item badges describe effect domains rather than eligibility, and the attack simulation recomputes from the same ordered live list after every edit.
- Snapshot v12 retains the existing assignment shape and validates acquisition identity, socket shape, component existence, exclusive physical occupancy, capacity, and unambiguous explicit order through exact reconciliation. Retired type restrictions are not reintroduced while loading old assignments. Permanent save records still retain only completed-run owned item ids, so routing remains run-local build state.
- Work order 177 adds Boreline Crimper as a pure ordered `onFire` transform. It rewrites only off-axis projectiles present when its hook executes, so a preceding topology stage exposes more branches to compression while a later topology stage remains untouched. Combat, Contract Select, and Hardpoint Control inherit that difference from the existing shared hook pipeline; the item introduces no projectile, timer, state field, or preview-only rule.
- Coupon Cascade Fuse moves from that run-local circuit into `RunUpgradeEffects.shopCouponCascade`. `Shops.generateShopInventory` is the single compatibility boundary: the permanent flag authors the same `-1 price` and `credit` bias as the old hook unless a restored active item copy is present, in which case the legacy reducer alone applies. The upgrade is omitted from the expedition-wide save fingerprint and passed directly to seeded shop generation, preventing unrelated route/sector churn.
- Work order 179 adds Gangue Compression Die as another pure ordered `onFire` transform. It derives one peak-damage reference from the already-built volley and rewrites only lighter existing shots, so earlier split/clone stages expose branches while later topology remains untouched. Its damage, geometry, lifetime, and plasma-tag changes automatically flow through combat, Contract Select, Hardpoint cumulative cards, and the attack simulation.
- Low-Orbit Ore Scrip moves into `RunUpgradeEffects.routeChosen`. `RunSession.applyRouteOutcome` is the compatibility boundary: it runs the retired fitted-item hook first, applies the permanent one-credit Shop/Repair refund only when that legacy item is absent, and records a shared route-detail line for either source. The flag is omitted from the expedition-wide fingerprint and passed only by `GameApp` at route settlement.
- Work order 180 introduces `ArcCharge` as the pure profile and attachment boundary. Standard and heavy charge live on the projectile blueprint/state rather than in a kill payload. `CombatState.resolveProjectileImpact` remains the consumption authority: target-specific damage is settled unchanged first, first phase traversal preserves the charge, and a consuming player/ally hit performs one bounded deterministic nearest-target scan excluding the primary. A successful secondary strike reuses normal enemy/boss damage, defeat, objective, reward, and ally-credit reducers, then emits one capped endpoint effect; it cannot recursively arc or create a projectile.
- Chain Arc, Plasma Lens, Arc Welder, Arc Window, and Crossfeed all attach or upgrade that shared state through the production spawn hooks. `FoundryPresentation` compares body impact and arc potential separately after each prefix, while Canvas and the shared DOM attack simulation read the same charge kind for their bounded electrical shell. The segmented discharge effect is render-only, deterministic from effect identity and endpoints, and respects reduced-motion, performance, and high-contrast settings. No save/snapshot field or seeded RNG stream is added.
- Work order 181 moves Route Ledger Spool into `RunUpgradeEffects.routeChosen`. `RunSession.applyRouteOutcome` first resolves the retired fitted-item hook, then adds the permanent reward-credit bonus only when that legacy copy is absent. The upgrade is excluded from the expedition-wide generation fingerprint and contributes only to the already-authored route reward cash-out. Forkline Dynamo reuses `ArcCharge` inside the ordered `onFire` pipeline: it performs one bounded stable sort of the current small volley and charges only its two horizontal extremes, so later circuit stages, combat, and Foundry preview consume one shared result without a new state or render path.
- Work order 182 adds a presentation-only circuit-condition boundary without inferring prerequisites from an arbitrary representative volley. `ItemHooks.getPrototypeVentCircuitConditionProfile` derives Vent linkage from the authoritative cadence registry and fitted circuit order; `FoundryPresentation` maps that structured result to met/unmet output, and `FoundryScene` publishes semantic state for styling and browser coverage. Combat hooks, previews, engineering state, saves, and generated content remain untouched.
- Work order 183 moves Market Echo Locator into `RunUpgradeEffects.marketEchoLocator`. `SectorRewards` projects the active fitted circuit once, gives a restored legacy locator precedence, and authors the permanent extra Shop/Repair choice and credit/magnet bias before the ordinary hook pipeline. The upgrade is excluded from the expedition-wide generation fingerprint, while the changed reward is still produced by its existing named reward seed. Faraday Phase Shunt reads only the upstream projectile's shared `ArcCharge` profile and adds the existing one-use `phase` tag, so combat consumption and Foundry preview inherit the interaction without another collision, charge, RNG, or state path.
- Work order 185 moves Convoy Receipt Printer into `RunUpgradeEffects.convoyReceiptPrinter`. `Shops.generateShopInventory` gives a restored fitted printer precedence and otherwise authors one extra credit/drone-biased slot only for reroll indices above zero. The flag is excluded from the expedition-wide fingerprint and passed directly into the deterministic named shop roll. Rebound Freight Seal reads the upstream projectile's bounded `ricochetBounces`, adds 14% impact per prepared bounce up to two, and attaches `overkill`; production combat and Foundry cumulative preview consume the same ordered `onProjectileSpawn` result without another actor, shot, bounce, timer, or RNG path.
- Work order 188 moves Mining Laser Transit into `RunUpgradeEffects.miningLaserTransit`. `SectorRewards` gives a restored fitted Transit precedence and otherwise adds the same laser/plasma bias only to Vault and Faction Ambush reward payloads. The flag is excluded from the expedition-wide fingerprint and passed directly to the existing named reward roll. Strata-Bore Collimator reads upstream plasma plus a capped count of existing circuit traits, then adds beam-laser presentation, velocity, and bounded impact through the production `onProjectileSpawn` pipeline used by combat and Foundry preview.
- Work order 189 moves Ambush Insurance Stamp into `RunUpgradeEffects.routeChosen`. `RunSession.applyRouteOutcome` first resolves the retired fitted-item hook, then adds the permanent one-salvage and armor/credit claim only when that legacy copy is absent and the chosen route is Elite or Faction Ambush. The flag is excluded from the expedition-wide generation fingerprint. Claimant Arc Seal reads upstream overkill and attaches the shared standard `ArcCharge`; combat consumption, second-target selection, electrical presentation, and Foundry cumulative output remain on the work order 180 production path.
- Work order 190 makes socket capacity a primary-weapon-only derived stat. Component definitions expose channel templates only on primary hardware; content validation requires those templates and rejects them on secondary, engine, utility, armor, drone, and bomb modules. Capacity is reconstructed from existing slot, source, sector, and quality data, so restored snapshots immediately receive the new rule without another persisted field, migration, or RNG draw. Replacing a primary may deterministically reroute or rack tail items under the existing reconciler; changing any other mount cannot alter the circuit.

### Work order 133 navigation hub boundary

- `SectorNavigation.ts` is the pure boundary for local carrier geography. It owns the fixed six-destination vocabulary, four authored layout grammars, named sector RNG stream, bounded jitter, connected transit edges, default-open service policy, optional story-lock reasons, visit reducer, synchronization, and validation.
- Map plans are regenerated from run seed plus zero-based sector index and are not stored. `RunSession.navigation` stores only the current sector index and up to six unique visited destination ids; `resetMissionForCurrentSector` synchronizes this boundary so debug repositioning, normal transit, and resume share one reset rule.
- `SectorTransitionScene` remains the mission briefing scene id/checkpoint boundary but now projects the plan as a DOM navigation hub. Selection is presentation-only. Confirmed travel records the visit before delegating to `GameApp`; mission launch remains the only path that dispatches briefing and entry mission events.
- `GameApp` owns service orchestration. Hub Shop uses the current sector's existing seeded inventory/reroll state, Hardpoint uses the existing reversible engineering reducer, and lazy Fleet/Crew/Apex scenes return to the same checkpointed hub. No service owns navigation or mission state.
- Reward settlement still creates exactly one route-conditioned non-primary component, carrier cargo entry, and acquisition timeline event. It advances directly to the next sector; installation is now player-initiated from the next hub. Reopenable foundry calls award crew/carrier salvage bonuses only when scrapping produced positive salvage.
- Snapshot v11 validates navigation identity, uniqueness, and destination vocabulary and retires v10. Map coordinates and edges remain derived content, keeping the persisted addition bounded and avoiding layout drift inside the fixed-step combat loop.

### Work order 191 persistent player-hull and dock-service boundary

- `MissionDirectorState.checkpoint.hull` remains the single current-hull authority outside live combat. A null checkpoint still means an untouched full ship; a numeric value is clamped against the effective contract maximum by `RunSession.getShipHullReadModel`.
- `advanceSector` captures the settled checkpoint before replacing the mission schedule and supplies it to `resetMissionForCurrentSector`. Required sector-operation profiles carry hull, build, resources, and route context while resetting scroll-world state, so the next `CombatState` starts damaged without carrying enemies, hazards, distance, or effects.
- `RunSession.repairShipHull` is the bounded mutation seam. It restores an integer amount, clamps at the effective maximum including persistent hull patches, and rewrites only the mission checkpoint. Route and inter-act `hullPatch` effects remain maximum-hull changes and are not treated as free repair.
- `Shops.getShopHullRepairCost` combines a four-credit base with the existing act-economy repair surcharge. `GameApp` recomputes that price before spending, rejects full-hull and stale-price requests, applies one point, and records the result in the existing bounded timeline. The labor service does not consume or regenerate seeded rack stock and does not inherit item-price modifiers.
- `ShopScene` and `SectorTransitionScene` consume the same hull read model for semantic current/max values and full/damaged/critical state. The shop creates at most one segment per effective hull point only when its DOM scene redraws; navigation replaces the earlier maximum-patch summary without adding another stored field.
- Existing v12 snapshots already validate the checkpoint hull, so the change adds no schema, migration, generation fingerprint, RNG draw, combat actor, projectile, effect, or fixed-step branch.

### Work order 192 wing-rendezvous departure boundary

- `SectorExitSequence` owns one optional immutable escort manifest alongside the player origin. It conditionally inserts a rendezvous phase, derives a compact twelve-slot formation, and returns complete player/escort poses from elapsed time; it never writes back to `CombatState`.
- `GameplayScene` snapshots only active allies and all current drones when exit begins. Injured and retreated allies are excluded, while the frozen combat arrays remain authoritative until scene replacement. Render-time ids join those actors to their projected departure poses.
- `CanvasRenderer` accepts optional departure scale, alpha, and thrust on the existing ally and drone render records. Departure draws reuse normal silhouettes and accessibility colors, omit combat identity/hull furniture, and add only one bounded plume per escort.
- Solo exits retain work order 117 timing and phase thresholds. Escorted exits use a slightly longer transient sequence, but both converge on work order 122's invisible terminal latch and the same reward, route, act, victory, and debug callbacks.
- The manifest is transient presentation state. It changes no ally/fleet/drone reducer, cooldown settlement, pickup behavior, generated content, RNG stream, save, snapshot, actor cap, or projectile/effect budget.

### Work order 193 explicit primary-weapon offer boundary

- `Foundry.generateComponentSalvage` remains the automatic route/boarding hardware source but filters its compatible candidates to non-primary slots. `generatePrimaryWeaponOffer` uses the same source, quality, affix, compatibility, salvage, and circuit-capacity rules over primary candidates through a separate named seed; it does not advance or depend on the ordinary automatic selection stream.
- Explicit offer identity includes sector and offer key rather than `nextComponentSequence`. A sector reward is therefore stable while viewed, and one shop reroll owns one stable weapon id even after acquisition increments engineering sequence. The next reroll receives a distinct identity without adding a mutable offer record.
- `ComponentOffers` is the shared read-model boundary. It projects the current required-sector offer, the current shop roll and fixed armory quote, mounted-primary comparison target, and depletion from already-owned engineering components. Ordinary item stock remains the only consumer of `shopStockByRoll`.
- `GameApp.acquireRecoveredComponent` is the shared mutation boundary for reward, shop, and automatic hardware. It acquires into committed engineering, stows one carrier cargo record, and appends one bounded engineering timeline event. Shop purchase first regenerates and validates the current id and quote before spending credits; rewards and purchases never auto-install.
- `RewardScene` and `ShopScene` consume the same compact primary-offer card projection. Pattern, source/quality name, power/heat/mass/command, primary circuit capacity, and mounted delta remain presentation derived at scene entry and redraw only after player actions.
- No item reward count, ordinary shop slot, stock snapshot, save version, route topology, combat actor, projectile/effect budget, fixed-step branch, production dependency, or broad generation fingerprint changes.

### Work order 194 bounded reward-manifest boundary

- `SectorRewards.generateRewardChoices` is the sole final circuit-choice count authority. It starts from the authored base of three and adds only the context-specific permanent Relic Pattern Dossier and Market Echo Locator bonuses. The result is resolved before the existing named reward RNG stream selects its bounded prefix.
- Objective, route, act-economy, carrier, inter-act, curse, and fitted-item systems may contribute deterministic bias tags, credits, salvage, or other authored consequences, but their hooks cannot mutate final manifest breadth. Historical `rewardChoiceBonus` data remains loadable for snapshot compatibility and is deliberately ignored by the count policy.
- Restored legacy Market Echo items retain legacy reward bias precedence, while the permanent upgrade's extra choice remains authoritative. Other restored count-bearing item hooks are interpreted as bias-only effects, preventing active circuit order from becoming an option-count multiplier.
- `RewardScene` appends the work order 193 primary weapon and the credit fallback after circuit generation. Normal manifests therefore contain five cards and a context-upgraded manifest contains at most six; neither auxiliary choice participates in item weighting or advances the circuit-item stream.
- The existing reward seed names, deterministic item ordering, explicit weapon-offer stream, save/snapshot shape, route topology, and combat budgets are unchanged. A lower requested count intentionally exposes a shorter prefix of the same deterministic reward sequence.

### Work order 195 navigation header utility boundary

- `SectorTransitionScene` remains the sole owner of constellation suspension. It creates the existing `onSuspendAndExit` button once, but mounts it before the resource strip inside `navigation-hub-utility` instead of appending it to `navigation-hub-footer`.
- The utility column is presentation-only: desktop flex alignment places its action at the top-right and resources at the bottom-right, while the existing narrow header breakpoint stacks the column in normal flow. Footer guidance, action semantics, callback identity, and `handleAction` Escape/pause dispatch are unchanged.
- The move adds no reducer, save/snapshot field, route transition, service state, generation pass, RNG draw, timer, actor, projectile, effect, or fixed-step work.

### Work order 196 primary-arsenal engineering boundary

- `FoundryScene` projects only two player-facing engineering inventories: the one mounted primary plus `getPrimaryWeaponCargoComponents` in reserve. Fixed secondary, defense, engine, utility, drone, and experimental mounts remain committed simulation inputs but no longer expose independent assignment controls.
- Primary Arsenal dispatches the existing `planInstallComponent` action against the frame's sole primary hardpoint. That reducer atomically removes the chosen component from cargo, displaces the previous primary into cargo, preserves acquisition identity, and lets the existing item-socket reconciliation contract or expand the ordered circuit after redraw.
- `ShipLoadoutValidationOptions.enforceResourceEnvelope` defaults to true. Foundry resolution alone supplies false, retaining frame/module/hardpoint/tag/unique/exact-primary checks and complete resource calculation while omitting resource-overload issues; engineered deltas and instability remain readable debug/profile data but are not commit blockers.
- Primary Cargo is a filtered presentation over the unchanged engineering snapshot, not a second inventory. Non-primary components remain available to carrier/fleetcraft and restored-state consumers, and scrapping a visible primary still uses the existing reversible action, salvage payout, history, undo, and commit boundary.
- The change adds no save/snapshot field, migration, component-generation pass, RNG draw, route mutation, combat actor, projectile, effect, or fixed-step branch.

### Work order 197 Build Fit retirement boundary

- `RewardScene` and `ShopScene` pass authored source and price context directly into `ItemCardViewModel`; neither scene constructs a hypothetical acquisition nor asks `BuildSynergy` to score one.
- `ItemCardViewModel` contains only durable authored/acquired item presentation. `ItemCard` has no optional prospective-synergy row, preventing other menus from reviving an implication that family scores are upgrade effects.
- `BuildSynergy.createBuildSynergyModel` remains a read-only classifier over owned item instances for HUD and debrief identity. Its scores are not consumed by `ItemHooks`, `CombatState`, reward generation, shops, engineering, or run progression.
- The change removes presentation-only work and adds no save/snapshot field, migration, item definition, RNG draw, route mutation, combat actor, projectile, effect, hook, or fixed-step branch.

## GitHub Pages notes

- Vite project Pages base path should be `/StarbreakSalvage/` for `https://regillmore.github.io/StarbreakSalvage/`.
- Pages workflow should upload `dist`.
- CI should run separately from deploy so PRs are checked before merge.
