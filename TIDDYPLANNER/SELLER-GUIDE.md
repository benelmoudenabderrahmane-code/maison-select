# Seller guide

How to go from this folder to three live Etsy listings.

## 1. Personalise

Open `budget-planner/config.json` in the project:

```json
{
  "shopUrl": "https://tidyplannercoart.etsy.com",
  "publicUrl": "https://tiddyplanner.netlify.app",
  "editions": [ { "appName": "Lumi Budget", "hostedDir": "lumi/planner-…", … }, … ]
}
```

- `shopUrl`: your Etsy shop link. It's used in the demos ("Get the full planner") and the PDFs.
- `publicUrl`: the address of your site once it's online (step 2).
- `appName` (per edition): the app's name. **Check it isn't someone else's trademark before you sell.**
- `hostedDir` (per edition): the hard-to-guess path of each app online. Change it if you want new links.

Then rebuild everything:

```bash
npm run planner:kit    # apps + demos + PDFs + icons + Lumi images + TIDDYPLANNER.zip
npm run planner:build  # apps only (fast)
npm run planner:test   # automated audit of all three apps
```

Rendering the PDFs, icons and images needs Playwright (`npm i -D playwright`).

## 2. Put the apps online (free)

Your site is **https://tiddyplanner.netlify.app** (Netlify project `tiddyplanner`). To publish or update it, open <https://app.netlify.com/projects/tiddyplanner/deploys> and drag and drop the **`site`** folder onto the page. Always use that page, so the address stays the same.

To host somewhere else instead, use **Netlify Drop** or **Cloudflare Pages**. Both have free plans; check their terms for commercial use.

1. Go to <https://app.netlify.com/drop>.
2. Drag and drop the **`site`** folder.
3. Netlify gives you an address, for example `https://tiddyplanner.netlify.app`.
4. Put it in `publicUrl`, then run `npm run planner:kit` again so the PDFs and listings contain the right links.
5. Upload the new `site` folder again (Netlify → Deploys → drag and drop).

Each app's links will then be:

| App | Buyer link | Demo link |
|---|---|---|
| Lumi Budget | `<publicUrl>/lumi/planner-…/` | `<publicUrl>/lumi/planner-…/demo/` |
| Lila Bloom | `<publicUrl>/lila/planner-…/` | `<publicUrl>/lila/planner-…/demo/` |
| Cherry Blossom | `<publicUrl>/cherry/planner-…/` | `<publicUrl>/cherry/planner-…/demo/` |

The exact paths are printed when you build. They're also in each PDF.

> The hard-to-guess link isn't real protection: anyone who has it can share it. That's true of every digital product on Etsy.

Avoid Vercel's free (Hobby) plan for this: it's for non-commercial use only.

## 3. Create each Etsy listing

1. **Add a listing** → type **Digital**.
2. **Photos:** your images. The first one is the thumbnail, so make it bold and readable small. Lumi's 8 images are in `1-Lumi-Budget/images/`. The other two `LISTING.md` files have a shot list.
3. **Title, tags, description:** copy them from `LISTING.md`.
4. **Digital files:** `<Name>-Buyer-Guide.pdf` and `<Name>-Planner.html`. Zip the HTML if Etsy refuses it.
5. **Price:** launch at $12.99 with a visible sale, then $17.99–$24.99 after about 10 reviews.
6. **Settings → Message to buyers:** paste the message from `LISTING.md`.

## 4. Making your own listing images

Open a demo file (`<Name>-Demo.html`) in Chrome. It's already filled with realistic sample data.

- Set the window to 1440×900, open the page you want, and take a screenshot (Windows: `Win + Shift + S`).
- To switch to night mode, press **D**. To blur amounts, press **P**.
- Recommended canvas: 2000×2000 px (or 3000×2250, 4:3). Keep text large: buyers see the thumbnail on phones.
- A 5–15 second screen recording (track a spend → confetti) makes a great listing video.

## 5. Tips to sell more

- **Free demo:** put the demo link near the top of the description and on the first image.
- **Three listings, three audiences:** Lumi ("ADHD budget planner"), Lila ("lavender / purple aesthetic"), Cherry ("cherry blossom / pink aesthetic"). Each `LISTING.md` targets different keywords.
- **Bundle:** later, add a 4th listing with all three apps at a discount.
- **Reviews:** reply to every message fast. Follow Etsy's rules: never trade incentives for reviews.
- **Tags:** after 30 days, check Etsy Stats and swap tags that bring no visits (alternatives in each `LISTING.md`).

## 6. Support answers (copy & paste)

**"My data disappeared."** It's saved in the browser on that device. Opening the planner in another browser or device, using private mode, or clearing browsing data starts fresh. Restore from **Settings → Restore backup** if you saved one.

**"How do I use it on my phone and computer?"** Back up on one device (Settings → Back up), send yourself the file, then use Restore backup on the other one. Data doesn't sync automatically.

**"Can I change the currency?"** Yes: Settings → Currency (24 currencies).

**"Is my information safe?"** Yes. Nothing leaves your device. There's no account and no server storing your data.
