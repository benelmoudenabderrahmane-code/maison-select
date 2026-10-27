/* ==========================================================================
   Preview studio (Honey Nook page): try every friend, pose, reaction, time
   of day and room for free. Nothing is unlocked, spent or saved.
   ========================================================================== */
const STUDIO = {
  pet: [["", "Yours"], ...Object.entries(NOOK_PETS).map(([id, p]) => [id, p.name])],
  pose: [["", "Auto"], ["idle", "Sitting"], ["coin", "Holding a coin"], ["happy", "Happy"], ["cheer", "Cheering"], ["sleep", "Sleeping"]],
  time: [["", "Now"], ["morning", "Morning"], ["day", "Day"], ["golden", "Golden hour"], ["night", "Night"]],
  room: [["", "Yours"], ...Object.entries(NOOK_ROOMS).map(([id, r]) => [id, r.name])],
};
const studioOn = () => ui.view === "nook" && ui.nookPreview && Object.values(ui.nookPreview).some(Boolean);
const sp = (k) => (ui.view === "nook" && ui.nookPreview ? ui.nookPreview[k] || "" : "");
function nookStudio() {
  const row = (k, label) => `<div class="studio-row"><span class="studio-label">${label}</span><div class="chips">${STUDIO[k].filter(([v]) => k !== "room" || !v || nookImg(v)).map(([v, l]) => `<button type="button" class="chip ${sp(k) === v ? "on" : ""}" data-action="nook-preview" data-k="${k}" data-v="${v}" aria-pressed="${sp(k) === v}">${esc(l)}</button>`).join("")}</div></div>`;
  const pet = NOOK_PETS[sp("pet")] || nookPet();
  const soon = Object.values(pet.poses).every((x) => x === pet.poses.idle) ? `<p class="tiny">${esc(pet.name)}'s other poses are coming in an update.</p>` : "";
  return `<div class="card studio mt">
    <div class="card-head"><h2>${icon("sparkle", 20)} Preview studio</h2><span class="tiny">Try everything for free — nothing is unlocked or spent</span></div>
    ${row("pet", "Friend")}${row("pose", "Pose")}
    <div class="studio-row"><span class="studio-label">Reactions</span><div class="chips">
      <button type="button" class="chip" data-action="nook-play" data-mood="cheer" data-text="+3 🍯">▶ Hop &amp; cheer</button>
      <button type="button" class="chip" data-action="nook-play" data-mood="happy" data-text="♡">▶ Happy hello</button>
      <button type="button" class="chip" data-action="nook-play" data-mood="coin" data-text="+1 🍯">▶ Honey reward</button>
    </div></div>
    ${row("time", "Time of day")}${row("room", "Room")}
    ${soon}
    <div class="row wrap mt-s">${studioOn() ? `<button type="button" class="btn sm" data-action="nook-preview-reset">Back to my nook</button>` : ""}<span class="tiny">Your real nook follows the clock, the time of year and what you've unlocked.</span></div>
  </div>`;
}

if (NOOK) {
  const basePet = nookPet;
  nookPet = function () { return NOOK_PETS[sp("pet")] || basePet(); };
  const baseTime = nookTime;
  nookTime = function (d) { return sp("time") || baseTime(d); };
  const baseRoom = nookRoom;
  nookRoom = function (d) { return sp("room") || baseRoom(d); };
  const basePose = nookPose;
  nookPose = function (a) { return sp("pose") || basePose(a); };
}
Object.assign(ACTIONS, {
  "nook-preview": (el) => {
    ui.nookPreview = { ...(ui.nookPreview || {}), [el.dataset.k]: el.dataset.v };
    render();
  },
  "nook-preview-reset": () => { ui.nookPreview = null; render(); },
  "nook-play": (el) => {
    const pet = nookPet();
    nookPending = { mood: el.dataset.mood, text: el.dataset.text, say: el.dataset.mood === "cheer" ? "Yay! Another small win!" : el.dataset.mood === "happy" ? `${pet.name} is so happy to see you!` : "A honey drop for you 🍯" };
    nookAfterRender();
  },
});
