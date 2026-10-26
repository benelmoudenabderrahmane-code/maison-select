/* ==========================================================================
   Actions: forms, click handlers, inputs, import/export
   ========================================================================== */

function commit(msg, undo) {
  save();
  checkBadges();
  render();
  if (msg) toast(msg, undo ? { undo } : {});
}
/** Snapshot-based undo: simple and always correct. */
function snapshot() {
  const snap = JSON.stringify(S);
  return () => { S = migrate(JSON.parse(snap)); save(); render(); };
}

/* ---------- Quick add / edit transaction ---------- */
function openTxForm(tx = null, preset = {}) {
  const t = tx || { type: "expense", amount: preset.amount ?? "", name: preset.name || "", date: preset.date || todayISO(), catId: preset.catId || "", note: "" };
  let type = t.type === "saving" ? "saving" : t.type;
  const freq = frequentSpends();
  const fundOpts = S.funds.map((f) => [f.id, `${f.emoji} ${f.name}`]);
  const locked = !!t.link;
  const body = () => `
    ${!tx && freq.length ? `<div class="chips" style="margin-bottom:14px">${freq.slice(0, 4).map((f, i) => `<button type="button" class="chip" data-repeat="${i}">${esc(catById(f.catId)?.emoji || "")} ${esc(f.name)} · ${money(f.amount)}</button>`).join("")}</div>` : ""}
    ${locked ? `<div class="banner" style="margin-bottom:14px">This was created by checking off a scheduled item. Delete it to un-check.</div>` : ""}
    <div class="seg" style="margin-bottom:14px" ${locked ? "hidden" : ""}>${[["expense", "Spend"], ["income", "Income"], ["saving", "Savings"]].map(([v, l]) => `<button type="button" class="${type === v ? "on" : ""}" data-type="${v}">${l}</button>`).join("")}</div>
    <div class="money-input">${moneyInp("amount", t.amount === "" ? "" : Math.abs(t.amount), 'required autofocus aria-label="Amount"')}</div>
    <div class="mt" data-part="cats" ${type !== "expense" ? "hidden" : ""}>
      <div class="cat-grid">${S.categories.map((c) => `<button type="button" class="chip ${t.catId === c.id ? "on" : ""}" data-cat="${c.id}" style="${catStyle(c)}"><span class="e">${esc(c.emoji)}</span>${esc(c.name)}</button>`).join("")}</div>
    </div>
    <div class="mt" data-part="fund" ${type !== "saving" ? "hidden" : ""}>${fundOpts.length ? field("Which fund?", sel("fundId", fundOpts, t.effect?.fundId)) : `<p class="tiny">Create a savings fund first to track transfers into it.</p>`}</div>
    <input type="hidden" name="catId" value="${esc(t.catId || "")}">
    <div class="form-grid mt">
      ${field("Name", inp("name", t.name, 'placeholder="e.g. Coffee run" maxlength="80"'))}
      ${field("Date", inp("date", t.date, 'type="date" required'))}
      ${field("Notes (optional)", `<textarea class="input" name="note" placeholder="Anything worth remembering" style="min-height:60px">${esc(t.note || "")}</textarea>`, "full")}
    </div>`;
  const form = openModal({
    title: tx ? "Edit entry" : "Track a spend",
    body: body(),
    foot: `${tx ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${tx ? "Save" : "Add"}</button>`,
    onSubmit: (d) => {
      const amount = num(d.amount);
      if (!(amount > 0)) { toast("Enter an amount above zero"); return false; }
      if (type === "saving" && !d.fundId) { toast("Pick a fund"); return false; }
      const cat = catById(d.catId);
      const rec = {
        type, amount, date: d.date || todayISO(), note: d.note.trim(),
        name: d.name.trim() || (type === "income" ? "Income" : type === "saving" ? "Savings transfer" : cat?.name || "Spend"),
        catId: type === "income" ? "income" : type === "saving" ? "savings" : d.catId,
      };
      if (type === "saving") rec.effect = { fundId: d.fundId };
      if (tx) {
        if (tx.link) rec.type = tx.type, rec.catId = tx.catId, rec.effect = tx.effect;
        const undo = snapshot();
        updateTx(tx.id, rec);
        commit("Saved", undo);
      } else {
        const undo = snapshot();
        addTx(rec);
        preset.onAdded?.();
        commit(`${type === "income" ? "Income" : type === "saving" ? "Transfer" : "Spend"} added — ${money(amount)}`, undo);
        if (type === "expense") nudgeIfOver(rec.catId, monthKey(rec.date));
      }
    },
  });
  form.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-type]");
    if (tb) {
      type = tb.dataset.type;
      $$("[data-type]", form).forEach((b) => b.classList.toggle("on", b === tb));
      $("[data-part=cats]", form).hidden = type !== "expense";
      $("[data-part=fund]", form).hidden = type !== "saving";
    }
    const cb = e.target.closest("[data-cat]");
    if (cb) {
      $$("[data-cat]", form).forEach((b) => b.classList.toggle("on", b === cb));
      form.catId.value = cb.dataset.cat;
      if (!form.name.value) form.name.placeholder = catById(cb.dataset.cat)?.name || "";
    }
    const rb = e.target.closest("[data-repeat]");
    if (rb) {
      const f = freq[Number(rb.dataset.repeat)];
      form.amount.value = f.amount;
      form.name.value = f.name;
      form.catId.value = f.catId;
      $$("[data-cat]", form).forEach((b) => b.classList.toggle("on", b.dataset.cat === f.catId));
    }
    if (e.target.closest("[data-del]")) {
      const undo = snapshot();
      removeTx(tx.id);
      closeModal();
      commit("Deleted", undo);
    }
  });
}
function nudgeIfOver(catId, mk) {
  const c = S.categories.find((x) => x.id === catId);
  if (!c) return;
  const plan = catAvailable(c, mk), spent = catSpent(c.id, mk);
  if (plan > 0 && spent > plan) setTimeout(() => toast(`Heads up: ${c.name} is ${money(spent - plan)} over budget this month`), 400);
  else if (plan > 0 && spent > plan * 0.85) setTimeout(() => toast(`${c.name}: ${money(plan - spent)} left this month`), 400);
}

/* ---------- Bills ---------- */
function openBillForm(bill = null, preset = {}) {
  const b = bill || { name: preset.name || "", amount: preset.amount ?? "", catId: "", freq: preset.freq || "monthly", anchor: preset.date || todayISO(), autopay: false, isSub: !!preset.isSub, emoji: "" };
  openModal({
    title: bill ? "Edit bill" : "Add a bill",
    body: `<div class="form-grid">
      ${field("Name", inp("name", b.name, 'required placeholder="e.g. Rent, Netflix"'), "full")}
      ${field("Amount", moneyInp("amount", b.amount, "required"))}
      ${field("Category", sel("catId", catOptions(true), b.catId))}
      ${field("How often", sel("freq", freqOptions(), b.freq))}
      ${field(bill ? "First / next due date" : "Next due date", inp("anchor", b.anchor, 'type="date" required'))}
      ${field("Emoji", inp("emoji", b.emoji, 'maxlength="4" placeholder="🧾"'))}
      ${field("Ends on", inp("endDate", b.endDate || "", 'type="date"'), "", "optional")}
      <div class="full row wrap" style="gap:18px">${chk("autopay", b.autopay, "Autopay")}${chk("isSub", b.isSub, "This is a subscription")}</div>
    </div>`,
    foot: `${bill ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${bill ? "Save" : "Add bill"}</button>`,
    onSubmit: (d) => {
      if (!d.name.trim() || !(num(d.amount) > 0)) { toast("Add a name and an amount"); return false; }
      const undo = snapshot();
      const rec = { name: d.name.trim(), amount: round2(num(d.amount)), catId: d.catId, freq: d.freq, anchor: d.anchor || todayISO(), emoji: d.emoji.trim(), endDate: d.endDate || "", autopay: d.autopay, isSub: d.isSub };
      if (!rec.catId && rec.isSub) rec.catId = S.categories.find((c) => /subscri/i.test(c.name))?.id || "";
      if (bill) Object.assign(bill, rec); else S.bills.push({ id: uid(), ...rec });
      commit(bill ? "Bill updated" : `${rec.name} added — it's on your calendar`, undo);
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const undo = snapshot();
      S.bills = S.bills.filter((x) => x !== bill);
      closeModal();
      commit("Bill deleted (past payments stay in your log)", undo);
    }),
  });
}

/* ---------- Income ---------- */
function openIncomeForm(inc = null, preset = {}) {
  const i = inc || { name: "Paycheck", amount: "", freq: "biweekly", anchor: preset.date || todayISO(), emoji: "💰" };
  openModal({
    title: inc ? "Edit income" : "Add income",
    body: `<div class="form-grid">
      ${field("Name", inp("name", i.name, 'required placeholder="Paycheck, side hustle…"'))}
      ${field("Amount (after tax)", moneyInp("amount", i.amount, "required"))}
      ${field("How often", sel("freq", freqOptions(), i.freq))}
      ${field(inc ? "A payday date" : "Next payday", inp("anchor", i.anchor, 'type="date" required'))}
      ${field("Emoji", inp("emoji", i.emoji, 'maxlength="4"'))}
      ${field("Ends on", inp("endDate", i.endDate || "", 'type="date"'), "", "optional")}
    </div><p class="tiny mt">Variable income? Use your lowest typical paycheck — anything extra is a bonus.</p>`,
    foot: `${inc ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${inc ? "Save" : "Add income"}</button>`,
    onSubmit: (d) => {
      if (!(num(d.amount) > 0)) { toast("Add an amount"); return false; }
      const undo = snapshot();
      const rec = { name: d.name.trim() || "Income", amount: round2(num(d.amount)), freq: d.freq, anchor: d.anchor || todayISO(), emoji: d.emoji.trim() || "💰", endDate: d.endDate || "" };
      if (inc) Object.assign(inc, rec); else S.incomes.push({ id: uid(), ...rec });
      commit(inc ? "Income updated" : "Income added — paydays are on your calendar", undo);
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const undo = snapshot();
      S.incomes = S.incomes.filter((x) => x !== inc);
      closeModal();
      commit("Income removed", undo);
    }),
  });
}

/* ---------- Debts ---------- */
function anchorForDay(day) {
  const mk = monthKey(todayISO());
  const [y, m] = mk.split("-").map(Number);
  return `${mk}-${pad(Math.min(clamp(Number(day) || 1, 1, 31), daysInMonth(y, m - 1)))}`;
}
function openDebtForm(debt = null) {
  const d0 = debt || { name: "", balance: "", apr: "", minimum: "", anchor: anchorForDay(15) };
  openModal({
    title: debt ? "Edit debt" : "Add a debt",
    body: `<div class="form-grid">
      ${field("Name", inp("name", d0.name, 'required placeholder="Visa card, car loan…"'), "full")}
      ${field("Current balance", moneyInp("balance", d0.balance, "required"))}
      ${field("Interest rate (APR %)", inp("apr", d0.apr, 'type="number" step="0.01" min="0" max="100" placeholder="e.g. 22.9"'))}
      ${field("Minimum payment / month", moneyInp("minimum", d0.minimum))}
      ${field("Due day of month", inp("day", Number(d0.anchor.slice(8)), 'type="number" min="1" max="31"'))}
      ${debt ? field("Original amount", moneyInp("original", d0.original), "", "for your progress bar") : ""}
    </div>`,
    foot: `${debt ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${debt ? "Save" : "Add debt"}</button>`,
    onSubmit: (d) => {
      if (!d.name.trim()) { toast("Give it a name"); return false; }
      const undo = snapshot();
      const rec = { name: d.name.trim(), balance: round2(num(d.balance)), apr: num(d.apr), minimum: round2(num(d.minimum)) };
      const day = clamp(Number(d.day) || 1, 1, 31);
      if (debt) {
        // Keep the original anchor's month so past payments keep matching their dates.
        const [y, m] = debt.anchor.slice(0, 7).split("-").map(Number);
        rec.anchor = `${debt.anchor.slice(0, 7)}-${pad(Math.min(day, daysInMonth(y, m - 1)))}`;
        rec.original = round2(num(d.original)) || Math.max(debt.original || 0, rec.balance);
        Object.assign(debt, rec);
      } else S.debts.push({ id: uid(), ...rec, original: rec.balance, anchor: anchorForDay(day) });
      commit(debt ? "Debt updated" : "Debt added — your payoff plan is ready", undo);
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const undo = snapshot();
      S.debts = S.debts.filter((x) => x !== debt);
      closeModal();
      commit("Debt removed", undo);
    }),
  });
}
function openDebtPay(debt) {
  openModal({
    title: `Extra payment — ${debt.name}`,
    body: `<div class="money-input">${moneyInp("amount", "", "required autofocus")}</div><div class="form-grid mt">${field("Date", inp("date", todayISO(), 'type="date"'))}${field("Note", inp("note", "", 'placeholder="Optional"'))}</div>`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Record payment</button>`,
    onSubmit: (d) => {
      const amount = num(d.amount);
      if (!(amount > 0)) return false;
      const undo = snapshot();
      addTx({ type: "expense", catId: "debt", name: `${debt.name} extra payment`, amount, date: d.date || todayISO(), note: d.note, effect: { debtId: debt.id } });
      const done = debt.balance <= 0;
      commit(`Payment recorded — ${money(debt.balance)} left`, undo);
      if (done) celebrate("🕊️", `${debt.name} is paid off!`, "One less thing on your mind.");
    },
  });
}

/* ---------- Funds ---------- */
function openFundForm(fund = null) {
  const f = fund || { name: "", emoji: "🐷", target: "", saved: 0, monthly: "", freq: "monthly", anchor: todayISO(), targetDate: "", hue: 205 };
  const hues = [205, 150, 345, 265, 36, 14, 175, 300];
  openModal({
    title: fund ? "Edit fund" : "New savings fund",
    body: `<div class="form-grid">
      ${field("Name", inp("name", f.name, 'required placeholder="Emergency fund, Trip to Lisbon…"'))}
      ${field("Emoji", inp("emoji", f.emoji, 'maxlength="4"'))}
      ${field("Target amount", moneyInp("target", f.target))}
      ${field("Already saved", moneyInp("saved", f.saved))}
      ${field("Automatic transfer", moneyInp("monthly", f.monthly), "", "optional")}
      ${field("How often", sel("freq", freqOptions(["weekly", "biweekly", "semimonthly", "monthly"]), f.freq || "monthly"))}
      ${field("Next transfer date", inp("anchor", f.anchor, 'type="date"'))}
      ${field("Reach it by", inp("targetDate", f.targetDate || "", 'type="date"'), "", "optional")}
      <div class="field full"><span>Colour</span><div class="swatches">${hues.map((h) => `<label><input type="radio" name="hue" value="${h}" class="sr-only" ${Number(f.hue) === h ? "checked" : ""}><span class="swatch ${Number(f.hue) === h ? "on" : ""}" style="display:inline-block"><span style="background:hsl(${h} 58% 62%)"></span></span></label>`).join("")}</div></div>
    </div>`,
    foot: `${fund ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${fund ? "Save" : "Create fund"}</button>`,
    onSubmit: (d) => {
      if (!d.name.trim()) { toast("Give your fund a name"); return false; }
      const undo = snapshot();
      const rec = { name: d.name.trim(), emoji: d.emoji.trim() || "🐷", target: round2(num(d.target)), saved: round2(num(d.saved)), monthly: round2(num(d.monthly)), freq: d.freq, anchor: d.anchor || todayISO(), targetDate: d.targetDate || "", hue: Number(d.hue) || 205 };
      if (fund) Object.assign(fund, rec); else S.funds.push({ id: uid(), ...rec });
      commit(fund ? "Fund updated" : "Fund created 🐷", undo);
    },
    onMount: (form) => {
      form.addEventListener("change", (e) => {
        if (e.target.name === "hue") $$(".swatch", form).forEach((s) => s.classList.toggle("on", s.previousElementSibling === e.target));
      });
      form.querySelector("[data-del]")?.addEventListener("click", () => {
        const undo = snapshot();
        S.funds = S.funds.filter((x) => x !== fund);
        closeModal();
        commit("Fund deleted", undo);
      });
    },
  });
}
function openFundMoney(fund, mode) {
  openModal({
    title: `${mode === "add" ? "Add to" : "Withdraw from"} ${fund.name}`,
    body: `<div class="money-input">${moneyInp("amount", "", "required autofocus")}</div><div class="form-grid mt">${field("Date", inp("date", todayISO(), 'type="date"'))}${field("Note", inp("note", "", 'placeholder="Optional"'))}</div>
      <p class="tiny mt">${mode === "add" ? "This counts as money set aside, so it lowers this month's safe to spend." : "Withdrawals add the money back into this month's safe to spend."}</p>`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${mode === "add" ? "Add money" : "Withdraw"}</button>`,
    onSubmit: (d) => {
      let amount = num(d.amount);
      if (!(amount > 0)) return false;
      if (mode === "withdraw") amount = -Math.min(amount, fund.saved);
      const before = fund.target > 0 ? fund.saved / fund.target : 0;
      const undo = snapshot();
      addTx({ type: "saving", catId: "savings", name: `${mode === "add" ? "Transfer to" : "Withdrawal from"} ${fund.name}`, amount, date: d.date || todayISO(), note: d.note, effect: { fundId: fund.id } });
      const after = fund.target > 0 ? fund.saved / fund.target : 0;
      commit(`${fund.name}: ${money(fund.saved)}`, undo);
      const hit = [1, 0.75, 0.5, 0.25].find((m) => before < m && after >= m);
      if (hit) celebrate(hit === 1 ? "🦋" : "🎉", hit === 1 ? `${fund.name} is fully funded!` : `${fund.name} is ${hit * 100}% there!`, "Look at you go.");
    },
  });
}

/* ---------- Categories ---------- */
function openCatForm(cat = null) {
  const c = cat || { name: "", emoji: "✨", group: "wants", budget: "", hue: CAT_HUES[S.categories.length % CAT_HUES.length], rollover: false };
  openModal({
    title: cat ? "Edit category" : "New category",
    body: `<div class="form-grid">
      ${field("Name", inp("name", c.name, 'required'))}
      ${field("Emoji", inp("emoji", c.emoji, 'maxlength="4"'))}
      ${field("Group", sel("group", [["needs", "Needs"], ["wants", "Wants"]], c.group))}
      ${field("Monthly budget", moneyInp("budget", c.budget))}
      <div class="field full"><span>Colour</span><input type="range" class="hue-range" name="hue" min="0" max="359" value="${c.hue}"></div>
      <div class="full">${chk("rollover", c.rollover, "Roll unspent money into next month ↻")}</div>
    </div>`,
    foot: `${cat ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${cat ? "Save" : "Add category"}</button>`,
    onSubmit: (d) => {
      if (!d.name.trim()) return false;
      const undo = snapshot();
      const rec = { name: d.name.trim(), emoji: d.emoji.trim() || "✨", group: d.group, budget: round2(num(d.budget)), hue: Number(d.hue), rollover: d.rollover, edited: true };
      if (cat) Object.assign(cat, rec); else S.categories.push({ id: uid(), ...rec });
      commit(cat ? "Category updated" : "Category added", undo);
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const used = S.transactions.some((t) => t.catId === cat.id);
      const undo = snapshot();
      S.categories = S.categories.filter((x) => x !== cat);
      closeModal();
      commit(used ? "Category deleted — its past spends are now uncategorised" : "Category deleted", undo);
    }),
  });
}

/* ---------- Goals ---------- */
function openGoalForm(goal = null) {
  const g = goal || { name: "", emoji: "🎯", why: "", targetDate: "", status: "not", fundId: "", steps: [] };
  openModal({
    title: goal ? "Edit goal" : "New goal",
    body: `<div class="form-grid">
      ${field("Goal", inp("name", g.name, 'required placeholder="Be debt-free by summer"'))}
      ${field("Emoji", inp("emoji", g.emoji, 'maxlength="4"'))}
      ${field("Why it matters to you", inp("why", g.why, 'placeholder="So I can sleep without money worries"'), "full")}
      ${field("Target date", inp("targetDate", g.targetDate, 'type="date"'))}
      ${field("Status", sel("status", [["not", "Not started"], ["progress", "In progress"], ["done", "Done"]], g.status))}
      ${field("Linked savings fund", sel("fundId", [["", "— None —"], ...S.funds.map((f) => [f.id, `${f.emoji} ${f.name}`])], g.fundId), "full")}
      ${!goal ? field("First steps", `<textarea class="input" name="steps" placeholder="One per line, e.g.&#10;Open a savings account&#10;Set up auto-transfer"></textarea>`, "full") : ""}
    </div>`,
    foot: `${goal ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${goal ? "Save" : "Add goal"}</button>`,
    onSubmit: (d) => {
      if (!d.name.trim()) return false;
      const undo = snapshot();
      const rec = { name: d.name.trim(), emoji: d.emoji.trim() || "🎯", why: d.why.trim(), targetDate: d.targetDate, status: d.status, fundId: d.fundId };
      if (goal) Object.assign(goal, rec);
      else S.goals.push({ id: uid(), ...rec, steps: (d.steps || "").split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({ text, done: false })) });
      commit(goal ? "Goal updated" : "Goal added 🌈", undo);
      if (rec.status === "done" && goal?.status !== "done") confetti();
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const undo = snapshot();
      S.goals = S.goals.filter((x) => x !== goal);
      closeModal();
      commit("Goal deleted", undo);
    }),
  });
}

/* ---------- CSV ---------- */
const csvCell = (v) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = "'" + s; // keep spreadsheets from running it as a formula
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function exportCSV() {
  const rows = [["Date", "Type", "Category", "Name", "Amount", "Note"]];
  for (const t of [...S.transactions].sort(by((t) => t.date))) rows.push([t.date, t.type, catById(t.catId)?.name || "", t.name, t.amount.toFixed(2), t.note || ""]);
  download(`${APP_NAME.replace(/\s/g, "-").toLowerCase()}-transactions-${todayISO()}.csv`, rows.map((r) => r.map(csvCell).join(",")).join("\n"), "text/csv");
  toast("Transactions exported");
}
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  // Use the delimiter the header line actually uses, so "1.234,56" survives in ;-separated files.
  const head = text.slice(0, text.search(/\r?\n|$/));
  const delim = [";", "\t", ","].map((d) => [d, head.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
/** Bank amounts: "1,234.56", "1.234,56", "-12,5", "(45.00)", "€ 12" … → number. */
function parseAmount(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return 0;
  const negative = /^\(.*\)$/.test(s) || /^-|-$|^−/.test(s.replace(/[^\d\-−().,]/g, ""));
  s = s.replace(/[^\d.,]/g, "");
  const lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (lastComma >= 0) s = /,\d{3}$/.test(s) && s.indexOf(",") === lastComma && s.length > 4 ? s.replace(",", "") : s.replace(/,/g, ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? (negative ? -n : n) : 0;
}
const DATE_RE = /^(\d{1,2})([\/.-])(\d{1,2})\2(\d{2,4})/;
/** Work out whether a file writes dates day-first (most of the world) or month-first (US). */
function dateOrder(values) {
  let dmy = 0, mdy = 0, dots = 0;
  for (const v of values) {
    const m = String(v).trim().match(DATE_RE);
    if (!m) continue;
    if (Number(m[1]) > 12) dmy++;
    if (Number(m[3]) > 12) mdy++;
    if (m[2] === "." || m[2] === "-") dots++;
  }
  if (dmy && !mdy) return "dmy";
  if (mdy && !dmy) return "mdy";
  return dots ? "dmy" : "mdy";
}
function normDate(s, order = "mdy") {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(DATE_RE);
  if (m) {
    let [, a, , b, y] = m;
    if (y.length === 2) y = "20" + y;
    const [mo, d] = order === "dmy" ? [b, a] : [a, b];
    if (Number(mo) > 12 || Number(d) > 31) return "";
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  const d = new Date(s);
  return isNaN(d) ? "" : toISO(d);
}
function importCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return toast("That file looks empty");
  const head = rows[0].map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const col = (...names) => head.findIndex((h) => names.some((n) => h.includes(n)));
  // English first, then common bank-export headers in French, Spanish, German, Dutch, Italian and Portuguese.
  const ci = {
    date: col("date", "datum", "fecha", "data"),
    name: col("name", "description", "payee", "merchant", "memo", "details", "libelle", "omschrijving", "concepto", "beschreibung", "verwendungszweck", "descrizione", "descricao"),
    amount: col("amount", "value", "sum", "montant", "bedrag", "importe", "betrag", "importo", "valor"),
    cat: col("category", "categorie", "kategorie", "categoria"),
    type: col("type"),
    note: col("note", "notiz", "nota"),
  };
  const debit = col("debit", "withdrawal", "soll", "cargo"), credit = col("credit", "deposit", "haben", "abono");
  if (ci.date < 0 || (ci.amount < 0 && debit < 0)) return toast("Couldn't find Date and Amount columns");
  const body = rows.slice(1);
  // If the file uses signed amounts (bank style), negative = money out, positive = money in.
  // If every amount is positive, treat them all as spending.
  const signed = ci.amount >= 0 && body.some((r) => parseAmount(r[ci.amount]) < 0);
  const order = dateOrder(body.map((r) => r[ci.date]));
  const undo = snapshot();
  let n = 0;
  for (const r of body) {
    const date = normDate(r[ci.date] || "", order);
    if (!date) continue;
    let amount = ci.amount >= 0 ? parseAmount(r[ci.amount]) : parseAmount(r[credit]) - parseAmount(r[debit]);
    let type = (r[ci.type] || "").trim().toLowerCase();
    if (!["expense", "income", "saving"].includes(type)) type = (ci.amount < 0 || signed) && amount > 0 ? "income" : "expense";
    amount = Math.abs(amount);
    if (!amount) continue;
    let catId = type === "income" ? "income" : "";
    const catName = (r[ci.cat] || "").trim();
    if (type === "expense" && catName) {
      let c = S.categories.find((x) => x.name.toLowerCase() === catName.toLowerCase());
      if (!c) { c = { id: uid(), name: catName, emoji: "✨", group: "wants", budget: 0, hue: CAT_HUES[S.categories.length % CAT_HUES.length], rollover: false }; S.categories.push(c); }
      catId = c.id;
    }
    if (type === "saving") catId = "savings";
    S.transactions.push({ id: uid(), createdAt: Date.now() + n, type, catId, name: (r[ci.name] || "").trim().slice(0, 80) || "Imported", amount: round2(amount), date, note: (r[ci.note] || "").trim() });
    n++;
  }
  commit(`Imported ${plural(n, "transaction")}`, undo);
}

/* ---------- Backup ---------- */
function exportJSON() {
  if (IS_DEMO) return toast("Backups are part of the full version");
  S.settings.lastBackup = todayISO();
  saveNow();
  download(`${APP_NAME.replace(/\s/g, "-").toLowerCase()}-backup-${todayISO()}.json`, JSON.stringify(S, null, 1));
  render();
  toast("Backup saved — keep it somewhere safe");
}
function importJSON(text) {
  let data;
  try { data = JSON.parse(text); } catch { return toast("That isn't a valid backup file"); }
  if (!data || !Array.isArray(data.transactions) || !data.profile) return toast("That isn't a backup from this planner");
  confirmBox("Restore this backup?", `It has ${plural(data.transactions.length, "transaction")}. Everything currently in the planner will be replaced.`, "Restore", () => {
    S = migrate(data);
    S.onboarded = true;
    saveNow();
    applyTheme();
    render();
    toast("Backup restored");
  });
}

/* ---------- Click actions ---------- */
const ACTIONS = {
  go: (el) => go(el.dataset.view),
  "set-month": (el) => { ui.month = el.dataset.mk; render(); },
  "cal-month": (el) => { ui.calMonth = el.dataset.mk; ui.calSel = el.dataset.mk === monthKey(todayISO()) ? todayISO() : monthStart(el.dataset.mk); render(); },
  "cal-day": (el) => { ui.calSel = el.dataset.date; if (monthKey(el.dataset.date) !== ui.calMonth) ui.calMonth = monthKey(el.dataset.date); render(); },
  "open-month": (el) => { ui.month = el.dataset.mk; go("home"); },
  year: (el) => { ui.year = Number(el.dataset.v); render(); },
  "quick-add": (el) => openTxForm(null, { date: el.dataset.date }),
  "edit-tx": (el) => { const t = S.transactions.find((x) => x.id === el.dataset.id); if (t) openTxForm(t); },
  "toggle-occ": (el) => {
    const o = occByKey(el.dataset.key);
    if (!o) return;
    const undo = snapshot();
    const on = toggleOccurrence(o);
    commit(on ? `${o.kind === "income" ? "Received" : "Paid"}: ${o.name}` : "Unchecked", undo);
    if (on && o.kind === "debt") { const d = S.debts.find((x) => x.id === o.refId); if (d && d.balance <= 0) celebrate("🕊️", `${d.name} is paid off!`); }
  },
  "repeat-spend": (el) => {
    const f = frequentSpends()[Number(el.dataset.i)];
    if (!f) return;
    const undo = snapshot();
    addTx({ type: "expense", name: f.name, catId: f.catId, amount: f.amount, date: todayISO() });
    commit(`Added ${f.name} — ${money(f.amount)}`, undo);
    nudgeIfOver(f.catId, monthKey(todayISO()));
  },
  "toggle-nospend": (el) => {
    const d = el.dataset.date;
    const spent = S.transactions.some((t) => t.date === d && t.type === "expense" && !t.link);
    if (!S.noSpend[d] && spent) return toast("You tracked a spend that day — no worries, tomorrow's a new one!");
    if (S.noSpend[d]) delete S.noSpend[d]; else { S.noSpend[d] = true; S.checkins[todayISO()] = true; }
    commit(S.noSpend[d] ? "No-spend day logged 🧘" : "");
  },
  checkin: () => { S.checkins[todayISO()] = true; commit(); const st = streak(); toast(st > 1 ? `🔥 ${st}-day streak!` : "Checked in. See you tomorrow!"); },
  mood: (el) => { S.moods[todayISO()] = el.dataset.mood; S.checkins[todayISO()] = true; commit(); },
  "add-bill": (el) => openBillForm(null, { date: el.dataset.date }),
  "edit-bill": (el) => openBillForm(S.bills.find((x) => x.id === el.dataset.id)),
  "sub-review": (el) => { const b = S.bills.find((x) => x.id === el.dataset.id); b.review = { undefined: "keep", keep: "cancel", cancel: undefined }[b.review]; if (!b.review) delete b.review; commit(); },
  "add-income": (el) => openIncomeForm(null, { date: el.dataset.date }),
  "edit-income": (el) => openIncomeForm(S.incomes.find((x) => x.id === el.dataset.id)),
  "add-debt": () => openDebtForm(),
  "edit-debt": (el) => openDebtForm(S.debts.find((x) => x.id === el.dataset.id)),
  "debt-pay": (el) => openDebtPay(S.debts.find((x) => x.id === el.dataset.id)),
  "debt-strategy": (el) => { ui.debtStrategy = el.dataset.v; render(); },
  "add-fund": () => openFundForm(),
  "edit-fund": (el) => openFundForm(S.funds.find((x) => x.id === el.dataset.id)),
  "fund-money": (el) => openFundMoney(S.funds.find((x) => x.id === el.dataset.id), el.dataset.mode),
  "add-cat": () => openCatForm(),
  "edit-cat": (el) => openCatForm(S.categories.find((x) => x.id === el.dataset.id)),
  "budget-scope": (el) => { ui.budgetScope = el.dataset.v; render(); },
  "tx-type": (el) => { ui.txType = el.dataset.v; render(); },
  "tx-cat": (el) => { ui.txCat = el.dataset.v; render(); },
  "tx-sort": (el) => { const k = el.dataset.k; ui.txSort = { k, dir: ui.txSort.k === k ? -ui.txSort.dir : k === "name" || k === "cat" ? 1 : -1 }; render(); },
  "copy-budget": () => {
    const prev = addMonths(ui.month, -1);
    const undo = snapshot();
    S.budgets[ui.month] = Object.fromEntries(S.categories.map((c) => [c.id, budgetFor(c, prev)]));
    commit(`Copied ${monthName(prev)}'s budget into ${monthName(ui.month)}`, undo);
  },
  "add-goal": () => openGoalForm(),
  "edit-goal": (el) => openGoalForm(S.goals.find((x) => x.id === el.dataset.id)),
  "goal-status": (el) => {
    const g = S.goals.find((x) => x.id === el.dataset.id);
    g.status = { not: "progress", progress: "done", done: "not" }[g.status] || "progress";
    commit();
    if (g.status === "done") celebrate(g.emoji || "🎉", `${g.name} — done!`, "You did the thing.");
  },
  "goal-step": (el) => {
    const g = S.goals.find((x) => x.id === el.dataset.id);
    const s = g.steps[Number(el.dataset.i)];
    s.done = !s.done;
    if (g.status === "not" && s.done) g.status = "progress";
    commit();
    if (s.done && g.steps.every((x) => x.done)) toast("All steps done — mark the goal as achieved? Tap its status pill ✨");
  },
  "seg-radio": (el) => {
    const label = el.closest("label");
    label.querySelector("input").checked = true;
    $$("button", label.parentElement).forEach((b) => b.classList.toggle("on", b === el));
  },
  "wish-skip": (el) => {
    const w = S.wishlist.find((x) => x.id === el.dataset.id);
    const undo = snapshot();
    w.decision = "skipped";
    w.decidedAt = Date.now();
    S.skippedTotal = round2((S.skippedTotal || 0) + w.price);
    commit("", undo);
    celebrate("💎", `You kept ${money(w.price)}`, "Future you says thank you.");
  },
  "wish-buy": (el) => {
    const w = S.wishlist.find((x) => x.id === el.dataset.id);
    openTxForm(null, { amount: w.price, name: w.name, onAdded: () => { w.decision = "bought"; w.decidedAt = Date.now(); } });
  },
  "wish-delete": (el) => { const undo = snapshot(); S.wishlist = S.wishlist.filter((x) => x.id !== el.dataset.id); commit("Removed", undo); },
  set: (el) => { S.settings[el.dataset.key] = el.dataset.v; applyTheme(); commit(); },
  palette: (el) => { const p = PALETTES.find((x) => x.id === el.dataset.id); Object.assign(S.settings, { palette: p.id, h: p.h, s: p.s }); applyTheme(); commit(); },
  "toggle-theme": () => { S.settings.theme = isDark() ? "light" : "dark"; applyTheme(); commit(); },
  "toggle-privacy": () => { S.settings.privacy = !S.settings.privacy; applyTheme(); commit(); },
  "toggle-focus": () => { S.settings.focus = !S.settings.focus; applyTheme(); commit(S.settings.focus ? "Focus mode on — just the essentials" : "Focus mode off"); },
  "export-json": exportJSON,
  "import-json": () => pickFile(".json,application/json", importJSON),
  "export-csv": exportCSV,
  "import-csv": () => pickFile(".csv,text/csv", importCSV),
  print: () => window.print(),
  "load-sample": () => confirmBox("Load sample data?", "This replaces what's in the planner with a realistic example so you can explore every feature. You can erase it any time in Settings.", "Load sample", () => { loadSample(); toast("Sample data loaded — have a look around!"); }, false),
  reset: () => confirmBox("Erase everything?", "This permanently deletes all your data from this browser. Make a backup first if you might want it back.", "Erase all data", () => {
    const keep = { ...S.settings };
    S = freshState();
    S.settings = { ...S.settings, ...keep, lastBackup: null };
    saveNow();
    applyTheme();
    go("setup");
    openOnboarding();
  }),
  more: () => openMoreSheet(),
};

/* ---------- Inputs (change / input events) ---------- */
let notesTimer;
const INPUTS = {
  notes: (el) => { clearTimeout(notesTimer); notesTimer = setTimeout(() => { S.notes = el.value; save(); }, 300); },
  name: (el, ev) => { if (ev.type === "change") { S.profile.name = el.value.trim(); commit(); } },
  currency: (el) => { S.profile.currency = el.value; _fmtCache = {}; commit("Currency updated"); },
  weekStart: (el) => { S.profile.weekStart = Number(el.value); commit(); },
  buffer: (el, ev) => { if (ev.type === "change") { S.profile.buffer = Math.max(0, num(el.value)); commit(); } },
  hue: (el, ev) => { S.settings.h = Number(el.value); S.settings.palette = "custom"; applyTheme(); if (ev.type === "change") commit(); },
  sat: (el, ev) => { S.settings.s = Number(el.value); applyTheme(); if (ev.type === "change") commit(); },
  celebrate: (el) => { S.settings.celebrate = el.checked; commit(); },
  focus: (el) => { S.settings.focus = el.checked; applyTheme(); commit(); },
  privacy: (el) => { S.settings.privacy = el.checked; applyTheme(); commit(); },
  "cat-budget": (el, ev) => {
    if (ev.type !== "change") return;
    const c = S.categories.find((x) => x.id === el.dataset.id);
    const v = Math.max(0, num(el.value));
    if (ui.budgetScope === "month") (S.budgets[ui.month] ||= {})[c.id] = v;
    else { c.budget = v; c.edited = true; for (const mk in S.budgets) if (mk >= ui.month) delete S.budgets[mk][c.id]; }
    commit();
  },
  "debt-extra": (el) => { ui.debtExtra = Number(el.value); $("#debt-planner").innerHTML = debtPlanner(); $("#debt-kpis").innerHTML = debtKpis(); $("#debt-planner input[type=range]")?.focus(); },
  "goal-step-add": (el, ev) => {
    if (ev.type !== "change" || !el.value.trim()) return;
    const g = S.goals.find((x) => x.id === el.dataset.id);
    (g.steps ||= []).push({ text: el.value.trim(), done: false });
    commit();
  },
};

/* ---------- More sheet (mobile) ---------- */
function openMoreSheet() {
  openModal({
    title: "Menu",
    body: `<div class="sheet-nav">${NAV.filter((n) => n.id && !(S.settings.focus && n.nf)).map((n) => `<a href="#${n.id}" class="${ui.view === n.id ? "active" : ""}" data-close>${icon(n.icon)}${n.label}</a>`).join("")}</div>
      <div class="row wrap mt"><button type="button" class="btn sm" data-action="toggle-theme">${icon(isDark() ? "sun" : "moon")}${isDark() ? "Day" : "Night"} mode</button><button type="button" class="btn sm" data-action="toggle-privacy">${icon("eye")}Privacy</button><button type="button" class="btn sm" data-action="toggle-focus">${icon("focus")}Focus</button><button type="button" class="btn sm" data-action="search" data-close>${icon("search")}Search</button></div>`,
  });
}

/* ---------- Onboarding ---------- */
function openOnboarding(step = 0) {
  const steps = [
    {
      title: `Welcome to ${APP_NAME} ✨`,
      body: `<p class="muted">A calm, beginner-friendly money planner built for busy (and ADHD) brains. No spreadsheets, no shame — just a clear answer to <b>“what can I safely spend?”</b></p>
        <div class="stack mt" style="gap:8px"><div class="nudge"><span class="e">⏱️</span><div>Setup takes about 3 minutes. You can skip anything.</div></div><div class="nudge"><span class="e">🔒</span><div>Your data stays private in this browser. No account needed.</div></div></div>`,
      foot: `<button type="button" class="btn left" data-ob="sample">${icon("sparkle")}Explore with sample data</button><button class="btn primary">Set up my planner</button>`,
    },
    {
      title: "About you",
      body: `<div class="form-grid">${field("What should we call you?", inp("name", S.profile.name, 'placeholder="Your first name" autofocus'))}${field("Your currency", sel("currency", CURRENCIES.map(([c, n]) => [c, `${n} — ${c}`]), S.profile.currency))}</div>`,
      foot: `<button type="button" class="btn left" data-ob="skip">Skip</button><button class="btn primary">Next</button>`,
    },
    SKIN.balance ? {
      title: "Your money right now",
      body: `<p class="muted" style="margin-bottom:14px">Open your banking app. Your daily number starts from what's really in your account — expected pay only counts once it arrives.</p>
        <div class="form-grid">${field("Balance in your spending account", moneyInp("balance", "", 'autofocus min="-10000000"'), "full")}${field("Amount per paycheck", moneyInp("amount", ""))}${field("How often", sel("freq", freqOptions(["weekly", "biweekly", "semimonthly", "monthly"]), "biweekly"))}${field("Next payday", inp("anchor", addDays(todayISO(), 7), 'type="date"'), "full")}</div>
        <div class="mt">${chk("irregular", false, "My income is irregular (freelance, tips, gig work) — I'll choose how long my money lasts")}</div>`,
      foot: `<button type="button" class="btn left" data-ob="skip">Skip for now</button><button class="btn primary">Next</button>`,
    } : {
      title: "Your paycheck",
      body: `<p class="muted" style="margin-bottom:14px">This powers your paycheck plan and safe-to-spend number. Use the amount that lands in your account.</p>
        <div class="form-grid">${field("Amount per paycheck", moneyInp("amount", "", 'autofocus'))}${field("How often", sel("freq", freqOptions(["weekly", "biweekly", "semimonthly", "monthly"]), "biweekly"))}${field("Next payday", inp("anchor", addDays(todayISO(), 7), 'type="date"'), "full")}</div>`,
      foot: `<button type="button" class="btn left" data-ob="skip">Skip for now</button><button class="btn primary">Next</button>`,
    },
    {
      title: "You're ready 🎉",
      body: `<p class="muted">Next up: follow the <b>Getting started</b> checklist — add your bills, check your budget, and track your first spend.</p><div class="nudge mt"><span class="e">💡</span><div>Press <span class="kbd">N</span> anywhere (or tap <b>+</b>) to track a spend in seconds.</div></div>`,
      foot: `<button class="btn primary">Let's go</button>`,
    },
  ];
  const st = steps[step];
  const form = openModal({
    title: st.title,
    body: `<div class="tiny" style="margin-bottom:12px">Step ${step + 1} of ${steps.length}</div>${st.body}`,
    foot: st.foot,
    onSubmit: (d) => {
      if (step === 1) { S.profile.name = (d.name || "").trim(); S.profile.currency = d.currency; _fmtCache = {}; }
      if (step === 2 && SKIN.balance && d.irregular) { S.account.irregular = true; S.account.horizon = addDays(todayISO(), 14); }
      if (step === 2 && num(d.amount) > 0 && !d.irregular) S.incomes.push({ id: uid(), name: "Paycheck", emoji: "💰", amount: round2(num(d.amount)), freq: d.freq, anchor: d.anchor || todayISO(), endDate: "", primary: true });
      if (step === 2 && SKIN.balance && String(d.balance ?? "").trim() !== "") checkBalance(num(d.balance));
      if (step === steps.length - 1) { S.onboarded = true; saveNow(); go("setup"); render(); return; }
      saveNow();
      setTimeout(() => openOnboarding(step + 1), 10);
    },
  });
  form.querySelector("[data-ob=skip]")?.addEventListener("click", () => openOnboarding(step + 1));
  form.querySelector("[data-ob=sample]")?.addEventListener("click", () => { closeModal(); loadSample(); go("home"); toast("Sample data loaded — have a look around!"); });
}
