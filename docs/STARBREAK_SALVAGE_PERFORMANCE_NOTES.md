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
- Debug counters now report viewport size/class/presentation scale, safe-frame size, and fixed combat world size during gameplay, alongside existing entity, scroll, background, landmark, and hazard counters.
- Pointer guidance uses the same viewport-to-combat-world helper and only stores one current pointer target in the input system, so mouse/touch movement should stay allocation-light in dense combat.
- Player ship appearance rendering remains shape-based canvas work: one selected silhouette path, simple mount primitives, appearance-derived colors, high-contrast substitutions, and a fixed hit-radius ring. New Game previews use static inline SVG primitives derived from the same appearance data, so they add DOM cost only on contract selection screens rather than per-frame gameplay cost.
- The gameplay HUD now derives contract-themed CSS variables and four semantic DOM meters from existing combat state. Meter updates are simple style/attribute changes on persistent elements; avoid replacing the HUD subtree per frame unless profiling shows this is cheap enough.
- The helper is cached by viewport key inside gameplay scenes. Future previews and themed HUD work should reuse the same safe-frame contract instead of introducing parallel window math.

## Debug and Playtest Scenarios

Enable debug tools with `?debug=1` on a local, preview, or Pages URL.

- `1` spawns Auditor Drone XL.
- `2` spawns Carrier of Unsold Missiles.
- `3` spawns The Bloom Engine.
- `4` spawns Warranty Void Seraph.
- `5` spawns The Core Wreck.
- `0` replaces the current field with the dense-combat performance pocket: 12 enemies, 42 enemy bullets, 3 lane telegraphs, and 1 feedback effect, for 59 total active entities including the player.
- `9` replaces the current field with a quiet late-sector long-scroll traversal: 1 active entity, 0 projectiles, 0 pickups/effects, 0 telegraphs, and the current sector's generated background/features at a deterministic late distance.
- `K` forces a debug run summary.

The dense pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget of 80 entities. The long-scroll traversal is deterministic and intentionally quiet so background/feature rendering can be inspected without combat pressure. Use both to confirm the debug overlay remains responsive, bullets remain readable in standard and high-contrast modes, screen shake respects reduced motion, distance/speed counters continue advancing, and the round can still be abandoned or summarized.

## Current Boss Phase Volleys

- Auditor Drone XL: starts with a 7-bullet `AUDIT FAN`, then alternates expedited fan/lane warnings under an 8-bullet cap.
- Carrier of Unsold Missiles: starts with 3 `MISSILE LANES`, then accelerates into up to 4 lane/fan volleys.
- The Bloom Engine: starts with a 10-bullet `SPORE RING`, then alternates spiral/fan pressure under a 12-bullet cap.
- Warranty Void Seraph: escalates from `VOID AUDIT` into clause-collapse and null-signature phases with longer telegraphs.
- The Core Wreck: escalates from `CORE SALVO` lanes into reactor breach and `CORE UNSEALED` mixed patterns, capped at 12 bullets.

The debug overlay total entity count includes player, enemies, boss, bullets, pickups, telegraphs, and effects. The split counters report enemies, projectile owner counts, pickups/effects, telegraphs, background plan size, and active sector features separately.

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
- Mouse controls can accidentally bypass pause/settings focus or undermine keyboard remapping if pointer state does not flow through the input abstraction.
- Contract ship previews and HUD themes can obscure hitboxes or bullets unless high-contrast and reduced-motion settings are checked with each baseline contract. Gameplay ship silhouettes, New Game previews, and the cockpit HUD now keep simple primitives/DOM styling, but manual theme readability checks remain useful across all baseline ships.
- Contract preview and graphical HUD rendering should stay shape-based and cheap until debug/preview smoke shows there is room for richer visuals.
