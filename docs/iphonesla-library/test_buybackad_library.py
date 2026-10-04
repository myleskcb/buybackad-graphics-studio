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
