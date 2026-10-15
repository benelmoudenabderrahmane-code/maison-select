// Renders the sales kit for every edition: app icons and the buyer PDF, plus app
// screenshots and 2000x2000 listing images for editions with "listingImages": true.
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/kit.mjs && node budget-planner/scripts/build.mjs
// (the second build copies the freshly rendered icons). Needs Playwright.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fileBase } from "./build.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const etsy = join(root, "etsy");
const work = join(etsy, "build");
mkdirSync(join(work, "shots"), { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

const fillFor = (ed) => (html) => {
  const b = ed.brand;
  return html
    .replaceAll("{{FILE}}", `${fileBase(ed)}-Planner.html`)
    .replaceAll("{{APP}}", ed.appName)
    .replaceAll("{{URL}}", `${config.publicUrl}/${ed.hostedDir}/`)
    .replaceAll("{{DEMO_URL}}", `${config.publicUrl}/${ed.hostedDir}/demo/`)
    .replaceAll("{{SHOP}}", config.shopUrl)
    .replaceAll("{{FONTS}}", `family=${b.head.replace(/ /g, "+")}:ital,wght@0,400..800;1,400..700&family=Inter:wght@400..700`)
    .replaceAll("{{ACCENT}}", b.accent).replaceAll("{{INK}}", b.ink).replaceAll("{{MUTED}}", b.muted).replaceAll("{{SOFT}}", b.soft)
    .replaceAll("{{BG1}}", b.bg1).replaceAll("{{BG2}}", b.bg2).replaceAll("{{HEADCOLOR}}", b.headColor).replaceAll("{{HEAD}}", b.head);
};

/* ---------- Screenshots + listing images (editions that want them) ---------- */
async function openWithSample(ed, viewport, scale) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(out, ed.folder, `${fileBase(ed)}-Planner.html`)).href);
  await page.waitForSelector("[data-ob=sample]");
  await page.click("[data-ob=sample]");
  await page.waitForTimeout(400);
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}
async function shot(page, view, name, { dark = false, prep } = {}) {
  await page.evaluate(([v, d]) => {
    location.hash = v;
    const want = d ? "dark" : "light";
    if (document.documentElement.dataset.theme !== want) document.querySelector("[data-action=toggle-theme]")?.click();
  }, [view, dark]);
  await page.waitForTimeout(250);
  if (prep) await prep(page);
  await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector(".toasts")?.remove(); });
  await page.mouse.move(1, 1);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(work, "shots", `${name}.png`) });
}
async function listingImages(ed) {
  {
    const { ctx, page } = await openWithSample(ed, { width: 1440, height: 900 }, 2);
    for (const v of ["home", "today", "calendar", "paycheck", "budget", "debt", "savings", "impulse", "rewards", "transactions", "bills", "year"]) await shot(page, v, v);
    await shot(page, "home", "home-dark", { dark: true });
    await shot(page, "today", "today-dark", { dark: true });
    await shot(page, "debt", "debt-dark", { dark: true });
    // A few colour themes, for the "themes" listing image.
    for (const pal of ["sage", "lavender", "ocean", "honey"]) {
      await page.evaluate(() => { location.hash = "settings"; });
      await page.waitForTimeout(150);
      await page.click(`[data-action=palette][data-id=${pal}]`);
      await shot(page, "home", `home-${pal}`);
    }
    await page.evaluate(() => { location.hash = "settings"; });
    await page.waitForTimeout(150);
    await page.click("[data-action=palette] >> nth=0");
    await ctx.close();
  }
  {
    const { ctx, page } = await openWithSample(ed, { width: 390, height: 844 }, 3);
    await shot(page, "today", "m-today");
    await shot(page, "home", "m-home");
    await shot(page, "impulse", "m-impulse");
    await shot(page, "paycheck", "m-paycheck");
    await shot(page, "rewards", "m-rewards");
    await ctx.close();
  }
  const dir = join(out, ed.folder, "images");
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
  copyFileSync(join(etsy, "templates", "_base.css"), join(work, "_base.css"));
  for (const t of readdirSync(join(etsy, "templates")).filter((f) => /^\d\d-.*\.html$/.test(f)).sort()) {
    const tmp = join(work, t);
    writeFileSync(tmp, fillFor(ed)(readFileSync(join(etsy, "templates", t), "utf8")));
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(dir, t.replace(".html", ".jpg")), type: "jpeg", quality: 90 });
  }
  await page.close();
  console.log(`  listing images → ${ed.folder}/images/`);
}

for (const ed of config.editions) {
  console.log(ed.appName);
  /* Icons */
  const icon = await browser.newPage();
  const svg = readFileSync(join(root, "editions", ed.id, "icon.svg"), "utf8");
  for (const size of [180, 192, 512]) {
    await icon.setViewportSize({ width: size, height: size });
    await icon.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
    await icon.screenshot({ path: join(root, "editions", ed.id, `icon-${size}.png`), omitBackground: true });
  }
  await icon.close();
  /* Buyer guide PDF */
  const page = await browser.newPage();
  const tmp = join(work, `buyer-guide-${ed.id}.html`);
  writeFileSync(tmp, fillFor(ed)(readFileSync(join(etsy, "templates", "buyer-guide.html"), "utf8")));
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.pdf({ path: join(out, ed.folder, `${fileBase(ed)}-Buyer-Guide.pdf`), format: "Letter", printBackground: true });
  await page.close();
  console.log(`  buyer guide → ${ed.folder}/${fileBase(ed)}-Buyer-Guide.pdf`);
  if (ed.listingImages) await listingImages(ed);
}
await browser.close();
