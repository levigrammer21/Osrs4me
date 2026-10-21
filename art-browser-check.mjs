import { createServer } from "vite";
import { chromium } from "playwright";
import fs from "node:fs";
import { CREATURE_ART } from "./art.ts";
import * as E from "./engine.ts";
const server = await createServer({
  configFile: "vite.config.ts",
  server: { host: "127.0.0.1", port: 5179 },
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
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = (name, passed) => {
  checks.push({ name, passed: !!passed });
  if (!passed) throw Error(name);
};
try {
  await page.goto("http://127.0.0.1:5179/");
  await page.locator(".starter").first().waitFor();
  const s = E.newSave(145, Date.now());
  s.started = true;
  s.discovered = Object.keys(CREATURE_ART);
  s.metrics.forms = 150;
  s.facilities.Housing = 20;
  for (const color of ["Normal", "Inverted", "Prismatic"])
    for (const effect of ["Normal", "Sparkling", "Glowing"]) {
      const inc = {
        id: E.id(s, "inc"),
        egg: E.egg(s, "F01", "Variant appearance fixture"),
        finish: s.time,
      };
      s.incubators.push(inc);
      E.hatch(s, inc.id);
      const c = s.creatures.at(-1);
      c.color = color;
      c.effect = effect;
    }
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
  await page
    .locator(".sidebar .idle-nav-groups")
    .getByRole("button", { name: "Collection", exact: true })
    .click();
  const seen = new Set();
  for (let n = 0; n < 5; n++) {
    await page.locator(".family-entry").first().waitFor();
    for (const form of await page
      .locator(".family-entry .sigil")
      .evaluateAll((els) => els.map((e) => e.dataset.form)))
      seen.add(form);
    const decoded = await page
      .locator(".family-entry image")
      .evaluateAll(async (els) => {
        const urls = [...new Set(els.map((e) => e.getAttribute("href")))];
        return Promise.all(
          urls.map(
            (url) =>
              new Promise((resolve) => {
                const i = new Image();
                i.onload = () => resolve(i.naturalWidth > 0);
                i.onerror = () => resolve(false);
                i.src = url;
              }),
          ),
        );
      });
    check(
      "encyclopedia art page " + (n + 1) + " decodes",
      decoded.every(Boolean),
    );
    for (let i = 0; i < 30; i++) {
      await page.locator(".family-entry .form-portrait").nth(i).click();
      await page.locator(".form-preview").waitFor();
      if (
        (await page.locator(".form-preview .stats-grid strong").count()) !== 14
      )
        throw Error("Missing form stats or aptitudes");
      await page
        .getByRole("button", { name: "Close form", exact: true })
        .click();
    }
    check("all thirty form inspectors open on page " + (n + 1), true);
    await page.screenshot({
      path: `/workspace/scratch/3b8102b303b2/art-page-${n + 1}.png`,
      fullPage: true,
    });
    if (n < 4)
      await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  check(
    "all 150 form portraits render across encyclopedia pages",
    seen.size === 150,
  );
  await page
    .locator(".sidebar .idle-nav-groups")
    .getByRole("button", { name: "Creatures", exact: true })
    .click();
  check(
    "all nine variant combinations have distinct classes",
    new Set(
      await page
        .locator(".creature-card .sigil")
        .evaluateAll((els) => els.map((e) => e.className)),
    ).size === 9,
  );
  await page.screenshot({
    path: "/workspace/scratch/3b8102b303b2/variant-art.png",
    fullPage: true,
  });
  check("no artwork runtime errors", errors.length === 0);
} catch (error) {
  checks.push({ name: "aborted", passed: false, error: error.message });
} finally {
  fs.writeFileSync(
    "ART-BROWSER-REPORT.json",
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
