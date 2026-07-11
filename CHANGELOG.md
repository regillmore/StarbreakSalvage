# Changelog

## Unreleased

### Gameplay and UX

- Added a debug-only eight-card Expedition Scenario Lab for generated nodes, optional missions, foundry/loadout state, set pieces, recurring rivals, crew command, combined Phase 10 pressure, and timeline audit through public run/session/read models. The `B` shortcut and main-menu button remain local, use no telemetry, and yield to explicitly remapped gameplay controls.
- Added a deterministic run-local timeline for node/stage transitions, choices, duration, economy, engineering, faction, rival, crew, boss, and run-end/failure events, capped at 96 display entries and 192 processed ids with summary and debug readouts and no save-schema change.
- Added three reusable multi-part set-piece contracts: the Hecaton Ledger Ark capital ship, Bloom Spindle Exchange station, and Court Wreck-Train Crown convoy hulk. Their shield emitters, armor, turrets, hangars, engines, couplers, and weak points use dependency-gated targeting, exterior/interior/destruction stages, fixed 640x720 safe lanes, capped subsystem pressure, deterministic loose-currency rewards, objective accounting, and a finale boss lock, with a public `U` debug jump and accessibility-aware rendering.
- Added data-driven sector objectives, deterministic directed wave schedules, HUD objective progress, and boss-gated late sectors.
- Added first-pass special burst fire, bomb danger cancellation, deterministic graze charge, verb HUD readouts, and procedural cues for those verbs.
- Added contract-specific ship stats, starting economy, weapon projectile patterns, heat/overheat reload behavior, and weapon HUD readouts.
- Added phase behavior for all five bosses, active boss phase HUD labels, high-contrast boss telegraphs, and a final-sector victory summary.
- Added deterministic route outcomes for shop, elite, vault, repair, glitch, and faction ambush routes, including route event UI, repair hull patches, curse/relic tradeoffs, shop modifiers, next-sector combat pressure, and route history summaries.
- Expanded the content table to 30 items, 4 factions, and 8 build archetype targets, including Void Corsair phase-skirmish enemies and new item hook effects.
- Connected unlocks to future run generation so fresh saves begin with baseline contracts while earned unlocks widen ship, item, faction, boss, challenge, practice, and music availability.
- Added original procedural Web Audio cues for firing, impacts, pickups, boss warnings, sector clears, and run endings.
- Added gameplay camera shake that respects reduced motion and screen shake strength settings.
- Added settings-aware velocity presentation with parallax-scaled background streaks, engine wake, pickup drift trails, impact streaks, subtle frame rails, high-contrast projectile outlines, and wrapped HUD pills.
- Added explicit viewport scaling with desktop/standard/narrow layout classes, a fixed 640x720 gameplay arena, compact narrow HUD bounds, and debug viewport/safe-frame/world metrics.
- Added passive mouse/touch assist for gameplay: pointer guidance maps through the fixed arena, keyboard movement overrides it, and primary pointer press fires through the normal input path.
- Added data-driven contract ship appearance with distinct canvas silhouettes, palettes, engine/cockpit accents, weapon mount hints, HUD theme keys, and a visible hit-radius ring.
- Added New Game contract ship previews with compact card SVGs, a larger selected-contract preview, weapon/role cue primitives, and arrow-key selection updates.
- Added a contract-themed cockpit HUD with appearance-derived frame accents, readable meters for hull/special/bombs/weapon heat, and high-contrast/reduced-motion simplification.
- Hardened Phase 4 accessibility by preserving native keyboard activation for focused buttons, clearing pointer guidance over DOM overlays, and simplifying preview/HUD treatment under reduced motion, performance mode, and high contrast.
- Added ship-specific combat feedback for themed engine wake, damage flash, invulnerability rings, special/bomb readiness, and weapon heat/overheat stress.
- Propagated selected contract theme accents into route, shop, reward, sector-transition, run-summary, and debug context while keeping save data unchanged.
- Expanded debug overlay viewport/input instrumentation with DPR, canvas pixel size, safe-frame origin, HUD mode, active input mode, and selected contract context for Phase 4 smoke checks.
- Added a data-backed Phase 5 upgrade catalog, save-backed upgrade purchase helpers, and save version 3 migration for banked scrap progression.
- Added an Upgrade Bay reachable from the main menu and Unlock Archive, with static inline SVG category icons, cost/lock/install states, and save-backed banked-scrap purchases.
- Connected purchased upgrades into deterministic run generation for contract survey notes, extra contract slots when unlocked ships allow, route ledger hints, market decoder stock/discount changes, relic-biased vault rewards, seed survey text, summary rows, and debug overlay labels.
- Added run-end scrap breakdowns, upgrade affordability callouts, and Unlock Archive upgrade readiness/next-target status.
- Added a short sector-exit beacon/toast sequence before route or victory handoff, with enemy pressure cleared, debug-state instrumentation, and reduced-motion simplification.
- Added a deterministic Lunar Surface sector foundation with original crater, ridge, surface-array, and wreck-shadow background strata and a `LUNAR-SURFACE-LANE` seed route.
- Added Lunar Surface crater-shadow, comm-array, and surface-relay landmarks plus dust-plume, mining-laser, and surface-defense hazard patterns with low-altitude encounter pacing hooks.
- Added a bounded player ship destruction sequence with contract-colored debris, cockpit failure pulse, transponder toast, debug-state instrumentation, and reduced-motion/performance/high-contrast variants before the existing destroyed summary.
- Expanded Phase 5 debug instrumentation with progression, banked scrap, upgrade readiness, run resource, and current sector-plan readouts for upgrade and lunar smoke coverage.
- Added compact item metadata for Phase 6 catalog scale, including family, source hints, unlock tier, implementation status, stackability, and UI tags.
- Added expanded item hook surfaces for graze, special use, bomb use, sector start, route choice, shop entry, reward generation, and boss phase changes.
- Expanded the Phase 6 item catalog to 60 original items, adding live effects across lunar/surface, route/economy, boss-pressure, graze, special, bomb, shop, reward, and sector-start hooks while keeping starter rewards free of prototype and cursed entries.
- Added source-weighted item pool profiles for starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts, with compact source hints on reward and shop cards.
- Added item-storm debug instrumentation with a forced 23-item loadout across all 14 hook surfaces, hook/proc/build overlay telemetry, and fresh/unlocked reward-shop-vault pool previews for item-heavy smoke.
- Added deterministic sector scroll plans, fixed-step distance tracking, HUD distance/speed readouts, debug distance counters, and subtle reduced-motion-aware starfield drift.
- Added deterministic procedural parallax background plans for all five sectors, with original canvas-drawn stars, rails, debris, bloom strands, grid lines, and core fractures.
- Moved normal directed wave spawning onto deterministic scroll-distance marks while retaining time-based fallback schedules and boss-gate timing.
- Added distance-based sector completion so routes open after reaching the exit distance and clearing required wave/boss gates, with distance stats in summaries and save records.
- Added deterministic sector landmarks and sparse distance-tied hazards with readable telegraph/active phases, collision damage, HUD warnings, and low-alpha canvas rendering that stays under bullets.
- Added first-pass boss arena approach, scroll-lock, and post-defeat release states for boss-gated sectors, with arena HUD/debug readouts and immediate debug boss shortcuts preserved.
- Added deterministic route/meta sector conditions so route outcomes, challenge flags, and unlock variants can alter next-sector scroll speed, travel distance, hazard density, landmark signatures, and boss approach length.
- Added main-menu seed entry with blank/default/random/known-label handling, compact onboarding HUD hints, richer build/resource HUD readouts, and run summaries with win/loss detail plus unlock reasons.
- Added five-boss debug spawn shortcuts, granular debug performance counters, a deterministic dense-combat performance pocket, and a quiet long-scroll traversal shortcut behind `?debug=1`.
- Fixed objective target desyncs where secondary item effects or enemy body collisions could clear enemies without advancing target progress.
- Added metadata-driven normal enemy attack profiles with role-specific cooldowns, telegraph labels, aim styles, projectile shapes, and bounded bullet counts for bruisers, screeners, disruptors, and scouts.
- Added deterministic upgraded enemy variants for armored, overclocked, evasive, volatile, shielded, and salvage-rich targets, with sector/faction/route/challenge gates, conservative modifiers, bonus salvage hooks, canvas ring/badge cues, and debug variant counts.
- Added formation-wave integration so squad selection can respond to route, encounter, and faction identity; formation clears can award small one-time salvage bonuses, and offscreen formation despawns now advance objectives without drops or charge.
- Added deterministic longer-sector pacing arcs with route-conditioned length bands, pressure/relief windows, explicit wave-distance ratios, formation-cluster marks, sparse landmark/hazard beats, boss-approach scaling, transition copy, debug plan labels, and run-summary timelines.
- Added an enemy-rich debug stress pocket on `E` with active role, upgraded-variant, formation-label, long-sector pacing, projectile-budget, and telegraph-budget overlay telemetry for readability smoke.
- Fixed boss-arena release hazards so a zone whose warning was hidden during the locked boss fight restarts its telegraph lead after boss defeat before it can damage the player.
- Added a richer hazard-zone behavior layer for existing hazards, with sweep, pulse, drift, collapse, shadow, curtain, dust-front, and static-gate presentation/collision patterns that stay inside fixed combat-world windows.
- Added deterministic hazard-zone director scheduling so sector pacing, route pressure, relief windows, formation clusters, lunar context, and boss locks shape paced hazard windows with debug and run-summary context.
- Added a Phase 8 destructible/obstacle content schema with original debris, cargo, shield, rock, pylon, wreck, cache, and volatile object families plus fixed-world placement helpers.
- Added lane-safe obstacle placement and runtime contact pushout so environmental objects respect spawn/exit corridors, boss locks, hazards, enemy lanes, and fixed-world movement parity.
- Added deterministic loose currency scatter lanes for enemy, boss, destructible, route, hazard, landmark, and obstacle sources, with fixed-world pickup attraction, TTL cleanup, active count/value caps, HUD hint copy, and debug cap/value counters.
- Added an environmental stress debug shortcut on `H` with active hazard-family labels, environment object/destructible/obstacle counts, loose currency cap state, and stress-budget telemetry.
- Fixed Phase 8 environmental presentation so destructibles/obstacles derive live screen position from sector scroll, planned loose-currency lanes scroll in with the background, and dropped enemy/boss/destructible loot continues moving with the sector.
- Added the first Phase 9 act model: validated Act I/Act II definitions, deterministic act plans on generated runs, act context on sectors/routes/transitions/summaries/debug, and backward-compatible act fields on last-run save records.
- Expanded the run target to ten sectors with a 5/5 Act I/Act II split and added a deterministic inter-act refit junction after Act I completion, including repair, route intel, shop discount, reward, salvage, and risk choices that feed Act II route, shop, reward, transition, summary, and debug surfaces.
- Added first-pass Act II route contracts with route tags, sector fit, faction fit, background hooks, objective families, pressure/reward/terrain route-card previews, deterministic weights, risk offsets, optional unlock gates, content validation, and Act II-only generation.
- Added a shared act-pressure model that uses explicit act context plus sector pacing to bias existing wave, hazard, environment-object, and loose-currency generators while exposing combined enemy, hazard, object, pickup, projectile, and item budget telemetry in the debug overlay.
- Added a shared Act II economy profile for reward weighting, reward choice bonuses, route payout tuning, shop stock/prices/reroll costs, repair/vault scarcity, loose-currency value budgets, summary economy copy, and save-compatible upgrade-progress framing.
- Added deterministic Act II finale variants that tune final boss hull and arena approach through the existing boss path, expose finale state in HUD/debug/summary/save records, preserve boss-release hazard fairness, unlock the Core Descent music flag on victory, and add an `F` debug shortcut for final-boss smoke.
- Added Act II debug smoke shortcuts for the inter-act junction, first Act II sector entry, finale, and two-act summary, with route-tag and live objective-state telemetry in the debug overlay.
- Added the Phase 10 expedition foundation: deterministic seed-plus-save graphs with stable act/sector/mission-leg/node/branch/gate ids, validated duration/pressure/reward/content contracts, separate session decision/progress state, cockpit/summary/debug read models, 16.0-19.7 minutes of structural target capacity, and v4-to-v5 save migration.
- Added run-local faction campaigns with four distinct response policies and four unique seed-plus-save rival captains selected from five recurring archetypes. Bounded decision history now turns aid, theft, mercy, contracts, mission outcomes, rival retreats, capture, and destruction into later combat pressure, route/mission/shop copy and rules, crew-offer signals, set-piece ownership, terminal rewards, and possible finale intervention.
- Added objective-safe rival combat with authored first-encounter retreat thresholds, visible injuries/upgrades/grudges, non-color canvas/HUD identity, one-shot terminal accounting, summary/debug read models, and a public `R` recurrence fixture.
- Added deterministic run-local crew rosters with five original tactical roles, mission/faction consequence recruitment, frame/module command-headroom limits, trust, injury, recovery, departure, foundry assistance, and finale-aware summaries.
- Added bounded wingmate combat and five remappable commands: focus fire, projectile screening, salvage recovery, regroup repair, and disengagement. Ally damage and pickups use centralized objective/reward accounting, while non-color canvas labels, HUD/pointer controls, accessibility treatment, debug budgets, and the public `T` crew fixture keep the system inspectable.

### Testing

- Added a cross-platform `npm run test:preview` smoke that serves `dist`, verifies the `/StarbreakSalvage/` base and emitted hashed JavaScript/CSS, runs in CI, and joins checks plus Chromium under `npm run verify:release`.
- Closed the Phase 10 release audit with 79 test files/463 tests, all 12 Chromium paths, repeatable preview evidence, a measured approximately 12-minute deployed all-optional run, and explicit manual browser/device/performance/balance/content/art/audio/narrative risks.
- Added Scenario Lab definition/setup and timeline fold/bounds tests plus a narrow keyboard-only Chromium path covering high contrast, reduced motion, performance mode, combined set-piece/crew/item/environment pressure, timeline audit, and foundry access.
- Added expedition graph/content validation, known-seed snapshots, fresh/progressed save-state variation, deterministic decision replay, compatibility progress, capacity, broken-reference, save-migration, HUD/debug, and no-`Math.random()` coverage.
- Verified work order 091 with 67 passing test files/389 tests, all 11 Playwright Chromium paths, and production preview asset-path smoke under `/StarbreakSalvage/`.
- Added a repeatable Phase 6 item catalog audit helper and unit coverage for the current rarity, tag, hook, reward-pool, archetype, unlock, target-family, and bridge-effect baseline.
- Added item metadata validation for family/source/status/stacking/UI tags, bridge/planned implementation notes, reward-pool source drift, unlock-gate drift, and unsupported starter rarity/source combinations.
- Added hook validation and unit coverage for newly registered hook names, deterministic hook ordering, inert future hook surfaces, and bounded dispatch/proc limits.
- Refreshed catalog audit, item hook, content validation, and deterministic shop/vault snapshots for the 60-item Phase 6 expansion.
- Added item pool profile validation and known-seed source-weighted reward/shop/vault/lunar snapshots.
- Added unit coverage for item-stress loadouts, proc cap reporting, fresh/unlocked item pool previews, and Playwright smoke for the `HOOK-STORM-SMOKE` item-storm debug path.
- Verified the Phase 6 closeout with `npm run check`, 8-test Playwright Chromium smoke, and production preview asset-path smoke under `/StarbreakSalvage/`.
- Added a repeatable Phase 7 enemy role audit helper and unit coverage for the current faction-pattern class baseline, wave-label semantics, target role set, spawn model, and objective-safety risks.
- Added validated enemy role metadata for current faction-pattern classes plus debug role-pressure summaries with variant/formation placeholders for Phase 7 schema work.
- Added metadata-driven enemy movement profiles so bruisers drift, screeners hold lanes, disruptors sway, and scouts skate laterally while remaining clamped to the fixed combat world.
- Added deterministic enemy attack profile tests covering registered attack families, projectile/telegraph budgets, aimed scout needles, hazard-mark alternation, and combat-loop cadence replay.
- Added enemy variant tests for fresh-sector guardrails, known-seed variant schedules, faction eligibility, content validation, spawn stat modifiers, bonus salvage drops, and debug pressure summaries.
- Added formation objective-safety tests for route/faction weighting, formation instance grouping, simultaneous member kills, item side-effect clears, despawns, body collisions, one-time clear rewards, and distance-sector completion.
- Added sector-pacing tests for route-conditioned long arcs, relief windows, explicit wave spacing, formation-cluster waves, feature beats, boss handoffs, run-summary timelines, and encounter-pacing validation.
- Added enemy-rich stress tests for the `E` debug shortcut, role-pressure budgets, active pacing-beat labels, and a narrow high-contrast Playwright smoke path through Lunar Surface.
- Added a boss-release hazard regression proving hidden arena-lock hazards defer collision damage until their post-release warning lead has elapsed.
- Added the Phase 8 hazard-zone schema and validation baseline for current hazards, including timing metrics, safe-lane expectations, readability metadata, and boss-arena suppression policy.
- Added Phase 8 hazard behavior tests for family breadth, warning-before-damage, pulse windows, cooldown behavior, cleanup, fixed-world damage rectangles, and settings-aware render state.
- Added Phase 8 hazard director tests for known-seed schedule reproducibility, relief-window spacing, route pressure, frame-catchup event ordering, and boss-lock deferral.
- Added destructible/obstacle schema and placement tests for validation failures, deterministic fixed-world placement, sector-fit filtering, and safe-lane guarantees.
- Added loose currency tests for scatter determinism, pickup magnet/collection behavior, active value cap enforcement, debug summaries, and fresh/progressed save plus upgrade-progress accounting.
- Added environmental stress tests for deterministic debug-pocket contents, budget summaries, and a narrow high-contrast Playwright smoke path using `ENVIRONMENT-STRESS-SMOKE`.
- Added release-hardening regressions for scroll-world environment object collision/presentation, planned loose-currency scroll-in, and dropped enemy loot scrolling.
- Added act-plan, content-validation, same-seed generation, route-handoff, save-normalization, and summary-formatting coverage for the Phase 9 act model.
- Added Act II economy tests and snapshots for fresh/progressed rewards, shops, vaults, junction effects, run-summary economy copy, item-source summaries, and save/update accounting.
- Added second-act finale tests for deterministic variant selection, arena handoff, boss-release hazard deferral, victory/defeat/abandon summaries, save/unlock records, and debug key reachability.
- Added Act II debug helper tests plus Playwright smoke coverage for a narrow high-contrast/reduced-motion/performance path through junction, Act II pressure, finale, and two-act summary.
- Added wave director and objective completion tests, including known-seed objective snapshots and boss-gate coverage.
- Added combat tests for special charge/use, bomb mitigation, graze detection, remapped special/bomb controls, and reduced-motion effect rendering.
- Added validation and gameplay tests for ship stat contracts, weapon references, weapon patterns, heat/reload behavior, and starting economy.
- Added deterministic tests for boss phase thresholds, late-boss projectile budgets, final victory routing, and victory save records.
- Added known-seed route outcome tests covering deterministic effects, repair hull patches, shop modifiers, reward modifiers, and next-sector combat pressure.
- Added content validation coverage for item count, faction count, reward-pool placement, archetype representation, faction behavior metadata, and missing hook implementations.
- Added unlock-gating tests for fresh-save pools, unlocked pools, faction filtering, challenge/practice flags, and unlock-trigger summaries.
- Added unit coverage for audio cue settings, combat feedback detection, and deterministic screen-shake decay.
- Added unit coverage for seed entry resolution and run-summary detail helpers, plus E2E coverage for seed entry and keyboard-only start.
- Added regression coverage for empty-field objective progress after item side-effect kills and body-collision clears.
- Added debug-scenario coverage for final boss shortcuts, dense combat budgets, and browser smoke of the debug stress path.
- Added a debug-only sector-complete shortcut so browser smoke can cover route/shop/reward transitions without depending on combat clear timing.
- Added scroll-state tests for known-seed sector length snapshots, fixed-step advancement, speed clamping, zero-dt pause behavior, and exit completion.
- Added background-plan determinism tests and content validation for sector background references and strata metadata.
- Added scroll-synced wave tests for known-seed distance marks, spawn order, time fallback, and frame-stutter duplicate prevention.
- Added distance objective, run-summary distance, and save-record distance tests, plus a longer E2E route timeout for sector travel.
- Added sector feature tests for deterministic landmark/hazard plans, feature validation, hazard phase windows, hazard collision damage, and reduced-motion hazard styling.
- Added boss arena tests for deterministic arena marks, approach/lock/release transitions, boss-spawn gating, scroll-lock behavior, and debug shortcut suppression.
- Added sector condition tests for route-selected scroll/feature/arena changes, challenge and unlock variants, and run-summary physical modifier text.
- Added velocity cue state coverage and a reduced-motion/high-contrast keyboard launch Playwright smoke.
- Added debug count, scroll seek, long-scroll preparation, and granular debug overlay E2E smoke coverage.
- Added viewport layout helper tests, fixed-arena hazard ratio coverage, safe-frame movement clamp coverage, and a narrow-viewport gameplay HUD Playwright smoke.
- Added pointer guidance unit coverage and a mouse movement/fire Playwright smoke path.
- Added ship appearance validation coverage and contract render-state derivation checks.
- Added ship preview model/selection unit coverage and Playwright smoke assertions for preview selection before launch.
- Added HUD theme helper coverage and Playwright smoke assertions for cockpit theme and core meters.
- Added Playwright smoke coverage for keyboard-only start, contract selection, pause, end-run, summary, and return-to-menu flow.
- Added ship combat cue helper coverage for theme-derived colors, damage/invulnerability, heat/overheat, and accessibility/performance intensity reductions.
- Added contract screen theme helper coverage and Playwright assertions for theme propagation through route/shop/reward/transition/summary screens.
- Hardened Playwright smoke assertions for narrow viewport layout metrics, pointer input mode, contract previews, and cockpit HUD mode/theme state.
- Added upgrade catalog validation plus save migration, import/export, affordability, and purchase tests.
- Added Upgrade Bay view-model tests and a Playwright smoke path for narrow high-contrast rendering plus a banked-scrap purchase.
- Added upgrade-influenced generation snapshots for `UPGRADE-SEED-SNAPSHOT`, fresh-save guardrails, and Playwright coverage that a purchased upgrade appears on the next contract board.
- Added run-summary progress model tests for scrap formatting, upgrade affordability detection, archive status text, save summary records, and Playwright summary callouts.
- Added sector-exit sequence unit tests for timing, debug-fast completion, reduced-motion presentation, final-sector copy, and Playwright smoke coverage for the forced exit toast.
- Added lunar sector generation, background-strata, feature-plan, and content-validation coverage for `LUNAR-SURFACE-LANE`.
- Added lunar feature determinism, hazard readability metadata, wave-pacing, content validation, and route-conditioned lunar feature regression coverage.
- Added player-destruction unit tests for deterministic debris, cue timing, settings variants, feedback/audio mappings, the debug force-destruction key, and Playwright death-to-summary smoke coverage.
- Added Playwright smoke coverage that drives a `LUNAR-SURFACE-LANE` run through two forced sector exits into Lunar Surface and verifies sector-plan/debug instrumentation in-browser.
- Verified the Phase 5 closeout with `npm run check`, 7-test Playwright Chromium smoke, and production preview asset-path smoke under `/StarbreakSalvage/`.

### Planning

- Completed Phase 10 as the first expedition-depth and shipcraft playtest candidate and added the Phase 11 deep-voyage roadmap plus work orders 101-110 for resumable snapshots/endurance tooling, true multi-operation sectors, the Null Frontier third act, a mobile carrier, boarding incursions, dynamic faction fronts, crew arcs, fleetcraft, apex hunts, and release hardening.
- Concluded Phase 1 in planning docs and added the Phase 2 roadmap/work orders for complete-run depth, player verbs, content expansion, unlock gating, and playtest hardening.
- Concluded Phase 2 in planning docs and added the Phase 3 roadmap/work orders for vertical scrolling, procedural sector backgrounds, distance objectives, scroll-synced encounters, hazards, boss arenas, and scrolling playtest hardening.
- Concluded Phase 3 in planning docs and added the Phase 4 roadmap/work orders for resolution parity, mouse controls, contract ship identity, ship previews, graphical HUD polish, and display/input release hardening.
- Concluded Phase 4 in planning docs and added the Phase 5 roadmap/work orders for banked scrap purpose, upgrade bay icons, sector exits/toasts, lunar surface content, ship destruction, and progression release hardening.
- Concluded Phase 5 in planning docs and added the Phase 6 roadmap/work orders for item taxonomy, hook expansion, catalog growth, reward pool weighting, unlock-gated item families, synergy identity, item presentation, and item-heavy smoke coverage.
- Concluded Phase 6 in planning docs and added the Phase 7 roadmap/work orders for enemy role differentiation, upgraded enemy variants, formations, longer sectors, and enemy-behavior release hardening.
- Started Phase 7 with a documented enemy role audit covering current movement, attack cadence, durability, spawn context, objective interaction, readability gaps, and work order 062 schema handoff.
- Formalized Phase 7 enemy role schema and validation before movement, attack, variant, or formation behavior changes.
- Completed the Phase 7 role-specific movement pass while leaving attack cadence, variants, formations, and objective policy unchanged for follow-up work orders.
- Completed the Phase 7 role-specific normal attack pass, finishing P7.2 behavior expansion while leaving variants, formations, longer-sector pacing, and objective-policy expansion for later work orders.
- Completed the Phase 7 upgraded-variant pass for P7.3, leaving formation definitions, longer-sector pacing, enemy-rich smoke, and broader variant reward/unlock hooks for later work orders.
- Added deterministic first-pass enemy formations for wedge, column, screen, escort, pincer, convoy, ring, and staggered-lane squads, including validation, seeded wave expansion, compact canvas cues, debug formation counts, and frame-catchup spawn-order coverage.
- Completed the Phase 7 formation integration pass for P7.4 objective safety, route/faction weighting, and one-time clear rewards, leaving richer break/retreat behavior and longer-sector pacing for later work orders.
- Completed the Phase 7 longer-sector pacing pass for P7.5 deterministic arcs, relief windows, formation clusters, feature beats, boss approach timing, and summary/debug surfaces, leaving enemy-rich browser stress smoke for work order 069.
- Completed the Phase 7 enemy-rich smoke pass for work order 069, setting up final release hardening, production preview evidence, and known-risk closeout for work order 070.
- Completed Phase 7 as an enemy-behavior playtest candidate with release docs, local check/browser/preview evidence, known enemy balance risks, and the boss-release hazard fairness fix.
- Concluded Phase 7 in planning docs and added the Phase 8 roadmap/work orders for richer hazard zones, destructibles/obstacles, loose currency, environmental stress smoke, and release hardening.
- Started Phase 8 implementation with the hazard-zone schema/audit pass, leaving richer hazard behavior and director pacing for work orders 073-074.
- Completed the Phase 8 richer hazard-zone behavior library for work order 073, leaving director pacing, destructibles/obstacles, loose currency, and environmental stress smoke for later work orders.
- Completed the Phase 8 environmental stress smoke pass for work order 079, leaving final environmental release hardening for work order 080.
- Completed Phase 8 as an environmental systems playtest candidate with release docs, local check/browser/preview evidence, scroll-world object/loot hardening, and known environmental balance/readability/economy risks.
- Concluded Phase 8 in planning docs and added the Phase 9 roadmap/work orders for a deterministic second act, inter-act junction, Act II route and sector pool, Act II pacing/objective variants, combat/environment escalation, economy tuning, second-act boss/finale, debug smoke, and release hardening.
- Continued Phase 9 implementation through the act model, midpoint refit junction, Act II route-contract vocabulary, and Act II pacing/objective variants while leaving economy, boss/finale, debug smoke, and release hardening for work orders 086-090.
- Completed the Phase 9 Act II rewards/shop/economy pass for work order 087, the deterministic second-act finale pass for work order 088, and the broader Act II debug smoke/accessibility/performance hardening pass for work order 089, leaving release closeout for work order 090.
- Completed Phase 9 as a local second-act playtest candidate with 66 passing test files/379 tests, all 11 Chromium smoke paths, production preview asset-path evidence, and explicit manual browser/run-length/balance risks.
- Added the Phase 10 expedition-depth and shipcraft roadmap plus work orders 091-100 for deterministic expedition graphs, multi-stage missions, modular frames, salvage engineering, multi-part set pieces, faction rivals, crew/wingmates, Scenario Lab coverage, and release hardening.
- Started Phase 6 with a documented audit of the current 30-item catalog, repeated-reward risks, underrepresented archetypes, target item families, and bridge-effect follow-ups.
- Formalized the Phase 6 item metadata contract and validation baseline before adding larger item batches.
- Completed the first Phase 6 hook-surface expansion so work order 054 can add live catalog items against typed event payloads.

## 0.10.0 - 2026-07-03

### Highlights

- Hardened the public browser build for the M10 release-candidate pass.
- Added shareable seed links on the run summary screen.
- Added release metadata: license, credits, changelog, and checklist.

### Gameplay and UX

- Summary screens now expose a copy-ready URL that reproduces the run seed.
- README now points to controls, settings, save behavior, seed sharing, credits, and license information.

### Build and QA

- Removed unused Puppeteer dependency; Playwright remains the browser smoke test runner.
- Verified content validation, save migration/import/export tests, deterministic seed tests, E2E smoke, and production build.

### Known Issues

- Audio is not implemented yet, so mute and volume settings are persisted hooks for the future audio layer.
- Screen shake strength is persisted and exposed, but gameplay VFX do not yet apply shake.
- Manual cross-browser smoke is documented as pending for browsers outside the local Chromium check.
