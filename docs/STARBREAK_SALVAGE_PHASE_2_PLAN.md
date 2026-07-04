# Starbreak Salvage - Phase 2 Plan

## Phase 1 Conclusion

Phase 1 established a deployed, static, browser-playable alpha foundation:

- Vite, TypeScript, Canvas 2D, CI, and GitHub Pages deployment.
- Fixed-step loop, scene manager, input abstraction, settings, save data, and E2E smoke.
- Seeded run generation with contracts, sectors, route cards, rewards, shops, and summaries.
- Combat MVP with projectiles, enemies, pickups, damage, bosses, item hooks, unlocks, and first-pass procedural audio/VFX.
- Release metadata: README, license, credits, changelog, and release checklist.

Phase 1 is complete because the game builds, deploys, loads, starts a run, records progress, and has a maintainable deterministic spine. It is not yet a cohesive game because the run arc, sector objectives, player verbs, boss phases, content volume, unlock gating, and onboarding all needed a durable second pass.

## Phase 2 Product Goal

Turn the Phase 1 alpha into a cohesive vertical slice that can support repeated complete runs:

- a full five-sector run with meaningful sector objectives and a clear win/loss arc;
- player verbs beyond move/fire, including special, bomb, and graze;
- ship stats, weapon families, and item archetypes that materially change play;
- boss phases and faction pressure that create readable escalation;
- unlocks that actually widen future run variety;
- onboarding, HUD, balance, and QA strong enough for public playtesting.

## Phase 2 Pillars

1. **Complete-run coherence** - the player should understand why a sector ends, why a route matters, and what winning means.
2. **Expressive verbs** - special, bomb, graze, ship stats, and weapon identities should be visible and worth mastering.
3. **Content with contracts** - new ships/items/factions/bosses must have tests, validation, and at least one reason to exist in build-crafting.
4. **Readable escalation** - later sectors and bosses should become harder through patterns, pacing, and combinations, not unreadable clutter.
5. **Unlock variety** - permanent progress should add choices and challenge modes, not flat stat upgrades.
6. **Playtest-ready QA** - every feature slice should leave deterministic tests, smoke coverage, and notes for balance risks.

## Current Alpha Inventory

- Ships/contracts: 8 defined.
- Items: 30 defined across 8 archetype targets.
- Factions: 4 defined.
- Bosses: 5 defined, each with phase behavior across 3 active attack patterns.
- Sectors: 5 defined.
- Unlocks: 10 defined.
- Major gaps: no in-menu seed entry, no real tutorial/onboarding, route/event balance depth, and limited encounter-role depth. Sector objectives/wave direction, first-pass special/bomb/graze verbs, contract-specific ship/weapon identity, boss phases, deterministic route outcomes, content expansion, unlock gating, and final victory summary now exist, but still need balance and UX depth.

## Phase 2 Milestones

### P2.1 - Run Arc Foundation

Build real sector objectives and a wave director. Replace the one-kill clear with sector progress, wave completion, boss gates, and win/loss flow.

Exit criteria:

- A run can progress through all five sectors.
- Sector completion is based on data-driven objectives, not a temporary debug threshold.
- Same seed reproduces objectives, waves, boss timing, route choices, rewards, and shop inventory.

### P2.2 - Player Verb Pass

Make the control set real: special ability, bomb, graze, and ship stat differences.

Exit criteria:

- Special and bomb have visible charge/cooldown UI and affect combat.
- Graze has deterministic scoring/charge behavior.
- At least three contracts feel mechanically distinct in normal play.

### P2.3 - Enemy/Boss Escalation

Turn factions and bosses into a readable campaign curve.

Exit criteria:

- Five bosses have at least two phases or phase-like behavior.
- Faction behavior changes are visible and tested.
- Final sector has a distinct final-boss flow and victory summary.

Status: first-pass boss phases and victory summary are implemented; a fourth faction now has distinct movement, bullets, visuals, and a boss reference. Broader encounter-role depth remains a follow-up.

### P2.4 - Content Expansion

Grow the item and encounter pool while preserving validation.

Exit criteria:

- At least 30 items and 4 factions ship.
- At least 6 build archetypes are supported.
- Content validation catches duplicate IDs, invalid references, invalid pools, and missing implementation hooks.

Status: first-pass route outcomes are implemented for all existing route kinds. The item table now ships 30 items, 4 factions, 8 archetype targets, reward-pool placement checks, and hook-implementation validation; balance tuning remains a follow-up.

### P2.5 - Meta and UX Depth

Make unlocks, seed entry, onboarding, HUD, and run summary feel intentional.

Exit criteria:

- Unlocks gate future run options.
- Main menu supports seed entry, not only URL parameters.
- HUD explains current weapon, special/bomb charge, sector progress, and build summary.
- Summary explains why unlocks happened.

Status: first-pass unlock gating is implemented for future contract boards, item rewards/shops, faction and boss generation, challenge seed flags, boss-practice flags, and music flags. In-menu seed entry, onboarding, and richer HUD/summary work remain follow-ups.

### P2.6 - Playtest Candidate

Harden Phase 2 into a public playtest build.

Exit criteria:

- Full `npm run check` and Playwright smoke pass.
- Manual browser smoke matrix is updated.
- Performance/debug notes cover dense combat.
- Known balance risks and follow-up issues are documented.

## Recommended Phase 2 Sequence

1. Work order 011 - Phase 2 planning refresh.
2. Work order 012 - Sector objectives and wave director.
3. Work order 013 - Special, bomb, and graze.
4. Work order 014 - Ship stats and weapon identity.
5. Work order 015 - Boss phases and victory path.
6. Work order 016 - Route/event depth.
7. Work order 017 - Content expansion pack.
8. Work order 018 - Unlock gating and meta variety.
9. Work order 019 - Onboarding, HUD, and seed entry.
10. Work order 020 - Balance, performance, and playtest release.

## Phase 2 Definition of Done

Phase 2 is done when a new player can load the deployed page, enter or accept a seed, choose a contract, play a complete multi-sector run, use special/bomb/graze intentionally, build around item synergies, defeat or die to a final boss, earn unlocks that change future options, and replay/share the seed with stable deterministic content.
