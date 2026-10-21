export const VERSION = "1.3.0";
export const ELEMENTS = ["Fire", "Nature", "Earth", "Storm", "Water"] as const;
export type Element = (typeof ELEMENTS)[number];
export const SKILLS = [
  "Woodcutting",
  "Mining",
  "Fishing",
  "Foraging",
  "Cooking",
  "Smithing",
  "Crafting",
  "Alchemy",
  "Slayer",
] as const;
export type Skill = (typeof SKILLS)[number];
export const STATS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type Stat = (typeof STATS)[number];
export const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
] as const;
export type Slot = "Essence" | "Gem" | "Trinket";
export type EffectKind =
  | "damage"
  | "heal"
  | "shield"
  | "haste"
  | "power"
  | "weaken"
  | "slow"
  | "dot"
  | "stun"
  | "break"
  | "cleanse"
  | "redirect"
  | "displace"
  | "disrupt"
  | "accuracy"
  | "evade";
export interface Effect {
  kind: EffectKind;
  power: number;
  target: "enemy" | "allEnemies" | "back" | "ally" | "allAllies" | "self";
  duration?: number;
  physical?: boolean;
  hits?: number;
  penetration?: number;
  execute?: boolean;
}
export interface Ability {
  id: string;
  name: string;
  cooldown: number;
  effects: Effect[];
  description: string;
}
export interface Family {
  id: string;
  names: [string, string, string];
  element: Element;
  role: string;
  primary: Skill;
  shape: string;
  passive: { name: string; kind: string; value: number; description: string };
  base: Record<Stat, number>;
  growth: Record<Stat, number>;
  aptitudes: Record<string, number>;
  abilities: Ability[];
  region: number;
}
export interface Creature {
  id: string;
  family: string;
  stage: number;
  level: number;
  xp: string;
  ivs: Record<Stat, number>;
  gender: "M" | "F";
  color: "Normal" | "Inverted" | "Prismatic";
  effect: "Normal" | "Sparkling" | "Glowing";
  name?: string;
  locked: boolean;
  favorite: boolean;
  equipment: Partial<Record<Slot, string>>;
  priorities: number[];
  recoveryUntil: number;
  acquired: number;
}
export interface Egg {
  id: string;
  family: string;
  ivs: Record<Stat, number>;
  gender: "M" | "F";
  color: Creature["color"];
  effect: Creature["effect"];
  created: number;
  source: string;
}
export interface Item {
  id: string;
  slot: Slot;
  rarity: number;
  affixes: { key: string; roll: string }[];
  level: number;
  milestones: { level: number; index: number; roll: string }[];
  locked: boolean;
  favorite: boolean;
}
export interface Activity {
  id: string;
  name: string;
  skill: Skill;
  tier: number;
  level: number;
  duration: number;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  xp: number;
  creatureXp: number;
  description: string;
}
export interface Encounter {
  id: string;
  name: string;
  region: number;
  kind: "wild" | "boss" | "slayer";
  families: string[];
  level: number;
  mechanic: string;
  lootScale: number;
}
export interface Adventure {
  id: string;
  name: string;
  kind: "dungeon" | "raid";
  region: number;
  nodes: string[];
  cost: number;
  description: string;
}
export interface Contract {
  id: string;
  kind: "kill" | "retrieve" | "elite" | "hunt";
  region: number;
  target: number;
  progress: number;
  item: string;
  reward: number;
}
export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  mode: "AND" | "OR";
  family?: string;
  element?: Element;
  stage?: number;
  color?: string;
  effect?: string;
  maxIV?: number;
  perfect?: number;
  ivStat?: Stat;
  ivBelow?: number;
  ivThresholds?: Partial<Record<Stat, number>>;
  slot?: Slot;
  rarity?: number;
  affix?: string;
  rollBelow?: number;
}
export interface WorkflowNode {
  activity: string;
  targetResource?: string;
  targetAmount?: number;
  cycles?: number;
  loadout?: string;
}
export interface Log {
  id: string;
  time: number;
  type: string;
  text: string;
}
export interface CombatUnit {
  id: string;
  family: string;
  stage: number;
  level: number;
  slot: number;
  enemy: boolean;
  hp: string;
  maxHp: string;
  atk: string;
  def: string;
  spa: string;
  spd: string;
  spe: string;
  shield: string;
  next: number;
  cd: number[];
  statuses: {
    kind: string;
    power: number;
    until: number;
    next?: number;
    source?: string;
  }[];
  counter: number;
}
export interface Combat {
  encounter: string;
  units: CombatUnit[];
  nextBattle: number;
  wins: number;
  defeats: number;
  repeat: boolean;
  limit: number;
  resource: string;
  amount: number;
  adventure?: { id: string; node: number };
  events: {
    id: number;
    time: number;
    actor: string;
    target: string;
    kind: string;
    amount: string;
    label?: string;
  }[];
  eventNo: number;
}
export interface Save {
  schema: number;
  version: string;
  id: string;
  rng: number;
  time: number;
  created: number;
  revision: number;
  started: boolean;
  gold: string;
  tokens: string;
  inventory: Record<string, string>;
  creatures: Creature[];
  eggs: Egg[];
  items: Item[];
  combatTeam: (string | null)[];
  skillTeam: string[];
  farmJobs?: {
    team: string[];
    activity: string | null;
    job: Save["skillJob"];
  }[];
  farmRevision?: number;
  loadouts: {
    id: string;
    name: string;
    combat: (string | null)[];
    skill: string[];
  }[];
  skills: Record<Skill, { level: number; xp: string }>;
  mastery: Record<string, { level: number; xp: string }>;
  facilities: Record<string, number>;
  upgrades: { facility: string; finish: number; level: number }[];
  incubators: {
    id: string;
    egg: Egg | null;
    finish: number;
    notified?: boolean;
  }[];
  breedingPlans?: {
    id: string;
    mother: string;
    father: string;
    mc: number;
    fc: number;
    ms: Stat[];
    fs: Stat[];
    enabled: boolean;
  }[];
  breeding: { id: string; parents: string[]; egg: Egg; finish: number }[];
  skillJob: {
    activity: string;
    finish: number;
    inputs: Record<string, number>;
  } | null;
  activity: string | null;
  queue: string[];
  workflow: {
    enabled: boolean;
    repeat: boolean;
    nodes: WorkflowNode[];
    index: number;
    count: number;
  } | null;
  combat: Combat | null;
  contract: Contract | null;
  unlocks: string[];
  discovered: string[];
  variants: string[];
  claims: string[];
  releaseRules: Rule[];
  salvageRules: Rule[];
  hatchPolicy: string;
  autoHatch: boolean;
  autoLoad: boolean;
  logs: Log[];
  metrics: Record<string, number>;
  settings: { sound: boolean; motion: boolean; offlineHours: number };
  summary: {
    elapsed: number;
    simulated: number;
    wins: number;
    defeats: number;
    hatches: number;
    eggs: number;
    gold: string;
    resources: Record<string, string>;
    skillXP: Record<string, string>;
    creatureXP: string;
    items: number;
    breeds: number;
    unlocks: string[];
  } | null;
}
