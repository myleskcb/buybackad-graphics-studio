import json, sys
from common import *
from analyze import render_mask, bbox, text_mask
def shifted_iou(crop, cand):
    best = 0
    for dy in range(-2, 3):
        for dx in range(-3, 4):
            h = max(crop.shape[0], cand.shape[0]) + 6; w = max(crop.shape[1], cand.shape[1]) + 8
            A = np.zeros((h, w), bool); B = np.zeros((h, w), bool)
            A[3:3 + crop.shape[0], 4:4 + crop.shape[1]] = crop
            B[3 + dy:3 + dy + cand.shape[0], 4 + dx:4 + dx + cand.shape[1]] = cand
            best = max(best, (A & B).sum() / max(1, (A | B).sum()))
    return best
ads = parse_spec()
seen = {}
for ad in ads:
    if ad['text'] in seen: continue
    seen[ad['text']] = ad['n']
res = {}
for fam, n in seen.items():
    ad = [a for a in ads if a['n'] == n][0]
    m, s = files_for(n); S = load(s); M = load(m)
    diff = np.abs(M - S).sum(2) > 40; ys, xs = np.where(diff); zy0, zy1 = ys.min(), ys.max() + 1
    bg = np.median(S[zy1 + 6:1196].reshape(-1, 3), axis=0).astype(int)
    tm = text_mask(S, bg, zy0 - 4, zy1 + 4, thr=110)
    cols = np.where(tm.any(0))[0]; gaps = np.diff(cols); k = int(np.argmax(gaps))
    left = tm[:, :cols[k] + 1]; b = bbox(left); crop = left[b[1]:b[3], b[0]:b[2]]
    best = None
    for w in weights_of(fam):
        for s10 in range(370, 440, 5):
            cand = render_mask(ad['act_social'], fam, s10 / 10, w)
            if cand is None or abs(cand.shape[1] - crop.shape[1]) > 14: continue
            sc = shifted_iou(crop, cand)
            if not best or sc > best[0]: best = (round(sc, 3), w, s10 / 10)
    res[fam] = best
    print(fam, 'ad', n, ad['act_social'], '->', best)
json.dump(res, open(WORK + '/text_weights.json', 'w'))
