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

## Phase 5 QA focus

Phase 5 introduces persistent upgrade spending, sector completion feedback, lunar surface content, and richer ship destruction. Add tests closest to the risk:

- banked scrap upgrade catalog validation, costs, prerequisites, affordability, purchase state, save migration, export/import, and corrupted-data repair;
- same save state plus same seed snapshots for upgrade-influenced contract boards, route previews, shops, rewards, and summary metadata;
- Upgrade Bay view models, icon/category state, keyboard focus order, pointer purchase flow, narrow layout, and high-contrast readability;
- sector exit sequence state, completion toast timing, route/reward transition reliability, debug sector-complete shortcut behavior, and reduced-motion fallback;
- lunar sector generation snapshots for background plans, feature plans, hazard windows, route-conditioned modifiers, and content references;
- player destruction cue state, death-to-summary reliability, ship-theme color usage, reduced motion, performance mode, high contrast, screen shake, and mute interactions;
- Playwright smoke for opening Upgrade Bay, checking an upgrade state, launching a lunar sector path or verifying generated lunar content, forcing sector completion, and forcing player destruction where practical.

Current Phase 5 coverage:

- Work order 041 covers upgrade catalog validation, save migration, import/export, affordability, purchase helpers, and corrupted upgrade data repair.
- Work order 042 adds Upgrade Bay view-model tests plus a Playwright smoke fixture that opens the bay in a narrow high-contrast viewport, verifies icon/state copy, purchases an upgrade with banked scrap, and confirms persisted save/menu state.
- Work order 043 adds same-save/same-seed upgrade generation snapshots for contract boards, route intel, market decoder shop output, relic dossier vault rewards, seed survey text, fresh-save viability, summary/debug exposure, and browser smoke that a purchased upgrade appears on the next contract board.
- Work order 044 adds run-summary progress tests for earned/banked scrap formatting, newly affordable/available/next/completed upgrade callouts, archive upgrade status, save summary records, and Playwright summary assertions.
- Work order 045 adds sector-exit sequence tests for normal/debug/reduced-motion/final-sector timing and Playwright smoke assertions for forced exit toast, debug exit progress, and route flow after the beat.
- Work order 046 adds deterministic `LUNAR-SURFACE-LANE` generation coverage, Lunar Surface background-strata checks, first-pass feature-plan validation, and content breadth/reference validation.
- Work order 047 adds lunar-specific feature determinism, hazard phase/readability/collision metadata tests, route-conditioned lunar feature regression coverage, sector pacing validation, and wave-director pacing checks.
- Work order 048 adds player-destruction cue-state tests for deterministic debris, reduced-motion/performance/high-contrast variants, feedback/audio mappings, debug force-destruction input, and Playwright smoke coverage from destruction toast/debug progress through the destroyed summary.
- Work order 049 adds debug overlay coverage for banked scrap, upgrade readiness, run resources, current sector id/name/background/pacing, exit progress, and destruction progress. Playwright smoke now verifies Upgrade Bay readiness after purchase, forced sector exit flow, forced destruction, and a `LUNAR-SURFACE-LANE` route that reaches Lunar Surface in-browser.
- Work order 050 closes Phase 5 with `npm run check`, 7-test Playwright Chromium smoke, production preview asset-path smoke, and release docs that separate automated coverage from manual non-Chromium/real-device browser gaps.

## Phase 6 QA focus

Phase 6 expands the item catalog and hook surface. Add tests closest to the risk:

- item catalog audit coverage for current rarity, tag, hook, reward-pool, archetype, unlock, and bridge-effect baselines; work order 051 adds the first helper and unit coverage;
- item metadata validation for family, source hints, unlock tier, implementation status, uniqueness/stackability, effect text, rarity, and reward-pool placement; work order 052 adds source/pool drift, unlock-gate drift, bridge/planned note, duplicate metadata, and unsupported starter rarity/source fixtures;
- hook registration, dispatch ordering, proc limits, and multi-item interaction tests for new hook points such as graze, special, bomb, sector start, route choice, shop entry, reward generation, and boss phase events; work order 053 registers/wires the first expanded hook surface and adds bounded-dispatch coverage;
- first expansion pack coverage for the 60-item catalog, starter/combat/vault pool breadth, newly live hook surfaces, and deterministic shop/vault snapshots; work order 054 adds item hook tests and refreshes the catalog audit expectations;
- source-weighted item pool profile validation and known-seed shop, elite reward, vault reward, and lunar reward snapshots; work order 055 adds the first deterministic acquisition weighting coverage;
- known-seed snapshots for reward, shop, vault, boss, faction, lunar, and unlock-gated item pools under fresh and progressed saves;
- item unlock and discovery migration/import/export/corruption repair if save shape changes;
- synergy cluster detection, tie-breaking, HUD/summary copy, and narrow-layout build identity presentation; work order 057 adds unit coverage and E2E smoke assertions for HUD plus reward/shop build-fit lines;
- item card view models for reward, shop, vault, archive, and summary surfaces, including high-contrast and keyboard focus state; work order 058 adds shared model coverage and E2E checks for shop, reward, summary, and archive item cards;
- item-heavy stress helpers for forced hook-heavy combat, fresh/unlocked reward-shop-vault pool previews, active hook pressure, proc cap reporting, and build identity; work order 059 adds pure coverage plus a `HOOK-STORM-SMOKE` Playwright debug path;
- browser smoke for at least one item-heavy reward/shop/vault path and one dense synergy combat/debug path.

Work order 060 closes Phase 6 as an item-catalog playtest candidate. Release evidence should keep covering the 60-item catalog, 13 registered hook surfaces, source-weighted reward/shop/vault pools, unlock/discovery behavior, item-card presentation, item-storm smoke, and known balance/readability/manual-browser gaps.

## Phase 7 QA focus

Phase 7 enriches enemy behavior and longer-sector pacing. Add tests closest to the risk:

- enemy role audit and metadata validation for role, pressure type, movement family, attack family, variant eligibility, formation eligibility, readability tier, and faction fit; work order 061 adds the first pure audit helper and documents the four current faction-pattern classes, while work order 062 adds validated role metadata and active role-pressure summaries;
- role-specific movement tests for fixed-step determinism, arena bounds, cleanup, frame-catchup stability, and no offscreen soft locks; work order 063 adds deterministic movement-profile coverage for current and future movement families;
- attack cadence and telegraph tests for deterministic timing, projectile budgets, high-contrast readability, and reduced-motion simplification; work order 064 adds pure attack-profile budget coverage plus combat-loop cadence regression coverage;
- upgraded variant selection snapshots for fresh saves, later sectors, faction routes, elite routes, challenge flags, and boss-adjacent pressure; work order 065 adds known-seed variant schedules, validation, spawn-modifier, bonus-salvage, and debug-summary coverage;
- formation definition validation for member roles, offsets, timing, entry style, spacing, break conditions, and fixed-world bounds; work order 066 adds validation fixtures plus known-seed formation schedule/bounds coverage;
- formation wave tests for frame-catchup spawn order, simultaneous kills, secondary item kills, despawns, body collisions, objective progress, and sector-complete handoff; work order 066 covers frame-catchup spawn order and duplicate prevention, while work order 067 covers route/faction formation bias, formation instance grouping, one-time clear rewards, simultaneous-kill clears, secondary item clears, despawn clears, body-collision clears, and distance-sector handoff regressions;
- longer-sector generation snapshots for route-conditioned length bands, pressure/relief windows, formation clusters, hazard/landmark pacing, and boss approach timing; work order 068 adds `SectorPacing` unit coverage for route-conditioned arcs, explicit wave ratios, formation-cluster waves, feature beats, boss handoffs, run-summary timelines, and encounter-pacing validation;
- browser smoke for at least one enemy-rich formation or upgraded-variant path under debug, high contrast, reduced motion, performance mode, and narrow viewport where practical; work order 069 adds a Playwright path that reaches Lunar Surface, triggers the `E` enemy-rich debug pocket, and verifies role, variant, formation, pacing, projectile, and telegraph budget readouts;
- boss arena release regressions where a distance-tied hazard telegraph was hidden during the locked fight; work order 070 adds unit coverage proving such hazards restart their warning lead after boss defeat before they can damage the player;
- regression coverage that keeps `HOOK-STORM-SMOKE`, dense combat, forced exit, forced destruction, and quiet long-scroll paths green while enemy behavior grows.

## Phase 8 QA focus

Phase 8 enriches environmental pressure and loose salvage flow. Add tests closest to the risk:

- hazard-zone metadata validation for family, sector/faction fit, telegraph timing, active damage shape, damage cooldown, safe-lane expectation, accessibility metadata, and boss-arena suppression behavior;
- richer hazard behavior tests for phase timing, warning lead, active collision windows, damage cooldowns, frame-catchup order, cleanup, reduced-motion/high-contrast/performance render state, and post-boss release deferral;
- hazard director snapshots for route pressure, relief-window spacing, lunar/background context, formation-cluster interaction, boss approach/release state, and known-seed schedule reproducibility;
- destructible and obstacle schema validation for collision shape, hull, damage interactions, objective policy, reward policy, chain behavior, placement constraints, rendering cues, audio/VFX cue names, and debug labels;
- destructible runtime tests for weapon/special/bomb/hazard damage, deterministic rewards, bounded chain reactions, item-hook dispatch, cleanup, and objective safety;
- obstacle placement tests for safe lanes, player spawn and exit corridors, boss approach locks, hazard overlays, enemy spawn lanes, frame-catchup cleanup, fixed-world placement, and viewport parity;
- loose currency tests for scatter determinism, pickup magnet behavior, collection radius, lifetime, cap enforcement, value accounting, upgrade progress, and fresh/progressed save paths;
- browser smoke for at least one environmental stress path under debug, high contrast, reduced motion, performance mode, and narrow viewport where practical;
- regression coverage that keeps item-storm, enemy-rich, dense-combat, forced-exit, forced-destruction, boss-release hazard, and quiet long-scroll paths green while environmental density grows.

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

Phase 5 should add these seed/save fixtures:

- `SCRAP-BAY-SMOKE` - progressed save fixture with enough scrap to buy a first upgrade; implemented in the work order 042 Playwright bay smoke.
- `UPGRADE-SEED-SNAPSHOT` - same seed tested under fresh and upgraded save states; implemented in work order 043 upgrade-effect snapshots.
- `RUN-SCRAP-CALLOUT` - forced summary path that verifies earned/banked scrap and upgrade progress copy; implemented in the work order 044 Playwright summary smoke.
- `EXIT-TOAST-CHECK` - forgiving sector completion path for exit/toast smoke; implemented through the work order 045 forced sector-complete Playwright path.
- `LUNAR-SURFACE-LANE` - deterministic lunar sector/background/feature/pacing plan; implemented across work orders 046 and 047 generation/background/feature/route-condition/content/wave-director tests, with browser traversal smoke added in work order 049.
- `SHIP-BREAKUP-TEST` - deterministic death/destruction summary path; first covered by the work order 048 debug forced-destruction Playwright path.

Phase 6 should add these seed/save fixtures:

- `ITEM-CATALOG-AUDIT` - stable fixture for catalog metadata and reward pool sampling.
- `HOOK-STORM-SMOKE` - item-heavy combat fixture with multiple hook families active under proc budget limits; implemented in work order 059 through the `6` item-storm debug shortcut and browser smoke.
- `SHOP-VAULT-STACK` - reward/shop/vault route path for item source weighting smoke.
- `UNLOCKED-ITEM-FAMILIES` - progressed save fixture that verifies unlock-gated item families and discovery records; first covered in work order 059 through pure fresh/unlocked reward-shop-vault pool preview tests.
- `LUNAR-RELIC-CATALOG` - lunar/faction/source-biased item pool fixture for sector-themed items.

Phase 7 should add these seed/save fixtures:

- `ROLE-LADDER-SMOKE` - opening-to-midsector path that exposes multiple enemy roles without boss pressure.
- `VARIANT-ESCALATION-GRID` - later-sector path for upgraded and elite variant selection snapshots.
- `FORMATION-SQUAD-GRID` - deterministic formation spawn schedule fixture for wedge/screen/escort coverage; first covered by work order 066.
- `FORMATION-CATCHUP-GRID` - frame-catchup fixture proving formation members do not skip or duplicate when scroll jumps across markers; first covered by work order 066.
- `FORMATION-WEDGE-TEST` - deterministic formation objective-clear fixture for work order 067; covered by unit regressions for simultaneous formation kills, secondary item kills, despawns, body collisions, and distance-sector completion.
- `LONG-SECTOR-CARAVAN` - extended sector with pressure/relief windows, formation clusters, and debug scroll metrics; first covered by work order 068 route-conditioned pacing and wave-plan unit tests.
- `ENEMY-RICH-SMOKE` - debug-only enemy-rich pocket for active roles, upgraded variants, formation labels, projectile/telegraph budgets, and long-sector pacing telemetry; first covered by work order 069 through the `E` shortcut on the `LUNAR-SURFACE-LANE` browser path.
- `SUPPORT-DRONE-NEST` - support/disruptor role fixture for shield, escort, deploy, or hazard-mark behavior.
- `BOSS-HAZARD-RELEASE` - boss-gated hazard handoff fixture for verifying hidden arena-lock hazards get a fresh post-defeat telegraph before damage; first covered by work order 070 unit regression.

Phase 8 should add these seed/save fixtures:

- `HAZARD-ZONE-GAUNTLET` - richer hazard-zone schedule fixture for sweep/pulse/drift/collapse families.
- `BOSS-HAZARD-GAUNTLET` - boss-gated hazard schedule fixture that preserves the post-defeat telegraph fairness rule under denser hazard plans.
- `DESTRUCTIBLE-SALVAGE-FIELD` - destructible-rich fixture for damage, reward, chain reaction, and cleanup coverage.
- `OBSTACLE-LANE-CHECK` - obstacle placement fixture for safe-lane, exit-corridor, and viewport-parity checks.
- `LOOSE-SCRAP-RAIN` - loose currency scatter and pickup-magnet fixture for economy accounting.
- `ENVIRONMENT-STRESS-SMOKE` - debug-only environmental pressure pocket for active hazard, destructible/obstacle, loose currency, and stress-budget telemetry.

## Content validation checklist

Phase 2 should extend this checklist as systems become real. In addition to the existing entries, content validation should cover ship stat ranges, objective references, wave references, implemented hook coverage, and unlock-gated pools for fresh and progressed saves. Phase 3 should extend it again for sector length ranges, scroll-speed modifiers, background-plan references, landmark references, hazard references, and distance marker ordering. Phase 4 should extend it again for ship appearance references, HUD theme keys, preview assets/primitives, and input/display settings defaults. Phase 5 should extend it again for upgrade definitions, upgrade prerequisites, upgrade effect references, icon categories, lunar sector references, lunar feature references, and destruction cue metadata. Phase 6 should extend it again for item family/source metadata, implementation status, unlock/discovery gates, source-weighted pools, synergy cluster references, and item card presentation data. Phase 7 should extend it again for enemy role metadata, movement/attack family references, variant eligibility, formation definitions, and longer-sector pacing references. Phase 8 should extend it again for richer hazard-zone definitions, destructible/obstacle definitions, loose currency scatter rules, safe-lane placement constraints, environmental stress budgets, and pickup economy caps.

- [ ] No duplicate IDs.
- [ ] Every item tag is registered.
- [x] Every hook name is registered.
- [ ] Every ship references valid weapon/item IDs.
- [ ] Every wave references valid enemy IDs.
- [ ] Every sector references valid factions/bosses.
- [ ] Every unlock references valid reward/content IDs.
- [ ] Every reward pool has at least one eligible item.
- [ ] Rarity values are valid.
- [ ] Curses are clearly marked.
- [x] Ship appearance references, palettes, weapon mount hints, and HUD theme keys validate.
- [x] Upgrade definitions, costs, prerequisites, effect references, and icon categories validate.
- [x] Lunar sector background, feature, pacing, faction, and boss references validate.
- [x] Item family, source, implementation status, unlock gate, and reward-pool source metadata validate after Phase 6 schema work.
- [x] The first Phase 6 catalog expansion validates at 60 items with declared hook implementations and source-aligned starter/combat/vault pools.
- [x] Source-weighted item pool profiles validate for reward-pool, source, rarity, family, and tag references.
- [x] Item discovery gates, unlock-gated family pools, synergy cluster references, and item card presentation data validate after later Phase 6 work.
- [x] Enemy role, pressure, movement, attack, variant, formation, readability, and faction-fit metadata validate after Phase 7 schema work.
- [x] Formation definitions validate member roles, offsets, timing, bounds, clear rewards, and break/cleanup behavior.
- [x] Longer-sector pacing validates length bands, pressure/relief windows, formation marks, and boss approach references.
- [x] Current enemy role audit helper covers faction-pattern classes, target roles, wave-label semantics, spawn model, and objective-risk notes before Phase 7 schema work.
- [ ] Rich hazard-zone definitions validate family, phase timing, telegraph/damage shapes, safe-lane expectations, accessibility metadata, and boss-arena suppression behavior.
- [ ] Destructible/obstacle definitions validate collision shape, hull, damage interactions, objective policy, reward policy, chain behavior, placement constraints, cue metadata, and debug labels.
- [ ] Loose currency scatter rules validate value tiers, drift/lifetime, pickup attraction, cap rules, route/sector bias, and economy accounting.

## Manual browser smoke matrix

| Browser       | Load | Start run | Combat | Pause | Settings | Summary | Narrow viewport | Mouse | Upgrade Bay | Lunar/Exit | Notes |
| ------------- | ---- | --------- | ------ | ----- | -------- | ------- | --------------- | ----- | ----------- | ---------- | ----- |
| Chrome/Edge   |      |           |        |       |          |         |                 |       |             |            |       |
| Firefox       |      |           |        |       |          |         |                 |       |             |            |       |
| Safari/WebKit |      |           |        |       |          |         |                 |       |             |            |       |

## Performance checklist

Phase 2 performance checks should include wave/objective count, projectile count, particle count, audio cue load, and dense boss-pattern scenarios.

Phase 3 performance checks should also include background primitive count, parallax layer count, distance traveled, scroll speed, active distance markers, active landmarks, active hazards, and long-scroll scenarios that run longer than a normal sector.

Current first-pass instrumentation exposes granular combat counts, active enemy role/variant/formation counts, background primitive/layer counts, active landmark/hazard counts, distance, speed, active input mode, HUD mode, viewport size/class/presentation scale, DPR, canvas pixel size, safe-frame origin/size, fixed combat world size, banked scrap, upgrade readiness, run resources, current sector id/name/background/pacing, exit progress, destruction progress, item count, active hook count, proc cap state, build identity, a dense-combat debug pocket, an item-storm hook stress pocket, forced exit/destruction shortcuts, and a quiet late-sector long-scroll traversal behind `?debug=1`. Production preview smoke passed for work orders 050, 060, and 070; manual non-Chromium and real-device browser validation still need to close the checklist.

Phase 4 performance checks should include viewport/presentation scale, safe-frame size, fixed-world hazard/enemy spacing parity, HUD rendering density, preview rendering cost, mouse input update behavior, ship cue rendering cost, non-combat theme DOM cost, and whether themed HUD/ship cues add measurable overhead in dense and long-scroll debug scenarios.

Phase 5 performance checks should include Upgrade Bay DOM/icon rendering cost, upgrade-state generation branching, toast queue overhead, lunar background/feature primitive counts, lunar hazard readability, and ship destruction particle/debris budgets in reduced motion/performance modes.

Phase 6 performance checks should include item hook dispatch cost, proc budget limits, reward/shop/vault pool sampling cost, large item card DOM rendering, archive filtering, and dense synergy combat readability.

Phase 7 performance checks should include active role counts, upgraded variant counts, formation membership counts, long-sector wave spacing, projectile/telegraph budgets under role-specific attacks, and whether longer sectors create sustained CPU/render pressure beyond existing dense and item-storm pockets.

Work order 070 closes Phase 7 with release-hardening evidence and a boss-release hazard regression. Locked boss arenas still suppress hazards for readability, but overlapping hidden hazard windows now restart their telegraph lead when the arena releases so damage cannot occur on the boss-death handoff.

Phase 8 performance checks should include active hazard-zone count, hazard family label count, destructible/obstacle count, loose currency count/value, pickup attraction cost, chain-reaction caps, environmental stress budgets, and whether richer environmental pressure hides bullets or extends per-frame collision scans beyond current dense/enemy-rich pockets.

- [x] FPS overlay available behind debug flag.
- [x] Projectile count visible in debug mode.
- [ ] Particle count visible in debug mode.
- [x] Background/debug counters visible in debug mode.
- [x] Distance and scroll speed visible in debug mode.
- [x] Viewport/canvas scale visible in debug mode once Phase 4 instrumentation lands.
- [x] Active input mode visible in debug mode once mouse controls land.
- [x] HUD mode and contract theme visible in debug mode for Phase 4 smoke.
- [x] Contract preview model and selection smoke coverage exists.
- [x] Contract theme propagation smoke coverage exists for route/shop/reward/transition/summary screens.
- [x] Upgrade Bay, banked scrap state, and upgrade-influenced generation visible in tests/debug smoke.
- [x] Sector exit/toast, destruction, and lunar browser smoke paths exist.
- [x] Item hook pressure, proc cap state, and build identity visible in debug smoke.
- [x] Active enemy role and upgraded-variant counts visible in debug once Phase 7 schema and variant instrumentation lands.
- [x] Role-specific movement profiles have deterministic bounds and profile-difference tests for the current Phase 7 roster.
- [x] Role-specific attack profiles have deterministic cadence, telegraph, and projectile-budget tests for current and registered Phase 7 attack families.
- [x] Active formation counts visible in debug once work order 066 lands.
- [x] Long-sector pressure visible in debug/summaries after work order 068 and in browser stress smoke after work order 069.
- [ ] Active hazard-zone, destructible/obstacle, loose currency, and environmental stress-budget counters visible in debug once Phase 8 lands.
- [ ] Environmental stress smoke covers at least one hazard/destructible/obstacle/currency path where practical.
- [ ] Normal combat stays near 60 FPS on dev machine.
- [x] Heavy combat debug scene documented.
- [x] Long-scroll debug scene documented.
- [ ] Screen shake and particles respect reduced motion/performance settings.

## Accessibility checklist

Phase 2 accessibility checks should cover seed entry, summary sharing, special/bomb/graze HUD readability, reduced motion, mute, and keyboard-only route/reward/shop flows.

Phase 3 accessibility checks should also cover moving-background readability, high-contrast bullets over each sector palette, reduced-motion parallax simplification, distance HUD readability, boss scroll-lock clarity, and keyboard-only continuation after reaching sector exits.

Phase 4 accessibility checks should also cover narrow viewport HUD readability, mouse controls as passive optional input, keyboard-only parity after previews/HUD changes, high-contrast bullets over contract ship/HUD themes, reduced-motion simplification for ship wake/damage cues, and focus safety across pointer interactions.

Phase 5 accessibility checks should also cover Upgrade Bay focus and purchase confirmation, upgrade icon text alternatives, non-color-only affordability state, sector exit/toast timing, lunar terrain bullet readability, and ship destruction fallback under reduced motion/performance/high-contrast settings.

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
- [x] Production build preview tested.
- [ ] GitHub Pages deployed.
- [ ] Public URL loads assets correctly.
- [x] README updated.
- [x] License present.
- [x] Credits mention original/generated placeholders as appropriate.
- [x] Changelog updated.
- [x] Save migration tested.
- [x] Seed sharing works.
- [x] Known severe bugs documented or fixed.

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
