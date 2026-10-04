#!/usr/bin/env python3
"""Generate candidate ad backdrops (product photography on designed grounds).

A ground-style system (20 styles) x a layout system (14 layouts) x 25 palettes,
planned per category so that no two images in a category share
(style, layout) or (palette, layout) and neighbours differ.  Deterministic.

The palettes (scripts/backdrop_palettes.json), since 2026-10-04: the site's twelve
proven pairs (scripts/refresh_palettes.mjs: navy and gold, black and red ...) and
eight more of people's favourite combinations, two or three colours each (royal
blue and white, red white and blue, pink and navy, teal and coral, burgundy and
gold ...); no lime, olive or mint (owner: "baby barf green is just not the best
color ... I want proven variety"). Each is a dark, mid and light ground, an
accent and a support colour.  Output goes to .render/backdrops/ unless --out.

Usage:  python3 scripts/gen_backdrops.py [--out DIR] [--palettes FILE]
                                          [--only cat[,cat]] [--limit N] [--jobs 4]
"""
import argparse, json, math, os, sys, time, zlib
from collections import Counter, OrderedDict
from multiprocessing import Pool

import numpy as np
import cv2
from PIL import Image

cv2.setNumThreads(1)
F = np.float32
W = H = 1080
SEED = 20260930
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(REPO, 'assets', 'cutouts')
DEFAULT_OUT = os.path.join(REPO, '.render', 'backdrops')

# ----------------------------------------------------------------------------- colour

def s2l(c):
    c = np.asarray(c, F)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(F)

def l2s(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055).astype(F)

def hex2lin(h):
    h = h.lstrip('#')
    return s2l(np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], F) / 255)

_M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                [0.2119034982, 0.6806995451, 0.1073969566],
                [0.0883024619, 0.2817188376, 0.6299787005]], F)
_M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
                [1.9779984951, -2.4285922050, 0.4505937099],
                [0.0259040371, 0.7827717662, -0.8086757660]], F)
_M1i = np.linalg.inv(_M1).astype(F)
_M2i = np.linalg.inv(_M2).astype(F)

def lin2lab(c):
    return (np.cbrt(np.maximum(np.asarray(c, F) @ _M1.T, 0))) @ _M2.T

def lab2lin(l):
    return np.clip(((np.asarray(l, F) @ _M2i.T) ** 3) @ _M1i.T, 0, 1.2).astype(F)

def labmix(a, b, t):
    """OKLab mix with chroma interpolation (no grey midpoints)."""
    a = np.asarray(a, F); b = np.asarray(b, F)
    m = a * (1 - t) + b * t
    ca, cb = math.hypot(a[1], a[2]), math.hypot(b[1], b[2])
    ct = ca * (1 - t) + cb * t
    c = math.hypot(m[1], m[2])
    hd = abs(math.atan2(a[2], a[1]) - math.atan2(b[2], b[1]))
    hd = min(hd, 2 * math.pi - hd)
    if c > 1e-5 and (hd < 1.6 or min(ca, cb) < 0.03):
        s = min(max(ct / c, 1.0), 2.0)
        m[1:] *= s
    return m

def tint(lab, L, cs):
    """same hue as lab, lightness L, chroma scaled by cs"""
    lab = np.array(lab, F); out = lab.copy(); out[0] = L; out[1:] = lab[1:] * cs; return out

def lighten(lab, dl):
    lab = np.array(lab, F); lab[0] = np.clip(lab[0] + dl, 0, 1); return lab

def lum(c):
    return float(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])

# ----------------------------------------------------------------------------- helpers

PX = (np.arange(W, dtype=F) + 0.5)
XX, YY = np.meshgrid(PX, PX)
xn, yn = XX / W, YY / H

def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def gblur(img, s):
    if s <= 0.05:
        return img
    if s > 24:
        k = 4
        h, w = img.shape[:2]
        sm = cv2.resize(img, (w // k, h // k), interpolation=cv2.INTER_AREA)
        sm = cv2.GaussianBlur(sm, (0, 0), s / k)
        return cv2.resize(sm, (w, h), interpolation=cv2.INTER_LINEAR)
    return cv2.GaussianBlur(img, (0, 0), s)

def vnoise(rng, cells, size=W):
    g = rng.standard_normal((cells + 4, cells + 4)).astype(F)
    big = cv2.resize(g, ((cells + 4) * size // cells,) * 2, interpolation=cv2.INTER_CUBIC)
    o = size * 2 // cells
    return big[o:o + size, o:o + size]

def fbm(rng, cells=3, octaves=4, gain=0.5):
    out = np.zeros((H, W), F); amp = 1.0; tot = 0
    for i in range(octaves):
        out += amp * vnoise(rng, cells * 2 ** i); tot += amp; amp *= gain
    out /= tot
    return (out / (out.std() + 1e-6)).astype(F)

def paint(stops):
    """stops: [(lab, weight-map or scalar)] -> linear rgb image, chroma preserving."""
    wsum = np.zeros((H, W), F) + 1e-6
    lab = np.zeros((H, W, 3), F)
    ct = np.zeros((H, W), F)
    for c, w in stops:
        c = np.asarray(c, F)
        w = np.broadcast_to(np.asarray(w, F), (H, W))
        wsum += w
        lab += w[..., None] * c
        ct += w * math.hypot(c[1], c[2])
    lab /= wsum[..., None]; ct /= wsum
    cc = np.hypot(lab[..., 1], lab[..., 2])
    sc = np.clip(ct / np.maximum(cc, 1e-5), 1.0, 2.0)
    lab[..., 1] *= sc; lab[..., 2] *= sc
    return lab2lin(lab)

def lerp(a, b, t):
    if np.ndim(t) == 2:
        t = t[..., None]
    return a + (b - a) * t

def screen(img, add):
    return 1 - (1 - np.clip(img, 0, 1)) * (1 - np.clip(add, 0, 1))

def gauss2(cx, cy, sx, sy=None):
    sy = sx if sy is None else sy
    return np.exp(-(((XX - cx) / sx) ** 2 + ((YY - cy) / sy) ** 2) * 0.5).astype(F)

# ----------------------------------------------------------------------------- palettes

DARK_ONLY = {'Green & Gold', 'Black & Green', 'Blue & Green'}

def muddy(lab):
    """a warm colour too dark to stay clean: orange goes rust, gold mustard, yellow and
    lime olive (scripts/refresh_palettes.mjs muddy(), its luminance thresholds as
    OKLab lightness)"""
    if math.hypot(lab[1], lab[2]) < 0.04: return False
    h = math.degrees(math.atan2(lab[2], lab[1])) % 360
    t = 0.49 if 35 <= h < 45 else 0.585 if 45 <= h < 65 else 0.69 if 65 <= h < 105 else \
        0.67 if 105 <= h < 120 else 0.60 if 120 <= h < 140 else 0
    return lab[0] < t

class Pal:
    def __init__(self, p, dark):
        self.name = p['name']; self.dark = dark
        L = {k: lin2lab(hex2lin(p[k])) for k in ('dark', 'mid', 'light', 'accent', 'support')}
        self.raw = L
        white = lin2lab(np.ones(3, F))
        if dark:
            accs = tint(L['accent'], min(L['dark'][0] + 0.16, L['accent'][0]), 0.75)
            sups = tint(L['support'], min(L['dark'][0] + 0.14, L['support'][0]), 0.7)
            # a warm glow that dark turns muddy takes the ground's own hue (owner: "baby barf green")
            if muddy(accs): accs = tint(L['mid'], accs[0], 0.95)
            if muddy(sups): sups = tint(L['mid'], sups[0], 0.85)
            t = dict(base=L['dark'], base2=labmix(L['dark'], L['mid'], 0.30),
                     deep=lighten(L['dark'], -0.07), hi=labmix(L['dark'], L['mid'], 0.62),
                     acc=L['accent'], sup=L['support'], accs=accs, sups=sups,
                     mid=L['mid'], light=L['light'])
        else:
            t = dict(base=L['light'], base2=labmix(L['light'], L['mid'], 0.20),
                     deep=labmix(L['light'], L['mid'], 0.50), hi=labmix(L['light'], white, 0.5),
                     acc=L['accent'], sup=L['support'],
                     accs=tint(L['accent'], L['light'][0] - 0.05, 0.42), sups=tint(L['support'], L['light'][0] - 0.03, 0.45),
                     mid=L['mid'], light=L['light'], dk=L['dark'])
        self.t = t
        self.lin = {k: lab2lin(v) for k, v in t.items()}
        d = hex2lin(p['dark'])
        self.shadow = np.clip(d / max(d.max(), 1e-3) * (0.30 if dark else 0.42), 0.02, 1).astype(F)

# ----------------------------------------------------------------------------- items

def I(name, cut='', rot=6, kind='', role='s'):
    return dict(name=name, cut=cut, rot=rot, kind=kind, role=role)

QS_BACKS = ['qs-iphone-12-back--blue', 'qs-iphone-12-back--green', 'qs-iphone-12-back--purple', 'qs-iphone-12-back--white',
            'qs-iphone-12-pro-back--gold', 'qs-iphone-12-pro-back--graphite', 'qs-iphone-12-pro-back--pacific-blue',
            'qs-iphone-13-back--blue', 'qs-iphone-13-back--green', 'qs-iphone-13-back--midnight', 'qs-iphone-13-back--pink',
            'qs-iphone-13-back--starlight', 'qs-iphone-13-pro-back--alpine-green', 'qs-iphone-13-pro-back--gold',
            'qs-iphone-13-pro-back--graphite', 'qs-iphone-13-pro-back--sierra-blue', 'qs-iphone-16-back--black',
            'qs-iphone-16-back--pink', 'qs-iphone-16-back--teal', 'qs-iphone-16-back--ultramarine', 'qs-iphone-16-back--white',
            'qs-iphone-16-plus-back--white', 'qs-iphone-16e-back--black', 'qs-iphone-16e-back--white',
            'qs-iphone-17e-back--black', 'qs-iphone-17e-back--soft-pink', 'qs-iphone-17e-back--white']
# 2026-10-03 (owner: "iPhone 2020+"): every model we buy, the iPhone 12 (2020)
# on; the 11 and 11 Pro Max (2019) are out. No SE: there is no Apple picture of it.
QS_PAIRS = ['qs-iphone-12-mini', 'qs-iphone-12', 'qs-iphone-12-pro', 'qs-iphone-12-pro-max', 'qs-iphone-13-mini',
            'qs-iphone-13', 'qs-iphone-13-pro', 'qs-iphone-13-pro-max', 'qs-iphone-14', 'qs-iphone-14-plus',
            'qs-iphone-14-pro', 'qs-iphone-14-pro-max', 'qs-iphone-15', 'qs-iphone-15-plus', 'qs-iphone-15-pro',
            'qs-iphone-15-pro-max', 'qs-iphone-16', 'qs-iphone-16-plus', 'qs-iphone-16-pro', 'qs-iphone-16-pro-max',
            'qs-iphone-16e', 'qs-iphone-17', 'qs-iphone-17-air', 'qs-iphone-17-pro', 'qs-iphone-17-pro-max', 'qs-iphone-17e']
# 2026-10-01 audit (owner: "doesn't have an Apple logo", "looks like a fake
# Samsung"): only photographs of a real iPhone back WITH the logo. Out: the
# ip-gen14/15/16 and ip-angle renders (no logo), ip-gen15-back-green (a
# camera layout no iPhone has), the edge-on ip-gen13-back-blue and plateau
# shots, iphone-15-pro-back-gold (no logo), the iPhone 18 and duo concepts.
IP_PHOTO = ['ip-gen13-pro-back-graphite', 'iphone-15-pro-back-blue']   # the white 15 Pro shot is angled: it reads small beside the flat renders
# 2026-10-03 (owner: "As much modern apple imagery as you can"): real devices
# photographed on Commons (scripts/cut_vehicle_photos.py), with their logos
IP_PHOTO += ['photo-iphone-13-pro-graphite', 'photo-iphone-14-pro-deep-purple', 'photo-iphone-14-red',
             'photo-iphone-15-black', 'photo-iphone-17-pro-silver']
APPLE_PHOTO = {'ipad': ['photo-ipad-a16-pink', 'photo-ipad-air-m2-blue', 'photo-ipad-mini-6-blue'],
               'macbook': ['photo-macbook-air-15-starlight', 'photo-macbook-air-m1-silver',
                           'photo-macbook-air-m1-space-gray', 'photo-macbook-air-m2-starlight', 'photo-macbook-air-m2-lid'],
               'mac': ['photo-mac-studio-angle']}

# 2026-10-04 (owner: "use the video engine ... full angles of every device", "work
# within 15° increments"): every phone the video maker draws (motion/phones, the
# finishes Apple photographed), back and screen, flat and turned 15, 30 and 45
# degrees either way, rendered by scripts/render_phone_views.mjs
_MOTION = {m['id']: m for m in json.load(open(os.path.join(REPO, 'motion', 'phones', 'index.json')))['phones']}
VIEW = OrderedDict()
for _f in sorted(os.listdir(os.path.join(REPO, 'assets', 'cutouts'))):
    if _f.startswith('view-') and _f.endswith('.webp'):
        _n = _f[:-5]; _ph, _v = _n[5:].split('--'); _side, _tag = _v.split('-')
        _deg = 0 if _tag == '0' else int(_tag[1:]) * (-1 if _tag[0] == 'l' else 1)
        _side, _, _wall = _side.partition('_')     # screen_<wallpaper>: the screen lit with it
        if _wall == 'field': continue              # a flat wash with one pool: on a phone it reads as a dead screen
        VIEW[_n] = dict(phone=_ph, model=_MOTION[_ph]['model'], finish=_MOTION[_ph]['finish'],
                        metal=_MOTION[_ph]['metal'], side=_side, deg=_deg, wall=_wall)
VIEW_ANGLES = [(sd, d) for sd in ('back', 'screen') for d in (0, -15, 15, -30, 30)]
# owner on a podium trio of iPhone 12s: "we should use the main models, red, orange,
# and glacier promax models"
HERO_TRIO = ['18-pro-max-burgundy', '17-pro-max-cosmic-orange', '18-pro-max-glacier']

POOLS = {
    'iphone': ([I(n, rot=12, kind='back') for n in QS_BACKS] +
               [I(n, rot=8, kind='view') for n, v in VIEW.items() if (v['side'], v['deg']) in VIEW_ANGLES] +
               [I(n, rot=8, kind='pair') for n in QS_PAIRS] +
               [I(n, rot=8, kind='photo') for n in IP_PHOTO]),
    'gold': [I('gold-bar-single', 'R', 6), I('gold-bracelet-cuban', rot=20), I('gold-class-ring', rot=10),
             I('gold-necklace-single', rot=20), I('gold-pocket-watch', rot=10), I('gold-nuggets-raw', rot=6),
             I('gold-bracelet-pair', rot=14), I('gold-coins-pile', rot=4), I('gold-earrings-pile', rot=12),
             I('gold-chains', rot=14), I('gold-bars', rot=4),
             I('gold-bars-fan', rot=5, role='h'), I('gold-bars-row', rot=3, role='h'), I('gold-bars-stack', 'R', 3, role='h'),
             I('gold-chains-pile', 'R', 4, role='h'), I('gold-jewelry-mixed', rot=4, role='h'), I('gold-scrap-mixed', rot=5, role='h')],
    'silver': [I('silver-bar-single', rot=8), I('silver-candlesticks', rot=3), I('silver-coins-tube', rot=5),
               I('silver-flatware', rot=12), I('silver-tea-set', rot=3), I('coin-silver-dollar-pair', rot=10),
               I('silver-coins-spill', rot=5), I('silver-bars', rot=5),
               I('silver-bars-row', rot=3, role='h'), I('silver-bars-stack', rot=3, role='h'),
               I('silver-flatware-set', rot=4, role='h'), I('silver-jewelry-mixed', 'R', 4, role='h'),
               I('silver-serving-tray', 'R', 4, role='h')],
    'coins': [I('coin-silver-dollar-pair', rot=12), I('coin-jar-full', rot=3), I('coin-rolls-paper', rot=5),
              I('coin-stack', rot=6), I('coin-graded-fan-three', rot=8), I('coin-slabs-stack', rot=8),
              I('coin-loose-pile', rot=5), I('gold-coins-pile', rot=5), I('silver-coins-tube', rot=5),
              I('silver-coins-spill', rot=5),
              I('coin-collection-tray', rot=6, role='h'), I('coin-album-pages', 'R', 5, role='h')],
    # 2026-10-02/03 (owner: "more popular cars and less bikes", "some trucks and
    # work vans", "semis"): only real vehicles, cut from Commons photographs by
    # scripts/cut_vehicle_photos.py (credits in assets/cutouts/ATTRIBUTION.json).
    # The sedan, SUV, pickup, van and motorcycle renders are gone. CAR_ROTA
    # picks which of these each car backdrop shows.
    'cars': [I(n, rot=1, kind='car') for n in (
                 'car-audi-rs5-sportback-red', 'car-audi-s5-white', 'car-bentley-bentayga-grey',
                 'car-bmw-1m-coupe-orange', 'car-bmw-2002-turbo-white', 'car-bmw-3-0-csl-beige', 'car-bmw-m3-blue',
                 'car-bmw-m3-competition-green', 'car-bmw-m3-csl-e46-grey', 'car-bmw-m3-touring-blue-rear',
                 'car-bmw-x5-black-rear', 'car-bmw-z8-silver', 'car-cadillac-escalade-black-rear',
                 'car-cadillac-escalade-v-white', 'car-chevy-camaro-1969-silver', 'car-chevy-corvette-z06-yellow',
                 'car-chevy-equinox-white', 'car-chevy-equinox-white-rear', 'car-chevy-silverado-red',
                 'car-chevy-silverado-zr2-red', 'car-chevy-tahoe-black', 'car-dodge-charger-orange',
                 'car-ford-bronco-1st-gen-cream', 'car-ford-bronco-blue', 'car-ford-bronco-sport-yellow-rear',
                 'car-ford-e-transit-custom-white-rear', 'car-ford-e350-white', 'car-ford-explorer-white',
                 'car-ford-f150-black', 'car-ford-f150-black-rear', 'car-ford-f150-lightning-black',
                 'car-ford-f150-raptor-2026-black', 'car-ford-f150-raptor-orange-rear', 'car-ford-f250-black',
                 'car-ford-maverick-red', 'car-ford-mustang-dark-horse-blue', 'car-ford-mustang-gt-yellow-rear',
                 'car-ford-mustang-mach1-grey-rear', 'car-ford-ranger-blue-rear', 'car-ford-ranger-wildtrak-orange',
                 'car-ford-transit-connect-white', 'car-ford-transit-courier-white',
                 'car-ford-transit-custom-silver-rear', 'car-freightliner-cascadia-blue',
                 'car-gmc-sierra-denali-grey', 'car-gmc-sierra-ev-grey-rear', 'car-harley-softail-black',
                 'car-honda-accord-2023-white-side', 'car-honda-accord-white', 'car-honda-accord-white-rear',
                 'car-honda-civic-type-r-blue', 'car-honda-civic-type-r-fl5-white', 'car-honda-civic-white',
                 'car-honda-crv-red-rear', 'car-honda-crv-silver', 'car-honda-nsx-na1-red', 'car-honda-pilot-white',
                 'car-honda-pilot-white-rear', 'car-honda-ridgeline-grey-rear', 'car-honda-ridgeline-white',
                 'car-honda-s2000-silver', 'car-hyundai-ioniq-9-white', 'car-hyundai-ioniq5-grey-rear',
                 'car-hyundai-ioniq5-silver-side', 'car-hyundai-sonata-black', 'car-hyundai-tucson-l-white-rear',
                 'car-hyundai-tucson-white', 'car-jeep-gladiator-green', 'car-jeep-gladiator-rubicon-red-side',
                 'car-jeep-grand-cherokee-l-silver', 'car-jeep-grand-wagoneer-white',
                 'car-jeep-wrangler-rubicon-2026-orange', 'car-jeep-wrangler-rubicon-lime', 'car-kia-k4-white',
                 'car-kia-k5-grey', 'car-kia-k5-silver-rear', 'car-kia-telluride-2026-silver-rear',
                 'car-kia-telluride-grey', 'car-lamborghini-temerario-yellow', 'car-lamborghini-urus-green',
                 'car-land-rover-defender-90-teal', 'car-ldv-maxus-van-white', 'car-lexus-is-white',
                 'car-lexus-rx-grey-rear', 'car-lexus-rx-white', 'car-lexus-rx-white-rear', 'car-mazda-cx5-blue',
                 'car-mercedes-190e-evo-black', 'car-mercedes-amg-g63-black', 'car-mercedes-amg-g63-yellow',
                 'car-mercedes-amg-gle63-silver', 'car-mercedes-g-class-orange', 'car-mercedes-s-class-black',
                 'car-mercedes-sprinter-white', 'car-nissan-frontier-grey', 'car-nissan-nv200-white',
                 'car-nissan-rogue-copper', 'car-nissan-skyline-gtr-r34-blue', 'car-peterbilt-389-white',
                 'car-peterbilt-579-red', 'car-porsche-356-blue', 'car-porsche-911-carrera-rs-orange',
                 'car-porsche-911-gt2-rs-white', 'car-porsche-911-gt3-blue', 'car-porsche-911-sport-classic-grey',
                 'car-porsche-918-spyder-white', 'car-porsche-carrera-gt-silver', 'car-ram-1500-black-rear',
                 'car-ram-1500-blue', 'car-ram-2500-power-wagon-white', 'car-ram-promaster-grey',
                 'car-range-rover-blue', 'car-rivian-r1s-grey-rear', 'car-rivian-r1s-silver',
                 'car-rivian-r1t-green-rear', 'car-rivian-r1t-white-rear', 'car-rolls-royce-cullinan-black',
                 'car-subaru-forester-silver', 'car-subaru-outback-red-rear', 'car-subaru-outback-white',
                 'car-tesla-cybertruck', 'car-tesla-cybertruck-cyberbeast', 'car-tesla-cybertruck-rear-street',
                 'car-tesla-model-3-performance-white-rear', 'car-tesla-model-3-white',
                 'car-tesla-model-s-plaid-white', 'car-tesla-model-x-silver', 'car-tesla-model-x-white-rear',
                 'car-tesla-model-y-red-side', 'car-tesla-model-y-white', 'car-toyota-4runner-green',
                 'car-toyota-4runner-trd-pro-lime', 'car-toyota-camry-2025-white-side', 'car-toyota-camry-silver',
                 'car-toyota-corolla-cross-silver-rear', 'car-toyota-corolla-white', 'car-toyota-gr-corolla-black',
                 'car-toyota-gr-supra-2026-red', 'car-toyota-gr-supra-grey-rear', 'car-toyota-highlander-silver',
                 'car-toyota-highlander-silver-rear', 'car-toyota-highlander-white-rear',
                 'car-toyota-land-cruiser-80-red', 'car-toyota-land-cruiser-fj40-green',
                 'car-toyota-prius-2026-grey', 'car-toyota-prius-grey-rear', 'car-toyota-prius-silver-rear',
                 'car-toyota-prius-white', 'car-toyota-rav4-2026-white-rear', 'car-toyota-rav4-white',
                 'car-toyota-sienna-white', 'car-toyota-supra-a80-silver', 'car-toyota-tacoma-orange',
                 'car-toyota-tacoma-trd-black-rear', 'car-toyota-tundra-trd-pro-blue',
                 'car-toyota-tundra-trd-pro-white-rear', 'car-volvo-vnl-blue')] +
            [I('car-wheel-tyre', rot=4, kind='acc'), I('car-title-keys', rot=10, kind='acc'),
             I('car-keys', rot=12, kind='acc'), I('car-title-docs', rot=6, kind='acc')],
    'strips': [I('strip-box-open-vials', rot=5), I('strip-boxes-fan', rot=6), I('strip-boxes-row-five', rot=3),
               I('strip-boxes', rot=20), I('strip-kit-meter', rot=6), I('strip-kit', rot=8), I('strip-meter-hand', rot=12),
               I('strip-vials-pile', rot=8)],
    'pokemon': [I('poke-psa-charizard', rot=22), I('poke-slab', rot=8),
                I('poke-booster', rot=8), I('poke-booster-box', rot=5), I('poke-booster-packs-fan', rot=6),
                I('poke-elite-box', 'B', 4, role='h'), I('poke-cards-fan', 'L', 4, role='h')],
    'sports': [I('ph-sports-card-baseball', rot=24), I('ph-sports-card-basketball', rot=24),
               I('ph-sports-card-football', rot=24), I('ph-sports-slab', rot=22),
               I('sports-slab', rot=8), I('sports-box-sealed', rot=5), I('ph-sports-box', rot=6),
               I('ph-sports-cards-fan', rot=6, role='h'), I('ph-sports-slabs-fan', rot=6, role='h')],
    'gaming': [I('console-single', rot=4), I('controller-pair', rot=10), I('game-console-pair', rot=3),
               I('gaming-handheld', rot=10), I('laptop-gaming-open', rot=4), I('console-handheld-pair', rot=6)],
    'audio': [I('buds-case-closed', rot=12), I('buds-overear-headphones', rot=8), I('buds-pair-loose', rot=8),
              I('airpods-buds-out', rot=8), I('airpods-case-open', rot=8), I('qs-device-airpods-max', rot=6),
              I('qs-airpods-3', rot=8), I('qs-airpods-pro-2', rot=8), I('qs-airpods-pro-3', rot=8),
              I('speaker-portable', rot=4), I('qs-homepod-mini', rot=3), I('qs-device-homepod', rot=2),
              I('pix-buds-case', rot=8), I('sam-buds-case', rot=8)],
    'computers': [I('mac-air-open-angle', rot=4), I('mac-closed-topdown', rot=10), I('mac-keyboard-topdown', rot=6),
                  I('mac-open-screen-on', rot=4), I('mac-pro-open-front', rot=3), I('macbook-open-angle', rot=4),
                  I('macbook-open-front', rot=3), I('mac-half-open-glow', rot=4), I('monitor-widescreen', rot=2),
                  I('keyboard-mouse-set', rot=6), I('laptop-windows-open', rot=3),
                  I('qs-device-mac-studio', rot=3), I('qs-device-imac', rot=2), I('qs-macbook-pro-16--silver', rot=4),
                  I('qs-macbook-pro-16--space-black', rot=4), I('qs-macbook-air-15--sky-blue', rot=4),
                  I('qs-macbook-air-15--midnight', rot=4), I('qs-macbook-air-15--starlight', rot=4),
                  I('qs-macbook-neo-13--blush', rot=4), I('qs-macbook-neo-13--citrus', rot=4),
                  I('qs-macbook-neo-13--indigo', rot=4), I('qs-imac-24-m4--blue', rot=2), I('qs-imac-24-m4--pink', rot=2),
                  I('qs-imac-24-m4--green', rot=2),
                  I('mac-stack-closed-three', rot=3, role='h'), I('macbook-closed-stack', rot=3, role='h'),
                  I('macbook-pair-open-closed', rot=3, role='h')],
    'wearables': [I('watch-screen-on', rot=12), I('watch-single-angle', rot=10), I('apple-watch-single', rot=10),
                  I('qs-watch-s11--aluminum-jet-black', rot=14), I('qs-watch-s11--aluminum-rose-gold', rot=14),
                  I('qs-watch-s11--aluminum-silver', rot=14), I('qs-watch-s11--aluminum-space-gray', rot=14),
                  I('qs-watch-s11--titanium-gold', rot=14), I('qs-watch-s11--titanium-natural', rot=14),
                  I('qs-watch-s11--titanium-slate', rot=14), I('qs-watch-ultra2--titanium-black', rot=14),
                  I('qs-watch-ultra--titanium-natural', rot=14), I('qs-watch-ultra3--titanium-natural', rot=14),
                  I('qs-watch-s10--titanium-gold', rot=14), I('vr-headset', rot=6), I('qs-device-vision-pro', rot=5),
                  I('pix-watch-round', 'B', 8), I('sam-watch-pair', rot=5),
                  I('watch-pair-bands', rot=5, role='h'), I('apple-watch-pair', rot=5, role='h'),
                  I('apple-watch-stack-three', rot=4, role='h')],
    'cameras': [I('camera-dslr-body', rot=6), I('camera-mirrorless', rot=6), I('drone-folded', rot=6)],
    # 2026-10-03 (owner: "iPad 2020+ Mac 2020+ Macbook 2020+"): Apple's own
    # pictures of every model we buy from 2020 on, in their colours
    'ipad': [I(n, rot=8) for n in (
        ['qs-ipad-8', 'qs-ipad-9', 'qs-ipad-10'] + ['qs-ipad-11-a16--' + c for c in ('blue', 'pink', 'silver', 'yellow')] +
        ['qs-ipad-air-4', 'qs-ipad-air-5'] +
        [f'qs-ipad-air-{sz}-{chip}--{c}' for sz in ('11', '13') for chip in ('m2', 'm3', 'm4')
         for c in ('blue', 'purple', 'space-gray', 'starlight')] +
        ['qs-ipad-mini-6'] + ['qs-ipad-mini-7-a17-pro--' + c for c in ('blue', 'purple', 'space-gray', 'starlight')] +
        ['qs-ipad-pro-12-9-4th-gen', 'qs-ipad-pro-12-9-5th-gen', 'qs-ipad-pro-12-9-6th-gen',
         'qs-ipad-pro-11-m4--silver', 'qs-ipad-pro-11-m4--space-black', 'qs-ipad-pro-13-m4--silver',
         'qs-ipad-pro-13-m4--space-black', 'qs-ipad-pro-11-m5', 'qs-ipad-pro-13-m5--silver', 'qs-ipad-pro-13-m5--space-black'])],
    'macbook': [I(n, rot=4) for n in (
        ['qs-sheet-mba-13-m1-2020', 'qs-sheet-mbp-13-m1-2020', 'qs-sheet-mbp-13-m2-2022'] +
        ['qs-macbook-air-13--' + c for c in ('midnight', 'silver', 'sky-blue', 'space-gray', 'starlight')] +
        ['qs-macbook-air-13-m5--' + c for c in ('midnight', 'silver', 'sky-blue', 'starlight')] +
        ['qs-macbook-air-15--' + c for c in ('midnight', 'silver', 'sky-blue', 'space-gray', 'starlight')] +
        ['qs-macbook-air-15-m5--' + c for c in ('midnight', 'silver', 'sky-blue', 'starlight')] +
        ['qs-macbook-neo-13--' + c for c in ('blush', 'citrus', 'indigo', 'silver')] +
        ['qs-macbook-pro-14--' + c for c in ('silver', 'space-black', 'space-gray')] +
        ['qs-macbook-pro-14-m5--' + c for c in ('silver', 'space-black')] +
        ['qs-macbook-pro-16--' + c for c in ('silver', 'space-black', 'space-gray')] +
        ['qs-macbook-pro-16-m5--' + c for c in ('silver', 'space-black')])],
    # Mac mini: the M1/M2 picture is a 49px strip and the front shot was rejected
    # by the owner ("featureless-angle"); the iPad Pro 11 4th gen too ("relic")
    'mac': [I(n, rot=2) for n in (
        ['qs-imac-24-m1--' + c for c in ('blue', 'green', 'orange', 'pink', 'purple', 'silver', 'yellow')] +
        ['qs-imac-24-m4--' + c for c in ('blue', 'green', 'orange', 'pink', 'purple', 'silver', 'yellow')] +
        ['qs-sheet-imac-24-m3-2023', 'qs-device-mac-studio', 'qs-sheet-macstudio-2022'])],
}
for _c, _ns in APPLE_PHOTO.items():
    POOLS[_c] += [I(n, rot=4) for n in _ns]

# 2026-10-04 (owner: "more variety?", other buy categories with the same real-photo
# treatment): photographs from Commons, cut by scripts/cut_vehicle_photos.py. A set of
# pieces (a coin's two faces, two watches) is a group, role 'h': shown alone or first.
REAL_PHOTO = {
    'gold': ['photo-gold-bracelet-filigree', 'photo-gold-bracelet-flat', 'photo-gold-chain-chunky',
        'photo-gold-double-eagle-1907', 'photo-gold-eagle-proof', 'photo-gold-krugerrand-obverse',
        'photo-gold-krugerrand-springbok', 'photo-gold-nugget'],
    'silver': ['photo-silver-eagle-obverse', 'photo-silver-eagle-reverse', 'photo-silver-morgan-1886',
        'photo-silver-maple-stack', 'photo-silver-tea-set-dark', 'photo-silver-tea-set-white',
        'photo-silver-tea-set-tray'],
    'coins': ['photo-coin-gold-eagle-obverse', 'photo-coin-gold-eagle-reverse', 'photo-coin-buffalo-nickel-stack',
        'photo-coin-indian-cent-1860', 'photo-coin-wheat-cent', 'photo-coin-wheat-cent-1944',
        'photo-coin-mercury-dime', 'photo-coin-mercury-dime-reverse', 'photo-coin-morgan-dollar',
        'photo-coin-morgan-dollar-reverse', 'photo-coin-pcgs-morgan', 'photo-coin-pcgs-falcon',
        'photo-coin-pcgs-gold-dollar', 'photo-coin-saint-gaudens-1933', 'photo-coin-album'],
    'sports': ['photo-sports-psa-1952'],
    'gaming': ['photo-gaming-dualsense-white', 'photo-gaming-dualsense-black', 'photo-gaming-switch2-docked',
        'photo-gaming-switch2', 'photo-gaming-switch-oled-docked', 'photo-gaming-switch-oled',
        'photo-gaming-ps5-black', 'photo-gaming-ps5-white', 'photo-gaming-steam-deck',
        'photo-gaming-xbox-series-x'],
    'audio': ['photo-audio-airpods-max-blue', 'photo-audio-airpods-max-silver', 'photo-audio-airpods-max-case',
        'photo-audio-airpods-max-grey', 'photo-audio-airpods-max-front', 'photo-audio-beats-fit-pro-case',
        'photo-audio-bose-qc25', 'photo-audio-jbl-go-red', 'photo-audio-jbl-go-red-dark',
        'photo-audio-sonos-play1'],
    'cameras': ['photo-camera-canon-100mm', 'photo-camera-canon-5d2', 'photo-camera-canon-5d2-front',
        'photo-camera-canon-r5', 'photo-camera-canon-r6', 'photo-camera-dji-mini-4-pro',
        'photo-camera-fujifilm-xt5', 'photo-camera-gopro', 'photo-camera-leica-q2', 'photo-camera-nikon-z8',
        'photo-camera-sony-a7r-gm', 'photo-camera-sony-a7r5', 'photo-camera-sony-a7r-body',
        'photo-camera-sony-a7iv', 'photo-camera-sony-a7iv-zoom'],
    'wearables': ['photo-wear-vision-pro', 'photo-wear-ray-ban-meta'],
}
REAL_SET = {
    'gold': ['photo-gold-bars-pair', 'photo-gold-bars-pamp', 'photo-gold-eagle-coins', 'photo-gold-rings-pink'],
    'silver': ['photo-silver-peace-dollar-pair', 'photo-silver-maple-pile'],
    'coins': ['photo-coin-buffalo-nickel-pair', 'photo-coin-indian-cent-pair', 'photo-coin-double-eagle-1849',
        'photo-coin-double-eagle-1866', 'photo-coin-ngc-slabs-pair', 'photo-coin-saint-gaudens-pair',
        'photo-coin-walking-liberty-trio', 'photo-coin-half-dollar-stacks'],
    'gaming': ['photo-gaming-switch-dock', 'photo-gaming-switch2-joycon', 'photo-gaming-switch-oled-set'],
    'audio': ['photo-audio-airpods', 'photo-audio-airpods-pro', 'photo-audio-airpods-pro-buds',
        'photo-audio-galaxy-buds-cases'],
    'wearables': ['photo-wear-watch-s10-pair', 'photo-wear-watch-s10-milanese', 'photo-wear-watch-s9-pair'],
}
for _c, _ns in REAL_PHOTO.items():
    POOLS[_c] += [I(n, rot=6) for n in _ns]
for _c, _ns in REAL_SET.items():
    POOLS[_c] += [I(n, rot=4, role='h') for n in _ns]

# 2026-10-04 (owner: "more variety?": more car models and colours): 98 more models
# and four colours of 20 popular ones, cut from Commons photographs like the rest
CARS_MORE = ['car-acura-integra-red-rear', 'car-acura-rdx-blue', 'car-acura-rdx-blue-rear',
    'car-audi-e-tron-gt-grey-rear', 'car-audi-q5-sportback-grey', 'car-audi-q7-grey', 'car-audi-r8-v10-blue',
    'car-bentley-continental-gt-green', 'car-bentley-continental-gt-green-rear',
    'car-bentley-continental-gt-red-rear', 'car-bmw-5-series-grey', 'car-bmw-i4-white-rear',
    'car-bmw-ix3-2026-white', 'car-bmw-m4-convertible-black', 'car-bmw-x3-black', 'car-bmw-x3-m50-black-rear',
    'car-bmw-x7-m50i-white', 'car-bmw-x7-white', 'car-buick-enclave-grey', 'car-buick-enclave-grey-rear',
    'car-chevy-camaro-yellow', 'car-chevy-camaro-yellow-rear', 'car-chevy-corvette-c1-blue',
    'car-chevy-corvette-c3-grey-rear', 'car-chevy-corvette-c8-red', 'car-chevy-silverado-z71-black',
    'car-chevy-suburban-black', 'car-chrysler-pacifica-grey', 'car-chrysler-pacifica-white-rear',
    'car-dodge-challenger-1972-lime', 'car-dodge-durango-srt-grey', 'car-ferrari-296-gtb-yellow',
    'car-ferrari-296-gtb-yellow-rear', 'car-ferrari-296-gts-grey', 'car-ferrari-f8-spider-magenta-rear',
    'car-ferrari-f8-tributo-red-rear', 'car-ferrari-roma-white', 'car-ford-bronco-black-diamond-silver',
    'car-ford-bronco-sport-badlands-blue', 'car-ford-bronco-sport-badlands-red',
    'car-ford-bronco-sport-black-rear', 'car-ford-bronco-sport-heritage-blue', 'car-ford-f150-grey',
    'car-ford-mustang-convertible-grey', 'car-ford-mustang-gt-blue-grey', 'car-ford-mustang-mach-e-rally-lime',
    'car-genesis-g70-grey-rear', 'car-genesis-gv80-grey', 'car-gmc-yukon-denali-2025-black-rear',
    'car-gmc-yukon-denali-white-rear', 'car-honda-civic-sedan-blue-rear', 'car-honda-civic-type-r-fk8-blue-rear',
    'car-honda-crv-2023-black', 'car-honda-crv-2023-blue', 'car-honda-hrv-beige', 'car-honda-hrv-red-rear',
    'car-honda-passport-white', 'car-hyundai-ioniq-6-silver', 'car-hyundai-ioniq-6-silver-rear',
    'car-hyundai-kona-grey', 'car-hyundai-kona-n-white', 'car-hyundai-kona-n-white-rear',
    'car-hyundai-palisade-black', 'car-hyundai-palisade-white', 'car-hyundai-santa-fe-white',
    'car-hyundai-santa-fe-white-rear', 'car-infiniti-qx60-bronze', 'car-jeep-compass-silver',
    'car-jeep-compass-silver-rear', 'car-jeep-wagoneer-classic-red', 'car-jeep-wagoneer-classic-red-rear',
    'car-jeep-wrangler-2door-black-rear', 'car-jeep-wrangler-sahara-red', 'car-kia-ev6-gt-black',
    'car-kia-ev6-gt-black-rear', 'car-kia-ev9-silver', 'car-kia-sorento-grey', 'car-kia-soul-green',
    'car-kia-sportage-black', 'car-lamborghini-aventador-roadster-blue-rear', 'car-lamborghini-aventador-s-red',
    'car-lamborghini-aventador-ultimae-orange', 'car-lamborghini-huracan-tecnica-blue',
    'car-lamborghini-huracan-tecnica-blue-rear', 'car-land-rover-defender-110-classic-grey',
    'car-land-rover-defender-110-classic-grey-rear', 'car-lexus-es-white', 'car-lexus-es-white-rear',
    'car-lexus-lx-black', 'car-lexus-nx-silver-rear', 'car-lincoln-aviator-black',
    'car-lincoln-aviator-black-rear', 'car-lucid-air-white', 'car-lucid-air-white-rear',
    'car-maserati-mc20-cielo-rear', 'car-maserati-mc20-white', 'car-mazda-cx90-blue',
    'car-mazda3-hatch-silver-rear', 'car-mazda3-hatch-white', 'car-mclaren-720s-grey', 'car-mclaren-720s-silver',
    'car-mercedes-amg-g63-2025-black', 'car-mercedes-amg-g63-4x4-blue-rear', 'car-mercedes-amg-g63-cabriolet-blue',
    'car-mercedes-amg-g63-silver-rear', 'car-mercedes-amg-gt-black-series-orange',
    'car-mercedes-amg-gt63-4door-white', 'car-mercedes-c-class-all-terrain-white', 'car-mercedes-glc-blue',
    'car-mercedes-w114-classic-cream', 'car-mini-classic-cream', 'car-nissan-altima-silver-rear',
    'car-nissan-gtr-r35-white', 'car-nissan-pathfinder-rock-creek-rear', 'car-nissan-titan-xd-silver',
    'car-nissan-z-yellow', 'car-polestar-2-grey', 'car-polestar-2-white',
    'car-porsche-cayenne-gts-coupe-white-rear', 'car-porsche-cayenne-gts-silver',
    'car-porsche-cayenne-gts-white-rear', 'car-porsche-macan-white', 'car-porsche-panamera-gts-chalk',
    'car-porsche-panamera-turbo-bronze', 'car-porsche-panamera-turbo-chalk-rear',
    'car-porsche-taycan-gts-sport-turismo-rear', 'car-ram-1500-limited-grey', 'car-ram-1500-rebel-black',
    'car-ram-trx-red', 'car-range-rover-sport-grey', 'car-rolls-royce-ghost-purple-side',
    'car-subaru-crosstrek-wilderness-blue', 'car-subaru-crosstrek-wilderness-blue-rear',
    'car-subaru-impreza-wrx-1992-silver', 'car-subaru-wrx-blue', 'car-tesla-model-3-highland-red',
    'car-tesla-model-y-black-side', 'car-tesla-model-y-blue', 'car-tesla-model-y-juniper-grey',
    'car-tesla-model-y-performance-red', 'car-toyota-4runner-limited-black', 'car-toyota-gr86-blue',
    'car-toyota-highlander-black', 'car-toyota-highlander-blue', 'car-toyota-highlander-red',
    'car-toyota-rav4-phev-red-rear', 'car-toyota-tacoma-trd-black', 'car-toyota-tacoma-trd-offroad-black',
    'car-toyota-tacoma-trd-offroad-red', 'car-toyota-tundra-1794-black', 'car-toyota-tundra-trd-pro-orange-rear',
    'car-toyota-venza-silver', 'car-toyota-venza-silver-rear', 'car-volvo-xc60-silver',
    'car-volvo-xc60-silver-rear', 'car-volvo-xc90-2025-white', 'car-volvo-xc90-silver-rear', 'car-vw-atlas-silver',
    'car-vw-golf-gti-clubsport-grey', 'car-vw-golf-gti-tcr-white-rear', 'car-vw-golf-mk1-white-rear',
    'car-vw-id5-gtx-silver', 'car-vw-jetta-gli-grey', 'car-vw-tiguan-2024-red']
POOLS['cars'] += [I(n, rot=1, kind='car') for n in CARS_MORE]

# 2026-10-03: the owner's pass (assets/approved-assets.json "rejected") and the
# defects found since (assets/cutout-flags.json) never ship in these sets; since
# 2026-10-04 the real photographs above replace them outside Apple too. Strips
# and Pokemon still carry some until replacements land.
_GRID = json.load(open(os.path.join(REPO, 'assets', 'approved-assets.json')))['asset-grid-v1']
BANNED = set(_GRID['rejected']) | set(json.load(open(os.path.join(REPO, 'assets', 'cutout-flags.json'))))
for _c in ('iphone', 'ipad', 'macbook', 'mac', 'computers', 'cars', 'gold', 'silver', 'coins', 'sports', 'gaming',
           'audio', 'wearables', 'cameras'):
    POOLS[_c] = [it for it in POOLS[_c] if it['name'] not in BANNED]

# ----------------------------------------------------------------------------- Apple-ad sets
# Owner, 2026-10-03: "we want our stuff to look like Apple ads", "Simplistic,
# informative, and authoritative", "More options, please". Each Apple line gets
# a second set built the way Apple's own ads are: one product upright and large,
# or one model in a row of its colours; clean studio and system-wallpaper
# grounds only; the ground tinted from the product's own finish
# (assets/devices.json, measured on the cut-out) or Apple's white and black; no blur.
AD = OrderedDict([('iphone-ad', 'iphone'), ('ipad-ad', 'ipad'), ('macbook-ad', 'macbook'), ('mac-ad', 'mac')])
# liquid glass is out: its small floating panes read as clutter, not as Apple
AD_STYLES = ['studio-sweep', 'podium', 'podium-tiered', 'podium-neon', 'ios-mesh', 'macos-waves', 'aurora', 'showroom',
             'concrete', 'sky']
AD_LAYOUTS = ['hero', 'pair', 'trio', 'lineup', 'staircase', 'offset']
# 2026-10-04 (owner: "more variety?"): phones and iPads also float, tilted, and
# lie flat in a grid of their colours, as Apple shows a colour range
# a MacBook is a lid and a screen from the front: three in a row are toys, and
# its colour barely shows, so one large, or two (sizes or colours) as Apple shows them
AD_LAYOUTS_BY = {'iphone-ad': ['hero', 'pair', 'trio', 'lineup', 'floating-row', 'grid-flatlay',
                               'staircase', 'zigzag', 'offset', 'hero-plus'],
                 'ipad-ad': ['hero', 'pair', 'trio', 'lineup', 'floating-row', 'staircase', 'offset', 'hero-plus'],
                 'macbook-ad': ['hero', 'pair', 'offset', 'stagger']}
AD_TILT = 15
AD_LINEUP = {'iphone-ad': 5, 'ipad-ad': 4, 'macbook-ad': 3, 'mac-ad': 4}
AD_COUNTS = OrderedDict([('iphone-ad', 96), ('ipad-ad', 60), ('macbook-ad', 40), ('mac-ad', 40)])
_DEV = json.load(open(os.path.join(REPO, 'assets', 'devices.json')))['models']
FINISH = {c['slug']: (f.replace('-', ' ').title(), c['hex'])
          for m in _DEV.values() for f, c in m.get('colours', {}).items()}
FINISH.update({n: (v['finish'], v['metal']) for n, v in VIEW.items()})
APPLE_NEUTRAL = dict(dark='#0b0b0d', mid='#86868b', light='#f5f5f7', accent='#2997ff', support='#d2d2d7')

def ad_need(cat, layout):
    if layout == 'floating-row': return 3 if cat == 'iphone-ad' else 2
    if layout == 'grid-flatlay': return 4
    if layout == 'staircase': return 4 if cat == 'iphone-ad' else 3
    if layout == 'zigzag': return 4
    return {'hero': 1, 'offset': 1, 'pair': 2, 'stagger': 2, 'trio': 3, 'hero-plus': 3}.get(layout) or AD_LINEUP[cat]

def ad_groups(cat):
    """one model per group, its colours as the members (qs-...--blue), upright;
    each real photograph (photo-...) a group of its own, shown alone"""
    g = OrderedDict()
    for it in POOLS[AD[cat]]:
        if it['name'].startswith('qs-'):
            g.setdefault(it['name'].split('--')[0], []).append(dict(it, rot=0))
        elif it['name'].startswith('photo-'):
            g[it['name']] = [dict(it, rot=0)]
        elif it['name'].startswith('view-') and VIEW[it['name']]['deg'] == 0 and VIEW[it['name']]['side'] == 'back':
            # a model's finishes side by side, flat (not every angle of every model:
            # Apple's storefront colours and the photographs keep their share)
            v = VIEW[it['name']]
            g.setdefault(f"view:{v['model']}:{v['side']}{v['deg']}", []).append(dict(it, rot=0))
    for side, deg in [('back', 0), ('screen', 0)]:
        trio = [next((n for n, v in VIEW.items() if v['phone'] == p and v['side'] == side and v['deg'] == deg), None)
                for p in HERO_TRIO]
        if all(trio):
            g[f'view:hero-trio:{side}{deg}'] = [I(n, rot=0, kind='view') for n in trio]
    return g

def lab2hex(lab):
    c = l2s(lab2lin(np.asarray(lab, F)))
    return '#' + ''.join(f'{int(round(float(v) * 255)):02x}' for v in np.clip(c, 0, 1))

def ad_palette(items, mode, dark):
    """tone: Apple's way of setting a colour finish on its own colour"""
    fin = FINISH.get(items[len(items) // 2]['name'])
    if mode == 'tone' and fin:
        lab = lin2lab(hex2lin(fin[1])); C = math.hypot(lab[1], lab[2]); h = math.atan2(lab[2], lab[1])
        if C >= 0.025:
            mk = lambda L, c: lab2hex([L, c * math.cos(h), c * math.sin(h)])
            return dict(name='Tone · ' + fin[0], dark=mk(0.25, min(C * 0.55, 0.07)), mid=mk(0.62, min(C * 0.8, 0.10)),
                        light=mk(0.945, min(C * 0.32, 0.035)), accent=mk(min(max(lab[0], 0.55), 0.8), min(C * 1.1, 0.16)),
                        support=mk(0.86, min(C * 0.5, 0.06)))
    return dict(APPLE_NEUTRAL, name='Apple Black' if dark else 'Apple White')

def vivid(pdef, dark):
    """Owner, 2026-10-04: "Too much pastel colors ... more neon more vibrant, more heavy
    contrast", "too much gray [in the dark ones] ... the ones with blue I really like".
    A grey dark ground goes deep blue, a light ground keeps its hue with more colour
    in it, accents go neon."""
    lab = {k: lin2lab(hex2lin(pdef[k])) for k in ('dark', 'mid', 'light', 'accent', 'support')}
    C = lambda v: math.hypot(v[1], v[2])
    def chroma(v, k, cap):
        c = C(v)
        if c > 1e-4: v = v.copy(); v[1:] *= min(k, cap / c) if c < cap else 1.0
        return v
    out = dict(pdef)
    blue = np.array([0.0, -0.016, -0.062], F)
    if dark:
        if C(lab['dark']) < 0.035 and lab['dark'][0] > 0.2:      # grey, not black: true black stays
            lab['dark'] = np.array([min(lab['dark'][0], 0.25), *blue[1:]], F)
            out['name'] = pdef['name'].replace('Black', 'Midnight')
        else:
            lab['dark'] = chroma(lab['dark'], 1.25, 0.15)
        if C(lab['mid']) < 0.035:
            lab['mid'] = np.array([lab['mid'][0], *(blue[1:] * 1.3)], F)
        else:
            lab['mid'] = chroma(lab['mid'], 1.2, 0.17)
    elif C(lab['light']) >= 0.02:
        hue = math.degrees(math.atan2(lab['light'][2], lab['light'][1])) % 360
        if 95 <= hue <= 145:                        # owner: "baby barf green": a pale yellow-green stays near white
            lab['light'] = tint(lab['light'], max(lab['light'][0], 0.95), 0.3)
        else:
            lab['light'] = chroma(lighten(lab['light'], -0.08), 2.1, 0.14)
    for k in ('accent', 'support'):
        v = chroma(lab[k], 1.3, 0.26); v[0] = float(np.clip(v[0], 0.64, 0.86)); lab[k] = v
    for k, v in lab.items():
        out[k] = lab2hex(v)
    return out

# The vehicle each car backdrop shows, in order (cars-001 is the first): every
# real vehicle once, 264 cars, 41 pickups, 9 vans, 4 semis and one motorcycle;
# many models twice, from the front and from the rear or side (owner,
# 2026-10-03: "more alternate angles as much as you can"), and since 2026-10-04
# 98 more models and four colours of 20 popular ones ("more variety?"). The order
# spreads the kinds (no two pickups, vans or semis side by side, never one model
# next to itself) and gives each backdrop the vehicle that stands out most from
# its ground (OKLab distance of the body colour from the ground colour, then pairs
# swapped while the weaker of the two gets better). Left out: the CR-V (shot
# from a slant, it tips on the podium) and the 4Runner (grass hides its tyres).
CAR_ROTA = ['car-toyota-rav4-white', 'car-range-rover-sport-grey', 'car-dodge-durango-srt-grey',
            'car-nissan-z-yellow', 'car-ford-bronco-sport-yellow-rear', 'car-toyota-tacoma-orange',
            'car-ferrari-roma-white', 'car-toyota-land-cruiser-fj40-green', 'car-ford-mustang-gt-blue-grey',
            'car-kia-k5-silver-rear', 'car-volvo-xc60-silver-rear', 'car-lamborghini-temerario-yellow',
            'car-ferrari-296-gtb-yellow-rear', 'car-jeep-wrangler-rubicon-lime', 'car-tesla-model-y-black-side',
            'car-bmw-5-series-grey', 'car-lamborghini-huracan-tecnica-blue-rear', 'car-honda-ridgeline-grey-rear',
            'car-honda-civic-white', 'car-ford-bronco-sport-badlands-blue', 'car-hyundai-kona-n-white-rear',
            'car-toyota-tacoma-trd-offroad-red', 'car-mercedes-amg-g63-2025-black',
            'car-ford-mustang-gt-yellow-rear', 'car-lincoln-aviator-black-rear', 'car-tesla-model-y-red-side',
            'car-hyundai-ioniq-9-white', 'car-chevy-corvette-c3-grey-rear', 'car-mazda-cx5-blue',
            'car-bmw-m3-touring-blue-rear', 'car-toyota-highlander-red', 'car-bentley-bentayga-grey',
            'car-mini-classic-cream', 'car-mercedes-amg-g63-yellow', 'car-rivian-r1s-silver',
            'car-tesla-model-y-blue', 'car-volvo-xc90-2025-white', 'car-ford-mustang-mach-e-rally-lime',
            'car-chevy-silverado-zr2-red', 'car-bmw-2002-turbo-white', 'car-subaru-impreza-wrx-1992-silver',
            'car-ram-2500-power-wagon-white', 'car-honda-civic-type-r-fl5-white', 'car-subaru-wrx-blue',
            'car-vw-atlas-silver', 'car-mercedes-amg-gle63-silver', 'car-honda-hrv-red-rear',
            'car-tesla-model-s-plaid-white', 'car-bmw-m3-csl-e46-grey', 'car-genesis-g70-grey-rear',
            'car-ram-promaster-grey', 'car-rivian-r1s-grey-rear', 'car-toyota-tundra-1794-black',
            'car-peterbilt-579-red', 'car-lamborghini-aventador-s-red', 'car-jeep-wrangler-2door-black-rear',
            'car-ford-transit-courier-white', 'car-rivian-r1t-white-rear', 'car-jeep-grand-wagoneer-white',
            'car-harley-softail-black', 'car-toyota-4runner-limited-black', 'car-nissan-rogue-copper',
            'car-kia-ev6-gt-black-rear', 'car-nissan-nv200-white', 'car-honda-s2000-silver', 'car-ram-trx-red',
            'car-hyundai-sonata-black', 'car-ferrari-f8-spider-magenta-rear', 'car-hyundai-kona-grey',
            'car-porsche-911-gt2-rs-white', 'car-toyota-highlander-blue', 'car-kia-ev9-silver',
            'car-range-rover-blue', 'car-ram-1500-limited-grey', 'car-ford-transit-connect-white',
            'car-porsche-356-blue', 'car-gmc-yukon-denali-white-rear', 'car-buick-enclave-grey-rear',
            'car-honda-civic-type-r-fk8-blue-rear', 'car-hyundai-tucson-white',
            'car-nissan-pathfinder-rock-creek-rear', 'car-vw-golf-gti-clubsport-grey',
            'car-hyundai-palisade-white', 'car-chevy-camaro-1969-silver', 'car-porsche-macan-white',
            'car-ford-bronco-sport-heritage-blue', 'car-ferrari-296-gtb-yellow', 'car-toyota-4runner-trd-pro-lime',
            'car-bmw-x5-black-rear', 'car-audi-rs5-sportback-red', 'car-ford-bronco-1st-gen-cream',
            'car-chevy-corvette-z06-yellow', 'car-toyota-gr-supra-grey-rear', 'car-acura-rdx-blue',
            'car-genesis-gv80-grey', 'car-nissan-gtr-r35-white', 'car-mercedes-g-class-orange',
            'car-audi-q5-sportback-grey', 'car-ram-1500-blue', 'car-lincoln-aviator-black',
            'car-acura-rdx-blue-rear', 'car-lucid-air-white-rear', 'car-porsche-panamera-gts-chalk',
            'car-audi-r8-v10-blue', 'car-mercedes-amg-gt63-4door-white', 'car-porsche-panamera-turbo-chalk-rear',
            'car-toyota-highlander-silver-rear', 'car-jeep-gladiator-green', 'car-vw-tiguan-2024-red',
            'car-bmw-ix3-2026-white', 'car-honda-civic-type-r-blue', 'car-ford-bronco-blue',
            'car-lamborghini-aventador-ultimae-orange', 'car-bmw-m3-competition-green', 'car-ford-f150-grey',
            'car-bmw-z8-silver', 'car-infiniti-qx60-bronze', 'car-bmw-m4-convertible-black',
            'car-chevy-equinox-white', 'car-maserati-mc20-white', 'car-nissan-skyline-gtr-r34-blue',
            'car-lamborghini-huracan-tecnica-blue', 'car-mazda3-hatch-white',
            'car-lamborghini-aventador-roadster-blue-rear', 'car-subaru-crosstrek-wilderness-blue',
            'car-chevy-suburban-black', 'car-jeep-grand-cherokee-l-silver', 'car-mazda3-hatch-silver-rear',
            'car-kia-k5-grey', 'car-ford-e350-white', 'car-jeep-wagoneer-classic-red-rear',
            'car-tesla-model-x-silver', 'car-buick-enclave-grey', 'car-vw-golf-mk1-white-rear',
            'car-mercedes-amg-g63-4x4-blue-rear', 'car-toyota-tundra-trd-pro-white-rear', 'car-kia-soul-green',
            'car-bmw-3-0-csl-beige', 'car-bmw-x7-white', 'car-lamborghini-urus-green', 'car-subaru-outback-white',
            'car-porsche-cayenne-gts-silver', 'car-ford-f150-raptor-2026-black', 'car-toyota-gr-supra-2026-red',
            'car-ford-mustang-convertible-grey', 'car-toyota-tacoma-trd-offroad-black',
            'car-jeep-wrangler-sahara-red', 'car-hyundai-ioniq-6-silver-rear', 'car-tesla-model-y-juniper-grey',
            'car-honda-passport-white', 'car-volvo-xc60-silver', 'car-porsche-cayenne-gts-white-rear',
            'car-tesla-model-y-white', 'car-ram-1500-rebel-black', 'car-lexus-rx-grey-rear',
            'car-toyota-tacoma-trd-black-rear', 'car-tesla-model-x-white-rear', 'car-audi-s5-white',
            'car-mercedes-glc-blue', 'car-hyundai-santa-fe-white-rear', 'car-mercedes-s-class-black',
            'car-ferrari-296-gts-grey', 'car-mercedes-190e-evo-black', 'car-ford-ranger-wildtrak-orange',
            'car-audi-q7-grey', 'car-hyundai-ioniq5-grey-rear', 'car-porsche-911-carrera-rs-orange',
            'car-lexus-is-white', 'car-chevy-corvette-c1-blue', 'car-nissan-frontier-grey',
            'car-vw-golf-gti-tcr-white-rear', 'car-hyundai-tucson-l-white-rear',
            'car-land-rover-defender-110-classic-grey-rear', 'car-mclaren-720s-grey',
            'car-ford-f150-lightning-black', 'car-ford-explorer-white', 'car-tesla-model-y-performance-red',
            'car-dodge-challenger-1972-lime', 'car-chevy-silverado-red', 'car-ferrari-f8-tributo-red-rear',
            'car-peterbilt-389-white', 'car-chevy-camaro-yellow-rear', 'car-honda-pilot-white',
            'car-cadillac-escalade-black-rear', 'car-nissan-titan-xd-silver', 'car-jeep-compass-silver',
            'car-toyota-highlander-silver', 'car-mercedes-w114-classic-cream',
            'car-mercedes-amg-g63-cabriolet-blue', 'car-ford-maverick-red', 'car-hyundai-palisade-black',
            'car-chevy-camaro-yellow', 'car-toyota-highlander-white-rear', 'car-subaru-forester-silver',
            'car-ford-mustang-mach1-grey-rear', 'car-bmw-x7-m50i-white', 'car-land-rover-defender-90-teal',
            'car-toyota-sienna-white', 'car-land-rover-defender-110-classic-grey', 'car-ford-f150-black',
            'car-hyundai-santa-fe-white', 'car-ford-mustang-dark-horse-blue', 'car-porsche-panamera-turbo-bronze',
            'car-chevy-equinox-white-rear', 'car-honda-ridgeline-white', 'car-cadillac-escalade-v-white',
            'car-jeep-wrangler-rubicon-2026-orange', 'car-bmw-x3-m50-black-rear', 'car-porsche-918-spyder-white',
            'car-tesla-cybertruck-rear-street', 'car-toyota-prius-white', 'car-porsche-911-gt3-blue',
            'car-tesla-model-3-highland-red', 'car-lexus-lx-black', 'car-hyundai-kona-n-white',
            'car-bentley-continental-gt-green', 'car-jeep-wagoneer-classic-red', 'car-kia-sportage-black',
            'car-hyundai-ioniq5-silver-side', 'car-mazda-cx90-blue', 'car-volvo-vnl-blue',
            'car-mercedes-amg-g63-black', 'car-porsche-carrera-gt-silver', 'car-mclaren-720s-silver',
            'car-ford-e-transit-custom-white-rear', 'car-acura-integra-red-rear', 'car-tesla-model-3-white',
            'car-bentley-continental-gt-red-rear', 'car-gmc-yukon-denali-2025-black-rear', 'car-vw-jetta-gli-grey',
            'car-ram-1500-black-rear', 'car-honda-accord-2023-white-side', 'car-toyota-corolla-cross-silver-rear',
            'car-toyota-gr86-blue', 'car-honda-hrv-beige', 'car-ford-f150-black-rear', 'car-lexus-nx-silver-rear',
            'car-ford-bronco-black-diamond-silver', 'car-toyota-corolla-white', 'car-subaru-outback-red-rear',
            'car-toyota-prius-2026-grey', 'car-gmc-sierra-denali-grey', 'car-rolls-royce-ghost-purple-side',
            'car-tesla-cybertruck-cyberbeast', 'car-toyota-venza-silver', 'car-vw-id5-gtx-silver',
            'car-toyota-tacoma-trd-black', 'car-toyota-land-cruiser-80-red', 'car-kia-telluride-grey',
            'car-mercedes-amg-gt-black-series-orange', 'car-jeep-gladiator-rubicon-red-side',
            'car-toyota-highlander-black', 'car-ford-transit-custom-silver-rear', 'car-lexus-rx-white-rear',
            'car-ford-f250-black', 'car-chrysler-pacifica-white-rear', 'car-ldv-maxus-van-white',
            'car-volvo-xc90-silver-rear', 'car-bentley-continental-gt-green-rear', 'car-polestar-2-grey',
            'car-ford-bronco-sport-black-rear', 'car-toyota-tundra-trd-pro-blue',
            'car-porsche-cayenne-gts-coupe-white-rear', 'car-bmw-m3-blue', 'car-honda-crv-2023-blue',
            'car-honda-pilot-white-rear', 'car-ford-ranger-blue-rear', 'car-bmw-i4-white-rear',
            'car-mercedes-amg-g63-silver-rear', 'car-kia-ev6-gt-black', 'car-hyundai-ioniq-6-silver',
            'car-honda-crv-red-rear', 'car-toyota-supra-a80-silver', 'car-honda-accord-white',
            'car-mercedes-sprinter-white', 'car-toyota-gr-corolla-black', 'car-lucid-air-white',
            'car-rivian-r1t-green-rear', 'car-toyota-venza-silver-rear', 'car-ford-f150-raptor-orange-rear',
            'car-dodge-charger-orange', 'car-honda-crv-2023-black', 'car-lexus-rx-white', 'car-kia-k4-white',
            'car-mercedes-c-class-all-terrain-white', 'car-gmc-sierra-ev-grey-rear', 'car-kia-sorento-grey',
            'car-nissan-altima-silver-rear', 'car-toyota-prius-silver-rear', 'car-chrysler-pacifica-grey',
            'car-freightliner-cascadia-blue', 'car-tesla-model-3-performance-white-rear',
            'car-toyota-camry-2025-white-side', 'car-honda-accord-white-rear',
            'car-ford-bronco-sport-badlands-red', 'car-toyota-rav4-2026-white-rear',
            'car-maserati-mc20-cielo-rear', 'car-porsche-taycan-gts-sport-turismo-rear',
            'car-toyota-rav4-phev-red-rear', 'car-lexus-es-white', 'car-honda-nsx-na1-red', 'car-bmw-x3-black',
            'car-rolls-royce-cullinan-black', 'car-lexus-es-white-rear', 'car-honda-civic-sedan-blue-rear',
            'car-jeep-compass-silver-rear', 'car-toyota-tundra-trd-pro-orange-rear', 'car-polestar-2-white',
            'car-bmw-1m-coupe-orange', 'car-kia-telluride-2026-silver-rear', 'car-toyota-camry-silver',
            'car-chevy-silverado-z71-black', 'car-chevy-tahoe-black', 'car-subaru-crosstrek-wilderness-blue-rear',
            'car-chevy-corvette-c8-red', 'car-toyota-prius-grey-rear', 'car-tesla-cybertruck',
            'car-porsche-911-sport-classic-grey', 'car-audi-e-tron-gt-grey-rear']
# One model from the front and from the rear (or side), on a diagonal (layout
# stagger). Owner, 2026-10-04: "I would like to have the same color car ... Even the
# same car if possible ... But I'll take the same color": audited by eye, each pair
# the same paint, most of them the same car photographed twice (a dark blue M3 beside
# a bright blue M3 Touring, a dark grey K5 beside a silver one, are out).
CAR_DUOS = [
    ('car-toyota-prius-2026-grey', 'car-toyota-prius-grey-rear'),
    ('car-toyota-rav4-white', 'car-toyota-rav4-2026-white-rear'),
    ('car-toyota-highlander-silver', 'car-toyota-highlander-silver-rear'),
    ('car-honda-accord-white', 'car-honda-accord-white-rear'), ('car-honda-pilot-white', 'car-honda-pilot-white-rear'),
    ('car-ford-f150-black', 'car-ford-f150-black-rear'), ('car-chevy-equinox-white', 'car-chevy-equinox-white-rear'),
    ('car-lexus-rx-white', 'car-lexus-rx-white-rear'), ('car-hyundai-tucson-white', 'car-hyundai-tucson-l-white-rear'),
    ('car-tesla-cybertruck', 'car-tesla-cybertruck-rear-street'),
    ('car-tesla-model-3-white', 'car-tesla-model-3-performance-white-rear'),
    ('car-tesla-model-y-performance-red', 'car-tesla-model-y-red-side'),
    ('car-ram-1500-rebel-black', 'car-ram-1500-black-rear'),
    ('car-toyota-tacoma-trd-offroad-black', 'car-toyota-tacoma-trd-black-rear'),
    ('car-honda-civic-type-r-blue', 'car-honda-civic-type-r-fk8-blue-rear'),
    ('car-acura-rdx-blue', 'car-acura-rdx-blue-rear'),
    ('car-bentley-continental-gt-green', 'car-bentley-continental-gt-green-rear'),
    ('car-bmw-x3-black', 'car-bmw-x3-m50-black-rear'), ('car-buick-enclave-grey', 'car-buick-enclave-grey-rear'),
    ('car-chevy-camaro-yellow', 'car-chevy-camaro-yellow-rear'),
    ('car-ferrari-296-gtb-yellow', 'car-ferrari-296-gtb-yellow-rear'),
    ('car-hyundai-ioniq-6-silver', 'car-hyundai-ioniq-6-silver-rear'),
    ('car-hyundai-kona-n-white', 'car-hyundai-kona-n-white-rear'),
    ('car-hyundai-santa-fe-white', 'car-hyundai-santa-fe-white-rear'),
    ('car-jeep-compass-silver', 'car-jeep-compass-silver-rear'),
    ('car-jeep-wagoneer-classic-red', 'car-jeep-wagoneer-classic-red-rear'),
    ('car-kia-ev6-gt-black', 'car-kia-ev6-gt-black-rear'),
    ('car-lamborghini-huracan-tecnica-blue', 'car-lamborghini-huracan-tecnica-blue-rear'),
    ('car-land-rover-defender-110-classic-grey', 'car-land-rover-defender-110-classic-grey-rear'),
    ('car-lexus-es-white', 'car-lexus-es-white-rear'), ('car-lincoln-aviator-black', 'car-lincoln-aviator-black-rear'),
    ('car-lucid-air-white', 'car-lucid-air-white-rear'), ('car-maserati-mc20-white', 'car-maserati-mc20-cielo-rear'),
    ('car-mercedes-amg-g63-cabriolet-blue', 'car-mercedes-amg-g63-4x4-blue-rear'),
    ('car-porsche-panamera-gts-chalk', 'car-porsche-panamera-turbo-chalk-rear'),
    ('car-subaru-crosstrek-wilderness-blue', 'car-subaru-crosstrek-wilderness-blue-rear'),
    ('car-toyota-venza-silver', 'car-toyota-venza-silver-rear'),
    ('car-volvo-xc60-silver', 'car-volvo-xc60-silver-rear')]
POOLS['cars-pair'] = POOLS['cars']

COUNTS = OrderedDict([('iphone', 150)] + [(c, 40) for c in
          ['gold', 'silver', 'coins', 'strips', 'pokemon', 'sports', 'gaming', 'audio', 'computers', 'wearables']]
          + [('cars', len(CAR_ROTA)), ('cameras', 40), ('ipad', 40), ('macbook', 40), ('mac', 40)]
          + list(AD_COUNTS.items()) + [('cars-pair', len(CAR_DUOS))])

# ----------------------------------------------------------------------------- cut-out loading

_cache = OrderedDict()
MAXSIDE = 1500

def load_cut(name):
    if name in _cache:
        _cache.move_to_end(name); return _cache[name]
    im = Image.open(os.path.join(CUT, name + '.webp')).convert('RGBA')
    a = np.asarray(im, F) / 255
    al = a[..., 3]
    ys, xs = np.where(al > 0.03)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a = a[y0:y1, x0:x1]
    h, w = a.shape[:2]
    d = min(1.0, MAXSIDE / max(h, w))
    if d < 1:
        a = cv2.resize(a, (round(w * d), round(h * d)), interpolation=cv2.INTER_AREA)
    rgb = s2l(a[..., :3]); al = a[..., 3]
    al = np.clip((al - 0.06) / 0.94, 0, 1).astype(F)       # choke fringe
    core = (al > 0.97).astype(F)
    sg = max(1.5, max(al.shape) / 500)
    num = gblur(rgb * core[..., None], sg); den = gblur(core, sg)[..., None]
    fill = num / np.maximum(den, 1e-4)
    edge = ((al < 0.97) & (den[..., 0] > 0.02))[..., None]
    t = al[..., None] ** 0.5
    rgb = np.where(edge, fill * (1 - t) + rgb * t, rgb)      # decontaminate halo colour
    spr = np.dstack([rgb * al[..., None], al]).astype(F)
    val = (spr, 2.3 / d)
    _cache[name] = val
    while len(_cache) > 14:
        _cache.popitem(last=False)
    return val

def aspect(name):
    s, _ = load_cut(name); return s.shape[1] / s.shape[0]

def prep_sprite(name, S, rot=0.0, blur=0.0):
    src, cap = load_cut(name)
    h, w = src.shape[:2]
    s = min(S / math.sqrt(w * h), cap)
    nw, nh = max(2, round(w * s)), max(2, round(h * s))
    im = cv2.resize(src, (nw, nh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    im = np.clip(im, 0, None); im[..., 3] = np.clip(im[..., 3], 0, 1)
    im[..., :3] = np.minimum(im[..., :3], im[..., 3:4] * 1.02)
    if abs(rot) > 0.05:
        M = cv2.getRotationMatrix2D((nw / 2, nh / 2), rot, 1.0)
        c, sn = abs(M[0, 0]), abs(M[0, 1])
        bw, bh = int(nh * sn + nw * c) + 4, int(nh * c + nw * sn) + 4
        M[0, 2] += bw / 2 - nw / 2; M[1, 2] += bh / 2 - nh / 2
        im = cv2.warpAffine(im, M, (bw, bh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    if blur > 0.3:
        p = int(blur * 3) + 2
        im = cv2.copyMakeBorder(im, p, p, p, p, cv2.BORDER_CONSTANT, value=0)
        im = cv2.GaussianBlur(im, (0, 0), blur)
    ys, xs = np.where(im[..., 3] > 0.004)
    im = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return np.ascontiguousarray(im)

# ----------------------------------------------------------------------------- canvas ops

def _clip(x0, y0, h, w):
    X0, Y0 = max(0, x0), max(0, y0)
    X1, Y1 = min(W, x0 + w), min(H, y0 + h)
    if X1 <= X0 or Y1 <= Y0:
        return None
    return (slice(Y0, Y1), slice(X0, X1)), (slice(Y0 - y0, Y1 - y0), slice(X0 - x0, X1 - x0))

def blit(canvas, spr, x0, y0, op=1.0):
    r = _clip(x0, y0, spr.shape[0], spr.shape[1])
    if r is None: return
    (cy, cx), (sy, sx) = r
    s = spr[sy, sx]
    a = s[..., 3:4] * op
    canvas[cy, cx] = canvas[cy, cx] * (1 - a) + s[..., :3] * op

def place(mask, x0, y0):
    out = np.zeros((H, W), F)
    r = _clip(int(round(x0)), int(round(y0)), mask.shape[0], mask.shape[1])
    if r is None: return out
    (cy, cx), (sy, sx) = r
    out[cy, cx] = mask[sy, sx]
    return out

def shade(canvas, m, op, tint):
    canvas *= (1 - (m * op)[..., None] * (1 - tint))

# ----------------------------------------------------------------------------- ground styles

class G:  # ground context
    pass

def base_grad(g, top='base', bot='base2', ang=None):
    a = g.rng.uniform(-0.5, 0.5) if ang is None else ang
    t = np.clip(yn * math.cos(a) + (xn - 0.5) * math.sin(a), 0, 1)
    return paint([(g.p.t[top], 1 - t), (g.p.t[bot], t)])

def prod_center(g):
    return g.pc

def st_mesh(g):
    r = g.rng; T = g.p.t
    cols = [T['base'], T['base2'], T['sups'], T['accs'], T['hi'], T['base'], T['sups']]
    k = r.integers(4, 7)
    wx, wy = fbm(r, 2, 2) * 0.07, fbm(r, 2, 2) * 0.07
    x, y = xn + wx, yn + wy
    stops = [(T['base'], 0.25)]
    idx = r.permutation(len(cols))[:k]
    for i in idx:
        px, py = r.uniform(-0.1, 1.1), r.uniform(-0.1, 1.1)
        s = r.uniform(0.22, 0.42)
        wgt = np.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * s * s))
        if cols[i] is T['accs']: wgt = wgt * 0.8
        stops.append((cols[i], wgt))
    return paint(stops)

def _dir_uv(g, spread):
    if g.zone == 'top':
        th = g.rng.uniform(-spread, spread)
    elif g.zone == 'left':
        th = g.rng.uniform(0.45, 0.8)
    else:
        th = -g.rng.uniform(0.45, 0.8)
    u = xn * math.cos(th) - yn * math.sin(th)
    v = xn * math.sin(th) + yn * math.cos(th)
    return u, v, th

def st_waves(g):
    r = g.rng; T = g.p.t
    u, v, th = _dir_uv(g, 0.35)
    vmin = v.min(); vmax = v.max(); vn = (v - vmin) / (vmax - vmin)
    img = paint([(T['base'], 1 - vn), (T['base2'], vn)])
    n = r.integers(4, 7)
    starts = np.linspace(r.uniform(0.40, 0.50), 1.02, n)
    if g.p.dark:
        ramp = [T['base2'], T['sups'], T['hi'], T['accs'], T['sup'], T['base2']]
    else:
        ramp = [T['base2'], T['sups'], T['accs'], T['deep'], T['sups'], T['hi']]
    r.shuffle(ramp[1:4])
    for k in range(n):
        a1, f1, p1 = r.uniform(0.035, 0.08), r.uniform(0.5, 1.2), r.uniform(0, 1)
        a2, f2, p2 = r.uniform(0.01, 0.025), r.uniform(1.4, 2.6), r.uniform(0, 1)
        curve = starts[k] + a1 * np.sin(2 * np.pi * (f1 * u + p1)) + a2 * np.sin(2 * np.pi * (f2 * u + p2))
        d = (vn - curve) * (vmax - vmin) * H
        above = np.clip(-d, 0, None)
        img *= (1 - 0.20 * np.exp(-above / 38) * (d < 0))[..., None]
        col = ramp[k % len(ramp)]
        c0 = lab2lin(col); chi = lab2lin(labmix(col, T['hi'] if not g.p.dark else T['mid'], 0.35))
        grad = ss(0, 160, d)
        layer = chi[None, None] * (1 - grad[..., None]) + c0[None, None] * grad[..., None]
        layer += (0.05 * np.exp(-((d - 10) / 7) ** 2))[..., None]
        cov = np.clip(d + 0.5, 0, 1)
        img = lerp(img, layer, cov)
    return img

def st_aurora(g):
    r = g.rng; T = g.p.t
    img = base_grad(g, 'deep' if g.p.dark else 'base', 'base' if g.p.dark else 'base2', 0)
    add = np.zeros((H, W, 3), F)
    streak_row = cv2.resize(r.standard_normal((1, 40)).astype(F), (W, 1), interpolation=cv2.INTER_CUBIC)
    streak = 1 + 0.10 * np.repeat(gblur(streak_row, 3), H, 0)
    ca, cs = lab2lin(T['acc']), lab2lin(T['sup'])
    for k in range(r.integers(2, 4)):
        y0 = r.uniform(0.28, 0.75); a = r.uniform(0.05, 0.14); f = r.uniform(0.4, 1.1); p = r.uniform(0, 1)
        yc = y0 + a * np.sin(2 * np.pi * (f * xn + p)) + 0.03 * fbm(r, 2, 2)
        w = r.uniform(0.035, 0.07) * (0.7 + 0.3 * np.sin(2 * np.pi * (xn * 1.3 + p)))
        dy = yn - yc
        wa = np.where(dy < 0, w * 2.6, w)
        I_ = np.exp(-(dy / wa) ** 2) * streak * r.uniform(0.6, 1.0)
        tx = ss(0, 1, xn if k % 2 == 0 else 1 - xn)
        col = ca[None, None] * (1 - tx[..., None]) + cs[None, None] * tx[..., None]
        add += I_[..., None] * col
    add = gblur(add, 14)
    if g.p.dark:
        img = img + add * 0.55
    else:
        img = lerp(img, img * 0.5 + add * 0.5 + 0.25, np.clip(add.mean(2) * 1.1, 0, 0.6))
    return img

def st_studio(g, podium=False):
    r = g.rng; T = g.p.t
    hy = g.hy
    if g.p.dark:
        wall, floor = [(T['base'], T['base2']), (T['base'], T['sups']), (T['base2'], T['base'])][r.integers(3)]
    else:
        opts = [(T['base'], T['sups']), (T['sups'], T['base2']), (T['base2'], T['base']),
                (T['base'], T['accs']), (T['accs'], T['base']), (T['base'], T['base2'])]
        wall, floor = opts[r.integers(len(opts))]
    cove = r.uniform(60, 130)
    t = ss(hy - cove * 0.6, hy + cove, YY)
    wall_top = labmix(wall, T['deep'], 0.35 if not g.p.dark else 0.0)
    if g.p.dark:
        wall_top = lighten(wall, -0.04)
    wt = np.clip(YY / hy, 0, 1)
    wallimg = paint([(wall_top, 1 - wt), (wall, wt)])
    ft = np.clip((YY - hy) / (H - hy), 0, 1)
    floorimg = paint([(lighten(floor, 0.02), 1 - ft), (lighten(floor, -0.035), ft)])
    img = lerp(wallimg, floorimg, t)
    # cove shading band
    img *= (1 - 0.05 * np.exp(-((YY - hy - cove * 0.2) / (cove * 0.6)) ** 2))[..., None]
    sx = g.pc[0] + r.uniform(-60, 60)
    spot = gauss2(sx, hy - H * 0.12, W * 0.30, H * 0.26)
    pool = gauss2(sx, hy + (H - hy) * 0.45, W * 0.34, (H - hy) * 0.35)
    k = 0.20 if g.p.dark else 0.10
    lc = lab2lin(labmix(T['hi'], T['sups'], 0.3)) if g.p.dark else np.ones(3, F)
    img = img + (spot * k)[..., None] * lc + (pool * k * 0.6)[..., None] * lc
    g.floor = True
    if podium:
        img = draw_podiums(g, img, podium if isinstance(podium, str) else 'round')
    return img

def draw_podiums(g, img, kind='round'):
    r = g.rng; T = g.p.t
    ped = []
    for pl in g.pls:
        if pl.get('bbox') is None: continue
        if not (pl['mode'] == 'stand' or (pl['mode'] == 'float' and g.layout == 'floating-shadows')): continue
        x0, y0, x1, y1 = pl['bbox']
        by = pl['base'] if pl['mode'] == 'stand' else y1 + pl.get('lift', 60)
        ped.append([x0, x1, by])
    ped.sort(key=lambda p: p[2])
    clusters = []
    for p in ped:
        for c in clusters:
            if abs(c[2] - p[2]) < 30:
                c[0] = min(c[0], p[0]); c[1] = max(c[1], p[1]); c[2] = max(c[2], p[2]); break
        else:
            clusters.append(list(p))
    # on a dark ground, a lighter tone of the ground itself (as Apple sets one)
    col = T['hi'] if not g.p.dark else lighten(labmix(T['base2'], T['mid'], 0.45), 0.05)
    if r.random() < 0.4 and not g.p.dark:
        col = labmix(col, T['accs'], 0.5)
    ctop = lab2lin(lighten(col, 0.04)); cb = lab2lin(col)
    lx = g.lx
    info = []
    neon = lab2lin(tint(T['accs'] if g.p.dark else T['acc'], 0.80, 1.35))
    if kind == 'neon':                              # a dark drum, so its rings carry the light
        cb = lab2lin(lighten(labmix(T['base'], T['deep'], 0.5), -0.06 if g.p.dark else -0.30))
        ctop = lab2lin(lighten(labmix(T['base'], T['deep'], 0.5), -0.02 if g.p.dark else -0.24))
    for (x0, x1, by) in sorted(clusters, key=lambda c: c[2]):
        cx = (x0 + x1) / 2
        rx = max((x1 - x0) / 2 * 1.08 + 40, 150)
        ry = rx * 0.13
        top = by - ry * 0.25
        base = max(top + H * r.uniform(0.07, 0.16), g.hy + 60)
        base = min(base, H + ry)
        if kind == 'tiered':
            # two drums: a wide low step, the products on a narrower one above it
            step = top + (base - top) * 0.52
            img = _drum(g, img, cx, step, base + ry * 0.15, rx * 1.32, ry * 1.32, cb * 0.72, ctop * 0.84, True)
            img = _drum(g, img, cx, top, step + ry * 0.35, rx, ry, cb, ctop, False)
        else:
            img = _drum(g, img, cx, top, base, rx, ry, cb, ctop, True)
        if kind == 'neon':
            dx = XX - cx
            ring = np.zeros((H, W), F)
            for yc, w_ in ((top, 1.6), (base, 2.2)):
                d = np.sqrt((dx / rx) ** 2 + ((YY - yc) / ry) ** 2)
                band = np.exp(-(((d - 1) * ry) / w_) ** 2)
                if yc == base: band *= (YY > base)          # the front half of the foot
                ring = np.maximum(ring, band)
            glow = ring * 0.9 + gblur(ring, 6) * 1.6 + gblur(ring, 26) * 1.4
            img = screen(img, np.clip(glow, 0, 1)[..., None] * neon)
            # its light on the floor
            img = screen(img, (gauss2(cx, base + ry * 0.6, rx * 1.15, ry * 1.6) * 0.22)[..., None] * neon)
        info.append((cx, top, rx, ry))
    g.podiums = info
    return img

def _drum(g, img, cx, top, base, rx, ry, cb, ctop, cast):
    """one cylinder seen from a little above: body, lit top, a fine rim"""
    lx = g.lx
    dx = XX - cx
    if cast:                                        # floor contact / cast shadow
        sh = gauss2(cx - lx * 60, base + 6, rx * 1.05, ry * 1.2)
        shade(img, sh, 0.35, g.p.shadow)
    rect = np.clip(rx - np.abs(dx) + 0.5, 0, 1) * np.clip(YY - top + 0.5, 0, 1) * np.clip(base - YY + 0.5, 0, 1)
    db = np.sqrt((dx / rx) ** 2 + ((YY - base) / ry) ** 2)
    ell_b = np.clip((1 - db) * ry + 0.5, 0, 1)
    body = np.maximum(rect, ell_b)
    nx = np.clip(dx / rx, -1, 1)
    sh_ = 0.80 + 0.2 * np.sqrt(1 - nx ** 2) - 0.13 * nx * lx
    vg = 1 - 0.10 * np.clip((YY - top) / (base - top + 1), 0, 1)
    bodycol = cb[None, None] * (sh_ * vg)[..., None]
    img = lerp(img, bodycol, body)
    dt = np.sqrt((dx / rx) ** 2 + ((YY - top) / ry) ** 2)
    ell_t = np.clip((1 - dt) * ry + 0.5, 0, 1)
    topcol = ctop[None, None] * (1.02 + 0.05 * np.clip(1 - dt, 0, 1))[..., None]
    img = lerp(img, topcol, ell_t)
    rim = np.exp(-(((dt - 1) * ry) / 1.2) ** 2) * (YY > top)
    img += (rim * 0.06)[..., None]
    return img

def st_glass(g):
    r = g.rng; T = g.p.t
    stops = [(T['base'], 0.6)]
    for c in [T['accs'], T['sups'], T['hi'], T['sup' if g.p.dark else 'sups']][:r.integers(3, 5)]:
        px, py = r.uniform(0.1, 0.9), r.uniform(0.3, 1.0)
        s = r.uniform(0.12, 0.22)
        stops.append((c, np.exp(-((xn - px) ** 2 + (yn - py) ** 2) / (2 * s * s)) * 1.3))
    img = paint(stops)
    frost = gblur(img, 30)
    x0, y0, x1, y1 = g.region
    b = union(g.pls)
    # one frosted pane holds the whole group, like a display case; a second,
    # smaller pane is drawn only where it touches no product
    for k in range(r.integers(1, 3)):
        if k == 0:
            pw, ph = min(W * 0.94, b[2] - b[0] + 140), min(H * 0.6, b[3] - b[1] + 120)
            cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2 + 10
            rad = r.uniform(40, 70); ang = 0.0
        else:
            pw, ph = r.uniform(0.2, 0.32) * W, r.uniform(0.12, 0.2) * H
            cx, cy = r.uniform(0.2, 0.8) * W, r.uniform(0.08, 0.3) * H
            rad = r.uniform(28, 48); ang = r.uniform(-0.12, 0.12)
        dx, dy = XX - cx, YY - cy
        qx = np.abs(dx * math.cos(ang) + dy * math.sin(ang)) - (pw / 2 - rad)
        qy = np.abs(-dx * math.sin(ang) + dy * math.cos(ang)) - (ph / 2 - rad)
        d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - rad
        if k and crosses(d, g.keep):
            continue
        cov = np.clip(0.5 - d, 0, 1)
        shadow = gblur(np.roll(cov, 22, 0), 26)
        shade(img, shadow * (1 - cov), 0.22, g.p.shadow)
        fr = lerp(frost, np.ones(3, F) * (0.9 if not g.p.dark else 0.35), 0.16 if not g.p.dark else 0.10)
        img = lerp(img, fr, cov)
        gy, gx = np.gradient(d)
        nn = np.hypot(gx, gy) + 1e-6
        spec = np.clip(-(gx * -0.55 + gy * -0.83) / nn, 0, 1) ** 2
        rim = np.exp(-((d + 1.5) / 1.3) ** 2)
        img += (rim * (0.30 * spec + 0.05))[..., None]
        img += (np.exp(np.minimum(d, 0) / 22) * (d < 0) * 0.05)[..., None]
    return img

def st_conic(g):
    r = g.rng; T = g.p.t
    cx, cy = g.pc[0] + r.uniform(-150, 150), g.pc[1] + r.uniform(-60, 120)
    th = np.arctan2(YY - cy, XX - cx)
    rr = np.hypot(XX - cx, YY - cy) / W
    tw = r.uniform(-3, 3); p = r.uniform(0, 6.28)
    t1 = 0.5 + 0.5 * np.cos(th + tw * rr + p)
    t2 = 0.5 + 0.5 * np.cos(2 * th - tw * rr * 0.7 + p * 1.7)
    img = paint([(T['base'], 0.55 + rr), (T['accs'], t1 ** 2 * 0.9), (T['sups'], (1 - t1) ** 2 * 0.8),
                 (T['hi'], t2 ** 3 * 0.5)])
    img = lerp(img, gblur(img, 30), np.exp(-rr / 0.06))
    return gblur(img, 1.2)

def st_rings(g):
    r = g.rng; T = g.p.t
    cx, cy = g.pc[0] + r.uniform(-80, 80), g.pc[1] + r.uniform(0, 140)
    rr = np.hypot(XX - cx, YY - cy)
    img = paint([(T['hi'] if not g.p.dark else T['base2'], np.exp(-(rr / (0.35 * W)) ** 2)),
                 (T['base'], 0.6), (T['sups'], np.exp(-(rr / (0.18 * W)) ** 2) * 0.6)])
    sp = r.uniform(24, 42); gam = r.uniform(0.9, 1.05)
    ph = (rr / sp) ** gam
    fade = np.exp(-rr / (0.62 * W))
    img *= (1 + 0.035 * np.sin(2 * np.pi * ph) * fade)[..., None]
    dist = np.abs(np.mod(ph + 0.5, 1) - 0.5) * sp
    cov = np.clip(1.1 - dist, 0, 1) * fade
    lc = lab2lin(T['hi'] if g.p.dark else T['deep'])
    return lerp(img, lc, cov * 0.3)

def st_grid(g):
    r = g.rng; T = g.p.t
    img = base_grad(g)
    cx, cy = g.pc
    glow = gauss2(cx, cy, W * 0.28)
    img = screen(img, glow[..., None] * lab2lin(T['acc'] if g.p.dark else T['sups']) * (0.45 if g.p.dark else 0.5))
    sp = float(r.choice([36, 40, 45, 54, 60]))
    ox, oy = r.uniform(0, sp), r.uniform(0, sp)
    dxl = np.abs(np.mod(XX - ox + sp / 2, sp) - sp / 2)
    dyl = np.abs(np.mod(YY - oy + sp / 2, sp) - sp / 2)
    cov = np.clip(1.0 - np.minimum(dxl, dyl), 0, 1)
    maj = np.clip(1.4 - np.minimum(np.abs(np.mod(XX - ox + sp * 2, sp * 4) - sp * 2),
                                   np.abs(np.mod(YY - oy + sp * 2, sp * 4) - sp * 2)), 0, 1)
    fade = np.exp(-np.hypot(XX - cx, YY - cy) / (0.55 * W))
    lc = lab2lin(T['hi'] if g.p.dark else T['deep'])
    return lerp(img, lc, np.maximum(cov * 0.22, maj * 0.32) * (0.25 + 0.75 * fade))

def st_halftone(g):
    r = g.rng; T = g.p.t
    img = base_grad(g)
    sp = r.uniform(14, 22); h = sp * math.sqrt(3) / 2
    def near(ox, oy):
        dx = XX - ox - np.round((XX - ox) / sp) * sp
        dy = YY - oy - np.round((YY - oy) / (2 * h)) * (2 * h)
        return np.hypot(dx, dy)
    d = np.minimum(near(0, 0), near(sp / 2, h))
    cx, cy = g.pc
    ang = r.uniform(0, 6.28)
    f = np.clip(0.9 - np.hypot(XX - cx, YY - cy) / (0.75 * W) + 0.15 * fbm(r, 2, 2), 0, 1)
    if r.random() < 0.5:
        f = np.clip(0.5 + 0.5 * np.sin(((XX - cx) * math.cos(ang) + (YY - cy) * math.sin(ang)) / W * 5), 0, 1) * f + f * 0.3
    f = f * (1 - g.calm * 0.85)
    rad = sp * 0.46 * f ** 1.2
    cov = np.clip(rad - d + 0.5, 0, 1) * (rad > 0.4)
    lc = lab2lin(T['accs'] if not g.p.dark else labmix(T['base2'], T['acc'], 0.5))
    return lerp(img, lc, cov * 0.75)

def st_topo(g):
    r = g.rng; T = g.p.t
    cx, cy = g.pc
    n = fbm(r, 2, 3) * 0.6 + 1.6 * np.exp(-(((XX - cx) / (0.3 * W)) ** 2 + ((YY - cy) / (0.3 * H)) ** 2))
    img = paint([(T['base'], 1.0), (T['base2'], np.clip(n / 2.5, 0, 1))])
    L = r.uniform(5, 8)
    val = n * L
    gy, gx = np.gradient(val)
    gm = np.maximum(np.hypot(gx, gy), 1e-3)
    dd = np.abs(np.mod(val + 0.5, 1) - 0.5) / gm
    cov = np.clip(0.9 - dd, 0, 1)
    val5 = val / 5
    dd5 = np.abs(np.mod(val5 + 0.5, 1) - 0.5) / (gm / 5)
    cov5 = np.clip(1.5 - dd5, 0, 1)
    lc = lab2lin(T['hi'] if g.p.dark else T['deep'])
    return lerp(img, lc, np.maximum(cov * 0.25, cov5 * 0.4))

def keep_mask(g, pad=26):
    """Where the products stand (their boxes, padded), soft-edged: shapes keep their edges out of it."""
    m = np.zeros((H, W), F)
    for p in g.pls:
        x0, y0, x1, y1 = p['bbox']
        m[max(0, int(y0 - pad)):min(H, int(y1 + pad)), max(0, int(x0 - pad)):min(W, int(x1 + pad))] = 1
    return m

def crosses(d, keep, band=28):
    """True when a shape's edge (|sdf| < band) runs through a product."""
    return bool(np.any((np.abs(d) < band) & (keep > 0.5)))

def st_papercut(g):
    r = g.rng; T = g.p.t
    x0, y0, x1, y1 = g.region
    cx, cy = g.pc
    if g.zone == 'top':
        bias = ss(0.25, 1.1, yn)
    elif g.zone == 'left':
        bias = ss(0.25, 1.1, xn)
    else:
        bias = ss(0.25, 1.1, 1 - xn)
    f = 0.35 * fbm(r, 2, 3) + 1.4 * bias + 0.4 * np.exp(-(((XX - cx) / 380) ** 2 + ((YY - cy) / 300) ** 2))
    img = paint([(T['base'], 1.0), (T['base2'], yn * 0.4)])
    n = r.integers(4, 6)
    qs = np.quantile(f, np.linspace(0.45, 0.88, n))
    gy, gx = np.gradient(f); gm = np.maximum(np.hypot(gx, gy), 1e-4)
    if g.p.dark:
        cols = [labmix(T['base'], T['base2'], 1.0), T['sups'], labmix(T['base2'], T['hi'], 0.5), T['accs'], T['hi']]
    else:
        cols = [T['base2'], T['sups'], T['accs'], labmix(T['sups'], T['deep'], 0.5), T['deep']]
    for k in range(n):
        m = np.clip((f - qs[k]) / gm + 0.5, 0, 1)
        sh = gblur(np.roll(np.roll(m, 10, 0), int(-g.lx * 6), 1), 9)
        shade(img, sh * (1 - m), 0.30, g.p.shadow)
        c = lab2lin(cols[k % len(cols)])
        layer = c[None, None] * (1 + 0.05 * (1 - yn))[..., None]
        img = lerp(img, layer, m)
        img += (np.exp(-(((f - qs[k]) / gm) - 1.2) ** 2 / 1.5) * 0.04)[..., None]
    return img

def _sdf_cov(d):
    return np.clip(0.5 - d, 0, 1)

def st_bauhaus(g):
    r = g.rng; T = g.p.t
    img = paint([(T['base'], 1.0)])
    img *= (1 + 0.012 * fbm(r, 60, 1))[..., None]
    x0, y0, x1, y1 = g.region
    cx, cy = g.pc
    pool = [T['acc'], T['sup'], T['mid'] if not g.p.dark else T['hi'], T['deep'] if not g.p.dark else T['base2']]
    order = r.permutation(len(pool))
    cols = [lab2lin(labmix(pool[i], T['base'], 0.15)) for i in order]
    shapes = r.permutation(['circle', 'half', 'quarter', 'bar', 'arc'])[:r.integers(3, 5)]
    for k, s in enumerate(shapes):
        c = cols[k % len(cols)]
        b = union(g.pls)
        gR = 0.5 * math.hypot(b[2] - b[0], b[3] - b[1]) + 40
        if s == 'circle':
            R = min(gR, 0.49 * W)
            ox, oy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            d = np.hypot(XX - ox, YY - oy) - R
            if crosses(d, g.keep):          # the group is too wide for one circle: a plinth disc below it instead
                R = 0.5 * (b[2] - b[0]) + 60
                d = np.hypot(XX - ox, (YY - (b[3] + R * 0.55)) * 1.0) - R
        elif s == 'half':
            R = r.uniform(0.2, 0.34) * W
            ox = r.uniform(x0, x1); oy = H + r.uniform(-40, 40) if g.zone == 'top' else r.uniform(y0 + 200, y1)
            if g.zone != 'top':
                ox = W if g.zone == 'left' else 0
            d = np.hypot(XX - ox, YY - oy) - R
        elif s == 'quarter':
            R = r.uniform(0.25, 0.42) * W
            if g.zone == 'top':
                ox, oy = (0 if r.random() < 0.5 else W), H
            else:
                ox = W if g.zone == 'left' else 0; oy = 0 if r.random() < 0.5 else H
            d = np.hypot(XX - ox, YY - oy) - R
        elif s == 'bar':
            ang = r.choice([0, 0, math.pi / 2, math.pi / 4, -math.pi / 4])
            L, Th = r.uniform(0.4, 0.8) * W, r.uniform(26, 70)
            ox, oy = r.uniform(x0, x1), r.uniform(max(y0, 0.5 * H), y1)
            dx, dy = XX - ox, YY - oy
            u = dx * math.cos(ang) + dy * math.sin(ang); v = -dx * math.sin(ang) + dy * math.cos(ang)
            qx, qy = np.abs(u) - L / 2, np.abs(v) - Th / 2
            d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0)
        else:
            Th = r.uniform(18, 40); R = gR + 30 + Th
            ox, oy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
            d = np.abs(np.hypot(XX - ox, YY - oy) - R) - Th / 2
            hp = -(YY - oy)  # keep upper half
            d = np.maximum(d, -hp) if r.random() < 0.6 else d
        if s in ('half', 'quarter', 'bar', 'arc') and crosses(d, g.keep):
            continue                         # an edge through a product reads as an overlap: drop the shape
        cov = _sdf_cov(d) * (1 - 0.75 * g.calm)
        img = lerp(img, c, cov)
    return img

def st_rothko(g):
    r = g.rng; T = g.p.t
    field = labmix(T['base'], T['base2'], 0.6)
    img = paint([(field, 1.0)])
    nb = r.integers(2, 4)
    horiz = True
    marg = r.uniform(50, 90)
    cand = [T['accs'], T['sups'], T['deep'] if not g.p.dark else T['hi'], T['base'], labmix(T['accs'], T['sups'], 0.5)]
    r.shuffle(cand)
    fr = np.cumsum(r.uniform(0.6, 1.4, nb)); fr = np.concatenate([[0], fr / fr[-1]])
    # the last block starts above the products, so no block edge crosses them
    uy0 = union(g.pls)[1]
    cut = np.clip((uy0 - 60 - marg) / (H - 2 * marg), 0.15, 0.85)
    fr = np.concatenate([fr[:-1] * cut / max(fr[-2], 1e-3), [1.0]]) if nb > 1 else fr
    wn = fbm(r, 8, 3)
    for k in range(nb):
        if horiz:
            a0, a1 = marg + fr[k] * (H - 2 * marg) + 14, marg + fr[k + 1] * (H - 2 * marg) - 14
            d = np.maximum(np.maximum(a0 - YY, YY - a1), np.maximum(marg - XX, XX - (W - marg)))
        else:
            a0, a1 = marg + fr[k] * (W - 2 * marg) + 14, marg + fr[k + 1] * (W - 2 * marg) - 14
            d = np.maximum(np.maximum(a0 - XX, XX - a1), np.maximum(marg - YY, YY - (H - marg)))
        d = d + wn * 7
        cov = ss(22, -22, d)
        c = lab2lin(cand[k % len(cand)])
        lum_ = 1 + 0.06 * np.clip(-d / 200, 0, 1)
        img = lerp(img, c[None, None] * lum_[..., None], cov * 0.92)
    img *= (1 + 0.015 * fbm(r, 120, 1))[..., None]
    return img

def st_marble(g):
    r = g.rng; T = g.p.t
    q1, q2 = fbm(r, 2, 4), fbm(r, 2, 4)
    xw, yw = XX + 90 * q1, YY + 90 * q2
    mx, my = xw.astype(F), yw.astype(F)
    n2 = fbm(r, 3, 4)
    f = cv2.remap(n2, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    f = (f - f.min()) / (f.max() - f.min())
    img = paint([(T['base'], (1 - f) ** 2 + 0.2), (T['base2'], 2 * f * (1 - f)), (T['sups'], f ** 3 * 0.8),
                 (T['accs'], np.clip(f - 0.75, 0, 1) * 3)])
    k = r.uniform(5, 9)
    vein = np.exp(-np.abs(np.sin(f * math.pi * k)) / 0.05) * ss(0.2, 0.8, f)
    img = lerp(img, lab2lin(T['hi']), vein * 0.35)
    return gblur(img, 0.8)

def st_bokeh(g):
    r = g.rng; T = g.p.t
    img = paint([(T['base'], 1 - yn * 0.6), (T['base2'], yn), (T['sups'], gauss2(*g.pc, W * 0.3) * 0.7)])
    cols = [lab2lin(T[k]) for k in (('acc', 'sup', 'hi') if g.p.dark else ('accs', 'sups', 'hi'))]
    layers = []
    for layer in range(2):
        buf = np.zeros((H, W, 3), F)
        n = r.integers(10, 20)
        cnt = 0
        while cnt < n:
            x, y = r.uniform(-50, W + 50), r.uniform(-50, H + 50)
            if g.calm[int(np.clip(y, 0, H - 1)), int(np.clip(x, 0, W - 1))] > 0.5 and r.random() < 0.75:
                continue
            cnt += 1
            R = r.uniform(18, 50) if layer else r.uniform(40, 110)
            op = r.uniform(0.10, 0.28) if layer else r.uniform(0.06, 0.16)
            c = cols[r.integers(len(cols))]
            xa, xb = int(max(0, x - R - 3)), int(min(W, x + R + 3)); ya, yb = int(max(0, y - R - 3)), int(min(H, y + R + 3))
            if xb <= xa or yb <= ya: continue
            d = np.hypot(XX[ya:yb, xa:xb] - x, YY[ya:yb, xa:xb] - y)
            disc = np.clip(R - d + 0.5, 0, 1) * (0.85 + 0.15 * (d / R)) + 0.25 * np.exp(-((d - R * 0.94) / (R * 0.05)) ** 2)
            buf[ya:yb, xa:xb] += disc[..., None] * c * op
        layers.append(gblur(buf, 9 if layer == 0 else 1.2))
    add = layers[0] + layers[1]
    return screen(img, add) if g.p.dark else screen(img, add * 0.9)

def st_pinstripe(g):
    r = g.rng; T = g.p.t
    ang = r.uniform(0.45, 1.1) * (1 if r.random() < 0.5 else -1)
    nx, ny = math.cos(ang), math.sin(ang)
    cx, cy = g.pc
    u = (XX - cx) * nx + (YY - cy) * ny
    split = np.clip(u / 2 + 0.5, 0, 1)
    img = paint([(T['base'], 1 - split), (T['base2'], split)])
    # the band holds the whole group, so its edges and the thin line run clear of every product
    b = union(g.pls)
    cu = [(x - cx) * nx + (y - cy) * ny for x in (b[0], b[2]) for y in (b[1], b[3])]
    u0 = (min(cu) + max(cu)) / 2; hw = (max(cu) - min(cu)) / 2 + r.uniform(40, 80)
    band = np.clip(hw - np.abs(u - u0) + 0.5, 0, 1)
    img = lerp(img, lab2lin(T['accs'] if r.random() < 0.6 else T['sups']), band * 0.85)
    off = hw + r.uniform(30, 70); th = r.uniform(8, 18)
    thin = np.clip(th / 2 - np.abs(u - u0 - off) + 0.5, 0, 1)
    img = lerp(img, lab2lin(T['acc'] if g.p.dark else labmix(T['acc'], T['base'], 0.2)), thin * 0.9)
    sp = r.uniform(9, 14)
    v = (XX - cx) * nx + (YY - cy) * ny
    dl = np.abs(np.mod(v + sp / 2, sp) - sp / 2)
    lines = np.clip(0.9 - dl, 0, 1) * band
    return lerp(img, lab2lin(T['hi'] if g.p.dark else T['base']), lines * 0.35)

def st_prisms(g):
    r = g.rng; T = g.p.t
    img = base_grad(g, 'deep' if g.p.dark else 'base', 'base' if g.p.dark else 'base2')
    sx = r.choice([-0.15, 1.15]) * W; sy = -0.12 * H
    phi = np.arctan2(YY - sy, XX - sx); rho = np.hypot(XX - sx, YY - sy)
    tgt = math.atan2(g.pc[1] - sy, g.pc[0] - sx)
    add = np.zeros((H, W, 3), F)
    cs = [lab2lin(T['acc']), np.ones(3, F) * 0.9, lab2lin(T['sup'])]
    for j in range(r.integers(4, 7)):
        a = tgt + r.uniform(-0.35, 0.35); w = r.uniform(0.012, 0.04); it = r.uniform(0.3, 0.8)
        for m, c in enumerate(cs):
            add += (np.exp(-((phi - a - (m - 1) * w * 0.6) / w) ** 2) * it * 0.45)[..., None] * c
    fall = np.exp(-rho / (1.1 * W)) * ss(0, 0.25 * W, rho)
    add *= fall[..., None]
    leak = gauss2(sx, sy + 0.1 * H, 0.35 * W)
    add += (leak * 0.35)[..., None] * lab2lin(T['acc'])
    img = screen(img, add * (0.6 if g.p.dark else 0.45))
    x0, y0, x1, y1 = g.region
    for k in range(r.integers(1, 3)):
        cx, cy = r.uniform(x0 + 80, x1 - 80), r.uniform(max(y0, 0.55 * H), y1)
        R = r.uniform(120, 230); a0 = r.uniform(0, 6.28)
        pts = np.array([[cx + R * math.cos(a0 + i * 2.094), cy + R * math.sin(a0 + i * 2.094)] for i in range(3)])
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.round(pts * 16).astype(np.int32)], 255, cv2.LINE_AA, shift=4)
        m = m.astype(F) / 255
        if np.any((m > 0.1) & (g.keep > 0.5)):
            continue
        shifted = np.roll(np.roll(img, 10, 1), -6, 0)
        img = lerp(img, lerp(shifted, np.ones(3, F), 0.12), m * 0.8)
        e = np.zeros((H, W), np.uint8)
        cv2.polylines(e, [np.round(pts * 16).astype(np.int32)], True, 255, 2, cv2.LINE_AA, shift=4)
        img += (e.astype(F) / 255 * 0.22)[..., None]
    return img

def st_terrazzo(g):
    r = g.rng; T = g.p.t
    img = paint([(T['base'], 1.0), (T['base2'], np.clip(0.5 + 0.3 * fbm(r, 3, 3), 0, 1) * 0.6)])
    names = ['acc', 'sup', 'mid', 'deep' if not g.p.dark else 'hi', 'accs']
    masks = {k: np.zeros((H, W), np.uint8) for k in names}
    n = r.integers(26, 46); cnt = 0; tries = 0
    while cnt < n and tries < 2000:
        tries += 1
        x, y = r.uniform(0, W), r.uniform(0, H)
        if g.calm[int(min(y, H - 1)), int(min(x, W - 1))] > 0.4 and r.random() < 0.85:
            continue
        if g.keep[int(min(y, H - 1)), int(min(x, W - 1))] > 0.5:
            continue
        cnt += 1
        s = float(np.clip(r.lognormal(3.15, 0.4), 12, 70))
        nv = r.integers(5, 8); a0 = r.uniform(0, 6.28)
        pts = [[x + s * r.uniform(0.6, 1.0) * math.cos(a0 + i * 6.283 / nv),
                y + s * r.uniform(0.6, 1.0) * math.sin(a0 + i * 6.283 / nv) * r.uniform(0.6, 1)] for i in range(nv)]
        k = names[min(int(r.random() ** 1.3 * len(names)), len(names) - 1)]
        cv2.fillPoly(masks[k], [np.round(np.array(pts) * 8).astype(np.int32)], 255, cv2.LINE_AA, shift=3)
    for k, m in masks.items():
        c = lab2lin(labmix(g.p.t[k], T['base'], 0.2))
        img = lerp(img, c, m.astype(F) / 255 * 0.9)
    return gblur(img, 0.4)

def st_splatter(g):
    """Paint splats: a ragged body, flung droplets, a fine spray, sometimes a drip."""
    r = g.rng; T = g.p.t
    img = paint([(T['base'], 1.0), (T['base2'], yn * 0.5)])
    cols = [T['acc'], T['sup'], T['hi'] if g.p.dark else T['mid'], T['accs']]
    n = int(r.integers(4, 8)); placed = 0; tries = 0
    while placed < n and tries < 160:
        tries += 1
        R = float(r.uniform(55, 140))
        x, y = r.uniform(0.06, 0.94) * W, r.uniform(0.10, 0.96) * H
        sub = g.keep[max(0, int(y - R * 1.3)):int(y + R * 1.3), max(0, int(x - R * 1.3)):int(x + R * 1.3)]
        if sub.size and sub.max() > 0.5:
            continue
        if g.calm[int(min(y, H - 1)), int(min(x, W - 1))] > 0.5 and abs(x - W / 2) < 0.3 * W:
            continue                                        # the middle of the headline zone stays clean; its corners may take paint
        placed += 1
        m = np.zeros((H * 4 // 4, W), np.uint8)
        k = 72; th = np.linspace(0, 2 * math.pi, k, endpoint=False)
        rad = R * (1 + 0.18 * np.sin(th * r.integers(3, 7) + r.uniform(0, 6)) + 0.12 * r.standard_normal(k))
        spikes = r.random(k) < 0.18
        rad = np.where(spikes, rad * r.uniform(1.25, 1.7, k), rad)
        pts = np.stack([x + rad * np.cos(th), y + rad * np.sin(th)], 1)
        cv2.fillPoly(m, [np.round(pts * 8).astype(np.int32)], 255, cv2.LINE_AA, shift=3)
        for _ in range(int(r.integers(8, 18))):            # flung droplets along rays
            a = r.uniform(0, 2 * math.pi); dd = R * r.uniform(1.3, 2.6); rr = max(2.0, R * r.uniform(0.04, 0.14) * (2.6 - dd / R) / 1.3)
            cv2.circle(m, (int((x + dd * math.cos(a)) * 8), int((y + dd * math.sin(a)) * 8)), int(rr * 8), 255, -1, cv2.LINE_AA, shift=3)
        for _ in range(int(r.integers(40, 90))):           # fine spray
            a = r.uniform(0, 2 * math.pi); dd = R * abs(r.normal(1.6, 0.6))
            cv2.circle(m, (int((x + dd * math.cos(a)) * 8), int((y + dd * math.sin(a)) * 8)), int(r.uniform(0.8, 2.4) * 8), 255, -1, cv2.LINE_AA, shift=3)
        if r.random() < 0.45:                               # a drip
            L = R * r.uniform(1.2, 2.8); wv = R * r.uniform(0.12, 0.22); dx = r.uniform(-0.4, 0.4) * R
            cv2.rectangle(m, (int((x + dx - wv / 2) * 8), int(y * 8)), (int((x + dx + wv / 2) * 8), int((y + L) * 8)), 255, -1, cv2.LINE_AA, shift=3)
            cv2.circle(m, (int((x + dx) * 8), int((y + L) * 8)), int(wv * 0.75 * 8), 255, -1, cv2.LINE_AA, shift=3)
        mf = m.astype(F) / 255 * (1 - 0.35 * g.calm) * (1 - g.keep)
        c = lab2lin(cols[placed % len(cols)])
        sh = gblur(np.roll(np.roll(mf, 4, 0), 3, 1), 3)
        shade(img, sh * (1 - mf), 0.18, g.p.shadow)        # paint sits ON the ground
        img = lerp(img, c[None, None] * (1 + 0.06 * gblur(mf, 6) - 0.03)[..., None], mf * 0.95)
    return img

def st_sunburst(g):
    r = g.rng; T = g.p.t
    cx, cy = g.pc[0], g.pc[1] + r.uniform(40, 200)
    rr = np.hypot(XX - cx, YY - cy); ph = np.arctan2(YY - cy, XX - cx)
    img = paint([(T['base'], 0.6 + rr / W), (T['hi'] if not g.p.dark else T['base2'], np.exp(-(rr / (0.3 * W)) ** 2) * 1.4),
                 (T['sups'], np.exp(-(rr / (0.18 * W)) ** 2) * 0.6)])
    N = int(r.integers(14, 26)); p = r.uniform(0, 6.28)
    s = np.cos(N * ph + p)
    aa = np.maximum(N * 1.2 / np.maximum(rr, 1), 0.02)
    stripe = ss(-aa, aa, s)
    k = 0.07 if g.p.dark else 0.05
    img *= (1 + k * stripe * np.exp(-rr / (0.7 * W)) * ss(10, 80, rr))[..., None]
    return img

# ---- 2026-10-04 (owner: "more variety?" -> more background styles)

def st_showroom(g):
    """a polished showroom: a lit back wall, light strips overhead, a floor that mirrors"""
    r = g.rng; T = g.p.t; hy = g.hy
    wall = labmix(T['base'], T['deep'], 0.25) if not g.p.dark else T['base']
    flo = lighten(T['base2'], -0.03) if not g.p.dark else lighten(T['base'], -0.02)
    wt = np.clip(YY / hy, 0, 1)
    img = paint([(lighten(wall, -0.05), 1 - wt), (wall, wt)])
    ft = np.clip((YY - hy) / (H - hy), 0, 1)
    img = lerp(img, paint([(lighten(flo, 0.03), 1 - ft), (lighten(flo, -0.04), ft)]), ss(hy - 4, hy + 6, YY))
    # strip lights on the wall, kept out of the headline
    n = r.integers(3, 6); lc = np.ones(3, F) if not g.p.dark else lab2lin(labmix(T['hi'], T['sups'], 0.4))
    ytop = 0.18 * H + r.uniform(0, 0.06 * H)
    add = np.zeros((H, W), F)
    for i in range(n):
        cx = (i + 0.5) / n * W + r.uniform(-20, 20); w = W / n * r.uniform(0.45, 0.62)
        band = ss(cx - w / 2 - 6, cx - w / 2 + 6, XX) * (1 - ss(cx + w / 2 - 6, cx + w / 2 + 6, XX))
        add += band * np.exp(-((YY - ytop) / 16) ** 2)
    glow = gblur(add, 40) * 1.2 + gblur(add, 6) * 0.8
    img = screen(img, glow[..., None] * lc * (0.38 if g.p.dark else 0.22))
    # the strips again, soft, in the floor
    refl = np.zeros((H, W), F)
    yy = (2 * hy - YY)
    for i in range(n):
        cx = (i + 0.5) / n * W; w = W / n * 0.5
        refl += ss(cx - w / 2 - 20, cx - w / 2 + 20, XX) * (1 - ss(cx + w / 2 - 20, cx + w / 2 + 20, XX)) * \
            np.exp(-((YY - hy - (hy - ytop) * 0.35) / 60) ** 2)
    img = screen(img, (gblur(refl, 30) * 0.18 * (YY > hy))[..., None] * lc)
    spot = gauss2(g.pc[0], hy - 0.08 * H, W * 0.32, H * 0.22)
    img = img + (spot * (0.12 if g.p.dark else 0.07))[..., None] * lc
    g.floor = True
    return img

def st_concrete(g):
    """a concrete wall and a polished concrete floor, the palette washed through both"""
    r = g.rng; T = g.p.t; hy = g.hy
    grey = tint(T['base'], T['base'][0], 0.35)
    wall = labmix(grey, T['base2'], 0.35)
    tex = fbm(r, 4, 5, 0.55)
    fine = gblur(r.standard_normal((H, W)).astype(F), 0.7)
    blot = ss(0.8, 2.2, fbm(r, 6, 3))
    wt = np.clip(YY / hy, 0, 1)
    img = paint([(lighten(wall, -0.03), 1 - wt), (wall, wt)])
    k = 0.035 if g.p.dark else 0.05
    img = img * (1 + k * tex + 0.018 * fine - 0.05 * blot)[..., None]
    # formwork seams and tie holes, away from the products
    for i in range(1, 4):
        x = i * W / 4 + r.uniform(-8, 8)
        line = np.exp(-((XX - x) / 1.2) ** 2) * (YY < hy) * (1 - g.keep)
        img *= (1 - 0.10 * line)[..., None]
    for i in range(1, 4):
        for j in (0.22, 0.52):
            hx, hyy = i * W / 4 - W / 8, j * hy
            if g.keep[int(min(hyy, H - 1)), int(hx)] > 0.5: continue
            img *= (1 - 0.18 * gauss2(hx, hyy, 5))[..., None]
    ft = np.clip((YY - hy) / (H - hy), 0, 1)
    flo = paint([(lighten(grey, 0.02), 1 - ft), (lighten(grey, -0.05), ft)]) * (1 + 0.03 * tex)[..., None]
    img = lerp(img, flo, ss(hy - 3, hy + 5, YY))
    img = img + (gauss2(g.pc[0], hy - 0.1 * H, W * 0.3, H * 0.25) * (0.10 if g.p.dark else 0.06))[..., None]
    g.floor = True
    return img

def st_sky(g):
    """open sky: the palette's light at the horizon, its deep at the top, thin cloud"""
    r = g.rng; T = g.p.t
    top = T['deep'] if g.p.dark else labmix(T['base2'], T['sups'], 0.4)
    hor = labmix(T['hi'], T['base'], 0.3) if g.p.dark else T['hi']
    t = np.clip(yn / 0.85, 0, 1) ** 1.3
    img = paint([(top, 1 - t), (hor, t)])
    c = fbm(r, 3, 5, 0.55) + 0.6 * fbm(r, 7, 3)
    cloud = ss(0.6, 1.8, c) * ss(0.15, 0.55, yn) * (1 - ss(0.75, 0.95, yn))
    cloud *= (1 - g.calm * 0.6)
    cloud = gblur(cloud, 3)
    if not g.p.dark:          # at night a clear sky: cloud on a dark ground reads as smoke
        img = lerp(img, np.ones(3, F) * 0.85, cloud * 0.45)
    sun = gauss2(r.uniform(0.2, 0.8) * W, 0.62 * H, W * 0.35, H * 0.12)
    img = screen(img, (sun * 0.25)[..., None] * lab2lin(T['accs'] if not g.p.dark else T['acc']))
    return img

def st_neon(g):
    """neon at night: a few glowing tubes behind the product, their glow on the floor"""
    r = g.rng; T = g.p.t; hy = g.hy
    base = lighten(T['base'], -0.05) if g.p.dark else T['base']
    wt = np.clip(YY / H, 0, 1)
    img = paint([(lighten(base, -0.03), 1 - wt), (base, wt)])
    cols = [lab2lin(T['acc']), lab2lin(T['sup']), lab2lin(labmix(T['acc'], T['sup'], 0.5))]
    tube = np.zeros((H, W, 3), F)
    for i in range(r.integers(2, 4)):
        m = np.zeros((H, W), np.uint8)
        y = r.uniform(0.40, 0.62) * H; a = r.uniform(-0.25, 0.25)
        x0, x1 = r.uniform(-0.1, 0.3) * W, r.uniform(0.7, 1.1) * W
        p0 = (x0, y - (W / 2 - x0) * math.tan(a)); p1 = (x1, y + (x1 - W / 2) * math.tan(a))
        if r.random() < 0.5:
            cv2.line(m, (int(p0[0] * 16), int(p0[1] * 16)), (int(p1[0] * 16), int(p1[1] * 16)), 255, 7, cv2.LINE_AA, shift=4)
        else:
            cx, cy, R = W / 2 + r.uniform(-120, 120), y - 40, r.uniform(180, 320)
            cv2.ellipse(m, (int(cx * 16), int(cy * 16)), (int(R * 16), int(R * 0.55 * 16)), 0, 180, 360, 255, 7, cv2.LINE_AA, shift=4)
        line = m.astype(F) / 255 * (1 - g.keep) * (1 - g.calm * 0.9)
        c = cols[i % len(cols)]
        tube += (line[..., None] * (c * 0.6 + 0.4)) + gblur(line, 10)[..., None] * c * 1.2 + gblur(line, 40)[..., None] * c * 0.8
    k = 0.85 if g.p.dark else 0.45
    img = screen(img, tube * k)
    # the glow again in a wet floor
    fl = gblur(np.flip(tube, 0), 18)
    shift = int(2 * hy - H)
    refl = np.roll(fl, shift, 0) * (YY > hy)[..., None] * np.exp(-(YY - hy) / 160)[..., None]
    img = screen(img, refl * 0.35 * k)
    img = lerp(img, img * 0.92, ss(hy - 3, hy + 6, YY))
    g.floor = True
    return img

STYLES = OrderedDict([
    ('ios-mesh', (st_mesh, 'plane', 0.0)), ('macos-waves', (st_waves, 'flat', 0.0)),
    ('aurora', (st_aurora, 'plane', 0.0)), ('studio-sweep', (lambda g: st_studio(g), 'floor', 0.0)),
    ('podium', (lambda g: st_studio(g, 'round'), 'floor', 0.0)),
    ('podium-tiered', (lambda g: st_studio(g, 'tiered'), 'floor', 0.0)),
    ('podium-neon', (lambda g: st_studio(g, 'neon'), 'floor', 0.0)), ('liquid-glass', (st_glass, 'plane', 0.0)),
    ('conic-swirl', (st_conic, 'plane', 0.0)), ('ripples', (st_rings, 'plane', 0.5)),
    ('grid-glow', (st_grid, 'plane', 0.6)), ('halftone', (st_halftone, 'flat', 0.5)),
    ('topographic', (st_topo, 'flat', 0.6)), ('paper-cut', (st_papercut, 'flat', 0.2)),
    ('bauhaus', (st_bauhaus, 'flat', 0.0)), ('color-field', (st_rothko, 'flat', 0.0)),
    ('fluid-marble', (st_marble, 'flat', 0.45)), ('bokeh', (st_bokeh, 'plane', 0.0)),
    ('duotone-pinstripe', (st_pinstripe, 'flat', 0.5)), ('prism-light', (st_prisms, 'plane', 0.3)),
    ('terrazzo', (st_terrazzo, 'flat', 0.4)), ('sunburst', (st_sunburst, 'plane', 0.5)),
    ('paint-splatter', (st_splatter, 'flat', 0.3)),
    ('showroom', (st_showroom, 'floor', 0.0)), ('concrete', (st_concrete, 'floor', 0.0)),
    ('sky', (st_sky, 'plane', 0.2)), ('neon-night', (st_neon, 'floor', 0.0)),
])
STYLE_W = {s: 1.0 for s in STYLES}
# patterned grounds: smoothed right behind the products so no line or edge runs through one
BUSY = {'bauhaus', 'color-field', 'paper-cut', 'duotone-pinstripe', 'topographic', 'halftone', 'terrazzo',
        'paint-splatter', 'fluid-marble', 'macos-waves', 'grid-glow', 'ripples'}
STYLE_W['studio-sweep'] = 3.2
STYLE_W['ios-mesh'] = 1.2
STYLE_W['liquid-glass'] = 0.7
# owner, 2026-10-04: "The podium is my absolute favorite", the waves "look exactly
# like Apple ... We should have a lot of those"
STYLE_W['podium'] = 2.4
STYLE_W['podium-tiered'] = 1.8
STYLE_W['podium-neon'] = 1.8
STYLE_W['macos-waves'] = 3.0
PODIUMS = {'podium', 'podium-tiered', 'podium-neon'}

# ----------------------------------------------------------------------------- layouts

# 2026-10-01, the owner: "less overlapping, more spread out and more centered".
# Every layout is centred under a top headline zone and products never touch
# (separate() spreads them until no two alphas overlap). Stacks, cascades,
# depth-of-field, side columns and edge-bleeds are gone.
LAYOUTS = ['hero', 'pair', 'trio', 'lineup', 'spread-fan', 'pyramid', 'floating-row',
           'flatlay-scatter', 'grid-flatlay', 'orbit-arc']
# owner, 2026-10-04: "I do like these sizes but I need some variety ... not all too
# consistent ... Different arrangements maybe?": two on a diagonal, one large with two
# small at its feet, a row that zigzags, a staircase (stepped pedestals on a podium)
# and one large product set off to one side
MORE_LAYOUTS = ['stagger', 'hero-plus', 'zigzag', 'staircase', 'offset']
LAYOUTS += MORE_LAYOUTS
CAR_LAYOUTS = ['hero']   # a car beside another car or a key ring shrinks to a toy at 1080
# owner, 2026-10-04, on a Mac Studio between two iMacs in a scatter: "Maybe the Mac
# studio could be centered?", and of a pyramid, a fan and a pair: "my favorite row of
# three". Macs stand: on one floor line, the odd one (a Mac Studio) in the middle.
MAC_LAYOUTS = ['hero', 'pair', 'trio', 'lineup', 'pyramid', 'spread-fan', 'hero-plus', 'staircase', 'offset']
# The device wall, back from the lab's tile ground (scripts/retheme_lab.mjs, the
# owner's 2026-09-03 favourite; owner, 2026-10-04: "what happened to our tile image
# generator"): the video maker's phones in an even grid, one scale, one angle, every
# screen a different wallpaper, drawn solid (DESIGN-LAW rule 94: no ghost walls)
LAYOUTS_BY = {'cars': CAR_LAYOUTS, 'cars-pair': ['stagger'], 'mac': MAC_LAYOUTS, 'iphone': LAYOUTS + ['device-wall']}
STAND_LAYOUTS = {'hero', 'pair', 'trio', 'lineup', 'pyramid', 'hero-plus', 'staircase', 'offset'}
FLAT_LAYOUTS = {'flatlay-scatter', 'grid-flatlay', 'device-wall'}

def compatible(style, layout):
    if style in PODIUMS and layout not in STAND_LAYOUTS: return False
    if STYLES[style][1] == 'floor' and layout in FLAT_LAYOUTS: return False
    return True

def region_for(zone, layout):
    if zone == 'top':
        return [0.05 * W, 0.40 * H, 0.95 * W, 0.965 * H]
    if layout == 'side-column':
        return [0.60 * W, 0.06 * H, 0.97 * W, 0.965 * H] if zone == 'left' else [0.03 * W, 0.06 * H, 0.40 * W, 0.965 * H]
    return [0.48 * W, 0.08 * H, 0.975 * W, 0.965 * H] if zone == 'left' else [0.025 * W, 0.08 * H, 0.52 * W, 0.965 * H]

def text_rect(zone):
    return {'top': (0, 0, W, 0.36 * H), 'left': (0, 0, 0.44 * W, H), 'right': (0.56 * W, 0, W, H)}[zone]

def calm_mask(zone):
    if zone == 'top':
        return (1 - ss(0.28, 0.46, yn)).astype(F)
    if zone == 'left':
        return (1 - ss(0.36, 0.54, xn)).astype(F)
    return (1 - ss(0.36, 0.54, 1 - xn)).astype(F)

# Owner, 2026-10-04: "standardize the angles ... not super random or super extreme
# tilts ... work within 15° increments": every product stands straight or leans
# 15 degrees, 30 at the most
TILT_STEP, TILT_MAX = 15, 30

def snap_tilt(a):
    return float(np.clip(TILT_STEP * round(a / TILT_STEP), -TILT_MAX, TILT_MAX))

def P(it, S, x, y, mode='stand', rot=0.0, blur=0.0, z=0, lift=0.0, refl=None):
    return dict(it=it, S=float(S), x=float(x), y=float(y), mode=mode, rot=snap_tilt(rot), blur=float(blur), z=z,
                lift=float(lift), refl=refl)

def clamp_rot(it, a):
    m = it['rot']
    return float(np.clip(a, -m, m))

def lay(layout, items, A, rng, hy):
    x0, y0, x1, y1 = A; aw, ah = x1 - x0, y1 - y0; cx = (x0 + x1) / 2
    ars = [aspect(it['name']) for it in items]
    n = len(items); r = rng; out = []
    acc = lambda it: 0.45 if it.get('kind') == 'acc' else 1.0
    base = y1 - 0.02 * H
    phones = all(it['name'].startswith(('qs-iphone', 'ip-', 'iphone', 'photo-iphone', 'view-')) for it in items)
    # phones in a row share one height (they must match); anything else fills its own slot
    fitslot = lambda k, w, h: min(w / math.sqrt(ars[k]), h * math.sqrt(ars[k]))
    if layout == 'hero':
        it = items[0]
        out.append(P(it, min(aw, ah) * 0.82, cx, base, 'stand', clamp_rot(it, r.uniform(-6, 6))))
    elif layout == 'offset':                        # one, large; compose() sets it to one side
        it = items[0]
        out.append(P(it, min(aw, ah) * 0.82, cx, base, 'stand', 0.0))
    elif layout == 'hero-plus':                     # one large, two small at its feet either side
        out.append(P(items[0], fitslot(0, aw * 0.52, ah * 0.92), cx, base, 'stand', 0.0, z=0))
        for k, it in enumerate(items[1:3], 1):
            out.append(P(it, fitslot(k, aw * 0.26, ah * 0.46) * acc(it), cx + (-1 if k == 1 else 1) * aw * 0.37, base,
                         'stand', 0.0, z=2))
    elif layout == 'zigzag':                        # a row, every other one raised
        slot = aw / n; mid = (n - 1) / 2
        hh = min(min(slot * 0.8 / a_ for a_ in ars), ah * 0.62)
        for k, it in enumerate(items):
            S = hh * math.sqrt(ars[k]) if phones else fitslot(k, slot * 0.9, ah * 0.6)
            out.append(P(it, S, cx + slot * (k - mid), (y0 + y1) / 2 + (ah * 0.13 if k % 2 else -ah * 0.13), 'float',
                         0.0, z=k, lift=60))
    elif layout == 'staircase':                     # rising one step a product, either way
        slot = aw / n; mid = (n - 1) / 2; d = 1 if r.random() < 0.5 else -1
        hh = min(min(slot * 0.8 / a_ for a_ in ars), ah * 0.66)
        for k, it in enumerate(items):
            S = (hh * math.sqrt(ars[k]) if phones else fitslot(k, slot * 0.9, ah * 0.62)) * acc(it)
            step = (k if d > 0 else n - 1 - k) * ah * 0.13
            out.append(P(it, S, cx + slot * (k - mid), base - step, 'stand', 0.0, z=n - k))
    elif layout == 'stagger':
        # two vehicles on a diagonal, the front view up and left, the rear down
        # and right: side by side two cars shrink to toys at 1080
        w = aw * 0.64
        for k, it in enumerate(items):
            S = fitslot(k, w, ah * 0.5) * (0.86 if k == 0 else 1.0)   # the far one a step smaller
            x = x0 + aw * (0.33 if k == 0 else 0.67)
            b = y0 + ah * 0.56 if k == 0 else base
            out.append(P(it, S, x, b, 'stand', 0.0, z=k))
    elif layout in ('pair', 'trio', 'lineup'):
        slot = aw / n
        t = r.uniform(3, 8) if layout != 'lineup' else 0
        mid = (n - 1) / 2
        hh = min(min(slot * 0.8 / a_ for a_ in ars), ah * 0.9)   # one height for the row: neighbours match
        for k, it in enumerate(items):
            S = (hh * math.sqrt(ars[k]) if phones else fitslot(k, slot * 0.9, ah * 0.85)) * acc(it)
            if layout == 'trio' and k == 1 and acc(it) == 1:
                S *= 1.12
            rot = clamp_rot(it, t * (k - mid) / max(mid, 1))
            out.append(P(it, S, cx + slot * (k - mid), base, 'stand', rot, z=k, refl=True if layout == 'lineup' else None))
    elif layout == 'spread-fan':
        slot = aw / n
        mid = (n - 1) / 2
        hh = min(min(slot * 0.8 / a_ for a_ in ars), ah * 0.8)
        for k, it in enumerate(items):
            d = (k - mid) / max(mid, 1)
            out.append(P(it, hh * math.sqrt(ars[k]) if phones else fitslot(k, slot * 0.9, ah * 0.8), cx + slot * (k - mid), (y0 + y1) / 2 + abs(d) * ah * 0.10, 'float',
                         clamp_rot(it, -d * 12), z=k, lift=60))
    elif layout == 'pyramid':
        S = min(aw * 0.3 / math.sqrt(np.mean(ars)), ah * 0.55)
        pos = [(cx, y1 - 0.02 * H - ah * 0.40, 0.92), (cx - aw * 0.26, base, 1.0), (cx + aw * 0.26, base, 1.0)]
        for k, it in enumerate(items[:3]):
            x, y, f = pos[k]
            out.append(P(it, S * f, x, y, 'stand' if k else 'float', clamp_rot(it, [0, -5, 5][k]), z=k, lift=50))
    elif layout == 'floating-row':
        slot = aw / n
        mid = (n - 1) / 2
        hh = min(min(slot * 0.8 / a_ for a_ in ars), ah * 0.72)
        for k, it in enumerate(items):
            out.append(P(it, hh * math.sqrt(ars[k]) if phones else fitslot(k, slot * 0.9, ah * 0.75), cx + slot * (k - mid), (y0 + y1) / 2 - ah * 0.04 * (1 - abs(k - mid) / max(mid, 1)),
                         'float', clamp_rot(it, r.uniform(-10, 10)), z=k, lift=r.uniform(70, 130)))
    elif layout == 'flatlay-scatter':
        S = math.sqrt(aw * ah / n) * (0.72 if phones else 0.86)
        pts = []
        for k, it in enumerate(items):
            best = None
            for t in range(80):
                p = (r.uniform(x0 + S * 0.45, x1 - S * 0.45), r.uniform(y0 + S * 0.5, y1 - S * 0.5))
                dmin = min([math.hypot(p[0] - q[0], p[1] - q[1]) for q in pts] + [1e9])
                if best is None or dmin > best[0]:
                    best = (dmin, p)
            pts.append(best[1])
            out.append(P(it, S, best[1][0], best[1][1], 'flat', r.uniform(-1, 1) * it['rot'], z=k))
    elif layout == 'device-wall':
        cols = 4 if n >= 8 else 3
        rows = math.ceil(n / cols)
        ar = float(np.mean(ars))
        cw, ch = aw / cols, ah / rows
        Sg = min(cw * 0.86 / math.sqrt(ar), ch * 0.88 * math.sqrt(ar))
        for k, it in enumerate(items):
            i, j = k % cols, k // cols
            out.append(P(it, Sg, x0 + cw * (i + 0.5), y0 + ch * (j + 0.5), 'flat', 0.0, z=k))
    elif layout == 'grid-flatlay':
        ar = float(np.mean(ars))
        best = None
        for cols in range(1, n + 1):
            rows = math.ceil(n / cols)
            if cols * rows - n >= cols: continue
            Sg = min(aw / cols / 1.25 / math.sqrt(ar), ah / rows / 1.25 * math.sqrt(ar))
            if best is None or Sg > best[0]:
                best = (Sg, cols, rows)
        Sg, cols, rows = best
        cw, ch = Sg * math.sqrt(ar) * 1.25, Sg / math.sqrt(ar) * 1.25
        for k, it in enumerate(items):
            i, j = k % cols, k // cols
            inrow = min(cols, n - j * cols)
            out.append(P(it, Sg, cx + cw * (i - (inrow - 1) / 2), (y0 + y1) / 2 + ch * (j - (rows - 1) / 2), 'flat',
                         r.uniform(-1, 1) * min(4, it['rot']), z=k))
    elif layout == 'orbit-arc':
        S = ah * 0.42
        R = aw * 0.62
        ocy = y1 + R * 0.55
        span = r.uniform(40, 54)
        ang = np.linspace(-span, span, n)
        for k, it in enumerate(items):
            a = math.radians(ang[k])
            out.append(P(it, S, cx + R * math.sin(a), ocy - R * math.cos(a), 'float', clamp_rot(it, -ang[k] * 0.5),
                         z=k, lift=50))
    return out

GAP = 22

def overlap(pls):
    """Largest shared-alpha area between two products, as a share of the smaller."""
    k = np.ones((GAP, GAP), np.uint8)   # products need a visible gap, not just no shared pixel
    ms = [cv2.dilate((place(p['spr'][..., 3], p['cx'] - p['spr'].shape[1] / 2, p['cy'] - p['spr'].shape[0] / 2) > 0.15)
                     .astype(np.uint8), k).astype(bool) for p in pls]
    worst = 0.0
    for i in range(len(ms)):
        for j in range(i + 1, len(ms)):
            b0, b1 = pls[i]['bbox'], pls[j]['bbox']
            if b0[2] + GAP < b1[0] or b1[2] + GAP < b0[0] or b0[3] + GAP < b1[1] or b1[3] + GAP < b0[1]:
                continue
            inter = np.count_nonzero(ms[i] & ms[j])
            if inter:
                worst = max(worst, inter / max(1, min(ms[i].sum(), ms[j].sum())))
    return worst

def separate(pls, A, rng, fill, valign):
    """Spread the group about its centre until no two products overlap, then refit."""
    for _ in range(12):
        if len(pls) < 2 or overlap(pls) < 0.002:
            return
        gx = np.mean([p['x'] for p in pls]); gy = np.mean([p['y'] for p in pls])
        for p in pls:
            p['x'] = gx + (p['x'] - gx) * 1.12
            if p['mode'] != 'stand':
                p['y'] = gy + (p['y'] - gy) * 1.08
        fit(pls, A, rng, fill, valign)

LAYOUT_N = {'hero': (1, 1), 'pair': (2, 2), 'trio': (3, 3), 'lineup': (4, 5), 'spread-fan': (3, 5),
            'pyramid': (3, 3), 'floating-row': (2, 4), 'flatlay-scatter': (4, 5), 'grid-flatlay': (4, 6),
            'orbit-arc': (3, 5), 'device-wall': (6, 8), 'stagger': (2, 2), 'hero-plus': (3, 3), 'zigzag': (4, 5),
            'staircase': (3, 4), 'offset': (1, 1)}

# Owner, 2026-10-01, on gold and silver: "enlarge at least 30 to 40%". Small
# objects in rows of five read as crumbs: outside iPhone, fewer and bigger.
LAYOUT_N_SMALL = {'lineup': (3, 3), 'spread-fan': (3, 3), 'floating-row': (2, 3), 'flatlay-scatter': (3, 3),
                  'grid-flatlay': (4, 4), 'orbit-arc': (3, 3), 'zigzag': (3, 4), 'staircase': (3, 3)}

def pick_items(cat, layout, rng, idx=None, spec=None):
    if cat == 'cars-pair':
        by = {it['name']: it for it in POOLS['cars']}
        return [by[n] for n in CAR_DUOS[idx % len(CAR_DUOS)]]
    if cat in AD:
        by = {it['name']: it for g in ad_groups(cat).values() for it in g}
        tilt = AD_TILT if layout in ('floating-row', 'grid-flatlay') else 0
        return [dict(by[n], rot=tilt) for n in spec['items']]
    pool = POOLS[cat]
    lo, hi = LAYOUT_N_SMALL.get(layout, LAYOUT_N[layout]) if cat != 'iphone' else LAYOUT_N[layout]
    n = int(rng.integers(lo, hi + 1))
    if layout == 'grid-flatlay':
        n = int(rng.choice([4, 6])) if cat == 'iphone' else 4
    bleed_ok = layout == 'hero'
    def ok(it):
        return not it['cut'] or (bleed_ok and it['cut'] in ('B', 'L', 'R'))
    if cat == 'iphone':
        if layout in ('hero', 'offset'):
            kind = rng.choice(['photo', 'pair', 'pair', 'view', 'view'])
        elif layout in ('pair', 'trio', 'stagger', 'hero-plus', 'staircase'):
            kind = rng.choice(['photo', 'pair', 'back', 'view', 'view'])
        elif layout in ('lineup', 'floating-row', 'spread-fan', 'zigzag'):
            kind = rng.choice(['back', 'back', 'pair', 'view', 'view'])
        else:
            kind = 'back'
        if layout == 'device-wall':
            kind = 'view'; n = 8 if rng.random() < 0.5 else 6
        if kind == 'view':                          # every phone in the picture turned the same way
            side, deg = VIEW_ANGLES[int(rng.integers(len(VIEW_ANGLES)))]
            if layout == 'device-wall':             # mostly lit screens, as the wallpaper showcases are
                side = 'screen' if rng.random() < 0.7 else 'back'; deg = int(rng.choice([0, 0, -15, 15]))
            cands = [it for it in pool if it['kind'] == 'view' and VIEW[it['name']]['side'] == side
                     and VIEW[it['name']]['deg'] == deg]
            if layout in ('pair', 'trio', 'stagger', 'hero-plus') and rng.random() < 0.5:
                byp = {VIEW[it['name']]['phone']: it for it in cands}
                return [byp[p] for p in HERO_TRIO[:n]]
            seen, pick = set(), []                  # a phone once, its other wallpaper only if short
            for i in rng.permutation(len(cands)):
                ph = VIEW[cands[i]['name']]['phone']
                if ph not in seen: seen.add(ph); pick.append(cands[i])
            pick += [it for it in cands if it not in pick]
            return pick[:n]
        cands = [it for it in pool if it['kind'] == kind]
        if len(cands) < n:
            cands = [it for it in pool if it['kind'] in ('back', 'photo')]
        idx = rng.permutation(len(cands))[:n]
        return [cands[i] for i in idx]
    if cat == 'cars':
        cars = [it for it in pool if it['kind'] == 'car' and ok(it)]
        acc = [it for it in pool if it['kind'] == 'acc']
        rng.shuffle(cars); rng.shuffle(acc)
        whole = [c for c in cars if not c['cut']]
        if layout == 'hero':
            if idx is not None:
                by = {it['name']: it for it in pool}
                return [by[CAR_ROTA[idx % len(CAR_ROTA)]]]
            return whole[:1]
        if layout == 'pair':
            return [whole[0], acc[0]] if rng.random() < 0.4 else whole[:2]
        if layout == 'trio':
            return [acc[0], whole[0], acc[1]]
        return whole[:2]
    singles = [it for it in pool if it['role'] == 's' and ok(it)]
    heroes = [it for it in pool if it['role'] == 'h' and ok(it)]
    if layout == 'hero' and heroes and rng.random() < 0.5:
        first = [heroes[rng.integers(len(heroes))]]
    else:
        first = []
    rest = singles if len(singles) >= n else singles + heroes
    idx = rng.permutation(len(rest))
    sel = (first + [rest[i] for i in idx if rest[i] not in first])[:n]
    if cat == 'mac':                                # the Mac Studio in the middle, iMacs either side
        odd = [it for it in sel if 'studio' in it['name']][:1]
        if odd and len(sel) > 1:
            sel = [it for it in sel if it is not odd[0]]
            sel.insert(0 if layout == 'pyramid' else len(sel) // 2, odd[0])
    return sel

# ----------------------------------------------------------------------------- composition

def build_sprites(pls):
    for pl in pls:
        pl['spr'] = prep_sprite(pl['it']['name'], pl['S'], pl['rot'], pl['blur'])
        h, w = pl['spr'].shape[:2]
        if pl['mode'] == 'stand':
            pl['cx'], pl['cy'] = pl['x'], pl['y'] - h / 2
            pl['base'] = pl['y']
        else:
            pl['cx'], pl['cy'] = pl['x'], pl['y']
        pl['bbox'] = (pl['cx'] - w / 2, pl['cy'] - h / 2, pl['cx'] + w / 2, pl['cy'] + h / 2)

def union(pls):
    b = np.array([p['bbox'] for p in pls])
    return b[:, 0].min(), b[:, 1].min(), b[:, 2].max(), b[:, 3].max()

def fit(pls, A, rng, fill=0.95, valign='bottom'):
    aw, ah = A[2] - A[0], A[3] - A[1]
    for it in range(4):
        build_sprites(pls)
        ux0, uy0, ux1, uy1 = union(pls)
        g = min(aw / (ux1 - ux0), ah / (uy1 - uy0))
        f = min(g * fill, 2.2) if it == 0 else min(g, 1.0)
        if abs(f - 1) < 0.015:
            break
        ax, ay = (ux0 + ux1) / 2, uy1
        for p in pls:
            p['S'] *= f; p['x'] = ax + (p['x'] - ax) * f; p['y'] = ay + (p['y'] - ay) * f
            p['lift'] *= f
    build_sprites(pls)
    ux0, uy0, ux1, uy1 = union(pls)
    slack = aw - (ux1 - ux0)
    dx = (A[0] + A[2]) / 2 - (ux0 + ux1) / 2
    if valign == 'bottom':
        dy = A[3] - uy1
    else:
        dy = (A[1] + A[3]) / 2 - (uy0 + uy1) / 2
    for p in pls:
        p['x'] += dx; p['y'] += dy
    build_sprites(pls)

def place_bleed(pls, zone, rng):
    main = pls[0]
    h, w = main['spr'].shape[:2]
    cut = main['it']['cut']
    if cut in ('L', 'R') and not (zone == 'left' and cut == 'L') and not (zone == 'right' and cut == 'R'):
        sidep = cut
    elif cut == 'B':
        sidep = 'B'
    else:
        opts = ['B', 'R', 'L'] if zone == 'top' else (['R', 'B'] if zone == 'left' else ['L', 'B'])
        sidep = opts[rng.integers(len(opts))]
    frac = rng.uniform(0.14, 0.28)
    if sidep == 'B':
        cx = W * (rng.uniform(0.3, 0.7) if zone == 'top' else (0.74 if zone == 'left' else 0.26))
        cy = H + h / 2 - h * (1 - frac)
        top = 0.40 * H if zone == 'top' else 0.1 * H
        if cy - h / 2 < top:
            cy = top + h / 2
    else:
        cy = H * (0.70 if zone == 'top' else 0.55)
        if cy + h / 2 > H * 0.98:
            cy = max(H * 0.98 - h / 2, 0.42 * H + h / 2 if zone == 'top' else h / 2)
        cx = (W - w / 2 + w * frac) if sidep == 'R' else (w / 2 - w * frac)
    main['cx'], main['cy'] = cx, cy
    main['bbox'] = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    main['bleed'] = sidep
    if len(pls) > 1:
        s = pls[1]; hh, ww = s['spr'].shape[:2]
        A = region_for(zone, 'x')
        if sidep == 'R':
            sx = max(A[0] + ww / 2, cx - w / 2 - ww * 0.35)
        elif sidep == 'L':
            sx = min(A[2] - ww / 2, cx + w / 2 + ww * 0.35)
        else:
            sx = A[0] + ww / 2 + 20 if cx > W / 2 else A[2] - ww / 2 - 20
        sy = min(A[3] - hh / 2, H * 0.88 - hh / 2)
        s['cx'], s['cy'] = sx, sy
        s['bbox'] = (sx - ww / 2, sy - hh / 2, sx + ww / 2, sy + hh / 2)
        s['z'] = 3

def snap_cut(pls, zone):
    """Items with a cut edge must bleed off-frame on that side."""
    for p in pls:
        c = p['it']['cut']
        if not c or p.get('bleed'): continue
        x0, y0, x1, y1 = p['bbox']; dx = dy = 0
        if c == 'B': dy = H + 6 - y1
        elif c == 'R': dx = W + 6 - x1
        elif c == 'L': dx = -6 - x0
        if dy < 0: dy = 0
        p['cx'] += dx; p['cy'] += dy
        if 'base' in p: p['base'] += dy
        p['bbox'] = (x0 + dx, y0 + dy, x1 + dx, y1 + dy)
        p['bleed'] = c
        if c == 'B' and p['mode'] == 'stand':
            p['mode'] = 'bleed'

def text_intrusion(pls, zone):
    tx0, ty0, tx1, ty1 = text_rect(zone)
    area = 0
    for p in pls:
        x0, y0, x1, y1 = p['bbox']
        ix = max(0, min(x1, tx1) - max(x0, tx0)); iy = max(0, min(y1, ty1) - max(y0, ty0))
        area += ix * iy
    return area / ((tx1 - tx0) * (ty1 - ty0))

def compose(spec):
    t0 = time.time()
    cat, idx = spec['cat'], spec['idx']
    rng = np.random.default_rng([SEED, zlib.crc32(cat.encode()), idx])
    style, layout, zone = spec['style'], spec['layout'], spec['zone']
    items = pick_items(cat, layout, rng, idx, spec)
    pdef = ad_palette(items, spec['pmode'], spec['variant'] == 'dark') if cat in AD else PALETTES[spec['pal']]
    pdef = vivid(pdef, spec['variant'] == 'dark')
    pal = Pal(pdef, spec['variant'] == 'dark')
    surface = STYLES[style][1]
    hy = rng.uniform(0.58, 0.68) * H
    if zone != 'top' and layout != 'side-column' and np.mean([aspect(it['name']) for it in items]) > 1.25:
        zone = 'top'
    zone = 'top'
    A = ([0.08 * W, 0.40 * H, 0.92 * W, 0.965 * H] if cat == 'iphone' else
         [0.06 * W, 0.37 * H, 0.94 * W, 0.965 * H] if cat in AD else [0.03 * W, 0.36 * H, 0.97 * W, 0.975 * H])
    size = spec.get('size', 'standard')
    if size == 'large':                             # a wider stage, reaching higher
        A = [max(0.012 * W, A[0] - 0.025 * W), A[1] - 0.06 * H, min(0.988 * W, A[2] + 0.025 * W), A[3]]
    elif size == 'xl':                              # nearly the whole frame under a slim headline
        A = [0.015 * W, A[1] - 0.12 * H, 0.985 * W, max(A[3], 0.975 * H)]
    lift = {'standard': 0.0, 'large': 0.02, 'xl': 0.04}[size]
    pls = lay(layout, items, A, rng, hy)
    A2 = list(A)
    if layout in STAND_LAYOUTS:
        A2[3] = (0.90 + lift) * H
    if style in PODIUMS:
        A2[3] = (0.80 + lift) * H
    if layout == 'offset':                          # to one side of the stage
        w2 = (A2[2] - A2[0]) * 0.64
        if rng.random() < 0.5: A2[2] = A2[0] + w2
        else: A2[0] = A2[2] - w2
    valign = 'bottom' if layout in STAND_LAYOUTS else 'center'
    fill = {'flatlay-scatter': 0.92, 'grid-flatlay': 0.94}.get(layout, 0.94) if cat == 'iphone' else 0.99
    if size == 'xl': fill = 1.0
    fit(pls, A2, rng, fill, valign)
    separate(pls, A2, rng, fill, valign)
    snap_cut(pls, zone)
    stand_bases = [p['base'] for p in pls if p['mode'] == 'stand']
    if stand_bases:
        hy = min(hy, min(stand_bases) - 0.035 * H)
    hy = max(hy, 0.42 * H if zone == 'top' else 0.30 * H)
    pls.sort(key=lambda p: p['z'])
    # ---- ground
    g = G(); g.layout = layout; g.rng = rng; g.p = pal; g.zone = zone; g.hy = hy; g.region = A; g.pls = pls
    g.lx = float(rng.uniform(-0.8, 0.8)); g.floor = False
    b = union(pls)
    g.pc = (float(np.clip((b[0] + b[2]) / 2, 0, W)), float(np.clip((b[1] + b[3]) / 2, 0, H)))
    g.calm = calm_mask(zone)
    g.keep = keep_mask(g)
    fn, _, soft = STYLES[style]
    img = fn(g).astype(F)
    if style in BUSY:
        k = gblur(keep_mask(g, 10), 18)
        img = lerp(img, gblur(img, 26), k * 0.8)
    if soft > 0:
        img = lerp(img, gblur(img, 14), g.calm * soft)
    img = np.clip(img, 0, 1.5)
    if pal.dark:
        glow = gauss2(g.pc[0], g.pc[1], W * 0.26, H * 0.22)
        img = screen(img, glow[..., None] * lab2lin(labmix(pal.t['hi'], pal.t['sup'], 0.35)) * 0.22)
    ground_mean = img.reshape(-1, 3).mean(0)
    tint = ground_mean / max(lum(ground_mean), 1e-3)
    tint = np.clip(tint / tint.max(), 0.5, 1.0)
    shadow_tint = pal.shadow
    light_bg = not pal.dark
    lx = g.lx
    # ---- floor pass: reflections + floor shadows
    for p in pls:
        spr = p['spr']; h, w = spr.shape[:2]
        x0, y0 = int(round(p['cx'] - w / 2)), int(round(p['cy'] - h / 2))
        a = spr[..., 3]
        if p['mode'] == 'stand':
            base = y0 + h
            want_refl = p['refl'] or (p['refl'] is None and surface in ('floor', 'plane') and style not in PODIUMS and rng.random() < 0.8)
            if want_refl:
                L = h * rng.uniform(0.28, 0.4)
                t = np.arange(h, dtype=F)
                fade = np.clip(1 - t / L, 0, 1) ** 1.7 * (0.28 if light_bg else 0.34)
                ref = spr[::-1] * fade[:, None, None]
                ref = gblur(ref, 1.3)
                ref[..., :3] *= tint
                blit(img, ref, x0, base + 1)
            low = int(max(3, h * 0.035))
            prof = a[h - low:].max(0)
            m = np.zeros((H, W), F)
            yb = min(H - 1, max(0, base - 1))
            r_ = _clip(x0, yb, 1, w)
            if r_:
                (cy_, cx_), (sy_, sx_) = r_
                m[cy_, cx_] = prof[sx_][None]
            c1 = cv2.GaussianBlur(m, (0, 0), sigmaX=3, sigmaY=2.2)
            c2 = cv2.GaussianBlur(m, (0, 0), sigmaX=16, sigmaY=9)
            shade(img, np.clip(c1 * 3.5, 0, 1), 0.55 if light_bg else 0.7, shadow_tint)
            shade(img, np.clip(c2 * 5, 0, 1), 0.30 if light_bg else 0.4, shadow_tint)
            if surface == 'floor' and style not in PODIUMS:
                sh = int(max(4, h * rng.uniform(0.18, 0.3)))
                flat = cv2.resize(a[::-1], (w, sh), interpolation=cv2.INTER_AREA)
                shear = -lx * 1.4
                M = np.float32([[1, shear, max(0, -shear * sh)], [0, 1, 0]])
                ww = int(w + abs(shear) * sh) + 2
                cast = cv2.warpAffine(flat, M, (ww, sh))
                cm = place(cast, x0 - max(0, -shear * sh), base)
                near = gblur(cm, 3); far = gblur(cm, 16)
                tt = np.clip((YY - base) / sh, 0, 1)
                shade(img, near * (1 - tt) + far * tt, 0.28 if light_bg else 0.4, shadow_tint)
    # ---- object pass
    for p in pls:
        spr = p['spr'].copy(); h, w = spr.shape[:2]
        x0, y0 = int(round(p['cx'] - w / 2)), int(round(p['cy'] - h / 2))
        a = spr[..., 3]
        am = place(a, x0, y0)
        if p['mode'] == 'float':
            lift = p['lift']
            if surface == 'floor':
                fy = y0 + h + lift
                if getattr(g, 'podiums', None):
                    fy = min(fy, H - 10)
                sq = cv2.resize(a, (w, max(3, int(h * 0.1))), interpolation=cv2.INTER_AREA)
                fm = place(sq, x0 - lx * lift * 0.4, fy - sq.shape[0] / 2)
                shade(img, gblur(fm, 6 + lift * 0.08), 0.5 * math.exp(-lift / 500), shadow_tint)
            dist = 14 + lift * 0.25
            ds = place(a, x0 - lx * dist, y0 + dist)
            shade(img, gblur(ds, 10 + dist * 0.35), 0.30 if light_bg else 0.45, shadow_tint)
        elif p['mode'] in ('flat', 'bleed'):
            ds = place(a, x0 - lx * 8, y0 + 12)
            shade(img, gblur(ds, 6), 0.30 if light_bg else 0.45, shadow_tint)
            ds2 = place(a, x0 - lx * 20, y0 + 28)
            shade(img, gblur(ds2, 24), 0.18 if light_bg else 0.3, shadow_tint)
        elif p['mode'] == 'stand' and surface == 'flat':
            ds = place(a, x0 - lx * 14, y0 + 10)
            shade(img, gblur(ds, 14) * (1 - am), 0.18 if light_bg else 0.3, shadow_tint)
        if pal.dark and spec['rim']:
            glow = gblur(am, 34)
            img += (glow * 0.13)[..., None] * lab2lin(labmix(pal.t['acc'], pal.t['sup'], spec['rim_mix']))
        spr[..., :3] *= (0.95 + 0.05 * tint)
        blit(img, spr, x0, y0)
    # ---- finish
    fin = 'sharp' if cat in AD else spec['finish']
    if fin == 'soft':
        img = gblur(img, rng.uniform(1.4, 2.2))
    elif fin == 'dreamy':
        img = gblur(img, rng.uniform(6.5, 9.5))
        bright = np.clip(img - 0.55, 0, None)
        img = img + gblur(bright, 30) * 0.35
    vr = np.hypot(xn - 0.5, yn - 0.5) / 0.7071
    v = ss(0.45, 1.05, vr) * rng.uniform(0.14, 0.24)
    img = img * (1 - v[..., None]) + img * shadow_tint * v[..., None]
    out = l2s(img)
    gs = rng.uniform(0.010, 0.016)
    noise = rng.standard_normal((H, W, 1)).astype(F) * gs + rng.standard_normal((H, W, 3)).astype(F) * gs * 0.25
    noise = cv2.GaussianBlur(noise, (0, 0), 0.5) * 0.75
    out = np.clip(out + noise, 0, 1)
    u8 = (out * 255 + 0.5).astype(np.uint8)
    im = Image.fromarray(u8)
    rel = f'full/{cat}/{cat}-{idx + 1:03d}.jpg'
    im.save(os.path.join(OUT, rel), quality=84, optimize=True)
    th = im.resize((360, 360), Image.LANCZOS)
    th.save(os.path.join(OUT, f'thumb/{cat}-{idx + 1:03d}.jpg'), quality=78, optimize=True)
    return dict(file=rel, thumb=f'thumb/{cat}-{idx + 1:03d}.jpg', cat=cat, style=style, palette=pal.name,
                sw=[pdef['dark' if pal.dark else 'light'], pdef['accent']],
                ground=spec['variant'], layout=layout, size=spec.get('size', 'standard'), text_zone=zone, finish=fin,
                devices=[p['it']['name'] for p in pls],
                prod_size=round(float(np.mean([math.sqrt(p['spr'][..., 3].sum()) for p in pls])) / W, 4),
                text_zone_overlap=round(text_intrusion(pls, zone), 4),
                secs=round(time.time() - t0, 2))

# ----------------------------------------------------------------------------- planning

def plan_category(cat, n):
    rng = np.random.default_rng([SEED, zlib.crc32(cat.encode()), 999])
    lays = LAYOUTS_BY.get(cat) or (AD_LAYOUTS_BY.get(cat, AD_LAYOUTS) if cat in AD else LAYOUTS)
    styles = list(AD_STYLES) if cat in AD else list(STYLES)
    # one use per (style, layout) and (palette, layout) until a set has more
    # images than that allows (cars have one layout, the Apple-ad sets six
    # styles): then each may come as often as the count needs (owner,
    # 2026-10-03: "MORE"), never as the same style and palette twice
    per = -(-n // len(lays))
    cap = max(1, max(-(-per // max(1, sum(compatible(s_, l_) for s_ in styles))) for l_ in lays))
    pcap = max(cap, -(-per // len(PALETTES)))   # more styles than palettes: a palette may come oftener
    for attempt in range(200):
        used_sl, used_pl, used_sp = Counter(), Counter(), set()
        lc, sc, pc = Counter(), Counter(), Counter()
        specs = []; prev = None; failed = False
        nf = round(n * 0.55)
        fins = ['sharp'] * nf + ['soft'] * (n - nf)
        rng.shuffle(fins)
        nl = round(n * (0.5 if cat in AD else 0.35))      # owner: "heavy contrast": more dark grounds
        vars_ = ['light'] * nl + ['dark'] * (n - nl); rng.shuffle(vars_)
        for i in range(n):
            if i and False: pass
            cl = [l for l in lays if not prev or l != prev['layout']]
            cl = cl or list(lays)
            m = min(lc[l] for l in cl)
            cl = [l for l in cl if lc[l] == m]
            l = cl[rng.integers(len(cl))]
            cs = [s for s in styles if used_sl[(s, l)] < cap and compatible(s, l) and (not prev or s != prev['style'])]
            if not cs: failed = True; break
            s = min(cs, key=lambda s: sc[s] / STYLE_W[s] + rng.random() * 0.35)
            cp = [p for p in range(len(PALETTES)) if used_pl[(p, l)] < pcap and (cap == 1 or (s, p) not in used_sp) and (not prev or p != prev['pal'])]
            if not cp: failed = True; break
            mp = min(pc[p] for p in cp)
            cp = [p for p in cp if pc[p] == mp]
            p = cp[rng.integers(len(cp))]
            zone = 'top'
            spec = dict(cat=cat, idx=i, layout=l, style=s, pal=int(p), variant=vars_[i], finish=fins[i], zone=str(zone),
                        rim=bool(rng.random() < 0.4), rim_mix=float(rng.random()))
            used_sl[(s, l)] += 1; used_pl[(p, l)] += 1; used_sp.add((s, p)); lc[l] += 1; sc[s] += 1; pc[p] += 1
            specs.append(spec); prev = spec
        if not failed:
            if cat in AD:
                ad_assign(cat, specs)
            # owner, 2026-10-04: "maybe have larger or more visible images? ... I do like
            # these sizes but I need some variety": about half as they are, a third
            # larger, a fifth extra large; drawn apart from the plan above, so the
            # rest of each image stays as it was
            sr = np.random.default_rng([SEED, zlib.crc32(cat.encode()), 1717])
            # the green palettes only on dark grounds: lit, green turns mint and lime
            for sp in specs:
                if cat not in AD and PALETTES[sp['pal']]['name'] in DARK_ONLY: sp['variant'] = 'dark'
            sizes = ['standard'] * round(n * 0.45) + ['large'] * round(n * 0.35)
            sizes += ['xl'] * (n - len(sizes)); sr.shuffle(sizes)
            for sp, z in zip(specs, sizes): sp['size'] = str(z)
            return specs
    raise RuntimeError('planning failed for ' + cat)

def ad_assign(cat, specs):
    """which model and colours each Apple-ad image shows: every model in turn,
    a different colour each time round; one or two products on their own tone
    (Apple white or black when the finish is neutral), a row of colours on
    Apple white or black every other time"""
    groups = ad_groups(cat); keys = list(groups)
    r = np.random.default_rng([SEED, zlib.crc32(cat.encode()), 4242])
    for l in AD_LAYOUTS_BY.get(cat, AD_LAYOUTS):
        need = ad_need(cat, l)
        elig = [k for k in keys if len(groups[k]) >= need] or keys
        # the real photographs and the main Pro Max trio first, so every one is shown
        ph = [i for i, k in enumerate(elig) if k.startswith(('photo-', 'view:hero-trio'))]
        rest = [i for i, k in enumerate(elig) if not k.startswith(('photo-', 'view:hero-trio'))]
        perm = [ph[i] for i in r.permutation(len(ph))] + [rest[i] for i in r.permutation(len(rest))]; j = 0
        for sp in specs:
            if sp['layout'] != l: continue
            k = elig[perm[j % len(elig)]]
            cols = list(groups[k]); off = (j // len(elig)) % len(cols)
            cols = cols[off:] + cols[:off]
            sp['items'] = [c['name'] for c in cols[:need]]
            sp['pmode'] = 'tone' if (need <= 2 or j % 4 != 3) else 'neutral'   # owner: "more vibrant"
            j += 1

# ----------------------------------------------------------------------------- sheets

def contact_sheets(manifest):
    from PIL import ImageDraw
    os.makedirs(os.path.join(OUT, 'sheets'), exist_ok=True)
    bycat = OrderedDict()
    for m in manifest:
        bycat.setdefault(m['cat'], []).append(m)
    T = 216
    for cat, ms in bycat.items():
        for s in range(0, len(ms), 25):
            chunk = ms[s:s + 25]
            sheet = Image.new('RGB', (5 * T, 5 * (T + 12)), (20, 20, 22))
            d = ImageDraw.Draw(sheet)
            for k, m in enumerate(chunk):
                im = Image.open(os.path.join(OUT, m['thumb'])).resize((T, T), Image.LANCZOS)
                x, y = (k % 5) * T, (k // 5) * (T + 12)
                sheet.paste(im, (x, y))
                d.text((x + 2, y + T), f"{m['file'].split('/')[-1][:-4]} {m['style'][:10]}/{m['layout'][:9]}", fill=(220, 220, 220))
            sheet.save(os.path.join(OUT, 'sheets', f'{cat}-{s // 25 + 1}.jpg'), quality=85)

# ----------------------------------------------------------------------------- main

PALETTES = None
OUT = None

def _init(out, pals):
    global OUT, PALETTES
    OUT = out; PALETTES = pals

def main():
    global OUT, PALETTES
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=DEFAULT_OUT)
    ap.add_argument('--palettes', default=None)
    ap.add_argument('--only', default='')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--pick', default='', help='comma list of 1-based indices')
    ap.add_argument('--jobs', type=int, default=4)
    a = ap.parse_args()
    OUT = a.out
    pal_path = a.palettes or os.path.join(REPO, 'scripts', 'backdrop_palettes.json')
    PALETTES = json.load(open(pal_path))
    specs = []
    for cat, n in COUNTS.items():
        sp = plan_category(cat, n)
        if a.only and cat not in a.only.split(','): continue
        if a.pick:
            keep = {int(x) - 1 for x in a.pick.split(',')}
            sp = [s for s in sp if s['idx'] in keep]
        if a.limit: sp = sp[:a.limit]
        specs += sp
    for cat in COUNTS:
        os.makedirs(os.path.join(OUT, 'full', cat), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'thumb'), exist_ok=True)
    t0 = time.time()
    with Pool(a.jobs, initializer=_init, initargs=(OUT, PALETTES)) as pool:
        res = list(pool.imap(compose, specs, chunksize=2))
    el = time.time() - t0
    mpath = os.path.join(OUT, 'manifest.json')
    if not a.only and not a.limit and not a.pick:
        man = res
    else:
        old = json.load(open(mpath)) if os.path.exists(mpath) else []
        d = {m['file']: m for m in old}
        for m in res: d[m['file']] = m
        man = sorted(d.values(), key=lambda m: (list(COUNTS).index(m['cat']), m['file']))
    json.dump(man, open(mpath, 'w'), indent=1)
    contact_sheets([m for m in man if m['cat'] in {r['cat'] for r in res}])
    print(f'{len(res)} images in {el:.1f}s -> {OUT}')

if __name__ == '__main__':
    main()
