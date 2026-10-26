/* ==========================================================================
   Seasonal touches in the Honey Nook: falling leaves, Halloween pumpkins,
   holiday gifts, Valentine hearts and spring petals (Settings → Appearance).
   ========================================================================== */
const SEASONS = {
  halloween: { label: "Halloween week", e: "🎃", fall: "leaf", deco: ["🎃", "🎃"], line: "Happy Halloween! Treats fit in your guide 🎃" },
  autumn: { label: "Cozy autumn", e: "🍂", fall: "leaf", line: "Cozy season — a warm drink at home is a small win 🍂" },
  holidays: { label: "Holiday season", e: "🎄", fall: "", deco: ["🎁", "🎄"], line: "Gifts feel lighter with an envelope for them 🎁" },
  valentine: { label: "Valentine's", e: "💕", fall: "heart", line: "Loving yourself includes your future self 💕" },
  spring: { label: "Spring", e: "🌸", fall: "petal", line: "Fresh start season — perfect for a balance check 🌸" },
  summer: { label: "Summer", e: "☀️", fall: "", line: "Sunny days, calm money ☀️" },
};
function seasonNow(d = new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  if (m === 10 && day >= 15) return "halloween";
  if (m === 12) return "holidays";
  if (m === 2 && day <= 14) return "valentine";
  if ((m === 3 && day >= 20) || m === 4 || m === 5) return "spring";
  if ((m === 9 && day >= 22) || m === 10 || m === 11) return "autumn";
  if (m >= 6 && m <= 8) return "summer";
  return "";
}
function seasonOn() { return NOOK && S.settings.seasonal !== false && !!seasonNow(); }
function seasonLayer(id) {
  const s = SEASONS[id];
  const fall = s.fall ? `<div class="nook-fall fall-${s.fall}" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--x:${(i * 41 + 7) % 100}%;--d:${7 + (i % 5)}s;--w:${(i * 1.7) % 7}s;--r:${(i * 67) % 360}deg">${s.fall === "heart" ? "♥" : ""}</i>`).join("")}</div>` : "";
  const deco = s.deco ? `<div class="nook-deco" aria-hidden="true">${s.deco.map((e, i) => `<span class="d${i}">${e}</span>`).join("")}</div>` : "";
  return `${fall}${deco}<span class="nook-season-chip" title="${esc(s.label)}">${s.e} ${esc(s.label)}</span>`;
}

if (NOOK) {
  const baseScene = nookScene;
  nookScene = function (opts) {
    const html = baseScene(opts);
    if (!seasonOn()) return html;
    const id = seasonNow();
    return html.replace('<div class="nook ', `<div data-season="${id}" class="nook `).replace('<div class="nook-light" aria-hidden="true"></div>', `<div class="nook-light" aria-hidden="true"></div>${seasonLayer(id)}`);
  };
  const baseLine = nookLine;
  nookLine = function (a) {
    const line = baseLine(a);
    // Every other hour, a seasonal hello replaces the everyday encouragement (never over a real heads-up).
    if (seasonOn() && a && a.leftToday > 0 && !a.stale && !a.shortBy && !a.confirmPayday && nookTime() !== "night" && new Date().getHours() % 2 === 0) return SEASONS[seasonNow()].line;
    return line;
  };
}
Object.assign(INPUTS, { seasonal: (el, ev) => { if (ev.type !== "change") return; S.settings.seasonal = el.checked; commit(el.checked ? "Seasonal touches on" : "Seasonal touches off"); } });
