import fs from "node:fs";
import * as E from "./engine";
import { FAMILIES, ACTIVITIES } from "./content";
import { Save, STATS } from "./model";
function companion(s: Save, family: string, level = 1, stage = 1) {
  const inc = {
    id: E.id(s, "inc"),
    egg: E.egg(s, family, "Simulation"),
    finish: s.time,
  };
  s.incubators.push(inc);
  E.hatch(s, inc.id);
  const c = s.creatures.at(-1)!;
  c.level = level;
  c.stage = stage;
  return c;
}
const starters = [];
for (const fid of ["F01", "N01", "W01"]) {
  const outcomes = [];
  for (let seed = 1; seed <= 100; seed++) {
    const s = E.newSave(seed, 1000);
    companion(s, fid);
    E.startCombat(s, "wild-0-0");
    E.advance(s, 301000);
    outcomes.push({
      wins: s.metrics.wins || 0,
      defeats: s.metrics.defeats || 0,
      level: s.creatures[0].level,
    });
  }
  starters.push({
    family: fid,
    averageWins5m: outcomes.reduce((v, x) => v + x.wins, 0) / 100,
    defeatRate: outcomes.filter((x) => x.defeats).length / 100,
    averageLevel: outcomes.reduce((v, x) => v + x.level, 0) / 100,
  });
}
const teams = [];
for (let r = 0; r < 10; r++) {
  const s = E.newSave(900 + r, 1000);
  s.unlocks = Array.from({ length: 10 }, (_, i) => "boss-" + i);
  const level = 10 + r * r * 5;
  ["N01", "E01", "F01", "N02", "S02", "W01"].forEach((fid, i) => {
    const c = companion(s, fid, level, level >= 75 ? 3 : level >= 25 ? 2 : 1);
    s.combatTeam[i] = c.id;
  });
  E.startCombat(s, "boss-" + r);
  E.advance(s, 601000);
  teams.push({
    region: r + 1,
    level,
    wins: s.metrics.wins || 0,
    defeats: s.metrics.defeats || 0,
  });
}
const family = [];
for (const f of FAMILIES) {
  const s = E.newSave(400 + FAMILIES.indexOf(f), 1000);
  const level = 30;
  ["N01", "E01", f.id, "N02", "S02", "W01"].forEach((fid, i) => {
    const c = companion(s, fid, level, 2);
    s.combatTeam[i] = c.id;
  });
  s.unlocks = ["boss-0", "boss-1"];
  E.startCombat(s, "boss-2");
  E.advance(s, 301000);
  family.push({
    id: f.id,
    role: f.role,
    wins: s.metrics.wins || 0,
    defeats: s.metrics.defeats || 0,
  });
}
const s = E.newSave(500, 1000);
const rarity = Array(6).fill(0);
for (let i = 0; i < 100000; i++) rarity[E.rollItem(s).rarity]++;
const upgrade = [10, 11, 20, 30, 40, 60, 100, 200].map((target) => ({
  target,
  chance: E.upgradeChance(target),
  expectedAttempts: 1 / E.upgradeChance(target),
}));
const report = {
  timestamp: new Date().toISOString(),
  seededTrials: 100,
  starters,
  regionBossTeams: teams,
  familySubstitution: family,
  raritySamples: 100000,
  rarityCounts: rarity,
  upgradeMilestones: upgrade,
  variantAnalytic: {
    inverted: 1 / 200,
    prismatic: 1 / 200,
    sparkling: 1 / 200,
    glowing: 1 / 200,
    anyRare: 1 - 0.99 ** 2,
    specificDual: 1 / 40000,
    bothMatchingParentsDual: 1 / 625,
  },
  content: {
    families: FAMILIES.length,
    forms: FAMILIES.length * 3,
    activities: ACTIVITIES.length,
  },
  limitations: [
    "A substitution win does not establish competitive equality.",
    "These simulations omit equipment and player strategy optimization.",
    "Real-time cloud login and mobile-device hardware behavior require live verification.",
  ],
};
fs.writeFileSync("BALANCE-REPORT.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      starters,
      regionBossTeams: teams,
      familyWins: {
        min: Math.min(...family.map((f) => f.wins)),
        max: Math.max(...family.map((f) => f.wins)),
      },
      rarityCounts: rarity,
    },
    null,
    2,
  ),
);
