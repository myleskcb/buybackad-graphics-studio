"""Fetch the offer cards' typefaces (the 20 locked pairings' faces) from the
Google Fonts repository into OFFER_FONTS, and write index.json (family ->
files). Static weights and variable files as the repository ships them."""
import urllib.request, urllib.parse, re, os, json
from common import GF
FAMS = {
 # reading faces
 'Manrope': 'manrope', 'Inter': 'inter', 'Libre Franklin': 'librefranklin', 'DM Mono': 'dmmono',
 'Instrument Sans': 'instrumentsans', 'IBM Plex Mono': 'ibmplexmono', 'Space Grotesk': 'spacegrotesk',
 'Zilla Slab': 'zillaslab', 'Chivo': 'chivo',
 # display faces
 'Cormorant Garamond': 'cormorantgaramond', 'Sora': 'sora', 'DM Serif Display': 'dmserifdisplay',
 'Archivo Black': 'archivoblack', 'Oswald': 'oswald', 'Saira Condensed': 'sairacondensed',
 'Instrument Serif': 'instrumentserif', 'Roboto Slab': 'robotoslab', 'Khand': 'khand', 'Teko': 'teko',
 'Anton': 'anton', 'Syne': 'syne', 'Barlow Condensed': 'barlowcondensed', 'Bungee': 'bungee',
 'Big Shoulders Display': 'bigshouldersdisplay', 'Shrikhand': 'shrikhand', 'Nunito': 'nunito',
}
os.makedirs(GF, exist_ok=True)
got = {}
for fam, d in FAMS.items():
    meta = base = None
    for lic in ('ofl', 'apache', 'ufl'):
        try:
            base = f'https://raw.githubusercontent.com/google/fonts/main/{lic}/{d}/'
            meta = urllib.request.urlopen(base + 'METADATA.pb', timeout=20).read().decode(); break
        except Exception:
            continue
    if not meta:
        print('missing', fam); continue
    got[fam] = []
    for fn in sorted(set(re.findall(r'filename:\s*"([^"]+)"', meta))):
        if 'Italic' in fn: continue
        path = fn.replace('[', '_').replace(']', '_').replace(',', '_')
        if not os.path.exists(GF + '/' + path):
            open(GF + '/' + path, 'wb').write(urllib.request.urlopen(base + urllib.parse.quote(fn), timeout=60).read())
        got[fam].append(path)
    print(fam, got[fam])
json.dump(got, open(GF + '/index.json', 'w'), indent=1)
