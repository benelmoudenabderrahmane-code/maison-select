/* ==========================================================================
   UI kit: icons, charts, modal, toast, confetti, tooltips
   ========================================================================== */

const ICONS = {
  logo: '<path d="M12 3c-3.6 3.2-6 6.3-6 9.4A6 6 0 0 0 12 18a6 6 0 0 0 6-5.6C18 9.3 15.6 6.2 12 3Z"/><path d="M12 18v3"/><path d="M9 21h6"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/><path d="M21 9h-5a3 3 0 0 0 0 6h5Z"/><circle cx="16.5" cy="12" r=".6" fill="currentColor"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  receipt: '<path d="M5 3h14v18l-2.5-1.6L14 21l-2-1.6L10 21l-2.5-1.6L5 21Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  piggy: '<path d="M19 9.5c1.2.4 2 1.4 2 2.5h-1.2c-.4 1.6-1.4 3-2.8 3.8V19h-3v-2h-4v2H7v-3.2A6.5 6.5 0 0 1 4 10.5C4 7.5 7 5 11 5c2 0 3.6.5 4.8 1.3L18 5v3"/><circle cx="15" cy="9.5" r=".6" fill="currentColor"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  chart: '<path d="M3 21h18"/><rect x="5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  focus: '<circle cx="12" cy="12" r="3"/><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7Z"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2A5 5 0 0 1 12 6a5 5 0 0 1 9.3 4.8C19.5 15.4 12 20 12 20Z"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z"/><path d="M5 19 13 11"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  sort: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>',
};
const icon = (name, size) =>
  `<svg viewBox="0 0 24 24" ${size ? `width="${size}" height="${size}"` : ""} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

/* ---------- Small components ---------- */
const tick = (on, attrs, extraCls = "") =>
  `<button class="tick ${on ? "on" : ""} ${extraCls}" ${attrs} aria-pressed="${on}" aria-label="${on ? "Mark as not done" : "Mark as done"}">${on ? icon("check") : ""}</button>`;
const progressBar = (value, max, style = "", thick = false) => {
  const p = max > 0 ? (value / max) * 100 : 0;
  return `<div class="bar ${p > 100 ? "over" : ""} ${thick ? "thick" : ""}" style="${style}" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${clamp(p, 0, 100)}%"></i></div>`;
};
function ring(p, { size = 92, stroke = 9, label = "", sub = "", color = "var(--accent)" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>
    <div class="ring-label">${label}${sub ? `<small>${sub}</small>` : ""}</div></div>`;
}
const catPill = (cat) => (cat ? `<span class="pill cat" style="${catStyle(cat)}">${esc(cat.emoji || "")} ${esc(cat.name)}</span>` : `<span class="pill muted">Uncategorised</span>`);
const empty = (emoji, title, text, btn = "") => `<div class="empty"><div class="big">${emoji}</div><h3>${esc(title)}</h3><p class="mt-s">${esc(text)}</p>${btn}</div>`;
const niceMax = (v) => {
  if (v <= 0) return 100;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / e;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e;
};
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const shortMoney = (v) => {
  const sym = money(0).replace(/[\d.,\s]/g, "");
  if (Math.abs(v) >= 1000) return `${sym}${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${sym}${Math.round(v)}`;
};

/* ---------- Charts (pure SVG) ---------- */
/** Paired bars: planned (outlined) vs actual (solid), one pair per item. */
function chartPlanVsActual(items) {
  if (!items.length) return empty("📊", "Nothing to chart yet", "Add a budget or track a few spends and this fills in.");
  const H = 262, top = 26, bottom = 74, left = 44, colW = 78;
  const W = Math.max(640, left + items.length * colW + 10);
  const max = niceMax(Math.max(...items.map((i) => Math.max(i.plan, i.actual)), 1));
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  let g = "";
  for (let k = 0; k <= 4; k++) {
    const v = (max / 4) * k;
    g += `<line class="grid-line" x1="${left}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end">${shortMoney(v)}</text>`;
  }
  items.forEach((it, i) => {
    const x = left + i * colW + 12, bw = 19;
    const ya = y(it.actual) - 6;
    let yp = y(it.plan) - 6;
    if (Math.abs(yp - ya) < 13) yp = Math.min(yp, ya) - 12; // keep the two value labels from colliding
    const tip = `${it.label}: ${money(it.actual)} of ${money(it.plan)}`;
    g += `<g data-tip="${esc(tip)}"><rect class="bar-plan" x="${x}" y="${y(it.plan)}" width="${bw}" height="${Math.max(0, y(0) - y(it.plan))}" rx="5" style="fill:${it.soft};stroke:${it.color}"/>
      <rect class="bar-act ${it.actual > it.plan ? "over" : ""}" x="${x + bw + 3}" y="${y(it.actual)}" width="${bw}" height="${Math.max(0, y(0) - y(it.actual))}" rx="5" style="${it.actual > it.plan ? "" : `fill:${it.color}`}"/>
      <rect x="${x - 6}" y="${top}" width="${colW - 8}" height="${H - top}" fill="transparent"/></g>
      ${it.plan > 0 ? `<text x="${x + bw / 2}" y="${yp}" text-anchor="middle" style="font-size:10px">${shortMoney(it.plan)}</text>` : ""}
      <text x="${x + bw * 1.5 + 3}" y="${ya}" text-anchor="middle" style="font-size:10px;font-weight:700;fill:var(--ink)">${shortMoney(it.actual)}</text>
      <text x="${x + bw + 1}" y="${H - bottom + 22}" text-anchor="middle" style="font-size:16px">${esc(it.emoji || "")}</text>
      <text x="${x + bw + 1}" y="${H - bottom + 42}" text-anchor="middle" style="font-weight:600;fill:var(--ink)">${esc(trunc(it.short || it.label, 11))}</text>`;
  });
  return `<div class="chart-scroll"><svg class="chart" viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="Budget versus actual by category">${g}</svg></div>
    <div class="legend"><span><i style="background:var(--accent-soft);border:1px solid var(--accent)"></i>Planned</span><span><i style="background:var(--accent)"></i>Actual</span><span><i style="background:var(--bad)"></i>Over budget</span></div>`;
}
/** Income vs money out, one pair per month. */
function chartInOut(rows) {
  const H = 240, top = 14, bottom = 30, left = 48;
  const colW = 56, W = Math.max(600, left + rows.length * colW + 10);
  const max = niceMax(Math.max(...rows.map((r) => Math.max(r.inc, r.out)), 1));
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  let g = "";
  for (let k = 0; k <= 4; k++) {
    const v = (max / 4) * k;
    g += `<line class="grid-line" x1="${left}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end">${shortMoney(v)}</text>`;
  }
  rows.forEach((r, i) => {
    const x = left + i * colW + 10, bw = 16;
    g += `<g data-tip="${esc(`${r.label}: in ${money(r.inc)} · out ${money(r.out)}`)}">
      <rect class="bar-in" x="${x}" y="${y(r.inc)}" width="${bw}" height="${Math.max(0, y(0) - y(r.inc))}" rx="4"/>
      <rect class="bar-out" x="${x + bw + 3}" y="${y(r.out)}" width="${bw}" height="${Math.max(0, y(0) - y(r.out))}" rx="4"/>
      <rect x="${x - 6}" y="${top}" width="${colW - 6}" height="${H - top}" fill="transparent"/></g>
      <text x="${x + bw}" y="${H - 10}" text-anchor="middle">${esc(r.label)}</text>`;
  });
  return `<div class="chart-scroll"><svg class="chart" viewBox="0 0 ${W} ${H}" style="min-width:${W}px" role="img" aria-label="Income versus spending per month">${g}</svg></div>
    <div class="legend"><span><i style="background:var(--good)"></i>Money in</span><span><i style="background:var(--accent)"></i>Money out (spent + saved)</span></div>`;
}
/** Simple line chart; `series` = [{values, cls}] sharing x positions; labels at a few ticks. */
function chartLine(series, labelFor, { height = 220, width = 640, aria = "Line chart", points = false } = {}) {
  const n = Math.max(...series.map((s) => s.values.length));
  if (n < 2) return "";
  const W = width, H = height, top = 12, bottom = 28, left = 52, right = 10;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 1));
  const x = (i) => left + ((W - left - right) * i) / (n - 1);
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  let g = `<defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
  for (let k = 0; k <= 4; k++) {
    const v = (max / 4) * k;
    g += `<line class="grid-line" x1="${left}" x2="${W - right}" y1="${y(v)}" y2="${y(v)}"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end">${shortMoney(v)}</text>`;
  }
  const ticks = Math.min(width < 500 ? 4 : 6, n);
  for (let k = 0; k < ticks; k++) {
    const i = Math.round(((n - 1) * k) / (ticks - 1));
    g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(labelFor(i))}</text>`;
  }
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    if (si === 0) g += `<path class="area" d="M${x(0)},${y(0)} L${pts.join(" L")} L${x(s.values.length - 1)},${y(0)} Z"/>`;
    g += `<polyline class="line ${s.cls || ""}" points="${pts.join(" ")}"/>`;
    if (points && si === 0) s.values.forEach((v, i) => {
      g += `<circle cx="${x(i)}" cy="${y(v)}" r="5" class="pt"/><text x="${x(i)}" y="${y(v) - 12}" text-anchor="middle" style="font-weight:700;fill:var(--ink)">${shortMoney(v)}</text>`;
    });
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${g}</svg>`;
}
function donut(segments, size = 170) {
  const total = sum(segments, (s) => s.value);
  const stroke = 24, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let off = 0, arcs = "";
  for (const s of segments) {
    const len = total > 0 ? (s.value / total) * c : 0;
    arcs += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${Math.max(0, len - 2)} ${c}" stroke-dashoffset="${-off}" data-tip="${esc(`${s.label}: ${money(s.value)} (${pct(s.value, total)}%)`)}"/>`;
    off += len;
  }
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>${arcs}</svg>
    <div class="ring-label" style="font-family:var(--font-head);font-size:1.15rem">${moneyHTML(total, { noCents: true })}<small>total</small></div></div>`;
}
function sparkline(values, w = 120, h = 34) {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${((w * i) / (values.length - 1)).toFixed(1)},${(h - 3 - ((h - 6) * (v - min)) / (max - min || 1)).toFixed(1)}`);
  return `<svg width="${w}" height="${h}" class="chart" aria-hidden="true"><polyline class="line" points="${pts.join(" ")}"/></svg>`;
}

/* ---------- Tooltip ---------- */
let tipEl = null;
document.addEventListener("pointermove", (e) => {
  const t = e.target.closest?.("[data-tip]");
  if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; document.body.appendChild(tipEl); }
  if (!t) { tipEl.style.opacity = 0; return; }
  tipEl.textContent = t.getAttribute("data-tip");
  tipEl.style.opacity = 1;
  const x = Math.min(e.clientX + 14, window.innerWidth - tipEl.offsetWidth - 8);
  tipEl.style.left = x + "px";
  tipEl.style.top = e.clientY - 38 + "px";
});

/* ---------- Toasts ---------- */
function toast(msg, opts = {}) {
  let wrap = $(".toasts");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("role", "status"); document.body.appendChild(wrap); }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${esc(msg)}</span>${opts.undo ? `<button>Undo</button>` : ""}`;
  if (opts.undo) el.querySelector("button").onclick = () => { opts.undo(); el.remove(); };
  wrap.appendChild(el);
  setTimeout(() => el.remove(), opts.undo ? 6000 : 3200);
}

/* ---------- Confetti & celebrations ---------- */
function confetti(n = 90) {
  if (!S.settings.celebrate || S.settings.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const hues = [S.settings.h, S.settings.h + 30, 45, 150, 200];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = `hsl(${hues[i % hues.length]} 75% 62%)`;
    c.style.setProperty("--dx", (Math.random() - 0.5) * 220 + "px");
    c.style.setProperty("--r", Math.random() * 900 - 450 + "deg");
    c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    c.style.animationDelay = Math.random() * 0.25 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3700);
  }
}
function celebrate(emoji, title, sub = "") {
  if (!S.settings.celebrate) { toast(title); return; }
  confetti();
  const el = document.createElement("div");
  el.className = "celebrate";
  el.innerHTML = `<div><div class="e">${emoji}</div><h2 class="mt-s">${esc(title)}</h2>${sub ? `<p class="muted mt-s">${esc(sub)}</p>` : ""}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/* ---------- Modal ---------- */
let modalCleanup = null;
function openModal({ title, body, foot = "", wide = false, onSubmit, onMount }) {
  closeModal();
  const ov = document.createElement("div");
  ov.className = "overlay";
  ov.innerHTML = `<form class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}" novalidate>
      <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="btn ghost icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
      <div class="modal-body">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ""}
    </form>`;
  document.body.appendChild(ov);
  const form = ov.querySelector("form");
  const prevFocus = document.activeElement;
  ov.addEventListener("mousedown", (e) => { if (e.target === ov) closeModal(); });
  ov.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!onSubmit) return closeModal();
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll("input[type=checkbox][name]").forEach((c) => (data[c.name] = c.checked));
    if (onSubmit(data, form) !== false) closeModal();
  });
  modalCleanup = () => prevFocus?.focus?.();
  onMount?.(form);
  const first = form.querySelector("[autofocus]") || form.querySelector(".modal-body input, .modal-body select, .modal-body textarea");
  setTimeout(() => first?.focus(), 30);
  return form;
}
function closeModal() {
  const ov = $(".overlay");
  if (ov) ov.remove();
  if (modalCleanup) { const f = modalCleanup; modalCleanup = null; f(); }
}
function confirmBox(title, text, okLabel, onOk, danger = true) {
  openModal({
    title,
    body: `<p class="muted">${esc(text)}</p>`,
    foot: `<button type="button" class="btn" data-close>Cancel</button><button class="btn ${danger ? "danger" : "primary"}">${esc(okLabel)}</button>`,
    onSubmit: () => { onOk(); },
  });
}

/* ---------- Form helpers ---------- */
const field = (label, input, cls = "", hint = "") => `<label class="field ${cls}"><span>${label}${hint ? ` <em class="hint">${hint}</em>` : ""}</span>${input}</label>`;
const inp = (name, value = "", attrs = "") => `<input class="input" name="${name}" value="${esc(value)}" ${attrs}>`;
const moneyInp = (name, value = "", attrs = "") => inp(name, value === "" || value == null ? "" : round2(value), `type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00" ${attrs}`);
const sel = (name, options, value, attrs = "") =>
  `<select class="input" name="${name}" ${attrs}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
const chk = (name, on, label) => `<label class="check"><input type="checkbox" name="${name}" ${on ? "checked" : ""}> ${label}</label>`;
const catOptions = (withNone = false) => [
  ...(withNone ? [["", "— None —"]] : []),
  ...S.categories.map((c) => [c.id, `${c.emoji} ${c.name}`]),
];
const freqOptions = (keys = Object.keys(FREQS)) => keys.map((k) => [k, FREQS[k]]);

function download(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function pickFile(accept, cb) {
  const i = document.createElement("input");
  i.type = "file";
  i.accept = accept;
  i.onchange = () => {
    const f = i.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(String(r.result), f);
    r.readAsText(f);
  };
  i.click();
}
