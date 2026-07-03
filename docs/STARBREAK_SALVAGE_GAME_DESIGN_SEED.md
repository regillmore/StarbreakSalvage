# Starbreak Salvage — Game Design Seed

## Fantasy

You are a salvage pilot hired to clean up impossible battlefields by making them explode. Your ship is disposable, your weapons are unsafe, your sponsor is legally insulated, and the galaxy is full of profitable wreckage.

## Tone

- Retro sci-fi arcade.
- Darkly funny corporate/salvage flavor.
- High-energy but readable.
- Weird relics and questionable engineering.
- Original, not a clone: use the feeling of 1990s shareware spectacle, not copied assets or lore.

## Core loop

1. Enter seed or use random seed.
2. Choose one of three ship contracts.
3. Fight through a sector.
4. Choose route/reward/shop/vault/repair.
5. Build synergies.
6. Defeat boss or die.
7. Recover salvage.
8. Unlock new content.
9. Repeat with a new seed or share the old one.

## Player verbs

- Move.
- Fire.
- Dodge/graze.
- Use special ability.
- Bomb/cancel danger.
- Choose route.
- Choose reward.
- Buy/sell/reroll in shop.
- Extract or push deeper.
- Share seed.

## Starting contracts

See the consolidated seed document for full descriptions. Initial implementation should include at least these three:

1. Debt Runner — fast economy ship.
2. Drone Chaplain — minion/drone ship.
3. Missile Accountant — explosive overkill ship.

Alpha should add:

4. Phase Courier.
5. Shield Bruiser.
6. Scrap Monk.
7. Corporate Test Pilot.
8. Relic Thief.

## Weapon families

### Laser

Precise, fast, low per-hit damage. Synergizes with split, chain, focus, and heat.

### Plasma

Medium speed, medium damage, good with split, ricochet, splash, and heat.

### Missile

Slow, high burst, explosive. Synergizes with overkill, ammo, refunds, blast radius, homing.

### Rail

Piercing, charge-based, high skill. Synergizes with line damage and shields.

### Drone

Secondary/minion damage. Synergizes with copy effects, orbitals, sacrifice, and swarm count.

### Relic/cursed

Rule-changing items. Synergizes with constraints, vaults, and high-risk play.

## Item design rules

Good items should answer at least one question:

- Does this change how I move?
- Does this change what I value in rewards?
- Does this create a visible combo with existing tags?
- Does this create risk?
- Does this give me a reason to visit a different route?

Avoid items that are only invisible +5% upgrades unless needed for common filler. Even simple upgrades should be flavorful and legible.

## Starter item list

| ID | Name | Rarity | Tags | Effect |
|---|---|---:|---|---|
| item_chain_arc_capacitor | Chain Arc Capacitor | rare | laser,plasma | Shots can arc to nearby enemies. |
| item_split_prism | Split Prism | uncommon | split | Shots split into weaker child shots. |
| item_ricochet_license | Ricochet License | uncommon | ricochet | Eligible shots bounce once off screen edges. |
| item_drone_uplink | Drone Uplink | rare | drone | Drones copy a reduced primary shot. |
| item_shield_dynamo | Shield Dynamo | uncommon | shield | Shield damage charges special ability. |
| item_coin_operated_cannon | Coin-Operated Cannon | uncommon | credit | Picking up credits boosts fire rate briefly. |
| item_overkill_ledger | Overkill Ledger | rare | overkill,scrap | Excess damage can become scrap. |
| item_heat_sink_saint | Heat Sink Saint | uncommon | heat | Reduces heat and makes venting offensive. |
| item_cursed_hull_plate | Cursed Hull Plate | cursed | curse,armor | Lower max hull; repairs grant damage. |
| item_bomb_refund_actuator | Bomb Refund Actuator | rare | bomb | Bomb kills can refund bomb charge. |
| item_phase_grazer | Phase Grazer | rare | phase | Grazing emits homing shards. |
| item_vault_parasite | Vault Parasite | prototype | relic,curse | Stronger relics; cursed shops. |
| item_mirror_turret | Mirror Turret | uncommon | drone | Rear ghost shot at reduced damage. |
| item_salvage_magnet | Salvage Magnet | common | scrap,credit | Pickup attraction range increased. |
| item_executive_override | Executive Override | prototype | credit,curse | Once per sector, survive lethal damage at 1 hull; spawn debt collectors. |

## Sector design

### Sector 1 — Outer Debris Field

Purpose: teach movement, pickups, and first build decision.

Hazards:

- drifting wreck panels;
- slow mines;
- salvage thieves.

Boss candidates:

- Auditor Drone XL;
- Junkyard Regent.

### Sector 2 — Trade War Corridor

Purpose: introduce shops, credits, shielded enemies, convoy patterns.

Hazards:

- shield barges;
- turret lanes;
- convoy escorts.

Boss candidates:

- Carrier of Unsold Missiles;
- Corporate Garnishment Platform.

### Sector 3 — Bio-Machine Bloom

Purpose: introduce organic bullet patterns and corrosion.

Hazards:

- spore bullets;
- regenerating pods;
- corroded salvage.

Boss candidates:

- The Bloom Engine;
- Photosynthetic Debt Orchid.

### Sector 4 — Corporate Kill Grid

Purpose: high-tech danger, lasers, mines, synchronized attacks.

Hazards:

- beam telegraphs;
- grid mines;
- drone locks.

Boss candidates:

- Warranty Void Seraph;
- Compliance Cathedral.

### Sector 5 — The Core Wreck

Purpose: final exam using all mechanics.

Hazards:

- seed-specific mixed faction patterns;
- unstable relic storms;
- limited repair opportunities.

Boss:

- The Core Wreck.

## UI screens

- Main menu.
- Seed entry.
- Contract select.
- Gameplay HUD.
- Pause/options.
- Reward select.
- Shop.
- Vault/curse event.
- Run summary.
- Unlock archive.
- Settings.

## HUD priorities

- Hull/shield.
- Current weapon heat/reload.
- Special/bomb charge.
- Credits.
- Sector progress.
- Boss health.
- Active item count or compact build icons.
- Current seed in pause/summary, not always in combat unless debug.

## Flavor examples

- “Your sponsor denies everything.”
- “Warranty void where hull is present.”
- “Recovered 47 kg of legally ambiguous salvage.”
- “Debt collectors have entered the combat zone.”
- “The relic whispers in deprecated protocols.”
- “This upgrade is not approved for pilots with organs.”

## Unlock philosophy

Unlocks should make future runs more varied and expressive. Avoid permanent numerical power creep as the main progression. The best unlock makes the player think, “Now I can try a new build.”
