# Starbreak Salvage - Phase 9 Plan

## Current State

Phase 8 concluded with the environmental layer promoted into a first-pass playtest system. Hazards, destructibles, obstacles, and loose currency are now deterministic, readable, debug-visible, and tied to the scrolling sector space.

The game has a stronger one-act loop, but the run still resolves too soon for the breadth of contracts, items, route events, upgrades, enemies, and environmental systems now in place. Phase 9 expands the run into a two-act structure so a build can form, survive a meaningful midpoint, and face a distinct second-act route with higher stakes before victory.

## Phase 9 Product Goal

Add a deterministic second act to the run loop. Act I should remain quick and readable; Act II should feel like crossing into a deeper sector layer with stronger identity, denser route decisions, escalated rewards, tougher encounters, and a more satisfying finale.

## Phase 9 Pillars

1. **Clear Run Arc** - players should understand when Act I ends, what carries forward, and why Act II is more dangerous.
2. **Deterministic Act Structure** - act order, inter-act choices, Act II sectors, shops, bosses, rewards, and major wave schedules must reproduce from seed plus save state.
3. **Build Continuity** - items, contract identity, resources, damage, upgrades, and route consequences should carry forward without feeling like a reset.
4. **Second-Act Identity** - Act II should introduce new sector framing, route pressure, environmental palettes, objectives, encounter pacing, and boss stakes rather than simply raising numbers.
5. **Bounded Run Length** - the second act should add depth without turning runs into a slog. Relief windows, inter-act refit, debug shortcuts, and clear summary progress matter.
6. **Release-Testable Expansion** - every expansion point needs pure helpers, content validation, deterministic seed fixtures, and smoke/debug coverage before density increases.

## Design Targets

- Add an act model to run generation, gameplay state, route generation, summaries, debug overlays, and save records without breaking existing seed links.
- Define Act I and Act II sector budgets, route grammar, boss gates, reward tiers, and inter-act transition rules.
- Add an inter-act junction screen where the player can repair, refit, bank a small bonus, choose intel, or take a risk before Act II.
- Create a first Act II sector pool with distinct route tags, background/feature pressure, environmental modifiers, enemy composition, and objective pacing.
- Extend route, reward, shop, vault, elite, repair, glitch, faction, and salvage-lane outcomes so Act II choices feel sharper but stay deterministic.
- Escalate Act II enemy, hazard, obstacle, loose-currency, and item-pressure budgets conservatively, with debug state exposing act pressure.
- Add second-act boss/finale structure and summaries that separate Act I clear, Act II clear, victory, death, and abandonment outcomes.
- Add Act II smoke seeds and debug shortcuts so browser tests can reach second-act pressure quickly without depending on a long manual run.

## Phase 9 Milestones

### P9.1 - Second-Act Planning And Contracts

Scope:

- Audit run generation, route selection, sector transition, sector completion, summary, save, reward, shop, boss, debug, and smoke systems for one-act assumptions.
- Define the target act schema, route grammar, transition state, and release risks before implementation.
- Refresh work orders, backlog, QA, performance, architecture, README, changelog, release checklist, and project plan links.

Exit criteria:

- Phase 9 has work orders 081-090 with clear sequencing and acceptance criteria.
- Planning docs describe the two-act run shape, inter-act junction, Act II sector pool, Act II pressure, economy, boss/finale, debug smoke, and release hardening.
- Determinism, fixed-world viewport parity, environmental scroll-space behavior, and boss-release hazard fairness remain explicit constraints.

Status: implemented by work order 081. Phase 9 planning is refreshed around a two-act run structure while keeping implementation deferred to scoped follow-up work orders.

### P9.2 - Act Model And Run Progression

Scope:

- Add typed act definitions and deterministic act plans to run generation.
- Carry act index, act name, sector budget, boss gate, and route grammar through gameplay, transitions, debug, and summaries.
- Preserve backward-compatible save and summary behavior for older one-act runs.

Exit criteria:

- Same seed plus save state reproduces the same Act I/Act II structure.
- Existing one-act smoke paths remain valid during migration.
- Debug and summaries expose act context without requiring private app state.

Status: implemented by work orders 082-084. The generated run now carries a validated two-act schema and per-sector act context with a ten-sector target route: Act I covers sectors 1-5 and Act II covers sectors 6-10, and Act II route options now draw from a distinct route-contract table.

### P9.3 - Inter-Act Junction

Scope:

- Add a midpoint screen after Act I completion.
- Offer deterministic refit choices such as repair, shop discount, route intel, extra reward, or higher-risk Act II modifier.
- Ensure keyboard-only, reduced-motion, high-contrast, and narrow layouts remain readable.

Exit criteria:

- Inter-act choices are seeded, applied to Act II generation, and reflected in summaries.
- The player can continue, pause, abandon, and recover gracefully from the junction.
- Act II cannot start with hidden hazards, unfair spawn overlap, or broken resource accounting.

Status: implemented by work order 083. Completing Act I now opens a deterministic midpoint refit scene before Act II launch. Choices are seeded from run seed, save fingerprint, and carried resources; the selected refit records resource deltas and Act II effects for route intel, shop discount, reward choice/bias, salvage, hull patch, or risk. Transition screens, route cards, shops, rewards, summaries, and debug overlays expose the applied junction state, and keyboard/back/pause flows remain safe.

### P9.4 - Act II Sector Route Pool

Scope:

- Add the first Act II route pool and sector tags for deeper-space paths.
- Define sector selection weights, route-card copy, background identity hooks, faction fit, and objective families.
- Keep content original and data-driven.

Exit criteria:

- Act II sectors and route options are deterministic from seed plus act context.
- Route previews clearly communicate Act II pressure/reward tradeoffs.
- Content validation catches broken act/sector/route references.

Status: implemented by work order 084. Act II route generation now uses data-driven contracts with route tags, sector fit, faction fit, background hooks, objective families, pressure/reward/terrain previews, deterministic weights, risk offsets, and optional unlock gates. Content validation and known-seed tests cover the first route pool while Act I route generation remains on the original generic path.

### P9.5 - Act II Pacing And Objectives

Scope:

- Extend pacing arcs and objective rules for Act II sectors.
- Add second-act relief windows, pressure bands, objective variants, boss approach tuning, and summary timelines.
- Avoid simply making every sector longer or denser.

Exit criteria:

- Act II objectives feel distinct while remaining readable and deterministic.
- Long-run pacing has relief and midpoint punctuation.
- Existing long-scroll and enemy/environment stress smoke remain green.

Status: completed in work order 085. Act II sector pacing now carries objective variants, length bands, pressure bands, route-conditioned modifiers, relief windows, boss approach scaling, and summary/debug readouts.

### P9.6 - Act II Combat And Environment Escalation

Scope:

- Integrate enemy roles, variants, formations, hazard director, environment objects, and loose currency with act-aware pressure.
- Add act pressure summaries and conservative caps for combined enemy/environment/item density.
- Preserve viewport parity and scroll-world environmental behavior.

Exit criteria:

- Act II combat pressure uses existing systems instead of ad hoc special cases.
- Debug exposes act-aware enemy, hazard, environment, projectile, and currency budgets.
- Item-storm, enemy-rich, environmental stress, and long-scroll tests remain useful and green.

Status: completed in work order 086 with a shared act-pressure model, debug budget readout, conservative generator hints, and unit coverage for pressure selection, parity, and combined stress.

### P9.7 - Act II Rewards, Shops, And Economy

Scope:

- Add act-aware reward/shop/vault/elite/boss pool weighting.
- Tune credits, salvage, repair, reroll, loose-currency, and upgrade progress expectations for longer runs.
- Keep permanent progression focused on variety and information, not raw power creep.

Exit criteria:

- Act II rewards feel stronger without flooding the catalog or banked scrap economy.
- Fresh and progressed saves have deterministic reward/shop snapshots.
- Summaries explain Act I versus Act II economy and item sources.

Status: completed in work order 087. Act II now uses a shared economy profile for reward weighting, reward choice bonuses, route payout bonuses, shop stock/price/reroll tuning, repair/vault scarcity, loose-currency value budgets, and upgrade-progress framing. Summary copy separates Act I, junction, Act II, recovered economy, and item sources, with deterministic fresh/progressed snapshots covering reward, shop, vault, junction, and save-accounting paths.

### P9.8 - Second-Act Bosses And Finale

Scope:

- Add second-act boss/finale structure using existing boss arena, phase, hazard, and summary contracts.
- Define Act II boss variants, final victory copy, rewards, and unlock hooks.
- Keep boss-release hazard fairness protected.

Exit criteria:

- Act II can end in a readable victory, defeat, or abandonment summary.
- Boss/finale selection is deterministic and debug-visible.
- Final boss smoke can be reached without a full manual run.

Status: completed in work order 088. The final Act II sector now receives a deterministic finale variant with boss identity, hull pressure, approach pacing, outcome copy, debug state, and a victory unlock hook. The implementation reuses the existing boss arena and boss phase contracts, applies finale arena tuning after route and pacing modifiers, preserves boss-release hazard telegraph deferral, exposes the variant in HUD/debug/readout paths, and adds an `F` debug smoke shortcut that jumps to the final-sector boss without a full manual run.

### P9.9 - Act II Debug Smoke And Accessibility

Scope:

- Add debug/test paths for Act II entry, inter-act junction, Act II sector pressure, second-act boss, and two-act summary.
- Check high contrast, reduced motion, performance mode, narrow viewport, item-storm interactions, enemy-rich pressure, environmental pressure, and long-run travel.
- Add Playwright smoke where practical.

Exit criteria:

- Browser smoke can reach and inspect Act II without private app-state access.
- Existing debug shortcuts remain compatible with act state.
- Accessibility settings keep Act II UI, HUD, hazards, bullets, pickups, and route cards readable.

Status: completed in work order 089. Public debug paths now cover the midpoint junction, first Act II sector, final-sector finale smoke, and a two-act debug summary through `J`, `I`, `F`, and `Y` behind `?debug=1`. The Act II smoke helpers expose deterministic sector indexes, route-history scaffolding, route-tag summaries, and summary result data; the debug overlay now reports route tags and objective state alongside act progress, junction effects, act-pressure budgets, and finale state. Playwright smoke covers a narrow high-contrast/reduced-motion/performance Act II path through junction, pressure, finale, and summary while keeping the existing debug smoke suite intact.

### P9.10 - Second-Act Release Candidate

Scope:

- Audit the Phase 9 build for two-act determinism, inter-act flow, Act II route/sector content, economy, bosses, debug smoke, accessibility, performance, browser load, release docs, and manual smoke coverage.
- Fix blockers only.
- Close the release checklist and document known balance, run-length, browser, and readability risks.

Exit criteria:

- `npm run check`, Playwright smoke where available, and production preview smoke pass for the Phase 9 candidate.
- Release docs document the two-act run, inter-act junction, Act II content, smoke paths, and manual browser gaps.
- Phase 9 can be declared complete or explicitly deferred with documented blockers.

Status: planned for work order 090.

## Recommended Phase 9 Sequence

1. Work order 081 - Phase 9 second-act planning refresh.
2. Work order 082 - Act model and run progression schema.
3. Work order 083 - Inter-act junction and midpoint refit choices.
4. Work order 084 - Act II sector route pool and content contracts.
5. Work order 085 - Act II pacing arcs and objective variants.
6. Work order 086 - Act II combat/environment escalation.
7. Work order 087 - Act II rewards, shops, and economy tuning.
8. Work order 088 - Second-act bosses and finale.
9. Work order 089 - Act II debug smoke, accessibility, and performance hardening.
10. Work order 090 - Phase 9 second-act playtest release hardening.

## Phase 9 Definition Of Done

Phase 9 is done when a run can deterministically move from Act I through an inter-act junction into Act II, carry the player's build and resources forward, present distinct second-act sectors/routes/objectives/rewards, resolve through a second-act boss or finale, summarize Act I and Act II outcomes clearly, and retain the existing performance, accessibility, fixed-world parity, debug smoke, and GitHub Pages release guarantees.
