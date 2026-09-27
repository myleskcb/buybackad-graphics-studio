#!/usr/bin/env python3
"""Import the storefront's device art: every model, every colour, cut out clean.

Owner, 2026-09-27: sent the iphones.la device folders (devices/, ad-backs/,
ipad/, mac/, watch/). The 2026-08-30 import (118a666) brought one render per
model at whatever size the site then had; this brings the per-colour set, the
models released since, and the larger renders the site now serves.

Three rules decide what comes in, all the owner's own:
  * the floor (approved-assets.json, 2026-09-03): "iPhone 12 / M-series is the
    floor"; iPads at the Pro M4 / Air M2 / mini 7 line (home-button bodies are
    relics); watches from 2020, the iPhone 12's year. Below it, nothing imports.
  * featureless angles stay out: Mac mini and Mac Studio fronts were rejected
    as "a plain aluminium box with no identity", and the new files are the same
    angle.
  * the photograph is the product (rule 56): no tint, no regrade, no upscale.
    Apple's compare shots are JPEG on white; the cutout keeps the device's own
    pixels and only solves the edge.

Cutting a white-ground JPEG: flood the white from the border (so a white
screen or a starlight band inside the silhouette is never mistaken for
ground), close the mask to mend bites where a silver edge highlight touched
the white, then solve each edge pixel against the white it was blended with:
the device colour F is carried in from the solid interior, alpha is
(255 - c) / (255 - F) on the channel that separates best, and the stored
colour is F itself, so there is no white fringe on a dark ground.

Existing qs- files are replaced only where the site's new render is the same
subject (aspect within 3%) and at least 4% larger. Watches are never replaced:
their band loops were cleared by hand after the first import (c0927cb).

usage: python3 scripts/import_device_art.py <unpacked-upload-dir> [--write]
  the dir holds devices/, ad-backs/, ipad/ (or ipadzip/ipad), mac/, watch/.
  Without --write it reports what it would do and writes contact sheets only.
"""
import hashlib, io, json, os, re, sys, time
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CUT = os.path.join(ROOT, 'assets', 'cutouts')
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else None
WRITE = '--write' in sys.argv
NOTE = 'owner upload 2026-09-27: iphones.la device art, per model and colour'

def find(*names):
    for n in names:
        for base in ('', 'ipadzip', 'maczip', 'watchzip'):
            p = os.path.join(SRC, base, n)
            if os.path.isdir(p): return p
    return None

COLOUR = {'spacegray': 'space-gray', 'space_gray': 'space-gray', 'spaceblack': 'space-black',
          'skyblue': 'sky-blue', 'rosegold': 'rose-gold'}
def colour(s): return COLOUR.get(s, s.replace('_', '-'))

# (pattern on the file stem, model slug, line, display name). First match wins;
# a stem that matches nothing is below the floor or off-list and is skipped.
IPAD = [
    (r'^ipad_11th_a16_(.+)$',       'ipad-11-a16',        'iPad (A16)'),
    (r'^ipad_air_11_(m[234])_(.+)$', 'ipad-air-11-{0}',   'iPad Air 11-inch ({0})'),
    (r'^ipad_air_13_(m[234])_(.+)$', 'ipad-air-13-{0}',   'iPad Air 13-inch ({0})'),
    (r'^ipad_mini_a17pro_(.+)$',    'ipad-mini-7-a17-pro', 'iPad mini (A17 Pro)'),
    (r'^ipad_pro_11_(m[45])_(.+)$', 'ipad-pro-11-{0}',    'iPad Pro 11-inch ({0})'),
    (r'^ipad_pro_13_(m[45])_(.+)$', 'ipad-pro-13-{0}',    'iPad Pro 13-inch ({0})'),
]
MAC = [
    (r'^compare_imac_24_m4_(.+)$',            'imac-24-m4',        'iMac 24-inch (M4)'),
    (r'^compare_imac_24_(.+)$',               'imac-24-m1',        'iMac 24-inch (M1)'),
    (r'^compare_macbook_air_m5_15_(.+)$',     'macbook-air-15-m5', 'MacBook Air 15-inch (M5)'),
    (r'^compare_macbook_air_m5_(.+)$',        'macbook-air-13-m5', 'MacBook Air 13-inch (M5)'),
    (r'^compare_macbook_air_mx_15_(.+)$',     'macbook-air-15',    'MacBook Air 15-inch (M2 to M4)'),
    (r'^compare_macbook_air_mx_(.+)$',        'macbook-air-13',    'MacBook Air 13-inch (M2 to M4)'),
    (r'^compare_macbook_pro_m5_14_(.+)$',     'macbook-pro-14-m5', 'MacBook Pro 14-inch (M5)'),
    (r'^compare_macbook_pro_m5_16_(.+)$',     'macbook-pro-16-m5', 'MacBook Pro 16-inch (M5)'),
    (r'^compare_macbook_pro_14_(.+)$',        'macbook-pro-14',    'MacBook Pro 14-inch (M1 Pro to M4)'),
    (r'^compare_macbook_pro_16_(?!touch)(.+)$', 'macbook-pro-16',  'MacBook Pro 16-inch (M1 Pro to M4)'),
    (r'^compare_macbook_neo_a18_(.+)$',       'macbook-neo-13',    'MacBook Neo 13-inch (A18 Pro)'),
]
WATCH = [
    (r'^compare_watch_series_(6|7|8|9|10|11)_(.+)$', 'watch-s{0}', 'Apple Watch Series {0}'),
    (r'^compare_watch_se_gen1_(.+)$',  'watch-se',   'Apple Watch SE (2020)'),
    (r'^compare_watch_se_gen2_(.+)$',  'watch-se2',  'Apple Watch SE (2nd gen)'),
    (r'^compare_watch_se_3_(.+)$',     'watch-se3',  'Apple Watch SE 3'),
    (r'^compare_watch_ultra_([23])_(.+)$', 'watch-ultra{0}', 'Apple Watch Ultra {0}'),
    (r'^compare_watch_ultra_(titanium.+)$', 'watch-ultra', 'Apple Watch Ultra'),
]
# alpha art from devices/: models the library lacks, at or above the floor
DEVICES_NEW = {
    'iphone-17e': ('iphone', 'iPhone 17e'), 'iphone-18-pro': ('iphone', 'iPhone 18 Pro'),
    'iphone-18-pro-max': ('iphone', 'iPhone 18 Pro Max'), 'iphone-duo': ('iphone', 'iPhone Duo'),
    'ipad-air-11-m4': ('ipad', 'iPad Air 11-inch (M4)'), 'ipad-air-13-m4': ('ipad', 'iPad Air 13-inch (M4)'),
    'family-imac--blue': ('mac', 'iMac 24-inch, blue'), 'family-macbook-pro--silver': ('mac', 'MacBook Pro, silver'),
    'device-airpods': ('airpods', 'AirPods'), 'device-airpods-pro': ('airpods', 'AirPods Pro'),
    'device-airpods-max': ('airpods', 'AirPods Max'), 'device-apple-tv': ('other', 'Apple TV'),
    'device-homepod': ('other', 'HomePod'), 'device-vision-pro': ('other', 'Apple Vision Pro'),
    'models/airpods-3': ('airpods', 'AirPods (3rd gen)'), 'models/airpods-pro-2': ('airpods', 'AirPods Pro 2'),
    'models/airpods-pro-3': ('airpods', 'AirPods Pro 3'), 'models/homepod-mini': ('other', 'HomePod mini'),
    'models/apple-tv-4k-2': ('other', 'Apple TV 4K'),
}
BACK_FLOOR = re.compile(r'^iphone-(1[2-9])')       # ad-backs: iPhone 12 and later
CATEGORY = {'iphone': 'iphones', 'ipad': 'ipads', 'mac': 'macbooks', 'watch': 'watch', 'airpods': 'airpods', 'other': 'electronics'}

def sha12(b): return hashlib.sha1(b).hexdigest()[:12]

def band_loops(near, bg):
    """White ground seen THROUGH a watch band: enclosed, pure, large, and to
    the right of the case (Apple shoots the case left, the band loop right).
    A white dial sits inside the case, left of centre, and is kept."""
    H, W = near.shape
    core = np.asarray(Image.fromarray((near & ~bg).astype(np.uint8) * 255, 'L').filter(ImageFilter.MinFilter(5))) > 127
    lab = Image.fromarray(core.astype(np.uint8) * 255, 'L').copy()
    out = np.zeros_like(near)
    ys, xs = np.nonzero(core)
    for y, x in zip(ys[::97], xs[::97]):
        if lab.getpixel((int(x), int(y))) != 255: continue
        ImageDraw.floodfill(lab, (int(x), int(y)), 100, thresh=0)
        comp = np.asarray(lab) == 100
        cy, cx = np.nonzero(comp)
        if comp.sum() > 0.004 * H * W and cx.mean() > 0.55 * W:
            out |= comp
        lab.paste(0, mask=Image.fromarray(comp.astype(np.uint8) * 255, 'L'))
    # grow back what the erosion took, but only over near-white pixels
    grown = np.asarray(Image.fromarray(out.astype(np.uint8) * 255, 'L').filter(ImageFilter.MaxFilter(7))) > 127
    return grown & near

def cut_white(im, loops=False):
    """RGB on a white ground -> RGBA, edge solved against the white."""
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    H, W, _ = rgb.shape
    near = (rgb.min(axis=2) >= 250).astype(np.uint8) * 255
    # pad one white pixel round the frame so a single flood reaches every border region
    # .copy(): an image made by fromarray shares numpy's read-only buffer, and
    # floodfill on it silently does nothing
    m = Image.fromarray(np.pad(near, 1, constant_values=255), 'L').copy()
    ImageDraw.floodfill(m, (0, 0), 128, thresh=0)
    bg = (np.asarray(m)[1:-1, 1:-1] == 128)
    if loops: bg |= band_loops(near > 0, bg)
    fg = Image.fromarray((~bg).astype(np.uint8) * 255, 'L')
    fg = fg.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))   # mend edge bites
    # JPEG blocks make a pale edge that fades into the white stair-step; a
    # small blur before the threshold rounds the silhouette back off
    fg = np.asarray(fg.filter(ImageFilter.GaussianBlur(1.6))) > 127
    bgd = np.asarray(Image.fromarray((~fg).astype(np.uint8) * 255, 'L').filter(ImageFilter.MaxFilter(5))) > 127
    band = fg & bgd                      # foreground within 2px of the ground
    inner = fg & ~band
    F = np.where(inner[..., None], rgb, 0).astype(np.float32)
    known = inner.copy()
    for _ in range(6):                   # carry interior colour outward into the band
        acc = np.zeros_like(F); cnt = np.zeros((H, W), np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if not dy and not dx: continue
                k = np.roll(np.roll(known, dy, 0), dx, 1); f = np.roll(np.roll(F, dy, 0), dx, 1)
                acc += f * k[..., None]; cnt += k
        fill = band & ~known & (cnt > 0)
        F[fill] = acc[fill] / cnt[fill][:, None]; known |= fill
    F[band & ~known] = rgb[band & ~known]
    d = 255.0 - F
    k = d.argmax(axis=2)
    dk = np.take_along_axis(d, k[..., None], 2)[..., 0]
    ck = np.take_along_axis(rgb, k[..., None], 2)[..., 0]
    a = np.clip((255.0 - ck) / np.maximum(dk, 28.0), 0, 1)
    alpha = np.where(inner, 1.0, np.where(band, a, 0.0))
    out = np.where(band[..., None], F, rgb)
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def trim(im):
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    return im.crop(bb) if bb else im

def encode(im):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=90, method=6, exact=True); return b.getvalue()

def plan():
    jobs = []                                   # (slug, image, line, model, name, colour, source, action)
    def add_jpg(dirname, table, line):
        d = find(dirname)
        if not d: return
        for f in sorted(os.listdir(d)):
            stem, ext = os.path.splitext(f)
            if ext.lower() not in ('.jpg', '.jpeg', '.png'): continue
            for pat, model, name in table:
                mm = re.match(pat, stem)
                if not mm: continue
                g = mm.groups(); col = colour(g[-1]); head = g[:-1]
                model_s = model.format(*head); name_s = name.format(*[h.upper() if h.startswith('m') else h for h in head])
                src = os.path.join(d, f)
                jobs.append(('qs-' + model_s + '--' + col, lambda s=src, w=(line == 'watch'): trim(cut_white(Image.open(s), loops=w)), line, model_s, name_s, col, dirname + '/' + f, 'new'))
                break
    add_jpg('ipad', IPAD, 'ipad'); add_jpg('mac', MAC, 'mac'); add_jpg('watch', WATCH, 'watch')

    dv = find('devices')
    if dv:
        for key, (line, name) in DEVICES_NEW.items():
            p = os.path.join(dv, key + '.webp')
            if os.path.exists(p):
                slug = 'qs-' + key.split('/')[-1]
                jobs.append((slug, lambda s=p: trim(Image.open(s).convert('RGBA')), line, slug[3:], name, None, 'devices/' + key + '.webp', 'new'))
        for f in sorted(os.listdir(dv)):
            if not f.endswith('.webp'): continue
            stem = f[:-5]; old = os.path.join(CUT, 'qs-' + stem + '.webp')
            if not os.path.exists(old) or 'watch' in stem: continue
            new = trim(Image.open(os.path.join(dv, f)).convert('RGBA')); o = Image.open(old)
            ra, rb = new.width / new.height, o.width / o.height
            if new.width >= o.width * 1.04 and abs(ra - rb) / rb < 0.03:
                jobs.append(('qs-' + stem, lambda n=new: n, None, stem, None, None, 'devices/' + f, 'upgrade %dx%d -> %dx%d' % (o.width, o.height, new.width, new.height)))
    ab = find('ad-backs')
    if ab:
        man = {b['key']: b for b in json.load(open(os.path.join(ab, 'manifest.json')))['backs']}
        for f in sorted(os.listdir(ab)):
            if not f.endswith('.webp') or not BACK_FLOOR.match(f): continue
            key = f[:-5]; model, col = key.split('--'); b = man.get(key, {})
            jobs.append(('qs-' + model + '-back--' + col, lambda s=os.path.join(ab, f): trim(Image.open(s).convert('RGBA')),
                         'iphone', model, (b.get('model') or model) + ', back', col, 'ad-backs/' + f, 'new'))
    return jobs

def sheet(items, path, ground):
    cw, ch, cols = 220, 240, 8
    rows = (len(items) + cols - 1) // cols
    S = Image.new('RGB', (cw * cols, (ch + 16) * rows), ground); d = ImageDraw.Draw(S)
    for i, (slug, im) in enumerate(items):
        t = im.copy(); t.thumbnail((cw - 12, ch - 12))
        x, y = (i % cols) * cw, (i // cols) * (ch + 16)
        S.paste(t, (x + (cw - t.width) // 2, y + (ch - t.height) // 2), t)
        d.text((x + 4, y + ch), slug[3:][:34], fill=(255, 255, 255) if sum(ground) < 380 else (0, 0, 0))
    S.save(path)

if __name__ == '__main__':
    if not SRC: sys.exit(__doc__)
    jobs = plan()
    built = [(j, j[1]()) for j in jobs]
    print('%d files: %d new, %d upgrades' % (len(built), sum(1 for j, _ in built if j[7] == 'new'), sum(1 for j, _ in built if j[7] != 'new')))
    for j, im in built:
        if j[7] != 'new': print('  ' + j[0] + '  ' + j[7])
    shots = os.environ.get('SHEETS')
    if shots:
        sheet([(j[0], im) for j, im in built], os.path.join(shots, 'import-dark.png'), (18, 18, 20))
        sheet([(j[0], im) for j, im in built], os.path.join(shots, 'import-light.png'), (236, 233, 227))
    if not WRITE:
        print('(dry run; pass --write)'); sys.exit(0)

    lib_p = os.path.join(ROOT, 'assets', 'library.json'); lib = json.load(open(lib_p))
    by = {a['slug']: a for a in lib['assets']}
    ap_p = os.path.join(ROOT, 'assets', 'approved-assets.json'); ap = json.load(open(ap_p))
    grid = ap['asset-grid-v1']; approved = set(grid['approved']); rejected = set(grid.get('reasonById', {}))
    for j, im in built:
        slug, _, line, model, name, col, src, action = j
        data = encode(im)
        open(os.path.join(CUT, slug + '.webp'), 'wb').write(data)
        e = by.get(slug)
        if not e:
            e = {'slug': slug, 'file': slug + '.webp', 'kind': 'cutout', 'category': CATEGORY[line],
                 'prompt': NOTE + ' (' + src + ')', 'source': 'ingested', 'url': 'assets/cutouts/' + slug + '.webp'}
            lib['assets'].append(e); by[slug] = e
        e.update({'w': im.width, 'h': im.height, 'bytes': len(data), 'sha1': sha12(data)})
        if action == 'new' and slug not in rejected: approved.add(slug)
    lib['count'] = len(lib['assets']); lib['built'] = int(time.time())
    with open(lib_p, 'w') as f: json.dump(lib, f, indent=1)   # the files' own format: indent 1, no final newline
    grid['approved'] = sorted(approved)
    with open(ap_p, 'w') as f: json.dump(ap, f, indent=1)
    print('wrote %d cutouts; library %d assets; %d approved' % (len(built), lib['count'], len(approved)))
    # the device catalogue is rebuilt from the library, so it names only art that exists
    import subprocess
    subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'device_catalog.py')], check=True)
