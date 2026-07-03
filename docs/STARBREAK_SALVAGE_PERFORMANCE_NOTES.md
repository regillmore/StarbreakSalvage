# Starbreak Salvage - Performance Notes

## Projectile Count Budgets

The boss/faction alpha keeps projectile counts intentionally small while the simulator is still shape-rendered and allocation-heavy.

- Common enemies should average 1-3 bullets per attack.
- Boss attacks should stay under 12 bullets per volley in normal alpha play.
- Telegraphs should appear before boss volleys and expire quickly; they count toward debug entity totals.
- A typical active field should stay under 80 total entities during M7.
- Future dense patterns should add pooling only after profiling shows allocation pressure.

## Current Boss Alpha Volleys

- Auditor Drone XL: 7-bullet fan after an `AUDIT FAN` warning.
- Carrier of Unsold Missiles: 3 slow lane missiles after `MISSILE LANES` warnings.
- The Bloom Engine: 10-bullet spiral after a `SPORE RING` warning.

The debug overlay entity count includes player, enemies, boss, bullets, pickups, and telegraphs.
