# Lumi Budget

A calm, ADHD-friendly budget planner, sold as a digital product. It's a dependency-free vanilla JS app that builds into **one self-contained HTML file**, so it runs from a downloaded file (offline) or from a URL, where it can be installed as a PWA.

French seller guide: [GUIDE-VENDEUR-FR.md](GUIDE-VENDEUR-FR.md). Etsy copy: [etsy/LISTING.md](etsy/LISTING.md).

## Build

```bash
npm run planner:build   # app → dist/ and public/<hostedDir>/
npm run planner:etsy    # + screenshots, listing images, icons, buyer PDF (needs Playwright)
```

Settings live in `config.json` (app name, shop URL, public URL, hosted path).

## Layout

```
src/
  index.html      template (styles + script are inlined at build time)
  styles.css      theme tokens derived from --h/--s, light & dark
  01-core.js      utils, dates, money, state & storage
  02-engine.js    recurrence, schedule, safe-to-spend, paycheck windows, debt sim, badges
  03-ui.js        icons, SVG charts, modal, toast, confetti
  04-views.js     the 15 screens
  05-actions.js   forms, click/input handlers, CSV, backup, onboarding
  06-sample.js    deterministic sample data (relative to today)
  07-boot.js      shell, router, theme, global events, service worker
scripts/
  build.mjs       builds full + demo editions, PWA manifest & service worker
  etsy.mjs        renders etsy/images, etsy/build/shots, assets/icon-*.png, buyer PDF
etsy/templates/   HTML sources of the listing images and buyer guide
```

## How the money maths works

- **Scheduled items** (paychecks, bills, debt minimums, savings transfers) are recurrence rules. Checking one off creates a real transaction linked to it (`S.links`), and unchecking deletes that transaction.
- **Safe to spend (month)** = income received + paychecks still expected − spent − moved to savings − unpaid bills and debt minimums − planned savings transfers − safety buffer.
- **Today** = (safe to spend + today's unplanned spending) ÷ days left in the month, minus what you've already spent today.
- **Paycheck windows** run from one main paycheck to the next. Smaller income in a window is added to it.

Data is stored in `localStorage` (in the demo, `sessionStorage`) under `lumi-budget-v1`.
