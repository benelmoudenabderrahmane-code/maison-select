/* ==========================================================================
   Search everything (K or Ctrl/⌘+K), heads-up reminders on the balance
   home, and gentle money challenges.
   ========================================================================== */

/* ---------- Search everything ---------- */
function searchAll(q) {
  const s = q.trim().toLowerCase();
  if (!s) return { groups: [], tx: [] };
  const has = (...v) => v.some((x) => String(x || "").toLowerCase().includes(s));
  const amt = /^[\d.,]+$/.test(s) ? parseAmount(s) : NaN;
  const tx = S.transactions
    .filter((t) => has(t.name, t.note, catById(t.catId)?.name) || (amt > 0 && Math.abs(t.amount - amt) < 0.005))
    .sort(by((t) => (t.date === undefined ? "" : t.date))).reverse();
  const groups = [];
  const add = (label, items) => { if (items.length) groups.push({ label, items: items.slice(0, 6) }); };
  add("Pages", NAV.filter((n) => n.id && VIEWS[n.id] && has(n.label)).map((n) => ({ go: n.id, ic: n.icon, name: n.label, sub: "Open page" })));
  add("Bills & subscriptions", S.bills.filter((b) => has(b.name, b.note)).map((b) => ({ act: "edit-bill", id: b.id, ic: "receipt", name: `${b.emoji || ""} ${b.name}`.trim(), sub: FREQS[b.freq] || "Bill", amt: -b.amount })));
  if (BAL) add("Envelopes", S.envelopes.filter((e) => has(e.name)).map((e) => ({ act: "edit-envelope", id: e.id, ic: "envelope", name: `${e.emoji || "✉️"} ${e.name}`, sub: "Envelope", amt: e.amount })));
  add("Goals & savings", [...S.goals.filter((g) => has(g.name)).map((g) => ({ act: "edit-goal", id: g.id, ic: "target", name: `${g.emoji || ""} ${g.name}`.trim(), sub: "Goal" })),
    ...S.funds.filter((f) => has(f.name)).map((f) => ({ go: "savings", ic: "piggy", name: `${f.emoji || ""} ${f.name}`.trim(), sub: "Savings fund" }))]);
  if (BAL) add("Money back", S.moneyBack.filter((m) => has(m.name, m.note)).map((m) => ({ go: "moneyback", ic: "repeat", name: m.name, sub: m.status === "waiting" ? `Waiting · by ${fmtDay(m.due)}` : "Done", amt: m.amount })));
  add("Spends & income", tx.slice(0, 8).map((t) => ({ act: "edit-tx", id: t.id, ic: t.type === "income" ? "wallet" : "receipt", name: `${catById(t.catId)?.emoji || ""} ${t.name}`.trim(), sub: fmtDay(t.date), amt: t.type === "income" ? t.amount : -t.amount })));
  return { groups, tx };
}
function openSearch(q = "") {
  let flat = [], sel = 0, last = null;
  const draw = (form) => {
    const r = searchAll(form.querySelector("[name=q]").value);
    last = r;
    flat = r.groups.flatMap((g) => g.items);
    sel = Math.min(sel, Math.max(0, flat.length - 1));
    let i = 0;
    const total = sum(r.tx.filter((t) => t.type === "expense"), (t) => t.amount);
    form.querySelector(".gs-res").innerHTML = !form.querySelector("[name=q]").value.trim()
      ? `<p class="tiny gs-hint">Try a shop, a category, a bill or an amount like <b>12.50</b>.</p>`
      : flat.length ? r.groups.map((g) => `<div class="gs-group"><div class="gs-label">${esc(g.label)}</div>${g.items.map((it) => `<button type="button" class="gs-item ${i === sel ? "on" : ""}" data-gs="${i++}">${icon(it.ic, 17)}<span class="gs-name">${esc(it.name)}<small>${esc(it.sub || "")}</small></span>${it.amt != null ? `<b class="m">${money(it.amt)}</b>` : ""}</button>`).join("")}</div>`).join("")
        + (r.tx.length ? `<button type="button" class="gs-all" data-gs-all>${plural(r.tx.length, "entry", "entries")} match${total ? ` · ${money(total)} spent` : ""} — see them all in Transactions</button>` : "")
        : `<p class="muted gs-hint">Nothing found. Check the spelling, or search a smaller word.</p>`;
  };
  const open = (it) => {
    closeModal();
    if (!it) return;
    if (it.go) go(it.go);
    else ACTIONS[it.act]?.({ dataset: { id: it.id } });
  };
  openModal({
    title: "Search everything",
    body: `<div class="search-box gs-box"><input class="input" name="q" value="${esc(q)}" placeholder="Search spends, bills, envelopes, goals, pages…" autocomplete="off" autofocus aria-label="Search"><span>${icon("search", 18)}</span></div><div class="gs-res mt" role="listbox"></div>`,
    onSubmit: () => { open(flat[sel]); return false; },
    onMount: (form) => {
      const input = form.querySelector("[name=q]");
      input.focus(); // right away, so fast typing after K isn't lost
      draw(form);
      input.addEventListener("input", () => { sel = 0; draw(form); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          sel = clamp(sel + (e.key === "ArrowDown" ? 1 : -1), 0, Math.max(0, flat.length - 1));
          draw(form);
          form.querySelector(".gs-item.on")?.scrollIntoView({ block: "nearest" });
        }
      });
      form.querySelector(".gs-res").addEventListener("click", (e) => {
        const b = e.target.closest("[data-gs]");
        if (b) return open(flat[Number(b.dataset.gs)]);
        if (e.target.closest("[data-gs-all]")) { ui.txQuery = input.value.trim(); closeModal(); go("transactions"); }
      });
    },
  });
}

/* ---------- Heads-up reminders (balance home) ---------- */
function headsUp(a) {
  const out = [];
  const soon = addDays(a.today, 1);
  for (const o of a.due.filter((x) => x.date <= soon).slice(0, 3)) {
    const when = o.date < a.today ? `was due ${relDay(o.date).toLowerCase()}` : o.date === a.today ? "is due today" : "is due tomorrow";
    out.push({ e: o.date < a.today ? "⏰" : "🔔", cls: o.date < a.today ? "late" : "", html: `<b>${esc(o.name)}</b> ${when} · <b class="m">${money(o.amount)}</b>`, btn: `<button class="btn sm" data-action="toggle-occ" data-key="${esc(o.key)}">${icon("check", 15)}Paid</button>` });
  }
  for (const m of S.moneyBack.filter((x) => x.status === "waiting" && x.due && diffDays(a.today, x.due) <= 3).slice(0, 2)) {
    const d = diffDays(a.today, m.due);
    out.push({ e: "↩️", html: `<b>${esc(m.name)}</b> — ${d < 0 ? "deadline passed" : d === 0 ? "last day today" : `${plural(d, "day")} left`}`, btn: `<a class="btn sm" href="#moneyback">Open</a>` });
  }
  const lb = S.settings.lastBackup;
  if (!IS_DEMO && S.transactions.length >= 10 && (!lb || diffDays(lb, a.today) >= 14)) {
    out.push({ e: "💾", html: `${lb ? `Last backup ${plural(diffDays(lb, a.today), "day")} ago.` : "No backup yet."} Your budget lives only in this browser — save a copy.`, btn: `<button class="btn sm" data-action="export-json">${icon("download", 15)}Back up</button>` });
  }
  if (!S.settings.icsDone && S.bills.length >= 3 && !IS_DEMO) {
    out.push({ e: "📅", html: "Get a reminder the day before each bill — add them to your phone's calendar.", btn: `<button class="btn sm" data-action="export-ics">Add to calendar</button><button class="btn ghost sm" data-action="ics-later" aria-label="Not now">${icon("x", 15)}</button>` });
  }
  if (!out.length) return "";
  return `<div class="heads-up" role="region" aria-label="Heads up">${out.slice(0, 4).map((n) => `<div class="hu ${n.cls || ""}"><span class="hu-e" aria-hidden="true">${n.e}</span><span class="hu-t">${n.html}</span><span class="hu-b">${n.btn}</span></div>`).join("")}</div>`;
}

/* ---------- Challenges ---------- */
const isTakeout = (t) => /deliver|doordash|uber ?eats|deliveroo|grubhub|just ?eat|takeaway|takeout/i.test(t.name) || /dining/i.test(catById(t.catId)?.name || "");
const spendsOn = (d) => S.transactions.filter((t) => t.date === d && t.type === "expense" && !t.link);
const CHALLENGES = [
  { id: "nospend3", e: "🧺", name: "3 no-spend days", desc: "Have 3 days this week without a single spend. Bills don't count.", len: 7, need: 3, reward: 10, test: (d) => !spendsOn(d).length },
  { id: "guide5", e: "🍯", name: "Within the guide", desc: "Close 5 days out of 7 at or under your daily guide.", len: 7, need: 5, reward: 15, test: (d) => !!S.dayClosed[d] && typeof S.dayClosed[d] === "object" && S.dayClosed[d].s <= S.dayClosed[d].g + 0.004 },
  { id: "coffee7", e: "☕", name: "Coffee at home", desc: "One week with no coffee-shop or treat spends.", len: 7, need: 7, reward: 12, test: (d) => !spendsOn(d).some((t) => /coffee|treat/i.test(catById(t.catId)?.name || "") || /coffee|cafe|café|latte|starbucks/i.test(t.name)) },
  { id: "log7", e: "✍️", name: "Track every day", desc: "Open your planner and track or close your day 7 days in a row.", len: 7, need: 7, reward: 10, test: (d) => !!(S.checkins[d] || S.dayClosed[d]) },
  { id: "takeout14", e: "🥡", name: "No takeout fortnight", desc: "Two weeks without delivery apps or eating out.", len: 14, need: 14, reward: 20, test: (d) => !spendsOn(d).some(isTakeout) },
];
const challengeById = (id) => CHALLENGES.find((c) => c.id === id);
/** Day-by-day status of a challenge. Past days are final; today counts once the day is closed (or already met for "track every day"). */
function challengeProgress(cur = S.challenge, today = todayISO()) {
  const c = cur && challengeById(cur.id);
  if (!c) return null;
  const days = Array.from({ length: c.len }, (_, i) => addDays(cur.start, i)).map((d) => {
    if (d > today) return { d, st: "future" };
    const ok = c.test(d);
    if (d < today) return { d, st: ok ? "ok" : "miss" };
    return { d, st: ok && (S.dayClosed[d] || c.id === "log7") ? "ok" : "today" };
  });
  const ok = days.filter((x) => x.st === "ok").length;
  const open = days.filter((x) => x.st === "future" || x.st === "today").length;
  return { c, start: cur.start, days, ok, open, done: ok >= c.need, failed: ok + open < c.need, end: addDays(cur.start, c.len - 1) };
}
function challengeDots(p) {
  return `<div class="ch-dots">${p.days.map((x) => `<i class="${x.st}" title="${esc(fmtDay(x.d))}">${x.st === "ok" ? "✓" : DOW[fromISO(x.d).getDay()][0]}</i>`).join("")}</div>`;
}
function challengeCard(p, compact = false) {
  const { c } = p;
  const state = p.done ? `<p class="ch-state good">Challenge complete! ${NOOK ? `Claim your ${c.reward} honey drops.` : "Claim your badge."}</p>`
    : p.failed ? `<p class="ch-state">Not this time — that's okay. Every try teaches you something.</p>`
    : `<p class="tiny">${p.ok} of ${c.need} done · ends ${esc(fmtDay(p.end))}</p>`;
  const btn = p.done ? `<button class="btn primary sm" data-action="ch-claim">${NOOK ? `Claim ${c.reward} 🍯` : "Claim"}</button>`
    : p.failed ? `<button class="btn sm" data-action="ch-start" data-id="${c.id}">Try again</button><button class="link-btn" data-action="ch-stop">Pick another</button>`
    : compact ? `<a class="link-sm" href="#challenges">Details</a>` : `<button class="link-btn" data-action="ch-stop">Stop this challenge</button>`;
  return `<div class="card ch-card ${p.done ? "done" : ""}">
    <div class="card-head"><h2><span class="ch-e">${c.e}</span> ${esc(c.name)}</h2>${compact ? `<span class="tiny">Challenge</span>` : ""}</div>
    ${compact ? "" : `<p class="muted">${esc(c.desc)}</p>`}
    ${challengeDots(p)}
    ${state}
    <div class="row wrap mt-s">${btn}</div>
  </div>`;
}
function viewChallenges() {
  const p = challengeProgress();
  const doneCount = (id) => S.challengesDone.filter((x) => x.id === id).length;
  return `
  ${pageHead("Challenges", "One small, kind challenge at a time. Finish it to earn a reward — miss a day and simply try again.")}
  ${p ? challengeCard(p) : `<div class="card">${empty("🌱", "No challenge running", "Pick one below — they last one or two weeks.")}</div>`}
  <div class="grid g3 mt">${CHALLENGES.filter((c) => c.id !== p?.c.id).map((c) => `<div class="card ch-pick">
      <div class="ch-e big">${c.e}</div>
      <h3>${esc(c.name)}</h3>
      <p class="tiny">${esc(c.desc)}</p>
      <div class="row between mt"><span class="tiny">${plural(c.len, "day")}${NOOK ? ` · ${c.reward} 🍯` : ""}${doneCount(c.id) ? ` · done ${doneCount(c.id)}×` : ""}</span><button class="btn sm" data-action="ch-start" data-id="${c.id}">${p ? "Switch" : "Start"}</button></div>
    </div>`).join("")}</div>
  <p class="tiny mt">${S.challengesDone.length ? `🏆 ${plural(S.challengesDone.length, "challenge")} completed so far.` : "Your completed challenges will be counted here."}</p>`;
}

/* ---------- Wiring ---------- */
if (BAL) {
  const at = (id) => NAV.findIndex((n) => n.id === id);
  NAV.splice(at("impulse") + 1, 0, { id: "challenges", label: "Challenges", icon: "leaf", nf: true });
  VIEWS.challenges = viewChallenges;
}
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); openSearch(); return; }
  if (!typing && k === "k" && !e.metaKey && !e.ctrlKey && !e.altKey && !$(".overlay")) { e.preventDefault(); openSearch(); }
});
const baseIcs = ACTIONS["export-ics"];
if (baseIcs) ACTIONS["export-ics"] = (el, e) => { const r = baseIcs(el, e); if (!S.settings.icsDone) { S.settings.icsDone = true; commit(); } return r; };
Object.assign(ACTIONS, {
  search: () => openSearch(),
  "ics-later": () => { S.settings.icsDone = true; commit(); },
  "ch-start": (el) => {
    const c = challengeById(el.dataset.id);
    if (!c) return;
    S.challenge = { id: c.id, start: todayISO() };
    if (NOOK) nookPending = { mood: "cheer", say: `${c.name}? Let's do it together! ${c.e}` };
    commit(`${c.e} ${c.name} started — ${plural(c.len, "day")} to go`);
  },
  "ch-stop": () => { S.challenge = null; commit("Challenge stopped"); },
  "ch-claim": () => {
    const p = challengeProgress();
    if (!p?.done) return;
    S.challengesDone.push({ id: p.c.id, end: todayISO() });
    S.challenge = null;
    if (NOOK) { S.nook.drops = (S.nook.drops || 0) + p.c.reward; nookPending = { mood: "cheer", text: `+${p.c.reward} 🍯`, say: "You did it! I'm so proud of you." }; }
    commit();
    celebrate(p.c.e, `${p.c.name} — done!`, NOOK ? `+${p.c.reward} honey drops` : "Another kind habit, unlocked.");
  },
});
