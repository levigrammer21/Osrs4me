import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { cloudRead, cloudWrite } from "./persistence";
import { newSave } from "./engine";
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
describe.skipIf(!enabled)("Firestore ownership and revision rules", () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-creature-adventure",
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
    });
  });
  afterAll(async () => {
    await env?.cleanup();
  });
  it("rejects unsigned and cross-account reads/writes", async () => {
    const a = env.authenticatedContext("alice").firestore(),
      b = env.authenticatedContext("bob").firestore(),
      guest = env.unauthenticatedContext().firestore();
    await assertSucceeds(
      setDoc(doc(a, "players/alice/snapshots/test"), {
        payload: "{}",
        generation: "one",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(doc(b, "players/alice/snapshots/test")));
    await assertFails(getDoc(doc(guest, "players/alice/snapshots/test")));
    await assertFails(
      setDoc(doc(b, "players/alice/snapshots/bad"), {
        payload: "{}",
        generation: "one",
        createdAt: serverTimestamp(),
      }),
    );
  });
  it("permits only increasing committed revisions and immutable snapshots", async () => {
    const a = env.authenticatedContext("revision-user").firestore();
    const head = doc(a, "players/revision-user");
    await assertSucceeds(
      setDoc(head, {
        schema: 1,
        revision: 1,
        generation: "a",
        pages: 1,
        gameTime: 1000,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(head, { revision: 1, updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(head, {
        revision: 2,
        generation: "b",
        updatedAt: serverTimestamp(),
      }),
    );
    const snap = doc(a, "players/revision-user/snapshots/immutable");
    await assertSucceeds(
      setDoc(snap, {
        payload: "{}",
        generation: "b",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(snap, { payload: "tampered" }));
  });
  it("round-trips a partitioned account and rejects a stale device without duplicate rewards", async () => {
    const store = env
      .authenticatedContext("cloud-user")
      .firestore() as unknown as Firestore;
    const save = newSave(789, 1000);
    save.gold = "123";
    save.logs = Array.from({ length: 4000 }, (_, i) => ({
      id: "l" + i,
      time: 1000,
      type: "test",
      text: "Persistent unicode 🐾 🌊 " + i + " ".repeat(40),
    }));
    const first = await cloudWrite("cloud-user", save, 0, store);
    expect(first).toBe(1);
    const result = await cloudRead("cloud-user", store);
    expect(result.save).toEqual(save);
    const a = structuredClone(save),
      b = structuredClone(save);
    a.gold = "200";
    b.gold = "300";
    const outcomes = await Promise.allSettled([
      cloudWrite("cloud-user", a, 1, store),
      cloudWrite("cloud-user", b, 1, store),
    ]);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    const final = await cloudRead("cloud-user", store);
    expect(final.revision).toBe(2);
    expect(["200", "300"]).toContain(final.save!.gold);
  });
});
