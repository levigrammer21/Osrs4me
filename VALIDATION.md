# Realmstead 1.0 validation

## Automated checks completed

- All JavaScript runtime modules pass Node syntax checks.
- 18 simulation suites pass: deterministic starts; blank-world stability; construction and refunds; water, bridge and wall routing; private inventory capacity and conservation; stock and gold transactions; safe gravestones and recovery; skulled and unskulled Wilderness drops; persistent gathering orders; production prerequisite chains; mana and ammunition consumption; Slayer completion; live PK combat; staggered arrivals and population cap; 50-adventurer stress run; boss defeat; resource replenishment and Prayer protection; save restoration and corrupt-save rejection.
- The final full-content stress case ran 4,000 ticks with 50 adventurers. It produced 599 monster kills, 5,696 transactions, 6,135 gathered resources and 744 crafted items. No inventory overflow, invalid gold balance, corrupt skill state or save-restoration failure was observed.
- UI integration checks execute the real app with test DOM/canvas doubles: startup, welcome selection, all eight character tabs, roster/progress/finances/settings/help/chronicle dialogs, all five build palettes, construction, undo/redo, autosave and 240 animation frames.
- Renderer checks execute all procedural content branches at minimum and maximum zoom.

## Verification limits

Browser automation was not available in this environment. Browser layout, real touch/pinch gestures, on-device performance, service-worker offline behavior and installation have not been visually or physically verified. The UI integration checks do not substitute for a browser layout test. The hosted deployment is verified separately through its deployment result.

## Persistence

Saves are browser-local with JSON export/import and a previous-save fallback. Cross-device automatic synchronization is not implemented. Simulation pauses while the page is hidden or closed. No Firebase project or sign-in configuration was supplied for this new game.
