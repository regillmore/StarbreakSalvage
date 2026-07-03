# Starbreak Salvage Release Checklist

Release candidate: `0.10.0`
Date: 2026-07-03

## Automated Checks

| Item                          | Status | Evidence                                             |
| ----------------------------- | ------ | ---------------------------------------------------- |
| TypeScript typecheck          | Pass   | `npm run check`                                      |
| ESLint                        | Pass   | `npm run check`                                      |
| Unit and deterministic tests  | Pass   | `npm run check` - 15 files, 74 tests                 |
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
| Seed sharing               | Pass   | Summary provides a shareable `?seed=` link; URL seed entry is supported.                               |
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

- Audio is not implemented yet. Mute and volume settings are persisted and ready for the future audio layer.
- Screen shake strength is persisted and exposed, but gameplay VFX do not yet apply shake.
- Manual cross-browser smoke outside Chromium remains pending.
