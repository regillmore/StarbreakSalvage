# Starbreak Salvage

**Starbreak Salvage** is a browser-first 2D vertical roguelike shooter about disposable pilots, unstable ship contracts, and profitable wreckage. The project is intentionally static: no backend, no accounts, and no runtime network dependency after the page loads.

This repository is in the early playable release-candidate stage. It currently ships a Vite + TypeScript app with a canvas renderer, fixed-step loop, input manager, scene manager, a code-native illustrated title screen with random-first expedition launch, deterministic contract and sector generation, deterministic sector scroll plans, procedural parallax sector backgrounds, scroll-synced directed waves, distance-based sector objectives, deterministic sector landmarks and hazards, richer hazard-zone behavior plus director scheduling, discrete world-anchored destructible proximity-mine clusters, first-pass destructible/obstacle content schema and fixed-world placement helpers, deterministic loose-currency scatter lanes with pickup caps and debug counters, first-pass boss arenas with scroll locks and fair post-boss hazard release, route-conditioned sector modifiers, settings-aware velocity cues, explicit viewport scaling with a fixed 640x720 gameplay arena, passive mouse/touch controls, data-driven contract ship appearance and selection previews, a contract-themed cockpit HUD, Phase 4 accessibility hardening, first-pass ship damage/readiness/overheat/destruction cues, quiet contract-theme propagation across non-combat run screens, granular debug performance counters, expanded viewport/input/HUD/debug/progression smoke, a data-backed Phase 5 upgrade catalog, Upgrade Bay, upgrade-influenced seeded run generation, run-end scrap/upgrade progress feedback, ship-led sector-departure feedback, and a deterministic Lunar Surface sector with lunar-specific landmarks, hazards, and encounter pacing for banked scrap, a 60-item Phase 6 catalog with expanded hook behavior, source-weighted reward/shop/vault acquisition, unlock-gated item families, discovery records, build identity, shared item-card presentation, and item-stress instrumentation, a combat MVP, route/reward/shop screens, four-faction boss alpha content, role-specific movement/attack behavior, seeded upgraded variants, deterministic squad formations with route/faction bias and clear-bonus salvage, route-conditioned longer-sector pacing arcs with relief windows and formation clusters, enemy-rich debug smoke for role/variant/formation/readability budgets, an environmental stress debug smoke path for hazards, objects, and loose currency, scroll-world destructible/obstacle and loose-loot presentation, a final-sector victory path, save/unlock progression, optional expedition-code entry, settings, procedural audio/VFX feedback, unit tests, Playwright smoke coverage, CI, and GitHub Pages deployment wiring. Phase 7 is complete as a first-pass enemy-behavior playtest candidate; Phase 8 is complete as a first-pass environmental systems playtest candidate. Phase 9 is complete as a local second-act playtest candidate with a validated deterministic two-act, ten-sector run schema, playable inter-act refit, Act II route/pacing/pressure/economy contracts, deterministic second-act finales, public Act II debug smoke, full automated checks, and production preview asset-path evidence.

Phase 10 is complete as the first expedition-depth and shipcraft playtest candidate. It adds a deterministic seed-plus-save expedition graph, executable multi-stage missions and optional consequences, modular frames and hardpoints, a run-local salvage foundry with weapon evolution, three reusable capital-ship/station/wreck-convoy set pieces, faction campaigns with recurring rival captains, recruitable crew/wingmates, a bounded local timeline, and an eight-card public-model Scenario Lab. The deployed all-optional route now takes about 12 minutes, double the roughly six-minute Phase 9 baseline, with the added time coming from play and decisions rather than slowdown or durability inflation.

Phase 11 is complete as the first resumable deep-voyage release candidate. Fifteen-sector runs now combine snapshot recovery, two required combat operations plus one paired optional post-gate challenge per sector, the five-sector Null Frontier and early extraction, a mobile carrier, six boarding contracts, dynamic faction fronts, ten crew arcs, six support-craft roles, and three four-contact apex hunts with explicit destruction, capture, containment, bargain, and evacuation outcomes. Sixteen public Scenario Lab fixtures and the endurance/release audit reach every Phase 11 system without a full voyage. Deterministic authored projections measure 28.15 minutes for fresh and progressed standard graphs, 18.50 minutes for Act II extraction, and 32.40 minutes completionist; these are structural capacity figures, while real Phase 11 stopwatch and fatigue evidence remains manual.

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
npm run test:preview # verify the production Pages base and hashed assets
npm run smoke:host # start/reuse a managed LAN-visible browser smoke host
npm run smoke:status # print the current authoritative browser URL
npm run smoke:stop # stop the project-owned browser smoke host
npm run lint      # run ESLint
npm run format    # format files with Prettier
npm run check     # typecheck, lint, test, and build
npm run verify:release # run check, Chromium smoke, and preview smoke
```

The Vite base path is configured for GitHub Pages at `/StarbreakSalvage/`.

For interactive browser validation, use `npm run smoke:host` instead of manually choosing a
Vite port or copying an address from an earlier terminal. The command binds a project-owned dev
instance to local interfaces, waits for the app and its ownership endpoint, prints the current
`Browser URL`, and stays attached to that managed shell. Repeating the command from another shell
safely reuses the same healthy instance. Use
`npm run smoke:status` to refresh the URL after a network change and `npm run smoke:stop` when the
inspection is complete. Automation can read one JSON record with
`npm run --silent smoke:status -- --json`. Add `-- --mode preview` to `smoke:host` after a build when
the production server is the desired target.

## Controls

Baseline controls:

- Move: Arrow keys or WASD
- Fire: Space
- Special: Shift
- Bomb: X
- Pause: Escape or P
- Confirm: Enter or Space
- Back: Escape or Backspace
- Mouse/Touch: move the pointer anywhere in the gameplay browser window to guide the ship; outside-arena positions project to the nearest edge. Hold primary button/touch to fire. Keyboard movement overrides pointer guidance while held.

The current shell supports the title flow, deterministic contract launch, contract-specific ship stats and appearance, weapon patterns with heat/reload behavior, keyboard movement, pointer-guided mouse/touch movement, primary fire, special burst fire, screen-clearing bombs, near-miss graze charge, deterministic sector distance tracking, procedural parallax sector backgrounds, distance-synced faction-colored directed waves, role-specific enemy movement and telegraphed attack profiles, seeded upgraded enemy variants with canvas ring/badge cues, first-pass wedge/column/screen/escort/pincer/convoy/ring/staggered-lane squad formations with compact canvas cues and one-time clear rewards, distance-tied hazard zones scheduled around route pressure, relief windows, formation clusters, lunar context, and boss locks with pause-safe fixed-step expiry for already-visible zones, schema-driven environment destructibles/obstacles with deterministic rewards, bounded chain reactions, hazard/bomb/special/weapon damage rules, lane-safe placement, scroll-world presentation, contact pushout, and debug counts, deterministic loose credit/salvage lanes from enemy, boss, destructible, route, hazard, landmark, and obstacle sources with fixed-world pickup attraction, scroll-in/drop scrolling behavior, and active value caps, sector landmarks, route-conditioned scroll speed/distance/hazard/landmark changes, settings-aware velocity streaks, themed engine wake, pickup drift trails, impact streaks, viewport-aware gameplay frame rails, high-contrast projectile outlines, contract-themed cockpit HUD meters, ship-specific damage/invulnerability/readiness/overheat/destruction cues, quiet route/reward/shop/transition/summary contract theme accents, distance-based objective completion, a 360-unit peaceful pickup coast before ordinary sector exits, a contract-ship thruster departure that leaves the frozen combat camera before route or summary handoff, a Lunar Surface sector with crater/ridge/tower/wreck-shadow background strata, crater-shadow/comm-array/surface-relay landmarks, dust-plume/mining-laser/surface-defense hazard windows, low-altitude wave pacing, first-pass boss arena approach/lock/release states with every hazard settled during the approach before arena lock, deterministic Act II finale variants that tune final boss hull and approach distance through the existing arena path, pickups, pause/resume, hull damage, 60 active circuit items across ten live family lanes plus five retired compatibility definitions, item-card presentation across reward/shop/summary/archive surfaces, route choice, route events, rewards, basic shops with rerolls, sector transition, boss gates, phase-based boss attacks, final-sector victory summary, five-boss debug spawns, finale-smoke, item-storm, dense-combat, enemy-rich, environmental-stress, forced-sector-completion, forced-destruction, and long-scroll debug scenarios, run summary stats, run-end scrap flow and upgrade affordability callouts, a persistent unlock archive, an Upgrade Bay for spending banked scrap, and purchased upgrade effects that can widen contract boards, reveal route and seed intel, alter shop stock/prices, add vault reward options, and provide permanent boss-phase warning and relief support.

Special starts charged and spends charge for a short burst/faster-fire window. Bombs cancel enemy bullets and telegraphs while softening enemies and bosses without instantly ending boss fights. Grazing enemy shots at close range grants deterministic special charge and increments the HUD graze counter.

Contract stats now affect hull, speed, hit radius, pickup pull, special charge rate, bomb capacity, and starting credits/salvage. Contract appearance now controls the New Game ship previews, gameplay ship silhouette, primary/secondary palette, trim, engine color, cockpit accent, weapon mount hints, gameplay cockpit HUD accents/meters, non-combat panel accents, and summary/debug theme metadata without changing collision, hit radius, save data, or seed generation. Weapon families define projectile pattern, damage, cooldown, heat buildup, vent rate, and overheat reload behavior.

Route choices now apply deterministic outcomes. Shops can gain discounts and extra stock while calming the next sector lane, elite and faction ambush routes can increase reward value while pressuring next-sector scroll and hazards, vaults trade curse for relic-biased rewards and vault signatures, repair routes add future max hull and service-platform landmarks, and glitch routes distort rewards plus next-sector speed and hazard density. Act II economy profiles raise reward weighting and route cash-out expectations while making shops, rerolls, repairs, and vault charges pricier enough to preserve banked-scrap pacing.

The Unlock Archive stores versioned permanent progression in `localStorage`, including salvage bank, achievements, unlocks, purchased upgrade ids, last-run summary, export/import, and reset. A separate `starbreak.run.v9` record stores the current generated-plan identity, safe checkpoint, full run session, operational ledger, frontier decision, carrier, boarding, faction-front, crew-arc, fleetcraft, and apex-hunt plan/state; it never mutates or embeds permanent progression. Closing the page resumes from the most recent briefing, operation-entry, settled operational map, or command-deck checkpoint. Pre-apex v1-v8 run snapshots retire safely without touching permanent save v5. The pause menu can explicitly suspend to the main menu, where the checkpoint, size, seed, sector, and restart boundary are shown; boarding operations can also retreat into partial settlement without ending the voyage. Ending a run or choosing a new contract clears the suspended snapshot. Purchased upgrades are resolved at run generation time from the current save state and seed, so the same save plus same seed reproduces the same contract board, carrier, boarding campaign, faction-front, crew-arc, fleet, and apex plans, frontier campaign, operational itinerary, route intel, shop inventory, and reward choices.

Settings are available from the main menu and pause menu. They persist in `localStorage` and currently cover remappable controls, mute, master volume, reduced motion, screen shake intensity, bullet contrast, fullscreen, and performance mode. Audio uses original procedural Web Audio cues after the first user gesture; mute and master volume apply immediately. Reduced motion disables gameplay camera shake, background scroll offset, parallax/streak velocity cues, pickup trails, most engine wake and ship cue intensity, and preview/HUD glow filters; performance mode draws fewer background strata with lower streak density and simplified preview/HUD/ship cue treatment; high-contrast bullet mode adds projectile outlines, lowers moving-background streak intensity, and simplifies ship preview/cockpit HUD/ship cue contrast.

Add `?debug=1` to the local or deployed URL to show the debug overlay with FPS, scene, seed, expedition node/visited/decision/capacity state, total entity count, enemy count, projectile split, pickup/effect count, loose currency count/value/caps, loose credit/salvage split, telegraph count, enemy projectile/telegraph stress budgets, active enemy role counts, active enemy variant counts, active formation counts, active environment/destructible/obstacle counts, environmental stress hazard-family/object/currency budget state, act-pressure combined enemy/hazard/object/pickup/projectile/item budget state, Scenario Lab systems/budgets, bounded timeline count/categories/latest events, distance, scroll speed, arena phase when active, sector-exit sequence state when active, player-destruction sequence state when active, scenario label, item count, active hook count, proc budget state, build identity, active input mode, HUD mode, selected contract theme, banked scrap/upgrade readiness where relevant, run credits/salvage, current act id/name/progress, current finale variant/hull/approach/unlock state when relevant, current sector id/name/background/pacing/route tags, live objective state, active long-sector pacing beat, background primitive/layer count, active landmark/hazard count, viewport class, presentation scale, DPR, canvas pixel size, gameplay safe-frame origin/size, and fixed combat world size during gameplay.

The main menu seed field accepts blank/default, `random`, known labels such as `LASER-TAX-404`, or any custom label. Blank/default seeds use `STARBREAK-SMOKE`; `random` resolves to a copyable generated seed when the run starts. You can also add `?seed=LASER-TAX-404`, `?seed=LUNAR-SURFACE-LANE`, or another seed label to the URL to preview deterministic contract, route, objective, sector length, wave distance marks, upgraded enemy variant schedule, formation schedule, reward, shop, background, landmark, hazard, boss arena, finale variant, and boss generation. Run summaries include scrap flow, upgrade outlook, Act I/junction/Act II economy breakdowns, item-source counts, route history, sector condition modifiers, ship appearance/theme identifiers, items, unlock reasons, win/loss detail, finale outcome detail, sector distance reached, and a copy-ready seed link for sharing the same generated contracts, route choices, rewards, shop inventory, background plans, feature plans, route-conditioned sector plans, arena marks, finale variant, wave marks, upgraded variant schedule, formation schedule, and boss schedule.

With `?debug=1`, press `B` or use the main-menu button to open the sixteen-card local Scenario Lab, including carrier-command, frontier-ending, snapshot-recovery, and duration-audit fixtures. Press `K` during gameplay to force the MVP summary screen. Press `1`-`5` to spawn Auditor Drone XL, Carrier of Unsold Missiles, The Bloom Engine, Warranty Void Seraph, or The Core Wreck immediately, even before a boss arena. Press `J` to jump to the inter-act junction, `I` to jump into the first Act II sector with a deterministic junction choice applied, `F` to jump to the Act II finale gate operation, `G` to open the extraction-or-frontier gate, and `Y` to open an Act II debug summary. Press `6` to spawn the item-storm hook stress path, `E` to spawn the enemy-rich role/variant/formation stress path, `H` to spawn the environmental hazard/object/currency stress path, `0` to spawn the dense-combat performance pocket, `7` to force the player destruction sequence, `8` to settle the current operation and enter its operational-map boundary, and `9` to jump to a quiet late-operation traversal. Explicitly remapped gameplay controls take precedence over colliding debug keys. The cockpit HUD uses the selected contract theme for frame accents and hull/special/bomb/weapon heat meters while preserving text readouts for distance, objectives, boss state, warnings, build, and resources. The gameplay ship also uses the selected contract palette for engine wake, readiness brackets, damage flash, destruction debris, invulnerability ring, and weapon heat stress cues without changing the hitbox. Route, shop, reward, sector-transition, operational-map, frontier-gate, and summary screens carry a compact contract strip plus subtle theme accents while keeping operational text scannable. Keyboard-only flow can start a run, select contracts, navigate operational maps, choose extraction or breach, pause, end a run, and return from summary; mouse/touch guidance activates across the gameplay browser viewport, projects outside-arena positions onto the nearest arena edge, and remains inactive over menus, settings, and native DOM controls. Desktop, laptop/tablet, and narrow mobile-like windows scale the same 640x720 combat arena into a calculated safe frame, so hazards, enemies, bullets, bosses, pickups, and player movement keep consistent relative spacing across viewport sizes.

Carrier debug: with `?debug=1`, press `Q` to open a funded command-deck staging fixture with active crew; use its native facility/action buttons or keyboard confirmation to continue.

Projectile budget notes live in `docs/STARBREAK_SALVAGE_PERFORMANCE_NOTES.md`.

Release checklist status lives in `docs/STARBREAK_SALVAGE_RELEASE_CHECKLIST.md`.

Completed Phase 11 planning and closeout evidence live in `docs/STARBREAK_SALVAGE_PHASE_11_PLAN.md`; Phase 2 through Phase 10 plan files remain historical milestone records. Work orders 101-150 are tracked in `docs/STARBREAK_SALVAGE_AGENT_WO_101-150.md`, work orders 151-200 in `docs/STARBREAK_SALVAGE_AGENT_WO_151-200.md`, and work orders 201 onward in `docs/STARBREAK_SALVAGE_AGENT_WO_201-250.md`.

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
- `docs/STARBREAK_SALVAGE_PHASE_6_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_7_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_8_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_9_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_10_PLAN.md`
- `docs/STARBREAK_SALVAGE_PHASE_11_PLAN.md`
- `docs/STARBREAK_SALVAGE_ITEM_CATALOG_AUDIT.md`
- `docs/STARBREAK_SALVAGE_ENEMY_ROLE_AUDIT.md`
- `docs/STARBREAK_SALVAGE_GAME_DESIGN_SEED.md`
- `docs/STARBREAK_SALVAGE_TECHNICAL_ARCHITECTURE.md`
- `docs/STARBREAK_SALVAGE_CONTENT_SEED.json`
