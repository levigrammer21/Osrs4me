# Creature Adventure

Release **1.3.0 — Idle Interface & Rare Loot**. A mobile-first, single-player creature collector using the owner's `creaturerpg` Firebase project. All calculations run on-device; Firebase handles authentication and cloud snapshots. No Blaze plan, Cloud Functions, paid backend, or billing setup.

The package contains the playable compiled game, complete TypeScript source, all 150 painted forms, configuration files and actual test reports. Production account setup is still required in the owner’s existing Firebase/GitHub projects; no live deployment or real-account verification is claimed.

## Phone-only deployment

The repository delivery includes a compiled `index.html`, JavaScript/CSS bundles, manifest, service worker, and flat TypeScript source. No local build is needed to play.

1. On GitHub, open this repository → **Settings → Pages**.
2. Select **Deploy from a branch**, the delivered branch, and **/(root)**. Save.
3. Wait for GitHub to show the Pages URL. Expected repository path: `https://levigrammer21.github.io/Creature-adventure-/` (availability must be verified after Pages is enabled).
4. Open that URL in your phone's normal browser. Add it to your home screen if desired.

No `.github/workflows` exception is used. Source and deployable files remain flat; generated local staging and installed dependencies are not committed. All assets are bundled or use system-font fallback; Firebase Storage is not used.

## Firebase console setup — required once

The provided web config is included. It does not grant administrative access to your Firebase console. These settings have **not** been changed for you:

1. In the existing **creaturerpg** project, enable Authentication → Email/Password and Google. Choose the Google support email if asked.
2. Add **levigrammer21.github.io** to Authentication's authorized domains. Use the hostname without the repository path. Keep your existing domains.
3. Create the default Cloud Firestore database if it does not exist. Stay on the free Spark plan.
4. Copy the complete contents of the root **firestore.rules** file into Firestore → Rules and publish them. Do not use public test rules.
5. Open the game, create/sign into your own account, and select **Save to cloud now** in Settings.
6. Verify on another device by signing into the same account. After the initial transfer, use one active device at a time.

Google sign-in uses a popup. If an embedded app browser blocks popups, open the Pages URL in Chrome or Safari. Password reset is available in the account panel.

## Device and cloud saves

The guest sanctuary and each signed-in account have separate IndexedDB saves. If you play as a guest first, sign in and use **Settings → Import guest sanctuary**, then **Save to cloud now**. This explicitly replaces the account's current local timeline; it does not merge rewards.

Local checkpoints occur every five seconds and after commands. Cloud checkpoints begin at a 90-second interval and automatically space out as snapshot size grows to reduce free-plan write traffic. They can also be requested manually. Cloud data is partitioned into immutable bounded snapshot pages with an atomically updated revision pointer. A new pointer becomes visible only after its pages are written.

If a different device saved first, the game stops automatic reconciliation and offers an export of the current timeline and loading the cloud timeline. It never adds rewards from conflicting timelines. Cloud network/quota failures preserve the local checkpoint. Do not clear browser storage before unsynced progress is backed up.

Server timestamps provide a connected clock anchor where rules permit it. Guest and disconnected progress use the device clock until reconnection. This is not an anti-cheat service; modified clients can alter their own progress, as accepted by the owner.

## Playing

- Choose Cindlet, Burlit, or Droplet. Your first egg takes 30 seconds; later eggs share a five-minute base incubation duration.
- Home is a compact account overview with active activities, skill levels and farm status. Hatch your first companion there, then open the once-only welcome basket for Pebbit/Sporel helper eggs and a second nest if needed.
- The bottom buttons open Home, Combat, Skills, Farm and Bank. On phones, the menu button opens all destinations and direct skill shortcuts. On larger screens, grouped sidebar navigation shows skill levels and active jobs. The bottom bar includes Bank.
- Use **Combat team** edits your battle formation. Skills uses an activity catalog and recipe panel: each work area has its own task and one to six helpers. Start with three parallel tasks; each Workshop level adds one up to eight. A creature keeps one assignment.
- Combat has focused Battle, Hunts, Dungeons and Raids tabs. Elemental projectiles, impacts, floating numbers, action bars and ability captions follow real combat events.
- Tap **Drop rates** on a battle or encounter to see actual per-victory egg/equipment odds, family chances, rarity odds and guaranteed rewards. Dungeon and raid completion rewards are separate from encounter loot. Foraging shows egg chance per cycle; Breeding shows the selected parents’ inheritance odds.
- Farm has Overview, Hatchery, Breeding and Buildings tabs. Equipment uses compact rows: tap one to equip, upgrade or inspect it. Shop separates Supplies, Slayer and Materials.
- Tap **Start hunt** on Home or select a wild encounter under Combat → Hunts. The opening list favors your first companion's elemental advantage.
- Claim **Into the wilds** in the Home journal or Collection → Journal for a second egg.
- Give free creatures different farm jobs. Gathering and production share your materials and can run alongside combat. Ingredients reserve at cycle start; pause finishes that cycle before helpers can move. Production stops if supplies run out.
- The first boss unlocks breeding, equipment upgrades, and Slayer. Evolution is manual at levels 25 and 75, with materials and boss requirements.
- Pause skilling and let the reserved cycle finish before changing its crew. Stop combat before changing its formation or equipment.
- Facility descriptions show automation milestones. Rule previews exclude protected creatures/equipment. Review destructive actions carefully.
- Defeat stops combat. The team recovers automatically, and a retry resumes the saved encounter when requested. Earned rewards remain.

## Loot balance and bank

Normal encounters now roll 0.05% for an egg and 0.08% for equipment per victory before luck. Bosses roll 0.0625% / 0.1%; Slayer encounters roll 0.055% / 0.088%. Materials and gold retain their normal progression. Foraging starts at 0.001% per cycle, adjusted by its existing tier/mastery/luck formula.

Seventy-two actual seeded eight-hour settlements averaged 4.8–5.5 eggs and 7.8–8.8 equipment for the two normal farming fixtures. Boss farming averaged 6.2 eggs and 10.5 items. These are fixed-team cadence fixtures, not a guaranteed allowance; some sessions found no eggs. Breeding outputs and once-only gifts are separate. Existing owned eggs/items are preserved. See LOOT-SIMULATION-REPORT.json.

Adventure first clears guarantee an egg and Epic/Legendary equipment. Repeat dungeon completion rolls 5% egg / 25% equipment; repeat raids roll 10% / 40%. Gold/relics remain guaranteed. First boss clears also grant one Rare Essence once. Drop sheets distinguish first-clear guarantees from repeatable rolls.

Bank provides searchable resource and egg stack grids with real stored counts, category filters, exact-quantity selling and direct egg loading. Equipment management retains its own full inspection/upgrade/salvage screen.

## Farm and offline progression

Egg storage groups by family, such as **Cindlet egg ×34**. Individual eggs retain their IDs, sources, genetics and variant rolls; oldest matching eggs load first. Fill empty nests and hatch all ready eggs in one action. Ordinary incubation is five minutes before upgrades. Existing in-flight ordinary eggs receive one twelfth of their former remaining time exactly once when migrating. Ready eggs and the 30-second starter retain their deadlines.

All offline progress has a fixed **12-hour cap**: combat, farm tasks, automation, incubation, breeding, facility work and recovery. Pending timers freeze after those 12 hours and resume on return. Expedition no longer increases the window; its existing levels now improve combat XP with diminishing returns toward +50%.

Work area 1 preserves the old crew, queue, workflows and loadouts. Additional work areas persist independently and use the same chronological resolver. No active creature is borrowed from another task, combat or breeding.

## Development

Root source modules: model.ts, content.ts, engine.ts, persistence.ts, app.tsx, interface.tsx, idle.tsx, farm.tsx, portraits.tsx, main.tsx, styles.css, interface.css, farm.css, idle.css, simulator-worker.ts. Deterministic engine functions do not depend on React or Firebase.

With Node available: `npm ci`, `npm test`, `npm run balance`, `npm run build`. These are developer commands, not required to play or deploy the delivered static files from a phone.

The build uses `index.source.html` as its source template, emits flat output to a transient staging directory, and packages the manifest/service worker. Commit the prepared source and output together. Keep a visible version and update CHANGELOG.md on every release. Do not edit generated bundles by hand.

Browser verification uses `node --import tsx browser-check.mjs`, with `CHROMIUM_PATH` pointing to a supported local Chromium binary. It starts its own Vite server in the same process and uses isolated test fixtures; no real player account is created. Firestore rules tests use the local emulator with the demo project only; no production rules or billing settings are changed.

## Artwork and encyclopedia

All 150 forms use the approved painted art. Tap any form in Collection to enlarge it and inspect its stats, abilities, passive, aptitudes and evolution costs. Color/effect preview controls demonstrate all nine variant combinations. Image assets are the only nested project files, inside `img/`.

## Verification

See TEST-REPORT.md for the actual test/build evidence and its limits. Reproduce the extra checks with `npm run release:check`, `npm run progression`, and `node --import tsx performance-check.ts`. The supplied reports distinguish earned-only progression from deliberately populated regression fixtures.
