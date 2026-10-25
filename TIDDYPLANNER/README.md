# TIDDYPLANNER — 3 budget planner apps, ready to sell

Each folder is one Etsy listing: a premium, ADHD-friendly budget planner app that works **online** (private link, installable on phones) and **offline** (a single HTML file).

| Folder | App | Look |
|---|---|---|
| `1-Lumi-Budget/` | **Lumi Budget** | Blush & cream, elegant serif. Includes 8 finished listing images. |
| `2-Lila-Bloom/` | **Lila Bloom** | Soft lavender, white cards, deep plum accents. |
| `3-Cherry-Blossom/` | **Cherry Blossom** | Warm cream, crimson serif, blush & sage, blossom art. |
| `4-Sage-Honey/` | **Sage & Honey** | Ivory, sage & honey. Starts from your real balance: available until payday, envelopes, Can I afford it?, Fresh start, Money back, Fees check, Apple Pay quick entry. |
| `site/` | Online versions of all four | Upload this folder once to host every app. |

## What's in each app folder

| File | Use |
|---|---|
| `<Name>-Planner.html` | **The product.** Buyers download it. It works offline — just double-click it. |
| `<Name>-Demo.html` | Free demo: sample data, resets when the tab closes, no backups. |
| `<Name>-Buyer-Guide.pdf` | The "Start here" PDF buyers download first. It has their private link and instructions. |
| `LISTING.md` | Title, 13 tags, description, buyer message and an image shot list, ready to paste into Etsy. |
| `images/` | Lumi only: 8 listing images at 2000×2000. |

## Quick start

1. Host `site/` for free (see `SELLER-GUIDE.md` → *Put the apps online*).
2. Put your real site address and shop link in `budget-planner/config.json`, then run `npm run planner:kit` to rebuild. The PDFs, demo links and listing copy then point to your site.
3. For each app, create an Etsy listing: paste from `LISTING.md`, upload the PDF and the Planner HTML, and add your images.

Everything is explained step by step in **`SELLER-GUIDE.md`**.

## Features (all four apps)

Safe to spend (month and today) · Paycheck plan · Calendar with check-off bills and paydays · Sortable spending log with category donut and CSV import/export · Envelope budget with rollover · Bills & subscription audit · Savings goals with next contribution and savings-rhythm chart · Snowball/avalanche debt planner · Goals with steps · Impulse Pause · Streaks, no-spend challenge and 15 badges · Year in review · 8 colour themes plus a custom colour · Day/night mode · Focus mode · Privacy blur · Readable font & large text · 24 currencies · Backup & restore · Print · Installable app (PWA).
