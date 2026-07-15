## Phase 6 work orders

Phase 6 begins after work order 050 validation and concludes the progression/sector-feedback playtest foundation. Its purpose is to make build crafting feel much richer: audit the current 30-item catalog, expand item metadata and validation, add more hooks, grow the catalog in original batches, improve reward pool curation, connect item unlocks/discovery, surface synergy identity, and harden item-heavy smoke coverage. Preserve deterministic reward, shop, vault, and unlock behavior from seed plus save state.

## Work order 051 - Phase 6 item taxonomy and audit

Goal: establish the expansion plan before adding many items.

Prompt:

> Read `AGENTS.md` first. Then read the Phase 6 plan, item content, item hook handlers, reward generation, unlock gating, summary UI, and content validation tests. Audit the current item catalog for tags, hooks, rarity, pool placement, implementation status, archetype coverage, and repeated reward feel. Add a lightweight item catalog audit doc or generated test helper if useful. Do not add large item batches yet. Update planning docs with target families, count goals, and risks. Run checks.

Acceptance criteria:

- Current item catalog coverage is documented by tag, hook, rarity, pool, and archetype.
- Phase 6 target item families and count goals are clear.
- Stubbed or lightweight effects are identified without breaking current play.
- Existing tests remain green.

Status: implemented; the Phase 6 item catalog audit now documents the 30-item baseline by rarity, tag, hook, reward pool, archetype, unlock gate, target family, and bridge/lightweight effect notes. A pure audit helper and unit coverage lock the baseline without changing item generation or gameplay behavior.

## Work order 052 - Item schema and validation expansion

Goal: make a larger catalog safe to maintain.

Prompt:

> Expand item definitions with metadata needed for scale, such as family, source hints, unlock tier, implementation status, stackability/uniqueness, and short UI tags. Keep the schema compact and data-driven. Extend content validation to catch duplicate families where invalid, unknown source hints, missing implementation notes, empty pools, invalid hook references, invalid unlock gates, missing effect text, and unsupported rarity/source combinations. Preserve save and seed compatibility. Run checks.

Acceptance criteria:

- Item schema can represent source, family, unlock tier, and implementation status.
- Content validation catches broken item metadata and pool references.
- Existing reward generation remains deterministic.
- UI can keep reading old and new item fields safely.

Status: implemented; item definitions now carry compact metadata for family, source hints, unlock tier, implementation status, stackability, and UI tags without changing reward generation. Content validation now catches invalid metadata, missing bridge/planned notes, unsupported starter rarity/source combinations, reward-pool/source drift, unlock-gate/source mismatches, and broken item unlock references. The repeatable catalog audit now reports family/source/unlock/status/stacking counts from the same metadata.

## Work order 053 - Item hook surface expansion

Goal: unlock more effect variety without ad hoc combat code.

Prompt:

> Add new deterministic item hook points for richer interactions. Good first hooks include `onGraze`, `onSpecialUsed`, `onBombUsed`, `onSectorStart`, `onRouteChosen`, `onShopEntered`, `onRewardGenerated`, and `onBossPhaseChanged` where they fit existing systems. Keep hook dispatch order deterministic, bounded, and explicit. Add tests for hook ordering, proc limits, and interactions with existing `onFire`, `onProjectileSpawn`, `onEnemyKilled`, `onPlayerHit`, and `onPickupCollected` behavior. Run checks.

Acceptance criteria:

- New hook names are registered and validated.
- Hook dispatch order and proc limits are tested.
- Existing items continue to behave as before.
- Future item effects can attach without reaching into unrelated systems.

Status: implemented; `onGraze`, `onSpecialUsed`, `onBombUsed`, `onSectorStart`, `onRouteChosen`, `onShopEntered`, `onRewardGenerated`, and `onBossPhaseChanged` are registered in the item hook schema, typed in the hook dispatcher, and wired through combat, sector start, route outcomes, shop entry, reward generation, and boss phase transitions. Dispatch now exposes a bounded report path for proc-budget tests, while the current catalog remains behavior-compatible because no existing item declares the new hooks yet.

## Work order 054 - First item catalog expansion pack

Goal: increase reward variety with original, validated item content.

Prompt:

> Add the first Phase 6 item expansion batch, targeting at least 60 total item definitions. Favor varied effects across laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic, phase/graze, heat/prototype, lunar/surface, route/economy, and boss-pressure families. Every new item needs tags, rarity, source/pool placement, effect text, implementation status, and live hook behavior where practical. Add validation and deterministic reward/shop/vault snapshot updates. Run checks.

Acceptance criteria:

- Catalog reaches at least 60 total items.
- New items are original and validated.
- Starter pools stay readable for fresh saves.
- Reward, shop, and vault generation snapshots remain deterministic.

Status: implemented; the catalog now has 60 original item definitions with the first Phase 6 expansion covering laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic, phase/graze, heat/prototype, lunar/surface, route/economy, and boss-pressure families. All new items have validated metadata, reward-pool placement, and live hook behavior across the expanded hook surface where declared. Starter remains common/uncommon-forward with no prototype or cursed entries, while deterministic shop and vault snapshots were updated for the larger pools.

## Work order 055 - Reward pools, rarity, and source weighting

Goal: make item acquisition feel curated rather than flat random.

Prompt:

> Refine item pool generation for starter rewards, combat rewards, shops, vaults, elites, bosses, lunar sectors, faction routes, and route events. Add deterministic rarity/source weighting helpers and tests for known seeds. Preserve the same seed plus save state contract. Avoid making rare/prototype/cursed items too common in fresh runs. Update reward/shop copy if source hints become visible. Run checks.

Acceptance criteria:

- Item pools can be weighted by source, rarity, route, sector, faction, and save state.
- Known-seed snapshots cover reward, shop, and vault outputs.
- Fresh saves still receive complete, understandable item choices.
- Pool weights are data-driven and validated.

Status: implemented; reward generation now uses validated data-driven pool profiles for starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts. The selector remains deterministic from seed plus save/unlock state, but weights now account for rarity, item source metadata, family, tags, route kind, sector identity, boss/faction context, and contract/upgrade bias tags. Reward and shop cards show compact source hints, and known-seed tests cover shop, elite, vault, and lunar reward outputs while preserving fresh-save starter safety.

## Work order 056 - Unlock-gated item families and discovery records

Goal: use permanent progression to widen item variety.

Prompt:

> Connect Phase 6 item families to unlock and discovery records. Some item families should begin locked or hidden until achievements, upgrades, bosses, sectors, or challenge flags expose them. Add save-safe discovered-item records if needed, with migration/import/export tests. The Unlock Archive should explain newly available item families without spoiling every detail by default. Preserve fresh-save pool sufficiency. Run checks.

Acceptance criteria:

- Item unlock gates alter future reward/shop/vault pools deterministically.
- Save migration and export/import preserve item discovery state if added.
- Unlock Archive can show item-family progress or discovery hints.
- Fresh saves remain complete and balanced.

Status: implemented; advanced curse/relic, classified heat/prototype, and advanced boss-pressure items now use deterministic family-tier unlock gates while baseline item families remain available for fresh saves. Save schema v4 records discovered item IDs and derived family IDs, migrates v1-v3 saves safely, and preserves discovery state through import/export. The Unlock Archive now shows item-family progress, locked/partial/unlocked states, and non-spoiler hints for gated families.

## Work order 057 - Synergy clusters and build identity readouts

Goal: make item combinations legible and exciting.

Prompt:

> Add a synergy model that detects or labels build clusters from item tags, families, and acquisition order. Target at least ten clusters, including existing archetypes plus new lunar, boss, route, and economy variants. Surface compact build identity in HUD, reward/shop context, and run summary where useful. Add tests for cluster detection, tie-breaking, and deterministic summary copy. Run checks.

Acceptance criteria:

- At least ten synergy clusters are represented.
- HUD or summary can describe the active build identity compactly.
- Cluster detection is deterministic and tested.
- Copy remains concise on narrow layouts.

Status: implemented; `BuildSynergy` now defines eleven deterministic clusters covering the eight legacy archetypes plus lunar, route, and boss-pressure identities. Cluster scoring uses item families, tags, and acquisition-order tie-breaking, with compact HUD, reward/shop build-fit, and run-summary readouts. Unit tests cover cluster coverage, scoring, tie-breaking, prospective copy, and empty-build copy.

## Work order 058 - Item card, shop, reward, and archive presentation

Goal: make a larger catalog readable to players.

Prompt:

> Improve item presentation across reward choices, shops, vaults, run summary, and Unlock Archive. Add compact original item icons or tag badges if practical, source/rarity/family labels, clear implemented/planned effect state, keyboard focus safety, high-contrast treatment, and narrow layout checks. Avoid external assets. Add unit tests for item card view models and E2E smoke for an item-heavy reward/shop path if practical. Run checks.

Acceptance criteria:

- Item cards communicate rarity, tags/family, source, and effect clearly.
- Shop/reward/archive item surfaces remain keyboard and pointer usable.
- Narrow/high-contrast layouts stay readable.
- Presentation changes do not alter deterministic generation.

Status: implemented; item presentation now uses shared `ItemCardViewModel` and `ItemCard` helpers across reward choices, shops, run summary item cards, and Unlock Archive discovered items. Cards show original inline SVG family icons, rarity/family/source/effect-state metadata, UI-tag badges, build-fit copy where relevant, and compact run/archive layouts with high-contrast and narrow-grid treatment. Unit tests cover item-card view model copy, and E2E smoke checks shop, reward, summary, and archive item-card surfaces.

## Work order 059 - Item stress smoke and balance instrumentation

Goal: make item-heavy runs measurable before release hardening.

Prompt:

> Add debug or test paths for item-heavy runs: forced reward chains, rich shop/vault inventory, dense synergy combat, and unlock-gated item pool previews where practical. Extend debug overlay or test helpers with item count, active hook counts, build identity, and proc budget state if useful. Add deterministic smoke coverage for at least one item-heavy path. Update QA/performance notes with item-specific budgets and manual playtest focus. Run checks.

Acceptance criteria:

- Debug/test tooling can inspect large item pools and active hook pressure.
- Browser or documented manual smoke covers an item-heavy reward/shop/vault path.
- Proc budgets and item effect risks are documented.
- Existing Phase 5 smoke remains green.

Status: implemented; `src/game/ItemStress.ts` now exposes a deterministic 23-item hook-heavy debug loadout, item-loadout pressure summaries, and fresh/unlocked reward-shop-vault pool previews. Debug key `6` behind `?debug=1` forces the item-storm combat pocket and adds overlay item count, active hook count, proc cap state, and build identity. Unit tests cover the stress model and pool previews, while Playwright smoke covers the `HOOK-STORM-SMOKE` item-storm path.

## Work order 060 - Phase 6 playtest release hardening

Goal: ship an item-catalog playtest candidate.

Prompt:

> Audit the Phase 6 build for item count, effect implementation status, hook determinism, reward/shop/vault weighting, unlock/discovery behavior, item UI readability, balance, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 6 plan, backlog, release checklist, and QA docs. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known item balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release docs document item count, hook coverage, reward pools, unlock/discovery state, and manual browser gaps.
- Phase 6 can be declared complete or explicitly deferred with documented blockers.

Status: implemented; Phase 6 is documented as complete as an item-catalog playtest candidate. Release, QA, performance, README, changelog, backlog, technical architecture, Phase 6, and Phase 7 planning docs now record the 60-item catalog, 14-hook item surface after work order 076 added environmental destruction hooks, source-weighted pools, unlock/discovery state, item-heavy smoke coverage, remaining item balance/browser risks, and the next enemy-behavior roadmap. Full check, escalated Playwright Chromium smoke, and production preview asset-path smoke passed locally for the closeout.

## Phase 7 work orders

Phase 7 begins after work order 060 validation and concludes the item-catalog playtest candidate. Its purpose is to make combat pressure richer and longer-sector play more tactical: audit enemy roles, formalize enemy metadata, differentiate movement and attack roles, add upgraded variants, create formation-aware waves, extend sector pacing, and harden readability/performance around longer enemy-rich sectors. Preserve deterministic wave, variant, formation, and sector-length behavior from seed plus save state.

## Work order 061 - Phase 7 enemy role taxonomy and audit

Goal: define the enemy behavior language before changing combat.

Prompt:

> Read `AGENTS.md` first. Then read the Phase 7 plan, current enemy/faction/wave content, wave director, collision/objective code, renderer, performance notes, QA plan, and relevant tests. Audit current enemy classes for role, silhouette, movement, attack cadence, durability, faction identity, spawn context, objective interaction, and readability. Add a concise enemy role audit doc or generated helper if useful. Do not add broad behavior changes yet. Update planning/backlog docs with role targets, gaps, and risk areas. Run checks.

Acceptance criteria:

- Current enemy roles and gaps are documented.
- Phase 7 target roles and pressure types are clear.
- Objective-desync, readability, and performance risks are identified before implementation.
- Deterministic behavior is unchanged except for docs or pure audit helpers.

Status: implemented; `docs/STARBREAK_SALVAGE_ENEMY_ROLE_AUDIT.md` now records the current four faction-pattern enemy classes, 24 semantic wave labels, shared normal-enemy spawn/durability model, objective-accounting paths, role gaps, and Phase 7 target roles. `src/content/enemyRoleAudit.ts` adds a pure repeatable audit helper with unit coverage, leaving live combat behavior unchanged for work order 062 schema work.

## Work order 062 - Enemy schema, role validation, and debug counters

Goal: make enemy roles data-driven and observable.

Prompt:

> Add role-oriented enemy metadata and validation for class, role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, and faction fit where practical. Keep content data explicit and avoid new runtime dependencies. Extend debug/test read models with active enemy role counts and variant/formation placeholders if useful. Add unit tests for metadata validation and known content coverage. Update README/debug and architecture notes. Run checks.

Acceptance criteria:

- Enemy content carries validated role metadata.
- Invalid role, movement, attack, faction, or formation metadata is caught by tests.
- Debug or pure helpers can summarize active enemy role pressure.
- Existing wave generation and gameplay remain deterministic.

Status: implemented; current faction-pattern enemy classes now carry explicit role metadata for class id, role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, faction fit, objective policy, and debug label. Content validation catches invalid role/movement/attack/formation/faction/objective metadata and duplicate class ids. `src/game/EnemyRolePressure.ts` summarizes active role and objective-policy counts with zeroed variant/formation placeholders for debug, and the overlay reports role pressure without changing wave generation or combat behavior.

## Work order 063 - Role-specific movement profiles

Goal: make enemy roles recognizable before adding more bullets.

Prompt:

> Implement distinct deterministic movement profiles for priority roles such as scout, bruiser, sniper, screener, carrier, support, and disruptor. Favor position, timing, lane pressure, retreats, escorts, and hover behavior over raw speed. Keep movement inside the fixed 640x720 combat world and stable under frame catchup. Add tests for profile bounds, deterministic updates, cleanup, and reduced-motion/readability interactions where practical. Update performance notes. Run checks.

Acceptance criteria:

- At least four roles have visibly different movement behavior.
- Movement remains fixed-step, deterministic, and clamped to the combat world.
- No movement profile can strand enemies offscreen or block sector completion indefinitely.
- Debug/dense smoke still stays within entity and readability budgets.

Status: implemented; `src/systems/EnemyMovement.ts` now drives normal enemy movement from validated `movementFamily` metadata. The four current roles have distinct fixed-step profiles: bruisers drift with heavy lane pressure, screeners hold lanes tightly, disruptors sway in wider organic arcs, and scouts skate laterally with stronger flank motion. Movement is clamped inside the combat world, direct debug scenarios now preserve home anchors, attacks/spawns/objective policy remain unchanged, and unit tests cover deterministic replay, profile differences, bounds, and large-step entry safety.

## Work order 064 - Role-specific attack cadences and telegraphs

Goal: differentiate enemy pressure without unreadable bullet spam.

Prompt:

> Add role-specific attack cadence, projectile shape/speed, aim style, and telegraph language for priority enemy roles. Examples include sniper charge shots, screener lane curtains, carrier deploy bursts, support pulses, disruptor hazard marks, and bruiser close-range volleys. Keep projectiles readable over all current sector backgrounds and high-contrast mode. Add deterministic cadence and projectile-budget tests. Update QA/performance notes. Run checks.

Acceptance criteria:

- Role attacks have distinct timing and pressure profiles.
- Projectile and telegraph budgets remain bounded.
- High-contrast and reduced-motion settings preserve clarity.
- Known-seed or unit tests prove attack cadence is deterministic.

Status: implemented; `src/systems/EnemyAttack.ts` now drives normal enemy attack cadence, telegraph duration, warning label, aim style, projectile speed/radius, tags, and projectile budgets from validated `attackFamily` metadata. Current roles now warn before firing: bruisers use slower heavy scrap volleys, screeners use short lane warnings and paired bolts, disruptors use ring-marked spore spreads, and scouts use quick fan warnings into aimed phase needles. Future charged, curtain, deploy, support, and hazard-mark families are profiled for later enemy classes. Combat state now tracks normal-enemy windups, cancels pending windups on bombs, gates warnings until enemies enter their hold band, and unit tests cover deterministic cadence plus projectile/telegraph budgets.

## Work order 065 - Upgraded enemy variants and elite modifiers

Goal: add tactical escalation through clear variants.

Prompt:

> Add deterministic upgraded enemy variants and elite modifiers such as armored, overclocked, evasive, volatile, shielded, escort, commander, or salvage-rich. Variants should be gated by sector depth, faction, route pressure, challenge flags, or encounter type, and should use clear visual/readability cues. Avoid hidden damage spikes and preserve fresh-save generosity. Add validation and known-seed tests for variant selection. Update README/debug, release, and performance notes. Run checks.

Acceptance criteria:

- Variant rules are data-driven, seeded, and validated.
- Variants change player decisions through clear behavior or durability cues.
- Fresh opening sectors do not become unfair.
- Debug or summary surfaces can expose variant pressure for playtesting.

Status: implemented; upgraded enemy variants are now defined in `src/content/enemyVariants.ts` and validated with enemy role/faction eligibility. The wave director chooses optional variant IDs deterministically from a forked per-spawn RNG using sector depth, route pressure, challenge flags, elite/boss-gate context, and faction eligibility while keeping fresh opening sectors variant-free. Combat applies conservative visible modifiers for armored, overclocked, evasive, volatile, shielded, and salvage-rich enemies without damage spikes, the renderer adds ring/badge cues, the debug overlay reports active variant pressure, and unit coverage pins selection, validation, spawn modifiers, reward drops, and role-pressure summaries.

## Work order 066 - Formation definitions and squad spawning

Goal: create tactical enemy shapes that are deterministic and readable.

Prompt:

> Add formation definitions for squads such as wedge, column, ring, screen, escort, pincer, staggered lane, or convoy. Integrate formation spawning with existing wave schedules while preserving distance-marker ordering and frame-catchup safety. Formations should define roles, offsets, timing, entry style, spacing, optional break condition, and cleanup behavior. Add tests for formation generation, spawn order, bounds, and determinism. Run checks.

Acceptance criteria:

- Formation definitions are content-driven and validated.
- Spawned formations stay inside the fixed combat world and do not overlap incoherently.
- Frame catchup cannot skip or duplicate formation members.
- Formation spawning does not break current objective progress.

Status: implemented; `src/content/enemyFormations.ts` now defines validated wedge, column, screen, escort, pincer, convoy, ring, and staggered-lane formations with member roles, fixed-world offsets, timing, entry style, spacing, break condition, cleanup policy, and compact canvas cue metadata. The wave director chooses optional formations from seeded per-wave RNG forks, expands multi-member waves into ordered `EnemySpawn` entries without changing the existing spawn-index catchup contract, assigns member factions from role/shape eligibility, and keeps fresh opening/single-target waves formation-free. Combat preserves formation annotations on live enemies, rendering adds lightweight formation arcs/labels, the debug overlay reports active formation counts, and unit coverage pins validation, known-seed formation schedules, bounds, deterministic order, and frame-catchup duplicate prevention.

## Work order 067 - Formation-wave integration and objective safety

Goal: make formations work with sector objectives, rewards, and routes.

Prompt:

> Connect formations to wave director pacing, route-conditioned pressure, faction identity, optional rewards, and objective completion. Ensure simultaneous formation kills, secondary item kills, despawns, and body collisions all advance objectives consistently. Add regression coverage for multi-kill formation clears and sector-complete handoff. Update QA notes with formation smoke seeds. Run checks.

Acceptance criteria:

- Formation waves can appear in normal sector schedules without soft locks.
- Objective target counts cannot desync when formation members die together or through secondary effects.
- Route/faction conditions can bias formation types deterministically.
- Tests cover formation clear, despawn, and sector-completion paths.

Status: implemented; formation selection now uses deterministic route, encounter, faction-role, and faction-shape weighting while preserving seeded per-wave RNG forks. Formation spawns carry instance IDs for one-time clear rewards, definitions declare small clear-bonus salvage values, and combat routes simultaneous kills, item side-effect kills, despawns, and body collisions through shared objective accounting. Unit coverage now pins route/faction bias, formation instance grouping, multi-kill clears, secondary item clears, despawn clears, body-collision clears, and distance-sector completion handoff.

## Work order 068 - Longer sector pacing and encounter arcs

Goal: make longer sectors feel authored instead of stretched.

Prompt:

> Extend sector length and encounter pacing for selected routes/sectors with mid-sector beats, relief windows, formation clusters, hazard/background landmarks, and boss-approach pacing. Avoid constant maximum enemy density. Update summaries/debug state to explain longer-sector modifiers. Add deterministic tests for length bands, wave/formation spacing, relief intervals, and route-conditioned longer-sector outputs. Run checks.

Acceptance criteria:

- Longer sectors use clear pacing arcs with pressure and relief windows.
- Route-conditioned length and encounter density reproduce from seed plus save state.
- Debug/summaries expose useful longer-sector context.
- Long sectors stay within performance and readability budgets.

Status: implemented; `src/game/SectorPacing.ts` now derives deterministic pacing arcs after route-conditioned sector modifiers, stretching selected routes and later sectors with pressure bands, relief windows, explicit wave-distance ratios, formation-cluster wave marks, landmark/hazard beats, and boss-approach adjustments without changing the base run skeleton. Gameplay, sector transitions, debug overlay plan strings, and run summaries expose the active pacing context. Wave planning now consumes explicit ratios and cluster marks, while unit coverage pins route-conditioned length bands, relief intervals, formation-cluster spacing, boss approach handoff, pacing timelines, and encounter-pacing validation.

## Work order 069 - Enemy readability, accessibility, and stress smoke

Goal: harden the richer enemy ecosystem before release closeout.

Prompt:

> Add debug and smoke paths for enemy-rich sectors, upgraded variants, and formation pressure. Extend overlay or pure helpers with role counts, variant counts, formation labels, long-sector pressure, and projectile/telegraph budgets. Check high-contrast, reduced-motion, performance mode, narrow viewport, and item-storm interactions. Add Playwright smoke where practical and update QA/performance docs. Run checks.

Acceptance criteria:

- Debug/test tooling can inspect role, variant, formation, and long-sector pressure.
- Browser smoke covers at least one enemy-rich formation or variant path.
- Accessibility settings keep enemy bullets and telegraphs readable.
- Existing item-storm and long-scroll smoke remain green.

Status: implemented; the debug toolset now includes an `E` enemy-rich stress pocket with 10 active enemies, all first-pass variant badges, multiple formation labels, 36 enemy projectiles, 4 telegraphs, and compact role/variant/formation/budget overlay telemetry. Long-sector debug state now reports the active pacing arc/beat, and the enemy role summary reports projectile and telegraph counts against stress budgets. Unit coverage pins the input binding, deterministic enemy-rich pocket, role-pressure budgets, and pacing beat helper. Playwright smoke drives a narrow, high-contrast, reduced-motion, performance-mode run into Lunar Surface, triggers the enemy-rich pocket, and verifies role, variant, formation, long-sector pacing, projectile, and telegraph readouts while existing item-storm and long-scroll smoke remain covered.

## Work order 070 - Phase 7 enemy playtest release hardening

Goal: ship an enemy-behavior playtest candidate.

Prompt:

> Audit the Phase 7 build for role differentiation, upgraded variants, formation behavior, longer-sector pacing, deterministic wave/variant/formation generation, objective safety, readability, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 7 plan, backlog, release checklist, QA docs, and architecture notes. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known enemy balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release docs document role coverage, variant rules, formation smoke, longer-sector tuning, and manual browser gaps.
- Phase 7 can be declared complete or explicitly deferred with documented blockers.

Status: implemented; Phase 7 is closed as an enemy-behavior playtest candidate. The closeout audited and refreshed README, changelog, performance notes, Phase 7 plan, backlog, release checklist, QA docs, and architecture notes for role coverage, variant rules, formation smoke, longer-sector tuning, browser gaps, and follow-up balance risks. A boss-arena/hazard fairness blocker was fixed by deferring any sector hazard window that overlapped the hidden arena lock: when the boss dies and scrolling releases, that hazard restarts its warning lead before becoming damaging. Unit coverage pins the deferred boss-release hazard behavior alongside the existing sector feature collision tests; full check, escalated Playwright Chromium smoke, and production preview smoke provide the local release evidence.

## Work order 071 - Phase 8 environmental planning refresh

Goal: start Phase 8 with a coherent environmental systems roadmap.

Prompt:

> Refresh planning documentation for Phase 8 around richer hazard zones, destructibles/obstacles, and loose currency. Read AGENTS.md and the relevant docs first. Add or update a Phase 8 plan, work orders 071-080, backlog epics, QA/release guidance, architecture notes, performance notes, README links, changelog planning notes, and release checklist status. Keep the scope docs-only unless a blocking documentation inconsistency requires a small fix. Run checks appropriate for docs-only changes and summarize changed files.

Acceptance criteria:

- Phase 8 has 10 new work orders with clear sequencing and acceptance criteria.
- Planning docs describe hazard-zone richness, destructible/obstacle systems, loose currency, debug smoke, and release hardening.
- Docs preserve deterministic generation, fixed 640x720 combat-world parity, accessibility, and boss-release hazard fairness constraints.
- Checks pass or any docs-only check limitation is documented.

Status: implemented; Phase 8 planning is refreshed with `docs/STARBREAK_SALVAGE_PHASE_8_PLAN.md`, work orders 071-080, new backlog epics, QA seed/validation/performance guidance, architecture priorities, performance budgets, release checklist status, README planning links, and changelog notes. The plan frames richer hazard zones, destructibles/obstacles, loose currency, environmental debug smoke, and release hardening while preserving deterministic generation, fixed 640x720 combat-world parity, accessibility settings, and boss-release hazard fairness.

## Work order 072 - Hazard-zone schema and current-feature audit

Goal: turn hazards into validated content before adding new density.

Prompt:

> Audit current sector feature, hazard, landmark, pacing, boss-arena, debug, and accessibility code. Add a hazard-zone schema or registry that can describe hazard id, family, sector/faction fit, phase timing, telegraph shape, active damage shape, safe-lane expectation, damage cooldown, layering/readability metadata, reduced-motion/high-contrast/performance variants, boss-arena suppression behavior, and debug label. Migrate existing hazard definitions into the schema where practical. Add content validation and deterministic tests. Run checks.

Acceptance criteria:

- Existing hazard behavior is represented or mapped by a typed hazard-zone contract.
- Validation catches duplicate IDs, unsupported shapes/families, invalid phase durations, invalid damage windows, missing accessibility metadata, and unsafe boss-arena behavior flags.
- Hazard metadata stays data-driven and generated from explicit RNG streams, never `Math.random()`.
- Tests cover current hazard plans and boss-release safety assumptions.

Status: implemented; `src/content/hazardZones.ts` now defines the first typed hazard-zone registry for the eight existing hazard kinds, including family, sector/faction fit, telegraph/damage shapes, per-source phase metrics, damage cooldown metadata, safe-lane policy, readability colors/layers/settings variants, and the boss-arena `hideAndDefer` policy. `SectorFeatures`, `SectorConditions`, `SectorPacing`, and `CanvasRenderer` now consume the registry while preserving current sector, route-condition, and pacing timings. Content validation rejects malformed hazard-zone definitions, generated feature validation checks registered warning/active spans and damage, and unit coverage pins shipped definitions, current plans, invalid schema fixtures, viewport-safe hazard ratios, and boss-release deferral assumptions.

## Work order 073 - Rich hazard-zone behavior library

Goal: add distinct environmental danger patterns without sacrificing readability.

Prompt:

> Implement a first richer hazard-zone behavior library using the schema from work order 072. Add original patterns such as sweep beams, pulse fields, drifting mine bands, collapsing columns, orbital shadows, plasma curtains, dust fronts, or static warning gates. Keep active hazards below bullets and core actors, respect reduced motion/performance/high contrast settings, and use fixed combat-world units. Add deterministic tests for phase timing, collision windows, warning lead, damage cooldown, cleanup, and settings-aware render state. Run checks.

Acceptance criteria:

- At least five richer hazard-zone families exist with distinct telegraph and active-state behavior.
- Collision can only deal damage during validated active windows after a visible warning lead.
- Hazard rendering remains readable below bullets in normal and high-contrast modes.
- Reduced motion and performance mode simplify presentation without changing generated hazard timing.

Status: implemented; hazard definitions now include validated behavior metadata for sweep beams, pulse fields, drifting mine bands, collapsing columns, orbital shadows, plasma curtains, dust fronts, and static warning gates. `src/game/HazardZoneBehavior.ts` derives settings-aware presentation state, damage-window gating, and fixed-world damage rectangles from the registry while `SectorHazards` applies collision only during active damage windows and honors hazard damage cooldown metadata. Canvas rendering now consumes behavior families for sweep/drift/pulse/gate/curtain/dust cues below bullets, with reduced-motion and performance mode simplification. Unit coverage pins family breadth, warning-before-damage, pulse open/closed windows, cooldown behavior, cleanup after end distance, fixed-world damage rect bounds, and settings-aware render state.

## Work order 074 - Hazard director, pacing integration, and boss-release safety

Goal: schedule richer hazards as part of sector pacing, not as surprise clutter.

Prompt:

> Integrate richer hazard zones with sector pacing, route pressure, relief windows, lunar/background context, formation clusters, and boss approach/release states. The director should generate deterministic hazard-zone schedules from seed plus save/sector context, process distance markers in order under frame catchup, and avoid overlapping hidden boss-arena locks without restarting a warning lead afterward. Update summaries/debug state with useful hazard-zone context. Add tests for known-seed schedules, relief-window spacing, route-conditioned hazard pressure, frame-catchup order, and boss-release deferral. Run checks.

Acceptance criteria:

- Hazard-zone schedules reproduce from seed plus save state.
- Hazard density respects pressure and relief windows rather than stacking constant danger.
- Frame catchup cannot skip, duplicate, or instantly activate distance-tied hazard phases.
- Boss defeat cannot release an already-damaging hidden hazard without a fresh telegraph.

Status: implemented; `src/game/HazardZoneDirector.ts` now materializes sector, route, and paced hazard-zone schedules from seed plus save/sector context. `SectorPacing` keeps pressure, relief, formation, landmark, and boss-approach beats while the director turns hazard beats, route pressure, lunar context, formation clusters, and boss approach into validated windows. Schedules expose ordered telegraph/active/clear events for frame-catchup consumption, debug and run-summary surfaces report hazard-zone pressure, relief, and boss deferrals, and boss-lock overlaps either restart a fresh post-lock telegraph or drop if they cannot fit safely. Unit coverage pins deterministic known-seed schedules, relief spacing, route pressure, catchup ordering, and boss-release deferral.

## Work order 075 - Destructible and obstacle content schema

Goal: define physical sector clutter as validated content.

Prompt:

> Add content contracts for destructibles and obstacles such as debris, cargo pods, shield gates, rock fields, surface pylons, wreck plates, salvage caches, and volatile canisters. Definitions should include id, family, collision shape, hull/durability, damage interaction, objective policy, reward policy, chain behavior, sector/faction fit, fixed-world placement constraints, rendering cues, audio/VFX cue names, accessibility metadata, and debug labels. Add validation and pure placement helpers where needed. Run checks.

Acceptance criteria:

- Destructibles and obstacles are represented by typed data rather than ad hoc scene branches.
- Validation catches bad IDs, invalid shapes, impossible sizes, missing objective policy, unsupported rewards, unsafe lane constraints, and missing cue metadata.
- Placement helpers use the fixed 640x720 combat world and are independent from viewport size.
- Fresh sectors retain enough open lanes for fair movement.

Status: implemented; `src/content/environmentObjects.ts` now defines the first typed destructible/obstacle catalog for debris shard clusters, cargo pods, shield gates, lunar rock fields, surface pylons, wreck plates, salvage caches, and volatile canisters. Definitions include kind, family, sector/faction fit, collision footprint, durability, damage-source rules, objective policy, reward policy, chain behavior, fixed-world placement constraints, rendering/audio/VFX cues, accessibility variants, and debug labels. `src/game/EnvironmentObjectPlacement.ts` adds deterministic fixed-640x720 placement helpers with safe-lane validation, and content validation rejects invalid IDs, shapes, impossible sizes, bad objective/reward/chain policies, unsafe lane constraints, and missing cue metadata. Runtime destruction, rewards, chain reactions, active debug counters, lane-safe obstacle placement, and player contact navigation pressure are implemented through work orders 076-077.

## Work order 076 - Destructible interactions, rewards, and chain reactions

Goal: make destructibles useful, readable, and safe for objective/economy flow.

Prompt:

> Implement destructible runtime interactions from the schema. Destructibles should take weapon, bomb, special, hazard, or chain-reaction damage where allowed, spawn bounded rewards where allowed, trigger item hooks through explicit event payloads, and clean up through the normal fixed-step loop. Add compact original canvas cues, audio/VFX feedback, debug counters, and tests for destruction, reward drops, chain reactions, item-hook dispatch, cleanup, and objective safety. Run checks.

Acceptance criteria:

- Destroying destructibles cannot desync sector objectives or formation/enemy target counts.
- Reward drops are deterministic, capped, and routed through existing pickup/economy systems.
- Chain reactions are bounded and cannot create runaway entity/proc pressure.
- Destructible cues remain readable in high contrast, reduced motion, and performance mode.

Status: implemented; deterministic environment object placement plans now instantiate runtime destructible/obstacle entities in `CombatState` with fixed-distance activation, hit flashes, hazard cooldowns, and normal fixed-step cleanup. Player weapon, special, bomb, hazard, and bounded chain-reaction damage use the schema's allowed-source rules; rewards roll deterministically per seed/object and spawn capped credit/salvage pickups through the existing economy path. `onEnvironmentObjectDestroyed` adds an explicit item hook payload, with Salvage Dividend Chip now paying a small bonus from salvage-rich wreckage and the item-storm debug loadout expanded to 23 items across 14 hooks. Canvas rendering adds compact original object cues plus break/chain effects, feedback/audio add an `environmentDestroyed` cue, debug state reports active environment/destructible/obstacle counts, and tests cover destruction, deterministic rewards, chain bounds, hazard damage, hook dispatch, cleanup, and objective safety. `npm run check` and escalated Playwright Chromium smoke passed.

## Work order 077 - Obstacle layouts, lane safety, and navigation pressure

Goal: make obstacles shape movement without creating unfair walls.

Prompt:

> Add deterministic obstacle placement layouts that can create lanes, cover, gates, or navigation pressure across selected sectors. Placement should respect safe-lane guarantees, player spawn/exit corridors, boss approach locks, hazard overlays, enemy spawn lanes, and fixed combat-world bounds. Add validation and tests for no unavoidable walls, no blocked exit progress, frame-catchup cleanup, narrow/wide viewport parity, and long-sector obstacle pacing. Run checks.

Acceptance criteria:

- Obstacle layouts reproduce from seed plus sector context and remain in fixed-world units.
- Safe-lane checks prevent unavoidable damage and hard movement blocks.
- Obstacles cannot trap the player at sector exit, boss release, or route transition.
- Debug summaries expose active obstacle/destructible counts for smoke.

Status: implemented; environment object placement now consumes current hazard windows, enemy spawn lane reservations, and boss arena lock distances while keeping the fixed 640x720 combat world. Generated objects account for active lead/trail windows, player spawn corridors, sector exit corridors, boss approach/lock/release space, hazard lane overlays, enemy spawn lanes, per-definition safe-lane widths, and long-sector spacing. Runtime blocking objects now push the player out of their footprint and apply schema contact damage through the existing player-hit path, so obstacles shape lanes without becoming objective targets or viewport-scaled walls. Unit coverage pins deterministic placement, fixed-world parity, corridor/lock/lane avoidance, long-sector pacing, obstacle contact pushout, safe-frame bounds, and objective safety. `npm run check` passed locally.

## Work order 078 - Loose currency scatter, pickup attraction, and economy feedback

Goal: turn scrap and credits into moment-to-moment salvage lanes.

Prompt:

> Add loose currency scatter patterns for scrap and credits from enemies, destructibles, route events, hazards, and sector features. Define drift, lifetime, pickup attraction, collection radius, cap rules, value tiers, route/sector bias, debug counters, and feedback copy. Ensure pickup behavior is deterministic and settings-aware, with conservative economy tuning so banked scrap does not inflate too quickly. Add tests for scatter determinism, pickup magnet behavior, cap enforcement, summary/economy accounting, and fresh/progressed save paths. Run checks.

Acceptance criteria:

- Loose currency spawns from deterministic plans or explicit event payloads, not random per-frame behavior.
- Pickup attraction and collection behave consistently across viewport sizes.
- Active loose currency count/value is capped and visible in debug.
- Run summaries and upgrade progress remain accurate after loose currency collection.

Status: implemented; `src/game/LooseCurrency.ts` now owns deterministic scatter specs, value tiers, drift, TTL, collection radius, conservative sector/route/hazard/feature lane planning, and active count/value cap summaries. Combat now routes enemy, boss, destructible, and sector-plan currency through shared cap enforcement, fixed-world pickup attraction, expiration, collection counters, and run-result economy accounting. Gameplay creates one loose-currency plan per sector from current features, obstacle placements, and route pressure, adds HUD hint copy for active salvage lanes, and the debug overlay reports loose pickup count/value plus credit/salvage split against caps. Unit coverage pins scatter determinism, pickup magnet behavior, cap enforcement, run-summary/save/upgrade accounting for fresh and progressed saves, and existing obstacle/destructible reward regressions. `npm run check` and escalated Playwright Chromium smoke passed.

## Work order 079 - Environmental debug smoke, accessibility, and performance hardening

Goal: make the richer environmental layer inspectable before release closeout.

Prompt:

> Add debug/test paths for hazard-heavy, destructible-rich, obstacle-lane, and loose-currency-rich scenarios. Extend overlay or pure helpers with active hazard-zone counts, hazard family labels, destructible/obstacle counts, loose currency count/value, pickup cap state, and environmental stress budgets. Check high contrast, reduced motion, performance mode, narrow viewport, boss-release hazards, item-storm interactions, long-sector travel, and dense enemy pressure. Add Playwright smoke where practical and update QA/performance docs. Run checks.

Acceptance criteria:

- Debug/test tooling can inspect environmental pressure without private app-state access.
- Browser smoke covers at least one environmental stress path where practical.
- Accessibility settings keep bullets, hazards, obstacles, pickups, and HUD text readable.
- Existing item-storm, enemy-rich, dense-combat, forced-exit, destruction, and long-scroll smoke remain green.

Status: implemented; the debug toolset now includes an `H` environmental stress pocket that seeks to an active hazard overlap, clears combat pressure, and creates a deterministic field with six schema-backed environment objects, four destructibles, two obstacles, ten capped loose-currency pickups, and environment hit/chain feedback. `src/game/EnvironmentStress.ts` exposes pure stress-budget summaries for active hazard count, hazard family labels, environment object/destructible/obstacle totals, loose pickup/value caps, and budget state; the debug overlay reports the same `Env stress` line without private app-state access. Unit coverage pins deterministic stress-pocket contents and budget summaries, while Playwright smoke drives a narrow high-contrast/reduced-motion/performance run through `ENVIRONMENT-STRESS-SMOKE`, presses `H`, and verifies hazard/object/currency/readability telemetry. `npm run check`, escalated Playwright Chromium smoke, and production preview asset smoke passed locally.

## Work order 080 - Phase 8 environmental playtest release hardening

Goal: ship an environmental systems playtest candidate.

Prompt:

> Audit the Phase 8 build for richer hazard zones, hazard director pacing, destructible interactions, obstacle lane safety, loose currency economy, deterministic generation, objective safety, boss-release hazard fairness, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 8 plan, backlog, release checklist, QA docs, and architecture notes. Run `npm run check`, Playwright smoke with escalation if available, and production preview smoke. Summarize known environmental balance, economy, browser, and readability risks.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser/AppData blockers are clearly documented.
- Release docs document hazard-zone coverage, destructible/obstacle rules, loose currency tuning, debug smoke, and manual browser gaps.
- Phase 8 can be declared complete or explicitly deferred with documented blockers.

Status: implemented; Phase 8 is closed as an environmental systems playtest candidate. Release hardening fixed a key environment/loot presentation blocker by treating environment object placements and loose currency drops as scroll-world entities: destructibles and obstacles now derive live screen position from sector distance, planned loose-currency lanes spawn before their anchor distance and scroll in with the background, and enemy/boss/destructible drops continue drifting with the sector after they appear instead of hovering in viewport space. Unit regressions cover scrolled object collision/presentation, planned currency scroll-in, and dropped enemy loot scrolling, while the existing environmental stress, item-storm, enemy-rich, forced-exit, destruction, long-scroll, and narrow HUD smoke remain green. README, changelog, performance notes, Phase 8 plan, backlog, release checklist, QA docs, and architecture notes now document the candidate, remaining balance/readability/economy risks, and manual browser gaps. `npm run check`, escalated Playwright Chromium smoke, and production preview asset smoke passed locally.

## Work order 081 - Phase 9 second-act planning refresh

Goal: start Phase 9 with a coherent roadmap for a two-act run loop.

Prompt:

> Refresh planning documentation for Phase 9 around expanding the game loop with a second act. Read AGENTS.md and relevant docs first. Add or update a Phase 9 plan, work orders 081-090, backlog epics, QA/release guidance, architecture notes, performance notes, README links, changelog planning notes, project plan status, and release checklist status. Keep the scope docs-only unless a blocking documentation inconsistency requires a small fix. Preserve deterministic generation, fixed 640x720 combat-world parity, scroll-world environmental behavior, boss-release hazard fairness, accessibility, and GitHub Pages constraints. Run checks appropriate for docs-only changes and summarize changed files.

Acceptance criteria:

- Phase 9 has 10 new work orders with clear sequencing and acceptance criteria.
- Planning docs describe the two-act run model, inter-act junction, Act II sector route pool, Act II pacing/objectives, rewards/economy, bosses/finale, debug smoke, and release hardening.
- Docs preserve seeded determinism, backward-compatible saves/summaries, fixed-world viewport parity, accessibility settings, and Phase 8 environmental constraints.
- Checks pass or any docs-only check limitation is documented.

Status: implemented; Phase 9 planning is refreshed with `docs/STARBREAK_SALVAGE_PHASE_9_PLAN.md`, work orders 081-090, new backlog epics, QA seed/performance guidance, architecture priorities, README/project-plan links, changelog planning notes, and release checklist status. The plan frames a deterministic two-act run structure with an inter-act junction, Act II route/sector pool, Act II pacing/objectives, combat/environment escalation, economy/reward tuning, second-act boss/finale work, debug smoke, and release hardening while preserving existing determinism, fixed-world parity, scroll-world environmental behavior, boss-release hazard fairness, accessibility, and static GitHub Pages deployment.

## Work order 082 - Act model and run progression schema

Goal: give the run generator and runtime an explicit two-act structure.

Prompt:

> Audit run generation, route flow, sector transition, objective completion, boss gates, summaries, debug state, save records, seed links, and tests for one-act assumptions. Add typed act definitions and deterministic act plans for Act I and Act II, including act id/name, sector budget, route grammar, boss/finale gate, reward tier, and transition rules. Carry act context through gameplay, route/sector transition screens, run summaries, debug overlays, and backward-compatible save/summary records. Add deterministic tests for same-seed act plans, legacy summary normalization, route handoff, and existing one-act smoke compatibility. Run checks.

Acceptance criteria:

- Same seed plus save state reproduces the same Act I/Act II structure.
- Act context is visible in transitions, summaries, and debug without private app-state access.
- Existing seed links, saves, summary records, and debug shortcuts remain backward compatible.
- The implementation does not change viewport parity, environmental scroll-world behavior, or boss-release hazard fairness.

Status: implemented; the run skeleton now has validated act definitions in `src/content/acts.ts`, deterministic act-plan helpers in `src/game/ActPlan.ts`, and public `acts` plus per-sector act context on generated runs. The current target route is ten sectors: Act I covers sectors 1-5 and Act II covers sectors 6-10 while reusing the existing sector vocabulary until the Act II route/content work lands. Gameplay, route, sector-transition, run-summary, debug overlay, route-history, and save records now carry act id/name/index, act sector progress, reward tier, pressure tier, boss gate, and transition metadata. Legacy last-run summaries normalize missing act fields to unknown/zero values. Focused tests cover act planning, content validation, same-seed act plans, route handoff context, summary formatting, and save normalization.

## Work order 083 - Inter-act junction and midpoint refit choices

Goal: make the midpoint between acts a clear tactical breath.

Prompt:

> Add an inter-act junction after Act I completion and before Act II launch. Present deterministic refit choices such as repair, route intel, shop discount, extra reward, salvage bank option, or higher-risk Act II modifier. Apply the selected choice to Act II generation and summaries. Support keyboard-only flow, pause/abandon safety, reduced motion, high contrast, performance mode, and narrow viewports. Add tests for deterministic choice sets, choice effects, route handoff, resource accounting, and accessibility-friendly copy. Run checks.

Acceptance criteria:

- The player clearly sees Act I complete, junction options, and Act II launch state.
- Junction choices are deterministic from seed plus save state and affect Act II through explicit data.
- Existing route/reward/shop/summary flows remain stable.
- Keyboard and accessibility settings keep the junction usable.

Status: implemented; completing Act I sector 5 now opens a contract-themed `InterActJunctionScene` before Act II sector 6. The junction generates three deterministic choices from seed, save fingerprint, and run resources, always including repair plus seeded options for route intel, broker discount, extra reward choice/bias, salvage advance, or overburn risk. The selected choice is recorded in `RunSession`, applies explicit resource deltas and Act II effects, and feeds Act II route intel, shop discounts, reward choice/bias modifiers, sector-transition copy, run-summary rows, and debug overlay readouts. Keyboard confirm selects the focused first choice, pause/back can abandon safely into a summary, and the layout uses existing reduced-motion, high-contrast, performance, and narrow-viewport scene conventions. Focused tests cover deterministic choice sets, Act I-to-Act II handoff, effect/resource accounting, summary formatting, route length, and updated deterministic snapshots.

## Work order 084 - Act II sector route pool and content contracts

Goal: create the first distinct Act II route and sector vocabulary.

Prompt:

> Add data contracts and first-pass content for Act II sector routes. Define Act II route tags, sector fit, faction fit, background identity hooks, objective families, environmental pressure hints, reward tier hints, and route-card copy. Generate deterministic Act II route options from act context without disrupting Act I. Add content validation and tests for missing references, known-seed Act II route snapshots, route-card copy, and fresh/progressed save eligibility. Run checks.

Acceptance criteria:

- Act II route options are distinct from Act I and deterministic from seed plus act context.
- Route previews communicate pressure/reward tradeoffs before launch.
- Content remains original, data-driven, and validation-covered.
- Act I route generation remains unchanged except for explicit act context.

Status: implemented; Act II route options now generate from data-driven contracts in `src/content/actRouteContracts.ts` through `src/game/ActRouteContracts.ts`, while Act I keeps the prior generic route weighting. Each Act II contract defines route kind, tags, sector fit, faction fit, background hooks, objective families, environmental pressure hint, reward-tier hint, route-card copy, deterministic weight, risk offset, and optional unlock gates. Route cards now show Act II pressure/reward/terrain previews, generated run summaries expose selected act-route contracts, and content validation rejects invalid act, route, sector, faction, background, objective, tag, unlock, weight, and risk references. Focused tests cover fresh/progressed save eligibility, known-seed Act II route snapshots, route-card copy, content validation, and Act I route stability.

## Work order 085 - Act II pacing arcs and objective variants

Goal: make second-act sectors feel deeper without becoming exhausting.

Prompt:

> Extend sector pacing and objective systems for Act II. Add act-aware length bands, relief windows, pressure bands, objective variants, boss-approach tuning, route-conditioned pacing modifiers, and summary/debug readouts. Avoid flat density increases. Add deterministic tests for Act II length bands, relief spacing, objective gates, boss approach handoff, frame-catchup safety, and known-seed pacing timelines. Run checks.

Acceptance criteria:

- Act II sectors have recognizable pacing arcs with pressure and relief.
- Objectives and travel gates remain deterministic and readable.
- Long-run pacing exposes useful debug/summary context.
- Existing long-scroll, enemy-rich, item-storm, and environmental stress paths remain green.

Status: completed in work order 085. Act II now exposes objective variants, length bands, pressure bands, extra second-act relief windows, route-conditioned pacing modifiers, boss-approach tuning, and summary/debug readouts with deterministic tests.

## Work order 086 - Act II combat and environmental escalation

Goal: integrate existing enemy and environmental systems into act-aware pressure.

Prompt:

> Add act-aware pressure rules that can influence enemy roles, variants, formations, hazard director output, environment object placement, loose currency, and item-proc stress without creating ad hoc second-act code paths. Expose act pressure budgets in debug overlays. Keep caps conservative and preserve fixed-world collision, scroll-world environment behavior, and boss-release hazard fairness. Add tests for act-aware pressure selection, budget summaries, viewport parity, and combined enemy/environment stress. Run checks.

Acceptance criteria:

- Act II pressure uses existing data-driven systems and explicit act context.
- Debug exposes act-aware enemy, hazard, environment, projectile, pickup, and item pressure.
- Combined pressure stays below documented stress budgets.
- No viewport-dependent lane or pickup behavior is introduced.

Status: completed in 086.

Notes:

- Added a shared act-pressure model that derives baseline, sustained, volatile, and finale pressure from explicit sector act context plus pacing.
- Threaded act pressure into existing wave, hazard, environment object, loose currency, item-stress, and debug summary systems while preserving conservative caps.
- Added act-pressure tests for selection, budget summaries, fixed-world placement parity, and combined enemy/environment stress.

## Work order 087 - Act II rewards, shops, and economy tuning

Goal: make longer runs rewarding without flooding the economy.

Prompt:

> Extend reward, shop, vault, elite, boss, loose-currency, and upgrade-progress models for Act II. Add act-aware pool weighting, shop stock/price/reroll tuning, repair scarcity, salvage/credit income expectations, and summary copy that separates Act I and Act II economy. Keep permanent progression focused on variety/information sidegrades. Add deterministic fresh/progressed save snapshots for rewards, shops, vaults, junction effects, and run-summary economy. Run checks.

Acceptance criteria:

- Act II rewards feel stronger but do not invalidate existing item/shop/banked-scrap pacing.
- Reward/shop/vault generation remains deterministic from seed plus save and act context.
- Summaries explain Act I versus Act II economy and item sources.
- Upgrade progress and save accounting remain backward compatible.

Status: implemented.

Notes:

- Added `src/game/ActEconomy.ts` as the shared Act II economy profile for reward weighting, shop stock/price/reroll tuning, route payout bonuses, repair/vault surcharges, loose-currency budgets, and upgrade-progress framing.
- Threaded the profile through rewards, shops, route events, combat-result session accounting, loose-currency planning, reward/shop UI, and run-summary economy copy while keeping Act I neutral.
- Run summaries now separate Act I route economy, junction changes, Act II route economy, recovered currency/salvage, item sources, and upgrade-economy scope.
- Added deterministic fresh/progressed Act II economy snapshots covering rewards, shops, vaults, junction effects, run-summary economy helpers, and save/update accounting.

## Work order 088 - Second-act bosses and finale

Goal: give the two-act run a satisfying final escalation.

Prompt:

> Add second-act boss/finale structure using the existing boss arena, boss phase, hazard, route, reward, summary, and debug contracts. Define Act II boss variant selection, final approach pacing, victory/defeat copy, unlock hooks, and debug shortcuts. Preserve boss-release hazard fairness and avoid hidden instant damage on finale handoff. Add tests for deterministic boss/finale selection, arena handoff, victory summaries, unlock/save records, and debug reachability. Run checks.

Acceptance criteria:

- Act II can end in clear victory, defeat, or abandonment summaries.
- Boss/finale selection is deterministic and debug-visible.
- Boss arena release rules remain fair under Act II hazards.
- Final boss/finale smoke can be reached without a full manual run.

Status: implemented; work order 088 adds `src/game/SecondActFinale.ts` as the deterministic finale-plan layer for Act II. Final sectors now carry one seeded finale variant with debug-visible boss identity, hull and approach tuning, victory/defeat/abandon copy, and a victory unlock hook. Gameplay applies finale boss-hull and arena-approach modifiers through the existing boss arena/phase path, keeps hidden hazards deferred through the normal boss-release fairness rule, and adds the `F` debug shortcut to jump directly to a final-sector boss smoke. Run summaries now include explicit finale outcome copy, last-run save records preserve finale variant metadata, and the archive can unlock the Core Descent music flag after a confirmed victory. Coverage includes deterministic finale selection, arena handoff and hazard deferral, summary copy, save/unlock records, and debug key reachability.

## Work order 089 - Act II debug smoke, accessibility, and performance hardening

Goal: make the second act inspectable before release closeout.

Prompt:

> Add debug/test paths for Act II entry, inter-act junction, Act II sector pressure, second-act boss/finale, and two-act summary. Extend overlays or pure helpers with act id/name, act sector index, junction choice, Act II route tags, act pressure budgets, and final objective state. Check high contrast, reduced motion, performance mode, narrow viewport, item-storm interactions, enemy-rich pressure, environmental pressure, long-run travel, and forced summary/destruction. Add Playwright smoke where practical and update QA/performance docs. Run checks.

Acceptance criteria:

- Debug/test tooling can inspect Act II without private app-state access.
- Browser smoke covers at least one second-act path where practical.
- Existing item-storm, enemy-rich, environmental stress, dense-combat, forced-exit, destruction, and long-scroll smoke remain green.
- Accessibility settings keep Act II UI, HUD text, bullets, hazards, pickups, and route cards readable.

Status: implemented; work order 089 adds public Act II debug paths without private app-state access. `J` jumps to the inter-act junction, `I` launches the first Act II sector with a deterministic junction choice applied, `F` continues to jump to the final-sector boss smoke, and `Y` opens a two-act debug summary with Act I/Act II route history. `src/game/ActTwoDebug.ts` owns the pure Act II smoke scenario helpers, deterministic route-history scaffolding, route-tag summaries, and debug summary result model. Debug overlays now include Act II route tags and live objective state alongside act id/name/progress, junction choice/effects, act-pressure budgets, finale state, viewport/HUD mode, and existing stress counters. Browser smoke covers a narrow high-contrast/reduced-motion/performance path through junction, Act II entry, enemy-rich pressure, finale smoke, and two-act summary, while the existing item-storm, enemy-rich, environmental-stress, dense-combat, forced-exit, destruction, and long-scroll paths remain in the E2E suite.

## Work order 090 - Phase 9 second-act playtest release hardening

Goal: ship a second-act playtest candidate.

Prompt:

> Audit the Phase 9 build for two-act determinism, inter-act junction flow, Act II sector/route content, Act II pacing/objectives, combat/environment escalation, rewards/economy, bosses/finale, debug smoke, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 9 plan, backlog, release checklist, QA docs, project plan, and architecture notes. Run `npm run check`, Playwright smoke with escalation if available, and production preview smoke. Summarize known run-length, balance, economy, browser, and readability risks.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser/AppData blockers are clearly documented.
- Release docs document the two-act run, inter-act junction, Act II content, debug smoke, and manual browser gaps.
- Phase 9 can be declared complete or explicitly deferred with documented blockers.

Status: completed. `npm run check` passes with 66 test files and 379 tests, Playwright Chromium smoke passes all 11 paths including the Act II junction/entry/finale/summary journey, and production preview smoke returns HTTP 200 for `/StarbreakSalvage/` plus its hashed CSS and JavaScript assets. Phase 9 is closed as a local second-act playtest candidate. Manual non-Chromium, real-device, deployed-browser, run-length, balance, economy, and late-run readability checks remain documented risks rather than release blockers.

## Phase 10 work orders

Phase 10 turns the two-act route into a deeper expedition. The measured baseline run is about six minutes; these work orders should earn a roughly 12-20 minute structural target through multi-stage missions, branches, ship transformation, set pieces, and run-specific consequences rather than slower scroll, repeated waves, or inflated hull. Balance and final polish are intentionally secondary to building expandable systems.

## Work order 091 - Expedition graph and run-length contract

Goal: replace the one-sector/one-short-lane assumption with an expandable deterministic expedition model.

Prompt:

> Audit run generation, act plans, sector progression, route history, rewards, shops, junction flow, finale gates, save summaries, debug helpers, and E2E shortcuts for assumptions that one sector equals one gameplay lane. Implement a typed expedition graph containing acts, sectors, mission legs, encounter nodes, optional branches, safe transitions, expected duration/pressure bands, reward hooks, and finale gates. Generate the graph from seed plus save state and record player decisions separately. Preserve current ten-sector seeds and normalize older save/summary records. Expose graph and visited-path read models to HUD, summaries, and debug without private state access. Add validation, known-seed snapshots, migration tests, and a capacity test showing the baseline graph can support roughly 12-20 minutes of authored play without empty delay. Run checks.

Acceptance criteria:

- Same seed plus save state produces the same expedition graph; the same decision history produces the same visited path and major outcomes.
- Existing contracts, acts, routes, summaries, debug shortcuts, and older saves remain readable during migration.
- Nodes have stable ids, content references, entry/exit rules, pressure/duration bands, reward hooks, and validation.
- Run-length capacity comes from encounter nodes and decisions, not global slowdown or enemy-hull inflation.

Status: implemented. `src/content/expeditions.ts` defines validated node profiles and optional opportunity contracts, while `src/game/ExpeditionGraph.ts` generates an immutable two-act graph from seed plus effective unlock/upgrade state. The current ten-sector route maps to 40 stable nodes (30 required compatibility nodes and 10 optional branches), explicit mission legs, content references, reward hooks, safe transitions, checkpoint/finale gates, and separate decision/progress records. Required target capacity is 962 seconds (about 16.0 minutes), expanding to 1182 seconds (about 19.7 minutes) when all optional nodes are authored and selected. `RunSkeleton`, `RunSession`, HUD, summaries, debug overlay, and v5 last-run saves consume public read models; v4 saves migrate safely. Work order 092 now consumes the graph through the live multi-stage mission director while retaining the compatibility projection for older callers. Known-seed, decision replay, graph validation, content validation, capacity, compatibility progress, save migration, and browser-facing readout coverage are in place. `npm run check` passes with 67 test files and 389 tests, all 11 Chromium smoke paths pass, and production preview smoke returns HTTP 200 for the Pages subpath plus current hashed CSS/JavaScript assets.

## Work order 092 - Multi-stage mission director and transitions

Goal: make an expedition node a reliable sequence of playable stages rather than one wave lane.

Prompt:

> Implement a data-driven mission director that consumes the expedition graph and advances explicit briefing, entry, combat, branch, relief, extraction, failure, and completion stages. Support deterministic stage schedules, branch conditions, checkpoint/resource carry rules, optional encounters, and stage-local scroll/world setup while reusing existing combat, wave, hazard, environment, reward, shop, boss, and scene contracts. Centralize transition events so frame catchup, simultaneous kills, item side effects, despawns, death, pause, abandon, and boss gates cannot skip, duplicate, or soft-lock stages. Add public HUD/debug/summary read models plus unit and integration coverage for advance, branch, resume, fail, complete, and old single-stage compatibility. Run checks.

Acceptance criteria:

- Mission stages enter, advance, branch, suspend, resume, fail, and complete through explicit tested transitions.
- Stage changes preserve build, hull, resources, act/route context, and scroll-world state according to data contracts.
- Frame catchup and every defeat/damage source remain objective-safe.
- Keyboard, pointer, pause, abandon, reduced-motion, and narrow-view transitions remain usable.

Status: implemented. `src/content/missions.ts` defines validated stage, carry, world-setup, boss, and branch-condition contracts; `src/game/MissionDirector.ts` compiles each expedition sector into a deterministic briefing, entry, operation, branch, optional operation, relief, extraction, failure, and completion schedule. Its guarded reducer rejects out-of-order events and makes event ids idempotent, including objective completion, pause/resume, abandon, and terminal outcomes. The live `GameApp` flow now uses the director for all ten sectors, reuses `GameplayScene` for primary and optional combat, carries build/resources plus checkpoint hull and scroll-world offset according to stage data, and routes the finale through extraction before victory. New branch and relief scenes support pointer and keyboard flow; mission read models appear in the HUD, debug overlay, and run summary. Unit/integration coverage exercises deterministic schedules, direct and optional branches, data-backed branch conditions, checkpoint projection, duplicate same-frame completion, suspend/resume, failure, completion, expedition progress, content validation, and legacy single-stage compatibility. All 68 Vitest files (398 tests), 11 Chromium smoke paths, typecheck, lint, and the production build pass.

## Work order 093 - Objective grammar and mission anthology

Goal: fill the mission runtime with varied, composable objectives that create meaningful run time.

Prompt:

> Build a validated objective grammar and first mission anthology for assault, pursuit, escort, salvage, defense, rescue, scan, sabotage, escape, and boss-approach play. Objectives should compose into multi-stage contracts with explicit success, partial-success, failure, branch, reward, faction, crew, and cleanup policies. Reuse enemies, variants, formations, hazards, destructibles, obstacles, loose currency, bosses, and route conditions while adding only the minimal new runtime primitives needed. Author at least eight distinct mission contracts across both acts, including optional high-risk branches and relief beats. Add known-seed schedules, objective-safety tests, content validation, HUD copy, route previews, debug jumps, and summary history. Run checks.

Acceptance criteria:

- At least eight multi-stage mission contracts materially differ in verbs, risk, pacing, and outcome.
- Objective composition is data-driven and validation rejects impossible references, exits, reward rules, and cleanup policies.
- Partial success and optional branches can change later rewards or state without corrupting run completion.
- Missions add active play and decisions rather than repeated kill quotas or artificial waits.

Status: implemented. `src/content/objectives.ts` defines a validated compositional grammar for defeat ratios, escapes, travel, pickups, loose currency, damage limits, grazes, projectile cancellation, destructible targets, and bosses, plus explicit success, partial-success, failure, outcome-exit, reward, branch, faction, crew, cleanup, relief, and world policies. Ten original multi-stage contracts span assault, pursuit, salvage, rescue, defense, scan, sabotage, escape, escort, and boss-approach play across both acts. `src/game/ObjectiveDirector.ts` evaluates those clauses only after deterministic travel/spawn/field/boss resolution, while `MissionDirector`, `WaveDirector`, `GameplayScene`, and `RunSession` carry outcomes through optional-branch eligibility, stage-local pacing, destructible/currency setup, reward modifiers, HUD copy, route previews, debug state/jumps, and run-summary history. Enemy escapes are tracked separately from defeats without breaking legacy clear accounting, and outcome recording is stage-idempotent; selected failures can apply an explicit run-local consequence while extraction remains valid. Known-seed anthology schedules, material-variation, non-kill play, success/partial/failure, escape safety, objective gating, reward/consequence idempotence, content-reference/policy validation, and sabotage-placement coverage are in place. `npm run check` passes with 69 test files and 406 tests; all 11 Chromium smoke paths pass. The production build succeeds with a 506.88 kB main-chunk size warning, which remains a future code-splitting concern rather than a runtime blocker.

## Work order 094 - Modular ship frames, hardpoints, and power grid

Goal: turn each starting contract into an extensible machine that can support future equipment systems.

Prompt:

> Refactor ship contracts toward validated frames and module loadouts. Add frame stats for hardpoint layout, reactor output, mass, cooling, heat routing, armor, shields, mobility, cargo, and command capacity. Add module contracts for primary, secondary, defense, engine, utility, drone, and experimental slots with power draw, heat, mass, tags, uniqueness, compatibility, and presentation metadata. Preserve current ships and weapons through explicit compatibility adapters rather than duplicating behavior. Add loadout resolution, HUD/preview/summary read models, save migration where required, and deterministic starting loadouts. Add tests for at least three materially different frames, legal/illegal combinations, power/heat resolution, collision parity, controls, fresh/progressed saves, and known seeds. Run checks.

Acceptance criteria:

- At least three frames support distinct legal configurations and operational tradeoffs.
- Invalid slot, power, mass, tag, uniqueness, and compatibility combinations fail validation.
- Current contract behavior remains available through the new authoritative model.
- Loadout changes do not alter fixed-world collision or deterministic content generation unintentionally.

Status: implemented. `src/content/shipModules.ts` now defines eight original frames spanning light, command, heavy, phase, shield, salvage, prototype, and relic roles, plus 21 modules across primary, secondary, defense, engine, utility, drone, and experimental slots. Frames declare hardpoints, dry/capacity mass, reactor output, cooling, heat routing, armor, shields, mobility, cargo, command capacity, tags, and presentation metadata; modules declare size, draw, heat, mass, command draw, tags, uniqueness, frame/loadout compatibility, behavior adapters, and presentation. `src/game/ShipLoadout.ts` validates mounts and resolves deterministic resource envelopes, stable signatures, combat compatibility, and preview/HUD/summary/debug read models. All eight existing contracts now originate at that boundary: weapon modules delegate to the established weapon definitions and frame adapters preserve the established `ShipStats`, so weapon topology, controls, pickup behavior, economy, and collision geometry are not forked. Contract generation, known-seed summaries, selection previews, cockpit telemetry, debug output, and run summaries expose the authoritative loadout. Loadouts are generated deterministically from frame content rather than serialized, so the version-5 fresh/progressed save contract remains compatible and no migration or duplicate persisted state was required. Tests cover three materially different configurable frames, all eight legacy adapters, legal swaps, slot/power/mass/heat/tag/uniqueness/compatibility failures, schema validation, collision parity, fresh/progressed known seeds, fixed-world stability, preview models, and browser controls/UI. `npm run check` passes with 70 test files and 412 tests; all 11 Chromium smoke paths pass.

## Work order 095 - Salvage foundry and weapon evolution

Goal: let a ship transform during the run through deterministic engineering choices.

Prompt:

> Add deterministic component salvage and a mid-run foundry where players can install, remove, scrap, reroute, fuse, and overclock modules. Define component quality, source, tags, compatibility, recipe, affix, instability, and salvage-value contracts. Add bounded weapon evolution recipes that can alter projectile topology, targeting, heat, defense, economy, or item-hook behavior rather than only multiplying damage. Unify item and module hook ordering behind explicit combined proc budgets. Add previewable tradeoffs, clear undo/commit boundaries, keyboard/pointer focus, narrow layouts, engineering history, summary copy, debug fixtures, content validation, and known-seed tests. Run checks.

Acceptance criteria:

- Same seed, save state, acquired components, and foundry choices reproduce the same engineering results.
- Install, scrap, fuse, and overclock choices materially change play and expose their costs/risks before commit.
- Item/module interactions remain ordered, bounded, debug-visible, and test-covered.
- Run summaries can explain the path from starting loadout to final ship.

Status: implemented. `src/content/engineering.ts` defines four component quality tiers, nine acquisition sources, six affixes, and six application-capped weapon evolution recipes covering projectile topology, convergence targeting, heat management, recoil defense, kill economy, and item/module proc routing. Components snapshot their module tags, hardpoint compatibility, recipe eligibility, source, quality, affixes, instability, salvage value, routing, overclock level, and fusion ancestry. `src/game/Foundry.ts` generates drops deterministically from seed, save fingerprint, sector, route, and acquisition order; maintains separate committed and draft snapshots; and implements install, remove, scrap, reroute, overclock, fuse, undo, and commit operations with stable signatures and detailed history. Every commit reuses the work-order-094 loadout validator, then enforces engineered power, heat, mass, command, and instability envelopes. `src/game/CombinedHooks.ts` gives module evolutions and items one explicit deterministic order and shared 48-64 application budget; combat telemetry exposes applied/skipped totals, peak hooks, and the last source order. Live evolution effects alter volley topology, projectile convergence, heat/vent behavior, damage response, salvage yield, arc routing, and proc capacity without duplicating the existing weapon implementations. A deterministic component is recovered after every sector reward, and `FoundryScene` provides previewable tradeoffs, invalid-draft explanations, reversible planning, pointer/keyboard controls, sticky narrow-layout controls, and explicit commit/continue choices before extraction. Gameplay HUD/debug output reflects the committed final ship, while run summaries retain starting modules, final modules/resources, and the full acquisition/engineering path. Engineering remains run-local, so version-5 permanent saves require no migration. Known-seed/save determinism, all six operations, legal/illegal commits, undo, scrap payout, fusion, overclock/routing, six effect families, combined ordering/budgets, debug fixtures, content validation, combat integration, summary history, and Chromium UI flow are covered. `npm run check` passes with 71 test files and 421 tests; all 11 Chromium smoke paths pass.

## Work order 096 - Capital ships, stations, and multi-part set pieces

Goal: give sectors large physical places and targets that can anchor memorable missions.

Prompt:

> Implement composable multi-part world actors for capital ships, stations, wreck hulks, convoy structures, and exterior/interior transition beats. Define components for armor sections, turrets, hangars, shield emitters, engines, weak points, collision silhouettes, scrolling anchors, safe lanes, reward policies, and staged destruction. Build at least three original set-piece contracts from reusable components and integrate them with the mission director, objectives, hazards, formations, bombs, specials, item/module hooks, loose currency, boss locks, and accessibility settings. Keep damage/reward accounting deterministic from explicit events, cap debris/projectiles/effects, and add debug jumps, validation, unit tests, and Chromium smoke where practical. Run checks.

Acceptance criteria:

- At least three set pieces use reusable multi-part definitions rather than scene-specific scripts.
- Target order, subsystem failure, staged destruction, objectives, and rewards cannot duplicate or soft-lock.
- Geometry and safe lanes remain in the fixed 640x720 combat world across viewport sizes.
- Reduced motion and performance mode simplify presentation without changing target geometry or stage timing.

Status: implemented. Seven reusable subsystem templates now compose three original set-piece contracts: the Hecaton Ledger Ark capital ship in sector 1, Bloom Spindle Exchange station in sector 7, and Court Wreck-Train Crown convoy hulk in sector 10. Stable component dependencies enforce shield/coupler, armor/interior, and engine/core target layers; broad bomb and hazard events snapshot the current layer so one event cannot tunnel through later stages. Typed one-shot component, stage, and completion events drive deterministic loose-currency rewards, objective credit, summaries, and finale boss-lock release without duplicate claims. Turrets fire actor-tagged projectiles under an 18-shot cap, hangars launch at most one three-member authored formation after their breach window, and destroying either subsystem stops future pressure. All assemblies reserve validated fixed-world safe lanes, lock scrolling at their anchor until the required exterior/interior/destruction stages resolve, and share the existing weapon, special, bomb, hazard, collision, mission, objective, formation, item/module projectile, loose-currency, boss-arena, and feedback paths. Canvas treatment supports high contrast and removes glow/glyph detail in reduced-motion/performance modes without changing geometry or timing. Public HUD/debug read models expose stage, target, lane, part/projectile budgets, and the `U` jump. `npm run check` passes with 73 test files and 434 tests; all 11 Chromium smoke paths pass locally.

## Work order 097 - Faction campaigns and rival captains

Goal: make factions react to the current run and create recognizable recurring opposition.

Prompt:

> Add a deterministic run-local faction campaign director that records aid, hostility, stolen assets, spared targets, completed contracts, territory pressure, and major mission outcomes. Generate named rival captains from original data-backed templates with ships, tactics, injuries, escapes, upgrades, grudges, rewards, and possible finale intervention. Feed faction/rival state into later mission options, shops, crew offers, enemy composition, set-piece ownership, route previews, and finale conditions without using frame-time randomness. Add retreat, capture, destruction, and recurrence policies; clear briefing/combat/summary copy; debug state; content validation; known-seed decision-history fixtures; and objective/reward safety tests. Run checks.

Acceptance criteria:

- Identical seed, save state, and decision history reproduce faction state, rival identity, adaptations, appearances, and outcomes.
- At least three factions support distinct response policies and at least four rival archetypes can recur across a run.
- Player actions visibly change later expedition content rather than only summary text.
- Rival escape/capture/destruction cannot desync objectives, rewards, or finale gates.

Status: implemented. `src/content/factionCampaigns.ts` defines four distinct faction response policies and five original rival archetypes; `src/game/FactionCampaign.ts` generates one named captain per faction from seed plus save fingerprint, then folds idempotent aid, theft, mercy, contract, mission, encounter, escape, capture, and destruction events into bounded run-local state. Escaped rivals gain injuries, upgrades, grudge, recurrence timing, and possible finale intervention, while capture/destruction rewards are terminal and one-shot. Campaign influence now changes later enemy faction composition and pressure, shop prices and item bias, route previews, mission briefings and branch copy, crew-offer signals, set-piece ownership, and finale pressure. Rival actors use the existing combat path but are explicitly optional for required field-clear objectives; first encounters retreat at an authored hull threshold, later destruction cannot increment ordinary kill rewards, and unresolved terminal combat records an escape. HUD, canvas labels, summaries, transitions, route/shop screens, debug state, and the public `R` campaign fixture expose the consequences with non-color-only identity. Validation and known-seed decision-history tests cover four unique rivals, all response policies, adaptation/recurrence, event replay, reward idempotency, objective safety, and downstream influence. `npm run check` passes with 75 test files and 444 tests; all 11 Chromium smoke paths pass locally.

## Work order 098 - Crew, wingmates, and distress contracts

Goal: add run-specific allies whose capabilities and fates create new tactical and narrative space.

Prompt:

> Add recruitable crew and wingmates with roles, traits, frame/module fit, command abilities, trust, injury, rescue, departure, and run-summary outcomes. Add deterministic bounded ally AI plus explicit focus, screen, salvage, regroup, and disengage commands. Acquire crew through distress calls, rescue stages, faction outcomes, and optional mission branches rather than a free menu grant. Integrate command capacity with modular frames and connect crew to mission options, foundry operations, faction reactions, rewards, defeat accounting, and finale outcomes. Add non-color-only ally identity, remappable command input, HUD states, narrow/reduced-motion/high-contrast treatment, debug fixtures, content validation, and tests for targeting, damage attribution, retreat, recovery, commands, and objective safety. Run checks.

Acceptance criteria:

- Multiple crew/wingmate roles produce distinct tactical options and mission consequences.
- Ally behavior, commands, cooldowns, retreat, injury, and recovery are deterministic from explicit state and bounded by budgets.
- Crew expands variety without becoming mandatory permanent raw power.
- Allies remain readable and controllable with keyboard, pointer, high contrast, reduced motion, and narrow viewports.

Status: implemented. `src/content/crew.ts` defines five original roles with distinct focus, screen, salvage, regroup, and disengage specialties, command costs, frame/module fits, mission acquisition policies, combat budgets, traits, faction affinities, and non-color cues. `src/game/CrewCommand.ts` generates deterministic seed-plus-save candidates and folds bounded, idempotent recruitment, mission, combat, injury, two-sector recovery, departure, and foundry-assist outcomes into run-local state. Rescue/specialist mission policies and trusted faction distress channels recruit only after successful consequences and only within resolved frame/module command headroom. Up to three fitted wingmates reuse centralized combat actors, projectiles, pickups, defeat accounting, and objective metrics under bounded target/projectile/pickup scans; injuries intercept damage without harming the player, disengagement remains distinct from injury/enemy escape, and results flow back into trust, recovery, summaries, and finale outcomes. All five commands are remappable and also exposed as pointer buttons, with HUD/debug state, narrow layouts, high-contrast glyphs, reduced-motion-safe rendering, mission/route/briefing copy, foundry bonuses, and a public `T` crew fixture. Validation and deterministic tests cover identities, acquisition capacity, fit/deployment caps, trust/departure, injury/recovery, history bounds, targeting, damage attribution, screening, salvage, command cooldowns, retreat, and objective safety.

Verification: `npm run check` passes with 77 test files and 456 tests; all 11 Chromium smoke paths pass locally. The production build remains green with a 640.46 kB main-chunk warning reserved for work-order-099 profiling/code-splitting review.

## Work order 099 - Expedition Scenario Lab, accessibility, and performance hardening

Goal: make the expanded expedition inspectable and stress-testable without a full run.

Prompt:

> Add a local-only Scenario Lab reachable behind debug mode that can launch generated expedition nodes, mission stages, ship/module loadouts, foundry outcomes, set pieces, faction/rival states, crew states, and combined stress cases through public setup/read models. Add a bounded local run timeline for node transitions, decisions, duration, economy, engineering, faction, rival, crew, boss, and failure events; do not add telemetry or network calls. Extend debug budgets for mission actors, multi-part geometry, ally AI, module/item procs, and sustained expedition load. Add Playwright paths for representative new systems under narrow, high-contrast, reduced-motion, performance, and keyboard-only settings. Preserve all existing smoke shortcuts. Run checks.

Acceptance criteria:

- Debug/browser smoke can reach every Phase 10 system without private app-state access or a full expedition.
- The timeline is bounded, local-only, save-safe, summary-readable, and deterministic for generated/decision events.
- Existing item, enemy, environment, Act II, dense, destruction, exit, and long-scroll smoke remain green.
- Accessibility and combined performance budgets are documented before final release hardening.

Status: implemented. Debug mode now exposes an eight-card Expedition Scenario Lab from the main menu and the remap-safe `B` shortcut. Declarative definitions create fresh deterministic run sessions for an expedition briefing, optional mission combat, three-component foundry fixture, set-piece anchor, returning rival, three-member crew wing, combined Phase 10 pressure, and timeline audit. Launches advance through exported mission/session events and open the production transition, gameplay, and foundry scenes; browser smoke does not mutate private app fields. The combined preset composes existing bounded enemy-rich and environmental fixtures with the generated 7-8-part set piece, up to three allies, a 23-item hook loadout, and public faction/engineering state. `RunTimeline` folds explicit events into at most 96 display entries and 192 processed ids, derives elapsed time only from supplied durations, appears in debug and run summaries, never enters save data, and makes no network or telemetry calls. Debug readouts now join mission, geometry, ally, proc, entity, and timeline budgets.

Verification: `npm run check` passes with 79 test files and 463 tests; all 12 Playwright Chromium smoke paths pass, including the new 390x700 keyboard-only high-contrast/reduced-motion/performance Scenario Lab path. Production preview returns HTTP 200 for `/StarbreakSalvage/` and both hashed CSS/JavaScript assets. The build remains green with a 657.78 kB main-chunk warning; code splitting, manual non-Chromium/real-device profiling, full-run duration, balance, and combined readability remain work-order-100 risks.

## Work order 100 - Phase 10 expedition playtest release hardening

Goal: ship the first expedition-depth and shipcraft playtest candidate.

Prompt:

> Audit Phase 10 for expedition determinism, mission-stage safety, run length, modular ship compatibility, foundry/evolution ordering, set-piece objectives, faction/rival recurrence, crew/ally behavior, save migration, summaries/timeline, debug Scenario Lab, accessibility, performance, browser load, GitHub Pages paths, and release docs. Fix blockers only. Update README, changelog, performance notes, Phase 10 plan, backlog, release checklist, QA docs, project plan, architecture notes, and work-order statuses. Run `npm run check`, Playwright smoke with escalation if available, and production preview asset-path smoke. Document manual non-Chromium, real-device, run-length, balance, content-volume, readability, ally-AI, and combinatorial loadout risks.

Acceptance criteria:

- Full checks, Chromium smoke, and production preview asset-path smoke pass or blockers are explicit.
- A normal fresh-save expedition can traverse multi-stage missions, transform its ship, encounter a set piece, and resolve with faction/rival or crew consequences.
- Release docs distinguish structural run-depth success from unfinished balance, content volume, art, audio, and narrative polish.
- Phase 10 can be declared complete or explicitly deferred with documented blockers.

Status: implemented. The audit found no severe Phase 10 release blocker across expedition determinism, guarded mission transitions, modular compatibility, foundry commit/evolution ordering, set-piece objective/reward safety, faction/rival recurrence, bounded ally behavior, v5 save migration, timeline/summary state, Scenario Lab access, accessibility, browser load, or GitHub Pages paths. The deployed all-optional run measures about 12 minutes, doubling the Phase 9 baseline and reaching the lower structural target through live stages and decisions. Release docs now distinguish that success from unfinished balance, repeated-run content volume, art/audio depth, narrative polish, ally-AI feel, combinatorial builds, and manual browser/device profiling. A cross-platform `test:preview` command serves `dist` and validates the Pages base plus emitted hashed assets; CI runs it, `verify:release` composes the complete gate, and `AGENTS.md` records the new workflow and large-module extraction guidance. No production gameplay code required a blocker fix. The 657.78 kB main bundle and large combat/app/render/validation modules are explicit work-order-101 architecture targets rather than warning-limit exceptions.

Verification: `npm run verify:release` passes with 79 test files and 463 tests, all 12 Playwright Chromium paths, a 657.78 kB minified/177.71 kB gzip production JavaScript bundle, and HTTP 200 for `/StarbreakSalvage/` plus both emitted hashed JavaScript/CSS assets. Phase 10 is complete as a local expedition-depth and shipcraft playtest candidate. Work order 100 deployment confirmation, non-Chromium/real-device checks, deployed Pages verification, sustained profiling, and broader human balance/readability/fatigue testing remain external or manual follow-ups.