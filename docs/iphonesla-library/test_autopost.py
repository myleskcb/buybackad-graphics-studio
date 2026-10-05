"""Checks for BuybackadFeed and autopost_worker.py, against a stand-in
BUYBACK.AD ad library on this machine (no network, no key):

    python3 -m unittest test_autopost -v
"""
import http.server
import json
import os
import tempfile
import threading
import unittest

from autopost_worker import PostedSlots, run_once
from buybackad_library import BuybackadFeed, LibraryError

FEED = "fd_" + "A" * 24
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 2000


def ad(i, round_=1, hold=None, autopost=True, due="2026-10-05T12:00:00Z", host=""):
    post = None if (hold or not autopost) else {"slot_id": f"ad_{i}@{due}", "due_at": due, "next_at": None, "round": round_}
    return {"id": f"ad_{i}", "title": f"Ad {i}", "category": "phones", "caption": f"We buy {i}", "hold": hold,
            "autopost": bool(post), "repost_days": 7, "post": post,
            "image": {"url": f"{host}/api/ads/feed/{FEED}/img/ad_{i}.jpg?v=1", "width": 1080, "height": 1080, "bytes": len(JPEG), "format": "jpg"}}


class Stand(http.server.BaseHTTPRequestHandler):
    items = []

    def log_message(self, *a):
        pass

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == f"/api/ads/feed/{FEED}":
            body = json.dumps({"name": "Test", "count": len(Stand.items), "items": Stand.items}).encode()
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(body)
        elif path.startswith(f"/api/ads/feed/{FEED}/img/"):
            self.send_response(200); self.send_header("Content-Type", "image/jpeg"); self.end_headers(); self.wfile.write(JPEG)
        else:
            body = b'{"error": "This library link was reset or never existed"}'
            self.send_response(404); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(body)


class FeedTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Stand)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.host = f"http://127.0.0.1:{cls.srv.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.state_path = os.path.join(self.dir, "state.json")
        self.feed = BuybackadFeed(f"{self.host}/master-library.html?feed={FEED}")
        Stand.items = [ad(1, host=self.host), ad(2, host=self.host, due="2026-10-04T12:00:00Z"),
                       ad(3, host=self.host, hold="a website"), ad(4, host=self.host, autopost=False)]

    def test_link_forms(self):
        self.assertEqual(BuybackadFeed(f"{self.host}/api/ads/feed/{FEED}").url, self.feed.url)
        self.assertEqual(BuybackadFeed(f"{self.host}/api/ads/feed/{FEED}.rss").url, self.feed.url)
        for bad in ("", "ftp://x/feed/" + FEED, f"{self.host}/master-library.html", f"{self.host}/api/ads/feed/fd_short"):
            with self.assertRaises(ValueError):
                BuybackadFeed(bad)
        self.assertNotIn(FEED, repr(self.feed))

    def test_due_is_set_not_held_not_posted_oldest_first(self):
        self.assertEqual([a["id"] for a in self.feed.due()], ["ad_2", "ad_1"])
        self.assertEqual([a["id"] for a in self.feed.due({"ad_2@2026-10-04T12:00:00Z"})], ["ad_1"])

    def test_posts_once_a_slot_then_reposts(self):
        posted = []
        post = lambda a, jpeg, repost: posted.append((a["id"], repost, len(jpeg))) or "listing-" + a["id"]
        state = PostedSlots(self.state_path)
        run_once(self.feed, post, state)
        self.assertEqual(posted, [("ad_2", False, len(JPEG)), ("ad_1", False, len(JPEG))])
        run_once(self.feed, post, PostedSlots(self.state_path))      # nothing new is due
        self.assertEqual(len(posted), 2)
        Stand.items[0] = ad(1, round_=2, due="2026-10-12T12:00:00Z", host=self.host)   # its next slot came
        run_once(self.feed, post, PostedSlots(self.state_path))
        self.assertEqual(posted[-1], ("ad_1", True, len(JPEG)))
        with open(self.state_path) as f:
            slots = json.load(f)["slots"]
        self.assertEqual(slots["ad_1@2026-10-12T12:00:00Z"]["ref"], "listing-ad_1")
        self.assertEqual(len(slots), 3)

    def test_a_failed_post_is_tried_again(self):
        calls = []

        def post(a, jpeg, repost):
            calls.append(a["id"])
            if len(calls) == 1:
                raise RuntimeError("marketplace down")
        out = run_once(self.feed, post, PostedSlots(self.state_path))
        self.assertEqual(out[0][0], "failed")
        run_once(self.feed, post, PostedSlots(self.state_path))
        self.assertEqual(calls, ["ad_2", "ad_1", "ad_2"])

    def test_limit_and_dry_run(self):
        out = run_once(self.feed, lambda *a: None, PostedSlots(self.state_path), limit=1)
        self.assertEqual([o[0] for o in out], ["posted"])
        out = run_once(self.feed, lambda *a: 1 / 0, PostedSlots(self.state_path), dry_run=True)
        self.assertEqual([o[0] for o in out], ["due"])
        self.assertEqual(len(PostedSlots(self.state_path).slots), 1)

    def test_pictures_only_from_the_library_site(self):
        evil = ad(9, host="https://elsewhere.example")
        with self.assertRaises(LibraryError):
            self.feed.jpeg(evil)

    def test_a_reset_link_is_a_clear_error(self):
        gone = BuybackadFeed(f"{self.host}/api/ads/feed/fd_{'B' * 24}")
        with self.assertRaises(LibraryError) as e:
            gone.read()
        self.assertEqual(e.exception.status, 404)
        self.assertEqual(run_once(gone, lambda *a: None, PostedSlots(self.state_path))[0][0], "error")


if __name__ == "__main__":
    unittest.main()
