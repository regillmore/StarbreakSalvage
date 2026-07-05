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
- Added settings-aware velocity presentation with parallax-scaled background streaks, engine wake, pickup drift trails, impact streaks, subtle frame rails, high-contrast projectile outlines, and wrapped HUD pills.
- Added explicit viewport scaling with desktop/standard/narrow layout classes, a fixed 640x720 gameplay arena, compact narrow HUD bounds, and debug viewport/safe-frame/world metrics.
- Added passive mouse/touch assist for gameplay: pointer guidance maps through the fixed arena, keyboard movement overrides it, and primary pointer press fires through the normal input path.
- Added data-driven contract ship appearance with distinct canvas silhouettes, palettes, engine/cockpit accents, weapon mount hints, HUD theme keys, and a visible hit-radius ring.
- Added New Game contract ship previews with compact card SVGs, a larger selected-contract preview, weapon/role cue primitives, and arrow-key selection updates.
- Added a contract-themed cockpit HUD with appearance-derived frame accents, readable meters for hull/special/bombs/weapon heat, and high-contrast/reduced-motion simplification.
- Hardened Phase 4 accessibility by preserving native keyboard activation for focused buttons, clearing pointer guidance over DOM overlays, and simplifying preview/HUD treatment under reduced motion, performance mode, and high contrast.
- Added ship-specific combat feedback for themed engine wake, damage flash, invulnerability rings, special/bomb readiness, and weapon heat/overheat stress.
- Propagated selected contract theme accents into route, shop, reward, sector-transition, run-summary, and debug context while keeping save data unchanged.
- Added deterministic sector scroll plans, fixed-step distance tracking, HUD distance/speed readouts, debug distance counters, and subtle reduced-motion-aware starfield drift.
- Added deterministic procedural parallax background plans for all five sectors, with original canvas-drawn stars, rails, debris, bloom strands, grid lines, and core fractures.
- Moved normal directed wave spawning onto deterministic scroll-distance marks while retaining time-based fallback schedules and boss-gate timing.
- Added distance-based sector completion so routes open after reaching the exit distance and clearing required wave/boss gates, with distance stats in summaries and save records.
- Added deterministic sector landmarks and sparse distance-tied hazards with readable telegraph/active phases, collision damage, HUD warnings, and low-alpha canvas rendering that stays under bullets.
- Added first-pass boss arena approach, scroll-lock, and post-defeat release states for boss-gated sectors, with arena HUD/debug readouts and immediate debug boss shortcuts preserved.
- Added deterministic route/meta sector conditions so route outcomes, challenge flags, and unlock variants can alter next-sector scroll speed, travel distance, hazard density, landmark signatures, and boss approach length.
- Added main-menu seed entry with blank/default/random/known-label handling, compact onboarding HUD hints, richer build/resource HUD readouts, and run summaries with win/loss detail plus unlock reasons.
- Added five-boss debug spawn shortcuts, granular debug performance counters, a deterministic dense-combat performance pocket, and a quiet long-scroll traversal shortcut behind `?debug=1`.
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
- Added a debug-only sector-complete shortcut so browser smoke can cover route/shop/reward transitions without depending on combat clear timing.
- Added scroll-state tests for known-seed sector length snapshots, fixed-step advancement, speed clamping, zero-dt pause behavior, and exit completion.
- Added background-plan determinism tests and content validation for sector background references and strata metadata.
- Added scroll-synced wave tests for known-seed distance marks, spawn order, time fallback, and frame-stutter duplicate prevention.
- Added distance objective, run-summary distance, and save-record distance tests, plus a longer E2E route timeout for sector travel.
- Added sector feature tests for deterministic landmark/hazard plans, feature validation, hazard phase windows, hazard collision damage, and reduced-motion hazard styling.
- Added boss arena tests for deterministic arena marks, approach/lock/release transitions, boss-spawn gating, scroll-lock behavior, and debug shortcut suppression.
- Added sector condition tests for route-selected scroll/feature/arena changes, challenge and unlock variants, and run-summary physical modifier text.
- Added velocity cue state coverage and a reduced-motion/high-contrast keyboard launch Playwright smoke.
- Added debug count, scroll seek, long-scroll preparation, and granular debug overlay E2E smoke coverage.
- Added viewport layout helper tests, fixed-arena hazard ratio coverage, safe-frame movement clamp coverage, and a narrow-viewport gameplay HUD Playwright smoke.
- Added pointer guidance unit coverage and a mouse movement/fire Playwright smoke path.
- Added ship appearance validation coverage and contract render-state derivation checks.
- Added ship preview model/selection unit coverage and Playwright smoke assertions for preview selection before launch.
- Added HUD theme helper coverage and Playwright smoke assertions for cockpit theme and core meters.
- Added Playwright smoke coverage for keyboard-only start, contract selection, pause, end-run, summary, and return-to-menu flow.
- Added ship combat cue helper coverage for theme-derived colors, damage/invulnerability, heat/overheat, and accessibility/performance intensity reductions.
- Added contract screen theme helper coverage and Playwright assertions for theme propagation through route/shop/reward/transition/summary screens.

### Planning

- Concluded Phase 1 in planning docs and added the Phase 2 roadmap/work orders for complete-run depth, player verbs, content expansion, unlock gating, and playtest hardening.
- Concluded Phase 2 in planning docs and added the Phase 3 roadmap/work orders for vertical scrolling, procedural sector backgrounds, distance objectives, scroll-synced encounters, hazards, boss arenas, and scrolling playtest hardening.
- Concluded Phase 3 in planning docs and added the Phase 4 roadmap/work orders for resolution parity, mouse controls, contract ship identity, ship previews, graphical HUD polish, and display/input release hardening.

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
