import { describe, it, expect } from "vitest";
import * as E from "./engine";
import {
  FAMILIES,
  ACTIVITIES,
  ENCOUNTERS,
  ADVENTURES,
  FAMILY,
  JOURNAL,
} from "./content";
import { Save, Creature, STATS, Stat } from "./model";
function creature(
  s: Save,
  family = "F01",
  gender: "M" | "F" = "F",
  perfect = false,
) {
  const e = E.egg(s, family, "Test");
  if (perfect) for (const k of STATS) e.ivs[k] = 31;
  const inc = { id: E.id(s, "inc"), egg: e, finish: s.time };
  s.incubators.push(inc);
  E.hatch(s, inc.id);
  const c = s.creatures.at(-1)!;
  c.gender = gender;
  return c;
}
function rich(s: Save) {
  s.gold = "1e100";
  s.tokens = "1e100";
  for (const k of [
    "essence",
    "gemdust",
    "thread",
    "relic",
    "catalyst",
    "inherit1",
    "inherit2",
    "inherit3",
    "refined2",
    "refined5",
    "refined8",
    "refined11",
    "refined14",
    ...Array.from({ length: 4 }, (_, k) =>
      Array.from({ length: 12 }, (_, t) => `g${k}-${t}`),
    ).flat(),
  ])
    s.inventory[k] = "1e100";
}
function comparable(s: Save) {
  const c = structuredClone(s);
  c.summary = null;
  return c;
}
describe("Complete content graph", () => {
  it("represents exactly 50 families / 150 forms / ten families per element", () => {
    expect(E.validateContent()).toEqual([]);
    expect(new Set(FAMILIES.flatMap((f) => f.names)).size).toBe(150);
    expect(FAMILIES.flatMap((f) => f.abilities).length).toBe(150);
  });
  it("has 112 activities, 10 bosses, 5 dungeons and 3 raids", () => {
    expect(ACTIVITIES).toHaveLength(112);
    expect(ENCOUNTERS.filter((e) => e.kind === "boss")).toHaveLength(10);
    expect(ADVENTURES.filter((e) => e.kind === "dungeon")).toHaveLength(5);
    expect(ADVENTURES.filter((e) => e.kind === "raid")).toHaveLength(3);
  });
  it("has real ingredient sources and every family is in wild loot", () => {
    const outputs = new Set(ACTIVITIES.flatMap((a) => Object.keys(a.outputs)));
    for (const a of ACTIVITIES)
      for (const k of Object.keys(a.inputs)) expect(outputs.has(k)).toBe(true);
    for (const f of FAMILIES)
      expect(
        ENCOUNTERS.some((e) => e.kind === "wild" && e.families.includes(f.id)),
      ).toBe(true);
    for (const a of ADVENTURES)
      for (const id of a.nodes)
        expect(ENCOUNTERS.some((e) => e.id === id)).toBe(true);
  });
  it("calculates all six finite stats for every evolutionary form", () => {
    const s = E.newSave(41, 1000);
    for (const f of FAMILIES)
      for (let stage = 1; stage <= 3; stage++) {
        const c = { ...creature(s, f.id), stage, level: 75 };
        for (const value of Object.values(E.stats(s, c)))
          expect(value.gt(0) && Number.isFinite(value.exponent)).toBe(true);
        s.creatures = [];
      }
  });
});
describe("Formulas, randomness, progression", () => {
  it("implements the exact 5×5 elemental cycle", () => {
    const e = ["Fire", "Nature", "Earth", "Storm", "Water"];
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++)
        expect(E.elemental(e[i], e[j])).toBe(
          (i + 1) % 5 === j ? 1.25 : (j + 1) % 5 === i ? 0.75 : 1,
        );
  });
  it("produces deterministic RNG and stable hidden egg attributes", () => {
    const a = E.newSave(42, 1000),
      b = E.newSave(42, 1000);
    expect(E.egg(a, "F01", "Test")).toEqual(E.egg(b, "F01", "Test"));
    const serialized = JSON.stringify(a);
    expect(JSON.stringify(JSON.parse(serialized))).toBe(serialized);
  });
  it("samples base variant axes with expected independent rates", () => {
    const s = E.newSave(108, 1000);
    let colors = 0,
      effects = 0,
      dual = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) {
      const a = E.variant(s, "color") !== "Normal",
        b = E.variant(s, "effect") !== "Normal";
      colors += +a;
      effects += +b;
      dual += +(a && b);
    }
    expect(colors / n).toBeGreaterThan(0.009);
    expect(colors / n).toBeLessThan(0.011);
    expect(effects / n).toBeGreaterThan(0.009);
    expect(effects / n).toBeLessThan(0.011);
    expect(dual).toBeGreaterThan(8);
    expect(dual).toBeLessThan(38);
  });
  it("keeps rarity stat counts exact and unique over 6000 equipment rolls", () => {
    const s = E.newSave(71, 1000);
    for (let r = 0; r < 6; r++)
      for (let i = 0; i < 1000; i++) {
        const item = E.rollItem(s, 4, undefined, r);
        expect(item.affixes.length).toBe(r + 1);
        expect(new Set(item.affixes.map((a) => a.key)).size).toBe(r + 1);
        expect(item.affixes.every((a) => E.D(a.roll).gt(0))).toBe(true);
      }
  });
  it("uses guaranteed early upgrades and never falls below 1%", () => {
    for (let n = 1; n <= 10; n++) expect(E.upgradeChance(n)).toBe(1);
    expect(E.upgradeChance(11)).toBe(0.95);
    expect(E.upgradeChance(1e6)).toBe(0.01);
  });
  it("stores permanent milestones and immutable original salvage returns", () => {
    const s = E.newSave(17, 1000);
    rich(s);
    s.unlocks = ["boss-0"];
    const i = E.rollItem(s, 2, "Essence", 2);
    s.items = [i];
    const value = E.salvageValue(i).toString();
    for (let n = 0; n < 10; n++) expect(E.upgradeItem(s, i.id)).toBe(true);
    expect(i.level).toBe(10);
    expect(i.milestones.length).toBe(1);
    expect(E.salvageValue(i).toString()).toBe(value);
    expect(JSON.parse(JSON.stringify(i)).milestones).toEqual(i.milestones);
  });
  it("fails upgrades without destroying, downgrading, or refunding", () => {
    const s = E.newSave(10, 1000);
    rich(s);
    s.unlocks = ["boss-0"];
    const i = E.rollItem(s);
    i.level = 200;
    s.items = [i];
    s.inventory.essence = "1000000000000000000000000";
    const original = i.level;
    let failures = 0;
    for (let n = 0; n < 50; n++) {
      const before = E.D(s.gold);
      const level = i.level;
      const result = E.upgradeItem(s, i.id);
      if (!result) {
        failures++;
        expect(i.level).toBe(level);
      }
      expect(s.items[0]).toBe(i);
      expect(E.D(s.gold).lte(before)).toBe(true);
    }
    expect(failures).toBeGreaterThan(40);
    expect(i.level).toBeGreaterThanOrEqual(original);
  });
  it("calculates uncapped equipment values above ordinary floating point magnitudes", () => {
    const s = E.newSave(15, 1000),
      i = E.rollItem(s);
    i.level = 100000;
    const stats = Object.values(E.itemStats(i));
    expect(stats[0].exponent).toBeGreaterThan(308);
    expect(stats[0].mantissa).toBeGreaterThan(0);
  });
});
describe("Breeding, acquisition and protections", () => {
  it("guarantees all six IVs from perfect parents with two legacy threads", () => {
    const s = E.newSave(876, 1000);
    rich(s);
    s.unlocks = ["boss-0"];
    s.facilities.Breeding = 200;
    const m = creature(s, "F01", "F", true),
      f = creature(s, "F01", "M", true);
    s.combatTeam.fill(null);
    for (let n = 0; n < 100; n++) {
      E.breed(s, m.id, f.id, 3, 3);
      expect(Object.values(s.breeding.at(-1)!.egg.ivs)).toEqual([
        31, 31, 31, 31, 31, 31,
      ]);
      s.breeding = [];
    }
  });
  it("rejects overlapping guaranteed selections without spending", () => {
    const s = E.newSave(9, 1000);
    rich(s);
    s.unlocks = ["boss-0"];
    const m = creature(s, "F01", "F"),
      f = creature(s, "F01", "M");
    s.combatTeam.fill(null);
    const before = s.inventory.inherit1;
    expect(() => E.breed(s, m.id, f.id, 1, 1, ["hp"], ["hp"])).toThrow(
      /same stat/,
    );
    expect(s.inventory.inherit1).toBe(before);
  });
  it("reserves parents and creates a stable egg at job start", () => {
    const s = E.newSave(13, 1000);
    rich(s);
    s.unlocks = ["boss-0"];
    const m = creature(s, "N01", "F"),
      f = creature(s, "F01", "M");
    s.combatTeam.fill(null);
    E.breed(s, m.id, f.id, 0, 0);
    const e = structuredClone(s.breeding[0].egg);
    expect(E.free(s, m)).toBe(false);
    E.advance(s, s.breeding[0].finish + 1);
    expect(s.eggs[0]).toEqual(e);
    expect(E.free(s, m)).toBe(true);
  });
  it("does not hatch into full housing or release favorites", () => {
    const s = E.newSave(13, 1000);
    for (let n = 0; n < 10; n++) creature(s);
    const inc = { id: "full", egg: E.egg(s, "N01", "Test"), finish: s.time };
    s.incubators.push(inc);
    expect(() => E.hatch(s, "full")).toThrow(/Housing/);
    expect(inc.egg).not.toBeNull();
    const c = s.creatures[0];
    c.favorite = true;
    s.combatTeam.fill(null);
    expect(() => E.release(s, [c.id])).toThrow(/protected/);
  });
  it("protects equipped, upgraded, locked, and favorite items from auto-salvage", () => {
    const s = E.newSave(15, 1000);
    const c = creature(s);
    const items = Array.from({ length: 4 }, () => E.rollItem(s));
    items[0].level = 1;
    items[1].locked = true;
    items[2].favorite = true;
    c.equipment[items[3].slot] = items[3].id;
    s.items = items;
    E.salvage(
      s,
      items.map((i) => i.id),
      true,
    );
    expect(s.items).toHaveLength(4);
  });
  it("evolves manually preserving identity, IVs, variants, and level", () => {
    const s = E.newSave(15, 1000);
    rich(s);
    s.unlocks = ["boss-0", "boss-3"];
    const c = creature(s);
    s.combatTeam.fill(null);
    c.level = 75;
    const old = structuredClone(c);
    E.evolve(s, c.id);
    expect(c.stage).toBe(2);
    expect(c.id).toBe(old.id);
    expect(c.ivs).toEqual(old.ivs);
    expect(c.level).toBe(75);
    E.evolve(s, c.id);
    expect(c.stage).toBe(3);
  });
});
describe("Skills, contracts and workflows", () => {
  it("shares a fixed creature XP pool while granting full player skill XP", () => {
    const a = E.newSave(30, 1000),
      b = E.newSave(30, 1000);
    a.facilities.Housing = 10;
    b.facilities.Housing = 10;
    const ca = creature(a);
    a.combatTeam.fill(null);
    a.skillTeam = [ca.id];
    for (let i = 0; i < 6; i++) b.skillTeam.push(creature(b).id);
    b.combatTeam.fill(null);
    E.startSkill(a, "g0-0");
    E.startSkill(b, "g0-0");
    E.advance(a, a.skillJob!.finish);
    E.advance(b, b.skillJob!.finish);
    expect(a.skills.Woodcutting.xp).toBe(b.skills.Woodcutting.xp);
    const sum = b.creatures.reduce((v, c) => v.add(c.xp), E.D(0));
    expect(sum.toNumber()).toBeCloseTo(E.D(ca.xp).toNumber(), 12);
  });
  it("consumes real ingredients and stops when supplies end", () => {
    const s = E.newSave(38, 1000),
      c = creature(s);
    s.combatTeam.fill(null);
    s.skillTeam = [c.id];
    s.inventory["g2-0"] = "2";
    s.inventory["g3-0"] = "1";
    E.startSkill(s, "p0-0");
    expect(s.inventory["g2-0"]).toBe("0");
    E.advance(s, s.time + 60000);
    expect(s.inventory.ration).toBe("1");
    expect(s.activity).toBeNull();
    expect(s.skillJob).toBeNull();
  });
  it("halts impossible automation instead of switching forever", () => {
    const s = E.newSave(38, 1000),
      c = creature(s);
    s.combatTeam.fill(null);
    s.skillTeam = [c.id];
    s.facilities.Workshop = 6;
    s.workflow = {
      enabled: false,
      repeat: true,
      index: 0,
      count: 0,
      nodes: [
        { activity: "p0-0", cycles: 1 },
        { activity: "p1-0", cycles: 1 },
      ],
    };
    E.startWorkflow(s);
    expect(s.workflow.enabled).toBe(false);
    expect(s.activity).toBeNull();
  });
  it("maintains exactly one Slayer contract and atomically consumes turn-in items", () => {
    const s = E.newSave(8, 1000);
    s.unlocks = ["boss-0"];
    E.requestContract(s);
    expect(() => E.requestContract(s)).toThrow(/one/);
    s.contract = {
      id: "test",
      kind: "retrieve",
      region: 0,
      target: 3,
      progress: 0,
      item: "trophy-0",
      reward: 100,
    };
    s.inventory["trophy-0"] = "3";
    E.turnIn(s);
    expect(s.inventory["trophy-0"]).toBe("0");
    expect(s.contract).toBeNull();
    expect(() => E.turnIn(s)).toThrow();
  });
});
describe("Chronological combat and offline progression", () => {
  it("runs identical combat and skilling with uninterrupted and partitioned time", () => {
    const s = E.newSave(88, 1000);
    const c = creature(s, "F01");
    c.level = 20;
    const worker = creature(s, "N02");
    s.skillTeam = [worker.id];
    E.startSkill(s, "g0-0");
    E.startCombat(s, "wild-0-0");
    const a = structuredClone(s),
      b = structuredClone(s);
    E.advance(a, 121000);
    for (let time = 2000; time <= 121000; time += 1000) E.advance(b, time);
    expect(comparable(a)).toEqual(comparable(b));
  });
  it("stops at defeat and does not invent later combat rewards", () => {
    const s = E.newSave(88, 1000);
    creature(s, "F01");
    s.unlocks = Array.from({ length: 9 }, (_, i) => "boss-" + i);
    E.startCombat(s, "boss-9");
    E.advance(s, 1000000, true);
    expect(s.combat!.defeats).toBe(1);
    expect(s.metrics.wins || 0).toBe(0);
    const gold = s.gold;
    E.advance(s, 2000000, true);
    expect(s.gold).toBe(gold);
    expect(s.metrics.defeats).toBe(1);
  });
  it("allows one through six combatants and all family abilities to execute", () => {
    for (let n = 1; n <= 6; n++) {
      const s = E.newSave(90 + n, 1000);
      for (let i = 0; i < n; i++) {
        const c = creature(s, FAMILIES[i].id);
        c.level = 80;
        c.stage = 3;
        s.combatTeam[i] = c.id;
      }
      E.startCombat(s, "wild-0-0");
      E.advance(s, s.time + 120000);
      expect(s.metrics.wins).toBeGreaterThan(0);
    }
    for (const f of FAMILIES) {
      const s = E.newSave(7, 1000);
      const c = creature(s, f.id);
      c.stage = 3;
      c.level = 3;
      E.startCombat(s, "wild-0-0");
      expect(() => E.advance(s, s.time + 60000)).not.toThrow();
    }
  });
  it("caps all offline clocks at twelve hours", () => {
    const s = E.newSave(43, 1000),
      c = creature(s);
    s.combatTeam.fill(null);
    s.skillTeam = [c.id];
    E.startSkill(s, "g0-0");
    const inc = {
      id: "slow",
      egg: E.egg(s, "W01", "Test"),
      finish: s.time + 36 * 3600000,
    };
    s.incubators.push(inc);
    E.advance(s, s.time + 48 * 3600000, true);
    expect(s.summary!.simulated).toBe(12 * 3600000);
    expect(inc.finish > s.time).toBe(true);
    expect(s.metrics.cycles).toBeLessThan(35000);
  });
  it("prevents duplicate journal rewards", () => {
    const s = E.newSave(43, 1000);
    s.metrics.wins = 1;
    E.claim(s, "victory");
    const gold = s.gold;
    expect(() => E.claim(s, "victory")).toThrow();
    expect(s.gold).toBe(gold);
    expect(s.eggs).toHaveLength(1);
  });
});

describe("Integrated automation and ability priority", () => {
  it("executes the configured first usable ability rather than a decorative order", () => {
    for (const first of [0, 2]) {
      const s = E.newSave(873, 1000);
      const c = creature(s);
      c.level = 10;
      c.stage = 3;
      c.priorities = first === 0 ? [0, 1, 2] : [2, 1, 0];
      E.startCombat(s, "wild-0-0");
      E.advance(s, 2001);
      const u = s.combat!.units.find((u) => u.id === c.id)!;
      expect(u.cd[first]).toBeGreaterThan(2001);
      expect(u.cd[first === 0 ? 2 : 0]).toBe(0);
    }
  });
  it("advances queued skilling activities after a completed cycle", () => {
    const s = E.newSave(938, 1000);
    const c = creature(s);
    s.combatTeam.fill(null);
    s.skillTeam = [c.id];
    s.queue = ["g1-0"];
    E.startSkill(s, "g0-0");
    E.advance(s, s.skillJob!.finish);
    expect(s.activity).toBe("g1-0");
    expect(s.inventory["g0-0"]).toBe("1");
    expect(s.skillJob!.activity).toBe("g1-0");
  });
  it("repeats breeding only with free parents and stops when thread supplies are exhausted", () => {
    const s = E.newSave(393, 1000);
    s.unlocks = ["boss-0"];
    s.facilities.Breeding = 4;
    s.gold = "1000";
    s.inventory.inherit3 = "2";
    const m = creature(s, "F01", "F", true),
      f = creature(s, "F01", "M", true);
    s.combatTeam.fill(null);
    E.repeatBreeding(s, m.id, f.id, 3, 3, [], []);
    expect(s.inventory.inherit3).toBe("0");
    const finish = s.breeding[0].finish;
    E.advance(s, finish + 1);
    expect(s.metrics.breeds).toBe(1);
    expect(s.breedingPlans![0].enabled).toBe(false);
    expect(s.breeding).toHaveLength(0);
    expect(s.eggs).toHaveLength(1);
  });
});

it("applies every successful upgrade to existing milestone bonuses as well as base rolls", () => {
  const s = E.newSave(71, 1000),
    i = E.rollItem(s, 0, "Essence", 0);
  i.level = 10;
  i.milestones = [{ level: 10, index: 0, roll: "5" }];
  const before = E.itemStats(i)[i.affixes[0].key];
  i.level = 11;
  expect(E.itemStats(i)[i.affixes[0].key].div(before).toNumber()).toBeCloseTo(
    1.055,
    12,
  );
  i.level = 19;
  expect("relic" in E.upgradeCost(i)).toBe(false);
  i.slot = "Gem";
  expect("relic" in E.upgradeCost(i)).toBe(true);
});

it("continues an ingredient-exhausted workflow at the same event time", () => {
  const s = E.newSave(229, 1000),
    c = creature(s);
  s.combatTeam.fill(null);
  s.skillTeam = [c.id];
  s.facilities.Workshop = 6;
  s.inventory["g2-0"] = "2";
  s.inventory["g3-0"] = "1";
  s.workflow = {
    enabled: false,
    repeat: true,
    index: 0,
    count: 0,
    nodes: [
      { activity: "p0-0", cycles: 100 },
      { activity: "g2-0", cycles: 1 },
      { activity: "g3-0", cycles: 1 },
    ],
  };
  E.startWorkflow(s);
  const finish = s.skillJob!.finish;
  E.advance(s, finish);
  expect(s.activity).toBe("g2-0");
  expect(s.skillJob!.activity).toBe("g2-0");
  expect(s.skillJob!.finish).toBeCloseTo(
    finish + E.activityDuration(s, "g2-0") * 1000,
    6,
  );
});
it("combines individual IV thresholds with AND or OR and gives every alloy an upgrade sink", () => {
  const s = E.newSave(1, 1000),
    c = creature(s);
  c.ivs.hp = 10;
  c.ivs.atk = 30;
  const r = {
    id: "a",
    name: "a",
    enabled: true,
    mode: "AND" as const,
    ivThresholds: { hp: 20, atk: 20 },
  };
  expect(E.matchesCreature(r, c)).toBe(false);
  expect(E.matchesCreature({ ...r, mode: "OR" }, c)).toBe(true);
  for (const [n, alloy] of [
    [4, 2],
    [9, 5],
    [14, 8],
    [19, 11],
    [24, 14],
  ]) {
    s.facilities.Housing = n;
    expect(E.facilityCost(s, "Housing")).toHaveProperty("refined" + alloy);
  }
});
it("tracks rare appearance records separately and records an evolution form only once", () => {
  const s = E.newSave(91, 1000);
  rich(s);
  s.unlocks = ["boss-0"];
  const a = creature(s),
    b = creature(s);
  s.combatTeam.fill(null);
  a.level = 25;
  b.level = 25;
  E.evolve(s, a.id);
  E.evolve(s, b.id);
  expect(s.discovered.filter((v) => v === "F01-2")).toHaveLength(1);
  expect(s.variants.every((v) => !v.endsWith("-Normal-Normal"))).toBe(true);
  expect(s.metrics.evolutions).toBe(2);
});
