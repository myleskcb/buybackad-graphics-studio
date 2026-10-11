# The BUYBACK.AD library on iPhones LA's listing page

The owner, 2026-10-04: "build the intermediary so the ad title and description
page and list it can access the library material from buyback ad via a key ...
give me the rest to put into the iPhones LA repo", and then: "it's going to be
ads that we approved and send to the library in the buyback ad app".

The library is BUYBACK.AD's Designer Library: the finished ads the site offers
(311 on 2026-10-04: phones 64, pokemon 41, coins 40, cars 36, gold 33, silver
33, sports 33, strips 31), with the shop's number, (562) 999-4994, and
iphones.LA on them. Each is published at full size, 1080x1080 JPEG, drawn by
the studio's own engine; the listing page puts one on a listing as a photo.

BUYBACK.AD's part is built and on `main` (`netlify/lib/library.mjs`, served as
`/api/library/v1`; the renders in `assets/library-ads/`; DESIGN-LAW rule 111).
This folder is the rest, for `loganipad/iphoneslainv`.

## How the two apps talk

```
iPhones LA listing page ──▶ iPhones LA server ──(key)──▶ BUYBACK.AD /api/library/v1
  (title, description,       /api/buybackad-library/*        which ads there are
   photos, List it)           holds the key                          │
         ▲                                                          ▼
         └──────────── the ad, a 1080 JPEG File ◀──── assets/library-ads/<id>.jpg
```

Two apps, talking through one API: iPhones LA's server asks BUYBACK.AD which
ads are in the library (the key proves it is iPhones LA); the ads themselves
are image files at fixed addresses on the BUYBACK.AD site. When the library
changes (an ad approved in, held back, re-drawn), BUYBACK.AD re-renders and
deploys, and the next answer is the new library: nothing to sync on this side.
The browser never sees the key.

## Files

| file | goes to | what it is |
|---|---|---|
| `buybackad_library.py` | the server's Python package | the client: the key, the routes, a cache, `ad_jpeg()` (the library's JPEG, byte for byte; smaller with Pillow). Standard library. |
| `library-picker.js` | the static files | the panel for the listing page: the library's ads, a search, a category. A pick hands the page the ad as a JPEG `File`. |
| `example_server.py` | reference only | the routes and a demo listing page, standard library, runnable |
| `test_buybackad_library.py` | the tests | ten checks against a live library (skipped without the env vars) |
| `autopost_worker.py` | the server's jobs | takes the ad library's ads into the site's review, then posts the approved ones through the shop's own Auto-post (below); posts nothing unapproved |
| `test_autopost.py` | the tests | seven checks of the feed client and the worker against a stand-in library (no network) |

## Setting it up (the owner, once)

1. **Make a key** (anywhere):
   `python3 -c "import secrets; print('bbl_' + secrets.token_urlsafe(32))"`
2. **BUYBACK.AD's Netlify project** (the one iPhones LA will call,
   `buybackad-graphics-studio` unless you say otherwise): Site configuration →
   Environment variables → add `LIBRARY_KEYS` = `iphonesla:<the key>`
   (scope: Functions), then deploy `main`. Optional: `LIBRARY_DAILY`
   (requests a day per key, 20000 by default).
3. **iPhones LA's server**: `BUYBACKAD_LIBRARY_URL` =
   `https://buybackad-graphics-studio.netlify.app` and
   `BUYBACKAD_LIBRARY_KEY` = the same key. Never in the front end, never in
   git.

To rotate: add a second pair (`iphonesla:<old>,iphonesla-2:<new>`), move
iPhones LA to the new key, then remove the old pair. Both work in between.

Check it from a terminal:

```
curl -s -H "Authorization: Bearer $BUYBACKAD_LIBRARY_KEY" \
  https://buybackad-graphics-studio.netlify.app/api/library/v1 | python3 -m json.tool
```

## The contract: `GET /api/library/v1/...`

Header: `Authorization: Bearer <key>` (or `X-Library-Key: <key>`). JSON
answers; `X-Library-Version` names the library build (it changes when the
library does).

| route | answers |
|---|---|
| `/api/library/v1` | `{ name, version, partner, counts: { ads, categories }, routes }` |
| `/api/library/v1/categories` | `{ version, categories: { phones: 64, gold: 33, ... } }` |
| `/api/library/v1/ads?category=&q=&since=&sort=&limit=&offset=` | a page of ads |
| `/api/library/v1/ads/{id}` | `{ version, item }` |

- `category`: one or a comma list (`phones`, `gold`, `silver`, `coins`,
  `cars`, `pokemon`, `sports`, `strips`).
- `q`: words; every word must start a word of the ad (its category, subject,
  title or layout), and what the ad is for comes first: "gold" gives the
  gold-buying ads before the ads in a black-and-gold palette.
- `since`: a day (`2026-10-01`, from its first second UTC) or a timestamp
  (`2026-10-01T12:00:00Z`): only the ads created, updated or uploaded at or
  after it, so a server can ask what changed. Anything else is 400.
- `sort`: `newest` or `oldest`, by upload date (then update, then creation);
  without it, the library's own order. Anything else is 400.
- `limit`: 1 to 200 (50); `offset`: 0 up. A page is
  `{ version, total, offset, limit, next_offset, items }`; `next_offset` is
  null on the last page.

An ad (the real record, 2026-10-04):

```json
{ "id": "bubblePop-nn05-30", "title": "Red & Yellow · Bubble Pop",
  "category": "sports", "theme": "Red & Yellow", "layout": "bubblePop", "subject": "cards",
  "image": { "url": "https://buybackad-graphics-studio.netlify.app/assets/library-ads/bubblePop-nn05-30.jpg?v=e51bd5b61d1c",
             "width": 1080, "height": 1080, "bytes": 211078, "format": "jpg" },
  "thumb": { "url": "https://buybackad-graphics-studio.netlify.app/assets/showcase/bubblePop-nn05-30.webp", "width": 448, "height": 448 },
  "studio_url": "https://buybackad-graphics-studio.netlify.app/?card=bubblePop-nn05-30",
  "created": "2026-09-05T06:37:29Z", "updated": "2026-10-02T08:07:47Z", "uploaded": "2026-10-04T07:56:34Z" }
```

`image` is the ad itself, the picture for a listing (`?v=` changes when it is
re-drawn). `thumb` is the library's preview, for a grid. `studio_url` opens the
ad in the BUYBACK.AD studio, to change it before downloading (a download from
there comes back through the existing studio link, the WE BUY picture library).

**The dates** (ISO 8601, UTC) identify the media: `created` is when the ad
entered the library; `updated` is when its design last changed; `uploaded` is
when the picture you get was drawn (it is the one that changes when `?v=`
does). `created <= updated <= uploaded`, always. The JPEG itself carries the
same three as EXIF (`DateTimeOriginal` = created, `DateTime` = updated,
`DateTimeDigitized` = uploaded, each `+00:00`, with `ImageDescription` the
title and `Software` "BUYBACK.AD Graphics Studio"), so an ad still says what it
is and when it was made after it has been uploaded to a listing or a photo
library. The client's `filename(ad)` names a file for the ad and its upload
day (`bubblePop-nn05-30_2026-10-04.jpg`); `dates(ad)` gives the three as
datetimes; `changed_since("2026-10-01")` lists what to refresh. The index
(`/api/library/v1`) carries `latest: { created, updated, uploaded }`, the
newest of each across the library, and one ad's answer carries
`Last-Modified` (its upload).

Errors: `{ "error": "..." }` with 400 (a bad id), 401 (no key or a wrong
one; `WWW-Authenticate: Bearer`), 404 (an ad no longer in the library, or an
unknown route), 405 (anything but GET), 429 (the day's requests for this key;
`Retry-After`), 502 (the library could not be read), 503 (no keys set on
BUYBACK.AD).

## The iPhones LA routes

Behind the same login as the listing page. Each is a few lines over
`buybackad_library.py`; `example_server.py` has them runnable.

| route | does |
|---|---|
| `GET /api/buybackad-library/index` | counts and version (the partner name removed) |
| `GET /api/buybackad-library/categories` | as above |
| `GET /api/buybackad-library/ads?...` | as above; parameters other than category, q, since, sort, limit, offset are dropped |
| `GET /api/buybackad-library/jpeg/{id}` | that ad as a listing JPEG, 1080x1080 (`?max=640` for smaller) |

Flask:

```python
from flask import Blueprint, Response, jsonify, request
from buybackad_library import BuybackadLibrary, LibraryError

lib = BuybackadLibrary.from_env()
bp = Blueprint("buybackad_library", __name__, url_prefix="/api/buybackad-library")

def _fail(e: LibraryError):
    # the library's own refusals pass through; a key or network problem is the shop's to fix
    status = e.status if e.status in (400, 404, 429) else 502
    return jsonify(error=str(e) if status != 502 else "the BUYBACK.AD library did not answer"), status

@bp.get("/<route>")
def proxy(route):
    if route not in ("index", "categories", "ads"):
        return jsonify(error="not found"), 404
    try:
        return jsonify(lib.proxy(route, request.args.to_dict()))
    except LibraryError as e:
        return _fail(e)

@bp.get("/jpeg/<ad_id>")
def jpeg(ad_id):
    side = request.args.get("max", type=int)
    try:
        data = lib.ad_jpeg(lib.ad(ad_id), max_side=max(320, min(1080, side)) if side else None)
    except LibraryError as e:
        return _fail(e)
    return Response(data, mimetype="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})

# app.register_blueprint(bp)   (behind the listing page's login)
```

FastAPI:

```python
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request, Response
from buybackad_library import BuybackadLibrary, LibraryError

lib = BuybackadLibrary.from_env()
router = APIRouter(prefix="/api/buybackad-library")

def _fail(e: LibraryError):
    status = e.status if e.status in (400, 404, 429) else 502
    raise HTTPException(status, str(e) if status != 502 else "the BUYBACK.AD library did not answer")

@router.get("/jpeg/{ad_id}")
def jpeg(ad_id: str, side: Optional[int] = Query(None, alias="max")):
    try:
        data = lib.ad_jpeg(lib.ad(ad_id), max_side=max(320, min(1080, side)) if side else None)
    except LibraryError as e:
        _fail(e)
    return Response(data, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})

@router.get("/{route}")
def proxy(route: str, request: Request):
    if route not in ("index", "categories", "ads"):
        raise HTTPException(404, "not found")
    try:
        return lib.proxy(route, dict(request.query_params))
    except LibraryError as e:
        _fail(e)

# app.include_router(router, dependencies=[...the listing page's login...])
```

The client is synchronous (urllib) and caches answers five minutes; in an async
app run it in a thread (FastAPI does that for `def` routes) or from a worker.

## The listing page

Beside the title and description:

```html
<div id="buybackad-library"></div>
<script src="/static/library-picker.js"></script>
<script>
  BuybackadPicker.mount(document.getElementById('buybackad-library'), {
    endpoint: '/api/buybackad-library',
    onPick: ({ ad, file }) => addListingPhoto(file),   // the page's own path for an uploaded photo
  });
</script>
```

`file` is the ad as a JPEG `File` (`bubblePop-nn05-30_2026-10-04.jpg`:
the ad and its upload day; `lastModified` its upload; 1080x1080, the
library's own file byte for byte, its EXIF dates inside), as if it had been
uploaded, so the listing's photo list, its order, its upload and "List it"
stay exactly as they are. `ad` is the record above. The same comes as a
`buybackad:pick` event on the element. Each tile says when the ad was
uploaded, and the Order control puts the newest upload first.

## Checked (2026-10-06, from the BUYBACK.AD repo)

`scripts/library_api_check.mjs`: the renders (one for every ad the site
offers, each a 1080x1080 JPEG of the card as the library shows it now, none
left over, each with its three dates in order and the same dates in its
EXIF), the keys, rotation, the day's cap, every route, filters, `since`,
`sort`, `Last-Modified`, the index's `latest`, paging, every link a real
file, a held ad not offered, and the real function end to end.
`scripts/library_handoff_check.mjs`: this folder's thirteen Python tests
against a stand-in BUYBACK.AD (the dates on every ad, `since` and `sort`,
the EXIF dates inside the JPEG among them); the Flask and FastAPI code
above, taken out of this file and run; `example_server.py`'s listing page in
Chromium (the picker loads the ads with their upload dates, "gold" narrows
them, newest first orders them, a pick adds the ad to the photos named for
its upload day, byte for byte the library's file); and
`docs/iphonesla-library.zip` holding exactly these files. Not checked from there: `loganipad/iphoneslainv`
itself, which that session could not reach, and the live site, which has the
API only once `main` is deployed with `LIBRARY_KEYS` set.

## Paste-ready prompt for the iPhones LA session

```
In loganipad/iphoneslainv: add the BUYBACK.AD ad library to the listing page
(the page where a listing gets its title and description and is listed).
The library is BUYBACK.AD's finished ads (with our number on them) as
1080x1080 JPEGs; a picked ad goes on the listing as a photo.

Unzip iphonesla-library.zip (from the BUYBACK.AD repo,
myleskcb/buybackad-graphics-studio, docs/iphonesla-library.zip). Read its
README.md first: it is the API contract and has Flask and FastAPI versions of
the routes; example_server.py has them runnable. Then:
  - buybackad_library.py      into the server package (standard library;
                              Pillow only for smaller sizes)
  - library-picker.js         into the static files the listing page can load
  - test_buybackad_library.py into the tests

1. Server: add the routes under /api/buybackad-library (index, categories,
   ads, and jpeg/<id>) over BuybackadLibrary.from_env(), in this app's
   framework, behind the same login as the listing page. The key comes from
   BUYBACKAD_LIBRARY_KEY and the site from BUYBACKAD_LIBRARY_URL: set both
   where this app keeps its secrets, never in the front end or in git.
2. Listing page: mount the picker beside the title and description with
   BuybackadPicker.mount(el, { endpoint: '/api/buybackad-library',
   onPick: ({ file }) => <the page's existing add-a-photo path>(file) }).
   A pick must land exactly as an uploaded photo would: same list, same order,
   same upload, same List it. Do not add a second photo pipeline.
3. Run test_buybackad_library.py with the two variables set; then pick an ad
   on the listing page and list a test item end to end.
Report: the routes and the page changed, the test output, and a screenshot of
the listing page with the library open.
```

## Auto-post and repost: the ad library's public link

The owner, 2026-10-05: "when we save the ads on the site we can make a public
library for iphones LA to access and auto post the we buy ads and auto repost
them too".

The key-protected API above is the **Designer Library** (the studio's finished
designs). This section covers the other library: the **ads the owner saves**
in the studio (📚 Library, or "Save to library" after a download). It has one
public link that iPhones LA reads.

**The studio makes imagery; the site does the rest** (the owner, 2026-10-11:
"we're supposed to do the approval or denial of the title description on the
listings iPhone LA site", "we should just build imagery that we can pass off
the rest can be handled on the site. We can organize it from there and
refresh the content on a daily basis", "we could use the same imagery for
seven days per unique ad that is our maximum to keep it fresh and unique
feeling", "reposted daily of course"). So:

- Every ad saved in the studio is on the link at once: its picture, its
  video if it has one, the words on it, its category and its products. There
  is nothing to download and no Auto-post switch or schedule in the studio.
- Each ad is **offered every day for 7 days** from when it was saved (one slot
  a day, `fresh_until` says when the seven days end), then it retires: it
  stays listed with `fresh: false` and no slot. New imagery comes from the
  studio.
- **iPhones LA's side**: read the link daily (or more often); bring each
  new ad into the listings site's review, where its own title and description
  maker writes them and a person approves, denies or edits; post the approved
  ones within the shop's daily limits (the safe share of buying ads in a
  day, a little higher in aggressive mode), at most once a day each and only
  while the ad is fresh. The studio never posts.

```
BUYBACK.AD studio ──save──▶ the ad library ──public link──▶ iPhones LA worker ──▶ Auto-post
 (download, Save)          (Netlify Blobs)   JSON / RSS       autopost_worker.py    (the shop's own
                                                              every 10-15 min        posting: post, repost)
```

### Getting the link (the owner, once)

In the studio, sign in, open **📚 Library** and press **Copy link**. It looks
like `https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_...`.
Opening it shows the library as a page. On iPhones LA's server, set it as
`BUYBACKAD_FEED_URL`. It needs no key: the link itself is the access, and it
shows these ads and nothing else. **Reset link** in the same dialog makes a
new link; the old one answers 404 from then on.

### The link arrives by itself

Nobody has to copy the link across. When the studio is connected to the shop
(opened once from iPhones LA's Auto-post page: the connect code, the same
connection the WE BUY pictures use), it sends the library's link over that
connection. It sends once when the studio starts, again after **Reset link**,
and again on a new connection:

```
POST https://iphones.la/api/buy-ads/studio/library
Authorization: Bearer <the studio token, as for /studio/images>
Content-Type: application/json

{ "feed_url": "https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_…",
  "site": "https://buybackad-graphics-studio.netlify.app" }
```

iPhones LA's side of it:
- Accept it with the same token check and CORS as `/studio/images`.
- Accept only a `site` that is a BUYBACK.AD site: `https://buybackad-graphics-studio.netlify.app`,
  `https://buybackad-finished-copy.netlify.app`, `https://studio.scans.ad`.
  The `feed_url` must be exactly `site + /master-library.html?feed=fd_` plus
  24 characters of `[A-Za-z0-9_-]`. Anything else is a 400.
- Store it in the shop database as the feed the worker reads; the newest one
  wins. Answer `200 {"ok": true}`, and 401 for a token that is no longer valid.
- `BUYBACKAD_FEED_URL` stays as a fallback for when nothing has been sent.

The studio reads a 404 or 405 as "not there yet" and asks again a day later.
The Library dialog says which state it is in. Each Netlify project keeps its own
library, so the link names the site the ads were saved on.

### What the link answers

| address | answers |
|---|---|
| `/api/ads/feed/fd_...` (or `.json`) | `{ name, version, updated, count, fresh_days, links, items }`: every ad saved; `?category=phones` filters, `?due=1` gives only what is offered today (fresh, not held) |
| `/api/ads/feed/fd_....rss` | RSS 2.0: one item per ad offered today, its picture as the enclosure, its slot as the guid (a new guid each day of its seven) |
| `/api/ads/feed/fd_.../img/<id>.jpg` | the ad's picture, the JPEG as it was saved (the download, at its size; up to 2160 a side) |
| `/api/ads/feed/fd_.../video/<id>.mp4` (or `.webm`) | a video ad's clip, byte for byte (`Accept-Ranges: bytes`); `?kind=video` on the feed lists only video ads |

An ad (an example record):

```json
{ "id": "ad_mfx1k2abcd", "title": "WE BUY iPHONES", "category": "phones",
  "caption": "WE BUY iPHONES", "template": "checklistHero",
  "texts": [{ "role": "headline", "text": "WE BUY iPHONES" }, { "role": "badge", "text": "Cash today" }],
  "products": ["iphone-15-pro"],
  "image": { "url": "https://.../api/ads/feed/fd_.../img/ad_mfx1k2abcd.jpg?v=3f2a9c1d0e4b", "width": 1440, "height": 1440, "bytes": 412233, "format": "jpg" },
  "kind": "video", "source": "studio",
  "video": { "url": "https://.../api/ads/feed/fd_.../video/ad_mfx1k2abcd.mp4?v=9b1c2d3e4f50", "width": 1080, "height": 1080, "bytes": 5213344, "format": "mp4", "seconds": 10 },
  "created": "2026-10-05T12:00:00Z", "updated": "2026-10-05T12:00:00Z",
  "fresh_until": "2026-10-12T12:00:00Z", "fresh": true,
  "autopost": true, "repost_days": 1, "hold": null,
  "post": { "slot_id": "ad_mfx1k2abcd@2026-10-05T12:00:00Z", "due_at": "2026-10-05T12:00:00Z", "next_at": "2026-10-06T12:00:00Z", "round": 1 } }
```

- `post` is today's slot: due at `due_at` (when the ad was saved, then every
  24 hours), `round` 1 to 7, `next_at` tomorrow's or `null` on the last day.
  `repost_days` is 1 while an ad is offered and `autopost` true, the fields
  a reader of the older feed expects. Past its seven days (`fresh: false`),
  or held, an ad has `post: null`.
- **`slot_id` is the whole contract**: keep the slot ids you have taken, and
  take any ad whose current `slot_id` you have not. That gives each ad once a
  day for its seven days, and never doubles up if a run is repeated. Whether
  a day's slot is posted is the site's call: its daily limits choose among
  what is offered.
- `hold` names why an ad is never offered: it shows a website, a QR code,
  a street address or a social handle, or it carries the free plan's
  watermark (the same rule as the studio link's WE BUY pictures).
- `texts`, `products` and `category` are what is on the picture (the phone
  number is left out of `texts`), for the site's title and description
  maker; `title` and `caption` are the studio's plain defaults (the
  headline), not a listing.
- `kind` is `"photo"` or `"video"`. A video ad carries `video` (its clip:
  MP4 where the owner's browser could write one, WebM otherwise, with
  `width`, `height`, `bytes` and `seconds`) beside `image`, which is still the
  photo to post with it: OfferUp takes a video only with a photo. A photo ad
  has `video: null`. `source` says where it was made (`studio`, `motion`,
  the video maker, or `master`, the master library's finished designs). In
  the RSS the clip rides as a second `media:content`; the enclosure stays
  the picture.
- No email or account detail is ever in the feed. Answers carry
  `Access-Control-Allow-Origin: *` and `X-Robots-Tag: noindex`; the JSON is
  cached for one minute.

### The worker

`autopost_worker.py` does the above with the standard library, review first.
Each run it reads the link and, for each of today's slots it has not taken:

1. hands an ad it has not seen to `intake(ad, jpeg_bytes, video=None)`, once:
   the listings site's review, where the title and description maker writes
   them and a person approves, denies or edits;
2. asks `approved(ad)`, the site's own answer: approved, and the day's
   buying-ad share (a little more in aggressive mode) has room for it;
3. hands an approved ad to `post(ad, jpeg_bytes, repost)` (with a `video`
   parameter, `post(ad, jpeg_bytes, repost, video=None)` gets a video ad's
   clip too), and records the slot only after `post` returns, so a failed
   post is tried again on the next run.

**Nothing is posted without `approved`**: run without it, the worker only
takes ads into review, and `--post` without `--approved` is refused. The
slots posted and the ads taken in live in one small JSON file.

```
BUYBACKAD_FEED_URL=https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_... \
python3 autopost_worker.py --once --state var/buybackad-autopost.json \
  --intake myapp.review:take_in_ad --approved myapp.review:is_approved --post myapp.autopost:post_we_buy_ad
```

Run it from cron or the app's scheduler every 10 to 15 minutes, or keep it
running with `--loop 900`. `--dry-run` lists what it would take in and post,
and records nothing; `--limit` caps the posts per run (5 by default).

`post` is the shop's own Auto-post: the same code path a person uses when they
post a WE BUY ad by hand. It takes the picture as the ad's photo (and, for a
video ad, the clip as the listing's video, with the photo beside it) and
writes the listing from the title and description approved in the site's
review. It returns the listing's id, which is kept beside the slot. Do not
build a second posting pipeline. Each marketplace has its own rules on
reposting and automation, and the shop's daily limits decide how many of the
day's slots are posted.

RSS instead of the worker: any RSS reader that takes new items gets each ad
once a day for its seven days, because each day's slot is a new guid.

### Checked (2026-10-05, from the BUYBACK.AD repo)

`scripts/ad_library_check.mjs` covers the following:

- **The routes.** Saving takes a real JPEG and refuses anything else. The
  same picture saved twice is one ad. Each plan has a cap and there is a
  daily count. The link answers JSON, RSS and pictures byte for byte. A
  reset link stops answering.
- **Daily for seven days.** An ad is offered on each of its seven days
  (seven slots over three weeks) and not after; it stays listed,
  `fresh: false`. A held ad is never offered.
- **The worker.** `autopost_worker.py` runs over HTTP against the real
  function: `--post` without `--approved` is refused; the ad goes into
  review once with its picture and clip, nothing is posted until it is
  approved, then the day's slot is posted once, its JPEG and clip whole.
  `test_autopost.py` also passes (eleven checks, 2026-10-11).
- **The studio, in Chromium under the production CSP.** A download offers
  "Save to library". The Library button shows for the owner only. The
  Library dialog shows the saved ad, "offered to iPhones LA daily, day 1 of
  7", and the link, with no switch or schedule to set. A free account's
  watermarked ad is held. The public page shows the ad.

Not checked from here: `loganipad/iphoneslainv` itself, which this session
cannot reach.

### Paste-ready prompt for the iPhones LA session (review, then post)

```
In loganipad/iphoneslainv: bring BUYBACK.AD's WE BUY ads into the listings
site's review every day, and post the approved ones through the shop's
existing Auto-post, within its daily limits.

The ads come from BUYBACK.AD's ad library: a public link the studio sends by
itself to POST /api/buy-ads/studio/library (or the owner copies it from 📚
Library → Copy link). From the BUYBACK.AD repo
(myleskcb/buybackad-graphics-studio), read docs/iphonesla-library/README.md,
section "Auto-post and repost: the ad library's public link". It is the
contract. buybackad_library.py (BuybackadFeed) reads it; autopost_worker.py
is the job: plug in intake (into the review queue), approved (the site's
approval and the day's limit) and post (the existing Auto-post). It posts
nothing that approved() has not said yes to.

The rules (the owner's):
  - The studio only makes imagery. Every ad saved there is on the link,
    picture and video, with texts, products and category. It approves
    nothing and posts nothing.
  - Titles and descriptions are written here, by the listings site's own
    title and description maker, from ad["texts"], ad["products"],
    ad["category"] and the picture. A person approves, denies or edits them
    here. Nothing is posted before it is approved.
  - An ad's imagery is used for 7 days at most (ad["fresh_until"]), posted
    at most once a day in them (one ad["post"]["slot_id"] a day). Past its
    seven days (ad["fresh"] false) it is not posted again.
  - The day's posts stay within the shop's daily limits: buying ads take
    their safe share of the day's posts, a little more in aggressive mode.

1. Accept POST /api/buy-ads/studio/library (README, "The link arrives by
   itself") if it is not there yet; store the link as the feed to read.
2. Once a day (or every few hours), read the feed and put each new ad into
   the review queue with its picture, its video if any, and the title and
   description your maker writes for it. Keep the ids already taken.
3. Post approved ads through the EXISTING Auto-post (the same code path as a
   WE BUY ad posted by hand; no second pipeline): each day, among the
   approved ads whose current slot you have not posted and that are still
   fresh, post as many as the day's buying-ad limit allows.
4. Show in the review screen how many of its 7 days each ad has left.
Report: where the review queue and the limit live, the job's schedule, and
the first real ad taken in, approved and posted.
```

