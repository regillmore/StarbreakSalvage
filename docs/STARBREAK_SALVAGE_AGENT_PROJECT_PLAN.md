# Starbreak Salvage — Project Plan

## Current project assumption

`regillmore/StarbreakSalvage` is treated as a greenfield public GitHub repository. This plan assumes no existing code should be preserved unless later local files contradict that assumption.

## Product outcome

Ship a complete, static, browser-playable vertical roguelike shooter on GitHub Pages with:

- randomized starting ship/class contracts;
- seeded runs;
- permadeath;
- permanent unlocks;
- item synergies;
- original retro sci-fi presentation;
- local save data;
- no backend.

## Success criteria

The project is successful when a player can open the GitHub Pages URL, start a seeded run, choose from randomized contracts, complete multiple sectors, collect synergistic items, die or win, see a run summary, unlock new content, and replay or share the seed.

## Milestones

### M0 — Seed and scaffold

Scope:

- Commit `AGENTS.md` and docs.
- Initialize Vite + TypeScript.
- Add scripts: dev, build, preview, test, test:e2e, lint, format, check.
- Add CI and GitHub Pages workflows.
- Render a placeholder page.
- Add README.

Exit criteria:

- `npm run check` passes.
- `npm run build` creates `dist`.
- Pages deployment workflow exists.

### M1 — Game shell

Scope:

- Fixed-step loop.
- Canvas renderer.
- Input manager.
- Scene manager.
- Main menu, gameplay placeholder, pause, run summary.
- Player movement.
- Debug overlay.

Exit criteria:

- Player movement is smooth.
- Pause works.
- E2E can start a run.

### M2 — Combat MVP

Scope:

- Primary fire.
- Enemy spawner.
- Projectiles.
- Collision.
- Health/damage/death.
- Pickups.
- One boss.
- Placeholder VFX/SFX.

Exit criteria:

- Player can kill enemies and die.
- One boss can be defeated.
- No major frame drops in normal combat.

### M3 — Roguelike loop

Scope:

- Seeded run generator.
- Contract selection.
- Reward choices.
- Route cards.
- Shops.
- 15–20 items.
- Item hooks/tags.
- Sector transition.
- Local save skeleton.

Exit criteria:

- Same seed produces same contracts/routes/rewards.
- At least four meaningful synergies exist.
- Unlock persists after run.

### M4 — Content alpha

Scope:

- 5–8 contracts.
- 35–50 items.
- 4 factions.
- 5 sectors.
- 5 bosses.
- 10+ unlocks.
- Balance pass.

Exit criteria:

- At least three viable build archetypes.
- Content validation covers all tables.
- Several complete runs are possible.

### M5 — UX/polish/accessibility

Scope:

- Settings.
- Remappable controls.
- Reduced motion.
- Bullet contrast.
- Save import/export.
- Tutorial hints.
- Better title/run summary.
- Original audio/VFX pass.

Exit criteria:

- New player can understand the game without reading source docs.
- Mute and reduced motion work.
- Settings persist.

### M6 — Release candidate

Scope:

- Browser smoke matrix.
- Optimize assets.
- Finalize README/license/credits.
- Changelog/version.
- Release checklist.
- Public Pages deployment.

Exit criteria:

- No severe known blockers.
- Production URL playable.
- Reproducible build.

## Dependency map

```text
M0 scaffold
  -> M1 loop/input/scenes
    -> M2 combat
      -> M3 roguelike systems
        -> M4 content alpha
          -> M5 polish/accessibility
            -> M6 release
```

Parallelizable:

- Content schema + engine loop after M0.
- UI shell + combat once scene interfaces are stable.
- CI/Pages immediately in M0.
- QA smoke tests alongside features.

High-conflict areas:

- `RunState` and run generation.
- Item hook ordering.
- World/entity model.
- Scene manager.

## First five PRs

1. **PR 001 — Seed docs and scaffold**  
   Adds AGENTS/docs, Vite/TS, scripts, placeholder canvas, CI, Pages workflow.

2. **PR 002 — Loop, input, scenes**  
   Adds fixed timestep, renderer, input manager, main menu/gameplay/pause/summary scenes.

3. **PR 003 — Deterministic RNG and run skeleton**  
   Adds seed parser, forkable RNG, deterministic contracts and sector route skeleton.

4. **PR 004 — Combat prototype**  
   Adds player fire, enemies, projectiles, collision, death, pickups.

5. **PR 005 — Items and first synergies**  
   Adds item definitions, hook pipeline, reward selection, 12 starter items, validation tests.

## Definition of Done

Each task is done when:

- Code builds.
- Relevant tests pass.
- New deterministic behavior has tests.
- New content passes validation.
- The game loads without console errors.
- The implementation is documented when player-facing behavior changes.
- PR summary includes changed files, behavior, tests, and known risks.
