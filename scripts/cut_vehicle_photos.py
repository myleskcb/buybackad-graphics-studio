#!/usr/bin/env python3
"""REAL VEHICLES, CUT FROM THE COMMONS PHOTOGRAPHS WE ALREADY HAVE.

The owner, 2026-10-02, on the car backdrops: "more popular cars and less
bikes", "some trucks and work vans", "semis". The car cut-outs in
assets/cutouts until now were renders of no real model (a sedan with a made-up
badge, a pickup and a van with none). assets/bg-web already holds Wikimedia
Commons photographs of real ones, freely licensed and credited in
assets/bg-web/ATTRIBUTION.json (scripts/fetch_backdrops.mjs). This cuts the
vehicle out of each one named in SPEC:

  - the vehicle is segmented (rembg, BiRefNet) and only it is kept:
    the biggest part of the mask, plus anything touching it that is big;
  - below `floor` (the tyres' contact line) nothing is kept, so no grass or
    pavement comes with it;
  - the edge is cleaned of the old background's colour (unmixed against the
    background around it, as scripts/ingest_assets.py does for a flat one);
  - each licence plate (and its dealer frame) in `plates` is blurred past
    reading; boxes set by eye on the 1920px photograph;
  - checked as ingest_assets.check_cutout checks a packshot: whole (not cut
    off by the frame, DESIGN-LAW 79), and big enough.

Landed in assets/cutouts/<id>.webp and credited in
assets/cutouts/ATTRIBUTION.json (licence, artist, Commons page) like
poke-psa-charizard. Not added to assets/approved-assets.json: that is the
owner's own pass.

Chosen by eye, 2026-10-02: left out are the brown F-150 and the 1977
Silverado (people in the cab), the 1956 Chevy (a classic, not a popular car),
the F-250 (a flag on a pole in the bed) and the Transit Courier at the show
(doors open, people round it).

  python3 scripts/cut_vehicle_photos.py            dry run: .render/vehicles/_review.jpg
  python3 scripts/cut_vehicle_photos.py --write    land them

needs: pip install pillow numpy opencv-python-headless "rembg[cpu]"
       (the model, about 1 GB, is fetched from github.com/danielgatis/rembg on first use)
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from ingest_assets import check_cutout   # noqa: E402

WEB = os.path.join(ROOT, 'assets', 'bg-web')
CUT = os.path.join(ROOT, 'assets', 'cutouts')
REVIEW = os.path.join(ROOT, '.render', 'vehicles')
WRITE = '--write' in sys.argv

# id: source photograph, what it is, plates [x0, y0, x1, y1], floor (y below
# which nothing is kept; None keeps the mask as it is)
SPEC = {
    'car-ford-f150-black': dict(src='trucks-ford-f-150-3.jpg', floor=None, plates=[],
        subject='a black Ford F-150 (fourteenth generation, 2021-), SuperCrew pickup, rear three-quarter'),
    'car-chevy-silverado-red': dict(src='trucks-chevrolet-silverado-pickup-1.jpg', floor=None, plates=[[1488, 968, 1598, 1072]],
        subject='a red Chevrolet C10 Silverado pickup (1981-87 square body), front three-quarter'),
    'car-ford-transit-connect-white': dict(src='vans-ford-transit-van-2.jpg', floor=None, plates=[[186, 836, 462, 940]],
        subject='a white Ford Transit Connect work van (third generation), front three-quarter'),
    'car-ford-transit-courier-white': dict(src='vans-ford-transit-van-3.jpg', floor=None, plates=[[1282, 818, 1558, 942]],
        subject='a white Ford Transit Courier work van (second generation), rear three-quarter'),
    'car-ldv-maxus-van-white': dict(src='vans-cargo-van-1.jpg', floor=None, plates=[],
        subject='a white LDV Maxus panel van, front three-quarter (its plate is already blank in the photograph)'),
    'car-harley-softail-black': dict(src='bikes-harley-davidson-motorcycle-1.jpg', floor=None, plates=[],
        subject='a black Harley-Davidson Softail Springer motorcycle, side on'),
    # 2026-10-03, from the popular / trucks / vans / semis fetch
    'car-toyota-camry-silver': dict(src='popular-toyota-camry-5.jpg', floor=None, plates=[[1598, 524, 1745, 616]],
        subject='a silver Toyota Camry (XV70, 2018-) sedan, front three-quarter'),
    'car-toyota-corolla-white': dict(src='popular-toyota-corolla-3.jpg', floor=None, plates=[[272, 450, 438, 530]],
        subject='a white Toyota Corolla (E170, 2014-19) sedan, rear three-quarter'),
    'car-honda-civic-white': dict(src='popular-honda-civic-6.jpg', floor=None, plates=[[1382, 744, 1684, 854]],
        subject='a white Honda Civic (eleventh generation, 2022-) hatchback, front three-quarter'),
    'car-honda-civic-type-r-blue': dict(src='popular-honda-civic-type-r-2.jpg', floor=None, plates=[[1492, 670, 1672, 760]],
        subject='a blue Honda Civic Type R (FK8, 2017-21), front three-quarter'),
    'car-honda-crv-silver': dict(src='popular-honda-cr-v-1.jpg', floor=None, plates=[],
        subject='a silver Honda CR-V (fifth generation, 2017-22) in a showroom, front three-quarter, no plate'),
    'car-toyota-rav4-white': dict(src='popular-toyota-rav4-2.jpg', floor=None, plates=[],
        subject='a white Toyota RAV4 Hybrid (XA50, 2019-) with a black roof, front three-quarter, show plate only'),
    'car-toyota-4runner-green': dict(src='popular-toyota-4runner-4.jpg', floor=None, plates=[],
        subject='an Army Green Toyota 4Runner TRD Pro (N280), front three-quarter, no plate'),
    'car-mercedes-g-class-orange': dict(src='popular-mercedes-benz-g-class-3.jpg', floor=None, plates=[[146, 822, 360, 920]],
        subject='a matte orange Mercedes-Benz G-Class (W463, 2018-) Professional Line, front three-quarter'),
    'car-bmw-m3-blue': dict(src='popular-bmw-m3-3.jpg', floor=None, plates=[[240, 744, 524, 844]],
        subject='a blue BMW M3 CS (F80) sedan, front three-quarter'),
    'car-lamborghini-urus-green': dict(src='popular-lamborghini-urus-2.jpg', floor=None, plates=[[210, 770, 470, 864]],
        subject='a green Lamborghini Urus SE (2024-), front three-quarter'),
    'car-bentley-bentayga-grey': dict(src='popular-bentley-bentayga-5.jpg', floor=None, plates=[[1566, 676, 1764, 766]],
        subject='a grey-blue Bentley Bentayga Azure (facelift, 2021-), front three-quarter'),
    'car-audi-s5-white': dict(src='popular-audi-s5-5.jpg', floor=None, plates=[[276, 446, 378, 522]],
        subject='a white Audi S5 Sportback (F5), front three-quarter'),
    'car-lexus-is-white': dict(src='popular-lexus-is-5.jpg', floor=None, plates=[[296, 716, 456, 832]],
        subject='a white Lexus IS 300 AWD (2021) sedan, front three-quarter'),
    'car-toyota-tacoma-orange': dict(src='trucks-toyota-tacoma-6.jpg', floor=None, plates=[[1524, 834, 1726, 938]],
        subject='an orange Toyota Tacoma TRD Off Road (N400, 2024-) double cab pickup, front three-quarter'),
    'car-ram-1500-blue': dict(src='trucks-ram-1500-3.jpg', floor=None, plates=[[1240, 962, 1474, 1044]],
        subject='a blue Ram 1500 crew cab pickup, front three-quarter'),
    'car-ram-promaster-grey': dict(src='vans-ram-promaster-4.jpg', floor=None, plates=[[1684, 836, 1784, 934]],
        subject='a grey 2014 Ram ProMaster 1500 Tradesman low-roof work van, front three-quarter'),
    'car-mercedes-sprinter-white': dict(src='vans-mercedes-benz-sprinter-2.jpg', floor=None, plates=[],
        subject='a white Mercedes-Benz Sprinter 4x4 tipper (chassis cab, 2023-) at a show, front three-quarter, show plate only'),
    'car-peterbilt-389-white': dict(src='semis-peterbilt-389-4.jpg', floor=None, plates=[[454, 1004, 580, 1080], [585, 1058, 636, 1104]],
        subject='a white Peterbilt 389 day-cab semi tractor, front three-quarter'),
    'car-freightliner-cascadia-blue': dict(src='semis-freightliner-cascadia-4.jpg', floor=None, plates=[],
        subject='a blue Freightliner Cascadia (second generation) sleeper semi tractor, front three-quarter, no front plate'),
}

MODEL = 'birefnet-general'   # cleaner than isnet-general-use on wheels, mirrors and grilles (checked side by side, 2026-10-02)

def mask_of(src):
    """the model's mask, cached in .render/vehicles; each photograph in its own
    process, since BiRefNet on the CPU does not give its memory back"""
    p = os.path.join(REVIEW, 'mask-' + os.path.splitext(src)[0] + '.png')
    if not os.path.exists(p):
        import subprocess
        subprocess.run([sys.executable, os.path.abspath(__file__), '--mask', os.path.join(WEB, src), p], check=True)
    return np.asarray(Image.open(p).convert('L'), np.float32) / 255

def one_mask(src, out):
    from rembg import new_session, remove
    remove(Image.open(src).convert('RGB'), session=new_session(MODEL), only_mask=True).save(out)

def keep_vehicle(a):
    """the biggest part of the mask and whatever big part touches it"""
    fg = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n <= 1: return a
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    keep = (lab == big).astype(np.uint8)
    for i in range(1, n):
        if i != big and st[i, cv2.CC_STAT_AREA] > 0.02 * st[big, cv2.CC_STAT_AREA]:
            near = cv2.dilate(keep, np.ones((9, 9), np.uint8)) & (lab == i).astype(np.uint8)
            if near.any(): keep |= (lab == i).astype(np.uint8)
    keep = cv2.dilate(keep, np.ones((5, 5), np.uint8))
    out = a * keep
    out[out < 0.04] = 0
    return out

def unmix(rgb, a):
    """take the old background's colour out of the soft edge"""
    w = (1 - a)[..., None]
    k = (0, 0)
    num = cv2.GaussianBlur(rgb * w, k, 9)
    den = cv2.GaussianBlur(w, k, 9)
    den = den[..., None] if den.ndim == 2 else den
    bg = num / np.maximum(den, 1e-3)
    a3 = a[..., None]
    col = np.where(a3 > 0.04, (rgb - (1 - a3) * bg) / np.maximum(a3, 0.04), rgb)
    edge = (a3 > 0) & (a3 < 0.98)
    return np.where(edge, np.clip(col, 0, 255), rgb)

def blur_plate(img, box):
    x0, y0, x1, y1 = box
    reg = img.crop(box)
    r = max(6, (x1 - x0) // 9)
    reg = reg.resize((max(1, (x1 - x0) // 14), max(1, (y1 - y0) // 14)), Image.BILINEAR).resize(reg.size, Image.BILINEAR)
    reg = reg.filter(ImageFilter.GaussianBlur(r))
    m = Image.new('L', reg.size, 0); ImageDraw.Draw(m).rounded_rectangle([2, 2, reg.width - 3, reg.height - 3], radius=10, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(4))
    img.paste(reg, box[:2], m)

def cut(rid, s):
    im = Image.open(os.path.join(WEB, s['src'])).convert('RGB')
    for b in s['plates']: blur_plate(im, b)
    a = mask_of(s['src'])
    if s['floor'] is not None: a[s['floor']:] = 0
    a = keep_vehicle(a)
    rgb = unmix(np.asarray(im, np.float32), a)
    rgba = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA')
    return check_cutout(rgba)

def review(rows, path):
    T = 360
    sheet = Image.new('RGB', (2 * (T * 2 + 20), ((len(rows) + 1) // 2) * (T + 40)), 'white'); d = ImageDraw.Draw(sheet)
    for i, (rid, img, fails, warns) in enumerate(rows):
        x, y = (i % 2) * (T * 2 + 20), (i // 2) * (T + 40)
        t = img.copy(); t.thumbnail((T, T))
        for j, bgc in enumerate(((236, 236, 236), (28, 30, 36))):
            tile = Image.new('RGBA', (T, T), bgc + (255,)); tile.alpha_composite(t, ((T - t.width) // 2, (T - t.height) // 2))
            sheet.paste(tile.convert('RGB'), (x + j * T, y))
        d.text((x + 4, y + T + 4), rid + '  ' + ('REFUSED: ' + '; '.join(fails) if fails else 'ok ' + '; '.join(warns)), fill=(170, 20, 20) if fails else (20, 110, 40))
    sheet.save(path, quality=88)

def main():
    web = {a['file']: a for a in json.load(open(os.path.join(WEB, 'ATTRIBUTION.json')))}
    os.makedirs(REVIEW, exist_ok=True)
    rows = []
    for rid, s in SPEC.items():
        img, fails, warns = cut(rid, s)
        if s['src'] not in web: fails.append(s['src'] + ' has no credit in assets/bg-web/ATTRIBUTION.json')
        rows.append((rid, img, fails, warns))
        img.save(os.path.join(REVIEW, rid + '.png'))
        print(f"{rid:34s} {img.width}x{img.height}  " + ('REFUSED ' + '; '.join(fails) if fails else 'ok ' + '; '.join(warns)))
    review(rows, os.path.join(REVIEW, '_review.jpg'))
    print('review sheet: ' + os.path.join(REVIEW, '_review.jpg'))
    if not WRITE: print('(dry run; pass --write to land the ones marked ok)'); return
    att_p = os.path.join(CUT, 'ATTRIBUTION.json'); att = json.load(open(att_p))
    n = 0
    for rid, img, fails, _ in rows:
        if fails: continue
        img.save(os.path.join(CUT, rid + '.webp'), 'WEBP', quality=90, method=6)
        w = web[SPEC[rid]['src']]
        att[rid] = dict(license=w['license'], artist=w['artist'], page=w['page'],
                        note='cut from assets/bg-web/' + SPEC[rid]['src'] + ' by scripts/cut_vehicle_photos.py'
                             + ('; licence plate blurred' if SPEC[rid]['plates'] else '') + '. ' + SPEC[rid]['subject'])
        n += 1
    json.dump(att, open(att_p, 'w'), ensure_ascii=False, indent=2)
    print(f'landed {n} in assets/cutouts, credited in assets/cutouts/ATTRIBUTION.json')

if __name__ == '__main__':
    if '--mask' in sys.argv:
        i = sys.argv.index('--mask'); one_mask(sys.argv[i + 1], sys.argv[i + 2])
    else:
        main()
