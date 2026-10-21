import React, { useState } from "react";
import {
  Activity,
  Box,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Egg,
  FlaskConical,
  Fish,
  Flame,
  Hammer,
  Heart,
  Home,
  Layers,
  Leaf,
  Menu,
  Mountain,
  Package,
  Pickaxe,
  Play,
  Pause,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Skull,
  Scissors,
  Swords,
  TreePine,
  Users,
  Waves,
  X,
  Zap,
  CookingPot,
} from "lucide-react";
import { Save, Skill, SKILLS, Creature } from "./model";
import {
  ACTIVITIES,
  ACTIVITY,
  FAMILY,
  FACILITIES,
  FACILITY_INFO,
  MATERIALS,
  JOURNAL,
  ENCOUNTER,
} from "./content";
import * as E from "./engine";
import { Sigil } from "./portraits";
type Act = (fn: (s: Save) => void) => void;
export const SKILL_ICONS = {
  Woodcutting: TreePine,
  Mining: Pickaxe,
  Fishing: Fish,
  Foraging: Leaf,
  Cooking: CookingPot,
  Smithing: Hammer,
  Crafting: Scissors,
  Alchemy: FlaskConical,
  Slayer: Skull,
};
export const RESOURCE_GROUPS = [
  "All",
  "Gathering",
  "Production",
  "Combat",
] as const;
const unit = (n: number) => (n < 1 ? `${n.toFixed(2)}` : E.fmt(n, 1));
const resource = (id: string) => MATERIALS[id] || id;
const duration = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return sec >= 3600
    ? `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
    : sec >= 60
      ? `${Math.floor(sec / 60)}m ${sec % 60}s`
      : `${sec}s`;
};
const name = (c: Creature) => c.name || FAMILY[c.family].names[c.stage - 1];
export function ResourceIcon({ id }: { id: string }) {
  const group = /^g([0-3])-/.exec(id),
    icons = [TreePine, Pickaxe, Fish, Leaf];
  const Icon = group
    ? icons[Number(group[1])]
    : id === "gold"
      ? Coins
      : id === "ration"
        ? CookingPot
        : id === "potion"
          ? FlaskConical
          : id === "catalyst"
            ? Zap
            : id === "relic"
              ? Shield
              : id.includes("thread") || id.includes("inherit")
                ? Scissors
                : id.startsWith("refined")
                  ? Hammer
                  : Package;
  return (
    <span className={`resource-icon resource-${group ? group[1] : "crafted"}`}>
      <Icon size={23} />
    </span>
  );
}
const LINKS = [
  ["Home", Home],
  ["Combat", Swords],
  ["Creatures", Users],
  ["Farm", Home],
  ["Bank", Package],
  ["Equipment", Shield],
  ["Slayer", Skull],
  ["Collection", BookOpen],
  ["Shop", ShoppingBag],
  ["Settings", Settings],
] as const;
export function IdleNavigation({
  s,
  page,
  go,
}: {
  s: Save;
  page: string;
  go: (p: string) => void;
}) {
  const primary = ["Home", "Combat", "Creatures", "Farm", "Bank"];
  return (
    <div className="idle-nav-groups">
      <div className="idle-nav-heading">ADVENTURE</div>
      {LINKS.filter(([p]) => primary.includes(p)).map(([p, Icon]) => (
        <button
          key={p}
          aria-label={p}
          aria-current={page === p ? "page" : undefined}
          className={page === p ? "active" : ""}
          onClick={() => go(p)}
        >
          <Icon size={16} />
          <span>{p === "Home" ? "Overview" : p}</span>
          {p === "Bank" && (
            <small>
              {Object.values(s.inventory).filter((n) => E.D(n).gt(0)).length}
            </small>
          )}
          {p === "Farm" &&
            s.incubators.some((i) => i.egg && i.finish <= s.time) && (
              <i className="idle-active-dot" />
            )}
        </button>
      ))}
      <div className="idle-nav-heading">NON-COMBAT SKILLS</div>
      {SKILLS.filter((k) => k !== "Slayer").map((k) => {
        const Icon = SKILL_ICONS[k],
          working = E.workStations(s).some(
            (p) => p.job && ACTIVITY[p.job.activity].skill === k,
          );
        return (
          <button
            aria-label={k}
            className={`nav-skill ${working ? "training" : ""}`}
            key={k}
            onClick={() => go("Skills:" + k)}
          >
            <Icon size={16} />
            <span>{k}</span>
            {working && <i className="idle-active-dot" />}
            <small>{s.skills[k].level}</small>
            <progress
              aria-label={`${k} experience`}
              max={1}
              value={E.D(s.skills[k].xp)
                .div(E.xpNext(s.skills[k].level))
                .toNumber()}
            />
          </button>
        );
      })}
      <div className="idle-nav-heading">MANAGEMENT</div>
      {LINKS.filter(([p]) => !primary.includes(p)).map(([p, Icon]) => (
        <button
          key={p}
          aria-label={p}
          aria-current={page === p ? "page" : undefined}
          className={page === p ? "active" : ""}
          onClick={() => go(p)}
        >
          <Icon size={16} />
          <span>{p}</span>
          {p === "Slayer" && <small>{s.skills.Slayer.level}</small>}
        </button>
      ))}
    </div>
  );
}
export function MobileMenu({
  s,
  page,
  go,
}: {
  s: Save;
  page: string;
  go: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="mobile-menu-toggle icon-button"
        aria-label="Open game menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>
      {open && (
        <div
          className="modal-backdrop navigation-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            className="mobile-game-menu modal"
            role="dialog"
            aria-modal="true"
            aria-label="Game menu"
          >
            <div className="menu-title">
              <strong>CREATURE ADVENTURE</strong>
              <button
                className="modal-close icon-button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <IdleNavigation
              s={s}
              page={page}
              go={(p) => {
                go(p);
                setOpen(false);
              }}
            />
          </section>
        </div>
      )}
    </>
  );
}
export function IdleStatus({ s, go }: { s: Save; go: (p: string) => void }) {
  const posts = E.workStations(s).filter((p) => p.job),
    next = s.incubators
      .filter((i) => i.egg)
      .sort((a, b) => a.finish - b.finish)[0];
  return (
    <div className="idle-status-bar">
      <button onClick={() => go("Combat")}>
        <Swords size={14} />
        <span>
          {s.combat
            ? `${ENCOUNTER[s.combat.encounter].name} · ${s.combat.defeats ? "Defeated" : s.combat.wins + " wins"}`
            : "Combat idle"}
        </span>
      </button>
      <button onClick={() => go("Skills")}>
        <Activity size={14} />
        <span>{posts.length} active tasks</span>
      </button>
      <button onClick={() => go("Farm:Hatchery")}>
        <Egg size={14} />
        <span>
          {next
            ? next.finish <= s.time
              ? "Egg ready"
              : duration(next.finish - s.time)
            : "Nursery idle"}
        </span>
      </button>
      <span className="status-offline">
        <Clock size={13} />
        12h offline cap
      </span>
    </div>
  );
}
export function IdleDashboard({
  s,
  act,
  go,
}: {
  s: Save;
  act: Act;
  go: (p: string) => void;
}) {
  const posts = E.workStations(s),
    ready = s.incubators.filter((i) => i.egg && i.finish <= s.time),
    first = s.incubators.find((i) => i.egg),
    claim = JOURNAL.find(
      (j) => !s.claims.includes(j[0]) && (s.metrics[j[2]] || 0) >= j[3],
    );
  return (
    <div className="idle-dashboard dashboard">
      <div className="idle-page-heading">
        <div>
          <span className="eyebrow">CREATURE ADVENTURE</span>
          <h2>Account overview</h2>
        </div>
        <span className="idle-pill">12-hour offline progress</span>
      </div>
      {!s.creatures.length && first && (
        <div className="idle-callout">
          <Egg />
          <div>
            <strong>
              {ready.length
                ? "Starter ready to hatch"
                : "Incubating your starter"}
            </strong>
            <span>
              {ready.length
                ? "Hatch your first companion to unlock combat and farm work."
                : duration(first.finish - s.time) + " remaining"}
            </span>
          </div>
          <button
            disabled={!ready.length}
            onClick={() => act((v) => E.hatch(v, ready[0].id))}
          >
            Hatch
          </button>
        </div>
      )}
      {s.creatures.length > 0 && !s.claims.includes("farm-welcome") && (
        <div className="idle-callout">
          <Package />
          <div>
            <strong>Farm supplies available</strong>
            <span>
              Two helper eggs and a second nest if needed. Claimed once.
            </span>
          </div>
          <button onClick={() => act(E.welcomeFarm)}>Claim supplies</button>
        </div>
      )}
      <div className="account-metrics">
        {[
          ["Creatures", s.creatures.length, "Creatures"],
          ["Forms", `${s.discovered.length}/150`, "Collection"],
          ["Eggs", s.eggs.length, "Farm:Hatchery"],
          ["Equipment", s.items.length, "Equipment"],
        ].map(([label, value, p]) => (
          <button key={label} onClick={() => go(String(p))}>
            <small>{label}</small>
            <strong>{value}</strong>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
      <div className="idle-dashboard-columns">
        <section className="idle-panel">
          <header>
            <Activity size={16} />
            <h3>Active activities</h3>
            <button className="text-button" onClick={() => go("Skills")}>
              Manage
            </button>
          </header>
          <div className="compact-activity-row">
            <Swords size={18} />
            <div>
              <strong>
                {s.combat
                  ? ENCOUNTER[s.combat.encounter].name
                  : "No combat encounter"}
              </strong>
              <small>
                {s.combat
                  ? `${s.combat.wins} wins · ${s.combat.defeats ? "Defeated" : "Auto combat"}`
                  : "Choose an enemy to hunt for materials and rare drops."}
              </small>
            </div>
            <button className="secondary small" onClick={() => go("Combat")}>
              {s.combat ? "Watch" : "Fight"}
            </button>
          </div>
          {posts.map((p, i) => {
            if (!p.job && !p.team.length) return null;
            const a = p.job ? ACTIVITY[p.job.activity] : null,
              Icon = a ? SKILL_ICONS[a.skill] : Users;
            return (
              <div className="compact-activity-row" key={i}>
                <Icon size={18} />
                <div>
                  <strong>
                    {a ? `${a.skill} — ${a.name}` : `Work area ${i + 1}`}
                  </strong>
                  <small>
                    {a
                      ? `${p.team.length} helpers · ${duration(p.job!.finish - s.time)} · ${Object.entries(
                          a.outputs,
                        )
                          .map(([id, n]) => `${n} ${resource(id)}`)
                          .join(", ")}`
                      : p.team.length
                        ? `${p.team.length} helpers · task paused`
                        : "No helpers assigned"}
                  </small>
                </div>
                <button
                  className="secondary small"
                  onClick={() => go(a ? "Skills:" + a.skill : "Skills")}
                >
                  {a ? "View" : "Assign"}
                </button>
              </div>
            );
          })}
        </section>
        <section className="idle-panel">
          <header>
            <Home size={16} />
            <h3>Farm management</h3>
          </header>
          <div className="ledger-row">
            <span>Housing</span>
            <strong>
              {s.creatures.length}/{E.capacity(s)}
            </strong>
          </div>
          <div className="ledger-row">
            <span>Incubation</span>
            <strong>
              {s.incubators.filter((i) => i.egg).length}/{s.incubators.length}{" "}
              nests
            </strong>
          </div>
          <div className="ledger-row">
            <span>Breeding</span>
            <strong>
              {s.breeding.length}/{s.facilities.Breeding} pairs
            </strong>
          </div>
          <div className="ledger-row">
            <span>Reserved workers</span>
            <strong>{E.farmWorkers(s).length}</strong>
          </div>
          <div className="ledger-row">
            <span>Available workers</span>
            <strong>{s.creatures.filter((c) => E.free(s, c)).length}</strong>
          </div>
          <div className="idle-panel-actions">
            <button className="secondary" onClick={() => go("Farm:Hatchery")}>
              Nursery {ready.length > 0 && `(${ready.length} ready)`}
            </button>
            <button className="secondary" onClick={() => go("Farm:Buildings")}>
              Buildings
            </button>
          </div>
          {claim && (
            <div className="journal-claim">
              <strong>{claim[1]}</strong>
              <button onClick={() => act((v) => E.claim(v, claim[0]))}>
                Claim reward
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="idle-panel">
        <header>
          <Layers size={16} />
          <h3>Skills</h3>
          <span>
            Total level{" "}
            {Object.values(s.skills).reduce((n, k) => n + k.level, 0)}
          </span>
        </header>
        <div className="skill-overview-grid">
          {SKILLS.map((k) => {
            const Icon = SKILL_ICONS[k],
              record = s.skills[k];
            return (
              <button
                key={k}
                onClick={() => go(k === "Slayer" ? "Slayer" : "Skills:" + k)}
              >
                <Icon size={21} />
                <span>
                  <strong>{k}</strong>
                  <small>
                    {E.fmt(record.xp)} / {E.fmt(E.xpNext(record.level))} XP
                  </small>
                </span>
                <b>{record.level}</b>
                <progress
                  max={1}
                  value={E.D(record.xp).div(E.xpNext(record.level)).toNumber()}
                />
              </button>
            );
          })}
        </div>
      </section>
      <section className="idle-panel">
        <header>
          <BookOpen size={16} />
          <h3>Recent activity</h3>
        </header>
        {s.logs.slice(0, 5).map((l) => (
          <div className="recent-ledger-row" key={l.id}>
            <small>
              {new Date(l.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
            <span>{l.text}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
export function FarmManager({
  s,
  act,
  go,
}: {
  s: Save;
  act: Act;
  go: (p: string) => void;
}) {
  return (
    <div className="idle-farm-manager">
      <div className="idle-section-strip">
        <Home />
        <div>
          <strong>Farm management</strong>
          <small>Housing, incubation, breeding and parallel production.</small>
        </div>
        <button className="secondary" onClick={() => go("Skills")}>
          Assign workers
        </button>
      </div>
      <div className="farm-ledger-counters">
        <span>
          Housing{" "}
          <b>
            {s.creatures.length}/{E.capacity(s)}
          </b>
        </span>
        <span>
          Nests <b>{s.incubators.length}</b>
        </span>
        <span>
          Work areas <b>{E.workStations(s).length}</b>
        </span>
        <span>
          Offline <b>12h</b>
        </span>
      </div>
      <section className="idle-panel">
        <header>
          <Hammer size={16} />
          <h3>Facilities</h3>
        </header>
        {FACILITIES.map((k) => {
          const cost = E.facilityCost(s, k),
            upgrade = s.upgrades.find((u) => u.facility === k);
          return (
            <div className="facility-ledger-row" key={k}>
              <span className="facility-level">{s.facilities[k]}</span>
              <div>
                <strong>{k === "Expedition" ? "Expedition Lodge" : k}</strong>
                <small>{FACILITY_INFO[k]}</small>
                <div className="inline-costs">
                  {Object.entries(cost).map(([id, n]) => (
                    <span
                      className={E.amount(s, id).gte(n) ? "" : "short"}
                      key={id}
                    >
                      {E.fmt(n)} {resource(id)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                disabled={!!upgrade || !E.canPay(s, cost)}
                onClick={() => act((v) => E.upgradeFacility(v, k))}
              >
                {upgrade ? duration(upgrade.finish - s.time) : "Upgrade"}
              </button>
            </div>
          );
        })}
      </section>
      <div className="idle-panel-actions">
        <button className="secondary" onClick={() => go("Farm:Hatchery")}>
          Eggs & incubation
        </button>
        <button className="secondary" onClick={() => go("Farm:Breeding")}>
          Breeding complex
        </button>
        <button className="secondary" onClick={() => go("Bank")}>
          Material bank
        </button>
      </div>
    </div>
  );
}

export function SkillWorkspace({
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
  const posts = E.workStations(s),
    [index, setIndex] = useState(0),
    [skill, setSkill] = useState<Skill>(
      (focus && SKILLS.includes(focus as Skill) && focus !== "Slayer"
        ? focus
        : "Woodcutting") as Skill,
    ),
    [selected, setSelected] = useState(""),
    [crew, setCrew] = useState(false),
    [locked, setLocked] = useState(false);
  React.useEffect(() => {
    if (focus && SKILLS.includes(focus as Skill) && focus !== "Slayer") {
      setSkill(focus as Skill);
      setSelected("");
      const found = E.workStations(s).findIndex(
        (p) => p.job && ACTIVITY[p.job.activity].skill === focus,
      );
      const empty = E.workStations(s).findIndex(
        (p) => !p.job && !p.team.length,
      );
      setIndex(found >= 0 ? found : empty >= 0 ? empty : 0);
    }
  }, [focus]);
  const post = posts[index] || posts[0],
    view = E.stationView(s, index),
    active = post.job ? ACTIVITY[post.job.activity] : null,
    activities = ACTIVITIES.filter((a) => a.skill === skill),
    a = ACTIVITY[selected] || activities[0],
    record = s.skills[skill],
    Icon = SKILL_ICONS[skill],
    master = s.mastery[a.id] || { level: 1, xp: "0" },
    seconds = E.farmTaskDuration(s, index, a.id),
    free = s.creatures.filter((c) => E.free(s, c));
  const start = () =>
    act((v) => {
      if (E.workStations(v)[index].job)
        throw Error(
          "Pause this work area and let its current cycle finish first.",
        );
      if (!E.workStations(v)[index].team.length) {
        const c = v.creatures
          .filter((c) => E.free(v, c))
          .sort(
            (a, b) =>
              FAMILY[b.family].aptitudes[skill] -
              FAMILY[a.family].aptitudes[skill],
          )[0];
        if (!c) throw Error("Choose an available creature first.");
        E.assignFarm(v, index, c.id);
      }
      E.startFarmTask(v, index, a.id);
    });
  const choose = (k: Skill) => {
    setSkill(k);
    setSelected("");
  };
  return (
    <div className="skill-workspace">
      <div className={`skill-banner skill-${skill.toLowerCase()}`}>
        <Icon size={32} />
        <div>
          <h2>{skill}</h2>
          <span>
            Level {record.level} · {E.fmt(record.xp)} /{" "}
            {E.fmt(E.xpNext(record.level))} XP
          </span>
          <progress
            max={1}
            value={E.D(record.xp).div(E.xpNext(record.level)).toNumber()}
          />
        </div>
        <strong>{record.level}</strong>
      </div>
      <div className="skill-jump-list" aria-label="Skill selection">
        {SKILLS.filter((k) => k !== "Slayer").map((k) => {
          const I = SKILL_ICONS[k];
          return (
            <button
              className={skill === k ? "active" : ""}
              key={k}
              onClick={() => choose(k)}
              aria-label={k}
            >
              <I size={16} />
              <span>{k}</span>
              <small>{s.skills[k].level}</small>
            </button>
          );
        })}
      </div>
      <div className="work-area-strip">
        <span>Work area</span>
        {posts.map((p, i) => {
          const activity = p.job ? ACTIVITY[p.job.activity] : null;
          return (
            <button
              key={i}
              className={i === index ? "active" : ""}
              aria-label={`Manage work station ${i + 1}`}
              onClick={() => {
                setIndex(i);
                if (activity) {
                  choose(activity.skill);
                  setSelected(activity.id);
                }
              }}
            >
              {i + 1}
              {p.job && <i className="idle-active-dot" />}
            </button>
          );
        })}
        <span className="work-area-total">
          {posts.filter((p) => p.job).length}/{posts.length} busy
        </span>
      </div>
      <div className="skill-workspace-columns">
        <section className="idle-panel activity-catalog">
          <header>
            <Layers size={16} />
            <h3>
              {Object.keys(activities[0].inputs).length
                ? "Recipes"
                : "Gathering activities"}
            </h3>
            <label>
              <input
                type="checkbox"
                checked={locked}
                onChange={() => setLocked(!locked)}
              />
              Show locked
            </label>
          </header>
          <div className="activity-table-header">
            <span>Activity</span>
            <span>Level</span>
            <span>Stored</span>
          </div>
          {activities
            .filter((a) => locked || record.level >= a.level)
            .map((item) => {
              const id = Object.keys(item.outputs)[0],
                current = a.id === item.id;
              return (
                <button
                  className={`activity-catalog-row ${current ? "active" : ""}`}
                  key={item.id}
                  onClick={() => {
                    setSelected(item.id);
                    if (window.innerWidth <= 600)
                      requestAnimationFrame(() =>
                        document
                          .querySelector(".recipe-panel")
                          ?.scrollIntoView({ block: "start" }),
                      );
                  }}
                >
                  <ResourceIcon id={id} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {E.fmt(item.xp, 1)} XP ·{" "}
                      {duration(E.farmTaskDuration(s, index, item.id) * 1000)}
                    </small>
                  </span>
                  <b>{item.level}</b>
                  <small>{E.fmt(E.amount(s, id))}</small>
                  {post.job?.activity === item.id && (
                    <i className="idle-active-dot" />
                  )}
                </button>
              );
            })}
          {!locked && activities.find((a) => a.level > record.level) && (
            <div className="catalog-next-unlock">
              Next activity at level{" "}
              {activities.find((a) => a.level > record.level)!.level}
            </div>
          )}
        </section>
        <section className="idle-panel recipe-panel">
          <header>
            <Icon size={16} />
            <h3>{a.name}</h3>
            <span>Lv {a.level}</span>
          </header>
          <div className="recipe-main-icon">
            <ResourceIcon id={Object.keys(a.outputs)[0]} />
          </div>
          <div className="recipe-xp-row">
            <span>
              Skill XP <b>+{E.fmt(a.xp, 1)}</b>
            </span>
            <span>
              Creature XP <b>+{E.fmt(a.creatureXp, 1)}</b>
            </span>
            <span>
              Cycle <b>{duration(seconds * 1000)}</b>
            </span>
          </div>
          <div className="recipe-columns">
            <div>
              <h4>Requires</h4>
              {Object.keys(a.inputs).length ? (
                Object.entries(a.inputs).map(([id, n]) => (
                  <div className="recipe-resource" key={id}>
                    <ResourceIcon id={id} />
                    <span>
                      {resource(id)}
                      <small>{E.fmt(E.amount(s, id))} owned</small>
                    </span>
                    <b className={E.amount(s, id).gte(n) ? "" : "short"}>
                      ×{n}
                    </b>
                  </div>
                ))
              ) : (
                <div className="recipe-no-input">No ingredients</div>
              )}
            </div>
            <div>
              <h4>Produces</h4>
              {Object.entries(a.outputs).map(([id, n]) => (
                <div className="recipe-resource" key={id}>
                  <ResourceIcon id={id} />
                  <span>
                    {resource(id)}
                    <small>{E.fmt(E.amount(s, id))} owned</small>
                  </span>
                  <b>×{n}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="mastery-row">
            <span>
              Activity mastery <b>{master.level}</b>
            </span>
            <progress
              max={1}
              value={E.D(master.xp).div(E.xpNext(master.level)).toNumber()}
            />
          </div>
          <div className="recipe-helper-line">
            <div>
              {post.team.map((id) => {
                const c = s.creatures.find((c) => c.id === id)!;
                return (
                  <Sigil
                    key={id}
                    family={c.family}
                    stage={c.stage}
                    color={c.color}
                    effect={c.effect}
                  />
                );
              })}
              {!post.team.length && (
                <span>Auto-select an available helper on start</span>
              )}
            </div>
            <button className="secondary" onClick={() => setCrew(true)}>
              <Users size={14} />
              {post.team.length}/6 helpers
            </button>
          </div>
          {post.job ? (
            <div className="current-work">
              <div>
                <i className="idle-active-dot" />
                <strong>
                  {active!.skill} — {active!.name}
                </strong>
                <span>{duration(post.job.finish - s.time)}</span>
              </div>
              <progress
                max={1}
                value={Math.max(
                  0,
                  1 -
                    (post.job.finish - s.time) /
                      (E.farmTaskDuration(s, index, post.job.activity) * 1000),
                )}
              />
              <button
                className="stop-action"
                disabled={!post.activity}
                onClick={() => act((v) => E.pauseFarmTask(v, index))}
              >
                <Pause size={14} />
                {post.activity
                  ? "Stop after cycle"
                  : "Finishing reserved cycle"}
              </button>
              {post.job.activity !== a.id && (
                <p>Stop the current task to start the selected recipe.</p>
              )}
            </div>
          ) : (
            <button
              className="start-action"
              disabled={
                record.level < a.level ||
                !E.canPay(s, a.inputs) ||
                (!post.team.length && !free.length)
              }
              onClick={start}
            >
              <Play size={15} />
              {record.level < a.level
                ? `Requires level ${a.level}`
                : !E.canPay(s, a.inputs)
                  ? "Missing ingredients"
                  : !post.team.length && !free.length
                    ? "Assign an available helper"
                    : `Start ${a.name}`}
            </button>
          )}
          <div className="recipe-hourly">
            <span>
              Output/h{" "}
              <b>
                {unit(
                  (Object.values(a.outputs).reduce((n, v) => n + v, 0) * 3600) /
                    seconds,
                )}
              </b>
            </span>
            <span>
              Skill XP/h <b>{E.fmt((a.xp * 3600) / seconds)}</b>
            </span>
          </div>
          <p className="rate-note">
            Base hourly estimates before bonus yields. Creature XP is shared,
            not multiplied by helpers.
            {skill === "Foraging" &&
              ` Egg discovery: ${(E.foragingEggChance(view, a.id) * 100).toLocaleString(undefined, { maximumFractionDigits: 6 })}% per cycle.`}
          </p>
        </section>
      </div>
      <section className="idle-panel station-roster">
        <header>
          <Activity size={16} />
          <h3>All active work areas</h3>
          <button className="text-button" onClick={() => go("Farm:Buildings")}>
            Expand workshop
          </button>
        </header>
        {posts.map((p, i) => {
          const a = p.job ? ACTIVITY[p.job.activity] : null;
          return (
            <div className="station-ledger-row" key={i}>
              <b>{i + 1}</b>
              <span>
                <strong>{a ? `${a.skill} — ${a.name}` : "Idle"}</strong>
                <small>
                  {p.team.length} helpers
                  {a ? " · " + duration(p.job!.finish - s.time) : ""}
                </small>
              </span>
              {a && (
                <span>
                  {Object.entries(a.outputs)
                    .map(([id, n]) => `${n} ${resource(id)}`)
                    .join(", ")}
                </span>
              )}
              <button
                className="secondary small"
                onClick={() => {
                  setIndex(i);
                  if (a) {
                    choose(a.skill);
                    setSelected(a.id);
                  }
                }}
              >
                Manage
              </button>
            </div>
          );
        })}
      </section>
      <details className="idle-panel workflow-tools">
        <summary>Queues, milestones & workflows</summary>
        <p>
          Each activity has independent mastery. Skill milestone bonuses are
          permanent. Work area 1 retains existing queues, loadouts and
          workflows.
        </p>
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
          <option value="">Add area 1 queue entry · Workshop 3</option>
          {ACTIVITIES.filter((a) => s.skills[a.skill].level >= a.level).map(
            (a) => (
              <option key={a.id} value={a.id}>
                {a.skill} · {a.name}
              </option>
            ),
          )}
        </select>
        {s.queue.length > 0 && (
          <p>
            {s.queue.map((id) => ACTIVITY[id].name).join(" → ")}{" "}
            <button
              className="text-button"
              onClick={() =>
                act((v) => {
                  v.queue = [];
                })
              }
            >
              Clear
            </button>
          </p>
        )}
        <button
          className="secondary"
          disabled={s.facilities.Workshop < 6}
          onClick={onWorkflow}
        >
          Edit workflows · Workshop 6
        </button>
        <button className="text-button" onClick={() => go("Creatures")}>
          Saved loadouts
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
            className="modal worker-select"
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
            <h2>Work area {index + 1} helpers</h2>
            <p>
              {post.job
                ? "Stop and finish the reserved cycle before changing workers."
                : `Choose up to six available creatures. ${skill} aptitude improves this task.`}
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
                    onClick={() => act((v) => E.assignFarm(v, index, c.id))}
                  >
                    <Sigil family={c.family} stage={c.stage} />
                    <span>
                      <strong>{name(c)}</strong>
                      <small>
                        {own
                          ? "Assigned"
                          : free
                            ? "Available"
                            : s.combatTeam.includes(c.id)
                              ? "Combat"
                              : "Other assignment"}{" "}
                        · Lv {c.level}
                      </small>
                    </span>
                    <span>{FAMILY[c.family].aptitudes[skill]} aptitude</span>
                    {own ? <Check size={16} /> : <Users size={16} />}
                  </button>
                );
              })}
          </section>
        </div>
      )}
    </div>
  );
}

export function Bank({
  s,
  act,
  go,
  onEquipment,
}: {
  s: Save;
  act: Act;
  go: (p: string) => void;
  onEquipment: () => void;
}) {
  const [tab, setTab] = useState("Materials"),
    [query, setQuery] = useState(""),
    [group, setGroup] = useState("All"),
    [selected, setSelected] = useState<string | null>(null),
    [quantity, setQuantity] = useState("1");
  const materials = Object.keys(s.inventory)
    .filter(
      (id) =>
        E.amount(s, id).gt(0) &&
        resource(id).toLowerCase().includes(query.toLowerCase()) &&
        (group === "All" ||
          (group === "Gathering" && /^g\d-/.test(id)) ||
          (group === "Production" &&
            !/^g\d-|^trophy-|^catalyst$|^relic$/.test(id)) ||
          (group === "Combat" && /^trophy-|^catalyst$|^relic$/.test(id))),
    )
    .sort((a, b) => resource(a).localeCompare(resource(b)));
  const eggs = E.eggStacks(s).filter((g) =>
    FAMILY[g.family].names[0].toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="idle-bank">
      <div className="bank-toolbar">
        <div className="segmented" aria-label="Bank categories">
          {["Materials", "Eggs"].map((k) => (
            <button
              className={tab === k ? "active" : ""}
              key={k}
              onClick={() => {
                setTab(k);
                setSelected(null);
              }}
            >
              {k}{" "}
              <small>
                {k === "Materials"
                  ? Object.keys(s.inventory).filter((id) =>
                      E.amount(s, id).gt(0),
                    ).length
                  : s.eggs.length}
              </small>
            </button>
          ))}
          <button onClick={onEquipment}>
            Equipment <small>{s.items.length}</small>
          </button>
        </div>
        <label className="bank-search">
          <Search size={15} />
          <input
            aria-label="Search bank"
            placeholder="Search bank…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {tab === "Materials" && (
        <div className="bank-filters">
          {RESOURCE_GROUPS.map((k) => (
            <button
              className={group === k ? "active" : ""}
              key={k}
              onClick={() => setGroup(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <div className="bank-workspace">
        <section className="idle-panel bank-grid-panel">
          <header>
            <Package size={16} />
            <h3>{tab}</h3>
            <span>
              {tab === "Materials" ? materials.length : eggs.length} stacks
            </span>
          </header>
          <div className="bank-grid">
            {tab === "Materials"
              ? materials.map((id) => (
                  <button
                    className={`bank-tile ${selected === id ? "active" : ""}`}
                    key={id}
                    title={`${resource(id)}: ${E.fmt(E.amount(s, id))}`}
                    aria-label={`${resource(id)} ${E.fmt(E.amount(s, id))}`}
                    onClick={() => {
                      setSelected(id);
                      setQuantity("1");
                      if (window.innerWidth <= 600)
                        requestAnimationFrame(() =>
                          document
                            .querySelector(".bank-detail")
                            ?.scrollIntoView({ block: "nearest" }),
                        );
                    }}
                  >
                    <ResourceIcon id={id} />
                    <span>{E.fmt(E.amount(s, id))}</span>
                    <small>{resource(id)}</small>
                  </button>
                ))
              : eggs.map((g) => (
                  <button
                    className={`bank-tile egg-bank-tile ${selected === g.family ? "active" : ""}`}
                    key={g.family}
                    aria-label={`${FAMILY[g.family].names[0]} egg ${g.count}`}
                    onClick={() => {
                      setSelected(g.family);
                      if (window.innerWidth <= 600)
                        requestAnimationFrame(() =>
                          document
                            .querySelector(".bank-detail")
                            ?.scrollIntoView({ block: "nearest" }),
                        );
                    }}
                  >
                    <Sigil family={g.family} />
                    <span>×{g.count}</span>
                    <small>{FAMILY[g.family].names[0]} egg</small>
                  </button>
                ))}
          </div>
          {(tab === "Materials" ? materials.length : eggs.length) === 0 && (
            <p className="empty-bank">
              No matching stored {tab.toLowerCase()}.
            </p>
          )}
        </section>
        <section className="idle-panel bank-detail">
          <header>
            <Box size={16} />
            <h3>Selected item</h3>
          </header>
          {selected ? (
            tab === "Materials" ? (
              <>
                <div className="bank-selected-icon">
                  <ResourceIcon id={selected} />
                </div>
                <h3>{resource(selected)}</h3>
                <div className="ledger-row">
                  <span>Owned</span>
                  <strong>{E.fmt(E.amount(s, selected))}</strong>
                </div>
                <p>
                  Shared by all farm jobs, recipes and facility upgrades. Sell
                  only supplies you can spare.
                </p>
                <label>
                  Sell quantity
                  <input
                    aria-label="Sell quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  disabled={
                    !Number.isSafeInteger(Number(quantity)) ||
                    Number(quantity) < 1 ||
                    E.amount(s, selected).lt(Number(quantity))
                  }
                  onClick={() =>
                    act((v) => E.sell(v, selected, Number(quantity)))
                  }
                >
                  Sell for{" "}
                  {E.fmt(Number(quantity) * (selected.startsWith("g") ? 2 : 5))}{" "}
                  gold
                </button>
              </>
            ) : (
              <>
                <div className="bank-selected-icon">
                  <Sigil family={selected} />
                </div>
                <h3>{FAMILY[selected].names[0]} egg</h3>
                <div className="ledger-row">
                  <span>Stored</span>
                  <strong>
                    {E.eggStacks(s).find((g) => g.family === selected)?.count ||
                      0}
                  </strong>
                </div>
                <p>
                  Each egg keeps its own hidden IVs and variants. Loading
                  selects the oldest matching egg.
                </p>
                <button
                  disabled={
                    !s.incubators.some((i) => !i.egg) ||
                    !s.eggs.some((e) => e.family === selected)
                  }
                  onClick={() => act((v) => E.loadEggFamily(v, selected))}
                >
                  Load a nest
                </button>
                <button
                  className="secondary"
                  onClick={() => go("Farm:Hatchery")}
                >
                  Open nursery
                </button>
              </>
            )
          ) : (
            <div className="bank-selection-empty">
              <Package size={45} />
              <p>Select a stack to inspect it.</p>
              <small>Storage is unlimited.</small>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
