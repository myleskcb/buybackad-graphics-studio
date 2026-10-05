"""Auto-post the BUYBACK.AD ad library's WE BUY ads, and post them again on
their schedule. A reference worker for iPhones LA's server.

The owner, 2026-10-05: "when we save the ads on the site we can make a public
library for iphones LA to access and auto post the we buy ads and auto repost
them too".

What it does, each run:
  1. reads the library's public link (BuybackadFeed): the ads saved in the
     BUYBACK.AD studio, each set to auto-post or not, each with its schedule;
  2. picks the ones due now whose slot it has not posted (a slot is "this ad,
     at this due time"; an ad comes due when it is saved and again every
     repost_days days, so its next slot is a repost);
  3. hands each to `post(ad, jpeg, repost)`, the shop's own posting, and
     records the slot once that returns. A post that raises is not recorded,
     so the next run tries it again.

The posting itself is the shop's: plug the existing Auto-post in as `post`.
This file posts nowhere by itself (the default `post` only prints).

Run it every 10 to 15 minutes from cron or the app's scheduler:

    BUYBACKAD_FEED_URL=https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_... \
    python3 autopost_worker.py --once --state var/buybackad-autopost.json --post myapp.autopost:post_we_buy_ad

or keep it running: --loop 900. --dry-run lists what is due and records nothing.

`post` gets the ad record (title, category, caption, texts, products, image,
post: {slot_id, due_at, next_at, round}), the picture as JPEG bytes, and
repost=True from the second slot on. It returns anything worth keeping (the
listing's id, say); that is stored beside the slot.
"""
from __future__ import annotations

import argparse
import importlib
import json
import logging
import os
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone

from buybackad_library import BuybackadFeed, LibraryError

log = logging.getLogger("buybackad.autopost")
KEEP_DAYS = 120                                    # forget slots older than this


class PostedSlots:
    """The slot ids already posted, in one small JSON file, written atomically."""

    def __init__(self, path: str):
        self.path = path
        self.slots: dict[str, dict] = {}
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            self.slots = data.get("slots", {}) if isinstance(data, dict) else {}
        except FileNotFoundError:
            pass

    def __contains__(self, slot_id: str) -> bool:
        return slot_id in self.slots

    def ids(self) -> set:
        return set(self.slots)

    def add(self, slot_id: str, ad: dict, ref=None) -> None:
        self.slots[slot_id] = {"ad": ad.get("id"), "posted_at": _now_iso(), "ref": ref if isinstance(ref, (str, int, float)) else None}

    def save(self) -> None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)).isoformat()
        self.slots = {k: v for k, v in self.slots.items() if (v.get("posted_at") or "") >= cutoff}
        folder = os.path.dirname(os.path.abspath(self.path))
        os.makedirs(folder, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=folder, prefix=".autopost-", suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump({"slots": self.slots}, f, indent=1, sort_keys=True)
        os.replace(tmp, self.path)


def run_once(feed: BuybackadFeed, post, state: PostedSlots, limit: int = 5, dry_run: bool = False) -> list:
    """Post what is due, at most `limit` ads a run. Returns one line per ad."""
    out = []
    try:
        due = feed.due(state.ids())
    except LibraryError as e:
        log.warning("the ad library did not answer: %s", e)
        return [("error", None, str(e))]
    for ad in due[:max(0, limit)]:
        slot = ad["post"]["slot_id"]
        repost = (ad["post"].get("round") or 1) > 1
        if dry_run:
            out.append(("due", ad["id"], ("repost " if repost else "post ") + ad.get("title", "")))
            continue
        try:
            jpeg = feed.jpeg(ad)
            ref = post(ad, jpeg, repost)
        except Exception as e:                     # the shop's poster failed: try again next run
            log.warning("not posted: %s (%s): %s", ad.get("title"), slot, e)
            out.append(("failed", ad["id"], str(e)))
            continue
        state.add(slot, ad, ref)
        state.save()                               # after each one: a crash never posts twice
        out.append(("reposted" if repost else "posted", ad["id"], ad.get("title", "")))
    return out


def print_post(ad: dict, jpeg: bytes, repost: bool):
    """The default `post`: says what it would post and posts nothing."""
    print(("REPOST " if repost else "POST   ") + f"{ad.get('title')!r} [{ad.get('category')}] "
          f"{len(jpeg)} bytes, due {ad['post']['due_at']}, next {ad['post'].get('next_at') or 'never'}")
    return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_post(spec: str):
    mod, _, fn = spec.partition(":")
    if not mod or not fn:
        raise SystemExit("--post must be module:function, e.g. myapp.autopost:post_we_buy_ad")
    return getattr(importlib.import_module(mod), fn)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Auto-post and repost the BUYBACK.AD ad library's ads.")
    ap.add_argument("--state", default="buybackad-autopost.json", help="where the posted slots are kept")
    ap.add_argument("--post", help="module:function that posts one ad (default: print only)")
    ap.add_argument("--limit", type=int, default=5, help="ads a run, at most (default 5)")
    ap.add_argument("--dry-run", action="store_true", help="list what is due, record nothing")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--once", action="store_true", help="one run (for cron)")
    g.add_argument("--loop", type=int, metavar="SECONDS", help="run every SECONDS (600 at least)")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    feed = BuybackadFeed.from_env()
    post = _load_post(a.post) if a.post else print_post
    state = PostedSlots(a.state)
    while True:
        for kind, ad_id, note in run_once(feed, post, state, a.limit, a.dry_run):
            log.info("%s %s %s", kind, ad_id or "", note)
        if not a.loop:
            return 0
        time.sleep(max(600, a.loop))
        state = PostedSlots(a.state)


if __name__ == "__main__":
    sys.exit(main())
