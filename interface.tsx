import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  Pickaxe,
  Egg as EggIcon,
  ChevronRight,
  Plus,
  X,
  Users,
  Play,
  Pause,
  Heart,
  Shield,
  Flame,
  Leaf,
  Mountain,
  Zap,
  Waves,
  Check,
  ArrowRight,
  Settings2,
  Clock,
  BookOpen,
} from "lucide-react";
import {
  Save,
  Creature,
  Skill,
  SKILLS,
  CombatUnit,
  Element,
  RARITIES,
} from "./model";
import {
  FAMILY,
  FAMILIES,
  ACTIVITY,
  ACTIVITIES,
  ENCOUNTERS,
  ENCOUNTER,
  REGIONS,
  ADVENTURES,
  JOURNAL,
  MATERIALS,
} from "./content";
import { Sigil } from "./portraits";
import * as E from "./engine";
type Act = (fn: (s: Save) => void) => void;
type Confirm = (title: string, text: string, fn: () => void) => void;
const name = (c: Creature) => c.name || FAMILY[c.family].names[c.stage - 1];
const resource = (id: string) => MATERIALS[id] || id;
const duration = (ms: number) => {
  const n = Math.max(0, Math.ceil(ms / 1000));
  return n >= 3600
    ? `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`
    : n >= 60
      ? `${Math.floor(n / 60)}m ${n % 60}s`
      : `${n}s`;
};
const ICONS = {
  Fire: Flame,
  Nature: Leaf,
  Earth: Mountain,
  Storm: Zap,
  Water: Waves,
};
function recommended(s: Save) {
  const region = Math.min(
    9,
    s.unlocks.filter((u) => /^boss-\d+$/.test(u)).length,
  );
  const c =
    s.creatures.find((c) => s.combatTeam.includes(c.id)) || s.creatures[0];
  return ENCOUNTERS.filter(
    (e) => e.region === region && e.kind === "wild",
  ).sort((a, b) =>
    c
      ? E.elemental(FAMILY[c.family].element, FAMILY[b.families[0]].element) -
        E.elemental(FAMILY[c.family].element, FAMILY[a.families[0]].element)
      : 0,
  )[0];
}
function ensureCombat(s: Save) {
  if (s.combatTeam.some(Boolean)) return;
  const c = s.creatures.find((c) => E.free(s, c));
  if (!c)
    throw Error(
      "Assign a recovered creature to Combat. Working and breeding creatures are unavailable.",
    );
  E.assign(s, c.id, "combat", 0);
}
export function ActivityStrip({
  s,
  go,
}: {
  s: Save;
  go: (page: string) => void;
}) {
  const ready = s.incubators.filter((i) => i.egg && i.finish <= s.time).length;
  return (
    <div className="activity-strip">
      <button onClick={() => go("Combat")}>
        <Swords size={15} />
        <span>
          <small>COMBAT</small>
          <strong>
            {s.combat
              ? s.combat.defeats
                ? "Defeated · recover"
                : ENCOUNTER[s.combat.encounter].name
              : "No active hunt"}
          </strong>
        </span>
        <i className={s.combat && !s.combat.defeats ? "running" : ""} />
      </button>
      <button onClick={() => go("Skills")}>
        <Pickaxe size={15} />
        <span>
          <small>WORK</small>
          <strong>
            {E.workStations(s).filter((j) => j.job).length
              ? `${E.workStations(s).filter((j) => j.job).length} farm tasks`
              : "Farm resting"}
          </strong>
        </span>
        <i className={E.workStations(s).some((j) => j.job) ? "running" : ""} />
      </button>
      <button onClick={() => go("Farm:Hatchery")}>
        <EggIcon size={15} />
        <span>
          <small>HATCHERY</small>
          <strong>
            {ready
              ? `${ready} ready to hatch`
              : s.incubators.some((i) => i.egg)
                ? "Incubating"
                : `${s.eggs.length} stored eggs`}
          </strong>
        </span>
        {ready > 0 && <b>{ready}</b>}
      </button>
    </div>
  );
}
function Crew({
  s,
  team,
  onEdit,
}: {
  s: Save;
  team: "combat" | "skill";
  onEdit: () => void;
}) {
  const ids = team === "combat" ? s.combatTeam : s.skillTeam;
  return (
    <div className="crew-strip">
      <div>
        <strong>{team === "combat" ? "Combat team" : "Work crew"}</strong>
        <small>{ids.filter(Boolean).length}/6 assigned</small>
      </div>
      <div className="crew-faces">
        {Array.from({ length: 6 }, (_, i) => {
          const c = s.creatures.find((c) => c.id === ids[i]);
          return (
            <button
              key={i}
              aria-label={`Edit ${team} slot ${i + 1}`}
              onClick={onEdit}
            >
              {c ? (
                <Sigil
                  family={c.family}
                  stage={c.stage}
                  color={c.color}
                  effect={c.effect}
                />
              ) : (
                <Plus size={13} />
              )}
            </button>
          );
        })}
      </div>
      <button className="secondary small" onClick={onEdit}>
        <Users size={14} />
        Edit team
      </button>
    </div>
  );
}
export function Dashboard({
  s,
  act,
  go,
  onTeam,
  onDetail,
}: {
  s: Save;
  act: Act;
  go: (page: string) => void;
  onTeam: (team: "combat" | "skill") => void;
  onDetail: (id: string) => void;
}) {
  const ready = s.incubators.find((i) => i.egg && i.finish <= s.time),
    inc = s.incubators.find((i) => i.egg),
    empty = s.incubators.find((i) => !i.egg),
    free = s.creatures.find((c) => E.free(s, c)),
    target = recommended(s);
  let title = "",
    text = "",
    label = "",
    run = () => {};
  if (ready && s.creatures.length >= E.capacity(s)) {
    title = "Your housing is full";
    text = "Upgrade Housing in Buildings to make room for this hatch.";
    label = "Open buildings";
    run = () => go("Farm:Buildings");
  } else if (ready) {
    title = "Your companion is ready";
    text = `Hatch ${FAMILY[ready.egg!.family].names[0]} and inspect its stats. Eggs keep the IVs and variants rolled when created.`;
    label = "Hatch now";
    run = () => act((s) => E.hatch(s, ready.id));
  } else if (!s.creatures.length && inc) {
    title = "Your first egg is warming";
    text = `${FAMILY[inc.egg!.family].names[0]} hatches in ${duration(inc.finish - s.time)}. Your first companion will join Combat automatically.`;
    label = "View egg";
    run = () => go("Farm:Hatchery");
  } else if ((s.metrics.wins || 0) > 0 && !s.claims.includes("victory")) {
    title = "Claim your second companion";
    text =
      "Your first victory earned a Sporel egg. Hatch it to build a team and unlock concurrent work.";
    label = "Claim Sporel egg";
    run = () => act((s) => E.claim(s, "victory"));
  } else if (s.eggs.length && empty) {
    title = "Put another egg to work";
    text =
      "Incubators run alongside combat and gathering. Load an egg now so your collection keeps growing.";
    label = "Load next egg";
    run = () => act((s) => E.loadEgg(s, empty.id, s.eggs[0].id));
  } else if (s.combat?.defeats) {
    title = "Your team needs to recover";
    text =
      "Defeat stopped this run. Your rewards and equipment are safe. Recovery happens automatically.";
    label = "View recovery";
    run = () => go("Combat");
  } else if (!s.combat && s.creatures.length) {
    title = "Start an automatic hunt";
    text = `${target.name} offers XP, gold, materials and a chance at an egg. Your team chooses attacks automatically.`;
    label = "Start recommended hunt";
    run = () => {
      act((s) => {
        ensureCombat(s);
        E.startCombat(s, target.id);
      });
      go("Combat");
    };
  } else if (!s.skillJob && free) {
    title = "Gather while your combat team fights";
    text = `${name(free)} is available. Assign it to Mining and start gathering upgrade materials in one tap.`;
    label = "Assign & start Mining";
    run = () =>
      act((s) => {
        if (!s.skillTeam.length) E.assign(s, free.id, "skill");
        E.startSkill(s, "g1-0");
      });
  } else if (!s.skillJob && s.skillTeam.length) {
    title = "Your work crew is idle";
    text =
      "Choose one gathering activity or recipe. Work continues alongside combat, including while you are away.";
    label = "Choose work";
    run = () => go("Skills");
  } else if (s.creatures.length < 2) {
    title = "Grow into two teams";
    text =
      "Your first creature is fighting. A second hatch can work while combat runs. Claim journal rewards and collect eggs.";
    label = "View hatchery";
    run = () => go("Farm:Hatchery");
  } else {
    title = "Both teams are making progress";
    text =
      "Combat earns eggs and loot. Work supplies upgrades and breeding. Your next region opens when its current boss falls.";
    label = "Choose your next challenge";
    run = () => go("Combat");
  }
  const first = s.creatures[0];
  return (
    <div className="dashboard">
      <section className="next-step panel">
        <div className="next-step-copy">
          <span className="eyebrow">NEXT STEP</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <button onClick={run}>
            {label}
            <ArrowRight size={15} />
          </button>
        </div>
        {first ? (
          <button
            className="guide-portrait"
            aria-label={`Inspect ${name(first)}`}
            onClick={() => onDetail(first.id)}
          >
            <Sigil
              family={first.family}
              stage={first.stage}
              color={first.color}
              effect={first.effect}
            />
          </button>
        ) : (
          <div className="guide-portrait">
            <Sigil family={inc?.egg?.family || "F01"} />
          </div>
        )}
      </section>
      <ActivityStrip s={s} go={go} />
      <div className="dashboard-work">
        <section className="panel">
          <div className="section-heading">
            <h2>Combat</h2>
            <button className="text-button small" onClick={() => go("Combat")}>
              Watch <ChevronRight size={13} />
            </button>
          </div>
          <Crew s={s} team="combat" onEdit={() => onTeam("combat")} />
          <p>
            {s.combat
              ? `${s.combat.wins} wins this run · ${s.combat.defeats ? "Recovering" : "Fighting automatically"}`
              : "Choose a hunt to earn creature XP, eggs and equipment."}
          </p>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Work</h2>
            <button className="text-button small" onClick={() => go("Skills")}>
              Activities <ChevronRight size={13} />
            </button>
          </div>
          <Crew s={s} team="skill" onEdit={() => onTeam("skill")} />
          <p>
            {s.skillJob
              ? `${ACTIVITY[s.skillJob.activity].skill} · ${ACTIVITY[s.skillJob.activity].name} · ${duration(s.skillJob.finish - s.time)} to next output`
              : "Assign a different creature here. Combat and work run together."}
          </p>
        </section>
      </div>
      <section className="panel hatch-queue">
        <div className="section-heading">
          <h2>Hatch queue</h2>
          <button
            className="text-button small"
            onClick={() => go("Farm:Hatchery")}
          >
            Farm <ChevronRight size={13} />
          </button>
        </div>
        {s.incubators.slice(0, 4).map((i, n) => (
          <div className="compact-job" key={i.id}>
            <EggIcon size={19} />
            <div>
              <strong>
                {i.egg
                  ? `${FAMILY[i.egg.family].names[0]} egg`
                  : `Incubator ${n + 1}`}
              </strong>
              <small>
                {i.egg
                  ? i.finish <= s.time
                    ? "Ready to hatch"
                    : duration(i.finish - s.time) + " remaining"
                  : "Empty · " + s.eggs.length + " stored eggs"}
              </small>
            </div>
            {i.egg ? (
              <button
                className="secondary small"
                disabled={
                  i.finish > s.time || s.creatures.length >= E.capacity(s)
                }
                onClick={() => act((s) => E.hatch(s, i.id))}
              >
                Hatch
              </button>
            ) : (
              <button
                className="secondary small"
                disabled={!s.eggs.length}
                onClick={() => act((s) => E.loadEgg(s, i.id, s.eggs[0].id))}
              >
                Load egg
              </button>
            )}
          </div>
        ))}
      </section>
      <div className="dashboard-work">
        <section className="panel">
          <div className="section-heading">
            <h2>Journal rewards</h2>
            <button
              className="text-button small"
              onClick={() => go("Collection")}
            >
              All goals
            </button>
          </div>
          {JOURNAL.filter((j) => !s.claims.includes(j[0]))
            .slice(0, 3)
            .map(([id, title, key, count, reward]) => (
              <div className="compact-job" key={id}>
                <BookOpen size={16} />
                <div>
                  <strong>{title}</strong>
                  <small>
                    {Math.min(s.metrics[key] || 0, count)}/{count} · {reward}{" "}
                    gold
                  </small>
                </div>
                <button
                  className="secondary small"
                  disabled={(s.metrics[key] || 0) < count}
                  onClick={() => act((s) => E.claim(s, id))}
                >
                  Claim
                </button>
              </div>
            ))}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Just happened</h2>
            <button
              className="text-button small"
              onClick={() => go("Settings")}
            >
              History
            </button>
          </div>
          {s.logs.slice(0, 4).map((l) => (
            <p className="recent-line" key={l.id}>
              <i />
              {l.text}
            </p>
          ))}
          {!s.logs.length && <p>Your first companion starts the story.</p>}
        </section>
      </div>
    </div>
  );
}
export function TeamDrawer({
  s,
  act,
  team,
  close,
  confirm,
}: {
  s: Save;
  act: Act;
  team: "combat" | "skill";
  close: () => void;
  confirm: Confirm;
}) {
  const [slot, setSlot] = useState(0),
    [query, setQuery] = useState("");
  const active = team === "combat" ? !!s.combat : !!s.skillJob;
  const ids = team === "combat" ? s.combatTeam : s.skillTeam;
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="modal team-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={team === "combat" ? "Edit combat team" : "Edit work crew"}
      >
        <button
          className="modal-close icon-button"
          aria-label="Close team"
          onClick={close}
        >
          <X />
        </button>
        <span className="eyebrow">DIRECT ASSIGNMENT</span>
        <h2>{team === "combat" ? "Combat formation" : "Work crew"}</h2>
        <p>
          {team === "combat"
            ? "Choose a slot, then tap a creature. Front slots draw ordinary attacks first."
            : "Choose up to six workers for one activity. These creatures cannot fight or breed at the same time."}
        </p>
        {active && (
          <div className="notice">
            {team === "combat" ? (
              <>
                <p>
                  End the active run before editing its team. Earned rewards
                  stay.
                </p>
                <button
                  onClick={() =>
                    s.combat?.adventure
                      ? confirm(
                          "End this adventure?",
                          "The unfinished adventure ends. Earned rewards stay.",
                          () => act(E.stopCombat),
                        )
                      : act(E.stopCombat)
                  }
                >
                  End run to edit
                </button>
              </>
            ) : (
              <>
                <p>
                  Pause work and let its reserved cycle finish before changing
                  workers.
                </p>
                <button
                  disabled={!s.activity}
                  onClick={() => act(E.pauseSkill)}
                >
                  Pause after cycle
                </button>
              </>
            )}
          </div>
        )}
        <div className="assignment-slots">
          {Array.from({ length: 6 }, (_, n) => {
            const c = s.creatures.find((c) => c.id === ids[n]);
            return (
              <button
                key={n}
                className={slot === n ? "selected" : ""}
                onClick={() => setSlot(n)}
              >
                <small>
                  {team === "combat"
                    ? (n < 3 ? "Front " : "Back ") + ((n % 3) + 1)
                    : "Worker " + (n + 1)}
                </small>
                {c ? (
                  <Sigil family={c.family} stage={c.stage} />
                ) : (
                  <Plus size={22} />
                )}
                <strong>{c ? name(c) : "Empty"}</strong>
              </button>
            );
          })}
        </div>
        <button
          className="secondary small"
          disabled={active}
          onClick={() =>
            act((s) => {
              if (team === "combat")
                for (let n = 0; n < 6; n++) {
                  if (s.combatTeam[n]) continue;
                  const c = s.creatures.find((c) => E.free(s, c));
                  if (c) E.assign(s, c.id, "combat", n);
                }
              else
                for (let n = s.skillTeam.length; n < 6; n++) {
                  const c = s.creatures.find((c) => E.free(s, c));
                  if (c) E.assign(s, c.id, "skill");
                }
            })
          }
        >
          Fill empty slots from reserve
        </button>
        <input
          aria-label="Find team creature"
          placeholder="Search creatures…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="assignment-list">
          {s.creatures
            .filter((c) => name(c).toLowerCase().includes(query.toLowerCase()))
            .map((c) => {
              const own = ids.includes(c.id),
                breeding = s.breeding.some((b) => b.parents.includes(c.id)),
                working = E.farmWorkers(s).includes(c.id),
                fighting = s.combatTeam.includes(c.id),
                recovering = c.recoveryUntil > s.time;
              const blocked =
                active ||
                breeding ||
                recovering ||
                (team === "combat" && working) ||
                (team === "skill" && fighting && !!s.combat);
              return (
                <div className="assignment-row" key={c.id}>
                  <Sigil
                    family={c.family}
                    stage={c.stage}
                    color={c.color}
                    effect={c.effect}
                  />
                  <div>
                    <strong>
                      {name(c)} <small>Lv {c.level}</small>
                    </strong>
                    <small>
                      {breeding
                        ? "Breeding"
                        : recovering
                          ? "Recovering"
                          : fighting
                            ? "Combat"
                            : working
                              ? "Work crew"
                              : "Reserve"}{" "}
                      · {FAMILY[c.family].role}
                    </small>
                  </div>
                  <button
                    className="secondary small"
                    disabled={blocked}
                    onClick={() =>
                      act((s) => {
                        if (own) E.assign(s, c.id, "reserve");
                        else {
                          E.assign(s, c.id, team, slot);
                          if (team === "combat") setSlot((slot + 1) % 6);
                        }
                      })
                    }
                  >
                    {own ? "Remove" : team === "combat" ? "Assign" : "Add"}
                  </button>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
export function CombatScreen({
  s,
  act,
  onTeam,
  onDetail,
  confirm,
}: {
  s: Save;
  act: Act;
  onTeam: () => void;
  onDetail: (id: string) => void;
  confirm: Confirm;
}) {
  const [lootTarget, setLootTarget] = useState<{
    encounter?: string;
    adventure?: string;
  } | null>(null);
  const [tab, setTab] = useState(s.combat ? "Battle" : "Hunts"),
    [region, setRegion] = useState(() =>
      Math.min(9, s.unlocks.filter((u) => /^boss-\d+$/.test(u)).length),
    );
  const target = recommended(s);
  const fight = (id: string, adventure?: string) => {
    const start = () => {
      act((s) => {
        if (s.combat) E.stopCombat(s);
        ensureCombat(s);
        E.startCombat(s, id, adventure);
      });
      setTab("Battle");
    };
    if (s.combat?.adventure)
      confirm(
        "Leave the current adventure?",
        "Earned rewards stay. The unfinished run ends when you switch.",
        start,
      );
    else start();
  };
  const stop = () =>
    s.combat?.adventure
      ? confirm(
          "End this adventure?",
          "The unfinished run ends. Earned rewards stay.",
          () => act(E.stopCombat),
        )
      : act(E.stopCombat);
  return (
    <div className="combat-screen">
      <div className="screen-toolbar">
        <div className="segmented" aria-label="Combat views">
          {["Battle", "Hunts", "Dungeons", "Raids"].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="secondary small team-trigger" onClick={onTeam}>
          <Users size={15} />
          {s.combatTeam.filter(Boolean).length}/6 Team
        </button>
      </div>
      {tab === "Battle" &&
        (s.combat ? (
          <>
            <div className="battle-heading">
              <div>
                <span className="eyebrow">
                  {s.combat.adventure
                    ? `${ADVENTURES.find((a) => a.id === s.combat!.adventure!.id)?.name} · ${s.combat.adventure.node + 1} / ${ADVENTURES.find((a) => a.id === s.combat!.adventure!.id)?.nodes.length}`
                    : "AUTOMATIC COMBAT"}
                </span>
                <h2>{ENCOUNTER[s.combat.encounter].name}</h2>
              </div>
              <span className="tag">{s.combat.wins} wins</span>
            </div>
            <Battle s={s} onDetail={onDetail} />
            <div className="battle-controls">
              <button
                className="secondary small"
                onClick={() =>
                  setLootTarget({ encounter: s.combat!.encounter })
                }
              >
                Drop rates
              </button>
              {s.combat.defeats ? (
                <button
                  onClick={() => act(E.retryCombat)}
                  disabled={s.creatures.some(
                    (c) =>
                      s.combatTeam.includes(c.id) && c.recoveryUntil > s.time,
                  )}
                >
                  Recover & retry
                </button>
              ) : (
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={s.combat.repeat}
                    onChange={() =>
                      act((s) => {
                        s.combat!.repeat = !s.combat!.repeat;
                      })
                    }
                  />
                  Repeat hunt
                </label>
              )}
              <button
                className="secondary small"
                onClick={() => setTab("Hunts")}
              >
                Change hunt
              </button>
              <button className="danger secondary small" onClick={stop}>
                Stop run
              </button>
            </div>
            <div className="consumables">
              {["ration", "potion", "ward"].map((k) => (
                <button
                  key={k}
                  className="secondary small"
                  disabled={!E.amount(s, k).gt(0) || !!s.combat?.defeats}
                  onClick={() => act((s) => E.consume(s, k))}
                >
                  {k === "ration" ? (
                    <Swords size={13} />
                  ) : k === "potion" ? (
                    <Heart size={13} />
                  ) : (
                    <Shield size={13} />
                  )}{" "}
                  {k === "ration" ? "Food" : k === "potion" ? "Heal" : "Shield"}{" "}
                  <b>{E.fmt(s.inventory[k] || 0)}</b>
                </button>
              ))}
            </div>
            <details className="panel compact-details">
              <summary>
                <Settings2 size={14} /> Repeat & stop rules
              </summary>
              <div className="two-col">
                <label>
                  Stop after victories (0 = unlimited)
                  <input
                    aria-label="Stop after wins"
                    type="number"
                    min="0"
                    value={s.combat.limit}
                    onChange={(e) =>
                      act((s) => {
                        s.combat!.limit = Math.max(
                          0,
                          Math.floor(Number(e.target.value)),
                        );
                      })
                    }
                  />
                </label>
                <label>
                  Stop at resource
                  <select
                    value={s.combat.resource}
                    onChange={(e) =>
                      act((s) => {
                        s.combat!.resource = e.target.value;
                      })
                    }
                  >
                    <option value="">No resource stop</option>
                    {Object.entries(MATERIALS).map(([id, n]) => (
                      <option value={id} key={id}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                {s.combat.resource && (
                  <label>
                    Target stock
                    <input
                      aria-label="Target amount"
                      type="number"
                      min="1"
                      value={s.combat.amount}
                      onChange={(e) =>
                        act((s) => {
                          s.combat!.amount = Math.max(
                            1,
                            Number(e.target.value),
                          );
                        })
                      }
                    />
                  </label>
                )}
              </div>
            </details>
          </>
        ) : (
          <div className="panel battle-empty">
            <Swords size={38} />
            <h2>Choose a hunt. Your team handles the fighting.</h2>
            <p>
              Frontline creatures absorb ordinary attacks. Backline creatures
              support and deal damage. You manage the team, equipment and
              ability priorities.
            </p>
            <button onClick={() => fight(target.id)}>
              {s.combatTeam.some(Boolean)
                ? "Start recommended hunt"
                : "Assign a companion & fight"}
            </button>
            <button className="secondary" onClick={onTeam}>
              Edit combat team
            </button>
          </div>
        ))}
      {tab === "Hunts" && (
        <>
          <div className="hunt-intro">
            <label>
              Region
              <select
                aria-label="Combat region"
                value={region}
                onChange={(e) => setRegion(Number(e.target.value))}
              >
                {REGIONS.map((r, n) => (
                  <option value={n} key={r} disabled={!E.unlockedRegion(s, n)}>
                    {n + 1}. {r}
                    {E.unlockedRegion(s, n) ? "" : " · Locked"}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Defeat this region’s boss to open the next. Wild hunts drop eggs
              from the creatures you fight.
            </p>
          </div>
          <div className="hunt-list">
            {ENCOUNTERS.filter(
              (e) => e.region === region && e.kind !== "slayer",
            ).map((e) => (
              <article
                className={`hunt-row ${e.kind === "boss" ? "boss" : ""}`}
                key={e.id}
              >
                <Sigil
                  family={e.families[0]}
                  stage={e.level >= 75 ? 3 : e.level >= 25 ? 2 : 1}
                />
                <div>
                  <span className="tiny muted">
                    {e.kind === "boss" ? "REGION BOSS" : "WILD"} · LV {e.level}{" "}
                    · {e.families.length} ENEMIES
                  </span>
                  <h3>{e.name}</h3>
                  <small>
                    {e.families.map((id) => FAMILY[id].names[0]).join(" · ")}
                  </small>
                  <div className="matchup-chips">
                    {[
                      ...new Set(e.families.map((id) => FAMILY[id].element)),
                    ].map((el) => {
                      const I = ICONS[el];
                      return (
                        <span className={el.toLowerCase()} key={el}>
                          <I size={11} />
                          {el}
                        </span>
                      );
                    })}
                    <span>{e.mechanic}</span>
                  </div>
                </div>
                <div className="hunt-actions">
                  <button
                    disabled={!E.unlockedRegion(s, region)}
                    onClick={() => fight(e.id)}
                  >
                    {s.combat?.encounter === e.id ? "Restart" : "Fight"}
                  </button>
                  <button
                    className="text-button small"
                    onClick={() => setLootTarget({ encounter: e.id })}
                  >
                    Drop rates
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {(tab === "Dungeons" || tab === "Raids") && (
        <div className="adventure-list">
          <p>
            {tab === "Dungeons"
              ? "Saved multi-encounter runs. Each clear awards an egg, equipment and relics."
              : "Solo endgame gauntlets with unique mechanics. Your run is saved when you close the game."}
          </p>
          {ADVENTURES.filter(
            (a) => a.kind === (tab === "Dungeons" ? "dungeon" : "raid"),
          ).map((a) => (
            <article className="panel adventure-row" key={a.id}>
              <div>
                <span className="eyebrow">
                  {a.nodes.length} ENCOUNTERS · REGION {a.region + 1}
                </span>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
                <small>
                  {a.cost.toLocaleString()} gold entry ·{" "}
                  {s.unlocks.includes(a.id)
                    ? "Previously cleared"
                    : "First clear available"}
                </small>
                <button
                  className="text-button small"
                  onClick={() => setLootTarget({ adventure: a.id })}
                >
                  Completion drops
                </button>
              </div>
              <button
                disabled={
                  !E.unlockedRegion(s, a.region) || E.D(s.gold).lt(a.cost)
                }
                onClick={() => fight(a.nodes[0], a.id)}
              >
                {E.unlockedRegion(s, a.region)
                  ? "Enter"
                  : `Region ${a.region + 1}`}
              </button>
            </article>
          ))}
        </div>
      )}
      {lootTarget && (
        <LootSheet
          s={s}
          target={lootTarget}
          close={() => setLootTarget(null)}
        />
      )}
      <details className="combat-help">
        <summary>How combat works</summary>
        <p>
          Creatures act when their blue timer fills. Signature abilities follow
          your priority order; gray cooldown bars show when they return. Green
          HP and blue shields show survival. Damage projectiles use the
          attacker’s element; green motes heal allies.
        </p>
        <p>
          Fire → Nature → Earth → Storm → Water → Fire. Advantage deals 1.25×
          damage; disadvantage deals 0.75×. Other matchups are neutral. Change
          priorities by tapping your creature.
        </p>
      </details>
    </div>
  );
}
type Visual = {
  id: number;
  actor: string;
  target: string;
  kind: string;
  amount: string;
  element: Element;
  x: number;
  y: number;
  tx: number;
  ty: number;
  angle: number;
  delay: number;
  label?: string;
  critical: boolean;
};
export function Battle({
  s,
  onDetail,
}: {
  s: Save;
  onDetail: (id: string) => void;
}) {
  const b = s.combat!;
  const arena = useRef<HTMLDivElement>(null),
    nodes = useRef(new Map<string, HTMLButtonElement>()),
    last = useRef(Math.max(0, b.eventNo - 4)),
    lastActions = useRef(new Map<string, number>()),
    timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [visuals, setVisuals] = useState<Visual[]>([]),
    [units, setUnits] = useState(() => structuredClone(b.units)),
    [announcements, setAnnouncements] = useState<Record<string, string>>({});
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );
  useEffect(() => {
    if (b.eventNo < last.current) last.current = 0;
    const batch = b.events.filter(
      (e) => e.id > last.current && s.time - e.time < 1100,
    );
    last.current = b.eventNo;
    const bounds = arena.current?.getBoundingClientRect();
    const incoming: Visual[] = [];
    const labels: Record<string, string> = {};
    for (const e of batch) {
      const source = b.units.find((u) => u.id === e.actor),
        target = b.units.find((u) => u.id === e.target);
      if (!source || !target) continue;
      lastActions.current.set(e.actor, e.time);
      if (e.kind === "ability") {
        labels[e.actor] = e.label || "Ability";
        continue;
      }
      if (["critical", "crucible"].includes(e.kind)) continue;
      const a = nodes.current.get(e.actor)?.getBoundingClientRect(),
        z = nodes.current.get(e.target)?.getBoundingClientRect();
      if (!bounds || !a || !z) continue;
      const x = a.left + a.width / 2 - bounds.left,
        y = a.top + a.height * 0.4 - bounds.top,
        tx = z.left + z.width / 2 - bounds.left,
        ty = z.top + z.height * 0.4 - bounds.top;
      incoming.push({
        id: e.id,
        actor: e.actor,
        target: e.target,
        kind: e.kind,
        amount: e.amount,
        element: FAMILY[source.family].element,
        x,
        y,
        tx,
        ty,
        angle: (Math.atan2(ty - y, tx - x) * 180) / Math.PI,
        delay: Math.min(
          180,
          incoming.filter((v) => v.actor === e.actor).length * 45,
        ),
        label: e.label,
        critical: batch.some(
          (v) =>
            v.kind === "critical" &&
            v.actor === e.actor &&
            v.target === e.target,
        ),
      });
    }
    if (Object.keys(labels).length) {
      setAnnouncements((old) => ({ ...old, ...labels }));
      later(() => setAnnouncements({}), 1000);
    }
    if (incoming.length) {
      setVisuals((old) => [...old, ...incoming].slice(-40));
      const ids = new Set(incoming.map((v) => v.id));
      later(() => setVisuals((old) => old.filter((v) => !ids.has(v.id))), 1150);
      const snapshot = structuredClone(b.units);
      later(() => setUnits(snapshot), 470);
    } else setUnits(structuredClone(b.units));
  }, [b.eventNo, b.encounter, b.nextBattle]);
  const card = (u: CombatUnit) => {
    const f = FAMILY[u.family],
      own = s.creatures.find((c) => c.id === u.id),
      time = Math.max(0, u.next - s.time),
      interval = Math.max(750, 6000 / (1 + E.D(u.spe).div(100).toNumber())),
      start = lastActions.current.get(u.id) ?? u.next - interval,
      progress = Math.max(
        0,
        Math.min(1, (s.time - start) / Math.max(1, u.next - start)),
      );
    return (
      <button
        key={u.id}
        ref={(el) => {
          if (el) nodes.current.set(u.id, el);
          else nodes.current.delete(u.id);
        }}
        data-unit={u.id}
        data-enemy={u.enemy}
        className={`battle-unit ${E.D(u.hp).lte(0) ? "fallen" : ""} ${u.enemy ? "opponent" : "companion"}`}
        onClick={() => {
          if (!u.enemy) onDetail(u.id);
        }}
        aria-label={`${f.names[u.stage - 1]}, ${u.enemy ? "enemy" : "ally"}, ${E.fmt(u.hp)} HP`}
      >
        <div className="unit-art">
          <Sigil
            family={u.family}
            stage={u.stage}
            color={own?.color}
            effect={own?.effect}
          />
          {announcements[u.id] && (
            <span className="ability-caption">{announcements[u.id]}</span>
          )}
          {E.D(u.shield).gt(0) && (
            <>
              <div className="shield-aura" />
              <span className="shield-readout">
                <Shield size={8} />
                {E.fmt(u.shield)}
              </span>
            </>
          )}
        </div>
        <strong>{own ? name(own) : f.names[u.stage - 1]}</strong>
        <div className="hp-line">
          <div className="health">
            <i
              style={{
                width: `${E.D(u.hp).div(u.maxHp).mul(100).toNumber()}%`,
              }}
            />
          </div>
          <small title={`${E.fmt(u.hp)} / ${E.fmt(u.maxHp)} HP`}>
            {E.D(u.hp).lte(0) ? "Down" : E.fmt(u.hp)}
          </small>
        </div>
        <div
          className="action-meter"
          title={`Next action in ${duration(time)}`}
        >
          <i
            style={{
              width: `${progress * 100}%`,
              transition: "width .45s linear",
            }}
          />
        </div>
        <div className="cooldown-pips" aria-label="Ability cooldowns">
          {f.abilities.slice(0, u.stage).map((a, i) => (
            <i
              key={a.id}
              className={u.cd[i] <= s.time ? "ready" : ""}
              title={`${a.name}: ${u.cd[i] <= s.time ? "ready" : duration(u.cd[i] - s.time)}`}
            />
          ))}
          {u.statuses
            .filter((st) => st.until > s.time && st.kind !== "shieldExpiry")
            .slice(0, 2)
            .map((st) => (
              <span title={st.kind} key={st.kind}>
                {st.kind === "stun"
                  ? "⏸"
                  : st.kind === "dot"
                    ? "●"
                    : st.kind === "slow"
                      ? "↓"
                      : "◆"}
              </span>
            ))}
        </div>
      </button>
    );
  };
  const line = (enemy: boolean, front: boolean) => {
    const list = units
      .filter((u) => u.enemy === enemy && u.slot < 3 === front)
      .sort((a, b) => a.slot - b.slot);
    if (!list.length)
      return (
        <div
          className="vacant-rank"
          aria-label={enemy ? "Empty enemy back row" : "Empty ally back row"}
        >
          <span />
        </div>
      );
    return (
      <div
        className={`battle-rank ${enemy ? "enemy" : "friendly"} ${front ? "front" : "back"}`}
      >
        {[0, 1, 2].map((n) => {
          const u = list.find((u) => u.slot % 3 === n);
          return u ? (
            card(u)
          ) : (
            <div className="vacant-position" key={n}>
              <span />
            </div>
          );
        })}
      </div>
    );
  };
  const latest = b.events
    .filter(
      (e) => e.kind === "ability" || e.kind === "damage" || e.kind === "heal",
    )
    .slice(-3)
    .reverse();
  return (
    <>
      <div
        className={`battlefield battle-stage ${visuals.some((v) => v.critical) ? "critical-flash" : ""}`}
        ref={arena}
        data-total-events={b.eventNo}
        data-projectiles={visuals.filter((v) => v.actor !== v.target).length}
      >
        <div className="arena-top">
          <span>
            <i className={b.defeats ? "" : "live-dot"} />
            {b.defeats ? "DEFEATED" : b.nextBattle ? "NEXT WAVE" : "LIVE"}
          </span>
          <small>
            {ENCOUNTER[b.encounter].mechanic} · Enemy Lv{" "}
            {ENCOUNTER[b.encounter].level}
          </small>
        </div>
        <div className="team-half opposition">
          {line(true, false)}
          {line(true, true)}
        </div>
        <div className="arena-center">
          <span />
          <Swords size={17} />
          <span />
        </div>
        <div className="team-half player">
          {line(false, true)}
          {line(false, false)}
        </div>
        <div className="rank-caption">
          <span>YOUR FRONTLINE ↑</span>
          <span>BACKLINE ↓</span>
        </div>
        <div className="projectile-layer" aria-hidden="true">
          {s.settings.motion &&
            visuals.map((v) => (
              <React.Fragment key={v.id}>
                {v.actor !== v.target && (
                  <i
                    className={`projectile ${v.element.toLowerCase()} ${v.kind === "heal" ? "healing" : v.kind === "shield" ? "warding" : ""}`}
                    data-actor={v.actor}
                    data-target={v.target}
                    style={
                      {
                        "--sx": `${v.x}px`,
                        "--sy": `${v.y}px`,
                        "--tx": `${v.tx}px`,
                        "--ty": `${v.ty}px`,
                        "--angle": `${v.angle}deg`,
                        animationDelay: `${v.delay}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <b />
                  </i>
                )}
                <i
                  className={`impact ${v.element.toLowerCase()} ${v.kind} ${v.critical ? "critical" : ""}`}
                  style={{
                    left: v.tx,
                    top: v.ty,
                    animationDelay: `${v.actor === v.target ? 0 : 450 + v.delay}ms`,
                  }}
                >
                  <b />
                  <span>
                    {v.kind === "damage"
                      ? (v.critical ? "CRIT " : "") + E.fmt(v.amount)
                      : v.kind === "heal"
                        ? "+" + E.fmt(v.amount)
                        : v.kind === "shield"
                          ? "Shield"
                          : v.kind === "dot"
                            ? "Burn"
                            : v.kind === "slow"
                              ? "Slowed"
                              : v.kind}
                  </span>
                </i>
              </React.Fragment>
            ))}
        </div>
        {b.defeats > 0 && (
          <div className="battle-result">
            <Shield />
            <h3>Your team is recovering</h3>
            <p>
              {duration(
                Math.max(
                  ...s.creatures
                    .filter((c) => s.combatTeam.includes(c.id))
                    .map((c) => c.recoveryUntil),
                ) - s.time,
              )}{" "}
              remaining. Earned rewards stay.
            </p>
          </div>
        )}
      </div>
      <div className="battle-feed" aria-label="Recent combat actions">
        {latest.map((e) => {
          const a = b.units.find((u) => u.id === e.actor),
            t = b.units.find((u) => u.id === e.target);
          return (
            <div key={e.id}>
              <span className={a ? FAMILY[a.family].element.toLowerCase() : ""}>
                ●
              </span>
              <small>
                {a ? FAMILY[a.family].names[a.stage - 1] : "Creature"}{" "}
                {e.kind === "ability"
                  ? `used ${e.label}`
                  : e.kind === "heal"
                    ? `healed ${t ? FAMILY[t.family].names[t.stage - 1] : "ally"} +${E.fmt(e.amount)}`
                    : `hit ${t ? FAMILY[t.family].names[t.stage - 1] : "target"} for ${E.fmt(e.amount)}`}
              </small>
            </div>
          );
        })}
        {!latest.length && (
          <small>
            Action timers are filling. Your creatures attack automatically.
          </small>
        )}
      </div>
    </>
  );
}
export function SkillsScreen({
  s,
  act,
  onTeam,
  go,
  onWorkflow,
}: {
  s: Save;
  act: Act;
  onTeam: () => void;
  go: (page: string) => void;
  onWorkflow: () => void;
}) {
  const [skill, setSkill] = useState<Skill>(
      s.skillJob ? ACTIVITY[s.skillJob.activity].skill : "Woodcutting",
    ),
    [locked, setLocked] = useState(false);
  const activities = ACTIVITIES.filter((a) => a.skill === skill);
  const start = (aid: string) =>
    act((s) => {
      if (!s.skillTeam.length) {
        const c = s.creatures.find((c) => E.free(s, c));
        if (!c)
          throw Error(
            "Hatch a second creature or move a free creature to Work. Combat and breeding creatures are unavailable.",
          );
        E.assign(s, c.id, "skill");
      }
      E.startSkill(s, aid);
    });
  return (
    <div className="skills-screen">
      <div className="screen-toolbar">
        <label>
          Skill
          <select
            aria-label="Choose skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value as Skill)}
          >
            {SKILLS.filter((k) => k !== "Slayer").map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <span className="tag">Lv {s.skills[skill].level}</span>
        <button className="secondary small" onClick={onTeam}>
          <Users size={14} />
          {s.skillTeam.length}/6 Crew
        </button>
        <button className="text-button small" onClick={() => go("Slayer")}>
          Slayer →
        </button>
      </div>
      <section className="panel work-status">
        <div>
          <span className="eyebrow">
            {s.skillJob ? "WORKING NOW" : "CREW IDLE"}
          </span>
          <h2>
            {s.skillJob
              ? ACTIVITY[s.skillJob.activity].name
              : "Choose an activity below"}
          </h2>
          <p>
            {s.skillJob
              ? `${ACTIVITY[s.skillJob.activity].skill} · ${duration(s.skillJob.finish - s.time)} to next output · ${s.activity ? "Repeating" : "Finishing reserved cycle"}`
              : "One activity runs at a time. A separate crew lets combat continue."}
          </p>
        </div>
        {s.skillJob && (
          <button
            className="secondary small"
            onClick={() => act(E.pauseSkill)}
            disabled={!s.activity}
          >
            <Pause size={14} />
            Pause
          </button>
        )}
      </section>
      <Crew s={s} team="skill" onEdit={onTeam} />
      <div className="skill-progress">
        <div>
          <strong>{skill} XP</strong>
          <small>
            {E.fmt(s.skills[skill].xp)} /{" "}
            {E.fmt(E.xpNext(s.skills[skill].level))}
          </small>
        </div>
        <div className="progress">
          <i
            style={{
              width: `${E.D(s.skills[skill].xp).div(E.xpNext(s.skills[skill].level)).mul(100).toNumber()}%`,
            }}
          />
        </div>
        <small>
          {E.skillMilestones(s.skills[skill].level)} permanent milestones · +
          {(E.teamBonus(s, skill) * 100).toFixed(0)}% team efficiency
        </small>
      </div>
      <div className="section-heading">
        <h3>Activities & recipes</h3>
        <label className="switch">
          <input
            type="checkbox"
            checked={locked}
            onChange={(e) => setLocked(e.target.checked)}
          />
          Show locked
        </label>
      </div>
      <div className="work-list">
        {activities
          .filter((a) => locked || a.level <= s.skills[skill].level)
          .map((a) => (
            <article
              className={`work-row ${s.activity === a.id ? "selected" : ""}`}
              key={a.id}
            >
              <div className="work-tier">{a.tier + 1}</div>
              <div>
                <h3>{a.name}</h3>
                <small>
                  {Object.entries(a.outputs)
                    .map(([k, v]) => `${v} ${resource(k)}`)
                    .join(" + ")}{" "}
                  · {E.activityDuration(s, a.id).toFixed(1)}s · {a.xp} XP
                </small>
                {a.skill === "Foraging" && (
                  <small className="forage-chance">
                    Egg discovery: {percent(E.foragingEggChance(s, a.id))} /
                    cycle
                  </small>
                )}
                {Object.keys(a.inputs).length > 0 && (
                  <div className="recipe-inputs">
                    {Object.entries(a.inputs).map(([k, v]) => (
                      <span
                        className={E.amount(s, k).gte(v) ? "" : "short"}
                        key={k}
                      >
                        {v} {resource(k)} ({E.fmt(s.inventory[k] || 0)})
                      </span>
                    ))}
                  </div>
                )}
                <details>
                  <summary>
                    {a.skill === "Foraging"
                      ? "Egg odds & mastery"
                      : "Mastery & queue"}
                  </summary>
                  <p>
                    {a.skill === "Foraging" && (
                      <>
                        Egg discovery: {percent(E.foragingEggChance(s, a.id))}{" "}
                        per completed cycle, shared across{" "}
                        {
                          FAMILIES.filter(
                            (f) => f.region <= Math.min(9, a.tier),
                          ).length
                        }{" "}
                        eligible families.
                        <br />
                      </>
                    )}
                    Mastery {s.mastery[a.id]?.level || 1} ·{" "}
                    {E.fmt(s.mastery[a.id]?.xp || 0)} XP. Required skill level{" "}
                    {a.level}. Each completion shares {a.creatureXp} creature XP
                    across your crew.
                  </p>
                  <button
                    className="secondary small"
                    disabled={
                      s.facilities.Workshop < 3 ||
                      a.level > s.skills[skill].level
                    }
                    onClick={() =>
                      act((s) => {
                        s.queue.push(a.id);
                      })
                    }
                  >
                    Add to queue (Workshop 3)
                  </button>
                </details>
              </div>
              <button
                disabled={
                  a.level > s.skills[skill].level ||
                  !E.canPay(s, a.inputs) ||
                  (!!s.skillJob && s.skillJob.activity !== a.id)
                }
                onClick={() => start(a.id)}
              >
                {a.level > s.skills[skill].level
                  ? `Lv ${a.level}`
                  : s.activity === a.id
                    ? "Active"
                    : !s.skillTeam.length
                      ? "Assign & start"
                      : "Start"}
              </button>
            </article>
          ))}
      </div>
      {!locked && activities.some((a) => a.level > s.skills[skill].level) && (
        <button className="text-button" onClick={() => setLocked(true)}>
          Next unlock:{" "}
          {activities.find((a) => a.level > s.skills[skill].level)?.name} at Lv{" "}
          {activities.find((a) => a.level > s.skills[skill].level)?.level} →
        </button>
      )}
      <details className="panel compact-details">
        <summary>
          <Settings2 size={14} />
          Queues, workflows & milestones
        </summary>
        <p>
          Reserved cycles finish before the crew can change. All activity
          mastery is individual. Skill milestones at 25, 50, 100, 250, 500 and
          beyond permanently improve speed.
        </p>
        {s.queue.length > 0 && (
          <p>
            Queue: {s.queue.map((id) => ACTIVITY[id].name).join(" → ")}{" "}
            <button
              className="text-button"
              onClick={() =>
                act((s) => {
                  s.queue = [];
                })
              }
            >
              Clear queue
            </button>
          </p>
        )}
        <button
          className="secondary small"
          disabled={s.facilities.Workshop < 6}
          onClick={onWorkflow}
        >
          Edit workflows (Workshop 6)
        </button>
      </details>
    </div>
  );
}

function percent(chance: number) {
  return `${(chance * 100).toLocaleString(undefined, { maximumFractionDigits: chance < 0.00001 ? 7 : 5 })}%`;
}
function LootSheet({
  s,
  target,
  close,
}: {
  s: Save;
  target: { encounter?: string; adventure?: string };
  close: () => void;
}) {
  const en = target.encounter ? ENCOUNTER[target.encounter] : null,
    adv = target.adventure
      ? ADVENTURES.find((a) => a.id === target.adventure)
      : null;
  const drops = en ? E.encounterDrops(s, en.id) : null;
  const completion = adv ? E.adventureDrops(s, adv.id) : null;
  const families = adv ? FAMILIES.filter((f) => f.region <= adv.region) : [];
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="modal loot-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Drop rates"
      >
        <button
          className="modal-close icon-button"
          aria-label="Close drops"
          onClick={close}
        >
          <X />
        </button>
        <span className="eyebrow">ACTUAL LOOT ODDS</span>
        <h2>{en?.name || adv?.name}</h2>
        <p>
          {en
            ? "Rates are per victorious encounter, including all enemies. Egg and equipment rolls are independent."
            : completion?.first
              ? "First clear: an egg and equipment are guaranteed. Gold and relics remain guaranteed on repeat clears."
              : "Repeat clear: eggs and equipment are independent chance drops. Gold and relics remain guaranteed. Each encounter also rolls normal loot."}
        </p>
        {drops && (
          <>
            <div className="loot-summary">
              <div>
                <small>ANY EGG</small>
                <strong>{percent(drops.eggs)}</strong>
              </div>
              <div>
                <small>ANY EQUIPMENT</small>
                <strong>{percent(drops.gear)}</strong>
              </div>
              <div>
                <small>GOLD</small>
                <strong>{drops.gold}</strong>
              </div>
            </div>
            <p className="tiny muted">
              Your current combat gear contributes +
              {(drops.luck * 100).toFixed(2)}% to base egg/equipment chance. Egg
              chance caps at 0.5%; equipment at 0.8%. No kills guarantee a
              future rare drop.
            </p>
            <h3>Eggs by family</h3>
            {drops.families.map((f) => (
              <div className="loot-row" key={f.family}>
                <span>{FAMILY[f.family].names[0]} egg</span>
                <strong>{percent(f.chance)}</strong>
              </div>
            ))}
            <h3>Guaranteed rewards</h3>
            <div className="loot-row">
              <span>Creature XP pool, shared across the team</span>
              <strong>{drops.creatureXP}</strong>
            </div>
            {drops.materials.map((m) => (
              <div className="loot-row" key={m.id}>
                <span>
                  {resource(m.id)} ×{m.min}–{m.max}
                </span>
                <strong>100%</strong>
              </div>
            ))}
            <div className="loot-row">
              <span>Hunt Trophy {en!.region + 1} ×1</span>
              <strong>100%</strong>
            </div>
            {drops.catalyst > 0 && (
              <div className="loot-row">
                <span>{resource("catalyst")} ×1</span>
                <strong>100%</strong>
              </div>
            )}
            {drops.relic > 0 && (
              <div className="loot-row">
                <span>{resource("relic")} ×1</span>
                <strong>{percent(drops.relic)}</strong>
              </div>
            )}
            {en!.kind === "boss" && !s.unlocks.includes(en!.id) && (
              <p className="first-clear-note">
                First clear also grants one Rare Essence, once. The repeatable
                equipment roll below is separate.
              </p>
            )}
            <h3>Equipment rarity</h3>
            <table className="loot-table">
              <thead>
                <tr>
                  <th>Rarity</th>
                  <th>Per victory</th>
                  <th>Given an item</th>
                </tr>
              </thead>
              <tbody>
                {drops.rarities.map((r) => (
                  <tr key={r.rarity}>
                    <td>{RARITIES[r.rarity]}</td>
                    <td>{percent(r.chance)}</td>
                    <td>{percent(r.conditional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tiny muted">
              Essence, Gem and Trinket are equally likely: one-third of the
              equipment chance each. Rarity and slot are independent.
            </p>
          </>
        )}
        {adv && (
          <>
            <div className="loot-summary">
              <div>
                <small>COMPLETION EGG</small>
                <strong>{percent(completion!.eggs)}</strong>
              </div>
              <div>
                <small>{adv.kind === "raid" ? "LEGENDARY" : "EPIC"} ITEM</small>
                <strong>{percent(completion!.gear)}</strong>
              </div>
              <div>
                <small>RELICS</small>
                <strong>{adv.kind === "raid" ? 5 : 2}</strong>
              </div>
            </div>
            <div className="loot-row">
              <span>Completion gold (before entry cost)</span>
              <strong>{(adv.cost * 2).toLocaleString()}</strong>
            </div>
            <p>
              {completion!.first
                ? "First clear guarantees one equipment piece:"
                : "If equipment drops, its rarity is"}{" "}
              {adv.kind === "raid" ? "Legendary" : "Epic"} rarity, with an equal
              33.333% chance of Essence, Gem or Trinket.
            </p>
            <details>
              <summary>
                Eligible egg families · {percent(1 / families.length)} each
              </summary>
              {families.map((f) => (
                <div className="loot-row" key={f.id}>
                  <span>{f.names[0]}</span>
                  <strong>{percent(1 / families.length)}</strong>
                </div>
              ))}
            </details>
            <h3>Encounter loot</h3>
            {adv.nodes.map((id, i) => {
              const d = E.encounterDrops(s, id);
              return (
                <div className="loot-row" key={i}>
                  <span>
                    {i + 1}. {ENCOUNTER[id].name}
                  </span>
                  <small>
                    Egg {percent(d.eggs)} · Gear {percent(d.gear)}
                  </small>
                </div>
              );
            })}
          </>
        )}
        <details>
          <summary>Variant chances inside a wild/reward egg</summary>
          <p>
            These rolls happen when the egg is created. They are separate from
            the chance of obtaining an egg.
          </p>
          {[
            ["Inverted", 0.005],
            ["Prismatic", 0.005],
            ["Sparkling", 0.005],
            ["Glowing", 0.005],
            ["Any rare appearance", 1 - 0.99 ** 2],
            ["Any dual rare combination", 0.0001],
            ["One specific dual combination", 0.000025],
          ].map(([label, p]) => (
            <div className="loot-row" key={label as string}>
              <span>{label}</span>
              <strong>{percent(p as number)}</strong>
            </div>
          ))}
          <p className="tiny muted">
            Color and effect roll independently. Breeding uses the selected
            parents’ inheritance chances.
          </p>
        </details>
        <button className="secondary" onClick={close}>
          Back to combat
        </button>
      </section>
    </div>
  );
}

export function EquipmentScreen({
  s,
  act,
  go,
  confirm,
  onRules,
}: {
  s: Save;
  act: Act;
  go: (page: string) => void;
  confirm: Confirm;
  onRules: () => void;
}) {
  const [query, setQuery] = useState(""),
    [slot, setSlot] = useState("All"),
    [rarity, setRarity] = useState("All"),
    [sort, setSort] = useState("Rarity"),
    [filter, setFilter] = useState("All"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string[]>([]),
    [detail, setDetail] = useState<string | null>(null);
  useEffect(() => setPage(0), [query, slot, rarity, filter, sort]);
  const order = new Map(s.items.map((item, n) => [item.id, n]));
  const items = s.items
    .filter(
      (i) =>
        (slot === "All" || i.slot === slot) &&
        (rarity === "All" || String(i.rarity) === rarity) &&
        (
          i.slot +
          " " +
          RARITIES[i.rarity] +
          " " +
          i.affixes
            .map((a) => a.key + " " + (GEAR_NAMES[a.key] || a.key))
            .join(" ")
        )
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "All" ||
          (filter === "Equipped" && E.equipped(s, i)) ||
          (filter === "Locked" && i.locked) ||
          (filter === "Favorites" && i.favorite)),
    )
    .sort((a, b) =>
      sort === "Upgrade"
        ? b.level - a.level
        : sort === "Rarity"
          ? b.rarity - a.rarity
          : sort === "Newest"
            ? order.get(b.id)! - order.get(a.id)!
            : E.D(E.itemStats(b)[sort] || 0).cmp(E.itemStats(a)[sort] || 0),
    );
  const item = s.items.find((i) => i.id === detail);
  const compared = s.items.filter((i) => selected.includes(i.id));
  const salvageable = compared
    .filter((i) => !i.locked && !E.equipped(s, i))
    .map((i) => i.id);
  return (
    <div className="gear-screen">
      <div className="gear-filters">
        <input
          aria-label="Search equipment"
          placeholder="Search gear or a stat…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Equipment slot"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
        >
          {["All", "Essence", "Gem", "Trinket"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Equipment rarity"
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          <option value="All">All rarities</option>
          {RARITIES.map((v, i) => (
            <option value={i} key={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="screen-toolbar">
        <span className="tiny muted">
          {items.length} items · {selected.length} selected
        </span>
        <div className="button-row">
          <button className="secondary small" onClick={onRules}>
            Auto-salvage
          </button>
          <details className="gear-sort">
            <summary>Sort & filter</summary>
            <label>
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {[
                  "Rarity",
                  "Upgrade",
                  "Newest",
                  ...Object.keys(GEAR_NAMES),
                ].map((v) => (
                  <option value={v} key={v}>
                    {GEAR_NAMES[v] || v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Show
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["All", "Equipped", "Locked", "Favorites"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </details>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="selection-toolbar">
          <button
            className="danger secondary small"
            onClick={() =>
              confirm(
                "Salvage selected gear?",
                "Equipped and locked items are protected. Upgraded items return only their original salvage value. Invested materials are lost.",
                () =>
                  act((s) => {
                    E.salvage(s, salvageable);
                    setSelected([]);
                  }),
              )
            }
          >
            Salvage {salvageable.length}
          </button>
          <button className="text-button small" onClick={() => setSelected([])}>
            Clear selection
          </button>
          <small>Select exactly two items to compare.</small>
        </div>
      )}
      {compared.length === 2 && (
        <div className="panel gear-compare">
          <h3>Compare equipment</h3>
          <table className="loot-table">
            <thead>
              <tr>
                <th>Stat</th>
                {compared.map((i) => (
                  <th key={i.id}>
                    {i.slot} +{i.level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ...new Set(
                  compared.flatMap((i) => i.affixes.map((a) => a.key)),
                ),
              ].map((k) => (
                <tr key={k}>
                  <td>{GEAR_NAMES[k] || k}</td>
                  {compared.map((i) => (
                    <td key={i.id}>{E.fmt(E.itemStats(i)[k] || 0, 2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="gear-list">
        {items.slice(page * 30, page * 30 + 30).map((i) => {
          const owner = s.creatures.find((c) =>
              Object.values(c.equipment).includes(i.id),
            ),
            stats = Object.entries(E.itemStats(i));
          return (
            <article className={`gear-row rarity-${i.rarity}`} key={i.id}>
              <input
                type="checkbox"
                aria-label={`Select ${RARITIES[i.rarity]} ${i.slot}`}
                checked={selected.includes(i.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, i.id]
                      : selected.filter((id) => id !== i.id),
                  )
                }
              />
              <button
                className="gear-open"
                aria-label={`Inspect ${RARITIES[i.rarity]} ${i.slot} +${i.level}`}
                onClick={() => setDetail(i.id)}
              >
                <span className="gear-symbol">
                  {i.slot === "Essence" ? (
                    <Flame size={22} />
                  ) : i.slot === "Gem" ? (
                    <Mountain size={22} />
                  ) : (
                    <Zap size={22} />
                  )}
                </span>
                <span>
                  <strong>
                    {RARITIES[i.rarity]} {i.slot} <b>+{i.level}</b>
                    {i.locked && " · Locked"}
                    {i.favorite && " ★"}
                  </strong>
                  <small>
                    {stats
                      .slice(0, 2)
                      .map(([k, v]) => `+${E.fmt(v, 1)} ${GEAR_NAMES[k] || k}`)
                      .join(" · ")}
                    {stats.length > 2 ? ` · +${stats.length - 2} more` : ""}
                  </small>
                  <small>
                    {owner
                      ? `Equipped: ${name(owner)}`
                      : i.slot === "Gem"
                        ? "Work bonuses"
                        : "In storage"}
                  </small>
                </span>
                <ChevronRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
      {!items.length && (
        <div className="panel empty-gear">
          <h3>
            {s.items.length
              ? "No matching equipment"
              : "Your first equipment drops from combat"}
          </h3>
          <p>
            Essence improves combat, Gems improve work, and Trinkets provide
            utility. Tap a piece to equip or upgrade it.
          </p>
          <button onClick={() => go("Combat")}>Find equipment</button>
        </div>
      )}
      <div className="screen-toolbar pager">
        <button
          className="secondary small"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <small>
          {Math.min(items.length, page * 30 + 1)}–
          {Math.min(items.length, page * 30 + 30)} of {items.length}
        </small>
        <button
          className="secondary small"
          disabled={(page + 1) * 30 >= items.length}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
      {item && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <section
            className={`modal gear-detail rarity-${item.rarity}`}
            role="dialog"
            aria-modal="true"
            aria-label="Equipment details"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close equipment"
              onClick={() => setDetail(null)}
            >
              <X />
            </button>
            <span className="eyebrow">{RARITIES[item.rarity]} EQUIPMENT</span>
            <h2>
              {item.slot} +{item.level}
            </h2>
            <div className="button-row">
              <button
                className="secondary small"
                onClick={() =>
                  act((s) => {
                    s.items.find((i) => i.id === item.id)!.locked =
                      !item.locked;
                  })
                }
              >
                {item.locked ? "Unlock" : "Lock"}
              </button>
              <button
                className="secondary small"
                onClick={() =>
                  act((s) => {
                    s.items.find((i) => i.id === item.id)!.favorite =
                      !item.favorite;
                  })
                }
              >
                {item.favorite ? "Unfavorite" : "Favorite"}
              </button>
            </div>
            {Object.entries(E.itemStats(item)).map(([k, v]) => (
              <div className="loot-row" key={k}>
                <span>{GEAR_NAMES[k] || k}</span>
                <strong>+{E.fmt(v, 2)}</strong>
              </div>
            ))}
            <h3>Equip</h3>
            {s.combat && (
              <p className="tiny muted">
                End your combat run to move equipment. You can still upgrade;
                new stats apply next encounter.
              </p>
            )}
            <select
              aria-label="Equip item on creature"
              disabled={!!s.combat}
              value={
                s.creatures.find((c) =>
                  Object.values(c.equipment).includes(item.id),
                )?.id || ""
              }
              onChange={(e) =>
                act((s) => {
                  if (e.target.value) E.equip(s, e.target.value, item.id);
                  else
                    for (const c of s.creatures)
                      if (c.equipment[item.slot] === item.id)
                        delete c.equipment[item.slot];
                })
              }
            >
              <option value="">In storage · unequipped</option>
              {s.creatures.map((c) => (
                <option value={c.id} key={c.id}>
                  {name(c)} · Lv {c.level}
                </option>
              ))}
            </select>
            <h3>Upgrade to +{item.level + 1}</h3>
            <p>
              {percent(E.upgradeChance(item.level + 1))} success. Failure spends
              materials but never destroys or downgrades this item.
            </p>
            <div className="recipe-inputs">
              {Object.entries(E.upgradeCost(item)).map(([k, v]) => (
                <span key={k} className={E.amount(s, k).gte(v) ? "" : "short"}>
                  {E.fmt(v)} {resource(k)} · {E.fmt(E.amount(s, k))} owned
                </span>
              ))}
            </div>
            <button
              disabled={
                !s.unlocks.includes("boss-0") ||
                !E.canPay(s, E.upgradeCost(item))
              }
              onClick={() => act((s) => E.upgradeItem(s, item.id))}
            >
              {s.unlocks.includes("boss-0")
                ? "Attempt upgrade"
                : "Defeat the first boss to upgrade"}
            </button>
            <details>
              <summary>Permanent milestones ({item.milestones.length})</summary>
              {item.milestones.map((m, i) => (
                <div className="loot-row" key={i}>
                  <span>
                    +{m.level} ·{" "}
                    {GEAR_NAMES[item.affixes[m.index].key] ||
                      item.affixes[m.index].key}
                  </span>
                  <strong>+{E.fmt(m.roll, 2)} initial bonus</strong>
                </div>
              ))}
              {!item.milestones.length && (
                <p>
                  A successful +10, +20 and every later multiple of ten
                  permanently boosts one existing stat.
                </p>
              )}
            </details>
            <h3>Salvage</h3>
            <p>
              Returns {E.fmt(E.salvageValue(item))}{" "}
              {resource(E.salvageMaterial(item))}. Upgrades do not increase the
              return.
            </p>
            <button
              className="danger secondary"
              disabled={item.locked || E.equipped(s, item)}
              onClick={() =>
                confirm(
                  "Salvage this equipment?",
                  "This permanently consumes the item. Invested upgrade materials are not refunded.",
                  () =>
                    act((s) => {
                      E.salvage(s, [item.id]);
                      setDetail(null);
                    }),
                )
              }
            >
              Salvage item
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
const GEAR_NAMES: Record<string, string> = {
  hp: "HP",
  atk: "Attack",
  def: "Defense",
  spa: "Special Attack",
  spd: "Special Defense",
  spe: "Speed",
  crit: "Critical chance",
  heal: "Healing",
  skillSpeed: "Work speed",
  yield: "Yield",
  xp: "Creature XP",
  luck: "Luck",
};

export function SlayerScreen({
  s,
  act,
  go,
  confirm,
}: {
  s: Save;
  act: Act;
  go: (page: string) => void;
  confirm: Confirm;
}) {
  const [locked, setLocked] = useState(false),
    [drop, setDrop] = useState<string | null>(null);
  const c = s.contract;
  const hunt = (id: string) => {
    const start = () => {
      act((s) => {
        if (s.combat) E.stopCombat(s);
        ensureCombat(s);
        E.startCombat(s, id);
      });
      go("Combat");
    };
    if (s.combat?.adventure)
      confirm(
        "Leave the current adventure?",
        "The unfinished run ends. Earned rewards stay.",
        start,
      );
    else start();
  };
  const progress = c
    ? c.kind === "retrieve"
      ? E.amount(s, c.item).toNumber()
      : c.progress
    : 0;
  return (
    <div className="slayer-screen">
      <div className="screen-toolbar">
        <span className="tag">Slayer Lv {s.skills.Slayer.level}</span>
        <span>{E.fmt(s.tokens)} tokens</span>
        <button className="secondary small" onClick={() => go("Shop:Slayer")}>
          Token shop
        </button>
      </div>
      {!s.unlocks.includes("boss-0") ? (
        <section className="panel">
          <h2>Meet the Slayer Master</h2>
          <p>
            Defeat {ENCOUNTER["boss-0"].name} in the first region to unlock
            contracts. You will always have one contract at a time.
          </p>
          <button onClick={() => go("Combat")}>Open combat</button>
        </section>
      ) : c ? (
        <section className="panel slayer-contract">
          <span className="eyebrow">YOUR ONE ACTIVE CONTRACT</span>
          <h2>
            {c.kind === "retrieve"
              ? "Collect hunt trophies"
              : c.kind === "elite"
                ? "Defeat elite enemies"
                : c.kind === "hunt"
                  ? "Complete a precise hunt"
                  : "Clear the region"}
          </h2>
          <p>
            {REGIONS[c.region]} ·{" "}
            {c.kind === "retrieve"
              ? `Turn in ${c.target} ${resource(c.item)}`
              : c.kind === "hunt"
                ? `Defeat enemies in ${ENCOUNTER[`wild-${c.region}-3`].name}`
                : c.kind === "elite"
                  ? "Boss or Slayer-exclusive enemy defeats count."
                  : "Any enemy defeats in this region count."}
          </p>
          <div className="progress">
            <i
              style={{
                width: `${Math.min(100, (progress / c.target) * 100)}%`,
              }}
            />
          </div>
          <div className="screen-toolbar">
            <strong>
              {Math.min(progress, c.target)} / {c.target}
            </strong>
            <small>
              {progress >= c.target
                ? "Ready to turn in"
                : "Offline combat counts too"}
            </small>
          </div>
          <div className="contract-reward">
            {c.reward} gold · {c.reward} XP · {E.slayerTokens(s, c.region)}{" "}
            tokens · 1 catalyst
          </div>
          <div className="button-row">
            {progress >= c.target ? (
              <button onClick={() => act(E.turnIn)}>Turn in & claim</button>
            ) : (
              <button
                onClick={() =>
                  hunt(
                    c.kind === "hunt"
                      ? `wild-${c.region}-3`
                      : c.kind === "elite"
                        ? s.skills.Slayer.level >= 1 + c.region * 15
                          ? `slayer-${c.region}`
                          : `boss-${c.region}`
                        : `wild-${c.region}-0`,
                  )
                }
              >
                Hunt contract targets
              </button>
            )}
            <button
              className="secondary"
              onClick={() =>
                confirm(
                  "Reroll this contract?",
                  `Spend ${100 + s.skills.Slayer.level * 10} gold. Current contract progress is lost.`,
                  () => act((s) => E.requestContract(s, true)),
                )
              }
            >
              Reroll · {100 + s.skills.Slayer.level * 10} gold
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>Choose your next assignment</h2>
          <p>
            Contracts reward XP, gold, tokens and evolution catalysts. Request
            one, fight its targets, then return to claim the reward.
          </p>
          <button onClick={() => act((s) => E.requestContract(s))}>
            Request a contract
          </button>
        </section>
      )}
      {s.unlocks.includes("boss-0") && (
        <>
          <div className="section-heading">
            <h3>Exclusive elder hunts</h3>
            <label className="switch">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
              />
              Show locked
            </label>
          </div>
          <div className="hunt-list">
            {ENCOUNTERS.filter(
              (e) =>
                e.kind === "slayer" &&
                (locked ||
                  (E.unlockedRegion(s, e.region) &&
                    s.skills.Slayer.level >= 1 + e.region * 15)),
            ).map((e) => (
              <article className="hunt-row" key={e.id}>
                <Sigil
                  family={e.families[0]}
                  stage={e.level >= 75 ? 3 : e.level >= 25 ? 2 : 1}
                />
                <div>
                  <h3>{e.name}</h3>
                  <small>
                    Enemy Lv {e.level} · Slayer {1 + e.region * 15}
                  </small>
                </div>
                <button
                  disabled={
                    !E.unlockedRegion(s, e.region) ||
                    s.skills.Slayer.level < 1 + e.region * 15
                  }
                  onClick={() => hunt(e.id)}
                >
                  Hunt
                </button>
                <button
                  className="text-button small"
                  onClick={() => setDrop(e.id)}
                >
                  Drop rates
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {drop && (
        <LootSheet
          s={s}
          target={{ encounter: drop }}
          close={() => setDrop(null)}
        />
      )}
      <details className="combat-help">
        <summary>Slayer milestones</summary>
        <p>
          {E.skillMilestones(s.skills.Slayer.level)} earned. Every milestone
          adds 5% to new contract gold/XP and 10% to token rewards. Milestones
          continue beyond levels 25, 50, 100, 250 and 500.
        </p>
      </details>
    </div>
  );
}

export function BreedingOdds({
  s,
  mother,
  father,
}: {
  s: Save;
  mother: string;
  father: string;
}) {
  const m = s.creatures.find((c) => c.id === mother),
    f = s.creatures.find((c) => c.id === father);
  if (!m || !f)
    return (
      <p className="tiny muted">
        Choose both parents to preview family and rare-variant probabilities.
      </p>
    );
  const color = E.variantOdds("color", [m, f]),
    effect = E.variantOdds("effect", [m, f]);
  const cp = color[0] + color[1],
    ep = effect[0] + effect[1];
  return (
    <details className="breeding-odds">
      <summary>Offspring family & variant odds</summary>
      <p>
        Per egg with these parents. Facilities speed up breeding but do not
        change these odds.
      </p>
      {E.breedingFamilyChances(m, f).map((v) => (
        <div className="loot-row" key={v.family}>
          <span>
            {s.discovered.some((d) => d.startsWith(v.family))
              ? FAMILY[v.family].names[0]
              : "Undiscovered family"}{" "}
            egg
          </span>
          <strong>{percent(v.chance)}</strong>
        </div>
      ))}
      {[
        ["Inverted", color[0]],
        ["Prismatic", color[1]],
        ["Sparkling", effect[0]],
        ["Glowing", effect[1]],
        ["Any rare variant", 1 - (1 - cp) * (1 - ep)],
        ["Any dual rare combination", cp * ep],
      ].map(([label, p]) => (
        <div className="loot-row" key={label as string}>
          <span>{label}</span>
          <strong>{percent(p as number)}</strong>
        </div>
      ))}
    </details>
  );
}
