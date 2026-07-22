# Starbreak Salvage - Item Catalog Audit

Work orders 051-056 baseline, refreshed through work order 189. This document records the active item catalog after the Noita-style circuit pivot retired Boss Pressure from live rotation, moved eight passive items into permanent progression, refilled their active slots, converted Prototype Vent Script into an ordered stored-heat modifier, and made arc a projectile-carried secondary discharge. The source of truth remains `src/content/items.ts`; repeatable coverage checks live in `src/content/itemCatalogAudit.ts` and `tests/unit/itemCatalogAudit.test.ts`.

## Current Shape

| Measure                 | Current | Phase 6 target                                                                             |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------ |
| Active item definitions | 60      | Thirteen retired definitions remain for legacy-save compatibility                          |
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
| `onFire`                       | 18         | Volley shaping, drones, split shots, missiles, phase/heat variants, and ordered cadence. |
| `onProjectileSpawn`            | 14         | Projectile traits, arc charge, size, damage, TTL, and drift shaping.                     |
| `onEnemyKilled`                | 10         | Salvage payouts, compact blasts, and overkill/relic rewards.                             |
| `onPlayerHit`                  | 6          | Shield, revenge, armor, and curse retaliation.                                           |
| `onPickupCollected`            | 6          | Credit/salvage pickup shared-reservoir charge.                                           |
| `onGraze`                      | 2          | Near-miss charge/rate/radius effects.                                                    |
| `onSpecialUsed`                | 0          | Reserved hook surface; Prototype Vent Script moved to ordered volley cadence.            |
| `onBombUsed`                   | 1          | Bomb damage, radius, and boss-ratio shaping.                                             |
| `onSectorStart`                | 2          | Lunar entry and sector-start resource effects.                                           |
| `onRouteChosen`                | 1          | Curse-interest remains active; retired economy hooks remain compatible.                  |
| `onShopEntered`                | 0          | Retired reroll effects remain available only to restored snapshots.                      |
| `onRewardGenerated`            | 1          | Relic reward bias remains active; retired reward hooks remain compatible.                |
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
| `credit`   | 8     |
| `phase`    | 10    |
| `scrap`    | 5     |
| `drone`    | 8     |
| `plasma`   | 10    |
| `shield`   | 5     |
| `curse`    | 5     |
| `heat`     | 7     |
| `armor`    | 3     |
| `arc`      | 8     |
| `laser`    | 5     |
| `magnet`   | 3     |
| `missile`  | 5     |
| `overkill` | 7     |
| `ricochet` | 4     |
| `bomb`     | 3     |
| `revenge`  | 3     |
| `split`    | 8     |
| `relic`    | 2     |

`relic`, `split`, `revenge`, and `bomb` remain thinner tags even though their broader families are now represented.

## Family Coverage

| Family           | Count | Phase 6 note                                                                                                  |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| Laser/Split      | 8     | Forkline Dynamo charges only the two outer branches that already exist at its ordered stage.                  |
| Missile/Overkill | 9     | Claimant Arc Seal converts upstream overkill into standard second-target arc charge.                          |
| Drone/Copy       | 7     | Crossfeed Detonator charges upstream projectiles that carry two distinct circuit traits.                      |
| Shield/Revenge   | 5     | Reached the first expansion target; defensive balance should avoid rewarding intentional damage too strongly. |
| Credit/Shop      | 5     | Coastdown Capacitor turns broad pickup play into a conserved shared-haste reserve.                            |
| Curse/Relic      | 6     | Advanced vault/route entries are locked behind the Relic Thief dossier; risk/reward tuning still needs work.  |
| Phase/Graze      | 7     | Faraday Phase Shunt lets an upstream arc charge survive one phase traversal before discharge.                 |
| Heat/Prototype   | 6     | Plasma Seed Crucible converts an earlier circuit trait into plasma/heat scaling.                              |
| Lunar/Surface    | 5     | Gangue Compression Die converts upstream light branches into denser plasma.                                   |
| Route/Economy    | 1     | Six former economy passives now live in permanent scrap progression.                                          |

The five Boss Pressure definitions and their original hook implementations remain readable to restored snapshots, but they are absent from pools, unlock gates, discovery, stress fixtures, and the active audit. Boss Warning Lattice and Capital Relief Protocol preserve the worthwhile telegraph, delay, charge, and late-phase-clear mechanics as permanent scrap upgrades.

## Archetype Coverage

| Archetype        | Rewarded count |
| ---------------- | -------------- |
| Laser/Split      | 17             |
| Missile/Overkill | 10             |
| Drone/Copy       | 13             |
| Shield/Revenge   | 5              |
| Credit/Shop      | 10             |
| Curse/Relic      | 6              |
| Phase/Graze      | 12             |
| Heat/Prototype   | 14             |

## Work Order 200: Permanent Surface Beacon / Parallax Echo Lattice

- `item_surface_beacon_drone` is now a retired compatibility record. It remains hook-readable for restored snapshots but is absent from every live reward source.
- `upgrade_surface_beacon_drone` moves the lunar entry identity into Archive progression: 14 kg, gated by Relic Pattern Dossier, granting one salvage and 5% special charge on lunar entry.
- Legacy-item precedence prevents a restored run from receiving both versions of the same entry ping, and the permanent flag is non-generative.
- `item_parallax_echo_lattice` is the new rare lunar/combat replacement. It phases and extends only projectiles already created by an upstream circuit stage, creating meaningful Split, Drone, Shard, Echo, and similar ordered-chain interactions without increasing projectile count.
- The replacement retains the retired entry's rarity, weight, generation tags, sources, and pool position. Active catalog breadth remains 60; the complete catalog contains 74 records including retired compatibility items.

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

## Projectile-attached arc charge in Work Order 180

Arc is no longer post-kill bonus damage. A projectile carries either standard charge (55% of its impact, minimum 0.35, within 180 units) or heavy charge (82%, minimum 0.55, within 240 units). Its ordinary target receives unchanged projectile damage; consumption then attempts one deterministic lightning discharge into the nearest distinct living enemy or boss. Phase retains the charge through its one traversal, and a shot without a secondary target simply spends the charge without a hit.

Chain Arc Capacitor and Plasma Lens Array attach standard charge, Arc Welder Drone's generated shot carries one, Arc Window Invoice upgrades eligible upstream chains to heavy charge, and Crossfeed Detonator attaches heavy charge to projectiles that already carry two circuit traits. Crossfeed's compact execution blast remains, but its old kill-only arc branch and Chain Arc's `onEnemyKilled` declaration are removed. Hardpoint cumulative cards now separate body impact from secondary arc damage/range, so Arc Window after Chain Arc is a visible heavy upgrade while the reverse order leaves the later standard charge intact.

## Permanent Route Ledger and Forkline chain in Work Order 181

Route Ledger Spool is now a 9 kg Navigation upgrade gated by Route Ledger Uplink. Its retired catalog record and `onRouteChosen` reducer remain only for restored snapshots; route settlement gives a fitted legacy copy precedence over the permanent flag, so either representation adds exactly one credit to the later reward cash-out. The route-local flag is omitted from the expedition-wide generation fingerprint and cannot reshuffle contracts, maps, sectors, shops, rewards, or duration.

Forkline Dynamo occupies the released common starter/combat/route slot. At its ordered `onFire` stage it requires at least two current projectiles, ranks them by their projected horizontal lane, and attaches standard arc charge to only the leftmost and rightmost shots. An upstream splitter or native multi-shot weapon therefore feeds the Dynamo; a Dynamo placed before a single-shot splitter remains inert. It adds no projectile, primary impact, RNG draw, timer, or preview-only rule, while downstream Arc Window, plasma, phase, ricochet, and multi-trait effects can still transform its charged branches.

## Permanent Market Echo and Faraday phase chain in Work Order 183

Market Echo Locator is now an 11 kg Market upgrade gated by Market Decoder. Its retired catalog record and `onRewardGenerated` reducer remain only for restored snapshots; reward generation gives a fitted legacy copy precedence over the permanent flag, so either representation adds exactly one credit/magnet-biased choice on Shop and Repair rewards. The reward-local flag is omitted from the expedition-wide generation fingerprint and cannot reshuffle contracts, maps, sectors, shops, or duration.

Faraday Phase Shunt occupies the released uncommon combat/shop slot. At its ordered `onProjectileSpawn` stage it adds one consumable `phase` traversal only to projectiles already carrying standard or heavy arc charge. The first hit therefore damages normally, spends phase instead of the projectile, and preserves the electrical charge; the later consuming hit can discharge into a distinct nearby target through the shared arc model. A Shunt placed before its arc source remains inert, and the item adds no projectile, primary damage, charge strength, RNG draw, timer, or separate preview path.

## Permanent Convoy Receipts and rebound freight chain in Work Order 185

Convoy Receipt Printer is now a 12 kg Market upgrade gated by Market Decoder. Its retired catalog record and `onShopEntered` reducer remain only for restored snapshots; shop generation gives a fitted legacy copy precedence over the permanent flag, so either representation adds exactly one credit/drone-biased slot after a reroll and neither changes initial stock. The shop-local flag is excluded from the expedition-wide generation fingerprint and supplied directly to the named shop roll.

Uncommon Rebound Freight Seal replaces the released active slot. As an ordered projectile transform, it requires an upstream `ricochetBounces` value, adds 14% impact for each of at most two prepared bounces, and attaches the existing overkill trait without creating or consuming a projectile or bounce. The active catalog remains at 60 items; the compatibility catalog now contains 71 definitions, eleven of them retired.

## Permanent Mining Transit and strata-bore chain in Work Order 188

Mining Laser Transit is now a 13 kg Archive upgrade gated by Relic Pattern Dossier. Its retired catalog record and `onRewardGenerated` reducer remain only for restored snapshots; reward generation gives a fitted legacy copy precedence over the permanent flag, so either representation adds the same laser/plasma bias to Vault and Faction Ambush rewards exactly once. The reward-local flag is excluded from the expedition-wide generation fingerprint and supplied only to the existing named reward roll.

Rare Strata-Bore Collimator replaces the released combat/vault/lunar slot. At its ordered `onProjectileSpawn` stage it requires upstream plasma, adds the shared `beam` laser presentation and laser trait, raises velocity by 12%, and raises impact by 14% plus 4% for each of at most three carried arc/drone/missile/phase/ricochet/split traits. It preserves every upstream trait for downstream stages and creates no projectile, RNG draw, timer, counter, state field, or alternate preview path. The active catalog remains at 60 items; the compatibility catalog now contains 72 definitions, twelve of them retired.

## Permanent Ambush Insurance and claimant arc chain in Work Order 189

Ambush Insurance Stamp is now a 10 kg Navigation upgrade gated by Route Ledger Uplink. Its retired catalog record and `onRouteChosen` reducer remain only for restored snapshots; route settlement gives a fitted legacy copy precedence over the permanent flag, so either representation adds exactly one salvage and armor/credit bias on Elite and Faction Ambush choices. The route-local flag is excluded from the expedition-wide generation fingerprint and supplied only to the existing settlement boundary.

Uncommon Claimant Arc Seal replaces the released combat/route/elite/faction slot. At its ordered `onProjectileSpawn` stage it requires upstream overkill and attaches the shared standard arc profile without changing body impact. A consuming hit can therefore discharge 55% impact, minimum 0.35, within 180 units into a distinct second target; downstream Faraday, Plasma Seed, Arc Window, and multi-trait effects receive the charge normally. It creates no projectile, RNG draw, timer, counter, collision rule, state field, or alternate preview path. The active catalog remains at 60 items; the compatibility catalog now contains 73 definitions, thirteen of them retired.

## Risks For 057-060

- New hook surfaces can create runaway proc chains unless proc order and budgets stay tested as item count grows.
- Unlock-gated item families can starve fresh saves if future gates target baseline or starter items.
- Item cards can get too dense once rarity, source, tags, implementation state, and unlock state all appear together; compact view models should come before decorative art.
- The first expansion prioritizes breadth; balance tuning still needs real playtest evidence.
- Weight profiles are first-pass tuning and should be revisited with live playtest data before adding many more items.
