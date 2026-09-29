#!/usr/bin/env python3
"""The device catalogue: every approved device cut-out, by model and finish.

Owner, 2026-09-27: "once a theme is perfect we can make unlimited variations
for all types of devices specifically." A variation needs to know, for any
device the shop buys: what to call it in a headline, which cut-out shows it,
and which finish answers a palette. This builds that from the library itself
(approved qs- cut-outs), so it can never name art that is not there.

  models[key] = {
    line      iphone | ipad | mac | watch | airpods | other
    family    the headline name, short enough to set large (IPAD AIR)
    name      the full name (iPad Air 13-inch (M4))
    art       the model shot (front and back, or the device alone), if any
    colours   { finish: { slug, hex } }; hex is the finish as measured on the
              cut-out's own pixels, so a palette can pick the nearest one
  }

usage: python3 scripts/device_catalog.py      -> assets/devices.json
"""
import json, os, re
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CUT = os.path.join(ROOT, 'assets', 'cutouts')
approved = json.load(open(os.path.join(ROOT, 'assets', 'approved-assets.json')))['asset-grid-v1']['approved']

# sheet art is named by product line and year; map it onto the model keys
SHEET = [
    (r'^watch-(s\d+|se\d?|ultra\d?)-\d{4}$', lambda m: 'watch-' + m.group(1)),
    (r'^imac-24-(m\d)-\d{4}$',               lambda m: 'imac-24-' + m.group(1)),
    (r'^mba-(13|15)-(m\d)-\d{4}$',           lambda m: 'macbook-air-%s-%s' % (m.group(1), m.group(2))),
    (r'^mbp-(13|14|16)-(m\d(?:pro)?)-\d{4}$', lambda m: 'macbook-pro-%s-%s' % (m.group(1), m.group(2))),
    (r'^mbp-(14|16)-\d{4}$',                 lambda m: 'macbook-pro-%s-%s' % (m.group(1), m.group(0)[-4:])),
    (r'^mbneo-13-a18pro-\d{4}$',             lambda m: 'macbook-neo-13'),
    (r'^macmini-(m\d(?:pro)?)-\d{4}$',       lambda m: 'mac-mini-' + m.group(1)),
    (r'^macstudio-(\d{4})$',                 lambda m: 'mac-studio-' + m.group(1)),
]
DEVICE = {'device-imac': 'imac', 'device-mac-studio': 'mac-studio', 'device-macbook-air': 'macbook-air',
          'device-macbook-pro': 'macbook-pro', 'device-airpods': 'airpods', 'device-airpods-pro': 'airpods-pro',
          'device-airpods-max': 'airpods-max', 'device-apple-tv': 'apple-tv', 'device-homepod': 'homepod',
          'device-vision-pro': 'vision-pro', 'family-imac--blue': None, 'family-macbook-pro--silver': None}

def line_of(k):
    for pre, line in (('iphone', 'iphone'), ('ipad', 'ipad'), ('watch', 'watch'), ('airpods', 'airpods'),
                      ('imac', 'mac'), ('macbook', 'mac'), ('mac-', 'mac')):
        if k.startswith(pre): return line
    return 'other'

def family_of(k):
    """the headline name: short enough to set at display size"""
    m = re.match(r'^iphone-(\d+)(e)?(-(pro|air|plus|mini|duo))?', k)
    if m: return 'IPHONE ' + m.group(1) + (m.group(2) or '').upper() + (' PRO' if m.group(4) == 'pro' else ' AIR' if m.group(4) == 'air' else '')
    if k.startswith('iphone-duo'): return 'IPHONE DUO'
    for pre, fam in (('ipad-air', 'IPAD AIR'), ('ipad-pro', 'IPAD PRO'), ('ipad-mini', 'IPAD MINI'), ('ipad', 'IPAD'),
                     ('macbook-air', 'MACBOOK AIR'), ('macbook-pro', 'MACBOOK PRO'), ('macbook-neo', 'MACBOOK NEO'),
                     ('imac', 'IMAC'), ('mac-studio', 'MAC STUDIO'), ('mac-mini', 'MAC MINI'),
                     ('watch-ultra', 'WATCH ULTRA'), ('watch', 'APPLE WATCH'), ('airpods-max', 'AIRPODS MAX'),
                     ('airpods-pro', 'AIRPODS PRO'), ('airpods', 'AIRPODS'), ('homepod', 'HOMEPOD'),
                     ('apple-tv', 'APPLE TV'), ('vision-pro', 'VISION PRO')):
        if k.startswith(pre): return fam
    return k.upper().replace('-', ' ')

def name_of(k):
    w = k.split('-')
    chip = lambda s: s.upper().replace('PRO', ' Pro').replace('A18 Pro', 'A18 Pro')
    if w[0] == 'iphone':
        return 'iPhone ' + ' '.join(x.capitalize() if not x[0].isdigit() else x for x in w[1:]).replace('Duo', 'Duo')
    if w[0] == 'ipad':
        m = re.match(r'^ipad-(air|pro|mini)?-?(.*)$', k); kind, rest = m.group(1), m.group(2)
        base = 'iPad' + (' ' + (kind if kind == 'mini' else kind.capitalize()) if kind else '')
        m2 = re.match(r'^(11|13)-(m\d)$', rest)
        if m2: return '%s %s-inch (%s)' % (base, m2.group(1), m2.group(2).upper())
        m2 = re.match(r'^12-9-(\d)(st|nd|rd|th)-gen$', rest)
        if m2: return '%s 12.9-inch (%s%s gen)' % (base, m2.group(1), m2.group(2))
        if rest == '7-a17-pro': return base + ' (A17 Pro)'
        if rest == '11-a16': return base + ' (A16)'
        return (base + ' ' + rest.replace('-', ' ')).strip()
    m = re.match(r'^macbook-(air|pro|neo)(?:-(\d+))?(?:-(.+))?$', k)
    if m:
        s = 'MacBook ' + m.group(1).capitalize() + (' %s-inch' % m.group(2) if m.group(2) else '')
        if m.group(3): s += ' (%s)' % (m.group(3) if m.group(3).isdigit() else chip(m.group(3)))
        return s
    m = re.match(r'^imac-24-(m\d)$', k)
    if m: return 'iMac 24-inch (%s)' % m.group(1).upper()
    m = re.match(r'^watch-(s(\d+)|se(\d)?|ultra(\d)?)$', k)
    if m:
        if m.group(2): return 'Apple Watch Series ' + m.group(2)
        if m.group(1).startswith('se'): return 'Apple Watch SE' + (' ' + m.group(3) if m.group(3) else '')
        return 'Apple Watch Ultra' + (' ' + m.group(4) if m.group(4) else '')
    return {'airpods': 'AirPods', 'airpods-pro': 'AirPods Pro', 'airpods-max': 'AirPods Max', 'airpods-3': 'AirPods (3rd gen)',
            'airpods-pro-2': 'AirPods Pro 2', 'airpods-pro-3': 'AirPods Pro 3', 'homepod': 'HomePod', 'homepod-mini': 'HomePod mini',
            'apple-tv': 'Apple TV', 'apple-tv-4k-2': 'Apple TV 4K', 'vision-pro': 'Apple Vision Pro', 'imac': 'iMac',
            'mac-studio': 'Mac Studio', 'macbook-air': 'MacBook Air', 'macbook-pro': 'MacBook Pro'}.get(k, k)

def swatches(slugs):
    """Each finish as seen on the BODY, not the screen. A model's finishes are
    shot identically, so the pixels that stay the same across them are the
    shared wallpaper and the ones that change are the device; of those, the
    band just inside the silhouette is the frame, chin, stand or back edge.
    The first version took the median of every coloured pixel and read the
    wallpaper: all five MacBook Air finishes measured the same blue."""
    ims = [Image.open(os.path.join(CUT, s + '.webp')).convert('RGBA') for s in slugs]
    W, H = ims[0].size; sc = min(1.0, 240 / max(W, H)); W, H = max(8, int(W * sc)), max(8, int(H * sc))
    arr = np.stack([np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float32) for im in ims])
    solid = (arr[..., 3] > 200).all(axis=0)
    k = max(3, int(0.06 * min(W, H))) | 1
    inner = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * k + 1))) > 127
    band = solid & ~inner
    varies = arr[..., :3].std(axis=0).sum(axis=-1) > 18 if len(slugs) > 1 else solid
    for m in (band & varies, varies & solid, band, solid):
        if m.sum() >= 40: break
    return ['#%02x%02x%02x' % tuple(int(v) for v in np.median(a[..., :3][m], axis=0)) for a in arr]

def build():
    models = {}
    def get(k):
        return models.setdefault(k, {'line': line_of(k), 'family': family_of(k), 'name': name_of(k), 'colours': {}})
    for slug in sorted(approved):
        if not slug.startswith('qs-') or slug.startswith(('qs-set-', 'qs-cat-')): continue
        if not os.path.exists(os.path.join(CUT, slug + '.webp')): continue
        s = slug[3:]
        if s in DEVICE:
            if DEVICE[s]: get(DEVICE[s]).setdefault('art', slug)
            continue
        if s.startswith('family-'): continue
        if s.startswith('sheet-'):
            for pat, fn in SHEET:
                m = re.match(pat, s[6:])
                if m: get(fn(m)).setdefault('art', slug); break
            continue
        if '--' in s:
            base, fin = s.split('--', 1)
            base = base[:-5] if base.endswith('-back') else base
            get(base)['colours'][fin] = {'slug': slug}
        else:
            get(s)['art'] = slug
    for m in models.values():
        fins = list(m['colours'])
        if fins:
            for f, hx in zip(fins, swatches([m['colours'][f]['slug'] for f in fins])): m['colours'][f]['hex'] = hx
    return dict(sorted(models.items()))

if __name__ == '__main__':
    models = build()
    out = {'about': ('Every device the shop buys, by model and finish, from the approved cut-outs in assets/cutouts. '
                     'Written by scripts/device_catalog.py. family is the headline name; hex is each finish as measured '
                     'on its own cut-out, for picking the finish that answers a palette.'),
           'models': models}
    with open(os.path.join(ROOT, 'assets', 'devices.json'), 'w') as f: json.dump(out, f, indent=1)
    lines = {}
    for m in models.values(): lines[m['line']] = lines.get(m['line'], 0) + 1
    print('%d models, %d finishes · %s' % (len(models), sum(len(m['colours']) for m in models.values()), json.dumps(lines)))
