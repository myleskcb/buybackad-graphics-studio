#!/usr/bin/env python3
"""THE FLAGGED AND REJECTED PICTURES, SWAPPED FOR CLEAN ONES.

assets/approved-assets.json is the owner's own pass over every picture (a
rejected one never ships) and assets/cutout-flags.json names the product
pictures found wrong since (an AI
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
    # Pokemon: the owner rejected every blank pack, box and fan ("nothing says
    # what is bought"); the real PSA Charizard (scripts/make_card_assets.py)
    'poke-booster': 'poke-psa-charizard', 'poke-elite-box': 'poke-psa-charizard', 'poke-binder-open': 'poke-psa-charizard',
    'poke-cards-fan': 'poke-psa-charizard', 'poke-booster-packs-fan': 'poke-psa-charizard', 'poke-packs-pile': 'poke-psa-charizard',
    'poke-cards-spread-face': 'poke-psa-charizard', 'poke-booster-box': 'poke-psa-charizard',
    'silver-bar-single': 'silver-coins-spill', 'silver-bars-row': 'silver-coins-spill', 'silver-bars-stack': 'silver-coins-spill',
    'silver-rounds-pile': 'silver-coins-spill', 'silver-serving-tray': 'silver-flatware-set', 'silver-tea-set': 'silver-flatware-set',
    'gold-bars-row': 'gold-coins-pile', 'gold-bar-single': 'gold-coins-pile', 'gold-bars-fan': 'gold-coins-pile', 'gold-bars-stack': 'gold-coins-pile',
    'gold-chains-pile': 'gold-jewelry-mixed', 'gold-nuggets-raw': 'gold-scrap-mixed',
    # test strips: the only approved picture until real boxes are sourced
    'strip-kit-meter': 'strip-boxes', 'strip-boxes-cash': 'strip-boxes', 'strip-boxes-fan': 'strip-boxes', 'strip-boxes-pile-large': 'strip-boxes',
    'strip-boxes-stack': 'strip-boxes', 'strip-box-open-vials': 'strip-boxes', 'strip-boxes-row-five': 'strip-boxes', 'strip-kit': 'strip-boxes',
    'strip-box-single': 'strip-boxes', 'strip-vials-pile': 'strip-boxes',
    'car-hand-keys-over': 'car-sedan-rear', 'car-classic-side': 'car-sedan-rear', 'car-keys-fob': 'car-wheel-tyre',
    'car-truck-front': 'car-suv-side', 'car-van-cargo': 'car-suv-side', 'car-sedan-front': 'car-sedan-rear',
    'car-keys': 'car-title-docs', 'car-title-keys': 'car-title-docs',
    'coin-rolls-paper': 'coin-graded-fan-three', 'coin-stack-silver': 'coin-silver-dollar-pair', 'coin-collection-tray': 'coin-slabs-stack',
    'coin-album-pages': 'coin-graded-fan-three', 'coin-slab': 'coin-silver-dollar-pair',
    'own-apple-cosmic-orange-16': 'ip-group-colour-lineup', 'iphone-15-pro-back-black': 'ip-group-colour-lineup', 'iphone-pair-front-back': 'ip-group-colour-lineup',
    'iphone-trio-fan': 'ip-group-colour-lineup', 'iphone-floating-tilt': 'ip-group-colour-lineup', 'iphone-back-lean-stack': 'ip-group-colour-lineup',
    'iphone-fan-four': 'ip-group-colour-lineup',
    'iphone-hand-back-offer': 'iphone-17-pro-back-silver', 'iphone-16-back-teal': 'iphone-15-pro-back-blue',
    'iphone-hand-hold': 'iphone-15-pro-front-on', 'iphone-back-flat-straight': 'iphone-15-pro-back-white',
    'iphone-17-pro-back-orange': 'iphone-17-pro-back-black',
    'ipad-with-pencil': 'ipad-with-stylus', 'ipad-front': 'ipad-front-screen-off', 'ipad-angle-tilt': 'ipad-angle-tilt-back',
    'ipad-cracked-screen': 'ipad-front-screen-off',
    'tablet-watch': 'apple-watch-stack-three', 'watch-stack-four': 'apple-watch-stack-three',
    'own-stock-macbook-stack': 'macbook-closed-stack', 'mac-pair-open-angle': 'mac-pro-open-front', 'mac-air-open-angle': 'macbook-open-angle',
    'macbook-open': 'macbook-open-angle',
    'sam-s24-back-cream': 'sam-s24-ultra-back', 'sam-trio-lineup': 'sam-s24-ultra-back', 'sam-pair-front-back': 'sam-s24-ultra-back',
    'pix-9-pro-back': 'pix-9-back-green', 'pix-pair-angle': 'pix-trio-lineup', 'pix-watch-round': 'sam-watch-pair',
    'drone-open-props': 'drone-folded',
    'cash-single-hundred': 'cash-stack-banded', 'cash-envelope-stuffed': 'cash-bundles-pyramid',
    'bundle-with-cash': 'cash-stack-banded', 'keyboard-mouse-set': 'mac-pro-open-front',
    # sports: the card placeholders, which show a card (the owner rejected the
    # blank ones: "the cards don't even have a brand or image on them")
    'sports-cards-spread': 'ph-sports-cards-fan', 'sports-binder-open': 'ph-sports-slabs-fan', 'sports-slabs-fan-five': 'ph-sports-slabs-fan',
    'sports-box-sealed': 'ph-sports-box', 'sports-slab-graded': 'ph-sports-slab', 'sports-cards': 'ph-sports-cards-fan',
    'sports-cards-stack-loose': 'ph-sports-cards-fan',
}
# approved, but blank cards, superseded by a picture that shows one (2026-09-27)
REPLACE.update({'poke-slabs-trio': 'poke-psa-charizard', 'sports-slabs-stack': 'ph-sports-slabs-fan'})
# a real picture the owner sourced replaces a placeholder (scripts/ingest_assets.py)
_extra = os.path.join(ROOT, 'assets', 'offer-assets.json')
if os.path.exists(_extra):
    for ph, real in json.load(open(_extra)).get('replaces', {}).items():
        REPLACE[ph] = real
        for k, v in list(REPLACE.items()):
            if v == ph: REPLACE[k] = real
_size = {}
def size(name):
    if name not in _size: _size[name] = Image.open(os.path.join(CUT, name + '.webp')).size
    return _size[name]
flags = {k for k in json.load(open(os.path.join(ROOT, 'assets', 'cutout-flags.json'))) if not k.startswith('_')}
grid = json.load(open(os.path.join(ROOT, 'assets', 'approved-assets.json')))['asset-grid-v1']
approved, rejected = set(grid['approved']), set(grid['rejected'])
def ok(name):
    """the rule in scripts/picture_gate.mjs, for the showcase's categories (none of
    them is one where an off-category rejection is lifted)"""
    return name in approved and name not in rejected and name not in flags
missing = flags - set(REPLACE)
if missing: sys.exit('no replacement chosen for: ' + ', '.join(sorted(missing)))
for k, v in REPLACE.items():
    if not ok(v): sys.exit(k + ' -> ' + v + ' is not a picture the owner approved (or it is flagged)')

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
    t = min(bw / nw, bh / nh, 1.0)                            # never past its own pixels
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
        elif not ok(base) and not l['props']['src'].startswith('logo:'):
            sys.exit(c['id'] + ' draws ' + base + ', which the owner rejected or never approved, and REPLACE has nothing for it')
    if hit:
        touched.append(c['id'])
        if c.get('product') and c['product'].replace('.webp', '') in REPLACE: c['product'] = REPLACE[c['product'].replace('.webp', '')]
        if WRITE: json.dump(js(rec), open(f, 'w'), separators=(',', ':'), ensure_ascii=False)
if WRITE: json.dump(js(idx), open(os.path.join(DIR, 'index.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print(f'pictures swapped {n} on {len(touched)} cards' + (' · written' if WRITE else ' · dry run'))
if '--ids-out' in sys.argv: json.dump(touched, open(sys.argv[sys.argv.index('--ids-out') + 1], 'w'))
