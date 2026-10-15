// Renders the Etsy kit: app screenshots, listing images (2000x2000), icons and the buyer PDF.
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/etsy.mjs
// Needs Playwright (npm i -D playwright, or a global install found via NODE_PATH).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const fileBase = config.appName.replace(/\s+/g, "-");
const appFile = pathToFileURL(join(root, "dist", `${fileBase}-Planner.html`)).href;
const etsy = join(root, "etsy");
const shots = join(etsy, "build", "shots");
const images = join(etsy, "images");
for (const d of [shots, images]) mkdirSync(d, { recursive: true });

const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launchOpts);

/* ---------- 1. App screenshots ---------- */
async function openWithSample(viewport, scale) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  const page = await ctx.newPage();
  await page.goto(appFile);
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
  await page.screenshot({ path: join(shots, `${name}.png`) });
}
{
  const { ctx, page } = await openWithSample({ width: 1440, height: 900 }, 2);
  for (const v of ["home", "today", "calendar", "paycheck", "budget", "debt", "savings", "impulse", "rewards", "transactions", "bills", "year"]) await shot(page, v, v);
  await shot(page, "home", "home-dark", { dark: true });
  await shot(page, "today", "today-dark", { dark: true });
  await shot(page, "debt", "debt-dark", { dark: true });
  await shot(page, "today", "quickadd", { prep: async (p) => { await p.keyboard.press("n"); await p.fill(".modal input[name=amount]", "6.50"); await p.click(".modal [data-cat]:has-text('Coffee')"); await p.fill(".modal input[name=name]", "Iced latte"); } });
  await page.keyboard.press("Escape");
  // Palette variants for the themes image.
  for (const pal of ["sage", "lavender", "ocean", "honey"]) {
    await page.evaluate((id) => { location.hash = "settings"; }, pal);
    await page.waitForTimeout(150);
    await page.click(`[data-action=palette][data-id=${pal}]`);
    await shot(page, "home", `home-${pal}`);
  }
  await page.click("[data-action=palette][data-id=rose]").catch(() => {});
  await ctx.close();
}
{
  const { ctx, page } = await openWithSample({ width: 390, height: 844 }, 3);
  await shot(page, "today", "m-today");
  await shot(page, "home", "m-home");
  await shot(page, "impulse", "m-impulse");
  await shot(page, "today", "m-today-dark", { dark: true });
  await ctx.close();
}
console.log("Screenshots done");

/* ---------- 2. Icons ---------- */
{
  const page = await browser.newPage();
  const svg = readFileSync(join(root, "assets", "icon.svg"), "utf8");
  for (const size of [180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
    await page.screenshot({ path: join(root, "assets", `icon-${size}.png`), omitBackground: true });
  }
  await page.close();
}

/* ---------- 3. Listing images ---------- */
const templates = readdirSync(join(etsy, "templates")).filter((f) => /^\d\d-.*\.html$/.test(f)).sort();
const fill = (html) =>
  html.replaceAll("{{FILE}}", `${fileBase}-Planner.html`).replaceAll("{{APP}}", config.appName).replaceAll("{{URL}}", `${config.publicUrl}/${config.hostedDir}/`).replaceAll("{{DEMO_URL}}", `${config.publicUrl}/${config.hostedDir}/demo/`).replaceAll("{{SHOP}}", config.shopUrl);
{
  const page = await browser.newPage({ viewport: { width: 2000, height: 2000 }, deviceScaleFactor: 1 });
  for (const t of templates) {
    const html = fill(readFileSync(join(etsy, "templates", t), "utf8"));
    const tmp = join(etsy, "build", t);
    writeFileSync(tmp, html);
    copyFileSync(join(etsy, "templates", "_base.css"), join(etsy, "build", "_base.css"));
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(images, t.replace(".html", ".jpg")), type: "jpeg", quality: 90 });
    console.log("Image", t);
  }
  await page.close();
}

/* ---------- 4. Buyer guide PDF ---------- */
{
  const page = await browser.newPage();
  const tmp = join(etsy, "build", "buyer-guide.html");
  writeFileSync(tmp, fill(readFileSync(join(etsy, "templates", "buyer-guide.html"), "utf8")));
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.pdf({ path: join(etsy, `${fileBase}-Buyer-Guide.pdf`), format: "Letter", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
  console.log("Buyer guide PDF done");
}
await browser.close();
