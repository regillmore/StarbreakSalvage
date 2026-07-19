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

## Work order 157 - Depleting seeded shop racks

Goal: make each generated shop a finite local inventory whose purchased cards stay empty until the player explicitly pays to reroll.

Prompt:

> Stop regenerating shop inventory after each purchase. Persist one fixed seeded rack per sector and reroll count, replace purchased cards with clearly labeled disabled empty slots, and preserve that depletion when the player leaves and revisits the service. Keep reroll as the sole restock action: it should spend the established cost, advance the deterministic roll, and present a full new rack that excludes items already owned. Preserve pricing, stock modifiers, item hooks, accessibility, responsive layout, old v12 snapshots, and static hosting. Add deterministic, snapshot, and Chromium coverage and run release checks.

Acceptance criteria:

- Buying an item depletes exactly its original slot; no replacement item appears during the purchase redraw or after leaving and revisiting the same shop.
- Empty slots retain the shop grid position, identify their inventory number, explain that reroll restocks them, and cannot receive focus or another purchase.
- Other cards retain their original seeded item, price, provenance, and order for the life of that roll.
- Reroll remains credit-gated and creates a full deterministic rack under the next reroll count, excluding all items the run already owns.
- Depleted racks survive run checkpoints. Pre-work-order-157 v12 snapshots without a stock ledger remain loadable, while malformed ledgers are rejected.
- Desktop and narrow layouts avoid horizontal overflow; keyboard focus advances to an available card, existing shop modifiers/hooks remain authoritative, and static hosting remains compatible.

Status: implemented. `ShopStock` owns a bounded per-sector/per-reroll stock ledger containing slot identity, item, price, provenance, and depletion state. `ShopScene` generates that ledger only on the first visit to a roll, then renders it directly. `GameApp` verifies the requested item and price against live stock before spending credits, marks the slot depleted, and leaves reroll as the only operation that advances to a fresh ledger.

Purchased cards become disabled dashed `Empty Slot` placeholders with stable test IDs, slot numbers, and explicit restock copy. Desktop browser inspection measured all four post-purchase cards at the same 215-by-301-pixel geometry; the 390-pixel layout collapses cleanly to one column with no horizontal overflow. Reroll restores four available cards and browser logs remain clear.

The optional `shopStockByRoll` session field keeps snapshot v12 backward-compatible. Snapshot validation bounds ledger count and rack size, verifies sector/reroll identity, slot and item uniqueness, prices, item IDs, provenance, and depletion flags. Deterministic coverage proves reopen persistence, repeat-purchase rejection, owned-item exclusion, and full reroll restock.

Verification: `npm run verify:release` passes typecheck, ESLint, all 101 Vitest files and 634 tests, the production build, all 16 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 939.72 kB minified/256.13 kB gzip initial JavaScript and 80.09/16.00 kB CSS, increases of 2.75/0.77 kB JavaScript and 0.53/0.10 kB CSS over work order 156. The existing 500 kB chunk notice remains; no dependency, RNG algorithm, snapshot version, static base path, or warning threshold changed.

## Work order 158 - Powered missile flight identity

Goal: make missile-tagged projectiles unmistakable in combat and give them a richer deterministic flight profile than ordinary bullet orbs.

Prompt:

> Refit missiles around one shared powered-flight model. Give player and allied missile-tagged projectiles a brief rack-ejection phase, a visible boost ramp, and a faster cruise while preserving their authored aim vector, dumbfire identity, collision radius, damage, cadence, TTL, and deterministic simulation. Replace the generic projectile orb with a directional nose, body, fins, and owner-readable exhaust treatment in combat, and project the same geometry and motor travel through Contract Select and Hardpoint Control. Missile-producing circuit items must inherit the behavior automatically. Preserve hostile movement tuning, high contrast, reduced motion, performance mode, bounded previews, saves, accessibility, and static hosting. Add simulation, renderer, presentation, and Chromium coverage and run release checks.

Acceptance criteria:

- Player and allied missile-tagged shots eject at half authored speed, accelerate through a bounded boost stage, and cruise at 1.24x authored speed through a fixed-step-independent closed-form travel integral.
- The directional canvas treatment follows the actual velocity vector and presents a pointed body, fins, nose cue, and powered exhaust; ordinary projectiles retain the compact orb treatment.
- Existing and future circuit hooks that add the `missile` tag automatically gain powered flight and missile presentation without weapon-ID special cases.
- Hostile missile movement, collision radius, damage, cadence, heat, TTL, target selection, RNG, and content generation remain unchanged.
- Contract Select and Hardpoint Control use the production motor integral for flight time, terminal position, reduced-motion position, and performance-mode position, with a matching finned projectile silhouette and accessible motor description.
- High contrast, reduced motion, performance mode, ricochet direction changes, the 48-projectile preview cap, saves, snapshots, and static hosting remain compatible.

Status: implemented. `MissileFlight` owns the shared ejection, linear boost, cruise, phase, travel integral, delta, and distance-to-time solver. `CombatState` ages missile actors and applies the exact integrated displacement to player and allied missile-tagged projectiles, so fixed-step subdivision cannot change their range. Hostile missile actors receive the visual age cue but retain their existing linear travel and difficulty.

`CanvasRenderer` now rotates a layered missile body into its velocity vector and draws separate fins, nose light, owner-readable body color, and a performance-aware exhaust plume. Generic shots remain circular. `FoundryPresentation` uses the same motor solver for attack-camera timing and representative positions; `AttackSimulationPreview` adds a finned, accelerating missile treatment and exposes its flight kind to deterministic Chromium coverage. Any ordered-circuit hook that produces a missile tag inherits both paths automatically.

Browser inspection on the clean `STARBREAK-SMOKE` Missile Accountant contract confirmed the projectile reads as a bright pointed missile with fins and a long motor plume at combat scale, and the accessibility tree identifies the two-stage profile. Focused tests cover motor phases, exact integration, preview inversion, combat displacement, canvas branch geometry, ordinary-orb preservation, and live-fire presentation.

Verification: `npm run verify:release` passes typecheck, ESLint, all 103 Vitest files and 641 tests, the production build, all 16 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 942.43 kB minified/257.05 kB gzip initial JavaScript and 80.98/16.26 kB CSS, increases of 2.71/0.92 kB JavaScript and 0.89/0.26 kB CSS over work order 157. The existing 500 kB chunk notice remains; no dependency, RNG stream, content table, save/snapshot schema, static base path, or warning threshold changed.

## Work order 159 - Universal signal conduits

Goal: remove conduit-domain lockouts from the ordered signal circuit so every owned upgrade can use every installed open slot.

Prompt:

> Treat component conduit types as affinity metadata rather than fitting restrictions. Any upgrade item may append into any open installed conduit while total capacity, exclusive occupancy, explicit chain order, eject/undo behavior, deterministic engineering reconciliation, and snapshot validation remain authoritative. Make Hardpoint Control state the universal rule, remove misleading compatibility failures, keep item-domain badges useful for synergy reading, and add focused reducer plus Chromium coverage.

Acceptance criteria:

- Every inactive upgrade can append whenever the installed circuit has at least one open conduit, regardless of item tags, hook family, module slot, native channel, or flex label.
- Append chooses a deterministic open physical conduit and adds the item at the end of the logical chain; earlier/later ordering remains independent of physical routing.
- Engineering replacement preserves valid assignments and deterministically rematches the live chain up to total installed capacity without domain-based ejection.
- Hardpoint component and extension summaries identify their capacity as universal, while item badges remain effect-domain and synergy cues rather than eligibility requirements.
- A full circuit is the only ordinary reason an inactive owned upgrade cannot append; duplicate claims, missing components, insufficient capacity, and ambiguous order remain invalid snapshot state.
- The snapshot shape, save version, item mechanics, circuit proc bounds, content RNG, accessibility, and static hosting remain compatible.

Status: implemented. `ItemSockets` no longer filters routing, appending, swaps, or reconciliation by native/flex channel compatibility. The deterministic router preserves valid stored locations first, then matches by installed circuit order; the first unclaimed conduit receives an appended stage. Capacity and one-item-per-conduit occupancy remain unchanged.

Item classification is now exposed as circuit-domain metadata for badges and synergy reading. Hardpoint Control labels component contributions and extension chips `UNIVERSAL`, states the rule beside the live chain, and reserves its disabled append explanation for a genuinely full circuit. Focused coverage leaves an ordnance conduit as the only open slot and successfully appends a weapon/drone-domain upgrade into it.

Browser inspection confirmed three universal component extensions, concise universal-rule copy, an enabled rack action whenever capacity remained, a successful append, and no console errors. `npm run verify:release` passes typecheck, ESLint, all 103 Vitest files and 642 tests, the production build, all 16 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 942.11 kB minified/256.93 kB gzip initial JavaScript and 80.98/16.26 kB CSS, reductions of 0.32/0.12 kB JavaScript from work order 158. The existing 500 kB chunk notice remains; no dependency, item mechanics, RNG stream, save/snapshot version, static base path, or warning threshold changed.

## Work order 160 - Consolidated circuit engineering stats

Goal: make component circuit capacity read like a normal engineering stat instead of a secondary compatibility warning.

Prompt:

> Remove the separate universal-conduit indicator from installed Hardpoint cards. Add circuit capacity to the standard component stat strip, use that same stat in cargo instead of the redundant scrap-value cell, and aggregate the circuit into Grid Envelope. Preserve the ordered rail, universal fitting, component capacity tiers, scrap payout, deterministic reconciliation, responsive layout, accessibility, and snapshot compatibility. Add focused presentation and Chromium coverage.

Acceptance criteria:

- Every installed component displays six compact stats: power, heat, mass, command, instability, and circuit capacity.
- The separate `CIRCUIT +N / UNIVERSAL CONDUIT(S)` strip is absent from Hardpoint cards.
- Cargo components use the identical six-stat row; no `$` scrap stat remains, and the existing `Scrap +N` action continues to communicate and award the value.
- Install comparison buttons include signed `S` circuit deltas, with added capacity classified as a benefit when other values are equal.
- Grid Envelope includes an accessible Circuit row whose value is `live stages / installed capacity`; its delta compares total capacity with the committed loadout.
- Rail extension chips, universal append behavior, circuit order, capacity progression, saves, snapshots, deterministic content, narrow layout, and static hosting remain compatible.

Status: implemented. `FoundryComponentStatModel` now includes progression-derived circuit capacity, and the single component stat renderer always emits `P/H/M/C/!/S`. Installed cards no longer mount a separate contribution strip. Cargo replaces its redundant salvage cell with the same circuit stat while retaining exact scrap value on the existing action.

Component comparisons carry signed `S` deltas and recognize increased capacity as beneficial. Grid Envelope adds a sixth Circuit meter derived from the authoritative installed socket pool and current active item projection, reporting live stages over capacity while its delta tracks engineering capacity changes.

Browser inspection of the cargo-rich Scenario Lab fixture confirmed three installed and three cargo cards each use aligned six-cell rows, no legacy contribution or cargo scrap-stat elements remain, the Circuit meter reads `1/3`, the panel has no horizontal overflow, and console logs remain clear.

Verification: `npm run verify:release` passes typecheck, ESLint, all 103 Vitest files and 643 tests, the production build, all 16 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 942.12 kB minified/256.97 kB gzip initial JavaScript and 80.62/16.20 kB CSS, a 0.01/0.04 kB JavaScript increase and 0.36/0.06 kB CSS reduction from work order 159. The existing 500 kB chunk notice remains; no dependency, circuit capacity rule, RNG stream, save/snapshot version, static base path, or warning threshold changed.

## Work order 161 - Confined-sector environment identity

Goal: make boarding and related enclosed operations read as continuous interiors instead of narrow collision walls laid over open space.

Prompt:

> Replace ordinary sky/parallax presentation during boarding with deterministic, opaque confined environments. Give capital ships, stations, wreck interiors, and derelict underdecks distinct structural palettes; enrich their passage with panels, ribs, conduits, lamps, service trenches, room-specific floor language, and existing world-anchored bulkheads. Preserve combat visibility, side-wall collision, authored room/door progress, reduced motion, performance mode, high contrast, deterministic content, saves, snapshots, accessibility, and static hosting. Cover the plan and renderer boundaries, inspect desktop/narrow presentation, and run release checks.

Acceptance criteria:

- Boarding never exposes sector stars, nebulae, terrain, or parallax strata inside or outside the arena; an opaque confined environment owns the full viewport first.
- Capital ships, stations, wrecks, and derelicts derive distinct deterministic treatments from immutable operation layout without per-frame random generation.
- Repeating hull panels, transverse ribs, recessed trenches, conduits, service lamps, and moving seams establish depth and forward travel without obscuring combat actors or projectiles.
- Airlock/extraction, corridor, cargo/hangar, quarters/brig, subsystem/bridge, and reactor rooms receive distinct low-contrast passage markings while the existing doors remain world anchored and authoritative.
- Side-wall collision, door/environment objectives, scroll distance, hazards, enemy and player behavior, rewards, saves, snapshots, and content RNG remain unchanged.
- High contrast preserves bright boundary and door cues; reduced motion and performance mode bound decorative strata; desktop and narrow layouts remain clipped and free of horizontal overflow.

Status: implemented. `ConfinedEnvironment` derives a bounded structural plan from the boarding operation's stable target, room, hazard, and door fingerprint. Four target families receive separate palettes and labels, while panel, conduit, lamp, and rib counts remain deterministic and capped.

`GameplayScene` now chooses that plan before any background paint. `CanvasRenderer.paintConfinedBackground` fills the entire viewport with opaque panelwork, ribs, service conduits, lighting, and edge occlusion rather than calling the generated space-background path. The clipped passage adds scrolling deck seams, service trenches, warning markers, target-readable rails, and room-specific floor treatments before repainting the existing world-anchored bulkheads.

Browser inspection of the station fixture confirmed that the full viewport now reads as a sealed industrial traversal: large opaque hull panels, scrolling transverse ribs, inset service channels, conduits, lamps, and shadowed outer structure replace every visible star/nebula layer, while the central combat lane remains brighter and legible. The 390-by-700 high-contrast/performance fixture identifies the enclosed environment, retains clipped side walls and bulkheads, and reports no browser errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 104 Vitest files and 647 tests, the production build, all 16 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 949.80 kB minified/259.19 kB gzip initial JavaScript and unchanged 80.62/16.20 kB CSS, increases of 7.68/2.22 kB JavaScript over work order 160. The existing 500 kB chunk notice remains; no dependency, combat geometry, content RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 162 - Refracted phase-projectile identity

Goal: make phase-tagged shots immediately distinct from ordinary ballistic projectiles in combat and live-fire previews without quietly changing their balance or collision rules.

Prompt:

> Give every phase-tagged projectile one shared deterministic interference identity: a refracted directional core, displaced afterimages, a broken wake, and a cycling aperture. Phase missiles should retain their powered body and motor profile while inheriting the interference treatment. Drive the cycle from fixed-step visual age, align Canvas combat with Contract Select and Hardpoint Control, and preserve authored travel, aim, damage, radius, cadence, heat, TTL, collision, and hook order. Respect owner readability, high contrast, reduced motion, performance mode, actor caps, saves, snapshots, accessibility, and static hosting. Add focused simulation, renderer, presentation, and Chromium coverage.

Acceptance criteria:

- Any projectile with the `phase` tag inherits the treatment without a weapon- or item-ID special case.
- One bounded deterministic 0.48-second phase cycle supplies the coherent, splitting, translated, and rejoining presentation bands without RNG or gameplay-state mutation.
- Non-missile phase shots align their refracted core, displaced echoes, broken wake, and aperture to their actual velocity; phase missiles combine those cues with the existing nose, fins, and powered exhaust.
- Tracking a phase shot's visual age does not alter its authored linear displacement, damage, collision radius, TTL, cadence, targeting, or hook behavior.
- Contract Select and Hardpoint Control identify phase and phase-missile flight kinds, render the same interference language, and describe the cue in their accessible live-fire summary.
- High contrast keeps a bright core and dark separation, reduced motion freezes a readable phase, performance mode reduces echoes and glow, and the existing 48-projectile preview cap remains authoritative.

Status: implemented. `PhaseProjectile` owns a pure age/radius/velocity presentation model with a repeating 0.48-second clock and bounded geometry. `CombatState` now advances visual age for phase-tagged actors, but only missiles continue through the powered-flight displacement branch; ordinary phase shots retain their original linear travel and every collision/damage rule.

`CanvasRenderer` replaces the generic orb for phase shots with a velocity-aligned refracted shard, offset shells, segmented wake, and rotating aperture. Phase missiles retain their existing powered silhouette and add those interference layers. Owner-aware accent colors, high-contrast outlines, reduced-motion freezing, and performance-mode reductions keep the treatment readable without adding gameplay actors.

`FoundryPresentation` classifies `phase` and `phaseMissile` flights from tags, and the shared `AttackSimulationPreview` projects the same asymmetric core, split-color shells, and broken trail in both Contract Select and Hardpoint Control. The live-fire accessibility description now explains the phase cue. Focused coverage proves deterministic cycle bounds, ordinary phase displacement parity, missile composition, canvas geometry, preview classification, and the selected Phase Courier ignition presentation.

Browser inspection with the corrected `RANDOM-1UB0590-26CZ9L` seed and complete ship roster reproduced the reported Phase Courier + Phase Grazer board. The representative fourth volley contains three `phase`-tagged shots, three interference shells, `phase` flight classification, and the accessible refracted-core description; standard animation visibly cycles the split shells and wake, while high-contrast reduced-motion/performance presentation freezes a clean bounded state. The dedicated Chromium path reports no console or page errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 652 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 953.24 kB minified/260.07 kB gzip initial JavaScript and 82.59/16.64 kB CSS, increases of 3.44/0.88 kB JavaScript and 1.97/0.44 kB CSS over work order 161. The existing 500 kB chunk notice remains; no dependency, projectile actor cap, RNG stream, content table, save/snapshot schema, static base path, or warning threshold changed.

## Work order 163 - Consumed phase piercing

Goal: turn phase from a visual/synergy tag into a legible one-use traversal charge that damages through its first contact and then becomes an ordinary projectile.

Prompt:

> Let every phase-tagged projectile damage and continue through one valid combatant, set-piece component, or destructible obstacle. Consume the `phase` tag on that first contact while retaining every other projectile trait, remember the traversed collider so a large target cannot be damaged twice, and let the next distinct contact remove the now-ordinary shot. Apply the same bounded rule to player, allied, and hostile phase fire. Telegraph the phase collapse with an unmistakable split-color impact, procedural cue, and restrained shake. Preserve normal damage dispatch, targetability, armor, kill hooks, powered missiles, ricochets, proc order, actor/effect caps, accessibility modes, saves, determinism, and static hosting. Align live-fire descriptions and add focused collision, obstacle, renderer, audio, and Chromium coverage.

Acceptance criteria:

- A phase-tagged shot applies its ordinary authored damage to the first valid target, remains alive, and loses only the `phase` tag; missile, plasma, split, drone, heat, source, damage, radius, velocity, TTL, ricochet, and proc metadata remain intact.
- The projectile records one namespaced penetrated-target key and cannot damage that same enemy, boss, set-piece component, obstacle, ally, or player again while exiting its collision volume.
- The next distinct target follows ordinary collision behavior and consumes the projectile after normal damage dispatch.
- Player and allied phase fire shares the rule across enemies, bosses, set-piece parts under their existing targetability rules, and damageable environment objects; hostile phase fire shares it across allies and the player.
- Phase consumption creates one capped 0.3-second collapse effect with opposed magenta/cyan apertures, an expanding impact ring, a bright central knot, a short descending procedural cue, and restrained screen shake.
- The collapse remains visible in high contrast, freezes expansion under reduced motion, respects the existing 80-effect ceiling, and adds no gameplay actor or RNG draw.
- Contract Select and Hardpoint Control explain the one-contact pierce in the existing accessible phase-flight description; saves, snapshots, content generation, and static hosting remain compatible.

Status: implemented. `PhaseProjectile` now owns phase-tag removal, collapse duration, and bounded impact radius alongside the existing interference cycle. `CombatState.resolveProjectileImpact` dispatches normal damage first, then either removes an ordinary shot or consumes a phase shot, records its namespaced traversed target, increments monotonic feedback telemetry, and emits one capped collapse effect. Collision scans skip only that first target, so the projectile exits large hulls and obstacles without double damage before its next distinct contact consumes it.

The shared impact boundary covers player, ally, and hostile projectiles. Enemy, boss, set-piece, and environment damage functions remain authoritative for targetability, armor, kills, rewards, and hooks; consuming phase mutates no other projectile trait. Phase missiles therefore continue under their powered motor after losing interference, and first-contact kill hooks still see the phase trait that caused the hit.

`CanvasRenderer` presents consumption as two opposed magenta/cyan aperture halves around an expanding ring and bright diamond knot, with white/yellow high-contrast treatment and reduced-motion-safe radius. `CombatFeedback` adds a monotonic phase-collapse cue with restrained shake, while `AudioSystem` supplies a short original descending triangle tone. Live-fire accessibility copy now states that first damaging contact pierces and collapses the phase. Focused coverage exercises enemy and obstacle traversal, same-target suppression, next-target removal, tag preservation, effect geometry, feedback order, audio identity, and accessibility text.

Browser inspection with the corrected `RANDOM-1UB0590-26CZ9L` seed and complete ship roster reproduces the Phase Courier + Phase Grazer board, confirms the consumed-pierce description in the live-fire region, and exercises the effect in an enemy-rich combat-scale capture without layout or console regressions. The focused Chromium path also verifies the high-contrast, reduced-motion, performance-mode phase preview and its accessible collapse description.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 655 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 955.16 kB minified/260.61 kB gzip initial JavaScript and 82.59/16.64 kB CSS, increases of 1.92/0.54 kB JavaScript with CSS unchanged from work order 162. The existing 500 kB chunk notice remains; no dependency, content table, projectile actor cap, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 164 - Suppressed hardpoint Evolution block

Goal: remove the obsolete fusion-recipe block from Hardpoint Control so the menu stays focused on the ordered signal circuit, installed hardware, cargo, and the current reversible draft.

Prompt:

> Suppress the Hardpoint Control Evolution block, including its recipe count, catalyst copy, empty placeholder, and fusion choice cards. Let the signal circuit flow directly into installed hardpoints and cargo, then the draft log and controls. Preserve existing evolution data, deterministic reducers, component ancestry, evolved-component badges, saves, snapshots, and compatibility; this is a presentation rollback rather than a destructive system migration. Remove dormant block-specific styling, protect desktop and narrow layouts, and add Chromium coverage proving the block no longer appears.

Acceptance criteria:

- Hardpoint Control contains no `Evolution` heading, recipe count, `BASE + CATALYST` copy, compatible-pair placeholder, or fusion choice cards.
- Signal Circuit flows directly into the installed Hardpoints/Cargo workspace, followed by Draft Log, status, and sticky commit controls without a blank section or spacer.
- The menu no longer queries fusion options or stages fusion actions, while the underlying recipe content, validation, foundry reducers, component evolution ancestry, and deterministic signatures remain available and unchanged.
- Existing evolved components retain their evolution badges and tooltips on hardware cards.
- Component install, remove, route, overclock, scrap, circuit ordering, undo, commit, attack preview, resource envelope, saves, snapshots, RNG streams, and static hosting remain unchanged.
- Narrow and desktop Hardpoint Control layouts remain free of horizontal overflow, and Chromium coverage explicitly protects the absent Evolution heading.

Status: implemented. `FoundryScene` no longer imports fusion option/planning functions, creates the Evolution section, or inserts it into the hardpoint document flow. The ordered circuit now leads directly to the installed/cargo workspace and Draft Log. Evolution recipe content and all pure foundry-domain fusion behavior remain intact, and cargo cards still resolve authored evolution ancestry into compact badges for already-evolved components.

The block-only fusion list/card CSS and its narrow-layout selector were removed. Existing responsive workspace, circuit, history, and sticky-control rules now close the released space naturally rather than reserving a hidden placeholder. The main Hardpoint Chromium flow asserts that no Evolution heading is exposed while retaining its circuit, component, preview, undo, and commit checks.

Browser inspection of the cargo-rich Scenario Lab fixture confirms that Signal Circuit now closes directly into Hardpoints/Cargo and then Draft Log on desktop and 390-by-700 layouts. No Evolution heading or placeholder is present, the narrow document reports no horizontal overflow, sticky controls remain reachable, and browser logs remain clear.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 655 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 952.61 kB minified/259.95 kB gzip initial JavaScript and 82.36/16.61 kB CSS, reductions of 2.55/0.66 kB JavaScript and 0.23/0.03 kB CSS from work order 163. The existing 500 kB chunk notice remains; no dependency, foundry-domain recipe, content fingerprint, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 165 - Suppressed component Route and Clock controls

Goal: remove the low-value per-component Route and Clock tuning controls from Hardpoint Control so hardware cards emphasize consequential install, remove, scrap, and circuit decisions.

Prompt:

> Suppress the `Route / ...` and `Clock / ...` mechanics on installed and cargo component cards. Installed hardware should retain only Remove; cargo should retain its compatible Install comparisons and Scrap payout. Preserve the historical routing/overclock fields, deterministic signatures, pure reducers, snapshot compatibility, and resolution of already-tuned legacy components rather than destructively rewriting an active run. New components continue to enter at balanced routing and clock zero, but Hardpoint Control must expose no way to stage new reroute or overclock actions. Protect component stats, comparisons, circuit engineering, undo/commit, responsive layout, accessibility, saves, determinism, and static hosting with focused Chromium coverage.

Acceptance criteria:

- No installed or cargo component card exposes a `Route / ...` or `Clock / ...` button.
- Installed component action rows contain Remove only; empty hardpoints remain unchanged.
- Cargo action rows retain every compatible Install comparison and exactly one Scrap action, without reserved gaps for removed tuning controls.
- `FoundryScene` no longer imports or calls reroute/overclock planning functions, so no new action of either kind can be staged through Hardpoint Control.
- New and generated components still default to balanced routing and overclock level zero.
- Existing routing/overclock fields, deterministic signatures, history records, reducers, resource/effect resolution, and restored legacy snapshots remain compatible and are not silently normalized.
- Evolution ancestry, component quality/affix stats, circuit capacity, attack preview, grid envelope, install/remove/scrap, undo/commit, saves, RNG streams, and static hosting remain unchanged.
- Desktop and 390-by-700 layouts remain free of horizontal overflow; Chromium coverage explicitly protects absent Route/Clock controls and retained cargo Scrap actions.

Status: implemented. `FoundryScene` no longer imports `planRerouteComponent` or `planOverclockComponent` and no longer creates tuning buttons for installed or cargo cards. Installed action rows now contain Remove; cargo combines its compatible Install comparisons with one Scrap action. The browser surface therefore cannot create new reroute or overclock draft records.

The underlying fields, action types, pure planners, signatures, resource/effect resolution, history formatting, tests, and content defaults remain intact as a compatibility boundary for active run snapshots and previously tuned components. This is a focused menu-mechanic suppression rather than a snapshot migration or destructive data rewrite. The ordinary route and clock values remain absent from card copy, while existing stat strips and comparisons continue to report their resolved consequences.

Browser inspection of the cargo-rich Scenario Lab fixture confirms that installed cards now end in one full-width Remove action and cargo cards stack their compatible Install comparison with one Scrap action. Desktop and 390-by-700 layouts contain no Route or Clock controls, no reserved gaps, and no horizontal overflow; all three installed and all three cargo cards remain readable, and browser logs remain clear.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 655 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 951.43 kB minified/259.68 kB gzip initial JavaScript and unchanged 82.36/16.61 kB CSS, reductions of 1.18/0.27 kB JavaScript from work order 164. The existing 500 kB chunk notice remains; no dependency, foundry snapshot/signature field, content fingerprint, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 166 - Hardpoint assignment board and separate cargo management

Goal: make component fitting a mount-first decision and move loose-hardware administration out of the already dense Hardpoint Control workspace.

Prompt:

> Replace component install/remove button rows with one assignment select anchored to every ship hardpoint. Each select should expose its mounted component, compatible loose cargo, compatible hardware currently assigned elsewhere, an empty state, and concise replacement deltas. Move loose-component inspection and scrapping into a distinct Cargo Management menu, and render no cargo block inside Hardpoint Control. Keep both menus over the same reversible engineering and circuit draft so switching never commits, discards, duplicates, or forks state. Preserve component compatibility, required-mount validation, circuit reconciliation, attack preview, Grid Envelope, undo/commit, scrap payout, accessibility, responsive layout, saves, determinism, and static hosting.

Acceptance criteria:

- Every authored hardpoint owns one labeled native assignment select; the currently mounted component is selected, and compatible cargo or transferable mounted components are identified by source with signed `P/H/M/C/!/S` replacement deltas.
- Choosing cargo assigns it immediately to the reversible draft and returns displaced hardware to cargo; choosing a component mounted elsewhere transfers it; choosing empty stages the existing remove operation and lets ordinary required-hardpoint validation block an illegal commit.
- Hardpoint Control contains no cargo card grid or cargo install/scrap actions. It retains the attack simulation, Grid Envelope, ordered signal circuit, hardpoint stat cards, draft log, undo, and commit.
- Cargo Management is a distinct titled menu that shows only loose hardware, standard component stats, ancestry/modifier identity, compatible hardpoint names, and one authoritative Scrap action per card. It exposes no component Install controls, attack console, or signal-circuit rail.
- Hardpoint Control and Cargo Management share one scene-owned engineering/item draft. Menu switching preserves assignments, circuit reconciliation, pending actions, scrap staging, undo, commit, and exit behavior; Back from cargo returns to Hardpoint Control before leaving the service.
- Desktop and 390-by-700 layouts remain free of horizontal overflow, native selects remain keyboard and screen-reader operable, and saves, snapshots, component generation, RNG streams, combat, and static hosting remain unchanged.

Status: implemented. `FoundryScene` now owns an explicit hardpoint/cargo presentation mode over its existing single reversible engineering and item-circuit draft. Hardpoint cards enumerate compatible component instances directly at the mount, distinguish mounted, cargo, and cross-mount candidates, retain compact replacement deltas, and route selection through the established install/remove planners. Ordinary foundry resolution remains the authority for required mounts, grids, capacity, and commit legality.

Cargo Management is a separate top-level foundry surface with its own heading and responsive three-column manifest. It presents fit destinations and Scrap only; Hardpoint Control no longer constructs cargo cards, while the cargo page omits the attack console, circuit rail, and assignment board. A two-choice engineering menu switches views without invoking `GameApp`, creating a second state owner, or crossing the commit boundary. Escape from cargo returns to the assignment board with the draft intact.

Browser inspection of the cargo-rich Scenario Lab fixture confirmed that a cargo-origin replacement updates its hardpoint select, Grid Envelope, circuit capacity, draft log, and manifest immediately, then survives switching to Cargo Management and back. Desktop presents the loose manifest as one stable three-card row; the 390-by-700 layout reports a 390-pixel document and 382-pixel panel with no horizontal overflow. The accessibility tree exposes three labeled assignment comboboxes, explicit mounted/cargo origins and deltas, distinct menu headings, fit summaries, and Scrap-only cargo actions. Browser logs remain clear.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 655 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 954.71 kB minified/260.64 kB gzip initial JavaScript and 84.04/16.91 kB CSS, increases of 3.28/0.96 kB JavaScript and 1.68/0.30 kB CSS over work order 165. The existing 500 kB chunk notice remains; no dependency, foundry reducer, component compatibility rule, content table, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 167 - Stable confined-environment structure

Goal: stop indoor structural variants from replacing one another while they are already visible, so the hull reads as one continuously scrolling place rather than a cycling backdrop.

Prompt:

> Give every repeated confined-environment panel, conduit, lamp, and transverse rib a stable world/cycle identity for its entire visible lifetime. Render all intersecting copies across a wrap seam instead of teleporting one screen-relative copy, including on tall viewports where an asset can exceed the old fixed overscan. Project authored boarding-room treatments into clipped world bands so adjacent room styles enter and leave through the camera rather than replacing the whole arena at a distance threshold. Preserve the work-order-161 palettes, opacity, parallax rates, performance priorities, room geometry, doors, combat bounds, high contrast, reduced motion, saves, deterministic content, and static hosting. Add focused continuity coverage and visually inspect active scrolling.

Acceptance criteria:

- A panel, conduit, lamp, or rib that remains visible across adjacent scroll frames keeps the same immutable source/cycle identity and translates only by its authored parallax delta.
- Tall viewports render both intersecting copies through a wrap seam; no decoration teleports from one visible edge to the other or changes variant in place.
- Ribs are enumerated by absolute world index instead of a modulo screen slot, so later rib-family variation cannot flap when the offset wraps.
- Each visible authored room owns a clipped, continuously translating treatment band; crossing a room threshold never repaints already-visible room structure as another room kind.
- Existing deck seams, rail markers, room patterns, doors, palettes, priority filtering, high contrast, reduced motion, and performance mode retain their visual and mechanical contracts.
- Combat simulation, collision, objective progress, scroll timing, content generation, RNG streams, saves, snapshots, and static hosting remain unchanged.

Status: implemented. `ConfinedEnvironmentPresentation` now projects the immutable environment plan into a frame of source/cycle-addressed panels, conduits, lamps, and world-indexed ribs. It enumerates every copy whose true rendered extent intersects the viewport, eliminating the former fixed 110-pixel wrap seam without adding runtime RNG or persistent state.

The same read-model boundary maps authored boarding rooms into clipped screen bands at the established 0.82 world-to-canvas scale. `CanvasRenderer` paints each visible room kind only inside its moving band and uses the shared scale for doors, so multiple room styles can coexist while crossing the camera instead of one `currentRoom` selection replacing the arena.

Focused coverage forces a 3000-pixel-tall viewport across the former panel seam, proves both stable copies survive and translate continuously, tracks rib IDs across frames, and verifies multiple room identities move by the exact world delta.

Browser comparison of the Boarding Incursion fixture at 15u and 63u confirms the same outer panels, transverse ribs, conduit traces, and clipped reactor/service-room markings translate between frames without variant replacement. Multiple room treatments remain spatially separated, the arena stays clipped and legible, and browser logs contain only the local Vite connection messages.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 657 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 956.11 kB minified/261.09 kB gzip initial JavaScript and unchanged 84.04/16.91 kB CSS, increases of 1.40/0.45 kB JavaScript over work order 166. The existing 500 kB chunk notice remains; no dependency, environment content plan, combat geometry, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 168 - Set-piece bottom recovery envelope

Goal: keep a useful lower-arena maneuvering band open when multi-part assemblies halt sector travel, instead of letting their lowest locked structures pin the player against the bottom edge.

Prompt:

> Stop ordinary set-piece travel before the assembly's authored world anchor so the whole arrangement settles higher in the camera while preserving its relative puzzle geometry. Treat the lower arena as an explicit recovery envelope and reject future seeded layouts that crowd it, including a fixed-step scroll-lock overshoot allowance. Preserve horizontal safe lanes, objective forward-fire access, component dependencies, reinforcements, collision silhouettes, rewards, boss locks, deterministic layout selection, saves, and static hosting. Validate every authored arrangement and visually inspect a live engagement stop.

Acceptance criteria:

- An incomplete set piece locks sector scrolling 80 world units before its authored component anchor; the component arrangement moves as one and retains its internal coordinates, dependencies, target order, collision, and rendering.
- Every seeded layout conservatively retains at least 150 logical units of clear bottom recovery space after allowing 16 units for fixed-step lock overshoot.
- Every component remains fully inside the fixed 640-by-720 camera at the earlier stop, including the inverted layouts.
- Horizontal safe-lane widths, straight-shot objective access, reinforcement timing, component actor/projectile/effect caps, and stage/reward accounting remain authoritative.
- Finale assemblies release travel after completion and then continue to the unchanged boss lock; mission generation and boss anchors do not move.
- The debug set-piece jump targets the new engagement approach, while layout selection, RNG streams, saves, snapshots, content fingerprints, and static hosting remain compatible.

Status: implemented. `SetPiece` now derives a pure engagement distance 80 units before each generated anchor and exposes a conservative layout recovery measurement. Content validation applies the translated camera geometry to every component, rejects engagement-top clipping, and requires 150 units below the lowest collision edge after a 16-unit scroll-step allowance. The existing component states keep their authored anchor distance, so the adjustment is one world-to-camera translation rather than a second layout system.

`GameplayScene` uses the derived engagement distance only for its incomplete-set-piece travel lock. Component activation, damage, dependencies, safe lanes, reinforcement schedule, rewards, completion, and boss-lock authority continue to use their existing plans; after a finale assembly is neutralized, travel resumes over the remaining 80 units to the unchanged boss arena.

Focused coverage validates all nine layouts at both their authored anchor and live engagement transform, protects the bottom envelope and camera bounds, rejects a deliberately crowded core placement, and keeps the debug approach aligned with the new stop.

Browser inspection of the actual Act I opening Hecaton Ledger Ark reproduced the Starboard Ledger layout and used the ordinary debug approach. The encounter stopped at 444/1607u with scroll speed 0, all seven components active, the lowest locked structure above the recovery band, and the ship free to occupy the bottom-left lane. Browser logs contain only local Vite connection messages.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 658 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 956.14 kB minified/261.10 kB gzip initial JavaScript and unchanged 84.04/16.91 kB CSS, increases of 0.03/0.01 kB JavaScript over work order 167. The existing 500 kB chunk notice remains; no dependency, component content table, mission anchor, combat cap, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 169 - Ordered Prototype Vent cadence synergy

Goal: turn Prototype Vent Script into an order-sensitive circuit multiplier that trades slower periodic triggers for a growing heat-shot branch, with its consequences legible directly on affected Hardpoint cards.

Prompt:

> Replace Prototype Vent Script's old Special-duration behavior with a passive ordered-circuit rule. Every fitted upgrade before the script whose effect triggers every `n`th volley should instead trigger every `(n+1)`th volley, and each completed shifted cycle should add one additional generic heat shot. Upgrades after the script retain their authored cadence. Apply the new shot at the affected stage so later circuit items can transform it normally. Show the original-to-effective cadence and added heat shot on every affected Hardpoint upgrade card, update immediately when circuit order changes, and defer the richer heat-shot identity to the next work order. Preserve fixed-step determinism, proc and projectile caps, preview/combat parity, saves, snapshots, accessibility, and static hosting.

Acceptance criteria:

- Prototype Vent Script no longer modifies Special duration, cooldown, or projectiles and is described as an ordered periodic-volley modifier.
- Every active periodic `onFire` stage earlier than the script resolves at its authored cadence plus one; periodic stages after the script remain unchanged.
- Each affected stage appends exactly one generic `heat`-tagged projectile on its shifted cycle before later item hooks execute, so multiple affected cycles and downstream transforms compose through normal circuit order.
- The cadence rule is explicit shared data rather than parsed prose, local counters, or RNG, and the normal 48-hook dispatch budget plus existing preview/projectile caps remain authoritative.
- Hardpoint circuit cards show `EVERY nTH -> (n+1)TH VOLLEY` and `+1 HEAT SHOT` only for affected earlier stages; moving Vent before or after a stage updates the card and live-fire cycle immediately.
- Contract/Hangar and Hardpoint live-fire previews continue using production item hooks, while representative circuit cards receive passive later-stage context without falsely depicting a damage loss on an arbitrary sample volley.
- Saves, snapshots, content generation, accessibility modes, static base path, and the still-unassigned rich heat-shot identity remain unchanged.

Status: implemented. `ItemHooks` now owns the periodic cadence table and exports the profile used by simulation and presentation. Eleven authored periodic volley upgrades query that authority, and a later Prototype Vent Script changes only their effective divisor. On a completed shifted cycle the affected stage clones one bounded upstream projectile, tags it `heat`, and returns it to the ordinary ordered hook pipeline; Vent no longer has a Special-use reducer or saved timing state.

`FoundryPresentation` consumes the same ordered profile for every circuit stage and emits a compact original-to-effective cadence line. Its cumulative sample receives later Vent as passive context without executing unrelated downstream upgrades, avoiding the misleading appearance that the script removes an upstream effect. The normal attack simulation evaluates consecutive production volleys and therefore shows the shifted cycle and added shot without a second preview implementation.

The Engineering Foundry Scenario Lab fixture now fits Phase Grazer before Prototype Vent Script. Focused unit coverage proves positional cadence, the old-cycle miss, the shifted-cycle phase plus heat branch, reverse-order immunity, retired Special behavior, card annotation, attack-preview parity, and deterministic fixture fitting. Chromium coverage reorders Vent in the live Hardpoint rail and protects the annotation's disappearance and return.

Browser inspection of that fixture confirms a stable two-stage rail: Phase Grazer reports `VENT SCRIPT · EVERY 4TH -> 5TH VOLLEY · +1 HEAT SHOT`, the representative output remains `conditional volley armed`, moving Vent earlier removes the annotation, and moving it later restores it. The live attack simulation reports a two-to-three-shot firing cycle, showing that the fifth volley adds one shot without changing the fixed preview scale.

Verification: `npm run verify:release` passes typecheck, ESLint, all 105 Vitest files and 660 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 957.27 kB minified/261.57 kB gzip initial JavaScript and 84.21/16.94 kB CSS, increases of 1.13/0.47 kB JavaScript and 0.17/0.03 kB CSS over work order 168. The existing 500 kB chunk notice remains; no dependency, projectile cap, RNG stream, content-generation order, save/snapshot schema, static base path, or warning threshold changed.

## Work order 170 - Stored-heat shot identity

Goal: turn Prototype Vent's generic bonus projectile into an explicit stored-heat release valve with a readable success and failure language.

Prompt:

> Give heat shot a distinct mechanical and visual identity. Each Vent-affected periodic stage should request a substantial amount of heat already stored by the weapon, consume that heat once when available, and emit a powerful differentiated projectile that remains eligible for later circuit transforms. If the reserve is insufficient, skip the projectile and replace it with a clear non-damaging exhaust plume. Make combat and both shared live-fire previews use the same budget, expose the spend/skip rule on affected Hardpoint cards, and preserve ordered hook composition, fixed-step determinism, actor caps, accessibility modes, saves, snapshots, and static hosting.

Acceptance criteria:

- A heat-shot attempt costs exactly 32% of the current weapon's overheat capacity and spends only heat stored before the ordinary volley adds its authored per-shot heat.
- Multiple Vent-affected stages on one volley share one carried budget in circuit order; no stage can spend heat already consumed by an earlier stage.
- A funded attempt adds one slower, larger, harder-hitting `heat`/`plasma` projectile with explicit heat-shot identity before later circuit and projectile hooks run.
- An underfunded attempt adds no projectile, damage, or hidden heat debt and emits one short capped exhaust plume behind the player ship.
- Canvas combat renders a velocity-aligned molten core, armored thermal shell, and split wake; transformed phase shots retain their phase interference. Shared Contract/Hardpoint previews render the same identity and synchronize skipped attempts with an exhaust replacement.
- Affected Hardpoint cards state the 32% spend and cool-reserve exhaust rule, and the accessible preview summary counts funded versus skipped attempts in its bounded cool-start cycle.
- Reduced motion, performance mode, high contrast, hook/projectile/effect caps, deterministic generation, saves, snapshots, and static hosting remain compatible.

Status: implemented. `HeatShot` owns the proportional cost and deterministic presentation read model. `ItemHooks` carries stored heat, cumulative spend, and ordered outcome events through the existing fire payload; a funded stage produces one heavy plasma-tagged heat slug, while a cool stage records an exhaust outcome without manufacturing a projectile. `CombatState` settles the spend before ordinary shot heat, tracks funded/skipped attempts for diagnostics, and uses the existing capped combat-effect pool for the non-damaging plume.

`CanvasRenderer` gives the authored heat shot a white-hot core, amber shell, and bifurcated wake, composing a phase wake when later signal stages add that trait. `FoundryPresentation` now cools and heats its six production volleys under the same weapon, engineering, and Heat Sink multipliers as combat; `AttackSimulationPreview` renders molten shots and synchronized exhaust replacements, while the accessible summary reports the 32% rule and its bounded outcomes.

The Engineering Foundry Scenario Lab fixture now identifies its cool-start fifth-cycle miss as `0 generated / 1 underfunded`, renders one exhaust actor inside the same normalized camera at desktop and narrow widths, and states the cost/failure rule on the affected Phase Grazer card. The item-storm debug fixture starts with a controlled hot reserve; its Chromium path reaches both a funded shot and a skipped exhaust through ordinary held-fire input while preserving the existing 48-hook budget and captured-error checks.

Browser inspection confirms that the revised Hardpoint rail, accessible preview summary, and exhaust replacement remain legible without stretching the attack console. Focused unit coverage proves proportional cost, pre-volley settlement, sequential no-double-spend behavior, funded and underfunded branches, molten Canvas geometry, phase composition, preview classification, and exhaust rendering. Focused Chromium coverage protects responsive plume bounds, reduced-motion visibility, circuit reorder copy, and the live hot/cool cycle.

Verification: `npm run verify:release` passes typecheck, ESLint, all 106 Vitest files and 666 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 962.93 kB minified/263.23 kB gzip initial JavaScript and 86.83/17.48 kB CSS, increases of 5.66/1.66 kB JavaScript and 2.62/0.54 kB CSS over work order 169. The existing 500 kB chunk notice remains; no dependency, RNG stream, content-generation order, actor/proc cap, save/snapshot schema, static base path, or warning threshold changed.

## Work order 171 - Coherent laser weapon family

Goal: replace the generic cyan bullet-dot treatment for laser fire with a coherent family of distinct weapon and circuit-branch identities.

Prompt:

> Give laser-tagged fire a shared velocity-aligned luminous language while preserving the important differences between the Light Needle Laser, Needle Splitter, and Prototype Beam. Let circuit upgrades author their own recognizable laser branches: Split Prism should preserve its source profile, Lane Splitter should cut parallel rails, Harmonic Fork should cross into forked blades, and Chain Arc should remain visible as a charge layered over the coherent body. Compose phase interference around the laser core and let authored heat shots retain their stronger molten identity. Align Canvas combat with Contract Select and Hardpoint Control, preserve projectile counts, travel, damage, collision, cadence, hook order, actor caps, determinism, accessibility modes, saves, and static hosting, and add focused renderer, simulation, and Chromium coverage.

Acceptance criteria:

- Light Needle Laser emits a narrow tapered lance, Needle Splitter emits smaller refracted split blades, and Prototype Beam emits a substantially longer, wider, warmer coherent packet.
- Weapon content authors the laser profile explicitly; a generic `laser` tag receives the needle fallback without weapon-ID checks in rendering code.
- Split Prism copies retain their upstream laser profile, while Lane Splitter and Harmonic Fork stamp `lane` and `fork` profiles only onto the branches they create.
- Arc-tagged laser bodies add a visible electrical crossing; phase-tagged lasers keep their coherent core inside the existing refracted wake; heat shots continue to use the molten shell and split wake.
- Laser visual age drives only a bounded coherence pulse and never changes linear displacement, TTL, damage, collision radius, cadence, proc order, or content RNG.
- Contract Select and Hardpoint Control expose the same profile metadata, geometry, trail, and accessible velocity-aligned laser summary used by combat.
- High contrast retains a dark-separated white/yellow body, reduced motion freezes the pulse, performance mode removes decorative glow and duplicate preview waves, and responsive attack-preview scale remains authoritative.

Status: implemented. `LaserProjectile` owns five pure presentation profiles (`needle`, `split`, `beam`, `lane`, and `fork`) with bounded velocity-aligned core, shell, wake, branch, and pulse geometry. The three laser weapon definitions now author their base profile, and `WeaponProjectiles` carries it through ordinary topology without changing any gameplay value.

`ItemHooks` preserves that metadata through existing copies and transforms. Lane Splitter and Harmonic Fork explicitly identify only their generated branches, so even a plasma or missile source produces recognizable laser cuts rather than inheriting an unrelated body. Chain Arc remains tag-composed, letting `CanvasRenderer` add a charged crossing over the profile. Heat-shot precedence remains authoritative, while phase interference wraps the coherent laser core instead of replacing it.

`CanvasRenderer` replaces laser orbs with tapered directional bodies, distinct shell geometry, bright cores, bounded wakes, and profile-specific accents. `FoundryPresentation` and `AttackSimulationPreview` carry the same profile into Contract Select and Hardpoint Control, including accessible profile names and matching needle, split, beam, lane, and fork silhouettes. The established high-contrast, reduced-motion, performance-mode, responsive camera, and projectile-cap rules continue to bound the treatment.

Browser inspection of the seeded Debt Runner contract confirms that the Light Needle preview now reads as a long, narrow luminous lance rather than the former cyan dot, stays inside the normalized combat camera, and identifies its needle profile in the live region. The full Chromium flow protects the profile attribute, laser core, accessible summary, responsive hardpoint geometry, phase composition, and clean console behavior.

Verification: `npm run verify:release` passes typecheck, ESLint, all 107 Vitest files and 671 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 966.44 kB minified/264.15 kB gzip initial JavaScript and 89.57/18.07 kB CSS, increases of 3.51/0.92 kB JavaScript and 2.74/0.59 kB CSS over work order 170. The existing 500 kB chunk notice remains; no dependency, projectile topology, combat balance, actor/proc cap, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 172 - Active-choice constellation camera

Goal: make the 1-2-3-2-1 act graph readable at decision time without giving up a complete-act overview or access to carrier services.

Prompt:

> Default the navigation map to a moderately closer presentation centered on the currently actionable sector node, pair, or trio. Spread graph positions through the camera while keeping node-card text at a stable readable size, leave carrier-service nodes available around the map, and add an explicit toggle between the active-choice focus and the complete act. The toggle is presentation-only: preserve authored graph coordinates, route legality, directional navigation, deterministic generation, saves, accessibility modes, and static hosting.

Acceptance criteria:

- Sector Transition opens in `focus` view whenever at least one current or ready sector exists; the focused SVG viewport stays within the authored 0-100 chart and uses one moderate shared scale.
- The current optional node and its two onward destinations form a non-overlapping three-card composition, while two- and one-node states receive the same bounded camera treatment.
- Sector cards are projected into the focused viewport without scaling their text or mutating seeded node coordinates; carrier-service cards remain fixed, visible, and selectable.
- `View Full Act` restores the exact `0 0 100 100` route viewport and uses a compact whole-chart sector-card treatment; `Focus Choices` returns to the same active-node framing.
- The view choice persists while the same Sector Transition scene remains active but does not enter run state, snapshots, content RNG, or route history.
- The toggle has explicit pressed state and changing accessible names, directional node navigation still uses authored coordinates, and reduced-motion/performance modes suppress position transitions.
- Operational approach constellations retain their existing complete-chart presentation unless they explicitly opt into a camera later.

Status: implemented. `ConstellationMap` now owns a pure bounded viewport model and point projection shared by route SVG geometry and sector-card positioning. Sector Transition derives the focus set from its current and choice nodes, defaults to a 1.38x camera, and retains the local focus/overview state without touching the run session. Service cards remain on their authored carrier-orbit anchors, while the overview receives smaller sector cards so the complete 1-2-3-2-1 graph stays useful.

The map exposes a compact `View Full Act` / `Focus Choices` toggle with pressed state, accessible labels, deterministic test attributes, and reduced-motion/performance transition suppression. The shared Operational approach map passes no camera option and therefore remains an overview. Focused unit coverage protects viewport clamping, coordinate immutability, layer expansion, exact overview restoration, and the missing-focus fallback; Chromium coverage toggles both views in the ordinary launch briefing and rejects overlap among all three ready post-sector cards.

Browser inspection of the real seeded Act I post-sector hub at 1280x720 confirms that the cleared optional node and both layer-two routes form a readable triangle, long sector names stay legible, service nodes remain available, and the map label and view toggle do not collide with the active graph.

Verification: `npm run verify:release` passes typecheck, ESLint, all 108 Vitest files and 674 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 968.19 kB minified/264.85 kB gzip initial JavaScript and 90.70/18.27 kB CSS, increases of 1.75/0.70 kB JavaScript and 1.13/0.20 kB CSS over work order 171. The existing 500 kB chunk notice remains; no dependency, route graph, route legality, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 173 - Shared haste reservoir

Goal: replace geometrically stacking pickup fire-rate boosts with one legible, bounded haste resource that rewards clustered collection and multiple compatible upgrades without destabilizing weapon cadence.

Prompt:

> Rework Coin-Operated Cannon and similar cadence upgrades around one player haste reservoir. Credit, salvage, and qualifying phase-graze triggers should add deterministic charge to that shared pool instead of multiplying an already-reduced fire-rate value. Additional distinct haste sources should scale reservoir capacity and refill strength, while any active reservoir always applies the same standard haste cadence. Expose the charge and cap in combat, keep ordered item-hook attribution, include ally-collected pickups, and protect fixed-step behavior, duplicate-item safety, previews, accessibility, saves, determinism, performance budgets, and static hosting.

Acceptance criteria:

- Coin-Operated Cannon, Credit Reroute Fuse, Magnetized Tithe Box, Salvage Magnet, Regolith Scoop Array, and Phase Wake Suture are explicit shared-haste sources with deterministic trigger and fill profiles.
- A fitted haste build owns one reservoir: the first distinct source grants 2.4 seconds of capacity, each additional source adds 0.8 seconds, and total capacity is capped at 6.4 seconds.
- Every active reservoir applies exactly a 0.75 weapon cooldown multiplier. Source count, charge amount, pickup count, and repeated clusters never reduce that multiplier further; Special retains its separate authored burst multiplier.
- Credit and salvage pickups add the ordered contributions of matching unique sources, clamp at the shared cap, and use the same path whether collected by the player or a salvage-command ally.
- Phase Wake Suture retains its phase-only graze condition and special-charge bonus but contributes additive haste charge instead of mutating cadence.
- Duplicate copies of one unique haste item neither enlarge capacity nor contribute twice to one trigger.
- The combat weapon pill shows current and maximum haste seconds, highlights the active state, and debug instrumentation reports charge, capacity, distinct source count, and the authoritative cooldown multiplier.
- Item descriptions explain their shared-reservoir role, the item-storm fixture produces a six-credit/five-source cluster, and focused pure, hook, combat, and Chromium coverage protects the bounded result.
- Content RNG, hook ordering, projectile topology, weapon heat, saves, snapshots, accessibility modes, performance caps, static base path, and dependency set remain unchanged.

Status: implemented. The new pure `HasteReservoir` module owns six item source profiles, distinct-source capacity scaling, bounded additive fill, the standard active cooldown multiplier, and a presentation/debug read model. `ItemHooks` replaces mutable multiplier payloads with additive fill plus source attribution and deduplicates one item ID within a dispatch. `CombatState` stores only reservoir seconds, drains them through fixed-step time, derives cadence from the authoritative active state, and routes both player and ally pickup collection through the same haste application path. The unused sector-start cadence surface is removed; Special remains an independent temporary multiplier.

Coin-Operated Cannon and the five related item descriptions now identify the shared reservoir. Gameplay appends `Haste current/max` to the weapon pill only when a haste source is fitted, gives active haste a restrained amber state, and publishes the full reservoir model to debug diagnostics. The item-storm fixture adds all three credit-haste sources and places six simultaneous credits inside collection range, producing five total haste sources when combined with its salvage and phase-graze items.

Focused coverage proves zero-source behavior, distinct-source scaling, duplicate suppression, bounded cluster fill, fixed cadence parity between one- and three-item builds, additive hook attribution, and the real collision-to-fire path. The production Chromium item-storm flow confirms `Haste ACTIVE`, five sources, a 5.60-second cap, and fixed `x0.75` cooldown in the HUD/debug surface without captured console errors.

Verification: `npm run check` passes typecheck, ESLint, all 109 Vitest files and 679 tests, and the production build. All 17 Playwright Chromium paths pass with the documented Windows AppData escalation, and `npm run test:preview` confirms the Pages base plus every hashed/lazy asset returns 200. The build emits 969.47 kB minified/265.44 kB gzip initial JavaScript and 90.89/18.31 kB CSS, increases of 1.28/0.59 kB JavaScript and 0.19/0.04 kB CSS over work order 172. The existing 500 kB chunk notice remains; no dependency, content RNG, hook/proc cap, projectile topology, save/snapshot schema, static base path, or warning threshold changed.

## Work order 174 - Normal return and saved-seed retry

Goal: make every completed-run return land on the ordinary random title while retaining an explicit, convenient way to replay the previous expedition.

Prompt:

> Always leave the run debrief for the normal title presentation, even when the completed expedition originated from a supplied URL or manually entered code. Clear the stale active seed route without disturbing other query state, keep random expedition as the focused primary action, and add a nearby secondary action that retries the exact last seed already stored in permanent save data. Preserve manual code entry, suspended-run resume, deterministic generation, saves, static hosting, responsive layout, and keyboard access.

Acceptance criteria:

- `Back to Menu` from every run debrief clears the transient title seed input and removes only the `seed` query parameter from the current URL.
- The returned title identifies the next launch as random, keeps `Start Random Expedition` focused, and leaves the collapsed manual-code field blank.
- When permanent save data contains a last run, a secondary `Retry Last Seed` action appears beside the random launch and displays that run's exact normalized seed.
- Retrying passes the saved seed through the ordinary contract-board generation path; it does not resume a snapshot, bypass contract selection, or create a separate RNG path.
- The retry action is suppressed on an explicitly seeded title so the loaded-code primary action remains unambiguous.
- Suspended expedition controls, archive progression, save migration, manual seed entry, accessibility modes, responsive layout, static hosting, and the initial random-seed contract remain compatible.

Status: implemented. `GameApp` now treats debrief exit as a distinct navigation boundary: it clears transient seed entry, removes the URL's `seed` parameter with same-document history replacement, and then opens the normal title. `MainMenuScene` reads the existing `saveData.lastRun.seed` record without adding a schema or storage key and renders one compact secondary replay action only beside the random primary launch. Both buttons converge on the existing launch animation, seed resolver, run generator, and contract board.

The keyboard/debrief Chromium regression now begins from `?seed=STARBREAK-SMOKE`, abandons through the ordinary run summary, confirms a seed-free URL, blank manual field, focused random action, and visible saved-seed replay, then launches the replay and confirms the contract board regenerated `STARBREAK-SMOKE`. In-app browser inspection followed that seeded run through its debrief and confirmed the ordinary title at `?debug=1`, the primary random launch above the exact saved-seed retry, no horizontal or vertical viewport overflow at 1280x720, and no captured console errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 109 Vitest files and 679 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 970.25 kB minified/265.66 kB gzip initial JavaScript and 91.27/18.37 kB CSS, increases of 0.78/0.22 kB JavaScript and 0.38/0.06 kB CSS over work order 173. The existing 500 kB chunk notice remains; no dependency, seed resolution, RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 175 - Managed browser smoke host

Goal: replace recurring ad-hoc LAN and process troubleshooting with one lean, project-owned lifecycle for interactive local browser validation.

Prompt:

> Add agent-facing project tooling that starts or reuses a local Vite instance, publishes the current LAN URL in both human- and machine-readable forms, proves the app is ready at the GitHub Pages base, and tears the exact owned instance down reliably. Avoid stale copied addresses, arbitrary port assumptions, orphaned processes, and unsafe PID kills. Document the workflow where future agents will see it, cover the lifecycle automatically, and validate the published address through the in-app browser.

Acceptance criteria:

- `npm run smoke:host` starts a managed foreground dev host on all local interfaces, accepts `--mode preview`, tolerates a busy default port, waits for both Vite and the application page, and remains attached to a task-length shell.
- A versioned state record under ignored `node_modules/.cache` contains the PID, ownership token, mode, actual port, Pages base, loopback URL, current LAN `browserUrl`, health URLs, and start time.
- `npm run smoke:status` verifies the process and token-bearing health endpoint, refreshes the active routed IPv4 address, verifies the app page, and supports a single JSON record through `--json`.
- Repeating start against a healthy same-mode instance is idempotent; it reports and reuses the existing process instead of opening another listener.
- `npm run smoke:stop` authenticates against the ownership endpoint before requesting graceful shutdown, is idempotent after shutdown, removes runtime state, and lets the original managed host command exit successfully.
- Status never treats an unverified PID as owned, stale dead-process state is retired, and no runtime state or log enters version control.
- Focused automated coverage exercises start, page load, status, reuse, graceful stop, and repeated stop with an isolated state file and operating-system-assigned port.
- `AGENTS.md` and the README tell agents to use the published URL rather than remembered LAN or localhost addresses, retain a long-running shell with a task-length timeout, and stop after browser inspection.

Status: implemented. `scripts/smoke-host.mjs` uses the Vite API directly so the long-running command itself owns the listener. A private no-store health endpoint exposes the current ownership token and accepts only authenticated shutdown requests. The state file is written atomically beneath the already ignored dependency cache. LAN discovery first asks the operating system for the active routed IPv4 address without sending application traffic, then falls back to ranked non-loopback interfaces; status recomputes the browser URL while the server remains bound to every interface.

The command family now covers human output and JSON automation, exact Pages-subpath readiness, dynamic ports, dev/preview selection, same-mode reuse, mode-conflict refusal, stale-state cleanup, verified ownership, graceful cross-platform shutdown, and safe repeated stop. `AGENTS.md` makes this the default in-app-browser path and explicitly calls out the managed shell timeout and cleanup sequence; the README exposes the same commands to contributors.

Focused lifecycle coverage launches the real tool with an isolated state file and ephemeral port, fetches the app, verifies status identity, proves start reuse, stops it through the authenticated endpoint, waits for a clean host exit, and repeats stop safely. A real Codex managed-shell run published `http://192.168.40.7:4175/StarbreakSalvage/`; the in-app browser loaded its debug title screen to complete state with no captured console errors, after which `smoke:stop` closed the listener and the original host cell returned exit code 0.

Verification: `npm run verify:release` passes typecheck, ESLint, all 110 Vitest files and 680 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. A separate post-build `smoke:host -- --mode preview --port 0` run selected port 58886, returned the correct preview state and LAN URL, served the Pages title with HTTP 200, and shut down with both controller and managed-host exit code 0. The browser tooling is development-only and leaves the production bundle unchanged at 970.25 kB minified/265.66 kB gzip JavaScript and 91.27/18.37 kB CSS. The existing 500 kB chunk notice remains; no dependency, gameplay code, content RNG, save/snapshot schema, static base path, or warning threshold changed.

## Work order 176 - Permanent Exit Toll and Coastdown haste

Goal: move Exit Toll Transponder out of the run-item rotation and turn its dependable route economy into permanent progression, while replacing the rare slot with a circuit-friendly haste conservation tool.

Prompt:

> Retire Exit Toll Transponder from active item rewards and install its sector-start refund through the permanent scrap Upgrade Bay. Add one rare replacement item that owns a shared haste reservoir source, fills from broadly useful pickup play, and stops reservoir drain whenever the player releases fire. Keep one standard haste cadence, restored-run compatibility, deterministic pools, readable UI, and full release coverage.

Acceptance criteria:

- Exit Toll Transponder is absent from active discovery and reward pools and appears as a 9 kg permanent Salvage upgrade gated by Salvage Escrow Index.
- The permanent transponder grants the existing deterministic 1-3 credit sector-start refund as the player advances through an act.
- Restored snapshots carrying the retired run item retain its refund; owning both forms never pays twice.
- Coastdown Capacitor replaces the rare combat/route slot, contributes one distinct haste source, and adds 0.55 seconds of shared charge on either a credit or salvage pickup.
- A fitted Coastdown Capacitor freezes positive reservoir charge while fire is released and resumes ordinary one-second-per-second drain while fire is held.
- Coastdown never changes the standard active 0.75 cooldown multiplier. Duplicate copies remain subject to unique-source capacity and per-dispatch fill rules.
- Combat identifies the passive with `COAST`; debug instrumentation distinguishes `coast-hold` from continuous drain and reports the same charge, cap, source count, and cadence authority.
- The item-storm fixture includes Coastdown, reaches six sources and the 6.4-second cap, and protects its HUD/debug presentation in Chromium.
- The permanent gameplay effect is excluded from content-generation fingerprints; save schemas, seeded ordering, fixed-step simulation, accessibility modes, static hosting, and dependency set remain compatible.

Status: implemented. Exit Toll remains in the catalog solely as a retired compatibility record and retains its legacy hook for restored snapshots. The active combat pool now carries Coastdown Capacitor in the same rare slot. `UpgradeEffects` exposes a separate sector-start surface, `GameplayScene` passes it into combat, and `CombatState` resolves the permanent refund with explicit legacy-item precedence. The upgrade is deliberately non-generative, so installing it does not perturb sector, route, shop, or reward RNG streams.

`HasteReservoir` now owns the Coastdown source, its any-pickup fill, and the pure fixed-step drain rule. The existing ordered pickup hook applies its contribution once on both currency kinds. Combat uses the current fire input as the drain gate; held fire spends reservoir time normally, while released fire banks it indefinitely. The weapon pill appends `COAST`, the debug line reports `drain coast-hold`, and the expanded 29-item stress fixture reaches `HASTE 6.4/6.4s` with six distinct sources.

Focused coverage protects pure drain/fill behavior, both pickup kinds, combat fixed-step integration, permanent payout, restored-item no-double-pay, upgrade projection/fingerprints, active catalog counts, source-weighted rewards, Upgrade Bay totals, and the progressed Act II economy snapshot. Production browser inspection confirmed the ninth Upgrade Bay card at 1280x720 and the six-source Coastdown HUD/debug state with no console errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 110 Vitest files and 686 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 971.92 kB minified/266.15 kB gzip initial JavaScript and 91.27/18.37 kB CSS, increases of 1.67/0.49 kB JavaScript and no CSS change over work order 175. The existing 500 kB chunk notice remains; no dependency, save/snapshot schema, route topology, static base path, or warning threshold changed.

## Work order 177 - Permanent Coupon Cascade and Boreline Crimper

Goal: move Coupon Cascade Fuse's dependable shop economy into permanent progression and refill its common reward slot with a genuinely ordered weapon-chain tool.

Prompt:

> Retire Coupon Cascade Fuse from active run rewards and move its one-credit shop discount plus credit-stock bias into the permanent scrap Upgrade Bay. Preserve restored-run behavior without allowing the item and upgrade to stack. Add a common replacement whose benefit depends clearly on which projectiles have already been built earlier in the signal circuit. Keep shop and weapon generation deterministic, previews honest, active catalog breadth stable, and the managed smoke-host defaults reliable for fresh agents.

Acceptance criteria:

- Coupon Cascade Fuse is absent from active discovery and reward pools and appears as a 10 kg permanent Market upgrade gated by Market Decoder.
- Permanent and restored-item forms each retain exactly one credit of price reduction and one credit-tag stock bias; owning both applies the recipe once.
- The shop-specific effect is explicit input to seeded shop generation and does not perturb contracts, route graphs, sector schedules, or projected run duration through the global generation fingerprint.
- Common Boreline Crimper replaces the same starter/combat/shop slot and modifies only off-axis projectiles that exist before its ordered `onFire` stage.
- Eligible branches retain 58% lateral velocity, gain 12% forward velocity, gain 18% impact, and receive `overkill`; centered and later-created shots remain unchanged.
- Hardpoint cumulative cards and live-fire use the production hook path, making after-split placement show a tighter, harder volley while before-split placement remains conditional.
- The active catalog remains at 60 items, the item-storm fixture remains bounded at 29 active items and retains every implemented hook family, and deterministic reward/shop snapshots are updated.
- Upgrade Bay totals, restored snapshot compatibility, saves, accessibility modes, hook/projectile caps, static hosting, and dependencies remain coherent.
- Unmodified `smoke:host`, JSON `smoke:status`, in-app browser load, `smoke:stop`, and original-shell exit succeed using the documented defaults; tooling changes are made only if that pass finds a defect.

Status: implemented. Coupon Cascade remains a retired catalog record and hook solely for restored run snapshots. `RunUpgradeEffects` exposes its permanent market flag, while `Shops` resolves permanent-versus-legacy precedence before the ordinary combined hook pipeline. Installing it changes the appropriate seeded shop result without entering the expedition-wide generation fingerprint. Upgrade Bay now contains ten permanent options.

Boreline Crimper replaces the common pool entry as a bounded ordered transform. It compresses and accelerates only upstream off-axis branches, raises their impact, and stamps `overkill`; it creates no actors or local counters. The shared Hardpoint preview consequently reports a `2.2 -> 2.5 impact` transform when Crimper follows Split Prism and an inert conditional stage when the order is reversed.

The unchanged managed-smoke defaults selected port 4175, published `http://192.168.40.7:4175/StarbreakSalvage/` through JSON status, and loaded that exact address in the in-app browser. The Upgrade Bay rendered all ten cards, showed Coupon Cascade's 10 kg cost, Market Decoder prerequisite, discount, and stock bias without viewport overflow, and produced no captured console errors. `smoke:stop` then closed the listener and the original managed host shell returned exit code 0, so work order 177 requires no tooling adjustment.

Verification: `npm run verify:release` passes typecheck, ESLint, all 111 Vitest files and 690 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 973.35 kB minified/266.55 kB gzip initial JavaScript and 91.27/18.37 kB CSS, increases of 1.43/0.40 kB JavaScript and no CSS change over work order 176. The existing 500 kB chunk notice remains; no dependency, save/snapshot schema, route topology, static base path, or warning threshold changed.

## Work order 178 - Urgent cockpit HUD and pause dossier

Goal: reclaim combat visibility by limiting the live cockpit to urgent, glanceable state and moving persistent operational detail into a richer pause surface.

Prompt:

> Slim the sector HUD around ship meters, current sector progress, objective progress, weapon state, and immediate threats. Move low-urgency economy, loadout, build, route, sector-intelligence, ledger, boss, campaign, and support information into a structured pause dossier. Suppress the low-value ally command controls while retaining automatic ally combat and compatibility with existing settings data. Keep desktop, narrow, high-contrast, reduced-motion, pause, settings, snapshot, and fixed-step behavior coherent.

Acceptance criteria:

- The live HUD contains the themed ship identity, four meters, compact act/sector/stage context, distance, hull, reserves, weapon state, objective progress, and immediate warnings.
- Anticipated boss identity, economy, combat counters, build identity, hardpoint summary, expedition-node detail, sector conditions, pacing, hazard plan, route pressure, faction forecast, and wing ledger no longer consume visible cockpit space.
- General hints remain pause-only during normal flight; boss, active hazard, arena lock, cooldown, exit, and destruction guidance can surface live when immediate action matters.
- Pause presents four current metrics and four labeled dossier sections for current operation, sector intelligence, ship systems, and ledger/support without unformatted debug prose.
- Resume, Settings, Suspend, and End Run remain keyboard/pointer accessible and sticky while a long dossier scrolls.
- Wing command buttons disappear from gameplay, command bindings disappear from visible Settings rows, and command actions no longer dispatch during combat. Existing settings payloads and defaults remain loadable.
- Crew and fleet allies retain their established automatic targeting, projectile, injury, salvage, objective, and result behavior; the pause dossier reports support status without controls.
- Standard 1280x720 HUD height is materially reduced, the 390x700 HUD stays at or below 156 px, pause remains within viewport width, and high-contrast/reduced-motion behavior remains compatible.
- Simulation, deterministic generation, saves/snapshots, route topology, item hooks, actor/projectile caps, static hosting, and dependencies remain unchanged.

Status: implemented. `GameplayScene` now renders only the urgent readout subset and exposes a structured `GameplayPauseDossier` read model for the paused scene. Long objective ownership, set-piece, faction, conditions, pacing, hazard planning, engineering, build, ledger, expected boss, and wing state remain available without competing with live combat. Immediate warnings and phase-specific guidance retain precedence, while ordinary pre-fire and passive hints stay in the dossier.

`PauseScene` is now a responsive operational board with a compact header, four metrics, four semantic definition-list cards, and sticky controls. The crew command bar and gameplay command dispatch are removed; visible settings omit those five bindings while the settings schema and imported payload compatibility remain intact. Ally actors continue using the existing automatic focus behavior and all combat accounting remains untouched.

Focused desktop and narrow Chromium coverage protects the urgent-versus-dossier split, suppressed command surface, campaign and automatic-wing relocation, four-card pause structure, sticky navigation flow, and the 156 px narrow HUD ceiling. A managed in-app browser pass at 1280x720 measured the normal cockpit at two compact operational bands, rendered a 1080 px pause dossier with four metrics and four sections, found no horizontal overflow or ally controls, and captured no console errors. The unchanged managed host stopped cleanly and its original shell returned exit code 0.

Verification: `npm run verify:release` passes typecheck, ESLint, all 111 Vitest files and 691 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 977.38 kB minified/267.42 kB gzip initial JavaScript and 93.32/18.78 kB CSS, increases of 4.03/0.87 kB JavaScript and 2.05/0.41 kB CSS over work order 177. The existing 500 kB chunk notice remains; no dependency, save/snapshot schema, deterministic content input, route topology, static base path, or warning threshold changed.

## Work order 179 - Permanent Ore Scrip and Gangue Compression Die

Goal: move Low-Orbit Ore Scrip's dependable low-risk route refund into permanent progression and refill its common reward slot with another genuinely ordered weapon-chain tool.

Prompt:

> Retire Low-Orbit Ore Scrip from active run rewards and move its one-credit Shop/Repair route refund into the permanent scrap Upgrade Bay. Preserve restored-run behavior without allowing the item and upgrade to double-pay. Add a common replacement that turns lighter projectiles created earlier in the signal circuit into a distinct, synergy-friendly output. Keep route settlement and weapon generation deterministic, previews honest, active catalog breadth stable, and the managed smoke-host defaults reliable.

Acceptance criteria:

- Low-Orbit Ore Scrip is absent from active discovery and reward pools and appears as an 8 kg permanent Navigation upgrade gated by Route Ledger Uplink.
- Permanent and restored-item forms each refund exactly one credit after a Shop or Repair route; owning both pays once and records the refund in the settled route detail.
- The route-local effect is explicit input to route settlement and is excluded from the expedition-wide generation fingerprint, so it cannot reshuffle contracts, route topology, sectors, shops, rewards, or duration.
- Common Gangue Compression Die replaces the same starter/combat/lunar/route slot and modifies only lighter projectiles that exist before its ordered `onFire` stage.
- Eligible shots retain 90% velocity, gain 30% impact, one radius unit, 0.18 seconds of life, and the `plasma` trait; the strongest reference shots and later-created branches remain unchanged.
- Hardpoint cumulative cards and live-fire use the production hook path, making Split-then-Die report a `2.2 -> 2.6 impact` plasma conversion while Die-then-Split remains conditional.
- The active catalog remains at 60 items and the 29-item stress fixture substitutes Gangue for one prior `onFire` transform without increasing hook applications or proc limits.
- Upgrade Bay totals, restored snapshot compatibility, deterministic source-weighted fixtures, saves, accessibility modes, static hosting, dependencies, and work order 175 smoke tooling remain coherent.

Status: implemented. Low-Orbit Ore Scrip remains a retired catalog record and `onRouteChosen` hook solely for restored run snapshots. `RunUpgradeEffects.routeChosen` exposes the permanent flag; `RunSession.applyRouteOutcome` gives a fitted legacy copy precedence, appends one readable refund detail, and settles exactly one credit on Shop/Repair destinations. The upgrade is deliberately omitted from the global generation fingerprint.

Gangue Compression Die occupies the released common lunar slot as a bounded ordered transform. It compares the already-built volley against its peak impact, compacts only sub-90% branches, and adds plasma without creating shots, RNG draws, counters, or preview-only rules. Splitters before the Die produce denser plasma branches and unlock downstream plasma/arc/ricochet interactions; splitters after it remain untouched.

The unchanged managed-smoke defaults selected port 4175 and published `http://192.168.1.2:4175/StarbreakSalvage/` through JSON status. The in-app browser loaded that exact address, rendered all eleven permanent upgrades, and showed Low-Orbit Ore Scrip's 8 kg cost, Route Ledger Uplink prerequisite, and Shop/Repair refund. At 390x700 the Upgrade Bay remained exactly 390 px wide with no horizontal overflow and no captured console warnings or errors. `smoke:stop` then closed the listener and the original managed host shell returned exit code 0, so work order 179 requires no tooling adjustment.

Verification: `npm run verify:release` passes typecheck, ESLint, all 111 Vitest files and 695 tests, the production build, all 17 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The build emits 978.94 kB minified/267.88 kB gzip initial JavaScript and 93.32/18.78 kB CSS, increases of 1.56/0.46 kB JavaScript and no CSS change over work order 178. The existing 500 kB chunk notice remains; no dependency, save/snapshot schema, route topology, static base path, or warning threshold changed.
