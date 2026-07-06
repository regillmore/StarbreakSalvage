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

- First pass implemented in work order 025 with deterministic debris lane, warning beam, mine belt, salvage storm, and crush gate windows. Hazards telegraph before becoming active, damage through the normal player-hit path, render under bullets at low alpha, and have unit coverage for determinism, validation, collision, and reduced-motion styling.

## Epic V - Boss arenas

### V1 - Arena transition

Acceptance:

- Boss sectors scroll into an arena/approach zone.
- Scrolling locks or slows during boss fights.
- Boss defeat returns to route or victory flow.

Status:

- First pass implemented in work order 026 with deterministic arena approach/lock/release distances, approach slowing, arena scroll locks, and post-defeat exit travel. Route-conditioned boss approach variants are now covered by work order 027; visual arena framing remains a follow-up.

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

### AJ2 - Lunar features

Acceptance:

- Lunar sectors have at least two landmarks and two hazard patterns.
- Hazards have deterministic distance windows and readable telegraphs.
- Features remain under bullets and respect high-contrast/reduced-motion settings.

### AJ3 - Lunar encounter pacing

Acceptance:

- Lunar waves and route-conditioned effects feel distinct from existing sectors.
- Debug counters remain useful for lunar backgrounds/features.
- Known seeds can reproduce lunar sector plans.

## Epic AK - Ship destruction and Phase 5 release

### AK1 - Rich player destruction

Acceptance:

- Player death includes ship breakup, themed debris, cockpit failure, or transponder cues.
- Death-to-summary transition remains reliable.
- Reduced motion, performance mode, high contrast, and mute settings are respected.

### AK2 - Phase 5 smoke and release docs

Acceptance:

- Smoke coverage or manual matrix covers Upgrade Bay, sector exit toast, lunar sector, and ship destruction.
- `npm run check`, E2E smoke, and production preview smoke pass before Phase 5 closeout.
- Known progression balance, browser, and readability risks are documented.
