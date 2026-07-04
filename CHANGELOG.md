# Changelog

## Unreleased

### Gameplay and UX

- Added data-driven sector objectives, deterministic directed wave schedules, HUD objective progress, and boss-gated late sectors.
- Added first-pass special burst fire, bomb danger cancellation, deterministic graze charge, verb HUD readouts, and procedural cues for those verbs.
- Added contract-specific ship stats, starting economy, weapon projectile patterns, heat/overheat reload behavior, and weapon HUD readouts.
- Added phase behavior for all five bosses, active boss phase HUD labels, high-contrast boss telegraphs, and a final-sector victory summary.
- Added deterministic route outcomes for shop, elite, vault, repair, glitch, and faction ambush routes, including route event UI, repair hull patches, curse/relic tradeoffs, shop modifiers, next-sector combat pressure, and route history summaries.
- Expanded the content table to 30 items, 4 factions, and 8 build archetype targets, including Void Corsair phase-skirmish enemies and new item hook effects.
- Connected unlocks to future run generation so fresh saves begin with baseline contracts while earned unlocks widen ship, item, faction, boss, challenge, practice, and music availability.
- Added original procedural Web Audio cues for firing, impacts, pickups, boss warnings, sector clears, and run endings.
- Added gameplay camera shake that respects reduced motion and screen shake strength settings.
- Added deterministic sector scroll plans, fixed-step distance tracking, HUD distance/speed readouts, debug distance counters, and subtle reduced-motion-aware starfield drift.
- Added deterministic procedural parallax background plans for all five sectors, with original canvas-drawn stars, rails, debris, bloom strands, grid lines, and core fractures.
- Added main-menu seed entry with blank/default/random/known-label handling, compact onboarding HUD hints, richer build/resource HUD readouts, and run summaries with win/loss detail plus unlock reasons.
- Added five-boss debug spawn shortcuts and a deterministic dense-combat performance pocket behind `?debug=1`.
- Fixed objective target desyncs where secondary item effects or enemy body collisions could clear enemies without advancing target progress.

### Testing

- Added wave director and objective completion tests, including known-seed objective snapshots and boss-gate coverage.
- Added combat tests for special charge/use, bomb mitigation, graze detection, remapped special/bomb controls, and reduced-motion effect rendering.
- Added validation and gameplay tests for ship stat contracts, weapon references, weapon patterns, heat/reload behavior, and starting economy.
- Added deterministic tests for boss phase thresholds, late-boss projectile budgets, final victory routing, and victory save records.
- Added known-seed route outcome tests covering deterministic effects, repair hull patches, shop modifiers, reward modifiers, and next-sector combat pressure.
- Added content validation coverage for item count, faction count, reward-pool placement, archetype representation, faction behavior metadata, and missing hook implementations.
- Added unlock-gating tests for fresh-save pools, unlocked pools, faction filtering, challenge/practice flags, and unlock-trigger summaries.
- Added unit coverage for audio cue settings, combat feedback detection, and deterministic screen-shake decay.
- Added unit coverage for seed entry resolution and run-summary detail helpers, plus E2E coverage for seed entry and keyboard-only start.
- Added regression coverage for empty-field objective progress after item side-effect kills and body-collision clears.
- Added debug-scenario coverage for final boss shortcuts, dense combat budgets, and browser smoke of the debug stress path.
- Added scroll-state tests for known-seed sector length snapshots, fixed-step advancement, speed clamping, zero-dt pause behavior, and exit completion.
- Added background-plan determinism tests and content validation for sector background references and strata metadata.

### Planning

- Concluded Phase 1 in planning docs and added the Phase 2 roadmap/work orders for complete-run depth, player verbs, content expansion, unlock gating, and playtest hardening.
- Concluded Phase 2 in planning docs and added the Phase 3 roadmap/work orders for vertical scrolling, procedural sector backgrounds, distance objectives, scroll-synced encounters, hazards, boss arenas, and scrolling playtest hardening.

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
