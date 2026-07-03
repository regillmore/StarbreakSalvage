# Changelog

## Unreleased

### Gameplay and UX

- Added original procedural Web Audio cues for firing, impacts, pickups, boss warnings, sector clears, and run endings.
- Added gameplay camera shake that respects reduced motion and screen shake strength settings.

### Testing

- Added unit coverage for audio cue settings, combat feedback detection, and deterministic screen-shake decay.

## 0.10.0 - 2026-07-03

### Highlights

- Hardened the public browser build for the M10 release-candidate pass.
- Added shareable seed links on the run summary screen.
- Added release metadata: license, credits, changelog, and checklist.

### Gameplay and UX

- Summary screens now expose a copy-ready URL that reproduces the run seed.
- README now points to controls, settings, save behavior, seed sharing, credits, and license information.

### Build and QA

- Removed unused Puppeteer dependency; Playwright remains the browser smoke test runner.
- Verified content validation, save migration/import/export tests, deterministic seed tests, E2E smoke, and production build.

### Known Issues

- Audio is not implemented yet, so mute and volume settings are persisted hooks for the future audio layer.
- Screen shake strength is persisted and exposed, but gameplay VFX do not yet apply shake.
- Manual cross-browser smoke is documented as pending for browsers outside the local Chromium check.
