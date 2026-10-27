// Renders the sales kit for every edition: app icons and the buyer PDF, plus app
// screenshots and 2000x2000 listing images for editions with "listingImages": true.
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/kit.mjs && node budget-planner/scripts/build.mjs
// (the second build copies the freshly rendered icons). Needs Playwright.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fileBase, downloadSlug } from "./build.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const etsy = join(root, "etsy");
const work = join(etsy, "build");
mkdirSync(join(work, "shots"), { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

const APPLE_PAY_PAGE = (ed) => `<section class="page">
  <div class="eyebrow">${ed.appName}</div>
  <h1 style="margin-top:10pt;font-size:30pt">Apple Pay <em>quick entry</em></h1>
  <p class="muted" style="margin-top:8pt;max-width:5.6in">Pay with your iPhone, then open your planner and tap <b>Apple Pay</b> — the amount and shop name are filled in for you. Set it up once, in about 3 minutes. Needs an iPhone with iOS 17 or later and a card in Apple Wallet; availability depends on your country and card.</p>
  <div class="card">
    <h2>1 · Create the automation</h2>
    <ol class="steps small">
      <li>Open the <b>Shortcuts</b> app → <b>Automation</b> → <b>+</b> → <b>Transaction</b>.</li>
      <li>Pick your Wallet cards, choose <b>Run Immediately</b>, then <b>Next</b> → <b>New Blank Automation</b>.</li>
      <li>Add a <b>Text</b> action and type <b>SPEND|</b>, then the <b>Amount</b> variable, <b>|</b>, the <b>Merchant</b> variable, <b>|</b> and <b>Current Date</b>.</li>
      <li>Add <b>Append to Text File</b>: file <b>Shortcuts/planner-spends.txt</b>, with <b>Make New Line</b> on.</li>
      <li>Add <b>Get File</b> (the same file), then <b>Copy to Clipboard</b>, then <b>Show Notification</b> “Open your planner to collect”.</li>
    </ol>
  </div>
  <div class="card">
    <h2>2 · Collect your spends</h2>
    <p class="small muted">Open your planner from your Home Screen and tap <b>Apple Pay</b> under your daily number. Your iPhone asks to paste: tap <b>Allow Paste</b>. New payments appear ticked — tap <b>Add selected</b>. Payments you already added are skipped automatically.</p>
    <p class="small muted" style="margin-top:6pt">Tip: once a month you can empty <b>planner-spends.txt</b> in the Files app. Your planner remembers what it already added.</p>
  </div>
  <div class="card">
    <h2>Good to know</h2>
    <p class="small muted">Nothing is recorded without your tap, and nothing is sent anywhere: the Shortcut and your planner talk through your iPhone's clipboard. On a computer or Android, any shortcut tool can open your planner link ending in <b>#add?amount=4.50&amp;name=Cafe</b> to pre-fill a spend.</p>
  </div>
  <div class="foot"><span>${ed.appName} · Start here</span><span>Page 3 of 3</span></div>
</section>`;
const CLASSIC_FEATURES = "<b>Today</b> — one daily number you can spend. <b>Paycheck plan</b> — which bills each paycheck covers. <b>Impulse Pause</b> — wait 24h–7 days before buying. <b>Focus mode</b> — hides everything but the essentials. <b>Privacy blur</b> — hides amounts. <b>Readable font &amp; large text</b> in Settings. <b>Streaks, badges &amp; confetti</b> for small wins. <b>Search</b> — press K. <b>Send to my other device</b> in Settings.";
const BALANCE_FEATURES = "<b>Available until payday</b> — one calm number and a daily guide. <b>Until payday</b> — your balance day by day. <b>Can I afford it?</b> before you buy. <b>Fresh start</b> after a missed week. <b>Honey Nook</b> — Mochi &amp; Bun, honey drops and a preview studio. <b>Evening recap</b> &amp; gentle <b>challenges</b>. <b>Envelopes</b>, <b>Accounts</b>, <b>Money back</b> and <b>Fees check</b>. <b>Just today</b> mode, <b>search</b> (press K), heads-up reminders and bills in your phone's calendar. Irregular income? Settings → <b>How you get paid</b>.";
const fillFor = (ed) => (html) => {
  const b = ed.brand;
  return html
    .replaceAll("{{EXTRA_PAGES}}", ed.skin?.balance ? APPLE_PAY_PAGE(ed) : "")
    .replaceAll("{{PAGES}}", ed.skin?.balance ? "3" : "2")
    .replaceAll("{{SETUP_LINE}}", ed.skin?.balance ? "Add your name, currency, today’s balance and your paycheck." : "Add your name, currency and paycheck.")
    .replaceAll("{{FILE}}", `${fileBase(ed)}-Planner.html`)
    .replaceAll("{{OFFLINE_URL}}", `${config.publicUrl}/${ed.hostedDir}/download/${downloadSlug(ed)}`)
    .replaceAll("{{FEATURES}}", ed.skin?.balance ? BALANCE_FEATURES : CLASSIC_FEATURES)
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
    await page.evaluate(() => { location.hash = "settings"; });
    await page.waitForTimeout(150);
    const pals = (await page.$$eval("[data-action=palette]", (b) => b.map((x) => x.dataset.id))).slice(1, 5);
    for (const pal of pals) {
      await page.evaluate(() => { location.hash = "settings"; });
      await page.waitForTimeout(150);
      await page.click(`[data-action=palette][data-id=${pal}]`);
      await shot(page, "home", `home-${pal}`);
    }
    await page.evaluate(() => { location.hash = "settings"; });
    await page.waitForTimeout(150);
    await page.click("[data-action=palette] >> nth=0");
    if (ed.skin?.balance) {
      for (const v of ["envelopes", "moneyback", "fees", "quickentry"]) await shot(page, v, v);
      await shot(page, "home", "home-bd", { prep: async (p) => { await p.click("[data-action=toggle-breakdown]"); await p.waitForTimeout(150); } });
      await page.click("[data-action=toggle-breakdown]");
      const modal = (open, fill) => async (p) => { await p.click(open); await p.waitForSelector(".modal"); if (fill) await fill(p); await p.waitForTimeout(250); };
      await shot(page, "home", "afford", { prep: modal("[data-action=afford] >> nth=0", (p) => p.fill(".modal [name=amount]", "89")) });
      await page.keyboard.press("Escape");
      await shot(page, "home", "fresh", { prep: modal(".fresh-line [data-action=fresh-start]") });
      await page.keyboard.press("Escape");
      await shot(page, "home", "add", { prep: modal(".hero-actions [data-action=quick-add]", async (p) => { await p.fill(".modal [name=amount]", "4.50"); await p.click(".modal [data-cat] >> nth=0").catch(() => {}); }) });
      await page.keyboard.press("Escape");
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
    if (ed.skin?.balance) {
      await shot(page, "quickentry", "m-quick");
      await shot(page, "home", "m-afford", { prep: async (p) => { await p.click("[data-action=afford] >> nth=0"); await p.waitForSelector(".modal"); await p.fill(".modal [name=amount]", "24"); await p.waitForTimeout(250); } });
      await page.keyboard.press("Escape");
    }
    await ctx.close();
  }
  const dir = join(out, ed.folder, "images");
  rmSync(dir, { recursive: true, force: true }); // only the current image set ships
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 2000, height: 2000 } });
  // Each edition can bring its own art direction (etsy/<templates>/ with its own _base.css).
  const tdir = join(etsy, ed.templates || "templates");
  copyFileSync(join(tdir, "_base.css"), join(work, "_base.css"));
  for (const t of readdirSync(tdir).filter((f) => /^\d\d-.*\.html$/.test(f)).sort()) {
    const tmp = join(work, t);
    writeFileSync(tmp, fillFor(ed)(readFileSync(join(tdir, t), "utf8")));
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(dir, `${fileBase(ed)}${ed.templates ? "" : "-NEW"}-${t.replace(".html", ".jpg")}`), type: "jpeg", quality: 90 });
  }
  await page.close();
  console.log(`  listing images → ${ed.folder}/images/`);
}

for (const ed of config.editions.filter((e) => !process.argv[2] || e.id === process.argv[2])) {
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
  // Nothing may run into the page footer.
  const over = await page.evaluate(() => [...document.querySelectorAll(".page")].map((p, i) => { const foot = p.querySelector(".foot").getBoundingClientRect().top; const low = Math.max(...[...p.children].filter((c) => !c.classList.contains("foot")).map((c) => c.getBoundingClientRect().bottom)); return low > foot - 4 ? `page ${i + 1} overflows by ${Math.round(low - foot + 4)}px` : ""; }).filter(Boolean));
  if (over.length) console.log(`  ⚠ buyer guide layout: ${over.join(", ")}`);
  await page.pdf({ path: join(out, ed.folder, `${fileBase(ed)}-Buyer-Guide.pdf`), format: "Letter", printBackground: true });
  await page.close();
  console.log(`  buyer guide → ${ed.folder}/${fileBase(ed)}-Buyer-Guide.pdf`);
  if (ed.listingImages) await listingImages(ed);
}
await browser.close();
