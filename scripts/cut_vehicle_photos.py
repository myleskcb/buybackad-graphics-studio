#!/usr/bin/env python3
"""REAL VEHICLES (AND APPLE DEVICES), CUT FROM COMMONS PHOTOGRAPHS.

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
(doors open, people round it). 2026-10-03: cut and then dropped, a 1969
Charger (driver at the wheel), a Silverado HD (arm out of the window) and an
Escalade (price sticker on the windscreen, the photographer in the paint).

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
    # 2026-10-03, round two ("MORE"): popular, top trims, Teslas, trucks, vans, semis
    'car-toyota-highlander-silver': dict(src='popular-toyota-highlander-3.jpg', floor=None, plates=[],
        subject='a silver Toyota Highlander (XU70, 2022), front three-quarter, no plate'),
    'car-tesla-model-3-white': dict(src='popular-tesla-model-3-4.jpg', floor=None, plates=[[270, 795, 630, 935]],
        subject='a white Tesla Model 3 (2023 Highland), front three-quarter'),
    'car-tesla-model-y-white': dict(src='popular-tesla-model-y-6.jpg', floor=None, plates=[],
        subject='a white Tesla Model Y (2025 Juniper) in a Tesla store, front three-quarter, no plate'),
    'car-jeep-wrangler-rubicon-lime': dict(src='popular-jeep-wrangler-2.jpg', floor=None, plates=[[190, 655, 392, 750], [1085, 640, 1365, 695]],
        subject='a lime Jeep Wrangler Rubicon 4xe (JL), front three-quarter; dealer lettering on the door blurred'),
    'car-nissan-rogue-copper': dict(src='popular-nissan-rogue-1.jpg', floor=None, plates=[],
        subject='a copper Nissan Rogue / X-Trail (T33), front three-quarter, no plate'),
    'car-chevy-tahoe-black': dict(src='popular-chevrolet-tahoe-4.jpg', floor=None, plates=[[1270, 920, 1550, 1022]],
        subject='a black Chevrolet Tahoe (2015-20), front three-quarter'),
    'car-ford-explorer-white': dict(src='popular-ford-explorer-3.jpg', floor=None, plates=[[190, 665, 405, 762]],
        subject='a white Ford Explorer (sixth generation) PHEV, front three-quarter'),
    'car-honda-accord-white': dict(src='popular-honda-accord-tenth-generation-6.jpg', floor=None, plates=[[100, 800, 400, 980]],
        subject='a white Honda Accord (tenth generation), front three-quarter'),
    'car-ford-bronco-blue': dict(src='popular-ford-bronco-3.jpg', floor=None, plates=[],
        subject='a blue Ford Bronco (sixth generation) four-door at a show, front three-quarter, show plate only'),
    'car-dodge-charger-orange': dict(src='popular-dodge-charger-3.jpg', floor=None, plates=[[1312, 888, 1562, 976]],
        subject='an orange Dodge Charger (LD) Scat Pack, front three-quarter'),
    'car-porsche-911-gt3-blue': dict(src='popular-porsche-911-3.jpg', floor=None, plates=[],
        subject='a blue Porsche 911 GT3 Touring (991.2) at a show, front three-quarter, show plate only'),
    'car-porsche-911-carrera-rs-orange': dict(src='popular-porsche-911-5.jpg', floor=None, plates=[[1452, 832, 1676, 916]],
        subject='an orange Porsche 911 Carrera RS 2.7 (1972-73), rear three-quarter'),
    'car-tesla-cybertruck': dict(src='popular-tesla-cybertruck-3.jpg', floor=None, plates=[],
        subject='a stainless Tesla Cybertruck Foundation Series (2024), front three-quarter, no plate'),
    'car-range-rover-blue': dict(src='popular-range-rover-1.jpg', floor=None, plates=[[210, 728, 396, 808]],
        subject='a dark blue Range Rover Autobiography (L405), front three-quarter'),
    'car-subaru-outback-white': dict(src='popular-subaru-outback-1.jpg', floor=None, plates=[],
        subject='a white Subaru Outback (BT) Wilderness, front three-quarter, dealer plate only'),
    'car-hyundai-tucson-white': dict(src='popular-hyundai-tucson-2.jpg', floor=None, plates=[[184, 682, 406, 768]],
        subject='a white Hyundai Tucson (NX4), front three-quarter'),
    'car-kia-telluride-grey': dict(src='popular-kia-telluride-1.jpg', floor=None, plates=[[148, 752, 366, 838]],
        subject='a grey Kia Telluride, front three-quarter'),
    'car-rolls-royce-cullinan-black': dict(src='popular-rolls-royce-cullinan-1.jpg', floor=None, plates=[[334, 1026, 446, 1088]],
        subject='a dark grey Rolls-Royce Cullinan, front three-quarter'),
    'car-mercedes-s-class-black': dict(src='popular-mercedes-benz-s-class-4.jpg', floor=None, plates=[[230, 590, 450, 656]],
        subject='a black Mercedes-Benz S-Class (W223), front three-quarter'),
    'car-toyota-tundra-trd-pro-blue': dict(src='trucks-toyota-tundra-5.jpg', floor=None, plates=[[1625, 915, 1715, 1035]],
        subject='a blue Toyota Tundra TRD Pro (2026) in a showroom, front three-quarter'),
    'car-ford-ranger-wildtrak-orange': dict(src='trucks-ford-ranger-1.jpg', floor=None, plates=[[190, 630, 410, 740]],
        subject='an orange Ford Ranger Wildtrak (P703), front three-quarter'),
    'car-ford-f250-black': dict(src='trucks-ford-super-duty-1.jpg', floor=None, plates=[[1604, 664, 1716, 760]],
        subject='a black Ford F-250 Super Duty (P558) crew cab, front three-quarter'),
    'car-nissan-nv200-white': dict(src='vans-nissan-nv200-3.jpg', floor=None, plates=[],
        subject='a white Nissan NV200 van, front three-quarter (its plate is already blank in the photograph)'),
    'car-ford-e350-white': dict(src='vans-ford-e-series-2.jpg', floor=None, plates=[[152, 772, 272, 888]],
        subject='a white 2008 Ford E-Series wagon, front three-quarter'),
    'car-volvo-vnl-blue': dict(src='semis-volvo-vnl-4.jpg', floor=None, plates=[[228, 1080, 300, 1172]],
        subject='a blue Volvo VNL 860 Globetrotter XL sleeper semi tractor, front three-quarter'),
    'car-peterbilt-579-red': dict(src='semis-peterbilt-579-1.jpg', floor=None, plates=[[1496, 1104, 1658, 1156]],
        subject='a red Peterbilt 579 sleeper semi tractor, front three-quarter'),
    # 2026-10-03, round three: top trims, G 63, Prius, Teslas, Rivian, more trucks, 2026 models,
    # collectibles, rare BMW and Porsche
    'car-toyota-prius-white': dict(src='popular-toyota-prius-1.jpg', floor=None, plates=[],
        subject='a white Toyota Prius Plug-in Hybrid (fifth generation), front three-quarter, dealer plate only'),
    'car-mercedes-amg-g63-black': dict(src='popular-mercedes-amg-g-63-1.jpg', floor=None, plates=[[1610, 720, 1810, 810]],
        subject='a matte black Mercedes-AMG G 63 (W463), front three-quarter'),
    'car-mercedes-amg-g63-yellow': dict(src='popular-mercedes-amg-g-63-3.jpg', floor=None, plates=[[1300, 935, 1620, 1035]],
        subject='a yellow Mercedes-AMG G 63 (W465, 2024), front three-quarter'),
    'car-toyota-gr-corolla-black': dict(src='popular-toyota-gr-corolla-3.jpg', floor=None, plates=[],
        subject='a black Toyota GR Corolla, front three-quarter, no front plate'),
    'car-honda-civic-type-r-fl5-white': dict(src='popular-honda-civic-type-r-fl5-1.jpg', floor=None, plates=[[285, 780, 525, 920]],
        subject='a white Honda Civic Type R (FL5, 2023-), front three-quarter'),
    'car-toyota-4runner-trd-pro-lime': dict(src='popular-toyota-4runner-trd-pro-3.jpg', floor=None, plates=[],
        subject='a lime Toyota 4Runner TRD Pro (N280), front three-quarter, no front plate'),
    'car-ford-mustang-dark-horse-blue': dict(src='popular-ford-mustang-dark-horse-3.jpg', floor=None, plates=[],
        subject='a blue Ford Mustang Dark Horse (S650), front three-quarter, show plate only'),
    'car-chevy-corvette-z06-yellow': dict(src='popular-chevrolet-corvette-z06-1.jpg', floor=None, plates=[[1730, 800, 1830, 900]],
        subject='a yellow Chevrolet Corvette Z06 (C7), front three-quarter'),
    'car-cadillac-escalade-v-white': dict(src='popular-cadillac-escalade-v-1.jpg', floor=None, plates=[],
        subject='a white Cadillac Escalade-V (2025), front three-quarter, no plate'),
    'car-bmw-m3-competition-green': dict(src='popular-bmw-m3-competition-g80-1.jpg', floor=None, plates=[[1470, 395, 1690, 495]],
        subject='an Isle of Man green BMW M3 Competition (G80), rear three-quarter'),
    'car-tesla-model-s-plaid-white': dict(src='popular-tesla-model-s-plaid-3.jpg', floor=None, plates=[],
        subject='a white Tesla Model S Plaid, front three-quarter, no front plate'),
    'car-tesla-model-x-silver': dict(src='popular-tesla-model-x-1.jpg', floor=None, plates=[[1480, 700, 1720, 790]],
        subject='a silver Tesla Model X, front three-quarter'),
    'car-audi-rs5-sportback-red': dict(src='popular-audi-rs-5-sportback-3.jpg', floor=None, plates=[[160, 650, 410, 780]],
        subject='a red Audi RS 5 Sportback (F5, facelift), front three-quarter; dealer plate blurred'),
    'car-lamborghini-urus-performante-yellow': dict(src='popular-lamborghini-urus-performante-2.jpg', floor=None, plates=[],
        subject='a yellow Lamborghini Urus Performante, front three-quarter, no front plate'),
    'car-porsche-911-gt3-rs-grey': dict(src='popular-porsche-911-gt3-3.jpg', floor=None, plates=[[350, 575, 660, 665]],
        subject='a grey Porsche 911 GT3 RS (992), rear three-quarter'),
    'car-hyundai-sonata-black': dict(src='popular-hyundai-sonata-2.jpg', floor=None, plates=[],
        subject='a black Hyundai Sonata (DN8, 2024 facelift), front three-quarter, plate already blank'),
    'car-mazda-cx5-blue': dict(src='popular-mazda-cx-5-3.jpg', floor=None, plates=[[210, 760, 510, 880]],
        subject='a deep blue Mazda CX-5 (KF, 2022 facelift), front three-quarter; dealer plate blurred'),
    'car-jeep-grand-cherokee-l-silver': dict(src='popular-jeep-grand-cherokee-3.jpg', floor=None, plates=[[190, 700, 440, 800]],
        subject='a silver Jeep Grand Cherokee L (WL), front three-quarter; dealer plate blurred'),
    'car-honda-pilot-white': dict(src='popular-honda-pilot-3.jpg', floor=None, plates=[],
        subject='a white Honda Pilot (third generation), front three-quarter, no front plate'),
    'car-toyota-sienna-white': dict(src='popular-toyota-sienna-3.jpg', floor=None, plates=[[210, 1010, 370, 1120]],
        subject='a white Toyota Sienna (XL40, 2021-) minivan, front three-quarter'),
    'car-chevy-equinox-white': dict(src='popular-chevrolet-equinox-3.jpg', floor=None, plates=[],
        subject='a white Chevrolet Equinox (third generation, 2022), front three-quarter, no front plate'),
    'car-lexus-rx-white': dict(src='popular-lexus-rx-1.jpg', floor=None, plates=[[1510, 660, 1770, 745]],
        subject='a white Lexus RX (fifth generation, 2023-), front three-quarter'),
    'car-mercedes-amg-gle63-silver': dict(src='popular-mercedes-benz-gle-1.jpg', floor=None, plates=[],
        subject='a silver Mercedes-AMG GLE 63 S (V167), front three-quarter, plate already removed'),
    'car-subaru-forester-silver': dict(src='popular-subaru-forester-1.jpg', floor=None, plates=[],
        subject='a silver Subaru Forester (sixth generation, 2025-), front three-quarter, model-name show plate'),
    'car-kia-k5-grey': dict(src='popular-kia-k5-2.jpg', floor=None, plates=[],
        subject='a grey Kia K5 (DL3, facelift), front three-quarter, plate already blank'),
    'car-ram-1500-trx-red': dict(src='trucks-ram-1500-trx-1.jpg', floor=None, plates=[],
        subject='a red Ram 1500 TRX crew cab pickup at a dealer, front three-quarter, no front plate'),
    'car-chevy-silverado-zr2-red': dict(src='trucks-chevrolet-silverado-zr2-1.jpg', floor=None, plates=[[1700, 740, 1800, 860]],
        subject='a red Chevrolet Silverado 1500 ZR2 (2022-) crew cab pickup, front three-quarter'),
    'car-gmc-sierra-denali-grey': dict(src='trucks-gmc-sierra-denali-2.jpg', floor=None, plates=[[115, 740, 300, 830]],
        subject='a grey GMC Sierra 1500 Denali (2016-18) crew cab pickup, front three-quarter'),
    'car-ford-f150-lightning-black': dict(src='trucks-ford-f-150-lightning-3.jpg', floor=None, plates=[[120, 710, 205, 810]],
        subject='a black Ford F-150 Lightning crew cab pickup, front three-quarter'),
    'car-ram-2500-power-wagon-white': dict(src='trucks-ram-2500-power-wagon-1.jpg', floor=None, plates=[],
        subject='a white Ram 2500 Power Wagon (2026) crew cab pickup, front three-quarter, no front plate'),
    'car-nissan-frontier-grey': dict(src='trucks-nissan-frontier-1.jpg', floor=None, plates=[[190, 810, 460, 930]],
        subject='a grey Nissan Frontier PRO-4X (D41, 2022-) crew cab pickup, front three-quarter; dealer plate blurred'),
    'car-jeep-gladiator-green': dict(src='trucks-jeep-gladiator-2.jpg', floor=None, plates=[[320, 625, 535, 710]],
        subject='a green Jeep Gladiator (JT) pickup, rear three-quarter'),
    'car-ford-maverick-red': dict(src='trucks-ford-maverick-1.jpg', floor=None, plates=[[130, 765, 330, 855]],
        subject='a red Ford Maverick Tremor pickup, front three-quarter'),
    'car-honda-ridgeline-white': dict(src='trucks-honda-ridgeline-1.jpg', floor=None, plates=[],
        subject='a white Honda Ridgeline (second generation) pickup, front three-quarter, no front plate'),
    'car-ford-f150-raptor-2026-black': dict(src='y2026-2026-ford-f-150-raptor-1.jpg', floor=None, plates=[[80, 740, 270, 890]],
        subject='a black Ford F-150 Raptor (2026) crew cab pickup with a roof rack, front three-quarter'),
    'car-toyota-supra-a80-silver': dict(src='collect-toyota-supra-a80-1.jpg', floor=None, plates=[],
        subject='a silver Toyota Supra (A80, 1993-2002), rear three-quarter, plate already blank'),
    'car-nissan-skyline-gtr-r34-blue': dict(src='collect-nissan-skyline-gt-r-r34-2.jpg', floor=None, plates=[[240, 715, 450, 835]],
        subject='a Bayside Blue Nissan Skyline GT-R (R34), front three-quarter'),
    'car-honda-nsx-na1-red': dict(src='collect-honda-nsx-na1-3.jpg', floor=None, plates=[],
        subject='a red Honda NSX (NA1, 1991) in a museum, front three-quarter, museum plate only'),
    'car-honda-s2000-silver': dict(src='collect-honda-s2000-1.jpg', floor=None, plates=[[1560, 630, 1780, 730]],
        subject='a silver Honda S2000 with a hard top, front three-quarter'),
    'car-toyota-land-cruiser-fj40-green': dict(src='collect-toyota-land-cruiser-fj40-2.jpg', floor=None, plates=[],
        subject='a green Toyota Land Cruiser FJ40 at a show, front three-quarter, show plate only'),
    'car-toyota-land-cruiser-80-red': dict(src='collect-toyota-land-cruiser-80-2.jpg', floor=None, plates=[[440, 720, 650, 810]],
        subject='a red Toyota Land Cruiser 80, front three-quarter'),
    'car-ford-bronco-1st-gen-cream': dict(src='collect-ford-bronco-first-generation-1.jpg', floor=None, plates=[],
        subject='a cream first-generation Ford Bronco (1966-77), front three-quarter, no front plate'),
    'car-chevy-camaro-1969-silver': dict(src='collect-chevrolet-camaro-1969-4.jpg', floor=None, plates=[],
        subject='a silver 1969 Chevrolet Camaro Z/28, front three-quarter, no front plate'),
    'car-land-rover-defender-90-teal': dict(src='collect-land-rover-defender-90-2.jpg', floor=None, plates=[[1235, 860, 1345, 910]],
        subject='a teal Land Rover Defender 90 station wagon, front three-quarter'),
    'car-mercedes-190e-evo-black': dict(src='collect-mercedes-benz-190-e-2-5-16-evolution-1.jpg', floor=None, plates=[[245, 805, 545, 935]],
        subject='a black Mercedes-Benz 190 E 2.5-16 Evolution, front three-quarter'),
    'car-bmw-m3-csl-e46-grey': dict(src='collect-bmw-m3-csl-e46-1.jpg', floor=None, plates=[[200, 730, 470, 870]],
        subject='a grey BMW M3 CSL (E46), front three-quarter'),
    'car-bmw-z8-silver': dict(src='collect-bmw-z8-2.jpg', floor=None, plates=[[310, 780, 640, 880]],
        subject='a silver BMW Z8 roadster, front three-quarter'),
    'car-bmw-2002-turbo-white': dict(src='collect-bmw-2002-turbo-1.jpg', floor=None, plates=[[310, 870, 560, 980]],
        subject='a white BMW 2002 turbo (1973-74), front three-quarter'),
    'car-bmw-3-0-csl-beige': dict(src='collect-bmw-3-0-csl-4.jpg', floor=None, plates=[],
        subject='a beige BMW 3.0 CSL (E9) at a show, side on, no plate'),
    'car-bmw-1m-coupe-orange': dict(src='collect-bmw-1-series-m-coupe-2.jpg', floor=None, plates=[[1480, 775, 1760, 890]],
        subject='a Valencia orange BMW 1 Series M Coupe, front three-quarter'),
    'car-porsche-911-gt2-rs-white': dict(src='collect-porsche-911-gt2-rs-4.jpg', floor=None, plates=[[175, 720, 430, 820]],
        subject='a white Porsche 911 GT2 RS (991) with Manthey kit, front three-quarter'),
    'car-porsche-918-spyder-white': dict(src='collect-porsche-918-spyder-3.jpg', floor=None, plates=[],
        subject='a white Porsche 918 Spyder, front three-quarter, no front plate'),
    'car-porsche-carrera-gt-silver': dict(src='collect-porsche-carrera-gt-3.jpg', floor=None, plates=[[1390, 1015, 1730, 1110]],
        subject='a silver Porsche Carrera GT, front three-quarter; dealer plate blurred'),
    'car-porsche-911-sport-classic-grey': dict(src='collect-porsche-911-sport-classic-3.jpg', floor=None, plates=[[1240, 670, 1430, 790]],
        subject='a grey Porsche 911 Sport Classic (992), rear three-quarter'),
    'car-porsche-356-blue': dict(src='collect-porsche-356-1.jpg', floor=None, plates=[[1440, 880, 1650, 980]],
        subject='a blue Porsche 356 cabriolet, front three-quarter'),
    'car-toyota-land-cruiser-2026-blue': dict(src='y2026-2026-toyota-land-cruiser-1.jpg', floor=None, plates=[],
        subject='a blue-grey Toyota Land Cruiser FJ (2026) at a show, front three-quarter, show plate only'),
    'car-jeep-wrangler-rubicon-2026-orange': dict(src='y2026-2026-jeep-wrangler-3.jpg', floor=None, plates=[],
        subject='an orange Jeep Wrangler Rubicon (2024-26), front three-quarter, no front plate'),
    'car-jeep-grand-wagoneer-white': dict(src='y2026-2026-jeep-grand-wagoneer-1.jpg', floor=None, plates=[],
        subject='a white Jeep Grand Wagoneer L (2026), front three-quarter, no front plate'),
    'car-lamborghini-temerario-yellow': dict(src='y2026-2026-lamborghini-temerario-2.jpg', floor=None, plates=[],
        subject='a yellow Lamborghini Temerario (2026), front three-quarter, no front plate'),
    'car-toyota-gr-supra-2026-red': dict(src='y2026-2026-toyota-gr-supra-2.jpg', floor=None, plates=[],
        subject='a matte red Toyota GR Supra (2026) on a showroom floor, front three-quarter, no plate'),
    'car-toyota-prius-2026-grey': dict(src='y2026-2026-toyota-prius-3.jpg', floor=None, plates=[[250, 780, 360, 930]],
        subject='a grey Toyota Prius (2026) on a showroom floor, front three-quarter; dealer plate blurred'),
    'car-kia-k4-white': dict(src='y2026-2026-kia-k4-1.jpg', floor=None, plates=[[170, 740, 400, 830]],
        subject='a white Kia K4 hatchback (2026), front three-quarter; dealer plate blurred'),
    'car-hyundai-ioniq-9-white': dict(src='y2026-2026-hyundai-ioniq-9-1.jpg', floor=None, plates=[[175, 800, 385, 880]],
        subject='a white Hyundai Ioniq 9 (2026), front three-quarter'),
    'car-rivian-r1s-silver': dict(src='y2026-rivian-r1s-2.jpg', floor=None, plates=[[225, 895, 365, 1000]],
        subject='a silver Rivian R1S, front three-quarter'),
    'car-rivian-r2-green': dict(src='y2026-rivian-r2-1.jpg', floor=None, plates=[],
        subject='a green Rivian R2, front three-quarter, no front plate'),
    'car-tesla-cybertruck-cyberbeast': dict(src='y2026-tesla-cybertruck-cyberbeast-1.jpg', floor=None, plates=[[100, 850, 330, 920]],
        subject='a stainless Tesla Cybertruck Cyberbeast, rear three-quarter'),
    # 2026-10-03 (owner: "As much modern apple imagery as you can"): photographs of
    # the devices we buy, from Commons, for the angles the storefront art lacks
    'photo-iphone-13-pro-graphite': dict(src='apple-iphone-13-pro-2.jpg', floor=None, plates=[],
        subject='an iPhone 13 Pro and 13 Pro Max in graphite, back and screen, on a dark cloth'),
    'photo-iphone-14-pro-deep-purple': dict(src='apple-iphone-14-pro-1.jpg', floor=None, plates=[],
        subject='an iPhone 14 Pro in Deep Purple, back'),
    'photo-iphone-14-red': dict(src='apple-iphone-14-1.jpg', floor=None, plates=[],
        subject='an iPhone 14 (PRODUCT)RED, back'),
    'photo-iphone-15-black': dict(src='apple-iphone-15-1.jpg', floor=None, plates=[],
        subject='an iPhone 15 in black, back, flat'),
    'photo-iphone-17-pro-silver': dict(src='apple-iphone-17-pro-1.jpg', floor=None, plates=[],
        subject='an iPhone 17 Pro in silver, back, at an angle'),
    'photo-iphone-17-pro-max-cosmic-orange': dict(src='apple-iphone-17-pro-4.jpg', floor=2665, plates=[],
        subject='an iPhone 17 Pro Max in Cosmic Orange, back, in a clear store cradle (its rod cut off)'),
    'photo-iphone-17-pro-max-deep-blue': dict(src='apple-iphone-17-pro-max-1.jpg', floor=2600, plates=[],
        subject='an iPhone 17 Pro Max in Deep Blue, back, in a clear store cradle (its rod cut off)'),
    'photo-ipad-a16-pink': dict(src='apple-ipad-a16-4.jpg', floor=None, plates=[],
        subject='an iPad (A16) in pink, back'),
    'photo-ipad-air-m2-blue': dict(src='apple-ipad-air-m2-4.jpg', floor=None, plates=[],
        subject='an iPad Air 11-inch (M2) in blue, back'),
    'photo-ipad-mini-6-blue': dict(src='apple-ipad-mini-6-4.jpg', floor=None, plates=[],
        subject='an iPad mini 6 in blue, back'),
    'photo-mac-mini-m4-top': dict(src='apple-imac-m4-1.jpg', floor=None, plates=[],
        subject='a Mac mini (M4, 2024), front three-quarter from above, logo on top'),
    'photo-mac-mini-m4-angle': dict(src='apple-mac-mini-m4-2.jpg', floor=None, plates=[],
        subject='a Mac mini (M4, 2024), three-quarter from above'),
    'photo-mac-studio-angle': dict(src='apple-mac-studio-4.jpg', floor=None, plates=[],
        subject='a Mac Studio (2022), front three-quarter from above, logo on top'),
    'photo-macbook-air-15-midnight': dict(src='apple-macbook-air-15-inch-1.jpg', floor=None, plates=[],
        subject='a MacBook Air 15-inch in Midnight, open, three-quarter'),
    'photo-macbook-air-15-starlight': dict(src='apple-macbook-air-15-inch-3.jpg', floor=None, plates=[],
        subject='a MacBook Air 15-inch in Starlight, open, three-quarter'),
    'photo-macbook-air-m1-silver': dict(src='apple-macbook-air-m1-2.jpg', floor=None, plates=[],
        subject='a MacBook Air (M1) in silver, open, three-quarter, screen off'),
    'photo-macbook-air-m1-space-gray': dict(src='apple-macbook-air-m1-3.jpg', floor=None, plates=[],
        subject='a MacBook Air (M1) in space gray, open, from the front, screen off'),
    'photo-macbook-air-m1-big-sur': dict(src='apple-macbook-air-m1-4.jpg', floor=None, plates=[],
        subject='a MacBook Air (M1) in space gray, open, Big Sur on screen'),
    'photo-macbook-air-m2-starlight': dict(src='apple-macbook-air-m2-1.jpg', floor=None, plates=[],
        subject='a MacBook Air (M2) in Starlight, open, three-quarter'),
    'photo-macbook-air-m2-lid': dict(src='apple-macbook-air-m2-4.jpg', floor=None, plates=[],
        subject='a MacBook Air (M2) closed, lid and logo from above'),
    'photo-macbook-air-m4-silver': dict(src='apple-macbook-air-m4-1.jpg', floor=None, plates=[],
        subject='a MacBook Air 13-inch (M4) in silver, open, three-quarter'),
    # 2026-10-03 (owner: "more alternate angles as much as you can"): rear and side views
    'car-bmw-m3-touring-blue-rear': dict(src='angles-bmw-m3-rear-1.jpg', floor=None, plates=[[1395, 455, 1670, 545]],
        subject='a blue BMW M3 Touring (G81), rear three-quarter'),
    'car-bmw-x5-black-rear': dict(src='angles-bmw-x5-rear-1.jpg', floor=None, plates=[[355, 725, 545, 820]],
        subject='a black BMW X5 (G05), rear three-quarter'),
    'car-cadillac-escalade-black-rear': dict(src='angles-cadillac-escalade-rear-1.jpg', floor=None, plates=[[1390, 555, 1535, 665]],
        subject='a black Cadillac Escalade (fifth generation), rear three-quarter'),
    'car-chevy-equinox-white-rear': dict(src='angles-chevrolet-equinox-rear-2.jpg', floor=None, plates=[[1455, 510, 1680, 635]],
        subject='a white Chevrolet Equinox (third generation), rear three-quarter; dealer plate blurred'),
    'car-ford-bronco-sport-yellow-rear': dict(src='angles-ford-bronco-rear-3.jpg', floor=None, plates=[[1510, 825, 1680, 965]],
        subject='a yellow Ford Bronco Sport, rear three-quarter'),
    'car-ford-f150-raptor-orange-rear': dict(src='angles-ford-f-150-raptor-rear-1.jpg', floor=None, plates=[[440, 785, 605, 885]],
        subject='an orange Ford F-150 Raptor (third generation), rear three-quarter'),
    'car-ford-f150-black-rear': dict(src='angles-ford-f-150-rear-3.jpg', floor=None, plates=[[255, 595, 385, 700]],
        subject='a black Ford F-150 FX4 (thirteenth generation), rear three-quarter'),
    'car-ford-mustang-mach1-grey-rear': dict(src='angles-ford-mustang-rear-1.jpg', floor=None, plates=[[350, 640, 680, 755]],
        subject='a grey Ford Mustang Mach 1 (S550), rear three-quarter'),
    'car-ford-mustang-gt-yellow-rear': dict(src='angles-ford-mustang-rear-2.jpg', floor=None, plates=[[195, 585, 495, 715]],
        subject='a yellow Ford Mustang GT (S550), rear three-quarter'),
    'car-ford-ranger-blue-rear': dict(src='angles-ford-ranger-rear-1.jpg', floor=None, plates=[[1550, 625, 1655, 725]],
        subject='a blue Ford Ranger Limited (P703) double cab, rear three-quarter'),
    'car-ford-transit-custom-silver-rear': dict(src='angles-ford-transit-rear-2.jpg', floor=None, plates=[[1440, 620, 1640, 710]],
        subject='a silver Ford Transit Custom (second generation) panel van, rear three-quarter'),
    'car-ford-e-transit-custom-white-rear': dict(src='angles-ford-transit-rear-3.jpg', floor=None, plates=[[155, 680, 370, 780]],
        subject='a white Ford E-Transit Custom (second generation), rear three-quarter'),
    'car-gmc-sierra-ev-grey-rear': dict(src='angles-gmc-sierra-rear-1.jpg', floor=None, plates=[],
        subject='a grey GMC Sierra EV Denali pickup, rear three-quarter, no plate'),
    'car-honda-accord-white-rear': dict(src='angles-honda-accord-rear-1.jpg', floor=None, plates=[],
        subject='a white Honda Accord (tenth generation), rear three-quarter, plate already blank'),
    'car-honda-accord-2023-white-side': dict(src='angles-honda-accord-side-view-3.jpg', floor=None, plates=[],
        subject='a white Honda Accord (eleventh generation, 2023-), side on'),
    'car-honda-crv-red-rear': dict(src='angles-honda-cr-v-rear-1.jpg', floor=None, plates=[[205, 545, 340, 650]],
        subject='a red Honda CR-V (sixth generation, 2023-), rear three-quarter; dealer plate blurred'),
    'car-honda-pilot-white-rear': dict(src='angles-honda-pilot-rear-2.jpg', floor=None, plates=[[1725, 360, 1825, 470]],
        subject='a white Honda Pilot (second generation), rear three-quarter'),
    'car-honda-ridgeline-grey-rear': dict(src='angles-honda-ridgeline-rear-2.jpg', floor=None, plates=[[1465, 645, 1640, 770]],
        subject='a grey Honda Ridgeline (second generation) pickup, rear three-quarter; dealer plate blurred'),
    'car-hyundai-ioniq5-grey-rear': dict(src='angles-hyundai-ioniq-5-rear-1.jpg', floor=None, plates=[[1485, 600, 1715, 700]],
        subject='a grey Hyundai Ioniq 5 (facelift), rear three-quarter'),
    'car-hyundai-ioniq5-silver-side': dict(src='angles-hyundai-ioniq-5-side-view-1.jpg', floor=None, plates=[[1590, 930, 1710, 1005]],
        subject='a silver Hyundai Ioniq 5, front three-quarter, side on'),
    'car-hyundai-tucson-l-white-rear': dict(src='angles-hyundai-tucson-rear-2.jpg', floor=None, plates=[[385, 425, 615, 545]],
        subject='a white Hyundai Tucson L (NX4, long wheelbase), rear three-quarter'),
    'car-jeep-gladiator-rubicon-red-side': dict(src='angles-jeep-gladiator-side-view-1.jpg', floor=None, plates=[],
        subject='a red Jeep Gladiator Rubicon (JT) pickup, side on, no plate in view'),
    'car-kia-k5-silver-rear': dict(src='angles-kia-k5-rear-1.jpg', floor=None, plates=[[1680, 605, 1795, 700]],
        subject='a silver Kia K5 (DL3), rear three-quarter; dealer plate blurred'),
    'car-kia-telluride-2026-silver-rear': dict(src='angles-kia-telluride-rear-1.jpg', floor=None, plates=[[170, 610, 320, 705]],
        subject='a silver Kia Telluride (second generation, 2026), rear three-quarter; dealer plate blurred'),
    'car-lexus-rx-grey-rear': dict(src='angles-lexus-rx-rear-2.jpg', floor=None, plates=[[225, 500, 490, 595]],
        subject='a grey Lexus RX 350h (fifth generation), rear three-quarter'),
    'car-lexus-rx-white-rear': dict(src='angles-lexus-rx-rear-3.jpg', floor=None, plates=[[205, 470, 440, 590]],
        subject='a white Lexus RX 500h (fifth generation), rear three-quarter'),
    'car-ram-1500-black-rear': dict(src='angles-ram-1500-rear-1.jpg', floor=None, plates=[[405, 635, 555, 760]],
        subject='a black Ram 1500 (2025) crew cab pickup, rear three-quarter; dealer plate blurred'),
    'car-rivian-r1s-grey-rear': dict(src='angles-rivian-r1s-rear-1.jpg', floor=None, plates=[[200, 630, 350, 750]],
        subject='a grey Rivian R1S, rear three-quarter'),
    'car-rivian-r1t-white-rear': dict(src='angles-rivian-r1t-rear-1.jpg', floor=None, plates=[[300, 640, 430, 740]],
        subject='a white Rivian R1T pickup, rear three-quarter'),
    'car-rivian-r1t-green-rear': dict(src='angles-rivian-r1t-rear-2.jpg', floor=None, plates=[[1600, 740, 1730, 850], [1400, 735, 1500, 820]],
        subject='a green Rivian R1T pickup with a roof rack, rear three-quarter'),
    'car-subaru-outback-red-rear': dict(src='angles-subaru-outback-rear-2.jpg', floor=None, plates=[[195, 485, 330, 610]],
        subject='a red Subaru Outback (BT), rear three-quarter; dealer plate blurred'),
    'car-tesla-cybertruck-rear-night': dict(src='angles-tesla-cybertruck-rear-1.jpg', floor=None, plates=[[540, 805, 695, 885]],
        subject='a stainless Tesla Cybertruck at night, rear three-quarter'),
    'car-tesla-cybertruck-rear-street': dict(src='angles-tesla-cybertruck-rear-2.jpg', floor=None, plates=[[345, 540, 470, 635]],
        subject='a stainless Tesla Cybertruck, rear three-quarter'),
    'car-tesla-model-3-performance-white-rear': dict(src='angles-tesla-model-3-rear-3.jpg', floor=None, plates=[[265, 585, 470, 720]],
        subject='a white Tesla Model 3 Performance (Highland) in a showroom, rear three-quarter'),
    'car-tesla-model-x-white-rear': dict(src='angles-tesla-model-x-rear-1.jpg', floor=None, plates=[[1550, 370, 1690, 480]],
        subject='a white Tesla Model X, rear three-quarter'),
    'car-tesla-model-y-red-side': dict(src='angles-tesla-model-y-side-view-1.jpg', floor=None, plates=[],
        subject='a red Tesla Model Y (Juniper), side on, no plate in view'),
    'car-toyota-camry-2025-white-side': dict(src='angles-toyota-camry-side-view-2.jpg', floor=None, plates=[],
        subject='a white Toyota Camry (XV80, 2025-), side on'),
    'car-toyota-corolla-cross-silver-rear': dict(src='angles-toyota-corolla-rear-1.jpg', floor=None, plates=[[230, 465, 480, 575]],
        subject='a silver Toyota Corolla Cross Hybrid, rear three-quarter'),
    'car-toyota-gr-supra-grey-rear': dict(src='angles-toyota-gr-supra-rear-1.jpg', floor=None, plates=[[340, 515, 650, 665]],
        subject='a grey Toyota GR Supra (A90) in a showroom, rear three-quarter; dealer plate blurred'),
    'car-toyota-highlander-white-rear': dict(src='angles-toyota-highlander-rear-2.jpg', floor=None, plates=[],
        subject='a white Toyota Highlander (XU70), rear three-quarter, plate already blank'),
    'car-toyota-highlander-silver-rear': dict(src='angles-toyota-highlander-rear-3.jpg', floor=None, plates=[[1490, 435, 1620, 545]],
        subject='a silver Toyota Highlander (XU70), rear three-quarter; dealer plate blurred'),
    'car-toyota-prius-silver-rear': dict(src='angles-toyota-prius-rear-1.jpg', floor=None, plates=[[180, 705, 325, 825]],
        subject='a silver Toyota Prius (fifth generation), rear three-quarter; dealer plate blurred'),
    'car-toyota-prius-grey-rear': dict(src='angles-toyota-prius-rear-2.jpg', floor=None, plates=[[1440, 875, 1585, 995]],
        subject='a grey Toyota Prius XLE (fifth generation), rear three-quarter; dealer plate blurred'),
    'car-toyota-rav4-2026-grey-rear': dict(src='angles-toyota-rav4-rear-2.jpg', floor=None, plates=[],
        subject='a grey Toyota RAV4 PHEV (sixth generation, 2026) at a show, rear three-quarter, show plate only'),
    'car-toyota-rav4-2026-white-rear': dict(src='angles-toyota-rav4-rear-3.jpg', floor=None, plates=[],
        subject='a white Toyota RAV4 PHEV (sixth generation, 2026) at a show, rear three-quarter, show plate only'),
    'car-toyota-tacoma-trd-black-rear': dict(src='angles-toyota-tacoma-rear-2.jpg', floor=None, plates=[],
        subject='a black Toyota Tacoma TRD Off-Road (N400, 2024-), rear three-quarter, plate already blank'),
    'car-toyota-tundra-trd-pro-white-rear': dict(src='angles-toyota-tundra-rear-1.jpg', floor=None, plates=[],
        subject='a white Toyota Tundra TRD Pro build with spare tyres in the bed, at a show, rear three-quarter, show plate only'),
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
