/* ==========================================================================
   Sample data — realistic, relative to today, deterministic
   ========================================================================== */

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadSample() {
  const keep = { ...S.settings };
  S = freshState();
  S.settings = { ...S.settings, ...keep };
  const rnd = mulberry32(20261015);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const between = (a, b) => round2(a + rnd() * (b - a));
  const today = todayISO();
  const thisMk = monthKey(today);
  const recentMk = addMonths(thisMk, -3);
  // History from January (at least 3 months), so monthly charts and the year review fill in.
  const startMk = `${thisMk.slice(0, 4)}-01` < recentMk ? `${thisMk.slice(0, 4)}-01` : recentMk;
  S.createdAt = monthStart(startMk);
  S.onboarded = true;
  S.profile = { ...S.profile, name: "Alex", currency: S.profile.currency || "USD", buffer: 100 };
  S.categories = S.categories.filter((c) => !["Pets", "Kids"].includes(c.name));
  const cat = (name) => S.categories.find((c) => c.name === name).id;
  const day = (d) => `${startMk}-${pad(d)}`;

  // Biweekly paycheck on Fridays, aligned so one lands in the next two weeks.
  let friday = today;
  while (fromISO(friday).getDay() !== 5) friday = addDays(friday, -1);
  const payAnchor = addDays(friday, -14 * 30);
  S.incomes = [
    { id: uid(), name: "Paycheck", emoji: "💰", amount: 2100, freq: "biweekly", anchor: payAnchor, endDate: "" },
    { id: uid(), name: "Etsy shop sales", emoji: "🧶", amount: 320, freq: "monthly", anchor: day(25), endDate: "" },
  ];
  const bill = (name, amount, d, catName, extra = {}) => ({ id: uid(), name, amount, freq: "monthly", anchor: day(d), catId: cat(catName), emoji: "", autopay: false, isSub: false, endDate: "", ...extra });
  S.bills = [
    bill("Rent", 1450, 1, "Rent / Mortgage", { emoji: "🏠" }),
    bill("Electricity", 92, 12, "Utilities", { autopay: true, emoji: "💡" }),
    bill("Water", 41, 20, "Utilities", { emoji: "🚿" }),
    bill("Phone bill", 45, 18, "Phone & Internet", { autopay: true, emoji: "📱" }),
    bill("Internet", 60, 22, "Phone & Internet", { emoji: "🌐" }),
    bill("Car insurance", 130, 8, "Insurance", { autopay: true, emoji: "🛡️" }),
    bill("Gym membership", 45, 25, "Health & Fitness", { isSub: true, emoji: "💪", review: "keep" }),
    bill("Netflix", 15.49, 14, "Subscriptions", { isSub: true, autopay: true, emoji: "🎬", review: "keep" }),
    bill("Spotify", 11.99, 3, "Subscriptions", { isSub: true, autopay: true, emoji: "🎧" }),
    bill("Cloud storage", 2.99, 9, "Subscriptions", { isSub: true, autopay: true, emoji: "☁️" }),
    bill("Meditation app", 12.99, 27, "Subscriptions", { isSub: true, autopay: true, emoji: "🧘", review: "cancel" }),
  ];
  S.debts = [
    { id: uid(), name: "Visa credit card", balance: 3470, original: 4800, apr: 24.99, minimum: 90, anchor: day(15) },
    { id: uid(), name: "Car loan", balance: 15430, original: 22000, apr: 6.9, minimum: 310, anchor: day(5) },
    { id: uid(), name: "Student loan", balance: 8240, original: 12000, apr: 4.5, minimum: 180, anchor: day(28) },
  ];
  const emergency = { id: uid(), name: "Emergency fund", emoji: "🛟", target: 10000, saved: 4000, monthly: 200, freq: "monthly", anchor: day(16), targetDate: `${addMonths(thisMk, 20)}-01`, hue: 205 };
  const trip = { id: uid(), name: "Portugal trip", emoji: "✈️", target: 3000, saved: 1100, monthly: 150, freq: "monthly", anchor: day(16), targetDate: `${addMonths(thisMk, 8)}-01`, hue: 14 };
  const laptop = { id: uid(), name: "New laptop", emoji: "💻", target: 1800, saved: 520, monthly: 100, freq: "monthly", anchor: day(2), targetDate: "", hue: 265 };
  S.funds = [emergency, trip, laptop];
  S.goals = [
    { id: uid(), name: "3-month emergency cushion", emoji: "🛟", why: "So a surprise bill never ruins my month again", targetDate: emergency.targetDate, status: "progress", fundId: emergency.id, steps: [{ text: "Open a high-yield savings account", done: true }, { text: "Automate $200 every month", done: true }, { text: "Reach $5,000", done: false }, { text: "Reach $10,000", done: false }] },
    { id: uid(), name: "Pay off the Visa card", emoji: "💳", why: "24.99% interest is stealing from future me", targetDate: "", status: "progress", fundId: "", steps: [{ text: "Stop using the card for daily spends", done: true }, { text: "Add $100 extra each month", done: false }, { text: "Call to ask for a lower rate", done: false }] },
    { id: uid(), name: "Lisbon & Porto with friends", emoji: "✈️", why: "Pastel de nata on the beach!", targetDate: trip.targetDate, status: "not", fundId: trip.id, steps: [{ text: "Pick dates with the group", done: false }, { text: "Book flights early", done: false }] },
    { id: uid(), name: "Learn to meal-prep", emoji: "🥗", why: "Less takeout, more energy", targetDate: "", status: "done", fundId: "", steps: [{ text: "Find 5 easy recipes", done: true }, { text: "Prep every Sunday for a month", done: true }] },
  ];

  // Everyday spending, day by day, up to today.
  const SPENDS = [
    ["Coffee & Treats", 0.32, ["Corner cafe", "Iced latte", "Bakery stop"], 4.5, 7.5],
    ["Groceries", 0.17, ["Trader Joe's", "Whole Foods", "Farmers market", "Costco run"], 28, 135],
    ["Dining Out", 0.11, ["Tacos with friends", "Sushi night", "Pizza Friday", "Brunch"], 18, 62],
    ["Transportation", 0.11, ["Gas", "Rideshare", "Parking", "Train ticket"], 9, 52],
    ["Shopping", 0.06, ["Target run", "New sneakers", "Home decor", "Books"], 15, 85],
    ["Entertainment", 0.05, ["Movie night", "Concert tickets", "Bowling", "Museum"], 12, 48],
    ["Personal Care", 0.035, ["Haircut", "Skincare", "Pharmacy"], 12, 45],
    ["Gifts & Donations", 0.02, ["Birthday gift", "Charity"], 20, 45],
    ["Miscellaneous", 0.025, ["Hardware store", "Post office", "Phone case"], 8, 30],
  ];
  for (let d = S.createdAt; d <= today; d = addDays(d, 1)) {
    let spentToday = false;
    const quiet = rnd() < 0.16; // some genuinely quiet days
    for (const [c, p, names, lo, hi] of SPENDS) {
      if (quiet || rnd() > p) continue;
      if (d === today && c !== "Coffee & Treats") continue;
      S.transactions.push({ id: uid(), createdAt: Date.parse(d) + S.transactions.length, type: "expense", catId: cat(c), name: pick(names), amount: between(lo, hi), date: d, note: "" });
      spentToday = true;
    }
    if (!spentToday && d < today && rnd() < 0.8) S.noSpend[d] = true;
  }
  // Something tracked today, so the Today view isn't empty.
  if (!S.transactions.some((t) => t.date === today)) S.transactions.push({ id: uid(), createdAt: Date.now() - 1, type: "expense", catId: cat("Coffee & Treats"), name: "Iced latte", amount: 5.4, date: today, note: "" });
  // A one-off and a note, for realism.
  S.transactions.push({ id: uid(), createdAt: Date.now(), type: "expense", catId: cat("Shopping"), name: "Winter coat", amount: 96, date: addDays(today, -9), note: "On sale!" });

  // Check off everything scheduled before today, and today's paycheck if any. Older months are
  // recorded too, but balances are kept as if the planner started 3 months ago.
  const early = { debts: S.debts.map((d) => d.balance), funds: S.funds.map((f) => f.saved) };
  for (const o of scheduleIn(S.createdAt, addDays(monthStart(recentMk), -1))) toggleOccurrence(o);
  S.debts.forEach((d, i) => { d.balance = early.debts[i]; });
  S.funds.forEach((f, i) => { f.saved = early.funds[i]; });
  for (const o of scheduleIn(monthStart(recentMk), today)) if (o.date < today || o.kind === "income") toggleOccurrence(o);

  // Habits: a solid recent streak plus scattered earlier check-ins.
  for (let i = 0; i < 90; i++) {
    const d = addDays(today, -i);
    if (d < S.createdAt) break;
    if (i < 12 || rnd() < 0.55) S.checkins[d] = true;
    if (i < 12 && rnd() < 0.7) S.moods[d] = pick(["🙂", "🙂", "😐", "🤩", "😟"]);
  }
  const hours = 3600000;
  S.wishlist = [
    { id: uid(), name: "Cozy cardigan", price: 68, link: "", addedAt: Date.now() - 20 * hours, readyAt: Date.now() + 28 * hours },
    { id: uid(), name: "Air fryer", price: 89, link: "", addedAt: Date.now() - 52 * hours, readyAt: Date.now() - 4 * hours },
    { id: uid(), name: "Wireless earbuds", price: 129, link: "", addedAt: Date.now() - 10 * 24 * hours, readyAt: Date.now() - 8 * 24 * hours, decision: "skipped", decidedAt: Date.now() - 7 * 24 * hours },
    { id: uid(), name: "Desk plant", price: 34, link: "", addedAt: Date.now() - 20 * 24 * hours, readyAt: Date.now() - 18 * 24 * hours, decision: "bought", decidedAt: Date.now() - 17 * 24 * hours },
    { id: uid(), name: "Designer candle set", price: 58, link: "", addedAt: Date.now() - 30 * 24 * hours, readyAt: Date.now() - 28 * 24 * hours, decision: "skipped", decidedAt: Date.now() - 27 * 24 * hours },
  ];
  S.skippedTotal = 129 + 58;
  S.notes = "Ask landlord about lease renewal\nCancel the meditation app free trial before Friday!\nCheck if the gym has a cheaper off-peak plan";
  S.settings.lastBackup = today;
  checkBadges(true);
  saveNow();
  ui.month = thisMk;
  ui.calMonth = thisMk;
  ui.calSel = today;
  render();
}
