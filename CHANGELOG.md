# Changelog

## Unreleased

### Gameplay and UX

- Added data-driven sector objectives, deterministic directed wave schedules, HUD objective progress, and boss-gated late sectors.
- Added first-pass special burst fire, bomb danger cancellation, deterministic graze charge, verb HUD readouts, and procedural cues for those verbs.
- Added contract-specific ship stats, starting economy, weapon projectile patterns, heat/overheat reload behavior, and weapon HUD readouts.
- Added phase behavior for all five bosses, active boss phase HUD labels, high-contrast boss telegraphs, and a final-sector victory summary.
- Added original procedural Web Audio cues for firing, impacts, pickups, boss warnings, sector clears, and run endings.
- Added gameplay camera shake that respects reduced motion and screen shake strength settings.

### Testing

- Added wave director and objective completion tests, including known-seed objective snapshots and boss-gate coverage.
- Added combat tests for special charge/use, bomb mitigation, graze detection, remapped special/bomb controls, and reduced-motion effect rendering.
- Added validation and gameplay tests for ship stat contracts, weapon references, weapon patterns, heat/reload behavior, and starting economy.
- Added deterministic tests for boss phase thresholds, late-boss projectile budgets, final victory routing, and victory save records.
- Added unit coverage for audio cue settings, combat feedback detection, and deterministic screen-shake decay.

### Planning

- Concluded Phase 1 in planning docs and added the Phase 2 roadmap/work orders for complete-run depth, player verbs, content expansion, unlock gating, and playtest hardening.

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
