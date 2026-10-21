import React, { useEffect, useState } from "react";
import {
  Egg,
  Leaf,
  Hammer,
  TreePine,
  Pickaxe,
  Fish,
  FlaskConical,
  CookingPot,
  Scissors,
  Home,
  Heart,
  ArrowUpRight,
  Plus,
  X,
  Play,
  Pause,
  Users,
  Clock,
  Swords,
  Check,
} from "lucide-react";
import { Save, Skill, SKILLS, Creature } from "./model";
import {
  FAMILY,
  ACTIVITIES,
  ACTIVITY,
  MATERIALS,
  FACILITIES,
  FACILITY_INFO,
  JOURNAL,
  ENCOUNTER,
} from "./content";
import * as E from "./engine";
import { Sigil } from "./portraits";
type Act = (fn: (s: Save) => void) => void;
const icons = {
  Woodcutting: TreePine,
  Mining: Pickaxe,
  Fishing: Fish,
  Foraging: Leaf,
  Cooking: CookingPot,
  Smithing: Hammer,
  Crafting: Scissors,
  Alchemy: FlaskConical,
  Slayer: Swords,
};
const place: Record<string, string> = {
  Woodcutting: "Woodland",
  Mining: "Quarry",
  Fishing: "Quiet pond",
  Foraging: "Wild garden",
  Cooking: "Kitchen",
  Smithing: "Forge",
  Crafting: "Workshop",
  Alchemy: "Apothecary",
};
const cName = (c: Creature) => c.name || FAMILY[c.family].names[c.stage - 1];
const mat = (id: string) => MATERIALS[id] || id;
const time = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return sec >= 3600
    ? `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
    : sec >= 60
      ? `${Math.floor(sec / 60)}m ${sec % 60}s`
      : `${sec}s`;
};
function Cost({ s, cost }: { s: Save; cost: Record<string, any> }) {
  return (
    <span className="farm-cost">
      {Object.entries(cost).map(([id, n]) => (
        <span className={E.amount(s, id).gte(n) ? "enough" : "short"} key={id}>
          {E.fmt(n)} {id === "gold" ? "gold" : mat(id)}
        </span>
      ))}
    </span>
  );
}

export function FarmScene({ s, go }: { s: Save; go: (page: string) => void }) {
  const working = E.workStations(s).filter((j) => j.job).length,
    ready = s.incubators.filter((i) => i.egg && i.finish <= s.time).length;
  const residents = [
    ...s.creatures.filter((c) => E.farmWorkers(s).includes(c.id)),
    ...s.creatures.filter((c) => E.free(s, c)),
  ].slice(0, 7);
  return (
    <div className="homestead-scene" aria-label="Your creature farm">
      <svg
        viewBox="0 0 900 430"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="farm-sky" x2="0" y2="1">
            <stop stopColor="#d5eadc" />
            <stop offset="1" stopColor="#f5efc9" />
          </linearGradient>
          <linearGradient id="farm-grass" x2="0" y2="1">
            <stop stopColor="#b9cd8c" />
            <stop offset="1" stopColor="#8bac75" />
          </linearGradient>
          <pattern
            id="farm-dots"
            width="45"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M12 24l2-5 3 5m16 10 1-3 2 3"
              stroke="#6d965c"
              fill="none"
              opacity=".4"
            />
          </pattern>
        </defs>
        <path fill="url(#farm-sky)" d="M0 0h900v430H0z" />
        <circle cx="730" cy="64" r="38" fill="#fff4c6" />
        <path d="M0 115Q160 25 330 100T650 90T900 80V430H0Z" fill="#a8c39b" />
        <path
          d="M0 165Q150 90 350 138T680 135T900 110V430H0Z"
          fill="url(#farm-grass)"
        />
        <path d="M0 165h900v265H0z" fill="url(#farm-dots)" />
        <path
          d="M460 430Q440 330 480 259T482 166M472 294Q330 233 208 240M473 285Q606 246 731 228M474 312Q390 349 294 345M486 315Q580 352 701 360"
          stroke="#e6d2a5"
          strokeWidth="25"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M460 430Q440 330 480 259T482 166"
          stroke="#f3e2bd"
          strokeWidth="14"
          fill="none"
        />
        <ellipse cx="220" cy="348" rx="119" ry="49" fill="#719d8b" />
        <ellipse cx="218" cy="343" rx="108" ry="40" fill="#a9d7c5" />
        <path
          d="M153 346q35-7 67 0m-35 13q37-7 69-1"
          stroke="#d5ece0"
          strokeWidth="3"
          fill="none"
        />
        <g transform="translate(620 303)">
          <path d="M0 20h170l-22 70H-20z" fill="#8d7456" />
          {[0, 1, 2].map((n) => (
            <g key={n} transform={`translate(${n * 46} 0)`}>
              <path d="M6 29l-12 51" stroke="#b69a69" strokeWidth="11" />
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={`M${2 - k * 5} ${40 + k * 14}q-15-15-17-2 3 13 14 9 17 1 16-9-2-11-13 2Z`}
                  fill={n === 1 ? "#d4b86d" : "#7baf65"}
                />
              ))}
            </g>
          ))}
        </g>
        <g transform="translate(125 156)">
          <path d="M0 35h132v75H0z" fill="#ead9af" />
          <path d="M-13 39 65-16l81 55Z" fill="#93735a" />
          <path d="M46 110V61h40v49" fill="#a7805b" />
          <path d="M12 58h21v23H12zm87 0h21v23H99z" fill="#a9c9b5" />
          <path d="M26 16v-35h19v23" fill="#bdaf88" />
        </g>
        <g transform="translate(410 100)">
          <path d="M0 42h140v89H0z" fill="#f3e2b8" />
          <path d="M-14 46 70-12l84 58Z" fill="#ad765e" />
          <path d="M49 131V78a21 21 0 0142 0v53" fill="#89a78a" />
          <path d="M12 69h23v27H12zm94 0h23v27h-23z" fill="#c3d6ad" />
          <path d="M46 18h48" stroke="#eac29a" strokeWidth="5" />
        </g>
        <g transform="translate(665 146)">
          <path d="M0 47h135v78H0z" fill="#d7c5a0" />
          <path d="M-12 48 67-7l80 55Z" fill="#6e8c75" />
          <path d="M18 125V72h43v53" fill="#a07e57" />
          <path d="M83 66h31v29H83z" fill="#edc97c" />
          <path d="M91 8v-42h22v56" fill="#9e957a" />
          <path
            className="farm-chimney"
            d="M103-39q-17-18 0-28t0-24"
            stroke="#f5efdb"
            strokeWidth="12"
            fill="none"
            opacity=".65"
          />
        </g>
        {[
          [-5, 84],
          [58, 116],
          [823, 112],
          [886, 69],
          [350, 74],
          [36, 294],
          [848, 300],
        ].map(([x, y], n) => (
          <g key={n} transform={`translate(${x} ${y})`}>
            <path d="M0 25v68" stroke="#8e8057" strokeWidth="10" />
            <ellipse
              cy="10"
              rx="31"
              ry="43"
              fill={n % 2 ? "#6f9877" : "#84a279"}
            />
            <ellipse cx="-14" cy="25" rx="23" ry="29" fill="#8dad7e" />
          </g>
        ))}
        {[75, 105, 135, 165, 195, 225].map((x) => (
          <g key={x}>
            <path
              d={`M${x} 287v-23m0 9h30`}
              stroke="#eee2bf"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        ))}
        {[360, 570, 595, 387, 815, 94].map((x, n) => (
          <g key={x} transform={`translate(${x} ${345 + (n % 3) * 21})`}>
            <path d="M0 8V0" stroke="#758d58" strokeWidth="2" />
            <circle cy="-2" r="4" fill={n % 2 ? "#eddfad" : "#f7e6cb"} />
          </g>
        ))}
      </svg>
      <button
        className="farm-location nursery-pin"
        onClick={() => go("Farm:Hatchery")}
      >
        <Egg size={15} />
        <span>
          Nursery
          <small>
            {ready
              ? `${ready} ready to hatch`
              : `${s.incubators.filter((i) => i.egg).length}/${s.incubators.length} nests warm`}
          </small>
        </span>
        {ready > 0 && <b>{ready}</b>}
      </button>
      <button
        className="farm-location pasture-pin"
        onClick={() => go("Creatures")}
      >
        <Heart size={15} />
        <span>
          Pasture
          <small>
            {s.creatures.length}/{E.capacity(s)} companions
          </small>
        </span>
      </button>
      <button
        className="farm-location workshop-pin"
        onClick={() => go("Skills")}
      >
        <Hammer size={15} />
        <span>
          Work areas
          <small>
            {working} {working === 1 ? "task" : "tasks"} running
          </small>
        </span>
      </button>
      <button
        className="farm-location pond-pin"
        onClick={() => go("Skills:Fishing")}
      >
        <Fish size={15} />
        <span>Quiet pond</span>
      </button>
      <button
        className="farm-location garden-pin"
        onClick={() => go("Skills:Foraging")}
      >
        <Leaf size={15} />
        <span>Wild garden</span>
      </button>
      {residents.map((c, n) => (
        <button
          className={`farm-resident resident-${n}`}
          key={c.id}
          aria-label={`${cName(c)} at the farm`}
          onClick={() =>
            go(E.farmWorkers(s).includes(c.id) ? "Skills" : "Creatures")
          }
        >
          <Sigil
            family={c.family}
            stage={c.stage}
            color={c.color}
            effect={c.effect}
          />
        </button>
      ))}
    </div>
  );
}

export function FarmHome({
  s,
  act,
  go,
}: {
  s: Save;
  act: Act;
  go: (p: string) => void;
}) {
  const posts = E.workStations(s),
    running = posts.filter((j) => j.job),
    ready = s.incubators.filter((i) => i.egg && i.finish <= s.time),
    warm = s.incubators.filter((i) => i.egg),
    spare = s.creatures.filter((c) => E.free(s, c));
  const next = JOURNAL.find(
    (j) => !s.claims.includes(j[0]) && (s.metrics[j[2]] || 0) >= j[3],
  );
  return (
    <div className="farm-home dashboard">
      <div className="farm-greeting">
        <div>
          <span className="eyebrow">A LITTLE PLACE TO GROW</span>
          <h2>Your creature farm</h2>
          <p>Gather, make, hatch. A home for every companion.</p>
        </div>
        <span className="offline-tag">
          <Clock size={13} />
          12h offline
        </span>
      </div>
      <FarmScene s={s} go={go} />
      <div className="farm-pulse">
        <button onClick={() => go("Skills")}>
          <Hammer size={17} />
          <strong>
            {running.length}/{posts.length}
          </strong>
          <span>work areas busy</span>
        </button>
        <button onClick={() => go("Farm:Hatchery")}>
          <Egg size={17} />
          <strong>{s.eggs.length}</strong>
          <span>eggs in storage</span>
        </button>
        <button onClick={() => go("Creatures")}>
          <Users size={17} />
          <strong>{spare.length}</strong>
          <span>free companions</span>
        </button>
      </div>
      {s.creatures.length > 0 && !s.claims.includes("farm-welcome") && (
        <section className="welcome-basket">
          <div>
            <span className="eyebrow">SETTLE IN</span>
            <h3>A basket for your new farm</h3>
            <p>
              Pebbit and Sporel eggs, plus a second nest if you need one. More
              little helpers to get things growing.
            </p>
          </div>
          <button onClick={() => act(E.welcomeFarm)}>
            Open welcome basket
          </button>
        </section>
      )}
      <section className="farm-section">
        <div className="farm-section-title">
          <h3>Today at the farm</h3>
          <span>Everything keeps its own rhythm</span>
        </div>
        {!s.creatures.length && warm.length > 0 && (
          <div className="farm-notice">
            <Egg />
            <div>
              <strong>
                {ready.length
                  ? "Your first companion is ready"
                  : "Your first companion is on the way"}
              </strong>
              <p>
                {ready.length
                  ? "One hatch starts your farm."
                  : `${time(warm[0].finish - s.time)} until you can meet them.`}
              </p>
            </div>
            <button
              disabled={!ready.length}
              onClick={() => act((v) => E.hatch(v, ready[0].id))}
            >
              Hatch
            </button>
          </div>
        )}
        <div className="farm-today-grid">
          <article className="farm-note">
            <span className="eyebrow">NURSERY</span>
            <h3>
              {ready.length
                ? `${ready.length} new friends ready`
                : warm.length
                  ? `${warm.length} eggs keeping warm`
                  : "A warm nest is waiting"}
            </h3>
            <p>
              {ready.length
                ? "Hatch them together, then give them a home or a job."
                : warm.length
                  ? `${time(Math.min(...warm.map((i) => i.finish)) - s.time)} to the next hatch`
                  : "Five minutes per egg. Choose a stack and fill your nests."}
            </p>
            <button className="secondary" onClick={() => go("Farm:Hatchery")}>
              Visit nursery <ArrowUpRight size={14} />
            </button>
          </article>
          <article className="farm-note">
            <span className="eyebrow">WORK AREAS</span>
            <h3>
              {running.length
                ? `${running.length} ${running.length === 1 ? "task" : "tasks"} growing your farm`
                : spare.length
                  ? "A little help goes a long way"
                  : "Make room for your next helper"}
            </h3>
            <p>
              {running.length
                ? running.map((p) => ACTIVITY[p.job!.activity].name).join(" · ")
                : "Put one helper on timber, another on ore. Your kitchen and forge can work alongside them."}
            </p>
            <button className="secondary" onClick={() => go("Skills")}>
              {running.length ? "Manage tasks" : "Set up a task"}{" "}
              <ArrowUpRight size={14} />
            </button>
          </article>
        </div>
      </section>
      <section className="farm-section">
        <div className="farm-section-title">
          <h3>Make it your own</h3>
          <button className="text-button" onClick={() => go("Farm:Buildings")}>
            All buildings <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="farm-goals">
          {["Housing", "Hatchery", "Workshop"].map((k) => (
            <button
              key={k}
              className="farm-goal"
              onClick={() => go("Farm:Buildings")}
            >
              <span>
                {k === "Housing" ? (
                  <Home />
                ) : k === "Hatchery" ? (
                  <Egg />
                ) : (
                  <Hammer />
                )}
              </span>
              <div>
                <strong>
                  {k === "Housing"
                    ? "Room to roam"
                    : k === "Hatchery"
                      ? "A warmer nursery"
                      : "More helping hands"}
                </strong>
                <small>
                  {k === "Housing"
                    ? `${s.creatures.length}/${E.capacity(s)} beds · +10 next level`
                    : k === "Hatchery"
                      ? `${time(E.incubationDuration(s))} eggs · faster next level`
                      : `${posts.length} parallel tasks · ${posts.length < 8 ? "+1 next level" : "fully expanded"}`}
                </small>
              </div>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </section>
      <div className="farm-today-grid">
        <section className="farm-note">
          <span className="eyebrow">BEYOND THE GATE</span>
          <h3>
            {s.combat
              ? ENCOUNTER[s.combat.encounter].name
              : "Adventure brings the farm to life"}
          </h3>
          <p>
            {s.combat
              ? `${s.combat.wins} victories · ${s.combat.defeats ? "Team recovering" : "Team fighting automatically"}`
              : "Find eggs, catalysts and equipment out in the wild."}
          </p>
          <button className="secondary" onClick={() => go("Combat")}>
            {s.combat ? "Watch combat" : "Choose a hunt"} <Swords size={14} />
          </button>
        </section>
        <section className="farm-note">
          <span className="eyebrow">FARM JOURNAL</span>
          <h3>
            {next
              ? "A little milestone to celebrate"
              : "One small goal at a time"}
          </h3>
          <p>
            {next
              ? next[1]
              : "Your journal tracks hatches, work, adventures and building upgrades."}
          </p>
          {next ? (
            <button onClick={() => act((v) => E.claim(v, next[0]))}>
              Claim reward
            </button>
          ) : (
            <button
              className="secondary"
              onClick={() => go("Collection:Journal")}
            >
              Open journal
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export function Nursery({ s, act }: { s: Save; act: Act }) {
  const [query, setQuery] = useState("");
  const stacks = E.eggStacks(s).filter((g) =>
      FAMILY[g.family].names[0].toLowerCase().includes(query.toLowerCase()),
    ),
    ready = s.incubators.filter((i) => i.egg && i.finish <= s.time),
    empty = s.incubators.filter((i) => !i.egg);
  return (
    <div className="nursery-board">
      <header className="farm-greeting">
        <div>
          <span className="eyebrow">THE NURSERY</span>
          <h2>Little beginnings</h2>
          <p>
            {time(E.incubationDuration(s))} per egg · {empty.length} empty nests
            · {s.creatures.length}/{E.capacity(s)} beds
          </p>
        </div>
      </header>
      <div className="nest-toolbar">
        <button
          disabled={!ready.length || s.creatures.length >= E.capacity(s)}
          onClick={() =>
            act((v) => {
              for (const i of v.incubators)
                if (
                  i.egg &&
                  i.finish <= v.time &&
                  v.creatures.length < E.capacity(v)
                )
                  E.hatch(v, i.id);
            })
          }
        >
          Hatch ready ({ready.length})
        </button>
        <button
          className="secondary"
          disabled={!empty.length || !s.eggs.length}
          onClick={() =>
            act((v) => {
              for (const i of v.incubators)
                if (!i.egg && v.eggs.length)
                  E.loadEgg(
                    v,
                    i.id,
                    [...v.eggs].sort((a, b) => a.created - b.created)[0].id,
                  );
            })
          }
        >
          Fill empty nests
        </button>
      </div>
      <div className="nest-grid">
        {s.incubators.map((inc, n) => (
          <article
            key={inc.id}
            className={`nest ${inc.egg ? "occupied" : ""} ${inc.egg && inc.finish <= s.time ? "ready" : ""}`}
          >
            <span className="nest-label">NEST {n + 1}</span>
            <div className="nest-art">
              {inc.egg ? (
                <Sigil family={inc.egg.family} size="lg" />
              ) : (
                <Egg size={40} />
              )}
            </div>
            <strong>
              {inc.egg
                ? `${FAMILY[inc.egg.family].names[0]} egg`
                : "Empty nest"}
            </strong>
            <small>
              {inc.egg
                ? inc.finish <= s.time
                  ? "Ready to hatch"
                  : `${time(inc.finish - s.time)} remaining`
                : "Choose a stack below"}
            </small>
            {inc.egg && (
              <>
                <progress
                  max={1}
                  value={Math.max(
                    0,
                    Math.min(
                      1,
                      1 - (inc.finish - s.time) / E.incubationDuration(s),
                    ),
                  )}
                />
                <button
                  disabled={
                    inc.finish > s.time || s.creatures.length >= E.capacity(s)
                  }
                  onClick={() => act((v) => E.hatch(v, inc.id))}
                >
                  Hatch
                </button>
              </>
            )}
          </article>
        ))}
      </div>
      {s.creatures.length >= E.capacity(s) && (
        <p className="farm-warning">
          The pasture is full. Upgrade Housing before hatching more companions.
        </p>
      )}
      <section className="egg-storage">
        <div className="farm-section-title">
          <h3>
            Egg pantry{" "}
            <span>
              {s.eggs.length} eggs · {E.eggStacks(s).length} families
            </span>
          </h3>
          <input
            aria-label="Search egg stacks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find an egg…"
          />
        </div>
        <p>
          Each stack keeps every egg’s original IVs and appearance rolls. Oldest
          eggs load first.
        </p>
        <div className="egg-stacks">
          {stacks.map((g) => (
            <article className="egg-stack" key={g.family}>
              <div className="egg-stack-art">
                <Sigil family={g.family} />
                <Egg size={14} />
              </div>
              <div>
                <strong>
                  {FAMILY[g.family].names[0]} egg <b>×{g.count}</b>
                </strong>
                <small>{FAMILY[g.family].element}</small>
              </div>
              <button
                className="secondary"
                disabled={!empty.length}
                onClick={() => act((v) => E.loadEggFamily(v, g.family))}
              >
                Load
              </button>
              {empty.length > 1 && g.count > 1 && (
                <button
                  className="text-button"
                  onClick={() => act((v) => E.loadEggFamily(v, g.family, true))}
                >
                  Fill nests
                </button>
              )}
            </article>
          ))}
        </div>
        {!stacks.length && (
          <div className="farm-empty">
            <Egg />
            <h3>
              {query
                ? "No matching eggs"
                : "Your pantry is ready for more eggs"}
            </h3>
            <p>Hunts, foraging and breeding bring eggs home.</p>
          </div>
        )}
      </section>
      <details className="farm-advanced">
        <summary>Nursery automation & expansion</summary>
        <p>
          Automation unlocks as your nursery grows. Five-minute base incubation
          improves with each Hatchery level.
        </p>
        <div className="button-row">
          <label>
            <input
              type="checkbox"
              disabled={s.facilities.Hatchery < 2}
              checked={s.autoHatch}
              onChange={() =>
                act((v) => {
                  v.autoHatch = !v.autoHatch;
                })
              }
            />
            Auto-hatch · Hatchery 2
          </label>
          <label>
            <input
              type="checkbox"
              disabled={s.facilities.Hatchery < 4}
              checked={s.autoLoad}
              onChange={() =>
                act((v) => {
                  v.autoLoad = !v.autoLoad;
                })
              }
            />
            Auto-load · Hatchery 4
          </label>
        </div>
        <label>
          Load preference
          <select
            aria-label="Egg selection policy"
            disabled={s.facilities.Hatchery < 6}
            value={s.hatchPolicy}
            onChange={(e) =>
              act((v) => {
                v.hatchPolicy = e.target.value;
              })
            }
          >
            <option value="oldest">Oldest egg</option>
            <option value="perfect">Highest total IV</option>
            <option value="rare">Rare appearances first</option>
            {E.eggStacks(s).map((g) => (
              <option key={g.family} value={"family:" + g.family}>
                {FAMILY[g.family].names[0]} only
              </option>
            ))}
          </select>
        </label>
        <h3>Add another nest</h3>
        <Cost s={s} cost={E.incubatorCost(s)} />
        <button
          className="secondary"
          disabled={!E.canPay(s, E.incubatorCost(s))}
          onClick={() => act(E.buildIncubator)}
        >
          Build nest
        </button>
      </details>
    </div>
  );
}

export function WorkBoard({
  s,
  act,
  focus,
  go,
  onWorkflow,
}: {
  s: Save;
  act: Act;
  focus?: string;
  go: (p: string) => void;
  onWorkflow: () => void;
}) {
  const [selected, setSelected] = useState(0),
    [skill, setSkill] = useState<Skill>("Woodcutting"),
    [aid, setAid] = useState("g0-0"),
    [crew, setCrew] = useState(false);
  const stations = E.workStations(s),
    post = stations[selected] || stations[0],
    view = E.stationView(s, selected),
    active = post.job ? ACTIVITY[post.job.activity] : null;
  const choose = (skill: Skill) => {
    setSkill(skill);
    const a = ACTIVITIES.find((a) => a.skill === skill);
    if (a) setAid(a.id);
  };
  useEffect(() => {
    if (focus && SKILLS.includes(focus as Skill) && focus !== "Slayer") {
      const index = E.workStations(s).findIndex(
        (p) =>
          (p.job || p.activity) &&
          ACTIVITY[p.job?.activity || p.activity!]?.skill === focus,
      );
      setSelected(
        index >= 0
          ? index
          : Math.max(
              0,
              E.workStations(s).findIndex((p) => !p.job && !p.team.length),
            ),
      );
      choose(focus as Skill);
    }
  }, [focus]);
  const select = (n: number) => {
    setSelected(n);
    const p = stations[n],
      a = ACTIVITY[p.job?.activity || p.activity || ""];
    if (a) {
      setSkill(a.skill);
      setAid(a.id);
    }
  };
  const activity = ACTIVITY[aid],
    seconds = E.farmTaskDuration(s, selected, aid),
    available = s.creatures.filter((c) => E.free(s, c));
  const start = () =>
    act((v) => {
      if (!E.workStations(v)[selected].team.length) {
        const candidates = v.creatures
          .filter((c) => E.free(v, c))
          .sort(
            (a, b) =>
              FAMILY[b.family].aptitudes[skill] -
              FAMILY[a.family].aptitudes[skill],
          );
        if (!candidates.length)
          throw Error(
            "Hatch a helper or free a creature from another assignment first.",
          );
        E.assignFarm(v, selected, candidates[0].id);
      }
      E.startFarmTask(v, selected, aid);
    });
  return (
    <div className="work-board">
      <header className="farm-greeting">
        <div>
          <span className="eyebrow">MANY HANDS, A HAPPY HOME</span>
          <h2>Work around the farm</h2>
          <p>
            Run different tasks together. Each companion has one job; every task
            gets its own crew.
          </p>
        </div>
      </header>
      <div className="work-summary">
        <strong>
          {stations.filter((p) => p.job).length}/{stations.length} tasks running
        </strong>
        <span>{available.length} helpers free</span>
        <button className="text-button" onClick={() => go("Farm:Buildings")}>
          Expand workshop <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="work-stations">
        {stations.map((p, n) => {
          const a = ACTIVITY[p.job?.activity || p.activity || ""],
            Icon = a ? icons[a.skill] : Plus;
          return (
            <button
              key={n}
              className={`work-station ${n === selected ? "selected" : ""}`}
              onClick={() => select(n)}
              aria-label={`Manage work station ${n + 1}`}
            >
              <div className="station-icon">
                <Icon size={23} />
              </div>
              <div>
                <small>
                  WORK AREA {n + 1}
                  {p.job ? " · BUSY" : ""}
                </small>
                <strong>{a ? place[a.skill] : "A place for a helper"}</strong>
                <span>
                  {a
                    ? `${a.name} · ${p.job ? time(p.job.finish - s.time) : "Paused"}`
                    : "Choose a task to start"}
                </span>
              </div>
              <div className="station-crew">
                {p.team.slice(0, 2).map((id) => {
                  const c = s.creatures.find((c) => c.id === id)!;
                  return <Sigil key={id} family={c.family} stage={c.stage} />;
                })}
                {!p.team.length && <Plus size={16} />}
              </div>
              {p.job && (
                <progress
                  max={1}
                  value={Math.max(
                    0,
                    1 -
                      (p.job.finish - s.time) /
                        (E.farmTaskDuration(s, n, p.job.activity) * 1000),
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      <section className="task-workbench">
        <div className="farm-section-title">
          <h3>
            {active
              ? `${place[active.skill]} · ${active.name}`
              : `Set up work area ${selected + 1}`}
          </h3>
          {post.job && (
            <span className="working-dot">
              {post.activity ? "Repeating" : "Finishing cycle"}
            </span>
          )}
        </div>
        <div className="farm-xp">
          <span>
            {active?.skill || skill} · Lv{" "}
            {s.skills[active?.skill || skill].level}
            <small>
              {E.fmt(s.skills[active?.skill || skill].xp)} /{" "}
              {E.fmt(E.xpNext(s.skills[active?.skill || skill].level))} XP
            </small>
          </span>
          <progress
            max={1}
            value={E.D(s.skills[active?.skill || skill].xp)
              .div(E.xpNext(s.skills[active?.skill || skill].level))
              .toNumber()}
          />
        </div>
        <div className="task-crew">
          <div className="task-portraits">
            {post.team.map((id) => {
              const c = s.creatures.find((c) => c.id === id)!;
              return (
                <span key={id} title={cName(c)}>
                  <Sigil family={c.family} stage={c.stage} />
                  <small>{cName(c)}</small>
                </span>
              );
            })}
            {!post.team.length && (
              <p>A free helper will join when you start.</p>
            )}
          </div>
          <button className="secondary" onClick={() => setCrew(true)}>
            <Users size={15} />
            {post.team.length ? "Edit helpers" : "Choose helpers"}
          </button>
        </div>
        {post.job && (
          <div className="running-task">
            <span>
              <strong>{time(post.job.finish - s.time)}</strong> to next output ·{" "}
              {Object.entries(active!.outputs)
                .map(
                  ([id, n]) =>
                    `${n} ${mat(id)} (${E.fmt(E.amount(s, id))} stored)`,
                )
                .join(", ")}
            </span>
            <button
              className="secondary"
              disabled={!post.activity}
              onClick={() => act((v) => E.pauseFarmTask(v, selected))}
            >
              <Pause size={14} />
              {post.activity ? "Pause task" : "Finishing…"}
            </button>
          </div>
        )}
        {!post.job && (
          <>
            <div className="skill-pills" aria-label="Farm task skills">
              {SKILLS.filter((k) => k !== "Slayer").map((k) => {
                const Icon = icons[k];
                return (
                  <button
                    key={k}
                    className={skill === k ? "active" : ""}
                    onClick={() => choose(k)}
                  >
                    <Icon size={17} />
                    <span>{k}</span>
                  </button>
                );
              })}
            </div>
            <div className="task-picker">
              <label>
                What should they work on?
                <select
                  aria-label="Farm activity"
                  value={aid}
                  onChange={(e) => setAid(e.target.value)}
                >
                  {ACTIVITIES.filter((a) => a.skill === skill).map((a) => (
                    <option
                      disabled={s.skills[skill].level < a.level}
                      value={a.id}
                      key={a.id}
                    >
                      {a.name} · Lv {a.level}
                      {s.skills[skill].level < a.level ? " (locked)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <span className="task-skill-level">
                {skill} level {s.skills[skill].level}
                <small>Mastery {s.mastery[aid]?.level || 1}</small>
              </span>
            </div>
            <div className="task-flow">
              {Object.keys(activity.inputs).length > 0 ? (
                <div>
                  <small>USES EACH CYCLE</small>
                  {Object.entries(activity.inputs).map(([id, n]) => (
                    <span
                      className={E.amount(s, id).gte(n) ? "" : "short"}
                      key={id}
                    >
                      {n} {mat(id)}{" "}
                      <small>({E.fmt(E.amount(s, id))} stored)</small>
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  <small>FROM THE LAND</small>
                  <span>No ingredients needed</span>
                </div>
              )}
              <ArrowUpRight />
              <div>
                <small>BRINGS HOME</small>
                {Object.entries(activity.outputs).map(([id, n]) => (
                  <span key={id}>
                    {n} {mat(id)}
                    <small>
                      About {E.fmt((n * 3600) / seconds)}/h before bonus yields
                    </small>
                  </span>
                ))}
              </div>
            </div>
            <p className="task-benefit">
              {time(seconds * 1000)} per cycle · {activity.xp} skill XP ·{" "}
              {activity.creatureXp} creature XP shared between helpers.
              {skill === "Foraging" &&
                ` Egg discovery: ${(E.foragingEggChance(view, aid) * 100).toFixed(3)}% per cycle.`}
            </p>
            <button
              className="start-farm-task"
              disabled={
                !E.canPay(s, activity.inputs) ||
                (!post.team.length && !available.length)
              }
              onClick={start}
            >
              <Play size={16} />
              {!E.canPay(s, activity.inputs)
                ? "Gather the missing ingredients"
                : !post.team.length && !available.length
                  ? "A free helper is needed"
                  : `Start ${activity.name}`}
            </button>
          </>
        )}
      </section>
      <div className="farm-production-tip">
        <Leaf size={20} />
        <p>
          <strong>Build a little production chain.</strong> One crew mines ore
          while another smelts it. Shared storage connects their work. When
          ingredients run out, production pauses safely; gathering keeps going.
          Restart the recipe when your supplies are ready.
        </p>
      </div>
      <details className="farm-advanced">
        <summary>Skill journal, queues & advanced workflows</summary>
        <p>
          Each task builds its own mastery. Skill milestones permanently improve
          speed. Work area 1 keeps your existing saved loadouts, queue and
          workflows.
        </p>
        <div className="farm-skill-ledger">
          {SKILLS.map((k) => (
            <button
              className="secondary"
              key={k}
              onClick={() => (k === "Slayer" ? go("Slayer") : choose(k))}
            >
              {k} · {s.skills[k].level}
            </button>
          ))}
        </div>
        <button
          className="secondary"
          disabled={s.facilities.Workshop < 6}
          onClick={onWorkflow}
        >
          Edit work area 1 workflows · Workshop 6
        </button>
        <p>
          {s.queue.length
            ? `Area 1 queue: ${s.queue.map((id) => ACTIVITY[id].name).join(" → ")}`
            : "No queued area 1 tasks."}
        </p>
        <label className="queue-picker">
          Add an area 1 task after its next cycle
          <select
            aria-label="Queue an area 1 activity"
            value=""
            disabled={s.facilities.Workshop < 3}
            onChange={(e) => {
              const id = e.target.value;
              if (id)
                act((v) => {
                  v.queue.push(id);
                });
            }}
          >
            <option value="">Choose queued activity · Workshop 3</option>
            {ACTIVITIES.filter((a) => s.skills[a.skill].level >= a.level).map(
              (a) => (
                <option value={a.id} key={a.id}>
                  {a.skill} · {a.name}
                </option>
              ),
            )}
          </select>
        </label>
        {s.queue.length > 0 && (
          <button
            className="text-button"
            onClick={() =>
              act((v) => {
                v.queue = [];
              })
            }
          >
            Clear queue
          </button>
        )}
        <button className="text-button" onClick={() => go("Creatures")}>
          Saved team loadouts
        </button>
      </details>
      {crew && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCrew(false);
          }}
        >
          <section
            className="modal farm-worker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Farm helpers"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close helpers"
              onClick={() => setCrew(false)}
            >
              <X />
            </button>
            <h2>Helpers for work area {selected + 1}</h2>
            <p>
              {post.job
                ? "Pause the task and let its reserved cycle finish before changing helpers."
                : `Choose up to six. ${skill} aptitude improves speed and bonus yields.`}
            </p>
            {[...s.creatures]
              .sort(
                (a, b) =>
                  Number(post.team.includes(b.id)) -
                    Number(post.team.includes(a.id)) ||
                  FAMILY[b.family].aptitudes[skill] -
                    FAMILY[a.family].aptitudes[skill],
              )
              .map((c) => {
                const own = post.team.includes(c.id),
                  free = E.free(s, c);
                return (
                  <button
                    className={`helper-row ${own ? "selected" : ""}`}
                    key={c.id}
                    disabled={
                      !!post.job ||
                      (!own && !free) ||
                      (!own && post.team.length >= 6)
                    }
                    onClick={() => act((v) => E.assignFarm(v, selected, c.id))}
                  >
                    <Sigil family={c.family} stage={c.stage} />
                    <span>
                      <strong>{cName(c)}</strong>
                      <small>
                        {own
                          ? "Assigned here"
                          : free
                            ? "Available"
                            : s.combatTeam.includes(c.id)
                              ? "Combat"
                              : E.farmWorkers(s).includes(c.id)
                                ? "Another farm task"
                                : "Breeding or recovering"}{" "}
                        · Lv {c.level}
                      </small>
                    </span>
                    <span>{FAMILY[c.family].aptitudes[skill]} aptitude</span>
                    {own ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                );
              })}
            {!s.creatures.length && (
              <p>Hatch your first companion to get started.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
