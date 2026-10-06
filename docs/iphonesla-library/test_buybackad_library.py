"""Checks for buybackad_library.py against a live BUYBACK.AD library.

    BUYBACKAD_LIBRARY_URL=https://buybackad-graphics-studio.netlify.app \
    BUYBACKAD_LIBRARY_KEY=bbl_... \
    python3 -m unittest test_buybackad_library -v

Skipped without the two variables. The smaller-JPEG check needs Pillow.
"""
import io
import os
import unittest

from buybackad_library import BuybackadLibrary, LibraryError

URL, KEY = os.environ.get("BUYBACKAD_LIBRARY_URL"), os.environ.get("BUYBACKAD_LIBRARY_KEY")

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None


@unittest.skipUnless(URL and KEY, "set BUYBACKAD_LIBRARY_URL and BUYBACKAD_LIBRARY_KEY")
class LibraryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lib = BuybackadLibrary(URL, KEY)

    def test_key_never_printed(self):
        self.assertNotIn(KEY, repr(self.lib))

    def test_index_and_categories_agree(self):
        idx = self.lib.index()
        self.assertGreater(idx["counts"]["ads"], 0)
        self.assertEqual(sum(self.lib.categories()["categories"].values()), idx["counts"]["ads"])

    def test_filters_and_paging(self):
        page = self.lib.ads(category="phones", limit=5)
        self.assertLessEqual(len(page["items"]), 5)
        self.assertTrue(all(a["category"] == "phones" for a in page["items"]))
        every = list(self.lib.iter_ads(category="phones"))
        self.assertEqual(len(every), page["total"])
        self.assertEqual(len({a["id"] for a in every}), len(every))

    def test_search_narrows(self):
        page = self.lib.ads(q="gold")
        self.assertGreater(page["total"], 0)
        self.assertLess(page["total"], self.lib.index()["counts"]["ads"])

    def test_one_by_id(self):
        ad = self.lib.ads(limit=1)["items"][0]
        self.assertEqual(self.lib.ad(ad["id"])["id"], ad["id"])
        self.assertTrue(ad["studio_url"].endswith("/?card=" + ad["id"]))
        self.assertEqual((ad["image"]["width"], ad["image"]["height"]), (1080, 1080))
        with self.assertRaises(LibraryError) as e:
            self.lib.ad("no-such-ad")
        self.assertEqual(e.exception.status, 404)

    def test_every_ad_has_its_dates(self):
        ads = list(self.lib.iter_ads())
        for ad in ads:
            d = self.lib.dates(ad)
            self.assertTrue(d["created"] and d["updated"] and d["uploaded"], ad["id"])
            self.assertLessEqual(d["created"], d["updated"])
            self.assertLessEqual(d["updated"], d["uploaded"])
            self.assertRegex(ad["uploaded"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        self.assertEqual(self.lib.filename(ads[0]), ads[0]["id"] + "_" + ads[0]["uploaded"][:10] + ".jpg")
        latest = self.lib.index()["latest"]
        self.assertEqual(latest["uploaded"], max(a["uploaded"] for a in ads))

    def test_since_and_sort(self):
        every = self.lib.index()["counts"]["ads"]
        self.assertEqual(self.lib.ads(since="2099-01-01")["total"], 0)
        self.assertEqual(self.lib.ads(since="2000-01-01", limit=1)["total"], every)
        newest = list(self.lib.iter_ads(sort="newest"))
        self.assertEqual(len(newest), every)
        self.assertEqual([a["uploaded"] for a in newest], sorted((a["uploaded"] for a in newest), reverse=True))
        changed = self.lib.changed_since(newest[-1]["updated"])
        self.assertTrue(0 < len(changed) <= every)
        with self.assertRaises(ValueError):
            self.lib.ads(sort="up")
        with self.assertRaises(LibraryError) as e:
            self.lib.ads(since="yesterday")
        self.assertEqual(e.exception.status, 400)

    def test_the_jpeg_carries_its_dates(self):
        ad = self.lib.ads(limit=1)["items"][0]
        jpeg = self.lib.ad_jpeg(ad)
        # the EXIF dates, read with the standard library: "YYYY:MM:DD HH:MM:SS" for each
        want = {k: ad[k].replace("-", ":").replace("T", " ").rstrip("Z").encode() for k in ("created", "updated", "uploaded")}
        for v in want.values():
            self.assertIn(v, jpeg)

    def test_wrong_key_is_401(self):
        with self.assertRaises(LibraryError) as e:
            BuybackadLibrary(URL, "bbl_" + "x" * 40).index()
        self.assertEqual(e.exception.status, 401)

    def test_proxy_drops_unknown_params_and_the_partner(self):
        page = self.lib.proxy("ads", {"category": "gold", "limit": "3", "secret": "x"})
        self.assertTrue(0 < len(page["items"]) <= 3 and all(a["category"] == "gold" for a in page["items"]))
        self.assertNotIn("partner", self.lib.proxy("index", {}))
        self.assertIn("partner", self.lib.index())        # the cached answer was not trimmed

    def test_pictures_only_from_the_site(self):
        with self.assertRaises(LibraryError):
            self.lib.fetch_image("https://example.com/x.jpg")

    def test_the_ad_is_the_librarys_jpeg_byte_for_byte(self):
        ad = self.lib.ads(limit=1)["items"][0]
        jpeg = self.lib.ad_jpeg(ad)
        self.assertEqual(jpeg[:3], b"\xff\xd8\xff")
        self.assertEqual(len(jpeg), ad["image"]["bytes"])

    @unittest.skipIf(Image is None, "needs Pillow")
    def test_a_smaller_ad(self):
        ad = self.lib.ads(limit=1)["items"][0]
        im = Image.open(io.BytesIO(self.lib.ad_jpeg(ad, max_side=640)))
        self.assertEqual((im.format, im.size), ("JPEG", (640, 640)))


if __name__ == "__main__":
    unittest.main()
