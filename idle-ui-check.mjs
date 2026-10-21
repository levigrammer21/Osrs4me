import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";
import * as E from "./engine.ts";
const server = await createServer({
  configFile: "vite.config.ts",
  server: { host: "127.0.0.1", port: 5178 },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/tmp/ca-chromium/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process",
  ],
  headless: true,
});
const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  }),
  page = await context.newPage(),
  checks = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = (name, passed) => {
  checks.push({ name, passed: !!passed });
  if (!passed) throw Error(name);
};
async function nav(name) {
  if (page.viewportSize().width <= 900) {
    const b = page
      .locator(".bottom-nav")
      .getByRole("button", { name, exact: true });
    if (await b.count()) await b.click();
    else {
      await page.getByRole("button", { name: "Open game menu" }).click();
      await page
        .getByRole("dialog", { name: "Game menu" })
        .getByRole("button", { name, exact: true })
        .click();
    }
  } else if (name === "Skills")
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Woodcutting", exact: true })
      .click();
  else
    await page
      .locator(".sidebar")
      .getByRole("button", { name, exact: true })
      .click();
}
async function writeSave(s) {
  await page.evaluate(async (s) => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("creature-adventure", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise((resolve) => {
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(s, "guest");
      tx.oncomplete = resolve;
    });
  }, s);
  await page.reload();
  await page.locator(".dashboard").waitFor();
}
const fits = () =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
try {
  await page.goto("http://127.0.0.1:5178/");
  await page.locator(".starter").first().waitFor();
  await page.locator(".starter").first().click();
  await page.locator(".dashboard").waitFor();
  check(
    "new-player overview explains incubation",
    (await page.locator(".idle-callout").innerText()).includes("Incubating"),
  );
  let save = E.newSave(472, Date.now());
  E.starter(save, "F01");
  save.incubators[0].finish = save.time;
  await writeSave(save);
  await page
    .locator(".idle-callout")
    .getByRole("button", { name: "Hatch", exact: true })
    .click();
  check(
    "starter hatches directly from overview",
    (await page.getByRole("button", { name: "Claim supplies" }).count()) === 1,
  );
  await page.getByRole("button", { name: "Claim supplies" }).click();
  check(
    "welcome supplies remain functional",
    (await page.getByRole("button", { name: "Claim supplies" }).count()) === 0,
  );
  save = E.newSave(2281, Date.now());
  save.started = true;
  save.gold = "200000";
  save.facilities = {
    Housing: 30,
    Hatchery: 8,
    Breeding: 4,
    Recovery: 3,
    Workshop: 8,
    Expedition: 3,
  };
  save.unlocks = Array.from({ length: 10 }, (_, n) => "boss-" + n);
  save.claims.push("farm-welcome");
  for (const [n, family] of [
    "F01",
    "E01",
    "S06",
    "N02",
    "W04",
    "S02",
    "E02",
    "N01",
    "W01",
    "F02",
    "S01",
    "N04",
  ].entries()) {
    const inc = {
      id: "qa-" + n,
      egg: E.egg(save, family, "UI fixture"),
      finish: save.time,
    };
    save.incubators.push(inc);
    E.hatch(save, inc.id);
    const c = save.creatures.at(-1);
    c.level = 360;
    c.stage = 3;
  }
  save.incubators = save.incubators.slice(0, 2);
  save.combatTeam = save.creatures.slice(0, 6).map((c) => c.id);
  save.skillTeam = save.creatures.slice(6, 8).map((c) => c.id);
  for (const k of Object.keys(save.skills)) save.skills[k].level = 500;
  for (let k = 0; k < 4; k++)
    for (let t = 0; t < 12; t++) save.inventory[`g${k}-${t}`] = "1000";
  for (const k of [
    "ration",
    "potion",
    "ward",
    "relic",
    "catalyst",
    "essence",
    "gemdust",
    "thread",
  ])
    save.inventory[k] = "1000";
  for (let n = 0; n < 10; n++)
    save.items.push(E.rollItem(save, 5, undefined, n % 6));
  for (let n = 0; n < 34; n++)
    save.eggs.push(E.egg(save, "F01", "Stack fixture"));
  E.startFarmTask(save, 0, "g0-0");
  E.startCombat(save, "boss-7");
  await writeSave(save);
  check(
    "overview uses activity ledger instead of illustrated farm hero",
    (await page.locator(".idle-dashboard").count()) === 1 &&
      (await page.locator(".homestead-scene").count()) === 0,
  );
  check(
    "overview exposes every skill with actual levels",
    (await page.locator(".skill-overview-grid button").count()) === 9,
  );
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: width >= 768 ? 950 : 844 });
    check("overview fits " + width + "px", await fits());
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-overview-mobile.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  for (const name of [
    "Home",
    "Combat",
    "Creatures",
    "Skills",
    "Farm",
    "Bank",
    "Equipment",
    "Slayer",
    "Collection",
    "Shop",
    "Settings",
  ]) {
    await nav(name);
    check(
      name + " navigation works",
      (await page.locator("main").count()) === 1,
    );
    check(name + " fits mobile", await fits());
  }
  await nav("Skills");
  check(
    "skill screen combines activity catalog and selected recipe",
    (await page.locator(".activity-catalog-row").count()) > 1 &&
      (await page.locator(".recipe-panel").count()) === 1,
  );
  await page.getByRole("button", { name: "Manage work station 2" }).click();
  await page
    .locator(".skill-jump-list")
    .getByRole("button", { name: "Mining", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start Copper", exact: false })
    .click();
  check(
    "second work area starts while first keeps running",
    (await page
      .locator(".current-work")
      .innerText()
      .then((t) => t.includes("Mining"))) &&
      (await page
        .locator(".station-ledger-row")
        .filter({ hasText: "Woodcutting" })
        .count()) === 1,
  );
  await page.reload();
  await page.locator(".dashboard").waitFor();
  await nav("Skills");
  check(
    "parallel activities persist through refresh",
    (await page
      .locator(".station-ledger-row")
      .filter({ hasText: "Mining" })
      .count()) === 1,
  );
  await page.getByRole("button", { name: "Manage work station 3" }).click();
  await page
    .locator(".skill-jump-list")
    .getByRole("button", { name: "Foraging", exact: true })
    .click();
  check(
    "foraging shows reduced actual egg probability",
    (await page.locator(".rate-note").innerText()).includes(
      "Egg discovery: 0.001%",
    ),
  );
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-skills-mobile.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await nav("Bank");
  check(
    "bank uses real stack grid",
    (await page.locator(".bank-tile").count()) > 30,
  );
  await page.getByLabel("Search bank").fill("Ash");
  check(
    "bank search filters actual material stacks",
    (await page.locator(".bank-tile").count()) > 0 &&
      (await page.locator(".bank-tile").count()) < 30,
  );
  await page.locator(".bank-tile").first().click();
  check(
    "selecting a stack opens its actions",
    (await page.getByLabel("Sell quantity").count()) === 1,
  );
  const goldBefore = await page.locator(".top-resources strong").innerText();
  await page.getByLabel("Sell quantity").fill("3");
  await page
    .getByRole("button", { name: "Sell for 6 gold", exact: true })
    .click();
  check(
    "bank sale changes actual gold",
    (await page.locator(".top-resources strong").innerText()) !== goldBefore,
  );
  await page.getByLabel("Search bank").fill("");
  await page
    .locator('[aria-label="Bank categories"]')
    .getByRole("button", { name: /^Eggs/ })
    .click();
  check(
    "eggs remain stacked in bank",
    (await page.locator(".egg-bank-tile").count()) === 1 &&
      (await page.locator(".egg-bank-tile").innerText()).includes("×34"),
  );
  await page.locator(".egg-bank-tile").click();
  await page.getByRole("button", { name: "Load a nest", exact: true }).click();
  check(
    "bank can load an egg without duplicating it",
    (await page.locator(".egg-bank-tile").innerText()).includes("×33"),
  );
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-bank-mobile.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await nav("Farm");
  check(
    "farm overview exposes all real facility upgrades",
    (await page.locator(".facility-ledger-row").count()) === 6,
  );
  await page
    .locator('[aria-label="Farm sections"]')
    .getByRole("button", { name: "Hatchery", exact: true })
    .click();
  check(
    "nursery preserves stacked pantry and occupied nest",
    (await page.locator(".egg-stack").count()) === 1 &&
      (await page.locator(".nest.occupied").count()) === 1,
  );
  // Separate durable combat animation fixture, independent of prior timed navigation.
  const animationSave = structuredClone(save);
  animationSave.time = Date.now();
  animationSave.combat = null;
  E.startCombat(animationSave, "boss-7");
  for (const u of animationSave.combat.units) {
    u.hp = "1e30";
    u.maxHp = "1e30";
    u.next = animationSave.time + 100;
  }
  await writeSave(animationSave);
  await nav("Combat");
  await page.locator(".battle-stage").waitFor();
  await page.evaluate(() => {
    window.flightSeen = { incoming: false, outgoing: false, moving: false };
    window.flightScan = setInterval(() => {
      for (const el of document.querySelectorAll(".projectile")) {
        if (el.dataset.actor.startsWith("enemy-"))
          window.flightSeen.incoming = true;
        else window.flightSeen.outgoing = true;
        if (
          Number(getComputedStyle(el).opacity) > 0.3 &&
          getComputedStyle(el).transform !== "none"
        )
          window.flightSeen.moving = true;
      }
    }, 16);
  });
  await page.waitForFunction(
    () =>
      window.flightSeen.incoming &&
      window.flightSeen.outgoing &&
      window.flightSeen.moving,
    { timeout: 15000 },
  );
  check("combat still animates projectiles in both directions", true);
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-combat-mobile.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Drop rates", exact: true }).click();
  check(
    "live drops expose per-victory and conditional rarity rates",
    (await page.locator(".loot-sheet").innerText()).includes("Given an item"),
  );
  await page.getByRole("button", { name: "Close drops" }).click();
  await page.getByRole("button", { name: "Hunts", exact: true }).click();
  await page
    .locator(".hunt-row")
    .first()
    .getByRole("button", { name: "Drop rates" })
    .click();
  check(
    "wild drop sheet shows the reduced egg chance",
    (await page.locator(".loot-sheet").innerText()).includes("0.05%"),
  );
  await page.getByRole("button", { name: "Close drops" }).click();
  await page.getByRole("button", { name: "Dungeons", exact: true }).click();
  await page.getByRole("button", { name: "Completion drops" }).first().click();
  check(
    "adventure drops identify first-clear guarantees",
    (await page.locator(".loot-sheet").innerText()).includes("First clear"),
  );
  await page.keyboard.press("Escape");
  check(
    "Escape dismisses detail sheet",
    (await page.locator(".loot-sheet").count()) === 0,
  );
  await nav("Equipment");
  await page.locator(".gear-open").first().click();
  await page.getByRole("button", { name: "Lock", exact: true }).click();
  check(
    "retained equipment actions remain functional",
    (await page
      .getByRole("button", { name: "Unlock", exact: true })
      .count()) === 1,
  );
  await page.getByRole("button", { name: "Close equipment" }).click();
  await page.setViewportSize({ width: 1280, height: 950 });
  for (const name of [
    "Home",
    "Combat",
    "Creatures",
    "Skills",
    "Farm",
    "Bank",
    "Equipment",
    "Slayer",
    "Collection",
    "Shop",
    "Settings",
  ]) {
    await nav(name);
    check(name + " fits desktop", await fits());
  }
  await nav("Skills");
  check(
    "desktop grouped navigation exposes all eight skills",
    (await page.locator(".sidebar .nav-skill").count()) === 8,
  );
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-skills-desktop.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await nav("Home");
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-overview-desktop.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  await page.setViewportSize({ width: 320, height: 844 });
  for (const name of ["Skills", "Bank", "Combat", "Equipment", "Farm"]) {
    await nav(name);
    check(name + " fits narrow 320px phone", await fits());
  }
  check("no uncaught UI errors", errors.length === 0);
} catch (e) {
  checks.push({ name: "aborted", passed: false, error: e.message });
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/idle-ui-failure.png",
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
} finally {
  fs.writeFileSync(
    "IDLE-UI-REPORT.json",
    JSON.stringify(
      { timestamp: new Date().toISOString(), checks, errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(checks, null, 2));
  await browser.close();
  await server.close();
  if (checks.some((c) => !c.passed)) process.exitCode = 1;
}
