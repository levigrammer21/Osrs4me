import { it, expect } from "vitest";
import * as E from "./engine";
import { ENCOUNTER, FAMILY } from "./content";
it("exposes the same per-victory drop probabilities used by combat without consuming RNG", () => {
  const s = E.newSave(51, 1000),
    before = JSON.stringify(s),
    w = E.encounterDrops(s, "wild-0-0");
  expect(w.eggs).toBeCloseTo(0.0005);
  expect(w.gear).toBeCloseTo(0.0008);
  expect(w.materials[0]).toMatchObject({ min: 2, max: 3, chance: 1 });
  expect(w.families.reduce((v, f) => v + f.chance, 0)).toBeCloseTo(w.eggs);
  expect(w.rarities.reduce((v, r) => v + r.chance, 0)).toBeCloseTo(w.gear);
  expect(JSON.stringify(s)).toBe(before);
  const b = E.encounterDrops(s, "boss-3"),
    families = ENCOUNTER["boss-3"].families;
  expect(b.eggs).toBeCloseTo(0.000625);
  expect(b.gear).toBeCloseTo(0.001);
  expect(b.relic).toBe(0.4);
  expect(b.catalyst).toBe(1);
  expect(b.materials[0]).toMatchObject({ min: 6, max: 15 });
  for (const f of b.families)
    expect(f.chance).toBeCloseTo(
      (b.eggs * families.filter((id) => id === f.family).length) /
        families.length,
    );
});
it("reflects assigned equipment luck rather than showing a fixed decorative rate", () => {
  const s = E.newSave(16, 1000),
    inc = { id: "inc-test", egg: E.egg(s, "F01", "Test"), finish: 1000 };
  s.incubators.push(inc);
  E.hatch(s, inc.id);
  const c = s.creatures[0],
    item = E.rollItem(s, 0, "Trinket", 0);
  item.affixes = [{ key: "luck", roll: "100" }];
  s.items.push(item);
  c.equipment.Trinket = item.id;
  const d = E.encounterDrops(s, "wild-0-0");
  expect(d.luck).toBeCloseTo(0.02);
  expect(d.eggs).toBeCloseTo(0.0005 * 1.02);
  expect(d.gear).toBeCloseTo(0.0008 * 1.02);
});
it("uses a normalized rarity table and reports activity-specific foraging chance", () => {
  const s = E.newSave(5, 1000);
  expect(E.equipmentRarityChances()).toEqual([
    0.52,
    0.79 - 0.52,
    0.93 - 0.79,
    0.982 - 0.93,
    0.998 - 0.982,
    1 - 0.998,
  ]);
  expect(E.equipmentRarityChances().reduce((a, b) => a + b, 0)).toBe(1);
  expect(E.foragingEggChance(s, "g3-0")).toBeCloseTo(0.00001);
  expect(E.foragingEggChance(s, "g1-0")).toBe(0);
  s.mastery["g3-3"] = { level: 25, xp: "0" };
  expect(E.foragingEggChance(s, "g3-3")).toBeCloseTo(
    0.00001 * 1.36 * (1 + 24 / 124),
  );
});
it("records the actual ability name for visible battle feedback", () => {
  const s = E.newSave(61, 1000);
  const inc = { id: "ability", egg: E.egg(s, "F01", "Test"), finish: 1000 };
  s.incubators.push(inc);
  E.hatch(s, inc.id);
  s.creatures[0].level = 10;
  E.startCombat(s, "wild-0-0");
  E.advance(s, 2001);
  const ability = s.combat!.events.find(
    (e) => e.actor === s.creatures[0].id && e.kind === "ability",
  );
  expect(ability?.label).toBe(FAMILY.F01.abilities[0].name);
});
it("reports the same family inheritance weights including an existing-family hybrid", () => {
  const s = E.newSave(6, 1000);
  const hatch = (family: string) => {
    const i = {
      id: E.id(s, "inc"),
      egg: E.egg(s, family, "Test"),
      finish: s.time,
    };
    s.incubators.push(i);
    E.hatch(s, i.id);
    return s.creatures.at(-1)!;
  };
  const a = hatch("F01"),
    b = hatch("N01"),
    d = hatch("F01");
  expect(E.breedingFamilyChances(a, d)).toEqual([{ family: "F01", chance: 1 }]);
  const cross = E.breedingFamilyChances(a, b);
  expect(cross.find((v) => v.family === "F01")?.chance).toBeCloseTo(0.35);
  expect(cross.find((v) => v.family === "N01")?.chance).toBeCloseTo(0.35);
  expect(cross.find((v) => v.family === "S06")?.chance).toBe(0.3);
  expect(cross.reduce((v, f) => v + f.chance, 0)).toBe(1);
});
it("makes repeatable drops scarce without scaling boss rare loot fivefold", () => {
  const s = E.newSave(46, 1000);
  expect(E.encounterDrops(s, "wild-0-0").eggs).toBe(0.0005);
  expect(E.encounterDrops(s, "wild-0-0").gear).toBe(0.0008);
  expect(E.encounterDrops(s, "boss-3").eggs).toBe(0.000625);
  expect(E.encounterDrops(s, "boss-3").gear).toBe(0.001);
  expect(E.foragingEggChance(s, "g3-0")).toBe(0.00001);
});
it("separates first adventure clear guarantees from independent repeat chances", () => {
  const s = E.newSave(51, 1000);
  expect(E.adventureDrops(s, "dungeon-0")).toMatchObject({
    first: true,
    eggs: 1,
    gear: 1,
  });
  s.unlocks.push("dungeon-0");
  expect(E.adventureDrops(s, "dungeon-0")).toMatchObject({
    first: false,
    eggs: 0.05,
    gear: 0.25,
  });
  const raid = E.adventureDrops(s, "raid-0");
  expect(raid).toMatchObject({ first: true, eggs: 1, gear: 1 });
  s.unlocks.push("raid-0");
  expect(E.adventureDrops(s, "raid-0")).toMatchObject({
    first: false,
    eggs: 0.1,
    gear: 0.4,
  });
});
