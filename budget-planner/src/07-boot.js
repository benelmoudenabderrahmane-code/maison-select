/* ==========================================================================
   Boot: shell, router, theme, global events
   ========================================================================== */

function applyTheme() {
  const st = S.settings;
  const root = document.documentElement;
  const dark = st.theme === "dark" || (st.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.style.setProperty("--h", st.h);
  root.style.setProperty("--s", st.s + "%");
  root.dataset.font = st.font;
  root.dataset.size = st.size;
  root.dataset.motion = st.motion;
  root.dataset.skin = SKIN.id;
  document.body.classList.toggle("privacy", !!st.privacy);
  document.body.classList.toggle("focus", !!st.focus);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--bg").trim() || "#fff";
}

function sidebarHTML() {
  const ready = S.wishlist.filter((w) => !w.decision && Date.now() >= w.readyAt).length;
  const counts = { impulse: ready };
  let html = "";
  for (const n of NAV) {
    if (n.group) { html += SKIN.navStyle === "lines" ? (html ? `<hr class="nav-sep ${n.nf ? "nf" : ""}">` : "") : `<div class="nav-label ${n.nf ? "nf" : ""}">${n.group}</div>`; continue; }
    html += `<a href="#${n.id}" class="${ui.view === n.id ? "active" : ""} ${n.nf ? "nf" : ""}" ${ui.view === n.id ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span>${counts[n.id] ? `<span class="badge-dot">${counts[n.id]}</span>` : ""}</a>`;
  }
  return `
    <div class="brand">${SKIN.logo ? `<div class="brand-logo">${SKIN.logo}</div>` : `<div class="brand-mark">${icon("logo")}</div>`}<div><b>${SKIN.logo ? APP_NAME.replace(" ", "<br>") : APP_NAME}</b><span>${SKIN.logo ? APP_TAGLINE : S.profile.name ? `${esc(S.profile.name)}'s money plan` : APP_TAGLINE}</span></div></div>
    ${SKIN.headTools ? "" : `<button class="btn primary track-btn" data-action="quick-add">${icon("plus")}Track spending</button>`}
    <nav class="nav" aria-label="Main">${html}</nav>
    ${SKIN.sideArt ? `<div class="side-art">${SKIN.sideArt}</div>` : ""}
    ${SKIN.headTools ? "" : `<div class="sidebar-foot">
      <button class="btn icon-btn" data-action="toggle-theme" title="Day / night (D)" aria-label="Toggle night mode">${icon(isDark() ? "sun" : "moon")}</button>
      <button class="btn icon-btn" data-action="toggle-privacy" title="Privacy blur (P)" aria-label="Toggle privacy blur">${icon(S.settings.privacy ? "eyeoff" : "eye")}</button>
      <button class="btn icon-btn ${S.settings.focus ? "primary" : ""}" data-action="toggle-focus" title="Focus mode" aria-label="Toggle focus mode">${icon("focus")}</button>
    </div>
    <a class="user-chip" href="#settings"><span class="avatar">${esc((S.profile.name || "You").trim()[0].toUpperCase())}</span><span class="grow">${esc(S.profile.name || "Your profile")}</span>${icon("chevR", 16)}</a>`}`;
}
function tabbarHTML() {
  const t = (id, ic, label) => `<a href="#${id}" class="${ui.view === id ? "active" : ""}">${icon(ic)}<span>${label}</span></a>`;
  return `${t("home", "home", "Home")}${t("today", "sun", "Today")}
    <button class="plus" data-action="quick-add" aria-label="Track spending"><span>${icon("plus")}</span></button>
    ${t("calendar", "calendar", "Calendar")}<button data-action="more" class="${["home", "today", "calendar"].includes(ui.view) ? "" : "active"}">${icon("more")}<span>More</span></button>`;
}

function render() {
  const main = $("#main");
  if (!main) return;
  if (!VIEWS[ui.view]) ui.view = "home";
  const banner = IS_DEMO
    ? `<div class="banner demo"><b>✨ Free demo</b><span>Explore every feature with sample data. Changes reset when you close the tab.</span><a class="btn sm" href="${SHOP_URL}" target="_blank" rel="noopener" style="margin-left:auto">Get the full planner</a></div>`
    : !storage ? `<div class="banner">⚠️ Your browser is blocking storage (private mode?), so changes won't be kept after you close this page.</div>` : "";
  main.innerHTML = banner + VIEWS[ui.view]();
  const side = $("#sidebar"), sideTop = side.scrollTop; // keep the sidebar where the user scrolled it
  side.innerHTML = sidebarHTML();
  side.scrollTop = sideTop;
  settleScrollers(main);
  $("#tabbar").innerHTML = tabbarHTML();
  const label = NAV.find((n) => n.id === ui.view)?.label || "";
  document.title = `${label} · ${APP_NAME}`;
}

/** Horizontal strips start at the useful end: charts at the latest month, month chips at the selected one. */
const H_STRIPS = ".chart-scroll, [data-drag-scroll], .chip-scroll, .months";
function settleScrollers(root) {
  for (const el of root.querySelectorAll("[data-scroll-end]")) el.scrollLeft = el.scrollWidth;
  for (const el of root.querySelectorAll(".month-chips, .months")) {
    const on = el.querySelector(".on");
    if (on && el.scrollWidth > el.clientWidth) el.scrollLeft = on.offsetLeft - el.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  }
  for (const el of root.querySelectorAll(H_STRIPS)) edgeFade(el);
}
/** Soft fade on the side of a strip that has more to swipe to. */
function edgeFade(el) {
  const max = el.scrollWidth - el.clientWidth;
  el.classList.toggle("fade-l", max > 1 && el.scrollLeft > 2);
  el.classList.toggle("fade-r", max > 1 && el.scrollLeft < max - 2);
}
/** Mouse users can drag horizontal strips (charts, month chips) like on a phone. */
function enableDragScroll() {
  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (e.target.closest("input, textarea, select")) return;
    const el = e.target.closest(H_STRIPS);
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    drag = { el, x: e.clientX, left: el.scrollLeft, moved: false };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    drag.moved = true;
    drag.el.classList.add("dragging");
    drag.el.scrollLeft = drag.left - dx;
  });
  document.addEventListener("pointerup", () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.el.classList.remove("dragging");
    // A drag is not a click on whatever was under the mouse.
    if (d.moved) {
      const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
      document.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", stop, { capture: true }), 0);
    }
  });
}
function go(view) {
  if (location.hash !== `#${view}`) location.hash = view;
  else route();
}
function route() {
  if (location.hash.startsWith("#add?")) { handleAddLink(); return; }
  const v = location.hash.replace("#", "") || "home";
  const changed = v !== ui.view;
  ui.view = VIEWS[v] ? v : "home";
  closeModal();
  render();
  if (changed) window.scrollTo({ top: 0 });
}

function boot() {
  const had = load();
  document.body.innerHTML = `<div class="app"><aside class="sidebar" id="sidebar"></aside><main class="main" id="main" tabindex="-1"></main></div><nav class="tabbar" id="tabbar" aria-label="Quick navigation"></nav>`;
  applyTheme();
  if (IS_DEMO && !had) loadSample();
  route();
  checkBadges(true);
  saveNow();
  if (!S.onboarded && !IS_DEMO) openOnboarding();

  enableDragScroll();
  document.addEventListener("scroll", (e) => { if (e.target.matches?.(H_STRIPS)) edgeFade(e.target); }, { capture: true, passive: true });
  window.addEventListener("resize", () => { for (const el of document.querySelectorAll(H_STRIPS)) edgeFade(el); });
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) return;
    if (el.tagName === "BUTTON" || el.tagName === "A") e.preventDefault();
    if (el.type === "checkbox") e.preventDefault();
    fn(el, e);
  });
  const onInput = (e) => {
    const el = e.target.closest("[data-input]");
    if (el && INPUTS[el.dataset.input]) INPUTS[el.dataset.input](el, e);
    if (e.target.id === "tx-search" && e.type === "input") { ui.txQuery = e.target.value; $("#tx-list").innerHTML = txListHTML(); }
  };
  document.addEventListener("input", onInput);
  document.addEventListener("change", onInput);
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries());
    if (f.dataset.form === "wish") {
      if (!d.name.trim() || !(num(d.price) > 0)) return toast("Add what it is and the price");
      const undo = snapshot();
      S.wishlist.push({ id: uid(), name: d.name.trim(), price: round2(num(d.price)), link: d.link.trim(), addedAt: Date.now(), readyAt: Date.now() + Number(d.hours || 48) * 3600000 });
      commit(`Paused for ${Number(d.hours) >= 168 ? "a week" : d.hours + " hours"}. You've got this.`, undo);
    }
  });
  window.addEventListener("hashchange", route);
  // Never lose the last change when the tab is closed or hidden mid-debounce.
  window.addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return closeModal();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches?.('[role="button"][data-action]')) { e.preventDefault(); e.target.click(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (typing || e.metaKey || e.ctrlKey || e.altKey || $(".overlay")) return;
    const k = e.key.toLowerCase();
    if (k === "n") { e.preventDefault(); openTxForm(); }
    else if (k === "d") ACTIONS["toggle-theme"]();
    else if (k === "p") ACTIONS["toggle-privacy"]();
    else if (e.key === "/") { e.preventDefault(); if (ui.view !== "transactions") go("transactions"); setTimeout(() => $("#tx-search")?.focus(), 30); }
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (S.settings.theme === "auto") { applyTheme(); render(); } });
  // Keep timers (Impulse Pause) and "today" fresh.
  let lastDay = todayISO();
  setInterval(() => {
    if (todayISO() !== lastDay) { lastDay = todayISO(); render(); return; }
    if (ui.view === "impulse" && !$(".overlay") && !document.activeElement?.closest("form")) render();
  }, 60000);
  window.addEventListener("storage", (e) => { if (e.key === STORE_KEY && e.newValue) { S = migrate(JSON.parse(e.newValue)); applyTheme(); render(); } });
  // Ask the browser to keep this planner's data even when the device is low on space.
  if (!IS_DEMO) navigator.storage?.persist?.().catch(() => {});
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !IS_DEMO) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

// Small hook used by the automated test suite (scripts/test.mjs).
window.__planner = { get state() { return S; }, occurrences, monthSummary, todaySummary, simulateDebts, scheduleIn, render, edition: EDITION, storeKey: STORE_KEY,
  availableSummary, previewPurchase, checkBalance, toggleOccurrence, addTx, feesScan, parseCollected, billsICS, balanceNow };

document.addEventListener("DOMContentLoaded", boot);
