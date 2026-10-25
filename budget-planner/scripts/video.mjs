// Renders the promo videos frame by frame (deterministic, no dropped frames) and encodes MP4s.
//   node budget-planner/scripts/video.mjs        (run kit.mjs first: it makes the app screenshots)
// Needs Playwright and ffmpeg with libx264.
import { createRequire } from "node:module";
import { mkdirSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const FPS = 30, SIZE = 1080;
const VIDEOS = [
  { scene: "reveal.html", file: "Lumi-Budget-Video-1-Reveal" },
  { scene: "tour.html", file: "Lumi-Budget-Video-2-Tour" },
  { scene: "sage-promo.html", file: "Sage-and-Honey-Video-Promo", folder: "4-Sage-Honey" },
];
const only = process.argv[2];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const v of VIDEOS.filter((x) => !only || x.scene.startsWith(only))) {
  const dest = join(out, v.folder || "1-Lumi-Budget", "video");
  mkdirSync(dest, { recursive: true });
  const frames = join(root, "etsy", "build", "frames", v.file);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(root, "etsy", "video", v.scene)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const duration = await page.evaluate(() => window.DURATION);
  const total = Math.round(duration * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    await page.screenshot({ path: join(frames, `${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 94 });
  }
  await page.close();
  const mp4 = join(dest, `${v.file}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "%04d.jpg"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  // A still for the listing / social thumbnail.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(Math.min(duration - 0.5, 8)), "-i", mp4, "-frames:v", "1", "-q:v", "2", join(dest, `${v.file}-poster.jpg`)]);
  console.log(`${v.file}.mp4 — ${duration}s, ${total} frames`);
}
await browser.close();
