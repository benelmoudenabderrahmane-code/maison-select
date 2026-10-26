/* ==========================================================================
   Lumi Budget — core: constants, utilities, dates, money, storage
   ========================================================================== */

// Everything edition-specific is injected at build time (see scripts/build.mjs).
const BUILD = typeof __BUILD__ !== "undefined" ? __BUILD__ : {};
const APP_NAME = BUILD.appName || "Lumi Budget";
const APP_TAGLINE = BUILD.tagline || "Calm money planner";
const STORE_KEY = BUILD.storeKey || "lumi-budget-v1";
const EDITION = BUILD.edition || "full"; // "full" or "demo"
const IS_DEMO = EDITION === "demo";
const SHOP_URL = BUILD.shopUrl || "#";
const SKIN = { id: "lumi", monthNav: "chips", homeLayout: "split", palette: "rose", logo: "", flourish: "", sideArt: "", ...(BUILD.skin || {}) };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const plural = (n, word, many = word + "s") => `${n} ${n === 1 ? word : many}`;
const by = (f) => (a, b) => (f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0);

/* ---------- Dates (ISO yyyy-mm-dd strings, local time) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const todayISO = () => toISO(new Date());
const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const diffDays = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
const monthKey = (iso) => String(iso).slice(0, 7);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const monthStart = (mk) => `${mk}-01`;
const monthEnd = (mk) => {
  const [y, m] = mk.split("-").map(Number);
  return `${mk}-${pad(daysInMonth(y, m - 1))}`;
};
const addMonths = (mk, n) => {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_S = MONTHS.map((m) => m.slice(0, 3));
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthName = (mk) => MONTHS[Number(mk.slice(5, 7)) - 1];
const monthLabel = (mk) => `${monthName(mk)} ${mk.slice(0, 4)}`;
const fmtDay = (iso) => {
  const d = fromISO(iso);
  return `${MONTHS_S[d.getMonth()]} ${d.getDate()}`;
};
const fmtLong = (iso) => {
  const d = fromISO(iso);
  return `${DOW[d.getDay()]}, ${MONTHS_S[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const relDay = (iso) => {
  const n = diffDays(todayISO(), iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return DOW[fromISO(iso).getDay()];
  return fmtDay(iso);
};

/* ---------- Money ---------- */
const CURRENCIES = [
  ["USD", "US Dollar"], ["EUR", "Euro"], ["GBP", "British Pound"], ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"], ["NZD", "New Zealand Dollar"], ["CHF", "Swiss Franc"], ["SEK", "Swedish Krona"],
  ["NOK", "Norwegian Krone"], ["DKK", "Danish Krone"], ["PLN", "Polish Zloty"], ["JPY", "Japanese Yen"],
  ["INR", "Indian Rupee"], ["SGD", "Singapore Dollar"], ["HKD", "Hong Kong Dollar"], ["ZAR", "South African Rand"],
  ["MXN", "Mexican Peso"], ["BRL", "Brazilian Real"], ["AED", "UAE Dirham"], ["MAD", "Moroccan Dirham"],
  ["PHP", "Philippine Peso"], ["ILS", "Israeli Shekel"], ["TRY", "Turkish Lira"], ["KRW", "South Korean Won"],
];
let _fmtCache = {};
function fmtFor(cur) {
  if (!_fmtCache[cur]) {
    try {
      _fmtCache[cur] = new Intl.NumberFormat(undefined, { style: "currency", currency: cur });
    } catch {
      _fmtCache[cur] = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
    }
  }
  return _fmtCache[cur];
}
/** Plain-text money, e.g. "$1,250.00". */
const money = (n) => fmtFor(S.profile.currency).format(round2(n));
/** Whole amounts without trailing zero cents, e.g. "$2,000" or "1.250 €" (cents kept when present). */
const moneyRound = (n) => money(n).replace(/[.,]00(?!\d)/, "");
/** Money as HTML with small cents, like "$9,000<small>.00</small>". */
function moneyHTML(n, opts = {}) {
  const v = round2(n);
  const parts = fmtFor(S.profile.currency).formatToParts(v);
  // main = everything before the decimal point, cents = ".00", after = e.g. " €" in "1 000,00 €"
  let main = "", cents = "", after = "", seenDecimal = false;
  for (const p of parts) {
    if (p.type === "decimal") seenDecimal = true;
    if (!seenDecimal) main += p.value;
    else if (p.type === "decimal" || p.type === "fraction") cents += p.value;
    else after += p.value;
  }
  const sign = opts.sign && v > 0 ? "+" : "";
  const cls = opts.color ? (v < 0 ? " neg" : v > 0 ? " pos" : "") : "";
  const c = cents && !opts.noCents ? `<small>${esc(cents)}</small>` : "";
  return `<span class="m${cls}">${sign}${esc(main)}${c}${esc(after)}</span>`;
}
const pct = (a, b) => (b > 0 ? clamp(Math.round((a / b) * 100), 0, 999) : 0);

/* ---------- Colours for categories ---------- */
const CAT_HUES = [345, 20, 38, 150, 200, 265, 300, 175, 55, 225, 5, 120, 285, 90];
const catVars = (hue) =>
  `--c:hsl(${hue} 58% 58%);--c-soft:hsl(${hue} 70% 92%);--c-ink:hsl(${hue} 50% 30%)`;
const catVarsDark = (hue) =>
  `--c:hsl(${hue} 55% 64%);--c-soft:hsl(${hue} 30% 22%);--c-ink:hsl(${hue} 60% 82%)`;
const isDark = () => document.documentElement.dataset.theme === "dark";
const catStyle = (cat) => (cat ? (isDark() ? catVarsDark(cat.hue) : catVars(cat.hue)) : "");
const catColor = (cat) => `hsl(${cat ? cat.hue : 0} ${cat ? 58 : 0}% ${isDark() ? 64 : 58}%)`;

/* ---------- Default data ---------- */
const DEFAULT_CATEGORIES = [
  ["Rent / Mortgage", "🏠", "needs", 1450],
  ["Utilities", "💡", "needs", 160],
  ["Groceries", "🛒", "needs", 450],
  ["Transportation", "🚗", "needs", 180],
  ["Phone & Internet", "📱", "needs", 105],
  ["Insurance", "🛡️", "needs", 130],
  ["Health & Fitness", "💪", "needs", 60],
  ["Dining Out", "🍝", "wants", 160],
  ["Coffee & Treats", "☕", "wants", 50],
  ["Shopping", "🛍️", "wants", 120],
  ["Entertainment", "🎬", "wants", 60],
  ["Subscriptions", "📺", "wants", 45],
  ["Personal Care", "💅", "wants", 50],
  ["Gifts & Donations", "🎁", "wants", 40],
  ["Pets", "🐾", "needs", 0],
  ["Kids", "🧸", "needs", 0],
  ["Travel", "✈️", "wants", 0],
  ["Miscellaneous", "✨", "wants", 40],
];
const SYSTEM_CATS = {
  income: { id: "income", name: "Income", emoji: "💰", hue: 150, group: "income" },
  savings: { id: "savings", name: "Savings transfer", emoji: "🐷", hue: 205, group: "savings" },
  debt: { id: "debt", name: "Debt payment", emoji: "💳", hue: 30, group: "debt" },
};
const GROUPS = {
  needs: { label: "Needs", hint: "Bills and essentials", target: 50 },
  wants: { label: "Wants", hint: "Fun and flexible", target: 30 },
  savings: { label: "Savings", hint: "Future you", target: 20 },
  debt: { label: "Debt", hint: "Paying it down", target: 0 },
};
const FREQS = {
  once: "One time",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  semimonthly: "Twice a month (15th & last day)",
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
};
const PALETTE_SETS = {
  lumi: [
    { id: "rose", name: "Blush", h: 345, s: 62 },
    { id: "peach", name: "Peach", h: 14, s: 72 },
    { id: "honey", name: "Honey", h: 36, s: 70 },
    { id: "sage", name: "Sage", h: 150, s: 24 },
    { id: "ocean", name: "Ocean", h: 205, s: 55 },
    { id: "lavender", name: "Lavender", h: 265, s: 42 },
    { id: "mocha", name: "Mocha", h: 22, s: 30 },
    { id: "noir", name: "Noir", h: 240, s: 6 },
  ],
  lila: [
    { id: "lilac", name: "Lilac", h: 266, s: 44 },
    { id: "plum", name: "Plum", h: 292, s: 38 },
    { id: "periwinkle", name: "Periwinkle", h: 236, s: 48 },
    { id: "mist", name: "Lavender mist", h: 256, s: 26 },
    { id: "orchid", name: "Orchid", h: 318, s: 42 },
    { id: "sage", name: "Sage", h: 152, s: 24 },
    { id: "peach", name: "Peach", h: 16, s: 62 },
    { id: "midnight", name: "Midnight", h: 245, s: 18 },
  ],
  sage: [
    { id: "honey", name: "Honey", h: 34, s: 74 },
    { id: "sage", name: "Sage", h: 145, s: 26 },
    { id: "terracotta", name: "Terracotta", h: 16, s: 56 },
    { id: "blueberry", name: "Blueberry", h: 226, s: 42 },
    { id: "lavender", name: "Lavender", h: 268, s: 30 },
    { id: "rosehip", name: "Rosehip", h: 350, s: 46 },
    { id: "olive", name: "Olive", h: 62, s: 30 },
    { id: "charcoal", name: "Charcoal", h: 30, s: 8 },
  ],
  cherry: [
    { id: "cherry", name: "Cherry", h: 348, s: 70 },
    { id: "blossom", name: "Blossom", h: 340, s: 78 },
    { id: "peony", name: "Peony", h: 328, s: 58 },
    { id: "coral", name: "Coral", h: 8, s: 74 },
    { id: "wine", name: "Wine", h: 350, s: 44 },
    { id: "plum", name: "Plum", h: 318, s: 36 },
    { id: "matcha", name: "Matcha", h: 95, s: 28 },
    { id: "mocha", name: "Mocha", h: 20, s: 32 },
  ],
};
const PALETTES = PALETTE_SETS[SKIN.id] || PALETTE_SETS.lumi;
const DEFAULT_PALETTE = PALETTES.find((p) => p.id === SKIN.palette) || PALETTES[0];

function freshState() {
  return {
    version: 1,
    createdAt: todayISO(),
    onboarded: false,
    profile: { name: "", currency: "USD", weekStart: 1, buffer: 0 },
    settings: {
      theme: "light", palette: DEFAULT_PALETTE.id, h: DEFAULT_PALETTE.h, s: DEFAULT_PALETTE.s, font: "elegant", size: "normal",
      motion: "on", celebrate: true, privacy: false, focus: false, lastBackup: null,
    },
    categories: DEFAULT_CATEGORIES.map(([name, emoji, group, budget], i) => ({
      id: uid(), name, emoji, group, budget, hue: CAT_HUES[i % CAT_HUES.length], rollover: false,
    })),
    budgets: {}, // { "2026-10": { catId: amount } } — per-month overrides
    incomes: [], // recurring income sources
    bills: [], // recurring bills & subscriptions
    debts: [],
    funds: [],
    goals: [],
    transactions: [],
    links: {}, // scheduled occurrence key -> transaction id (marks it paid/received)
    wishlist: [],
    noSpend: {}, // iso -> true
    checkins: {}, // iso -> true
    moods: {}, // iso -> emoji
    badges: {}, // badgeId -> iso earned
    notes: "",
    skippedTotal: 0,
    // Balance mode (editions with skin.balance): the money really in the account right now.
    account: { name: "Spending account", balance: 0, checkedAt: 0, checkedOn: "", openFrom: "" },
    envelopes: [], // { id, name, emoji, amount } — money set aside, still in the account
    moneyBack: [], // { id, name, kind, amount, due, status, txId }
    collected: {}, // Apple Pay lines already imported
    nook: { pet: "mochi", drops: 0, owned: ["mochi", "room-day"], room: "auto", log: {} }, // cozy room & companion
  };
}

/* ---------- Storage ---------- */
let S = freshState();
let _saveTimer = null;
const storage = (() => {
  // The demo edition keeps data for the browser tab only, so every visitor gets a clean demo.
  try {
    const st = IS_DEMO ? window.sessionStorage : window.localStorage;
    const k = "__lumi_test";
    st.setItem(k, "1");
    st.removeItem(k);
    return st;
  } catch {
    return null;
  }
})();

function load() {
  if (!storage) return false;
  try {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return false;
    S = migrate(JSON.parse(raw));
    return true;
  } catch (e) {
    console.warn("Could not read saved data", e);
    return false;
  }
}
function migrate(data) {
  const base = freshState();
  const out = { ...base, ...data };
  out.profile = { ...base.profile, ...(data.profile || {}) };
  out.settings = { ...base.settings, ...(data.settings || {}) };
  out.account = { ...base.account, ...(data.account || {}) };
  out.nook = { ...base.nook, ...(data.nook || {}) };
  if (!Array.isArray(out.nook.owned)) out.nook.owned = base.nook.owned;
  if (!out.nook.log || typeof out.nook.log !== "object") out.nook.log = {};
  for (const k of ["incomes", "bills", "debts", "funds", "goals", "transactions", "wishlist", "categories", "envelopes", "moneyBack"]) {
    if (!Array.isArray(out[k])) out[k] = base[k];
  }
  for (const k of ["budgets", "links", "noSpend", "checkins", "moods", "badges", "collected"]) {
    if (!out[k] || typeof out[k] !== "object") out[k] = {};
  }
  return out;
}
function save() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveNow, 150);
}
function saveNow() {
  clearTimeout(_saveTimer);
  if (!storage) return;
  try {
    storage.setItem(STORE_KEY, JSON.stringify(S));
  } catch (e) {
    toast("Couldn't save — your browser storage may be full. Export a backup in Settings.");
  }
}
