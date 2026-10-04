# The BUYBACK.AD library on iPhones LA's listing page

The owner, 2026-10-04: "build the intermediary so the ad title and description
page and list it can access the library material from buyback ad via a key ...
build your part and then give me the rest to put into the iPhones LA repo to
finish this library of imagery".

BUYBACK.AD's part is built and on `main` (`netlify/lib/library.mjs`, served as
`/api/library/v1` by the site's one function, DESIGN-LAW rule 111). This folder
is the rest, for `loganipad/iphoneslainv`: copy it in, wire two routes, mount
the picker on the listing page.

```
iPhones LA listing page ──▶ iPhones LA server ──(key)──▶ BUYBACK.AD /api/library/v1
   (title, description,       /api/buybackad-library/*        the catalogue
    photos, List it)           holds the key                      │
         ▲                     makes listing JPEGs                ▼
         └──── a JPEG File ◀──────────────────────────── the pictures (public, CDN)
```

The browser never sees the key. The pictures are BUYBACK.AD's static files
(public, cached a month at the edge); the key gates the catalogue.

## Files

| file | goes to | what it is |
|---|---|---|
| `buybackad_library.py` | the server's Python package | the client: the key, the routes, a cache, `listing_jpeg()` (a cut-out on white, JPEG, 1600 long side). Standard library; Pillow for the JPEG. |
| `library-picker.js` | the static files | the panel for the listing page: search, Products / Scenes / Backgrounds / Ad designs, a category, a grid. A pick hands the page a JPEG `File`. |
| `example_server.py` | reference only | the two routes and a demo listing page, standard library, runnable |
| `test_buybackad_library.py` | the tests | nine checks against a live library (skipped without the env vars) |

## Setting it up (the owner, once)

1. **Make a key** (anywhere):
   `python3 -c "import secrets; print('bbl_' + secrets.token_urlsafe(32))"`
2. **BUYBACK.AD's Netlify project** (the one iPhones LA will call,
   `buybackad-graphics-studio` unless you say otherwise): Site configuration →
   Environment variables → add `LIBRARY_KEYS` = `iphonesla:<the key>`
   (scope: Functions), then redeploy `main`. Optional: `LIBRARY_DAILY`
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
library does; cache on it).

| route | answers |
|---|---|
| `/api/library/v1` | `{ name, version, partner, counts: { assets, ads, cutouts, scenes, backgrounds }, routes }` |
| `/api/library/v1/categories` | `{ version, assets: { cutout: { iphones: 147, ... }, scene: {...}, background: {...} }, ads: { phones: 64, pokemon: 41, ... } }` |
| `/api/library/v1/assets?kind=&category=&q=&limit=&offset=` | a page of assets |
| `/api/library/v1/assets/{id}` | `{ version, item }` |
| `/api/library/v1/ads?category=&q=&limit=&offset=` | a page of ad designs |
| `/api/library/v1/ads/{id}` | `{ version, item }` |

- `kind`: `cutout` (a product on a transparent ground), `scene` (products
  composed on a set), `background`; a comma list is allowed.
- `category`: one or a comma list (`iphones`, `ipads`, `macbooks`, `watch`,
  `airpods`, `samsung`, `pixel`, `cash`, `gold`, ... see `/categories`).
- `q`: words; every word must start a word of the item, and the best matches
  come first (a word in the name, then the description, then the category).
- `limit`: 1 to 200 (50); `offset`: 0 up. A page is
  `{ version, total, offset, limit, next_offset, items }`; `next_offset` is
  null on the last page.

An asset (the real record, 2026-10-04):

```json
{ "id": "iphone-15-pro-back-black", "kind": "cutout", "category": "iphones",
  "alt": "iPhone 15 Pro in black titanium, back panel facing camera, three-lens module, slight 12 degree tilt",
  "width": 1841, "height": 1663, "bytes": 89750, "format": "webp", "transparent": true,
  "url": "https://buybackad-graphics-studio.netlify.app/assets/cutouts/iphone-15-pro-back-black.webp",
  "source": "generated", "credit": null }
```

In the library on 2026-10-04: 867 assets (637 cut-outs, 77 scenes, 153
backgrounds; 147 of the cut-outs filed under iphones) and 311 ad designs.

`source` is how the picture came into the library (`generated`, `original`,
`ingested`, `composed`, `photo`); `credit` is set where the library holds an
attribution (a licence to keep with the picture). Placeholders are never
offered.

An ad design (a finished BUYBACK.AD ad, offered the way the site offers it; the real record):

```json
{ "id": "checklistHero-jw07-15", "title": "Black & Gold · Checklist Hero",
  "category": "phones", "theme": "Black & Gold", "layout": "checklistHero", "subject": "watch",
  "thumb": { "url": "https://.../assets/showcase/checklistHero-jw07-15.webp", "width": 448, "height": 448 },
  "studio_url": "https://buybackad-graphics-studio.netlify.app/?card=checklistHero-jw07-15" }
```

A design is a 448px preview: it is finished in the studio (`studio_url` opens
it there to put the shop's number on it), and its full-size download comes back
to iPhones LA through the existing studio link (`iphonesla-link.js`, the WE BUY
picture library).

Errors: `{ "error": "..." }` with 400 (a bad kind or id), 401 (no key or a
wrong one; `WWW-Authenticate: Bearer`), 404, 405 (anything but GET), 429 (the
day's requests for this key; `Retry-After`), 502 (the library index could not
be read), 503 (no keys set on BUYBACK.AD).

## The iPhones LA routes

Behind the same login as the listing page. Each is a few lines over
`buybackad_library.py`; `example_server.py` has them runnable.

| route | does |
|---|---|
| `GET /api/buybackad-library/index` | counts and version (the partner name removed) |
| `GET /api/buybackad-library/categories` | as above |
| `GET /api/buybackad-library/assets?...` | as above; parameters other than kind, category, q, limit, offset are dropped |
| `GET /api/buybackad-library/ads?...` | as above |
| `GET /api/buybackad-library/jpeg/{id}?max=1600` | that asset as a listing JPEG (a cut-out laid on white) |

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
    if route not in ("index", "categories", "assets", "ads"):
        return jsonify(error="not found"), 404
    try:
        return jsonify(lib.proxy(route, request.args.to_dict()))
    except LibraryError as e:
        return _fail(e)

@bp.get("/jpeg/<asset_id>")
def jpeg(asset_id):
    try:
        side = max(320, min(2400, int(request.args.get("max", 1600))))
        data = lib.listing_jpeg(lib.asset(asset_id), max_side=side)
    except LibraryError as e:
        return _fail(e)
    return Response(data, mimetype="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})

# app.register_blueprint(bp)   (behind the listing page's login)
```

FastAPI:

```python
from fastapi import APIRouter, HTTPException, Query, Request, Response
from buybackad_library import BuybackadLibrary, LibraryError

lib = BuybackadLibrary.from_env()
router = APIRouter(prefix="/api/buybackad-library")

def _fail(e: LibraryError):
    status = e.status if e.status in (400, 404, 429) else 502
    raise HTTPException(status, str(e) if status != 502 else "the BUYBACK.AD library did not answer")

@router.get("/jpeg/{asset_id}")
def jpeg(asset_id: str, side: int = Query(1600, alias="max")):
    try:
        data = lib.listing_jpeg(lib.asset(asset_id), max_side=max(320, min(2400, side)))
    except LibraryError as e:
        _fail(e)
    return Response(data, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})

@router.get("/{route}")
def proxy(route: str, request: Request):
    if route not in ("index", "categories", "assets", "ads"):
        raise HTTPException(404, "not found")
    try:
        return lib.proxy(route, dict(request.query_params))
    except LibraryError as e:
        _fail(e)

# app.include_router(router, dependencies=[...the listing page's login...])
```

The client is synchronous (urllib) and caches answers five minutes; in an async
app run it in a thread (FastAPI does that for `def` routes) or call it from a
worker.

## The listing page

Beside the title and description:

```html
<div id="buybackad-library"></div>
<script src="/static/library-picker.js"></script>
<script>
  BuybackadPicker.mount(document.getElementById('buybackad-library'), {
    endpoint: '/api/buybackad-library',
    onPick: ({ item, file }) => addListingPhoto(file),   // the page's own path for an uploaded photo
  });
</script>
```

`file` is a JPEG `File` named after the picture (`iphone-15-pro-back-black.jpg`),
as if it had been uploaded, so the listing's photo list, its order, its upload
and "List it" stay exactly as they are. `item` is the asset (for its `credit`
and `source`, if the shop keeps them). The same comes as a `buybackad:pick`
event on the element. A pick on Ad designs opens the design in the BUYBACK.AD
studio in a new tab instead.

## Checked (2026-10-04, from the BUYBACK.AD repo)

`scripts/library_api_check.mjs` (the API: keys, rotation, the day's cap, every
route, filters, paging, every link a real file, the live designs the site's
own) and `scripts/library_handoff_check.mjs` (this folder: the nine Python
tests against a stand-in BUYBACK.AD; the Flask and FastAPI code above, taken
out of this file and run; then `example_server.py`'s listing page in Chromium:
the picker loads, "iphone" puts the iPhone 15 Pro pictures first, a pick adds
a 1600px JPEG with white behind the cut-out to the photos, a design opens the
studio). Not checked from there: `loganipad/iphoneslainv` itself, which that
session could not reach, and the live site, which has the API only once `main`
is deployed with `LIBRARY_KEYS` set.

## Paste-ready prompt for the iPhones LA session

```
In loganipad/iphoneslainv: add the BUYBACK.AD picture library to the listing
page (the page where a listing gets its title and description and is listed).

From the BUYBACK.AD repo (myleskcb/buybackad-graphics-studio, main), folder
docs/iphonesla-library/, copy:
  - buybackad_library.py      into the server package (standard library;
                              add Pillow to the requirements if it is not there)
  - library-picker.js         into the static files the listing page can load
  - test_buybackad_library.py into the tests
Read that folder's README.md first: it is the API contract and has Flask and
FastAPI versions of the two routes; example_server.py has them runnable.

1. Server: add the routes under /api/buybackad-library (index, categories,
   assets, ads, and jpeg/<id>) over BuybackadLibrary.from_env(), in this app's
   framework, behind the same login as the listing page. The key comes from
   BUYBACKAD_LIBRARY_KEY and the site from BUYBACKAD_LIBRARY_URL: set both
   where this app keeps its secrets, never in the front end or in git.
2. Listing page: mount the picker beside the title and description with
   BuybackadPicker.mount(el, { endpoint: '/api/buybackad-library',
   onPick: ({ file }) => <the page's existing add-a-photo path>(file) }).
   A pick must land exactly as an uploaded photo would: same list, same order,
   same upload, same List it. Do not add a second photo pipeline.
3. Keep `item.credit` with the photo where the listing stores photo metadata
   (a picture with a credit carries a licence).
4. Run test_buybackad_library.py with the two variables set; then pick a
   picture on the listing page and list a test item end to end.
Report: the routes and the page changed, the test output, and a screenshot of
the listing page with the library open.
```
