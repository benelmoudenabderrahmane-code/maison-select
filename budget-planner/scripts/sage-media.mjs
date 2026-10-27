// Sage & Honey listing media: fresh app captures → 10 luxury listing images (2000×2000)
// and two 15-second videos (1080×1080). Everything is drawn from the real built app.
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/sage-media.mjs [shots|images|videos]
// Needs Playwright and ffmpeg (libx264).
import { createRequire } from "node:module";
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const ed = config.editions.find((e) => e.id === "sage");
const app = pathToFileURL(join(out, ed.folder, "Sage-and-Honey-Planner.html")).href;
const lux = join(root, "etsy", "sage-lux");
const work = join(root, "etsy", "build", "sage-lux");
const shots = join(work, "shots");
const only = process.argv[2];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

/* ---------- 1. Captures of the real app ---------- */
async function open(viewport, scale, { time = "2026-10-26T18:10:00", dark = false } = {}) {
  const mobile = viewport.width < 500;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(time) });
  await page.goto(app);
  await page.waitForSelector("[data-ob=sample]");
  await page.click("[data-ob=sample]");
  await page.waitForTimeout(400);
  if (dark) { await page.keyboard.press("d"); await page.waitForTimeout(200); }
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}
const clean = (page) => page.evaluate(() => { document.querySelector(".toasts")?.remove(); window.scrollTo(0, 0); });
async function view(page, v) { await page.evaluate((h) => (location.hash = h), v); await page.waitForTimeout(300); await clean(page); }
const snap = (page, name) => page.screenshot({ path: join(shots, `${name}.png`) });
const el = (page, sel, name) => page.locator(sel).first().screenshot({ path: join(shots, `${name}.png`) });

async function captures() {
  rmSync(shots, { recursive: true, force: true });
  mkdirSync(shots, { recursive: true });
  // Companions as transparent PNGs for the artwork.
  const nook = join(root, "editions", "sage", "nook");
  const pic = await browser.newPage();
  for (const f of readdirSync(nook).filter((x) => /^(mochi|bun)-/.test(x))) {
    await pic.setContent(`<style>html,body{margin:0;background:transparent}</style><img id=i src="data:image/webp;base64,${readFileSync(join(nook, f)).toString("base64")}">`);
    await pic.locator("#i").screenshot({ path: join(shots, f.replace(".webp", ".png")), omitBackground: true });
  }
  for (const f of ["room-day", "room-winter"]) copyFileSync(join(nook, `${f}.webp`), join(shots, `${f}.webp`));
  for (const f of readdirSync(join(lux, "art"))) copyFileSync(join(lux, "art", f), join(shots, f)); // HD character art
  await pic.close();

  { // Desktop
    const { ctx, page } = await open({ width: 1440, height: 900 }, 2);
    await view(page, "home");
    await snap(page, "d-home");
    await el(page, ".nook", "d-nook-hero");
    await page.evaluate(() => document.querySelector(".fc-card").scrollIntoView({ block: "center" }));
    await page.waitForTimeout(150);
    await el(page, ".fc-card", "d-forecast");
    await el(page, ".recap", "d-recap");
    await el(page, ".ch-card", "d-challenge");
    await el(page, ".heads-up", "d-headsup");
    await clean(page);
    await page.click(".hero-quick [data-action=toggle-breakdown]"); await page.waitForTimeout(200);
    await el(page, ".hero-quick", "d-breakdown");
    await page.click(".hero-quick [data-action=toggle-breakdown]").catch(() => {});
    for (const v of ["accounts", "challenges", "envelopes", "bills", "budget", "calendar"]) { await view(page, v); await snap(page, `d-${v}`); }
    await view(page, "nook");
    await page.click("[data-action=nook-preview][data-k=pet][data-v=bun]"); await page.click("[data-action=nook-preview][data-k=pose][data-v=cheer]"); await page.waitForTimeout(200);
    await clean(page); await snap(page, "d-nook-studio");
    await page.click("[data-action=nook-preview-reset]"); await page.waitForTimeout(150);
    await view(page, "home");
    await page.click("[data-action=afford] >> nth=0"); await page.waitForSelector(".modal"); await page.fill(".modal [name=amount]", "89"); await page.waitForTimeout(250);
    await snap(page, "d-afford"); await page.keyboard.press("Escape");
    await page.keyboard.press("k"); await page.waitForSelector(".modal [name=q]"); await page.keyboard.type("coffee"); await page.waitForTimeout(200);
    await snap(page, "d-search"); await page.keyboard.press("Escape");
    await ctx.close();
  }
  { // Desktop at night, dark mode (Mochi sleeps)
    const { ctx, page } = await open({ width: 1440, height: 900 }, 2, { time: "2026-10-26T22:15:00", dark: true });
    await view(page, "home"); await snap(page, "d-home-night"); await el(page, ".nook", "d-nook-night");
    await ctx.close();
  }
  { // Tablet
    const { ctx, page } = await open({ width: 820, height: 1180 }, 2);
    await view(page, "home"); await snap(page, "t-home");
    await ctx.close();
  }
  { // Phone
    const { ctx, page } = await open({ width: 390, height: 844 }, 3);
    await view(page, "home"); await snap(page, "m-home");
    await page.evaluate(() => document.querySelector(".fc-card").scrollIntoView({ block: "center" })); await page.waitForTimeout(150); await snap(page, "m-forecast");
    await page.evaluate(() => document.querySelector(".recap").scrollIntoView({ block: "center" })); await page.waitForTimeout(150); await snap(page, "m-recap");
    await clean(page);
    await page.evaluate((t) => navigator.clipboard?.writeText?.(t).catch(() => {}), "");
    await view(page, "quickentry"); await snap(page, "m-quick");
    await view(page, "home");
    await page.evaluate(() => { const d = new Date(); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; window.__collect = `SPEND|$4.50|Blue Bottle Coffee|${iso} 08:12\nSPEND|$12.30|Trader Joe's|${iso} 12:40\nSPEND|$6.75|Corner Bakery|${iso} 16:05`; });
    await page.evaluate(() => { navigator.clipboard.readText = async () => window.__collect; });
    await page.click("[data-action=collect-applepay] >> nth=0"); await page.waitForSelector(".modal .collect-li"); await page.waitForTimeout(250);
    await snap(page, "m-collect"); await page.keyboard.press("Escape");
    await view(page, "challenges"); await snap(page, "m-challenges");
    await view(page, "accounts"); await snap(page, "m-accounts");
    await view(page, "home");
    await page.click(".hero-quick [data-action=just-today]"); await page.waitForTimeout(300); await clean(page);
    await snap(page, "m-justtoday");
    await page.click("[data-action=just-today] >> nth=0"); await page.waitForTimeout(200);
    await view(page, "nook"); await snap(page, "m-nook");
    await ctx.close();
  }
  { // Phone at night
    const { ctx, page } = await open({ width: 390, height: 844 }, 3, { time: "2026-10-26T22:15:00", dark: true });
    await view(page, "home"); await snap(page, "m-home-night");
    await ctx.close();
  }
  console.log(`captures → ${readdirSync(shots).length} files`);
}

/* ---------- 2. Listing images ---------- */
async function images() {
  const dir = join(out, ed.folder, "images");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(lux, "_lux.css"), join(work, "_lux.css"));
  const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
  for (const t of readdirSync(lux).filter((f) => /^\d\d-.*\.html$/.test(f)).sort()) {
    copyFileSync(join(lux, t), join(work, t));
    await page.goto(pathToFileURL(join(work, t)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(dir, `Sage-and-Honey-${t.replace(".html", ".jpg")}`), type: "jpeg", quality: 92 });
  }
  await page.close();
  console.log(`listing images → ${ed.folder}/images/`);
}

/* ---------- 3. Videos (rendered frame by frame) ---------- */
async function videos() {
  const FPS = 30, SIZE = 1080;
  const dest = join(out, ed.folder, "video");
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(dest)) rmSync(join(dest, f));
  copyFileSync(join(lux, "_film.js"), join(work, "_film.js"));
  for (const [scene, file] of [["film-1-meet-mochi.html", "Sage-and-Honey-Video-1-Meet-Mochi"], ["film-2-inside-the-app.html", "Sage-and-Honey-Video-2-Inside-the-App"]]) {
    copyFileSync(join(lux, scene), join(work, scene));
    const frames = join(work, "frames", file);
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });
    const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
    await page.goto(pathToFileURL(join(work, scene)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    const duration = await page.evaluate(() => window.DURATION);
    const total = Math.round(duration * FPS);
    for (let i = 0; i < total; i++) {
      await page.evaluate((t) => window.render(t), i / FPS);
      await page.screenshot({ path: join(frames, `${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 93 });
    }
    await page.close();
    const mp4 = join(dest, `${file}.mp4`);
    // Etsy takes 5–15 s videos: stop a hair before 15 s.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "%04d.jpg"), "-t", "14.8", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "2.2", "-i", mp4, "-frames:v", "1", "-q:v", "2", join(dest, `${file}-poster.jpg`)]);
    console.log(`${file}.mp4 — ${duration}s`);
  }
}

if (!only || only === "shots") await captures();
if (!only || only === "images") await images();
if (!only || only === "videos") await videos();
await browser.close();
