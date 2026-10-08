#!/usr/bin/env python3
"""The AI background generator's entities: the products a customer can put in
a generated scene, picked from the shop's own approved photographs.

Owner, 2026-10-08: "we use our fal.ai site with all of our iPhones as entities
so you can configure which devices you want, or you pick a category … they can
choose through assets they want in it, whether it's car models etc. So we can
use our existing assets as entities and call upon when necessary."

Every entity is a real photograph the library already approved. Picked, it goes
to the image model as a REFERENCE (fal Seedream edit), so the device in the
scene is the device in the photo: camera plateau, buttons, finish (owner,
2026-09-27: never re-skin a device). Nothing here is invented:

  Apple devices   assets/devices.json (device_catalog.py), finishes included;
                  iPhones only where assets/cutouts/devices.json calls the
                  photo authentic, newest first by its rank
  Cars            assets/vehicles.json (make, model, years, colour, view)
  Everything else assets/library.json cut-outs by category
  Never           anything in assets/cutout-flags.json (garbled, wrong product,
                  cut off at the frame) or an authentic:false re-skin

A category with no approved photograph of a thing still lists it as a named
subject (no picture, no reference): the name rides in the prompt instead.

Writes:
  assets/bggen-entities.json        the catalogue the picker and the server read
  assets/bggen-thumbs/<slug>.webp   192px picker thumbnails, alpha kept
  assets/bggen-refs/<slug>.jpg      1024px references flattened onto neutral
                                    grey: a transparent pixel can reach the
                                    model as black and swallow a black phone

The words that go around an entity in the prompt are NOT here: they are the
server's (netlify/lib/bggen.mjs) and never leave it.

usage: python3 scripts/bggen_entities.py          (only missing/stale images are rebuilt)
       python3 scripts/bggen_entities.py --force  (rebuild every image)
"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
A = lambda *p: os.path.join(ROOT, 'assets', *p)
CUT = A('cutouts')
THUMBS, REFS = A('bggen-thumbs'), A('bggen-refs')
FORCE = '--force' in sys.argv
os.makedirs(THUMBS, exist_ok=True); os.makedirs(REFS, exist_ok=True)

flags = json.load(open(A('cutout-flags.json')))
names = json.load(open(A('asset-names.json')))
models = json.load(open(A('devices.json')))['models']
photo = json.load(open(A('cutouts', 'devices.json')))['devices']
vehicles = json.load(open(A('vehicles.json')))
library = json.load(open(A('library.json')))['assets']

def exists(slug):
    return os.path.exists(os.path.join(CUT, slug + '.webp'))

def usable(slug):
    if not slug or slug in flags or not exists(slug): return False
    rec = photo.get('assets/cutouts/' + slug + '.webp')
    return not (rec and rec.get('authentic') is False)

def title(s):
    small = {'and', 'of', 'with', 'on', 'in'}
    return ' '.join(w if (i and w in small) else (w[:1].upper() + w[1:]) for i, w in enumerate(s.replace('-', ' ').split()))

def finish_label(key):
    return title(key)

# what a person would call each library photograph in a picker; the slugs
# are file names, written for the engine, not for the customer
LABELS = {
    'qs-set-iphone-colour-fan': 'iPhones fanned, every colour', 'qs-set-iphone-colour-row': 'iPhones in a row, every colour',
    'qs-set-iphone-generations': 'iPhone generations lineup', 'qs-set-iphone-grid-nine': 'Grid of nine iPhones',
    'qs-set-iphone-hero-trio': 'Three iPhones, hero shot', 'qs-set-iphone-mini-pair': 'iPhone mini pair',
    'qs-set-iphone-pro-row': 'iPhone Pro row', 'qs-set-iphone-promax-fan': 'iPhone Pro Max fan',
    'sam-s24-ultra-back': 'Galaxy S24 Ultra (back)', 'sam-s24-ultra-front': 'Galaxy S24 Ultra (front)',
    'sam-s24-back-violet': 'Galaxy S24, violet', 'sam-s23-back-green': 'Galaxy S23, green',
    'samsung-galaxy-back': 'Galaxy phone (back)', 'samsung-galaxy-front': 'Galaxy phone (front)',
    'sam-fold-open-flat': 'Galaxy Z Fold, open flat', 'sam-fold-half': 'Galaxy Z Fold, half open', 'samsung-fold-open': 'Galaxy Z Fold, open',
    'sam-flip-open': 'Galaxy Z Flip, open', 'sam-flip-closed': 'Galaxy Z Flip, closed', 'sam-pile-mixed': 'Pile of Galaxy phones',
    'sam-cracked-screen': 'Galaxy with cracked screen',
    'pix-9-back-obsidian': 'Pixel 9, obsidian', 'pix-9-back-green': 'Pixel 9, green', 'pix-9-pro-back': 'Pixel 9 Pro (back)',
    'pix-9-front': 'Pixel 9 (front)', 'pix-fold-open': 'Pixel Fold, open', 'pix-trio-lineup': 'Three Pixels lineup',
    'pix-pair-angle': 'Pixel pair', 'pix-cracked-screen': 'Pixel with cracked screen', 'phone-flip-open': 'Flip phone, open',
    'phone-flip-closed': 'Flip phone, closed', 'android-pair': 'Two Android phones', 'android-trio': 'Three Android phones',
    'laptop-gaming-open': 'Gaming laptop', 'laptop-windows-open': 'Windows laptop',
    'sam-buds-case': 'Galaxy Buds in case', 'pix-buds-case': 'Pixel Buds in case', 'speaker-portable': 'Portable speaker',
    'tv-flatscreen': 'Flat-screen TV', 'smart-tv-stand': 'Smart TV on stand', 'router-modem': 'Wi-Fi router',
    'powerbank-pair': 'Power banks', 'cables-bundle': 'Charging cables', 'chargers-adapters': 'Chargers and adapters',
    'apple-watch-pair': 'Two Apple Watches', 'apple-watch-single': 'Apple Watch, sport band', 'gold-watch-luxury': 'Gold luxury watch',
    'car-title-keys': 'Car title and keys', 'car-title-docs': 'Car title documents', 'car-wheel-tyre': 'Wheel and tyre', 'car-engine-bay': 'Engine bay',
    'gold-bracelet-cuban': 'Gold Cuban link bracelet', 'gold-class-ring': 'Gold class ring', 'gold-earrings-pile': 'Gold earrings',
    'gold-jewelry': 'Gold jewelry pile', 'gold-necklace-single': 'Gold necklace', 'gold-nuggets-raw': 'Raw gold nuggets',
    'gold-rings-scatter': 'Gold rings', 'gold-scale-weighing': 'Gold on a jeweller\'s scale', 'gold-teeth-dental': 'Dental gold',
    'silver-candlesticks': 'Silver candlesticks', 'silver-flatware-set': 'Sterling flatware set', 'silver-tea-set': 'Silver tea set',
    'coin-single-large': 'Silver dollar coin', 'coin-slab-graded': 'Graded coin slab',
    'poke-booster-box': 'Booster box, sealed', 'poke-booster-packs-fan': 'Booster packs fanned', 'poke-cards-spread-face': 'Cards spread',
    'poke-graded-slab': 'Graded card slab', 'poke-packs-pile': 'Pile of booster packs', 'poke-slab': 'Card slab',
    'poke-slabs-trio': 'Three graded slabs', 'poke-psa-charizard': 'PSA graded Charizard',
    'sports-box-sealed': 'Hobby box, sealed', 'sports-cards-stack-loose': 'Stack of sports cards', 'sports-cards': 'Sports cards',
    'sports-slab-graded': 'Graded sports slab', 'sports-slabs-fan-five': 'Five graded slabs', 'sports-slabs-stack': 'Stack of graded slabs',
    'ph-sports-card-basketball': 'Basketball card', 'ph-sports-card-baseball': 'Baseball card', 'ph-sports-card-football': 'Football card',
    'ph-sports-slab': 'Graded slab', 'ph-sports-slabs-fan': 'Graded slabs fanned', 'ph-sports-cards-fan': 'Sports cards fanned', 'ph-sports-box': 'Sports card box',
    'strip-box-open-vials': 'Test strip box with vials', 'strip-box-single': 'Test strip box', 'strip-boxes-row-five': 'Five strip boxes in a row',
    'strip-boxes-stack': 'Stack of strip boxes', 'strip-boxes': 'Test strip boxes', 'strip-kit': 'Glucose meter kit',
    'strip-meter-hand': 'Glucose meter in hand', 'strip-vials-pile': 'Pile of strip vials',
    'cash-brick-wrapped': 'Brick of hundreds', 'cash-bundles-pyramid': 'Cash bundle pyramid', 'cash-bundles': 'Banded cash bundles',
    'cash-fan-hundreds': 'Fan of hundreds', 'cash-fan-twenties': 'Fan of twenties', 'cash-fan': 'Cash fan', 'cash-hand-fan': 'Hand fanning cash',
    'cash-roll-band': 'Cash roll', 'cash-scatter-loose': 'Loose bills', 'cash-spread-hand-count': 'Counting cash',
    'cash-stack-banded': 'Banded cash stack', 'cash-stack': 'Cash stack', 'cash-two-hands-count': 'Two hands counting cash',
    'hand-offering-cash': 'Hand offering cash', 'money-bag-sack': 'Money bag', 'safe-open-cash': 'Open safe with cash', 'shopping-bag-cash': 'Bag of cash',
}

def lib_label(slug):
    return LABELS.get(slug) or names.get(slug) or title(re.sub(r'^(qs|ph|own)-', '', slug))

def apple_name(key, name):
    if name == key:  # devices.json fell back to its key (mac-mini-m1, mac-studio-2025)
        m = re.match(r'^mac-(mini|studio)-(.+)$', key)
        if m: name = 'Mac %s (%s)' % ({'mini': 'mini', 'studio': 'Studio'}[m.group(1)], m.group(2).upper().replace('PRO', ' Pro'))
    return re.sub(r' Mini\b', ' mini', name)

# ---------- images ----------
built = {'thumb': 0, 'ref': 0}
def stale(dst, src):
    return FORCE or not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)

def make_images(slug):
    src = os.path.join(CUT, slug + '.webp')
    t, r = os.path.join(THUMBS, slug + '.webp'), os.path.join(REFS, slug + '.jpg')
    if stale(t, src) or stale(r, src):
        im = Image.open(src).convert('RGBA')
        if stale(t, src):
            th = im.copy(); th.thumbnail((192, 192), Image.LANCZOS)
            th.save(t, 'WEBP', quality=72, method=6); built['thumb'] += 1
        if stale(r, src):
            ref = im.copy(); ref.thumbnail((1024, 1024), Image.LANCZOS)
            flat = Image.new('RGB', ref.size, (217, 217, 217))
            flat.paste(ref, mask=ref.split()[3])
            flat.save(r, 'JPEG', quality=84, optimize=True, progressive=True); built['ref'] += 1
    return {'thumb': 'assets/bggen-thumbs/' + slug + '.webp', 'ref': 'assets/bggen-refs/' + slug + '.jpg'}

def item(key, label, slug, **extra):
    out = {'id': key, 'label': label}
    if slug: out.update(make_images(slug))
    out.update({k: v for k, v in extra.items() if v not in (None, [], '')})
    return out

def named(key, label, emoji):
    """a subject with no approved photograph: named in the prompt, no reference"""
    return {'id': key, 'label': label, 'emoji': emoji}

# ---------- Apple devices (devices.json) ----------
def apple_items(pred, sort=None):
    out = []
    for key, m in models.items():
        if not pred(key, m): continue
        fins = []
        for fk, f in sorted((m.get('colours') or {}).items()):
            if usable(f.get('slug')):
                fins.append(dict(item(fk, finish_label(fk), f['slug']), hex=f.get('hex')))
        art = m.get('art') if usable(m.get('art')) else None
        if not art and not fins: continue
        rec = photo.get('assets/cutouts/' + (art or '') + '.webp') or {}
        if m['line'] == 'iphone' and art and not rec.get('authentic'):
            continue  # the iPhone photos are held to the authentic list
        it = item(key, apple_name(key, m['name']), art or m['colours'][fins[0]['id']]['slug'], finishes=fins)
        if art is None: it['default_finish'] = fins[0]['id']
        if rec.get('recommended'): it['hot'] = True
        it['_rank'] = rec.get('rank', 99)
        out.append(it)
    out.sort(key=sort or (lambda x: x['label']))
    for x in out: x.pop('_rank', None)
    return out

# the 17 Pro's own back and side photographs are its finishes (cutouts/devices.json)
EXTRA_FINISH = {'iphone-17-pro': [('silver', 'ip-gen17-plateau-white', '#d9dadc'), ('deep-blue', 'ip-gen17-plateau-blue', '#3b4a63')]}

def num(label):
    m = re.search(r'(\d+)', label)
    return int(m.group(1)) if m else 0

iphones = apple_items(lambda k, m: m['line'] == 'iphone', sort=lambda x: (x['_rank'], x['label']))
for it in iphones:
    for fk, slug, hx in EXTRA_FINISH.get(it['id'], []):
        if usable(slug) and not any(f['id'] == fk for f in it.get('finishes', [])):
            it.setdefault('finishes', []).append(dict(item(fk, finish_label(fk), slug), hex=hx))
def by_family(order):
    """family in the order given, then newest first: label descending puts
    M5 over M4 and 13-inch over 12.9-inch"""
    def key(x):
        fam = next((i for i, f in enumerate(order) if x['label'].startswith(f)), len(order))
        return (fam, [-ord(c) for c in x['label']])
    return key

ipads = apple_items(lambda k, m: m['name'].startswith('iPad'), sort=by_family(['iPad Pro', 'iPad Air', 'iPad mini', 'iPad']))
macs = apple_items(lambda k, m: m['line'] == 'mac', sort=by_family(['MacBook Pro', 'MacBook Air', 'MacBook Neo', 'iMac', 'Mac mini', 'Mac Studio']))
watches = apple_items(lambda k, m: m['line'] == 'watch', sort=lambda x: (-('Ultra' in x['label']), -num(x['label']), x['label']))
airpods = apple_items(lambda k, m: m['line'] == 'airpods', sort=lambda x: x['label'])
apple_home = apple_items(lambda k, m: m['line'] == 'other' and not m['name'].startswith('iPad'), sort=lambda x: x['label'])

def lib(slugs):
    return [item(s, lib_label(s), s) for s in slugs if usable(s)]

def lib_cat(cat, drop=()):
    return [item(a['slug'], lib_label(a['slug']), a['slug']) for a in library
            if a['kind'] == 'cutout' and a['category'] == cat and usable(a['slug'])
            and not any(re.search(d, a['slug']) for d in drop)]

# ---------- cars (vehicles.json) ----------
def cars(kinds):
    out = [item(k, v['label'], k, brand=v.get('brand'))
           for k, v in vehicles.items() if v.get('kind') in kinds and exists(k) and k not in flags]
    out.sort(key=lambda x: x['label'])
    return out

groups = {
    'iphone':   {'label': 'iPhone', 'items': iphones},
    'iphone-sets': {'label': 'iPhone lineups', 'items': lib([a['slug'] for a in library if a['slug'].startswith('qs-set-iphone-')])},
    'samsung':  {'label': 'Samsung', 'items': lib(['sam-s24-ultra-back', 'sam-s24-ultra-front', 'sam-s24-back-violet', 'sam-s23-back-green',
                                                    'samsung-galaxy-back', 'samsung-galaxy-front', 'sam-fold-open-flat', 'sam-fold-half', 'samsung-fold-open',
                                                    'sam-flip-open', 'sam-flip-closed', 'sam-pile-mixed', 'sam-cracked-screen'])},
    'pixel':    {'label': 'Pixel & Android', 'items': lib(['pix-9-pro-back', 'pix-9-back-obsidian', 'pix-9-back-green', 'pix-9-front', 'pix-fold-open',
                                                            'pix-trio-lineup', 'pix-pair-angle', 'pix-cracked-screen', 'phone-flip-open', 'phone-flip-closed',
                                                            'android-pair', 'android-trio'])},
    'ipad':     {'label': 'iPad', 'items': ipads},
    'mac':      {'label': 'Mac', 'items': macs},
    'laptops':  {'label': 'Laptops', 'items': lib(['laptop-gaming-open', 'laptop-windows-open'])},
    'watch':    {'label': 'Apple Watch', 'items': watches},
    'airpods':  {'label': 'AirPods', 'items': airpods},
    'apple-home': {'label': 'Apple TV, HomePod & Vision', 'items': apple_home},
    'audio-more': {'label': 'More audio', 'items': lib(['sam-buds-case', 'pix-buds-case', 'speaker-portable']) + [named('n-overear-headphones', 'Over-ear headphones', '🎧')]},
    'electronics': {'label': 'Electronics', 'items': lib(['tv-flatscreen', 'smart-tv-stand', 'router-modem', 'powerbank-pair', 'cables-bundle', 'chargers-adapters'])},
    'consoles': {'label': 'Consoles & games', 'items': [named('n-console', 'Home game console', '🎮'), named('n-handheld', 'Handheld game console', '🕹️'),
                                                        named('n-controllers', 'Wireless controllers', '🎮'), named('n-vr', 'VR headset', '🥽'),
                                                        named('n-games', 'Boxed video games', '💿')]},
    'cameras':  {'label': 'Cameras & drones', 'items': [named('n-dslr', 'DSLR camera', '📷'), named('n-mirrorless', 'Mirrorless camera', '📸'),
                                                         named('n-lenses', 'Camera lenses', '🔭'), named('n-drone', 'Folding camera drone', '🚁'),
                                                         named('n-action-cam', 'Action camera', '🎥')]},
    'wear-more': {'label': 'More wearables', 'items': lib(['apple-watch-pair', 'apple-watch-single', 'gold-watch-luxury']) + [named('n-smart-glasses', 'Smart glasses', '🕶️')]},
    'cars':     {'label': 'Cars', 'items': cars({'car'}), 'search': True},
    'trucks':   {'label': 'Trucks & vans', 'items': cars({'truck', 'van', 'semi'}), 'search': True},
    'bikes':    {'label': 'Motorcycles', 'items': cars({'bike'})},
    'car-extras': {'label': 'Keys, title & parts', 'items': lib(['car-title-keys', 'car-title-docs', 'car-wheel-tyre', 'car-engine-bay'])},
    'gold':     {'label': 'Gold & jewelry', 'items': lib_cat('gold')},
    'silver':   {'label': 'Silver', 'items': lib_cat('silver', drop=(r'^own-',)) + [named('n-silver-bars', 'Silver bullion bars', '🥈'), named('n-silver-dollars', 'Silver dollar coins', '🪙')]},
    'coins':    {'label': 'Coins', 'items': lib_cat('coins') + [named('n-coin-album', 'Coin collection album', '📒'), named('n-gold-coins', 'Gold bullion coins', '🪙'),
                                                                 named('n-silver-dollars', 'Silver dollar coins', '🪙')]},
    'pokemon':  {'label': 'Trading cards', 'items': lib_cat('poke')},
    'sports':   {'label': 'Sports cards', 'items': lib_cat('sports')},
    'strips':   {'label': 'Test strips', 'items': lib_cat('strips')},
    'cash':     {'label': 'Cash', 'items': lib_cat('cash', drop=(r'^bundle-',))},
}

# the picker's tabs per category, in the order shown; ids are the studio's
# CATS ids (app.js), so the generator opens on the category being edited
categories = {
    'phones':    ['iphone', 'iphone-sets', 'samsung', 'pixel', 'ipad', 'cash'],
    'gaming':    ['consoles', 'electronics', 'cash'],
    'gold':      ['gold', 'cash'],
    'coins':     ['coins', 'cash'],
    'pokemon':   ['pokemon', 'cash'],
    'silver':    ['silver', 'cash'],
    'cars':      ['cars', 'trucks', 'bikes', 'car-extras', 'cash'],
    'sports':    ['sports', 'cash'],
    'computers': ['mac', 'ipad', 'laptops', 'electronics', 'cash'],
    'audio':     ['airpods', 'audio-more', 'apple-home', 'cash'],
    'wearables': ['watch', 'wear-more', 'cash'],
    'cameras':   ['cameras', 'cash'],
    'strips':    ['strips', 'cash'],
}
for c, gs in categories.items():
    for g in gs: assert g in groups, (c, g)
groups = {k: v for k, v in groups.items() if v['items']}
categories = {c: [g for g in gs if g in groups] for c, gs in categories.items()}

ids = {}
for g, v in groups.items():
    for it in v['items']:
        ids.setdefault(it['id'], []).append(g)

out = {
    '_doc': 'Written by scripts/bggen_entities.py: the products the AI background generator can put in a scene, all from approved library photographs. '
            'An entity is <group>:<id>, with @<finish> for a finish. thumb is the picker image; ref is the flattened reference the server sends to the image model. '
            'Items with emoji and no ref are named subjects: no approved photograph yet, so the name rides in the prompt. The prompt wording is server-side only.',
    'categories': categories,
    'groups': groups,
}
with open(A('bggen-entities.json'), 'w') as f:
    json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
# a photograph that left the catalogue takes its thumbnail and reference with it
keep = {os.path.basename(p) for v in groups.values() for it in v['items']
        for x in [it] + it.get('finishes', []) for p in (x.get('thumb'), x.get('ref')) if p}
pruned = 0
for d in (THUMBS, REFS):
    for f in os.listdir(d):
        if f not in keep: os.remove(os.path.join(d, f)); pruned += 1
n = sum(len(v['items']) for v in groups.values())
nf = sum(len(it.get('finishes', [])) for v in groups.values() for it in v['items'])
print(f'{n} entities ({nf} finishes) in {len(groups)} groups over {len(categories)} categories; '
      f'built {built["thumb"]} thumbnails, {built["ref"]} references, pruned {pruned}')
