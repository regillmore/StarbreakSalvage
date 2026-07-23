# Starbreak Salvage - Agent Work Orders 201-250

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repository first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Work order 201 - Cadence-cycle base DPS

Goal: give Hardpoint Control one trustworthy damage-throughput number derived from the current weapon and ordered circuit instead of asking players to mentally combine volley size, impact, cadence, and periodic procs.

Prompt:

> Add a Base DPS result to the Attack Simulation block. Measure direct projectile body damage across the fitted circuit's shortest complete periodic cadence cycle at the current weapon's baseline fire rate. Include real weapon, engineering, drone, ordered item, projectile-spawn, heat-shot, and periodic-volley output, while excluding target-dependent follow-up damage such as arc jumps, phase pierce, ricochets, explosions, temporary haste, and specials. Make the measurement boundary visible and keep the preview actor budget unchanged.

Acceptance criteria:

- Attack Simulation displays Base DPS as a sixth comparable stat with one decimal place and a draft-versus-committed delta.
- The value sums production projectile damage after engineering, ordered `onFire`, Micro-Choir, and `onProjectileSpawn` transforms, then divides the complete sample by its baseline firing time.
- The sample length is the least common multiple of every fitted periodic stage's effective cadence, including Prototype Vent shifts, with a documented hard cap.
- A non-periodic loadout uses one representative volley; mixed periodic circuits use their complete shared cycle and recompute when circuit order changes.
- Arc discharge, phase follow-up contacts, ricochet, area explosions, target geometry, specials, and temporary haste are not assumed to land and remain outside Base DPS.
- The explanatory note states the measured volley count, direct-projectile boundary, and excluded hit procs without relying on color.
- Damage sampling remains independent from the six-wave/48-projectile visual actor budget.
- Weapon swaps and circuit edits redraw the result immediately; the ordinary and periodic responsive Chromium paths remain free of horizontal overflow.
- No combat rule, save/snapshot field, generation stream, dependency, or static-hosting behavior changes.

Status: implemented. `FoundryPresentation` now derives an exact periodic cadence cycle from the fitted circuit, bounded at 420 volleys, and runs the existing production preview reducers across that damage sample. The visual preview consumes only its established first six waves and remains capped at 48 DOM projectiles. Base DPS counts direct projectile damage at the weapon's baseline cadence; the preview's existing arc, phase, missile, laser, drone, and heat descriptions continue to explain conditional identities separately.

`FoundryScene` adds Base DPS to the attack-stat comparison strip and places a concise non-color measurement note below it. Draft weapon swaps and circuit reorder redraws use the same authoritative dashboard model, so both value and committed delta update without a second state path.

Focused coverage verifies one-volley arithmetic, exclusion of stored arc discharge, five-versus-four-volley Prototype Vent ordering, a mixed 20-volley shared cycle, value changes after reordering, the unchanged 48-projectile visual cap, and responsive DOM semantics. Managed-browser inspection at 1280 x 720 showed six equal 110.8 px stat cards with no horizontal overflow. The Scenario Lab weapon swap changed Base DPS from 5.8 to 8.3 and exposed a +2.54 committed delta while retaining the five-volley measurement note. The authenticated smoke host and browser tab closed cleanly.

Verification: focused Foundry presentation coverage passes 26 tests and both affected Chromium paths pass. `npm run verify:release` passes typecheck, ESLint, all 115 Vitest files and 747 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,025.47 kB` minified / `281.35 kB` gzip initial JavaScript and `104.01 kB` / `20.77 kB` CSS, increases of `0.94 kB` / `0.40 kB` JavaScript and `0.43 kB` / `0.07 kB` CSS over work order 200. The existing Vite large-chunk advisory remains; no dependency, combat rule, save/snapshot schema, generation stream, static base path, actor/projectile cap, or warning threshold changed.
