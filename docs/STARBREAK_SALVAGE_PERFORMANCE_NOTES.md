# Starbreak Salvage - Performance Notes

## Projectile Count Budgets

The boss/faction alpha keeps projectile counts intentionally small while the simulator is still shape-rendered and allocation-heavy.

- Common enemies should average 1-3 bullets per attack.
- Boss attacks should stay at or below 12 bullets per volley in normal alpha play.
- Telegraphs should appear before boss volleys and expire quickly; they count toward debug entity totals.
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
- Boss arena plans are generated once per boss-gated sector. Arena approach slows scroll, locked arenas hold distance at explicit zero speed, and active hazard rendering/collision is suppressed during the locked boss fight to keep boss bullets readable.
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

## Debug and Playtest Scenarios

Enable debug tools with `?debug=1` on a local, preview, or Pages URL.

- `1` spawns Auditor Drone XL.
- `2` spawns Carrier of Unsold Missiles.
- `3` spawns The Bloom Engine.
- `4` spawns Warranty Void Seraph.
- `5` spawns The Core Wreck.
- `6` replaces the current field with the item-storm hook stress pocket: 22 forced items across all 13 hook surfaces, 10 enemies, 30 enemy bullets, 2 lane telegraphs, 2 pickups, and 1 starter effect, plus overlay item/hook/proc/build telemetry.
- `0` replaces the current field with the dense-combat performance pocket: 12 enemies, 42 enemy bullets, 3 lane telegraphs, and 1 feedback effect, for 59 total active entities including the player.
- `7` forces the player destruction sequence, including deterministic contract-colored debris and the destroyed summary handoff.
- `8` forces the current sector completion beat, including exit-progress telemetry before route flow.
- `9` replaces the current field with a quiet late-sector long-scroll traversal: 1 active entity, 0 projectiles, 0 pickups/effects, 0 telegraphs, and the current sector's generated background/features at a deterministic late distance.
- `K` forces a debug run summary.

The item-storm pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget while exercising every registered hook surface through a large forced loadout. The dense pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget of 80 entities. The long-scroll traversal is deterministic and intentionally quiet so background/feature rendering can be inspected without combat pressure. The forced-destruction path is deterministic and bounded so death-to-summary timing can be tested without relying on combat damage. Work order 049 also exposes progression, upgrade readiness, run resource, and sector-plan telemetry in the debug overlay, while work order 059 exposes item count, hook pressure, proc budget state, and build identity, so browser smoke can verify banked scrap, `LUNAR-SURFACE-LANE`, exit, destruction, and hook-heavy item paths without reading private app state. Use these to confirm the debug overlay remains responsive, bullets remain readable in standard and high-contrast modes, screen shake respects reduced motion, distance/speed/destruction counters behave correctly, viewport/HUD/input metrics remain stable, hook applications stay under the 48-item per-event budget, and the round can still be abandoned or summarized.

## Current Boss Phase Volleys

- Auditor Drone XL: starts with a 7-bullet `AUDIT FAN`, then alternates expedited fan/lane warnings under an 8-bullet cap.
- Carrier of Unsold Missiles: starts with 3 `MISSILE LANES`, then accelerates into up to 4 lane/fan volleys.
- The Bloom Engine: starts with a 10-bullet `SPORE RING`, then alternates spiral/fan pressure under a 12-bullet cap.
- Warranty Void Seraph: escalates from `VOID AUDIT` into clause-collapse and null-signature phases with longer telegraphs.
- The Core Wreck: escalates from `CORE SALVO` lanes into reactor breach and `CORE UNSEALED` mixed patterns, capped at 12 bullets.

The debug overlay total entity count includes player, enemies, boss, bullets, pickups, telegraphs, and effects. The split counters report enemies, projectile owner counts, pickups/effects, telegraphs, item count, active hook count, proc cap state, build identity, background plan size, active sector features, viewport/canvas metrics, HUD mode, input mode, and contract theme separately.

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
- Item-storm smoke confirms the current 22-item forced loadout stays below proc caps, but real late-run inventories can still overemphasize unconditional projectile multiplication. Keep future proc-heavy items conditional, budgeted, and visible in the debug overlay.
