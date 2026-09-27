#!/usr/bin/env python3
"""SCRAPED PHOTOGRAPHS IN, ENGINE ASSETS OUT.

The owner, 2026-09-27: "We can just scrape separately and implement as assets
into our engine." Drop the files in incoming/ (the repo root; git ignores it),
optionally with incoming/manifest.csv, and run:

  python3 scripts/ingest_assets.py            # a dry run: incoming/_review.jpg shows what would land
  python3 scripts/ingest_assets.py --write    # land them

Two kinds of file:

  cutout  a product picture. A retailer or maker packshot on a plain background
          (white, grey, any flat colour) is cut out here: the background is
          what is connected to the frame and close to the frame's colour, the
          edge is softened and cleaned of the old background's colour. A PNG or
          WebP that already has transparency is kept as it is. Then it is
          trimmed, given a margin, and checked:
            - whole: the product must not touch the edge of the photograph
              (a crop is refused, DESIGN-LAW 57);
            - big enough: 1000px on the long side is the aim, under 600 is
              refused (the offer cards draw products up to ~600px);
            - a busy background (a desk, a hand, a shop) is refused with a
              note: it needs cutting out by hand.
          Landed in assets/cutouts/<id>.webp, credited in
          assets/cutouts/ATTRIBUTION.json, registered in assets/library.json,
          and approved in assets/approved-assets.json under "sourced" (the
          owner chose it).
  photo   a ground for the offer cards (a card show, a collection, a desk).
          Centre-cropped to the 1080 card, measured for the shade its white
          type needs, landed in assets/bg-offer/<id>.jpg and credited.

manifest.csv (every column optional but `file`):
  file,id,kind,category,line,subject,source,license,artist,replaces
    id        the asset's name (default: from the file name)
    kind      cutout | photo (default: cutout)
    category  the library category (sports, poke, strips, iphones, electronics...)
    line      the offer line it serves (offer-library.js LINES keys: sports,
              pokemon, strips, pchandheld, gamingpc, headset, ssd, minipc,
              chromebook, metaglasses, galaxy, pixel, foldable, ...). A cutout
              is added to the line's pictures, ahead of what it had; a line
              that was type-only gets picture layouts. A photo becomes one of
              the line's grounds.
    subject   what it shows, in plain words (library.json `prompt`)
    source    the page it came from; license; artist: the credit
    replaces  a placeholder it supersedes (e.g. ph-sports-slab): the offer
              cards stop using the placeholder, and scripts/swap_flagged_cutouts.py
              swaps it on the showcase

What the engine reads: assets/offer-assets.json, and offer-assets.js (the same,
for the browser, loaded before offer-library.js). After --write, re-run
scripts/audit_templates.mjs --write (and the showcase chain if a placeholder
was replaced) so a picture that does not work on a card is held back.

needs: pillow, numpy, opencv-python-headless
"""
import csv, hashlib, json, os, re, sys, time
import numpy as np
from PIL import Image, ImageDraw, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WRITE = '--write' in sys.argv
IN = os.path.join(ROOT, sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else 'incoming')
CUT = os.path.join(ROOT, 'assets', 'cutouts')
BGO = os.path.join(ROOT, 'assets', 'bg-offer')
EXTRA_JSON = os.path.join(ROOT, 'assets', 'offer-assets.json')
EXTRA_JS = os.path.join(ROOT, 'offer-assets.js')
AIM, FLOOR = 1000, 600

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60]

def load_manifest():
    p = os.path.join(IN, 'manifest.csv')
    if not os.path.exists(p): return {}
    with open(p, newline='', encoding='utf-8') as f:
        return {row['file'].strip(): {k: (v or '').strip() for k, v in row.items() if k} for row in csv.DictReader(f) if row.get('file')}

# ── a packshot's background, removed ────────────────────────────────────────
def cut_out(im):
    """-> (RGBA image, note). Keeps existing transparency; else removes a flat
    background connected to the frame. None when the background is busy."""
    import cv2
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        rgba = im.convert('RGBA')
        if np.asarray(rgba)[..., 3].min() < 250: return rgba, 'kept its transparency'
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    h, w = rgb.shape[:2]
    border = np.concatenate([rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3), rgb[:, :3].reshape(-1, 3), rgb[:, -3:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    flat = (np.linalg.norm(border - bg, axis=1) < 24).mean()
    if flat < 0.85:
        sides = {'top': rgb[:3].reshape(-1, 3), 'bottom': rgb[-3:].reshape(-1, 3), 'left': rgb[:, :3].reshape(-1, 3), 'right': rgb[:, -3:].reshape(-1, 3)}
        off = [k for k, v in sides.items() if (np.linalg.norm(v - bg, axis=1) < 24).mean() < 0.9]
        if len(off) <= 2 and flat >= 0.5:
            return None, 'the product runs off the ' + ' and '.join(off) + ' edge: cut off (DESIGN-LAW 57), find a photograph of the whole thing'
        return None, f'busy background ({flat:.0%} of the frame is one colour): cut it out by hand'
    d = np.linalg.norm(rgb - bg, axis=2)
    LO, HI = 16.0, 48.0
    near = (d < LO).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    touch = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    back = np.isin(lab, list(touch)) & (near == 1)
    # the soft edge: a band either side of the boundary takes its alpha from the
    # distance to the background colour
    k = np.ones((5, 5), np.uint8)
    band = cv2.dilate(back.astype(np.uint8), k) & (1 - cv2.erode(back.astype(np.uint8), k))
    ramp = np.clip((d - LO) / (HI - LO), 0.35, 1.0)          # product pixels at the edge: never a hole
    alpha = np.where(back, 0.0, np.where(band.astype(bool), ramp, 1.0))
    # keep the product: components big enough to be it, drop specks
    fg = (alpha > 0.5).astype(np.uint8)
    n2, lab2, stats, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    keep = np.zeros_like(fg)
    big = [i for i in range(1, n2) if stats[i, cv2.CC_STAT_AREA] >= 0.01 * h * w]
    for i in big: keep |= (lab2 == i).astype(np.uint8)
    keep = cv2.dilate(keep, k)
    alpha = alpha * keep
    # clean the old background out of the edge pixels
    a3 = alpha[..., None]
    col = np.where(a3 > 0.02, (rgb - (1 - a3) * bg) / np.maximum(a3, 0.02), rgb)
    out = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), f'background {tuple(int(v) for v in bg)} removed'

def check_cutout(rgba):
    """-> (trimmed and padded image, fails, warns)"""
    a = np.asarray(rgba)[..., 3]
    ys, xs = np.nonzero(a > 8)
    if not len(xs): return rgba, ['nothing left after the background was removed'], []
    fails, warns = [], []
    h, w = a.shape
    edge = [('top', (a[0] > 200).mean()), ('bottom', (a[-1] > 200).mean()), ('left', (a[:, 0] > 200).mean()), ('right', (a[:, -1] > 200).mean())]
    cut = [f'{s} {v:.0%}' for s, v in edge if v > 0.05]
    if cut: fails.append('cut off at the edge of the photograph (' + ', '.join(cut) + '): the product must be whole')
    im = rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    pad = Image.new('RGBA', (im.width + 12, im.height + 12), (0, 0, 0, 0)); pad.alpha_composite(im, (6, 6))
    long = max(im.size)
    if long < FLOOR: fails.append(f'too small: {long}px on the long side, {FLOOR} is the least an offer card can use')
    elif long < AIM: warns.append(f'{long}px on the long side; {AIM} is the aim')
    return pad, fails, warns

def p90_of(im):
    return int(np.percentile(np.asarray(im.crop((0, 0, im.width, int(im.height * 2 / 3))).convert('L'), dtype=np.float32), 90))

# ── the review sheet ─────────────────────────────────────────────────────────
def review(rows, path):
    T = 260
    sheet = Image.new('RGB', (max(1, len(rows)) * (T * 2 + 30), T + 70), (255, 255, 255)); d = ImageDraw.Draw(sheet)
    for i, r in enumerate(rows):
        x = i * (T * 2 + 30) + 10
        if r['img'] is not None:
            im = r['img'].copy(); im.thumbnail((T, T))
            for j, bgc in enumerate(((236, 236, 236), (28, 30, 36))):
                tile = Image.new('RGBA', (T, T), bgc + (255,))
                if r['kind'] == 'cutout':
                    cb = ImageDraw.Draw(tile)
                    if j == 0:
                        for yy in range(0, T, 16):
                            for xx in range((yy // 16) % 2 * 16, T, 32): cb.rectangle([xx, yy, xx + 15, yy + 15], fill=(214, 214, 214, 255))
                tile.alpha_composite(im.convert('RGBA'), ((T - im.width) // 2, (T - im.height) // 2))
                sheet.paste(tile.convert('RGB'), (x + j * (T + 10), 10))
        verdict = 'REFUSED: ' + '; '.join(r['fails']) if r['fails'] else ('ok' + (' · ' + '; '.join(r['warns']) if r['warns'] else ''))
        d.text((x, T + 16), r['id'] + '  (' + r['kind'] + ')', fill=(0, 0, 0))
        d.text((x, T + 34), verdict[:90], fill=(170, 20, 20) if r['fails'] else (20, 110, 40))
        d.text((x, T + 50), r['note'][:90], fill=(90, 90, 90))
    sheet.save(path, quality=88)

def main():
    if not os.path.isdir(IN):
        os.makedirs(IN); print('made ' + IN + ': drop the scraped files (and manifest.csv) there, then run this again'); return
    man = load_manifest()
    files = sorted(f for f in os.listdir(IN) if not f.startswith('_') and f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
    if not files: print('nothing in ' + IN); return
    rows = []
    for f in files:
        m = man.get(f, {})
        kind = (m.get('kind') or 'cutout').lower()
        rid = slug(m.get('id') or os.path.splitext(f)[0])
        im = Image.open(os.path.join(IN, f)); im = ImageOps.exif_transpose(im)
        row = dict(file=f, id=rid, kind=kind, meta=m, fails=[], warns=[], note='', img=None)
        if kind == 'photo':
            if min(im.size) < 1080: row['warns'].append(f'{min(im.size)}px on the short side; the card is 1080')
            g = ImageOps.fit(im.convert('RGB'), (1080, 1080), Image.LANCZOS)
            row.update(img=g, note=f'p90 {p90_of(g)}', p90=p90_of(g))
        else:
            if os.path.exists(os.path.join(CUT, rid + '.webp')) and not m.get('replaces'):
                row['fails'].append(rid + ' already exists in assets/cutouts: give it another id')
            rgba, note = cut_out(im)
            row['note'] = note
            if rgba is None: row['fails'].append(note)
            else:
                img, fails, warns = check_cutout(rgba)
                row.update(img=img); row['fails'] += fails; row['warns'] += warns
        rows.append(row)
    review(rows, os.path.join(IN, '_review.jpg'))
    for r in rows:
        print(f"{r['id']:34s} {r['kind']:7s} " + ('REFUSED  ' + '; '.join(r['fails']) if r['fails'] else 'ok  ' + '; '.join(r['warns'])))
    print('review sheet: ' + os.path.join(IN, '_review.jpg'))
    if not WRITE: print('(dry run; pass --write to land the ones marked ok)'); return
    land([r for r in rows if not r['fails']])

def land(rows):
    if not rows: print('nothing to land'); return
    lp = os.path.join(ROOT, 'assets', 'library.json'); lib = json.load(open(lp))
    have = {a['slug']: a for a in lib['assets']}
    ap = os.path.join(ROOT, 'assets', 'approved-assets.json'); appr = json.load(open(ap)); grid = appr['asset-grid-v1']
    cat_att_p = os.path.join(CUT, 'ATTRIBUTION.json'); cat_att = json.load(open(cat_att_p)) if os.path.exists(cat_att_p) else {}
    bg_att_p = os.path.join(BGO, 'ATTRIBUTION.json'); bg_att = json.load(open(bg_att_p)) if os.path.exists(bg_att_p) else []
    extra = json.load(open(EXTRA_JSON)) if os.path.exists(EXTRA_JSON) else {}
    for k in ('size', 'sets', 'replaces', 'grounds'): extra.setdefault(k, {})
    credit = lambda m: {k: m[k] for k in ('source', 'license', 'artist') if m.get(k)}
    for r in rows:
        m = r['meta']
        if r['kind'] == 'photo':
            r['img'].save(os.path.join(BGO, r['id'] + '.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)
            bg_att = [a for a in bg_att if a.get('file') != r['id'] + '.jpg'] + [dict(file=r['id'] + '.jpg', **credit(m), note='owner-sourced, scripts/ingest_assets.py')]
            key = m.get('line') or m.get('category') or 'space'
            g = [x for x in extra['grounds'].get(key, []) if x['file'] != r['id']]
            extra['grounds'][key] = [dict(file=r['id'], p90=r['p90'])] + g
        else:
            p = os.path.join(CUT, r['id'] + '.webp'); r['img'].save(p, 'WEBP', quality=90, method=6)
            b = open(p, 'rb').read()
            row = dict(slug=r['id'], file=r['id'] + '.webp', kind='cutout', category=m.get('category') or r['id'].split('-')[0],
                       prompt=m.get('subject') or r['id'].replace('-', ' '), source='owner-sourced', w=r['img'].width, h=r['img'].height,
                       bytes=len(b), sha1=hashlib.sha1(b).hexdigest()[:12], url='assets/cutouts/' + r['id'] + '.webp')
            if r['id'] in have: have[r['id']].update(row)
            else: lib['assets'].append(row)
            if r['id'] not in grid['approved']: grid['approved'].append(r['id'])
            grid['sourced'] = sorted(set(grid.get('sourced', [])) | {r['id']})
            cat_att[r['id']] = dict(**credit(m), note='owner-sourced, scripts/ingest_assets.py')
            extra['size'][r['id']] = [r['img'].width, r['img'].height]
            if m.get('line'):
                sets = [s for s in extra['sets'].get(m['line'], []) if s != [[r['id'], 1]]]
                extra['sets'][m['line']] = [[[r['id'], 1]]] + sets
            if m.get('replaces'): extra['replaces'][m['replaces']] = r['id']
    lib['count'] = len(lib['assets']); lib['built'] = int(time.time())
    json.dump(lib, open(lp, 'w'), ensure_ascii=False, indent=1)
    json.dump(appr, open(ap, 'w'), ensure_ascii=False, indent=1)
    json.dump(cat_att, open(cat_att_p, 'w'), ensure_ascii=False, indent=2)
    json.dump(bg_att, open(bg_att_p, 'w'), ensure_ascii=False, indent=1)
    write_extra(extra)
    print(f'landed {len(rows)}: now run node scripts/audit_templates.mjs --write'
          + (' and the showcase chain (python3 scripts/swap_flagged_cutouts.py --write, ...)' if extra['replaces'] else ''))

def write_extra(extra):
    json.dump(extra, open(EXTRA_JSON, 'w'), ensure_ascii=False, indent=1)
    open(EXTRA_JS, 'w').write('/* generated by scripts/ingest_assets.py from assets/offer-assets.json; do not edit by hand.\n'
        '   Owner-sourced pictures and grounds for the offer family (offer-library.js reads this at load). */\n'
        'window.OFFER_ASSETS = ' + json.dumps(extra, ensure_ascii=False) + ';\n')

if __name__ == '__main__':
    if '--init' in sys.argv:
        write_extra({'size': {}, 'sets': {}, 'replaces': {}, 'grounds': {}}); print('wrote an empty ' + EXTRA_JS)
    else:
        main()
