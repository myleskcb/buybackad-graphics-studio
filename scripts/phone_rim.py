"""The outer rim of a phone back, rebuilt from its own cross-section.

A back cut out of a photo carries its frame's reflections as a broken, speckled
band of dark dashes round the edge (the iPhone 16 White, and every back painted
on it); the 17 and 18 Pro backs show one smooth band. clean_rim keeps each back's
own edge profile (outline, frame, the seam to the glass) and smooths it along the
outline: at every depth in from the edge the colour is the running median along
the outline. mend_sides first carries the lines through where the side buttons
cut them. The silhouette, and so the side buttons the audit reads, is untouched.
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def mend_sides(im, depth=12, run=8):
    """Carry the rim's lines through where the side buttons break them. Seen from
    the back the buttons show as a grey stretch inside the rim (30-43% down the
    right side of a 16), cutting the dark outline and the line inside it; on the
    phone they sit behind the frame. Rows of a long side whose edge profile parts
    from that side's own for `run` rows or more are rebuilt from the rows above
    and below. Short ticks, the antenna lines, are left; the silhouette is not touched."""
    a = np.asarray(im.convert("RGBA")).astype(float)
    h, w = a.shape[:2]
    inside = a[..., 3] > 128
    out = a.copy()
    for side in (-1, 1):                                     # left edge, right edge
        ys = np.arange(h)
        has = inside.any(axis=1)
        edge = np.where(has, np.where(side > 0, w - 1 - np.argmax(inside[:, ::-1], axis=1), np.argmax(inside, axis=1)), -1)
        straight = has & (np.abs(edge - np.median(edge[int(h * .3):int(h * .7)])) <= 1)
        straight[:int(h * .12)] = straight[int(h * .88):] = False   # clear of where the corners start
        cols = edge[:, None] - side * np.arange(depth + 1)[None, :]
        prof = a[ys[:, None], np.clip(cols, 0, w - 1), :3]      # rows x depth x rgb
        ref = np.median(prof[straight], axis=0)
        dev = np.abs(prof - ref).mean(axis=(1, 2))
        base = np.median(dev[straight])
        odd = straight & (dev > max(6, 2.2 * base))
        lab, n = ndimage.label(odd)
        for i in range(1, n + 1):
            rr = np.flatnonzero(lab == i)
            if len(rr) < run:
                continue
            y0, y1 = max(rr[0] - 3, 0), min(rr[-1] + 3, h - 1)
            above, below = prof[y0 - 1], prof[y1 + 1]
            for y in range(y0, y1 + 1):
                f = (y - y0 + 1) / (y1 - y0 + 2)
                fill = above * (1 - f) + below * f
                for dd in range(depth + 1):
                    x = edge[y] - side * dd
                    wgt = min(1, (depth - dd) / 2)            # eases into the glass
                    out[y, x, :3] = out[y, x, :3] * (1 - wgt) + fill[dd] * wgt
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA")


def clean_rim(im, depth=8, window=.02):
    a = np.asarray(im.convert("RGBA")).astype(float)
    h, w = a.shape[:2]
    inside = a[..., 3] > 128
    # depth in from the edge, smoothed: whole-pixel steps along a curve beat
    d = ndimage.gaussian_filter(ndimage.distance_transform_edt(inside), .8) * inside
    rim = inside & (d <= depth)
    # where along the outline: the angle round the centre, on a square-scaled frame
    yy, xx = np.mgrid[0:h, 0:w]
    nb = 1440
    tb = ((np.arctan2((yy - h / 2) / h, (xx - w / 2) / w) + np.pi) / (2 * np.pi) * nb).astype(int) % nb
    db = np.clip((d * 2).astype(int), 0, depth * 2)          # half-pixel depth layers
    d2 = np.clip(d * 2, 0, depth * 2)
    d0 = np.minimum(d2.astype(int), depth * 2 - 1)
    fr = d2 - d0
    win = max(3, int(nb * window) | 1)
    wgt = np.clip((depth - d) / 2, 0, 1) * rim               # eases into the glass over 2 px
    out = a.copy()
    key = db[rim] * nb + tb[rim]
    order = np.argsort(key)
    key = key[order]
    cut = np.flatnonzero(np.diff(key)) + 1
    for k in range(3):
        grid = np.full((depth * 2 + 1, nb), np.nan)
        for kk, vv in zip(np.split(key, cut), np.split(a[..., k][rim][order], cut)):
            grid.flat[kk[0]] = np.median(vv)
        for r in range(grid.shape[0]):
            ok = ~np.isnan(grid[r])
            if ok.sum() < 2:
                continue
            row = np.interp(np.arange(nb), np.flatnonzero(ok), grid[r][ok], period=nb)
            pad = np.concatenate([row[-win:], row, row[:win]])
            grid[r] = ndimage.median_filter(pad, size=win)[win:-win]
        # depth layers no pixel falls in (distances are roots of whole numbers)
        # are filled from the layers either side
        full = np.flatnonzero(~np.isnan(grid).all(axis=1))
        g = np.stack([np.interp(np.arange(grid.shape[0]), full, grid[full, j]) for j in range(nb)], axis=1)
        sm = g[d0, tb] * (1 - fr) + g[d0 + 1, tb] * fr
        out[..., k] = a[..., k] * (1 - wgt) + sm * wgt
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA")
