"""The outer rim of a phone back, rebuilt from its own cross-section.

A back cut out of a photo carries its frame's reflections as a broken, speckled
band of dark dashes round the edge (the iPhone 16 White, and every back painted
on it); the 17 and 18 Pro backs show one smooth band. clean_rim keeps each back's
own edge profile (outline, frame, the seam to the glass) and smooths it along the
outline: at every depth in from the edge the colour is the running median along
the outline. mend_top_corner carries the band inside the outline round the top
corners of the photographs that lose it there. The silhouette, and so the side
buttons the audit reads, is untouched.
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def depth_in(inside, indices=False):
    """Distance in px from the outline, the picture's own border counting as outside:
    a back is trimmed edge to edge, so its long sides lie on the border, and measured
    to transparent pixels alone they read as deep as the nearest corner."""
    pad = np.pad(inside, 1, constant_values=False)
    if not indices:
        return ndimage.distance_transform_edt(pad)[1:-1, 1:-1]
    dist, (iy, ix) = ndimage.distance_transform_edt(pad, return_indices=True)
    return dist[1:-1, 1:-1], iy[1:-1, 1:-1] - 1, ix[1:-1, 1:-1] - 1


def mend_top_corner(im, deep=30):
    """The top-right corner rebuilt so its lines run through it unbroken.

    On the 16, 16e and 17e photographs the band inside the outline runs down the
    long side and fades out half way round the top corners (to -4..-13 L against
    the glass, where the bottom corners hold -48..-57 all the way round), and the
    light line further in, a reflection in the glass edge 22 px in down the top of
    the long side, broke off below the corner, with a piece of it 13 px in round
    the curve, a gap and a jump between the two.

    The corner takes the long side's own edge profile (its middle, clear of the
    buttons and the reflection), against the glass straight in from each pixel, run
    round the curve with the outline, and over its last 40 degrees crosses to the
    top's own profile, so it meets the side and the top as they are. The light line
    is then drawn once along its depth (glass_line). Depth is in px from the outline."""
    a = np.asarray(im.convert("RGBA")).astype(float)
    h, w = a.shape[:2]
    R = round(w * .24)
    inside = a[..., 3] > 128
    d = ndimage.gaussian_filter(depth_in(inside), .8) * inside
    span = np.arange(deep + 5)
    # the two straight edges' profiles, against the glass beside them
    edge = w - 1 - np.argmax(inside[:, ::-1], axis=1)
    rows = np.arange(int(h * .5), int(h * .8))
    sp = a[rows[:, None], np.clip(edge[rows][:, None] - span[None, :], 0, w - 1), :3]
    side = np.median(sp - sp[:, deep:].mean(axis=1, keepdims=True), axis=0)
    topy = np.argmax(inside, axis=0)
    cols = np.arange(int(w * .55), int(w * .8))
    tp = a[np.clip(topy[cols][:, None] + span[None, :], 0, h - 1), cols[:, None], :3]
    top = np.median(tp - tp[:, deep:].mean(axis=1, keepdims=True), axis=0)
    # the glass straight in from each pixel along the edge's normal, past the band
    yy, xx = np.mgrid[0:h, 0:w]
    _, iy, ix = depth_in(inside, indices=True)
    ny, nx = yy - iy, xx - ix
    nn = np.maximum(np.hypot(ny, nx), 1e-6)
    gy = np.clip(np.round(iy + ny / nn * (deep + 3)).astype(int), 0, h - 1)
    gx = np.clip(np.round(ix + nx / nn * (deep + 3)).astype(int), 0, w - 1)
    glass = ndimage.uniform_filter(a[..., :3], (3, 3, 1))[gy, gx]
    ease = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))
    phi = np.degrees(np.arctan2(R - yy, xx - (w - R)))       # 0 along the side, 90 along the top
    t = ease((phi - 50) / 40)[..., None]
    prof = lambda p: np.stack([np.interp(d, span, p[:, k]) for k in range(3)], -1)
    new = glass + prof(side) * (1 - t) + prof(top) * t
    box = (yy < R) & (xx >= w - R)
    lay = (box * inside * ease((deep - d) / 2))[..., None]
    out = a.copy()
    out[..., :3] = a[..., :3] * (1 - lay) + new * lay
    return glass_line(Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA"), d, a, deep)


def glass_line(im, d, ref, deep=30):
    """The light line in the glass edge, as one line. Measured where it runs down the
    top of the long side (its shade and width against the glass beside it, and where
    it fades out), its broken pieces are cleared and it is drawn once along a single
    depth: up the side, round the corner with the outline, and as far along the top
    as it ran down the side, fading at both ends. It is measured on `ref`, the back
    before its corner was rebuilt (which clears it from the top of the side)."""
    a = np.asarray(im).astype(float)
    h, w = a.shape[:2]
    inside = a[..., 3] > 128
    span = np.arange(deep + 5)
    edge = w - 1 - np.argmax(inside[:, ::-1], axis=1)
    side = ref[np.arange(h)[:, None], np.clip(edge[:, None] - span[None, :], 0, w - 1), :3]
    rel = side - side[:, deep:deep + 5].mean(axis=1, keepdims=True)
    rows = np.arange(int(h * .1), int(h * .22))
    line = np.median(rel[rows], axis=0)
    line[:14] = 0
    line[line.mean(axis=1) > 0] = 0
    if line.mean(axis=1).min() > -3:
        return im                                            # no line to carry
    d0 = int(np.argmin(line.mean(axis=1)))
    # where it fades out down the side: from the first row it stays faint for 10 rows
    weak = rel[:, d0 - 2:d0 + 3].mean(axis=2).min(axis=1) > line.mean(axis=1).min() / 3
    y_end = int(h * .1)
    while y_end < int(h * .5) and not weak[y_end:y_end + 10].all():
        y_end += 1
    reach = y_end                                            # as far along the top as down the side
    yy, xx = np.mgrid[0:h, 0:w]
    region = inside & (d >= 12) & (d <= deep) & (yy <= y_end + 30) & (xx >= w - 1 - reach - 30)
    # clear: each pixel takes the glass straight in from it along the edge's normal,
    # just past the line
    _, iy, ix = depth_in(inside, indices=True)
    ny, nx = yy - iy, xx - ix
    nn = np.maximum(np.hypot(ny, nx), 1e-6)
    gy = np.clip(np.round(iy + ny / nn * (deep + 3)).astype(int), 0, h - 1)
    gx = np.clip(np.round(ix + nx / nn * (deep + 3)).astype(int), 0, w - 1)
    glass = ndimage.uniform_filter(a[..., :3], (3, 3, 1))[gy, gx]
    fade = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))
    along = np.minimum(fade((y_end - yy) / 40), fade((xx - (w - 1 - reach)) / 40))
    clear = region * fade((d - 12) / 2) * fade((deep - d) / 2)
    out = a.copy()
    out[..., :3] = a[..., :3] * (1 - clear[..., None]) + glass * clear[..., None]
    draw = np.stack([np.interp(d, span, line[:, k]) for k in range(3)], -1)
    out[..., :3] += draw * (region * along)[..., None]
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA")


def clean_rim(im, depth=8, window=.02):
    a = np.asarray(im.convert("RGBA")).astype(float)
    h, w = a.shape[:2]
    inside = a[..., 3] > 128
    # depth in from the edge, smoothed: whole-pixel steps along a curve beat
    d = ndimage.gaussian_filter(depth_in(inside), .8) * inside
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
