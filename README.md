# Starbreak Salvage

**Starbreak Salvage** is a browser-first 2D vertical roguelike shooter about disposable pilots, unstable ship contracts, and profitable wreckage. The project is intentionally static: no backend, no accounts, and no runtime network dependency after the page loads.

This repository is in the early playable scaffold stage. It currently ships a Vite + TypeScript app with a canvas renderer, fixed-step loop, input manager, scene manager, deterministic contract and sector generation, starter item hooks, a combat MVP, route/reward/shop screens, boss/faction alpha content, unit tests, Playwright smoke coverage, CI, and GitHub Pages deployment wiring.

## Local Development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run dev       # start the Vite dev server
npm run build     # typecheck and build dist/
npm run preview   # serve the production build locally
npm run test      # run Vitest unit tests
npm run test:e2e  # run Playwright smoke tests
npm run lint      # run ESLint
npm run format    # format files with Prettier
npm run check     # typecheck, lint, test, and build
```

The Vite base path is configured for GitHub Pages at `/StarbreakSalvage/`.

## Controls

Planned baseline controls:

- Move: Arrow keys or WASD
- Fire: Space
- Special: Shift
- Bomb: X
- Pause: Escape or P
- Confirm: Enter or Space
- Back: Escape or Backspace

The current shell supports the title flow, deterministic contract launch, keyboard movement, primary fire, faction-colored enemy waves, pickups, pause/resume, hull damage, starter item hooks, route choice, rewards, basic shops with rerolls, sector transition, debug boss spawns, run summary stats, and a persistent unlock archive.

The Unlock Archive stores versioned local save data in `localStorage`, including salvage bank, achievements, unlocks, last-run summary, export/import, and reset.

Settings are available from the main menu and pause menu. They persist in `localStorage` and currently cover remappable controls, mute, master volume, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode.

Add `?debug=1` to the local or deployed URL to show the debug overlay with FPS, scene, seed, and entity count.

Add `?seed=LASER-TAX-404` or another seed label to preview deterministic contract and route generation. Blank or missing seeds default to `STARBREAK-SMOKE`.

With `?debug=1`, press `K` during gameplay to force the MVP summary screen. Press `1`, `2`, or `3` to spawn Auditor Drone XL, Carrier of Unsold Missiles, or The Bloom Engine.

Projectile budget notes live in `docs/STARBREAK_SALVAGE_PERFORMANCE_NOTES.md`.

## Project Vision

The target game is quick to start, readable at high intensity, and replayable through deterministic seeds. Runs should begin with randomized ship contracts, move through seeded sectors, and reward expressive item synergies. Permadeath ends the run, while salvage unlocks widen future variety rather than simply increasing raw power.

All code, text, audio, and art should be original or clearly generated for this project. The game should evoke retro sci-fi arcade energy without copying proprietary assets, names, music, sprites, UI, or lore from commercial games.

## Seed References

The core project direction lives in:

- `AGENTS.md`
- `docs/STARBREAK_SALVAGE_AGENT_SEED.md`
- `docs/STARBREAK_SALVAGE_GAME_DESIGN_SEED.md`
- `docs/STARBREAK_SALVAGE_TECHNICAL_ARCHITECTURE.md`
- `docs/STARBREAK_SALVAGE_CONTENT_SEED.json`
