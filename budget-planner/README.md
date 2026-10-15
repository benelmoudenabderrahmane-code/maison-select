# Budget planner apps (Lumi Budget · Lila Bloom · Cherry Blossom)

A calm, ADHD-friendly budget planner, sold as a digital product in three designs ("editions"). It's a dependency-free vanilla JS app that builds into **one self-contained HTML file per edition**. The file runs offline when downloaded, or from a URL, where it can be installed as a PWA.

Deliverables are generated into [`../TIDDYPLANNER/`](../TIDDYPLANNER/README.md). The seller guide is [`package/SELLER-GUIDE.md`](package/SELLER-GUIDE.md).

## Build

```bash
npm run planner:build   # every edition → TIDDYPLANNER/<n>-<Name>/ and TIDDYPLANNER/site/<hostedDir>/
npm run planner:kit     # + icons, buyer PDFs, Lumi listing images, TIDDYPLANNER.zip (needs Playwright)
npm run planner:test    # end-to-end audit of every edition (needs Playwright)
```

Settings live in `config.json`: shop URL, public URL, and per edition the name, storage key, hosted path, fonts, skin options and PDF brand colours.

## Editions

Each edition shares the same engine and screens. What differs lives in `editions/<id>/`:

- `skin.css`: colour tokens and component overrides, appended after `src/styles.css`.
- `logo.svg`, `flourish.svg`, `side-art.svg`: injected into the sidebar, headings and savings hero.
- `icon.svg`: the favicon, plus PWA icons rendered by `kit.mjs`.
- `LISTING.md`: the Etsy copy.

Skin options in `config.json` are `monthNav` (`chips` | `compact`), `homeLayout` (`split` | `tiles`), `palette` (the default palette id; the palette sets themselves are in `01-core.js`) and `chartMono`.

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
  build.mjs       builds full + demo files per edition, PWA manifest & service worker, zip
  kit.mjs         renders icons, buyer PDFs and (Lumi) listing images
  test.mjs        end-to-end audit (engine, every screen on desktop + phone, main flows)
editions/         per-edition skin, art, icon and listing copy
package/          README + seller guide copied into TIDDYPLANNER/
etsy/templates/   HTML sources of the listing images and buyer guide
```

## How the money maths works

- **Scheduled items** (paychecks, bills, debt minimums, savings transfers) are recurrence rules. Checking one off creates a real transaction linked to it (`S.links`), and unchecking deletes that transaction.
- **Safe to spend (month)** = income received + paychecks still expected − spent − moved to savings − unpaid bills and debt minimums − planned savings transfers − safety buffer.
- **Today** = (safe to spend + today's unplanned spending) ÷ days left in the month, minus what you've already spent today.
- **Paycheck windows** run from one main paycheck to the next. Smaller income in a window is added to it.

Data is stored in `localStorage` (in the demo, `sessionStorage`) under each edition's own `storeKey`. Several planners opened from `file://` therefore never overwrite each other.
