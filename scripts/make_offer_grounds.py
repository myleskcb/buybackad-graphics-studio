#!/usr/bin/env python3
"""THE OFFER CARDS' PHOTOGRAPHS: one ground per buying line, not a grey sweep.

The owner, 2026-09-27, on the offer cards: "the gray sections should have a
background image and it feels really incomplete". Each line gets photographs
of its own subject: the Commons photographs already in assets/bg-web (credits
carried over) and, for the card categories, the studio's own card scenes in
assets/bg. Each is centre-cropped to the 1080 card, kept in its own colour
(DESIGN-LAW 56), and measured: `p90` is the 90th percentile luminance (0-255)
of the upper two thirds, where the headline stands, so offer-library.js can
solve the neutral shade a line of white type needs over it (4.5:1) instead of
guessing one strength for every picture.

  python3 scripts/make_offer_grounds.py        -> assets/bg-offer/*.jpg, ATTRIBUTION.json, grounds.json
"""
import json, os
from PIL import Image, ImageOps
import numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'bg-offer')
GROUNDS = {
    'sports':  ['bg/dl_sports_arcCrown_crimson', 'bg/dl_sports_agencyGrid_mono', 'bg/dl_sports_glassCard_mono'],
    # real photographs only (DESIGN-LAW 112): graded Charizard slabs; sports keeps its studio scenes until a real photograph is found
    'pokemon': ['bg-web/pokemon-charizard-card-1', 'bg-web/pokemon-charizard-card-2'],
    'strips':  ['bg-web/strips-contour-next-test-strips-2', 'bg-web/strips-blood-glucose-test-strips-2', 'bg-web/strips-blood-glucose-meter-1'],
    'coins':   ['bg-web/coins-coin-collection-album-1', 'bg-web/coins-morgan-silver-dollar-1', 'bg-web/coins-american-gold-eagle-coin-1'],
    'gold':    ['bg-web/gold-gold-jewelry-rings-3', 'bg-web/gold-gold-bracelet-2', 'bg-web/gold-gold-necklace-chain-close-3'],
    'silver':  ['bg-web/silver-silverware-set-1', 'bg-web/silver-silver-cutlery-1', 'bg-web/silver-silver-jewelry-rings-2'],
    'cars':    ['bg-web/cars-used-car-dealership-lot-1', 'bg-web/trucks-pickup-truck-1', 'bg-web/cars-classic-car-chrome-grille-1'],
    'iphone':  ['bg-web/phones-iphone-15-pro-back-camera-1', 'bg-web/phones-iphone-14-pro-1', 'bg-web/phones-apple-iphone-15-1'],
    'mac':     ['bg-web/macbook-macbook-on-desk-1', 'bg-web/macbook-macbook-pro-m3-1', 'bg-web/macbook-macbook-air-2'],
    # no photograph of these lines' goods yet: the NASA pictures, which show no product at all
    'space':   ['bg-web/space-earth-from-iss-night-1', 'bg-web/space-earth-from-iss-night-3', 'bg-web/space-moon-surface-nasa-4',
                'bg-web/space-earth-from-iss-night-4', 'bg-web/space-aurora-from-space-3', 'bg-web/space-galaxy-hubble-telescope-1'],
}
web = {a['file']: a for a in json.load(open(os.path.join(ROOT, 'assets', 'bg-web', 'ATTRIBUTION.json')))}
att, table = [], {}
for key, srcs in GROUNDS.items():
    table[key] = []
    for s in srcs:
        name = os.path.basename(s)
        im = ImageOps.fit(Image.open(os.path.join(ROOT, 'assets', s + '.jpg')).convert('RGB'), (1080, 1080), Image.LANCZOS)
        im.save(os.path.join(OUT, name + '.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)
        a = np.asarray(im.crop((0, 0, 1080, 720)).convert('L'), dtype=np.float32)
        p90 = int(np.percentile(a, 90))
        table[key].append({'file': name, 'p90': p90})
        w = web.get(name + '.jpg')
        att.append({'file': name + '.jpg', 'from': 'assets/' + s + '.jpg', **({k: w[k] for k in ('title', 'artist', 'license', 'page') if k in w} if w
                    else {'note': 'the studio\'s own card scene (assets/bg), used by the classic templates'})})
        print(f'{key:8s} {name:44s} p90 {p90}')
json.dump(att, open(os.path.join(OUT, 'ATTRIBUTION.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(table, open(os.path.join(OUT, 'grounds.json'), 'w'), ensure_ascii=False, indent=1)
print('wrote', len(att), 'grounds')
