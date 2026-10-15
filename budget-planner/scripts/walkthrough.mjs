// Records a real ~15 s walkthrough of each edition (screen recording with a visible cursor).
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/walkthrough.mjs [edition-id]
// Needs Playwright and ffmpeg (libx264). Output: <folder>/video/<Name>-Walkthrough.mp4 (1280x800, silent).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, rmSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { fileBase } from "./build.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const W = 1280, H = 800, TARGET = 14.5;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

// A soft cursor + click ripple, since headless recordings have no pointer.
const CURSOR = `(() => {
  const s = document.createElement("style");
  s.textContent = "#__cur{position:fixed;left:0;top:0;width:26px;height:26px;margin:-4px 0 0 -4px;z-index:2147483647;pointer-events:none;transition:transform .08s}#__cur svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}#__cur.down{transform:scale(.85)}.__rip{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(0,0,0,.15);z-index:2147483646;pointer-events:none;animation:__r .5s ease-out forwards}@keyframes __r{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}";
  document.head.appendChild(s);
  const c = document.createElement("div");
  c.id = "__cur";
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5L9 20z" fill="#fff" stroke="#1b1015" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
  addEventListener("mousedown", (e) => { c.classList.add("down"); const r = document.createElement("div"); r.className = "__rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  addEventListener("mouseup", () => c.classList.remove("down"), true);
  // A 1px pixel that changes every frame keeps the recorder writing frames, so video time matches real time.
  const tick = document.createElement("i");
  tick.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;z-index:2147483647;pointer-events:none";
  document.body.appendChild(tick);
  let n = 0;
  (function f() { tick.style.background = n++ % 2 ? "rgba(0,0,0,.02)" : "rgba(0,0,0,.03)"; requestAnimationFrame(f); })();
})()`;

async function record(ed) {
  const dir = join(out, ed.folder, "video");
  const tmp = join(root, "etsy", "build", "rec", ed.id);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  page.on("pageerror", (e) => console.log("page error:", e.message));
  const t0 = Date.now();
  await page.goto(pathToFileURL(join(out, ed.folder, `${fileBase(ed)}-Planner.html`)).href);
  await page.waitForSelector("[data-ob=sample]");
  await page.click("[data-ob=sample]");
  await page.evaluate(() => { location.hash = "today"; });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(CURSOR);
  await page.mouse.move(W / 2, H / 2);
  await page.evaluate(() => document.querySelector(".toasts")?.remove());
  await page.waitForTimeout(400);
  const start = (Date.now() - t0) / 1000; // trim everything before this

  const center = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const moveTo = async (sel, steps = 18) => { const [x, y] = await center(sel); await page.mouse.move(x, y, { steps }); return [x, y]; };
  // Glide the visible cursor there, then let Playwright perform a real, actionable click.
  const click = async (sel, steps) => { await moveTo(sel, steps); await page.waitForTimeout(110); await page.locator(sel).first().click(); await page.waitForTimeout(240); };
  // The sidebar scrolls on short screens: bring the link into view first, like a person would.
  const nav = async (id) => {
    const sel = `#sidebar a[href='#${id}']`;
    await page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    await page.waitForTimeout(260);
    await click(sel, 14);
  };

  await page.waitForTimeout(700);                                  // Today
  await click("#sidebar .track-btn, .today-hero [data-action=quick-add]"); // Track a spend
  await page.waitForTimeout(250);
  await page.keyboard.type("24.00", { delay: 90 });
  await click(".modal [data-cat]:has-text('Dining')", 14);
  await click(".modal input[name=name]", 10);
  await page.keyboard.type("Sushi night", { delay: 55 });
  await click(".modal button.primary", 14);
  await page.waitForTimeout(800);
  // Keep the screen clean: no lingering toasts in a promo video.
  await page.evaluate(() => { const st = document.createElement("style"); st.textContent = ".toasts{display:none!important}"; document.head.appendChild(st); });
  await nav("home");                                               // Home + chart tooltip
  await page.locator(".chart").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await moveTo(".chart g[data-tip] >> nth=2", 16);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(350);
  await nav("calendar");                                           // Calendar
  await click(".cal .day >> nth=19", 16);
  await page.waitForTimeout(500);
  await nav("savings");                                            // Savings
  await page.waitForTimeout(700);
  await nav("debt");                                               // Debt slider
  const slider = page.locator("input[data-input=debt-extra]");
  const b = await slider.boundingBox();
  await page.mouse.move(b.x + b.width * 0.07, b.y + b.height / 2, { steps: 14 });
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.42, b.y + b.height / 2, { steps: 22 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  await nav("settings");                                           // Colours + night mode
  await click("[data-action=palette] >> nth=3", 14);
  await page.waitForTimeout(350);
  await click("[data-action=palette] >> nth=4", 10);
  await page.waitForTimeout(350);
  await click("[data-action=set][data-key=theme][data-v=dark]", 14);
  await page.waitForTimeout(400);
  await nav("home");
  await page.waitForTimeout(2000);
  const end = (Date.now() - t0) / 1000;
  await page.waitForTimeout(300);
  const closedAt = (Date.now() - t0) / 1000;
  await ctx.close();

  const webm = join(tmp, readdirSync(tmp).find((f) => f.endsWith(".webm")));
  // The recorder starts before our clock does; line the two up using the file's length.
  const webmDur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", webm]).toString().trim());
  const offset = Number.isFinite(webmDur) ? Math.max(0, webmDur - closedAt) : 0;
  const length = end - start;
  const speed = Math.max(1, length / TARGET); // keep it within Etsy's 15 s limit
  const mp4 = join(dir, `${fileBase(ed)}-Walkthrough.mp4`);
  // Chromium only records frames when something changes, so the still final screen is padded by repeating its last frame.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", (start + offset).toFixed(2), "-i", webm,
    "-vf", `tpad=stop_mode=clone:stop_duration=4,setpts=PTS/${speed.toFixed(3)},fps=30`, "-t", Math.min(TARGET, length / speed).toFixed(2), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim();
  console.log(`${ed.appName}: ${mp4.split("/").slice(-3).join("/")} — ${Number(dur).toFixed(1)} s (recorded ${length.toFixed(1)} s, ×${speed.toFixed(2)}, sync ${offset.toFixed(2)} s)`);
}

for (const ed of config.editions.filter((e) => !process.argv[2] || e.id === process.argv[2])) await record(ed);
await browser.close();
