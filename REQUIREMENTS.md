# Requirements and verification ledger — 1.3.0

Updated 19 October 2026. IMPLEMENTED describes delivered functionality. VERIFIED names available evidence; it does not imply every possible combination, device or live account has been tested. All original systems remain in scope; no decorative placeholder features are counted as complete.

| ID | Specification | Delivered behavior and evidence |
|---|---|---|
| R01 | 1–2, 42–43 | Flat React/TypeScript source plus compiled Pages-ready PWA, visible 1.3.0, changelog, phone-only setup. Production build and nested-URL package checks pass. GitHub publication is blocked by integration write access. |
| R02 | 4–8 | All 50 families/150 forms, staged stats/growth, six IVs, exactly five elements, family passives, three abilities, aptitudes and 100 manual evolution edges. Formula/content tests and all-edge identity regression pass. |
| R03 | 9–11 | Six front/back slots, persistent priorities, timers, cooldowns, statuses, targeting, shields/healing/redirect/counter effects, hitsplats, motion, rewards, recovery/retry. Shared engine and partition equivalence tests; browser combat/refresh checks. |
| R04 | 12–15 | Eight gathering/production skills plus Slayer; uncapped XP/mastery, 48 gathering activities, 64 ingredient-backed recipes, separate concurrent farm crews, fixed per-cycle shared creature XP pool, milestone and diminishing-return bonuses. Conservation, resource exhaustion, workflow and output tests pass. All refined alloys feed later upgrade costs. |
| R05 | 16 | Exactly one Slayer contract, four kinds, paid reroll, manual retrieval turn-in, XP/tokens/materials, exclusive hunts and shop. Slayer milestone bonuses apply permanently to contracts. Turn-in and slot invariant tests pass. |
| R06 | 17–18 | Pre-generated stable egg genetics/variants, separate storage, independent incubators, auto-hatch/load/selection, capacity handling, AND/OR release rules including all six individual IV thresholds, previews and protected identities. Genetics/protection and offline automation tests pass. |
| R07 | 19–20 | Independent color/effect axes, exact base/inherited probabilities, guaranteed complementary six-IV inheritance, repeat breeding, eight existing-family hybrid recipes, parents reserved until completion. Seeded sampling/inheritance/resource tests pass; all nine visuals render in browser. |
| R08 | 21 | Housing, incubators, hatchery, breeding, recovery, workshop, expedition; escalating costs/time and milestone automation. No designed facility cap. Chronological job processing and persistence exercised. |
| R09 | 22–25 | Essence/Gem/Trinket, six rarities with exact distinct stat counts, long-tail rolls, uncapped upgrades, 1% success floor, permanent milestones, immutable original salvage value, locks/favorites/comparison/search/filter/bulk management. Invariant tests and 50,000-item benchmark pass. |
| R10 | 10, 26, 30–32 | 10 regions, 50 wild encounters, 10 bosses, 10 Slayer hunts, 5 dungeons, 3 distinct solo raids, saved nodes, journal, achievements, gold/tokens and shops. Every acquisition path is referenced; all adventures complete across three seeded fixtures and restore identically mid-run. Seven-day earned-only progression separately recorded. |
| R11 | 27–28 | Queues, conditional resource/cycle workflows, saved loadouts and safe switching, automatic hatching/release/salvage, repeat breeding, repeat limits/stock stops. Shared chronological offline settlement handles consumption, defeat, capacity and fixed 12h limit for all offline progression and pending clocks. Representative timing/protection/no-loop tests pass. |
| R12 | 29, 33–34 | Owned collection, encyclopedia, enlarged inspectors for every form, IV/gender/stage/variant/element filters, histories, visible tappable homestead, independent job board and stack-based nursery, progress bars, accessible labels, 320/390/768/1280 layouts. 67 interface checks and all 150 inspectors pass. Direct navigation, contextual next steps, compact equipment, focused Farm/Shop and bidirectional event-driven projectiles replace the old oversized panels. Hardware-specific tests remain a verification limit. |
| R13 | 35–37 | IndexedDB, email/Google/reset integration, partitioned immutable Firestore generations, revision transactions, clock anchor, account/tab isolation, explicit conflict freeze, exports/imports and preserving schema-1 migration. Emulator tests cover owner isolation, competing saves and large Unicode accounts. Live owner-provider setup/restore remains unverified. |
| R14 | 38–41 | Actual strict build, engine/persistence/rules/art tests, browser/package checks, seeded balance, seven-day earned progression, adventure/evolution restore suite and inventory benchmark included. Tests use fixtures where explicitly stated; numerical representation and exhaustive balance limits are documented. |
| R16 | Owner UI/farm/drop-rate request | Shared-engine per-victory loot sheets, weighted family egg odds, conditional rarity, boss/relic guarantees, separate adventure completion loot, Foraging egg chance and parent-specific inheritance rates. Seven loot regression tests plus UI checks pass. |
| R15 | 33, 40 | Owner-approved painted direction implemented in all 150 form illustrations, independent atlas viewports, enlarged previews, variant treatments and offline asset cache. Roster image/header tests and all-form browser checks pass. |

## Owner-confirmed architecture change

The owner explicitly accepted browser-computed gameplay with Firebase cloud saves, no anti-cheat, no Blaze and personal use. Original trusted backend randomness/reward validation is intentionally replaced. No replacement Firebase project, billing upgrade, premium currency or paid service is introduced.

## Deployment and verification boundaries

The deliverable is a full source/static release package. Its production URL has not been published by this session. The connected repository rejected writes with `Resource not accessible by integration`; source and compiled files are provided together for mobile upload. Authentication providers, authorized hostname and Firestore rules still require access to the owner's existing Firebase console. A successful emulator test does not establish successful live-account login or cloud restore.

The release evidence covers representative gameplay and all content identities/evolution edges/adventure paths. It does not claim exhaustive strategy balance, a natural all-collectibles playthrough, every rare combination, every phone's performance, or literally infinite machine precision. These are testing limits, not omitted gameplay menus or promised future systems.

## Owner-directed 1.2 changes

The latest instructions replace one active skilling activity with parallel farm areas, reduce ordinary incubation to five minutes and replace the old expandable offline window with a fixed twelve-hour cap for every timer. Tests cover stacked hidden identities, migrated deadlines, welcome-basket idempotency, simultaneous jobs and real production inputs, assignment protections, serialized/chunked equivalence and capped offline settlement. These changes are intentional updates to the initial design.

## 1.3 owner-directed UI and scarcity update

Grouped skill navigation, compact activity/recipe panels and Bank replace the illustrated home. The new browser walkthrough covers bank search/sales/egg loading, all destinations, real parallel tasks, projectile travel and 320px layouts. LOOT-SIMULATION-REPORT.json contains 72 actual eight-hour runs using the shared engine; expected egg counts are illustrative, not guaranteed. Owned eggs/items and schema-1 identities are preserved. First-clear adventure rewards differ from repeat drops and are labeled in the UI.
