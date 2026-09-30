import sys, json
from common import *

def edges(img):
    g = img.mean(2)
    gx = np.zeros_like(g); gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1, :] = g[2:, :] - g[:-2, :]
    return np.hypot(gx, gy)

def bands(profile, thr, gap=4, minh=6):
    on = profile > thr; out = []; y = 0; n = len(on)
    while y < n:
        if on[y]:
            y0 = y
            while y < n and (on[y] or (y + gap < n and on[y:y + gap].any())): y += 1
            if y - y0 >= minh: out.append([y0, y])
        y += 1
    return out

def display_weight(fam):
    # the display faces the brief names are set heavy unless they are serifs drawn light
    return {'Cormorant Garamond': 500, 'Instrument Serif': 400, 'DM Serif Display': 400, 'Sora': 700, 'Oswald': 600,
            'Saira Condensed': 700, 'Roboto Slab': 700, 'Khand': 600, 'Teko': 600, 'Space Grotesk': 700, 'Anton': 400,
            'Syne': 800, 'Libre Franklin': 800, 'Barlow Condensed': 700, 'Bungee': 400, 'Big Shoulders Display': 800,
            'Shrikhand': 400, 'Nunito': 800, 'Archivo Black': 400}.get(fam, 700)

def measure(ad):
    m, s = files_for(ad['n'])
    S = load(s)
    top = 696 if ad['layout'] == 'Photo band' else 600
    E = edges(S[:top, :]).astype(np.float32)
    x0, x1 = 60, 1140
    strong = E[:, x0:x1] > 60
    prof = strong.sum(1)
    bs = bands(prof, 6)
    # the models line: the first band, short; the headline: the next band(s) that are taller
    info = []
    for b in bs:
        rows = strong[b[0]:b[1]]
        cols = np.where(rows.any(0))[0]
        info.append(dict(y0=b[0], y1=b[1], h=b[1] - b[0], xl=int(cols.min()) + x0, xr=int(cols.max()) + x0 + 1))
    return info

def width_at(text, fam, size=100, weight=None):
    f = font(fam, size, weight if weight else display_weight(fam))
    b = f.getbbox(text)
    return b[2] - b[0], b[3] - b[1]

def splits(words, L):
    if L == 1: yield [' '.join(words)]; return
    for i in range(1, len(words) - L + 2):
        for rest in splits(words[i:], L - 1): yield [' '.join(words[:i])] + rest

def solve(ad, lines):
    """lines: measured [(xl, xr, y0, y1)] of the headline; returns size and the break"""
    words = ad['headline'].split()
    best = None
    for L in (len(lines),):
        for sp in splits(words, L):
            ws = [width_at(t, ad['display'])[0] for t in sp]
            sizes = [100 * (ln[1] - ln[0]) / w for ln, w in zip(lines, ws)]
            spread = (max(sizes) - min(sizes)) / np.mean(sizes)
            if not best or spread < best[0]: best = (spread, float(np.median(sizes)), sp)
    return best

def headline_lines(ad):
    info = measure(ad)
    # studio: skip the models line (the first band, short), then take bands of similar height
    if not info: return []
    bands_ = info[1:] if info[0]['h'] < 40 else info
    out = []
    for b in bands_:
        if b['h'] > 160: break              # the devices / steps block
        if out and abs(b['h'] - out[0]['h']) > 0.45 * out[0]['h'] and b['y0'] - out[-1]['y1'] > 40: break
        out.append(b)
    return [(b['xl'], b['xr'], b['y0'], b['y1']) for b in out]

from fontTools.ttLib import TTFont
_CAP = {}
def cap_ratio(fam):
    """cap height / em from the font's own OS/2 table (falls back to measuring 'H')"""
    if fam in _CAP: return _CAP[fam]
    f = [x for x in FONTS[fam]]
    path = GF + '/' + ([x for x in f if 'wght' in x] or [x for x in f if 'Regular' in x] or f)[0]
    t = TTFont(path)
    upm = t['head'].unitsPerEm
    ch = getattr(t['OS/2'], 'sCapHeight', 0) or 0
    if not ch:
        fo = font(fam, 1000, 400); b = fo.getbbox('H'); r = (b[3] - b[1]) / 1000
    else:
        r = ch / upm
    _CAP[fam] = r
    return r

def band_lines(ad):
    """the headline's lines on a photograph: extreme-luminance ink with strong edges, left column"""
    m, s = files_for(ad['n'])
    S = load(s)[:696].astype(np.float32)
    L = (0.2126 * S[..., 0] + 0.7152 * S[..., 1] + 0.0722 * S[..., 2]) / 255
    E = edges(S)
    x0, x1 = 60, 600
    res = []
    for pol in ('light', 'dark'):
        ink = (L > 0.86) if pol == 'light' else (L < 0.10)
        mask = ink & (np.maximum.reduce([np.roll(E, k, 1) for k in (-2, -1, 0, 1, 2)]) > 50)
        prof = mask[:, x0:x1].sum(1)
        bs = bands(prof, 10, gap=3, minh=14)
        res.append((pol, bs, int(prof.sum())))
    pol, bs, _ = max(res, key=lambda r: (len(r[1]) >= 2, r[2]))
    return pol, bs

def pitch_size(bs):
    tops = [b[0] for b in bs]
    if len(tops) < 2: return None
    pitches = [b - a for a, b in zip(tops, tops[1:])]
    return float(np.median(pitches))

def headline_cap(ad):
    """(cap height px, font size px, method)"""
    fam = ad['display']; cr = cap_ratio(fam)
    if ad['layout'] != 'Photo band':
        ls = headline_lines(ad)
        r = solve(ad, ls) if ls else None
        if r and r[0] < 0.08:
            return r[1] * cr, r[1], 'width fit, ' + str(len(ls)) + ' line(s)'
        # fall back: the line pitch of the headline bands
        info = measure(ad)
        hb = [ (b['y0'], b['y1']) for b in info[1:] if b['h'] < 160 ]
        p = pitch_size(hb)
        if p: return p / 1.05 * cr, p / 1.05, 'line pitch'
        return None
    pol, bs = band_lines(ad)
    p = pitch_size(bs)
    if not p: return None
    return p / 1.05 * cr, p / 1.05, 'line pitch (' + pol + ' ink, ' + str(len(bs)) + ' bands)'


def fit_given(ad, lines, use=None):
    """the headline's size from line breaks given by hand: each line's measured
       width against the same text set in the display face"""
    m, s_ = files_for(ad['n']); S = load(s_)
    if ad['layout'] == 'Photo band':
        Lm = (0.2126 * S[..., 0] + 0.7152 * S[..., 1] + 0.0722 * S[..., 2]) / 255
        ink = Lm > 0.86; x1 = 600
    else:
        bg = S[250, 30]; ink = np.abs(S - bg[None, None, :]).sum(2) > 90; x1 = 1140
    ink[:, :60] = False; ink[:, x1:] = False
    bs = [b for b in bands(ink[:700].sum(1), 8, gap=3, minh=16) if b[1] - b[0] >= 30][:len(lines)]
    sizes = []
    for b, t in zip(bs, lines):
        cols = np.where(ink[b[0]:b[1]].any(0))[0]
        sizes.append(100 * (cols.max() - cols.min() + 1) / width_at(t, ad['display'])[0])
    size = float(sizes[use]) if use is not None else float(np.median(sizes))
    return size * cap_ratio(ad['display']), size

if __name__ == '__main__':
    import json, os
    over = {}
    if os.path.exists(WORK + '/headline-lines.json'):
        over = {int(k): v for k, v in json.load(open(WORK + '/headline-lines.json')).items()}
    out = []
    for ad in parse_spec():
        if ad['n'] in over:
            o = over[ad['n']]
            cap, size = fit_given(ad, o['lines'], o.get('use'))
            how = 'width fit, lines given' + (' (line %d)' % (o['use'] + 1) if o.get('use') is not None else '')
        else:
            r = headline_cap(ad)
            cap, size, how = r if r else (None, None, 'not measured')
        out.append(dict(n=ad['n'], cap=cap, size=size, how=how))
        print('%02d %-11s %-22s size %6.1f  %s' % (ad['n'], ad['layout'], ad['display'], size or 0, how))
    json.dump(out, open(WORK + '/headlines.json', 'w'), indent=0)
