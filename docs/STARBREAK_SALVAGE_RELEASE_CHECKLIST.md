# Starbreak Salvage Release Checklist

Release candidate: Phase 4 display/input playtest candidate
Date: 2026-07-05

Phase 1 status: concluded after M10 deployment plus first-pass procedural audio/VFX. Phase 2 work orders 011-020 are deployed and confirmed. Phase 3 work orders 021-030 are complete as a first-pass scrolling playtest foundation: scroll simulation, procedural backgrounds, scroll-synced directed waves, distance objectives, landmarks, hazards, boss arenas, route-conditioned sector conditions, velocity/readability polish, long-scroll instrumentation, and release docs. Phase 4 work orders 031-040 are complete as a first-pass display/input/contract-identity playtest candidate. Phase 5 planning now lives in `docs/STARBREAK_SALVAGE_PHASE_5_PLAN.md`.

## Automated Checks

| Item                          | Status          | Evidence                                                                                 |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| TypeScript typecheck          | Pass            | `npm run check`                                                                          |
| ESLint                        | Pass            | `npm run check`                                                                          |
| Unit and deterministic tests  | Pass            | `npm run check` - 40 files, 226 tests                                                    |
| Production build              | Pass            | `npm run check` - Vite build created `dist/`                                             |
| Playwright Chromium smoke     | Pass            | `npm run test:e2e` - 6 Chromium smoke tests with Codex escalation; sandboxed runs cannot read the AppData browser cache. |
| Production preview asset load | Pass            | Local preview returned HTTP 200 and Pages asset path                                     |

## Release Audit

| Item                       | Status | Notes                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public deployment playable | Pass   | Existing Pages deployment confirmed through 039; WO040 keeps the static Vite build and save schema.                                                                                                                                                                                                       |
| Vite base path             | Pass   | `vite.config.ts` uses `/StarbreakSalvage/`.                                                                                                                                                                                                                                                               |
| Pages workflow             | Pass   | `.github/workflows/pages.yml` builds `dist` and deploys Pages artifact.                                                                                                                                                                                                                                   |
| CI workflow                | Pass   | `.github/workflows/ci.yml` runs checks and Playwright smoke.                                                                                                                                                                                                                                              |
| README                     | Pass   | Local dev, controls, settings, save, debug, seed sharing, vision, planning links, credits, and license are documented.                                                                                                                                                                                    |
| License                    | Pass   | `LICENSE` is present.                                                                                                                                                                                                                                                                                     |
| Credits                    | Pass   | `CREDITS.md` documents original placeholders and tooling.                                                                                                                                                                                                                                                 |
| Changelog                  | Pass   | `CHANGELOG.md` has a `0.10.0` entry.                                                                                                                                                                                                                                                                      |
| Save behavior              | Pass   | Versioned localStorage save, migration, corruption repair, reset, export, and import are tested.                                                                                                                                                                                                          |
| Settings behavior          | Pass   | Settings persist and E2E covers changing an option.                                                                                                                                                                                                                                                       |
| Seed sharing               | Pass   | Menu seed entry and summary share links support blank/default/random/known/custom labels.                                                                                                                                                                                                                 |
| Content validation         | Pass   | Shipped content validates and bad fixtures are covered by tests.                                                                                                                                                                                                                                          |
| Runtime dependencies       | Pass   | No production dependencies remain.                                                                                                                                                                                                                                                                        |
| Debug/performance tools    | Pass   | `?debug=1` supports five boss shortcuts, dense combat stress, forced sector completion with exit-progress telemetry, quiet long-scroll traversal, forced summary, granular entity/projectile/pickup/effect/feature counters, distance/speed/arena counters, input mode, HUD mode, contract theme, background primitive/layer count, viewport scale/DPR, canvas pixel size, safe-frame origin/size, and fixed world size. |

## Phase 3 Scrolling Playtest Audit

| Area                  | Status | Notes                                                                                                                                                                                                                          |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Balance               | Watch  | First-pass scroll speed, sector length, hazard density, route conditions, rewards, shop economy, boss pressure, and unlock pacing need live playtest data.                                                                     |
| Performance           | Pass   | Dense and long-scroll debug scenarios are deterministic; granular counters separate combat, background, feature, distance, speed, and arena state.                                                                             |
| Accessibility         | Watch  | Keyboard flow, remapping, passive mouse/touch assist, mute, reduced motion, shake strength, contrast, HUD wrapping, fixed-arena safe-frame scaling, and high-contrast bullets exist; manual mobile and contrast checks remain. |
| Deterministic content | Pass   | Seeded contracts, sectors, objectives, routes, rewards, shops, boss schedule, scroll plans, backgrounds, hazards, arena marks, and condition plans are covered by tests.                                                       |
| Browser load          | Pass   | Static Vite build, Pages base path, production preview smoke, and escalated local Playwright smoke are covered.                                                                                                                |

## Phase 4 Display/Input Playtest Audit

| Area                  | Status | Notes                                                                                                                                                                                                                                                       |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display parity        | Pass   | Fixed 640x720 combat-world presentation, viewport class/scale/DPR debug metrics, safe-frame origin/size metrics, and narrow viewport Playwright smoke are covered.                                                                                         |
| Input choice          | Pass   | Keyboard-only flow, passive pointer movement, primary pointer fire, pointer clearing over DOM overlays, and active input-mode debug metrics are covered by unit/E2E smoke.                                                                                  |
| Contract identity     | Pass   | Ship appearance data, gameplay silhouettes, selected-contract previews, cockpit HUD mode/theme state, ship feedback cues, non-combat theme propagation, and summary/debug metadata are implemented and tested.                                               |
| Accessibility         | Watch  | Reduced motion, performance mode, high contrast, keyboard-only flow, and focus preservation are covered in smoke; manual cross-theme, non-Chromium, and real mobile checks remain useful.                                                                   |
| Browser load          | Pass   | `npm run check`, Playwright Chromium smoke, and local production preview asset-path smoke passed for work order 040.                                                                                                                                         |
| Phase 5 readiness     | Pass   | Phase 5 docs now identify banked scrap purpose, upgrade bay icons, sector exit/toast feedback, lunar surface sector content, richer ship destruction, and progression release hardening as the next roadmap.                                                 |

## Manual Browser Smoke

| Browser                 | Load    | Start Run | Combat  | Mouse   | Pause   | Settings | Summary | Narrow View | Debug Perf | Long Scroll | Notes                                                                                 |
| ----------------------- | ------- | --------- | ------- | ------- | ------- | -------- | ------- | ----------- | ---------- | ----------- | ------------------------------------------------------------------------------------- |
| Chromium via Playwright | Pass    | Pass      | Pass    | Pass    | Pass    | Pass     | Pass    | Pass        | Pass       | Pass        | `npm run test:e2e` passes with Codex escalation and covers preview/HUD/debug metrics. |
| Chrome or Edge manual   | Not run | Not run   | Not run | Not run | Not run | Not run  | Not run | Not run     | Not run    | Not run     | Requires manual browser pass on deployment.                                           |
| Firefox manual          | Not run | Not run   | Not run | Not run | Not run | Not run  | Not run | Not run     | Not run    | Not run     | Requires manual browser pass on deployment.                                           |
| Safari manual           | Not run | Not run   | Not run | Not run | Not run | Not run  | Not run | Not run     | Not run    | Not run     | Requires macOS/iOS browser pass.                                                      |

## Known Issues

- Audio is procedural cue feedback only; music and a fuller mix are not implemented yet.
- Route/reward/shop/boss balance is first-pass and needs live playtest tuning.
- First-pass scroll simulation, procedural sector backgrounds, scroll-synced directed waves, distance objectives, landmarks, hazards, boss arenas, route-conditioned sector conditions, velocity presentation cues, and long-scroll instrumentation exist, but balance/readability tuning remains early.
- The debug overlay reports granular entity, scroll/background/feature, input mode, HUD mode, contract theme, viewport/DPR/canvas, safe-frame, and fixed-world counts; frame-time sampling and allocation timing remain future instrumentation work.
- Phase 4 display/input work is complete as a first-pass playtest candidate: fixed-arena window-size parity, passive mouse/touch assist, gameplay contract ship appearance, New Game ship previews, cockpit HUD theming, accessibility hardening, ship identity feedback, non-combat contract theme propagation, viewport/input debug smoke hardening, and release evidence exist. Phase 5 progression/sector-feedback work is in progress.
- Banked scrap now has a first data-backed upgrade catalog, save-backed purchase helpers, a visual Upgrade Bay with static original icons, deterministic upgrade-influenced run generation for contract, route, shop, vault reward, and seed-survey surfaces, plus run-end scrap/upgrade progress callouts. Sector exits now have a short beacon/toast beat before route or victory handoff.
- Lunar Surface has a first deterministic background/sector foundation; lunar-specific hazards/landmarks/encounter pacing and richer player destruction are planned but not implemented yet.
- Manual cross-browser smoke outside Chromium remains pending.
