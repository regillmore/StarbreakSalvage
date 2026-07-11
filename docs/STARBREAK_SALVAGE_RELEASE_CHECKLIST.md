# Starbreak Salvage Release Checklist

Release candidate: Phase 10 expedition-depth and shipcraft playtest candidate

Date: 2026-07-11

## Milestone Status

Phases 1-9 are deployed historical foundations. Work orders 091-099 are deployed and confirmed. Work order 100 closes Phase 10 locally with release auditing, repeatable preview-path tooling, refreshed project guidance, explicit manual risks, and the Phase 11 roadmap.

The deployed completionist measurement is approximately 12 minutes with every optional path taken. That doubles the roughly six-minute Phase 9 baseline and reaches the lower edge of Phase 10's 12-20 minute structural target through mission stages, decisions, foundry work, set pieces, factions/rivals, and crew—not global slowdown or durability inflation.

## Automated Release Evidence

| Item                           | Status | Evidence                                                                            |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| TypeScript                     | Pass   | `npm run check`                                                                     |
| ESLint                         | Pass   | `npm run check`                                                                     |
| Unit/deterministic/integration | Pass   | 79 files, 463 tests                                                                 |
| Production build               | Pass   | Vite emits `dist/` under `/StarbreakSalvage/`                                       |
| Playwright Chromium            | Pass   | 12 smoke paths, including narrow/accessibility/performance Scenario Lab coverage    |
| Production preview paths       | Pass   | `npm run test:preview` checks the Pages base plus emitted hashed JavaScript and CSS |
| Combined release command       | Pass   | `npm run verify:release` runs checks, Chromium, and preview smoke                   |

Local Windows note: Playwright requires escalation because Chromium lives under `%LOCALAPPDATA%\ms-playwright` outside the sandbox. CI installs Chromium explicitly.

## Phase 10 Release Audit

| Area                       | Status                | Evidence and boundary                                                                                                                                                                                                                                      |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expedition determinism     | Pass                  | Seed plus effective save state generates stable act/sector/node/branch plans; explicit decision history reproduces visited nodes and major generated outcomes. Gameplay simulation is intentionally not promised as cross-browser lockstep.                |
| Mission-stage safety       | Pass                  | Briefing, entry, combat, optional branch, relief, extraction, pause/resume, failure, abandon, and completion use guarded idempotent transitions with cleanup/checkpoint contracts and focused tests.                                                       |
| Structural run depth       | Pass                  | Live deployed all-option run measures about 12 minutes. Phase 10 hit its target floor; balance and broader content volume are not declared finished.                                                                                                       |
| Modular ship compatibility | Pass                  | Eight frames and 21 modules validate slot, size, uniqueness, tag, power, heat, mass, command, and compatibility constraints through the existing combat adapter.                                                                                           |
| Foundry/evolution ordering | Pass                  | Draft operations are reversible until commit; deterministic component ancestry, recipes, instability, salvage, module/item order, and combined proc caps are tested and debug-visible.                                                                     |
| Set-piece objectives       | Pass                  | Three 7-8-part assemblies use dependency targets, one-shot events/rewards, fixed-world safe lanes, bounded pressure, objective accounting, and finale lock release through shared systems.                                                                 |
| Faction/rival recurrence   | Pass                  | Compact idempotent event history reproduces aid/hostility/territory/rival injury, escape, recurrence, capture, and destruction without frame-time RNG or required-objective blockers.                                                                      |
| Crew/ally behavior         | Pass                  | Up to three allies use bounded enemy/projectile/pickup queries; commands, injury, recovery, disengagement, damage attribution, objective safety, trust, and departure have deterministic coverage.                                                         |
| Save migration             | Pass                  | Version-5 permanent data migration, repair, import/export, and last-run normalization are tested. Run-local engineering/faction/crew/timeline state is deliberately not a suspend snapshot in Phase 10.                                                    |
| Timeline and summaries     | Pass                  | Timeline keeps 96 display entries and 192 processed ids, uses explicit durations, remains local/save-safe, and appears in debug and summaries.                                                                                                             |
| Scenario Lab               | Pass                  | Eight declarative public-model fixtures reach every Phase 10 domain without private app-state mutation or a full run.                                                                                                                                      |
| Accessibility              | Pass with manual gaps | Automated smoke covers keyboard-only flow, 390x700, high contrast, reduced motion, performance mode, pointer controls, remapping precedence, and non-color readouts. Real devices and non-Chromium remain manual.                                          |
| Performance                | Pass with warning     | Combined stress caps and debug counts are explicit. Functional Chromium smoke passes. The 657.78 kB minified main bundle still exceeds Vite's 500 kB warning threshold; sustained frame-time/allocation profiling and code splitting remain Phase 11 work. |
| Browser/Pages load         | Pass locally          | Vite base path and Pages workflow are correct; the repeatable preview smoke verifies base and hashed assets. Public deployment confirmation remains a user/deployment step.                                                                                |

## Manual Browser And Device Matrix

| Target                     | Status                   | Required focus                                                                                                                   |
| -------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Playwright Chromium        | Pass                     | Load, keyboard, pointer, settings, pause, progression, item/enemy/environment stress, Act II, Phase 10 Scenario Lab, narrow view |
| Chrome/Edge desktop manual | Not run for 100          | Full 12-minute run, audio unlock/mute, focus restoration, late-run readability, sustained frame pacing                           |
| Firefox desktop            | Not run                  | Canvas/Web Audio parity, keyboard codes, localStorage import/export, long-run focus and frame pacing                             |
| Safari macOS/iOS           | Not run                  | Web Audio gesture behavior, viewport/safe-area layout, pointer/touch, storage limits, suspend/resume future constraints          |
| Android Chrome real device | Not run                  | Touch control comfort, narrow HUD/debug overflow, thermal/battery behavior, bullet/readability density                           |
| Deployed GitHub Pages      | Pending 100 confirmation | Base path, hashed assets, refresh/deep-link behavior, offline-after-load behavior, console errors                                |

## Known Product Risks

- Balance remains intentionally first-pass across routes, rewards, shops, bosses, engineering, faction outcomes, crew power, and optional-node value.
- Content volume is sufficient to prove structure but not to prevent repetition across many seeds or repeated full runs.
- Art is original shape/procedural placeholder work; animation, environmental identity, portraits, and effects need a future authored pass.
- Audio is original procedural cue feedback, not a full music/adaptive-score or mix implementation.
- Narrative copy proves faction, rival, crew, and mission consequence flow but is not a finished campaign script.
- Ally AI is bounded and objective-safe in automation, but target thrash, visual overlap, perceived usefulness, and command ergonomics still need long manual playtests.
- Modular frames, items, evolved weapons, crew, factions, and set pieces create combinatorial builds that cannot be exhaustively balanced by current automated fixtures.
- Twelve minutes is a successful structural floor, not the final desired voyage length. Phase 11 targets 20-30 minute standard and 30-45 minute completionist capacity with legitimate earlier extraction.
- The main JavaScript bundle is 657.78 kB minified (177.71 kB gzip), and several integration modules are large: `CombatState`, `CanvasRenderer`, `GameApp`, `GameplayScene`, and content validation. These are scaling warnings, not Phase 10 ship blockers.

## Release Commands

```bash
npm run check
npm run test:e2e
npm run test:preview
npm run verify:release
```

## Phase 10 Decision

Phase 10 is complete as a local expedition-depth and shipcraft playtest candidate. No severe release blocker was found in work order 100. Deployment confirmation, non-Chromium/real-device checks, sustained profiling, balance, content volume, art/audio depth, narrative polish, and combinatorial playtesting remain explicit follow-up work rather than hidden completion claims.
