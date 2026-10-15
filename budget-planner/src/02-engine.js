/* ==========================================================================
   Engine: recurrence, scheduled items, money maths, debt payoff, badges
   ========================================================================== */

/** All ISO dates on which a recurring item lands between `from` and `to` (inclusive). */
function occurrences(freq, anchor, from, to, endDate) {
  if (!anchor) return [];
  const last = endDate && endDate < to ? endDate : to;
  const out = [];
  if (anchor > last) return out;
  if (freq === "once") {
    if (anchor >= from && anchor <= last) out.push(anchor);
    return out;
  }
  if (freq === "weekly" || freq === "biweekly") {
    const step = freq === "weekly" ? 7 : 14;
    let k = from > anchor ? Math.ceil(diffDays(anchor, from) / step) : 0;
    for (let d = addDays(anchor, k * step); d <= last; d = addDays(d, step)) out.push(d);
    return out;
  }
  if (freq === "semimonthly") {
    for (let mk = monthKey(from > anchor ? from : anchor); monthStart(mk) <= last; mk = addMonths(mk, 1)) {
      for (const d of [`${mk}-15`, monthEnd(mk)]) if (d >= from && d <= last && d >= anchor) out.push(d);
    }
    return out;
  }
  const step = freq === "quarterly" ? 3 : freq === "yearly" ? 12 : 1;
  const day = Number(anchor.slice(8, 10));
  let mk = monthKey(anchor);
  if (monthKey(from) > mk) {
    const gap = monthsBetween(mk, monthKey(from));
    mk = addMonths(mk, Math.floor(gap / step) * step);
  }
  for (; monthStart(mk) <= last; mk = addMonths(mk, step)) {
    const [y, m] = mk.split("-").map(Number);
    const d = `${mk}-${pad(Math.min(day, daysInMonth(y, m - 1)))}`;
    if (d >= from && d <= last && d >= anchor) out.push(d);
  }
  return out;
}
const monthsBetween = (a, b) => {
  const [y1, m1] = a.split("-").map(Number);
  const [y2, m2] = b.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
};
const perMonth = (amount, freq) =>
  ({ once: 0, weekly: (amount * 52) / 12, biweekly: (amount * 26) / 12, semimonthly: amount * 2, monthly: amount, quarterly: amount / 3, yearly: amount / 12 })[freq] ?? amount;

/** Everything planned between two dates: paychecks, bills, debt minimums and savings transfers. */
function scheduleIn(from, to) {
  const out = [];
  const push = (kind, ref, date, extra) => {
    const key = `${kind}:${ref.id}:${date}`;
    out.push({ key, kind, refId: ref.id, date, name: ref.name, done: !!S.links[key], txId: S.links[key], ...extra });
  };
  for (const inc of S.incomes) {
    for (const d of occurrences(inc.freq, inc.anchor, from, to, inc.endDate)) push("income", inc, d, { amount: inc.amount, emoji: inc.emoji || "💰" });
  }
  for (const b of S.bills) {
    const cat = catById(b.catId);
    for (const d of occurrences(b.freq, b.anchor, from, to, b.endDate))
      push("bill", b, d, { amount: b.amount, catId: b.catId, emoji: b.emoji || cat?.emoji || "🧾", autopay: b.autopay, isSub: b.isSub });
  }
  for (const debt of S.debts) {
    if (!(debt.minimum > 0)) continue;
    for (const d of occurrences("monthly", debt.anchor, from, to)) {
      const key = `debt:${debt.id}:${d}`;
      if (debt.balance <= 0 && !S.links[key]) continue;
      push("debt", debt, d, { amount: Math.min(debt.minimum, Math.max(debt.balance, 0)) || debt.minimum, emoji: "💳", name: `${debt.name} payment` });
    }
  }
  for (const f of S.funds) {
    if (!(f.monthly > 0)) continue;
    for (const d of occurrences(f.freq || "monthly", f.anchor, from, to)) {
      const key = `fund:${f.id}:${d}`;
      if (f.target > 0 && f.saved >= f.target && !S.links[key]) continue;
      push("fund", f, d, { amount: f.monthly, emoji: f.emoji || "🐷", name: `${f.name} transfer` });
    }
  }
  return out.sort(by((x) => x.date + (x.kind === "income" ? "0" : "1")));
}

/* ---------- Lookups ---------- */
const catById = (id) => SYSTEM_CATS[id] || S.categories.find((c) => c.id === id);
const txInRange = (from, to) => S.transactions.filter((t) => t.date >= from && t.date <= to);
const txInMonth = (mk) => txInRange(monthStart(mk), monthEnd(mk));
const findRef = (kind, id) => ({ income: S.incomes, bill: S.bills, debt: S.debts, fund: S.funds })[kind]?.find((x) => x.id === id);

/* ---------- Transactions & side effects ---------- */
function applyEffect(tx, sign) {
  if (!tx.effect) return;
  if (tx.effect.debtId) {
    const d = S.debts.find((x) => x.id === tx.effect.debtId);
    if (d) d.balance = round2(Math.max(0, d.balance - sign * tx.amount));
  }
  if (tx.effect.fundId) {
    const f = S.funds.find((x) => x.id === tx.effect.fundId);
    if (f) f.saved = round2(f.saved + sign * tx.amount);
  }
}
function addTx(tx) {
  const t = { id: uid(), createdAt: Date.now(), note: "", ...tx, amount: round2(tx.amount) };
  S.transactions.push(t);
  applyEffect(t, +1);
  if (t.link) S.links[t.link] = t.id;
  if (t.date === todayISO()) S.checkins[t.date] = true;
  if (t.type === "expense" && !t.link && S.noSpend[t.date]) delete S.noSpend[t.date];
  return t;
}
function removeTx(id) {
  const i = S.transactions.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const [t] = S.transactions.splice(i, 1);
  applyEffect(t, -1);
  for (const k in S.links) if (S.links[k] === id) delete S.links[k];
  return t;
}
function updateTx(id, patch) {
  const t = S.transactions.find((x) => x.id === id);
  if (!t) return;
  applyEffect(t, -1);
  Object.assign(t, patch, { amount: round2(patch.amount ?? t.amount) });
  applyEffect(t, +1);
}
/** Check or uncheck a scheduled occurrence; checking it records a real transaction. */
function toggleOccurrence(o) {
  if (S.links[o.key]) {
    removeTx(S.links[o.key]);
    return false;
  }
  const base = { date: o.date, name: o.name, amount: o.amount, link: o.key };
  if (o.kind === "income") addTx({ ...base, type: "income", catId: "income" });
  else if (o.kind === "bill") addTx({ ...base, type: "expense", catId: o.catId || "" });
  else if (o.kind === "debt") addTx({ ...base, type: "expense", catId: "debt", effect: { debtId: o.refId } });
  else if (o.kind === "fund") addTx({ ...base, type: "saving", catId: "savings", effect: { fundId: o.refId } });
  return true;
}

/* ---------- Budgets ---------- */
function budgetFor(cat, mk) {
  const o = S.budgets[mk];
  return o && o[cat.id] != null ? o[cat.id] : cat.budget || 0;
}
function catSpent(catId, mk) {
  return sum(txInMonth(mk).filter((t) => t.type === "expense" && t.catId === catId), (t) => t.amount);
}
/** Budget plus whatever was left over from previous months (when rollover is on). */
function catAvailable(cat, mk, depth = 0) {
  const base = budgetFor(cat, mk);
  if (!cat.rollover || depth > 11) return base;
  const prev = addMonths(mk, -1);
  if (prev < monthKey(S.createdAt)) return base;
  const carry = catAvailable(cat, prev, depth + 1) - catSpent(cat.id, prev);
  return base + carry;
}

/* ---------- Month summary & safe to spend ---------- */
function monthSummary(mk) {
  const from = monthStart(mk), to = monthEnd(mk);
  const txs = txInMonth(mk);
  const sched = scheduleIn(from, to);
  const income = sum(txs.filter((t) => t.type === "income"), (t) => t.amount);
  const spent = sum(txs.filter((t) => t.type === "expense"), (t) => t.amount);
  const saved = sum(txs.filter((t) => t.type === "saving"), (t) => t.amount);
  const pending = sched.filter((o) => !o.done);
  const expected = sum(pending.filter((o) => o.kind === "income"), (o) => o.amount);
  const billsDue = sum(pending.filter((o) => o.kind === "bill" || o.kind === "debt"), (o) => o.amount);
  const fundsDue = sum(pending.filter((o) => o.kind === "fund"), (o) => o.amount);
  const buffer = S.profile.buffer || 0;
  const safe = income + expected - spent - saved - billsDue - fundsDue - buffer;
  const planned = sum(S.categories, (c) => budgetFor(c, mk));
  return { mk, txs, sched, income, spent, saved, expected, billsDue, fundsDue, buffer, safe, planned, out: spent + saved };
}
function todaySummary() {
  const today = todayISO();
  const mk = monthKey(today);
  const m = monthSummary(mk);
  const d = fromISO(today);
  const daysLeft = daysInMonth(d.getFullYear(), d.getMonth()) - d.getDate() + 1;
  const todays = S.transactions.filter((t) => t.date === today);
  const variableToday = sum(todays.filter((t) => t.type === "expense" && !t.link), (t) => t.amount);
  const allowance = Math.max(0, (m.safe + variableToday) / daysLeft);
  return { ...m, today, daysLeft, todays, variableToday, allowance, leftToday: allowance - variableToday };
}

/* ---------- Paycheck windows ---------- */
function paycheckPlan(count = 4) {
  const today = todayISO();
  const all = scheduleIn(addDays(today, -45), addDays(today, 200));
  // Windows run from one main paycheck to the next; smaller income (side hustles,
  // benefits) that lands inside a window is added to it.
  const primary = [...S.incomes].sort((a, b) => perMonth(b.amount, b.freq) - perMonth(a.amount, a.freq))[0];
  if (!primary) return [];
  const paydays = all.filter((o) => o.kind === "income" && o.refId === primary.id);
  const windows = [];
  for (let i = 0; i < paydays.length - 1; i++) {
    const start = paydays[i].date, end = addDays(paydays[i + 1].date, -1);
    if (end < today) continue;
    const inWin = (o) => o.date >= start && o.date <= end;
    const items = all.filter((o) => o.kind === "income" && inWin(o));
    const due = all.filter((o) => o.kind !== "income" && inWin(o));
    const amount = sum(items, (o) => o.amount);
    const dueTotal = sum(due, (o) => o.amount);
    windows.push({ date: start, end, next: paydays[i + 1].date, amount, items, extra: items.filter((o) => o.refId !== primary.id), due, dueTotal, left: amount - dueTotal, days: diffDays(start, end) + 1 });
    if (windows.length >= count) break;
  }
  return windows;
}

/* ---------- Debt payoff simulation ---------- */
function simulateDebts(strategy = "avalanche", extra = 0) {
  const debts = S.debts.filter((d) => d.balance > 0).map((d) => ({ ...d, bal: d.balance, interest: 0, paidOffMonth: null }));
  if (!debts.length) return { months: 0, interest: 0, order: [], series: [0], ok: true };
  const order = [...debts].sort(strategy === "snowball" ? by((d) => d.bal) : (a, b) => b.apr - a.apr || a.bal - b.bal);
  const series = [sum(debts, (d) => d.bal)];
  let month = 0, totalInterest = 0;
  const budget = sum(debts, (d) => d.minimum) + extra;
  while (debts.some((d) => d.bal > 0.005) && month < 600) {
    month++;
    for (const d of debts) {
      if (d.bal <= 0) continue;
      const i = d.bal * (d.apr / 100 / 12);
      d.bal += i; d.interest += i; totalInterest += i;
    }
    let pool = budget;
    for (const d of debts) {
      if (d.bal <= 0) continue;
      const p = Math.min(d.minimum, d.bal, pool);
      d.bal -= p; pool -= p;
    }
    for (const d of order) {
      if (pool <= 0) break;
      if (d.bal <= 0) continue;
      const p = Math.min(d.bal, pool);
      d.bal -= p; pool -= p;
    }
    for (const d of debts) if (d.bal <= 0.005 && d.paidOffMonth == null) { d.bal = 0; d.paidOffMonth = month; }
    series.push(sum(debts, (d) => Math.max(0, d.bal)));
  }
  const ok = month < 600;
  return {
    ok, months: month, interest: totalInterest, series,
    order: order.map((d) => ({ id: d.id, name: d.name, month: d.paidOffMonth, interest: d.interest, apr: d.apr, start: d.balance })),
  };
}

/* ---------- Streaks ---------- */
function streak() {
  let n = 0;
  let d = todayISO();
  if (!S.checkins[d]) d = addDays(d, -1);
  while (S.checkins[d]) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- Badges ---------- */
const BADGES = [
  { id: "first_track", e: "🌱", name: "First step", desc: "Tracked your first money move" },
  { id: "setup", e: "🧭", name: "All set up", desc: "Finished the setup checklist" },
  { id: "streak_7", e: "🔥", name: "On a roll", desc: "7-day check-in streak" },
  { id: "streak_30", e: "🌟", name: "Habit unlocked", desc: "30-day check-in streak" },
  { id: "nospend_1", e: "🧘", name: "Calm wallet", desc: "Your first no-spend day" },
  { id: "nospend_5", e: "🏆", name: "No-spend hero", desc: "5 no-spend days in one month" },
  { id: "bills_10", e: "✅", name: "Bill boss", desc: "Checked off 10 bills" },
  { id: "save_25", e: "🐣", name: "Quarter way", desc: "A savings fund hit 25%" },
  { id: "save_50", e: "🐥", name: "Halfway there", desc: "A savings fund hit 50%" },
  { id: "save_100", e: "🦋", name: "Goal reached", desc: "Fully funded a savings fund" },
  { id: "debt_free", e: "🕊️", name: "Debt slayer", desc: "Paid off a debt completely" },
  { id: "under_budget", e: "🎯", name: "Under budget", desc: "Finished a month under budget" },
  { id: "pause_1", e: "⏸️", name: "Paused it", desc: "Skipped an impulse buy" },
  { id: "pause_100", e: "💎", name: "Impulse master", desc: "Saved 100+ by pausing" },
  { id: "goal_done", e: "🎉", name: "Dream achieved", desc: "Completed a goal" },
];
function earnedNow() {
  const got = new Set();
  if (S.transactions.length) got.add("first_track");
  if (setupSteps().every((s) => s.done)) got.add("setup");
  const st = streak();
  if (st >= 7) got.add("streak_7");
  if (st >= 30) got.add("streak_30");
  const ns = Object.keys(S.noSpend);
  if (ns.length) got.add("nospend_1");
  const perMonthNs = {};
  for (const d of ns) perMonthNs[monthKey(d)] = (perMonthNs[monthKey(d)] || 0) + 1;
  if (Object.values(perMonthNs).some((n) => n >= 5)) got.add("nospend_5");
  if (S.transactions.filter((t) => t.link && t.link.startsWith("bill:")).length >= 10) got.add("bills_10");
  for (const f of S.funds) {
    const p = f.target > 0 ? f.saved / f.target : 0;
    if (p >= 0.25) got.add("save_25");
    if (p >= 0.5) got.add("save_50");
    if (p >= 1) got.add("save_100");
  }
  if (S.debts.some((d) => d.balance <= 0 && d.original > 0)) got.add("debt_free");
  const thisMk = monthKey(todayISO());
  for (let i = 1; i <= 3; i++) {
    const mk = addMonths(thisMk, -i);
    if (mk < monthKey(S.createdAt)) break;
    const spentVar = sum(S.categories, (c) => catSpent(c.id, mk));
    const plan = sum(S.categories, (c) => budgetFor(c, mk));
    if (spentVar > 0 && spentVar <= plan) { got.add("under_budget"); break; }
  }
  if (S.wishlist.some((w) => w.decision === "skipped")) got.add("pause_1");
  if (S.skippedTotal >= 100) got.add("pause_100");
  if (S.goals.some((g) => g.status === "done")) got.add("goal_done");
  return got;
}
/** Award new badges; returns the newly earned ones. */
function checkBadges(silent = false) {
  const fresh = [];
  for (const id of earnedNow()) {
    if (!S.badges[id]) { S.badges[id] = todayISO(); fresh.push(BADGES.find((b) => b.id === id)); }
  }
  if (!silent && fresh.length) {
    const b = fresh[0];
    celebrate(b.e, `Badge unlocked: ${b.name}`, b.desc);
  }
  return fresh;
}

/* ---------- Setup checklist ---------- */
function setupSteps() {
  return [
    { done: !!S.profile.name, label: "Add your name & currency", hint: "Make it yours", href: "#settings" },
    { done: S.incomes.length > 0, label: "Add your paycheck", hint: "When money comes in", href: "#paycheck" },
    { done: S.bills.length > 0, label: "Add your bills", hint: "Rent, phone, subscriptions…", href: "#bills" },
    { done: Object.keys(S.budgets).length > 0 || S.categories.some((c) => c.edited), label: "Check your monthly budget", hint: "Adjust the amounts per category", href: "#budget" },
    { done: S.funds.length > 0, label: "Start a savings fund", hint: "Emergency fund, trip, anything", href: "#savings" },
    { done: S.transactions.some((t) => !t.link), label: "Track your first spend", hint: "Press N anywhere", href: "#today" },
  ];
}
