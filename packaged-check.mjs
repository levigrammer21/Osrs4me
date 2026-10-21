import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
const root = path.resolve("..", "creature-adventure-ready");
const prefix = "/Creature-adventure-/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || "").split("?")[0]);
  if (!name.startsWith(prefix)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const file = path.join(root, name.slice(prefix.length) || "index.html");
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "text/plain",
    });
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(5180, "127.0.0.1", resolve));
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
});
const page = await context.newPage();
const checks = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = (name, pass) => {
  checks.push({ name, passed: !!pass });
  if (!pass) throw Error(name);
};
try {
  await page.goto("http://127.0.0.1:5180" + prefix, {
    waitUntil: "domcontentloaded",
  });
  await page.locator(".starter").first().waitFor();
  check("compiled bundles load under repository subpath", true);
  await page.locator(".starter").first().click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".dashboard").waitFor();
  check(
    "service worker controls installed game",
    await page.evaluate(() => !!navigator.serviceWorker.controller),
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".dashboard").waitFor();
  check("installed game and device progress survive an offline reload", true);
  check(
    "release version is visible",
    (await page.locator("body").innerText()).includes(
      JSON.parse(fs.readFileSync("package.json", "utf8")).version,
    ),
  );
  const cachedArt = await page.evaluate(async () => {
    for (let n = 1; n <= 10; n++) {
      const r = await fetch(
        "./img/atlas-" + String(n).padStart(2, "0") + ".png",
      );
      if (!r.ok || (await r.blob()).size < 10000) return false;
    }
    return true;
  });
  check("all ten painted atlases remain available offline", cachedArt);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Farm", exact: true })
    .click();
  await page
    .locator('[aria-label="Farm sections"]')
    .getByRole("button", { name: "Hatchery", exact: true })
    .click();
  check(
    "nursery painted previews remain available offline",
    (await page.locator(".creature-art image").count()) > 0,
  );
  check(
    "packaged app has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  check("no runtime errors in compiled output", errors.length === 0);
} catch (error) {
  checks.push({ name: "aborted", passed: false, error: error.message });
} finally {
  fs.writeFileSync(
    "PACKAGED-REPORT.json",
    JSON.stringify(
      { timestamp: new Date().toISOString(), checks, errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(checks, null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  if (checks.some((c) => !c.passed)) process.exitCode = 1;
}
