import fs from "node:fs";
import * as E from "./engine";
import { Save } from "./model";
function fixture(seed: number, level: number, encounter: string) {
  const s = E.newSave(seed, 1000);
  s.started = true;
  s.facilities.Housing = 50;
  s.unlocks = Array.from({ length: 10 }, (_, i) => `boss-${i}`);
  for (const [i, family] of [
    "S01",
    "F03",
    "N06",
    "E04",
    "W06",
    "N02",
    "N04",
  ].entries()) {
    const inc = {
      id: "sim" + i,
      egg: E.egg(s, family, "Loot simulation fixture"),
      finish: s.time,
    };
    s.incubators.push(inc);
    E.hatch(s, inc.id);
    const c = s.creatures.at(-1)!;
    c.level = level;
    c.stage = 3;
    if (i < 6) s.combatTeam[i] = c.id;
    else E.assignFarm(s, 0, c.id);
  }
  E.startFarmTask(s, 0, "g3-0");
  E.startCombat(s, encounter);
  return s;
}
const configs = [
  ["balanced farming", 80, "wild-2-0"],
  ["overleveled starter farming", 300, "wild-0-0"],
  ["boss farming", 300, "boss-2"],
] as const;
const scenarios = [];
for (const [name, level, encounter] of configs) {
  const trials: {
    seed: number;
    wins: number;
    defeats: number;
    eggs: number;
    combatEggs: number;
    foragingEggs: number;
    equipment: number;
    simulatedHours: number;
  }[] = [];
  for (let seed = 1; seed <= 24; seed++) {
    const s = fixture(991 * seed, level, encounter),
      eggIds = new Set(s.eggs.map((e) => e.id));
    E.advance(s, s.time + 8 * 3600000, true);
    const eggs = s.eggs.filter((e) => !eggIds.has(e.id));
    trials.push({
      seed,
      wins: s.metrics.wins || 0,
      defeats: s.metrics.defeats || 0,
      eggs: eggs.length,
      combatEggs: eggs.filter((e) => e.source !== "Foraging").length,
      foragingEggs: eggs.filter((e) => e.source === "Foraging").length,
      equipment: s.items.length,
      simulatedHours: s.summary!.simulated / 3600000,
    });
  }
  const mean = (key: "eggs" | "equipment" | "wins") =>
    trials.reduce((n, t) => n + t[key], 0) / trials.length;
  scenarios.push({
    name,
    level,
    encounter,
    meanEggs: mean("eggs"),
    meanEquipment: mean("equipment"),
    meanVictories: mean("wins"),
    minEggs: Math.min(...trials.map((t) => t.eggs)),
    maxEggs: Math.max(...trials.map((t) => t.eggs)),
    trials,
  });
}
const report = {
  version: "1.3.0",
  timestamp: new Date().toISOString(),
  method:
    "72 actual seeded eight-hour settlements through the shared engine. Six stage-three creatures; one independent forager; no gear or luck; boss unlocks already cleared, so first-clear gifts excluded. Levels deliberately injected as cadence fixtures. Random drops are not a guaranteed session allowance.",
  rates: {
    wildEgg: 0.0005,
    wildEquipment: 0.0008,
    bossEgg: 0.000625,
    bossEquipment: 0.001,
    baseForagingEgg: 0.00001,
  },
  scenarios,
};
fs.writeFileSync(
  "LOOT-SIMULATION-REPORT.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    scenarios.map(({ trials, ...s }) => s),
    null,
    2,
  ),
);
if (scenarios.some((s) => s.meanEggs > 9 || s.meanEquipment > 15))
  throw Error("Loot throughput exceeds the scarcity envelope.");
