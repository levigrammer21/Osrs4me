import fs from "node:fs";
import * as E from "./engine";
const s = E.newSave(1881, 1000);
s.facilities.Housing = 2;
const inc = {
  id: "fixture",
  egg: E.egg(s, "F01", "Performance regression"),
  finish: s.time,
};
s.incubators.push(inc);
E.hatch(s, inc.id);
for (let n = 0; n < 50000; n++) s.items.push(E.rollItem(s, 5, "Essence", 3));
const c = s.creatures[0];
c.equipment.Essence = s.items.at(-1)!.id;
const equipped = c.equipment.Essence;
let start = performance.now();
for (let n = 0; n < 1000; n++) E.stats(s, c);
const statMs = performance.now() - start;
const before = E.bonus(s, c, s.items.at(-1)!.affixes[0].key);
s.items.at(-1)!.level = 1;
const after = E.bonus(s, c, s.items.at(-1)!.affixes[0].key);
if (!after.gt(before)) throw Error("Stale equipment index");
start = performance.now();
E.salvage(
  s,
  s.items.filter((i) => i.id !== equipped).map((i) => i.id),
);
const salvageMs = performance.now() - start;
if (s.items.length !== 1 || s.items[0].id !== equipped)
  throw Error("Bulk salvage lost equipped item");
const report = {
  timestamp: new Date().toISOString(),
  inventory: 50000,
  naturalStatComputations: 1000,
  statMs,
  bulkSalvaged: 49999,
  salvageMs,
  equippedRetained: true,
  method:
    "Single local Node runtime benchmark; indicative rather than a phone speed guarantee.",
};
fs.writeFileSync("PERFORMANCE-REPORT.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
