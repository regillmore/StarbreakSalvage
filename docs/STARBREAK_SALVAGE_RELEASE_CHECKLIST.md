# Starbreak Salvage Release Checklist

Release candidate: `0.10.0` Phase 2 playtest hardening
Date: 2026-07-04

Phase 1 status: concluded after M10 deployment plus first-pass procedural audio/VFX. Phase 2 work orders 011-020 are deployed and confirmed. Phase 3 planning now lives in `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`; work orders 021-023 add the first-pass scroll simulation, procedural background, and scroll-synced directed-wave foundations, with manual cross-browser playtest still pending.

## Automated Checks

| Item                          | Status          | Evidence                                                                                             |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| TypeScript typecheck          | Pass            | `npm run check`                                                                                      |
| ESLint                        | Pass            | `npm run check`                                                                                      |
| Unit and deterministic tests  | Pass            | `npm run check` - 28 files, 154 tests                                                                |
| Production build              | Pass            | `npm run check` - Vite build created `dist/`                                                         |
| Playwright Chromium smoke     | Blocked locally | Prior release pass remains; WO023 local run could not launch missing `chromium_headless_shell-1228`. |
| Production preview asset load | Pass            | Local preview returned HTTP 200 and Pages asset path                                                 |

## Release Audit

| Item                       | Status | Notes                                                                                                                                                        |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public deployment playable | Pass   | Existing Pages deployment confirmed through 019; WO020 keeps the static Vite build.                                                                          |
| Vite base path             | Pass   | `vite.config.ts` uses `/StarbreakSalvage/`.                                                                                                                  |
| Pages workflow             | Pass   | `.github/workflows/pages.yml` builds `dist` and deploys Pages artifact.                                                                                      |
| CI workflow                | Pass   | `.github/workflows/ci.yml` runs checks and Playwright smoke.                                                                                                 |
| README                     | Pass   | Local dev, controls, settings, save, debug, seed sharing, vision, credits, and license are documented.                                                       |
| License                    | Pass   | `LICENSE` is present.                                                                                                                                        |
| Credits                    | Pass   | `CREDITS.md` documents original placeholders and tooling.                                                                                                    |
| Changelog                  | Pass   | `CHANGELOG.md` has a `0.10.0` entry.                                                                                                                         |
| Save behavior              | Pass   | Versioned localStorage save, migration, corruption repair, reset, export, and import are tested.                                                             |
| Settings behavior          | Pass   | Settings persist and E2E covers changing an option.                                                                                                          |
| Seed sharing               | Pass   | Menu seed entry and summary share links support blank/default/random/known/custom labels.                                                                    |
| Content validation         | Pass   | Shipped content validates and bad fixtures are covered by tests.                                                                                             |
| Runtime dependencies       | Pass   | No production dependencies remain.                                                                                                                           |
| Debug/performance tools    | Pass   | `?debug=1` supports five boss shortcuts, dense combat stress, forced summary, entity-count overlay, distance/speed counters, and background primitive count. |

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
| Chromium via Playwright | Pass    | Pass      | Pass    | Pass    | Pass     | Pass    | Pass       | Automated smoke covers this.                |
| Chrome or Edge manual   | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires manual browser pass on deployment. |
| Firefox manual          | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires manual browser pass on deployment. |
| Safari manual           | Not run | Not run   | Not run | Not run | Not run  | Not run | Not run    | Requires macOS/iOS browser pass.            |

## Known Issues

- Audio is procedural cue feedback only; music and a fuller mix are not implemented yet.
- Route/reward/shop/boss balance is first-pass and needs live playtest tuning.
- First-pass scroll simulation, procedural sector backgrounds, and scroll-synced directed waves exist, but distance objectives, landmarks, hazards, and boss arenas remain Phase 3 follow-up work.
- The debug overlay reports total entity count plus distance/speed/background primitive count; separate projectile/particle/background timing counters remain future instrumentation.
- Manual cross-browser smoke outside Chromium remains pending.
