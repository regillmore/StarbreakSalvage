# Starbreak Salvage - Item Catalog Audit

Work orders 051-052 baseline. This document records the current item catalog before Phase 6 starts expanding hooks, reward pools, unlocks, and presentation. The source of truth remains `src/content/items.ts`; repeatable coverage checks live in `src/content/itemCatalogAudit.ts` and `tests/unit/itemCatalogAudit.test.ts`.

## Current Shape

| Measure | Current | Phase 6 target |
| ------- | ------- | -------------- |
| Total item definitions | 30 | At least 60 in the first expansion pass |
| Reward pools | 3 | Starter, combat, shop, vault, elite, boss, faction, lunar, and unlock-gated source pools |
| Hook names | 5 | Add graze, special, bomb, sector, route, shop, reward, and boss-phase hooks where practical |
| Locked item ids | 1 | Multiple unlock-gated families, not just individual items |
| Archetype records | 8 | Keep legacy archetypes and add lunar, route, boss-pressure, and discovery-oriented families |

## Schema Metadata

Work order 052 formalized compact item metadata:

- `family` selects one Phase 6 family lane such as laser/split, curse/relic, lunar/surface, route/economy, or boss-pressure.
- `sources` records current and future acquisition intent, including starter, combat, shop, vault, elite, boss, faction, lunar, route, and unlock.
- `unlockTier` separates baseline, advanced, and explicitly unlock-gated items.
- `implementationStatus` distinguishes live, bridge, and planned effects; bridge/planned entries must explain the gap.
- `stacking` records unique versus stackable intent before duplicate item rewards become possible.
- `uiTags` gives item cards a short, validated badge vocabulary without parsing gameplay tags.

The current catalog remains behavior-compatible with the pre-052 reward pools. Validation now requires reward-pool membership to match source metadata, unlock-gated items to carry both an unlock tier and unlock source, and prototype/cursed items to stay out of starter sources.

## Rarity Coverage

| Rarity | Count | Notes |
| ------ | ----- | ----- |
| Common | 5 | All common items currently appear in starter and combat pools. |
| Uncommon | 11 | The largest band and the main source of early variety. |
| Rare | 9 | Broadly represented in combat and vault pools. |
| Prototype | 3 | Mostly vault/combat pressure, with `item_overheat_oracle` currently locked. |
| Cursed | 2 | Vault-only and underbuilt for a full curse/relic arc. |

## Hook Coverage

| Hook | Item count | Current role |
| ---- | ---------- | ------------ |
| `onFire` | 8 | Volley shaping, drones, split shots, phase/heat variants. |
| `onProjectileSpawn` | 5 | Projectile tags, size, TTL, and drift shaping. |
| `onEnemyKilled` | 9 | Salvage payouts, arc/blast follow-ups, overkill/relic rewards. |
| `onPlayerHit` | 5 | Shield, revenge, armor, and curse retaliation. |
| `onPickupCollected` | 4 | Credit/salvage pickup fire-rate boosts. |

Missing Phase 6 hooks: graze, special use, bomb use, sector start, route chosen, shop entered, reward generated, boss phase changed, and item discovery. These should be added only where the surrounding system can expose deterministic payloads.

## Reward Pool Coverage

| Pool | Items | Rarity mix | Notes |
| ---- | ----- | ---------- | ----- |
| Starter | 17 | 5 common, 8 uncommon, 4 rare | No prototype or cursed entries, which keeps fresh starts readable. |
| Combat | 23 | 5 common, 9 uncommon, 8 rare, 1 prototype | Also feeds shops, so combat and shop identity currently overlap heavily. |
| Vault | 11 | 1 uncommon, 5 rare, 3 prototype, 2 cursed | Strongest source identity, but small enough to repeat quickly. |

Current repeated-reward risk: shops use the combat pool, vaults have only 11 items, and route/faction/lunar/boss sources do not yet have first-class pools. Phase 6 should avoid only increasing the global combat pool; it needs source-specific curation.

## Tag Coverage

| Tag | Count |
| --- | ----- |
| `credit` | 6 |
| `curse` | 4 |
| `drone` | 4 |
| `phase` | 4 |
| `plasma` | 4 |
| `scrap` | 4 |
| `heat` | 3 |
| `shield` | 3 |
| `armor` | 2 |
| `arc` | 2 |
| `bomb` | 2 |
| `laser` | 2 |
| `magnet` | 2 |
| `missile` | 2 |
| `ricochet` | 2 |
| `revenge` | 2 |
| `split` | 2 |
| `overkill` | 1 |
| `relic` | 1 |

`overkill` and `relic` are the thinnest tags. The first item batch should add support pieces there before introducing too many brand-new tags.

## Archetype Coverage

| Archetype | Current count | Phase 6 note |
| --------- | ------------- | ------------ |
| Laser/Split | 6 | Healthy enough for expansion through precision, arc, and split variants. |
| Missile/Overkill | 4 | Underrepresented; needs more missile, bomb, and excess-damage choices. |
| Drone/Copy | 5 | Good base; can split into side drones, mirror shots, escorts, or command effects. |
| Shield/Revenge | 3 | Underrepresented; needs defensive choices that do not reward intentional damage too strongly. |
| Credit/Shop | 6 | Healthy base; should gain shop/source interactions rather than flat discounts only. |
| Curse/Relic | 4 | Underrepresented; needs clearer risk/reward, discovery, and vault identity. |
| Phase/Graze | 5 | Good base; should get direct graze hooks in work order 053. |
| Heat/Prototype | 7 | Broad by tag overlap, but needs clearer prototype identity and downside handling. |

The audit helper currently flags `missile-overkill`, `shield-revenge`, and `curse-relic` as underrepresented because they have fewer than five rewarded items.

## Bridge Or Lightweight Effects

These items have live behavior today, but their text or fantasy points toward future Phase 6 systems:

| Item | Current behavior | Phase 6 follow-up |
| ---- | ---------------- | ----------------- |
| Ricochet License | Extends plasma projectile lifetime. | Add true edge-bounce or lane-reflection behavior once projectile boundary hooks are safe. |
| Phase Grazer | Adds phase shots and participates in current graze charge logic. | Move part of the fantasy onto an explicit `onGraze` hook. |
| Vault Parasite | Pays extra salvage on kills. | Connect to vault/source weighting or curse/relic reward flow. |
| Cursed Hull Plate | Fires curse-themed revenge shards on hit. | Add an explicit cost/downside or update copy if the item stays purely retaliatory. |

No shipped item is a pure no-op: current validation requires every declared hook to have an implementation. Work order 052 formalized live, bridge, and planned implementation status in item metadata.

## Target Families

Phase 6 should preserve the eight existing archetype lanes and add three source-driven lanes:

- laser/split,
- missile/overkill,
- drone/copy,
- shield/revenge,
- credit/shop,
- curse/relic,
- phase/graze,
- heat/prototype,
- lunar/surface,
- route/economy,
- boss-pressure.

Count guidance for work order 054:

- reach at least 60 total items;
- bring every legacy archetype to at least 5 rewarded items;
- add at least 4-6 items each for lunar/surface, route/economy, and boss-pressure sources;
- keep starter items mostly common/uncommon and avoid cursed/prototype entries in fresh-loadout defaults;
- keep unlock-gated additions broad and interesting rather than strictly stronger.

## Risks For 052-060

- Schema growth can become busywork unless each new field protects generation, presentation, or validation.
- Adding many combat items before adding source pools will make rewards repeat less by count but not by feel.
- New hook surfaces can create runaway proc chains unless proc order and budgets are tested first.
- Unlock-gated item families can starve fresh saves if baseline pools are narrowed too soon.
- Item cards can get too dense once rarity, source, tags, implementation state, and unlock state all appear together; compact view models should come before decorative art.
