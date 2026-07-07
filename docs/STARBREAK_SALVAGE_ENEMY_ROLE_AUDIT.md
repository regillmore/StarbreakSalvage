# Starbreak Salvage - Enemy Role Audit

Work order 061 baseline. This document records the current normal-enemy behavior before Phase 7 adds explicit role metadata, upgraded variants, formations, and longer-sector pacing. The source of truth remains `src/content/factions.ts`, `src/content/sectors.ts`, `src/game/WaveDirector.ts`, `src/game/CombatState.ts`, and `src/app/CanvasRenderer.ts`; repeatable audit coverage lives in `src/content/enemyRoleAudit.ts` and `tests/unit/enemyRoleAudit.test.ts`.

## Current Summary

- Current normal enemies are effectively four faction-pattern classes: `driftShot`, `laneBurst`, `sporeSpread`, and `phaseSkirmish`.
- Sector `majorWavePool` labels provide encounter flavor and deterministic scheduling, but they do not yet select distinct enemy classes, formations, variants, or attack families.
- All normal enemies share radius `17`, a simple health bar, and base hull `2-3` before route modifiers.
- Normal enemy attacks are now telegraphed through attack-family profiles. Bosses and sector hazards still use their own telegraph timing, while normal enemies use shorter per-role warning labels before firing.
- Objective support targets are counted from `enemiesDestroyed - bossesDefeated`, capped by required normal kills, and completion also requires all spawns issued plus an empty normal enemy field.
- Current kill accounting is robust for projectile kills, body-collision clears, and item side-effect kills. Future retreating, spawned, shielded, or formation enemies need explicit objective policy before implementation.

## Current Faction-Pattern Classes

| Faction | Current class | Phase 7 target role | Silhouette | Movement | Attack cadence | Projectile pressure | Durability |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scrap Court | drift bruiser seed | bruiser | Jagged scrap shard | Enters at 104 units/s, then drifts from spawn lane with heavy lane bias | 1.55s after warning | Fan warning into 2 heavy missile/scrap shots with drift-influenced x velocity | 2 hull early, 3 hull later |
| Corporate Ledger | lane screener seed | screener | Diamond audit frame | Enters at 138 units/s, then tight lane hold | 1.05s after warning | Lane warning into 2 narrow vertical plasma bolts from side offsets | 2 hull early, 3 hull later |
| Bloom Hive | spread controller seed | disruptor | Five-lobed organic cluster | Enters at 96 units/s, then organic x/y sway | 1.60s after warning | Ring warning into 3 slow plasma spores spreading left, center, and right | 2 hull early, 3 hull later |
| Void Corsairs | flank scout seed | scout | Thin needle raider | Enters at 128 units/s, then strong lateral skating with y sway | 0.95s after warning | Fan warning into 2 small phase needles aimed toward the player | 2 hull early, 3 hull later |

## Spawn And Wave Model

- Wave director uses scroll-distance markers when a sector has a scroll plan; otherwise it falls back to time markers.
- First spawns use the sector pacing `firstSpawnXRatio`; later spawns use deterministic flank ratios.
- Target Y comes from default `86-182` bounds, or sector-specific pacing such as Lunar Surface `92-158`.
- Faction choice weights the selected boss faction at `5` and other available factions at `2`.
- Generated wave labels are deterministic and appear in transition/debug copy, but current spawn payloads do not carry role, variant, formation, or reward metadata.

## Sector Wave Labels

| Sector | Current wave labels |
| --- | --- |
| Outer Debris Field | `wreck_gnat_swarm`, `mine_drift`, `salvage_thief_dive`, `turret_scrap_lane` |
| Trade War Corridor | `convoy_crossfire`, `shield_barge_wall`, `barcode_turret_lane`, `credit_minefield` |
| Bio-Machine Bloom | `spore_spiral`, `regenerator_pods`, `corrosion_pools`, `bloom_lattice` |
| Corporate Kill Grid | `beam_warning_grid`, `drone_lockstep`, `mine_checkerboard`, `elite_laser_fan` |
| Lunar Surface | `crater_skim_patrol`, `ridge_shadow_intercept`, `surface_array_crossfire`, `low_orbit_debris` |
| The Core Wreck | `mixed_faction_storm`, `unstable_relic_front`, `final_scrap_curtain`, `core_lockdown` |

These labels are a useful Phase 7 design vocabulary. They should become role, variant, formation, and pacing inputs over time instead of remaining flavor-only strings.

## Role Gaps

- **Scout** - partially represented by Void Corsair lateral skating, but no dive, retreat, flank entry, or fragile-fast stat profile exists yet.
- **Bruiser** - partially represented by Scrap Court heavy shots and later 3-hull spawns, but no broad body, slow hold, shielding, or close-pressure behavior exists yet.
- **Sniper** - not represented by normal enemies. A charged-shot attack family exists for future content, but no normal enemy class uses it yet.
- **Screener** - best represented by Corporate Ledger lane holds, lane warnings, and paired bolts, but normal enemies do not coordinate multi-enemy lane curtains yet.
- **Carrier** - not represented by normal enemies. Carrier fantasy exists in boss naming, not in deploy behavior.
- **Support** - not represented by normal enemies. No shield, heal, buff, or marking state exists.
- **Disruptor** - partially represented by Bloom spread and sector hazards, but no enemy-owned mine, hazard mark, or short-lived zone behavior exists.

## Objective And Soft-Lock Risks

Current objective accounting paths:

- Player projectile kills call the shared defeat path.
- Enemy body collisions call the shared defeat path without pickups or special charge.
- Arc and blast item side-effect kills call the shared defeat path.
- Boss kills increment both `enemiesDestroyed` and `bossesDefeated`, and objective progress subtracts defeated bosses from normal support targets.

Phase 7 risk areas:

- Retreating or despawning enemies can clear the field without increasing required support kills.
- Carrier children can overcount or undercount objective targets if child policy is not explicit.
- Formation break rewards can bypass kill accounting if they are modeled separately from member defeats.
- Shield/support enemies can leave protected targets alive after all spawns have been issued.
- Long sectors can create apparent soft locks if required target counts are tied to enemies that intentionally leave.

Recommended policy for work order 062:

- Add role metadata before behavior changes.
- Add an `objectivePolicy` or equivalent before implementing retreating, spawned, shielded, or formation enemies.
- Keep all kill-like outcomes routed through a shared accounting helper.
- Make non-required enemies explicit rather than relying on despawn cleanup.

## Readability And Performance Risks

- Normal enemies currently have strong faction silhouettes, but no role-specific shape language beyond faction.
- Corporate lane pressure and sector hazards can compete visually if both use rectangular warnings.
- Bloom and lunar palettes need extra high-contrast checks because green projectiles, organic backgrounds, and dust/hazard overlays can stack.
- Void phase bullets are small and may need stronger outlines if scout behavior becomes faster.
- Enemy-rich long sectors should add pressure and relief windows before increasing projectile caps.
- Debug needs active role, variant, formation, and long-sector pressure summaries before Phase 7 raises density.

## Phase 7 Target Role Set

| Role | Pressure type | Intended movement | Intended attack |
| --- | --- | --- | --- |
| Scout | pursuit | Fast entry, shallow dives, retreats, and flank probes | Light single shots or short aimed taps |
| Bruiser | attrition | Slow lane pressure, broad bodies, and predictable holds | Few heavy shots or close-range volleys |
| Sniper | burst | Holds aim lines and repositions between charged attacks | Telegraphed aimed shot with clear windup |
| Screener | lane | Lane holds, columns, and horizontal screen control | Paired bolts, curtains, or short lane warnings |
| Carrier | support | Slow protected entry with deploy or escort timing | Spawn drones, mines, or delayed payloads |
| Support | support | Hover near allies, retreat when isolated, keep readable spacing | Shield, heal, pulse, buff, or mark rather than direct bullet spam |
| Disruptor | hazard | Sets short-lived danger zones, then relocates or exits | Hazard marks, mines, or route-condition pressure |

## Work Order 062 Handoff

Implemented metadata fields:

- `role`
- `pressureType`
- `movementFamily`
- `attackFamily`
- `variantEligibility`
- `formationEligibility`
- `readabilityTier`
- `factionFit`
- `objectivePolicy`
- `classId`
- `debugLabel`

Work order 062 adds these fields to the current faction-pattern classes and validates them through content tests. Runtime behavior is unchanged: attack family still matches the current faction `enemyPattern`, and all current normal enemies use `objectivePolicy: requiredTarget`.

Work order 063 consumes `movementFamily` metadata through `src/systems/EnemyMovement.ts`. Bruiser, screener, disruptor, and scout movement now differ in play; variants, formations, and objective policy remain unchanged.

Work order 064 consumes `attackFamily` metadata through `src/systems/EnemyAttack.ts`. Bruiser, screener, disruptor, and scout attacks now have distinct cooldowns, telegraph durations/labels, aim styles, projectile speeds/radii, tags, and bounded projectile counts. Future charged-shot, lane-curtain, deploy-burst, support-pulse, and hazard-mark families are profiled but not assigned to shipped normal enemy classes yet.

Suggested next tests:

- Wave labels can be audited against intended role, variant, or formation families.
- Objective policies reject retreating/spawned/formation enemies without explicit target accounting.
- Debug smoke can assert active role counts once enemy-rich Phase 7 scenarios land.
