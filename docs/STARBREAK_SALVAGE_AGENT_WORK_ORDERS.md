# Starbreak Salvage — Agent Work Orders

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repo first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Work order 001 — Greenfield scaffold

Goal: create the project foundation.

Prompt:

> Read `AGENTS.md` and the seed docs. The repository is greenfield. Create a Vite + TypeScript browser game scaffold for Starbreak Salvage. Add package scripts for `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `format`, and `check`. Add a canvas placeholder page with a title, start button, and static starfield-style background. Add README with local dev commands, controls, and project vision. Add `.github/workflows/ci.yml` to run checks and `.github/workflows/pages.yml` to deploy `dist` to GitHub Pages. Configure the Vite base path for `/StarbreakSalvage/`. Run checks and summarize.

Acceptance criteria:

- `npm run build` succeeds.
- `npm run check` exists.
- Placeholder page loads locally.
- Workflows exist.

## Work order 002 — Loop/input/scenes

Goal: create an interactive shell.

Prompt:

> Implement a fixed-step game loop, canvas renderer, input manager, and scene manager. Add MainMenu, ContractSelect placeholder, Gameplay placeholder, Pause, and RunSummary scenes. Implement keyboard movement in gameplay with a visible player ship constrained to screen bounds. Add debug overlay for FPS, seed, and entity count behind a flag. Add narrow tests for pure loop/input helpers. Run checks.

Acceptance criteria:

- Start run transitions to gameplay.
- Player moves with WASD/arrows.
- Pause opens and closes.
- No console errors.

## Work order 003 — RNG and run skeleton

Goal: deterministic generation.

Prompt:

> Implement seed string parsing, forkable RNG streams, deterministic `choice`, `shuffle`, and `weightedChoice`, plus a run generator that creates three contract choices and a five-sector route skeleton. Add seed labels `LASER-TAX-404`, `ORBITAL-JUNK-PROPHET`, `VOID-CORSAIR-7`, and `STARBREAK-SMOKE` to deterministic tests. Prohibit `Math.random()` in generation. Run checks.

Acceptance criteria:

- Identical seed produces identical run skeleton.
- Different seed varies.
- Tests cover RNG helpers and run generation.

## Work order 004 — Combat MVP

Goal: first fun loop.

Prompt:

> Implement player primary fire, projectile lifecycle, simple enemies, enemy waves, collision, health/damage/death, pickups, and a forced game-over path to RunSummary. Use original shape-based placeholder visuals. Add tests for collision and damage. Keep entity count visible in debug. Run checks.

Acceptance criteria:

- Player can shoot enemies.
- Enemies can damage/kill player.
- Pickups can be collected.
- Summary appears after death.

## Work order 005 — Item hook pipeline

Goal: synergies.

Prompt:

> Implement item definitions with tags, acquisition order, deterministic hook processing, and reward choice generation. Add at least 12 starter items and these synergies: split+arc, missile+overkill, shield+revenge, drone+copy. Add content validation tests for duplicate IDs, invalid tags, invalid item references, and empty reward pools. Run checks.

Acceptance criteria:

- Items visibly alter gameplay.
- Hook order is deterministic.
- Content validation fails on bad fixtures.

## Work order 006 — Sector/reward/shop loop

Goal: roguelike routing.

Prompt:

> Add sector progression, route cards, reward screen, credits, basic shop, rerolls, and sector transition UI. Ensure route cards, rewards, and shop inventory are generated from the run seed. Add deterministic tests for known seeds. Run checks.

Acceptance criteria:

- Completing a wave/sector opens a route or reward choice.
- Shops accept credits and alter build.
- Same seed yields same route/reward/shop sequence.

## Work order 007 — Boss/faction alpha

Goal: enemy variety.

Prompt:

> Add three factions and three bosses with distinct attack patterns and clear telegraphs. Build faction/boss content tables and deterministic sector selection. Add debug shortcuts for directly testing a boss. Add performance notes for projectile counts. Run checks.

Acceptance criteria:

- Three factions are visually and behaviorally distinct.
- Three bosses can be spawned and defeated.
- Boss warnings are readable.

## Work order 008 — Save/unlock progression

Goal: meta loop.

Prompt:

> Implement versioned localStorage save data, unlock definitions, achievements, run summary stats, save reset, export, import, and migration tests. Corrupted saves should fail safely. Add first 10 unlocks from the design docs. Run checks.

Acceptance criteria:

- Unlocks persist across reloads.
- Save import/export works.
- Migration tests pass.

## Work order 009 — Settings/accessibility

Goal: playable by more people.

Prompt:

> Add settings for remappable controls, volume/mute, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode. Ensure settings persist. Add Playwright smoke coverage for opening settings and changing at least one option. Run checks.

Acceptance criteria:

- Settings can be changed from menu/pause.
- Mute and reduced motion work.
- Settings persist after reload.

## Work order 010 — Release hardening

Goal: public-ready v1.

Prompt:

> Audit build, tests, content validation, browser load, asset paths, README, license, credits, changelog, Pages workflow, save behavior, and seed sharing. Fix blockers only. Produce a release checklist with pass/fail status and known issues. Run all checks.

Acceptance criteria:

- Public deployment is playable.
- No severe known blockers.
- Release checklist is complete.

## Phase 2 work orders

Phase 2 work orders continue after the M10 release and first-pass procedural audio/VFX. They assume the game is deployed and playable, but still needs a cohesive complete-run arc. Keep each task focused, preserve deterministic content generation, and update docs/tests with every player-facing change.

## Work order 011 - Phase 2 planning refresh

Goal: close Phase 1 and establish the Phase 2 roadmap.

Prompt:

> Read `AGENTS.md` first. Then read the current project plan, backlog, architecture, QA plan, and release checklist. Conclude Phase 1 in the docs and establish Phase 2 planning: product goal, pillars, milestones, updated backlog, new work orders, architecture notes, QA focus, and README pointers. Do not change gameplay code. Run formatting/checks appropriate for docs-only changes and summarize.

Acceptance criteria:

- Phase 2 plan exists and is linked from README/project docs.
- Work orders 012+ are documented.
- Backlog and QA docs reflect the new direction.

## Work order 012 - Sector objectives and wave director

Goal: replace the one-kill alpha clear with a real sector progression model.

Prompt:

> Implement data-driven sector objectives and a wave director. Replace the temporary one-enemy sector clear with sector progress, wave completion, optional boss gates, and five-sector advancement. Preserve deterministic generation: same seed must reproduce sector objectives, major wave schedule, boss timing, route choices, rewards, and shop inventory. Add tests for objective completion, wave sequencing, boss gate behavior, and known-seed snapshots. Update README/debug notes. Run checks.

Acceptance criteria:

- A normal run can progress through all five sectors without debug shortcuts.
- Sector completion is driven by objective data rather than a hard-coded one-kill threshold.
- Known seeds reproduce objectives and wave schedules.

## Work order 013 - Special, bomb, and graze

Goal: make the full control set real.

Prompt:

> Add special ability, bomb, and graze mechanics. Implement charge/cooldown state, HUD readouts, keyboard input through the existing action abstraction, and readable combat effects. Bomb should cancel or reduce danger without trivializing bosses. Graze should reward near-misses deterministically without using `Math.random()`. Add tests for charge gain, bomb effects, graze detection, remapped controls, and reduced-motion behavior. Run checks.

Acceptance criteria:

- Special and bomb controls visibly affect gameplay.
- Graze grants charge or rewards from near-misses.
- HUD explains special/bomb/graze state.

## Work order 014 - Ship stats and weapon identity

Goal: make contracts mechanically distinct.

Prompt:

> Add explicit ship stats and weapon-family behavior. Ship definitions should affect max hull, speed, hit radius, pickup pull, special charge, bomb capacity, and starting economy where appropriate. Weapon definitions should express cooldown, damage, projectile pattern, heat/reload behavior, and tags. Update content validation so ships cannot reference invalid weapons/stats. Add tests proving at least three contracts produce distinct combat state and that weapon families alter projectiles. Run checks.

Acceptance criteria:

- Contract choice materially changes movement, durability, and weapon feel.
- Ship and weapon stats are data-driven and validated.
- Existing settings/remapping still work.

## Work order 015 - Boss phases and victory path

Goal: create readable escalation and a true win condition.

Prompt:

> Add phase behavior for all five bosses and a final-sector victory path. Bosses should change attacks or cadence by health threshold, preserve readable telegraphs, and respect projectile budgets. Defeating the final boss should produce a victory summary distinct from debug/sector-complete summaries. Add deterministic tests for boss phase transitions, final victory, and summary save records. Update performance notes. Run checks.

Acceptance criteria:

- All five bosses have at least two phases or phase-like state changes.
- Final boss defeat ends the run as a win.
- Boss phases remain readable in high-contrast mode.

## Work order 016 - Route and event depth

Goal: make every route card type matter.

Prompt:

> Implement deeper route outcomes for shop, elite, vault, repair, glitch, and faction ambush. Each route should have deterministic rewards/costs/risks, a distinct UI state where needed, and a clear reason to choose it. Repair should affect hull. Vault/glitch should support curse/relic tradeoffs. Elite/faction ambush should alter combat or rewards. Add known-seed tests for route outcomes and update run summary route history if needed. Run checks.

Acceptance criteria:

- Every existing route type has a meaningful outcome.
- Route choices affect future build, economy, risk, or rewards.
- Same seed and choices reproduce the same outcomes.

## Work order 017 - Content expansion pack

Goal: increase build variety without losing validation.

Prompt:

> Expand content toward Phase 2 targets: at least 30 total items, 4 factions, and 6 build archetypes. Add content in small data modules or tables matching existing patterns. Every new item needs tags, rarity, effect text, reward-pool placement, hook behavior when applicable, and validation coverage. Every new faction needs distinct visuals/behavior notes and sector/boss references where applicable. Add tests for duplicate IDs, invalid references, empty pools, and missing hook implementations. Run checks.

Acceptance criteria:

- At least 30 items and 4 factions are defined.
- At least 6 archetypes are represented in item tags/rewards.
- Content validation fails on broken fixtures.

## Work order 018 - Unlock gating and meta variety

Goal: make permanent progression widen the toy box.

Prompt:

> Connect unlocks to actual run generation. Locked ships, items, factions, bosses, music flags, and challenge seeds should be excluded or marked until earned, while the starter pool remains sufficient for fresh saves. Add archive UI affordances showing what unlocks do. Add migrations if save shape changes. Add tests for fresh-save pools, unlocked pools, import/export, corrupted save repair, and unlock-trigger summaries. Run checks.

Acceptance criteria:

- Unlocks alter future run options without breaking fresh saves.
- Archive explains unlocked content.
- Save migration/import/export tests pass.

## Work order 019 - Onboarding, HUD, and seed entry

Goal: help a new player understand and replay runs.

Prompt:

> Add in-menu seed entry, lightweight onboarding hints, improved gameplay HUD, and richer run summary. The HUD should show sector objective progress, hull, weapon state, special/bomb charge, credits/salvage, boss state, and compact build info. Seed entry should accept blank/random/default and known seed labels. Summary should show route history, items, unlock reasons, win/loss reason, and copyable seed. Add E2E coverage for seed entry and keyboard-only start. Run checks.

Acceptance criteria:

- Seed can be entered from the menu.
- HUD communicates current objective and key resources.
- Summary is useful after win, death, and abandoned runs.

Status: first pass implemented after work order 018 deployment confirmation; menu seed entry, HUD hints/readouts, summary details, and related tests are in place.

## Work order 020 - Balance, performance, and playtest release

Goal: harden Phase 2 into a public playtest candidate.

Prompt:

> Audit the Phase 2 game loop for balance, performance, accessibility, deterministic integrity, browser load, and release docs. Add debug/performance scenarios for dense combat and boss testing. Update performance notes, QA matrix, changelog, README, and release checklist. Fix blockers only. Run `npm run check`, Playwright smoke, and a production preview smoke. Summarize known balance risks and manual test gaps.

Acceptance criteria:

- Full checks and E2E smoke pass.
- Production preview loads assets correctly.
- Release checklist documents browser smoke, performance notes, known issues, and follow-up risks.

Status: first pass implemented after work order 019 deployment confirmation; debug performance scenarios, boss shortcuts, docs, and smoke coverage are in place.

## Phase 3 work orders

Phase 3 begins after work order 020 deployment confirmation and concludes Phase 2. Its purpose is to make Starbreak Salvage feel like a true vertical scrolling shooter: forward velocity, sector scale, procedural backgrounds, scroll-synced waves, distance-based objectives, hazards, landmarks, and boss arenas. Preserve deterministic content generation: same seed and route should reproduce sector distance, scroll pacing, background landmarks, encounter marks, hazards, boss arena timing, rewards, shops, and summary data.

## Work order 021 - Scrolling simulation foundation

Goal: make forward motion a core simulation concept.

Prompt:

> Read `AGENTS.md` first. Then read the Phase 3 plan, architecture notes, performance notes, and current combat/wave code. Add a deterministic scrolling state for gameplay sectors: distance traveled, sector length, scroll speed, camera/world offset, and completion progress. Keep the fixed-step simulation stable and do not tie gameplay progression to render frames. Add tests for scroll advancement, speed clamping, pause/no-update behavior where practical, and known-seed sector length snapshots. Update HUD/debug notes minimally. Run checks.

Acceptance criteria:

- Gameplay state tracks distance traveled in sector units.
- Sector length and base scroll speed are deterministic from seed/sector data.
- Existing gameplay still starts, moves, pauses, and completes sectors.
- Tests prove scroll progress is fixed-step and reproducible.

Status: first pass implemented; deterministic sector scroll plans, fixed-step scroll state, HUD/debug distance readouts, and reduced-motion-aware starfield offset are in place. Distance-based objectives remain follow-up work; scroll-synced directed waves are covered by work order 023.

## Work order 022 - Procedural parallax backgrounds

Goal: make sectors feel spatially distinct while staying original and lightweight.

Prompt:

> Implement deterministic canvas-rendered parallax background layers for sectors. Use original shape/noise/line/debris motifs, not external assets. Each sector family should have at least three strata such as deep stars, large wreck silhouettes, debris lanes, industrial grids, bloom matter, or core wreckage. Background generation must use explicit seeded RNG and respect reduced motion/performance mode with simpler layers. Add tests for background plan determinism and content validation for sector background references. Update README/performance notes. Run checks.

Acceptance criteria:

- Sectors have visibly different scrolling backgrounds.
- Background plans are seed-stable.
- Reduced motion/performance mode lowers visual intensity.
- No copied or externally fetched art is introduced.

Status: first pass implemented; each sector has a deterministic generated background plan with four original parallax strata, gameplay rendering consumes the plan plus scroll offset, reduced motion/performance mode simplifies rendering, and content validation covers sector background references.

## Work order 023 - Scroll-synced wave director

Goal: make encounter pacing depend on distance through the sector.

Prompt:

> Refactor or extend the wave director so major waves can be scheduled by scroll distance markers instead of only elapsed time. Existing time-based behavior can remain as a fallback, but normal sector waves should trigger as the player reaches deterministic distance marks. Preserve boss-gate behavior and deterministic faction selection. Add known-seed tests for wave distance marks, spawn order, and no duplicate spawns when frames stutter. Update debug/performance notes. Run checks.

Acceptance criteria:

- Normal waves can trigger from distance progress.
- Frame drops do not skip or duplicate scheduled waves.
- Known seeds reproduce wave distance marks and spawn order.
- Existing boss and route flow still works.

Status: first pass implemented; directed wave plans now include deterministic distance marks when sector scroll plans are available, combat spawning consumes fixed-step scroll distance with a time-based fallback, boss-gate timing is preserved, and tests cover known-seed marks, spawn order, and frame-stutter duplicate prevention.

## Work order 024 - Distance objectives and HUD

Goal: make surviving through sector distance the default round objective.

Prompt:

> Add distance-based sector objective support. Normal sectors should complete after reaching an exit distance and clearing required gates; boss sectors may require travel plus boss defeat. Update objective progress, HUD copy, sector transition copy, and run summary stats to include distance reached/survived. Add tests for distance objective completion, boss-gated distance completion, abandoned/death summaries, and save records if save shape changes. Include migrations if needed. Run checks.

Acceptance criteria:

- HUD shows distance progress clearly.
- A sector can complete because the player reached its exit distance.
- Boss-gated sectors do not complete until the boss condition is satisfied.
- Summary communicates distance reached.

## Work order 025 - Sector landmarks and hazards

Goal: add non-enemy features that reinforce motion, scale, and risk.

Prompt:

> Add deterministic sector landmarks and hazards tied to scroll distance. Landmarks can be large wrecks, beacon lines, vault doors, convoy shadows, repair platforms, or core machinery. Hazards should be sparse, readable, and original: debris lanes, warning beams, mine belts, salvage storms, or crush gates. Hazards need telegraphs/collision rules and must not visually hide bullets. Add tests for deterministic landmark/hazard plans, hazard collision/damage, reduced-motion readability where practical, and content validation. Run checks.

Acceptance criteria:

- At least three landmark/hazard types exist.
- Hazards are deterministic and tied to sector distance.
- Telegraphs are readable and do not mask enemy bullets.
- Landmarks reinforce sector identity without requiring external assets.

## Work order 026 - Boss arenas and scroll locks

Goal: make bosses feel like end-of-sector punctuation.

Prompt:

> Add boss arena transitions. Boss sectors should scroll through travel space, enter a boss approach, lock or slow scrolling during the arena, and resume route flow after defeat. Debug boss shortcuts must still spawn bosses immediately without requiring travel. Add deterministic tests for arena start distance, scroll-lock state, boss defeat unlock, final victory, and debug shortcut behavior. Update README/debug notes and performance notes. Run checks.

Acceptance criteria:

- Boss arenas start at deterministic distance markers.
- Scrolling locks/slows during boss fights and unlocks on defeat.
- Final boss victory still produces the correct summary.
- Debug boss shortcuts remain fast and reliable.

## Work order 027 - Route and meta integration for sector conditions

Goal: let route choices and unlocks change the next sector's physical feel.

Prompt:

> Connect route outcomes, challenge flags, and unlocks to sector scrolling conditions. Route events may alter scroll speed, hazard density, landmark type, repair platform placement, vault signatures, ambush timing, salvage density, or boss approach length. Keep effects deterministic and summarize notable modifiers before entering the next sector and in run summary. Add known-seed tests for route-selected sector condition changes and save/import compatibility if metadata changes. Run checks.

Acceptance criteria:

- Routes can alter future sector distance/scroll/hazard conditions.
- The player sees important sector modifiers before launch.
- Same seed plus same choices reproduces sector conditions.
- Summary records notable physical route effects.

## Work order 028 - Velocity presentation and accessibility

Goal: make speed feel good without hurting readability.

Prompt:

> Polish velocity cues: parallax strength, star/debris streaks, pickup drift, engine wake, impact streaks, and subtle screen framing. Respect reduced motion, performance mode, screen shake, and high-contrast bullet settings. Ensure text/HUD does not overlap during scrolling. Add tests where possible for settings-driven renderer state and E2E smoke for reduced motion/high contrast launch. Update README/accessibility notes. Run checks.

Acceptance criteria:

- Scrolling conveys forward speed during normal play.
- Reduced motion and performance mode reduce visual intensity.
- High-contrast bullets stay distinct from moving backgrounds.
- Keyboard-only flow remains intact.

## Work order 029 - Long-scroll performance instrumentation

Goal: measure and harden long scrolling before adding more spectacle.

Prompt:

> Expand debug instrumentation for scrolling performance. The overlay should separate entity count, projectile count, pickup/effect count, background primitive or layer count, and current distance/speed. Add debug scenarios for long-scroll traversal and dense encounter pockets. Add tests for count helpers and Playwright smoke for a long-scroll debug scenario if practical. Update performance notes and release checklist. Run checks.

Acceptance criteria:

- Debug overlay reports distance, speed, and more granular counts.
- Long-scroll debug scenario is documented and deterministic.
- Dense and long-scroll scenarios stay under documented budgets.
- Performance notes explain current limits and follow-up triggers for pooling.

## Work order 030 - Phase 3 playtest release hardening

Goal: ship a scrolling-focused public playtest candidate.

Prompt:

> Audit the Phase 3 scrolling game loop for balance, performance, accessibility, deterministic integrity, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 3 plan, backlog, release checklist, and manual test matrix. Run `npm run check`, Playwright smoke, and production preview smoke. Summarize known balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and E2E smoke pass.
- Production preview loads the scrolling build and assets correctly.
- Release checklist documents scrolling smoke, debug scenarios, manual browser gaps, known issues, and balance risks.
- Phase 3 can be declared complete or explicitly deferred with documented blockers.

## Review subagent prompt

Use after a feature PR:

> Spawn subagents to review this branch versus main. Use one subagent each for: bugs, deterministic seed integrity, performance/readability, accessibility, and code maintainability. Wait for all results, then summarize required fixes versus optional improvements.
