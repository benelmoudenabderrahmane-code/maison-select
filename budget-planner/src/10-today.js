/* ==========================================================================
   Today tools (balance mode): the animated number, the forecast until
   payday, "Just today" mode, the evening recap and "I forgot to log".
   ========================================================================== */

/* ---------- Animated number ---------- */
let tdShown = null; // last value the big number showed, so it only counts when it changes
function countUp() {
  const el = $(".avail[data-count]");
  if (!el) return;
  const to = Number(el.dataset.count), from = tdShown;
  tdShown = to;
  // Automated screenshots stay still unless a demo recording asks for motion.
  const still = S.settings.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator.webdriver && !window.__motionDemo);
  if (still || from === to) return;
  const start = from ?? 0, t0 = performance.now(), dur = from == null ? 1100 : 650;
  el.classList.add("counting");
  el.innerHTML = moneyHTML(start);
  const step = (t) => {
    if (!el.isConnected) return;
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.innerHTML = moneyHTML(k < 1 ? start + (to - start) * e : to);
    if (k < 1) requestAnimationFrame(step); else el.classList.remove("counting");
  };
  requestAnimationFrame(step);
}

/* ---------- Forecast until payday ---------- */
/** End-of-day balance from today to payday if you spend your daily guide and pay every bill on its date. */
function paydayForecast(a = availableSummary()) {
  if (a.confirmPayday || a.days <= 0 || a.checkedDays == null) return null;
  const pts = [], events = [];
  let bal = a.balance + (a.extra || 0);
  for (let i = 0; i <= a.days; i++) {
    const d = addDays(a.today, i);
    const due = a.due.filter((o) => (i === 0 ? o.date <= d : o.date === d));
    for (const o of due) bal -= o.amount;
    if (due.length) events.push({ i, d, items: due });
    if (i < a.days) bal -= i === 0 ? Math.max(0, a.leftToday) : a.guide;
    pts.push({ i, d, v: round2(bal) });
  }
  const low = pts.reduce((m, p) => (p.v < m.v ? p : m), pts[0]);
  return { start: a.balance + (a.extra || 0), pts, events, low, end: pts.at(-1).v, pay: a.pay.occ ? a.pay.occ.amount : 0, h: a.h };
}
function forecastChart(f) {
  // The line stretches with the card (SVG without aspect ratio); dots and labels are HTML so they stay round and readable.
  const W = 1000, H = 100;
  const n = f.pts.length;
  const vals = [f.start, ...f.pts.map((p) => p.v)];
  const lo = Math.min(0, ...vals), hi = Math.max(...vals) * 1.04 || 1;
  const xp = (i) => ((i + 0.5) / n) * 100; // percent
  const yp = (v) => (1 - (v - lo) / (hi - lo || 1)) * 100;
  const line = [[0, yp(f.start)], ...f.pts.map((p) => [xp(p.i), yp(p.v)])];
  const path = line.map(([px, py], i) => `${i ? "L" : "M"}${(px * W / 100).toFixed(1)} ${py.toFixed(2)}`).join(" ");
  const area = `${path} L${(xp(n - 1) * W / 100).toFixed(1)} ${H} L0 ${H} Z`;
  const zero = lo < 0 ? `<line class="fc-zero" x1="0" x2="${W}" y1="${yp(0).toFixed(2)}" y2="${yp(0).toFixed(2)}" vector-effect="non-scaling-stroke"/>` : "";
  const pos = (i, v) => `left:${xp(i).toFixed(2)}%;top:${yp(v).toFixed(2)}%`;
  const marks = f.events.map((e) => {
    const p = f.pts[e.i];
    const tip = e.items.map((o) => `${o.name} ${money(o.amount)}`).join(", ");
    return `<span class="fc-ev" style="${pos(e.i, p.v)}" title="${esc(`${fmtDay(e.d)}: ${tip}`)}"><em>${esc(e.items.map((o) => o.emoji || "•").slice(0, 2).join(""))}</em></span>`;
  }).join("");
  const low = f.low.v < f.start && !f.events.some((e) => e.i === f.low.i) ? `<span class="fc-low" style="${pos(f.low.i, f.low.v)}"></span>` : "";
  const pay = `<span class="fc-pay" style="left:${xp(n - 1).toFixed(2)}%"><b>${f.pay ? `Payday +${esc(moneyRound(f.pay))}` : S.account.irregular ? "Stretch ends" : "Payday"}</b></span>`;
  const ticks = [...new Set([0, Math.floor((n - 1) / 2), n - 1])].map((i) => `<span style="left:${xp(i).toFixed(2)}%">${i === 0 ? "Today" : esc(fmtDay(f.pts[i].d))}</span>`).join("");
  return `<div class="fc-plot" role="img" aria-label="Your balance until payday: lowest ${esc(money(f.low.v))} on ${esc(fmtDay(f.low.d))}">
    <svg class="fc-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".24"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#fcFill)"/>${zero}<path class="fc-line" d="${path}" vector-effect="non-scaling-stroke"/>
    </svg>${pay}${marks}${low}
  </div>
  <div class="fc-x" aria-hidden="true">${ticks}</div>`;
}
function forecastCard(a) {
  const f = paydayForecast(a);
  if (!f) return "";
  const dip = f.low.v < 0;
  return `<div class="card fc-card focus-hide">
    <div class="card-head"><h2>${icon("chart", 20)} ${S.account.irregular ? "Until the stretch ends" : "Until payday"}</h2><span class="tiny">If you spend your daily guide</span></div>
    <div class="fc-stats">
      <div><span class="tiny">Lowest point</span><b class="m ${dip ? "neg" : ""}">${money(f.low.v)}</b><small>${esc(relShort(f.low.d))}</small></div>
      <div><span class="tiny">Bills on the way</span><b class="m">${money(a.bills)}</b><small>${plural(a.due.length, "payment")}</small></div>
      <div><span class="tiny">${S.account.irregular ? "Left at the end" : "Left on payday"}</span><b class="m">${money(f.end)}</b><small>${S.account.irregular ? `on ${esc(fmtDay(f.h))}` : `before your pay${f.pay ? ` of ${esc(moneyRound(f.pay))}` : ""}`}</small></div>
    </div>
    <div class="fc-chart">${forecastChart(f)}</div>
    <p class="tiny mt-s">${dip ? "Your account dips below zero before payday — move a bill or an envelope, or update your balance." : "Your account stays above zero all the way to payday. Envelopes and your buffer are still in it."}</p>
  </div>`;
}

/* ---------- Evening recap & closing streak ---------- */
function closedStreak() {
  let n = 0, d = todayISO();
  if (!S.dayClosed[d]) d = addDays(d, -1);
  while (S.dayClosed[d]) { n++; d = addDays(d, -1); }
  return n;
}
const todaysSpends = (today) => S.transactions.filter((t) => t.date === today && t.type === "expense" && !t.link);
function tomorrowGuide(a) {
  return a.days > 1 ? Math.floor((a.available * 100) / (a.days - 1)) / 100 : null;
}
function recapCard(a, force = false) {
  if (a.confirmPayday || a.checkedDays == null) return "";
  const closed = !!S.dayClosed[a.today];
  if (!force && !closed && new Date().getHours() < 17) return "";
  const list = todaysSpends(a.today), st = closedStreak(), tg = tomorrowGuide(a);
  const dots = Array.from({ length: 7 }, (_, i) => addDays(a.today, i - 6)).map((d) => `<i class="${S.dayClosed[d] ? "on" : ""} ${d === a.today ? "now" : ""}" title="${esc(fmtDay(d))}">${DOW[fromISO(d).getDay()][0]}</i>`).join("");
  const verdict = !list.length ? "A no-spend day 🌿" : a.leftToday >= 0 ? "You stayed within today's guide ✨" : `${money(-a.leftToday)} over today's guide — tomorrow adjusts, no stress.`;
  const delta = tg != null ? round2(tg - a.guide) : 0;
  const tomorrow = tg == null ? "Payday is tomorrow 🎉" : `Tomorrow: <b class="m">${money(tg)}</b> a day${delta > 0 ? ` <span class="pos">(+${money(delta)} thanks to today)</span>` : ""}`;
  return `<div class="card recap ${closed ? "closed" : ""}">
    <div class="card-head"><h2>${closed ? `${icon("check", 20)} Day closed` : `${icon("moon", 20)} Your day`}</h2><div class="recap-dots" aria-label="Days closed this week">${dots}</div></div>
    ${closed ? `<p>${verdict} ${tomorrow}.</p>` : `
    <div class="recap-sum"><b class="m">${money(a.spentToday)}</b><span>spent today · ${plural(list.length, "spend")} · guide ${money(a.guide)}</span></div>
    <p class="mt-s">${verdict}</p>
    <p class="tiny mt-s">${tomorrow}.</p>`}
    <div class="row wrap mt">
      ${closed ? `<span class="tiny">🔥 ${plural(st, "day")} in a row</span><button class="link-btn" data-action="day-reopen">Reopen</button>`
        : `<button class="btn primary sm" data-action="day-close">${icon("check")}Close my day</button><button class="btn sm" data-action="forgot">I forgot something</button>${st ? `<span class="tiny">🔥 ${plural(st, "day")} in a row</span>` : ""}`}
    </div>
  </div>`;
}

/* ---------- Just today ---------- */
function homeJustToday(a, parts) {
  const list = todaysSpends(a.today).slice().sort(by((t) => -(t.createdAt || 0)));
  return `
  <div class="sage just-today">
  ${pageHead(parts.hello, fmtLong(a.today), `<button class="btn" data-action="just-today">${icon("eye", 18)}Show everything</button>`)}
  ${stretchBanner(a)}
  ${a.confirmPayday && a.pay.occ ? `<div class="fresh-banner"><div><b>Is it payday?</b><span>Mark your ${esc(a.pay.occ.name.toLowerCase())} received to see your next period.</span></div><button class="btn primary sm" data-action="toggle-occ" data-key="${esc(a.pay.occ.key)}">Mark received · ${money(a.pay.occ.amount)}</button></div>` : ""}
  ${NOOK ? nookScene({ a, inner: parts.numberHTML + parts.actionsHTML }) : `<div class="card hero-avail">${parts.numberHTML}${parts.actionsHTML}</div>`}
  ${headsUp(a)}
  <div class="sage-grid jt-grid">
    <div class="card">
      <div class="card-head"><h2>${icon("list", 20)} Today</h2><button class="link-btn" data-action="forgot">Forgot to log something?</button></div>
      ${parts.oneTapHTML}
      ${list.length ? `<div class="list mt">${list.map((t) => `<button class="li jt-li" data-action="edit-tx" data-id="${t.id}"><div class="name">${esc(catById(t.catId)?.emoji || "🧾")} ${esc(t.name)}</div><div class="amt m">${money(t.amount)}</div></button>`).join("")}</div>`
        : `<p class="muted mt">Nothing tracked yet today. That's okay — one tap when you spend.</p>`}
    </div>
    ${recapCard(a, true)}
  </div>
  </div>`;
}

/* ---------- I forgot to log ---------- */
function openForgot() {
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const dayOpts = days.map((d, i) => [d, i === 0 ? "Today" : i === 1 ? "Yesterday" : `${DOW[fromISO(d).getDay()]} ${fmtDay(d)}`]);
  const row = (i, date) => `<div class="fg-row">${sel(`d${i}`, dayOpts, date, 'aria-label="Day"')}${moneyInp(`a${i}`, "", `aria-label="Amount"${i === 0 ? " autofocus" : ""}`)}${inp(`n${i}`, "", 'placeholder="What was it?" maxlength="80" aria-label="What was it?"')}${sel(`c${i}`, catOptions(true), "", 'aria-label="Category"')}</div>`;
  let count = 4;
  const checked = S.account.checkedOn;
  const hint = BAL && checked && days.some((d) => d < checked) ? `<p class="tiny mt">Spends dated before your last balance check (${esc(fmtDay(checked))}) are saved for your history only — they're already in that balance, so today's number stays the same.</p>` : "";
  const form = openModal({
    title: "I forgot to log…",
    wide: true,
    body: `<p class="muted">Add a few spends at once. Empty rows are skipped.</p>
      <div class="fg-head tiny" aria-hidden="true"><span>Day</span><span>Amount</span><span>What</span><span>Category</span></div>
      <div class="fg-rows">${Array.from({ length: count }, (_, i) => row(i, addDays(today, -1))).join("")}</div>
      <button type="button" class="btn sm mt" data-more>${icon("plus")}Another row</button>${hint}`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Add spends</button>`,
    onSubmit: (d) => {
      const rows = [];
      for (let i = 0; i < count; i++) {
        const amount = num(d[`a${i}`]);
        if (amount > 0) rows.push({ amount, name: (d[`n${i}`] || "").trim(), date: d[`d${i}`] || today, catId: d[`c${i}`] || "" });
      }
      if (!rows.length) { toast("Enter at least one amount"); return false; }
      const undo = snapshot();
      for (const r of rows) {
        const catId = r.catId || guessCategory(r.name);
        const rec = { type: "expense", amount: r.amount, date: r.date, catId, name: r.name || catById(catId)?.name || "Spend", note: "Added later" };
        if (BAL && checked && r.date < checked) rec.absorbed = true;
        addTx(rec);
      }
      commit(`${plural(rows.length, "spend")} added`, undo);
    },
  });
  form.querySelector("[data-more]").addEventListener("click", () => {
    const box = form.querySelector(".fg-rows");
    box.insertAdjacentHTML("beforeend", row(count, box.lastElementChild?.querySelector("select")?.value || addDays(today, -1)));
    box.lastElementChild.querySelector("input").focus();
    count++;
  });
}

/* ---------- Wiring ---------- */
if (BAL) {
  const baseRender = render;
  render = function () { baseRender(); countUp(); };
}
Object.assign(ACTIONS, {
  "just-today": () => {
    S.settings.justToday = !S.settings.justToday;
    ui.view = "home";
    if (location.hash !== "#home") location.hash = "#home";
    commit(S.settings.justToday ? "Just today — everything else can wait" : "Showing everything");
  },
  "day-close": () => {
    const today = todayISO();
    const a = availableSummary();
    S.dayClosed[today] = { g: a.guide, s: a.spentToday }; // remembered for the "stay within the guide" challenge
    S.checkins[today] = true;
    const cutoff = addDays(today, -400);
    for (const k of Object.keys(S.dayClosed)) if (k < cutoff) delete S.dayClosed[k];
    nookEarn("close");
    if (NOOK) nookPending = { ...(nookPending || { mood: "cheer" }), say: "Day closed. Rest easy — I'll keep an eye on the bills 🍯" };
    const st = closedStreak();
    commit(st > 1 ? `🔥 ${st} days closed in a row` : "Day closed. See you tomorrow!");
  },
  "day-reopen": () => { delete S.dayClosed[todayISO()]; commit("Day reopened"); },
  forgot: () => openForgot(),
});
