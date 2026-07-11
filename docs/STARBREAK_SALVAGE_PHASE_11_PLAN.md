# Starbreak Salvage - Phase 11 Plan

## Starting Evidence

Phase 10 is complete as the first expedition-depth and shipcraft playtest candidate. A deployed all-optional-path run now takes about 12 minutes, double the roughly six-minute Phase 9 baseline. The additional time comes from executable mission stages, optional consequences, foundry decisions, set pieces, faction/rival state, and crew rather than global slowdown or hull inflation.

That reaches the lower edge of Phase 10's 12-20 minute structural target, but it still feels like a chain of operations rather than a dangerous voyage. Phase 11 should expand the spaces between fights, make the generated graph genuinely navigable, let the world and crew evolve over a longer run, and create reasons to continue past the current finale.

## Product Goal

Turn the expedition into a resumable deep-space campaign. A standard successful voyage should support roughly 20-30 minutes of meaningful play, while a completionist or high-risk route can reach roughly 30-45 minutes. A player who wants a shorter session should be able to extract after a major act boundary instead of abandoning the run.

These are structural capacity targets, not balance gates. Time must come from new decisions, modes, authored-from-data situations, and evolving state—not repeated waves, empty travel, inflated health, or mandatory menus.

## Phase 11 Pillars

1. **Long runs must be resumable** - closing the tab should not be the dominant threat in a 30-minute campaign.
2. **The graph becomes the game** - multiple operations, frontier choices, retreats, and pursuit paths must execute rather than exist only as projected capacity.
3. **Combat has meaningful surroundings** - carrier staging, salvage boarding, territory fronts, and crew assignments create play between arena encounters.
4. **The world remembers** - factions, rivals, crew, claimed assets, and roaming threats visibly reshape later nodes and endings.
5. **Builds extend beyond one ship** - support craft, carrier facilities, crew posts, and recovered technology create new build spaces without simple permanent-stat inflation.
6. **Architecture grows with ambition** - deterministic snapshots, replay/endurance harnesses, code splitting, and smaller domain boundaries must precede another phase of integration pressure.

## Duration Contract

- Preserve the deployed Phase 10 measurement as the compatibility floor: about 12 minutes when all current optional paths are taken.
- Target 20-30 minutes for a standard Phase 11 victory that enters the frontier.
- Target 30-45 minutes for completionist routes that pursue boarding contracts, crew arcs, faction fronts, and apex hunts.
- Offer a clearly explained Act II extraction/cash-out so shorter play remains legitimate.
- Record measured active play, decision time, staging time, and paused time separately in local debug summaries. Do not add telemetry.
- Never extend duration through global speed reduction, repeated filler schedules, or blanket enemy durability.

## Work-Order Sequence

### P11.1 - Expedition Kernel And Endurance Tooling

Work order 101 establishes a safe foundation for longer runs:

- extract phase-sized routing/setup responsibilities from `GameApp`, `GameplayScene`, and `CombatState` into explicit domain coordinators;
- add versioned run snapshots for suspend/resume using generated-plan identity plus compact runtime decisions and checkpoints;
- add deterministic replay/endurance fixtures that can simulate mission transitions, cleanup, save/restore, and long histories without browser-private state;
- lazy-load debug and low-frequency DOM surfaces where practical, with a measured bundle report rather than a cosmetic warning-limit increase.

Exit criteria:

- Suspend/resume reproduces the same graph, build, economy, faction, rival, crew, mission, and timeline state.
- Snapshot corruption or version drift fails safely without damaging permanent save data.
- Long-run cleanup/replay tests can cross every current Phase 10 boundary repeatedly.
- New phase systems have a defined integration boundary that does not add another orchestration block directly to `GameApp` or the combat hot loop.

Status: implemented by work order 101. `RunSnapshot` owns a 512 KiB-capped v1 record separate from permanent save v5, regenerates and verifies plan/graph/contract identity before restore, validates mission, engineering, faction/rival, crew, item, economy, and bounded timeline state, removes corrupt or unsupported records without touching progression, and reserves null carrier/boarding/front/fleet/apex slots. `RunSnapshotCoordinator` is the app-facing checkpoint/restore/clear seam. Safe briefing and operation-entry checkpoints are automatic; pause exposes explicit suspend, and the main menu exposes keyboard/pointer resume or discard with clear operation-restart copy. `ExpeditionEndurance` deterministically repeats all eight public Scenario Lab boundaries plus the finale checkpoint through snapshot regeneration for up to 32 cycles. Scenario Lab setup and timeline UI now load as three debug-only chunks totaling 9.80 kB minified. The initial bundle is 663.24 kB because snapshot/resume is core functionality; deeper extraction remains Phase 11 architecture work rather than a hidden warning.

### P11.2 - True Multi-Operation Sectors

Work order 102 makes expedition topology executable:

- sectors contain a navigable itinerary of two to four operations, including required gates, optional detours, relief nodes, pursuit nodes, and retreat/extraction exits;
- node choices carry world checkpoints and explicit cleanup into later operations;
- route intel previews time, pressure, reward, faction, crew, and ship risks without revealing exact outcomes.

Exit criteria:

- Same seed plus snapshot/decision history reproduces the same itinerary and outcomes.
- Optional nodes materially change later operations instead of only adding rewards.
- Stage cleanup cannot retain invisible actors, projectiles, hooks, or duplicated payouts.

Status: implemented by work order 102. Expedition graph schema v2 generates seven explicit nodes per current sector: ingress, required advance, optional detour, staging, required gate, optional pursuit, and extraction, with two independently replayable branch decisions. Mission schedule v2 executes two required combat worlds and up to two optional worlds while carrying hull, build, economy, objective, faction/rival, crew, engineering, and scroll checkpoints. Successful detours reduce gate length/wave pressure; successful pursuits grant one-shot salvage and raise the next sector's advance pressure. `OperationalMap` owns the bounded idempotent settlement ledger, cleanup contract, consequence projection, validation, and public intel read model; `OperationalMapScene` provides keyboard/pointer cards with coarse time, danger, reward, consequence, and faction/crew/ship risk bands. Snapshot v2 adds settled-map checkpoints and operational validation while safely retiring v1 without touching permanent save v5. The ten-sector graph projects 1458 required-route seconds (24.3 minutes) and 1898 all-optional seconds (31.6 minutes); these are structural estimates awaiting deployed full-run timing.

### P11.3 - Null Frontier Third Act

Work order 103 adds a new frontier beyond the current finale:

- add an Act III region with five new sector families, original backgrounds, environmental rules, mission pools, route contracts, factions hooks, and bosses;
- turn the current Act II finale into a choice between extraction and a dangerous frontier breach;
- generate one of several coherent frontier campaigns rather than a fixed five-sector appendix.

Exit criteria:

- Standard frontier runs reach the 20-30 minute structural band through new content and choices.
- Early extraction remains a complete, rewarded outcome with distinct summary copy.
- Act III content reuses shared generation/combat/save contracts and does not fork a parallel game engine.

Status: implemented by work order 103. Three seed/save-fingerprint-stable campaign variants order five original frontier families and their environmental laws while preserving Horizon Scar as the final anchor. Act III uses the existing expedition graph, mission director, sector conditions, backgrounds, hazards, route/economy, engineering, faction, boss arena, save, summary, timeline, and accessibility contracts. The Act II boundary now offers a complete ten-sector extraction victory or an idempotent state-carrying breach; snapshot v3 persists the choice and safely retires v1/v2. Standard graph capacity is 1,689 seconds (28.15 minutes), with 2,199 seconds (36.65 minutes) when every optional lane is taken.

### P11.4 - Mobile Salvage Carrier

Work order 104 gives the expedition a run-local home:

- recover or contract a mobile carrier with limited facility slots for foundry, medbay, intelligence, hangar, vault, reactor, and faction liaison functions;
- assign crew to posts, repair or upgrade facilities, store bounded cargo, and choose travel posture between operations;
- let carrier damage, debt, heat, and faction access create mission consequences.

Exit criteria:

- Carrier decisions alter later missions, shipcraft, crew recovery, faction routes, and support options.
- Staging remains concise, keyboard/pointer accessible, and snapshot-safe.
- The carrier expands build variety without becoming permanent account-level power.

Status: implemented by work order 104. Three deterministic carrier hull plans fill four limited slots from seven data-validated facility types. A bounded carrier reducer owns facility condition/level/power/crew posts, hull, heat, debt, pursuit, posture, faction access, and capacity-checked cargo through explicit idempotent events. The command deck appears only at the clean required-operation staging checkpoint and permits one optional command action per sector. Public influence read models feed mission-option restrictions, foundry salvage, reward choices/tags, early crew recovery, faction markets, and future support/boarding capacity without touching permanent power. Snapshot v4 stores and validates carrier identity/state and retires v1-v3 safely; the deck is a lazy, narrow/contrast/reduced-motion-compatible DOM scene.

### P11.5 - Boarding And Derelict Incursions

Work order 105 adds a distinct close-quarters operation family:

- board capital ships, stations, wrecks, and derelicts through bounded room/corridor chains;
- support breach, secure, rescue, sabotage, salvage, escort, and timed extraction verbs;
- reuse the player ship's weapons/modules as translated interior tools while preserving original fixed-world collision and objective accounting contracts.

Exit criteria:

- Boarding feels mechanically distinct from vertical travel without introducing an unrelated game.
- Room generation, doors, hazards, targets, loot, and extraction are deterministic and cleanup-safe.
- At least four boarding contracts connect to carrier, crew, faction, foundry, and apex-hunt outcomes.

Status: implemented by work order 105. Six seed/save-stable contracts assign selected detour and pursuit nodes to capital-ship, station, wreck, or derelict incursions. A bounded boarding domain generates four-to-seven-room chains, doors, subsystem rooms, hazards, custody loot, and optional purge clocks, then projects them through the existing ship combat, build, crew, objective, collision, exit, destruction, pause, and operational settlement paths. The interior renderer/readout changes spatial rhythm and names translated ship tools without a second simulation. Success, partial success, failure, death, retreat, and resume are explicit; cleanup retains no actors. Carrier capacity gates access, while settlements can alter carrier cargo, foundry inventory, crew recruitment, faction history, rivals, and future apex hooks. Snapshot/storage v5 and the ninth Scenario Lab card persist and expose the system.

### P11.6 - Dynamic Faction Fronts

Work order 106 turns faction state into map-scale pressure:

- territory, blockades, convoys, distress lanes, markets, and contested set pieces change during the run;
- aid, theft, contracts, spared targets, rival outcomes, and carrier allegiance move explicit front state;
- fronts create or close later itinerary nodes and change ownership, prices, reinforcements, crew offers, and finale support.

Exit criteria:

- The same decisions deterministically reproduce the same front movement.
- Every faction supports at least one alliance, hostility, and opportunist route with readable tradeoffs.
- Front state changes play space and mission structure, not only numeric modifiers or prose.

Status: implemented by work order 106. Seed/save-stable plans place a front in every sector, and a bounded reducer folds aid, theft, contracts, spared targets, rival outcomes, boarding, crew ties, and carrier commands into later-sector movement only. All four factions have data-driven alliance/hostility/opportunist strategies with text/glyph cues. The resulting public influence creates, transforms, or closes reserve detour/pursuit nodes and drives ownership, hazards, reinforcements, support, markets, carrier access, recruits, set pieces, finale pressure, and coalition/siege/fractured ending posture. Snapshot/storage v6, summary/timeline/debug surfaces, endurance budgets, and the tenth Scenario Lab fixture preserve and expose the campaign.

### P11.7 - Crew Bonds And Specialist Arcs

Work order 107 evolves crew into a campaign cast:

- add bonds, conflicts, fears, ambitions, promotions, loyalty missions, paired abilities, and departure/mutiny/rescue arcs;
- connect carrier posts, boarding teams, faction fronts, injuries, rival history, and ship modules to crew decisions;
- keep identities seed-plus-save deterministic and run-local.

Exit criteria:

- At least eight multi-node crew arcs can branch across acts and produce distinct tactical consequences.
- Relationships unlock options and complications rather than unconditional stat growth.
- Summary/timeline copy explains who survived, changed, departed, or took command.

Status: implemented by work order 107. Ten data-driven, seed/save-stable arcs assign five generated crew identities to three explicit outcome gates spanning later sectors. Mission, carrier, boarding, faction, rival, injury, module, command, and rescue events are the only progression sources. Each second gate pauses at an explicit two-way Crew Quarters decision, and resolution owns bounded relationships, rank, fate, succession, history, and processed ids beside the authoritative recruitment/injury roster. Promotion spends additional command headroom; paired cadence costs hull; conflict can exclude one partner; departure and mutiny remove the affected ally. Snapshot/storage v7 validates and resumes arc state while retiring v1-v6 safely. Summaries, timeline/debug readouts, endurance bounds, and an eleventh accessible Scenario Lab fixture expose resolved and waiting arcs.

### P11.8 - Fleetcraft And Deployable Support

Work order 108 expands shipcraft into a small expedition fleet:

- salvage frames and modules into bounded drones, interceptors, salvage skiffs, shield tenders, and boarding pods;
- assign crew or automation, choose launch doctrine, repair losses, and refit support craft at the carrier;
- share projectile, target-query, effect, command, and objective budgets with existing ally systems.

Exit criteria:

- At least five support roles create distinct tactical and itinerary options.
- Fleet loss and recovery matter inside the run without producing mandatory permanent power.
- Combined player/crew/fleet/set-piece pressure stays bounded and Scenario-Lab reproducible.

### P11.9 - Apex Hunts And Divergent Endings

Work order 109 adds campaign-scale adversaries:

- generate roaming apex threats whose traces, lieutenants, damaged subsystems, and escape routes span multiple nodes;
- allow factions, rivals, crew, carrier facilities, boarding actions, and frontier choices to change the final confrontation;
- support capture, destruction, containment, bargain, and evacuation endings where content permits.

Exit criteria:

- At least three apex campaigns have distinct pursuit structures and multi-part finales.
- Prior damage and decisions visibly carry into later encounters without breaking objective accounting.
- Endings resolve deterministic campaign state and widen future variety rather than only granting raw power.

### P11.10 - Voyage Scenario Lab And Release Candidate

Work order 110 closes the phase:

- expand Scenario Lab for snapshots, multi-operation itineraries, frontier sectors, carrier states, boarding, faction fronts, crew arcs, fleetcraft, apex hunts, and combined endurance;
- harden run-snapshot v7 retirement/recovery and permanent-save v5 migration, plus accessibility, performance, browser load, GitHub Pages paths, and release documentation;
- measure fresh/progressed, standard/extraction/completionist run lengths locally and document manual gaps.

Exit criteria:

- `npm run verify:release` and production Pages-path smoke pass.
- A suspended run can resume and complete through at least one frontier ending.
- Debug/browser smoke reaches every Phase 11 system without a full manual voyage.
- Manual non-Chromium, real-device, long-session fatigue, balance, readability, content-volume, and combinatorial fleet risks are explicit.

## Architectural Direction

Phase 11 should introduce explicit boundaries before adding content volume:

```text
generated campaign plan
  -> versioned run snapshot + decision log
  -> expedition coordinator
      -> mission/boarding/carrier/front/apex domain reducers
      -> combat session adapter
  -> public read models
      -> gameplay and DOM scenes
      -> debug/replay/endurance harness
      -> summary and local save
```

- Permanent save data and resumable run snapshots are separate versioned records.
- Snapshots store stable ids, decisions, checkpoints, and compact runtime state—not derived render data.
- Domain reducers do not import DOM, audio, canvas, or `GameApp`.
- Combat adapters translate domain plans into existing fixed-world systems; they do not create a second projectile/collision engine.
- Debug/replay fixtures consume the same public setup and event boundaries as normal play.
- Dynamic imports should isolate low-frequency debug/archive/carrier/summary surfaces only when they produce a measured bundle improvement.

## Known Risks

- Longer runs make snapshot correctness and recovery a product requirement, not optional polish.
- A third act can feel like repetition unless it carries new geography, mission grammar, world rules, and campaign conclusions.
- Carrier, crew, faction, and fleet systems can become menu-heavy; staging decisions must remain short and consequential.
- Boarding can fracture controls and content architecture if it becomes a separate game rather than a translated operation mode.
- World simulation can overwhelm seeded reproducibility unless every transition consumes explicit state and named RNG forks.
- Fleet and ally density can multiply target, collision, projectile, and visual costs; shared budgets remain mandatory.
- The current 657.78 kB main bundle and large integration modules are warnings that Phase 11 cannot keep adding orchestration in place.

## Definition Of Done

Phase 11 is done when a fresh or progressed save can start, suspend, resume, and complete a deterministic 20-30 minute standard voyage; execute true multi-operation sectors; choose extraction or enter the Null Frontier; operate a run-local carrier; experience boarding, faction-front, crew-arc, fleetcraft, and apex-hunt consequences; and reach a divergent ending. A completionist path should have 30-45 minutes of meaningful structural capacity without relying on filler, while shorter extraction remains valid.
