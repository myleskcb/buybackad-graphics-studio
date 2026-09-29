#!/usr/bin/env python3
"""WHERE EACH PHOTOGRAPH'S SUBJECT IS, so a product laid over it can stay off it.

The owner, 2026-09-27: "keep in mind where the background subject is in
relation to the secondary asset ... we don't want it to entirely cover the
content of our background subject, if possible sometimes it's OK or a little
bit but consistently starts to look bad or confusing, especially when we're
talking about centered images and then we happen to center something on top
of it" (the gold coins over the ring photograph, the strips over the Contour
bottle).

A box would not do: the ring photograph is rings from edge to edge, with the
one that matters, the pink stone, in the middle. So each photograph gets a
coarse map of where its eye goes (16 x 16 cells over the picture, 0-9): what
stands out of its surroundings at object scale (spectral residual saliency,
Hou & Zhang 2007, at 64 and 128 px), what differs from the picture's own edges
(the table, the wall), and what is in focus rather than blurred. app.js
productYield() maps it through the photograph's cover crop onto the card and
keeps a product off the cells that carry the subject; a picture whose map is
even all over (a pile of cash, a starfield, a bokeh wash) asks for nothing,
since covering a share of it covers the same share of its subject.

Only the photographs a product can stand on are mapped (every offer ground,
the designer and street scenes in assets/bg, and each photograph a showcase
card puts a product over), so the table stays small enough to load with the
page.

  python3 scripts/photo_subjects.py            -> photo-subjects.js (window.PHOTO_SUBJECTS, loaded before app.js)
  python3 scripts/photo_subjects.py --sheet    -> also .render/subjects/*.jpg (the maps over the pictures, to check by eye)

BOX holds subjects checked by eye and set by hand ([x0, y0, x1, y1] in 0-1):
their map is the box, softened at its edges.

Needs: pip install pillow numpy opencv-python-headless
"""
import json, os, sys, glob
import numpy as np
import cv2
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DIRS = ['assets/bg', 'assets/bg-offer', 'assets/bg-web', 'assets/scenes', 'assets/grounds', 'assets/showcase/bg']
OUT = os.path.join(ROOT, 'photo-subjects.js')
N = 16
BOX = {
    # the offer grounds (assets/bg-offer), where the owner saw it happen
    'assets/bg-offer/strips-contour-next-test-strips-2.jpg': [0.44, 0.24, 0.82, 0.84],
    'assets/bg-offer/gold-gold-jewelry-rings-3.jpg': [0.28, 0.08, 0.72, 0.86],
}

def norm(a):
    a = a.astype(np.float32)
    lo, hi = np.percentile(a, 1), np.percentile(a, 99.5)
    return np.clip((a - lo) / (hi - lo + 1e-6), 0, 1)

def spectral_residual(g, size):
    h, w = g.shape
    s = cv2.resize(g, (size, max(8, round(size * h / w))), interpolation=cv2.INTER_AREA)
    f = np.fft.fft2(s)
    la = np.log(np.abs(f) + 1e-8)
    sal = np.abs(np.fft.ifft2(np.exp(la - cv2.blur(la, (3, 3)) + 1j * np.angle(f)))) ** 2
    sal = cv2.GaussianBlur(sal.astype(np.float32), (0, 0), size / 40)
    return cv2.resize(sal, (w, h), interpolation=cv2.INTER_LINEAR)

def saliency(path):
    im = Image.open(path).convert('RGB')
    w0, h0 = im.size
    s = 256 / max(w0, h0)
    small = np.asarray(im.resize((max(8, round(w0 * s)), max(8, round(h0 * s))), Image.LANCZOS))
    h, w = small.shape[:2]
    gray = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    sr = 0.5 * norm(spectral_residual(gray, 64)) + 0.5 * norm(spectral_residual(gray, 128))
    # what differs from the picture's own edges
    lab = cv2.cvtColor(small, cv2.COLOR_RGB2LAB).astype(np.float32)
    b = max(2, round(0.06 * min(w, h)))
    border = np.concatenate([lab[:b].reshape(-1, 3), lab[-b:].reshape(-1, 3), lab[:, :b].reshape(-1, 3), lab[:, -b:].reshape(-1, 3)])
    _, _, centers = cv2.kmeans(border, 4, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5), 3, cv2.KMEANS_PP_CENTERS)
    d = np.min(np.linalg.norm(lab.reshape(-1, 1, 3) - centers.reshape(1, 4, 3), axis=2), axis=1).reshape(h, w)
    d = norm(cv2.GaussianBlur(d, (0, 0), 4))
    # in focus: a bokeh wash has no edges
    detail = norm(cv2.GaussianBlur(np.abs(cv2.Laplacian(gray, cv2.CV_32F, ksize=3)), (0, 0), 6))
    S = 0.55 * sr + 0.25 * d + 0.2 * detail
    S = cv2.GaussianBlur(S, (0, 0), 4)
    return S

def grid_of(S):
    g = cv2.resize(S, (N, N), interpolation=cv2.INTER_AREA)
    g = np.clip(g - np.percentile(g, 20), 0, None)          # the quiet fifth is ground
    return g / (g.max() + 1e-6)

def box_grid(b):
    ys, xs = np.mgrid[0:N, 0:N]
    cx, cy = (xs + 0.5) / N, (ys + 0.5) / N
    soft = 0.04
    fx = np.clip(np.minimum(cx - b[0], b[2] - cx) / soft + 0.5, 0, 1)
    fy = np.clip(np.minimum(cy - b[1], b[3] - cy) / soft + 0.5, 0, 1)
    return fx * fy

def evenness(g):
    # the share of the map's mass in its busiest quarter of cells: 0.25 is even all over, 1 is one place
    v = np.sort(g.ravel())[::-1]
    return float(v[: len(v) // 4].sum() / (v.sum() + 1e-6))

def under_products():
    # every offer ground and designer/street scene, and what the showcase cards put a product over
    want = set()
    for d in ('assets/bg-offer', 'assets/bg'):
        want |= {os.path.relpath(f, ROOT).replace(os.sep, '/') for f in glob.glob(os.path.join(ROOT, d, '*.jpg'))}
    for f in glob.glob(os.path.join(ROOT, 'assets', 'showcase', 'tpl', '*.json')):
        try:
            t = json.load(open(f)).get('tpl') or {}
        except Exception:
            continue
        bg = t.get('bg') or {}
        if bg.get('type') == 'image' and bg.get('src') and any(l.get('kind') == 'cutout' for l in t.get('layers') or []):
            want.add(bg['src'])
    return want

def main():
    # k-means starts from random centres: seeded, so the same photographs always give the same maps
    cv2.setRNGSeed(0)
    np.random.seed(0)
    sheet = '--sheet' in sys.argv
    table, maps = {}, {}
    want = under_products()
    files = []
    for d in DIRS:
        files += sorted(f for f in glob.glob(os.path.join(ROOT, d, '*')) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
                        and os.path.relpath(f, ROOT).replace(os.sep, '/') in want)
    for f in files:
        rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
        try:
            g = box_grid(BOX[rel]) if rel in BOX else grid_of(saliency(f))
        except Exception as e:
            table[rel] = {'fill': True, 'why': 'unreadable'}
            continue
        q = np.clip(np.round(g * 9), 0, 9).astype(int)
        rec = {'g': ''.join(str(v) for v in q.ravel()), 'focus': round(evenness(g), 2)}
        if rel in BOX:
            rec['checked'] = True
        table[rel] = rec
        maps[rel] = g
    with open(OUT, 'w') as f:
        f.write('/* generated by scripts/photo_subjects.py; do not edit by hand.\n'
                '   Where each photograph a product can stand on draws the eye: g is n x n cells (row by row, 0-9)\n'
                '   over the picture, focus the share of it in its busiest quarter. app.js productYield() reads it. */\n'
                'window.PHOTO_SUBJECTS = ')
        json.dump({'n': N, 'photos': table}, f, separators=(',', ':'), sort_keys=True)
        f.write(';\n')
    print(f'{len(table)} photographs under products -> {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)')
    if sheet:
        out = os.path.join(ROOT, '.render', 'subjects')
        os.makedirs(out, exist_ok=True)
        for f in glob.glob(os.path.join(out, '*.jpg')):
            os.remove(f)
        T, per, cols = 180, 48, 8
        items = [(k, v) for k, v in table.items() if k in maps]
        for p in range(0, len(items), per):
            chunk = items[p:p + per]
            rows = (len(chunk) + cols - 1) // cols
            page = Image.new('RGB', (cols * (T + 4), rows * (T + 18)), (20, 20, 24))
            dr = ImageDraw.Draw(page)
            for i, (rel, v) in enumerate(chunk):
                im = Image.open(os.path.join(ROOT, rel)).convert('RGB').resize((T, T))
                heat = (cv2.resize(maps[rel], (T, T), interpolation=cv2.INTER_CUBIC).clip(0, 1) * 255).astype(np.uint8)
                col = cv2.applyColorMap(heat, cv2.COLORMAP_JET)[:, :, ::-1]
                a = (heat.astype(np.float32) / 255 * 0.55)[..., None]
                mix = (np.asarray(im) * (1 - a) + col * a).astype(np.uint8)
                x, y = (i % cols) * (T + 4), (i // cols) * (T + 18)
                page.paste(Image.fromarray(mix), (x, y))
                dr.text((x + 2, y + T + 2), os.path.basename(rel)[:24] + ' %.2f' % v['focus'], fill=(220, 220, 220))
            page.save(os.path.join(out, f'page{p // per:02d}.jpg'), quality=80)
        print('sheets in .render/subjects')

if __name__ == '__main__':
    main()
