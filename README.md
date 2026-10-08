# BUYBACK.AD — deploy guide

## Frontend
Deploy a clean checkout of `main` with the Netlify CLI (AGENT-BRIEF.md,
"Deploying": draft first, look, then `--prod`). A local copy
(`python3 -m http.server 8899`) opened as `http://localhost:8899/?demo=1` runs
in **demo mode**: sign-up, plans, a simulated checkout, the 3-a-week free
limit, the 1080 cap and the watermark all work in the browser, so the whole
flow can be clicked through without a backend. `?demo=0` turns it off.

Or let GitHub deploy: `.github/workflows/deploy.yml` runs the same command on
every push to `main` once the repository secrets `NETLIFY_AUTH_TOKEN` and
`NETLIFY_SITE_ID` exist (`NETLIFY_SITE_ID_2` for the second project). Until
then it does nothing, and the Mac deploy stands.

## Backend — real accounts, real limits, real Stripe
One Netlify Function deployed with the site, `netlify/functions/api.mjs`,
answers at `/api/*` (`config.js` derives the path from where the app is
served). Accounts, download counts and the daily counters live in Netlify
Blobs (store `pgfx-users`). The Cloudflare Worker at `worker.js` is the
retired first version: not deployed, 404'd at the edge, kept for history.

Set these in Netlify (Project configuration → Environment variables), then
redeploy. `.env.example` is the local copy for `netlify dev`.

| variable | what it does |
|---|---|
| `JWT_SECRET` | required; any long random string, signs the sign-in tokens |
| `ADMIN_EMAILS` | comma-separated operator emails: no caps, no watermark, the admin tools |
| `GEMINI_KEY` | AI backgrounds (Gemini 3.1 Flash Lite Image by default; `PGFX_BG_MODEL` overrides it). `FAL_KEY` is the Seedream fallback. With neither, the button says the feature is not enabled yet |
| `MODEL_COSTS` | optional JSON, dollars a call per model, merged over the table in `netlify/lib/plans.mjs`. AI is sold in **credits** (one credit buys up to 4 cents of model cost; a call costs ceil(price / 4c)), and a model with no price is not sold. Add a model's price here or in `plans.mjs` before pointing `PGFX_BG_MODEL` at it |
| `AI_FREE_DAILY_CREDITS` / `AI_DAILY_CREDITS` | site-wide ceilings a day: the free tier's AI credits (default 100, about $4) and everyone's (default 2000, a runaway guard). `RL_USER_DAILY`, `RL_PRO_DAILY` and `RL_GLOBAL_DAILY` are retired: credits replace them |
| `STRIPE_SECRET` | **switches billing on.** The only Stripe setting needed: the prices, the products and the webhook make themselves (below). Until it is set, Go Pro says "Checkout is not open yet" and nothing is charged |
| `STRIPE_WEBHOOK_SECRET`, `PRICE_<KEY>`, `SITE_URL` | optional. A webhook you made by hand (otherwise the site registers its own); a price you made by hand (`PRICE_PRO_MONTH`, `PRICE_BUSINESS_YEAR`, `PRICE_CREDITS100`…; the old `PRICE_PRO` is `PRICE_PRO_MONTH`); the site's own https origin, where Stripe sends people back and events (defaults to Netlify's `URL`) |
| `GOOGLE_CLIENT_ID` | optional; shows the Google sign-in button |
| `LIBRARY_KEYS`, `LIBRARY_DAILY` | the partner library API, below |

Stripe, once (owner, 2026-10-08: "make it live we can use stripe"):
1. Stripe → Developers → API keys. Copy the **secret key**, `sk_test_…` to
   try it, `sk_live_…` to take money, into `STRIPE_SECRET` in Netlify
   (Project configuration → Environment variables), and redeploy.
2. That is all. The first checkout makes the products (`bbad_pro`,
   `bbad_business`, `bbad_credits`), the six prices under their lookup keys
   (`bbad_pro_month`, `bbad_pro_year`, `bbad_business_month`,
   `bbad_business_year`, `bbad_credits100`, `bbad_credits300`) and the webhook
   at `<SITE_URL>/api/stripe-webhook`, whose signing secret it keeps in Blobs.
   An operator can do it before the first customer: Plan & billing shows
   operators a Billing line with **Set up prices and webhook now**.
3. Walk it once with test keys and card 4242 4242 4242 4242: Choose Pro,
   pay, land back on "Payment successful!" on Pro; Switch to Business;
   buy 100 credits; Manage billing → cancel. Then swap in the live key.
   Test-mode customers and subscriptions are not carried into live mode.
4. Partner and creator discounts are Stripe promotion codes (Stripe →
   Coupons); Checkout shows the code field on the plans.

The plan switches on when the customer comes back from Checkout
(`/api/checkout/confirm` reads the session from Stripe), so it never waits
for the webhook. The webhook carries renewals, plan changes made in the
billing portal, failed cards and cancellations; without it, a paid account
whose period has run out is read from Stripe at its next sign-in. A price
changed in `plans.mjs` makes a new Stripe price on the next sale and moves
the lookup key to it; people already subscribed keep theirs.

## Plan rules (change in ONE place each side, and the copy)
`netlify/lib/plans.mjs` is the enforced truth: the plans, the credit packs,
each paid model's price and the margin targets. `PLANS`/`PACKS` in the SaaS
section of `app.js` (between `PLANS:BEGIN` and `PLANS:END`) is what the plans
page shows. The same numbers are written out in `index.html` (#pricing, the
FAQ, the sign-up chooser), `about.html`, `terms.html` and `COMMON_FAQ` in
`scripts/build_seo_pages.mjs`; run that script after editing the FAQ, it
rebuilds the ld-faq JSON-LD and the category pages. **`node
scripts/plan_economics.mjs` fails if any plan or pack can lose its margin at
worst, or if a copy says a different number.** `scripts/billing_check.mjs`
walks credits, downloads and the whole Stripe loop against a stand-in Stripe,
and the plans page and Checkout in Chromium.

| | Free | Pro | Business |
|---|---|---|---|
| Price | $0 | $15 a month, $150 a year | $39 a month, $390 a year |
| Downloads, photos or videos | 3 a week | 100 a month | 500 a month |
| Size, watermark | 1080 px, BUYBACK.AD marks | 2160 px, none | 2160 px, none |
| Designs | every Phones card + the top 3 of each other category | all | all |
| AI credits a month | 5 | 75 | 200 |
| Ads kept in the library | 12 | 300 | 1,000 |
| QR code layer | no | yes | yes |

Credit packs, any account, never expire, spent after the month's: 100 for
$9, 300 for $25. An AI background is 1 credit on the default model (a credit
covers up to 4 cents of model cost; Gemini 3 Pro Image would be 4), and a
failed one gives its credit back.

A download is a photo, or a video with its photo, from the studio or the
phone video maker at `/motion`, counted once, re-downloads included. The
maker makes and plays videos for anyone, with no account; downloading one
(or starring it into the library) goes through the plan like the studio's
videos: a free account, one download, and on Free the BUYBACK.AD marks on
every frame and a 1080 photo.

At worst (every credit spent, plus hosting), against what a price nets after
Stripe: Pro keeps 77% monthly and 73% yearly, Business 78% and 74%, the packs
53% and 50%, and a free account costs at most $0.22 a month
(`plan_economics.mjs` prints it).

## Notes
- Test first with Stripe **test keys** + card 4242 4242 4242 4242.
- No email verification / password reset in this MVP — add before wide launch.
- The money side, measured against the market and the model's price:
  `docs/SAAS-AUDIT-2026-10-05.md`.

## Formats
**Square 1:1 is the format the ads are designed for; Tall 3:4 comes second and
Story 9:16 is occasional** (owner, 2026-09-27). Both the editor (topbar picker)
and Easy Mode (the size chips) offer six: Square 1:1 (1080×1080), Tall 3:4
(1080×1440), Story 9:16 (1080×1920), Flyer 8.5×11 (1080×1398, prints at ~250
dpi on a Pro 2× export), Wide 16:9 (1920×1080) and Wide 4:3 (1440×1080).
Templates are authored square and re-flow into the chosen format; switching
back is lossless. Plan pixel caps apply to the short side, so rectangular
exports keep their aspect.

## Video ads
Every design also downloads as a 10-second video: **Download as video** in
Easy Mode, **Video** in the editor's export. The clip opens on the finished ad
(frame 0 is the still, so every feed thumbnail and muted autoplay shows the
ad), lets it breathe, and at 5.8 s shifts to a call to action built from the
card's own headline, action line, number and photograph (DESIGN-LAW rule 65).
It is MP4 (H.264 + AAC) where the browser can encode it and WebM (VP9 + Opus)
otherwise, encoded frame by frame, so switching tabs does not spoil it.

The export refuses the file, and does not spend an export, if frame 0 does
not match the still or the clip fails the WCAG 2.3.1 flash check (rule 66).

Every video download also saves **a photo of the ad** (OfferUp takes a
video only with a photo beside it): a PNG 1440 pixels on its short side, in
the video's aspect, drawn at that size from the video's best moment, which
`video-still.js` measures on the frames themselves (DESIGN-LAW rule 108). It
comes under the same export; Free's photo is 1080 with the watermark, the
plan's cap. The video maker at `/motion` does the same for its phone ads.
The photo is picked for you, and there is one alternative if you would rather
not use it (rule 110): **📷 This video's photo** under the video button in the
studio (**Other photo** in the maker) shows the picked one beside the one other
moment worth posting that looks different from it, read back out of the video
file exactly as it shows it. Each downloads on its own, or **Save both** (on a
phone, straight to Photos).
Check: `scripts/video_photo_check.mjs`.

Checks: `scripts/motion_audit.mjs` (every curated card and classic, per
format), `scripts/motion_export_check.mjs` (presses both buttons under the
production CSP and decodes the files), `scripts/motion_gallery.mjs` +
`scripts/gallery/build.py` (the playback gallery). The H.264 path has not been
exercised in this repo's test container (its Chromium has no H.264 encoder):
export one clip from Chrome or Safari before announcing it.

## Colour sets
One vocabulary (DESIGN-LAW rule 123): the twelve colour sets the library's
cards are made in (Navy & Gold, Navy & Orange, Midnight & Cyan, Blue & Green,
Green & Gold, Purple & Gold, Teal & Orange, Red & Yellow, Black & Gold, Black
& Red, Black & Green, Silver & Blue) are the colour themes Easy Mode and the
designer offer, the landing's Ready-made tab, and the builder's ready-made
sets. Each theme is solved by the colour builder (`scripts/house_themes.mjs
--write` prints them into `app.js`); `scripts/theme_cohesion_audit.mjs`,
`scripts/cvd_audit.py` and `scripts/theme_law.mjs` check them.

## Library API (iPhones LA) — optional

`/api/library/v1` hands the library's ads (the 311 finished cards the site
offers, each rendered at 1080x1080 into `assets/library-ads/` by
`scripts/render_library_ads.mjs`) to a partner's server, behind a key: set
`LIBRARY_KEYS` (`name:key` pairs, keys of 32 characters or more) in the
Netlify environment. Without it the route answers 503 and nothing else
changes. `?card=<id>` opens an ad in the studio. Every ad carries its dates
(`created`, `updated`, `uploaded`, ISO 8601 UTC, read out of git by the
render script and written into each JPEG's EXIF), and the ads route takes
`?since=` and `?sort=newest|oldest` on them; after any change to the
library run `render_library_ads.mjs --stamp` (or `--stale`, which stamps
too) from a full clone, never a shallow one. The other side, for iPhones
LA's listing page, is `docs/iphonesla-library.zip` (the folder
`docs/iphonesla-library/`: a Python client, the server routes, the picker, a
paste-ready prompt). After the library's thumbnails are drawn again, run
`render_library_ads.mjs --stale`. Checks: `scripts/library_api_check.mjs`,
`scripts/library_handoff_check.mjs`. DESIGN-LAW rule 111.

## Ad library and the master library — public link for auto-post

**📚 Library** (Easy Mode's top bar, the editor's top bar, the account menu)
keeps the ads an account saves, on the server (Netlify Blobs,
`netlify/lib/adlibrary.mjs`, the studio side `ad-library.js`). After every
download the studio offers **Save to library**, or saves every download by
itself once **Save every download here** is ticked. What is saved is the
download itself, as a JPEG: its size and its watermark, as the plan gave it.

The library has one public link (`master-library.html?feed=fd_…`), shown in
the dialog with **Copy link**, the JSON feed and RSS. Whoever holds it sees
these ads and nothing else; **Reset link** makes a new one and the old one
stops. When the studio is connected to iPhones LA (opened once from its
Auto-post page), the link is sent there by itself, and again after a reset:
nobody copies it across (`iplaLink.shareLibrary`, the dialog says whether it
arrived). Each ad is set to **Auto-post** or not and to post again once, every
day, every week and so on. The feed lists each ad when it is due, and lists
it again each time it comes due. iPhones LA reads it and posts through its own
Auto-post (`docs/iphonesla-library/autopost_worker.py`, the prompt in that
folder's README). An ad that shows a website, a QR code, a street address or a
social handle, or carries the watermark, is saved but held from auto-post.
Caps: free 12 ads, Pro 300, operators 2000 (`ADLIB_MAX_FREE`, `ADLIB_MAX_PRO`,
`ADLIB_MAX_ADMIN`), 100 saves a day (`ADLIB_DAILY`). It needs the real backend
(`JWT_SECRET` set): in demo mode the dialog says so.

`master-library.html` without a link is the **master library**: the account's
saved ads, and **Finished designs**, every card the studio offers, read from
this deploy (`assets/showcase/`, the full-size renders in
`assets/library-ads/`), so whatever the latest build re-drew is what it shows.

**The ★ on every ad** (owner, 2026-10-06: "every ad has an option to add to
library", "video ads photo ads all need a star button"). Every card carries a
star: the landing's gallery, Easy Mode's strip, the picker, the designer's
Templates panel, the download history, the master library's finished
designs, and every look in the video maker. A star on a design draws it as it
would download, with the brand kit's number and website on it, through the
same gate, at the plan's size and watermark, and counts it as a download
(operators are not counted); the star fills once the ad is in the library.
Under the Easy Mode preview and in the designer's export, **⭐ Save to
library** saves the ad as made and **⭐🎬 Save as video** makes the studio's
10-second video and saves it with its photo instead of downloading it. After
a video download the save card offers the video ad too. In the video maker
(`/motion`), **⭐ Save to library** beside Download MP4 and the star on each
gallery look make that look, with its photo, and send both. A video ad on
the feed carries `video` (MP4 where the browser could write one, WebM
otherwise) beside `image`, served by link and by byte range; the RSS carries
it as a second `media:content`. iPhones LA's worker hands the clip to a
`post()` that takes a `video` argument. Videos go up in raw parts under a
request's 6 MB (`/api/ads/video/begin`, `part`, `done`), 40 MB at most.

**Accounts from every door.** Until 2026-10-06 the landing page's Sign up
free, Log in and the dialog's Create account button did nothing until the
studio had been opened (they were bound with Easy Mode): a visitor could
not create an account from the front door. They work from the landing now;
the dialog opens on **Create account** for a device that has never signed in
and on Sign in after that. `account.js` carries the account (create, sign
in, the same session token) to the pages without `app.js`: the video maker
and the master library each open a dialog of their own when a star is
pressed signed out, and the save follows the sign-in.

Check: `scripts/ad_library_check.mjs` (routes, videos in parts, the real
function, iPhones LA's worker over HTTP, and the studio, the video maker and
the page in Chromium under the production CSP: the stars, an account from
the landing, a video saved from each; `FABRIC_JS=…` when cdnjs is out of
reach).

## SCANS.AD (ScanMap) integration — optional
Graphics Studio runs 100% standalone. The integration is also **invisible to
single-product users**: every SCANS.AD surface (order buttons, tracked-link
helper) stays hidden until the browser proves membership of BOTH platforms —
the user is signed in here AND has either arrived via ScanMap's dashboard link
(`?scansad=member`) or pasted a SCANS.AD tracking link into a QR layer. Until
then the other product is never mentioned anywhere in the UI.

Once unlocked, two cross-product features light up:

1. **Order prints + posting** (export modal + Easy Mode): exports the ad, opens
   ScanMap's campaign wizard prefilled (name, destination URL, QR corner) and
   hands the PNG over tab-to-tab via a postMessage handshake — no shared
   backend, no CORS, both sites stay on their own domains. If the handshake
   fails (popup blocked, old ScanMap build) the PNG downloads instead.
2. **QR code layer** (Pro): the Properties panel links to ScanMap for a tracked
   link (`…/functions/v1/scan?c=…&s=…`) so every street scan reports back.

Wiring — one line on each side:
- here in `config.js`: `window.SCANMAP_URL = "https://scans.ad"` (your ScanMap
  domain; `""` hides every cross-product button)
- in ScanMap's `config.js`: add this site's origin to `PARTNER_ORIGINS`
