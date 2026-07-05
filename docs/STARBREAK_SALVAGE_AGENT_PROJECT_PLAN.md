# Starbreak Salvage — Project Plan

## Current project assumption

`regillmore/StarbreakSalvage` is treated as a greenfield public GitHub repository. This plan assumes no existing code should be preserved unless later local files contradict that assumption.

## Product outcome

Ship a complete, static, browser-playable vertical roguelike shooter on GitHub Pages with:

- randomized starting ship/class contracts;
- seeded runs;
- permadeath;
- permanent unlocks;
- item synergies;
- original retro sci-fi presentation;
- local save data;
- no backend.

## Success criteria

The project is successful when a player can open the GitHub Pages URL, start a seeded run, choose from randomized contracts, complete multiple sectors, collect synergistic items, die or win, see a run summary, unlock new content, and replay or share the seed.

## Phase status

Phase 1 is complete as of the M10 release and first-pass audio/VFX follow-up. The project has a deployed alpha foundation: build/release workflow, deterministic generation, combat MVP, route/reward/shop screens, save/unlock data, settings/accessibility basics, seed sharing, and original procedural feedback.

Phase 2 is complete as of deployed and confirmed work order 020. It turned the alpha foundation into a more cohesive playtest slice: full-run structure, sector objectives, player verbs, boss escalation, expanded content, unlock gating, onboarding, balance, debug tooling, and release docs.

Phase 3 is complete as of deployed and confirmed work order 030. It made Starbreak Salvage feel like a first-pass vertical-scrolling arcade roguelike: deterministic sector distance, procedural backgrounds, scroll-synced waves, distance objectives, hazards, landmarks, boss arena transitions, route-conditioned sector physics, velocity cues, and long-scroll instrumentation.

Phase 4 is complete as of validated work order 040. It added display/input/identity polish: window-size parity, optional mouse controls, contract-specific ship visuals, new-game ship previews, a contract-themed graphical HUD, keyboard/pointer accessibility hardening, ship-specific combat feedback, non-combat contract theme propagation, viewport/input/HUD debug smoke, and release documentation.

Phase 5 begins from that display/input playtest candidate. Its goal is progression and sector-feedback depth: banked scrap purpose, upgrade bay icons and purchases, upgrade-influenced future runs, sector completion exits/toasts, a lunar surface sector family, and richer player ship destruction.

See `docs/STARBREAK_SALVAGE_PHASE_5_PLAN.md` for the active Phase 5 roadmap. `docs/STARBREAK_SALVAGE_PHASE_4_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`, and `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md` remain historical records for concluded phases.

## Milestones

### M0 — Seed and scaffold

Scope:

- Commit `AGENTS.md` and docs.
- Initialize Vite + TypeScript.
- Add scripts: dev, build, preview, test, test:e2e, lint, format, check.
- Add CI and GitHub Pages workflows.
- Render a placeholder page.
- Add README.

Exit criteria:

- `npm run check` passes.
- `npm run build` creates `dist`.
- Pages deployment workflow exists.

### M1 — Game shell

Scope:

- Fixed-step loop.
- Canvas renderer.
- Input manager.
- Scene manager.
- Main menu, gameplay placeholder, pause, run summary.
- Player movement.
- Debug overlay.

Exit criteria:

- Player movement is smooth.
- Pause works.
- E2E can start a run.

### M2 — Combat MVP

Scope:

- Primary fire.
- Enemy spawner.
- Projectiles.
- Collision.
- Health/damage/death.
- Pickups.
- One boss.
- Placeholder VFX/SFX.

Exit criteria:

- Player can kill enemies and die.
- One boss can be defeated.
- No major frame drops in normal combat.

### M3 — Roguelike loop

Scope:

- Seeded run generator.
- Contract selection.
- Reward choices.
- Route cards.
- Shops.
- 15–20 items.
- Item hooks/tags.
- Sector transition.
- Local save skeleton.

Exit criteria:

- Same seed produces same contracts/routes/rewards.
- At least four meaningful synergies exist.
- Unlock persists after run.

### M4 — Content alpha

Scope:

- 5–8 contracts.
- 35–50 items.
- 4 factions.
- 5 sectors.
- 5 bosses.
- 10+ unlocks.
- Balance pass.

Exit criteria:

- At least three viable build archetypes.
- Content validation covers all tables.
- Several complete runs are possible.

### M5 — UX/polish/accessibility

Scope:

- Settings.
- Remappable controls.
- Reduced motion.
- Bullet contrast.
- Save import/export.
- Tutorial hints.
- Better title/run summary.
- Original audio/VFX pass.

Exit criteria:

- New player can understand the game without reading source docs.
- Mute and reduced motion work.
- Settings persist.

### M6 — Release candidate

Scope:

- Browser smoke matrix.
- Optimize assets.
- Finalize README/license/credits.
- Changelog/version.
- Release checklist.
- Public Pages deployment.

Exit criteria:

- No severe known blockers.
- Production URL playable.
- Reproducible build.

## Phase 2 milestones

Status: Phase 2 milestones were completed across work orders 011-020 and are now historical context. Phase 3 work starts from their deployed result.

### P2.1 - Run Arc Foundation

Scope:

- Replace the one-kill sector clear with data-driven sector objectives.
- Add a wave director with sector progress, boss gates, and victory/loss flow.
- Keep route/reward/shop sequencing deterministic by seed.

Exit criteria:

- A run can progress through all five sectors.
- Same seed reproduces objectives, waves, boss timing, routes, rewards, and shops.

### P2.2 - Player Verb Pass

Scope:

- Implement special ability, bomb, graze, and charge/cooldown UI.
- Make ship stats affect hull, speed, hitbox, weapon cadence, and ability bias.
- Add deterministic tests around charge, bomb clear, and graze detection.

Exit criteria:

- At least three contracts feel mechanically distinct.
- Special/bomb/graze are usable from keyboard and documented.

### P2.3 - Enemy/Boss Escalation

Scope:

- Add boss phase behavior for all five bosses.
- Make factions more distinct in movement, bullet shape, and encounter role.
- Add final sector victory path and summary outcome.

Exit criteria:

- Five bosses can be fought and defeated.
- Telegraphs remain readable in normal and high-contrast modes.

Status: first-pass boss phase behavior and final victory summary are implemented; a fourth faction now adds distinct movement, projectiles, visuals, and a boss reference. Broader encounter-role depth still needs expansion.

### P2.4 - Content Expansion

Scope:

- Expand to at least 30 items and 4 factions.
- Support at least 6 build archetypes.
- Expand reward pools, route/event content, and content validation.

Exit criteria:

- Content validation covers all new tables and references.
- New content has deterministic tests where generation is involved.

Status: first pass implemented with 30 total items, 4 factions, 8 archetype targets, expanded reward pools, and validation for reward placement plus missing hook implementations.

### P2.5 - Meta and UX Depth

Scope:

- Gate future run options through unlocks.
- Add in-menu seed entry.
- Improve HUD, onboarding hints, run summary, and unlock explanation.

Exit criteria:

- New players can understand controls and run flow without reading source docs.
- Unlocks visibly add future variety.

Status: first-pass unlock gating now affects future contracts, item pools, faction/boss generation, challenge flags, practice flags, and music flags; seed entry, onboarding, and summary/HUD depth remain follow-ups.

### P2.6 - Playtest Candidate

Scope:

- Balance pass, performance/debug scenes, browser smoke matrix, docs, and checklist.

Exit criteria:

- Public deployment is suitable for open playtest.
- Known severe blockers are fixed or documented.

Status: completed by work order 020, then deployed and confirmed.

## Phase 3 milestones

### P3.1 - Scrolling Foundation

Scope:

- Add deterministic sector distance, scroll speed, camera offset, and sector-length state.
- Advance scroll through the fixed-step simulation so pause, slow motion, and frame stutter cannot desync progress.
- Keep gameplay collision readable while the background and encounter schedule move forward.

Exit criteria:

- A sector can end by reaching a seeded exit distance.
- Scroll state is covered by deterministic tests.
- Existing boss/debug shortcuts still work.

### P3.2 - Procedural Sector Space

Scope:

- Add original procedural background plans for distinct sectors.
- Render layered parallax, landmarks, and depth cues from deterministic data.
- Respect reduced motion and performance settings without changing simulation outcomes.

Exit criteria:

- At least three sectors are visually distinguishable by generated background plan.
- The same seed produces the same background landmarks and major visual beats.
- Moving backgrounds do not reduce bullet readability.

### P3.3 - Scroll-Synced Encounters

Scope:

- Move major wave scheduling from mostly time/objective triggers to distance markers.
- Support staggered waves, ambient flybys, hazard windows, and boss approach gates.
- Prevent duplicate or skipped distance events during frame drops.

Exit criteria:

- Known seeds reproduce wave distance markers and boss approach timing.
- Sector completion depends on surviving forward progress and resolving required gates.
- Tests cover stuttered fixed-step updates around event thresholds.

Status: directed wave distance markers, fixed-step combat spawn consumption, time fallback, and stutter duplicate tests are implemented by work order 023. Distance-based sector completion is covered by work order 024, and first-pass boss approach timing is covered by work orders 026-027.

### P3.4 - Scrolling Playtest Candidate

Scope:

- Integrate route conditions, unlocks, hazards, bosses, HUD, summaries, accessibility, and performance instrumentation with the scrolling sector spine.
- Update documentation and release checklist around vertical scrolling validation.
- Run long-scroll and production-preview smoke tests.

Exit criteria:

- A deployed build communicates velocity, sector scale, and forward progress.
- Distance objectives, boss locks, route modifiers, and summaries behave deterministically.
- No severe blockers remain for a Phase 3 playtest release.

Status: completed by work orders 024-030. Normal and boss sectors require exit distance plus required combat gates, HUD/transition/summary copy exposes distance, save records preserve distance reached, hazards/boss arenas/route-conditioned sector state are implemented, velocity presentation/readability polish is in place, long-scroll debug instrumentation exists, and release docs capture automated checks, preview smoke, and browser gaps.

## Phase 4 milestones

### P4.1 - Display And Input Foundation

Scope:

- Define viewport/canvas scaling and gameplay safe frame rules.
- Add optional mouse/pointer controls through the input abstraction.
- Preserve keyboard/remapped controls and pause/settings focus behavior.

Exit criteria:

- Common desktop, laptop, tablet-like, and narrow windows keep gameplay readable.
- Mouse-assisted control works without bypassing input state.
- Debug or test coverage exposes viewport and input-mode parity.

### P4.2 - Contract Ship Identity

Scope:

- Add data-driven ship appearance for contract silhouettes, palettes, engine/cockpit accents, weapon mount hints, and HUD theme keys.
- Render distinct player ships in gameplay without changing hitbox semantics.
- Validate appearance content references.

Exit criteria:

- Baseline contracts are visually distinguishable in motion.
- Appearance data is deterministic and test-covered.
- Reduced motion, performance mode, and high contrast remain readable.

Status: first pass implemented by work order 033 and extended by work order 037. Ship appearance now lives in content data, generated contracts expose it, gameplay rendering consumes it, validation catches missing or invalid appearance references, and combat cues use appearance colors for wake, readiness, invulnerability, damage, and heat feedback.

### P4.3 - Contract Selection Previews

Scope:

- Add ship previews to new-game contract cards.
- Show role/weapon cues from content data.
- Preserve keyboard and pointer selection across narrow layouts.

Exit criteria:

- Contract choice feels visual before launch.
- Preview state updates with focus/selection.
- No external or copied art is introduced.

Status: first pass implemented by work order 034. New Game contract cards now show compact original SVG previews, selected preview state updates from keyboard and pointer/button selection, and preview geometry is derived from contract appearance data.

### P4.4 - Graphical Contract HUD

Scope:

- Build a contract-themed gameplay HUD layer with readable graphical meters.
- Keep hull, economy, objective, warning, boss, weapon, special, bomb, and build state visible.
- Preserve screen-reader text and accessibility settings.

Exit criteria:

- HUD feels like a lightweight cockpit tied to the selected ship.
- Text/readout clarity remains intact on narrow and wide windows.
- High contrast and reduced motion simplify theme treatment.

Status: first pass implemented by work order 035. Gameplay now wraps critical readouts in a contract-themed cockpit HUD with semantic hull, special, bomb, and weapon heat meters derived from selected ship appearance.

### P4.5 - Phase 4 Playtest Candidate

Scope:

- Propagate contract theme subtly into route/reward/shop/summary screens.
- Add viewport/input debug and smoke coverage.
- Harden release docs and manual browser matrix.

Exit criteria:

- A deployed build communicates selected ship identity from contract selection through gameplay and summary.
- Keyboard and mouse-assisted play are documented and smoke-tested where browser tooling is available.
- No severe display/input/HUD blockers remain for the Phase 4 playtest release.

Status: completed by work orders 036-040. Keyboard-only start, pause, end-run, summary, and return-to-menu flow are covered by Playwright smoke, pointer guidance is cleared over DOM overlays so menus/settings remain neutral, ship cue intensity respects reduced motion, performance mode, and high-contrast settings, route/reward/shop/transition/summary screens carry subdued selected-contract accents plus summary theme metadata, and debug smoke asserts DPR/canvas/safe-frame metrics, input mode, HUD mode, contract previews, and selected contract theme. Full check, Playwright Chromium smoke, and local production preview smoke passed for the closeout; release docs capture remaining manual browser gaps and Phase 5 follow-up direction.

## Phase 5 milestones

### P5.1 - Progression Economy

Scope:

- Give banked scrap a clear purpose through persistent upgrade definitions and save-backed purchases.
- Keep upgrades focused on variety, information, or sidegrades rather than raw permanent damage.
- Preserve save migration, export, import, and fresh-save viability.

Exit criteria:

- Players can understand what scrap buys and what they can afford.
- Upgrade definitions validate and save safely.
- Same save state plus same seed reproduces upgrade-influenced generation.

### P5.2 - Upgrade Bay UX

Scope:

- Add an Upgrade Bay surface with category icons, cost states, purchased/locked states, and concise copy.
- Preserve keyboard, pointer, narrow viewport, high-contrast, and reduced-motion usability.

Exit criteria:

- Upgrade choices are readable before purchase.
- Icons communicate category at a glance.
- Upgrade menu smoke coverage exists.

### P5.3 - Sector Exit And Reward Feedback

Scope:

- Add sector completion exits/toasts.
- Improve run-end scrap breakdown and upgrade affordability feedback.
- Keep route/reward/summary flow deterministic and non-blocking.

Exit criteria:

- Sector completion feels like crossing an exit.
- Run summaries explain earned and banked scrap.
- Toasts are accessible and reduced-motion aware.

### P5.4 - Lunar Surface Sector

Scope:

- Add a deterministic lunar surface sector family with original low-altitude backgrounds.
- Add lunar landmarks, hazards, and encounter pacing hooks.
- Validate new sector references and keep bullet readability intact.

Exit criteria:

- Lunar sectors are visually and mechanically distinct.
- Known seeds can reproduce lunar backgrounds/features.
- Hazards telegraph clearly and stay under bullets.

### P5.5 - Destruction And Phase 5 Playtest Candidate

Scope:

- Add richer player ship destruction using ship appearance data.
- Extend debug/smoke coverage around upgrades, lunar sectors, exits, and destruction.
- Harden release docs and manual browser matrix.

Exit criteria:

- Death-to-summary remains reliable and more expressive.
- Full checks, E2E smoke, and production preview smoke pass.
- Known progression, sector, and browser risks are documented.

## Dependency map

```text
M0 scaffold
  -> M1 loop/input/scenes
    -> M2 combat
      -> M3 roguelike systems
        -> M4 content alpha
          -> M5 polish/accessibility
            -> M6 release
              -> P2.1 run arc
                -> P2.2 player verbs
                  -> P2.3 escalation
                    -> P2.4 content expansion
                      -> P2.5 meta/UX depth
                        -> P2.6 playtest candidate
                          -> P3.1 scrolling foundation
                            -> P3.2 procedural sector space
                              -> P3.3 scroll-synced encounters
                                -> P3.4 scrolling playtest candidate
                                  -> P4.1 display/input foundation
                                    -> P4.2 contract ship identity
                                      -> P4.3 contract previews
                                        -> P4.4 graphical HUD
                                          -> P4.5 display/input playtest candidate
                                            -> P5.1 progression economy
                                              -> P5.2 upgrade bay UX
                                                -> P5.3 sector/reward feedback
                                                  -> P5.4 lunar surface sector
                                                    -> P5.5 destruction/progression playtest candidate
```

Parallelizable:

- Content schema + engine loop after M0.
- UI shell + combat once scene interfaces are stable.
- CI/Pages immediately in M0.
- QA smoke tests alongside features.

High-conflict areas:

- `RunState` and run generation.
- Item hook ordering.
- World/entity model.
- Scene manager.
- Scroll state, camera offset, and sector-progress HUD.
- Wave/director scheduling around distance thresholds.
- Viewport/canvas scaling, HUD layout, and input-mode behavior.
- Ship appearance data shared by gameplay, previews, HUD, and summaries.
- Save data, banked scrap, upgrade definitions, and run generation.
- Sector content tables shared by backgrounds, features, waves, and validation.
- Death/destruction flow shared by combat, audio/VFX, and run summary.

## First five PRs

1. **PR 001 — Seed docs and scaffold**  
   Adds AGENTS/docs, Vite/TS, scripts, placeholder canvas, CI, Pages workflow.

2. **PR 002 — Loop, input, scenes**  
   Adds fixed timestep, renderer, input manager, main menu/gameplay/pause/summary scenes.

3. **PR 003 — Deterministic RNG and run skeleton**  
   Adds seed parser, forkable RNG, deterministic contracts and sector route skeleton.

4. **PR 004 — Combat prototype**  
   Adds player fire, enemies, projectiles, collision, death, pickups.

5. **PR 005 — Items and first synergies**  
   Adds item definitions, hook pipeline, reward selection, 12 starter items, validation tests.

## Definition of Done

Each task is done when:

- Code builds.
- Relevant tests pass.
- New deterministic behavior has tests.
- New content passes validation.
- The game loads without console errors.
- The implementation is documented when player-facing behavior changes.
- PR summary includes changed files, behavior, tests, and known risks.
