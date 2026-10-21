import Decimal, { DecimalSource } from "break_infinity.js";
import {
  Save,
  Creature,
  Egg,
  Item,
  Slot,
  STATS,
  Stat,
  Skill,
  SKILLS,
  Combat,
  CombatUnit,
  Effect,
  Rule,
  VERSION,
  Contract,
} from "./model";
import {
  FAMILIES,
  FAMILY,
  ACTIVITY,
  ENCOUNTER,
  ADVENTURES,
  FACILITIES,
  HYBRIDS,
  JOURNAL,
} from "./content";
export const D = (x: DecimalSource = 0) => new Decimal(x);
export const add = (a: string | number, b: DecimalSource) =>
  D(a).add(b).toString();
export const fmt = (n: DecimalSource, dp = 0) => {
  const x = D(n);
  return x.lt(1e6)
    ? x.toNumber().toLocaleString(undefined, { maximumFractionDigits: dp })
    : x.toExponential(2);
};
export function rand(s: Save) {
  let x = s.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.rng = x >>> 0 || 1;
  return (s.rng + 0.5) / 4294967296;
}
export const pick = <T>(s: Save, arr: T[]): T =>
  arr[Math.min(arr.length - 1, Math.floor(rand(s) * arr.length))];
export function id(s: Save, prefix = "c") {
  s.metrics.serial = (s.metrics.serial || 0) + 1;
  return `${prefix}-${s.id}-${s.metrics.serial}`;
}
export function log(s: Save, type: string, text: string) {
  s.logs.unshift({ id: id(s, "log"), time: s.time, type, text });
  s.logs = s.logs.slice(0, 180);
}
export function metric(s: Save, key: string, n = 1) {
  s.metrics[key] = (s.metrics[key] || 0) + n;
}
export function resource(s: Save, key: string, n: DecimalSource) {
  if (key === "gold") s.gold = add(s.gold, n);
  else if (key === "tokens") s.tokens = add(s.tokens, n);
  else s.inventory[key] = add(s.inventory[key] || 0, n);
}
export const amount = (s: Save, key: string) =>
  D(
    key === "gold"
      ? s.gold
      : key === "tokens"
        ? s.tokens
        : s.inventory[key] || 0,
  );
export function canPay(s: Save, cost: Record<string, DecimalSource>) {
  return Object.entries(cost).every(([k, v]) => amount(s, k).gte(v));
}
export function pay(s: Save, cost: Record<string, DecimalSource>) {
  if (!canPay(s, cost)) throw Error("Not enough resources.");
  for (const [k, v] of Object.entries(cost)) resource(s, k, D(v).neg());
}
export const xpNext = (level: number) =>
  D(30).mul(D(level).pow(1.55)).add(D(level).mul(20)).floor();
export function gainXP(
  record: { level: number; xp: string },
  xp: DecimalSource,
) {
  record.xp = add(record.xp, xp);
  while (D(record.xp).gte(xpNext(record.level))) {
    record.xp = D(record.xp).sub(xpNext(record.level)).toString();
    record.level++;
  }
}
export function natural(c: Creature): Record<Stat, Decimal> {
  const f = FAMILY[c.family];
  const stage = [1, 1.42, 1.95][c.stage - 1];
  return Object.fromEntries(
    STATS.map((k) => [
      k,
      D(f.base[k] + c.ivs[k] * (k === "hp" ? 1.4 : 0.42))
        .mul(
          D(c.level)
            .sub(1)
            .mul(0.065 * f.growth[k])
            .add(1),
        )
        .mul(stage)
        .floor(),
    ]),
  ) as Record<Stat, Decimal>;
}
export function itemStats(item: Item) {
  return Object.fromEntries(
    item.affixes.map((a, i) => [
      a.key,
      D(a.roll)
        .mul(D(1.055).pow(item.level))
        .add(
          item.milestones
            .filter((m) => m.index === i)
            .reduce(
              (v, m) =>
                v.add(D(m.roll).mul(D(1.055).pow(item.level - m.level))),
              D(0),
            ),
        ),
    ]),
  );
}
const equipmentIndexes = new WeakMap<
  Save,
  { source: Item[]; size: number; byId: Map<string, Item> }
>();
function indexedItem(s: Save, id: string) {
  let index = equipmentIndexes.get(s);
  if (!index || index.source !== s.items || index.size !== s.items.length) {
    index = {
      source: s.items,
      size: s.items.length,
      byId: new Map(s.items.map((i) => [i.id, i])),
    };
    equipmentIndexes.set(s, index);
  }
  return index.byId.get(id);
}
export function bonus(s: Save, c: Creature, key: string) {
  return Object.values(c.equipment).reduce((v, id) => {
    const item = indexedItem(s, id!);
    return v.add(item ? itemStats(item)[key] || 0 : 0);
  }, D(0));
}
export function stats(s: Save, c: Creature) {
  const out = natural(c);
  for (const k of STATS) out[k] = out[k].add(bonus(s, c, k));
  if (c.color === "Inverted") out.hp = out.hp.mul(1.05);
  if (c.color === "Prismatic") {
    out.atk = out.atk.mul(1.05);
    out.spa = out.spa.mul(1.05);
  }
  if (FAMILY[c.family].passive.kind === "armor") {
    out.def = out.def.mul(1.12 + c.stage * 0.03);
    out.spd = out.spd.mul(1.12 + c.stage * 0.03);
  }
  return out;
}
export const elemental = (a: string, b: string) => {
  const cycle = ["Fire", "Nature", "Earth", "Storm", "Water"];
  const i = cycle.indexOf(a),
    j = cycle.indexOf(b);
  return (i + 1) % 5 === j ? 1.25 : (j + 1) % 5 === i ? 0.75 : 1;
};
export function variantOdds(
  axis: "color" | "effect",
  parents: Creature[] = [],
) {
  return (
    axis === "color" ? ["Inverted", "Prismatic"] : ["Sparkling", "Glowing"]
  ).map((v) => {
    const n = parents.filter((p) => p[axis] === v).length;
    return n === 2 ? 0.04 : n === 1 ? 0.01 : 0.005;
  });
}
export function variant(
  s: Save,
  axis: "color" | "effect",
  parents: Creature[] = [],
): string {
  const choices =
    axis === "color" ? ["Inverted", "Prismatic"] : ["Sparkling", "Glowing"];
  const odds = variantOdds(axis, parents);
  const r = rand(s);
  return r < odds[0]
    ? choices[0]
    : r < odds[0] + odds[1]
      ? choices[1]
      : "Normal";
}
export function egg(
  s: Save,
  family: string,
  source: string,
  parents: Creature[] = [],
): Egg {
  return {
    id: id(s, "egg"),
    family,
    source,
    created: s.time,
    ivs: Object.fromEntries(
      STATS.map((k) => [k, Math.floor(rand(s) * 32)]),
    ) as Record<Stat, number>,
    gender: rand(s) < 0.5 ? "M" : "F",
    color: variant(s, "color", parents) as Egg["color"],
    effect: variant(s, "effect", parents) as Egg["effect"],
  };
}
export function newSave(seed = Date.now() >>> 0, now = Date.now()): Save {
  const levels = Object.fromEntries(
    SKILLS.map((k) => [k, { level: 1, xp: "0" }]),
  ) as Save["skills"];
  return {
    schema: 1,
    version: VERSION,
    id: seed.toString(36) + "-" + now.toString(36),
    rng: seed || 1,
    time: now,
    created: now,
    revision: 0,
    started: false,
    gold: "100",
    tokens: "0",
    inventory: {},
    creatures: [],
    eggs: [],
    items: [],
    combatTeam: Array(6).fill(null),
    skillTeam: [],
    farmJobs: [],
    farmRevision: 1,
    loadouts: [],
    skills: levels,
    mastery: {},
    facilities: Object.fromEntries(FACILITIES.map((k) => [k, 1])),
    upgrades: [],
    incubators: [{ id: "inc-1", egg: null, finish: 0 }],
    breeding: [],
    breedingPlans: [],
    skillJob: null,
    activity: null,
    queue: [],
    workflow: null,
    combat: null,
    contract: null,
    unlocks: [],
    discovered: [],
    variants: [],
    claims: [],
    releaseRules: [],
    salvageRules: [],
    hatchPolicy: "oldest",
    autoHatch: false,
    autoLoad: false,
    logs: [],
    metrics: { serial: 0 },
    settings: { sound: false, motion: true, offlineHours: 12 },
    summary: null,
  };
}
export const capacity = (s: Save) => s.facilities.Housing * 10;
export const unlockedRegion = (s: Save, r: number) =>
  r === 0 || s.unlocks.includes(`boss-${r - 1}`);
export const free = (s: Save, c: Creature) =>
  !s.combatTeam.includes(c.id) &&
  !farmWorkers(s).includes(c.id) &&
  !s.breeding.some((j) => j.parents.includes(c.id)) &&
  c.recoveryUntil <= s.time;
export function starter(s: Save, family: string) {
  if (s.started) throw Error("Starter already chosen.");
  if (!["F01", "N01", "W01"].includes(family))
    throw Error("Choose an offered starter.");
  s.started = true;
  s.incubators[0].egg = egg(s, family, "Starter");
  s.incubators[0].finish = s.time + 30000;
  resource(s, "g0-0", 10);
  resource(s, "g1-0", 10);
  resource(s, "g3-0", 10);
  log(
    s,
    "journal",
    "Your sanctuary begins. Your first egg hatches in 30 seconds.",
  );
}
export function hatch(s: Save, incId: string) {
  const inc = s.incubators.find((i) => i.id === incId);
  if (!inc?.egg || inc.finish > s.time) throw Error("This egg is not ready.");
  if (s.creatures.length >= capacity(s))
    throw Error("Housing is full. Upgrade or release a creature first.");
  const e = inc.egg;
  const c: Creature = {
    id: id(s),
    family: e.family,
    stage: 1,
    level: 1,
    xp: "0",
    ivs: e.ivs,
    gender: e.gender,
    color: e.color,
    effect: e.effect,
    locked: false,
    favorite: false,
    equipment: {},
    priorities: [2, 1, 0],
    recoveryUntil: 0,
    acquired: s.time,
  };
  s.creatures.push(c);
  inc.egg = null;
  inc.finish = 0;
  inc.notified = false;
  const form = c.family + "-1";
  if (!s.discovered.includes(form)) s.discovered.push(form);
  const vk = `${c.family}-${c.color}-${c.effect}`;
  if (
    (c.color !== "Normal" || c.effect !== "Normal") &&
    !s.variants.includes(vk)
  )
    s.variants.push(vk);
  metric(s, "hatches");
  if (c.color !== "Normal" || c.effect !== "Normal") metric(s, "variants");
  if (STATS.every((k) => c.ivs[k] === 31)) metric(s, "perfect");
  s.metrics.families = new Set(s.discovered.map((d) => d.slice(0, 3))).size;
  s.metrics.forms = new Set(s.discovered).size;
  log(
    s,
    "hatch",
    `${FAMILY[c.family].names[0]} hatched · ${c.color} / ${c.effect} · ${Object.values(c.ivs).reduce((a, b) => a + b, 0)}/186 IV`,
  );
  if (s.creatures.length === 1) s.combatTeam[0] = c.id;
  if (
    s.facilities.Hatchery >= 8 &&
    s.releaseRules.some((r) => matchesCreature(r, c) && r.enabled)
  )
    release(s, [c.id], true);
}
export const incubationDuration = (s: Save) =>
  300000 / (1 + 0.15 * (s.facilities.Hatchery - 1));
/** Family stacks are presentation only: original eggs and their genetics stay separate. */
export function eggStacks(s: Save) {
  const groups = new Map<
    string,
    { family: string; count: number; first: string }
  >();
  for (const e of s.eggs) {
    const group = groups.get(e.family);
    if (group) group.count++;
    else groups.set(e.family, { family: e.family, count: 1, first: e.id });
  }
  return [...groups.values()].sort((a, b) =>
    FAMILY[a.family].names[0].localeCompare(FAMILY[b.family].names[0]),
  );
}
export function loadEggFamily(s: Save, family: string, all = false) {
  const eggs = s.eggs
    .filter((e) => e.family === family)
    .sort((a, b) => a.created - b.created);
  const empty = s.incubators.filter((i) => !i.egg);
  if (!eggs.length || !empty.length)
    throw Error("No empty nests or matching eggs.");
  for (let n = 0; n < Math.min(eggs.length, all ? empty.length : 1); n++)
    loadEgg(s, empty[n].id, eggs[n].id);
}
export function welcomeFarm(s: Save) {
  if (!s.creatures.length || s.claims.includes("farm-welcome"))
    throw Error(
      "Welcome basket already claimed or first companion not hatched.",
    );
  s.claims.push("farm-welcome");
  s.eggs.push(egg(s, "E01", "Farm welcome"), egg(s, "N02", "Farm welcome"));
  if (s.incubators.length < 2)
    s.incubators.push({ id: id(s, "inc"), egg: null, finish: 0 });
  log(
    s,
    "farm",
    "Welcome basket: Pebbit and Sporel eggs, with a second nest if needed.",
  );
}
export function loadEgg(s: Save, incId: string, eggId: string) {
  const inc = s.incubators.find((i) => i.id === incId),
    index = s.eggs.findIndex((e) => e.id === eggId);
  if (!inc || inc.egg || index < 0)
    throw Error("Choose an empty incubator and available egg.");
  inc.egg = s.eggs.splice(index, 1)[0];
  inc.notified = false;
  inc.finish = s.time + incubationDuration(s);
  log(s, "incubation", `${FAMILY[inc.egg.family].names[0]} egg loaded.`);
}
export function incubatorCost(s: Save) {
  const n = s.incubators.length;
  return {
    gold: D(100).mul(D(2).pow(n)),
    ["g0-" + Math.min(11, Math.floor(n / 2))]: D(20).mul(n),
    ["g1-" + Math.min(11, Math.floor(n / 2))]: D(15).mul(n),
  };
}
export function buildIncubator(s: Save) {
  pay(s, incubatorCost(s));
  s.incubators.push({ id: id(s, "inc"), egg: null, finish: 0 });
  log(s, "farm", "A new incubator is ready.");
}
export function facilityCost(s: Save, k: string) {
  if (!(k in s.facilities)) throw Error("Unknown facility");
  const n = s.facilities[k];
  const tier = Math.min(11, Math.floor(n / 3));
  return {
    gold: D(80).mul(D(1.75).pow(n)),
    [`g0-${tier}`]: D(15).mul(n * n),
    [`g1-${tier}`]: D(12).mul(n * n),
    ...(n > 3 ? { [`g3-${tier}`]: D(8).mul(n * n) } : {}),
    ...(n >= 4
      ? {
          [`refined${2 + 3 * Math.min(4, Math.floor((n - 4) / 5))}`]:
            D(n).mul(2),
        }
      : {}),
  };
}
export function upgradeFacility(s: Save, k: string) {
  if (s.upgrades.some((u) => u.facility === k))
    throw Error("This facility is already upgrading.");
  pay(s, facilityCost(s, k));
  s.upgrades.push({
    facility: k,
    level: s.facilities[k] + 1,
    finish: s.time + 10000 * s.facilities[k] ** 1.5,
  });
  log(s, "farm", `${k} upgrade started.`);
}
export function evolutionCost(c: Creature) {
  const f = FAMILY[c.family],
    tier = Math.min(
      11,
      c.stage === 1 ? Math.floor(f.region / 2) : Math.floor(f.region / 2) + 2,
    );
  return {
    gold: D(c.stage === 1 ? 250 : 2500).mul(1 + f.region * 0.15),
    [`g${["Fire", "Nature", "Earth", "Storm", "Water"].indexOf(f.element) % 4}-${tier}`]:
      D(c.stage === 1 ? 30 : 100),
    essence: D(c.stage === 1 ? 10 : 60),
    ...(c.stage === 2 ? { catalyst: D(3 + f.region) } : {}),
  };
}
export function evolve(s: Save, cid: string) {
  const c = s.creatures.find((c) => c.id === cid);
  if (!c || c.stage >= 3) throw Error("No further evolution.");
  if (!free(s, c))
    throw Error("Move this creature to the reserve before evolving.");
  if (c.level < (c.stage === 1 ? 25 : 75))
    throw Error(`Requires level ${c.stage === 1 ? 25 : 75}.`);
  if (!s.unlocks.includes(c.stage === 1 ? "boss-0" : "boss-3"))
    throw Error("Defeat the required region boss first.");
  pay(s, evolutionCost(c));
  c.stage++;
  const form = c.family + "-" + c.stage;
  if (!s.discovered.includes(form)) s.discovered.push(form);
  metric(s, "evolutions");
  s.metrics.forms = new Set(s.discovered).size;
  log(
    s,
    "evolution",
    `${FAMILY[c.family].names[c.stage - 2]} evolved into ${FAMILY[c.family].names[c.stage - 1]}.`,
  );
}
export function matchesCreature(r: Rule, c: Creature) {
  const tests: boolean[] = [];
  if (r.family) tests.push(c.family === r.family);
  if (r.element) tests.push(FAMILY[c.family].element === r.element);
  if (r.stage) tests.push(c.stage === r.stage);
  if (r.color) tests.push(c.color === r.color);
  if (r.effect) tests.push(c.effect === r.effect);
  if (r.maxIV !== undefined)
    tests.push(Object.values(c.ivs).reduce((a, b) => a + b, 0) <= r.maxIV);
  if (r.perfect !== undefined)
    tests.push(
      Object.values(c.ivs).filter((v) => v === 31).length <= r.perfect,
    );
  if (r.ivStat && r.ivBelow !== undefined)
    tests.push(c.ivs[r.ivStat] <= r.ivBelow);
  for (const stat of STATS)
    if (r.ivThresholds?.[stat] !== undefined)
      tests.push(c.ivs[stat] <= r.ivThresholds[stat]!);
  return (
    tests.length > 0 &&
    (r.mode === "AND" ? tests.every(Boolean) : tests.some(Boolean))
  );
}
export function matchesItem(r: Rule, i: Item) {
  const tests: boolean[] = [];
  if (r.slot) tests.push(i.slot === r.slot);
  if (r.rarity !== undefined) tests.push(i.rarity <= r.rarity);
  if (r.affix)
    tests.push(
      i.affixes.some(
        (a) =>
          a.key === r.affix &&
          (r.rollBelow === undefined || D(a.roll).lte(r.rollBelow)),
      ),
    );
  return (
    tests.length > 0 &&
    (r.mode === "AND" ? tests.every(Boolean) : tests.some(Boolean))
  );
}
export function releaseValue(c: Creature) {
  return D(3 + FAMILY[c.family].region)
    .mul(1 + c.level / 20)
    .mul(c.stage)
    .mul(c.color !== "Normal" ? 3 : 1)
    .mul(c.effect !== "Normal" ? 3 : 1)
    .floor();
}
export function release(s: Save, ids: string[], auto = false) {
  const targets = s.creatures.filter((c) => ids.includes(c.id));
  if (!targets.length) throw Error("Select creatures first.");
  const valid = targets.filter((c) => !c.locked && !c.favorite && free(s, c));
  if (!auto && valid.length !== targets.length)
    throw Error(
      "Assigned, recovering, locked, or favorite creatures are protected.",
    );
  for (const c of valid) {
    for (const sid of Object.values(c.equipment)) {
      const i = s.items.find((i) => i.id === sid);
      if (i)
        log(
          s,
          "equipment",
          "Released creature’s equipment returned to storage.",
        );
    }
    resource(s, "essence", releaseValue(c));
    s.creatures = s.creatures.filter((x) => x.id !== c.id);
    log(
      s,
      "release",
      `${auto ? "Auto-release" : "Released"} ${FAMILY[c.family].names[c.stage - 1]} · +${releaseValue(c)} essence.`,
    );
    metric(s, "released");
  }
}
export function assign(
  s: Save,
  cid: string,
  team: "combat" | "skill" | "reserve",
  slot = 0,
) {
  const c = s.creatures.find((c) => c.id === cid);
  if (!c) throw Error("Creature not found.");
  if (s.breeding.some((j) => j.parents.includes(cid)))
    throw Error("Creature is breeding.");
  if (c.recoveryUntil > s.time) throw Error("Creature is recovering.");
  if (s.combat && (team === "combat" || s.combatTeam.includes(cid)))
    throw Error("Stop combat before editing the combat team.");
  if (s.skillJob && (team === "skill" || s.skillTeam.includes(cid)))
    throw Error(
      "Pause skilling and finish the reserved cycle before editing its team.",
    );
  if ((s.farmJobs || []).some((j) => j.team.includes(cid)))
    throw Error("Unassign this creature from its farm task first.");
  s.combatTeam = s.combatTeam.map((x) => (x === cid ? null : x));
  s.skillTeam = s.skillTeam.filter((x) => x !== cid);
  if (team === "combat") {
    if (slot < 0 || slot > 5) throw Error("Invalid slot.");
    s.combatTeam[slot] = cid;
  }
  if (team === "skill") {
    if (s.skillTeam.length >= 6) throw Error("Six creatures maximum.");
    s.skillTeam.push(cid);
  }
}
export function saveLoadout(s: Save, name: string) {
  if (s.facilities.Workshop < 2) throw Error("Workshop level 2 required.");
  s.loadouts.push({
    id: id(s, "loadout"),
    name: name.slice(0, 40) || "Team",
    combat: [...s.combatTeam],
    skill: [...s.skillTeam],
  });
}
export function applyLoadout(s: Save, lid: string, skillOnly = false) {
  const l = s.loadouts.find((l) => l.id === lid);
  if (!l) throw Error("Loadout missing.");
  if (s.skillJob && JSON.stringify(l.skill) !== JSON.stringify(s.skillTeam))
    throw Error("Finish the reserved skilling cycle before switching crews.");
  if (s.combat && !skillOnly)
    throw Error("Stop combat before switching the combat team.");
  const ids = skillOnly
    ? l.skill
    : ([...l.combat.filter(Boolean), ...l.skill] as string[]);
  if (new Set(ids).size !== ids.length) throw Error("Duplicate assignment.");
  for (const cid of ids) {
    const c = s.creatures.find((c) => c.id === cid);
    if (
      !c ||
      c.recoveryUntil > s.time ||
      s.breeding.some((j) => j.parents.includes(cid)) ||
      (skillOnly && s.combatTeam.includes(cid)) ||
      (s.farmJobs || []).some((j) => j.team.includes(cid))
    )
      throw Error("A loadout creature is unavailable.");
  }
  if (!skillOnly) s.combatTeam = [...l.combat];
  s.skillTeam = [...l.skill];
}
export const HYBRID_CHANCE = 0.3;
export function breedingFamilyChances(m: Creature, f: Creature) {
  const out: Record<string, number> = {};
  if (m.family === f.family) out[m.family] = 1;
  else {
    out[m.family] = 0.5;
    out[f.family] = 0.5;
  }
  const hybrid = HYBRIDS.find(
    (h) =>
      (h[0] === m.family && h[1] === f.family) ||
      (h[1] === m.family && h[0] === f.family),
  );
  if (hybrid) {
    for (const family in out) out[family] *= 1 - HYBRID_CHANCE;
    out[hybrid[2]] = (out[hybrid[2]] || 0) + HYBRID_CHANCE;
  }
  return Object.entries(out).map(([family, chance]) => ({ family, chance }));
}
export function breed(
  s: Save,
  motherId: string,
  fatherId: string,
  mc: number,
  fc: number,
  mStats: Stat[] = [],
  fStats: Stat[] = [],
) {
  if (!s.unlocks.includes("boss-0"))
    throw Error("Defeat the first region boss to unlock breeding.");
  if (s.breeding.length >= s.facilities.Breeding)
    throw Error("All breeding pairs are occupied.");
  const m = s.creatures.find((c) => c.id === motherId),
    f = s.creatures.find((c) => c.id === fatherId);
  if (
    !m ||
    !f ||
    m.gender !== "F" ||
    f.gender !== "M" ||
    m === f ||
    !free(s, m) ||
    !free(s, f)
  )
    throw Error("Select one available female and male.");
  const choose = (n: number, chosen: Stat[]) => {
    if (n === 0) return [];
    if (n === 3) return null;
    if (
      chosen.length !== n ||
      new Set(chosen).size !== n ||
      chosen.some((k) => !STATS.includes(k))
    )
      throw Error("Choose the required distinct IVs.");
    return chosen;
  };
  if (![0, 1, 2, 3].includes(mc) || ![0, 1, 2, 3].includes(fc))
    throw Error("Unknown inheritance tier.");
  let ms = choose(mc, mStats),
    fs = choose(fc, fStats);
  if (ms && fs && ms.some((k) => fs!.includes(k)))
    throw Error("Parents cannot guarantee the same stat."); // Fisher-Yates shuffle uses the persisted RNG.
  const shuffle = (a: Stat[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand(s) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  if (ms === null)
    ms = shuffle(STATS.filter((k) => !fs?.includes(k))).slice(0, 3);
  if (fs === null)
    fs = shuffle(STATS.filter((k) => !ms!.includes(k))).slice(0, 3);
  if (ms.length + fs.length < 2) {
    if (!ms.length)
      ms.push(
        pick(
          s,
          STATS.filter((k) => !fs!.includes(k)),
        ),
      );
    if (ms.length + fs.length < 2)
      fs.push(
        pick(
          s,
          STATS.filter((k) => !ms!.includes(k)),
        ),
      );
  }
  const cost: Record<string, number> = { gold: 75 };
  if (mc) cost[`inherit${mc}`] = (cost[`inherit${mc}`] || 0) + 1;
  if (fc) cost[`inherit${fc}`] = (cost[`inherit${fc}`] || 0) + 1;
  if (!canPay(s, cost))
    throw Error("Missing breeding gold or inheritance threads.");
  let family =
    m.family === f.family ? m.family : rand(s) < 0.5 ? m.family : f.family;
  const cross = HYBRIDS.find(
    (h) =>
      (h[0] === m.family && h[1] === f.family) ||
      (h[1] === m.family && h[0] === f.family),
  );
  if (cross && rand(s) < HYBRID_CHANCE) family = cross[2];
  const e = egg(s, family, "Breeding", [m, f]);
  for (const k of ms) e.ivs[k] = m.ivs[k];
  for (const k of fs) e.ivs[k] = f.ivs[k];
  pay(s, cost);
  s.breeding.push({
    id: id(s, "breed"),
    parents: [m.id, f.id],
    egg: e,
    finish: s.time + 1800000 / (1 + 0.2 * (s.facilities.Breeding - 1)),
  });
  log(
    s,
    "breeding",
    `${FAMILY[m.family].names[m.stage - 1]} × ${FAMILY[f.family].names[f.stage - 1]} · parents reserved.`,
  );
}
export const EQUIPMENT_RARITY_THRESHOLDS = [
  0.52, 0.79, 0.93, 0.982, 0.998, 1,
] as const;
export const equipmentRarityChances = () =>
  EQUIPMENT_RARITY_THRESHOLDS.map(
    (v, i) => v - (i ? EQUIPMENT_RARITY_THRESHOLDS[i - 1] : 0),
  );

export function rollItem(
  s: Save,
  tier = 0,
  slot?: Slot,
  rarity?: number,
): Item {
  const r = rand(s);
  const rare =
    rarity ?? EQUIPMENT_RARITY_THRESHOLDS.findIndex((cutoff) => r < cutoff);
  const type = slot ?? pick(s, ["Essence", "Gem", "Trinket"] as Slot[]);
  const keys =
    type === "Essence"
      ? ["hp", "atk", "def", "spa", "spd", "spe", "crit", "heal"]
      : type === "Gem"
        ? ["skillSpeed", "yield", "xp", "luck", "hp", "spe", "def", "spd"]
        : [
            "hp",
            "atk",
            "spa",
            "spe",
            "crit",
            "heal",
            "xp",
            "luck",
            "skillSpeed",
          ];
  const affixes = [];
  for (let n = 0; n <= rare; n++) {
    const k = pick(s, keys);
    keys.splice(keys.indexOf(k), 1);
    const normal =
      Math.sqrt(-2 * Math.log(rand(s))) * Math.cos(2 * Math.PI * rand(s));
    const typical =
      (1 + tier * 0.6) *
      (1 + rare * 0.45) *
      (k === "hp"
        ? 12
        : ["skillSpeed", "yield", "xp", "luck", "crit", "heal"].includes(k)
          ? 0.8
          : 3);
    affixes.push({
      key: k,
      roll: D(typical)
        .mul(D(Math.E).pow(normal * 0.48))
        .toString(),
    });
  }
  return {
    id: id(s, "item"),
    slot: type,
    rarity: rare,
    affixes,
    level: 0,
    milestones: [],
    locked: false,
    favorite: false,
  };
}
export function salvageValue(i: Item) {
  return i.affixes
    .reduce((v, a) => v.add(D(a.roll).abs().add(1).log10() + 1), D(0))
    .mul(i.rarity + 1)
    .floor()
    .max(1);
}
export const salvageMaterial = (i: Item) =>
  i.slot === "Essence" ? "essence" : i.slot === "Gem" ? "gemdust" : "thread";
export function equipped(s: Save, i: Item) {
  return s.creatures.some((c) => Object.values(c.equipment).includes(i.id));
}
export function salvage(s: Save, ids: string[], auto = false) {
  const selected = new Set(ids);
  const items = s.items.filter((i) => selected.has(i.id));
  if (!items.length) throw Error("Select equipment.");
  const valid = items.filter(
    (i) => !i.locked && !equipped(s, i) && (!auto || (!i.level && !i.favorite)),
  );
  if (!auto && valid.length !== items.length)
    throw Error("Equipped or locked items cannot be salvaged.");
  for (const i of valid) {
    resource(s, salvageMaterial(i), salvageValue(i));
    log(
      s,
      "salvage",
      `${auto ? "Auto-salvage" : "Salvaged"} ${i.slot} · +${fmt(salvageValue(i))} ${salvageMaterial(i)}.`,
    );
  }
  const removed = new Set(valid.map((i) => i.id));
  s.items = s.items.filter((i) => !removed.has(i.id));
}
export function receiveItem(s: Save, i: Item) {
  s.items.push(i);
  if (i.rarity >= 3)
    log(
      s,
      "rare",
      `${["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"][i.rarity]} ${i.slot} found.`,
    );
  if (
    s.facilities.Workshop >= 4 &&
    s.salvageRules.some((r) => r.enabled && matchesItem(r, i))
  )
    salvage(s, [i.id], true);
}
export function upgradeChance(n: number) {
  return n <= 10 ? 1 : Math.max(0.01, 0.95 ** (n - 10));
}
export function upgradeCost(i: Item) {
  const n = i.level + 1;
  return {
    [salvageMaterial(i)]: D(3)
      .mul(D(1.18).pow(n))
      .mul(i.rarity + 1)
      .ceil(),
    gold: D(10).mul(D(1.14).pow(n)).ceil(),
    ...(i.slot !== "Essence" && n >= 20 && n % 10 === 0
      ? { relic: D(n / 10) }
      : {}),
    ...(i.slot !== "Essence" && n > 10
      ? {
          [`refined${2 + 3 * Math.min(4, Math.floor((n - 11) / 20))}`]: D(n)
            .div(5)
            .ceil(),
        }
      : {}),
  };
}
export function upgradeItem(s: Save, iid: string) {
  const i = s.items.find((i) => i.id === iid);
  if (!i) throw Error("Item missing.");
  if (!s.unlocks.includes("boss-0"))
    throw Error("Defeat the first boss to unlock upgrading.");
  pay(s, upgradeCost(i));
  const n = i.level + 1;
  if (rand(s) > upgradeChance(n)) {
    log(s, "upgrade", `${i.slot} +${n} failed. The item remains +${i.level}.`);
    return false;
  }
  i.level = n;
  if (n % 10 === 0) {
    const index = Math.floor(rand(s) * i.affixes.length);
    const normal =
      Math.sqrt(-2 * Math.log(rand(s))) * Math.cos(2 * Math.PI * rand(s));
    const roll = D(i.affixes[index].roll)
      .mul(n / 10)
      .mul(D(Math.E).pow(normal * 0.5))
      .toString();
    i.milestones.push({ level: n, index, roll });
    if (n === 10) metric(s, "enhance10");
  }
  log(
    s,
    "upgrade",
    `${i.slot} upgraded to +${n}${n % 10 === 0 ? " · permanent milestone bonus" : ""}.`,
  );
  return true;
}
export function equip(s: Save, cid: string, iid: string) {
  if (s.combat) throw Error("Stop combat before changing equipment.");
  const c = s.creatures.find((c) => c.id === cid),
    i = s.items.find((i) => i.id === iid);
  if (!c || !i) throw Error("Item or creature missing.");
  for (const other of s.creatures)
    for (const slot of ["Essence", "Gem", "Trinket"] as Slot[])
      if (other.equipment[slot] === iid) delete other.equipment[slot];
  c.equipment[i.slot] = iid;
  metric(s, "equips");
}
/** Existing skilling is station zero; additional stations share its tested resolver. */
export const farmStationCount = (s: Save) =>
  Math.min(8, 2 + s.facilities.Workshop);
export const farmWorkers = (s: Save) => [
  ...s.skillTeam,
  ...(s.farmJobs || []).flatMap((j) => j.team),
];
export function workStations(s: Save) {
  return Array.from({ length: farmStationCount(s) }, (_, i) =>
    i === 0
      ? { team: s.skillTeam, activity: s.activity, job: s.skillJob }
      : s.farmJobs?.[i - 1] || { team: [], activity: null, job: null },
  );
}
export function stationView(s: Save, index: number): Save {
  const post = workStations(s)[index];
  return {
    ...s,
    skillTeam: post?.team || [],
    activity: post?.activity || null,
    skillJob: post?.job || null,
  };
}
function withFarmStation<T>(s: Save, index: number, fn: (view: Save) => T): T {
  if (index === 0) return fn(s);
  if (!Number.isInteger(index) || index < 1 || index >= farmStationCount(s))
    throw Error("Upgrade the Workshop to open this work station.");
  s.farmJobs ??= [];
  while (s.farmJobs.length < index)
    s.farmJobs.push({ team: [], activity: null, job: null });
  const post = s.farmJobs[index - 1],
    original = {
      skillTeam: s.skillTeam,
      skillJob: s.skillJob,
      activity: s.activity,
      queue: s.queue,
      workflow: s.workflow,
    };
  s.skillTeam = post.team;
  s.skillJob = post.job;
  s.activity = post.activity;
  s.queue = [];
  s.workflow = null;
  try {
    return fn(s);
  } finally {
    post.team = s.skillTeam;
    post.job = s.skillJob;
    post.activity = s.activity;
    Object.assign(s, original);
  }
}
export function assignFarm(s: Save, index: number, cid: string) {
  const post = workStations(s)[index];
  if (!post) throw Error("Work station unavailable.");
  if (post.job)
    throw Error("Pause and finish the reserved cycle before changing workers.");
  if (post.team.includes(cid)) {
    withFarmStation(s, index, (v) => {
      v.skillTeam = v.skillTeam.filter((id) => id !== cid);
      if (!v.skillTeam.length) v.activity = null;
    });
    return;
  }
  const c = s.creatures.find((c) => c.id === cid);
  if (!c || !free(s, c))
    throw Error(
      "Choose a free creature. Combat, other jobs and breeding keep their workers.",
    );
  if (post.team.length >= 6) throw Error("Six workers maximum per task.");
  withFarmStation(s, index, (v) => {
    v.skillTeam.push(cid);
  });
}
export function startFarmTask(s: Save, index: number, aid: string) {
  withFarmStation(s, index, (v) => startSkill(v, aid));
  log(s, "farm", `Work station ${index + 1} started ${ACTIVITY[aid].name}.`);
}
export function pauseFarmTask(s: Save, index: number) {
  withFarmStation(s, index, (v) => {
    pauseSkill(v);
    if (index === 0) {
      v.queue = [];
      if (v.workflow) v.workflow.enabled = false;
    }
  });
}
export function farmTaskDuration(s: Save, index: number, aid: string) {
  return activityDuration(stationView(s, index), aid);
}

export function teamBonus(s: Save, skill: Skill) {
  const cs = s.skillTeam
    .map((id) => s.creatures.find((c) => c.id === id))
    .filter(Boolean) as Creature[];
  const apt = cs.reduce(
    (v, c) =>
      v + FAMILY[c.family].aptitudes[skill] * [1, 1.4, 1.9][c.stage - 1],
    0,
  );
  return apt / (100 + apt);
}
export function skillMilestones(level: number) {
  return (
    [25, 50, 100, 250, 500].filter((n) => level >= n).length +
    (level >= 1000 ? Math.floor(Math.log2(level / 500)) : 0)
  );
}
export function activityDuration(s: Save, aid: string) {
  const a = ACTIVITY[aid],
    master = s.mastery[aid]?.level || 1;
  const cs = s.skillTeam
    .map((id) => s.creatures.find((c) => c.id === id))
    .filter(Boolean) as Creature[];
  const gear = cs.reduce((v, c) => v.add(bonus(s, c, "skillSpeed")), D(0));
  const gb = gear.div(gear.add(100)).toNumber();
  const glow = cs.filter((c) => c.effect === "Glowing").length * 0.05;
  const milestone = skillMilestones(s.skills[a.skill].level) * 0.05;
  return Math.max(
    0.05,
    a.duration /
      (1 +
        teamBonus(s, a.skill) * 1.2 +
        ((master - 1) / (master + 99)) * 0.6 +
        gb +
        glow +
        milestone),
  );
}
export function startSkill(s: Save, aid: string) {
  const a = ACTIVITY[aid];
  if (!a || a.skill === "Slayer") throw Error("Choose a skilling activity.");
  if (!s.skillTeam.length)
    throw Error("Assign at least one creature to the skilling team.");
  if (s.skills[a.skill].level < a.level)
    throw Error(`Requires ${a.skill} ${a.level}.`);
  if (s.skillJob && s.skillJob.activity !== aid)
    throw Error("Pause and finish the reserved cycle before switching.");
  if (s.workflow) s.workflow.enabled = false;
  s.activity = aid;
  beginSkill(s);
}
function beginSkill(s: Save) {
  if (!s.activity || s.skillJob || !s.skillTeam.length) return;
  const a = ACTIVITY[s.activity];
  if (!canPay(s, a.inputs)) {
    if (s.workflow?.enabled) {
      advanceWorkflow(s);
      // Start the affordable successor at this same event time. Waiting until
      // the next unrelated event would make offline and visible queues diverge.
      if (s.workflow.enabled && s.activity) beginSkill(s);
      return;
    }
    s.activity = null;
    log(
      s,
      "skills",
      "Production stopped: required ingredients are unavailable.",
    );
    return;
  }
  pay(s, a.inputs);
  s.skillJob = {
    activity: a.id,
    inputs: a.inputs,
    finish: s.time + activityDuration(s, a.id) * 1000,
  };
}
export function pauseSkill(s: Save) {
  s.activity = null;
}
function completeSkill(s: Save) {
  const job = s.skillJob!;
  const a = ACTIVITY[job.activity];
  s.skillJob = null;
  const master = (s.mastery[a.id] ??= { level: 1, xp: "0" });
  const gathering = Object.keys(a.inputs).length === 0;
  const gearYield = s.skillTeam.reduce((v, id) => {
    const c = s.creatures.find((c) => c.id === id);
    return c ? v.add(bonus(s, c, "yield")) : v;
  }, D(0));
  const yieldBonus =
    teamBonus(s, a.skill) * 0.4 +
    ((master.level - 1) / (master.level + 99)) * 0.2 +
    gearYield.div(gearYield.add(100)).toNumber() * 0.25;
  for (const [k, n] of Object.entries(a.outputs)) {
    let count = n;
    if (rand(s) < yieldBonus * (gathering ? 1 : 0.5)) count += 1;
    resource(s, k, count);
  }
  gainXP(s.skills[a.skill], a.xp);
  gainXP(master, a.xp * 0.7);
  const pool = a.creatureXp;
  for (const cid of s.skillTeam) {
    const c = s.creatures.find((c) => c.id === cid);
    if (c)
      gainXP(
        c,
        D(pool)
          .div(s.skillTeam.length)
          .mul(c.effect === "Sparkling" ? 1.05 : 1)
          .mul(D(1).add(bonus(s, c, "xp").div(bonus(s, c, "xp").add(100)))),
      );
  }
  metric(s, "cycles");
  s.metrics.skills25 = Object.values(s.skills).filter(
    (v) => v.level >= 25,
  ).length;
  s.metrics.mastery25 = Object.values(s.mastery).filter(
    (v) => v.level >= 25,
  ).length;
  if (a.skill === "Foraging" && rand(s) < foragingEggChance(s, a.id)) {
    const families = FAMILIES.filter((f) => f.region <= Math.min(9, a.tier));
    s.eggs.push(egg(s, pick(s, families).id, "Foraging"));
    metric(s, "eggs");
    log(s, "rare", "An egg was discovered while foraging.");
  }
  if (s.workflow?.enabled) {
    s.workflow.count++;
    const node = s.workflow.nodes[s.workflow.index];
    if (
      node &&
      ((node.targetResource &&
        amount(s, node.targetResource).gte(node.targetAmount || 1)) ||
        (node.cycles && s.workflow.count >= node.cycles))
    )
      advanceWorkflow(s);
  }
  if (s.queue.length && !s.workflow?.enabled) {
    s.activity = null;
    const next = s.queue.shift()!;
    try {
      startSkill(s, next);
    } catch (e) {
      log(s, "automation", String((e as Error).message));
    }
  }
}
export function advanceWorkflow(s: Save) {
  const w = s.workflow;
  if (!w?.enabled || !w.nodes.length) return;
  for (let checked = 0; checked <= w.nodes.length; checked++) {
    w.index++;
    w.count = 0;
    if (w.index >= w.nodes.length) {
      if (!w.repeat) {
        w.enabled = false;
        s.activity = null;
        return;
      }
      w.index = 0;
    }
    const node = w.nodes[w.index];
    const a = ACTIVITY[node.activity];
    if (!a || !canPay(s, a.inputs) || s.skills[a.skill].level < a.level)
      continue;
    if (
      node.targetResource &&
      amount(s, node.targetResource).gte(node.targetAmount || 1)
    )
      continue;
    if (node.loadout) {
      if (s.facilities.Workshop < 8) continue;
      try {
        applyLoadout(s, node.loadout, true);
      } catch {
        continue;
      }
    }
    s.activity = node.activity;
    return;
  }
  w.enabled = false;
  s.activity = null;
  log(s, "automation", "Workflow paused: no step can make progress.");
}
export function startWorkflow(s: Save) {
  const w = s.workflow;
  if (s.facilities.Workshop < 6 || !w?.nodes.length)
    throw Error("Workshop 6 and a workflow are required.");
  if (s.skillJob) throw Error("Finish the reserved cycle first.");
  w.enabled = true;
  w.index = -1;
  advanceWorkflow(s);
  beginSkill(s);
}
export function requestContract(s: Save, reroll = false) {
  if (s.contract && !reroll)
    throw Error("Only one Slayer contract may be active.");
  if (!s.unlocks.includes("boss-0"))
    throw Error("Defeat the first boss to meet the Slayer Master.");
  if (reroll) pay(s, { gold: 100 + s.skills.Slayer.level * 10 });
  const unlocked = Array.from({ length: 10 }, (_, r) => r).filter((r) =>
    unlockedRegion(s, r),
  );
  const region = pick(s, unlocked);
  const kind = pick(s, [
    "kill",
    "retrieve",
    "elite",
    "hunt",
  ] as Contract["kind"][]);
  s.contract = {
    id: id(s, "contract"),
    kind,
    region,
    target:
      kind === "retrieve" ? 5 : kind === "elite" ? 2 : kind === "hunt" ? 4 : 15,
    progress: 0,
    item: `trophy-${region}`,
    reward: Math.floor(
      100 * (region + 1) * (1 + 0.05 * skillMilestones(s.skills.Slayer.level)),
    ),
  };
}
export const slayerTokens = (s: Save, region: number) =>
  Math.floor(
    10 * (region + 1) * (1 + 0.1 * skillMilestones(s.skills.Slayer.level)),
  );
export function turnIn(s: Save) {
  const c = s.contract;
  if (!c) throw Error("No active contract.");
  if (c.kind === "retrieve") pay(s, { [c.item]: c.target });
  else if (c.progress < c.target) throw Error("Contract not complete.");
  resource(s, "gold", c.reward);
  resource(s, "tokens", slayerTokens(s, c.region));
  resource(s, "catalyst", 1);
  gainXP(s.skills.Slayer, c.reward);
  metric(s, "contracts");
  s.metrics.skills25 = Object.values(s.skills).filter(
    (v) => v.level >= 25,
  ).length;
  s.contract = null;
  log(
    s,
    "slayer",
    "Contract turned in. Slayer XP, tokens, gold, and a catalyst received.",
  );
}
const SHOP: Record<
  string,
  { cost: Record<string, number>; out: Record<string, number> }
> = {
  ration: { cost: { gold: 30 }, out: { ration: 1 } },
  potion: { cost: { gold: 50 }, out: { potion: 1 } },
  inherit1: { cost: { tokens: 10 }, out: { inherit1: 1 } },
  inherit2: { cost: { tokens: 50 }, out: { inherit2: 1 } },
  inherit3: { cost: { tokens: 150 }, out: { inherit3: 1 } },
  catalyst: { cost: { tokens: 35 }, out: { catalyst: 1 } },
  relic: { cost: { tokens: 100 }, out: { relic: 1 } },
};
export function buy(s: Save, key: string) {
  const offer = SHOP[key];
  if (!offer) throw Error("Unknown offer.");
  pay(s, offer.cost);
  for (const [k, v] of Object.entries(offer.out)) resource(s, k, v);
}
export function claim(s: Save, jid: string) {
  const j = JOURNAL.find((j) => j[0] === jid);
  if (!j || s.claims.includes(jid) || (s.metrics[j[2]] || 0) < j[3])
    throw Error("Objective not ready.");
  s.claims.push(jid);
  resource(s, "gold", j[4]);
  if (jid === "victory") {
    s.eggs.push(egg(s, "N02", "Journal"));
    metric(s, "eggs");
  }
  if (jid === "gather") receiveItem(s, rollItem(s, 0, "Essence", 1));
  log(s, "journal", `${j[1]} claimed.`);
}
export function unit(
  s: Save,
  c: Creature,
  slot: number,
  enemy = false,
  multiplier = 1,
): CombatUnit {
  const st = stats(s, c);
  return {
    id: c.id,
    family: c.family,
    stage: c.stage,
    level: c.level,
    slot,
    enemy,
    hp: st.hp.mul(multiplier).toString(),
    maxHp: st.hp.mul(multiplier).toString(),
    atk: st.atk.mul(multiplier).toString(),
    def: st.def.toString(),
    spa: st.spa.mul(multiplier).toString(),
    spd: st.spd.toString(),
    spe: st.spe.toString(),
    shield: "0",
    next: s.time + 1000 + slot * 73,
    cd: [0, 0, 0],
    statuses: [],
    counter: 0,
  };
}
const live = (u: CombatUnit) => D(u.hp).gt(0);
const has = (u: CombatUnit, k: string, t: number) =>
  u.statuses
    .filter((x) => x.kind === k && x.until > t)
    .reduce((sum, x) => sum + x.power, 0);
function interval(u: CombatUnit, t: number) {
  const speed = D(u.spe).div(100).add(1).toNumber();
  const quick = FAMILY[u.family].passive.kind === "quick" ? 1.15 : 1;
  return (
    ((Math.max(0.75, Math.min(6, 6 / speed)) * 1000) /
      (1 + has(u, "haste", t) * 0.7)) *
    Math.min(2, 1 + has(u, "slow", t)) *
    quick ** -1
  );
}
function event(
  s: Save,
  actor: CombatUnit,
  target: CombatUnit,
  kind: string,
  value: DecimalSource,
) {
  const b = s.combat!;
  b.events.push({
    id: ++b.eventNo,
    time: s.time,
    actor: actor.id,
    target: target.id,
    kind,
    amount: D(value).round().toString(),
  });
  b.events = b.events.slice(-36);
}
function allies(s: Save, u: CombatUnit) {
  return s.combat!.units.filter((a) => a.enemy === u.enemy && live(a));
}
function enemies(s: Save, u: CombatUnit) {
  return s.combat!.units.filter((a) => a.enemy !== u.enemy && live(a));
}
function targets(s: Save, u: CombatUnit, e: Effect) {
  const team = allies(s, u),
    foes = enemies(s, u);
  if (e.target === "self") return [u];
  if (e.target === "allAllies") return team;
  if (e.target === "allEnemies") return foes;
  if (e.target === "ally")
    return [...team]
      .sort(
        (a, b) =>
          D(a.hp).div(a.maxHp).cmp(D(b.hp).div(b.maxHp)) || a.slot - b.slot,
      )
      .slice(0, 1);
  if (e.target === "back") {
    const back = foes.filter((a) => a.slot >= 3);
    return (back.length ? back : foes)
      .sort((a, b) => a.slot - b.slot)
      .slice(0, 1);
  }
  const front = foes.filter((a) => a.slot < 3);
  return (front.length ? front : foes)
    .sort((a, b) => a.slot - b.slot)
    .slice(0, 1);
}
function status(
  u: CombatUnit,
  kind: string,
  power: number,
  until: number,
  source?: string,
) {
  const old = u.statuses.find((st) => st.kind === kind);
  if (old) {
    old.power = Math.max(old.power, power);
    old.until = Math.max(old.until, until);
  } else
    u.statuses.push({
      kind,
      power,
      until,
      source,
      next: kind === "dot" ? until - 7000 : undefined,
    });
}
function hurt(
  s: Save,
  source: CombatUnit,
  target: CombatUnit,
  value: Decimal,
  indirect = false,
) {
  if (!live(target)) return;
  let damage = value.max(0);
  if (!indirect) {
    const guard = allies(s, target).find(
      (a) =>
        a.id !== target.id &&
        (has(a, "redirect", s.time) > 0 ||
          FAMILY[a.family].passive.kind === "redirect"),
    );
    if (guard) {
      const share = damage.mul(
        Math.min(0.6, has(guard, "redirect", s.time) || 0.15 * guard.stage),
      );
      damage = damage.sub(share);
      hurt(s, source, guard, share, true);
    }
  }
  const absorb = D(target.shield).min(damage);
  target.shield = D(target.shield).sub(absorb).max(0).toString();
  damage = damage.sub(absorb);
  target.hp = D(target.hp).sub(damage).max(0).toString();
  event(s, source, target, "damage", damage);
  target.counter++;
  const passive = FAMILY[target.family].passive.kind;
  if (!indirect && ["retaliate", "counter"].includes(passive) && live(source)) {
    hurt(s, target, source, damage.mul(0.05 * target.stage), true);
  }
  if (!live(target)) event(s, source, target, "down", 0);
}
function doEffect(s: Save, u: CombatUnit, e: Effect, rank = 1) {
  const selected = targets(s, u, e);
  for (const target of selected) {
    if (e.kind === "damage") {
      for (let h = 0; h < (e.hits || 1); h++) {
        if (!live(target)) break;
        const friendly = allies(s, u);
        const opposition = allies(s, target);
        const passive = FAMILY[u.family].passive.kind;
        const cp = s.creatures.find((c) => c.id === u.id);
        const critGear = cp
          ? bonus(s, cp, "crit")
              .div(bonus(s, cp, "crit").add(100))
              .toNumber() * 0.25
          : 0;
        const critChance =
          0.05 + critGear + (["crit", "aerial"].includes(passive) ? 0.15 : 0);
        const evasion = Math.min(
          0.55,
          has(target, "evade", s.time) +
            (["evade", "counter", "aerial", "smoke"].includes(
              FAMILY[target.family].passive.kind,
            )
              ? 0.07
              : 0) +
            opposition.filter((a) => FAMILY[a.family].passive.kind === "flash")
              .length *
              0.025 +
            has(u, "accuracy", s.time),
        );
        if (rand(s) < evasion) {
          event(s, u, target, "miss", 0);
          continue;
        }
        let attack = D(e.physical ? u.atk : u.spa),
          defense = D(e.physical ? target.def : target.spd);
        if (passive === "adaptive") {
          attack = D(u.atk).max(u.spa);
          defense = D(target.def).min(target.spd);
        }
        if (target.enemy && s.combat?.adventure?.id === "raid-2") {
          const guarded = target.counter % 8 < 4 ? "physical" : "special";
          if ((e.physical ? "physical" : "special") === guarded)
            defense = defense.mul(2.5);
        }
        const pierce = e.penetration ?? (passive === "pierce" ? 0.3 : 0);
        defense = defense
          .mul(1 - Math.min(0.75, has(target, "break", s.time)))
          .mul(1 - pierce);
        let power =
          e.power *
          rank *
          (1 + has(u, "power", s.time)) *
          (1 - Math.min(0.7, has(u, "weaken", s.time)));
        if (
          [
            "heat",
            "charge",
            "absorb",
            "combo",
            "resonance",
            "chain",
            "jets",
          ].includes(passive)
        )
          power *= 1 + Math.min(0.3, u.counter * 0.015 * u.stage);
        if (passive === "rage")
          power *= 1 + D(1).sub(D(u.hp).div(u.maxHp)).toNumber() * 0.6;
        if (passive === "execute" || e.execute)
          if (D(target.hp).div(target.maxHp).lt(0.35)) power *= 1.6;
        if (
          passive === "stun" &&
          target.statuses.some((st) => ["stun", "slow"].includes(st.kind))
        )
          power *= 1.25;
        if (!e.physical)
          power *=
            1 +
            friendly.filter((a) => FAMILY[a.family].passive.kind === "special")
              .length *
              0.04;
        if (passive === "nova") power *= 1 + enemies(s, u).length * 0.035;
        const mitigation = D(80).add(D(u.level).mul(5));
        let damage = attack
          .mul(power)
          .mul(mitigation.div(mitigation.add(defense)))
          .mul(
            elemental(FAMILY[u.family].element, FAMILY[target.family].element),
          );
        if (rand(s) < critChance) {
          damage = damage.mul(passive === "crit" ? 1.8 : 1.5);
          event(s, u, target, "critical", 0);
        }
        if (
          target.slot >= 3 &&
          opposition.some((a) => FAMILY[a.family].passive.kind === "guard")
        )
          damage = damage.mul(0.88);
        if (
          !e.physical &&
          opposition.some((a) => FAMILY[a.family].passive.kind === "ward")
        )
          damage = damage.mul(0.9);
        if (FAMILY[target.family].passive.kind === "pressure")
          damage = damage.mul(0.86);
        if (
          FAMILY[target.family].passive.kind === "frost" &&
          D(target.shield).gt(0)
        )
          damage = damage.mul(0.9);
        if (passive === "shieldbreak" && D(target.shield).gt(0))
          damage = damage.mul(1.8);
        hurt(s, u, target, damage.max(1));
        if (["shatter", "silt"].includes(passive))
          status(target, "break", 0.1 * u.stage, s.time + 5000, u.id);
        if (["root", "displace"].includes(passive))
          status(target, "slow", 0.08 * u.stage, s.time + 4000, u.id);
        if (passive === "drain" && has(target, "slow", s.time))
          status(target, "weaken", 0.1, s.time + 4000, u.id);
        if (passive === "disrupt")
          target.cd = target.cd.map((cd) => Math.max(s.time, cd) + 300);
      }
    } else if (e.kind === "heal") {
      let power = e.power * rank;
      const p = FAMILY[u.family].passive.kind;
      if (p === "warmth") power *= 1 + Math.min(0.3, u.counter * 0.02);
      if (p === "cleanse" && D(target.hp).div(target.maxHp).lt(0.5))
        power *= 1.25;
      const cp = s.creatures.find((c) => c.id === u.id);
      if (cp)
        power *=
          1 +
          bonus(s, cp, "heal")
            .div(bonus(s, cp, "heal").add(100))
            .toNumber();
      const healed = D(target.maxHp)
        .mul(Math.min(0.75, power))
        .min(D(target.maxHp).sub(target.hp));
      target.hp = add(target.hp, healed);
      event(s, u, target, "heal", healed);
      if (!u.enemy && s.combat?.adventure?.id === "raid-1") {
        const boss = s.combat.units.find((a) => a.enemy && live(a));
        if (boss) status(u, "dot", 0.07, s.time + 8000, boss.id);
      }
      if (p === "rain")
        target.shield = D(target.shield)
          .max(D(target.maxHp).mul(0.05))
          .toString();
    } else if (e.kind === "shield") {
      const boost = FAMILY[u.family].passive.kind === "shield" ? 1.2 : 1;
      const shield = D(target.maxHp).mul(
        Math.min(0.85, e.power * rank * boost),
      );
      target.shield = D(target.shield).max(shield).toString();
      status(
        target,
        "shieldExpiry",
        1,
        s.time + (e.duration || 8) * 1000,
        u.id,
      );
      event(s, u, target, "shield", shield);
    } else if (e.kind === "cleanse") {
      target.statuses = target.statuses.filter(
        (st) =>
          !["dot", "slow", "weaken", "break", "accuracy", "stun"].includes(
            st.kind,
          ),
      );
      event(s, u, target, "cleanse", 0);
    } else if (e.kind === "disrupt") {
      target.cd = target.cd.map((cd) => Math.max(s.time, cd) + e.power * 1000);
      event(s, u, target, "disrupt", e.power);
    } else if (e.kind === "displace") {
      const other = allies(s, target).find(
        (a) => a.slot >= 3 !== target.slot >= 3,
      );
      if (other) [target.slot, other.slot] = [other.slot, target.slot];
      event(s, u, target, "displace", 0);
    } else {
      status(target, e.kind, e.power, s.time + (e.duration || 8) * 1000, u.id);
      event(s, u, target, e.kind, 0);
    }
  }
}
function act(s: Save, u: CombatUnit) {
  if (!live(u)) return;
  if (has(u, "stun", s.time)) {
    u.next = s.time + 500;
    return;
  }
  const f = FAMILY[u.family];
  const cp = s.creatures.find((c) => c.id === u.id);
  const priorities = cp?.priorities || [2, 1, 0];
  let used = false;
  for (const index of priorities) {
    if (index >= u.stage || u.cd[index] > s.time) continue;
    const a = f.abilities[index];
    const useful = a.effects.some((e) => {
      const ts = targets(s, u, e);
      return ts.some((t) =>
        e.kind === "heal"
          ? D(t.hp).lt(D(t.maxHp).mul(0.92))
          : e.kind === "shield"
            ? D(t.shield).lt(D(t.maxHp).mul(e.power * 0.75))
            : e.kind === "cleanse"
              ? t.statuses.some((st) =>
                  ["dot", "stun", "slow", "weaken", "break"].includes(st.kind),
                )
              : true,
      );
    });
    if (!useful) continue;
    event(s, u, u, "ability", 0);
    s.combat!.events.at(-1)!.label = a.name;
    for (const effect of a.effects)
      doEffect(s, u, effect, 1 + (u.stage - index - 1) * 0.18);
    u.cd[index] = s.time + a.cooldown * 1000;
    used = true;
    break;
  }
  if (!used)
    doEffect(s, u, {
      kind: "damage",
      power: 1,
      target: "enemy",
      physical: D(u.atk).gte(u.spa),
    });
  u.counter++;
  if (f.passive.kind === "regen")
    doEffect(s, u, { kind: "heal", power: 0.015 * u.stage, target: "self" });
  let haste =
    allies(s, u).filter((a) => FAMILY[a.family].passive.kind === "haste")
      .length * 0.035;
  u.next = s.time + interval(u, s.time) / (1 + haste);
}
function prepareBattle(s: Save, b: Combat) {
  const en = ENCOUNTER[b.encounter];
  b.units = [];
  for (let slot = 0; slot < 6; slot++) {
    const c = s.creatures.find((c) => c.id === s.combatTeam[slot]);
    if (c && c.recoveryUntil <= s.time) b.units.push(unit(s, c, slot));
  }
  const scale =
    en.kind === "boss"
      ? 1.35
      : en.kind === "slayer"
        ? 1.15
        : en.region === 0
          ? 0.62
          : 1;
  en.families.forEach((fid, i) => {
    const c: Creature = {
      id: `enemy-${i}`,
      family: fid,
      stage: en.level >= 75 ? 3 : en.level >= 25 ? 2 : 1,
      level: en.level,
      xp: "0",
      ivs: Object.fromEntries(STATS.map((k) => [k, 8 + en.region])) as Record<
        Stat,
        number
      >,
      gender: "M",
      color: "Normal",
      effect: "Normal",
      locked: false,
      favorite: false,
      equipment: {},
      priorities: [2, 1, 0],
      recoveryUntil: 0,
      acquired: 0,
    };
    const u = unit(s, c, i, false, scale);
    u.enemy = true;
    if (en.kind === "boss") {
      u.maxHp = D(u.maxHp).mul(2.4).toString();
      u.hp = u.maxHp;
    }
    if (b.adventure?.id.startsWith("raid-")) {
      u.maxHp = D(u.maxHp).mul(1.5).toString();
      u.hp = u.maxHp;
      u.atk = D(u.atk).mul(1.3).toString();
      u.spa = D(u.spa).mul(1.3).toString();
    }
    if (en.mechanic === "Quickened") u.spe = D(u.spe).mul(1.5).toString();
    if (en.mechanic === "Armored") u.def = D(u.def).mul(1.5).toString();
    if (en.mechanic === "Ward") u.spd = D(u.spd).mul(1.8).toString();
    if (en.mechanic === "Shielded") u.shield = D(u.maxHp).mul(0.4).toString();
    b.units.push(u);
  });
  b.nextBattle = 0;
}
export function startCombat(s: Save, eid: string, advId?: string) {
  if (s.combat) throw Error("A combat run is already active.");
  const en = ENCOUNTER[eid];
  if (!en || !unlockedRegion(s, en.region)) throw Error("Region locked.");
  if (en.kind === "slayer" && s.skills.Slayer.level < 1 + en.region * 15)
    throw Error("Slayer level too low.");
  const cs = s.combatTeam
    .filter(Boolean)
    .map((id) => s.creatures.find((c) => c.id === id))
    .filter(Boolean) as Creature[];
  if (!cs.length || cs.some((c) => c.recoveryUntil > s.time))
    throw Error("Assign recovered creatures to combat first.");
  const adv = advId ? ADVENTURES.find((a) => a.id === advId) : undefined;
  if (adv) {
    if (!unlockedRegion(s, adv.region)) throw Error("Adventure locked.");
    pay(s, { gold: adv.cost });
  }
  s.combat = {
    encounter: adv?.nodes[0] || eid,
    units: [],
    nextBattle: 0,
    wins: 0,
    defeats: 0,
    repeat: !adv,
    limit: 0,
    resource: "",
    amount: 0,
    adventure: adv ? { id: adv.id, node: 0 } : undefined,
    events: [],
    eventNo: 0,
  };
  prepareBattle(s, s.combat);
  log(s, "combat", `Started ${adv?.name || en.name}.`);
}
export function retryCombat(s: Save) {
  const b = s.combat;
  if (!b || b.defeats === 0) throw Error("No defeated run to retry.");
  if (
    s.combatTeam.some(
      (id) => s.creatures.find((c) => c.id === id)?.recoveryUntil! > s.time,
    )
  )
    throw Error("Creatures are still recovering.");
  b.defeats = 0;
  prepareBattle(s, b);
  log(s, "combat", "Recovered team returned to the encounter.");
}
export function stopCombat(s: Save) {
  if (s.combat) log(s, "combat", "Combat run ended. Earned rewards retained.");
  s.combat = null;
}
/** First adventure clears reward progression; repeat farming has independent rare rolls. */
export function adventureDrops(s: Save, adventure: string) {
  const a = ADVENTURES.find((a) => a.id === adventure);
  if (!a) throw Error("Unknown adventure.");
  const first = !s.unlocks.includes(a.id);
  return {
    first,
    eggs: first ? 1 : a.kind === "raid" ? 0.1 : 0.05,
    gear: first ? 1 : a.kind === "raid" ? 0.4 : 0.25,
  };
}
/** The display and award resolver share these probabilities. No RNG is consumed. */
export function encounterDrops(s: Save, eid: string) {
  const en = ENCOUNTER[eid];
  if (!en) throw Error("Unknown encounter.");
  const cs = s.creatures.filter((c) => s.combatTeam.includes(c.id));
  const luck = cs.reduce(
    (v, c) =>
      v +
      bonus(s, c, "luck")
        .div(bonus(s, c, "luck").add(100))
        .toNumber() *
        0.04,
    0,
  );
  const rareScale = en.kind === "boss" ? 1.25 : en.kind === "slayer" ? 1.1 : 1;
  const eggs = Math.min(0.005, 0.0005 * rareScale * (1 + luck));
  const gear = Math.min(0.008, 0.0008 * rareScale * (1 + luck));
  return {
    eggs,
    gear,
    luck,
    gold: Math.floor((4 + en.level * 2) * en.lootScale),
    creatureXP:
      (12 + en.level * 6) *
      en.lootScale *
      (1 +
        ((s.facilities.Expedition - 1) / (s.facilities.Expedition + 19)) * 0.5),
    materials: Array.from({ length: 4 }, (_, k) => ({
      id: `g${k}-${Math.min(11, en.region)}`,
      min: Math.floor(en.lootScale) + 1,
      max: Math.ceil(3 * en.lootScale),
      chance: 1,
    })),
    families: [...new Set(en.families)].map((family) => ({
      family,
      chance:
        (eggs * en.families.filter((id) => id === family).length) /
        en.families.length,
    })),
    rarities: equipmentRarityChances().map((conditional, rarity) => ({
      rarity,
      conditional,
      chance: gear * conditional,
    })),
    catalyst: en.kind === "boss" ? 1 : 0,
    relic: en.kind === "boss" ? 0.4 : 0,
  };
}
export function foragingEggChance(s: Save, aid: string) {
  const a = ACTIVITY[aid];
  if (!a || a.skill !== "Foraging") return 0;
  const master = s.mastery[aid]?.level || 1;
  const luck = s.skillTeam.reduce((v, id) => {
    const c = s.creatures.find((c) => c.id === id);
    return (
      v +
      (c
        ? bonus(s, c, "luck")
            .div(bonus(s, c, "luck").add(100))
            .toNumber() * 0.05
        : 0)
    );
  }, 0);
  return (
    0.00001 *
    (1 + a.tier * 0.12) *
    (1 + Math.min(0.4, (master - 1) / (master + 99)) + luck)
  );
}
function reward(s: Save) {
  const b = s.combat!,
    en = ENCOUNTER[b.encounter];
  const drops = encounterDrops(s, en.id);
  const xp = drops.creatureXP;
  const cs = s.combatTeam
    .map((id) => s.creatures.find((c) => c.id === id))
    .filter(Boolean) as Creature[];
  for (const c of cs)
    gainXP(
      c,
      D(xp)
        .div(cs.length)
        .mul(c.effect === "Sparkling" ? 1.05 : 1)
        .mul(D(1).add(bonus(s, c, "xp").div(bonus(s, c, "xp").add(100)))),
    );
  resource(s, "gold", drops.gold);
  for (let k = 0; k < 4; k++)
    resource(
      s,
      `g${k}-${Math.min(11, en.region)}`,
      Math.ceil((1 + rand(s) * 2) * en.lootScale),
    );
  resource(s, `trophy-${en.region}`, 1);
  if (rand(s) < drops.eggs) {
    const family = pick(s, en.families);
    s.eggs.push(egg(s, family, en.name));
    metric(s, "eggs");
    log(s, "rare", `${FAMILY[family].names[0]} egg found.`);
  }
  if (rand(s) < drops.gear) receiveItem(s, rollItem(s, en.region));
  if (en.kind === "boss") {
    resource(s, "catalyst", 1);
    if (rand(s) < drops.relic) resource(s, "relic", 1);
    if (!s.unlocks.includes(en.id)) {
      receiveItem(s, rollItem(s, en.region, "Essence", 2));
      s.unlocks.push(en.id);
      log(s, "unlock", `${en.name} defeated · next region unlocked.`);
    }
    metric(s, "bosses");
  }
  if (s.contract && s.contract.region === en.region) {
    const c = s.contract;
    if (
      c.kind === "kill" ||
      (c.kind === "elite" && en.kind !== "wild") ||
      (c.kind === "hunt" && en.id === `wild-${c.region}-3`)
    )
      c.progress += en.families.length;
  }
  metric(s, "wins");
  b.wins++;
  if (b.adventure) {
    const adv = ADVENTURES.find((a) => a.id === b.adventure!.id)!;
    b.adventure.node++;
    if (b.adventure.node >= adv.nodes.length) {
      resource(s, "gold", adv.cost * 2);
      resource(s, "relic", adv.kind === "raid" ? 5 : 2);
      const completion = adventureDrops(s, adv.id);
      const foundEgg = rand(s) < completion.eggs;
      const foundGear = rand(s) < completion.gear;
      if (foundEgg) {
        s.eggs.push(
          egg(
            s,
            pick(
              s,
              FAMILIES.filter((f) => f.region <= adv.region),
            ).id,
            adv.name,
          ),
        );
        metric(s, "eggs");
      }
      if (foundGear)
        receiveItem(
          s,
          rollItem(s, adv.region, undefined, adv.kind === "raid" ? 4 : 3),
        );
      metric(s, adv.kind === "raid" ? "raids" : "dungeons");
      if (!s.unlocks.includes(adv.id)) s.unlocks.push(adv.id);
      log(
        s,
        "adventure",
        `${adv.name} completed. Relics and gold received${foundEgg ? ", an egg" : ""}${foundGear ? ", equipment" : ""}.`,
      );
      s.combat = null;
      return;
    }
    b.encounter = adv.nodes[b.adventure.node];
  } else if (
    !b.repeat ||
    (b.limit > 0 && b.wins >= b.limit) ||
    (b.resource && amount(s, b.resource).gte(b.amount))
  ) {
    s.combat = null;
    return;
  }
  b.nextBattle = s.time + 1800;
}
function combatStep(s: Save) {
  const b = s.combat;
  if (!b || b.defeats) return;
  if (b.nextBattle) {
    if (b.nextBattle <= s.time) prepareBattle(s, b);
    return;
  }
  for (const u of b.units) {
    if (!live(u)) continue;
    for (const st of u.statuses) {
      if (
        st.kind === "dot" &&
        st.next !== undefined &&
        st.next <= s.time &&
        st.until > s.time
      ) {
        const source = b.units.find((a) => a.id === st.source) || u;
        hurt(s, source, u, D(source.spa).mul(st.power), true);
        st.next = s.time + 1000;
      }
      if (st.kind === "shieldExpiry" && st.until <= s.time) u.shield = "0";
    }
    u.statuses = u.statuses.filter((st) => st.until > s.time);
  }
  for (const u of [...b.units].sort((a, b) => a.id.localeCompare(b.id))) {
    if (u.next <= s.time && live(u)) {
      const en = ENCOUNTER[b.encounter];
      if (
        u.enemy &&
        b.adventure?.id === "raid-0" &&
        u.counter > 0 &&
        u.counter % 4 === 0
      ) {
        for (const ally of allies(s, u)) {
          if (D(ally.shield).gt(0)) {
            ally.hp = D(ally.hp).add(ally.shield).min(ally.maxHp).toString();
            ally.shield = "0";
          } else {
            ally.shield = D(ally.maxHp).mul(0.16).toString();
          }
        }
        event(s, u, u, "crucible", 0);
      }
      if (
        u.enemy &&
        b.adventure?.id === "raid-2" &&
        u.counter > 0 &&
        u.counter % 5 === 0
      ) {
        const vulnerable = enemies(s, u).sort((a, b) =>
          D(a.hp).div(a.maxHp).cmp(D(b.hp).div(b.maxHp)),
        )[0];
        if (vulnerable) hurt(s, u, vulnerable, D(u.spa).mul(1.2));
      }
      if (u.enemy && u.counter > 0 && u.counter % 5 === 0) {
        if (en.mechanic === "Eruption" || en.mechanic === "Convergence")
          doEffect(s, u, { kind: "damage", power: 1.8, target: "allEnemies" });
        if (en.mechanic === "Regeneration" || en.mechanic === "Cleansing")
          doEffect(s, u, { kind: "heal", power: 0.15, target: "allAllies" });
        if (en.mechanic === "Disruption")
          doEffect(s, u, { kind: "disrupt", power: 2, target: "allEnemies" });
        if (en.mechanic === "Rampage")
          status(u, "power", Math.min(0.7, u.counter * 0.02), s.time + 60000);
      }
      act(s, u);
    }
    if (!b.units.some((u) => !u.enemy && live(u))) break;
  }
  if (!b.units.some((u) => !u.enemy && live(u))) {
    b.defeats++;
    metric(s, "defeats");
    for (const cid of s.combatTeam) {
      const c = s.creatures.find((c) => c.id === cid);
      if (c)
        c.recoveryUntil =
          s.time +
          Math.max(15000, 300000 / (1 + 0.25 * (s.facilities.Recovery - 1)));
    }
    log(
      s,
      "defeat",
      "Defeated. Rewards retained. Your team is recovering; retry when ready.",
    );
    return;
  }
  if (!b.units.some((u) => u.enemy && live(u))) reward(s);
}
function nextCombat(s: Save) {
  const b = s.combat;
  if (!b || b.defeats) return Infinity;
  if (b.nextBattle) return b.nextBattle;
  let next = Infinity;
  for (const u of b.units) {
    if (!live(u)) continue;
    next = Math.min(next, u.next);
    for (const st of u.statuses) {
      next = Math.min(next, st.until);
      if (st.kind === "dot" && st.next !== undefined && st.next < st.until)
        next = Math.min(next, st.next);
    }
  }
  return next;
}
export function repeatBreeding(
  s: Save,
  mother: string,
  father: string,
  mc: number,
  fc: number,
  ms: Stat[],
  fs: Stat[],
) {
  if (s.facilities.Breeding < 4)
    throw Error("Breeding Complex level 4 required for repeat pairs.");
  if (
    s.breedingPlans?.some(
      (p) => p.enabled && (p.mother === mother || p.father === father),
    )
  )
    throw Error("A selected parent already belongs to a repeat plan.");
  breed(s, mother, father, mc, fc, ms, fs);
  (s.breedingPlans ??= []).push({
    id: id(s, "pair-plan"),
    mother,
    father,
    mc,
    fc,
    ms,
    fs,
    enabled: true,
  });
}
function automation(s: Save) {
  for (const plan of s.breedingPlans || []) {
    if (
      !plan.enabled ||
      s.facilities.Breeding < 4 ||
      s.breeding.length >= s.facilities.Breeding
    )
      continue;
    const m = s.creatures.find((c) => c.id === plan.mother),
      f = s.creatures.find((c) => c.id === plan.father);
    if (!m || !f) {
      plan.enabled = false;
      continue;
    }
    if (!free(s, m) || !free(s, f)) continue;
    try {
      breed(s, m.id, f.id, plan.mc, plan.fc, plan.ms, plan.fs);
    } catch (error) {
      plan.enabled = false;
      log(
        s,
        "automation",
        "Repeat breeding paused: " + (error as Error).message,
      );
    }
  }

  if (s.autoHatch && s.facilities.Hatchery >= 2)
    for (const inc of s.incubators)
      if (inc.egg && inc.finish <= s.time && s.creatures.length < capacity(s))
        hatch(s, inc.id);
  if (s.autoLoad && s.facilities.Hatchery >= 4)
    for (const inc of s.incubators)
      if (!inc.egg && s.eggs.length) {
        let eggs = [...s.eggs];
        if (s.facilities.Hatchery >= 6) {
          if (s.hatchPolicy === "perfect")
            eggs.sort(
              (a, b) =>
                Object.values(b.ivs).reduce((x, y) => x + y, 0) -
                Object.values(a.ivs).reduce((x, y) => x + y, 0),
            );
          if (s.hatchPolicy === "rare")
            eggs.sort(
              (a, b) =>
                Number(b.color !== "Normal" || b.effect !== "Normal") -
                Number(a.color !== "Normal" || a.effect !== "Normal"),
            );
          if (s.hatchPolicy.startsWith("family:"))
            eggs = eggs.filter((e) => e.family === s.hatchPolicy.slice(7));
        }
        if (eggs.length) loadEgg(s, inc.id, eggs[0].id);
      }
  beginSkill(s);
  for (let i = 1; i < farmStationCount(s); i++)
    if (s.farmJobs?.[i - 1]?.activity) withFarmStation(s, i, beginSkill);
}
function nonEarningCompletions(s: Save) {
  for (const inc of s.incubators)
    if (inc.egg && inc.finish <= s.time && !inc.notified) {
      inc.notified = true;
      log(
        s,
        "incubation",
        FAMILY[inc.egg.family].names[0] + " egg is ready to hatch.",
      );
    }

  for (const up of [...s.upgrades])
    if (up.finish <= s.time) {
      s.facilities[up.facility] = up.level;
      s.upgrades = s.upgrades.filter((x) => x !== up);
      metric(s, "upgrades");
      log(s, "farm", `${up.facility} reached level ${up.level}.`);
    }
  for (const j of [...s.breeding])
    if (j.finish <= s.time) {
      s.eggs.push(j.egg);
      s.breeding = s.breeding.filter((x) => x !== j);
      metric(s, "breeds");
      metric(s, "eggs");
      log(
        s,
        "breeding",
        `Breeding complete. ${FAMILY[j.egg.family].names[0]} egg received; parents available.`,
      );
    }
}
export function offlineCap(s: Save) {
  return 12 * 3600000;
}
function earnedXP(
  before: { level: number; xp: string },
  after: { level: number; xp: string },
) {
  let xp = D(after.xp).sub(before.xp);
  for (let lv = before.level; lv < after.level; lv++) xp = xp.add(xpNext(lv));
  return xp.max(0).toString();
}
export function advance(s: Save, target: number, offline = false) {
  if (target <= s.time) return;
  const original = s.time;
  const elapsed = target - original;
  const end = offline ? Math.min(target, original + offlineCap(s)) : target;
  const before = offline
    ? {
        wins: s.metrics.wins || 0,
        defeats: s.metrics.defeats || 0,
        hatches: s.metrics.hatches || 0,
        eggs: s.metrics.eggs || 0,
        gold: s.gold,
        inventory: { ...s.inventory },
        skills: structuredClone(s.skills),
        creatures: s.creatures.map((c) => ({
          id: c.id,
          level: c.level,
          xp: c.xp,
        })),
        items: new Set(s.items.map((i) => i.id)),
        breeds: s.metrics.breeds || 0,
        unlocks: [...s.unlocks],
      }
    : null;
  automation(s);
  while (s.time < end) {
    const next = Math.min(
      end,
      nextCombat(s),
      s.skillJob?.finish || Infinity,
      ...(s.farmJobs || []).map((j) => j.job?.finish || Infinity),
      ...s.breeding.map((b) => b.finish),
      ...s.upgrades.map((u) => u.finish),
      ...(s.autoHatch && s.creatures.length < capacity(s)
        ? s.incubators
            .filter((i) => i.egg && i.finish > s.time)
            .map((i) => i.finish)
        : []),
    );
    if (!Number.isFinite(next)) break;
    s.time = Math.max(s.time + 0.001, next);
    nonEarningCompletions(s);
    if (s.skillJob && s.skillJob.finish <= s.time) completeSkill(s);
    for (let i = 1; i < farmStationCount(s); i++)
      if (s.farmJobs?.[i - 1]?.job && s.farmJobs[i - 1].job!.finish <= s.time)
        withFarmStation(s, i, completeSkill);
    combatStep(s);
    automation(s);
  }
  s.time = end;
  if (target > end) {
    const skipped = target - end; // Pause earning clocks in excess of the earning window.
    if (s.skillJob) s.skillJob.finish += skipped;
    for (const j of s.farmJobs || []) if (j.job) j.job.finish += skipped;
    for (const i of s.incubators)
      if (i.egg && i.finish > end) i.finish += skipped;
    for (const j of s.breeding) j.finish += skipped;
    for (const u of s.upgrades) u.finish += skipped;
    for (const c of s.creatures)
      if (c.recoveryUntil > end) c.recoveryUntil += skipped;
    if (s.combat) {
      s.combat.nextBattle = s.combat.nextBattle
        ? s.combat.nextBattle + skipped
        : 0;
      for (const u of s.combat.units) {
        u.next += skipped;
        u.cd = u.cd.map((t) => t + skipped);
        u.statuses = u.statuses.map((st) => ({
          ...st,
          until: st.until + skipped,
          next: st.next === undefined ? undefined : st.next + skipped,
        }));
      }
    }
    s.time = target;
    nonEarningCompletions(s);
  }
  if (offline && before)
    s.summary = {
      elapsed,
      simulated: end - original,
      wins: (s.metrics.wins || 0) - before.wins,
      defeats: (s.metrics.defeats || 0) - before.defeats,
      hatches: (s.metrics.hatches || 0) - before.hatches,
      eggs: (s.metrics.eggs || 0) - before.eggs,
      gold: D(s.gold).sub(before.gold).toString(),
      skillXP: Object.fromEntries(
        SKILLS.map((k) => [k, earnedXP(before.skills[k], s.skills[k])]).filter(
          ([, v]) => D(v).gt(0),
        ),
      ),
      creatureXP: s.creatures
        .reduce(
          (xp, c) =>
            xp.add(
              earnedXP(
                before.creatures.find((old) => old.id === c.id) || {
                  level: 1,
                  xp: "0",
                },
                c,
              ),
            ),
          D(0),
        )
        .toString(),
      items: s.items.filter((i) => !before.items.has(i.id)).length,
      breeds: (s.metrics.breeds || 0) - before.breeds,
      unlocks: s.unlocks.filter((u) => !before.unlocks.includes(u)),
      resources: Object.fromEntries(
        Object.entries(s.inventory)
          .map(([k, v]) => [
            k,
            D(v)
              .sub(before.inventory[k] || 0)
              .toString(),
          ])
          .filter(([, v]) => D(v).gt(0)),
      ),
    };
}
export function consume(s: Save, what: string) {
  if (!["ration", "potion", "ward"].includes(what))
    throw Error("Not a combat consumable.");
  if (!s.combat || s.combat.defeats) throw Error("Start a battle first.");
  pay(s, { [what]: 1 });
  for (const u of s.combat.units.filter((u) => !u.enemy && live(u))) {
    if (what === "potion") {
      u.hp = D(u.hp).add(D(u.maxHp).mul(0.3)).min(u.maxHp).toString();
      event(s, u, u, "heal", D(u.maxHp).mul(0.3));
    }
    if (what === "ration") status(u, "power", 0.15, s.time + 60000);
    if (what === "ward")
      u.shield = D(u.shield).max(D(u.maxHp).mul(0.25)).toString();
  }
}
export function sell(s: Save, key: string, count: number) {
  if (!Number.isSafeInteger(count) || count < 1)
    throw Error("Enter a positive whole quantity.");
  pay(s, { [key]: count });
  resource(s, "gold", D(count).mul(key.startsWith("g") ? 2 : 5));
}
export function validateContent() {
  const errors: string[] = [];
  if (FAMILIES.length !== 50) errors.push("family count");
  for (const e of ["Fire", "Nature", "Earth", "Storm", "Water"])
    if (FAMILIES.filter((f) => f.element === e).length !== 10)
      errors.push("element count " + e);
  for (const f of FAMILIES) {
    if (
      f.names.length !== 3 ||
      f.abilities.length !== 3 ||
      Object.keys(f.aptitudes).length !== 8
    )
      errors.push(f.id);
    if (!Object.values(ENCOUNTER).some((e) => e.families.includes(f.id)))
      errors.push("unobtainable " + f.id);
    for (const a of f.abilities)
      if (!a.effects.length || a.cooldown <= 0) errors.push("ability " + a.id);
  }
  return errors;
}
