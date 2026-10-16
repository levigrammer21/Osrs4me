# Realmstead 1.0 — A Living Realm

Build a living world, then adventure alongside its inhabitants. This is a single-player simulated MMO with a world editor and a personal, semi-autonomous character. No paid services, API keys, installation, or external assets are required.

## Play

Open the hosted game, or upload the runtime files below to the root of a GitHub Pages repository. Enable Pages for that branch. Open the resulting HTTPS URL. **Do not open index.html directly from a file manager**: browser ES modules need a web server.

Runtime files: `index.html`, `style.css`, `app.js`, `data.js`, `engine.js`, `render.js`, `icon.svg`, `manifest.webmanifest`, `sw.js`.

For local development with Python available: `python3 -m http.server 8080`, then open http://localhost:8080. No dependency installation or build step is needed.

## The world is the main game

The 80 × 60 tile map supports meadow, road, water, rock, sand, ash, Wilderness and safe-zone brushes. Use 1-, 3- or 5-tile terrain brushes. Place and relocate banks, trading posts, forges, cookhouses, workshops, apothecaries, Prayer shrines, Slayer lodges, taverns, fountains, lamps, banners, walls and bridges. Resource nodes and monster camps can be painted repeatedly. Buildings and resource nodes can be moved free; monster inspections can move their home camp. Demolition refunds 60%.

Water and walls block travel. Bridges connect land across water. Fishing spots belong on a shore. Towns do not need painted roads to function, but roads help make routes legible. If a task cannot be reached, adventurers choose other opportunities. Painting water cannot erase occupied tiles.

Resources have six tiers with requirements 1, 10, 25, 40, 60 and 80. Tiers zero and one begin unlocked. Each two realm milestones unlock another resource tier. Enemy access also grows with milestones. The worldbuilder pays the realm treasury, separate from the player character's personal gold.

### Realm economy

Market transactions pay an 8% levy; monster kills contribute bounty income; production contributes 2 gold per action. Every 100 ticks, base settlement income pays 15 gold plus 3 per tavern or market. Each milestone grants 300 gold. Selling transfers actual adventurer inventory into shared market stock; purchasing consumes stock and personal gold. Merchants periodically replenish bounded basic supplies and equipment. This is an intentionally supported game economy, not a closed monetary simulation.

## Adventurers

Start with Levi and nine companions. Eight milestones each attract five more, arriving one every 12 ticks, up to a permanent population of 50. Newcomers have modest stage-appropriate skill progress. Adventurer names, personalities, inventories, banks, skills, gold, kills, deaths, Slayer assignments and equipment persist.

Personalities include warriors, anglers, miners, lumberjacks, artisans, mages, rangers, alchemists, hunters, PKers and explorers. AI chooses reachable work, acquires production prerequisites, gathers materials, equips upgrades, sells surplus, buys supplies, rests, offers bones, returns to gravestones and pursues Slayer assignments. Risk appetites allow prepared adventurers to enter valuable Wilderness areas; cautious characters favor safe targets. PKers look for suitable victims, with combat-level restrictions. Creating frontier rewards is how you attract activity there.

Levi uses the same simulation and economy. Orders include autonomous adventuring, gathering, hunting a species, repeated production, Slayer, Prayer, banking, trading, resting, PKing and walking. Repeating orders persist through supply trips and remain saved when the character temporarily finds fallback work. Explicitly ordering a Wilderness node or target permits that risk.

## Skills and content

13 skills: Fishing, Mining, Woodcutting, Cooking, Smithing, Crafting (including bows and arrows), Herblore, Melee, Magic, Ranged, HP, Slayer and Prayer. Skills cap at 99 with a custom accelerated XP curve. Melee remains a single skill.

Six equipment tiers run Bronze through Runic. Production includes cooked fish, smelted bars, swords, armour, bows, staves, jewellery, arrows, leather armour and health/mana/battle/Prayer potions. Monsters drop bones, gold and species-specific materials or rare equipment. Nine enemy species span giant rats through the Elder Dragon and the Hollow King. Bosses and high-Slayer foes provide late-game challenges.

## Live combat

Simulation ticks are 600 ms at 1×; speed controls offer 1×, 2× and 4×. Rendering interpolates movement independently. Melee attacks every 3 ticks, Ranged every 4 and Magic every 5. Combat remains on the shared map with projectiles, strikes, damage indicators, health bars and visible drops. Enemies pursue locally and leash back to their home camps. Adventurers eat, retreat and rest.

Magic spends regenerating mana, not runes. Ranged spends arrows. Prayer consumes points while active and reduces incoming damage by 30%; bones train it and shrines replenish it. Combat gear and skill levels affect attacks; armour reduces enemy damage. Battle potions give a temporary damage boost.

### Death and inventories

Each adventurer carries 28 inventory slots, plus equipped weapon, armour and amulet. Arrows, bones and gems stack; other items occupy individual slots. Private banks have unlimited capacity and are accessed at bank buildings.

Outside the Wilderness: equipment stays equipped and carried items remain in a private gravestone. The owner can collect them. After 600 ticks, items move to recovery; visiting a bank and paying 15 personal gold transfers them to that adventurer's bank.

Inside Wilderness: the three most valuable carried/equipped item slots are protected; other items drop. Initiating a player attack adds a skull for 500 ticks and protects only one item slot. Stack value is the entire stack's stable catalog value. The killer has loot priority for 40 ticks; remaining items then become public. Loot expires after 800 ticks. Bank contents and the separate personal gold balance are safe. There is no permanent character death.

## Controls

- Drag to pan, pinch or wheel to zoom, and tap the minimap to jump.
- Select a build tool, then tap or drag to place it. With a tool active, use two fingers, right-drag, or hold Space to pan.
- Inspect mode lets you select adventurers, resources, buildings, monsters or ground.
- Use the character panel for orders, skills, equipment, recipes, bank, market and Slayer store.
- P toggles pause. Escape exits the build tool. Ctrl/Cmd+Z undoes a build stroke; Shift+Ctrl/Cmd+Z redoes it.
- Undo restores the **entire realm** to before that stroke, including adventurer progress. History is session-local and capped at 20 strokes.

## Saving, installing and moving devices

Autosave uses this browser's local storage every 15 seconds and on page hide. A previous-save backup is kept. Settings includes manual save and JSON export/import. **There is no cloud synchronization or account login.** Export from one device and import on another to move a realm. Opening in a different browser does not automatically share the save. The simulation does not advance while closed or hidden, so there are no offline losses.

An HTTPS service worker caches runtime files after the first successful visit for offline reopening, where the browser and host permit it. Browsers may offer Add to Home Screen. Export a backup before clearing browser data or replacing a realm.

## Source map

- `data.js`: content catalogs, XP curve, milestone definitions.
- `engine.js`: deterministic simulation, world editor operations, pathfinding, economy, AI, combat, saves.
- `render.js`: terrain and procedural canvas art, animation, labels, minimap.
- `app.js`: controls, touch gestures, panels, state, backup/export, autosave.
- `style.css`: responsive desktop/tablet/phone interface.
- `tests.mjs`: simulation, economy, AI, combat, death, persistence and long-run checks.
- `ui-tests.mjs`: JavaScript UI/renderer integration smoke checks using test doubles. These do not perform browser layout or touch-device verification.

Run `node tests.mjs` and `node ui-tests.mjs`, or `npm test`. Node 20+ is sufficient. No dependencies are needed.
