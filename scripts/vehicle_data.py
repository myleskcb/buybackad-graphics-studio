#!/usr/bin/env python3
"""WHAT EACH REAL VEHICLE IS: assets/vehicles.json.

Owner, 2026-10-04: "Cars need to be classified by their model specifically ...
have the name below", "classify it by brand ... by years and classified
vintage", "Luxury, economy". For every vehicle cut-out (car-*) this records
brand, model, the model years of its generation, colour (as photographed and as
a family, for matching a front with a rear), the view, the body, the class and
the era, read from the description each was cut with
(scripts/cut_vehicle_photos.py SPEC subject) and, where that gives no year, from
the generation's model years in YEARS below (US model years).

  python3 scripts/vehicle_data.py         writes assets/vehicles.json
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import cut_vehicle_photos as cvp   # noqa: E402

# model years of the generation shown, where the description names none
YEARS = {
    'audi-rs5-sportback-red': (2020, 2024), 'audi-s5-white': (2018, 2024), 'bmw-1m-coupe-orange': (2011, 2012),
    'bmw-3-0-csl-beige': (1972, 1975), 'bmw-m3-blue': (2018, 2018), 'bmw-m3-competition-green': (2021, None),
    'bmw-m3-csl-e46-grey': (2003, 2004), 'bmw-m3-touring-blue-rear': (2022, None), 'bmw-x5-black-rear': (2019, None),
    'bmw-z8-silver': (2000, 2003), 'cadillac-escalade-black-rear': (2021, None),
    'chevy-corvette-z06-yellow': (2015, 2019), 'chevy-equinox-white-rear': (2018, 2024),
    'dodge-charger-orange': (2015, 2023), 'ford-bronco-blue': (2021, None), 'ford-bronco-sport-yellow-rear': (2021, None),
    'ford-e-transit-custom-white-rear': (2024, None), 'ford-explorer-white': (2020, None),
    'ford-f150-black-rear': (2015, 2020), 'ford-f150-lightning-black': (2022, None),
    'ford-f150-raptor-orange-rear': (2021, None), 'ford-f250-black': (2023, None), 'ford-maverick-red': (2022, None),
    'ford-mustang-dark-horse-blue': (2024, None), 'ford-mustang-gt-yellow-rear': (2015, 2023),
    'ford-mustang-mach1-grey-rear': (2021, 2023), 'ford-ranger-blue-rear': (2023, None),
    'ford-ranger-wildtrak-orange': (2023, None), 'ford-transit-connect-white': (2022, None),
    'ford-transit-courier-white': (2024, None), 'ford-transit-custom-silver-rear': (2024, None),
    'freightliner-cascadia-blue': (2017, None), 'gmc-sierra-ev-grey-rear': (2024, None),
    'harley-softail-black': (1988, 2006), 'honda-accord-white': (2018, 2022), 'honda-accord-white-rear': (2018, 2022),
    'honda-pilot-white': (2016, 2022), 'honda-pilot-white-rear': (2009, 2015), 'honda-ridgeline-grey-rear': (2017, None),
    'honda-ridgeline-white': (2017, None), 'hyundai-ioniq5-grey-rear': (2025, None),
    'hyundai-ioniq5-silver-side': (2022, None), 'hyundai-tucson-l-white-rear': (2022, None),
    'hyundai-tucson-white': (2022, None), 'jeep-gladiator-green': (2020, None),
    'jeep-gladiator-rubicon-red-side': (2020, None), 'jeep-grand-cherokee-l-silver': (2021, None),
    'jeep-wrangler-rubicon-lime': (2021, None), 'kia-k5-grey': (2025, None), 'kia-k5-silver-rear': (2021, 2024),
    'kia-telluride-grey': (2020, 2026), 'land-rover-defender-90-teal': (1983, 2016), 'ldv-maxus-van-white': (2005, 2017),
    'lexus-rx-grey-rear': (2023, None), 'lexus-rx-white-rear': (2023, None), 'mercedes-190e-evo-black': (1989, 1990),
    'mercedes-amg-g63-black': (2019, 2024), 'mercedes-amg-gle63-silver': (2021, None),
    'mercedes-s-class-black': (2021, None), 'nissan-nv200-white': (2010, 2021), 'nissan-rogue-copper': (2021, None),
    'nissan-skyline-gtr-r34-blue': (1999, 2002), 'peterbilt-389-white': (2007, None), 'peterbilt-579-red': (2013, None),
    'porsche-356-blue': (1950, 1965), 'porsche-911-gt2-rs-white': (2018, 2019), 'porsche-911-gt3-blue': (2018, 2019),
    'porsche-911-sport-classic-grey': (2023, None), 'porsche-918-spyder-white': (2014, 2015),
    'porsche-carrera-gt-silver': (2004, 2006), 'ram-1500-blue': (2019, None), 'range-rover-blue': (2013, 2021),
    'rivian-r1s-grey-rear': (2022, None), 'rivian-r1s-silver': (2022, None), 'rivian-r1t-green-rear': (2022, None),
    'rivian-r1t-white-rear': (2022, None), 'rolls-royce-cullinan-black': (2019, None),
    'subaru-outback-red-rear': (2020, None), 'subaru-outback-white': (2022, None),
    'tesla-cybertruck-cyberbeast': (2024, None), 'tesla-cybertruck-rear-street': (2024, None),
    'tesla-model-3-performance-white-rear': (2024, None), 'tesla-model-s-plaid-white': (2021, None),
    'tesla-model-x-silver': (2016, None), 'tesla-model-x-white-rear': (2016, None), 'tesla-model-y-red-side': (2025, None),
    'toyota-4runner-green': (2025, None), 'toyota-4runner-trd-pro-lime': (2025, None),
    'toyota-corolla-cross-silver-rear': (2022, None), 'toyota-gr-corolla-black': (2023, None),
    'toyota-gr-supra-grey-rear': (2020, 2026), 'toyota-highlander-silver-rear': (2020, None),
    'toyota-highlander-white-rear': (2020, None), 'toyota-land-cruiser-80-red': (1991, 1997),
    'toyota-land-cruiser-fj40-green': (1960, 1984), 'toyota-prius-grey-rear': (2023, None),
    'toyota-prius-silver-rear': (2023, None), 'toyota-prius-white': (2023, None),
    'toyota-tundra-trd-pro-white-rear': (2022, None), 'volvo-vnl-blue': (2018, None), 'audi-r8-v10-blue': (2016, 2023),
    'bentley-continental-gt-red-rear': (2018, 2024), 'bmw-5-series-grey': (2017, 2023), 'bmw-i4-white-rear': (2022, None),
    'bmw-m4-convertible-black': (2022, None), 'bmw-x7-m50i-white': (2019, 2022), 'buick-enclave-grey': (2018, 2024),
    'buick-enclave-grey-rear': (2018, 2024), 'chevy-camaro-yellow': (2010, 2015), 'chevy-camaro-yellow-rear': (2010, 2015),
    'chevy-corvette-c8-red': (2020, None), 'ferrari-296-gtb-yellow': (2022, None),
    'ferrari-296-gtb-yellow-rear': (2022, None), 'ferrari-296-gts-grey': (2023, None),
    'ferrari-f8-spider-magenta-rear': (2020, 2023), 'ferrari-f8-tributo-red-rear': (2020, 2023),
    'ferrari-roma-white': (2020, None), 'ford-bronco-sport-badlands-blue': (2021, None),
    'ford-bronco-sport-badlands-red': (2021, None), 'ford-bronco-sport-black-rear': (2021, None),
    'ford-bronco-sport-heritage-blue': (2021, None), 'ford-mustang-mach-e-rally-lime': (2024, None),
    'genesis-gv80-grey': (2021, None), 'honda-civic-sedan-blue-rear': (2022, None),
    'honda-civic-type-r-fk8-blue-rear': (2017, 2021), 'honda-hrv-beige': (2023, None), 'honda-hrv-red-rear': (2023, None),
    'hyundai-kona-n-white': (2022, 2023), 'hyundai-kona-n-white-rear': (2022, 2023), 'hyundai-palisade-white': (2020, 2025),
    'infiniti-qx60-bronze': (2022, None), 'jeep-wrangler-2door-black-rear': (2018, None),
    'jeep-wrangler-sahara-red': (2018, None), 'kia-ev6-gt-black': (2023, None), 'kia-ev6-gt-black-rear': (2023, None),
    'kia-ev9-silver': (2024, None), 'kia-soul-green': (2020, None), 'kia-sportage-black': (2023, None),
    'lamborghini-aventador-roadster-blue-rear': (2018, 2021), 'lamborghini-aventador-s-red': (2017, 2021),
    'lamborghini-aventador-ultimae-orange': (2022, 2022), 'lamborghini-huracan-tecnica-blue': (2023, 2024),
    'lamborghini-huracan-tecnica-blue-rear': (2023, 2024), 'lexus-es-white': (2019, None),
    'lexus-es-white-rear': (2019, None), 'lexus-nx-silver-rear': (2022, None), 'lincoln-aviator-black': (2020, None),
    'lincoln-aviator-black-rear': (2020, None), 'lucid-air-white': (2022, None), 'lucid-air-white-rear': (2022, None),
    'maserati-mc20-cielo-rear': (2023, None), 'maserati-mc20-white': (2022, None), 'mazda-cx90-blue': (2024, None),
    'mazda3-hatch-silver-rear': (2019, None), 'mazda3-hatch-white': (2019, None), 'mclaren-720s-grey': (2018, 2023),
    'mclaren-720s-silver': (2018, 2023), 'mercedes-amg-g63-4x4-blue-rear': (2022, 2023),
    'mercedes-amg-g63-cabriolet-blue': (2019, 2024), 'mercedes-amg-g63-silver-rear': (2019, 2024),
    'mercedes-amg-gt-black-series-orange': (2021, 2021), 'mercedes-amg-gt63-4door-white': (2023, None),
    'mercedes-c-class-all-terrain-white': (2022, None), 'mercedes-glc-blue': (2016, 2022),
    'nissan-altima-silver-rear': (2019, None), 'nissan-gtr-r35-white': (2009, 2024),
    'nissan-pathfinder-rock-creek-rear': (2023, None), 'nissan-titan-xd-silver': (2016, 2019),
    'polestar-2-grey': (2021, None), 'polestar-2-white': (2021, None), 'porsche-cayenne-gts-coupe-white-rear': (2020, None),
    'porsche-cayenne-gts-white-rear': (2021, None), 'porsche-panamera-gts-chalk': (2019, 2023),
    'porsche-panamera-turbo-bronze': (2024, None), 'porsche-panamera-turbo-chalk-rear': (2017, 2023),
    'porsche-taycan-gts-sport-turismo-rear': (2022, None), 'ram-1500-limited-grey': (2019, None),
    'ram-1500-rebel-black': (2019, None), 'ram-trx-red': (2021, 2024), 'rolls-royce-ghost-purple-side': (2021, None),
    'subaru-crosstrek-wilderness-blue': (2024, None), 'subaru-crosstrek-wilderness-blue-rear': (2024, None),
    'subaru-wrx-blue': (2022, None), 'tesla-model-y-black-side': (2020, 2024), 'tesla-model-y-blue': (2020, 2024),
    'toyota-4runner-limited-black': (2010, 2024), 'toyota-gr86-blue': (2022, None), 'toyota-highlander-black': (2020, None),
    'toyota-highlander-blue': (2020, None), 'toyota-highlander-red': (2020, None),
    'toyota-rav4-phev-red-rear': (2021, 2025), 'toyota-tacoma-trd-black': (2016, 2023),
    'toyota-tacoma-trd-offroad-black': (2016, 2023), 'toyota-tacoma-trd-offroad-red': (2016, 2023),
    'toyota-tundra-1794-black': (2014, 2021), 'toyota-tundra-trd-pro-orange-rear': (2022, None),
    'toyota-venza-silver': (2021, 2024), 'toyota-venza-silver-rear': (2021, 2024), 'volvo-xc90-silver-rear': (2016, None),
    'vw-golf-gti-clubsport-grey': (2021, None), 'vw-golf-gti-tcr-white-rear': (2019, 2020),
    'vw-golf-mk1-white-rear': (1974, 1983), 'vw-id5-gtx-silver': (2022, None), 'vw-jetta-gli-grey': (2019, None),
    'chevy-corvette-c3-grey-rear': (1968, 1982), 'jeep-wagoneer-classic-red': (1963, 1991),
    'jeep-wagoneer-classic-red-rear': (1963, 1991), 'mercedes-w114-classic-cream': (1968, 1976),
    'mini-classic-cream': (1959, 2000), 'honda-s2000-silver': (2000, 2009), 'lexus-lx-black': (2016, 2021),
}

BRANDS = ['Aston Martin', 'Harley-Davidson', 'Land Rover', 'Range Rover', 'Rolls-Royce', 'Mercedes-AMG',
          'Mercedes-Benz', 'Acura', 'Audi', 'Bentley', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge',
          'Ferrari', 'Ford', 'Freightliner', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
          'Lamborghini', 'LDV', 'Lexus', 'Lincoln', 'Lucid', 'Maserati', 'Mazda', 'McLaren', 'Mini', 'Nissan',
          'Peterbilt', 'Polestar', 'Porsche', 'Ram', 'Rivian', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo']
BRAND_OF = {'Mercedes-AMG': 'Mercedes-Benz', 'Range Rover': 'Land Rover'}
EXOTIC = {'Ferrari', 'Lamborghini', 'McLaren', 'Rolls-Royce', 'Bentley', 'Aston Martin', 'Maserati'}
LUXURY = {'Acura', 'Audi', 'BMW', 'Cadillac', 'Genesis', 'Infiniti', 'Land Rover', 'Lexus', 'Lincoln', 'Lucid',
          'Mercedes-Benz', 'Polestar', 'Porsche', 'Rivian', 'Volvo'}
SUV = ('RAV4', 'CR-V', 'Highlander', '4Runner', 'Tahoe', 'Suburban', 'Explorer', 'Bronco', 'Wrangler', 'Range Rover',
       'Defender', 'Q5', 'Q7', 'X3', 'X5', 'X7', 'iX3', 'GLE', 'GLC', 'G-Class', 'G 63', 'Cayenne', 'Macan', 'Urus',
       'Bentayga', 'Cullinan', 'Escalade', 'Yukon', 'Telluride', 'Palisade', 'Santa Fe', 'Tucson', 'Kona', 'Sportage',
       'Sorento', 'EV9', 'Ioniq 5', 'Ioniq 9', 'Model X', 'Model Y', 'R1S', 'Navigator', 'Aviator', 'QX60', 'RDX',
       'Enclave', 'Equinox', 'Pilot', 'Passport', 'HR-V', 'Atlas', 'Tiguan', 'ID.5', 'XC60', 'XC90', 'CX-5', 'CX-90',
       'Forester', 'Crosstrek', 'Compass', 'Grand Cherokee', 'Wagoneer', 'Rogue', 'Pathfinder', 'Venza',
       'Corolla Cross', 'Land Cruiser', 'NX', 'RX', 'LX', 'Durango', 'GV80', 'Soul', 'Outback')
MINIVAN = ('Sienna', 'Pacifica')
COLOUR = [('solar octane', 'orange'), ('magenta', 'pink'), ('teal', 'green'), ('lime', 'green'), ('chalk', 'white'),
          ('stainless', 'silver'), ('cream', 'beige'), ('sand', 'beige'), ('beige', 'beige'), ('bronze', 'bronze'),
          ('copper', 'bronze'), ('purple', 'purple'), ('pink', 'pink'), ('red', 'red'), ('orange', 'orange'),
          ('yellow', 'yellow'), ('green', 'green'), ('blue-grey', 'grey'), ('grey-blue', 'grey'), ('blue', 'blue'),
          ('white', 'white'), ('black', 'black'), ('grey', 'grey'), ('gray', 'grey'), ('silver', 'silver')]
YR = re.compile(r'((?:19|20)\d\d)s?(?:\s*[-–]\s*((?:19|20)?\d\d)s?)?')

def parse(rid, subj, kind):
    key = rid[4:]
    s = re.sub(r'^(an?|the) ', '', subj)
    bi = min(((s.find(b + ' '), b) for b in BRANDS if s.find(b + ' ') >= 0), default=(-1, None))
    pos, b = bi
    if b is None and 'Mazda3' in s:                 # the one name written as one word
        pos, b = s.find('Mazda3'), 'Mazda'; s = s.replace('Mazda3', 'Mazda Mazda3', 1)
    colour = s[:pos].strip() if pos > 0 else ''
    colour = re.sub(r'\b(first-generation|classic|\d{4})\b', '', colour).strip()
    rest = s[pos + len(b) + 1:] if b else s
    model = re.split(r' \(|, | at a | in a | on a | with | from ', rest)[0].strip()
    code = re.match(r'\(([A-Z0-9]{2,6}\d?)[,)]', rest[len(model):].strip())
    brand = BRAND_OF.get(b, b)
    if b == 'Mercedes-AMG': model = 'AMG ' + model
    if b == 'Range Rover': model = 'Range Rover ' + model if model else 'Range Rover'
    if rid == 'car-mini-classic-cream': brand, model = 'Mini', '(classic, Morris Mini-Minor)'
    model = re.sub(r'( low-roof)?( work| panel)? van$| (day-cab |sleeper )?semi tractor$| motorcycle$', '', model)
    model = re.sub(r' (pickup|sedan|hatchback|coupe|minivan|roadster|crew cab|double cab|SuperCrew)$', '', model)
    if code and code.group(1) not in model: model += ' ' + code.group(1)
    model = re.sub(r' (19|20)\d\d$', '', model)               # the year has its own field
    m = YR.search(s)
    if key in YEARS: y0, y1 = YEARS[key]
    elif m:
        y0 = int(m.group(1)); e = m.group(2)
        y1 = (int(e) if len(e) == 4 else int(str(y0)[:2] + e)) if e else (y0 if re.search(r'\(\D*' + m.group(1) + r'\)', s)
                                                                       or ' ' + m.group(1) + ' ' in s[:pos + 1] else None)
        if '%ss' % m.group(1) in s: y1 = y0 + 9
    else:
        y0 = y1 = None
    fam = next((f for w, f in COLOUR if w in colour.lower()), 'other')
    view = 'rear' if rid.endswith('-rear') or 'rear three-quarter' in subj else \
        'side' if rid.endswith('-side') or 'side on' in subj or 'side three-quarter' in subj else 'front'
    body = {'truck': 'Pickup', 'van': 'Van', 'semi': 'Semi truck', 'bike': 'Motorcycle'}.get(kind)
    if not body:
        body = 'Minivan' if any(w in model for w in MINIVAN) else \
            'SUV' if any(re.search(r'(^|\s)' + re.escape(w) + r'(\s|$)', model) for w in SUV) else 'Car'
    if body in ('Van', 'Semi truck'): klass = 'Commercial'
    elif brand in EXOTIC or any(w in model for w in ('918', 'Carrera GT', 'R8', 'Black Series')): klass = 'Exotic'
    elif brand in LUXURY or 'Denali' in model or 'Grand Wagoneer' in model or \
            (brand == 'Tesla' and any(w in model for w in ('Model S', 'Model X', 'Cybertruck'))): klass = 'Luxury'
    else: klass = 'Economy'
    era = None if y0 is None else 'Vintage' if y0 < 1996 else '1996-2009' if y0 < 2010 else \
        '2010s' if y0 < 2020 else '2020s'
    years = '' if y0 is None else str(y0) if y1 == y0 else f'{y0}-{y1 or ""}'.rstrip('-') + ('' if y1 else '–')
    years = years.replace('-', '–') if y1 and y1 != y0 else years
    name = model if model.startswith(brand) else f'{brand} {model}'
    return dict(brand=brand, model=model, name=name, years=years, year_from=y0, year_to=y1, colour=colour,
                colour_family=fam, view=view, body=body, kind=kind, **{'class': klass}, era=era,
                vintage=bool(y0 and y0 < 1996), label=f'{name}' + (f' ({years})' if years else '') + f' · {colour} · {view}')

def main():
    sys.argv = [sys.argv[0]]
    import gen_backdrops as g
    kinds = {}
    for n in g.POOLS['cars']:
        if n['kind'] != 'car': continue
        kinds[n['name']] = 'car'
    k2 = {}
    p = os.path.join(ROOT, 'scripts', 'vehicle_kinds.json')
    if os.path.exists(p): k2 = json.load(open(p))
    out = {}
    for rid in kinds:
        out[rid] = parse(rid, cvp.SPEC[rid]['subject'], k2.get(rid, 'car'))
    json.dump(out, open(os.path.join(ROOT, 'assets', 'vehicles.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(out)} vehicles -> assets/vehicles.json')

if __name__ == '__main__':
    main()
