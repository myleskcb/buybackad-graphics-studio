"""BUYBACK.AD library client, for iPhones LA's server.

The listing page (title, description, list it) puts one of BUYBACK.AD's
library ads on a listing: the finished ads the owner approved into the
library in the BUYBACK.AD app, with the shop's number on them. This module is
the only thing that talks to BUYBACK.AD: it holds the key, which never goes to
a browser. Standard library only (Pillow only to make an ad smaller than
1080).

Configure with two environment variables:

    BUYBACKAD_LIBRARY_URL   https://buybackad-graphics-studio.netlify.app
    BUYBACKAD_LIBRARY_KEY   bbl_...   (the key BUYBACK.AD's owner set in LIBRARY_KEYS)

    lib = BuybackadLibrary.from_env()
    page = lib.ads(category="phones", q="iphone", limit=24)
    for ad in page["items"]:
        print(ad["id"], ad["title"], ad["image"]["url"])
    jpeg = lib.ad_jpeg(page["items"][0])          # 1080x1080 JPEG bytes, ready for OfferUp

What comes back is described in README.md beside this file (the contract
of /api/library/v1).

The ad library's public link (BuybackadFeed) is the other way in: the ads
saved in the BUYBACK.AD studio, and which of them are due to post. It needs no
key (the link is the access) and is what autopost_worker.py reads:

    BUYBACKAD_FEED_URL   https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_...
                         (the link the studio's Library shows; the /api/ads/feed/fd_... address works too)

    feed = BuybackadFeed.from_env()
    for ad in feed.due(posted_slot_ids):         # what to post now, once per slot
        jpeg = feed.jpeg(ad)
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

__all__ = ["BuybackadLibrary", "BuybackadFeed", "LibraryError"]

_ALLOWED_PARAMS = {"category", "q", "limit", "offset"}


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
        """{"version": ..., "categories": {"phones": 64, "gold": 33, ...}}"""
        return self._get("/categories")

    def ads(self, category: str | None = None, q: str | None = None, limit: int = 50, offset: int = 0) -> dict:
        """One page of the library's ads:
        {"version", "total", "offset", "limit", "next_offset", "items": [...]}"""
        params = {k: v for k, v in {"category": category, "q": q}.items() if v}
        params["limit"] = max(1, min(200, int(limit)))
        params["offset"] = max(0, int(offset))
        return self._get("/ads", params)

    def ad(self, ad_id: str) -> dict:
        return self._get("/ads/" + urllib.parse.quote(ad_id, safe=""))["item"]

    def iter_ads(self, **filters):
        """Every matching ad, page by page."""
        offset = 0
        while offset is not None:
            page = self.ads(offset=offset, limit=200, **filters)
            yield from page["items"]
            offset = page["next_offset"]

    def proxy(self, route: str, params: dict) -> dict:
        """For the server route the listing page calls: route is "ads",
        "categories" or "index"; params are the browser's query string.
        Unknown parameters are dropped; the answer holds no secret."""
        if route == "ads":
            kept = {k: str(v)[:120] for k, v in (params or {}).items() if k in _ALLOWED_PARAMS}
            for k in ("limit", "offset"):
                if k in kept:
                    try:
                        kept[k] = int(kept[k])
                    except ValueError:
                        kept.pop(k)
            return self.ads(**kept)
        if route == "categories":
            return self.categories()
        if route == "index":
            data = dict(self.index())                 # a copy: the cached answer stays whole
            data.pop("partner", None)
            return data
        raise LibraryError("unknown library route", 404)

    # ---------- the pictures ----------
    def fetch_image(self, url: str, max_bytes: int = 15 * 1024 * 1024) -> bytes:
        """A picture from the BUYBACK.AD site (an ad's image or thumb url). A
        url pointing anywhere else is refused."""
        return _fetch_image(url, self.site, self.timeout, max_bytes)

    def ad_jpeg(self, ad: dict, max_side: int | None = None, quality: int = 90) -> bytes:
        """The ad as a JPEG for a listing (OfferUp, Marketplace and Craigslist
        all take JPEG): the library's own 1080x1080 render, byte for byte.
        With max_side under its size it is made smaller (needs Pillow)."""
        image = ad.get("image") or {}
        return _as_jpeg(self.fetch_image(image.get("url", "")), image, max_side, quality)

    # ---------- plumbing ----------
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
            "User-Agent": "iphonesla-library/2",
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


class BuybackadFeed:
    """The ad library's public link: the ads saved in the BUYBACK.AD studio
    (📚 Library), and which of them are due to post.

    Each ad set to auto-post carries `post`: {"slot_id", "due_at", "next_at",
    "round"}. It is due when it is saved (or switched on) and again every
    `repost_days` days (0: once). A poster keeps the slot ids it has posted:
    an ad whose current slot_id is not among them is due, so each ad is
    posted once per slot, and posted again when its next slot comes. An ad
    with `hold` set (it shows a website, a QR code, an address or a handle,
    or carries the watermark) never has a slot.
    """

    def __init__(self, feed_url: str, timeout: float = 15.0):
        u = urllib.parse.urlsplit(feed_url or "")
        feed = urllib.parse.parse_qs(u.query).get("feed", [""])[0]
        if not feed:
            m = u.path.rstrip("/").split("/")
            feed = m[-1].replace(".json", "").replace(".rss", "") if len(m) > 1 and m[-2] == "feed" else ""
        if u.scheme not in ("https", "http") or not u.netloc or not feed.startswith("fd_") or len(feed) != 27:
            raise ValueError("feed_url must be the ad library link, e.g. https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_...")
        self.site = urllib.parse.SplitResult(u.scheme, u.netloc, "", "", "")
        self.url = f"{u.scheme}://{u.netloc}/api/ads/feed/{feed}"
        self.timeout = timeout

    @classmethod
    def from_env(cls, **kw) -> "BuybackadFeed":
        return cls(os.environ.get("BUYBACKAD_FEED_URL", ""), **kw)

    def __repr__(self) -> str:                      # the link is the access: never print it whole
        return f"BuybackadFeed({self.site.netloc!r}, {self.url[-27:-20]}…)"

    def read(self, category: str | None = None) -> dict:
        """The whole library: {"name", "version", "count", "links", "items": [...]}"""
        url = self.url + ("?" + urllib.parse.urlencode({"category": category}) if category else "")
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "iphonesla-library/2"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                msg = json.loads(e.read().decode("utf-8")).get("error") or e.reason
            except Exception:
                msg = e.reason
            raise LibraryError(f"BUYBACK.AD ad library {e.code}: {msg}", e.code) from None
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            raise LibraryError(f"BUYBACK.AD ad library unreachable: {e}") from None

    def due(self, posted=(), category: str | None = None) -> list:
        """The ads to post now: set to auto-post, not held, and whose current
        slot is not in `posted` (the slot ids already posted). Oldest due first."""
        seen = set(posted)
        items = [a for a in self.read(category).get("items", [])
                 if a.get("post") and not a.get("hold") and a["post"].get("slot_id") not in seen]
        return sorted(items, key=lambda a: a["post"].get("due_at") or "")

    def jpeg(self, ad: dict, max_side: int | None = None, quality: int = 90) -> bytes:
        """The ad's picture, byte for byte as it was saved (a JPEG); smaller with
        max_side (needs Pillow). Only from the BUYBACK.AD site the link is on."""
        image = ad.get("image") or {}
        return _as_jpeg(_fetch_image(image.get("url", ""), self.site, self.timeout, 15 * 1024 * 1024), image, max_side, quality)


def _fetch_image(url: str, site, timeout: float, max_bytes: int) -> bytes:
    u = urllib.parse.urlsplit(url or "")
    if (u.scheme, u.netloc) != (site.scheme, site.netloc):
        raise LibraryError("refusing a picture from outside the BUYBACK.AD site: " + str(url))
    req = urllib.request.Request(url, headers={"User-Agent": "iphonesla-library/2"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read(max_bytes + 1)
    except urllib.error.HTTPError as e:
        raise LibraryError(f"picture {e.code}: {url}", e.code) from None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise LibraryError(f"picture unreachable: {e}") from None
    if len(data) > max_bytes:
        raise LibraryError("picture larger than max_bytes")
    return data


def _as_jpeg(data: bytes, image: dict, max_side: int | None, quality: int) -> bytes:
    if data[:3] != b"\xff\xd8\xff":
        raise LibraryError("the library's image is not a JPEG")
    if not max_side or max_side >= max(image.get("width") or 0, image.get("height") or 0):
        return data
    try:
        from PIL import Image
    except ImportError as e:
        raise LibraryError("a smaller ad needs Pillow: pip install pillow") from e
    im = Image.open(io.BytesIO(data)).convert("RGB")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return out.getvalue()
