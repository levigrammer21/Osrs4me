import { it, expect } from "vitest";
import * as E from "./engine";
import { migrate } from "./persistence";
function setup() {
  const s = E.newSave(116, 1000);
  s.started = true;
  s.facilities.Housing = 10;
  for (let i = 0; i < 6; i++) {
    const inc = {
      id: "test-" + i,
      egg: E.egg(s, ["E01", "N01", "W01"][i % 3], "Test"),
      finish: s.time,
    };
    s.incubators.push(inc);
    E.hatch(s, inc.id);
  }
  s.combatTeam.fill(null);
  return s;
}
it("stacks eggs without merging, rerolling or losing hidden identities", () => {
  const s = setup();
  for (let i = 0; i < 34; i++) s.eggs.push(E.egg(s, "F01", "Test"));
  s.eggs.push(E.egg(s, "W01", "Test"));
  const before = JSON.stringify(s),
    stacks = E.eggStacks(s);
  expect(stacks.find((g) => g.family === "F01")?.count).toBe(34);
  expect(stacks.length).toBe(2);
  expect(JSON.stringify(s)).toBe(before);
  const genetics = s.eggs.filter((e) => e.family === "F01");
  E.loadEggFamily(s, "F01", true);
  for (const inc of s.incubators.filter((i) => i.egg))
    expect(genetics).toContainEqual(inc.egg);
  expect(s.eggs.length + s.incubators.filter((i) => i.egg).length).toBe(35);
});
it("incubates normal eggs in five minutes and applies improvements", () => {
  const s = setup();
  s.eggs.push(E.egg(s, "F01", "Test"));
  E.loadEggFamily(s, "F01");
  expect(s.incubators[0].finish - s.time).toBe(300000);
  s.facilities.Hatchery = 5;
  expect(E.incubationDuration(s)).toBeLessThan(300000);
});
it("grants welcome basket once and preserves existing nests", () => {
  const s = setup(),
    count = s.incubators.length;
  E.welcomeFarm(s);
  expect(s.eggs.length).toBe(2);
  expect(s.incubators.length).toBe(count);
  expect(() => E.welcomeFarm(s)).toThrow();
  const t = E.newSave(21, 1000);
  E.starter(t, "F01");
  E.advance(t, 31000);
  E.hatch(t, "inc-1");
  E.welcomeFarm(t);
  expect(t.incubators.length).toBe(2);
});
it("runs independent gathering and production alongside combat with shared stock", () => {
  const s = setup();
  E.assignFarm(s, 0, s.creatures[0].id);
  E.assignFarm(s, 1, s.creatures[1].id);
  E.assignFarm(s, 2, s.creatures[2].id);
  E.startFarmTask(s, 0, "g0-0");
  E.startFarmTask(s, 1, "g1-0");
  E.startFarmTask(s, 2, "g2-0");
  E.assign(s, s.creatures[3].id, "combat", 0);
  s.creatures[3].level = 80;
  E.startCombat(s, "wild-0-0");
  E.advance(s, s.time + 60000);
  expect(E.D(s.inventory["g0-0"]).gt(0)).toBe(true);
  expect(E.D(s.inventory["g1-0"]).gt(0)).toBe(true);
  expect(E.D(s.inventory["g2-0"]).gt(0)).toBe(true);
  expect(s.skills.Mining.xp).not.toBe("0");
  expect(s.metrics.wins).toBeGreaterThan(0);
  expect(E.workStations(s).filter((j) => j.job).length).toBe(3);
});
it("never steals assigned workers, and reserved cycles protect crew changes", () => {
  const s = setup(),
    cid = s.creatures[0].id;
  E.assignFarm(s, 1, cid);
  E.startFarmTask(s, 1, "g1-0");
  expect(E.free(s, s.creatures[0])).toBe(false);
  expect(() => E.assignFarm(s, 2, cid)).toThrow();
  expect(() => E.assign(s, cid, "combat", 0)).toThrow();
  expect(() => E.release(s, [cid])).toThrow();
  expect(() => E.assignFarm(s, 1, cid)).toThrow();
  E.pauseFarmTask(s, 1);
  expect(() => E.assignFarm(s, 1, cid)).toThrow();
  E.advance(s, s.time + 30000);
  E.assignFarm(s, 1, cid);
  expect(E.free(s, s.creatures[0])).toBe(true);
});
it("settles parallel jobs identically when serialized or advanced in chunks", () => {
  const s = setup();
  for (let i = 0; i < 3; i++) {
    E.assignFarm(s, i, s.creatures[i].id);
    E.startFarmTask(s, i, `g${i}-0`);
  }
  const a = structuredClone(s),
    b = structuredClone(s);
  E.advance(a, a.time + 60000);
  for (let i = 0; i < 6; i++) E.advance(b, b.time + 10000);
  expect(b.inventory).toEqual(a.inventory);
  expect(b.rng).toBe(a.rng);
  const c = migrate(JSON.parse(JSON.stringify(s)));
  E.advance(c, c.time + 60000);
  expect(c.inventory).toEqual(a.inventory);
  expect(c.farmJobs).toEqual(a.farmJobs);
});
it("caps every offline clock at twelve hours even with expedition upgrades", () => {
  const s = setup();
  s.facilities.Expedition = 99;
  E.assignFarm(s, 1, s.creatures[0].id);
  E.startFarmTask(s, 1, "g1-0");
  const base = structuredClone(s);
  E.advance(base, base.time + 12 * 3600000);
  E.advance(s, s.time + 24 * 3600000, true);
  expect(E.offlineCap(s)).toBe(12 * 3600000);
  expect(s.summary!.simulated).toBe(12 * 3600000);
  expect(s.inventory).toEqual(base.inventory);
  expect(s.metrics.cycles).toBe(base.metrics.cycles);
  expect(s.farmJobs![0].job!.finish - s.time).toBeCloseTo(
    base.farmJobs![0].job!.finish - base.time,
    2,
  );
});
it("migrates an in-flight old egg once without changing genetics or original checkpoint", () => {
  const s = setup();
  s.eggs.push(E.egg(s, "F01", "Wild"));
  E.loadEggFamily(s, "F01");
  delete s.farmRevision;
  s.version = "1.1.0";
  s.incubators[0].finish = s.time + 3600000;
  const original = JSON.stringify(s),
    m = migrate(s);
  expect(m.incubators[0].finish - m.time).toBe(300000);
  expect(m.incubators[0].egg).toEqual(s.incubators[0].egg);
  expect(JSON.stringify(s)).toBe(original);
  expect(migrate(m)).toEqual(m);
});
it("rejects duplicated or cross-team farm workers rather than corrupting a save", () => {
  const s = setup();
  E.assignFarm(s, 1, s.creatures[0].id);
  s.skillTeam = [s.creatures[0].id];
  expect(() => migrate(s)).toThrow(/farm/);
});
it("feeds a real production recipe from parallel gathering and spends shared ingredients once", () => {
  const s = setup();
  E.assignFarm(s, 0, s.creatures[0].id);
  E.assignFarm(s, 1, s.creatures[1].id);
  E.assignFarm(s, 2, s.creatures[2].id);
  E.startFarmTask(s, 0, "g1-0");
  E.startFarmTask(s, 1, "g3-0");
  E.advance(s, s.time + 30000);
  const ore = E.D(s.inventory["g1-0"]),
    herbs = E.D(s.inventory["g3-0"]);
  E.startFarmTask(s, 2, "p1-0");
  expect(E.D(s.inventory["g1-0"]).eq(ore.sub(2))).toBe(true);
  expect(E.D(s.inventory["g3-0"]).eq(herbs.sub(1))).toBe(true);
  E.advance(s, s.farmJobs![1].job!.finish);
  expect(E.D(s.inventory.gemdust).gte(1)).toBe(true);
  expect(s.skills.Smithing.xp).not.toBe("0");
  expect(s.skillJob).not.toBeNull();
  expect(s.farmJobs![0].job).not.toBeNull();
});
