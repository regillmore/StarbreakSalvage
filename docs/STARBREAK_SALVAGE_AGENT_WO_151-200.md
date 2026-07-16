# Starbreak Salvage - Agent Work Orders 151-200

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repository first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Work order 151 - Combat-scale responsive hardpoint simulation

Goal: make Hardpoint Control's live-fire pane preserve the scale and firing geometry players see in sector combat at every supported browser width.

Prompt:

> Refit the Hardpoint Control attack simulation around one bounded logical combat camera. Derive ship size from the selected contract's real hit radius, projectile diameter from the production projectile radius, and projectile offsets and trajectories from production world units. Preserve the complete representative firing cycle, ordered item/module hooks, cadence, velocity, reduced-motion and performance-mode presentations, high contrast, narrow layouts, accessibility, and deterministic behavior. Add responsive Chromium geometry coverage and run checks.

Acceptance criteria:

- Ship, projectile diameter, lane spacing, lateral spread, and travel share one logical camera scale instead of mixing pane percentages and fixed pixels.
- Ship size reflects the selected contract's combat hit radius, and projectile diameter reflects the production projectile collision diameter.
- Every forward projectile traverses the preview camera while the bounded multi-volley sample still exposes periodic circuit effects.
- Preview proportions remain stable when the browser changes between 390px narrow and desktop widths.
- Reduced motion and performance mode retain deterministic representative positions; high contrast, the 48-projectile DOM cap, combat behavior, RNG, saves, and snapshots remain unchanged.

Status: implemented. `FoundryPresentation` projects production projectile blueprints into a 640-by-260 logical attack camera. Horizontal offsets use the real 640-unit arena width, projectile size uses collision diameter, and an animation cycle can never be shorter than the camera-crossing time, so actor-budget truncation cannot strand shots mid-pane. Longer cadence cycles retain real velocity beyond the clipped camera, while the independently bounded firing sample preserves periodic signal-circuit effects.

`FoundryScene` exposes the camera and selected contract hit radius to the DOM. The preview uses one fixed aspect ratio and normalized positions for launch, rest, performance, and terminal flight states; the combat-mode ship frame derives from the contract radius. Narrow and desktop layouts therefore scale the entire combat slice together instead of enlarging only the ship.

Verification: `npm run verify:release` passes typecheck, ESLint, all 100 Vitest files and 622 tests, the production build, all 14 Playwright Chromium paths, and the Pages-base production-preview asset smoke. Focused presentation coverage verifies real dual-lane spacing, projectile collision diameter, full-camera travel, bounded 48-actor sampling, periodic firing-cycle effects, and production-combat volley parity. Chromium measures the rendered ship, shot, camera aspect, and terminal travel at both 390px and 1280px widths; their normalized proportions match, and a repository Chromium screenshot supplied the visual QA pass after the in-app browser runtime reported no available target.

The build emits 927.93 kB minified/253.12 kB gzip initial JavaScript and 72.95/14.84 kB CSS, increases of 0.76/0.20 kB JavaScript and 0.22/0.06 kB CSS over work order 150. The existing 500 kB chunk notice remains; no dependency, gameplay actor path, RNG stream, proc budget, save/snapshot schema, or warning threshold changed.

## Work order 152 - Live-fire contract board and seeded ignition dossiers

Goal: turn New Game contract selection into a concise, trustworthy build comparison that previews how each seeded ship actually opens fire.

Prompt:

> Reimagine Choose Contract around one responsive live-fire pane for the highlighted ship and three compact comparison dossiers. Generate each candidate's seeded ignition core through the same deterministic starter-loadout and circuit-fitting path used at launch, show that core on both the active dossier and every choice card, and drive the simulation through the production weapon/engineering/item-hook preview model. Replace pipe-separated frame, module, resource, perk, and drawback text with bounded metrics and formatted tradeoffs; hide empty archive-upgrade boilerplate. Preserve keyboard and pointer selection, accessibility, reduced-motion/performance/high-contrast behavior, deterministic generation, bounded DOM work, saves, and static hosting. Add read-model and responsive Chromium coverage and run checks.

Acceptance criteria:

- The highlighted contract displays one combat-scale live firing cycle derived from its production weapon, component engineering, actual hit radius, and assigned ignition item hooks.
- Every choice card identifies its own deterministic seeded ignition core before launch, with a distinct icon, family, and short live-effect description.
- Hull, speed, bombs, starting economy, edge, and cost are formatted into bounded visual comparison blocks; raw hardpoint/resource/module ledgers and `UPGRADES: NONE` do not appear.
- Selecting by pointer or keyboard refreshes ship, firing cycle, ignition, metrics, and tradeoffs without mutating or rerolling the run.
- Desktop presents the complete board in one clear composition; narrow layouts preserve attack-camera geometry and avoid horizontal page overflow.
- The simulation keeps the existing 48-projectile bound and respects reduced motion, performance mode, high contrast, unlock filtering, proc budget, accessibility, and seed determinism.

Status: implemented. `ContractSelectionPresentation` creates one pure candidate model per generated contract by running the same seeded `generateStartingItemLoadout`, circuit auto-fit, active-item projection, and `FoundryPresentation` production-volley pipeline that launch uses. `AttackSimulationPreview` is now a shared DOM renderer used by both Contract Select and Hardpoint Control, preserving the 640-by-260 combat camera, real ship/projectile scale, periodic hook cycle, bounded actor count, and accessibility behavior.

`ContractSelectScene` renders one active live-fire dossier plus three static comparison cards. Each candidate exposes its ignition core, primary weapon, hull/speed/bomb metrics, while the selected dossier adds starting economy and formatted edge/cost blocks. Empty archive support is hidden; active permanent support becomes chips, and diagnostic frame resources, mounted-module lists, and pipe-separated prose are no longer player-facing.

Verification: focused Vitest coverage proves that every displayed ignition is the exact deterministic item launch will fit and that conditional production volleys remain visible. Playwright covers pointer and keyboard selection, firing-model and ignition replacement, five bounded selected metrics, three candidate ignition dossiers, 390px/1280px attack-camera aspect parity, and absence of horizontal page overflow. Repository Chromium screenshots supplied desktop, multi-projectile, and narrow visual QA after the in-app browser runtime reported no available target.

`npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 624 tests, the production build, all 15 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 931.94 kB minified/254.25 kB gzip initial JavaScript and 79.56/15.90 kB CSS, increases of 4.01/1.13 kB JavaScript and 6.61/1.06 kB CSS over work order 151. The existing 500 kB chunk notice remains; no dependency, gameplay actor path, RNG stream, proc budget, save/snapshot schema, or warning threshold changed.
