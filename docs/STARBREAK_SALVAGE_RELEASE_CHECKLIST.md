# Starbreak Salvage Release Checklist

Release candidate: `0.10.0` Phase 2 playtest hardening
Date: 2026-07-04

Phase 1 status: concluded after M10 deployment plus first-pass procedural audio/VFX. Phase 2 work orders 011-020 are deployed and confirmed. Phase 3 planning now lives in `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`; work orders 021-029 add the first-pass scroll simulation, procedural background, scroll-synced directed-wave, distance-objective, landmark, hazard, boss-arena, route-conditioned sector, velocity/readability, and long-scroll instrumentation foundations, with manual cross-browser playtest still pending.

## Automated Checks

| Item                          | Status          | Evidence                                                                             |
| ----------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| TypeScript typecheck          | Pass            | `npm run check`                                                                      |
| ESLint                        | Pass            | `npm run check`                                                                      |
| Unit and deterministic tests  | Pass            | `npm run check` - 31 files, 178 tests                                                |
| Production build              | Pass            | `npm run check` - Vite build created `dist/`                                         |
| Playwright Chromium smoke     | Blocked locally | Targeted smoke attempted; local Playwright Chromium headless shell is not installed. |
| Production preview asset load | Pass            | Local preview returned HTTP 200 and Pages asset path                                 |

## Release Audit

| Item                       | Status | Notes                                                                                                                                                                                                                                      |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public deployment playable | Pass   | Existing Pages deployment confirmed through 019; WO020 keeps the static Vite build.                                                                                                                                                        |
| Vite base path             | Pass   | `vite.config.ts` uses `/StarbreakSalvage/`.                                                                                                                                                                                                |
| Pages workflow             | Pass   | `.github/workflows/pages.yml` builds `dist` and deploys Pages artifact.                                                                                                                                                                    |
| CI workflow                | Pass   | `.github/workflows/ci.yml` runs checks and Playwright smoke.                                                                                                                                                                               |
| README                     | Pass   | Local dev, controls, settings, save, debug, seed sharing, vision, credits, and license are documented.                                                                                                                                     |
| License                    | Pass   | `LICENSE` is present.                                                                                                                                                                                                                      |
| Credits                    | Pass   | `CREDITS.md` documents original placeholders and tooling.                                                                                                                                                                                  |
| Changelog                  | Pass   | `CHANGELOG.md` has a `0.10.0` entry.                                                                                                                                                                                                       |
| Save behavior              | Pass   | Versioned localStorage save, migration, corruption repair, reset, export, and import are tested.                                                                                                                                           |
| Settings behavior          | Pass   | Settings persist and E2E covers changing an option.                                                                                                                                                                                        |
| Seed sharing               | Pass   | Menu seed entry and summary share links support blank/default/random/known/custom labels.                                                                                                                                                  |
| Content validation         | Pass   | Shipped content validates and bad fixtures are covered by tests.                                                                                                                                                                           |
| Runtime dependencies       | Pass   | No production dependencies remain.                                                                                                                                                                                                         |
| Debug/performance tools    | Pass   | `?debug=1` supports five boss shortcuts, dense combat stress, quiet long-scroll traversal, forced summary, granular entity/projectile/pickup/effect/feature counters, distance/speed/arena counters, and background primitive/layer count. |

## Phase 2 Playtest Audit

| Area                  | Status | Notes                                                                                                                         |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Balance               | Watch  | First-pass routes, rewards, shop economy, boss pressure, and unlock pacing need live playtest data.                           |
| Performance           | Pass   | Dense debug pocket stays under the 80-entity Phase 2 alpha budget and has unit/E2E coverage.                                  |
| Accessibility         | Watch  | Keyboard flow, remapping, mute, reduced motion, shake strength, and contrast exist; manual mobile and contrast checks remain. |
| Deterministic content | Pass   | Seeded contracts, sectors, objectives, routes, rewards, shops, boss schedule, and unlock-gated pools are covered by tests.    |
| Browser load          | Pass   | Static Vite build, Pages base path, Playwright smoke, and production preview smoke are covered.                               |

## Manual Browser Smoke

| Browser                 | Load    | Start Run | Combat  | Pause   | Settings | Summary | Debug Perf | Notes                                       |
| ----------------------- | ------- | --------- | ------- | ------- | -------- | ------- | ---------- | ------------------------------------------- |
| Chromium via Playwright | Blocked | Blocked   | Blocked | Blocked | Blocked  | Blocked | Blocked    | Local Chromium headless shell is missing.   |
| Chrome or Edge manual   | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires manual browser pass on deployment. |
| Firefox manual          | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires manual browser pass on deployment. |
| Safari manual           | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires macOS/iOS browser pass.            |

## Known Issues

- Audio is procedural cue feedback only; music and a fuller mix are not implemented yet.
- Route/reward/shop/boss balance is first-pass and needs live playtest tuning.
- First-pass scroll simulation, procedural sector backgrounds, scroll-synced directed waves, distance objectives, landmarks, hazards, boss arenas, route-conditioned sector conditions, velocity presentation cues, and long-scroll instrumentation exist, but balance/readability tuning remains early.
- The debug overlay reports granular entity and scroll/background/feature counts; frame-time sampling, allocation timing, and production-preview scrolling smoke remain future release-hardening work.
- Manual cross-browser smoke outside Chromium remains pending.
