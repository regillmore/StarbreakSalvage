# Starbreak Salvage - Phase 4 Plan

## Phase 3 Conclusion

Phase 3 is concluded after work order 030 deployment confirmation. It turned the Phase 2 combat slice into a first-pass vertical scrolling shooter: deterministic sector distance, procedural backgrounds, scroll-synced waves, distance objectives, hazards, landmarks, boss arenas, route-conditioned sector physics, velocity cues, and long-scroll debug instrumentation.

The game now moves through sectors, but it still presents like a systems prototype. Phase 4 makes the game feel more intentional at the screen, input, contract, ship, and HUD layers.

## Phase 4 Product Goal

Make Starbreak Salvage feel cohesive across displays and control styles while giving each starting contract a distinct visual identity before, during, and after launch. The player should immediately understand what ship they chose, how to control it, and how its contract theme shapes the cockpit/HUD and run presentation.

## Phase 4 Pillars

1. **Display Parity** - gameplay should preserve readable playfield composition across desktop, laptop, and narrow/mobile browser windows.
2. **Input Choice** - keyboard, remapped keyboard, and mouse-assisted play should feel deliberate and testable.
3. **Contract Identity** - ship contracts should differ visually, not just through stats and text.
4. **Preview Before Commitment** - new-game contract choices should show the ship silhouette, palette, weapon identity, and contract theme before launch.
5. **HUD As Cockpit** - HUD presentation should borrow from the selected contract without hiding critical combat state.
6. **Accessible Polish** - scaling, mouse controls, ship visuals, and HUD theming must respect reduced motion, high contrast, performance mode, and keyboard-only flow.

## Current Gap

Phase 3 made forward motion real, but several player-facing seams remain:

- gameplay now uses a fixed 640x720 safe arena with viewport metrics, but wider route/pause/summary viewport smoke remains useful;
- passive mouse/touch movement and fire exist, but later preview/HUD interactions still need focus and accessibility audits;
- contract stats, weapons, gameplay ship silhouettes/palettes, and contract-selection previews are now distinct;
- contract selection now has visual previews, but the broader route/reward/shop/summary contract theme is still sparse;
- HUD now has a first-pass contract-themed cockpit layer, but deeper ship feedback and non-combat theme propagation remain sparse;
- debug coverage now reports viewport and input-mode state, and preview/HUD theme smoke coverage exists, but broader route/pause/summary viewport coverage remains useful.

## Phase 4 Milestones

### P4.1 - Resolution Scaling And Viewport Parity

Define the gameplay safe frame, canvas scaling rules, HUD safe areas, and debug viewport metrics.

Exit criteria:

- Gameplay preserves a stable safe playfield at common desktop, laptop, tablet, and narrow mobile sizes.
- HUD and canvas do not overlap critical gameplay or each other.
- Unit and E2E coverage exercise viewport/scaling helpers.

### P4.2 - Mouse Controls

Add optional mouse movement and/or mouse-assisted fire without weakening keyboard play.

Exit criteria:

- Mouse controls can move or guide the ship within bounds.
- Click/hold fire maps through the input abstraction.
- Settings expose mouse mode/sensitivity or enablement where needed.
- Keyboard-only and remapped-key flows remain intact.

### P4.3 - Ship Appearance Data Model

Introduce data-driven contract ship appearance: silhouette, palette, engine color, cockpit accent, weapon mount hints, and HUD theme references.

Exit criteria:

- Ship appearance lives in content data and validates alongside ship stats.
- At least the baseline contracts have distinct original silhouettes/palettes.
- Rendering remains shape/canvas based and deterministic.

Status: first pass implemented in work order 033. Appearance data now lives with ship content, generated contracts expose it, gameplay rendering consumes it, and content validation catches missing or invalid silhouettes, palettes, mounts, and HUD theme keys.

### P4.4 - Contract Selection Ship Previews

Upgrade new-game contract cards with ship previews and weapon/role visual cues.

Exit criteria:

- Each contract card shows a compact ship preview.
- The selected contract preview updates through keyboard and mouse/pointer flow.
- Preview visuals are readable in high contrast and narrow layouts.

Status: first pass implemented in work order 034. Contract cards now show compact SVG previews, the selected-contract preview updates through arrow keys and pointer/button selection, and narrow layouts stack the preview band without crowding card text.

### P4.5 - Contract-Themed Gameplay HUD

Replace purely text-like HUD styling with a contract-themed graphical cockpit layer.

Exit criteria:

- HUD frame, meter accents, and key readouts reflect the selected ship/contract theme.
- Critical values remain text-readable and screen-reader friendly.
- Reduced motion/performance/high-contrast settings still simplify presentation.

Status: first pass implemented in work order 035. Gameplay now derives cockpit frame accents, meter colors, and HUD mode from selected ship appearance plus document accessibility settings. Hull, special, bomb, and weapon heat meters remain semantic DOM elements while existing text readouts keep their test ids and screen-reader value.

### P4.6 - Display And Input Accessibility

Harden scaling, mouse, and themed HUD behavior for accessibility.

Exit criteria:

- Keyboard-only flow can start, play, pause, and summarize a run after Phase 4 UI changes.
- Mouse controls have a clear opt-in/neutral default and do not trap focus.
- High contrast and reduced motion remain readable over all contract themes.

Status: first pass implemented in work order 036. Global input now preserves native button activation for keyboard users, overlay pointer events clear mouse guidance state instead of affecting gameplay, preview/HUD styling simplifies under accessibility settings, and E2E smoke covers keyboard-only start/pause/summary flow.

### P4.7 - Ship Damage, Wake, And Identity Feedback

Add lightweight visual feedback that reinforces ship identity during play.

Exit criteria:

- Ship damage/invulnerability/readiness states are visible on the ship and HUD.
- Engine wake, special/bomb cues, and hit flashes can use ship appearance data.
- Cues remain readable and original, with reduced-motion/performance fallbacks.

Status: first pass implemented in work order 037. Gameplay ship rendering now uses a pure appearance-plus-combat-state cue model for themed engine wake, damage flash, invulnerability rings, special/bomb readiness brackets, and weapon heat/overheat stress, with reduced-motion, performance, and high-contrast intensity fallbacks.

### P4.8 - Contract Theme Propagation

Carry contract theme into route transition, reward/shop, summary, and debug context without overdecorating operational screens.

Exit criteria:

- Contract identity appears consistently but quietly outside gameplay.
- Summary captures ship appearance/theme identifiers for debugging and replay context.
- Existing route/reward/shop readability remains intact.

### P4.9 - Viewport/Input Debug And Smoke Coverage

Extend debug and automated smoke coverage for viewport parity and input modes.

Exit criteria:

- Debug overlay reports viewport/canvas scale and input mode.
- E2E covers at least one narrow viewport launch and one mouse-control smoke where local browsers are available.
- Release checklist documents display/input browser gaps.

### P4.10 - Phase 4 Playtest Candidate

Harden the display/input/ship-identity build for deployment.

Exit criteria:

- Full checks and production preview smoke pass.
- Release docs document window-size, mouse, contract preview, and HUD theme coverage.
- Manual browser matrix includes desktop, narrow viewport, keyboard, and mouse passes.

## Recommended Phase 4 Sequence

1. Work order 031 - Resolution scaling and viewport parity.
2. Work order 032 - Mouse controls.
3. Work order 033 - Ship appearance data model.
4. Work order 034 - Contract selection ship previews.
5. Work order 035 - Contract-themed gameplay HUD.
6. Work order 036 - Display and input accessibility.
7. Work order 037 - Ship damage, wake, and identity feedback.
8. Work order 038 - Contract theme propagation.
9. Work order 039 - Viewport/input debug and smoke coverage.
10. Work order 040 - Phase 4 playtest release hardening.

## Phase 4 Definition Of Done

Phase 4 is done when a player can launch the game on common window sizes, choose a contract with a clear ship preview, play with keyboard or mouse-assisted controls, recognize their ship and HUD theme in combat, and still rely on readable bullets, stable layout, deterministic runs, and accessible settings.
