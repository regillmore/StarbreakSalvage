# Starbreak Salvage - Phase 7 Plan

## Current State

Phase 6 concluded with a 60-item catalog, expanded hook coverage, source-weighted acquisition, unlock-gated item families, discovery records, shared item-card presentation, build identity readouts, and item-heavy smoke instrumentation. The game now has enough player build variety that enemy pressure needs to catch up.

The current enemy set is readable and functional, but many encounters still feel like lightly different versions of the same target. Phase 7 should make sectors feel longer-lived and more authored without losing deterministic generation or the fixed-arena viewport parity established in earlier phases.

## Phase 7 Product Goal

Enrich enemy behavior so sectors feel more varied, tactical, and scalable. Enemy classes should have recognizable roles, upgraded variants should change decisions without becoming unfair, formations should create short-lived tactical shapes, and longer sectors should support a better arc from travel to pressure to relief.

## Phase 7 Pillars

1. **Readable Role Identity** - scouts, bruisers, snipers, screeners, carriers, supports, and hazards should be identifiable by silhouette, movement, attack cadence, and telegraph language.
2. **Deterministic Encounter Craft** - role selection, variants, formations, and longer-sector pacing must reproduce from seed plus save state.
3. **Fair Escalation** - upgraded enemies should add tactics and timing pressure before raw damage or bullet density.
4. **Formation Play** - squads should enter, hold, break, and reward in ways that create positional decisions without soft locks.
5. **Longer Sector Arcs** - longer routes should use mid-sector beats, relief windows, and boss approach pacing rather than simply stretching filler.
6. **Performance Discipline** - richer enemy behavior should stay within current entity/proc/debug budgets until profiling proves room for more.

## Design Targets

- Introduce a role taxonomy that can be validated against enemy and wave content.
- Give each major role at least one distinct movement profile and attack cadence.
- Add upgraded enemy variants with clear modifiers, visual/readability cues, and deterministic spawn rules.
- Add formation definitions for common squad shapes, spacing, entry timing, break conditions, and optional formation rewards.
- Increase sector length bands gradually, with richer wave spacing and relief intervals.
- Extend debug and QA coverage so role counts, variants, formations, and long-sector pressure can be inspected in browser smoke.

## Phase 7 Milestones

### P7.1 - Enemy Role Taxonomy And Audit

Scope:

- Audit current enemy content, faction behavior, waves, and sector pacing.
- Add or document a role taxonomy for enemy classes and expected pressure types.
- Identify gaps where roles are visually or mechanically indistinct.

Exit criteria:

- Enemy roles, behavior capabilities, and current gaps are documented.
- Content validation can catch missing or unsupported role metadata when implementation begins.
- Phase 7 role targets are clear enough for focused implementation.

Status: implemented by work orders 061 and 062. The current baseline is documented in `docs/STARBREAK_SALVAGE_ENEMY_ROLE_AUDIT.md`: normal enemies are currently four faction-pattern classes, sector wave labels are semantic rather than behavioral, all normal enemies share a compact spawn/durability model, and objective accounting is safe for current kill paths but needs explicit policy before retreating, spawned, shielded, or formation enemies land. A pure helper in `src/content/enemyRoleAudit.ts` and unit coverage lock that audit; current faction-pattern classes now carry validated role metadata and active role-pressure debug summaries without changing runtime behavior.

### P7.2 - Role-Specific Behavior Expansion

Scope:

- Implement distinct movement and attack patterns for priority enemy roles.
- Keep behavior deterministic and fixed-step.
- Ensure role behavior reads in high-contrast, reduced-motion, and narrow layouts.

Exit criteria:

- At least four enemy roles feel meaningfully different in motion and pressure.
- Role behavior has unit or deterministic tests where practical.
- Debug overlays can expose active role counts for smoke.

Status: implemented through work orders 063 and 064. Current role movement is metadata-driven and deterministic: bruiser/drift, screener/lane-hold, disruptor/organic-sway, and scout/phase-skirmish profiles move distinctly while staying clamped to the fixed combat world. Normal enemy attacks now also read validated attack-family metadata, with distinct cooldowns, telegraph durations/labels, aim styles, projectile speeds/radii, and bounded projectile counts for bruiser, screener, disruptor, and scout roles. Future sniper/carrier/support/hazard attack families have first-pass profiles ready for new enemy classes.

### P7.3 - Upgraded Variants And Elite Identity

Scope:

- Add deterministic upgraded variants with modifiers such as armored, overclocked, evasive, escort, volatile, shielded, or commander.
- Bias variants by sector, faction, route pressure, challenge flags, and later-sector depth.
- Keep visual cues clear and original.

Exit criteria:

- Variants add decision pressure without unclear damage spikes.
- Variant selection is seeded and validated.
- Starter sectors remain forgiving on fresh saves.

Status: implemented through work order 065. `src/content/enemyVariants.ts` defines six first-pass variants: armored, overclocked, evasive, volatile, shielded, and salvage-rich. The wave director selects optional variant IDs from seeded per-spawn RNG forks using sector depth, faction role eligibility, route pressure, challenge flags, elite wave labels, and boss-gate context. Combat applies only visible durability, cadence, drift/profile, and salvage-reward modifiers; no variant increases contact or bullet damage. Canvas enemies draw a ring plus compact cue label, content validation catches invalid variant rules, and the debug overlay reports active variant counts alongside role and formation pressure.

### P7.4 - Formation Director

Scope:

- Add formation definitions for squads such as wedge, column, ring, screen, escort, pincer, and staggered lane.
- Integrate formations with wave scheduling and scroll distance.
- Support deterministic entry timing, spacing, break conditions, and cleanup.

Exit criteria:

- Formation spawning does not skip or duplicate under frame catchup.
- Formations remain inside the fixed 640x720 combat world.
- Defeating or breaking formations cannot desync objective progress.

Status: implemented through work orders 066 and 067. `src/content/enemyFormations.ts` defines eight validated squad shapes with member role intent, offsets, stagger timing, entry style, spacing, break condition, cleanup policy, cue metadata, and small clear-bonus salvage values. Wave planning selects optional formations from seeded per-wave RNG forks with deterministic route, encounter, faction-role, and faction-shape weighting, then expands existing multi-member waves into ordered spawn entries with shared formation instance IDs. Combat/render/debug carry formation IDs, member indexes, compact canvas cues, and active formation counts, while simultaneous formation kills, secondary item kills, despawns, and body collisions all route through objective accounting so sector completion cannot wait on vanished squad members. Deeper break behavior remains deferred.

### P7.5 - Longer Sector Pacing

Scope:

- Extend sector length bands and encounter density with mid-sector beats, relief windows, and optional boss approach changes.
- Use richer backgrounds/features as pacing markers rather than adding constant enemy density.
- Update summaries and debug state to explain longer-sector pressure.

Exit criteria:

- Longer sectors feel intentional instead of padded.
- Route-conditioned length and pressure remain reproducible.
- Performance and browser smoke cover at least one long enemy-rich sector.

Status: implemented through work order 068. `SectorPacing` derives a deterministic post-route pacing plan per sector, applying modest length bands, pressure/relief beats, explicit wave-distance ratios, formation-cluster wave indexes, background landmark beats, sparse hazard beats, and boss-approach scaling while preserving fixed-step simulation and base run generation. Gameplay and transition screens consume the paced scroll plan, the wave director uses explicit ratio marks and cluster waves, debug/summary surfaces describe active pacing, and unit coverage protects route-conditioned long arcs, formation spacing, boss handoff timing, and pacing validation. Browser enemy-rich stress smoke remains for work order 069.

### P7.6 - Phase 7 Enemy Playtest Candidate

Scope:

- Harden role, variant, formation, and longer-sector systems for a playtest candidate.
- Update release, QA, performance, backlog, and README docs.
- Run full checks, Playwright smoke, and production preview smoke.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover role coverage, variant rules, formation smoke, longer-sector tuning, and manual browser gaps.
- Severe soft-lock, objective-desync, readability, or performance blockers are fixed or explicitly deferred.

Status: in progress through work order 069. Enemy-rich debug smoke now covers active roles, upgraded variants, formation labels, long-sector pacing state, projectile budgets, telegraph budgets, high-contrast/reduced-motion/performance settings, and narrow viewport behavior. Final Phase 7 release hardening, production preview evidence, and known-risk closeout remain for work order 070.

## Recommended Phase 7 Sequence

1. Work order 061 - Phase 7 enemy role taxonomy and audit.
2. Work order 062 - Enemy schema, role validation, and debug counters.
3. Work order 063 - Role-specific movement profiles.
4. Work order 064 - Role-specific attack cadences and telegraphs.
5. Work order 065 - Upgraded enemy variants and elite modifiers.
6. Work order 066 - Formation definitions and squad spawning.
7. Work order 067 - Formation-wave integration and objective safety.
8. Work order 068 - Longer sector pacing and encounter arcs.
9. Work order 069 - Enemy behavior readability, accessibility, and stress smoke.
10. Work order 070 - Phase 7 enemy playtest release hardening.

## Phase 7 Definition Of Done

Phase 7 is done when enemy classes have recognizable roles, upgraded variants and formations create tactical changes without hidden unfairness, longer sectors feel paced rather than stretched, seeded wave/variant/formation outputs remain reproducible, objective progress cannot desync from simultaneous, secondary, collision, or despawn clears, and automated plus browser smoke coverage can protect enemy behavior as sectors grow longer.
