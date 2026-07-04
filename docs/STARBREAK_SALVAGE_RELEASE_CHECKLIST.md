# Starbreak Salvage Release Checklist

Release candidate: `0.10.0`
Date: 2026-07-03

Phase 1 status: concluded after M10 deployment plus first-pass procedural audio/VFX. Phase 2 planning now lives in `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md`.

## Automated Checks

| Item                          | Status | Evidence                                             |
| ----------------------------- | ------ | ---------------------------------------------------- |
| TypeScript typecheck          | Pass   | `npm run check`                                      |
| ESLint                        | Pass   | `npm run check`                                      |
| Unit and deterministic tests  | Pass   | `npm run check` - 26 files, 142 tests                |
| Production build              | Pass   | `npm run check` - Vite build created `dist/`         |
| Playwright Chromium smoke     | Pass   | `npm run test:e2e` - 1 passed                        |
| Production preview asset load | Pass   | Local preview returned HTTP 200 and Pages asset path |

## Release Audit

| Item                       | Status | Notes                                                                                                  |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Public deployment playable | Pass   | Existing Pages deployment confirmed through M9; M10 keeps static Vite build.                           |
| Vite base path             | Pass   | `vite.config.ts` uses `/StarbreakSalvage/`.                                                            |
| Pages workflow             | Pass   | `.github/workflows/pages.yml` builds `dist` and deploys Pages artifact.                                |
| CI workflow                | Pass   | `.github/workflows/ci.yml` runs checks and Playwright smoke.                                           |
| README                     | Pass   | Local dev, controls, settings, save, debug, seed sharing, vision, credits, and license are documented. |
| License                    | Pass   | `LICENSE` is present.                                                                                  |
| Credits                    | Pass   | `CREDITS.md` documents original placeholders and tooling.                                              |
| Changelog                  | Pass   | `CHANGELOG.md` has a `0.10.0` entry.                                                                   |
| Save behavior              | Pass   | Versioned localStorage save, migration, corruption repair, reset, export, and import are tested.       |
| Settings behavior          | Pass   | Settings persist and E2E covers changing an option.                                                    |
| Seed sharing               | Pass   | Menu seed entry and summary share links support blank/default/random/known/custom labels.              |
| Content validation         | Pass   | Shipped content validates and bad fixtures are covered by tests.                                       |
| Runtime dependencies       | Pass   | No production dependencies remain.                                                                     |

## Manual Browser Smoke

| Browser                 | Load    | Start Run | Combat  | Pause   | Settings | Summary | Notes                                       |
| ----------------------- | ------- | --------- | ------- | ------- | -------- | ------- | ------------------------------------------- |
| Chromium via Playwright | Pass    | Pass      | Pass    | Pass    | Pass     | Pass    | Automated smoke covers this.                |
| Chrome or Edge manual   | Not run | Not run   | Not run | Not run | Not run  | Not run | Requires manual browser pass on deployment. |
| Firefox manual          | Not run | Not run   | Not run | Not run | Not run  | Not run | Requires manual browser pass on deployment. |
| Safari manual           | Not run | Not run   | Not run | Not run | Not run  | Not run | Requires macOS/iOS browser pass.            |

## Known Issues

- Audio is currently procedural cue feedback only; music and a fuller mix are not implemented yet.
- Screen shake is implemented for gameplay feedback, but particle effects and flash-reduction polish remain future work.
- Manual cross-browser smoke outside Chromium remains pending.
