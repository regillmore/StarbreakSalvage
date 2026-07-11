# Starbreak Salvage - Phase 10 Plan

## Current State

Phase 9 is complete as a local second-act playtest candidate. A seeded run can cross ten sectors in two acts, stop at a deterministic midpoint refit, carry its build and economy into Act II, and resolve through a second-act finale. Full checks, 11 Chromium smoke tests, and production preview asset-path smoke pass.

Work orders 091-098 now provide the expedition graph, multi-stage missions and objective anthology, modular shipcraft, salvage engineering, physical set pieces, run-local faction campaigns and rivals, plus recruitable crew and wingmates. Sectors 1, 7, and 10 host a capital ship, station, and wreck convoy assembled from shared subsystem templates. Four faction policies, four seeded recurring captains, and five deterministic crew roles now react through combat, missions, routes, shops, foundry operations, set-piece ownership, and finale outcomes; the Scenario Lab and release hardening remain ahead.

The resulting run currently takes about six minutes in a normal local playthrough. That is useful diagnostic evidence: adding a second act expanded the route model, but it did not yet create enough lived experience inside each sector. Phase 10 should add consequential play and decisions instead of stretching timers, inflating hull, or simply adding a third act.

## Phase 10 Product Goal

Turn the two-act route into a deterministic expedition. Sectors should contain authored-from-data mission chains, optional branches, evolving ship configuration, large physical set pieces, faction consequences, and crew stories. A player should remember what happened during a run, not only which items were rolled.

The first structural duration target is roughly 12-20 minutes for a baseline successful expedition, with room for shorter challenge modes and longer high-risk routes later. This is a content-capacity target, not a balance gate: Phase 10 should earn the extra time through decisions, spectacle, and build transformation.

## Phase 10 Pillars

1. **More game per sector** - sector time grows through multi-stage encounters, optional branches, and set pieces rather than empty travel or health inflation.
2. **Ship as a changing machine** - contracts become extensible frames with hardpoints, power, heat, and modules that can be rebuilt during a run.
3. **Deterministic consequence** - mission choices, refits, faction response, rivals, crew offers, and set-piece variants reproduce from seed plus save state and player decisions.
4. **Physical world scale** - capital ships, stations, wreck interiors, and multi-part targets make the scrolling world feel constructed rather than like a sequence of isolated waves.
5. **Run-specific stories** - factions remember what the player did during the current expedition; rivals and crew turn systemic outcomes into recognizable arcs without requiring a backend or scripted campaign.
6. **Expandable contracts** - mission grammar, ship modules, set-piece components, faction reactions, and crew behaviors live in validated content contracts that later phases can extend safely.
7. **Observable ambition** - scenario tools, timeline records, budgets, accessibility modes, and smoke paths grow alongside the new systems.

## Non-Goals

- Do not add online services, accounts, telemetry, daily-server dependencies, or multiplayer.
- Do not lengthen runs mainly by lowering damage, raising enemy hull, slowing scroll, or repeating existing waves.
- Do not promise bit-perfect combat replay across browsers. Generated content and decision outcomes remain deterministic; transient bullet simulation retains the existing contract.
- Do not make permanent upgrades mandatory for a viable fresh-save expedition.
- Do not block experimentation on final balance, final art, or final narrative polish during this phase.

## Phase 10 Milestones

### P10.1 - Expedition Graph Foundation

Scope:

- Replace the implicit one-sector/one-gameplay-lane assumption with a typed expedition graph made of acts, sectors, mission legs, encounter nodes, optional branches, safe transitions, and finale gates.
- Generate the graph once from seed plus save state, then record player branch decisions separately.
- Give every node stable identity, content references, expected duration/pressure bands, entry/exit rules, reward hooks, and public debug/summary context.

Exit criteria:

- Same seed plus save state produces the same graph; same decisions produce the same visited path and major outcomes.
- Existing ten-sector seeds and older summary/save records migrate or normalize safely.
- A baseline graph has enough encounter capacity for a 12-20 minute run without relying on empty delay.

Status: implemented by work order 091. Seed plus effective unlock/upgrade state now produces an immutable graph of two acts, ten sector plans, 40 stable nodes, 40 mission legs, ten optional branches, and explicit checkpoint/finale gates. Public progress and decision records stay separate from generation; HUD, summaries, debug, and v5 last-run saves consume graph/path read models, with v4 migration coverage. The required-node target is about 16.0 minutes and the all-optional target is about 19.7 minutes. Live gameplay remains on the explicit one-operation-per-sector compatibility projection until work order 092. Full checks pass with 67 test files/389 tests, all 11 Chromium paths pass, and production preview asset-path smoke is green.

### P10.2 - Multi-Stage Mission Runtime

Scope:

- Add a mission director that can enter, advance, branch, suspend, resume, fail, and complete mission legs through explicit state transitions.
- Add objective grammar for assaults, pursuits, escorts, salvage operations, defenses, rescues, scans, sabotage, escapes, and boss approaches.
- Author a first anthology of multi-stage mission contracts using existing enemies, hazards, formations, environment objects, routes, rewards, and bosses.

Exit criteria:

- Frame catchup, simultaneous kills, despawns, secondary item damage, death, pause, abandon, and boss gates cannot skip or soft-lock mission stages.
- Mission transitions preserve build, resources, scroll-world state where intended, and accessible keyboard/pointer focus.
- Mission schedules and branch outcomes have known-seed coverage.

### P10.3 - Modular Ship Frames And Hardpoints

Scope:

- Evolve contracts into ship frames with validated hardpoints, reactor output, mass, cooling, heat routing, armor, shields, mobility, cargo, and command capacity.
- Express primary, secondary, defense, engine, utility, drone, and experimental modules through data rather than contract-specific conditionals.
- Preserve current contracts and weapons through compatibility adapters while the modular model becomes authoritative.

Exit criteria:

- At least three frames support materially different legal configurations and failure pressures.
- Invalid power, slot, tag, uniqueness, and compatibility combinations fail validation.
- Collision, controls, save import, contract previews, HUD, summaries, and seeded starts remain reliable.

### P10.4 - Salvage Engineering And Weapon Evolution

Scope:

- Add deterministic component drops and a mid-run foundry where players can install, scrap, reroute, fuse, and overclock modules.
- Add weapon evolution recipes and bounded affixes that change projectile topology, targeting, heat, economy, defense, or item-hook behavior rather than only multiplying damage.
- Record engineering history so summaries can explain how a starting contract became the final ship.

Exit criteria:

- Same seed, save state, acquired components, and engineering choices reproduce the same module results.
- Foundry choices expose previews, tradeoffs, undo boundaries, controller/keyboard focus, and narrow-view behavior.
- Item hooks and module hooks share explicit ordering and combined proc budgets.

### P10.5 - Capital Ships And Station Set Pieces

Scope:

- Add composable multi-part world actors for capital ships, stations, wreck hulks, convoy structures, and exterior/interior transition beats.
- Support targetable subsystems, armor sections, turrets, hangars, shield emitters, weak points, collision silhouettes, scrolling anchors, and staged destruction.
- Build several mission-set-piece contracts from reusable components instead of one-off scene logic.

Exit criteria:

- Set pieces interact safely with objectives, hazards, formations, bombs, item effects, loose currency, boss locks, and lane constraints.
- Damage and destruction order are deterministic from explicit events and cannot duplicate rewards or strand objectives.
- Performance/reduced-motion modes simplify presentation without changing target geometry or stage timing.

Status: implemented by work order 096. `src/content/setPieces.ts` defines seven reusable component templates and three original assemblies; `src/game/SetPiece.ts` creates stable plans, dependency-gated runtime state, typed one-shot destruction/stage/completion events, fixed-world geometry, safe lanes, bounded formations, boss-lock state, debug jumps, public read models, and validation. Combat routes weapons, specials, bombs, hazards, contact, objective credit, loose currency, turret shots, and hangar launches through the shared actor state. The opening and Act II station contracts lock travel at their anchor until complete, while the final wreck train also gates the existing boss arena. Reduced-motion and performance settings only simplify canvas presentation. Unit/deterministic coverage and all 11 Chromium smoke paths pass.

### P10.6 - Faction Campaigns And Rival Captains

Scope:

- Add a run-local faction campaign director that tracks aid, hostility, stolen assets, spared targets, completed contracts, and territory pressure.
- Generate named rival captains with ships, tactics, injuries, escapes, upgrades, grudges, and possible finale intervention from seeded templates.
- Let route and mission choices alter later encounters, shops, crew offers, set-piece ownership, and finale conditions.

Exit criteria:

- Identical seeds and decision histories reproduce faction state, rival identity, adaptations, appearances, and outcomes.
- Responses are legible in route previews, mission briefings, combat callouts, debug state, and summaries.
- Rival retreat/capture/destruction paths cannot corrupt objective or reward accounting.

Status: implemented by work order 097. `src/content/factionCampaigns.ts` provides four response policies and five reusable rival archetypes. `src/game/FactionCampaign.ts` creates four unique seed-plus-save rival plans and keeps generated identity separate from an idempotent, bounded decision/outcome fold. Aid, theft, mercy, contracts, mission results, encounters, retreats, captures, and destruction drive faction ledgers, injuries, ordered adaptations, grudges, recurrence, terminal rewards, and finale eligibility. The resulting influence changes enemy composition and pressure, shop pricing and bias, route/mission/branch copy, crew-offer signals, set-piece ownership, and finale combat. Rival actors are non-required objective participants, first-appearance retreat and terminal outcomes use centralized combat accounting, and one-shot event/reward guards prevent duplicate progression. HUD/briefing/route/shop/summary/debug surfaces plus the `R` recurrence fixture make the campaign inspectable.

### P10.7 - Crew, Wingmates, And Distress Contracts

Scope:

- Add recruitable crew and wingmates with roles, traits, ship/module fit, command abilities, trust, injury, rescue, departure, and run-summary outcomes.
- Add simple deterministic ally AI plus explicit commands such as focus, screen, salvage, regroup, and disengage.
- Use distress calls and optional mission branches to create acquisition and consequence instead of granting crew from a menu.

Exit criteria:

- Ally movement, targeting, damage attribution, retreat, recovery, and command cooldowns are bounded and objective-safe.
- Crew expands build and mission options without becoming required permanent raw power.
- Accessibility settings provide readable ally/enemy identity, command state, and non-color-only status cues.

Status: implemented by work order 098. `src/content/crew.ts` defines five roles spanning pursuit fire, projectile screening, salvage recovery, regroup repair, and disciplined disengagement. `src/game/CrewCommand.ts` separates immutable seed-plus-save candidate plans from bounded run-local roster history, using mission crew policies, faction distress trust, and resolved loadout command headroom as recruitment gates. Combat deploys at most three fitted allies; target, projectile, and pickup queries are capped, ally attacks share defeat/objective accounting without item-hook duplication, and injury/disengage outcomes remain separate from player damage and enemy escape. Trust, missions, injury, two-sector recovery, departure, foundry assistance, rewards, and finale summaries persist through the run. Focus, screen, salvage, regroup, and disengage are individually remappable and have pointer buttons, HUD/debug readouts, high-contrast glyphs, compact narrow treatment, and the public `T` fixture.

### P10.8 - Expedition Scenario Lab And Release Candidate

Scope:

- Add a local-only Scenario Lab that can launch generated mission nodes, module loadouts, set pieces, rivals, crew, faction states, and combined stress cases without private app-state access.
- Record a bounded local run timeline for node transitions, choices, economy, engineering, faction events, crew events, bosses, duration, and failure reason; do not add telemetry or network calls.
- Harden the complete Phase 10 path for deterministic generation, save migration, accessibility, performance, browser load, GitHub Pages, and release documentation.

Exit criteria:

- `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke pass.
- Debug/browser smoke can reach every new system without playing a full expedition.
- Manual non-Chromium, real-device, run-length, balance, readability, and content-volume gaps are explicit.

## Recommended Work Order Sequence

1. Work order 091 - Expedition graph and run-length contract.
2. Work order 092 - Multi-stage mission director and transitions.
3. Work order 093 - Objective grammar and mission anthology.
4. Work order 094 - Modular ship frames, hardpoints, and power grid.
5. Work order 095 - Salvage foundry and weapon evolution.
6. Work order 096 - Capital ships, stations, and multi-part set pieces.
7. Work order 097 - Faction campaigns and rival captains.
8. Work order 098 - Crew, wingmates, and distress contracts.
9. Work order 099 - Expedition Scenario Lab, accessibility, and performance hardening.
10. Work order 100 - Phase 10 expedition playtest release hardening.

## Architectural Direction

Prefer explicit generated plans and event records over scene-owned branching state:

```text
src/content/expeditions.ts
src/content/missions.ts
src/content/shipModules.ts
src/content/setPieces.ts
src/content/rivals.ts
src/content/crew.ts
src/game/ExpeditionGraph.ts
src/game/MissionDirector.ts
src/game/ShipLoadout.ts
src/game/SalvageEngineering.ts
src/game/SetPieceState.ts
src/game/FactionCampaign.ts
src/game/CrewCommand.ts
src/game/RunTimeline.ts
```

The exact file split may change after repository audit. The dependency rule matters more: content definitions validate independently; generation builds deterministic plans; runtime systems consume plans and emit typed events; UI/debug/summary/save surfaces consume public read models.

## Phase 10 Definition Of Done

Phase 10 is done when a fresh or progressed save can generate a deterministic two-act expedition with multi-stage mission branches, transform a contract through modular salvage engineering, encounter at least one large multi-part set piece, produce run-specific faction/rival and crew consequences, resolve through the existing victory/defeat/abandon paths, and explain the expedition through debug state and a run timeline. The additional play time must come primarily from new play and decisions, not delay or inflated durability.
