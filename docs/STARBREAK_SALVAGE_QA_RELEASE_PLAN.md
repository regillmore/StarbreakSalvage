# Starbreak Salvage — QA and Release Plan

## Test pyramid

### Pure unit tests

Use for:

- RNG;
- math helpers;
- collision primitives;
- damage formulas;
- weighted choices;
- item hook ordering;
- save migrations;
- unlock conditions.

### Integration tests

Use for:

- run generation;
- reward generation;
- shop inventory;
- content validation;
- item interactions;
- sector progression.

### E2E smoke tests

Use for:

- page load;
- main menu;
- seed entry;
- contract selection;
- gameplay start;
- pause;
- settings persistence;
- forced death to run summary.

## Phase 2 QA focus

Phase 2 introduces deeper run flow and more content. Add tests closest to the risk:

- sector objective completion and wave director sequencing;
- known-seed snapshots for objectives, waves, boss timing, route outcomes, rewards, and shops;
- route event effects for shop discounts, repair hull patches, vault curses/relics, glitch variance, elite rewards, and faction ambush combat pressure;
- special/bomb/graze charge math and input remapping;
- ship stat validation and weapon-family projectile behavior;
- boss phase thresholds, high-contrast boss telegraphs, final victory routing, and victory summary saves;
- unlock-gated generation for fresh saves and progressed saves;
- seed entry from the main menu and copy/share from summary;
- performance/debug scenarios for dense combat and boss patterns.

## Phase 3 QA focus

Phase 3 introduces true vertical scrolling. Add tests closest to the risk:

- fixed-step scroll state for distance traveled, sector length, scroll speed, camera offset, pause, and frame stutter;
- known-seed snapshots for sector length, background plan, landmark placement, hazard windows, distance objectives, wave markers, and boss approach timing;
- scroll-synced encounter thresholds so events cannot double-spawn or skip when a frame crosses multiple distance markers;
- route, unlock, challenge, and sector-condition effects on scroll speed, hazard density, landmark pools, salvage density, and boss approach length;
- boss arena transitions, scroll locks, scroll resumes, debug boss shortcuts, and final sector victory flow;
- HUD distance/objective indicators, route transitions, run summary distance stats, and save migration behavior where distance records are persisted;
- reduced motion, high-contrast, screen shake, and performance mode readability against moving procedural backgrounds;
- long-scroll performance scenarios that separate background cost from projectiles, enemies, pickups, effects, and HUD.

## Phase 4 QA focus

Phase 4 introduces display/input/identity polish. Add tests closest to the risk:

- viewport scaling helpers for canvas size, device pixel ratio, fixed combat arena fit, gameplay safe frame, and HUD safe areas;
- narrow/wide viewport E2E smoke for main menu, contract selection, gameplay HUD, pause, and summary; work order 031 adds narrow gameplay HUD/safe-frame smoke, with wider route/pause/summary viewport coverage still useful;
- mouse/pointer input mapping, bounds clamping, click/hold fire, and focus safety in menus/settings; work order 032 adds passive pointer guidance, primary-button fire, debug input-mode reporting, and pointer movement/fire smoke coverage;
- keyboard-only parity after mouse, contract-preview, and future HUD changes; work orders 034 and 036 add arrow-key preview selection plus keyboard-only start/pause/summary smoke coverage;
- ship appearance content validation for silhouettes, palettes, engine/cockpit accents, weapon mount hints, and HUD theme keys; work orders 033-035 add appearance, preview, and cockpit HUD coverage, with manual cross-theme QA still useful;
- contract selection preview state for keyboard focus, pointer selection, and narrow layouts; work order 034 adds pure preview-model coverage and Playwright preview-selection assertions, with manual contrast/narrow browser checks still useful;
- themed HUD readability for hull, economy, objective, warnings, boss, weapon, special, bomb, and build state; work order 035 adds semantic meter/readout coverage, with manual cross-theme checks still useful;
- non-combat contract theme propagation for route choice, route event, shop, reward, sector transition, run summary, and debug overlay; work order 038 adds pure theme-model coverage plus Playwright assertions through the route/shop/reward/transition/summary path;
- viewport/input/HUD debug smoke for DPR, canvas pixel size, safe-frame origin/size, active input mode, HUD mode, contract preview, and selected contract theme; work order 039 adds Playwright assertions for narrow viewport launch, pointer input, high-contrast HUD mode, and preview/HUD theme state;
- reduced motion, high contrast, and performance mode interactions with ship previews, ship wake/damage cues, and contract HUD themes; work order 036 simplifies preview/HUD treatment under those settings and work order 037 adds cue-state coverage for ship wake, damage, readiness, and heat stress.

## Known seed tests

- `STARBREAK-SMOKE` — stable forgiving smoke path.
- `LASER-TAX-404` — economy/laser route.
- `ORBITAL-JUNK-PROPHET` — relic/curse route.
- `VOID-CORSAIR-7` — shop/convoy route.
- `BLOOM-ENGINE-ALPHA` — bio-machine boss test.

Phase 2 should add these seed fixtures:

- `PHASE-COURIER-GRAZE` - special/graze validation.
- `BOMB-REFUND-STRESS` - bomb and projectile-clear validation.
- `CORE-WRECK-VICTORY` - final boss and victory summary validation.
- `FRESH-SAVE-LOCKED-POOL` - unlock gating validation for new saves.

Phase 3 should add these seed fixtures:

- `STARBREAK-SCROLL-SMOKE` - forgiving opening route with a short deterministic distance objective.
- `KILL-GRID-MILEMARKER` - dense scroll-synced wave thresholds and hazard timing.
- `BLOOM-PARALLAX-LONG` - long procedural background and landmark determinism.
- `CORE-ARENA-LOCK` - boss approach, scroll lock, boss defeat, scroll resume, and sector completion.

Phase 4 should add these seed fixtures:

- `VIEWPORT-PARITY-SMOKE` - stable opening contract and first sector for narrow/wide layout checks.
- `MOUSE-AIM-CALIBRATE` - forgiving ship and weapon setup for pointer movement/fire validation.
- `HANGAR-PREVIEW-GRID` - contract board with visually distinct baseline ships.
- `COCKPIT-HUD-TEST` - contract theme and HUD state coverage with special/bomb/overheat cues.

## Content validation checklist

Phase 2 should extend this checklist as systems become real. In addition to the existing entries, content validation should cover ship stat ranges, objective references, wave references, implemented hook coverage, and unlock-gated pools for fresh and progressed saves. Phase 3 should extend it again for sector length ranges, scroll-speed modifiers, background-plan references, landmark references, hazard references, and distance marker ordering. Phase 4 should extend it again for ship appearance references, HUD theme keys, preview assets/primitives, and input/display settings defaults.

- [ ] No duplicate IDs.
- [ ] Every item tag is registered.
- [ ] Every hook name is registered.
- [ ] Every ship references valid weapon/item IDs.
- [ ] Every wave references valid enemy IDs.
- [ ] Every sector references valid factions/bosses.
- [ ] Every unlock references valid reward/content IDs.
- [ ] Every reward pool has at least one eligible item.
- [ ] Rarity values are valid.
- [ ] Curses are clearly marked.
- [x] Ship appearance references, palettes, weapon mount hints, and HUD theme keys validate.

## Manual browser smoke matrix

| Browser       | Load | Start run | Combat | Pause | Settings | Summary | Narrow viewport | Mouse | Notes |
| ------------- | ---- | --------- | ------ | ----- | -------- | ------- | --------------- | ----- | ----- |
| Chrome/Edge   |      |           |        |       |          |         |                 |       |       |
| Firefox       |      |           |        |       |          |         |                 |       |       |
| Safari/WebKit |      |           |        |       |          |         |                 |       |       |

## Performance checklist

Phase 2 performance checks should include wave/objective count, projectile count, particle count, audio cue load, and dense boss-pattern scenarios.

Phase 3 performance checks should also include background primitive count, parallax layer count, distance traveled, scroll speed, active distance markers, active landmarks, active hazards, and long-scroll scenarios that run longer than a normal sector.

Current first-pass instrumentation exposes granular combat counts, background primitive/layer counts, active landmark/hazard counts, distance, speed, active input mode, HUD mode, viewport size/class/presentation scale, DPR, canvas pixel size, safe-frame origin/size, fixed combat world size, a dense-combat debug pocket, and a quiet late-sector long-scroll traversal behind `?debug=1`. Manual browser validation and production preview smoke still need to close the checklist.

Phase 4 performance checks should include viewport/presentation scale, safe-frame size, fixed-world hazard/enemy spacing parity, HUD rendering density, preview rendering cost, mouse input update behavior, ship cue rendering cost, non-combat theme DOM cost, and whether themed HUD/ship cues add measurable overhead in dense and long-scroll debug scenarios.

- [ ] FPS overlay available behind debug flag.
- [ ] Projectile count visible in debug mode.
- [ ] Particle count visible in debug mode.
- [ ] Background/debug counters visible in debug mode.
- [ ] Distance and scroll speed visible in debug mode.
- [x] Viewport/canvas scale visible in debug mode once Phase 4 instrumentation lands.
- [x] Active input mode visible in debug mode once mouse controls land.
- [x] HUD mode and contract theme visible in debug mode for Phase 4 smoke.
- [x] Contract preview model and selection smoke coverage exists.
- [x] Contract theme propagation smoke coverage exists for route/shop/reward/transition/summary screens.
- [ ] Normal combat stays near 60 FPS on dev machine.
- [ ] Heavy combat debug scene documented.
- [ ] Long-scroll debug scene documented.
- [ ] Screen shake and particles respect reduced motion/performance settings.

## Accessibility checklist

Phase 2 accessibility checks should cover seed entry, summary sharing, special/bomb/graze HUD readability, reduced motion, mute, and keyboard-only route/reward/shop flows.

Phase 3 accessibility checks should also cover moving-background readability, high-contrast bullets over each sector palette, reduced-motion parallax simplification, distance HUD readability, boss scroll-lock clarity, and keyboard-only continuation after reaching sector exits.

Phase 4 accessibility checks should also cover narrow viewport HUD readability, mouse controls as passive optional input, keyboard-only parity after previews/HUD changes, high-contrast bullets over contract ship/HUD themes, reduced-motion simplification for ship wake/damage cues, and focus safety across pointer interactions.

- [x] Keyboard-only menu navigation.
- [ ] Remappable controls.
- [x] Pause always available during gameplay.
- [ ] Mute option.
- [ ] Volume sliders.
- [x] Reduced motion.
- [ ] Screen shake strength.
- [x] Bullet contrast option.
- [ ] Flash reduction.
- [ ] No essential information conveyed by color alone.
- [ ] Distance/objective text remains readable over moving backgrounds.
- [x] Reduced motion simplifies scrolling effects without hiding gameplay state.
- [x] Themed HUD and ship previews preserve text contrast in automated smoke coverage.
- [x] Mouse controls do not trap or steal menu focus.

## Release checklist

- [x] `npm run check` passes.
- [x] E2E smoke tests pass.
- [ ] Production build preview tested.
- [ ] GitHub Pages deployed.
- [ ] Public URL loads assets correctly.
- [ ] README updated.
- [ ] License present.
- [ ] Credits mention original/generated placeholders as appropriate.
- [ ] Changelog updated.
- [ ] Save migration tested.
- [ ] Seed sharing works.
- [ ] Known severe bugs documented or fixed.

## Release notes template

```md
# Starbreak Salvage vX.Y.Z

## Highlights

-

## New content

-

## Gameplay changes

-

## Fixes

-

## Known issues

-

## Testing

- `npm run check`: pass/fail
- E2E smoke: pass/fail
- Browser smoke: Chrome / Firefox / Safari
```
