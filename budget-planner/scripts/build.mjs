// Builds the planner into self-contained HTML files.
//   node budget-planner/scripts/build.mjs
// Outputs:
//   budget-planner/dist/<Name>-Planner.html   full edition, the file buyers download (offline)
//   budget-planner/dist/<Name>-Demo.html      free demo (sample data, resets per tab)
//   public/<hostedDir>/                       full edition for the online link (+ PWA files)
//   public/<hostedDir>/demo/                  online demo
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const src = (f) => readFileSync(join(root, "src", f), "utf8");

const jsFiles = readdirSync(join(root, "src")).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
const iconSvg = readFileSync(join(root, "assets", "icon.svg"), "utf8");
const favicon = "data:image/svg+xml," + encodeURIComponent(iconSvg);
const fileBase = config.appName.replace(/\s+/g, "-");

function build(edition, { pwa }) {
  let js = jsFiles.map((f) => `/* ${f} */\n${src(f)}`).join("\n");
  js = js
    .replace('const APP_NAME = "Lumi Budget";', `const APP_NAME = ${JSON.stringify(config.appName)};`)
    .replace('const SHOP_URL = "https://www.etsy.com/shop/YOUR-SHOP-NAME";', `const SHOP_URL = ${JSON.stringify(config.shopUrl)};`)
    .replace('"__EDITION__"', JSON.stringify(edition));
  if (js.includes("</script")) throw new Error("Script contains </script — would break inlining");
  const pwaLinks = pwa
    ? `<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">`
    : "";
  return src("index.html")
    .replaceAll("__APP_NAME__", config.appName)
    .replace("__FAVICON__", favicon)
    .replace("__PWA_LINKS__", pwaLinks)
    .replace("__STYLES__", () => src("styles.css"))
    .replace("__SCRIPT__", () => `"use strict";\n(() => {\n${js}\n})();`);
}

const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, `${fileBase}-Planner.html`), build("full", { pwa: false }));
writeFileSync(join(dist, `${fileBase}-Demo.html`), build("demo", { pwa: false }));

const hosted = join(repo, "public", config.hostedDir);
mkdirSync(join(hosted, "demo"), { recursive: true });
writeFileSync(join(hosted, "index.html"), build("full", { pwa: true }));
writeFileSync(join(hosted, "demo", "index.html"), build("demo", { pwa: false }));
writeFileSync(join(hosted, "icon.svg"), iconSvg);
for (const png of ["icon-180.png", "icon-192.png", "icon-512.png"]) {
  if (existsSync(join(root, "assets", png))) copyFileSync(join(root, "assets", png), join(hosted, png));
}
writeFileSync(
  join(hosted, "manifest.webmanifest"),
  JSON.stringify({
    name: config.appName,
    short_name: config.appName.split(" ")[0],
    description: "Calm, ADHD-friendly budget planner",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#fbf4f6",
    theme_color: "#e0607e",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }, null, 2),
);
// Network-first service worker: always fresh online, still opens offline.
writeFileSync(
  join(hosted, "sw.js"),
  `const CACHE = "${fileBase.toLowerCase()}-v${Date.now()}";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("./index.html"))));
});
`,
);
const kb = (f) => Math.round(readFileSync(f).length / 1024);
console.log(`Built ${config.appName}: dist/${fileBase}-Planner.html (${kb(join(dist, `${fileBase}-Planner.html`))} KB), demo, and public/${config.hostedDir}/`);
