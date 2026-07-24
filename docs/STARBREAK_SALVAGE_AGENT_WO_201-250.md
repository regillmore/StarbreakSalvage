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
