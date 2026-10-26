/* ==========================================================================
   Irregular income (balance mode): no fixed payday — freelance, tips or gig
   work. You choose how long the money in your account has to last.
   ========================================================================== */
const IRREG = () => BAL && !!S.account.irregular;
function stretchChoices(today = todayISO()) {
  return [
    ["7", "1 week", addDays(today, 7)],
    ["14", "2 weeks", addDays(today, 14)],
    ["28", "4 weeks", addDays(today, 28)],
    ["eom", "End of month", monthEnd(monthKey(today)) > today ? monthEnd(monthKey(today)) : monthEnd(monthKey(addDays(today, 1)))],
  ];
}
/** The home banner when a stretch is over. */
function stretchBanner(a) {
  if (!IRREG() || !a.pay.ended) return "";
  return `<div class="fresh-banner"><div><b>Your stretch is over 🌱</b><span>How long should the money in your account last now? Update your balance first if money came in.</span></div><button class="btn primary sm" data-action="pay-style">Plan next stretch</button></div>`;
}
function openPayStyle() {
  const today = todayISO();
  let irregular = !!S.account.irregular;
  const cur = S.account.horizon && S.account.horizon > today ? S.account.horizon : addDays(today, 14);
  const picks = stretchChoices(today);
  const body = () => `
    <div class="seg" style="margin-bottom:14px">${[["0", "Regular paychecks"], ["1", "Irregular income"]].map(([v, l]) => `<button type="button" class="${(v === "1") === irregular ? "on" : ""}" data-style="${v}">${l}</button>`).join("")}</div>
    ${irregular ? `<p class="muted">Freelance, tips, gig work or benefits that move around? Choose how long the money in your account has to last. Bills due before then are protected first.</p>
      <div class="chips mt">${picks.map(([k, l, d]) => `<button type="button" class="chip ${d === cur ? "on" : ""}" data-until="${d}">${l} · until ${esc(fmtDay(d))}</button>`).join("")}</div>
      <div class="form-grid mt">${field("Or pick the day money arrives", inp("until", cur, `type="date" min="${addDays(today, 1)}"`), "full")}</div>
      <p class="tiny mt-s">When money comes in, add it as income or update your balance — your number grows right away.</p>`
      : `<p class="muted">Your number lasts until your next payday. ${S.incomes.length ? `Main paycheck: <b>${esc(primaryIncome()?.name || "Paycheck")}</b> · ${money(primaryIncome()?.amount || 0)} ${esc((FREQS[primaryIncome()?.freq] || "").toLowerCase())}.` : `Add your paycheck in <a href="#paycheck">Paycheck plan</a>.`}</p>`}`;
  const form = openModal({
    title: "How you get paid",
    body: body(),
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn primary">Save</button>`,
    onSubmit: (d) => {
      const undo = snapshot();
      S.account.irregular = irregular;
      if (irregular) {
        const until = d.until && d.until > today ? d.until : addDays(today, 14);
        S.account.horizon = until;
        commit(`Your money now lasts until ${fmtDay(until)}`, undo);
      } else commit("Back to regular paychecks", undo);
    },
  });
  const wire = () => {
    form.querySelectorAll(".modal-body a[href^='#']").forEach((x) => x.addEventListener("click", closeModal));
    form.querySelectorAll("[data-style]").forEach((b) => b.addEventListener("click", () => { irregular = b.dataset.style === "1"; form.querySelector(".modal-body").innerHTML = body(); wire(); }));
    form.querySelectorAll("[data-until]").forEach((b) => b.addEventListener("click", () => {
      form.querySelector("[name=until]").value = b.dataset.until;
      form.querySelectorAll("[data-until]").forEach((x) => x.classList.toggle("on", x === b));
    }));
  };
  wire();
}
Object.assign(ACTIONS, { "pay-style": () => openPayStyle() });
