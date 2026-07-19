# AGENTS.md — Starbreak Salvage

## Mission

Build **Starbreak Salvage**, a single-player browser-based 2D vertical scrolling roguelike shooter for GitHub Pages. The game should evoke original DOS-era sci-fi arcade energy while using only original code, text, audio, and art. No copied Tyrian assets, names, music, characters, UI, sprites, or proprietary data.

The target experience: quick runs, crisp movement, readable bullet chaos, randomized starting ship contracts, seeded sectors, item synergies, permadeath, and permanent unlocks that expand variety rather than simply increasing raw power.

## Product pillars

1. **Instant browser play** — no backend, no accounts, no network requirement after page load.
2. **Readable arcade intensity** — 60 FPS target, clear enemy bullets, responsive controls, generous hit feedback.
3. **Build-crafting chaos** — item tags and event hooks combine into surprising but explainable synergies.
4. **Seeded replayability** — same seed gives the same starting choices, sector route, shops, bosses, rewards, and major wave schedule.
5. **Permadeath plus permanent variety** — death ends the run; salvage unlocks new ships, items, variants, factions, music, and challenge modes.
6. **Small, maintainable codebase** — TypeScript, data-driven content, tests for deterministic systems, minimal dependencies.

## Recommended stack

- TypeScript + Vite for a static GitHub Pages build.
- Canvas 2D for the main game renderer.
- Web Audio API or tiny generated audio layer for effects/music, with a mute option.
- DOM overlays for menus, settings, seed entry, pause, run summary, and accessibility where practical.
- Vitest for unit and deterministic content tests.
- Playwright for smoke/E2E tests covering load, start run, basic controls, pause, and seeded run screen.

## Repository commands

Use these repository scripts:

```bash
npm run dev       # start local Vite dev server
npm run build     # production build into dist/
npm run preview   # locally serve dist/
npm run test      # Vitest unit/integration tests
npm run test:e2e  # Playwright smoke tests
npm run test:preview # serve dist and verify Pages base/hashed assets
npm run smoke:host # start/reuse a managed LAN-visible Vite instance for interactive browser smoke
npm run smoke:status # print the authoritative current browser URL and host ownership state
npm run smoke:stop # stop the authenticated project-owned smoke instance
npm run lint      # ESLint
npm run format    # Prettier write
npm run check     # typecheck + lint + test + build
npm run verify:release # check + Playwright + production preview smoke
```

After modifying code, run the narrowest relevant tests first, then `npm run check` before declaring the task complete. Release closeouts should run `npm run verify:release`. If Playwright browsers are not installed in a local environment, say so and run every other check.

Local Codex note: `npm run test:e2e` will need escalation on Windows because Playwright launches Chromium from `%LOCALAPPDATA%\ms-playwright`, which the sandbox cannot read by default. E2E will report a missing `chromium_headless_shell` executable even after install, so run the E2E command with escalation for AppData visibility.

For in-app browser inspection, run `npm run smoke:host` and use the exact `Browser URL` it prints.
Do not reuse a LAN address from an earlier task or infer one from `localhost`; `npm run smoke:status`
re-resolves the active adapter and `npm run --silent smoke:status -- --json` exposes the same URL as
machine-readable `browserUrl`. Keep the long-running start cell while inspecting; the start command
is idempotent from another shell. Give that managed shell a task-length command timeout rather than
the default short diagnostic timeout. Always run `npm run smoke:stop` after the browser pass,
including after a failed inspection, then collect the successfully completed start cell.

## Code style and architecture rules

- Prefer clear TypeScript types over clever abstractions.
- Keep gameplay content data-driven: items, ships, waves, factions, bosses, shops, and unlocks should live in content tables or small content modules.
- Keep engine systems deterministic where feasible. Pass an explicit RNG object into generation logic; never call `Math.random()` in run generation or gameplay systems.
- Avoid global mutable state except inside a top-level `GameApp`/store object.
- Avoid new production dependencies unless the task strongly benefits from them. Document the reason in the PR summary.
- Do not introduce server-side code, telemetry, external API calls, tracking pixels, ads, or analytics.
- Prefer fixed-step simulation for gameplay logic. Rendering may interpolate, but simulation must remain stable under frame drops.
- Separate systems: input, simulation, collision, rendering, audio, UI, save, content validation, and generation.
- Prefer small modules with explicit exports. Avoid barrel files if they obscure dependency direction.
- Name files and symbols for behavior, not implementation fashion.
- Prefer extracting domain reducers, plans, read models, and debug fixtures from `GameApp`, `GameplayScene`, `CombatState`, `CanvasRenderer`, and `contentValidation` before adding another phase-sized responsibility to those large integration modules.

## Determinism contract

Seeded runs must reproduce:

- starting contract choices,
- sector list and route options,
- elite/shop/vault/repair encounters,
- boss variants,
- reward pools and shop inventories,
- major wave schedule,
- relic/item selection order.

Do **not** promise bit-perfect bullet simulation across every browser. The product goal is deterministic content generation and consistent gameplay feel, not multiplayer lockstep.

## Agent workflow

1. Read this file and the relevant docs in `docs/` before editing.
2. Summarize your understanding of the task and identify affected modules.
3. Make focused changes only. Do not opportunistically rewrite unrelated code.
4. Add or update tests for deterministic logic, content schemas, save migration, and core mechanics.
5. Run relevant checks.
6. Report: changed files, behavior added, tests run, screenshots/GIF notes if visual, and follow-up risks.

## Pull request expectations

A good PR includes:

- a tight scope;
- a player-visible summary;
- technical notes;
- test commands and results;
- known limitations;
- follow-up issue suggestions only when useful.

## Safety, licensing, and originality

- Do not copy assets from commercial games.
- Placeholder art/audio must be clearly marked and generated/original.
- Avoid trademarked names in in-game content.
- Keep licenses compatible with an open GitHub Pages project.
- Respect accessibility: keyboard support, remapping, pause, reduced motion/screen shake, color contrast options, and audio mute.

## Definition of Done

A task is done when:

- the game still builds and loads;
- core tests pass;
- new deterministic behavior has tests;
- user-facing behavior is documented when relevant;
- no console errors appear during a basic run;
- the implementation matches the product pillars above.
