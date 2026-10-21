import { it, expect } from "vitest";
import { partitionSnapshot, migrate } from "./persistence";
import { newSave } from "./engine";
import * as E from "./engine";
it("partitions Unicode snapshots without splitting surrogate pairs", () => {
  const input = "a".repeat(149999) + "🐾🌊" + "z".repeat(160000);
  const pages = partitionSnapshot(input);
  expect(pages.join("")).toBe(input);
  for (const page of pages)
    expect(new TextDecoder().decode(new TextEncoder().encode(page))).toBe(page);
});
it("preserves supported saves and rejects unsupported migrations without mutation", () => {
  const save = newSave(15, 1000),
    original = JSON.stringify(save);
  expect(migrate(save)).toEqual(save);
  expect(() => migrate({ ...save, schema: 2 })).toThrow(
    /different game version/,
  );
  expect(JSON.stringify(save)).toBe(original);
});
it("refuses malformed genetics and overlapping team assignments without modifying the checkpoint", () => {
  const s = newSave(1, 1000);
  s.creatures.push({
    id: "a",
    family: "F01",
    stage: 1,
    level: 1,
    xp: "0",
    ivs: { hp: 32, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
    gender: "F",
    color: "Normal",
    effect: "Normal",
    locked: false,
    favorite: false,
    equipment: {},
    priorities: [0, 1, 2],
    recoveryUntil: 0,
    acquired: 1000,
  });
  const copy = JSON.stringify(s);
  expect(() => migrate(s)).toThrow(/collection/);
  expect(JSON.stringify(s)).toBe(copy);
  s.creatures[0].ivs.hp = 31;
  s.combatTeam[0] = "a";
  s.skillTeam = ["a"];
  expect(() => migrate(s)).toThrow(/team/);
});
it("migrates development metadata and duplicate discoveries without rerolling or mutating the old save", () => {
  const s = newSave(191, 1000);
  s.version = "0.1.0";
  s.discovered = ["F01-1", "F01-1"];
  s.variants = ["F01-Normal-Normal", "F01-Inverted-Normal"];
  const old = JSON.stringify(s);
  const next = migrate(s);
  expect(next.discovered).toEqual(["F01-1"]);
  expect(next.variants).toEqual(["F01-Inverted-Normal"]);
  expect(next.rng).toBe(s.rng);
  expect(next.id).toBe(s.id);
  expect(JSON.stringify(s)).toBe(old);
});
it("preserves a large pre-rebalance collection rather than deleting existing eggs or equipment", () => {
  const s = newSave(728, 1000);
  s.version = "1.2.0";
  for (let i = 0; i < 200; i++) s.eggs.push(E.egg(s, "F01", "Existing save"));
  for (let i = 0; i < 100; i++) s.items.push(E.rollItem(s));
  const before = JSON.stringify({ eggs: s.eggs, items: s.items, rng: s.rng });
  const next = migrate(s);
  expect(next.eggs.length).toBe(200);
  expect(next.items.length).toBe(100);
  expect(
    JSON.stringify({ eggs: next.eggs, items: next.items, rng: next.rng }),
  ).toBe(before);
});
