/* ==========================================================================
   Views — each returns the HTML for the main area
   ========================================================================== */

const ui = {
  view: "home",
  month: monthKey(todayISO()),
  calMonth: monthKey(todayISO()),
  calSel: todayISO(),
  txQuery: "",
  txType: "all",
  txCat: "",
  txSort: { k: "date", dir: -1 },
  budgetScope: "all",
  debtStrategy: "avalanche",
  debtExtra: 100,
  year: Number(todayISO().slice(0, 4)),
};

const NAV = [
  { group: "Plan" },
  { id: "setup", label: "Getting started", icon: "compass", nf: true },
  { id: "home", label: "Home", icon: "home" },
  { id: "today", label: "Today", icon: "sun" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "paycheck", label: "Paycheck plan", icon: "wallet", nf: true },
  { group: "Track" },
  { id: "transactions", label: "Transactions", icon: "list" },
  { id: "budget", label: "Budget", icon: "envelope" },
  { id: "bills", label: "Bills & subscriptions", icon: "receipt", nf: true },
  { group: "Grow", nf: true },
  { id: "savings", label: "Savings", icon: "piggy", nf: true },
  { id: "debt", label: "Debt payoff", icon: "card", nf: true },
  { id: "goals", label: "Goals", icon: "target", nf: true },
  { id: "impulse", label: "Impulse Pause", icon: "pause" },
  { id: "rewards", label: "Streaks & rewards", icon: "trophy", nf: true },
  { group: "Review", nf: true },
  { id: "year", label: "Year in review", icon: "chart", nf: true },
  { id: "settings", label: "Settings", icon: "settings" },
];

/* ---------- Shared pieces ---------- */
function pageHead(title, sub, actions = "", { month } = {}) {
  const fl = SKIN.flourish ? `<span class="flourish">${SKIN.flourish}</span>` : "";
  const nav = month && SKIN.monthNav === "compact" ? monthNav(month) : "";
  const tools = SKIN.headTools ? headTools() : "";
  return `<div class="page-head"><div><h1>${title}${fl}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${nav || actions || tools ? `<div class="actions">${tools}${nav}${actions}</div>` : ""}</div>`;
}
/** Night mode, privacy blur and focus mode, for skins that keep the sidebar to navigation only. */
function headTools() {
  return `<div class="head-tools">
    <button class="btn ghost icon-btn" data-action="search" title="Search everything (K)" aria-label="Search everything">${icon("search")}</button>
    <button class="btn ghost icon-btn" data-action="toggle-theme" title="Day / night (D)" aria-label="Toggle night mode">${icon(isDark() ? "sun" : "moon")}</button>
    <button class="btn ghost icon-btn" data-action="toggle-privacy" title="Privacy blur (P)" aria-label="Toggle privacy blur">${icon(S.settings.privacy ? "eyeoff" : "eye")}</button>
    <button class="btn ghost icon-btn ${S.settings.focus ? "on" : ""}" data-action="toggle-focus" title="Focus mode" aria-label="Toggle focus mode" aria-pressed="${!!S.settings.focus}">${icon("focus")}</button>
  </div>`;
}
function monthNav(mk, action = "set-month") {
  return `<div class="month-nav" role="group" aria-label="Choose month">
    <button class="btn ghost icon-btn" data-action="${action}" data-mk="${addMonths(mk, -1)}" aria-label="Previous month">${icon("chevL")}</button>
    <span class="month-nav-label">${icon("calendar", 18)}<span>${monthLabel(mk)}</span></span>
    <button class="btn ghost icon-btn" data-action="${action}" data-mk="${addMonths(mk, 1)}" aria-label="Next month">${icon("chevR")}</button>
  </div>`;
}
function monthsBar(selected, action = "set-month") {
  if (SKIN.monthNav === "compact") return "";
  if (SKIN.monthNav === "bloom") {
    const y = selected.slice(0, 4);
    return `<div class="bloom-months">
      <div class="month-pill" role="group" aria-label="Choose month">
        <button data-action="${action}" data-mk="${addMonths(selected, -1)}" aria-label="Previous month">${icon("chevL", 18)}</button>
        <b>${monthLabel(selected)}</b>
        <button data-action="${action}" data-mk="${addMonths(selected, 1)}" aria-label="Next month">${icon("chevR", 18)}</button>
      </div>
      <div class="month-chips" data-drag-scroll role="group" aria-label="Months of ${y}">${MONTHS_S.map((m, i) => { const mk = `${y}-${pad(i + 1)}`; return `<button class="${mk === selected ? "on" : ""}" data-action="${action}" data-mk="${mk}" ${mk === selected ? 'aria-current="true"' : ""}>${m}</button>`; }).join("")}</div>
    </div>`;
  }
  const y = selected.slice(0, 4);
  return `<div class="months" role="group" aria-label="Choose month">
    <button data-action="${action}" data-mk="${addMonths(selected, -12)}" aria-label="Previous year">${icon("chevL", 14)}</button>
    <span class="yr">${y}</span>
    <button data-action="${action}" data-mk="${addMonths(selected, 12)}" aria-label="Next year">${icon("chevR", 14)}</button>
    ${MONTHS_S.map((m, i) => { const mk = `${y}-${pad(i + 1)}`; return `<button class="${mk === selected ? "on" : ""}" data-action="${action}" data-mk="${mk}">${m}</button>`; }).join("")}
  </div>`;
}
function schedRow(o, { showDate = true } = {}) {
  const cls = o.kind === "income" ? "good" : o.kind === "fund" ? "info" : o.kind === "debt" ? "warn" : "";
  const sub = o.kind === "income" ? "Income" : o.kind === "fund" ? "Savings transfer" : o.kind === "debt" ? "Debt minimum" : `${o.isSub ? "Subscription" : "Bill"}${o.autopay ? " · autopay" : ""}`;
  return `<div class="li ${o.done ? "done" : ""}">
    ${showDate ? `<div class="when">${relDay(o.date)}</div>` : ""}
    ${tick(o.done, `data-action="toggle-occ" data-key="${esc(o.key)}"`, o.kind === "income" ? "good" : "")}
    <span class="dot ${cls}"></span>
    <div class="name">${esc(o.emoji || "")} ${esc(o.name)}<small>${sub}</small></div>
    <div class="amt ${o.kind === "income" ? "pos" : ""}">${o.kind === "income" ? "+" : ""}${moneyHTML(o.amount)}</div>
  </div>`;
}
function txRow(t, { showDate = false } = {}) {
  const cat = catById(t.catId);
  const isIn = t.type === "income" || (t.type === "saving" && t.amount < 0);
  const amount = t.type === "saving" && t.amount < 0 ? -t.amount : t.amount;
  return `<div class="li" data-action="edit-tx" data-id="${t.id}" style="cursor:pointer">
    ${showDate ? `<div class="when">${fmtDay(t.date)}</div>` : ""}
    <span class="emoji-badge" style="${catStyle(cat)}">${esc(cat?.emoji || "•")}</span>
    <div class="name">${esc(t.name || cat?.name || "Untitled")}<small>${esc(cat?.name || "Uncategorised")}${t.note ? " · " + esc(t.note) : ""}${t.link ? " · scheduled" : ""}</small></div>
    <div class="amt ${isIn ? "pos" : ""}">${isIn ? "+" : ""}${moneyHTML(amount)}</div>
  </div>`;
}
function occByKey(key) {
  const date = key.slice(key.lastIndexOf(":") + 1);
  return scheduleIn(date, date).find((o) => o.key === key);
}
function frequentSpends() {
  const since = addDays(todayISO(), -90);
  const map = {};
  for (const t of S.transactions) {
    if (t.type !== "expense" || t.link || t.date < since) continue;
    const k = `${(t.name || "").toLowerCase()}|${t.catId}`;
    const m = (map[k] ||= { name: t.name, catId: t.catId, amount: t.amount, n: 0, last: "" });
    m.n++;
    if (t.date >= m.last) { m.last = t.date; m.amount = t.amount; }
  }
  return Object.values(map).filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 6);
}
const fundTotals = () => ({ saved: sum(S.funds, (f) => f.saved), target: sum(S.funds, (f) => f.target) });
const debtTotals = () => {
  const open = S.debts.filter((d) => d.balance > 0);
  return { owed: sum(open, (d) => d.balance), minimums: sum(open, (d) => d.minimum), count: open.length };
};

/* ---------- Home ---------- */
/** Totals for a month, optionally only up to a given day (for fair month-to-date comparisons). */
function periodTotals(mk, uptoDay = 31) {
  const txs = txInMonth(mk).filter((t) => Number(t.date.slice(8)) <= uptoDay);
  return {
    income: sum(txs.filter((t) => t.type === "income"), (t) => t.amount),
    spent: sum(txs.filter((t) => t.type === "expense"), (t) => t.amount),
    saved: sum(txs.filter((t) => t.type === "saving"), (t) => t.amount),
  };
}
function delta(cur, prev, prevMk, upIsGood = true) {
  if (!(prev > 0)) return `<span class="delta">&nbsp;</span>`;
  const p = Math.round(((cur - prev) / prev) * 100);
  const cls = p === 0 ? "" : (p > 0) === upIsGood ? "up" : "down";
  return `<span class="delta ${cls}">${p > 0 ? "+" : ""}${p}% vs ${MONTHS_S[Number(prevMk.slice(5)) - 1]}</span>`;
}
function homeChartItems(mk) {
  return chartItems(S.categories.map((c) => ({ c, plan: catAvailable(c, mk), spent: catSpent(c.id, mk) })));
}
/** Chart rows for budget vs. actual: the biggest categories, then everything else grouped. */
function chartItems(rows, max = 8) {
  const mono = SKIN.chartMono;
  const item = (c, plan, actual) => ({ label: c.name, emoji: c.emoji, short: c.name.split(/[ /&]/)[0], plan, actual,
    color: mono ? "var(--accent)" : catColor(c), soft: mono ? "var(--accent-soft)" : isDark() ? `hsl(${c.hue} 30% 22%)` : `hsl(${c.hue} 70% 92%)` });
  const live = rows.filter((r) => r.plan > 0 || r.spent > 0).sort((a, b) => Math.max(b.plan, b.spent) - Math.max(a.plan, a.spent));
  const items = live.slice(0, max).map((r) => item(r.c, r.plan, r.spent));
  const rest = live.slice(max);
  if (rest.length) items.push(item({ name: "Other", emoji: "…", hue: 0 }, sum(rest, (r) => r.plan), sum(rest, (r) => r.spent)));
  return items;
}
function savingsMonthCard(m) {
  const planned = sum(m.sched.filter((o) => o.kind === "fund"), (o) => o.amount);
  const saved = Math.max(0, m.saved);
  const p = planned > 0 ? saved / planned : saved > 0 ? 1 : 0;
  const [title, text] = !planned && !saved
    ? ["Start small", "Give a savings fund an automatic transfer and it becomes your monthly target."]
    : p >= 1 ? ["Monthly goal reached! 🎉", `You saved ${money(saved)} this month. Future you is grateful.`]
    : ["You're on the right track!", `${money(planned - saved)} to go to reach this month's savings goal.`];
  return `<div class="card">
    <div class="card-head"><h2>${icon("target", 20)} Savings this month</h2><button class="btn ghost icon-btn" data-action="go" data-view="savings" aria-label="Open savings">${icon("chevR")}</button></div>
    <div class="ring-center">${ring(p, { size: 176, stroke: 14, label: `<span class="big-pct">${Math.round(p * 100)}%</span>`, sub: `${money(saved)} of ${money(planned)}`, color: "var(--good)" })}</div>
    <div class="nudge good-nudge mt"><span class="e">🌿</span><div><b>${title}</b><div class="tiny">${text}</div></div></div>
  </div>`;
}
function goalsMini() {
  const funds = S.funds.slice(0, 4);
  return `<div class="card">
    <div class="card-head"><h2>${icon("sparkle", 20)} My savings goals</h2><a class="link-sm" href="#savings">See all</a></div>
    ${funds.length ? `<div class="list">${funds.map((f) => { const p = f.target > 0 ? f.saved / f.target : 0; const st = catStyle({ hue: f.hue ?? 205 }); return `<a class="li goal-li" href="#savings" style="${st}"><span class="emoji-badge">${esc(f.emoji || "🐷")}</span><div class="grow"><div class="row between"><b>${esc(f.name)}</b><span class="tiny">${Math.round(p * 100)}%</span></div><div class="tiny">${money(f.saved)} of ${money(f.target)}</div><div class="mt-s">${progressBar(f.saved, f.target, st)}</div></div>${icon("chevR", 18)}</a>`; }).join("")}</div>`
      : empty("🌱", "No goals yet", "A trip, a cushion, a new laptop… start a savings fund.", `<button class="btn primary" data-action="add-fund">New fund</button>`)}
  </div>`;
}
function upcomingPayments(today, limit = 5) {
  const items = scheduleIn(today, addDays(today, 31)).filter((o) => o.kind !== "income" && !o.done).slice(0, limit);
  return `<div class="card">
    <div class="card-head"><h2>${icon("calendar", 20)} Upcoming payments</h2><a class="link-sm" href="#calendar">See all</a></div>
    ${items.length ? `<div class="list">${items.map((o) => schedRow(o)).join("")}</div>` : empty("🌤️", "Nothing due soon", "Add your bills and they'll show up here with a checkbox.", `<button class="btn primary" data-action="add-bill">Add a bill</button>`)}
  </div>`;
}
function viewHome() {
  const today = todayISO();
  const mk = ui.month;
  const m = monthSummary(mk);
  const isCur = mk === monthKey(today);
  const ft = fundTotals(), dt = debtTotals();
  const goalsActive = S.goals.filter((g) => g.status === "progress").length;
  const catItems = homeChartItems(mk);
  const hello = S.profile.name ? `Hello, ${esc(S.profile.name)}` : "Hello there";
  const greetingSub = isCur ? "One step at a time — you're doing great." : `Looking back at ${monthLabel(mk)}.`;
  const t = isCur ? todaySummary() : null;
  const chartCard = `<div class="card focus-hide">
    <div class="card-head"><h2>${icon("chart", 20)} Budget vs. actual — ${monthName(mk)}</h2><button class="btn sm" data-action="go" data-view="budget">Edit budget</button></div>
    ${chartPlanVsActual(catItems)}
  </div>`;

  if (SKIN.homeLayout === "balance") return homeBalance();
  if (SKIN.homeLayout === "bloom") return homeBloom({ today, mk, m, isCur, ft, dt, goalsActive, hello, greetingSub, t });
  if (SKIN.homeLayout === "tiles") {
    const prevMk = addMonths(mk, -1);
    const day = isCur ? Number(today.slice(8)) : 31;
    const cur = periodTotals(mk, day), prev = periodTotals(prevMk, day);
    const prevFull = monthSummary(prevMk);
    return `
    ${pageHead(hello, greetingSub, `<button class="btn primary" data-action="quick-add">${icon("plus")}Add a spend</button>`, { month: mk })}
    ${monthsBar(mk)}
    <div class="kpis">
      <div class="card kpi kpi-hero" data-action="go" data-view="today" style="cursor:pointer">
        <div class="row"><span class="kpi-ic acc">${icon("wallet")}</span><div><h3 class="row" style="gap:6px">Safe to spend <span data-tip="Money in − spent − bills, savings & debt still due">${icon("info", 16)}</span></h3><div class="tiny">${isCur ? "This month" : monthLabel(mk)}</div></div></div>
        <div class="value ${m.safe < 0 ? "neg" : ""}">${moneyHTML(m.safe)}</div>
        <div class="tiny">${isCur ? `≈ ${money(t.allowance)} a day · ${plural(t.daysLeft, "day")} left` : "Left after everything that month"}</div>
      </div>
      <div class="card kpi"><span class="kpi-ic good">${icon("arrowUp")}</span><div class="label">Income</div><div class="value">${moneyHTML(m.income + m.expected)}</div>${delta(m.income + m.expected, prevFull.income, prevMk, true)}</div>
      <div class="card kpi"><span class="kpi-ic warn">${icon("arrowDown")}</span><div class="label">Spent</div><div class="value">${moneyHTML(m.spent)}</div>${delta(cur.spent, prev.spent, prevMk, false)}</div>
      <div class="card kpi"><span class="kpi-ic info">${icon("leaf")}</span><div class="label">Total saved</div><div class="value">${moneyHTML(ft.saved)}</div><span class="delta up">+${money(Math.max(0, m.saved))} this month</span></div>
    </div>
    <div class="grid g-side mt">${chartCard}${savingsMonthCard(m)}</div>
    <div class="grid g2 mt">${upcomingPayments(isCur ? today : monthStart(mk))}${goalsMini()}</div>
    <div class="grid g2 mt focus-hide">
      <div class="card"><div class="card-head"><h2>Where it went</h2></div>${spendingDonut(m.txs)}</div>
      <div class="card"><div class="card-head"><h3>${icon("info", 18)} How safe to spend works</h3></div>${formulaHTML(m)}
        <div class="formula mt"><span>Still owed on debts</span><b class="m">${money(dt.owed)}</b><span>Goals in progress</span><b>${goalsActive}</b></div></div>
    </div>`;
  }

  const upcoming = (isCur ? scheduleIn(today, addDays(today, 14)) : m.sched).slice(0, 7);
  return `
  ${pageHead(hello, greetingSub, `<button class="btn" data-action="go" data-view="calendar">${icon("calendar")}Open calendar</button>`, { month: mk })}
  ${monthsBar(mk)}
  <div class="grid g-hero">
    <div class="card hero-split" style="padding:0">
      <div>
        <div class="tiny">Saved across every fund</div>
        <div class="tile big" style="background:none;border:0;padding:0"><div class="value">${moneyHTML(ft.saved)}</div></div>
        <div class="tiny mt-s">across ${plural(S.funds.length, "fund")}${ft.target ? `, toward ${money(ft.target)}` : ""}</div>
        ${ft.target ? `<div class="mt-s">${progressBar(ft.saved, ft.target)}</div>` : ""}
      </div>
      <div>
        <div class="tiny">Still owed</div>
        <div class="tile big" style="background:none;border:0;padding:0"><div class="value">${moneyHTML(dt.owed)}</div></div>
        <div class="tiny mt-s">across ${plural(dt.count, "debt")}</div>
      </div>
    </div>
    <div class="tile good big" data-action="go" data-view="today" style="cursor:pointer">
      <div class="label">${icon("sparkle", 15)} ${monthName(mk)} safe to spend</div>
      <div class="value ${m.safe < 0 ? "neg" : ""}">${moneyHTML(m.safe)}</div>
      <div class="sub">${isCur ? `About ${money(Math.max(0, t.allowance))} a day for the rest of the month` : "Left after everything that month"}</div>
    </div>
  </div>
  <div class="grid g4 mt">
    <div class="tile accent"><div class="label">Money in</div><div class="value">${moneyHTML(m.income + m.expected)}</div><div class="sub">${money(m.income)} received${m.expected ? ` · ${money(m.expected)} expected` : ""}</div></div>
    <div class="tile accent"><div class="label">Spent</div><div class="value">${moneyHTML(m.spent)}</div><div class="sub">${plural(m.txs.filter((t) => t.type === "expense").length, "transaction")}</div></div>
    <div class="tile accent"><div class="label">Debt minimums monthly</div><div class="value">${moneyHTML(dt.minimums)}</div><div class="sub">${dt.count ? `${plural(dt.count, "debt")} in progress` : "Debt-free 🎉"}</div></div>
    <div class="tile accent"><div class="label">Goals in progress</div><div class="value">${goalsActive}</div><div class="sub">${S.goals.filter((g) => g.status === "done").length} completed</div></div>
  </div>

  <div class="grid g-side mt">
    <div class="card">
      <div class="card-head"><h2>${isCur ? "Coming up" : `Scheduled in ${monthName(mk)}`}</h2><button class="btn sm" data-action="add-bill">${icon("plus")}Add bill</button></div>
      ${upcoming.length ? `<div class="list">${upcoming.map((o) => schedRow(o)).join("")}</div>` : empty("🌤️", "Nothing due soon", "Add paychecks and bills and they'll show up here with a checkbox.", `<button class="btn primary" data-action="go" data-view="paycheck">Add a paycheck</button>`)}
    </div>
    <div class="card focus-hide">
      <div class="card-head"><h3>${icon("info", 18)} How safe to spend works</h3></div>
      ${formulaHTML(m)}
      <p class="tiny mt">Safe to spend is what's left after every bill, savings transfer and debt payment you've planned this month. Spend it guilt-free.</p>
    </div>
  </div>
  <div class="mt">${chartCard}</div>
  <div class="grid g2 mt">${savingsMonthCard(m)}${goalsMini()}</div>
  <div class="grid g2 mt focus-hide">
    <div class="card"><div class="card-head"><h2>Where it went</h2></div>${spendingDonut(m.txs)}</div>
    <div class="card">
      <div class="card-head"><h2>Bills this month</h2><span class="pill muted">${m.sched.filter((o) => o.kind === "bill" || o.kind === "debt").filter((o) => o.done).length}/${m.sched.filter((o) => o.kind === "bill" || o.kind === "debt").length} paid</span></div>
      ${(() => { const b = m.sched.filter((o) => o.kind === "bill" || o.kind === "debt"); return b.length ? `<div class="list">${b.map((o) => schedRow(o)).join("")}</div>` : empty("🧾", "No bills yet", "Add rent, phone, subscriptions…", `<button class="btn" data-action="add-bill">Add a bill</button>`); })()}
    </div>
  </div>`;
}
/* ---------- Home, "bloom" layout (Cherry Blossom) ---------- */
const BLOOM_IC = {
  sprout: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 36V19" stroke="#6f8f55" stroke-width="2.4" stroke-linecap="round"/><path d="M20 22C19 12 11 7 3 8c0 9 7 15 17 14Z" fill="#9fbf7f"/><path d="M20 22C9 15 6 11 4 9" stroke="#6f8f55" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M20 18c1-8 8-13 16-12 0 8-6 13-16 12Z" fill="#7fa45f"/><path d="M20 18c6-5 10-8 14-10" stroke="#5d7f45" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
  house: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 19 20 6l15 13" stroke="#6f8f63" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 17v17h22V17" fill="#e7efe0" stroke="#6f8f63" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 34v-8a4 4 0 0 1 8 0v8" fill="#f3b6c4" stroke="#c0405f" stroke-width="2"/><rect x="25" y="20" width="4" height="4" rx="1" fill="#9fbf8f"/><rect x="11" y="20" width="4" height="4" rx="1" fill="#9fbf8f"/></svg>`,
  cart: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 7h5l4 19h19l4-14H10" stroke="var(--accent-strong)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 12h23l-3.4 11H13.4Z" fill="var(--accent-soft)"/><path d="M17 12l1 11M24 12l-.3 11M12 17.5h21" stroke="var(--accent-strong)" stroke-width="1.5" opacity=".7"/><circle cx="14" cy="32" r="2.8" fill="var(--accent-strong)"/><circle cx="29" cy="32" r="2.8" fill="var(--accent-strong)"/></svg>`,
  piggy: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 21c0-7 6-12 14-12 3 0 6 .8 8 2.2l4-2.2-.8 5.2c1.6 1.6 2.6 3.6 3 5.8H37v6h-2.6c-1 2-2.6 3.6-4.6 4.8V34h-5v-2.6c-1.2.2-2.6.3-4 .2V34h-5v-3.6C10 28.6 7 25 7 21Z" fill="#8fae7c"/><circle cx="29" cy="18" r="1.6" fill="#3f5a33"/><path d="M15 13.5c2-1 5-1.4 8-.8" stroke="#e8f1df" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7 20c-2.6 0-4-1.6-4-3.4" stroke="#8fae7c" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="17" y="6" width="7" height="3" rx="1.5" fill="#c0405f"/></svg>`,
  leaf: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 33C6 18 16 7 34 6c1 18-9 28-27 27Z" fill="#8fb27a"/><path d="M8 32C15 24 21 18 30 10M15 25l-1-7M21 19l6 1M18 22l-6-1" stroke="#eef5e6" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
};
/** Solid crimson glyphs for common savings-fund emojis; anything else keeps its emoji. */
const GOAL_GLYPH = {
  "🛟": `<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v5.2M12 16v5.2M2.8 12H8M16 12h5.2" stroke="currentColor" stroke-width="4.6" opacity=".9"/>`,
  "✈️": `<path d="M21.5 4.2c.9-.9.6-2.1-.4-2.4-.8-.2-1.7.1-2.4.8l-3.8 3.8L4.6 3.6 2.8 5.4l8.4 4.4-4 4-3.2-.6L2.6 14.6l3.9 2 2 3.9 1.4-1.4-.6-3.2 4-4 4.4 8.4 1.8-1.8L16.6 8Z" fill="currentColor"/>`,
  "💻": `<rect x="4" y="4.5" width="16" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M1.5 18.2h21l-1.2 1.8H2.7Z" fill="currentColor"/>`,
  "🏠": `<path d="M12 3 2.5 11h2.7v9.5h5.3v-6h3v6h5.3V11h2.7Z" fill="currentColor"/>`,
  "🏡": `<path d="M12 3 2.5 11h2.7v9.5h5.3v-6h3v6h5.3V11h2.7Z" fill="currentColor"/>`,
  "🚗": `<path d="M5 11 6.8 6.2A2 2 0 0 1 8.7 5h6.6a2 2 0 0 1 1.9 1.2L19 11a2 2 0 0 1 2 2v4h-2v2h-3v-2H8v2H5v-2H3v-4a2 2 0 0 1 2-2Zm2.2 0h9.6l-1.3-3.6H8.5ZM6.5 15.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm11 0a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" fill="currentColor"/>`,
  "🎁": `<path d="M3 8h18v4H3Zm1.5 4h15v9h-15Z" fill="currentColor"/><path d="M12 8v13" stroke="var(--surface)" stroke-width="2"/><path d="M12 8C9 8 7 7 7 5.4S9 3 12 8Zm0 0c3 0 5-1 5-2.6S15 3 12 8Z" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  "🐷": `<path d="M4 12c0-4.2 3.6-7 8-7 1.8 0 3.4.4 4.7 1.2L19 5l-.4 3c1 1 1.6 2.1 1.8 3.4H22V15h-1.6c-.6 1.2-1.6 2.2-2.8 2.9V20h-3v-1.5a12 12 0 0 1-2.6.1V20H9v-2.1C6 16.8 4 14.7 4 12Z" fill="currentColor"/>`,
  "🎓": `<path d="M12 4 1.5 9 12 14l8.5-4v5.5h2V9Z" fill="currentColor"/><path d="M6 12.3v4c0 1.6 2.7 3 6 3s6-1.4 6-3v-4l-6 2.9Z" fill="currentColor"/>`,
  "💍": `<path d="M9 2.5h6l2 3-5 4-5-4Z" fill="currentColor"/><circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>`,
};
const goalGlyph = (emoji) => (GOAL_GLYPH[emoji] ? `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">${GOAL_GLYPH[emoji]}</svg>` : `<span class="bgoal-emoji">${esc(emoji || "🐷")}</span>`);
/** Budget vs. actual, one pair of bars per month (Jan → the month you're looking at). */
function monthlyChartRows(mk) {
  let from = `${mk.slice(0, 4)}-01`;
  if (monthsBetween(from, mk) < 5) from = addMonths(mk, -5);
  const rows = [];
  for (let k = from; k <= mk; k = addMonths(k, 1)) {
    rows.push({ mk: k, label: MONTHS_S[Number(k.slice(5)) - 1], plan: sum(S.categories, (c) => budgetFor(c, k)), actual: sum(txInMonth(k).filter((t) => t.type === "expense"), (t) => t.amount) });
  }
  return rows;
}
function bloomKpi(ic, title, value, sub, bar, opts = "") {
  return `<div class="card bkpi" ${opts}>
    <div class="bkpi-head"><span class="bic">${BLOOM_IC[ic]}</span><h3>${title}</h3></div>
    <div class="bkpi-value">${value}</div>
    <div class="bkpi-sub">${sub}</div>
    ${bar}
  </div>`;
}
const bloomBar = (p, cls) => `<div class="bbar ${cls}" role="progressbar" aria-valuenow="${Math.round(clamp(p, 0, 1) * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.round(clamp(p, 0, 1) * 100)}%"></i></div>`;
function homeBloom({ today, mk, m, isCur, ft, dt, goalsActive, hello, greetingSub, t }) {
  const totalIn = m.income + m.expected;
  const expenses = m.txs.filter((x) => x.type === "expense").length;
  const planned = m.sched.filter((o) => o.kind === "fund");
  const savedM = Math.max(0, m.saved), goalM = sum(planned, (o) => o.amount);
  const sp = goalM > 0 ? savedM / goalM : savedM > 0 ? 1 : 0;
  const upcoming = scheduleIn(isCur ? today : monthStart(mk), addDays(isCur ? today : monthStart(mk), 31)).filter((o) => o.kind !== "income" && !o.done).slice(0, 3);
  const funds = S.funds.slice(0, 3);
  const dotFor = (o) => (o.kind === "debt" ? "blue" : o.kind === "fund" ? "crimson" : "blush");
  const sub = (o) => (o.kind === "fund" ? "Savings transfer" : o.kind === "debt" ? "Debt minimum" : `${o.isSub ? "Subscription" : "Bill"}${o.autopay ? " · autopay" : ""}`);
  return `
  <div class="bloom">
  ${pageHead(hello, greetingSub, `<button class="btn primary add-spend" data-action="quick-add">${icon("plus", 22)}Add a spend</button>`, { month: mk })}
  ${monthsBar(mk)}
  <div class="bkpis">
    ${bloomKpi("sprout", `Safe to spend <span class="tip-i" data-tip="Money in − spent − bills, savings &amp; debt still due">${icon("info", 15)}</span>`, `<span class="${m.safe < 0 ? "neg" : ""}">${moneyHTML(m.safe)}</span>`,
      isCur ? `About ${money(t.allowance)} a day<br>for the rest of the month` : `Left after everything<br>in ${monthName(mk)}`, bloomBar(totalIn > 0 ? m.safe / totalIn : 0, "sage"), `data-action="go" data-view="today" style="cursor:pointer"`)}
    ${bloomKpi("house", "Income", moneyHTML(totalIn), `Received ${money(m.income)}<br>Expected ${money(m.expected)}`, bloomBar(totalIn > 0 ? m.income / totalIn : 0, "mix"))}
    ${bloomKpi("cart", "Spent", moneyHTML(m.spent), `${plural(expenses, "transaction")}<br>&nbsp;`, bloomBar(m.planned > 0 ? m.spent / m.planned : 0, "crimson"))}
    ${bloomKpi("piggy", "Total saved", moneyHTML(ft.saved), `Across ${plural(S.funds.length, "fund")}<br>&nbsp;`, bloomBar(ft.target > 0 ? ft.saved / ft.target : 0, "olive"))}
  </div>
  <div class="bloom-row">
    <div class="card bcard focus-hide">
      <div class="bcard-head"><h2>${icon("chart", 30)} Budget vs. actual</h2><div class="blegend"><span><i class="plan"></i>Budget</span><span><i class="act"></i>Actual</span></div></div>
      ${chartMonthly(monthlyChartRows(mk), mk)}
    </div>
    <div class="card bcard bsave" data-action="go" data-view="savings" style="cursor:pointer">
      <div class="bcard-head"><h2><span class="bic sm">${BLOOM_IC.leaf}</span> Savings this month</h2></div>
      <div class="ring-center">${ring(sp, { size: 196, stroke: 15, label: `<span class="big-pct">${Math.round(sp * 100)}%</span>`, color: "var(--sage)" })}</div>
      <div class="bsave-amt">${moneyHTML(savedM)}</div>
      <div class="bsave-of">${goalM > 0 ? `of ${money(goalM)} goal` : "Add an automatic transfer to set a goal"}</div>
    </div>
  </div>
  <div class="bloom-row two">
    <div class="card bcard">
      <div class="bcard-head"><h2>${icon("calendar", 30)} Upcoming payments</h2><a class="btn view-all" href="#calendar">View all</a></div>
      ${upcoming.length ? `<div class="blist">${upcoming.map((o) => `<div class="bpay ${o.done ? "done" : ""}">
        <span class="bdate">${fmtDay(o.date)}</span>
        ${tick(o.done, `data-action="toggle-occ" data-key="${esc(o.key)}"`)}
        <span class="bdot ${dotFor(o)}"></span>
        <div class="bname">${esc(o.name)}<small>${sub(o)}</small></div>
        <div class="bamt">${esc(money(o.amount))}</div>
      </div>`).join("")}</div>` : empty("🌤️", "Nothing due soon", "Add your bills and they'll show up here with a checkbox.", `<button class="btn primary" data-action="add-bill">Add a bill</button>`)}
    </div>
    <div class="card bcard">
      <div class="bcard-head"><h2>${icon("target", 30)} My savings goals</h2><a class="btn view-all" href="#savings">View all</a></div>
      ${funds.length ? `<div class="blist">${funds.map((f) => { const p = f.target > 0 ? f.saved / f.target : 0; return `<a class="bgoal" href="#savings">
        <span class="bgoal-ic" aria-hidden="true">${goalGlyph(f.emoji)}</span>
        <div class="grow"><div class="bgoal-top"><b>${esc(f.name)}</b><span>${esc(moneyRound(f.saved))} / ${esc(moneyRound(f.target))}</span></div>
        <div class="bgoal-bar">${bloomBar(p, "sage")}<span>${Math.round(p * 100)}%</span></div></div>
      </a>`; }).join("")}</div>`
        : empty("🌱", "No goals yet", "A trip, a cushion, a new laptop… start a savings fund.", `<button class="btn primary" data-action="add-fund">New fund</button>`)}
    </div>
  </div>
  <div class="grid g2 mt focus-hide">
    <div class="card"><div class="card-head"><h2>Where it went</h2></div>${spendingDonut(m.txs)}</div>
    <div class="card"><div class="card-head"><h3>${icon("info", 18)} How safe to spend works</h3></div>${formulaHTML(m)}
      <div class="formula mt"><span>Still owed on debts</span><b class="m">${money(dt.owed)}</b><span>Goals in progress</span><b>${goalsActive}</b></div></div>
  </div>
  </div>`;
}
function formulaHTML(m) {
  const row = (label, v, sign) => `<span>${label}</span><b class="m">${sign}${money(Math.abs(v))}</b>`;
  return `<div class="formula">
    ${row("Money received", m.income, "+ ")}
    ${row("Paychecks still expected", m.expected, "+ ")}
    ${row("Spent so far", m.spent, "− ")}
    ${row("Moved to savings", m.saved, m.saved < 0 ? "+ " : "− ")}
    ${row("Bills & debt still due", m.billsDue, "− ")}
    ${row("Savings transfers planned", m.fundsDue, "− ")}
    ${m.buffer ? row("Safety buffer", m.buffer, "− ") : ""}
    <span class="tot">Safe to spend</span><b class="tot m ${m.safe < 0 ? "neg" : "pos"}">${money(m.safe)}</b>
  </div>`;
}
function spendingDonut(txs) {
  const totals = {};
  for (const t of txs.filter((t) => t.type === "expense")) totals[t.catId] = (totals[t.catId] || 0) + t.amount;
  const rows = Object.entries(totals).map(([id, v]) => ({ cat: catById(id), value: v })).sort((a, b) => b.value - a.value);
  if (!rows.length) return empty("🍃", "No spending yet", "Once you track a spend, you'll see where your money goes.");
  const top = rows.slice(0, 6), rest = rows.slice(6);
  const segs = top.map((r) => ({ value: r.value, color: catColor(r.cat), label: r.cat?.name || "Other", emoji: r.cat?.emoji || "•" }));
  if (rest.length) segs.push({ value: sum(rest, (r) => r.value), color: "var(--ink-3)", label: "Everything else", emoji: "…" });
  const total = sum(segs, (x) => x.value);
  return `<div class="donut-wrap">${donut(segs)}<div class="donut-legend">${segs.map((s) => `<div><i class="dot" style="background:${s.color}"></i>${esc(s.emoji)} ${esc(s.label)}<b>${moneyHTML(s.value)}</b><span class="tiny pct-col">${pct(s.value, total)}%</span></div>`).join("")}</div></div>`;
}

/* ---------- Today ---------- */
function viewToday() {
  const t = todaySummary();
  const st = streak();
  const checked = !!S.checkins[t.today];
  const mood = S.moods[t.today];
  const nextWeek = scheduleIn(t.today, addDays(t.today, 7));
  const freq = frequentSpends();
  const tasks = tinyTasks(t);
  const ringP = t.allowance > 0 ? t.variableToday / t.allowance : t.variableToday > 0 ? 1 : 0;
  const wd = [];
  for (let i = 6; i >= 0; i--) wd.push(addDays(t.today, -i));
  return `
  ${pageHead(`${fmtLong(t.today).split(",")[0]}, ${fmtDay(t.today)}`, "A quick glance for right now: what you can spend, what's coming, one tiny task.")}
  <div class="grid g-hero">
    <div class="card today-hero">
      <div class="row between wrap" style="align-items:flex-start">
        <div class="grow" style="min-width:220px">
          <div class="muted">You can spend today</div>
          <div class="value ${t.leftToday < 0 ? "neg" : ""}">${moneyHTML(t.leftToday)}</div>
          <div class="sub">${money(t.allowance)} a day for the next ${plural(t.daysLeft, "day")} · ${money(t.safe)} safe to spend this month</div>
        </div>
        ${ring(ringP, { size: 112, stroke: 11, label: `${pct(t.variableToday, t.allowance || 1)}%`, sub: "of today used", color: ringP > 1 ? "var(--bad)" : "var(--accent)" })}
      </div>
      <div class="row wrap mt">
        <button class="btn primary" data-action="quick-add">${icon("plus")}Track spending</button>
        ${t.variableToday === 0 ? `<button class="btn" data-action="toggle-nospend" data-date="${t.today}">${S.noSpend[t.today] ? "✓ No-spend day" : "🧘 Mark no-spend day"}</button>` : ""}
      </div>
    </div>
    <div class="card">
      <div class="streak"><span class="flame">${st > 0 ? "🔥" : "🌱"}</span><div><h2>${plural(st, "day")} streak</h2><p class="tiny">Check in daily — even 10 seconds counts.</p></div></div>
      <div class="week-dots mt">${wd.map((d) => `<span class="${S.checkins[d] ? "on" : ""} ${d === t.today ? "today" : ""}" title="${fmtDay(d)}">${DOW[fromISO(d).getDay()][0]}</span>`).join("")}</div>
      <button class="btn block mt ${checked ? "" : "primary"}" data-action="checkin" ${checked ? "disabled" : ""}>${checked ? "✓ Checked in today" : "I looked at my money today"}</button>
      <div class="mt"><div class="tiny">How do you feel about money today?</div>
        <div class="mood mt-s">${["😣", "😟", "😐", "🙂", "🤩"].map((e) => `<button class="${mood === e ? "on" : ""}" data-action="mood" data-mood="${e}" aria-label="Mood ${e}">${e}</button>`).join("")}</div>
      </div>
    </div>
  </div>

  ${tasks.length ? `<div class="card mt"><div class="card-head"><h2>✨ Tiny tasks</h2><span class="tiny">One at a time is plenty</span></div><div class="stack" style="gap:8px">${tasks.join("")}</div></div>` : ""}

  ${freq.length ? `<div class="card mt"><div class="card-head"><h3>${icon("repeat", 18)} One-tap repeat</h3><span class="tiny">Your usual spends</span></div>
    <div class="chips">${freq.map((f, i) => { const c = catById(f.catId); return `<button class="chip" data-action="repeat-spend" data-i="${i}">${esc(c?.emoji || "")} ${esc(f.name)} · <b class="m">${money(f.amount)}</b></button>`; }).join("")}</div></div>` : ""}

  <div class="grid g2 mt">
    <div class="card"><div class="card-head"><h2>Spent today</h2><b>${moneyHTML(sum(t.todays.filter((x) => x.type === "expense"), (x) => x.amount))}</b></div>
      ${t.todays.length ? `<div class="list">${t.todays.map((x) => txRow(x)).join("")}</div>` : empty("🌿", "Nothing tracked today", "Tap Track spending (or press N) the moment you buy something.")}
    </div>
    <div class="card"><div class="card-head"><h2>Next 7 days</h2><button class="btn sm" data-action="go" data-view="calendar">Calendar</button></div>
      ${nextWeek.length ? `<div class="list">${nextWeek.map((o) => schedRow(o)).join("")}</div>` : empty("☀️", "A quiet week", "No bills or paydays in the next 7 days.")}
    </div>
  </div>

  <div class="card mt focus-hide">
    <div class="card-head"><h3>🧠 Money brain dump</h3><span class="tiny">Saved automatically</span></div>
    <textarea class="input" data-input="notes" placeholder="Cancel that free trial, ask about the refund, check the gas bill…">${esc(S.notes)}</textarea>
  </div>`;
}
function tinyTasks(t) {
  const out = [];
  const nudge = (e, html, action = "") => `<div class="nudge"><span class="e">${e}</span><div class="grow">${html}</div>${action}</div>`;
  const overdue = t.sched.filter((o) => !o.done && o.date < t.today);
  for (const o of overdue.slice(0, 3)) {
    const q = o.kind === "income" ? `Did your <b>${esc(o.name)}</b> arrive on ${fmtDay(o.date)}?` : `Did <b>${esc(o.name)}</b> get paid on ${fmtDay(o.date)}?`;
    out.push(nudge(o.kind === "income" ? "💸" : "🧾", `${q} <span class="tiny">${money(o.amount)}</span>`, `<button class="btn sm" data-action="toggle-occ" data-key="${esc(o.key)}">Yes, check it off</button>`));
  }
  const ready = S.wishlist.filter((w) => !w.decision && Date.now() >= w.readyAt);
  if (ready.length) out.push(nudge("⏸️", `<b>${esc(ready[0].name)}</b> finished its pause. Still want it?`, `<a class="btn sm" href="#impulse">Decide</a>`));
  const steps = setupSteps();
  const done = steps.filter((s) => s.done).length;
  if (done < steps.length) out.push(nudge("🧭", `Finish setting up — <b>${done} of ${steps.length}</b> done. Next: ${esc(steps.find((s) => !s.done).label)}.`, `<a class="btn sm" href="#setup">Continue</a>`));
  const lb = S.settings.lastBackup;
  if (!IS_DEMO && S.transactions.length > 15 && (!lb || diffDays(lb, t.today) > 30)) out.push(nudge("💾", "Your data lives in this browser. Save a backup file — it takes 2 seconds.", `<button class="btn sm" data-action="export-json">Back up</button>`));
  return out.slice(0, 5);
}

/* ---------- Calendar ---------- */
function viewCalendar() {
  const mk = ui.calMonth;
  const ws = S.profile.weekStart || 0;
  const first = fromISO(monthStart(mk));
  const lead = (first.getDay() - ws + 7) % 7;
  const start = addDays(monthStart(mk), -lead);
  const cells = Math.ceil((lead + daysInMonth(first.getFullYear(), first.getMonth())) / 7) * 7;
  const end = addDays(start, cells - 1);
  const sched = scheduleIn(start, end);
  const txs = txInRange(start, end);
  const today = todayISO();
  let grid = "";
  for (let i = 0; i < 7; i++) grid += `<div class="dow">${DOW[(i + ws) % 7]}</div>`;
  for (let i = 0; i < cells; i++) {
    const d = addDays(start, i);
    const ev = sched.filter((o) => o.date === d);
    const spent = sum(txs.filter((t) => t.date === d && t.type === "expense" && !t.link), (t) => t.amount);
    grid += `<button class="day ${monthKey(d) !== mk ? "out" : ""} ${d === today ? "today" : ""} ${d === ui.calSel ? "sel" : ""} ${S.noSpend[d] ? "nospend" : ""}" data-action="cal-day" data-date="${d}" aria-label="${fmtLong(d)}">
      <span class="num"><span>${Number(d.slice(8))}</span>${S.noSpend[d] ? "<span title='No-spend day'>🧘</span>" : ""}</span>
      ${ev.slice(0, 3).map((o) => `<span class="ev ${o.kind === "income" ? "inc" : o.kind} ${o.done ? "paid" : ""}" title="${esc(`${o.name} · ${money(o.amount)}`)}"><b>${esc(o.emoji || "")} ${esc(o.name)}</b><i class="m">${money(o.amount)}</i></span>`).join("")}
      ${ev.length > 3 ? `<span class="tiny">+${ev.length - 3} more</span>` : ""}
      ${spent ? `<span class="spent m">−${money(spent)}</span>` : ""}
    </button>`;
  }
  const sel = ui.calSel;
  const selEv = scheduleIn(sel, sel);
  const selTx = S.transactions.filter((t) => t.date === sel);
  const from = mk === monthKey(today) ? today : monthStart(mk);
  const due = scheduleIn(from, monthEnd(mk)).filter((o) => o.kind !== "income" && !o.done);
  const fl = SKIN.flourish ? `<span class="flourish sm">${SKIN.flourish}</span>` : "";
  return `
  ${pageHead("Calendar", `${monthLabel(mk)} · tap any day to see what's due, check things off, or add something.`, `<button class="btn" data-action="cal-month" data-mk="${addMonths(mk, -1)}" aria-label="Previous month">${icon("chevL")}</button><button class="btn" data-action="cal-month" data-mk="${monthKey(today)}">Today</button><button class="btn" data-action="cal-month" data-mk="${addMonths(mk, 1)}" aria-label="Next month">${icon("chevR")}</button><button class="btn primary" data-action="add-bill" data-date="${sel}">${icon("plus")}Add a reminder</button>`)}
  <div class="grid g-side">
    <div class="card">
      <div class="card-head"><h2>${monthLabel(mk)}</h2>
        <div class="cal-legend"><span><i class="dot good"></i>Payday</span><span><i class="dot"></i>Bill</span><span><i class="dot warn"></i>Debt</span><span><i class="dot info"></i>Savings</span></div></div>
      <div class="cal">${grid}</div>
    </div>
    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>${fmtLong(sel)}</h3></div>
        ${selEv.length ? `<div class="list">${selEv.map((o) => schedRow(o, { showDate: false })).join("")}</div>` : `<p class="tiny">Nothing scheduled.</p>`}
        ${selTx.filter((t) => !t.link).length ? `<div class="day-group">Tracked</div><div class="list">${selTx.filter((t) => !t.link).map((t) => txRow(t)).join("")}</div>` : ""}
        <div class="row wrap mt">
          <button class="btn sm primary" data-action="quick-add" data-date="${sel}">${icon("plus")}Spend</button>
          <button class="btn sm" data-action="add-bill" data-date="${sel}">${icon("receipt")}Bill</button>
          <button class="btn sm" data-action="add-income" data-date="${sel}">${icon("wallet")}Payday</button>
          ${sel <= today ? `<button class="btn sm" data-action="toggle-nospend" data-date="${sel}">${S.noSpend[sel] ? "✓ No-spend" : "🧘 No-spend"}</button>` : ""}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Coming up${fl}</h2></div>
        ${due.length ? `<div class="list">${due.slice(0, 6).map((o) => `<div class="li"><span class="emoji-badge" style="${o.kind === "fund" ? catVars(150) : ""}">${esc(o.emoji || "🧾")}</span><div class="name"><b>${esc(o.name)}</b><small>${fmtLong(o.date)}</small></div><div class="amt">${moneyHTML(o.amount)}</div></div>`).join("")}</div>${due.length > 6 ? `<p class="tiny mt-s">+ ${due.length - 6} more this month</p>` : ""}` : `<p class="tiny">Everything for ${monthName(mk)} is checked off. 🎉</p>`}
        <div class="due-total mt"><div><div class="tiny">Total still to pay in ${monthName(mk)}</div><div class="value m">${money(sum(due, (o) => o.amount))}</div></div><span class="kpi-ic acc">${icon("receipt")}</span></div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Legend${fl}</h2></div>
        <div class="legend-list">
          <div><i class="dot good"></i><div><b>Income</b><span>Paychecks, bonuses, side income</span></div></div>
          <div><i class="dot"></i><div><b>Bills</b><span>Rent, internet, subscriptions…</span></div></div>
          <div><i class="dot warn"></i><div><b>Debt</b><span>Minimum payments</span></div></div>
          <div><i class="dot info"></i><div><b>Savings</b><span>Transfers to your funds</span></div></div>
          <div><span>🧘</span><div><b>No-spend day</b><span>Nothing spent beyond plans</span></div></div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- Paycheck plan ---------- */
function viewPaycheck() {
  const windows = paycheckPlan(4);
  const today = todayISO();
  const monthlyIncome = sum(S.incomes, (i) => perMonth(i.amount, i.freq));
  const next = windows.find((w) => w.date >= today) || windows[0];
  const splitBase = next ? next.amount : monthlyIncome;
  return `
  ${pageHead("Paycheck plan", "Budget one paycheck at a time: see exactly which bills each paycheck covers — and what's left to live on.", `<button class="btn primary" data-action="add-income">${icon("plus")}Add income</button>`)}
  <div class="grid g-side">
    <div class="stack">
      ${windows.length ? windows.map((w) => paycheckCard(w, today)).join("") : S.incomes.length ? `<div class="card">${empty("🔁", "Make your paycheck repeat", "Paycheck windows need a recurring income (weekly, every 2 weeks, twice a month or monthly). Edit your income and pick how often it arrives.")}</div>` : `<div class="card">${empty("💸", "Add your paycheck to start", "Tell the planner how much you get paid and how often. It'll line up every bill with the paycheck that pays it.", `<button class="btn primary" data-action="add-income">Add my paycheck</button>`)}</div>`}
    </div>
    <div class="stack">
      <div class="card">
        <div class="card-head"><h3>Income sources</h3><span class="tiny">≈ ${money(monthlyIncome)}/month</span></div>
        ${S.incomes.length ? `<div class="list">${S.incomes.map((i) => `<div class="li"><span class="emoji-badge" style="${catVars(150)}">${esc(i.emoji || "💰")}</span><div class="name">${esc(i.name)}<small>${FREQS[i.freq]} · next ${relDay(occurrences(i.freq, i.anchor, today, addDays(today, 400), i.endDate)[0] || i.anchor)}</small></div><div class="amt pos">${moneyHTML(i.amount)}</div><button class="btn ghost icon-btn" data-action="edit-income" data-id="${i.id}" aria-label="Edit">${icon("edit")}</button></div>`).join("")}</div>` : `<p class="tiny">No income yet.</p>`}
      </div>
      <div class="card">
        <h3>50 / 30 / 20 helper</h3>
        <p class="tiny mt-s">A simple starting split for ${next ? "your next paycheck" : "your monthly income"} of ${money(splitBase)}.</p>
        <div class="stack mt" style="gap:10px">
          ${[["Needs", 50, "Rent, bills, groceries"], ["Wants", 30, "Fun, eating out, hobbies"], ["Savings & debt", 20, "Future you"]].map(([l, p, h]) => `<div><div class="row between"><b>${l} · ${p}%</b><b class="m">${money((splitBase * p) / 100)}</b></div><div class="tiny">${h}</div><div class="mt-s">${progressBar(p, 100)}</div></div>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
}
function paycheckCard(w, today) {
  const isNow = w.date <= today && w.end >= today;
  const perDay = w.left / w.days;
  return `<div class="card ${isNow ? "" : "flat"}" style="${isNow ? "border-color:var(--accent)" : ""}">
    <div class="card-head">
      <div><div class="row wrap">${isNow ? `<span class="pill acc">Current paycheck</span>` : w.date > today ? `<span class="pill muted">Upcoming</span>` : ""}<span class="tiny">${fmtLong(w.date)} → ${fmtDay(w.end)} · ${plural(w.days, "day")}</span></div>
      <h2 class="mt-s">${esc(w.items[0].name)} ${moneyHTML(w.items[0].amount)}</h2>
      ${w.extra.length ? `<div class="tiny mt-s">+ ${w.extra.map((o) => `${esc(o.name)} ${money(o.amount)} (${fmtDay(o.date)})`).join(", ")}</div>` : ""}</div>
      <div style="text-align:right"><div class="tiny">Left after bills</div><div style="font-family:var(--font-head);font-size:1.6rem;font-weight:600" class="${w.left < 0 ? "neg" : "pos"}">${moneyHTML(w.left)}</div><div class="tiny">≈ ${money(Math.max(0, perDay))}/day</div></div>
    </div>
    ${progressBar(w.dueTotal, w.amount, "", true)}
    <div class="tiny mt-s">${money(w.dueTotal)} of this paycheck is already spoken for (${pct(w.dueTotal, w.amount)}%).</div>
    ${w.left < 0 ? `<div class="banner mt" style="margin-bottom:0"><span>⚠️ This paycheck is short by <b>${money(-w.left)}</b>. Try moving a bill's due date, using your buffer, or pulling from savings.</span></div>` : ""}
    ${w.due.length ? `<div class="list mt">${w.due.map((o) => schedRow(o)).join("")}</div>` : `<p class="tiny mt">No bills due from this paycheck — it's all yours to plan.</p>`}
  </div>`;
}

/* ---------- Transactions ---------- */
function viewTransactions() {
  const mk = ui.month;
  const txs = txInMonth(mk);
  const out = txs.filter((t) => t.type === "expense");
  const catOut = out.filter((t) => S.categories.some((c) => c.id === t.catId));
  const spentCats = sum(catOut, (t) => t.amount);
  const debtPaid = sum(out.filter((t) => t.catId === "debt"), (t) => t.amount);
  const budget = sum(S.categories, (c) => catAvailable(c, mk));
  const left = budget - spentCats;
  const used = {};
  for (const t of out) used[t.catId] = (used[t.catId] || 0) + t.amount;
  const chips = Object.entries(used).sort((a, b) => b[1] - a[1]).map(([id]) => catById(id)).filter(Boolean);
  return `
  ${pageHead("My spending", "A clear view of every dollar, month by month.", `
    <button class="btn" data-action="import-csv">${icon("upload")}Import</button>
    <button class="btn" data-action="export-csv">${icon("download")}Export</button>
    <button class="btn primary" data-action="quick-add">${icon("plus")}Add</button>`, { month: mk })}
  ${monthsBar(mk)}
  <div class="grid g3">
    <div class="card kpi"><span class="kpi-ic warn">${icon("wallet")}</span><div class="label">Spent</div><div class="value">${moneyHTML(spentCats)}</div><div class="tiny">${pct(spentCats, budget)}% of budget${debtPaid ? ` · + ${money(debtPaid)} debt payments` : ""}</div><div class="mt-s">${progressBar(spentCats, budget, catVars(14))}</div></div>
    <div class="card kpi"><span class="kpi-ic acc">${icon("target")}</span><div class="label">Budget</div><div class="value">${moneyHTML(budget)}</div><div class="tiny">for ${monthName(mk)} · ${plural(out.length, "spend")}</div><div class="mt-s">${progressBar(0, 1)}</div></div>
    <div class="card kpi"><span class="kpi-ic good">${icon("leaf")}</span><div class="label">Left</div><div class="value ${left < 0 ? "neg" : ""}">${moneyHTML(left)}</div><div class="tiny">${budget > 0 ? `${pct(Math.max(0, left), budget)}% left` : "Set a budget to see this"}</div><div class="mt-s">${progressBar(Math.max(0, left), budget, catVars(150))}</div></div>
  </div>
  <div class="grid g-side mt">
    <div class="card">
      <div class="row wrap" style="margin-bottom:12px">
        <div class="grow search-box"><input class="input" id="tx-search" placeholder="Search a spend (shop, category, note…)  /" value="${esc(ui.txQuery)}"><span>${icon("search", 18)}</span></div>
        <div class="seg">${[["all", "All"], ["expense", "Spending"], ["income", "Income"], ["saving", "Savings"]].map(([v, l]) => `<button class="${ui.txType === v ? "on" : ""}" data-action="tx-type" data-v="${v}">${l}</button>`).join("")}</div>
      </div>
      ${chips.length ? `<div class="chips chip-scroll" style="margin-bottom:10px"><button class="chip ${!ui.txCat ? "on" : ""}" data-action="tx-cat" data-v="">All</button>${chips.map((c) => `<button class="chip ${ui.txCat === c.id ? "on" : ""}" data-action="tx-cat" data-v="${c.id}">${esc(c.emoji)} ${esc(c.name)}</button>`).join("")}</div>` : ""}
      <div class="tx-head">${[["date", "Date"], ["name", "Description"], ["cat", "Category"], ["amount", "Amount"]].map(([k, l]) => `<button class="${k === "amount" ? "r" : ""} ${ui.txSort.k === k ? "on" : ""}" data-action="tx-sort" data-k="${k}">${l} ${icon(ui.txSort.k === k ? (ui.txSort.dir < 0 ? "chevDown" : "arrowUp") : "sort", 13)}</button>`).join("")}<span></span></div>
      <div id="tx-list">${txListHTML()}</div>
    </div>
    <div class="card"><div class="card-head"><h2>Spending by category</h2></div>${spendingDonut(txs)}</div>
  </div>`;
}
function txListHTML() {
  const q = ui.txQuery.trim().toLowerCase();
  const { k, dir } = ui.txSort;
  const keyOf = { date: (t) => t.date + String(t.createdAt).padStart(15, "0"), name: (t) => (t.name || "").toLowerCase(), cat: (t) => (catById(t.catId)?.name || "~").toLowerCase(), amount: (t) => (t.type === "expense" ? 1 : -1) * t.amount };
  const txs = txInMonth(ui.month)
    .filter((t) => ui.txType === "all" || t.type === ui.txType)
    .filter((t) => !ui.txCat || t.catId === ui.txCat)
    .filter((t) => !q || `${t.name} ${t.note} ${catById(t.catId)?.name || ""}`.toLowerCase().includes(q))
    .sort((a, b) => { const x = keyOf[k](a), y = keyOf[k](b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
  if (!txs.length) return empty("🔎", q || ui.txCat || ui.txType !== "all" ? "No matches" : "Nothing tracked this month", "Track a spend with the + button, or press N anywhere.");
  return `<div class="tx-table">${txs.map((t) => {
    const cat = catById(t.catId);
    const isIn = t.type === "income" || (t.type === "saving" && t.amount < 0);
    const amount = Math.abs(t.amount);
    return `<div class="tx-row" data-action="edit-tx" data-id="${t.id}" role="button" tabindex="0">
      <span class="c-date">${fmtDay(t.date)}</span>
      <span class="c-desc"><span class="emoji-badge" style="${catStyle(cat)}">${esc(cat?.emoji || "•")}</span><span class="grow" style="min-width:0"><b>${esc(t.name || cat?.name || "Untitled")}</b><small>${t.note ? esc(t.note) : t.link ? "Scheduled" : esc(cat?.name || "")}</small></span></span>
      <span class="c-cat">${catPill(cat)}</span>
      <span class="c-amt ${isIn ? "pos" : ""}">${isIn ? "+" : "−"}${moneyHTML(amount)}</span>
      <span class="c-more" aria-hidden="true">${icon("dots", 18)}</span>
    </div>`;
  }).join("")}</div>`;
}

/* ---------- Budget (envelopes) ---------- */
function viewBudget() {
  const mk = ui.month;
  const rows = S.categories.map((c) => ({ c, plan: catAvailable(c, mk), base: budgetFor(c, mk), spent: catSpent(c.id, mk) }));
  const planned = sum(rows, (r) => r.plan), spent = sum(rows, (r) => r.spent);
  const m = monthSummary(mk);
  const inc = m.income + m.expected;
  const groupSpend = (g) => sum(rows.filter((r) => r.c.group === g), (r) => r.spent);
  const savingsPart = Math.max(0, m.saved) + m.fundsDue + sum(m.txs.filter((t) => t.catId === "debt"), (t) => t.amount);
  const split = [["Needs", groupSpend("needs"), 50], ["Wants", groupSpend("wants"), 30], ["Savings & debt", savingsPart, 20]];
  let table = "";
  for (const g of ["needs", "wants"]) {
    const gr = rows.filter((r) => r.c.group === g);
    if (!gr.length) continue;
    table += `<tr class="group"><td colspan="2">${GROUPS[g].label} <span class="tiny">· ${GROUPS[g].hint}</span></td><td class="r m">${money(sum(gr, (r) => r.plan))}</td><td class="r m hide-m">${money(sum(gr, (r) => r.spent))}</td><td class="r m">${money(sum(gr, (r) => r.plan - r.spent))}</td></tr>`;
    for (const r of gr) {
      const left = r.plan - r.spent;
      table += `<tr>
        <td><div class="cat-cell"><span class="emoji-badge" style="${catStyle(r.c)}">${esc(r.c.emoji)}</span><button class="btn ghost sm" style="padding:4px 6px" data-action="edit-cat" data-id="${r.c.id}">${esc(r.c.name)}</button>${r.c.rollover ? `<span class="pill muted" title="Unspent money rolls into next month">↻</span>` : ""}</div></td>
        <td style="width:30%">${progressBar(r.spent, r.plan, catStyle(r.c))}</td>
        <td class="r"><input class="input inline m" type="number" step="1" min="0" value="${round2(r.base)}" data-input="cat-budget" data-id="${r.c.id}" aria-label="Budget for ${esc(r.c.name)}">${r.plan !== r.base ? `<div class="tiny">${money(r.plan)} with rollover</div>` : ""}</td>
        <td class="r m hide-m">${money(r.spent)}</td>
        <td class="r m ${left < 0 ? "neg" : ""}">${money(left)}</td></tr>`;
    }
  }
  return `
  ${pageHead("Monthly budget", "Give every dollar a job. Tap an amount to change it — the chart and safe-to-spend update instantly.", `
    <button class="btn" data-action="copy-budget">${icon("repeat")}Copy last month</button>
    <button class="btn primary" data-action="add-cat">${icon("plus")}Category</button>`, { month: mk })}
  ${monthsBar(mk)}
  <div class="grid g4">
    <div class="tile accent"><div class="label">Expected income</div><div class="value">${moneyHTML(inc)}</div></div>
    <div class="tile accent"><div class="label">Budgeted</div><div class="value">${moneyHTML(planned)}</div><div class="sub">${inc ? `${pct(planned, inc)}% of income` : ""}</div></div>
    <div class="tile accent"><div class="label">Spent</div><div class="value">${moneyHTML(spent)}</div><div class="sub">${pct(spent, planned)}% of budget</div></div>
    <div class="tile ${planned - spent < 0 ? "bad" : "good"}"><div class="label">Left in budget</div><div class="value">${moneyHTML(planned - spent)}</div></div>
  </div>
  ${inc && planned > inc ? `<div class="banner mt">⚠️ You've budgeted <b>${money(planned - inc)}</b> more than you expect to earn this month.</div>` : ""}
  <div class="grid g-side mt">
    <div class="card">
      <div class="card-head"><h2>Categories</h2>
        <div class="seg" title="When you change an amount, apply it to…"><button class="${ui.budgetScope === "all" ? "on" : ""}" data-action="budget-scope" data-v="all">Every month</button><button class="${ui.budgetScope === "month" ? "on" : ""}" data-action="budget-scope" data-v="month">Only ${monthName(mk)}</button></div></div>
      <div style="overflow-x:auto"><table class="env"><thead><tr><th>Category</th><th>Progress</th><th class="r">Budget</th><th class="r hide-m">Spent</th><th class="r">Left</th></tr></thead><tbody>${table}</tbody></table></div>
    </div>
    <div class="stack">
      <div class="card"><h3>Your real 50 / 30 / 20</h3><p class="tiny mt-s">How this month's money is actually splitting up.</p>
        <div class="stack mt" style="gap:12px">${split.map(([l, v, target]) => `<div><div class="row between"><b>${l}</b><span class="m">${money(v)} · <b>${pct(v, inc || 1)}%</b> <span class="tiny">/ ${target}%</span></span></div><div class="mt-s">${progressBar(pct(v, inc || 1), 100)}</div></div>`).join("")}</div>
      </div>
      <div class="card"><h3>Envelope tips</h3>
        <p class="tiny mt-s">↻ <b>Rollover</b>: turn it on for a category (tap its name) and unspent money carries into next month — perfect for gifts, car repairs or travel.</p>
        <p class="tiny mt-s">Bills you check off are counted in their category automatically.</p>
      </div>
    </div>
  </div>
  <div class="card mt"><div class="card-head"><h2>Budget vs. actuals — ${monthName(mk)}</h2></div>
    ${chartPlanVsActual(chartItems(rows, 14))}
  </div>`;
}

/* ---------- Bills & subscriptions ---------- */
function viewBills() {
  const today = todayISO();
  const nextOf = (b) => occurrences(b.freq, b.anchor, today, addDays(today, 400), b.endDate)[0];
  const bills = [...S.bills].sort(by((b) => nextOf(b) || "9999"));
  const subs = bills.filter((b) => b.isSub);
  const monthlyAll = sum(bills, (b) => perMonth(b.amount, b.freq));
  const monthlySubs = sum(subs, (b) => perMonth(b.amount, b.freq));
  const cancelSave = sum(subs.filter((b) => b.review === "cancel"), (b) => perMonth(b.amount, b.freq) * 12);
  const row = (b) => {
    const n = nextOf(b);
    const cat = catById(b.catId);
    return `<div class="li"><span class="emoji-badge" style="${catStyle(cat)}">${esc(b.emoji || cat?.emoji || "🧾")}</span>
      <div class="name">${esc(b.name)}<small>${FREQS[b.freq]}${b.autopay ? " · autopay" : ""}${cat ? " · " + esc(cat.name) : ""}</small></div>
      <div class="when" style="width:auto">${n ? `Next: ${relDay(n)}` : "Ended"}</div>
      <div class="amt">${moneyHTML(b.amount)}</div>
      <button class="btn ghost icon-btn" data-action="edit-bill" data-id="${b.id}" aria-label="Edit ${esc(b.name)}">${icon("edit")}</button></div>`;
  };
  return `
  ${pageHead("Bills & subscriptions", "Never miss a payment. Every bill shows up on your calendar and paycheck plan with a checkbox.", `<button class="btn primary" data-action="add-bill">${icon("plus")}Add bill</button>`)}
  <div class="grid g4">
    <div class="tile accent"><div class="label">Bills per month</div><div class="value">${moneyHTML(monthlyAll)}</div><div class="sub">${plural(bills.length, "bill")}</div></div>
    <div class="tile accent"><div class="label">Subscriptions / month</div><div class="value">${moneyHTML(monthlySubs)}</div><div class="sub">${plural(subs.length, "subscription")}</div></div>
    <div class="tile warn"><div class="label">Subscriptions / year</div><div class="value">${moneyHTML(monthlySubs * 12)}</div><div class="sub">That's the real cost 👀</div></div>
    <div class="tile good"><div class="label">Savings if you cancel</div><div class="value">${moneyHTML(cancelSave)}</div><div class="sub">per year, from your review</div></div>
  </div>
  <div class="grid g-side mt">
    <div class="card"><div class="card-head"><h2>All bills</h2></div>
      ${bills.length ? `<div class="list">${bills.map(row).join("")}</div>` : empty("🧾", "No bills yet", "Add rent, utilities, phone, insurance, subscriptions — anything that repeats.", `<button class="btn primary" data-action="add-bill">Add my first bill</button>`)}
    </div>
    <div class="card"><div class="card-head"><h2>Subscription audit</h2></div>
      <p class="tiny">Tap each one: do you still love it? Mark the ones to cancel and see what you'd save.</p>
      ${subs.length ? `<div class="list mt-s">${subs.map((b) => `<div class="li"><div class="name">${esc(b.emoji || "📺")} ${esc(b.name)}<small>${money(perMonth(b.amount, b.freq) * 12)}/year</small></div>
        <button class="pill ${b.review === "cancel" ? "bad" : b.review === "keep" ? "good" : "muted"}" data-action="sub-review" data-id="${b.id}">${b.review === "cancel" ? "Cancel it" : b.review === "keep" ? "Keep ♥" : "Review"}</button></div>`).join("")}</div>` : `<p class="tiny mt">Tick “This is a subscription” when adding a bill to audit it here.</p>`}
    </div>
  </div>`;
}

/* ---------- Savings ---------- */
function viewSavings() {
  const ft = fundTotals();
  const today = todayISO();
  const cur = monthKey(today);
  const monthly = sum(S.funds, (f) => perMonth(f.monthly || 0, f.freq || "monthly"));
  const fundIds = new Set(S.funds.map((f) => f.id));
  const savTx = S.transactions.filter((t) => t.effect?.fundId && fundIds.has(t.effect.fundId));
  const months = [5, 4, 3, 2, 1, 0].map((i) => addMonths(cur, -i));
  const rhythm = months.map((mk) => Math.max(0, ft.saved - sum(savTx.filter((t) => t.date > monthEnd(mk)), (t) => t.amount)));
  const p = ft.target > 0 ? ft.saved / ft.target : 0;
  const card = (f) => {
    const fp = f.target > 0 ? f.saved / f.target : 0;
    const style = catStyle({ hue: f.hue ?? 205 });
    const next = f.monthly > 0 ? scheduleIn(today, addDays(today, 120)).find((o) => o.kind === "fund" && o.refId === f.id && !o.done) : null;
    let needed = "";
    if (f.targetDate && f.target > f.saved) {
      const mLeft = Math.max(1, monthsBetween(cur, monthKey(f.targetDate)));
      needed = `Save <b>${money((f.target - f.saved) / mLeft)}</b>/month to reach it by ${MONTHS_S[fromISO(f.targetDate).getMonth()]} ${f.targetDate.slice(0, 4)}.`;
    } else if (f.monthly > 0 && f.target > f.saved) {
      const mLeft = Math.ceil((f.target - f.saved) / perMonth(f.monthly, f.freq || "monthly"));
      needed = `At this pace you'll get there around <b>${monthLabel(addMonths(cur, mLeft))}</b>.`;
    } else if (fp >= 1) needed = "Fully funded — amazing work! 🦋";
    return `<div class="card fund" style="${style}">
      <div class="fund-top"><span class="big-emoji">${esc(f.emoji || "🐷")}</span><div class="grow"><h3>${esc(f.name)}</h3><div class="tiny">${f.targetDate ? `By ${fmtDay(f.targetDate)} ${f.targetDate.slice(0, 4)}` : "No deadline"}</div></div>
        <button class="btn ghost icon-btn" data-action="edit-fund" data-id="${f.id}" aria-label="Edit ${esc(f.name)}">${icon("dots")}</button></div>
      <div class="row between" style="align-items:baseline"><div><span class="fund-amt">${moneyHTML(f.saved)}</span> <span class="tiny">of ${money(f.target)}</span></div><b style="color:var(--c-ink)">${Math.round(fp * 100)}%</b></div>
      ${progressBar(f.saved, f.target, style, true)}
      <div class="next-box"><span class="e">🐷</span><div>${next ? `<div class="tiny">Next contribution</div><b class="m">${money(next.amount)}</b><div class="tiny">${fmtLong(next.date)}</div>` : `<div class="tiny">No automatic transfer yet</div><button class="btn sm ghost" data-action="edit-fund" data-id="${f.id}" style="padding-left:0">Set one up →</button>`}</div></div>
      ${needed ? `<p class="tiny">${needed}</p>` : ""}
      <button class="btn primary block" data-action="fund-money" data-id="${f.id}" data-mode="add">${icon("plus")}Add a contribution</button>
      <button class="btn ghost sm" data-action="fund-money" data-id="${f.id}" data-mode="withdraw">Withdraw</button>
    </div>`;
  };
  return `
  ${pageHead("My savings goals", "Plans that help tomorrow grow. Each fund has its own progress and plan.", `<button class="btn primary" data-action="add-fund">${icon("plus")}New goal</button>`)}
  <div class="card savings-hero">
    <div class="sh-total"><div class="tiny" style="text-transform:uppercase;letter-spacing:.12em">Total saved</div><div class="sh-value">${moneyHTML(ft.saved, { noCents: true })} <span class="tiny">of ${money(ft.target)}</span></div>
      <div class="tiny">${money(monthly)} planned each month · ${money(Math.max(0, ft.target - ft.saved))} still to go</div></div>
    ${ring(p, { size: 120, stroke: 11, label: `<span class="big-pct" style="font-size:1.5rem">${Math.round(p * 100)}%</span>` })}
    <div class="sh-msg"><p class="serif-msg">${p >= 1 ? "Every goal is funded. Wow." : p >= 0.5 ? "Lovely plans are really taking shape!" : "Little by little, it all adds up."}</p></div>
    ${SKIN.sideArt ? `<div class="sh-art">${SKIN.sideArt}</div>` : ""}
  </div>
  <div class="grid g3 mt">${S.funds.length ? S.funds.map(card).join("") : `<div class="card" style="grid-column:1/-1">${empty("🐷", "Start your first savings goal", "Even $10 a paycheck adds up. An emergency fund is a great first one.", `<button class="btn primary" data-action="add-fund">Create a goal</button>`)}</div>`}</div>
  ${S.funds.length ? `<div class="card mt"><div class="card-head"><div><h2>My savings rhythm</h2><p class="tiny">A steady climb toward your goals — the last 6 months.</p></div></div>
    ${chartLine([{ values: rhythm }], (i) => MONTHS_S[Number(months[i].slice(5)) - 1], { height: 300, width: 1000, points: true, aria: "Total saved at the end of each month" })}</div>` : ""}`;
}

/* ---------- Debt ---------- */
function viewDebt() {
  const dt = debtTotals();
  const card = (d) => {
    const paid = Math.max(0, (d.original || d.balance) - d.balance);
    const orig = d.original || d.balance;
    return `<div class="card">
      <div class="fund-top"><span class="big-emoji" style="${catVars(30)}">${d.balance <= 0 ? "🕊️" : "💳"}</span><div class="grow"><h3>${esc(d.name)}</h3><div class="tiny">${d.apr}% APR · ${money(d.minimum)} minimum · due on the ${ordinal(Number((d.anchor || "").slice(8)) || 1)}</div></div>
        <div style="text-align:right"><div style="font-family:var(--font-head);font-size:1.45rem;font-weight:600">${moneyHTML(d.balance)}</div><div class="tiny">left to pay</div></div></div>
      <div class="mt">${progressBar(paid, orig, catVars(150), true)}</div>
      <div class="row between mt-s"><span class="tiny">${money(paid)} paid off · ${pct(paid, orig)}%</span>
        <div class="row"><button class="btn sm" data-action="debt-pay" data-id="${d.id}">${icon("plus")}Extra payment</button><button class="btn sm ghost" data-action="edit-debt" data-id="${d.id}">${icon("edit")}</button></div></div>
    </div>`;
  };
  return `
  ${pageHead("Debt payoff", "List what you owe, pick a strategy, and see your debt-free date. Every minimum payment lands on your calendar.", `<button class="btn primary" data-action="add-debt">${icon("plus")}Add debt</button>`)}
  ${S.debts.length ? `
  <div class="grid g4">
    <div class="tile accent"><div class="label">Still owed</div><div class="value">${moneyHTML(dt.owed)}</div></div>
    <div class="tile accent"><div class="label">Minimums / month</div><div class="value">${moneyHTML(dt.minimums)}</div></div>
    <div id="debt-kpis" style="display:contents">${debtKpis()}</div>
  </div>
  <div class="grid g-side mt">
    <div class="stack">${S.debts.map(card).join("")}</div>
    <div class="card" id="debt-planner">${debtPlanner()}</div>
  </div>` : `<div class="card">${empty("🕊️", "No debts — or not added yet", "Add credit cards, loans or buy-now-pay-later plans. We'll build your payoff plan and debt-free date.", `<button class="btn primary" data-action="add-debt">Add a debt</button>`)}</div>`}`;
}
const ordinal = (n) => n + (["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || "th");
function debtKpis() {
  const r = simulateDebts(ui.debtStrategy, ui.debtExtra);
  return `<div class="tile good"><div class="label">Debt-free date</div><div class="value">${r.ok ? `${MONTHS_S[fromISO(monthStart(addMonths(monthKey(todayISO()), r.months))).getMonth()]} ${addMonths(monthKey(todayISO()), r.months).slice(0, 4)}` : "—"}</div><div class="sub">${r.ok ? `${plural(r.months, "month")} away` : "Minimums don't cover interest"}</div></div>
    <div class="tile warn"><div class="label">Interest you'll pay</div><div class="value">${moneyHTML(r.interest)}</div><div class="sub">with your current plan</div></div>`;
}
function debtPlanner() {
  const r = simulateDebts(ui.debtStrategy, ui.debtExtra);
  const other = simulateDebts(ui.debtStrategy === "avalanche" ? "snowball" : "avalanche", ui.debtExtra);
  const base = simulateDebts(ui.debtStrategy, 0);
  const cur = monthKey(todayISO());
  const diff = other.interest - r.interest;
  return `<div class="card-head"><h2>Payoff planner</h2></div>
    <div class="seg"><button class="${ui.debtStrategy === "avalanche" ? "on" : ""}" data-action="debt-strategy" data-v="avalanche">🏔️ Avalanche</button><button class="${ui.debtStrategy === "snowball" ? "on" : ""}" data-action="debt-strategy" data-v="snowball">⛄ Snowball</button></div>
    <p class="tiny mt-s">${ui.debtStrategy === "avalanche" ? "Highest interest first — saves the most money." : "Smallest balance first — quick wins that keep you motivated."}</p>
    <label class="field mt"><span>Extra each month: <b class="m">${money(ui.debtExtra)}</b></span><input type="range" min="0" max="1500" step="25" value="${ui.debtExtra}" data-input="debt-extra" aria-label="Extra monthly payment"></label>
    ${r.ok ? `<div class="formula mt">
      <span>Debt-free in</span><b>${plural(r.months, "month")}</b>
      <span>Total interest</span><b class="m">${money(r.interest)}</b>
      ${ui.debtExtra > 0 && base.ok ? `<span>Your extra saves</span><b class="m pos">${money(base.interest - r.interest)} · ${plural(base.months - r.months, "month")}</b>` : ""}
      <span>vs. ${ui.debtStrategy === "avalanche" ? "snowball" : "avalanche"}</span><b class="m ${diff >= 0 ? "pos" : "neg"}">${diff >= 0 ? "saves " : "costs "}${money(Math.abs(diff))}</b>
    </div>
    <div class="mt">${chartLine([{ values: r.series }, { values: base.series, cls: "alt" }], (i) => { const mk = addMonths(cur, i); return `${MONTHS_S[Number(mk.slice(5)) - 1]} ’${mk.slice(2, 4)}`; }, { height: 230, width: 420, aria: "Total debt balance over time" })}</div>
    <div class="legend"><span><i style="background:var(--accent)"></i>With extra</span><span><i style="background:var(--ink-3)"></i>Minimums only</span></div>
    <h3 class="mt">Payoff order</h3>
    <div class="timeline mt-s">${r.order.map((d, i) => `<div class="t" data-n="${i + 1}"><b>${esc(d.name)}</b> <span class="tiny">${d.apr}% · ${money(d.start)}</span><div class="tiny">Paid off ${d.month ? monthLabel(addMonths(cur, d.month)) : "—"}</div></div>`).join("")}</div>`
    : `<div class="banner mt">Your minimum payments don't cover the interest. Add an extra amount above to see a payoff date.</div>`}`;
}

/* ---------- Goals ---------- */
const GOAL_STATUS = { not: ["Not started", "muted"], progress: ["In progress", "acc"], done: ["Done ✓", "good"] };
function viewGoals() {
  const card = (g) => {
    const f = S.funds.find((x) => x.id === g.fundId);
    const steps = g.steps || [];
    const [label, cls] = GOAL_STATUS[g.status] || GOAL_STATUS.not;
    return `<div class="card">
      <div class="fund-top"><span class="big-emoji">${esc(g.emoji || "🎯")}</span><div class="grow"><h3>${esc(g.name)}</h3>${g.targetDate ? `<div class="tiny">Target: ${fmtDay(g.targetDate)} ${g.targetDate.slice(0, 4)}</div>` : ""}</div>
        <button class="pill ${cls}" data-action="goal-status" data-id="${g.id}" title="Tap to change">${label}</button></div>
      ${g.why ? `<p class="muted mt-s" style="font-style:italic">“${esc(g.why)}”</p>` : ""}
      ${f ? `<div class="mt"><div class="row between tiny"><span>${esc(f.emoji)} ${esc(f.name)}</span><span class="m">${money(f.saved)} / ${money(f.target)}</span></div><div class="mt-s">${progressBar(f.saved, f.target)}</div></div>` : ""}
      ${steps.length ? `<div class="steps">${steps.map((s, i) => `<label class="${s.done ? "done" : ""}"><input type="checkbox" ${s.done ? "checked" : ""} data-action="goal-step" data-id="${g.id}" data-i="${i}"><span>${esc(s.text)}</span></label>`).join("")}</div><div class="tiny mt-s">${steps.filter((s) => s.done).length} of ${steps.length} steps done</div>` : ""}
      <div class="row mt"><input class="input" placeholder="Add a tiny next step…" data-input="goal-step-add" data-id="${g.id}" style="padding:7px 10px"><button class="btn sm ghost" data-action="edit-goal" data-id="${g.id}">${icon("edit")}</button></div>
    </div>`;
  };
  const order = { progress: 0, not: 1, done: 2 };
  return `
  ${pageHead("Goals", "Turn big dreams into tiny steps. Tap a status pill to move a goal along.", `<button class="btn primary" data-action="add-goal">${icon("plus")}New goal</button>`)}
  <div class="grid g3">${[["not", "Not started"], ["progress", "In progress"], ["done", "Achieved"]].map(([k, l]) => `<div class="tile ${k === "done" ? "good" : "accent"}"><div class="label">${l}</div><div class="value">${S.goals.filter((g) => g.status === k).length}</div></div>`).join("")}</div>
  <div class="grid g2 mt">${S.goals.length ? [...S.goals].sort(by((g) => order[g.status] ?? 1)).map(card).join("") : `<div class="card" style="grid-column:1/-1">${empty("🌈", "What are you saving or working toward?", "A trip, being debt-free, a 3-month cushion… write it down and break it into steps.", `<button class="btn primary" data-action="add-goal">Add a goal</button>`)}</div>`}</div>`;
}

/* ---------- Impulse Pause ---------- */
function timeLeft(ms) {
  const h = Math.ceil(ms / 3600000);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h`;
  return `${Math.max(1, Math.ceil(ms / 60000))}m`;
}
function viewImpulse() {
  const now = Date.now();
  const waiting = S.wishlist.filter((w) => !w.decision).sort(by((w) => w.readyAt));
  const decided = S.wishlist.filter((w) => w.decision).sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0));
  return `
  ${pageHead("Impulse Pause", "Want something right now? Park it here. When the timer ends, decide with a calm brain — not a dopamine rush.")}
  <div class="grid g3">
    <div class="tile good big"><div class="label">Saved by pausing</div><div class="value">${moneyHTML(S.skippedTotal || 0)}</div><div class="sub">${plural(decided.filter((w) => w.decision === "skipped").length, "item")} skipped</div></div>
    <div class="tile accent"><div class="label">Waiting it out</div><div class="value">${waiting.length}</div><div class="sub">${money(sum(waiting, (w) => w.price))} on pause</div></div>
    <div class="tile accent"><div class="label">Bought after thinking</div><div class="value">${decided.filter((w) => w.decision === "bought").length}</div><div class="sub">no guilt — you decided on purpose</div></div>
  </div>
  <div class="grid g-side mt">
    <div class="stack">
      ${waiting.length ? waiting.map((w) => {
        const ready = now >= w.readyAt;
        return `<div class="card wish ${ready ? "ready" : ""}"><span class="big-emoji">${ready ? "⏰" : "⏳"}</span>
          <div class="grow"><h3>${esc(w.name)}</h3><div class="tiny">${money(w.price)}${/^https?:\/\//i.test(w.link || "") ? ` · <a href="${esc(w.link)}" target="_blank" rel="noopener noreferrer">link</a>` : ""} · paused ${relDay(toISO(new Date(w.addedAt))).toLowerCase()}</div>
            ${ready ? `<p class="mt-s"><b>Pause over.</b> Do you still want it as much?</p>` : `<div class="timer mt-s">Ready in ${timeLeft(w.readyAt - now)}</div>`}</div>
          <div class="stack" style="gap:6px">${ready ? `<button class="btn sm primary" data-action="wish-skip" data-id="${w.id}">Skip it 💎</button><button class="btn sm" data-action="wish-buy" data-id="${w.id}">Buy it</button>` : `<button class="btn sm" data-action="wish-skip" data-id="${w.id}">Skip now</button>`}<button class="btn sm ghost" data-action="wish-delete" data-id="${w.id}">Remove</button></div></div>`;
      }).join("") : `<div class="card">${empty("⏸️", "Nothing on pause", "Next time you're about to buy on a whim, add it here first. Most urges fade in 48 hours.")}</div>`}
      ${decided.length ? `<div class="card"><h3>History</h3><div class="list mt-s">${decided.slice(0, 12).map((w) => `<div class="li"><div class="name">${esc(w.name)}<small>${w.decision === "skipped" ? "Skipped" : "Bought"} · ${relDay(toISO(new Date(w.decidedAt || w.addedAt)))}</small></div><span class="pill ${w.decision === "skipped" ? "good" : "muted"}">${w.decision === "skipped" ? "+" + money(w.price) + " kept" : money(w.price)}</span></div>`).join("")}</div></div>` : ""}
    </div>
    <form class="card" data-form="wish">
      <h3>Pause a purchase</h3>
      <div class="stack mt" style="gap:12px">
        ${field("What do you want?", inp("name", "", 'required placeholder="e.g. New sneakers"'))}
        ${field("Price", moneyInp("price", "", "required"))}
        ${field("Link", inp("link", "", 'type="url" placeholder="Optional"'))}
        <div class="field"><span>Wait for</span><div class="seg">${[["24", "24h"], ["48", "48h"], ["72", "3 days"], ["168", "1 week"]].map(([v, l], i) => `<label style="cursor:pointer"><input type="radio" name="hours" value="${v}" ${i === 1 ? "checked" : ""} class="sr-only"><button type="button" class="${i === 1 ? "on" : ""}" data-action="seg-radio">${l}</button></label>`).join("")}</div></div>
        <button class="btn primary">${icon("pause")}Start the pause</button>
      </div>
    </form>
  </div>`;
}

/* ---------- Streaks & rewards ---------- */
function viewRewards() {
  const today = todayISO();
  const mk = monthKey(today);
  const st = streak();
  const nsMonth = Object.keys(S.noSpend).filter((d) => monthKey(d) === mk).length;
  const [y, m] = mk.split("-").map(Number);
  let ns = "";
  for (let d = 1; d <= daysInMonth(y, m - 1); d++) {
    const iso = `${mk}-${pad(d)}`;
    ns += `<button class="${S.noSpend[iso] ? "on" : ""} ${iso > today ? "future" : ""} ${iso === today ? "today" : ""}" ${iso > today ? "disabled" : `data-action="toggle-nospend" data-date="${iso}"`} aria-label="${fmtDay(iso)}">${d}</button>`;
  }
  const earned = BADGES.filter((b) => S.badges[b.id]).length;
  return `
  ${pageHead("Streaks & rewards", "Small wins deserve a celebration. Build the habit one check-in at a time.")}
  <div class="grid g3">
    <div class="tile accent big"><div class="label">Check-in streak</div><div class="value">🔥 ${st}</div><div class="sub">${st ? "Keep it going tomorrow!" : "Check in today to start one"}</div></div>
    <div class="tile good big"><div class="label">No-spend days in ${monthName(mk)}</div><div class="value">🧘 ${nsMonth}</div><div class="sub">${nsMonth >= 5 ? "Challenge complete! 🏆" : `${5 - nsMonth} more for the No-spend hero badge`}</div></div>
    <div class="tile info big"><div class="label">Badges earned</div><div class="value">🏅 ${earned}/${BADGES.length}</div></div>
  </div>
  <div class="grid g-side mt">
    <div class="card"><div class="card-head"><h2>Badges</h2></div>
      <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? "" : "locked"}"><div class="e">${b.e}</div><b>${esc(b.name)}</b><span>${esc(b.desc)}</span>${S.badges[b.id] ? `<div class="tiny mt-s">✓ ${fmtDay(S.badges[b.id])}</div>` : ""}</div>`).join("")}</div>
    </div>
    <div class="card"><div class="card-head"><h2>No-spend challenge</h2></div>
      <p class="tiny">Tap a day when you spent nothing beyond your planned bills. Aim for 5 this month.</p>
      <div class="mt">${progressBar(nsMonth, 5, catVars(150), true)}</div>
      <div class="ns-grid mt">${ns}</div>
    </div>
  </div>`;
}

/* ---------- Year in review ---------- */
function viewYear() {
  const yr = ui.year;
  const rows = MONTHS_S.map((label, i) => {
    const mk = `${yr}-${pad(i + 1)}`;
    const txs = txInMonth(mk);
    return { label, mk, inc: sum(txs.filter((t) => t.type === "income"), (t) => t.amount), spent: sum(txs.filter((t) => t.type === "expense"), (t) => t.amount), saved: sum(txs.filter((t) => t.type === "saving"), (t) => t.amount) };
  }).map((r) => ({ ...r, out: r.spent + r.saved }));
  const inc = sum(rows, (r) => r.inc), spent = sum(rows, (r) => r.spent), saved = sum(rows, (r) => r.saved);
  const yearTx = txInRange(`${yr}-01-01`, `${yr}-12-31`).filter((t) => t.type === "expense");
  const byCat = {};
  for (const t of yearTx) byCat[t.catId] = (byCat[t.catId] || 0) + t.amount;
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCat = top[0]?.[1] || 1;
  return `
  ${pageHead(`Year in review — ${yr}`, "Your income, spending and savings over time. Progress looks good on you.", `<button class="btn" data-action="year" data-v="${yr - 1}">${icon("chevL")}${yr - 1}</button><button class="btn" data-action="year" data-v="${yr + 1}">${yr + 1}${icon("chevR")}</button><button class="btn" data-action="print">${icon("printer")}Print</button>`)}
  <div class="grid g4">
    <div class="tile good"><div class="label">Total income</div><div class="value">${moneyHTML(inc)}</div></div>
    <div class="tile accent"><div class="label">Total spent</div><div class="value">${moneyHTML(spent)}</div></div>
    <div class="tile info"><div class="label">Moved to savings</div><div class="value">${moneyHTML(saved)}</div></div>
    <div class="tile accent"><div class="label">Savings rate</div><div class="value">${inc ? Math.round(((inc - spent) / inc) * 100) : 0}%</div><div class="sub">of income not spent</div></div>
  </div>
  <div class="card mt"><div class="card-head"><h2>Money in vs. money out</h2></div>${chartInOut(rows)}</div>
  <div class="grid g2 mt">
    <div class="card"><div class="card-head"><h2>Top categories</h2></div>
      ${top.length ? `<div class="stack" style="gap:10px">${top.map(([id, v]) => { const c = catById(id); return `<div><div class="row between"><span>${esc(c?.emoji || "")} ${esc(c?.name || "Other")}</span><b class="m">${money(v)}</b></div><div class="mt-s">${progressBar(v, maxCat, catStyle(c))}</div></div>`; }).join("")}</div>` : `<p class="tiny">No spending recorded in ${yr}.</p>`}
    </div>
    <div class="card"><div class="card-head"><h2>Month by month</h2></div>
      <div style="overflow-x:auto"><table class="env"><thead><tr><th>Month</th><th class="r">In</th><th class="r">Out</th><th class="r">Net</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><button class="btn ghost sm" data-action="open-month" data-mk="${r.mk}">${MONTHS_S[Number(r.mk.slice(5)) - 1]}</button></td><td class="r m">${money(r.inc)}</td><td class="r m">${money(r.out)}</td><td class="r m ${r.inc - r.out < 0 ? "neg" : "pos"}">${money(r.inc - r.out)}</td></tr>`).join("")}
      </tbody></table></div>
    </div>
  </div>`;
}

/* ---------- Getting started ---------- */
function viewSetup() {
  const steps = setupSteps();
  const done = steps.filter((s) => s.done).length;
  const guide = [
    ["Home", "Pick any month and see its whole picture — savings, debt, what's coming up, and your budget vs. actuals as a chart."],
    ["Today", "Your 10-second check-in: how much you can spend today, one tiny task, and your streak. Open this one daily."],
    ["Calendar", "Tap any day to add a bill, payday or spend. Recurring items repeat automatically. Check things off as they happen."],
    ["Paycheck plan", "Budget one paycheck at a time. See which bills each paycheck must cover and what's left per day."],
    ["Transactions", "Every spend in one searchable list. Import from your bank's CSV or export for your records."],
    ["Budget", "Set an amount per category. Turn on rollover to let unspent money carry into next month."],
    ["Bills & subscriptions", "All your repeating costs plus a subscription audit that shows the real yearly cost."],
    ["Savings & Debt", "Funds with progress rings, and a snowball/avalanche planner that shows your debt-free date."],
    ["Impulse Pause", "Park impulse buys behind a 24h–7 day timer. Skipped purchases add to your “saved by pausing” total."],
    ["Streaks & rewards", "Check-in streaks, a no-spend challenge and badges — small dopamine hits for good money habits."],
  ];
  return `
  ${pageHead("Getting started", "A quick tour of what's here — plus a checklist so you always know the next step.", `<button class="btn" data-action="load-sample">${icon("sparkle")}Load sample data</button>`)}
  <div class="grid g-side">
    <div class="stack">
      <div class="card">
        <div class="card-head"><h2>Your setup checklist</h2>${ring(done / steps.length, { size: 64, stroke: 7, label: `${done}/${steps.length}` })}</div>
        <div class="checklist">${steps.map((s, i) => `<a href="${s.href}" class="${s.done ? "done" : ""}"><span class="n">${s.done ? "✓" : i + 1}</span><div class="grow"><b>${esc(s.label)}</b><div class="tiny">${esc(s.hint)}</div></div>${icon("chevR", 18)}</a>`).join("")}</div>
      </div>
      <div class="card guide"><h2>How each section works</h2>${guide.map(([h, p]) => `<h3>${h}</h3><p>${p}</p>`).join("")}</div>
    </div>
    <div class="stack">
      <div class="card">
        <h3>Your currency</h3><p class="tiny mt-s">Every amount in the planner uses this.</p>
        <select class="input mt" data-input="currency">${CURRENCIES.map(([c, n]) => `<option value="${c}" ${S.profile.currency === c ? "selected" : ""}>${n} — ${c}</option>`).join("")}</select>
      </div>
      <div class="card"><h3>Made for busy brains</h3>
        <p class="tiny mt-s">✨ <b>Focus mode</b> hides everything but the essentials.</p>
        <p class="tiny mt-s">👁 <b>Privacy blur</b> hides amounts when someone's looking over your shoulder.</p>
        <p class="tiny mt-s">🔤 <b>Readable font</b> and <b>large text</b> in Settings.</p>
        <p class="tiny mt-s">🌙 <b>Night mode</b> and 8 colour themes — or pick your own colour.</p>
      </div>
      <div class="card"><h3>Keyboard shortcuts</h3>
        <div class="formula mt"><span>Track spending</span><span class="kbd">N</span><span>Search transactions</span><span class="kbd">/</span><span>Toggle night mode</span><span class="kbd">D</span><span>Privacy blur</span><span class="kbd">P</span><span>Close a window</span><span class="kbd">Esc</span></div>
      </div>
      <div class="card"><h3>Your data stays yours</h3><p class="tiny mt-s">Everything is saved privately in this browser on this device — no account, no cloud, no tracking. Use <b>Settings → Back up</b> to save a file you can restore anywhere.</p></div>
    </div>
  </div>`;
}

/* ---------- Settings ---------- */
function viewSettings() {
  const st = S.settings;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(st[key]) === String(v) ? "on" : ""}" data-action="set" data-key="${key}" data-v="${v}">${l}</button>`).join("")}</div>`;
  return `
  ${pageHead("Settings", "Make it look and feel like yours.")}
  <div class="grid g2">
    <div class="stack">
      <div class="card"><h2>Profile</h2>
        <div class="form-grid mt">
          ${field("Your name", `<input class="input" data-input="name" value="${esc(S.profile.name)}" placeholder="e.g. Alex">`)}
          ${field("Currency", `<select class="input" data-input="currency">${CURRENCIES.map(([c, n]) => `<option value="${c}" ${S.profile.currency === c ? "selected" : ""}>${c} — ${n}</option>`).join("")}</select>`)}
          ${field("Week starts on", `<select class="input" data-input="weekStart"><option value="1" ${S.profile.weekStart === 1 ? "selected" : ""}>Monday</option><option value="0" ${S.profile.weekStart === 0 ? "selected" : ""}>Sunday</option></select>`)}
          ${SKIN.balance ? field("How you get paid", `<button type="button" class="btn" data-action="pay-style">${icon("wallet")}${S.account.irregular ? "Irregular income" : "Regular paychecks"} · Change</button>`) : ""}
          ${field("Safety buffer", `<input class="input" type="number" min="0" step="10" data-input="buffer" value="${S.profile.buffer || 0}">`, "", "kept out of safe to spend")}
        </div>
      </div>
      <div class="card"><h2>Appearance</h2>
        <div class="stack mt" style="gap:16px">
          <div class="field"><span>Mode</span>${seg("theme", [["light", "☀️ Day"], ["dark", "🌙 Night"], ["auto", "Auto"]])}</div>
          <div class="field"><span>Colour theme</span><div class="swatches">${PALETTES.map((p) => `<button class="swatch ${st.palette === p.id ? "on" : ""}" data-action="palette" data-id="${p.id}" title="${p.name}" aria-label="${p.name}"><span style="background:linear-gradient(135deg,hsl(${p.h} ${p.s}% 60%),hsl(${p.h} ${p.s}% 88%))"></span></button>`).join("")}</div></div>
          <div class="field"><span>Or pick any colour</span><input type="range" class="hue-range" min="0" max="359" value="${st.h}" data-input="hue" aria-label="Accent hue"></div>
          <div class="field"><span>Colour strength</span><input type="range" min="0" max="85" value="${st.s}" data-input="sat" aria-label="Accent saturation"></div>
          <div class="field"><span>Font</span>${seg("font", [["elegant", "Elegant"], ["readable", "Readable (Lexend)"], ["classic", "Classic"]])}</div>
          <div class="field"><span>Text size</span>${seg("size", [["normal", "Comfortable"], ["large", "Large"]])}</div>
          <div class="field"><span>Animations</span>${seg("motion", [["on", "On"], ["off", "Reduced"]])}</div>
          ${chk("celebrate", st.celebrate, "Celebrate wins with confetti 🎉").replace("<input", `<input data-input="celebrate"`)}
        </div>
      </div>
    </div>
    <div class="stack">
      <div class="card"><h2>Calm & focus</h2>
        <div class="stack mt" style="gap:12px">
          ${chk("focus", st.focus, "<b>Focus mode</b> — show only the essentials").replace("<input", `<input data-input="focus"`)}
          ${chk("privacy", st.privacy, "<b>Privacy blur</b> — hide amounts until you hover").replace("<input", `<input data-input="privacy"`)}
        </div>
      </div>
      <div class="card"><h2>Your data</h2>
        <p class="tiny mt-s">Saved automatically in this browser.${st.lastBackup ? ` Last backup: ${fmtDay(st.lastBackup)}.` : " No backup yet."}</p>
        ${IS_DEMO ? `<div class="banner mt">Backups and imports are part of the full version.</div>` : ""}
        <div class="row wrap mt">
          <button class="btn primary" data-action="export-json" ${IS_DEMO ? "disabled" : ""}>${icon("download")}Back up (.json)</button>
          <button class="btn" data-action="import-json" ${IS_DEMO ? "disabled" : ""}>${icon("upload")}Restore backup</button>
          <button class="btn" data-action="export-csv">${icon("download")}Transactions CSV</button>
          <button class="btn" data-action="print">${icon("printer")}Print / PDF</button>
          <button class="btn" data-action="export-ics">${icon("calendar")}Bills to calendar (.ics)</button>
        </div>
        <div class="row wrap mt">
          <button class="btn" data-action="load-sample">${icon("sparkle")}Load sample data</button>
          <button class="btn danger" data-action="reset">${icon("trash")}Erase everything</button>
        </div>
      </div>
      <div class="card"><h2>Use it everywhere</h2>
        <p class="tiny mt-s"><b>Offline:</b> keep the downloaded <code>.html</code> file and open it in any browser — no internet needed.</p>
        <p class="tiny mt-s"><b>Phone:</b> open the online link, then “Add to Home Screen” to install it like an app.</p>
        <p class="tiny mt-s"><b>Move devices:</b> back up here, then restore the file on the other device.</p>
      </div>
      <div class="card"><h2>About</h2><p class="tiny mt-s">${APP_NAME} · ${IS_DEMO ? "Free demo" : "Full edition"} · v1.0</p><p class="tiny mt-s">This planner is a budgeting tool, not financial advice.</p></div>
    </div>
  </div>`;
}

const VIEWS = {
  setup: viewSetup, home: viewHome, today: viewToday, calendar: viewCalendar, paycheck: viewPaycheck,
  transactions: viewTransactions, budget: viewBudget, bills: viewBills, savings: viewSavings, debt: viewDebt,
  goals: viewGoals, impulse: viewImpulse, rewards: viewRewards, year: viewYear, settings: viewSettings,
};
