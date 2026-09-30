#!/usr/bin/env python3
"""CARD PICTURES FOR THE CARD CATEGORIES, until real ones are sourced.

The owner, 2026-09-27, on the sports offer cards: "it feels really incomplete
because the cards don't even have a brand or image on them. We need actual
cards", then "At least give us a bare minimum of base images that we can start
using as placeholders ... until we do a deep dive."

The library's card pictures were blank: white slabs, pastel windows, a
red-white-blue box (the owner's own pass of 2026-09-03 rejected most of them as
"blank-unbranded"). This makes two kinds of picture:

  REAL, from a freely licensed photograph already in the repo
    poke-psa-charizard   a PSA 10 1999 Base Set Charizard, cut straight-on out
                         of assets/bg-web/pokemon-charizard-card-2.jpg
                         (Wikimedia Commons, CC BY-SA 2.0, credit in
                         assets/cutouts/ATTRIBUTION.json). The perspective is
                         fitted to the card's yellow border and the label's red
                         border (OpenCV), the slab's outline measured in that
                         frame (83 x 139 mm, a PSA slab), the clear frame
                         evened to neutral acrylic so it sits on any ground,
                         and the slab's certificate number and barcode softened
                         so an ad does not name one person's card. Drawn at the
                         photograph's own resolution, never enlarged.

  PLACEHOLDERS, drawn here and named ph-* so they are easy to find and replace
    ph-sports-card-{basketball,baseball,football}   card fronts: a ball on a
                         light burst, a nameplate, a prizm sheen. No brand, no
                         player, no logo: nothing that claims to be a real card.
    ph-sports-slab       a slab of the real one's proportions with a neutral
                         label (no grade, no certificate number, no barcode)
    ph-sports-slabs-fan, ph-sports-cards-fan, ph-sports-box (a sealed box)

Every picture is registered in assets/library.json and approved in
assets/approved-assets.json under "placeholders" / "sourced", so the audits
accept them and a later pass can find every ph-* and swap in a real one.

  python3 scripts/make_card_assets.py [--write]
  needs: pillow, numpy, opencv-python-headless (the Charizard cut), and the
  Noto Emoji font (OFL; fetched from Google Fonts into the temp dir on first run,
  or NOTO_EMOJI=/path/to/font.ttf)
"""
import hashlib, json, math, os, sys, tempfile, time, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CUT = os.path.join(ROOT, 'assets', 'cutouts')
WRITE = '--write' in sys.argv
OUT = CUT if WRITE else os.environ.get('OUT', os.path.join(tempfile.gettempdir(), 'card-assets'))
os.makedirs(OUT, exist_ok=True)

def font(name, size):
    return ImageFont.truetype(os.path.join(ROOT, 'assets', 'fonts', name + '.woff2'), size)

def emoji_font(size):
    path = os.environ.get('NOTO_EMOJI') or os.path.join(tempfile.gettempdir(), 'noto-emoji-700.ttf')
    if not os.path.exists(path):
        css = urllib.request.urlopen('https://fonts.googleapis.com/css2?family=Noto+Emoji:wght@700').read().decode()
        url = css.split('url(')[1].split(')')[0]
        urllib.request.urlretrieve(url, path)
    return ImageFont.truetype(path, size)

def aa_mask(w, h, r):
    """a rounded rectangle with anti-aliased edges (drawn 4x, then reduced)"""
    m = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * 4 - 1, h * 4 - 1], radius=r * 4, fill=255)
    return m.resize((w, h), Image.LANCZOS)

def pad(im, n=6):
    """a transparent margin: the product never touches its own frame"""
    out = Image.new('RGBA', (im.width + 2 * n, im.height + 2 * n), (0, 0, 0, 0)); out.alpha_composite(im, (n, n))
    return out

def rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# ── the real one ─────────────────────────────────────────────────────────────
def charizard():
    import cv2
    src = cv2.cvtColor(cv2.imread(os.path.join(ROOT, 'assets/bg-web/pokemon-charizard-card-2.jpg')), cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(src, cv2.COLOR_RGB2HSV)
    def quad(mask, roi):
        m = np.zeros_like(mask); m[roi[1]:roi[3], roi[0]:roi[2]] = mask[roi[1]:roi[3], roi[0]:roi[2]]
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        c = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0], key=cv2.contourArea)
        h = cv2.convexHull(c)
        for eps in (0.01, 0.02, 0.03, 0.04, 0.05):
            ap = cv2.approxPolyDP(h, eps * cv2.arcLength(h, True), True)
            if len(ap) == 4: break
        p = ap.reshape(-1, 2).astype(np.float32)
        s, d = p.sum(1), np.diff(p, axis=1).ravel()        # order: TL, TR, BR, BL
        return np.float32([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]])
    card = quad(cv2.inRange(hsv, (18, 110, 150), (38, 255, 255)), (680, 400, 1150, 960))
    # card units: 0.1 mm, a standard card is 635 x 889
    H = cv2.getPerspectiveTransform(np.float32([[0, 0], [635, 0], [635, 889], [0, 889]]), card)
    X0, Y0, X1, Y1 = -98, -381, 733, 1009               # the slab, measured in the card's frame
    S = 0.43                                            # the photograph's own px per unit
    w, h = round((X1 - X0) * S), round((Y1 - Y0) * S)
    M = H @ np.array([[1 / S, 0, X0], [0, 1 / S, Y0], [0, 0, 1]])
    out = cv2.warpPerspective(src, M, (w, h), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    img = Image.fromarray(out)
    u = lambda x, y: ((x - X0) * S, (y - Y0) * S)
    # the certificate number and the barcode identify one person's slab: soften them
    for box in ((u(-5, -197), u(200, -146)), (u(455, -190), u(665, -136))):   # the barcode, the number
        (a, b), (c, d) = box
        r = img.crop((int(a), int(b), int(c), int(d))).filter(ImageFilter.GaussianBlur(4.5))
        img.paste(r, (int(a), int(b)))
    keep = Image.new('L', (w, h), 0); kd = ImageDraw.Draw(keep)
    kd.rectangle([u(-34, -334), u(690, -128)], fill=255)
    kd.rounded_rectangle([u(-14, -14), u(649, 903)], radius=6, fill=255)
    keep = keep.filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(img).astype(np.float32) / 255
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    frost = np.clip(0.82 + 0.25 * (lum - lum.mean()), 0, 1) * np.array([0.93, 0.945, 0.96])
    k = np.asarray(keep).astype(np.float32)[..., None] / 255
    res = a * k + frost * (1 - k)
    res = rim(res, w, h)
    o = Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)).convert('RGBA')
    o.putalpha(aa_mask(w, h, 14))
    return o

def rim(res, w, h, r=14):
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle([1, 1, w - 2, h - 2], radius=r, outline=255, width=2)
    d.rounded_rectangle([7, 7, w - 8, h - 8], radius=max(2, r - 4), outline=150, width=1)
    m = np.asarray(m).astype(np.float32)[..., None] / 255
    return res * (1 - 0.55 * m) + 0.55 * m

# ── placeholder card fronts ──────────────────────────────────────────────────
SPORT = {
    'basketball': dict(g1='#26104f', g2='#7b2cbf', acc='#ffb703', ball='\U0001F3C0', pos='POINT GUARD', num='23'),
    'baseball':   dict(g1='#0a2342', g2='#1f6fd1', acc='#e63946', ball='⚾', pos='SHORTSTOP', num='7'),
    'football':   dict(g1='#0b3d2e', g2='#1b8a5a', acc='#ffd166', ball='\U0001F3C8', pos='WIDE RECEIVER', num='88'),
}

def card(sport, W=700, H=980):
    s = SPORT[sport]; g1, g2, acc = rgb(s['g1']), rgb(s['g2']), rgb(s['acc'])
    y = np.linspace(0, 1, H)[:, None, None]
    img = np.broadcast_to(np.array(g1) * (1 - y) + np.array(g2) * y, (H, W, 3)).astype(np.float32).copy()
    yy, xx = np.mgrid[0:H, 0:W]; cx, cy = W * 0.5, H * 0.40
    rays = (np.sin(np.arctan2(yy - cy, xx - cx) * 14) > 0).astype(np.float32)
    glow = np.clip(1 - np.hypot(xx - cx, yy - cy) / (0.9 * H), 0, 1) ** 1.6
    img += (rays * 0.10 + 0.18)[..., None] * glow[..., None] * 255 * np.array([1, 0.95, 0.9])
    dots = Image.new('L', (W, H), 0); dd = ImageDraw.Draw(dots)
    for y0 in range(int(H * 0.55), H, 16):
        r = 2 + 5 * (y0 - H * 0.55) / (H * 0.45)
        for x0 in range((y0 // 16) % 2 * 8, W, 16): dd.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=40)
    img = np.clip(img + np.asarray(dots)[..., None] * 0.35, 0, 255)
    im = Image.fromarray(img.astype(np.uint8)).convert('RGBA')
    f = emoji_font(500); d0 = ImageDraw.Draw(im)
    bb = d0.textbbox((0, 0), s['ball'], font=f)
    gx, gy = (W - (bb[2] - bb[0])) // 2 - bb[0], int(H * 0.12) - bb[1]
    mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).text((gx, gy), s['ball'], font=f, fill=255)
    shadow = mask.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.6))
    im.alpha_composite(Image.merge('RGBA', [Image.new('L', (W, H), 0)] * 3 + [shadow]))
    ball = Image.new('RGBA', (W, H), acc + (255,)); ball.putalpha(mask); im.alpha_composite(ball)
    d = ImageDraw.Draw(im)
    ny = int(H * 0.74)
    d.polygon([(0, ny + 14), (W, ny - 14), (W, ny + 118), (0, ny + 146)], fill=acc + (255,))
    d.polygon([(0, ny + 146), (W, ny + 118), (W, ny + 132), (0, ny + 160)], fill=(255, 255, 255, 255))
    d.text((W // 2, ny + 62), s['pos'], font=font('oswald-700', 64), fill=g1 + (255,), anchor='mm')
    d.text((W // 2, H - 68), 'ROOKIE', font=font('teko-600', 46), fill=(255, 255, 255, 255), anchor='mm')
    d.ellipse([W - 150, 40, W - 44, 146], fill=(255, 255, 255, 235))
    d.text((W - 97, 95), s['num'], font=font('teko-700', 74), fill=g1 + (255,), anchor='mm')
    star = [(66 + 46 * math.cos(math.radians(-90 + i * 36)) * (1 if i % 2 == 0 else 0.45),
             93 + 46 * math.sin(math.radians(-90 + i * 36)) * (1 if i % 2 == 0 else 0.45)) for i in range(10)]
    d.polygon(star, fill=acc + (255,))
    t = (np.arange(W)[None, :] + np.arange(H)[:, None] * 0.6) / (W + H * 0.6)
    rb = np.stack([0.5 + 0.5 * np.sin(2 * np.pi * (t * 3 + o)) for o in (0, 0.33, 0.66)], -1)
    a = np.asarray(im).astype(np.float32) / 255
    a[..., :3] = 1 - (1 - a[..., :3]) * (1 - rb * 0.10)
    im = Image.fromarray((a * 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=26, outline=(248, 248, 246, 255), width=18)
    d.rounded_rectangle([18, 18, W - 19, H - 19], radius=14, outline=(200, 206, 214, 255), width=4)
    im.putalpha(aa_mask(W, H, 26))
    return im

# ── a slab of the real one's proportions, with a neutral label ───────────────
def slab(art, sport):
    S = 0.86; X0, Y0, X1, Y1 = -98, -381, 733, 1009
    w, h = round((X1 - X0) * S), round((Y1 - Y0) * S)
    u = lambda x, y: (round((x - X0) * S), round((y - Y0) * S))
    y = np.linspace(0, 1, h)[:, None, None]
    base = np.array([0.925, 0.935, 0.95]) * (1 - y) + np.array([0.86, 0.875, 0.895]) * y
    res = np.broadcast_to(base, (h, w, 3)).copy()
    im = Image.fromarray((res * 255).astype(np.uint8)).convert('RGBA'); d = ImageDraw.Draw(im)
    # the recesses: a darker edge where the label and the card sit into the frame
    for box, rr in (((u(-40, -340), u(696, -122)), 6), ((u(-20, -20), u(655, 909)), 10)):
        d.rounded_rectangle([box[0], box[1]], radius=rr, fill=(196, 203, 211, 255))
    lab = (u(-34, -334), u(690, -128))
    d.rectangle([lab[0], lab[1]], fill=(252, 252, 251, 255), outline=(141, 153, 166, 255), width=5)
    lx, ly = lab[0][0] + 26, lab[0][1] + 22
    d.text((lx, ly), 'ROOKIE CARD', font=font('oswald-600', 58), fill=(28, 32, 38, 255))
    d.text((lx, ly + 80), SPORT[sport]['pos'], font=font('oswald-400', 40), fill=(80, 88, 98, 255))
    cx, cy, R = lab[1][0] - 70, (lab[0][1] + lab[1][1]) // 2, 38
    d.polygon([(cx + R * math.cos(math.radians(-90 + i * 36)) * (1 if i % 2 == 0 else 0.45),
                cy + R * math.sin(math.radians(-90 + i * 36)) * (1 if i % 2 == 0 else 0.45)) for i in range(10)], fill=rgb(SPORT[sport]['acc']) + (255,))
    c0, c1 = u(0, 0), u(635, 889)
    im.alpha_composite(art.resize((c1[0] - c0[0], c1[1] - c0[1]), Image.LANCZOS), c0)
    # glare across the upper left, as on the photographed slab
    g = Image.new('L', (w, h), 0); gd = ImageDraw.Draw(g)
    gd.polygon([(0, int(h * 0.18)), (int(w * 0.55), 0), (int(w * 0.8), 0), (0, int(h * 0.42))], fill=36)
    g = g.filter(ImageFilter.GaussianBlur(18))
    im.alpha_composite(Image.merge('RGBA', [Image.new('L', (w, h), 255)] * 3 + [g]))
    a = np.asarray(im).astype(np.float32)[..., :3] / 255
    a = rim(a, w, h, r=28)
    o = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).convert('RGBA')
    o.putalpha(aa_mask(w, h, 28))
    return o

# ── groups: fanned, with one soft shadow under the whole group ───────────────
def fan(items, spread=13, step=0.30, lift=0.03):
    w, h = items[0].size; n = len(items)
    canvas = Image.new('RGBA', (int(w * (1 + step * (n - 1)) + w), int(h * 1.5)), (0, 0, 0, 0))
    order = [i for i in range(n) if i != n // 2] + [n // 2]         # the middle one in front
    for i in order:
        ang = (i - (n - 1) / 2) * spread
        r = items[i].rotate(-ang, resample=Image.BICUBIC, expand=True)
        x = int(w * 0.5 + (i - (n - 1) / 2) * step * w + (canvas.width - w) / 2 - r.width / 2)
        y = int(canvas.height / 2 - r.height / 2 + abs(i - (n - 1) / 2) * lift * h)
        sh = Image.new('RGBA', r.size, (0, 0, 0, 0)); sh.putalpha(r.getchannel('A').point(lambda v: int(v * 0.35)))
        sh = sh.filter(ImageFilter.GaussianBlur(16))
        canvas.alpha_composite(sh, (x + 10, y + 16)); canvas.alpha_composite(r, (x, y))
    return canvas.crop(canvas.getbbox())

# ── a sealed box: three faces in an oblique view, then shrink-wrap glare ─────
def warp_to(src, quad, size):
    """paint `src` onto the quadrilateral `quad` (TL, TR, BR, BL) of a canvas of `size`"""
    w, h = src.size
    A, B = [], []
    for (x, y), (u_, v_) in zip(quad, [(0, 0), (w, 0), (w, h), (0, h)]):
        A.append([x, y, 1, 0, 0, 0, -u_ * x, -u_ * y]); B.append(u_)
        A.append([0, 0, 0, x, y, 1, -v_ * x, -v_ * y]); B.append(v_)
    coef = np.linalg.solve(np.array(A, dtype=np.float64), np.array(B, dtype=np.float64))
    return src.transform(size, Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)

def box(arts):
    FW, FH, D = 1000, 620, (300, -200)
    front = Image.new('RGBA', (FW, FH), (14, 24, 52, 255)); d = ImageDraw.Draw(front)
    for k, c in enumerate(('#7b2cbf', '#1f6fd1', '#1b8a5a')):
        x = 380 + k * 150
        d.polygon([(x, FH), (x + 120, FH), (x + 420, 0), (x + 300, 0)], fill=rgb(c) + (255,))
        d.line([(x + 120, FH), (x + 420, 0)], fill=(232, 196, 104, 255), width=6)
    d.text((56, 70), 'TRADING', font=font('oswald-700', 132), fill=(255, 255, 255, 255))
    d.text((56, 212), 'CARDS', font=font('oswald-700', 132), fill=(255, 209, 102, 255))
    d.rectangle([56, 380, 560, 452], fill=(255, 255, 255, 255))
    d.text((74, 416), 'SEALED HOBBY BOX', font=font('oswald-600', 50), fill=(14, 24, 52, 255), anchor='lm')
    small = fan([a.resize((210, 294), Image.LANCZOS) for a in arts], spread=10, step=0.55, lift=0.02)
    front.alpha_composite(small, (FW - small.width - 30, FH - small.height - 26))
    top = Image.new('RGBA', (FW, 300), (32, 46, 88, 255)); td = ImageDraw.Draw(top)
    td.rectangle([0, 120, FW, 170], fill=(232, 196, 104, 255))
    side = Image.new('RGBA', (300, FH), (9, 16, 36, 255)); sd = ImageDraw.Draw(side)
    sd.rectangle([0, 380, 300, 452], fill=(200, 164, 80, 255))
    size = (FW + D[0] + 80, FH - D[1] + 80)
    ox, oy = 40, 40 - D[1]
    F = [(ox, oy), (ox + FW, oy), (ox + FW, oy + FH), (ox, oy + FH)]
    T = [(ox + D[0], oy + D[1]), (ox + FW + D[0], oy + D[1]), (ox + FW, oy), (ox, oy)]
    Sd = [(ox + FW, oy), (ox + FW + D[0], oy + D[1]), (ox + FW + D[0], oy + FH + D[1]), (ox + FW, oy + FH)]
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    out.alpha_composite(warp_to(top, T, size)); out.alpha_composite(warp_to(side, Sd, size)); out.alpha_composite(warp_to(front, F, size))
    # shrink-wrap: soft diagonal glare and a bright front edge
    g = Image.new('L', size, 0); gd = ImageDraw.Draw(g)
    for k in range(3):
        x = 180 + k * 420
        gd.polygon([(x, oy + FH), (x + 90, oy + FH), (x + 360, oy + D[1]), (x + 270, oy + D[1])], fill=30)
    gd.line([F[0], F[1]], fill=120, width=4); gd.line([F[1], Sd[1]], fill=90, width=3)
    g = g.filter(ImageFilter.GaussianBlur(10))
    shape = out.getchannel('A')
    g = Image.fromarray(np.minimum(np.asarray(g), np.asarray(shape)))
    out.alpha_composite(Image.merge('RGBA', [Image.new('L', size, 255)] * 3 + [g]))
    return out.crop(out.getbbox())

def main():
    made = {}
    try:
        made['poke-psa-charizard'] = charizard()
    except ImportError:
        print('opencv-python-headless not installed: skipping poke-psa-charizard')
    arts = {s: card(s) for s in SPORT}
    for s, a in arts.items(): made['ph-sports-card-' + s] = a
    made['ph-sports-slab'] = slab(arts['basketball'], 'basketball')
    made['ph-sports-slabs-fan'] = fan([slab(arts['baseball'], 'baseball'), slab(arts['basketball'], 'basketball'), slab(arts['football'], 'football')])
    made['ph-sports-cards-fan'] = fan([arts['baseball'], arts['basketball'], arts['football']])
    made['ph-sports-box'] = box([arts['baseball'], arts['basketball'], arts['football']])
    made = {k: pad(im) for k, im in made.items()}
    for k, im in made.items():
        p = os.path.join(OUT, k + '.webp'); im.save(p, 'WEBP', quality=90, method=6)
        print(f'{k:24s} {im.size[0]}x{im.size[1]}  {os.path.getsize(p) // 1024} KB  -> {p}')
    if WRITE: register(made)

SRC = {
    'poke-psa-charizard': dict(category='poke', source='photo', prompt='a PSA 10 graded 1999 Base Set Charizard holo, straight on, cut from a Wikimedia Commons photograph',
                               license='CC BY-SA 2.0', artist='Romer Jed Medina from Newark, NJ, United States',
                               page='https://commons.wikimedia.org/wiki/File:2021-10-8_to_2021-10-9_-_NYCC_(Touch_Edits_-_009)_(51573445803).jpg',
                               note='cut from assets/bg-web/pokemon-charizard-card-2.jpg; certificate number and barcode softened'),
}
def register(made):
    now = int(time.time())
    lp = os.path.join(ROOT, 'assets', 'library.json'); lib = json.load(open(lp))
    have = {a['slug']: a for a in lib['assets']}
    for k, im in made.items():
        p = os.path.join(CUT, k + '.webp'); b = open(p, 'rb').read()
        meta = SRC.get(k, dict(category='sports', source='placeholder',
                               prompt='placeholder drawn by scripts/make_card_assets.py until a real photograph is sourced: ' + k.replace('ph-sports-', '').replace('-', ' ')))
        row = dict(slug=k, file=k + '.webp', kind='cutout', category=meta['category'], prompt=meta['prompt'], source=meta['source'],
                   w=im.size[0], h=im.size[1], bytes=len(b), sha1=hashlib.sha1(b).hexdigest()[:12], url='assets/cutouts/' + k + '.webp')
        if k in have: have[k].update(row)
        else: lib['assets'].append(row)
    lib['count'] = len(lib['assets']); lib['built'] = now
    json.dump(lib, open(lp, 'w'), ensure_ascii=False, indent=1)
    ap = os.path.join(ROOT, 'assets', 'approved-assets.json'); appr = json.load(open(ap)); g = appr['asset-grid-v1']
    for k in made:
        if k not in g['approved']: g['approved'].append(k)
    g['placeholders'] = sorted(set(g.get('placeholders', [])) | {k for k in made if k.startswith('ph-')})
    g['sourced'] = sorted(set(g.get('sourced', [])) | {k for k in made if not k.startswith('ph-')})
    g['placeholdersNote'] = ('2026-09-27, the owner: "give us a bare minimum of base images that we can start using as placeholders '
                             'until we do a deep dive". ph-* are drawn by scripts/make_card_assets.py; "sourced" are cut from '
                             'freely licensed photographs (credit in assets/cutouts/ATTRIBUTION.json). Replace a ph-* when a real photograph lands.')
    json.dump(appr, open(ap, 'w'), ensure_ascii=False, indent=1)
    atp = os.path.join(CUT, 'ATTRIBUTION.json')
    att = json.load(open(atp)) if os.path.exists(atp) else {}
    for k, m in SRC.items():
        if k in made: att[k] = {kk: m[kk] for kk in ('license', 'artist', 'page', 'note')}
    json.dump(att, open(atp, 'w'), ensure_ascii=False, indent=2)
    print('registered in assets/library.json, assets/approved-assets.json, assets/cutouts/ATTRIBUTION.json')

if __name__ == '__main__':
    main()
