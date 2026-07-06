# Starbreak Salvage

**Starbreak Salvage** is a browser-first 2D vertical roguelike shooter about disposable pilots, unstable ship contracts, and profitable wreckage. The project is intentionally static: no backend, no accounts, and no runtime network dependency after the page loads.

This repository is in the early playable release-candidate stage. It currently ships a Vite + TypeScript app with a canvas renderer, fixed-step loop, input manager, scene manager, deterministic contract and sector generation, deterministic sector scroll plans, procedural parallax sector backgrounds, scroll-synced directed waves, distance-based sector objectives, deterministic sector landmarks and hazards, first-pass boss arenas with scroll locks, route-conditioned sector modifiers, settings-aware velocity cues, explicit viewport scaling with a fixed 640x720 gameplay arena, passive mouse/touch controls, data-driven contract ship appearance and selection previews, a contract-themed cockpit HUD, Phase 4 accessibility hardening, first-pass ship damage/readiness/overheat/destruction cues, quiet contract-theme propagation across non-combat run screens, granular debug performance counters, expanded viewport/input/HUD/debug/progression smoke, a data-backed Phase 5 upgrade catalog, Upgrade Bay, upgrade-influenced seeded run generation, run-end scrap/upgrade progress feedback, sector-exit beacon/toast feedback, and a deterministic Lunar Surface sector with lunar-specific landmarks, hazards, and encounter pacing for banked scrap, expanded item hooks, a combat MVP, route/reward/shop screens, four-faction boss alpha content, a final-sector victory path, save/unlock progression, in-menu seed entry, settings, procedural audio/VFX feedback, unit tests, Playwright smoke coverage, CI, and GitHub Pages deployment wiring. Phase 4 is documented as complete; Phase 5 now focuses next on release hardening.

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
- Mouse/Touch: move pointer inside the play frame to guide the ship; hold primary button/touch to fire. Keyboard movement overrides pointer guidance while held.

The current shell supports the title flow, deterministic contract launch, contract-specific ship stats and appearance, weapon patterns with heat/reload behavior, keyboard movement, pointer-guided mouse/touch movement, primary fire, special burst fire, screen-clearing bombs, near-miss graze charge, deterministic sector distance tracking, procedural parallax sector backgrounds, distance-synced faction-colored directed waves, sparse distance-tied hazard lanes, sector landmarks, route-conditioned scroll speed/distance/hazard/landmark changes, settings-aware velocity streaks, themed engine wake, pickup drift trails, impact streaks, viewport-aware gameplay frame rails, high-contrast projectile outlines, contract-themed cockpit HUD meters, ship-specific damage/invulnerability/readiness/overheat/destruction cues, quiet route/reward/shop/transition/summary contract theme accents, distance-based objective completion, first-pass sector-exit beacon/toast feedback, a Lunar Surface sector with crater/ridge/tower/wreck-shadow background strata, crater-shadow/comm-array/surface-relay landmarks, dust-plume/mining-laser/surface-defense hazard windows, low-altitude wave pacing, first-pass boss arena approach/lock/release states, pickups, pause/resume, hull damage, 30 item definitions across 8 archetype targets, route choice, route events, rewards, basic shops with rerolls, sector transition, boss gates, phase-based boss attacks, final-sector victory summary, five-boss debug spawns, dense-combat, forced-destruction, and long-scroll debug scenarios, run summary stats, run-end scrap flow and upgrade affordability callouts, a persistent unlock archive, an Upgrade Bay for spending banked scrap, and purchased upgrade effects that can widen contract boards, reveal route and seed intel, alter shop stock/prices, and add vault reward options.

Special starts charged and spends charge for a short burst/faster-fire window. Bombs cancel enemy bullets and telegraphs while softening enemies and bosses without instantly ending boss fights. Grazing enemy shots at close range grants deterministic special charge and increments the HUD graze counter.

Contract stats now affect hull, speed, hit radius, pickup pull, special charge rate, bomb capacity, and starting credits/salvage. Contract appearance now controls the New Game ship previews, gameplay ship silhouette, primary/secondary palette, trim, engine color, cockpit accent, weapon mount hints, gameplay cockpit HUD accents/meters, non-combat panel accents, and summary/debug theme metadata without changing collision, hit radius, save data, or seed generation. Weapon families define projectile pattern, damage, cooldown, heat buildup, vent rate, and overheat reload behavior.

Route choices now apply deterministic outcomes. Shops can gain discounts and extra stock while calming the next sector lane, elite and faction ambush routes can increase reward value while pressuring next-sector scroll and hazards, vaults trade curse for relic-biased rewards and vault signatures, repair routes add future max hull and service-platform landmarks, and glitch routes distort rewards plus next-sector speed and hazard density.

The Unlock Archive stores versioned local save data in `localStorage`, including salvage bank, achievements, unlocks, purchased upgrade ids, last-run summary, export/import, and reset. Fresh saves start with three baseline contracts and locked advanced content; earned unlocks widen future contract boards, reward/shop item pools, faction and boss generation, challenge seed flags, boss-practice flags, and music flags. The Upgrade Bay is reachable from the main menu or Unlock Archive and spends banked scrap on durable variety/information sidegrades with icon, cost, locked, available, and installed states. Run summaries and Archive stats show earned/banked scrap flow, affordable upgrades, and next upgrade targets without turning the summary into a shop. Purchased upgrades are resolved at run generation time from the current save state and seed, so the same save plus same seed reproduces the same contract board, route intel, shop inventory, and reward choices.

Settings are available from the main menu and pause menu. They persist in `localStorage` and currently cover remappable controls, mute, master volume, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode. Audio uses original procedural Web Audio cues after the first user gesture; mute and master volume apply immediately. Reduced motion disables gameplay camera shake, background scroll offset, parallax/streak velocity cues, pickup trails, most engine wake and ship cue intensity, and preview/HUD glow filters; performance mode draws fewer background strata with lower streak density and simplified preview/HUD/ship cue treatment; high-contrast bullet mode adds projectile outlines, lowers moving-background streak intensity, and simplifies ship preview/cockpit HUD/ship cue contrast.

Add `?debug=1` to the local or deployed URL to show the debug overlay with FPS, scene, seed, total entity count, enemy count, projectile split, pickup/effect count, telegraph count, distance, scroll speed, arena phase when active, sector-exit sequence state when active, player-destruction sequence state when active, scenario label, active input mode, HUD mode, selected contract theme, banked scrap/upgrade readiness where relevant, run credits/salvage, current sector id/name/background/pacing, background primitive/layer count, active landmark/hazard count, viewport class, presentation scale, DPR, canvas pixel size, gameplay safe-frame origin/size, and fixed combat world size during gameplay.

The main menu seed field accepts blank/default, `random`, known labels such as `LASER-TAX-404`, or any custom label. Blank/default seeds use `STARBREAK-SMOKE`; `random` resolves to a copyable generated seed when the run starts. You can also add `?seed=LASER-TAX-404`, `?seed=LUNAR-SURFACE-LANE`, or another seed label to the URL to preview deterministic contract, route, objective, sector length, wave distance marks, reward, shop, background, landmark, hazard, boss arena, and boss generation. Run summaries include scrap flow, upgrade outlook, route history, sector condition modifiers, ship appearance/theme identifiers, items, unlock reasons, win/loss detail, sector distance reached, and a copy-ready seed link for sharing the same generated contracts, route choices, rewards, shop inventory, background plans, feature plans, route-conditioned sector plans, arena marks, wave marks, and boss schedule.

With `?debug=1`, press `K` during gameplay to force the MVP summary screen. Press `1`-`5` to spawn Auditor Drone XL, Carrier of Unsold Missiles, The Bloom Engine, Warranty Void Seraph, or The Core Wreck immediately, even before a boss arena. Press `0` to spawn the dense-combat performance pocket, `7` to force the player destruction sequence, `8` to force the current sector complete and open the sector-exit beat before route flow, and `9` to jump to a quiet late-sector long-scroll traversal. The cockpit HUD uses the selected contract theme for frame accents and hull/special/bomb/weapon heat meters while preserving text readouts for distance, objectives, boss state, warnings, build, and resources. The gameplay ship also uses the selected contract palette for engine wake, readiness brackets, damage flash, destruction debris, invulnerability ring, and weapon heat stress cues without changing the hitbox. Route, shop, reward, sector-transition, and summary screens carry a compact contract strip plus subtle theme accents while keeping operational text scannable. Keyboard-only flow can start a run, select contracts, pause, end a run, and return from summary; mouse/touch guidance only activates over the gameplay frame, not menus or settings. Desktop, laptop/tablet, and narrow mobile-like windows scale the same 640x720 combat arena into a calculated safe frame, so hazards, enemies, bullets, bosses, pickups, and player movement keep consistent relative spacing across viewport sizes.

Projectile budget notes live in `docs/STARBREAK_SALVAGE_PERFORMANCE_NOTES.md`.

Release checklist status lives in `docs/STARBREAK_SALVAGE_RELEASE_CHECKLIST.md`.

Phase 2 planning lives in `docs/STARBREAK_SALVAGE_PHASE_2_PLAN.md`. Phase 3 planning lives in `docs/STARBREAK_SALVAGE_PHASE_3_PLAN.md`. Phase 4 planning lives in `docs/STARBREAK_SALVAGE_PHASE_4_PLAN.md`. Phase 5 planning lives in `docs/STARBREAK_SALVAGE_PHASE_5_PLAN.md`; new agent work orders continue from work order 041 in `docs/STARBREAK_SALVAGE_AGENT_WORK_ORDERS.md`.

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
- `docs/STARBREAK_SALVAGE_PHASE_4_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_5_PLAN.md`
- `docs/STARBREAK_SALVAGE_GAME_DESIGN_SEED.md`
- `docs/STARBREAK_SALVAGE_TECHNICAL_ARCHITECTURE.md`
- `docs/STARBREAK_SALVAGE_CONTENT_SEED.json`
