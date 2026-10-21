import fs from "node:fs";
import path from "node:path";
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
if (fs.existsSync("img")) fs.cpSync("img", "dist/img", { recursive: true, filter: (source) => !path.basename(source).startsWith(".") });
fs.renameSync("dist/index.source.html", "dist/index.html");
fs.writeFileSync(
  "dist/manifest.webmanifest",
  JSON.stringify({
    name: "Creature Adventure",
    short_name: "Creatures",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#1c2534",
    theme_color: "#1c2534",
    icons: [
      {
        src: "./icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }),
);
fs.writeFileSync(
  "dist/icon.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="38" fill="#182b27"/><path d="M96 20 164 50 154 142 96 174 38 142 28 50Z" fill="#d9a56a"/><path d="m96 48 33 80H63Z" fill="#20392e"/><circle cx="96" cy="117" r="18" fill="#d9a56a"/></svg>',
);
const files = fs
  .readdirSync("dist", { recursive: true })
  .filter((f) => fs.statSync("dist/" + f).isFile());
fs.writeFileSync(
  "dist/sw.js",
  `const CACHE='creature-adventure-${version}-${Date.now()}';const ASSETS=${JSON.stringify(files.map((f) => "./" + f))};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('creature-adventure-')&&k!==CACHE).map(k=>caches.delete(k))))));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(fetch(e.request).catch(async()=>{const found=await caches.match(e.request);if(found)return found;if(e.request.mode==='navigate')return caches.match('./index.html');return Response.error();}));});`,
);
fs.writeFileSync("dist/.nojekyll", "");
fs.mkdirSync(path.resolve("..", "creature-adventure-ready"), {
  recursive: true,
});
const dest = path.resolve("..", "creature-adventure-ready");
// Remove stale hashed bundles from earlier builds before assembling delivery.
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync("."))
  if (
    fs.statSync(file).isFile() &&
    !file.endsWith(".log") &&
    !file.startsWith("firebase-debug") &&
    file !== ".gitignore"
  )
    fs.copyFileSync(file, path.join(dest, file));
for (const file of fs.readdirSync("dist"))
  fs.cpSync("dist/" + file, path.join(dest, file), { recursive: true });
