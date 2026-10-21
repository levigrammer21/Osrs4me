import {
  Family,
  Skill,
  STATS,
  ELEMENTS,
  Ability,
  Activity,
  Encounter,
  Adventure,
  Effect,
  Stat,
} from "./model";
const rows = [
  [
    "F01",
    "Cindlet Brask Vulkarn",
    "Heat-building frontline special attacker",
    "Smithing",
    "upright furnace salamander",
    "heat",
    "Banked embers",
  ],
  [
    "F02",
    "Wickel Lantrel Pyrelume",
    "Floating healer with stored warmth",
    "Alchemy",
    "levitating lantern with ribbon wings",
    "warmth",
    "Hearthlight",
  ],
  [
    "F03",
    "Sparkit Voltrix Arcinder",
    "Fast multi-strike physical attacker",
    "Crafting",
    "six-limbed spark runner",
    "combo",
    "Kindled rhythm",
  ],
  [
    "F04",
    "Ashnub Smoulder Cineroot",
    "Burrowing retaliation tank",
    "Mining",
    "spiral-armored root mole",
    "retaliate",
    "Ashen reprisal",
  ],
  [
    "F05",
    "Fumlet Smogill Vesperume",
    "Smoke accuracy and attack debuffer",
    "Cooking",
    "suspended gill bellows",
    "smoke",
    "Soot screen",
  ],
  [
    "F06",
    "Kindrel Torvane Solcrest",
    "Team attack-speed support",
    "Foraging",
    "sun-feathered crested biped",
    "haste",
    "Dawn chorus",
  ],
  [
    "F07",
    "Clinkit Kilnox Forgemaw",
    "Armor-breaking physical attacker",
    "Smithing",
    "walking anvil with hinged jaw",
    "shatter",
    "Tempered teeth",
  ],
  [
    "F08",
    "Searfin Scaldart Boilance",
    "Defense-piercing ranged attacker",
    "Fishing",
    "hovering lance-finned ray",
    "pierce",
    "Boiling point",
  ],
  [
    "F09",
    "Coalisk Charcoil Pyroboros",
    "Damage-absorbing heat tank",
    "Mining",
    "coiled coal-plated serpent",
    "absorb",
    "Coal reservoir",
  ],
  [
    "F10",
    "Flaret Cindervail Heliovar",
    "Powerful area special attacker",
    "Alchemy",
    "orbiting ember discs and sail",
    "nova",
    "Solar convergence",
  ],
  [
    "N01",
    "Burlit Thornock Bramblehart",
    "Ally-protecting bark tank",
    "Woodcutting",
    "branch-antlered shield guardian",
    "guard",
    "Living bark",
  ],
  [
    "N02",
    "Sporel Mycrown Mycarch",
    "Regeneration-focused healer",
    "Foraging",
    "tripod mushroom crown",
    "regen",
    "Mycelial bond",
  ],
  [
    "N03",
    "Vinel Tetheroot Strangrove",
    "Restraint and speed-control specialist",
    "Woodcutting",
    "braided vine tower with anchor feet",
    "root",
    "Clinging tendrils",
  ],
  [
    "N04",
    "Pollenip Nectarix Melliflor",
    "Special-attack support",
    "Alchemy",
    "petal-winged nectar vessel",
    "special",
    "Golden pollen",
  ],
  [
    "N05",
    "Huskit Shellburr Bastionut",
    "Durable damage-redirecting tank",
    "Foraging",
    "burr-shell wheel with seed core",
    "redirect",
    "Unbroken husk",
  ],
  [
    "N06",
    "Serrit Scytherb Reapthorn",
    "Fast finishing physical attacker",
    "Woodcutting",
    "scythe-armed reed mantis",
    "execute",
    "Harvest instinct",
  ],
  [
    "N07",
    "Mosslet Fenmoss Mirewarden",
    "Speed-draining defensive debuffer",
    "Fishing",
    "moss-draped stilt walker",
    "drain",
    "Mire grasp",
  ],
  [
    "N08",
    "Sapip Resindle Amberveil",
    "Resin-shielding support",
    "Crafting",
    "amber droplet suspended in branch frame",
    "shield",
    "Amber memory",
  ],
  [
    "N09",
    "Tuberin Rhizodon Deepcrown",
    "Damage-scaling frontline bruiser",
    "Foraging",
    "root-knuckled bulb giant",
    "rage",
    "Deep roots",
  ],
  [
    "N10",
    "Frondel Canoprix Verdantor",
    "Evasive counterattacker",
    "Cooking",
    "folding fan-frond glider",
    "counter",
    "Canopy dance",
  ],
  [
    "E01",
    "Pebbit Cairnox Monolithar",
    "High-defense frontline tank",
    "Mining",
    "stacked standing stones with ring arms",
    "armor",
    "Mountain heart",
  ],
  [
    "E02",
    "Grillet Tunnex Boremand",
    "Armor-piercing physical attacker",
    "Mining",
    "rotating drill-backed burrower",
    "pierce",
    "Fault finder",
  ],
  [
    "E03",
    "Chimlet Resonox Bellith",
    "Resonance-based special attacker",
    "Smithing",
    "floating chime slabs",
    "resonance",
    "Deep resonance",
  ],
  [
    "E04",
    "Flintip Shardancer Razolith",
    "Fragile critical-hit attacker",
    "Crafting",
    "blade-legged crystal dancer",
    "crit",
    "Fracture edge",
  ],
  [
    "E05",
    "Siltel Loamurk Sedimor",
    "Slow and defense-reduction controller",
    "Foraging",
    "flowing clay mound with slab arms",
    "silt",
    "Eroding touch",
  ],
  [
    "E06",
    "Geodot Facetrix Prismantle",
    "Special-defense support",
    "Alchemy",
    "faceted geode with prism sails",
    "ward",
    "Prism refraction",
  ],
  [
    "E07",
    "Clodder Terramund Gravenox",
    "Shield-breaking physical bruiser",
    "Mining",
    "slab-fisted earthen biped",
    "shieldbreak",
    "Grave pressure",
  ],
  [
    "E08",
    "Fossel Ossimark Paleolith",
    "Rapid-attack counter specialist",
    "Crafting",
    "floating fossil rib cage",
    "counter",
    "Ancient reflex",
  ],
  [
    "E09",
    "Dunlet Slipdune Sandstrider",
    "Evasive targeting disruptor",
    "Cooking",
    "sand ribbon carried by stilt fins",
    "evade",
    "Shifting sands",
  ],
  [
    "E10",
    "Stalip Speleon Cavernarch",
    "Stun-focused defensive controller",
    "Smithing",
    "inverted stalactite arch crawler",
    "stun",
    "Cavern pulse",
  ],
  [
    "S01",
    "Zippet Vectrix Fulminex",
    "Extremely fast single-target attacker",
    "Crafting",
    "angular lightning dart with orbiting fins",
    "quick",
    "Vector surge",
  ],
  [
    "S02",
    "Gustel Vanelope Tempestrel",
    "Allied action-speed support",
    "Fishing",
    "wind-vane antlered sail runner",
    "haste",
    "Tailwind",
  ],
  [
    "S03",
    "Staticle Cracklon Thundercoil",
    "Chain-damage special attacker",
    "Smithing",
    "segmented lightning helix",
    "chain",
    "Live circuit",
  ],
  [
    "S04",
    "Nimbusip Cloudrum Stormbell",
    "Healing and defensive support",
    "Alchemy",
    "cloud mantle carrying a rain bell",
    "rain",
    "Gentle storm",
  ],
  [
    "S05",
    "Whistlet Shriekane Sonovex",
    "Ability-disrupting special attacker",
    "Cooking",
    "reed-throated spiral-wing singer",
    "disrupt",
    "Dissonance",
  ],
  [
    "S06",
    "Voltusk Capacorn Dynarok",
    "Charge-storing frontline bruiser",
    "Mining",
    "capacitor-tusked armored biped",
    "charge",
    "Stored thunder",
  ],
  [
    "S07",
    "Kitet Aeromant Skyravel",
    "Evasive critical-hit attacker",
    "Foraging",
    "living kite with hooked wing fingers",
    "aerial",
    "High current",
  ],
  [
    "S08",
    "Pufflet Baromox Pressurion",
    "Pressure damage-reduction tank",
    "Fishing",
    "layered pressure sphere with piston legs",
    "pressure",
    "Pressure envelope",
  ],
  [
    "S09",
    "Rillix Cyclor Vortigon",
    "Enemy-position disruption and area control",
    "Woodcutting",
    "hollow cyclone with orbiting branches",
    "displace",
    "Vortex eye",
  ],
  [
    "S10",
    "Flickerel Flashveil Luminarch",
    "Accuracy and evasion support",
    "Alchemy",
    "flickering lens-winged moth",
    "flash",
    "Guiding flash",
  ],
  [
    "W01",
    "Droplet Globryn Tidalon",
    "Adaptive special attacker",
    "Fishing",
    "water orb held in crescent shell",
    "adaptive",
    "Tidal adaptation",
  ],
  [
    "W02",
    "Skippet Riptalon Maristrike",
    "Fast physical finisher",
    "Fishing",
    "skimming blade-tailed shore biped",
    "execute",
    "Riptide pursuit",
  ],
  [
    "W03",
    "Corlet Reefguard Atollith",
    "Barrier-generating frontline defender",
    "Crafting",
    "walking coral arch with lagoon core",
    "shield",
    "Reef covenant",
  ],
  [
    "W04",
    "Glimmeroe Lumifin Abyssalume",
    "Healer and status cleanser",
    "Alchemy",
    "ribbon-finned luminous deep-sea drifter",
    "cleanse",
    "Abyssal grace",
  ],
  [
    "W05",
    "Brinip Saltrix Brinegeist",
    "Defense-reducing debuffer",
    "Cooking",
    "brine mist in salt-crystal cage",
    "shatter",
    "Corrosive tide",
  ],
  [
    "W06",
    "Siphlet Jetmantle Hydrovector",
    "Repeated-strike special attacker",
    "Fishing",
    "jet-siphon mantle with ring tentacles",
    "jets",
    "Jet cadence",
  ],
  [
    "W07",
    "Shellip Bulwarkle Leviacrest",
    "Backline-protecting tank",
    "Mining",
    "crescent-shell guardian with crest arms",
    "guard",
    "Sheltering crest",
  ],
  [
    "W08",
    "Kelplet Driftangle Sargassor",
    "Entanglement and speed-drain controller",
    "Foraging",
    "tangled kelp crown with trailing anchors",
    "root",
    "Sargasso hold",
  ],
  [
    "W09",
    "Bublet Sonarix Echotide",
    "Sonic-burst special attacker",
    "Woodcutting",
    "bubble chamber framed by sonic hoops",
    "resonance",
    "Echo chamber",
  ],
  [
    "W10",
    "Frostel Glacirn Cryomantle",
    "Defensive slowing and shielding support",
    "Smithing",
    "ice-mantled water spirit on frost blades",
    "frost",
    "Stillwater mantle",
  ],
];
const dmg = (
  power = 1.6,
  target: Effect["target"] = "enemy",
  physical = false,
): Effect => ({ kind: "damage", power, target, physical });
const fx = (
  kind: Effect["kind"],
  power: number,
  target: Effect["target"] = "enemy",
  duration = 8,
): Effect => ({ kind, power, target, duration });
function abilities(id: string, kind: string): Ability[] {
  const sets: Record<string, [string, Effect[]][]> = {
    heat: [
      ["Ember lance", [dmg(1.8)]],
      ["Furnace stance", [fx("power", 0.3, "self"), fx("shield", 0.2, "self")]],
      ["Volcanic heart", [dmg(2, "allEnemies"), fx("dot", 0.15, "allEnemies")]],
    ],
    warmth: [
      ["Warmth transfer", [fx("heal", 0.3, "ally")]],
      ["Hearth shelter", [fx("shield", 0.22, "allAllies")]],
      [
        "Dawn rekindling",
        [fx("heal", 0.26, "allAllies"), fx("cleanse", 1, "allAllies")],
      ],
    ],
    combo: [
      ["Spark flurry", [{ ...dmg(0.65, "enemy", true), hits: 3 }]],
      ["Kindle dash", [fx("haste", 0.3, "self"), dmg(1.2, "back", true)]],
      ["Cinder cascade", [{ ...dmg(0.6, "allEnemies", true), hits: 3 }]],
    ],
    retaliate: [
      ["Ashen ram", [dmg(1.6, "enemy", true), fx("weaken", 0.15)]],
      [
        "Burrow cover",
        [fx("shield", 0.35, "self"), fx("redirect", 0.4, "self")],
      ],
      ["Root eruption", [dmg(1.6, "allEnemies"), fx("stun", 1, "enemy", 1.5)]],
    ],
    smoke: [
      [
        "Soot veil",
        [fx("accuracy", 0.2, "allEnemies"), dmg(0.65, "allEnemies")],
      ],
      ["Choking coil", [fx("weaken", 0.25, "allEnemies"), fx("dot", 0.15)]],
      ["Blackout", [dmg(1.6, "allEnemies"), fx("disrupt", 3, "allEnemies")]],
    ],
    haste: [
      ["Rallying breeze", [fx("haste", 0.2, "allAllies")]],
      ["Forward surge", [dmg(1.4), fx("power", 0.15, "allAllies")]],
      [
        "Perfect tempo",
        [fx("haste", 0.4, "allAllies"), fx("cleanse", 1, "allAllies")],
      ],
    ],
    shatter: [
      ["Fracture", [dmg(1.4, "enemy", true), fx("break", 0.25)]],
      ["Rending arc", [dmg(1.2, "allEnemies", true)]],
      ["Shatterpoint", [{ ...dmg(3, "enemy", true), penetration: 0.6 }]],
    ],
    pierce: [
      ["Bore lance", [{ ...dmg(1.8, "enemy", true), penetration: 0.5 }]],
      ["Exposed seam", [fx("break", 0.35), dmg(1.3, "back", true)]],
      ["Core breach", [{ ...dmg(3, "enemy", true), penetration: 0.85 }]],
    ],
    absorb: [
      ["Coal shell", [fx("shield", 0.4, "self")]],
      ["Heat sink", [fx("redirect", 0.45, "self"), fx("power", 0.25, "self")]],
      ["Reservoir burst", [dmg(2, "allEnemies"), fx("heal", 0.18, "self")]],
    ],
    nova: [
      ["Solar flare", [dmg(1.3, "allEnemies")]],
      ["Corona", [fx("dot", 0.18, "allEnemies"), fx("power", 0.3, "self")]],
      ["Helios fall", [dmg(2.5, "allEnemies")]],
    ],
    guard: [
      [
        "Guardian strike",
        [dmg(1.4, "enemy", true), fx("shield", 0.15, "ally")],
      ],
      [
        "Stand together",
        [fx("redirect", 0.5, "self"), fx("shield", 0.25, "self")],
      ],
      [
        "Living fortress",
        [fx("shield", 0.3, "allAllies"), fx("weaken", 0.2, "allEnemies")],
      ],
    ],
    regen: [
      ["Spore mending", [fx("heal", 0.3, "ally")]],
      [
        "Mycelial garden",
        [fx("heal", 0.18, "allAllies"), fx("power", 0.15, "allAllies")],
      ],
      ["Life bloom", [fx("heal", 0.4, "allAllies")]],
    ],
    root: [
      ["Entangle", [dmg(1.2), fx("slow", 0.3)]],
      [
        "Anchoring roots",
        [fx("slow", 0.2, "allEnemies"), fx("weaken", 0.15, "allEnemies")],
      ],
      ["Deep bind", [dmg(1.7, "allEnemies"), fx("stun", 1, "allEnemies", 1)]],
    ],
    special: [
      ["Nectar blessing", [fx("power", 0.25, "allAllies")]],
      [
        "Pollen burst",
        [dmg(1.3, "allEnemies"), fx("accuracy", 0.15, "allEnemies")],
      ],
      [
        "Golden season",
        [fx("power", 0.4, "allAllies"), fx("heal", 0.18, "allAllies")],
      ],
    ],
    redirect: [
      ["Shell ward", [fx("shield", 0.45, "self")]],
      [
        "Seed sanctuary",
        [fx("redirect", 0.6, "self"), fx("heal", 0.18, "self")],
      ],
      [
        "Unbroken bastion",
        [fx("shield", 0.2, "allAllies"), dmg(2, "enemy", true)],
      ],
    ],
    execute: [
      ["Reaping cut", [{ ...dmg(1.7, "enemy", true), execute: true }]],
      ["Predator step", [fx("haste", 0.3, "self"), dmg(1.3, "back", true)]],
      ["Final harvest", [{ ...dmg(3, "back", true), execute: true }]],
    ],
    drain: [
      ["Mire drag", [dmg(1.2), fx("slow", 0.3), fx("haste", 0.15, "self")]],
      [
        "Fen bulwark",
        [fx("shield", 0.3, "self"), fx("weaken", 0.2, "allEnemies")],
      ],
      ["Bog reclaim", [dmg(1.7, "allEnemies"), fx("heal", 0.2, "allAllies")]],
    ],
    shield: [
      ["Barrier weave", [fx("shield", 0.25, "ally")]],
      ["Sheltering ring", [fx("shield", 0.16, "allAllies")]],
      [
        "Covenant",
        [fx("shield", 0.3, "allAllies"), fx("cleanse", 1, "allAllies")],
      ],
    ],
    rage: [
      ["Rootbreaker", [dmg(1.8, "enemy", true)]],
      ["Deep resolve", [fx("power", 0.4, "self"), fx("heal", 0.18, "self")]],
      ["Crown upheaval", [dmg(2.2, "allEnemies", true)]],
    ],
    counter: [
      ["Reactive slash", [dmg(1.5, "enemy", true), fx("evade", 0.18, "self")]],
      [
        "Read the flow",
        [fx("haste", 0.25, "self"), fx("shield", 0.18, "self")],
      ],
      ["Reversal dance", [{ ...dmg(0.7, "allEnemies", true), hits: 3 }]],
    ],
    armor: [
      ["Stone fist", [dmg(1.6, "enemy", true)]],
      [
        "Mountain stance",
        [fx("shield", 0.45, "self"), fx("redirect", 0.4, "self")],
      ],
      [
        "Monolith fall",
        [dmg(2, "allEnemies", true), fx("stun", 1, "enemy", 2)],
      ],
    ],
    resonance: [
      ["Resonant pulse", [dmg(1.7)]],
      ["Echo wave", [{ ...dmg(0.7, "allEnemies"), hits: 2 }]],
      [
        "Harmonic collapse",
        [dmg(2.3, "allEnemies"), fx("break", 0.2, "allEnemies")],
      ],
    ],
    crit: [
      ["Shard thrust", [dmg(2, "enemy", true)]],
      ["Flintstep", [fx("evade", 0.25, "self"), dmg(1.3, "back", true)]],
      ["Razor constellation", [{ ...dmg(0.8, "allEnemies", true), hits: 3 }]],
    ],
    silt: [
      ["Silt crush", [dmg(1.2), fx("break", 0.2)]],
      ["Loam field", [fx("slow", 0.3, "allEnemies")]],
      [
        "Sediment flood",
        [dmg(1.8, "allEnemies"), fx("break", 0.3, "allEnemies")],
      ],
    ],
    ward: [
      ["Prism ward", [fx("shield", 0.25, "ally")]],
      ["Refracted force", [fx("weaken", 0.25, "allEnemies"), dmg(1.3)]],
      [
        "Crystal haven",
        [fx("shield", 0.3, "allAllies"), fx("power", 0.2, "allAllies")],
      ],
    ],
    shieldbreak: [
      ["Grave hammer", [dmg(2, "enemy", true)]],
      [
        "Break the line",
        [fx("break", 0.35, "allEnemies"), dmg(1.1, "allEnemies", true)],
      ],
      ["Terramund crush", [dmg(3, "enemy", true), fx("stun", 1, "enemy", 2)]],
    ],
    evade: [
      ["Sand slip", [fx("evade", 0.25, "self"), dmg(1.3, "back", true)]],
      ["False horizon", [fx("displace", 1), fx("accuracy", 0.2, "allEnemies")]],
      ["Dune mirage", [fx("evade", 0.2, "allAllies"), dmg(1.7, "allEnemies")]],
    ],
    stun: [
      ["Cavern knock", [dmg(1.4, "enemy", true), fx("stun", 1, "enemy", 1)]],
      [
        "Stalagmite wall",
        [fx("shield", 0.3, "self"), fx("slow", 0.2, "allEnemies")],
      ],
      [
        "Seismic arrest",
        [dmg(1.8, "allEnemies"), fx("stun", 1, "allEnemies", 1.5)],
      ],
    ],
    quick: [
      ["Vector strike", [dmg(1.6, "back", true)]],
      ["Surge state", [fx("haste", 0.4, "self")]],
      ["Lightning line", [{ ...dmg(0.7, "back", true), hits: 4 }]],
    ],
    chain: [
      ["Arc link", [{ ...dmg(0.8, "allEnemies"), hits: 2 }]],
      ["Conductive field", [fx("break", 0.2, "allEnemies"), dmg(1.2)]],
      ["Thunder network", [{ ...dmg(0.8, "allEnemies"), hits: 3 }]],
    ],
    rain: [
      ["Rain mend", [fx("heal", 0.28, "ally")]],
      ["Cloud cover", [fx("shield", 0.2, "allAllies")]],
      [
        "Storm sanctuary",
        [fx("heal", 0.3, "allAllies"), fx("weaken", 0.15, "allEnemies")],
      ],
    ],
    disrupt: [
      ["Dissonant note", [dmg(1.4), fx("disrupt", 2)]],
      [
        "Silencing gale",
        [fx("disrupt", 3, "allEnemies"), fx("weaken", 0.15, "allEnemies")],
      ],
      ["Sonic rupture", [dmg(2.2, "allEnemies"), fx("stun", 1, "enemy", 1)]],
    ],
    charge: [
      ["Capacitor bash", [dmg(1.8, "enemy", true)]],
      ["Charge mantle", [fx("shield", 0.3, "self"), fx("power", 0.3, "self")]],
      ["Dynamo discharge", [dmg(2.4, "allEnemies")]],
    ],
    aerial: [
      ["Sky talon", [dmg(1.7, "back", true)]],
      ["Updraft", [fx("evade", 0.3, "self"), fx("haste", 0.2, "self")]],
      ["Falling star", [dmg(3, "back", true)]],
    ],
    pressure: [
      ["Pressure dome", [fx("shield", 0.4, "self")]],
      ["Compression", [fx("weaken", 0.25, "allEnemies"), dmg(1.2)]],
      [
        "Barometric crash",
        [dmg(2, "allEnemies"), fx("shield", 0.15, "allAllies")],
      ],
    ],
    displace: [
      ["Whirling pull", [dmg(1.3), fx("displace", 1)]],
      [
        "Cyclone field",
        [fx("slow", 0.25, "allEnemies"), dmg(0.9, "allEnemies")],
      ],
      [
        "Vortex collapse",
        [dmg(2.1, "allEnemies"), fx("disrupt", 2, "allEnemies")],
      ],
    ],
    flash: [
      ["Guiding ray", [fx("evade", 0.15, "allAllies"), dmg(1.2)]],
      ["Flash veil", [fx("accuracy", 0.25, "allEnemies")]],
      [
        "Luminous path",
        [fx("haste", 0.25, "allAllies"), fx("cleanse", 1, "allAllies")],
      ],
    ],
    adaptive: [
      ["Tidal lance", [dmg(1.8)]],
      ["Flow state", [fx("shield", 0.2, "self"), fx("power", 0.25, "self")]],
      ["Adaptive tide", [dmg(2.2, "allEnemies"), fx("heal", 0.12, "self")]],
    ],
    cleanse: [
      ["Glimmer mend", [fx("heal", 0.3, "ally")]],
      [
        "Clearwater",
        [fx("cleanse", 1, "allAllies"), fx("heal", 0.12, "allAllies")],
      ],
      [
        "Abyssal renewal",
        [fx("heal", 0.35, "allAllies"), fx("shield", 0.15, "allAllies")],
      ],
    ],
    jets: [
      ["Siphon volley", [{ ...dmg(0.6), hits: 3 }]],
      ["Jet rhythm", [fx("haste", 0.25, "self"), dmg(1.5)]],
      ["Hydro barrage", [{ ...dmg(0.7, "allEnemies"), hits: 3 }]],
    ],
    frost: [
      ["Chilling ward", [fx("shield", 0.23, "ally"), fx("slow", 0.2)]],
      [
        "Stillwater",
        [fx("slow", 0.25, "allEnemies"), fx("weaken", 0.15, "allEnemies")],
      ],
      [
        "Winter mantle",
        [fx("shield", 0.28, "allAllies"), dmg(1.3, "allEnemies")],
      ],
    ],
  };
  return sets[kind].map(([name, effects], i) => ({
    id: `${id}-a${i}`,
    name,
    cooldown: [9, 16, 24][i],
    effects,
    description: effects
      .map((e) => `${e.kind} ${Math.round(e.power * 100)}% → ${e.target}`)
      .join(" · "),
  }));
}
const passiveText: Record<string, string> = {
  heat: "Each action banks heat, raising special damage up to 30%.",
  warmth: "Healing increases as warmth builds through actions.",
  combo: "Repeated attacks gain damage with each action.",
  retaliate: "Returns a fraction of incoming damage.",
  smoke: "Passively reduces incoming hit chance.",
  haste: "Allies act faster while this creature is alive.",
  shatter: "Damaging hits reduce target defense briefly.",
  pierce: "Ignores part of enemy defense.",
  absorb: "Damage taken builds heat and increases retaliation power.",
  nova: "Special damage grows against groups.",
  guard: "Reduces damage to allies in the back row.",
  regen: "Recovers a small fraction of maximum HP each action.",
  root: "Damaging hits slow the target.",
  special: "Allied special damage is increased.",
  redirect: "Redirects part of damage dealt to vulnerable allies.",
  execute: "Deals more damage to enemies below 35% HP.",
  drain: "Slowed foes deal less damage.",
  shield: "Shields created are stronger.",
  rage: "Deals increasing damage as health falls.",
  counter: "Returns damage when struck; counters cannot chain.",
  armor: "Natural defenses are increased.",
  resonance: "Each action builds harmonic damage.",
  crit: "Critical chance and critical damage are increased.",
  silt: "Hits erode defense.",
  ward: "Reduces special damage taken by the team.",
  shieldbreak: "Attacks deal bonus damage to shields.",
  evade: "Naturally evades attacks.",
  stun: "Deals bonus damage to controlled enemies.",
  quick: "Base action speed is increased.",
  chain: "Special hits gain power with successive actions.",
  rain: "Healing also creates a small shield.",
  disrupt: "Hits slightly delay enemy ability cooldowns.",
  charge: "Taking damage stores charge for later attacks.",
  aerial: "Evasion and critical chance are increased.",
  pressure: "Reduces incoming damage.",
  displace: "Hits briefly slow backline enemies.",
  flash: "Allies gain evasion.",
  adaptive: "Damaging attacks adjust to the lower enemy defense.",
  cleanse: "Healing is strengthened on injured allies.",
  jets: "Repeated strikes gain potency.",
  frost: "Shields reduce incoming damage while active.",
};
export const FAMILIES: Family[] = rows.map((r, index) => {
  const [id, line, role, skill, shape, kind, pname] = r;
  const tank = /tank|defender|guardian|frontline|bruiser/i.test(role);
  const healer = /heal|regeneration/i.test(role);
  const support = /support|debuffer|control|disrupt/i.test(role);
  const fast = /fast|evasive|rapid|critical/i.test(role);
  const physical = /physical|critical|counter|bruiser/i.test(role);
  const base = {
    hp: tank ? 145 : healer ? 100 : 85,
    atk: physical ? 31 : tank ? 25 : 17,
    def: tank ? 31 : fast ? 13 : 21,
    spa: physical ? 17 : healer || support ? 27 : 34,
    spd: healer || support ? 29 : tank ? 26 : 17,
    spe: fast ? 40 : tank ? 17 : 27,
  };
  const apt = Object.fromEntries(
    [
      "Woodcutting",
      "Mining",
      "Fishing",
      "Foraging",
      "Cooking",
      "Smithing",
      "Crafting",
      "Alchemy",
    ].map((s, j) => [s, s === skill ? 35 : 8 + ((index * 7 + j * 11) % 14)]),
  );
  return {
    id,
    names: line.split(" ") as [string, string, string],
    element: ELEMENTS[Math.floor(index / 10)],
    role,
    primary: skill as Skill,
    shape,
    passive: { name: pname, kind, value: 0.04, description: passiveText[kind] },
    base,
    growth: Object.fromEntries(
      STATS.map((s) => [s, 1 + ((index * 3 + STATS.indexOf(s)) % 7) * 0.025]),
    ) as Record<Stat, number>,
    aptitudes: apt,
    abilities: abilities(id, kind),
    region: index % 10,
  };
});
export const FAMILY = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));
export const REGIONS = [
  "Hearthwood Verge",
  "Amberbank Marsh",
  "Whispering Quarry",
  "Galegrass Reach",
  "Coralglass Coast",
  "Cinderroot Hollow",
  "Prismfall Caverns",
  "Thunderhead Spires",
  "Drowned Observatory",
  "The Convergence",
];
export const REGION_DETAILS = [
  "A sheltered valley where your first companions find their footing.",
  "Silt and resin reward careful preparation.",
  "Armor and shields test your ability to break defenses.",
  "Swift hunters punish unprotected supports.",
  "Coral guardians turn the tide with barriers.",
  "Heat builds into dangerous eruptions.",
  "Prismatic wards resist special attacks.",
  "Storm fronts disrupt ability rhythms.",
  "Drowned echoes demand healing and cleansing.",
  "All five elements clash at the edge of the known world.",
];
export const MATERIALS: Record<string, string> = {
  essence: "Creature Essence",
  gemdust: "Gem Dust",
  thread: "Charm Thread",
  catalyst: "Evolution Catalyst",
  relic: "Ancient Relic",
  ration: "Trail Ration",
  potion: "Restoration Potion",
  ward: "Ward Tonic",
  inherit1: "Focused Thread",
  inherit2: "Twin Thread",
  inherit3: "Legacy Thread",
};
export const RESOURCE_NAMES = [
  [
    "Ash",
    "Oak",
    "Willow",
    "Cedar",
    "Ironwood",
    "Emberwood",
    "Moonwood",
    "Petrified Wood",
    "Skywood",
    "Elderwood",
    "Worldroot",
    "Eternalwood",
  ],
  [
    "Copper",
    "Iron",
    "Coal",
    "Silver",
    "Gold",
    "Cobalt",
    "Titanium",
    "Obsidian",
    "Star Ore",
    "Prism Ore",
    "Aether Ore",
    "Origin Ore",
  ],
  [
    "Minnow",
    "Trout",
    "Bass",
    "Carp",
    "Salmon",
    "Eel",
    "Tuna",
    "Lanternfish",
    "Pearlfish",
    "Stormfin",
    "Voidfin",
    "Tideheart",
  ],
  [
    "Mint",
    "Berry",
    "Mushroom",
    "Fiber",
    "Sage",
    "Resin",
    "Nightcap",
    "Sunblossom",
    "Dreamleaf",
    "Star Moss",
    "Essence Bloom",
    "Origin Seed",
  ],
];
export const ACTIVITIES: Activity[] = [];
for (let k = 0; k < 4; k++)
  for (let t = 0; t < 12; t++) {
    const skill = ["Woodcutting", "Mining", "Fishing", "Foraging"][k] as Skill;
    const id = `g${k}-${t}`;
    MATERIALS[id] = RESOURCE_NAMES[k][t];
    ACTIVITIES.push({
      id,
      name: RESOURCE_NAMES[k][t],
      skill,
      tier: t,
      level: 1 + t * t * 3,
      duration: 5 + t * 1.5,
      inputs: {},
      outputs: { [id]: 1 },
      xp: 12 * (t + 1) ** 1.8,
      creatureXp: 8 * (t + 1) ** 1.5,
      description: `Gather ${RESOURCE_NAMES[k][t].toLowerCase()} for the sanctuary.`,
    });
  }
for (let k = 0; k < 4; k++)
  for (let t = 0; t < 16; t++) {
    const skill = ["Cooking", "Smithing", "Crafting", "Alchemy"][k] as Skill;
    const tier = Math.min(11, Math.floor(t * 0.75));
    const id = `p${k}-${t}`;
    const special =
      k === 0
        ? t % 3 === 0
          ? "ration"
          : t % 3 === 1
            ? "potion"
            : "ward"
        : k === 1
          ? t % 3 === 0
            ? "gemdust"
            : t % 3 === 1
              ? "thread"
              : `refined${t}`
          : k === 2
            ? t < 5
              ? "inherit1"
              : t < 10
                ? "inherit2"
                : "inherit3"
            : t % 4 === 0
              ? "catalyst"
              : t % 4 === 1
                ? "gemdust"
                : t % 4 === 2
                  ? "thread"
                  : "potion";
    if (special.startsWith("refined"))
      MATERIALS[special] = `${RESOURCE_NAMES[1][tier]} Alloy`;
    ACTIVITIES.push({
      id,
      name: `${MATERIALS[special]} ${t + 1}`,
      skill,
      tier,
      level: 1 + t * t * 2,
      duration: 7 + t,
      inputs: {
        [`g${k === 0 ? 2 : k === 1 ? 1 : k === 2 ? 0 : 3}-${tier}`]: 2,
        [`g${k === 2 ? 3 : k === 3 ? 1 : 3}-${Math.max(0, tier - 1)}`]: 1,
      },
      outputs: { [special]: 1 + Math.floor(t / 4) },
      xp: 18 * (t + 1) ** 1.8,
      creatureXp: 12 * (t + 1) ** 1.5,
      description: `Tier ${t + 1} ${skill.toLowerCase()} recipe.`,
    });
  }
export const ACTIVITY = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const ENCOUNTERS: Encounter[] = [];
for (let r = 0; r < 10; r++) {
  const fs = FAMILIES.filter((f) => f.region === r);
  for (let i = 0; i < 5; i++)
    ENCOUNTERS.push({
      id: `wild-${r}-${i}`,
      name: `${fs[i].names[0]} ${["Grove", "Run", "Nest", "Shoal", "Watch"][i]}`,
      region: r,
      kind: "wild",
      families: [
        fs[i].id,
        ...(r > 1 ? [fs[(i + 1) % 5].id] : []),
        ...(r > 5 ? [fs[(i + 2) % 5].id] : []),
      ],
      level: 1 + r * r * 3 + (r === 0 ? 0 : i),
      mechanic: [
        "Balanced",
        "Regeneration",
        "Armored",
        "Quickened",
        "Shielded",
      ][i],
      lootScale: 1,
    });
  ENCOUNTERS.push({
    id: `boss-${r}`,
    name: [
      "The Hollow Sentinel",
      "Amber Matriarch",
      "The Stone Cantor",
      "Keeper of the Gale",
      "The Coral Sovereign",
      "Furnace of Roots",
      "Prismarch",
      "The Storm Engine",
      "The Drowned Choir",
      "The First Convergence",
    ][r],
    region: r,
    kind: "boss",
    families: [
      fs[0].id,
      fs[2].id,
      fs[4].id,
      ...(r >= 3 ? [fs[1].id, fs[3].id, fs[4].id] : []),
    ],
    level: 8 + r * r * 4,
    mechanic: [
      "Rampage",
      "Regeneration",
      "Armored",
      "Quickened",
      "Shielded",
      "Eruption",
      "Ward",
      "Disruption",
      "Cleansing",
      "Convergence",
    ][r],
    lootScale: 5,
  });
  ENCOUNTERS.push({
    id: `slayer-${r}`,
    name: `${REGIONS[r]} — Elder Hunt`,
    region: r,
    kind: "slayer",
    families: [fs[1].id, fs[3].id],
    level: 12 + r * r * 4,
    mechanic: "Elite",
    lootScale: 3,
  });
}
export const ENCOUNTER = Object.fromEntries(ENCOUNTERS.map((a) => [a.id, a]));
export const ADVENTURES: Adventure[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `dungeon-${i}`,
    name: [
      "Rootbound Vault",
      "The Broken Kiln",
      "Coral Labyrinth",
      "Eye of the Tempest",
      "Convergence Descent",
    ][i],
    kind: "dungeon" as const,
    region: i * 2 + 1,
    nodes: [
      `wild-${i * 2}-0`,
      `wild-${i * 2}-2`,
      `boss-${i * 2}`,
      `boss-${i * 2 + 1}`,
    ],
    cost: 100 * (i + 1) ** 2,
    description: [
      "Healers sustain a four-encounter expedition.",
      "Break armor before the furnace erupts.",
      "Shield-breaking and cleansing keep the team alive.",
      "Rapid enemies disrupt your support line.",
      "Alternate elemental matchups across the final vault.",
    ][i],
  })),
  {
    id: "raid-0",
    name: "The Threefold Crucible",
    kind: "raid",
    region: 6,
    nodes: ["boss-3", "boss-4", "boss-5", "boss-6"],
    cost: 15000,
    description: "Armor, barriers, and eruption phases demand a balanced team.",
  },
  {
    id: "raid-1",
    name: "Choir Beyond the Tide",
    kind: "raid",
    region: 8,
    nodes: ["boss-6", "boss-7", "boss-8"],
    cost: 30000,
    description: "Resist disruption and cleanse the rising tide.",
  },
  {
    id: "raid-2",
    name: "Heart of Convergence",
    kind: "raid",
    region: 9,
    nodes: ["boss-5", "boss-7", "boss-8", "boss-9"],
    cost: 75000,
    description:
      "The complete elemental gauntlet, ending in an escalating final phase.",
  },
];
export const HYBRIDS = [
  ["F01", "N01", "S06"],
  ["F02", "W04", "N04"],
  ["E01", "S01", "W03"],
  ["N02", "W08", "E05"],
  ["F09", "W01", "E03"],
  ["S04", "N08", "W10"],
  ["E06", "F10", "S10"],
  ["W09", "S05", "N10"],
];
export const FACILITIES = [
  "Housing",
  "Hatchery",
  "Breeding",
  "Recovery",
  "Workshop",
  "Expedition",
] as const;
export const FACILITY_INFO: Record<string, string> = {
  Housing: "10 spaces, plus 10 per level. Every owned creature counts.",
  Hatchery:
    "Faster incubation. Lv 2 auto-hatch; Lv 4 auto-load; Lv 6 selection; Lv 8 auto-release.",
  Breeding:
    "One pair per level; progressively faster breeding. Lv 4 unlocks repeat pairs.",
  Recovery: "Faster recovery, with a positive minimum duration.",
  Workshop:
    "Three parallel work stations at Lv 1; one more per level up to eight. Lv 2 loadouts; Lv 3 queues; Lv 4 auto-salvage; Lv 6 workflows; Lv 8 loadout switching.",
  Expedition:
    "Expedition Lodge improves combat XP with diminishing returns, toward +50%. Offline progression always stops after 12 hours.",
};
export const AFFIX_NAMES: Record<string, string> = {
  hp: "Maximum HP",
  atk: "Attack",
  def: "Defense",
  spa: "Special Attack",
  spd: "Special Defense",
  spe: "Speed",
  skillSpeed: "Skilling speed",
  yield: "Gathering yield",
  xp: "Creature XP",
  luck: "Rare find",
  crit: "Critical chance",
  heal: "Healing power",
};
export const JOURNAL = [
  ["hatch", "First companion", "hatches", 1, 80],
  ["boss", "Guardian of the verge", "bosses", 1, 250],
  ["scholar", "Every discipline", "skills25", 9, 3000],
  ["mastery", "A focused craft", "mastery25", 1, 500],
  ["allforms", "The complete living archive", "forms", 150, 25000],
  ["victory", "Into the wilds", "wins", 1, 100],
  ["gather", "A working sanctuary", "cycles", 10, 150],
  ["gear", "Power given form", "equips", 1, 200],
  ["farm", "Room to grow", "upgrades", 1, 250],
  ["breed", "A new generation", "breeds", 1, 500],
  ["evolve", "Growing together", "evolutions", 1, 1000],
  ["contract", "The master’s trust", "contracts", 1, 750],
  ["dungeon", "Beyond the threshold", "dungeons", 1, 2000],
  ["raid", "Against the impossible", "raids", 1, 10000],
  ["collection", "A living archive", "families", 10, 1500],
  ["perfect", "Six perfect notes", "perfect", 1, 3000],
  ["variant", "A different light", "variants", 1, 2000],
  ["artisan", "Patient hands", "cycles", 1000, 4000],
  ["veteran", "A thousand victories", "wins", 1000, 5000],
  ["enhance", "Forged through ten", "enhance10", 1, 1500],
] as const;
