import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  writeBatch,
  runTransaction,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { Save, STATS, SKILLS, VERSION } from "./model";
import { FAMILY, ACTIVITY } from "./content";
import { newSave } from "./engine";
const app = initializeApp({
  apiKey: "AIzaSyCeA0YC2ME_PbSixHjfs5nUfHZO6pLqCME",
  authDomain: "creaturerpg.firebaseapp.com",
  projectId: "creaturerpg",
  storageBucket: "creaturerpg.firebasestorage.app",
  messagingSenderId: "897113117939",
  appId: "1:897113117939:web:6879d43a97d29ffbd15386",
});
export const auth = getAuth(app),
  db = getFirestore(app);
export const google = () => signInWithPopup(auth, new GoogleAuthProvider());
export const emailLogin = (email: string, password: string, create = false) =>
  create
    ? createUserWithEmailAndPassword(auth, email, password)
    : signInWithEmailAndPassword(auth, email, password);
export const recover = (email: string) => sendPasswordResetEmail(auth, email);
export const logout = () => signOut(auth);
export const watchAuth = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);
export function migrate(value: unknown): Save {
  if (!value || typeof value !== "object") throw Error("Invalid save.");
  const s = value as Save;
  if (s.schema !== 1)
    throw Error(
      "This save requires a different game version. Your original data has been preserved.",
    );
  if (
    !Array.isArray(s.creatures) ||
    !Array.isArray(s.items) ||
    !s.skills ||
    typeof s.time !== "number" ||
    !Number.isFinite(s.time) ||
    !Number.isInteger(s.rng)
  )
    throw Error("Save validation failed.");
  if (
    s.creatures.some(
      (c) =>
        !c.id ||
        !FAMILY[c.family] ||
        !c.ivs ||
        ![1, 2, 3].includes(c.stage) ||
        !Number.isSafeInteger(c.level) ||
        c.level < 1 ||
        STATS.some(
          (k) => !Number.isInteger(c.ivs[k]) || c.ivs[k] < 0 || c.ivs[k] > 31,
        ),
    ) ||
    s.items.some(
      (i) =>
        !i.id ||
        !Array.isArray(i.affixes) ||
        i.affixes.length !== i.rarity + 1 ||
        new Set(i.affixes.map((a) => a.key)).size !== i.affixes.length,
    )
  )
    throw Error("Invalid collection data.");
  const identities = [...s.creatures, ...s.eggs, ...s.items].map((v) => v.id);
  if (
    new Set(identities).size !== identities.length ||
    !Array.isArray(s.combatTeam) ||
    s.combatTeam.length !== 6 ||
    !Array.isArray(s.skillTeam) ||
    s.skillTeam.length > 6 ||
    new Set(s.skillTeam).size !== s.skillTeam.length ||
    s.skillTeam.some((id) => s.combatTeam.includes(id)) ||
    SKILLS.some(
      (k) =>
        !s.skills[k] ||
        !Number.isSafeInteger(s.skills[k].level) ||
        s.skills[k].level < 1,
    )
  )
    throw Error(
      "Invalid team or progression data. Original checkpoint preserved.",
    );
  const farmJobs = s.farmJobs || [];
  const workers = [...s.skillTeam, ...farmJobs.flatMap((j) => j.team || [])];
  if (
    farmJobs.length > 7 ||
    farmJobs.some(
      (j) =>
        !Array.isArray(j.team) ||
        j.team.length > 6 ||
        (j.activity && !ACTIVITY[j.activity]) ||
        (j.job &&
          (!ACTIVITY[j.job.activity] || !Number.isFinite(j.job.finish))),
    ) ||
    new Set(workers).size !== workers.length ||
    workers.some(
      (id) =>
        !s.creatures.some((c) => c.id === id) ||
        s.combatTeam.includes(id) ||
        s.breeding.some((b) => b.parents.includes(id)),
    )
  )
    throw Error("Invalid farm assignments. Original checkpoint preserved.");
  const incubators = s.incubators.map((inc) =>
    !s.farmRevision &&
    inc.egg &&
    inc.finish > s.time &&
    inc.egg.source !== "Starter"
      ? { ...inc, finish: s.time + (inc.finish - s.time) / 12 }
      : inc,
  );
  // Version 1 uses the original schema; migrate metadata without recreating any
  // creature, egg, random roll, or active job from development checkpoints.
  return {
    ...s,
    version: VERSION,
    farmJobs,
    farmRevision: 1,
    incubators,
    settings: { ...s.settings, offlineHours: 12 },
    discovered: [...new Set(s.discovered)],
    variants: [
      ...new Set(s.variants.filter((v) => !v.endsWith("-Normal-Normal"))),
    ],
  };
}
let database: Promise<IDBDatabase> | undefined;
function localDB() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("creature-adventure", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("saves");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}
export async function localRead(key: string) {
  const db = await localDB();
  return new Promise<Save | null>((resolve, reject) => {
    const tx = db.transaction("saves", "readonly");
    const req = tx.objectStore("saves").get(key);
    req.onsuccess = () => {
      try {
        resolve(req.result ? migrate(req.result) : null);
      } catch (e) {
        reject(e);
      }
    };
    req.onerror = () => reject(req.error);
  });
}
export async function localWrite(key: string, s: Save) {
  const db = await localDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("saves", "readwrite");
    tx.objectStore("saves").put(structuredClone(s), key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export interface CloudHead {
  revision: number;
  generation: string;
  pages: number;
  updatedAt?: { toMillis: () => number };
}
export async function cloudRead(uid: string, store: Firestore = db) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await getDocFromServer(doc(store, "players", uid));
    if (!head.exists()) return { save: null, revision: 0, time: null };
    const h = head.data() as CloudHead;
    if (!Number.isSafeInteger(h.pages) || h.pages < 1 || !h.generation)
      throw Error(
        "Invalid cloud snapshot header. Local progress is preserved.",
      );
    const pages = await Promise.all(
      Array.from({ length: h.pages }, (_, i) =>
        getDoc(doc(store, "players", uid, "snapshots", `${h.generation}-${i}`)),
      ),
    );
    if (pages.some((p) => !p.exists())) {
      // A second device may publish a replacement and remove the generation
      // between reading its header and pages. Retry the current pointer.
      if (attempt < 2) continue;
      throw Error("Cloud snapshot is incomplete. Local progress is preserved.");
    }
    const json = pages.map((p) => p.data()!.payload as string).join("");
    return {
      save: migrate(JSON.parse(json)),
      revision: h.revision,
      time: h.updatedAt?.toMillis() || null,
    };
  }
  throw Error("Cloud snapshot could not be opened.");
}
export async function cloudWrite(
  uid: string,
  save: Save,
  expectedRevision: number,
  store: Firestore = db,
) {
  const snapshot = JSON.stringify(save);
  const pages = partitionSnapshot(snapshot);
  const generation = crypto.randomUUID();
  for (let offset = 0; offset < pages.length; offset += 8) {
    const batch = writeBatch(store);
    pages
      .slice(offset, offset + 8)
      .forEach((payload, j) =>
        batch.set(
          doc(
            store,
            "players",
            uid,
            "snapshots",
            `${generation}-${offset + j}`,
          ),
          { payload, generation, createdAt: serverTimestamp() },
        ),
      );
    await batch.commit();
  }
  let oldGeneration: string | undefined;
  const revision = await runTransaction(store, async (tx) => {
    const ref = doc(store, "players", uid);
    const head = await tx.get(ref);
    const data = head.data() as CloudHead | undefined;
    if ((data?.revision || 0) !== expectedRevision)
      throw Error(
        "CLOUD_CONFLICT: Another device saved first. Choose which timeline to keep.",
      );
    oldGeneration = data?.generation;
    tx.set(ref, {
      schema: 1,
      revision: expectedRevision + 1,
      generation,
      pages: pages.length,
      updatedAt: serverTimestamp(),
      gameTime: save.time,
    });
    return expectedRevision + 1;
  });
  // Old immutable generations are safe to remove after publishing the new pointer.
  if (oldGeneration) {
    try {
      const q = await getDocs(
        query(
          collection(store, "players", uid, "snapshots"),
          where("generation", "==", oldGeneration),
        ),
      );
      for (let offset = 0; offset < q.docs.length; offset += 8) {
        const batch = writeBatch(store);
        q.docs.slice(offset, offset + 8).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {
      /* Cleanup failure does not invalidate the committed save. */
    }
  }
  return revision;
}
export function downloadSave(s: Save) {
  const blob = new Blob([JSON.stringify(s)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Creature-Adventure-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function importSave(file: File) {
  return migrate(JSON.parse(await file.text()));
}
export { newSave };

export async function serverClock(uid: string) {
  const reference = doc(
    db,
    "players",
    uid,
    "snapshots",
    "clock-" + crypto.randomUUID(),
  );
  const batch = writeBatch(db);
  batch.set(reference, {
    payload: "",
    generation: "clock",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  const snap = await getDocFromServer(reference);
  const stamp = snap.data()?.createdAt?.toMillis();
  await deleteDoc(reference);
  if (!Number.isFinite(stamp)) throw Error("Server clock unavailable.");
  return stamp as number;
}

export function partitionSnapshot(snapshot: string, size = 50000) {
  const pages: string[] = [];
  for (let i = 0; i < snapshot.length;) {
    let end = Math.min(snapshot.length, i + size);
    const last = snapshot.charCodeAt(end - 1);
    if (end < snapshot.length && last >= 0xd800 && last <= 0xdbff) end--;
    pages.push(snapshot.slice(i, end));
    i = end;
  }
  return pages;
}
