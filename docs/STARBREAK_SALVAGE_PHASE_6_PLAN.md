# Starbreak Salvage - Phase 6 Plan

## Phase 5 Conclusion

Phase 5 is concluded after work order 050 validation. It gave the run-to-run loop a clearer spine: banked scrap now buys persistent upgrade entries, the Upgrade Bay explains costs and states, purchased upgrades influence future seeded runs, sector completion has a short exit/toast beat, Lunar Surface adds a distinct low-altitude sector family, and player destruction now has bounded ship-breakup feedback before summary.

The game is still early for the long-term roguelike goal. The current 60-item catalog now proves the hook pipeline, archetype model, first Phase 6 expansion pass, and first source-weighted acquisition pass, but future runs still need unlockable variety, synergy identity, deeper item presentation, and more playtest tuning without sacrificing deterministic generation or readable combat.

## Phase 6 Product Goal

Refresh, enrich, and expand the item catalog into a durable build-crafting foundation. Phase 6 should make item rewards feel more abundant and more distinct, support more hook types and item families, improve reward/shop/vault pool control, add unlock and discovery structure, and keep validation strong enough that a much larger catalog stays maintainable.

## Phase 6 Pillars

1. **Ambitious Item Count** - grow from 30 items toward a catalog large enough to create repeat-run surprise while keeping each entry data-driven and validated.
2. **Effect Variety Over Raw Power** - prioritize conditional, positional, economic, defensive, risk/reward, and build-shaping effects instead of simple damage inflation.
3. **Explainable Synergy** - item tags, hook timing, proc limits, and UI copy should make combinations surprising but understandable.
4. **Curated Reward Pools** - starter, combat, shop, vault, faction, boss, lunar, and unlock-gated pools should feel intentional and seed-stable.
5. **Unlockable Breadth** - permanent progression should reveal new item families, variants, and archetypes rather than only stronger versions.
6. **Validation At Scale** - content tests should catch duplicate ids, invalid tags/hooks, broken pool references, missing implementations, weak descriptions, and inaccessible unlock states.

## Current Gap

- the item catalog has reached the first 60-item Phase 6 target, and source weighting now gives shop, vault, lunar, route, faction, elite, and boss contexts a first pass of curated identity;
- several item effects are intentionally lightweight placeholders and need clearer live behavior or explicit "planned effect" treatment;
- expanded hook surfaces now have first live users across graze, special, bomb, sector, route, shop, reward, and boss phase events, plus a deterministic item-storm debug path that exposes hook pressure and proc cap state; balance still needs playtest data;
- shop/vault/reward pools now have source weighting and first unlock-gated family tiers, but need more playtest balance before the catalog grows much further;
- item UI currently exposes names and text, but future scale will need better icons, tags, comparison, and build summary grouping;
- item discovery and family progress now have a first archive surface, but reward/shop cards and run summary still need richer presentation.

## Phase 6 Milestones

### P6.1 - Item Taxonomy And Catalog Audit

Define the target item families, archetypes, rarity bands, unlock tiers, and implementation status model before adding large batches.

Exit criteria:

- Item definitions can express family, implementation status, unlock tier, and pool intent.
- Validation distinguishes live, stubbed, and planned effects.
- Existing 30 items are audited without changing seeded behavior unintentionally.

Status: implemented by work orders 051 and 052. The current 30-item catalog is audited in `docs/STARBREAK_SALVAGE_ITEM_CATALOG_AUDIT.md`, with repeatable coverage helpers in `src/content/itemCatalogAudit.ts` and unit tests for rarity, tag, hook, pool, archetype, unlock, family, source, implementation-status, and bridge-effect baselines. Item definitions now carry durable family/source/unlock-tier/implementation-status/stacking/UI-tag metadata, and content validation catches metadata, pool, source, and unlock-gate drift before larger item batches land.

### P6.2 - Hook And Effect Surface Expansion

Broaden the item hook system so new effects can interact with more of the run.

Exit criteria:

- New hook points cover at least graze, special use, bomb use, sector start, route selection, shop pricing, reward roll, and boss phase events where practical.
- Hook order remains deterministic and bounded.
- Tests cover proc limits and multi-item ordering.

Status: implemented by work order 053. The hook schema now includes graze, special use, bomb use, sector start, route choice, shop entry, reward generation, and boss phase change events. Combat and non-combat systems invoke typed payloads at those boundaries, content validation requires implementation entries for any item that declares a hook, and unit tests cover deterministic ordering, inert future surfaces, and bounded dispatch/proc limits. Work order 054 can now add live items against these surfaces.

### P6.3 - Catalog Expansion Pack

Add a substantial original item batch in small validated groups.

Exit criteria:

- The catalog reaches at least 60 total items in the first expansion pass.
- Each new item has tags, rarity, pool placement, effect text, and either live behavior or explicit implementation status.
- Existing starter balance remains friendly to fresh saves.

Status: implemented by work order 054. The catalog now contains 60 original item definitions, with the first expansion batch filling all target family lanes and adding live behavior for the newly expanded hook surfaces. Starter rewards grew to 27 common/uncommon-forward entries without prototype or cursed items, combat grew to 51 entries, vault grew to 20 entries, and known shop/vault snapshots were updated for deterministic generation.

### P6.4 - Reward Pool And Gating Depth

Make item availability depend on route, sector, faction, unlock, and run context without breaking reproducibility.

Exit criteria:

- Reward, shop, vault, boss, faction, lunar, and unlock-gated item pools are deterministic from seed plus save state.
- Pool weights are testable and can be sampled for known seeds.
- Fresh saves retain enough variety for complete runs.

Status: implemented by work orders 055 and 056. Reward generation now uses validated item pool weight profiles for starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts. Weights combine source metadata, rarity, family, tags, route kind, sector identity, boss/faction context, contract bias, upgrade bias, and save/unlock filtering while keeping known-seed shop/reward/vault outputs reproducible. Advanced curse/relic, classified heat/prototype, and advanced boss-pressure tiers now enter future pools only after their related permanent unlocks, while fresh saves retain baseline item variety.

Work order 156 supersedes the Boss Pressure portion of this historical status: that family is retired from live pools and unlock gates, with its useful boss counterplay moved into permanent scrap upgrades. Curse/relic and classified heat/prototype gating remain active.

### P6.5 - Synergy And Build Identity

Turn item tags into visible build identity and richer combinations.

Exit criteria:

- At least ten named or detectable synergy clusters are represented.
- Run summaries and HUD/build readouts can group notable item families.
- Synergies remain bounded and readable in dense combat.

Status: implemented by work order 057. `BuildSynergy` defines eleven named clusters from item families and tags, including the legacy archetype lanes plus lunar, route, and boss-pressure identities. Acquisition order breaks ties deterministically, the HUD shows compact primary/secondary build identity, reward and shop cards show prospective build fit, and run summaries record the final build identity.

Work order 156 leaves the Boss Pressure cluster readable only for restored legacy loadouts; the active item audit and discovery archive now expose ten live family lanes.

### P6.6 - Item Discovery And Presentation

Make a larger catalog readable in menus, rewards, shops, archives, and summaries.

Exit criteria:

- Item cards expose tags, rarity, pool/source hints, and concise effect state.
- Unlock Archive can show item discovery/progress without spoiling everything by default.
- Keyboard, narrow viewport, high-contrast, and reduced-motion treatment remain usable.

Status: implemented by work orders 056 and 058. Save schema v4 records discovered item IDs and family IDs, migrates older saves, and the Unlock Archive shows family progress plus locked/partial/unlocked hints without listing locked item details. Reward choices, shops, run summary, and discovered archive items now share item-card view models with original inline SVG family icons, rarity/family/source/effect-state metadata, tag badges, high-contrast styling, and responsive grids.

### P6.7 - Phase 6 Item Playtest Candidate

Harden the expanded item ecosystem for deployment.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover item count, hook coverage, pool/gating behavior, discovery UI, and known balance risks.
- Manual smoke matrix includes at least one item-heavy reward/shop/vault path and one dense synergy combat path.

Status: complete through work order 060 and extended by work order 076. Item-stress instrumentation covers a forced 23-item combat loadout, all 14 hook surfaces, proc cap state, build identity, and fresh/unlocked combat-shop-vault pool previews. The closeout docs record item count, hook coverage, source-weighted pools, unlock/discovery state, release evidence, browser gaps, and remaining item balance risks for the next playtest cycle.

## Recommended Phase 6 Sequence

1. Work order 051 - Phase 6 item taxonomy and audit.
2. Work order 052 - Item schema and validation expansion.
3. Work order 053 - Hook surface expansion.
4. Work order 054 - First item catalog expansion pack.
5. Work order 055 - Reward pools, rarity, and source weighting.
6. Work order 056 - Unlock-gated item families and discovery records.
7. Work order 057 - Synergy clusters and build identity readouts.
8. Work order 058 - Item card, shop, reward, and archive presentation.
9. Work order 059 - Item stress smoke and balance instrumentation.
10. Work order 060 - Phase 6 playtest release hardening.

## Phase 6 Definition Of Done

Phase 6 is done when item rewards feel significantly less repetitive, the catalog is larger and more varied, item effects are either implemented or clearly tracked, seeded reward/shop/vault outputs remain reproducible, unlocks widen item variety, item UI can explain a larger catalog, and automated plus browser smoke coverage can protect the item ecosystem as it grows.

Status: met for the first item-catalog playtest candidate and extended by work order 076. The 60-item catalog, 14-hook surface, source-weighted reward/shop/vault pools, unlock-gated item families, discovery records, synergy identity, shared item cards, item-heavy smoke, and release docs are in place. Remaining work is tuning-oriented: live reward repetition, late-run proc balance, non-Chromium manual browser passes, and future catalog breadth.

## Phase 7 Handoff

Phase 7 moves from player build variety into enemy behavior depth. Its plan lives in `docs/STARBREAK_SALVAGE_PHASE_7_PLAN.md` and starts at work order 061 with enemy role taxonomy before adding upgraded variants, formations, and longer-sector pacing.
