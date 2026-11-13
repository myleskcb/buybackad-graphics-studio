# iPhones.LA connection

How BUYBACK.AD and iPhones.LA talk, what each side owns, and what is owed.
iPhones.LA is `myleskcb/iphoneslainv-1` (FastAPI on Render; it was
`loganipad/iphoneslainv` until 2026-10-19). "iPLA" below. Read on 2026-11-10
against iPLA `main` at `30866d5` and this repo's `claude/quirky-ride-gi02j6`.
Line numbers are as of those commits; grep the names when they drift.

When anything below changes on either side, update this file in the same change.

The Reselling.US link (`reselling-link.js`, 2026-11-12) is the same shape on
another shop and reuses this link's picture check and tag file
(`iplaLink.refusal`, `iplaLink.graphicFor`): change either and run both test
files. `docs/RESELLING-CONNECTION.md` has it.

## The connections

| # | Direction | Endpoint | Auth | Owner |
|---|---|---|---|---|
| 1 | iPLA opens the studio; the studio calls iPLA | `<GFX_STUDIO_URL>#ipla=gfxc_…&brief=…`, then `POST https://iphones.la/api/buy-ads/studio/exchange` | one-time `gfxc_` code | iPLA |
| 2 | studio → iPLA | `GET /api/buy-ads/studio/brief` | `Bearer gfx_…` | iPLA |
| 3 | studio → iPLA | `POST /api/buy-ads/studio/images` (every export) | `Bearer gfx_…` | iPLA |
| 4 | studio → iPLA | `POST /api/buy-ads/studio/library` (the ad library's public link) | `Bearer gfx_…` | iPLA |
| 5 | iPLA → studio | `GET <site>/api/ads/feed/fd_…` and each `image.url` | the link is the key | BUYBACK.AD |
| 6 | studio → iPLA page | "Back to the Ad Generator" link | the person's own session | both |
| 7 | not used by iPLA | `GET /api/library/v1/…` (the Designer Library) | `bbl_` key, `LIBRARY_KEYS` | BUYBACK.AD |

Copies, not calls: `motion/listing.js` ports iPLA's `app/buy_ad_copy.py` (the
title and description maker and its checks); iPLA's `app/buy_ad_graphic.py`
names devices from this repo's cutout file names (`assets/cutouts/`);
`social/presets.js` and `spec/*.json` carry the shop's number and pages.

## Each connection

**1. Connect.** On iPLA's `/ads` page, Open the studio (`studio-panel.js`) calls
`POST /api/buy-ads/studio/connect` (`app/routers/buy_ad_studio.py:198`). iPLA
mints a 10-minute `gfxc_` code, keeps its SHA-256 (`app/studio_auth.py`), and
sends the person to the studio with `#ipla=<code>&brief=<base64url JSON>` (brief
keys `family, target, models, angle, tone, headline, area, return`). The studio
reads and clears the fragment (`iphonesla-link.js`, `readFragment`) and POSTs
`{code, label}` once. iPLA spends the code in one UPDATE (10 tries an hour per
address) and answers `{token, shop, library_url}`. Only the token is kept, in
`localStorage.ipla_link`. Connecting again with the same label revokes the old
token. Every request leaves cookies behind (`credentials: 'omit'`).

**2. Brief.** One GET per page load. iPLA answers `{ok, shop, families, angles,
tones, needs, limits, library}`; the studio reads `limits.max_upload_bytes` and
forgets the link on a 401.

**3. Image import.** Every export ends in `addHistory`, which the link wraps.
Multipart: `file`, `family, target, angle, tone, headline, models` (JSON),
`source_ref`, `graphic`. The `graphic` tag file is `{v:1, category, template,
texts:[{role,text}], products:[slug]}` (`graphicFor`), read only by iPLA's
`buy_ad_graphic.clean`, which decides what the picture shows and refuses a
picture of something the shop does not buy. iPLA's limits: 8 MB, a 4,096 px
edge, 8 megapixels, 60 an hour and 300 a day per token, a 60 MB library unless
its media host holds the files. Answers 200 `{photo, duplicate}`, 401, 413, 429,
503, 507. Pictures land unselected on `/ads`.

**4. Library link.** The ad library (`ad-library.js`) sends `{feed_url, site}`
through `iplaLink.shareLibrary`. iPLA keeps it only for a site in its
`STUDIO_SITES` (`app/buyback_ad_feed.py:126-130`: graphics-studio,
finished-copy and `studio.scans.ad` on netlify.app hosts) with the exact shape
`site/master-library.html?feed=fd_` plus 24 characters. Newest wins (AppSetting
`buybackad_feed_link`). The studio reads a 404 or 405 as "not there yet".

**5. The feed.** iPLA turns the link into `<origin>/api/ads/feed/fd_…` and reads
it every 10 minutes, at most 4 MB (`FEED_MAX_BYTES`) and 20 seconds, 5 due ads a
read (`app/notifications/runner.py`). This repo serves it in
`netlify/lib/adlibrary.mjs` (`adLibraryRoute`, `itemOut`). iPLA reads `id,
title, caption, texts, products, category, image.url, post.slot_id, hold`,
fetches pictures only from the feed's own host, makes a draft, and posts each
new `slot_id` once an admin has approved the ad (table `buybackad_feed_slots`).

**6. Back link.** The studio's link back is `brief.return` when it is on
`https://iphones.la` or `https://admin.iphones.la` (where iPLA's staff pages live
once its admin host is on), else `https://iphones.la/ads#studio`, iPLA's Ad
Generator, which scrolls to the studio card (`iphonesla-link.js`: `BACK`,
`safeReturn`).

**7. Designer Library.** `/api/library/v1` and `docs/iphonesla-library/`'s
client, picker and worker were handed over on 2026-10-04. Nothing on iPLA calls
them; it built connection 5 instead.

## Switches and settings

| Side | Name | Default | Effect |
|---|---|---|---|
| iPLA | `GFX_STUDIO_URL` | `https://buybackad-graphics-studio.netlify.app/` | where Open the studio sends people; the default CORS origin |
| iPLA | `GFX_STUDIO_ORIGINS` | that URL's origin | the exact CORS origins (a comma list; `*` and `--` deploy previews are dropped) |
| iPLA | `BUYBACKAD_FEED_URL` | unset | the library link until the studio sends one |
| iPLA | `BUYBACKAD_FEED_MINUTES` / `BUYBACKAD_FEED_LIMIT` | 10 / 5 | read cadence (0 turns it off); ads per read (1 to 25) |
| iPLA | `NOTIFY_SWEEP`, `MEDIA_HOST_*` | | the runner loop that reads the feed; where pictures are kept |
| studio | `JWT_SECRET` | | no accounts means no library and no feed |
| studio | `ADLIB_MAX_*`, `ADLIB_DAILY` | admin 3,000; 100 a day | library size and saves |
| studio | `LIBRARY_KEYS`, `LIBRARY_DAILY` | unset | connection 7 only |
| studio | CSP `connect-src https://iphones.la` | | `netlify.toml` and `_headers` |

`GFX_STUDIO_*` are in neither iPLA's `render.yaml` nor `.env.example`, so
Render's values could not be checked from the code.

## When you change X, change Y

- An iPLA path or host: `iphonesla-link.js` (`API`, the four paths), the CSP in
  `netlify.toml` and `_headers`, and iPLA's `studio_auth.py` (which cuts the CORS
  door).
- The token or code format: `iphonesla-link.js` (`TOKEN_RE`, `CODE_RE`) and
  `studio_auth.py` (iPLA refuses over 120 characters).
- A new studio site, such as buyback.ad: iPLA's `GFX_STUDIO_ORIGINS` on Render
  and `STUDIO_SITES` in `buyback_ad_feed.py`. A path mount (`reselling.us/gfx`)
  also breaks the library page shape on both sides.
- A feed field iPLA reads, or the library page's path: `buyback_ad_feed.py`
  (`read_ad`, `LIBRARY_LINK`).
- The `graphic` shape or a cutout file name: iPLA's `buy_ad_graphic.py`.
- iPLA's `buy_ad_copy.py`: port the change into `motion/listing.js`.
- The shop's number or pages: `social/presets.js`, `spec/brand.json`,
  `spec/content.json`.

## Mismatches and gaps

Fixed on this side, 2026-11-10:
- The studio's link back went to `/repost#configurator`, which since 2026-09-22
  shows only the posting slots; the WE BUY pictures are on `/ads`. It now goes
  to `/ads#studio`, every message names the Ad Generator, and a return address
  on `admin.iphones.la` is kept.
- The old repo name is gone from the current docs (the learning log and
  DESIGN-LAW keep it as history).

Owed by the owner:
1. **The finished-copy site cannot connect** unless Render says so. iPLA accepts
   finished-copy's library link, but its CORS door answers only
   `GFX_STUDIO_URL`'s origin unless `GFX_STUDIO_ORIGINS` lists more. Set on
   Render (iPLA's service): `GFX_STUDIO_ORIGINS=https://buybackad-graphics-studio.netlify.app,https://buybackad-finished-copy.netlify.app`
   (add `https://studio.scans.ad` and `https://buyback.ad` once they resolve).
2. **The phone number on WE BUY pictures.** The studio puts the number large on
   them; iPLA keeps its own number-bearing cards out of its WE BUY library
   because OfferUp takes them down (`ad_designer.py`,
   `docs/auto-post-configurator.md`). Decide which rule wins for pictures sent to
   iPLA.

Owed on iPLA (paste the prompt below into a session on that repo):
3. `listing` (title, description, price), added to the feed on 2026-11-09, is
   ignored: `read_ad` never reads it, and the `/ads` panel writes its own words
   and price. Also ignored: `video`, `template`, `kind`, `fresh_until`,
   `autopost`, though this repo's library README says the video reaches posting.
4. The feed can pass iPLA's 4 MB cap: an item with a full listing is about
   4.3 KB, so roughly 950 such ads fail the whole read. Ask with `?due=1`, which
   this repo already serves.
5. Cutouts iPLA cannot name: no slug rule for `qs-macbook-*` (32 files),
   `qs-watch-*` (28), `qs-imac-*` (14), `photo-iphone-*`, `photo-ipad-*`,
   `photo-macbook-*`, `qs-airpods-*`.
6. iPLA's own links still say `/repost#configurator`
   (`app/routers/buy_ad_studio.py:211,244`, `app/routers/buy_ads.py:872`).
7. Field placement: `repost_days` is top-level in the feed but read inside
   `post`; iPLA looks for `created_at` where the feed says `created`. Neither
   drives behaviour today.
8. iPLA's feed tests use a made-up shape (`{"ads":[{"picture":…}]}`), not the
   real `items[].image.url`, so nothing fails if the two drift. A real feed
   answer run through iPLA's `parse_feed` reads correctly today (checked by
   hand on 2026-11-10).
9. Likely duplicates (not verified): a design both exported (3) and saved to
   the library (5) arrives twice with different bytes, so iPLA's SHA-256 check
   would not catch it.

Unchanged and fine: all four studio paths exist on iPLA with the same method
and shape.

### Prompt for a session on myleskcb/iphoneslainv-1

> BUYBACK.AD's `docs/IPHONESLA-CONNECTION.md` (myleskcb/buybackad-graphics-studio)
> lists what iPhones.LA owes the studio connection. Do items 3 to 8: in
> `app/buyback_ad_feed.py`, read the feed with `?due=1`, read `repost_days` and
> `created` where the feed puts them, and decide with the owner whether the
> studio's `listing` (title, description, price) prefills the `/ads` draft
> (keeping iPLA's own checks); teach `app/buy_ad_graphic.py` the cutout slugs
> listed in item 5; point the three `/repost#configurator` links at
> `/ads#studio`; and replace the made-up feed shape in
> `tests/test_buyback_ad_feed.py` with a fixture of the real feed
> (`items[].image.url`, `post.slot_id`, `listing`). Follow iPLA's CLAUDE.md
> (batch the push; run both suites the CI way first).

## How to test the link end to end

1. Here: `node --test tests-iphonesla-link.mjs` (68 pass on 2026-11-10) and
   `node scripts/ad_library_check.mjs --no-browser`. On iPLA:
   `tests/test_buy_ad_studio.py`, `test_buyback_ad_feed.py`,
   `test_buy_ad_graphic.py`, `test_buyback_ad_panel.py`.
2. CORS, once per studio site:
   `curl -si -X OPTIONS https://iphones.la/api/buy-ads/studio/brief -H 'Origin: https://buybackad-graphics-studio.netlify.app' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization'`
   expects 204 with `Access-Control-Allow-Origin`. Repeat with finished-copy.
3. On iPLA's `/ads`, Open the studio on the production URL (a
   `…--site.netlify.app` preview is refused by design). The link pill turns
   green; `iplaLink.state().connected` is true.
4. Export a design: the studio says "Sent to iPhones LA", and the picture shows,
   unselected, on `/ads`.
5. Signed in as an admin, open 📚 Library: "iPhones LA has this link".
   iPLA's `GET /api/buy-ads/feed` shows `link_from: "studio"`.
6. Save an ad, then press Read it now on `/ads`: approve the draft; the next
   slot posts.
7. `curl -s 'https://buybackad-graphics-studio.netlify.app/api/ads/feed/fd_…?due=1'`
   shows the feed iPLA reads.
