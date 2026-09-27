#!/usr/bin/env python3
"""THE FLAGGED PICTURES, SWAPPED FOR CLEAN ONES.

assets/cutout-flags.json names the product pictures that must not ship (an AI
render with garbled lettering, a phone that is not the model its name says, a
subject cut off at the frame, a broken render). Holding back every card that
draws one would take 70 live showcase cards off the landing for a picture, not
for their design. So each flagged picture is replaced by a clean picture of the
same kind of thing (REPLACE below, chosen by eye and by shape), fitted INSIDE
the footprint the old one drew: the same centre, never wider and never taller.
A card that was clear of its words stays clear. The overlap and school audits
run again on every card this touches; a card that fails them is held back.

usage: python3 scripts/swap_flagged_cutouts.py [--write] [--ids-out FILE]
"""
import json, os, sys
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CUT = os.path.join(ROOT, 'assets', 'cutouts')
DIR = os.path.join(ROOT, 'assets', 'showcase')
WRITE = '--write' in sys.argv

REPLACE = {
    'poke-booster': 'poke-booster-packs-fan', 'poke-elite-box': 'poke-booster-box', 'poke-binder-open': 'poke-slabs-trio',
    'poke-cards-fan': 'poke-booster-packs-fan',
    'silver-bar-single': 'silver-coins-spill', 'silver-bars-row': 'silver-coins-spill', 'silver-bars-stack': 'silver-coins-spill',
    'silver-rounds-pile': 'silver-coins-spill', 'silver-serving-tray': 'silver-tea-set',
    'gold-bars-row': 'gold-coins-pile', 'gold-bar-single': 'gold-coins-pile', 'gold-bars-fan': 'gold-coins-pile', 'gold-bars-stack': 'gold-coins-pile',
    'gold-chains-pile': 'gold-jewelry-mixed',
    'strip-kit-meter': 'strip-boxes-row-five', 'strip-boxes-cash': 'strip-boxes-stack', 'strip-boxes-fan': 'strip-boxes-stack', 'strip-boxes-pile-large': 'strip-boxes-stack',
    'car-hand-keys-over': 'car-sedan-rear', 'car-classic-side': 'car-sedan-rear', 'car-keys-fob': 'car-wheel-tyre',
    'car-truck-front': 'car-suv-side', 'car-van-cargo': 'car-suv-side', 'car-sedan-front': 'car-sedan-rear',
    'coin-rolls-paper': 'coin-graded-fan-three', 'coin-stack-silver': 'coin-silver-dollar-pair', 'coin-collection-tray': 'coin-slabs-stack',
    'coin-album-pages': 'coin-graded-fan-three',
    'own-apple-cosmic-orange-16': 'iphone-fan-four', 'iphone-15-pro-back-black': 'iphone-fan-four', 'iphone-pair-front-back': 'iphone-fan-four',
    'iphone-trio-fan': 'iphone-fan-four',
    'iphone-hand-back-offer': 'iphone-17-pro-back-silver', 'iphone-16-back-teal': 'iphone-15-pro-back-blue',
    'iphone-floating-tilt': 'iphone-fan-four', 'iphone-hand-hold': 'iphone-15-pro-front-on',
    'iphone-back-flat-straight': 'iphone-15-pro-back-white', 'iphone-back-lean-stack': 'iphone-fan-four',
    'iphone-17-pro-back-orange': 'iphone-17-pro-back-black',
    'ipad-with-pencil': 'ipad-front', 'tablet-watch': 'apple-watch-pair', 'watch-stack-four': 'apple-watch-stack-three',
    'own-stock-macbook-stack': 'mac-air-open-angle', 'mac-pair-open-angle': 'mac-pro-open-front',
    'sam-s24-back-cream': 'sam-s24-ultra-back', 'sam-trio-lineup': 'sam-pile-mixed', 'sam-pair-front-back': 'sam-pile-mixed',
    'pix-9-pro-back': 'pix-9-back-green', 'pix-pair-angle': 'pix-trio-lineup', 'pix-watch-round': 'sam-watch-pair',
    'drone-open-props': 'drone-folded',
    'cash-single-hundred': 'cash-stack-banded', 'cash-envelope-stuffed': 'cash-bundles-pyramid',
    'bundle-with-cash': 'cash-stack-banded', 'keyboard-mouse-set': 'mac-pro-open-front',
    'sports-cards-spread': 'sports-slabs-stack', 'sports-binder-open': 'sports-slabs-fan-five',
    'coin-slab': 'coin-silver-dollar-pair', 'car-keys': 'car-title-keys',
}
_size = {}
def size(name):
    if name not in _size: _size[name] = Image.open(os.path.join(CUT, name + '.webp')).size
    return _size[name]
flags = {k for k in json.load(open(os.path.join(ROOT, 'assets', 'cutout-flags.json'))) if not k.startswith('_')}
missing = flags - set(REPLACE)
if missing: sys.exit('no replacement chosen for: ' + ', '.join(sorted(missing)))
for k, v in REPLACE.items():
    if v in flags: sys.exit(k + ' -> ' + v + ' is itself flagged')

def js(v):
    """the numbers as JSON.stringify writes them (210, not 210.0), so a record
    this touches differs from the one the JS tools wrote only where it changed"""
    if isinstance(v, float) and v.is_integer(): return int(v)
    if isinstance(v, dict): return {k: js(x) for k, x in v.items()}
    if isinstance(v, list): return [js(x) for x in v]
    return v

def refit(p, old, new):
    """the new picture inside the old one's drawn box, same centre"""
    ow, oh = size(old); nw, nh = size(new)
    s = min((p.get('w') or 420) / ow, (p['maxH'] / oh) if p.get('maxH') else float('inf'))
    bw, bh = ow * s, oh * s                                   # the old drawn box
    t = min(bw / nw, bh / nh)
    dw, dh = nw * t, nh * t
    ox, oy = p.get('originX', 'left'), p.get('originY', 'top')
    if ox == 'left': p['left'] = p.get('left', 0) + (bw - dw) / 2
    elif ox == 'right': p['left'] = p.get('left', 0) - (bw - dw) / 2
    if oy == 'top': p['top'] = p.get('top', 0) + (bh - dh) / 2
    elif oy == 'bottom': p['top'] = p.get('top', 0) - (bh - dh) / 2
    p['w'] = round(dw, 1); p['maxH'] = round(dh, 1)
    p['src'] = p['src'].replace(old, new)
    return p

idx = json.load(open(os.path.join(DIR, 'index.json')))
touched, n = [], 0
for c in idx:
    f = os.path.join(DIR, 'tpl', c['id'] + '.json')
    rec = json.load(open(f)); hit = False
    for l in rec['tpl']['layers']:
        if l.get('kind') != 'cutout' or not l.get('props', {}).get('src'): continue
        base = os.path.basename(l['props']['src'])[:-5]
        if base in REPLACE:
            refit(l['props'], base, REPLACE[base]); hit = True; n += 1
    if hit:
        touched.append(c['id'])
        if c.get('product') and c['product'].replace('.webp', '') in REPLACE: c['product'] = REPLACE[c['product'].replace('.webp', '')]
        if WRITE: json.dump(js(rec), open(f, 'w'), separators=(',', ':'), ensure_ascii=False)
if WRITE: json.dump(js(idx), open(os.path.join(DIR, 'index.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print(f'pictures swapped {n} on {len(touched)} cards' + (' · written' if WRITE else ' · dry run'))
if '--ids-out' in sys.argv: json.dump(touched, open(sys.argv[sys.argv.index('--ids-out') + 1], 'w'))
