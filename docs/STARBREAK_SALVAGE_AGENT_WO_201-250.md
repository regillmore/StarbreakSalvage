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

## Work order 202 - Launched beam projectile boundary

Goal: keep WO120's directional beam readable while making its luminous body behave like one launched projectile instead of a shape that can be dragged back into view by its scrolling indicator.

Prompt:

> Remove the telegraph trail behind an active beam so only the guide ahead of its leading edge remains. Separate the scrolling pre-fire indicator from the launched beam trajectory, freeze that trajectory at ignition, and keep the physical beam traveling until its tail fully clears the arena. Fix top-edge and other offscreen endpoints re-entering late in the lifecycle. Preserve deterministic direction and offsets, the shared endpoint velocity, the exact two-second fully-lit duration, world anchoring before launch, collision/render parity, allegiance-neutral piercing, pause-safe clocks, accessibility settings, and bounded work.

Acceptance criteria:

- The pre-fire track remains world-anchored and slides along true arena edges as sector scroll advances.
- Ignition records the actual world distance once and derives an immutable projectile trajectory from that launch position; subsequent sector scroll cannot translate or rotate the bolt.
- An active dashed guide is clipped only from the physical head forward. No dashed track, markers, emitter, or endpoint reticle remains behind the head or during tail clearing.
- The physical head flare is drawn only while the true head overlaps the viewport. Arena-clipped crossings use flat boundary cuts instead of manufacturing a stationary round head at an edge.
- The luminous body, collision capsule, and environment damage samples share the same clipped launched segment through entry, two-second full illumination, and complete tail departure.
- Top-origin and other offscreen routes cannot detach an endpoint from the arena edge or scroll a departed endpoint back into view.
- Scroll holds, recovery settlement, boss suppression, reduced motion, performance mode, high contrast, deterministic plans, saves, and static hosting remain compatible.

Status: implemented. `SectorHazardRuntime` now captures one transient launch-world distance when a warning beam enters its active phase. `BeamHazard` continues to translate the pre-fire world track from live scroll, but builds the active projectile from that frozen launch anchor. Its presentation model exposes the clipped bolt, forward-only leading guide, and true visible head/tail points as separate geometry. Collision and world damage continue to request the same clipped bolt segment.

`CanvasRenderer` no longer draws the complete dashed track, source emitter, or tracking marks behind an active bolt. It renders only the remaining guide ahead of the head, removes that guide after the head exits, uses flat active boundary cuts, and paints the flare at the physical head rather than the clipped arena endpoint. The shared 960 unit/second endpoint velocity and exact two-second fully-lit dwell are unchanged.

Focused coverage pins immutable launch geometry across large post-launch world-distance changes, the top-origin endpoint regression, exact bolt/guide joins during entry, absent guide and head during clearing, visible moving tail, runtime launch capture, pause-safe timing, piercing collisions, and the existing timing contract. The managed browser loaded the current build, entered gameplay, and exposed the seeded directional route `LEFT 23% to BOTTOM 41%`; the live lifecycle capture was interrupted when the task-length host expired during a disposable profile reset and the protected network-error tab then blocked re-entry. The host stopped cleanly, and no alternate browser surface was used.

Verification: `npm run verify:release` passes typecheck, ESLint, all 115 Vitest files and 748 tests, the production build, all 18 Playwright Chromium paths, and the Pages-base production-preview asset smoke. The release build emits `1,026.55 kB` minified / `281.72 kB` gzip initial JavaScript and unchanged `104.01 kB` / `20.77 kB` CSS, an increase of `1.08 kB` / `0.37 kB` JavaScript over work order 201. The existing Vite large-chunk advisory remains; no dependency, authored hazard plan, RNG stream, save/snapshot schema, static base path, damage value, velocity, duration, actor/projectile cap, or warning threshold changed.
