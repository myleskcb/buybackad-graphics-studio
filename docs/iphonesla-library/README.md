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
| `/api/library/v1/ads?category=&q=&limit=&offset=` | a page of ads |
| `/api/library/v1/ads/{id}` | `{ version, item }` |

- `category`: one or a comma list (`phones`, `gold`, `silver`, `coins`,
  `cars`, `pokemon`, `sports`, `strips`).
- `q`: words; every word must start a word of the ad (its category, subject,
  title or layout), and what the ad is for comes first: "gold" gives the
  gold-buying ads before the ads in a black-and-gold palette.
- `limit`: 1 to 200 (50); `offset`: 0 up. A page is
  `{ version, total, offset, limit, next_offset, items }`; `next_offset` is
  null on the last page.

An ad (the real record, 2026-10-04):

```json
{ "id": "bubblePop-nn05-30", "title": "Red & Yellow · Bubble Pop",
  "category": "sports", "theme": "Red & Yellow", "layout": "bubblePop", "subject": "cards",
  "image": { "url": "https://buybackad-graphics-studio.netlify.app/assets/library-ads/bubblePop-nn05-30.jpg?v=35300c70fee0",
             "width": 1080, "height": 1080, "bytes": 210802, "format": "jpg" },
  "thumb": { "url": "https://buybackad-graphics-studio.netlify.app/assets/showcase/bubblePop-nn05-30.webp", "width": 448, "height": 448 },
  "studio_url": "https://buybackad-graphics-studio.netlify.app/?card=bubblePop-nn05-30" }
```

`image` is the ad itself, the picture for a listing (`?v=` changes when it is
re-drawn). `thumb` is the library's preview, for a grid. `studio_url` opens the
ad in the BUYBACK.AD studio, to change it before downloading (a download from
there comes back through the existing studio link, the WE BUY picture library).

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
| `GET /api/buybackad-library/ads?...` | as above; parameters other than category, q, limit, offset are dropped |
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

`file` is the ad as a JPEG `File` (`bubblePop-nn05-30.jpg`, 1080x1080, the
library's own file byte for byte), as if it had been uploaded, so the listing's
photo list, its order, its upload and "List it" stay exactly as they are. `ad`
is the record above. The same comes as a `buybackad:pick` event on the element.

## Checked (2026-10-04, from the BUYBACK.AD repo)

`scripts/library_api_check.mjs`: the renders (one for every ad the site
offers, each a 1080x1080 JPEG of the card as the library shows it now, none
left over), the keys, rotation, the day's cap, every route, filters, paging,
every link a real file, a held ad not offered, and the real function end to
end. `scripts/library_handoff_check.mjs`: this folder's ten Python tests
against a stand-in BUYBACK.AD; the Flask and FastAPI code above, taken out of
this file and run; `example_server.py`'s listing page in Chromium (the
picker loads the ads, "gold" narrows them, a pick adds the ad to the photos,
byte for byte the library's file); and `docs/iphonesla-library.zip` holding
exactly these files. Not checked from there: `loganipad/iphoneslainv`
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
