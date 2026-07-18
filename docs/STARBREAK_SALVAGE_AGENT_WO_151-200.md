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
