# Starbreak Salvage — QA and Release Plan

## Test pyramid

### Pure unit tests

Use for:

- RNG;
- math helpers;
- collision primitives;
- damage formulas;
- weighted choices;
- item hook ordering;
- save migrations;
- unlock conditions.

### Integration tests

Use for:

- run generation;
- reward generation;
- shop inventory;
- content validation;
- item interactions;
- sector progression.

### E2E smoke tests

Use for:

- page load;
- main menu;
- seed entry;
- contract selection;
- gameplay start;
- pause;
- settings persistence;
- forced death to run summary.

## Known seed tests

- `STARBREAK-SMOKE` — stable forgiving smoke path.
- `LASER-TAX-404` — economy/laser route.
- `ORBITAL-JUNK-PROPHET` — relic/curse route.
- `VOID-CORSAIR-7` — shop/convoy route.
- `BLOOM-ENGINE-ALPHA` — bio-machine boss test.

## Content validation checklist

- [ ] No duplicate IDs.
- [ ] Every item tag is registered.
- [ ] Every hook name is registered.
- [ ] Every ship references valid weapon/item IDs.
- [ ] Every wave references valid enemy IDs.
- [ ] Every sector references valid factions/bosses.
- [ ] Every unlock references valid reward/content IDs.
- [ ] Every reward pool has at least one eligible item.
- [ ] Rarity values are valid.
- [ ] Curses are clearly marked.

## Manual browser smoke matrix

| Browser | Load | Start run | Combat | Pause | Settings | Summary | Notes |
|---|---|---|---|---|---|---|---|
| Chrome/Edge |  |  |  |  |  |  |  |
| Firefox |  |  |  |  |  |  |  |
| Safari/WebKit |  |  |  |  |  |  |  |

## Performance checklist

- [ ] FPS overlay available behind debug flag.
- [ ] Projectile count visible in debug mode.
- [ ] Particle count visible in debug mode.
- [ ] Normal combat stays near 60 FPS on dev machine.
- [ ] Heavy combat debug scene documented.
- [ ] Screen shake and particles respect reduced motion/performance settings.

## Accessibility checklist

- [ ] Keyboard-only menu navigation.
- [ ] Remappable controls.
- [ ] Pause always available during gameplay.
- [ ] Mute option.
- [ ] Volume sliders.
- [ ] Reduced motion.
- [ ] Screen shake strength.
- [ ] Bullet contrast option.
- [ ] Flash reduction.
- [ ] No essential information conveyed by color alone.

## Release checklist

- [ ] `npm run check` passes.
- [ ] E2E smoke tests pass.
- [ ] Production build preview tested.
- [ ] GitHub Pages deployed.
- [ ] Public URL loads assets correctly.
- [ ] README updated.
- [ ] License present.
- [ ] Credits mention original/generated placeholders as appropriate.
- [ ] Changelog updated.
- [ ] Save migration tested.
- [ ] Seed sharing works.
- [ ] Known severe bugs documented or fixed.

## Release notes template

```md
# Starbreak Salvage vX.Y.Z

## Highlights

- 

## New content

- 

## Gameplay changes

- 

## Fixes

- 

## Known issues

- 

## Testing

- `npm run check`: pass/fail
- E2E smoke: pass/fail
- Browser smoke: Chrome / Firefox / Safari
```
