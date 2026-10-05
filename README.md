# BUYBACK.AD — deploy guide

## Frontend
Deploy a clean checkout of `main` with the Netlify CLI (AGENT-BRIEF.md,
"Deploying": draft first, look, then `--prod`). A local copy
(`python3 -m http.server 8899`) opened as `http://localhost:8899/?demo=1` runs
in **demo mode**: sign-up, plans, a simulated checkout, the 3-a-week free
limit, the 1080 cap and the watermark all work in the browser, so the whole
flow can be clicked through without a backend. `?demo=0` turns it off.

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
| `RL_USER_DAILY` / `RL_PRO_DAILY` / `RL_GLOBAL_DAILY` | AI backgrounds a day for a Free account, a Pro account and the whole site (defaults 10 / 40 / 400). **The only per-use cost in the product**, about $0.034 an image: read `docs/SAAS-AUDIT-2026-10-05.md` before raising them |
| `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `PRICE_PRO`, `SITE_URL` | billing, below. Until all four are set, Go Pro says "Pro checkout is not open yet" and nothing is charged |
| `GOOGLE_CLIENT_ID` | optional; shows the Google sign-in button |
| `LIBRARY_KEYS`, `LIBRARY_DAILY` | the partner library API, below |

Stripe, once:
1. Product catalog → product "Pro", recurring, $15 a month. Its price id
   (`price_…`) goes in `PRICE_PRO`. (An annual price is a second Stripe
   price and a small code change: OPEN-ITEMS §AF 2.)
2. Developers → Webhooks → endpoint `https://<your site>/api/stripe-webhook`,
   events `checkout.session.completed` and `customer.subscription.deleted`.
   Its signing secret (`whsec_…`) goes in `STRIPE_WEBHOOK_SECRET`.
3. `SITE_URL` is the site's own origin (Stripe sends people back to it).
4. Discounts for partners and creators (the landing's partnership section)
   are Stripe promotion codes: Checkout shows a code field, so a code made in
   Stripe → Coupons needs no code change.

That is the loop: sign-up → Stripe-hosted checkout → webhook flips the plan →
the function counts every download and tells the browser the plan's size cap
and watermark. The count is enforced server-side; the size cap and the
watermark are applied by the browser (OPEN-ITEMS §AF 5).

## Plan rules (change in ONE place each side, and the copy)
`PLANS` in the SaaS section of `app.js` (what the UI shows) and at the top of
`netlify/functions/api.mjs` (the enforced truth). The same numbers are written
out in `index.html` (#pricing, the FAQ, the sign-up chooser), `about.html`,
`terms.html` and `COMMON_FAQ` in `scripts/build_seo_pages.mjs`; run that
script after editing the FAQ, it rebuilds the ld-faq JSON-LD and the category
pages.

Free = 3 downloads a week, 1080 px on the short side, BUYBACK.AD watermark,
every Phones design plus the top 3 of each other category (85 of the 311 cards
offered on 2026-10-05) · Pro = $15 a month, 100 downloads a month, 2160 px, no
watermark, every design, the QR code layer. A download is an image, or a video
with its photo, from the studio, counted once, re-downloads included. The phone
video maker at `/motion` is free, needs no account and counts nothing. AI
backgrounds are on both plans under the daily caps above.

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

## Library API (iPhones LA) — optional

`/api/library/v1` hands the library's ads (the 311 finished cards the site
offers, each rendered at 1080x1080 into `assets/library-ads/` by
`scripts/render_library_ads.mjs`) to a partner's server, behind a key: set
`LIBRARY_KEYS` (`name:key` pairs, keys of 32 characters or more) in the
Netlify environment. Without it the route answers 503 and nothing else
changes. `?card=<id>` opens an ad in the studio. The other side, for iPhones
LA's listing page, is `docs/iphonesla-library.zip` (the folder
`docs/iphonesla-library/`: a Python client, the server routes, the picker, a
paste-ready prompt). After the library's thumbnails are drawn again, run
`render_library_ads.mjs --stale`. Checks: `scripts/library_api_check.mjs`,
`scripts/library_handoff_check.mjs`. DESIGN-LAW rule 111.

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
