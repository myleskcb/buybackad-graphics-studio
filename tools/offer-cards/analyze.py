import sys, json
from common import *

def text_mask(img, bg, y0, y1, thr=60):
    reg = img[y0:y1]
    d = np.abs(reg - np.array(bg)[None, None, :]).sum(2)
    return d > thr

def bbox(mask):
    ys, xs = np.where(mask)
    if not len(ys): return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

def render_mask(text, family, size, weight):
    f = font(family, size, weight)
    im = Image.new('L', (int(size * len(text) * 0.9) + 40, int(size * 2)), 0)
    d = ImageDraw.Draw(im)
    d.text((10, int(size * 0.4)), text, font=f, fill=255)
    a = np.asarray(im) > 110
    b = bbox(a)
    return a[b[1]:b[3], b[0]:b[2]] if b else None

def iou_at(crop, cand):
    # align top-left, compare on the union canvas
    h = max(crop.shape[0], cand.shape[0]); w = max(crop.shape[1], cand.shape[1])
    A = np.zeros((h, w), bool); B = np.zeros((h, w), bool)
    A[:crop.shape[0], :crop.shape[1]] = crop; B[:cand.shape[0], :cand.shape[1]] = cand
    return (A & B).sum() / max(1, (A | B).sum())

def analyze(ad):
    mp, sp = files_for(ad['n'])
    M, S = load(mp), load(sp)
    diff = np.abs(M - S).sum(2) > 40
    ys, xs = np.where(diff)
    zy0, zy1 = int(ys.min()), int(ys.max()) + 1
    # the band colour: rows just under the footer text, which both versions leave empty
    below = S[min(1199, zy1 + 6):1196]
    bg = np.median(below.reshape(-1, 3), axis=0).astype(int)
    flat = float(np.abs(below - bg[None, None, :]).sum(2).mean())
    # the band's top: walk up from the text until a row stops matching the band colour
    y = zy0 - 3
    rowdev = lambda r: float(np.median(np.abs(S[r] - bg[None, :]).sum(1)))
    while y > 600 and rowdev(y) < 18: y -= 1
    band_top = y + 1
    # the lowest ink above the footer text inside the band (steps, list) = content bottom
    m = np.abs(S[band_top:zy0 - 2] - bg[None, None, :]).sum(2) > 60
    rows = np.where(m.sum(1) > 2)[0]
    content_bottom = band_top + int(rows.max()) + 1 if len(rows) else band_top
    # social text mask in the zone
    tm = text_mask(S, bg, zy0 - 4, zy1 + 4)
    cols = np.where(tm.any(0))[0]
    # split left (action) and right (brand) at the largest gap
    gaps = np.diff(cols); k = int(np.argmax(gaps))
    left = tm[:, :cols[k] + 1]; right = tm[:, cols[k + 1]:]
    lb = bbox(left); rb = bbox(right)
    lx0, ly0, lx1, ly1 = lb[0], lb[1] + zy0 - 4, lb[2], lb[3] + zy0 - 4
    rx0, ry0, rx1, ry1 = rb[0] + cols[k + 1], rb[1] + zy0 - 4, rb[2] + cols[k + 1], rb[3] + zy0 - 4
    ink_left = S[ly0:ly1, lx0:lx1][left[lb[1]:lb[3], lb[0]:lb[2]]]
    ink_right = S[ry0:ry1, rx0:rx1][right[rb[1]:rb[3], rb[0]:rb[2]]]
    # the ink colour: the pixels furthest from the band (the cores of the strokes)
    def core(px):
        d = np.abs(px - bg[None, :]).sum(1); return np.median(px[d >= np.percentile(d, 70)], axis=0).astype(int).tolist()
    # match the action line's face: weight and size
    crop = left[lb[1]:lb[3], lb[0]:lb[2]]
    best = None
    for w in weights_of(ad['text']):
        for s10 in range(300, 520, 5):
            s = s10 / 10
            cand = render_mask(ad['act_social'], ad['text'], s, w)
            if cand is None or abs(cand.shape[1] - crop.shape[1]) > 12 or abs(cand.shape[0] - crop.shape[0]) > 6: continue
            sc = iou_at(crop, cand)
            if not best or sc > best[0]: best = (sc, w, s)
    # the brand line's size, same face
    bcrop = right[rb[1]:rb[3], rb[0]:rb[2]]; bbest = None
    for w in weights_of(ad['text']):
        for s10 in range(200, 420, 5):
            s = s10 / 10
            cand = render_mask(ad['brand_social'], ad['text'], s, w)
            if cand is None or abs(cand.shape[1] - bcrop.shape[1]) > 10 or abs(cand.shape[0] - bcrop.shape[0]) > 6: continue
            sc = iou_at(bcrop, cand)
            if not bbest or sc > bbest[0]: bbest = (sc, w, s)
    return dict(n=ad['n'], zone=[zy0, zy1], bg=bg.tolist(), flat=round(flat, 1), band_top=band_top, content_bottom=content_bottom,
                action_box=[lx0, ly0, lx1, ly1], brand_box=[rx0, ry0, rx1, ry1], action_ink=core(ink_left), brand_ink=core(ink_right),
                action_match=best, brand_match=bbest)

if __name__ == '__main__':
    ads = parse_spec()
    only = set(int(x) for x in sys.argv[1].split(',')) if len(sys.argv) > 1 else None
    out = []
    for ad in ads:
        if only and ad['n'] not in only: continue
        r = analyze(ad); out.append(r)
        print(json.dumps(r, default=lambda o: o.item() if hasattr(o, "item") else str(o)))
    if not only:
        json.dump(out, open(WORK + '/analysis.json', "w"), indent=0, default=lambda o: o.item() if hasattr(o, "item") else str(o))
        # the room: a studio bar may grow up toward the steps; a photo band holds the
        # action under the steps. Crisp edges are text; device reflections are soft.
        from headline import edges
        A = {a['n']: a for a in out}; space = {}
        for ad in ads:
            a = A[ad['n']]; m, s = files_for(ad['n']); S = load(s).astype(np.float32)
            if ad['layout'] == 'Photo band':
                above = a['content_bottom']
            else:
                crisp = (edges(S[700:a['band_top']]) > 70)[:, 60:1140]
                rows = np.where(crisp.sum(1) > 4)[0]
                above = 700 + int(rows.max()) + 1 if len(rows) else 700
            space[ad['n']] = dict(layout=ad['layout'], band_top=a['band_top'], content_bottom=above, zone=a['zone'])
        json.dump(space, open(WORK + '/space.json', 'w'))
