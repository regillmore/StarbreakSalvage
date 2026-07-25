# Starbreak Salvage - Agent Work Orders 201-250

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repository first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Work order 201 - Cadence-cycle base DPS

Goal: give Hardpoint Control one trustworthy damage-throughput number derived from the current weapon and ordered circuit instead of asking players to mentally combine volley size, impact, cadence, and periodic procs.

Prompt:

> Add a Base DPS result to the Attack Simulation block. Measure direct projectile body damage across the fitted circuit's shortest complete periodic cadence cycle at the current weapon's baseline fire rate. Include real weapon, engineering, drone, ordered item, projectile-spawn, heat-shot, and periodic-volley output, while excluding target-dependent follow-up damage such as arc jumps, phase pierce, ricochets, explosions, temporary haste, and specials. Make the measurement boundary visible and keep the preview actor budget unchanged.

Acceptance criteria:

- Attack Simulation displays Base DPS as a sixth comparable stat with one decimal place and a draft-versus-committed delta.
- The value sums production projectile damage after engineering, ordered `onFire`, Micro-Choir, and `onProjectileSpawn` transforms, then divides the complete sample by its baseline firing time.
- The sample length is the least common multiple of every fitted periodic stage's effective cadence, including Prototype Vent shifts, with a documented hard cap.
- A non-periodic loadout uses one representative volley; mixed periodic circuits use their complete shared cycle and recompute when circuit order changes.
- Arc discharge, phase follow-up contacts, ricochet, area explosions, target geometry, specials, and temporary haste are not assumed to land and remain outside Base DPS.
- The explanatory note states the measured volley count, direct-projectile boundary, and excluded hit procs without relying on color.
- Damage sampling remains independent from the six-wave/48-projectile visual actor budget.
- Weapon swaps and circuit edits redraw the result immediately; the ordinary and periodic responsive Chromium paths remain free of horizontal overflow.
- No combat rule, save/snapshot field, generation stream, dependency, or static-hosting behavior changes.

Status: implemented. `FoundryPresentation` now derives an exact periodic cadence cycle from the fitted circuit, bounded at 420 volleys, and runs the existing production preview reducers across that damage sample. The visual preview consumes only its established first six waves and remains capped at 48 DOM projectiles. Base DPS counts direct projectile damage at the weapon's baseline cadence; the preview's existing arc, phase, missile, laser, drone, and heat descriptions continue to explain conditional identities separately.

`FoundryScene` adds Base DPS to the attack-stat comparison strip and places a concise non-color measurement note below it. Draft weapon swaps and circuit reorder redraws use the same authoritative dashboard model, so both value and committed delta update without a second state path.

Focused coverage verifies one-volley arithmetic, exclusion of stored arc discharge, five-versus-four-volley Prototype Vent ordering, a mixed 20-volley shared cycle, value changes after reordering, the unchanged 48-projectile visual cap, and responsive DOM semantics. Managed-browser inspection at 1280 x 720 showed six equal 110.8 px stat cards with no horizontal overflow. The Scenario Lab weapon swap changed Base DPS from 5.8 to 8.3 and exposed a +2.54 committed delta while retaining the five-volley measurement note. The authenticated smoke host and browser tab closed cleanly.

Verification: focused Foundry presentation coverage passes 26 tests and both affected Chromium paths pass. `npm run verify:release` passes typecheck, ESLint, all 115 Vitest files and 747 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,025.47 kB` minified / `281.35 kB` gzip initial JavaScript and `104.01 kB` / `20.77 kB` CSS, increases of `0.94 kB` / `0.40 kB` JavaScript and `0.43 kB` / `0.07 kB` CSS over work order 200. The existing Vite large-chunk advisory remains; no dependency, combat rule, save/snapshot schema, generation stream, static base path, actor/projectile cap, or warning threshold changed.

## Work order 202 - Launched beam projectile boundary

Goal: keep WO120's directional beam readable while making its luminous body behave like one launched projectile instead of a shape that can be dragged back into view by its scrolling indicator.

Prompt:

> Remove the telegraph trail behind an active beam so only the guide ahead of its leading edge remains. Separate the scrolling pre-fire indicator from the launched beam trajectory, freeze that trajectory at ignition, and keep the physical beam traveling until its tail fully clears the arena. Fix top-edge and other offscreen endpoints re-entering late in the lifecycle. Preserve deterministic direction and offsets, the shared endpoint velocity, the exact two-second fully-lit duration, world anchoring before launch, collision/render parity, allegiance-neutral piercing, pause-safe clocks, accessibility settings, and bounded work.

Acceptance criteria:

- The pre-fire track remains world-anchored and slides along true arena edges as sector scroll advances.
- Ignition records the actual world distance once and derives an immutable projectile trajectory from that launch position; subsequent sector scroll cannot translate or rotate the bolt.
- An active dashed guide is clipped only from the physical head forward. No dashed track, markers, emitter, or endpoint reticle remains behind the head or during tail clearing.
- The physical head flare is drawn only while the true head overlaps the viewport. Arena-clipped crossings use flat boundary cuts instead of manufacturing a stationary round head at an edge.
- The luminous body, collision capsule, and environment damage samples share the same clipped launched segment through entry, two-second full illumination, and complete tail departure.
- Top-origin and other offscreen routes cannot detach an endpoint from the arena edge or scroll a departed endpoint back into view.
- Scroll holds, recovery settlement, boss suppression, reduced motion, performance mode, high contrast, deterministic plans, saves, and static hosting remain compatible.

Status: implemented. `SectorHazardRuntime` now captures one transient launch-world distance when a warning beam enters its active phase. `BeamHazard` continues to translate the pre-fire world track from live scroll, but builds the active projectile from that frozen launch anchor. Its presentation model exposes the clipped bolt, forward-only leading guide, and true visible head/tail points as separate geometry. Collision and world damage continue to request the same clipped bolt segment.

`CanvasRenderer` no longer draws the complete dashed track, source emitter, or tracking marks behind an active bolt. It renders only the remaining guide ahead of the head, removes that guide after the head exits, uses flat active boundary cuts, and paints the flare at the physical head rather than the clipped arena endpoint. The shared 960 unit/second endpoint velocity and exact two-second fully-lit dwell are unchanged.

Focused coverage pins immutable launch geometry across large post-launch world-distance changes, the top-origin endpoint regression, exact bolt/guide joins during entry, absent guide and head during clearing, visible moving tail, runtime launch capture, pause-safe timing, piercing collisions, and the existing timing contract. The managed browser loaded the current build, entered gameplay, and exposed the seeded directional route `LEFT 23% to BOTTOM 41%`; the live lifecycle capture was interrupted when the task-length host expired during a disposable profile reset and the protected network-error tab then blocked re-entry. The host stopped cleanly, and no alternate browser surface was used.

Verification: `npm run verify:release` passes typecheck, ESLint, all 115 Vitest files and 748 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,026.55 kB` minified / `281.72 kB` gzip initial JavaScript and unchanged `104.01 kB` / `20.77 kB` CSS, an increase of `1.08 kB` / `0.37 kB` JavaScript over work order 201. The existing Vite large-chunk advisory remains; no dependency, authored hazard plan, RNG stream, save/snapshot schema, static base path, damage value, velocity, duration, actor/projectile cap, or warning threshold changed.

## Work order 203 - Permanent Crater Shadow and Penumbra Crown

Goal: move Crater Shadow Lens's passive sector-entry charge into permanent progression and refill its common lunar slot with a readable ordered-chain bridge into phase and plasma builds.

Prompt:

> Retire Crater Shadow Lens from active run rewards and move its sector-entry special-charge reading into the permanent scrap Upgrade Bay. Preserve restored-run behavior without allowing the old item and new upgrade to stack. Add a common replacement whose benefit depends on a multi-shot volley already existing earlier in the ordered weapon chain. Keep entry settlement and weapon generation deterministic, previews honest, active catalog breadth stable, and the managed smoke-host lifecycle reliable.

Acceptance criteria:

- Crater Shadow Lens is absent from active discovery and reward pools and appears as a 9 kg permanent Archive upgrade gated by Relic Pattern Dossier.
- The permanent and restored-item forms each grant 8% special charge on Lunar entry and 2% elsewhere; owning both applies exactly one reading.
- The permanent flag is excluded from the expedition generation fingerprint and adds no save/snapshot schema field or RNG draw.
- Common Penumbra Crown Aperture replaces the same starter/combat/lunar pool position, rarity, weight, source profile, family, and phase/plasma identity.
- Aperture remains inert until an earlier circuit stage has created at least two shots. It deterministically selects the shot nearest the current volley's projected centerline.
- The selected shot retains body impact, travels at 92% velocity, gains one radius unit and 0.18 seconds of life, and gains both `phase` and `plasma`; every other current shot and every later-created shot remains unchanged.
- Hardpoint cumulative output reports the met/unmet multi-shot condition, transformed traits, geometry, and flight tradeoff through the production hook path.
- The active catalog remains at 60 items, the complete compatibility catalog grows to 75 definitions, and the bounded stress fixture replaces the retired entry without increasing item count, projectile count, RNG, or proc budgets.
- Deterministic weighted rewards, Upgrade Bay semantics, restored snapshots, accessibility settings, static hosting, dependencies, and managed browser tooling remain coherent.

Status: implemented. Crater Shadow Lens remains a retired content record and `onSectorStart` hook solely for restored run snapshots. `SectorStartUpgradeEffects.craterShadowLens` carries the permanent form to combat, where a fitted legacy copy takes precedence before the exact 8% Lunar / 2% ordinary charge reading is applied. The upgrade is deliberately omitted from the generation fingerprint and uses the existing save-v5 purchased-upgrade list.

Penumbra Crown Aperture occupies the released common lunar slot as a bounded ordered `onFire` transform. It computes the current volley's projected horizontal center, modifies one nearest shot, and leaves damage and projectile count unchanged. Upstream Split, Clone, Drone, Missile, and native multi-shot stages can feed it; downstream plasma, phase, arc, ricochet, laser, and trait-count stages consume its output normally. The Hardpoint card states when no earlier multi-shot exists and shows the live phase/plasma conversion when the order is satisfied.

Focused coverage protects permanent/restored precedence, Lunar and ordinary charge values, generation-fingerprint neutrality, active/compatibility breadth, source-weighted reward snapshots, exact centerline selection, reverse-order neutrality, Hardpoint condition copy, the unchanged 29-item stress fixture, and the 18-card Upgrade Bay. The managed in-app browser loaded the documented host, rendered Crater Shadow Lens beside the existing Archive upgrades with correct cost/prerequisite/effect copy, reported 18 cards, and remained inside the established responsive scrolling panel. The authenticated stop command closed the host and its original shell returned exit code 0.

Verification: `npm run verify:release` passes typecheck, ESLint, all 115 Vitest files and 752 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,028.34 kB` minified / `282.16 kB` gzip initial JavaScript and unchanged `104.01 kB` / `20.77 kB` CSS, an increase of `1.79 kB` / `0.44 kB` JavaScript over work order 202. The existing Vite large-chunk advisory remains; no dependency, save/snapshot schema, generation stream, route topology, static base path, actor/projectile/effect cap, or warning threshold changed.

## Work order 204 - Contract arena command frame

Goal: make the fixed combat arena feel like the selected ship's cockpit display and move essential status from a detached page header onto a readable frame surrounding the action.

Prompt:

> Rebuild the live combat HUD around the exact gameplay safe frame. Give every contract theme its own code-native frame dialect, keep the arena itself unobstructed where viewport space permits, and place hull, special, bombs, heat, distance, reserves, weapon state, objective progress, immediate warnings, and boss state close to the playfield. Preserve the WO178 pause-dossier boundary, fixed combat geometry, responsive input mapping, accessibility settings, and deterministic simulation.

Acceptance criteria:

- A persistent DOM frame is aligned to the exact `gameplaySafeFrame` rectangle and updates when viewport class or dimensions change.
- Wide viewports place contract identity, meters, weapon state, and mission state in side consoles outside the arena; standard and narrow viewports stack the same rails in the reserved space above and below it.
- The page-top cockpit strip is reduced to ship identity plus compact act/sector/stage context instead of duplicating the action HUD.
- Hull, special, bombs, and heat retain their semantic meters and live values. Distance, exact hull/reserves, weapon state, objectives, warnings, urgent hints, boss state, and apex state retain text cues.
- Redline, Parish, Ledger, Phase, Aegis, Scrap, Warranty, and Relic themes each expose a distinct mark/designation and frame treatment derived from the selected contract.
- The canvas boundary and motion rails use the selected ship's primary and engine colors; the Phase boundary keeps a non-color dashed cue.
- Frame rails remain noninteractive, do not alter arena size or pointer mapping, and fade with the existing sector-exit sequence.
- Reduced-motion and performance modes stop frame scanning and remove heavy glow. High contrast uses white boundaries, yellow corners, and opaque panels.
- Narrow 390 x 700 layout keeps meter banks above the arena, mission/weapon rails below it, the top strip within its prior 156 px ceiling, and all visible rails within the viewport.
- Saves, snapshots, route/sector generation, fixed-step combat, actor/projectile/effect caps, pause dossier, static hosting, and dependency count remain unchanged.

Status: implemented. `ArenaHudFrame` derives the exact CSS geometry, side-versus-stacked rail mode, and eight contract dialects from the existing viewport and ship-theme authorities. `GameplayScene` mounts one persistent boundary, four corners, a contract designator, two meter banks, and navigation/weapon/mission rails. Layout synchronization is cached by the safe-frame rectangle, while ordinary meter and readout mutation continues through the existing live HUD path.

`CanvasRenderer.paintGameplayFrame` now accepts the selected ship appearance so its arena outline, motion rails, and gutter fades agree with the DOM cockpit. No gameplay layer, collision boundary, camera transform, or input mapping changed. The slim top strip retains contract and mission context; low-urgency economy, build, route, ledger, and support detail remain in the WO178 pause dossier.

Focused coverage protects all eight dialects, exact 1280 x 720 and 390 x 700 frame geometry, side-console placement outside the wide arena, stacked meter/mission placement around the narrow arena, and the previous narrow top-HUD ceiling. The managed in-app browser rendered a Relic Thief `VAULT SIGHT` frame at the documented host with themed border glow, contract-colored canvas rails, meters flanking the action, and lower weapon/mission consoles. The tab, authenticated host, and original host shell closed cleanly.

Verification: `npm run verify:release` passes typecheck, ESLint, all 116 Vitest files and 755 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,031.51 kB` minified / `283.19 kB` gzip initial JavaScript and `113.05 kB` / `22.25 kB` CSS, increases of `3.17 kB` / `1.03 kB` JavaScript and `9.04 kB` / `1.48 kB` CSS over work order 203. The existing Vite large-chunk advisory remains; no dependency, save/snapshot schema, generation stream, route topology, static base path, simulation cap, or warning threshold changed.

## Work order 205 - Circuit acquisition dossiers

Goal: make circuit upgrades easy to compare at acquisition time without repeating rarity, source, family, implementation state, tags, price, and prose as one dense text stack.

Prompt:

> Distill and refresh the shared circuit-upgrade card used by the shop, sector rewards, archive, and run summary. Give each card a clear identity, activation trigger, effect, role tags, and context action while preserving authored item meaning, keyboard access, responsive fit, and deterministic acquisition.

Acceptance criteria:

- Shared cards separate rarity/source, item name, circuit family, activation trigger, authored effect, role tags, and contextual footer instead of emitting a pipe-delimited metadata sentence.
- Trigger copy is derived from authoritative item hooks, including a compact combined readout for the small number of multi-hook items.
- Fully implemented items do not spend a badge on the redundant `Live effect` label; bridge and planned compatibility states remain visibly identified.
- Shop cards expose price and `Buy circuit` as stable footer elements and use a stacked trigger/effect strip at the four-column card width.
- Sector rewards use the same shared hierarchy with a `Take circuit` action and retain the bounded one-page five-choice manifest.
- Archive cards retain effect and trigger context; run-summary cards retain their compact no-effect form and acquisition location.
- Rarity remains explicit text as well as a visual accent. High contrast supplies opaque signal panels and non-color trigger boundaries.
- Existing item icons, item definitions, effects, hooks, weights, prices, pools, ownership, saves, reward/shop RNG, static hosting, and dependencies remain unchanged.

Status: implemented. `ItemCardViewModel` now translates the authoritative hook list into a bounded activation label while retaining authored rarity, source, family, effect, tags, price, and acquisition context as separate fields. `ItemCard` renders those fields as a compact circuit dossier: identity header, trigger-to-effect signal strip, restrained role-tag rail, price, and contextual action. The common live-status badge is suppressed, while non-live compatibility states remain explicit.

`ShopScene` and `RewardScene` supply only their local action context. Four-column shop cards stack trigger above effect to preserve readable line length; reward, archive, and summary surfaces reuse the same renderer with their established compact/effect options. No acquisition or gameplay system consumes presentation state.

Focused view-model coverage protects all hook labels, multi-hook joins, price/acquisition context, and bridge/planned states. The primary Chromium sector-loop path protects the reward one-page fit plus reward, archive, and summary consumers. Managed-browser inspection at 1280 x 720 showed four equal `226.25 x 277.77` shop cards, four trigger strips, no redundant live badges, and no horizontal page overflow.

Verification: `npm run verify:release` passes typecheck, ESLint, all 116 Vitest files and 756 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,033.03 kB` minified / `283.54 kB` gzip initial JavaScript and `116.84 kB` / `22.83 kB` CSS, increases of `1.52 kB` / `0.35 kB` JavaScript and `3.79 kB` / `0.58 kB` CSS over work order 204. The managed browser reported no console warnings or errors, and its tab plus authenticated smoke host closed cleanly. The existing Vite large-chunk advisory remains; no dependency, item definition, hook behavior, price, reward/shop RNG, save/snapshot schema, static base path, or warning threshold changed.

## Work order 206 - Three-slot circuit market

Goal: bring the base shop circuit rack back to the same bounded three-choice scale as sector circuit rewards while keeping earned stock expansion meaningful.

Prompt:

> Reduce the base shop circuit inventory and desktop grid from four cards to three. Keep explicit act, route, permanent, item-hook, and reroll stock effects additive, preserve stable depleted slots and deterministic choice order, and align the wider shop dossiers with the established reward-card presentation.

Acceptance criteria:

- A stock-neutral Act I market generates exactly three circuit slots and rerolls exactly three replacements.
- `SHOP_BASE_CIRCUIT_STOCK` is the single code authority used by generation, the live shop, deterministic projections, and navigation copy.
- Act economy, route outcomes, permanent upgrades, restored item hooks, and engineering hooks can still add stock above the three-slot baseline without hidden caps.
- Purchasing a circuit leaves its slot visibly empty; leaving and reopening preserves depletion; reroll refills the same current stock width.
- The desktop shop grid presents three equal columns and reuses the reward-style side-by-side trigger/effect signal strip. The established narrow breakpoint still collapses to one column.
- The primary-weapon offer remains a separate one-crate rack and is not counted as one of the three circuit slots.
- Retained seeded offers preserve their prior order, prices, and source hints; only the former fourth base offer is omitted.
- Saves, snapshots, item pools, weights, ownership, reroll seeds, accessibility settings, static hosting, and dependency count remain unchanged.

Status: implemented. `Shops` now exports one three-slot baseline consumed by both default inventory generation and `ShopScene` before earned stock modifiers. Act economy and hook-based additions remain downstream of that baseline. The navigation service dossier reads the same constant and now advertises `3+ seeded offers`.

The shop grid falls through to the shared three-column reward grid and shared side-by-side signal strip. Purchase, persistent depletion, and reroll behavior are unchanged. Focused deterministic coverage pins the three-slot default, the four-slot Act II surface, the five-slot progressed surface, route/permanent additions, and retained choice order. The primary Chromium shop path pins the hub readout, exact three-card Act I stock, separate weapon rack, depletion persistence, and reroll refill.

Managed-browser inspection at 1280 x 720 rendered three equal-width circuit dossiers beneath the independent primary-weapon rack, each with the reward-style trigger/effect split. The live DOM reported three shop cards and three signal strips, the navigation hub reported `3+ seeded offers`, browser logs contained only Vite connection diagnostics, and the authenticated smoke host stopped cleanly.

Verification: `npm run verify:release` passes typecheck, ESLint, all 116 Vitest files and 757 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,033.03 kB` minified / `283.53 kB` gzip initial JavaScript and `116.53 kB` / `22.78 kB` CSS, changes of `0.00 kB` / `-0.01 kB` JavaScript and `-0.31 kB` / `-0.05 kB` CSS from work order 205. The existing Vite large-chunk advisory remains; no dependency, item definition, pool, price, reward/shop RNG stream, save/snapshot schema, static base path, or warning threshold changed.

## Work order 207 - Upgrade-owned market capacity

Goal: remove passive act and route growth from the circuit market so additional shop slots are an explicit permanent-progression benefit.

Prompt:

> Suppress the Act II bonus shop slot and its `market +stock` readout. Make permanent scrap upgrades the only live source of circuit-rack expansion while preserving useful shop-route terms, deterministic stock, restored-run compatibility, and the three-slot presentation established in work order 206.

Acceptance criteria:

- Fresh Act I, Act II, finale, and frontier markets all begin from the shared three-circuit baseline; act escalation never adds a slot.
- Act II retains its authored price, reroll, repair, reward, and loose-currency pressure, but its market readout contains no stock modifier.
- Shop-route outcomes retain their deterministic price discount and inventory bias without adding capacity or claiming an extra slot.
- Market Decoder remains the permanent always-on stock expansion, while Convoy Receipt Printer remains the permanent reroll-only expansion.
- A restored retired Convoy Receipt Printer item remains a compatibility equivalent and cannot stack with its permanent upgrade. Already materialized saved shop rolls retain their stable slots and depletion state.
- The navigation market dossier states that routes affect price and inventory focus, while Upgrade Bay effects own additional slots.
- Removing a fourth passive choice preserves the first three seeded items, prices, source hints, isolated RNG streams, saves, static hosting, and dependency count.

Status: implemented. `ActEconomyProfile` no longer carries shop capacity, and `generateShopInventory` no longer adds act stock. `RouteShopModifier` and the route-hook payload no longer expose a stock field; shop routes now supply only discount and deterministic bias. `ShopScene` constructs new racks from `SHOP_BASE_CIRCUIT_STOCK` plus the permanent Upgrade Bay projection, while the existing permanent Convoy reroll path and restored-item precedence remain intact.

Fresh Act II snapshots now contain three circuits instead of four, and the progressed Market Decoder snapshot contains four instead of five. The omitted former final choices leave each retained deterministic prefix unchanged. Focused coverage also pins the stock-neutral route result, exact Act II price/reroll readout, permanent expansion, and restored market hooks.

Managed-browser inspection used the authenticated smoke host and a clean disposable tab. The navigation dossier advertised `3+ seeded offers` and explicitly assigned slot growth to the Upgrade Bay. The live market rendered three equal `305.7 px` circuit cards with no `market +1 stock` copy, no horizontal overflow, and no warning or error logs. The browser tab finalized; both bounded host leases reached their task timeout, and the required authenticated stop confirmed that no project-owned host remained.

Verification: `npm run verify:release` passes typecheck, ESLint, all 116 Vitest files and 757 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,032.78 kB` minified / `283.46 kB` gzip initial JavaScript and unchanged `116.53 kB` / `22.78 kB` CSS, reductions of `0.25 kB` / `0.07 kB` JavaScript from work order 206. The existing Vite large-chunk advisory remains; no dependency, item definition, pool, price formula, save/snapshot schema, static base path, or warning threshold changed.

## Work order 208 - Aegis retaliation circuits

Goal: preserve the Shield Bruiser fantasy while replacing its situational self-damage counterfire with a proactive, ordered weapon-chain archetype.

Prompt:

> Overhaul Shield Bruiser and the shield/revenge item family for the signal-circuit model. Build retaliation pressure through normal firing cadence, let downstream cards visibly consume earlier shield/revenge shots, and remove hull damage as the family trigger. Preserve the shared seeded ignition pool, deterministic combat, bounded projectile output, compatibility ids, and honest Hardpoint preview.

Acceptance criteria:

- Shield Dynamo is a viable opening core: every fourth volley pressurizes all shots already built before it, increasing direct impact and adding shield/revenge identity without requiring damage.
- Reactive Plating Grid provides a common independent pressure source by copying at most two earlier outer shots into armored retaliation plates every third volley.
- Counterclaim Repeater, Revenge Beam, and Oathbound Deflector remain inert until retaliation pressure exists earlier in circuit order, then respectively reissue bounded paired slugs, add one focused beam, or grant one wall rebound and longer flight.
- Cursed Hull Plate becomes a cross-family downstream payoff that amplifies earlier retaliation shots and emits one bounded cursed rupture fan.
- Moving a consumer before its pressure source visibly disables it; Hardpoint cards state the met/unmet condition, affected shot count, cadence, and output.
- Shield/revenge tags count as circuit traits for Crossfeed and related trait-count consumers. Split, clone, laser, ricochet, curse/overkill, and Prototype Vent stages retain natural ordered interactions.
- Retaliation shots carry a distinct code-native hex shield and amber pressure wake in combat and Attack Simulation, with reduced-motion, performance, and high-contrast treatments.
- Shield/revenge items no longer dispatch from `onPlayerHit`; taking hull damage alone produces no family counterfire. Curse-Eater remains an explicit curse/relic reactive exception.
- Shield Bruiser, unlock, archive, circuit-family, and debrief copy describe proactive Aegis Retaliation rather than damage-triggered revenge.
- Item ids, active pool breadth, shared ignition selection policy, saves, snapshots, generation streams, proc/projectile caps, dependencies, and static hosting remain compatible.

Status: implemented. Shield Dynamo and Reactive Plating Grid now establish bounded periodic retaliation pressure through ordered `onFire` stages. Counterclaim Repeater, Revenge Beam, Oathbound Deflector, and Cursed Hull Plate consume only pressure already present before their circuit position. The family no longer listens to player-hit or boss-phase events; the surviving Curse-Eater hit response remains in the separate curse/relic lane.

`FoundryPresentation` runs these items through the same production reducer used by combat and adds exact pressure-source and downstream condition copy. Periodic stages participate in the existing complete-cadence DPS sample and Prototype Vent cadence shift. Shield plus revenge now satisfy two-trait circuit consumers, allowing Crossfeed to recognize the new chain without a special bridge.

`RetaliationProjectile` derives one deterministic repeating visual profile from projectile age, radius, and velocity. `CanvasRenderer` paints a green hex pressure shell and amber return wake behind any revenge-tagged projectile; Attack Simulation uses a matching nested field, while accessibility modes bound or stop the animation.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 761 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,037.35 kB` minified / `284.47 kB` gzip initial JavaScript and `117.57 kB` / `23.00 kB` CSS, increases of `4.57 kB` / `1.01 kB` JavaScript and `1.04 kB` / `0.22 kB` CSS over work order 207. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, generation RNG stream, active item count, or static-hosting rule changed.

The managed in-app browser reached the seeded title and contract comparison without an application warning. Its first longer inspection outlived the authenticated host lease, and the browser declined the subsequent local reload under its URL policy, so no manual retaliation-visual claim is recorded. The independent release Chromium suite completed the gameplay, item-storm, Hardpoint, responsive, accessibility, and production-preview paths cleanly.

## Work order 209 - Seed-neutral title restoration

Goal: keep suspended-run identity inside the snapshot while returning every exit to one consistent title-screen launch experience.

Prompt:

> Fix the sequence where resuming a random expedition and suspending it a second time turns the title into seeded mode. A saved expedition seed must never impersonate a URL-loaded seed. Flatten the unnecessary seeded/random title differences while retaining URL code prefill, deterministic resume, manual code entry, and Retry Last Seed.

Acceptance criteria:

- Restoring a run snapshot restores its generated seed, run skeleton, contract, and session without copying that seed into the title's expedition-code input state.
- A fresh random launch followed by Suspend & Exit presents the common title, an empty code field, and no `seed` URL parameter.
- Resuming that snapshot and immediately suspending a second time produces the same common title state; repeating the cycle cannot progressively convert the menu into seeded presentation.
- The launch panel uses one heading, explanation, status line, and `Start Expedition` label whether the code field is blank or prefilled.
- A `seed` URL parameter still prefills and opens the expedition-code drawer, and the common start action still launches that deterministic code.
- Manually entered codes, Retry Last Seed, debrief share links, random seed generation, snapshot summaries, and resume determinism remain available.
- Suspension does not rewrite browser history or add/remove URL parameters. The established completed-run return continues to remove an authored `seed` parameter.
- Save and snapshot schemas, migrations, run-generation streams, static hosting, accessibility, and dependencies remain unchanged.

Status: implemented. `GameApp.resumeRunSnapshot` now restores gameplay identity without mutating `seedEntryInput`, which remains title-entry state rather than a mirror of the active run. Random snapshot restoration therefore cannot manufacture a seeded title or populate the code field.

`MainMenuScene` uses one contract-channel presentation and one `Start Expedition` action for blank, URL-prefilled, manually entered, and restored contexts. A prefilled value still opens the existing code drawer and determines the launch seed; it no longer changes the masthead copy, button label, or status language. Retry Last Seed remains a neighboring explicit action whenever a completed-run seed exists.

Focused Chromium coverage reproduces the reported fresh-save sequence: launch random, suspend at the initial constellation, resume, immediately suspend again, resume into gameplay, suspend, reload, and resume once more. Every intervening title retains an empty code field and a URL without `seed`, while the snapshot continues restoring the same generated expedition.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 761 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,037.13 kB` minified / `284.38 kB` gzip initial JavaScript and unchanged `117.57 kB` / `23.00 kB` CSS, reductions of `0.22 kB` / `0.09 kB` JavaScript from work order 208. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, generation stream, URL-sharing path, or static-hosting rule changed.

## Work order 210 - Constellation apex pursuits

Goal: turn each apex from a loose itinerary encounter into a seeded act-long hunt whose route is discovered and protected through the constellation.

Prompt:

> Give every act one hidden seeded apex pursuit track through layers 1, 2, 3, and 4 of its route graph. Completing the marked pursuit contact in each sector reveals the correct child signal; choosing another child or leaving without securing the contact lets that act's apex escape. Spawn the apex body only at the tracked fourth-layer destination and communicate the route lock and break clearly in navigation.

Acceptance criteria:

- Each act deterministically assigns one distinct apex threat to one valid four-node path through constellation layers 1-4. Every adjacent step follows an authored act-route edge.
- Trace, escort, and lieutenant contacts occupy the required gate operation on layers 1-3. The apex finale occupies the required gate operation on exactly one layer-4 node; apex bodies never spawn on another layer.
- A later contact is unavailable until every preceding pursuit step has succeeded or partially succeeded. Failed or skipped contacts do not unlock the next contact.
- Completing a pursuit step reveals only the next seeded node. Later route locations and all future-act tracks remain encrypted until progression reaches them.
- Route-choice nodes distinguish the confirmed apex track from choices that break it. Their detail cards state `TRACK LOCK` or `TRACK BREAK`, and committing the latter explicitly releases the apex.
- Advancing to the revealed child preserves the hunt. Advancing elsewhere, advancing without completing the current step, or leaving an unresolved layer-4 contact records one bounded apex escape event.
- The current-sector briefing, Signal Vault, combat contact banner, and apex HUD readout agree on contact stage, path status, and outcome.
- The existing apex subsystem damage, finale pressure, disposition choices, unlocks, timeline bounds, boss/projectile/effect caps, snapshots, accessibility settings, static hosting, and dependencies remain coherent.

Status: implemented. `ApexPursuitTrack` now derives one four-step path per act directly from the 1-2-3-2-1 route graph using named seed forks. `ApexHunt` assigns the three threat definitions across those act tracks, binds all contacts to the guaranteed gate operation, enforces sequential completion, withholds later locations, and exposes one current-act navigation read model.

`RunSession.advanceSector` checks the committed edge against the newly revealed target before resetting the next sector. A missing contact, a wrong child, or departure from an unresolved apex body records the established `escape` event once. `GameApp` now asks the state-aware encounter selector before adding any apex combat presentation, preventing an isolated later-route node from spawning a contact.

The navigation constellation gives the confirmed child a cyan pursuit lock and gives every other open child an explicit track-break treatment. The selected destination dossier repeats that consequence before commitment, while the current-node briefing explains whether the local contact still needs to be secured, has revealed the next signal, has reached the apex body, or has escaped. Future steps remain `Route signal encrypted` in the Signal Vault.

Focused coverage protects deterministic three-act paths, valid layer-4 finales, sequential encounter gating, one-step reveal, correct-edge continuation, off-track escape, missed-step escape, snapshot restoration, scenario fixtures, endurance bounds, and the complete first-sector Chromium flow.

Managed-browser inspection followed `STARBREAK-SMOKE` through the opening contact and reward. The post-sector constellation rendered one cyan `[CHOIR] TRACK` child and one red `BREAKS TRACK` child, with matching `TRACK LOCK` detail and a tracked-destination commit action. The live DOM confirmed the two distinct signal states and their authored colors before the controlled tab finalized.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 763 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,042.18 kB` minified / `285.78 kB` gzip initial JavaScript and `118.77 kB` / `23.20 kB` CSS, increases of `5.05 kB` / `1.40 kB` JavaScript and `1.20 kB` / `0.20 kB` CSS over work order 209. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, constellation node or edge, route choice count, projectile/effect budget, or static-hosting rule changed.

## Work order 211 - Apex circuit spoils

Goal: make a completed apex pursuit leave a build-defining weapon-chain prize tied to the defeated threat rather than another generic reward roll.

Prompt:

> Add two exclusive circuit upgrades for each of the three apex enemies. After the player defeats and resolves an apex, deterministically select one of that threat's two upgrades and replace one ordinary sector-reward circuit choice with it. Keep the reward manifest the same size and make each pair express the apex's combat identity through ordered chain interactions.

Acceptance criteria:

- Grave Choir owns Funeral Refrain Array and Mnemonic Sepulcher Key: periodic phased drone echoes plus a downstream phase/drone memory transform with longer flight and heavy arc.
- Crownless Engine owns Claimant Mantle Press and Empty Throne Coronation: missile/overkill shots forged into retaliation shells plus a periodic heavy plasma-overkill crown.
- Pale Convoy owns Exodus Rail Switch and Passenger Coffer Manifest: outer branches cross lanes under phase plus periodic lighter-branch copies that travel as arc escorts.
- The six definitions are live, unique, source-tagged `apex`, absent from ordinary starter/combat/vault pools, and mapped exactly two-to-one across the three apex definitions.
- Only a resolved apex finale can inject its prize. Tracked, escaped, non-finale, and ordinary sector rewards remain unchanged.
- Selection between the two associated spoils is deterministic for the run, save fingerprint, apex identity, and finale sector. An already-owned pair member is excluded.
- The apex spoil replaces the final ordinary circuit option. It never adds a card, changes the permanent reward-choice budget, or affects the independent primary-weapon and credit choices.
- The reward card carries an explicit apex-spoil flag, threat identity, accessible label, and distinct non-color boundary treatment.
- Hardpoint circuit cards expose met/unmet upstream requirements and periodic cadence using the production hook result; combat and Attack Simulation share the same reducers.
- Existing pursuit paths, disposition outcomes, unlocks, reward RNG prefixes, saves, snapshots, proc/projectile caps, dependencies, and static hosting remain coherent.

Status: implemented. `ApexThreatDefinition` now owns the authoritative two-item spoil pair. `ApexRewards` recognizes only a resolved threat at its tracked finale, chooses one available member through a dedicated deterministic seed, and returns an apex-marked reward choice. `SectorRewards` preserves the complete ordinary roll and then replaces its final circuit choice, so choice breadth and all retained ordinary choices stay stable.

The six items are exclusive to a small `apex` reward pool used for content validation and source presentation, not ordinary weighted generation. Their ordered `ItemHooks` implementations reuse phase traversal, arc charge, drone attribution, retaliation traits, periodic cadence, and Prototype Vent integration already shared by combat and previews. `FoundryPresentation` explains the upstream signal requirement and resulting output without maintaining a second mechanic.

`RewardScene` adds one compact `[CUE] APEX SPOIL` flag, threat metadata, and an accessible threat-specific label while retaining the shared circuit dossier. Focused tests protect the six unique assignments, source exclusivity, all three ordered identity pairs, deterministic replacement at every apex finale, unchanged reward count/prefix, and Hardpoint condition copy.

Scenario Lab now includes a disposable `Apex Circuit Spoils` case that resolves the seeded act-one apex at its tracked finale and opens the production reward scene. This keeps the reward substitution, accessible flag, one-page layout, and visual boundary reproducible without teaching the ordinary force-complete shortcut to counterfeit an apex defeat.

Managed-browser inspection opened that fixture at `SCENARIO-LAB-APEX-SPOILS`. The live reward grid reported three circuit choices, five total choices, and exactly one apex reward; its Crownless Engine card had the authored spoil label and non-color boundary, the 600 px panel fit without scrolling, and the browser console contained no errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 769 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,050.38 kB` minified / `287.72 kB` gzip initial JavaScript and `119.26 kB` / `23.33 kB` CSS, increases of `8.20 kB` / `1.94 kB` JavaScript and `0.49 kB` / `0.13 kB` CSS over work order 210. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph mutation, reward-choice count, combat budget, or static-hosting rule changed.

## Work order 212 - Quiet apex constellation mark

Goal: restore one consistent visual meaning for available constellation destinations while giving the apex pursuit a reusable non-color identity.

Prompt:

> Remove the strong cyan tracked-node and red track-break recolors from available constellation choices. Return every ready destination to the established gold card treatment, then replace the tracked sector's ordinary bullet with a new shared apex glyph whose silhouette can carry into other apex surfaces.

Acceptance criteria:

- Every available next-sector node uses the same gold border, background, pulse, hover, focus, and selected treatment regardless of apex alignment.
- The confirmed apex-track child replaces its ordinary sector diamond with one original code-native tri-vector glyph. Off-track and unrelated nodes retain their ordinary glyphs.
- The apex mark inherits the node's current color, so it remains identifiable by shape without introducing another route-status hue.
- `TRACK` and `BREAKS TRACK` text, destination dossier warnings, accessible labels, and commit consequences remain explicit; the quieter node styling does not hide the routing decision.
- The glyph has one reusable DOM renderer and stable identity attribute rather than copied SVG fragments or a font-dependent symbol.
- Focused and overview constellation modes retain their existing geometry, pulse behavior, keyboard navigation, route legality, deterministic pursuit state, and responsive layout.
- Work order 213 reuse plan: apply the same base mark to the Signal Vault service node, destination pursuit dossier, live apex-contact HUD/banner, Apex Dossier masthead, and apex-spoil reward provenance. Consumers may change scale and current color only; none should redraw the silhouette.
- No asset request, save/snapshot field, migration, route graph change, RNG draw, gameplay mutation, dependency, or static-hosting change is introduced.

Status: implemented. `ApexGlyph.createApexGlyph` owns an original three-vector signal converging on an open core. `ConstellationMap` accepts an explicit glyph kind and embeds that renderer only for a tracked apex child; its button label retains the threat cue and track state for assistive technology.

`SectorTransitionScene` no longer substitutes a generic star. Both `apex-track` and `apex-break` destinations remain ordinary `choice` nodes, and their former cyan/red CSS overrides are removed. All available sector bullets now inherit the established gold, while the tracked child is differentiated by the tri-vector silhouette and the existing text/dossier consequence.

Managed-browser inspection followed `STARBREAK-SMOKE` through its first sector reward into the live pursuit fork. Focused and full-act views kept both route cards on the shared gold treatment (`rgb(255, 209, 102)`), the tracked child alone rendered one `tri-vector` glyph at `21.6 px`, and the off-track child retained its ordinary diamond plus explicit `BREAKS TRACK` copy. No application errors appeared in the browser console.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 769 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,051.31 kB` minified / `288.04 kB` gzip initial JavaScript and `118.62 kB` / `23.24 kB` CSS, a change of `+0.93 kB` / `+0.32 kB` JavaScript and `-0.64 kB` / `-0.09 kB` CSS from work order 211. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph mutation, deterministic draw, gameplay system, or static-hosting rule changed.

## Work order 213 - Shared apex visual language

Goal: make the tri-vector mark a consistent navigational and combat signifier across the full apex pursuit loop.

Prompt:

> Reuse the work order 212 apex glyph wherever the player enters, follows, encounters, studies, or claims a reward from the apex system. Preserve each surface's existing hierarchy and color language instead of introducing another global apex palette.

Acceptance criteria:

- The Signal Vault carrier-service node replaces its generic service glyph with the shared tri-vector, and its selected pursuit-network metric repeats the mark.
- Current-sector and route-choice apex pursuit metrics carry the mark for both track-lock and track-break explanations without weakening their explicit text consequences.
- Active apex combat adds the mark to both the compact weapon-rail readout and the temporary contact banner; both remain hidden when no apex encounter presentation exists.
- The Apex Dossier masthead carries a larger mark beside its existing title while preserving its labelled heading, threat tabs, resolution state, narrow layout, and keyboard focus.
- An apex-spoil reward flag carries the mark beside its authored threat cue, while its accessible threat/item label and the fixed reward manifest remain unchanged.
- Every placement calls `createApexGlyph`; no consumer copies or alters the tri-vector paths. Placement may change scale and inherit the surface's current color only.
- The decorative SVG remains hidden from assistive technology. Existing text continues to communicate service, pursuit, encounter, dossier, and reward meaning without relying on the mark.
- Focused browser coverage exercises all five surface families and verifies the stable `tri-vector` identity.
- No pursuit state, encounter schedule, route graph, reward eligibility, reward count, save/snapshot field, migration, RNG draw, dependency, or static-hosting change is introduced.

Status: implemented. `SectorTransitionScene` now assigns the apex glyph kind to the Signal Vault service node and decorates its pursuit-network, current-contact, and route consequence metrics through the same renderer. Ordinary services, route legality, and explicit track/break copy are unchanged.

`GameplayScene`, `ApexDossierScene`, and `RewardScene` reuse the renderer for the active combat rail and banner, the dossier masthead, and apex-spoil provenance. Surface-specific classes control only size, placement, and inherited color; `aria-hidden` remains owned by the shared SVG while the established text and labels retain semantic authority.

Managed-browser inspection followed `STARBREAK-SMOKE` from Signal Vault through the opening contact and first route choice, then opened the deterministic apex-hunt and apex-spoil Scenario Lab fixtures. The mark measured `21.6 px` on the service node, `12.8 px` in navigation metrics, `16 px` on the contact banner, `13.1 px` in the combat rail and reward flag, and `64 px` in the dossier masthead. Surface colors stayed local, the reward panel retained zero overflow, and the three inspected tabs reported no application errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 769 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,051.88 kB` minified / `288.29 kB` gzip initial JavaScript and `119.48 kB` / `23.43 kB` CSS, increases of `0.57 kB` / `0.25 kB` JavaScript and `0.86 kB` / `0.19 kB` CSS over work order 212. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph mutation, reward choice, deterministic draw, gameplay system, or static-hosting rule changed.

## Work order 214 - Permanent Relic Ash Compass and Ashwake chain

Goal: move another passive reward-manipulation item out of run-local circuit competition and refill its rare vault slot with a powerful ordered phase payoff.

Prompt:

> Move Relic Ash Compass to the permanent scrap Upgrade Bay, preserve restored-run compatibility, and replace its live reward position with one rare weapon-chain upgrade that rewards deliberate ordering and broad phase synergy.

Acceptance criteria:

- `item_relic_ash_compass` remains readable by restored snapshots but is retired from active generation, discovery, audits, and every live reward pool.
- A 12-salvage Archive upgrade gated by Relic Pattern Dossier restores the Compass behavior: Vault reward manifests favor relic and phase circuit tools.
- Reward generation gives a fitted restored Compass precedence over the permanent flag, so either representation applies the same bias exactly once.
- The permanent reward-local effect is excluded from the expedition-wide generation fingerprint and does not reshuffle contracts, routes, sectors, shops, or duration.
- Rare Ashwake Reliquary replaces the Compass at the same vault-pool position, weight, advanced gate, and curse/relic family lane.
- At its ordered `onFire` stage, Ashwake Reliquary copies at most three upstream phase shots as offset phase/plasma/relic echoes with 56% impact, 90% velocity, +0.24 seconds flight, bounded collision size, and incremented proc depth.
- A Reliquary before a phase source remains inert. Hardpoint Control reports the exact met/unmet condition, affected shot count, and cumulative projectile/impact change from the production reducer.
- Active breadth remains 66 and vault breadth remains 20; deterministic reward weighting, universal conduits, proc budgets, saves, dependencies, and static hosting remain intact.

Status: implemented. Relic Ash Compass now lives in Archive progression, with legacy fitted-item precedence at the existing reward payload boundary. Ashwake Reliquary consumes only the phase state already assembled ahead of it, creating a bounded rare payoff for phase graze, split/phase, clone/phase, apex, and periodic circuits without a counter, target scan, or RNG draw.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 773 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. A managed in-app browser pass confirms the 19-card Upgrade Bay, the locked 12-salvage Relic Ash Compass Archive card and prerequisite copy, with no console errors. The release build emits `1,053.61 kB` minified / `288.68 kB` gzip initial JavaScript and `119.48 kB` / `23.43 kB` CSS, increases of `1.73 kB` / `0.39 kB` JavaScript with unchanged CSS over work order 213. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph, active item breadth, pool breadth, or static-hosting rule changed.

## Work order 215 - Wreckline opening expedition

Goal: turn the first sector from a brief warm-up into a recognizable opening chapter with more travel, encounter variety, and room to establish the run before its first route choice.

Prompt:

> Reimagine and extend the guaranteed first sector. Give it a distinct pacing grammar that introduces the wreckline in readable stages, treats the existing Hecaton set piece as a midpoint centerpiece, and continues into a contested salvage wake before the recovery coast. Keep the paired optional challenge separate and scaled down.

Acceptance criteria:

- Every run opens with a named Wreckline Expedition objective in Outer Debris Field, without adding another constellation node, menu, reward, or required operation.
- The first pass contains four deterministic major waves with two standard contacts each. All four authored Outer Debris Field wave identities appear once per seed instead of discarding one after the initial shuffle.
- Two readable opening waves precede the Hecaton engagement; two later waves occupy the post-breach salvage wake. The set piece retains its seeded layouts, component rules, natural clear, and existing reward behavior.
- Core first-sector travel grows by a bounded 32-38% after route conditions, with explicit encounter ratios rather than denser time-only spawning.
- The pacing plan includes two natural relief windows, three landmark beats, and two later hazard beats. Formation clusters stay disabled in this onboarding chapter, while the existing hazard and combat caps remain authoritative.
- Loose-currency placement uses the established salvage-route cache profile to reinforce the wreckline identity without changing pickup value, reward counts, or permanent economy.
- The paired optional challenge remains a short derivative of the sector, uses fewer waves and less travel than the required first pass, and does not replay the Hecaton set piece.
- Generation remains deterministic from the same named streams. Saves, snapshots, route graphs, apex pursuit state, act structure, dependencies, and static hosting remain compatible.

Status: implemented. The guaranteed Outer Debris Field now projects `openingWrecklineExpedition` into mission combat and applies a dedicated `wrecklineExpedition` pacing arc. Its four shuffled wave identities create eight contacts at 10%, 22%, 55%, and 82% of the extended scroll, placing the first pair ahead of the Hecaton breach and the second pair beyond its anchor.

The opening arc stretches conditioned travel by 1.32-1.38x, adds relief between the two encounter pairs, and seeds wreck, beacon, and repair-platform landmark opportunities alongside later hazard beats. It deliberately avoids formation clusters so the first combat screens remain legible. The existing mission projection continues to scale the optional hold down and removes the set piece there.

Managed-browser inspection launched `STARBREAK-SMOKE` through the production navigation and combat surfaces. Its briefing reports `Survey the wreckline`, a 2,207u baseline transit, and the Wreckline flight profile; the live Smuggler Vector projection measured 2,503.8u. The paused dossier reported four bounded hazard zones, two relief windows, three landmark beats, the preserved Hecaton set piece, no viewport overflow, and no console errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 775 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,054.86 kB` minified / `289.03 kB` gzip initial JavaScript and unchanged `119.48 kB` / `23.43 kB` CSS, increases of `1.25 kB` / `0.35 kB` JavaScript over work order 214. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph, apex pursuit state, reward count, or static-hosting rule changed.

## Work order 216 - Gold opening constellation node

Goal: restore one consistent selectable-sector color at the opening of every act without hiding the active apex-pursuit state.

Prompt:

> Remove the residual purple apex-contact repaint from each act's first sector node. Give the current launch node the same complete gold card, focus, selected, glow, and pulse treatment as every other ready sector.

Acceptance criteria:

- The current first-sector launch node uses the established gold selectable-sector border, surface, glyph, shadow, and pulse in every act.
- `apex-contact` remains available as semantic navigation metadata and continues to drive the pursuit briefing; it no longer owns a sector-card color.
- The opening node still appears immediately without replaying the newly-revealed-node animation.
- Focus, hover, keyboard selection, overview/focus map modes, reduced motion, performance mode, and high contrast retain their existing behavior.
- Route topology, pursuit generation, encounter state, saves, snapshots, dependencies, and static hosting remain unchanged.

Status: implemented. The launch destination now shares the same gold presentation selectors as ordinary ready choices, while the obsolete purple `apex-contact` override has been removed. The pursuit signal remains on the node for semantic and briefing logic.

Managed-browser inspection opened the `STARBREAK-SMOKE` Act I constellation in focused and full-act views. The live apex-contact launch node reported `rgb(255, 209, 102)` for its border and glyph, a gold pulse and shadow, `animation-name: none` on the card, and the unchanged `apex-contact` signal. Both layouts were visually clean and the browser reported no console errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 117 Vitest files and 775 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits unchanged `1,054.86 kB` minified / `289.03 kB` gzip initial JavaScript and `119.53 kB` / `23.43 kB` CSS, a `0.05 kB` minified CSS increase with unchanged gzip size over work order 215. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph, apex pursuit state, RNG stream, or static-hosting rule changed.

## Work order 217 - Circuit-era boss durability

Goal: give every boss enough circuit-era durability to enter the arena, establish its attack language, and progress through its authored phases without turning later acts into disproportionately shorter encounters.

Prompt:

> Rebalance boss health around representative end-of-act builds of roughly 10 DPS in Act I, 20 DPS in Act II, and 30 DPS in Act III. Use a broad, maintainable durability model now while leaving deeper boss differentiation for later work.

Acceptance criteria:

- Boss definitions establish an Act I baseline engagement band of 8-14.5 seconds at 10 sustained direct DPS.
- Ordinary two-phase bosses occupy the lower and middle band; heavyweight three-phase finales and apex bodies occupy the upper band.
- Act I, II, and III apply 1x, 2x, and 3x baseline hull respectively, matching the 10/20/30 DPS benchmarks and preserving each boss's nominal engagement duration.
- Route, faction, finale, and apex hull modifiers scale through the same act multiplier so their relative impact does not disappear later in a run.
- The lightest boss survives benchmark damage through arena arrival and an opening attack, while phase thresholds, patterns, cadence, telegraphs, damage, projectile caps, and defeat rewards remain unchanged.
- Debug boss spawning and restored production flows use the current sector's act context. No RNG stream, generation fingerprint, save/snapshot field, dependency, or static-hosting rule changes.

Status: implemented. `BossDurability` owns the 10/20/30 DPS benchmarks and resolves act-scaled hull from each boss's authored baseline plus its existing modifiers. Baseline hull now ranges from 80 for Auditor Drone XL to 145 for Crownless Engine, giving regular bosses roughly 8-10.8 nominal seconds and finale/apex bodies roughly 12.5-14.5 seconds before build-specific damage interactions.

Managed-browser inspection launched `STARBREAK-SMOKE`, spawned the lightest boss through the live Act I combat scene, and confirmed `Auditor Drone XL 80/80`. Its opening seven-shot fan was visibly crossing the arena while the boss remained present, with the current phase and health pool readable in the contract HUD. The smoke pass also caught and corrected the one-based act-ordinal integration before release; both inspected tabs reported no console errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 118 Vitest files and 789 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,055.54 kB` minified / `289.26 kB` gzip initial JavaScript and unchanged `119.53 kB` / `23.43 kB` CSS, increases of `0.68 kB` / `0.23 kB` JavaScript over work order 216. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph, phase threshold, attack pattern, damage rule, reward count, RNG stream, or static-hosting rule changed.

## Work order 218 - Settled challenge-node presentation

Goal: make a completed paired challenge collapse into ordinary green chart history so interaction can never restore the gold ready-to-launch treatment.

Prompt:

> After the current layer's optional challenge is complete, project its source node directly as charted rather than retaining a departed launch identity. Hovering, focusing, or selecting that historic node must preserve its completed treatment.

Acceptance criteria:

- Completing a paired optional challenge immediately gives its source node the ordinary green completed surface, check glyph, and `CHARTED` label used by older history.
- The settled node exposes its real sector identity rather than the special `launch` destination identity that owns gold ready-state styling.
- Hover, focus, and selected states preserve the completed green border and surface; none may resurrect the gold launch pulse or glow.
- Selecting the node opens a settled history dossier with an `Operation Settled` disabled action instead of a relaunch affordance.
- Available onward route children remain gold, selectable, and commit-ready after inspecting the settled source node.
- Route topology, optional eligibility, challenge completion, navigation legality, saves, snapshots, RNG streams, dependencies, and static hosting remain unchanged.

Status: implemented. `SectorTransitionScene` now projects the just-settled route source exactly like historic charted nodes: it uses the sector id, check glyph, `CHARTED` label, completed status, and a disabled settled dossier. The special `launch` identity is reserved for operations that can actually begin, so its gold CSS cannot leak back through hover or selection.

Managed-browser inspection completed the `STARBREAK-SMOKE` first-sector challenge and measured the source node before hover, during hover, and after selection. All three states retained the completed green `rgba(114, 242, 167, 0.48)` border and green surface; selection opened the disabled `Operation Settled` dossier. The onward route retained its gold border and actionable selection, and the browser console reported no application errors.

Verification: `npm run verify:release` passes typecheck, ESLint, all 118 Vitest files and 789 tests, the production build, all 19 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,055.45 kB` minified / `289.23 kB` gzip initial JavaScript and unchanged `119.53 kB` / `23.43 kB` CSS, decreases of `0.09 kB` / `0.03 kB` JavaScript from work order 217. The existing Vite large-chunk advisory remains; no dependency, save/snapshot field, migration, route graph, optional-completion rule, RNG stream, or static-hosting rule changed.
