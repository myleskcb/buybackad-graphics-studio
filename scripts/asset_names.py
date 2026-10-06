#!/usr/bin/env python3
"""WHAT EACH CUT-OUT IS, IN WORDS: assets/asset-names.json.

Owner, 2026-10-04: "on every model please have the name below and Phone in
general so I know that we're on the same page, with the assets/backgrounds".
One plain name per cut-out in assets/cutouts, from, in order:
  - assets/vehicles.json (scripts/vehicle_data.py) for the real vehicles;
  - motion/phones/index.json for the video maker's phones (view-*), with the side
    and the turn;
  - assets/devices.json for Apple's own product pictures (qs-*), model and colour;
  - the description each photograph was cut with (assets/cutouts/ATTRIBUTION.json);
  - otherwise the file name, in words.

  python3 scripts/asset_names.py         writes assets/asset-names.json
"""
import json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = lambda *p: os.path.join(ROOT, *p)

def load(p, d=None):
    return json.load(open(p)) if os.path.exists(p) else d

def names():
    veh = load(A('assets', 'vehicles.json'), {})
    motion = {m['id']: m for m in load(A('motion', 'phones', 'index.json'), {'phones': []})['phones']}
    dev = load(A('assets', 'devices.json'), {'models': {}})['models']
    att = load(A('assets', 'cutouts', 'ATTRIBUTION.json'), {})
    by_slug, by_art = {}, {}
    for m in dev.values():
        nm = m.get('name') or ''
        if m.get('art'): by_art[m['art']] = nm
        for c, v in (m.get('colours') or {}).items():
            by_slug[v['slug']] = f"{nm} · {c.replace('-', ' ').title()}"
    out = {}
    for f in sorted(os.listdir(A('assets', 'cutouts'))):
        if not f.endswith('.webp'): continue
        n = f[:-5]
        if n in veh:
            out[n] = veh[n]['label']; continue
        if n.startswith('view-'):
            ph, v = n[5:].split('--'); side, tag = v.split('-'); side, _, wall = side.partition('_')
            m = motion.get(ph, {})
            turn = 'flat' if tag == '0' else f"turned {tag[1:]}° {'left' if tag[0] == 'l' else 'right'}"
            what = 'back' if side == 'back' else f'screen, {wall} wallpaper'
            out[n] = f"{m.get('model', ph)} · {m.get('finish', '')} · {what}, {turn}"; continue
        if n in by_slug:
            out[n] = by_slug[n] + (' (back)' if '-back--' in n else ''); continue
        if n in by_art:
            out[n] = by_art[n]; continue
        note = (att.get(n) or {}).get('note', '')
        if note.startswith('cut from ') and '. ' in note:
            s = note.split('. ', 1)[1]
            s = re.sub(r'^(an?|the) ', '', s); out[n] = cap(s); continue
        w = re.sub(r'^(qs-sheet-|qs-device-|qs-|ph-|photo-)', '', n).replace('--', ' · ').replace('-', ' ')
        w = re.sub(r'\biphones?\b', lambda k: 'iP' + k.group(0)[2:], w); w = re.sub(r'\bpoke\b', 'Pokémon', w)
        w = re.sub(r'\b(psa|ngc|pcgs|dslr|vr)\b', lambda k: k.group(1).upper(), w); w = re.sub(r'\bipad\b', 'iPad', w)
        w = re.sub(r'\bimac\b', 'iMac', w); w = re.sub(r'\bmacbook\b', 'MacBook', w)
        w = re.sub(r'\bairpods\b', 'AirPods', w); w = re.sub(r'\bhomepod\b', 'HomePod', w)
        w = re.sub(r'\bmba\b', 'MacBook Air', w); w = re.sub(r'\bmbp\b', 'MacBook Pro', w)
        w = re.sub(r'\b(m\d)\b', lambda k: k.group(1).upper(), w)
        w = re.sub(r'\b(pro|max|plus|air|ultra|mini|studio)\b', lambda k: k.group(1).title() if k.group(1) != 'mini' else 'mini', w)
        out[n] = cap(w)
    return out

def cap(s):
    return s if re.match(r'i[A-Z]', s) else s[:1].upper() + s[1:]

if __name__ == '__main__':
    out = names()
    json.dump(out, open(A('assets', 'asset-names.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{len(out)} names -> assets/asset-names.json')
