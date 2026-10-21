import fs from "node:fs";
import * as E from "./engine";
import { FAMILIES, ADVENTURES } from "./content";
import { Save } from "./model";
function fixture(seed: number, level: number, gear = 20) {
  const s = E.newSave(seed, 1000);
  s.started = true;
  s.facilities.Housing = 30;
  s.gold = "1e9";
  s.unlocks = Array.from({ length: 10 }, (_, i) => `boss-${i}`);
  for (const [n, family] of [
    "E01",
    "N01",
    "S06",
    "N02",
    "W04",
    "F10",
  ].entries()) {
    const inc = {
      id: `qa-${n}`,
      egg: E.egg(s, family, "Release regression fixture"),
      finish: s.time,
    };
    s.incubators.push(inc);
    E.hatch(s, inc.id);
    const c = s.creatures.at(-1)!;
    c.level = level;
    c.stage = 3;
    s.combatTeam[n] = c.id;
    for (const slot of ["Essence", "Gem", "Trinket"] as const) {
      const i = E.rollItem(s, 9, slot, 4);
      i.level = gear;
      s.items.push(i);
      c.equipment[slot] = i.id;
    }
  }
  return s;
}
const results = [];
for (const adventure of ADVENTURES) {
  const trials = [];
  for (const seed of [91, 201, 802]) {
    let outcome: any = null;
    for (const multiple of [1, 1.5, 2, 3, 5, 8]) {
      const level = Math.ceil((10 + adventure.region ** 2 * 5) * multiple);
      const s = fixture(seed, Math.max(80, level));
      E.startCombat(s, adventure.nodes[0], adventure.id);
      const initial = structuredClone(s);
      E.advance(s, s.time + 600000, true);
      const win = s.unlocks.includes(adventure.id);
      if (win) {
        const restored = JSON.parse(JSON.stringify(initial)) as Save;
        // Simulate closing the browser during a run, then return in two partitions.
        E.advance(restored, initial.time + 17000);
        const reopened = JSON.parse(JSON.stringify(restored)) as Save;
        E.advance(reopened, initial.time + 600000, true);
        const a = structuredClone(s),
          b = structuredClone(reopened);
        a.summary = null;
        b.summary = null;
        if (JSON.stringify(a) !== JSON.stringify(b))
          throw Error("Run restore divergence: " + adventure.id);
        outcome = {
          seed,
          level: Math.max(80, level),
          win,
          encounters: s.metrics.wins,
          restored: true,
        };
        break;
      }
    }
    if (!outcome)
      throw Error("Unwinnable adventure: " + adventure.id + " seed " + seed);
    trials.push(outcome);
  }
  results.push({ id: adventure.id, name: adventure.name, trials });
}
// All 100 evolution edges retain individual identity, genetics, variants and gear.
const ev = E.newSave(945, 1000);
ev.facilities.Housing = 30;
ev.gold = "1e9";
ev.unlocks = ["boss-0", "boss-3"];
for (const f of FAMILIES) {
  const inc = {
    id: E.id(ev, "inc"),
    egg: E.egg(ev, f.id, "Evolution regression"),
    finish: ev.time,
  };
  ev.incubators.push(inc);
  E.hatch(ev, inc.id);
  ev.combatTeam.fill(null);
  const c = ev.creatures.at(-1)!;
  c.level = 75;
  const identity = JSON.stringify([
    c.id,
    c.ivs,
    c.color,
    c.effect,
    c.level,
    c.equipment,
  ]);
  for (let stage = 1; stage <= 2; stage++) {
    for (const [k, v] of Object.entries(E.evolutionCost(c)))
      E.resource(ev, k, v);
    E.evolve(ev, c.id);
    if (
      JSON.stringify([c.id, c.ivs, c.color, c.effect, c.level, c.equipment]) !==
      identity
    )
      throw Error("Evolution changed identity");
  }
}
const report = {
  timestamp: new Date().toISOString(),
  adventures: results,
  evolutionEdges: 100,
  discoveredForms: new Set(ev.discovered).size,
  method:
    "Three deterministic seeds per adventure; balanced six-form team; tier-10 Legendary gear at +20; search increasing levels, then verify serialized mid-run restore equals uninterrupted settlement. Progression is deliberately injected only in regression fixtures, not presented as a natural playthrough.",
};
fs.writeFileSync("RELEASE-REPORT.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
