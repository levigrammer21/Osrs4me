# Design decisions

- Owner confirmed browser-calculated gameplay with Firebase cloud saves, no anti-cheat, no Blaze, and private single-player use on 19 October 2026. This supersedes trusted-backend action validation in section 36 of the initial handoff.
- Preserve every roster name and element. Three staged natural-stat multipliers are 1.00 / 1.42 / 1.95; family growth coefficients distinguish progression. Stage changes remain manual.
- Tutorial starter incubation is 30 seconds; all ordinary eggs share the one-hour base. First victory journal rewards the next egg.
- All six combat positions are available once companions exist. No extra combat-slot currency or grind is added.
- Unlisted cross-family breeding resolves 50/50 to a parent. Eight designated recipes have a 30% rare-family outcome, with parental results otherwise. All outputs are in the original 50 families.
- Guaranteed inheritance replaces default inherited positions. Conflicting manually chosen IVs are rejected before spending. Two Legacy Threads select complementary sets of three IV positions.
- Full housing leaves a ready egg in its incubator. Protected creatures are not auto-released; equipped/upgraded/locked/favorite equipment is not auto-salvaged.
- Defeat keeps rewards and run node. Base recovery is five minutes, reduced by upgrades toward a positive minimum. Explicit retry is required.
- Recipes reserve ingredients at cycle start. Pausing completes the reserved cycle; no free output or duplicated ingredients. Team changes wait for completion.
- Active combat runs snapshot stats/formation at encounter boundaries. Equipment/team changes require stopping combat; numerical item upgrades apply when the next encounter is prepared.
- Incubation, breeding, recovery, and already-started facility upgrades honor actual elapsed time. Earnings/workflow processing is capped at 24 hours, expandable to 72. No automated extra jobs are chained outside the earning window.
- Shop currencies are gold and Slayer Tokens only. No premium currency, trading, real-time multiplayer, or paid feature was added.
- Exact simulated events, seeded randomness, and chronological resource consumption are shared online/offline. Long return settlement runs in a worker. Probability bonuses saturate; numerical stats and upgrade levels have no designed gameplay ceiling. Scientific-number representation has practical finite precision, documented in the test report.
- Raids have additional encounter rules: Crucible shields convert to healing on a cycle; Choir healing attracts a cleansable damage-over-time mark; Convergence rotates physical/special defenses and periodically bypasses the front row. These supplement the underlying boss phases.
- Root-only source is preserved. No GitHub Actions folder is created. Compiled output is prepared alongside source for branch-based Pages deployment.
- Equipment upgrades multiply both original rolls and previously earned milestone contributions by the same consistent growth factor. Essence milestones continue using creature-derived materials; additional relic requirements apply to Gem and Trinket milestone attempts.
- Snapshot pages use 50,000-character Unicode-safe boundaries and conservative eight-page batches to keep individual records and commits bounded. The emulator round-trip includes a large account rather than only a tiny starter save.
- The owner approved the painted art direction and requested the full 1.0 package. All forms now use that artwork; atlas sharing does not merge form identities. Encyclopedia inspectors expose large art and mechanical data for every form.
- Refined alloys feed facility levels 5 onward and Gem/Trinket attempts beyond +10, progressing through all five alloy recipes. Slayer milestone steps permanently improve new contract gold/XP by 5% and token rewards by 10% per milestone.
- Automatic cloud checkpoint spacing scales with page count, targeting conservative write traffic for personal free-plan play. Manual cloud saves remain available; quota failures retain local progress.
- Development schema-1 saves migrate without resets/rerolls. Duplicate discovered forms are normalized; normal appearance records are removed from the rare-variant encyclopedia list while individual creatures remain unchanged.

- Version 1.1 keeps schema 1 and all progression. The overhaul changes navigation and presentation, not reward balance. All destinations have direct navigation; advanced settings are grouped behind focused tabs or expandable details.
- Projectile visuals are driven by actual combat events, with short visual HP delay to align impacts; shared online/offline simulation remains authoritative. Both game and operating-system reduced-motion preferences suppress animated travel.
- Drop odds are shown per victorious encounter, with conditional rarity separately labeled. Egg-family weights include duplicate families in encounter definitions. Completion rewards are distinguished from encounter loot. Inheritance odds are shown for the selected parents without exposing undiscovered hybrid names.

- Owner requested a cozy, management-focused farm rework. Version 1.2 explicitly supersedes the single active skilling team: three independent work areas at Workshop 1, one additional area per Workshop level up to eight. Each has up to six helpers; one creature occupies one assignment. No multi-task cloning of a creature.
- Ordinary incubation is now five minutes, with upgrades improving it. Old unfinished ordinary eggs receive one twelfth remaining time once, with no genetics changes. A once-only welcome basket makes early parallel management accessible.
- Owner set a fixed twelve-hour offline cap. It applies to all simulation, including incubation, breeding, upgrades and recovery, and supersedes earlier 24–72h expansion and uncapped non-earning clocks. Expedition investments retain a purpose through combat XP diminishing toward +50%.
- Farm art uses code-native scenery and the existing approved creature paintings. No new creature art or roster changes. Warm sage/paper UI surrounds the existing dark combat arena.

- Owner requested Melvor/Idle Clans-style UI and scarce drops. Version 1.3 replaces the illustrated Home with direct skill navigation, compact tables and a resource bank. Creature artwork and combat effects are retained.
- Wild eggs 0.0005, gear 0.0008; rare multiplier 1.25 for bosses, 1.1 for Slayer, independent of gold/material scaling. Foraging base 0.00001. Existing luck/tier/mastery formulas remain. No session quota or guaranteed five-egg payout is imposed.
- First adventure clears retain guaranteed egg/equipment; repeat dungeon rolls 5% / 25%, raid 10% / 40%. First boss gives a once-only Rare Essence for accessible early gear. Existing collection is never confiscated. Breeding is deliberate production and is not counted as random farming loot.
