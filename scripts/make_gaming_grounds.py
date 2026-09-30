#!/usr/bin/env python3
"""GAMING ROOMS: grounds for the gaming lines, until the photographs come.

The owner, 2026-09-27, on the console offer cards: "While space is a good
background for quite literally anything that needs just a basic background
for the asset to live in.. particularly for these game consoles I think it
would be a good idea to show either gamer bedrooms, gamer living rooms,
aesthetic gaming set ups".

This container cannot reach a photo library, so these are drawn: three rooms
lit the way those rooms are lit (RGB strips, screens, a TV's bias light,
hexagon panels, fan rings), then put out of focus like a photograph taken for
the product in front, so the product and the words stay the subject. They are
placeholders: docs/scrape-intake.md asks for real photographs of the same
three rooms, and scripts/ingest_assets.py lands them (a `photo` row with
line=console replaces these for the gaming lines).

  python3 scripts/make_gaming_grounds.py   -> assets/bg-offer/gaming-*.jpg, + grounds.json, ATTRIBUTION.json

Each is measured the way make_offer_grounds.py measures its photographs (p90
of the upper two thirds), so the offer family solves its shade from it
(DESIGN-LAW 56).

Needs: pip install pillow numpy opencv-python-headless
"""
import json, os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'bg-offer')
S = 2160                     # drawn at twice the card, then put out of focus and halved
rng = np.random.default_rng(7)

def hexf(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32) ** 2.2   # linear light

def canvas():
    return np.zeros((S, S, 3), np.float32)

def vgrad(img, y0, y1, c0, c1, x0=0, x1=S):
    y0, y1 = int(y0), int(y1)
    t = np.linspace(0, 1, max(1, y1 - y0), dtype=np.float32)[:, None, None]
    img[y0:y1, int(x0):int(x1)] = c0 * (1 - t) + c1 * t

def glow(em, sigma):
    return cv2.GaussianBlur(em, (0, 0), sigma)

def bloom(em):
    # a light seen through a lens: the core, a halo and a wide wash
    return em + 0.55 * glow(em, S * 0.006) + 0.35 * glow(em, S * 0.02) + 0.25 * glow(em, S * 0.06)

def poly(img, pts, col, alpha=1.0):
    m = np.zeros((S, S), np.float32)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1.0, lineType=cv2.LINE_AA)
    img[:] = img * (1 - alpha * m[..., None]) + col * (alpha * m[..., None])

def rect(img, x0, y0, x1, y1, col, alpha=1.0):
    poly(img, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], col, alpha)

def add_rect(em, x0, y0, x1, y1, col, k=1.0):
    m = np.zeros((S, S), np.float32)
    cv2.rectangle(m, (int(x0), int(y0)), (int(x1), int(y1)), 1.0, -1, lineType=cv2.LINE_AA)
    em += k * m[..., None] * col

def strip(em, x0, x1, y, width, c0, c1, k=1.0):
    # an RGB strip: its hue runs along it
    n = int(x1 - x0)
    t = np.linspace(0, 1, n, dtype=np.float32)[None, :, None]
    band = c0 * (1 - t) + c1 * t
    y0 = int(y - width / 2)
    em[y0:y0 + int(width), int(x0):int(x0) + n] += k * band

def disc(em, cx, cy, r, col, k=1.0):
    m = np.zeros((S, S), np.float32)
    cv2.circle(m, (int(cx), int(cy)), int(r), 1.0, -1, lineType=cv2.LINE_AA)
    em += k * m[..., None] * col

def ring(em, cx, cy, r, w, col, k=1.0):
    m = np.zeros((S, S), np.float32)
    cv2.circle(m, (int(cx), int(cy)), int(r), 1.0, int(w), lineType=cv2.LINE_AA)
    em += k * m[..., None] * col

def hexagon(cx, cy, r):
    return [(cx + r * np.cos(np.pi / 3 * i + np.pi / 6), cy + r * np.sin(np.pi / 3 * i + np.pi / 6)) for i in range(6)]

def wash(img, cx, cy, rx, ry, col, k):
    # light falling on a wall from a source: a soft ellipse
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    img += k * np.exp(-d)[..., None] * col

def finish(lin, focus_sigma, fg=None, fg_sigma=None):
    # out of focus like a photograph of the product in front, grain, tone, halved
    img = cv2.GaussianBlur(lin, (0, 0), focus_sigma)
    if fg is not None:
        a, col = fg
        a2 = cv2.GaussianBlur(a, (0, 0), fg_sigma)[..., None]
        c2 = cv2.GaussianBlur(col, (0, 0), fg_sigma)
        img = img * (1 - a2) + c2 * a2
    img = img / (1 + img * 0.35)                                  # a soft shoulder, not a clip
    img = np.clip(img, 0, 1) ** (1 / 2.2)
    img = cv2.resize(img, (S // 2, S // 2), interpolation=cv2.INTER_AREA)
    img += rng.normal(0, 0.012, img.shape).astype(np.float32)    # sensor grain
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))

def desk_setup():
    """an aesthetic setup: back wall, an RGB strip, hexagon panels, an ultrawide, a tower with fan rings"""
    img, em = canvas(), canvas()
    vgrad(img, 0, S * 0.66, hexf('#0e0c1c') * 0.9, hexf('#1a1433'))
    vgrad(img, S * 0.66, S, hexf('#0b0a12'), hexf('#050507'))
    strip(em, S * 0.02, S * 0.98, S * 0.2, S * 0.006, hexf('#ff2bd6'), hexf('#22e3ff'), 3.2)
    wash(img, S * 0.3, S * 0.2, S * 0.5, S * 0.16, hexf('#ff2bd6'), 0.14)
    wash(img, S * 0.75, S * 0.2, S * 0.5, S * 0.16, hexf('#22e3ff'), 0.12)
    for (cx, cy, c) in [(0.12, 0.34, '#b04dff'), (0.19, 0.3, '#ff3fa4'), (0.19, 0.38, '#5f5cff'), (0.26, 0.34, '#ff3fa4'), (0.12, 0.42, '#3aa0ff')]:
        pts = hexagon(S * cx, S * cy, S * 0.038)
        poly(img, pts, hexf(c) * 0.2)
        m = np.zeros((S, S), np.float32); cv2.fillPoly(m, [np.array(pts, np.int32)], 1.0, lineType=cv2.LINE_AA)
        em += 1.4 * m[..., None] * hexf(c)
    # the ultrawide: bezel, a game on it, its light on the desk
    rect(img, S * 0.27, S * 0.4, S * 0.8, S * 0.63, hexf('#050507'))
    scr = canvas()
    vgrad(scr, S * 0.41, S * 0.62, hexf('#3a1d8f'), hexf('#0f6fd6'), S * 0.28, S * 0.79)
    wash(scr, S * 0.62, S * 0.5, S * 0.08, S * 0.05, hexf('#ff8a3d'), 1.2)
    wash(scr, S * 0.4, S * 0.56, S * 0.1, S * 0.03, hexf('#22e3ff'), 0.8)
    m = np.zeros((S, S), np.float32); cv2.rectangle(m, (int(S * 0.28), int(S * 0.41)), (int(S * 0.79), int(S * 0.62)), 1.0, -1)
    em += scr * m[..., None] * 1.1
    wash(img, S * 0.53, S * 0.7, S * 0.35, S * 0.05, hexf('#4a6bff'), 0.25)
    # the stand, the desk, its lit edge, the screen in its surface, a keyboard and a mouse
    poly(img, [(S * 0.5, S * 0.63), (S * 0.56, S * 0.63), (S * 0.58, S * 0.665), (S * 0.48, S * 0.665)], hexf('#0c0c12'))
    rect(img, 0, S * 0.66, S, S, hexf('#0a090f'))
    strip(em, S * 0.0, S, S * 0.662, S * 0.003, hexf('#6b3dff'), hexf('#2ad4ff'), 0.9)
    y0, y1 = int(S * 0.67), int(S * 0.83)
    refl = cv2.flip(scr * m[..., None], 0)[int(S * 0.34):int(S * 0.34) + (y1 - y0)]
    em[y0:y1] += 0.12 * cv2.GaussianBlur(refl, (0, 0), S * 0.01)
    rect(img, S * 0.36, S * 0.72, S * 0.66, S * 0.765, hexf('#1c1c28'))
    strip(em, S * 0.36, S * 0.66, S * 0.721, S * 0.002, hexf('#8a8aa8'), hexf('#8a8aa8'), 0.35)
    strip(em, S * 0.365, S * 0.655, S * 0.768, S * 0.004, hexf('#ff2bd6'), hexf('#29ff9e'), 1.6)
    poly(img, [(S * 0.7, S * 0.73), (S * 0.73, S * 0.73), (S * 0.735, S * 0.775), (S * 0.695, S * 0.775)], hexf('#15151f'))
    disc(em, S * 0.715, S * 0.745, S * 0.004, hexf('#29ff9e'), 1.5)
    # the tower: glass side, three fan rings
    rect(img, S * 0.83, S * 0.36, S * 0.98, S * 0.69, hexf('#07070b'))
    for i, c in enumerate(['#ff2bd6', '#9b5cff', '#22e3ff']):
        ring(em, S * 0.905, S * (0.43 + i * 0.09), S * 0.035, S * 0.007, hexf(c), 2.2)
    strip(em, S * 0.835, S * 0.975, S * 0.365, S * 0.004, hexf('#9b5cff'), hexf('#22e3ff'), 1.2)
    # a shelf, figures in silhouette, warm dots
    rect(img, S * 0.02, S * 0.52, S * 0.22, S * 0.535, hexf('#16121f'))
    for x in (0.05, 0.1, 0.16):
        rect(img, S * x, S * 0.47, S * (x + 0.03), S * 0.52, hexf('#0a0910'))
    for x in np.linspace(0.03, 0.21, 7):
        disc(em, S * x, S * 0.545, S * 0.004, hexf('#ffb35c'), 2.5)
    # the chair's back in front, further out of focus, its edge caught by the strip
    fa = np.zeros((S, S), np.float32)
    cv2.ellipse(fa, (int(S * 0.9), int(S * 1.02)), (int(S * 0.2), int(S * 0.3)), 0, 180, 360, 1.0, -1, lineType=cv2.LINE_AA)
    fc = np.zeros((S, S, 3), np.float32); fc[:] = hexf('#08080c')
    rim = np.zeros((S, S), np.float32)
    cv2.ellipse(rim, (int(S * 0.9), int(S * 1.02)), (int(S * 0.2), int(S * 0.3)), 0, 190, 300, 1.0, int(S * 0.006), lineType=cv2.LINE_AA)
    fc += rim[..., None] * hexf('#ff2bd6') * 0.2
    return finish(bloom(em) + img, S * 0.0045, fg=(fa, fc), fg_sigma=S * 0.014)

def bedroom():
    """a gamer's bedroom: a ceiling strip, the bed, a night window through blinds, a desk and its screen"""
    img, em = canvas(), canvas()
    vgrad(img, 0, S * 0.72, hexf('#140c26'), hexf('#241240'))
    vgrad(img, S * 0.72, S, hexf('#0d0816'), hexf('#060409'))
    strip(em, 0, S, S * 0.035, S * 0.008, hexf('#b44dff'), hexf('#ff3f9e'), 2.6)
    wash(img, S * 0.5, S * 0.02, S * 0.9, S * 0.3, hexf('#9b3dff'), 0.2)
    # the window and its blinds, the city beyond
    rect(img, S * 0.6, S * 0.12, S * 0.94, S * 0.46, hexf('#0a1230'))
    for i in range(9):
        y = S * (0.14 + i * 0.036)
        add_rect(em, S * 0.61, y, S * 0.93, y + S * 0.012, hexf('#3d6dff'), 0.55)
    for x, y, c in [(0.66, 0.4, '#ffcf6b'), (0.72, 0.36, '#ffcf6b'), (0.8, 0.42, '#ff8a5c'), (0.87, 0.38, '#ffe28a'), (0.9, 0.43, '#6bd6ff')]:
        disc(em, S * x, S * y, S * 0.005, hexf(c), 2.0)
    # posters
    rect(img, S * 0.08, S * 0.14, S * 0.24, S * 0.38, hexf('#2a1646'))
    rect(img, S * 0.28, S * 0.17, S * 0.4, S * 0.34, hexf('#1a2a52'))
    # the bed, lit by the strip under its frame
    poly(img, [(0, S * 0.62), (S * 0.5, S * 0.64), (S * 0.56, S * 0.8), (0, S * 0.8)], hexf('#2c1a4d'))
    rect(img, 0, S * 0.8, S * 0.58, S, hexf('#120a1e'))
    rect(img, 0, S * 0.5, S * 0.06, S * 0.8, hexf('#0e0818'))
    strip(em, 0, S * 0.56, S * 0.805, S * 0.005, hexf('#ff3f9e'), hexf('#8a4dff'), 2.0)
    wash(img, S * 0.25, S * 0.86, S * 0.4, S * 0.08, hexf('#ff3f9e'), 0.18)
    # the desk and its screen
    rect(img, S * 0.62, S * 0.66, S, S * 0.69, hexf('#0f0a18'))
    rect(img, S * 0.68, S * 0.5, S * 0.93, S * 0.65, hexf('#050407'))
    scr = canvas(); vgrad(scr, S * 0.51, S * 0.64, hexf('#5a2bd6'), hexf('#1a8fff'), S * 0.69, S * 0.92)
    m = np.zeros((S, S), np.float32); cv2.rectangle(m, (int(S * 0.69), int(S * 0.51)), (int(S * 0.92), int(S * 0.64)), 1.0, -1)
    em += scr * m[..., None]
    wash(img, S * 0.8, S * 0.7, S * 0.2, S * 0.05, hexf('#5a6bff'), 0.3)
    # fairy lights along the wall
    for x in np.linspace(0.05, 0.55, 12):
        disc(em, S * x, S * (0.46 + 0.02 * np.sin(x * 20)), S * 0.005, hexf('#ffc27a'), 2.2)
    return finish(bloom(em) + img, S * 0.005)

def living_room():
    """a gamer's living room: a TV with its bias light, the console under it, a lamp, the couch in front"""
    img, em = canvas(), canvas()
    vgrad(img, 0, S * 0.7, hexf('#0b1220'), hexf('#121c30'))
    vgrad(img, S * 0.7, S, hexf('#0a0d14'), hexf('#050608'))
    # the TV, its picture and the light behind it
    wash(img, S * 0.56, S * 0.4, S * 0.34, S * 0.22, hexf('#5b3dff'), 0.55)
    wash(img, S * 0.56, S * 0.4, S * 0.2, S * 0.13, hexf('#2ad4ff'), 0.4)
    rect(img, S * 0.3, S * 0.25, S * 0.82, S * 0.55, hexf('#030305'))
    scr = canvas()
    vgrad(scr, S * 0.26, S * 0.54, hexf('#2f7dff'), hexf('#12346e'), S * 0.31, S * 0.81)
    wash(scr, S * 0.47, S * 0.45, S * 0.12, S * 0.07, hexf('#ff9a3d'), 1.1)
    wash(scr, S * 0.68, S * 0.33, S * 0.08, S * 0.05, hexf('#ffe07a'), 0.9)
    m = np.zeros((S, S), np.float32); cv2.rectangle(m, (int(S * 0.31), int(S * 0.26)), (int(S * 0.81), int(S * 0.54)), 1.0, -1)
    em += scr * m[..., None] * 1.05
    # the console on its unit, a strip under it
    rect(img, S * 0.22, S * 0.6, S * 0.9, S * 0.68, hexf('#0d1119'))
    rect(img, S * 0.5, S * 0.555, S * 0.62, S * 0.6, hexf('#dfe3ea') * 0.35)
    add_rect(em, S * 0.505, S * 0.595, S * 0.615, S * 0.599, hexf('#3d8bff'), 1.8)
    strip(em, S * 0.22, S * 0.9, S * 0.683, S * 0.005, hexf('#22e3ff'), hexf('#8a4dff'), 1.6)
    wash(img, S * 0.56, S * 0.72, S * 0.4, S * 0.06, hexf('#22b8ff'), 0.22)
    # the lamp, warm, at the left
    wash(img, S * 0.08, S * 0.3, S * 0.18, S * 0.3, hexf('#ff9a4d'), 0.45)
    disc(em, S * 0.08, S * 0.24, S * 0.03, hexf('#ffc27a'), 1.6)
    rect(img, S * 0.075, S * 0.27, S * 0.085, S * 0.7, hexf('#0a0a0d'))
    # a plant at the right edge
    for i in range(7):
        a = -0.9 + i * 0.3
        poly(img, [(S * 0.95, S * 0.62), (S * (0.95 + 0.12 * np.sin(a)), S * (0.42 - 0.05 * np.cos(a))), (S * (0.96 + 0.1 * np.sin(a)), S * (0.44 - 0.04 * np.cos(a)))], hexf('#06080a'))
    # the couch in front, out of focus, its top lit by the screen
    fa = np.zeros((S, S), np.float32)
    cv2.fillPoly(fa, [np.array([(0, S * 0.8), (S * 0.12, S * 0.76), (S * 0.88, S * 0.76), (S, S * 0.8), (S, S), (0, S)], np.int32)], 1.0, lineType=cv2.LINE_AA)
    fc = np.zeros((S, S, 3), np.float32); fc[:] = hexf('#07080c')
    fc[int(S * 0.76):int(S * 0.79)] += hexf('#3a5bff') * 0.25
    return finish(bloom(em) + img, S * 0.0045, fg=(fa, fc), fg_sigma=S * 0.012)

ROOMS = [
    ('gaming-rgb-desk-setup', desk_setup, 'an aesthetic gaming setup: an RGB strip, hexagon panels, an ultrawide and a tower with fan rings'),
    ('gaming-bedroom-night', bedroom, 'a gamer\'s bedroom at night: a ceiling strip, the bed, blinds and a desk with its screen'),
    ('gaming-living-room-tv', living_room, 'a gamer\'s living room: a TV with its bias light, the console under it, a lamp and the couch'),
]

def main():
    gj = os.path.join(OUT, 'grounds.json')
    grounds = json.load(open(gj))
    att_p = os.path.join(OUT, 'ATTRIBUTION.json')
    att = [a for a in json.load(open(att_p)) if not a['file'].startswith('gaming-')]
    grounds['gaming'] = []
    for name, fn, what in ROOMS:
        im = fn()
        im.save(os.path.join(OUT, name + '.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
        a = np.asarray(im.crop((0, 0, 1080, 720)).convert('L'), dtype=np.float32)
        p90 = int(np.percentile(a, 90))
        grounds['gaming'].append({'file': name, 'p90': p90})
        att.append({'file': name + '.jpg', 'placeholder': True, 'note': 'drawn by scripts/make_gaming_grounds.py (' + what + '); '
                    'a placeholder until a photograph of the same room (docs/scrape-intake.md)'})
        print(f'{name:26s} p90 {p90}')
    json.dump(grounds, open(gj, 'w'), ensure_ascii=False, indent=1)
    json.dump(att, open(att_p, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
