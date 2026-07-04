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

## Content validation checklist

Phase 2 should extend this checklist as systems become real. In addition to the existing entries, content validation should cover ship stat ranges, objective references, wave references, implemented hook coverage, and unlock-gated pools for fresh and progressed saves. Phase 3 should extend it again for sector length ranges, scroll-speed modifiers, background-plan references, landmark references, hazard references, and distance marker ordering.

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

## Manual browser smoke matrix

| Browser       | Load | Start run | Combat | Pause | Settings | Summary | Notes |
| ------------- | ---- | --------- | ------ | ----- | -------- | ------- | ----- |
| Chrome/Edge   |      |           |        |       |          |         |       |
| Firefox       |      |           |        |       |          |         |       |
| Safari/WebKit |      |           |        |       |          |         |       |

## Performance checklist

Phase 2 performance checks should include wave/objective count, projectile count, particle count, audio cue load, and dense boss-pattern scenarios.

Phase 3 performance checks should also include background primitive count, parallax layer count, distance traveled, scroll speed, active distance markers, active landmarks, active hazards, and long-scroll scenarios that run longer than a normal sector.

Current first-pass instrumentation exposes granular combat counts, background primitive/layer counts, active landmark/hazard counts, distance, speed, a dense-combat debug pocket, and a quiet late-sector long-scroll traversal behind `?debug=1`. Manual browser validation and production preview smoke still need to close the checklist.

- [ ] FPS overlay available behind debug flag.
- [ ] Projectile count visible in debug mode.
- [ ] Particle count visible in debug mode.
- [ ] Background/debug counters visible in debug mode.
- [ ] Distance and scroll speed visible in debug mode.
- [ ] Normal combat stays near 60 FPS on dev machine.
- [ ] Heavy combat debug scene documented.
- [ ] Long-scroll debug scene documented.
- [ ] Screen shake and particles respect reduced motion/performance settings.

## Accessibility checklist

Phase 2 accessibility checks should cover seed entry, summary sharing, special/bomb/graze HUD readability, reduced motion, mute, and keyboard-only route/reward/shop flows.

Phase 3 accessibility checks should also cover moving-background readability, high-contrast bullets over each sector palette, reduced-motion parallax simplification, distance HUD readability, boss scroll-lock clarity, and keyboard-only continuation after reaching sector exits.

- [ ] Keyboard-only menu navigation.
- [ ] Remappable controls.
- [ ] Pause always available during gameplay.
- [ ] Mute option.
- [ ] Volume sliders.
- [ ] Reduced motion.
- [ ] Screen shake strength.
- [ ] Bullet contrast option.
- [ ] Flash reduction.
- [ ] No essential information conveyed by color alone.
- [ ] Distance/objective text remains readable over moving backgrounds.
- [ ] Reduced motion simplifies scrolling effects without hiding gameplay state.

## Release checklist

- [ ] `npm run check` passes.
- [ ] E2E smoke tests pass.
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
