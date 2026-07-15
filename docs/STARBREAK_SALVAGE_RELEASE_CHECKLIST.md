# Starbreak Salvage Release Checklist

Release candidate: Phase 11 resumable deep-voyage playtest

Date: 2026-07-14

## Milestone Status

Phases 1-10 and work orders 101-109 are deployed historical foundations. Work order 110 closes Phase 11 after auditing the complete resumable voyage and adding dedicated carrier-command, frontier-ending, snapshot-recovery, and structural-duration evidence through sixteen public Scenario Lab fixtures.

Work order 139 refits the live Phase 11 itinerary so each constellation node owns one complete required sector operation and one paired optional challenge. Legacy advance/staging ids remain recoverable for deployed v11 snapshots, but no longer inflate fresh stage counts or insert a second required combat behind one sector node.

Work order 140 settles each required-operation reward before the flat optional/route board. Optional challenges and route events no longer create a late duplicate reward stop; incoming route and prior optional outcomes deterministically shape the next sector's reward without changing snapshot v11.

The deployed completionist measurement is approximately 12 minutes with every optional path taken. That doubles the roughly six-minute Phase 9 baseline and reaches the lower edge of Phase 10's 12-20 minute structural target through mission stages, decisions, foundry work, set pieces, factions/rivals, and crew—not global slowdown or durability inflation.

## Automated Release Evidence

| Item                           | Status | Evidence                                                                            |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| TypeScript                     | Pass   | `npm run check`                                                                     |
| ESLint                         | Pass   | `npm run check`                                                                     |
| Unit/deterministic/integration | Pass   | 98 files, 604 tests                                                                 |
| Production build               | Pass   | Vite emits `dist/` under `/StarbreakSalvage/`                                       |
| Playwright Chromium            | Pass   | 13 smoke paths, including Scenario Lab and keyboard suspend/reload/resume coverage  |
| Production preview paths       | Pass   | `npm run test:preview` checks the Pages base plus emitted hashed JavaScript and CSS |
| Combined release command       | Pass   | `npm run verify:release` runs checks, Chromium, and preview smoke                   |

Local Windows note: Playwright requires escalation because Chromium lives under `%LOCALAPPDATA%\ms-playwright` outside the sandbox. CI installs Chromium explicitly.

## Phase 10 Release Audit

| Area                       | Status                | Evidence and boundary                                                                                                                                                                                                                                                |
| -------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expedition determinism     | Pass                  | Seed plus effective save state generates stable act/sector/node/branch plans; explicit decision history reproduces visited nodes and major generated outcomes. Gameplay simulation is intentionally not promised as cross-browser lockstep.                          |
| Mission-stage safety       | Pass                  | Briefing, entry, combat, optional branch, relief, extraction, pause/resume, failure, abandon, and completion use guarded idempotent transitions with cleanup/checkpoint contracts and focused tests.                                                                 |
| Structural run depth       | Pass                  | Live deployed all-option run measures about 12 minutes. Phase 10 hit its target floor; balance and broader content volume are not declared finished.                                                                                                                 |
| Modular ship compatibility | Pass                  | Eight frames and 21 modules validate slot, size, uniqueness, tag, power, heat, mass, command, and compatibility constraints through the existing combat adapter.                                                                                                     |
| Foundry/evolution ordering | Pass                  | Draft operations are reversible until commit; deterministic component ancestry, recipes, instability, salvage, module/item order, and combined proc caps are tested and debug-visible.                                                                               |
| Set-piece objectives       | Pass                  | Three 7-8-part assemblies use dependency targets, one-shot events/rewards, fixed-world safe lanes, bounded pressure, objective accounting, and finale lock release through shared systems.                                                                           |
| Faction/rival recurrence   | Pass                  | Compact idempotent event history reproduces aid/hostility/territory/rival injury, escape, recurrence, capture, and destruction without frame-time RNG or required-objective blockers.                                                                                |
| Crew/ally behavior         | Pass                  | Up to three allies use bounded enemy/projectile/pickup queries; commands, injury, recovery, disengagement, damage attribution, objective safety, trust, and departure have deterministic coverage.                                                                   |
| Save migration             | Pass                  | Version-5 permanent data migration, repair, import/export, and last-run normalization are tested. Run-local engineering/faction/crew/timeline state is deliberately not a suspend snapshot in Phase 10.                                                              |
| Timeline and summaries     | Pass                  | Timeline keeps 96 display entries and 192 processed ids, uses explicit durations, remains local/save-safe, and appears in debug and summaries.                                                                                                                       |
| Scenario Lab               | Pass                  | Sixteen declarative public-model fixtures reach every Phase 11 domain, including snapshot recovery, carrier staging, frontier endings, and apex dispositions, without private app-state mutation or a full run.                                                      |
| Accessibility              | Pass with manual gaps | Automated smoke covers keyboard-only flow, 390x700, high contrast, reduced motion, performance mode, pointer controls, remapping precedence, and non-color readouts. Real devices and non-Chromium remain manual.                                                    |
| Performance                | Pass with warning     | Combined stress caps and debug counts are explicit. Functional Chromium smoke passes. The 917.26 kB minified main bundle still exceeds Vite's 500 kB warning threshold; sustained frame-time/allocation profiling and further code splitting remain next-phase work. |
| Browser/Pages load         | Pass locally          | Vite base path and Pages workflow are correct; the repeatable preview smoke verifies base and hashed assets. Public deployment confirmation remains a user/deployment step.                                                                                          |

## Phase 11 Foundation Audit

| Area                  | Status            | Evidence and boundary                                                                                                                                                   |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot separation   | Pass              | Permanent progression remains `starbreak.save.v5`; suspended runs use independently repaired `starbreak.run.v11`, and legacy v1-v10 records retire safely.             |
| Deterministic restore | Pass              | Restore regenerates and validates seed/fingerprint/graph/contract plus mission, engineering, items/economy, faction/rival, crew, and timeline state before scene entry. |
| Safe checkpoint UX    | Pass              | Briefing, operation-entry, and settled post-sector/route writes are automatic; main-menu resume/discard works by keyboard and pointer and explains the boundary.        |
| Corruption recovery   | Pass              | Malformed, unsupported, oversized, or identity-drifted snapshots remove only the suspended record. Unit coverage pins permanent-save isolation.                         |
| Endurance boundary    | Pass              | Public harness repeats all sixteen Scenario Lab setups plus the finale through deterministic snapshot round trips and separately restores both frontier decisions.      |
| Loading boundary      | Pass with warning | Initial JavaScript is 917.26 kB minified/249.87 kB gzip; low-frequency audit and service scenes remain lazy and the existing warning remains active.                   |
| Executable topology   | Pass              | The 15-sector graph retains 105 stable compatibility nodes and 30 decisions; fresh schedules execute one full required gate plus at most one paired pursuit per sector. |
| Operational cleanup   | Pass              | A 64-record idempotent ledger settles checkpoints and payouts once and asserts zero retained actors, projectiles, or hooks at each boundary.                            |
| Consequence carry     | Pass              | Compatibility detour support still reduces its gate; paired pursuit outcomes now raise the next real sector operation and survive snapshot/decision replay.            |
| Operational map       | Compatibility     | Its reducer/read model and v11 restore target remain valid, while fresh decisions live in the constellation and no longer render the separate map scene.                |
| Snapshot v11          | Pass              | Operation and settled constellation checkpoints restore without replaying payouts; legacy run v1-v10 retire without touching permanent save v5.                       |

## Phase 11 Closeout Audit

| Area                   | Status                | Evidence and boundary                                                                                                                                                                                                                                                        |
| ---------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot/save recovery | Pass                  | Snapshot v11 regenerates and validates the complete run-local plan/state, retires v1-v10 independently, and leaves permanent save v5 migration/import/export intact.                                                                                                        |
| Resume to ending       | Pass                  | Chromium suspends and reloads the single required sector operation, restores the post-sector plot, uses the public debug frontier handoff, reaches Core Extraction victory, and confirms snapshot cleanup. This is automated boundary smoke, not a real-time full voyage. |
| Campaign systems       | Pass                  | Carrier, boarding, faction fronts, crew arcs, fleetcraft, apex hunts, summaries, timelines, and divergent outcomes have deterministic reducer/read-model tests and public Scenario Lab access. Disposable lab endings are explicitly blocked from permanent save writes.     |
| Structural duration    | Pass with manual gap  | Executable-node projection reports 16.82m standard, 11.08m Act II extraction, and 21.07m completionist. The latest valid stopwatch remains the deployed approximately 12m Phase 10 completionist run; a new full-voyage measurement is required.                     |
| Accessibility          | Pass with manual gaps | Sixteen-card keyboard/pointer Scenario Lab passes at 390x700 under high contrast, reduced motion, and performance mode. Non-Chromium and real-device testing remain manual.                                                                                                  |
| Performance            | Pass with warning     | Shared combat/query/projectile/effect/history caps remain intact and debug-visible. Functional Chromium smoke passes; sustained allocation/frame-time profiling and the 500 kB chunk warning remain open.                                                                    |
| Browser/Pages paths    | Pass locally          | All 13 Chromium paths pass and production preview returns 200 for the Pages base plus initial and every lazy hashed asset. Deployment confirmation remains external.                                                                                                         |

## Manual Browser And Device Matrix

| Target                     | Status                   | Required focus                                                                                                                                     |
| -------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playwright Chromium        | Pass                     | Load, keyboard, pointer, settings, pause, progression, item/enemy/environment stress, all Phase 11 release fixtures, resume-to-ending, narrow view |
| Chrome/Edge desktop manual | Not run for 110          | Full Phase 11 voyage, audio unlock/mute, focus restoration, late-run readability, fatigue, sustained frame pacing                                  |
| Firefox desktop            | Not run                  | Canvas/Web Audio parity, keyboard codes, localStorage import/export, long-run focus and frame pacing                                               |
| Safari macOS/iOS           | Not run                  | Web Audio gesture behavior, viewport/safe-area layout, pointer/touch, storage limits, suspend/resume future constraints                            |
| Android Chrome real device | Not run                  | Touch control comfort, narrow HUD/debug overflow, thermal/battery behavior, bullet/readability density                                             |
| Deployed GitHub Pages      | Pending 110 confirmation | Base path, hashed assets, refresh/deep-link behavior, offline-after-load behavior, console errors                                                  |

## Known Product Risks

- Balance remains intentionally first-pass across routes, rewards, shops, bosses, engineering, faction outcomes, crew power, and optional-node value.
- Content volume is sufficient to prove structure but not to prevent repetition across many seeds or repeated full runs.
- Art is original shape/procedural placeholder work; animation, environmental identity, portraits, and effects need a future authored pass.
- Audio is original procedural cue feedback, not a full music/adaptive-score or mix implementation.
- Narrative copy proves faction, rival, crew, and mission consequence flow but is not a finished campaign script.
- Ally AI is bounded and objective-safe in automation, but target thrash, visual overlap, perceived usefulness, and command ergonomics still need long manual playtests.
- Modular frames, items, evolved weapons, crew, factions, and set pieces create combinatorial builds that cannot be exhaustively balanced by current automated fixtures.
- Twelve minutes is the last deployed real stopwatch measurement from Phase 10. Work order 139's executable-node audit now projects 11.08 minutes at Act II extraction, 16.82 minutes standard, and 21.07 minutes completionist; those figures describe authored capacity, not active play or fatigue. Full-voyage timing still needs a fresh manual measurement.
- The current main JavaScript bundle is 917.26 kB minified (249.87 kB gzip) after work order 140 moves reward settlement ahead of the flat constellation. CSS is 64.46 kB minified/13.28 kB gzip. Several integration modules remain large: `CombatState`, `CanvasRenderer`, `GameApp`, `GameplayScene`, and content validation. These are next-phase scaling warnings, not hidden release exceptions.
- Work order 102 raises the initial bundle baseline to 678.74 kB minified/183.34 kB gzip and CSS to 26.76 kB while retaining the three Scenario Lab chunks. Further splitting remains required rather than complete.
- Work order 103 raises the initial bundle baseline to 704.95 kB minified/189.45 kB gzip with CSS unchanged at 26.76 kB. The 26.21 kB minified increase is measured and the existing split warning remains open.
- Work order 104 raises the initial bundle baseline to 722.66 kB minified/194.63 kB gzip with CSS unchanged at 26.76 kB, while isolating the 3.42 kB command deck as a lazy chunk. The 17.71 kB minified core increase is measured and the existing split warning remains open.
- Snapshot v11 deliberately restores active combat at the safe operation-entry checkpoint; settled constellation plots, frontier decisions, carrier, boarding, front, crew, fleet, and apex state restore exactly, but live bullets, actor positions, partially damaged targets, audio, and renderer state are not serialized. Legacy v1-v10 snapshots retire safely.
- Duration audits now derive ingress, gate, extraction, and paired-pursuit nodes only. The resulting 11.08/16.82/21.07-minute projections must still not be used as deployed stopwatch expectations.
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

## Phase 11 Decision

Phase 11 is complete as the first resumable deep-voyage release candidate. No severe blocker was found in work order 110, and automated evidence now spans every Phase 11 system plus recovery-to-ending smoke. Deployment confirmation, real fresh/progressed full-voyage stopwatch and fatigue tests, non-Chromium/real-device checks, sustained profiling, balance, repeated-run content volume, art/audio depth, narrative polish, ally/fleet feel, and combinatorial playtesting remain explicit future work.
