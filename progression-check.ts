import fs from "node:fs";
import * as E from "./engine";
import { FAMILY, JOURNAL } from "./content";
import { Save } from "./model";
const s = E.newSave(281171, 1000);
E.starter(s, "F01");
E.advance(s, 32000);
E.hatch(s, s.incubators[0].id);
const steps = [];
function attempt(fn: () => void) {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}
for (let tick = 0; tick < 2016; tick++) {
  if (s.combat?.defeats) {
    E.stopCombat(s);
  }
  for (const j of JOURNAL)
    if (!s.claims.includes(j[0]) && (s.metrics[j[2]] || 0) >= j[3])
      attempt(() => E.claim(s, j[0]));
  for (const inc of s.incubators)
    if (inc.egg && inc.finish <= s.time && s.creatures.length < E.capacity(s))
      attempt(() => E.hatch(s, inc.id));
  if (
    s.creatures.length >= E.capacity(s) - 1 &&
    !s.upgrades.some((u) => u.facility === "Housing")
  )
    attempt(() => E.upgradeFacility(s, "Housing"));
  if (s.incubators.length < 4 && s.eggs.length > 0)
    attempt(() => E.buildIncubator(s));
  for (const inc of s.incubators)
    if (!inc.egg && s.eggs.length)
      attempt(() => E.loadEgg(s, inc.id, s.eggs[0].id));
  // Reconsider composition at five-minute intervals; never inject levels or currencies.
  if (s.combat) E.stopCombat(s);
  for (const id of [...s.combatTeam])
    if (id) attempt(() => E.assign(s, id, "reserve"));
  for (const c of s.creatures.filter((c) => E.free(s, c) && c.stage < 3))
    attempt(() => E.evolve(s, c.id));
  const available = s.creatures.filter(
    (c) => c.recoveryUntil <= s.time && !s.skillTeam.includes(c.id),
  );
  const sorted = [...available].sort((a, b) => {
    const score = (c: typeof a) =>
      c.level * 2 +
      (FAMILY[c.family].passive.kind === "regen" ? 10 : 0) +
      c.stage * 5;
    return score(b) - score(a);
  });
  s.combatTeam = Array(6).fill(null);
  for (let slot = 0; slot < Math.min(6, sorted.length); slot++)
    attempt(() => E.assign(s, sorted[slot].id, "combat", slot));
  if (!s.skillTeam.length) {
    const worker = s.creatures.find((c) => E.free(s, c));
    if (worker) attempt(() => E.assign(s, worker.id, "skill"));
  }
  if (s.skillTeam.length && !s.skillJob) attempt(() => E.startSkill(s, "g1-0"));
  for (const c of s.creatures.filter((c) => E.free(s, c) && c.stage < 3))
    attempt(() => E.evolve(s, c.id));
  // Collect essence from surplus reserve duplicates, preserving a representative of each family.
  if (s.creatures.length > 10) {
    const keep = new Set<string>();
    for (const c of [...s.creatures]) {
      if (keep.has(c.family) && E.free(s, c))
        attempt(() => E.release(s, [c.id]));
      else keep.add(c.family);
    }
  }
  const remaining = s.items
    .filter((i) => !E.equipped(s, i))
    .sort((a, b) => b.rarity - a.rarity);
  for (const c of s.creatures.filter((c) => s.combatTeam.includes(c.id)))
    for (const slot of ["Essence", "Gem", "Trinket"] as const) {
      const next = remaining.find((i) => i.slot === slot && !E.equipped(s, i));
      if (next && !c.equipment[slot]) attempt(() => E.equip(s, c.id, next.id));
    }
  const surplus = s.items
    .filter((i) => !E.equipped(s, i) && !i.locked && !i.favorite)
    .map((i) => i.id);
  if (surplus.length) attempt(() => E.salvage(s, surplus));
  if (tick % 288 === 0) console.error(`Simulated day ${tick / 288}`);
  const region = Math.min(9, s.unlocks.filter((u) => /^boss-/.test(u)).length);
  const team = s.creatures.filter((c) => s.combatTeam.includes(c.id));
  const level =
    team.reduce((v, c) => v + c.level, 0) / Math.max(1, team.length);
  const challenge = team.length >= 4 && tick % 6 === 0;
  const encounter = challenge
    ? `boss-${region}`
    : `wild-${region}-${Math.floor(tick / 3) % 5}`;
  attempt(() => E.startCombat(s, encounter));
  if (challenge && s.combat) {
    s.combat.repeat = false;
    s.combat.limit = 1;
  }
  E.advance(s, s.time + 300000);
  if (tick % 144 === 0)
    steps.push({
      hour: tick / 12,
      creatures: s.creatures.length,
      levels: s.creatures.map((c) => c.level),
      regions: s.unlocks.filter((u) => /^boss-/.test(u)).length,
      gold: s.gold,
      wins: s.metrics.wins || 0,
      skillCycles: s.metrics.cycles || 0,
    });
}
const report = {
  seed: 281171,
  simulatedHours: 168,
  policy:
    "Five-minute decisions; real XP/resources only; no injected progression.",
  steps,
  final: {
    creatures: s.creatures.length,
    incubators: s.incubators.length,
    regions: s.unlocks.filter((u) => /^boss-/.test(u)).length,
    skillCycles: s.metrics.cycles || 0,
    wins: s.metrics.wins || 0,
    highestLevel: Math.max(...s.creatures.map((c) => c.level)),
    forms: new Set(s.discovered).size,
    evolutions: s.metrics.evolutions || 0,
    families: new Set(s.creatures.map((c) => c.family)).size,
  },
  limitations: [
    "This is one simple automatic policy, not an optimized player or comprehensive economy certification.",
    "Production, breeding and late raids have separate tests; this policy focuses on natural early/mid progression.",
  ],
};
fs.writeFileSync("PROGRESSION-REPORT.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.final));
