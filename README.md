# BUYBACK.AD — deploy guide

## Frontend (2 minutes)
Drag this whole folder onto https://app.netlify.com/drop. Done.
With `config.js` left empty the app runs in **demo mode**: sign-up/sign-in,
plans, simulated checkout, the 3/week free limit, 1080p cap and watermark all
work in-browser so you can test the entire flow today.

## Backend — real accounts, real limits, real Stripe (~15 minutes)
1. **Cloudflare** → Workers & Pages → Create Worker → paste `backend/worker.js`.
2. Worker → Settings → **Bindings** → add KV namespace, variable name `USERS`.
3. Worker → Settings → **Variables & secrets**:
   - Secret `JWT_SECRET` — any long random string
   - Secret `STRIPE_SECRET` — from Stripe → Developers → API keys (sk_live_… / sk_test_…)
   - Secret `STRIPE_WEBHOOK_SECRET` — created in step 5 (whsec_…)
   - Var `PRICE_PRO` — from step 4
   - Var `SITE_URL` — your Netlify URL, e.g. https://buybackad.netlify.app
4. **Stripe** → Product catalog → create the product “Pro $15/mo”
   (recurring). Copy its **price id** (price_…) into step 3.
5. Stripe → Developers → **Webhooks** → Add endpoint:
   `https://YOUR-WORKER.workers.dev/stripe-webhook`, events
   `checkout.session.completed` and `customer.subscription.deleted`.
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Edit `config.js`: set `window.PGFX_API` to your worker URL. Redeploy the folder.

That’s the full loop: sign-up → Stripe-hosted checkout → webhook flips the plan
→ limits/watermark enforced **server-side** (browser tricks can’t bypass them).

## Plan rules (change in ONE place each side)
`PLANS` at the top of `app.js` (labels/pricing shown in UI) and of
`backend/worker.js` (the enforced truth):
Free = 3/week, 1080px, watermark, 20 templates · Pro = 100/month, 2160px, all 50+ templates.

## Notes
- Test first with Stripe **test keys** + card 4242 4242 4242 4242.
- No email verification / password reset in this MVP — add before wide launch.
- AI background generation is separate (⚙ in the Backgrounds tab) and unrelated
  to these keys.

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
