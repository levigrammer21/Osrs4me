import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Swords,
  PawPrint,
  Pickaxe,
  Package,
  House,
  Diamond,
  ScrollText,
  BookOpen,
  ShoppingBag,
  Settings,
  Plus,
  ChevronRight,
  ArrowUpRight,
  Check,
  Lock,
  Star,
  Flame,
  Leaf,
  Mountain,
  Zap,
  Waves,
  Heart,
  Shield,
  Wind,
  Sparkles,
  Egg as EggIcon,
  Clock,
  Play,
  Pause,
  X,
  Menu,
  Cloud,
  CloudOff,
  Download,
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Save,
  Creature,
  Item,
  Skill,
  STATS,
  SKILLS,
  ELEMENTS,
  RARITIES,
  Slot,
  VERSION,
  Rule,
  WorkflowNode,
  Stat,
} from "./model";
import {
  FAMILIES,
  FAMILY,
  REGIONS,
  REGION_DETAILS,
  ACTIVITIES,
  ACTIVITY,
  ENCOUNTERS,
  ENCOUNTER,
  ADVENTURES,
  FACILITIES,
  FACILITY_INFO,
  MATERIALS,
  AFFIX_NAMES,
  JOURNAL,
  HYBRIDS,
} from "./content";
import * as E from "./engine";
import { Sigil } from "./portraits";
import {
  Dashboard,
  CombatScreen,
  SkillsScreen,
  ActivityStrip,
  EquipmentScreen,
  BreedingOdds,
  SlayerScreen,
  TeamDrawer,
} from "./interface";
import "./interface.css";
import { FarmHome, Nursery, WorkBoard } from "./farm";
import "./farm.css";
import {
  IdleNavigation,
  MobileMenu,
  IdleStatus,
  IdleDashboard,
  FarmManager,
  SkillWorkspace,
  Bank,
} from "./idle";
import "./idle.css";
import {
  watchAuth,
  google,
  emailLogin,
  recover,
  logout,
  localRead,
  localWrite,
  cloudRead,
  cloudWrite,
  downloadSave,
  importSave,
  serverClock,
  partitionSnapshot,
} from "./persistence";
const NAV = [
  ["Home", Home],
  ["Combat", Swords],
  ["Creatures", PawPrint],
  ["Skills", Pickaxe],
  ["Farm", House],
  ["Bank", Package],
  ["Equipment", Diamond],
  ["Slayer", ScrollText],
  ["Collection", BookOpen],
  ["Shop", ShoppingBag],
  ["Settings", Settings],
] as const;
const EICON = {
  Fire: Flame,
  Nature: Leaf,
  Earth: Mountain,
  Storm: Zap,
  Water: Waves,
};
const elementClass = (element: string) => element.toLowerCase();
const cname = (c: Creature) => c.name || FAMILY[c.family].names[c.stage - 1];
const pretty = (key: string) =>
  MATERIALS[key] || key.replace("trophy-", "Hunt Trophy ");
const timer = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 3600
    ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
    : s >= 60
      ? `${Math.floor(s / 60)}m ${s % 60}s`
      : `${s}s`;
};
function Progress({
  value,
  max = 1,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          {label}
          <span>{Math.min(100, (value / max) * 100).toFixed(0)}%</span>
        </div>
      )}
      <div className="progress">
        <i
          style={{
            width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
function Cost({ s, cost }: { s: Save; cost: Record<string, unknown> }) {
  return (
    <div className="cost">
      {Object.entries(cost).map(([k, v]) => (
        <span
          key={k}
          className={E.amount(s, k).gte(v as string) ? "" : "short"}
        >
          {E.fmt(v as string)} {pretty(k)}
        </span>
      ))}
    </div>
  );
}
function Empty({
  icon: Icon = EggIcon,
  title,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Icon size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Section({
  label,
  title,
  action,
  children,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          {label && <div className="eyebrow">{label}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
// Spread larger snapshots over time so collection growth does not silently
// multiply automatic write traffic. Manual saves remain available.
function cloudInterval(save: Save) {
  const pages = partitionSnapshot(JSON.stringify(save)).length;
  return Math.max(90000, Math.ceil(((pages * 2 + 1) * 86400000) / 10000));
}
function useGame() {
  const [s, setS] = useState<Save | null>(null),
    [user, setUser] = useState<{ uid: string; email: string | null } | null>(
      null,
    ),
    [status, setStatus] = useState("Opening sanctuary…"),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false),
    [busy, setBusy] = useState(true),
    [readonly, setReadonly] = useState(false);
  const ref = useRef<Save | null>(null),
    key = useRef("guest"),
    uid = useRef<string | null>(null),
    rev = useRef(0),
    ready = useRef(false),
    blocked = useRef(false),
    divergent = useRef(false),
    saving = useRef(false),
    audio = useRef<AudioContext | null>(null),
    clockOffset = useRef(0),
    nextCloud = useRef(0);
  const accountEpoch = useRef(0);
  const wallTime = () => Date.now() + clockOffset.current;
  const [toast, setToast] = useState("");
  // The engine owns its mutable state. A shallow render envelope avoids cloning
  // an unlimited equipment collection twice every second.
  const render = useCallback(
    () => setS(ref.current ? { ...ref.current } : null),
    [],
  );
  const notify = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 4500);
  }, []);
  const act = useCallback(
    (fn: (s: Save) => void) => {
      if (!ready.current || !ref.current || readonly || divergent.current)
        return;
      const original = structuredClone(ref.current);
      try {
        E.advance(ref.current, wallTime());
        fn(ref.current);
        render();
        void localWrite(key.current, ref.current).catch((e) =>
          setError("Local save failed: " + e.message),
        );
        if (ref.current.settings.sound) {
          try {
            audio.current ??= new AudioContext();
            const o = audio.current.createOscillator(),
              g = audio.current.createGain();
            o.connect(g);
            g.connect(audio.current.destination);
            o.frequency.value = 440;
            g.gain.setValueAtTime(0.025, audio.current.currentTime);
            g.gain.exponentialRampToValueAtTime(
              0.001,
              audio.current.currentTime + 0.1,
            );
            o.start();
            o.stop(audio.current.currentTime + 0.1);
          } catch {}
        }
      } catch (e) {
        ref.current = original;
        notify((e as Error).message);
      }
    },
    [readonly, render, notify],
  );
  const sync = useCallback(async () => {
    if (
      !uid.current ||
      !ref.current ||
      !ready.current ||
      saving.current ||
      conflict ||
      readonly
    )
      return;
    saving.current = true;
    setStatus("Saving to cloud…");
    const who = uid.current;
    const epoch = accountEpoch.current;
    try {
      const n = await cloudWrite(
        who,
        structuredClone(ref.current),
        rev.current,
      );
      if (
        uid.current === who &&
        ref.current &&
        accountEpoch.current === epoch
      ) {
        nextCloud.current = Date.now() + cloudInterval(ref.current);
        rev.current = n;
        ref.current.revision = n;
        await localWrite(key.current, ref.current);
        setStatus(
          "Cloud saved · " +
            new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
        );
      }
    } catch (e) {
      const message = (e as Error).message;
      if (message.includes("CLOUD_CONFLICT")) {
        divergent.current = true;
        setConflict(true);
      }
      setStatus("Saved on this device · cloud needs attention");
      setError(message);
    } finally {
      saving.current = false;
    }
  }, [conflict, readonly]);
  useEffect(() => {
    let cancelled = false;
    let worker: Worker | null = null;
    let generation = 0;
    const stop = watchAuth(async (u) => {
      const n = ++generation;
      accountEpoch.current++;
      ready.current = false;
      setBusy(true);
      setError("");
      setConflict(false);
      divergent.current = false;
      if (ref.current && !blocked.current)
        await localWrite(key.current, ref.current).catch(() => {});
      key.current = u ? `user:${u.uid}` : "guest";
      uid.current = u?.uid || null;
      clockOffset.current = 0;
      setUser(u ? { uid: u.uid, email: u.email } : null);
      try {
        const local = await localRead(key.current);
        let chosen = local;
        if (blocked.current) {
          ref.current = chosen || E.newSave();
          ready.current = false;
          render();
          setBusy(false);
          return;
        }
        rev.current = local?.revision || 0;
        if (u) {
          try {
            const remote = await cloudRead(u.uid);
            try {
              clockOffset.current = (await serverClock(u.uid)) - Date.now();
            } catch {
              /* Use the device clock until the next connection. */
            }
            rev.current = remote.revision;
            if (remote.save) {
              if (
                local &&
                local.revision === remote.revision &&
                local.time > remote.save.time
              )
                chosen = local;
              else if (
                local &&
                local.revision < remote.revision &&
                local.time > remote.save.time
              ) {
                chosen = local;
                divergent.current = true;
                setConflict(true);
                setError(
                  "Two saved timelines differ. Export this device’s save, then load the cloud timeline to continue.",
                );
              } else chosen = remote.save;
            }
          } catch (e) {
            setError("Cloud unavailable: " + (e as Error).message);
          }
        }
        if (cancelled || n !== generation) return;
        chosen ??= E.newSave();
        if (divergent.current) {
          ref.current = chosen;
          render();
          setBusy(false);
          setStatus("Save conflict · export this device or load cloud");
          return;
        }
        setStatus(u ? "Cloud connected" : "Device save · sign in for cloud");
        const target = wallTime();
        if (target - chosen.time > 10000) {
          worker?.terminate();
          worker = new Worker(
            new URL("./simulator-worker.ts", import.meta.url),
            { type: "module" },
          );
          worker.onmessage = async (event) => {
            if (cancelled || n !== generation) return;
            if (event.data.error) {
              setError(event.data.error);
              setBusy(false);
              return;
            }
            ref.current = event.data.save;
            ref.current!.revision = rev.current;
            ready.current = true;
            render();
            setBusy(false);
            await localWrite(key.current, ref.current!);
          };
          worker.onerror = () => {
            setError(
              "Offline settlement failed. Original checkpoint preserved. Reload to retry.",
            );
            setBusy(false);
          };
          worker.postMessage({ save: chosen, target });
        } else {
          ref.current = chosen;
          chosen.revision = rev.current;
          ready.current = true;
          render();
          setBusy(false);
        }
      } catch (e) {
        setError("Could not open save: " + (e as Error).message);
        setBusy(false);
      }
    });
    return () => {
      cancelled = true;
      stop();
      worker?.terminate();
    };
  }, [render]);
  useEffect(() => {
    let activeWorker: Worker | null = null;
    const t = setInterval(() => {
      if (ready.current && ref.current && !readonly && !conflict) {
        const target = wallTime();
        if (target - ref.current.time > 15000) {
          ready.current = false;
          setBusy(true);
          const worker = new Worker(
            new URL("./simulator-worker.ts", import.meta.url),
            { type: "module" },
          );
          activeWorker = worker;
          const epoch = accountEpoch.current;
          worker.onmessage = (event) => {
            worker.terminate();
            activeWorker = null;
            if (
              accountEpoch.current !== epoch ||
              blocked.current ||
              divergent.current
            )
              return;
            if (event.data.error) {
              setError(event.data.error);
              setBusy(false);
              return;
            }
            ref.current = event.data.save;
            ready.current = true;
            render();
            setBusy(false);
            void localWrite(key.current, ref.current!);
          };
          worker.onerror = () => {
            worker.terminate();
            setBusy(false);
            setError(
              "Offline simulation could not complete. The original checkpoint is retained.",
            );
          };
          worker.postMessage({ save: ref.current, target });
        } else {
          E.advance(ref.current, target);
          render();
        }
      }
    }, 500);
    const p = setInterval(() => {
      if (ready.current && ref.current && !readonly)
        void localWrite(key.current, ref.current).catch((e) =>
          setError(e.message),
        );
    }, 5000);
    return () => {
      clearInterval(t);
      clearInterval(p);
      activeWorker?.terminate();
    };
  }, [render, readonly, conflict]);
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() >= nextCloud.current) {
        nextCloud.current =
          Date.now() + (ref.current ? cloudInterval(ref.current) : 90000);
        void sync();
      }
    }, 15000);
    return () => clearInterval(t);
  }, [sync]);
  useEffect(() => {
    let release: (() => void) | undefined;
    let cancelled = false;
    if (navigator.locks) {
      navigator.locks.request(
        "creature-adventure-writer",
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            blocked.current = true;
            setReadonly(true);
            return;
          }
          await new Promise<void>((r) => {
            release = r;
            if (cancelled) r();
          });
        },
      );
    } else {
      const token = crypto.randomUUID();
      const check = () => {
        const other = localStorage.getItem("ca-writer");
        const [owner, expiry] = other?.split("|") || [];
        if (owner && owner !== token && Number(expiry) > Date.now()) {
          blocked.current = true;
          setReadonly(true);
          return;
        }
        blocked.current = false;
        localStorage.setItem("ca-writer", `${token}|${Date.now() + 7000}`);
        setReadonly(false);
      };
      check();
      const t = setInterval(check, 3000);
      release = () => {
        clearInterval(t);
        if (localStorage.getItem("ca-writer")?.startsWith(token))
          localStorage.removeItem("ca-writer");
      };
    }
    return () => {
      cancelled = true;
      release?.();
    };
  }, []);
  useEffect(() => {
    const hide = () => {
      if (ref.current && ready.current && !blocked.current)
        void localWrite(key.current, ref.current);
    };
    window.addEventListener("pagehide", hide);
    return () => window.removeEventListener("pagehide", hide);
  }, []);
  const reloadCloud = async () => {
    if (!uid.current) return;
    setBusy(true);
    try {
      const remote = await cloudRead(uid.current);
      if (!remote.save) throw Error("No cloud save available.");
      ref.current = remote.save;
      rev.current = remote.revision;
      ref.current.revision = remote.revision;
      E.advance(ref.current, wallTime(), true);
      await localWrite(key.current, ref.current);
      setConflict(false);
      divergent.current = false;
      ready.current = true;
      setError("");
      render();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  const replace = async (next: Save) => {
    if (divergent.current || blocked.current)
      throw Error(
        "Load the cloud timeline before importing a replacement save.",
      );
    next.revision = rev.current;
    ref.current = next;
    E.advance(next, wallTime(), true);
    await localWrite(key.current, next);
    render();
  };
  return {
    s,
    user,
    status,
    error,
    setError,
    busy,
    act,
    notify,
    toast,
    sync,
    conflict,
    reloadCloud,
    replace,
    readonly,
  };
}
export default function App() {
  const game = useGame(),
    { s, act } = game;
  const [page, setPage] = useState("Home"),
    [teamEditor, setTeamEditor] = useState<"combat" | "skill" | null>(null),
    [farmTab, setFarmTab] = useState("Overview"),
    [workFocus, setWorkFocus] = useState<string | undefined>(undefined),
    [workJump, setWorkJump] = useState(0),
    [shopTab, setShopTab] = useState("Supplies"),
    [detail, setDetail] = useState<string | null>(null),
    [formPreview, setFormPreview] = useState<string | null>(null),
    [modal, setModal] = useState<{
      title: string;
      text: string;
      run: () => void;
    } | null>(null),
    [authModal, setAuthModal] = useState(false),
    [query, setQuery] = useState(""),
    [element, setElement] = useState("All"),
    [collectionFilter, setCollectionFilter] = useState("All"),
    [collectionPage, setCollectionPage] = useState(0),
    [sort, setSort] = useState("Newest"),
    [selectedCreatures, setSelectedCreatures] = useState<string[]>([]),
    [ruleType, setRuleType] = useState<"release" | "salvage">("release"),
    [showRules, setShowRules] = useState(false),
    [workflows, setWorkflows] = useState(false),
    [creatureFilter, setCreatureFilter] = useState("Any companion"),
    [minIV, setMinIV] = useState(0),
    [creaturePage, setCreaturePage] = useState(0);
  useEffect(() => {
    setCreaturePage(0);
  }, [query, element, creatureFilter, minIV, sort]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const dialogs = [
        ...document.querySelectorAll<HTMLElement>('[role="dialog"]'),
      ];
      const top = dialogs.at(-1);
      if (!top) return;
      const controls = [
        ...top.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],summary",
        ),
      ].filter((el) => el.getClientRects().length);
      if (e.key === "Escape") {
        const close =
          top.querySelector<HTMLButtonElement>(".modal-close") ||
          [...top.querySelectorAll<HTMLButtonElement>("button")].find(
            (b) => b.textContent?.trim() === "Cancel",
          );
        close?.click();
      }
      if (e.key === "Tab" && controls.length) {
        const first = controls[0],
          last = controls.at(-1)!;
        if (!top.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const go = (name: string) => {
    const [destination, section] = name.split(":");
    setPage(destination);
    if (destination === "Farm") setFarmTab(section || "Overview");
    if (destination === "Skills") {
      setWorkFocus(section);
      setWorkJump((n) => n + 1);
    }
    if (destination === "Shop" && section) setShopTab(section);
    if (destination === "Collection" && section) setCollectionFilter(section);
    setQuery("");
    window.scrollTo({ top: 0 });
  };
  const confirm = (title: string, text: string, run: () => void) =>
    setModal({
      title,
      text,
      run: () => {
        run();
        setModal(null);
      },
    });
  if (!s)
    return (
      <div className="boot">
        <div className="brand-mark">
          <PawPrint />
        </div>
        <h1>Creature Adventure</h1>
        <p>{game.busy ? "Opening your sanctuary…" : game.error}</p>
        {!game.busy && <button onClick={() => location.reload()}>Retry</button>}
      </div>
    );
  const c = detail ? s.creatures.find((c) => c.id === detail) : null;
  const now = s.time;
  const filteredCreatures = s.creatures
    .filter(
      (c) =>
        Object.values(c.ivs).reduce((x, y) => x + y, 0) >= minIV &&
        (creatureFilter === "Any companion" ||
          (creatureFilter === "Rare variant" &&
            (c.color !== "Normal" || c.effect !== "Normal")) ||
          (creatureFilter === "Normal only" &&
            c.color === "Normal" &&
            c.effect === "Normal") ||
          (creatureFilter === "Female" && c.gender === "F") ||
          (creatureFilter === "Male" && c.gender === "M") ||
          (creatureFilter === "Breeding eligible" && E.free(s, c)) ||
          (creatureFilter === "Locked" && c.locked) ||
          (creatureFilter === "Favorites" && c.favorite) ||
          creatureFilter === "Stage " + c.stage) &&
        (element === "All" || FAMILY[c.family].element === element) &&
        (cname(c).toLowerCase().includes(query.toLowerCase()) ||
          c.family.toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "Level"
        ? b.level - a.level
        : sort === "IV score"
          ? Object.values(b.ivs).reduce((x, y) => x + y) -
            Object.values(a.ivs).reduce((x, y) => x + y)
          : sort === "Name"
            ? cname(a).localeCompare(cname(b))
            : b.acquired - a.acquired,
    );
  const action = (fn: (s: Save) => void) => () => act(fn);
  const creatureCard = (creature: Creature, compact = false) => {
    const f = FAMILY[creature.family],
      assigned = s.combatTeam.includes(creature.id)
        ? "Combat"
        : E.farmWorkers(s).includes(creature.id)
          ? "Farm work"
          : s.breeding.some((b) => b.parents.includes(creature.id))
            ? "Breeding"
            : creature.recoveryUntil > now
              ? "Recovery"
              : "Reserve";
    return (
      <button
        className={`creature-card ${compact ? "compact" : ""}`}
        onClick={() => setDetail(creature.id)}
        key={creature.id}
      >
        <Sigil
          family={creature.family}
          stage={creature.stage}
          color={creature.color}
          effect={creature.effect}
        />
        <div className="creature-copy">
          <div className="tiny muted">
            {f.element.toUpperCase()} · {assigned}
          </div>
          <h3>
            {cname(creature)}{" "}
            {creature.favorite && <Star size={12} fill="currentColor" />}
            {creature.locked && <Lock size={12} />}
          </h3>
          <p>
            Lv {creature.level} <span>·</span>{" "}
            {creature.gender === "M" ? "♂" : "♀"} <span>·</span>{" "}
            {Object.values(creature.ivs).reduce((a, b) => a + b, 0)}/186 IV
          </p>
        </div>
        <ChevronRight size={16} />
      </button>
    );
  };
  const journals = (
    <div className="journal-list">
      {JOURNAL.map(([id, title, key, target, reward]) => (
        <div
          className={`journal-row ${s.claims.includes(id) ? "claimed" : ""}`}
          key={id}
        >
          <div className="journal-icon">
            {s.claims.includes(id) ? <Check /> : <ScrollText />}
          </div>
          <div>
            <strong>{title}</strong>
            <p>
              {Math.min(s.metrics[key] || 0, target)} / {target} ·{" "}
              {reward.toLocaleString()} gold
            </p>
          </div>
          <button
            className="small secondary"
            disabled={s.claims.includes(id) || (s.metrics[key] || 0) < target}
            onClick={action((s) => E.claim(s, id))}
          >
            {s.claims.includes(id) ? "Claimed" : "Claim"}
          </button>
        </div>
      ))}
    </div>
  );
  return (
    <div
      className={`app refresh ${!s.settings.motion ? "reduced-motion" : ""}`}
    >
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Home");
          }}
        >
          <span className="brand-mark">
            <PawPrint size={24} />
          </span>
          <span>
            CREATURE<small>ADVENTURE</small>
          </span>
        </a>
        <IdleNavigation s={s} page={page} go={go} />
        <div className="sidebar-footer">
          <div className="version">
            CREATURE ADVENTURE <span>v{VERSION}</span>
          </div>
          <p>50 families. 150 painted forms. Your sanctuary.</p>
          <button className="text-button" onClick={() => setAuthModal(true)}>
            {game.user ? <Cloud size={14} /> : <CloudOff size={14} />}{" "}
            {game.user ? "Account connected" : "Connect cloud save"}
          </button>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <MobileMenu s={s} page={page} go={go} />
          <div className="breadcrumb">
            <span className="header-brand">CA</span>
            <strong>{page}</strong>
            <small className="header-version">v{VERSION}</small>
          </div>
          <div className="top-resources">
            <span className="gold-coin">◈</span>
            <strong>{E.fmt(s.gold)}</strong>
            <span className="resource-divider" />
            <EggIcon size={16} />
            <span>{s.eggs.length}</span>
            <button
              className="account-button"
              onClick={() => setAuthModal(true)}
              aria-label="Account"
            >
              {game.user ? <Cloud size={18} /> : <CloudOff size={18} />}
            </button>
          </div>
        </header>
        {s.started && <IdleStatus s={s} go={go} />}
        {game.error && (
          <div className="notice danger" role="alert">
            <p>{game.error}</p>
            <div className="button-row">
              <button
                className="secondary small"
                onClick={() => downloadSave(s)}
              >
                Export checkpoint
              </button>
              <button
                className="secondary small"
                onClick={() => location.reload()}
              >
                Reload checkpoint
              </button>
              <button
                className="text-button small"
                onClick={() => game.setError("")}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {game.readonly && (
          <div className="notice danger">
            Another tab is playing. Close it and reload this tab to continue.
          </div>
        )}
        {game.conflict && (
          <div className="notice danger">
            Two devices have different saves. Export this timeline before
            loading cloud progress.{" "}
            <button onClick={() => downloadSave(s)}>Export this save</button>
            <button
              onClick={() =>
                confirm(
                  "Load cloud timeline?",
                  "This replaces this device’s current timeline. Export it first if you want to keep a backup.",
                  game.reloadCloud,
                )
              }
            >
              Load cloud
            </button>
          </div>
        )}
        {game.busy && (
          <div className="settlement-overlay">
            <Clock className="spin" />
            <h2>While you were away…</h2>
            <p>Resolving your sanctuary’s activities in order.</p>
          </div>
        )}
        <main className={`${page.toLowerCase()}-page`}>
          <div className="page-title">
            <div className="eyebrow">
              {page === "Home"
                ? "MAKE A HOME. BUILD A LEGACY."
                : "CREATURE ADVENTURE"}
            </div>
            <h1>{page === "Home" ? "Account overview" : page}</h1>
            <p>
              {
                (
                  {
                    Home: "A cozy home. A few helping hands. Something growing every day.",
                    Combat:
                      "Your team fights automatically. Choose a hunt or watch the battle.",
                    Creatures:
                      "Tap a companion to inspect it. Edit either team directly.",
                    Skills: "Choose a skill, activity and work area.",
                    Bank: "Your shared materials, eggs and equipment.",
                    Farm: "Grow your homestead, care for companions and plan the next upgrade.",
                    Equipment:
                      "Tap an item to equip, compare or upgrade. Select spares to salvage.",
                    Slayer: "One contract. A worthy hunt.",
                    Collection:
                      "Fifty families. A hundred and fifty forms. A lifetime of discoveries.",
                    Shop: "Supplies for the road, and rewards for a good hunt.",
                    Settings: "Your account, your saves, your way to play.",
                  } as Record<string, string>
                )[page]
              }
            </p>
          </div>
          {!s.started ? (
            <section className="onboarding panel">
              <div className="eyebrow">YOUR FIRST COMPANION</div>
              <h2>Every great team starts with one egg.</h2>
              <p>
                Choose a companion. Your first incubation takes 30 seconds;
                ordinary eggs take one hour. All three remain useful throughout
                the adventure.
              </p>
              <div className="starter-grid">
                {["F01", "N01", "W01"].map((fid) => {
                  const f = FAMILY[fid];
                  return (
                    <button
                      key={fid}
                      className="starter"
                      onClick={action((s) => E.starter(s, fid))}
                    >
                      <Sigil family={fid} size="lg" />
                      <span className={`tag ${elementClass(f.element)}`}>
                        {f.element}
                      </span>
                      <h3>{f.names[0]}</h3>
                      <p>{f.role}</p>
                      <span className="text-link">
                        Choose this egg <ArrowUpRight size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="art-note">
                Choose your first companion. Each family has three distinct
                painted evolutionary forms.
              </p>
            </section>
          ) : (
            <>
              {page === "Home" && <IdleDashboard s={s} act={act} go={go} />}
              {page === "Combat" && (
                <CombatScreen
                  s={s}
                  act={act}
                  onTeam={() => setTeamEditor("combat")}
                  onDetail={setDetail}
                  confirm={confirm}
                />
              )}
              {page === "Creatures" && (
                <>
                  <div className="button-row collection-team-actions">
                    <button
                      className="secondary small"
                      onClick={() => setTeamEditor("combat")}
                    >
                      Combat team
                    </button>
                    <button
                      className="secondary small"
                      onClick={() => go("Skills")}
                    >
                      Work crew
                    </button>
                  </div>
                  <div className="toolbar">
                    <label className="search">
                      <Search size={17} />
                      <input
                        placeholder="Find a companion…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filter element"
                      value={element}
                      onChange={(e) => setElement(e.target.value)}
                    >
                      <option>All</option>
                      {ELEMENTS.map((el) => (
                        <option key={el}>{el}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Sort creatures"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      {["Newest", "Level", "IV score", "Name"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Creature filter"
                      value={creatureFilter}
                      onChange={(e) => setCreatureFilter(e.target.value)}
                    >
                      {[
                        "Any companion",
                        "Rare variant",
                        "Normal only",
                        "Female",
                        "Male",
                        "Breeding eligible",
                        "Locked",
                        "Favorites",
                        "Stage 1",
                        "Stage 2",
                        "Stage 3",
                      ].map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                    <label className="iv-filter">
                      Minimum IV total
                      <input
                        aria-label="Minimum IV total"
                        type="number"
                        min="0"
                        max="186"
                        value={minIV}
                        onChange={(e) => setMinIV(Number(e.target.value))}
                      />
                    </label>
                    <span className="muted tiny">
                      {s.creatures.length}/{E.capacity(s)} housing
                    </span>
                  </div>
                  <div className="button-row">
                    <button
                      className="secondary small"
                      onClick={() => {
                        setRuleType("release");
                        setShowRules(true);
                      }}
                    >
                      Auto-release rules
                    </button>
                    <button
                      className="danger secondary small"
                      disabled={!selectedCreatures.length}
                      onClick={() =>
                        confirm(
                          "Release selected companions?",
                          `Protected and assigned companions must be deselected. Release produces ${E.fmt(s.creatures.filter((c) => selectedCreatures.includes(c.id)).reduce((n, c) => n.add(E.releaseValue(c)), E.D(0)))} essence.`,
                          () =>
                            act((s) => {
                              E.release(s, selectedCreatures);
                              setSelectedCreatures([]);
                            }),
                        )
                      }
                    >
                      Release selected ({selectedCreatures.length})
                    </button>
                  </div>
                  <Pager
                    page={creaturePage}
                    setPage={setCreaturePage}
                    total={filteredCreatures.length}
                  />
                  <div className="creatures-grid">
                    {filteredCreatures
                      .slice(creaturePage * 30, creaturePage * 30 + 30)
                      .map((c) => (
                        <div className="creature-select" key={c.id}>
                          <input
                            aria-label={`Select ${cname(c)}`}
                            type="checkbox"
                            checked={selectedCreatures.includes(c.id)}
                            onChange={(e) =>
                              setSelectedCreatures(
                                e.target.checked
                                  ? [...selectedCreatures, c.id]
                                  : selectedCreatures.filter(
                                      (id) => id !== c.id,
                                    ),
                              )
                            }
                          />
                          {creatureCard(c)}
                        </div>
                      ))}
                  </div>
                  {!s.creatures.length && (
                    <Empty title="A first companion is on the way">
                      Hatch your starter at the farm.
                    </Empty>
                  )}
                </>
              )}
              {page === "Skills" && (
                <SkillWorkspace
                  key={workJump}
                  s={s}
                  act={act}
                  go={go}
                  focus={workFocus}
                  onWorkflow={() => setWorkflows(true)}
                />
              )}
              {page === "Farm" && (
                <Farm
                  s={s}
                  act={act}
                  now={now}
                  confirm={confirm}
                  go={go}
                  tab={farmTab}
                  setTab={setFarmTab}
                />
              )}
              {page === "Bank" && (
                <Bank
                  s={s}
                  act={act}
                  go={go}
                  onEquipment={() => go("Equipment")}
                />
              )}
              {page === "Equipment" && (
                <EquipmentScreen
                  s={s}
                  act={act}
                  go={go}
                  confirm={confirm}
                  onRules={() => {
                    setRuleType("salvage");
                    setShowRules(true);
                  }}
                />
              )}
              {page === "Slayer" && (
                <SlayerScreen s={s} act={act} go={go} confirm={confirm} />
              )}
              {page === "Collection" && (
                <>
                  <div className="stat-row">
                    <div>
                      <BookOpen />
                      <span>
                        FORMS DISCOVERED
                        <strong>
                          {new Set(s.discovered).size}
                          <small>/150</small>
                        </strong>
                      </span>
                    </div>
                    <div>
                      <Sparkles />
                      <span>
                        VARIANT RECORDS<strong>{s.variants.length}</strong>
                      </span>
                    </div>
                    <div>
                      <EggIcon />
                      <span>
                        HATCHED<strong>{s.metrics.hatches || 0}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="button-row">
                    {ADVENTURES.filter(
                      (a) => a.kind === "raid" && s.unlocks.includes(a.id),
                    ).map((a) => (
                      <span className="tag" key={a.id}>
                        <Star size={12} />
                        {a.name} · CLEARED
                      </span>
                    ))}
                  </div>
                  <div className="collection-controls">
                    <div className="segmented">
                      <button
                        className={
                          collectionFilter !== "Journal" ? "active" : ""
                        }
                        onClick={() => {
                          setCollectionFilter("All");
                          setCollectionPage(0);
                        }}
                      >
                        Encyclopedia
                      </button>
                      <button
                        className={
                          collectionFilter === "Journal" ? "active" : ""
                        }
                        onClick={() => {
                          setCollectionFilter("Journal");
                          setCollectionPage(0);
                        }}
                      >
                        Journal
                      </button>
                    </div>
                    {collectionFilter !== "Journal" && (
                      <select
                        aria-label="Filter encyclopedia element"
                        value={collectionFilter}
                        onChange={(e) => {
                          setCollectionFilter(e.target.value);
                          setCollectionPage(0);
                        }}
                      >
                        {["All", ...ELEMENTS].map((k) => (
                          <option key={k} value={k}>
                            {k === "All" ? "All elements" : k}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {collectionFilter === "All" && (
                    <div className="button-row">
                      <button
                        className="secondary small"
                        disabled={collectionPage === 0}
                        onClick={() => setCollectionPage(collectionPage - 1)}
                      >
                        Previous
                      </button>
                      <span className="tiny muted">
                        Families {collectionPage * 10 + 1}–
                        {Math.min(50, collectionPage * 10 + 10)} of 50
                      </span>
                      <button
                        className="secondary small"
                        disabled={collectionPage >= 4}
                        onClick={() => setCollectionPage(collectionPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  {collectionFilter === "Journal" ? (
                    journals
                  ) : (
                    <div className="encyclopedia-grid">
                      {FAMILIES.filter(
                        (f) =>
                          collectionFilter === "All" ||
                          f.element === collectionFilter,
                      )
                        .slice(collectionPage * 10, collectionPage * 10 + 10)
                        .map((f) => (
                          <div className="panel family-entry" key={f.id}>
                            <div className="family-header">
                              <span
                                className={`tag ${elementClass(f.element)}`}
                              >
                                {f.id} · {f.element}
                              </span>
                              <small>
                                {
                                  s.creatures.filter((c) => c.family === f.id)
                                    .length
                                }{" "}
                                owned
                              </small>
                            </div>
                            <div className="evolution-line">
                              {f.names.map((name, i) => (
                                <div
                                  className={
                                    s.discovered.includes(f.id + "-" + (i + 1))
                                      ? ""
                                      : "undiscovered"
                                  }
                                  key={name}
                                >
                                  <button
                                    className="form-portrait"
                                    aria-label={`Inspect ${name}`}
                                    onClick={() =>
                                      setFormPreview(`${f.id}-${i + 1}`)
                                    }
                                  >
                                    <Sigil family={f.id} stage={i + 1} />
                                  </button>
                                  <strong>{name}</strong>
                                  <small>
                                    {s.discovered.includes(f.id + "-" + (i + 1))
                                      ? "Discovered"
                                      : "Undiscovered"}
                                  </small>
                                </div>
                              ))}
                            </div>
                            <h4>{f.role}</h4>
                            <p>
                              {f.shape}. Primary aptitude: {f.primary}.
                            </p>
                            <details>
                              <summary>
                                Abilities, passive & acquisition
                              </summary>
                              <p>
                                <strong>{f.passive.name}</strong> —{" "}
                                {f.passive.description}
                              </p>
                              {f.abilities.map((a, i) => (
                                <p key={a.id}>
                                  <strong>
                                    Stage {i + 1}: {a.name}
                                  </strong>
                                  <br />
                                  {a.description} · {a.cooldown}s cooldown
                                </p>
                              ))}
                              <p>
                                Egg source: {REGIONS[f.region]} combat.
                                Evolution at Lv 25 and 75, manually using
                                materials.
                              </p>
                              <p>
                                Variant discoveries:{" "}
                                {s.variants
                                  .filter((v) => v.startsWith(f.id))
                                  .map((v) => v.slice(4).replaceAll("-", " / "))
                                  .join(", ") || "None yet"}
                              </p>
                            </details>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
              {page === "Shop" && (
                <>
                  <div className="segmented shop-tabs">
                    {["Supplies", "Slayer", "Materials"].map((t) => (
                      <button
                        key={t}
                        className={shopTab === t ? "active" : ""}
                        onClick={() => setShopTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {shopTab === "Supplies" && (
                    <Section title="Trail provisions" label="GENERAL STORE">
                      <div className="encounter-grid">
                        {[
                          ["ration", 30],
                          ["potion", 50],
                        ].map(([k, cost]) => (
                          <div className="panel" key={k}>
                            <ShoppingBag className="accent" />
                            <h3>{pretty(k as string)}</h3>
                            <p>
                              {k === "ration"
                                ? "+15% team damage for 60 seconds in the current encounter."
                                : "Restore 30% maximum HP to living allies during combat."}
                            </p>
                            <p>
                              {cost} gold · {E.fmt(s.inventory[k] || 0)} owned
                            </p>
                            <button
                              onClick={action((s) => E.buy(s, k as string))}
                            >
                              Buy one
                            </button>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                  {shopTab === "Slayer" && (
                    <Section title="The token exchange" label="SLAYER REWARDS">
                      <div className="encounter-grid">
                        {[
                          ["inherit1", 10],
                          ["inherit2", 50],
                          ["inherit3", 150],
                          ["catalyst", 35],
                          ["relic", 100],
                        ].map(([k, cost]) => (
                          <div className="panel" key={k}>
                            <span className="tag">{cost} TOKENS</span>
                            <h3>{pretty(k as string)}</h3>
                            <p>
                              {String(k).startsWith("inherit")
                                ? "Guide IV inheritance when breeding. Select it before starting a pair."
                                : "Rare material for evolution or equipment milestones."}
                            </p>
                            <button
                              onClick={action((s) => E.buy(s, k as string))}
                            >
                              Exchange tokens
                            </button>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                  {shopTab === "Materials" && (
                    <Section title="Material inventory">
                      <Inventory s={s} act={act} confirm={confirm} />
                    </Section>
                  )}
                </>
              )}
              {page === "Settings" && (
                <>
                  <div className="two-col">
                    <div className="panel">
                      <div className="eyebrow">YOUR PROGRESS</div>
                      <h2>Account & cloud</h2>
                      <p>{game.user?.email || "Playing on this device"}</p>
                      <p className="sync-status">
                        <Cloud size={15} />
                        {game.status}
                      </p>
                      {game.error && (
                        <div className="notice danger">{game.error}</div>
                      )}
                      <div className="button-row">
                        <button onClick={() => setAuthModal(true)}>
                          {game.user ? "Account" : "Sign in / Create account"}
                        </button>
                        <button
                          className="secondary"
                          disabled={!game.user}
                          onClick={() => void game.sync()}
                        >
                          Save to cloud now
                        </button>
                      </div>
                      <p className="muted tiny">
                        Device saves every 5 seconds. Cloud checkpoints start at
                        90 seconds and space out for larger saves; you can also
                        save manually. Never merge two conflicting timelines.
                      </p>
                    </div>
                    <div className="panel">
                      <div className="eyebrow">PLAY YOUR WAY</div>
                      <h2>Preferences</h2>
                      <label className="setting-row">
                        <span>
                          <Volume2 size={18} /> Interface sound
                        </span>
                        <input
                          type="checkbox"
                          checked={s.settings.sound}
                          onChange={action((s) => {
                            s.settings.sound = !s.settings.sound;
                          })}
                        />
                      </label>
                      <label className="setting-row">
                        <span>
                          <Wind size={18} /> Motion effects
                        </span>
                        <input
                          type="checkbox"
                          checked={s.settings.motion}
                          onChange={action((s) => {
                            s.settings.motion = !s.settings.motion;
                          })}
                        />
                      </label>
                      <p>
                        Offline progression cap: {E.offlineCap(s) / 3600000}{" "}
                        hours
                      </p>
                      <p className="muted tiny">
                        All progress stops after 12 offline hours, including
                        combat, farm tasks, incubation, breeding, upgrades and
                        recovery. No facility extends this cap.
                      </p>
                    </div>
                  </div>
                  <div className="panel">
                    <h2>Save backups</h2>
                    <p>
                      Export a portable backup before importing another
                      timeline. Import replaces this device’s progress.
                    </p>
                    <div className="button-row">
                      <button
                        className="secondary"
                        onClick={() => downloadSave(s)}
                      >
                        <Download size={16} /> Export save
                      </button>
                      <label className="file-button">
                        Import save
                        <input
                          type="file"
                          accept=".json"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const imported = await importSave(file);
                              confirm(
                                "Replace this timeline?",
                                "This replaces local progress with the selected save. Export a backup first.",
                                () => void game.replace(imported),
                              );
                            } catch (error) {
                              game.notify((error as Error).message);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {game.user && (
                        <button
                          className="secondary"
                          onClick={async () => {
                            const guest = await localRead("guest");
                            if (!guest) {
                              game.notify("No guest save found.");
                              return;
                            }
                            confirm(
                              "Import the device sanctuary?",
                              "This replaces the signed-in account’s local timeline. Save to cloud afterward to keep it.",
                              () => void game.replace(guest),
                            );
                          }}
                        >
                          Import guest sanctuary
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="panel">
                    <h2>Build information</h2>
                    <p>
                      Creature Adventure v{VERSION} · Save schema {s.schema}
                    </p>
                    <p>
                      150 painted evolutionary forms · nine color and effect
                      combinations · original creature collection.
                    </p>
                    <p>
                      Free-plan architecture: gameplay is calculated on-device;
                      Firebase provides account authentication and partitioned
                      cloud snapshots.
                    </p>
                    <a
                      href="https://github.com/levigrammer21/Creature-adventure-"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View source repository <ArrowUpRight size={14} />
                    </a>
                  </div>
                  <Section title="Activity history">
                    <ActivityLog s={s} full />
                  </Section>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              CREATURE ADVENTURE <b>v{VERSION}</b>
            </span>
            <span>
              {game.user ? "Cloud account connected" : "Device save"} ·{" "}
              {new Date(now).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.filter(([name]) =>
          ["Home", "Combat", "Bank", "Skills", "Farm"].includes(name),
        ).map(([name, Icon]) => (
          <button
            key={name}
            className={page === name ? "active" : ""}
            aria-current={page === name ? "page" : undefined}
            onClick={() => go(name)}
          >
            <Icon size={20} />
            <span>{name}</span>
            {name === "Farm" &&
              s.incubators.some((i) => i.egg && i.finish <= s.time) && (
                <i className="nav-dot" />
              )}
          </button>
        ))}
      </nav>
      {teamEditor && (
        <TeamDrawer
          s={s}
          act={act}
          team={teamEditor}
          close={() => setTeamEditor(null)}
          confirm={confirm}
        />
      )}
      {game.toast && (
        <div className="toast" role="status">
          {game.toast}
        </div>
      )}
      {formPreview && (
        <FormPreview
          form={formPreview}
          s={s}
          close={() => setFormPreview(null)}
        />
      )}
      {c && (
        <CreatureDetail
          c={c}
          s={s}
          act={act}
          close={() => setDetail(null)}
          confirm={confirm}
        />
      )}
      {modal && (
        <div className="modal-backdrop">
          <div
            className="modal small-modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal.title}
          >
            <h2>{modal.title}</h2>
            <p>{modal.text}</p>
            <div className="button-row">
              <button onClick={modal.run}>Confirm</button>
              <button className="secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {authModal && (
        <AuthModal
          user={game.user}
          close={() => setAuthModal(false)}
          sync={game.sync}
          notify={game.notify}
        />
      )}
      {showRules && (
        <Rules
          s={s}
          type={ruleType}
          act={act}
          close={() => setShowRules(false)}
        />
      )}
      {workflows && (
        <Workflows s={s} act={act} close={() => setWorkflows(false)} />
      )}
      {s.summary && (
        <div className="modal-backdrop">
          <div
            className="modal offline-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Offline progress"
          >
            <div className="offline-mark">
              <Leaf size={30} />
            </div>
            <div className="eyebrow">WHILE YOU WERE AWAY</div>
            <h2>Your sanctuary kept growing.</h2>
            <p>
              {timer(s.summary.elapsed)} elapsed · {timer(s.summary.simulated)}{" "}
              earning time
            </p>
            <div className="offline-stats">
              <div>
                <strong>{s.summary.wins}</strong>
                <small>Victories</small>
              </div>
              <div>
                <strong>{s.summary.eggs}</strong>
                <small>Eggs found</small>
              </div>
              <div>
                <strong>{s.summary.hatches}</strong>
                <small>Hatched</small>
              </div>
              <div>
                <strong>+{E.fmt(s.summary.gold)}</strong>
                <small>Gold change</small>
              </div>
            </div>
            {s.summary.defeats > 0 && (
              <div className="notice danger">
                Your team was defeated. Combat stopped; earned rewards were
                retained.
              </div>
            )}
            <p className="tiny">
              +{E.fmt(s.summary.creatureXP || 0)} creature XP ·{" "}
              {s.summary.items || 0} equipment · {s.summary.breeds || 0}{" "}
              breeding completions
            </p>
            <div className="offline-resources">
              {Object.entries(s.summary.skillXP || {}).map(([k, v]) => (
                <span key={k}>
                  +{E.fmt(v)} {k} XP
                </span>
              ))}
              {(s.summary.unlocks || []).map((u) => (
                <span key={u}>Unlocked: {ENCOUNTER[u]?.name || u}</span>
              ))}
              {Object.entries(s.summary.resources).map(([k, v]) => (
                <span key={k}>
                  +{E.fmt(v)} {pretty(k)}
                </span>
              ))}
            </div>
            <button
              onClick={action((s) => {
                s.summary = null;
              })}
            >
              Welcome home <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
type Act = (fn: (s: Save) => void) => void;
type Confirm = (title: string, text: string, fn: () => void) => void;
function FormPreview({
  form,
  s,
  close,
}: {
  form: string;
  s: Save;
  close: () => void;
}) {
  const family = form.slice(0, 3),
    stage = Number(form.slice(4)),
    f = FAMILY[family];
  const [level, setLevel] = useState(1),
    [color, setColor] = useState<Creature["color"]>("Normal"),
    [effect, setEffect] = useState<Creature["effect"]>("Normal");
  const preview: Creature = {
    id: "encyclopedia-preview",
    family,
    stage,
    level,
    xp: "0",
    ivs: { hp: 16, atk: 16, def: 16, spa: 16, spd: 16, spe: 16 },
    gender: "F",
    color,
    effect,
    locked: false,
    favorite: false,
    equipment: {},
    priorities: [2, 1, 0],
    recoveryUntil: 0,
    acquired: 0,
  };
  const stats = E.stats(s, preview);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal form-preview"
        role="dialog"
        aria-modal="true"
        aria-label={`${f.names[stage - 1]} encyclopedia`}
      >
        <button
          className="modal-close icon-button"
          aria-label="Close form"
          onClick={close}
        >
          <X />
        </button>
        <span className={`tag ${elementClass(f.element)}`}>
          {f.element} · FORM {stage}/3
        </span>
        <Sigil
          family={family}
          stage={stage}
          size="lg"
          color={color}
          effect={effect}
        />
        <h2>{f.names[stage - 1]}</h2>
        <p>{f.role}</p>
        <p className="muted">{f.shape}.</p>
        <div className="two-col">
          <label>
            Color preview
            <select
              value={color}
              onChange={(e) => setColor(e.target.value as Creature["color"])}
            >
              {["Normal", "Inverted", "Prismatic"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Effect preview
            <select
              value={effect}
              onChange={(e) => setEffect(e.target.value as Creature["effect"])}
            >
              {["Normal", "Sparkling", "Glowing"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Preview level
          <input
            type="number"
            min="1"
            value={level}
            onChange={(e) => {
              const n = Math.floor(Number(e.target.value));
              if (Number.isSafeInteger(n) && n >= 1) setLevel(n);
            }}
          />
        </label>
        <p className="tiny muted">
          Reference stats use 16 IVs in each stat and no equipment. Individual
          creatures vary.
        </p>
        <div className="stats-grid">
          {STATS.map((k) => (
            <div key={k}>
              <span>{AFFIX_NAMES[k]}</span>
              <strong>{E.fmt(stats[k])}</strong>
              <small>
                Base {f.base[k]} · Growth {f.growth[k]}
              </small>
            </div>
          ))}
        </div>
        <h3>{f.passive.name}</h3>
        <p>{f.passive.description}</p>
        <h3>Unlocked abilities</h3>
        {f.abilities.slice(0, stage).map((a, i) => (
          <p key={a.id}>
            <strong>{a.name}</strong> · {a.cooldown}s cooldown · rank{" "}
            {stage - i}
            <br />
            {a.description}
          </p>
        ))}
        <h3>Skilling aptitudes</h3>
        <div className="stats-grid">
          {Object.entries(f.aptitudes).map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <strong>{Math.round(v * [1, 1.4, 1.9][stage - 1])}</strong>
            </div>
          ))}
        </div>
        <h3>{stage < 3 ? "Next evolution" : "Fully evolved"}</h3>
        {stage < 3 && (
          <>
            <p>
              Level {stage === 1 ? 25 : 75} · defeat region boss{" "}
              {stage === 1 ? 1 : 4}. Evolution is manual from an owned
              creature's details.
            </p>
            <Cost s={s} cost={E.evolutionCost(preview)} />
          </>
        )}
        <h3>Acquisition</h3>
        <p>
          Family eggs drop from {REGIONS[f.region]} encounters. They can also
          appear in eligible foraging, adventure rewards, and breeding.
        </p>
      </div>
    </div>
  );
}
function CreatureDetail({
  c,
  s,
  act,
  close,
  confirm,
}: {
  c: Creature;
  s: Save;
  act: Act;
  close: () => void;
  confirm: Confirm;
}) {
  const f = FAMILY[c.family],
    st = E.stats(s, c);
  const [tab, setTab] = useState("Overview");
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal creature-detail"
        role="dialog"
        aria-modal="true"
        aria-label={cname(c)}
      >
        <button
          className="modal-close icon-button"
          onClick={close}
          aria-label="Close creature"
        >
          <X />
        </button>
        <div className="detail-hero">
          <Sigil
            family={c.family}
            stage={c.stage}
            color={c.color}
            effect={c.effect}
            size="lg"
          />
          <div>
            <span className={`tag ${elementClass(f.element)}`}>
              {f.element} · STAGE {c.stage}
            </span>
            <h2>
              {cname(c)}{" "}
              <span className="muted">{c.gender === "M" ? "♂" : "♀"}</span>
            </h2>
            <p>
              Level {c.level} · {f.role}
            </p>
            <p className="tiny">
              {c.color} color · {c.effect} effect
            </p>
          </div>
        </div>
        <div className="button-row">
          <button
            className={`secondary small ${c.locked ? "selected" : ""}`}
            onClick={() =>
              act((s) => {
                s.creatures.find((x) => x.id === c.id)!.locked = !c.locked;
              })
            }
          >
            <Lock size={14} />
            {c.locked ? "Locked" : "Lock"}
          </button>
          <button
            className={`secondary small ${c.favorite ? "selected" : ""}`}
            onClick={() =>
              act((s) => {
                s.creatures.find((x) => x.id === c.id)!.favorite = !c.favorite;
              })
            }
          >
            <Star size={14} />
            {c.favorite ? "Favorite" : "Favorite"}
          </button>
          <button
            className="text-button small"
            onClick={() => {
              const name = prompt("Nickname", c.name || "");
              if (name !== null)
                act((s) => {
                  s.creatures.find((x) => x.id === c.id)!.name =
                    name.trim().slice(0, 30) || undefined;
                });
            }}
          >
            Rename
          </button>
        </div>
        <Progress
          value={E.D(c.xp).div(E.xpNext(c.level)).toNumber()}
          label={`${E.fmt(c.xp)} / ${E.fmt(E.xpNext(c.level))} XP`}
        />
        <div className="skill-tabs">
          {["Overview", "Abilities", "Team & gear", "Evolution"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Overview" && (
          <>
            <div className="stats-grid">
              {STATS.map((k) => (
                <div key={k}>
                  <span>
                    {
                      {
                        hp: "HP",
                        atk: "Attack",
                        def: "Defense",
                        spa: "Sp. Attack",
                        spd: "Sp. Defense",
                        spe: "Speed",
                      }[k]
                    }
                  </span>
                  <strong>{E.fmt(st[k])}</strong>
                  <small>IV {c.ivs[k]} / 31</small>
                  <Progress value={c.ivs[k]} max={31} />
                </div>
              ))}
            </div>
            <div className="passive">
              <Sparkles size={18} />
              <div>
                <strong>{f.passive.name}</strong>
                <p>{f.passive.description}</p>
              </div>
            </div>
            <h3>Skilling aptitudes</h3>
            <div className="aptitudes">
              {Object.entries(f.aptitudes).map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{(v * [1, 1.4, 1.9][c.stage - 1]).toFixed(0)}</strong>
                </div>
              ))}
            </div>
            <p className="tiny muted">Creature ID: {c.id}</p>
          </>
        )}
        {tab === "Abilities" && (
          <>
            <p className="muted">
              Highest priority is checked first. Basic attack is the fallback.
              Ability cooldowns use game seconds.
            </p>
            {c.priorities.map((idx, pos) => {
              const a = f.abilities[idx];
              return (
                <div
                  className={`ability ${idx >= c.stage ? "locked-ability" : ""}`}
                  key={idx}
                >
                  <span className="ability-number">{pos + 1}</span>
                  <div>
                    <strong>
                      {a.name} {idx >= c.stage && <Lock size={12} />}
                    </strong>
                    <small>
                      {a.cooldown}s cooldown · unlock stage {idx + 1}
                    </small>
                    <p>{a.description}</p>
                  </div>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Move ${a.name} up`}
                      disabled={pos === 0}
                      onClick={() =>
                        act((s) => {
                          const list = s.creatures.find(
                            (x) => x.id === c.id,
                          )!.priorities;
                          [list[pos - 1], list[pos]] = [
                            list[pos],
                            list[pos - 1],
                          ];
                        })
                      }
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Move ${a.name} down`}
                      disabled={pos === 2}
                      onClick={() =>
                        act((s) => {
                          const list = s.creatures.find(
                            (x) => x.id === c.id,
                          )!.priorities;
                          [list[pos + 1], list[pos]] = [
                            list[pos],
                            list[pos + 1],
                          ];
                        })
                      }
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="passive">
              <Swords size={18} />
              <div>
                <strong>Basic attack</strong>
                <p>
                  {f.element} damage using the stronger natural attack channel.
                </p>
              </div>
            </div>
          </>
        )}
        {tab === "Team & gear" && (
          <>
            <h3>Assignment</h3>
            <div className="button-row">
              {Array.from({ length: 6 }, (_, i) => (
                <button
                  className={`secondary small ${s.combatTeam[i] === c.id ? "selected" : ""}`}
                  disabled={!!s.combat}
                  key={i}
                  onClick={() => act((s) => E.assign(s, c.id, "combat", i))}
                >
                  {i < 3 ? "Front" : "Back"} {(i % 3) + 1}
                </button>
              ))}
            </div>
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => act((s) => E.assign(s, c.id, "skill"))}
              >
                Skilling team
              </button>
              <button
                className="secondary"
                onClick={() => act((s) => E.assign(s, c.id, "reserve"))}
              >
                Move to reserve
              </button>
            </div>
            {c.recoveryUntil > s.time && (
              <p className="notice">
                Recovering · {timer(c.recoveryUntil - s.time)}
              </p>
            )}
            <h3>Equipment</h3>
            {(["Essence", "Gem", "Trinket"] as Slot[]).map((slot) => (
              <label className="equip-select" key={slot}>
                {slot}
                <select
                  value={c.equipment[slot] || ""}
                  onChange={(e) =>
                    act((s) => {
                      if (e.target.value) E.equip(s, c.id, e.target.value);
                      else {
                        if (s.combat) throw Error("Stop combat first.");
                        delete s.creatures.find((x) => x.id === c.id)!
                          .equipment[slot];
                      }
                    })
                  }
                >
                  <option value="">Empty</option>
                  {s.items
                    .filter((i) => i.slot === slot)
                    .map((i) => (
                      <option value={i.id} key={i.id}>
                        {RARITIES[i.rarity]} +{i.level} ·{" "}
                        {i.affixes.map((a) => AFFIX_NAMES[a.key]).join(", ")}
                      </option>
                    ))}
                </select>
              </label>
            ))}
            <button
              className="danger secondary"
              onClick={() =>
                confirm(
                  "Release this companion?",
                  `Receive ${E.fmt(E.releaseValue(c))} Creature Essence. This permanently releases the creature. Remove locks, favorites, and assignments first.`,
                  () => act((s) => E.release(s, [c.id])),
                )
              }
            >
              Release for essence
            </button>
          </>
        )}
        {tab === "Evolution" && (
          <>
            <div className="evolution-line">
              {f.names.map((name, i) => (
                <div className={c.stage === i + 1 ? "current" : ""} key={name}>
                  <Sigil family={f.id} stage={i + 1} />
                  <strong>{name}</strong>
                  <small>Stage {i + 1}</small>
                </div>
              ))}
            </div>
            {c.stage < 3 ? (
              <>
                <p>
                  Requires level {c.stage === 1 ? 25 : 75} and{" "}
                  {c.stage === 1
                    ? "the first region boss"
                    : "the fourth region boss"}{" "}
                  defeated. Move to reserve first.
                </p>
                <Cost s={s} cost={E.evolutionCost(c)} />
                <button
                  onClick={() =>
                    confirm(
                      `Evolve into ${f.names[c.stage]}?`,
                      "This spends the listed materials. Level, IVs, variants, equipment, and identity are preserved.",
                      () => act((s) => E.evolve(s, c.id)),
                    )
                  }
                >
                  Evolve manually
                </button>
              </>
            ) : (
              <p className="notice">
                Final form reached. Level progression continues without a
                designed level cap.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function Farm({
  s,
  act,
  now,
  confirm,
  tab,
  setTab,
  go,
}: {
  s: Save;
  go: (page: string) => void;
  act: Act;
  tab: string;
  setTab: (tab: string) => void;
  now: number;
  confirm: Confirm;
}) {
  const [mother, setMother] = useState(""),
    [father, setFather] = useState(""),
    [mc, setMc] = useState(0),
    [fc, setFc] = useState(0),
    [ms, setMs] = useState<Stat[]>([]),
    [fs, setFs] = useState<Stat[]>([]),
    [repeatBreed, setRepeatBreed] = useState(false);
  const inheritance = (who: "mother" | "father") => {
    const count = who === "mother" ? mc : fc;
    const selected = who === "mother" ? ms : fs;
    return (
      <div className="inheritance">
        <label>
          Inheritance consumable
          <select
            value={count}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (who === "mother") {
                setMc(n);
                setMs([]);
              } else {
                setFc(n);
                setFs([]);
              }
            }}
          >
            <option value={0}>None · default inheritance</option>
            <option value={1}>
              Focused Thread · choose 1 IV ({E.fmt(s.inventory.inherit1 || 0)})
            </option>
            <option value={2}>
              Twin Thread · choose 2 IVs ({E.fmt(s.inventory.inherit2 || 0)})
            </option>
            <option value={3}>
              Legacy Thread · 3 random distinct IVs (
              {E.fmt(s.inventory.inherit3 || 0)})
            </option>
          </select>
        </label>
        {count > 0 && count < 3 && (
          <div className="button-row">
            {STATS.map((k) => (
              <button
                key={k}
                className={`secondary small ${selected.includes(k) ? "selected" : ""}`}
                onClick={() => {
                  const next = selected.includes(k)
                    ? selected.filter((x) => x !== k)
                    : selected.length < count
                      ? [...selected, k]
                      : selected;
                  who === "mother" ? setMs(next) : setFs(next);
                }}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      <div className="farm-overview panel">
        <div>
          <span className="eyebrow">ROOM FOR POSSIBILITY</span>
          <h2>Your sanctuary</h2>
          <p>
            Housing {s.creatures.length}/{E.capacity(s)} · {s.incubators.length}{" "}
            incubators · {s.breeding.length}/{s.facilities.Breeding} breeding
            pairs
          </p>
        </div>
        <House size={64} />
      </div>
      <div className="segmented" aria-label="Farm sections">
        {["Overview", "Hatchery", "Breeding", "Buildings"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && <FarmManager s={s} act={act} go={go} />}
      {tab === "Hatchery" && <Nursery s={s} act={act} />}
      {tab === "Breeding" && (
        <Section title="Breeding complex" label="THE NEXT GENERATION">
          <div className="panel">
            <div className="two-col">
              <div>
                <label>
                  Female parent
                  <select
                    value={mother}
                    onChange={(e) => setMother(e.target.value)}
                  >
                    <option value="">Choose a female</option>
                    {s.creatures
                      .filter((c) => c.gender === "F" && E.free(s, c))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {cname(c)} · {Object.values(c.ivs).join("/")}
                        </option>
                      ))}
                  </select>
                </label>
                {inheritance("mother")}
              </div>
              <div>
                <label>
                  Male parent
                  <select
                    value={father}
                    onChange={(e) => setFather(e.target.value)}
                  >
                    <option value="">Choose a male</option>
                    {s.creatures
                      .filter((c) => c.gender === "M" && E.free(s, c))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {cname(c)} · {Object.values(c.ivs).join("/")}
                        </option>
                      ))}
                  </select>
                </label>
                {inheritance("father")}
              </div>
            </div>
            <p className="muted tiny">
              75 gold · Base 30 minutes. Parents are reserved until completion.
              Two Legacy Threads inherit six non-overlapping IVs. Facilities do
              not change variant odds.
            </p>
            <BreedingOdds s={s} mother={mother} father={father} />
            <label className="switch">
              <input
                type="checkbox"
                disabled={s.facilities.Breeding < 4}
                checked={repeatBreed}
                onChange={(e) => setRepeatBreed(e.target.checked)}
              />
              Repeat pair while ingredients are available (Breeding Lv 4)
            </label>
            <button
              onClick={() =>
                confirm(
                  "Start breeding?",
                  "This spends 75 gold and selected threads now, and reserves both parents until the egg is produced.",
                  () =>
                    act((s) =>
                      (repeatBreed ? E.repeatBreeding : E.breed)(
                        s,
                        mother,
                        father,
                        mc,
                        fc,
                        ms,
                        fs,
                      ),
                    ),
                )
              }
            >
              Start breeding pair
            </button>
          </div>
          {(s.breedingPlans || [])
            .filter((p) => p.enabled)
            .map((plan) => (
              <div className="panel rule-row" key={plan.id}>
                <span>
                  Repeat breeding enabled · next jobs spend the same gold and
                  threads
                </span>
                <button
                  className="secondary small"
                  onClick={() =>
                    act((s) => {
                      s.breedingPlans!.find((p) => p.id === plan.id)!.enabled =
                        false;
                    })
                  }
                >
                  Stop repeating
                </button>
              </div>
            ))}
          {s.breeding.map((b) => (
            <div className="panel breeding-job" key={b.id}>
              <Heart size={22} />
              <div>
                <strong>
                  {b.parents
                    .map((id) => {
                      const c = s.creatures.find((c) => c.id === id);
                      return c ? cname(c) : "Parent";
                    })
                    .join(" × ")}
                </strong>
                <p>{timer(b.finish - now)} until egg completion</p>
              </div>
            </div>
          ))}
          <details className="panel">
            <summary>Discoverable cross-family pairings</summary>
            <p className="muted">
              These pairings have a 30% chance to produce a rare existing
              family. Other results follow the parents’ families.
            </p>
            {HYBRIDS.map((h) => (
              <p key={h.join("")}>
                {FAMILY[h[0]].names[0]} × {FAMILY[h[1]].names[0]} →{" "}
                {s.discovered.some((d) => d.startsWith(h[2]))
                  ? FAMILY[h[2]].names[0]
                  : "Undiscovered family"}
              </p>
            ))}
          </details>
        </Section>
      )}
      {tab === "Buildings" && (
        <Section title="Build a better home" label="FACILITY UPGRADES">
          <div className="facility-grid">
            {FACILITIES.map((k) => {
              const up = s.upgrades.find((u) => u.facility === k);
              return (
                <div className="panel facility" key={k}>
                  <div className="facility-top">
                    <House size={24} />
                    <span className="tag">LEVEL {s.facilities[k]}</span>
                  </div>
                  <h3>
                    {k === "Breeding"
                      ? "Breeding Complex"
                      : k === "Housing"
                        ? "Housing Complex"
                        : k}
                  </h3>
                  <p>{FACILITY_INFO[k]}</p>
                  <Cost s={s} cost={E.facilityCost(s, k)} />
                  <button
                    className="secondary"
                    disabled={!!up}
                    onClick={() =>
                      confirm(
                        `Upgrade ${k}?`,
                        "Spend the listed materials to begin construction. The upgrade takes effect when its timer completes.",
                        () => act((s) => E.upgradeFacility(s, k)),
                      )
                    }
                  >
                    {up
                      ? `Building · ${timer(up.finish - now)}`
                      : `Upgrade to level ${s.facilities[k] + 1}`}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
function ActivityLog({ s, full = false }: { s: Save; full?: boolean }) {
  const [type, setType] = useState("All");
  const types = [...new Set(s.logs.map((l) => l.type))];
  return (
    <div className="panel activity-log">
      {full && (
        <select
          aria-label="History type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      )}
      {s.logs
        .filter((l) => type === "All" || l.type === type)
        .slice(0, full ? 180 : 6)
        .map((l) => (
          <div className="log-row" key={l.id}>
            <span className="log-dot" />
            <p>{l.text}</p>
            <time>
              {new Date(l.time).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
          </div>
        ))}
      {!s.logs.length && <p className="muted">The story starts here.</p>}
    </div>
  );
}
function Inventory({
  s,
  act,
  confirm,
}: {
  s: Save;
  act: Act;
  confirm: Confirm;
}) {
  const [filter, setFilter] = useState("");
  return (
    <div className="panel">
      <label className="search">
        <Search size={16} />
        <input
          placeholder="Search materials…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="inventory-grid">
        {Object.entries(s.inventory)
          .filter(
            ([k, v]) =>
              E.D(v).gt(0) &&
              pretty(k).toLowerCase().includes(filter.toLowerCase()),
          )
          .map(([k, v]) => (
            <div key={k}>
              <span>{pretty(k)}</span>
              <strong>{E.fmt(v)}</strong>
              <button
                className="text-button tiny"
                onClick={() => {
                  const n = Number(prompt("Quantity to sell", "1"));
                  if (Number.isSafeInteger(n) && n > 0)
                    confirm(
                      `Sell ${n} ${pretty(k)}?`,
                      "Materials are removed and gold is added immediately.",
                      () => act((s) => E.sell(s, k, n)),
                    );
                }}
              >
                Sell
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
function AuthModal({
  user,
  close,
  sync,
  notify,
}: {
  user: { uid: string; email: string | null } | null;
  close: () => void;
  sync: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [creating, setCreating] = useState(false),
    [working, setWorking] = useState(false),
    [error, setError] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    setWorking(true);
    setError("");
    try {
      await fn();
      close();
    } catch (e) {
      setError((e as Error).message);
    }
    setWorking(false);
  };
  return (
    <div className="modal-backdrop">
      <div
        className="modal small-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Account"
      >
        <button
          className="modal-close icon-button"
          onClick={close}
          aria-label="Close account"
        >
          <X />
        </button>
        <Cloud className="accent" size={32} />
        <h2>
          {user
            ? "Your cloud account"
            : creating
              ? "Make yourself at home."
              : "Welcome home."}
        </h2>
        {user ? (
          <>
            <p>{user.email}</p>
            <button onClick={() => void run(sync)}>Save now</button>
            <button
              className="secondary"
              onClick={() =>
                void run(async () => {
                  await sync();
                  await logout();
                })
              }
            >
              Sign out
            </button>
            <p className="muted tiny">
              Your guest sanctuary and account sanctuary use separate local
              saves.
            </p>
          </>
        ) : (
          <>
            <p>Keep your sanctuary with you across devices.</p>
            <button
              className="google-button"
              disabled={working}
              onClick={() => void run(google)}
            >
              Continue with Google
            </button>
            <div className="or">or use email</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => emailLogin(email, password, creating));
              }}
            >
              <label>
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete={creating ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button type="submit" disabled={working}>
                {working
                  ? "Connecting…"
                  : creating
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
            <div className="button-row">
              <button
                className="text-button small"
                onClick={() => setCreating(!creating)}
              >
                {creating
                  ? "Have an account? Sign in"
                  : "New here? Create account"}
              </button>
              <button
                className="text-button small"
                disabled={!email || working}
                onClick={async () => {
                  try {
                    await recover(email);
                    notify("Password recovery email requested.");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Reset password
              </button>
            </div>
            <p className="muted tiny">
              Sign in before starting for an account sanctuary. If you already
              played as a guest, import that sanctuary from Settings after
              signing in.
            </p>
          </>
        )}
        {error && <div className="notice danger">{error}</div>}
      </div>
    </div>
  );
}
function Rules({
  s,
  type,
  act,
  close,
}: {
  s: Save;
  type: "release" | "salvage";
  act: Act;
  close: () => void;
}) {
  const rules = type === "release" ? s.releaseRules : s.salvageRules;
  const [r, setR] = useState<Rule>({
    id: crypto.randomUUID(),
    name: "New rule",
    mode: "AND",
    enabled: true,
  });
  const patch = (p: Partial<Rule>) => setR({ ...r, ...p });
  const previews =
    type === "release"
      ? s.creatures.filter(
          (c) =>
            !c.locked && !c.favorite && E.free(s, c) && E.matchesCreature(r, c),
        )
      : s.items.filter(
          (i) =>
            !i.locked &&
            !i.favorite &&
            !i.level &&
            !E.equipped(s, i) &&
            E.matchesItem(r, i),
        );
  const level =
      type === "release" ? s.facilities.Hatchery : s.facilities.Workshop,
    required = type === "release" ? 8 : 4;
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Automation rules"
      >
        <button
          className="modal-close icon-button"
          onClick={close}
          aria-label="Close rules"
        >
          <X />
        </button>
        <h2>Auto-{type} rules</h2>
        <p>
          Requires {type === "release" ? "Hatchery 8" : "Workshop 4"}. Rules use
          their own AND/OR conditions. Any enabled matching rule triggers the
          action.
        </p>
        {rules.map((rule) => (
          <div className="rule-row" key={rule.id}>
            <label>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() =>
                  act((s) => {
                    const list =
                      type === "release" ? s.releaseRules : s.salvageRules;
                    list.find((r) => r.id === rule.id)!.enabled = !rule.enabled;
                  })
                }
              />
              {rule.name}
            </label>
            <span>{rule.mode}</span>
            <button
              className="icon-button"
              aria-label="Delete rule"
              onClick={() =>
                act((s) => {
                  if (type === "release")
                    s.releaseRules = s.releaseRules.filter(
                      (r) => r.id !== rule.id,
                    );
                  else
                    s.salvageRules = s.salvageRules.filter(
                      (r) => r.id !== rule.id,
                    );
                })
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <h3>Rule builder</h3>
        <label>
          Name
          <input
            value={r.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label>
          Match
          <select
            value={r.mode}
            onChange={(e) => patch({ mode: e.target.value as "AND" | "OR" })}
          >
            <option>AND</option>
            <option>OR</option>
          </select>
        </label>
        {type === "release" ? (
          <>
            <div className="two-col">
              <label>
                Family
                <select
                  value={r.family || ""}
                  onChange={(e) =>
                    patch({ family: e.target.value || undefined })
                  }
                >
                  <option value="">Any / ignored</option>
                  {FAMILIES.map((f) => (
                    <option value={f.id} key={f.id}>
                      {f.names[0]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Element
                <select
                  value={r.element || ""}
                  onChange={(e) =>
                    patch({
                      element: (e.target.value as Rule["element"]) || undefined,
                    })
                  }
                >
                  <option value="">Any / ignored</option>
                  {ELEMENTS.map((el) => (
                    <option key={el}>{el}</option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select
                  value={r.color || ""}
                  onChange={(e) =>
                    patch({ color: e.target.value || undefined })
                  }
                >
                  <option value="">Ignored</option>
                  {["Normal", "Inverted", "Prismatic"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Effect
                <select
                  value={r.effect || ""}
                  onChange={(e) =>
                    patch({ effect: e.target.value || undefined })
                  }
                >
                  <option value="">Ignored</option>
                  {["Normal", "Sparkling", "Glowing"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Stage
                <select
                  value={r.stage || ""}
                  onChange={(e) =>
                    patch({
                      stage: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">Ignored</option>
                  {[1, 2, 3].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Total IV at most
                <input
                  type="number"
                  min="0"
                  max="186"
                  value={r.maxIV ?? ""}
                  onChange={(e) =>
                    patch({
                      maxIV:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Perfect IV count at most
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={r.perfect ?? ""}
                  onChange={(e) =>
                    patch({
                      perfect:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
              {STATS.map((stat) => (
                <label key={stat}>
                  {stat.toUpperCase()} IV at most
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={r.ivThresholds?.[stat] ?? ""}
                    onChange={(e) =>
                      patch({
                        ivThresholds: {
                          ...r.ivThresholds,
                          [stat]:
                            e.target.value === ""
                              ? undefined
                              : Math.max(
                                  0,
                                  Math.min(
                                    31,
                                    Math.floor(Number(e.target.value)),
                                  ),
                                ),
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="two-col">
            <label>
              Slot
              <select
                value={r.slot || ""}
                onChange={(e) =>
                  patch({ slot: (e.target.value as Slot) || undefined })
                }
              >
                <option value="">Ignored</option>
                {["Essence", "Gem", "Trinket"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Rarity at most
              <select
                value={r.rarity ?? ""}
                onChange={(e) =>
                  patch({
                    rarity:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              >
                <option value="">Ignored</option>
                {RARITIES.map((v, i) => (
                  <option key={v} value={i}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Stat type
              <select
                value={r.affix || ""}
                onChange={(e) => patch({ affix: e.target.value || undefined })}
              >
                <option value="">Ignored</option>
                {Object.entries(AFFIX_NAMES).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {r.affix && (
              <label>
                Original stat roll at most
                <input
                  type="number"
                  min="0"
                  value={r.rollBelow ?? ""}
                  onChange={(e) =>
                    patch({
                      rollBelow:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
            )}
          </div>
        )}
        <div className="notice">
          <strong>Preview: {previews.length} eligible matches</strong>
          <p>
            {type === "release"
              ? (previews as Creature[]).slice(0, 12).map(cname).join(", ")
              : (previews as Item[])
                  .slice(0, 12)
                  .map((i) => RARITIES[i.rarity] + " " + i.slot)
                  .join(", ") || "No current equipment matches."}
          </p>
          <small>
            Protected entities are excluded. Automatic actions are recorded in
            history.
          </small>
        </div>
        <button
          disabled={level < required}
          onClick={() =>
            act((s) => {
              const list = type === "release" ? s.releaseRules : s.salvageRules;
              list.push({ ...r, id: crypto.randomUUID() });
              setR({
                id: crypto.randomUUID(),
                name: "New rule",
                mode: "AND",
                enabled: true,
              });
            })
          }
        >
          Save rule
        </button>
      </div>
    </div>
  );
}
function Workflows({
  s,
  act,
  close,
}: {
  s: Save;
  act: Act;
  close: () => void;
}) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(s.workflow?.nodes || []),
    [aid, setAid] = useState(ACTIVITIES[0].id),
    [resource, setResource] = useState(""),
    [target, setTarget] = useState(100),
    [cycles, setCycles] = useState(20),
    [loadout, setLoadout] = useState(""),
    [repeat, setRepeat] = useState(s.workflow?.repeat ?? true);
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Skilling workflows"
      >
        <button
          className="modal-close icon-button"
          onClick={close}
          aria-label="Close workflows"
        >
          <X />
        </button>
        <h2>Skilling workflow</h2>
        <p>
          Steps run in order. Unavailable steps are skipped; a loop with no
          possible progress pauses safely.
        </p>
        {nodes.map((n, i) => (
          <div className="rule-row" key={i}>
            <span>
              {i + 1}. {ACTIVITY[n.activity].name} ·{" "}
              {n.targetResource
                ? `${n.targetAmount} ${pretty(n.targetResource)}`
                : `${n.cycles} cycles`}
            </span>
            <button
              className="icon-button"
              aria-label="Delete step"
              onClick={() => setNodes(nodes.filter((_, j) => i !== j))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <label>
          Activity
          <select value={aid} onChange={(e) => setAid(e.target.value)}>
            {ACTIVITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.skill}: {a.name} (Lv {a.level})
              </option>
            ))}
          </select>
        </label>
        <div className="two-col">
          <label>
            Stop at resource target
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            >
              <option value="">Use cycle count instead</option>
              {Object.entries(MATERIALS).map(([id, n]) => (
                <option key={id} value={id}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {resource ? (
            <label>
              Target amount
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
              />
            </label>
          ) : (
            <label>
              Cycle count
              <input
                type="number"
                min="1"
                value={cycles}
                onChange={(e) => setCycles(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
        </div>
        <label>
          Skilling loadout (Workshop 8)
          <select
            disabled={s.facilities.Workshop < 8}
            value={loadout}
            onChange={(e) => setLoadout(e.target.value)}
          >
            <option value="">Keep current crew</option>
            {s.loadouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary"
          onClick={() =>
            setNodes([
              ...nodes,
              {
                activity: aid,
                ...(resource
                  ? { targetResource: resource, targetAmount: target }
                  : { cycles }),
                ...(loadout ? { loadout } : {}),
              },
            ])
          }
        >
          <Plus size={15} /> Add step
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
          />
          Repeat workflow
        </label>
        <div className="button-row">
          <button
            onClick={() =>
              act((s) => {
                s.workflow = {
                  enabled: false,
                  repeat,
                  nodes,
                  index: 0,
                  count: 0,
                };
                E.startWorkflow(s);
                close();
              })
            }
          >
            Save & start
          </button>
          <button
            className="secondary"
            onClick={() =>
              act((s) => {
                if (s.workflow) s.workflow.enabled = false;
                s.activity = null;
                close();
              })
            }
          >
            Stop workflow
          </button>
        </div>
      </div>
    </div>
  );
}
function EquipmentComparison({ items }: { items: Item[] }) {
  const keys = [...new Set(items.flatMap((i) => i.affixes.map((a) => a.key)))];
  return (
    <div className="panel comparison">
      <h3>Equipment comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Stat</th>
            {items.map((i) => (
              <th key={i.id}>
                {RARITIES[i.rarity]} {i.slot} +{i.level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td>{AFFIX_NAMES[k]}</td>
              {items.map((i) => (
                <td key={i.id}>{E.fmt(E.itemStats(i)[k] || 0, 2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pager({
  page,
  setPage,
  total,
}: {
  page: number;
  setPage: (n: number) => void;
  total: number;
}) {
  return (
    <div className="button-row">
      <button
        className="secondary small"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </button>
      <span className="tiny muted">
        {total ? Math.min(total, page * 30 + 1) : 0}–
        {Math.min(total, page * 30 + 30)} of {total}
      </span>
      <button
        className="secondary small"
        disabled={(page + 1) * 30 >= total}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
