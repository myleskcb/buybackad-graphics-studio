"""Take the BUYBACK.AD ad library's WE BUY ads into the listings site's
review, and post the approved ones through the shop's own Auto-post. A
reference worker for iPhones LA's server.

The owner, 2026-10-05: "auto post the we buy ads and auto repost them too";
2026-10-11: "we're supposed to do the approval or denial of the title
description on the listings iPhone LA site", "the same imagery for seven
days per unique ad that is our maximum", "reposted daily of course". The
BUYBACK.AD studio only makes the imagery; titles, descriptions, approval and
posting are the site's, within its daily limits.

What it does, each run:
  1. reads the library's public link (BuybackadFeed): every ad saved in the
     BUYBACK.AD studio, each offered once a day for seven days from its save
     (a slot is "this ad, on this day"; past its seven days it has none);
  2. hands each ad it has not seen to `intake(ad, jpeg, video=None)`, once:
     the site's review queue, where its title and description maker writes
     them and a person approves, denies or edits;
  3. asks `approved(ad)` for each of today's slots it has not posted, and
     hands an approved one to `post(ad, jpeg, repost)`, the shop's own
     posting, recording the slot once that returns. A post that raises is
     not recorded, so the next run tries it again. A video ad
     (ad["kind"] == "video") also brings its clip when `post` takes a
     `video` argument.

Nothing is posted without `approved`: with no approval check, a run takes ads
into review and posts nothing. The day's limits are the site's: `approved`
can say no to an ad the day's buying-ad share has no room for, and `--limit`
caps the posts a run.

Run it every 10 to 15 minutes from cron or the app's scheduler:

    BUYBACKAD_FEED_URL=https://buybackad-graphics-studio.netlify.app/master-library.html?feed=fd_... \
    python3 autopost_worker.py --once --state var/buybackad-autopost.json \
      --intake myapp.review:take_in_ad --approved myapp.review:is_approved --post myapp.autopost:post_we_buy_ad

or keep it running: --loop 900. --dry-run lists what it would take in and
post, and records nothing.

`intake` and `post` get the ad record (title, category, caption, texts,
products, image, video, kind, fresh_until, post: {slot_id, due_at, next_at,
round}), the picture as JPEG bytes and, with a `video` parameter, the clip's
bytes (MP4 or WebM, ad["video"]["format"]), None for a photo ad. `post` also
gets repost=True from the second day on. What they return (the review
item's id, the listing's id) is kept beside the ad or the slot.
"""
from __future__ import annotations

import argparse
import importlib
import inspect
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
    """The slot ids already posted and the ads already taken into review, in
    one small JSON file, written atomically."""

    def __init__(self, path: str):
        self.path = path
        self.slots: dict[str, dict] = {}
        self.taken_in: dict[str, dict] = {}
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                self.slots = data.get("slots", {}) or {}
                self.taken_in = data.get("taken_in", {}) or {}
        except FileNotFoundError:
            pass

    def __contains__(self, slot_id: str) -> bool:
        return slot_id in self.slots

    def ids(self) -> set:
        return set(self.slots)

    def add(self, slot_id: str, ad: dict, ref=None) -> None:
        self.slots[slot_id] = {"ad": ad.get("id"), "posted_at": _now_iso(), "ref": ref if isinstance(ref, (str, int, float)) else None}

    def take_in(self, ad: dict, ref=None) -> None:
        self.taken_in[ad["id"]] = {"at": _now_iso(), "ref": ref if isinstance(ref, (str, int, float)) else None}

    def save(self) -> None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)).isoformat()
        self.slots = {k: v for k, v in self.slots.items() if (v.get("posted_at") or "") >= cutoff}
        self.taken_in = {k: v for k, v in self.taken_in.items() if (v.get("at") or "") >= cutoff}
        folder = os.path.dirname(os.path.abspath(self.path))
        os.makedirs(folder, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=folder, prefix=".autopost-", suffix=".json")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump({"slots": self.slots, "taken_in": self.taken_in}, f, indent=1, sort_keys=True)
        os.replace(tmp, self.path)


def run_once(feed: BuybackadFeed, post, state: PostedSlots, limit: int = 5, dry_run: bool = False,
             approved=None, intake=None) -> list:
    """Take new ads into review (intake), then post today's slots of the
    approved ones, at most `limit` posts a run. Without `approved`, nothing is
    posted. Returns one line per ad: (what, ad id, note)."""
    out = []
    try:
        due = feed.due(state.ids())
    except LibraryError as e:
        log.warning("the ad library did not answer: %s", e)
        return [("error", None, str(e))]
    posts = 0
    for ad in due:
        slot = ad["post"]["slot_id"]
        repost = (ad["post"].get("round") or 1) > 1
        files = {}

        def picture():
            if "jpeg" not in files:
                files["jpeg"] = feed.jpeg(ad)
            return files["jpeg"]

        def clip():
            if "video" not in files:
                files["video"] = feed.video(ad) if ad.get("video") else None
            return files["video"]

        if intake and ad["id"] not in state.taken_in:
            if dry_run:
                out.append(("intake", ad["id"], ad.get("title", "")))
            else:
                try:
                    ref = intake(ad, picture(), video=clip()) if _takes_video(intake) else intake(ad, picture())
                except Exception as e:             # the review queue failed: try again next run
                    log.warning("not taken in: %s: %s", ad.get("title"), e)
                    out.append(("failed", ad["id"], "intake: " + str(e)))
                    continue
                state.take_in(ad, ref)
                state.save()
                out.append(("taken in", ad["id"], ad.get("title", "")))
        if approved is None:
            continue                               # no approval check: nothing is posted
        try:
            ok = approved(ad)
        except Exception as e:
            log.warning("approval not known: %s: %s", ad.get("title"), e)
            out.append(("failed", ad["id"], "approved: " + str(e)))
            continue
        if not ok:
            out.append(("waiting", ad["id"], "not approved"))
            continue
        if posts >= max(0, limit):
            continue
        posts += 1
        if dry_run:
            out.append(("due", ad["id"], ("repost " if repost else "post ") + ad.get("title", "")))
            continue
        try:
            if _takes_video(post):
                ref = post(ad, picture(), repost, video=clip())
            else:
                ref = post(ad, picture(), repost)
        except Exception as e:                     # the shop's poster failed: try again next run
            log.warning("not posted: %s (%s): %s", ad.get("title"), slot, e)
            out.append(("failed", ad["id"], str(e)))
            continue
        state.add(slot, ad, ref)
        state.save()                               # after each one: a crash never posts twice
        out.append(("reposted" if repost else "posted", ad["id"], ad.get("title", "")))
    return out


def print_post(ad: dict, jpeg: bytes, repost: bool, video: bytes | None = None):
    """The default `post`: says what it would post and posts nothing."""
    print(("REPOST " if repost else "POST   ") + f"{ad.get('title')!r} [{ad.get('category')}] "
          f"{len(jpeg)} bytes" + (f" + video {len(video)} bytes" if video else "") +
          f", due {ad['post']['due_at']}, next {ad['post'].get('next_at') or 'never'}")
    return None


def _takes_video(post) -> bool:
    """Whether the shop's `post` (or `intake`) has a `video` parameter (or **kwargs)."""
    try:
        params = inspect.signature(post).parameters
    except (TypeError, ValueError):
        return False
    return "video" in params or any(p.kind is inspect.Parameter.VAR_KEYWORD for p in params.values())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load(spec: str, flag: str = "--post"):
    mod, _, fn = spec.partition(":")
    if not mod or not fn:
        raise SystemExit(flag + " must be module:function, e.g. myapp.autopost:post_we_buy_ad")
    return getattr(importlib.import_module(mod), fn)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Take the BUYBACK.AD ad library's ads into review, and post the approved ones.")
    ap.add_argument("--state", default="buybackad-autopost.json", help="where the posted slots and the ads taken in are kept")
    ap.add_argument("--intake", help="module:function that puts one ad into the site's review")
    ap.add_argument("--approved", help="module:function that says whether an ad is approved to post today")
    ap.add_argument("--post", help="module:function that posts one ad (default: print only); needs --approved")
    ap.add_argument("--limit", type=int, default=5, help="ads a run, at most (default 5)")
    ap.add_argument("--dry-run", action="store_true", help="list what is due, record nothing")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--once", action="store_true", help="one run (for cron)")
    g.add_argument("--loop", type=int, metavar="SECONDS", help="run every SECONDS (600 at least)")
    a = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    if a.post and not a.approved:
        raise SystemExit("--post needs --approved: nothing is posted before it is approved on the site")
    feed = BuybackadFeed.from_env()
    post = _load(a.post) if a.post else print_post
    approved = _load(a.approved, "--approved") if a.approved else None
    intake = _load(a.intake, "--intake") if a.intake else None
    state = PostedSlots(a.state)
    while True:
        for kind, ad_id, note in run_once(feed, post, state, a.limit, a.dry_run, approved=approved, intake=intake):
            log.info("%s %s %s", kind, ad_id or "", note)
        if not a.loop:
            return 0
        time.sleep(max(600, a.loop))
        state = PostedSlots(a.state)


if __name__ == "__main__":
    sys.exit(main())
