# Starbreak Salvage

**Starbreak Salvage** is a browser-first 2D vertical roguelike shooter about disposable pilots, unstable ship contracts, and profitable wreckage. The project is intentionally static: no backend, no accounts, and no runtime network dependency after the page loads.

This repository is in the early playable release-candidate stage. It currently ships a Vite + TypeScript app with a canvas renderer, fixed-step loop, input manager, scene manager, deterministic contract and sector generation, deterministic sector scroll plans, procedural parallax sector backgrounds, scroll-synced directed waves, distance-based sector objectives, deterministic sector landmarks and hazards, first-pass boss arenas with scroll locks, route-conditioned sector modifiers, expanded item hooks, a combat MVP, route/reward/shop screens, four-faction boss alpha content, a final-sector victory path, save/unlock progression, in-menu seed entry, HUD/onboarding affordances, settings, procedural audio/VFX feedback, unit tests, Playwright smoke coverage, CI, and GitHub Pages deployment wiring. Phase 3 implementation now focuses on velocity polish, long-scroll instrumentation, and playtest hardening.

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

Baseline controls:

- Move: Arrow keys or WASD
- Fire: Space
- Special: Shift
- Bomb: X
- Pause: Escape or P
- Confirm: Enter or Space
- Back: Escape or Backspace

The current shell supports the title flow, deterministic contract launch, contract-specific ship stats, weapon patterns with heat/reload behavior, keyboard movement, primary fire, special burst fire, screen-clearing bombs, near-miss graze charge, deterministic sector distance tracking, procedural parallax sector backgrounds, distance-synced faction-colored directed waves, sparse distance-tied hazard lanes, sector landmarks, route-conditioned scroll speed/distance/hazard/landmark changes, distance-based objective completion, first-pass boss arena approach/lock/release states, pickups, pause/resume, hull damage, 30 item definitions across 8 archetype targets, route choice, route events, rewards, basic shops with rerolls, sector transition, boss gates, phase-based boss attacks, final-sector victory summary, five-boss debug spawns, dense-combat debug stress, run summary stats, and a persistent unlock archive.

Special starts charged and spends charge for a short burst/faster-fire window. Bombs cancel enemy bullets and telegraphs while softening enemies and bosses without instantly ending boss fights. Grazing enemy shots at close range grants deterministic special charge and increments the HUD graze counter.

Contract stats now affect hull, speed, hit radius, pickup pull, special charge rate, bomb capacity, and starting credits/salvage. Weapon families define projectile pattern, damage, cooldown, heat buildup, vent rate, and overheat reload behavior.

Route choices now apply deterministic outcomes. Shops can gain discounts and extra stock while calming the next sector lane, elite and faction ambush routes can increase reward value while pressuring next-sector scroll and hazards, vaults trade curse for relic-biased rewards and vault signatures, repair routes add future max hull and service-platform landmarks, and glitch routes distort rewards plus next-sector speed and hazard density.

The Unlock Archive stores versioned local save data in `localStorage`, including salvage bank, achievements, unlocks, last-run summary, export/import, and reset. Fresh saves start with three baseline contracts and locked advanced content; earned unlocks widen future contract boards, reward/shop item pools, faction and boss generation, challenge seed flags, boss-practice flags, and music flags.

Settings are available from the main menu and pause menu. They persist in `localStorage` and currently cover remappable controls, mute, master volume, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode. Audio uses original procedural Web Audio cues after the first user gesture; mute and master volume apply immediately, reduced motion disables gameplay camera shake and background scroll offset, and performance mode draws fewer background strata.

Add `?debug=1` to the local or deployed URL to show the debug overlay with FPS, scene, seed, entity count, distance, scroll speed, arena phase when active, and background primitive count during gameplay.

The main menu seed field accepts blank/default, `random`, known labels such as `LASER-TAX-404`, or any custom label. Blank/default seeds use `STARBREAK-SMOKE`; `random` resolves to a copyable generated seed when the run starts. You can also add `?seed=LASER-TAX-404` or another seed label to the URL to preview deterministic contract, route, objective, sector length, wave distance marks, reward, shop, background, landmark, hazard, boss arena, and boss generation. Run summaries include route history, sector condition modifiers, items, unlock reasons, win/loss detail, sector distance reached, and a copy-ready seed link for sharing the same generated contracts, route choices, rewards, shop inventory, background plans, feature plans, route-conditioned sector plans, arena marks, wave marks, and boss schedule.

With `?debug=1`, press `K` during gameplay to force the MVP summary screen. Press `1`-`5` to spawn Auditor Drone XL, Carrier of Unsold Missiles, The Bloom Engine, Warranty Void Seraph, or The Core Wreck immediately, even before a boss arena. Press `0` to spawn the dense-combat performance pocket. The HUD distance pill shows fixed-step sector distance, scroll speed, and active arena state, the objective pill shows exit-distance, directed wave progress, target count, and boss-gate state for the current sector, the boss pill names the active boss phase, the verb pill shows special charge/cooldown, bomb stock, and graze count, the weapon pill shows pattern plus heat/overheat state, and the build/hint pills summarize current item hooks and the next practical combat focus.

Projectile budget notes live in `docs/STARBREAK_SALVAGE_PERFORMANCE_NOTES.md`.

Release checklist status lives in `docs/STARBREAK_SALVAGE_RELEASE_CHECKLIST.md`.

Phase 2 planning lives in `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md`. Phase 3 planning lives in `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`; new agent work orders continue from work order 021 in `docs/STARBREAK_SALVAGE_AGENT_WORK_ORDERS.md`.

## Project Vision

The target game is quick to start, readable at high intensity, and replayable through deterministic seeds. Runs should begin with randomized ship contracts, move through seeded sectors, and reward expressive item synergies. Permadeath ends the run, while salvage unlocks widen future variety rather than simply increasing raw power.

All code, text, audio, and art should be original or clearly generated for this project. The game should evoke retro sci-fi arcade energy without copying proprietary assets, names, music, sprites, UI, or lore from commercial games.

## License and Credits

Starbreak Salvage is released under the MIT License. See `LICENSE`, `CREDITS.md`, and `CHANGELOG.md` for license text, placeholder asset notes, tooling credits, and release notes.

## Seed References

The core project direction lives in:

- `AGENTS.md`
- `docs/STARBREAK_SALVAGE_AGENT_SEED.md`
- `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`
- `docs/STARBREAK_SALVAGE_GAME_DESIGN_SEED.md`
- `docs/STARBREAK_SALVAGE_TECHNICAL_ARCHITECTURE.md`
- `docs/STARBREAK_SALVAGE_CONTENT_SEED.json`
