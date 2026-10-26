/* ==========================================================================
   Balance mode (skin.balance): "available until payday" from the money that is
   really in the account, envelopes, fresh start, can-I-afford-it, money back,
   fees check, calendar export and Apple Pay quick entry.
   ========================================================================== */
const BAL = !!SKIN.balance;

/* ---------- Engine ---------- */
/** Does this transaction change the balance the user last confirmed? */
const afterCheck = (t) => !t.absorbed && (t.createdAt || 0) > (S.account.checkedAt || 0);
const txDelta = (t) => (t.type === "income" ? t.amount : -t.amount);
function balanceNow() {
  return round2((S.account.balance || 0) + sum(S.transactions.filter(afterCheck), txDelta));
}
const primaryIncome = () => S.incomes.find((i) => i.primary) || S.incomes[0];
/** The next payday that hasn't been confirmed yet (today included), or a manual planning date. */
function nextPayday(today = todayISO()) {
  const inc = primaryIncome();
  if (inc) {
    const o = scheduleIn(today, addDays(today, 400)).find((x) => x.kind === "income" && x.refId === inc.id && !x.done);
    if (o) return { date: o.date, occ: o };
  }
  const manual = S.account.horizon;
  if (manual && manual > today) return { date: manual, occ: null };
  return { date: addDays(monthEnd(monthKey(today)), 1), occ: null };
}
/** Bills, debt minimums and savings transfers still to pay up to (and including) payday, plus anything overdue. */
function commitmentsUntil(h, today = todayISO()) {
  const from = S.account.openFrom || S.account.checkedOn || today;
  return scheduleIn(from < today ? from : today, h).filter((o) => o.kind !== "income" && !o.done && (o.date >= today || o.date >= from));
}
function availableSummary(today = todayISO()) {
  const pay = nextPayday(today);
  const h = pay.date;
  const balance = balanceNow();
  const due = commitmentsUntil(h, today);
  const bills = round2(sum(due, (o) => o.amount));
  const reserved = round2(sum(S.envelopes, (e) => e.amount));
  const buffer = round2(S.profile.buffer || 0);
  const margin = round2(balance - bills - reserved - buffer);
  const available = Math.max(0, margin), shortBy = Math.max(0, -margin);
  const days = diffDays(today, h); // today included, payday excluded
  const todays = S.transactions.filter((t) => t.date === today && t.type === "expense" && !t.link && afterCheck(t));
  const spentToday = round2(sum(todays, (t) => t.amount));
  const confirmPayday = days <= 0;
  // The daily guide is recalculated from today: what's left plus what you already spent today, shared out.
  const guide = confirmPayday ? 0 : Math.floor(((available + spentToday) * 100) / days) / 100;
  const checkedDays = S.account.checkedOn ? diffDays(S.account.checkedOn, today) : null;
  return { today, h, pay, balance, due, bills, reserved, buffer, margin, available, shortBy, days, spentToday, guide, leftToday: round2(guide - spentToday), confirmPayday, checkedDays, stale: checkedDays == null || checkedDays >= 7 };
}
/** What a purchase would leave, without recording anything. */
function previewPurchase(amount) {
  const a = availableSummary();
  const after = round2(a.margin - amount);
  return { ...a, amount, after: Math.max(0, after), short: Math.max(0, -after), perDay: a.days > 0 ? Math.floor((Math.max(0, after) * 100) / a.days) / 100 : 0, fits: after >= 0, fitsToday: amount <= a.leftToday };
}
/** Confirm the real balance; everything recorded so far is now part of it. */
function checkBalance(amount, openFrom = todayISO()) {
  S.account.balance = round2(amount);
  S.account.checkedAt = Date.now();
  S.account.checkedOn = todayISO();
  S.account.openFrom = openFrom;
}

/* ---------- Fees & repeat-charge check (heuristic, local only) ---------- */
const FEE_RE = /\b(fee|fees|charge|overdraft|late|interest|atm|foreign|penalty|service charge|nsf|maintenance)\b/i;
const normName = (s) => String(s || "").toLowerCase().replace(/[0-9#*]+/g, " ").replace(/\s+/g, " ").trim();
function feesScan(today = todayISO()) {
  const since = addDays(today, -365);
  const tx = S.transactions.filter((t) => t.type === "expense" && t.date >= since && !t.link);
  const fees = tx.filter((t) => FEE_RE.test(t.name) || FEE_RE.test(t.note || ""));
  const groups = {};
  for (const t of tx) (groups[normName(t.name)] ||= []).push(t);
  const repeats = [];
  for (const [name, list] of Object.entries(groups)) {
    if (!name || list.length < 3 || FEE_RE.test(name)) continue; // fees are listed on their own
    const sorted = list.slice().sort(by((t) => t.date));
    const gaps = sorted.slice(1).map((t, i) => diffDays(sorted[i].date, t.date));
    const avg = sum(gaps) / gaps.length;
    const amounts = sorted.map((t) => t.amount), mean = sum(amounts) / amounts.length;
    const steady = amounts.every((x) => Math.abs(x - mean) <= Math.max(1, mean * 0.12));
    const monthly = avg >= 25 && avg <= 35, weekly = avg >= 6 && avg <= 8;
    if (steady && (monthly || weekly) && !S.bills.some((b) => normName(b.name) === name)) {
      repeats.push({ name: sorted.at(-1).name, amount: round2(sorted.at(-1).amount), every: monthly ? "month" : "week", count: list.length, yearly: round2(sorted.at(-1).amount * (monthly ? 12 : 52)) });
    }
  }
  const dupes = [];
  const seen = {};
  for (const t of tx.slice().sort(by((t) => t.date))) {
    const k = `${normName(t.name)}|${t.amount}`;
    const prev = seen[k];
    if (prev && diffDays(prev.date, t.date) <= 2 && t.amount >= 5) dupes.push({ a: prev, b: t });
    seen[k] = t;
  }
  const feeTotal = round2(sum(fees, (t) => t.amount));
  return { fees, repeats: repeats.sort(by((r) => -r.yearly)), dupes, feeTotal, yearly: round2(feeTotal + sum(repeats, (r) => r.yearly) + sum(dupes, (d) => d.b.amount)) };
}

/* ---------- Calendar export (.ics) ---------- */
function billsICS(today = todayISO()) {
  const icsDate = (d) => d.replace(/-/g, "");
  const escI = (s) => String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const occ = scheduleIn(today, addDays(today, 365)).filter((o) => o.kind !== "income");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ev = occ.map((o) => ["BEGIN:VEVENT", `UID:${o.key.replace(/[^a-z0-9:-]/gi, "")}@${STORE_KEY}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDate(o.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(o.date, 1))}`, `SUMMARY:${escI(`${o.name} — ${money(o.amount)}`)}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${escI(o.name)}`, "END:VALARM", "END:VEVENT"].join("\r\n"));
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${escI(APP_NAME)}//Bills//EN`, "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n") + "\r\n";
}

/* ---------- Apple Pay quick entry ---------- */
// The iPhone Shortcut adds one line per payment:  SPEND|<amount>|<merchant>|<date>
function parseCollected(text) {
  const out = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!/^SPEND\|/i.test(line)) continue;
    const [, amt, merchant = "", when = ""] = line.split("|");
    const amount = Math.abs(parseAmount(amt));
    if (!(amount > 0) || amount > 1e7) continue;
    const d = String(when).match(/\d{4}-\d{2}-\d{2}/)?.[0];
    out.push({ key: line.slice(0, 200), amount: round2(amount), name: merchant.trim().slice(0, 80) || "Apple Pay", date: d && d <= todayISO() ? d : todayISO(), seen: !!S.collected[line.slice(0, 200)] });
  }
  return out;
}
const MERCHANT_HINTS = [[/coffee|cafe|café|starbucks|latte|bakery|dunkin/i, "Coffee"], [/grocer|market|trader|whole foods|aldi|lidl|tesco|costco|safeway|kroger|carrefour/i, "Groceries"], [/uber|lyft|gas|shell|chevron|bp|transit|parking|train|metro/i, "Transport"], [/restaurant|pizza|taco|sushi|burger|mcdonald|chipotle|grill|kitchen|deliveroo|doordash/i, "Dining"], [/amazon|target|walmart|ikea|zara|h&m|shop|store/i, "Shopping"], [/pharma|cvs|walgreens|boots|beauty|salon/i, "Personal"]];
function guessCategory(name) {
  for (const [re, word] of MERCHANT_HINTS) if (re.test(name)) { const c = S.categories.find((x) => x.name.toLowerCase().includes(word.toLowerCase())); if (c) return c.id; }
  return "";
}
function openCollect(text = "") {
  const found = parseCollected(text);
  const fresh = found.filter((f) => !f.seen);
  const body = found.length
    ? `<p class="muted">${fresh.length ? `Found ${plural(fresh.length, "new payment")}. Tick the ones to add.` : "Everything here was already added."}</p>
      <div class="list mt">${found.map((f, i) => `<label class="li collect-li ${f.seen ? "done" : ""}"><input type="checkbox" name="c${i}" ${f.seen ? "disabled" : "checked"}><div class="name">${esc(f.name)}<small>${fmtDay(f.date)}${f.seen ? " · already added" : ""}</small></div><div class="amt m">${money(f.amount)}</div></label>`).join("")}</div>`
    : `<p class="muted">Paste what your Shortcut copied (each payment is a line starting with <b>SPEND|</b>).</p><textarea class="input mt" name="paste" style="min-height:120px" placeholder="SPEND|$4.50|Corner Cafe|2026-10-25"></textarea>`;
  openModal({
    title: "Collect Apple Pay spends",
    body,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${found.length ? "Add selected" : "Read"}</button>`,
    onSubmit: (d) => {
      if (!found.length) { setTimeout(() => openCollect(d.paste || ""), 10); return; }
      const pick = found.filter((f, i) => !f.seen && d[`c${i}`]);
      if (!pick.length) return;
      const undo = snapshot();
      for (const f of pick) { addTx({ type: "expense", amount: f.amount, name: f.name, date: f.date, catId: guessCategory(f.name), note: "Apple Pay" }); S.collected[f.key] = todayISO(); }
      // Keep the list of imported lines small.
      const keys = Object.keys(S.collected);
      if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete S.collected[k];
      commit(`${plural(pick.length, "spend")} added from Apple Pay`, undo);
    },
  });
}
async function collectFromClipboard() {
  let text = "";
  try { text = await navigator.clipboard.readText(); } catch { text = ""; }
  openCollect(text);
}
/** #add?amount=4.50&name=Cafe — opens a pre-filled spend (nothing is saved until the user taps Add). */
function handleAddLink() {
  const m = location.hash.match(/^#add\?(.*)$/);
  if (!m) return false;
  const q = new URLSearchParams(m[1]);
  const amount = Math.abs(parseAmount(q.get("amount")));
  const name = (q.get("name") || "").slice(0, 80);
  history.replaceState(null, "", location.pathname + location.search + "#home");
  ui.view = "home";
  render();
  openTxForm(null, { amount: amount > 0 && amount < 1e7 ? round2(amount) : "", name, catId: guessCategory(name) });
  return true;
}

/* ---------- Views ---------- */
const relShort = (iso) => { const n = diffDays(todayISO(), iso); return n === 0 ? "today" : n === 1 ? "tomorrow" : `${DOW[fromISO(iso).getDay()]}, ${fmtDay(iso)}`; };
function freshness(a) {
  if (a.checkedDays == null) return `<span class="fresh off"></span>Add your balance to start`;
  if (a.checkedDays === 0) return `<span class="fresh"></span>Balance checked today`;
  if (a.checkedDays < 7) return `<span class="fresh"></span>Balance checked ${plural(a.checkedDays, "day")} ago`;
  return `<span class="fresh old"></span>Last balance check ${plural(a.checkedDays, "day")} ago`;
}
function breakdownHTML(a) {
  const row = (label, v, href, sign, cls = "") => `<a class="bd-row ${cls}" href="${href}"><span>${label}</span><b class="m">${sign}${money(Math.abs(v))}</b></a>`;
  const since = round2(a.balance - (S.account.balance || 0));
  return `<div class="bd">
    ${row(`Balance you checked${S.account.checkedOn ? ` (${fmtDay(S.account.checkedOn)})` : ""}`, S.account.balance || 0, "#home", "")}
    ${since ? row("Recorded since then", since, "#transactions", since < 0 ? "− " : "+ ") : ""}
    ${row(`Bills & payments until ${fmtDay(a.h)}`, a.bills, "#bills", "− ")}
    ${a.reserved ? row("Set aside in envelopes", a.reserved, "#envelopes", "− ") : ""}
    ${a.buffer ? row("Safety buffer", a.buffer, "#settings", "− ") : ""}
    ${row(`Available until ${fmtDay(a.h)}`, a.available, "#home", "", "tot")}
    ${a.shortBy ? `<p class="tiny neg mt-s">Your recorded commitments need another ${money(a.shortBy)}.</p>` : ""}
    <p class="tiny mt-s">Expected pay isn't counted until you mark it received. Bills due on payday stay covered until then.</p>
  </div>`;
}
function homeBalance() {
  const a = availableSummary();
  const hello = S.profile.name ? `${greeting()}, ${esc(S.profile.name)}` : greeting();
  const freq = frequentSpends().slice(0, 4);
  const coming = a.due.slice(0, 5);
  const used = a.guide > 0 ? clamp(a.spentToday / a.guide, 0, 1) : 0;
  const mb = S.moneyBack.filter((m) => m.status === "waiting");
  const numberHTML = `
      <div class="eyebrow">Available until ${relShort(a.h)}</div>
      <div class="avail ${a.shortBy ? "neg" : ""}">${moneyHTML(a.available)}</div>
      ${a.shortBy ? `<p class="short-line">Your bills before payday need another <b class="m">${money(a.shortBy)}</b>. <button class="link-btn" data-action="toggle-breakdown">See why</button></p>` : ""}
      <div class="fresh-line">${freshness(a)} <button class="link-btn" data-action="fresh-start">Update balance</button></div>
      <div class="guide">
        ${a.confirmPayday ? `<p class="muted">Daily guide pauses until you confirm payday.</p>` : `
        <div class="row between"><span><b class="m">${money(Math.max(0, a.leftToday))}</b> left today</span><span class="tiny">Daily guide ${money(a.guide)} · ${plural(a.days, "day")} to go</span></div>
        <div class="bbar sage"><i style="width:${Math.round(used * 100)}%"></i></div>
        <div class="tiny mt-s">${money(a.spentToday)} of ${money(a.guide)} used today${a.leftToday < 0 ? " — tomorrow's guide adjusts, no stress." : ""}</div>`}
      </div>`;
  const actionsHTML = `
      <div class="row wrap mt hero-actions">
        <button class="btn primary" data-action="quick-add">${icon("plus")}Add expense</button>
        <button class="btn" data-action="afford">${icon("search")}Can I afford it?</button>
        ${NOOK ? "" : `<button class="btn ghost" data-action="toggle-breakdown" aria-expanded="${!!ui.showBreakdown}">${icon("info")}How is this worked out?</button>`}
      </div>`;
  const oneTapHTML = freq.length ? `<div class="one-tap mt"><span class="tiny">One tap</span>${freq.map((f, i) => `<button class="chip" data-action="repeat-spend" data-i="${i}">${esc(catById(f.catId)?.emoji || "")} ${esc(f.name)} · <b class="m">${money(f.amount)}</b></button>`).join("")}<button class="chip apple" data-action="collect-applepay" title="Collect spends your iPhone Shortcut saved">${icon("download", 15)} Apple Pay</button></div>` : `<div class="one-tap mt"><button class="chip apple" data-action="collect-applepay">${icon("download", 15)} Collect Apple Pay spends</button></div>`;
  return `
  <div class="sage">
  ${pageHead(hello, fmtLong(a.today), `<button class="btn primary add-spend" data-action="quick-add">${icon("plus", 20)}Add expense</button>`)}
  ${a.stale && a.checkedDays != null ? `<div class="fresh-banner"><div><b>Missed a few days? Start from today.</b><span>Update your balance and we'll work out your number from now — no catching up.</span></div><button class="btn primary sm" data-action="fresh-start">Start from today</button></div>` : ""}
  ${a.confirmPayday && a.pay.occ ? `<div class="fresh-banner"><div><b>Is it payday?</b><span>Mark your ${esc(a.pay.occ.name.toLowerCase())} received to see your next period.</span></div><button class="btn primary sm" data-action="toggle-occ" data-key="${esc(a.pay.occ.key)}">Mark received · ${money(a.pay.occ.amount)}</button></div>` : ""}
  ${NOOK ? nookScene({ a, inner: numberHTML + actionsHTML }) : ""}
  <div class="sage-grid">
    ${NOOK ? `<div class="card hero-quick">
      <div class="card-head"><h2>${icon("bolt", 20)} Quick add</h2><span class="tiny">One tap, then carry on</span></div>
      ${oneTapHTML}
      ${ui.showBreakdown ? breakdownHTML(a) : `<button class="link-btn mt" data-action="toggle-breakdown">How is today's number worked out?</button>`}
    </div>` : `<div class="card hero-avail">
      ${numberHTML}
      ${actionsHTML}
      ${ui.showBreakdown ? breakdownHTML(a) : ""}
      ${oneTapHTML}
    </div>`}
    <div class="card">
      <div class="card-head"><h2>${icon("calendar", 20)} Before payday</h2><a class="link-sm" href="#bills">All bills</a></div>
      ${coming.length ? `<div class="list">${coming.map((o) => `<div class="li ${o.date < a.today ? "late" : ""}">
          <div class="when">${o.date < a.today ? "Overdue" : relDay(o.date)}</div>
          ${tick(o.done, `data-action="toggle-occ" data-key="${esc(o.key)}"`)}
          <div class="name">${esc(o.emoji || "")} ${esc(o.name)}<small>${o.kind === "fund" ? "Savings transfer" : o.kind === "debt" ? "Debt payment" : o.isSub ? "Subscription" : "Bill"}</small></div>
          <div class="amt m">${money(o.amount)}</div></div>`).join("")}</div>
          <p class="tiny mt-s">${money(a.bills)} protected until ${fmtDay(a.h)}.</p>`
        : empty("🌤️", "Nothing due before payday", "Add your bills so they're protected automatically.", `<button class="btn primary" data-action="add-bill">Add a bill</button>`)}
    </div>
  </div>
  <div class="grid g3 mt">
    <a class="card mini-card" href="#envelopes"><div class="card-head"><h3>${icon("envelope", 18)} Envelopes</h3><span class="tiny">${money(a.reserved)}</span></div>
      ${S.envelopes.length ? S.envelopes.slice(0, 3).map((e) => `<div class="row between mini-row"><span>${esc(e.emoji || "✉️")} ${esc(e.name)}</span><b class="m">${money(e.amount)}</b></div>`).join("") : `<p class="tiny">Set money aside for groceries, gifts or the car.</p>`}</a>
    <a class="card mini-card" href="#moneyback"><div class="card-head"><h3>${icon("repeat", 18)} Money back</h3><span class="tiny">${money(sum(mb, (m) => m.amount))}</span></div>
      ${mb.length ? mb.slice(0, 3).map((m) => `<div class="row between mini-row"><span>${esc(m.name)}</span><span class="tiny">by ${fmtDay(m.due)}</span></div>`).join("") : `<p class="tiny">Track returns, refunds and free trials.</p>`}</a>
    <a class="card mini-card" href="#fees"><div class="card-head"><h3>${icon("bolt", 18)} Fees check</h3></div><p class="tiny">Find repeat charges, fees and double payments in your spending.</p></a>
  </div>
  <div class="grid g2 mt">${goalsMini()}<div class="card focus-hide"><div class="card-head"><h2>This month</h2><a class="link-sm" href="#budget">Budget</a></div>${spendingDonut(txInMonth(monthKey(a.today)))}</div></div>
  </div>`;
}
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }

function viewEnvelopes() {
  const a = availableSummary();
  return `
  ${pageHead("Envelopes", "Money you set aside stays in your account but leaves your available number — so it's there when you need it.", `<button class="btn primary" data-action="add-envelope">${icon("plus")}New envelope</button>`)}
  <div class="grid g3">
    <div class="tile accent"><div class="label">Set aside</div><div class="value">${moneyHTML(a.reserved)}</div><div class="sub">across ${plural(S.envelopes.length, "envelope")}</div></div>
    <div class="tile good"><div class="label">Still available</div><div class="value">${moneyHTML(a.available)}</div><div class="sub">until ${fmtDay(a.h)}</div></div>
    <div class="tile"><div class="label">Balance now</div><div class="value">${moneyHTML(a.balance)}</div><div class="sub">${freshness(a)}</div></div>
  </div>
  ${S.envelopes.length ? `<div class="grid g3 mt">${S.envelopes.map((e) => `<div class="card env-card">
      <div class="card-head"><h3>${esc(e.emoji || "✉️")} ${esc(e.name)}</h3><button class="btn ghost icon-btn" data-action="edit-envelope" data-id="${e.id}" aria-label="Edit ${esc(e.name)}">${icon("edit")}</button></div>
      <div class="fund-amt">${moneyHTML(e.amount)}</div>
      <div class="row wrap mt"><button class="btn sm" data-action="env-spend" data-id="${e.id}">Spend from it</button><button class="btn sm" data-action="env-add" data-id="${e.id}">${icon("plus")}Add</button><button class="btn sm ghost" data-action="env-release" data-id="${e.id}">Release</button></div>
    </div>`).join("")}</div>` : `<div class="card mt">${empty("✉️", "No envelopes yet", "Groceries until payday, a birthday gift, car repairs… give money a place.", `<button class="btn primary" data-action="add-envelope">New envelope</button>`)}</div>`}`;
}
function viewMoneyBack() {
  const waiting = S.moneyBack.filter((m) => m.status === "waiting").sort(by((m) => m.due));
  const done = S.moneyBack.filter((m) => m.status !== "waiting").slice(-8).reverse();
  const today = todayISO();
  const kinds = { return: "Return", refund: "Refund", trial: "Free trial" };
  return `
  ${pageHead("Money back", "Returns, refunds and free trials — with deadlines, so money doesn't slip away. Expected money isn't counted until it arrives.", `<button class="btn primary" data-action="add-moneyback">${icon("plus")}Add</button>`)}
  <div class="grid g3">
    <div class="tile accent"><div class="label">Waiting for</div><div class="value">${moneyHTML(sum(waiting.filter((m) => m.kind !== "trial"), (m) => m.amount))}</div><div class="sub">${plural(waiting.length, "item")}</div></div>
    <div class="tile"><div class="label">Trials to cancel</div><div class="value">${waiting.filter((m) => m.kind === "trial").length}</div><div class="sub">before they charge you</div></div>
    <div class="tile good"><div class="label">Got back so far</div><div class="value">${moneyHTML(sum(S.moneyBack.filter((m) => m.status === "received"), (m) => m.amount))}</div><div class="sub">this is real money in</div></div>
  </div>
  <div class="card mt"><div class="card-head"><h2>Waiting</h2></div>
    ${waiting.length ? `<div class="list">${waiting.map((m) => { const late = m.due < today, soon = !late && diffDays(today, m.due) <= 3; return `<div class="li">
      <div class="when ${late ? "neg" : soon ? "warn-t" : ""}">${late ? "Overdue" : relDay(m.due)}</div>
      <div class="name">${esc(m.name)}<small>${kinds[m.kind] || "Refund"}${m.note ? " · " + esc(m.note) : ""}</small></div>
      <div class="amt m">${money(m.amount)}</div>
      <div class="row">${m.kind === "trial" ? `<button class="btn sm" data-action="mb-done" data-id="${m.id}" data-s="cancelled">Cancelled it</button>` : `<button class="btn sm primary" data-action="mb-done" data-id="${m.id}" data-s="received">Got it</button>`}<button class="btn ghost icon-btn" data-action="mb-delete" data-id="${m.id}" aria-label="Remove ${esc(m.name)}">${icon("trash")}</button></div>
    </div>`; }).join("")}</div>` : empty("🧾", "Nothing to chase", "Add a return or a free trial and we'll keep its deadline in sight.")}
  </div>
  ${done.length ? `<div class="card mt"><div class="card-head"><h3>Done</h3></div><div class="list">${done.map((m) => `<div class="li done"><div class="name">${esc(m.name)}<small>${m.status === "received" ? "Received" : "Cancelled"}</small></div><div class="amt m">${money(m.amount)}</div></div>`).join("")}</div></div>` : ""}`;
}
function viewFees() {
  const r = feesScan();
  return `
  ${pageHead("Fees check", "A quick look for repeat charges, bank fees and double payments in what you've recorded or imported. These are suggestions — you decide.", `<button class="btn" data-action="import-csv">${icon("upload")}Import bank CSV</button>`)}
  <div class="card fees-hero"><div class="eyebrow">Possible yearly cost found</div><div class="avail">${moneyHTML(r.yearly)}</div><p class="muted">${plural(r.repeats.length, "repeat charge")} · ${plural(r.fees.length, "fee")} · ${plural(r.dupes.length, "possible double payment")}</p></div>
  <div class="grid g2 mt">
    <div class="card"><div class="card-head"><h2>Repeat charges</h2><span class="tiny">not in your bills yet</span></div>
      ${r.repeats.length ? `<div class="list">${r.repeats.map((x) => `<div class="li"><div class="name">${esc(x.name)}<small>about every ${x.every} · seen ${x.count}×</small></div><div class="amt m">${money(x.amount)}<small class="tiny"> · ${money(x.yearly)}/yr</small></div><button class="btn sm" data-action="fees-to-bill" data-name="${esc(x.name)}" data-amount="${x.amount}" data-every="${x.every}">Add as bill</button></div>`).join("")}</div>` : empty("✨", "No repeat charges spotted", "Import a bank CSV to look further back.")}
    </div>
    <div class="card"><div class="card-head"><h2>Fees & doubles</h2><span class="tiny">${money(r.feeTotal)} in fees</span></div>
      ${r.fees.length || r.dupes.length ? `<div class="list">${r.fees.slice(0, 8).map((t) => `<div class="li"><div class="when">${fmtDay(t.date)}</div><div class="name">${esc(t.name)}<small>Fee</small></div><div class="amt m">${money(t.amount)}</div></div>`).join("")}${r.dupes.slice(0, 6).map((d) => `<div class="li"><div class="when">${fmtDay(d.b.date)}</div><div class="name">${esc(d.b.name)}<small>Possible double payment (also ${fmtDay(d.a.date)})</small></div><div class="amt m">${money(d.b.amount)}</div></div>`).join("")}</div>` : empty("🌿", "No fees found", "Nice. Bank fees and double charges will show up here.")}
    </div>
  </div>
  <p class="tiny mt">Everything is checked inside this browser. Nothing is uploaded.</p>`;
}
function viewQuickEntry() {
  const url = `${location.origin}${location.pathname}`;
  return `
  ${pageHead("Apple Pay quick entry", "Pay with your iPhone, then open your planner and collect the spend — amount and shop name filled in for you.")}
  <div class="grid g2">
    <div class="card">
      <h2>1 · Create the Shortcut (once, about 3 minutes)</h2>
      <ol class="steps-list mt">
        <li>Open the <b>Shortcuts</b> app → <b>Automation</b> → <b>+</b> → <b>Transaction</b>.</li>
        <li>Choose your Wallet cards, tick <b>Run Immediately</b>, then <b>Next</b> → <b>New Blank Automation</b>.</li>
        <li>Add <b>Text</b> and type: <code>SPEND|</code><i>Amount</i><code>|</code><i>Merchant</i><code>|</code><i>Current Date</i> (tap each blue variable from the Transaction).</li>
        <li>Add <b>Append to Text File</b> → file <code>Shortcuts/planner-spends.txt</code> (turn on “Make New Line”).</li>
        <li>Add <b>Get File</b> (same file) → <b>Copy to Clipboard</b> → <b>Show Notification</b> “Open your planner to collect”.</li>
      </ol>
      <p class="tiny mt">iPhone with iOS 17 or later, Apple Pay with a Wallet card. Availability depends on your country and card.</p>
    </div>
    <div class="card">
      <h2>2 · Collect in your planner</h2>
      <p class="muted mt-s">Open the planner and tap <b>Apple Pay</b> on the home screen. Your iPhone asks to paste; each new payment shows up ready to add. Payments you already added are skipped.</p>
      <button class="btn primary mt" data-action="collect-applepay">${icon("download")}Collect Apple Pay spends</button>
      <h3 class="mt-l">On a computer or Android</h3>
      <p class="tiny mt-s">Any shortcut tool can open <code>${esc(url)}#add?amount=4.50&amp;name=Cafe</code> to pre-fill a spend. Nothing is saved until you tap Add.</p>
      <h3 class="mt-l">Tidy up now and then</h3>
      <p class="tiny mt-s">You can empty <code>planner-spends.txt</code> in the Files app once a month — the planner remembers what it already added.</p>
    </div>
  </div>`;
}

/* ---------- Forms & actions ---------- */
function openBalanceCheck() {
  const today = todayISO();
  const from = S.account.openFrom || S.account.checkedOn || today;
  const late = scheduleIn(from < today ? from : today, addDays(today, -1)).filter((o) => o.kind !== "income" && !o.done);
  openModal({
    title: S.account.checkedOn ? "Start from today" : "Your balance",
    body: `<p class="muted">Look at your banking app and enter what's in your spending account right now. ${S.account.checkedOn ? "You don't need to add the days you missed." : ""}</p>
      <div class="money-input mt">${moneyInp("balance", S.account.checkedOn ? balanceNow() : "", 'autofocus aria-label="Balance right now" min="-10000000"')}</div>
      ${late.length ? `<h3 class="mt-l">Bills from while you were away</h3><p class="tiny">Already taken out of your account? Mark them paid — they won't be taken off again.</p>
        <div class="list mt-s">${late.map((o, i) => `<div class="li"><div class="when">${fmtDay(o.date)}</div><div class="name">${esc(o.name)}</div><div class="amt m">${money(o.amount)}</div>
          ${sel(`late${i}`, [["paid", "Paid already"], ["due", "Still due"], ["skip", "Skipped"]], "paid")}</div>`).join("")}</div>` : ""}`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Start from today</button>`,
    onSubmit: (d) => {
      if (String(d.balance).trim() === "") { toast("Enter your balance"); return false; }
      const undo = snapshot();
      let openFrom = today;
      late.forEach((o, i) => {
        const choice = d[`late${i}`];
        if (choice === "paid") toggleOccurrence(o); // dated before today → recorded as already in the balance
        else if (choice === "skip") S.links[o.key] = "skip";
        else if (o.date < openFrom) openFrom = o.date;
      });
      checkBalance(num(d.balance), openFrom);
      // Paid-while-away items are already in the balance just entered.
      for (const t of S.transactions) if (late.some((o) => o.key === t.link)) t.absorbed = true;
      commit("Fresh start — your number is up to date", undo);
    },
  });
}
function openAfford() {
  const form = openModal({
    title: "Can I afford it?",
    body: `<p class="muted">Type a price. Nothing is recorded until you choose.</p><div class="money-input mt">${moneyInp("amount", "", 'autofocus aria-label="Price"')}</div><div class="afford-out mt" aria-live="polite"></div>`,
    foot: `<button type="button" class="btn left" data-pause>${icon("pause")}Pause it</button><button type="button" class="btn" data-close>Close</button><button class="btn primary">Add this expense</button>`,
    onSubmit: (d) => { const amount = num(d.amount); if (!(amount > 0)) { toast("Enter a price first"); return false; } setTimeout(() => openTxForm(null, { amount }), 10); },
  });
  const out = $(".afford-out", form);
  const show = () => {
    const amount = num(form.amount.value);
    if (!(amount > 0)) { out.innerHTML = ""; return; }
    const p = previewPurchase(amount);
    out.innerHTML = p.fits
      ? `<div class="nudge ${p.fitsToday ? "good-nudge" : ""}"><span class="e">${p.fitsToday ? "🌿" : "🤔"}</span><div><b>${p.fitsToday ? `Yes — ${money(p.leftToday - amount)} left today.` : "It fits, but it's more than today's guide."}</b><div class="tiny">After this: ${money(p.after)} until ${fmtDay(p.h)} · about ${money(p.perDay)} a day.</div></div></div>`
      : `<div class="nudge warn-nudge"><span class="e">✋</span><div><b>Not before payday.</b><div class="tiny">It would leave your bills ${money(p.short)} short. Pausing it is a kind choice.</div></div></div>`;
  };
  form.amount.addEventListener("input", show);
  $("[data-pause]", form).addEventListener("click", () => { const amount = num(form.amount.value); closeModal(); go("impulse"); setTimeout(() => { const f = $("[data-form=wish] [name=price]"); if (f && amount) f.value = amount; $("[data-form=wish] [name=name]")?.focus(); }, 80); });
}
function openEnvelopeForm(env = null) {
  const a = availableSummary();
  openModal({
    title: env ? "Edit envelope" : "New envelope",
    body: `<div class="form-grid">${field("Name", inp("name", env?.name || "", 'required autofocus placeholder="Groceries until payday" maxlength="60"'))}${field("Emoji", inp("emoji", env?.emoji || "✉️", 'maxlength="4"'))}${field(env ? "Amount in it" : "Set aside now", moneyInp("amount", env ? env.amount : ""), "full", env ? "" : `${money(a.available)} available`)}</div>`,
    foot: `${env ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${env ? "Save" : "Set aside"}</button>`,
    onSubmit: (d) => {
      const amount = round2(Math.max(0, num(d.amount)));
      if (!d.name.trim()) { toast("Give it a name"); return false; }
      const undo = snapshot();
      if (env) Object.assign(env, { name: d.name.trim(), emoji: d.emoji.trim() || "✉️", amount });
      else S.envelopes.push({ id: uid(), name: d.name.trim(), emoji: d.emoji.trim() || "✉️", amount });
      if (!env && amount > 0) nookEarn("envelope");
      commit(env ? "Envelope saved" : `${money(amount)} set aside`, undo);
    },
    onMount: (f) => $("[data-del]", f)?.addEventListener("click", () => { const undo = snapshot(); S.envelopes = S.envelopes.filter((x) => x !== env); closeModal(); commit("Envelope deleted — the money is available again", undo); }),
  });
}
function openEnvelopeMoney(env, mode) {
  const titles = { add: `Add to ${env.name}`, release: `Release from ${env.name}`, spend: `Spend from ${env.name}` };
  openModal({
    title: titles[mode],
    body: `${field("Amount", moneyInp("amount", mode === "release" ? env.amount : "", "autofocus"))}${mode === "spend" ? field("What was it?", inp("name", "", `placeholder="${esc(env.name)}" maxlength="80"`), "mt") : ""}`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">OK</button>`,
    onSubmit: (d) => {
      const amount = round2(num(d.amount));
      if (!(amount > 0)) { toast("Enter an amount"); return false; }
      const undo = snapshot();
      if (mode === "add") { env.amount = round2(env.amount + amount); nookEarn("envelope"); }
      else if (mode === "release") env.amount = round2(Math.max(0, env.amount - amount));
      else addTx({ type: "expense", amount, name: (d.name || "").trim() || env.name, date: todayISO(), catId: guessCategory(env.name) || guessCategory(d.name || ""), effect: { envelopeId: env.id } });
      commit(mode === "spend" ? `Spent ${money(amount)} from ${env.name} — your available number didn't change` : "Envelope updated", undo);
    },
  });
}
function openMoneyBackForm() {
  openModal({
    title: "Money back",
    body: `<div class="form-grid">${field("What is it?", inp("name", "", 'required autofocus placeholder="Return running shoes" maxlength="80"'))}${field("Type", sel("kind", [["return", "Return"], ["refund", "Refund"], ["trial", "Free trial to cancel"]], "return"))}${field("Amount", moneyInp("amount", ""))}${field("Deadline", inp("due", addDays(todayISO(), 14), 'type="date"'))}${field("Note (optional)", inp("note", "", 'maxlength="120" placeholder="Order #, where to send it…"'), "full")}</div>`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Add</button>`,
    onSubmit: (d) => {
      if (!d.name.trim()) { toast("Add a name"); return false; }
      const undo = snapshot();
      S.moneyBack.push({ id: uid(), name: d.name.trim(), kind: d.kind, amount: round2(Math.max(0, num(d.amount))), due: d.due || todayISO(), note: d.note.trim(), status: "waiting" });
      commit("Added — we'll keep the deadline in sight", undo);
    },
  });
}

if (BAL) {
  // Navigation: the home screen is the daily number; add the balance-mode tools.
  const at = (id) => NAV.findIndex((n) => n.id === id);
  NAV.splice(at("budget") + 1, 0, { id: "envelopes", label: "Envelopes", icon: "envelope" });
  NAV.find((n) => n.id === "budget").icon = "chart";
  NAV.find((n) => n.id === "home").label = "Today";
  NAV.find((n) => n.id === "today").label = "Daily check-in";
  NAV.find((n) => n.id === "today").icon = "heart";
  NAV.splice(at("impulse"), 0, { id: "moneyback", label: "Money back", icon: "repeat", nf: true }, { id: "fees", label: "Fees check", icon: "bolt", nf: true });
  NAV.splice(at("settings"), 0, { id: "quickentry", label: "Apple Pay entry", icon: "download", nf: true });
  Object.assign(VIEWS, { envelopes: viewEnvelopes, moneyback: viewMoneyBack, fees: viewFees, quickentry: viewQuickEntry });
}
Object.assign(ACTIONS, {
  "fresh-start": () => openBalanceCheck(),
  afford: () => openAfford(),
  "toggle-breakdown": () => { ui.showBreakdown = !ui.showBreakdown; render(); },
  "collect-applepay": () => collectFromClipboard(),
  "add-envelope": () => openEnvelopeForm(),
  "edit-envelope": (el) => openEnvelopeForm(S.envelopes.find((e) => e.id === el.dataset.id)),
  "env-add": (el) => openEnvelopeMoney(S.envelopes.find((e) => e.id === el.dataset.id), "add"),
  "env-release": (el) => openEnvelopeMoney(S.envelopes.find((e) => e.id === el.dataset.id), "release"),
  "env-spend": (el) => openEnvelopeMoney(S.envelopes.find((e) => e.id === el.dataset.id), "spend"),
  "add-moneyback": () => openMoneyBackForm(),
  "mb-done": (el) => {
    const m = S.moneyBack.find((x) => x.id === el.dataset.id);
    if (!m) return;
    const undo = snapshot();
    m.status = el.dataset.s;
    if (m.status === "received" && m.amount > 0) m.txId = addTx({ type: "income", amount: m.amount, name: `Money back · ${m.name}`, date: todayISO(), catId: "income" }).id;
    commit(m.status === "received" ? `${money(m.amount)} back in your account 🎉` : "Trial cancelled — nice save", undo);
  },
  "mb-delete": (el) => { const undo = snapshot(); S.moneyBack = S.moneyBack.filter((x) => x.id !== el.dataset.id); commit("Removed", undo); },
  "fees-to-bill": (el) => openBillForm(null, { name: el.dataset.name, amount: Number(el.dataset.amount), freq: el.dataset.every === "week" ? "weekly" : "monthly", isSub: true }),
  "export-ics": () => { download(`${APP_NAME.replace(/\W+/g, "-")}-bills.ics`, billsICS(), "text/calendar"); toast("Calendar file downloaded — open it to add reminders"); },
});
