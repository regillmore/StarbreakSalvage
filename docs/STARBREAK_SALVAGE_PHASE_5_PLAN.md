# Starbreak Salvage - Phase 5 Plan

## Phase 4 Conclusion

Phase 4 is concluded after work order 040 validation. It turned the scrolling playtest foundation into a more cohesive browser game slice across displays, input styles, and contract identity: fixed combat-world presentation, passive mouse/touch controls, contract-specific ship appearance, New Game ship previews, a themed cockpit HUD, accessibility hardening, ship identity feedback, contract theme propagation, and viewport/input/HUD smoke coverage.

The game now reads more consistently on screen, but the long-term loop still needs stronger reasons to keep playing. Banked scrap needs an understandable purpose, upgrades need a real home, sector completion needs a satisfying punctuation beat, and death should feel dramatic without becoming noisy.

## Phase 5 Product Goal

Make the run-to-run loop feel rewarding and legible while adding one strong new place to fly through. Phase 5 should connect banked scrap to durable variety, give upgrades clear iconography and purchase feedback, add a lunar surface sector family, make sector exits and rewards easier to parse, and make player destruction feel like a memorable consequence.

## Phase 5 Pillars

1. **Scrap Has Purpose** - banked scrap should unlock choices, sidegrades, and run variety rather than simple permanent stat inflation.
2. **Upgrade Bay Clarity** - upgrade categories should have readable icons, costs, states, and short explanations.
3. **Sector Punctuation** - reaching an exit should feel like crossing a line, with a clear toast and transition into rewards/routes.
4. **New Terrain Identity** - the lunar surface should feel different from deep-space sectors while preserving bullet readability.
5. **Consequence And Spectacle** - ship destruction should be richer, readable, original, and respectful of reduced motion/performance settings.
6. **Save-Safe Progression** - upgrade purchases, unlock records, and scrap conversion must migrate safely and remain local-only.

## Current Gap

- banked salvage/scrap now has a first upgrade loop, but balance must keep it focused on variety, information, and sidegrades;
- the Upgrade Bay and run summaries now explain affordability, but future feedback should avoid turning summary screens into shops;
- existing menus have first-pass upgrade icons, but later upgrade categories will need the same concise visual language;
- sector completion now has a first exit/toast beat, but timing and copy still need playtest tuning;
- sector variety now has Lunar Surface visuals, hazards, landmarks, and pacing hooks, but it still needs manual balance/readability smoke against dense combat;
- player death produces a summary, but the combat-side destruction moment is still first-pass feedback.

## Phase 5 Milestones

### P5.1 - Banked Scrap Economy

Define what banked scrap buys and what it should not buy.

Exit criteria:

- Banked scrap can be spent through deterministic, save-backed progression data.
- Upgrade effects widen future choices, information, starting variety, or build texture without turning into raw stat inflation.
- Fresh saves and existing saves migrate safely.

Status: first pass implemented in work orders 041 and 043. Upgrade definitions now live in a validated content catalog, banked scrap can purchase persistent upgrade ids through save helpers, save version 3 migrates legacy v2 data, and upgrade effects are framed as future variety/information sidegrades. Upgrade Bay presentation is implemented by work order 042.

### P5.2 - Upgrade Bay And Icons

Add a menu surface for persistent upgrades.

Exit criteria:

- Upgrade categories have original iconography, cost states, purchased states, and unavailable states.
- The menu is keyboard and pointer usable.
- Upgrade copy is short and scannable on narrow layouts.

Status: implemented in work order 042. The Upgrade Bay is reachable outside runs, uses original inline SVG category icons, exposes installed/available/locked/unaffordable copy, purchases through the save-backed helper, and has unit plus narrow high-contrast Playwright smoke coverage.

### P5.3 - Upgrade Effects In Run Generation

Connect purchased upgrades to future runs.

Exit criteria:

- Upgrades can affect contract boards, seed preview, route information, shop affordances, or reward variety deterministically.
- The same save state plus same seed reproduces the same upgrade-influenced generation.
- Save export/import preserves upgrade state.

Status: implemented in work order 043. Purchased upgrades can add contract survey notes and a fourth contract slot when unlocked ships allow, seed survey text, route ledger hints, market decoder shop stock/discount/bias, and relic dossier vault reward choices. Unit snapshots cover same-save/same-seed output and fresh-save viability.

### P5.4 - Run Results And Toast Feedback

Make scrap gain, unlock progress, and sector completion more legible.

Exit criteria:

- Run summaries explain earned scrap and upgrade-relevant progress.
- Sector completion shows a short exit/toast beat before route/reward screens.
- Toasts are readable, non-blocking, and respect reduced motion.

Status: implemented by work orders 044 and 045. Run summaries now explain earned and banked scrap, upgrade outlook, and newly available or next-target upgrade progress; the Unlock Archive also reports affordable upgrades and the next target. Sector completion now shows a short explicit exit beacon/toast beat before route or victory handoff, with reduced-motion simplification and debug smoke coverage.

### P5.5 - Lunar Surface Sector

Add a new low-altitude sector family.

Exit criteria:

- Lunar surface backgrounds, landmarks, hazards, and palette are deterministic and original.
- Lunar terrain communicates altitude and speed without hiding bullets.
- Content validation covers the new sector references.

Status: implemented by work orders 046 and 047. Lunar Surface can appear through the deterministic `LUNAR-SURFACE-LANE` route, with original crater/ridge/tower/wreck-shadow background strata, muted terrain layers, crater-shadow/comm-array/surface-relay landmarks, dust-plume/mining-laser/surface-defense hazards, and optional low-altitude encounter-pacing data consumed by the wave director. Generation, background, feature, hazard-readability, route-conditioned feature, content, and wave-pacing tests cover the first pass.

### P5.6 - Destruction And Recovery Feedback

Make player death and near-death outcomes feel intentional.

Exit criteria:

- Ship destruction uses richer debris, shock, and cockpit failure cues.
- Reduced motion/performance/high-contrast settings keep death readable.
- Summary transition remains reliable and accessible.

Status: implemented by work order 048. Player death now starts a deterministic destruction sequence with contract-colored debris, silhouette remnants, cockpit pulse, transponder toast, and a dedicated feedback/audio cue before handing off to the existing destroyed summary. Reduced motion shortens and simplifies the beat, performance mode lowers debris budget, high contrast swaps the palette to bright warning colors, and Playwright smoke covers the debug forced-destruction path through summary.

### P5.7 - Phase 5 Playtest Candidate

Harden the progression/sector-feedback slice for deployment.

Exit criteria:

- `npm run check`, Playwright smoke, and production preview smoke pass.
- Release docs cover upgrade spending, lunar sector smoke, sector exit toasts, and ship destruction risks.
- Manual browser gaps are documented separately from gameplay blockers.

Status: completed by work order 050. Debug instrumentation exposes Phase 5 progression, banked scrap, upgrade readiness, run resource, sector-plan, exit, and destruction state, while Playwright smoke covers Upgrade Bay purchase/readiness, sector exit toast flow, forced destruction, and reaching Lunar Surface through `LUNAR-SURFACE-LANE`. `npm run check`, Playwright Chromium smoke, and production preview asset-path smoke passed locally; remaining browser risk is limited to manual non-Chromium and real-device validation.

## Recommended Phase 5 Sequence

1. Work order 041 - Banked scrap purpose and progression economy.
2. Work order 042 - Upgrade bay menu icons and affordances.
3. Work order 043 - Upgrade purchases and run-generation integration.
4. Work order 044 - Run-end scrap breakdown and upgrade toasts.
5. Work order 045 - Sector completion exit sequence and toast.
6. Work order 046 - Lunar surface sector foundation.
7. Work order 047 - Lunar hazards, landmarks, and encounter pacing.
8. Work order 048 - Rich player ship destruction.
9. Work order 049 - Phase 5 deterministic smoke and debug instrumentation.
10. Work order 050 - Phase 5 playtest release hardening.

## Phase 5 Definition Of Done

Phase 5 is done when a player can finish or lose a run, understand what scrap was earned, spend banked scrap on readable upgrades, see those upgrades influence future seeded runs, fly through a distinct lunar surface sector, understand sector exits through clear completion feedback, and experience ship destruction as satisfying feedback rather than an abrupt summary jump.

Status: complete after work order 050 validation. Phase 6 continues from this foundation with an item-catalog expansion roadmap in `docs/STARBREAK_SALVAGE_PHASE_6_PLAN.md`.
