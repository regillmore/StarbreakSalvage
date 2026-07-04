# Starbreak Salvage - Phase 3 Plan

## Phase 2 Conclusion

Phase 2 is concluded after work order 020 deployment confirmation. It produced a playable, test-covered vertical slice with:

- five-sector run flow, route choice, rewards, shops, boss gates, and final victory;
- special, bomb, graze, contract stats, weapon families, and readable HUD state;
- 30 items, 4 factions, 5 bosses, route events, unlock gating, save/archive support, seed entry, and summary sharing;
- procedural audio/VFX feedback, debug boss/performance scenarios, release docs, and green automated checks.

The game is now structurally playable, but it still does not fully feel like a vertical scrolling shooter. Combat currently happens in a mostly static arena with timed waves. Phase 3 turns forward motion into the central run spine.

## Phase 3 Product Goal

Make Starbreak Salvage feel like a fast, vertical-scrolling sci-fi arcade run: the ship is always pushing deeper into a sector, procedural backgrounds create scale and place, encounters arrive from scroll position and distance, and sector completion usually means surviving a meaningful distance before a route, event, or boss resolution.

The goal is not to copy any specific commercial game. The inspiration is the sensation of classic vertical shooters: momentum, layered environments, readable waves entering from ahead, and bosses that feel like punctuation at the end of a traveled space.

## Phase 3 Pillars

1. **Forward Motion As Structure** - every normal sector should have distance, pacing, and a clear sense that the player is advancing.
2. **Sector Identity Through Space** - background strata, landmarks, hazards, debris density, palette, and enemy timing should distinguish sectors.
3. **Scroll-Synced Encounters** - waves, pickups, hazards, elite pockets, and boss gates should be scheduled by distance as much as by time.
4. **Readable Velocity** - parallax, particle drift, pickup motion, and HUD progress should communicate speed without obscuring bullets.
5. **Deterministic Terrain And Pacing** - same seed and route should reproduce sector length, biome layers, landmarks, hazard lanes, major wave marks, and boss arena timing.
6. **Performance Before Ornament** - scrolling visuals must stay cheap, shape-based/original, and testable before richer art polish.

## Current Gap

The Phase 2 game has deterministic sectors and wave objectives, but the playfield still behaves like a stationary combat box:

- sector completion counts waves/targets rather than traveled distance;
- first-pass backgrounds are now sector-specific and procedurally layered, but landmarks, hazards, and route-conditioned visual motifs remain follow-ups;
- first-pass directed enemy waves are now tied to scroll markers, but pickups, hazards, landmarks, and boss approach gates are still follow-ups;
- bosses spawn into a static field rather than at the end of a traveled sector;
- route/event choices affect future combat but not the physical feeling of the next sector;
- debug tools stress entity counts, but not long-scroll rendering or distance progression.

## Phase 3 Milestones

### P3.1 - Scrolling Foundation

Introduce a deterministic scroll state with distance, speed, sector length, camera offset, and HUD progress.

Exit criteria:

- Gameplay state tracks sector distance traveled in fixed-step simulation.
- Normal sector completion can be driven by distance plus objective gates.
- Same seed and sector produce the same length and scroll pacing.

Status: first pass implemented by work order 021 with deterministic scroll plans, fixed-step distance state, HUD/debug readouts, and subtle scroll offset for the existing starfield. Distance completion gates move into P3.4.

### P3.2 - Procedural Background Identity

Add layered, deterministic, original canvas backgrounds for each sector family.

Exit criteria:

- Each sector renders at least three parallax strata.
- Background landmarks and debris fields are seed-stable.
- Reduced motion/performance mode can simplify scroll visuals.

Status: first pass implemented by work order 022 with deterministic background families, four strata per sector, seed-stable primitives, reduced-motion static offsets, and performance-mode layer reduction. Landmark/hazard scale features remain in P3.5.

### P3.3 - Scroll-Synced Encounter Director

Move major waves and pickup/hazard beats onto distance markers.

Exit criteria:

- Wave director can schedule encounters by distance.
- Existing boss-gate and objective tests cover distance progress.
- Same seed reproduces major encounter marks.

Status: first pass implemented by work order 023. Directed major waves now receive deterministic scroll-distance marks when a sector scroll plan is available, gameplay feeds fixed-step distance into combat spawning, time-based schedules remain as a fallback, and tests cover known-seed marks, spawn order, and frame-stutter duplicate prevention. Pickup beats, hazard windows, and boss approach gates remain later Phase 3 work.

### P3.4 - Distance Objectives And Sector Endings

Make survival distance the default sector objective while preserving boss and special cases.

Exit criteria:

- HUD shows traveled distance and remaining sector objective clearly.
- Completing a sector normally means reaching the exit distance after required gates.
- Summary records distance survived/reached.

### P3.5 - Hazards, Landmarks, And Scale

Add non-enemy sector features that reinforce motion without cluttering bullets.

Exit criteria:

- At least three deterministic landmark/hazard types exist.
- Hazards have clear telegraphs and collision rules.
- Landmarks are visual or low-risk unless explicitly marked hazardous.

### P3.6 - Boss Arenas And Scroll Locks

Transition from scrolling travel into boss arenas and back into route flow.

Exit criteria:

- Boss sectors can scroll to an arena, lock movement framing, and unlock on defeat.
- Boss intro/exit timing is deterministic and readable.
- Debug shortcuts still work without requiring long travel.

### P3.7 - Route And Meta Integration

Let routes and unlocks affect the next sector's physical conditions.

Exit criteria:

- Route outcomes can alter scroll speed, hazard density, landmark type, repair stations, vault signatures, or ambush timing.
- Unlocks/challenges can add sector variants without raw power creep.
- Summary explains notable sector modifiers.

### P3.8 - Presentation And Accessibility

Polish velocity cues while keeping bullets readable and controls accessible.

Exit criteria:

- Screen shake, parallax strength, star/debris streaks, and flash effects respect settings.
- High-contrast mode keeps enemy bullets distinct from background motion.
- Keyboard-only and reduced-motion flows remain covered by smoke tests.

### P3.9 - Performance And Instrumentation

Expand debug tools to profile long scrolling and dense backgrounds.

Exit criteria:

- Debug overlay separates entity, projectile, pickup/effect, and background primitive counts.
- Debug scenario can run a long scroll segment and dense encounter pocket.
- Production preview smoke covers long-scroll asset/base-path behavior.

### P3.10 - Phase 3 Playtest Candidate

Harden the scrolling build for deployment and manual playtest.

Exit criteria:

- Full checks, E2E smoke, and production preview smoke pass.
- Release checklist documents scrolling browser smoke and known balance risks.
- Manual test script covers at least one full distance-based sector and one boss arena.

## Recommended Phase 3 Sequence

1. Work order 021 - Scrolling simulation foundation.
2. Work order 022 - Procedural parallax backgrounds.
3. Work order 023 - Scroll-synced wave director.
4. Work order 024 - Distance objectives and HUD.
5. Work order 025 - Sector landmarks and hazards.
6. Work order 026 - Boss arenas and scroll locks.
7. Work order 027 - Route/meta integration for sector conditions.
8. Work order 028 - Velocity presentation and accessibility.
9. Work order 029 - Long-scroll performance instrumentation.
10. Work order 030 - Phase 3 playtest release hardening.

## Phase 3 Definition Of Done

Phase 3 is done when a new player can start a seeded run, feel the ship moving through visually distinct sectors, survive distance-based objectives, encounter waves and hazards at deterministic scroll marks, transition into boss arenas where appropriate, choose routes that alter future sector conditions, and replay/share the seed with stable sector distance, background, landmark, wave, shop, reward, and boss timing.
