# Starbreak Salvage — Agent Project Plan and Seed Document

Status: greenfield seed document  
Target platform: GitHub Pages static site  
Target build: TypeScript + Vite + Canvas 2D  
Game genre: single-player 2D vertical scrolling roguelike shooter  
Tone: original retro sci-fi arcade, salvage comedy, high-energy weapon experimentation

---

## 1. Executive product brief

**Starbreak Salvage** is a single-player browser game about disposable pilots, unstable weapons, and illegal battlefield cleanup. Each run begins with three randomized ship contracts, each offering a hull, starting weapon, passive perk, and drawback. The player blasts through seeded vertical-scrolling sectors, collects relics and weapons, discovers build synergies, fights faction bosses, and either extracts salvage or explodes gloriously.

Death ends the run. Salvage and achievements unlock new starting contracts, item families, boss variants, sector hazards, lore logs, cosmetic trails, and optional challenge modes. Permanent progression should widen the toy box, not flatten the difficulty curve.

The final product should run entirely in the browser through GitHub Pages: no backend, no accounts, no cloud save requirement, and no online services beyond static asset delivery.

### Elevator pitch

> Choose a questionable ship contract, enter a seeded combat corridor, turn scrap into absurd weapon synergies, and survive long enough to unlock stranger ways to die next time.

### One-paragraph store/page summary

**Starbreak Salvage** is a fast 2D vertical roguelike shooter built for quick browser runs. Pick from randomized ship contracts, fight through seeded sci-fi sectors, and combine weapons, drones, shields, missiles, relics, and cursed salvage into screen-clearing builds. Every death resets the run, but recovered salvage permanently unlocks new ships, items, bosses, factions, challenge seeds, and cosmetic rewards.

---

## 2. Product pillars

1. **Instant browser play**  
   The player should reach gameplay quickly, ideally in two clicks: open page, start run. No account, backend, or download.

2. **Readable arcade intensity**  
   Enemy bullets must be clear, the player hitbox must feel fair, and explosions should enhance feedback without hiding threats.

3. **Build-crafting chaos**  
   Items should combine through understandable tags and event hooks. The game should create “I broke it” moments without becoming unreadable immediately.

4. **Seeded replayability**  
   A copied seed should reproduce starting contracts, sector choices, bosses, rewards, shops, and major wave schedules.

5. **Permadeath with permanent variety**  
   Runs are disposable. Unlocks expand possibilities: new hulls, weapons, relics, encounter types, boss variants, and optional rules.

6. **Agent-buildable codebase**  
   The project should be modular, typed, tested, and data-driven so coding agents can safely work in parallel.

---

## 3. Audience and platform

### Primary audience

Players who like arcade shooters, roguelikes, build crafting, and quick “one more run” sessions. They are comfortable with keyboard controls, seeded challenges, and discovering emergent synergies.

### Secondary audience

Developers and hobbyists interested in inspecting a compact open-source browser game and using seeds to compare runs.

### Target platform

- Desktop browser first: Chrome/Edge, Firefox, Safari.
- Keyboard controls required.
- Gamepad support desirable after the MVP.
- Mobile/touch support is a stretch goal, not a blocker for initial launch.

### Performance targets

- 60 FPS target on common modern laptops/desktops.
- Stable simulation under frame drops using fixed-step update.
- Initial load below a reasonable static-site budget; target under 25 MB uncompressed for v1 unless original music/art justify more.
- No runtime network calls after static assets load.

---

## 4. Design goals and non-goals

### Goals

- A complete playable loop: menu → choose contract → fight sector → choose reward/route → boss → death/extraction → unlocks.
- Original identity: salvage economy, corporate absurdity, weird relics, modular weapons.
- Fast iteration: data tables for ships, items, enemy waves, bosses, sectors, and unlocks.
- Strong feedback: screen shake, hit flashes, audio cues, particles, slow-motion punctuation used carefully.
- Accessibility basics: remappable controls, reduced motion, bullet contrast options, mute, pause, readable UI.
- Deterministic generation: testable seeded content.

### Non-goals for v1

- Networked leaderboards.
- User accounts.
- Server-authoritative saves.
- Multiplayer or co-op.
- Full mobile-first redesign.
- Pixel-perfect recreation of any existing commercial game.
- Asset-heavy cinematic production.
- Complex physics engine.

---

## 5. Core gameplay loop

### Run start

The player is shown three randomized **contracts** generated from the active seed and unlock pool. Each contract includes:

- ship hull;
- pilot background/class;
- starting weapon;
- special ability;
- passive perk;
- drawback;
- sponsor modifier;
- initial item bias;
- difficulty/reward multiplier.

Example:

**Debt Runner / Sponsor: Redline Credit Union**  
Fast hull, weak armor, starts with Credit Magnet and Light Needle Laser. Shops are cheaper, but bounty hunters appear in elite rooms.

### Sector flow

A v1 run contains 5 sectors:

1. Outer Debris Field — intro enemies, simple hazards, first item identity.
2. Trade War Corridor — convoys, turrets, shielded enemies, money-focused rewards.
3. Bio-Machine Bloom — organic bullet patterns, corrosion, regenerating enemies.
4. Corporate Kill Grid — lasers, drones, elite formations, tech shops.
5. The Core Wreck — final gauntlet and boss.

Each sector has:

- generated wave schedule;
- local hazard or rule;
- mid-sector reward/route decision;
- possible shop/vault/elite/repair event;
- boss or miniboss.

### Between encounters

The player chooses one of three route cards:

- **Shop** — spend credits for controlled upgrades.
- **Elite** — harder fight, rare reward.
- **Vault** — cursed relic or secret unlock chance.
- **Repair** — healing and safer item pool.
- **Glitch** — high variance, seed mutation, rare unlock chance.
- **Faction Ambush** — harder but increases faction-specific rewards.

### Reward loop

A reward choice should usually ask a meaningful question:

- improve current build;
- pivot into a new synergy;
- repair now vs. scale later;
- accept curse for power;
- take credits for shop control;
- unlock meta progression if the run ends.

### End of run

A run ends by death, extraction after a sector, or victory. The run summary shows:

- seed;
- chosen contract;
- sector reached;
- bosses defeated;
- items collected;
- top damage sources;
- salvage recovered;
- unlocks earned;
- shareable run code.

---

## 6. Starting ship/class seed list

### Debt Runner

Fast, fragile, economy-focused.

- Starting weapon: Light Needle Laser.
- Ability: Emergency Dash.
- Perk: credits are pulled from farther away.
- Drawback: elite bounty ambush can replace normal elite encounters.
- Build bias: credit scaling, fire-rate spikes, shop manipulation.

### Drone Chaplain

Support/minion build.

- Starting weapon: Pulse Cannon.
- Ability: Recall Drones.
- Perk: starts with two micro-drones.
- Drawback: main weapon damage reduced until drones are active.
- Build bias: drone inheritance, orbitals, sacrifice effects.

### Missile Accountant

Slow, armored, explosive, rewards overkill.

- Starting weapon: Dumbfire Missile Rack.
- Ability: Audit Strike.
- Perk: overkill damage can produce bonus scrap.
- Drawback: slower reload and lower turn agility.
- Build bias: chain explosions, ammo economy, blast radius.

### Phase Courier

High mobility and graze play.

- Starting weapon: Needle Splitter.
- Ability: Phase Blink.
- Perk: grazing charges special ability.
- Drawback: lower max hull.
- Build bias: dodge rewards, close-range modifiers, time-slow.

### Shield Bruiser

Tanky retaliation build.

- Starting weapon: Short-Range Spread Cannon.
- Ability: Shield Ram.
- Perk: shield damage charges retaliation weapons.
- Drawback: large hitbox and slow movement.
- Build bias: shield loops, thorns, armor, revenge beams.

### Scrap Monk

Conversion and minimalist scaling.

- Starting weapon: Kinetic Popgun.
- Ability: Projectile Vacuum.
- Perk: destroyed enemy bullets become scrap motes.
- Drawback: shops offer fewer items unless purity is broken.
- Build bias: defense-to-offense, no-shop bonuses, magnetism.

### Corporate Test Pilot

High variance prototype gear.

- Starting weapon: Prototype Beam.
- Ability: Warranty Override.
- Perk: starts with a rare experimental item.
- Drawback: random malfunction each sector.
- Build bias: cursed items, overheat, random procs, risk reward.

### Relic Thief

Rare artifact hunter.

- Starting weapon: Basic Blaster.
- Ability: Vault Key.
- Perk: detects hidden relic rooms.
- Drawback: lower max hull and higher curse chance.
- Build bias: rare relics, secrets, curse conversion.

---

## 7. Item system seed

### Item categories

- **Primary weapons** — lasers, plasma, missiles, railguns, beams, flak, arcs.
- **Weapon modifiers** — split, pierce, ricochet, homing, charge, overheat, burst.
- **Drones/orbitals** — escorts, turrets, shields, mines, repair bots.
- **Defensive systems** — shields, armor, dodge, bullet cancel, repair.
- **Economy items** — credits, salvage, shop rerolls, overkill profit.
- **Relics** — powerful passive rules with unusual constraints.
- **Curses** — risky modifiers that can later become power sources.
- **Consumables** — bombs, repairs, temporary boosts.
- **Meta unlock fragments** — blueprints, lore logs, sponsor licenses.

### Tag-driven synergy model

Every item should define tags and hooks:

```ts
type ItemTag =
  | 'laser'
  | 'plasma'
  | 'missile'
  | 'drone'
  | 'shield'
  | 'credit'
  | 'scrap'
  | 'curse'
  | 'heat'
  | 'phase'
  | 'pierce'
  | 'split'
  | 'ricochet'
  | 'overkill';

type ItemHook =
  | 'onRunStart'
  | 'onSectorStart'
  | 'onFire'
  | 'onProjectileSpawn'
  | 'onEnemyHit'
  | 'onEnemyKilled'
  | 'onPlayerHit'
  | 'onShieldDamaged'
  | 'onPickupCollected'
  | 'onShopOpened'
  | 'onRewardRolled'
  | 'onBossDefeated';
```

The synergy engine should allow items to compose by modifying shared event payloads. Keep hook order deterministic and visible in debug tools.

### Example item seeds

1. **Chain Arc Capacitor** — shots tagged `laser` or `plasma` can arc to nearby enemies.
2. **Split Prism** — primary shots split into two weaker child projectiles.
3. **Ricochet License** — kinetic and plasma shots bounce once off screen edges.
4. **Drone Uplink** — drones copy a reduced version of the primary shot every third volley.
5. **Shield Dynamo** — shield damage charges special ability.
6. **Coin-Operated Cannon** — collecting credits briefly increases fire rate.
7. **Overkill Ledger** — excess damage can convert to scrap.
8. **Heat Sink Saint** — reduces heat buildup and turns venting into radial damage.
9. **Cursed Hull Plate** — lowers max hull, but repairs grant temporary damage.
10. **Bomb Refund Actuator** — bomb kills can refund bomb charge.
11. **Phase Grazer** — grazing while phase is ready emits a small homing shard.
12. **Vault Parasite** — relics are stronger but shops gain cursed inventory.
13. **Mirror Turret** — creates a rear-firing ghost copy at reduced damage.
14. **Salvage Magnet** — pickups drift faster and from farther away.
15. **Executive Override** — once per sector, lethal damage leaves the player at 1 hull and spawns debt collectors.

### Example synergy recipes

- Chain Arc Capacitor + Split Prism = many weak split shots become crowd-clearing arcs.
- Overkill Ledger + Missile Accountant = explosive builds profit from large damage spikes.
- Shield Dynamo + Revenge Beam = defensive damage converts into a charged pierce attack.
- Drone Uplink + Mirror Turret = drones and mirror shots multiply weapon modifiers.
- Heat Sink Saint + Prototype Beam = overheat transforms from a limiter into a pulse mechanic.
- Coin-Operated Cannon + Salvage Magnet = greedy pickup routing creates fire-rate bursts.
- Ricochet License + Pierce Core = shots pass through enemies, bounce, and re-enter formations.
- Phase Grazer + Emergency Dash = mobility generates special charge and counterfire.

---

## 8. Enemy and faction seed

### Faction: Wreck Gnats

Scavenger drones, erratic but simple.

- Behaviors: swarm, dive, steal pickups, split on death.
- Visual shape: jagged scrap triangles and blinking salvage lights.
- Weakness: low health, predictable formation windows.

### Faction: Corporate Recovery Office

Cold, geometric, money-themed corporate combat craft.

- Behaviors: shield walls, laser audits, turret deployers, bounty hunters.
- Visual shape: white/orange ledgers, rectangular armor plates, barcode markings.
- Weakness: shield generators and predictable firing lanes.

### Faction: Bio-Machine Bloom

Organic alien machinery.

- Behaviors: spores, curving bullets, regenerating nodes, corrosion pools.
- Visual shape: neon veins, pulsing cores, soft armor shells.
- Weakness: cores exposed during attack cycles.

### Faction: Kill Grid Remnants

Old autonomous military AI.

- Behaviors: beam warnings, mines, drones, synchronized bullet curtains.
- Visual shape: black hulls, red aiming lines, hard-edged military silhouettes.
- Weakness: telegraphed high-threat attacks.

### Boss seed list

1. **Auditor Drone XL** — marks lanes with red audit lines, then fires tax beams.
2. **The Bloom Engine** — grows weak points, spawns spores, enrages when pruned.
3. **Carrier of Unsold Missiles** — releases missile pods, refunds projectiles into mines.
4. **Warranty Void Seraph** — phase-shifts, breaks player items temporarily, drops prototype relics.
5. **The Core Wreck** — final multi-phase boss combining sector hazards and seed-specific modules.

---

## 9. Progression and unlocks

### Currency model

Use two currencies:

- **Credits** — run-limited shop currency.
- **Salvage** — meta currency recovered after run; spent on unlock branches.

Avoid permanent raw damage upgrades in the core unlock tree. Instead unlock new options:

- ship contracts;
- starting weapons;
- item families;
- factions;
- bosses;
- route cards;
- challenge modes;
- lore logs;
- cosmetics;
- daily/weekly seed modifiers.

### Unlock examples

- Defeat Auditor Drone XL three times → unlock Missile Accountant.
- Collect 500 credits in one run → unlock Coin-Operated item family.
- Complete a run with no shop purchases → unlock Scrap Monk.
- Clear Bio-Machine Bloom without bomb use → unlock Bloom relics.
- Enter three vaults in one run → unlock Relic Thief.
- Win a run with a curse active → unlock Curse Conversion branch.

### Save data

Persist locally with versioning:

```ts
type SaveData = {
  version: number;
  options: PlayerOptions;
  unlocks: string[];
  achievements: string[];
  stats: LifetimeStats;
  bestRuns: RunSummary[];
};
```

Local save should be exportable/importable as text for backups. Add migration tests whenever save shape changes.

---

## 10. Technical architecture

### Repo structure

```text
StarbreakSalvage/
  AGENTS.md
  README.md
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  public/
    favicon.svg
    audio/
    sprites/
  src/
    main.ts
    app/
      GameApp.ts
      Loop.ts
      SceneManager.ts
    core/
      rng.ts
      math.ts
      time.ts
      events.ts
      assert.ts
      storage.ts
    content/
      ships.ts
      items.ts
      factions.ts
      waves.ts
      bosses.ts
      sectors.ts
      unlocks.ts
      contentValidation.ts
    game/
      RunState.ts
      Generation.ts
      Balance.ts
      DebugFlags.ts
    ecs/
      Entity.ts
      Components.ts
      World.ts
    systems/
      InputSystem.ts
      PlayerSystem.ts
      WeaponSystem.ts
      ProjectileSystem.ts
      EnemySystem.ts
      CollisionSystem.ts
      PickupSystem.ts
      RewardSystem.ts
      BossSystem.ts
      RenderSystem.ts
      AudioSystem.ts
      ParticleSystem.ts
      SaveSystem.ts
    ui/
      dom.ts
      MainMenu.ts
      ContractSelect.ts
      PauseMenu.ts
      RewardScreen.ts
      RunSummary.ts
      Settings.ts
    assets/
      generated/
    tests/
      fixtures/
  tests/
    unit/
    deterministic/
    e2e/
  docs/
    STARBREAK_SALVAGE_AGENT_SEED.md
    STARBREAK_SALVAGE_GAME_DESIGN_SEED.md
    STARBREAK_SALVAGE_TECHNICAL_ARCHITECTURE.md
    STARBREAK_SALVAGE_AGENT_WORK_ORDERS.md
    STARBREAK_SALVAGE_BACKLOG.md
    STARBREAK_SALVAGE_QA_RELEASE_PLAN.md
  .github/
    workflows/
      pages.yml
      ci.yml
```

### Runtime layers

1. **Boot layer** — load DOM, create canvas, initialize options/save, route to menu.
2. **Scene layer** — menu, contract select, gameplay, reward, shop, pause, summary.
3. **Simulation layer** — deterministic fixed-step world update.
4. **Content layer** — typed data tables and generation functions.
5. **Rendering layer** — Canvas 2D draw calls, screen shake, particles, UI indicators.
6. **Audio layer** — sound triggers, music loop, mute, volume settings.
7. **Persistence layer** — localStorage save, import/export, migrations.
8. **Testing layer** — unit tests, deterministic snapshots, E2E smoke.

### Fixed timestep loop

Use a fixed simulation delta, e.g. 1/60 second. Clamp accumulated frame time to prevent spiral-of-death behavior. Render once per animation frame.

Pseudo-flow:

```ts
function frame(nowMs: number) {
  const frameSeconds = clamp((nowMs - lastMs) / 1000, 0, 0.25);
  accumulator += frameSeconds;

  while (accumulator >= FIXED_DT) {
    input.poll();
    scene.update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  scene.render(renderer, accumulator / FIXED_DT);
  requestAnimationFrame(frame);
}
```

### RNG

Implement a simple seeded PRNG with tests. Requirements:

- seed string → numeric state;
- `nextFloat()`, `nextInt(min, max)`, `choice(array)`, `shuffle(array)`;
- forkable RNG streams: `rng.fork('sector-2-shop')`;
- no `Math.random()` in generation or simulation modules.

### Collision

Start simple:

- circles for bullets/pickups;
- circles or capsules for player hitbox;
- AABBs/circles for enemies;
- spatial partition only if profiling shows need.

### Entity model

A light ECS is useful but do not over-engineer. Entities can be numeric IDs with component maps, or simple typed objects grouped by system. Prefer the simpler approach until content complexity demands more.

### Content validation

Add tests that fail on:

- duplicate IDs;
- missing unlock references;
- item tags not in registry;
- impossible rarity values;
- ship contract with invalid weapon;
- wave referencing invalid enemy;
- sector referencing invalid boss;
- reward pool with empty eligible results.

### Build/deployment

Use Vite’s default `dist` output and configure the `base` path for project Pages deployment as `'/StarbreakSalvage/'` unless a custom domain/root site changes that. Use GitHub Actions to run checks and deploy the static build.

---

## 11. Milestone roadmap

### M0 — Seed and scaffold

Goal: repository is structured, buildable, testable, and deployable.

Deliverables:

- package scaffold with Vite/TypeScript;
- `AGENTS.md` and docs committed;
- CI workflow for typecheck/lint/test/build;
- Pages workflow for main branch;
- placeholder page loads with title and canvas;
- basic README with controls and local dev commands.

Exit criteria:

- `npm run check` passes;
- GitHub Pages workflow can deploy a static placeholder;
- no runtime console errors.

### M1 — Game shell and controls

Goal: playable empty arena with movement and UI shell.

Deliverables:

- game loop;
- input manager;
- canvas renderer;
- menu → run start → pause → summary flow;
- keyboard controls;
- basic player ship with movement bounds;
- debug overlay for FPS, seed, entity count.

Exit criteria:

- player moves smoothly;
- pause works;
- E2E test can open page and start a run.

### M2 — Combat prototype

Goal: combat feels responsive.

Deliverables:

- primary fire;
- enemy spawning;
- projectile movement;
- collision;
- damage/death;
- pickups;
- first enemy patterns;
- first boss prototype;
- screen shake/hit flash/audio placeholders.

Exit criteria:

- player can kill enemies and die;
- one boss can be defeated;
- performance stays stable with target entity counts.

### M3 — Roguelike run loop

Goal: runs become replayable.

Deliverables:

- seeded run generation;
- three starting contracts;
- rewards and route cards;
- shops;
- 15–20 items;
- item hooks/tags;
- sector transitions;
- run summary;
- local save and unlock skeleton.

Exit criteria:

- same seed produces same starting contracts and route/reward sequence;
- death returns to summary;
- unlock is persisted locally.

### M4 — Content alpha

Goal: enough content for repeated play.

Deliverables:

- 5–8 ship contracts;
- 35–50 items;
- 4 enemy factions;
- 5 sectors;
- 5 bosses;
- 10+ achievements/unlocks;
- balance pass for first 10 minutes.

Exit criteria:

- at least three viable build archetypes;
- no hard blocker content bugs;
- content validation tests cover all tables.

### M5 — UX, accessibility, audio, polish

Goal: make it feel like a public game.

Deliverables:

- settings menu;
- remappable controls;
- reduced motion;
- bullet contrast options;
- full pause/options flow;
- save import/export;
- tutorial tips;
- original sound effects/music loops or high-quality placeholders;
- title screen and game over polish.

Exit criteria:

- new player can understand controls and progression;
- mute/reduced motion work;
- build passes all smoke tests.

### M6 — Public release candidate

Goal: shippable GitHub Pages release.

Deliverables:

- release checklist;
- balanced v1 content;
- README and credits;
- license notices;
- browser smoke matrix;
- optimized assets;
- production Pages deployment;
- versioned changelog.

Exit criteria:

- playable from public URL;
- no known severe blockers;
- reproducible build/deploy.

### M7 — Post-launch expansion

Goal: deepen replay value.

Options:

- daily/weekly seeds;
- challenge modifiers;
- additional factions;
- alternate final bosses;
- more cursed relics;
- cosmetic unlocks;
- optional local-only scoreboards;
- mobile/touch controls;
- mod/content JSON import.

---

## 12. Agent team plan

### Orchestrator agent

Owns repo direction, task splitting, final integration, and PR review. Ensures agents read `AGENTS.md`, avoid scope creep, and run checks.

### Scaffolding/build agent

Creates and maintains Vite/TypeScript, CI, Pages deployment, linting, formatting, test commands, and package scripts.

### Engine agent

Owns loop, input, scene manager, RNG, collision primitives, entity/world model, and performance instrumentation.

### Gameplay systems agent

Owns player, weapons, projectiles, enemy behaviors, pickups, bosses, rewards, shops, and run transitions.

### Content/design agent

Owns ships, items, factions, wave data, boss patterns, unlocks, flavor text, balance notes, and content validation.

### UI/UX/accessibility agent

Owns menus, settings, control remapping, pause, reward screens, run summaries, seed entry/share, contrast/reduced motion options.

### Audio/VFX agent

Owns original placeholder art/audio generation, particles, hit flashes, explosions, screen shake, mix controls, and visual readability.

### QA/release agent

Owns unit/E2E tests, deterministic snapshots, browser smoke checks, performance test scenes, release checklist, and changelog hygiene.

---

## 13. Parallelization plan

### Good parallel tasks

- Engine loop and input can happen alongside content data schemas.
- UI menu shell can happen alongside combat prototype if scene boundaries are agreed.
- CI/Pages setup can happen immediately.
- Content validation tests can happen before full combat.
- Save system can happen once unlock IDs are defined.

### Risky parallel tasks

- Multiple agents editing `RunState`, `World`, or `Generation` simultaneously.
- Multiple agents editing item hook ordering.
- UI scene work during scene manager refactors.
- Balance pass while core damage formulas are still changing.

### Integration order

1. Scaffold.
2. Core loop/input/render.
3. Content schema/RNG/generation tests.
4. Combat entities/collision.
5. Run generation/rewards.
6. Persistence/unlocks.
7. UI polish/audio/accessibility.
8. Release hardening.

---

## 14. Seeded Codex work orders

Use these as task prompts. Each agent should inspect the repo first, make a brief plan, implement, test, and summarize.

### Work order 001 — Greenfield scaffold

> Read `AGENTS.md` and `docs/STARBREAK_SALVAGE_AGENT_SEED.md`. The repo is greenfield. Create a Vite + TypeScript browser game scaffold for Starbreak Salvage. Add package scripts for dev/build/preview/test/lint/format/check. Add a canvas placeholder page with title, start button, and static background. Add basic README. Add CI workflow that runs check. Add GitHub Pages workflow that builds `dist`. Run checks and summarize.

### Work order 002 — Game loop/input/scene shell

> Implement the core game loop, fixed-step update, input manager, scene manager, and canvas renderer. Add MainMenu, Gameplay, Pause, and RunSummary placeholder scenes. Support keyboard movement and pause. Add FPS/entity debug overlay behind a debug flag. Add unit tests for loop helpers and input mapping where practical. Run checks.

### Work order 003 — Seeded RNG and run generation

> Implement seed string parsing, forkable RNG streams, deterministic choice/shuffle helpers, and run generation that produces three starting contracts and a five-sector route skeleton. Add deterministic snapshot tests proving identical seeds produce identical outputs and different seeds vary. Do not use `Math.random()` in generation.

### Work order 004 — Combat MVP

> Implement player movement bounds, primary fire, enemies, projectiles, collisions, health, death, simple pickups, and one basic wave schedule. Keep visual assets as original generated placeholders. Add tests for collision and damage logic. Add a manual debug seed that starts directly in combat.

### Work order 005 — Item hooks and first synergies

> Implement item definitions, tags, deterministic reward selection, and an event-hook modifier pipeline. Add at least 12 starter items and 4 synergies: split+arc, missile+overkill, shield+revenge, drone+copy. Add content validation tests for duplicate IDs and invalid tags.

### Work order 006 — Sector/reward/shop loop

> Implement sector completion, route cards, reward choices, basic shop, credits, and sector transition UI. Ensure the run seed controls rewards and shops. Add tests for deterministic route/reward/shop generation.

### Work order 007 — Boss and faction alpha

> Add three factions and three bosses with distinct readable patterns. Build content data so each sector chooses a faction and boss variant from deterministic pools. Add debug shortcuts for boss testing. Add performance notes for projectile counts.

### Work order 008 — Save/unlock progression

> Add versioned localStorage save data, import/export, unlock definitions, achievements, run summary stats, and save migrations. Add tests for save migration and unlock evaluation. Ensure corrupted save data fails safely and offers reset/import.

### Work order 009 — Accessibility and settings

> Add settings for remappable controls, volume/mute, reduced motion, screen shake strength, bullet contrast, fullscreen, and performance mode. Ensure pause can be opened with keyboard and gamepad-ready input names are abstracted. Add E2E smoke coverage for settings persistence.

### Work order 010 — Release hardening

> Audit content, test coverage, build, asset sizes, README, license, credits, Pages deployment, browser smoke tests, and run summary/shareable seed. Fix blockers only. Produce a release checklist and changelog entry.

---

## 15. GitHub issue seed backlog

### Epic A — Project foundation

- A1: Add AGENTS.md and docs.
- A2: Scaffold Vite/TypeScript app.
- A3: Add lint/format/typecheck/test/build scripts.
- A4: Add CI workflow.
- A5: Add Pages deployment workflow.
- A6: Add README with local dev and controls.

### Epic B — Core engine

- B1: Fixed timestep game loop.
- B2: Canvas renderer and resize handling.
- B3: Input manager with key rebinding model.
- B4: Scene manager.
- B5: Debug overlay.
- B6: RNG utility with deterministic tests.
- B7: Collision primitives.
- B8: Lightweight world/entity model.

### Epic C — Gameplay MVP

- C1: Player movement and bounds.
- C2: Primary weapon fire.
- C3: Projectile lifecycle.
- C4: Enemy spawner.
- C5: Basic enemy movement patterns.
- C6: Damage, death, explosions.
- C7: Pickups and credits.
- C8: One boss prototype.

### Epic D — Roguelike systems

- D1: Seeded run generator.
- D2: Contract selection.
- D3: Sector route cards.
- D4: Reward screen.
- D5: Item system.
- D6: Synergy hook pipeline.
- D7: Shop system.
- D8: Run summary.

### Epic E — Content alpha

- E1: 8 ship contracts.
- E2: 50 items.
- E3: 4 factions.
- E4: 5 sector hazards.
- E5: 5 bosses.
- E6: 10 unlocks.
- E7: Lore/flavor text pass.
- E8: Balance pass.

### Epic F — Persistence and meta progression

- F1: Save data model.
- F2: LocalStorage persistence.
- F3: Save migrations.
- F4: Import/export.
- F5: Achievements.
- F6: Unlock UI.

### Epic G — UX, polish, accessibility

- G1: Main menu.
- G2: Settings menu.
- G3: Pause menu.
- G4: Seed entry/share UI.
- G5: Reduced motion.
- G6: Bullet contrast options.
- G7: Audio controls.
- G8: Tutorial hints.

### Epic H — QA/release

- H1: Unit tests for core utilities.
- H2: Deterministic generation snapshots.
- H3: Content validation suite.
- H4: Playwright smoke tests.
- H5: Browser smoke matrix.
- H6: Performance debug scene.
- H7: Release checklist.
- H8: Changelog/versioning.

---

## 16. Testing strategy

### Unit tests

Focus on pure logic:

- RNG;
- content validation;
- run generation;
- reward selection;
- collision;
- damage formulas;
- item hook order;
- save migration;
- unlock conditions.

### Deterministic tests

Create snapshot-like tests for seeds:

- `LASER-TAX-404`;
- `ORBITAL-JUNK-PROPHET`;
- `VOID-CORSAIR-7`;
- `STARBREAK-SMOKE`.

Do not snapshot the whole simulation unless it is stable and valuable. Snapshot generated choices and content schedule first.

### E2E smoke tests

With Playwright:

- page loads without console errors;
- main menu appears;
- start run opens contract selection;
- seed entry accepts known seed;
- player can start gameplay;
- pause menu opens/closes;
- settings persist;
- run summary appears after forced death/debug command.

### Manual smoke checklist

- Chrome: start run, fight, pause, die, summary.
- Firefox: same.
- Safari/WebKit: same if available.
- Keyboard only navigation.
- Mute and reduced motion.
- Fresh save and existing save migration.
- GitHub Pages production URL loads assets with correct base path.

---

## 17. Balancing model

### Damage language

Keep numbers legible:

- player hull: 3–8 units;
- shield: 0–6 units;
- small enemies: 1–5 HP;
- elites: 20–80 HP;
- bosses: phase-based rather than huge single bars.

### Item rarity

- Common: simple numerical or behavior modifiers.
- Uncommon: tag interactions.
- Rare: build-defining hooks.
- Prototype: strong with malfunction/drawback.
- Cursed: power with constraint or future payoff.

### Build archetypes

At alpha, support at least:

- Laser/split/arc crowd clear.
- Missile/overkill/economy burst.
- Drone/orbital minion scaling.
- Shield/revenge tank.
- Phase/graze mobility.
- Curse/relic high risk.

### Anti-degenerate rules

- Cap recursive projectile spawning by generation depth or proc budget.
- Use per-second proc limits for chain effects.
- Keep item hook order deterministic.
- Show clear UI explanations for major triggered effects.
- Never let VFX hide lethal bullets for long.

---

## 18. UX and accessibility requirements

### Baseline controls

- Move: Arrow keys or WASD.
- Fire: Space or hold primary fire key.
- Special: Shift or right hand alternative.
- Bomb: X or alternate key.
- Pause: Escape/P.
- Confirm: Enter/Space.
- Back: Escape/Backspace.

### Settings

- Master volume.
- Music volume.
- SFX volume.
- Mute.
- Screen shake intensity.
- Reduced motion.
- Bullet contrast.
- Flash reduction.
- Control remapping.
- Fullscreen.
- Performance mode.

### Visual readability

- Enemy bullets must use a consistent color family distinct from pickups and player shots.
- Player hitbox should be visibly suggested, especially during focus/slow movement if added.
- Boss telegraphs must precede high-damage attacks.
- Avoid long white flashes.
- Maintain contrast on both dark and bright sector backgrounds.

---

## 19. Deployment plan

### Static hosting

The game should be a static site with HTML/CSS/JS/assets. Vite builds to `dist` by default. GitHub Pages can deploy static site artifacts from GitHub Actions.

### Vite base path

For the project repository `regillmore/StarbreakSalvage`, configure:

```ts
// vite.config.ts
export default defineConfig({
  base: '/StarbreakSalvage/',
});
```

If the site is later moved to a custom domain or an owner root site, revisit this base path.

### CI

`ci.yml` should run on PR and main pushes:

- install dependencies with `npm ci`;
- typecheck;
- lint;
- unit tests;
- build.

### Pages

`pages.yml` should run on main pushes and manual dispatch:

- checkout;
- setup Node;
- `npm ci`;
- `npm run build`;
- upload `dist` artifact;
- deploy artifact to Pages.

---

## 20. Release checklist

- [ ] Public URL loads.
- [ ] No console errors on load/start/pause/death.
- [ ] GitHub Pages asset paths correct.
- [ ] README includes how to play, controls, local dev, license, credits.
- [ ] No copied commercial assets.
- [ ] `npm run check` passes.
- [ ] Playwright smoke tests pass.
- [ ] Save reset/import/export works.
- [ ] Reduced motion and mute work.
- [ ] At least 5 contracts, 30 items, 3 factions, 3 bosses in release candidate.
- [ ] Seed sharing documented.
- [ ] Version and changelog updated.

---

## 21. Initial seed data

Use these seeds for testing and demos:

- `LASER-TAX-404` — should favor Debt Runner, laser/split economy choices, Auditor Drone XL early.
- `ORBITAL-JUNK-PROPHET` — should favor relic/cursed content and vault routes.
- `VOID-CORSAIR-7` — should favor pirate/convoy/shop routes.
- `STARBREAK-SMOKE` — stable smoke test seed with basic contract options and forgiving first sector.
- `BLOOM-ENGINE-ALPHA` — Bio-Machine sector/boss test.

---

## 22. First implementation slice

The first PR should not try to create the whole game. It should establish the foundation:

1. Add this seed documentation.
2. Initialize Vite + TypeScript.
3. Add scripts and CI.
4. Add Pages workflow.
5. Render a placeholder title screen and canvas.
6. Add a tiny smoke test or unit test.
7. Confirm production build.

Everything else should be built in focused, reviewable slices.

---

## 23. Open questions for later, not blockers

- Should player auto-fire by default or hold-to-fire?
- Should focus/slow movement exist?
- Should ships have distinct hitbox sizes?
- Should run extraction be voluntary after each sector?
- Should daily seeds be local date-based only, or curated in code?
- Should content be moddable through JSON import?
- Should there be a local leaderboard?
- Should there be a separate “classic arcade” mode with no unlocks?

These should not block M0–M2.

---

## 24. Reference notes

- GitHub Pages supports static HTML/CSS/JS from a repository and can run a build process before publishing.
- Vite static deploy docs recommend `base: '/<REPO>/'` for project Pages URLs and `npm run build` output to `dist` by default.
- Codex reads repository `AGENTS.md` files as project instructions.
- Codex subagent workflows should be requested explicitly and are useful for separate review concerns.
