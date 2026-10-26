/* ==========================================================================
   The Honey Nook: an illustrated cozy room with a companion who reacts to
   what you do, and honey drops you earn for small money habits.
   Only active for editions that ship illustrations (skin.nookImg).
   ========================================================================== */
const NOOK = !!(SKIN.nookImg && SKIN.nookImg["room-day"]);
const nookImg = (k) => (SKIN.nookImg && SKIN.nookImg[k]) || "";
const NOOK_PETS = {
  mochi: { name: "Mochi", kind: "capybara", cost: 0, line: "Calm money, sweet days.", poses: { idle: "mochi-idle", coin: "mochi-coin", happy: "mochi-happy", sleep: "mochi-sleep", cheer: "mochi-cheer" } },
  bun: { name: "Bun", kind: "bunny", cost: 20, line: "Small steps, soft heart.", poses: { idle: "bun-idle", coin: "bun-coin", happy: "bun-happy", sleep: "bun-sleep", cheer: "bun-cheer" } },
};
const NOOK_ROOMS = {
  "room-day": { name: "Golden hour", cost: 0 },
  "room-winter": { name: "Snowy evening", cost: 25 },
};
// How honey drops are earned (per day caps keep it calm, not grindy).
const NOOK_EARN = {
  spend: { label: "Track a spend", n: 1, cap: 5 },
  bill: { label: "Tick off a bill or payday", n: 2, cap: 6 },
  checkin: { label: "Daily check-in", n: 2, cap: 2 },
  envelope: { label: "Set money aside", n: 2, cap: 4 },
  fresh: { label: "Start from today (balance check)", n: 3, cap: 3 },
  close: { label: "Close your day (evening recap)", n: 3, cap: 3 },
  pat: { label: "Say hello to your friend", n: 1, cap: 3 },
};
let nookQuiet = false; // no rewards while sample data is being generated
let nookPending = null; // reaction to play after the next render

function nookPet() { return NOOK_PETS[S.nook?.pet] || NOOK_PETS.mochi; }
function nookEarn(reason) {
  if (!NOOK || nookQuiet || !S.nook) return 0;
  const rule = NOOK_EARN[reason];
  if (!rule) return 0;
  const key = `${todayISO()}:${reason}`;
  const got = S.nook.log[key] || 0;
  if (got >= rule.cap) { nookPending ||= { mood: "happy" }; return 0; }
  const n = Math.min(rule.n, rule.cap - got);
  S.nook.log[key] = got + n;
  S.nook.drops = (S.nook.drops || 0) + n;
  // Keep the log to the last few weeks.
  const cutoff = addDays(todayISO(), -21);
  for (const k of Object.keys(S.nook.log)) if (k.slice(0, 10) < cutoff) delete S.nook.log[k];
  nookPending = { mood: "cheer", text: `+${n} 🍯` };
  return n;
}
/** Morning, day, golden hour or night — the room follows the clock. */
function nookTime(d = new Date()) {
  const h = d.getHours();
  return h >= 21 || h < 6 ? "night" : h < 10 ? "morning" : h >= 17 ? "golden" : "day";
}
function nookRoom(d = new Date()) {
  const pick = S.nook?.room || "auto";
  if (pick !== "auto" && S.nook.owned.includes(pick) && nookImg(pick)) return pick;
  const m = d.getMonth();
  return (m === 11 || m <= 1) && nookImg("room-winter") ? "room-winter" : "room-day";
}
function nookLine(a) {
  const pet = nookPet();
  if (nookTime() === "night") return `Zzz… your bills are covered. Sleep well.`;
  if (!a) return pet.line;
  if (a.checkedDays == null) return "Hi! Tell me your balance and I'll work out today.";
  if (a.stale) return "Welcome back! Let's start from today — no catching up.";
  if (a.confirmPayday) return "Is it payday? Let's check it in together!";
  if (a.shortBy) return "A tight stretch. We'll make room around it, gently.";
  if (a.leftToday > 0) return `${money(a.leftToday)} left for today. You've got this.`;
  return "Today's guide is used up — tomorrow resets, no stress.";
}
function nookPose(a) {
  if (nookTime() === "night") return "sleep";
  if (a && a.leftToday > 0 && !a.shortBy) return "coin";
  return "idle";
}
/** The room, the companion and its speech bubble. `inner` is what floats on the glass card. */
function nookScene({ a = null, inner = "", size = "hero" } = {}) {
  const pet = nookPet(), pose = nookPose(a), room = nookRoom(), time = nookTime();
  const snow = room === "room-winter" ? `<div class="nook-snow" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--d:${6 + (i % 5)}s;--w:${(i * 7) % 6}s"></i>`).join("")}</div>` : "";
  const motes = `<div class="nook-motes" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i style="--x:${48 + ((i * 37) % 48)}%;--y:${12 + ((i * 23) % 60)}%;--d:${5 + (i % 4)}s;--w:${(i * 3) % 5}s"></i>`).join("")}</div>`;
  return `<div class="nook nook-${size}" data-time="${time}" data-room="${room}">
    <img class="nook-bg" src="${nookImg(room)}" alt="" aria-hidden="true" draggable="false">
    <div class="nook-light" aria-hidden="true"></div>
    ${snow}${motes}
    ${inner ? `<div class="nook-card">${inner}</div>` : ""}
    <div class="nook-friend">
      <div class="nook-bubble" role="status">${esc(nookLine(a))}</div>
      <button class="nook-pet pose-${pose}" data-action="nook-pat" aria-label="Say hello to ${esc(pet.name)}" title="Say hello to ${esc(pet.name)}">
        <img src="${nookImg(pet.poses[pose])}" alt="" draggable="false">
      </button>
      <div class="nook-shadow" aria-hidden="true"></div>
    </div>
    <a class="nook-drops" href="#nook" title="Your honey drops">🍯 <b>${S.nook.drops || 0}</b><span>honey drops</span></a>
  </div>`;
}
/** Play the companion's reaction after a render (swap pose, hop, floating reward). */
function nookAfterRender() {
  if (!NOOK || !nookPending) return;
  const p = nookPending;
  nookPending = null;
  const btn = $(".nook-pet");
  if (!btn) return;
  const pet = nookPet();
  const img = btn.querySelector("img");
  const rest = img.getAttribute("src");
  img.src = nookImg(pet.poses[p.mood] || pet.poses.happy);
  btn.classList.add("react");
  if (p.text) {
    const f = document.createElement("div");
    f.className = "nook-float";
    f.textContent = p.text;
    btn.parentElement.appendChild(f);
    setTimeout(() => f.remove(), 1600);
  }
  if (p.say) { const b = $(".nook-bubble"); if (b) b.textContent = p.say; }
  setTimeout(() => { btn.classList.remove("react"); if (img.isConnected) img.src = rest; }, 1900);
}

/* ---------- Page ---------- */
function viewNook() {
  const a = SKIN.balance ? availableSummary() : null;
  const pets = Object.entries(NOOK_PETS).filter(([, p]) => nookImg(p.poses.idle));
  const today = todayISO();
  return `
  ${pageHead("The Honey Nook", "A little room that grows with your money habits. Earn honey drops for small steps — never for being perfect.")}
  ${nookScene({ a, size: "page" })}
  ${nookStudio()}
  <div class="grid g2 mt">
    <div class="card">
      <div class="card-head"><h2>Your friends</h2><span class="tiny">🍯 ${S.nook.drops} drops</span></div>
      <div class="nook-pets">${pets.map(([id, p]) => {
        const own = S.nook.owned.includes(id), on = S.nook.pet === id;
        return `<button class="nook-pick ${on ? "on" : ""}" data-action="nook-pet" data-id="${id}" ${!own && S.nook.drops < p.cost ? "disabled" : ""} aria-pressed="${on}">
          <img src="${nookImg(p.poses.idle)}" alt="">
          <b>${esc(p.name)}</b><span>${on ? "With you now" : own ? "Tap to switch" : `Unlock · 🍯 ${p.cost}`}</span></button>`;
      }).join("")}
        <div class="nook-pick soon" aria-hidden="true"><span class="q">?</span><b>More friends</b><span>Coming in updates</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h2>Rooms</h2></div>
      <div class="nook-rooms">${[["auto", { name: "Follow the season", cost: 0 }], ...Object.entries(NOOK_ROOMS)].filter(([id]) => id === "auto" || nookImg(id)).map(([id, r]) => {
        const own = id === "auto" || S.nook.owned.includes(id), on = (S.nook.room || "auto") === id;
        return `<button class="nook-room ${on ? "on" : ""}" data-action="nook-room" data-id="${id}" ${!own && S.nook.drops < r.cost ? "disabled" : ""} aria-pressed="${on}">
          ${id === "auto" ? `<span class="nook-room-auto">🍂❄️🌸</span>` : `<img src="${nookImg(id)}" alt="">`}
          <b>${esc(r.name)}</b><span>${on ? "Showing now" : own ? "Tap to use" : `Unlock · 🍯 ${r.cost}`}</span></button>`;
      }).join("")}</div>
    </div>
  </div>
  <div class="card mt">
    <div class="card-head"><h2>How to earn honey drops</h2><span class="tiny">Small daily limits — it's a cozy game, not a chore</span></div>
    <div class="list">${Object.entries(NOOK_EARN).map(([k, r]) => { const got = S.nook.log[`${today}:${k}`] || 0; return `<div class="li"><div class="name">${esc(r.label)}<small>up to ${r.cap} a day</small></div><div class="amt">+${r.n} 🍯</div><span class="pill ${got >= r.cap ? "good" : "muted"}">${got >= r.cap ? "done today" : `${got}/${r.cap}`}</span></div>`; }).join("")}</div>
  </div>`;
}

/* ---------- Wiring ---------- */
if (NOOK) {
  // Reward the habits where they happen.
  const baseAddTx = addTx;
  addTx = function (tx) {
    const t = baseAddTx(tx);
    if (t.link) nookEarn("bill"); else if (t.type === "expense") nookEarn("spend");
    return t;
  };
  const baseCheckBalance = checkBalance;
  checkBalance = function (amount, openFrom) { baseCheckBalance(amount, openFrom); nookEarn("fresh"); };
  const baseRender = render;
  render = function () { baseRender(); nookAfterRender(); };
  const baseSample = loadSample;
  loadSample = function () {
    nookQuiet = true;
    try { baseSample(); } finally { nookQuiet = false; }
    S.nook = { pet: "mochi", drops: 38, owned: ["mochi", "room-day"], room: "auto", log: {} };
    nookPending = null;
    saveNow();
    render();
  };
  const at = (id) => NAV.findIndex((n) => n.id === id);
  NAV.splice(at("home") + 1, 0, { id: "nook", label: "Honey Nook", icon: "sparkle" });
  VIEWS.nook = viewNook;
  const baseCheckin = ACTIONS.checkin;
  if (baseCheckin) ACTIONS.checkin = (el, e) => { nookEarn("checkin"); return baseCheckin(el, e); };
}
Object.assign(ACTIONS, {
  "nook-pat": () => {
    const pet = nookPet();
    const lines = [`${pet.name} is so happy to see you!`, "You're doing better than you think.", "One small step today is plenty.", "Proud of you for checking in 🍯", pet.line];
    const n = nookEarn("pat");
    nookPending = { mood: "happy", text: n ? `+${n} 🍯` : "♡", say: lines[Math.floor(Math.random() * lines.length)] };
    save();
    if (n) render(); else nookAfterRender();
  },
  "nook-pet": (el) => {
    const id = el.dataset.id, p = NOOK_PETS[id];
    if (!p) return;
    if (!S.nook.owned.includes(id)) {
      if (S.nook.drops < p.cost) return toast(`Earn ${p.cost - S.nook.drops} more honey drops to meet ${p.name}`);
      S.nook.drops -= p.cost;
      S.nook.owned.push(id);
      celebrate("🍯", `${p.name} moved in!`, p.line);
    }
    S.nook.pet = id;
    nookPending = { mood: "cheer", say: `Hi! I'm ${p.name}. ${p.line}` };
    commit();
  },
  "nook-room": (el) => {
    const id = el.dataset.id;
    if (id !== "auto" && !S.nook.owned.includes(id)) {
      const r = NOOK_ROOMS[id];
      if (S.nook.drops < r.cost) return toast(`Earn ${r.cost - S.nook.drops} more honey drops for this room`);
      S.nook.drops -= r.cost;
      S.nook.owned.push(id);
      celebrate("✨", `${r.name} unlocked`, "Your nook has a new look.");
    }
    S.nook.room = id;
    commit();
  },
});
