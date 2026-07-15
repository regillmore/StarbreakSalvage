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

Status: first pass implemented; deterministic sector scroll plans, fixed-step scroll state, HUD/debug distance readouts, and reduced-motion-aware starfield offset are in place. Scroll-synced directed waves are covered by work order 023, and distance-based objectives are covered by work order 024.

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

Status: first pass implemented; objective progress now requires sector exit distance plus wave/boss gates, the HUD and sector transition copy communicate travel distance, run summaries show sector distance reached, and save records preserve traveled distance with backward-compatible normalization for older saves.

## Work order 025 - Sector landmarks and hazards

Goal: add non-enemy features that reinforce motion, scale, and risk.

Prompt:

> Add deterministic sector landmarks and hazards tied to scroll distance. Landmarks can be large wrecks, beacon lines, vault doors, convoy shadows, repair platforms, or core machinery. Hazards should be sparse, readable, and original: debris lanes, warning beams, mine belts, salvage storms, or crush gates. Hazards need telegraphs/collision rules and must not visually hide bullets. Add tests for deterministic landmark/hazard plans, hazard collision/damage, reduced-motion readability where practical, and content validation. Run checks.

Acceptance criteria:

- At least three landmark/hazard types exist.
- Hazards are deterministic and tied to sector distance.
- Telegraphs are readable and do not mask enemy bullets.
- Landmarks reinforce sector identity without requiring external assets.

Status: first pass implemented; sectors now generate deterministic landmark and hazard feature plans, gameplay renders original canvas landmarks plus low-alpha hazard telegraphs below bullets, active hazards damage through the normal player-hit path, HUD hints/warnings surface hazard state, and tests cover determinism, validation, collision, and reduced-motion hazard styling.

## Work order 026 - Boss arenas and scroll locks

Goal: make bosses feel like end-of-sector punctuation.

Prompt:

> Add boss arena transitions. Boss sectors should scroll through travel space, enter a boss approach, lock or slow scrolling during the arena, and resume route flow after defeat. Debug boss shortcuts must still spawn bosses immediately without requiring travel. Add deterministic tests for arena start distance, scroll-lock state, boss defeat unlock, final victory, and debug shortcut behavior. Update README/debug notes and performance notes. Run checks.

Acceptance criteria:

- Boss arenas start at deterministic distance markers.
- Scrolling locks/slows during boss fights and unlocks on defeat.
- Final boss victory still produces the correct summary.
- Debug boss shortcuts remain fast and reliable.

Status: first pass implemented; boss-gated sectors now carry deterministic arena approach/lock/release plans, gameplay slows during approach, locks scroll while the arena boss is active, resumes exit travel after boss defeat, keeps final victory distance-gated, preserves immediate debug boss shortcuts, and includes tests for arena marks, lock state, defeat release, scroll lock, and deterministic summaries.

## Work order 027 - Route and meta integration for sector conditions

Goal: let route choices and unlocks change the next sector's physical feel.

Prompt:

> Connect route outcomes, challenge flags, and unlocks to sector scrolling conditions. Route events may alter scroll speed, hazard density, landmark type, repair platform placement, vault signatures, ambush timing, salvage density, or boss approach length. Keep effects deterministic and summarize notable modifiers before entering the next sector and in run summary. Add known-seed tests for route-selected sector condition changes and save/import compatibility if metadata changes. Run checks.

Acceptance criteria:

- Routes can alter future sector distance/scroll/hazard conditions.
- The player sees important sector modifiers before launch.
- Same seed plus same choices reproduces sector conditions.
- Summary records notable physical route effects.

Status: first pass implemented; route outcomes now derive deterministic next-sector condition plans that can adjust scroll speed, sector length, hazard density, route landmarks, and boss approach length. Challenge and unlock variants can add physical modifiers, transition screens show the active condition readout before launch, gameplay consumes the conditioned scroll/feature/arena plans, and run summaries record notable sector condition effects.

## Work order 028 - Velocity presentation and accessibility

Goal: make speed feel good without hurting readability.

Prompt:

> Polish velocity cues: parallax strength, star/debris streaks, pickup drift, engine wake, impact streaks, and subtle screen framing. Respect reduced motion, performance mode, screen shake, and high-contrast bullet settings. Ensure text/HUD does not overlap during scrolling. Add tests where possible for settings-driven renderer state and E2E smoke for reduced motion/high contrast launch. Update README/accessibility notes. Run checks.

Acceptance criteria:

- Scrolling conveys forward speed during normal play.
- Reduced motion and performance mode reduce visual intensity.
- High-contrast bullets stay distinct from moving backgrounds.
- Keyboard-only flow remains intact.

Status: first pass implemented; the renderer now derives a settings-aware velocity cue profile, paints lightweight background streaks, engine wake, pickup drift trails, impact streaks, and subtle frame rails, outlines high-contrast projectiles, wraps HUD pills on narrow viewports, and includes unit/E2E smoke coverage for reduced-motion/high-contrast keyboard launch.

## Work order 029 - Long-scroll performance instrumentation

Goal: measure and harden long scrolling before adding more spectacle.

Prompt:

> Expand debug instrumentation for scrolling performance. The overlay should separate entity count, projectile count, pickup/effect count, background primitive or layer count, and current distance/speed. Add debug scenarios for long-scroll traversal and dense encounter pockets. Add tests for count helpers and Playwright smoke for a long-scroll debug scenario if practical. Update performance notes and release checklist. Run checks.

Acceptance criteria:

- Debug overlay reports distance, speed, and more granular counts.
- Long-scroll debug scenario is documented and deterministic.
- Dense and long-scroll scenarios stay under documented budgets.
- Performance notes explain current limits and follow-up triggers for pooling.

Status: first pass implemented; debug state now reports granular enemy, projectile, pickup/effect, telegraph, background layer/primitive, active feature, distance, speed, arena, and scenario counters. Debug key `0` keeps the deterministic dense-combat pocket, debug key `9` jumps to a quiet late-sector long-scroll traversal, and unit/E2E smoke coverage exercises the helpers and overlay.

## Work order 030 - Phase 3 playtest release hardening

Goal: ship a scrolling-focused public playtest candidate.

Prompt:

> Audit the Phase 3 scrolling game loop for balance, performance, accessibility, deterministic integrity, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 3 plan, backlog, release checklist, and manual test matrix. Run `npm run check`, Playwright smoke, and production preview smoke. Summarize known balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and E2E smoke pass.
- Production preview loads the scrolling build and assets correctly.
- Release checklist documents scrolling smoke, debug scenarios, manual browser gaps, known issues, and balance risks.
- Phase 3 can be declared complete or explicitly deferred with documented blockers.

Status: first pass implemented; Phase 3 is documented as complete after the scrolling playtest hardening pass, release and QA docs capture local check/preview evidence plus the local Playwright browser-cache blocker, and Phase 4 planning/work orders now continue the roadmap.

## Phase 4 work orders

Phase 4 begins after work order 030 deployment confirmation and concludes the first scrolling playtest foundation. Its purpose is to make Starbreak Salvage feel cohesive across displays and control styles while giving each contract a distinct ship, preview, and cockpit/HUD identity. Preserve deterministic run generation and keep the game static, original, accessible, and small.

## Work order 031 - Resolution scaling and viewport parity

Goal: make the playfield and HUD stable across common browser sizes.

Prompt:

> Read `AGENTS.md` first. Then read the Phase 4 plan, renderer, app shell, CSS, settings, and E2E smoke. Add explicit viewport/canvas scaling rules for desktop, laptop, tablet-like, and narrow mobile windows. Define a gameplay safe frame and HUD safe areas so the player, bullets, and objective/HUD text remain readable without overlap. Add pure helpers for scale/safe-area calculations where practical, debug overlay viewport metrics if useful, and viewport-focused tests. Update README/QA/performance notes. Run checks.

Acceptance criteria:

- Canvas and gameplay safe frame scale predictably at common viewport sizes.
- HUD text does not overlap the playfield or itself on narrow and wide layouts.
- Scaling helpers have unit coverage or E2E viewport coverage.
- Existing keyboard gameplay, pause, and debug overlays still work.

Status: first pass implemented and parity-hardened; viewport layout now classifies desktop/standard/narrow sizes, clamps DPR, derives HUD reserves, fits a fixed 640x720 combat arena into the gameplay safe frame, draws frame rails from that frame, keeps hazards/enemies/projectiles/player movement in combat-world units, reports viewport/safe-frame/world metrics in debug mode, and adds unit plus narrow-viewport E2E coverage.

## Work order 032 - Mouse controls

Goal: add optional mouse-assisted play while preserving keyboard-first control.

Prompt:

> Add mouse/pointer controls through the existing input abstraction. Support an opt-in or clearly documented mouse mode for ship movement or pointer-guided movement, plus click/hold fire where appropriate. Keep keyboard/remapped controls fully functional. Add settings for mouse mode/sensitivity only if needed by the implementation. Clamp pointer movement to the gameplay safe frame, respect pause/settings/menu focus, and add tests for pointer-to-action mapping and bounds behavior. Add E2E smoke for mouse launch/control if local browsers are available. Update README/accessibility notes. Run checks.

Acceptance criteria:

- Mouse input can move or guide the ship during gameplay.
- Mouse fire maps through gameplay input rather than bypassing action state.
- Keyboard-only and remapped-key flows remain intact.
- Pointer behavior does not trap focus or break pause/settings scenes.

Status: first pass implemented; gameplay now consumes passive pointer guidance through `InputSystem`, maps viewport pointer positions into the fixed 640x720 combat world, lets keyboard movement override pointer guidance, maps primary pointer press to fire, reports active input mode in debug output, and includes unit plus E2E smoke coverage.

## Work order 033 - Ship appearance data model

Goal: make contract ships visually distinct from content data.

Prompt:

> Add a data-driven ship appearance model tied to contracts/ships: silhouette archetype, primary/secondary palette, engine color, cockpit accent, weapon mount hints, and HUD theme key. Validate appearance references alongside ship stats. Update the player renderer to draw at least the baseline contract ships with distinct original canvas silhouettes and palettes while preserving hitbox clarity. Add tests for content validation and render-state derivation where practical. Update docs. Run checks.

Acceptance criteria:

- Baseline contracts have distinct ship silhouettes and palettes.
- Appearance data validates and fails on missing/invalid references.
- Gameplay hit radius remains clear and unchanged by purely visual differences.
- Reduced motion/performance/high-contrast behavior remains readable.

Status: first pass implemented; ship content now carries data-driven appearance for silhouettes, palettes, engine/cockpit accents, weapon mount hints, and HUD theme keys. Generated contracts expose the appearance, gameplay renders the selected contract ship with original canvas silhouettes plus a hit-radius ring, and validation/tests cover invalid or missing appearance data.

## Work order 034 - New Game contract selection ship previews

Goal: show the ship before the player commits to a contract.

Prompt:

> Upgrade the contract selection scene with ship preview rendering for each contract card and a larger selected-contract preview if layout allows. Previews should use the ship appearance data and show weapon/role cues without external assets. Preserve keyboard selection, focus order, and narrow viewport readability. Add tests for preview data wiring and E2E smoke for selecting a contract with previews. Update README and QA notes. Run checks.

Acceptance criteria:

- Each contract choice displays a readable ship preview.
- Selected contract preview updates through keyboard and pointer interactions.
- Previews do not crowd text on narrow layouts.
- No copied or external ship art is introduced.

Status: first pass implemented; the contract board now renders compact SVG ship previews for every generated contract, a larger selected-contract preview with weapon/role cues, arrow-key selection wraparound, button/card pointer selection updates, and narrow-layout stacking. Preview models are pure/tested and Playwright smoke asserts preview selection before launch.

## Work order 035 - Contract-themed graphical player HUD

Goal: make gameplay HUD feel like a ship cockpit without hiding state.

Prompt:

> Replace or augment the current pill-heavy gameplay HUD with a contract-themed graphical HUD layer. Use the selected ship appearance/HUD theme for frame accents, meter colors, weapon/special/bomb indicators, and compact status panels. Keep critical values text-readable, screen-reader friendly, and responsive. Respect reduced motion, high contrast, performance mode, and color contrast. Add unit tests for HUD theme derivation and E2E smoke for core readouts. Update docs. Run checks.

Acceptance criteria:

- HUD frame and meters reflect the selected contract theme.
- Hull, credits/salvage, objective, weapon heat, special, bomb, boss, and warning states remain readable.
- HUD layout remains stable on narrow and wide windows.
- Accessibility settings reduce or clarify themed presentation as needed.

Status: first pass implemented; gameplay now wraps the existing critical readouts in a contract-themed cockpit HUD, derives frame/meter colors from the selected ship appearance, exposes accessible meter elements for hull/special/bombs/weapon heat, and simplifies the treatment under high-contrast/reduced-motion/performance settings. Unit tests cover theme/meter derivation and Playwright smoke asserts the themed HUD and core readouts.

## Work order 036 - Display and input accessibility

Goal: harden Phase 4 display/input features for more players.

Prompt:

> Audit resolution scaling, mouse controls, ship previews, and themed HUD behavior for accessibility. Ensure keyboard-only flow remains complete, focus order is sensible, pointer controls are optional/clear, reduced motion and performance mode simplify visuals, and high-contrast mode works across ship/HUD themes. Add tests for settings interactions and E2E smoke for keyboard-only plus high-contrast/reduced-motion launch if practical. Update QA checklist and README. Run checks.

Acceptance criteria:

- Keyboard-only flow can start, play, pause, and summarize a run.
- Mouse controls are optional and do not interfere with menus/settings.
- High-contrast bullets and themed HUD remain readable together.
- Reduced motion/performance mode simplify previews/HUD/ship cues.

Status: first pass implemented; native Enter/Space activation now stays with focused DOM buttons while non-activation keys still drive scene shortcuts, pointer guidance clears over DOM overlays so menus/settings do not seed stale mouse control, reduced-motion/performance/high-contrast modes simplify ship previews and cockpit HUD styling, and Playwright smoke covers keyboard-only start, contract selection, pause, end-run, summary, and return-to-menu flow.

## Work order 037 - Ship damage, wake, and identity feedback

Goal: reinforce contract identity during combat moments.

Prompt:

> Add lightweight ship-specific visual feedback for damage, invulnerability, engine wake, special readiness, bomb readiness, and overheat/weapon stress. Feed effects from ship appearance data and existing combat state rather than adding random or external assets. Keep bullets readable and preserve reduced-motion/performance fallbacks. Add tests for cue-state derivation where possible and update performance notes. Run checks.

Acceptance criteria:

- Ship damage and invulnerability states are visible without confusing hitbox size.
- Engine wake and readiness cues differ by contract theme.
- Reduced motion and performance mode reduce cue intensity.
- Combat remains readable in high-contrast bullet mode.

Status: first pass implemented; gameplay ship rendering now derives a pure cue model from selected ship appearance plus current combat state, then draws themed engine wake, damage flash, dashed invulnerability ring, special/bomb readiness brackets, and weapon heat/overheat stress without changing the hit-radius ring. Reduced-motion, performance, and high-contrast settings lower or simplify cue intensity, and unit tests cover cue-state derivation.

## Work order 038 - Contract theme propagation

Goal: carry contract identity through non-combat screens without turning them into clutter.

Prompt:

> Propagate contract theme accents into route transition, reward, shop, run summary, and debug context. Keep operational screens quiet and scannable; avoid decorative cards inside cards. Summaries should include ship appearance/theme identifiers for debugging/replay context if useful. Preserve seed sharing and save compatibility. Add tests for summary/theme formatting where practical. Update README/changelog. Run checks.

Acceptance criteria:

- Route/reward/shop/summary screens reflect the selected contract theme subtly.
- Summary still clearly reports seed, route history, items, unlocks, and distance.
- Theme metadata does not break existing save/import/export behavior.
- UI remains readable on narrow layouts.

Status: first pass implemented; route choice, route event, shop, reward, sector transition, run summary, and debug overlay now consume a shared selected-contract screen theme model. Non-combat screens get a compact contract strip plus subdued CSS-variable accents, run summaries include ship/theme/silhouette/mount metadata for replay/debug context, and save/import/export schema remains unchanged.

## Work order 039 - Viewport/input debug and smoke coverage

Goal: make Phase 4 polish measurable before release hardening.

Prompt:

> Extend debug instrumentation and smoke coverage for viewport parity and input modes. Add overlay metrics for viewport size, canvas scale, safe frame, HUD mode, and active input mode where useful. Add deterministic smoke paths for narrow viewport launch, mouse-control play, and contract preview/HUD theme verification if practical. Update performance notes, QA plan, and release checklist. Run checks.

Acceptance criteria:

- Debug overlay can report viewport/canvas scale and input mode.
- Automated or documented smoke covers narrow viewport and mouse input.
- Contract preview and themed HUD smoke coverage exists or local browser blockers are documented.
- Performance notes explain when display/HUD rendering would need optimization.

Status: first pass implemented; gameplay debug state now reports viewport class/scale/DPR, canvas pixel dimensions, safe-frame origin/size, fixed combat world size, active input mode, HUD mode, and selected contract theme. Playwright smoke now asserts contract preview/HUD theme state, reduced-motion high-contrast HUD mode, pointer input mode, and exact narrow-viewport safe-frame/canvas metrics.

## Work order 040 - Phase 4 playtest release hardening

Goal: ship a display/input/contract-identity playtest candidate.

Prompt:

> Audit the Phase 4 build for resolution parity, mouse controls, ship appearance, contract previews, themed HUD, accessibility, deterministic integrity, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 4 plan, backlog, release checklist, and manual test matrix. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known display/input risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release checklist documents window-size, mouse, preview, HUD theme, and manual browser gaps.
- Phase 4 can be declared complete or explicitly deferred with documented blockers.

Status: first pass implemented; Phase 4 is documented as complete after `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally. Release, QA, performance, backlog, README, changelog, and project planning docs now record the display/input/contract-identity closeout, remaining manual browser gaps, and the Phase 5 roadmap.

## Phase 5 work orders

Phase 5 begins after work order 040 validation and concludes the display/input/contract-identity playtest foundation. Its purpose is to make the run-to-run loop more meaningful: banked scrap should have a clear use, upgrades should be visible and intentional, sector completion should feel like a real exit, the game should gain a lunar surface sector family, and player ship destruction should feel richer without compromising readability or accessibility. Preserve deterministic generation and local-only save behavior.

## Work order 041 - Banked scrap purpose and progression economy

Goal: make banked scrap a meaningful meta resource.

Prompt:

> Read `AGENTS.md` first. Then read the Phase 5 plan, save/unlock code, archive UI, generation code, and content validation tests. Define a banked scrap progression model that spends scrap on durable variety rather than simple permanent power. Add upgrade definitions for a small first catalog, costs, prerequisites if needed, and save migration/import/export support. Keep existing saves safe. Add tests for upgrade catalog validation, purchase affordability, migration, import/export, and fresh-save defaults. Update README and planning docs. Run checks.

Acceptance criteria:

- Banked scrap can buy persistent upgrade entries.
- Upgrade definitions are data-driven and validated.
- Save migration/export/import preserves banked scrap and upgrades.
- Upgrade effects are framed as variety, information, or sidegrades rather than raw stat inflation.

Status: first pass implemented; banked scrap now has a data-backed persistent upgrade catalog, save-backed purchase/affordability helpers, save schema version 3 with legacy v2 localStorage fallback, export/import preservation for purchased upgrade ids, and validation/tests for upgrade metadata, affordability, migration, and fresh-save defaults. The visual Upgrade Bay is covered by work order 042, and deterministic run-generation effects are covered by work order 043.

## Work order 042 - Upgrade bay menu icons and affordances

Goal: give persistent upgrades a clear home and visual language.

Prompt:

> Build an Upgrade Bay menu reachable from the main menu or Unlock Archive. Render upgrade categories with original iconography, cost state, purchased state, locked state, and concise descriptions. Icons can be inline SVG or canvas-derived primitives, but no external assets. Preserve keyboard navigation, pointer selection, focus order, narrow layout readability, and high-contrast/reduced-motion treatment. Add unit tests for upgrade view models and E2E smoke for opening the bay and reading/purchasing when possible. Update QA docs. Run checks.

Acceptance criteria:

- Upgrade Bay is reachable without starting a run.
- Upgrade cards show icons, costs, and purchase state clearly.
- Keyboard and pointer users can inspect upgrades.
- Narrow/high-contrast layouts remain readable.

Status: implemented; the Upgrade Bay is reachable from the main menu and Unlock Archive, renders static original inline SVG icons for each upgrade icon key, shows cost/available/locked/unaffordable/installed state copy, supports focusable cards plus pointer purchase buttons, writes successful purchases to save data, and has view-model unit coverage plus a narrow high-contrast Playwright purchase smoke.

## Work order 043 - Upgrade purchases and run-generation integration

Goal: make purchased upgrades affect future seeded runs safely.

Prompt:

> Connect a first set of upgrades to deterministic run generation and run setup. Good first effects include broader contract board choices, one extra route preview, shop affordance changes, reward pool nudges, or seed information; avoid permanent damage/hull inflation unless explicitly justified. Same seed plus same save upgrade state must reproduce the same contract board, route preview, rewards, and shops. Add tests for known-save plus known-seed snapshots and ensure fresh saves remain balanced. Update summary/debug metadata if useful. Run checks.

Acceptance criteria:

- At least three purchased upgrades have visible future-run effects.
- Same save state plus same seed reproduces upgrade-influenced generation.
- Fresh saves still generate a complete playable run.
- Debug or summary context exposes upgrade influence where useful.

Status: implemented; purchased upgrades now resolve into run-generation effects for contract survey notes and an extra contract slot when unlocked ships allow, route ledger intel, market decoder shop stock/discount/bias changes, relic dossier vault reward choices, seed cartographer opening-sector survey text, run-summary upgrade rows, and debug overlay labels. `UPGRADE-SEED-SNAPSHOT` covers same-save/same-seed generation, fresh-save guardrails preserve the baseline three-contract run, and Playwright smoke verifies a purchased upgrade appears on the next contract board.

## Work order 044 - Run-end scrap breakdown and upgrade toasts

Goal: make earned scrap and upgrade progress understandable after each run.

Prompt:

> Improve run summaries and archive/update feedback so players understand how much scrap they earned, how much is banked, what unlock or upgrade progress changed, and what they can afford next. Add compact toast or callout feedback for newly affordable upgrades without turning the summary into a shop. Preserve seed sharing and existing summary detail. Add tests for scrap breakdown formatting, affordability detection, and save summary records. Update README. Run checks.

Acceptance criteria:

- Run summary explains earned scrap, banked scrap, and upgrade-relevant progress.
- Newly affordable upgrades can be surfaced without blocking summary flow.
- Seed sharing and route/item/unlock summary detail remain intact.
- Formatting is tested.

Status: implemented; run summaries now show scrap flow, upgrade outlook, and compact upgrade progress callouts for newly affordable, already available, next-target, or completed upgrade states while preserving seed sharing, route, item, unlock, and theme detail. The Unlock Archive now surfaces affordable upgrade count and the next upgrade target, and tests cover scrap breakdown formatting, affordability detection, save summary records, and the Playwright summary smoke.

## Work order 045 - Sector completion exit sequence and toast

Goal: make sector completion feel like crossing an exit rather than an abrupt scene jump.

Prompt:

> Add a short sector-exit sequence when objectives complete: exit corridor or beacon visuals, reduced enemy pressure where appropriate, completion toast, and then the existing route/reward transition. Keep it deterministic, brief, skippable or non-blocking, and respectful of reduced motion/performance settings. Debug sector-complete shortcut should still be fast and reliable. Add tests for completion state transitions and E2E smoke for the exit toast if practical. Update performance and QA notes. Run checks.

Acceptance criteria:

- Completing a sector produces a readable exit/completion beat.
- Route/reward flow still opens reliably after the beat.
- Debug completion shortcut remains useful.
- Reduced motion simplifies the sequence.

Status: implemented; objective completion now enters an explicit sector-exit sequence before route or victory handoff, clears enemy pressure, shows a DOM completion toast plus canvas beacon/corridor visuals, reports exit progress in the debug overlay, and uses a shorter static reduced-motion presentation. The debug sector-complete shortcut remains fast and can finish an active exit beat, and unit plus Playwright smoke coverage verify timing, reduced-motion state, and route flow after the toast.

## Work order 046 - Lunar surface sector foundation

Goal: add a new low-altitude sector family.

Prompt:

> Add a deterministic Lunar Surface sector family with original background strata, palette, sector metadata, and route/generation references. The sector should suggest low-altitude flight over craters, ridgelines, towers, or wreck shadows without using external art. Keep bullets readable over the terrain and support reduced motion/performance simplification. Add content validation and known-seed tests for lunar sector generation/background plans. Update README and performance notes. Run checks.

Acceptance criteria:

- Lunar Surface can appear as a generated sector.
- Background plans are deterministic and original.
- Bullets remain readable in standard and high-contrast modes.
- Content validation covers lunar references.

Status: implemented; Lunar Surface now has sector metadata, a deterministic `LUNAR-SURFACE-LANE` route slot, original low-altitude background strata for crater rims, ridgelines, surface-array towers, and wreck shadows, first-pass sparse feature references, and content validation/test coverage for sector/background/feature references. Terrain layers use muted alpha and priority tiers so performance and reduced-motion modes can simplify the visual load while high-contrast bullets remain foregrounded.

## Work order 047 - Lunar hazards, landmarks, and encounter pacing

Goal: make the lunar sector play differently, not just look different.

Prompt:

> Add lunar-specific landmarks, hazards, and encounter pacing hooks. Examples include crater shadow bands, comm-array flybys, dust plumes, mining lasers, low-orbit debris, or surface-defense arcs. Hazards must telegraph clearly, use deterministic distance windows, and stay under bullets. Add tests for lunar feature determinism, hazard phase timing, collision/readability metadata, and route/condition interaction. Update debug/performance notes. Run checks.

Acceptance criteria:

- Lunar sectors have at least two distinct landmarks and two hazard patterns.
- Hazard timing is deterministic and tested.
- Route and condition modifiers can affect lunar features safely.
- Debug counters remain useful in lunar sectors.

Status: implemented; Lunar Surface now uses its own deterministic crater-shadow, comm-array, and surface-relay landmarks plus dust-plume, mining-laser, and surface-defense hazard windows. Lunar sectors also carry optional encounter-pacing data consumed by the wave director for low-altitude spacing, while route-conditioned feature scaling/addition remains valid and debug landmark/hazard counters continue to apply.

## Work order 048 - Rich player ship destruction

Goal: make death feel dramatic and readable.

Prompt:

> Replace the abrupt player death moment with a richer destruction sequence: ship breakup, themed debris, cockpit failure pulse, brief control loss, optional escape/transponder cue, and then the existing summary. Feed colors and silhouette hints from ship appearance data. Respect reduced motion, performance mode, screen shake, high contrast, and audio mute. Add unit tests for destruction cue state and E2E or integration coverage for death-to-summary reliability. Run checks.

Acceptance criteria:

- Player ship destruction is visibly richer than a simple disappearance.
- The death-to-summary transition remains reliable.
- Accessibility/performance settings reduce or clarify the sequence.
- No external assets are introduced.

Status: implemented; player death now enters a bounded destruction state before the existing summary, with contract-colored deterministic debris, silhouette remnants, cockpit failure pulse, transponder toast, a `playerDestroyed` feedback/audio cue, reduced-motion/performance/high-contrast variants, and debug overlay progress. Debug key `7` forces the destruction path behind `?debug=1`, while `K` remains the instant forced-summary shortcut. Unit coverage validates deterministic debris/cue state/settings variants and Playwright smoke now exercises forced destruction through to the destroyed summary.

## Work order 049 - Phase 5 deterministic smoke and debug instrumentation

Goal: make progression and new-sector work measurable before release hardening.

Prompt:

> Extend debug and smoke coverage for Phase 5 systems. Add debug or test helpers for upgrade state, banked scrap, sector exit sequence state, lunar sector generation, and destruction sequence state where useful. Add deterministic smoke paths for opening Upgrade Bay, previewing or purchasing an upgrade, forcing a sector completion toast, launching or verifying a lunar sector, and forcing player destruction if practical. Update QA/release docs and document any local browser blockers. Run checks.

Acceptance criteria:

- Debug or test state can expose upgrade/scrap and exit/destruction state.
- Automated or documented smoke covers Upgrade Bay, sector exit toast, lunar sector, and ship destruction.
- Local browser blockers are separated from gameplay blockers.
- Existing Phase 4 smoke remains green.

Status: implemented; debug state now exposes progression/banked scrap/upgrade readiness in menu and Upgrade Bay surfaces, run credits/salvage plus sector id/name/background/pacing during gameplay and transitions, sector-exit progress, and destruction progress. Playwright smoke now covers Upgrade Bay purchase/debug state, forced sector-exit route flow, forced player destruction through destroyed summary, and a `LUNAR-SURFACE-LANE` browser path that reaches Lunar Surface and verifies lunar sector-plan/background/feature instrumentation. Chromium smoke still requires the approved Playwright escalation because sandboxed runs cannot read the local browser cache.

## Work order 050 - Phase 5 playtest release hardening

Goal: ship a progression/sector-feedback playtest candidate.

Prompt:

> Audit the Phase 5 build for banked scrap purpose, upgrade menu clarity, upgrade generation effects, lunar surface sector readability, sector exit feedback, ship destruction, accessibility, deterministic integrity, save compatibility, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 5 plan, backlog, release checklist, and QA docs. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known progression balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release docs document upgrade, lunar sector, exit toast, destruction, and manual browser gaps.
- Phase 5 can be declared complete or explicitly deferred with documented blockers.

Status: implemented; Phase 5 is documented as complete after `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally. Release, QA, performance, backlog, README, changelog, and project planning docs now record the progression/sector-feedback closeout, remaining manual browser gaps, and the Phase 6 item-catalog roadmap.

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

## Review subagent prompt

Use after a feature PR:

> Spawn subagents to review this branch versus main. Use one subagent each for: bugs, deterministic seed integrity, performance/readability, accessibility, and code maintainability. Wait for all results, then summarize required fixes versus optional improvements.
