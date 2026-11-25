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
    # the cards' grounds: the studio's own (DESIGN-LAW 161, 2026-11-23: the graded Charizard photographs carried the maker's art and a CC BY-SA credit;
    # scripts/paint_card_scenes.mjs paints the same display scene and writes its bg-offer crop itself)
    'pokemon': ['bg-web/pokemon-slabs-display-1', 'bg-web/pokemon-slabs-display-2'],
    'strips':  ['bg-web/strips-contour-next-test-strips-2', 'bg-web/strips-blood-glucose-test-strips-2', 'bg-web/strips-blood-glucose-meter-1'],
    'coins':   ['bg-web/coins-coin-collection-album-1', 'bg-web/coins-morgan-silver-dollar-1', 'bg-web/coins-american-gold-eagle-coin-1'],
    'gold':    ['bg-web/gold-gold-jewelry-rings-3', 'bg-web/gold-gold-bracelet-2', 'bg-web/gold-gold-bracelet-4'],   # 2026-11-18: the necklace close-up stood on black
    'silver':  ['bg-web/silver-silverware-set-1', 'bg-web/silver-silver-cutlery-1', 'bg-web/silver-silver-jewelry-rings-2'],
    # 2026-11-18: bright, no dealer's sign or phone number, no crowd ("with cars people like a good bg or sunset")
    'cars':    ['bg-web/trucks-pickup-truck-1', 'bg/dl_cars_stepsFlow_sunset'],
    'iphone':  ['bg-web/phones-iphone-15-pro-back-camera-1', 'bg-web/phones-iphone-14-pro-1', 'bg-web/phones-apple-iphone-15-1'],
    # M1 and newer only: the line buys nothing older (the owner, 2026-10-11, of an 11-inch Air: "We don't buy so it's misrepresenting")
    'mac':     ['bg-web/macbook-macbook-pro-16-inch-2', 'bg-web/macbook-macbook-pro-m3-1', 'bg-web/apple-macbook-air-m2-1'],
    # the gaming lines, gaming headsets and monitors: real gamers' rooms (2026-10-11, the owner of the drawn rooms: "too
    # similar of backgrounds and themes", then "We need more relatable gamer style background bedroom photos, so they look
    # clean"): Commons photographs of desk setups and a living room, each in its own colour and light
    'gaming':  ['bg-web/rooms-home-desk-setup-1', 'bg-web/rooms-desk-setup-1', 'bg-web/rooms-living-room-console-1'],   # 2026-11-18: the dark PC setup out
    # 2026-11-18, the owner of the lines on NASA's pictures: "lacks any cohesive direction". Each in its own world, bright:
    # computers and the Android phones on desks, audio, cameras and wearables on photographs of their own goods
    'desk':       ['bg-web/rooms-home-desk-setup-1', 'bg-web/rooms-desk-setup-1'],
    'headphones': ['bg-web/audio-airpods-max-2', 'bg-web/audio-bose-quietcomfort-headphones-2', 'bg-web/audio-airpods-max-1'],
    'earbuds':    ['bg-web/audio-airpods-pro-4', 'bg-web/audio-samsung-galaxy-buds-3', 'bg-web/audio-beats-fit-pro-1', 'bg-web/audio-airpods-4-1'],
    'speaker':    ['bg-web/audio-sonos-speaker-4', 'bg-web/rooms-home-desk-setup-1'],
    'camera':     ['bg-web/cameras-fujifilm-x-t5-2', 'bg-web/cameras-leica-q2-4'],
    'drone':      ['bg-web/cameras-dji-mini-4-pro-2'],
    'watch':      ['bg-web/wearables-apple-watch-series-9-4'],
    'glasses':    ['bg-web/wearables-meta-ray-ban-1', 'bg-web/rooms-desk-setup-1'],
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
