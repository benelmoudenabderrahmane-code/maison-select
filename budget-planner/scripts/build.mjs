// Builds every edition of the planner into self-contained HTML files.
//   node budget-planner/scripts/build.mjs
// For each edition in config.json it writes, under <outDir> (default ../TIDDYPLANNER):
//   <folder>/<Name>-Planner.html   full edition — the file buyers download (works offline)
//   <folder>/<Name>-Demo.html      free demo (sample data, resets per tab, no backups)
//   <folder>/LISTING.md            Etsy listing copy
//   site/<hostedDir>/              online version (+ PWA manifest, service worker, icons)
//   site/<hostedDir>/demo/         online demo
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const src = (f) => readFileSync(join(root, "src", f), "utf8");
const edFile = (ed, f) => join(root, "editions", ed.id, f);
const readIf = (p) => (existsSync(p) ? readFileSync(p, "utf8").trim() : "");
const jsFiles = readdirSync(join(root, "src")).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
export const fileBase = (ed) => ed.appName.replace(/\s+/g, "-");

function build(ed, edition, { pwa }) {
  const skin = {
    id: ed.id,
    ...ed.skin,
    logo: readIf(edFile(ed, "logo.svg")),
    flourish: readIf(edFile(ed, "flourish.svg")),
    sideArt: readIf(edFile(ed, "side-art.svg")),
  };
  const buildInfo = { appName: ed.appName, tagline: ed.tagline, storeKey: ed.storeKey, edition, shopUrl: config.shopUrl, skin };
  const js = `const __BUILD__ = ${JSON.stringify(buildInfo)};\n` + jsFiles.map((f) => `/* ${f} */\n${src(f)}`).join("\n");
  if (/<\/script/i.test(js)) throw new Error("Script contains </script — would break inlining");
  const css = src("styles.css") + "\n" + readIf(edFile(ed, "skin.css"));
  const favicon = "data:image/svg+xml," + encodeURIComponent(readFileSync(edFile(ed, "icon.svg"), "utf8"));
  const pwaLinks = pwa ? `<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">` : "";
  return src("index.html")
    .replaceAll("__APP_NAME__", ed.appName)
    .replace("__THEME_COLOR__", ed.themeColor)
    .replace("__FONTS__", ed.fonts)
    .replace("__FAVICON__", favicon)
    .replace("__PWA_LINKS__", pwaLinks)
    .replace("__STYLES__", () => css)
    .replace("__SCRIPT__", () => `"use strict";\n(() => {\n${js}\n})();`);
}

function writeSite(ed) {
  const dir = join(out, "site", ed.hostedDir);
  mkdirSync(join(dir, "demo"), { recursive: true });
  writeFileSync(join(dir, "index.html"), build(ed, "full", { pwa: true }));
  writeFileSync(join(dir, "demo", "index.html"), build(ed, "demo", { pwa: false }));
  copyFileSync(edFile(ed, "icon.svg"), join(dir, "icon.svg"));
  for (const png of ["icon-180.png", "icon-192.png", "icon-512.png"]) {
    if (existsSync(edFile(ed, png))) copyFileSync(edFile(ed, png), join(dir, png));
  }
  writeFileSync(join(dir, "manifest.webmanifest"), JSON.stringify({
    name: ed.appName,
    short_name: ed.appName.split(" ")[0],
    description: ed.tagline,
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: ed.themeColor,
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }, null, 2));
  // Network-first service worker: always fresh online, still opens offline.
  writeFileSync(join(dir, "sw.js"), `const CACHE = "${ed.id}-v${Date.now()}";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("${ed.id}-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match("./index.html"))));
});
`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  rmSync(join(out, "site"), { recursive: true, force: true });
  for (const ed of config.editions) {
    const dir = join(out, ed.folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${fileBase(ed)}-Planner.html`), build(ed, "full", { pwa: false }));
    writeFileSync(join(dir, `${fileBase(ed)}-Demo.html`), build(ed, "demo", { pwa: false }));
    if (existsSync(edFile(ed, "LISTING.md"))) {
      const fill = (s) => s.replaceAll("{{DEMO_URL}}", `${config.publicUrl}/${ed.hostedDir}/demo/`).replaceAll("{{URL}}", `${config.publicUrl}/${ed.hostedDir}/`);
      writeFileSync(join(dir, "LISTING.md"), fill(readFileSync(edFile(ed, "LISTING.md"), "utf8")));
    }
    writeSite(ed);
    const kb = Math.round(readFileSync(join(dir, `${fileBase(ed)}-Planner.html`)).length / 1024);
    console.log(`Built ${ed.appName} (${kb} KB) → ${ed.folder}/ and site/${ed.hostedDir}/`);
  }
  for (const f of ["README.md", "SELLER-GUIDE.md"]) {
    if (existsSync(join(root, "package", f))) copyFileSync(join(root, "package", f), join(out, f));
  }
  if (process.argv.includes("--zip")) {
    const zip = join(out, "..", "TIDDYPLANNER.zip");
    rmSync(zip, { force: true });
    execFileSync("zip", ["-rq", zip, "TIDDYPLANNER", "-x", "*.DS_Store"], { cwd: join(out, "..") });
    console.log("Zipped →", zip);
  }
}
