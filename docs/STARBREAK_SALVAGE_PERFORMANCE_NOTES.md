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
- Avoid per-frame allocation in background rendering; cache reusable primitives or draw plans when profiling shows pressure.
- Keep normal Phase 3 combat near the Phase 2 active-field budget until long-scroll profiling is available.
- Debug counters currently report distance traveled, scroll speed, and planned background primitive count during gameplay. Future counters should add active landmarks, active hazards, enemies, enemy bullets, player bullets, pickups, and effects.
- Long-scroll debug scenarios should test at least one full sector length without requiring a boss defeat.
- Moving backgrounds must be tested in standard and high-contrast modes before increasing bullet density.

## Debug and Playtest Scenarios

Enable debug tools with `?debug=1` on a local, preview, or Pages URL.

- `1` spawns Auditor Drone XL.
- `2` spawns Carrier of Unsold Missiles.
- `3` spawns The Bloom Engine.
- `4` spawns Warranty Void Seraph.
- `5` spawns The Core Wreck.
- `0` replaces the current field with the dense-combat performance pocket: 12 enemies, 42 enemy bullets, 3 lane telegraphs, and 1 feedback effect, for 59 total active entities including the player.
- `K` forces a debug run summary.

The dense pocket is deterministic and intentionally stays below the Phase 2 alpha active-field budget of 80 entities. Use it to confirm the debug overlay remains responsive, bullets remain readable in standard and high-contrast modes, screen shake respects reduced motion, distance/speed counters continue advancing, and the round can still be abandoned or summarized.

## Current Boss Phase Volleys

- Auditor Drone XL: starts with a 7-bullet `AUDIT FAN`, then alternates expedited fan/lane warnings under an 8-bullet cap.
- Carrier of Unsold Missiles: starts with 3 `MISSILE LANES`, then accelerates into up to 4 lane/fan volleys.
- The Bloom Engine: starts with a 10-bullet `SPORE RING`, then alternates spiral/fan pressure under a 12-bullet cap.
- Warranty Void Seraph: escalates from `VOID AUDIT` into clause-collapse and null-signature phases with longer telegraphs.
- The Core Wreck: escalates from `CORE SALVO` lanes into reactor breach and `CORE UNSEALED` mixed patterns, capped at 12 bullets.

The debug overlay entity count includes player, enemies, boss, bullets, pickups, and telegraphs.

## Phase 2 Playtest Risks

- Entity counts are currently shape-rendered without pooling; profiling should precede any bullet-count expansion.
- Route and reward tuning is first-pass and may produce weak or overly generous economy loops.
- Boss telegraphs are readable in smoke tests, but manual checks are still needed on narrow mobile viewports and high-contrast mode.
- Procedural audio uses cue feedback only; music and mix depth remain future work.

## Phase 3 Playtest Risks

- Future scroll-synced hazards, landmarks, and pickup beats should reuse the indexed marker pattern now used for waves; ad hoc threshold checks can still double-fire or skip under frame catchup.
- Procedural backgrounds are deliberately low-alpha, but they can still hide bullets unless palette, contrast, and motion settings are validated per sector.
- Boss scroll locks now share a first-pass arena-state contract, and route-conditioned arena approach lengths are covered by unit tests. Future arena variants can still strand the player if they bypass the release condition or hide remaining support targets.
- Rich landmarks and hazards may compete with enemies for attention; telegraphs should stay distinct from background motion.
