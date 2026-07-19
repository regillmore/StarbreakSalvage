# Starbreak Salvage - Item Catalog Audit

Work orders 051-056 baseline, refreshed by work orders 156, 169, 170, 176, and 177. This document records the active item catalog after the Noita-style circuit pivot retired Boss Pressure from live rotation, moved two economy passives into permanent progression, refilled their active slots, and converted Prototype Vent Script into an ordered stored-heat modifier. The source of truth remains `src/content/items.ts`; repeatable coverage checks live in `src/content/itemCatalogAudit.ts` and `tests/unit/itemCatalogAudit.test.ts`.

## Current Shape

| Measure                 | Current | Phase 6 target                                                                             |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------ |
| Active item definitions | 60      | Seven retired definitions remain for legacy-save compatibility                             |
| Candidate reward pools  | 4       | Starter, ignition core, combat, and vault remain the broad candidate buckets               |
| Weight profiles         | 9       | Starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts are weighted |
| Hook names              | 14      | Includes environment-object destruction alongside combat, route, and economy hooks         |
| Locked item ids         | 7       | Direct item gates plus advanced/classified family-tier gates                               |
| Active family lanes     | 10      | Boss Pressure remains only as a compatibility label for retired items                      |

## Schema Metadata

Work order 052 formalized compact item metadata:

- `family` selects one active lane such as laser/split, curse/relic, lunar/surface, route/economy, or heat/prototype.
- `sources` records current and future acquisition intent, including starter, combat, shop, vault, elite, boss, faction, lunar, route, and unlock.
- `unlockTier` separates baseline, advanced, and explicitly unlock-gated items.
- `implementationStatus` distinguishes live, bridge, and planned effects; bridge/planned entries must explain the gap.
- `retired` preserves an old item definition and hook for snapshot compatibility while excluding it from active pools, audits, and discovery progress.
- `stacking` records unique versus stackable intent before duplicate item rewards become possible.
- `uiTags` gives item cards a short, validated badge vocabulary without parsing gameplay tags.

Validation requires every active item to appear in a compatible reward pool and rejects retired items from live pools. A declared bridge pool may list the valid source lanes it composes; its entries must still match at least one of those lanes. Item pool weight profiles must reference valid pools/sources/rarities/families/tags and a positive optional bias weight, item and family unlock gates must reference valid unlocks and item tiers, every declared hook must have an implementation, and prototype/cursed items stay out of ordinary starter sources.

## Rarity Coverage

| Rarity    | Count | Notes                                                                       |
| --------- | ----- | --------------------------------------------------------------------------- |
| Common    | 14    | Starter-safe bread-and-butter items now cover more families.                |
| Uncommon  | 20    | The largest band and the main source of early variety.                      |
| Rare      | 19    | Broadly represented in combat and vault pools.                              |
| Prototype | 4     | Mostly vault/combat pressure, with `item_overheat_oracle` currently locked. |
| Cursed    | 3     | Vault-only and still a later risk/reward tuning lane.                       |

## Hook Coverage

| Hook                           | Item count | Current role                                                                             |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `onFire`                       | 16         | Volley shaping, drones, split shots, missiles, phase/heat variants, and ordered cadence. |
| `onProjectileSpawn`            | 9          | Projectile tags, size, damage, TTL, and drift shaping.                                   |
| `onEnemyKilled`                | 11         | Salvage payouts, arc/blast follow-ups, overkill/relic rewards.                           |
| `onPlayerHit`                  | 6          | Shield, revenge, armor, and curse retaliation.                                           |
| `onPickupCollected`            | 6          | Credit/salvage pickup shared-reservoir charge.                                           |
| `onGraze`                      | 2          | Near-miss charge/rate/radius effects.                                                    |
| `onSpecialUsed`                | 0          | Reserved hook surface; Prototype Vent Script moved to ordered volley cadence.            |
| `onBombUsed`                   | 1          | Bomb damage, radius, and boss-ratio shaping.                                             |
| `onSectorStart`                | 2          | Lunar entry and sector-start resource effects.                                           |
| `onRouteChosen`                | 4          | Route economy, curse interest, and ambush insurance effects.                             |
| `onShopEntered`                | 1          | Rerolled-shop stock and bias effects.                                                    |
| `onRewardGenerated`            | 3          | Reward choice and tag-bias effects.                                                      |
| `onBossPhaseChanged`           | 1          | One remaining active circuit hook; permanent counterplay moved to the Upgrade Bay.       |
| `onEnvironmentObjectDestroyed` | 1          | Salvage payout from eligible world-object destruction.                                   |

Work order 054 gave the work order 053 hook surface its first live users. Item discovery is currently recorded from run inventory at summary time, so a dedicated collection hook remains optional unless future mid-run archive UI needs it.

## Candidate Reward Pool Coverage

| Pool          | Items | Rarity mix                                   | Notes                                                                      |
| ------------- | ----- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Starter       | 27    | 14 common, 9 uncommon, 4 rare                | Broad safe starter-source catalog; no prototype or cursed entries.         |
| Ignition Core | 9     | 1 common, 4 uncommon, 3 rare, 1 cursed       | Shared one-per-family opening pool; unlock filtering gates the curse core. |
| Combat        | 51    | 14 common, 18 uncommon, 17 rare, 2 prototype | Feeds combat, shop, elite, boss, faction, lunar, and route profiles.       |
| Vault         | 20    | 2 uncommon, 11 rare, 4 prototype, 3 cursed   | Feeds vault plus high-pressure profiles when rare/cursed pressure fits.    |

The broad candidate pools are intentionally small in number; source identity now comes from the weight profile layer rather than separate hard-filtered lists for every surface.

## Weight Profile Coverage

| Profile       | Candidate pools | Primary role                                                                             |
| ------------- | --------------- | ---------------------------------------------------------------------------------------- |
| Starter       | starter         | Broad starter-source generation; common/uncommon-forward, no prototype/cursed weights.   |
| Ignition Core | starterCore     | One seeded opening upgrade, strongly biased by contract and weapon affinity.             |
| Combat        | combat          | Baseline post-sector rewards with moderate rare/prototype pressure.                      |
| Shop          | combat          | Market inventory biased toward shop, route, credit, magnet, heat, and drone entries.     |
| Vault         | vault           | Relic/cursed/prototype-leaning rewards with phase and curse identity.                    |
| Elite         | combat, vault   | Higher-pressure rewards biased toward elite, boss, overkill, missile, and drone entries. |
| Boss          | combat, vault   | Boss rewards favor circuit-ready laser, heat, shield, overkill, and phase entries.       |
| Faction       | combat, vault   | Faction ambush rewards with faction-specific tag bias from boss faction context.         |
| Lunar         | combat, vault   | Lunar Surface rewards biased toward lunar, route, scrap, laser, and phase entries.       |
| Route         | combat, vault   | Repair/shop/glitch-style rewards biased toward route economy and credit flow.            |

Known-seed tests now sample shop, elite, vault, and lunar reward surfaces, and upgrade snapshots cover progressed-save shop/vault behavior.

## Source Metadata Coverage

| Source    | Count |
| --------- | ----- |
| `combat`  | 51    |
| `starter` | 27    |
| `vault`   | 20    |
| `boss`    | 6     |
| `route`   | 6     |
| `lunar`   | 5     |
| `shop`    | 3     |
| `elite`   | 2     |
| `faction` | 1     |
| `unlock`  | 1     |

## Tag Coverage

| Tag        | Count |
| ---------- | ----- |
| `credit`   | 12    |
| `phase`    | 9     |
| `scrap`    | 6     |
| `drone`    | 8     |
| `plasma`   | 10    |
| `shield`   | 5     |
| `curse`    | 5     |
| `heat`     | 7     |
| `armor`    | 4     |
| `arc`      | 5     |
| `laser`    | 5     |
| `magnet`   | 4     |
| `missile`  | 5     |
| `overkill` | 5     |
| `ricochet` | 4     |
| `bomb`     | 3     |
| `revenge`  | 3     |
| `split`    | 7     |
| `relic`    | 2     |

`relic`, `split`, `revenge`, and `bomb` remain thinner tags even though their broader families are now represented.

## Family Coverage

| Family           | Count | Phase 6 note                                                                                                  |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| Laser/Split      | 7     | Harmonic Fork Loom copies the current outer chain rather than a fixed base shot.                              |
| Missile/Overkill | 8     | Boreline Crimper converts an already-built fan's spread into forward speed, impact, and overkill.             |
| Drone/Copy       | 7     | Crossfeed Detonator rewards kills carrying two distinct circuit traits.                                       |
| Shield/Revenge   | 5     | Reached the first expansion target; defensive balance should avoid rewarding intentional damage too strongly. |
| Credit/Shop      | 6     | Coastdown Capacitor turns broad pickup play into a conserved shared-haste reserve.                            |
| Curse/Relic      | 6     | Advanced vault/route entries are locked behind the Relic Thief dossier; risk/reward tuning still needs work.  |
| Phase/Graze      | 6     | Ricochet Branch Coupler extends split and drone branches with a real bounce.                                  |
| Heat/Prototype   | 6     | Plasma Seed Crucible converts an earlier circuit trait into plasma/heat scaling.                              |
| Lunar/Surface    | 5     | Gangue Compression Die converts upstream light branches into denser plasma.                                   |
| Route/Economy    | 4     | Exit Toll moved to permanent scrap progression; four active route-circuit items remain.                       |

The five Boss Pressure definitions and their original hook implementations remain readable to restored snapshots, but they are absent from pools, unlock gates, discovery, stress fixtures, and the active audit. Boss Warning Lattice and Capital Relief Protocol preserve the worthwhile telegraph, delay, charge, and late-phase-clear mechanics as permanent scrap upgrades.

## Archetype Coverage

| Archetype        | Rewarded count |
| ---------------- | -------------- |
| Laser/Split      | 15             |
| Missile/Overkill | 9              |
| Drone/Copy       | 11             |
| Shield/Revenge   | 5              |
| Credit/Shop      | 13             |
| Curse/Relic      | 6              |
| Phase/Graze      | 11             |
| Heat/Prototype   | 14             |

## Former Bridge Effects Promoted In Work Order 132

These former bridge entries now have live, order-sensitive circuit behavior:

| Item              | Current behavior                                                                     | Circuit role                                                                      |
| ----------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Ricochet License  | Gives eligible phase/plasma/ricochet shots one real sidewall rebound.                | Live in work order 132; chains into phase and arc projectile modifiers.           |
| Phase Grazer      | Transforms every fourth complete volley into a phase chain.                          | Live in work order 132; socket order controls which split/clone shots inherit it. |
| Vault Parasite    | Converts cursed/overkill executions into salvage plus blast pressure.                | Live in work order 132; requires an actual tagged execution.                      |
| Cursed Hull Plate | Amplifies retaliation already built before it, adds curse/overkill, and emits a fan. | Live in work order 132; socket order changes the amplified set.                   |

No shipped item is a pure no-op or bridge: current validation requires every declared hook to have an implementation, and work order 132 promoted the final four bridge entries to live mechanics. Work order 052 formalized live, bridge, and planned implementation status in item metadata.

## Ordered heat converter in Work Orders 169-170

Prototype Vent Script now reads the fitted signal chain instead of modifying Special use. Every periodic volley stage earlier than the script changes from every `n`th volley to every `(n+1)`th volley and attempts one heavy heat/plasma shot on that completed cycle. A funded attempt spends 32% of the weapon's overheat capacity from heat stored before the ordinary volley; a cool reserve skips the shot and displays non-damaging exhaust. One carried budget prevents simultaneous stages from double-spending it. A script placed before a periodic stage has no effect on it. The shared cadence and heat-event payload drives combat hooks, Contract/Hardpoint live-fire previews, and the explicit cadence/cost line on each affected Hardpoint card; later stages can still transform a funded heat shot in normal circuit order.

## Permanent economy and conserved haste in Work Order 176

Exit Toll Transponder is now a permanent 9 kg Salvage upgrade rather than an active run item. Its retired catalog definition and sector-start hook remain only for restored snapshot compatibility. Coastdown Capacitor occupies the released rare combat/route slot: either currency pickup adds 0.55 seconds to the shared haste reservoir, and releasing fire pauses drain. It adds capacity as one distinct source but never strengthens the standard active haste cadence. This shifts one active item from Route/Economy and `scrap` into Credit/Shop and `heat` without changing the 60-item active breadth target.

## Permanent Coupon Cascade and Boreline chain in Work Order 177

Coupon Cascade Fuse is now a permanent 10 kg Market upgrade gated by Market Decoder. Its retired catalog record and `onShopEntered` reducer remain only for restored run snapshots; shop generation gives a legacy fitted copy precedence over the permanent flag, preserving the exact one-credit discount and credit-stock bias without double application. The permanent effect is passed explicitly into shop generation but excluded from the expedition-wide generation fingerprint, so installing it changes deterministic market stock without reshuffling contracts, routes, sectors, or run duration.

Boreline Crimper occupies the released common starter/combat/shop slot. It affects only off-axis projectiles already present at its `onFire` stage: lateral velocity falls to 58%, forward velocity rises by 12%, impact rises by 18%, and the branch gains `overkill`. A Crimper after Split Prism, Needle Splitter, a missile splinter, or another fan stage therefore compresses every available branch; one placed before a splitter cannot retroactively modify shots that do not exist yet. It adds no projectile, counter, RNG draw, or separate preview implementation.

## Permanent Ore Scrip and Gangue chain in Work Order 179

Low-Orbit Ore Scrip is now an 8 kg Navigation upgrade gated by Route Ledger Uplink. Its retired catalog record and `onRouteChosen` reducer remain only for restored snapshots; route settlement gives the legacy fitted copy precedence over the permanent flag, preserving exactly one credit after Shop/Repair destinations. The route-local flag is excluded from the expedition-wide generation fingerprint and supplied only at settlement, so it does not reshuffle seeded content.

Gangue Compression Die occupies the released common starter/combat/lunar/route slot. At its ordered `onFire` stage it finds the current peak projectile damage and compacts only shots below 90% of that reference: 90% velocity, 130% damage, +1 radius, +0.18 seconds of life, and a `plasma` trait. Split Prism and other earlier branch builders therefore feed the Die; later branches cannot be retroactively converted. The added plasma trait opens existing Chain Arc, Ricochet, Plasma Lens/Bloom, Arc Window, Heat Signature, and Crossfeed combinations without adding a projectile or a second preview path.

## Risks For 057-060

- New hook surfaces can create runaway proc chains unless proc order and budgets stay tested as item count grows.
- Unlock-gated item families can starve fresh saves if future gates target baseline or starter items.
- Item cards can get too dense once rarity, source, tags, implementation state, and unlock state all appear together; compact view models should come before decorative art.
- The first expansion prioritizes breadth; balance tuning still needs real playtest evidence.
- Weight profiles are first-pass tuning and should be revisited with live playtest data before adding many more items.
