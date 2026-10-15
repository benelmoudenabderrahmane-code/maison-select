// End-to-end audit of every edition: engine maths, every screen (desktop + mobile),
// and the main user flows. Run after a build:
//   node budget-planner/scripts/build.mjs && node budget-planner/scripts/test.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fileBase } from "./build.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
const out = resolve(root, config.outDir || "../TIDDYPLANNER");
const tmp = mkdtempSync(join(tmpdir(), "planner-test-"));
const VIEWS = ["setup", "home", "today", "calendar", "paycheck", "transactions", "budget", "bills", "savings", "debt", "goals", "impulse", "rewards", "year", "settings"];

let failures = 0, passes = 0;
const check = (name, ok, detail = "") => {
  if (ok) passes++; else { failures++; console.log(`    ✗ ${name}${detail ? " — " + detail : ""}`); }
};
let current = null; // page used for failure screenshots
async function step(name, fn) {
  try { await fn(); } catch (e) {
    failures++;
    console.log(`    ✗ ${name} — ${e.message.split("\n")[0]}`);
    if (current) await current.screenshot({ path: join(tmp, `fail-${name.replace(/\W+/g, "-")}.png`) }).catch(() => {});
  }
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function newPage(viewport = { width: 1440, height: 950 }) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) page.errors.push(m.text()); });
  return { ctx, page };
}
const go = async (page, v) => {
  await page.evaluate((v) => { if (location.hash === "#" + v) window.__planner.render(); else location.hash = v; }, v);
  await page.waitForTimeout(150);
  await page.keyboard.press("Escape"); // close any leftover window
};
/** Open a form with `opener`, fill it, submit, and wait for the window to close. */
async function form(page, opener, fields, submit = ".modal button.primary") {
  await page.click(opener);
  await page.waitForSelector(".modal");
  await page.waitForTimeout(60);
  for (const [name, value] of Object.entries(fields)) await page.fill(`.modal [name=${name}]`, value);
  await page.click(submit);
  await page.waitForSelector(".overlay", { state: "detached" });
}
const state = (page, fn) => page.evaluate(`(${fn})(window.__planner.state)`);

for (const ed of config.editions.filter((e) => !process.argv[2] || e.id === process.argv[2])) {
  console.log(`\n${ed.appName}`);
  const full = pathToFileURL(join(out, ed.folder, `${fileBase(ed)}-Planner.html`)).href;
  const demo = pathToFileURL(join(out, ed.folder, `${fileBase(ed)}-Demo.html`)).href;
  const { ctx, page } = await newPage();
  current = page;
  await page.goto(full);
  await page.waitForTimeout(300);

  await step("engine", async () => {
    const r = await page.evaluate(() => {
      const P = window.__planner;
      return {
        endOfMonth: P.occurrences("monthly", "2026-01-31", "2026-02-01", "2026-04-30"),
        biweekly: P.occurrences("biweekly", "2026-01-02", "2026-03-01", "2026-03-31").length,
        semi: P.occurrences("semimonthly", "2026-01-01", "2026-02-01", "2026-02-28"),
        yearly: P.occurrences("yearly", "2025-03-10", "2026-01-01", "2027-12-31"),
        once: P.occurrences("once", "2026-05-05", "2026-01-01", "2026-12-31"),
        ended: P.occurrences("weekly", "2026-01-01", "2026-01-01", "2026-12-31", "2026-01-20").length,
      };
    });
    check("month-end clamps to Feb 28", JSON.stringify(r.endOfMonth) === JSON.stringify(["2026-02-28", "2026-03-31", "2026-04-30"]), JSON.stringify(r.endOfMonth));
    check("biweekly count", r.biweekly === 2, r.biweekly);
    check("semimonthly 15th + last day", JSON.stringify(r.semi) === JSON.stringify(["2026-02-15", "2026-02-28"]), JSON.stringify(r.semi));
    check("yearly", JSON.stringify(r.yearly) === JSON.stringify(["2026-03-10", "2027-03-10"]), JSON.stringify(r.yearly));
    check("one-time", r.once.length === 1);
    check("end date respected", r.ended === 3, r.ended);
  });

  await step("onboarding", async () => {
    check("onboarding opens on first run", !!(await page.$(".modal >> text=Welcome to")));
    await page.click(".modal button.primary");
    await page.fill(".modal input[name=name]", "Sam");
    await page.selectOption(".modal select[name=currency]", "EUR");
    await page.click(".modal button.primary");
    await page.fill(".modal input[name=amount]", "1800");
    await page.click(".modal button.primary");
    await page.click(".modal button.primary");
    await page.waitForSelector("h1:has-text('Getting started')");
    const s = await state(page, (S) => ({ name: S.profile.name, cur: S.profile.currency, inc: S.incomes.length, ok: S.onboarded }));
    check("profile saved", s.name === "Sam" && s.cur === "EUR" && s.inc === 1 && s.ok, JSON.stringify(s));
  });

  await step("track a spend + undo", async () => {
    await page.keyboard.press("n");
    await page.fill(".modal input[name=amount]", "12.50");
    await page.click(".modal [data-cat]");
    await page.fill(".modal input[name=name]", "Lunch");
    await page.click(".modal button.primary");
    check("spend added", (await state(page, (S) => S.transactions.length)) === 1);
    await page.click(".toast button");
    check("undo removes it", (await state(page, (S) => S.transactions.length)) === 0);
    await page.keyboard.press("n");
    await page.fill(".modal input[name=amount]", "12.50");
    await page.click(".modal [data-cat]");
    await page.fill(".modal input[name=name]", "Lunch");
    await page.click(".modal button.primary");
  });

  await step("bills & check-off", async () => {
    await go(page, "bills");
    await form(page, ".page-head [data-action=add-bill]", { name: "Rent", amount: "900" });
    check("bill saved", (await state(page, (S) => S.bills.length)) === 1);
    await go(page, "calendar");
    const before = await state(page, (S) => S.transactions.length);
    await page.click(".card .list .tick");
    const after = await state(page, (S) => ({ n: S.transactions.length, linked: S.transactions.filter((t) => t.link).length }));
    check("checking off creates a linked transaction", after.n === before + 1 && after.linked >= 1, JSON.stringify(after));
    await go(page, "transactions");
    const id = await state(page, (S) => S.transactions.find((t) => t.link).id);
    await page.click(`.tx-row[data-id="${id}"]`);
    check("linked entry is locked to its type", await page.isHidden(".modal .seg"));
    await page.keyboard.press("Escape");
  });

  await step("safe to spend identity", async () => {
    const m = await page.evaluate(() => window.__planner.monthSummary(new Date().toISOString().slice(0, 7)));
    const expect = m.income + m.expected - m.spent - m.saved - m.billsDue - m.fundsDue - m.buffer;
    check("safe = in − out − due − buffer", Math.abs(expect - m.safe) < 0.001, `${m.safe} vs ${expect}`);
  });

  await step("transaction filters & sort", async () => {
    await go(page, "transactions");
    await page.click("[data-action=tx-type][data-v=income]");
    const types = await page.$$eval(".tx-row", (rows) => rows.length);
    const anyIncome = await state(page, (S) => S.transactions.filter((t) => t.type === "income").length);
    check("income filter", types === anyIncome, `${types} rows vs ${anyIncome}`);
    await page.click("[data-action=tx-type][data-v=all]");
    await page.click("[data-action=tx-sort][data-k=amount]");
    check("sort control active", !!(await page.$(".tx-head button.on[data-k=amount]")));
    await page.fill("#tx-search", "lunch");
    check("search", (await page.$$(".tx-row")).length === 1);
    await page.fill("#tx-search", "");
  });

  await step("savings fund + milestone", async () => {
    await go(page, "savings");
    await form(page, ".page-head [data-action=add-fund]", { name: "Trip", target: "100" });
    await form(page, "[data-action=fund-money][data-mode=add]", { amount: "60" });
    check("milestone celebration", !!(await page.waitForSelector(".celebrate", { timeout: 2000 }).catch(() => null)));
    check("fund balance", (await state(page, (S) => S.funds[0].saved)) === 60);
  });

  await step("debt payoff", async () => {
    await go(page, "debt");
    await form(page, ".page-head [data-action=add-debt]", { name: "Card", balance: "500", apr: "20", minimum: "50" });
    const sim = await page.evaluate(() => window.__planner.simulateDebts("avalanche", 0));
    check("payoff simulation finishes", sim.ok && sim.months > 9 && sim.months < 13 && sim.interest > 0, JSON.stringify({ m: sim.months, i: sim.interest }));
    await page.locator("input[data-input=debt-extra]").fill("300");
    check("extra payment shortens plan", (await page.evaluate(() => window.__planner.simulateDebts("avalanche", 300).months)) < sim.months);
    await form(page, "[data-action=debt-pay]", { amount: "500" });
    const d = await state(page, (S) => ({ bal: S.debts[0].balance, badge: !!S.badges.debt_free }));
    check("debt paid off + badge", d.bal === 0 && d.badge, JSON.stringify(d));
  });

  await step("impulse pause", async () => {
    await go(page, "impulse");
    await page.fill("form[data-form=wish] input[name=name]", "Lamp");
    await page.fill("form[data-form=wish] input[name=price]", "45");
    await page.click("form[data-form=wish] button.primary");
    await page.click("[data-action=wish-skip]");
    check("skip adds to saved-by-pausing", (await state(page, (S) => S.skippedTotal)) === 45);
    await page.evaluate(() => { const S = window.__planner.state; S.wishlist.push({ id: "w2", name: "Mug", price: 9, addedAt: Date.now() - 1e8, readyAt: Date.now() - 1000 }); window.__planner.render(); });
    await page.click("[data-action=wish-buy]");
    await page.keyboard.press("Escape");
    check("cancelled buy stays undecided", (await state(page, (S) => S.wishlist.find((w) => w.id === "w2").decision)) == null);
    await page.click("[data-action=wish-buy]");
    await page.click(".modal [data-cat]");
    await page.click(".modal button.primary");
    check("confirmed buy is recorded", (await state(page, (S) => S.wishlist.find((w) => w.id === "w2").decision)) === "bought");
  });

  await step("CSV import & export", async () => {
    await go(page, "transactions");
    const csv = join(tmp, "bank.csv");
    writeFileSync(csv, 'Date,Description,Amount\n2026-10-03,Coffee shop,-4.50\n10/05/2026,Salary,1500.00\n2026-10-06,"Book, used",-12\n2026-10-07,=HYPERLINK("x"),-1');
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click("[data-action=import-csv]")]);
    await chooser.setFiles(csv);
    await page.waitForSelector("text=Imported 4 transactions");
    const imp = await state(page, (S) => S.transactions.filter((t) => ["Coffee shop", "Salary", "Book, used"].includes(t.name)).map((t) => t.type).sort().join(","));
    check("signed amounts → income/expense", imp === "expense,expense,income", imp);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-action=export-csv]")]);
    const text = readFileSync(await dl.path(), "utf8");
    check("export quotes commas", text.includes('"Book, used"'));
    check("export neutralises formulas", text.includes("'=HYPERLINK"));
  });

  await step("backup → erase → restore", async () => {
    await go(page, "settings");
    const before = await state(page, (S) => JSON.stringify({ t: S.transactions.length, b: S.bills.length, f: S.funds.length }));
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-action=export-json]")]);
    const file = join(tmp, `${ed.id}-backup.json`);
    writeFileSync(file, readFileSync(await dl.path()));
    await page.click("[data-action=reset]");
    await page.click(".modal button.danger");
    await page.waitForTimeout(150);
    check("erase clears data", (await state(page, (S) => S.transactions.length)) === 0);
    await page.keyboard.press("Escape");
    await go(page, "settings");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click("[data-action=import-json]")]);
    await chooser.setFiles(file);
    await page.click(".modal button:has-text('Restore')");
    const after = await state(page, (S) => JSON.stringify({ t: S.transactions.length, b: S.bills.length, f: S.funds.length }));
    check("restore brings everything back", before === after, `${before} vs ${after}`);
  });

  await step("appearance & calm settings", async () => {
    await go(page, "settings");
    for (const id of await page.$$eval("[data-action=palette]", (b) => b.map((x) => x.dataset.id))) await page.click(`[data-action=palette][data-id=${id}]`);
    await page.click("[data-action=set][data-key=theme][data-v=dark]");
    check("night mode", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark");
    await page.click("[data-action=set][data-key=font][data-v=readable]");
    await page.click("[data-action=toggle-focus] >> nth=0");
    check("focus mode hides extras", await page.isHidden(".nav a[href='#debt']"));
    await page.click("[data-action=toggle-focus] >> nth=0");
    await page.click("[data-action=toggle-privacy] >> nth=0");
    check("privacy blur", await page.evaluate(() => document.body.classList.contains("privacy")));
    await page.click("[data-action=toggle-privacy] >> nth=0");
    await page.reload();
    await page.waitForTimeout(250);
    check("settings persist after reload", (await page.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.font].join())) === "dark,readable");
  });

  await step("every screen, desktop (light + dark)", async () => {
    await go(page, "settings");
    await page.click("[data-action=load-sample]");
    await page.click(".modal button.primary");
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => { if (document.documentElement.dataset.theme !== t) document.querySelector("[data-action=toggle-theme]").click(); }, theme);
      for (const v of VIEWS) {
        await go(page, v);
        const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(`${v} (${theme}) no horizontal overflow`, w <= 0, `${w}px`);
      }
    }
  });
  check("no JavaScript errors (full)", page.errors.length === 0, page.errors.slice(0, 3).join(" | "));
  const key = await page.evaluate(() => window.__planner.storeKey);
  check("own storage key", key === ed.storeKey, key);
  await ctx.close();

  await step("every screen, phone (demo edition)", async () => {
    const { ctx: c2, page: m } = await newPage({ width: 390, height: 844 });
    await m.goto(demo);
    await m.waitForTimeout(300);
    check("demo banner", !!(await m.$(".banner.demo")));
    check("demo has sample data", (await state(m, (S) => S.transactions.length)) > 20);
    check("demo uses tab storage only", await m.evaluate((k) => sessionStorage.getItem(k) != null && localStorage.getItem(k) == null, ed.storeKey));
    for (const v of VIEWS) {
      await go(m, v);
      const w = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${v} (phone) no horizontal overflow`, w <= 0, `${w}px`);
    }
    await m.tap(".tabbar .plus");
    check("phone quick-add opens", !!(await m.waitForSelector(".modal", { timeout: 1500 }).catch(() => null)));
    await go(m, "settings");
    check("demo blocks backups", await m.isDisabled("[data-action=export-json]"));
    check("no JavaScript errors (demo/phone)", m.errors.length === 0, m.errors.slice(0, 3).join(" | "));
    await c2.close();
  });
}

/* ===================== Advanced audit ===================== */
const http = await import("node:http");
const { readFile } = await import("node:fs/promises");
const { extname } = await import("node:path");
const site = join(out, "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(site, p)); res.writeHead(200, { "Content-Type": TYPES[extname(p)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const ed of config.editions.filter((e) => !process.argv[2] || e.id === process.argv[2])) {
  console.log(`\n${ed.appName} — advanced`);
  const full = pathToFileURL(join(out, ed.folder, `${fileBase(ed)}-Planner.html`)).href;

  await step("empty planner: every screen works with no data", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(250);
    await page.keyboard.press("Escape");
    for (const v of VIEWS) await go(page, v);
    check("no errors on empty screens", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
    await ctx.close();
  });

  await step("hostile data cannot run code (XSS)", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const bad = `<img src=x onerror="window.__xss=1">`;
      const S = window.__planner.state;
      const today = new Date().toISOString().slice(0, 10);
      S.onboarded = true;
      S.profile.name = bad;
      S.categories[0].name = bad; S.categories[0].emoji = bad;
      S.transactions.push({ id: "x1", type: "expense", catId: S.categories[0].id, name: bad, note: bad, amount: 5, date: today, createdAt: 1 });
      S.bills.push({ id: "x2", name: bad, emoji: bad, amount: 9, freq: "monthly", anchor: today, catId: S.categories[0].id });
      S.funds.push({ id: "x3", name: bad, emoji: bad, target: 100, saved: 10, monthly: 5, freq: "monthly", anchor: today, hue: 10 });
      S.goals.push({ id: "x4", name: bad, emoji: bad, why: bad, status: "progress", steps: [{ text: bad, done: false }] });
      S.wishlist.push({ id: "x5", name: bad, price: 3, link: "javascript:window.__xss=1", addedAt: Date.now(), readyAt: Date.now() - 1 });
      S.notes = `</textarea>${bad}`;
      window.__planner.render();
    });
    for (const v of VIEWS) await go(page, v);
    await page.click("[data-action=goal-status]").catch(() => {});
    await page.click("[data-action=goal-status]").catch(() => {});
    await page.waitForTimeout(300);
    check("no injected script ran", (await page.evaluate(() => window.__xss)) === undefined);
    check("unsafe link not rendered", (await page.$$("a[href^='javascript:']")).length === 0);
    await ctx.close();
  });

  await step("currencies format correctly", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    for (const [cur, sym] of [["JPY", "¥"], ["EUR", "€"], ["GBP", "£"], ["MAD", "MAD"], ["USD", "$"]]) {
      await go(page, "settings");
      await page.selectOption("select[data-input=currency]", cur);
      await go(page, "home");
      const txt = await page.textContent(".main");
      check(`${cur} shows ${sym}`, txt.includes(sym));
    }
    await ctx.close();
  });

  await step("5 years / 10,000 transactions stays fast", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(200);
    await page.click("[data-ob=sample]");
    await page.evaluate(() => {
      const S = window.__planner.state;
      const cats = S.categories.map((c) => c.id);
      const now = Date.now();
      for (let i = 0; i < 10000; i++) {
        const d = new Date(now - (i % 1825) * 86400000);
        S.transactions.push({ id: "p" + i, type: "expense", catId: cats[i % cats.length], name: "Shop " + (i % 50), note: "", amount: 5 + (i % 90), date: d.toISOString().slice(0, 10), createdAt: i });
      }
    });
    const times = {};
    for (const v of VIEWS) {
      times[v] = await page.evaluate((v) => { location.hash = v; const t = performance.now(); window.__planner.render(); return performance.now() - t; }, v);
    }
    const slow = Object.entries(times).filter(([, t]) => t > 400);
    check("every screen renders in < 400 ms", slow.length === 0, slow.map(([v, t]) => `${v} ${Math.round(t)}ms`).join(", "));
    const size = await page.evaluate((k) => { window.__planner.render(); return (localStorage.getItem(k) || "").length; }, ed.storeKey);
    check("data fits browser storage (< 4 MB)", size < 4e6, `${Math.round(size / 1024)} KB`);
    await ctx.close();
  });

  await step("European bank CSV", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await go(page, "transactions");
    const csv = join(tmp, `eu-${ed.id}.csv`);
    writeFileSync(csv, "Datum;Omschrijving;Bedrag\n03.10.2026;Albert Heijn;-1.234,56\n05.10.2026;Salaris;2.100,00\n");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.click("[data-action=import-csv]")]);
    await chooser.setFiles(csv);
    await page.waitForTimeout(200);
    const r = await state(page, (S) => S.transactions.map((t) => `${t.type}:${t.amount}:${t.date}`).sort().join(" "));
    check("1.234,56 and dd.mm.yyyy understood", r === "expense:1234.56:2026-10-03 income:2100:2026-10-05", r);
    await ctx.close();
  });

  await step("installed app works offline (PWA)", async () => {
    const { ctx, page } = await newPage();
    current = page;
    const url = `${base}/${ed.hostedDir}/`;
    await page.goto(url);
    await page.waitForTimeout(300);
    const man = await page.evaluate(async () => { const r = await fetch("manifest.webmanifest"); const m = await r.json(); const icons = await Promise.all(m.icons.map((i) => fetch(i.src).then((x) => x.status))); return { ok: r.ok, name: m.name, icons }; });
    check("manifest + icons", man.ok && man.name === ed.appName && man.icons.every((s) => s === 200), JSON.stringify(man));
    check("apple touch icon", (await page.evaluate(async () => (await fetch(document.querySelector("link[rel=apple-touch-icon]").href)).status)) === 200);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.evaluate(() => { window.__planner.state.profile.name = "Offline"; window.__planner.state.onboarded = true; });
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForTimeout(400);
    check("opens with no internet", !!(await page.$("#sidebar .nav")));
    check("data still there offline", (await state(page, (S) => S.profile.name)) === "Offline");
    await ctx.setOffline(false);
    await ctx.close();
  });

  await step("small laptop: every menu reachable, strips swipe", async () => {
    const { ctx, page } = await newPage({ width: 1280, height: 660 });
    current = page;
    await page.goto(full);
    await page.waitForSelector("[data-ob=sample]");
    await page.click("[data-ob=sample]");
    await page.waitForTimeout(300);
    const side = await page.evaluate(() => { const s = document.querySelector("#sidebar"); return { sh: s.scrollHeight, ch: s.clientHeight, ov: getComputedStyle(s).overflowY }; });
    check("sidebar scrolls when taller than the screen", side.sh <= side.ch || /auto|scroll/.test(side.ov), JSON.stringify(side));
    await page.mouse.move(120, 400);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(200);
    const top = await page.evaluate(() => document.querySelector("#sidebar").scrollTop);
    check("mouse wheel scrolls the sidebar", side.sh <= side.ch || top > 0, top);
    const links = await page.$$eval("#sidebar .nav a", (as) => as.map((a) => a.getAttribute("href")));
    let reached = 0;
    for (const href of links) {
      const a = page.locator(`#sidebar .nav a[href='${href}']`);
      await a.scrollIntoViewIfNeeded();
      const b = await a.boundingBox();
      if (b && b.y >= 0 && b.y + b.height <= 662) { await a.click(); await page.waitForTimeout(150); await page.keyboard.press("Escape"); if ((await page.evaluate(() => location.hash)) === href) reached++; }
    }
    check("every sidebar menu can be reached and opened", reached === links.length, `${reached}/${links.length}`);
    const keep = await page.evaluate(() => document.querySelector("#sidebar").scrollTop);
    check("sidebar keeps its scroll after opening a page", side.sh <= side.ch || keep > 0, keep);
    // Horizontal strips: drag with the mouse, and a drag never counts as a click.
    await page.evaluate(() => { location.hash = "transactions"; });
    await page.waitForTimeout(250);
    const strip = page.locator(".chip-scroll").first();
    const info = await strip.evaluate((el) => ({ over: el.scrollWidth > el.clientWidth + 1, left: el.scrollLeft, fade: el.classList.contains("fade-r") }));
    if (info.over) {
      check("strip shows a fade where there's more", info.fade);
      const b = await strip.boundingBox();
      await page.mouse.move(b.x + b.width - 30, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(100);
      const after = await strip.evaluate((el) => el.scrollLeft);
      check("drag scrolls the filter chips", after > info.left, `${info.left} → ${after}`);
      check("drag doesn't pick a filter", (await page.locator(".chip-scroll .chip.on").first().textContent()).trim() === "All");
    }
    await page.evaluate(() => { location.hash = "home"; });
    await page.waitForTimeout(250);
    for (const el of await page.$$(".chart-scroll")) {
      const r = await el.evaluate((x) => ({ over: x.scrollWidth > x.clientWidth + 1, monthly: !!x.querySelector(".mchart") }));
      if (r.monthly) check("monthly chart fits its card", !r.over);
    }
    if (await page.$(".month-chips")) {
      const vis = await page.$$eval(".month-chips button", (bs) => { const p = bs[0].parentElement.getBoundingClientRect(); return bs.filter((b) => { const r = b.getBoundingClientRect(); return r.left >= p.left - 1 && r.right <= p.right + 1; }).length; });
      check("all 12 month chips visible on a laptop", vis === 12, vis);
    }
    check("no JavaScript errors (laptop)", page.errors.length === 0, page.errors.slice(0, 3).join(" | "));
    await ctx.close();
  });

  await step("phone: month strip swipes to the selected month", async () => {
    const { ctx, page } = await newPage({ width: 390, height: 844 });
    current = page;
    await page.goto(full);
    await page.waitForSelector("[data-ob=sample]");
    await page.click("[data-ob=sample]");
    await page.waitForTimeout(300);
    const sel = (await page.$(".month-chips")) ? ".month-chips" : (await page.$(".months")) ? ".months" : "";
    if (sel) {
      const r = await page.$eval(sel, (el) => { const on = el.querySelector(".on").getBoundingClientRect(), p = el.getBoundingClientRect(); return { scrollable: /auto|scroll/.test(getComputedStyle(el).overflowX), seen: on.left >= p.left - 1 && on.right <= p.right + 1 }; });
      check("month strip scrolls sideways", r.scrollable);
      check("selected month is in view", r.seen);
    }
    for (const el of await page.$$(".chart-scroll")) check("charts scroll sideways on a phone", /auto|scroll/.test(await el.evaluate((x) => getComputedStyle(x).overflowX)));
    await ctx.close();
  });

  await step("colour contrast (WCAG AA)", async () => {
    const { ctx, page } = await newPage();
    current = page;
    await page.goto(full);
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    for (const theme of ["light", "dark"]) {
      await page.evaluate((t) => { if (document.documentElement.dataset.theme !== t) document.querySelector("[data-action=toggle-theme]").click(); }, theme);
      const pairs = await page.evaluate(() => {
        const v = (n) => { const d = document.createElement("div"); d.style.color = `var(${n})`; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c.match(/[\d.]+/g).slice(0, 3).map(Number); };
        return [["text", "--ink", "--bg"], ["secondary text", "--ink-2", "--surface"], ["hint text", "--ink-3", "--surface"], ["headings", "--head", "--bg"], ["button text", "--accent-ink", "--accent-btn"], ["links", "--accent-strong", "--surface"], ["green on green", "--good", "--good-soft"], ["red", "--bad", "--surface"]].map(([k, a, b]) => [k, v(a), v(b)]);
      });
      for (const [k, a, b] of pairs) { const r = contrast(a, b); check(`${theme}: ${k} ≥ 4.5`, r >= 4.5, r.toFixed(2)); }
    }
    await ctx.close();
  });
}
server.close();
await browser.close();
console.log(`\n${passes} checks passed, ${failures} failed${failures ? ` (screenshots in ${tmp})` : ""}`);
process.exit(failures ? 1 : 0);
