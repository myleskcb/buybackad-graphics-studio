"""Put the phone number on the 50 offer ads big enough to read in a feed.

For each social ad: repaint the action band row by row from its own colour,
then set the owner's own action ("Text (562) 999-4994" or "Call or text ...")
with the number enlarged, in the ad's own reading face, weight and colours, and
the brand line (iPhones.LA/sell) right-aligned on the same baseline.

The number's size is the smallest of:
  - 0.77 x the headline's font size (the brief: the largest type is at least
    1.3x the next size, so the headline still leads);
  - what the band holds inside the 60px safe margin (a studio bar may grow up
    toward the steps, never closer than 24px to them, at most 30px);
  - what the width holds, with 48px between the number and the brand.
"""
import json, sys, os
from common import *

A = {a['n']: a for a in json.load(open(WORK + '/analysis.json'))}
SPACE = json.load(open(WORK + '/space.json'))
HL = {h['n']: h for h in json.load(open(WORK + '/headlines.json'))}
TW = json.load(open(WORK + '/text_weights.json'))

X_L, X_R, Y_B = 91, 1109, 1140          # the ads' own text margins; the brief's 60px safe margin
SUPPORT, SMALL = 40, 30                  # the brief's type scale
GAP_BRAND = 48

def ink_box(f, text):
    """ink bbox relative to a left-baseline origin"""
    return f.getbbox(text, anchor='ls')

def split_action(act):
    i = act.index('(')
    return act[:i].strip(), act[i:].strip()

def plan(ad):
    a, sp, hl = A[ad['n']], SPACE[str(ad['n'])], HL[ad['n']]
    fam = ad['text']
    w_num = int(TW[fam][1])
    w_brand = int(a['brand_match'][1]) if a.get('brand_match') else w_num
    verb, number = split_action(ad['act_social'])
    brand = ad['brand_social']
    studio = ad['layout'] != 'Photo band'
    fv = font(fam, SUPPORT, w_num); fb = font(fam, SMALL, w_brand)
    vb, bb = ink_box(fv, verb), ink_box(fb, brand)
    verb_w, brand_w = vb[2] - vb[0], bb[2] - bb[0]
    word_gap = round(0.3 * SUPPORT)
    n_hier = int(0.77 * hl['size'])
    best = None
    for layout in ('inline', 'stacked'):
        for N in range(n_hier, 39, -1):
            fn = font(fam, N, w_num); nb = ink_box(fn, number)
            num_w, num_h = nb[2] - nb[0], nb[3] - nb[1]
            if layout == 'inline':
                right = X_L + verb_w + word_gap + num_w
                if right + GAP_BRAND > X_R - brand_w: continue
                col_h = 0
            else:
                right = X_L + num_w
                if right + GAP_BRAND > X_R - max(verb_w, brand_w): continue
                col_h = (vb[3] - vb[1]) + 14 + (bb[3] - bb[1])       # verb over brand, right column
            block_h = max(num_h, col_h)
            if studio:
                need_top = Y_B - block_h - 22                          # where the bar must start
                allow_top = max(sp['content_bottom'] + 24, sp['band_top'] - 30)
                if need_top < allow_top: continue
                bar_top = min(sp['band_top'], need_top)
                zone = (bar_top + 22, Y_B)
            else:
                zone_top = sp['content_bottom'] + 30
                if Y_B - zone_top < block_h: continue
                bar_top = None; zone = (zone_top, Y_B)
            cand = dict(layout=layout, N=N, bar_top=bar_top, zone=zone, block_h=block_h, num_box=nb)
            # the owner's sentence ("Text (562) ...") stays whole unless keeping it
            # would cost the number more than a tenth of its size
            if not best or (layout == 'stacked' and N > best['N'] / 0.9): best = cand
            break
    best.update(fam=fam, w_num=w_num, w_brand=w_brand, verb=verb, number=number, brand=brand, n_hier=n_hier, studio=studio)
    return best

def repaint(img, y0, y1, ref_rows, skip):
    """fill rows y0..y1 with the band's own colour, row by row: each clean row's
       median (rows through the old footer text, `skip`, are interpolated from
       the clean rows around them); rows above the band take its first clean row"""
    S = np.asarray(img).astype(np.float64)
    out = S.copy()
    ys = [y for y in range(ref_rows[0], ref_rows[1]) if not (skip[0] - 6 <= y < skip[1] + 6)]
    med = {y: np.median(S[y], axis=0) for y in ys}
    ys = np.array(ys)
    for y in range(y0, y1):
        if y in med: c = med[y]
        else:
            lo = ys[ys < y]; hi = ys[ys > y]
            if len(lo) and len(hi):
                a, b = lo[-1], hi[0]; t = (y - a) / (b - a); c = med[a] * (1 - t) + med[b] * t
            else:
                c = med[(lo[-1] if len(lo) else hi[0])]
        out[y, :, :] = c
    return Image.fromarray(out.round().clip(0, 255).astype(np.uint8))

def compose(ad, p):
    a, sp = A[ad['n']], SPACE[str(ad['n'])]
    m, s = files_for(ad['n'])
    img = Image.open(s).convert('RGB')
    if p['studio']:
        # the bar, repainted from its own rows, grown up to its new top
        img = repaint(img, p['bar_top'], 1200, (sp['band_top'] + 2, 1200), a['zone'])
    else:
        img = repaint(img, sp['content_bottom'] + 10, 1200, (sp['content_bottom'] + 10, 1200), a['zone'])
    d = ImageDraw.Draw(img)
    ink = tuple(a['action_ink']); binks = tuple(a['brand_ink'])
    fn = font(p['fam'], p['N'], p['w_num']); fv = font(p['fam'], SUPPORT, p['w_num']); fb = font(p['fam'], SMALL, p['w_brand'])
    nb = ink_box(fn, p['number']); vb = ink_box(fv, p['verb']); bb = ink_box(fb, p['brand'])
    z0, z1 = p['zone']
    # the block is centred in its zone: the number's ink box sets the baseline
    num_h = nb[3] - nb[1]
    base = int(round((z0 + z1) / 2 - (nb[1] + nb[3]) / 2))
    base = min(base, Y_B - nb[3])
    if p['layout'] == 'inline':
        xv = X_L - vb[0]
        d.text((xv, base), p['verb'], font=fv, fill=ink, anchor='ls')
        xn = X_L + (vb[2] - vb[0]) + round(0.3 * SUPPORT) - nb[0]
        d.text((xn, base), p['number'], font=fn, fill=ink, anchor='ls')
        d.text((X_R - bb[2], base), p['brand'], font=fb, fill=binks, anchor='ls')
        boxes = dict(verb=(X_L, base + vb[1], X_L + vb[2] - vb[0], base + vb[3]),
                     number=(xn + nb[0], base + nb[1], xn + nb[2], base + nb[3]),
                     brand=(X_R - (bb[2] - bb[0]), base + bb[1], X_R, base + bb[3]))
    else:
        xn = X_L - nb[0]
        d.text((xn, base), p['number'], font=fn, fill=ink, anchor='ls')
        d.text((X_R - bb[2], base), p['brand'], font=fb, fill=binks, anchor='ls')
        vbase = base + bb[1] - 14 - vb[3]                              # the verb sits over the brand
        d.text((X_R - vb[2], vbase), p['verb'], font=fv, fill=ink, anchor='ls')
        boxes = dict(number=(X_L, base + nb[1], X_L + nb[2] - nb[0], base + nb[3]),
                     brand=(X_R - (bb[2] - bb[0]), base + bb[1], X_R, base + bb[3]),
                     verb=(X_R - (vb[2] - vb[0]), vbase + vb[1], X_R, vbase + vb[3]))
    return img, boxes, base

def lum(c):
    c = np.array(c) / 255.0
    c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def contrast(a, b):
    la, lb = lum(a), lum(b); return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

if __name__ == '__main__':
    only = set(int(x) for x in sys.argv[1].split(',')) if len(sys.argv) > 1 and sys.argv[1] else None
    os.makedirs(OUT + '/social', exist_ok=True)
    report = []
    for ad in parse_spec():
        if only and ad['n'] not in only: continue
        p = plan(ad)
        img, boxes, base = compose(ad, p)
        m, s = files_for(ad['n'])
        name = os.path.basename(s)
        img.save(OUT + '/social/' + name, quality=95, subsampling=0)
        a = A[ad['n']]
        bgc = a['bg']
        row = dict(n=ad['n'], file='social/' + name, layout=ad['layout'], face=p['fam'], weight=p['w_num'], number_px=p['N'],
                   headline_px=round(HL[ad['n']]['size'], 1), ratio=round(HL[ad['n']]['size'] / p['N'], 2), arrangement=p['layout'],
                   bar_top=p['bar_top'], boxes={k: [int(round(v)) for v in b] for k, b in boxes.items()},
                   contrast_number=round(contrast(a['action_ink'], bgc), 2), contrast_brand=round(contrast(a['brand_ink'], bgc), 2),
                   was_px=40)
        report.append(row)
        print(f"{ad['n']:02d} {ad['layout']:11s} {p['fam']:15s} {p['w_num']} N={p['N']:3d} (headline {HL[ad['n']]['size']:.0f}, x{row['ratio']}) {p['layout']:7s} bar_top={p['bar_top']} contrast {row['contrast_number']}")
    if not only:
        json.dump(report, open(OUT + '/number-report.json', 'w'), indent=1)
