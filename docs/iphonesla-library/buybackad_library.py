"""BUYBACK.AD library client, for iPhones LA's server.

The listing page (title, description, list it) picks pictures from the
BUYBACK.AD library. This module is the only thing that talks to BUYBACK.AD:
it holds the key, which never goes to a browser. Standard library only;
Pillow is optional and used by listing_jpeg() alone.

Configure with two environment variables:

    BUYBACKAD_LIBRARY_URL   https://buybackad-graphics-studio.netlify.app
    BUYBACKAD_LIBRARY_KEY   bbl_...   (the key BUYBACK.AD's owner set in LIBRARY_KEYS)

    lib = BuybackadLibrary.from_env()
    page = lib.assets(kind="cutout", category="iphones", q="15 pro", limit=24)
    for item in page["items"]:
        print(item["id"], item["url"], item["width"], item["height"])
    jpeg = lib.listing_jpeg(page["items"][0])          # bytes, ready for OfferUp

What comes back is described in README.md beside this file (the contract
of /api/library/v1).
"""
from __future__ import annotations

import io
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

__all__ = ["BuybackadLibrary", "LibraryError"]

KINDS = ("cutout", "scene", "background")
_ALLOWED_PARAMS = {
    "assets": {"kind", "category", "q", "limit", "offset"},
    "ads": {"category", "q", "limit", "offset"},
}


class LibraryError(Exception):
    """A request to the library failed. `status` is the HTTP status (0: no answer)."""

    def __init__(self, message: str, status: int = 0):
        super().__init__(message)
        self.status = status


class BuybackadLibrary:
    def __init__(self, base_url: str, key: str, timeout: float = 15.0, cache_seconds: float = 300.0):
        if not base_url or not base_url.startswith(("https://", "http://")):
            raise ValueError("base_url must be the BUYBACK.AD site, e.g. https://buybackad-graphics-studio.netlify.app")
        if not key or len(key) < 32:
            raise ValueError("key must be the library key (32 characters or more)")
        self.base = base_url.rstrip("/") + "/api/library/v1"
        self.site = urllib.parse.urlsplit(base_url)
        self._key = key
        self.timeout = timeout
        self.cache_seconds = cache_seconds
        self._cache: dict[str, tuple[float, dict]] = {}
        self._lock = threading.Lock()

    @classmethod
    def from_env(cls, **kw) -> "BuybackadLibrary":
        return cls(os.environ.get("BUYBACKAD_LIBRARY_URL", ""), os.environ.get("BUYBACKAD_LIBRARY_KEY", ""), **kw)

    def __repr__(self) -> str:                      # never print the key
        return f"BuybackadLibrary({self.base!r})"

    # ---------- the routes ----------
    def index(self) -> dict:
        """Counts, version and routes."""
        return self._get("")

    def categories(self) -> dict:
        """{"assets": {"cutout": {"iphones": 147, ...}, "scene": {...}, "background": {...}}, "ads": {"phones": 40, ...}}"""
        return self._get("/categories")

    def assets(self, kind: str | None = None, category: str | None = None, q: str | None = None,
               limit: int = 50, offset: int = 0) -> dict:
        """Product cut-outs (transparent), scenes and backgrounds. One page:
        {"version", "total", "offset", "limit", "next_offset", "items": [...]}"""
        return self._get("/assets", self._params("assets", kind=kind, category=category, q=q, limit=limit, offset=offset))

    def asset(self, asset_id: str) -> dict:
        return self._get("/assets/" + urllib.parse.quote(asset_id, safe=""))["item"]

    def ads(self, category: str | None = None, q: str | None = None, limit: int = 50, offset: int = 0) -> dict:
        """The finished ad designs BUYBACK.AD offers: 448px thumbnails and a
        studio_url that opens the design in the studio to finish and download."""
        return self._get("/ads", self._params("ads", category=category, q=q, limit=limit, offset=offset))

    def ad(self, ad_id: str) -> dict:
        return self._get("/ads/" + urllib.parse.quote(ad_id, safe=""))["item"]

    def iter_assets(self, **filters):
        """Every matching asset, page by page."""
        offset = 0
        while offset is not None:
            page = self.assets(offset=offset, limit=200, **filters)
            yield from page["items"]
            offset = page["next_offset"]

    def proxy(self, route: str, params: dict) -> dict:
        """For the server route the listing page calls: route is "assets",
        "ads", "categories" or "index"; params are the browser's query string.
        Unknown parameters are dropped; the answer holds no secret."""
        if route == "assets":
            return self.assets(**self._clean("assets", params))
        if route == "ads":
            return self.ads(**self._clean("ads", params))
        if route == "categories":
            return self.categories()
        if route == "index":
            data = dict(self.index())                 # a copy: the cached answer stays whole
            data.pop("partner", None)
            return data
        raise LibraryError("unknown library route", 404)

    # ---------- the pictures ----------
    def fetch_image(self, item: dict, max_bytes: int = 15 * 1024 * 1024) -> bytes:
        """The picture itself (an asset's url, or an ad's thumb url). Only from
        the BUYBACK.AD site: a url pointing anywhere else is refused."""
        url = item.get("url") or (item.get("thumb") or {}).get("url")
        if not url:
            raise LibraryError("this item has no picture")
        u = urllib.parse.urlsplit(url)
        if (u.scheme, u.netloc) != (self.site.scheme, self.site.netloc):
            raise LibraryError("refusing a picture from outside the BUYBACK.AD site: " + url)
        req = urllib.request.Request(url, headers={"User-Agent": "iphonesla-library/1"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                data = r.read(max_bytes + 1)
        except urllib.error.HTTPError as e:
            raise LibraryError(f"picture {e.code}: {url}", e.code) from None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            raise LibraryError(f"picture unreachable: {e}") from None
        if len(data) > max_bytes:
            raise LibraryError("picture larger than max_bytes")
        return data

    def listing_jpeg(self, item: dict, max_side: int = 1600, background=(255, 255, 255), quality: int = 92) -> bytes:
        """The picture as a JPEG for a marketplace listing (OfferUp, Marketplace,
        Craigslist all take JPEG): a transparent cut-out is laid on `background`
        (white by default), and the long side is brought down to max_side.
        Needs Pillow (pip install pillow)."""
        try:
            from PIL import Image
        except ImportError as e:
            raise LibraryError("listing_jpeg needs Pillow: pip install pillow") from e
        im = Image.open(io.BytesIO(self.fetch_image(item)))
        im.load()
        if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
            im = im.convert("RGBA")
            ground = Image.new("RGB", im.size, background)
            ground.paste(im, mask=im.getchannel("A"))
            im = ground
        else:
            im = im.convert("RGB")
        if max(im.size) > max_side:
            im.thumbnail((max_side, max_side), Image.LANCZOS)
        out = io.BytesIO()
        im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        return out.getvalue()

    # ---------- plumbing ----------
    def _params(self, route: str, **kw) -> dict:   # route: which list the parameters are for
        out = {}
        for k, v in kw.items():
            if v is None or v == "":
                continue
            if k == "kind" and v not in KINDS and not all(x.strip() in KINDS for x in str(v).split(",")):
                raise LibraryError("kind is one of " + ", ".join(KINDS), 400)
            out[k] = v
        out["limit"] = max(1, min(200, int(out.get("limit", 50))))
        out["offset"] = max(0, int(out.get("offset", 0)))
        return out

    def _clean(self, route: str, params: dict) -> dict:
        kept = {k: str(v)[:120] for k, v in (params or {}).items() if k in _ALLOWED_PARAMS[route]}
        for k in ("limit", "offset"):
            if k in kept:
                try:
                    kept[k] = int(kept[k])
                except ValueError:
                    kept.pop(k)
        return kept

    def _get(self, path: str, params: dict | None = None) -> dict:
        url = self.base + path + ("?" + urllib.parse.urlencode(params) if params else "")
        now = time.monotonic()
        with self._lock:
            hit = self._cache.get(url)
            if hit and now - hit[0] < self.cache_seconds:
                return hit[1]
        req = urllib.request.Request(url, headers={
            "Authorization": "Bearer " + self._key,
            "Accept": "application/json",
            "User-Agent": "iphonesla-library/1",
        })
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                data = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read().decode("utf-8")).get("error") or e.reason
            except Exception:
                msg = e.reason
            raise LibraryError(f"BUYBACK.AD library {e.code}: {msg}", e.code) from None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            raise LibraryError(f"BUYBACK.AD library unreachable: {e}") from None
        with self._lock:
            if len(self._cache) > 500:
                self._cache.clear()
            self._cache[url] = (now, data)
        return data
