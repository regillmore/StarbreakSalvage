# Starbreak Salvage - Item Catalog Audit

Work orders 051-056 baseline. This document records the current item catalog after the first Phase 6 expansion pack, source-weighted acquisition pass, and unlock-gated family tier pass. The source of truth remains `src/content/items.ts`; repeatable coverage checks live in `src/content/itemCatalogAudit.ts` and `tests/unit/itemCatalogAudit.test.ts`.

## Current Shape

| Measure                | Current | Phase 6 target                                                                                |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------- |
| Total item definitions | 60      | Reached the first expansion target                                                            |
| Candidate reward pools | 3       | Starter, combat, and vault remain the broad candidate buckets                                 |
| Weight profiles        | 9       | Starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts are weighted    |
| Hook names             | 13      | Add item discovery or collection hooks only if later systems need them                        |
| Locked item ids        | 8       | Direct item gates plus advanced/classified family-tier gates                                  |
| Archetype records      | 8       | Keep legacy archetypes and use metadata families for lunar, route, and boss-pressure identity |

## Schema Metadata

Work order 052 formalized compact item metadata:

- `family` selects one Phase 6 family lane such as laser/split, curse/relic, lunar/surface, route/economy, or boss-pressure.
- `sources` records current and future acquisition intent, including starter, combat, shop, vault, elite, boss, faction, lunar, route, and unlock.
- `unlockTier` separates baseline, advanced, and explicitly unlock-gated items.
- `implementationStatus` distinguishes live, bridge, and planned effects; bridge/planned entries must explain the gap.
- `stacking` records unique versus stackable intent before duplicate item rewards become possible.
- `uiTags` gives item cards a short, validated badge vocabulary without parsing gameplay tags.

Validation requires ordinary reward-pool membership to match source metadata. A declared bridge pool may instead list the valid source lanes it composes; its entries must still match at least one of those lanes. Item pool weight profiles must reference valid pools/sources/rarities/families/tags and a positive optional bias weight, item and family unlock gates must reference valid unlocks and item tiers, every declared hook must have an implementation, and prototype/cursed items stay out of ordinary starter sources.

## Rarity Coverage

| Rarity    | Count | Notes                                                                       |
| --------- | ----- | --------------------------------------------------------------------------- |
| Common    | 14    | Starter-safe bread-and-butter items now cover more families.                |
| Uncommon  | 20    | The largest band and the main source of early variety.                      |
| Rare      | 19    | Broadly represented in combat and vault pools.                              |
| Prototype | 4     | Mostly vault/combat pressure, with `item_overheat_oracle` currently locked. |
| Cursed    | 3     | Vault-only and still a later risk/reward tuning lane.                       |

## Hook Coverage

| Hook                 | Item count | Current role                                                        |
| -------------------- | ---------- | ------------------------------------------------------------------- |
| `onFire`             | 11         | Volley shaping, drones, split shots, missiles, phase/heat variants. |
| `onProjectileSpawn`  | 8          | Projectile tags, size, damage, TTL, and drift shaping.              |
| `onEnemyKilled`      | 11         | Salvage payouts, arc/blast follow-ups, overkill/relic rewards.      |
| `onPlayerHit`        | 6          | Shield, revenge, armor, and curse retaliation.                      |
| `onPickupCollected`  | 5          | Credit/salvage pickup fire-rate boosts.                             |
| `onGraze`            | 2          | Near-miss charge/rate/radius effects.                               |
| `onSpecialUsed`      | 1          | Prototype special-use projectile and cooldown shaping.              |
| `onBombUsed`         | 1          | Bomb damage/radius/boss-pressure shaping.                           |
| `onSectorStart`      | 3          | Lunar entry, sector-start resource, and toll effects.               |
| `onRouteChosen`      | 4          | Route economy, curse interest, and ambush insurance effects.        |
| `onShopEntered`      | 2          | Shop discount, stock, and bias effects.                             |
| `onRewardGenerated`  | 3          | Reward choice and tag-bias effects.                                 |
| `onBossPhaseChanged` | 5          | Boss telegraph, cooldown, clear, and charge pressure effects.       |

Work order 054 gave the work order 053 hook surface its first live users. Item discovery is currently recorded from run inventory at summary time, so a dedicated collection hook remains optional unless future mid-run archive UI needs it.

## Candidate Reward Pool Coverage

| Pool          | Items | Rarity mix                                   | Notes                                                                    |
| ------------- | ----- | -------------------------------------------- | ------------------------------------------------------------------------ |
| Starter       | 27    | 14 common, 9 uncommon, 4 rare                | Broad safe starter-source catalog; no prototype or cursed entries.       |
| Ignition Core | 9     | 1 common, 4 uncommon, 3 rare, 1 cursed       | Shared one-per-family opening pool; unlock filtering gates the curse core. |
| Combat        | 51    | 14 common, 18 uncommon, 17 rare, 2 prototype | Feeds combat, shop, elite, boss, faction, lunar, and route profiles.     |
| Vault         | 20    | 2 uncommon, 11 rare, 4 prototype, 3 cursed   | Feeds vault plus high-pressure profiles when rare/cursed pressure fits.  |

The broad candidate pools are intentionally small in number; source identity now comes from the weight profile layer rather than separate hard-filtered lists for every surface.

## Weight Profile Coverage

| Profile      | Candidate pools | Primary role                                                                             |
| ------------ | --------------- | ---------------------------------------------------------------------------------------- |
| Starter      | starter         | Broad starter-source generation; common/uncommon-forward, no prototype/cursed weights.   |
| Ignition Core | starterCore    | One seeded opening upgrade, strongly biased by contract and weapon affinity.              |
| Combat  | combat          | Baseline post-sector rewards with moderate rare/prototype pressure.                      |
| Shop    | combat          | Market inventory biased toward shop, route, credit, magnet, heat, and drone entries.     |
| Vault   | vault           | Relic/cursed/prototype-leaning rewards with phase and curse identity.                    |
| Elite   | combat, vault   | Higher-pressure rewards biased toward elite, boss, overkill, missile, and drone entries. |
| Boss    | combat, vault   | Boss-gated rewards biased toward boss-pressure, shield, overkill, and phase entries.     |
| Faction | combat, vault   | Faction ambush rewards with faction-specific tag bias from boss faction context.         |
| Lunar   | combat, vault   | Lunar Surface rewards biased toward lunar, route, scrap, laser, and phase entries.       |
| Route   | combat, vault   | Repair/shop/glitch-style rewards biased toward route economy and credit flow.            |

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
| `credit`   | 16    |
| `phase`    | 12    |
| `scrap`    | 9     |
| `drone`    | 8     |
| `plasma`   | 8     |
| `shield`   | 6     |
| `curse`    | 5     |
| `heat`     | 5     |
| `armor`    | 4     |
| `arc`      | 4     |
| `laser`    | 4     |
| `magnet`   | 4     |
| `missile`  | 4     |
| `overkill` | 4     |
| `ricochet` | 4     |
| `bomb`     | 3     |
| `revenge`  | 3     |
| `split`    | 3     |
| `relic`    | 2     |

`relic`, `split`, `revenge`, and `bomb` remain thinner tags even though their broader families are now represented.

## Family Coverage

| Family           | Count | Phase 6 note                                                                                                  |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| Laser/Split      | 6     | Healthy enough for precision, arc, and split variants.                                                        |
| Missile/Overkill | 6     | Reached the first expansion target; needs weighting and build identity next.                                  |
| Drone/Copy       | 6     | Good base for side drones, mirror shots, escorts, and command effects.                                        |
| Shield/Revenge   | 5     | Reached the first expansion target; defensive balance should avoid rewarding intentional damage too strongly. |
| Credit/Shop      | 6     | Healthy base; now has first-pass shop/source weighting rather than flat discounts only.                       |
| Curse/Relic      | 6     | Advanced vault/route entries are locked behind the Relic Thief dossier; risk/reward tuning still needs work.  |
| Phase/Graze      | 5     | Has direct graze hooks now.                                                                                   |
| Heat/Prototype   | 5     | Has special-use and projectile heat behavior, but downside identity is still light.                           |
| Lunar/Surface    | 5     | First source-driven sector family is present.                                                                 |
| Route/Economy    | 5     | First route-choice economy family is present.                                                                 |
| Boss-Pressure    | 5     | First boss-phase pressure family is present.                                                                  |

The legacy archetype audit now reports no underrepresented rewarded archetypes. The metadata family audit is the better guide for lunar, route, and boss-pressure follow-up work.

## Archetype Coverage

| Archetype        | Rewarded count |
| ---------------- | -------------- |
| Laser/Split      | 10             |
| Missile/Overkill | 8              |
| Drone/Copy       | 10             |
| Shield/Revenge   | 6              |
| Credit/Shop      | 17             |
| Curse/Relic      | 6              |
| Phase/Graze      | 13             |
| Heat/Prototype   | 12             |

## Former Bridge Effects Promoted In Work Order 132

These former bridge entries now have live, order-sensitive circuit behavior:

| Item              | Current behavior                                                 | Circuit role                                                                                              |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ricochet License  | Gives eligible phase/plasma/ricochet shots one real sidewall rebound. | Live in work order 132; chains into phase and arc projectile modifiers. |
| Phase Grazer      | Transforms every fourth complete volley into a phase chain. | Live in work order 132; socket order controls which split/clone shots inherit it. |
| Vault Parasite    | Converts cursed/overkill executions into salvage plus blast pressure. | Live in work order 132; requires an actual tagged execution. |
| Cursed Hull Plate | Amplifies retaliation already built before it, adds curse/overkill, and emits a fan. | Live in work order 132; socket order changes the amplified set. |

No shipped item is a pure no-op or bridge: current validation requires every declared hook to have an implementation, and work order 132 promoted the final four bridge entries to live mechanics. Work order 052 formalized live, bridge, and planned implementation status in item metadata.

## Risks For 057-060

- New hook surfaces can create runaway proc chains unless proc order and budgets stay tested as item count grows.
- Unlock-gated item families can starve fresh saves if future gates target baseline or starter items.
- Item cards can get too dense once rarity, source, tags, implementation state, and unlock state all appear together; compact view models should come before decorative art.
- The first expansion prioritizes breadth; balance tuning still needs real playtest evidence.
- Weight profiles are first-pass tuning and should be revisited with live playtest data before adding many more items.
