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
await browser.close();
console.log(`\n${passes} checks passed, ${failures} failed${failures ? ` (screenshots in ${tmp})` : ""}`);
process.exit(failures ? 1 : 0);
