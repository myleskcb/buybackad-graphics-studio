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
The editor supports four canvas formats (topbar picker): **Square 1:1**
(1080×1080), **Story 9:16** (1080×1920), **Flyer 8.5×11** (1080×1398, prints at
~250 dpi on a Pro 2× export) and **Wide 16:9** (1920×1080). Templates are
authored square and re-flow into the chosen format; switching back is lossless.
Plan pixel caps apply to the short side, so rectangular exports keep their
aspect. Easy Mode stays square by design.

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
