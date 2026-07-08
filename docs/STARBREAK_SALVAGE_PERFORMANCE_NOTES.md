# Starbreak Salvage - Performance Notes

## Projectile Count Budgets

The boss/faction alpha keeps projectile counts intentionally small while the simulator is still shape-rendered and allocation-heavy.

- Common enemies should average 1-3 bullets per attack.
- Boss attacks should stay at or below 12 bullets per volley in normal alpha play.
- Telegraphs should appear before boss and role-specific normal volleys and expire quickly; they count toward debug entity totals.
- Phase changes may swap attack patterns or cadence, but should reset stale telegraphs before showing the next warning.
- A typical active field should stay under 80 total entities during Phase 2 alpha play.
- Future dense patterns should add pooling only after profiling shows allocation pressure.

## Phase 3 Scrolling Budget Targets

Phase 3 adds continuous vertical motion, procedural backgrounds, landmarks, and hazards. Keep the first implementation conservative until profiling proves there is room to expand.

- Normal background rendering currently uses 4 parallax strata per sector.
- Performance mode currently collapses rendering to priority 1-2 strata without changing encounter timing.
- Background plans are generated once per sector and rendered from deterministic data plus scroll offset.
- Directed normal waves now use deterministic scroll-distance markers when a sector scroll plan is available; handcrafted/debug schedules can still fall back to time markers.
- The combat spawn queue processes every crossed distance marker in order and advances one spawn index, so fixed-step catchup frames should not skip or duplicate current wave spawns.
- Sector completion now waits for exit distance plus required combat gates, so smoke and playtest timing should budget for full-sector travel instead of quick wave clears.
- Sector feature plans are generated once per sector and currently add 3 landmarks plus 2-3 sparse hazard windows. Hazard telegraph and active phases are distance-based and should follow the same indexed-marker discipline as waves if they become denser later.
- Hazard rendering uses low-alpha fills/pattern strokes below pickups, enemies, projectiles, and the player. Do not raise hazard opacity or paint it above bullets without a contrast/readability pass.
- Boss arena plans are generated once per boss-gated sector. Arena approach slows scroll, locked arenas hold distance at explicit zero speed, and active hazard rendering/collision is suppressed during the locked boss fight to keep boss bullets readable. If a hazard window overlaps that hidden lock, gameplay defers it on release so the telegraph lead restarts after boss defeat before collision damage is enabled.
- Sector condition plans are derived once per gameplay scene from route outcomes plus challenge/unlock flags. They transform existing scroll, feature, and boss arena plans instead of generating per-frame terrain, so route-conditioned speed, distance, hazards, landmarks, and approach lengths should stay allocation-light and deterministic.
- Velocity presentation currently uses low-alpha deterministic canvas primitives: background streaks, frame rails, engine wake, pickup trails, impact streaks, and projectile outlines. Reduced motion disables the scrolling streak/parallax cues, performance mode lowers cue density, and high-contrast bullets reduce moving-background intensity while adding outlines.
- Avoid per-frame allocation in background rendering; cache reusable primitives or draw plans when profiling shows pressure.
- Keep normal Phase 3 combat near the Phase 2 active-field budget until long-scroll profiling is available.
- Debug counters currently report distance traveled, scroll speed, arena phase, active debug scenario, total entities, enemy count, player/enemy projectile split, pickup/effect counts, telegraph count, planned background primitive/layer count, and active landmark/hazard count during gameplay.
- The long-scroll debug scenario jumps to a deterministic late-sector traversal without requiring a boss defeat or live enemy field. Use it to inspect background, feature, HUD, and scroll counter behavior apart from combat pressure.
- Moving backgrounds must be tested in standard and high-contrast modes before increasing bullet density.

Phase 3 closeout: work order 030 keeps object pooling/batching deferred. Local production preview smoke covers the static Pages base path; frame-time sampling and allocation timing remain future instrumentation rather than current blockers.

## Phase 4 Display Budget Targets

Phase 4 adds explicit display parity before richer ship previews and HUD theming. Keep the first implementation measurable and cheap.

- Viewport layout is derived from a pure helper with desktop, standard/laptop-tablet, and narrow classes.
- Canvas DPR is clamped to `2` so high-density displays do not silently multiply fill cost beyond the current shape renderer's budget.
- Gameplay now uses a fixed 640x720 combat arena. The viewport helper fits that arena into the HUD-safe region with a uniform presentation scale, so wider/taller browser windows no longer add extra enemy spacing or dodge space.
- Hazard lane widths, enemy spawn ratios, boss sway, projectile cleanup, pickup drift, and player bounds stay in combat-world units; only the final canvas presentation transform changes per viewport.
- HUD CSS caps narrow-window height to the same top band used by the safe frame, preventing the current text-heavy HUD from spilling into the player lane.
- Debug counters now report viewport size/class/presentation scale, DPR, canvas pixel size, safe-frame origin/size, HUD mode, active input mode, and fixed combat world size during gameplay, alongside existing entity, scroll, background, landmark, and hazard counters.
- Pointer guidance uses the same viewport-to-combat-world helper and only stores one current pointer target in the input system, so mouse/touch movement should stay allocation-light in dense combat.
- Player ship appearance rendering remains shape-based canvas work: one selected silhouette path, simple mount primitives, appearance-derived colors, high-contrast substitutions, and a fixed hit-radius ring. New Game previews use static inline SVG primitives derived from the same appearance data, so they add DOM cost only on contract selection screens rather than per-frame gameplay cost.
- The gameplay HUD now derives contract-themed CSS variables and four semantic DOM meters from existing combat state. Meter updates are simple style/attribute changes on persistent elements; avoid replacing the HUD subtree per frame unless profiling shows this is cheap enough.
- Ship combat feedback remains a small shape-rendered overlay on the existing player draw: cue state is derived from current hull, invulnerability, special, bomb, and weapon heat values plus appearance colors, then painted as low-alpha wake/bracket/ring/stress strokes. Reduced motion, performance mode, and high-contrast mode lower decorative cue intensity; future richer effects should avoid adding per-frame particle allocation until dense-combat profiling justifies it.
- Non-combat contract theme propagation uses one shared selected-contract theme model plus CSS variables on persistent route/shop/reward/transition/summary panels. It does not change deterministic generation, save data, or per-frame canvas work; future richer non-combat art should remain static DOM/SVG unless profiling shows it is safe.
- The helper is cached by viewport key inside gameplay scenes. Future previews and themed HUD work should reuse the same safe-frame contract instead of introducing parallel window math.

Phase 4 closeout: work order 040 keeps richer rendering optimization deferred. `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally. Manual cross-browser performance/readability checks outside Chromium remain pending.

## Phase 5 Progression And Sector Feedback Budget Targets

Phase 5 adds upgrade spending, more feedback beats, a lunar surface sector, and richer destruction. Keep the first pass measurable and conservative.

- Upgrade definitions should be data-only and validated in tests; purchases should update persistent save state without adding per-frame work.
- Upgrade Bay icons should be static inline SVG, CSS, or canvas-derived primitives. Avoid image assets and avoid rebuilding the whole menu tree while the player hovers a card.
- Upgrade effects that influence generation must branch from save state plus explicit seeded RNG streams; do not add `Math.random()` or hidden time-based variation.
- Toasts should be short-lived DOM elements with bounded queue length. Avoid stacking enough to cover gameplay or menus.
- Sector exit sequences should be brief and reuse existing renderer primitives where possible; reduced motion should remove travel streaks or pulses without skipping route/reward flow.
- Lunar surface backgrounds should track primitive/layer counts like existing sectors. Terrain silhouettes must render below bullets and hazards, with high-contrast bullets still outlined.
- Lunar hazards use sparse distance windows for dust plumes, mining lasers, and surface-defense arcs. Keep them below combat actors/projectiles and avoid layering dust, terrain, hazard, and enemy bullets at the same intensity until smoke proves readability.
- Ship destruction debris should use a fixed budget, ship appearance colors, and settings-aware intensity. Reduced motion and performance mode should lower debris count and screen shake rather than changing death outcome timing.

Work order 041 keeps upgrades data/save-only: catalog validation and purchase helpers add no per-frame work. Work order 042 adds static Upgrade Bay DOM and inline SVG icon rendering only when the menu is entered or refreshed after purchase; it adds no gameplay-frame work. Work order 043 resolves purchased upgrade effects once per generated run and reuses existing contract, route, shop, reward, summary, and debug surfaces; it adds no per-frame combat work beyond a short debug label string. Work order 044 builds run-summary/archive progress models only when those scenes enter and renders static DOM callouts. Work order 045 adds a single active sector-exit toast plus a bounded canvas beacon/corridor primitive after completion; reduced motion removes corridor lines and shortens the beat, and the sequence clears enemy pressure instead of adding combat work. Work order 046 adds one extra generated background family with 132 lunar primitives on the deterministic lunar route; reduced motion/performance modes hide priority-3 wreck shadows and scale layer alpha through the existing background renderer. Work order 047 reuses the existing sector feature renderer and wave director, adding only three lunar landmark patterns, three lunar hazard patterns, static readability metadata, and one optional sector pacing block resolved at run/wave-plan creation time. Work order 048 freezes combat during a bounded destruction state and draws at most 12 deterministic debris pieces, reduced to 8 in performance mode and 5 with reduced motion, before returning to the existing summary path.

Phase 5 closeout: work order 050 keeps progression/sector-feedback optimization deferred until profiling requires it. `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally. Manual cross-browser performance/readability checks outside Chromium remain pending.

## Phase 6 Item Catalog Budget Targets

Phase 6 expands the item catalog and hook surface. Keep the first larger catalog conservative until proc and DOM costs are measured.

- Item definitions should remain data-only and validated in tests. Large item batches should not add production dependencies or external assets.
- Work order 052 keeps schema growth data-only: family/source/unlock/status/stacking/UI-tag metadata is resolved by content validation and audit helpers, not by per-frame gameplay systems.
- Item hook dispatch should stay explicit, deterministic, and bounded by proc budgets. New hooks should avoid scanning unrelated state every frame.
- Work order 053 adds typed hook surfaces for combat, sector, route, shop, reward, and boss phase events plus a default dispatch application cap of 48 hook-owning item instances per event.
- Work order 054 reaches 60 items without adding production dependencies or per-frame catalog scans. New effects attach to existing event dispatch, reward/shop/vault sampling remains generation-time, and the newly live hooks are covered by deterministic unit tests rather than debug-only behavior.
- Work order 055 keeps acquisition curation generation-time only: source/rarity/family/tag profiles are applied when reward/shop/vault choices are created, and source hints are static card text.
- Work order 058 keeps item presentation screen-time only: shared item-card view models are derived when reward, shop, summary, or archive DOM is entered, and inline SVG family icons are static primitives with no per-frame rendering cost.
- Work order 059 adds item-stress instrumentation without adding runtime dependencies: `src/game/ItemStress.ts` builds a deterministic hook-heavy loadout, fresh/unlocked reward-shop-vault pool previews, and an overlay read model for item count, active hook surfaces, hook applications, peak proc pressure, skipped proc applications, and build identity.
- Prefer generation-time pool sampling over per-frame item filtering. Reward, shop, vault, boss, faction, lunar, and unlock-gated pools should be derived from seed plus save state when the relevant screen or encounter is created.
- Large reward/shop/archive item card surfaces should use stable DOM nodes or compact render passes rather than rebuilding excessive nested markup on hover.
- Item icons should stay inline SVG, CSS, or canvas primitives with high-contrast fallbacks; avoid image assets.
- Item discovery and archive filtering should remain local-only and save-safe. Do not add telemetry or network calls.
- Dense synergy combat should expose enough debug state to inspect active item count, hook count, build identity, and proc budget before increasing projectile or particle density.
- New item effects should prefer conditional behavior, alternate projectiles, economy, routing, shields, cooldowns, or source weighting over unconditional damage multipliers.

Phase 6 closeout: work order 060 treats the 60-item catalog as a playtest candidate, not a final balance state. `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally for the release-hardening pass. Late-run proc balance, reward repetition, item-card density on real mobile devices, and non-Chromium browser checks remain manual playtest risks.

## Phase 7 Enemy Behavior Budget Targets

Phase 7 expands enemy behavior, variants, formations, and sector length. Keep the first richer enemy pass tactical and observable before raising raw density.

- Work order 061 keeps behavior unchanged and documents the current baseline: four faction-pattern enemy classes, 24 semantic wave labels, shared normal-enemy radius 17, 2-3 base hull, no normal-enemy telegraphs, and objective accounting that is safe for current kill paths but not yet policy-rich enough for retreating or spawned enemies.
- Work order 062 adds data-only enemy role metadata and debug summaries for active role counts, required-target objective policy counts, and initial variant/formation placeholders. It does not change spawn schedules, movement, attack cadence, projectile count, or objective accounting.
- Work order 063 moves normal enemies through metadata-driven movement profiles while keeping spawn schedules, attack cadence, projectile count, and objective accounting unchanged. Profiles clamp to combat-world bounds and use stable home anchors so debug dense/item-storm scenarios do not drift out of frame.
- Work order 064 moves normal enemy attacks through metadata-driven profiles. Current and registered Phase 7 attack families emit at most 3 projectiles and at most 3 telegraphs per attack, use short windups before firing, and cancel pending normal-enemy windups when bombs clear danger. This raises normal telegraph presence but keeps the dense/item-storm pockets below their existing manual budgets until later enemy-rich smoke is added.
- Work order 065 adds upgraded variant selection at wave-plan creation from seeded per-spawn RNG forks and applies small per-enemy stat/reward modifiers at spawn/defeat time. Rendering adds one ring and compact badge for active variants, with high-contrast fallback; no variant adds extra projectile damage or per-frame global scans.
- Work order 066 adds formation selection at wave-plan creation from seeded per-wave RNG forks, then expands existing multi-member waves into ordered spawn entries with fixed-world offsets and staggered timing. Combat still consumes a single indexed spawn queue, and rendering adds one lightweight formation arc/label per active formation member; no formation adds per-frame random selection, global scans, extra projectile damage, or additional objective counters.
- Work order 067 keeps formation integration on existing paths: route/encounter/faction weighting is generation-time only, formation instance IDs are spawn metadata, clear-bonus salvage is awarded during normal defeat pickup creation, and offscreen despawns use the same objective accounting path without drops or charge. Cleanup still scans only the active enemy list once per tick.
- Work order 068 adds a generation-time sector pacing layer after route-conditioned modifiers. It modestly lengthens selected route-pressure, lunar, boss, and late sectors, then spreads waves with explicit distance ratios, inserts at most three landmark beats and two extra hazards under the existing feature budget, and marks one formation-cluster wave instead of raising sustained enemy density.
- Work order 069 adds a debug-only enemy-rich pocket with 10 enemies, 36 enemy projectiles, 4 telegraphs, and 2 effects, staying under the 80-entity alpha field budget while exercising all current role families, variant badges, and multiple formation labels. The overlay now reports enemy projectile and telegraph counts against stress budgets.
- Work order 070 keeps release hardening focused on blockers: the boss-release hazard handoff now evaluates overlapping hidden hazards against a deferred warning window, preserving existing generated hazard plans without adding per-frame terrain mutation or extra entity pressure.
- Enemy role metadata should be data-driven and validated. Behavior systems should read explicit role/movement/attack families rather than infer from display names or faction strings.
- Movement profiles should stay fixed-step and clamped to the 640x720 combat world. Retreating, escorting, hovering, and lane-holding roles must have cleanup or timeout behavior so objectives cannot stall.
- Attack-role differentiation should prefer cadence, angle, aim style, telegraph timing, and position pressure over simply adding more bullets.
- Upgraded variants should change behavior, durability, rewards, or vulnerability windows with clear visual cues. Avoid hidden damage spikes or invisible speed multipliers.
- Formation definitions should be resolved at wave generation/spawn time from seed plus save state. Do not let formation members call random functions while entering or breaking.
- Formation spawning should process crossed distance markers in order and expose member counts so frame catchup cannot skip or duplicate squad entries.
- Longer sectors should use pressure and relief windows, landmark/hazard pacing, and formation clusters. Avoid constant maximum enemy density over a stretched distance.
- Debug overlays should expose active role count, upgraded variant count, active formation label/member count, long-sector pressure band, projectile count, and telegraph count together as the remaining Phase 7 systems land.
- The existing dense-combat pocket, item-storm pocket, forced exit/destruction shortcuts, and quiet long-scroll traversal should stay green as enemy systems grow.
- Measure sustained long-sector pressure before expanding projectile or particle caps.

## Phase 8 Environment Budget Targets

Phase 8 expands the environmental layer. Keep the first richer pass visible, deterministic, and capped before raising density.

- Hazard-zone definitions should stay data-only and validated. Richer behavior should be selected at generation time, not through per-frame random branches.
- Work order 072 keeps the first hazard-zone pass data-only: existing hazards now read metrics, readability colors, safe-lane expectations, damage/cooldown metadata, and boss-arena suppression policy from `src/content/hazardZones.ts` without increasing active hazard counts.
- Work order 073 adds behavior metadata and a pure runtime helper for sweep, pulse, drift, collapse, shadow, curtain, dust-front, and static-gate hazard presentation/collision. It does not increase generated hazard counts; collision remains simple fixed-world rectangle checks derived from active hazard windows.
- Work order 074 adds a deterministic hazard director with a conservative 4-zone total cap per sector. It consumes route pressure, relief windows, formation clusters, lunar context, and boss locks without adding per-frame randomization or scanning inactive schedule entries for collision.
- Active richer hazard zones should start with a conservative cap of 3-4 simultaneous active/telegraphing zones, excluding static background landmarks.
- Hazards should render below bullets, enemies, pickups, and the player. Do not increase hazard opacity or animation density without high-contrast and reduced-motion smoke.
- Hazard collision should use simple rect/circle/arc or lane checks from generated shapes. Avoid per-pixel collision and avoid scanning inactive schedule entries every tick.
- The hazard director should use pressure and relief windows from sector pacing rather than stacking hazards continuously across a long sector.
- Work order 075 adds destructible/obstacle definitions and fixed-world placement helpers only; it does not add runtime collision scans yet. Generated placement plans start with a conservative 3-5 object target and safe-lane checks before later interaction systems raise density.
- Destructibles and obstacles should start with a conservative active-field budget of roughly 12-16 physical objects before profiling supports more.
- Destructible chain reactions should have explicit per-event caps for destroyed objects, spawned rewards, effects, and item-hook dispatch.
- Obstacle placement must stay in fixed 640x720 combat-world units so viewport changes do not alter lane width, collision difficulty, or pickup access.
- Work order 078 adds deterministic loose-currency scatter and sector plans through `src/game/LooseCurrency.ts`. Runtime caps active loose pickups at 48 and active value at 120, with TTL cleanup and suppressed-value accounting before future density increases.
- Work order 080 keeps destructibles, obstacles, planned loose-currency lanes, and dropped loot in scroll-world space: live object collision/render positions derive from sector distance, planned currency spawns before its anchor distance, and missed world-scrolling pickups expire after passing below the playfield.
- Loose currency should use capped active counts and value totals. Start with a budget near current pickup density and raise only after item-storm/enemy-rich smoke remains readable.
- Pickup magnet logic should scan only active pickups/currency and avoid allocating helper objects per frame.
- Debug overlays should expose active hazard-zone count/families, destructible/obstacle count, loose currency count/value, pickup cap state, and environmental stress-budget state.
- Performance mode may reduce hazard animation detail, destructible debris, pickup trails, and loose currency sparkle density, but must not change generated timing, collision shapes, or economy values.
- Reduced motion should lower environmental animation and travel streaks while preserving telegraph clarity.
- High-contrast mode should outline bullets and keep hazard/destructible/currency cues distinct from projectile warnings.
- The boss-release hazard fairness rule from work order 070 remains a performance/readability requirement: hazards hidden during arena lock must restart a post-release warning before damage.

## Debug and Playtest Scenarios

Enable debug tools with `?debug=1` on a local, preview, or Pages URL.

- `1` spawns Auditor Drone XL.
- `2` spawns Carrier of Unsold Missiles.
- `3` spawns The Bloom Engine.
- `4` spawns Warranty Void Seraph.
- `5` spawns The Core Wreck.
- `6` replaces the current field with the item-storm hook stress pocket: 23 forced items across all 14 hook surfaces, 10 enemies, 30 enemy bullets, 2 lane telegraphs, 2 pickups, and 1 starter effect, plus overlay item/hook/proc/build telemetry.
- `E` replaces the current field with the enemy-rich formation/variant stress pocket: 10 enemies, all first-pass variant labels, multiple formation labels, 36 enemy bullets, 4 telegraphs, and 2 effects, plus overlay role/variant/formation/budget telemetry.
- `H` replaces the current field with the environmental stress pocket: an active hazard overlap, 6 schema-backed environment objects, 4 destructibles, 2 obstacles, 10 loose-currency pickups worth 32 total value, and 2 feedback effects, plus overlay hazard-family/object/currency/budget telemetry.
- `0` replaces the current field with the dense-combat performance pocket: 12 enemies, 42 enemy bullets, 3 lane telegraphs, and 1 feedback effect, for 59 total active entities including the player.
- `7` forces the player destruction sequence, including deterministic contract-colored debris and the destroyed summary handoff.
- `8` forces the current sector completion beat, including exit-progress telemetry before route flow.
- `9` replaces the current field with a quiet late-sector long-scroll traversal: 1 active entity, 0 projectiles, 0 pickups/effects, 0 telegraphs, and the current sector's generated background/features at a deterministic late distance.
- `K` forces a debug run summary.

The item-storm pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget while exercising every registered hook surface through a large forced loadout. The dense pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget of 80 entities. The enemy-rich pocket is deterministic and stays below that same budget while making role, variant, formation, projectile, telegraph, and long-sector pacing telemetry visible in one browser path. The environmental stress pocket is deterministic and bounded so hazard-family labels, environment object counts, destructible/obstacle splits, loose-currency caps, and environmental budget state can be inspected without combat pressure or private app-state reads. The long-scroll traversal is deterministic and intentionally quiet so background/feature rendering can be inspected without combat pressure. The forced-destruction path is deterministic and bounded so death-to-summary timing can be tested without relying on combat damage. Work order 049 also exposes progression, upgrade readiness, run resource, and sector-plan telemetry in the debug overlay, while work orders 059 and 079 expose item count, hook pressure, proc budget state, build identity, and environmental stress state, so browser smoke can verify banked scrap, `LUNAR-SURFACE-LANE`, exit, destruction, hook-heavy item paths, enemy-rich stress, and environmental stress without reading private app state. Use these to confirm the debug overlay remains responsive, bullets remain readable in standard and high-contrast modes, screen shake respects reduced motion, distance/speed/destruction counters behave correctly, viewport/HUD/input metrics remain stable, hook applications stay under the 48-item per-event budget, enemy projectile/telegraph budgets stay under the Phase 7 stress caps, environmental objects stay under the 16-object stress budget, loose pickups stay under the 48-pickup/120-value caps, and the round can still be abandoned or summarized.

Work order 079 adds the deliberate environmental stress debug path, with active hazard-zone families, destructible/obstacle count, loose currency count/value, pickup cap state, and environmental stress-budget telemetry visible through `?debug=1`. Work orders 074, 076, and 077 expose hazard-zone totals plus active environment/destructible/obstacle counts in the existing overlay, with obstacle placement constrained away from spawn, exit, boss-lock, hazard, and enemy lanes. Work order 078 adds loose-currency count/value, credit/salvage split, and cap telemetry to the existing overlay, and work order 079 binds the combined stress path to `H`. Work order 080 fixes scroll-world presentation so objects and loose currency enter with the background instead of popping into viewport space. Keep it deterministic and bounded, and verify it alongside the existing item-storm, enemy-rich, dense-combat, forced-exit, destruction, and long-scroll paths.

## Current Boss Phase Volleys

- Auditor Drone XL: starts with a 7-bullet `AUDIT FAN`, then alternates expedited fan/lane warnings under an 8-bullet cap.
- Carrier of Unsold Missiles: starts with 3 `MISSILE LANES`, then accelerates into up to 4 lane/fan volleys.
- The Bloom Engine: starts with a 10-bullet `SPORE RING`, then alternates spiral/fan pressure under a 12-bullet cap.
- Warranty Void Seraph: escalates from `VOID AUDIT` into clause-collapse and null-signature phases with longer telegraphs.
- The Core Wreck: escalates from `CORE SALVO` lanes into reactor breach and `CORE UNSEALED` mixed patterns, capped at 12 bullets.

The debug overlay total entity count includes player, enemies, boss, bullets, pickups, telegraphs, and effects. The split counters report enemies, projectile owner counts, pickups/effects, loose currency count/value/caps, telegraphs, item count, active hook count, proc cap state, build identity, active environment/destructible/obstacle counts, environmental stress budgets, background plan size, active sector features, viewport/canvas metrics, HUD mode, input mode, and contract theme separately.

## Phase 2 Playtest Risks

- Entity counts are currently shape-rendered without pooling; profiling should precede any bullet-count expansion.
- Route and reward tuning is first-pass and may produce weak or overly generous economy loops.
- Boss telegraphs are readable in smoke tests, but manual checks are still needed on narrow mobile viewports and high-contrast mode.
- Procedural audio uses cue feedback only; music and mix depth remain future work.

## Phase 3 Playtest Risks

- Future scroll-synced hazards, landmarks, and pickup beats should reuse the indexed marker pattern now used for waves; ad hoc threshold checks can still double-fire or skip under frame catchup.
- Procedural backgrounds and velocity cues are deliberately low-alpha/settings-aware, but they can still hide bullets unless palette, contrast, and motion settings are validated per sector.
- Boss scroll locks now share a first-pass arena-state contract, and route-conditioned arena approach lengths are covered by unit tests. Future arena variants can still strand the player if they bypass the release condition or hide remaining support targets.
- Rich landmarks and hazards may compete with enemies for attention; telegraphs should stay distinct from background motion.

## Phase 4 Playtest Risks

- Window-size parity can create new overlap bugs between canvas, HUD, debug overlay, and DOM scenes unless safe-frame helpers are test-covered.
- Mouse controls can accidentally bypass pause/settings focus or undermine keyboard remapping if pointer state does not flow through the input abstraction. Work order 036 now clears pointer guidance over DOM overlays and preserves native button activation, but future pointer settings should keep using the input abstraction.
- Contract ship previews and HUD themes can obscure hitboxes or bullets unless high-contrast and reduced-motion settings are checked with each baseline contract. Gameplay ship silhouettes, New Game previews, and the cockpit HUD now keep simple primitives/DOM styling, but manual theme readability checks remain useful across all baseline ships.
- Contract preview, graphical HUD, ship combat cue, and non-combat theme rendering should stay shape-based/static and cheap until debug/preview smoke shows there is room for richer visuals. HUD changes should continue to expose mode/theme state in debug so narrow and high-contrast smoke can catch regressions early.

## Phase 5 Playtest Risks

- Banked scrap upgrades can accidentally become raw permanent power creep. The first catalog is deliberately framed around variety, information, starting options, and run-shaping sidegrades; keep later effects inside that lane until balance data supports more.
- Upgrade effects that touch generation can break seeded reproducibility if they bypass explicit save-state inputs or RNG streams.
- Upgrade Bay icons can become decoration without clarity; every icon state should have text and accessible state copy.
- Sector exit toasts and completion beats can delay route flow or hide danger if they are too long or too animated.
- Lunar terrain and hazard bands can hide bullets if overbright. Keep terrain muted, hazards telegraphed below combat layers, mining lasers narrow, dust plumes low alpha, and high-contrast projectile outlines active.
- Rich destruction can obscure the cause of death or make summary transitions flaky. Keep the death state bounded, deterministic, and settings-aware.

## Phase 6 Playtest Risks

- The first source-weighted profiles are tuning guesses. Track implementation status and reward source intent explicitly, then revisit weights with playtest data.
- New hooks can create runaway proc chains if ordering and budgets are not enforced. Tests should cover multi-item interactions before adding dense effects.
- Reward pool weighting can become opaque. Source hints and summaries should explain why rare, cursed, lunar, faction, or boss items appeared.
- Unlock-gated item families can starve fresh saves if baseline pools shrink too far. Keep fresh-save pool sufficiency covered by deterministic tests.
- Item card and archive UI can become too dense on narrow screens. Favor concise tags, clear rarity/source labels, and accessible text over decorative clutter.
- Item-storm smoke confirms the current 23-item forced loadout stays below proc caps, but real late-run inventories can still overemphasize unconditional projectile multiplication. Keep future proc-heavy items conditional, budgeted, and visible in the debug overlay.

## Phase 7 Playtest Risks

- Stronger roles can become unreadable if movement, projectile, and telegraph cues all change at once. Add one pressure dimension at a time and keep high-contrast smoke active.
- Upgraded variants can feel unfair if their cue is cosmetic but their damage or speed spike is mechanical. Make the cue and rule visible before increasing punishment.
- Formations now share objective accounting for simultaneous kills, secondary item effects, body collisions, and despawns; future break/retreat behavior can still reintroduce target desyncs if it bypasses that shared path.
- Longer sectors can become exhausting if pressure lacks relief windows. Favor mid-sector punctuation, landmarks, and formation beats over continuous enemy density.
- Enemy-rich sectors can interact with the Phase 6 item catalog in surprising ways. Keep item-storm, dense-combat, and formation stress paths separate and then test combined pressure intentionally.
- Boss-gated sectors suppress hazards during arena locks; future hazard density increases should keep the work order 070 deferred-release contract so a hidden warning cannot become damaging on the same moment the boss dies.

## Phase 8 Playtest Risks

- Rich hazard zones can hide bullets or player hit feedback if their active fills, warning outlines, and background motion share too much contrast.
- Obstacle layouts can accidentally become hard walls if safe-lane validation misses spawn corridors, exit corridors, boss locks, or hazard overlap.
- Destructible rewards and loose currency can inflate scrap/credit income. Keep source/value telemetry visible before raising drop rates.
- Pickup magnet behavior can feel different across window sizes if it uses presentation coordinates instead of fixed combat-world coordinates.
- Chain reactions can create runaway pickups, effects, or item hook dispatch if caps are not enforced in the same event path.
- Environmental density can combine badly with enemy-rich and item-storm paths. Test hazard/destructible/currency stress independently first, then combine intentionally.
