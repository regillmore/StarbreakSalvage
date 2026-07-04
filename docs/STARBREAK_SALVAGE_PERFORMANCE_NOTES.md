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

- Normal background rendering should target 3-5 parallax strata per sector.
- Performance mode should collapse to 1-2 strata and reduce decorative particles without changing encounter timing.
- Background plans should be generated once per sector and rendered from deterministic data plus scroll offset.
- Avoid per-frame allocation in background rendering; cache reusable primitives or draw plans when profiling shows pressure.
- Keep normal Phase 3 combat near the Phase 2 active-field budget until long-scroll profiling is available.
- Debug counters currently report distance traveled and scroll speed during gameplay. Future counters should add background primitives, active landmarks, active hazards, enemies, enemy bullets, player bullets, pickups, and effects.
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

- Scroll-synced wave thresholds can double-fire or skip if they are not advanced through fixed-step distance crossings.
- Procedural backgrounds can hide bullets unless palette, contrast, and motion settings are validated per sector.
- Boss scroll locks can strand the player if arena entry, boss defeat, and exit-distance logic do not share one sector-state contract.
- Rich landmarks and hazards may compete with enemies for attention; telegraphs should stay distinct from background motion.
