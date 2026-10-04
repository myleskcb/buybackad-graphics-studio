"""The iPhones LA routes the picker calls, as a runnable reference.

Standard library only (Pillow for the JPEG route). It is the shape to copy
into iPhones LA's own app (Flask, FastAPI, Django: README.md has the first
two), not something to run in production as it is.

    BUYBACKAD_LIBRARY_URL=https://buybackad-graphics-studio.netlify.app \
    BUYBACKAD_LIBRARY_KEY=bbl_... \
    python3 example_server.py 8896

then open http://localhost:8896/ : a listing page (title, description,
photos) with the library beside it.

    GET /api/buybackad-library/index        counts and version
    GET /api/buybackad-library/categories   kinds and categories
    GET /api/buybackad-library/assets       ?kind=&category=&q=&limit=&offset=
    GET /api/buybackad-library/ads          ?category=&q=&limit=&offset=
    GET /api/buybackad-library/jpeg/<id>    that asset as a listing JPEG (?max=1600)
"""
from __future__ import annotations

import json
import os
import re
import sys
import threading
import urllib.parse
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from buybackad_library import BuybackadLibrary, LibraryError

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = BuybackadLibrary.from_env()
ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
_jpegs: "OrderedDict[tuple, bytes]" = OrderedDict()   # a few recent JPEGs, so a second pick is instant
_jpeg_lock = threading.Lock()

DEMO = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>New listing</title>
<style>body{font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px;max-width:1100px;margin:auto}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:16px}
@media (max-width:760px){.cols{grid-template-columns:1fr}}
label{display:block;font-weight:600;margin:10px 0 4px}input,textarea{width:100%;box-sizing:border-box;font:inherit;padding:8px;border:1px solid #ccc;border-radius:8px}
#photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}#photos img{width:96px;height:96px;object-fit:cover;border-radius:8px;border:1px solid #ccc}</style></head>
<body><h1>New listing</h1><div class="cols"><form id="listing">
<label for="t">Title</label><input id="t" value="iPhone 15 Pro 256GB Natural Titanium">
<label for="d">Description</label><textarea id="d" rows="6">Unlocked, battery 92%, no scratches.</textarea>
<label>Photos</label><div id="photos"></div><p><button type="button">List it</button></p></form>
<div id="bbl"></div></div>
<script src="/static/library-picker.js"></script>
<script>
const photos = [];
function addListingPhoto(file){
  photos.push(file);
  const img = document.createElement('img'); img.alt = file.name; img.src = URL.createObjectURL(file);
  document.getElementById('photos').appendChild(img);
}
BuybackadPicker.mount(document.getElementById('bbl'), { endpoint: '/api/buybackad-library', onPick: ({ file }) => addListingPhoto(file) });
</script></body></html>"""


class Handler(BaseHTTPRequestHandler):
    server_version = "iphonesla-library-example"

    def _send(self, status: int, body: bytes, ctype: str, cache: str = "no-store"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, data: dict):
        self._send(status, json.dumps(data).encode(), "application/json; charset=utf-8")

    def do_GET(self):
        u = urllib.parse.urlsplit(self.path)
        params = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
        try:
            if u.path == "/":
                return self._send(200, DEMO.encode(), "text/html; charset=utf-8")
            if u.path == "/static/library-picker.js":
                with open(os.path.join(HERE, "library-picker.js"), "rb") as f:
                    return self._send(200, f.read(), "application/javascript; charset=utf-8", "public, max-age=300")
            m = re.fullmatch(r"/api/buybackad-library/(index|categories|assets|ads)", u.path)
            if m:
                return self._json(200, LIB.proxy(m.group(1), params))
            m = re.fullmatch(r"/api/buybackad-library/jpeg/([^/]+)", u.path)
            if m:
                asset_id = urllib.parse.unquote(m.group(1))
                if not ID_RE.match(asset_id):
                    return self._json(400, {"error": "not a library id"})
                max_side = max(320, min(2400, int(params.get("max", "1600") or 1600)))
                key = (asset_id, max_side)
                with _jpeg_lock:
                    jpeg = _jpegs.get(key)
                if jpeg is None:
                    jpeg = LIB.listing_jpeg(LIB.asset(asset_id), max_side=max_side)
                    with _jpeg_lock:
                        _jpegs[key] = jpeg
                        while len(_jpegs) > 40:
                            _jpegs.popitem(last=False)
                return self._send(200, jpeg, "image/jpeg", "private, max-age=3600")
            return self._json(404, {"error": "not found"})
        except LibraryError as e:
            # the library's own refusals pass through; a key problem is ours to fix, not the visitor's
            status = e.status if e.status in (400, 404, 429) else 502
            return self._json(status, {"error": str(e) if status != 502 else "the BUYBACK.AD library did not answer"})
        except ValueError:
            return self._json(400, {"error": "bad parameter"})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8896
    print(f"http://localhost:{port}/  (library: {LIB.base})")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
