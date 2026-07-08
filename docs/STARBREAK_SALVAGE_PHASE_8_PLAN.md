# Starbreak Salvage - Phase 8 Plan

## Current State

Phase 7 concluded with a stronger enemy baseline: role metadata, role-specific movement and attacks, seeded upgraded variants, deterministic formations, longer-sector pacing arcs, enemy-rich debug smoke, and a fix for hidden boss-arena hazards becoming damaging without a fresh post-boss warning.

The game now scrolls, fights, rewards, and scales more consistently, but the environmental layer is still thin. Hazards exist as sparse distance windows, landmarks mostly provide visual rhythm, destructible clutter is not yet a first-class system, and loose currency is mostly tied to defeat/reward flow rather than moment-to-moment navigation. Phase 8 should make sectors feel more physical and profitable without hiding bullets, blocking fair movement, or breaking deterministic content generation.

## Phase 8 Product Goal

Turn the scrolling sector environment into a readable, deterministic play layer. Hazard zones should have richer timing and identity, obstacles and destructibles should create short tactical choices, and loose currency should reward risky positioning while staying bounded, visible, and fair.

## Phase 8 Pillars

1. **Readable Environmental Danger** - every hazard and obstacle should have a distinct telegraph, active state, damage rule, and high-contrast/reduced-motion treatment.
2. **Deterministic Terrain Economy** - hazards, destructibles, obstacles, and loose currency scatter must reproduce from seed plus save state and sector context.
3. **Fair Navigation Pressure** - obstacles and hazard zones can shape lanes, but they must not create unavoidable damage, blocked exits, or viewport-specific difficulty.
4. **Interactive Salvage Flow** - destructibles and loose currency should create quick risk/reward decisions instead of becoming background decoration.
5. **Bounded Visual Noise** - environmental features must stay below bullets and core actors in readability priority, with explicit counts in debug/performance notes before density increases.
6. **Content-Driven Growth** - new environmental content should live in small data tables or registries with validation, tests, and stable IDs.

## Design Targets

- Add a richer hazard-zone taxonomy with phase timing, telegraph language, damage windows, safe-lane expectations, sector/faction fit, and accessibility metadata.
- Integrate hazard-zone selection with sector pacing, route pressure, lunar/background context, and boss-arena release safety.
- Add destructible and obstacle definitions for debris, cargo pods, shield gates, rock fields, surface pylons, wreck plates, and volatile salvage caches.
- Keep obstacle placement in fixed 640x720 combat-world units, independent from viewport size.
- Route destructible kills, chain reactions, item hooks, rewards, and objective policy through shared deterministic systems.
- Add loose currency scatter patterns, pickup drift, magnet pull, cap rules, debug counters, and summary/economy notes.
- Extend smoke/debug tooling so environmental stress can be inspected without relying on private app state.

## Phase 8 Milestones

### P8.1 - Environmental Planning And Schema

Scope:

- Audit current hazard, landmark, pickup, feature, wave, item, and debug systems.
- Define the content contracts for richer hazard zones, destructibles, obstacles, and loose currency.
- Identify which pieces can reuse current sector feature planning versus which need new modules.

Exit criteria:

- Phase 8 docs, backlog, and work orders are refreshed.
- Hazard, destructible, obstacle, and loose currency schema targets are clear before implementation.
- The plan preserves deterministic generation, fixed-world layout parity, and boss-release hazard fairness.

Status: started by work order 071 and advanced by work order 072. Phase 8 planning is refreshed, and the first hazard-zone schema/registry now covers existing hazards, validation, timing metadata, readability metadata, and boss-arena suppression behavior. Destructible/obstacle and loose-currency schema work remains planned for later Phase 8 work orders.

### P8.2 - Richer Hazard Zones

Scope:

- Expand hazard zones beyond simple sparse lanes into multi-phase patterns such as sweep beams, pulsing fields, drifting mine bands, collapsing columns, orbital shadows, plasma curtains, and dust fronts.
- Add hazard director rules that schedule environmental pressure around sector pacing, relief windows, formation beats, route pressure, and boss handoffs.
- Keep telegraphs visible and damage windows fair in high-contrast, reduced-motion, performance, and narrow layouts.

Exit criteria:

- Hazard definitions validate phase timing, telegraph length, active damage shape, accessibility variants, and sector/faction fit.
- Hazard scheduling is deterministic and frame-catchup safe.
- Boss arena release cannot convert a hidden warning into instant damage.

Status: started by work order 073. The first richer behavior library now covers existing hazards with behavior metadata for sweep beams, pulse fields, drifting mine bands, collapsing columns, orbital shadows, plasma curtains, dust fronts, and static warning gates. Runtime helpers derive settings-aware presentation, active damage windows, cooldown-aware collision, cleanup, and fixed-world damage rectangles from the registry. Hazard director scheduling, pressure/relief integration, and richer boss-release schedule handling remain planned for work order 074.

### P8.3 - Destructibles And Obstacles

Scope:

- Add destructible and obstacle content definitions with collision shape, hull, damage rules, reward table, chain behavior, rendering cue, and objective policy.
- Place obstacles deterministically along the scroll path without creating unavoidable walls or blocked safe lanes.
- Connect destructibles to pickups, item hooks, audio/VFX, and debug summaries.

Exit criteria:

- Destructibles can be damaged, destroyed, rewarded, and cleaned up without desyncing objective progress.
- Obstacles use fixed combat-world coordinates and validate lane safety.
- Dense obstacle/destructible scenarios stay within performance and readability budgets.

Status: planned for work orders 075, 076, and 077.

### P8.4 - Loose Currency And Salvage Lanes

Scope:

- Add loose scrap/credit scatter patterns that can appear from waves, destructibles, route events, hazard-risk lanes, and sector features.
- Define pickup attraction, drift, lifetime, caps, and collection feedback.
- Surface earned, missed, and banked currency context where useful without cluttering combat.

Exit criteria:

- Loose currency is deterministic, capped, and visible in debug.
- Pickup magnet behavior is tested and settings-aware.
- Economy tuning remains conservative and does not inflate banked scrap beyond upgrade pacing.

Status: planned for work order 078.

### P8.5 - Environmental Stress And Release Candidate

Scope:

- Add environmental debug/smoke paths for hazard-heavy, obstacle-heavy, destructible-rich, and loose-currency-rich sectors.
- Check high contrast, reduced motion, performance mode, narrow viewport, boss arena release, item-storm interactions, and long-sector travel.
- Update release, QA, performance, backlog, README, changelog, and architecture notes before closeout.

Exit criteria:

- `npm run check`, Playwright smoke where available, and production preview smoke pass for the Phase 8 candidate.
- Environmental counters expose active hazard zones, destructibles/obstacles, loose currency count/value, and stress caps.
- Known balance, readability, economy, and manual browser risks are documented.

Status: planned for work orders 079 and 080.

## Recommended Phase 8 Sequence

1. Work order 071 - Phase 8 environmental planning refresh.
2. Work order 072 - Hazard-zone schema and current-feature audit.
3. Work order 073 - Rich hazard-zone behavior library.
4. Work order 074 - Hazard director, pacing integration, and boss-release safety.
5. Work order 075 - Destructible and obstacle content schema.
6. Work order 076 - Destructible interactions, rewards, and chain reactions.
7. Work order 077 - Obstacle layouts, lane safety, and navigation pressure.
8. Work order 078 - Loose currency scatter, pickup attraction, and economy feedback.
9. Work order 079 - Environmental debug smoke, accessibility, and performance hardening.
10. Work order 080 - Phase 8 environmental playtest release hardening.

## Phase 8 Definition Of Done

Phase 8 is done when sectors can present richer hazard zones, deterministic obstacles/destructibles, and loose currency lanes as a readable environmental layer; every new feature is generated from seed plus save/sector context; obstacles and hazards respect fixed-world viewport parity; currency pickups are capped and explainable; boss-release hazard fairness remains protected; debug/browser smoke can inspect environmental pressure; and release docs capture the remaining balance, economy, performance, and cross-browser risks.
