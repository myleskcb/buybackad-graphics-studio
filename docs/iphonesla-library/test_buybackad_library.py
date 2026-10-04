"""Checks for buybackad_library.py against a live BUYBACK.AD library.

    BUYBACKAD_LIBRARY_URL=https://buybackad-graphics-studio.netlify.app \
    BUYBACKAD_LIBRARY_KEY=bbl_... \
    python3 -m unittest test_buybackad_library -v

Skipped without the two variables. The JPEG checks need Pillow.
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
        self.assertEqual(idx["counts"]["assets"], idx["counts"]["cutouts"] + idx["counts"]["scenes"] + idx["counts"]["backgrounds"])
        cats = self.lib.categories()
        self.assertEqual(sum(sum(c.values()) for c in cats["assets"].values()), idx["counts"]["assets"])
        self.assertEqual(sum(cats["ads"].values()), idx["counts"]["ads"])

    def test_filters_and_paging(self):
        page = self.lib.assets(kind="cutout", category="iphones", limit=5)
        self.assertLessEqual(len(page["items"]), 5)
        self.assertTrue(all(a["kind"] == "cutout" and a["category"] == "iphones" and a["transparent"] for a in page["items"]))
        every = list(self.lib.iter_assets(kind="cutout", category="iphones"))
        self.assertEqual(len(every), page["total"])
        self.assertEqual(len({a["id"] for a in every}), len(every))

    def test_search_narrows(self):
        page = self.lib.assets(q="macbook")
        self.assertGreater(page["total"], 0)
        self.assertLess(page["total"], self.lib.index()["counts"]["assets"])

    def test_one_by_id(self):
        first = self.lib.assets(limit=1)["items"][0]
        self.assertEqual(self.lib.asset(first["id"])["id"], first["id"])
        ad = self.lib.ads(limit=1)["items"][0]
        self.assertEqual(self.lib.ad(ad["id"])["id"], ad["id"])
        self.assertTrue(ad["studio_url"].endswith("/?card=" + ad["id"]))
        with self.assertRaises(LibraryError) as e:
            self.lib.asset("no-such-picture")
        self.assertEqual(e.exception.status, 404)

    def test_wrong_key_is_401(self):
        with self.assertRaises(LibraryError) as e:
            BuybackadLibrary(URL, "bbl_" + "x" * 40).index()
        self.assertEqual(e.exception.status, 401)

    def test_proxy_drops_unknown_params_and_the_partner(self):
        page = self.lib.proxy("assets", {"kind": "scene", "limit": "3", "secret": "x"})
        self.assertTrue(all(a["kind"] == "scene" for a in page["items"]))
        self.assertNotIn("partner", self.lib.proxy("index", {}))
        self.assertIn("partner", self.lib.index())        # the cached answer was not trimmed

    def test_pictures_only_from_the_site(self):
        with self.assertRaises(LibraryError):
            self.lib.fetch_image({"url": "https://example.com/x.webp"})

    @unittest.skipIf(Image is None, "needs Pillow")
    def test_cutout_becomes_a_listing_jpeg_on_white(self):
        item = self.lib.assets(kind="cutout", category="iphones", limit=1)["items"][0]
        jpeg = self.lib.listing_jpeg(item, max_side=800)
        im = Image.open(io.BytesIO(jpeg))
        self.assertEqual(im.format, "JPEG")
        self.assertLessEqual(max(im.size), 800)
        corner = im.convert("RGB").getpixel((0, 0))
        self.assertTrue(all(c >= 245 for c in corner), corner)


if __name__ == "__main__":
    unittest.main()
