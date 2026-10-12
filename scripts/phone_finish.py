"""The plain glass of a phone back, smooth, and how a back is saved.

Every back carried the lossy WebP codec's tiles in its glass: a smooth gradient
stored as flat 16 px squares a code or two apart, seen as faint blocks on a light
back (owner, 2026-10-12: "remove entirely"). smooth_body runs an edge-aware
recursive filter (the domain transform, Gastal & Oliveira 2011) over the glass,
which treats the tiles' small steps on the codec's 8 px seams as no edge at all
and anything stronger (the logo, the camera, the rim) as a wall. save_back keeps
it so: lossy WebP put the tiles straight back even at quality 100, so backs are
saved lossless (about 60 KB each, from 8-16).
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def _rf(img, mask, sigma_s=12.0, sigma_r=5.0, iters=3, seam=6):
    I = img.copy()
    h, w, _ = I.shape
    dx = np.abs(np.diff(img, axis=1)).sum(axis=2)
    dy = np.abs(np.diff(img, axis=0)).sum(axis=2)
    # the codec's tile seams (every 8 px) carry steps of a code or two: not edges
    dx = np.where((np.arange(w - 1) % 8 == 7)[None, :] & (dx <= seam), 0, dx)
    dy = np.where((np.arange(h - 1) % 8 == 7)[:, None] & (dy <= seam), 0, dy)
    ctx = np.where(mask[:, 1:] & mask[:, :-1], 1 + sigma_s / sigma_r * dx, 1e6)
    cty = np.where(mask[1:, :] & mask[:-1, :], 1 + sigma_s / sigma_r * dy, 1e6)
    for i in range(iters):
        a = np.exp(-np.sqrt(2) / (sigma_s * np.sqrt(3) * 2 ** (iters - i - 1) / np.sqrt(4 ** iters - 1)))
        vx, vy = (a ** ctx)[..., None], (a ** cty)[..., None]
        for x in range(1, w):
            I[:, x] += vx[:, x - 1] * (I[:, x - 1] - I[:, x])
        for x in range(w - 2, -1, -1):
            I[:, x] += vx[:, x] * (I[:, x + 1] - I[:, x])
        for y in range(1, h):
            I[y] += vy[y - 1] * (I[y - 1] - I[y])
        for y in range(h - 2, -1, -1):
            I[y] += vy[y] * (I[y + 1] - I[y])
    return I


def smooth_body(im, rim=10):
    """The glass inside the rim (`rim` px in), smooth; edges and the rim as they were."""
    a = np.asarray(im.convert("RGBA")).astype(float)
    inside = a[..., 3] > 128
    body = inside & (ndimage.distance_transform_edt(np.pad(inside, 1))[1:-1, 1:-1] > rim)
    wgt = (ndimage.gaussian_filter(body.astype(float), 1.5) * body)[..., None]
    out = a.copy()
    out[..., :3] = a[..., :3] * (1 - wgt) + _rf(a[..., :3], body) * wgt
    return Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), "RGBA")


def save_back(im, path):
    im.save(path, lossless=True, quality=100, method=6)
