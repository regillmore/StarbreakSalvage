# Starbreak Salvage - Performance Notes

## Projectile Count Budgets

The boss/faction alpha keeps projectile counts intentionally small while the simulator is still shape-rendered and allocation-heavy.

- Common enemies should average 1-3 bullets per attack.
- Boss attacks should stay at or below 12 bullets per volley in normal alpha play.
- Telegraphs should appear before boss volleys and expire quickly; they count toward debug entity totals.
- Phase changes may swap attack patterns or cadence, but should reset stale telegraphs before showing the next warning.
- A typical active field should stay under 80 total entities during Phase 2 alpha play.
- Future dense patterns should add pooling only after profiling shows allocation pressure.

## Current Boss Phase Volleys

- Auditor Drone XL: starts with a 7-bullet `AUDIT FAN`, then alternates expedited fan/lane warnings under an 8-bullet cap.
- Carrier of Unsold Missiles: starts with 3 `MISSILE LANES`, then accelerates into up to 4 lane/fan volleys.
- The Bloom Engine: starts with a 10-bullet `SPORE RING`, then alternates spiral/fan pressure under a 12-bullet cap.
- Warranty Void Seraph: escalates from `VOID AUDIT` into clause-collapse and null-signature phases with longer telegraphs.
- The Core Wreck: escalates from `CORE SALVO` lanes into reactor breach and `CORE UNSEALED` mixed patterns, capped at 12 bullets.

The debug overlay entity count includes player, enemies, boss, bullets, pickups, and telegraphs.
