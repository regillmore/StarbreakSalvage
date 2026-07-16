# Starbreak Salvage — Backlog Seed

## Labels

- `type:epic`
- `type:feature`
- `type:bug`
- `type:test`
- `type:docs`
- `area:engine`
- `area:gameplay`
- `area:content`
- `area:ui`
- `area:audio-vfx`
- `area:accessibility`
- `area:build-release`
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `agent-ready`
- `needs-design`
- `good-first-agent-task`

## Epic A — Foundation

### A1 — Add seed docs and AGENTS.md

Acceptance:

- Root `AGENTS.md` exists.
- Docs are in `docs/`.
- README points agents to docs.

### A2 — Scaffold Vite/TypeScript app

Acceptance:

- `npm run dev` starts.
- `npm run build` outputs `dist`.
- Placeholder title screen appears.

### A3 — Add CI and Pages workflows

Acceptance:

- CI runs on PR/main.
- Pages workflow deploys from `dist` on main.
- Vite base path is `/StarbreakSalvage/`.

## Epic B — Engine

### B1 — Fixed-step loop

Acceptance:

- Simulation updates with fixed dt.
- Frame delta is clamped.
- Pause stops simulation.

### B2 — Input manager

Acceptance:

- Action abstraction exists.
- WASD and arrows mapped.
- Settings-ready binding model exists.

### B3 — Scene manager

Acceptance:

- Main menu, contract select, gameplay, pause, summary scenes exist.
- Transitions are explicit.

### B4 — RNG utility

Acceptance:

- Seed string creates stable state.
- `choice`, `shuffle`, `weightedChoice`, and `fork` tested.

## Epic C — Combat

### C1 — Player movement

Acceptance:

- Player stays in bounds.
- Movement is framerate independent.
- Speed can be modified by ship stats.

### C2 — Weapon/projectile system

Acceptance:

- Primary fire emits projectiles.
- Projectile lifetime managed.
- Fire rate and damage are data-driven.

### C3 — Enemy system

Acceptance:

- Enemies spawn from wave data.
- Basic movement patterns exist.
- Enemy death can drop pickups.

### C4 — Collision/damage

Acceptance:

- Player/enemy/projectile collisions work.
- Tests cover core collision primitives.

### C5 — Boss prototype

Acceptance:

- Boss has phases and readable telegraphs.
- Boss can be defeated.

## Epic D — Roguelike systems

### D1 — Contract selection

Acceptance:

- Three seeded contract choices.
- Contract includes hull, weapon, perk, drawback.

### D2 — Item definitions and hooks

Acceptance:

- Items have tags and hook handlers.
- Acquisition order controls hook order.
- Recursive proc limit exists.

### D3 — Reward generation

Acceptance:

- Reward choices are seeded.
- Rarity and item pool respected.

### D4 — Route cards

Acceptance:

- Route choices are seeded.
- Shop/elite/vault/repair/glitch route types exist.

### D5 — Shop

Acceptance:

- Credits can buy items/repairs/rerolls.
- Shop inventory is seeded.

## Epic E — Content

### E1 — Add 8 contracts

Acceptance:

- All contracts validate.
- Each has a distinct play bias.

### E2 — Add 50 items

Acceptance:

- All items validate.
- At least 6 build archetypes supported.

### E3 — Add 4 factions

Acceptance:

- Each faction has distinct enemy behaviors and visuals.

### E4 — Add 5 bosses

Acceptance:

- Each boss has at least 2 phases.
- Telegraphs are readable.

## Epic F — Save/unlocks

### F1 — Versioned save

Acceptance:

- LocalStorage save loads/saves safely.
- Corrupted save does not crash.

### F2 — Unlock conditions

Acceptance:

- At least 10 unlocks.
- Unlocks appear in run summary.

### F3 — Import/export

Acceptance:

- Save can be exported as text.
- Save can be imported after reset.

## Epic G — UX/accessibility

### G1 — Settings menu

Acceptance:

- Volume/mute, screen shake, reduced motion, bullet contrast settings exist.

### G2 — Remappable controls

Acceptance:

- Key bindings can be changed and persisted.

### G3 — Run summary

Acceptance:

- Summary shows seed, contract, sector, kills, items, salvage, unlocks.

### G4 — Seed sharing

Acceptance:

- Seed can be copied from summary.
- Seed can be entered from menu.

## Epic H — QA/release

### H1 — Deterministic tests

Acceptance:

- Known seeds snapshot contracts/routes/rewards.

### H2 — Content validation

Acceptance:

- Duplicate IDs fail tests.
- Missing references fail tests.

### H3 — E2E smoke

Acceptance:

- Page load, start run, pause, settings, forced death/summary are covered.

### H4 — Release checklist

Acceptance:

- README/license/credits/changelog/browser smoke documented.

## Phase 2 backlog additions

Phase 2 starts after M10 and the first-pass procedural audio/VFX follow-up. The goal is a cohesive public playtest slice, not just a scaffold.

## Epic I - Run arc and sector objectives

### I1 - Wave director

Acceptance:

- Sector waves are generated from data.
- Wave completion and boss gates replace the one-kill clear.
- Known seeds reproduce wave timing and major wave labels.

### I2 - Sector objectives

Acceptance:

- Objective types exist for clear waves, survive timer, defeat boss, collect salvage, and elite encounter.
- HUD shows objective progress.
- Objective completion is tested.

### I3 - Victory and loss flow

Acceptance:

- Final boss defeat produces a victory summary.
- Death, abandon, debug, sector complete, and victory have distinct result reasons.
- Save records preserve win/loss summary data.

## Epic J - Player verbs and contract identity

### J1 - Special ability

Acceptance:

- Special action has charge/cooldown state.
- At least three contracts have distinct special behavior or modifiers.
- HUD and tests cover special charge.

### J2 - Bomb

Acceptance:

- Bomb action clears or mitigates danger.
- Bomb charges are limited and visible.
- Bomb respects reduced motion and audio settings.

### J3 - Graze

Acceptance:

- Near-miss detection exists for enemy bullets.
- Graze rewards charge or salvage without using `Math.random()`.
- Graze is readable and tested.

### J4 - Ship stats

Acceptance:

- Ship content controls hull, speed, hit radius, pickup pull, special rate, bomb count, and starting economy.
- Content validation rejects invalid stat ranges.
- Contract selection preview shows key stats.

## Epic K - Bosses, factions, and encounter pressure

### K1 - Boss phases

Acceptance:

- Five bosses have at least two phases or phase-like behavior.
- Phase transitions are deterministic and readable.
- Boss tests cover phase thresholds.

### K2 - Faction expansion

Acceptance:

- At least four factions exist.
- Each faction has distinct movement, projectile, and visual behavior.
- Sector generation references factions deterministically.

Status:

- First pass implemented with Void Corsairs, phase-skirmish enemy behavior, needle visuals, faction-biased rewards, and a Warranty Void Seraph boss reference.

### K3 - Encounter roles

Acceptance:

- Basic, elite, ambush, and boss encounters have distinct pressure.
- Debug shortcuts can launch representative encounters.
- Performance notes document projectile budgets.

## Epic L - Content and build crafting

### L1 - Item expansion

Acceptance:

- At least 30 items exist.
- Every item has tags, rarity, effect text, reward-pool placement, and hook behavior where needed.
- Validation catches missing hook implementations.

Status:

- First pass implemented with 30 total items, expanded starter/combat/vault pools, effect text, hook behavior, and validation for missing hook implementations.

### L2 - Build archetypes

Acceptance:

- At least 6 archetypes are supported: laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic.
- Reward generation can bias toward contract item tags.
- Summary displays active build identity or key items.

Status:

- First pass supports 8 archetype targets in item validation: laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic, phase/graze, and heat/prototype.

### L3 - Route events

Acceptance:

- Shop, elite, vault, repair, glitch, and faction ambush routes have distinct outcomes.
- Route events are deterministic and logged in summary.
- Tests cover known-seed route outcomes.

Status:

- First pass implemented with deterministic economy, reward, shop, hull, curse/relic, and next-sector combat modifiers.
- Follow-up balance should tune costs, risks, reward weights, and event copy after playtesting.

## Epic M - Meta progression and replay

### M1 - Unlock gating

Acceptance:

- Unlocks alter future ship/item/faction/boss/challenge pools.
- Fresh saves still have enough content for complete runs.
- Archive explains what each unlock adds.

Status:

- First pass implemented with save-aware contract boards, item reward/shop filters, faction and boss generation filters, challenge seed flags, boss-practice flags, music flags, and archive grant/effect copy.

### M2 - Challenge seeds

Acceptance:

- Challenge seed definitions exist and are unlockable.
- Challenge modifiers are deterministic and visible before launch.
- Challenge runs record summary metadata.

### M3 - Save migration resilience

Acceptance:

- Any save shape changes include migration tests.
- Import/export remains compatible across Phase 2 save versions.
- Corrupted save/settings data never crashes boot.

## Epic N - UX, onboarding, and accessibility

### N1 - Seed entry

Acceptance:

- Main menu supports seed entry.
- Blank/default/random/known seeds are handled clearly.
- E2E covers seed entry and shared-seed launch.

### N2 - HUD pass

Acceptance:

- HUD shows objective progress, hull, weapon state, special/bomb charge, credits/salvage, boss state, and compact build info.
- HUD text does not overlap on mobile.
- High-contrast bullet mode remains readable.

### N3 - Onboarding hints

Acceptance:

- First-run hints explain movement, fire, special, bomb, graze, routes, rewards, and shops.
- Hints can be dismissed or reduced.
- Keyboard-only flow remains usable.

## Epic O - Audio/VFX/presentation

### O1 - Feedback polish

Acceptance:

- Hit flashes, particles, and screen shake are readable and respect reduced motion/performance settings.
- Audio cue mix respects mute/master volume.
- Effects remain original/generated.

### O2 - Music prototype

Acceptance:

- A tiny original/generated music loop or ambient bed exists.
- Music can be muted or volume-controlled.
- Audio starts only after user gesture.

## Epic P - Playtest release hardening

### P1 - Performance scenarios

Acceptance:

- Dense combat and boss debug scenarios are documented.
- Debug overlay includes projectile and particle counts.
- Normal play remains near 60 FPS on dev machine.

Status:

- First pass implemented with five boss shortcuts, deterministic dense-combat and long-scroll debug pockets, granular entity/projectile/pickup/effect/feature counters, distance/speed/arena counters, and background primitive/layer counts.

### P2 - Playtest checklist

Acceptance:

- README, changelog, credits, release checklist, and browser smoke matrix are updated.
- `npm run check`, E2E smoke, and production preview smoke pass.
- Known severe blockers are fixed or documented.

Status:

- First pass implemented with automated checks, browser smoke, production preview smoke, known risks, and manual browser gaps documented.

## Phase 3 backlog additions

Phase 3 starts after work order 020 deployment confirmation and cleanly concludes Phase 2. The goal is to make the game feel like a vertical scrolling shooter: forward motion, distance, sector identity, procedural backgrounds, scroll-synced waves, hazards, landmarks, boss arenas, and route-driven sector conditions.

## Epic Q - Scrolling foundation

### Q1 - Scroll state

Acceptance:

- Gameplay tracks distance traveled, sector length, scroll speed, and camera/world offset.
- Scroll progress is fixed-step and independent from render frame rate.
- Pause and summary flows do not advance scroll progress.

### Q2 - Sector length generation

Acceptance:

- Sector length and base speed are deterministic from seed, sector, and route modifiers.
- Known seeds snapshot generated sector length/speed.
- Debug overlay can expose distance and speed once instrumentation is added.

## Epic R - Procedural backgrounds

### R1 - Parallax strata

Acceptance:

- Each sector has at least three seeded parallax strata.
- Background plans are deterministic and original.
- Performance mode can reduce layer count or primitive density.

### R2 - Sector visual identity

Acceptance:

- Outer debris, trade corridor, bio-machine bloom, corporate kill grid, and core wreck sectors are visually distinguishable.
- Background colors and motion do not obscure enemy bullets.
- High-contrast mode remains readable.

## Epic S - Scroll-synced encounters

### S1 - Distance wave marks

Acceptance:

- Wave director can schedule major waves by distance markers.
- Frame drops do not skip or duplicate wave spawns.
- Same seed reproduces wave distance marks.

Status:

- First pass implemented in work order 023 for directed combat waves. Time fallback remains for handcrafted schedules; pickup beats, hazards, and boss approach markers remain follow-up encounter pacing work.

### S2 - Encounter pacing

Acceptance:

- Early sectors introduce simple scroll pacing.
- Late sectors can combine scroll pressure with faction behavior.
- Debug scenarios can jump to representative distance marks.

## Epic T - Distance objectives

### T1 - Travel-to-exit objective

Acceptance:

- Normal sectors complete by reaching exit distance and clearing required gates.
- HUD shows distance remaining/reached.
- Summary records distance reached.

Status:

- First pass implemented in work order 024. Sector completion now requires exit distance plus combat gates, and summaries/save records include distance reached. Future work can tune exit lengths and condition balance.

### T2 - Objective variants

Acceptance:

- Boss sectors combine travel distance and boss defeat.
- Elite/ambush/vault variants can add distance modifiers.
- Objective progress remains deterministic and tested.

## Epic U - Landmarks and hazards

### U1 - Landmarks

Acceptance:

- At least three landmark types appear at deterministic distance marks.
- Landmarks reinforce sector theme and route outcomes.
- Landmarks do not require external art assets.

Status:

- First pass implemented in work order 025 with deterministic wreck, beacon, vault, convoy, repair, and core-machinery landmarks rendered as original canvas primitives. Route-conditioned landmark variants are now covered by work order 027.

### U2 - Hazards

Acceptance:

- At least three hazard types have telegraphs and collision behavior.
- Hazards are sparse enough to preserve bullet readability.
- Hazard plans are seed-stable.

Status:

- First pass implemented in work order 025 with deterministic debris lane, warning beam, mine belt, salvage storm, and crush gate windows. Hazards telegraph before becoming active, damage through the normal player-hit path, render under bullets at low alpha, and have unit coverage for determinism, validation, collision, and reduced-motion styling. Work order 070 adds a boss-release guard: hazards whose telegraph/active window was hidden during an arena lock restart their warning lead after the boss dies before they can damage the player.

## Epic V - Boss arenas

### V1 - Arena transition

Acceptance:

- Boss sectors scroll into an arena/approach zone.
- Scrolling locks or slows during boss fights.
- Boss defeat returns to route or victory flow.

Status:

- First pass implemented in work order 026 with deterministic arena approach/lock/release distances, approach slowing, arena scroll locks, and post-defeat exit travel. Route-conditioned boss approach variants are now covered by work order 027, and work order 070 protects the release handoff so hidden overlapping hazards cannot activate immediately on boss death. Visual arena framing remains a follow-up.

### V2 - Debug compatibility

Acceptance:

- Debug boss shortcuts still spawn immediately.
- Boss arena logic is testable without long manual travel.
- Final boss victory remains distinct.

Status:

- First pass implemented in work order 026. Debug boss shortcuts still spawn immediately, arena logic has unit coverage, and final victory remains tied to boss defeat plus sector exit distance.

## Epic W - Route and meta sector conditions

### W1 - Route-conditioned sectors

Acceptance:

- Route outcomes can alter scroll speed, hazard density, landmark type, salvage density, or boss approach length.
- The next-sector transition explains important modifiers.
- Run summary records notable route-driven physical conditions.

Status:

- First pass implemented in work order 027 with deterministic route-derived sector condition plans that adjust next-sector scroll speed, travel distance, hazard density, route landmarks, and boss approach length. Transition and summary copy now surface the notable physical modifiers.

### W2 - Unlock and challenge sector variants

Acceptance:

- Unlocks can add sector variants without raw power creep.
- Challenge flags can modify scroll/hazard rules deterministically.
- Fresh saves remain able to complete runs.

Status:

- First pass implemented in work order 027 for the Debt Ceiling challenge flag and Bloom dossier unlock variant. Conditions are derived from the run seed/unlock list and active route outcomes, so no save schema change was required.

## Epic X - Velocity presentation and accessibility

### X1 - Velocity cues

Acceptance:

- Streaks, debris drift, engine wake, and parallax communicate forward speed.
- Cues remain original/generated and lightweight.
- Screen shake and flash effects respect settings.

Status:

- First pass implemented in work order 028 with settings-derived parallax strength, background streaks, engine wake, pickup drift trails, impact streaks, and subtle frame rails. The cues are canvas primitives only and stay tied to renderer settings rather than simulation state.

### X2 - Accessibility and readability

Acceptance:

- Reduced motion simplifies scrolling.
- High-contrast bullets remain distinct from moving backgrounds.
- HUD remains legible on mobile and desktop.

Status:

- First pass implemented in work order 028. Reduced motion removes parallax/streak velocity cues and most wake/trail motion, performance mode lowers visual density, high-contrast bullets gain outlines and reduced background streak intensity, HUD pills wrap on narrow screens, and E2E smoke covers reduced-motion/high-contrast launch through keyboard flow.

## Epic Y - Long-scroll performance

### Y1 - Instrumentation

Acceptance:

- Debug overlay separates entity, projectile, pickup/effect, background, distance, and speed counts.
- Long-scroll and dense-scroll debug scenarios are deterministic.
- Performance notes document budgets.

Status:

- First pass implemented in work order 029. Debug overlay now separates total entities, enemies, projectile owner split, pickups/effects, telegraphs, distance, speed, arena state, scenario label, background primitive/layer count, and active landmark/hazard count. The dense scenario remains on `0`; the deterministic quiet long-scroll traversal shortcut is on `9`.

### Y2 - Optimization gates

Acceptance:

- Object pooling or batching is introduced only after profiling shows need.
- Renderer changes preserve shape-based placeholder clarity.
- Production preview smoke covers Pages base path after scrolling changes.

Status:

- First pass completed in work order 030 with local production preview asset/base-path smoke. Object pooling and batching remain deferred until profiling shows a need.

## Epic Z - Phase 3 playtest release

### Z1 - Scrolling release checklist

Acceptance:

- README, changelog, performance notes, release checklist, and manual smoke matrix cover scrolling systems.
- `npm run check`, E2E smoke, and production preview smoke pass.
- Known scrolling balance/readability risks are documented.

Status:

- First pass completed in work order 030. Automated checks and production preview smoke are documented; local Playwright remains blocked by missing Chromium browser cache and manual cross-browser smoke remains pending for deployment validation.

### Z2 - Manual playtest script

Acceptance:

- Manual script covers one distance-based sector, one hazard sequence, one route-conditioned sector, and one boss arena.
- Browser matrix tracks Chrome/Edge, Firefox, and Safari where available.
- Deployment confirmation closes Phase 3 or documents blockers.

Status:

- First pass completed in work order 030. The QA/release docs now identify scrolling, hazard, route-conditioned sector, boss arena, dense-combat, and long-scroll debug passes as the manual smoke focus. Full browser matrix execution remains a deployment/manual testing task.

## Phase 4 backlog additions

Phase 4 starts after work order 030 deployment confirmation and cleanly concludes the first scrolling playtest foundation. The goal is display/input/identity polish: window-size parity, optional mouse controls, contract-specific ship visuals, new-game previews, and a contract-themed graphical HUD.

## Epic AA - Resolution scaling and viewport parity

### AA1 - Gameplay safe frame

Acceptance:

- Canvas scaling preserves a stable gameplay safe frame across desktop, laptop, tablet-like, and narrow mobile windows.
- Player movement, bullets, hazards, and boss arena framing remain inside readable bounds.
- Debug tools can expose viewport/canvas scale where useful.

### AA2 - HUD safe areas

Acceptance:

- HUD does not overlap critical gameplay or itself on narrow and wide layouts.
- Important readouts wrap or compress predictably.
- E2E or documented manual smoke covers at least one narrow viewport.

## Epic AB - Mouse controls

### AB1 - Pointer movement and fire

Acceptance:

- Optional mouse/pointer input can move or guide the ship during gameplay.
- Click/hold fire maps through the input abstraction.
- Pointer movement is clamped to the gameplay safe frame.

### AB2 - Input-mode settings and accessibility

Acceptance:

- Mouse controls are documented and optional.
- Keyboard and remapped-key play remain fully functional.
- Menus, settings, pause, and focus order are not disrupted by pointer input.

## Epic AC - Contract ship visual identity

### AC1 - Ship appearance schema

Acceptance:

- Ship appearance data includes silhouette, palette, engine color, cockpit accent, weapon mount hints, and HUD theme key.
- Baseline contracts have distinct original visual identities.
- Content validation catches invalid appearance references.

Status:

- First pass implemented in work order 033 with appearance data on every ship, baseline-distinct silhouettes/palettes, and validation for missing or invalid appearance references.

### AC2 - Gameplay ship rendering

Acceptance:

- Player ship renderer consumes appearance data.
- Visual differences do not change hitbox or damage logic.
- Reduced motion, performance mode, and high contrast remain readable.

Status:

- First pass implemented in work order 033 with original canvas silhouettes, appearance-derived colors/mount hints, high-contrast simplification, and a visible hit-radius ring that preserves combat semantics.

## Epic AD - Contract previews and HUD

### AD1 - Contract selection ship previews

Acceptance:

- New-game contract cards show ship previews using appearance data.
- Selected preview updates through keyboard and pointer interactions.
- Preview layout remains readable on narrow viewports.

Status:

- First pass implemented in work order 034 with compact card previews, a larger selected-contract preview, arrow-key selection wraparound, pointer/button selection updates, and pure preview-model tests.

### AD2 - Contract-themed graphical HUD

Acceptance:

- HUD frame, meters, and accents reflect the selected contract theme.
- Critical text readouts and screen-reader support remain intact.
- Themed HUD respects reduced motion, performance mode, and high-contrast bullets.

Status:

- First pass implemented in work order 035 with appearance-derived cockpit frame accents, semantic hull/special/bomb/heat meters, readable text readouts, high-contrast/reduced-motion simplification, unit tests, and Playwright smoke coverage.

## Epic AE - Contract theme propagation and feedback

### AE1 - Ship identity feedback

Acceptance:

- Damage, invulnerability, engine wake, special readiness, bomb readiness, and overheat cues can use ship appearance data.
- Cues remain original, readable, and lightweight.
- Reduced-motion/performance fallbacks exist.

### AE2 - Theme propagation

Acceptance:

- Route transition, reward, shop, run summary, and debug context carry subtle contract theme accents.
- Operational screens remain quiet and scannable.
- Seed sharing and save/import/export remain compatible.

## Epic AF - Phase 4 playtest release

### AF1 - Viewport/input debug and smoke

Acceptance:

- Debug overlay can report viewport/canvas scale and active input mode.
- Smoke coverage or manual matrix covers narrow viewport and mouse input.
- Release docs capture local browser blockers separately from gameplay blockers.

Status:

- First pass implemented in work order 039. Debug mode now reports viewport class/scale/DPR, canvas pixel size, safe-frame origin/size, active input mode, HUD mode, selected contract theme, and fixed combat world size. Playwright smoke covers narrow viewport launch, pointer movement/fire input mode, contract preview selection, and cockpit HUD theme/mode assertions.

### AF2 - Phase 4 release checklist

Acceptance:

- README, changelog, performance notes, release checklist, and QA docs cover Phase 4 features.
- `npm run check` and production preview smoke pass.
- Known display/input/HUD risks are documented before deployment.

Status:

- First pass completed in work order 040. Automated checks, Playwright Chromium smoke, production preview asset-path smoke, Phase 4 closeout notes, and manual browser gaps are documented.

## Phase 5 backlog additions

Phase 5 starts after work order 040 validation and cleanly concludes the display/input/contract-identity playtest foundation. The goal is progression and sector-feedback depth: banked scrap purpose, upgrade bay clarity, upgrade-influenced future runs, sector completion feedback, lunar surface content, and richer player ship destruction.

## Epic AG - Banked scrap and upgrades

### AG1 - Scrap economy purpose

Acceptance:

- Banked scrap can be spent on persistent upgrade definitions.
- Upgrade costs and prerequisites validate.
- Upgrade framing widens variety, information, or sidegrades rather than raw permanent power.

Status:

- First pass implemented in work order 041 with six data-backed upgrades, costs, prerequisites, icon/effect categories, and save purchase helpers.

### AG2 - Save-safe upgrade state

Acceptance:

- Existing saves migrate with empty upgrade state.
- Export/import preserves purchased upgrades and remaining scrap.
- Corrupted upgrade data repairs safely.

Status:

- First pass implemented in work order 041. Save schema version 3 stores `purchasedUpgradeIds`, migrates legacy v2 saves from the old localStorage key, sanitizes unknown upgrade ids, and preserves purchases through export/import.

### AG3 - Upgrade effects in generation

Acceptance:

- Purchased upgrades can alter contract boards, route information, shops, or reward variety deterministically.
- Same save state plus same seed reproduces upgrade-influenced generation.
- Fresh saves remain complete and playable.

Status:

- Implemented in work order 043. Purchased upgrades now alter contract survey/board size where unlocked ships allow, route intel, market decoder shop stock/discount/bias, relic dossier vault reward choices, seed survey text, summary rows, and debug labels. `UPGRADE-SEED-SNAPSHOT` and fresh-save tests cover determinism and baseline viability.

## Epic AH - Upgrade Bay UX

### AH1 - Upgrade menu surface

Acceptance:

- Upgrade Bay is reachable from the main menu or Unlock Archive.
- Cards show name, category, cost, purchased/locked/available state, and short effect text.
- Keyboard and pointer navigation are supported.

Status:

- Implemented in work order 042. The Upgrade Bay is reachable from both entry points, renders focusable upgrade cards, and purchases through save-backed banked scrap helpers.

### AH2 - Upgrade icons

Acceptance:

- Upgrade categories have original icons.
- Icons remain readable in high contrast and narrow layouts.
- Icon rendering does not introduce external assets.

Status:

- Implemented in work order 042 with static inline SVG primitives for contract, route, market, vault, scrap, and seed-map icon keys plus narrow/high-contrast smoke coverage.

### AH3 - Purchase and affordability feedback

Acceptance:

- Players receive clear confirmation when buying an upgrade.
- Newly affordable upgrades can be surfaced after a run.
- Failed purchases explain whether scrap, prerequisites, or locks are missing.

Status:

- Implemented across work orders 042 and 044. Upgrade Bay purchases confirm success, locked and unaffordable cards explain their blocker, failed purchase messages are wired through the save helper, and run summaries/archive status now surface newly affordable, already available, next-target, or completed upgrade progress.

## Epic AI - Sector completion feedback

### AI1 - Exit sequence

Acceptance:

- Completing objectives triggers a short exit/corridor/beacon beat before route/reward flow.
- Debug sector completion remains fast.
- Reduced motion simplifies the sequence.

Status:

- Implemented in work order 045. Objective completion now enters an explicit exit sequence, clears enemy pressure, draws a beacon/corridor primitive, keeps route/victory handoff single-fire, and uses a shorter static reduced-motion presentation.

### AI2 - Completion toasts

Acceptance:

- Sector completion, scrap gain, and upgrade affordability toasts are concise and non-blocking.
- Toasts are visible above gameplay/DOM overlays without hiding critical controls.
- Toasts are testable or documented in smoke coverage.

Status:

- Implemented across work orders 044 and 045. Run-end scrap and upgrade affordability callouts live on summary/archive screens, and sector completion now shows a non-blocking DOM toast with debug/E2E coverage before route or victory handoff.

## Epic AJ - Lunar surface sector

### AJ1 - Lunar sector family

Acceptance:

- Lunar Surface appears in deterministic sector generation.
- Background plans use original low-altitude terrain, crater, ridge, tower, or wreck-shadow motifs.
- Content validation covers sector references.

Status:

- Implemented in work order 046. `LUNAR-SURFACE-LANE` routes through Lunar Surface, the content catalog includes the sector/background references, and background plans use original crater, ridge, tower, and wreck-shadow primitives.

### AJ2 - Lunar features

Acceptance:

- Lunar sectors have at least two landmarks and two hazard patterns.
- Hazards have deterministic distance windows and readable telegraphs.
- Features remain under bullets and respect high-contrast/reduced-motion settings.

Status:

- Implemented in work order 047. Lunar sectors now use crater-shadow, comm-array, and surface-relay landmarks plus dust-plume, mining-laser, and surface-defense hazard windows with deterministic telegraph/active phases and readability metadata.

### AJ3 - Lunar encounter pacing

Acceptance:

- Lunar waves and route-conditioned effects feel distinct from existing sectors.
- Debug counters remain useful for lunar backgrounds/features.
- Known seeds can reproduce lunar sector plans.

- Implemented in work order 047. Lunar sectors carry optional encounter-pacing data for low-altitude wave spacing, route-conditioned feature transforms remain valid over lunar hazards/landmarks, and `LUNAR-SURFACE-LANE` tests reproduce the sector plan.

## Epic AK - Ship destruction and Phase 5 release

### AK1 - Rich player destruction

Acceptance:

- Player death includes ship breakup, themed debris, cockpit failure, or transponder cues.
- Death-to-summary transition remains reliable.
- Reduced motion, performance mode, high contrast, and mute settings are respected.

- Implemented in work order 048. Death now plays a bounded deterministic destruction beat with ship-themed debris, silhouette/cockpit/transponder cues, settings-aware palette and debris budgets, feedback/audio integration, debug progress, and forced-destruction E2E coverage before the normal destroyed summary.

### AK2 - Phase 5 smoke and release docs

Acceptance:

- Smoke coverage or manual matrix covers Upgrade Bay, sector exit toast, lunar sector, and ship destruction.
- `npm run check`, E2E smoke, and production preview smoke pass before Phase 5 closeout.
- Known progression balance, browser, and readability risks are documented.

- Completed in work order 050. Automated Chromium smoke covers Upgrade Bay purchase/readiness debug state, forced sector exit flow, forced player destruction, and reaching Lunar Surface through `LUNAR-SURFACE-LANE`; `npm run check`, Playwright smoke, and production preview asset-path smoke passed for the Phase 5 closeout. Manual non-Chromium and real-device smoke remain deployment validation tasks.

## Phase 6 backlog additions

Phase 6 starts after work order 050 validation and cleanly concludes the progression/sector-feedback playtest foundation. The goal is item-catalog depth: richer item taxonomy, more hook surfaces, larger original item batches, curated reward pools, unlock-gated item families, synergy identity, improved presentation, and item-heavy smoke coverage.

## Epic AL - Item taxonomy and validation

### AL1 - Catalog audit

Acceptance:

- Current 30-item catalog is documented by tag, hook, rarity, pool, archetype, and implementation status.
- Repeated reward feel and placeholder effects are identified.
- Phase 6 count and family goals are explicit.

Status:

- Implemented in work order 051. `docs/STARBREAK_SALVAGE_ITEM_CATALOG_AUDIT.md` records the 30-item baseline, repeated-reward risks, underrepresented archetypes, target families, and bridge-effect notes; `src/content/itemCatalogAudit.ts` plus unit tests keep the audit repeatable.

### AL2 - Item metadata schema

Acceptance:

- Item definitions can express family, source hints, unlock tier, implementation status, and uniqueness/stackability.
- Existing item content migrates without breaking deterministic reward generation.
- UI helpers tolerate old and new fields safely.

Status:

- Implemented in work order 052. Every item now has compact metadata for family, source hints, unlock tier, implementation status, stackability, and short UI tags, while reward generation continues to read the same stable item ids and pools.

### AL3 - Item validation at scale

Acceptance:

- Validation catches invalid families, sources, unlock gates, hook references, implementation states, missing effect text, and empty pools.
- Bad fixtures cover metadata, pool, and hook failures.
- Validation remains fast enough for `npm run check`.

Status:

- Implemented in work order 052. Validation now rejects invalid or duplicate metadata fields, missing bridge/planned implementation notes, unsupported starter rarity/source combinations, reward pool/source mismatches, item unlock gates with missing unlocks, and unlock source/tier drift; unit fixtures cover the new failure modes.

## Epic AM - Hook and effect variety

### AM1 - New item hook surfaces

Acceptance:

- Hooks exist for graze, special use, bomb use, sector start, route selection, shop entry, reward generation, and boss phase events where practical.
- Hook order is deterministic and documented.
- Proc limits prevent runaway chains.

Status:

- Implemented in work order 053, then populated by work order 054. The new hook names are registered, typed, validated, and wired through combat, route, reward, and shop boundaries, with unit coverage for deterministic dispatch order and an application cap. Expansion items now opt into graze, special, bomb, sector, route, shop, reward, and boss-phase hook surfaces.

### AM2 - Live effect conversion

Acceptance:

- Lightweight placeholder item effects are either implemented or explicitly marked as planned.
- Effect handlers remain isolated from unrelated systems.
- Tests cover representative effects in each major hook family.

### AM3 - Proc budget instrumentation

Acceptance:

- Debug or test helpers can report active item count, active hook count, proc budget, and build identity where useful.
- Dense item interactions have deterministic smoke or integration coverage.

Status:

- Implemented in work order 059. `src/game/ItemStress.ts` provides item count, unique count, active hook surfaces, hook applications, peak proc pressure, skipped proc applications, and build identity for forced and test loadouts. The gameplay debug overlay now prints those values behind `?debug=1`, and unit coverage verifies normal and over-budget loadouts.

## Epic AN - Catalog expansion and pool curation

### AN1 - Item expansion batch

Acceptance:

- Catalog reaches at least 60 total items in the first Phase 6 expansion.
- New items are original, validated, and assigned to source pools.
- Fresh saves remain readable and playable.

Status:

- Implemented in work order 054. The catalog now has 60 original item definitions, all new entries carry validated metadata and live declared hook behavior, starter rewards remain common/uncommon-forward without prototype/cursed entries, and deterministic shop/vault snapshots were refreshed for the expanded pools.

### AN2 - Reward source pools

Acceptance:

- Starter, combat, shop, vault, elite, boss, faction, lunar, and unlock-gated pools can be weighted independently.
- Known-seed snapshots cover reward, shop, and vault item outputs.
- Rare, prototype, and cursed items do not flood early fresh-save runs.

Status:

- Implemented across work orders 055 and 056. Starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts now use validated rarity/source/family/tag weight profiles, with deterministic known-seed coverage for shop, elite, vault, and lunar reward outputs. Save/unlock state filters direct item locks and advanced/classified family-tier locks while preserving fresh-save baseline variety.

### AN3 - Sector and faction item identity

Acceptance:

- Lunar, faction, boss, and route-themed items can appear from appropriate sources.
- Source hints are visible when useful.
- Pool weighting remains deterministic from seed plus save state.

Status:

- First pass implemented in work order 055. Reward and shop cards now show compact source hints, and route kind, Lunar Surface sectors, boss-gated sectors, and boss faction context all feed the deterministic item weighting layer.

## Epic AO - Unlocks, discovery, and build identity

### AO1 - Unlock-gated item families

Acceptance:

- Permanent progression can reveal item families, not just individual rewards.
- Unlock Archive explains newly available families.
- Fresh saves retain sufficient baseline item variety.

Status:

- Implemented in work order 056. Advanced curse/relic, classified heat/prototype, and advanced boss-pressure tiers are gated by permanent unlocks, and the Unlock Archive shows locked, partial, and unlocked family states without listing locked item details.

### AO2 - Item discovery records

Acceptance:

- Save data can track discovered items or families if added.
- Migration/import/export preserve discovery state.
- Corrupted discovery data repairs safely.

Status:

- Implemented in work order 056. Save schema v4 records discovered item IDs and derived family IDs, migrates v1-v3 saves, repairs invalid imported discovery records, and exports/imports the new discovery state.

### AO3 - Synergy cluster detection

Acceptance:

- At least ten build clusters are detectable from item tags, families, and acquisition order.
- HUD, rewards, shops, or summaries can surface compact build identity.
- Detection and tie-breaking are deterministic and tested.

Status:

- Implemented in work order 057. Eleven synergy clusters are detected from item family, tags, and acquisition order; HUD, reward/shop cards, and run summary now surface compact build identity and prospective build-fit copy.

## Epic AP - Item presentation and Phase 6 release

### AP1 - Item card presentation

Acceptance:

- Reward, shop, vault, summary, and archive item cards show rarity, tags/family, source, and effect state clearly.
- Keyboard, pointer, high-contrast, reduced-motion, and narrow viewport paths remain usable.
- No external item art is introduced.

Status:

- Implemented in work order 058. Shared item-card view models and DOM helpers now render reward, shop, run-summary, and discovered-archive cards with inline SVG family icons, rarity/family/source/effect-state copy, UI-tag badges, build-fit context, and responsive/high-contrast styling.

### AP2 - Item-heavy smoke

Acceptance:

- Automated or documented smoke covers an item-heavy reward/shop/vault path.
- Debug tooling can exercise rich item pools and dense synergy combat.
- Performance notes document item hook and UI budgets.

Status:

- Implemented in work order 059 and extended in work order 076. The `HOOK-STORM-SMOKE` browser path uses debug key `6` to force a 23-item loadout across all 14 hook surfaces, a bounded enemy/projectile field, and overlay item/hook/proc/build telemetry. Pure tests preview fresh and fully unlocked combat/shop/vault pools to catch unlock-gated item availability and rich inventory drift before release hardening passes.

### AP3 - Phase 6 release checklist

Acceptance:

- README, changelog, performance notes, release checklist, and QA docs cover item expansion.
- `npm run check`, E2E smoke, and production preview smoke pass before Phase 6 closeout.
- Known item balance, browser, and readability risks are documented.

Status:

- Implemented in work order 060 and extended in work order 076. Phase 6 is closed as an item-catalog playtest candidate with documented 60-item catalog scale, 14-hook coverage, source-weighted reward/shop/vault pools, unlock/discovery behavior, shared item cards, item-heavy stress smoke, known item balance risks, manual browser gaps, and Phase 7 enemy-behavior planning.

## Phase 7 backlog additions

Phase 7 starts after the item-catalog playtest candidate. The goal is richer enemy behavior: stronger class/role differentiation, upgraded enemy variants, formation-aware waves, and longer-sector pacing that feels authored rather than stretched.

## Epic AQ - Enemy role taxonomy

### AQ1 - Enemy role audit

Acceptance:

- Current enemy classes are documented by role, movement, attack cadence, durability, faction fit, spawn context, objective interaction, and readability.
- Role gaps and risk areas are explicit before behavior changes.
- Deterministic behavior remains unchanged.

Status:

- Implemented in work order 061. The enemy role audit documents the four current faction-pattern classes, wave-label semantics, shared spawn/durability model, objective accounting paths, target Phase 7 roles, and soft-lock/readability/performance risks before schema work begins.

### AQ2 - Role metadata schema

Acceptance:

- Enemy content carries validated role, pressure, movement, attack, variant, formation, readability, and faction-fit metadata.
- Invalid metadata is caught by tests.
- Existing waves keep deterministic outputs.

Status:

- Implemented in work order 062. Current faction-pattern classes carry validated role metadata for class id, role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, faction fit, objective policy, and debug label; existing wave schedules and combat behavior remain unchanged.

### AQ3 - Role debug summaries

Acceptance:

- Debug or pure helpers can report active enemy role counts.
- Role-pressure summaries are suitable for Playwright smoke and manual playtest notes.
- Overlay additions do not add per-frame expensive scans beyond existing entity passes.

Status:

- Implemented across work orders 062, 065, and 066. `EnemyRolePressure` summarizes active role counts, objective-policy counts, upgraded variant counts, and active formation counts from current enemies; the debug overlay reports role, variant, and formation pressure during gameplay without adding a second entity scan.

## Epic AR - Enemy behavior differentiation

### AR1 - Movement profiles

Acceptance:

- Priority roles such as scout, bruiser, sniper, screener, carrier, support, and disruptor have distinct deterministic movement profiles.
- Movement stays inside the fixed 640x720 combat world.
- Profiles cannot strand enemies or block sector completion indefinitely.

Status:

- Implemented in work order 063 for the four current normal-enemy roles. Movement now reads validated metadata: bruisers drift, screeners hold lanes, disruptors sway organically, and scouts skate laterally. Future sniper/carrier/support movement families remain registered for later content.

### AR2 - Attack cadences and telegraphs

Acceptance:

- Priority roles have distinct firing cadence, aim style, projectile shape/speed, or telegraph language.
- Projectile and telegraph budgets remain bounded.
- High-contrast and reduced-motion modes keep attacks readable.

Status:

- Implemented in work order 064 for the four current normal-enemy roles. Attack behavior now reads validated metadata: bruisers warn and fire slower heavy scrap volleys, screeners show short lane warnings before paired bolts, disruptors mark a ring before spore spreads, and scouts give quick fan warnings before aimed phase needles. Future charged-shot, lane-curtain, deploy-burst, support-pulse, and hazard-mark profiles are registered for later classes.

### AR3 - Support and disruption behaviors

Acceptance:

- Non-damage roles can add escort, shielding, pulse, spawn, lane-control, or hazard-marking pressure without hidden damage spikes.
- Support behaviors expose clear visual and audio/readability cues.
- Tests cover deterministic timing and cleanup.

## Epic AS - Upgraded variants and elites

### AS1 - Variant rules

Acceptance:

- Upgraded variants are data-driven, seeded, and gated by sector depth, faction, route pressure, challenge flags, or encounter type.
- Fresh opening sectors remain forgiving.
- Variant eligibility validates against enemy role metadata.

Status:

- Implemented in work order 065. `src/content/enemyVariants.ts` defines validated first-pass armored, overclocked, evasive, volatile, shielded, and salvage-rich variants with role/faction/eligibility gates. The wave director selects variants from seeded per-spawn RNG forks based on sector depth, route pressure, challenge flags, elite wave labels, boss-gate context, and faction eligibility while preserving variant-free fresh opening sectors.

### AS2 - Elite modifier readability

Acceptance:

- Elite modifiers such as armored, overclocked, evasive, volatile, shielded, escort, commander, or salvage-rich have clear visual cues.
- Variants change decisions before raw damage spikes.
- Summary/debug surfaces can expose variant pressure for playtesting.

Status:

- Implemented in work order 065 for six first-pass variants. Combat applies visible durability, attack-cadence, drift/profile, and salvage-reward modifiers without raising enemy damage; canvas rendering adds deterministic ring/badge cues with high-contrast fallback, and the debug overlay reports active variant totals plus compact labels.

### AS3 - Variant reward and unlock hooks

Acceptance:

- Variant and elite encounters can bias rewards or discovery hooks deterministically where appropriate.
- Reward changes are explained through existing route/reward copy.
- Unlock and fresh-save pool sufficiency remain intact.

Status:

- Partially covered in work order 065 through per-enemy bonus salvage for volatile, shielded, and salvage-rich variants. Broader post-encounter reward, discovery, and unlock hooks remain deferred until formation and enemy-rich route integration work.

## Epic AT - Formation and squad director

### AT1 - Formation definitions

Acceptance:

- Formation definitions include member roles, offsets, timing, entry style, spacing, break conditions, and cleanup behavior.
- Definitions validate against enemy roles and fixed-world bounds.
- No external formation assets are introduced.

Status:

- Implemented in work order 066. `src/content/enemyFormations.ts` defines eight original formation shapes: wedge, column, screen, escort, pincer, convoy, ring, and staggered lane. Each definition carries member role intent, fixed-world offsets, timing, entry style, spacing, break condition, cleanup policy, and compact cue metadata, and content validation rejects bad roles, shapes, timings, spacing, bounds, IDs, and cue colors.

### AT2 - Formation spawning

Acceptance:

- Formation members spawn in deterministic order through the wave director.
- Frame catchup cannot skip or duplicate members.
- Formations stay readable and avoid incoherent overlap.

Status:

- Implemented in work order 066. The wave director selects optional formations from seeded per-wave RNG forks, expands existing multi-member waves into ordered spawn entries, assigns member factions from role/shape eligibility, keeps fresh opening and single-target waves formation-free, and preserves the existing `nextSpawnIndex` catchup contract. Combat/render/debug carry formation IDs, member indexes, compact canvas arcs/labels, and active formation counts.

### AT3 - Objective and reward safety

Acceptance:

- Simultaneous formation kills, secondary item kills, despawns, and body collisions all advance objectives consistently.
- Formation waves cannot soft-lock sector completion.
- Optional formation rewards and route/faction biases reproduce from seed plus save state.

Status:

- Implemented in work order 067. Formation spawns now carry instance IDs so clear rewards are claimed once per squad, definitions declare small clear-bonus salvage values, and deterministic route/encounter/faction weighting biases formation type without changing the indexed spawn queue. Combat routes simultaneous projectile kills, item side-effect kills, body collisions, and offscreen despawns through shared defeat accounting, so objective target counts and sector-complete handoff stay in sync.

## Epic AU - Longer sector pacing

### AU1 - Longer length bands

Acceptance:

- Selected sectors/routes can use longer deterministic length bands.
- Length changes are visible in debug and summaries.
- Route-conditioned length remains reproducible.

Status:

- Implemented in work order 068. A deterministic `SectorPacing` layer now runs after route-conditioned sector modifiers and applies modest length multipliers to selected route-pressure, lunar, boss, and late-run sectors. Gameplay, transition screens, debug plan strings, and run summaries report the active long-sector arc.

### AU2 - Encounter arcs

Acceptance:

- Longer sectors use mid-sector beats, relief windows, formation clusters, hazards, landmarks, and boss approach changes rather than constant pressure.
- Wave and formation spacing tests cover pressure/relief ordering.
- Boss and final-sector handoffs remain reliable.

Status:

- Implemented in work order 068. Pacing plans now provide explicit wave-distance ratios, relief windows, formation-cluster wave indexes, landmark/hazard beats, and boss-approach scaling. The wave director consumes those ratios and cluster marks, and unit coverage protects route-conditioned relief ordering, forced formation clusters, feature insertion, and boss arena handoff.

### AU3 - Long-sector performance budget

Acceptance:

- Enemy-rich long-sector smoke exposes entity, projectile, telegraph, role, variant, formation, and scroll metrics.
- Performance mode and reduced motion simplify visuals without changing deterministic gameplay.
- Manual browser gaps are documented.

Status:

- Started in work order 068. Longer-sector pacing adds sparse landmarks/hazards and wider wave spacing instead of constant density, with debug summaries exposing the active arc.
- Completed in work order 069 for Chromium smoke. The `E` debug pocket exposes active role, variant, formation, projectile, telegraph, and stress-budget telemetry on a long-sector Lunar Surface path under narrow, high-contrast, reduced-motion, and performance-mode settings. Manual non-Chromium browser coverage remains for release hardening.

## Epic AV - Phase 7 release and QA

### AV1 - Enemy stress smoke

Acceptance:

- Debug/test tooling can force at least one enemy-rich formation/variant path.
- Browser smoke covers role, variant, formation, and long-sector pressure where practical.
- Existing item-storm and long-scroll smoke remain green.

Status:

- Implemented in work order 069. Debug key `E` forces a deterministic enemy-rich formation/variant pocket, overlay summaries show role/variant/formation counts plus projectile/telegraph budgets, and Playwright smoke verifies the path on a paced Lunar Surface sector with accessibility settings active.

### AV2 - Enemy behavior release checklist

Acceptance:

- README, changelog, performance notes, release checklist, QA docs, Phase 7 plan, backlog, and architecture notes cover enemy behavior expansion.
- `npm run check`, E2E smoke, and production preview smoke pass before Phase 7 closeout.
- Known enemy balance, browser, readability, and longer-sector risks are documented.

Status:

- Implemented in work order 070. Phase 7 release docs now cover role coverage, variant rules, formation smoke, longer-sector tuning, release evidence, manual browser gaps, and follow-up balance risks. The closeout also fixed a boss-arena hazard blocker by deferring any hazard window hidden during arena lock until after a fresh post-boss telegraph lead, with unit regression coverage. Full check, escalated Playwright Chromium smoke, and production preview smoke provide local closeout evidence.

## Epic AW - Rich hazard zones

### AW1 - Hazard-zone schema

Acceptance:

- Hazard definitions describe family, sector/faction fit, telegraph timing, active damage shape, damage cooldown, safe-lane expectations, accessibility metadata, and boss-arena suppression behavior.
- Existing hazards migrate into or map cleanly onto the typed contract.
- Validation catches bad phase timing, unsupported shapes, missing accessibility data, and unsafe boss-release behavior.

Status:

- Implemented in work order 072 and revised by work order 124. The hazard-zone registry covers all current hazard IDs with family, fit, telegraph/damage shape, sector/condition/pacing metrics, phase minimums, damage/cooldown, safe-lane expectations, readability colors/layers/settings variants, and the enforced `settleBeforeLock` boss-arena policy. Current feature, route-condition, pacing, director, renderer, validation, and tests consume or verify that registry without changing hazard density.

### AW2 - Hazard behavior library

Acceptance:

- Multiple richer hazard families exist, such as sweep beams, pulse fields, drifting mine bands, collapsing columns, orbital shadows, plasma curtains, or dust fronts.
- Hazards only damage after visible warning leads and validated active windows.
- Reduced motion, performance mode, and high contrast simplify presentation without changing deterministic timing.

Status:

- Implemented in work order 073. Existing hazard definitions now carry validated behavior metadata for sweep, pulse, drift, collapse, shadow, curtain, dust-front, and static-gate patterns. Runtime helpers derive active damage windows, fixed-world damage rectangles, cooldown-aware collision, and settings-aware presentation from the content registry, while renderer cues simplify under reduced motion and performance mode without changing generated timing.

### AW3 - Hazard director and pacing

Acceptance:

- Hazard-zone schedules are generated deterministically from seed plus save/sector context.
- Pressure and relief windows guide hazard density.
- Boss-arena release keeps the work order 070 fairness rule: hidden warnings cannot become instant damage when the arena unlocks.

Status:

- Implemented in work order 074 and superseded at the boss boundary by work order 124. `HazardZoneDirector` consumes sector pacing, route pressure, relief windows, formation clusters, lunar/background context, and boss arena locks to generate deterministic hazard-zone schedules. Ordered telegraph/active/clear events support frame-catchup consumption; the final combined plan now preserves full windows while packing every clear event before boss lock, with summaries/debug reporting approach adjustments and no post-boss deferral.

## Epic AX - Destructibles and obstacles

### AX1 - Destructible and obstacle schema

Acceptance:

- Destructibles and obstacles have typed definitions for collision, hull, damage interaction, objective policy, reward policy, chain behavior, sector/faction fit, placement constraints, rendering cues, and debug labels.
- Validation rejects impossible sizes, unsafe lane constraints, invalid rewards, missing policies, and missing cue metadata.
- Placement helpers use fixed 640x720 combat-world coordinates.

Status:

- Implemented in work order 075. The first `EnvironmentObjectDefinition` catalog covers debris, cargo, shield, rock, pylon, wreck, cache, and volatile object families with collision, durability, damage-source, objective, reward, chain, placement, render, audio/VFX, accessibility, and debug metadata. Content validation catches malformed definitions, and pure fixed-world placement helpers generate deterministic safe-lane plans for later runtime work.

### AX2 - Destructible interactions

Acceptance:

- Destructibles can take allowed weapon, bomb, special, hazard, or chain-reaction damage.
- Rewards, item hooks, audio/VFX, cleanup, and debug counters are deterministic and bounded.
- Destroying destructibles cannot desync objectives or target counts.

Status:

- Implemented in work order 076.

### AX3 - Obstacle lane safety

Acceptance:

- Obstacle layouts create navigation pressure without unavoidable walls, blocked exits, or viewport-dependent difficulty.
- Layouts respect player spawn/exit corridors, boss approach locks, hazard overlays, enemy spawn lanes, and fixed-world bounds.
- Debug summaries expose active obstacle/destructible counts.

Status:

- Implemented in work order 077. Placement now respects fixed-world safe lanes, player spawn and sector exit corridors, boss lock space, active hazard lanes, and enemy spawn reservations; runtime obstacle contact pushes the player back into valid space while applying schema contact damage through the existing player-hit path.

## Epic AY - Loose currency and salvage flow

### AY1 - Loose currency scatter

Acceptance:

- Scrap and credit scatter can originate from explicit event payloads or deterministic sector plans.
- Scatter definitions cover drift, lifetime, pickup attraction, collection radius, cap rules, value tiers, route/sector bias, and feedback labels.
- Loose currency behavior is deterministic and independent from viewport size.

Status:

- Implemented in work order 078. `LooseCurrency` creates deterministic scatter specs from explicit enemy/boss/destructible payloads and one cached sector plan for route-event lanes, hazard-risk skims, sector landmarks, and obstacle trails. Specs include source, tier, drift, TTL, collection radius, debug label, and conservative value splitting, while combat consumes them through indexed scroll markers rather than per-frame random checks.

### AY2 - Pickup economy and feedback

Acceptance:

- Active loose currency count/value is capped and visible in debug.
- Run summaries and upgrade progress accurately include collected loose currency.
- Banked scrap and credit income remain conservative enough for existing upgrade/shop pacing.

Status:

- Implemented in work order 078. Combat enforces active loose pickup/value caps, tracks spawned/collected/expired/suppressed value, reports loose pickup count/value plus credit/salvage split in debug, and keeps collection in fixed 640x720 combat-world units. Run results, save updates, run-summary progress, and Upgrade Bay affordability continue to read collected credits/salvage through the normal economy path, with fresh and progressed save tests covering the accounting.

## Epic AZ - Phase 8 release and QA

### AZ1 - Environmental stress smoke

Acceptance:

- Debug/test paths can force hazard-heavy, destructible-rich, obstacle-lane, and loose-currency-rich scenarios.
- Browser smoke covers at least one environmental stress path where practical.
- Existing item-storm, enemy-rich, dense-combat, forced-exit, destruction, and long-scroll smoke remain green.

Status:

- Implemented in work order 079. Debug key `H` forces a deterministic environmental stress pocket with active hazard-family telemetry, six schema-backed environment objects, four destructibles, two obstacles, ten loose currency pickups under the active count/value caps, and explicit `Env stress` budget state. Unit and Playwright smoke coverage verify the path without reading private app state while preserving the existing debug smoke suite.

### AZ2 - Environmental systems release checklist

Acceptance:

- README, changelog, performance notes, release checklist, QA docs, Phase 8 plan, backlog, and architecture notes cover environmental systems.
- `npm run check`, E2E smoke where available, and production preview smoke pass before Phase 8 closeout.
- Known environmental balance, economy, browser, and readability risks are documented.

Status:

- Implemented in work order 080. Phase 8 release docs now cover hazard-zone coverage, destructible/obstacle rules, loose-currency tuning, environmental debug smoke, scroll-world object/loot behavior, known balance/readability/economy risks, Chromium smoke evidence, production preview evidence, and remaining manual browser gaps.

## Epic BA - Phase 9 second-act run structure

### BA1 - Act model and run progression

Acceptance:

- Run generation has typed Act I and Act II definitions with deterministic sector budgets, boss gates, route grammar, and summary/debug context.
- Same seed plus save state reproduces the same two-act structure.
- Older one-act save and summary records remain readable during migration.

Status:

- Implemented in work orders 082-083. Act definitions now validate through content checks, generated runs expose deterministic Act I/Act II plans over a ten-sector target route, each sector carries act context, route history preserves act handoff metadata, and save/summary/debug surfaces normalize or display act progress while the current sector vocabulary is reused pending Act II content expansion.

### BA2 - Inter-act junction

Acceptance:

- Completing Act I opens a midpoint junction before Act II begins.
- Junction choices such as repair, route intel, shop discount, extra reward, banked salvage, or risk modifiers are deterministic from seed plus save state.
- Keyboard, pause, reduced-motion, high-contrast, narrow viewport, and abandon/recover flows remain reliable.

Status:

- Implemented in work order 083. Act I completion opens a deterministic midpoint refit scene before Act II. Choices apply explicit run-resource and Act II modifiers for repair, route intel, shop discount, reward choice/bias, salvage, or risk, with keyboard confirm, pause/back abandon safety, summary/debug reporting, and existing accessibility layout settings preserved.

### BA3 - Act II route pool

Acceptance:

- Act II has data-driven sector and route contracts with pressure/reward tradeoffs, faction fit, background hooks, objective families, and route-card copy.
- Content validation catches invalid act, sector, route, objective, reward, and boss references.
- Route previews communicate Act II stakes without hiding deterministic seed behavior.

Status:

- Implemented in work order 084. Act II route options now use data-driven contracts with route tags, sector fit, faction fit, background hooks, objective families, pressure/reward/terrain preview copy, deterministic weights, risk offsets, and optional unlock gates. Fresh and progressed save eligibility, route-card copy, known-seed snapshots, content validation, and Act I route stability are covered by tests.

## Epic BB - Phase 9 Act II pacing, pressure, economy, and finale

### BB1 - Act II pacing and objective variants

Acceptance:

- Act II sectors use pressure bands, relief windows, objective variants, boss approach tuning, and summary/debug timelines.
- Longer run length adds readable escalation rather than constant maximum density.
- Existing long-scroll, enemy-rich, environmental, item-storm, forced-exit, and destruction smoke paths remain useful.

Status:

- Completed in work order 085 with Act II objective variants, length/pressure bands, route-conditioned pacing modifiers, second-act relief windows, boss-approach tuning, and deterministic pacing timeline coverage.

### BB2 - Act II combat and environmental pressure

Acceptance:

- Enemy roles, variants, formations, hazards, destructibles, obstacles, loose currency, and item-proc pressure use act-aware budgets.
- Debug summaries expose act pressure without relying on private app state.
- Fixed 640x720 combat-world parity and scroll-world environmental behavior remain intact.

Status:

- Completed in work order 086 with shared act-pressure selection, existing-system generator hints, and debug budget summaries.

### BB3 - Act II rewards, shops, and economy

Acceptance:

- Reward, shop, vault, elite, boss, loose currency, repair, reroll, and banked scrap expectations account for the longer two-act run.
- Act II rewards feel sharper without flooding the item catalog or permanent progression economy.
- Fresh and progressed saves have deterministic economy snapshots.

Status:

- Completed in work order 087 with a shared Act II economy profile for reward weighting, route payouts, shop stock/prices/rerolls, repair/vault scarcity, loose-currency budgets, summary copy, and deterministic fresh/progressed economy snapshots.

### BB4 - Second-act bosses and finale

Acceptance:

- Act II can resolve through a deterministic second-act boss or finale path.
- Victory, defeat, abandonment, unlock, and summary copy distinguish Act I from Act II outcomes.
- Boss-release hazard fairness remains protected when finale arenas suppress hazards.

Status:

- Completed in work order 088 with deterministic Act II finale variants, existing-arena boss hull and approach tuning, explicit victory/defeat/abandon copy, finale rows in run summaries, finale metadata in last-run save records, a Core Descent victory unlock hook, `Finale` debug overlay state, and an `F` debug shortcut that reaches the final-sector boss smoke. Work order 124 now settles finale hazards before lock instead of deferring them after release.

## Epic BC - Phase 9 release and QA

### BC1 - Act II debug smoke and accessibility

Acceptance:

- Debug shortcuts can reach the inter-act junction, Act II sector pressure, second-act boss/finale, and two-act summary.
- Overlay readouts expose act id/name/index, junction choice, route tags, pressure budgets, and finale state.
- High contrast, reduced motion, performance mode, narrow viewport, and keyboard-only flow remain readable.

Status:

- Completed in work order 089 with `J` inter-act junction smoke, `I` first Act II sector entry smoke, existing `F` finale smoke, and `Y` two-act summary smoke. Public helpers expose Act II sector indexes, deterministic debug route history, route tags, and summary result data, while overlays show route tags and objective state next to act progress, junction effects, act-pressure budgets, and finale telemetry. Playwright coverage now drives a narrow high-contrast/reduced-motion/performance Act II path through junction, pressure, finale, and summary.

### BC2 - Phase 9 release checklist

Acceptance:

- Release docs cover two-act determinism, inter-act flow, Act II route/sector content, pacing, economy, boss/finale, debug smoke, accessibility, performance, browser load, and manual gaps.
- `npm run check`, Playwright smoke where available, and production preview smoke pass before Phase 9 closeout.
- Known run-length, balance, browser, economy, and readability risks are documented.

Status:

- Completed in work order 090. Full checks pass with 66 test files and 379 tests, all 11 Playwright Chromium smoke paths pass, and production preview asset-path smoke returns HTTP 200 under `/StarbreakSalvage/`. Manual non-Chromium, real-device, deployed-browser, balance, economy, run-length, and late-run readability passes remain follow-up risks.

## Epic BD - Phase 10 expedition graph and missions

### BD1 - Expedition graph

Acceptance:

- Acts and sectors contain typed mission legs, encounter nodes, optional branches, transitions, pressure/duration bands, reward hooks, and finale gates.
- Same seed plus save state reproduces the graph; the same decision history reproduces the visited path and major outcomes.
- Older ten-sector seeds, summaries, and save records normalize safely.

Status:

- Implemented in work order 091. The generated run now owns a validated immutable expedition graph with two acts, ten sector plans, 40 stable encounter nodes/mission legs, ten optional branches, explicit entry/exit and transition policies, content/reward/shop references, checkpoint/finale gates, and 16.0-19.7 minutes of structural target capacity. Mutable decisions and visited-node progress live separately in `RunSession`, current one-lane sectors advance through a compatibility projection, public read models feed HUD/summary/debug/save surfaces, and v4 saves migrate to the v5 expedition-aware last-run schema.

### BD2 - Multi-stage mission runtime

Acceptance:

- Missions advance through explicit briefing, entry, combat, branch, relief, extraction, failure, and completion states.
- Frame catchup, simultaneous kills, item effects, despawns, pause, abandon, death, and boss gates cannot skip or soft-lock stages.
- Build, resources, act context, and scroll-world state carry between stages according to data contracts.

Status:

- Implemented in work order 092. Each expedition sector now compiles into a deterministic mission schedule with explicit briefing, entry, combat, branch, optional-combat, relief, extraction, failure, and completion stages. A guarded idempotent transition reducer centralizes objective completion, pause/resume, abandon, failure, and finale handling; data contracts control checkpoint hull/resource/world carry and optional stage-local combat projection. The live loop exposes mission HUD/debug/summary models and includes keyboard, pointer, reduced-motion, narrow-view, unit/integration, compatibility, and Chromium smoke coverage.

### BD3 - Objective grammar and mission anthology

Acceptance:

- At least eight multi-stage missions cover assault, pursuit, escort, salvage, defense, rescue, scan, sabotage, escape, or boss-approach verbs.
- Objectives declare success, partial-success, failure, branch, reward, faction, crew, and cleanup policies.
- Added run time comes from new decisions and active play rather than global slowdown or inflated hull.

Status:

- Implemented in work order 093. A validated objective grammar now composes ten authored multi-stage contracts across both acts: assault, pursuit, salvage, rescue, defense, scan, sabotage, escape, escort, and boss approach. Contracts declare success, partial-success, failure, outcome exits, optional-branch eligibility, rewards, faction/crew consequences, cleanup, relief, and stage-local world policy. Live objective evaluation reuses combat, waves, formations, hazards, destructibles, loose currency, bosses, route rewards, and mission transitions; outcomes feed HUD/debug copy, route previews, reward modifiers, and summary history. Known-seed, objective-safety, validation, integration, debug-jump, and Chromium coverage are green.

## Epic BE - Phase 10 shipcraft

### BE1 - Modular frames and hardpoints

Acceptance:

- Ship frames declare hardpoints, reactor, mass, cooling, heat routing, armor, shields, mobility, cargo, and command capacity.
- Modules declare slot, power, heat, mass, tags, uniqueness, compatibility, behavior, and presentation metadata.
- Existing contracts and weapons remain available through explicit compatibility adapters.

Status:

- Implemented in work order 094. Eight validated frames and 21 modules cover every shipcraft slot with explicit hardpoints, power, thermal, mass, command, compatibility, behavior, and presentation contracts. Deterministic starting loadouts now drive generated contracts, previews, HUD/debug telemetry, and summaries through stable signatures and resource read models. Compatibility adapters preserve every established ship stat and weapon implementation without duplicating projectile or collision behavior; legal primary swaps change weapons while leaving fixed hull geometry intact. Invalid slot, size, power, heat, mass, tag, uniqueness, frame/loadout compatibility, command, and adapter combinations fail validation. Version-5 saves require no migration because starting loadouts are derived rather than persisted. Fresh/progressed known seeds, content schemas, collision parity, controls, and Chromium surfaces are covered.

### BE2 - Salvage foundry and weapon evolution

Acceptance:

- Players can install, remove, scrap, reroute, fuse, and overclock deterministic component salvage during a run.
- Weapon evolution changes topology, targeting, heat, defense, economy, or hook behavior rather than only damage numbers.
- Item and module hooks have explicit ordering, combined proc budgets, debug state, and engineering history.

Status:

- Implemented in work order 095. Deterministic sector salvage now feeds a run-local foundry with reversible draft planning and explicit commit boundaries for install, remove, scrap, reroute, fuse, and overclock operations. Four quality tiers, nine sources, six affixes, and six bounded weapon recipes carry tags, compatibility, ancestry, instability, salvage value, resource costs, behavior, and presentation contracts. Evolutions materially alter topology, targeting, heat, defense, economy, or proc routing. Module and item hooks share an explicit deterministic order and 48-64 application budget with applied/skipped debug telemetry. The live post-reward foundry exposes legal/illegal previews, keyboard/pointer focus, narrow layouts, deterministic fusion outcomes, and commit-only salvage payouts; gameplay and summaries show the committed final ship and engineering history. Version-5 saves require no migration because engineering state ends with the run. Known seeds, save fingerprints, operation sequences, validation, combat effects, controls, summaries, and Chromium flows are covered.
- Reimagined in work order 123. `FoundryPresentation` derives draft-versus-commit resource envelopes, real primary-weapon output, traits, and component replacement deltas as pure read models. Hardpoint Control leads with a ship attack simulation and mini-HUD, uses meters and compact stat/modifier chips in place of raw tradeoff prose, and places direct P/H/M/C/instability comparisons on every compatible install action. Existing draft, legality, deterministic engineering, and commit boundaries remain authoritative.

## Epic BF - Phase 10 living expedition

### BF1 - Capital ships and stations

Acceptance:

- At least three reusable multi-part set pieces support targetable subsystems, safe collision geometry, staged destruction, objective hooks, and deterministic rewards.
- Set pieces integrate with hazards, formations, bombs, specials, item/module effects, loose currency, and boss locks.
- Performance and reduced-motion modes simplify visuals without changing geometry or stage timing.

Status:

- Implemented in work order 096. Seven shared component templates compose three original capital/station/wreck-convoy contracts with dependency-gated targets, exterior/interior/destruction stages, fixed safe lanes, deterministic one-shot rewards, objective credit, bounded turret/hangar pressure, hazard/bomb/special integration, scroll anchors, public debug/read models, and finale boss-lock release. Accessibility modes preserve collision geometry and stage timing while simplifying presentation; unit, deterministic, and Chromium coverage is green.
- Expanded in work order 129. Component identity and dependency data are now separate from nine authored layout records: each contract has flanked, mirrored, and reversed arrangements with layout-specific safe lanes and reinforcement positions selected by a named seed stream. Content validation requires every layout to place every component exactly once inside the fixed arena, preserve its safe lane, and leave a straight-fire corridor from a valid player position to every objective when that dependency layer unlocks. The first Hecaton arrangement therefore remains viable for corrected single/dual forward weapons without restoring the former universal projectile fork.

### BF2 - Faction campaigns and rivals

Acceptance:

- Run-local faction state records aid, hostility, stolen assets, spared targets, contracts, and territory pressure.
- Named rival captains can escape, adapt, recur, and intervene through deterministic decision history.
- Faction/rival state changes later missions, shops, encounters, crew offers, set-piece ownership, or finale conditions.

Status:

- Implemented in work order 097. Four data-backed faction response policies and five rival archetypes produce four unique seed-plus-save captains per run. A bounded, idempotent campaign event fold tracks aid, hostility, stolen assets, spared targets, contracts, territory pressure, mission outcomes, rival injuries/upgrades/grudges, and escape/capture/destruction. Those records alter later briefings, routes, enemy composition and pressure, shops, crew-offer signals, set-piece ownership, and finale intervention. Rival combat shares centralized accounting but remains optional to required objectives; terminal rewards are one-shot, public debug state includes a deterministic `R` recurrence fixture, and known-seed decision histories reproduce all later influence.

### BF3 - Crew and wingmates

Acceptance:

- Recruitable crew and wingmates have roles, traits, commands, trust, injury, rescue, departure, and summary outcomes.
- Ally AI and focus/screen/salvage/regroup/disengage commands are bounded, deterministic, accessible, and objective-safe.
- Crew is acquired through mission consequences and expands variety without mandatory permanent power.

Status:

- Implemented in work order 098. Five data-backed crew roles generate deterministic seed-plus-save candidates acquired through rescue/specialist outcomes or trusted faction distress branches, never a free roster menu. Run-local state tracks command capacity, trust, missions, defeats, salvage, injuries, two-sector recovery, disengagement, foundry assists, and departures. Up to three fitted allies use bounded target and pickup scans plus centralized combat/objective accounting under remappable focus, screen, salvage, regroup, and disengage commands. HUD, pointer controls, non-color rendering, briefings, routes, foundry copy, summaries, debug state, and the public `T` fixture expose the system across accessibility modes.

## Epic BG - Phase 10 release and QA

### BG1 - Expedition Scenario Lab

Acceptance:

- Debug tooling can launch expedition nodes, mission stages, loadouts, foundry states, set pieces, rivals, crew, and combined stress through public models.
- A bounded local-only run timeline records duration, choices, economy, engineering, faction, rival, crew, boss, and failure events without telemetry.
- Chromium smoke covers representative Phase 10 systems under accessibility/performance settings while existing smoke remains green.

Status:

- Implemented in work order 099. Eight declarative debug-only scenarios create fresh deterministic sessions through public mission/session helpers and open the normal transition, gameplay, and foundry surfaces for expedition nodes, optional stages, loadouts/engineering, set pieces, rivals, crew, combined pressure, and timeline audit. The local run timeline is deterministic, summary-readable, save-safe, telemetry-free, and bounded to 96 display entries plus 192 processed ids. Debug instrumentation combines mission actors, 7-8 set-piece parts, up to three allies, item/module proc budgets, environment/object/pickup pressure, timeline categories, and cleanup-relevant entity counts. A 390x700 keyboard-only Chromium path covers high contrast, reduced motion, performance mode, combined stress, timeline, and foundry while the full 12-path suite preserves prior shortcuts.

### BG2 - Phase 10 release checklist

Acceptance:

- `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke pass before Phase 10 closeout.
- A fresh-save expedition can traverse multi-stage missions, transform its ship, encounter a set piece, and resolve with faction/rival or crew consequences.
- Manual browser, device, duration, balance, content-volume, readability, ally-AI, and combinatorial risks are documented.

Status:

- Implemented in work order 100. The Phase 10 audit found no severe release blocker; the deployed all-optional run measures about 12 minutes and demonstrates real mission/decision depth at the target floor. `npm run verify:release` passes with 79 files/463 tests, all 12 Chromium paths, and repeatable HTTP 200 production-preview checks for the Pages base and emitted hashed assets. Release, QA, performance, architecture, README, changelog, project, Phase 10, and work-order docs now distinguish structural success from unfinished balance, content volume, art/audio, narrative, ally-AI feel, combinatorial builds, manual browsers/devices, and sustained profiling. Preview smoke is scripted and runs in CI; bundle/module scale moves into work order 101 rather than being hidden. Phase 10 is complete as a local expedition-depth and shipcraft playtest candidate.

## Epic BH - Phase 11 expedition kernel and topology

### BH1 - Resumable expedition kernel

Acceptance:

- Versioned run snapshots preserve deterministic plan identity, decisions, checkpoints, build/economy, mission, faction/rival, crew, and bounded timeline state separately from permanent progression.
- Corrupt/incompatible snapshots recover safely and endurance fixtures repeatedly cross every Phase 10 boundary without leaks or duplicate rewards.
- Large orchestration modules gain explicit domain seams, and measured code splitting improves low-frequency/debug loading where practical.

Status:

- Implemented in work order 101. A separate `starbreak.run.v1` snapshot stores regenerated-plan identity, contract, safe target, complete Phase 10 session state, and reserved null carrier/boarding/front/fleet/apex extensions under a 512 KiB cap. Restore validates graph/fingerprint, mission stage, engineering, items/economy, faction/rivals, crew, and timeline before scene entry; corrupt/unsupported snapshots are removed without touching permanent save v5. Automatic briefing/operation checkpoints, explicit pause suspend, keyboard/pointer main-menu resume/discard, and run-end/new-contract/reset cleanup are live. The public endurance harness repeats eight Scenario Lab boundaries plus the finale across snapshot regeneration and reports snapshot/history/build/set-piece budgets. Scenario Lab code emits as three lazy chunks totaling 9.80 kB; the core bundle is 663.24 kB with snapshot functionality included, so further domain extraction and code splitting remain active architecture work rather than a warning-limit exception.

### BH2 - Constellation-aligned sector operations

Acceptance:

- Each constellation sector executes one complete required combat operation plus one paired optional post-sector challenge.
- Decisions alter future structure and reproduce from seed plus snapshot/decision state.
- World carry and cleanup contracts prevent soft locks, invisible retained work, and duplicate payouts.

Status:

- Implemented in work order 102, simplified in work order 134, and aligned to the constellation in work order 139. Expedition graph v2 still supplies ingress, advance, detour, staging, gate, pursuit, and extraction compatibility data, but a fresh mission enters one full-profile gate operation and then offers its paired pursuit from the cleared sector node. Advance, approach, detour, and staging ids remain resolvable for deployed v11 checkpoints and Scenario Lab fixtures without appearing in fresh stage counts. Checkpointed hull/build/resources/world state, bounded outcomes, zero-retained cleanup, idempotent optional salvage, and future-pressure consequences remain intact.

## Epic BI - Phase 11 frontier and staging

### BI1 - Null Frontier Act III

Acceptance:

- Five new frontier sector families, campaign variants, missions, routes, environments, and bosses extend standard authored capacity into a 15-20 minute band and completionist capacity beyond 20 minutes without slowing simulation.
- The Act II boundary offers a complete extraction outcome or deterministic frontier breach.
- Act III reuses shared engine, snapshot, save, summary, timeline, and accessibility contracts.

Status:

- Implemented in work order 103 and remeasured from the executable itinerary in work order 139. The shared voyage contains a deterministic five-sector Act III with three coherent campaign variants, five environmental laws, five mission contracts, six route contracts, faction/engineering hooks, five backgrounds, and three frontier bosses. The Act II finale resolves into an accessible complete-extraction or state-carrying breach choice; the selected outcome is idempotent, timeline-visible, snapshot-v11-safe, and summary/save-aware. One required operation per sector projects 1,009 seconds (16.82 minutes) standard; taking all 15 paired holds projects 1,264 seconds (21.07 minutes).

### BI2 - Mobile salvage carrier

Acceptance:

- Run-local facilities, damage, debt, heat, cargo, crew posts, and travel posture change later missions, shipcraft, recovery, faction access, and support options.
- Carrier staging is concise, accessible, deterministic, and snapshot-safe.
- Carrier growth expands run variety rather than permanent raw power.

Status:

- Implemented in work order 104. Three seed/save-stable carrier plans use four limited slots drawn from seven facility types. A bounded reducer supports repair, replacement, rerouting, upgrades, crew posts, posture, cargo, and deterministic hull/heat/debt/pursuit/access consequences with one optional staging action per sector. Carrier influence changes mission access, engineering, recovery, rewards, faction markets, and bounded future support/boarding capacity. Snapshot v4, summaries, timeline, lazy command-deck UI, public `Q` fixture, unit/endurance coverage, and narrow accessible Chromium flow are live.

### BI3 - Boarding and derelict incursions

Acceptance:

- Deterministic interior room/corridor operations support breach, secure, rescue, sabotage, salvage, escort, and extraction verbs.
- Existing build identity, controls, collision, objective, reward, and cleanup contracts translate into the new scale.
- Four or more boarding contracts connect to carrier, crew, factions, foundry, rivals, or apex hunts.

Status:

- Implemented in work order 105. Six deterministic boarding contracts cover capital ships, stations, wrecks, derelicts, and every requested verb through bounded four-to-seven-room plans, doors/bulkheads, subsystem rooms, hazards, loot custody, partial success, retreat, timed extraction, and zero-retained cleanup. Selected optional expedition nodes project those plans through the existing combat/build/objective/collision engine. Outcomes feed carrier cargo, crew recruitment, faction history, foundry inventory, rival capture, and future apex hooks. Snapshot v5, run summaries/timeline, carrier-capacity gating, and a ninth accessible Scenario Lab fixture are live.

## Epic BJ - Phase 11 living campaign

### BJ1 - Dynamic faction fronts

Acceptance:

- Territory, blockades, convoys, markets, distress lanes, and contested assets move deterministically from explicit outcomes.
- Fronts create, transform, or close later nodes and change play space, ownership, support, prices, and endings.
- Every faction supports readable alliance, hostility, and opportunist strategies.

Status:

- Implemented in work order 106. Every run receives one deterministic front per sector and all four factions expose distinct alliance, hostility, and opportunist strategies. Explicit aid, theft, contract, mercy, rival, boarding, crew, and carrier events move later fronts through bounded state. Fronts create, transform, or close reserve nodes and feed shared ownership, market, hazard, reinforcement, support, recruit, carrier-access, set-piece, finale, and ending influence. Snapshot v6, summaries/timeline/debug forecasts, endurance budgets, and a tenth accessible Scenario Lab fixture are live.

### BJ2 - Crew bonds and specialist arcs

Acceptance:

- Eight or more multi-node crew arcs cover bonds, conflicts, fears, ambitions, promotions, loyalty, rescue, departure, and mutiny.
- Relationships create options and complications rather than unconditional stat growth.
- Crew fate and major relationships remain deterministic, resumable, accessible, and summary-readable.

Status:

- Implemented in work order 107. Ten deterministic three-node arcs cover bonds, conflicts, fears, ambitions, loyalty, promotion, paired abilities, specialist posts, rescue, departure, mutiny, and succession. Only explicit mission, carrier, boarding, faction, rival, injury, module, command, and rescue outcomes advance them. Crew Quarters exposes two-way risk-bearing decisions and full rank/fate/relationship state. Combat consumes bounded tradeoffs through command cost, formation durability, cadence, and partner availability; roster departure/mutiny and trust remain authoritative. Snapshot v7, summaries/timeline/debug state, endurance bounds, and an eleventh accessible Scenario Lab fixture are live.

### BJ3 - Fleetcraft and deployable support

Acceptance:

- Five or more support-craft roles add combat and itinerary options through carrier/crew/engineering integration.
- Construction, command, loss, repair, and recovery stay run-local and deterministic.
- Player, ally, fleet, set-piece, projectile, effect, and proc pressure share explicit combined budgets.

Status:

- Implemented in work order 108. Six deterministic support roles cover pursuit, projectile screening, salvage recovery, formation repair, boarding insertion, and damaged-craft recovery. Construction/refit consumes engineering cargo and salvage inside carrier hangar limits; crew assignment trades a wingmate for improved craft response, and craft persist through ready, damaged, lost, recovered, and repaired states. Five doctrines reuse the existing formation commands and a shared four-ally/20-projectile combat ceiling. Fleet influence reaches boarding, optional operations, carrier transit, fronts, crew arcs, summaries, snapshot v8, and the twelfth accessible Scenario Lab fixture.

## Epic BK - Phase 11 apex campaign and release

### BK1 - Apex hunts and divergent endings

Acceptance:

- Three or more roaming apex campaigns span multiple nodes with persistent damage, traces, lieutenants, migrations, and escape routes.
- Carrier, boarding, fronts, rivals, crew, fleet, and frontier decisions alter later confrontations.
- Destruction, capture, containment, bargain, or evacuation endings resolve explicit state and unlock variety.

Status:

- Implemented in work order 109. Three deterministic four-contact campaigns use trace-chain, siege-break, and migration-net structures. Persistent integrity, subsystem wounds, traces, lieutenants, migrations, escape routes, boarding sabotage, and missed-finale escapes alter bounded boss profiles and remain visible in the dossier/HUD/debug state. Faction fronts, resolved rivals, crew bonds/officers, carrier facilities, support craft, and frontier choices gate destruction, capture, containment, bargain, and evacuation dispositions. Three original apex bosses reuse centralized combat budgets and objectives; snapshot v9, summaries/timeline, three variety unlocks, endurance bounds, and a thirteenth accessible Scenario Lab fixture are live.
- Reimagined in work order 131. Every trace, ambush, lieutenant, and finale is now a named marked contact with a combat directive and stated lasting effect. The dossier presents a pursuit timeline, named integrity/subsystem condition, explained evidence, finale pressure, and advance previews of all supported dispositions; locked finale routes expose exact source scores and deficits. Hunt-earned trace intelligence, command codes, exposed cores, breached armor, and disrupted drives now contribute beside carrier, crew, faction, rival, fleet, and frontier state, while persistence and shared combat budgets remain unchanged.

### BK2 - Voyage release candidate

Acceptance:

- Suspend/resume, save v6 migration, multi-operation cleanup, frontier/carrier/boarding/front/crew/fleet/apex systems, and divergent endings pass release audit.
- Scenario Lab and endurance fixtures reach every Phase 11 system through public models.
- `npm run verify:release`, measured run-length evidence, production paths, and explicit manual risks close the phase.

Status:

- Implemented in work order 110 and remeasured against the refitted schedule in work order 139. The release audit found no severe Phase 11 blocker across snapshot/save recovery, executable topology and cleanup, frontier endings, carrier, boarding, fronts, crew arcs, fleetcraft, apex hunts, summaries, accessibility automation, browser load, or Pages paths. Scenario Lab supplies sixteen public fixtures with carrier-command, frontier-ending, and snapshot/duration audit cards. Endurance round-trips all fixtures plus the finale and restores one frontier snapshot into both decisions; Chromium resumes combat and post-sector checkpoints before reaching extraction victory. Deterministic authored measurements are 16.82 minutes fresh/progressed standard, 11.08 early extraction, and 21.07 completionist, while real full-voyage fatigue and non-Chromium/device evidence remain manual.

## Epic BL - Phase 12 construction grammar

### BL1 - Socketed upgrade circuits

Acceptance:

- Installed major components expose limited typed upgrade sockets, and acquired items remain portable inventory whose mechanics activate only while validly fitted.
- Fit, eject, move, swap, component replacement, undo, skip, commit, preview, combat, economy, and snapshot flows share one deterministic reconciliation model.
- Circuit order creates materially different projectile and retaliation chains, with bounded recursion and readable cause-and-effect in Hardpoint Control.

Status:

- Implemented in work order 132 and refitted in work order 145. Every module still provides a native and flex conduit, but physical component/socket coordinates are now automatic routing state rather than a player-facing placement puzzle. Hardpoint Control exposes one ordered ship-level signal rail with append, eject, and earlier/later controls; installed components advertise compact capacity/channel extensions, and cumulative stage output feeds the existing live-fire preview. `ItemSockets` preserves explicit circuit order, deterministically rematches live items across compatible remaining conduits after engineering changes, and leaves deliberately racked items inactive. The snapshot-v12 shape remains compatible while exact reconciliation rejects duplicate order, ghost components, invalid compatibility, and duplicate physical claims. Six previously weak or placeholder upgrades still form order-sensitive phase, split, clone, ricochet, arc, curse, overkill, revenge, blast, and salvage interactions; only live circuit items reach combat, route, reward, shop, or preview hooks.

### BL2 - Procedural carrier navigation hubs

Acceptance:

- Sector intermission is a seeded spatial navigation layer with selectable destinations, operational detail, visit state, and explicit transit.
- Shop, Hardpoint Control, Fleet Bay, Crew Quarters, and Apex intelligence share one carrier-service grammar and remain visible unless an authored story lock explains why access is unavailable.
- Rewards flow into cargo, service visits are optional/repeatable, mission launch remains authoritative, and snapshot/accessibility contracts cover the whole hub.

Status:

- Implemented in work order 133 and evolved in work order 134. The navigation scene exposes service state, resources, pointer/Tab/spatial-arrow control, responsive layouts, explicit travel, and a compact story-first launch detail. Reward components enter cargo before transit instead of forcing Hardpoint Control; common services return to the same hub, snapshot v11 persists unique visits and resets them per sector, and explicit story reasons are the only service-lock input. WO134 retains those contracts while moving services out of route connectivity and replacing the per-sector local tree with the act constellation described below.

### BL3 - Act-scale route constellations and paired holds

Acceptance:

- One seeded sector constellation persists through each act, resolves only actionable progress, and refreshes at the next act boundary.
- Common carrier services float outside route connectivity while remaining visible and locally available under explicit story locks.
- Clearing the sector's single required operation returns to the chart: the current node offers one paired optional hold, while the newly actionable next-sector node continues the expedition without a separate approach or staging sequence.
- Fresh sectors expose exactly one optional combat after their required gate; act-final continuation does not draw a false edge into the next act's independently seeded constellation.

Status:

- Implemented in work order 134, flow-refined in work orders 135, 138, and 139, discovery-refined in work order 137, and destination-effect-refined in work order 146. `ActConstellation` supplies the act's completed/current/hidden base projection; later sectors stay anonymous until the post-sector presentation promotes legal destination edges to `choice`. `ConstellationMap` renders the shared hub grammar with spatial controls and bounded resolve motion, plus a reduced-motion-safe pulse on active sector choices. Sector Navigation composes five unlinked service satellites around the chart. Fresh missions launch one complete gate-profile sector operation and return with `OPTIONAL` on the cleared node while each legal next node exposes one route effect and destination commit. Compatibility-only advance/staging stages and the Operational Map remain valid for deployed checkpoints without entering fresh play. Snapshot v12 remains authoritative without new fields for route-effect presentation.

### BL4 - Embedded constellation route plotting

Acceptance:

- Route selection occurs in the newly actionable destination's constellation detail instead of a separate full-screen choice scene.
- One concise next-mission brief and one seeded base effect per destination replace repeated campaign/debug dumps and the secondary route trio while preserving every route consequence.
- Direct, optional, service-return, act-boundary, final-extraction, accessibility, and snapshot-v11 flows remain coherent.

Status:

- Implemented in work order 136, flattened with the paired hold in work order 138, and collapsed to destination-owned effects in work order 146. `RouteNavigation` projects the completed-to-next-sector edge, next contract/objective, and one deterministic base effect selected from the destination's internal authored candidates. `SectorTransitionScene` marks each destination with its difficulty and effect, labels the source `OPTIONAL`, and renders one explicit destination commit. After optional resolution, the source becomes `DEPARTED`. Cross-act and terminal choices stay local rather than creating false edges. Work order 140 moves required-sector rewards ahead of this plot; `GameApp` then retains route outcome, shop/event, component-salvage, and advance ordering, returns common services to the pending plot, checkpoints extraction-stage route plots through the compatible operational-map target, and enters same-act combat directly once route settlement completes.

### BL5 - Unknown future signals and active destination emphasis

Acceptance:

- Unavailable future sectors retain anonymous labels and hidden edges until the post-sector chart makes exactly one next destination selectable.
- Current and actionable sector choices pulse gently without moving hit targets; hidden/completed/service nodes remain still.
- Reduced-motion and performance settings use a static active outline, and constellation visibility remains derived rather than persisted.

Status:

- Implemented in work order 137. The base act plan no longer has a `revealed` status. `SectorTransitionScene` resolves only its known onward or route target from immutable run generation and promotes only that edge to `choice`. CSS isolates active emphasis in a pseudo-ring with a 3.2-second cycle and static accessibility fallbacks; deterministic and Chromium coverage proves anonymous opening signals, just-in-time S2 resolution, and active-node emphasis.

### BL6 - Flat post-sector flight board

Acceptance:

- The first post-sector view offers one local optional hold and the legal next-sector destinations with their base effects simultaneously, with no separate continuation or secondary route commitment.
- The source node exclusively owns the optional action, each target node owns one seeded route effect, and all ready nodes use the same beige pulsing state. The source sublabel remains `OPTIONAL` instead of exposing availability as `HOLD ONCE` or `SETTLED`.
- Direct destination commitment preserves default-branch, relief, route outcome, service, component-salvage, and sector-advance ordering; optional choice preserves its guarded combat path and then returns to the same destination effects.
- Required-sector reward settlement occurs before this board; same-act route completion enters the next sector directly without a second reward or constellation briefing. Each selected-node action set remains keyboard/pointer accessible and fits the standard detail pane without internal scrolling.

Status:

- Implemented in work order 138, reordered in work order 140, and simplified in work order 146. `GameApp.showMissionBranch` exposes a shared branch-commit seam so direct destination selection can settle the default branch and relief synchronously before entering the existing route pipeline. `SectorTransitionScene` composes the optional and destination inputs in one map while keeping their actions in separate source and target details; the latter now commits its single node-bound effect. `GameApp.beginCurrentSectorOperation` reuses the existing briefing/entry reducer events after same-act route settlement, avoiding a second hub visit. Required rewards settle before the board and optional/route paths do not duplicate them. No mission, route-outcome, or snapshot schema changed.

### BL7 - One operation per sector node

Acceptance:

- A sector briefing launches one full authored required operation; no second required combat or Command Deck is hidden behind the same constellation node.
- Completion exposes that sector's paired optional challenge and each legal next destination's base route effect simultaneously through the flat flight board.
- Every sector's optional remains playable regardless of secondary carrier, boarding, faction-front, or objective-outcome projections; those systems may alter stakes and consequences instead of removing the choice.
- Deployed snapshot and Scenario Lab targets inside legacy advance/staging stages remain recoverable, while fresh readouts count only the executable path.

Status:

- Implemented in work order 139. `MissionDirector` sends fresh entry to a full-profile gate operation and marks advance, approach, detour, and staging stages as compatibility-only. Gate outcomes converge on the post-sector branch after their normal settlement, and `GameApp` keeps the generated pursuit option when optional campaign projections are unavailable. Deterministic schedule sweeps prove all 15 sectors follow required operation -> optional-or-route -> next required operation, with snapshot v11 and stable graph ids unchanged.

### BL8 - Immediate operation reward settlement

Acceptance:

- Each first-pass required sector pays out before its optional hold and onward routes become actionable.
- Optional holds and route events/shops do not create duplicate reward stops; route component salvage and direct next-sector entry remain intact.
- Incoming route effects and the preceding optional outcome shape the next required sector's reward deterministically, while selected rewards persist in the following constellation checkpoint.

Status:

- Implemented in work order 140. `RewardScene` derives its context from settled incoming route history instead of an unchosen onward route, and `GameApp` opens it at required-gate settlement before the flat flight board. Optional outcomes are carried one sector forward into reward modifiers; route events and shops now lead directly through component salvage to sector advance. Existing route reward seed streams and snapshot v11 remain compatible.

### BL9 - Direct inter-act handoff

Acceptance:

- Clearing and claiming the Act I sector-5 reward enters the midpoint refit without showing an Act II route on the completed Act I chart.
- Default branch, relief, extraction, sector advance, and inter-act reducers settle once without inventing a route outcome, shop/event, or route component.
- Ordinary within-act routes, the Act II frontier decision, deployed extraction checkpoints, and snapshot v11 remain valid.

Status:

- Implemented in work order 141. `getInterActHandoffAfterSector` identifies the Act I terminal boundary from immutable act plans. Fresh branch flow and restored extraction flow both bypass the constellation route presentation and reuse the existing extraction advance into `InterActJunctionScene`. The Act II debug fixture now exercises that real boundary; no run schema or generated graph changed.

### BL10 - Safe constellation suspension

Acceptance:

- Every briefing, post-sector board, and unresolved route plot offers an explicit exit to the main menu without abandoning the expedition.
- The checkpoint must succeed before the scene exits; Resume reconstructs the same pending constellation actions without replaying settlement or combat.
- Pointer, Escape, keyboard Resume, narrow layout, snapshot v11, and permanent-save isolation remain valid.

Status:

- Implemented in work order 142 and presentation-refined in work order 146. `SectorTransitionScene` owns one shared `Suspend & Exit` presentation and maps both non-combat back and pause actions to it. `GameApp` checkpoints ordinary constellation modes as `sectorTransition` and unresolved route plots as `operationalMap`, then returns to the existing resume-capable main menu only after storage succeeds. The node-owned effect is regenerated from the immutable run seed and target on resume, so no presentation field or schema change is required.

### BL11 - Forking act route constellations

Acceptance:

- Each act is a deterministic forward-only `1-2-3-2-1` graph containing nine sector candidates and exactly five visited layers.
- Route ranks form an easy/standard/hard spread: `2A -> 3A/3B`, `2B -> 3B/3C`, and shared `3B` is standard difficulty; each destination carries one seeded base effect and one paired optional challenge after completion.
- Constellation state, mission contracts, bosses, set pieces, rewards, summaries, capacity, debug tools, and progression derive from explicit topology or route layer rather than array adjacency.
- All legal paths reach convergence without backtracking, all nine nodes are reachable across paths, and incompatible pre-topology snapshots retire without touching permanent progression.

Status:

- Implemented in work order 143 and route-effect-refined in work order 146. `ActRouteGraph` supplies nine nodes and 14 edges per act, explicit difficulty/readout metadata, legal target queries, and exhaustive five-layer path coverage. Generation creates 27 candidate sectors while the playable voyage remains 15 sectors. `SectorTransitionScene` plots both legal destination nodes, displays and commits each node's base effect directly into combat, and reconstructs chart history from canonical recorded destinations so hard paths never appear as default A-node paths. Mission contracts key off route layer, generated set pieces stay attached to semantic act roles, release accounting filters a legal canonical path, and snapshot v12 remains authoritative.

### BL12 - Apex HUD stub visibility

Acceptance:

- Ordinary sectors without an apex encounter render neither an empty contact-banner frame nor an apex HUD pill.
- Real apex contacts retain their authored timed banner, readable copy, contrast treatment, and responsive placement.
- Apex plans, combat effects, progression, saves, and deterministic generation remain unchanged.

Status:

- Implemented in work order 144. The apex contact banner now has an explicit hidden-state display rule, preventing its grid layout from overriding the native `hidden` attribute when no encounter presentation exists.

### BL13 - Destination-owned route effects

Acceptance:

- Every actionable destination node exposes exactly one deterministic base route effect; choosing the node and committing it settles that effect without a second trio of travel-vector choices.
- The effect is selected from the destination's own authored candidates. A shared node therefore carries the same effect from every legal parent, and suspension/resume reconstructs it without persisted presentation state.
- Easier nodes strongly favor the safer end of their candidate pool, harder nodes strongly favor the severe end, and standard/convergence nodes favor the middle while retaining seeded variety.
- Node labels, detail copy, risk, consequence, keyboard focus, route shops/events, combat modifiers, rewards, component salvage, direct sector entry, and GitHub Pages behavior remain coherent.

Status:

- Implemented in work order 146. `RouteNavigation.selectNodeRouteEffect` owns a dedicated seed stream keyed to the target sector and weights normalized candidate risk by route-node difficulty. The constellation surfaces difficulty plus effect on every ready node, presents one bounded base-effect dossier, and commits it through the existing route settlement pipeline. Internal three-option content pools remain available to generation, validation, and debug tooling but no longer create a second player decision.

### BL14 - Distilled run debrief

Acceptance:

- Run closeout uses a wide browser-scale composition and fits an ordinary 1280x720 summary without scrolling.
- Outcome, six totals, final ship/circuit, topology-aware flight path, three defining upgrades, three defining turns, archive recovery, seed sharing, and menu return form the entire player-facing information hierarchy.
- Long engineering, mission, campaign, crew, fleet, apex, hazard, pacing, economy, objective, and timeline ledgers remain diagnostic data and never expand the closeout DOM.
- Direct act handoffs and forked route history produce exact route nodes and sector totals; long histories, upgrade inventories, and unlock batches collapse deterministically to bounded highlights and counts.

Status:

- Implemented in work order 147. `RunDebrief` provides the bounded pure read model, including explicit route-graph act/layer accounting, while `RunSummaryScene` renders the full-browser responsive debrief. Three-upgrade, three-turn, two-unlock-name, and highlight-length caps prevent run duration from controlling menu height. The legacy raw summary formatters remain available to tests and diagnostics but no longer feed the player scene.

### BL15 - Direct Act II frontier handoff

Acceptance:

- Completing and claiming the Act II convergence reward settles its default branch and enters the extraction-or-breach frontier choice without exposing a paired Act II optional.
- Fresh branch flow and restored extraction-stage snapshots bypass destination projection, preventing a terminal constellation with no legal child node.
- Act I midpoint refit, ordinary same-act optionals and destinations, frontier extraction/breach outcomes, and Act III victory remain unchanged.
- Reward timing, reducers, deterministic generation, saves, snapshot v12, accessibility, and static hosting remain valid.

Status:

- Implemented in work order 148. `getActBoundaryHandoffAfterSector` gives fresh and restored UI flow one immutable Act I/Act II boundary rule. Terminal branches commit their authored default path and extraction checkpoints advance through the existing handoff reducer, so Act II now reaches `FrontierGateScene` without an optional challenge or empty route plot.

### BL16 - Act-scaled component circuit capacity

Acceptance:

- Contract-issued components provide one circuit slot, Act I salvage components provide two, and Act II/III salvage components provide three.
- Contract slots are universal so the three-item field kit remains live; recovered slot types preserve component identity while adding flex capacity, and quality or route rarity do not alter the count.
- Initial fitting maximizes compatible typed-channel use, while replacement reconciliation preserves live order and deliberate rack choices.
- Hardpoint Control, circuit summaries, snapshots, deterministic generation, accessibility, and static hosting share the same capacity projection.

Status:

- Implemented in work order 149. `ComponentCircuit` derives one/two/three slot tiers from the existing component source and acquisition sector, so no snapshot migration is required. Item routing and Hardpoint presentation consume that projection directly, and starter auto-fit now uses the bounded circuit matcher to avoid greedy channel conflicts.
