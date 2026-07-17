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

## Work order 153 - Direct Act III victory handoff

Goal: make regular completion of the Null Frontier convergence sector close Act III immediately instead of exposing a terminal optional and dead route plot.

Prompt:

> Treat Act III's authored `victory` transition as a terminal act boundary alongside the established Act I refit and Act II frontier handoffs. After the required 5A sector and its reward, settle the default branch, relief, and extraction once, then conclude the run through the existing victory summary. Apply the same rule to restored branch/extraction checkpoints. Do not expose the paired Act III 5A optional, destination effect, or constellation route; preserve ordinary optionals on layers 1-4 and all existing reward, summary, deterministic, save, and snapshot behavior. Run checks.

Acceptance criteria:

- Claiming the required Act III 5A reward proceeds to `Victory Confirmed` without presenting the 5A optional challenge or another constellation route.
- The existing default branch, relief, extraction, run-completion, summary, unlock, and permanent-save reducers remain authoritative and execute once.
- Restored Act III terminal branch or extraction checkpoints follow the same direct victory handoff instead of rebuilding a zero-child route plot.
- Act I's midpoint refit, Act II's extraction-or-breach choice, and ordinary layer 1-4 optionals/destination routes remain unchanged.
- Generated topology, reward timing, route history, deterministic generation, accessibility, save v5, snapshot v12, and static hosting remain compatible.

Status: implemented. `ActPlan.getActBoundaryHandoffAfterSector` now represents all three authored terminal transition kinds. A `victory` handoff carries only its completed source act, while the existing inter-act and frontier variants retain their target acts. The two existing `GameApp` guards therefore commit the terminal default branch before any optional constellation mount and advance a fresh or restored extraction stage through the ordinary completion reducer, where the final failed `advanceSector` result opens the established victory summary.

Focused act-boundary and snapshot regressions cover ordinary pre-terminal sectors, all three transition kinds, a restored Act III 5A extraction checkpoint, one-shot extraction settlement, and final run exhaustion. No new player-facing scene, route outcome, RNG draw, snapshot field, or gameplay path was introduced.

Verification: `npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 625 tests, the production build, all 15 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 932.11 kB minified/254.26 kB gzip initial JavaScript and unchanged 79.56/15.90 kB CSS, increases of 0.17/0.01 kB JavaScript over work order 152. The existing 500 kB chunk notice remains; no dependency, content RNG, mission schema, save/snapshot version, or warning threshold changed.

## Work order 154 - Standard proximity-mine blast damage

Goal: bring the destructible pink mine's blast in line with the ordinary one-hit damage language used by combat and active hazards.

Prompt:

> Reduce Anchor Mine detonations from three hull damage to one standard damage unit. Preserve proximity, damaged, and chain fuse behavior; blast radius; indiscriminate actor and set-piece interaction; destructibility; deterministic placement; telegraphing; accessibility; and rendering. Add focused runtime coverage for the player-facing damage result and run checks.

Acceptance criteria:

- A player caught in one proximity-mine blast loses one ordinary damage unit before engineering mitigation, not three.
- The normal player-damage path remains authoritative for invulnerability, hooks, telemetry, and run objectives.
- Mine blasts still damage enemies, bosses, allies, and set-piece components and can still chain nearby mines through telegraphed fuses.
- Mine toughness, trigger and blast geometry, fuse timings, placement, visuals, accessibility, RNG, saves, and snapshots remain unchanged.

Status: implemented. The Anchor Mine's shared blast payload is now one damage unit, matching ordinary hostile projectiles, contacts, and active hazards. Detonations continue to dispatch through the existing player, enemy, boss, ally, and set-piece damage paths; only the authored payload changed.

Focused runtime coverage confirms a complete fixed-step fuse records one detonation, one damage taken, and exactly one hull lost by an unmodified player while a standard one-hull enemy remains vulnerable to the same indiscriminate blast.

Verification: `npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 626 tests, the production build, all 15 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build remains 932.11 kB minified/254.26 kB gzip initial JavaScript and 79.56/15.90 kB CSS. The existing 500 kB chunk notice remains; no dependency, runtime path, RNG stream, save/snapshot schema, or warning threshold changed.

## Work order 155 - Rewardless Act III victory debrief

Goal: remove the strategically irrelevant circuit choice after the final Act III operation and carry the completed run directly into its victory debrief.

Prompt:

> Skip the ordinary sector reward after required completion of Act III 5A. Settle its default branch, relief, extraction, and run completion through the existing work-order-153 handoff, then open `Victory Confirmed` without mounting `Choose Reward`. Preserve rewards at Act I and Act II boundaries and every ordinary Act III sector, along with combat payout, summary, unlock, save, snapshot, deterministic, and accessibility behavior. Cover the terminal reward policy and run checks.

Acceptance criteria:

- Completing required Act III 5A proceeds directly to `Victory Confirmed`; no item or credit circuit reward is presented or granted.
- The terminal default branch, relief, extraction, completion, summary, unlock, and permanent-save reducers remain authoritative and execute once.
- Act I and Act II convergence rewards and Act III layer 1-4 rewards remain available.
- A resumed final-operation gameplay checkpoint follows the same policy when combat completes; existing branch/extraction compatibility checkpoints still reach the debrief.
- Reward generation elsewhere, combat payout, route history, RNG, saves, snapshots, accessibility, and static hosting remain compatible.

Status: implemented. `ActPlan.shouldOfferSectorCompletionReward` makes the authored victory boundary the sole rewardless sector completion. `GameApp` consults that policy before mounting `RewardScene`; the Act III 5A branch therefore falls straight through the existing automatic terminal branch, relief, extraction, and victory-summary path.

Focused boundary and snapshot coverage confirms Act I and Act II finales still offer rewards, the Act III pre-terminal sector still offers one, only Act III 5A suppresses it, and restored terminal extraction remains a one-shot victory handoff.

Verification: `npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 626 tests, the production build, all 15 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 932.21 kB minified/254.27 kB gzip initial JavaScript and unchanged 79.56/15.90 kB CSS, increases of 0.10/0.01 kB JavaScript over work order 154. The existing 500 kB chunk notice remains; no dependency, reward table, RNG stream, mission/save/snapshot schema, or warning threshold changed.

## Work order 156 - Circuit rotation and permanent boss support

Goal: retire the low-value Boss Pressure reward category after the ordered-circuit pivot, preserve its worthwhile counterplay outside run circuits, and refill the active item rotation with five weapon-chain upgrades.

Prompt:

> Remove all five Boss Pressure items from live starter, combat, vault, weighted, discovery, unlock, and stress rotation without breaking restored runs that already contain their IDs. Move useful phase-warning and late-phase-relief behavior into purchasable permanent scrap upgrades. Add five distinct, ungated, circuit-friendly weapon items with bounded deterministic hooks and clear ordered-chain interactions. Keep the active catalog at 60 items, validate retirement rules, refresh deterministic reward snapshots and catalog documentation, and run release checks.

Acceptance criteria:

- No fresh or progressed reward surface offers a Boss Pressure item, and the active archive has ten family lanes with no Boss Pressure entry.
- Legacy snapshots containing any retired Boss Pressure ID can still resolve its definition and original hook behavior.
- Boss Warning Lattice and Capital Relief Protocol are visible in the Upgrade Bay and apply phase warning/delay plus special-charge/late-phase projectile relief without occupying circuit slots.
- Harmonic Fork Loom, Plasma Seed Crucible, Ricochet Branch Coupler, Warhead Echo Chamber, and Crossfeed Detonator are baseline-unlocked, live, pool-valid, and mechanically distinct.
- Ordered hooks remain bounded: fork/echo effects copy finite shots, projectile transformers respect upstream traits, and the kill payoff requires two circuit traits.
- Boss-only permanent upgrades do not perturb the seeded content-generation fingerprint.
- Catalog validation, discovery counts, unlock copy, item-storm fixtures, known-seed reward/economy snapshots, saves, static hosting, and accessibility remain coherent.

Status: implemented. The five former Boss Pressure definitions are marked retired and retained only for snapshot lookup and hook compatibility. `ACTIVE_ITEMS` and `ACTIVE_ITEM_FAMILIES` now drive the 60-item live audit and ten-family archive, while validation rejects retired reward entries and requires pool coverage only for active items. Boss Pressure weighting and its family gate are gone.

Two new permanent scrap upgrades carry the worthwhile counterplay into every run: Boss Warning Lattice extends phase warnings and delays the next boss attack, while Capital Relief Protocol grants phase-change special charge and clears hostile shots in late phases. Combat receives their resolved profile directly, and generation fingerprints explicitly ignore these non-generative upgrades.

The replacement rotation adds a periodic outer-shot fork, an upstream-trait plasma transformer, a split/drone ricochet transformer, a heaviest-shot warhead echo, and a two-trait kill discharge. Focused coverage exercises their order sensitivity, caps, active-pool placement, legacy retirement, permanent boss runtime behavior, and save-fingerprint isolation.

Verification: `npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 632 tests, the production build, all 15 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 936.97 kB minified/255.36 kB gzip initial JavaScript and unchanged 79.56/15.90 kB CSS, increases of 4.76/1.09 kB JavaScript over work order 155. The existing 500 kB chunk notice remains; no dependency, RNG algorithm, save/snapshot schema, static base path, or warning threshold changed.
