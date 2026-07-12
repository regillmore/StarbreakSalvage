# Starbreak Salvage Release Checklist

Release candidate: Phase 11 fleetcraft voyage workspace

Date: 2026-07-11

## Milestone Status

Phases 1-10 and work orders 101-108 are deployed historical foundations. Work order 109 adds three deterministic four-contact apex hunts, persistent wounds/migrations/escape state, five cross-voyage ending verbs, three original bosses, variety unlocks, a thirteenth Scenario Lab fixture, and snapshot v9 persistence while retaining the live multi-operation, frontier, carrier, boarding, front, crew-arc, and fleet contracts.

The deployed completionist measurement is approximately 12 minutes with every optional path taken. That doubles the roughly six-minute Phase 9 baseline and reaches the lower edge of Phase 10's 12-20 minute structural target through mission stages, decisions, foundry work, set pieces, factions/rivals, and crew—not global slowdown or durability inflation.

## Automated Release Evidence

| Item                           | Status | Evidence                                                                            |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| TypeScript                     | Pass   | `npm run check`                                                                     |
| ESLint                         | Pass   | `npm run check`                                                                     |
| Unit/deterministic/integration | Pass   | 88 files, 518 tests                                                                 |
| Production build               | Pass   | Vite emits `dist/` under `/StarbreakSalvage/`                                       |
| Playwright Chromium            | Pass   | 13 smoke paths, including Scenario Lab and keyboard suspend/reload/resume coverage  |
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
| Scenario Lab               | Pass                  | Twelve declarative public-model fixtures reach every Phase 10 domain plus carrier, boarding, fronts, crew arcs, and fleetcraft without private app-state mutation or a full run.                                                                            |
| Accessibility              | Pass with manual gaps | Automated smoke covers keyboard-only flow, 390x700, high contrast, reduced motion, performance mode, pointer controls, remapping precedence, and non-color readouts. Real devices and non-Chromium remain manual.                                          |
| Performance                | Pass with warning     | Combined stress caps and debug counts are explicit. Functional Chromium smoke passes. The 657.78 kB minified main bundle still exceeds Vite's 500 kB warning threshold; sustained frame-time/allocation profiling and code splitting remain Phase 11 work. |
| Browser/Pages load         | Pass locally          | Vite base path and Pages workflow are correct; the repeatable preview smoke verifies base and hashed assets. Public deployment confirmation remains a user/deployment step.                                                                                |

## Phase 11 Foundation Audit

| Area                  | Status            | Evidence and boundary                                                                                                                                                   |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot separation   | Pass              | Permanent progression remains `starbreak.save.v5`; suspended runs use independently repaired `starbreak.run.v9`, and legacy v1-v8 records retire safely.                  |
| Deterministic restore | Pass              | Restore regenerates and validates seed/fingerprint/graph/contract plus mission, engineering, items/economy, faction/rival, crew, and timeline state before scene entry. |
| Safe checkpoint UX    | Pass              | Briefing, operation-entry, and settled-map writes are automatic; main-menu resume/discard works by keyboard and pointer and explains the exact boundary.                 |
| Corruption recovery   | Pass              | Malformed, unsupported, oversized, or identity-drifted snapshots remove only the suspended record. Unit coverage pins permanent-save isolation.                         |
| Endurance boundary    | Pass              | Public harness repeats all thirteen Scenario Lab setups plus the finale through deterministic snapshot round trips and reports bounded apex, fleet, and crew state.                |
| Loading boundary      | Pass with warning | Fleet Bay is a 3.68 kB lazy chunk. Initial JavaScript is 806.07 kB minified/217.60 kB gzip; the existing warning remains active.                                        |
| Executable topology   | Pass              | Graph v2 supplies 70 nodes, 20 decisions, two required and two optional operation roles per sector, with deterministic same-seed replay.                              |
| Operational cleanup   | Pass              | A 64-record idempotent ledger settles checkpoints and payouts once and asserts zero retained actors, projectiles, or hooks at each boundary.                         |
| Consequence carry     | Pass              | Detour support reduces current gate pressure; pursuit outcomes raise the next advance and survive snapshot/decision replay.                                         |
| Operational map       | Pass              | Keyboard/pointer DOM maps expose time, danger, reward, consequence, and faction/crew/ship risk bands without exact rolls.                                           |
| Snapshot v2           | Pass              | Settled map checkpoints restore without replaying payouts; legacy run v1 retires without touching permanent save v5.                                                |

## Manual Browser And Device Matrix

| Target                     | Status                   | Required focus                                                                                                                   |
| -------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Playwright Chromium        | Pass                     | Load, keyboard, pointer, settings, pause, progression, item/enemy/environment stress, Act II, Phase 10 Scenario Lab, narrow view |
| Chrome/Edge desktop manual | Not run for 102          | Full multi-operation run, audio unlock/mute, focus restoration, late-run readability, sustained frame pacing                    |
| Firefox desktop            | Not run                  | Canvas/Web Audio parity, keyboard codes, localStorage import/export, long-run focus and frame pacing                             |
| Safari macOS/iOS           | Not run                  | Web Audio gesture behavior, viewport/safe-area layout, pointer/touch, storage limits, suspend/resume future constraints          |
| Android Chrome real device | Not run                  | Touch control comfort, narrow HUD/debug overflow, thermal/battery behavior, bullet/readability density                           |
| Deployed GitHub Pages      | Pending 102 confirmation | Base path, hashed assets, refresh/deep-link behavior, offline-after-load behavior, console errors                                |

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
- Work order 102 raises the initial bundle baseline to 678.74 kB minified/183.34 kB gzip and CSS to 26.76 kB while retaining the three Scenario Lab chunks. Further splitting remains required rather than complete.
- Work order 103 raises the initial bundle baseline to 704.95 kB minified/189.45 kB gzip with CSS unchanged at 26.76 kB. The 26.21 kB minified increase is measured and the existing split warning remains open.
- Work order 104 raises the initial bundle baseline to 722.66 kB minified/194.63 kB gzip with CSS unchanged at 26.76 kB, while isolating the 3.42 kB command deck as a lazy chunk. The 17.71 kB minified core increase is measured and the existing split warning remains open.
- Snapshot v4 deliberately restores active combat at the safe operation-entry checkpoint; settled operational maps, frontier decisions, and carrier command-deck state restore exactly, but live bullets, actor positions, partially damaged targets, audio, and renderer state are not serialized. Pre-carrier v1-v3 snapshots retire safely.
- The 28.15-minute standard and 36.65-minute all-optional figures are structural graph projections, not deployed stopwatch results. Full-run fatigue, economy, difficulty, and actual timing need post-deployment playtests.
- Browser storage eviction/quota, multi-tab last-writer behavior, and long real-device restore latency remain manual risks. Snapshot size is capped at 512 KiB and current automated fixtures remain below it.

## Release Commands

```bash
npm run check
npm run test:e2e
npm run test:preview
npm run verify:release
```

## Phase 10 Decision

Phase 10 is complete as a local expedition-depth and shipcraft playtest candidate. No severe release blocker was found in work order 100. Deployment confirmation, non-Chromium/real-device checks, sustained profiling, balance, content volume, art/audio depth, narrative polish, and combinatorial playtesting remain explicit follow-up work rather than hidden completion claims.
