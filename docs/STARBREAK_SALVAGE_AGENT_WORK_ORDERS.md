# Starbreak Salvage — Agent Work Orders

Use these prompts directly with Codex-style agents. Each task assumes the agent will inspect the repo first, make focused changes, run checks, and summarize results.

## Common instruction prefix

Use this prefix for every agent task:

> Read `AGENTS.md` first. Then read any relevant docs under `docs/`. Keep the task focused. Do not rewrite unrelated code. Preserve deterministic seed behavior. Run relevant tests and report exact commands/results. If a required tool is unavailable, state that and run the remaining checks.

## Work order 001 — Greenfield scaffold

Goal: create the project foundation.

Prompt:

> Read `AGENTS.md` and the seed docs. The repository is greenfield. Create a Vite + TypeScript browser game scaffold for Starbreak Salvage. Add package scripts for `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `format`, and `check`. Add a canvas placeholder page with a title, start button, and static starfield-style background. Add README with local dev commands, controls, and project vision. Add `.github/workflows/ci.yml` to run checks and `.github/workflows/pages.yml` to deploy `dist` to GitHub Pages. Configure the Vite base path for `/StarbreakSalvage/`. Run checks and summarize.

Acceptance criteria:

- `npm run build` succeeds.
- `npm run check` exists.
- Placeholder page loads locally.
- Workflows exist.

## Work order 002 — Loop/input/scenes

Goal: create an interactive shell.

Prompt:

> Implement a fixed-step game loop, canvas renderer, input manager, and scene manager. Add MainMenu, ContractSelect placeholder, Gameplay placeholder, Pause, and RunSummary scenes. Implement keyboard movement in gameplay with a visible player ship constrained to screen bounds. Add debug overlay for FPS, seed, and entity count behind a flag. Add narrow tests for pure loop/input helpers. Run checks.

Acceptance criteria:

- Start run transitions to gameplay.
- Player moves with WASD/arrows.
- Pause opens and closes.
- No console errors.

## Work order 003 — RNG and run skeleton

Goal: deterministic generation.

Prompt:

> Implement seed string parsing, forkable RNG streams, deterministic `choice`, `shuffle`, and `weightedChoice`, plus a run generator that creates three contract choices and a five-sector route skeleton. Add seed labels `LASER-TAX-404`, `ORBITAL-JUNK-PROPHET`, `VOID-CORSAIR-7`, and `STARBREAK-SMOKE` to deterministic tests. Prohibit `Math.random()` in generation. Run checks.

Acceptance criteria:

- Identical seed produces identical run skeleton.
- Different seed varies.
- Tests cover RNG helpers and run generation.

## Work order 004 — Combat MVP

Goal: first fun loop.

Prompt:

> Implement player primary fire, projectile lifecycle, simple enemies, enemy waves, collision, health/damage/death, pickups, and a forced game-over path to RunSummary. Use original shape-based placeholder visuals. Add tests for collision and damage. Keep entity count visible in debug. Run checks.

Acceptance criteria:

- Player can shoot enemies.
- Enemies can damage/kill player.
- Pickups can be collected.
- Summary appears after death.

## Work order 005 — Item hook pipeline

Goal: synergies.

Prompt:

> Implement item definitions with tags, acquisition order, deterministic hook processing, and reward choice generation. Add at least 12 starter items and these synergies: split+arc, missile+overkill, shield+revenge, drone+copy. Add content validation tests for duplicate IDs, invalid tags, invalid item references, and empty reward pools. Run checks.

Acceptance criteria:

- Items visibly alter gameplay.
- Hook order is deterministic.
- Content validation fails on bad fixtures.

## Work order 006 — Sector/reward/shop loop

Goal: roguelike routing.

Prompt:

> Add sector progression, route cards, reward screen, credits, basic shop, rerolls, and sector transition UI. Ensure route cards, rewards, and shop inventory are generated from the run seed. Add deterministic tests for known seeds. Run checks.

Acceptance criteria:

- Completing a wave/sector opens a route or reward choice.
- Shops accept credits and alter build.
- Same seed yields same route/reward/shop sequence.

## Work order 007 — Boss/faction alpha

Goal: enemy variety.

Prompt:

> Add three factions and three bosses with distinct attack patterns and clear telegraphs. Build faction/boss content tables and deterministic sector selection. Add debug shortcuts for directly testing a boss. Add performance notes for projectile counts. Run checks.

Acceptance criteria:

- Three factions are visually and behaviorally distinct.
- Three bosses can be spawned and defeated.
- Boss warnings are readable.

## Work order 008 — Save/unlock progression

Goal: meta loop.

Prompt:

> Implement versioned localStorage save data, unlock definitions, achievements, run summary stats, save reset, export, import, and migration tests. Corrupted saves should fail safely. Add first 10 unlocks from the design docs. Run checks.

Acceptance criteria:

- Unlocks persist across reloads.
- Save import/export works.
- Migration tests pass.

## Work order 009 — Settings/accessibility

Goal: playable by more people.

Prompt:

> Add settings for remappable controls, volume/mute, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode. Ensure settings persist. Add Playwright smoke coverage for opening settings and changing at least one option. Run checks.

Acceptance criteria:

- Settings can be changed from menu/pause.
- Mute and reduced motion work.
- Settings persist after reload.

## Work order 010 — Release hardening

Goal: public-ready v1.

Prompt:

> Audit build, tests, content validation, browser load, asset paths, README, license, credits, changelog, Pages workflow, save behavior, and seed sharing. Fix blockers only. Produce a release checklist with pass/fail status and known issues. Run all checks.

Acceptance criteria:

- Public deployment is playable.
- No severe known blockers.
- Release checklist is complete.

## Review subagent prompt

Use after a feature PR:

> Spawn subagents to review this branch versus main. Use one subagent each for: bugs, deterministic seed integrity, performance/readability, accessibility, and code maintainability. Wait for all results, then summarize required fixes versus optional improvements.
