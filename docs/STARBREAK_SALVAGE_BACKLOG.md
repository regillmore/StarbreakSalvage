# Starbreak Salvage — Backlog Seed

## Labels

- `type:epic`
- `type:feature`
- `type:bug`
- `type:test`
- `type:docs`
- `area:engine`
- `area:gameplay`
- `area:content`
- `area:ui`
- `area:audio-vfx`
- `area:accessibility`
- `area:build-release`
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `agent-ready`
- `needs-design`
- `good-first-agent-task`

## Epic A — Foundation

### A1 — Add seed docs and AGENTS.md

Acceptance:

- Root `AGENTS.md` exists.
- Docs are in `docs/`.
- README points agents to docs.

### A2 — Scaffold Vite/TypeScript app

Acceptance:

- `npm run dev` starts.
- `npm run build` outputs `dist`.
- Placeholder title screen appears.

### A3 — Add CI and Pages workflows

Acceptance:

- CI runs on PR/main.
- Pages workflow deploys from `dist` on main.
- Vite base path is `/StarbreakSalvage/`.

## Epic B — Engine

### B1 — Fixed-step loop

Acceptance:

- Simulation updates with fixed dt.
- Frame delta is clamped.
- Pause stops simulation.

### B2 — Input manager

Acceptance:

- Action abstraction exists.
- WASD and arrows mapped.
- Settings-ready binding model exists.

### B3 — Scene manager

Acceptance:

- Main menu, contract select, gameplay, pause, summary scenes exist.
- Transitions are explicit.

### B4 — RNG utility

Acceptance:

- Seed string creates stable state.
- `choice`, `shuffle`, `weightedChoice`, and `fork` tested.

## Epic C — Combat

### C1 — Player movement

Acceptance:

- Player stays in bounds.
- Movement is framerate independent.
- Speed can be modified by ship stats.

### C2 — Weapon/projectile system

Acceptance:

- Primary fire emits projectiles.
- Projectile lifetime managed.
- Fire rate and damage are data-driven.

### C3 — Enemy system

Acceptance:

- Enemies spawn from wave data.
- Basic movement patterns exist.
- Enemy death can drop pickups.

### C4 — Collision/damage

Acceptance:

- Player/enemy/projectile collisions work.
- Tests cover core collision primitives.

### C5 — Boss prototype

Acceptance:

- Boss has phases and readable telegraphs.
- Boss can be defeated.

## Epic D — Roguelike systems

### D1 — Contract selection

Acceptance:

- Three seeded contract choices.
- Contract includes hull, weapon, perk, drawback.

### D2 — Item definitions and hooks

Acceptance:

- Items have tags and hook handlers.
- Acquisition order controls hook order.
- Recursive proc limit exists.

### D3 — Reward generation

Acceptance:

- Reward choices are seeded.
- Rarity and item pool respected.

### D4 — Route cards

Acceptance:

- Route choices are seeded.
- Shop/elite/vault/repair/glitch route types exist.

### D5 — Shop

Acceptance:

- Credits can buy items/repairs/rerolls.
- Shop inventory is seeded.

## Epic E — Content

### E1 — Add 8 contracts

Acceptance:

- All contracts validate.
- Each has a distinct play bias.

### E2 — Add 50 items

Acceptance:

- All items validate.
- At least 6 build archetypes supported.

### E3 — Add 4 factions

Acceptance:

- Each faction has distinct enemy behaviors and visuals.

### E4 — Add 5 bosses

Acceptance:

- Each boss has at least 2 phases.
- Telegraphs are readable.

## Epic F — Save/unlocks

### F1 — Versioned save

Acceptance:

- LocalStorage save loads/saves safely.
- Corrupted save does not crash.

### F2 — Unlock conditions

Acceptance:

- At least 10 unlocks.
- Unlocks appear in run summary.

### F3 — Import/export

Acceptance:

- Save can be exported as text.
- Save can be imported after reset.

## Epic G — UX/accessibility

### G1 — Settings menu

Acceptance:

- Volume/mute, screen shake, reduced motion, bullet contrast settings exist.

### G2 — Remappable controls

Acceptance:

- Key bindings can be changed and persisted.

### G3 — Run summary

Acceptance:

- Summary shows seed, contract, sector, kills, items, salvage, unlocks.

### G4 — Seed sharing

Acceptance:

- Seed can be copied from summary.
- Seed can be entered from menu.

## Epic H — QA/release

### H1 — Deterministic tests

Acceptance:

- Known seeds snapshot contracts/routes/rewards.

### H2 — Content validation

Acceptance:

- Duplicate IDs fail tests.
- Missing references fail tests.

### H3 — E2E smoke

Acceptance:

- Page load, start run, pause, settings, forced death/summary are covered.

### H4 — Release checklist

Acceptance:

- README/license/credits/changelog/browser smoke documented.

## Phase 2 backlog additions

Phase 2 starts after M10 and the first-pass procedural audio/VFX follow-up. The goal is a cohesive public playtest slice, not just a scaffold.

## Epic I - Run arc and sector objectives

### I1 - Wave director

Acceptance:

- Sector waves are generated from data.
- Wave completion and boss gates replace the one-kill clear.
- Known seeds reproduce wave timing and major wave labels.

### I2 - Sector objectives

Acceptance:

- Objective types exist for clear waves, survive timer, defeat boss, collect salvage, and elite encounter.
- HUD shows objective progress.
- Objective completion is tested.

### I3 - Victory and loss flow

Acceptance:

- Final boss defeat produces a victory summary.
- Death, abandon, debug, sector complete, and victory have distinct result reasons.
- Save records preserve win/loss summary data.

## Epic J - Player verbs and contract identity

### J1 - Special ability

Acceptance:

- Special action has charge/cooldown state.
- At least three contracts have distinct special behavior or modifiers.
- HUD and tests cover special charge.

### J2 - Bomb

Acceptance:

- Bomb action clears or mitigates danger.
- Bomb charges are limited and visible.
- Bomb respects reduced motion and audio settings.

### J3 - Graze

Acceptance:

- Near-miss detection exists for enemy bullets.
- Graze rewards charge or salvage without using `Math.random()`.
- Graze is readable and tested.

### J4 - Ship stats

Acceptance:

- Ship content controls hull, speed, hit radius, pickup pull, special rate, bomb count, and starting economy.
- Content validation rejects invalid stat ranges.
- Contract selection preview shows key stats.

## Epic K - Bosses, factions, and encounter pressure

### K1 - Boss phases

Acceptance:

- Five bosses have at least two phases or phase-like behavior.
- Phase transitions are deterministic and readable.
- Boss tests cover phase thresholds.

### K2 - Faction expansion

Acceptance:

- At least four factions exist.
- Each faction has distinct movement, projectile, and visual behavior.
- Sector generation references factions deterministically.

Status:

- First pass implemented with Void Corsairs, phase-skirmish enemy behavior, needle visuals, faction-biased rewards, and a Warranty Void Seraph boss reference.

### K3 - Encounter roles

Acceptance:

- Basic, elite, ambush, and boss encounters have distinct pressure.
- Debug shortcuts can launch representative encounters.
- Performance notes document projectile budgets.

## Epic L - Content and build crafting

### L1 - Item expansion

Acceptance:

- At least 30 items exist.
- Every item has tags, rarity, effect text, reward-pool placement, and hook behavior where needed.
- Validation catches missing hook implementations.

Status:

- First pass implemented with 30 total items, expanded starter/combat/vault pools, effect text, hook behavior, and validation for missing hook implementations.

### L2 - Build archetypes

Acceptance:

- At least 6 archetypes are supported: laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic.
- Reward generation can bias toward contract item tags.
- Summary displays active build identity or key items.

Status:

- First pass supports 8 archetype targets in item validation: laser/split, missile/overkill, drone/copy, shield/revenge, credit/shop, curse/relic, phase/graze, and heat/prototype.

### L3 - Route events

Acceptance:

- Shop, elite, vault, repair, glitch, and faction ambush routes have distinct outcomes.
- Route events are deterministic and logged in summary.
- Tests cover known-seed route outcomes.

Status:

- First pass implemented with deterministic economy, reward, shop, hull, curse/relic, and next-sector combat modifiers.
- Follow-up balance should tune costs, risks, reward weights, and event copy after playtesting.

## Epic M - Meta progression and replay

### M1 - Unlock gating

Acceptance:

- Unlocks alter future ship/item/faction/boss/challenge pools.
- Fresh saves still have enough content for complete runs.
- Archive explains what each unlock adds.

Status:

- First pass implemented with save-aware contract boards, item reward/shop filters, faction and boss generation filters, challenge seed flags, boss-practice flags, music flags, and archive grant/effect copy.

### M2 - Challenge seeds

Acceptance:

- Challenge seed definitions exist and are unlockable.
- Challenge modifiers are deterministic and visible before launch.
- Challenge runs record summary metadata.

### M3 - Save migration resilience

Acceptance:

- Any save shape changes include migration tests.
- Import/export remains compatible across Phase 2 save versions.
- Corrupted save/settings data never crashes boot.

## Epic N - UX, onboarding, and accessibility

### N1 - Seed entry

Acceptance:

- Main menu supports seed entry.
- Blank/default/random/known seeds are handled clearly.
- E2E covers seed entry and shared-seed launch.

### N2 - HUD pass

Acceptance:

- HUD shows objective progress, hull, weapon state, special/bomb charge, credits/salvage, boss state, and compact build info.
- HUD text does not overlap on mobile.
- High-contrast bullet mode remains readable.

### N3 - Onboarding hints

Acceptance:

- First-run hints explain movement, fire, special, bomb, graze, routes, rewards, and shops.
- Hints can be dismissed or reduced.
- Keyboard-only flow remains usable.

## Epic O - Audio/VFX/presentation

### O1 - Feedback polish

Acceptance:

- Hit flashes, particles, and screen shake are readable and respect reduced motion/performance settings.
- Audio cue mix respects mute/master volume.
- Effects remain original/generated.

### O2 - Music prototype

Acceptance:

- A tiny original/generated music loop or ambient bed exists.
- Music can be muted or volume-controlled.
- Audio starts only after user gesture.

## Epic P - Playtest release hardening

### P1 - Performance scenarios

Acceptance:

- Dense combat and boss debug scenarios are documented.
- Debug overlay includes projectile and particle counts.
- Normal play remains near 60 FPS on dev machine.

Status:

- First pass implemented with five boss shortcuts and a deterministic dense-combat debug pocket. The overlay currently reports total entity count; separate projectile/particle counters remain a follow-up.

### P2 - Playtest checklist

Acceptance:

- README, changelog, credits, release checklist, and browser smoke matrix are updated.
- `npm run check`, E2E smoke, and production preview smoke pass.
- Known severe blockers are fixed or documented.

Status:

- First pass implemented with automated checks, browser smoke, production preview smoke, known risks, and manual browser gaps documented.
