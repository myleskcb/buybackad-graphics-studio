# Graphics Studio: UX, SEO and back-end audit, 2026-09-22

Scope: https://buybackad-graphics-studio.netlify.app, checked against branch `studio-ux`
(live build plus the unreleased `iphonesla-link.js`). The page was driven in headless
Chrome at 390px and 1440px. Live URLs were checked with curl and DNS with dns.google.
Competitor facts come from their own pages where possible; the URL is given for each,
and anything third-party is marked. Canva's own pages answered 403 to a fetch, so its
prices come from third-party write-ups.

Findings are ranked **Must** (fix before the presentation), **Soon** (next week) and
**Later**. A "(fixed)" tag means this branch fixes it.

---

## 1. The ten things that matter most

| # | Rank | Finding |
|---|---|---|
| 1 | Must (fixed) | **Search engines were told the site lives at a domain that does not exist.** `buyback.ad` is NXDOMAIN. It has no A, NS or MX record; dns.google returns Status 3. Yet the canonical tag, og:url, og:image, robots.txt and sitemap.xml all pointed there. So Google was told the real page is a copy of a missing one, and every shared link had a broken picture. |
| 2 | Must (owner) | **Every email address on the site bounces.** `hello@buyback.ad` is on the UGC, partnership, B2B, "Schedule a call" and "Contact us" buttons. A domain that does not exist cannot receive mail. The branch adds a working contact next to them (text (562) 999-4994, the number the terms and privacy pages already give) but leaves the mailto links alone. Choosing a real address, or registering buyback.ad, is the owner's call. |
| 3 | Must (fixed) | **The link-preview image was missing.** `og:image` pointed at `assets/tplbg/cash_offer.jpg`, which is not in the deploy under any domain. There is now a real 1200×630 card at `assets/og/buybackad-og.jpg`. |
| 4 | Must (fixed) | **The hero said "No account to start", but downloading requires an account.** A visitor designs an ad, presses Download and hits a sign-in wall. The line now says so up front: "Design without an account. A free account downloads 3 ads a week." |
| 5 | Must (fixed) | **Pricing described a different free tier from the one people click.** The cards said "55+"/"50+ free templates" and "160+"/"240+ templates" (counted from the 243 classic templates). The gallery gates its cards another way (`scIsFree`): every Phones design plus the top 3 of each other category, 170 of 938 cards today. The sign-up chooser also said "Starter, 20 starter templates". All three now describe the actual gate, and none of them carries a number that a re-bake would make stale. |
| 6 | Must (fixed) | **The whole product was one URL.** There was no page a reseller searching "we buy gold flyer template" could land on. Added: an about page, eight category pages (`ads/we-buy-*.html`), FAQ and product structured data, an honest sitemap, and indexable terms and privacy pages. |
| 7 | Must (fixed) | **Internal files were public.** `deploy-notes/`, `spec/`, `tools/`, seven `scratch_*` folders, `worker.js`, the lockfiles and `assets/library.sqlite` were all live at 200. None of them contains a secret; I grepped for Stripe, Google and fal key shapes. They now 404 at the edge. The owner tools (`lab/`, `pick.html`, `library.html`, `phonegfx-studio.html`) stay reachable but carry `X-Robots-Tag: noindex` and a robots Disallow. |
| 8 | Soon | **Plan limits are enforced by the browser.** The function counts exports and returns `{maxPx, watermark}`, but the browser draws the watermark and the image. Anyone with devtools gets a 2160px image with no watermark while still being counted as Free. The README's "browser tricks can't bypass them" is only true of the count. |
| 9 | Soon | **Login has no rate limit and the gallery shows part of your email.** `/auth/login` can be hammered freely, with no limit per IP or per account. `/community/list` returns `by: <the part of the email before @>` for every shared background, publicly. The page never displays it, but the API gives it to anyone. |
| 10 | Soon | **On a phone, you type in Easy Mode without seeing the ad.** At 390px the preview (step 3) sits below the whole form, so every keystroke changes a picture that is off screen. The standard answer (Canva, Adobe Express) is a pinned preview or a Preview button. |

---

## 2. Competitive picture

| | Graphics Studio | Canva | Adobe Express | VistaCreate | Kittl | Placeit |
|---|---|---|---|---|---|---|
| Paid price | $15/mo | $18/mo or $144/yr (third party: [usecarly](https://www.usecarly.com/blog/canva-pricing/)) | $9.99/mo, 30-day trial ([pricing](https://www.adobe.com/express/pricing)) | $10/mo or $120/yr, 14-day trial ([plans](https://create.vista.com/plans/)) | Pro $15/mo or $144/yr ([pricing JSON-LD](https://www.kittl.com/pricing)) | $89.69/yr ([placeit.net](https://placeit.net/)) |
| Free tier | 3 exports/week, 1080px, watermark | Free plan, JPG/PNG ([download types](https://www.canva.com/help/download-file-types/)) | Free, JPEG/PNG/PDF, no brand kit or resize ([pricing](https://www.adobe.com/express/pricing)) | 1 brand kit ([plans](https://create.vista.com/plans/)) | Personal use only ([pricing](https://www.kittl.com/pricing)) | n/a |
| Brand kit | Free (number, website, name, area) | Pro only ([brand-kit](https://www.canva.com/pro/brand-kit/)) | Premium only | Pro: unlimited | n/a | n/a |
| Resize | Pick one of 6 sizes before download | Magic Resize, Pro ([resize](https://www.canva.com/help/resize/)) | One-click Resize, Premium | One-click resizer, Pro | n/a | n/a |
| Niche copy | Written for 8 buyback markets | General purpose | General purpose | General purpose | General purpose | Industry tags ([flyer-maker](https://placeit.net/flyer-maker)) |
| Local copy | ZIP → names nearby towns | No | No | No | No | No |

Reseller tools: **Vendoo** ([pricing](https://vendoo.co/pricing)), **List Perfectly**
([pricing](https://listperfectly.com/pricing/)) and **Crosslist**
([pricing](https://crosslist.com/pricing/)) all sell listing and photo tools. They offer
background removal, crop and resize, from $14.99 to $99+ a month. None of them makes
ads. Poshmark's Promoted Closet ([learn](https://poshmark.com/promoted-closet/learn)) and
Mercari's Promote (third party: [oneshop](https://tools.oneshop.com/blog/promote-mercari))
are paid placement, not graphics. The closest analogue to "WE BUY" is the bandit-sign
trade. **Dirt Cheap Signs** has a page per "We Buy Houses" template
([example](https://www.dirtcheapsigns.com/Design-Templates/investor-yard-signs/1040__temp.php)),
tells you to "swap in your phone number", shows price per sign, has an FAQ, and prints its
phone number and address on every page.

**What that means:**
- The niche is open. No design tool writes for buyback resellers, and no reseller tool
  makes ads.
- The things that set this studio apart are free here and paid everywhere else: a
  brand kit that fills itself in, and a choice of export sizes. So the site should say
  so plainly. The new about page does, without comparing to anyone by name.
- $15/mo equals Kittl Pro and sits above Adobe Express ($9.99) and VistaCreate ($10).
  Both of those offer a trial, and no annual plan exists here. See "Soon".

---

## 3. Findings by area

### First run and onboarding
- **Must (fixed):** the misleading "No account to start" line (item 4).
- **Soon:** the first click on any card opens a "Where do you buy?" dialog before the
  studio is visible. It explains itself well, but it asks for something before showing
  anything.
  - Canva asks one question at sign-up ("What will you be using Canva for?", third party:
    [AYSO wiki](https://wiki.ayso.org/wiki/Canva)).
  - The better question here is "What do you buy?", which picks the category. The ZIP
    can wait until the first service-area line needs it.
- **Soon:** Download in Easy Mode with no background picked opens a second dialog, "No
  background selected… Export without background". A first-time user meets two dialogs
  and a sign-in wall on the way to one download. Pre-select the template's own backdrop
  so the dialog only appears when someone removes it.
- **Soon (fixed partly):** Escape did nothing on any dialog. `site-ux.js` now makes
  Escape do exactly what a click on the dialog's backdrop already does. Focus is still
  not trapped inside dialogs or returned afterwards.
- **Later:** the ZIP placeholder "92101 or San Diego, CA" is cut off at 390px.

### Template discovery
- **Good:** real filter chips with counts, family filters, and cards that open ready to
  edit. The gallery is the product and it leads the page.
- **Fixed:** the gallery can now be opened on one category from a link (`?cat=gold`).
  The category pages use this.
- **Soon:** there is no search box. Placeit shows filterable counts and 40+ industry
  tags ([flyer-maker](https://placeit.net/flyer-maker)). With 938 cards, typing "iPad"
  or "junk car" matters.
- **Later:** a card doesn't say whether it is free until it is clicked. A lock or "PRO"
  badge on the gallery card, like the Easy Mode strip already shows, would help.

### Editing
- **Good:** Easy Mode plus the advanced editor, undo and redo, grid and snap, six sizes,
  and a brand kit.
- **Soon:** the Easy Mode preview is off screen on phones (item 10).
- **Later:** the nav's emoji labels (🌐 ⬇ ✦ 👤 💾) render differently across operating
  systems.

### Export and formats
- **Good:** PNG in six sizes. The plan caps the short side, so rectangular ads keep their
  shape.
- **Later:** there is no JPG or PDF export. Adobe's free tier has both
  ([pricing](https://www.adobe.com/express/pricing)), and a print shop wants a PDF for the
  flyer size.

### Pricing clarity
- **Fixed:** free and Pro are described by how the gate actually works (item 5). The
  about page has a plain free vs Pro table, and a new FAQ answers "what counts as an
  export" (re-downloads count too, per `redownloadRecord`).
- **Unverified:** whether Stripe is switched on in production. `/api/auth/config`
  answers, so the function runs. Checkout needs a signed-in account, and I did not create
  one on the live site. If Stripe is not configured, Go Pro now says "Pro checkout is not
  open yet. Nothing was charged" instead of "Checkout failed: Billing is not enabled
  yet".
- **Soon:** add either a trial or an annual price. Every comparable tool shows one.

### Trust and site information
- **Must (owner):** the dead email (item 2).
- **Fixed:**
  - An about page covering what the tool is, who it's for, how it works, what is free and
    what Pro adds, what it does not do, and your data.
  - The privacy page now lists every case where data leaves the device. Four were missing
    before:
    - AI background keywords go to Gemini or fal
    - the iPhones.LA connect link sends downloads to that shop
    - fonts and libraries load from CDNs
    - "Locate me" is resolved on the device.
  - Terms and privacy are now indexable and in the site's look.
  - The 404 page was orange on brown, the combination the owner has rejected. It now uses
    the site's graphite and orchid.
- **Soon:**
  - The stats row mixes counts the page works out itself (palettes, gallery) with ones
    typed by hand (243 layouts, 478 cutouts, 363 backdrops).
  - The lead figure, "170,000+ ad variations", is a product of multiplying options, and
    I could not reproduce it. Remove it or compute it on the page.
  - The "Template Lab" pill is the most prominent button in the mobile nav. It was put
    there on purpose (the comment says the lab is reviewed from a phone). For a customer
    demo it is internal tooling in the front window.

### SEO
- **Fixed:**
  - title and meta description (the old ones claimed "160+ templates")
  - canonical tags, the full Open Graph and Twitter card sets, and the preview image
  - JSON-LD:
    - WebSite
    - WebApplication with Free and $15 Offers
    - FAQPage, generated from the visible FAQ by `scripts/build_seo_pages.mjs`
    - AboutPage
    - BreadcrumbList and FAQPage on each category page
  - the sitemap: 12 real, indexable URLs
  - robots.txt, a favicon file for the plain pages, and footer links to every category
    page
  - This follows the structure Adobe and Placeit use (Adobe's
    [flyer page](https://www.adobe.com/express/create/flyer) is H1, how-to steps, FAQ).
    Placeit's source carries BreadcrumbList and HowTo.
- **Soon:** the home page's crawlable text is thin. The gallery is drawn by JavaScript,
  so a crawler sees headings and copy but no template names. The category pages make up
  for most of this.
- **Later:**
  - Once the graphics re-bake settles, add 3 or 4 real example images per category page.
    They show product cutouts today, so a re-bake cannot break them.
  - Register the site in Google Search Console once there is a final domain, then move
    every canonical URL at once. The list is in the comment in `index.html`.

### Performance
- **Good:** measured locally, the landing page loads with no console errors and no
  failed requests. Earlier work on showcase thumbnails and preloads holds up.
- **Later:** `app.js` is 716 KB and `tplbg-data.js` 635 KB, both parsed on every visit,
  including by people who never open the studio. `pick.html` (2.5 MB) and
  `phonegfx-studio.html` (1 MB) are public, but no page loads them.

### Accessibility
- **Checked, all pages touched, 390px and 1440px:**
  - no images without alt text
  - no unnamed buttons, and no unlabelled inputs on the landing page
  - no horizontal overflow.
- **Fixed:**
  - Escape closes dialogs.
  - The display face's narrow word space made the hero read "Buybackadsthat" at 58px; it
    now has word spacing.
  - The new pages have a skip link, `:focus-visible` rings, one H1, and a real
    `<header>`, `<nav>`, `<main>` and `<footer>`.
- **Soon:**
  - Dialogs trap no focus and return none.
  - Several controls are glyph-only (◐ ⇄ ↩ ↪ ✎), named only through `title`, which screen
    readers treat unreliably. Add `aria-label`.

### Back end (`netlify/functions/api.mjs`, headers)
- **Soon:** client-side enforcement (item 8). The real fix is to render or watermark on
  the server, or accept this as a soft limit and say so in the README.
- **Soon:** login and signup have no rate limit (item 9). Reuse `bumpCounter` per IP and
  per email, as `/generate-bg` already does.
- **Soon:** `/community/list` exposes the part of each publisher's email before the @.
  Drop the `by` field, since nothing displays it.
- **Soon:** `/community/publish` stores any string as `data` and serves it to every user.
  There is a size limit but no check that it is an image and no moderation. The admin
  route checks the data URL's type; this route should too.
- **Later:** the community index is read-modify-write with no lock, so two publishes at
  once can drop one.
- **Later:** a 500 returns `'Server error: ' + err.message` to the client. Log it and
  return a generic message.
- **Later:** the token signature is compared with `!==` rather than a constant-time
  compare. Tokens last 30 days with no way to revoke them, and live in localStorage.
- **Later:** Stripe handles only `checkout.session.completed` and
  `customer.subscription.deleted`. Nothing reacts to a failed payment or a past-due
  subscription.
- **Fixed:** `aiPolish()` (Enhance) called `api.anthropic.com` from the browser with no
  key. The site's own CSP blocks that, so every Enhance logged a CSP violation. It now
  returns immediately; the local cleanup it fell back to is unchanged.
- **Note:** the CSP has no `unsafe-inline` for scripts. JSON-LD blocks are not
  executable, so CSP does not apply to them. However, `scripts/csp_hashes.mjs` hashes
  them anyway, and I reverted the two hashes it added. Re-run it only after editing the
  two executable inline scripts. Otherwise the FAQPage hash goes stale every time the FAQ
  changes, for nothing.
- **Note:** `worker.js`, the old Cloudflare backend, duplicates `api.mjs` and is not
  deployed. It now 404s.

---

## 4. What this branch changes
See the commit. For merging with the graphics work, `index.html`, `app.js` and
`styles.css` are listed in the final report.
