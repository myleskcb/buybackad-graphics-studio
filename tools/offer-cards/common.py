import re, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get('OFFER_SRC', HERE + '/export')            # the unzipped export: marketplace/, social/
SPEC = os.environ.get('OFFER_SPEC', SRC + '/PROMPTS.md')       # the per-ad spec (typefaces, words)
GF = os.environ.get('OFFER_FONTS', HERE + '/.fonts')           # fetch_fonts.py fills it
WORK = os.environ.get('OFFER_WORK', HERE + '/measurements')    # the measurements of the batch
OUT = os.environ.get('OFFER_OUT', HERE + '/out')               # the finished cards
FONTS = json.load(open(GF + '/index.json')) if os.path.exists(GF + '/index.json') else {}

def parse_spec():
    txt = open(SPEC).read()
    ads = []
    for block in re.split(r'\n### ', txt)[1:]:
        head = block.split('\n', 1)[0]
        m = re.match(r'(\d+) · (.+?) · (.+)$', head.strip())
        if not m: continue
        n, fam, layout = m.groups()
        t = re.search(r'Type: (.+?) headline, (.+?) text\.', block)
        g = re.search(r'Ground: (.+?)\. Type', block)
        hl = re.search(r'\*\*Headline:\*\* (.+)', block)
        am = re.search(r'\*\*Action \(marketplace\):\*\* (.+?) · (.+)', block)
        asoc = re.search(r'\*\*Action \(social\):\*\* (.+?) · (.+)', block)
        ads.append(dict(n=int(n), family=fam, layout=layout.strip(), ground=g.group(1) if g else None,
                        display=t.group(1), text=t.group(2), headline=hl.group(1).strip(),
                        act_market=am.group(1).strip(), brand_market=am.group(2).strip(),
                        act_social=asoc.group(1).strip(), brand_social=asoc.group(2).strip()))
    return ads

def files_for(n):
    import glob
    s = glob.glob(f'{SRC}/social/{n:02d}-*-social.jpg')[0]
    m = glob.glob(f'{SRC}/marketplace/{n:02d}-*.jpg'); m = [x for x in m if not x.endswith('-social.jpg')][0]
    return m, s

def font(family, size, weight=None):
    """a PIL font for family at size; weight picks the static file or sets the variable axis"""
    files = FONTS[family]
    var = [f for f in files if '_' in f and 'wght' in f]
    if var:
        f = ImageFont.truetype(GF + '/' + var[0], size)
        if weight is not None:
            try:
                axes = f.get_variation_axes()
                vals = []
                for a in axes:
                    nm = a.get('name', b'')
                    nm = nm.decode() if isinstance(nm, bytes) else str(nm)
                    if nm.lower().startswith('weight') or nm.lower() == 'wght':
                        vals.append(max(a['minimum'], min(a['maximum'], weight)))
                    elif nm.lower().startswith('optical') or nm.lower() == 'opsz':
                        vals.append(max(a['minimum'], min(a['maximum'], size * 0.75)))  # px -> pt-ish
                    else:
                        vals.append(a['default'])
                f.set_variation_by_axes(vals)
            except Exception as e:
                pass
        return f
    names = {100:'Thin',200:'ExtraLight',300:'Light',400:'Regular',500:'Medium',600:'SemiBold',700:'Bold',800:'ExtraBold',900:'Black'}
    want = names.get(weight or 400, 'Regular')
    pick = [f for f in files if f.endswith('-' + want + '.ttf')]
    if not pick:
        # nearest heavier-or-equal available
        order = [100,200,300,400,500,600,700,800,900]
        avail = [w for w in order if any(f.endswith('-' + names[w] + '.ttf') for f in files)]
        w = min(avail, key=lambda v: (abs(v - (weight or 400)), -v))
        pick = [f for f in files if f.endswith('-' + names[w] + '.ttf')]
    return ImageFont.truetype(GF + '/' + pick[0], size)

def weights_of(family):
    files = FONTS[family]
    if any('_' in f and 'wght' in f for f in files):
        f = ImageFont.truetype(GF + '/' + [x for x in files if 'wght' in x][0], 40)
        for a in f.get_variation_axes():
            nm = a.get('name', b''); nm = nm.decode() if isinstance(nm, bytes) else str(nm)
            if nm.lower().startswith('weight') or nm.lower() == 'wght':
                return list(range(int(a['minimum']), int(a['maximum']) + 1, 100))
        return [400]
    names = {'Thin':100,'ExtraLight':200,'Light':300,'Regular':400,'Medium':500,'SemiBold':600,'Bold':700,'ExtraBold':800,'Black':900}
    return sorted(names[f.rsplit('-', 1)[1][:-4]] for f in files if f.rsplit('-', 1)[1][:-4] in names)

def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
