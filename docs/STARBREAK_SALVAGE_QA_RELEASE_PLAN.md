# Starbreak Salvage — QA and Release Plan

## Test pyramid

### Pure unit tests

Use for:

- RNG;
- math helpers;
- collision primitives;
- damage formulas;
- weighted choices;
- item hook ordering;
- save migrations;
- unlock conditions.

### Integration tests

Use for:

- run generation;
- reward generation;
- shop inventory;
- content validation;
- item interactions;
- sector progression.

### E2E smoke tests

Use for:

- page load;
- main menu;
- seed entry;
- contract selection;
- gameplay start;
- pause;
- settings persistence;
- forced death to run summary.

## Phase 2 QA focus

Phase 2 introduces deeper run flow and more content. Add tests closest to the risk:

- sector objective completion and wave director sequencing;
- known-seed snapshots for objectives, waves, boss timing, route outcomes, rewards, and shops;
- route event effects for shop discounts, repair hull patches, vault curses/relics, glitch variance, elite rewards, and faction ambush combat pressure;
- special/bomb/graze charge math and input remapping;
- ship stat validation and weapon-family projectile behavior;
- boss phase thresholds, high-contrast boss telegraphs, final victory routing, and victory summary saves;
- unlock-gated generation for fresh saves and progressed saves;
- seed entry from the main menu and copy/share from summary;
- performance/debug scenarios for dense combat and boss patterns.

## Phase 3 QA focus

Phase 3 introduces true vertical scrolling. Add tests closest to the risk:

- fixed-step scroll state for distance traveled, sector length, scroll speed, camera offset, pause, and frame stutter;
- known-seed snapshots for sector length, background plan, landmark placement, hazard windows, distance objectives, wave markers, and boss approach timing;
- scroll-synced encounter thresholds so events cannot double-spawn or skip when a frame crosses multiple distance markers;
- route, unlock, challenge, and sector-condition effects on scroll speed, hazard density, landmark pools, salvage density, and boss approach length;
- boss arena transitions, scroll locks, scroll resumes, debug boss shortcuts, and final sector victory flow;
- HUD distance/objective indicators, route transitions, run summary distance stats, and save migration behavior where distance records are persisted;
- reduced motion, high-contrast, screen shake, and performance mode readability against moving procedural backgrounds;
- long-scroll performance scenarios that separate background cost from projectiles, enemies, pickups, effects, and HUD.

## Phase 4 QA focus

Phase 4 introduces display/input/identity polish. Add tests closest to the risk:

- viewport scaling helpers for canvas size, device pixel ratio, fixed combat arena fit, gameplay safe frame, and HUD safe areas;
- narrow/wide viewport E2E smoke for main menu, contract selection, gameplay HUD, pause, and summary; work order 031 adds narrow gameplay HUD/safe-frame smoke, with wider route/pause/summary viewport coverage still useful;
- mouse/pointer input mapping, bounds clamping, click/hold fire, and focus safety in menus/settings; work order 032 adds passive pointer guidance, primary-button fire, debug input-mode reporting, and pointer movement/fire smoke coverage, while work order 125 extends that path through letterbox/HUD-reserve space and asserts edge capture plus tangential sliding;
- keyboard-only parity after mouse, contract-preview, and future HUD changes; work orders 034 and 036 add arrow-key preview selection plus keyboard-only start/pause/summary smoke coverage;
- ship appearance content validation for silhouettes, palettes, engine/cockpit accents, weapon mount hints, and HUD theme keys; work orders 033-035 add appearance, preview, and cockpit HUD coverage, with manual cross-theme QA still useful;
- contract selection preview state for keyboard focus, pointer selection, and narrow layouts; work order 034 adds pure preview-model coverage and Playwright preview-selection assertions, with manual contrast/narrow browser checks still useful;
- themed HUD readability for hull, economy, objective, warnings, boss, weapon, special, bomb, and build state; work order 035 adds semantic meter/readout coverage, with manual cross-theme checks still useful;
- non-combat contract theme propagation for route choice, route event, shop, reward, sector transition, run summary, and debug overlay; work order 038 adds pure theme-model coverage plus Playwright assertions through the route/shop/reward/transition/summary path;
- viewport/input/HUD debug smoke for DPR, canvas pixel size, safe-frame origin/size, active input mode, HUD mode, contract preview, and selected contract theme; work order 039 adds Playwright assertions for narrow viewport launch, pointer input, high-contrast HUD mode, and preview/HUD theme state;
- reduced motion, high contrast, and performance mode interactions with ship previews, ship wake/damage cues, and contract HUD themes; work order 036 simplifies preview/HUD treatment under those settings and work order 037 adds cue-state coverage for ship wake, damage, readiness, and heat stress.

## Phase 5 QA focus

Phase 5 introduces persistent upgrade spending, sector completion feedback, lunar surface content, and richer ship destruction. Add tests closest to the risk:

- banked scrap upgrade catalog validation, costs, prerequisites, affordability, purchase state, save migration, export/import, and corrupted-data repair;
- same save state plus same seed snapshots for upgrade-influenced contract boards, route previews, shops, rewards, and summary metadata;
- Upgrade Bay view models, icon/category state, keyboard focus order, pointer purchase flow, narrow layout, and high-contrast readability;
- sector exit sequence state, completion toast timing, route/reward transition reliability, debug sector-complete shortcut behavior, and reduced-motion fallback;
- lunar sector generation snapshots for background plans, feature plans, hazard windows, route-conditioned modifiers, and content references;
- player destruction cue state, death-to-summary reliability, ship-theme color usage, reduced motion, performance mode, high contrast, screen shake, and mute interactions;
- Playwright smoke for opening Upgrade Bay, checking an upgrade state, launching a lunar sector path or verifying generated lunar content, forcing sector completion, and forcing player destruction where practical.

Current Phase 5 coverage:

- Work order 041 covers upgrade catalog validation, save migration, import/export, affordability, purchase helpers, and corrupted upgrade data repair.
- Work order 042 adds Upgrade Bay view-model tests plus a Playwright smoke fixture that opens the bay in a narrow high-contrast viewport, verifies icon/state copy, purchases an upgrade with banked scrap, and confirms persisted save/menu state.
- Work order 043 adds same-save/same-seed upgrade generation snapshots for contract boards, route intel, market decoder shop output, relic dossier vault rewards, seed survey text, fresh-save viability, summary/debug exposure, and browser smoke that a purchased upgrade appears on the next contract board.
- Work order 044 adds run-summary progress tests for earned/banked scrap formatting, newly affordable/available/next/completed upgrade callouts, archive upgrade status, save summary records, and Playwright summary assertions.
- Work order 045 adds sector-exit sequence tests for normal/debug/reduced-motion/final-sector timing and Playwright smoke assertions for forced exit toast, debug exit progress, and route flow after the beat.
- Work order 046 adds deterministic `LUNAR-SURFACE-LANE` generation coverage, Lunar Surface background-strata checks, first-pass feature-plan validation, and content breadth/reference validation.
- Work order 047 adds lunar-specific feature determinism, hazard phase/readability/collision metadata tests, route-conditioned lunar feature regression coverage, sector pacing validation, and wave-director pacing checks.
- Work order 048 adds player-destruction cue-state tests for deterministic debris, reduced-motion/performance/high-contrast variants, feedback/audio mappings, debug force-destruction input, and Playwright smoke coverage from destruction toast/debug progress through the destroyed summary.
- Work order 049 adds debug overlay coverage for banked scrap, upgrade readiness, run resources, current sector id/name/background/pacing, exit progress, and destruction progress. Playwright smoke now verifies Upgrade Bay readiness after purchase, forced sector exit flow, forced destruction, and a `LUNAR-SURFACE-LANE` route that reaches Lunar Surface in-browser.
- Work order 050 closes Phase 5 with `npm run check`, 7-test Playwright Chromium smoke, production preview asset-path smoke, and release docs that separate automated coverage from manual non-Chromium/real-device browser gaps.

## Phase 6 QA focus

Phase 6 expands the item catalog and hook surface. Add tests closest to the risk:

- item catalog audit coverage for current rarity, tag, hook, reward-pool, archetype, unlock, and bridge-effect baselines; work order 051 adds the first helper and unit coverage;
- item metadata validation for family, source hints, unlock tier, implementation status, uniqueness/stackability, effect text, rarity, and reward-pool placement; work order 052 adds source/pool drift, unlock-gate drift, bridge/planned note, duplicate metadata, and unsupported starter rarity/source fixtures;
- hook registration, dispatch ordering, proc limits, and multi-item interaction tests for new hook points such as graze, special, bomb, sector start, route choice, shop entry, reward generation, and boss phase events; work order 053 registers/wires the first expanded hook surface and adds bounded-dispatch coverage;
- first expansion pack coverage for the 60-item catalog, starter/combat/vault pool breadth, newly live hook surfaces, and deterministic shop/vault snapshots; work order 054 adds item hook tests and refreshes the catalog audit expectations;
- source-weighted item pool profile validation and known-seed shop, elite reward, vault reward, and lunar reward snapshots; work order 055 adds the first deterministic acquisition weighting coverage;
- known-seed snapshots for reward, shop, vault, boss, faction, lunar, and unlock-gated item pools under fresh and progressed saves;
- item unlock and discovery migration/import/export/corruption repair if save shape changes;
- synergy cluster detection, tie-breaking, HUD/summary copy, and narrow-layout build identity presentation; work order 057 adds unit coverage and E2E smoke assertions for HUD plus reward/shop build-fit lines;
- item card view models for reward, shop, vault, archive, and summary surfaces, including high-contrast and keyboard focus state; work order 058 adds shared model coverage and E2E checks for shop, reward, summary, and archive item cards;
- item-heavy stress helpers for forced hook-heavy combat, fresh/unlocked reward-shop-vault pool previews, active hook pressure, proc cap reporting, and build identity; work order 059 adds pure coverage plus a `HOOK-STORM-SMOKE` Playwright debug path;
- browser smoke for at least one item-heavy reward/shop/vault path and one dense synergy combat/debug path.

Work order 060 closes Phase 6 as an item-catalog playtest candidate, and work order 076 extends the hook surface for environment object destruction. Release evidence should keep covering the 60-item catalog, 14 registered hook surfaces, source-weighted reward/shop/vault pools, unlock/discovery behavior, item-card presentation, item-storm smoke, and known balance/readability/manual-browser gaps.

## Phase 7 QA focus

Phase 7 enriches enemy behavior and longer-sector pacing. Add tests closest to the risk:

- enemy role audit and metadata validation for role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, and faction fit; work order 061 adds the first pure audit helper and documents the four current faction-pattern classes, while work order 062 adds validated role metadata and active role-pressure summaries;
- role-specific movement tests for fixed-step determinism, arena bounds, cleanup, frame-catchup stability, and no offscreen soft locks; work order 063 adds deterministic movement-profile coverage for current and future movement families;
- attack cadence and telegraph tests for deterministic timing, projectile budgets, high-contrast readability, and reduced-motion simplification; work order 064 adds pure attack-profile budget coverage plus combat-loop cadence regression coverage;
- upgraded variant selection snapshots for fresh saves, later sectors, faction routes, elite routes, challenge flags, and boss-adjacent pressure; work order 065 adds known-seed variant schedules, validation, spawn-modifier, bonus-salvage, and debug-summary coverage;
- formation definition validation for member roles, offsets, timing, entry style, spacing, break conditions, and fixed-world bounds; work order 066 adds validation fixtures plus known-seed formation schedule/bounds coverage;
- formation wave tests for frame-catchup spawn order, simultaneous kills, secondary item kills, despawns, body collisions, objective progress, and sector-complete handoff; work order 066 covers frame-catchup spawn order and duplicate prevention, while work order 067 covers route/faction formation bias, formation instance grouping, one-time clear rewards, simultaneous-kill clears, secondary item clears, despawn clears, body-collision clears, and distance-sector handoff regressions;
- longer-sector generation snapshots for route-conditioned length bands, pressure/relief windows, formation clusters, hazard/landmark pacing, and boss approach timing; work order 068 adds `SectorPacing` unit coverage for route-conditioned arcs, explicit wave ratios, formation-cluster waves, feature beats, boss handoffs, run-summary timelines, and encounter-pacing validation;
- browser smoke for at least one enemy-rich formation or upgraded-variant path under debug, high contrast, reduced motion, performance mode, and narrow viewport where practical; work order 069 adds a Playwright path that reaches Lunar Surface, triggers the `E` enemy-rich debug pocket, and verifies role, variant, formation, pacing, projectile, and telegraph budget readouts;
- boss arena release regressions where a distance-tied hazard telegraph was hidden during the locked fight; work order 070 adds unit coverage proving such hazards restart their warning lead after boss defeat before they can damage the player;
- regression coverage that keeps `HOOK-STORM-SMOKE`, dense combat, forced exit, forced destruction, and quiet long-scroll paths green while enemy behavior grows.

## Phase 8 QA focus

Phase 8 enriches environmental pressure and loose salvage flow. Add tests closest to the risk:

- hazard-zone metadata validation for family, sector/faction fit, telegraph timing, active damage shape, damage cooldown, safe-lane expectation, accessibility metadata, and boss-arena suppression behavior;
- richer hazard behavior tests for phase timing, warning lead, active collision windows, damage cooldowns, frame-catchup order, cleanup, reduced-motion/high-contrast/performance render state, and pre-lock boss-approach settlement;
- hazard director snapshots for route pressure, relief-window spacing, lunar/background context, formation-cluster interaction, boss approach/release state, and known-seed schedule reproducibility;
- destructible and obstacle schema validation for collision shape, hull, damage interactions, objective policy, reward policy, chain behavior, placement constraints, rendering cues, audio/VFX cue names, and debug labels;
- destructible runtime tests for weapon/special/bomb/hazard damage, deterministic rewards, bounded chain reactions, item-hook dispatch, cleanup, and objective safety;
- obstacle placement tests for safe lanes, player spawn and exit corridors, boss approach locks, hazard overlays, enemy spawn lanes, frame-catchup cleanup, fixed-world placement, and viewport parity;
- loose currency tests for scatter determinism, pickup magnet behavior, collection radius, lifetime, cap enforcement, value accounting, upgrade progress, and fresh/progressed save paths;
- browser smoke for at least one environmental stress path under debug, high contrast, reduced motion, performance mode, and narrow viewport where practical; work order 079 adds a Playwright path that launches `ENVIRONMENT-STRESS-SMOKE`, triggers the `H` environmental stress pocket, and verifies hazard, environment object, loose currency, and budget readouts;
- regression coverage that keeps item-storm, enemy-rich, dense-combat, forced-exit, forced-destruction, boss-boundary hazard settlement, and quiet long-scroll paths green while environmental density grows.
- release-hardening regressions for scroll-world environmental presentation; work order 080 adds unit coverage proving environment object collision/presentation derives from scroll distance, planned loose currency scrolls in before its anchor, and dropped enemy loot continues moving with the sector.

## Phase 9 QA focus

Phase 9 expands the game loop into a deterministic second act. Add tests closest to the risk:

- act model and run generation snapshots for Act I/Act II structure, sector budgets, boss/finale gates, route grammar, and summary/debug act context;
- inter-act junction snapshots for deterministic choice sets, choice effects, resource carryover, pause/abandon/recover behavior, and older save compatibility;
- Act II route and sector content validation for route tags, sector fit, objective families, background identity hooks, pressure hints, reward hints, and route-card copy;
- Act II pacing and objective tests for pressure bands, relief windows, longer-sector frame catchup, objective variants, boss approach timing, and two-act summary timelines;
- Act II combat/environment pressure tests for combined enemy role, variant, formation, hazard, obstacle, loose currency, and item-proc budgets;
- reward, shop, vault, elite, boss, repair, reroll, loose-currency, and banked-scrap economy snapshots under fresh and progressed saves;
- second-act boss/finale tests for deterministic selection, arena release fairness, victory/defeat/abandon summaries, save records, and unlock hooks;
- browser smoke for reaching the inter-act junction, entering Act II, inspecting Act II pressure, forcing the finale, and returning from the two-act summary where practical;
- regression coverage that keeps item-storm, enemy-rich, environmental-stress, dense-combat, forced-exit, forced-destruction, boss-boundary hazard settlement, and quiet long-scroll paths green while the run length grows.

Current Phase 9 coverage:

- Work orders 082-088 cover act planning, inter-act junction choice effects, Act II route contracts, Act II pacing/objective variants, act-pressure budgets, Act II economy/reward/shop tuning, and deterministic finale variants with focused unit and deterministic tests.
- Work order 089 adds pure Act II debug helpers plus Playwright smoke for `ACT2-FINALE-SMOKE` in a narrow high-contrast/reduced-motion/performance viewport. The browser path uses `J` for the midpoint junction, `I` for first Act II sector entry, `E` for enemy-rich Act II pressure, `F` for finale smoke, and `Y` for the two-act debug summary.
- Existing Playwright smoke still covers item-storm, enemy-rich, environmental-stress, dense-combat, forced-exit, forced-destruction, narrow HUD, pointer input, and keyboard-only flows; non-Chromium/manual-device validation remains release-closeout work.
- Work order 090 closes the automated Phase 9 gate with 66 passing test files/379 tests, all 11 Playwright Chromium paths, and HTTP 200 production preview checks for the Pages subpath plus hashed CSS/JavaScript assets. Manual non-Chromium, real-device, deployed-browser, and full-run playtests remain open.

## Phase 10 QA focus

Phase 10 expands each route sector into a deterministic expedition graph with multi-stage missions, evolving ship configuration, physical set pieces, faction/rival consequence, and crew. Add tests closest to the new seams:

- expedition graph snapshots for node identity, branches, duration/pressure bands, reward hooks, finale reachability, older ten-sector normalization, and decision-history replay;
- mission director transition tests for entry, advance, branch, checkpoint, resume, partial success, failure, completion, frame catchup, simultaneous events, death, pause, abandon, and boss gates;
- objective grammar validation and safety tests across assault, pursuit, escort, salvage, defense, rescue, scan, sabotage, escape, and boss-approach contracts, including operation-world projection so non-gate stages cannot retain boss-only clauses;
- frame/module loadout tests for hardpoints, power, mass, cooling, heat, compatibility, uniqueness, deterministic starts, collision parity, previews, HUD, and save migration;
- foundry and evolution snapshots for component sources, install/scrap/fuse/overclock choices, recipe/affix results, undo/commit boundaries, item-module hook ordering, and combined proc caps;
- set-piece component tests for targetable subsystems, scroll anchors, collision silhouettes, safe lanes, staged destruction, cleanup, rewards, hazard overlap, and objective safety;
- faction/rival decision-history fixtures for response state, recurrence, escape/capture/destruction, adaptation, mission/shop/crew effects, and finale intervention;
- crew/wingmate tests for acquisition, commands, targeting, damage attribution, retreat, injury, rescue, recovery, departure, objective accounting, and accessible identity;
- Scenario Lab and bounded run-timeline tests that use public setup/read models, remain local-only, and cannot grow save records without limit;
- Chromium smoke for representative expedition, foundry, set-piece, rival, and crew paths under narrow, keyboard-only, high-contrast, reduced-motion, and performance settings while every earlier smoke path remains green.

The measured roughly six-minute Phase 9 baseline should be tracked as evidence, not fixed by sleeps or global slowdown. The deployed Phase 10 all-optional path now measures about 12 minutes, proving that executable stages and decisions reached the target floor. Qualitative balance and repeated-run content variety remain later playtest concerns.

Current Phase 10 coverage:

- Work order 091 adds graph/content validation, compact known-seed snapshots for `STARBREAK-SMOKE`, `LASER-TAX-404`, and `EXPEDITION-GRAPH-SMOKE`, fresh/progressed save-fingerprint variation, deterministic decision replay, broken-reference fixtures, compatibility progress tests, and a capacity assertion for 962 required-target seconds plus 1182 all-optional seconds.
- Save tests migrate v4 records to v5, normalize missing expedition fields, and round-trip graph/path/decision/duration summary data. Existing act, sector, route, reward, shop, finale, and deterministic suites remain green.
- Work orders 092-095 extend browser and integration coverage through executable mission stages and optional branches, the objective anthology, frame/loadout presentation, and deterministic foundry flows.
- Work order 096 adds validation and unit coverage for three assemblies, shared template reuse, known sector/anchor selection, dependency order, one-shot stage/completion rewards, boss-lock release, fixed safe-lane geometry, viewport/settings parity, bomb/special/hazard damage, contact pushout, capped turret fire, cancellable hangar formation launches, objective accounting, and summary/debug read models. The main Chromium path verifies the Hecaton contract readout, public `U` jump, safe-lane telemetry, and fixed 640x720 world while all 11 existing smoke paths remain green.
- Work order 097 adds content validation and known-seed/save fixtures for four distinct response policies, four unique generated captains selected from five archetypes, deterministic identity, decision replay, bounded history, escape/injury/adaptation/recurrence, capture/destruction terminal state, and one-shot rewards. Objective-safety coverage proves a live rival does not hold a required field clear and terminal rival handling cannot grant ordinary kill/pickup credit. Unit integration verifies combat, shop, route, crew-offer, set-piece, briefing, summary, debug, and finale influence; the main Chromium path uses the public `R` fixture to verify a returning rival under the normal scene flow.
- Work order 098 adds validation and seed-plus-save fixtures for five distinct crew roles, acquisition policy and command-capacity rejection, loadout fit/deployment caps, trust/departure, injury/two-sector recovery, foundry assistance, and bounded event history. Combat tests cover deterministic focus targeting, ally defeat attribution through required objective metrics, projectile screening, centralized pickup/salvage credit, command cooldown rejection, damage interception/injury, and disengagement without enemy-escape corruption. Input/settings tests pin all five remappable commands; Chromium uses the public `T` fixture to verify briefing identity, combat HUD, pointer command controls, and debug state while preserving existing paths.
- Work order 099 adds deterministic Scenario Lab definition/setup coverage, a bounded 96-entry/192-id timeline fold, remap-safe debug access, and a 390x700 keyboard-only high-contrast/reduced-motion/performance Chromium path through combined set-piece, ally, item/module, environment, timeline, and foundry state.
- Work order 127 extends ally combat coverage through the complete seven-component Hecaton chain with both a crew wingmate and support craft. Regression pins visible set-piece focus ahead of a nearer standard enemy, dependency-gated armor/drive/core acquisition, optional turret/hangar destruction, shared weapon collision, centralized stage/completion/reward accounting, and unchanged ordinary enemy attribution.
- Work order 128 pins the shared production volley factory through existing weapon-identity combat tests and adds foundry presentation coverage for real draft volley size, negative forward velocity, cadence-scaled bounded flight copies, the 48-node ceiling, Prism Fork topology, and Convergence Vanes lateral velocity. Follow-up parity coverage compares a Split Prism Drone Chaplain preview projectile-for-projectile with a real `CombatState` volley, protects distinct contract-biased starter kits from a universal Split Prism fan, and snapshots the fresh known-seed Drone Chaplain pattern. Chromium verifies moving projectile metadata, positive volley size, absence of the old guide group, normal foundry operations, and console safety; a direct 1280x720 capture checks the firing-range composition.
- Work order 129 validates all nine capital/station/wreck-convoy layouts, exact component coverage, unique layout ids, fixed-arena bounds, 128px safe-lane clearance, valid reinforcement positions, dependency cycles, and a conservative forward-fire corridor to every objective target with all unrelated locked structure still present. Seed sweeps select every authored arrangement reproducibly; explicit layout ids survive mission reprojection; production Light Needle shots fired from legal player positions reach both opening Hecaton emitters without striking locked lower components. The known-seed run snapshot records layout identity, label, and lane.
- Work order 130 pins boss-arena request delivery across the two polls performed by each gameplay frame. An exact Corporate Kill Grid fixture locks at 1074u with support unresolved, resolves support between combat frames, proves both the pre-scroll and post-scroll polls continue reporting `shouldSpawnBoss`, and verifies an acknowledged `bossAlreadySpawned` actor suppresses later requests. Existing approach, release, debug-bypass, spawn-envelope, mission-projection, and finale coverage remains green.
- Work order 100 closes the automated Phase 10 gate with 79 passing test files/463 tests, all 12 Chromium paths, and a repeatable `npm run test:preview` command that verifies the GitHub Pages base plus emitted hashed assets. Manual non-Chromium, real-device, sustained performance, full-run balance, and combinatorial-build validation remain open.

## Phase 11 QA focus

Phase 11 makes long-run state resumable and expands campaign topology. Add coverage at the new persistence and orchestration seams:

- versioned snapshot round trips, corruption recovery, schema migration, permanent-save separation, and restore at every mission/carrier/boarding/front/crew/fleet/apex boundary;
- endurance replays that repeatedly enter/exit combat, optional operations, foundry, set pieces, carrier, boarding, pause, save/restore, extraction, and frontier finales while asserting bounded actors, hooks, histories, and rewards;
- multi-operation itinerary snapshots and decision replay across required, optional, relief, pursuit, retreat, extraction, and frontier nodes;
- Act III campaign variation, early extraction completeness, frontier reachability, duration capacity, and shared-engine compatibility;
- carrier facilities, crew posts, cargo/damage/debt/heat, travel posture, and concise keyboard/pointer staging tests;
- deterministic boarding room graphs, doors, hazards, objectives, custody, retreat/extraction, simultaneous events, and cleanup;
- faction-front movement, node creation/closure, map ownership, support, prices, rival/crew/carrier influence, and ending gates;
- eight or more crew-arc decision histories covering bonds, conflict, promotion, rescue, departure, and mutiny;
- fleetcraft construction, assignment, loss/recovery, bounded targeting/projectiles/effects, objective attribution, and combined stress;
- three or more apex hunt replays with persistent damage, branching outcomes, multi-part finale safety, and divergent endings;
- Playwright Scenario Lab paths for suspend/resume, operational map, frontier, carrier, boarding, fronts, crew arcs, fleet, and apex states under accessibility/performance settings.

Current Phase 11 coverage:

- Work order 101 adds snapshot round-trip equality, regenerated plan/graph/contract identity, suspended mission state, permanent-save isolation, corrupt/unsupported recovery, invalid mission and reserved-extension rejection, byte caps, storage lifecycle, and summary coverage.
- Work order 102 adds graph-v2 role/topology/known-seed capacity validation, two- and four-operation mission replay, independent branch histories, partial-success bypass, idempotent operational payouts, zero-retained-world cleanup assertions, detour/pursuit influence, public intel read models, snapshot-v2 operational-map restore, and safe v1 retirement.
- Work order 103 adds three-act generation and graph validation, known-seed frontier campaign/faction/law/finale assertions, five-family content breadth checks, Act II extraction-versus-breach reducer coverage, shared sector-condition law projection, ten-versus-fifteen-sector victory accounting, snapshot-v3 breach restore, and safe v1/v2 retirement. The standard structural projection is asserted inside the 20-30 minute band.
- Work order 104 adds carrier catalog validation, deterministic plan/facility generation, one-action-per-sector and duplicate-event rejection, repair/replacement/reroute/upgrade/posture resource accounting, capacity-checked cargo, transit pressure, facility influence, faction access, mission restrictions, foundry/reward/crew/market consumers, snapshot-v4 carrier validation and v1-v3 retirement, and endurance carrier bounds. Chromium reaches the lazy command deck with `Q` under narrow high-contrast reduced-motion settings, performs a pointer facility command, continues by keyboard, and preserves the existing staging/snapshot/four-operation paths.
- Work order 105 adds deterministic six-contract campaign equality, all four target families and seven objective verbs, four-to-seven-room/door-chain bounds, translated loadout and shared-sector projection, success/partial/retreat/duplicate settlement, held/stowed/lost custody, zero-retained cleanup, carrier/foundry/faction/rival/apex consequences, and snapshot-v5 restore with v1-v4 retirement. The ninth Scenario Lab card launches boarding through public mission setup, and Chromium verifies its boarding HUD/debug state under narrow high-contrast reduced-motion performance settings.
- Work order 106 adds deterministic fifteen-sector front-plan equality, seven front-kind coverage, twelve faction/stance strategies, content validation, explicit future-only movement, duplicate rejection, create/transform/close node projection, non-color forecasts, ownership/price/hazard/reinforcement/support/crew/carrier/set-piece/finale/ending influence, all eight event-source families, 64/128 history bounds, snapshot-v6 restore with v1-v5 retirement, and endurance front budgets. The tenth Scenario Lab card launches a moved front and Chromium verifies front ownership and ending debug state under narrow high-contrast reduced-motion performance settings.
- Work order 107 adds ten deterministic three-node arc plans, complete outcome/source/content validation, explicit gate and duplicate-choice coverage, promotion/departure/mutiny/rescue/succession resolution, trust and roster synchronization, bond/conflict tactical tradeoffs, read-model/summary coverage, snapshot-v7 restore with v1-v6 retirement, and endurance arc bounds. The eleventh Scenario Lab card opens lazy Crew Quarters and Chromium verifies roster, relationship, fate, and debug state under narrow high-contrast reduced-motion performance settings.
- Work order 108 adds six-role content and deterministic plan validation, construction component/berth/resource/duplicate checks, assignment/doctrine/refit tradeoffs, damage/loss/recovery/repair transitions, six distinct influence consumers, combined four-ally/20-projectile ceilings, combat result separation, engineering/carrier/front/arc/timeline integration, snapshot-v8 restore with v1-v7 retirement, and endurance fleet bounds. The twelfth Scenario Lab card opens lazy Fleet Bay and Chromium verifies roster, capacity, doctrine mutation, shared-budget debug state, and back navigation under narrow high-contrast reduced-motion performance settings.
- Work order 109 adds three deterministic four-contact hunt structures; persistent trace, lieutenant, subsystem, sabotage, migration, escape-route, neutralization, resolution, and missed-finale escape tests; five ending verbs with cross-voyage requirements; signed boss-hull safety; duplicate rejection; three variety unlocks; snapshot-v9 restore with v1-v8 retirement; and endurance apex bounds. The thirteenth Scenario Lab card opens the lazy Apex Dossier and Chromium verifies threat state, ending budget copy, debug caps, and keyboard back navigation under narrow high-contrast reduced-motion performance settings.
- Work order 131 replaces the original apex debug-style dossier with structured pursuit, subsystem, evidence, forecast, and scored-disposition models. Unit coverage pins the reported successful Crownless `I3/P2/A2/C0/M0/E1` state, zero external boarding support, two hunt-earned capture sources, a ready 2/2 Capture route, and a locked 1/2 Containment route with its exact deficit. Chromium now requires contact-track, breached/disabled subsystem, evidence, escape-risk, and ready/locked disposition content at 390x700 under high contrast, reduced motion, performance mode, and keyboard navigation. Direct in-app visual inspection remains a deployment check because no in-app browser target was available locally.
- Work order 132 adds deterministic coverage for native/flex socket capacity, starter auto-fit, new-item-only auto-fit, fit/swap/eject, component-removal reconciliation, active-only projection, circuit-order projectile divergence, true ricochet consumption, all-live catalog status, and snapshot-v10 round trips. Browser release coverage enters Hardpoint Control, checks numbered module sockets and the upgrade circuit, exercises keyboard-accessible move/swap plus Undo/Commit, then verifies gameplay and console safety. Direct inspection must check desktop and narrow rack flow, long item/module names, native-select contrast, high contrast, and reduced motion.
- Work order 110 adds a six-profile deterministic duration audit, explicit structural-versus-stopwatch caveats, complete Phase 11 Scenario Lab system coverage validation, three public carrier/frontier/snapshot release fixtures, a frontier snapshot restored into both decisions, and a Chromium path that resumes combat and settled-map checkpoints before reaching Core Extraction victory. Scenario Lab now exposes sixteen cards under the existing narrow, high-contrast, reduced-motion, performance, and keyboard/pointer smoke.
- `ExpeditionEndurance` runs all sixteen Scenario Lab definitions plus a final-sector checkpoint through repeated snapshot create/export/restore cycles, checking deterministic reports, pending-foundry cleanup, 512 KiB snapshot limits, 96-entry timeline and crew-arc history, 64-entry faction/crew/fleet/apex histories, and set-piece/item/engineering presence.
- The main Chromium path executes all four first-sector operations through both optional map choices before route/reward/foundry progression. The snapshot path covers combat suspend/reload, keyboard resume, settled-map reload/resume, required-gate continuation, debug frontier handoff, extraction victory, and snapshot clearing; Act II/finale, narrow, high-contrast, reduced-motion, pointer, and prior keyboard paths remain green. Work order 153 adds pure coverage for all three authored terminal transitions plus restored Act III extraction settlement, ensuring 5A victory bypasses optional and destination projection.
- Production build smoke covers the initial JavaScript/CSS plus lazy Scenario Lab, timeline, command-deck, Crew Quarters, Fleet Bay, Apex Dossier, and voyage-audit chunks through emitted HTML/module loading; manual storage quota, browser eviction, multi-tab contention, and long real-device restore timing remain open.

## Known seed tests

- `STARBREAK-SMOKE` — stable forgiving smoke path.
- `LASER-TAX-404` — economy/laser route.
- `ORBITAL-JUNK-PROPHET` — relic/curse route.
- `VOID-CORSAIR-7` — shop/convoy route.
- `BLOOM-ENGINE-ALPHA` — bio-machine boss test.

Phase 2 should add these seed fixtures:

- `PHASE-COURIER-GRAZE` - special/graze validation.
- `BOMB-REFUND-STRESS` - bomb and projectile-clear validation.
- `CORE-WRECK-VICTORY` - final boss and victory summary validation.
- `FRESH-SAVE-LOCKED-POOL` - unlock gating validation for new saves.

Phase 3 should add these seed fixtures:

- `STARBREAK-SCROLL-SMOKE` - forgiving opening route with a short deterministic distance objective.
- `KILL-GRID-MILEMARKER` - dense scroll-synced wave thresholds and hazard timing.
- `BLOOM-PARALLAX-LONG` - long procedural background and landmark determinism.
- `CORE-ARENA-LOCK` - boss approach, scroll lock, boss defeat, scroll resume, and sector completion.

Phase 4 should add these seed fixtures:

- `VIEWPORT-PARITY-SMOKE` - stable opening contract and first sector for narrow/wide layout checks.
- `MOUSE-AIM-CALIBRATE` - forgiving ship and weapon setup for pointer movement/fire validation.
- `HANGAR-PREVIEW-GRID` - contract board with visually distinct baseline ships.
- `COCKPIT-HUD-TEST` - contract theme and HUD state coverage with special/bomb/overheat cues.

Phase 5 should add these seed/save fixtures:

- `SCRAP-BAY-SMOKE` - progressed save fixture with enough scrap to buy a first upgrade; implemented in the work order 042 Playwright bay smoke.
- `UPGRADE-SEED-SNAPSHOT` - same seed tested under fresh and upgraded save states; implemented in work order 043 upgrade-effect snapshots.
- `RUN-SCRAP-CALLOUT` - forced summary path that verifies earned/banked scrap and upgrade progress copy; implemented in the work order 044 Playwright summary smoke.
- `EXIT-TOAST-CHECK` - forgiving sector completion path for exit/toast smoke; implemented through the work order 045 forced sector-complete Playwright path.
- `LUNAR-SURFACE-LANE` - deterministic lunar sector/background/feature/pacing plan; implemented across work orders 046 and 047 generation/background/feature/route-condition/content/wave-director tests, with browser traversal smoke added in work order 049.
- `SHIP-BREAKUP-TEST` - deterministic death/destruction summary path; first covered by the work order 048 debug forced-destruction Playwright path.

Phase 6 should add these seed/save fixtures:

- `ITEM-CATALOG-AUDIT` - stable fixture for catalog metadata and reward pool sampling.
- `HOOK-STORM-SMOKE` - item-heavy combat fixture with multiple hook families active under proc budget limits; implemented in work order 059 through the `6` item-storm debug shortcut and browser smoke.
- `SHOP-VAULT-STACK` - reward/shop/vault route path for item source weighting smoke.
- `UNLOCKED-ITEM-FAMILIES` - progressed save fixture that verifies unlock-gated item families and discovery records; first covered in work order 059 through pure fresh/unlocked reward-shop-vault pool preview tests.
- `LUNAR-RELIC-CATALOG` - lunar/faction/source-biased item pool fixture for sector-themed items.

Phase 7 should add these seed/save fixtures:

- `ROLE-LADDER-SMOKE` - opening-to-midsector path that exposes multiple enemy roles without boss pressure.
- `VARIANT-ESCALATION-GRID` - later-sector path for upgraded and elite variant selection snapshots.
- `FORMATION-SQUAD-GRID` - deterministic formation spawn schedule fixture for wedge/screen/escort coverage; first covered by work order 066.
- `FORMATION-CATCHUP-GRID` - frame-catchup fixture proving formation members do not skip or duplicate when scroll jumps across markers; first covered by work order 066.
- `FORMATION-WEDGE-TEST` - deterministic formation objective-clear fixture for work order 067; covered by unit regressions for simultaneous formation kills, secondary item kills, despawns, body collisions, and distance-sector completion.
- `LONG-SECTOR-CARAVAN` - extended sector with pressure/relief windows, formation clusters, and debug scroll metrics; first covered by work order 068 route-conditioned pacing and wave-plan unit tests.
- `ENEMY-RICH-SMOKE` - debug-only enemy-rich pocket for active roles, upgraded variants, formation labels, projectile/telegraph budgets, and long-sector pacing telemetry; first covered by work order 069 through the `E` shortcut on the `LUNAR-SURFACE-LANE` browser path.
- `SUPPORT-DRONE-NEST` - support/disruptor role fixture for shield, escort, deploy, or hazard-mark behavior.
- `BOSS-HAZARD-RELEASE` - boss-gated hazard handoff fixture for verifying hidden arena-lock hazards get a fresh post-defeat telegraph before damage; first covered by work order 070 unit regression.

Phase 8 should add these seed/save fixtures:

- `HAZARD-ZONE-GAUNTLET` - richer hazard-zone schedule fixture for sweep/pulse/drift/collapse families.
- `BOSS-HAZARD-GAUNTLET` - boss-gated hazard schedule fixture that preserves the post-defeat telegraph fairness rule under denser hazard plans.
- `DESTRUCTIBLE-SALVAGE-FIELD` - destructible-rich fixture for damage, reward, chain reaction, and cleanup coverage.
- `OBSTACLE-LANE-CHECK` - obstacle placement fixture for safe-lane, exit-corridor, and viewport-parity checks.
- `LOOSE-SCRAP-RAIN` - loose currency scatter and pickup-magnet fixture for economy accounting.
- `ENVIRONMENT-STRESS-SMOKE` - debug-only environmental pressure pocket for active hazard, destructible/obstacle, loose currency, and stress-budget telemetry; first covered by work order 079 through the `H` shortcut in narrow high-contrast smoke.

Phase 9 should add these seed/save fixtures:

- `ACT2-GATE-SMOKE` - stable two-act path that reaches the inter-act junction and Act II entry without depending on a long manual clear.
- `INTERACT-REFIT-SNAPSHOT` - deterministic midpoint junction choices and Act II modifier application under fresh and progressed saves.
- `ACT2-ROUTE-LADDER` - Act II route pool fixture covering route tags, pressure/reward tradeoffs, and route-card copy.
- `ACT2-PRESSURE-GAUNTLET` - Act II combined enemy/environment/item-pressure budget fixture.
- `ACT2-ECONOMY-SNAPSHOT` - Act II reward, shop, vault, junction, summary, and save-accounting fixture under fresh and progressed saves; first covered by work order 087 through `tests/unit/actEconomy.test.ts`.
- `ACT2-FINALE-SMOKE` - browser debug path for Act II junction, entry, enemy-rich pressure, finale, and two-act summary; first covered by work order 089 Playwright smoke.
- `ACT2-FINALE-SMOKE` - deterministic second-act boss/finale, victory, summary, save, and pre-lock hazard settlement fixture; first covered in work order 088 and updated by work order 124.

Phase 10 should add these seed/save/decision fixtures:

- `EXPEDITION-GRAPH-SMOKE` - baseline two-act graph with stable mission nodes, optional branches, duration bands, and finale reachability; implemented in work order 091 graph/capacity snapshots.
- `MISSION-BRANCH-CATCHUP` - multi-stage mission fixture for frame catchup, simultaneous completion events, partial success, and branch replay; work order 091 covers deterministic branch/path replay, with runtime catchup deferred to work order 092.
- `FOUNDRY-EVOLUTION-GRID` - deterministic component, recipe, affix, install, fuse, and overclock history under fresh and progressed saves.
- `CAPITAL-HULK-BREACH` - multi-part set-piece fixture for subsystem targeting, safe lanes, staged destruction, and reward cleanup.
- `RIVAL-RETURNS-7` - decision-history fixture where a rival escapes, adapts, returns, and changes a later mission or finale.
- `DISTRESS-WING-SMOKE` - crew rescue, recruitment, command, injury, retreat, and summary outcome path.
- `EXPEDITION-COMBINED-STRESS` - Scenario Lab fixture for mission actors, set-piece parts, ally AI, item/module procs, hazards, projectiles, and bounded timeline instrumentation.

Phase 11 should add these seed/save/snapshot fixtures:

- `VOYAGE-SNAPSHOT-ROUNDTRIP` - suspend/resume at every Phase 10 boundary with permanent-save isolation; implemented by work order 101 unit and Chromium coverage.
- `MULTI-OPERATION-LADDER` - required/optional/relief/pursuit/retreat itinerary replay and cleanup.
- `NULL-FRONTIER-BREACH` - Act II extraction versus Act III entry and coherent frontier campaign selection.
- `CARRIER-DAMAGE-CONTROL` - facility, post, cargo, heat, debt, damage, and travel-posture state.
- `DERELICT-BOARDING-GRID` - deterministic rooms, doors, hazards, loot custody, and timed extraction.
- `FACTION-FRONT-CASCADE` - decision sequence that moves territory and opens/closes later nodes.
- `CREW-BOND-MUTINY` - multi-act paired arc with promotion, conflict, loyalty, and departure outcomes.
- `FLEETCRAFT-COMBINED-STRESS` - player, three allies, support craft, set piece, hazards, and shared proc/projectile budgets.
- `APEX-HUNT-PERSISTENCE` - multi-node threat damage, escape, boarding sabotage, and divergent finale replay.
- `VOYAGE-ENDURANCE-45` - completionist snapshot/replay harness targeting 30-45 minutes of structural capacity.

## Content validation checklist

Phase 2 should extend this checklist as systems become real. In addition to the existing entries, content validation should cover ship stat ranges, objective references, wave references, implemented hook coverage, and unlock-gated pools for fresh and progressed saves. Phase 3 should extend it again for sector length ranges, scroll-speed modifiers, background-plan references, landmark references, hazard references, and distance marker ordering. Phase 4 should extend it again for ship appearance references, HUD theme keys, preview assets/primitives, and input/display settings defaults. Phase 5 should extend it again for upgrade definitions, upgrade prerequisites, upgrade effect references, icon categories, lunar sector references, lunar feature references, and destruction cue metadata. Phase 6 should extend it again for item family/source metadata, implementation status, unlock/discovery gates, source-weighted pools, synergy cluster references, and item card presentation data. Phase 7 should extend it again for enemy role metadata, movement/attack family references, variant eligibility, formation definitions, and longer-sector pacing references. Phase 8 should extend it again for richer hazard-zone definitions, destructible/obstacle definitions, loose currency scatter rules, safe-lane placement constraints, environmental stress budgets, and pickup economy caps. Phase 9 should extend it again for act definitions, inter-act junction choices, act route pools, Act II objective families, boss/finale references, and act-aware reward/economy pools. Phase 10 should extend it for expedition node references, mission transitions and cleanup policies, ship frame/module compatibility, foundry recipes and affixes, set-piece component graphs, faction/rival response rules, crew/command contracts, Scenario Lab fixtures, and bounded timeline events.

- [ ] No duplicate IDs.
- [ ] Every item tag is registered.
- [x] Every hook name is registered.
- [ ] Every ship references valid weapon/item IDs.
- [ ] Every wave references valid enemy IDs.
- [ ] Every sector references valid factions/bosses.
- [ ] Every unlock references valid reward/content IDs.
- [ ] Every reward pool has at least one eligible item.
- [ ] Rarity values are valid.
- [ ] Curses are clearly marked.
- [x] Ship appearance references, palettes, weapon mount hints, and HUD theme keys validate.
- [x] Upgrade definitions, costs, prerequisites, effect references, and icon categories validate.
- [x] Lunar sector background, feature, pacing, faction, and boss references validate.
- [x] Item family, source, implementation status, unlock gate, and reward-pool source metadata validate after Phase 6 schema work.
- [x] The first Phase 6 catalog expansion validates at 60 items with declared hook implementations and source-aligned starter/combat/vault pools.
- [x] Source-weighted item pool profiles validate for reward-pool, source, rarity, family, and tag references.
- [x] Item discovery gates, unlock-gated family pools, synergy cluster references, and item card presentation data validate after later Phase 6 work.
- [x] Enemy role, pressure, movement, attack, variant, formation, readability, and faction-fit metadata validate after Phase 7 schema work.
- [x] Formation definitions validate member roles, offsets, timing, bounds, clear rewards, and break/cleanup behavior.
- [x] Longer-sector pacing validates length bands, pressure/relief windows, formation marks, and boss approach references.
- [x] Current enemy role audit helper covers faction-pattern classes, target roles, wave-label semantics, spawn model, and objective-risk notes before Phase 7 schema work.
- [x] Rich hazard-zone definitions validate family, phase timing, telegraph/damage shapes, safe-lane expectations, accessibility metadata, and boss-arena suppression behavior after work order 072 schema work.
- [x] Rich hazard-zone behavior validates behavior families, active damage windows, cooldowns, cleanup, fixed-world damage rectangles, and settings-aware render state after work order 073.
- [x] Hazard-zone director schedules validate known-seed determinism, route pressure, relief spacing, frame-catchup ordering, and boss-lock deferral after work order 074.
- [x] Destructible/obstacle definitions validate collision shape, hull, damage interactions, objective policy, reward policy, chain behavior, placement constraints, cue metadata, debug labels, and fixed-world placement safety after work order 075.
- [x] Loose currency scatter rules validate value tiers, drift/lifetime, pickup attraction, cap rules, route/sector bias, and economy accounting after work order 078.
- [x] Act definitions validate after work order 082.
- [x] Inter-act junction choices, Act II route pools, Act II objectives, and act-aware economy pools validate after work orders 083-087.
- [x] Second-act boss/finale selection, arena handoff, summary copy, save records, unlock hooks, and debug key reachability validate after work order 088.

## Manual browser smoke matrix

| Browser       | Load | Start run | Combat | Pause | Settings | Summary | Narrow viewport | Mouse | Upgrade Bay | Lunar/Exit | Notes |
| ------------- | ---- | --------- | ------ | ----- | -------- | ------- | --------------- | ----- | ----------- | ---------- | ----- |
| Chrome/Edge   |      |           |        |       |          |         |                 |       |             |            |       |
| Firefox       |      |           |        |       |          |         |                 |       |             |            |       |
| Safari/WebKit |      |           |        |       |          |         |                 |       |             |            |       |

## Performance checklist

Phase 2 performance checks should include wave/objective count, projectile count, particle count, audio cue load, and dense boss-pattern scenarios.

Phase 3 performance checks should also include background primitive count, parallax layer count, distance traveled, scroll speed, active distance markers, active landmarks, active hazards, and long-scroll scenarios that run longer than a normal sector.

Current first-pass instrumentation exposes granular combat counts, active enemy role/variant/formation counts, background primitive/layer counts, active landmark/hazard counts, active environment/destructible/obstacle counts, loose currency count/value/caps, environmental stress budgets, distance, speed, active input mode, HUD mode, viewport size/class/presentation scale, DPR, canvas pixel size, safe-frame origin/size, fixed combat world size, banked scrap, upgrade readiness, run resources, current sector id/name/background/pacing, exit progress, destruction progress, item count, active hook count, proc cap state, build identity, a dense-combat debug pocket, an item-storm hook stress pocket, an enemy-rich stress pocket, an environmental stress pocket, forced exit/destruction shortcuts, and a quiet late-sector long-scroll traversal behind `?debug=1`. Production preview smoke passed for work orders 050, 060, 070, 079, and 080; manual non-Chromium and real-device browser validation still need to close the checklist.

Phase 4 performance checks should include viewport/presentation scale, safe-frame size, fixed-world hazard/enemy spacing parity, HUD rendering density, preview rendering cost, mouse input update behavior, ship cue rendering cost, non-combat theme DOM cost, and whether themed HUD/ship cues add measurable overhead in dense and long-scroll debug scenarios.

Phase 5 performance checks should include Upgrade Bay DOM/icon rendering cost, upgrade-state generation branching, toast queue overhead, lunar background/feature primitive counts, lunar hazard readability, and ship destruction particle/debris budgets in reduced motion/performance modes.

Phase 6 performance checks should include item hook dispatch cost, proc budget limits, reward/shop/vault pool sampling cost, large item card DOM rendering, archive filtering, and dense synergy combat readability.

Phase 7 performance checks should include active role counts, upgraded variant counts, formation membership counts, long-sector wave spacing, projectile/telegraph budgets under role-specific attacks, and whether longer sectors create sustained CPU/render pressure beyond existing dense and item-storm pockets.

Work order 070 originally closed Phase 7 with a safe post-release warning. Work order 124 replaces that behavior: final boss-operation schedules preserve each warning/active span while settling all hazards before arena lock, and release-time hazard reconstruction is removed.

Phase 8 performance checks should include active hazard-zone count, hazard family label count, destructible/obstacle count, loose currency count/value, pickup attraction cost, chain-reaction caps, environmental stress budgets, and whether richer environmental pressure hides bullets or extends per-frame collision scans beyond current dense/enemy-rich pockets.

Phase 9 performance checks should include total two-act run length, act-transition DOM cost, Act II route-card density, Act II pressure budgets, combined enemy/environment/item debug smoke, second-act boss/finale load, summary size, save record size, and whether longer runs create fatigue or sustained frame-time pressure beyond current long-scroll smoke.

Phase 10 performance checks should include expedition graph/mission schedule generation time, sustained full-run duration, mission-transition cleanup, active set-piece part and collision-shape counts, ally AI/command cost, module/item combined proc budgets, foundry/loadout DOM density, faction/rival state size, bounded timeline size, and Scenario Lab combined stress. Longer expeditions must keep active-field caps bounded rather than accumulating actors or event history across completed nodes.

Phase 11 performance checks should add snapshot size/latency, restore allocation, endurance cleanup, multi-operation map DOM cost, frontier asset/bundle splitting, carrier/boarding scene density, faction-front fold cost, crew-arc history bounds, combined ally/fleet target scans, apex geometry/projectiles, and 30-45 minute sustained frame/memory behavior. The current 657.78 kB main bundle and large integration modules must be measured rather than hidden by a warning-limit change.

- [x] FPS overlay available behind debug flag.
- [x] Projectile count visible in debug mode.
- [ ] Particle count visible in debug mode.
- [x] Background/debug counters visible in debug mode.
- [x] Distance and scroll speed visible in debug mode.
- [x] Viewport/canvas scale visible in debug mode once Phase 4 instrumentation lands.
- [x] Active input mode visible in debug mode once mouse controls land.
- [x] HUD mode and contract theme visible in debug mode for Phase 4 smoke.
- [x] Contract preview model and selection smoke coverage exists.
- [x] Contract theme propagation smoke coverage exists for route/shop/reward/transition/summary screens.
- [x] Upgrade Bay, banked scrap state, and upgrade-influenced generation visible in tests/debug smoke.
- [x] Sector exit/toast, destruction, and lunar browser smoke paths exist.
- [x] Item hook pressure, proc cap state, and build identity visible in debug smoke.
- [x] Active enemy role and upgraded-variant counts visible in debug once Phase 7 schema and variant instrumentation lands.
- [x] Role-specific movement profiles have deterministic bounds and profile-difference tests for the current Phase 7 roster.
- [x] Role-specific attack profiles have deterministic cadence, telegraph, and projectile-budget tests for current and registered Phase 7 attack families.
- [x] Active formation counts visible in debug once work order 066 lands.
- [x] Long-sector pressure visible in debug/summaries after work order 068 and in browser stress smoke after work order 069.
- [x] Active hazard-zone, destructible/obstacle, loose currency, and environmental stress-budget counters visible in debug once Phase 8 lands.
- [x] Environmental stress smoke covers at least one hazard/destructible/obstacle/currency path where practical.
- [x] Act II pressure counters, finale debug state, and junction/entry/finale/summary Chromium smoke are visible through public readouts after work order 089.
- [x] Expedition node/stage, set-piece part, ally AI, module/item proc, and bounded timeline counters are visible after work order 099.
- [ ] Normal combat stays near 60 FPS on dev machine.
- [x] Heavy combat debug scene documented.
- [x] Long-scroll debug scene documented.
- [x] Screen shake and particles respect reduced motion/performance settings in automated rendering/settings coverage.

## Accessibility checklist

Phase 2 accessibility checks should cover seed entry, summary sharing, special/bomb/graze HUD readability, reduced motion, mute, and keyboard-only route/reward/shop flows.

Phase 3 accessibility checks should also cover moving-background readability, high-contrast bullets over each sector palette, reduced-motion parallax simplification, distance HUD readability, boss scroll-lock clarity, and keyboard-only continuation after reaching sector exits.

Phase 4 accessibility checks should also cover narrow viewport HUD readability, mouse controls as passive optional input, keyboard-only parity after previews/HUD changes, high-contrast bullets over contract ship/HUD themes, reduced-motion simplification for ship wake/damage cues, and focus safety across pointer interactions.

Phase 5 accessibility checks should also cover Upgrade Bay focus and purchase confirmation, upgrade icon text alternatives, non-color-only affordability state, sector exit/toast timing, lunar terrain bullet readability, and ship destruction fallback under reduced motion/performance/high-contrast settings.

Phase 9 accessibility checks should also cover inter-act junction focus and copy, Act II route-card density, act progress HUD text, second-act boss/finale warnings, summary length, high-contrast bullets over Act II palettes, and reduced-motion treatment for longer transitions.

Phase 10 accessibility checks should also cover mission briefings and branch focus, modular loadout/foundry comparisons, non-color-only power/heat/compatibility warnings, set-piece subsystem identity, rival and wingmate identity, remappable ally commands, reduced-motion stage transitions/destruction, high-contrast bullets over large actors, narrow expedition history, and Scenario Lab keyboard-only operation.

- [x] Keyboard-only menu navigation.
- [x] Remappable controls.
- [x] Pause always available during gameplay.
- [x] Mute option.
- [x] Volume slider.
- [x] Reduced motion.
- [x] Screen shake strength.
- [x] Bullet contrast option.
- [ ] Flash reduction.
- [x] Current essential combat, objective, faction, rival, crew, and engineering states have text/glyph cues in addition to color.
- [x] Distance/objective text remains present and readable in narrow/high-contrast automated smoke.
- [x] Reduced motion simplifies scrolling effects without hiding gameplay state.
- [x] Themed HUD and ship previews preserve text contrast in automated smoke coverage.
- [x] Mouse controls do not trap or steal menu focus.

## Release checklist

- [x] `npm run check` passes.
- [x] E2E smoke tests pass.
- [x] Production build preview tested.
- [ ] GitHub Pages deployed.
- [ ] Public URL loads assets correctly.
- [x] README updated.
- [x] License present.
- [x] Credits mention original/generated placeholders as appropriate.
- [x] Changelog updated.
- [x] Save migration tested.
- [x] Seed sharing works.
- [x] Known severe bugs documented or fixed.
- [x] `npm run test:preview` verifies the Pages base and hashed assets.

## Release notes template

```md
# Starbreak Salvage vX.Y.Z

## Highlights

-

## New content

-

## Gameplay changes

-

## Fixes

-

## Known issues

-

## Testing

- `npm run check`: pass/fail
- E2E smoke: pass/fail
- Browser smoke: Chrome / Firefox / Safari
```
