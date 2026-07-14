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
- Boss arena plans are generated once per boss-gated sector. Arena approach slows scroll, locked arenas hold distance at explicit zero speed, and the final hazard schedule preserves full telegraph/active spans while fitting every clear event before lock. Boss fights and their release lanes therefore contain no hidden or deferred hazard work.
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

Work order 117 replaces work order 045's beacon/corridor and visible toast with the already-rendered contract ship, one transformed player draw, at most five fixed speed-line strokes, scaled existing exhaust primitives, a HUD opacity/translate transition, and two closing-aperture rectangles. It allocates no particle field or gameplay actor, does not advance the frozen sector camera, and completes in 1.72 seconds normally or 0.96 seconds with reduced motion. Reduced motion removes speed streaks and caps the exhaust expansion while retaining the same route/reward/finale handoff.

The work order 117 release build emits 847.20 kB minified/229.35 kB gzip initial JavaScript and 31.96 kB CSS/7.19 kB gzip. This is a 1.00 kB minified/0.45 kB gzip initial-JavaScript increase and 0.22 kB CSS increase over work order 116. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 118 adds one reverse pass and one final sort over the already bounded per-operation spawn schedule during `CombatState` construction. It adds no frame-time scan, actor, projectile, effect, or timer. The 96-unit lead and 12-unit spacing are distance-only schedule constraints; combat pacing after arrival and all existing entity budgets remain unchanged.

The work order 118 release build emits 847.65 kB minified/229.46 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. This is a 0.45 kB minified/0.11 kB gzip initial-JavaScript increase over work order 117. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 119 resequences the existing bounded hazard list once during scene setup. It adds one small map over two-to-four existing/director entries plus constant-time hashes and lane arithmetic; there is no run-history scan, rejection loop, frame-time RNG, new hazard, actor, projectile, effect, or snapshot field. Runtime hazard budgets and collision/render costs are unchanged.

The work order 119 release build emits 848.84 kB minified/229.84 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. This is a 1.19 kB minified/0.38 kB gzip initial-JavaScript increase over work order 118. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 120 replaces one beam rectangle with one distant immutable world vector plus derived canvas-clipped track and luminous segments. Each projection uses four bounded clipping comparisons; actor collision performs one point-to-segment test per live enemy, boss, and active ally only while the visible beam exists. World/set-piece damage uses at most 24 continuous expanded beam boxes and existing per-target hazard cooldowns; combat actors use a transient keyed cooldown map. Runtime adds one numeric elapsed-seconds entry per currently active beam and constant-time timing arithmetic, with no route-length search or frame-time RNG. Rendering is capped at one faint track stroke, four layered beam strokes, one leading flare, one entrance marker, one exit reticle, and four track marks. Reduced motion uses two marks, while performance mode removes marks and shadow blur. No particle, projectile, beam entity, RNG stream, save field, or snapshot migration is added.

The refined work order 120 release build emits 858.89 kB minified/232.95 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. This is a 3.42 kB minified/1.06 kB gzip increase over the initially deployed work order 120 beam and a 10.05 kB minified/3.11 kB gzip increase over work order 119. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 121 adds one rectangular canvas clip around the existing balanced gameplay layer. It introduces no per-entity visibility branch, culling scan, extra canvas, offscreen buffer, actor, effect, or render pass; all gameplay draw calls inherit the same native context clip. Background cost is unchanged because passive art remains full viewport. Open-flight enemy projectiles no longer run a horizontal clamp, while boarding performs the former constant-time clamp behind an explicit boundary policy. Existing TTL and ±80-unit cleanup bounds remain unchanged.

The work order 121 release build emits 859.05 kB minified/233.01 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. This is a 0.16 kB minified/0.06 kB gzip increase over work order 120. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 122 retains the already allocated terminal `SectorExitSequenceState` for the scene-handoff frame instead of clearing it. It adds no frame-time scan, render pass, entity, timer, allocation loop, or persisted field; the existing exit guard and presentation calculation run for any delayed frame exactly as they did during the animation.

The work order 122 release build emits 859.10 kB minified/233.01 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. This is a 0.05 kB minified/0.00 kB gzip increase over work order 121. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 123 derives foundry dashboard and component comparison read models only when the DOM scene enters or an explicit draft action rebuilds it. The attack preview reuses one static inline SVG, weapon cues use bounded CSS opacity animation, and resource/output bars are ordinary DOM spans. Reduced motion and performance mode disable the cue animation and decorative filtering. There is no gameplay-loop work, canvas pass, actor, particle, timer, runtime RNG, external asset, production dependency, or persisted field.

The work order 123 release build emits 868.86 kB minified/235.63 kB gzip initial JavaScript and 41.17 kB CSS/8.85 kB gzip. This is a 9.76 kB minified/2.62 kB gzip initial-JavaScript increase and a 9.21 kB minified/1.66 kB gzip CSS increase over work order 122. The CSS growth is isolated to the foundry's responsive visual system; no warning threshold changed and the existing initial-chunk warning remains open.

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
- Work order 070 originally deferred lock overlaps after the boss; work order 124 supersedes that handoff by normalizing the final combined schedule before lock, eliminating post-fight hazard work without per-frame terrain mutation or extra entity pressure.
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
- Work order 115 converts each scheduled mine belt into 4-6 small environment-object actors while retaining the four-zone sector hazard cap. Mine proximity checks share the bounded active-object scan, chain targeting retains the six-reaction event cap, and reduced-motion/performance settings simplify mine presentation without changing fuse, blast, or placement geometry. Debug counts expose active and armed mines so combined environmental pressure can be profiled before cluster density rises.
- Work order 116 adds one static inline SVG title illustration and CSS-only ambient ship/scan/wreckage motion. Reduced-motion and performance modes disable those loops, the launch transition collapses to 80 ms under reduced motion, and leaving the title scene clears every pending launch timer. No image download, runtime generation, canvas entity, save payload, or network work is added.
- Loose currency should use capped active counts and value totals. Start with a budget near current pickup density and raise only after item-storm/enemy-rich smoke remains readable.
- Pickup magnet logic should scan only active pickups/currency and avoid allocating helper objects per frame.
- Debug overlays should expose active hazard-zone count/families, destructible/obstacle count, loose currency count/value, pickup cap state, and environmental stress-budget state.
- Performance mode may reduce hazard animation detail, destructible debris, pickup trails, and loose currency sparkle density, but must not change generated timing, collision shapes, or economy values.
- Reduced motion should lower environmental animation and travel streaks while preserving telegraph clarity.
- High-contrast mode should outline bullets and keep hazard/destructible/currency cues distinct from projectile warnings.
- The work order 124 boss-approach settlement rule is the current performance/readability requirement: hazards keep their warning and active spans, clear before lock, and cannot restart after release.

## Phase 9 Second-Act Budget Targets

Phase 9 expands run length with a second act. Keep the expansion measurable and mostly generation-time before increasing moment-to-moment density.

- Act plans should be generated once from seed plus save state, then consumed by route, sector, reward, shop, boss, summary, and debug systems. Do not use per-frame randomization to decide act structure.
- Act II should feel more dangerous through route choices, objectives, pressure windows, encounter mix, environmental modifiers, and reward stakes before raising raw projectile or entity caps.
- The inter-act junction should be a bounded DOM scene with stable focus and static view models. Avoid rebuilding heavy card trees during animation or every frame.
- Act II route cards should stay concise enough for narrow viewports, keyboard-only flow, and high-contrast mode; preview density should not become a layout stress test.
- Longer two-act runs should not imply higher sustained active-entity budgets. Use relief windows, debug shortcuts, and finale gates to keep playtest time bounded.
- Act-aware pressure summaries should expose enemy role, variant, formation, hazard, object, loose-currency, item-hook, projectile, and telegraph budgets together before density increases.
- Economy expansion should be measured through deterministic summaries: Act I income, junction changes, Act II income, loose currency, shops, repairs, rerolls, and banked scrap.
- Work order 087 keeps that measurement in pure economy helpers and unit snapshots instead of per-frame scene state: rewards, shops, routes, loose-currency plans, summary copy, and save accounting all consume explicit act/save context.
- Second-act bosses/finales should reuse existing boss arena, phase, hazard-release, and summary contracts unless profiling justifies a new path.
- Debug smoke should be able to reach the inter-act junction, Act II pressure, and finale without a full manual run.
- Work order 088 keeps finale variants as deterministic boss-hull and arena-approach modifiers on the existing combat path, with an `F` debug shortcut for final-boss smoke; do not raise projectile, telegraph, object, or pickup caps for finale variants without a fresh stress pass.
- Work order 089 adds `J`, `I`, and `Y` Act II smoke shortcuts around the existing `F` finale smoke. These shortcuts rebuild deterministic run/session state, apply bounded debug resources and a deterministic junction choice where needed, and expose route tags plus objective state in the public debug overlay instead of relying on private app state.
- Work order 090 closes the local Phase 9 gate with 66 passing test files/379 tests, all 11 Chromium smoke paths, and HTTP 200 preview checks for `/StarbreakSalvage/` plus its hashed CSS and JavaScript assets. Manual non-Chromium, real-device, and deployed-browser profiling remains open.

## Phase 10 Expedition And Shipcraft Budget Targets

Phase 10 adds more lived play per run. The roughly six-minute Phase 9 baseline is shorter than intended, but the remedy is generated mission capacity and consequential branches rather than global slowdown, repeated waves, higher hull, or permanently higher density.

- Generate expedition graphs, mission schedules, rival plans, crew offers, and starting loadouts once from explicit seed/save context. Runtime decision events select already-valid branches or use named RNG forks; they must not add frame-time randomness.
- Target roughly 12-20 minutes of baseline expedition capacity through mission stages, optional branches, relief beats, foundry choices, and set pieces. Treat this as a structural target until full playtests justify tighter timing.
- Work order 091 generates the graph once after existing run content. Its 30-node required projection targets 962 seconds (about 16.0 minutes); ten optional nodes bring the all-branch target to 1182 seconds (about 19.7 minutes). Work orders 092-099 make stages and optional paths executable; the deployed all-optional run measures about 12 minutes, so authored capacity remains a ceiling rather than active-play time.
- Mission transitions must clean up or deliberately carry actors, projectiles, telegraphs, hazards, environment objects, loose currency, allies, and event subscriptions. Completed stages must not accumulate invisible per-frame work.
- Multi-part set pieces need caps for active components, collision shapes, turrets, projectiles, debris, effects, and reward events. Broad-phase checks should precede any increase in active geometry.
- Modular ship resolution belongs outside the hot loop where possible. Cache legal loadout stats and hook registries after foundry commits instead of recomputing compatibility, power, mass, or recipe graphs every frame.
- Item and module hooks need one ordered dispatch path and shared proc/effect/projectile budgets. Weapon evolution must not bypass the existing item-storm safety contract.
- Ally AI should use bounded target selection and command cadence. Do not perform unbounded all-pairs scans among enemies, set-piece parts, pickups, and crew every tick.
- Faction, rival, crew, engineering, and mission history should emit compact typed events into a bounded local timeline. No telemetry, network calls, or unlimited save growth.
- Foundry, loadout, briefing, faction, crew, and timeline UI should render from static view models on scene entry or committed state changes, not rebuild large DOM trees every animation frame.
- Scenario Lab stress readouts should expose expedition node/stage, active set-piece parts/shapes, allies/targets, item/module procs, projectiles/telegraphs, environment objects, loose pickups, timeline events, and cleanup state together.
- Performance mode and reduced motion may simplify backgrounds, debris, subsystem effects, ally trails, and transitions, but must not change mission timing, collision geometry, target selection, branch results, or generated content.

Phase 10 closeout: work order 100 finds no severe performance blocker in automated functional smoke. `npm run verify:release` covers 79 test files/463 tests, 12 Chromium paths, the production build, and repeatable Pages-base/hashed-asset preview checks. Manual sustained frame-time/allocation profiling remains open. The main bundle is 657.78 kB minified (177.71 kB gzip) and the largest integration modules are `CombatState`, `contentValidation`, `CanvasRenderer`, `GameApp`, and `GameplayScene`; warning-limit changes are not an acceptable substitute for measured Phase 11 seams and code splitting.

## Phase 11 Voyage Budget Targets

- Preserve the measured approximately 12-minute all-optional Phase 10 path as a compatibility/extraction floor.
- Target 20-30 minutes for a standard frontier victory and 30-45 minutes for completionist structural capacity, with paused time reported separately.
- Versioned run snapshots should remain compact stable-id/event/checkpoint records. Measure serialized bytes and restore latency at act, mission, foundry, carrier, boarding, front, crew, fleet, and apex boundaries.
- Endurance fixtures must report active actors, projectiles, telegraphs, effects, objects, pickups, allies/fleet, subscriptions/hooks, and bounded history sizes after every transition.
- Multi-operation sectors may increase total encounters but must not increase sustained active-field caps merely because the run is longer.
- Carrier, operational-map, faction-front, crew-arc, and summary DOM should build from static read models on committed state changes, not per animation frame.
- Boarding must reuse or deliberately translate fixed-world collision, objective, reward, item/module, and cleanup budgets rather than introduce uncapped room-local systems.
- Faction fronts, crew arcs, carrier history, fleet state, and apex persistence need explicit display and processed-id caps before content volume grows.
- Fleetcraft must share ally target-query, projectile, effect, command, and objective budgets. Profile the combined player + three crew + support craft + set-piece case before raising any cap.
- Apex hunts may persist damage and decisions across nodes, but each active encounter still obeys one boss/set-piece geometry and projectile budget contract.
- Measure dynamic-import changes by emitted initial bytes, gzip bytes, request count, and startup smoke. Do not increase Vite's warning threshold to claim improvement.
- Reduced motion/performance may simplify carrier, frontier, boarding, fleet, and apex presentation but must not change geometry, target selection, snapshot state, or campaign outcomes.

Work order 101 baseline: snapshot JSON is capped at 512 KiB, written only at safe briefing/operation/manual-suspend boundaries, and validated through regenerated plan identity rather than every frame. The public endurance harness supports 1-32 cycles; each cycle restores eight Scenario Lab boundaries plus the finale and reports snapshot bytes, timeline/faction/crew/engineering history, item count, set-piece component count, and pending engineering actions. Snapshot state contains no canvas, audio, DOM, callback, or live combat-entity data. Resume from gameplay therefore restarts the current operation at its safe checkpoint.

The first measured split moves Scenario Timeline (1.52 kB minified/0.69 kB gzip), Scenario Lab UI (2.89/1.24 kB), and Scenario setup (5.39/2.21 kB) behind debug-only dynamic imports: 9.80 kB minified total. Core snapshot/resume adds more than that split removes from startup, so the initial JavaScript is 663.24 kB minified/179.38 kB gzip versus 657.78/177.71 kB at work order 100. This +5.46 kB/+1.67 kB change is accepted as core functionality, not optimization success. The Vite warning remains active; work order 102 and later extraction should keep measuring initial bytes, lazy bytes, request count, snapshot size, and restore cost.

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
- `J` jumps to the inter-act junction with deterministic Act I/Act II handoff state.
- `I` jumps to the first Act II sector with a deterministic junction choice applied and act-pressure telemetry visible.
- `F` jumps to the Act II final-sector boss smoke.
- `Y` opens a two-act debug summary with Act I/Act II route history, route tags, junction history, economy rows, and finale copy.
- `B` opens the eight-card Scenario Lab for expedition, optional mission, foundry, set-piece, rival, crew, combined pressure, and bounded timeline fixtures. Explicit gameplay remaps take priority if they use the same key.
- `K` forces a debug run summary.

The item-storm pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget while exercising every registered hook surface through a large forced loadout. The dense pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget of 80 entities. The enemy-rich pocket is deterministic and stays below that same budget while making role, variant, formation, projectile, telegraph, and long-sector pacing telemetry visible in one browser path. The environmental stress pocket is deterministic and bounded so hazard-family labels, environment object counts, destructible/obstacle splits, loose-currency caps, and environmental budget state can be inspected without combat pressure or private app-state reads. The Act II shortcuts are deterministic and route through generated act, route, pressure, finale, and summary read models so second-act state can be inspected without a long manual run. The long-scroll traversal is deterministic and intentionally quiet so background/feature rendering can be inspected without combat pressure. The forced-destruction path is deterministic and bounded so death-to-summary timing can be tested without relying on combat damage. Work order 049 also exposes progression, upgrade readiness, run resource, and sector-plan telemetry in the debug overlay, while work orders 059, 079, and 089 expose item count, hook pressure, proc budget state, build identity, environmental stress state, route tags, objective state, and Act II smoke paths, so browser smoke can verify banked scrap, `LUNAR-SURFACE-LANE`, exit, destruction, hook-heavy item paths, enemy-rich stress, environmental stress, and second-act flow without reading private app state. Use these to confirm the debug overlay remains responsive, bullets remain readable in standard and high-contrast modes, screen shake respects reduced motion, distance/speed/destruction/objective counters behave correctly, viewport/HUD/input metrics remain stable, hook applications stay under the 48-item per-event budget, enemy projectile/telegraph budgets stay under the Phase 7 stress caps, environmental objects stay under the 16-object stress budget, loose pickups stay under the 48-pickup/120-value caps, and the round can still be abandoned or summarized.

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
- Boss-gated sectors finish hazards before arena locks; future hazard density increases must retain enough approach room for full warning/active spans rather than moving pressure after the boss.

## Phase 8 Playtest Risks

- Rich hazard zones can hide bullets or player hit feedback if their active fills, warning outlines, and background motion share too much contrast.
- Obstacle layouts can accidentally become hard walls if safe-lane validation misses spawn corridors, exit corridors, boss locks, or hazard overlap.
- Destructible rewards and loose currency can inflate scrap/credit income. Keep source/value telemetry visible before raising drop rates.
- Pickup magnet behavior can feel different across window sizes if it uses presentation coordinates instead of fixed combat-world coordinates.
- Chain reactions can create runaway pickups, effects, or item hook dispatch if caps are not enforced in the same event path.
- Environmental density can combine badly with enemy-rich and item-storm paths. Test hazard/destructible/currency stress independently first, then combine intentionally.

## Phase 9 Playtest Risks

- Two-act runs can become tiring if Act II only adds distance. Use midpoint choice, relief windows, route identity, and finale pressure to make the extra length meaningful.
- Act generation can break seed reproducibility if act state is split between run generation, save data, and scene-local flags. Keep act plans explicit and serializable.
- The inter-act junction can confuse resource accounting if repair, shop, reward, and risk choices apply outside the same deterministic transition path.
- Act II rewards and loose currency can inflate banked scrap or shop power. Work order 087 now tracks Act I and Act II income separately in summaries and snapshots; keep using those before increasing drop rates.
- Act II pressure can hide bullets if enemy formations, hazards, obstacles, and item effects peak together. Work order 089 adds browser smoke for Act II pressure under high contrast, reduced motion, performance mode, and a narrow viewport; keep using combined budget telemetry before raising caps.
- Second-act boss arenas must preserve the pre-lock settlement invariant so finale transitions and post-boss lanes remain hazard-free.

Work order 124 adds one bounded reverse pass over at most four final hazard entries during scene-plan construction. The pass preserves each telegraph and active span, applies a 12-unit inter-window gap and 18-unit lock clearance, and may drop an entry only if the complete window cannot fit before distance zero. It removes runtime release-window reconstruction and adds no frame-time search, hazard, actor, effect, timer, RNG call, or persisted field.

The work order 124 release build emits 868.72 kB minified/235.53 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. This is a 0.14 kB minified/0.10 kB gzip decrease from work order 123 because the former runtime deferral path was removed. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 125 changes only the activation policy applied to existing window-level pointer events. Viewport mapping already clamps to the arena, guidance already normalizes one vector, and combat already clamps the player radius, so outside-frame movement adds no listener, frame-time query, entity scan, allocation class, RNG call, render primitive, save field, or snapshot field. Pointer-move cost and fixed-step movement cost remain constant; dense-combat profiling is unaffected.

The work order 125 check build emits 868.79 kB minified/235.57 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. This is a 0.07 kB minified/0.04 kB gzip increase from work order 124 for the explicit pure viewport-pointer state mapper. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 126 adds one bounded clause filter when a mission combat projection is created. The current objective catalog has at most three clauses, and the result is reused by the existing objective progress path; no per-frame filter, actor scan, spawn, forced cleanup, RNG call, render primitive, save field, or snapshot field is added.

The work order 126 check build emits 869.37 kB minified/235.78 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. This is a 0.58 kB minified/0.21 kB gzip increase from work order 125 for the pure objective projection and regression-facing copy. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 127 reuses the existing ally readiness gate, global projectile array, and single active set-piece component list. Only an ally whose fire cooldown has elapsed scans the current 7-8-component assembly; the existing per-shot scan of at most 24 ordinary enemies remains the fallback. Collision replaces duplicated player set-piece handling with one shared helper and adds the same bounded component pass for ally shots. No actor, projectile, effect, proc, reward, RNG, save, snapshot, or content cap changes.

The work order 127 check build emits 869.75 kB minified/235.88 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. This is a 0.38 kB minified/0.10 kB gzip increase from work order 126 for visible-component acquisition and shared projectile damage routing. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 128 builds the attack range only when Hardpoint Control enters or an explicit draft action rebuilds the DOM. The pure plan reuses the production weapon factory plus installed engineering and owned-item hooks, bounded by the shared proc budget, then caps the source volley at 12, cadence copies at 6, and rendered projectile nodes at 48. Item dispatch occurs only at this event-driven rebuild boundary and does not enter the fixed-step loop. Normal mode uses compositor-friendly transform/opacity CSS animation without a scene update or JavaScript timer. Reduced motion removes movement while retaining trajectory samples; performance mode additionally hides echo copies and removes glow. No combat actor, canvas draw, runtime RNG, external asset, dependency, save, or snapshot field is added.

The work order 128 check build emits 872.73 kB minified/236.85 kB gzip initial JavaScript and 43.09 kB CSS/9.23 kB gzip. This is a 2.98 kB minified/0.97 kB gzip JavaScript increase and 1.92 kB minified/0.38 kB gzip CSS increase from work order 127 for the shared projectile factory, hook-derived flight plan, accessible projectile metadata, and responsive firing-range presentation. No warning threshold changed; the existing initial-chunk warning remains open.

The post-deployment correction samples at most six sequential source volleys so periodic item effects are visible, stopping before the same 48-node ceiling. The check build emits 872.99 kB minified/236.97 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. The existing chunk warning and thresholds are unchanged.

Work order 129 adds nine small authored placement arrays and chooses one layout once during sector generation. Combat setup builds one map for the selected seven or eight placements, then creates the same bounded component state used before; fixed-step collision, targeting, rendering, and subsystem behavior add no new actor or scan. The forward-fire interval search runs only during content validation and tests across at most eight components per objective. Mission projection carries an existing layout id rather than rerolling it. No frame-time RNG, runtime adaptive layout, projectile, effect, reward, save, snapshot, external asset, or dependency is added.

The work order 129 release build emits 877.56 kB minified/237.92 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. This is a 4.57 kB minified/0.95 kB gzip initial-JavaScript increase over the corrected work order 128 build for nine authored layouts, plan/read-model identity, and conservative validation. No warning threshold changed; the existing initial-chunk warning remains open.

Work order 130 changes the locked-arena request from edge-triggered suppression to a level signal acknowledged by the existing `bossSpawned` flag. It adds no poll, actor, schedule pass, entity scan, allocation, RNG call, timer, render primitive, content entry, save field, or snapshot field; the same two arena updates and one boss spawn path run per applicable frame.

The work order 130 release build emits 877.54 kB minified/237.92 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. This is a 0.02 kB minified decrease with unchanged gzip/CSS measurements relative to work order 129. No warning threshold changed; the existing initial-chunk warning remains open.

## Work order 131 apex-presentation budgets

Work order 131 preserves three threat states, twelve immutable contacts, 64/128 history/event ceilings, the three-escort cap, the two-hazard cap, and the single existing boss actor. Each applicable `GameplayScene` derives one small contact presentation at construction; the six-second banner performs one time comparison during existing HUD synchronization. A contact floors the already bounded apex escort projection at one marked formation and at most three, uses a deterministic existing enemy variant, and adds no actor type, targeting loop, projectile store, effect pool, RNG stream, or per-frame dossier fold. Non-finale marked contacts now count for ordinary field resolution.

The selectable dossier remains lazy and rebuilds bounded DOM only on scene entry or one of three threat-tab selections. Each projection contains four contacts, three subsystem meters, four evidence cards, four finale-pressure cards, and at most three supported disposition cards with small source lists; no dossier model runs during combat. The work order 131 release build emits 888.05 kB minified/241.25 kB gzip initial JavaScript, 51.55/10.82 kB CSS, and a 9.72/2.99 kB lazy Apex Dossier. Relative to work order 130, initial JavaScript increases 10.51/3.33 kB, CSS increases 8.46/1.59 kB, and the lazy dossier increases 7.15/1.92 kB for the authored contact/evidence model and responsive presentation. No warning threshold changed; the existing initial-chunk warning remains open.

- The first finale pass adds hull/approach pressure and summary/unlock hooks, not new projectile families; remaining work should keep profiling the `F` finale smoke alongside enemy-rich, environmental stress, and the `Y` two-act summary before adding denser final-phase attacks.

## Phase 10 Playtest Risks

- A deeper expedition can still feel padded if mission stages reuse the same kill quota. Require distinct verbs, branches, physical goals, and consequences before increasing nominal duration.
- Mission cleanup bugs can leave invisible actors, timers, hooks, or event listeners alive across stages and create sustained slowdown or duplicated rewards.
- Modular frames, items, evolved weapons, crew traits, and foundry affixes create a combinatorial proc surface. Shared hook ordering and caps must land before catalog volume grows.
- Multi-part set pieces can turn collision and draw costs from entity-linear into part-heavy scans; keep part/shape budgets explicit and test combined hazard/projectile pressure.
- Ally AI can create target thrash, path overlap, friendly visual noise, or objective attribution bugs. Bound scans and preserve non-color-only ally cues.
- Faction/rival recurrence can corrupt determinism if runtime outcomes consume unrelated RNG streams. Decision history and named forks must be explicit.
- A bounded run timeline can still bloat saves or summaries if verbose payloads are retained. Store stable ids and compact numeric outcomes, then resolve display copy from content tables.
- The measured 12-minute completionist path reaches the structural floor but remains unbalanced. Full-run fatigue, economy, difficulty, optional-node value, and content repetition need later human playtests across fresh and progressed saves.

Work order 096 establishes the first set-piece budgets: each assembly has 7-8 components, no more than 3 hangar reinforcements, at most 18 live actor projectiles, 20-22 authored debris budget slots, 24-26 actor effect slots, and 24 reward pickups. Runtime currently uses the shared global 80-effect ceiling and loose-currency active caps in addition to the actor reward ceiling. Component scans remain a single bounded pass over one active assembly, and reduced-motion/performance modes change draw detail without changing collision count, geometry, cooldowns, or stage timing. Work order 099 now supplies the repeatable combined late-run item/actor/hazard smoke fixture; sustained frame-time profiling remains manual.

Work order 097 keeps faction planning and campaign folding outside the hot loop. Each run has four rival plans, at most one eligible rival added to a sector schedule, and each archetype allows only 3-4 appearances with a 2-3 sector recurrence gap. Campaign history retains 64 compact display entries and 128 processed event ids; route, shop, briefing, summary, and debug copy derive from one influence read model when those surfaces are built. A rival reuses the global enemy/projectile/effect budgets and never adds its own unbounded actor loop. The `R` fixture remains the isolated recurrence smoke; work order 099 adds faction/rival state to the combined public setup and retains a separate returning-rival launch card.

Work order 098 caps combat deployment at three wingmates within resolved loadout command headroom. Each active ally performs one movement update and, by command, queries no more than 24 enemies, 32 hostile projectiles, or 24 pickups; it never performs an all-pairs actor scan. Ally fire reuses the global projectile list and adds no independent effect pool, while command changes use a 0.35-second gate. Crew history retains 64 compact entries and 128 processed ids, with roster/loadout resolution outside the hot loop. The `T` fixture isolates ally HUD, rendering, and commands; work order 099 combines the same bounded three-ally state with set-piece, item-hook, hazard, and loose-pickup pressure.

Work order 099 makes that combined target repeatable through public setup models. Its gameplay fixture starts from the existing enemy-rich budget (10 enemies, 36 hostile bullets, 4 telegraphs, 2 effects) and environmental budget (6 objects, including 4 destructibles and 2 obstacles; 10 loose pickups worth 32; 2 effects), then retains the generated 7-8-component station assembly, up to three bounded allies, and the 23-item/48-applications-per-event hook contract. Set-piece caps remain 3 reinforcements, 18 actor projectiles, 20-22 debris, 24-26 actor effects, and 24 reward pickups; the shared effect ceiling remains 80. The overlay reports actual enemies, allies, projectiles, set-piece parts, proc budget, environment, pickups, timeline categories, and latest entries rather than assuming every cap is saturated. Timeline storage is capped at 96 display entries and 192 processed ids and is discarded with the run session. The narrow Chromium path passes at 390x700 under high contrast, reduced motion, performance mode, and keyboard-only operation, but this is functional smoke rather than a frame-time benchmark. Work order 100 carries bundle splitting and manual sustained-run profiling into the explicit Phase 11 foundation rather than treating the warning as a Phase 10 blocker.

## Phase 11 operational-map budgets

Work order 102 increases structural duration by creating more bounded combat instances, not by increasing per-frame entity limits or global durability. Each sector has two required and at most two optional operations. Every transition disposes the previous `GameplayScene`; the operational ledger records zero retained actors, projectiles, and hooks plus a settled payout flag, while its processed ids/history are capped at 64. Detour influence scales the gate world to 0.90 length/0.80 waves; pursuit influence scales the next advance to 1.12 length/1.20 waves. These multipliers still flow through existing wave, hazard, object, projectile, effect, and hook caps.

The generated ten-sector graph projects 1458 required-route seconds and 1898 all-optional seconds. These are authored duration bands, not deployed stopwatch measurements; full-run fatigue, allocation behavior, and actual duration remain manual evidence after deployment. Snapshot size remains capped at 512 KiB and now includes bounded operational history.

Work order 102 raises initial JavaScript from 663.24 to 678.74 kB minified (179.38 to 183.34 kB gzip) and CSS from 25.92 to 26.76 kB. The three Scenario Lab chunks remain approximately 1.52, 2.89, and 5.39 kB minified. No warning limit changed; further `GameApp`, combat, renderer, validation, and low-frequency UI extraction remains planned.

## Phase 11 Null Frontier budgets

Work order 103 extends the same bounded graph from ten to fifteen sectors: 75 required nodes, 30 schema-v2 optional records, and three act gates. Work order 134 makes only the 15 post-gate pursuits executable in fresh schedules; the other detours remain checkpoint compatibility records. Node duration estimates therefore project 1,689 standard seconds (28.15 minutes) and 1,944 all-executable-optional seconds (32.40 minutes). This is an authored structural estimate, not a frame-speed reduction: fixed-step simulation, player/enemy speeds, projectile caps, boss hull rules, and operation cleanup remain unchanged.

The five frontier backgrounds use three existing primitive layer kinds apiece and add no bitmap assets. Environmental laws fold into the existing sector-condition plan once per sector, route and mission content remains data-only, and the three new bosses reuse the existing bounded phase/pattern families. Snapshot v3 adds one compact frontier decision record while retaining the 512 KiB cap. Deployed stopwatch timing, sustained allocation, and frontier palette readability remain manual evidence after release.

The work order 103 production build emits 704.95 kB minified/189.45 kB gzip initial JavaScript and 26.76 kB CSS. The three lazy Scenario Lab chunks remain 1.52, 2.89, and 5.39 kB minified. This is a 26.21 kB minified/6.11 kB gzip initial-JavaScript increase over work order 102. No size-warning threshold changed; `NullFrontier`, low-frequency frontier UI, and additional `GameApp` orchestration are candidates for later lazy extraction.

## Phase 11 carrier budgets

Work order 104 keeps one carrier state per run with exactly four facility records, capacity-checked cargo, at most 64 display history entries, and 128 processed event ids. Influence resolution scans four facilities and bounded cargo only at staging, reward, market, foundry, mission-option, sector-transit, summary, or snapshot boundaries; it does not enter the combat hot loop. Transit consumes no runtime RNG and at most one powered facility can be damaged by an overheat resolution.

The command deck is a lazy production chunk and carries no bitmap assets. Carrier staging does not change the current 1,689/1,944-second executable graph projections because the command action is optional and uses native DOM interaction rather than an inflated combat schedule. Snapshot size remains capped at 512 KiB and endurance reports carrier history/cargo maxima alongside existing engineering/faction/crew/timeline bounds.

The work order 104 production build emits 722.66 kB minified/194.63 kB gzip initial JavaScript and unchanged 26.76 kB CSS. `CommandDeckScene` emits separately at 3.42 kB minified/1.37 kB gzip; existing Scenario Lab chunks remain lazy. The core increase over work order 103 is 17.71 kB minified/5.18 kB gzip for carrier content, reducer, influence consumers, snapshot validation, and orchestration. No warning threshold changed.

## Phase 11 boarding budgets

Work order 105 generates six immutable operations per run. Each operation has four-to-seven rooms, one fewer door than rooms, one custody record, at most three projected hazard windows, and no retained combat actors after settlement. Boarding history is capped at 64 entries and 128 processed ids. Carrier capacity and optional access are resolved at map boundaries; settlement applies cross-system effects once. No boarding reducer enters the fixed-step combat hot loop.

The interior renderer adds two rails, visible door bars, and one label over the existing scene; reduced-motion and performance settings do not change topology, collision padding, target counts, custody, or outcomes. Boarding uses existing enemy/projectile/effect/environment/ally/proc caps. Snapshot size remains capped at 512 KiB, and the ninth Scenario Lab fixture exercises narrow/high-contrast/reduced-motion/performance presentation.

The work order 105 production build emits 744.64 kB minified/201.11 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The Scenario Lab setup chunk grows to 5.86 kB minified/2.38 kB gzip; the timeline, catalog, and command-deck chunks emit at 1.59, 2.88, and 3.42 kB minified. The initial increase over work order 104 is 21.98 kB minified/6.48 kB gzip. No warning threshold changed; boarding content/state and additional `GameApp` settlement orchestration remain candidates for later domain/lazy extraction after Phase 11 consumers stabilize.

## Phase 11 faction-front budgets

Work order 106 keeps exactly one front record per sector, four bounded faction influence values per front, four allegiance values per run, at most 64 display history entries, and 128 processed event ids. One explicit event scans the fifteen-sector plan and can affect only the next four sectors; influence resolution is constant-breadth and occurs at briefing, map, combat setup, market, route, summary, snapshot, or debug boundaries, never per simulation frame.

Hostile fronts add at most three non-objective reinforcement spawns by cloning existing scheduled actors and remain inside shared actor/projectile/telegraph budgets. Front hazard changes reuse `SectorConditions` and existing hazard caps. Map projection copies at most the current branch's option records; it never mutates graph identity. Snapshot remains capped at 512 KiB, and endurance now reports front-history maxima.

The work order 106 check build emits 761.48 kB minified/205.58 kB gzip initial JavaScript and unchanged 26.76 kB CSS. Lazy Scenario Lab setup grows to 6.29 kB minified/2.51 kB gzip; the catalog, timeline, and command-deck chunks remain approximately 2.91, 1.59, and 3.42 kB minified. The initial increase over work order 105 is 16.84 kB minified/4.47 kB gzip. No warning threshold changed; strategy content, snapshot validation, and shared consumer orchestration remain measured candidates for Phase 11 extraction.

## Phase 11 crew-arc budgets

Work order 107 keeps relationship simulation outside the hot loop. A run owns ten three-node arc records, at most ten pair records, five ranks/fates, 96 display-history entries, and 192 processed ids. Combat receives one precomputed influence map: no new ally actor type, targeting scan, projectile pool, or frame-time relationship fold is introduced. Deployment remains capped at three wingmates and existing command headroom. Promotion adds one command cost; paired cadence multiplies cooldown by 0.88 while subtracting one hull; conflict excludes at most one member per hardened pair.

The check build emits 783.95 kB minified/212.03 kB gzip initial JavaScript and unchanged 26.76 kB CSS. Crew Quarters is isolated at 3.67 kB minified/1.42 kB gzip; Scenario Lab setup is 6.71/2.65 kB and its catalog is 2.93/1.25 kB. The initial increase over work order 106 is 22.47 kB minified/6.45 kB gzip for arc content, reducer/state, combat adapter, snapshot validation, summary, and orchestration. No warning threshold changed; `RunSession`, `GameApp`, snapshot validation, and low-frequency summary content remain extraction candidates.

## Phase 11 fleetcraft budgets

Work order 108 preserves the existing ally engine and adds no parallel AI, projectile, collision, effect, or proc loop. Crew plus support craft share a hard four-actor ceiling; ally shots share one 20-projectile ceiling and the existing projectile array. Every actor still scans at most 24 enemies, 32 hostile projectiles, or 24 pickups according to the active formation command. Fleet profile resolution occurs once before combat from at most six craft records, carrier berth strength, assignment, doctrine, and refit. Fleet display history remains capped at 64 entries/128 processed ids.

The check build emits 806.07 kB minified/217.60 kB gzip initial JavaScript and unchanged 26.76 kB CSS. Fleet Bay is isolated at 3.68 kB minified/1.47 kB gzip; Scenario Lab setup is 7.32/2.86 kB, catalog 2.96/1.26 kB, Command Deck 3.75/1.47 kB, and Crew Quarters remains 3.67/1.42 kB. The initial increase over work order 107 is 22.12 kB minified/5.57 kB gzip for support-craft content, state/reducer/influence, shared combat adaptation, snapshot validation, and voyage orchestration. No warning threshold changed; fleet/crew profile assembly, `RunSession`, `GameApp`, snapshot validation, and summary content remain measured extraction candidates.

## Phase 11 apex-hunt budgets

Work order 109 keeps three threat records, twelve immutable encounter records, at most 64 display-history entries, and 128 processed ids. Finale projection occurs once at combat/choice boundaries and caps cloned non-objective escorts at three and hazard pressure at two. Apex bosses reuse the single existing boss actor, projectile/effect storage, arena safe lane, collision, feedback, objective, and reward accounting. Persistent damage is a signed boss-hull delta clamped to -12..+8 with spawned hull never below one; no apex reducer or campaign fold enters the fixed-step hot loop.

The release build emits 827.37 kB minified/223.30 kB gzip initial JavaScript and unchanged 26.76 kB CSS. Apex Dossier is lazy at 2.57/1.07 kB; Scenario Lab setup is 7.81/3.03 kB and the catalog is 2.98/1.27 kB. The initial increase over work order 108 is 21.30 kB minified/5.70 kB gzip for three boss definitions, campaign state/reducer/projection, snapshot validation, HUD/summary/debug integration, and orchestration. No warning threshold changed; `ApexHunt`, `RunSession`, `GameApp`, snapshot validation, and low-frequency summary content remain Phase 11 release-audit extraction candidates.

## Phase 11 release-audit budgets

Work order 110 adds no combat actor, projectile, effect, collision, targeting, or proc path. Three Scenario Lab fixtures reuse existing carrier, frontier, snapshot, and DOM scenes. The duration audit generates two immutable run skeletons only when its debug-only card opens, folds at most 90 executable nodes per profile after the work order 134 paired-hold refinement, and labels its six measurements as structural projections rather than frame-time or stopwatch telemetry. Endurance remains bounded to 32 cycles, seventeen snapshot boundaries per cycle, the 512 KiB snapshot cap, and existing domain history ceilings.

The check build emits 828.55 kB minified/223.52 kB gzip initial JavaScript and unchanged 26.76 kB CSS, an increase of 1.18 kB minified/0.22 kB gzip over work order 109. Release-audit logic and UI emit lazily at 1.78/0.80 and 1.92/0.82 kB; Scenario Lab setup grows to 9.54/3.61 kB and its catalog to 3.04/1.30 kB. No warning threshold changed. Functional Chromium covers combined pressure and all release fixtures, but sustained frame-time/allocation, long-session thermal/battery behavior, and real-device profiling remain manual.

## Work order 132 socket-circuit budgets

Socket reconciliation scans the bounded owned-item list and the two sockets on each installed component only when a run starts, acquires an item, enters/updates the foundry, commits engineering, or projects a hook consumer. Combat receives an already reconciled active list. The existing combined-hook budget remains 48-64 applications, and Signal Clone Stamp copies at most eight source projectiles on each third volley.

Ricochet adds one integer charge and two sidewall comparisons per active player projectile. It adds no spatial search, RNG, recursive hook dispatch, actor pool, or retained effect entity. Hardpoint Control renders one chip per installed socket and one compact card/native selector per owned item; no socket DOM runs during gameplay. Snapshot v10 adds three small scalar fields only for fitted items, while inactive inventory writes explicit null.

The release build emits 897.33 kB minified/243.55 kB gzip initial JavaScript and 53.45/11.22 kB CSS. Relative to work order 131, the socket domain, validation, foundry controls, active-circuit summary, and six mechanic rewrites add 9.28/2.30 kB JavaScript and 1.90/0.40 kB CSS. The existing initial-chunk warning remains open and no threshold changed.

## Work order 133 navigation-hub budgets

Each hub generates exactly six destination records and five transit edges. Generation shuffles five definitions, jitters ten bounded scalar coordinates, and builds a six-node minimum connection tree only when entering the intermission scene; no navigation reducer, geometry, DOM, or RNG enters gameplay simulation. Visit state retains at most six unique ids and resets per sector.

The scene renders one bounded SVG with five lines, six native destination buttons, one details pane, and at most the previous briefing's nine compact intelligence paragraphs. Selecting a node replaces only the bounded details subtree. Reduced-motion and performance modes disable route animation; high contrast changes presentation only. Shop, engineering, fleet, crew, and apex systems remain their existing scenes/chunks and are not duplicated in the map.

Snapshot v11 adds one sector integer and at most six short destination ids. The map name, code, layout, coordinates, and edges are regenerated from seed and sector rather than persisted. The 512 KiB snapshot cap, combat actor/projectile/effect/proc budgets, mission topology, route generation, and fixed-step update remain unchanged.

The release build emits 910.81 kB minified/247.77 kB gzip initial JavaScript and 59.77/12.52 kB CSS. Relative to work order 132, the navigation domain, expanded transition projection, service orchestration, snapshot boundary, and responsive map presentation add 13.48/4.22 kB JavaScript and 6.32/1.30 kB CSS. Existing Fleet, Crew, Apex, Command Deck, and Scenario Lab scenes remain lazy. The initial-chunk warning remains open and no threshold changed; extracting the navigation scene and its low-frequency campaign briefing readers is the clearest follow-up bundle boundary.
