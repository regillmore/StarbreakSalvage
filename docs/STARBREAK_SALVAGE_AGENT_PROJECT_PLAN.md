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

Phase 5 is complete as of validated work order 050. It added progression and sector-feedback depth: banked scrap purpose, upgrade bay icons and purchases, upgrade-influenced future runs, run-end scrap feedback, sector completion exits/toasts, a lunar surface sector family with hazards and pacing, richer player ship destruction, and release/debug smoke coverage.

Phase 6 is complete as of validated work order 060. It added item-catalog depth: item taxonomy, expanded metadata and validation, broader hook surfaces, a 60-item catalog, reward/shop/vault pool weighting, unlock-gated item families, discovery records, synergy identity, item-card presentation, item-heavy smoke coverage, and release documentation.

Phase 7 is complete as of validated work order 070. It added enemy behavior depth: stronger enemy class/role differentiation, upgraded enemy variants, enemy formations, longer sectors, richer pacing arcs, enemy-rich debug smoke, release docs, and a boss-release hazard fairness fix.

Phase 8 is complete as of validated work order 080. It added environmental pressure depth: richer hazard-zone schema/behavior/director work, destructible and obstacle content/runtime interactions, fixed-world obstacle lane safety, deterministic loose-currency lanes, environmental stress smoke, scroll-world object/loot presentation, and release-hardening docs.

Phase 9 begins from that environmental systems playtest candidate. Its goal is to expand the loop into a deterministic second act: an explicit act model, inter-act junction, Act II route/sector pool, Act II pacing/objective variants, act-aware combat/environment pressure, economy tuning, second-act bosses/finale, debug smoke, and release hardening.

See `docs/STARBREAK_SALVAGE_PHASE_9_PLAN.md` for the active Phase 9 roadmap. `docs/STARBREAK_SALVAGE_PHASE_8_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_7_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_6_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_5_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_4_PLAN.md`, `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`, and `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md` remain historical records for concluded phases.

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

Status: implemented through work order 044. Banked scrap can buy persistent upgrade ids through save helpers, upgrade definitions validate, legacy saves migrate to version 3, export/import preserves upgrade state, the visual Upgrade Bay exists, purchased upgrades influence deterministic contract boards, route intel, shop affordances, vault rewards, seed survey text, summary rows, and debug metadata, and run summaries/archive status now explain earned scrap plus upgrade affordability.

### P5.2 - Upgrade Bay UX

Scope:

- Add an Upgrade Bay surface with category icons, cost states, purchased/locked states, and concise copy.
- Preserve keyboard, pointer, narrow viewport, high-contrast, and reduced-motion usability.

Exit criteria:

- Upgrade choices are readable before purchase.
- Icons communicate category at a glance.
- Upgrade menu smoke coverage exists.

Status: implemented by work order 042. Upgrade Bay cards now show original inline SVG icons, costs, prerequisites, installed/available/locked/unaffordable states, and save-backed purchase feedback from both the main menu and Unlock Archive. Unit and Playwright smoke coverage exercise the view model, narrow layout, high contrast, and purchase persistence.

### P5.3 - Sector Exit And Reward Feedback

Scope:

- Add sector completion exits/toasts.
- Improve run-end scrap breakdown and upgrade affordability feedback.
- Keep route/reward/summary flow deterministic and non-blocking.

Exit criteria:

- Sector completion feels like crossing an exit.
- Run summaries explain earned and banked scrap.
- Toasts are accessible and reduced-motion aware.

Status: implemented through work order 045. Run summaries now show earned/banked scrap flow and upgrade affordability/next-target callouts without blocking seed sharing or route/item/unlock detail; Unlock Archive status also surfaces ready upgrades. Sector completion now enters a short explicit exit sequence with reduced enemy pressure, a DOM toast, canvas beacon/corridor visuals, debug progress, reduced-motion simplification, and reliable route/victory handoff.

### P5.4 - Lunar Surface Sector

Scope:

- Add a deterministic lunar surface sector family with original low-altitude backgrounds.
- Add lunar landmarks, hazards, and encounter pacing hooks.
- Validate new sector references and keep bullet readability intact.

Exit criteria:

- Lunar sectors are visually and mechanically distinct.
- Known seeds can reproduce lunar backgrounds/features.
- Hazards telegraph clearly and stay under bullets.

Status: implemented through work orders 046 and 047. Lunar Surface now appears in deterministic generation for `LUNAR-SURFACE-LANE`, uses original crater/ridge/tower/wreck-shadow background primitives with muted terrain alpha, and has lunar-specific crater-shadow, comm-array, surface-relay, dust-plume, mining-laser, and surface-defense feature content. Optional sector pacing data now feeds the wave director for low-altitude spacing, and generation/background/feature/hazard/readability/route-condition/pacing tests cover the first pass.

### P5.5 - Destruction And Phase 5 Playtest Candidate

Scope:

- Add richer player ship destruction using ship appearance data.
- Extend debug/smoke coverage around upgrades, lunar sectors, exits, and destruction.
- Harden release docs and manual browser matrix.

Exit criteria:

- Death-to-summary remains reliable and more expressive.
- Full checks, E2E smoke, and production preview smoke pass.
- Known progression, sector, and browser risks are documented.

Status: completed by work order 050. Rich player destruction is implemented as a bounded gameplay state with deterministic contract-colored debris, cockpit/transponder cues, settings-aware variants, debug overlay progress, and forced-destruction Playwright coverage. Phase 5 debug overlay coverage also exposes banked scrap, upgrade readiness, run resources, sector plans, exit progress, destruction progress, and Lunar Surface browser smoke through `LUNAR-SURFACE-LANE`. Full check, Playwright Chromium smoke, and local production preview asset-path smoke passed for the closeout; release docs capture remaining manual browser gaps and Phase 6 item-catalog direction.

## Phase 6 milestones

### P6.1 - Item Taxonomy And Validation

Scope:

- Audit the current 30-item catalog by tag, hook, rarity, reward pool, archetype, and implementation status.
- Add item metadata for family, source, unlock tier, stackability/uniqueness, and live/planned effect state.
- Expand content validation so a larger catalog can fail fast on broken references or weak metadata.

Exit criteria:

- Item catalog intent is documented before large content additions.
- Item definitions can support source/family/unlock status.
- Validation protects tags, hooks, pools, implementation status, and reward sources.

Status: implemented through work orders 051 and 052. The catalog audit documents the current 30-item baseline by rarity, tag, hook, pool, archetype, unlock gate, bridge-effect status, target family, and repeated-reward risk, with helper/tests preserving those counts. Item definitions now include compact family, source, unlock-tier, implementation-status, stacking, and UI-tag metadata, and content validation protects metadata, reward-pool source alignment, unlock-gate references, bridge/planned notes, and unsupported starter rarity/source combinations before larger item batches begin.

### P6.2 - Hook And Effect Expansion

Scope:

- Add deterministic hook points for graze, special, bomb, sector start, route selection, shop entry, reward generation, and boss phase events where practical.
- Keep hook order bounded, explicit, and test-covered.
- Convert lightweight placeholder effects into live effects or explicitly tracked planned effects.

Exit criteria:

- New hook surfaces can support more varied effects without ad hoc system coupling.
- Proc order and proc limits are tested.
- Existing item behavior and seeded generation remain stable.

Status: implemented by work order 053. New hook names are registered and validated for graze, special, bomb, sector start, route selection, shop entry, reward generation, and boss phase changes. The dispatcher now has typed payloads plus a bounded report path, and combat/route/shop/reward systems call the hooks at deterministic event boundaries without changing the current catalog behavior.

### P6.3 - Catalog Growth And Pool Curation

Scope:

- Grow the catalog toward at least 60 total items in the first Phase 6 batch.
- Curate starter, combat, shop, vault, boss, faction, lunar, and unlock-gated pools.
- Add rarity/source weighting that remains deterministic from seed plus save state.

Exit criteria:

- Reward and shop choices repeat less often.
- Fresh saves stay understandable and complete.
- Known-seed snapshots cover item pool outputs.

Status: implemented through work orders 054 and 055. The item catalog now has 60 original definitions with validated family/source/unlock/status/stacking/UI metadata and live hook behavior for every declared new hook. Starter rewards now expose 27 readable entries while avoiding prototype/cursed items, combat rewards expose 51 entries, and vault rewards expose 20 entries. Reward generation now applies validated source/rarity/family/tag weight profiles for starter, combat, shop, vault, elite, boss, faction, lunar, and route contexts while preserving seeded shop/reward/vault reproducibility from seed plus save/unlock state.

### P6.4 - Unlocks, Discovery, And Synergy Identity

Scope:

- Let permanent progression reveal item families and discovery records without raw power creep.
- Detect build clusters from tags, families, and acquisition order.
- Surface compact build identity in HUD, reward/shop context, archive, and summary where useful.

Exit criteria:

- Unlocks widen item variety deterministically.
- At least ten synergy clusters are represented.
- Item discovery and build identity are readable without overwhelming narrow layouts.

### P6.5 - Phase 6 Item Playtest Candidate

Scope:

- Improve item card, reward, shop, vault, archive, and summary presentation for a larger catalog.
- Add item-heavy debug/smoke coverage and performance notes.
- Harden release docs and manual browser matrix.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover item count, hook coverage, pool/gating behavior, discovery UI, item-heavy smoke, and balance risks.
- No severe item-system blockers remain for the next playtest.

Status: complete through work order 060. The 60-item catalog, expanded hook surface, source-weighted pools, unlock/discovery state, item presentation, stress smoke, and release docs are in place. Remaining item work is balance and future catalog breadth.

## Phase 7 milestones

### P7.1 - Enemy Role Taxonomy And Audit

Scope:

- Audit current enemy classes, factions, waves, movement, attack cadence, objective interactions, and readability.
- Define target enemy roles and pressure types before implementation.
- Add validation direction for enemy role metadata.

Exit criteria:

- Current gaps and target roles are documented.
- Role metadata and validation needs are clear.
- Existing deterministic behavior remains unchanged.

Status: implemented by work orders 061 and 062. The enemy role audit documents the current four faction-pattern classes, semantic wave labels, shared spawn/durability model, objective accounting paths, target Phase 7 roles, and soft-lock/readability/performance risks, with a pure helper and unit tests preserving the baseline. Current faction-pattern classes now carry validated role metadata plus active role-pressure debug summaries without changing wave generation or combat behavior.

### P7.2 - Role-Specific Behavior Expansion

Scope:

- Give priority roles distinct movement, attack cadence, projectile, and telegraph behavior.
- Keep behavior fixed-step, deterministic, and readable under accessibility settings.
- Expose active role pressure in debug/test helpers.

Exit criteria:

- At least four roles feel mechanically distinct.
- Role behavior cannot strand enemies or desync objectives.
- Tests cover deterministic timing, bounds, and cleanup.

### P7.3 - Variants And Formations

Scope:

- Add deterministic upgraded variants with clear cues and early-sector safeguards.
- Add formation definitions and squad spawning through the wave director.
- Preserve objective accounting for simultaneous, secondary, body-collision, and despawn clears.

Exit criteria:

- Variants and formations reproduce from seed plus save state.
- Formation wave clears cannot soft-lock sector completion.
- Debug/smoke can inspect variant and formation pressure.

### P7.4 - Longer Enemy-Rich Sector Arcs

Scope:

- Extend selected sector length bands with pressure windows, relief intervals, formation clusters, landmarks, hazards, and boss approach pacing.
- Avoid constant maximum density.
- Update summaries/debug state for longer-sector context.

Exit criteria:

- Longer sectors feel paced rather than padded.
- Route-conditioned length and encounter density remain deterministic.
- Performance/readability budgets hold in browser smoke.

### P7.5 - Phase 7 Enemy Playtest Candidate

Scope:

- Harden enemy role, variant, formation, and longer-sector behavior for deployment.
- Update release, QA, performance, README, changelog, backlog, and architecture docs.
- Run full checks, Playwright smoke, and production preview smoke.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover role coverage, variant rules, formation smoke, longer-sector tuning, and known risks.
- No severe enemy-system blockers remain for the next playtest.

Status: complete through work order 070. Phase 7 release docs, checks, browser smoke, production preview evidence, and the boss-release hazard fairness fix are in place.

## Phase 8 milestones

Status: Phase 8 milestones were completed across work orders 071-080 and are now historical context. Phase 9 work starts from their deployed environmental systems playtest result.

### P8.1 - Hazard Zone Foundation

Scope:

- Add richer hazard-zone schema, validation, and behavior metadata for existing hazard families.
- Keep telegraphs readable, damage windows fair, and boss-release suppression explicit.

Exit criteria:

- Hazard zones are data-driven and validated.
- Richer behavior remains deterministic and settings-aware.

Status: complete through work orders 072-074.

### P8.2 - Destructibles And Obstacles

Scope:

- Add content definitions, placement helpers, runtime damage/reward behavior, chain caps, and lane safety for destructibles and obstacles.
- Keep collision and placement in fixed 640x720 combat-world units.

Exit criteria:

- Objects add navigation and reward pressure without unavoidable lanes or objective desyncs.
- Debug summaries expose active environment/destructible/obstacle counts.

Status: complete through work orders 075-077.

### P8.3 - Loose Currency And Environmental Smoke

Scope:

- Add deterministic loose scrap/credit lanes and pickup behavior.
- Add environmental stress smoke for hazards, objects, and loose currency.

Exit criteria:

- Loose currency is capped, scroll-aware, and reflected in summaries/progression.
- Browser smoke can inspect environmental stress without private app state.

Status: complete through work orders 078-079.

### P8.4 - Phase 8 Environmental Playtest Candidate

Scope:

- Harden scroll-world object/loot behavior, docs, checks, browser smoke, and preview evidence.

Exit criteria:

- Phase 8 can ship as an environmental systems playtest candidate with documented risks.

Status: complete through work order 080.

## Phase 9 milestones

### P9.1 - Second-Act Planning And Contracts

Scope:

- Refresh Phase 9 planning docs, backlog epics, QA seeds, architecture notes, performance risks, release checklist, README links, changelog notes, and work orders 081-090.

Exit criteria:

- The two-act roadmap is clear before code changes begin.
- Determinism, fixed-world viewport parity, scroll-world environmental behavior, boss-release hazard fairness, accessibility, and GitHub Pages constraints remain explicit.

Status: implemented by work order 081.

### P9.2 - Act Model And Inter-Act Junction

Scope:

- Add typed act definitions and run progression state.
- Add a deterministic midpoint junction after Act I completion.

Exit criteria:

- Same seed plus save state reproduces Act I/Act II structure and junction choices.
- Older one-act save and summary records remain readable.

Status: act model, ten-sector target route, and inter-act junction behavior implemented by work orders 082-083; distinct Act II route/content expansion remains planned for work orders 084-085.

### P9.3 - Act II Route, Pacing, And Objectives

Scope:

- Add Act II route/sector contracts, route-card copy, pressure/reward hints, objective variants, relief windows, and boss approach tuning.

Exit criteria:

- Act II feels distinct through route identity and pacing rather than raw density alone.
- Validation catches broken Act II content references.

Status: planned for work orders 084-085.

### P9.4 - Act II Pressure, Economy, And Finale

Scope:

- Add act-aware enemy/environment/item pressure budgets, reward/shop/economy profiles, and second-act boss/finale structure.

Exit criteria:

- Act II pressure and rewards are deterministic, debug-visible, and bounded.
- Victory, defeat, abandonment, unlock, and summary flows distinguish Act I from Act II.

Status: planned for work orders 086-088.

### P9.5 - Phase 9 Second-Act Playtest Candidate

Scope:

- Add Act II debug smoke, accessibility/performance hardening, production preview evidence, and release docs.

Exit criteria:

- `npm run check`, Playwright smoke where available, and production preview smoke pass.
- Known run-length, balance, economy, browser, and readability risks are documented.

Status: planned for work orders 089-090.

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
                                                      -> P6.1 item taxonomy and validation
                                                        -> P6.2 hook and effect expansion
                                                          -> P6.3 catalog growth and pool curation
                                                            -> P6.4 unlocks, discovery, and synergy identity
                                                              -> P6.5 item playtest candidate
                                                                -> P7.1 enemy role taxonomy and audit
                                                                  -> P7.2 role-specific behavior expansion
                                                                    -> P7.3 variants and formations
                                                                      -> P7.4 longer enemy-rich sector arcs
                                                                        -> P7.5 enemy playtest candidate
                                                                          -> P8.1 hazard zone foundation
                                                                            -> P8.2 destructibles and obstacles
                                                                              -> P8.3 loose currency and environmental smoke
                                                                                -> P8.4 environmental playtest candidate
                                                                                  -> P9.1 second-act planning and contracts
                                                                                    -> P9.2 act model and inter-act junction
                                                                                      -> P9.3 Act II route, pacing, and objectives
                                                                                        -> P9.4 Act II pressure, economy, and finale
                                                                                          -> P9.5 second-act playtest candidate
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
- Item definitions, hook handlers, reward pools, shop/vault generation, unlock gates, and summary/archive item presentation.
- Act definitions, inter-act junction state, Act II route/economy profiles, second-act boss/finale gates, and two-act summary/save records.

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
