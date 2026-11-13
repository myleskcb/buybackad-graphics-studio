# Reselling.US connection

How BUYBACK.AD and Reselling.US talk. Reselling.US is `myleskcb/resale-app`
(FastAPI on Render, reselling.us). BUYBACK.AD is "by Reselling.US" (owner,
2026-11-12: one company, iPhones LA LLC, makes both; never "partner"). Built
2026-11-12 on the shape of the iPhones LA link (`docs/IPHONESLA-CONNECTION.md`);
its other half is `resale/studio.py` and `docs/buybackad-studio.md` there.

When anything below changes on either side, update this file in the same change.

## The connections

| # | Direction | Endpoint | Auth |
|---|---|---|---|
| 1 | Reselling.US opens the studio | `<RESALE_STUDIO_URL>#bba=bbac_…&make=<base64url JSON>` | the person's Reselling.US session |
| 2 | studio → Reselling.US | `POST https://reselling.us/api/studio/exchange` `{code, label}` → `{token, shop, back}` | one-time `bbac_` code |
| 3 | studio → Reselling.US | `GET /api/studio/brief` → `{shop: {name, phone, area}, limits}` | `Bearer bba_…` |
| 4 | studio → Reselling.US | `POST /api/studio/ads/in` (every export, and every video's photo) | `Bearer bba_…` |
| 5 | studio → Reselling.US | `POST /api/studio/status` (the studio's plan and AI credits) | `Bearer bba_…` |

## What `reselling-link.js` does

- Reads `bba` and `make` from the fragment and clears it before anything runs.
  `make` keys: `make` (webuy, background, video), `device` (an id echoed back),
  `family`, `models`, `target`, `category`, `return` (kept only on Reselling.US's
  own origin). The iPHONES LA link's `ipla`/`brief` fragment is left to it.
- Trades the code once (`localStorage.rus_link` keeps the token and the shop's
  name; the code is never kept), reads the brand kit, writes the shop's name and
  phone into `pgfx_brand` and places its city with `resolveArea` (the studio's
  own ZIP and city list), then opens what was asked: Easy Mode with the device
  picked when an option has its exact name, the AI background generator with the
  model in its scene box, or the video maker (`motion/index.html`, which reads
  the brand kit on load).
- Wraps `addHistory` (every download) and `deliverVideo` (a video's photo) and
  sends the picture with `make`, `device` and the tag file
  (`iplaLink.graphicFor`). The picture check is `iplaLink.refusal`, reworded: a
  website, QR code, street address, social handle or watermark keeps the ad
  here, a phone number is welcome. Signed out counts as watermarked.
- Wraps `syncAcctUI` and `syncQuotaUI` to say the plan and credits when they
  change: plan id, plan label, credits left, this month's, bought. Never the
  email, the name or a card.
- A 401 anywhere forgets the token and says so. Three tries with backoff on a
  network or server error.
- The API origin is fixed: `https://reselling.us`, or `http://localhost:8800`
  when the studio itself is served from localhost (how the two are walked on one
  Mac). Nothing a link carries changes it.
- The pill (`.rus`) sits above the iPhones LA pill when a browser is connected
  to both.

## Settings

| Side | Name | Default | Effect |
|---|---|---|---|
| studio | CSP `connect-src https://reselling.us` | | `netlify.toml` and `_headers` |
| Reselling.US | `RESALE_STUDIO_URL` | `https://buybackad-finished-copy.netlify.app/` | where its buttons send people |
| Reselling.US | `RESALE_STUDIO_ORIGINS` | the finished-copy and graphics-studio netlify.app sites | the exact CORS origins; `*` and `--` deploy previews are dropped |

## When you change X, change Y

- A Reselling.US path or host: `reselling-link.js` (`API` and the four paths),
  the CSP in `netlify.toml` and `_headers`, and `resale/studio.py` there.
- A new studio site (buyback.ad): `RESALE_STUDIO_ORIGINS` on Reselling.US's
  Render service, and `RESALE_STUDIO_URL` if people should be sent there.
- The `graphic` shape: `resale/studio.py clean_graphic` there.
- `iplaLink.refusal`'s wording: `refusal` here rewrites its prefix.

## Not built

- A video file itself does not go back, only its photo (Reselling.US keeps
  pictures in its database).
- The video maker (`motion/`) does not load this file, so a video made there is
  not sent; a video from Easy Mode or the editor (`deliverVideo`) is.
- Nothing bills or grants credits across the two. What a Reselling.US plan
  includes is the owner's call; `docs/buybackad-studio.md` in resale-app has the
  one-Stripe proposal.

## Test

`node --test tests-reselling-link.mjs` (18 on 2026-11-12) beside
`node --test tests-iphonesla-link.mjs`, and on Reselling.US
`resale/tests/test_studio_link.py`.
