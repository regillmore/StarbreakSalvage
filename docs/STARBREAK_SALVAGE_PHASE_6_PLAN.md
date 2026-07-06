# Starbreak Salvage - Phase 6 Plan

## Phase 5 Conclusion

Phase 5 is concluded after work order 050 validation. It gave the run-to-run loop a clearer spine: banked scrap now buys persistent upgrade entries, the Upgrade Bay explains costs and states, purchased upgrades influence future seeded runs, sector completion has a short exit/toast beat, Lunar Surface adds a distinct low-altitude sector family, and player destruction now has bounded ship-breakup feedback before summary.

The game is still item-light for the long-term roguelike goal. The current 30-item catalog proves the hook pipeline and archetype model, but future runs need more surprising build texture, more unlockable variety, and stronger item presentation without sacrificing deterministic generation or readable combat.

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

- the item catalog has a solid 30-entry first pass, but the reward pool repeats too quickly for a long roguelike arc;
- several item effects are intentionally lightweight placeholders and need clearer live behavior or explicit "planned effect" treatment;
- hook coverage is narrow, centered on firing, projectile spawn, kills, hits, and pickups;
- shop/vault/reward pools need stronger rarity, faction, sector, route, and unlock controls before the catalog grows;
- item UI currently exposes names and text, but future scale will need better icons, tags, comparison, and build summary grouping;
- unlocks widen item pools, but item discovery and collection progress are not yet a first-class surface.

## Phase 6 Milestones

### P6.1 - Item Taxonomy And Catalog Audit

Define the target item families, archetypes, rarity bands, unlock tiers, and implementation status model before adding large batches.

Exit criteria:

- Item definitions can express family, implementation status, unlock tier, and pool intent.
- Validation distinguishes live, stubbed, and planned effects.
- Existing 30 items are audited without changing seeded behavior unintentionally.

### P6.2 - Hook And Effect Surface Expansion

Broaden the item hook system so new effects can interact with more of the run.

Exit criteria:

- New hook points cover at least graze, special use, bomb use, sector start, route selection, shop pricing, reward roll, and boss phase events where practical.
- Hook order remains deterministic and bounded.
- Tests cover proc limits and multi-item ordering.

### P6.3 - Catalog Expansion Pack

Add a substantial original item batch in small validated groups.

Exit criteria:

- The catalog reaches at least 60 total items in the first expansion pass.
- Each new item has tags, rarity, pool placement, effect text, and either live behavior or explicit implementation status.
- Existing starter balance remains friendly to fresh saves.

### P6.4 - Reward Pool And Gating Depth

Make item availability depend on route, sector, faction, unlock, and run context without breaking reproducibility.

Exit criteria:

- Reward, shop, vault, boss, faction, lunar, and unlock-gated item pools are deterministic from seed plus save state.
- Pool weights are testable and can be sampled for known seeds.
- Fresh saves retain enough variety for complete runs.

### P6.5 - Synergy And Build Identity

Turn item tags into visible build identity and richer combinations.

Exit criteria:

- At least ten named or detectable synergy clusters are represented.
- Run summaries and HUD/build readouts can group notable item families.
- Synergies remain bounded and readable in dense combat.

### P6.6 - Item Discovery And Presentation

Make a larger catalog readable in menus, rewards, shops, archives, and summaries.

Exit criteria:

- Item cards expose tags, rarity, pool/source hints, and concise effect state.
- Unlock Archive can show item discovery/progress without spoiling everything by default.
- Keyboard, narrow viewport, high-contrast, and reduced-motion treatment remain usable.

### P6.7 - Phase 6 Item Playtest Candidate

Harden the expanded item ecosystem for deployment.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover item count, hook coverage, pool/gating behavior, discovery UI, and known balance risks.
- Manual smoke matrix includes at least one item-heavy reward/shop/vault path and one dense synergy combat path.

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
