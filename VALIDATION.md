# Realmstead 1.3 validation

## Automated checks completed

- All JavaScript runtime modules pass Node syntax checks.
- 19 simulation suites pass: deterministic starts; blank-world stability; construction and refunds; water, bridge and wall routing; private inventory capacity and conservation; stock and gold transactions; safe gravestones and recovery; skulled and unskulled Wilderness drops; persistent gathering orders; production prerequisite chains; mana and ammunition consumption; Slayer completion; live PK combat; staggered arrivals and population cap; 50-adventurer stress run; boss defeat; resource replenishment and Prayer protection; save restoration and corrupt-save rejection.
- The final full-content stress case ran 4,000 ticks with 50 adventurers. It produced 599 monster kills, 5,696 transactions, 6,135 gathered resources and 744 crafted items. No inventory overflow, invalid gold balance, corrupt skill state or save-restoration failure was observed.
- UI integration checks execute the real app with test DOM/canvas doubles: startup, welcome selection, all eight character tabs, roster/progress/finances/settings/help/chronicle dialogs, all five build palettes, construction, undo/redo, autosave and 240 animation frames.
- Renderer checks execute all procedural content branches at minimum and maximum zoom.

## Verification limits

Browser automation was not available in this environment. Browser layout, real touch/pinch gestures, on-device performance, service-worker offline behavior and installation have not been visually or physically verified. The UI integration checks do not substitute for a browser layout test. The hosted deployment is verified separately through its deployment result.

## Persistence

Saves are browser-local with JSON export/import and a previous-save fallback. Cross-device automatic synchronization is not implemented. Simulation pauses while the page is hidden or closed. No Firebase project or sign-in configuration was supplied for this new game.

## Worldforge update checks

- New-world invariants verify every tile is meadow, no nodes/buildings/enemy camps/monsters exist, time does not advance before admission, and adventurers enter around the gate chosen by the player. Waiting actors do not block terrain painting.
- Gesture checks verify horizontal shelf browsing, upward drag placement, downward-drag rejection and continuous brush interpolation.
- UI integration verifies illustrated tool palettes, map preview without committing, release-to-confirm placement, explicit gate opening, Build mode holding simulation time, and all character/menu views.
- The same 50-adventurer stress simulation continues to pass. Browser layout and real touch behavior remain unverified due to unavailable browser QA.

## Build controls fix (1.2)

UI integration verifies that active simulation stops on entering Build, stays stopped even when pause/speed handlers are invoked, and resumes after Done. It also verifies exactly one Undo, Redo and Done control, positioned in the build command bar. Device layout remains unverified.

## Foundation update (1.3)

Seven additional suites pass for six-slot equipment, atomic inventory swaps, legacy-save migration, all-slot death rules, preview/commit parity, live-actor wall protection, and navigation invalidation. UI checks verify the top version badge, a build bar outside the footer, its visibility in Build, its hiding on Done, right-button pan without placement, and the complete gear panel. Terrain tests verify zero repaint of 120 unchanged frames and at most five repainted cells for a single terrain edit.

A development microbenchmark used the same inputs and matching checksums for the prior and current implementation: 300 fixed path searches took 355 ms before and 237 ms after; 50,000 level lookups took 3,775 ms before and 5 ms after. These are container microbenchmarks, not device FPS measurements.

The final expanded-equipment 50-adventurer stress run completed 4,000 ticks with 620 monster kills, 4,965 market transactions, 6,329 gathered resources, 804 crafted items and one PK victory, with valid inventories, currencies and save restoration.
