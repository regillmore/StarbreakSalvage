# Starbreak Salvage — Agent Work Orders

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repo first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Phase 11 work orders

Phase 11 begins from the deployed approximately 12-minute all-optional Phase 10 expedition. Work orders 101-110 target a resumable 20-30 minute standard voyage and 30-45 minute completionist capacity through true multi-operation topology, a frontier act, carrier staging, boarding, living faction/crew state, fleetcraft, and apex campaigns while preserving an earlier extraction. The first order establishes architecture and endurance seams before new phase-sized systems land.

## Work order 101 - Expedition kernel, suspend/resume, and endurance tooling

Goal: make substantially longer campaigns safe to build, save, replay, and maintain.

Prompt:

> Establish the Phase 11 expedition kernel before adding more content. Extract phase-sized routing/setup responsibilities from `GameApp`, `GameplayScene`, `CombatState`, `CanvasRenderer`, and monolithic validation paths into explicit domain coordinators or focused modules where the dependency boundary is clear. Add a separately versioned resumable-run snapshot containing generated-plan identity, decisions, checkpoints, build/economy, mission, carrier-ready extension points, faction/rival, crew, and bounded timeline state without mixing it into permanent progression data. Add safe suspend/resume, corruption/version recovery, deterministic restore tests, and a public replay/endurance harness that can cross mission, foundry, set-piece, faction, crew, finale, save/restore, and cleanup boundaries repeatedly. Lazy-load debug or low-frequency scenes where practical and report measured bundle changes; do not silence size warnings cosmetically. Run checks.

Acceptance criteria:

- Snapshot restore reproduces graph, decisions, loadout, economy, missions, faction/rival, crew, and timeline state deterministically.
- Corrupt or incompatible snapshots fail safely without damaging permanent save data.
- Endurance fixtures can repeat every Phase 10 boundary without leaked actors, hooks, histories, or duplicate rewards.
- Phase 11 domain systems have explicit integration seams and do not add another phase-sized orchestration block to existing large modules.

Status: implemented. `src/game/RunSnapshot.ts` introduces a separately versioned `starbreak.run.v1` record capped at 512 KiB. It stores seed/save-generation fingerprint, graph and contract identity, a briefing or gameplay safe target, the complete plain-data `RunSessionState`, and reserved null carrier/boarding/front/fleet/apex extension slots while permanent progression remains save v5. Restore regenerates the immutable run from stored unlock/upgrade context and rejects fingerprint, graph, contract, sector, mission-stage/status, engineering, item/economy, faction/rival, crew, history, or timeline drift before a scene opens. Corrupt, oversized, or unsupported records remove only the snapshot and leave permanent save data untouched. `RunSnapshotCoordinator` extracts checkpoint/restore/clear orchestration from `GameApp`; contract launch, briefing, operation entry, manual pause suspend, run end, new contract, snapshot discard, and full reset have explicit lifecycle rules. Pause and main-menu DOM surfaces expose accessible suspend/resume/discard actions, checkpoint identity/size, and honest copy that active combat restarts from the operation entry checkpoint. `src/game/ExpeditionEndurance.ts` is a public deterministic harness that repeats every Scenario Lab boundary plus the finale through regenerated snapshot round trips, reporting snapshot bytes, mission stage, engineering/faction/crew/timeline history, item count, set-piece parts, and pending engineering cleanup. Scenario Lab setup and timeline scenes now use dynamic imports, producing three lazy debug chunks totaling 9.80 kB minified without changing warning thresholds or existing shortcuts.

Verification: `npm run verify:release` passes with 81 test files and 470 tests; all 13 Playwright Chromium paths pass, including keyboard suspend/reload/resume/clear and all prior smoke. Production preview returns HTTP 200 for `/StarbreakSalvage/`, the 663.24 kB minified/179.38 kB gzip initial JavaScript, 25.92 kB CSS, and all three lazy Scenario Lab chunks. The initial bundle is 5.46 kB larger than work order 100 because snapshot/resume is core functionality, while 9.80 kB of debug code moved behind lazy boundaries. Work order 102 can build on the coordinator/snapshot/endurance seams; deeper `GameApp`, combat, renderer, and validation extraction remains measured follow-up work.

## Work order 102 - True multi-operation sectors and operational map

Goal: make the expedition graph an actively navigated sequence rather than mostly projected capacity.

Prompt:

> Execute two to four generated operations per sector through a public operational map: required gates, optional detours, relief/staging nodes, pursuit nodes, and retreat or extraction exits. Extend expedition and mission contracts with explicit world checkpoints, cleanup, resource/build carry, time/pressure/reward estimates, faction/crew/ship risks, and later-node consequences. Make choices alter future operations rather than only add rewards. Preserve same-seed plus snapshot/decision replay, objective safety, pause/resume, failure/partial-success handling, keyboard/pointer accessibility, narrow layouts, summaries, timeline, debug fixtures, and compatibility with existing ten-sector runs. Run checks.

Acceptance criteria:

- Multiple operations per sector are live and deterministic from explicit plan plus decision history.
- Optional nodes change later structure, pressure, ownership, support, or objectives.
- Cleanup and checkpoint rules prevent invisible retained work, soft locks, and duplicate payouts.
- Operational-map previews communicate time, danger, reward, and consequence without revealing exact rolls.

Status: implemented. Expedition graph schema v2 expands every existing sector to a seven-node operational itinerary: ingress, required advance, optional detour, staging, required gate, optional pursuit, and extraction. Two branch records per sector reproduce independently from explicit decision history, yielding two required combat operations or up to four with both optional lanes. Mission schedule v2 uses generic stage continuations and branch targets, carries hull/build/resources/world checkpoints between combat worlds, keeps partial-success/failure exits guarded, and places bosses, arenas, set pieces, and finales only in the required gate operation. Successful detours create support that reduces gate scroll/wave pressure; successful pursuits provide a one-shot salvage award and raise the following sector's advance pressure. `src/game/OperationalMap.ts` owns the public intel/read model, bounded idempotent settlement history, consequence projection, validation, and explicit zero-retained actor/projectile/hook cleanup record. `OperationalMapScene` replaces the former single-decision presentation with an accessible itinerary showing coarse time, danger, reward, consequence, and faction/crew/ship risk without exposing exact rolls. Snapshot schema/storage v2 includes operational state and settled-map targets, restores between operations without replaying payouts, and retires v1 safely without touching permanent save v5. Known-seed capacity grows from 40 to 70 nodes and projects 1458 required-route seconds (24.3 minutes) or 1898 all-optional seconds (31.6 minutes) across the existing ten sectors.

Verification: focused graph, mission, operational-map, snapshot, endurance, objective, and Scenario Lab suites pass; the complete unit/integration suite passes with 82 files and 478 tests. Chromium covers an all-optional four-operation sector, keyboard operational-map navigation, operational-map reload/resume, safe run cleanup, Act II/finale debug compatibility, narrow/high-contrast/reduced-motion fixtures, and all prior smoke paths. The production build emits a 678.74 kB minified/183.34 kB gzip initial JavaScript bundle and 26.76 kB CSS plus the three existing lazy Scenario Lab chunks. That is a measured 15.50 kB minified core-JavaScript increase over work order 101; the existing size warning remains active for later extraction rather than being hidden. Work order 103 can reuse graph v2, generic mission continuations, the operational ledger/read model, and snapshot v2 to add the Null Frontier without forking the voyage engine.

## Work order 103 - Null Frontier third act and extraction choice

Goal: extend the voyage into a new region while preserving a legitimate shorter ending.

Prompt:

> Add a five-sector Act III called the Null Frontier with several coherent generated campaign variants, new original sector families, backgrounds, environmental laws, routes, mission pools, faction hooks, reward/engineering opportunities, bosses, and finale gates. Turn the existing Act II finale into an explicit choice between cashing out through a complete extraction ending or breaching the frontier for a standard longer campaign. Reuse shared generation, mission, combat, save, timeline, summary, and accessibility contracts instead of forking an Act III engine. Target a measured 20-30 minute standard frontier victory through new play and decisions, not repeated schedules or inflated durability. Run checks.

Acceptance criteria:

- Act III adds five mechanically and visually distinct sector families through shared contracts.
- Same seed plus save/snapshot/decisions reproduces the chosen frontier campaign.
- Act II extraction is a complete rewarded ending, while frontier entry carries the existing run forward.
- Measured standard frontier runs enter the 20-30 minute structural band without global slowdown.

Status: implemented. Act III now adds the Nullglass Expanse, Gravity Choir, Dead Signal Reef, Parallax Foundry, and Horizon Scar through the shared sector/background/hazard/feature/mission/route/boss contracts. `src/game/NullFrontier.ts` deterministically selects Glass Meridian, Black Current, or Silent Crown from seed plus save fingerprint, orders all five sector laws, records faction hooks and engineering opportunities, and names the Horizon Leviathan finale gate. The Act II finale now hands off to an accessible extraction-or-breach scene: extraction awards 180 credits and 45 salvage and records a complete ten-sector victory, while breach awards launch resources and carries the existing session into Act III. Frontier decisions are idempotent timeline events, survive snapshot v3 restore, and produce distinct summary/save metadata. Five frontier mission contracts, six route contracts, five original background plans, and three new bosses reuse the existing combat and operational-map engines. Global operation duration envelopes were tightened to 75% of their previous estimates, originally producing a 1,689-second (28.15-minute) standard fifteen-sector projection and 2,199-second (36.65-minute) two-optional projection without reducing movement speed or inflating durability; work order 134 later reduced the executable completionist projection to 1,944 seconds (32.40 minutes) by pairing one optional hold with each sector.

Verification: `npm run verify:release` passes with 83 Vitest files and 485 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages production-preview asset smoke. Chromium now covers the accessible `G` frontier-gate fixture, both breach and extraction choices, Act III briefing handoff, and distinct extraction victory copy. The build emits 704.95 kB minified/189.45 kB gzip initial JavaScript, 26.76 kB CSS, and the existing 1.52/2.89/5.39 kB lazy Scenario Lab chunks. The 26.21 kB minified core increase is recorded as an open Phase 11 split target; the warning threshold remains unchanged.

## Work order 104 - Mobile salvage carrier and command deck

Goal: give a long expedition a run-local home, staging layer, and strategic build.

Prompt:

> Add a recoverable or contracted mobile salvage carrier with limited facility slots for foundry, medbay, intelligence, hangar, vault, reactor, and faction liaison functions. Let players repair, replace, reroute, and upgrade facilities; assign crew to posts; store bounded cargo; choose travel posture; and respond to carrier damage, heat, debt, pursuit, or access restrictions. Carrier state must alter later mission options, shipcraft, crew recovery, faction/front behavior, support craft, boarding, rewards, and summaries through explicit run-local events and read models. Keep staging concise, accessible, deterministic, snapshot-safe, and free of permanent raw-power grants. Run checks.

Acceptance criteria:

- Carrier facilities and assignments create distinct expedition strategies and later-node consequences.
- Damage, debt, heat, cargo, and access have readable tradeoffs rather than maintenance busywork.
- Carrier state survives suspend/resume and remains separate from permanent progression.
- Command-deck UI is keyboard/pointer usable under narrow, high-contrast, and reduced-motion settings.

Status: implemented. `src/content/carriers.ts` defines three original recovered/contracted carrier hulls and seven facility types: foundry, medbay, intelligence, hangar, vault, reactor, and faction liaison. `src/game/CarrierCommand.ts` generates one seed/save-stable four-slot carrier plan, owns bounded hull/heat/debt/pursuit/cargo/facility/crew-post/history state, applies idempotent repair/replace/reroute/upgrade/assignment/posture/cargo commands, and resolves deterministic transit consequences. Each required-operation staging checkpoint now opens a concise command deck with at most one optional action per sector before launch. Carrier influence can restrict optional mission lanes under critical pressure, bias and widen rewards, change engineering salvage, accelerate crew recovery, alter faction market access/prices, and expose bounded support-craft and boarding capacities for work orders 105 and 109. Foundry components enter a capacity-checked carrier manifest, summaries and the run timeline expose carrier outcomes, and the public `Q` debug fixture reaches the deck directly. Snapshot/storage v4 validates carrier plan identity, four facilities, cargo capacity, and bounded 64-entry/128-id histories while safely retiring v1-v3 independently of permanent save v5. `CommandDeckScene` is keyboard/pointer accessible and lazy-loaded as a separate production chunk.

Verification: `npm run verify:release` passes with 84 Vitest files and 493 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke including the lazy command-deck asset. Chromium covers staging integration, snapshot resume, pointer facility repair, keyboard launch, and the `Q` fixture under narrow high-contrast reduced-motion settings. The build emits 722.66 kB minified/194.63 kB gzip initial JavaScript, unchanged 26.76 kB CSS, a new 3.42 kB minified/1.37 kB gzip lazy command-deck chunk, and the existing Scenario Lab chunks. The 17.71 kB minified core increase is measured and the existing split warning remains open.

## Work order 105 - Boarding and derelict incursions

Goal: add a close-quarters operation family that changes rhythm and creates new consequence space.

Prompt:

> Add deterministic boarding incursions for capital ships, stations, wrecks, and derelicts using bounded room/corridor chains with breach, secure, rescue, sabotage, salvage, escort, and timed extraction objectives. Translate the current ship's weapons, modules, crew, bombs, specials, hazards, items, and collision/accounting contracts into interior-scale tools without creating an unrelated combat engine. Add doors, bulkheads, subsystem rooms, hazards, loot custody, retreat, partial success, and cleanup policies. Connect at least four boarding contracts to carrier facilities, crew arcs, faction fronts, foundry recipes, rivals, and apex hunts. Add Scenario Lab and deterministic tests. Run checks.

Acceptance criteria:

- Boarding is mechanically distinct but retains familiar controls, accounting, and build identity.
- Room plans, objectives, hazards, loot, and extraction reproduce from explicit state.
- Retreat, death, pause/resume, simultaneous outcomes, and cleanup cannot strand or duplicate a run.
- Four or more boarding contracts produce consequences outside the incursion itself.

Status: implemented. `src/content/boarding.ts` defines six original contracts across all four target families and all seven requested verbs. `src/game/BoardingOperation.ts` generates seed/save-stable four-to-seven-room chains with airlock/extraction endpoints, bulkheads, subsystem rooms, deterministic hazard windows, custody loot, optional purge clocks, translated loadout readouts, bounded 64-entry/128-id settlement state, and explicit success/partial/failure/retreat cleanup with zero retained actors. Boarding nodes replace selected detour or pursuit opportunities without changing expedition graph topology. `MissionDirector` projects those nodes back through `GameplayScene`, `CombatState`, `ObjectiveDirector`, hazards, items, engineering, crew allies, projectiles, collision, exit/destruction, and operational settlement rather than creating a second combat engine. The canvas adds readable interior rails and moving bulkheads; the HUD names the current room and translated ship verbs; the pause surface offers `Retreat Incursion` while suspend/resume continues to restart at the safe operation checkpoint.

Six contract outcomes persist outside combat through carrier custody, foundry component recovery/recipe signals, specialist rescue, faction mission history, rival capture, and future apex-hunt hooks. Carrier boarding capacity gates live boarding choices. Run summaries and timelines expose incursion state, and snapshot/storage v5 validates boarding plan identity, custody, bounded histories, and zero-retained cleanup while retiring v1-v4 independently of permanent save v5. Scenario Lab adds a ninth public fixture and browser path for boarding under narrow, high-contrast, reduced-motion, performance settings.

Verification: `npm run verify:release` passes with 85 Vitest files and 498 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke. Chromium reaches the ninth Scenario Lab boarding fixture through public setup and verifies its interior HUD/debug state under 390x700 high-contrast, reduced-motion, performance settings. The final build emits 744.64 kB minified/201.11 kB gzip initial JavaScript, 26.76 kB CSS, a 5.86 kB lazy Scenario Lab setup chunk, and the existing lazy catalog/timeline/command-deck boundaries. The 21.98 kB minified core increase is measured; the existing bundle warning remains open for later domain and orchestration splitting.

## Work order 106 - Dynamic faction fronts and territory war

Goal: make faction history reshape the navigable world during a run.

Prompt:

> Add deterministic run-local faction fronts covering territory, blockades, convoys, distress lanes, markets, contested set pieces, and carrier access. Fold aid, theft, contracts, spared targets, rival outcomes, boarding results, crew ties, and carrier allegiance into explicit front movement. Let fronts create, transform, or close later operation nodes and change ownership, prices, hazards, reinforcements, recruits, support, and ending conditions. Give every faction alliance, hostility, and opportunist routes with non-color map cues, readable forecasts, bounded history, snapshot safety, summaries, timeline events, and public debug fixtures. Run checks.

Acceptance criteria:

- Same decisions deterministically reproduce the same front movement and available nodes.
- Fronts change play space and mission structure, not only numbers or prose.
- Every faction supports meaningfully distinct alliance, hostility, and opportunist strategies.
- Rival, crew, carrier, set-piece, shop, and finale consumers share one public influence model.

Status: implemented. `src/content/factionFronts.ts` defines twelve original strategies: alliance, hostility, and opportunist routes for the Scrap Court, Corporate Ledger, Bloom Hive, and Void Corsairs, covering territory, blockades, convoys, distress lanes, markets, contested set pieces, and carrier access with explicit non-color map cues. `src/game/FactionFront.ts` generates one seed/save-stable front per sector, owns bounded allegiance/influence/front/history state, moves only later sectors from explicit events, and derives one public influence model for node policy, ownership, pricing, hazards, reinforcements, support, crew, carrier, set-piece, and ending consumers.

Aid, asset theft, contracts, spared targets, rival outcomes, boarding results, crew recruitment/assistance, and carrier commands now enter that reducer through `RunSession` events. A front can create, transform, or close its sector's reserve detour/pursuit node; the operational map and action cards show readable forecasts and directives, while live option filtering changes the mission path. Combat uses front ownership, shared faction modifiers, added non-objective reinforcement spawns, support pressure relief, and front hazard/landmark conditions. Shops, routes, transitions, crew offers, carrier access, set-piece ownership, finale pressure, permanent run-record ending names, run summaries, and debug readouts consume the same influence.

Snapshot/storage v6 validates front plan identity, allegiance, sector influence, node strategy, moved-front history, and bounds while retiring v1-v5 independently of permanent save v5. Scenario Lab adds a tenth public dynamic-front fixture; endurance reports front-history maxima.

Verification: `npm run verify:release` passes with 86 Vitest files and 505 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke. Chromium reaches the tenth Scenario Lab front fixture through public setup and verifies ownership/reinforcement HUD state plus ending debug posture at 390x700 under high-contrast, reduced-motion, performance settings. The build emits 761.48 kB minified/205.58 kB gzip initial JavaScript, unchanged 26.76 kB CSS, a 6.29 kB lazy Scenario Lab setup chunk, and the existing lazy catalog/timeline/command-deck boundaries. The 16.84 kB minified core increase is measured; the existing bundle warning remains open for later state and orchestration splitting.

## Work order 107 - Crew bonds, promotions, and specialist arcs

Goal: turn the crew roster into an evolving campaign cast.

Prompt:

> Expand run-local crew with bonds, conflicts, fears, ambitions, promotions, paired abilities, loyalty missions, rescue/departure/mutiny paths, and specialist command posts. Generate deterministic identities and multi-node arc plans, then evolve them only through explicit mission, carrier, boarding, faction, rival, injury, module, and command outcomes. Add at least eight branching crew arcs spanning multiple acts. Relationships should unlock choices, risks, tactics, and complications rather than unconditional stat stacking. Integrate snapshot/resume, summaries, timeline, accessible roster/choice UI, bounded ally logic, Scenario Lab, and deterministic tests. Run checks.

Acceptance criteria:

- Eight or more multi-node crew arcs produce distinct tactical and campaign consequences.
- Bonds/conflicts change options and paired behavior without mandatory permanent power.
- Injury, promotion, departure, mutiny, rescue, and command succession resolve deterministically and safely.
- Summary/timeline surfaces explain each known crew member's fate and major relationships.

Status: implemented. `src/content/crewArcs.ts` defines ten original three-node arcs covering bonds, conflicts, fears, ambitions, loyalty, promotions, paired abilities, specialist posts, rescue, departure, mutiny, and command succession. `src/game/CrewArc.ts` deterministically assigns those arcs across the five generated identities and later sectors, then owns bounded choice, relationship, rank, fate, succession, event, read-model, validation, summary, debug, and combat-influence state without replacing the existing recruitment/injury/recovery roster.

Mission completion, carrier commands/posts, boarding settlements, faction and rival contact, injuries, foundry commits, issued wing commands, and rescues are the only arc inputs. The second matching node opens an explicit two-option Crew Quarters decision with named risk and consequence; the third resolves it. Promotion and succession spend extra command headroom, paired fire gains cadence while losing hull, and severe conflict excludes one partner. Departure and mutiny remove that member from the authoritative roster, while rescue and every relationship choice apply their authored trust change. The accessible lazy Crew Quarters scene exposes every identity, status, trust, rank, fate, relationship, and pending choice from briefings.

Snapshot/storage v7 persists and validates the arc plan/state while retiring v1-v6 independently of permanent save v5. Run summaries and the bounded timeline explain known arcs, relationships, ranks, altered fates, and succession. Scenario Lab adds an eleventh public crew-arc fixture with both resolved and waiting decisions; endurance reports the 96-entry arc-history ceiling. Seven new deterministic crew-arc tests cover generation, gating, choices, outcomes, tactical tradeoffs, roster synchronization, read models, and snapshot restore.

Verification: `npm run verify:release` passes with 87 Vitest files and 512 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke. Chromium reaches the eleventh Scenario Lab crew-arc fixture through public setup and verifies roster, relationships, fates, and debug state at 390x700 under high-contrast, reduced-motion, performance settings. The build emits 783.95 kB minified/212.03 kB gzip initial JavaScript, unchanged 26.76 kB CSS, a new 3.67 kB minified/1.42 kB gzip lazy Crew Quarters chunk, and 6.71 kB lazy Scenario Lab setup. The 22.47 kB minified core increase is measured; the existing warning remains open for later state, snapshot-validation, and orchestration splitting.

## Work order 108 - Fleetcraft and deployable support ships

Goal: expand shipcraft into a small, fragile expedition fleet.

Prompt:

> Let players salvage frames and modules into bounded interceptors, screen drones, salvage skiffs, shield tenders, boarding pods, and other support craft. Add deterministic construction/refit/loss/recovery state, crew or automation assignments, launch doctrines, carrier hangar limits, mission/route uses, and command integration. Reuse shared target-query, projectile, effect, collision, objective, item/module-proc, and ally budgets; do not create unbounded fleet AI. Connect support craft to boarding, faction fronts, crew arcs, engineering, apex hunts, summaries, snapshots, accessibility, and combined Scenario Lab stress. Run checks.

Acceptance criteria:

- At least five support roles create distinct combat and itinerary options.
- Fleet construction, loss, repair, and recovery matter within the run without permanent raw-power escalation.
- Player, crew, fleet, set-piece, projectile, and proc pressure share explicit combined caps.
- Fleet commands and identity remain readable with keyboard, pointer, narrow, high-contrast, reduced-motion, and performance modes.

Status: implemented. `src/content/supportCraft.ts` defines six original support roles: Needle Interceptor, Prism Screen Drone, Latch Salvage Skiff, Palisade Shield Tender, Grapnel Boarding Pod, and Cold-Weld Repair Tug. Each owns distinct combat behavior, build/repair costs, default doctrine, readable non-color cue, and itinerary use. `src/game/Fleetcraft.ts` generates one seed/save-stable craft identity per role and owns bounded construction, refit, crew/automation assignment, doctrine, deployment, damage, loss, recovery, repair, influence, history, validation, summary, debug, and combat-profile state.

Construction and refit consume actual uninstalled engineering components plus run salvage; carrier hangar strength caps operational berths. Crewed craft gain response and damage while removing that specialist from the ordinary wing, carrier post assignment is mutually exclusive, and losing a crewed craft injures its pilot through the authoritative crew reducer. Overdrive gains speed/damage but spends two launch berths; reinforced gains hull. Escort, screen, harvest, breach, and reserve doctrines all use the existing five formation commands. Interceptors improve pursuits, skiffs pay bounded optional-operation salvage, pods open and reward boarding, shield tenders reduce transit heat/pursuit, repair tugs reduce fleet recovery cost, and fleet construction/combat moves faction fronts and can advance crew module/command/injury arcs.

Combat reuses `AllyState`, target-query limits, projectile storage, collision, damage, defeat/reward attribution, rendering, HUD, objective safety, and feedback. Crew plus fleet are capped at four actors and 20 ally projectiles; fleet adds no independent proc/effect pool or unbounded AI. The lazy, keyboard/pointer-accessible Fleet Bay appears from briefings and carrier staging, exposing every callsign, role, status, hull, doctrine, refit, pilot, deployments, losses, costs, berth/component capacity, and shared budget. Snapshot/storage v8 validates fleet plan/state and retires v1-v7 independently of permanent save v5. Summaries, timeline/debug state, endurance bounds, and a twelfth public Scenario Lab fixture expose fleet outcomes and combined pressure.

Verification: `npm run verify:release` passes with 88 Vitest files and 518 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke. Chromium reaches the twelfth Scenario Lab Fleet Bay fixture through public setup and verifies fleet roster, berth/component capacity, doctrine mutation, shared-budget debug copy, and back navigation at 390x700 under high-contrast, reduced-motion, performance settings. The build emits 806.07 kB minified/217.60 kB gzip initial JavaScript, unchanged 26.76 kB CSS, a new 3.68 kB minified/1.47 kB gzip lazy Fleet Bay chunk, and 7.32 kB lazy Scenario Lab setup. The 22.12 kB minified core increase is measured; the existing warning remains open for fleet/crew profile, snapshot-validation, state, and orchestration splitting.

## Work order 109 - Apex hunts and divergent campaign endings

Goal: create multi-sector adversaries and conclusions that remember the whole voyage.

Prompt:

> Generate roaming apex threats with traces, lieutenants, wounded subsystems, migrations, ambushes, and escape routes spanning multiple operation nodes. Add at least three structurally distinct hunts whose later encounters consume prior damage, boarding sabotage, faction fronts, rivals, crew arcs, carrier facilities, support craft, and frontier decisions. Support destruction, capture, containment, bargain, and evacuation endings where appropriate. Preserve centralized objective/reward accounting, boss-arena hazard fairness, deterministic replay/snapshot state, bounded geometry/projectiles/effects, original presentation, summaries, unlock-for-variety rewards, and Scenario Lab fixtures. Run checks.

Acceptance criteria:

- Three or more apex campaigns have distinct pursuit structures and multi-part finales.
- Prior damage and decisions visibly persist without duplicate rewards or objective soft locks.
- Multiple endings resolve explicit campaign state and expand future variety rather than only stats.
- Apex combined pressure stays within documented and debug-visible budgets.

Status: implemented. Three seed/save-stable apex campaigns use distinct trace-chain, siege-break, and migration-net itineraries with four contacts apiece. Trace, ambush, lieutenant, boarding-sabotage, migration, escape-route, subsystem, integrity, neutralization, resolution, and missed-finale escape state lives in a bounded idempotent reducer. Later profiles consume faction-front posture, resolved rivals, crew bonds/officers, carrier support/boarding, fleet readiness/boarding, and the frontier decision to alter hull, escorts, hazards, escape risk, and available dispositions. Grave Choir Procession, Crownless Engine, and Pale Convoy Oracle reuse the centralized boss objective, phase, projectile, effect, collision, reward, and arena paths; prior damage can reduce boss hull but never below one.

Destruction, capture, containment, bargain, and evacuation appear across threat-specific explicit choices. Resolutions award music, practice, or challenge variety flags through permanent save v5 rather than raw stats. Snapshot/storage v9 validates apex plan/state and safely retires v1-v8; summaries, timeline, accessible lazy Apex Dossier, briefing/HUD/debug readouts, endurance bounds, and the thirteenth Scenario Lab fixture expose the whole campaign.

Verification: `npm run verify:release` passes with 89 Vitest files and 528 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the GitHub Pages preview asset smoke. Chromium reaches the thirteenth Scenario Lab Apex Dossier fixture under 390x700 high-contrast, reduced-motion, performance, and keyboard-only settings, verifies persistent threat state and shared budgets, and returns safely to the catalog. The production build emits 827.37 kB minified/223.30 kB gzip initial JavaScript, unchanged 26.76 kB CSS, a 2.57/1.07 kB lazy Apex Dossier, and a 7.81/3.03 kB Scenario Lab setup chunk. The 21.30 kB minified core increase is measured; the existing warning remains open for the Phase 11 release audit rather than being hidden.

## Work order 110 - Voyage Scenario Lab and Phase 11 release hardening

Goal: ship the first resumable deep-voyage playtest candidate.

Prompt:

> Audit Phase 11 for expedition replay, run-snapshot v8 retirement/recovery, permanent-save v5 migration, suspend/resume recovery, multi-operation cleanup, frontier generation, extraction/frontier outcomes, carrier state, boarding, faction fronts, crew arcs, fleetcraft, apex hunts, divergent endings, summaries/timeline, accessibility, performance, browser load, GitHub Pages paths, and release docs. Fix blockers only. Expand Scenario Lab and endurance fixtures so public debug/browser paths can reach every system without a full voyage. Measure fresh/progressed standard, early-extraction, and completionist run lengths locally. Update all active plans, backlog, work orders, README, changelog, QA, release, performance, architecture, and known-risk docs. Run `npm run verify:release` with escalation for Chromium where needed.

Acceptance criteria:

- Full checks, all Chromium smoke, and production preview asset-path smoke pass or blockers are explicit.
- A suspended run resumes and completes through at least one frontier ending.
- Debug/browser smoke reaches every Phase 11 system through public models.
- Release evidence distinguishes structural voyage depth from unfinished balance, content, art/audio, narrative, manual browser/device, fatigue, and combinatorial-fleet risks.

Status: implemented. The Phase 11 audit found no severe blocker across deterministic graph replay, snapshot v9 recovery and v1-v8 retirement, permanent-save v5 migration, operation cleanup, Null Frontier generation/endings, carrier/boarding/front/crew/fleet/apex state, summaries/timeline, accessibility automation, browser load, or Pages paths. One debug isolation defect was fixed: a disposable Scenario Lab frontier ending can no longer write permanent progression. Scenario Lab now has sixteen public-model cards: dedicated carrier-command, frontier-ending, and snapshot/duration-audit fixtures close the remaining coverage gaps. `ExpeditionEndurance` round-trips every card plus the finale and separately restores one frontier checkpoint into both extraction and breach state. Chromium now suspends, reloads, resumes combat and a settled operational map, then reaches Core Extraction victory and verifies snapshot cleanup.

The original local deterministic duration audit reported 28.15 minutes for both fresh and fully progressed standard graphs, 18.50 minutes for Act II extraction, and 36.65 minutes for a completionist graph. Work order 134 later retires one optional lane from fresh schedules and remeasures completionist capacity at 32.40 minutes. These are authored node-duration projections, explicitly not active-play stopwatch, balance, fatigue, or frame-time evidence. The deployed approximately 12-minute Phase 10 all-optional run remains the latest real play measurement. Manual Firefox/Safari/real-device, full-voyage fatigue, balance, content repetition, art/audio depth, narrative polish, ally/fleet feel, and combinatorial loadouts remain honest post-phase risks.

Verification: `npm run verify:release` passes with 90 Vitest files and 530 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. The build emits 828.55 kB minified/223.52 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The lazy release audit emits 1.78 kB logic plus 1.92 kB UI, and Scenario Lab setup emits 9.54 kB. No warning threshold changed.

## Work order 111 - Peaceful sector recovery coast

Goal: give ordinary sector endings enough quiet space to collect drops and reset visual pressure before route handoff.

Prompt:

> Add a brief peaceful cooldown distance at the conclusion of each typical sector, allowing the player to collect drops and letting hazards clear before the existing exit sequence triggers. Keep it deterministic and distance-based. Hold at the authored endpoint until live sector enemies resolve, then preserve existing projectiles, telegraphs, hazards, objects, loose-currency schedules, player movement, and pickups so the field settles naturally. Prevent new enemies or hazards from activating through the coast and exit transition. Boarding, debug completion, and final-victory handoffs must retain safe specialized behavior. Add readable HUD/debug state and focused tests. Run checks.

Acceptance criteria:

- Every standard non-final flight sector holds at its authored combat endpoint until all live enemies resolve, then gains a bounded deterministic coast.
- Existing projectiles, telegraphs, hazards, obstacles, loose-currency schedules, and pickups settle naturally while pending enemy spawns and newly activating hazards cannot enter the coast.
- The exit sequence starts only after the coast distance completes, with no objective or transition soft lock.
- Boarding operations, final victory, reduced-motion behavior, and the forced-completion debug shortcut remain safe.

Status: implemented, corrected after deployed playtest, and concluded at a 360-unit recovery lane. `src/game/SectorCooldown.ts` keeps the authored combat endpoint separate from the extended traversal exit, gates eligibility to non-final flight sectors, and owns the hold/coast distance state. `GameplayScene` pins scrolling at the authored endpoint until every live enemy, including non-objective contacts, has resolved. Only then does the full coast begin. Existing projectiles, telegraphs, environment objects, planned loose currency, effects, pickups, and already-active hazards continue through normal fixed-step simulation; only pending enemy spawns and hazards that were not active when the coast began are suppressed. The hazard allowlist remains in force through the exit animation. The HUD reports recovery distance, settling hazards, and remaining exit distance, while debug state exposes coast progress. Boarding operations, final victory, and the `8` forced-completion shortcut bypass the coast and retain their current exit behavior.

Verification: final 360-unit `npm run verify:release` passes in the combined work order 112 release with 92 Vitest files and 542 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base preview smoke. Cooldown regression covers exact endpoint hold, the full post-clear 360-unit coast, preservation of live entities and loose-currency scheduling, non-objective enemy gating, and active-hazard allowlisting.

## Work order 112 - Pause-safe hazard-zone runtime

Goal: prevent scroll locks from turning bounded hazard windows into indefinite arena denial.

Prompt:

> Add deterministic fixed-step runtime progression for sector hazards when visible gameplay scrolling is paused. A hazard that has already entered its telegraph or active phase should continue through warning, damage, and expiry at the sector's nominal scroll speed. Hazards that have not yet appeared must remain tied to real scroll distance and must not activate merely because the arena is paused. Preserve ordinary moving-scroll behavior, coast allowlists, collision/render parity, pause-menu freezing, and the boss arena hide-and-defer fresh-telegraph contract. Add debug state and focused tests. Run checks.

Acceptance criteria:

- Already-visible hazards cannot persist indefinitely during set-piece, enemy-clear, or other gameplay scroll holds.
- Future hazards do not activate while real sector distance is stationary.
- Runtime progress stays monotonic after scrolling resumes and drives both rendering and collision from the same effective distance.
- Zero-time/menu pauses remain frozen, while boss arena suppression resets transient overrides before the existing deferred release telegraph.

Status: implemented. `src/game/SectorHazardRuntime.ts` owns a bounded transient effective-distance map keyed by existing hazard ids. Fixed-step updates register only hazards already visible at real scroll distance, advance those entries at the conditioned sector's nominal speed while scroll delta is zero, and preserve their lead monotonically after travel resumes. `SectorFeatures` accepts the same effective-distance overrides for presentation and collision consumers. `GameplayScene` advances the runtime after scroll/arena resolution, excludes intentionally hidden boss-lock time, retains work order 111 coast allowlists, and exposes tracked count plus accumulated pause seconds/distance in the debug overlay. Entering the boss hide-and-defer state clears transient overrides so release still restarts a full visible warning lead. No save or generation schema changes are required.

Verification: `npm run verify:release` passes with 92 Vitest files and 542 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Five focused runtime tests cover held telegraph/active/expiry progression, future-hazard exclusion, monotonic resume, zero-time and boss-lock behavior, and coast allowlists; the combined cooldown/feature/hazard/arena pass covers 37 tests. Chromium confirms the public hazard-runtime debug readout. The production build emits 833.84 kB minified/224.96 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The existing chunk warning remains open and no threshold changed.

## Work order 113 - Boarding approach objective soft-lock repair

Goal: remove the unresolved Furnace Ledger objective crash and make the same content-integrity failure impossible to ship silently.

Prompt:

> Fix the between-sector approach decision soft lock caused by `Unknown mission objective: objective_system_sabotage`. Trace the authored producer, add or correct the intended objective without weakening boarding identity, and preserve compatibility with generated plans and suspended runs. Extend content validation so every boarding contract objective exists and agrees with its declared verb. Add deterministic coverage that resolves every generated boarding objective before launch. Run checks.

Acceptance criteria:

- Furnace Ledger can pass from an approach decision into boarding gameplay without throwing.
- Its sabotage objective is feasible through existing interior destructibles, combat accounting, travel, and extraction paths.
- Every shipped boarding contract objective reference and verb is validated during normal content checks.
- Generated plans and run snapshots need no migration, and no approach branch can retain an unknown boarding objective.

Status: implemented. `objective_system_sabotage` is now an authored interior objective with subsystem-destruction, security-screen, and extraction-route clauses plus boarding-appropriate success, partial, failure, cleanup, world, and reward-bias behavior. Furnace Ledger retains its original contract and generated-plan ids, so existing snapshots resolve without migration. `contentValidation` now includes all six boarding contracts and rejects duplicate ids, missing objective references, objective-verb mismatches, empty titles/summaries, and empty objective-kind lists. Boarding regression projects every generated operation and explicitly verifies the Furnace Ledger sabotage plan before an approach boundary can launch it.

Verification: `npm run verify:release` passes with 92 Vitest files and 544 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. The focused boarding/content/objective/mission pass covers 60 tests. Regression explicitly resolves all six generated boarding objectives and proves missing or verb-mismatched boarding references fail content validation. The production build emits 834.54 kB minified/225.10 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The existing chunk warning remains open and no threshold changed.

## Work order 114 - Projected finale boss-gate soft-lock repair

Goal: ensure shortened required gate operations keep their set piece and boss handoff inside reachable mission distance.

Prompt:

> Fix the STARBREAK-SMOKE Act II 5/5 sector-10 soft lock where scrolling stops at 2359/2718u after enemies clear and the boss never arrives. Reproduce the deterministic mission projection, identify every coordinate-owning gate plan that can retain stale full-sector distances, and rebuild those plans from the projected objective and scroll. Preserve boss-arena approach/lock/release behavior, set-piece identity/dependencies/rewards, finale modifiers, route conditions, pacing, and work order 111 recovery coast. Add a seed-specific regression that reaches the projected lock and proves the boss spawn request can occur. Run checks.

Acceptance criteria:

- STARBREAK-SMOKE sector 10 places the Wreck-Train anchor and boss lock before the projected gate-operation endpoint.
- Completing the reachable set piece releases the support gate and requests the boss without debug intervention.
- Every terminal mission projection derives arena and set-piece coordinates from its projected scroll rather than copying full-sector coordinates.
- Non-terminal, boarding, conditioned, paced, finale, cooldown, and snapshot behavior remain compatible.

Status: implemented. Required gate operations previously scaled live scroll to 65% while copying the generated full-sector `arena` and `setPiece` plans unchanged. STARBREAK-SMOKE therefore stopped at the shortened operation endpoint before either the Wreck-Train anchor or boss lock could be reached. `MissionDirector.projectObjectiveSector` now materializes the projected objective and scroll first, rebuilds the terminal `BossArenaPlan` from those values, and rebuilds the terminal `SetPiecePlan` from the projected arena. Advance, detour, and pursuit operations still project neither plan; boarding still removes both after projection. Finale modifiers, route conditions, and pacing continue through their existing downstream transforms.

The seed-specific regression advances sector 10 through briefing, entry, advance, approach decision, and staging into the required gate. It proves the stale generated anchor would exceed the projected scroll, the rebuilt arena lock is reachable, the Wreck-Train anchor matches that lock, and a completed set piece makes `BossArenaState` request the boss at the lock.

Verification: `npm run verify:release` passes with 92 Vitest files and 545 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. The focused mission/arena/set-piece/cooldown pass covers 33 tests. The environmental Chromium fixture was also hardened so its rolling budget assertion no longer requires a transient hazard phase and the initial pickup population to occupy the same frame; it still verifies the exact injected environment and pickup setup separately. The production build emits 834.64 kB minified/225.16 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The existing chunk warning remains open and no threshold changed.

## Work order 115 - Discrete proximity-mine clusters

Goal: turn mine hazards from abstract lane damage into interactive world-anchored combat actors.

Prompt:

> Rework the mine hazard into spawned clusters of discrete destructible world-anchored proximity mines. Mines should be tough under ordinary fire but vulnerable to explosions. Proximity, damage, and chain triggers must use readable fixed-step detonation telegraphs. Blasts damage the player and hostile actors, interact with existing destructibles and set pieces, and pass a shorter telegraphed fuse to nearby mines rather than removing a chain instantly. Preserve deterministic hazard scheduling, fixed combat-world coordinates, boss suppression/deferral, pause/coast behavior, accessibility settings, collision/render parity, and bounded entity/chain budgets. Remove the former lane-wide mine damage and presentation. Add debug counters, schema validation, and focused deterministic/runtime tests. Run checks.

Acceptance criteria:

- Every final conditioned/director `mine_belt` window deterministically materializes a bounded 4-6-mine cluster inside fixed combat-world and sector-entry/exit limits.
- Mines are individually destructible and world anchored, resist ordinary fire, arm from proximity or damage, and use shorter fuses for explosive and neighboring-mine triggers.
- A visible countdown precedes every blast; blasts damage players, enemies, bosses, allies, set pieces, and eligible nearby environment objects through bounded existing combat paths.
- Nearby mines chain through a new telegraphed fuse, and the legacy mine lane neither renders nor applies rectangle damage.
- Reduced motion, performance mode, high contrast, scroll holds, recovery coasts, boss deferral, objectives, cleanup, and save-compatible operation restarts remain safe.

Status: implemented. `proximity_mine` extends the environment-object catalog with validated trigger, fuse, blast, damage, chain, rendering, audio/VFX, placement, and accessibility metadata. `EnvironmentObjectPlacement` forks deterministic per-hazard cluster RNG without perturbing ordinary object selection, places 4-6 mines per final `mine_belt` schedule, and retains fixed 640x720 entry/exit and safe-lane validation. `CombatState` keeps mine anchors immutable, advances proximity/damage/chain fuses in fixed time even while scroll is held, lets ordinary fire wear down seven armored hull, sensitizes mines immediately to bomb/special/chain damage, damages both sides plus set pieces on blast, and reuses the capped six-reaction environment chain path. Mine fuses shorten rather than disappear when chained. The canvas uses non-color glyph, trigger/blast rings, and a countdown arc; high contrast strengthens outlines while reduced-motion/performance settings avoid decorative motion. The old drifting mine band is now a non-damaging scheduling envelope and is not painted. Debug state reports active and armed mines. No generated-run, permanent-save, or suspended-expedition schema migration is required because operation combat restarts from its existing safe checkpoint.

Verification: `npm run verify:release` passes with 92 Vitest files and 552 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. The focused content/placement/runtime/hazard/environment/combat pass covers 8 files and 117 tests. Regression proves deterministic 4-6-mine cluster materialization, fixed-world bounds, invalid proximity-schema rejection, removal of legacy rectangle damage, ordinary-fire resistance, explosion arming, enemy damage, and two-mine delayed fuse chaining. The production build emits 840.21 kB minified/226.51 kB gzip initial JavaScript and unchanged 26.76 kB CSS. The existing chunk warning remains open and no threshold changed.

## Work order 116 - Random-first title and launch reimagining

Goal: make the first screen sell the fantasy and make a fresh unknown expedition the natural default.

Prompt:

> Reimagine the title-screen layout and art, including the tagline and run-start sequence. Lead with original Starbreak Salvage identity, readable code-native art, and one unmistakable new-expedition action. A normal blank launch should generate a random seed at launch; manual seed entry should become a quieter optional control while explicit shared/challenge codes and seed URLs remain deterministic. Preserve resume, archive, upgrade, settings, debug, keyboard, narrow viewport, high contrast, reduced motion, offline/static hosting, and contract-selection behavior. Add an accessible bounded launch handoff and focused tests. Run checks.

Acceptance criteria:

- The title screen has a materially new responsive composition, original art, tagline, supporting fantasy copy, service navigation, progression footer, and clear launch hierarchy.
- With no explicit code, the initially focused primary action launches a newly generated random expedition and returning from that run does not silently reuse its generated code.
- Shared/challenge code entry is collapsed and secondary by default; a supplied URL code remains visible, focused through the primary seeded action, and deterministic.
- The contract-channel handoff prevents duplicate launch, announces its state, clears timers on exit, and uses a shortened non-moving reduced-motion path.
- Keyboard, pointer, resume, settings, high contrast, performance mode, narrow layouts, offline assets, and existing contract/run flows remain compatible.

Status: implemented. `MainMenuScene` now uses a two-column salvage-transmission masthead with an original inline SVG cutter, shattered ring, wreckage, scanner, and recovery caption; the tagline is “Break the blockade. Build the impossible. Bring home what survives.” A bordered launch directive, compact hangar-service navigation, progression/network footer, and responsive single-column/narrow variants replace the former vertical form stack. Ambient ship, scanner, and wreckage animation is CSS-only and disabled by reduced-motion/performance settings. Launch disables duplicate controls, announces three short contract-channel states, and hands off after 560 ms, or one static 80 ms beat under reduced motion.

Blank and `RANDOM` input now resolve through the injectable random-seed factory; `DEFAULT` remains the explicit STARBREAK-SMOKE reference route. The primary button says `Start Random Expedition` for ordinary visits and `Start Seeded Expedition` when a URL or retained manual code is present. Manual codes live inside `Use a specific expedition code`, retain datalist/status support, and can launch directly. `GameApp` no longer consumes a random seed merely by opening the menu and clears title input after a random launch, while generated run identity, summaries, share URLs, deterministic generation, and snapshots remain unchanged.

Verification: `npm run verify:release` passes with 92 Vitest files and 552 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused coverage includes five seed-resolution cases plus targeted title/run-flow Chromium journeys for random launch, manual code launch, explicit URL launch, launch-state announcement, keyboard focus, Scenario Lab navigation, suspended-run resume, reduced motion, high contrast, performance mode, and narrow layout. The production build emits 846.20 kB minified/228.90 kB gzip initial JavaScript and 31.74 kB CSS/7.15 kB gzip. The existing chunk warning remains open and no threshold changed. Direct screenshot inspection was attempted through the in-app browser control surface, but no browser target was available in this session; Chromium responsive/accessibility automation is the available local visual evidence.

## Work order 117 - Ship-led sector departure

Goal: make sector completion read as the player's craft committing to the next leg of the voyage.

Prompt:

> Replace the abstract sector-exit vector animation and progress-bar overlay with the player's actual ship igniting its thrusters, accelerating ahead of the stationary sector camera, clearing the top of the viewport, and then handing off through a tasteful menu transition. Preserve the peaceful recovery coast, natural hazard/projectile settlement, ordinary route/reward flow, specialized boarding and final-victory handoffs, deterministic timing, contract-specific ship appearance, accessibility announcements, reduced motion, debug completion, and static-host compatibility. Add focused sequence and Chromium smoke coverage. Run checks.

Acceptance criteria:

- The live contract ship remains visible in the settled sector, recenters, shows a strong thruster ignition, accelerates upward, and clears the top of the fixed combat viewport while the camera stays behind.
- The former beacon/corridor metaphor and player-visible percentage overlay are removed; the HUD yields to the departure and the next menu appears only after a restrained closing transition.
- Screen-reader users receive phase announcements without a visual toast, and reduced motion preserves the narrative with a shorter launch, no speed streaks, and bounded exhaust scale.
- Debug completion remains fast, phase/progress state remains inspectable, and route, reward, boarding, cooldown, and final-summary outcomes are unchanged.

Status: implemented. `SectorExitSequence` now returns a pure four-phase departure presentation from elapsed time and the player's starting position. `GameplayScene` holds the settled combat camera, fades the persistent HUD, and renders the actual contract-specific ship at the presentation pose instead of painting an abstract destination. `CanvasRenderer` enlarges the existing engine wake and flame, adds a bounded set of vertical acceleration streaks, lets the ship clear the viewport, and then closes a dark aperture before the existing completion callback opens the route or summary. The old beacon, corridor, visible toast, and percentage copy are gone; phase announcements remain in an `aria-live` screen-reader region and percentage progress remains debug-only. Normal departure lasts 1.72 seconds, reduced motion lasts 0.96 seconds without streaks, and the debug-fast path remains 0.60 seconds. No generation, gameplay, save, snapshot, or content schema changes are required.

Verification: `npm run verify:release` passes with 92 Vitest files and 552 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused sector-exit and combat coverage passes with 34 tests, while the forced-completion Chromium journey reaches route flow after observing the accessible launch announcement. The production build emits 847.20 kB minified/229.35 kB gzip initial JavaScript and 31.96 kB CSS/7.19 kB gzip. The existing chunk warning remains open and no threshold changed. Direct screenshot inspection was attempted through the in-app browser control surface, but no browser target was available in this session; Chromium automation is the available local visual evidence.

## Work order 118 - Live boss-lock spawn-envelope repair

Goal: ensure every target required to release a boss gate can arrive before scrolling locks.

Prompt:

> Fix the Act I sector-four soft lock observed at 1116/1810u, where scrolling is locked, visible enemies are clear, the HUD asks for remaining targets, and the boss never arrives. Audit the full post-projection combat schedule rather than only generated mission coordinates. Preserve enemy composition, objective accounting, faction-front/rival/apex additions, arena approach identity, work order 111 recovery, work order 112 hazard behavior, work order 114 projection repair, and natural player-driven clearing. Add deterministic regression coverage and run checks.

Acceptance criteria:

- No distance-gated support, faction-front, rival, or apex spawn in the final assembled combat schedule can remain beyond the live conditioned/paced/finale arena lock.
- Schedule fitting preserves deterministic order, keeps a readable arrival lead and bounded spacing, and leaves time-gated entries unchanged.
- The repair does not force-clear enemies, award kills, bypass set pieces or objectives, or request the boss until the ordinary support field is actually resolved.
- Boss-gated legacy, mission, finale, debug, cooldown, and campaign-influenced combat paths remain compatible.

Status: implemented. Work order 114 correctly rebuilt the mission-projected arena and set piece, but the complete combat schedule is assembled later from directed waves plus faction-front reinforcements, rivals, and apex escorts. A distance entry could therefore retain a marker beyond the final route-conditioned, paced, or finale-adjusted arena lock. Once the camera reached that lock, the entry could never become due and `supportComplete` could never release the boss. `fitSpawnScheduleBeforeBossLock` now applies the live arena lock to the complete assembled schedule immediately before `CombatState` creation. A bounded reverse pass preserves order, retains at least 12 units of spacing where available, and places the last distance arrival 96 units before the lock. Time-gated entries are untouched. No enemy is cleared or credited by the repair; every fitted target still spawns and must resolve through normal combat.

Verification: `npm run verify:release` passes with 92 Vitest files and 553 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused wave-director, boss-arena, and mission-director coverage passes with 21 tests, including an exact 1116-unit lock regression with support entries originally at 1108u and 1260u. The production build emits 847.65 kB minified/229.46 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. The existing chunk warning remains open and no threshold changed.

## Work order 119 - Run-wide hazard sequence non-reuse

Goal: stop adjacent sectors and bonus operations from replaying recognizable hazard scripts.

Prompt:

> Ensure the same sector hazard sequence is not reused again within a run, including optional, bonus, pursuit, boarding, and required gate operations. Preserve overall seed determinism, route-authored hazard identity, boss-lock deferral, pause-safe hazard expiry, recovery-coast allowlists, mine materialization, collision/render parity, accessibility settings, and bounded runtime cost. Re-entering or restoring the same operation should reproduce its prior sequence. Add run-wide deterministic non-reuse coverage and run checks.

Acceptance criteria:

- Every current global sector plus advance, detour, gate, and pursuit role receives a distinct hazard-sequence identity within the run.
- Both inherited/authored hazards and director-added hazards consume the operation identity; variation covers hazard-family ordering and lanes rather than changing labels alone.
- Explicit route/condition hazard kinds remain intact, and all existing timing, relief, boss-deferral, mine, boarding, cooldown, runtime, collision, and rendering contracts remain valid.
- The same run seed, permanent-save fingerprint, route, sector, and operation reproduce the same sequence without runtime randomness, history search, or save migration.

Status: implemented. Hazard repetition came from mission and bonus projections retaining the parent sector's authored feature list while `HazardZoneDirector` salted only some additions from run seed, save fingerprint, sector id, and pressure kind. `GameplayScene` now supplies the current mission stage as a stable sequence key plus an ordinal derived from global sector index and operational role. `HazardZoneDirector` applies that identity to both authored sector hazards and director additions. Sector-authored hazard families use an operation-keyed deterministic permutation; explicit route/condition hazards keep their authored kind. Every hazard receives a run-seeded lane from a 641-slot permutation, so the current 60 combat-role combinations are collision-free while repeated construction of the same operation is identical. The final entries replace the inherited hazard list before ordinary feature consumers run. No mutable used-sequence registry, runtime RNG, generation fingerprint, save, or snapshot schema is added.

Verification: `npm run verify:release` passes with 92 Vitest files and 554 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused hazard-director, sector-feature, sector-condition, and boarding coverage passes with 34 tests. A run-wide regression materializes all 60 current sector/advance-detour-gate-pursuit combinations, proves all 60 ordinals and fingerprints are distinct, reconstructs one operation identically, and verifies the diversified entries reach the final feature plan. The production build emits 848.84 kB minified/229.84 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip. The existing chunk warning remains open and no threshold changed.

## Work order 120 - Directional piercing beam hazards

Goal: turn the abstract warning-beam lane into a readable world-space firing track crossed by a spectacular physical energy bolt.

Prompt:

> Rework the warning-beam hazard to telegraph variable beam source directions and offsets on a world-anchored firing track, then launch a long, finite-velocity sci-fi bolt with visible leading and trailing edges. Rendering and collision must share the same deterministic moving geometry. Active bolts should pierce and damage players, enemies, bosses, allies, set pieces, and eligible environment objects indiscriminately. Preserve long warning leads, boss hide/defer behavior, pause-safe expiry, recovery-coast allowlists, work order 119 operation uniqueness, fixed combat-world parity, accessibility settings, and bounded performance. Add focused geometry, anchoring, travel, collision, cooldown, director, and Chromium coverage. Run checks.

Acceptance criteria:

- Every final warning beam deterministically selects different source/target edges and bounded offsets from its operation identity; source and target edges cannot match.
- Telegraphs clearly distinguish arena entrance from exit, expose direction/offset copy without color alone, and remain anchored to actual sector scroll rather than the viewport or pause-safe hazard clock. Physical source/target positions stay distant and offscreen; visible intersections are clipped to the true canvas edges so round caps extend out of player line of sight.
- Every active beam uses one shared linear endpoint speed, grows from its source, remains fully lit across the complete arena vector for exactly two seconds, and clears toward its destination with the trailing edge at the same speed. The exact visible segment drives player/enemy/boss/ally collision.
- Beam damage pierces every intersecting allegiance and eligible world target, uses existing defeat/objective paths, and cannot tick every frame through the same target.
- Reduced motion, performance mode, high contrast, boss locks, hazard holds, coasts, boarding, and deterministic operation replay remain compatible.

Status: implemented. `BeamHazard` defines twelve directional route families, deterministic 14-86% offsets, distant world endpoints extended 22% beyond the arena span, true 0-to-width/height canvas clipping, a shared 960 combat-unit/second endpoint velocity, a two-second fully-lit dwell, exact circle/capsule overlap, direction copy, and at most 24 continuous world-damage boxes. The physical vector translates with actual sector scroll while its visible entrance and exit are recomputed on canvas boundaries; round line caps and emitter/reticle geometry are centered on those boundaries and naturally clip outside the viewport. `SectorHazardRuntime` owns a transient elapsed-seconds clock per active warning beam. It maps that clock onto the legacy distance window only for activation compatibility, so scroll speed and scroll pauses cannot change ignition, dwell, or clearing speed. The leading edge advances source-to-target, the complete clipped vector holds for exactly two seconds, and the trailing edge follows the identical velocity model. `ActiveSectorHazard.worldDistance` keeps the world vector tied to actual scroll while `elapsedSeconds` drives beam ends independently. `CanvasRenderer`, `SectorHazards`, and world/set-piece damage consume only the clipped visible segment; offscreen portions never render or collide. Every intersecting player, enemy, boss, ally, and eligible world target retains allegiance-neutral piercing and cooldown behavior. No runtime actor/projectile entity, RNG call, generation fingerprint, save field, or snapshot migration is introduced.

Verification: `npm run verify:release` passes with 93 Vitest files and 562 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused geometry/behavior/feature/runtime/director coverage passes with 42 tests. Coverage pins deterministic directional variety, distant endpoint extension, true canvas-edge clipping, the top-spawned endpoint regression, marker sliding under actual world scroll, track stability while scrolling is paused, equal horizontal/vertical endpoint travel after equal elapsed time, the exact two-second fully-lit interval, equal ignition/clearing velocity, scroll-speed-independent runtime timing, clipped visible-body circle parity, bounded continuous world samples, final-plan geometry, active player/enemy/boss/ally damage, and cooldown suppression. The high-contrast reduced-motion environmental-stress Chromium journey exercises the timed beam renderer without a browser error. The production build emits 858.89 kB minified/232.95 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip, a 3.42 kB minified/1.06 kB gzip increase over the initially deployed work order 120 beam. The existing chunk warning remains open and no threshold changed. Direct visual inspection was attempted through the in-app browser control surface, but no browser target was available in this session; automated Chromium is the available local visual evidence.

## Work order 121 - Arena camera line-of-sight boundary

Goal: make the arena frame a strict camera boundary without turning ordinary open space into a physical wall.

Prompt:

> Reassert the displayed arena as the effective line of sight for the gameplay camera. Player and ally projectiles, enemy projectiles, actors, obstacles, proximity mines, loose currency, effects, hazards, landmarks, set pieces, and other active combat-world presentation must not remain visible outside the arena frame. Passive scrolling background art should continue across the full viewport behind and beyond that frame. Ordinary arena edges are visual rather than physical: enemy projectiles must be able to cross them freely and expire through normal cleanup. Only authored walls, such as boarding side walls, may constrain projectiles. Preserve fixed combat-world simulation, screen shake, pointer mapping, responsive safe frames, HUD/frame rendering, collision behavior, reduced motion, performance mode, high contrast, and bounded cleanup. Add focused camera-clip and projectile-boundary tests. Run checks.

Acceptance criteria:

- One stable camera clip applies to every active gameplay render consumer after viewport placement and before world transforms; screen shake cannot move content outside that line of sight.
- Full-viewport generated background, starfield, parallax, horizon, and velocity art remain visible outside the gameplay frame, while HUD and arena-frame presentation remain uncut.
- Open-flight enemy projectiles keep their velocity beyond all four ordinary arena edges and rely on TTL/offscreen cleanup rather than invisible clamping or reflection.
- Authored boarding side walls retain explicit projectile containment without making the default combat bounds solid.
- Pointer mapping, player movement limits, collisions, fixed 640x720 combat geometry, accessibility settings, exit sequences, and deterministic content remain compatible.

Status: implemented. `CanvasRenderer.beginGameplayLayer` now establishes a viewport-space rectangular clip from `gameplaySafeFrame` before applying screen shake, arena translation, and combat-world scale. Every gameplay call already occurs inside that balanced layer, including boarding interiors, landmarks, hazards, environment objects and mines, set pieces, pickups, telegraphs, effects, allies, enemies, bosses, all projectile allegiances, player/destruction presentation, and the sector-exit aperture. `paintBackground` remains before the clipped layer and `paintGameplayFrame` remains after it, so generated passive art fills the viewport and the frame/HUD stay visible. `CombatBounds.enemyProjectileBoundary` makes physical containment explicit. Default/open bounds do not alter projectile velocity at arena edges; boarding combat opts into `sideWalls`, preserving its 60-unit rails. Existing ±80-unit/TTL cleanup remains authoritative after projectiles leave view. No generated content, run/save/snapshot schema, collision shape, actor budget, or production dependency changes.

Verification: `npm run verify:release` passes with 94 Vitest files and 564 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused camera, combat, viewport, environment-object, and loose-currency coverage passes with 55 tests. Coverage pins viewport-frame clip coordinates and call ordering before world translation, open projectile travel through left/right/top/bottom edges, boarding side-wall containment, responsive frame geometry, object runtime, and currency cleanup. Chromium covers high-contrast/reduced-motion environmental stress, narrow safe-frame layout, pointer-guided combat, sector departure, Act II/boarding fixtures, snapshot recovery, and ordinary gameplay without browser errors. The production build emits 859.05 kB minified/233.01 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip, a 0.16 kB minified/0.06 kB gzip increase over work order 120. The existing chunk warning remains open and no threshold changed. Direct visual inspection was attempted through the in-app browser control surface, but no browser target was available in this session; automated Chromium is the available local visual evidence.

## Work order 122 - Terminal departure-frame latch

Goal: keep the departed player ship outside camera range through the exact frame that hands control to the next menu.

Prompt:

> Fix the one-frame visual pop at the end of every sector-exit animation where the player ship returns to its ordinary arena-center pose immediately before route selection or the run summary appears. Once departure begins, the ship must remain owned by the exit presentation through handoff. At terminal progress it must stay above the camera and fully transparent beneath the closing transition. Preserve normal, reduced-motion, debug-fast, sector-complete, victory, boarding, route, summary, HUD announcement, camera clip, and callback behavior. Prevent duplicate completion callbacks and add a focused orchestration regression. Run checks.

Acceptance criteria:

- Normal completion, victory, and debug-forced completion all reach the terminal exit presentation before invoking their handoff callback.
- Clearing the one-shot completion result cannot clear the presentation state or re-enable ordinary combat-player rendering on an intermediate frame.
- A delayed replacement scene leaves the old gameplay scene frozen at transition progress 100%, with ship alpha zero and ship position above view, without resuming combat updates or firing the callback twice.
- Existing departure duration, reduced-motion treatment, transition aperture, accessible announcements, route/summary outcomes, and work order 121 camera clipping remain unchanged.

Status: implemented. `GameplayScene.finishSectorExitSequence` now advances any normal or debug-shortcut departure to terminal elapsed time, clears the result latch and cooldown state, but deliberately retains the completed `SectorExitSequenceState`. `render`, `syncExitSequenceUi`, and the update guard therefore continue consuming the final transition presentation until the scene callback replaces gameplay: the ship remains above -100 world units with alpha zero and the aperture remains closed. `exitSequenceResult` still becomes null before invoking `onSectorComplete` or `onGameOver`, so repeated updates or input cannot dispatch a second result. No timing constant, renderer, combat state, generation, save, snapshot, or content schema changes.

Verification: `npm run verify:release` passes with 94 Vitest files and 565 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused sector-exit, recovery-coast, and camera coverage passes with 12 tests. The orchestration regression invokes completion before natural duration, proves terminalization occurs, verifies `exitSequence` remains latched while `exitSequenceResult` and cooldown clear, confirms ship alpha zero and Y below -100, and observes exactly one sector-complete callback. Existing sequence coverage still pins normal, reduced-motion, debug-fast, and victory presentations. Chromium force-completes sectors through the departure announcement into operational-map/route flow without browser errors. The production build emits 859.10 kB minified/233.01 kB gzip initial JavaScript and unchanged 31.96 kB CSS/7.19 kB gzip, a 0.05 kB minified/0.00 kB gzip increase over work order 121. The existing chunk warning remains open and no threshold changed. Direct visual inspection was attempted through the in-app browser control surface, but no browser target was available in this session; automated Chromium is the available local visual evidence.

## Work order 123 - Hardpoint control interface reimagining

Goal: turn loadout engineering from a prose ledger into a fast visual decision surface that previews how the draft ship will fight.

Prompt:

> Reimagine the hardpoint management menu. Reduce default text verbosity and replace raw equipment-stat prose with visual representations wherever practical. Make item replacement comparisons straightforward. Add a visual ship attack preview pane and compact mini-HUD that demonstrate the selected draft loadout's weapon pattern and behavior. Preserve deterministic engineering, reversible draft/commit boundaries, legality validation, every install/remove/scrap/reroute/overclock/fusion operation, keyboard and pointer access, narrow layouts, high contrast, reduced motion, performance mode, and static/offline hosting. Add pure presentation models and focused tests. Run checks.

Acceptance criteria:

- Hardpoint Control leads with a draft-aware ship attack simulation, weapon-pattern cue, compact output HUD, and grid-validity readout derived from real loadout resolution.
- Power, thermal, mass, command, instability, weapon output, and component burden are represented with labeled meters, bars, glyph strips, and accessible numeric equivalents rather than repeated prose.
- Every compatible cargo install action names its destination and shows direct P/H/M/C/instability change against the currently installed component before selection.
- Hardpoints, quality, source, slot, size, tags, affixes, evolutions, pending actions, and fusion recipes remain scannable without hiding validation failures or operation results.
- Existing deterministic content, engineering operations, commit legality, gameplay behavior, save/snapshot compatibility, accessibility settings, and responsive flows remain unchanged.

Status: implemented. `src/ui/FoundryPresentation.ts` provides pure draft-versus-commit presentation models for five resource envelopes, real primary-weapon volley/impact/cadence/velocity/shot-heat output, active engineering traits, compact component stats, and candidate-versus-installed burden. `ShipPreview` accepts optional draft frame/module/weapon overrides while retaining the contract silhouette and palette. `FoundryScene` now opens as Hardpoint Control with a large attack-simulation pane, target cue, mini-HUD, normalized output bars, grid meters, compact hardpoint/cargo stat strips, quality/source/tag/modifier badges, direct install-delta controls, concise draft history, and structured evolution cards. Existing foundry reducers and resolution remain the only mutation and legality authority. CSS provides desktop and narrow compositions plus high-contrast, reduced-motion, and performance-mode simplification; all detail remains available through ARIA labels, native meter roles, modifier titles, blocker text, and live status.

Verification: `npm run verify:release` passes with 95 Vitest files and 568 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused foundry, presentation, and ship-preview coverage passes with 15 tests, including valid/invalid drafts, overclock deltas, direct replacement burden, and draft weapon-pattern overrides. Desktop 1440x1000 and narrow 390x844 Chromium captures were inspected directly; the responsive attack console, meters, comparisons, sticky controls, and overflow remain usable. The production build emits 868.86 kB minified/235.63 kB gzip initial JavaScript and 41.17 kB CSS/8.85 kB gzip. The existing chunk warning remains open and no threshold changed. In-app browser control exposed no active target, so direct visual QA used local Playwright Chromium captures.

## Work order 124 - Boss-approach hazard settlement

Goal: let environmental pressure finish before boss combat so defeat releases into a genuinely quiet lane instead of resurrecting stale hazards.

Prompt:

> Fix boss arrival suppressing active hazards until defeat, observed at least in Act I sector 4. Allow hazards to complete as the boss approaches, then keep arena lock and post-fight travel free of deferred hazard surprises. Preserve full telegraph and active durations, deterministic operation-specific sequences, pause-safe runtime, finite beam timing, collision/render parity, boss and set-piece gates, recovery coast behavior, accessibility settings, and bounded performance. Remove obsolete post-release hazard reconstruction, update the hazard policy contract, add a STARBREAK-SMOKE sector-4 regression, and run checks.

Acceptance criteria:

- Every authored, route-conditioned, and director-added hazard in a boss operation retains its full warning and active span but clears before the live arena lock.
- Late windows are deterministically packed into the approach with stable ordering and bounded separation; debug/read models identify approach adjustments rather than post-boss deferrals.
- Arena lock and boss combat have no active hazards, and boss release cannot reconstruct, reactivate, or reschedule a completed window.
- STARBREAK-SMOKE Act I sector 4 contains environmental pressure during its approach but reports no active hazard at lock or release.
- Pause-safe expiry, two-second finite beams, mines, world anchors, allegiance-blind damage, operation non-reuse, set pieces, cooldowns, accessibility modes, saves, and snapshots remain compatible.

Status: implemented. The hazard registry policy is now `settleBeforeLock`, enforced by content validation for every shipped hazard family. After operation-specific family/lane diversification, `HazardZoneDirector` combines authored, condition, and director entries and performs one deterministic latest-to-earliest approach pass. Each adjusted entry preserves its telegraph lead and active span, keeps a 12-unit gap from the next window, and clears at least 18 units before the live arena lock; entries that cannot retain a complete window are omitted rather than moved after the boss. Schedule events, summaries, act-pressure telemetry, and debug labels report boss-approach adjustments. `GameplayScene` no longer records a boss-release distance, and `SectorFeatures`/`SectorHazardRuntime` no longer expose the obsolete release-deferral activation path. Locked suppression remains a readability safeguard but has no scheduled hazard left to freeze or resurrect. No runtime RNG, combat entity, save field, snapshot field, or content fingerprint changes.

Verification: `npm run verify:release` passes with 95 Vitest files and 569 tests, ESLint, typecheck, production build, all 13 Chromium paths, and the Pages-base production-preview asset smoke. Focused hazard-director, sector-feature/runtime, content-validation, act-pressure, and finale coverage passes with 77 tests. Regression pins STARBREAK-SMOKE Act I sector 4 to retain a hazard in the approach while every window ends before lock and both lock/release active lists remain empty. The Chromium finale path confirms the new approach-adjustment readout and zero active hazards at arena lock under narrow high-contrast/reduced-motion/performance settings. The production build emits 868.72 kB minified/235.53 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. The existing chunk warning remains open and no threshold changed. In-app browser control exposed no active target, so local Playwright Chromium supplied the browser evidence.

## Work order 125 - Viewport-wide pointer guidance

Goal: keep mouse/touch steering responsive everywhere inside the gameplay browser window while preserving the arena as the ship's physical movement boundary.

Prompt:

> Extend the mouse-follow control plane from the arena rectangle to the full browser viewport. Project pointer positions in letterbox and HUD-reserve space onto the nearest arena edge, keep the ship radius inside existing combat bounds, and let remaining tangential guidance slide the ship along that edge rather than halting. Preserve keyboard priority, primary-button fire, menu/settings/native-control focus safety, pointer cancellation, blur handling, deterministic fixed-step movement, viewport scaling, touch compatibility, saves, snapshots, and bounded performance. Add unit and browser regressions, update the pointer contract, and run checks.

Acceptance criteria:

- Every non-UI pointer move inside the browser viewport keeps pointer guidance active, whether or not the raw point is inside the gameplay safe frame.
- Raw viewport positions still map to fixed 640x720 combat coordinates and clamp to the nearest arena perimeter; presentation scale never alters ship simulation bounds.
- The player remains radius-clamped inside the combat safe frame and continues moving tangentially along an edge when the outside pointer changes along that edge.
- Keyboard movement remains authoritative while held; primary-button/touch fire and DOM/menu/settings focus safety retain their existing behavior.
- Focused tests cover outside-frame guidance, clamped projection, real edge capture, tangential sliding, input-mode reporting, primary fire, and console safety.

Status: implemented. `InputSystem` now treats every non-ignored window pointer update as active guidance instead of requiring `insideFrame` or a held primary button. The existing `viewportPointToCombatPoint` conversion continues clamping raw browser coordinates to the fixed combat perimeter and retaining `insideFrame` telemetry; `getPointerGuidanceAxis` consumes the projected target, keyboard input keeps priority, and `CombatState` remains the radius-aware final bounds authority. Pointer cancellation, blur, DOM overlay/native-control exclusion, touch identity, and fire state are unchanged. The focused Chromium path now drives the pointer into the right letterbox, requires the ship to reach its right combat bound, moves the still-outside pointer vertically, requires tangential edge travel, then verifies primary fire and no console errors. No RNG, renderer, combat geometry, settings, save, or snapshot changes.

Verification: focused input/viewport coverage passes with 2 files and 14 tests. `npm run check` passes typecheck, ESLint, 95 Vitest files and 571 tests, plus the production build; `npm run test:preview` confirms the Pages base and every hashed asset. `npx playwright test --list` discovers all 13 Chromium paths, including the expanded pointer regression. The production build emits 868.79 kB minified/235.57 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. The existing chunk warning remains open and no threshold changed. The outside-frame edge-capture/slide/fire Chromium regression is authored, but its local launch was not executed: Playwright AppData access was not granted and the in-app browser exposed no active target in this session.

## Work order 126 - Operation-world objective soft-lock repair

Goal: prevent multi-operation missions from requiring targets that do not exist in the current projected combat world.

Prompt:

> Fix the sector-10 soft lock observed at 2499/2859u with a clear field, zero scroll speed, and `command hull defeated 0/1`. Distinguish recovery-coast holds from arena locks, trace authored mission clauses through operation projection, and ensure every required clause is realizable by the current operation. Non-gate Boss Approach stages must settle their support/travel work and enter the peaceful coast without a boss; the required gate must retain its set piece, arena, and command-hull requirement. Preserve natural field clearing, objective/result identity, deterministic missions, route/faction/apex influences, work orders 111/114/118, saves, snapshots, and bounded performance. Add deterministic regressions and run checks.

Acceptance criteria:

- The sector-10 `Boss Approach: advance` operation has no boss, arena, or set piece and no longer retains a `bossDefeats` clause.
- At the observed 2499u combat endpoint, a naturally cleared support field satisfies the projected objective and allows the existing 360-unit recovery coast to begin.
- The later required gate still exposes `BREACH GATE`, the command-hull clause, the reachable set piece, and the boss arena; no boss requirement is globally weakened.
- Objective projection preserves contract/objective identity and consequence policies while supplying accurate support-stage copy and cleanup behavior.
- No enemies or hazards are force-cleared, no kills are credited, and no boss, set piece, RNG stream, save field, or snapshot field is added or bypassed.

Status: implemented. `ObjectiveDirector.projectMissionObjectivePlan` now compares the authored plan with the already projected sector objective. When an operation has no boss, the pure projection removes only `bossDefeats` clauses, changes boss-gate cleanup to ordinary field cleanup, and provides support-approach HUD/outcome copy; plans without a boss clause and boss-required gate plans retain their original object identity. `MissionDirector.createMissionCombatProjection` applies that projection after flight/boarding world projection, so clause availability follows the same sector plan consumed by gameplay. The STARBREAK-SMOKE sector-10 advance regression reproduces the `Boss Approach: advance` stage and observed 2499u endpoint, proves the boss/arena are absent, then reaches terminal success from normal support defeat and travel. The existing gate regression now also proves `BREACH GATE` and `bossDefeats` remain alongside the reachable arena/set piece. No combat-runtime, coast, arena, set-piece, generation, save, or snapshot behavior changes.

Verification: `npm run verify:release` passes with 95 Vitest files and 572 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused objective/mission/wave/coast coverage passes with 4 files and 30 tests. Chromium covers Act II finale, snapshot, accessibility, pointer, and main mission flows. The production build emits 869.37 kB minified/235.78 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. The existing chunk warning remains open and no threshold changed. The supplied deployed screenshot provided the visual diagnosis; this is a state-projection repair with no visual asset or layout change. In-app browser control exposed no active target, so automated local Chromium supplied browser evidence.

## Work order 127 - Allied multi-part target support

Goal: let crew wingmates and support craft contribute directly to multi-part set-piece fights.

Prompt:

> Extend existing ally focus fire to exposed set-piece subsystems such as turrets, shield emitters, armor, hangars, drives, couplers, and cores. Crew and fleet support must use one deterministic bounded targeting policy and the same projectile collision, dependency locks, armor, allowed-damage, reward, stage, completion, and objective accounting paths as player weapon fire. Do not let locked, destroyed, or off-camera components attract shots. Preserve ordinary enemy/boss fallback, formation commands, actor/projectile caps, seeded behavior, saves, snapshots, and performance. Add focused regressions and run release checks.

Acceptance criteria:

- Active focus-fire allies prefer the nearest visible targetable component of the current set piece, then fall back to the existing bounded standard-enemy scan and boss target.
- Crew and fleet support projectiles can damage and destroy every weapon-vulnerable component without bypassing dependency locks, armor, allowed damage sources, or stage order.
- Component destruction uses existing environment/set-piece accounting, rewards, effects, stage advancement, and completion exactly once; it does not count as an ordinary enemy defeat.
- Locked, destroyed, fully off-camera, and inactive components do not attract ally fire, while exposed optional turrets/hangars and required emitters/armor/drives/cores remain eligible.
- The combined four-ally/20-projectile ceilings, 24-enemy fallback scan, commands, cadence, projectile motion, RNG, content, saves, snapshots, rendering, and objective contracts remain unchanged.

Status: implemented. `CombatState` now resolves a ready ally's set-piece focus from the single active assembly, filters acquisition to dependency-targetable components intersecting the combat camera, and chooses the nearest component in stable content order before ordinary enemy/boss fallback. Both crew and fleet retain the same actor, command, cadence, projectile, and cap path. A shared projectile-to-set-piece helper now serves player and ally shots, delegating all legality and state transitions to `damageSetPieceComponent` and all feedback, rewards, and accounting to `applySetPieceRuntimeEvents`. Focused tests alternate a crew wingmate and support craft through the Hecaton's full emitter, turret, armor, hangar, drive, and core chain, verify three stages and one completion without ordinary enemy credit, and prove a visible assembly receives focus ahead of a nearer standard enemy. No content, RNG, renderer, save, snapshot, objective, or cap changes.

Verification: `npm run verify:release` passes with 95 Vitest files and 574 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused ally/set-piece/fleet coverage passes with 4 files and 26 tests. The build emits 869.75 kB minified/235.88 kB gzip initial JavaScript and unchanged 41.17 kB CSS/8.85 kB gzip. The existing chunk warning remains open and no threshold changed. This work order changes combat behavior without adding visual assets or layout; Chromium regression coverage supplies the browser and console-safety evidence.

## Work order 128 - Hardpoint live-fire attack simulation

Goal: make the Hardpoint Control attack pane demonstrate the draft ship actually firing its loadout instead of pulsing abstract indicators over a close-up model.

Prompt:

> Replace the pulsing weapon-guide presentation with a bounded live firing range. Show the draft ship low in the pane and continuously launch the same projectile volley the loadout creates in combat, including single/dual/spread/split/missile/beam geometry, cadence, velocity, relative radius/damage, tags, extra engineered shots, and convergence. Reuse production projectile rules rather than duplicating them. Preserve the foundry mini-HUD, comparisons, reversible draft/commit operations, responsive layouts, keyboard/pointer access, high contrast, reduced motion, performance mode, deterministic behavior, static hosting, saves, snapshots, and combat balance. Add focused unit/browser coverage, inspect the result visually, update documentation, and run release checks.

Acceptance criteria:

- The attack pane frames a smaller combat-ready draft ship in the lower field with steady projectiles traveling toward the existing target reticle; the old close-up pulse guides are absent.
- The base volley comes from the same production factory used by `CombatState`, and installed engineering plus owned-item `onFire`/`onProjectileSpawn` hooks alter the preview in production order under the existing proc budget.
- Projectile paths preserve scaled lateral/forward velocity and actual fire cadence while exposing real volley size, radius, damage, TTL, and tags for regression inspection.
- Presentation stays bounded to 12 source shots, six cadence copies, and 48 projectile nodes. Reduced motion shows static trajectory samples, performance mode shows one unfiltered static volley, and high contrast preserves dark-outlined white cores.
- Foundry reducers, combat behavior/caps, inputs, saves, snapshots, and every draft/commit operation remain unchanged; item inputs are read-only and preview dispatch cannot mutate the run.

Status: implemented and corrected after deployment. `WeaponProjectiles.createWeaponProjectileBlueprints` owns the production base volley and `CombatState` consumes it directly. `FoundryPresentation` creates that same volley from the draft primary weapon, applies ordered installed engineering and read-only owned-item fire/projectile-spawn hooks under the shared proc budget, and derives a bounded cadence/velocity flight plan plus accessible summary. It evaluates sequential volley indices across the existing six-wave ceiling, so third/fourth/fifth/sixth-volley drone, missile, heat, phase, and lane effects appear instead of repeating volley one. `FoundryScene` receives the current run item instances, so future Split Prism and other projectile hooks cannot silently disappear from the pane. Review of the reported Drone Chaplain discrepancy found no duplicated combat dispatch: the provisional starter generator forced Split Prism and Chain Arc Capacitor onto every contract, making every base shot triple and discarding two contract-biased rolls. Starter generation now keeps all three deterministic bias-weighted unique rolls instead, restoring distinct base silhouettes while still allowing seeded or acquired items to reshape them. The known fresh-save `STARBREAK-SMOKE` Drone Chaplain now previews a 3/3/3/4/3/3 owned-item cycle around its dual forward Pulse Cannon rather than the universal six-shot Prism fan. Rendering bounds, accessibility modes, foundry operations, combat hook order, saves, snapshots, and runtime projectile caps are unchanged.

Verification: `npm run verify:release` passes with 95 Vitest files and 576 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused foundry/presentation/ship-preview/weapon coverage passes with 4 files and 22 tests; the main sector-to-foundry Chromium journey verifies live projectile metadata and all existing engineering actions. A direct 1280x720 Chromium capture confirms the smaller lower-field ship, steady shot stream, clear target lane, and readable surrounding mini-HUD. The build emits 872.73 kB minified/236.85 kB gzip initial JavaScript and 43.09 kB CSS/9.23 kB gzip. The existing chunk warning remains open and no threshold changed.

Follow-up verification: `npm run verify:release` passes with 95 Vitest files and 579 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused reward/unlock/foundry presentation coverage passes with 3 files and 15 tests, including exact six-projectile Split Prism preview/combat parity, distinct known-seed starter kits, sequential periodic volleys, and refreshed deterministic Act II reward snapshots. The build emits 872.99 kB minified/236.97 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. The existing chunk warning remains open and no threshold changed. The supplied deployed screenshot established the visual discrepancy; the correction changes projectile composition only and retains the verified work order 128 layout/CSS.

## Work order 129 - Seeded set-piece layout solvability and variety

Goal: make corrected forward-firing starter loadouts viable against the first multi-part assembly while giving every set piece seed-dependent structural variety.

Prompt:

> Review all capital-ship, station, and wreck-convoy layouts, beginning with the Hecaton arrangement that protects its opening shield emitter behind locked lower structure. Do not restore accidental universal forked projectiles or make dependency-locked components intangible. Guarantee that ordinary forward-firing weapons can reach every required subsystem when it unlocks, then add multiple valid arrangements selected deterministically on different run seeds. Preserve component identity, dependencies, stage/reward/objective accounting, safe lanes, ally targeting, hazards, boss locks, mission projection, fixed-world rendering/collision parity, accessibility settings, and bounded runtime cost. Add validation, deterministic, combat, and release coverage. Run checks.

Acceptance criteria:

- The first Hecaton arrangement gives corrected single/dual forward weapons a legal shot to either opening shield emitter from within player movement bounds; locked armor, drives, cores, hangars, and turrets do not form an unavoidable projectile wall.
- Every set piece supplies at least three authored arrangements with distinct flanked, mirrored, or reversed geometry, layout-specific safe lanes and reinforcement positions, and deterministic named-seed selection.
- Every arrangement places each stable component exactly once, remains inside the fixed 640x720 arena, keeps a safe lane at least 128px wide, preserves the same dependency/stage/reward graph, and exposes a straight-fire corridor to each objective at its earliest unlock state.
- Mission/operation reprojection preserves the already selected layout instead of rerolling it; HUD, debug, and deterministic summaries identify the arrangement and current safe lane.
- Runtime component, projectile, actor, reward, effect, save, snapshot, accessibility, collision, objective, and boss-lock contracts remain bounded and compatible.

Status: implemented. `setPieces.ts` now separates seven/eight-component subsystem graphs from layout geometry. Hecaton Ledger Ark, Bloom Spindle Exchange, and Court Wreck-Train Crown each own three original arrangements: a starboard structure, mirrored port structure, and reversed vertical progression. A dedicated sector-generation fork chooses the layout without moving other streams; `SetPiecePlan` carries layout identity, label, safe lane, and reinforcement positions, and terminal mission reprojection retains that identity while rebuilding its distance. The canonical Hecaton moves its opening emitters out from the former locked stack. `getSetPieceForwardFireLane` conservatively models the largest current player hull and projectile, removes only recursively satisfied dependencies, retains unrelated locked/optional parts, and requires a useful vertical firing interval for every objective. Content validation also checks layout/component bijection, ids, arena bounds, safe lanes, reinforcement positions, stages, dependencies, cycles, and caps. Runtime resolves the selected placements once, while existing collision, rendering, ally focus, rewards, objectives, and boss locks remain authoritative. HUD/debug/run summaries expose arrangement identity.

Verification: `npm run verify:release` passes with 95 Vitest files and 582 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused set-piece/combat/mission coverage passes with 3 files and 25 tests, including all nine layouts, 64-seed selection sweeps, an intentionally blocked fixture, explicit mission-layout preservation, and production Light Needle shots from legal player positions to both opening Hecaton emitters. The build emits 877.56 kB minified/237.92 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. The existing chunk warning remains open and no threshold changed. Direct inspection through the in-app browser was unavailable in this session; the complete Chromium suite and fixed-world geometry/combat regressions are the local visual/runtime evidence.

## Work order 130 - Boss-arena request delivery repair

Goal: prevent a resolved boss approach from losing its spawn request between the gameplay frame's two arena evaluations.

Prompt:

> Fix the Act I sector-four Corporate Kill Grid gate soft lock observed at 1074/1768u after all visible enemies are defeated. Reproduce the earlier lock and audit the complete boss-readiness handoff, including the scene's pre-scroll and post-scroll arena evaluations, rather than adding another forced clear or moving the arena. Preserve normal enemy resolution, Rescue objective clauses, faction-front pressure, mission projection, spawn-envelope fitting, hazards, set pieces, boss identity, arena approach/release, recovery coast, debug shortcuts, deterministic behavior, and objective/reward accounting. Add an exact regression and run release checks.

Acceptance criteria:

- A locked arena with unresolved support does not request the boss; once support resolves, every arena poll continues requesting until `CombatState` confirms that the boss actor spawned.
- The pre-scroll poll cannot consume the request before the post-scroll result used by `GameplayScene` to call `spawnBoss`, including when the final target dies after the prior frame's arena evaluations.
- A spawned or defeated boss suppresses further requests, exactly one actor appears, debug/external bypass remains compatible, and arena release still requires ordinary boss resolution.
- The Rescue corridor's 90% travel clause may remain incomplete at the pre-boss lock and completes through normal post-fight travel; no enemy, clause, reward, or distance is force-cleared or credited.
- Existing spawn fitting, faction/rival/apex pressure, mission projection, set-piece gates, hazards, coasts, saves, snapshots, and deterministic content remain unchanged.

Status: implemented. The soft lock was a lost edge trigger rather than another unreachable spawn or objective clause. `GameplayScene` evaluates `updateBossArenaState` before advancing scroll and again afterward, but only the second result owns the `spawnBoss` call. If support became clear while the arena was already locked, the following frame's first poll set `bossSpawnRequested` and returned `shouldSpawnBoss`; the second poll treated that request as spent and returned false forever. Locked readiness is now level-triggered until `CombatState.bossSpawned` acknowledges a real actor. The historical request flag remains available to distinguish legitimate arena flow from the existing external/debug bypass, while boss activation immediately suppresses repeat delivery. The displayed 1074/1768u position consists of a 1074u arena lock inside a 1408u live operation plus the existing 360u recovery coast; the Rescue corridor ratio is expected to finish after boss defeat and was not gating the request.

Verification: `npm run verify:release` passes with 95 Vitest files and 583 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused boss-arena, mission-director, and wave-director coverage passes with 3 files and 22 tests. The new exact fixture uses the Corporate Kill Grid, a 1074u lock, unresolved then resolved support, consecutive pre/post-scroll polls, and explicit spawn acknowledgement; approach, release, debug bypass, projection, and spawn-envelope tests remain green. The build emits 877.54 kB minified/237.92 kB gzip initial JavaScript and unchanged 43.09 kB CSS/9.23 kB gzip. The existing chunk warning remains open and no threshold changed.

## Work order 131 - Apex pursuit clarity and disposition depth

Goal: turn apex hunts from hidden campaign counters and opaque finale gates into legible marked encounters whose evidence, lasting damage, and disposition routes can be understood and deliberately pursued.

Prompt:

> Reimagine the roaming apex system from contact through resolution. Make trace, ambush, lieutenant, and finale operations stand apart from ordinary sector pressure; explain what each contact can accomplish and preserve those consequences across the hunt. Replace internal status names and compressed `I/P/A/C/M/E` codes with a visual pursuit track, named subsystem condition, campaign evidence, and a finale forecast. Let players preview disposition routes before the finale, and at resolution keep every locked route inspectable with exact current/required scores, contributing sources, missing leverage, consequence, and risk. Successful hunt evidence must contribute to alternatives instead of relying only on unrelated hidden expedition stats. Preserve deterministic plans/state, bounded actors/projectiles, shared boss/objective/reward paths, snapshots, saves, accessibility modes, and static hosting. Add focused and browser regressions and run release checks.

Acceptance criteria:

- Every apex contact has an original threat-specific name, directive, lasting-effect explanation, prominent operation-entry banner, dedicated HUD/objective warning, and at least one marked variant formation; non-finale marked formations must resolve through normal combat before the operation settles.
- The dossier uses plain-language threat status, a four-contact sector/operation timeline, remaining-integrity and three named-subsystem meters, explained trace/lieutenant/migration/escape evidence, and a player-facing hull/escort/hazard/escape forecast. Internal reducer names and one-letter codes remain debug-only.
- All supported dispositions are previewable before the finale. At resolution, ready and locked cards remain keyboard-focusable and expose consequence, risk, exact requirement totals, every contributing source, and the precise remaining deficit without color-only state.
- Hunt evidence contributes directly to outcomes: traces support bargains, lieutenant codes and an exposed core support capture, breached armor supports containment, and disrupted drives support evacuation. The reported successful Crownless state `I3/P2/A2/C0/M0/E1` opens Capture even with zero carrier/fleet boarding points, while Containment honestly remains `1/2` without another custody source.
- Apex generation, event/state identity, snapshots, saves, variety unlocks, boss actors, centralized damage/rewards, and three-escort/two-hazard caps remain compatible. Presentation derives outside the fixed-step loop and adds no unbounded scan or parallel combat system.

Status: implemented. `apexThreats.ts` now authors structure doctrine, three subsystem meanings, and four distinct contact cues for Grave Choir, Crownless Engine, and Pale Convoy. Gameplay creates one immutable contact presentation per operation, opens with a six-second accessible apex banner, repeats the directive in a highlighted HUD/objective warning, and promotes one-to-three existing cloned escorts into visibly variant marked formations. Trace, ambush, and lieutenant formations count as ordinary support targets instead of disposable background pressure; the finale still reuses the single apex boss and existing arena path.

`ApexHunt` now projects structured threat, contact, subsystem, evidence, pressure, and requirement models. Disposition requirements are scored from visible sources and successful hunt evidence, with a complete successful Crownless chain independently supplying the two capture points through lieutenant codes plus its exposed core. The lazy Apex Dossier is a responsive selectable three-threat network with a four-step pursuit track, remaining-integrity/subsystem meters, evidence cards, finale forecast, pre-finale route previews, and inspectable resolution cards. `awaitingResolution` is presented as “Neutralized · decision required”; the `I/P/A/C/M/E` string survives only in debug telemetry. No persisted apex shape, RNG stream, save version, or snapshot version changes.

Verification: `npm run verify:release` passes with 95 Vitest files and 585 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused apex/snapshot/Scenario Lab coverage passes with 3 files and 20 tests; new regressions assert deterministic contact copy, explained read models, exact Crownless evidence sources/readiness, and all existing ending coverage. Chromium exercises the lazy dossier at 390x700 with high contrast, reduced motion, performance mode, keyboard focus, pursuit/subsystem/evidence/pressure/disposition assertions, and safe return. The build emits 888.05 kB minified/241.25 kB gzip initial JavaScript, 51.55/10.82 kB CSS, and a 9.72/2.99 kB lazy Apex Dossier. The existing initial-chunk warning remains open and no threshold changed. The in-app browser surface exposed no available target, so automated Chromium supplied functional/responsive evidence; direct visual inspection remains a deployment check.

## Work order 132 - Socketed upgrade circuits

Goal: replace passive whole-inventory item stacking with a limited, reorderable ship circuit in which installed component sockets and upgrade sequence create deliberate high-power combinations.

Prompt:

> Give every major installed ship component a small typed upgrade-socket layout. Keep acquired items as portable inventory, but make only fitted items active and let the player fit, eject, move, and swap them in Hardpoint Control. Execute item hooks in installed-component/socket order so earlier projectile transformations feed later upgrades. Preserve deterministic acquisition, component replacement, foundry undo/skip/commit, previews, rewards, shops, combat, summaries, accessibility, and static hosting. Replace indistinct bridge mechanics with consequential order-sensitive interactions, version the persisted run state, add focused regressions, inspect the UI, and run release checks.

Acceptance criteria:

- Every installed primary, secondary, defense, engine, utility, drone, and experimental module exposes a native typed socket plus a flexible socket; uninstalled cargo contributes no capacity.
- Starting upgrades auto-fit deterministically, newly acquired upgrades use a compatible vacancy without refitting deliberate rack choices, and full circuits leave excess inventory inactive until the next foundry.
- Hardpoint Control shows component socket occupancy, active/capacity count, exact signal order, compatible types, and compact fit/eject/swap controls. Undo, skip, removal, replacement, and commit reconcile item locations with the draft and committed component graph.
- Only valid fitted items affect combat, route, reward, shop, and live-fire preview hooks. Hook order follows the circuit rather than acquisition order, while inventory/reward/summary ownership remains intact.
- Phase Grazer transforms every fourth complete volley; Signal Clone Stamp copies the chain produced before its socket; Ricochet License performs a real bounded sidewall rebound; Arc Window Invoice heavily charges transformed shots; Cursed Hull Plate amplifies prior retaliation into cursed overkill; Vault Parasite converts cursed/overkill executions into salvage and blast pressure.
- Socket state round-trips through snapshot v10, v9 is retired independently of permanent progression, malformed/ghost/duplicate assignments are rejected, and no gameplay RNG or external dependency is added.

Status: implemented. `shipModules.ts` derives a native-plus-flex socket pair for every module family, while `ItemSockets.ts` owns compatibility, stable installed-component order, deterministic auto-fit, targeted fit/swap/eject, invalid-component reconciliation, active-loadout projection, and the circuit summary. `ItemInstance` now carries an optional run-local socket assignment; new sessions fit their three starters, acquisitions attempt only the new item, and component removal naturally ejects orphaned upgrades. `GameApp`, route rewards, shops, gameplay, and foundry simulation pass only the reconciled active circuit into hooks, while reward choice, inventory, run summary, and permanent run records retain full ownership.

Hardpoint Control now embeds numbered typed sockets in each installed-component card and adds a three-column upgrade rack with live/rack state, compatible-type badges, effect copy, eject buttons, and one compact move/swap selector per item. The signal-order line explains that later upgrades receive earlier transformations. Commit stores the reconciled circuit; Undo, Skip, Back, and invalid component drafts restore or eject safely. Snapshot v10 validates owned item ids, unique acquisition order, explicit null/valid socket shape, live component identity, compatibility, capacity, uniqueness, and circuit-order parity; every v1-v9 key is retired without touching permanent save data.

The former Ricochet License, Cursed Hull Plate, Phase Grazer, and Vault Parasite bridge entries are live, and Arc Window Invoice plus Signal Clone Stamp now create stronger ordering decisions. Real player ricochets consume one bounded rebound at the arena sidewall. Phase-to-split-to-clone produces six shots on a shared trigger where clone-to-phase-to-split produces four, proving circuit order changes behavior instead of merely changing presentation. No new RNG stream, content dependency, actor pool, or unbounded projectile recursion was introduced.

Verification: `npm run verify:release` passes with 96 Vitest files and 591 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused socket/hook/combat/foundry/snapshot/content coverage exercises deterministic auto-fit, deliberate rack preservation, fit/swap/eject, component loss, order-dependent 6-versus-4 projectile chains, ricochet consumption, all-live catalog status, and duplicate/ghost snapshot rejection. Chromium enters the real post-reward foundry, asserts four live upgrades across six numbered sockets, moves an upgrade through its accessible selector, restores with Undo, commits, and reaches the next briefing without console errors. The build emits 897.33 kB minified/243.55 kB gzip initial JavaScript and 53.45/11.22 kB CSS, increases of 9.28/2.30 kB and 1.90/0.40 kB over work order 131. The existing initial-chunk warning remains open and no threshold changed. The in-app browser exposed no target, so direct desktop/narrow visual inspection remains a deployment check; automated Chromium confirms functional and responsive paths.

## Work order 133 - Procedural ship navigation hub

Goal: replace the sector-entry wall of briefing text and forced service sequence with a navigable local carrier hub whose places, state, and next operation are readable at a glance.

Prompt:

> Reimagine sector intermission as a seeded ship-navigation map with spatially arranged local destinations, selectable details, explicit travel, and persistent visit state. Shop, Hardpoint Control, and Fleet Bay are common carrier services and must remain inspectable unless a specific story state supplies an understandable lock reason; Crew Quarters and the Apex Dossier should join the same navigation grammar. Move recovered component handling out of the forced post-reward foundry stop and into hub cargo so players choose when to engineer. Preserve route consequences, shops, rewards, mission briefing/gates, deterministic generation, snapshots, keyboard/pointer access, responsive/high-contrast/reduced-motion modes, static hosting, and all combat behavior. Add deterministic and browser regressions, update project documents, inspect the result, and run release checks.

Acceptance criteria:

- Each sector creates a deterministic local hub name, code, layout, five service positions, launch position, and connected transit network from a named seed/sector stream; different seeds and sectors produce multiple valid arrangements.
- Selecting a map node updates a focused details pane before travel. Nodes expose open, visited, or story-locked state without relying on color; arrow keys navigate spatially, Tab remains valid, and an explicit action confirms transit.
- Shop, Hardpoint Control, and Fleet Bay appear in every ordinary hub regardless of route kind, inventory, cargo, craft roster, or current affordability. Missing capability is explained inside the destination; only an explicit story lock with reason can disable travel.
- Operation Airlock presents a brief story-centric mission description, objective and transit essentials, and no more than two exceptional destination callouts. Full campaign, crew, fleet, apex, and operational diagnostics remain in their dedicated destinations or debug surfaces instead of forming a launch-screen text wall.
- Route rewards acquire and stow one deterministic component, then advance to the next hub without forcing Hardpoint Control. The hub can revisit Shop, Hardpoint, Fleet, Crew, and Apex safely; engineering bonuses cannot be farmed by reopening an unchanged draft.
- Visit state resets on sector transit, round-trips through snapshot v11, rejects malformed/unknown/duplicate destinations, and retires v10 independently of permanent progression. Combat, mission, route, reward, save, and RNG contracts remain compatible.

Status: implemented. `SectorNavigation` now owns four procedural map grammars, stable destination definitions, bounded positional jitter, a connected minimum transit network, explicit story-lock reasons, and the six-entry per-sector visit reducer. `SectorTransitionScene` is now a wide carrier navigation console: an animated local chart and resource strip sit beside a selectable live details pane, while Open/Visited/Story Lock text, native buttons, spatial arrow navigation, explicit travel actions, responsive stacking, high contrast, reduced motion, and performance mode keep the map accessible.

Operation Airlock now reads like the other destinations instead of serving as an aggregate debug report. Its heading is followed by a two-sentence authored contract/faction briefing, then Objective and Transit cards plus at most two notable cards for a rival, boss gate, fortification, active wing, route condition, or unusual flight profile. Raw waves, faction ledgers, command strings, crew records, fleet state, apex traces, and operational-node dumps stay in their dedicated destinations or debug tooling. Shop, Hardpoint Control, Pocket Hangar, Crew Commons, and Signal Vault stay visible and available in ordinary sectors; empty cargo, insufficient tender, absent craft, or an empty crew roster becomes useful detail instead of a hidden menu. Route-shop stops still provide their authored market advantage, while every hub now supplies ordinary carrier market access.

Reward settlement now acquires and stows component salvage before sector transit and no longer forces a foundry scene. The next hub reports recovered hardware and lets the player choose when to open Hardpoint Control. Reopenable foundry completion records only real engineering/socket changes and applies crew/carrier salvage bonuses only when actual scrap value is produced. Fleet Bay and Hardpoint exits return to Navigation with coherent labels. Snapshot v11 persists the current sector's unique visited ids, resets them during mission/sector synchronization, validates them against the fixed destination vocabulary, and retires every v1-v10 run snapshot without touching permanent save data.

Verification: `npm run verify:release` passes with 97 Vitest files and 596 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused navigation/snapshot/sector-loop coverage passes with 3 files and 19 tests; generation sweeps 64 seeds across all four layouts, proves bounded unique connected nodes, explicit-only story locking, visit/reset behavior, and snapshot v11 round-trip/rejection. The main Chromium journey confirms common service availability, authored launch story copy, a strict two-to-four metric-card budget, compact rival and active-wing callouts, reward-to-hub transit, recovered-hardware detail, optional Hardpoint entry, coherent return, persisted Visited state, launch, and no console errors. The refined build emits 909.71 kB minified/247.42 kB gzip initial JavaScript and 59.77/12.52 kB CSS, reducing the WO133 JavaScript result by 1.10/0.35 kB after removing launch-only debug read-model work. The existing initial-chunk warning remains open and no threshold changed. The in-app browser exposed no available target, so the repository Chromium/production-preview passes provide local visual and runtime evidence; direct deployment inspection remains the final visual check.

## Work order 134 - Act constellations and paired sector challenges

Goal: turn the carrier map into a persistent act-scale sector constellation, free common services from route connectivity, and make the chart itself the authority for launch, post-sector continuation, and one optional challenge paired with each sector.

Prompt:

> Retire the approach decision menu and roll its branch selection into the navigation constellation. Replace the per-sector service tree with one deterministic five-sector constellation that remains spatially stable throughout an act and refreshes when the next act begins. Current, completed, newly revealed, and unresolved sectors must read without color; only the next signal and its connecting route should reveal as progress advances. Shop, Hardpoint Control, Fleet Bay, Crew Quarters, and Apex intelligence remain freely selectable local-orbit services but never participate in sector edges. Mid-mission direct and optional approaches should temporarily resolve as connected nodes on the same chart, support inspect-then-commit interaction, and preserve every mission, faction, rival, crew, carrier, boarding, checkpoint, resume, and route consequence. Add bounded deterministic generation, reduced-motion/performance/high-contrast behavior, spatial keyboard/pointer access, browser regressions, project documentation, and release verification.

Refinement:

> Remove the remaining mid-mission approach branch and the second optional lane. After the required sector gate clears, return to the same carrier hub: the cleared sector node offers its paired optional challenge once, while the revealed next-sector node continues the expedition. At act boundaries, provide the same explicit continue action without drawing a false cross-act edge. Keep services available during the choice, preserve deterministic branch consequences and v11 checkpoints, and make fresh sectors execute two required combats plus at most one optional hold.

Acceptance criteria:

- Each act derives one stable seeded five-sector constellation from a named act-specific RNG stream. Its layout, sector coordinates, chart code, and service orbit remain unchanged as sectors advance; the next act uses a newly generated chart.
- Completed, current, revealed-next, and unresolved sectors have explicit text/glyph states. Advancing one sector settles the previous edge, promotes the revealed node, and animates exactly the next node and connection; later sectors remain unidentified.
- Shop, Hardpoint Control, Fleet Bay, Crew Quarters, and Apex intelligence remain visible/selectable under their existing story-lock rules, occupy peripheral local-orbit positions, and are absent from every constellation edge.
- The old branch choice-card grid and mid-mission approach stop are removed. Clearing the required gate returns to the hub, where the current node exposes one optional hold and the revealed next-sector node exposes continuation; no extra approach nodes are added to fresh-run charts.
- Every fresh sector has exactly one paired optional combat after its required gate. Taking it consumes that hold and then rejoins ordinary relief/extraction; declining it cannot make the optional lane recur later in the run.
- Act-final sectors keep the optional hold on the current node and expose an explicit frontier/next-act continuation without inventing an edge between independently seeded act constellations.
- Pointer, Tab, spatial arrows, Enter, high contrast, narrow layout, reduced motion, and performance mode remain valid. Reveal animations settle to their final readable state when motion is disabled.
- Mission/expedition reducers, operational outcomes, route rewards, visit state, and snapshot v11 remain compatible because constellation reveal state is derived from the seeded run plan plus current sector/mission progress rather than persisted separately.

Status: implemented and refined. `ActConstellation` owns four bounded five-node layouts, the act-specific seed stream, stable chart identity, completed/current/revealed/hidden projection, and sequential edge states. `SectorNavigation` composes that chart with five shuffled peripheral service positions; Operation Airlock and the post-sector optional hold are both the current sector itself, while services remain available but never enter the edge list. The chart is stable across all five sectors of an act and regenerated from the next act id at handoff.

`ConstellationMap` is the shared DOM renderer for the carrier hub and mission approaches. It owns semantic node/edge states, SVG route drawing, spatial arrow focus, selection state, accessible labels, pointer behavior, and bounded reveal timing. CSS draws settled, newly resolved, hidden, and choice routes separately; new nodes scale/fade into place, while reduced-motion and performance modes immediately expose the final state. Service nodes are visually peripheral and unconnected without continuous translation, keeping pointer targets stable.

Fresh mission schedules now advance directly from the opening operation to staging and the required gate. Gate completion opens `SectorTransitionScene` in post-sector mode: the current node reads `HOLD ONCE` and launches the single paired pursuit challenge, while the revealed next node reads `CONTINUE` and dispatches the direct branch. Services remain visitable and return to the pending choice. Act-final nodes render continuation as a local action because the next act deliberately receives a new constellation. `OperationalMapScene` initially remained as a non-choice relief confirmation; work order 135 later removes that redundant runtime stop while preserving reducer and checkpoint compatibility. The former early branch/detour stages remain unreachable compatibility definitions so an already-deployed v11 checkpoint can resolve safely into staging instead of being discarded.

The usable per-sector combat path is now advance → staging → required gate → optional hold or continue, reducing fresh schedules from two independent optional branches/four possible combats to one paired optional branch/three possible combats. Existing mission, expedition, faction, rival, crew, carrier, boarding, objective, reward, and operational-ledger events still dispatch through their established reducers. Sector-transition checkpoints now accept the pending post-sector branch, resume directly into the hub, and require no additional persisted reveal state or snapshot version.

Verification: `npm run verify:release` passes with 97 Vitest files and 599 tests, ESLint, typecheck, production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Mission/operational/navigation/snapshot coverage proves a three-operation fresh schedule, one branch/optional stage, post-gate eligibility, boarding-contract adoption by the paired pursuit, direct and optional consequence recording, 90 reachable-node reporting, 15-option capacity, and v11 post-sector checkpoint restoration. Chromium asserts `HOLD ONCE` on the current sector, `CONTINUE` on the revealed next sector, direct and optional launches without an approach menu, service-safe return, command-deck and suspended-run resume, boarding Scenario Lab compatibility, narrow/high-contrast/reduced-motion paths, and the full reward-to-next-sector loop without console errors.

The refined build emits 924.85 kB minified/251.71 kB gzip initial JavaScript and 62.38/12.95 kB CSS, increases of 5.22/1.31 kB JavaScript and 0.26/0.06 kB CSS over the first deployed WO134 result. The structural audit now measures 28.15 minutes standard, 18.50 minutes at Act II extraction, and 32.40 minutes with all 15 executable optional holds; dormant detour compatibility records no longer inflate HUD or audit totals. No simulation hot path, actor pool, RNG stream, dependency, or size threshold changes; the existing initial-chunk warning remains open. The Browser skill catalog still points to an evicted cache version, so Playwright Chromium supplied local visual/runtime evidence at 1280×720 and narrow sizes; direct deployment inspection remains the final visual check.

## Work order 135 - Seamless post-sector extraction handoff

Goal: remove the redundant confirmation screen between a settled post-gate path and route selection, especially after completing the paired optional challenge.

Prompt:

> Eliminate the `Proceed to Extraction` operational-map menu after a post-sector optional challenge. Once combat outcome, rewards, operational cleanup, and the relief checkpoint are settled, advance directly to route selection. Apply the same seamless handoff to the direct continuation path, preserve the earlier staging Command Deck, and retain reducer/snapshot compatibility for deployed v11 checkpoints.

Acceptance criteria:

- Completing the paired optional challenge opens route selection directly; `OperationalMapScene` is not rendered and no extra confirmation is required.
- Choosing `CONTINUE` at the post-sector constellation uses the same direct handoff instead of exposing a path-dependent redundant menu.
- Combat results, objective outcomes, optional salvage, faction/rival/crew/fleet/boarding/apex events, cleanup boundaries, and extraction rewards settle before route selection exactly once.
- The staging Command Deck between the advance and required gate remains explicit and unchanged.
- A deployed v11 operational-map checkpoint at final relief resumes safely by advancing into route selection rather than becoming invalid.
- Pointer, keyboard, snapshot, Scenario Lab, and full reward-to-next-sector browser flows remain valid without console errors.

Status: implemented. `GameApp.showMissionRelief` now distinguishes the authored staging checkpoint from final relief. Staging still opens the Command Deck; final relief dispatches its existing idempotent `completeRelief` event synchronously and enters route selection. Both the direct branch and completed paired hold use this shared path, and restored operational-map relief checkpoints therefore converge on the same behavior without a snapshot schema change. `OperationalMapScene`, the operational ledger, and mission relief/extraction stages remain available as compatibility and data-model boundaries but are no longer bundled into the fresh post-sector presentation.

Verification: focused mission/operational/snapshot coverage passes with 3 files and 25 tests. `npm run verify:release` passes typecheck, ESLint, all 97 Vitest files and 599 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium takes the paired optional challenge and the direct continuation independently, asserts each opens `Choose Route` without rendering `mission-relief`, and completes the existing reward-to-next-sector journey without console errors. The build emits 914.17 kB minified/248.88 kB gzip initial JavaScript and 62.38/12.95 kB CSS. Removing the only fresh runtime import of `OperationalMapScene` reduces initial JavaScript by 10.68/2.83 kB from the deployed work order 134 build; the existing initial-chunk warning remains open and no threshold changed. The in-app Browser skill package remains absent at its catalog path, so Playwright Chromium supplied the local functional and transition evidence.

## Work order 136 - Embedded constellation route plotting

Goal: retire the separate route-choice screen and make the constellation's revealed destination the single place where the player chooses how to travel from the completed sector into the next mission.

Prompt:

> Remove the standalone `Choose Route` menu while preserving all three deterministic route options and their existing economy, combat, faction, shop, reward, and progression effects. After the player commits away from the cleared sector, keep the act constellation visible, mark the source as departed, highlight the connecting edge, select the next sector, and place compact route choices inside that sector's intro detail. Present the next mission story/objective once and remove repeated campaign, seed, ledger, and debug paragraphs from each route. Preserve services, keyboard/pointer access, act boundaries, final extraction, reduced motion, high contrast, route rewards, and snapshot v11 recovery.

Acceptance criteria:

- Neither direct continuation nor completion of the paired optional hold opens `RouteScene`; both select the revealed destination in `SectorTransitionScene` route mode.
- The completed sector reads `DEPARTED`, the destination reads `CHOOSE ROUTE`, and their existing constellation edge becomes the active choice edge without adding a false cross-act connection.
- The destination detail presents a brief next-mission story, one source-to-destination label, one objective label, and exactly the source sector's three route options.
- Each route card keeps its authored name, risk, reward intent, and at most two exceptional pressure/yield/terrain/intel notes. Campaign ledgers, seed exchanges, crew manifests, and repeated next-mission paragraphs are absent.
- Choosing a route still applies its outcome against the completed source sector before the existing route event or shop and reward scenes; component salvage, route history, next-sector modifiers, act junctions, frontier choice, and victory remain unchanged.
- Carrier services remain selectable while the route plot is pending and return to the same plot. Pointer, Tab, spatial arrows, Enter, narrow layout, high contrast, reduced motion, and performance mode remain valid.
- Snapshot v11 remains authoritative. The existing `operationalMap` target accepts the extraction-stage route plot and restores directly into it without replaying route outcomes or requiring a schema migration.

Status: implemented. `src/game/RouteNavigation.ts` is the deterministic compact read-model boundary for the completed-sector edge, next contract/objective, risk bands, and bounded route notes. `SectorTransitionScene` adds an explicit route mode: it selects the revealed sector, changes the source and destination states to `DEPARTED` and `CHOOSE ROUTE`, promotes their edge to choice styling, and renders three compact native route buttons in the ordinary destination detail. Same-act routes use the revealed node; act/finale routes reuse the current boundary node rather than drawing across independently seeded constellations.

`GameApp.showRouteChoice` now composes that mode instead of importing `RouteScene`. Shop, Hardpoint Control, Fleet Bay, Crew Quarters, and Apex callbacks return to the pending route plot. Route selection still calls the existing `handleRouteChoice`, so outcome generation, source-sector hooks, shops/events, rewards, component acquisition, extraction completion, sector advancement, act junctions, frontier decisions, and summaries retain their established order. Extraction-stage plots checkpoint under the already-versioned `operationalMap` target; restore recognizes that stage and reconstructs the embedded plot without new persisted fields.

Verification: focused route-navigation, sector-navigation, route-event, mission, and snapshot coverage passes with 5 files and 38 tests. `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 602 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium covers both the optional and direct route entries, confirms no `Choose Route` heading or `mission-relief` scene, asserts one next-mission brief, three compact route cards, source/destination/edge labels, absence of campaign/seed dumps, shop and reward settlement, the next-sector briefing, narrow/high-contrast/reduced-motion flows, and no console errors. A clean 1280×720 capture was inspected directly; the full plot and all choices fit without scrolling or overlap. The build emits 916.14 kB minified/249.61 kB gzip initial JavaScript and 63.07/13.06 kB CSS, increases of 1.97/0.73 kB JavaScript and 0.69/0.11 kB CSS over work order 135 after removing the old route-scene import. The existing initial-chunk warning remains open and no threshold changed. The Browser skill package remains absent at its catalog path, so Playwright Chromium supplied visual/runtime evidence.

## Work order 137 - Unknown future signals and active-sector pulse

Goal: preserve discovery by keeping every future sector anonymous until it becomes an actionable destination, while making active sector choices easy to find without adding UI noise.

Prompt:

> Remove the passive `REVEALED` sector state. During an ordinary sector hub, every later sector and untraveled edge remains unresolved and anonymous. Resolve the next sector's identity and connecting edge only when the post-sector constellation actually offers it as `CONTINUE`, then keep it resolved through embedded route selection. Give current and actionable choice sectors a gentle pulse that never applies to services or hidden nodes and becomes static under reduced-motion or performance settings.

Acceptance criteria:

- `ActConstellation` no longer emits a `revealed` node or edge status. The current sector is named; every future sector reads `Unknown / UNRESOLVED`, is disabled, and keeps its edge hidden.
- Post-sector continuation resolves exactly the next same-act sector's real name, short label, glyph, and connecting edge when that node becomes selectable. Later sectors remain anonymous.
- The embedded route plot retains the resolved target as `CHOOSE ROUTE`; act-boundary and terminal choices still avoid false cross-act edges.
- Current launch sectors and actionable post-sector/route-choice sector nodes receive a restrained pulse ring. Completed, hidden, and service nodes do not pulse.
- The pulse does not translate the button or alter its pointer/focus geometry. Reduced-motion and performance modes replace it with a static ring; high contrast and keyboard/pointer behavior remain intact.
- Visibility remains derived from seeded act geometry plus current mission presentation. No RNG stream, snapshot field/version, route consequence, service rule, or simulation path changes.

Status: implemented. `ActConstellation` now projects only completed, current, and hidden base-sector states; all future nodes retain anonymous labels and all untraveled edges remain hidden. `SectorTransitionScene` is the sole presentation boundary that resolves an onward node: post-sector and route modes recover its immutable generated sector identity, promote it to `choice`, and promote only the matching current-to-target edge. The existing cross-act null-target fallback is unchanged.

`ConstellationMap` continues to expose native button state and semantic data attributes. CSS adds a pseudo-element pulse to sector nodes in `current` or `choice` state, leaving the button transform and hit area fixed. The 3.2-second opacity/glow cycle is disabled under reduced motion and performance mode in favor of a static outline. The former revealed-node/edge selectors and player-facing revealed-route copy are removed.

Verification: focused constellation/route coverage passes with 2 files and 8 tests. `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 602 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium proves four anonymous disabled future sectors at the opening hub, no `revealed` state, a pulse on the current node, exact S2 identity and edge resolution only when `CONTINUE` opens, two pulsing post-sector sector choices, embedded route continuation, and no console errors. Direct 1280×720 captures of the ordinary and post-sector hubs confirm later signals stay anonymous and the pulse ring does not disturb node layout. The build emits 916.13 kB minified/249.62 kB gzip initial JavaScript and 64.05/13.24 kB CSS. Relative to work order 136, JavaScript is effectively flat (-0.01/+0.01 kB) and the accessible pulse/visibility styling adds 0.98/0.18 kB CSS. The existing initial-chunk warning remains open and no threshold changed. The in-app Browser skill package remains absent at its catalog path, so repository Playwright Chromium supplied visual/runtime evidence.

## Work order 138 - Flat post-sector flight board

Goal: remove the artificial commitment and duplicate-hub steps while keeping the cleared sector's optional hold and the next sector's route choices spatially distinct.

Prompt:

> When a required sector is cleared, make both the cleared sector and the next sector use the established beige ready treatment, pulse gently, and become immediately actionable. Keep the optional hold exclusively in the cleared sector's detail and the three onward routes exclusively in the next sector's detail. Label the optional sector node `OPTIONAL` whether its challenge is available or settled. Remove the intermediate `CONTINUE` action. Choosing a route should settle travel and begin the next sector without reopening the constellation for a second Begin Operation step; choosing the optional should enter that combat and return to the three-route plot when resolved.

Acceptance criteria:

- The first post-sector constellation view exposes two separate actionable sector nodes: the cleared node reads `OPTIONAL`, and the resolved next node reads `CHOOSE ROUTE`.
- Both decision-time sector nodes use the same established beige ready treatment and gentle pulse, with selection expressed only as a stronger beige focus/glow. Later sectors remain anonymous and inert.
- Selecting the cleared node shows only its optional action; no route card appears there. Selecting the next node shows exactly three generated route actions; the optional action does not appear there.
- No `CONTINUE` node/action or separate relief/route menu interrupts the direct route path. Selecting an onward route synchronously settles the existing default branch and relief stages before invoking the established route outcome sequence.
- Selecting the optional hold retains its existing availability guard, faction/expedition recording, combat, reward, and recovery behavior. After that operation, the next-sector detail presents the normal three-route-only plot.
- After a same-act route event/shop and reward settle, the established mission briefing and entry reducer events fire automatically and combat begins in the next sector. The constellation does not reopen for a second visit.
- Each selected-node detail fits the 1280×720 pane without internal scrolling; common services remain available before departure.
- Seed generation, route rewards/consequences, services, snapshots, mission schema, and simulation behavior remain unchanged.

Status: implemented. `GameApp.showMissionBranch` separates branch commitment from scene routing. The optional node still uses the authored optional branch, while each next-sector route commits the authored default branch, settles its relief stage, and enters the existing `handleRouteChoice` pipeline in one input. Rival and expedition records therefore retain their prior ordering, and optional completion still returns to the extraction-stage route plot.

`SectorTransitionScene` composes `postSectorChoice` and `routeChoice` simultaneously but renders their actions only in their owning nodes. It labels the cleared node `OPTIONAL`, promotes the resolved target directly to `CHOOSE ROUTE`, and defaults selection to the target's three-route detail. Selecting the source replaces that detail with the single optional action. Both nodes share the established beige border, background, glow, and pulse; route-only recovery and post-optional states retain the established target-only presentation.

Verification: focused mission, route-navigation, sector-navigation, and snapshot coverage passes with 4 files and 28 tests. `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 602 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium covers both the direct multi-sector helper and optional path, asserting two beige pulsing sector choices, the `OPTIONAL` sublabel, mutually exclusive node-owned actions, no `CONTINUE` action, the three-route post-optional state, and direct next-sector combat without a second briefing hub. Unobstructed 1280×720 captures of both selected-node states were inspected directly; each action set fits without overlap or scrolling. The build emits 917.19 kB minified/249.90 kB gzip initial JavaScript and 64.46/13.28 kB CSS, increases of 1.06/0.28 kB JavaScript and 0.41/0.04 kB CSS over work order 137. The existing initial-chunk warning remains open and no threshold changed. The in-app Browser skill package remains absent at its catalog path, so repository Playwright Chromium supplied visual/runtime evidence.

## Work order 139 - Constellation-aligned sector operations

Goal: make every constellation sector correspond to one complete required combat operation followed by one genuinely available local challenge, instead of hiding two serial required combats behind a single sector node.

Prompt:

> Refit the live mission schedule to the constellation cadence: complete sector 1, optionally take sector 1's challenge, choose a route and complete sector 2, optionally take sector 2's challenge, then choose a route into sector 3. A gate sector must be one complete required operation, not an advance operation followed by staging and another required gate. Every completed sector must expose its paired optional challenge without opaque carrier, boarding, faction, or objective-outcome locks. Preserve deterministic generation, bosses, set pieces, objective consequences, route effects, operational cleanup, deployed snapshot recovery, Scenario Lab access, accessibility, and static hosting. Add schedule-wide and browser regressions, update project documents, and run release checks.

Acceptance criteria:

- Briefing and entry launch the sector's full required gate operation directly. Its world uses the complete authored scroll, wave, boss, arena, set-piece, hazard, and objective projection.
- Fresh runs do not visit the legacy advance, approach, detour, staging, or Command Deck stages between constellation nodes. Those stable stage ids remain resolvable only for deployed v11 snapshot and debug-fixture compatibility.
- Completing one required operation returns to the flat flight board with the cleared node's `OPTIONAL` action and the next node's three routes; choosing a route begins the next sector operation through the work order 138 direct-entry path.
- Every generated sector owns exactly one playable paired optional pursuit. Hull checkpoint, carrier capacity, boarding capacity, faction-front state, and partial/failure objective outcomes may shape consequences but do not silently remove the challenge.
- Optional completion settles its existing rewards, campaign effects, operational cleanup, and relief exactly once, then returns to the next-sector route plot.
- Mission readouts and counts describe only fresh executable stages unless recovery is currently inside a compatibility stage. Seed identity, graph identity, snapshot version, route generation, and fixed-step simulation remain unchanged.

Status: implemented. `MissionDirector` now compiles fresh entry directly to the required gate stage, promotes that stage to the full `mission_operation` world profile, and sends every bounded objective outcome to the post-sector branch after recording its established rewards and consequences. The paired pursuit is always structurally selectable; `GameApp` no longer removes it because a secondary carrier, boarding, or faction projection is unavailable. Thus every sector repeats one required operation, one optional local challenge, and one onward route decision.

Advance, approach, detour, and staging definitions remain in each generated schedule under an explicit `compatibilityStageIds` list, and `stagingStageId` still gives Scenario Lab and deployed checkpoints a valid Command Deck target. Fresh operation/relief read models exclude those ids, but fall back to the complete graph while recovering a checkpoint already inside one. Bosses, arenas, set pieces, objectives, hazard sequencing, cleanup, route outcomes, expedition decisions, and snapshot v11 identity keep their existing reducers and stable content keys.

Verification: `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 603 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused schedule coverage walks every generated sector and proves direct gate entry, a full world profile, no compatibility-stage visit, one-combat branch arrival, and one playable optional. Operational, objective, Scenario Lab, snapshot, and browser journeys cover direct continuation, sector-2 optional play, partial outcomes, pursuit pressure on the next real gate, safe suspend/reload, and no Command Deck in the fresh path. Executable-node readouts now exclude compatibility records and project 16.82 minutes standard, 11.08 minutes at Act II extraction, and 21.07 minutes with all paired holds; these remain authored estimates pending a deployed stopwatch. The build emits 916.91 kB minified/249.76 kB gzip initial JavaScript and 64.46/13.28 kB CSS, a 0.28/0.14 kB JavaScript reduction from work order 138. No dependency, simulation cap, RNG stream, snapshot version, or warning threshold changed.

## Work order 140 - Immediate required-sector rewards

Goal: make the reward read as the settlement of the operation just completed by presenting it before the player chooses an optional hold or onward route.

Prompt:

> Move `Choose Reward` to immediately follow each first-pass required sector completion. The selected reward must settle before the flat constellation offers the cleared sector's optional challenge and the next sector's three routes. Optional challenges must not produce a duplicate reward screen, and route events or shops must advance directly into the next required sector after their existing component salvage. Preserve deterministic reward generation, incoming-route and optional-outcome influence, checkpoints, services, accessibility, and deployed snapshot compatibility.

Acceptance criteria:

- Completing a required gate operation enters `Choose Reward` after the sector-exit animation and before `SectorTransitionScene` exposes `OPTIONAL` and `CHOOSE ROUTE`.
- Selecting an item or credits settles exactly once and then checkpoints the ordinary post-sector constellation with the selected result already present in run state.
- Completing the paired optional challenge returns directly to the three-route plot and never opens a second `Choose Reward` for the same sector.
- Choosing a route still resolves its event or shop and deterministic component salvage, then advances directly into the next sector operation without a late reward scene.
- The route used to enter a sector and the previous sector's optional outcome modify that sector's reward when it is eventually cleared. The first sector uses a deterministic neutral sector-clear context.
- Existing route-context reward seeds retain their prior streams; the new neutral context has its own named deterministic stream. Snapshot v11, fixed-step simulation, services, and static-hosting contracts remain unchanged.

Status: implemented. `GameApp` now recognizes the fresh required gate's terminal branch as the reward boundary. `RewardScene` no longer depends on an onward `RouteOption`; it derives the incoming route context from settled history and uses the current zero-based mission index for reward and credit modifiers. Item or credit selection hands off to the flat flight board, whose checkpoint therefore contains the chosen payout before any optional or route commitment.

`RunSession` aligns reward influence with that chronology: the incoming route outcome and the previous sector's optional objective outcome feed the current sector reward, while the current required objective settles immediately. Route shops/events now lead through deterministic component salvage to sector advance without reopening rewards. Optional completion returns straight to the route plot. Existing route reward seed suffixes remain stable, and `sectorClear` owns a separate deterministic suffix for the first operation.

Verification: `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 604 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused reward, route-event, and objective tests cover neutral generation, incoming route influence, and next-sector optional influence. Chromium asserts required sector -> reward -> flat constellation, reward inventory visibility before route commitment, no reward after the optional hold, no reward after the route shop, direct next-sector combat, checkpoint restoration after reward selection, and no console errors. The build emits 917.26 kB minified/249.87 kB gzip initial JavaScript and 64.46/13.28 kB CSS, a 0.35/0.11 kB JavaScript increase over work order 139. No dependency, simulation cap, snapshot version, warning threshold, or established route-context RNG stream changed.

## Work order 141 - Direct Act I refit handoff

Goal: stop presenting a route into an act that has already ended, and make the Act I finale flow directly into the established midpoint refit and Act II.

Prompt:

> After the Act I sector-5 required reward settles, skip the stale Act I constellation and the synthetic Act II route decision. Commit the mission's safe terminal branch and relief automatically, settle extraction without generating a route outcome, shop/event, or route component, advance into Act II, and open the existing midpoint refit. Preserve ordinary within-act route choices, deterministic act handoff detection, campaign settlement, deployed v11 branch/relief/extraction recovery, accessibility, and static hosting.

Acceptance criteria:

- Act I sector 5 follows required operation -> operation reward -> midpoint refit. No post-sector Act I constellation, optional/route plot, route card, route event, or shop appears between those scenes.
- The authored default branch, rival/faction decision recording, relief, extraction, sector advance, carrier transit, and Act I-to-II handoff still settle through their existing reducers exactly once.
- No route outcome, route-history entry, route-conditioned component salvage, or incoming-route reward modifier is invented for the boundary. Act II begins with its existing inter-act choice effects and neutral first-sector reward context.
- Route choices and paired optional holds for ordinary within-act sectors remain unchanged. Act II's explicit frontier choice and final victory flow retain their established behavior.
- A deployed v11 checkpoint at the Act I terminal branch, relief, or extraction stage resumes through the automatic refit handoff instead of reconstructing the stale route plot.
- The public Act II junction fixture reaches the refit through the real Act I extraction boundary, and keyboard, narrow, reduced-motion, high-contrast, save, and Pages contracts remain valid.

Status: implemented. `ActPlan.getInterActHandoffAfterSector` is the explicit deterministic boundary query for a completed sector and its immediate successor. `GameApp.showMissionBranch` uses it before mounting `SectorTransitionScene`; at the Act I terminal branch it commits the authored default option and reuses normal relief handling. `showRouteChoice` performs the same guard for extraction-stage recovery and calls the renamed route-neutral `advanceAfterSectorExtraction`, which advances to sector 6 and opens `InterActJunctionScene` through the existing handoff logic.

Ordinary routes still acquire their deterministic component before calling the shared extraction advance. The Act I boundary creates no `RouteOption`, outcome, shop, component, or RNG draw. The `J` Scenario Lab/debug path now starts at the actual Act I extraction stage and proves the automatic handoff before rendering the refit; snapshot schema v11 and the generated expedition graph remain unchanged.

Verification: `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 604 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused act-junction, mission, and snapshot coverage passes with 3 files and 24 tests; deterministic checks identify only sector 5 as the immediate Act I-to-II handoff. Chromium reaches `Midpoint Refit` through Act I extraction and asserts that no mission briefing, navigation route options, or route cards are mounted. The build emits 917.78 kB minified/250.00 kB gzip initial JavaScript and 64.46/13.28 kB CSS, a 0.52/0.13 kB JavaScript increase over work order 140. No dependency, simulation cap, graph/schema version, snapshot version, CSS, or warning threshold changed.

## Work order 142 - Safe constellation suspension

Goal: let the player leave any constellation decision without abandoning the voyage, then resume at that exact safe decision boundary from the main menu.

Prompt:

> Add an explicit `Suspend & Exit` action to the shared constellation menu. It must checkpoint before returning to the main menu, expose the existing `Resume Expedition` action, and reconstruct the same briefing, post-sector optional/route board, or unresolved route plot without replaying rewards, branches, relief, route outcomes, or combat. Escape should invoke the same action. Preserve snapshot v11, keyboard/pointer accessibility, narrow layouts, failure safety, and static hosting.

Acceptance criteria:

- Every live `SectorTransitionScene` mode exposes one clearly labeled `Suspend & Exit` button; Escape performs the same action because pause has no separate meaning in this non-combat scene.
- Suspension writes the mode's established safe target before leaving. A failed checkpoint leaves the constellation mounted rather than returning to a main menu with no resumable record.
- An initial or ordinary post-sector constellation resumes through `sectorTransition`; an unresolved extraction-stage route plot resumes through `operationalMap`, preserving all pending node actions and three deterministic route choices.
- The main menu identifies the saved constellation boundary and offers existing keyboard/pointer Resume and Discard actions. Resuming does not advance mission state, settle a payout, consume a route, or enter combat.
- The footer action wraps on narrow viewports, remains distinct from destination actions, and introduces no gameplay-loop, generation, RNG, schema, or persistent-state work.

Status: implemented. The shared constellation footer now includes an accessible `Suspend & Exit` control, and its non-combat `back`/`pause` action maps Escape to the same callback. `GameApp.suspendAtConstellation` first requests a successful `RunSnapshotCoordinator` checkpoint and only then returns to `MainMenuScene`, where the established summary, Resume Expedition, and Discard Expedition controls remain authoritative.

Briefing and flat post-sector modes use the existing `sectorTransition` target, while an unresolved route-only plot uses its existing `operationalMap` compatibility target. Resume therefore reprojects the exact current constellation from run/session state: it neither serializes DOM state nor backs up across a reward, optional result, route outcome, branch, or relief transition. Snapshot v11 and permanent save v5 are unchanged.

Verification: `npm run verify:release` passes typecheck, ESLint, all 98 Vitest files and 604 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused Chromium coverage suspends the opening briefing with Escape, resumes it by keyboard, suspends an unresolved three-route plot by pointer, and resumes the same three options with the correct checkpoint copy. The build emits 918.80 kB minified/250.23 kB gzip initial JavaScript and 64.68/13.33 kB CSS, a 1.02/0.23 kB JavaScript and 0.22/0.05 kB CSS increase over work order 141. No dependency, simulation cap, generated plan, RNG stream, permanent-save version, snapshot version, or warning threshold changed.

## Work order 143 - Forking act route constellations

Goal: replace each act's linear five-sector chain with a deterministic Star Fox-style 1-2-3-2-1 route graph that contains nine authored sector nodes but carries the player through exactly five without backtracking.

Prompt:

> Refit act structure, generation, routing, and constellation presentation around a 1-2-3-2-1 directed graph. Each act owns nine total sector nodes arranged across five forward-only layers, while one run path visits exactly one node per layer. Route selection must commit both the destination node and one of its existing three approaches, with legible easier, standard, and harder signals across the graph. Preserve one paired optional challenge per visited sector, direct same-act launch, act convergence/refit/frontier/victory handoffs, deterministic seeds, mission contracts, bosses, set pieces, route effects, rewards, summaries, capacity estimates, suspension, accessibility, and static hosting. Retire incompatible deployed run snapshots safely, add exhaustive graph and route regressions, update project documents, inspect the result, and run release checks.

Acceptance criteria:

- Every act contains nine deterministic nodes in layer widths `1-2-3-2-1`, with forward-only legal edges and no edge that remains in or returns to an earlier layer.
- Every complete legal path contains exactly five unique nodes, reaches the single convergence finale, and can never visit an unchosen sibling later. All nine nodes are reachable across the act's legal paths.
- The entry splits into easier `2A` and harder `2B`; `2A` leads to easier `3A` or standard `3B`, while `2B` leads to standard `3B` or harder `3C`. Every layer-three node then offers easier `4A` and harder `4B`. Selecting a destination next selects one of its three established route approaches and launches it directly after settlement.
- The constellation shows all nine positions while keeping unknown future signals anonymous. Legal destinations share the established beige ready state and pulse; bypassed siblings become readable non-actionable chart history.
- Mission contract position, act-sector readouts, pressure, objective variants, boss gates, set pieces, inter-act handoffs, rewards, summaries, debug distance, and release-duration accounting use route layer or explicit topology rather than raw generated-array position.
- Generation creates 27 sector candidates and 42 intra-act edges but standard/completionist estimates, save records, and victory accounting retain the 15-sector playable voyage. Operational idempotency remains valid across all generated candidates.
- The changed generated plan uses snapshot v12 and safely retires v11 without altering permanent progression. Pointer, Tab, spatial arrows, reduced motion, performance, high contrast, narrow layout, Pages paths, and fixed-step combat remain valid.

Status: implemented. `ActRouteGraph` is the explicit deterministic topology authority: it owns the five layer widths, nine-node act coordinates, 14 legal edges per act, node labels, difficulty signals, transition validation, default audit path, and route queries. Layer three now forms an easy/standard/hard spread with shared `3B`, while the surrounding forks retain clear ranked choices; exhaustive tests enumerate eight legal paths per act, prove five unique forward layers per path, and prove all nine nodes remain reachable.

Run generation now authors nine candidates per act and supplies the shared graph to expedition generation, sector navigation, route outcomes, progression, summaries, pacing, hazards, and release audit. `GameApp` and `SectorTransitionScene` carry an explicit target sector through route cards, shops/events, component salvage, and `advanceSector`, so choosing a sibling commits that node and enters its operation directly. The constellation renders nine nodes, simultaneous legal targets, completed/choice/hidden/bypassed states, and seeded destination difficulty copy; route-layer context keeps player-facing act progress at 1/5 through 5/5.

Constellation history now projects canonical target sectors from route outcomes and explicit history destinations rather than reinterpreting human-numbered source sectors as zero-based targets. A committed hard path therefore remains `1A -> 2B -> 3C -> 4B -> 5A` on every later chart, while `2A`, `3B`, and `4A` remain bypassed and unreachable `3A` stays unresolved. History without explicit targets retains a compatibility fallback for pre-fix snapshots.

Mission contracts now select from `actSectorIndex` rather than storage order, keeping convergence nodes on their authored finale objectives. Generated set pieces likewise use semantic act/node roles: the opening Hecaton remains on the Act I entry, Bloom Spindle occupies Act II 3B, and Court Wreck Train remains coupled to the Core Wreck convergence boss. Debug routes and distance summaries follow a legal graph path, early/full victory records remain 10/15 sectors, and expedition/release capacity filters the same five-node canonical path while retaining executable content for every candidate node.

Snapshot v12 retires every pre-topology run snapshot independently of permanent save data. Operational history remains bounded while its idempotency keys scale to the generated graph. Deterministic generation, route conditions, graph validation, mission anthology, objective rewards, act economy/pressure, hazard cleanup, pacing, frontier handoffs, Scenario Lab, summaries, and suspension coverage all exercise topology-aware indices instead of weakening their prior assertions.

Verification: `npm run verify:release` passes typecheck, ESLint, all 99 Vitest files and 609 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Graph regressions enumerate all eight legal paths per act, prove every path visits five unique layers and the shared finale, prove all nine candidates are reachable, assert the shared `2A/2B -> 3B` topology and standard difficulty, reject illegal sibling/backtracking transitions, and preserve deterministic generation. Unit and Chromium coverage commit the full `1A -> 2B -> 3C -> 4B` hard path and verify its exact charted/bypassed history before convergence, alongside direct destination launch, optional holds, Act II/finale summaries, narrow/high-contrast/reduced-motion presentation, and constellation suspension/resume.

The release audit now reports 16.88 minutes for the standard route, 11.08 minutes for early extraction, and 21.13 minutes with optional branches. The build emits 925.31 kB minified/252.46 kB gzip initial JavaScript and 64.97/13.38 kB CSS, a 6.51/2.23 kB JavaScript and 0.29/0.05 kB CSS increase over work order 142. The existing 500 kB chunk notice remains; no dependency or warning threshold changed. The in-app browser plugin was initialized for a manual visual pass, but this session reported an empty available-browser list, so deployed visual inspection remains a follow-up rather than a claimed verification result.

## Work order 144 - Hide empty apex contact banners

Goal: remove the empty apex popover frame from ordinary sectors that have no apex encounter.

Prompt:

> Hide the sector apex information banner whenever the current operation has no apex presentation. Preserve the timed contact banner and HUD apex readout when a real apex encounter is present, without changing apex generation, combat, progression, or disposition behavior.

Acceptance criteria:

- A sector with no apex encounter shows no visible apex contact frame or apex HUD pill.
- The existing apex contact banner remains available for its authored encounter window and retains its text, accessibility live region, contrast treatment, and narrow layout.
- The fix introduces no apex-plan, encounter-state, simulation, RNG, save, snapshot, or content changes.
- Chromium covers the ordinary no-apex gameplay path and the release build remains valid for GitHub Pages.

Status: implemented. `GameplayScene` already assigns the native `hidden` attribute to both apex surfaces when no encounter presentation exists. The contact banner's authored `display: grid` rule overrode the browser's native hidden presentation and exposed its empty bordered frame; the explicit `.apex-contact-banner[hidden]` rule now restores `display: none` without altering the active banner lifecycle.

Verification: `npm run verify:release` passes typecheck, ESLint, all 99 Vitest files and 609 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium verifies both apex surfaces are hidden during an ordinary encounter-free opening sector and that an authored Grave Choir ambush still presents its populated apex contact banner. The build emits 925.31 kB minified/252.47 kB gzip initial JavaScript and 65.01/13.39 kB CSS, effectively unchanged JavaScript and a 0.04/0.01 kB CSS increase over work order 143. The existing 500 kB chunk notice remains; no dependency, gameplay state, generated plan, RNG stream, save/snapshot version, or warning threshold changed.

## Work order 145 - Ship-level ordered signal circuit

Goal: make the ordered upgrade circuit a legible, central build-crafting system without requiring players to manage item placement across every individual component card.

Prompt:

> Reimagine Hardpoint Control around one ship-level Noita-like upgrade circuit. Installed components should extend and characterize the circuit, while the player directly chooses which owned upgrades are live and in what order. Make append, eject, reorder, capacity growth, compatibility, cumulative transformation, and final weapon behavior easy to understand from one screen. Preserve real order-dependent hooks, deterministic reconciliation, engineering undo/skip/commit, component replacement, inactive inventory, snapshots, accessibility, bounded preview work, and static hosting.

Acceptance criteria:

- Hardpoint Control presents one numbered processing rail from core to weapon, not item-placement selectors and occupancy strips repeated across component cards. Live stages support direct earlier, later, and eject actions; inactive items support one append action with a visible reason when capacity or compatibility blocks it.
- Installed components remain the source of limited typed capacity, but expose that role as compact `+capacity / channel` extensions. Physical conduit assignment is automatic, deterministic, and separate from the player's explicit logical order.
- Engineering removal or replacement reroutes the live chain across compatible remaining conduits when possible, preserves deliberate rack choices, and drops items only when the new component graph cannot legally power the full chain. Undo, skip, commit, summaries, and snapshot validation preserve the resulting order.
- The circuit previews cumulative cause and effect per stage on a representative complete firing cycle, including projectile-count, total-impact, and added-tag changes. Reordering immediately rebuilds both the stage readout and the existing production-projectile live-fire simulation.
- Pointer and keyboard controls, disabled-state explanations, high contrast, reduced motion, performance mode, a 390x700 layout, route/shop/reward/gameplay hook consumers, deterministic generation, actor/proc budgets, save data, and GitHub Pages behavior remain valid.

Status: implemented. `ItemSockets` now treats component and socket coordinates as internal conduit routing while preserving `circuitOrder` as the independent player-authored execution sequence. Append chooses a compatible native conduit before flex capacity, earlier/later swaps only logical order, and component graph changes invoke a deterministic bounded augmenting-path rematch across installed capacity. Fully valid stored routes round-trip exactly; deliberate rack choices remain inactive; malformed, duplicate, ghost, incompatible, or ambiguous snapshot assignments still fail exact reconciliation without changing the snapshot-v12 shape.

Hardpoint Control moves the circuit ahead of component inventory and replaces six component-local occupancy rows plus per-item move/swap selectors with one responsive rail. Component cards and extension chips show how installed hardware contributes capacity and channel character. Each live node exposes its position, hook domain, effect, cumulative representative-volley output, added projectile tags, and earlier/later/eject controls; open nodes show remaining growth room, and the rack offers one append action with a visible blocked reason. `FoundryPresentation` derives every stage from cumulative prefixes of the same module/item hooks used by combat, while the existing live-fire pane continues to render actual production projectile blueprints after every edit. Run summaries translate sparse internal order values back into contiguous player-facing circuit positions.

Verification: `npm run verify:release` passes typecheck, ESLint, all 99 Vitest files and 610 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused socket/hook/foundry/snapshot coverage passes with 4 files and 39 tests. Chromium exercises the real post-sector Hardpoint Control at 390x700, verifies three component extensions, four live/two open nodes, cumulative output, reorder, eject, append, undo, no horizontal document overflow, return to navigation, and no console errors. The build emits 931.12 kB minified/254.01 kB gzip initial JavaScript and 67.84/13.90 kB CSS, increases of 5.81/1.54 kB and 2.83/0.51 kB over work order 144. The existing 500 kB chunk notice remains; no dependency, RNG stream, save schema, snapshot shape/version, proc budget, or warning threshold changed. The in-app browser runtime again reported no available target after its prescribed connection check, so no manual in-app screenshot is claimed.

## Work order 146 - Destination-owned route effects

Goal: make the constellation destination itself carry the route consequence, eliminating the secondary trio of approach choices.

Prompt:

> Replace the three route cards shown after selecting a destination with one deterministic base route effect owned by that destination node. Select the effect from the destination's existing authored candidates, keep shared nodes invariant across legal parents, bias easier nodes toward safer effects and harder nodes toward severe effects, and present the destination, mission, difficulty, risk, and consequence as one comparison. Commit the node and its effect together through the established route pipeline. Preserve optional holds, direct sector entry, shops/events, rewards, route-conditioned combat and components, suspension/resume, accessibility, deterministic generation, snapshots, and static hosting.

Acceptance criteria:

- Every ready destination names its difficulty and base effect. Selecting it opens one bounded effect dossier and one commit action; no three-card route choice remains.
- A node's effect comes from that target sector's candidate pool and is keyed only to the run and target. Shared `3B` therefore has the same effect from `2A` and `2B`.
- Easier targets weight low normalized candidate risk, harder targets weight high normalized candidate risk, and standard/convergence targets weight the middle without removing seeded variation.
- Committing the destination retains default-branch and relief settlement, route outcomes, route shops/events, combat/reward modifiers, component salvage, and immediate operation entry exactly once.
- Suspension/resume reconstructs the same effect without persisting a pending presentation choice. Pointer, keyboard, reduced motion, high contrast, narrow layout, deterministic content, release capacity, and GitHub Pages remain valid.

Status: implemented. `RouteNavigation.selectNodeRouteEffect` uses a dedicated target-sector seed stream and normalized risk weighting over each target's existing three authored candidates. Its read model now exposes one base effect rather than the departure sector's trio. Because neither source sector nor presentation state participates in selection, convergent nodes keep one identity from either parent and operational-map restoration regenerates the same result without a snapshot change.

`SectorTransitionScene` annotates each ready constellation node with its difficulty and selected effect, replaces the three interactive route cards with a compact base-effect dossier, and offers one explicit `Commit Destination` action. Existing `GameApp` callbacks receive the selected `RouteOption` unchanged, preserving branch/relief settlement, route outcomes, shops/events, combat and reward modifiers, component salvage, and same-act operation entry. The internal candidate arrays remain available to content validation and debug tooling.

Verification: `npm run verify:release` passes typecheck, ESLint, all 99 Vitest files and 612 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused generation, graph, route-event, and snapshot coverage passes with 5 files and 30 tests. Route-navigation regressions prove deterministic destination ownership, parent-invariant shared `3B`, no invented finale effect, and a 256-seed easy/hard normalized-risk separation. Chromium verifies one visible effect and commit action, absence of the old route cards, effect labeling on the node, optional completion, exact effect reconstruction after suspend/resume, carrier-service return, route settlement, narrow/high-contrast hard-node travel, direct operation entry, and no console errors.

The build emits 932.12 kB minified/254.39 kB gzip initial JavaScript and 68.09/13.93 kB CSS, increases of 1.00/0.38 kB JavaScript and 0.25/0.03 kB CSS over work order 145. The selector evaluates three bounded candidates only when a route read model is projected, and the DOM replaces three buttons with one dossier plus one commit button. The existing 500 kB chunk notice remains; no dependency, combat budget, route outcome schema, save/snapshot version, or warning threshold changed. Repository Playwright Chromium supplied runtime/layout evidence; no separate manual screenshot is claimed.

## Work order 147 - Distilled full-browser run debrief

Goal: replace the arena-width run ledger with a readable closeout that preserves the run's identity without making long voyages harder to summarize than short ones.

Prompt:

> Rebuild Run Summary as a full-browser debrief. Lead with outcome, location, route, final ship, circuit identity, defining upgrades and turns, a small set of performance totals, and permanent recovery. Keep every player-facing collection bounded so a long run cannot print engineering, mission, hazard, faction, crew, fleet, apex, or timeline debug histories into an ever-growing definition list. Retain seed sharing, archive progress, outcome variants, deterministic route truth, keyboard/pointer access, responsive layouts, and static hosting.

Acceptance criteria:

- Desktop closeout uses the browser presentation plane rather than the 520px combat-arena width and fits its complete ordinary debrief at 1280x720 without an internal scrollbar.
- Exactly six stable totals replace the raw stat ledger. Final ship, current route node, act-layer progress, circuit identity, and archive settlement remain visible.
- The flight path derives from recorded destination nodes and the explicit `1-2-3-2-1` graph, preserving hard/shared historic nodes and direct act handoffs.
- At most three defining upgrades and three defining turns render. Extra upgrades collapse to a count; unlocks collapse to two names plus a count; long highlight copy is normalized and capped.
- Full engineering, mission, objective, campaign, carrier, boarding, apex, faction-front, crew, fleet, pacing, hazard, economy, and timeline debug strings do not enter the player-facing DOM.
- Victory, destruction, debug, sector-complete, and abandon labels; permanent recovery; seed sharing; Back to Menu; high contrast; responsive narrow layouts; and summary diagnostics remain valid.

Status: implemented. `RunDebrief` is a pure bounded projection over the authoritative run, route graph, result, engineering state, items, refits, and save update. It derives exact current node/layer and prior-act completion without treating candidate-sector array adjacency or absent inter-act route records as progress. Metrics, route acts, highlights, selected upgrades, circuit identity, and copy lengths all have fixed output bounds.

`RunSummaryScene` now composes a wide outcome header, six-card metric strip, two-column final-build/flight-path/upgrades/turns workspace, compact archive recovery, and low-emphasis seed/menu footer. The old forty-plus-row debug definition list and unlimited item grid are removed. Full underlying histories remain available to save state and debug projections but are not formatted into the closeout.

Verification: focused debrief, summary-label, and archive-progress coverage passes with 3 files and 16 tests. A deterministic hard-path fixture proves `1A-2B-3C-4B-5A`, three-upgrade/three-highlight caps, copy truncation, and exact 5/10/15-sector act-boundary accounting. `npm run verify:release` passes typecheck, ESLint, all 100 Vitest files and 615 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Chromium exercises the real destroyed-run closeout at 1280x720, verifies a panel wider than 900px, six totals, final loadout, route path, bounded cards, absent `Engineering History`, archive recovery, seed copy, Back to Menu, and `scrollHeight <= clientHeight`; Act II debug and early-extraction victory paths assert their new topology-aware summaries. The inspected capture is fully visible without summary scrolling.

The build emits 926.14 kB minified/252.63 kB gzip initial JavaScript and 72.73/14.78 kB CSS. Relative to work order 146, removing the large runtime formatter surface from `RunSummaryScene` reduces JavaScript by 5.98/1.76 kB, while the full-browser responsive debrief adds 4.64/0.85 kB CSS. The existing 500 kB chunk notice remains; no dependency, RNG stream, gameplay system, save schema, snapshot version, or warning threshold changed.

## Work order 148 - Direct Act II frontier handoff

Goal: make the Core Descent convergence close Act II cleanly, matching Act I's terminal-sector structure and eliminating the terminal optional/empty-route soft lock.

Prompt:

> After the required Act II convergence sector and its reward, skip the paired optional challenge and ordinary same-act route presentation. Settle the authored default branch, relief, and extraction once, then open the existing extraction-or-Act-III frontier decision. Treat restored Act II extraction checkpoints the same way so a run that completed the previously exposed terminal optional cannot resume into a constellation with no onward node.

Acceptance criteria:

- Claiming the required Act II sector-5 reward opens `The Frontier Is Optional` directly; no Act II optional node, destination effect, or route commit is presented.
- The established extraction choice still ends the run as a complete Act II victory, while breach still advances into Act III with its frontier state intact.
- Act I's direct midpoint-refit handoff remains unchanged, ordinary same-act sectors retain their paired optional and destination choice, and Act III's final victory remains outside this boundary rule.
- A current snapshot restored at Act II's branch or extraction stage follows the default terminal path into the frontier decision instead of rendering a zero-child route plot.
- Mission settlement, reward timing, route history, deterministic generation, save data, snapshot v12, accessibility, and static hosting remain unchanged.

Status: implemented. `ActPlan.getActBoundaryHandoffAfterSector` now classifies the two player-facing terminal transitions from immutable act plans: Act I's inter-act junction and Act II's frontier choice. `GameApp.showMissionBranch` uses that shared projection to commit the terminal default branch before any optional constellation is rendered, and `showRouteChoice` uses it again as a recovery seam before any destination read model is constructed. The existing extraction reducer remains authoritative: it opens `FrontierGateScene` for an unresolved Act II decision, preserves extraction and breach outcomes, and continues to own the Act I refit and Act III entry paths.

Verification: focused act-boundary, frontier, and snapshot coverage passes with 3 files and 20 tests. The regression fixture restores the exact legacy shape produced after an Act II terminal optional and proves it remains a valid extraction checkpoint classified for the frontier choice. Chromium completes The Core Wreck through its real debug combat settlement, claims the required reward, and observes the frontier decision with no optional destination or route-effect dossier. `npm run verify:release` passes typecheck, ESLint, all 100 Vitest files and 617 tests, the production build, all 13 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 926.27 kB minified/252.68 kB gzip initial JavaScript and 72.73/14.78 kB CSS, effectively unchanged from work order 147. The existing 500 kB chunk notice remains; no dependency, content RNG, mission schema, save/snapshot version, or warning threshold changed. The in-app browser runtime reported no available browser targets after its prescribed discovery check, so repository Playwright Chromium supplied the player-flow evidence and no separate in-app capture is claimed.

## Review subagent prompt

Use after a feature PR:

> Spawn subagents to review this branch versus main. Use one subagent each for: bugs, deterministic seed integrity, performance/readability, accessibility, and code maintainability. Wait for all results, then summarize required fixes versus optional improvements.
