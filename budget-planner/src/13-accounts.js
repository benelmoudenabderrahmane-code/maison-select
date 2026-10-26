/* ==========================================================================
   Move to another device (share the backup file), and other accounts in
   balance mode: cash, savings and cards next to the spending account.
   ========================================================================== */

/* ---------- Send to my other device ---------- */
async function sendToDevice() {
  if (IS_DEMO) return toast("Moving devices is part of the full version");
  const name = `${APP_NAME.replace(/\s/g, "-").toLowerCase()}-backup-${todayISO()}.json`;
  const text = JSON.stringify(S, null, 1);
  S.settings.lastBackup = todayISO();
  saveNow();
  let file = null;
  try { file = new File([text], name, { type: "application/json" }); } catch { file = null; }
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${APP_NAME} backup`, text: `Open your planner on the other device → Settings → Restore backup, then choose this file.` });
      render();
      toast("Sent! On the other device: Settings → Restore backup");
      return;
    } catch (e) { if (e?.name === "AbortError") { render(); return; } }
  }
  download(name, text);
  render();
  openModal({
    title: "Move to another device",
    body: `<p class="muted">Your planner was saved as a file. Three small steps:</p>
      <ol class="steps-list mt">
        <li><b>Send the file to yourself</b> — AirDrop, email, WhatsApp, Google Drive or a USB stick.</li>
        <li><b>Open your planner on the other device</b> — the same private link or the offline file.</li>
        <li><b>Settings → Restore backup</b> and choose the file. Everything appears, exactly as here.</li>
      </ol>
      <p class="tiny mt">There's no account and no cloud: your budget only moves when you move it.</p>`,
    foot: `<button class="btn primary">Got it</button>`,
  });
}

/* ---------- Other accounts (balance mode) ---------- */
const ACCOUNT_KINDS = { cash: ["💵", "Cash"], savings: ["🐷", "Savings"], card: ["💳", "Credit card"], other: ["🏦", "Other account"] };
/** Money in other accounts that counts in today's number (never cards). */
function extraBalance() { return round2(sum((S.accounts || []).filter((x) => x.include && x.kind !== "card"), (x) => x.balance)); }
function accountsTotals() {
  const main = balanceNow();
  const have = round2(main + sum(S.accounts.filter((x) => x.kind !== "card"), (x) => x.balance));
  const owed = round2(sum(S.accounts.filter((x) => x.kind === "card"), (x) => x.balance));
  return { main, have, owed, net: round2(have - owed), counted: extraBalance() };
}
function viewAccounts() {
  const t = accountsTotals(), a = availableSummary();
  const row = (x) => {
    const [e, k] = ACCOUNT_KINDS[x.kind] || ACCOUNT_KINDS.other;
    return `<div class="card acct-card">
      <div class="card-head"><h3>${e} ${esc(x.name)}</h3><button class="btn ghost icon-btn" data-action="edit-account" data-id="${x.id}" aria-label="Edit ${esc(x.name)}">${icon("edit")}</button></div>
      <div class="fund-amt ${x.kind === "card" ? "neg" : ""}">${moneyHTML(x.balance)}</div>
      <p class="tiny">${k}${x.kind === "card" ? " · owed" : ""}${x.checkedOn ? ` · updated ${esc(fmtDay(x.checkedOn))}` : ""}</p>
      ${x.kind === "card" ? `<p class="tiny mt-s">Card payments come from your bills — add the payment as a bill or debt so it's protected.</p>`
        : `<label class="check mt-s"><input type="checkbox" data-input="acct-include" data-id="${x.id}" ${x.include ? "checked" : ""}> Count in today's number</label>`}
    </div>`;
  };
  return `
  ${pageHead("Accounts", "Your spending account powers today's number. Add cash, savings or cards to see everything in one place.", `<button class="btn primary" data-action="add-account">${icon("plus")}Add account</button>`)}
  <div class="grid g3">
    <div class="tile accent"><div class="label">Everything you have</div><div class="value">${moneyHTML(t.have)}</div><div class="sub">across ${plural(1 + S.accounts.filter((x) => x.kind !== "card").length, "account")}</div></div>
    <div class="tile ${t.owed ? "" : "good"}"><div class="label">Owed on cards</div><div class="value">${moneyHTML(t.owed)}</div><div class="sub">${t.owed ? "not part of today's number" : "nothing owed 🎉"}</div></div>
    <div class="tile good"><div class="label">Available until ${esc(fmtDay(a.h))}</div><div class="value">${moneyHTML(a.available)}</div><div class="sub">${t.counted ? `includes ${money(t.counted)} from other accounts` : "from your spending account"}</div></div>
  </div>
  <div class="grid g3 mt">
    <div class="card acct-card main">
      <div class="card-head"><h3>🌿 ${esc(S.account.name || "Spending account")}</h3><span class="tiny">Main</span></div>
      <div class="fund-amt">${moneyHTML(t.main)}</div>
      <div class="fresh-line tiny">${freshness(a)}</div>
      <button class="btn sm mt-s" data-action="fresh-start">Update balance</button>
    </div>
    ${S.accounts.map(row).join("")}
    <button class="card acct-add" data-action="add-account">${icon("plus", 22)}<span>Add cash, savings or a card</span></button>
  </div>
  <p class="tiny mt">Spending from cash? Track it as usual, then update the cash balance when you count it — your number stays right in between.</p>`;
}
function openAccountForm(acc = null) {
  const x = acc || { name: "", kind: "cash", balance: "", include: true };
  openModal({
    title: acc ? "Edit account" : "Add an account",
    body: `<div class="form-grid">
      ${field("Name", inp("name", x.name, 'placeholder="e.g. Cash wallet" maxlength="40" required autofocus'))}
      ${field("Type", sel("kind", Object.entries(ACCOUNT_KINDS).map(([k, [e, l]]) => [k, `${e} ${l}`]), x.kind))}
      ${field("Balance right now", moneyInp("balance", x.balance, 'min="0"'), "full", "for a card: what you owe")}
      <div class="full">${chk("include", x.include, "Count it in today's number (cash you can spend)")}</div>
    </div>`,
    foot: `${acc ? `<button type="button" class="btn danger left" data-del>${icon("trash")}Delete</button>` : ""}<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${acc ? "Save" : "Add"}</button>`,
    onSubmit: (d) => {
      const name = (d.name || "").trim();
      if (!name) { toast("Give it a name"); return false; }
      const rec = { name, kind: d.kind, balance: round2(Math.max(0, num(d.balance))), include: d.kind !== "card" && !!d.include, checkedOn: todayISO() };
      const undo = snapshot();
      if (acc) Object.assign(acc, rec); else S.accounts.push({ id: uid(), ...rec });
      commit(acc ? "Account saved" : `${name} added`, undo);
    },
    onMount: (form) => form.querySelector("[data-del]")?.addEventListener("click", () => {
      const undo = snapshot();
      S.accounts = S.accounts.filter((y) => y !== acc);
      closeModal();
      commit(`${acc.name} removed`, undo);
    }),
  });
}

/* ---------- Wiring ---------- */
if (BAL) {
  const at = (id) => NAV.findIndex((n) => n.id === id);
  NAV.splice(at("envelopes") + 1, 0, { id: "accounts", label: "Accounts", icon: "wallet" });
  VIEWS.accounts = viewAccounts;
}
Object.assign(ACTIONS, {
  "send-device": () => sendToDevice(),
  "add-account": () => openAccountForm(),
  "edit-account": (el) => openAccountForm(S.accounts.find((x) => x.id === el.dataset.id)),
});
Object.assign(INPUTS, {
  "acct-include": (el, ev) => { if (ev.type !== "change") return; const x = S.accounts.find((y) => y.id === el.dataset.id); if (x) { x.include = el.checked; commit(el.checked ? `${x.name} counts in today's number` : `${x.name} left out of today's number`); } },
});
