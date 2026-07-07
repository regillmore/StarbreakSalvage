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

Status: implemented; `src/game/ItemStress.ts` now exposes a deterministic 22-item hook-heavy debug loadout, item-loadout pressure summaries, and fresh/unlocked reward-shop-vault pool previews. Debug key `6` behind `?debug=1` forces the item-storm combat pocket and adds overlay item count, active hook count, proc cap state, and build identity. Unit tests cover the stress model and pool previews, while Playwright smoke covers the `HOOK-STORM-SMOKE` item-storm path.

## Work order 060 - Phase 6 playtest release hardening

Goal: ship an item-catalog playtest candidate.

Prompt:

> Audit the Phase 6 build for item count, effect implementation status, hook determinism, reward/shop/vault weighting, unlock/discovery behavior, item UI readability, balance, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 6 plan, backlog, release checklist, and QA docs. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known item balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release docs document item count, hook coverage, reward pools, unlock/discovery state, and manual browser gaps.
- Phase 6 can be declared complete or explicitly deferred with documented blockers.

Status: implemented; Phase 6 is documented as complete as an item-catalog playtest candidate. Release, QA, performance, README, changelog, backlog, technical architecture, Phase 6, and Phase 7 planning docs now record the 60-item catalog, 13-hook item surface, source-weighted pools, unlock/discovery state, item-heavy smoke coverage, remaining item balance/browser risks, and the next enemy-behavior roadmap. Full check, escalated Playwright Chromium smoke, and production preview asset-path smoke passed locally for the closeout.

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

## Work order 062 - Enemy schema, role validation, and debug counters

Goal: make enemy roles data-driven and observable.

Prompt:

> Add role-oriented enemy metadata and validation for class, role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, and faction fit where practical. Keep content data explicit and avoid new runtime dependencies. Extend debug/test read models with active enemy role counts and variant/formation placeholders if useful. Add unit tests for metadata validation and known content coverage. Update README/debug and architecture notes. Run checks.

Acceptance criteria:

- Enemy content carries validated role metadata.
- Invalid role, movement, attack, faction, or formation metadata is caught by tests.
- Debug or pure helpers can summarize active enemy role pressure.
- Existing wave generation and gameplay remain deterministic.

## Work order 063 - Role-specific movement profiles

Goal: make enemy roles recognizable before adding more bullets.

Prompt:

> Implement distinct deterministic movement profiles for priority roles such as scout, bruiser, sniper, screener, carrier, support, and disruptor. Favor position, timing, lane pressure, retreats, escorts, and hover behavior over raw speed. Keep movement inside the fixed 640x720 combat world and stable under frame catchup. Add tests for profile bounds, deterministic updates, cleanup, and reduced-motion/readability interactions where practical. Update performance notes. Run checks.

Acceptance criteria:

- At least four roles have visibly different movement behavior.
- Movement remains fixed-step, deterministic, and clamped to the combat world.
- No movement profile can strand enemies offscreen or block sector completion indefinitely.
- Debug/dense smoke still stays within entity and readability budgets.

## Work order 064 - Role-specific attack cadences and telegraphs

Goal: differentiate enemy pressure without unreadable bullet spam.

Prompt:

> Add role-specific attack cadence, projectile shape/speed, aim style, and telegraph language for priority enemy roles. Examples include sniper charge shots, screener lane curtains, carrier deploy bursts, support pulses, disruptor hazard marks, and bruiser close-range volleys. Keep projectiles readable over all current sector backgrounds and high-contrast mode. Add deterministic cadence and projectile-budget tests. Update QA/performance notes. Run checks.

Acceptance criteria:

- Role attacks have distinct timing and pressure profiles.
- Projectile and telegraph budgets remain bounded.
- High-contrast and reduced-motion settings preserve clarity.
- Known-seed or unit tests prove attack cadence is deterministic.

## Work order 065 - Upgraded enemy variants and elite modifiers

Goal: add tactical escalation through clear variants.

Prompt:

> Add deterministic upgraded enemy variants and elite modifiers such as armored, overclocked, evasive, volatile, shielded, escort, commander, or salvage-rich. Variants should be gated by sector depth, faction, route pressure, challenge flags, or encounter type, and should use clear visual/readability cues. Avoid hidden damage spikes and preserve fresh-save generosity. Add validation and known-seed tests for variant selection. Update README/debug, release, and performance notes. Run checks.

Acceptance criteria:

- Variant rules are data-driven, seeded, and validated.
- Variants change player decisions through clear behavior or durability cues.
- Fresh opening sectors do not become unfair.
- Debug or summary surfaces can expose variant pressure for playtesting.

## Work order 066 - Formation definitions and squad spawning

Goal: create tactical enemy shapes that are deterministic and readable.

Prompt:

> Add formation definitions for squads such as wedge, column, ring, screen, escort, pincer, staggered lane, or convoy. Integrate formation spawning with existing wave schedules while preserving distance-marker ordering and frame-catchup safety. Formations should define roles, offsets, timing, entry style, spacing, optional break condition, and cleanup behavior. Add tests for formation generation, spawn order, bounds, and determinism. Run checks.

Acceptance criteria:

- Formation definitions are content-driven and validated.
- Spawned formations stay inside the fixed combat world and do not overlap incoherently.
- Frame catchup cannot skip or duplicate formation members.
- Formation spawning does not break current objective progress.

## Work order 067 - Formation-wave integration and objective safety

Goal: make formations work with sector objectives, rewards, and routes.

Prompt:

> Connect formations to wave director pacing, route-conditioned pressure, faction identity, optional rewards, and objective completion. Ensure simultaneous formation kills, secondary item kills, despawns, and body collisions all advance objectives consistently. Add regression coverage for multi-kill formation clears and sector-complete handoff. Update QA notes with formation smoke seeds. Run checks.

Acceptance criteria:

- Formation waves can appear in normal sector schedules without soft locks.
- Objective target counts cannot desync when formation members die together or through secondary effects.
- Route/faction conditions can bias formation types deterministically.
- Tests cover formation clear, despawn, and sector-completion paths.

## Work order 068 - Longer sector pacing and encounter arcs

Goal: make longer sectors feel authored instead of stretched.

Prompt:

> Extend sector length and encounter pacing for selected routes/sectors with mid-sector beats, relief windows, formation clusters, hazard/background landmarks, and boss-approach pacing. Avoid constant maximum enemy density. Update summaries/debug state to explain longer-sector modifiers. Add deterministic tests for length bands, wave/formation spacing, relief intervals, and route-conditioned longer-sector outputs. Run checks.

Acceptance criteria:

- Longer sectors use clear pacing arcs with pressure and relief windows.
- Route-conditioned length and encounter density reproduce from seed plus save state.
- Debug/summaries expose useful longer-sector context.
- Long sectors stay within performance and readability budgets.

## Work order 069 - Enemy readability, accessibility, and stress smoke

Goal: harden the richer enemy ecosystem before release closeout.

Prompt:

> Add debug and smoke paths for enemy-rich sectors, upgraded variants, and formation pressure. Extend overlay or pure helpers with role counts, variant counts, formation labels, long-sector pressure, and projectile/telegraph budgets. Check high-contrast, reduced-motion, performance mode, narrow viewport, and item-storm interactions. Add Playwright smoke where practical and update QA/performance docs. Run checks.

Acceptance criteria:

- Debug/test tooling can inspect role, variant, formation, and long-sector pressure.
- Browser smoke covers at least one enemy-rich formation or variant path.
- Accessibility settings keep enemy bullets and telegraphs readable.
- Existing item-storm and long-scroll smoke remain green.

## Work order 070 - Phase 7 enemy playtest release hardening

Goal: ship an enemy-behavior playtest candidate.

Prompt:

> Audit the Phase 7 build for role differentiation, upgraded variants, formation behavior, longer-sector pacing, deterministic wave/variant/formation generation, objective safety, readability, accessibility, performance, browser load, release docs, and manual smoke coverage. Fix blockers only. Update README, changelog, performance notes, Phase 7 plan, backlog, release checklist, QA docs, and architecture notes. Run `npm run check`, Playwright smoke if available, and production preview smoke. Summarize known enemy balance risks, browser gaps, and follow-up issues.

Acceptance criteria:

- Full checks and production preview smoke pass.
- E2E smoke passes or local browser-install blockers are clearly documented.
- Release docs document role coverage, variant rules, formation smoke, longer-sector tuning, and manual browser gaps.
- Phase 7 can be declared complete or explicitly deferred with documented blockers.

## Review subagent prompt

Use after a feature PR:

> Spawn subagents to review this branch versus main. Use one subagent each for: bugs, deterministic seed integrity, performance/readability, accessibility, and code maintainability. Wait for all results, then summarize required fixes versus optional improvements.
